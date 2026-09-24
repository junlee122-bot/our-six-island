import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const layouts = JSON.parse(
  readFileSync(new URL('../app/lounge-motion-layout.json', import.meta.url)),
);
const actors = [
  'dowon',
  'gangjae',
  'minseo',
  'seungjun',
  'minjae',
  'jaemin',
  'hohyeon',
];

function webpSize(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  for (let at = 12; at + 8 < bytes.length;) {
    const kind = bytes.toString('ascii', at, at + 4),
      size = bytes.readUInt32LE(at + 4),
      data = at + 8;
    if (kind === 'VP8X')
      return [
        1 + bytes.readUIntLE(data + 4, 3),
        1 + bytes.readUIntLE(data + 7, 3),
      ];
    if (kind === 'VP8L') {
      assert.equal(bytes[data], 0x2f);
      const bits = bytes.readUInt32LE(data + 1);
      return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    }
    at = data + size + (size % 2);
  }
  throw new Error('Motion atlases must retain lossless alpha');
}

test('all seven motion atlases match their canonical frame rectangles', () => {
  assert.equal(layouts.length, actors.length);
  actors.forEach((actor, index) => {
    const layout = layouts[index];
    const bytes = readFileSync(
      new URL(`../public/assets/lounge/motion/${actor}.webp`, import.meta.url),
    );
    assert.deepEqual(
      webpSize(bytes),
      [layout.sheetWidth, layout.sheetHeight],
      actor,
    );
    const occupied = new Set();
    for (const motion of ['walk', 'run']) {
      const frames = layout.rows[motion];
      assert.equal(frames.length, 6, `${actor} ${motion}`);
      for (const rect of frames) {
        assert.ok([rect.x, rect.y, rect.w, rect.h].every(Number.isInteger));
        assert.ok(rect.x >= 0 && rect.y >= 0 && rect.w > 0 && rect.h > 0);
        assert.ok(
          rect.x + rect.w <= layout.sheetWidth &&
            rect.y + rect.h <= layout.sheetHeight,
        );
        assert.equal(rect.w, layout.cellWidth);
        assert.equal(rect.h, layout.cellHeight);
        const key = `${rect.x}:${rect.y}`;
        assert.ok(!occupied.has(key), 'each exported pose has its own cell');
        occupied.add(key);
      }
    }
  });
});
