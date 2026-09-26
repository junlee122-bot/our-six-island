// "범타듀의 하루" in the village: where each friend's farm bed, the fruit
// trees, the market stall and the mailboxes are, the deterministic wandering
// schedule of offline friends' NPCs, and the KST day/night palette.
// Pure (no three.js / DOM) so the schedule and lighting are testable and every
// client computes the same thing from the same clock.
import {
  PLOT_GAP,
  PLOT_SIZE,
  VILLAGE_DECOR,
  VILLAGE_FARMLAND,
  VILLAGE_MARKET,
  VILLAGE_ORCHARD,
  VILLAGE_PLACES,
  VILLAGE_YARDS,
  villageCanWalk,
  villagePath,
  villageYard,
  yardPlotCenter,
  type VillagePoint,
} from './lounge-village-layout.ts';
import type { Crop, LifeView } from './lounge-life.ts';

/* ------------------------------------------------------------ farm beds */

export { PLOT_SIZE, PLOT_GAP } from './lounge-village-layout.ts';
/**
 * One bed frame of a friend's front-yard farm (VILL-2). Every friend has two:
 * `part` 0 is the front bed (plots 0–5), 1 the back bed (plots 6–11, fallow
 * until the farm is expanded to 9 / 12). Geometry: VILLAGE_YARDS.
 */
export type FarmBed = {
  actor: number;
  part: 0 | 1;
  x: number;
  z: number;
  w: number;
  d: number;
  cols: 3;
};
export const FARM_BEDS: readonly FarmBed[] = VILLAGE_YARDS.flatMap((yard) =>
  yard.beds.map(
    (bed, part): FarmBed => ({ actor: yard.actor, part: part as 0 | 1, x: bed.x, z: bed.z, w: bed.w, d: bed.d, cols: 3 }),
  ),
);
/** A friend's front bed (plots 0–5): where "go to my farm" leads. */
export const farmBed = (actor: number) =>
  FARM_BEDS.find((bed) => bed.actor === actor && bed.part === 0) ?? null;
export const farmBeds = (actor: number) => FARM_BEDS.filter((bed) => bed.actor === actor);

export function farmBedRect(bed: FarmBed) {
  return { x: bed.x, z: bed.z, w: bed.w, d: bed.d };
}
/**
 * Centre of plot `index` (0–11) of `bed.actor`'s farm. Plots 0–5 fill the
 * front bed, 6–11 the back bed; every plot keeps its full size, so 9 and 12
 * plots never overlap. `scale` is kept for callers (always 1).
 */
export function plotCenterIn(bed: FarmBed, index: number, _total = 6) {
  const yard = villageYard(bed.actor);
  const at = yard ? yardPlotCenter(yard, index) : { x: bed.x, z: bed.z };
  return { ...at, scale: 1 };
}
/** Centre of plot `index` (0–11), row-major from the back-left of each bed. */
export function plotCenter(bed: FarmBed, index: number): VillagePoint {
  const { x, z } = plotCenterIn(bed, index);
  return { x, z };
}
/** Which friend's plot (if any) lies under a ground point (hover / click). */
export function plotAt(point: VillagePoint): { actor: number; index: number } | null {
  const half = PLOT_SIZE / 2 + PLOT_GAP / 2;
  for (const yard of VILLAGE_YARDS)
    for (const [part, bed] of yard.beds.entries()) {
      if (Math.abs(point.x - bed.x) > bed.w / 2 || Math.abs(point.z - bed.z) > bed.d / 2) continue;
      for (let i = part * 6; i < part * 6 + 6; i++) {
        const c = yardPlotCenter(yard, i);
        if (Math.abs(point.x - c.x) <= half && Math.abs(point.z - c.z) <= half)
          return { actor: yard.actor, index: i };
      }
    }
  return null;
}

/** Distance from a point to an axis-aligned rectangle (0 inside). */
function rectDistance(
  point: VillagePoint,
  r: { x: number; z: number; w: number; d: number },
) {
  const dx = Math.max(0, Math.abs(point.x - r.x) - r.w / 2),
    dz = Math.max(0, Math.abs(point.z - r.z) - r.d / 2);
  return Math.hypot(dx, dz);
}

/** Nearest walkable ground to `target` (small spiral search). */
export function walkableNear(target: VillagePoint): VillagePoint {
  if (villageCanWalk(target)) return { ...target };
  for (let r = 0.3; r <= 4; r += 0.3)
    for (let a = 0; a < 16; a++) {
      const angle = (a / 16) * Math.PI * 2 + Math.PI / 2;
      const p = {
        x: Math.round((target.x + Math.cos(angle) * r) * 100) / 100,
        z: Math.round((target.z + Math.sin(angle) * r) * 100) / 100,
      };
      if (villageCanWalk(p)) return p;
    }
  return { ...target };
}

/** The walkable spot just in front (+z) of a bed where you tend it. */
export function farmFront(bed: FarmBed): VillagePoint {
  const r = farmBedRect(bed);
  return walkableNear({ x: bed.x, z: bed.z + r.d / 2 + 0.55 });
}

export const FARM_REACH = 1.3;
/** Distance from `point` to the nearer of `actor`'s two bed frames (Infinity if none). */
export function farmDistance(point: VillagePoint, actor: number) {
  const yard = villageYard(actor);
  if (!yard) return Infinity;
  return Math.min(...yard.beds.map((bed) => rectDistance(point, bed)));
}
export function nearFarm(point: VillagePoint, actor: number, reach = FARM_REACH) {
  return farmDistance(point, actor) <= reach;
}
/** The friend whose yard `point` stands in (null outside every yard). */
export function yardOwnerAt(point: VillagePoint): number | null {
  for (const yard of VILLAGE_YARDS)
    if (point.x >= yard.x0 && point.x <= yard.x1 && point.z >= yard.z0 && point.z <= yard.z1 + 0.2) return yard.actor;
  return null;
}

/**
 * The big fenced field beside the plaza is the village's shared garden (a
 * decoration). Standing by it shows a sign that points to your own plots.
 */
export const COMMONS_REACH = 1.2;
export const commonsDistance = (point: VillagePoint) =>
  rectDistance(point, {
    x: VILLAGE_FARMLAND.x,
    z: VILLAGE_FARMLAND.z,
    w: VILLAGE_FARMLAND.width,
    d: VILLAGE_FARMLAND.depth,
  });
export const nearCommons = (point: VillagePoint, reach = COMMONS_REACH) =>
  commonsDistance(point) <= reach;

/* ------------------------------------------------------------ fruit trees */

/** FRUIT_TREES ids ('tree-1'…'tree-6') → the orchard trees they stand for. */
export const FRUIT_TREE_ORCHARD: Record<string, number> = {
  'tree-1': 4,
  'tree-2': 0,
  'tree-3': 3,
  'tree-4': 5,
  'tree-5': 6,
  'tree-6': 7,
};
export const FRUIT_TREE_POINTS: Record<string, VillagePoint> =
  Object.fromEntries(
    Object.entries(FRUIT_TREE_ORCHARD).map(([id, i]) => [
      id,
      { ...VILLAGE_ORCHARD[i] },
    ]),
  );
export const TREE_REACH = 2.1;
export function nearestFruitTree(point: VillagePoint, reach = TREE_REACH) {
  let best: { id: string; distance: number } | null = null;
  for (const [id, p] of Object.entries(FRUIT_TREE_POINTS)) {
    const distance = Math.hypot(point.x - p.x, point.z - p.z);
    if (distance <= reach && (!best || distance < best.distance))
      best = { id, distance };
  }
  return best;
}

/* ------------------------------------------------------------ market, mail */

export const MARKET_REACH = 1.6;
export const marketDistance = (point: VillagePoint) =>
  rectDistance(point, {
    x: VILLAGE_MARKET.x,
    z: VILLAGE_MARKET.z,
    w: VILLAGE_MARKET.width,
    d: VILLAGE_MARKET.depth,
  });
export const nearMarket = (point: VillagePoint, reach = MARKET_REACH) =>
  marketDistance(point) <= reach;

export function mailboxPoint(actor: number): VillagePoint | null {
  const item = VILLAGE_DECOR.find((d) => d.id === `mailbox-${actor}`);
  return item ? { x: item.x, z: item.z } : null;
}
export const MAILBOX_REACH = 1.25;
export function mailboxDistance(point: VillagePoint, actor: number) {
  const m = mailboxPoint(actor);
  return m ? Math.hypot(point.x - m.x, point.z - m.z) : Infinity;
}
export function nearMailbox(point: VillagePoint, actor: number) {
  return mailboxDistance(point, actor) <= MAILBOX_REACH;
}

/* ------------------------------------------------------------ plot stages */

export type PublicPlot = { crop: Crop | null; stage: 0 | 1 | 2 | 3 };
/**
 * Plots to draw in front of `actor`'s home. My own farm comes from `me.farm`
 * (fresher, includes timers); friends' from `housesPlotsPublic` via the
 * uid → actor map. Always 6 entries (empty plots when unknown).
 */
export function plotsForActor(
  life: LifeView | null | undefined,
  actor: number,
  selfActor: number,
): PublicPlot[] {
  const empty = (): PublicPlot[] =>
    Array.from({ length: 6 }, () => ({ crop: null, stage: 0 as const }));
  if (!life) return empty();
  let source: PublicPlot[] | undefined;
  if (actor === selfActor && life.me?.farm?.length)
    source = life.me.farm.map((p) => ({ crop: p.crop, stage: p.stage }));
  else {
    const uid = Object.entries(life.actors ?? {}).find(
      ([, a]) => a === actor,
    )?.[0];
    source = uid ? life.housesPlotsPublic?.[uid] : undefined;
  }
  // Expanded farms (life expansion) have 9 or 12 plots.
  const out = empty();
  for (let i = 6; i < Math.min(12, source?.length ?? 0); i++) out.push({ crop: null, stage: 0 });
  source?.slice(0, 12).forEach((p, i) => {
    const stage = Math.max(0, Math.min(3, Math.floor(Number(p.stage) || 0)));
    out[i] = { crop: p.crop ?? null, stage: (p.crop ? stage : 0) as 0 | 1 | 2 | 3 };
  });
  return out;
}

/** Visual recipe for a crop at a stage (used by the 3D builder). */
export function cropVisual(crop: Crop | null, stage: number) {
  if (!crop) return null;
  const s = Math.max(0, Math.min(3, stage));
  return {
    /** Leaf height in world units. */
    height: [0.1, 0.22, 0.34, 0.42][s],
    leaves: [2, 3, 5, 6][s],
    /** Only ripe plants show their produce. */
    fruit: s === 3,
    /** A seed mound for the first stage. */
    mound: s === 0,
  };
}

/* ------------------------------------------------------------ NPC schedule */

export const NPC_SLOT_MS = 80_000;
export const NPC_SPEED = 1.7;
const pathCache = new Map<string, VillagePoint[]>();
const waypointCache = new Map<number, VillagePoint[]>();

/** Village camera direction (ground → camera), matches CAMERA_OFFSET in lounge-village.tsx. */
const VIEW = (() => {
  const x = 34,
    y = 43,
    z = 52,
    l = Math.hypot(x, y, z);
  return { x: x / l, y: y / l, z: z / l };
})();
/** Roof height used for the occlusion check (houses and the plaza buildings). */
const ROOF_HEIGHT = 4.6;
/**
 * True when a figure standing at `point` would be hidden behind a building
 * from the village camera: the line of sight from its head (≈1.5 up) toward
 * the camera passes through a building's footprint (with roof overhang)
 * below the roof height.
 */
export function villageOccluded(point: VillagePoint, head = 1.5) {
  const tMax = (ROOF_HEIGHT - head) / VIEW.y;
  for (const place of VILLAGE_PLACES) {
    const hw = place.width / 2 + 0.9,
      hd = place.depth / 2 + 0.9;
    // Slab test of the ray segment against the footprint rectangle.
    let t0 = 0,
      t1 = tMax;
    for (const [p, d, lo, hi] of [
      [point.x, VIEW.x, place.x - hw, place.x + hw],
      [point.z, VIEW.z, place.z - hd, place.z + hd],
    ] as const) {
      const a = (lo - p) / d,
        b = (hi - p) / d;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    }
    if (t0 < t1 && t1 > 0.05) return true;
  }
  return false;
}
/** The nearest walkable point to `target` that the camera can see. */
export function visibleNear(target: VillagePoint): VillagePoint {
  const start = walkableNear(target);
  if (!villageOccluded(start)) return start;
  for (let r = 0.4; r <= 5; r += 0.4)
    for (let a = 0; a < 16; a++) {
      const angle = (a / 16) * Math.PI * 2 + Math.PI / 4;
      const p = {
        x: Math.round((target.x + Math.cos(angle) * r) * 100) / 100,
        z: Math.round((target.z + Math.sin(angle) * r) * 100) / 100,
      };
      if (villageCanWalk(p) && !villageOccluded(p)) return p;
    }
  return start;
}

/** House front, the plaza benches and the friend's own farm. */
export function npcWaypoints(actor: number): VillagePoint[] {
  const cached = waypointCache.get(actor);
  if (cached) return cached;
  const place = VILLAGE_PLACES.find((p) => p.actor === actor);
  const home = place
    ? visibleNear({ x: place.entry.x + 1.3, z: place.entry.z + 0.5 })
    : visibleNear({ x: 0, z: 8 });
  const bed = farmBed(actor);
  const benchWest = visibleNear({ x: -3.3, z: -0.6 }),
    benchEast = visibleNear({ x: 3.3, z: 0.6 });
  // Alternate benches so two NPCs rarely share one.
  const bench = actor % 2 ? benchEast : benchWest;
  const plaza = visibleNear({ x: (actor - 3) * 1.4, z: 6.2 });
  // Tending their farm, NPCs stand where the camera can see them (a bed
  // tucked beside 분장실 would otherwise hide them under its roof).
  const list = [home, bench, bed ? visibleNear(farmFront(bed)) : plaza, plaza];
  waypointCache.set(actor, list);
  return list;
}

/** Deterministic 32-bit hash of two integers (murmur3 finalizer mix). */
function hash(a: number, b: number) {
  let h = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca6b)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
/**
 * Waypoint index for a slot. Even slots go to home or farm, odd slots to the
 * bench or the plaza, so consecutive slots never pick the same place.
 */
export function npcTargetIndex(actor: number, slot: number): number {
  const pick = hash(actor + 1, slot) % 2;
  return ((slot % 2) + 2) % 2 === 0 ? (pick ? 2 : 0) : pick ? 3 : 1;
}

function routeBetween(actor: number, a: number, b: number) {
  const key = `${actor}:${a}:${b}`;
  let route = pathCache.get(key);
  if (!route) {
    const points = npcWaypoints(actor);
    route = [points[a], ...villagePath(points[a], points[b])];
    if (route.length === 1) route.push(points[b]);
    pathCache.set(key, route);
  }
  return route;
}

export type NpcPose = {
  point: VillagePoint;
  walking: boolean;
  /** Screen-horizontal direction of travel (+1 right, -1 left, 0 idle). */
  heading: number;
  /** Index into npcWaypoints where the NPC is heading. */
  target: number;
};
/**
 * Where an offline friend's NPC is at time `t` (ms since epoch). Every slot of
 * NPC_SLOT_MS the NPC slowly walks to the slot's waypoint along the village
 * path grid, then rests there. Slots are offset per friend.
 */
export function npcPose(actor: number, t: number): NpcPose {
  const shifted = t + actor * 11_317;
  const slot = Math.floor(shifted / NPC_SLOT_MS);
  const from = npcTargetIndex(actor, slot - 1),
    to = npcTargetIndex(actor, slot);
  const route = routeBetween(actor, from, to);
  let distance = ((shifted - slot * NPC_SLOT_MS) / 1000) * NPC_SPEED;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1],
      b = route[i],
      length = Math.hypot(b.x - a.x, b.z - a.z);
    if (distance <= length && length > 0) {
      const k = distance / length;
      const dx = b.x - a.x,
        dz = b.z - a.z;
      return {
        point: { x: a.x + dx * k, z: a.z + dz * k },
        walking: true,
        heading: Math.sign(dx * 0.837 - dz * 0.547),
        target: to,
      };
    }
    distance -= length;
  }
  const end = route[route.length - 1];
  return { point: { ...end }, walking: false, heading: 0, target: to };
}

export const NPC_TALK_REACH = 1.6;
export const NPC_DEFAULT_LINES = [
  '오늘 날씨 좋다! 텃밭에 물 줬어?',
  '광장 벤치에 앉아 있으면 시간 가는 줄 몰라.',
  '상점에 새 씨앗 들어왔대.',
  '이따 회관에서 한 판 할래?',
  '우편함 한번 열어 봐!',
];
export function npcLine(
  actor: number,
  status: string | null | undefined,
  t: number,
) {
  const text = status?.trim();
  if (text) return text;
  return NPC_DEFAULT_LINES[hash(actor, Math.floor(t / 3_600_000)) % NPC_DEFAULT_LINES.length];
}

/* ------------------------------------------------------------ day / night */

export type DayPhase = 'morning' | 'day' | 'evening' | 'night';
export const KST_OFFSET_MS = 9 * 3_600_000;
/** Hours (0..24, fractional) on the KST clock. */
export const kstHour = (t: number) =>
  ((((t + KST_OFFSET_MS) % 86_400_000) + 86_400_000) % 86_400_000) / 3_600_000;
export function dayPhase(t: number): DayPhase {
  const h = kstHour(t);
  if (h >= 5 && h < 9) return 'morning';
  if (h >= 9 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'evening';
  return 'night';
}

type Palette = {
  sky: string;
  sun: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  exposure: number;
  /** 0 = lamps off, 1 = fully lit. */
  lamps: number;
  /** Sun elevation 0..1 (moves the light). */
  elevation: number;
};
export const DAY_PALETTES: Record<DayPhase, Palette> = {
  morning: {
    sky: '#f6e3c8',
    sun: '#ffe2b8',
    sunIntensity: 2.4,
    hemiSky: '#ffeccd',
    hemiGround: '#8a9270',
    hemiIntensity: 2.0,
    exposure: 1.08,
    lamps: 0.15,
    elevation: 0.55,
  },
  day: {
    sky: '#eef0d8',
    sun: '#fff3d3',
    sunIntensity: 3.0,
    hemiSky: '#fff4d9',
    hemiGround: '#81936d',
    hemiIntensity: 2.25,
    exposure: 1.12,
    lamps: 0,
    elevation: 1,
  },
  evening: {
    sky: '#f0c7a0',
    sun: '#ffb27a',
    sunIntensity: 2.0,
    hemiSky: '#ffd1a8',
    hemiGround: '#6f6a58',
    hemiIntensity: 1.6,
    exposure: 1.02,
    lamps: 0.75,
    elevation: 0.35,
  },
  night: {
    sky: '#27304a',
    sun: '#9fb4ff',
    sunIntensity: 0.75,
    hemiSky: '#7084c0',
    hemiGround: '#343a4c',
    hemiIntensity: 1.2,
    exposure: 0.95,
    lamps: 1,
    elevation: 0.7,
  },
};
/** Phase centres in KST hours; lighting blends linearly between them. */
const KEYS: [number, DayPhase][] = [
  [3, 'night'],
  [7, 'morning'],
  [13, 'day'],
  [18.5, 'evening'],
  [22, 'night'],
  [27, 'night'],
  [31, 'morning'],
];
const hex = (s: string) => parseInt(s.slice(1), 16);
function mixColor(a: string, b: string, k: number) {
  const x = hex(a),
    y = hex(b);
  const ch = (shift: number) =>
    Math.round(((x >> shift) & 255) * (1 - k) + ((y >> shift) & 255) * k);
  return (
    '#' +
    ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')
  );
}
/**
 * Continuous lighting for time `t`: blends the neighbouring phase palettes so
 * the change is smooth across the day. `phase` is the discrete label.
 */
export function dayLighting(t: number): Palette & { phase: DayPhase } {
  let h = kstHour(t);
  if (h < KEYS[0][0]) h += 24;
  let i = 0;
  while (i < KEYS.length - 2 && h >= KEYS[i + 1][0]) i++;
  const [h0, p0] = KEYS[i],
    [h1, p1] = KEYS[i + 1];
  const raw = h1 > h0 ? (h - h0) / (h1 - h0) : 0;
  // Hold each palette near its centre and ease the middle of the gap.
  const k = Math.min(1, Math.max(0, (raw - 0.25) / 0.5));
  const e = k * k * (3 - 2 * k);
  const a = DAY_PALETTES[p0],
    b = DAY_PALETTES[p1];
  const num = (x: number, y: number) => x + (y - x) * e;
  return {
    phase: dayPhase(t),
    sky: mixColor(a.sky, b.sky, e),
    sun: mixColor(a.sun, b.sun, e),
    sunIntensity: num(a.sunIntensity, b.sunIntensity),
    hemiSky: mixColor(a.hemiSky, b.hemiSky, e),
    hemiGround: mixColor(a.hemiGround, b.hemiGround, e),
    hemiIntensity: num(a.hemiIntensity, b.hemiIntensity),
    exposure: num(a.exposure, b.exposure),
    lamps: num(a.lamps, b.lamps),
    elevation: num(a.elevation, b.elevation),
  };
}
export const DAY_PHASE_LABEL: Record<DayPhase, string> = {
  morning: '상쾌한 아침',
  day: '산책하기 좋은 낮',
  evening: '노을 지는 저녁',
  night: '별이 뜬 밤',
};
