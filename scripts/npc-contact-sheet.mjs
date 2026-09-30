// Contact sheet of the keyed stage-1 NPC sprites and portraits on a dark and a
// light ground, for eyeballing the magenta key (npm run optimize:assets npcs).
//   node scripts/npc-contact-sheet.mjs <out-dir>
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = path.join(root, 'public/assets/lounge');
const out = process.argv[2] ?? '.';
const ids = ['nasera', 'frieren', 'thresh', 'sinjjajang', 'volibas', 'janna'];
for (const bg of ['#2a2320', '#f2ead8']) {
  const comps = [];
  for (const [i, id] of ids.entries()) {
    comps.push({ input: await sharp(path.join(base, `npc-${id}.webp`)).resize(330, 495).toBuffer(), left: i * 330, top: 0 });
    comps.push({ input: await sharp(path.join(base, `npc-${id}-portrait.webp`)).resize(192, 192).toBuffer(), left: i * 330 + 60, top: 500 });
  }
  const file = path.join(out, `npc-sheet-${bg.slice(1)}.png`);
  await sharp({ create: { width: 1980, height: 700, channels: 4, background: bg } }).composite(comps).png().toFile(file);
  console.log(file);
}
