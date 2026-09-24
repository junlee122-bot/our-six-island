import { solveGait, type GaitGeometry, type GaitSolution } from './lounge-gait';

/**
 * Cut-out rig for static full-body figures. `scripts/build-lounge-rig.mjs`
 * segments every atlas cell offline (app/lounge-rig-data.ts); the runtime only
 * clips the already-dyed composite along those bands once per look, then
 * poses the parts with affine transforms. No pixel reads happen here.
 *
 * All rig coordinates are permille of the figure's opaque bounding box.
 */
export type RigPoint = [number, number];
/** Row bands from `y`, each `step` tall, storing [left, right] per band. */
export type RigSpan = { y: number; step: number; x: number[] };
export type RigLeg = {
  span: RigSpan;
  hip: RigPoint;
  knee: RigPoint | null;
  foot: RigPoint;
};
export type RigArm = {
  side: number;
  span: RigSpan;
  shoulder: RigPoint;
  armpit: number;
};
export type RigCell = {
  /** 'hem': a skirt/coat/tunic stays with the torso; only lower legs move. */
  mode: 'legs' | 'hem';
  crotch: number;
  waist: number;
  legs: RigLeg[];
  arms: RigArm[];
};
export type RigRect = { x: number; y: number; w: number; h: number };
type Layer = { c: HTMLCanvasElement; x: number; y: number };
type LegLayers = { thigh: Layer; shin: Layer | null };
export type RigParts = {
  torso: Layer;
  legs: LegLayers[];
  arms: { layer: Layer; side: number; shoulder: RigPoint }[];
  geometry: GaitGeometry;
  hipCentre: RigPoint;
  waist: number;
  /** Composite area the parts were cut from (source canvas pixels). */
  area: RigRect;
  body: RigRect;
  bytes: number;
};

type MakeCanvas = (w: number, h: number) => HTMLCanvasElement;

const bands = (span: RigSpan) => span.x.length / 2;

/** Band extents → a smooth, conservative outline in source pixels. */
export function spanOutline(
  span: RigSpan,
  body: RigRect,
  pad: number,
): [number, number][] {
  const n = bands(span);
  const X = (v: number) => body.x + (v / 1000) * body.w,
    Y = (v: number) => body.y + (v / 1000) * body.h;
  const at = (i: number, side: 0 | 1) =>
    span.x[Math.max(0, Math.min(n - 1, i)) * 2 + side];
  const left: [number, number][] = [],
    right: [number, number][] = [];
  const top = Y(span.y) - pad,
    bottom = Y(span.y + n * span.step) + pad;
  for (let i = 0; i < n; i++) {
    const l = Math.min(at(i - 1, 0), at(i, 0), at(i + 1, 0)),
      r = Math.max(at(i - 1, 1), at(i, 1), at(i + 1, 1));
    const y = i === 0 ? top : i === n - 1 ? bottom : Y(span.y + (i + 0.5) * span.step);
    if (i === 0) {
      left.push([X(at(0, 0)) - pad, top]);
      right.push([X(at(0, 1)) + pad, top]);
    }
    left.push([X(l) - pad, y]);
    right.push([X(r) + pad, y]);
  }
  left.push([X(at(n - 1, 0)) - pad, bottom]);
  right.push([X(at(n - 1, 1)) + pad, bottom]);
  return [...left, ...right.reverse()];
}

function tracePath(ctx: CanvasRenderingContext2D, points: [number, number][]) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}
function outlineBox(points: [number, number][], clip?: RigRect): RigRect {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [x, y] of points) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  if (clip) {
    x0 = Math.max(x0, clip.x);
    y0 = Math.max(y0, clip.y);
    x1 = Math.min(x1, clip.x + clip.w);
    y1 = Math.min(y1, clip.y + clip.h);
  }
  x0 = Math.floor(x0);
  y0 = Math.floor(y0);
  return {
    x: x0,
    y: y0,
    w: Math.max(1, Math.ceil(x1) - x0),
    h: Math.max(1, Math.ceil(y1) - y0),
  };
}

/** Copy `outline ∩ band(yFrom..yTo)` of the source into its own small layer. */
function cutLayer(
  make: MakeCanvas,
  source: HTMLCanvasElement,
  outline: [number, number][],
  yFrom: number,
  yTo: number,
  area: RigRect,
): Layer {
  const box = outlineBox(outline, {
    x: area.x,
    y: Math.max(area.y, yFrom),
    w: area.w,
    h: Math.min(area.y + area.h, yTo) - Math.max(area.y, yFrom),
  });
  const c = make(box.w, box.h),
    ctx = c.getContext('2d')!;
  ctx.translate(-box.x, -box.y);
  ctx.beginPath();
  ctx.rect(box.x, yFrom, box.w, yTo - yFrom);
  ctx.clip();
  tracePath(ctx, outline);
  ctx.clip();
  ctx.drawImage(source, 0, 0);
  return { c, x: box.x, y: box.y };
}
/**
 * Cut the parts from the dyed composite (hair/skin colors and accessories are
 * already applied, and accessories stay with the head in the torso layer).
 */
export function buildRigParts(
  make: MakeCanvas,
  source: HTMLCanvasElement,
  area: RigRect,
  body: RigRect,
  cell: RigCell,
): RigParts {
  const X = (v: number) => body.x + (v / 1000) * body.w,
    Y = (v: number) => body.y + (v / 1000) * body.h,
    P = ([x, y]: RigPoint): RigPoint => [X(x), Y(y)];
  const px = body.h / 450; // one pixel of the normalized 400×480 figure
  const crotch = Y(cell.crotch);
  const legOutlines = cell.legs.map((leg) => ({
    cut: spanOutline(leg.span, body, 1.2 * px),
    clip: spanOutline(leg.span, body, 2.6 * px),
  }));
  const armOutlines = cell.arms.map((arm) => ({
    cut: spanOutline(arm.span, body, 2.6 * px),
    clip: spanOutline(arm.span, body, 3.6 * px),
  }));
  // Torso: the whole composite minus what the legs and forearms take away.
  // Above the crotch (pelvis, hem) and above the armpits it keeps everything,
  // so a rotated limb slides under intact clothing instead of opening holes.
  const torsoCanvas = make(area.w, area.h),
    tctx = torsoCanvas.getContext('2d')!;
  tctx.drawImage(source, area.x, area.y, area.w, area.h, 0, 0, area.w, area.h);
  tctx.translate(-area.x, -area.y);
  tctx.globalCompositeOperation = 'destination-out';
  const erase = (outline: [number, number][], from: number) => {
    tctx.save();
    tctx.beginPath();
    tctx.rect(area.x, from, area.w, area.y + area.h - from);
    tctx.clip();
    tracePath(tctx, outline);
    tctx.fill();
    tctx.restore();
  };
  legOutlines.forEach((o) => erase(o.cut, crotch));
  cell.arms.forEach((arm, i) => erase(armOutlines[i].cut, Y(arm.armpit)));
  // Thigh and shin overlap generously around the knee: the shin (drawn
  // first) reaches up under the thigh so a folded knee never opens a notch.
  const overlap = 0.035 * body.h;
  const legs = cell.legs.map((leg, i) => {
    const clip = legOutlines[i].clip;
    const knee = leg.knee && cell.mode === 'legs' ? Y(leg.knee[1]) : null;
    const top = Y(leg.span.y) - 3 * px,
      bottom = area.y + area.h;
    const thigh = cutLayer(make, source, clip, top, knee ? knee + overlap : bottom, area);
    const shin = knee ? cutLayer(make, source, clip, knee - overlap * 0.7, bottom, area) : null;
    return { thigh, shin };
  });
  const arms = cell.arms.map((arm, i) => ({
    layer: cutLayer(make, source, armOutlines[i].clip, -1e4, 1e4, area),
    side: arm.side,
    shoulder: P(arm.shoulder),
  }));
  const gaitLegs = cell.legs.map((leg) => {
    const feet = leg.span.x.slice(-6);
    const half = ((Math.max(...feet) - Math.min(...feet)) / 1000) * body.w * 0.5;
    // Pivots sit on the foot's vertical axis: splayed chibi legs rotated about
    // their own slanted axis would bob unevenly (a limp) between steps.
    const foot = P(leg.foot);
    // The knee hinges at its front edge (the kneecap, +x): the shin folds
    // backward under the thigh instead of opening a wedge on wide trousers.
    let kneeX = foot[0];
    if (leg.knee) {
      const i = Math.max(
        0,
        Math.min(bands(leg.span) - 1, Math.floor((leg.knee[1] - leg.span.y) / leg.span.step)),
      );
      const l = X(leg.span.x[i * 2]),
        r = X(leg.span.x[i * 2 + 1]);
      kneeX = Math.max(foot[0], r - (r - l) * 0.18);
    }
    return {
      hip: [foot[0], P(leg.hip)[1]] as RigPoint,
      knee: leg.knee && cell.mode === 'legs' ? ([kneeX, P(leg.knee)[1]] as RigPoint) : null,
      foot,
      footHalf: half * 0.8,
    };
  }) as unknown as GaitGeometry['legs'];
  const hips = cell.legs.map((leg) => P(leg.hip));
  const layers: Layer[] = [
    { c: torsoCanvas, x: area.x, y: area.y },
    ...legs.flatMap((l) => [l.thigh, ...(l.shin ? [l.shin] : [])]),
    ...arms.map((a) => a.layer),
  ];
  return {
    torso: { c: torsoCanvas, x: area.x, y: area.y },
    legs,
    arms,
    geometry: { legs: gaitLegs, height: body.h, hem: cell.mode === 'hem' },
    hipCentre: [(hips[0][0] + hips[1][0]) / 2, Math.min(hips[0][1], hips[1][1])],
    waist: Y(cell.waist),
    area,
    body,
    bytes: layers.reduce((n, l) => n + l.c.width * l.c.height * 4, 0),
  };
}

/** Margins a posed frame needs around the idle composite (source pixels). */
export function rigFrameMargins(parts: Pick<RigParts, 'body'>) {
  const h = parts.body.h;
  return { side: Math.round(h * 0.14), top: Math.round(h * 0.06), bottom: Math.round(h * 0.02) };
}

const at = (ctx: CanvasRenderingContext2D, [x, y]: readonly number[], angle: number) => {
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.translate(-x, -y);
};
const blit = (ctx: CanvasRenderingContext2D, layer: Layer) =>
  ctx.drawImage(layer.c, layer.x, layer.y);

/** Back-leg shading: a cool shadow tint at full trailing weight. */
const SHADE = 'rgba(30, 22, 48, 0.17)';

/**
 * Draw one posed frame; `ctx` is already in source-pixel coordinates.
 * `scratch` (any canvas at least as large as ctx's) lets a trailing leg be
 * composited first and shaded once, so thigh/shin overlaps never darken twice.
 */
export function drawRigPose(
  ctx: CanvasRenderingContext2D,
  parts: RigParts,
  pose: GaitSolution,
  scratch?: HTMLCanvasElement,
) {
  ctx.save();
  ctx.translate(0, pose.drop);
  for (const index of pose.order) {
    const leg = parts.legs[index],
      g = parts.geometry.legs[index],
      p = pose.legs[index];
    const shaded = p.shade > 0.02 && scratch;
    let target = ctx;
    if (shaded) {
      target = scratch.getContext('2d')!;
      target.setTransform(1, 0, 0, 1, 0, 0);
      target.clearRect(0, 0, scratch.width, scratch.height);
      target.setTransform(ctx.getTransform());
    }
    target.save();
    target.translate(0, -p.lift);
    at(target, g.hip, p.thigh);
    if (leg.shin && g.knee) {
      target.save();
      at(target, g.knee, p.shin - p.thigh);
      blit(target, leg.shin);
      target.restore();
    }
    blit(target, leg.thigh);
    target.restore();
    if (shaded) {
      target.setTransform(1, 0, 0, 1, 0, 0);
      target.globalCompositeOperation = 'source-atop';
      target.globalAlpha = p.shade;
      target.fillStyle = SHADE;
      target.fillRect(0, 0, scratch.width, scratch.height);
      target.globalAlpha = 1;
      target.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(scratch, 0, 0);
      ctx.restore();
    }
  }
  ctx.save();
  at(ctx, parts.hipCentre, pose.lean);
  const { area } = parts;
  // Rigid upper body; below the waist the garment trails with a slight shear
  // that is zero at the waist line, so the two halves meet without a seam.
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x - area.w, area.y - area.h, area.w * 3, parts.waist + 1 - (area.y - area.h));
  ctx.clip();
  blit(ctx, parts.torso);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x - area.w, parts.waist, area.w * 3, area.y + area.h * 2 - parts.waist);
  ctx.clip();
  ctx.transform(1, 0, pose.hem, 1, -pose.hem * parts.waist, 0);
  blit(ctx, parts.torso);
  ctx.restore();
  for (const arm of parts.arms) {
    ctx.save();
    at(ctx, arm.shoulder, pose.arms[arm.side] ?? 0);
    blit(ctx, arm.layer);
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}

export { solveGait };
