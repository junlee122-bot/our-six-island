import { LOUNGE_ASSETS } from './lounge-assets';
import { gaitFrame, rigPoseIndex, RIG_POSES } from './lounge-gait';
import {
  buildRigParts,
  drawRigPose,
  rigFrameMargins,
  solveGait,
  type RigParts,
} from './lounge-rig';
import { RIG_CELLS } from './lounge-rig-data';
import { motionSheetFor, type MotionSheet } from './lounge-rig-frames';
import {
  dyePixel,
  removeConnectedBackdrop,
  motionFrame,
  motionTransform,
  type Motion,
} from './character-style';
import {
  HAIR_COLORS,
  TOP_COLORS,
  HATS,
  GLASSES,
  readLook,
  type Look,
} from './lounge-look';
import {
  colorRgb,
  createHairMask,
  createSkinMask,
  dyeSkinPixel,
  type SkinMask,
} from './lounge-color';
type Piece = {
  c: HTMLCanvasElement;
  x: number;
  y: number;
  w: number;
  h: number;
};
type Figure = {
  c: HTMLCanvasElement;
  eyes: number;
  cx: number;
  head: number;
  top: number;
  skin?: SkinMask;
  hair?: Uint8Array;
  blueHairOnly?: boolean;
  /** Row (figure px) below which only strongly blue pixels count as hair (see createHairMask). */
  hairCollar?: number;
  /** Key into RIG_CELLS for static full-body art that the cut-out rig can pose. */
  rig?: string;
  /** Opaque bounds of `c` (measured once, for mapping rig permille). */
  body?: Piece;
  skinRegions: {
    raisedHands: boolean;
    movingHands?: boolean;
    faceBottom?: number;
    bareLegs: boolean;
    bareShoulders: boolean;
    collared: boolean;
    shortSleeveTunic?: boolean;
    bareToes?: boolean;
    darkHighCollar?: boolean;
  };
};
const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  // Almost every sprite canvas is read back with getImageData (cleaning,
  // bounds, dyeing); the attribute only counts on the first getContext call.
  c.getContext('2d', { willReadFrequently: true });
  return c;
};

/** Canvases that are only drawn from (rig parts and posed frames): no readback hint. */
const drawCanvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  return c;
};
const placeholder = { width: 0, height: 0 } as HTMLCanvasElement;
type RigFrame = Piece & { originX: number; originY: number; resolution: number };

/** A cache bounded by approximate canvas bytes (w × h × 4), least recent evicted first. */
class ByteLru<V extends { c: HTMLCanvasElement }> {
  private map = new Map<string, V>();
  private bytes = 0;
  constructor(
    private readonly limit: number,
    private readonly measure: (value: V) => number = (value) =>
      value.c.width * value.c.height * 4,
  ) {}
  get(key: string) {
    const value = this.map.get(key);
    if (value) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }
  set(key: string, value: V) {
    const old = this.map.get(key);
    if (old) {
      this.bytes -= this.measure(old);
      this.map.delete(key);
    }
    this.map.set(key, value);
    this.bytes += this.measure(value);
    while (this.bytes > this.limit && this.map.size > 1) {
      const [oldestKey, oldest] = this.map.entries().next().value!;
      this.map.delete(oldestKey);
      this.bytes -= this.measure(oldest);
      // Release the backing store promptly (iOS counts total canvas memory).
      oldest.c.width = oldest.c.height = 0;
    }
  }
}
const image = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('캐릭터 그림을 불러오지 못했어요.'));
    im.src = url;
  });
/** Backdrop grey tolerance for art with warm off-white shoes (Hohyeon's original). */
export const TIGHT_BACKDROP_SPREAD = 10;
function clean(c: HTMLCanvasElement, magenta = false, backdropSpread?: number) {
  const ctx = c.getContext('2d', { willReadFrequently: true })!,
    p = ctx.getImageData(0, 0, c.width, c.height);
  if (magenta) {
    for (let k = 0; k < p.data.length; k += 4) {
      const r = p.data[k],
        g = p.data[k + 1],
        b = p.data[k + 2];
      if (
        r > g * 1.45 &&
        b > g * 1.45 &&
        r > b * 0.62 &&
        b > r * 0.72 &&
        Math.min(r, b) > 32
      )
        p.data[k + 3] = 0;
    }
  } else if (!p.data.some((v, i) => i % 4 === 3 && v === 0))
    removeConnectedBackdrop(p.data, c.width, c.height, backdropSpread);
  ctx.putImageData(p, 0, 0);
  return c;
}
function keepPieces(c: HTMLCanvasElement, count: number) {
  const ctx = c.getContext('2d')!,
    p = ctx.getImageData(0, 0, c.width, c.height),
    size = c.width * c.height,
    labels = new Int32Array(size),
    queue = new Int32Array(size),
    areas: { id: number; area: number }[] = [];
  let label = 0;
  for (let start = 0; start < size; start++) {
    if (labels[start] || p.data[start * 4 + 3] < 128) continue;
    label++;
    let n = 1;
    queue[0] = start;
    labels[start] = label;
    for (let j = 0; j < n; j++) {
      const q = queue[j],
        x = q % c.width;
      const visit = (k: number) => {
        if (k < 0 || k >= size || labels[k] || p.data[k * 4 + 3] < 128) return;
        labels[k] = label;
        queue[n++] = k;
      };
      if (x > 0) visit(q - 1);
      if (x < c.width - 1) visit(q + 1);
      visit(q - c.width);
      visit(q + c.width);
    }
    areas.push({ id: label, area: n });
  }
  const kept = new Set(
    areas
      .sort((a, b) => b.area - a.area)
      .slice(0, count)
      .map((a) => a.id),
  );
  for (let q = 0; q < size; q++) {
    const x = q % c.width;
    if (
      kept.has(labels[q]) ||
      (p.data[q * 4 + 3] < 128 &&
        ((x > 0 && kept.has(labels[q - 1])) ||
          (x < c.width - 1 && kept.has(labels[q + 1])) ||
          kept.has(labels[q - c.width]) ||
          kept.has(labels[q + c.width])))
    )
      continue;
    p.data[q * 4 + 3] = 0;
  }
  ctx.putImageData(p, 0, 0);
  return c;
}
function bounds(c: HTMLCanvasElement): Piece {
  const p = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  let x = c.width,
    y = c.height,
    right = 0,
    bottom = 0;
  for (let i = 0; i < p.length; i += 4)
    if (p[i + 3] > 30) {
      x = Math.min(x, (i / 4) % c.width);
      y = Math.min(y, Math.floor(i / 4 / c.width));
      right = Math.max(right, (i / 4) % c.width);
      bottom = Math.max(bottom, Math.floor(i / 4 / c.width));
    }
  return { c, x, y, w: right - x + 1, h: bottom - y + 1 };
}
function figure(
  c: HTMLCanvasElement,
  eyes?: number,
  raisedHands = false,
  bareLegs = false,
  bareShoulders = false,
  collared = false,
  movingPose = false,
): Figure {
  const p = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  let left = c.width,
    right = 0,
    top = c.height;
  for (let y = 0; y < c.height * 0.47; y++)
    for (let x = 0; x < c.width; x++) {
      const k = (y * c.width + x) * 4;
      if (p[k + 3] > 20 && p[k + 2] > Math.max(p[k], p[k + 1]) * 1.17) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
      }
    }
  let head = Math.max(40, right - left),
    cx = (left + right) / 2;
  let detectedFaceBottom: number | undefined;
  if (movingPose) {
    // Wind-blown hair is asymmetric. Anchor glasses to the exposed face rather
    // than the entire hair silhouette, which can trail far to one side.
    let faceLeft = c.width,
      faceRight = 0,
      samples = 0;
    const faceRows: { y: number; width: number; samples: number }[] = [];
    for (
      let y = Math.max(0, Math.floor(top + head * 0.25));
      y < Math.min(c.height, top + head * 0.75);
      y++
    ) {
      let rowLeft = c.width,
        rowRight = 0,
        rowSamples = 0;
      for (
        let x = Math.max(0, Math.floor(cx - head * 0.6));
        x < Math.min(c.width, cx + head * 0.6);
        x++
      ) {
        const k = (y * c.width + x) * 4;
        const r = p[k],
          g = p[k + 1],
          b = p[k + 2];
        if (p[k + 3] > 100 && r > 140 && g > 80 && r - g > 18 && g - b > 10) {
          faceLeft = Math.min(faceLeft, x);
          faceRight = Math.max(faceRight, x);
          samples++;
          rowLeft = Math.min(rowLeft, x);
          rowRight = Math.max(rowRight, x);
          rowSamples++;
        }
      }
      faceRows.push({ y, width: rowRight - rowLeft, samples: rowSamples });
    }
    if (samples > 100 && faceRight - faceLeft > head * 0.3) {
      cx = (faceLeft + faceRight) / 2;
      head = (faceRight - faceLeft) / 0.82;
      const faceWidth = faceRight - faceLeft;
      detectedFaceBottom = faceRows
        .filter(
          (row) =>
            row.width > faceWidth * 0.28 && row.samples > faceWidth * 0.14,
        )
        .at(-1)?.y;
    }
  }
  if (eyes === undefined) {
    let best = 0;
    eyes = c.height * 0.3;
    // All normalized collection faces put their eyes above the lower third.
    // Looking farther down mistakes black hoodies and jacket collars for eyes.
    const eyeStart = movingPose
      ? Math.max(top + head * 0.32, (detectedFaceBottom ?? 0) - head * 0.38)
      : c.height * 0.19;
    const eyeEnd = movingPose
      ? Math.min(
          c.height * 0.6,
          detectedFaceBottom !== undefined
            ? detectedFaceBottom - head * 0.1
            : top + head * 0.72,
        )
      : c.height * 0.34;
    const warmAt = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= c.width || y >= c.height) return false;
      const k = (y * c.width + x) * 4;
      return (
        p[k + 3] > 100 &&
        p[k] > 140 &&
        p[k + 1] > 80 &&
        p[k] - p[k + 1] > 18 &&
        p[k + 1] - p[k + 2] > 10
      );
    };
    const eyeRadius = Math.max(4, Math.round(head * 0.05));
    for (let y = Math.round(eyeStart); y < eyeEnd; y++) {
      let n = 0;
      for (let x = Math.round(cx - head * 0.3); x < cx + head * 0.3; x++) {
        const k = (y * c.width + x) * 4;
        if (
          p[k + 3] > 150 &&
          p[k] < 105 &&
          p[k + 1] < 95 &&
          p[k + 2] < 95 &&
          p[k] >= p[k + 2] * 0.88 &&
          // Pupils sit inside warm face pixels. Dark hair outlines are not eyes.
          (!movingPose ||
            [
              warmAt(x - eyeRadius, y),
              warmAt(x + eyeRadius, y),
              warmAt(x, y - eyeRadius),
              warmAt(x, y + eyeRadius),
            ].filter(Boolean).length >= 2)
        )
          n++;
      }
      if (n > best) {
        best = n;
        eyes = y;
      }
    }
  }
  return {
    c,
    eyes,
    cx,
    head,
    top,
    skinRegions: {
      raisedHands,
      bareLegs,
      bareShoulders,
      collared,
      faceBottom: detectedFaceBottom,
    },
  };
}
function sheetFigure(
  sheet: HTMLImageElement,
  columns: number,
  rows: number,
  cell: number,
  eyeLine?: number,
  bareLegs = false,
  bareShoulders = false,
  collared = false,
) {
  const c = canvas(
    Math.floor(sheet.width / columns),
    Math.floor(sheet.height / rows),
  );
  c.getContext('2d')!.drawImage(
    sheet,
    ((cell % columns) * sheet.width) / columns,
    (Math.floor(cell / columns) * sheet.height) / rows,
    sheet.width / columns,
    sheet.height / rows,
    0,
    0,
    c.width,
    c.height,
  );
  const cleaned = clean(c, true),
    b = bounds(cleaned),
    f = canvas(400, 480),
    scale = Math.min(356 / b.w, 450 / b.h);
  f.getContext('2d')!.drawImage(
    cleaned,
    b.x,
    b.y,
    b.w,
    b.h,
    (400 - b.w * scale) / 2,
    465 - b.h * scale,
    b.w * scale,
    b.h * scale,
  );
  return figure(f, eyeLine, false, bareLegs, bareShoulders, collared);
}
/** Keep only the opaque region of a large source canvas (e.g. 6 MB cap art). */
function cropPiece(piece: Piece): Piece {
  const c = canvas(Math.max(1, piece.w), Math.max(1, piece.h));
  c.getContext('2d')!.drawImage(
    piece.c,
    piece.x,
    piece.y,
    piece.w,
    piece.h,
    0,
    0,
    piece.w,
    piece.h,
  );
  piece.c.width = piece.c.height = 0;
  return { c, x: 0, y: 0, w: piece.w, h: piece.h };
}
function bandAnchor(piece: Piece) {
  const data = piece.c
    .getContext('2d')!
    .getImageData(0, 0, piece.c.width, piece.c.height).data;
  let x = 0,
    y = 0,
    n = 0;
  for (let j = 0; j < data.length; j += 4)
    if (
      data[j + 3] > 150 &&
      data[j] > 115 &&
      data[j] > data[j + 1] * 1.7 &&
      data[j] > data[j + 2] * 1.5
    ) {
      x += (j / 4) % piece.c.width;
      y += Math.floor(j / 4 / piece.c.width);
      n++;
    }
  const cx = n ? x / n : piece.x + piece.w / 2,
    cy = n ? y / n : piece.y + piece.h * 0.35;
  let left = piece.x + piece.w,
    right = piece.x;
  for (let i = piece.x; i < piece.x + piece.w; i++)
    if (data[(Math.round(cy) * piece.c.width + i) * 4 + 3] > 150) {
      left = Math.min(left, i);
      right = Math.max(right, i);
    }
  return {
    cx,
    cy,
    width: Math.max(piece.w * 0.6, Math.min(right - left, 2 * (cx - left))),
  };
}
let pending: Promise<Awaited<ReturnType<typeof prepare>>> | null = null;
type AtlasKey =
  | 'original'
  | 'hohyeon'
  | 'classic'
  | 'street'
  | 'smart'
  | 'buns'
  | 'outfits'
  | 'shampoo'
  | 'akatsuki'
  | 'accessories'
  | 'cap'
  | 'hachimaki';

/** Which atlases a look needs; only these are downloaded and prepared. */
export function spriteAtlasesFor(actor: number, input: Look): AtlasKey[] {
  const look = readLook(input, actor);
  const index = ['classic', 'street', 'smart'].indexOf(look.collection),
    newOutfit = ['wide-pants', 'denim', 'miku'].indexOf(look.collection),
    bun = actor === 0 && look.hairstyle === 'buns',
    shampoo = actor === 0 && look.collection === 'shampoo',
    akatsuki = look.collection === 'akatsuki',
    special = actor === 0 && (bun || newOutfit >= 0 || shampoo);
  const keys = new Set<AtlasKey>();
  if (akatsuki) keys.add('akatsuki');
  else if (special)
    keys.add(shampoo ? 'shampoo' : newOutfit >= 0 ? 'outfits' : 'buns');
  else if (index < 0) keys.add(actor === 6 ? 'hohyeon' : 'original');
  else keys.add(look.collection as 'classic' | 'street' | 'smart');
  const hat = HATS.find((h) => h.id === look.hat)?.cell ?? -1;
  const glasses = GLASSES.find((g) => g.id === look.glasses)?.cell ?? -1;
  if (hat === 9) keys.add('hachimaki');
  else if (hat >= 0) keys.add(actor === 5 && hat === 0 ? 'cap' : 'accessories');
  if (glasses >= 0 || look.clip) keys.add('accessories');
  return [...keys];
}

async function prepare() {
  const a = LOUNGE_ASSETS as Record<string, string>;
  const atlases = new Map<AtlasKey, Promise<void>>();
  const ready = new Set<AtlasKey>();
  const failed = new Set<AtlasKey>();
  let bunFigures: Figure[] = [],
    outfitFigures: Figure[] = [],
    shampooFigures: Figure[] = [],
    akatsukiFigures: Figure[] = [];
  const original: Figure[][] = [];
  const collections: Figure[][] = [];
  const pieces: Piece[] = [];
  let band = { cx: 0, cy: 0, width: 1 };
  const sheetCell = (sheet: HTMLImageElement, i: number) => {
    const c = canvas(Math.floor(sheet.width / 4), Math.floor(sheet.height / 2));
    c.getContext('2d')!.drawImage(
      sheet,
      ((i % 4) * sheet.width) / 4,
      (Math.floor(i / 4) * sheet.height) / 2,
      sheet.width / 4,
      sheet.height / 2,
      0,
      0,
      c.width,
      c.height,
    );
    const cleanCell = clean(c, true),
      b = bounds(cleanCell),
      f = canvas(400, 480),
      scale = Math.min(356 / b.w, 450 / b.h);
    f.getContext('2d')!.drawImage(
      cleanCell,
      b.x,
      b.y,
      b.w,
      b.h,
      (400 - b.w * scale) / 2,
      465 - b.h * scale,
      b.w * scale,
      b.h * scale,
    );
    return f;
  };
  const builders: Record<AtlasKey, () => Promise<void>> = {
    async original() {
      const motion = await image(a.motion);
      const rows = [
          [20, 241],
          [264, 256],
          [521, 248],
          [771, 258],
          [1030, 259],
          [1289, 247],
        ],
        eyes = [
          [108, 109, 108, 108],
          [351, 348, 351, 348],
          [608, 607, 607, 608],
          [861, 861, 862, 861],
          [1120, 1120, 1121, 1120],
          [1371, 1372, 1372, 1369],
        ];
      for (let r = 0; r < 6; r++) {
        original[r] = [];
        for (let col = 0; col < 4; col++) {
          const c = canvas(320, 320);
          c.getContext('2d')!.drawImage(
            motion,
            35 + col * 240,
            rows[r][0],
            240,
            rows[r][1],
            0,
            0,
            320,
            320,
          );
          const f = figure(
            clean(c),
            ((eyes[r][col] - rows[r][0]) * 320) / rows[r][1],
            col === 3,
            [0, 1, 2, 5].includes(r),
            r === 1,
            r === 2,
          );
          if (col === 0) f.rig = `original:${r}`;
          original[r].push(f);
        }
      }
    },
    async hohyeon() {
      const hohyeon = await image(a.hohyeon);
      const hc = canvas(hohyeon.width, hohyeon.height);
      hc.getContext('2d')!.drawImage(hohyeon, 0, 0);
      // The checkerboard is pure grey, the sneakers a warm off-white that the
      // default tolerance floods away, so this sheet keys with a tighter one.
      const b = bounds(keepPieces(clean(hc, false, TIGHT_BACKDROP_SPREAD), 1)),
        h = canvas(400, 480);
      h.getContext('2d')!.drawImage(
        hc,
        b.x,
        b.y,
        b.w,
        b.h,
        (400 - (b.w / b.h) * 450) / 2,
        15,
        (b.w / b.h) * 450,
        450,
      );
      original[6] = [figure(h, ((356 - b.y) / b.h) * 450 + 15)];
      original[6][0].rig = 'hohyeon:0';
    },
    ...Object.fromEntries(
      (['classic', 'street', 'smart'] as const).map((key, sheetIndex) => [
        key,
        async () => {
          const sheet = await image(a[key]);
          collections[sheetIndex] = Array.from({ length: 7 }, (_, i) => {
            const f = figure(
              sheetCell(sheet, i),
              undefined,
              false,
              sheetIndex === 0 && [0, 1, 2, 5].includes(i),
              sheetIndex === 0 && i === 1,
              i === 2 || (sheetIndex === 2 && i === 3),
            );
            f.rig = `${key}:${i}`;
            return f;
          });
        },
      ]),
    ) as Record<'classic' | 'street' | 'smart', () => Promise<void>>,
    async buns() {
      const bunSheet = await image(a.daowonBuns);
      bunFigures = Array.from({ length: 4 }, (_, i) => {
        const f = sheetFigure(
          bunSheet,
          2,
          2,
          i,
          [148, 148, 146, 146][i],
          i === 0 || i === 3,
        );
        f.rig = `buns:${i}`;
        return f;
      });
    },
    async outfits() {
      const outfitSheet = await image(a.daowonOutfits);
      // Measured eye lines in the normalized 400×480 figures avoid mistaking a black shirt for eyes.
      outfitFigures = Array.from({ length: 6 }, (_, i) => {
        const f = sheetFigure(
          outfitSheet,
          3,
          2,
          i,
          [128, 128, 129, 134, 134, 134][i],
          i % 3 === 2,
          i % 3 === 2,
        );
        f.rig = `outfits:${i}`;
        // Denim: the navy jacket collar touches the bob's tips. Below the chin
        // only the saturated hair blue may join the hair mask.
        if (i % 3 === 1) f.hairCollar = f.eyes + 42;
        return f;
      });
    },
    async shampoo() {
      const shampooSheet = await image(a.dowonShampoo);
      shampooFigures = Array.from({ length: 2 }, (_, i) => {
        const f = sheetFigure(
          shampooSheet,
          2,
          1,
          i,
          [113, 119][i],
          false,
          false,
          true,
        );
        f.skinRegions.shortSleeveTunic = true;
        f.rig = `shampoo:${i}`;
        return f;
      });
    },
    async akatsuki() {
      const akatsukiSheet = await image(a.akatsuki);
      akatsukiFigures = Array.from({ length: 8 }, (_, i) => {
        const f = sheetFigure(
          akatsukiSheet,
          4,
          2,
          i,
          [136, 133, 136, 135, 139, 133, 138, 138][i],
          false,
          false,
          true,
        );
        f.skinRegions.bareToes = true;
        f.skinRegions.darkHighCollar = true;
        f.rig = `akatsuki:${i}`;
        return f;
      });
    },
    async accessories() {
      const accessories = await image(a.accessories);
      for (let i = 0; i < 8; i++) {
        const c = canvas(accessories.width / 4, accessories.height / 2);
        c.getContext('2d')!.drawImage(
          accessories,
          ((i % 4) * accessories.width) / 4,
          (Math.floor(i / 4) * accessories.height) / 2,
          c.width,
          c.height,
          0,
          0,
          c.width,
          c.height,
        );
        pieces[i] = bounds(clean(c));
      }
    },
    async cap() {
      const cap = await image(a.jaeminCap);
      const c = canvas(cap.width, cap.height);
      c.getContext('2d')!.drawImage(cap, 0, 0);
      pieces[8] = cropPiece(bounds(clean(c)));
    },
    async hachimaki() {
      const hachimaki = await image(a.hachimaki);
      const bandCanvas = canvas(hachimaki.width, hachimaki.height);
      bandCanvas.getContext('2d')!.drawImage(hachimaki, 0, 0);
      // Preserve genuine alpha; also support the generated magenta extraction background.
      const piece = bounds(clean(clean(bandCanvas, true)));
      band = bandAnchor(piece);
      const cropped = cropPiece(piece);
      band = {
        cx: band.cx - piece.x,
        cy: band.cy - piece.y,
        width: band.width,
      };
      pieces[9] = cropped;
    },
  };
  function loadAtlas(key: AtlasKey) {
    let job = atlases.get(key);
    if (!job) {
      job = builders[key]().then(
        () => {
          ready.add(key);
        },
        (error: unknown) => {
          failed.add(key);
          atlases.delete(key);
          throw error;
        },
      );
      atlases.set(key, job);
    }
    return job;
  }
  function isReady(actor: number, look: Look) {
    return spriteAtlasesFor(actor, look).every((key) => ready.has(key));
  }
  function ensure(actor: number, look: Look) {
    return Promise.all(spriteAtlasesFor(actor, look).map(loadAtlas)).then(
      () => undefined,
    );
  }
  const motionFigures = new Map<string, { walk: Figure[]; run: Figure[] }>();
  const motionLoads = new Map<string, Promise<void>>();
  const motionFailures = new Set<string>();
  // Movement artwork is loaded per visible look, after the essential wardrobe.
  // A failed request leaves the cut-out rig fully usable.
  function loadMotion(sheet: MotionSheet, skin: Figure['skinRegions']) {
    if (!motionLoads.has(sheet.id))
      motionLoads.set(
        sheet.id,
        image(sheet.url)
          .then((picture) => {
            const frames = (rects: readonly { x: number; y: number; w: number; h: number }[]) =>
              rects.map((rect) => {
                const c = canvas(rect.w, rect.h);
                c.getContext('2d')!.drawImage(
                  picture,
                  rect.x,
                  rect.y,
                  rect.w,
                  rect.h,
                  0,
                  0,
                  rect.w,
                  rect.h,
                );
                const f = figure(
                  sheet.keying === 'magenta' ? clean(c, true) : c,
                  undefined,
                  false,
                  skin.bareLegs,
                  skin.bareShoulders,
                  skin.collared,
                  true,
                );
                f.skinRegions = { ...skin, ...f.skinRegions, movingHands: true };
                f.blueHairOnly = sheet.blueHairOnly;
                return f;
              });
            motionFigures.set(sheet.id, {
              walk: frames(sheet.walk),
              run: frames(sheet.run),
            });
          })
          .catch((error) => {
            motionFailures.add(sheet.id);
            throw error;
          }),
      );
    return motionLoads.get(sheet.id)!;
  }
  const motionCrops = new Map<
    string,
    { x: number; y: number; w: number; h: number }
  >();
  function attachments(base: Figure, look: Look, actor: number, bun: boolean) {
    const result: {
      piece: Piece;
      x: number;
      y: number;
      w: number;
      h: number;
    }[] = [];
    const add = (i: number, w: number, x: number, y: number) => {
      const piece = pieces[i],
        h = (w * piece.h) / piece.w;
      result.push({ piece, x: x - w / 2, y: y - h / 2, w, h });
    };
    const hat = HATS.find((h) => h.id === look.hat)!.cell;
    const glasses = GLASSES.find((g) => g.id === look.glasses)!.cell;
    if (hat === 9) {
      const piece = pieces[9],
        scale = (base.head * (bun ? 0.83 : 0.95)) / band.width;
      result.push({
        piece,
        x: base.cx - (band.cx - piece.x) * scale,
        y: base.eyes - base.head * 0.2 - (band.cy - piece.y) * scale,
        w: piece.w * scale,
        h: piece.h * scale,
      });
    } else if (hat >= 0) {
      const i = actor === 5 && hat === 0 ? 8 : hat;
      const w = base.head * (hat === 1 ? 1.35 : hat === 0 ? 0.92 : 1.03);
      add(
        i,
        w,
        base.cx,
        base.eyes - base.head * 0.19 - (w * pieces[i].h) / pieces[i].w / 2,
      );
    }
    if (glasses >= 0) add(glasses, base.head * 0.76, base.cx, base.eyes);
    if (look.clip)
      add(
        7,
        base.head * 0.25,
        base.cx + base.head * 0.38,
        base.top + base.head * 0.3,
      );
    return result;
  }
  function motionCrop(sheet: MotionSheet, actor: number, look: Look) {
    const key = JSON.stringify([sheet.id, look.hat, look.glasses, look.clip]);
    if (motionCrops.has(key)) return motionCrops.get(key)!;
    const rows = motionFigures.get(sheet.id)!;
    let left = Infinity,
      top = Infinity,
      right = 0,
      bottom = 0;
    for (const f of [...rows.walk, ...rows.run]) {
      for (const r of [bounds(f.c), ...attachments(f, look, actor, false)]) {
        left = Math.min(left, r.x);
        top = Math.min(top, r.y);
        right = Math.max(right, r.x + r.w);
        bottom = Math.max(bottom, r.y + r.h);
      }
    }
    // One crop for the entire cycle prevents changing pose bounds from zooming
    // the head and shifting the ground contact on every frame.
    const result = {
      x: Math.floor(left) + 60,
      y: Math.floor(top) + 150,
      w: Math.ceil(right) - Math.floor(left),
      h: Math.ceil(bottom) - Math.floor(top),
    };
    motionCrops.set(key, result);
    if (motionCrops.size > 56)
      motionCrops.delete(motionCrops.keys().next().value!);
    return result;
  }
  // Byte-bounded: a composed 520×660 figure is ~1.4 MB of canvas memory.
  const cache = new ByteLru<Piece>(40 * 1024 * 1024);
  // Rig parts (one set per actor × look) and their posed frames. Frames are
  // rendered at the target's resolution bucket, so a village figure costs
  // ~0.4 MB per pose; a miss only re-runs a handful of drawImage calls.
  const rigPartsCache = new ByteLru<{ c: HTMLCanvasElement; parts: RigParts | null }>(
    24 * 1024 * 1024,
    (value) => value.parts?.bytes ?? 4,
  );
  const rigFrames = new ByteLru<RigFrame>(28 * 1024 * 1024);
  const rigScratch = drawCanvas(1, 1);
  const lastDraw = new WeakMap<
    HTMLCanvasElement,
    { piece: Piece; key: string }
  >();
  /** The static figure a look shows (standing pose unless `frame` picks a legacy step). */
  function staticFigure(actor: number, look: Look, frame: number) {
    const index = ['classic', 'street', 'smart'].indexOf(look.collection),
      newOutfit = ['wide-pants', 'denim', 'miku'].indexOf(look.collection),
      bun = actor === 0 && look.hairstyle === 'buns',
      shampoo = actor === 0 && look.collection === 'shampoo',
      akatsuki = look.collection === 'akatsuki',
      special = actor === 0 && (bun || newOutfit >= 0 || shampoo),
      legacy = !akatsuki && !special && index < 0;
    return akatsuki
      ? akatsukiFigures[bun ? 7 : actor]
      : special
        ? shampoo
          ? shampooFigures[bun ? 1 : 0]
          : newOutfit >= 0
            ? outfitFigures[newOutfit + (bun ? 3 : 0)]
            : bunFigures[
                ['classic', 'street', 'smart', 'original'].indexOf(
                  look.collection,
                )
              ]
        : legacy
          ? original[actor][Math.min(frame, original[actor].length - 1)]
          : collections[index][actor];
  }
  function composed(
    actor: number,
    look: Look,
    frame: number,
    generated?: { sheet: MotionSheet; motion: 'walk' | 'run' },
  ) {
    const key = JSON.stringify([actor, look, frame, generated?.sheet.id, generated?.motion]);
    const hit = cache.get(key);
    if (hit) return hit;
    const bun = actor === 0 && look.hairstyle === 'buns',
      base = generated
        ? motionFigures.get(generated.sheet.id)![generated.motion][frame]
        : staticFigure(actor, look, frame),
      c = canvas(base.c.width + 120, base.c.height + 180),
      ctx = c.getContext('2d')!,
      p = base.c
        .getContext('2d')!
        .getImageData(0, 0, base.c.width, base.c.height);
    const hair = colorRgb(
        look.hairColor ?? HAIR_COLORS.find((h) => h.id === look.hair)!.hex,
      ),
      top = colorRgb(TOP_COLORS.find((h) => h.id === look.top)!.hex),
      skin = look.skinColor ? colorRgb(look.skinColor) : null,
      hairMask = (base.hair ??= createHairMask(
        p.data,
        base.c.width,
        base.c.height,
        {
          cx: base.cx,
          eyes: base.eyes,
          head: base.head,
          collar: base.hairCollar,
        },
      )),
      skinMask = skin
        ? (base.skin ??= createSkinMask(p.data, base.c.width, base.c.height, {
            cx: base.cx,
            eyes: base.eyes,
            head: base.head,
            ...base.skinRegions,
          }))
        : null;
    for (let k = 0; k < p.data.length; k += 4) {
      const r = p.data[k],
        g = p.data[k + 1],
        b = p.data[k + 2];
      if (skin && skinMask?.pixels[k / 4]) {
        const color = dyeSkinPixel(r, g, b, skin, skinMask.luminance);
        p.data[k] = color[0];
        p.data[k + 1] = color[1];
        p.data[k + 2] = color[2];
        continue;
      }
      const hairPixel =
          hairMask[k / 4] === 1 ||
          (base.blueHairOnly && b > Math.max(r, g) * 1.17),
        originalTop =
          look.collection === 'original' &&
          g >= b * 0.9 &&
          Math.min(g, b) > r * 1.18;
      if (!hairPixel && !originalTop) continue;
      const color = dyePixel(r, g, b, hair, top);
      p.data[k] = color[0];
      p.data[k + 1] = color[1];
      p.data[k + 2] = color[2];
    }
    ctx.putImageData(p, 60, 150);
    for (const { piece, x, y, w, h } of attachments(base, look, actor, bun)) {
      ctx.drawImage(
        piece.c,
        piece.x,
        piece.y,
        piece.w,
        piece.h,
        60 + x,
        150 + y,
        w,
        h,
      );
    }
    const result = generated
      ? { c, ...motionCrop(generated.sheet, actor, look) }
      : bounds(c);
    cache.set(key, result);
    return result;
  }
  function rigAvailable(actor: number, look: Look) {
    const rig = staticFigure(actor, look, 0).rig;
    return !!rig && !!RIG_CELLS[rig];
  }
  function rigParts(actor: number, look: Look) {
    const key = JSON.stringify([actor, look]);
    const hit = rigPartsCache.get(key);
    if (hit) return hit.parts;
    const base = staticFigure(actor, look, 0),
      cell = base.rig ? RIG_CELLS[base.rig] : undefined;
    let parts: RigParts | null = null;
    if (cell) {
      const piece = composed(actor, look, 0),
        body = (base.body ??= bounds(base.c));
      parts = buildRigParts(
        drawCanvas,
        piece.c,
        { x: piece.x, y: piece.y, w: piece.w, h: piece.h },
        { x: body.x + 60, y: body.y + 150, w: body.w, h: body.h },
        cell,
      );
    }
    rigPartsCache.set(key, { c: placeholder, parts });
    return parts;
  }
  function rigFrame(
    actor: number,
    look: Look,
    motion: 'walk' | 'run',
    pose: number,
    resolution: number,
  ) {
    const key = JSON.stringify([actor, look, motion, pose, resolution]);
    const hit = rigFrames.get(key);
    if (hit) return hit;
    const parts = rigParts(actor, look);
    if (!parts) return null;
    const m = rigFrameMargins(parts),
      { area } = parts;
    const c = drawCanvas(
      Math.ceil((area.w + m.side * 2) * resolution),
      Math.ceil((area.h + m.top + m.bottom) * resolution),
    );
    const ctx = c.getContext('2d')!;
    ctx.scale(resolution, resolution);
    ctx.translate(m.side - area.x, m.top - area.y);
    if (rigScratch.width < c.width || rigScratch.height < c.height) {
      rigScratch.width = Math.max(rigScratch.width, c.width);
      rigScratch.height = Math.max(rigScratch.height, c.height);
    }
    drawRigPose(
      ctx,
      parts,
      solveGait(motion, (pose + 0.5) / RIG_POSES, parts.geometry),
      rigScratch,
    );
    const frame: RigFrame = {
      c,
      x: 0,
      y: 0,
      w: c.width,
      h: c.height,
      originX: area.x - m.side,
      originY: area.y - m.top,
      resolution,
    };
    rigFrames.set(key, frame);
    return frame;
  }
  return {
    /** Downloads and prepares only the atlases this look needs. */
    ensure(actor: number, input: Look) {
      return ensure(actor, readLook(input, actor));
    },
    ready(actor: number, input: Look) {
      return isReady(actor, readLook(input, actor));
    },
    async warmMotion(actor: number, input: Look) {
      const look = readLook(input, actor);
      await ensure(actor, look);
      const sheet = motionSheetFor(actor, look);
      if (!sheet) {
        // Cut the rig parts while the scene loads; poses are cheap afterwards.
        rigParts(actor, look);
        return;
      }
      await loadMotion(sheet, staticFigure(actor, look, 0).skinRegions);
      // Prepare the local player's color/accessory composites while the scene
      // loads, so the first input does not pay for decoding twelve new poses.
      for (const motion of ['walk', 'run'] as const)
        for (
          let frame = 0;
          frame < motionFigures.get(sheet.id)![motion].length;
          frame++
        )
          composed(actor, look, frame, { sheet, motion });
    },
    draw(
      target: HTMLCanvasElement,
      actor: number,
      input: Look,
      motion: Motion = 'idle',
      time = 0,
      portrait = false,
      reduced = false,
      options: { facing?: 1 | -1 } = {},
    ) {
      const look = readLook(input, actor);
      if (!isReady(actor, look)) {
        // The caller redraws on its own clock; nothing is drawn until the
        // look's atlases arrive, so no placeholder art flashes.
        void ensure(actor, look).catch(() => {
          /* A failed atlas is retried on the next draw. */
        });
        return false;
      }
      const locomotion =
        !portrait && !reduced && (motion === 'walk' || motion === 'run');
      // Real hand-drawn frames win whenever the manifest has a sheet for the
      // look; until it loads (or if it fails) the cut-out rig walks instead.
      const sheet = locomotion ? motionSheetFor(actor, look) : undefined;
      if (sheet && !motionFigures.has(sheet.id) && !motionFailures.has(sheet.id))
        void loadMotion(sheet, staticFigure(actor, look, 0).skinRegions).catch(
          () => {
            /* The rig remains available offline. */
          },
        );
      const generated =
        sheet && motionFigures.has(sheet.id)
          ? { sheet, motion: motion as 'walk' | 'run' }
          : undefined;
      const rigged = locomotion && !generated && rigAvailable(actor, look);
      const legacySteps =
        !rigged &&
        !generated &&
        look.collection === 'original' &&
        look.hairstyle === 'signature';
      const base = composed(
          actor,
          look,
          generated
            ? gaitFrame(
                motion,
                time,
                motionFigures.get(sheet!.id)![generated.motion].length,
              )
            : legacySteps
              ? motionFrame(motion, time, reduced)
              : 0,
          generated,
        ),
        ctx = target.getContext('2d')!;
      // The idle composite sets the scale for every motion, so starting and
      // stopping never changes the figure's size or ground line.
      const scale = portrait
          ? target.width / (base.w * 0.94)
          : Math.min(
              (target.width * 0.92) / base.w,
              (target.height * 0.94) / base.h,
            ),
        pose = {
          ...motionTransform(motion, time, reduced || !!generated || rigged),
        };
      let f: Piece = base,
        dx = (-base.w * scale) / 2,
        dy = portrait ? 0 : -base.h * scale,
        dw = base.w * scale,
        dh = base.h * scale;
      if (rigged) {
        const resolution = Math.min(1, Math.ceil(scale * 4) / 4);
        const frame = rigFrame(
          actor,
          look,
          motion as 'walk' | 'run',
          rigPoseIndex(motion, time),
          resolution,
        );
        if (frame) {
          f = frame;
          dx += (frame.originX - base.x) * scale;
          dy += (frame.originY - base.y) * scale;
          dw = (frame.w / resolution) * scale;
          dh = (frame.h / resolution) * scale;
        }
      }
      // Half-pixel / small-angle quantization: an unchanged pose skips the
      // redraw and the GPU texture upload on the next frame.
      pose.lift = Math.round(pose.lift * scale * 2) / 2 / scale;
      pose.tilt = Math.round(pose.tilt * 400) / 400;
      if (motion === 'idle' && !portrait && !reduced) {
        // Idle breathing on a wall clock: a 0–1.5 px rise, quantized to half
        // pixels so an unchanged pose skips the redraw and texture upload.
        const breath = (Math.sin((performance.now() / 1000) * 2.1) + 1) * 0.75;
        pose.lift = Math.round(breath * 2) / 2 / scale;
        pose.scaleY = 1 + Math.round(breath * 2) * 0.0015;
        pose.tilt = 0;
      }
      const drawKey = [
        target.width,
        target.height,
        portrait,
        options.facing ?? 1,
        pose.lift,
        pose.tilt,
        pose.scaleX,
        pose.scaleY,
      ].join('|');
      const previous = lastDraw.get(target);
      if (previous?.piece === f && previous.key === drawKey) return false;
      ctx.clearRect(0, 0, target.width, target.height);
      ctx.save();
      ctx.translate(
        target.width / 2,
        portrait
          ? target.height * 0.08
          : target.height * 0.97 - pose.lift * scale,
      );
      ctx.rotate(pose.tilt);
      ctx.scale(
        pose.scaleX * (portrait ? 1 : (options.facing ?? 1)),
        pose.scaleY,
      );
      ctx.drawImage(f.c, f.x, f.y, f.w, f.h, dx, dy, dw, dh);
      ctx.restore();
      lastDraw.set(target, { piece: f, key: drawKey });
      return true;
    },
  };
}
export function loungeSprites() {
  if (!pending)
    pending = prepare().catch((e) => {
      pending = null;
      throw e;
    });
  return pending;
}
