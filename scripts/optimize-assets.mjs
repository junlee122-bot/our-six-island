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
const HOST_SHEETS = ['lounge/host-lumi.png', 'lounge/host-maehwa.png'];
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
  'village/civic/picketFence.glb': 512,
  'village/civic/harborFence.glb': 512,
  'village/civic/timberDeck.glb': 512,
  'village/civic/vegetableBed.glb': 512,
  'village/civic/noticeBoard.glb': 512,
  'lounge/club/banquetChair.glb': 512,
  'lounge/club/barStool.glb': 512,
  'lounge/club/queueRope.glb': 512,
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

if (mode === 'all' || mode === 'images') await images();
if (mode === 'all' || mode === 'models') await models();
