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

test('public buildings and only the player-owned home can be entered', () => {
  const ownHome = VILLAGE_PLACES.find(
    (place) => place.kind === 'home' && place.actor === 2,
  );
  const otherHome = VILLAGE_PLACES.find(
    (place) => place.kind === 'home' && place.actor === 1,
  );
  const hall = VILLAGE_PLACES.find((place) => place.kind === 'hall');
  assert.ok(ownHome && otherHome && hall);
  assert.equal(villageCanEnterPlace(ownHome, 2), true);
  assert.equal(villageCanEnterPlace(ownHome, 1), false);
  assert.equal(villageCanEnterPlace(otherHome, 2), false);
  assert.equal(villageCanEnterPlace(hall, 2), true);
});

test('nearby entrance requires proximity and clear walkable ground', () => {
  const home = VILLAGE_PLACES.find(
    (place) => place.kind === 'home' && place.actor === 0,
  );
  assert.ok(home);
  const near = villageNearbyEntrance(home.entry, 0);
  assert.equal(near?.place.id, home.id);
  assert.equal(near?.canEnter, true);
  assert.equal(
    villageNearbyEntrance({ x: home.entry.x, z: home.entry.z + 1.41 }, 0),
    null,
  );

  const throughWall = { x: home.entry.x, z: home.entry.z - 6.4 };
  assert.equal(villageCanWalk(throughWall), true);
  assert.equal(villageNearbyEntrance(throughWall, 0, 7), null);
});

test('approaching another resident home reports no entry access', () => {
  const home = VILLAGE_PLACES.find(
    (place) => place.kind === 'home' && place.actor === 1,
  );
  assert.ok(home);
  const nearby = villageNearbyEntrance(home.entry, 2);
  assert.equal(nearby?.place.id, home.id);
  assert.equal(nearby?.canEnter, false);
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
