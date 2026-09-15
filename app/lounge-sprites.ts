import { LOUNGE_ASSETS } from './lounge-assets';
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
};
const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
const image = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('캐릭터 그림을 불러오지 못했어요.'));
    im.src = url;
  });
function clean(c: HTMLCanvasElement, magenta = false) {
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
    removeConnectedBackdrop(p.data, c.width, c.height);
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
function figure(c: HTMLCanvasElement, eyes?: number): Figure {
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
  const head = Math.max(40, right - left),
    cx = (left + right) / 2;
  if (eyes === undefined) {
    let best = 0;
    eyes = c.height * 0.3;
    for (let y = Math.round(c.height * 0.19); y < c.height * 0.43; y++) {
      let n = 0;
      for (let x = Math.round(cx - head * 0.3); x < cx + head * 0.3; x++) {
        const k = (y * c.width + x) * 4;
        if (
          p[k + 3] > 150 &&
          p[k] < 105 &&
          p[k + 1] < 95 &&
          p[k + 2] < 95 &&
          p[k] >= p[k + 2] * 0.88
        )
          n++;
      }
      if (n > best) {
        best = n;
        eyes = y;
      }
    }
  }
  return { c, eyes, cx, head, top };
}
let pending: Promise<Awaited<ReturnType<typeof prepare>>> | null = null;
async function prepare() {
  const a = LOUNGE_ASSETS as Record<string, string>;
  const [motion, accessories, cap, hohyeon, ...newSheets] = await Promise.all([
    image(a.motion),
    image(a.accessories),
    image(a.jaeminCap),
    image(a.hohyeon),
    ...['classic', 'street', 'smart'].map((k) => image(a[k])),
  ]);
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
    ],
    original: Figure[][] = [];
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
      original[r].push(
        figure(clean(c), ((eyes[r][col] - rows[r][0]) * 320) / rows[r][1]),
      );
    }
  }
  const hc = canvas(hohyeon.width, hohyeon.height);
  hc.getContext('2d')!.drawImage(hohyeon, 0, 0);
  const b = bounds(keepPieces(clean(hc), 1)),
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
  const collections = newSheets.map((sheet) =>
    Array.from({ length: 7 }, (_, i) => {
      const c = canvas(
        Math.floor(sheet.width / 4),
        Math.floor(sheet.height / 2),
      );
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
      return figure(f);
    }),
  );
  const pieces = Array.from({ length: 9 }, (_, i) => {
    const src = i === 8 ? cap : accessories,
      c = canvas(
        i === 8 ? cap.width : accessories.width / 4,
        i === 8 ? cap.height : accessories.height / 2,
      );
    c.getContext('2d')!.drawImage(
      src,
      i === 8 ? 0 : ((i % 4) * accessories.width) / 4,
      i === 8 ? 0 : (Math.floor(i / 4) * accessories.height) / 2,
      c.width,
      c.height,
      0,
      0,
      c.width,
      c.height,
    );
    return bounds(clean(c));
  });
  const cache = new Map<string, Piece>();
  function composed(actor: number, look: Look, frame: number) {
    const key = JSON.stringify([actor, look, frame]);
    if (cache.has(key)) return cache.get(key)!;
    const index = ['classic', 'street', 'smart'].indexOf(look.collection),
      base =
        index < 0
          ? original[actor][Math.min(frame, original[actor].length - 1)]
          : collections[index][actor],
      c = canvas(base.c.width + 120, base.c.height + 180),
      ctx = c.getContext('2d')!,
      p = base.c
        .getContext('2d')!
        .getImageData(0, 0, base.c.width, base.c.height);
    const rgb = (hex: string) =>
        [1, 3, 5].map((n) => parseInt(hex.slice(n, n + 2), 16)),
      hair = rgb(HAIR_COLORS.find((h) => h.id === look.hair)!.hex),
      top = rgb(TOP_COLORS.find((h) => h.id === look.top)!.hex);
    for (let k = 0; k < p.data.length; k += 4) {
      const r = p.data[k],
        g = p.data[k + 1],
        b = p.data[k + 2];
      if (index >= 0 && !(b > Math.max(r, g) * 1.12)) continue;
      const color = dyePixel(r, g, b, hair, top);
      p.data[k] = color[0];
      p.data[k + 1] = color[1];
      p.data[k + 2] = color[2];
    }
    ctx.putImageData(p, 60, 150);
    const add = (i: number, w: number, x: number, y: number) => {
      const piece = pieces[i],
        h = (w * piece.h) / piece.w;
      ctx.drawImage(
        piece.c,
        piece.x,
        piece.y,
        piece.w,
        piece.h,
        60 + x - w / 2,
        150 + y - h / 2,
        w,
        h,
      );
    };
    const hat = HATS.find((h) => h.id === look.hat)!.cell,
      glasses = GLASSES.find((g) => g.id === look.glasses)!.cell;
    if (hat >= 0) {
      const i = actor === 5 && hat === 0 ? 8 : hat,
        w = base.head * (hat === 1 ? 1.35 : hat === 0 ? 0.92 : 1.03),
        h = (w * pieces[i].h) / pieces[i].w;
      add(i, w, base.cx, base.eyes - base.head * 0.19 - h / 2);
    }
    if (glasses >= 0) add(glasses, base.head * 0.76, base.cx, base.eyes);
    if (look.clip)
      add(
        7,
        base.head * 0.25,
        base.cx + base.head * 0.38,
        base.top + base.head * 0.3,
      );
    const result = bounds(c);
    cache.set(key, result);
    if (cache.size > 64) cache.delete(cache.keys().next().value!);
    return result;
  }
  return {
    draw(
      target: HTMLCanvasElement,
      actor: number,
      input: Look,
      motion: Motion = 'idle',
      time = 0,
      portrait = false,
      reduced = false,
    ) {
      const look = readLook(input, actor),
        f = composed(
          actor,
          look,
          look.collection === 'original'
            ? motionFrame(motion, time, reduced)
            : 0,
        ),
        ctx = target.getContext('2d')!;
      ctx.clearRect(0, 0, target.width, target.height);
      const scale = portrait
          ? target.width / (f.w * 0.94)
          : Math.min((target.width * 0.92) / f.w, (target.height * 0.94) / f.h),
        pose = motionTransform(motion, time, reduced);
      ctx.save();
      ctx.translate(
        target.width / 2,
        portrait
          ? target.height * 0.08
          : target.height * 0.97 - pose.lift * scale,
      );
      ctx.rotate(pose.tilt);
      ctx.scale(pose.scaleX, pose.scaleY);
      ctx.drawImage(
        f.c,
        f.x,
        f.y,
        f.w,
        f.h,
        (-f.w * scale) / 2,
        portrait ? 0 : -f.h * scale,
        f.w * scale,
        f.h * scale,
      );
      ctx.restore();
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
