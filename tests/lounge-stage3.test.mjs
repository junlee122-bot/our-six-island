// 마을 확장 3단계 (handover/design/design-npcs-stage3.md): ④ 목장·과수원 and
// ⑤ 산기슭 마을, their unlocks, maps and rooms, the five residents (schedules,
// romance, art records) and the server systems (animals, fruit trees, range
// upgrades, ore buying, clinic, fortune), with the ledger checked after every
// action.
import { GAME_MINUTE_MS, dayStart, gameDay } from '../app/lounge-calendar.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { emptyLife, ensureLifeMember, lifeAction, lifeView, LifeError } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, validateLedger, kstDay, flowBucket } from '../app/lounge-economy.ts';
import { NPC_IDS, NPCS, STAGE3_NPCS, NPC_BONDS, NPC_DATING_POINTS } from '../app/lounge-npc-data.ts';
import { NPC_CHIBI } from '../app/lounge-npc-chibi.ts';
import { LOUNGE_ASSETS } from '../app/lounge-assets.ts';
import { NPC_PLACES, npcCanStand, npcPlan, npcSpot, npcDayStart } from '../app/lounge-npc-schedule.ts';
import { NPC_LINES, allNpcLines, npcBanter } from '../app/lounge-npc-dialog.ts';
import { NPC_LOVE, allNpcLoveLines } from '../app/lounge-npc-love.ts';
import { BUILT_DISTRICTS, DISTRICTS, districtOpen, goalProgressText } from '../app/lounge-districts.ts';
import { districtsView, settleDistrictUnlocks, villageMineDeep } from '../app/lounge-district-unlocks.ts';
import { REGIONS, regionWalk, regionToNetwork, nearestExit } from '../app/lounge-areas.ts';
import { AREAS, AREA_DEFAULTS, chatScope } from '../app/lounge-games.ts';
import { districtCounters, shopDoorOutside } from '../app/lounge-district-counters.ts';
import { districtMinimap } from '../app/lounge-district-minimap.ts';
import { RANCH_SPOTS } from '../app/lounge-ranch-layout.ts';
import { FOOTHILL_SPOTS } from '../app/lounge-foothill-layout.ts';
import { SHOP_INTERIORS } from '../app/lounge-shop-interiors.ts';
import { RESEARCH_BY_ID } from '../app/lounge-growth-data.ts';
import { areaSurface } from '../app/lounge-footsteps.ts';
import { AREA_SOUND, MUSIC_PLACES } from '../app/lounge-music-tracks.ts';
import { PIECES } from '../app/lounge-music-pieces.ts';
import { buyerOf } from '../app/lounge-shops.ts';
import { buffPower } from '../app/lounge-food-data.ts';
import { readLifeExt } from '../app/lounge-life-plus.ts';
import { STOCK_SHOPS, shopSalesSince } from '../app/lounge-shop-sales.ts';
import { seasonOfDay, weekdayOf } from '../app/lounge-calendar.ts';
import {
  ANIMALS,
  ANIMAL_BOND,
  CLINIC_PER_DAY,
  COOP_ROOM,
  FORTUNE_PRICE,
  HAY_PRICE,
  ORCHARD_GROW_DAYS,
  ORE_PREMIUM_CAP,
  SAPLINGS,
  SMITH_COST,
  fortuneOpenOn,
  oreOfDay,
  stage3ActionAreas,
} from '../app/lounge-stage3-data.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { tillField } from './farm-test-help.mjs';

const HOUR = 3_600_000;
const T0 = Date.UTC(2026, 9, 1, 3); // 12:00 KST, Thursday 2026-10-01
const DAY0 = kstDay(T0);
/** Game h:m on real KST day DAY0 + d (its game day in real hour 12; 게임 하루 = 실제 1시간). */
const at = (d, h = 12, m = 0) => npcDayStart(gameDay(dayStart(DAY0 + d)) + 12) + (h * 60 + m) * GAME_MINUTE_MS;
/** The first day offset ≥ `from` whose KST day passes `ok`. */
const dayWhere = (ok, from = 0) => {
  for (let d = from; d < from + 60; d++) if (ok(DAY0 + d)) return d;
  throw new Error('no such day');
};
const OPEN = ['district-ranch', 'district-foothill'];

function world(n = 1, flags = OPEN) {
  const members = Array.from({ length: n }, (_, i) => ({ id: `3333333${i}-1111-4111-8111-111111111111`, actor: i }));
  let life = emptyLife();
  let ledger = newLoungeLedger();
  for (const m of members) {
    life = ensureLifeMember(life, m.id, m.actor);
    // 우리 농장 F2: fields start as grass; these tests start from a tilled field.
    tillField(life, m.id);
    ledger = registerWallet(ledger, `wallet-${m.id}`);
  }
  life.flags = [...flags];
  life.ext = Object.fromEntries(members.map((m) => [m.id, { inv: {} }]));
  const s = {
    members,
    get life() {
      return life;
    },
    get ledger() {
      return ledger;
    },
    act(member, action, now = T0) {
      const r = lifeAction(life, ledger, member, action, now);
      life = r.life;
      ledger = r.ledger;
      validateLedger(ledger);
      const total = Object.values(ledger.accounts).reduce((a, b) => a + b, 0) + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0);
      assert.equal(total, Object.keys(ledger.accounts).length * 100_000, 'ledger invariant');
      return lifeView(life, member.id, member.actor, now);
    },
    fails(member, action, re, now = T0) {
      assert.throws(() => lifeAction(life, ledger, member, action, now), (e) => e instanceof LifeError && re.test(e.message));
    },
    give(member, item, n) {
      const x = (life.ext[member.id] ??= {});
      x.inv = { ...x.inv, [item]: (x.inv?.[item] ?? 0) + n };
    },
    inv: (member, item) => life.ext?.[member.id]?.inv?.[item] ?? 0,
    view: (member, now = T0) => lifeView(life, member.id, member.actor, now),
  };
  return s;
}
const wallet = (s, m) => s.ledger.accounts[`wallet-${m.id}`];

// ---------------------------------------------------------------- districts and unlocks
test('the ranch opens with 들길 개간, the foothill at mine floor 10; flags never close', () => {
  assert.deepEqual([...BUILT_DISTRICTS], ['farm', 'market', 'harbor', 'hillside', 'ranch', 'foothill']);
  assert.equal(RESEARCH_BY_ID.orchardHill.live, true);
  const s = world(2, []);
  const [a, b] = s.members;
  assert.equal(districtOpen('ranch', { flags: [] }), false);
  assert.equal(districtOpen('foothill', { flags: [] }), false);
  let v = s.view(a).districts;
  assert.equal(goalProgressText('ranch', v.goals), '들길 개간 연구 전');
  assert.equal(goalProgressText('foothill', v.goals), '광산 0/10층');
  // 들길 개간 finished (its research flag): the next action records the district.
  s.life.flags.push('orchardHill');
  assert.deepEqual(settleDistrictUnlocks(s.life, T0), ['ranch']);
  assert.ok(s.life.flags.includes('district-ranch'));
  // One friend deep in the mine opens the foothill for everyone.
  const growth = (s.life.growth ??= {});
  (growth.u ??= {})[b.id] = { ...(growth.u[b.id] ?? {}), mine: { at: 0, deep: 10 } };
  assert.equal(villageMineDeep(s.life), 10);
  assert.deepEqual(settleDistrictUnlocks(s.life, T0), ['foothill']);
  v = districtsView(s.life, a.actor, T0);
  assert.ok(v.open.includes('ranch') && v.open.includes('foothill'));
  // Never closes again, even if the numbers behind it change.
  s.life.growth.u[b.id].mine.deep = 3;
  s.life.flags = s.life.flags.filter((f) => f !== 'orchardHill');
  assert.deepEqual(settleDistrictUnlocks(s.life, T0), []);
  assert.ok(districtOpen('ranch', { flags: s.life.flags }) && districtOpen('foothill', { flags: s.life.flags }));
  // The news and the shared memory say so once.
  const news = s.life.news.flatMap((d) => d.lines.map((l) => l.key));
  assert.ok(news.includes('district:ranch') && news.includes('district:foothill'));
});

test('the server lets you into ④ and ⑤ (and their rooms) only once they are open', async () => {
  let w = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const p = { id: crypto.randomUUID(), actor: 0, username: ACCOUNT_IDS[0], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' };
  const run = async (op, extra = {}) => {
    const command = { op, connection: p.connection, ...(p.code ? { code: p.code } : {}), ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}), ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
    const r = cloudTransition(w, p, command, await commandHash(command), T0);
    w = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    return r.response;
  };
  await run('wallet');
  await run('open', { code: 'BEMTADUVLY' });
  for (const area of ['ranch', 'foothill', 'barn', 'smithy']) {
    const r = await run('action', { action: { kind: 'area', area, x: 50, y: 80 } });
    assert.ok(r.error, `${area} shut`);
  }
  w.life.flags = [...(w.life.flags ?? []), ...OPEN];
  for (const area of ['ranch', 'barn', 'orchardShop', 'foothill', 'smithy', 'clinic']) {
    const r = await run('action', { action: { kind: 'area', area, x: 50, y: 80 } });
    assert.ok(!r.error, `${area}: ${r.error}`);
  }
  // A stage-3 action away from its district is refused (and nothing is paid).
  await run('action', { action: { kind: 'area', area: 'village', x: 50, y: 60 } });
  const before = w.ledger.accounts[Object.keys(w.ledger.accounts)[0]];
  const r = await run('action', { action: { kind: 'hayBuy', n: 2 } });
  assert.match(r.error ?? '', /목장·과수원에 가서/);
  assert.equal(w.ledger.accounts[Object.keys(w.ledger.accounts)[0]], before);
  assert.deepEqual(stage3ActionAreas('animalCare'), ['ranch', 'barn']);
  assert.deepEqual(stage3ActionAreas('fortuneRead', true), ['foothill', 'village']);
});

test('ranch and foothill are walkable maps with counters, rooms, exits, minimaps, music and footsteps', () => {
  for (const area of ['ranch', 'foothill']) {
    assert.ok(AREAS.includes(area));
    assert.equal(chatScope(area), 'village');
    const r = REGIONS[area];
    assert.deepEqual([r.bounds.w, r.bounds.d], [DISTRICTS[area].size.w, DISTRICTS[area].size.d]);
    const w = regionWalk(area);
    const arrive = r.arrive.village;
    assert.ok(w.canWalk(arrive), `${area} arrival walkable`);
    assert.deepEqual(AREA_DEFAULTS[area], regionToNetwork(area, arrive));
    assert.equal(nearestExit(area, r.exits[0].stand)?.to, 'village');
    for (const e of r.exits) {
      assert.ok(w.canWalk(e.stand), `${area} ${e.id} stand`);
      const end = w.path(arrive, e.stand).at(-1);
      assert.ok(end && Math.hypot(end.x - e.stand.x, end.z - e.stand.z) < 0.1, `${area} → ${e.id}`);
    }
    for (const weekday of [0, 3])
      for (const c of districtCounters(area, weekday)) {
        assert.ok(w.canWalk(c), `${area} ${c.a.label} walkable`);
        const end = w.path(arrive, c).at(-1);
        assert.ok(end && Math.hypot(end.x - c.x, end.z - c.z) < 0.8, `${area} ${c.a.label} reachable`);
      }
    const map = districtMinimap(area, 0);
    assert.ok(map && map.shapes.length > 5 && map.places.length >= 3, `${area} minimap`);
    for (const p of map.places) assert.ok(w.canWalk(p.go), `${area} minimap ${p.label}`);
    // Its own piece and ambience; footsteps from its paving.
    assert.ok(MUSIC_PLACES.includes(area) && PIECES[area] && AREA_SOUND[area]?.music === area);
  }
  assert.equal(REGIONS.foothill.exits.find((e) => e.to === 'mine')?.label, '산기슭 광산 들어가기');
  assert.ok(REGIONS.mine.arrive.foothill, 'the mine has an arrival from the foothill');
  assert.equal(areaSurface('ranch', { x: 0, z: -8 }), 'planks');
  assert.equal(areaSurface('ranch', { x: 20, z: 20 }), 'grass');
  assert.equal(areaSurface('foothill', { x: 0, z: 14 }), 'gravel');
  assert.equal(areaSurface('foothill', { x: 2, z: 5 }), 'stone');
  // Each building door leads into its room and back out onto walkable ground.
  for (const room of ['barn', 'orchardShop', 'smithy', 'clinic']) {
    const def = SHOP_INTERIORS[room];
    const door = districtCounters(def.district, 1).find((c) => c.a.kind === 'counter' && c.a.enter === room);
    assert.ok(door, `${room} door`);
    const out = shopDoorOutside(room);
    assert.equal(out.district, def.district);
    assert.ok(regionWalk(out.district).canWalk(out.at), `${room} way out walkable`);
  }
  // Every resident spot up here is standable.
  for (const [k, p] of Object.entries(RANCH_SPOTS)) assert.ok(npcCanStand('ranch', p), `ranch ${k}`);
  for (const [k, p] of Object.entries(FOOTHILL_SPOTS)) assert.ok(npcCanStand('foothill', p), `foothill ${k}`);
});

// ---------------------------------------------------------------- residents
test('five adult residents, each with art, chibi, gifts, bonds, lines and love lines', () => {
  assert.deepEqual([...STAGE3_NPCS], ['nilah', 'haku', 'ornn', 'mercy', 'shinichi']);
  for (const id of STAGE3_NPCS) {
    const n = NPCS[id];
    assert.ok(NPC_IDS.includes(id));
    assert.ok(n.age >= 20, `${id} is an adult`);
    assert.equal(n.stage, 3);
    assert.equal(n.art.kind, 'image');
    assert.ok(fs.existsSync(new URL(`../public${n.art.asset}`, import.meta.url)), `${id} art`);
    assert.ok(fs.existsSync(new URL(`../public${n.art.portrait}`, import.meta.url)), `${id} portrait`);
    assert.ok(NPC_CHIBI[id] && fs.existsSync(new URL(`../public${NPC_CHIBI[id].asset}`, import.meta.url)), `${id} chibi`);
    assert.ok(n.gifts.loved.length && n.gifts.liked.length && n.gifts.disliked.length);
    assert.ok(NPC_BONDS.some((b) => b.a === id || b.b === id), `${id} has bonds`);
    assert.ok(NPC_LINES[id] && allNpcLines(id).length >= 80, `${id} lines`);
    assert.ok(NPC_LOVE[id] && allNpcLoveLines(id).length >= 90, `${id} love lines`);
  }
  // Every stage-3 bond has its own bubbles.
  for (const b of NPC_BONDS.filter((x) => STAGE3_NPCS.includes(x.a) || STAGE3_NPCS.includes(x.b)))
    assert.ok(npcBanter(b.a, b.b, 'k'), `${b.a}–${b.b} banter`);
  // 신이치: the 코난 disguise is only a joke in his everyday lines, never in romance.
  for (const line of allNpcLoveLines('shinichi')) assert.doesNotMatch(line, /코난|변장|어린|꼬마|아이 모습/);
  assert.ok(allNpcLines('shinichi').some((l) => /변장/.test(l)));
});

test('art records: the keying script wrote the web copies and their hashes', () => {
  const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(new URL(`../public/assets/lounge/${p}`, import.meta.url))).digest('hex').toUpperCase();
  const stage3 = JSON.parse(fs.readFileSync(new URL('../public/assets/lounge/stage3-npcs-generation.json', import.meta.url), 'utf8'));
  const chibi = JSON.parse(fs.readFileSync(new URL('../public/assets/lounge/npc-chibi-generation.json', import.meta.url), 'utf8'));
  for (const id of STAGE3_NPCS) {
    for (const file of [`npc-${id}.webp`, `npc-${id}-portrait.webp`]) {
      assert.ok(stage3.web?.[file], `${file} recorded`);
      assert.equal(stage3.web[file].sha256, sha(file), `${file} hash`);
    }
    assert.deepEqual([stage3.web[`npc-${id}.webp`].w, stage3.web[`npc-${id}.webp`].h], [660, 990]);
    const c = chibi.web[id];
    assert.ok(c, `${id} chibi recorded`);
    assert.equal(c.sha256, sha(c.file), `${id} chibi hash`);
    assert.deepEqual([c.w, c.h], [NPC_CHIBI[id].w, NPC_CHIBI[id].h]);
    // The originals are listed with their generation jobs.
    assert.ok(stage3.assets.some((a) => a.original === `_originals/npc-${id}.png` && a.job), `${id} original`);
    assert.ok(stage3.assets.some((a) => a.original === `_originals/chibi/npc-chibi-${id}.png` && a.job), `${id} chibi original`);
    assert.equal(LOUNGE_ASSETS[`chibi_${id}`], `/assets/lounge/${c.file}`);
  }
});

test('schedules: hidden beyond the gates until open; then at work in their districts, 신이치 on weekends and festivals', () => {
  const shut = {},
    open = { ranch: true, foothill: true };
  for (const id of STAGE3_NPCS)
    for (const h of [3, 10, 15, 22]) {
      const s = npcSpot(id, at(1, h), shut);
      assert.equal(s.visible, false, `${id} hidden at ${h}:00 while shut`);
      assert.ok(['fields', 'mountain', 'away'].includes(s.area), `${id} ${s.area}`);
    }
  const weekday = dayWhere((d) => weekdayOf(d) === 2 && !fortuneOpenOn(d));
  assert.equal(npcSpot('nilah', at(weekday, 10), open).area, 'barn');
  assert.equal(npcSpot('haku', at(weekday, 10), open).area, 'orchardShop');
  assert.equal(npcSpot('ornn', at(weekday, 10), open).area, 'smithy');
  assert.equal(npcSpot('mercy', at(weekday, 10), open).area, 'clinic');
  assert.equal(npcSpot('shinichi', at(weekday, 11), open).area, 'away');
  const sat = dayWhere((d) => weekdayOf(d) === 6);
  const tent = npcSpot('shinichi', at(sat, 11), open);
  assert.equal(tent.place, 'fh.tent');
  assert.equal(tent.visible, true);
  // Every place of their days exists and is standable; nobody sleeps outdoors.
  for (let d = 0; d < 14; d++)
    for (const id of STAGE3_NPCS)
      for (const [, p] of npcPlan(id, DAY0 + d, open)) {
        assert.ok(NPC_PLACES[p], `${id} ${p}`);
        assert.ok(npcCanStand(NPC_PLACES[p].area, NPC_PLACES[p]), `${id} ${p} standable`);
      }
  for (let d = 0; d < 7; d++)
    for (const id of STAGE3_NPCS) {
      const s = npcSpot(id, at(d, 3), open);
      assert.equal(s.visible, false, `${id} asleep at 03:00`);
    }
});

test('romance: a stage-3 resident can be dated, engaged and married like the others', () => {
  const s = world(1);
  const [m] = s.members;
  const rel = () => s.life.ext[m.id].npcRelations?.nilah;
  // Gifts she loves raise hearts.
  s.give(m, 'milk-big', 1);
  s.act(m, { kind: 'npcSocial', npc: 'nilah', op: 'gift', item: 'milk-big' });
  assert.equal(rel().points, 12);
  (s.life.ext[m.id].npcRelations ??= {}).nilah = { points: NPC_DATING_POINTS };
  s.give(m, 'bouquet', 1);
  s.act(m, { kind: 'npcSocial', npc: 'nilah', op: 'ask' });
  assert.equal(rel().love, 'dating');
  rel().points = 120;
  s.give(m, 'pledge-ring', 1);
  s.act(m, { kind: 'npcSocial', npc: 'nilah', op: 'propose' }, at(3));
  assert.equal(rel().love, 'engaged');
  s.act(m, { kind: 'npcSocial', npc: 'nilah', op: 'wedding' }, at(6));
  assert.equal(rel().love, 'married');
  // Gift tastes read the new goods.
  assert.equal(NPCS.ornn.gifts.loved.includes('iron'), true);
});

// ---------------------------------------------------------------- 목장
test('animals: buy, feed hay daily, bond, and get eggs, milk and wool', () => {
  const s = world(1);
  const [m] = s.members;
  s.fails(m, { kind: 'animalCare' }, /동물이 없어요/);
  s.act(m, { kind: 'animalBuy', animal: 'chicken' });
  s.act(m, { kind: 'animalBuy', animal: 'sheep' });
  assert.equal(wallet(s, m), 100_000 - ANIMALS.chicken.price - ANIMALS.sheep.price);
  s.fails(m, { kind: 'animalCare' }, /건초가 모자라요/);
  s.act(m, { kind: 'hayBuy', n: 20 });
  assert.equal(s.inv(m, 'hay'), 20);
  // Day 0: the hen lays, the sheep needs another day for wool.
  s.act(m, { kind: 'animalCare' });
  assert.equal(s.inv(m, 'egg'), 1);
  assert.equal(s.inv(m, 'wool'), 0);
  assert.equal(s.inv(m, 'hay'), 18);
  s.fails(m, { kind: 'animalCare' }, /모두 돌봤어요/);
  s.act(m, { kind: 'animalCare' }, at(1));
  assert.equal(s.inv(m, 'wool'), 1);
  // Five days in a row: bonded — the big egg and wool every day.
  for (let d = 2; d < ANIMAL_BOND; d++) s.act(m, { kind: 'animalCare' }, at(d));
  const v = s.act(m, { kind: 'animalCare' }, at(ANIMAL_BOND));
  assert.ok(v.stage3.animals.every((a) => a.bonded));
  assert.ok(s.inv(m, 'egg-big') >= 1);
  // Missed days cost 정.
  const love = s.life.ext[m.id].s3.a[0].love;
  s.act(m, { kind: 'animalCare' }, at(ANIMAL_BOND + 4));
  assert.equal(s.life.ext[m.id].s3.a[0].love, love - 3 + 1);
  // The coop holds four hens.
  for (let i = 1; i < COOP_ROOM; i++) s.act(m, { kind: 'animalBuy', animal: 'chicken' }, at(20));
  s.fails(m, { kind: 'animalBuy', animal: 'chicken' }, /닭장/, at(20));
  // Goods sell at 닐라's counter for full price.
  assert.equal(buyerOf('milk'), 'barn');
  const before = wallet(s, m);
  s.act(m, { kind: 'sellItem', item: 'egg', n: 1, at: 'barn' }, at(20));
  assert.ok(wallet(s, m) > before);
  // The tally: animals and hay came in, an egg went out.
  const sales = shopSalesSince(s.life.shopSales, 'barn', at(20), 30);
  assert.equal(sales.rev, 4 * ANIMALS.chicken.price + ANIMALS.sheep.price + 20 * HAY_PRICE);
  assert.ok(sales.buy > 0);
  assert.equal(flowBucket('spend', 'ranch-animal'), 'ranch');
});

test('a shut ranch refuses everything', () => {
  const s = world(1, []);
  const [m] = s.members;
  s.fails(m, { kind: 'hayBuy', n: 1 }, /아직 열리지/);
  s.fails(m, { kind: 'smithUpgrade', tool: 'can' }, /아직 열리지/);
});

// ---------------------------------------------------------------- 과수원
test('fruit trees: plant a sapling, wait four days, pick in season once a day', () => {
  const s = world(1);
  const [m] = s.members;
  // A day of the peach's season after enough growing days.
  const plantDay = dayWhere((d) => seasonOfDay(d + ORCHARD_GROW_DAYS) === 'summer');
  s.act(m, { kind: 'treePlant', slot: 0, tree: 'peach' }, at(plantDay));
  assert.equal(wallet(s, m), 100_000 - SAPLINGS.peach.price);
  s.fails(m, { kind: 'treePlant', slot: 0, tree: 'apple' }, /이미 나무/, at(plantDay));
  s.fails(m, { kind: 'treePick', slot: 0 }, /지나야/, at(plantDay + 1));
  const pickDay = dayWhere((d) => seasonOfDay(d) === 'summer', plantDay + ORCHARD_GROW_DAYS);
  s.act(m, { kind: 'treePick', slot: 0 }, at(pickDay));
  assert.ok(s.inv(m, 'peach') >= 2);
  s.fails(m, { kind: 'treePick', slot: 0 }, /이미 땄/, at(pickDay));
  const off = dayWhere((d) => seasonOfDay(d) === 'winter', pickDay);
  s.fails(m, { kind: 'treePick', slot: 0 }, /제철이 아니라/, at(off));
  assert.equal(buyerOf('peach'), 'orchardShop');
  s.act(m, { kind: 'treeClear', slot: 0 }, at(off));
  assert.equal(s.view(m, at(off)).stage3.trees[0], null);
});

// ---------------------------------------------------------------- 대장간
test('range upgrades: tiers 2–3 like the rod; the can and the hoe reach their row and the 3×3', () => {
  const s = world(1);
  const [m] = s.members;
  s.fails(m, { kind: 'smithUpgrade', tool: 'can' }, /광석이 모자라요/);
  s.give(m, 'copper', 20);
  s.give(m, 'iron', 20);
  s.act(m, { kind: 'smithUpgrade', tool: 'can' });
  assert.equal(s.inv(m, 'copper'), 10);
  assert.equal(wallet(s, m), 100_000 - SMITH_COST.can[2].beom);
  assert.equal(s.view(m).stage3.smith.can, 2);
  // Watering one tile waters its row: the tiles left and right of it (1 × 3).
  const bag = s.life.bag[m.id];
  bag.seeds.carrot = 12;
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' });
  s.act(m, { kind: 'plant', plot: 1, crop: 'carrot' });
  s.act(m, { kind: 'plant', plot: 2, crop: 'carrot' });
  s.act(m, { kind: 'plant', plot: 3, crop: 'carrot' });
  s.act(m, { kind: 'water', plot: 1 });
  const farm = () => s.life.farms[m.id];
  assert.deepEqual([0, 1, 2, 3].map((i) => !!farm()[i].wetUntil), [true, true, true, false]);
  // The hoe at tier 2 plants the row too.
  s.act(m, { kind: 'smithUpgrade', tool: 'hoe' });
  const seeds = s.life.bag[m.id].seeds.carrot;
  s.act(m, { kind: 'plant', plot: 4, crop: 'carrot' });
  assert.ok(farm()[5].crop === 'carrot', 'the hoe planted the rest of the row');
  assert.equal(s.life.bag[m.id].seeds.carrot, seeds - 2);
  // Tier 3, then the top (a fresh friend: 2 + 3 costs 90,000범).
  const t = world(1);
  const [n] = t.members;
  t.give(n, 'copper', 10);
  t.give(n, 'iron', 10);
  t.act(n, { kind: 'smithUpgrade', tool: 'can' });
  t.act(n, { kind: 'smithUpgrade', tool: 'can' });
  assert.equal(t.view(n).stage3.smith.can, 3);
  t.fails(n, { kind: 'smithUpgrade', tool: 'can' }, /가장 좋은/);
  assert.equal(flowBucket('spend', 'smith-can-3'), 'smith');
});

test('ores: 오른 buys at full price and pays 20% more on today’s ore, at most 3,000범 a day', () => {
  const s = world(1);
  const [m] = s.members;
  const today = oreOfDay(kstDay(T0));
  const other = ['copper', 'iron', 'gold', 'gem'].find((o) => o !== today);
  s.give(m, today, 400);
  s.give(m, other, 10);
  let before = wallet(s, m);
  s.act(m, { kind: 'oreSell', item: other, n: 10 });
  const plain = wallet(s, m) - before;
  assert.ok(plain > 0);
  assert.equal(s.life.ext[m.id].s3?.ore ?? 0, 0, 'no premium on other ores');
  before = wallet(s, m);
  s.act(m, { kind: 'oreSell', item: today, n: 10 });
  const premium = s.life.ext[m.id].s3.ore;
  assert.ok(premium > 0);
  // The cap holds however much is sold.
  for (let i = 0; i < 8; i++) s.act(m, { kind: 'oreSell', item: today, n: 40 });
  assert.ok(s.life.ext[m.id].s3.ore <= ORE_PREMIUM_CAP);
  assert.equal(flowBucket('grant', 'smith-ore'), 'smith-ore');
  assert.ok(shopSalesSince(s.life.shopSales, 'smithy', T0).buy > 0);
});

// ---------------------------------------------------------------- 의원 · 점집
test('clinic: care twice a day fills rest; fortune: weekends and festivals, once a day, a small buff', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'clinicCare', care: 'drip' });
  s.act(m, { kind: 'clinicCare', care: 'herbtea' });
  s.fails(m, { kind: 'clinicCare', care: 'checkup' }, /하루 2번/);
  assert.equal(CLINIC_PER_DAY, 2);
  assert.equal(s.view(m).stage3.clinic.left, 0);
  const weekday = dayWhere((d) => !fortuneOpenOn(d));
  s.fails(m, { kind: 'fortuneRead' }, /주말과 축제/, at(weekday));
  const sat = dayWhere((d) => weekdayOf(d) === 6);
  const before = wallet(s, m);
  const v = s.act(m, { kind: 'fortuneRead' }, at(sat, 10));
  assert.equal(wallet(s, m), before - FORTUNE_PRICE);
  assert.ok(v.stage3.fortune.read && v.stage3.fortune.line);
  s.fails(m, { kind: 'fortuneRead' }, /이미 봤/, at(sat, 10) + HOUR);
  const kind = s.life.ext[m.id].s3.fo.kind;
  // The buff is a real-time timer (three real hours), like the cooking buffs.
  assert.equal(buffPower(s.life, m.id, at(sat, 10) + HOUR, kind), 0.5, 'a weak buff');
  assert.equal(buffPower(s.life, m.id, at(sat, 10) + 3 * HOUR + 60_000, kind), 0, 'gone after three hours');
  // Saves keep it; junk drops.
  const read = readLifeExt({ ext: { [m.id]: { s3: { ...s.life.ext[m.id].s3, junk: 1, a: [{ k: 'dragon' }] } } }, shopSales: { clinic: { 1: { rev: -5 } }, zoo: {} } });
  assert.equal(read.ext[m.id].s3.fo.kind, kind);
  assert.equal(read.ext[m.id].s3.a, undefined);
  assert.equal(read.shopSales, undefined);
  assert.deepEqual([...STOCK_SHOPS], ['barn', 'orchardShop', 'smithy', 'clinic', 'fortune']);
});
