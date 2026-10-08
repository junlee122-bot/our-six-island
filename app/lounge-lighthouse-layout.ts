// 범마을 등대's two floors (lounge-lighthouse.ts): pure geometry shared by the
// server (areas), the 3D rooms (lounge-lighthouse-interior.ts), the flat
// screen, the cursor and the tests.
//
// Coordinates as in the other rooms (lounge-shop-interiors.ts): furniture in
// room world units, players in network units (x 15–85, y 42–88), network =
// world / 0.2 + (50, 65). 1층 keeps the shared door on the left wall (back out
// to the harbor). Both floors have the spiral stair in the same corner (back
// right): walk into its stairwell or press E at its foot to change floors.
// The lamp room has no door: its left wall is solid.
import { walksInto, type Doorway } from './lounge-map-doors.ts';
import type { LighthouseArea } from './lounge-lighthouse.ts';

type World = { x: number; z: number };
type Net = { x: number; y: number };
const toNet = (p: World): Net => ({ x: Math.round((p.x * 5 + 50) * 100) / 100, y: Math.round((p.z * 5 + 65) * 100) / 100 });
export const lighthouseWorld = (p: Net): World => ({ x: (p.x - 50) * 0.2, z: (p.y - 65) * 0.2 });

/** Models the rooms place (all already credited in ATTRIBUTION.md). */
export type LighthouseModel = 'stove' | 'storageShelf' | 'barrelRack' | 'firewood' | 'onggi' | 'hanjiLantern' | 'produceCrate' | 'keg';

/**
 * One piece of furniture: a model fitted into its box without stretching, or
 * a plain box in `color` (`model: null`). `solid: false` pieces (against the
 * back wall, on the desk) never block walking.
 */
export type LighthouseItem = {
  id: string;
  model: LighthouseModel | null;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  turn?: number;
  y?: number;
  solid?: boolean;
  color?: string;
};

/** The spiral stair (both floors, the same corner): its column and where you stand at its foot. */
export const LIGHTHOUSE_STAIR = { x: 5.3, z: -2.9, r: 1.35 } as const;
/** The stair's foot (network units): E here climbs; walking on into the stairwell does too. */
export const STAIR_FRONT: Net = toNet({ x: 3.7, z: -1.3 });
export const STAIR_REACH = 4.2;
/** The stairwell as a doorway (lounge-map-doors.ts): from its foot toward the column. */
export const STAIR_DOORWAY: Doorway = { ...toNetXZ(LIGHTHOUSE_STAIR), stand: { x: STAIR_FRONT.x, z: STAIR_FRONT.y }, reach: 2.6 };
function toNetXZ(p: World) {
  const n = toNet(p);
  return { x: n.x, z: n.y };
}

/** 1층: the logbook desk (등대 일지) and where you stand to read it. */
export const LOGBOOK_DESK = { x: -3.2, z: -3.95, w: 2.2, d: 0.95, h: 0.8 } as const;
export const LOGBOOK_FRONT: Net = toNet({ x: -3.2, z: -2.55 });
export const LOGBOOK_REACH = 5;
/** 등명실: the big lamp in the middle and its front. */
export const LIGHTHOUSE_LAMP = { x: 0, z: -2.5, r: 1.15 } as const;
export const LAMP_FRONT: Net = toNet({ x: 0, z: -0.6 });
export const LAMP_REACH = 4.5;
/** 등명실: the balcony (front strip of the floor) and its rail; 바다 바라보기 at the rail. */
export const BALCONY = { z0: 2.4, rail: 4.95 } as const;
export const BALCONY_FRONT: Net = toNet({ x: 0, z: 4.1 });
export const BALCONY_REACH = 9;

/** 1층: the keeper's room. */
const GROUND_ITEMS: readonly LighthouseItem[] = [
  // The logbook desk with the open book, an ink pot and a lamp on it, a chair behind.
  { id: 'desk', model: null, ...LOGBOOK_DESK, color: '#7a5634' },
  { id: 'book', model: null, x: -3.35, z: -3.95, w: 0.7, h: 0.05, d: 0.48, y: 0.8, solid: false, color: '#f3ead2' },
  { id: 'book-cover', model: null, x: -3.35, z: -3.95, w: 0.78, h: 0.03, d: 0.54, y: 0.79, solid: false, color: '#2f4a6a' },
  { id: 'ink', model: null, x: -2.55, z: -4.1, w: 0.12, h: 0.12, d: 0.12, y: 0.8, solid: false, color: '#1f2a3a' },
  { id: 'desk-lamp', model: 'hanjiLantern', x: -4.0, z: -4.15, w: 0.34, h: 0.5, d: 0.34, y: 0.8, solid: false },
  { id: 'chair', model: null, x: -3.2, z: -5.0, w: 0.6, h: 0.5, d: 0.5, solid: false, color: '#5e4027' },
  // Logbooks of years past on a shelf by the desk.
  { id: 'shelf', model: 'storageShelf', x: -6.3, z: -5.35, w: 1.5, h: 1.9, d: 0.6, solid: false },
  // The stove against the left wall (clear of the door), firewood beside it.
  { id: 'stove', model: 'stove', x: -6.75, z: -2.1, w: 1.0, h: 1.1, d: 0.9 },
  { id: 'firewood', model: 'firewood', x: -6.7, z: -0.6, w: 1.0, h: 0.5, d: 0.6, turn: Math.PI / 2 },
  // Under the coat hooks: a bench and boots.
  { id: 'bench', model: null, x: 1.4, z: -5.45, w: 2.2, h: 0.42, d: 0.5, solid: false, color: '#8a6440' },
  { id: 'boot-1', model: null, x: 0.75, z: -5.0, w: 0.18, h: 0.34, d: 0.3, solid: false, color: '#2e3a2c' },
  { id: 'boot-2', model: null, x: 1.0, z: -5.0, w: 0.18, h: 0.34, d: 0.3, solid: false, color: '#2e3a2c' },
  // A rope coil, an oil drum and a crate of spare lenses on the right.
  { id: 'barrel', model: 'barrelRack', x: 7.0, z: 1.4, w: 1.1, h: 1.0, d: 0.7, turn: -Math.PI / 2 },
  { id: 'crate', model: 'produceCrate', x: 6.9, z: 3.6, w: 0.9, h: 0.5, d: 0.7 },
  { id: 'rope', model: null, x: 5.6, z: 4.1, w: 0.8, h: 0.18, d: 0.8, color: '#c9a66b' },
  // A small round table with two cups by the stove.
  { id: 'tea-table', model: null, x: -4.0, z: 1.8, w: 0.9, h: 0.6, d: 0.9, color: '#8e6540' },
];

/** 등명실: the lamp room. */
const TOP_ITEMS: readonly LighthouseItem[] = [
  // Spare oil, a tool chest and a stool along the walls.
  { id: 'oil', model: 'keg', x: -6.8, z: -4.9, w: 0.8, h: 0.9, d: 0.7, solid: false },
  { id: 'toolchest', model: null, x: -5.6, z: -5.3, w: 1.2, h: 0.6, d: 0.6, solid: false, color: '#8e2f2f' },
  { id: 'stool', model: null, x: -5.4, z: 0.6, w: 0.5, h: 0.45, d: 0.5, color: '#7a5634' },
  { id: 'jar', model: 'onggi', x: 6.9, z: 1.2, w: 0.7, h: 0.8, d: 0.7 },
];

export const LIGHTHOUSE_ITEMS: Record<LighthouseArea, readonly LighthouseItem[]> = {
  lighthouse: GROUND_ITEMS,
  lighthouseTop: TOP_ITEMS,
};
/** Wall signs (text on the back wall). */
export const LIGHTHOUSE_SIGNS: Record<LighthouseArea, readonly { text: string; x: number; y: number; w: number }[]> = {
  lighthouse: [{ text: '등대 일지', x: -3.2, y: 1.72, w: 1.5 }],
  lighthouseTop: [{ text: '등명실', x: 4.6, y: 3.05, w: 1.3 }],
};

/** What blocks walking (network units): boxes around solid furniture, the stair and the lamp as circles. */
export type LighthouseObstacle = { id: string; x: number; y: number } & ({ rx: number; ry: number } | { r: number });
function obstaclesOf(area: LighthouseArea): LighthouseObstacle[] {
  const out: LighthouseObstacle[] = LIGHTHOUSE_ITEMS[area]
    .filter((it) => it.solid !== false)
    .map((it) => {
      const c = Math.abs(Math.cos(it.turn ?? 0)),
        s = Math.abs(Math.sin(it.turn ?? 0));
      const n = toNet(it);
      return { id: it.id, x: n.x, y: n.y, rx: (it.w * c + it.d * s) * 2.5 + 0.2, ry: (it.w * s + it.d * c) * 2.5 + 0.2 };
    });
  out.push({ id: 'stair', ...toNet(LIGHTHOUSE_STAIR), r: LIGHTHOUSE_STAIR.r * 5 });
  if (area === 'lighthouseTop') out.push({ id: 'lamp', ...toNet(LIGHTHOUSE_LAMP), r: LIGHTHOUSE_LAMP.r * 5 });
  return out;
}
export const LIGHTHOUSE_OBSTACLES: Record<LighthouseArea, readonly LighthouseObstacle[]> = {
  lighthouse: obstaclesOf('lighthouse'),
  lighthouseTop: obstaclesOf('lighthouseTop'),
};

/** Whether a player (radius in network units) can stand at `p`. */
export function lighthouseCanWalk(p: Net, area: LighthouseArea, radius = 2.2): boolean {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  return !LIGHTHOUSE_OBSTACLES[area].some((o) =>
    'r' in o ? Math.hypot(p.x - o.x, p.y - o.y) < o.r + radius * 0.8 : Math.abs(p.x - o.x) < o.rx + radius && Math.abs(p.y - o.y) < o.ry + radius,
  );
}

const near = (p: Net, q: Net, reach: number) => Number.isFinite(p.x) && Number.isFinite(p.y) && Math.hypot(p.x - q.x, p.y - q.y) <= reach;
export const nearStair = (p: Net) => near(p, STAIR_FRONT, STAIR_REACH);
export const nearLogbook = (p: Net, area: string) => area === 'lighthouse' && near(p, LOGBOOK_FRONT, LOGBOOK_REACH);
export const nearLamp = (p: Net, area: string) => area === 'lighthouseTop' && near(p, LAMP_FRONT, LAMP_REACH);
/** At the balcony rail: the front strip of the lamp room. */
export const nearBalcony = (p: Net, area: string) =>
  area === 'lighthouseTop' && Number.isFinite(p.x) && p.y >= BALCONY_FRONT.y - 4 && Math.abs(p.x - BALCONY_FRONT.x) <= BALCONY_REACH;

/** Walking on into the stairwell from its foot (keys or a step): take the stair. */
export const walksIntoStair = (p: Net, move: Net) => walksInto({ x: p.x, z: p.y }, { x: move.x, z: move.y }, STAIR_DOORWAY);

/**
 * Where you arrive on a floor by the stair: a step out from its foot, past the
 * stair's reach (so the stair does not take you straight back).
 */
export function stairArrival(area: LighthouseArea): Net {
  void area;
  return { x: Math.round((STAIR_FRONT.x - 4.6) * 100) / 100, y: Math.round((STAIR_FRONT.y + 3.4) * 100) / 100 };
}

export type LighthouseTouch = { kind: 'stair'; to: LighthouseArea } | { kind: 'logbook' } | { kind: 'lamp' } | { kind: 'seaView' };
/** What E offers here on the lighthouse floors (null: nothing of the lighthouse's own). */
export function lighthouseTouch(p: Net, area: LighthouseArea): LighthouseTouch | null {
  if (nearStair(p)) return { kind: 'stair', to: area === 'lighthouse' ? 'lighthouseTop' : 'lighthouse' };
  if (nearLogbook(p, area)) return { kind: 'logbook' };
  if (nearLamp(p, area)) return { kind: 'lamp' };
  if (nearBalcony(p, area)) return { kind: 'seaView' };
  return null;
}
/** What the cursor points at on the floor (network units), and where to walk for it. */
export function lighthouseHover(p: Net, area: LighthouseArea): { touch: LighthouseTouch; go: Net } | null {
  const stair = toNet(LIGHTHOUSE_STAIR);
  if (Math.hypot(p.x - stair.x, p.y - stair.y) <= LIGHTHOUSE_STAIR.r * 5 + 1)
    return { touch: { kind: 'stair', to: area === 'lighthouse' ? 'lighthouseTop' : 'lighthouse' }, go: { ...STAIR_FRONT } };
  if (area === 'lighthouse') {
    const d = toNet(LOGBOOK_DESK);
    if (Math.abs(p.x - d.x) <= LOGBOOK_DESK.w * 2.5 + 1 && p.y <= d.y + LOGBOOK_DESK.d * 2.5 + 1) return { touch: { kind: 'logbook' }, go: { ...LOGBOOK_FRONT } };
    return null;
  }
  const lamp = toNet(LIGHTHOUSE_LAMP);
  if (Math.hypot(p.x - lamp.x, p.y - lamp.y) <= LIGHTHOUSE_LAMP.r * 5 + 1) return { touch: { kind: 'lamp' }, go: { ...LAMP_FRONT } };
  // The rail itself (past the walkable floor): walk to it and look out.
  if (p.y >= 88.5) return { touch: { kind: 'seaView' }, go: { x: Math.max(18, Math.min(82, p.x)), y: BALCONY_FRONT.y } };
  return null;
}
/** Corner spots around the stair and the lamp (for walking around them). */
export function lighthouseWaypoints(area: LighthouseArea): Net[] {
  const out: Net[] = [];
  for (const o of LIGHTHOUSE_OBSTACLES[area]) {
    if ('r' in o)
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        out.push({ x: o.x + (o.r + 3.4) * Math.cos(a), y: o.y + (o.r + 3.4) * Math.sin(a) });
      }
    else for (const sx of [-1, 1]) for (const sy of [-1, 1]) out.push({ x: o.x + sx * (o.rx + 3.2), y: o.y + sy * (o.ry + 3.2) });
  }
  return out;
}
