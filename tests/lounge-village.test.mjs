import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VILLAGE_BOUNDS,
  VILLAGE_DISTRICTS,
  VILLAGE_FARMLAND,
  VILLAGE_FARMLAND_ENTRY,
  VILLAGE_ORCHARD,
  VILLAGE_PLACES,
  VILLAGE_RIVER,
  VILLAGE_START,
  VILLAGE_TERRACE,
  villageCanWalk,
  villageFromNetwork,
  villageLineClear,
  villagePath,
  villageStep,
  villageToNetwork,
} from '../app/lounge-village-layout.ts';

test('village places retain all resident homes and public destinations', () => {
  const homes = VILLAGE_PLACES.filter((place) => place.kind === 'home');
  assert.deepEqual(
    homes.map((place) => place.name),
    [
      '도원의 집',
      '강재의 집',
      '민서의 집',
      '승준의 집',
      '민재의 집',
      '재민의 집',
      '호현의 집',
    ],
  );
  assert.deepEqual(
    homes.map((place) => place.actor),
    [0, 1, 2, 3, 4, 5, 6],
  );
  assert.deepEqual(
    VILLAGE_PLACES.slice(-3).map((place) => place.destination),
    ['lounge', 'casino', 'wardrobe'],
  );
  assert.equal(VILLAGE_PLACES.length, 10);
  assert.deepEqual(VILLAGE_TERRACE, {
    id: 'terrace',
    x: -8,
    z: 8,
    width: 5,
    depth: 3,
  });
  assert.equal(VILLAGE_ORCHARD.length, 8);
  assert.deepEqual(VILLAGE_BOUNDS, { width: 80, depth: 60, radius: 0.35 });
  assert.deepEqual(VILLAGE_FARMLAND, {
    id: 'farmland',
    x: 8.75,
    z: 6.5,
    width: 5,
    depth: 3,
  });
  assert.ok(villageCanWalk(VILLAGE_FARMLAND_ENTRY));
  assert.ok(villagePath(VILLAGE_START, VILLAGE_FARMLAND_ENTRY).length > 0);
});

test('all entrances have collision-free routes from the village start', () => {
  assert.ok(villageCanWalk(VILLAGE_START));
  for (const place of VILLAGE_PLACES) {
    assert.ok(
      villageCanWalk(place.entry),
      `${place.id} entry should be walkable`,
    );
    const path = villagePath(VILLAGE_START, place.entry);
    assert.ok(path.length > 0, `${place.id} should be reachable`);
    let previous = VILLAGE_START;
    for (const waypoint of path) {
      assert.ok(
        villageLineClear(previous, waypoint),
        `${place.id} path segment should be clear`,
      );
      previous = waypoint;
    }
    assert.deepEqual(path.at(-1), place.entry);
  }
});

test('walk collision checks cover buildings, terrace, fountain, river and bounds', () => {
  assert.equal(villageCanWalk({ x: Number.NaN, z: 0 }), false);
  assert.equal(villageCanWalk({ x: 0, z: Number.POSITIVE_INFINITY }), false);
  assert.equal(villageCanWalk({ x: VILLAGE_BOUNDS.width / 2, z: 0 }), false);
  assert.equal(
    villageCanWalk({ x: VILLAGE_PLACES[0].x, z: VILLAGE_PLACES[0].z }),
    false,
  );
  assert.equal(
    villageCanWalk({ x: VILLAGE_TERRACE.x, z: VILLAGE_TERRACE.z }),
    false,
  );
  for (const tree of VILLAGE_ORCHARD) assert.equal(villageCanWalk(tree), false);
  assert.equal(villageCanWalk(VILLAGE_FARMLAND), false);
  assert.equal(villageCanWalk({ x: 0, z: 0 }), false);
  for (const bridge of VILLAGE_RIVER.bridges) {
    assert.equal(villageCanWalk({ x: bridge.x, z: 14.5 }), true);
    assert.equal(villageCanWalk({ x: bridge.x + 5, z: 14.5 }), false);
  }
  assert.equal(villageCanWalk({ x: 0, z: 17 }), true);
});

test('expanded districts and all three bridges are reachable on both banks', () => {
  assert.deepEqual(
    VILLAGE_DISTRICTS.map(({ id }) => id),
    ['west-orchard', 'south-camp', 'east-boardwalk', 'north-forest'],
  );
  for (const district of VILLAGE_DISTRICTS) {
    assert.ok(
      villageCanWalk(district.point),
      `${district.id} point is walkable`,
    );
    const route = villagePath(VILLAGE_START, district.point);
    assert.ok(route.length > 0, `${district.id} is reachable`);
    let previous = VILLAGE_START;
    for (const waypoint of route) {
      assert.ok(
        villageLineClear(previous, waypoint),
        `${district.id} route clears obstacles`,
      );
      previous = waypoint;
    }
    assert.deepEqual(route.at(-1), district.point);
  }
  for (const bridge of VILLAGE_RIVER.bridges) {
    const northBank = { x: bridge.x, z: VILLAGE_RIVER.minZ - 2 };
    const southBank = { x: bridge.x, z: VILLAGE_RIVER.maxZ + 2 };
    const crossing = villagePath(northBank, southBank);
    assert.ok(crossing.length > 0, `bridge ${bridge.x} crosses the river`);
    assert.deepEqual(crossing.at(-1), southBank);
  }
});

test('step slides along obstacles and ignores invalid movement', () => {
  const from = { x: -8, z: 12 };
  const next = villageStep(from, 0, -8);
  assert.ok(villageCanWalk(next));
  assert.ok(next.z < from.z);
  assert.deepEqual(villageStep(from, Number.NaN, 1), from);
  assert.deepEqual(villageStep(from, 21, 0), from);
});

test('blocked clicks resolve to reachable ground and invalid inputs are ignored', () => {
  const path = villagePath(VILLAGE_START, { x: 16, z: 5 });
  assert.ok(path.length > 0);
  assert.ok(villageCanWalk(path.at(-1)));
  assert.notDeepEqual(path.at(-1), { x: 16, z: 5 });
  assert.deepEqual(villagePath({ x: NaN, z: 0 }, VILLAGE_START), []);
  assert.deepEqual(villagePath(VILLAGE_START, { x: 0, z: Infinity }), []);
});

test('paths begin at exact off-grid positions and clear irregular obstacle edges', () => {
  const starts = [
    { x: -11.64, z: 5.1 },
    { x: -2.36, z: 0.15 },
    { x: -8, z: 9.86 },
    { x: 2.14, z: 15 },
  ];
  for (const start of starts) {
    assert.ok(
      villageCanWalk(start),
      `start ${JSON.stringify(start)} should be valid`,
    );
    const path = villagePath(start, { x: 5.3, z: -1.7 });
    assert.ok(path.length > 0);
    let previous = start;
    for (const waypoint of path) {
      assert.ok(
        villageLineClear(previous, waypoint),
        `segment from ${JSON.stringify(previous)} should be clear`,
      );
      previous = waypoint;
    }
  }
});

test('network conversion round-trips and clamps to existing server ranges', () => {
  for (const point of [
    VILLAGE_START,
    { x: -39.5, z: -29.5 },
    { x: 39.5, z: 29.5 },
  ]) {
    const converted = villageToNetwork(point);
    const roundTrip = villageFromNetwork(converted);
    assert.ok(Math.abs(roundTrip.x - point.x) < 1e-9);
    assert.ok(Math.abs(roundTrip.z - point.z) < 1e-9);
  }
  assert.deepEqual(villageToNetwork({ x: -100, z: -100 }), { x: 15, y: 42 });
  assert.deepEqual(villageToNetwork({ x: 100, z: 100 }), { x: 85, y: 88 });
  assert.deepEqual(villageFromNetwork({ x: -20, y: 100 }), { x: -40, z: 30 });
});
