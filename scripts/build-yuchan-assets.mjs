// Deterministic packaging of the Higgsfield illustration, not new artwork.
// Keep the private reference photograph out of this repository.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const asset = (path) => fileURLToPath(new URL(`../public/assets/lounge/${path}`, import.meta.url));
const input = asset('yuchan-atlas.png');
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
// The source has no purple clothing: remove both the solid key and its
// antialiased spill before resampling, so login and world art share clean edges.
for (let k = 0; k < data.length; k += 4) {
  const r = data[k], g = data[k + 1], b = data[k + 2];
  if (Math.min(r, b) - g > 20 && r > g * 1.1 && b > g * 1.1) data[k + 3] = 0;
}
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .webp({ lossless: true }).toFile(asset('yuchan-atlas.webp'));
const width = Math.floor(info.width / 3), height = Math.floor(info.height / 2);
const cell = Buffer.alloc(width * height * 4);
let x0 = width, y0 = height, x1 = 0, y1 = 0;
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const from = (y * info.width + x) * 4, to = (y * width + x) * 4;
  const r = data[from], g = data[from + 1], b = data[from + 2];
  cell[to] = r; cell[to + 1] = g; cell[to + 2] = b;
  cell[to + 3] = data[from + 3];
  if (cell[to + 3] > 30) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
}
const sprite = await sharp(cell, { raw: { width, height, channels: 4 } })
  .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
  .resize({ height: 500 }).png().toBuffer({ resolveWithObject: true });
await sharp({ create: { width: 440, height: 540, channels: 4, background: '#00000000' } })
  .composite([{ input: sprite.data, left: Math.floor((440 - sprite.info.width) / 2), top: 20 }])
  .webp({ lossless: true }).toFile(asset('login/yuchan.webp'));
console.log('Yuchan: lossless wardrobe atlas and 440×540 transparent login portrait built.');
