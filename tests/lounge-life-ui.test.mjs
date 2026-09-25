// LIFE-B client helpers: inventory rows, hotbar, farm quick actions, fishing
// phases, recipes, village spots and actions, furniture art and room copies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_HOTBAR,
  HOTBAR_SIZE,
  INV_GROUPS,
  MUSEUM_IDS,
  ambienceOf,
  cropSplit,
  farmToolAction,
  fishPhase,
  furnitureLeft,
  furnitureUnlocks,
  giftTaste,
  hotbarCount,
  inventoryEntries,
  needHave,
  placeInHotbar,
  readHotbar,
  recipeMax,
  reelTiming,
  tastesKnown,
  whereFrom,
} from '../app/lounge-life-ui.ts';
import { DISH_BY_ID, CRAFT_BY_ID, FURNITURE, SPAWN_SPOTS } from '../app/lounge-items.ts';
import { FURNITURE_ART } from '../app/lounge-furniture-art.ts';
import { ACTION_LABEL } from '../app/lounge-flow.ts';
import { villageAction } from '../app/lounge-village-actions.ts';
import {
  BOARD_FRONT,
  MUSEUM_FRONT,
  PIER_POINT,
  POND_EDGE,
  RIVER_BANK,
  SPAWN_POINTS,
  bobberPoint,
  nearestFishSpot,
} from '../app/lounge-village-spots.ts';
import {
  VILLAGE_BOARD,
  VILLAGE_GREENHOUSE,
  VILLAGE_MUSEUM,
  VILLAGE_PATHS,
  VILLAGE_POND,
  VILLAGE_START,
  villageCanWalk,
  villagePath,
} from '../app/lounge-village-layout.ts';
import { FARM_BEDS, farmBedRect, farmFront } from '../app/lounge-village-life.ts';
import { besideCookTable, roomAction } from '../app/lounge-bedroom-navigation.ts';
import { defaultBedroom } from '../app/lounge-bedroom-data.ts';

const crops = (over = {}) => ({
  carrot: 0, tomato: 0, pumpkin: 0, strawberry: 0, potato: 0, spinach: 0, corn: 0, watermelon: 0, sweetpotato: 0, cabbage: 0, ...over,
});
const me = (over = {}) => ({
  farm: [],
  bag: { seeds: crops(), produce: crops(), fruit: 0 },
  quality: { silver: {}, gold: {} },
  inv: {},
  furniture: {},
  ...over,
});

test('inventory rows: crops split by quality stars, groups in order, tools hotbar-able', () => {
  const m = me({
    bag: { seeds: crops({ carrot: 3 }), produce: crops({ tomato: 5 }), fruit: 2 },
    quality: { silver: { tomato: 2 }, gold: { tomato: 1 } },
    inv: { crucian: 1, fertilizer: 2, salad: 1, wood: 4, butterfly: 1 },
    furniture: { 'furn-plant': 1 },
  });
  assert.deepEqual(cropSplit(m, 'tomato'), { 0: 2, 1: 2, 2: 1 });
  const rows = inventoryEntries(m);
  const keys = rows.map((r) => r.key);
  assert.deepEqual(keys.slice(0, 5), ['seed-carrot', 'tomato@2', 'tomato@1', 'tomato@0', 'fruit']);
  const order = INV_GROUPS.map(([g]) => g);
  for (let i = 1; i < rows.length; i++) assert.ok(order.indexOf(rows[i - 1].group) <= order.indexOf(rows[i].group));
  assert.equal(rows.find((r) => r.key === 'tomato@2').sell, 720); // 480 × 1.5
  assert.equal(rows.find((r) => r.key === 'fertilizer').hotbar, true);
  assert.equal(rows.find((r) => r.key === 'salad').eat, true);
  assert.equal(rows.find((r) => r.key === 'crucian').museum, true);
  assert.equal(rows.find((r) => r.key === 'wood').group, 'material');
  assert.equal(rows.find((r) => r.key === 'furn-plant').group, 'furniture');
  assert.match(whereFrom('catfish'), /비 오는 날/);
  assert.match(whereFrom('seed-corn'), /2번|3번 수확/);
  assert.match(whereFrom('furn-village-medal'), /꾸러미/);
});

test('hotbar: 9 slots, tolerant storage, no duplicates, counts', () => {
  assert.equal(DEFAULT_HOTBAR.length, HOTBAR_SIZE);
  assert.deepEqual(readHotbar('{bad'), [...DEFAULT_HOTBAR]);
  const read = readHotbar(JSON.stringify(['rod', 'nope', 'seed-corn', 42]));
  assert.equal(read.length, 9);
  assert.deepEqual(read.slice(0, 4), ['rod', '', 'seed-corn', '']);
  const next = placeInHotbar(['can', 'rod', 'bait', '', '', '', '', '', ''], 4, 'rod');
  assert.deepEqual(next.slice(0, 5), ['can', '', 'bait', '', 'rod']);
  const m = me({ bag: { seeds: crops({ corn: 4 }), produce: crops(), fruit: 0 }, inv: { bait: 7 } });
  assert.equal(hotbarCount(m, 'can'), null);
  assert.equal(hotbarCount(m, 'seed-corn'), 4);
  assert.equal(hotbarCount(m, 'bait'), 7);
});

test('farm quick action follows the selected tool and the season', () => {
  const now = 1_000_000;
  const plot = (crop, extra = {}) => ({ crop, plantedAt: now - 1000, wateredAt: null, readyAt: crop ? now + 60_000 : null, rained: false, quality: 0, harvestsLeft: 1, stage: 1, ready: false, ...extra });
  const farm = [plot(null), plot(null), plot('carrot'), plot('carrot', { wateredAt: now }), plot('tomato', { rained: true }), plot('tomato', { fert: 1 })];
  const m = me({ farm, bag: { seeds: crops({ carrot: 1, watermelon: 5 }), produce: crops(), fruit: 0 }, inv: { fertilizer: 9, 'fertilizer-deluxe': 1 } });
  assert.deepEqual(farmToolAction(farm, m, 'seed-carrot', now, 'autumn'), { kind: 'plant', label: '당근 심기 (1)', n: 1 });
  // Watermelon is a summer crop: nothing in autumn unless the greenhouse is restored.
  assert.equal(farmToolAction(farm, m, 'seed-watermelon', now, 'autumn'), null);
  assert.equal(farmToolAction(farm, m, 'seed-watermelon', now, 'autumn', true).n, 2);
  // The can skips watered and rained plots.
  assert.equal(farmToolAction(farm, m, 'can', now, 'autumn').n, 2);
  assert.equal(farmToolAction(farm, m, 'fertilizer', now, 'autumn').n, 3);
  assert.equal(farmToolAction(farm, m, 'fertilizer-deluxe', now, 'autumn').n, 1);
  assert.equal(farmToolAction(farm, m, 'rod', now, 'autumn'), null);
});

test('fishing phases on the server clock', () => {
  const p = { biteAt: 5000, windowMs: 1000, expiresAt: 7500 };
  assert.equal(fishPhase(null, 0), 'none');
  assert.equal(fishPhase(p, 4999), 'wait');
  assert.equal(fishPhase(p, 5500), 'bite');
  assert.equal(fishPhase(p, 6001), 'gone');
  assert.equal(reelTiming(5000, 5320.4), 320);
  assert.equal(reelTiming(5000, 4000), 0);
  assert.equal(bobberPoint('sea', PIER_POINT).x > PIER_POINT.x, true);
});

test('recipes: what I have (quality floors, categories) and how many I can make', () => {
  const m = me({
    bag: { seeds: crops(), produce: crops({ carrot: 3, tomato: 1, strawberry: 5 }), fruit: 0 },
    quality: { silver: {}, gold: { strawberry: 2 } },
    inv: { crucian: 2, carp: 1, wood: 1 },
  });
  assert.equal(recipeMax(m, DISH_BY_ID.salad), 1);
  assert.equal(recipeMax(m, DISH_BY_ID.grilledfish), 1); // any fish ×1 + wood ×1
  assert.equal(needHave(m, { cat: 'fish' }), 3);
  assert.equal(needHave(m, { item: 'strawberry', q: 2 }), 2);
  assert.equal(needHave(m, { beom: true }, 5000), 5000);
  assert.equal(recipeMax(m, CRAFT_BY_ID['furn-chair']), 0);
});

test('friend tastes are placeholders shown after one heart', () => {
  assert.equal(tastesKnown(0), false);
  assert.equal(tastesKnown(1), true);
  assert.equal(giftTaste(1, 'crucian'), 'like'); // 강재 likes fish (placeholder table)
  assert.equal(giftTaste(3, 'mugwort'), 'dislike'); // 승준 dislikes forage
  assert.equal(giftTaste(0, 'fertilizer'), null);
});

test('seasonal ambience', () => {
  assert.equal(ambienceOf('summer', 'rain'), 'rain');
  assert.equal(ambienceOf('winter', 'snow'), 'snow');
  assert.equal(ambienceOf('autumn', 'sunny'), 'leaves');
  assert.equal(ambienceOf('spring', 'cloudy'), 'petals');
  assert.equal(ambienceOf('summer', 'sunny'), null);
});

test('village places: pond, museum, board, greenhouse stay off paths, beds and each other', () => {
  const onPath = (x, z) => VILLAGE_PATHS.some(([x1, z1, x2, z2, w]) => {
    const dx = x2 - x1, dz = z2 - z1, L = dx * dx + dz * dz;
    const t = L ? Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / L)) : 0;
    return Math.hypot(x - (x1 + t * dx), z - (z1 + t * dz)) < w / 2;
  });
  for (const b of [VILLAGE_MUSEUM, VILLAGE_BOARD, VILLAGE_GREENHOUSE]) {
    assert.ok(!onPath(b.x, b.z), b.id + ' on a path');
    for (const bed of FARM_BEDS) {
      const r = farmBedRect(bed);
      assert.ok(Math.abs(b.x - r.x) > b.width / 2 + r.w / 2 + 0.3 || Math.abs(b.z - r.z) > b.depth / 2 + r.d / 2 + 0.3, `${b.id} overlaps bed ${bed.actor}`);
    }
  }
  assert.ok(!villageCanWalk({ x: VILLAGE_POND.x, z: VILLAGE_POND.z }), 'pond is water');
  for (const p of [MUSEUM_FRONT, BOARD_FRONT, POND_EDGE, RIVER_BANK, { x: PIER_POINT.x - 0.4, z: PIER_POINT.z }]) {
    assert.ok(villageCanWalk(p), JSON.stringify(p));
    assert.ok(villagePath(VILLAGE_START, p).length > 0, 'reachable ' + JSON.stringify(p));
  }
  for (const s of SPAWN_SPOTS) assert.ok(villageCanWalk(SPAWN_POINTS[s.id]), s.id);
  // Every farm front still leads to its own farm.
  for (const bed of FARM_BEDS) assert.ok(villageCanWalk(farmFront(bed)));
});

test('village action: fishing, spawns, museum, board, friend farms, labels', () => {
  const life = {
    me: {
      farm: [],
      fruitReadyAt: {},
      spawns: [{ spot: 'orchard-1', district: 'west-orchard', kind: 'forage', item: 'wildflower', taken: false }],
      waterFriend: [],
      wished: false,
    },
    flags: [],
    calendar: { season: 'autumn' },
    housesPlotsPublic: { u0: [{ crop: 'carrot', stage: 1, needsWater: true }] },
    actors: { u0: 0, me: 3 },
  };
  const at = (p, l = life) => villageAction(p, 3, { life: l, now: 0 });
  const river = at(RIVER_BANK);
  assert.equal(river?.kind, 'fish');
  assert.equal(nearestFishSpot(POND_EDGE)?.spot, 'pond');
  const sea = at({ x: PIER_POINT.x - 0.4, z: PIER_POINT.z });
  assert.equal(sea?.kind, 'fish');
  assert.equal(sea?.disabled, true, 'sea needs the bridge');
  assert.equal(at({ x: PIER_POINT.x - 0.4, z: PIER_POINT.z }, { ...life, flags: ['bridge'] })?.disabled, undefined);
  const spawn = at(SPAWN_POINTS['orchard-1']);
  assert.equal(spawn?.kind, 'forage');
  assert.equal(spawn?.label, '들꽃 줍기');
  assert.equal(at(MUSEUM_FRONT)?.kind, 'museum');
  assert.equal(at(BOARD_FRONT)?.kind, 'board');
  const bed0 = FARM_BEDS.find((b) => b.actor === 0);
  const friend = at(farmFront(bed0));
  assert.equal(friend?.kind, 'waterFriend');
  assert.equal(friend?.label, '물 주기 (오늘 1번)');
  const done = at(farmFront(bed0), { ...life, me: { ...life.me, waterFriend: [0] } });
  assert.equal(done?.disabled, true);
  assert.equal(done?.label, '오늘 물 줬어요');
  for (const kind of ['fish', 'forage', 'catch', 'museum', 'board', 'waterFriend', 'cook', 'wish'])
    assert.ok(ACTION_LABEL[kind].length <= 7, kind);
});

test('furniture: art for every premium piece, copies left and unlock entries', () => {
  for (const f of FURNITURE) assert.match(FURNITURE_ART[f.ref] ?? '', /^data:image\/svg\+xml/, f.ref);
  assert.deepEqual(furnitureUnlocks({ 'furn-plant': 2, 'furn-fan': 0 }), ['furn-plant', 'furn-plant']);
  const left = furnitureLeft({ 'furn-plant': 2 }, [{ ref: 'furn-plant' }, { ref: 'bed' }]);
  assert.equal(left['furn-plant'], 1);
  assert.equal(left['furn-fan'], 0);
  assert.ok(MUSEUM_IDS.length > 70);
});

test('my room: 요리·만들기 at a table, and a walkable spot beside it', () => {
  const room = defaultBedroom(3);
  const spot = besideCookTable(room);
  assert.ok(spot, 'the default room has a table');
  const action = roomAction(spot, room, { own: true, canCook: true });
  assert.equal(action?.kind, 'cook');
  assert.notEqual(roomAction(spot, room, { own: true })?.kind, 'cook');
});
