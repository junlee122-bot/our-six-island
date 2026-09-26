// Offline cut-out rig segmentation for the static character atlases.
//
//   node --experimental-strip-types scripts/build-lounge-rig.mjs [--debug <dir>]
//
// Every static figure cell (the same crops lounge-sprites.ts prepares at
// runtime) is keyed out, and its alpha silhouette is split into an upper body
// (head, torso, hair, garment hems), two legs and — when they hang clear of the
// torso — two forearms. The result is written to app/lounge-rig-data.ts as
// polygons in "body box" units: 0..1000 across the figure's opaque bounding
// box, so the runtime can map them onto its own normalized figure canvas
// without per-frame pixel work. `--debug` also writes overlay PNGs.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { removeConnectedBackdrop } from '../app/character-style.ts';

const root = new URL('../', import.meta.url);
const asset = (path) => new URL(`public${path}`, root).pathname;
const debugAt = process.argv.indexOf('--debug');
const debugDir = debugAt > 0 ? process.argv[debugAt + 1] : null;
if (debugDir) mkdirSync(debugDir, { recursive: true });

async function rgba(path) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data), width: info.width, height: info.height };
}
function crop(img, x, y, w, h) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let j = 0; j < h; j++)
    out.set(
      img.data.subarray(((y + j) * img.width + x) * 4, ((y + j) * img.width + x + w) * 4),
      j * w * 4,
    );
  return { data: out, width: w, height: h };
}
/** lounge-sprites.ts `clean(c, true)`: key out every magenta backdrop pixel. */
function keyMagenta(img) {
  const p = img.data;
  for (let k = 0; k < p.length; k += 4) {
    const r = p[k],
      g = p[k + 1],
      b = p[k + 2];
    if (r > g * 1.45 && b > g * 1.45 && r > b * 0.62 && b > r * 0.72 && Math.min(r, b) > 32)
      p[k + 3] = 0;
  }
  return img;
}
function keyBackdrop(img, maxSpread) {
  if (!img.data.some((v, i) => i % 4 === 3 && v === 0))
    removeConnectedBackdrop(img.data, img.width, img.height, maxSpread);
  return img;
}
/** Largest 4-connected opaque component (alpha >= 128). */
function mainMask(img) {
  const { width: w, height: h, data } = img,
    size = w * h,
    labels = new Int32Array(size),
    queue = new Int32Array(size);
  let label = 0,
    best = 0,
    bestLabel = 0;
  for (let s = 0; s < size; s++) {
    if (labels[s] || data[s * 4 + 3] < 128) continue;
    label++;
    let n = 1;
    queue[0] = s;
    labels[s] = label;
    for (let j = 0; j < n; j++) {
      const q = queue[j],
        x = q % w;
      const visit = (k) => {
        if (labels[k] || data[k * 4 + 3] < 128) return;
        labels[k] = label;
        queue[n++] = k;
      };
      if (x > 0) visit(q - 1);
      if (x < w - 1) visit(q + 1);
      if (q >= w) visit(q - w);
      if (q < size - w) visit(q + w);
    }
    if (n > best) {
      best = n;
      bestLabel = label;
    }
  }
  const mask = new Uint8Array(size);
  for (let q = 0; q < size; q++) mask[q] = labels[q] === bestLabel ? 1 : 0;
  return mask;
}
/** Runtime `bounds()`: alpha > 30 over the whole cleaned cell. */
function bbox(img) {
  let x0 = img.width,
    y0 = img.height,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++)
      if (img.data[(y * img.width + x) * 4 + 3] > 30) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
/** Opaque runs of a row, bridging one-pixel antialias cracks. */
function runs(mask, w, y, keep = () => true) {
  const out = [];
  let start = -1,
    miss = 0;
  for (let x = 0; x <= w; x++) {
    const on = x < w && mask[y * w + x] && keep(x, y);
    if (on) {
      if (start < 0) start = x;
      miss = 0;
    } else if (start >= 0 && (++miss > 1 || x === w)) {
      out.push([start, x - miss]);
      start = -1;
      miss = 0;
    }
  }
  return out;
}

function segment(img, name, hint, forcedCrotch) {
  const w = img.width,
    mask = mainMask(img),
    box = bbox(img),
    H = box.h,
    W = box.w,
    bottom = box.y + box.h - 1;
  const hairAt = (x, y) => {
    const k = (y * w + x) * 4,
      r = img.data[k],
      g = img.data[k + 1],
      b = img.data[k + 2];
    return b > Math.max(r, g) * 1.17 && b > 60;
  };
  const skinShare = (x0, x1, y) => {
    let n = 0,
      skin = 0;
    for (let x = x0; x <= x1; x++) {
      if (!mask[y * w + x]) continue;
      n++;
      const k = (y * w + x) * 4,
        r = img.data[k],
        g = img.data[k + 1],
        b = img.data[k + 2];
      if (r > 140 && g > 80 && r - g > 18 && g - b > 10) skin++;
    }
    return n ? skin / n : 0;
  };
  // --- Legs: track both legs from the soles upward until they merge (crotch).
  const soleRow = bottom - Math.round(H * 0.015);
  let lastMain = bottom;
  while (lastMain > box.y && !runs(mask, w, lastMain).length) lastMain--;
  const torsoRow = box.y + Math.round(H * 0.55);
  const torsoRuns = runs(mask, w, torsoRow);
  const torsoRun = torsoRuns.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
  const cx = (torsoRun[0] + torsoRun[1]) / 2;
  const init = runs(mask, w, soleRow).filter(([a, b]) => b - a > W * 0.03);
  let left, right;
  if (init.length >= 2) {
    // Two feet: the pair straddling the torso center.
    let pair = null;
    for (let i = 0; i + 1 < init.length; i++)
      if (!pair || Math.abs((init[i][1] + init[i + 1][0]) / 2 - cx) < Math.abs((pair[0][1] + pair[1][0]) / 2 - cx))
        pair = [init[i], init[i + 1]];
    [left, right] = pair;
  } else {
    const run = init[0] ?? [cx - W * 0.2, cx + W * 0.2];
    left = [run[0], Math.floor(cx)];
    right = [Math.ceil(cx), run[1]];
  }
  const spans = new Map(); // y -> [[l0,l1],[r0,r1]]
  const handZone = bottom - H * 0.12;
  let crotch = soleRow,
    merged = 0,
    mid = (left[1] + right[0]) / 2;
  for (let y = soleRow; y > box.y + H * 0.35; y--) {
    const row = runs(mask, w, y);
    const overlapping = (s) => row.filter(([a, b]) => b >= s[0] - 2 && a <= s[1] + 2);
    const lr = overlapping(left),
      rr = overlapping(right);
    if (!lr.length || !rr.length) break;
    if (forcedCrotch !== undefined && y < forcedCrotch) break;
    let l = [Math.min(...lr.map((r) => r[0])), Math.max(...lr.map((r) => r[1]))],
      r = [Math.min(...rr.map((r) => r[0])), Math.max(...rr.map((r) => r[1]))];
    const same = l[1] >= r[0];
    if (same) {
      merged++;
      l = [l[0], Math.floor(mid)];
      r = [Math.ceil(mid), r[1]];
    } else {
      mid = (l[1] + r[0]) / 2;
      if (merged) merged = 0;
      crotch = y;
    }
    // Hands and sleeves that touch a leg widen its row abruptly (a jump of
    // several pixels in one row); calves, cuffs and shoes widen gradually.
    // Only a skin-coloured jump is a hand; trouser flares and cuffs stay.
    if (y <= handZone) {
      if (left[0] - l[0] > 3 && skinShare(l[0], left[0] - 1, y) > 0.35) l[0] = left[0];
      if (r[1] - right[1] > 3 && skinShare(right[1] + 1, r[1], y) > 0.35) r[1] = right[1];
    }
    if (merged > H * 0.035 && forcedCrotch === undefined) break;
    spans.set(y, [l, r]);
    left = l;
    right = r;
  }
  // Rows under the sole sample: split every opaque pixel at the midline.
  for (let y = soleRow + 1; y <= lastMain; y++) {
    const row = runs(mask, w, y);
    if (!row.length) continue;
    const l = row.filter(([a]) => a < mid),
      r = row.filter(([, b]) => b > mid);
    const [pl, pr] = spans.get(y - 1) ?? [left, right];
    spans.set(y, [
      l.length ? [Math.min(...l.map((s) => s[0]), pl[0]), Math.min(Math.floor(mid), Math.max(...l.map((s) => s[1])))] : pl,
      r.length ? [Math.max(Math.ceil(mid), Math.min(...r.map((s) => s[0]))), Math.max(...r.map((s) => s[1]), pr[1])] : pr,
    ]);
  }
  // Trousers whose legs touch: split at the midline up to the atlas' usual crotch.
  if (forcedCrotch !== undefined) crotch = Math.max(Math.round(forcedCrotch), Math.min(...spans.keys()));
  for (const y of spans.keys()) if (y < crotch) spans.delete(y);
  const [cl, cr] = spans.get(crotch);
  const crotchMid = (cl[1] + cr[0]) / 2;
  // A garment wider than both legs just above the split is a hem (skirt, coat, tunic).
  const above = runs(mask, w, crotch - Math.round(H * 0.02)).filter(
    ([a, b]) => a <= crotchMid && b >= crotchMid,
  )[0];
  const legsWidth = cr[1] - cl[0];
  const measuredHem = above ? above[1] - above[0] > legsWidth * 1.3 : false;
  const hem = hint === 'hem' || (hint !== 'legs' && measuredHem);
  const legLength = bottom - crotch;
  const cap = Math.round(H * (hem ? 0.035 : 0.06));
  const legs = [0, 1].map((side) => {
    const rows = [];
    for (let y = crotch; y <= lastMain; y++) {
      const s = spans.get(y)?.[side];
      if (s) rows.push([y, s[0], s[1]]);
    }
    const top = rows[0];
    const widthAtTop = top[2] - top[1];
    const hipX = (top[1] + top[2]) / 2;
    // Hidden cap under the pelvis/hem keeps the joint covered while rotating.
    const capRows = [];
    for (let y = crotch - cap; y < crotch; y++)
      capRows.push([y, side ? Math.ceil(crotchMid) : top[1], side ? top[2] : Math.floor(crotchMid)]);
    const all = [...capRows, ...rows];
    const footRows = rows.slice(-Math.max(3, Math.round(rows.length * 0.12)));
    const footX = footRows.reduce((a, r) => a + (r[1] + r[2]) / 2, 0) / footRows.length;
    const hipY = hem ? crotch - H * 0.1 : crotch - widthAtTop * 0.3;
    const kneeY = crotch + legLength * 0.5;
    const kneeRow = rows.find((r) => r[0] >= kneeY) ?? top;
    return {
      rows: all,
      hip: [hipX, hipY],
      knee: !hem && legLength > H * 0.16 ? [(kneeRow[1] + kneeRow[2]) / 2, kneeY] : null,
      foot: [footX, lastMain],
    };
  });
  // --- Arms: forearms hanging clear of the torso, never long hair.
  const shoulderLimit = box.y + H * 0.36;
  const arms = [];
  for (const side of [0, 1]) {
    const leg = legs[side];
    const found = [];
    for (let y = Math.round(shoulderLimit); y < crotch + H * 0.08; y++) {
      const row = runs(mask, w, y);
      // Torso run: the one containing the centerline.
      const ti = row.findIndex(([a, b]) => a <= cx && b >= cx);
      if (ti < 0) continue;
      const ai = side ? ti + 1 : ti - 1;
      const arm = row[ai];
      if (!arm) continue;
      const gap = side ? arm[0] - row[ti][1] : row[ti][0] - arm[1];
      const width = arm[1] - arm[0];
      if (gap < 2 || width < W * 0.03 || width > W * 0.2) continue;
      // Legs below the crotch are not arms.
      if (y >= crotch && spans.get(y)?.[side] && arm[0] <= spans.get(y)[side][1] && arm[1] >= spans.get(y)[side][0]) continue;
      let hair = 0;
      for (let x = arm[0]; x <= arm[1]; x++) if (hairAt(x, y)) hair++;
      if (hair > width * 0.25) continue;
      found.push([y, arm[0], arm[1], side ? row[ti][1] : row[ti][0]]);
    }
    // Longest vertical block of separated rows.
    let best = [],
      cur = [];
    for (const r of found) {
      if (cur.length && r[0] !== cur.at(-1)[0] + 1) cur = [];
      cur.push(r);
      if (cur.length > best.length) best = cur;
    }
    if (best.length < H * 0.05) continue;
    // Hands resting on trousers merge with the body run: keep following the
    // part that sticks out past the body edge, or a ghost hand stays behind.
    {
      let [, l, r, torsoEdge] = best.at(-1);
      for (let y = best.at(-1)[0] + 1; y < best.at(-1)[0] + H * 0.08 && y < bottom; y++) {
        const run = runs(mask, w, y).find(([a, b]) => b >= l - 2 && a <= r + 2);
        if (!run) break;
        const leg = spans.get(y)?.[side];
        const edge = leg ? (side ? leg[1] : leg[0]) : torsoEdge;
        const outer = side ? run[1] : run[0];
        if (side ? outer <= edge + 2 : outer >= edge - 2) break;
        const inner = side ? Math.max(l, edge + 1) : Math.min(r, edge - 1);
        best.push([y, side ? inner : outer, side ? outer : inner, edge]);
        [l, r] = side ? [inner, outer] : [outer, inner];
        torsoEdge = edge;
      }
    }
    const armpit = best[0][0];
    // Long hair beside the upper arm rules out a clean shoulder cut.
    const upper = Math.round(armpit - H * 0.09);
    let hairy = 0,
      total = 0;
    const cut = best[0][3] + (side ? 1 : -1);
    const upperRows = [];
    let blocked = false;
    for (let y = upper; y < armpit; y++) {
      const row = runs(mask, w, y);
      const outer = side
        ? row.filter(([, b]) => b > cut).map((s) => s[1])
        : row.filter(([a]) => a < cut).map((s) => s[0]);
      if (!outer.length) continue;
      const edge = side ? Math.max(...outer) : Math.min(...outer);
      const a = side ? cut : edge,
        b = side ? edge : cut;
      if (b - a > W * 0.24) blocked = true;
      for (let x = a; x <= b; x++) {
        if (!mask[y * w + x]) continue;
        total++;
        if (hairAt(x, y)) hairy++;
      }
      upperRows.push([y, a, b]);
    }
    if (blocked || !upperRows.length || hairy > total * 0.12) continue;
    // Taper the cut: the inner edge follows the torso side line upward.
    const armRows = [...upperRows, ...best.map(([y, a, b]) => [y, a, b])];
    const top = upperRows[0];
    const shoulder = [side ? top[1] + (top[2] - top[1]) * 0.35 : top[2] - (top[2] - top[1]) * 0.35, top[0] + H * 0.015];
    arms.push({ side, rows: armRows, shoulder, armpit, hand: best.at(-1)[0] });
    void leg;
  }
  // Waist: the garment hem swings below it (half-way between armpits and crotch).
  const waist = hem ? crotch - H * 0.14 : crotch - H * 0.05;
  return { name, box, mask, hem, forced: forcedCrotch !== undefined, measuredHem, crotch, waist, legs, arms, img, cx };
}

// ---- row bands (source pixels → body-box permille) ---------------------------
const STEP = 10; // permille of the body height per band
function serialize(s) {
  const { box } = s;
  const px = (x) => Math.round(((x - box.x) / box.w) * 1000);
  const py = (y) => Math.round(((y - box.y) / box.h) * 1000);
  const pt = ([x, y]) => [px(x), py(y)];
  // Conservative bands: each band stores the widest extent of its rows.
  const span = (rows) => {
    const top = py(rows[0][0]),
      bottom = py(rows.at(-1)[0] + 1);
    const count = Math.max(1, Math.ceil((bottom - top) / STEP));
    const x = [];
    for (let i = 0; i < count; i++) {
      let l = Infinity,
        r = -Infinity;
      for (const [y, a, b] of rows) {
        const v = py(y);
        if (v >= top + i * STEP - 1 && v <= top + (i + 1) * STEP + 1) {
          l = Math.min(l, px(a));
          r = Math.max(r, px(b + 1));
        }
      }
      if (!Number.isFinite(l)) [l, r] = x.length ? x.slice(-2) : [500, 500];
      x.push(l, r);
    }
    return { y: top, step: (bottom - top) / count, x };
  };
  const round = (n) => Math.round(n * 100) / 100;
  const band = (rows) => {
    const s = span(rows);
    return { ...s, step: round(s.step) };
  };
  return {
    mode: s.hem ? 'hem' : 'legs',
    crotch: py(s.crotch),
    waist: py(s.waist),
    legs: s.legs.map((leg) => ({
      span: band(leg.rows),
      hip: pt(leg.hip),
      knee: leg.knee ? pt(leg.knee) : null,
      foot: pt(leg.foot),
    })),
    arms: s.arms.map((arm) => ({
      side: arm.side,
      span: band(arm.rows),
      shoulder: pt(arm.shoulder),
      armpit: py(arm.armpit),
    })),
  };
}

async function debugOverlay(s) {
  if (!debugDir) return;
  const { img, box } = s;
  const out = new Uint8ClampedArray(img.data);
  const tint = (x, y, rgb) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
    const k = (y * img.width + x) * 4;
    out[k] = (out[k] + rgb[0]) / 2;
    out[k + 1] = (out[k + 1] + rgb[1]) / 2;
    out[k + 2] = (out[k + 2] + rgb[2]) / 2;
    out[k + 3] = Math.max(out[k + 3], 160);
  };
  const colors = [
    [255, 60, 60],
    [60, 200, 60],
  ];
  s.legs.forEach((leg, i) => {
    for (const [y, a, b] of leg.rows) for (let x = a; x <= b; x++) tint(x, y, colors[i]);
  });
  for (const arm of s.arms)
    for (const [y, a, b] of arm.rows) for (let x = a; x <= b; x++) tint(x, y, [255, 200, 0]);
  const dot = ([x, y], rgb) => {
    for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) tint(x + i, y + j, rgb);
  };
  for (const leg of s.legs) {
    dot(leg.hip, [0, 0, 0]);
    if (leg.knee) dot(leg.knee, [0, 0, 255]);
    dot(leg.foot, [0, 0, 0]);
  }
  for (const arm of s.arms) dot(arm.shoulder, [0, 0, 0]);
  for (let x = box.x; x < box.x + box.w; x++) {
    tint(x, s.crotch, [0, 255, 255]);
    tint(x, s.waist, [255, 0, 255]);
  }
  await sharp(Buffer.from(out.buffer), { raw: { width: img.width, height: img.height, channels: 4 } })
    .extract({ left: box.x, top: box.y, width: box.w, height: box.h })
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(`${debugDir}/${s.name.replace(':', '-')}.png`);
}

// ---- the atlases lounge-sprites.ts prepares ---------------------------------
async function sheetCells(path, columns, rows, count) {
  const img = await rgba(asset(path));
  const cw = Math.floor(img.width / columns),
    ch = Math.floor(img.height / rows);
  return Array.from({ length: count }, (_, i) =>
    keyMagenta(crop(img, (i % columns) * cw, Math.floor(i / columns) * ch, cw, ch)),
  );
}
async function originalCells() {
  const rows = [
    [20, 241],
    [264, 256],
    [521, 248],
    [771, 258],
    [1030, 259],
    [1289, 247],
  ];
  const out = [];
  for (const [y, h] of rows) {
    const { data, info } = await sharp(asset('/assets/friends-motion.webp'))
      .extract({ left: 35, top: y, width: 240, height: h })
      .resize(320, 320, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    out.push(keyBackdrop({ data: new Uint8ClampedArray(data), width: info.width, height: info.height }));
  }
  return out;
}
async function hohyeonCell() {
  // lounge-sprites.ts keys this sheet with TIGHT_BACKDROP_SPREAD (keeps the white shoes).
  const img = keyBackdrop(await rgba(asset('/assets/hohyeon-friend.webp')), 10);
  const mask = mainMask(img);
  // keepPieces(1): drop everything but the main figure (and its halo).
  for (let q = 0; q < mask.length; q++) if (!mask[q] && img.data[q * 4 + 3] >= 128) img.data[q * 4 + 3] = 0;
  return img;
}

const atlases = [
  ['original', originalCells, 'legs'],
  ['hohyeon', async () => [await hohyeonCell()], 'legs'],
  ['classic', () => sheetCells('/assets/lounge/club-friends-classic.webp', 4, 2, 7), 'legs'],
  ['street', () => sheetCells('/assets/lounge/club-friends-street.webp', 4, 2, 7), 'legs'],
  ['smart', () => sheetCells('/assets/lounge/club-friends-smart.webp', 4, 2, 7), 'legs'],
  ['buns', () => sheetCells('/assets/lounge/daowon-buns.webp', 2, 2, 4), 'legs'],
  // wide-pants, denim (legs), miku (skirt hem) — top row signature, bottom row buns.
  ['outfits', () => sheetCells('/assets/lounge/daowon-outfits.webp', 3, 2, 6), (i) => (i % 3 === 2 ? 'hem' : 'legs')],
  ['shampoo', () => sheetCells('/assets/lounge/dowon-shampoo-atlas.webp', 2, 1, 2), 'hem'],
  ['akatsuki', () => sheetCells('/assets/lounge/akatsuki-atlas.webp', 4, 2, 8), 'hem'],
  // 금빛 브레이드 (pleated skirt) / 케이프 코트 (tiered skirt): 도원, 민서, 도원 buns per row.
  // A single swinging arm looks broken: 금빛 브레이드 keeps both arms or
  // neither; the 케이프 코트 sleeves stay under the capelet.
  ['ladies', () => sheetCells('/assets/lounge/ladies-outfits-atlas.webp', 3, 2, 6), 'hem', (i) => (i < 3 ? 'pair' : 'none')],
  // 메이드: long dress (girls) or knee coat (boys) under the apron.
  // The black coat panels beside the apron read as forearms, so the maid
  // cells keep their arms on the torso (like 아카츠키's sleeves).
  ['maid', () => sheetCells('/assets/lounge/maid-atlas.webp', 4, 2, 8), 'hem', 'none'],
];

const cells = {};
const report = [];
for (const [atlas, load, hint, armRule] of atlases) {
  const key = String(atlas);
  const list = await load();
  const hintOf = (i) => (typeof hint === 'function' ? hint(i) : hint);
  const first = list.map((img, i) => segment(img, `${key}:${i}`, hintOf(i)));
  const fraction = (s) => (s.crotch - s.box.y) / s.box.h;
  const good = first.filter((s) => fraction(s) < 0.88).map(fraction).sort((a, b) => a - b);
  const median = good[Math.floor(good.length / 2)] ?? 0.75;
  for (let i = 0; i < list.length; i++) {
    const name = `${key}:${i}`;
    let s = first[i];
    const arms = typeof armRule === 'function' ? armRule(i) : armRule;
    if (arms === 'none' || (arms === 'pair' && s.arms.length !== 2)) s = { ...s, arms: [] };
    if (!s.hem && fraction(s) > Math.max(0.88, median + 0.08))
      s = segment(list[i], name, hintOf(i), s.box.y + s.box.h * median);
    cells[name] = serialize(s);
    await debugOverlay(s);
    report.push(
      `${name.padEnd(12)} ${s.hem ? 'hem ' : 'legs'}${s.measuredHem ? '*' : ' '}${s.forced ? 'F' : ' '} crotch=${cells[name].crotch} arms=${s.arms.length} legRows=${s.legs.map((l) => l.rows.length).join('/')}`,
    );
  }
}
const header = `// Generated by scripts/build-lounge-rig.mjs — do not edit by hand.
// Cut-out rig polygons per static figure cell, in body-box permille
// (0..1000 across the figure's opaque bounding box).
import type { RigCell } from './lounge-rig';
`;
const body = `export const RIG_CELLS: Record<string, RigCell> = ${JSON.stringify(cells)};\n`;
writeFileSync(new URL('app/lounge-rig-data.ts', root), header + body);
console.log(report.join('\n'));
console.log(`wrote app/lounge-rig-data.ts (${(header + body).length} bytes, ${Object.keys(cells).length} cells)`);
