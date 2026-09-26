// VILL-2: the enlarged valley's fishing spots (standing points, reach, bobber
// water), every spot's own fish table, the new species' art, and the saved
// village positions that still land on walkable ground.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FISH, FISH_SPOTS, SPOT_INFO } from '../app/lounge-items.ts';
import { fishCandidates } from '../app/lounge-life-plus.ts';
import {
  VILLAGE_BOUNDS,
  VILLAGE_START,
  VILLAGE_YARDS,
  villageCanWalk,
  villageFromNetwork,
  villagePath,
  villageToNetwork,
} from '../app/lounge-village-layout.ts';
import { FISH_REACH, FISH_STAND, bobberPoint, nearestFishSpot } from '../app/lounge-village-spots.ts';

const kst = (m, d, h) => Date.UTC(2026, m - 1, d, h - 9);

test('every fishing spot has a reachable stand where E fishes that spot', () => {
  assert.equal(FISH_SPOTS.length, 9);
  for (const spot of FISH_SPOTS) {
    const stand = FISH_STAND[spot];
    assert.ok(villageCanWalk(stand), `${spot} stand is walkable`);
    assert.ok(villagePath(VILLAGE_START, stand).length > 0, `${spot} stand is reachable`);
    const near = nearestFishSpot(stand, FISH_REACH);
    assert.equal(near?.spot, spot, `${spot} stand fishes ${near?.spot}`);
    // The bobber lands on water, not on walkable ground.
    const b = bobberPoint(spot, stand);
    assert.ok(!villageCanWalk(b), `${spot} bobber (${b.x.toFixed(1)}, ${b.z.toFixed(1)}) is in the water`);
    assert.ok(SPOT_INFO[spot].name && SPOT_INFO[spot].note);
  }
  // The plaza is not a fishing spot.
  assert.equal(nearestFishSpot(VILLAGE_START), null);
});

test('each spot has its own fish table: species, rarities and times differ', () => {
  const tables = {};
  for (const spot of FISH_SPOTS) {
    const fish = FISH.filter((f) => f.spots.includes(spot));
    tables[spot] = fish.map((f) => f.id).sort().join(',');
    assert.ok(fish.length >= 5, `${spot} has ${fish.length} species`);
    assert.ok(fish.some((f) => f.weight < 10), `${spot} has a rare fish`);
    // Something bites in every season (day or night, dry or rain).
    for (const [season, t] of [['spring', kst(9, 8, 12)], ['summer', kst(9, 15, 12)], ['autumn', kst(9, 22, 12)], ['winter', kst(9, 29, 12)]]) {
      const any = ['sunny', 'rain'].some((w) =>
        [t, t + 10 * 3_600_000].some((at) => fishCandidates(spot, season, w, at).length > 0),
      );
      assert.ok(any, `${spot} has fish in ${season}`);
    }
  }
  assert.equal(new Set(Object.values(tables)).size, FISH_SPOTS.length, 'no two spots share a table');
  // Night harbor fish are all night fish (the spot is closed by day).
  for (const f of FISH.filter((f) => f.spots.length === 1 && f.spots[0] === 'harbor')) assert.equal(f.time, 'night', f.id);
  assert.equal(SPOT_INFO.harbor.night, true);
  assert.equal(SPOT_INFO.falls.rod, 2);
});

test('every fish has painted art (no emoji fallback)', () => {
  const src = fs.readFileSync(new URL('../app/lounge/ItemIcon.tsx', import.meta.url), 'utf8');
  const looks = src.slice(src.indexOf('const FISH_LOOK'), src.indexOf('function fishArt'));
  for (const f of FISH) assert.match(looks, new RegExp(`\\b${f.id}: \\{ shape:`), `${f.id} has a FISH_LOOK`);
});

test('yards and saved positions fit the 96 × 76 valley', () => {
  assert.deepEqual([VILLAGE_BOUNDS.width, VILLAGE_BOUNDS.depth], [96, 76]);
  for (const y of VILLAGE_YARDS) assert.ok(y.x0 > -VILLAGE_BOUNDS.width / 2 && y.x1 < VILLAGE_BOUNDS.width / 2);
  // Old network positions (the server keeps x 15..85, y 42..88) decode to
  // points in the new valley; the plaza default still lands on the plaza.
  for (let x = 15; x <= 85; x += 7)
    for (let y = 42; y <= 88; y += 4.6) {
      const p = villageFromNetwork({ x, y });
      assert.ok(Math.abs(p.x) <= VILLAGE_BOUNDS.width / 2 && Math.abs(p.z) <= VILLAGE_BOUNDS.depth / 2);
    }
  const plaza = villageFromNetwork(villageToNetwork(VILLAGE_START));
  assert.ok(Math.hypot(plaza.x - VILLAGE_START.x, plaza.z - VILLAGE_START.z) < 1e-9);
});
