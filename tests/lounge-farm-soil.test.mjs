// 우리 농장 F2 (handover/design/design-our-farm.md §3-2 – §3-4, §11, §12):
// tilling, wet soil (crops grow only while wet; a watering lasts until 06:00
// KST; rain, sprinklers and 보습 흙 wet on their own; dry crops wait), the
// pure read-time migration of old saves, tool reach and E on the tile I
// face, front-yard spots for scarecrows and bee houses, the 덩굴 시렁, and the
// farming-level gates on field stages.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CROP_INFO,
  LIFE_REJECT,
  LifeError,
  SELL_CAP_PER_DAY,
  emptyLife,
  ensureLifeMember,
  lifeAction,
  lifeView,
  packLife,
  plotReadyAt,
  readField,
  readLife,
} from '../app/lounge-life.ts';
import {
  GROW_WET,
  YARD_SPOTS,
  legacyWet,
  maskHas,
  moveYardFixtures,
  nextWetEnd,
  rainWindow,
  reachTiles,
  soilGrowth,
  soilReadyAt,
  soilWater,
  soilWetBy,
  tilledMask,
  trellisOver,
  trellisTiles,
} from '../app/lounge-farm-soil.ts';
import { FIXTURE_BY_ID, GRID_TILES, NEW_CROP_INFO } from '../app/lounge-farm-data.ts';
import { FARM_REJECT } from '../app/lounge-farm.ts';
import { FARM_EXPAND_LEVEL } from '../app/lounge-life-plus.ts';
import { dayStart, rainsOn } from '../app/lounge-calendar.ts';
import { kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { LEVEL_PERKS, LEVEL_XP, TOOL_INFO } from '../app/lounge-growth-data.ts';
import { FARM_FIELDS, fieldTileCenter } from '../app/lounge-farm-layout.ts';
import { facedTile, farmReach } from '../app/lounge-farm-view.ts';
import { tillField } from './farm-test-help.mjs';

const uuid = () => crypto.randomUUID();
const MIN = 60_000,
  HOUR = 3_600_000,
  DAY = 86_400_000;
/** KST wall clock → epoch ms. */
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
// 2026-10-13 is a dry summer day; 10-14 and 10-15 rain (lounge-calendar weatherOf).
const DRY = kst(2026, 10, 13, 10);

function world(n = 1, { tilled = true } = {}) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
    if (tilled) tillField(life, m.id);
  }
  const s = { members, ledger, life };
  s.act = (m, action, now) => {
    const r = lifeAction(s.life, s.ledger, m, action, now);
    s.life = r.life;
    s.ledger = r.ledger;
    validateLedger(s.ledger);
    return r;
  };
  s.fails = (m, action, now, message) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || e.message === message),
    );
  s.view = (m, now) => lifeView(s.life, m.id, m.actor, now);
  s.give = (m, item, n) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + n;
  };
  s.level = (m, skill, lv) => {
    const u = (((s.life.growth ??= {}).u ??= {})[m.id] ??= {});
    (u.xp ??= {})[skill] = LEVEL_XP[lv - 1];
  };
  s.size = (m, size) => {
    ((s.life.ext ??= {})[m.id] ??= {}).plots = size;
    tillField(s.life, m.id, size);
  };
  return s;
}

// ------------------------------------------------------------ the wet-soil clock
test('a watering lasts until the next 06:00 KST; rain wets its day until 06:00 the next', () => {
  const six = kst(2026, 10, 13, 6);
  assert.equal(nextWetEnd(kst(2026, 10, 13, 5, 59)), six);
  assert.equal(nextWetEnd(six), six + DAY);
  assert.equal(nextWetEnd(kst(2026, 10, 13, 23)), six + DAY);
  const d = kstDay(DRY);
  assert.deepEqual(rainWindow(d), [dayStart(d), dayStart(d + 1) + 6 * HOUR]);
  assert.equal(rainsOn(d), false);
  assert.equal(rainsOn(d + 1), true);
});

test('wet soil: growth only while wet (hand, rain, sprinkler, 보습 흙); dry crops wait', () => {
  const grow = 2 * HOUR;
  // Dry day, no watering: nothing grows, and it waits (Infinity), it never dies.
  const p = { plantedAt: DRY };
  assert.equal(soilGrowth(p, DRY + 5 * HOUR), 0);
  assert.equal(soilReadyAt(p, grow, DRY + 5 * HOUR), Infinity);
  assert.equal(soilWetBy(p, DRY + HOUR), null);
  // Rain the next day (00:00 KST of 10-14) wets it on its own.
  const rainStart = dayStart(kstDay(DRY) + 1);
  assert.equal(soilWetBy(p, rainStart + MIN), 'rain');
  assert.equal(soilReadyAt(p, grow, rainStart + MIN), rainStart + grow);
  // Watered by hand an hour after planting: wet until 06:00 tomorrow.
  const w = { plantedAt: DRY };
  soilWater(w, DRY + HOUR);
  assert.equal(w.wetUntil, nextWetEnd(DRY + HOUR));
  assert.equal(soilWetBy(w, DRY + 2 * HOUR), 'hand');
  assert.equal(soilGrowth(w, DRY + 2 * HOUR), HOUR);
  assert.equal(soilReadyAt(w, grow, DRY + HOUR), DRY + 3 * HOUR);
  // A sprinkler since 30 minutes after planting.
  const s = { plantedAt: DRY, sp: DRY + 30 * MIN };
  assert.equal(soilWetBy(s, DRY + HOUR), 'sprinkler');
  assert.equal(soilReadyAt(s, grow, DRY), DRY + 30 * MIN + grow);
  // 보습 흙: always wet.
  const r = { plantedAt: DRY, rs: 1 };
  assert.equal(soilWetBy(r, DRY), 'soil');
  assert.equal(soilReadyAt(r, grow, DRY), DRY + grow);
});

test('the catalog is 0.6× of the old one: a daily waterer grows exactly as fast as an old watered crop', () => {
  assert.equal(GROW_WET, 0.6);
  assert.equal(CROP_INFO.carrot.growMs, 30 * MIN * 0.6);
  assert.equal(CROP_INFO.strawberry.growMs, 8 * HOUR * 0.6);
  assert.equal(CROP_INFO.corn.regrow.ms, 3 * HOUR * 0.6);
  for (const [id, info] of Object.entries(NEW_CROP_INFO)) assert.equal(CROP_INFO[id].growMs, Math.round(info.growMs * GROW_WET), id);
  // The economy's ceilings stay where they were.
  assert.equal(SELL_CAP_PER_DAY, 100_000);
  // The watering can's forge tiers now describe reach, not a speed-up.
  assert.ok(Object.values(TOOL_INFO.can.tiers).every((t) => !/단축|빨리|%/.test(t)));
  assert.match(TOOL_INFO.can.tiers[2], /1×3/);
  assert.match(TOOL_INFO.can.tiers[4], /3×3/);
});

// ------------------------------------------------------------ read-time migration
test('old saves read as already watered: pure, idempotent, never later than the old ripe time', () => {
  const grow = CROP_INFO.tomato.growMs; // 36 min (60 min before wet soil)
  // Watered 10 minutes after planting under the old rules: 10 min + 50 × 0.6 = 40 min.
  assert.deepEqual(legacyWet(1_000, 1_000 + 10 * MIN, grow), { wetMs: grow, wetUntil: 1_000 + 40 * MIN });
  // Never watered: as if watered at planting.
  assert.deepEqual(legacyWet(1_000, null, grow), { wetMs: grow, wetUntil: 1_000 + grow });
  // Already grown before the watering: ripe when it was.
  assert.deepEqual(legacyWet(1_000, 1_000 + 2 * HOUR, grow), { wetMs: grow, wetUntil: 1_000 + HOUR });
  const raw = [
    { crop: 'tomato', plantedAt: 1_000, wateredAt: 1_000 + 10 * MIN, w: 5 },
    { crop: null, plantedAt: 0, wateredAt: null, dead: 'carrot' },
    { crop: 'carrot', plantedAt: 3_000, wateredAt: null },
  ];
  const frozen = JSON.stringify(raw);
  const field = readField(raw);
  assert.equal(JSON.stringify(raw), frozen, 'reading never writes into the save');
  assert.deepEqual(readField(raw), field, 'pure: same save, same field');
  // Idempotent: reading its own output (or the packed form) changes nothing.
  assert.deepEqual(readField(field), field);
  assert.deepEqual(readField(JSON.parse(JSON.stringify(packLife({ ...emptyLife(), farms: { a: field } }).farms.a))), field);
  // The can's old speed-up (w) counts in the migrated ripe time, then is gone.
  assert.equal(field[20].wetUntil, 1_000 + 10 * MIN + Math.ceil(50 * MIN * (0.6 - 0.05)));
  assert.equal(field[20].w, undefined);
  assert.equal(field[20].wateredAt, undefined);
  assert.equal(plotReadyAt(field[20], 0), field[20].wetUntil);
  // The old tiles are tilled; a withered plant stays (on tilled soil).
  assert.deepEqual([20, 21, 22].map((t) => field[t].t), [1, 1, 1]);
  assert.equal(field[21].dead, 'carrot');
  assert.equal(field[0].t, undefined);
  // An F1 field (sparse, before wet soil): the old 3 × 4 block is tilled, the rest grass.
  const f1 = readField({ 45: { crop: 'carrot', plantedAt: 9, wateredAt: null } });
  assert.deepEqual(
    f1.flatMap((p, i) => (p.t ? [i] : [])),
    [0, 1, 2, 10, 11, 12, 20, 21, 22, 30, 31, 32, 45],
  );
  // A new F2 field read back: only what was tilled.
  const f2 = readField({ 7: { crop: null, plantedAt: 0, t: 1 } });
  assert.deepEqual(f2.flatMap((p, i) => (p.t ? [i] : [])), [7]);
});

test('front-yard spots: old scarecrows and bee houses move off the field (pure), any extra stay on their tile', () => {
  const fx = {
    2: { k: 'beehouse', at: 1 },
    12: { k: 'scarecrow', at: 2 },
    5: { k: 'sprinkler', at: 3 },
    30: { k: 'scarecrow', at: 4 },
    31: { k: 'scarecrow', at: 5 },
    32: { k: 'scarecrow', at: 6 },
    33: { k: 'scarecrow', at: 7 },
  };
  const frozen = JSON.stringify(fx);
  const moved = moveYardFixtures(fx);
  assert.equal(JSON.stringify(fx), frozen);
  assert.deepEqual(moveYardFixtures(moved), moved, 'idempotent');
  // Sprinklers stay on their tile; five yard spots fill nearest first; the sixth stays put.
  assert.deepEqual(moved['5'], fx[5]);
  assert.equal(YARD_SPOTS.length, 5);
  assert.deepEqual(
    Object.keys(moved).sort(),
    ['33', '5', 'y0', 'y1', 'y2', 'y3', 'y4'],
  );
  assert.deepEqual(moved.y0, fx[2]);
  // The spots stand off the field: the house side (row −1) and the lane side (row 8).
  assert.ok(YARD_SPOTS.every((s) => s.r === -1 || s.r === 8));
});

test('tilled masks for friends are 30 hex digits (20 before F5) and round-trip', () => {
  const field = Array.from({ length: GRID_TILES }, (_, i) => ({ crop: null, plantedAt: 0, ...(i % 7 === 0 ? { t: 1 } : {}) }));
  field[13] = { crop: 'carrot', plantedAt: 1 };
  const mask = tilledMask(field);
  assert.equal(mask.length, 30);
  for (let i = 0; i < GRID_TILES; i++) assert.equal(maskHas(mask, i), i % 7 === 0 || i === 13, String(i));
  // A mask from before stage 4 (20 digits) still reads: the tiles past it are grass.
  const old = mask.slice(0, 20);
  for (let i = 0; i < GRID_TILES; i++) assert.equal(maskHas(old, i), i < 80 && (i % 7 === 0 || i === 13), String(i));
});

// ------------------------------------------------------------ tilling and reach
test('tilling: new fields are grass; the hoe tills by its reach; harvested tiles stay tilled', () => {
  const s = world(1, { tilled: false }),
    [m] = s.members;
  s.life.bag[m.id].seeds.carrot = 10;
  s.fails(m, { kind: 'plant', plot: 0, crop: 'carrot' }, DRY, LIFE_REJECT.untilled);
  assert.equal(s.view(m, DRY).me.farm.filter((p) => !p.locked && !p.t).length, 24);
  s.act(m, { kind: 'till', plot: 11 }, DRY);
  assert.deepEqual(s.life.farms[m.id].flatMap((p, i) => (p.t ? [i] : [])), [11]);
  s.fails(m, { kind: 'till', plot: 11 }, DRY, LIFE_REJECT.tilled);
  // 오른's hoe range 3: the 3 × 3 around it.
  (((s.life.ext ??= {})[m.id] ??= {}).s3 ??= {}).sm = { hoe: 3 };
  s.act(m, { kind: 'till', plot: 22 }, DRY);
  assert.deepEqual(s.life.farms[m.id].flatMap((p, i) => (p.t ? [i] : [])), [11, 12, 13, 21, 22, 23, 31, 32, 33]);
  // The hoe also plants its reach.
  s.act(m, { kind: 'plant', plot: 22, crop: 'carrot' }, DRY);
  assert.equal(s.life.farms[m.id].filter((p) => p.crop).length, 9);
  s.act(m, { kind: 'water', plot: -1 }, DRY);
  s.act(m, { kind: 'harvest', plot: -1 }, DRY + CROP_INFO.carrot.growMs);
  assert.ok([11, 12, 13, 21, 22, 23, 31, 32, 33].every((i) => s.life.farms[m.id][i].t === 1 && !s.life.farms[m.id][i].crop));
  // A stage-1 field tills the rest at once; a stored field keeps its tilled tiles.
  s.act(m, { kind: 'till', plot: -1 }, DRY + HOUR);
  assert.equal(s.life.farms[m.id].filter((p) => p.t).length, 24);
  s.fails(m, { kind: 'till', plot: -1 }, DRY + HOUR, LIFE_REJECT.noGrass);
  const packed = JSON.parse(JSON.stringify(packLife(s.life)));
  assert.equal(Object.keys(packed.farms[m.id]).length, 24);
  assert.deepEqual(readLife(packed).farms[m.id], s.life.farms[m.id]);
});

test('reach tiers: 1 the tile, 2 its row (1 × 3), 3 the 3 × 3 — cut at the field edge', () => {
  assert.deepEqual(reachTiles(22, 1), [22]);
  assert.deepEqual(reachTiles(22, 2), [22, 21, 23]);
  assert.deepEqual(reachTiles(22, 3).sort((a, b) => a - b), [11, 12, 13, 21, 22, 23, 31, 32, 33]);
  assert.deepEqual(reachTiles(0, 3).sort((a, b) => a - b), [0, 1, 10, 11]);
  // F5: column 9 now has the stage-4 columns east of it (tiles 80–95, numbered after the old block).
  assert.deepEqual(reachTiles(9, 2), [9, 8, 80]);
  assert.deepEqual(reachTiles(80, 3).sort((a, b) => a - b), [9, 19, 80, 81, 82, 83]);
  assert.deepEqual(reachTiles(119, 3).sort((a, b) => a - b), [106, 107, 118, 119]);
  assert.deepEqual(reachTiles(120, 3), []);
});

test('§12-1: a stage-1 field works all at once; a bigger one only tile by tile, harvest taking every ripe tile in reach', () => {
  const s = world(1),
    [m] = s.members;
  s.size(m, 48);
  s.life.bag[m.id].seeds.carrot = 30;
  for (const kind of ['plant', 'water', 'harvest', 'till'])
    s.fails(m, { kind, plot: -1, ...(kind === 'plant' ? { crop: 'carrot' } : {}) }, DRY, LIFE_REJECT.wholeField);
  s.fails(m, { kind: 'fertilize', plot: -1, item: 'fertilizer' }, DRY, LIFE_REJECT.wholeField);
  for (const t of [0, 1, 2, 10, 11, 12, 20, 21, 22]) s.act(m, { kind: 'plant', plot: t, crop: 'carrot' }, DRY);
  // Bare hands reach as far as the longer tool: with the can's forge tier 4, the 3 × 3.
  s.life.growth = { u: { [m.id]: { tools: { can: 4 } } } };
  s.act(m, { kind: 'water', plot: 11 }, DRY);
  assert.equal(s.life.farms[m.id].filter((p) => p.wetUntil).length, 9);
  const ripe = DRY + CROP_INFO.carrot.growMs;
  s.act(m, { kind: 'harvest', plot: 11 }, ripe);
  assert.equal(s.life.bag[m.id].produce.carrot, 9);
  // Nothing ripe in reach: why, for the tile I face.
  s.fails(m, { kind: 'harvest', plot: 11 }, ripe, LIFE_REJECT.nothingReady);
  s.fails(m, { kind: 'harvest', plot: 40 }, ripe, LIFE_REJECT.nothingReady);
});

test('watering refuses with the reason: rain, a sprinkler, 보습 흙, already watered, or ripe', () => {
  const s = world(1),
    [m] = s.members;
  s.life.bag[m.id].seeds.carrot = 3;
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' }, DRY);
  s.act(m, { kind: 'water', plot: 0 }, DRY);
  s.fails(m, { kind: 'water', plot: 0 }, DRY + MIN, LIFE_REJECT.watered);
  s.fails(m, { kind: 'water', plot: 0 }, DRY + CROP_INFO.carrot.growMs, LIFE_REJECT.grown);
  const rainy = dayStart(kstDay(DRY) + 1) + 9 * HOUR;
  s.act(m, { kind: 'plant', plot: 1, crop: 'carrot' }, rainy);
  s.fails(m, { kind: 'water', plot: 1 }, rainy, LIFE_REJECT.rained);
  s.life.farmx = { [m.id]: { fx: { 3: { k: 'sprinkler', at: DRY } } } };
  s.act(m, { kind: 'plant', plot: 2, crop: 'carrot' }, rainy + 3 * DAY);
  s.fails(m, { kind: 'water', plot: 2 }, rainy + 3 * DAY, LIFE_REJECT.sprinkled);
});

// ------------------------------------------------------------ yard fixtures
test('scarecrows and bee houses stand on front-yard spots; sprinklers on tiles; spots move and swap', () => {
  const s = world(1),
    [m] = s.members;
  s.give(m, 'scarecrow', 2);
  s.give(m, 'beehouse', 1);
  s.fails(m, { kind: 'farmPlace', item: 'scarecrow', tile: 3 }, DRY, FARM_REJECT.yardOnly);
  s.act(m, { kind: 'farmPlace', item: 'scarecrow', yard: 0 }, DRY);
  s.fails(m, { kind: 'farmPlace', item: 'scarecrow', yard: 0 }, DRY, FARM_REJECT.yardBusy);
  s.act(m, { kind: 'farmPlace', item: 'beehouse', yard: 3 }, DRY);
  s.act(m, { kind: 'farmMove', from: 0, to: 3, area: 'yard' }, DRY);
  assert.deepEqual(s.life.farmx[m.id].fx.y3.k, 'scarecrow');
  assert.deepEqual(s.life.farmx[m.id].fx.y0.k, 'beehouse');
  // A scarecrow on a spot leaves the field's tiles free for crops.
  s.life.bag[m.id].seeds.carrot = 1;
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' }, DRY);
  s.act(m, { kind: 'farmPickup', yard: 3 }, DRY);
  assert.equal(s.life.ext[m.id].inv.scarecrow, 2);
  assert.equal(FIXTURE_BY_ID.scarecrow.guard, 4);
  // The friends' 3D view gets the spots too.
  assert.deepEqual(s.view(m, DRY).farmsPublic[m.id].yard, [[0, 'beehouse']]);
});

// ------------------------------------------------------------ 덩굴 시렁
test('덩굴 시렁: farm Lv5, over three tiles; vines (grape, pea, hop) only under it, nothing else there', () => {
  const s = world(1),
    [m] = s.members,
    summer = DRY;
  s.give(m, 'wood', 40);
  s.give(m, 'copper', 4);
  s.fails(m, { kind: 'farmBuild', item: 'trellis' }, summer, '농사 Lv5부터 만들 수 있어요.');
  s.level(m, 'farm', 5);
  s.act(m, { kind: 'farmBuild', item: 'trellis' }, summer);
  assert.ok(LEVEL_PERKS.farm.find((p) => p.level === 5).text.includes('덩굴 시렁'));
  // Hop: the new summer vine.
  assert.equal(CROP_INFO.hop.vine, true);
  assert.deepEqual(CROP_INFO.hop.seasons, ['summer']);
  assert.ok(CROP_INFO.grape.vine && CROP_INFO.pea.vine);
  s.life.bag[m.id].seeds.hop = 3;
  s.life.bag[m.id].seeds.carrot = 1;
  s.fails(m, { kind: 'plant', plot: 10, crop: 'hop' }, summer, LIFE_REJECT.vineOnly);
  // Three free tiles in a row from the anchor east; off the field's tier is refused.
  s.fails(m, { kind: 'farmPlace', item: 'trellis', tile: 4 }, summer, FARM_REJECT.trellisRoom);
  s.act(m, { kind: 'farmPlace', item: 'trellis', tile: 10 }, summer);
  assert.deepEqual(trellisTiles(10), [10, 11, 12]);
  assert.equal(trellisOver(s.life.farmx[m.id].tr, 12), 10);
  assert.deepEqual(s.view(m, summer).farmx.trellises, [10]);
  assert.equal(s.view(m, summer).me.farm[11].trellis, 10);
  s.fails(m, { kind: 'plant', plot: 11, crop: 'carrot' }, summer, LIFE_REJECT.trellisOnly);
  s.act(m, { kind: 'plant', plot: 11, crop: 'hop' }, summer);
  s.act(m, { kind: 'water', plot: 11 }, summer);
  // It regrows: four harvests.
  const t = summer + CROP_INFO.hop.growMs;
  s.act(m, { kind: 'harvest', plot: 11 }, t);
  assert.equal(s.life.farms[m.id][11].n, 1);
  // Something grows under it: it stays up.
  s.fails(m, { kind: 'farmPickup', tile: 12 }, t, FARM_REJECT.trellisBusy);
  s.fails(m, { kind: 'farmPlace', item: 'trellis', tile: 11 }, t, FARM_REJECT.trellisRoom);
  s.life.farms[m.id][11] = { crop: null, plantedAt: 0, t: 1 };
  s.act(m, { kind: 'farmPickup', tile: 12 }, t);
  assert.equal(s.life.ext[m.id].inv.trellis, 1);
  assert.equal(s.life.farmx[m.id].tr, undefined);
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(s.life))).farmx?.[m.id]?.tr, undefined);
});

// ------------------------------------------------------------ farming-level gates
test('§11-4: field stages need farming Lv3 (48), Lv6 (80) and Lv10 (120); a stage already bought stays', () => {
  assert.deepEqual(FARM_EXPAND_LEVEL, { 48: 3, 80: 6, 120: 10 });
  const perks = LEVEL_PERKS.farm;
  assert.match(perks.find((p) => p.level === 3).text, /8×6/);
  assert.match(perks.find((p) => p.level === 6).text, /10×8/);
  // An old save that paid for 12 tiles reads as 80, at any level.
  const uid = uuid();
  const life = readLife({ farms: { [uid]: Array.from({ length: 12 }, () => ({ crop: null, plantedAt: 0, wateredAt: null })) }, actors: { [uid]: 0 }, ext: { [uid]: { plots: 12 } } });
  assert.equal(lifeView(life, uid, 0, DRY).me.plots, 80);
});

// ------------------------------------------------------------ E on the tile I face
test('E on a bigger field: the tile ahead of me (or under me, or nearest at the edge), with the right action', () => {
  const f = FARM_FIELDS.find((x) => x.actor === 2);
  const at = fieldTileCenter(f, 11);
  // Facing south (the default), east, north, west.
  assert.equal(facedTile(f, 48, at), 21);
  assert.equal(facedTile(f, 48, at, { x: 1, z: 0 }), 12);
  assert.equal(facedTile(f, 48, at, { x: 0, z: -1 }), 1);
  assert.equal(facedTile(f, 48, at, { x: -1, z: 0.2 }), 10);
  // At the open block's edge facing out: the tile under me.
  assert.equal(facedTile(f, 24, fieldTileCenter(f, 35), { x: 1, z: 0 }), 35);
  // Just outside the field (by the house): the nearest open tile; far away: none.
  assert.equal(facedTile(f, 48, { x: at.x, z: f.z0 - 0.3 }), 1);
  assert.equal(facedTile(f, 48, { x: at.x, z: f.z0 - 3 }), null);
  const farm = Array.from({ length: 80 }, (_, i) =>
    i === 21 ? { crop: 'carrot', ready: true, readyAt: 0, wateredAt: null, t: 1 } : i < 48 && i % 10 < 8 ? { crop: null, readyAt: null, wateredAt: null } : { crop: null, readyAt: null, wateredAt: null, locked: true },
  );
  const life = { me: { farm, plots: 48, bag: { seeds: {} }, inv: {}, waterFriend: [] }, actors: {}, housesPlotsPublic: {}, farmsPublic: {}, houses: {}, calendar: { season: 'summer' } };
  const south = farmReach(at, life, 2, 10)[0];
  assert.deepEqual(south.touch, { kind: 'tile', tile: 21 });
  assert.equal(south.action, 'harvest');
  assert.equal(south.label, '3줄 2칸 · 당근 거두기');
  const east = farmReach(at, life, 2, 10, { x: 1, z: 0 })[0];
  assert.deepEqual(east.touch, { kind: 'tile', tile: 12 });
  assert.equal(east.label, '2줄 3칸 · 괭이로 갈기');
  assert.equal(east.action, 'tend');
  // A stage-1 field keeps the whole-field touch.
  life.me.plots = 24;
  assert.equal(farmReach(fieldTileCenter(f, 3), life, 2, 10)[0].touch.kind, 'field');
});
