import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WALK_FURNITURE,
  WALK_START,
  canWalk,
  walkLineClear,
  walkStep,
  findWalkPath,
} from '../app/lounge-bedroom-navigation.ts';

test('walk room has a valid starting point, solid furniture and bounded walls', () => {
  assert.ok(canWalk(WALK_START));
  for (const item of WALK_FURNITURE)
    assert.equal(canWalk(item), false, item.id);
  for (const point of [
    { x: 4, z: 0 },
    { x: 0, z: 3.3 },
    { x: NaN, z: 0 },
  ])
    assert.equal(canWalk(point), false);
});

test('continuous movement cannot tunnel through furniture or walls', () => {
  const from = { x: 2.55, z: 2 };
  const result = walkStep(from, 0, -4.5);
  assert.ok(canWalk(result));
  assert.ok(result.z >= -0.175, JSON.stringify(result));
  assert.ok(canWalk(walkStep(WALK_START, 12, 12)));
  assert.deepEqual(walkStep(WALK_START, Infinity, 0), WALK_START);
});

test('a blocked click resolves to reachable floor and every segment avoids furniture', () => {
  for (const target of [
    ...WALK_FURNITURE,
    { x: -3.3, z: -2.95 },
    { x: 20, z: 20 },
  ]) {
    const path = findWalkPath(WALK_START, target);
    assert.ok(path.length, JSON.stringify(target));
    let previous = WALK_START;
    for (const point of path) {
      assert.ok(canWalk(point));
      assert.ok(
        walkLineClear(previous, point),
        JSON.stringify({ previous, point }),
      );
      previous = point;
    }
  }
});

test('walking routes around the low table to open floor behind it', () => {
  const from = { x: -1.35, z: 0.7 },
    target = { x: -1.35, z: -1.38 };
  assert.equal(walkLineClear(from, target), false);
  const path = findWalkPath(from, target);
  assert.ok(path.length > 1);
  assert.deepEqual(path.at(-1), target);
  let previous = from;
  for (const point of path) {
    assert.ok(walkLineClear(previous, point));
    previous = point;
  }
});

test('invalid input cannot produce unbounded pathfinding or positions', () => {
  assert.equal(walkLineClear(WALK_START, { x: NaN, z: 0 }), false);
  assert.equal(walkLineClear({ x: Infinity, z: 0 }, WALK_START), false);
  assert.deepEqual(findWalkPath(WALK_START, { x: NaN, z: 0 }), []);
  assert.deepEqual(findWalkPath({ x: 999, z: 0 }, WALK_START), []);
  assert.deepEqual(walkStep(WALK_START, 1e6, 0), WALK_START);
});
