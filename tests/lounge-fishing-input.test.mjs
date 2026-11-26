import test from 'node:test';
import assert from 'node:assert/strict';
import { fishingInput } from '../app/lounge-fishing-input.ts';
import { FightSim, TraceRecorder, replayTrace } from '../app/lounge-fish-minigame.ts';

test('releasing one of two fishing keys keeps the other key held', () => {
  const input = fishingInput();
  input.key('Space', true); input.key('ArrowUp', true);
  assert.equal(input.key('ArrowUp', false), true);
  assert.equal(input.key('KeyE', false), true, 'an unrelated release cannot lower the zone');
  assert.equal(input.key('Space', false), false);
  input.key('Space', true); input.key('Space', true);
  assert.equal(input.key('Space', false), false, 'auto-repeat is one held source');
});
test('mouse, touch and keyboard holds remain independent and blur clears every source', () => {
  const input = fishingInput();
  input.key('Space', true); input.pointer(1, true);
  assert.equal(input.pointer(1, false), true);
  input.pointer(2, true); input.pointer(3, true);
  assert.equal(input.key('Space', false), true);
  assert.equal(input.pointer(2, false), true);
  assert.equal(input.pointer(3, false), false);
  input.key('KeyW', true); input.pointer(4, true);
  assert.equal(input.clear(), false);
  assert.equal(input.holding(), false);
});
test('overlapping input still records the same server-replayable hold trace', () => {
  const setup = { seed: 123, behaviour: 'calm', difficulty: 10, bar: 3500, gain: 42, loss: 25, treasure: null };
  const sim = new FightSim(setup), trace = new TraceRecorder(), input = fishingInput();
  input.key('Space', true);
  for (let t = 0; t < 20; t++) {
    if (t === 5) input.key('ArrowUp', true);
    if (t === 10) input.key('ArrowUp', false);
    trace.push(input.holding()); sim.step(input.holding());
  }
  input.key('Space', false);
  while (!sim.state.done) { trace.push(false); sim.step(false); }
  const replayed = replayTrace(setup, trace.toRuns());
  assert.equal(replayed.ok, true);
  assert.deepEqual(replayed.result, sim.result());
  assert.equal(trace.toRuns()[0], 0);
  assert.equal(trace.toRuns()[1], 20, 'the auxiliary key release does not split the hold run');
});
