import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FARM_BEDS,
  FRUIT_TREE_POINTS,
  NPC_SLOT_MS,
  NPC_SPEED,
  TREE_REACH,
  cropVisual,
  dayLighting,
  dayPhase,
  farmBedRect,
  farmFront,
  kstHour,
  nearCommons,
  nearFarm,
  nearMarket,
  villageOccluded,
  nearestFruitTree,
  npcLine,
  npcPose,
  npcTargetIndex,
  npcWaypoints,
  plotCenter,
  plotsForActor,
} from '../app/lounge-village-life.ts';
import {
  VILLAGE_FARMLAND,
  VILLAGE_FARMLAND_ENTRY,
  VILLAGE_MARKET,
  VILLAGE_PATHS,
  VILLAGE_PLACES,
  VILLAGE_START,
  villageCanWalk,
  villagePath,
} from '../app/lounge-village-layout.ts';
import { FRUIT_TREES } from '../app/lounge-life.ts';
import {
  catalogEntry,
  readBedroomStrict,
  defaultBedroom,
} from '../app/lounge-bedroom-data.ts';
import { placeNew, withItem } from '../app/lounge-bedroom-edit.ts';
import { readSettings, DEFAULT_SETTINGS } from '../app/lounge-settings.ts';

const segmentDistance = (px, pz, [x1, z1, x2, z2]) => {
  const dx = x2 - x1,
    dz = z2 - z1,
    l = dx * dx + dz * dz;
  const t = l ? Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / l)) : 0;
  return Math.hypot(px - x1 - t * dx, pz - z1 - t * dz);
};
const reachable = (point) =>
  villageCanWalk(point) && villagePath(VILLAGE_START, point).length > 0;
// 12:00 KST on 2026-09-24 is 03:00 UTC.
const kst = (h, m = 0) => Date.UTC(2026, 8, 24, h - 9, m);

test('every friend has a 6-plot bed on open ground, off routes and buildings', () => {
  assert.equal(FARM_BEDS.length, 7);
  assert.deepEqual(
    FARM_BEDS.map((b) => b.actor).sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5, 6],
  );
  for (const bed of FARM_BEDS) {
    const r = farmBedRect(bed);
    for (let i = 0; i <= 8; i++)
      for (let j = 0; j <= 8; j++) {
        const p = { x: r.x - r.w / 2 + (r.w * i) / 8, z: r.z - r.d / 2 + (r.d * j) / 8 };
        assert.ok(villageCanWalk(p), `bed ${bed.actor} overlaps something at ${p.x},${p.z}`);
        for (const s of VILLAGE_PATHS)
          assert.ok(segmentDistance(p.x, p.z, s) >= s[4] / 2, `bed ${bed.actor} on a route`);
      }
    const front = farmFront(bed);
    assert.ok(reachable(front), `bed ${bed.actor} front reachable`);
    assert.ok(nearFarm(front, bed.actor));
    assert.ok(!nearFarm(VILLAGE_START, bed.actor));
    // Six distinct plot centres inside the bed.
    const centres = Array.from({ length: 6 }, (_, i) => plotCenter(bed, i));
    assert.equal(new Set(centres.map((c) => `${c.x},${c.z}`)).size, 6);
    for (const c of centres)
      assert.ok(Math.abs(c.x - r.x) < r.w / 2 && Math.abs(c.z - r.z) < r.d / 2);
    // In front of (or beside) the friend's own home.
    const home = VILLAGE_PLACES.find((p) => p.actor === bed.actor);
    assert.ok(Math.hypot(home.entry.x - bed.x, home.entry.z - bed.z) < 7);
  }
});

test('fruit trees map every FRUIT_TREES id to a reachable orchard tree', () => {
  assert.deepEqual(Object.keys(FRUIT_TREE_POINTS).sort(), [...FRUIT_TREES].sort());
  for (const [id, p] of Object.entries(FRUIT_TREE_POINTS)) {
    let stand = null;
    for (let a = 0; a < 24 && !stand; a++) {
      const q = {
        x: p.x + Math.cos((a / 24) * Math.PI * 2) * 1.5,
        z: p.z + Math.sin((a / 24) * Math.PI * 2) * 1.5,
      };
      if (reachable(q)) stand = q;
    }
    assert.ok(stand, `${id} has a reachable spot`);
    assert.equal(nearestFruitTree(stand, TREE_REACH)?.id, id);
  }
});

test('the market stall is reachable and off every route', () => {
  const front = { x: VILLAGE_MARKET.x, z: VILLAGE_MARKET.z + VILLAGE_MARKET.depth / 2 + 0.8 };
  assert.ok(reachable(front));
  assert.ok(nearMarket(front));
  assert.ok(!villageCanWalk({ x: VILLAGE_MARKET.x, z: VILLAGE_MARKET.z }));
  for (const s of VILLAGE_PATHS)
    assert.ok(
      segmentDistance(VILLAGE_MARKET.x, VILLAGE_MARKET.z, s) >
        s[4] / 2 + Math.min(VILLAGE_MARKET.width, VILLAGE_MARKET.depth) / 2,
    );
});

test('NPC schedule is deterministic, walkable and slow', () => {
  const t0 = kst(14, 5);
  for (let actor = 0; actor < 7; actor++) {
    for (const w of npcWaypoints(actor)) assert.ok(reachable(w), `waypoint of ${actor}`);
    // Same time → same pose (every client agrees).
    assert.deepEqual(npcPose(actor, t0), npcPose(actor, t0));
    let previous = npcPose(actor, t0);
    let walked = false;
    for (let k = 1; k <= 400; k++) {
      const pose = npcPose(actor, t0 + k * 1000);
      assert.ok(villageCanWalk(pose.point) || !pose.walking, `npc ${actor} off the ground`);
      const step = Math.hypot(pose.point.x - previous.point.x, pose.point.z - previous.point.z);
      // Within a slot the NPC never moves faster than NPC_SPEED (slot changes start at the old end).
      assert.ok(step <= NPC_SPEED * 1.001 + 1e-9, `npc ${actor} speed ${step}`);
      if (pose.walking) walked = true;
      previous = pose;
    }
    assert.ok(walked, `npc ${actor} walks sometimes`);
  }
  // Consecutive slots always pick a different waypoint.
  for (let slot = 1; slot < 200; slot++)
    assert.notEqual(npcTargetIndex(3, slot), npcTargetIndex(3, slot - 1));
  // Each NPC rests at its target by the end of a slot.
  const end = npcPose(2, Math.floor(t0 / NPC_SLOT_MS) * NPC_SLOT_MS + NPC_SLOT_MS - 1 - 2 * 11_317);
  assert.equal(end.walking, false);
});

test('NPC line uses the friend status text, else a default', () => {
  assert.equal(npcLine(1, '  딸기 심는 날!  ', 0), '딸기 심는 날!');
  const line = npcLine(1, '', kst(10));
  assert.ok(line.length > 0);
  assert.equal(npcLine(1, null, kst(10)), line);
});

test('day phase and lighting follow KST time smoothly', () => {
  assert.equal(kstHour(kst(0)), 0);
  assert.equal(dayPhase(kst(6)), 'morning');
  assert.equal(dayPhase(kst(12)), 'day');
  assert.equal(dayPhase(kst(18)), 'evening');
  assert.equal(dayPhase(kst(22)), 'night');
  assert.equal(dayPhase(kst(2)), 'night');
  assert.equal(dayPhase(kst(4, 59)), 'night');
  assert.equal(dayPhase(kst(5)), 'morning');
  assert.equal(dayLighting(kst(13)).lamps, 0);
  assert.equal(dayLighting(kst(1)).lamps, 1);
  assert.ok(dayLighting(kst(1)).exposure < dayLighting(kst(13)).exposure);
  // No jumps: one minute never changes intensity by more than a little.
  for (let m = 0; m < 24 * 60; m += 7) {
    const a = dayLighting(kst(0, m)),
      b = dayLighting(kst(0, m + 1));
    assert.ok(Math.abs(a.sunIntensity - b.sunIntensity) < 0.05, `sun jump at ${m}`);
    assert.ok(Math.abs(a.lamps - b.lamps) < 0.05, `lamp jump at ${m}`);
    assert.match(a.sky, /^#[0-9a-f]{6}$/);
  }
});

test('plot stages map for me (farm) and friends (public by uid)', () => {
  const uidA = '11111111-1111-4111-8111-111111111111',
    uidB = '22222222-2222-4222-8222-222222222222';
  const life = {
    me: {
      farm: [
        { crop: 'carrot', plantedAt: 0, wateredAt: null, readyAt: 1, stage: 3, ready: true },
        ...Array.from({ length: 5 }, () => ({ crop: null, plantedAt: 0, wateredAt: null, readyAt: null, stage: 0, ready: false })),
      ],
    },
    actors: { [uidA]: 3, [uidB]: 5 },
    housesPlotsPublic: {
      [uidA]: [],
      [uidB]: [{ crop: 'pumpkin', stage: 2 }, { crop: 'tomato', stage: 9 }, { crop: null, stage: 3 }],
    },
  };
  const mine = plotsForActor(life, 3, 3);
  assert.equal(mine.length, 6);
  assert.deepEqual(mine[0], { crop: 'carrot', stage: 3 });
  const friend = plotsForActor(life, 5, 3);
  assert.deepEqual(friend.slice(0, 4), [
    { crop: 'pumpkin', stage: 2 },
    { crop: 'tomato', stage: 3 },
    { crop: null, stage: 0 },
    { crop: null, stage: 0 },
  ]);
  assert.deepEqual(plotsForActor(life, 0, 3), Array.from({ length: 6 }, () => ({ crop: null, stage: 0 })));
  assert.equal(plotsForActor(null, 1, 3).length, 6);
  assert.equal(cropVisual(null, 2), null);
  assert.equal(cropVisual('carrot', 0).mound, true);
  assert.equal(cropVisual('carrot', 3).fruit, true);
  assert.ok(cropVisual('tomato', 2).height > cropVisual('tomato', 1).height);
});

test('shop trophies are room props that survive the strict save validator', () => {
  const ids = ['trophy-carrot', 'trophy-tomato', 'trophy-pumpkin', 'trophy-strawberry', 'fruit-basket'];
  let room = defaultBedroom(3);
  for (const [i, ref] of ids.entries()) {
    const item = placeNew(room, ref, { x: -1 + i * 0.6, z: 2.4 }, 'rare-' + i);
    room = withItem(room, item);
  }
  const read = readBedroomStrict(JSON.parse(JSON.stringify(room)), 3);
  for (const id of ids) {
    assert.equal(catalogEntry(id).category, 'rare');
    assert.equal(catalogEntry(id).unlock, id);
    assert.ok(read.items.some((item) => item.ref === id), id);
  }
});

test('settings default to music and day/night on', () => {
  assert.equal(DEFAULT_SETTINGS.music, true);
  assert.equal(DEFAULT_SETTINGS.dayNight, true);
  assert.equal(readSettings(JSON.stringify({ dayNight: false })).dayNight, false);
  assert.equal(readSettings(JSON.stringify({ music: 'x' })).music, true);
});

test('NPC waypoints stay where the camera can see them (not behind roofs)', () => {
  for (let actor = 0; actor < 7; actor++)
    for (const point of npcWaypoints(actor)) {
      assert.equal(villageOccluded(point), false, `${actor} ${JSON.stringify(point)}`);
      assert.ok(villageCanWalk(point), `${actor} walkable`);
    }
  // The occlusion model does flag a point tucked behind 분장실.
  const wardrobe = VILLAGE_PLACES.find((p) => p.id === 'wardrobe');
  assert.equal(villageOccluded({ x: wardrobe.x, z: wardrobe.z - wardrobe.depth / 2 - 0.3 }), true);
});

test('the decorative shared field points to my own plots', () => {
  assert.equal(nearCommons(VILLAGE_FARMLAND_ENTRY), true);
  assert.equal(nearCommons({ x: VILLAGE_FARMLAND.x, z: VILLAGE_FARMLAND.z + 10 }), false);
  // No farm bed is near the shared field, so the prompts never compete.
  for (const bed of FARM_BEDS) assert.equal(nearCommons(farmFront(bed)), false, String(bed.actor));
});
