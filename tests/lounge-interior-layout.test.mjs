import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOST_RADIUS,
  INTERIOR_DOOR,
  INTERIOR_ROOM,
  TABLE_HOST,
  hostSpot,
  hostStand,
  overTable,
  seatChair,
  interiorAction,
  interiorCanWalk,
  interiorHover,
  interiorPath,
  interiorStep,
  segmentWalkable,
  interiorTables,
  interiorToWorld,
  nearDoor,
  seatCount,
  tableSeats,
  worldToInterior,
} from '../app/lounge-interior-layout.ts';
import {
  SCENE_LAYOUT,
  sceneCanWalk,
  sceneColliders,
  sceneSeatPoint,
  sceneTableSide,
} from '../app/lounge-scene-layout.ts';

const AREAS = ['lounge', 'casino'];

test('the 3D floor maps the server floor onto the room and back', () => {
  for (const p of [
    { x: 15, y: 42 },
    { x: 85, y: 88 },
    { x: 50, y: 65 },
    { x: 31.4, y: 77.2 },
  ]) {
    const back = worldToInterior(interiorToWorld(p));
    assert.ok(Math.abs(back.x - p.x) < 1e-9 && Math.abs(back.y - p.y) < 1e-9);
  }
  // Every walkable spot lies inside the walls.
  for (const p of [
    { x: 15, y: 42 },
    { x: 85, y: 88 },
  ]) {
    const w = interiorToWorld(p);
    assert.ok(w.x > INTERIOR_ROOM.minX && w.x < INTERIOR_ROOM.maxX);
    assert.ok(w.z > INTERIOR_ROOM.minZ && w.z < INTERIOR_ROOM.maxZ);
  }
});

test('each interior shows the same tables as the flat floor', () => {
  for (const area of AREAS) {
    const tables = interiorTables(area);
    assert.deepEqual(
      tables.map((t) => t.game),
      SCENE_LAYOUT[area].tables.map((t) => t.game),
    );
    for (const t of tables) {
      assert.ok(t.rx > 0.5 && t.rz > 0.4, `${t.game} has a real footprint`);
      const c = sceneColliders(area).find((x) => x.game === t.game);
      assert.deepEqual(interiorToWorld(c), t.center);
    }
  }
});

test('dealer tables have their host standing clear of seats and the approach spot', () => {
  for (const area of AREAS)
    for (const t of interiorTables(area)) {
      const spot = hostSpot(area, t.game);
      if (!TABLE_HOST[t.game]) {
        assert.equal(spot, null, `${t.game} has no host`);
        continue;
      }
      assert.ok(spot, `${t.game} has a host spot`);
      assert.equal(t.host, TABLE_HOST[t.game]);
      assert.ok(spot.x >= 15 && spot.x <= 85 && spot.y >= 42 && spot.y <= 88);
      assert.ok(sceneCanWalk(spot, area), `${t.game} host is off the table`);
      const side = sceneTableSide(area, t.game);
      assert.ok(Math.hypot(side.x - spot.x, side.y - spot.y) > HOST_RADIUS + 1);
      for (let n = 2; n <= 7; n++)
        for (let i = 0; i < n; i++) {
          const seat = sceneSeatPoint(area, t.game, i, n);
          assert.ok(Math.hypot(seat.x - spot.x, seat.y - spot.y) > HOST_RADIUS + 1, `${t.game} seat ${i}/${n}`);
        }
      // Hosts block walking; the spot beside the table stays open.
      assert.equal(interiorCanWalk(spot, area), false);
      assert.ok(interiorCanWalk(side, area), `${t.game} approach is walkable`);
    }
  assert.equal(TABLE_HOST.blackjack, 'lumi');
  assert.equal(TABLE_HOST.poker, 'lumi');
  assert.equal(TABLE_HOST.seotda, 'maehwa');
  assert.equal(TABLE_HOST.gostop, 'maehwa');
});

test('walking slides around tables and hosts and never leaves the floor', () => {
  for (const area of AREAS) {
    const hosts = interiorTables(area).filter((t) => t.hostAt);
    for (const t of hosts) {
      const spot = hostSpot(area, t.game);
      // Walk straight at the host from below: stop short, never pass through.
      let p = { x: spot.x, y: Math.min(88, spot.y + 12) };
      if (!interiorCanWalk(p, area)) continue;
      for (let i = 0; i < 60; i++) {
        p = interiorStep(p, 0, -0.5, area);
        assert.ok(interiorCanWalk(p, area), `${area} ${t.game} step ${i}`);
      }
      assert.ok(p.y > spot.y, `${t.game} host blocks`);
    }
    let p = { ...INTERIOR_DOOR };
    for (let i = 0; i < 200; i++) p = interiorStep(p, -1, 1, area);
    assert.ok(p.x >= 15 && p.y <= 88);
    assert.deepEqual(interiorStep(p, NaN, 1, area), p);
  }
});

test('the door is where I walk in and offers the way out', () => {
  for (const area of AREAS) {
    assert.ok(interiorCanWalk(INTERIOR_DOOR, area));
    assert.ok(nearDoor(INTERIOR_DOOR));
    assert.deepEqual(interiorAction(INTERIOR_DOOR, area), { kind: 'door' });
    assert.equal(interiorAction({ x: 50, y: 88 }, area)?.kind === 'door', false);
    const door = interiorToWorld(INTERIOR_DOOR);
    assert.ok(door.x < INTERIOR_ROOM.minX + 2, 'the door is on the left wall');
  }
});

test('the action button and the cursor pick the table in reach', () => {
  for (const area of AREAS)
    for (const c of sceneColliders(area)) {
      const side = sceneTableSide(area, c.game);
      assert.deepEqual(interiorAction(side, area), { kind: 'table', game: c.game });
      assert.deepEqual(interiorHover({ x: c.x, y: c.y }, area), { kind: 'table', game: c.game });
    }
  assert.equal(interiorHover({ x: 50, y: 88 }, 'lounge'), null);
  assert.deepEqual(interiorHover({ x: 12, y: 82 }, 'casino'), { kind: 'door' });
});

test('seat markers follow the table size and who sits where', () => {
  const empty = { phase: 'empty', required: 3, occupants: [] };
  assert.equal(seatCount(empty, 2), 2);
  assert.equal(seatCount({ phase: 'forming', required: 5, occupants: ['a'] }, 3), 5);
  assert.equal(seatCount({ phase: 'playing', required: 2, occupants: ['a', 'b', 'c'] }, 3), 3);
  assert.equal(seatCount({ phase: 'forming', required: 12, occupants: [] }, 3), 7);
  const seats = tableSeats('lounge', 'seotda', 3, ['me', 'friend']);
  assert.deepEqual(
    seats.map((s) => s.who),
    ['me', 'friend', null],
  );
  for (const [i, s] of seats.entries()) {
    assert.deepEqual(s.at, sceneSeatPoint('lounge', 'seotda', i, 3));
    assert.deepEqual(s.world, interiorToWorld(s.at));
  }
});

test('clicked walks go around the tables in the way', () => {
  const area = 'casino';
  const from = { x: 31.8, y: 82 };
  const goal = sceneTableSide(area, 'blackjack');
  assert.equal(segmentWalkable(from, goal, area), false, 'the poker table is in the way');
  const path = interiorPath(from, goal, area);
  assert.ok(path.length >= 2, 'goes round a corner');
  assert.deepEqual(path.at(-1), goal);
  let at = from;
  for (const p of path) {
    assert.ok(segmentWalkable(at, p, area), `leg to ${JSON.stringify(p)} is clear`);
    at = p;
  }
  // A clear line stays a single step; every table side is reachable from the door.
  assert.deepEqual(interiorPath(INTERIOR_DOOR, { x: 25, y: 86 }, 'lounge'), [{ x: 25, y: 86 }]);
  for (const a of AREAS)
    for (const c of sceneColliders(a)) {
      const side = sceneTableSide(a, c.game);
      const route = interiorPath(INTERIOR_DOOR, side, a);
      let p = INTERIOR_DOOR;
      for (const q of route) {
        assert.ok(segmentWalkable(p, q, a), `${a} ${c.game}`);
        p = q;
      }
    }
});

test('chairs are pulled up to the table edge, clear of the table, each other and the host', () => {
  for (const area of AREAS)
    for (const t of interiorTables(area))
      for (let n = 2; n <= 7; n++) {
        const chairs = tableSeats(area, t.game, n, []).map((s) => ({ s, c: seatChair(t, s.world) }));
        for (const { s, c } of chairs) {
          // Off the table, but closer to it than the standing seat spot.
          assert.ok(!overTable(t, c.x - t.center.x, c.z - t.center.z), `${t.game} chair over the table`);
          const toChair = Math.hypot(c.x - t.center.x, c.z - t.center.z);
          assert.ok(toChair <= Math.hypot(s.world.x - t.center.x, s.world.z - t.center.z) + 0.1);
          // Facing the table's centre.
          const f = Math.atan2(t.center.x - c.x, t.center.z - c.z);
          assert.ok(Math.abs(f - c.face) < 1e-9);
          assert.ok(c.x > INTERIOR_ROOM.minX + 0.3 && c.x < INTERIOR_ROOM.maxX - 0.3);
          assert.ok(c.z > INTERIOR_ROOM.minZ + 0.3 && c.z < INTERIOR_ROOM.maxZ - 0.3);
        }
        for (let i = 1; i < chairs.length; i++) {
          const a = chairs[i - 1].c,
            b = chairs[i].c;
          assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 0.5, `${area} ${t.game} ${n} seats: chairs overlap`);
        }
        const stand = hostStand(t, n);
        if (!t.hostAt) {
          assert.equal(stand, null);
          continue;
        }
        assert.ok(!overTable(t, stand.x - t.center.x, stand.z - t.center.z));
        for (const { c } of chairs)
          assert.ok(Math.hypot(c.x - stand.x, c.z - stand.z) >= 0.55, `${t.game} ${n}: host on a chair`);
      }
});
