// Re-encodes the heavy source art into the web copies that app/lounge-assets.ts
// and app/lounge-model-assets.ts reference. Originals stay in the repository
// (PNG next to the WebP, GLB under public/models/_originals/) so this script can
// always be re-run from the untouched sources.
//
//   node scripts/optimize-assets.mjs            # images + models
//   node scripts/optimize-assets.mjs images     # images only
//   node scripts/optimize-assets.mjs models     # models only
//   node scripts/optimize-assets.mjs models village/valley   # one folder
//   node scripts/optimize-assets.mjs hosts      # table host sheets only (rebuilds 발키리's from her 3×2 original)
//   node scripts/optimize-assets.mjs chibi      # in-world resident chibis only
//   node scripts/optimize-assets.mjs npcs shinhyungman bongmison   # only these residents' files
//   node scripts/optimize-assets.mjs npcs muzan / chibi muzan / hosts   # 범마을 증권 무잔 (also writes broker-muzan-generation.json)
//   node scripts/optimize-assets.mjs furniture  # 나무결 가구점 furniture art from the six magenta sheets
//
// Character atlases are LOSSLESS WebP (`exact`): lounge-sprites.ts/lounge-color.ts
// key the magenta background and dye the blue hair by exact RGB, so every pixel
// must survive untouched. The script verifies that after encoding.
// GLBs use only extensions three's GLTFLoader decodes natively
// (KHR_mesh_quantization, EXT_texture_webp) — no Draco/Meshopt decoder needed.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const assets = path.join(root, 'public/assets');
const mode = process.argv[2] ?? 'all';
/** Optional names after `npcs` / `chibi`: only those residents' files are rebuilt. */
const onlyNames = ['npcs', 'chibi', 'hosts'].includes(mode) ? process.argv.slice(3) : [];
const wanted = (...names) => !onlyNames.length || names.some((n) => onlyNames.includes(n));
/** `hosts broker` rebuilds only lounge/host-broker.*; plain `hosts` rebuilds every sheet. */
const wantedHost = (file) => !onlyNames.length || onlyNames.some((n) => file === `lounge/host-${n}.png`);

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
  'lounge/host-misun.png',
  'lounge/host-broker.png',
];
// 허 선장 · 문 사장 · 결 목수 were keyed before the encoder unmixed the rim: a
// pink line still rings their hair, hands and props on any ground. Pixels
// within 6 px of transparency that carry a magenta cast are unmixed from the
// (255, 0, 255) ground the way keyMagenta does it and lose that share of their
// alpha (character QA 2026-10-01). Interior colours are never touched.
function defringeMagenta(data, width, height, reach = 6) {
  const n = width * height;
  let near = new Uint8Array(n);
  for (let i = 0; i < n; i++) near[i] = data[i * 4 + 3] < 16 ? 1 : 0;
  for (let step = 0; step < reach; step++) {
    const next = Uint8Array.from(near);
    for (let i = 0; i < n; i++) {
      if (near[i]) continue;
      const x = i % width;
      if ((x > 0 && near[i - 1]) || (x < width - 1 && near[i + 1]) || near[i - width] || near[i + width]) next[i] = 1;
    }
    near = next;
  }
  const out = Buffer.from(data);
  for (let i = 0; i < n; i++) {
    const alpha = data[i * 4 + 3];
    if (!near[i] || alpha < 16) continue;
    let r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2];
    const m = Math.min(r, b) - g;
    if (m <= 12) continue;
    let a = (255 - Math.min(255, m)) / 255;
    a = a < 0.06 ? 0 : Math.min(1, (a - 0.06) / 0.94);
    if (a <= 0) {
      out[i * 4 + 3] = 0;
      continue;
    }
    r = (r - (1 - a) * 255) / a;
    g = g / a;
    b = (b - (1 - a) * 255) / a;
    if (Math.min(r, b) - g > 12) {
      r = Math.min(r, g + 12);
      b = Math.min(b, g + 12);
    }
    out[i * 4] = Math.max(0, Math.min(255, Math.round(r)));
    out[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(g)));
    out[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(b)));
    out[i * 4 + 3] = Math.round(Math.min(alpha, a * 255));
  }
  return out;
}
const DEFRINGE_HOSTS = new Set(['lounge/host-captain.png', 'lounge/host-realtor.png', 'lounge/host-misun.png']);
// 범마을 부동산 신형만 · 봉미선 (shopkeepers-generation.json): one 3×2 magenta
// original, 신형만 on the top row and 봉미선 on the bottom (calm, smile, focus).
// Each row becomes its own keyed host sheet in the usual 3×2 layout (calm,
// smile, deal, focus, wow, sorry): deal and wow reuse the smile, sorry the
// calm. One scale per row (the tallest figure 600 px), soles on the 648 px
// line, centred in the 440 × 660 cell.
const NOHARA_SHEET = { source: 'lounge/_originals/host-realtor-nohara.png', rows: ['lounge/host-realtor.png', 'lounge/host-misun.png'] };
async function noharaHostSheets() {
  const source = path.join(assets, NOHARA_SHEET.source);
  if (!fs.existsSync(source)) return;
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const keyed = keyChibi(data, width, height);
  const CELL_W = 440,
    CELL_H = 660,
    FOOT = 648,
    FIGURE = 600;
  for (const [row, target] of NOHARA_SHEET.rows.entries()) {
    const y0 = Math.round((height * row) / 2),
      y1 = Math.round((height * (row + 1)) / 2);
    const figures = [];
    for (let col = 0; col < 3; col++) {
      const x0 = Math.round((width * col) / 3),
        x1 = Math.round((width * (col + 1)) / 3);
      const cell = Buffer.alloc((x1 - x0) * (y1 - y0) * 4);
      for (let y = y0; y < y1; y++) keyed.copy(cell, (y - y0) * (x1 - x0) * 4, (y * width + x0) * 4, (y * width + x1) * 4);
      const box = opaqueBox(cell, x1 - x0, y1 - y0, 0, x1 - x0);
      if (!box) throw new Error(`${NOHARA_SHEET.source}: empty cell ${row}/${col}`);
      figures.push({ cell, w: x1 - x0, h: y1 - y0, box });
    }
    const scale = FIGURE / Math.max(...figures.map((f) => f.box.height));
    const parts = [];
    for (const f of figures) {
      const fw = Math.round(f.box.width * scale),
        fh = Math.round(f.box.height * scale);
      if (fw > CELL_W - 8) throw new Error(`${target}: a figure is ${fw} px wide, wider than its cell`);
      parts.push({
        fw,
        fh,
        png: await sharp(f.cell, { raw: { width: f.w, height: f.h, channels: 4 } }).extract(f.box).resize(fw, fh, { kernel: 'lanczos3' }).png().toBuffer(),
      });
    }
    // Sheet order: calm, smile, deal (smile), focus, wow (smile), sorry (calm).
    const order = [0, 1, 1, 2, 1, 0];
    await sharp({ create: { width: CELL_W * 3, height: CELL_H * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(
        order.map((k, i) => ({
          input: parts[k].png,
          left: (i % 3) * CELL_W + Math.round((CELL_W - parts[k].fw) / 2),
          top: Math.floor(i / 3) * CELL_H + FOOT - parts[k].fh,
        })),
      )
      .png()
      .toFile(path.join(assets, target));
    console.log(`${NOHARA_SHEET.source} row ${row} -> ${target}`);
  }
}
// 가구점 목수 발키리 (carpenter-valkyrie-generation.json): a 1024² 3×2 sheet on
// solid magenta. Keyed like the tall sprites, each grid cell's figure (its
// opaque components, props included) is scaled by one factor that makes the
// calm figure HOST_CELL.figure tall, centred in a 440 × 660 cell with the
// soles on the 648 px line, and written as the keyed host-carpenter.png that
// hostSheets() encodes.
// 범마을 증권 무잔 (broker-muzan-generation.json) is laid out the same way.
const HOST_FROM_GRID = { 'lounge/host-carpenter.png': 'lounge/_originals/host-valkyrie.png', 'lounge/host-broker.png': 'lounge/_originals/host-muzan.png' };
async function hostSheetsFromGrid() {
  const CELL = { w: 440, h: 660, foot: 648, figure: 600 };
  for (const [name, original] of Object.entries(HOST_FROM_GRID)) {
    if (!wantedHost(name)) continue;
    const source = path.join(assets, original);
    if (!fs.existsSync(source)) continue;
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    // Lower pocket seed: the ground between the chair's rungs is enclosed and
    // a little blended (m ≈ 90–200), so it would stay pink at 200.
    const keyed = keyMagenta(data, width, height, 0, 40, 80);
    const raw = { raw: { width, height, channels: 4 } };
    const boxes = [];
    for (let c = 0; c < 6; c++) {
      const x0 = Math.round(((c % 3) * width) / 3),
        x1 = Math.round((((c % 3) + 1) * width) / 3);
      const y0 = Math.round((Math.floor(c / 3) * height) / 2),
        y1 = Math.round(((Math.floor(c / 3) + 1) * height) / 2);
      // The cell as its own image so the component search stays inside it.
      const cell = await sharp(keyed, raw).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).raw().toBuffer();
      const b = opaqueBox(cell, x1 - x0, y1 - y0, 0, x1 - x0);
      if (!b) throw new Error(`${original} cell ${c} is empty`);
      boxes.push({ ...b, left: b.left + x0, top: b.top + y0 });
    }
    const scale = CELL.figure / boxes[0].height;
    const layers = [];
    for (const [c, b] of boxes.entries()) {
      // One scale for all six, unless a wide prop would leave the cell.
      const s = Math.min(scale, (CELL.w - 16) / b.width, (CELL.foot - 8) / b.height);
      const fw = Math.round(b.width * s),
        fh = Math.round(b.height * s);
      const input = await sharp(keyed, raw).extract(b).resize(fw, fh, { kernel: 'lanczos3' }).png().toBuffer();
      layers.push({ input, left: (c % 3) * CELL.w + Math.round((CELL.w - fw) / 2), top: Math.floor(c / 3) * CELL.h + CELL.foot - fh });
    }
    await sharp({ create: { width: CELL.w * 3, height: CELL.h * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(layers)
      .png()
      .toFile(path.join(assets, name));
    console.log(`${original} -> ${name} (3×2 host sheet)`);
  }
}
async function hostSheets() {
  await hostSheetsFromGrid();
  if (!onlyNames.length) await noharaHostSheets();
  for (const name of HOST_SHEETS) {
    if (!wantedHost(name)) continue;
    const source = path.join(assets, name);
    const target = source.replace(/\.png$/, '.webp');
    let input = sharp(source);
    if (DEFRINGE_HOSTS.has(name)) {
      const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      input = sharp(defringeMagenta(data, info.width, info.height), { raw: { width: info.width, height: info.height, channels: 4 } });
    }
    await input.webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(target);
    console.log(`${name} -> .webp ${kb(fs.statSync(source).size)} -> ${kb(fs.statSync(target).size)}`);
  }
}

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
  // 가게 실내 (빵집 카페 · 농협 · 잡화점 · 어시장, 2026-10-02): furniture up to about 2 m.
  'village/shop-interiors/breadStand.glb': 512,
  'village/shop-interiors/espresso.glb': 512,
  'village/shop-interiors/cakeCase.glb': 512,
  'village/shop-interiors/pastryCase.glb': 512,
  'village/shop-interiors/flourCart.glb': 512,
  'village/shop-interiors/scale.glb': 512,
  'village/shop-interiors/fruitCrate.glb': 512,
  'village/shop-interiors/seedCabinet.glb': 512,
  'village/shop-interiors/goodsGondola.glb': 512,
  'village/shop-interiors/basketStand.glb': 512,
  'village/shop-interiors/toolTrunk.glb': 512,
  'village/shop-interiors/iceBin.glb': 512,
  'village/shop-interiors/fishFreezer.glb': 512,
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
  await hostSheets();
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
// Stage-2 residents (npc-stage2-generation.json). The web file name is the
// resident id; 야니네코's original is spelled "yaninekko".
const NPC_SPRITES_2 = ['gabung', 'lux', 'himmel', 'beatrice', 'bocchi', 'tsunade', 'makima', 'yanineko'];
// 범마을 부동산 신형만 · 봉미선 (shopkeepers-generation.json); files are named after the person.
const NPC_SPRITES_REALTY = ['shinhyungman', 'bongmison'];
// 나무결 가구점 목수 발키리 (carpenter-valkyrie-generation.json): the web file
// is named after her, the resident id stays 'carpenter' (hearts carry over).
const NPC_SPRITES_3 = ['valkyrie'];
// 범마을 증권 무잔 (broker-muzan-generation.json): the resident id is 'muzan' too.
const NPC_SPRITES_BROKER = ['muzan'];
const NPC_ORIGINAL = { yanineko: 'yaninekko' };
const NPC_SEED = { beatrice: 150, bocchi: 150 };
/** Head-and-shoulders square per NPC as fractions of the keyed full body (x centre, top, size). */
const NPC_PORTRAITS = {
  nasera: { cx: 0.5, top: 0.02, size: 0.36 },
  frieren: { cx: 0.5, top: 0.05, size: 0.34 },
  thresh: { cx: 0.5, top: 0.01, size: 0.34 },
  sinjjajang: { cx: 0.5, top: 0.02, size: 0.34 },
  volibas: { cx: 0.5, top: 0.02, size: 0.34 },
  janna: { cx: 0.5, top: 0.02, size: 0.34 },
  gabung: { cx: 0.5, top: 0.02, size: 0.34 },
  lux: { cx: 0.5, top: 0.02, size: 0.34 },
  himmel: { cx: 0.5, top: 0.02, size: 0.34 },
  beatrice: { cx: 0.5, top: 0.03, size: 0.34 },
  bocchi: { cx: 0.5, top: 0.03, size: 0.34 },
  tsunade: { cx: 0.5, top: 0.03, size: 0.34 },
  makima: { cx: 0.5, top: 0.03, size: 0.32 },
  yanineko: { cx: 0.5, top: 0.02, size: 0.32 },
  shinhyungman: { cx: 0.5, top: 0.005, size: 0.32 },
  bongmison: { cx: 0.48, top: 0.01, size: 0.32 },
  valkyrie: { cx: 0.48, top: 0.025, size: 0.3 },
  muzan: { cx: 0.5, top: 0.02, size: 0.3 },
};
// `fgM`: the magenta-ness of what the ground blends into. 0 suits outlines and
// skin; 쓰레쉬's mint wisps sit near −120, so her glow unmixes to green.
// `pocket`: how magenta an enclosed pixel must be to seed its own ground.
// `seed`: how magenta a pixel must be to count as ground. 베아트리스's crimson
// dress and 봇치's pink jacket sit near 60–110, so they use a higher seed and
// only the near-pure ground floods (their edges are unmixed as the rim).
function keyMagenta(data, width, height, fgM = 0, seed = 40, pocket = 200) {
  const n = width * height;
  const m = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2];
    m[i] = Math.min(r, b) - g;
  }
  const SEED = seed,
    POCKET = pocket;
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
  for (const id of [...NPC_SPRITES, ...NPC_SPRITES_2, ...NPC_SPRITES_REALTY, ...NPC_SPRITES_3, ...NPC_SPRITES_BROKER]) {
    if (!wanted(id)) continue;
    const source = path.join(assets, `lounge/_originals/npc-${NPC_ORIGINAL[id] ?? id}.png`);
    if (!fs.existsSync(source)) continue;
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const keyed = keyMagenta(data, info.width, info.height, id === 'thresh' ? -120 : 0, NPC_SEED[id] ?? 40);
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
// In-world chibi residents (npc-chibi-generation.json): two figures per 3:2
// original (left name first) on a solid key colour — magenta, or green for
// 베아트리스·봇치 who wear pink. Each is keyed like the tall sprites (flood from
// the border, unmix, despill), split at the emptiest column near the middle,
// trimmed to its opaque box and placed on a 640px-tall canvas the way
// lounge-figure-frame.ts places a friend: the figure fills 94% of the height,
// feet on the 97% line, centred. So a chibi drawn at a friend's plane height
// stands exactly as tall as the friend. 쓰레쉬's green wisps stay (they are
// kept like the tall sprite's), 야니네코's cigarette is part of the figure.
const CHIBI_FILES = [
  ['frieren', 'nasera'],
  ['rose', 'gwen'],
  ['nyamo', 'thresh'],
  ['sinjjajang', 'volibas'],
  ['janna', 'gabung'],
  ['lux', 'himmel'],
  ['beatrice', 'bocchi'],
  ['tsunade', 'makima'],
  ['yaninekko'],
  ['shinhyungman', 'bongmison'],
  ['valkyrie'],
  ['lumi'],
  ['maehwa'],
  ['muzan'],
];
/** Chibi files named after the person; the record keys them by resident id. */
const CHIBI_NPC_ID = { yaninekko: 'yanineko', shinhyungman: 'realtor', bongmison: 'misun', valkyrie: 'carpenter' };
const CHIBI_GREEN = new Set(['beatrice-bocchi']);
const CHIBI_H = 640;
/** Magenta-ness (or green-ness) of a pixel: 255 on the key, ≤ 0 on the figure. */
function keyness(data, n, green) {
  const m = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2];
    m[i] = green ? g - Math.max(r, b) : Math.min(r, b) - g;
  }
  return m;
}
function keyChibi(data, width, height, { green = false, fgM = 0, seed = 40 } = {}) {
  const n = width * height;
  const m = keyness(data, n, green);
  const ground = new Uint8Array(n);
  const stack = [];
  const push = (i) => {
    if (!ground[i] && m[i] > seed) {
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
  for (let i = 0; i < n; i++) if (m[i] > 200) push(i);
  while (stack.length) {
    const i = stack.pop();
    const x = i % width,
      y = (i - x) / width;
    if (x > 0) push(i - 1);
    if (x < width - 1) push(i + 1);
    if (y > 0) push(i - width);
    if (y < height - 1) push(i + width);
  }
  const rim = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (ground[i]) continue;
    const x = i % width;
    if ((x > 0 && ground[i - 1]) || (x < width - 1 && ground[i + 1]) || ground[i - width] || ground[i + width]) rim[i] = 1;
  }
  // The generated ground is never quite pure (magenta ≈ 246,8,249): measure its
  // keyness on the border so the ground itself keys to alpha 0, not a faint veil.
  const border = [];
  for (let x = 0; x < width; x += 4) border.push(m[x], m[(height - 1) * width + x]);
  for (let y = 0; y < height; y += 4) border.push(m[y * width], m[y * width + width - 1]);
  border.sort((p, q) => p - q);
  const ref = Math.max(seed + 40, border[Math.floor(border.length / 2)] - 6);
  const out = Buffer.from(data);
  for (let i = 0; i < n; i++) {
    if (!ground[i] && !rim[i]) continue;
    const k = Math.max(fgM, Math.min(ref, m[i]));
    let a = (ref - k) / (ref - fgM);
    a = a < 0.06 ? 0 : Math.min(1, (a - 0.06) / 0.94);
    if (a <= 0) {
      out[i * 4 + 3] = 0;
      continue;
    }
    let r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2];
    if (green) {
      g = (g - (1 - a) * 255) / a;
      r = r / a;
      b = b / a;
      if (g - Math.max(r, b) > 12) g = Math.max(r, b) + 12;
    } else {
      r = (r - (1 - a) * 255) / a;
      g = g / a;
      b = (b - (1 - a) * 255) / a;
      if (Math.min(r, b) - g > 12) {
        r = Math.min(r, g + 12);
        b = Math.min(b, g + 12);
      }
    }
    out[i * 4] = Math.max(0, Math.min(255, Math.round(r)));
    out[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(g)));
    out[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(b)));
    out[i * 4 + 3] = Math.round(Math.min(data[i * 4 + 3], a * 255));
  }
  return out;
}
/**
 * Opaque box of columns [x0, x1) of a keyed RGBA buffer (alpha > 24), over the
 * connected pieces of at least `minArea` pixels: every generated original
 * carries a few stray opaque pixels in its bottom-left corner, which once
 * stretched the box to the canvas corner and left the figure floating above
 * the feet line and off centre (character QA 2026-10-01).
 */
function opaqueBox(data, width, height, x0, x1, minArea = 400) {
  const seen = new Uint8Array(width * height);
  const solid = (i) => data[i * 4 + 3] > 24;
  let l = x1,
    r = x0 - 1,
    t = height,
    b = -1;
  for (let y0 = 0; y0 < height; y0++)
    for (let xs = x0; xs < x1; xs++) {
      const start = y0 * width + xs;
      if (seen[start] || !solid(start)) continue;
      seen[start] = 1;
      const stack = [start];
      let area = 0,
        cl = xs,
        cr = xs,
        ct = y0,
        cb = y0;
      while (stack.length) {
        const i = stack.pop();
        const x = i % width,
          y = (i - x) / width;
        area++;
        if (x < cl) cl = x;
        if (x > cr) cr = x;
        if (y < ct) ct = y;
        if (y > cb) cb = y;
        for (const j of [x > x0 ? i - 1 : -1, x < x1 - 1 ? i + 1 : -1, y > 0 ? i - width : -1, y < height - 1 ? i + width : -1])
          if (j >= 0 && !seen[j] && solid(j)) {
            seen[j] = 1;
            stack.push(j);
          }
      }
      if (area < minArea) continue;
      l = Math.min(l, cl);
      r = Math.max(r, cr);
      t = Math.min(t, ct);
      b = Math.max(b, cb);
    }
  return r < l ? null : { left: l, top: t, width: r - l + 1, height: b - t + 1 };
}
async function chibiSprites() {
  const outDir = path.join(assets, 'lounge/chibi');
  fs.mkdirSync(outDir, { recursive: true });
  const sizes = {};
  for (const names of CHIBI_FILES) {
    if (!wanted(...names)) continue;
    const base = names.join('-');
    const source = path.join(assets, `lounge/_originals/chibi/npc-chibi-${base}.png`);
    if (!fs.existsSync(source)) continue;
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    const keyed = keyChibi(data, width, height, { green: CHIBI_GREEN.has(base), fgM: names.includes('thresh') ? -120 : 0, seed: CHIBI_GREEN.has(base) ? 60 : 40 });
    // Split two figures at the emptiest column between 40% and 60% of the width.
    let cut = width;
    if (names.length === 2) {
      let best = Infinity;
      for (let x = Math.floor(width * 0.4); x < Math.ceil(width * 0.6); x++) {
        let filled = 0;
        for (let y = 0; y < height; y++) if (keyed[(y * width + x) * 4 + 3] > 24) filled++;
        if (filled < best || (filled === best && Math.abs(x - width / 2) < Math.abs(cut - width / 2))) {
          best = filled;
          cut = x;
        }
      }
    }
    const spans = names.length === 2 ? [[0, cut], [cut, width]] : [[0, width]];
    for (const [i, name] of names.entries()) {
      const file = name === 'yaninekko' ? 'yanineko' : name;
      // The record is keyed by resident id (발키리 is the 'carpenter', 신형만 the 'realtor').
      const id = CHIBI_NPC_ID[name] ?? file;
      const box = opaqueBox(keyed, width, height, spans[i][0], spans[i][1]);
      if (!box) continue;
      const scale = (CHIBI_H * 0.94) / box.height;
      const fw = Math.round(box.width * scale),
        fh = Math.round(box.height * scale);
      const W = Math.max(512, Math.ceil(fw / 0.92 / 2) * 2);
      const figure = await sharp(keyed, { raw: { width, height, channels: 4 } })
        .extract(box)
        .resize(fw, fh, { kernel: 'lanczos3' })
        .png()
        .toBuffer();
      const top = Math.round(CHIBI_H * 0.97) - fh;
      const target = path.join(outDir, `npc-${file}.webp`);
      await sharp({ create: { width: W, height: CHIBI_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: figure, left: Math.round((W - fw) / 2), top }])
        .webp({ quality: 90, alphaQuality: 100, effort: 6 })
        .toFile(target);
      const sha256 = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex').toUpperCase();
      sizes[id] = { file: `chibi/npc-${file}.webp`, w: W, h: CHIBI_H, sha256 };
      console.log(`chibi ${base} -> ${file} ${W}x${CHIBI_H} ${kb(fs.statSync(target).size)}`);
    }
  }
  // Record the web copies (size for lounge-npc-chibi.ts, hash) beside the originals' record.
  const record = path.join(assets, 'lounge/npc-chibi-generation.json');
  if (fs.existsSync(record)) {
    const json = JSON.parse(fs.readFileSync(record, 'utf8'));
    json.web = { ...json.web, ...sizes };
    json.keying = 'scripts/optimize-assets.mjs chibi: flood key from the border against the measured ground colour, unmix + despill on the rim, split at the emptiest column near the middle, figure at 94% of a 640px canvas with the feet on the 97% line.';
    fs.writeFileSync(record, JSON.stringify(json, null, 1) + '\n');
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
// 나무결 가구점 furniture art (furniture-art-generation.json): six square sheets
// on solid magenta, 3×3 or 2×2 cells read left to right, top to bottom, one
// 'furn-*' piece per cell ("NEW:slug (…)" / "NEW-LUXURY:slug (…)" cells are the
// pieces added with the sheets, ref 'furn-' + slug). Each sheet is keyed like
// the tall sprites (keyMagenta, then defringeMagenta for the rim), each cell is
// trimmed to its opaque pieces and placed on a transparent canvas whose aspect
// is the room catalog's: h / w for standing cards and wall pieces (the art
// contained, standing on the bottom edge, centred), d / w for rugs (stretched to
// the floor footprint: the room lays rugs flat, so a top view). The room draws a
// card w wide and w × aspect tall, so the catalog height is the drawn height.
// A 256² thumbnail goes to furniture/thumbs/. The web copies' sizes and hashes
// are written back into the record.
const FURNITURE_LONG_SIDE = 768;
const furnitureRef = (cell) => {
  const m = /^NEW(?:-LUXURY)?:([a-z0-9-]+)/.exec(cell);
  return m ? `furn-${m[1]}` : cell;
};
/**
 * Keeps a furniture cell's own painting: the connected opaque pieces (alpha >
 * 24) of at least 1% of the largest one, minus pieces touching the cell edge
 * (a neighbour's spill), and the faint rim within 2 px of them. Everything else
 * is cleared. Returns the kept pieces' box (null when the cell is empty).
 */
function furnitureCell(data, width, height) {
  const n = width * height,
    label = new Int32Array(n).fill(-1),
    pieces = [];
  for (let start = 0; start < n; start++) {
    if (label[start] >= 0 || data[start * 4 + 3] <= 24) continue;
    const id = pieces.length,
      stack = [start],
      p = { area: 0, l: width, r: -1, t: height, b: -1, edge: false };
    label[start] = id;
    while (stack.length) {
      const i = stack.pop(),
        x = i % width,
        y = (i - x) / width;
      p.area++;
      p.l = Math.min(p.l, x);
      p.r = Math.max(p.r, x);
      p.t = Math.min(p.t, y);
      p.b = Math.max(p.b, y);
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) p.edge = true;
      for (const j of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y > 0 ? i - width : -1, y < height - 1 ? i + width : -1])
        if (j >= 0 && label[j] < 0 && data[j * 4 + 3] > 24) {
          label[j] = id;
          stack.push(j);
        }
    }
    pieces.push(p);
  }
  if (!pieces.length) return null;
  const largest = Math.max(...pieces.map((p) => p.area));
  const keep = pieces.map((p) => p.area === largest || (p.area >= Math.max(40, largest * 0.01) && !p.edge));
  let mask = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (label[i] >= 0 && keep[label[i]]) mask[i] = 1;
  for (let step = 0; step < 2; step++) {
    const next = Uint8Array.from(mask);
    for (let i = 0; i < n; i++) {
      if (mask[i]) continue;
      const x = i % width;
      if ((x > 0 && mask[i - 1]) || (x < width - 1 && mask[i + 1]) || mask[i - width] || mask[i + width]) next[i] = 1;
    }
    mask = next;
  }
  for (let i = 0; i < n; i++) if (!mask[i]) data[i * 4 + 3] = 0;
  const kept = pieces.filter((_, i) => keep[i]);
  const l = Math.max(0, Math.min(...kept.map((p) => p.l)) - 2),
    t = Math.max(0, Math.min(...kept.map((p) => p.t)) - 2),
    r = Math.min(width - 1, Math.max(...kept.map((p) => p.r)) + 2),
    b = Math.min(height - 1, Math.max(...kept.map((p) => p.b)) + 2);
  return { left: l, top: t, width: r - l + 1, height: b - t + 1 };
}
async function furnitureArt() {
  const { catalogEntry } = await import('../app/lounge-bedroom-catalog.ts');
  const recordPath = path.join(assets, 'lounge/furniture-art-generation.json');
  const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
  const outDir = path.join(assets, 'lounge/furniture');
  fs.mkdirSync(path.join(outDir, 'thumbs'), { recursive: true });
  const web = {};
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  for (const sheet of record.sheets) {
    const source = path.join(assets, 'lounge', sheet.original);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex').toUpperCase();
    if (hash !== sheet.sha256) throw new Error(`${sheet.original}: sha256 ${hash} is not the recorded ${sheet.sha256}`);
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    // Pocket seed 90: the ground seen through the fan's grille, the rug's fringe
    // and the chairs' spindles is enclosed and a little blended (m ≈ 100–230).
    const keyed = defringeMagenta(keyMagenta(data, width, height, 0, 40, 90), width, height);
    const raw = { raw: { width, height, channels: 4 } };
    const [cols, rows] = sheet.grid.split('x').map(Number);
    if (sheet.cells.length !== cols * rows) throw new Error(`${sheet.original}: ${sheet.cells.length} cells for a ${sheet.grid} grid`);
    for (const [c, cell] of sheet.cells.entries()) {
      const ref = furnitureRef(cell);
      const entry = catalogEntry(ref);
      if (!entry) throw new Error(`${sheet.original} cell ${c}: ${ref} is not in the room catalog`);
      const x0 = Math.round(((c % cols) * width) / cols),
        x1 = Math.round((((c % cols) + 1) * width) / cols),
        y0 = Math.round((Math.floor(c / cols) * height) / rows),
        y1 = Math.round(((Math.floor(c / cols) + 1) * height) / rows);
      const cellBuf = await sharp(keyed, raw).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).raw().toBuffer();
      const box = furnitureCell(cellBuf, x1 - x0, y1 - y0);
      if (!box) throw new Error(`${sheet.original} cell ${c} (${ref}) is empty`);
      const art = await sharp(cellBuf, { raw: { width: x1 - x0, height: y1 - y0, channels: 4 } }).extract(box).png().toBuffer();
      const rug = entry.mount === 'rug';
      const aspect = rug ? entry.d / entry.w : entry.h / entry.w;
      // The smallest canvas of the catalog aspect that holds the art (rugs: the art's width).
      let cw = rug ? box.width : Math.max(box.width, box.height / aspect),
        ch = cw * aspect;
      const scale = Math.min(1, FURNITURE_LONG_SIDE / Math.max(cw, ch));
      cw = Math.round(cw * scale);
      ch = Math.round(ch * scale);
      let canvas;
      if (rug) canvas = sharp(art).resize(cw, ch, { fit: 'fill', kernel: 'lanczos3' });
      else {
        const fw = Math.min(cw, Math.round(box.width * scale)),
          fh = Math.min(ch, Math.round(box.height * scale));
        const fitted = await sharp(art).resize(fw, fh, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
        // Standing pieces stand on the bottom edge; wall pieces hang centred.
        const top = entry.mount === 'wall' ? Math.round((ch - fh) / 2) : ch - fh;
        canvas = sharp({ create: { width: cw, height: ch, channels: 4, background: clear } }).composite([{ input: fitted, left: Math.round((cw - fw) / 2), top }]);
      }
      const name = ref.replace(/^furn-/, '');
      const target = path.join(outDir, `${name}.webp`);
      await canvas.webp({ quality: 86, alphaQuality: 100, effort: 6 }).toFile(target);
      const thumb = path.join(outDir, 'thumbs', `${name}.webp`);
      await sharp(art)
        .resize(232, 232, { fit: 'contain', background: clear, kernel: 'lanczos3' })
        .extend({ top: 12, bottom: 12, left: 12, right: 12, background: clear })
        .webp({ quality: 86, alphaQuality: 100, effort: 6 })
        .toFile(thumb);
      const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').toUpperCase();
      web[ref] = { file: `furniture/${name}.webp`, w: cw, h: ch, thumb: `furniture/thumbs/${name}.webp`, sha256: sha(target), thumbSha256: sha(thumb) };
      console.log(`${ref} ${entry.mount} ${cw}x${ch} (art ${box.width}x${box.height}, aspect ${(box.height / box.width).toFixed(2)} vs catalog ${aspect.toFixed(2)}) ${kb(fs.statSync(target).size)}`);
    }
  }
  record.web = web;
  record.keying = 'scripts/optimize-assets.mjs furniture: keyMagenta flood from the border + defringeMagenta rim, each cell trimmed to its opaque pieces and contained in a canvas of the catalog aspect (h / w, standing on the bottom edge; wall pieces centred; rugs stretched to d / w as a top view), long side at most 768 px, plus a 256² thumbnail.';
  fs.writeFileSync(recordPath, JSON.stringify(record, null, 1) + '\n');
}
// 범마을 증권 무잔: the web copies' sizes and SHA-256 go into his generation record
// (like the 발키리 record), next to the originals' jobs and hashes.
const ART_RECORDS = [
  {
    record: 'lounge/broker-muzan-generation.json',
    files: ['npc-muzan.webp', 'npc-muzan-portrait.webp', 'chibi/npc-muzan.webp', 'host-broker.png', 'host-broker.webp'],
    keying:
      'scripts/optimize-assets.mjs: npcs keys the tall art (flood from the border, unmix + despill) into a 660x990 sprite and a 384px head-and-shoulders portrait; chibi places the single figure at 94% of a 512x640 canvas with the feet on the 97% line; hosts lays the 3x2 original out as a host sheet (440x660 cells, soles on 648 px, calm figure 600 px, enclosed pockets keyed) in host-broker.png, then encodes host-broker.webp.',
  },
];
async function artRecords() {
  for (const r of ART_RECORDS) {
    const recordPath = path.join(assets, r.record);
    if (!fs.existsSync(recordPath)) continue;
    const json = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    for (const a of json.assets ?? []) {
      const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(assets, 'lounge', a.original))).digest('hex').toUpperCase();
      if (hash !== a.sha256) throw new Error(`${a.original}: sha256 ${hash} is not the recorded ${a.sha256}`);
    }
    const web = {};
    for (const f of r.files) {
      const file = path.join(assets, 'lounge', f);
      if (!fs.existsSync(file)) continue;
      const { width, height } = await sharp(file).metadata();
      web[f] = { w: width, h: height, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase() };
    }
    json.web = web;
    json.keying = r.keying;
    fs.writeFileSync(recordPath, JSON.stringify(json, null, 1) + '\n');
    console.log(`${r.record}: ${Object.keys(web).length} web copies recorded`);
  }
}
if (['all', 'images', 'services', 'lender'].includes(mode)) await serviceSprites();
if (['all', 'images', 'cards'].includes(mode)) await tavernCards();
if (['all', 'images', 'npcs'].includes(mode)) await npcSprites();
if (['all', 'images', 'npcs', 'chibi'].includes(mode)) await chibiSprites();
if (['all', 'images', 'services', 'npcs'].includes(mode)) await servicePortraits();
if (mode === 'hosts') await hostSheets();
if (mode === 'furniture') await furnitureArt();
if (mode === 'all' || mode === 'images') await images();
if (mode === 'all' || mode === 'models') await models();
if (['all', 'images', 'npcs', 'chibi', 'hosts'].includes(mode)) await artRecords();
