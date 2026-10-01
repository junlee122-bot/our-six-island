import test from 'node:test';
import assert from 'node:assert/strict';
import { DISPLAY_FRAME_MS, FISHING_DRAW_SHARE, FISHING_FRAME_MS, FISHING_SLOW_FRAME_MS, FrameCost, fishingFrameDue } from '../app/lounge-fishing-frames.ts';

test('behind the fishing overlay a fast GPU draws about thirty frames a second', () => {
  const fast = 3;
  assert.equal(fishingFrameDue('wait', 1_000 + FISHING_FRAME_MS - 1, 1_000, fast, false), false);
  assert.equal(fishingFrameDue('wait', 1_000 + FISHING_FRAME_MS, 1_000, fast, false), true);
  // A fast GPU still shows the bobber dip and the fight.
  for (const phase of ['bite', 'reeling', 'fight', 'result']) assert.equal(fishingFrameDue(phase, 1_000, 900, fast, true), true, phase);
});

test('a slow GPU spends only a small share of the time drawing, and never across a bite', () => {
  const slow = 900;
  const gap = slow / FISHING_DRAW_SHARE;
  assert.ok(gap > 7_000);
  assert.equal(fishingFrameDue('wait', 1_000 + gap - 1, 1_000, slow, false), false);
  assert.equal(fishingFrameDue('wait', 1_000 + gap, 1_000, slow, false), true);
  // The cast and the result draw at once; the bite and the hook in flight wait.
  assert.equal(fishingFrameDue('casting', 1_001, 1_000, slow, true), true);
  assert.equal(fishingFrameDue('result', 1_001, 1_000, slow, true), true);
  for (const phase of ['bite', 'reeling']) {
    assert.equal(fishingFrameDue(phase, 1_001, 1_000, slow, true), false, phase);
    assert.equal(fishingFrameDue(phase, 60_000, 1_000, slow, false), false, phase);
  }
  assert.equal(fishingFrameDue('bite', 1_001, 1_000, FISHING_SLOW_FRAME_MS, true), true, 'the limit itself still counts as fast');
});

test('the draw cost is the frame gap after a drawn frame, smoothed', () => {
  const cost = new FrameCost();
  cost.frame(0);
  assert.equal(cost.ms, 0, 'no drawn frame yet');
  cost.drew(100);
  cost.frame(1_000 + DISPLAY_FRAME_MS);
  assert.equal(cost.ms, 900);
  // Frames that did not draw are not measured.
  cost.frame(1_100);
  assert.equal(cost.ms, 900);
  // A frame that took no longer than the display costs nothing.
  cost.drew(2_000);
  cost.frame(2_000 + DISPLAY_FRAME_MS);
  assert.equal(Math.round(cost.ms), Math.round(900 * 0.7));
});
