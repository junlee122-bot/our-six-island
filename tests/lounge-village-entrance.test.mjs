import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VILLAGE_PLACES,
  villageCanWalk,
} from '../app/lounge-village-layout.ts';
import {
  villageCanEnterPlace,
  villageNearbyEntrance,
  villageReturnPoint,
} from '../app/lounge-village-entrance.ts';
import { FARM_HOME_PLACES } from '../app/lounge-farm-layout.ts';

test('public buildings and only the player-owned home can be entered', () => {
  // 우리 농장: the houses are on the farm; the same door rule applies there.
  const ownHome = FARM_HOME_PLACES.find((place) => place.actor === 2);
  const otherHome = FARM_HOME_PLACES.find((place) => place.actor === 1);
  const hall = VILLAGE_PLACES.find((place) => place.kind === 'hall');
  assert.ok(ownHome && otherHome && hall);
  assert.equal(villageCanEnterPlace(ownHome, 2), true);
  assert.equal(villageCanEnterPlace(ownHome, 1), false);
  assert.equal(villageCanEnterPlace(otherHome, 2), false);
  assert.equal(villageCanEnterPlace(hall, 2), true);
});

test('nearby entrance requires proximity and clear walkable ground', () => {
  const hall = VILLAGE_PLACES.find((place) => place.kind === 'hall');
  const near = villageNearbyEntrance(hall.entry, 0);
  assert.equal(near?.place.id, hall.id);
  assert.equal(near?.canEnter, true);
  assert.equal(villageNearbyEntrance({ x: hall.entry.x, z: hall.entry.z + 1.41 }, 0), null);
  const throughWall = { x: hall.entry.x, z: hall.z - hall.depth / 2 - 0.9 };
  assert.equal(villageCanWalk(throughWall), true);
  assert.equal(villageNearbyEntrance(throughWall, 0, 7), null);
});

test('the hub has no house doors any more (우리 농장 has them)', () => {
  assert.equal(VILLAGE_PLACES.filter((place) => place.kind === 'home').length, 0);
  for (const x of [-23.2, -14, -7, 0, 7, 14, 23.2]) assert.equal(villageNearbyEntrance({ x, z: -18.3 }, 2), null);
});

test('interior return points remain walkable outside every matching entrance', () => {
  for (const place of VILLAGE_PLACES) {
    const point = villageReturnPoint(place);
    assert.ok(
      villageCanWalk(point),
      `${place.id} return point must be outside`,
    );
    const distance = Math.hypot(
      point.x - place.entry.x,
      point.z - place.entry.z,
    );
    assert.ok(
      distance > 1.4,
      `${place.id} return point must dismiss its prompt`,
    );
    assert.ok(
      distance <= (place.id === 'wardrobe' ? 4.5 : 2.5),
      `${place.id} return point should remain close to its entrance`,
    );
    assert.equal(villageNearbyEntrance(point, place.actor), null);
  }
});
