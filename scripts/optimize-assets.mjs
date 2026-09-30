// Re-encodes the heavy source art into the web copies that app/lounge-assets.ts
// and app/lounge-model-assets.ts reference. Originals stay in the repository
// (PNG next to the WebP, GLB under public/models/_originals/) so this script can
// always be re-run from the untouched sources.
//
//   node scripts/optimize-assets.mjs            # images + models
//   node scripts/optimize-assets.mjs images     # images only
//   node scripts/optimize-assets.mjs models     # models only
//   node scripts/optimize-assets.mjs models village/valley   # one folder
//
// Character atlases are LOSSLESS WebP (`exact`): lounge-sprites.ts/lounge-color.ts
// key the magenta background and dye the blue hair by exact RGB, so every pixel
// must survive untouched. The script verifies that after encoding.
// GLBs use only extensions three's GLTFLoader decodes natively
// (KHR_mesh_quantization, EXT_texture_webp) — no Draco/Meshopt decoder needed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const assets = path.join(root, 'public/assets');
const mode = process.argv[2] ?? 'all';

const LOSSLESS_ATLASES = [
  'friends-motion.png',
  'accessories.png',
  'hohyeon-friend.png',
  'lounge/dowon-shampoo-atlas.png',
  'lounge/daowon-buns.png',
  'lounge/daowon-outfits.png',
  'lounge/ladies-outfits-atlas.png',
  'lounge/maid-atlas.png',
  'lounge/hachimaki.png',
];
// Framed wall prints (768x1024, matches the 1.14x1.52 wall plane). Sources are
// the framed PNG composites; skipped (keeping the committed WebP) when missing.
const WALL_PRINTS = ['lounge/bedroom/miku-poster.png'];
// Table host sheets (루미 / 매화): already keyed RGBA, never dyed, so lossy is fine.
const HOST_SHEETS = [
  'lounge/host-lumi.png',
  'lounge/host-maehwa.png',
  'lounge/host-captain.png',
  'lounge/host-realtor.png',
  'lounge/host-carpenter.png',
];
// Legacy pack (PNG sources in the repo) + current pack. The current pack's
// 1024px PNG sources are kept out of the repository (not used at runtime), so
// ids without a PNG next to the WebP are skipped and keep their committed WebP.
const REACTIONS = [
  'laugh', 'wow', 'cry', 'love', 'cheer', 'think', 'sorry', 'hello',
  'jeje', 'yoi', 'eum', 'aye', 'nonono',
];

const kb = (n) => `${Math.round(n / 1024)}KB`;

// Baked-texture kArchive props that stay small on screen (fences, deck tiles,
// bed frames, chairs, stools, rope posts): a 512² texture is what the GPU
// samples at their on-screen size anyway (mip level 1), at a quarter of the
// memory. Everything else keeps the 1024² cap. Paths are relative to public/models.
const MODEL_TEXTURE_SIZE = {
  // 낚시 업그레이드: catch-card trophies are 132 px on screen.
  'village/life-services/fishCrucian.glb': 512,
  'village/life-services/fishMandarin.glb': 512,
  'village/life-services/fishHairtail.glb': 512,
  'village/life-services/fishCod.glb': 512,
  'village/civic/picketFence.glb': 512,
  'village/civic/harborFence.glb': 512,
  'village/civic/timberDeck.glb': 512,
  'village/civic/vegetableBed.glb': 512,
  'village/civic/noticeBoard.glb': 512,
  'lounge/club/banquetChair.glb': 512,
  'lounge/club/barStool.glb': 512,
  'lounge/club/queueRope.glb': 512,
  // 야추 · 라이어 게임 table props (lounge/friends): small on screen.
  'lounge/friends/serviceBell.glb': 512,
  'lounge/friends/serviceBellPressed.glb': 512,
  'lounge/friends/lectern.glb': 512,
  'lounge/friends/ballotBox.glb': 512,
  'lounge/friends/deskCalendar.glb': 512,
  'lounge/friends/pencil.glb': 512,
  // VILL-2 valley props (village/valley): props up to about 1 m across.
  'village/valley/waterPump.glb': 512,
  'village/valley/picketGate.glb': 512,
  'village/valley/onggi.glb': 512,
  'village/valley/produceCrate.glb': 512,
  'village/valley/firewood.glb': 512,
  'village/valley/campChair.glb': 512,
  'village/valley/cattail.glb': 512,
  'village/valley/hanjiLantern.glb': 512,
  'village/valley/ropeFence.glb': 512,
  'village/valley/treeStump.glb': 512,
  'village/valley/meadowGrass.glb': 512,
  'village/valley/stonePaver.glb': 512,
  'village/valley/shrub.glb': 512,
  'village/valley/cobbleWall.glb': 512,
  // 허풍 주점 · 부동산 · 가구점 (2026-09-26): small interior props and signs.
  'lounge/tavern/barCounter.glb': 512,
  'lounge/tavern/wallShelf.glb': 512,
  'lounge/tavern/bottle.glb': 512,
  'lounge/tavern/keg.glb': 512,
  'lounge/tavern/saddleStool.glb': 512,
  'lounge/tavern/fireplace.glb': 512,
  'lounge/tavern/glass.glb': 512,
  'lounge/tavern/cupTree.glb': 512,
  'lounge/tavern/bottleCrate.glb': 512,
  'lounge/tavern/cornerCabinet.glb': 512,
  'lounge/tavern/teaSideboard.glb': 512,
  'lounge/tavern/glassRack.glb': 512,
  'lounge/tavern/sodaTap.glb': 512,
  'lounge/tavern/beverageBar.glb': 512,
  'lounge/tavern/boothBench.glb': 512,
  'lounge/tavern/shelterBench.glb': 512,
  'lounge/tavern/soban.glb': 512,
  'lounge/tavern/stringLights.glb': 512,
  'lounge/tavern/starLamp.glb': 512,
  'lounge/tavern/floorLamp.glb': 512,
  'lounge/tavern/coatStand.glb': 512,
  'lounge/tavern/bambooPlanter.glb': 512,
  'lounge/tavern/doorway.glb': 512,
  'lounge/tavern/windowFrame.glb': 512,
  'lounge/tavern/audioConsole.glb': 512,
  'lounge/tavern/ticketRail.glb': 512,
  'lounge/tavern/cauldron.glb': 512,
  'lounge/tavern/stove.glb': 512,
  'lounge/tavern/teaUrn.glb': 512,
  'lounge/tavern/register.glb': 512,
  'lounge/tavern/storageShelf.glb': 512,
  'lounge/tavern/barrelRack.glb': 512,
  'lounge/tavern/chestnutRoaster.glb': 512,
  'village/tavern/menuBoard.glb': 512,
};

async function sameRgba(a, b) {
  const [x, y] = await Promise.all(
    [a, b].map((file) =>
      sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    ),
  );
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) return false;
  // RGB under alpha 0 is invisible (canvas reads it back as 0,0,0,0 anyway), so
  // only alpha has to match there; every visible pixel must match exactly.
  for (let i = 0; i < x.data.length; i += 4) {
    if (x.data[i + 3] !== y.data[i + 3]) return false;
    if (x.data[i + 3] === 0) continue;
    if (
      x.data[i] !== y.data[i] ||
      x.data[i + 1] !== y.data[i + 1] ||
      x.data[i + 2] !== y.data[i + 2]
    )
      return false;
  }
  return true;
}

async function images() {
  for (const name of LOSSLESS_ATLASES) {
    const source = path.join(assets, name);
    const target = source.replace(/\.png$/, '.webp');
    await sharp(source)
      .webp({ lossless: true, exact: true, effort: 6 })
      .toFile(target);
    if (!(await sameRgba(source, target)))
      throw new Error(`Lossless WebP changed pixels: ${name}`);
    console.log(
      `${name} -> .webp lossless ${kb(fs.statSync(source).size)} -> ${kb(fs.statSync(target).size)}`,
    );
  }
  for (const id of REACTIONS) {
    const source = path.join(assets, 'lounge/reactions', `${id}.png`);
    const target = path.join(assets, 'lounge/reactions', `${id}.webp`);
    if (!fs.existsSync(source)) {
      console.log(`reactions/${id}.png missing, keeping committed .webp`);
      continue;
    }
    await sharp(source)
      .resize(256, 256, { kernel: 'lanczos3' })
      .webp({ quality: 88, alphaQuality: 100, effort: 6 })
      .toFile(target);
    console.log(
      `reactions/${id}.png -> 256px .webp ${kb(fs.statSync(source).size)} -> ${kb(fs.statSync(target).size)}`,
    );
  }
  for (const name of HOST_SHEETS) {
    const source = path.join(assets, name);
    const target = source.replace(/\.png$/, '.webp');
    await sharp(source).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(target);
    console.log(`${name} -> .webp ${kb(fs.statSync(source).size)} -> ${kb(fs.statSync(target).size)}`);
  }
  for (const name of WALL_PRINTS) {
    const source = path.join(assets, name);
    const target = source.replace(/\.png$/, '.webp');
    if (!fs.existsSync(source)) {
      console.log(`${name} missing, keeping committed .webp`);
      continue;
    }
    await sharp(source)
      .resize(768, 1024, { kernel: 'lanczos3', fit: 'fill' })
      .webp({ quality: 86, alphaQuality: 100, effort: 6 })
      .toFile(target);
    console.log(`${name} -> 768x1024 .webp ${kb(fs.statSync(source).size)} -> ${kb(fs.statSync(target).size)}`);
  }
  await socialImages();
}

// Open Graph card (1200x630) and install icons, built from existing art.
async function socialImages() {
  const actors = ['dowon', 'gangjae', 'minseo', 'seungjun', 'minjae', 'jaemin', 'hohyeon'];
  const portraitHeight = 470;
  const portraits = await Promise.all(
    actors.map((id) =>
      sharp(path.join(assets, 'lounge/login', `${id}.webp`))
        .resize({ height: portraitHeight })
        .toBuffer({ resolveWithObject: true }),
    ),
  );
  const step = 1200 / actors.length;
  const title = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf6e3"/><stop offset="1" stop-color="#e3ecc8"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect y="560" width="1200" height="70" fill="#5f8a55"/>
</svg>`);
  await sharp(title)
    .composite(
      portraits.map(({ data, info }, i) => ({
        input: data,
        top: 600 - info.height,
        left: Math.round(step * i + step / 2 - info.width / 2),
      })),
    )
    .webp({ quality: 82 })
    .toFile(path.join(root, 'public/og-image.webp'));
  const icon = fs.readFileSync(path.join(root, 'public/favicon.svg'));
  fs.mkdirSync(path.join(root, 'public/icons'), { recursive: true });
  for (const size of [192, 512]) {
    await sharp(icon, { density: 72 * (size / 64) })
      .resize(size, size)
      .png()
      .toFile(path.join(root, `public/icons/icon-${size}.png`));
  }
  await sharp(icon, { density: 72 * (180 / 64) })
    .resize(180, 180)
    .flatten({ background: '#e8edcb' })
    .png()
    .toFile(path.join(root, 'public/icons/apple-touch-icon.png'));
  console.log('public/og-image.webp, public/icons/*.png');
}

async function models() {
  const { NodeIO } = await import('@gltf-transform/core');
  const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
  const { dedup, prune, quantize, textureCompress, resample, weld } = await import(
    '@gltf-transform/functions'
  );
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const modelRoot = path.join(root, 'public/models');
  const originals = path.join(modelRoot, '_originals');
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return full === originals ? [] : walk(full);
      return entry.name.endsWith('.glb') ? [full] : [];
    });
  // Optional third argument: only models under that folder (e.g. village/valley).
  const only = process.argv[3]?.replace(/\/$/, '');
  for (const file of walk(modelRoot)) {
    const relative = path.relative(modelRoot, file);
    if (only && !relative.split(path.sep).join('/').startsWith(only + '/')) continue;
    const original = path.join(originals, relative);
    if (!fs.existsSync(original)) {
      fs.mkdirSync(path.dirname(original), { recursive: true });
      fs.copyFileSync(file, original);
    }
    const document = await io.read(original);
    const size = MODEL_TEXTURE_SIZE[relative.split(path.sep).join('/')] ?? 1024;
    await document.transform(
      dedup(),
      weld(),
      resample(),
      prune(),
      textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 88, resize: [size, size] }),
      quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }),
    );
    await io.write(file, document);
    console.log(
      `${relative}: ${kb(fs.statSync(original).size)} -> ${kb(fs.statSync(file).size)}`,
    );
  }
}

async function serviceSprites() {
  for (const name of ['casino-lender-rose', 'bank-clerk-nyamo', 'salon-stylist-gwen']) {
    const source = path.join(assets, `lounge/_originals/${name}.png`);
    if (!fs.existsSync(source)) continue;
    const target = path.join(assets, `lounge/${name}.webp`);
    await sharp(source).resize(660, 990, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(target);
    console.log(`${name}.png -> 660x990 .webp ${kb(fs.statSync(target).size)}`);
  }
  const portrait = path.join(assets, 'lounge/_originals/bank-clerk-nyamo-portrait.png');
  if (fs.existsSync(portrait)) {
    const target = path.join(assets, 'lounge/bank-clerk-nyamo-portrait.webp');
    await sharp(portrait).resize({ width: 768 }).webp({ quality: 88, effort: 6 }).toFile(target);
    console.log(`bank-clerk-nyamo-portrait.png -> 768px .webp ${kb(fs.statSync(target).size)}`);
  }
}
// Stage-1 village NPCs (npc-stage1-generation.json): 1360×2048 originals on a
// solid magenta ground. The key is done here once (not at runtime) so the web
// copy is a plain RGBA sprite like 로제 / 냐모 / 그웬:
// 1. "magenta-ness" m = min(R, B) − G (255 on the ground, ≤ 0 on skin, navy,
//    green flames, black outlines).
// 2. The ground is every pixel with m > SEED reachable from the border, plus
//    enclosed pockets (between an arm and the body) of near-pure magenta.
//    Purple cloth inside the outline is never reached, so it stays opaque.
// 3. Ground pixels get alpha from m (soft glow and antialiased edges keep
//    their partial cover) and the magenta is unmixed and despilled out of
//    their colour, so 쓰레쉬's green wisps stay green, not pink.
const NPC_SPRITES = ['nasera', 'frieren', 'thresh', 'sinjjajang', 'volibas', 'janna'];
/** Head-and-shoulders square per NPC as fractions of the keyed full body (x centre, top, size). */
const NPC_PORTRAITS = {
  nasera: { cx: 0.5, top: 0.02, size: 0.36 },
  frieren: { cx: 0.5, top: 0.05, size: 0.34 },
  thresh: { cx: 0.5, top: 0.01, size: 0.34 },
  sinjjajang: { cx: 0.5, top: 0.02, size: 0.34 },
  volibas: { cx: 0.5, top: 0.02, size: 0.34 },
  janna: { cx: 0.5, top: 0.02, size: 0.34 },
};
// `fgM`: the magenta-ness of what the ground blends into. 0 suits outlines and
// skin; 쓰레쉬's mint wisps sit near −120, so her glow unmixes to green.
function keyMagenta(data, width, height, fgM = 0) {
  const n = width * height;
  const m = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2];
    m[i] = Math.min(r, b) - g;
  }
  const SEED = 40,
    POCKET = 200;
  const ground = new Uint8Array(n);
  const stack = [];
  const push = (i) => {
    if (!ground[i] && m[i] > SEED) {
      ground[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  // Enclosed pockets: seeds of near-pure magenta anywhere.
  for (let i = 0; i < n; i++) if (m[i] > POCKET) push(i);
  while (stack.length) {
    const i = stack.pop();
    const x = i % width,
      y = (i - x) / width;
    if (x > 0) push(i - 1);
    if (x < width - 1) push(i + 1);
    if (y > 0) push(i - width);
    if (y < height - 1) push(i + width);
  }
  // One-pixel rim around the ground: antialiased outline pixels.
  const rim = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (ground[i]) continue;
    const x = i % width;
    if ((x > 0 && ground[i - 1]) || (x < width - 1 && ground[i + 1]) || ground[i - width] || ground[i + width]) rim[i] = 1;
  }
  const out = Buffer.from(data);
  for (let i = 0; i < n; i++) {
    if (!ground[i] && !rim[i]) continue;
    const k = Math.max(fgM, Math.min(255, m[i]));
    let a = (255 - k) / (255 - fgM);
    // Ease the curve so faint haze fades out instead of leaving a veil.
    a = a < 0.06 ? 0 : Math.min(1, (a - 0.06) / 0.94);
    if (a <= 0) {
      out[i * 4 + 3] = 0;
      continue;
    }
    let r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2];
    // Unmix the magenta ground (255, 0, 255).
    r = (r - (1 - a) * 255) / a;
    g = g / a;
    b = (b - (1 - a) * 255) / a;
    // Despill: no leftover magenta cast (R and B never exceed G by much at once).
    if (Math.min(r, b) - g > 12) {
      r = Math.min(r, g + 12);
      b = Math.min(b, g + 12);
    }
    out[i * 4] = Math.max(0, Math.min(255, Math.round(r)));
    out[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(g)));
    out[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(b)));
    out[i * 4 + 3] = Math.round(Math.min(data[i * 4 + 3], a * 255));
  }
  return out;
}
async function npcSprites() {
  for (const id of NPC_SPRITES) {
    const source = path.join(assets, `lounge/_originals/npc-${id}.png`);
    if (!fs.existsSync(source)) continue;
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const keyed = keyMagenta(data, info.width, info.height, id === 'thresh' ? -120 : 0);
    const raw = { raw: { width: info.width, height: info.height, channels: 4 } };
    const target = path.join(assets, `lounge/npc-${id}.webp`);
    await sharp(keyed, raw)
      .resize(660, 990, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90, alphaQuality: 100, effort: 6 })
      .toFile(target);
    const p = NPC_PORTRAITS[id];
    const size = Math.round(info.height * p.size);
    const left = Math.max(0, Math.min(info.width - size, Math.round(info.width * p.cx - size / 2)));
    const top = Math.round(info.height * p.top);
    const portrait = path.join(assets, `lounge/npc-${id}-portrait.webp`);
    await sharp(keyed, raw)
      .extract({ left, top, width: size, height: size })
      .resize(384, 384, { kernel: 'lanczos3' })
      .webp({ quality: 88, alphaQuality: 100, effort: 6 })
      .toFile(portrait);
    console.log(`npc-${id}.png -> 660x990 .webp ${kb(fs.statSync(target).size)} · portrait ${kb(fs.statSync(portrait).size)}`);
  }
}
// Round dialogue portraits for 로제 / 냐모 / 그웬 (주민 수첩): a head-and-shoulders
// square cut from their keyed full-body web copies, centred on the head
// (the opaque pixels of the top of the figure).
async function servicePortraits() {
  for (const name of ['casino-lender-rose', 'bank-clerk-nyamo', 'salon-stylist-gwen']) {
    const source = path.join(assets, `lounge/${name}.webp`);
    if (!fs.existsSync(source)) continue;
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    let top = height;
    for (let y = 0; y < height && top === height; y++)
      for (let x = 0; x < width; x++)
        if (data[(y * width + x) * 4 + 3] > 64) {
          top = y;
          break;
        }
    const size = Math.round(height * 0.36);
    let sum = 0,
      n = 0;
    for (let y = top; y < Math.min(height, top + Math.round(size * 0.6)); y++)
      for (let x = 0; x < width; x++)
        if (data[(y * width + x) * 4 + 3] > 64) {
          sum += x;
          n++;
        }
    const cx = n ? sum / n : width / 2;
    const left = Math.max(0, Math.min(width - size, Math.round(cx - size / 2)));
    const target = path.join(assets, `lounge/${name}-face.webp`);
    await sharp(source)
      .extract({ left, top: Math.max(0, top - Math.round(size * 0.04)), width: size, height: Math.min(size, height - top) })
      .resize(384, 384, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 88, alphaQuality: 100, effort: 6 })
      .toFile(target);
    console.log(`${name}-face.webp ${kb(fs.statSync(target).size)}`);
  }
}
async function tavernCards() {
  const source = path.join(assets, 'lounge/_originals/tavern-cards.png');
  if (!fs.existsSync(source)) return;
  const { width, height } = await sharp(source).metadata();
  const out = path.join(assets, 'lounge/cards');
  fs.mkdirSync(out, { recursive: true });
  for (const [i, name] of ['king', 'queen', 'ace', 'joker', 'back'].entries()) {
    const col = i % 3, row = Math.floor(i / 3);
    const left = Math.round(width * col / 3), top = Math.round(height * row / 2);
    const target = path.join(out, `tavern-${name}.webp`);
    await sharp(source).extract({ left, top, width: Math.round(width * (col + 1) / 3) - left, height: Math.round(height * (row + 1) / 2) - top })
      .resize(512, 768).webp({ quality: 90, effort: 6 }).toFile(target);
    console.log(`tavern-${name}.webp ${kb(fs.statSync(target).size)}`);
  }
}
if (['all', 'images', 'services', 'lender'].includes(mode)) await serviceSprites();
if (['all', 'images', 'cards'].includes(mode)) await tavernCards();
if (['all', 'images', 'npcs'].includes(mode)) await npcSprites();
if (['all', 'images', 'services', 'npcs'].includes(mode)) await servicePortraits();
if (mode === 'all' || mode === 'images') await images();
if (mode === 'all' || mode === 'models') await models();
