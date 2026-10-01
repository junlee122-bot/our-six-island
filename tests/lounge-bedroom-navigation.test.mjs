import test from 'node:test';
import assert from 'node:assert/strict';
import {
  besideCookTable,
  canWalk,
  walkStart,
  findWalkPath,
  nearestWalkable,
  roomObstacles,
  walkLineClear,
  walkStep,
} from '../app/lounge-bedroom-navigation.ts';
import { LEGACY_ROOM, ROOM_TIERS, catalogEntry, defaultBedroom, itemFootprint, legacyThemeRoom, roomShape, setActiveRoomShape } from '../app/lounge-bedroom-data.ts';
import { withItem } from '../app/lounge-bedroom-edit.ts';

/** A character is ~0.44 wide; paths must fit one with a little room to spare. */
const WIDE = 0.25;
/** Furnished rooms to walk in: the old themed rooms (model houses) in their shape. */
function furnished(actor) {
  setActiveRoomShape(LEGACY_ROOM);
  return legacyThemeRoom(actor);
}
test.afterEach(() => setActiveRoomShape(roomShape(0)));
const pathLength = (from, path) =>
  path.reduce((sum, p, i) => sum + Math.hypot(p.x - (i ? path[i - 1] : from).x, p.z - (i ? path[i - 1] : from).z), 0);
/** A walkable spot next to an item (the side facing the room first). */
function besides(room, ref, obstacles) {
  const f = itemFootprint(room.items.find((i) => i.ref === ref));
  const cx = (f.x0 + f.x1) / 2,
    cz = (f.z0 + f.z1) / 2;
  const spots = [
    { x: cx, z: f.z1 + 0.4 },
    { x: f.x0 - 0.4, z: cz + 0.3 },
    { x: f.x1 + 0.4, z: cz + 0.3 },
    { x: f.x0 - 0.4, z: f.z1 + 0.2 },
    { x: f.x1 + 0.4, z: f.z1 + 0.2 },
  ];
  return spots.find((p) => canWalk(p, obstacles, WIDE));
}

test('a new room is walkable in every tier: door → bed, kitchen counter and closet', () => {
  for (let tier = 0; tier < ROOM_TIERS.length; tier++) {
    const shape = roomShape(tier);
    setActiveRoomShape(shape);
    const room = defaultBedroom(0),
      obstacles = roomObstacles(room),
      start = walkStart();
    assert.ok(canWalk(start, obstacles, WIDE), `tier ${tier}: the door is clear`);
    const targets = [
      besides(room, 'bed', obstacles),
      besideCookTable(room, obstacles),
      { x: (shape.fixtures[1].x0 + shape.fixtures[1].x1) / 2, z: shape.fixtures[1].z1 + 0.4 },
      { x: shape.maxX - 0.5, z: shape.maxZ - 0.5 },
    ];
    for (const target of targets) {
      assert.ok(target && canWalk(target, obstacles, WIDE), `tier ${tier}: ${JSON.stringify(target)}`);
      assert.ok(findWalkPath(start, target, obstacles, { radius: WIDE, exact: true }).length > 0, `tier ${tier}`);
    }
    // The built-ins are solid.
    for (const f of shape.fixtures) assert.equal(canWalk({ x: (f.x0 + f.x1) / 2, z: (f.z0 + f.z1) / 2 }, obstacles), false, f.id);
  }
});

test('every furnished model house is walkable: door → bed, desk and the middle of the room, one character wide', () => {
  for (let actor = 0; actor < 7; actor++) {
    const room = furnished(actor),
      obstacles = roomObstacles(room),
      WALK_START = walkStart();
    assert.ok(canWalk(WALK_START, obstacles, WIDE), `${actor}: the door is clear`);
    /** @type {Array<[string, { x: number, z: number } | undefined]>} */
    const targets = [
      ['bed', besides(room, 'bed', obstacles)],
      ['desk', besides(room, 'desk', obstacles)],
      ['centre', { x: 0.5, z: 2.2 }],
      ['front corner', { x: 3.6, z: 3.4 }],
    ];
    for (const [name, target] of targets) {
      assert.ok(target && canWalk(target, obstacles, WIDE), `${actor}: ${name} has a free spot`);
      const path = findWalkPath(WALK_START, target, obstacles, { radius: WIDE, exact: true });
      assert.ok(path.length > 0, `${actor}: path to ${name}`);
      const end = path.at(-1);
      assert.ok(Math.hypot(end.x - target.x, end.z - target.z) < 0.05, `${actor}: reaches ${name}`);
      assert.ok(pathLength(WALK_START, path) < 25, `${actor}: ${name} path is not absurd`);
      let from = WALK_START;
      for (const p of path) {
        assert.ok(walkLineClear(from, p, obstacles, WIDE), `${actor}: ${name} segment clear`);
        from = p;
      }
    }
  }
});

test('furniture blocks walking; rugs, wall art and things on surfaces do not', () => {
  const room = furnished(0),
    obstacles = roomObstacles(room),
    ROOM = LEGACY_ROOM;
  for (const item of room.items) {
    const entry = catalogEntry(item.ref);
    const blocked = obstacles.some((o) => o.id === item.id);
    if (entry.mount === 'floor') assert.ok(blocked, item.id);
    if (entry.mount === 'rug' || entry.mount === 'wall') assert.equal(blocked, false, item.id);
    if (entry.mount === 'small' && item.y) assert.equal(blocked, false, item.id);
    if (entry.mount === 'floor') assert.equal(canWalk({ x: item.x, z: item.z }, obstacles), false, item.id);
  }
  // Walls are solid.
  for (const p of [{ x: ROOM.maxX, z: 0 }, { x: 0, z: ROOM.maxZ }, { x: NaN, z: 0 }]) assert.equal(canWalk(p, obstacles), false);
});

test('continuous movement cannot tunnel through furniture or walls', () => {
  const room = furnished(3),
    obstacles = roomObstacles(room),
    WALK_START = walkStart();
  const bed = room.items.find((i) => i.ref === 'bed');
  const f = itemFootprint(bed);
  const from = { x: bed.x, z: f.z1 + 0.6 };
  const result = walkStep(from, 0, -6, obstacles);
  assert.ok(canWalk(result, obstacles));
  assert.ok(result.z >= f.z1 + 0.2, JSON.stringify(result));
  assert.ok(canWalk(walkStep(WALK_START, 12, 12, obstacles), obstacles));
  assert.deepEqual(walkStep(WALK_START, Infinity, 0, obstacles), WALK_START);
});

test('pathfinding updates when the room changes, and blocked spots resolve to the nearest free one', () => {
  let room = furnished(2);
  const WALK_START = walkStart();
  const target = { x: 3.6, z: 2.0 };
  assert.ok(findWalkPath(WALK_START, target, roomObstacles(room), { exact: true }).length);
  // Wall the room in two with a row of wardrobes: the target becomes unreachable.
  for (const [i, z] of [-3.26, -1.66, -0.06, 1.54, 3.14].entries())
    room = withItem(room, { id: 'wall-' + i, kind: 'model', ref: 'wardrobe', x: 1.1, z, rotY: 90, scale: 1 });
  const walled = roomObstacles(room);
  assert.deepEqual(findWalkPath(WALK_START, target, walled, { exact: true }), []);
  // Standing inside new furniture: step to the nearest free spot.
  const inside = { x: 1.1, z: 0 };
  assert.equal(canWalk(inside, walled), false);
  const out = nearestWalkable(inside, walled);
  assert.ok(out && canWalk(out, walled) && Math.hypot(out.x - inside.x, out.z - inside.z) < 1.2);
});
