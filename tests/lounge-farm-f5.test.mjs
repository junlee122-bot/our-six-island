// 우리 농장 F5 (handover/design/design-our-farm.md §8 F5, §10-4, §11, §12):
// crop balance (regrowing crops, a flower for every season and its honey,
// 상추), the 품평회 score, the 양식장 (stocking, growth, requests, output, roe
// in the jar, the medium pond, the talents, the four-a-day rule), the 품종
// 개량소 and improved seeds, the 서리 덮개 (winter quarter), field stage 4 and
// its layout, and the bounded read of the new state.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CROP_INFO, CROPS, LIFE_REJECT, LifeError, emptyLife, ensureLifeMember, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { INITIAL_BEOM, grantBeom, kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { hash32, seasonOfDay } from '../app/lounge-calendar.ts';
import { LEVEL_XP } from '../app/lounge-growth-data.ts';
import {
  CROP_CAT,
  FROST_COVER_RECIPE,
  GRID_TILES,
  IMPROVED_GIANT_MULT,
  IMPROVED_GOLD_PTS,
  NEW_CROP_IDS,
  SEEDLAB_INPUT,
  SEEDLAB_MS,
  bedTiles,
  fairPoints,
  frostTiles,
  tileBed,
  tileRC,
} from '../app/lounge-farm-data.ts';
import { FACILITY_BY_ID } from '../app/lounge-farm-sites-data.ts';
import { SITE_REJECT, readFarmCommons } from '../app/lounge-farm-sites.ts';
import { POND_GROW_DAYS, POND_MAX, POND_REJECT, POND_START_CAP, ROE_ITEMS, pondFishOk } from '../app/lounge-farm-pond-data.ts';
import { pondCap, pondWant } from '../app/lounge-farm-pond.ts';
import { LAB_REJECT } from '../app/lounge-farm-seedlab.ts';
import { fairScore, giantBed, goodsById } from '../app/lounge-farm.ts';
import { FISH_BY_ID } from '../app/lounge-items.ts';
import { FARM_EXPAND_LEVEL, FARM_EXPAND_PRICE, demandMult } from '../app/lounge-life-plus.ts';
import { FARM_FIELDS, FARM_HOUSES, FARM_LANE_Z, FARM_PAVING, FARM_W, fieldCellCenter, isMasterField, masterSign } from '../app/lounge-farm-layout.ts';
import { FARM_SITES, personalSites } from '../app/lounge-farm-sites-layout.ts';
import { yardSpots } from '../app/lounge-farm-soil.ts';
import { tillField } from './farm-test-help.mjs';

const uuid = () => crypto.randomUUID();
const MIN = 60_000,
  HOUR = 3_600_000,
  DAY = 86_400_000;
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
// 2026-10-12 … 18 summer, 19 … 25 autumn, 26 … 11-01 winter.
const SUMMER = kst(2026, 10, 13, 10);
const AUTUMN = kst(2026, 10, 21, 10);
const WINTER = kst(2026, 10, 27, 10);

function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  const reserved = Object.values(ledger.games)
    .filter((g) => g.state === 'reserved')
    .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
  assert.equal(balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0), Object.keys(ledger.accounts).length * INITIAL_BEOM);
}
function world(n = 1) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
    tillField(life, m.id);
  }
  const s = { members, ledger, life };
  s.act = (m, action, now) => {
    const r = lifeAction(s.life, s.ledger, m, action, now);
    s.life = r.life;
    s.ledger = r.ledger;
    invariant(s.ledger);
    return r;
  };
  s.fails = (m, action, now, message) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || e.message === message),
      message,
    );
  s.balance = (m) => s.ledger.accounts['wallet-' + m.id];
  s.fund = (m, amount) => {
    s.ledger = grantBeom(s.ledger, 'wallet-' + m.id, amount, 'test-' + uuid(), SUMMER, 'test');
  };
  s.view = (m, now) => lifeView(s.life, m.id, m.actor, now);
  s.give = (m, item, n) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + n;
  };
  s.inv = (m, item) => s.life.ext?.[m.id]?.inv?.[item] ?? 0;
  s.level = (m, skill, lv) => {
    const u = (((s.life.growth ??= {}).u ??= {})[m.id] ??= {});
    (u.xp ??= {})[skill] = LEVEL_XP[lv - 1];
  };
  s.mats = (m, mats) => {
    for (const [id, n] of Object.entries(mats)) s.give(m, id, n);
  };
  /** Builds a personal facility on `site` (level, 범 and materials given first). */
  s.build = (m, site, facility, now) => {
    const def = FACILITY_BY_ID[facility];
    s.level(m, def.unlock.skill, def.unlock.level);
    s.fund(m, def.build.beom);
    s.mats(m, def.build.mats);
    s.act(m, { kind: 'siteBuild', site, facility }, now);
  };
  return s;
}

// ------------------------------------------------------------ crop balance
test('crop balance: more regrowing crops, a flower for every season, a cheaper 상추 payback; every new crop in the band', () => {
  const regrow = CROPS.filter((c) => CROP_INFO[c].regrow);
  assert.ok(regrow.length >= 13, regrow.join());
  for (const c of ['zinnia', 'chamoe', 'perilla']) assert.ok(CROP_INFO[c].regrow, c);
  // A flower crop for every season, so bee houses can make flower honey all year.
  const flowers = CROPS.filter((c) => CROP_CAT[c] === 'flower');
  for (const season of ['spring', 'summer', 'autumn', 'winter'])
    assert.ok(flowers.some((c) => CROP_INFO[c].seasons?.includes(season)), season);
  for (const f of ['rapeseed', 'lavender', 'buckwheat', 'narcissus']) {
    assert.equal(CROP_CAT[f], 'flower');
    assert.equal(goodsById()[`honey-${f}`].base, 400 + 2 * CROP_INFO[f].sell);
  }
  assert.equal(goodsById()['honey-rapeseed'].name, '유채꿀');
  assert.equal(goodsById()['honey-buckwheat'].name, '메밀꿀');
  assert.equal(goodsById()['dry-lavender'].name, '라벤더차');
  // 상추: what one seed gives back over all its harvests (was 4.75× its price).
  const lettuce = CROP_INFO.lettuce;
  const payback = (lettuce.sell * lettuce.regrow.harvests) / lettuce.seed;
  assert.ok(payback < 3, String(payback));
  // Every crop after the original ten: 1,800–5,500 범 an hour on six watered tiles.
  for (const c of NEW_CROP_IDS) {
    const info = CROP_INFO[c],
      k = info.regrow?.harvests ?? 1,
      hours = (info.growMs + (k - 1) * (info.regrow?.ms ?? 0)) / HOUR;
    const perHour = (6 * (k * info.sell - info.seed)) / hours;
    assert.ok(perHour >= 1_800 && perHour <= 5_500, `${c} ${Math.round(perHour)}`);
  }
});

test('품평회 score: stars first, then √price (capped), + in season, + hand-made', () => {
  assert.deepEqual([0, 1, 2, 3].map((q) => fairPoints(0, q)), [100, 200, 350, 500]);
  assert.equal(fairPoints(2_500, 0), 300);
  assert.equal(fairPoints(10_000, 0), 500);
  assert.equal(fairPoints(1_000_000, 0), 500);
  // A gold strawberry beats a plain 인삼, a 별빛 carrot beats a plain 인삼주.
  assert.ok(fairScore('strawberry', 2, AUTUMN) > fairScore('insam', 0, AUTUMN));
  assert.ok(fairScore('carrot', 3, AUTUMN) > fairScore('keg-insam', 0, AUTUMN));
  // Within one item, quality always wins; a seasonal crop gets its bonus only in season.
  for (const id of ['carrot', 'insam', 'jar-strawberry']) for (const q of [1, 2, 3]) assert.ok(fairScore(id, q, AUTUMN) > fairScore(id, q - 1, AUTUMN));
  assert.equal(fairScore('sweetpotato', 0, AUTUMN) - fairScore('sweetpotato', 0, SUMMER) >= 50, true);
});

// ------------------------------------------------------------ 양식장
test('양식장: 낚시 Lv5, stocked with one caught fish (no legends, no offshore), grows every few days to its cap', () => {
  const s = world(1),
    [m] = s.members;
  s.level(m, 'fish', 4);
  s.fund(m, 200_000);
  s.mats(m, FACILITY_BY_ID.fishPond.build.mats);
  s.fails(m, { kind: 'siteBuild', site: 'Q0', facility: 'fishPond' }, SUMMER, '낚시 Lv5부터 지을 수 있어요.');
  s.level(m, 'fish', 5);
  s.act(m, { kind: 'siteBuild', site: 'Q0', facility: 'fishPond' }, SUMMER);
  // The second personal site leaves the first one free (an orchard can stand beside the pond).
  assert.equal(s.life.farm.sites.P0, undefined);
  s.fails(m, { kind: 'pondCollect', site: 'Q0' }, SUMMER, POND_REJECT.notStocked);
  assert.equal(pondFishOk(FISH_BY_ID.goldcarp), false);
  assert.equal(pondFishOk(FISH_BY_ID.bluefin), false);
  assert.equal(pondFishOk(FISH_BY_ID.carp), true);
  s.give(m, 'goldcarp', 1);
  s.give(m, 'bluefin', 1);
  s.fails(m, { kind: 'pondStock', site: 'Q0', fish: 'goldcarp' }, SUMMER, POND_REJECT.fish);
  s.fails(m, { kind: 'pondStock', site: 'Q0', fish: 'bluefin' }, SUMMER, POND_REJECT.fish);
  s.fails(m, { kind: 'pondStock', site: 'Q0', fish: 'carp' }, SUMMER, POND_REJECT.noFish);
  s.give(m, 'carp', 2);
  s.act(m, { kind: 'pondStock', site: 'Q0', fish: 'carp' }, SUMMER);
  assert.equal(s.inv(m, 'carp'), 1);
  s.fails(m, { kind: 'pondStock', site: 'Q0', fish: 'carp' }, SUMMER, POND_REJECT.stocked);
  // One more fish every POND_GROW_DAYS days, up to the start cap; then the pond asks for something.
  let t = SUMMER;
  const pond = () => s.life.farm.sites.Q0.state.pond;
  for (let d = 1; d <= 3 * POND_GROW_DAYS; d++) {
    t = SUMMER + d * DAY;
    s.act(m, { kind: 'status', text: '' }, t);
  }
  assert.equal(pond().n, POND_START_CAP);
  const view = s.view(m, t).farmSites.sites.find((x) => x.id === 'Q0').pond;
  assert.equal(view.cap, POND_START_CAP);
  assert.equal(view.max, POND_MAX[0]);
  assert.ok(view.want, 'a full pond asks for something');
  assert.deepEqual(pondWant('Q0', 1, pond()), { item: view.want.item, n: view.want.n });
  // Meeting the request raises the cap by one.
  s.fails(m, { kind: 'pondGive', site: 'Q0' }, t, POND_REJECT.want);
  if (CROPS.includes(view.want.item)) s.life.bag[m.id].produce[view.want.item] += view.want.n;
  else s.give(m, view.want.item, view.want.n);
  s.act(m, { kind: 'pondGive', site: 'Q0' }, t);
  assert.equal(pond().b, 1);
  assert.equal(pondCap(1, pond()), POND_START_CAP + 1);
  for (let d = 1; d <= POND_GROW_DAYS; d++) s.act(m, { kind: 'status', text: '' }, t + d * DAY);
  assert.equal(pond().n, POND_START_CAP + 1);
  // The cap never passes the small pond's size, however many requests.
  assert.equal(pondCap(1, { f: 'carp', n: 5, b: 9 }), POND_MAX[0]);
  assert.equal(pondCap(2, { f: 'carp', n: 5, b: 9 }), POND_MAX[1]);
  assert.equal(pondWant('Q0', 1, { f: 'carp', n: 5, b: 2 }), null);
  // Demolishing waits for the fish to be let go.
  s.fails(m, { kind: 'siteDemolish', site: 'Q0' }, t, SITE_REJECT.pondFish);
});

test('양식장 output: fish or roe every day (held up to six), roe → 젓갈 / 캐비아 in the jar; farmed fish keep the four-a-day rule', () => {
  const s = world(1),
    [m] = s.members;
  s.build(m, 'P0', 'fishPond', SUMMER);
  s.give(m, 'sturgeon', 1);
  s.act(m, { kind: 'pondStock', site: 'P0', fish: 'sturgeon' }, SUMMER);
  let t = SUMMER;
  for (let d = 1; d <= 30; d++) {
    t = SUMMER + d * DAY;
    s.act(m, { kind: 'status', text: '' }, t);
    const o = s.life.farm.sites.P0.state.pond.o ?? [];
    assert.ok(o.length <= 6);
    if (o.length >= 4) {
      const fishBefore = s.inv(m, 'sturgeon'),
        roeBefore = s.inv(m, 'sturgeonroe');
      s.act(m, { kind: 'pondCollect', site: 'P0' }, t);
      assert.equal(s.inv(m, 'sturgeon') - fishBefore + s.inv(m, 'sturgeonroe') - roeBefore, o.length);
    }
  }
  if (s.life.farm.sites.P0.state.pond.o) s.act(m, { kind: 'pondCollect', site: 'P0' }, t);
  s.fails(m, { kind: 'pondCollect', site: 'P0' }, t, POND_REJECT.nothing);
  assert.ok(s.inv(m, 'sturgeon') > 0, 'the pond gave sturgeon');
  // Roe in the jar: 철갑상어 알 → 캐비아 (2 × 900 + 50).
  assert.equal(goodsById()['jar-sturgeonroe'].name, '캐비아');
  assert.equal(goodsById()['jar-sturgeonroe'].base, 2 * ROE_ITEMS.sturgeonroe.sell + 50);
  assert.equal(goodsById()['jar-roe'].name, '젓갈');
  s.level(m, 'farm', 4);
  s.fund(m, 10_000);
  s.mats(m, { stone: 20, wood: 10 });
  s.act(m, { kind: 'farmBuild', item: 'jar' }, t);
  s.act(m, { kind: 'farmPlace', item: 'jar', slot: 0 }, t);
  s.give(m, 'sturgeonroe', 1);
  s.act(m, { kind: 'farmLoad', slot: 0, item: 'sturgeonroe' }, t);
  s.act(m, { kind: 'farmCollect', slot: 0 }, t + 17 * HOUR);
  assert.ok((s.life.farmx[m.id].goods['jar-sturgeonroe'] ?? 0) >= 1);
  // Farmed fish are ordinary fish: four of a species a day at the full price, then the curve (§12-2).
  assert.equal(demandMult('sturgeon', 3), 1);
  assert.ok(demandMult('sturgeon', 4) < 1);
  s.give(m, 'sturgeon', 5);
  const a = s.balance(m);
  s.act(m, { kind: 'sellItem', item: 'sturgeon', n: 4 }, t + 18 * HOUR);
  const four = s.balance(m) - a;
  s.act(m, { kind: 'sellItem', item: 'sturgeon', n: 1 }, t + 18 * HOUR);
  const fifth = s.balance(m) - a - four;
  assert.ok(fifth < four / 4, `${fifth} vs ${four / 4}`);
});

test('양식장: the medium pond needs 낚시 Lv8; 양식장 지기 adds two; emptying gives the stocked fish back', () => {
  const s = world(1),
    [m] = s.members;
  s.build(m, 'P0', 'fishPond', SUMMER);
  s.give(m, 'carp', 1);
  s.act(m, { kind: 'pondStock', site: 'P0', fish: 'carp' }, SUMMER);
  const up = FACILITY_BY_ID.fishPond.upgrades[0];
  s.fund(m, up.beom);
  s.mats(m, up.mats);
  s.fails(m, { kind: 'siteUpgrade', site: 'P0' }, SUMMER, '낚시 Lv8부터 넓힐 수 있어요.');
  s.level(m, 'fish', 8);
  s.act(m, { kind: 'siteUpgrade', site: 'P0' }, SUMMER);
  assert.equal(s.life.farm.sites.P0.tier, 2);
  let pond = s.view(m, SUMMER).farmSites.sites.find((x) => x.id === 'P0').pond;
  assert.equal(pond.max, POND_MAX[1]);
  // 어부 → 양식장 지기: two more fish (the cap and the size).
  s.act(m, { kind: 'chooseProf', skill: 'fish', prof: 'fish-a' }, SUMMER);
  s.act(m, { kind: 'pickTalent', skill: 'fish', talent: 'fish-a-t1' }, SUMMER);
  s.act(m, { kind: 'pickTalent', skill: 'fish', talent: 'fish-a-t3' }, SUMMER);
  pond = s.view(m, SUMMER).farmSites.sites.find((x) => x.id === 'P0').pond;
  assert.equal(pond.max, POND_MAX[1] + 2);
  assert.equal(pond.cap, POND_START_CAP + 2);
  // Emptying: the fish put in comes back, the pond can take another kind.
  s.act(m, { kind: 'pondEmpty', site: 'P0' }, SUMMER + MIN);
  assert.equal(s.inv(m, 'carp'), 1);
  assert.equal(s.life.farm.sites.P0.state.pond, undefined);
  s.act(m, { kind: 'siteDemolish', site: 'P0' }, SUMMER + 2 * MIN);
});

// ------------------------------------------------------------ 품종 개량소
test('품종 개량소: five crops → one improved seed, two a day; improved seeds plant with more gold and twice the giant chance', () => {
  const s = world(1),
    [m] = s.members;
  s.build(m, 'Q0', 'seedLab', SUMMER);
  s.life.bag[m.id].produce.carrot = 4;
  s.fails(m, { kind: 'labLoad', site: 'Q0', crop: 'carrot' }, SUMMER, LAB_REJECT.few);
  s.life.bag[m.id].produce.carrot = 20;
  s.act(m, { kind: 'labLoad', site: 'Q0', crop: 'carrot' }, SUMMER);
  s.act(m, { kind: 'labLoad', site: 'Q0', crop: 'carrot' }, SUMMER + MIN);
  assert.equal(s.life.bag[m.id].produce.carrot, 20 - 2 * SEEDLAB_INPUT);
  s.fails(m, { kind: 'labLoad', site: 'Q0', crop: 'carrot' }, SUMMER + 2 * MIN, LAB_REJECT.busy);
  s.fails(m, { kind: 'labCollect', site: 'Q0' }, SUMMER + 2 * MIN, LAB_REJECT.nothing);
  s.act(m, { kind: 'labCollect', site: 'Q0' }, SUMMER + MIN + SEEDLAB_MS);
  assert.equal(s.view(m, SUMMER + MIN + SEEDLAB_MS).farmx.improved.find((x) => x.crop === 'carrot').n, 2);
  // Two a KST day: the third waits for tomorrow.
  s.fails(m, { kind: 'labLoad', site: 'Q0', crop: 'carrot' }, SUMMER + SEEDLAB_MS + 2 * MIN, LAB_REJECT.today);
  s.act(m, { kind: 'labLoad', site: 'Q0', crop: 'carrot' }, SUMMER + DAY);
  // Planting an improved seed: gold points and the mark; the shop seeds stay.
  const shop = s.life.bag[m.id].seeds.carrot;
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot', improved: true }, SUMMER + DAY);
  const p = s.life.farms[m.id][0];
  assert.equal(p.iv, 1);
  assert.ok(p.g >= IMPROVED_GOLD_PTS);
  assert.equal(s.life.bag[m.id].seeds.carrot, shop);
  assert.equal(s.life.farmx[m.id].is.carrot, 1);
  s.act(m, { kind: 'plant', plot: 1, crop: 'carrot', improved: true }, SUMMER + DAY);
  s.fails(m, { kind: 'plant', plot: 2, crop: 'carrot', improved: true }, SUMMER + DAY, LIFE_REJECT.noSeed);
  // Survives a reload.
  const back = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.equal(back.farms[m.id][0].iv, 1);
  assert.equal(back.farmx[m.id].is, undefined);
  // Giant beds: a bed of six improved seeds rolls under twice the chance.
  const uid = uuid(),
    bed = tileBed(0);
  let at = 10_000;
  while (!(hash32(`giant:${uid}:1:${at}`) % 100 >= 8 && hash32(`giant:${uid}:1:${at}`) % 100 < 8 * IMPROVED_GIANT_MULT)) at += 1_000;
  const field = Array.from({ length: GRID_TILES }, () => ({ crop: null, plantedAt: 0 }));
  for (const t of bedTiles(bed)) field[t] = { crop: 'pumpkin', plantedAt: at, t: 1, wetMs: 1e9, wetUntil: at + 1e9 };
  assert.equal(giantBed(field, uid, bed, at + 2e9), false);
  for (const t of bedTiles(bed)) field[t].iv = 1;
  assert.equal(giantBed(field, uid, bed, at + 2e9), true);
});

// ------------------------------------------------------------ 서리 덮개
test('서리 덮개 (농사 Lv9): a quarter of the field takes any seed in winter and its crops do not wither when winter comes', () => {
  const s = world(1),
    [m] = s.members;
  s.fund(m, FROST_COVER_RECIPE.beom);
  s.mats(m, FROST_COVER_RECIPE.mats);
  s.fails(m, { kind: 'farmBuild', item: 'frostcover' }, AUTUMN, '농사 Lv9부터 만들 수 있어요.');
  s.level(m, 'farm', 9);
  s.act(m, { kind: 'farmBuild', item: 'frostcover' }, AUTUMN);
  s.act(m, { kind: 'farmPlace', item: 'frostcover' }, AUTUMN);
  s.give(m, 'frostcover', 1);
  s.fails(m, { kind: 'farmPlace', item: 'frostcover' }, AUTUMN, '밭에 이미 서리 덮개가 있어요.');
  // A quarter of a 24-tile field: its first row (by the house).
  assert.deepEqual(frostTiles(24), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(frostTiles(120).length, 30);
  assert.ok(frostTiles(120).every((t) => tileRC(t).r <= 2));
  assert.deepEqual(s.view(m, AUTUMN).farmx.frost, [0, 1, 2, 3, 4, 5]);
  assert.equal(s.view(m, AUTUMN).me.farm[0].frost, true);
  // An autumn crop under the cover and one outside it: winter withers only the outside one.
  s.life.bag[m.id].seeds.sweetpotato = 2;
  s.act(m, { kind: 'plant', plot: 0, crop: 'sweetpotato' }, kst(2026, 10, 25, 20));
  s.act(m, { kind: 'plant', plot: 12, crop: 'sweetpotato' }, kst(2026, 10, 25, 20));
  assert.equal(seasonOfDay(kstDay(WINTER)), 'winter');
  s.act(m, { kind: 'status', text: '' }, WINTER);
  assert.equal(s.life.farms[m.id][0].crop, 'sweetpotato');
  assert.equal(s.life.farms[m.id][12].dead, 'sweetpotato');
  // In winter a summer seed goes in under the cover only.
  s.life.bag[m.id].seeds.watermelon = 2;
  s.fails(m, { kind: 'plant', plot: 12, crop: 'watermelon' }, WINTER, '지금은 수박 철이 아니라 심을 수 없어요.');
  s.act(m, { kind: 'plant', plot: 1, crop: 'watermelon' }, WINTER);
  assert.equal(s.life.farms[m.id][1].crop, 'watermelon');
  assert.ok(readLife(JSON.parse(JSON.stringify(s.life))).farmx[m.id].fc > 0);
});

// ------------------------------------------------------------ field stage 4 and the layout
test('field stage 4: 120 tiles for 900,000범 at 농사 Lv10; the farm is wide enough, houses and the road stay clear', () => {
  assert.equal(FARM_EXPAND_PRICE[120], 900_000);
  assert.equal(FARM_EXPAND_LEVEL[120], 10);
  for (const f of FARM_FIELDS) {
    assert.ok(f.x0 >= -FARM_W / 2 + 1 && f.x0 + f.w <= FARM_W / 2 - 1, `field ${f.actor} inside`);
    assert.equal(f.w, 12);
    assert.equal(f.d, 10);
    // The lane stays south of the field and its lane-side front-yard spots.
    const bottom = f.z0 + f.d;
    assert.ok(FARM_LANE_Z - 1.1 > bottom + 0.3, 'lane clear of the field');
    for (const s of yardSpots(120)) {
      const c = fieldCellCenter(f, s.r, s.c);
      assert.ok(c.x > f.x0 - 0.01 && c.x < f.x0 + f.w, 'spots over the field');
    }
    // 명인 표지판: in front of the field, off the lane.
    const sign = masterSign(f);
    assert.ok(sign.z > bottom && sign.z < FARM_LANE_Z - 1.1, `sign ${f.actor} ${sign.z}`);
  }
  assert.equal(isMasterField(120), true);
  assert.equal(isMasterField(80), false);
  // Fields keep clear of each other and of every house.
  const sorted = [...FARM_FIELDS].sort((a, b) => a.x0 - b.x0);
  for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i].x0 >= sorted[i - 1].x0 + sorted[i - 1].w + 1.5);
  for (const h of FARM_HOUSES) for (const f of FARM_FIELDS) assert.ok(h.z + h.d / 2 < f.z0, `house ${h.actor} north of field ${f.actor}`);
  // The road south to the hub (x = 0) crosses no field or site.
  const road = FARM_PAVING.filter((p) => p.tone === 'road');
  const overlap = (a, b) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.z - b.z) * 2 < a.d + b.d;
  for (const r of road) {
    for (const f of FARM_FIELDS) assert.ok(!overlap(r, { x: f.x0 + f.w / 2, z: f.z0 + f.d / 2, w: f.w, d: f.d }), `road clear of field ${f.actor}`);
    for (const s of FARM_SITES) assert.ok(!overlap(r, s), `road clear of site ${s.id}`);
  }
  // Two personal sites per friend, under their field, apart from each other and the fields.
  for (const a of [0, 1, 2, 3, 4, 5, 6]) {
    const [p, q] = personalSites(a);
    assert.deepEqual([p.id, q.id], [`P${a}`, `Q${a}`]);
    assert.ok(!overlap(p, q));
    for (const f of FARM_FIELDS) for (const s of [p, q]) assert.ok(!overlap(s, { x: f.x0 + f.w / 2, z: f.z0 + f.d / 2, w: f.w, d: f.d }));
  }
});

test('field view budget: locked tiles are sent as a mark only; a full stage-4 field shows its whole grid', () => {
  const s = world(1),
    [m] = s.members;
  const small = s.view(m, SUMMER).me.farm;
  assert.equal(small.length, GRID_TILES);
  const locked = small.filter((p) => p.locked);
  assert.equal(locked.length, GRID_TILES - 24);
  for (const p of locked) assert.deepEqual(p, { crop: null, plantedAt: 0, locked: true });
  assert.ok(JSON.stringify(locked).length < 45 * locked.length);
  ((s.life.ext ??= {})[m.id] ??= {}).plots = 120;
  const big = s.view(m, SUMMER).me.farm;
  assert.equal(big.filter((p) => !p.locked).length, 120);
});

test('bounded read: hostile pond, lab, frost and improved-seed data are clipped', () => {
  const uid = uuid();
  const farm = readFarmCommons({
    sites: {
      P0: { kind: 'fishPond', tier: 1, owner: uid, state: { pond: { f: 'carp', n: 999, b: 99, g: 5, o: ['carp', 'roe', 'gold', 'bluefin', 'carp', 'carp', 'carp', 'carp', 'carp'] } } },
      Q0: { kind: 'fishPond', tier: 1, owner: uid, state: { pond: { f: 'goldcarp', n: 3 } } },
      P1: { kind: 'seedLab', tier: 1, owner: uid, state: { lab: { q: [{ c: 'carrot', done: 5 }, { c: 'nope', done: 6 }, { c: 'tomato', done: 7 }, { c: 'corn', done: 8 }], d: 3, k: 50 } } },
    },
  }).farm;
  const pond = farm.sites.P0.state.pond;
  assert.ok(pond.n <= POND_MAX[1] + 4);
  assert.ok(pond.b <= POND_MAX[1]);
  assert.deepEqual(pond.o, ['carp', 'roe', 'carp', 'carp', 'carp', 'carp']);
  assert.equal(farm.sites.Q0.state.pond, undefined);
  assert.deepEqual(farm.sites.P1.state.lab, { q: [{ c: 'carrot', done: 5 }, { c: 'tomato', done: 7 }], d: 3, k: 2 });
  const life = readLife({
    farms: { [uid]: {} },
    actors: { [uid]: 0 },
    farmx: { [uid]: { fc: 'yes', is: { carrot: 3, nope: 4, tomato: -1 } } },
  });
  assert.deepEqual(life.farmx[uid], { is: { carrot: 3 } });
});
