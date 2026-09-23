import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

// Source PNG decoding and premultiplied-alpha normalization mirror the runtime
// pose without requiring a native image library or a browser in CI.
export function readSpriteAtlasCells(url, columns = 2, rows = 1) {
  const file = readFileSync(url);
  assert.equal(file.subarray(1, 4).toString(), 'PNG');
  const width = file.readUInt32BE(16),
    height = file.readUInt32BE(20),
    channels = file[25] === 6 ? 4 : 3;
  assert.equal(file[24], 8);
  assert([2, 6].includes(file[25]));
  assert.equal(file[28], 0);
  const chunks = [];
  for (let i = 8; i < file.length;) {
    const length = file.readUInt32BE(i);
    if (file.toString('ascii', i + 4, i + 8) === 'IDAT')
      chunks.push(file.subarray(i + 8, i + 8 + length));
    i += length + 12;
  }
  const scan = inflateSync(Buffer.concat(chunks)),
    stride = width * channels,
    decoded = new Uint8Array(stride * height);
  assert.equal(scan.length, (stride + 1) * height);
  const paeth = (a, b, c) => {
    const p = a + b - c,
      da = Math.abs(p - a),
      db = Math.abs(p - b),
      dc = Math.abs(p - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = scan[y * (stride + 1)];
    assert(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const at = y * stride + x,
        a = x >= channels ? decoded[at - channels] : 0,
        b = y ? decoded[at - stride] : 0,
        c = y && x >= channels ? decoded[at - stride - channels] : 0;
      const prediction = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][
        filter
      ];
      decoded[at] = scan[y * (stride + 1) + 1 + x] + prediction;
    }
  }
  return Array.from({ length: columns * rows }, (_, cell) => {
    const cellWidth = width / columns,
      cellHeight = height / rows,
      source = new Uint8ClampedArray(cellWidth * cellHeight * 4);
    let left = cellWidth,
      top = cellHeight,
      right = 0,
      bottom = 0;
    for (let y = 0; y < cellHeight; y++)
      for (let x = 0; x < cellWidth; x++) {
        const from =
            ((y + Math.floor(cell / columns) * cellHeight) * width +
              (cell % columns) * cellWidth +
              x) *
            channels,
          to = (y * cellWidth + x) * 4;
        const r = decoded[from],
          g = decoded[from + 1],
          b = decoded[from + 2];
        const magenta =
          r > g * 1.45 &&
          b > g * 1.45 &&
          r > b * 0.62 &&
          b > r * 0.72 &&
          Math.min(r, b) > 32;
        const alpha = magenta ? 0 : channels === 4 ? decoded[from + 3] : 255;
        source.set([r, g, b, alpha], to);
        if (alpha > 30) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    const w = right - left + 1,
      h = bottom - top + 1,
      scale = Math.min(356 / w, 450 / h),
      dx = (400 - w * scale) / 2,
      dy = 465 - h * scale;
    const data = new Uint8ClampedArray(400 * 480 * 4);
    for (let y = 0; y < 480; y++)
      for (let x = 0; x < 400; x++) {
        const sx = (x + 0.5 - dx) / scale + left - 0.5,
          sy = (y + 0.5 - dy) / scale + top - 0.5;
        if (sx < left || sx > right || sy < top || sy > bottom) continue;
        const ix = Math.floor(sx),
          iy = Math.floor(sy),
          fx = sx - ix,
          fy = sy - iy;
        const sum = [0, 0, 0, 0];
        for (const [ox, oy, weight] of [
          [0, 0, (1 - fx) * (1 - fy)],
          [1, 0, fx * (1 - fy)],
          [0, 1, (1 - fx) * fy],
          [1, 1, fx * fy],
        ]) {
          const k =
              (Math.min(cellHeight - 1, iy + oy) * cellWidth +
                Math.min(cellWidth - 1, ix + ox)) *
              4,
            alpha = source[k + 3] / 255;
          for (let c = 0; c < 3; c++) sum[c] += source[k + c] * alpha * weight;
          sum[3] += alpha * weight;
        }
        if (sum[3])
          data.set(
            [...sum.slice(0, 3).map((c) => c / sum[3]), sum[3] * 255],
            (y * 400 + x) * 4,
          );
      }
    return data;
  });
}
