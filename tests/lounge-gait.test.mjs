import test from 'node:test';
import assert from 'node:assert/strict';
import { gaitFrame, costumeGaitPoint } from '../app/lounge-gait.ts';

test('walk and run cycle through all poses with safe clocks and static reduced motion', () => {
  for (const motion of ['walk', 'run']) {
    assert.equal(
      new Set(Array.from({ length: 100 }, (_, i) => gaitFrame(motion, i / 30)))
        .size,
      6,
    );
    assert.equal(gaitFrame(motion, NaN), 0);
    assert.equal(gaitFrame(motion, -1), 0);
    assert.equal(gaitFrame(motion, 123, 6, true), 0);
  }
  assert.equal(gaitFrame('idle', 12), 0);
  assert.notEqual(gaitFrame('walk', 0.12), gaitFrame('run', 0.12));
});

test('custom outfit gait keeps head fixed while opposite feet take turns lifting', () => {
  for (const run of [false, true])
    for (const robe of [false, true]) {
      for (let frame = 0; frame < 8; frame++) {
        assert.deepEqual(costumeGaitPoint(0.5, 0.2, frame, run, robe), {
          x: 0.5,
          y: 0.2,
        });
        assert.deepEqual(costumeGaitPoint(0.5, 0.64, frame, run, robe), {
          x: 0.5,
          y: 0.64,
        });
      }
      const left = costumeGaitPoint(0.35, 1, 2, run, robe),
        right = costumeGaitPoint(0.65, 1, 2, run, robe);
      assert.equal(left.y, 1);
      assert.ok(right.y < 0.99);
      assert.ok(costumeGaitPoint(0.35, 1, 6, run, robe).y < 0.99);
      assert.equal(costumeGaitPoint(0.65, 1, 6, run, robe).y, 1);
    }
  assert.ok(
    costumeGaitPoint(0.65, 1, 2, true, false).y <
      costumeGaitPoint(0.65, 1, 2, false, false).y,
  );
});
