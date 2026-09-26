// Outdoor region registry (성장 P2: 뒷산, 숲 깊은 곳, 광산). The outdoor
// counterpart of lounge-venues.ts (which lists the table interiors): one entry
// per walkable region with its name, size, walls, exits and where you arrive,
// shared by the server (lounge-games.ts areas), the 3D region scene
// (lounge-area-3d.tsx) and the menus. Pure data plus a few helpers; a new
// region plugs in by adding an entry here.
//
// Coordinates are region-local world units: x to the right, z toward the
// camera, (0, 0) at the middle. The server keeps positions as 0–100 like every
// other area (regionToNetwork / regionFromNetwork).
import { makeWalkWorld, type WalkCollider, type WalkPoint, type WalkWorld } from './lounge-walk-world.ts';
import { MINE_ARRIVE, MINE_LIFT_AT, MINE_ROOM, mineFloor } from './lounge-mine.ts';

export type OutdoorArea = 'hill' | 'woods' | 'mine';
export const OUTDOOR_AREAS: readonly OutdoorArea[] = ['hill', 'woods', 'mine'];
export const isOutdoorArea = (a: unknown): a is OutdoorArea =>
  typeof a === 'string' && (OUTDOOR_AREAS as readonly string[]).includes(a);

/** Where an exit leads: the village, another region, or down the mine. */
export type ExitTo = 'village' | OutdoorArea;
export type RegionExit = {
  id: string;
  to: ExitTo;
  /** The exit's own spot (gate, cave mouth, ladder). */
  x: number;
  z: number;
  /** Where you stand to use it (E). */
  stand: WalkPoint;
  label: string;
  reach: number;
};
export type RegionLook = { ground: string; groundFar: string; fog: string; sky: string };
export type Region = {
  area: OutdoorArea;
  name: string;
  short: string;
  tagline: string;
  bounds: { w: number; d: number };
  colliders: readonly WalkCollider[];
  exits: readonly RegionExit[];
  /** Where you arrive, by where you came from. */
  arrive: Partial<Record<ExitTo, WalkPoint>>;
  look: RegionLook;
};

// ------------------------------------------------------------------ 뒷산
// A logging ridge north of the village: the trail comes up from the south,
// the bear cave (광산) is up in the north-east, the fallen log to 숲 깊은 곳
// blocks the west. Nodes (lounge-growth-data NODE_SPOTS 'hill') are not walls.
const HILL_W = 56,
  HILL_D = 40;
const hillColliders: WalkCollider[] = [
  // The ridge line behind the cave and big boulders.
  { shape: 'box', x: 16, z: -18.6, w: 9, d: 2.8 },
  { shape: 'circle', x: 11, z: -16.6, r: 1.3 },
  { shape: 'circle', x: 21.4, z: -16.2, r: 1.4 },
  { shape: 'circle', x: -9.5, z: -1, r: 1.2 },
  { shape: 'circle', x: 5, z: 9, r: 1 },
  { shape: 'circle', x: 25, z: -2, r: 1.1 },
  { shape: 'circle', x: -17, z: 15, r: 1.2 },
  { shape: 'circle', x: 14, z: 15.5, r: 1.1 },
  // The fallen log's roots on each side of the gap to 숲 깊은 곳.
  { shape: 'box', x: -27, z: -7.4, w: 3, d: 6.4 },
  { shape: 'box', x: -27, z: 3.4, w: 3, d: 6.4 },
];
/** The fallen log across the path west (a wall until the gate is cleared). */
export const HILL_LOG = { x: -26.6, z: -2, w: 1.4, d: 4.4 } as const;
export const HILL_CAVE = { x: 16, z: -16.4 } as const;

// ------------------------------------------------------------------ 숲 깊은 곳
const WOODS_W = 44,
  WOODS_D = 36;
const woodsColliders: WalkCollider[] = [
  { shape: 'circle', x: -6, z: -9, r: 1.4 },
  { shape: 'circle', x: 9, z: -4, r: 1.3 },
  { shape: 'circle', x: -10, z: 4, r: 1.2 },
  { shape: 'circle', x: 7, z: 12, r: 1.2 },
  { shape: 'circle', x: -18, z: -3, r: 1.1 },
  { shape: 'circle', x: 18, z: -12, r: 1.2 },
  { shape: 'circle', x: -1, z: 14, r: 1 },
];

export const REGIONS: Record<OutdoorArea, Region> = {
  hill: {
    area: 'hill',
    name: '뒷산',
    short: '뒷산',
    tagline: '나무꾼의 능선 · 곰바위 동굴',
    bounds: { w: HILL_W, d: HILL_D },
    colliders: hillColliders,
    exits: [
      { id: 'village', to: 'village', x: 0, z: HILL_D / 2 - 0.6, stand: { x: 0, z: HILL_D / 2 - 2 }, label: '마을로 내려가기', reach: 1.8 },
      { id: 'cave', to: 'mine', x: HILL_CAVE.x, z: HILL_CAVE.z, stand: { x: HILL_CAVE.x, z: HILL_CAVE.z + 2.6 }, label: '광산 들어가기', reach: 1.8 },
      { id: 'woods', to: 'woods', x: HILL_LOG.x, z: HILL_LOG.z, stand: { x: HILL_LOG.x + 2.1, z: HILL_LOG.z }, label: '숲 깊은 곳으로', reach: 1.9 },
    ],
    arrive: {
      village: { x: 0, z: HILL_D / 2 - 2.2 },
      mine: { x: HILL_CAVE.x, z: HILL_CAVE.z + 2.8 },
      woods: { x: HILL_LOG.x + 2.4, z: HILL_LOG.z },
    },
    look: { ground: '#7fa05a', groundFar: '#5f7f45', fog: '#c9dcc2', sky: '#bcd9e8' },
  },
  woods: {
    area: 'woods',
    name: '숲 깊은 곳',
    short: '깊은 숲',
    tagline: '오래된 그루터기 · 버섯 통나무',
    bounds: { w: WOODS_W, d: WOODS_D },
    colliders: woodsColliders,
    exits: [{ id: 'hill', to: 'hill', x: WOODS_W / 2 - 0.6, z: 0, stand: { x: WOODS_W / 2 - 2, z: 0 }, label: '뒷산으로 돌아가기', reach: 1.8 }],
    arrive: { hill: { x: WOODS_W / 2 - 2.4, z: 0 } },
    look: { ground: '#5d7d43', groundFar: '#3f5a31', fog: '#9fb79a', sky: '#8fb2a4' },
  },
  mine: {
    area: 'mine',
    name: '광산',
    short: '광산',
    tagline: '곰바위 아래 스무 층',
    bounds: { w: MINE_ROOM.w, d: MINE_ROOM.d },
    // Per floor: see mineColliders (pillars change every day).
    colliders: [],
    exits: [
      { id: 'up', to: 'hill', x: MINE_ARRIVE.x, z: MINE_ROOM.d / 2 - 0.4, stand: { ...MINE_ARRIVE }, label: '밖으로 나가기', reach: 1.4 },
    ],
    arrive: { hill: { ...MINE_ARRIVE }, mine: { ...MINE_ARRIVE } },
    look: { ground: '#5a4a3c', groundFar: '#3a2f27', fog: '#1d1712', sky: '#140f0b' },
  },
};

/** The village's north gate to 뒷산 (village coordinates, off every path). */
export const VILLAGE_GATE = { x: 12, z: -37.4, stand: { x: 12, z: -35.8 }, reach: 1.9 } as const;
export const villageGateDistance = (p: WalkPoint) => Math.hypot(p.x - VILLAGE_GATE.stand.x, p.z - VILLAGE_GATE.stand.z);

/** Walls of a region; the hill's log counts until 숲 깊은 곳 is opened. */
export function regionColliders(area: OutdoorArea, opts: { logCleared?: boolean; day?: number; floor?: number; lift?: boolean } = {}): WalkCollider[] {
  if (area === 'mine') {
    const f = mineFloor(opts.day ?? 0, Math.max(1, opts.floor ?? 1), !!opts.lift);
    return f.pillars.map((p) => ({ shape: 'circle' as const, x: p.x, z: p.z, r: p.r }));
  }
  const base = [...REGIONS[area].colliders];
  if (area === 'hill' && !opts.logCleared) base.push({ shape: 'box', ...HILL_LOG });
  return base;
}
export function regionWalk(area: OutdoorArea, opts: Parameters<typeof regionColliders>[1] = {}): WalkWorld {
  const b = REGIONS[area].bounds;
  return makeWalkWorld({ w: b.w, d: b.d, margin: area === 'mine' ? 0.6 : 0.8 }, regionColliders(area, opts));
}
/** The mine's lift cage (floors with the lift, and the entrance once 승강기 is built). */
export const MINE_LIFT = { ...MINE_LIFT_AT, reach: 1.5 } as const;

/** Region point → the server's 0–100 square (and back). */
export function regionToNetwork(area: OutdoorArea, p: WalkPoint) {
  const b = REGIONS[area].bounds;
  const c = (v: number) => Math.round(Math.max(0, Math.min(100, v)) * 100) / 100;
  return { x: c(((p.x + b.w / 2) / b.w) * 100), y: c(((p.z + b.d / 2) / b.d) * 100) };
}
export function regionFromNetwork(area: OutdoorArea, p: { x: number; y: number }): WalkPoint {
  const b = REGIONS[area].bounds;
  return { x: (p.x / 100) * b.w - b.w / 2, z: (p.y / 100) * b.d - b.d / 2 };
}
/** The nearest exit within reach of `p`. */
export function nearestExit(area: OutdoorArea, p: WalkPoint): (RegionExit & { distance: number }) | null {
  let best: (RegionExit & { distance: number }) | null = null;
  for (const e of REGIONS[area].exits) {
    const distance = Math.hypot(p.x - e.stand.x, p.z - e.stand.z);
    if (distance <= e.reach && (!best || distance < best.distance)) best = { ...e, distance };
  }
  return best;
}
