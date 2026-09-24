import test from 'node:test';
import assert from 'node:assert/strict';
import { RIG_CELLS } from '../app/lounge-rig-data.ts';

// Every static figure lounge-sprites.ts can show while moving (except the
// hand-drawn classic/signature strips) must have a cut-out rig.
const expected = [
  ...Array.from({ length: 6 }, (_, i) => `original:${i}`),
  'hohyeon:0',
  ...['classic', 'street', 'smart'].flatMap((k) =>
    Array.from({ length: 7 }, (_, i) => `${k}:${i}`),
  ),
  ...Array.from({ length: 4 }, (_, i) => `buns:${i}`),
  ...Array.from({ length: 6 }, (_, i) => `outfits:${i}`),
  'shampoo:0',
  'shampoo:1',
  ...Array.from({ length: 8 }, (_, i) => `akatsuki:${i}`),
];
const inBox = ([x, y]) => x >= 0 && x <= 1000 && y >= 0 && y <= 1000;
const bands = (span) =>
  Array.from({ length: span.x.length / 2 }, (_, i) => ({
    top: span.y + i * span.step,
    l: span.x[i * 2],
    r: span.x[i * 2 + 1],
  }));

test('every atlas cell has a rig with two legs or a hem-only split', () => {
  assert.deepEqual(Object.keys(RIG_CELLS).sort(), [...expected].sort());
  for (const [key, cell] of Object.entries(RIG_CELLS)) {
    assert.ok(['legs', 'hem'].includes(cell.mode), key);
    assert.equal(cell.legs.length, 2, key);
    // Skirts, coats and tunics stay with the torso; only lower legs move.
    const costume =
      key.startsWith('akatsuki') ||
      key.startsWith('shampoo') ||
      key === 'outfits:2' ||
      key === 'outfits:5';
    assert.equal(cell.mode === 'hem', costume, key);
    assert.ok(cell.crotch > 550 && cell.crotch < 950, `${key} crotch ${cell.crotch}`);
    assert.ok(cell.waist < cell.crotch, key);
    // Legs reach the soles; hem-mode legs start below the garment.
    if (cell.mode === 'hem') assert.ok(cell.crotch > 650, key);
    else assert.ok(1000 - cell.crotch > 40, key);
  }
});

test('leg pivots sit inside the figure and in anatomical order', () => {
  for (const [key, cell] of Object.entries(RIG_CELLS)) {
    const [left, right] = cell.legs;
    for (const leg of cell.legs) {
      assert.ok(inBox(leg.hip) && inBox(leg.foot), key);
      if (leg.knee) {
        assert.ok(inBox(leg.knee), key);
        assert.ok(leg.hip[1] < leg.knee[1] && leg.knee[1] < leg.foot[1], key);
      }
      assert.ok(leg.hip[1] < cell.crotch + 1, key);
      assert.ok(leg.foot[1] > 960, `${key} foot ${leg.foot[1]}`);
      // The pivot lies above the leg's own band extents.
      const rows = bands(leg.span);
      const minL = Math.min(...rows.map((b) => b.l)),
        maxR = Math.max(...rows.map((b) => b.r));
      assert.ok(leg.hip[0] >= minL && leg.hip[0] <= maxR, key);
      assert.ok(leg.foot[0] >= minL && leg.foot[0] <= maxR, key);
    }
    assert.ok(left.hip[0] < right.hip[0], key);
    assert.ok(left.foot[0] < right.foot[0], key);
  }
});

test('leg masks are separated, inside the box and cover the feet', () => {
  for (const [key, cell] of Object.entries(RIG_CELLS)) {
    const [left, right] = cell.legs.map((leg) => bands(leg.span));
    for (const leg of [left, right])
      for (const b of leg) {
        assert.ok(b.l <= b.r, key);
        assert.ok(b.l >= 0 && b.r <= 1001, key);
      }
    // Below the crotch the two legs never share a column in the same band.
    for (let i = 0; i < Math.min(left.length, right.length); i++)
      if (left[i].top > cell.crotch + 5) assert.ok(left[i].r <= right[i].l + 12, `${key} band ${i}`);
    for (const leg of cell.legs) {
      const end = leg.span.y + leg.span.step * (leg.span.x.length / 2);
      assert.ok(end >= 995, `${key} leg ends at ${end}`);
      // The hidden cap starts at or above the crotch.
      assert.ok(leg.span.y <= cell.crotch, key);
    }
  }
});

test('arms, when found, hang from a shoulder above the armpit', () => {
  let armed = 0;
  for (const [key, cell] of Object.entries(RIG_CELLS)) {
    assert.ok(cell.arms.length <= 2, key);
    for (const arm of cell.arms) {
      armed++;
      assert.ok([0, 1].includes(arm.side), key);
      assert.ok(inBox(arm.shoulder), key);
      assert.ok(arm.shoulder[1] < arm.armpit, key);
      assert.ok(arm.armpit < cell.crotch + 80, key);
      const rows = bands(arm.span);
      const mid = (Math.min(...rows.map((b) => b.l)) + Math.max(...rows.map((b) => b.r))) / 2;
      // Left arms on the left half, right arms on the right half.
      assert.ok(arm.side ? mid > 500 : mid < 500, key);
    }
    assert.equal(new Set(cell.arms.map((a) => a.side)).size, cell.arms.length, key);
  }
  assert.ok(armed > 20, 'most short-haired figures get swinging forearms');
});
