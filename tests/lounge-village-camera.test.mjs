import test from 'node:test';
import assert from 'node:assert/strict';
import { villageCameraFrame } from '../app/lounge-village-camera.ts';
for (const [width, height] of [
  [1440, 900],
  [1920, 1080],
  [390, 844],
  [844, 390],
]) {
  test(`recognizable avatar and complete overview at ${width}x${height}`, () => {
    const { half, followZoom } = villageCameraFrame(width, height, 80, 60);
    const projectedHeight = (1.88 * followZoom * height) / (2 * half);
    assert.ok(projectedHeight >= 65 && projectedHeight <= 77);
    const ground = Math.hypot(34, 52),
      len = Math.hypot(ground, 43);
    for (const x of [-40, 40])
      for (const z of [-30, 30]) {
        assert.ok(
          Math.abs((52 * x - 34 * z) / ground) < (half * width) / height,
        );
        assert.ok(Math.abs(((34 * x + 52 * z) * 43) / (ground * len)) < half);
      }
  });
}
