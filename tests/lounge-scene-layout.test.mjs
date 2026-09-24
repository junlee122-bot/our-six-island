import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCENE_LAYOUT,
  sceneCanWalk,
  sceneColliders,
  sceneStep,
  unprojectFloor,
} from '../app/lounge-scene-layout.ts';

test('hall and casino tables are solid while the entrance floor stays open', () => {
  for (const area of ['lounge', 'casino']) {
    const colliders = sceneColliders(area);
    assert.equal(colliders.length, SCENE_LAYOUT[area].tables.length);
    for (const collider of colliders)
      assert.equal(sceneCanWalk(collider, area), false, `${collider.game} blocks`);
    assert.ok(sceneCanWalk({ x: 50, y: 88 }, area), 'front entrance is open');
    for (const table of SCENE_LAYOUT[area].tables) {
      // Standing just in front of the table (where its label is) is allowed.
      const front = unprojectFloor({ x: table.foot.x, y: table.foot.y + 4 }, area);
      assert.ok(sceneCanWalk(front, area), `${table.game} front is reachable`);
    }
  }
});

test('continuous scene movement slides along tables instead of passing through', () => {
  const area = 'casino';
  const poker = sceneColliders(area).find((c) => c.game === 'poker');
  let point = { x: poker.x, y: 88 };
  for (let i = 0; i < 80; i++) point = sceneStep(point, 0, -0.5, area);
  assert.ok(point.y > poker.y + poker.ry, 'walking up stops at the table');
  let slide = { x: poker.x - 3, y: poker.y + poker.ry + 2.4 };
  assert.ok(sceneCanWalk(slide, area));
  for (let i = 0; i < 20; i++) slide = sceneStep(slide, 0.4, -0.4, area);
  assert.ok(slide.x > poker.x - 3, 'diagonal input slides sideways');
  assert.ok(sceneCanWalk(slide, area));
  assert.deepEqual(sceneStep({ x: 50, y: 88 }, Number.NaN, 1, area), { x: 50, y: 88 });
  const clamped = sceneStep({ x: 84, y: 87 }, 10, 10, area);
  assert.ok(clamped.x <= 85 && clamped.y <= 88);
});
