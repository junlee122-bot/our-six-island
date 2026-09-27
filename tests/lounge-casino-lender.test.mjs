import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CASINO_LENDER_SPOT, CASINO_LENDER_FRONT, CASINO_LENDER_REACH,
  CASINO_LENDER_RADIUS, LENDER_NAME, nearCasinoLender,
} from '../app/lounge-casino-lender.ts';
import {
  SCENE_PLAYER_RADIUS, sceneCanWalk, sceneNearestTable,
  sceneSeatPoint, sceneTableSide,
} from '../app/lounge-scene-layout.ts';
import {
  INTERIOR_DOOR, interiorAction, interiorCanWalk, interiorHover,
  interiorPath, interiorStep, interiorTables, interiorToWorld, segmentWalkable,
} from '../app/lounge-interior-layout.ts';

test('casino lender reach is shared, bounded and only available inside the casino', () => {
  assert.equal(LENDER_NAME, '로제');
  assert.ok(nearCasinoLender(CASINO_LENDER_FRONT, 'casino'));
  assert.ok(nearCasinoLender({ x: 50 + CASINO_LENDER_REACH, y: 45 }, 'casino'));
  for (const point of [
    { x: 50 + CASINO_LENDER_REACH + .01, y: 45 },
    { x: 50, y: 41.9 }, { x: NaN, y: 45 }, { x: 50, y: Infinity },
    INTERIOR_DOOR,
  ]) assert.equal(nearCasinoLender(point, 'casino'), false);
  for (const area of ['lounge', 'tavern', 'village', 'bank', ''])
    assert.equal(nearCasinoLender(CASINO_LENDER_FRONT, area), false);
});

test('lender feet block both renderers while the marked approach remains walkable', () => {
  assert.deepEqual(interiorToWorld(CASINO_LENDER_SPOT), { x: 0, z: -4 });
  for (const canWalk of [sceneCanWalk, interiorCanWalk]) {
    assert.equal(canWalk(CASINO_LENDER_SPOT, 'casino'), false);
    assert.ok(canWalk(CASINO_LENDER_FRONT, 'casino'));
    assert.ok(canWalk(CASINO_LENDER_SPOT, 'tavern'));
  }
  assert.equal(sceneNearestTable(CASINO_LENDER_FRONT, 'casino'), null);
  assert.deepEqual(interiorAction(CASINO_LENDER_FRONT, 'casino'), { kind: 'lender' });
  assert.deepEqual(interiorHover(CASINO_LENDER_SPOT, 'casino'), { kind: 'lender' });
  assert.notEqual(interiorHover(CASINO_LENDER_SPOT, 'tavern')?.kind, 'lender');
});

test('the independent lender preserves every casino table approach and chair', () => {
  for (const table of interiorTables('casino')) {
    const approach = sceneTableSide('casino', table.game);
    assert.ok(interiorCanWalk(approach, 'casino'), table.game);
    assert.deepEqual(interiorAction(approach, 'casino'), { kind: 'table', game: table.game });
    for (let count = 2; count <= 7; count++)
      for (let seat = 0; seat < count; seat++) {
        const point = sceneSeatPoint('casino', table.game, seat, count);
        const distance = Math.hypot(point.x - CASINO_LENDER_SPOT.x, point.y - CASINO_LENDER_SPOT.y);
        assert.ok(distance > CASINO_LENDER_RADIUS + SCENE_PLAYER_RADIUS, `${table.game} chair ${seat}/${count}`);
      }
  }
});

test('walking from the door and each table reaches the lender without crossing obstacles', () => {
  const starts = [INTERIOR_DOOR, ...interiorTables('casino').map(t => sceneTableSide('casino', t.game)), { x: 57, y: 43 }];
  for (const start of starts) {
    const path = interiorPath(start, CASINO_LENDER_FRONT, 'casino');
    assert.ok(path.length, `route from ${JSON.stringify(start)}`);
    let point = start;
    for (const next of path) {
      assert.ok(segmentWalkable(point, next, 'casino'), `segment ${JSON.stringify(point)} → ${JSON.stringify(next)}`);
      point = next;
    }
    assert.deepEqual(point, CASINO_LENDER_FRONT);
    assert.ok(nearCasinoLender(point, 'casino'));
  }
});

test('keyboard walking cannot pass through the lender', () => {
  let point = { ...CASINO_LENDER_FRONT };
  for (let step = 0; step < 20; step++) {
    point = interiorStep(point, 0, -.5, 'casino');
    assert.ok(interiorCanWalk(point, 'casino'));
    assert.ok(Math.hypot(point.x - 50, point.y - 45) >= CASINO_LENDER_RADIUS + SCENE_PLAYER_RADIUS * .7 - 1e-6);
  }
});
