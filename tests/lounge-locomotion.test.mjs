import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceLocomotion,
  RUN_SPEED_MULTIPLIER,
} from '../app/lounge-locomotion.ts';

test('locomotion phase advances from actual travel and preserves facing while idle', () => {
  const start = { phase: 2, facing: 1 };
  const blocked = advanceLocomotion(
    start,
    { distance: 0, horizontal: -1 },
    'walk',
    5.2,
  );
  assert.equal(blocked.motion, 'idle');
  assert.deepEqual(blocked.state, start);

  const stepped = advanceLocomotion(
    blocked.state,
    { distance: 2.6, horizontal: -0.4 },
    'walk',
    5.2,
  );
  assert.equal(stepped.motion, 'walk');
  assert.equal(stepped.state.phase, 2.5);
  assert.equal(stepped.state.facing, -1);
});

test('phase follows traveled distance while horizontal projection controls facing', () => {
  const state = { phase: 0, facing: -1 };
  const walk = advanceLocomotion(
    state,
    { distance: 5.2, horizontal: 0 },
    'walk',
    5.2,
  );
  const run = advanceLocomotion(
    state,
    { distance: 5.2, horizontal: 0 },
    'run',
    5.2,
  );
  assert.equal(walk.state.phase, 1);
  assert.equal(run.state.phase, 1);
  const runningForOneSecond = advanceLocomotion(
    state,
    { distance: 5.2 * RUN_SPEED_MULTIPLIER, horizontal: 0 },
    'run',
    5.2,
  );
  assert.equal(runningForOneSecond.state.phase, RUN_SPEED_MULTIPLIER);
  assert.equal(walk.state.facing, -1);
  assert.equal(run.state.facing, -1);
  assert.equal(run.motion, 'run');
});

test('invalid and negative distances cannot advance the animation phase', () => {
  const state = { phase: 1.25, facing: 1 };
  assert.equal(
    advanceLocomotion(state, { distance: -1, horizontal: -5 }, 'run', 2.25)
      .motion,
    'idle',
  );
  assert.deepEqual(
    advanceLocomotion(
      state,
      { distance: Number.NaN, horizontal: Number.NaN },
      'walk',
      2.25,
    ).state,
    state,
  );
});
