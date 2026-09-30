// 구역 공통 규격 (lounge-village-camera.ts): the market's straight-on camera
// for every outdoor map, the hub included.
import test from 'node:test';
import assert from 'node:assert/strict';
import { VIEW_DIR, VIEW_HALF, VIEW_PITCH, VILLAGE_FIGURE_HEIGHT, followEase, viewHalf, villageCameraFrame } from '../app/lounge-village-camera.ts';

test('the camera never turns sideways and looks down at the market pitch', () => {
  assert.equal(VIEW_DIR.x, 0);
  assert.ok(Math.abs(Math.hypot(VIEW_DIR.x, VIEW_DIR.y, VIEW_DIR.z) - 1) < 1e-9);
  assert.ok(Math.abs((VIEW_PITCH * 180) / Math.PI - 52) < 1e-9);
  assert.ok(followEase(1 / 60) > 0.1 && followEase(1 / 60) < 0.12, 'eases, never snaps');
});
for (const [width, height] of [
  [1440, 900],
  [1920, 1080],
  [1280, 720],
]) {
  test(`follow view and complete overview at ${width}x${height}`, () => {
    const { half, followZoom } = villageCameraFrame(width, height, 112, 88);
    const aspect = width / height;
    // Following: VIEW_HALF world units above the centre (more on tall screens).
    assert.ok(Math.abs(half / followZoom - viewHalf(aspect)) < 1e-9 || followZoom === 1);
    const figurePx = (VILLAGE_FIGURE_HEIGHT * height) / (2 * viewHalf(aspect));
    assert.ok(figurePx >= 50 && figurePx <= 110, `figure ${figurePx.toFixed(0)}px`);
    // Overview (zoom 1): every corner of the island is on screen.
    for (const x of [-56, 56])
      for (const z of [-44, 44]) {
        assert.ok(Math.abs(x) < half * aspect);
        assert.ok(Math.abs(z * Math.sin(VIEW_PITCH)) < half);
      }
  });
}
test('view half is the market value on wide screens', () => {
  assert.equal(viewHalf(16 / 9), VIEW_HALF);
  assert.equal(viewHalf(1), VIEW_HALF * 1.25);
});
