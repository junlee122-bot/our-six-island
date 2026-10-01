// Slices a painted fish icon atlas (Higgsfield, 6×6 on magenta) into one
// 128px WebP per id with the magenta keyed to alpha. The sources stay in
// public/assets/lounge/fishing/_originals/ (see generation*.json there).
//
//   node scripts/slice-fish-atlas.mjs            (the first atlas)
//   node scripts/slice-fish-atlas.mjs --atlas 2  (2026-10-02 어종 확장)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = path.join(root, 'public/assets/lounge/fishing');
export const FISH_ATLAS_IDS = [
  ['crucian', 'carp', 'koi', 'catfish', 'mandarin', 'eel'],
  ['trout', 'sweetfish', 'lenok', 'rainbow', 'snakehead', 'skygazer'],
  ['mackerel', 'seabream', 'flounder', 'yellowtail', 'hairtail', 'squid'],
  ['mullet', 'sandfish', 'filefish', 'octopus', 'blackbream', 'rockfish'],
  ['goldcarp', 'moonhairtail', 'blossomtrout', 'lakelord', 'icecod', 'crab'],
  ['snail', 'shrimp', 'clam', 'oyster', 'conch', 'chest'],
];
export const FISH_ATLAS_2_IDS = [
  ['hwangeo', 'galgyeoni', 'chambungeo', 'moraemuji', 'dongsari', 'hyangeo'],
  ['halfbeak', 'sardine', 'anchovy', 'scorpionfish', 'jjukkumi', 'cod'],
  ['atka', 'flatfish', 'sillago', 'saury', 'bitterling', 'tunggari'],
  ['sculpin', 'paradise', 'swampeel', 'salmon', 'spanish', 'opaleye'],
  ['cuttlefish', 'monkfish', 'skate', 'stickleback', 'sturgeon', 'goldmandarin'],
  ['beakperch', 'tuna', 'sunfish', 'eldercat', 'prismayu', 'startuna'],
];
const second = process.argv.includes('--atlas') && process.argv[process.argv.indexOf('--atlas') + 1] === '2';
const src = path.join(dir, second ? '_originals/fish-icons-atlas-2.png' : '_originals/fish-icons-atlas.png');
const ids = second ? FISH_ATLAS_2_IDS : FISH_ATLAS_IDS;
const SIZE = 128;

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width,
  H = info.height,
  cw = Math.floor(W / 6),
  ch = Math.floor(H / 6);
// Magenta key: distance from (255,0,255); soft edge; remove magenta spill on the rim.
const out = Buffer.from(data);
const score = (i) => Math.min(out[i * 4], out[i * 4 + 2]) - out[i * 4 + 1];
// The fish bodies: everything the magenta (and the glow mixed into it) cannot
// reach from the image border. A pink body inside its ink outline stays solid.
const solid = new Uint8Array(W * H).fill(1);
{
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    if (!solid[i] || score(i) <= 40) continue;
    solid[i] = 0;
    const x = i % W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (i >= W) stack.push(i - W);
    if (i < W * H - W) stack.push(i + W);
  }
}
// The second atlas: a glow rim within EDGE px of the background is unmixed from
// magenta (true colour = (pixel − (1 − a)·magenta) / a), so the legends' gold
// glow stays gold instead of pink; pink fish bodies further in are untouched.
const EDGE = 14;
let near = null;
if (second) {
  near = new Uint8Array(W * H);
  let front = [];
  for (let i = 0; i < W * H; i++) if (score(i) > 150) { near[i] = 1; front.push(i); }
  for (let d = 0; d < EDGE; d++) {
    const next = [];
    for (const i of front) {
      const x = i % W, y = (i - x) / W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1])
        if (j >= 0 && !near[j]) { near[j] = 1; next.push(j); }
    }
    front = next;
  }
}
for (let i = 0; i < W * H; i++) {
  const r = out[i * 4],
    g = out[i * 4 + 1],
    b = out[i * 4 + 2];
  const magenta = Math.min(r, b) - g; // high on the background and its glow halo
  if (magenta > 150) out[i * 4 + 3] = 0;
  else if (near?.[i] && magenta > 20) {
    const a = Math.max(0.03, 1 - (magenta - 20) / 95);
    out[i * 4] = Math.max(0, Math.min(255, Math.round((r - (1 - a) * 255) / a)));
    out[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(g / a)));
    out[i * 4 + 2] = Math.max(0, Math.min(255, Math.round((b - (1 - a) * 255) / a)));
    out[i * 4 + 3] = Math.round(255 * a);
  } else if (magenta > 70) {
    out[i * 4 + 3] = Math.round(255 * (1 - (magenta - 70) / 80));
    const m = Math.min(r, b);
    out[i * 4] = Math.min(r, g + (r - m) + Math.round((m - g) * 0.35));
    out[i * 4 + 2] = Math.min(b, g + (b - m) + Math.round((m - g) * 0.35));
  }
}
fs.mkdirSync(dir, { recursive: true });
const written = [];
const save = async (id, png) => {
  const file = path.join(dir, `${id}.webp`);
  await sharp(png)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 86, alphaQuality: 90 })
    .toFile(file);
  written.push(`${id}.webp ${fs.statSync(file).size}B`);
};
if (!second) {
  const buf = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 6; col++) {
      const raw = await sharp(buf).extract({ left: col * cw, top: row * ch, width: cw, height: ch }).png().toBuffer();
      await save(ids[row][col], await sharp(raw).trim({ threshold: 1 }).png().toBuffer());
    }
} else {
  // Big icons (sunfish fins, the skate's tail) cross their cell: cut by blobs,
  // each blob going to the cell its centre of mass sits in.
  // Blobs are the solid bodies only, so two touching glow rims never join two fish.
  const label = new Int32Array(W * H).fill(-1);
  const cellOf = [];
  for (let start = 0; start < W * H; start++) {
    if (label[start] >= 0 || !solid[start]) continue;
    const id = cellOf.length, stack = [start], members = [];
    label[start] = id;
    let sx = 0, sy = 0;
    while (stack.length) {
      const i = stack.pop(), x = i % W, y = (i - x) / W;
      members.push(i); sx += x; sy += y;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1])
        if (j >= 0 && label[j] < 0 && solid[j]) { label[j] = id; stack.push(j); }
    }
    const cx = Math.min(5, Math.floor(sx / members.length / cw)), cy = Math.min(5, Math.floor(sy / members.length / ch));
    cellOf.push(members.length >= 40 ? cy * 6 + cx : -1);
  }
  // Keep only a 2 px rim around the bodies: the painted glow of the legends had
  // already mixed with the magenta (pink); the game draws its own rarity glow.
  let rim = solid.slice();
  for (let d = 0; d < 2; d++) {
    const next = rim.slice();
    for (let i = 0; i < W * H; i++) {
      if (rim[i]) continue;
      const x = i % W;
      if ((x > 0 && rim[i - 1]) || (x < W - 1 && rim[i + 1]) || (i >= W && rim[i - W]) || (i < W * H - W && rim[i + W])) next[i] = 1;
    }
    rim = next;
  }
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 6; col++) {
      const cell = row * 6 + col;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let i = 0; i < W * H; i++) {
        if (label[i] < 0 || cellOf[label[i]] !== cell) continue;
        const x = i % W, y = (i - x) / W;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (x1 < 0) throw new Error(`no icon found in cell ${row},${col} (${ids[row][col]})`);
      // The anti-aliased rim around the blob comes along within its box.
      x0 = Math.max(0, x0 - 3); y0 = Math.max(0, y0 - 3); x1 = Math.min(W - 1, x1 + 3); y1 = Math.min(H - 1, y1 + 3);
      const w = x1 - x0 + 1, h = y1 - y0 + 1, px = Buffer.alloc(w * h * 4);
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const i = y * W + x, l = label[i];
          if ((l >= 0 && cellOf[l] !== cell) || !rim[i]) continue;
          out.copy(px, ((y - y0) * w + (x - x0)) * 4, i * 4, i * 4 + 4);
        }
      await save(ids[row][col], await sharp(px, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer());
    }
}
console.log(written.join('\n'));
