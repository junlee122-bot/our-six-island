// Slices the painted fish icon atlas (Higgsfield, 6×6 on magenta) into one
// 128px WebP per id with the magenta keyed to alpha. The source stays in
// public/assets/lounge/fishing/_originals/ (see generation.json there).
//
//   node scripts/slice-fish-atlas.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = path.join(root, 'public/assets/lounge/fishing');
const src = path.join(dir, '_originals/fish-icons-atlas.png');
export const FISH_ATLAS_IDS = [
  ['crucian', 'carp', 'koi', 'catfish', 'mandarin', 'eel'],
  ['trout', 'sweetfish', 'lenok', 'rainbow', 'snakehead', 'skygazer'],
  ['mackerel', 'seabream', 'flounder', 'yellowtail', 'hairtail', 'squid'],
  ['mullet', 'sandfish', 'filefish', 'octopus', 'blackbream', 'rockfish'],
  ['goldcarp', 'moonhairtail', 'blossomtrout', 'lakelord', 'icecod', 'crab'],
  ['snail', 'shrimp', 'clam', 'oyster', 'conch', 'chest'],
];
const SIZE = 128;

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width,
  H = info.height,
  cw = Math.floor(W / 6),
  ch = Math.floor(H / 6);
// Magenta key: distance from (255,0,255); soft edge; remove magenta spill on the rim.
const out = Buffer.from(data);
for (let i = 0; i < W * H; i++) {
  const r = out[i * 4],
    g = out[i * 4 + 1],
    b = out[i * 4 + 2];
  const magenta = Math.min(r, b) - g; // high on the background and its glow halo
  if (magenta > 150) out[i * 4 + 3] = 0;
  else if (magenta > 70) {
    out[i * 4 + 3] = Math.round(255 * (1 - (magenta - 70) / 80));
    const m = Math.min(r, b);
    out[i * 4] = Math.min(r, g + (r - m) + Math.round((m - g) * 0.35));
    out[i * 4 + 2] = Math.min(b, g + (b - m) + Math.round((m - g) * 0.35));
  }
}
const keyed = sharp(out, { raw: { width: W, height: H, channels: 4 } });
const buf = await keyed.png().toBuffer();
fs.mkdirSync(dir, { recursive: true });
const written = [];
for (let row = 0; row < 6; row++)
  for (let col = 0; col < 6; col++) {
    const id = FISH_ATLAS_IDS[row][col];
    const raw = await sharp(buf).extract({ left: col * cw, top: row * ch, width: cw, height: ch }).png().toBuffer();
    const cell = await sharp(raw).trim({ threshold: 1 }).png().toBuffer();
    const file = path.join(dir, `${id}.webp`);
    await sharp(cell)
      .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 86, alphaQuality: 90 })
      .toFile(file);
    written.push(`${id}.webp ${fs.statSync(file).size}B`);
  }
console.log(written.join('\n'));
