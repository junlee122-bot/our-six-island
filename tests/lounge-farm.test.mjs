// 텃밭 확장 (design-farming-upgrade.md): save migration, the tile grid and
// sprinklers, regrow / wither timing, crows, giant crops, machines and
// quality carry-over, the shipping bin at the KST day boundary, helping a
// friend, the 품평회 and the ledger (no 범 made from nothing).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CROPS,
  CROP_INFO,
  LifeError,
  LIFE_REJECT,
  QUALITY_MULT,
  emptyLife,
  ensureLifeMember,
  lifeAction,
  lifeView,
  plotQuality,
  plotReadyAt,
  readLife,
} from '../app/lounge-life.ts';
import {
  BEE_MS,
  CROW_CHANCE,
  FAIR_FEE,
  GIANT_CHANCE,
  GIANT_CROPS,
  FIXTURES,
  GRID_TILES,
  MACHINES,
  MACHINE_BY_ID,
  NEW_CROP_IDS,
  WORK_SLOTS,
  isGoodId,
  sprinklerCovers,
  tileBehind,
  tileFront,
  tileRC,
} from '../app/lounge-farm-data.ts';
import {
  FARM_REJECT,
  bedTiles,
  giantBed,
  goodsById,
  parseStock,
  sellCapAllows,
  settleFarmPlots,
  stockKey,
  stockName,
  witherAt,
} from '../app/lounge-farm.ts';
import { demandMult, marketMult } from '../app/lounge-life-plus.ts';
import { seasonOf, hash32, dayStart } from '../app/lounge-calendar.ts';
import { INITIAL_BEOM, kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { LEVEL_PERKS, LEVEL_XP } from '../app/lounge-growth-data.ts';
import { farmToolAction, plantsAnySeason } from '../app/lounge-life-ui.ts';
import { ITEM_BY_ID } from '../app/lounge-items.ts';

const uuid = () => crypto.randomUUID();
const MIN = 60_000,
  HOUR = 3_600_000,
  DAY = 86_400_000;
/** KST wall clock → epoch ms. */
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
// 2026-10-12 (Mon) … 10-18 (Sun) is a summer week; 10-19 starts autumn.
const SUMMER = kst(2026, 10, 13, 10);

function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  const reserved = Object.values(ledger.games)
    .filter((g) => g.state === 'reserved')
    .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
  assert.equal(
    balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0),
    Object.keys(ledger.accounts).length * INITIAL_BEOM,
  );
}
function world(n = 2) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
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
    );
  s.balance = (m) => s.ledger.accounts['wallet-' + m.id];
  s.view = (m, now) => lifeView(s.life, m.id, m.actor, now);
  s.give = (m, item, n) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + n;
  };
  s.seeds = (m, crop, n) => {
    s.life.bag[m.id].seeds[crop] = n;
  };
  s.crops = (m, crop, n, q = 0) => {
    s.life.bag[m.id].produce[crop] += n;
    if (q) {
      const x = ((s.life.ext ??= {})[m.id] ??= {}),
        key = ['', 'q1', 'q2', 'q3'][q];
      (x[key] ??= {})[crop] = (x[key][crop] ?? 0) + n;
    }
  };
  /** Sets a skill's XP so its level is at least `lv`. */
  s.level = (m, skill, lv) => {
    const g = (s.life.growth ??= {});
    const u = ((g.u ??= {})[m.id] ??= {});
    (u.xp ??= {})[skill] = LEVEL_XP[lv - 1];
  };
  return s;
}

// ------------------------------------------------------------ catalog
test('26 crops: the ten originals unchanged, the new ones seasonal; goods ids round-trip', () => {
  assert.equal(CROPS.length, 26);
  assert.deepEqual(CROPS.slice(10), [...NEW_CROP_IDS]);
  // Crop ids never collide with bag items (forage 해바라기 / 산삼 exist as items).
  for (const c of CROPS) assert.equal(ITEM_BY_ID[c], undefined, c);
  for (const c of NEW_CROP_IDS) {
    assert.ok(CROP_INFO[c].seasons?.length, c);
    // Every new crop pays in the same band per hour as the originals (6 tiles, watered).
    const info = CROP_INFO[c],
      k = info.regrow?.harvests ?? 1,
      hours = ((info.growMs + (k - 1) * (info.regrow?.ms ?? 0)) * 0.6) / HOUR,
      perHour = (6 * (k * info.sell - info.seed)) / hours;
    assert.ok(perHour >= 1_800 && perHour <= 5_500, `${c} ${perHour}`);
  }
  for (const g of Object.values(goodsById())) {
    assert.ok(isGoodId(g.id), g.id);
    assert.ok(g.base > 0, g.id);
  }
  assert.equal(goodsById()['keg-grape'].base, 3 * CROP_INFO.grape.sell);
  assert.equal(goodsById()['jar-cabbage'].name, '배추김치');
  assert.equal(goodsById()['dry-pepper'].name, '고춧가루');
  assert.equal(isGoodId('keg-tulip'), false);
  assert.deepEqual(parseStock('jar-grape@2'), { id: 'jar-grape', q: 2 });
  assert.equal(parseStock('honey@2'), null);
  assert.equal(parseStock('fruit@1'), null);
  assert.equal(stockKey('carrot', 0), 'carrot');
});

// ------------------------------------------------------------ migration
test('old saves: plots stay on the same tiles and read back identically', () => {
  const uid = uuid();
  const old = {
    farms: {
      [uid]: [
        { crop: 'carrot', plantedAt: 1_000, wateredAt: 2_000, fert: 1 },
        { crop: 'corn', plantedAt: 5_000, wateredAt: null, n: 1, speed: 10 },
        { crop: null, plantedAt: 0, wateredAt: null },
        { crop: 'pumpkin', plantedAt: 9_000, wateredAt: null, g: 2 },
        { crop: null, plantedAt: 0, wateredAt: null },
        { crop: null, plantedAt: 0, wateredAt: null },
      ],
    },
    bag: { [uid]: { seeds: { carrot: 3 }, produce: { carrot: 2 }, fruit: 1 } },
    actors: { [uid]: 0 },
    ext: { [uid]: { q1: { carrot: 1 }, q2: { carrot: 1 } } },
  };
  const life = readLife(JSON.parse(JSON.stringify(old)));
  // 우리 농장: old tiles 0–5 (the front bed) land on rows 2–3 of the field's top-left block.
  assert.deepEqual([20, 21, 22, 30].map((t) => life.farms[uid][t]), old.farms[uid].slice(0, 4));
  assert.equal(life.farms[uid].length, GRID_TILES);
  assert.equal(life.farmx, undefined);
  assert.equal(life.fair, undefined);
  // New crops read as 0 in old bags.
  assert.equal(life.bag[uid].seeds.insam, 0);
  assert.equal(life.bag[uid].produce.grape, 0);
  // Round trip stays equal, and a view of it works (no crows before the first settle).
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(life))), life);
  const view = lifeView(life, uid, 0, 20_000);
  assert.equal(view.me.farm[20].crop, 'carrot');
  assert.equal(view.farmx.fixtures.length, 0);
  // Tile = row × 10 + column; beds are 3 × 2 blocks (rows 0–1, 2–3…).
  assert.deepEqual(tileRC(0), { r: 0, c: 0 });
  assert.deepEqual(tileRC(35), { r: 3, c: 5 });
  assert.equal(tileBehind(30), 20);
  assert.equal(tileBehind(20), null); // across the aisle: another bed
  assert.equal(tileFront(10), null);
  assert.equal(tileFront(0), 10);
});

test('bounded read: hostile farm extension values are clipped', () => {
  const uid = uuid();
  const life = readLife({
    farms: { [uid]: Array.from({ length: 6 }, () => ({ crop: null, plantedAt: 0, wateredAt: null })) },
    farmx: {
      [uid]: {
        fx: { 0: { k: 'sprinkler', at: 1 }, 99: { k: 'sprinkler', at: 1 }, 3: { k: 'bogus', at: 1 } },
        // Slots go up to the machine yard's 12 (0–11); 12 is no slot.
        mach: { 0: { k: 'keg', out: 'keg-grape', done: 5, q: 3, n: 1 }, 7: { k: 'jar' }, 12: { k: 'jar' } },
        goods: { 'keg-grape@2': 3, 'nope': 4, 'honey@1': 2 },
        bin: { day: 5, items: { carrot: 5000, 'fruit@2': 1 } },
        log: Array.from({ length: 30 }, () => ({ kind: 'crow', at: 1, tile: 2 })),
      },
    },
    fair: { week: 3, entries: [{ actor: 9, uid, item: 'carrot', q: 0, score: 1, at: 1 }] },
  });
  // Old yard tile 0 (front bed) → field tile 20; 99 is no tile.
  assert.deepEqual(Object.keys(life.farmx[uid].fx), ['20']);
  assert.deepEqual(Object.keys(life.farmx[uid].mach), ['0', '7']);
  assert.deepEqual(life.farmx[uid].goods, { 'keg-grape@2': 3 });
  assert.deepEqual(life.farmx[uid].bin.items, { carrot: 999 });
  assert.equal(life.farmx[uid].log.length, 8);
  assert.deepEqual(life.fair.entries, []);
});

// ------------------------------------------------------------ tiles and sprinklers
test('sprinkler coverage: plus 4, ring 8, wide 5×5 on the 10 × 8 field', () => {
  const covered = (kind, at) => Array.from({ length: GRID_TILES }, (_, t) => t).filter((t) => sprinklerCovers(kind, at, t));
  // Tile 22 (row 2, column 2): a whole 5 × 5 fits around it.
  assert.deepEqual(covered('sprinkler', 22).sort((a, b) => a - b), [12, 21, 23, 32]);
  assert.deepEqual(covered('sprinkler-q', 22).sort((a, b) => a - b), [11, 12, 13, 21, 23, 31, 32, 33]);
  assert.equal(covered('sprinkler-s', 22).length, 24);
  // At the north-west corner the field edge cuts it.
  assert.deepEqual(covered('sprinkler', 0).sort((a, b) => a - b), [1, 10]);
  assert.deepEqual(covered('scarecrow', 1), []);
});

test('placing: fixtures sit on empty tiles, block planting, water new plantings, and move', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  s.level(m, 'farm', 6);
  s.give(m, 'copper', 4);
  s.give(m, 'stone', 4);
  const before = s.balance(m);
  s.act(m, { kind: 'farmBuild', item: 'sprinkler' }, t);
  assert.equal(before - s.balance(m), 3_000);
  assert.equal(s.life.ext[m.id].inv.sprinkler, 1);
  // Untilled tiles (column 8 of a 6 × 4 field) and busy tiles are refused.
  s.fails(m, { kind: 'farmPlace', item: 'sprinkler', tile: 8 }, t, FARM_REJECT.tileLocked);
  s.seeds(m, 'carrot', 10);
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' }, t);
  s.fails(m, { kind: 'farmPlace', item: 'sprinkler', tile: 0 }, t, FARM_REJECT.tileBusy);
  // Placing waters the growing carrot at tile 0 (left of tile 1).
  s.act(m, { kind: 'farmPlace', item: 'sprinkler', tile: 1 }, t + MIN);
  assert.equal(s.life.farms[m.id][0].wateredAt, t + MIN);
  s.fails(m, { kind: 'plant', plot: 1, crop: 'carrot' }, t + MIN, LIFE_REJECT.fixture);
  // Plant-all skips the fixture tile and waters what the sprinkler covers (2, 11) at once.
  s.act(m, { kind: 'plant', plot: -1, crop: 'carrot' }, t + 2 * MIN);
  const farm = s.life.farms[m.id];
  assert.equal(farm[1].crop, null);
  assert.equal(farm[2].wateredAt, t + 2 * MIN);
  assert.equal(farm[11].wateredAt, t + 2 * MIN);
  assert.equal(farm[3].wateredAt, null);
  // Never past the tilled block.
  assert.ok(farm.every((p, i) => !p.crop || (i % 10 < 6 && i < 40)));
  const v = s.view(m, t + 3 * MIN);
  assert.equal(v.me.farm[11].sprinkled, true);
  assert.ok(!v.me.farm[3].sprinkled);
  assert.deepEqual(v.farmx.fixtures.map((f) => [f.tile, f.kind]), [[1, 'sprinkler']]);
  // Harvest, then move the sprinkler onto an empty tile.
  s.act(m, { kind: 'harvest', plot: -1 }, t + HOUR);
  s.act(m, { kind: 'farmMove', from: 1, to: 3 }, t + HOUR);
  assert.deepEqual(Object.keys(s.life.farmx[m.id].fx), ['3']);
  s.act(m, { kind: 'farmPickup', tile: 3 }, t + HOUR);
  assert.equal(s.life.ext[m.id].inv.sprinkler, 1);
});

test('sprinkler-watered crops ripen 40% sooner (+ quality bonus) and regrow wet', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  s.life.farmx = { [m.id]: { fx: { 1: { k: 'sprinkler-q', at: t - HOUR } } } };
  s.seeds(m, 'blueberry', 1);
  s.act(m, { kind: 'plant', plot: 0, crop: 'blueberry' }, t);
  const p = s.life.farms[m.id][0],
    grow = CROP_INFO.blueberry.growMs;
  assert.equal(p.wateredAt, t);
  assert.equal(p.w, 5);
  assert.equal(plotReadyAt(p, t), t + Math.ceil(grow * (1 - 0.4 - 5 / 100)));
  // Regrowing: the next cycle (4h) starts watered too.
  const ready = plotReadyAt(p, t);
  s.act(m, { kind: 'harvest', plot: 0 }, ready);
  const again = s.life.farms[m.id][0];
  assert.equal(again.n, 1);
  assert.equal(again.wateredAt, ready);
  assert.equal(plotReadyAt(again, ready), ready + Math.ceil(CROP_INFO.blueberry.regrow.ms * (1 - 0.4 - 5 / 100)));
});

test('regrow timing: a regrowing crop gives exactly `harvests` crops, then the tile is empty', () => {
  const s = world(1),
    [m] = s.members;
  let t = SUMMER;
  s.seeds(m, 'cucumber', 1);
  s.act(m, { kind: 'plant', plot: 3, crop: 'cucumber' }, t);
  const info = CROP_INFO.cucumber;
  t += info.growMs;
  for (let k = 0; k < info.regrow.harvests; k++) {
    s.fails(m, { kind: 'harvest', plot: 3 }, t - 1, LIFE_REJECT.notReady);
    s.act(m, { kind: 'harvest', plot: 3 }, t);
    t += info.regrow.ms;
  }
  assert.equal(s.life.bag[m.id].produce.cucumber, info.regrow.harvests);
  assert.equal(s.life.farms[m.id][3].crop, null);
});

test('trellis shade: a crop planted behind a trellis crop in the same bed grows 10% slower', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  s.seeds(m, 'cucumber', 1);
  s.seeds(m, 'carrot', 2);
  s.act(m, { kind: 'plant', plot: 10, crop: 'cucumber' }, t);
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' }, t); // behind tile 10
  s.act(m, { kind: 'plant', plot: 1, crop: 'carrot' }, t);
  const farm = s.life.farms[m.id];
  assert.equal(farm[0].sl, 10);
  assert.equal(farm[1].sl, undefined);
  assert.equal(plotReadyAt(farm[0], t) - t, Math.ceil((CROP_INFO.carrot.growMs * 110) / 100));
});

// ------------------------------------------------------------ withering and crows
test('wither: a summer-only crop dies at 00:00 KST of the first autumn day; sheltered farms keep it', () => {
  const s = world(1),
    [m] = s.members,
    late = kst(2026, 10, 18, 20); // Sunday evening, the last summer day
  assert.equal(seasonOf(late), 'summer');
  assert.equal(seasonOf(kst(2026, 10, 19, 1)), 'autumn');
  s.seeds(m, 'watermelon', 1);
  s.act(m, { kind: 'plant', plot: 0, crop: 'watermelon' }, late);
  const midnight = kst(2026, 10, 19, 0);
  assert.equal(witherAt(s.life.farms[m.id][0], false), midnight);
  assert.equal(s.view(m, late).me.farm[0].witherAt, midnight);
  // The view shows it withered (projected) before anyone acts.
  const v = s.view(m, midnight + MIN);
  assert.equal(v.me.farm[0].crop, null);
  assert.equal(v.me.farm[0].dead, 'watermelon');
  // An action settles it for real: nothing to harvest, and the tile is plantable.
  s.fails(m, { kind: 'harvest', plot: -1 }, midnight + MIN, LIFE_REJECT.nothingReady);
  s.act(m, { kind: 'status', text: '' }, midnight + MIN);
  assert.equal(s.life.farms[m.id][0].dead, 'watermelon');
  assert.equal(s.life.farmx[m.id].log.at(-1).kind, 'wither');
  s.seeds(m, 'carrot', 1);
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' }, midnight + 2 * MIN);
  assert.equal(s.life.farms[m.id][0].dead, undefined);
  // Base crops never wither; a greenhouse (or 온실지기) shelters seasonal ones.
  assert.equal(witherAt(s.life.farms[m.id][0], false), null);
  assert.equal(witherAt({ crop: 'watermelon', plantedAt: late, wateredAt: null }, true), null);
});

/** 온실지기 (farm-a2): off-season seeds on my own field (우리 농장 F3: the village greenhouse no longer does it). */
function greenThumb(w, uid) {
  const u = ((w.life.growth ??= {}).u ??= {});
  u[uid] = { ...u[uid], prof: ['farm-a2'] };
}
test('crows: deterministic 05:00 rolls, never retroactive, scarecrows guard radius 2', () => {
  // Find a summer day whose roll draws crows for some uid.
  const s = world(1),
    [m] = s.members;
  let day = kstDay(SUMMER) + 1;
  while (hash32(`crow:${m.id}:${day}`) % 100 >= CROW_CHANCE) day++;
  const dawn = dayStart(day) + 5 * HOUR,
    evening = dayStart(day - 1) + 20 * HOUR;
  // First settle the day before: the farm starts counting from here.
  s.act(m, { kind: 'status', text: '' }, evening - HOUR);
  assert.equal(s.life.farmx[m.id].st, day - 1);
  s.seeds(m, 'insam', 6);
  greenThumb(s, m.id); // 온실지기: plant ginseng in any season for this test
  s.act(m, { kind: 'plant', plot: -1, crop: 'insam' }, evening);
  // Before 05:00 nothing happens; after it one ginseng is gone.
  const beforeView = s.view(m, dawn - MIN);
  assert.equal(beforeView.me.farm.filter((p) => p.crop).length, 6);
  const after = s.view(m, dawn + MIN);
  assert.equal(after.me.farm.filter((p) => p.crop).length, 5);
  s.act(m, { kind: 'status', text: '' }, dawn + MIN);
  assert.equal(s.life.farms[m.id].filter((p) => p.crop).length, 5);
  assert.equal(s.life.farmx[m.id].log.at(-1).kind, 'crow');
  // A scarecrow placed before 05:00 in the middle guards everything within 2 tiles.
  const t = world(1),
    [n] = t.members;
  n.id = m.id; // same uid → same roll
  t.life = ensureLifeMember(emptyLife(), m.id, 0);
  t.ledger = registerWallet(newLoungeLedger(), 'wallet-' + m.id);
  t.act(n, { kind: 'status', text: '' }, evening - HOUR);
  greenThumb(t, m.id);
  t.seeds(n, 'insam', 6);
  for (const tile of [0, 1, 2, 10, 11, 12]) t.act(n, { kind: 'plant', plot: tile, crop: 'insam' }, evening);
  t.life.farms[m.id][11] = { crop: null, plantedAt: 0, wateredAt: null };
  t.life.farmx[m.id].fx = { 11: { k: 'scarecrow', at: evening } };
  t.act(n, { kind: 'status', text: '' }, dawn + MIN);
  assert.equal(t.life.farms[m.id].filter((p) => p.crop).length, 5);
  assert.equal(t.life.farmx[m.id].log.at(-1).kind, 'guard');
});

// ------------------------------------------------------------ giant crops and quality
test('giant crops: a full bed of one giant crop planted together may merge; one click reaps the bed ×2', () => {
  // Find a planting time whose hash makes bed 0 (tiles 0–2, 10–12) giant; its roll
  // keeps the old back bed's seed (1) so crops planted before 우리 농장 keep theirs.
  const s = world(1),
    [m] = s.members;
  let t = SUMMER;
  while (hash32(`giant:${m.id}:1:${t}`) % 100 >= GIANT_CHANCE) t += 1_000;
  s.seeds(m, 'pumpkin', 12);
  // Plant-all fills rows 0–1 of the 6 × 4 block: beds 0 and 1 at once.
  s.act(m, { kind: 'plant', plot: -1, crop: 'pumpkin' }, t);
  const ripe = t + CROP_INFO.pumpkin.growMs;
  assert.equal(giantBed(s.life.farms[m.id], m.id, 0, ripe - 1), false);
  assert.equal(giantBed(s.life.farms[m.id], m.id, 0, ripe), true);
  assert.ok(GIANT_CROPS.includes('pumpkin'));
  assert.ok(s.view(m, ripe).farmx.giants.includes(0));
  const before = s.life.bag[m.id].produce.pumpkin;
  s.act(m, { kind: 'harvest', plot: 2 }, ripe);
  assert.equal(s.life.bag[m.id].produce.pumpkin - before, 12);
  assert.ok(bedTiles(0).every((i) => !s.life.farms[m.id][i].crop));
  assert.deepEqual(bedTiles(0), [0, 1, 2, 10, 11, 12]);
  assert.deepEqual(bedTiles(1), [3, 4, 5, 13, 14, 15]);
});

test('별빛 quality: only with 별빛 비료; sells ×2 and stacks as its own tier', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  s.level(m, 'farm', 8);
  s.give(m, 'fertilizer-deluxe', 1);
  s.give(m, 'gold', 1);
  s.act(m, { kind: 'farmBuild', item: 'fertilizer-star' }, t);
  assert.equal(s.life.ext[m.id].inv['fertilizer-star'], 1);
  // Find a tile/time whose roll is a star under fert 3.
  let at = t;
  const plot = (time) => ({ crop: 'carrot', plantedAt: time, wateredAt: null, fert: 3 });
  while (plotQuality(m.id, 0, plot(at)) !== 3) at += 1_000;
  assert.equal(plotQuality(m.id, 0, { ...plot(at), fert: 2 }) < 3, true);
  s.seeds(m, 'carrot', 1);
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' }, at);
  s.act(m, { kind: 'fertilize', plot: 0, item: 'fertilizer-star' }, at);
  s.act(m, { kind: 'harvest', plot: 0 }, at + CROP_INFO.carrot.growMs);
  assert.equal(s.life.ext[m.id].q3.carrot, 1);
  assert.equal(s.view(m, at + CROP_INFO.carrot.growMs).me.quality.star.carrot, 1);
  const b = s.balance(m);
  s.act(m, { kind: 'sell', crop: 'carrot', n: 1, quality: 3, at: 'coop' }, at + CROP_INFO.carrot.growMs);
  assert.equal(s.balance(m) - b, CROP_INFO.carrot.sell * QUALITY_MULT[3]);
});

test('soil items: 성장 촉진제 speeds up with a quality fertilizer; 보습 흙 waters at once', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  s.give(m, 'speed-gro', 1);
  s.give(m, 'fertilizer', 1);
  s.give(m, 'retaining', 1);
  s.seeds(m, 'strawberry', 2);
  s.act(m, { kind: 'plant', plot: 0, crop: 'strawberry' }, t);
  s.act(m, { kind: 'fertilize', plot: 0, item: 'fertilizer' }, t);
  s.act(m, { kind: 'fertilize', plot: 0, item: 'speed-gro' }, t);
  s.fails(m, { kind: 'fertilize', plot: 0, item: 'speed-gro' }, t);
  const p = s.life.farms[m.id][0];
  assert.equal(p.fert, 1);
  assert.equal(p.sg, 1);
  assert.equal(p.speed, 15);
  s.act(m, { kind: 'plant', plot: 1, crop: 'strawberry' }, t);
  s.act(m, { kind: 'fertilize', plot: 1, item: 'retaining' }, t + MIN);
  assert.equal(s.life.farms[m.id][1].wateredAt, t + MIN);
});

// ------------------------------------------------------------ machines
test('machines: build by level, real-time durations, quality carries into the good', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  s.give(m, 'stone', 20);
  s.give(m, 'wood', 40);
  s.give(m, 'iron', 2);
  s.fails(m, { kind: 'farmBuild', item: 'jar' }, t, '농사 Lv4부터 만들 수 있어요.');
  s.level(m, 'farm', 4);
  s.level(m, 'craft', 4);
  s.act(m, { kind: 'farmBuild', item: 'jar' }, t);
  s.act(m, { kind: 'farmBuild', item: 'keg' }, t);
  s.act(m, { kind: 'farmPlace', item: 'jar', slot: 0 }, t);
  s.act(m, { kind: 'farmPlace', item: 'keg', slot: 1 }, t);
  s.fails(m, { kind: 'farmPlace', item: 'keg', slot: WORK_SLOTS }, t, FARM_REJECT.slot);
  s.crops(m, 'grape', 2, 2); // two gold grapes
  s.crops(m, 'cabbage', 1, 0);
  s.fails(m, { kind: 'farmLoad', slot: 0, item: 'tulip' }, t, FARM_REJECT.machineInput);
  s.act(m, { kind: 'farmLoad', slot: 0, item: 'cabbage' }, t);
  s.act(m, { kind: 'farmLoad', slot: 1, item: 'grape', q: 2 }, t);
  assert.equal(s.life.bag[m.id].produce.grape, 1);
  s.fails(m, { kind: 'farmLoad', slot: 1, item: 'grape' }, t, FARM_REJECT.machineBusy);
  // The jar (16h) is done before the keg (24h).
  s.fails(m, { kind: 'farmCollect', slot: -1 }, t + MACHINE_BY_ID.jar.ms - 1, FARM_REJECT.nothing);
  s.act(m, { kind: 'farmCollect', slot: -1 }, t + MACHINE_BY_ID.jar.ms);
  assert.deepEqual(s.life.farmx[m.id].goods, { 'jar-cabbage': 1 });
  s.act(m, { kind: 'farmCollect', slot: 1 }, t + MACHINE_BY_ID.keg.ms);
  assert.deepEqual(s.life.farmx[m.id].goods, { 'jar-cabbage': 1, 'keg-grape@2': 1 });
  // Selling the gold wine pays 3 × grape × 1.5.
  const b = s.balance(m);
  s.act(m, { kind: 'sellGoods', item: 'keg-grape', q: 2, n: 1, at: 'coop' }, t + MACHINE_BY_ID.keg.ms);
  assert.equal(s.balance(m) - b, Math.round(3 * CROP_INFO.grape.sell * 1.5));
  // A dehydrator takes five and keeps the lowest quality among them.
  s.level(m, 'farm', 5);
  s.give(m, 'copper', 5);
  s.give(m, 'wood', 20);
  s.act(m, { kind: 'farmBuild', item: 'dehydrator' }, t);
  s.act(m, { kind: 'farmPlace', item: 'dehydrator', slot: 2 }, t);
  s.crops(m, 'blueberry', 4, 2);
  s.crops(m, 'blueberry', 1, 1);
  s.act(m, { kind: 'farmLoad', slot: 2, item: 'blueberry' }, t);
  s.act(m, { kind: 'farmCollect', slot: 2 }, t + MACHINE_BY_ID.dehydrator.ms);
  assert.equal(s.life.farmx[m.id].goods['dry-blueberry@1'], 1);
  // Machines with something inside cannot be picked up.
  s.act(m, { kind: 'farmLoad', slot: 0, item: 'grape' }, t + DAY);
  s.fails(m, { kind: 'farmPickup', slot: 0 }, t + DAY, FARM_REJECT.machineFull);
  s.act(m, { kind: 'farmPickup', slot: 2 }, t + DAY);
  assert.equal(s.life.ext[m.id].inv.dehydrator, 1);
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(s.life))), s.life);
});

test('bee house: honey every 16h, flower honey from a ripe flower within 2 tiles', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  s.level(m, 'forage', 4);
  s.give(m, 'wood', 30);
  s.give(m, 'copper', 2);
  s.act(m, { kind: 'farmBuild', item: 'beehouse' }, t);
  s.act(m, { kind: 'farmPlace', item: 'beehouse', tile: 5 }, t);
  s.fails(m, { kind: 'farmCollect', tile: 5 }, t + BEE_MS - 1, FARM_REJECT.nothing);
  s.act(m, { kind: 'farmCollect', tile: 5 }, t + BEE_MS);
  assert.equal(s.life.farmx[m.id].goods.honey, 1);
  s.seeds(m, 'zinnia', 1);
  s.act(m, { kind: 'plant', plot: 3, crop: 'zinnia' }, t + BEE_MS);
  s.act(m, { kind: 'farmCollect', slot: -1 }, t + 2 * BEE_MS);
  assert.equal(s.life.farmx[m.id].goods['honey-zinnia'], 1);
});

test('seed maker: one crop → 1–2 seeds of the same crop in 2 hours', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  s.level(m, 'farm', 9);
  s.give(m, 'wood', 20);
  s.give(m, 'copper', 5);
  s.give(m, 'iron', 1);
  s.act(m, { kind: 'farmBuild', item: 'seedmaker' }, t);
  s.act(m, { kind: 'farmPlace', item: 'seedmaker', slot: 3 }, t);
  s.crops(m, 'chamoe', 1);
  s.seeds(m, 'chamoe', 0);
  s.act(m, { kind: 'farmLoad', slot: 3, item: 'chamoe' }, t);
  s.act(m, { kind: 'farmCollect', slot: 3 }, t + 2 * HOUR);
  const n = s.life.bag[m.id].seeds.chamoe;
  assert.ok(n === 1 || n === 2, String(n));
});

// ------------------------------------------------------------ shipping bin
test('shipping bin: sells at the first action after KST midnight, as that day’s first sales', () => {
  const s = world(1),
    [m] = s.members,
    t = kst(2026, 10, 13, 22);
  s.crops(m, 'carrot', 10);
  s.crops(m, 'strawberry', 2, 2);
  s.act(m, { kind: 'ship', item: 'carrot', n: 10 }, t);
  s.act(m, { kind: 'ship', item: 'strawberry', q: 2, n: 2 }, t);
  s.act(m, { kind: 'unship', item: 'carrot', n: 4 }, t);
  assert.equal(s.life.bag[m.id].produce.carrot, 4);
  const v = s.view(m, t);
  assert.equal(v.farmx.bin.items.length, 2);
  assert.equal(v.farmx.bin.payAt, kst(2026, 10, 14, 0));
  // Nothing is paid on the same day.
  const b0 = s.balance(m);
  s.act(m, { kind: 'status', text: '' }, t + 30 * MIN);
  assert.equal(s.balance(m), b0);
  // After midnight the first action pays, with the demand curve starting from 0,
  // at the bin's 85% (가게 나누기: only the 농협 counter pays the full price).
  const next = kst(2026, 10, 14, 7);
  s.act(m, { kind: 'status', text: '' }, next);
  const expected =
    [0, 1, 2, 3, 4, 5].reduce((sum, k) => sum + Math.round(Math.round(CROP_INFO.carrot.sell * demandMult('carrot', k)) * 0.85), 0) +
    [0, 1].reduce((sum, k) => sum + Math.round(Math.round(Math.round(CROP_INFO.strawberry.sell * 1.5) * demandMult('strawberry', k)) * 0.85), 0);
  assert.equal(s.balance(m) - b0, expected);
  assert.equal(s.life.farmx[m.id].bin, undefined);
  // …and it counts as today's demand (no second full price for the same carrots).
  assert.equal(s.view(m, next).me.demand.carrot, 6);
  assert.equal(s.life.farmx[m.id].log.at(-1).kind, 'ship');
});

// ------------------------------------------------------------ friends
test('helping a friend harvest: crops go to the owner, once a day, bond and XP for the helper', () => {
  const s = world(2),
    [a, b] = s.members,
    t = SUMMER;
  s.seeds(b, 'carrot', 3);
  s.act(b, { kind: 'plant', plot: -1, crop: 'carrot' }, t);
  s.fails(a, { kind: 'harvestFriend', owner: 1 }, t + MIN, LIFE_REJECT.nothingReady);
  const ripe = t + CROP_INFO.carrot.growMs;
  s.act(a, { kind: 'harvestFriend', owner: 1 }, ripe);
  assert.equal(s.life.bag[b.id].produce.carrot, 3);
  assert.equal(s.life.bag[a.id].produce.carrot, 0);
  assert.ok((s.life.growth?.u?.[a.id]?.xp?.farm ?? 0) > 0);
  assert.ok((s.life.bonds?.['0-1'] ?? 0) > 0);
  s.fails(a, { kind: 'harvestFriend', owner: 1 }, ripe + MIN, FARM_REJECT.helped);
  s.fails(a, { kind: 'harvestFriend', owner: 0 }, ripe + MIN, FARM_REJECT.friendFarm);
  assert.deepEqual(s.view(a, ripe).farmx.helped, [1]);
});

// ------------------------------------------------------------ fair and money
test('품평회: fee in, prizes out of the fees only, judged after the week ends', () => {
  const s = world(4),
    t = kst(2026, 10, 13, 12); // Tuesday
  const items = [
    ['carrot', 0],
    ['strawberry', 2],
    ['pumpkin', 1],
    ['tomato', 0],
  ];
  s.members.forEach((m, i) => s.crops(m, items[i][0], 1, items[i][1]));
  const money = () => s.members.reduce((sum, m) => sum + s.balance(m), 0);
  const before = money();
  s.members.forEach((m, i) => s.act(m, { kind: 'fairEnter', item: items[i][0], q: items[i][1] }, t + i * MIN));
  s.fails(s.members[0], { kind: 'fairEnter', item: 'carrot' }, t + HOUR, FARM_REJECT.fairDone);
  assert.equal(before - money(), 4 * FAIR_FEE);
  const view = s.view(s.members[0], t + HOUR).fair;
  assert.equal(view.entries.length, 4);
  assert.equal(view.judge.name, '나세라');
  // Monday after: the first action judges it.
  const monday = kst(2026, 10, 19, 9);
  s.act(s.members[3], { kind: 'status', text: '' }, monday);
  const res = s.life.fair.results.at(-1);
  assert.equal(res.pot, 4 * FAIR_FEE);
  assert.deepEqual(res.ranks.map((r) => r.actor), [1, 2, 3]);
  assert.deepEqual(res.ranks.map((r) => r.prize), [4_000, 2_400, 1_600]);
  const paid = res.ranks.reduce((sum, r) => sum + r.prize, 0);
  assert.ok(paid <= res.pot);
  assert.equal(before - money(), 4 * FAIR_FEE - paid);
  assert.deepEqual(s.life.fair.entries, []);
});

test('no minting: selling a flood of goods stays under the daily market ceiling', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  const x = ((s.life.farmx ??= {})[m.id] ??= {});
  x.goods = { 'keg-insam@2': 40, 'dry-strawberry@2': 40 };
  const b = s.balance(m);
  s.act(m, { kind: 'sellGoods', item: 'keg-insam', q: 2, n: 1, at: 'coop' }, t);
  const first = s.balance(m) - b;
  assert.equal(first, Math.round(goodsById()['keg-insam'].base * 1.5));
  // Everything else sells into the saturated market: the day's total stays capped
  // (a last single unit may run past the ceiling, which then counts as reached).
  let sold = first,
    last = 0;
  for (let i = 0; i < 20; i++) {
    for (const [item, q] of [['keg-insam', 2], ['dry-strawberry', 2]]) {
      try {
        const before = s.balance(m);
        s.act(m, { kind: 'sellGoods', item, q, n: 1, at: 'coop' }, t + i);
        last = s.balance(m) - before;
        sold += last;
      } catch (e) {
        if (!(e instanceof LifeError)) throw e;
      }
    }
  }
  assert.ok(sold - last <= 100_000, String(sold));
  assert.ok(sold < 100_000 + last + 1 && last < 20_000, String(last));
  assert.ok(marketMult(sold) < 0.2);
});

test('the ledger invariant holds through a farming week with every new action', () => {
  const s = world(3),
    [a, b, c] = s.members;
  const t = SUMMER;
  for (const m of s.members) {
    s.level(m, 'farm', 10);
    s.level(m, 'craft', 4);
    s.level(m, 'forage', 4);
    for (const [id, n] of Object.entries({ wood: 200, stone: 60, copper: 30, iron: 20, gold: 10, gem: 2, 'fertilizer-deluxe': 3 })) s.give(m, id, n);
    for (const item of ['sprinkler', 'sprinkler-q', 'scarecrow', 'beehouse', 'jar', 'keg', 'dehydrator', 'seedmaker', 'fertilizer-star'])
      s.act(m, { kind: 'farmBuild', item }, t);
    s.act(m, { kind: 'farmPlace', item: 'sprinkler-q', tile: 1 }, t);
    s.act(m, { kind: 'farmPlace', item: 'scarecrow', tile: 4 }, t);
    ['jar', 'keg', 'dehydrator', 'seedmaker'].forEach((item, slot) => s.act(m, { kind: 'farmPlace', item, slot }, t));
    s.seeds(m, 'blueberry', 20);
  }
  for (let d = 0; d < 7; d++) {
    for (const m of s.members) {
      const at = t + d * DAY;
      try {
        s.act(m, { kind: 'harvest', plot: -1 }, at);
      } catch (e) {
        if (!(e instanceof LifeError)) throw e;
      }
      try {
        s.act(m, { kind: 'plant', plot: -1, crop: 'blueberry' }, at);
      } catch (e) {
        if (!(e instanceof LifeError)) throw e;
      }
      for (const [slot, item] of [[0, 'blueberry'], [1, 'blueberry'], [3, 'blueberry']])
        try {
          s.act(m, { kind: 'farmLoad', slot, item }, at + MIN);
        } catch (e) {
          if (!(e instanceof LifeError)) throw e;
        }
      try {
        s.act(m, { kind: 'farmCollect', slot: -1 }, at + 2 * MIN);
      } catch (e) {
        if (!(e instanceof LifeError)) throw e;
      }
      const v = s.view(m, at + 3 * MIN);
      for (const g of v.farmx.goods) s.act(m, { kind: 'ship', item: g.id, q: g.q, n: g.n }, at + 3 * MIN);
    }
    try {
      s.act(a, { kind: 'harvestFriend', owner: 1 }, t + d * DAY + 20 * HOUR);
    } catch (e) {
      if (!(e instanceof LifeError)) throw e;
    }
  }
  s.act(c, { kind: 'status', text: '' }, t + 8 * DAY);
  invariant(s.ledger);
  assert.ok(s.ledger.granted > 0);
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(s.life))), s.life);
  assert.ok(JSON.stringify(s.life).length < 60_000);
  void b;
});

test('settleFarmPlots is idempotent and a view never writes', () => {
  const s = world(1),
    [m] = s.members;
  s.seeds(m, 'watermelon', 1);
  s.act(m, { kind: 'plant', plot: 0, crop: 'watermelon' }, kst(2026, 10, 18, 20));
  const snap = JSON.stringify(s.life);
  s.view(m, kst(2026, 10, 20, 12));
  assert.equal(JSON.stringify(s.life), snap);
  const copy = structuredClone(s.life);
  settleFarmPlots(copy, m.id, kst(2026, 10, 20, 12));
  const once = JSON.stringify(copy);
  settleFarmPlots(copy, m.id, kst(2026, 10, 20, 12));
  assert.equal(JSON.stringify(copy), once);
});

// ------------------------------------------------------------ audit fixes (10월 3일)
test('top goods: one unit worth more than the daily cap still sells at the 농협, from the bag and from the bin', () => {
  const s = world(1),
    [m] = s.members,
    t = kst(2026, 10, 13, 10);
  const x = ((s.life.farmx ??= {})[m.id] ??= {});
  x.goods = { 'keg-insam@3': 3, 'dry-watermelon@3': 3 };
  const insam = Math.round(goodsById()['keg-insam'].base * QUALITY_MULT[3]),
    melon = Math.round(goodsById()['dry-watermelon'].base * QUALITY_MULT[3]);
  assert.equal(insam, 108_000);
  assert.equal(melon, 120_050);
  assert.equal(sellCapAllows(insam, 1, 100_000), true);
  assert.equal(sellCapAllows(insam, 1, 0), false);
  assert.equal(sellCapAllows(2 * insam, 2, 100_000), false);
  // Two at once are still refused; one alone sells at the full price.
  s.fails(m, { kind: 'sellGoods', item: 'keg-insam', q: 3, n: 2, at: 'coop' }, t);
  let b = s.balance(m);
  s.act(m, { kind: 'sellGoods', item: 'keg-insam', q: 3, n: 1, at: 'coop' }, t);
  assert.equal(s.balance(m) - b, insam);
  // The day's cap now counts as reached: nothing more sells today.
  assert.ok(s.view(m, t).sellCapLeft <= 0);
  s.fails(m, { kind: 'sellGoods', item: 'keg-insam', q: 3, n: 1, at: 'coop' }, t + MIN);
  s.fails(m, { kind: 'sellGoods', item: 'dry-watermelon', q: 3, n: 1 }, t + MIN);
  // Next day, from the bag (85%): the 별빛 dried watermelon is over the cap too.
  b = s.balance(m);
  s.act(m, { kind: 'sellGoods', item: 'dry-watermelon', q: 3, n: 1 }, t + DAY);
  assert.equal(s.balance(m) - b, Math.round(melon * 0.85));
  // The shipping bin sells one such unit per settlement and keeps the rest.
  s.act(m, { kind: 'ship', item: 'dry-watermelon', q: 3, n: 2 }, t + DAY + HOUR);
  b = s.balance(m);
  s.act(m, { kind: 'status', text: '' }, t + 2 * DAY);
  assert.equal(s.balance(m) - b, Math.round(melon * 0.85));
  assert.deepEqual(s.life.farmx[m.id].bin.items, { 'dry-watermelon@3': 1 });
  b = s.balance(m);
  s.act(m, { kind: 'status', text: '' }, t + 3 * DAY);
  assert.equal(s.balance(m) - b, Math.round(melon * 0.85));
  assert.equal(s.life.farmx[m.id].bin, undefined);
});

test('regrow keeps the planting’s quality (g) and watering-can (w) bonuses', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  s.level(m, 'farm', 3);
  s.life.growth.u[m.id].tools = { can: 5, hoe: 5 };
  s.seeds(m, 'blueberry', 1);
  s.act(m, { kind: 'plant', plot: 0, crop: 'blueberry' }, t);
  s.act(m, { kind: 'water', plot: 0 }, t);
  const p = s.life.farms[m.id][0];
  assert.equal(p.g, 12 + 2);
  assert.equal(p.w, 20);
  const ready = plotReadyAt(p, t);
  s.act(m, { kind: 'harvest', plot: 0 }, ready);
  const again = s.life.farms[m.id][0];
  assert.equal(again.n, 1);
  assert.equal(again.g, 14);
  assert.equal(again.w, 20);
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(s.life))).farms[m.id][0], again);
});

test('sprinklers water with the owner’s watering-can bonus when it is better', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  s.life.farmx = { [m.id]: { fx: { 1: { k: 'sprinkler-q', at: t - HOUR } } } };
  s.level(m, 'farm', 1);
  s.life.growth.u[m.id].tools = { can: 5 };
  s.seeds(m, 'blueberry', 1);
  s.act(m, { kind: 'plant', plot: 0, crop: 'blueberry' }, t);
  const p = s.life.farms[m.id][0];
  assert.equal(p.wateredAt, t);
  assert.equal(p.w, 20);
  assert.equal(plotReadyAt(p, t), t + Math.ceil(CROP_INFO.blueberry.growMs * (1 - 0.4 - 20 / 100)));
  // A low-tier can: the sprinkler's own bonus still counts.
  s.life.growth.u[m.id].tools = { can: 2 };
  s.seeds(m, 'blueberry', 1);
  s.act(m, { kind: 'plant', plot: 2, crop: 'blueberry' }, t);
  assert.equal(s.life.farms[m.id][2].w, 5);
});

test('skill perk labels match the real recipe gates (no "after a region" note)', () => {
  const recipes = [...FIXTURES, ...MACHINES].filter((d) => d.id !== 'sprinkler-s' && d.id !== 'scarecrow');
  const label = { jar: '옹기', keg: '숙성통', dehydrator: null, seedmaker: '씨앗 제조기', beehouse: '벌통', sprinkler: '기본 스프링클러', 'sprinkler-q': '품질 스프링클러' };
  for (const d of recipes) {
    if (!label[d.id]) continue;
    const perk = LEVEL_PERKS[d.recipe.skill].find((p) => p.text.includes(label[d.id]));
    assert.ok(perk, d.id);
    assert.equal(perk.level, d.recipe.level, d.id);
    assert.equal(perk.soon, undefined, d.id);
  }
});

test('E key: 온실지기 plants off-season seeds; 별빛 비료 · 성장 촉진제 · 보습 흙 work like the panel', () => {
  const s = world(1),
    [m] = s.members,
    t = kst(2026, 10, 20, 10); // autumn
  assert.equal(seasonOf(t), 'autumn');
  s.seeds(m, 'watermelon', 3);
  let v = s.view(m, t);
  assert.equal(farmToolAction(v.me.farm, v.me, 'seed-watermelon', t, 'autumn', plantsAnySeason(v)), null);
  s.fails(m, { kind: 'plant', plot: -1, crop: 'watermelon' }, t);
  // 온실지기 (farm-a2): the E path, like the server, now plants them.
  s.level(m, 'farm', 10);
  s.life.growth.u[m.id].prof = ['farm-a', 'farm-a2'];
  v = s.view(m, t);
  assert.equal(plantsAnySeason(v), true);
  const plant = farmToolAction(v.me.farm, v.me, 'seed-watermelon', t, 'autumn', plantsAnySeason(v));
  assert.equal(plant.n, 3);
  s.act(m, { kind: 'plant', plot: -1, crop: 'watermelon' }, t);
  assert.equal(s.life.farms[m.id].filter((p) => p.crop === 'watermelon').length, plant.n);
  // Soil items: the quick action counts exactly the plots the server treats.
  s.give(m, 'fertilizer-star', 5);
  s.give(m, 'speed-gro', 2);
  s.give(m, 'retaining', 5);
  s.life.farms[m.id][1].fert = 3;
  for (const [item, field] of [['fertilizer-star', 'fert'], ['speed-gro', 'sg'], ['retaining', 'rs']]) {
    v = s.view(m, t + MIN);
    const quick = farmToolAction(v.me.farm, v.me, item, t + MIN, 'autumn', true);
    assert.ok(quick && quick.kind === 'fertilize', item);
    const before = s.life.ext[m.id].inv[item];
    s.act(m, { kind: 'fertilize', plot: -1, item }, t + MIN);
    assert.equal(before - (s.life.ext[m.id].inv?.[item] ?? 0), quick.n, item);
    assert.ok(s.life.farms[m.id].filter((p) => p.crop && p[field]).length >= quick.n, item);
    v = s.view(m, t + MIN);
    const left = farmToolAction(v.me.farm, v.me, item, t + MIN, 'autumn', true);
    if (left) s.act(m, { kind: 'fertilize', plot: -1, item }, t + MIN);
  }
  assert.equal(farmToolAction(s.view(m, t + MIN).me.farm, s.view(m, t + MIN).me, 'retaining', t + MIN, 'autumn', true), null);
});

test('orchard fruit goes in the jar (2× + 50), the keg (3×) and the dryer, not the seed maker', () => {
  const s = world(1),
    [m] = s.members,
    t = SUMMER;
  s.life.farmx = { [m.id]: { mach: { 0: { k: 'jar' }, 1: { k: 'keg' }, 2: { k: 'dehydrator' }, 3: { k: 'seedmaker' } } } };
  s.give(m, 'apricot', 7);
  s.give(m, 'peach', 1);
  s.fails(m, { kind: 'farmLoad', slot: 3, item: 'apricot' }, t, FARM_REJECT.machineInput);
  s.fails(m, { kind: 'farmLoad', slot: 0, item: 'apricot', q: 1 }, t, LIFE_REJECT.quality);
  s.act(m, { kind: 'farmLoad', slot: 0, item: 'apricot' }, t);
  s.act(m, { kind: 'farmLoad', slot: 1, item: 'peach', q: 0 }, t);
  s.act(m, { kind: 'farmLoad', slot: 2, item: 'apricot' }, t);
  assert.equal(s.life.ext[m.id].inv.apricot, 1);
  assert.equal(s.life.ext[m.id].inv.peach, undefined);
  s.fails(m, { kind: 'farmLoad', slot: 2, item: 'apricot' }, t, FARM_REJECT.machineBusy);
  s.act(m, { kind: 'farmCollect', slot: -1 }, t + DAY);
  assert.deepEqual(s.life.farmx[m.id].goods, { 'jar-apricot': 1, 'keg-peach': 1, 'dry-apricot': 1 });
  const g = goodsById();
  assert.equal(g['jar-apricot'].base, 2 * ITEM_BY_ID.apricot.sell + 50);
  assert.equal(g['keg-peach'].base, 3 * ITEM_BY_ID.peach.sell);
  assert.equal(g['dry-apricot'].base, Math.round(7.5 * ITEM_BY_ID.apricot.sell + 25));
  assert.equal(stockName('jar-apricot'), '살구 잼');
  assert.equal(stockName('keg-peach'), '복숭아주');
  assert.equal(stockName('apricot'), '살구');
  const b = s.balance(m);
  s.act(m, { kind: 'sellGoods', item: 'keg-peach', n: 1, at: 'coop' }, t + DAY);
  assert.equal(s.balance(m) - b, g['keg-peach'].base);
  // Raw orchard fruit still cannot go in the shipping bin or the fair (they sell at 하쿠's).
  s.fails(m, { kind: 'ship', item: 'apricot', n: 1 }, t + DAY, FARM_REJECT.item);
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(s.life))), s.life);
});
