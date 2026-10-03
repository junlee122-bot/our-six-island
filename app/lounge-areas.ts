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
import { MARKET_ARRIVE, MARKET_COLLIDERS, MARKET_D, MARKET_EXIT, MARKET_W } from './lounge-market-layout.ts';
import { HARBOR_ARRIVE, HARBOR_COLLIDERS, HARBOR_D, HARBOR_EXIT, HARBOR_W } from './lounge-harbor-layout.ts';
import { HILLSIDE_ARRIVE, HILLSIDE_COLLIDERS, HILLSIDE_D, HILLSIDE_EXIT, HILLSIDE_W } from './lounge-hillside-layout.ts';
import { RANCH_ARRIVE, RANCH_COLLIDERS, RANCH_D, RANCH_EXIT, RANCH_W } from './lounge-ranch-layout.ts';
import { FARM_ARRIVE, FARM_COLLIDERS, FARM_D, FARM_EXIT, FARM_W } from './lounge-farm-layout.ts';
import { FOOTHILL_ARRIVE, FOOTHILL_COLLIDERS, FOOTHILL_D, FOOTHILL_EXIT, FOOTHILL_MINE, FOOTHILL_MINE_ARRIVE, FOOTHILL_W } from './lounge-foothill-layout.ts';
import { DISTRICTS, type DistrictId } from './lounge-districts.ts';
import { DECK_D, DECK_W } from './lounge-voyage-data.ts';
import { arrivalPoint } from './lounge-map-doors.ts';

/**
 * 'market' is ① 시장 거리, 'harbor' ② 항구 구역, 'hillside' ③ 언덕 주택가,
 * 'ranch' ④ 목장·과수원 and 'foothill' ⑤ 산기슭 마을 — districts around the
 * hub (lounge-districts.ts): separate maps behind gates on the hub's rim.
 * 'farm' is 우리 농장, the friends' houses and fields behind the north gate.
 */
export type OutdoorArea = 'hill' | 'woods' | 'mine' | 'market' | 'harbor' | 'hillside' | 'ranch' | 'foothill' | 'offshore' | 'farm';
export const OUTDOOR_AREAS: readonly OutdoorArea[] = ['hill', 'woods', 'mine', 'market', 'harbor', 'hillside', 'ranch', 'foothill', 'offshore', 'farm'];
/** A district map (an outdoor area that is also a district). */
export type DistrictArea = 'market' | 'harbor' | 'hillside' | 'ranch' | 'foothill' | 'farm';
/** Districts (separate maps around the hub) among the outdoor areas. */
export const DISTRICT_AREAS: readonly DistrictArea[] = ['farm', 'market', 'harbor', 'hillside', 'ranch', 'foothill'];
export const isDistrictArea = (a: unknown): a is DistrictArea => typeof a === 'string' && (DISTRICT_AREAS as readonly string[]).includes(a);
// Keeps DistrictArea a subset of both unions.
const _districtArea: readonly (OutdoorArea & DistrictId)[] = DISTRICT_AREAS;
void _districtArea;
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
/**
 * A district's own light: hemisphere and sun strength, exposure and the sun
 * shadow's half-extent (world units). `dayCycle` follows the game clock like the
 * hub (dawn / day / evening / night palettes).
 */
export type RegionLight = { hemi: number; sun: number; exposure: number; shadow: number; dayCycle?: boolean };
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
  light?: RegionLight;
  /** Camera half-height (world units) for this map. */
  view?: number;
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
/** The trail's three doorways (arrivals are a step in from each, lounge-map-doors.ts). */
const HILL_EXITS: readonly RegionExit[] = [
  { id: 'village', to: 'village', x: 0, z: HILL_D / 2 - 0.6, stand: { x: 0, z: HILL_D / 2 - 2 }, label: '마을로 내려가기', reach: 1.8 },
  { id: 'cave', to: 'mine', x: HILL_CAVE.x, z: HILL_CAVE.z, stand: { x: HILL_CAVE.x, z: HILL_CAVE.z + 2.6 }, label: '광산 들어가기', reach: 1.8 },
  { id: 'woods', to: 'woods', x: HILL_LOG.x, z: HILL_LOG.z, stand: { x: HILL_LOG.x + 2.1, z: HILL_LOG.z }, label: '숲 깊은 곳으로', reach: 1.9 },
];

// ------------------------------------------------------------------ 숲 깊은 곳
const WOODS_W = 44,
  WOODS_D = 36;
const WOODS_EXIT: RegionExit = { id: 'hill', to: 'hill', x: WOODS_W / 2 - 0.6, z: 0, stand: { x: WOODS_W / 2 - 2, z: 0 }, label: '뒷산으로 돌아가기', reach: 1.8 };
const woodsColliders: WalkCollider[] = [
  { shape: 'circle', x: -6, z: -9, r: 1.4 },
  { shape: 'circle', x: 9, z: -4, r: 1.3 },
  { shape: 'circle', x: -10, z: 4, r: 1.2 },
  { shape: 'circle', x: 7, z: 12, r: 1.2 },
  { shape: 'circle', x: -18, z: -3, r: 1.1 },
  { shape: 'circle', x: 18, z: -12, r: 1.2 },
  { shape: 'circle', x: -1, z: 14, r: 1 },
];

/**
 * 먼바다 낚싯배's deck (lounge-voyage-data.ts DECK_*): no exits (the voyage ends
 * by the clock or 그만 돌아가기), the wheelhouse and the gear in the middle
 * are walls, the rails are the edges.
 */
export const DECK_COLLIDERS: readonly WalkCollider[] = [
  // Wheelhouse amidships; the ice box and the bait tub aft, clear of the side passages.
  { shape: 'box', x: 0, z: -0.2, w: 2.4, d: 2.4 },
  { shape: 'box', x: -1.7, z: 5.1, w: 0.9, d: 0.7 },
  { shape: 'box', x: 1.7, z: 5.1, w: 0.8, d: 0.8 },
  // The bow narrows: its corners are hull.
  { shape: 'box', x: -2.5, z: -6.2, w: 1.4, d: 2.2 },
  { shape: 'box', x: 2.5, z: -6.2, w: 1.4, d: 2.2 },
];

export const REGIONS: Record<OutdoorArea, Region> = {
  hill: {
    area: 'hill',
    name: '뒷산',
    short: '뒷산',
    tagline: '나무꾼의 능선 · 곰바위 동굴',
    bounds: { w: HILL_W, d: HILL_D },
    colliders: hillColliders,
    exits: HILL_EXITS,
    arrive: {
      village: arrivalPoint(HILL_EXITS[0]),
      mine: arrivalPoint(HILL_EXITS[1]),
      woods: arrivalPoint(HILL_EXITS[2]),
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
    exits: [WOODS_EXIT],
    arrive: { hill: arrivalPoint(WOODS_EXIT) },
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
    arrive: { hill: { ...MINE_ARRIVE }, mine: { ...MINE_ARRIVE }, foothill: { ...MINE_ARRIVE } },
    look: { ground: '#5a4a3c', groundFar: '#3a2f27', fog: '#1d1712', sky: '#140f0b' },
  },
  market: {
    area: 'market',
    name: DISTRICTS.market.name,
    short: '시장',
    tagline: DISTRICTS.market.tagline,
    bounds: { w: MARKET_W, d: MARKET_D },
    colliders: MARKET_COLLIDERS,
    exits: [
      { id: 'village', to: 'village', x: MARKET_EXIT.x, z: MARKET_EXIT.z, stand: { ...MARKET_EXIT.stand }, label: '큰길 따라 마을로', reach: MARKET_EXIT.reach },
    ],
    arrive: { village: { ...MARKET_ARRIVE } },
    look: { ground: '#93ad6a', groundFar: '#6f8d52', fog: '#dfe5cf', sky: '#c7dfe9' },
    light: { hemi: 1.6, sun: 2.2, exposure: 1.05, shadow: 30, dayCycle: true },
    view: 11,
  },
  harbor: {
    area: 'harbor',
    name: DISTRICTS.harbor.name,
    short: '항구',
    tagline: DISTRICTS.harbor.tagline,
    bounds: { w: HARBOR_W, d: HARBOR_D },
    colliders: HARBOR_COLLIDERS,
    exits: [
      { id: 'village', to: 'village', x: HARBOR_EXIT.x, z: HARBOR_EXIT.z, stand: { ...HARBOR_EXIT.stand }, label: '둑길 따라 마을로', reach: HARBOR_EXIT.reach },
    ],
    arrive: { village: { ...HARBOR_ARRIVE } },
    look: { ground: '#a9a37c', groundFar: '#7f8b66', fog: '#dde7e6', sky: '#bcd8e6' },
    light: { hemi: 1.6, sun: 2.3, exposure: 1.05, shadow: 32, dayCycle: true },
    view: 11.5,
  },
  hillside: {
    area: 'hillside',
    name: DISTRICTS.hillside.name,
    short: '언덕',
    tagline: DISTRICTS.hillside.tagline,
    bounds: { w: HILLSIDE_W, d: HILLSIDE_D },
    colliders: HILLSIDE_COLLIDERS,
    exits: [
      { id: 'village', to: 'village', x: HILLSIDE_EXIT.x, z: HILLSIDE_EXIT.z, stand: { ...HILLSIDE_EXIT.stand }, label: '계단 내려가 마을로', reach: HILLSIDE_EXIT.reach },
    ],
    arrive: { village: { ...HILLSIDE_ARRIVE } },
    look: { ground: '#8fae6a', groundFar: '#6b8c50', fog: '#e1e8d2', sky: '#c9e0ea' },
    light: { hemi: 1.6, sun: 2.2, exposure: 1.05, shadow: 30, dayCycle: true },
    view: 11,
  },
  ranch: {
    area: 'ranch',
    name: DISTRICTS.ranch.name,
    short: '목장',
    tagline: DISTRICTS.ranch.tagline,
    bounds: { w: RANCH_W, d: RANCH_D },
    colliders: RANCH_COLLIDERS,
    exits: [
      { id: 'village', to: 'village', x: RANCH_EXIT.x, z: RANCH_EXIT.z, stand: { ...RANCH_EXIT.stand }, label: '들길 따라 마을로', reach: RANCH_EXIT.reach },
    ],
    arrive: { village: { ...RANCH_ARRIVE } },
    look: { ground: '#9cbb68', groundFar: '#78984f', fog: '#e4ead0', sky: '#c4def0' },
    light: { hemi: 1.6, sun: 2.3, exposure: 1.05, shadow: 32, dayCycle: true },
    view: 11.5,
  },
  foothill: {
    area: 'foothill',
    name: DISTRICTS.foothill.name,
    short: '산기슭',
    tagline: DISTRICTS.foothill.tagline,
    bounds: { w: FOOTHILL_W, d: FOOTHILL_D },
    colliders: FOOTHILL_COLLIDERS,
    exits: [
      { id: 'village', to: 'village', x: FOOTHILL_EXIT.x, z: FOOTHILL_EXIT.z, stand: { ...FOOTHILL_EXIT.stand }, label: '산길 내려가 마을로', reach: FOOTHILL_EXIT.reach },
      { id: 'mine', to: 'mine', x: FOOTHILL_MINE.x, z: FOOTHILL_MINE.z, stand: { ...FOOTHILL_MINE.stand }, label: '산기슭 광산 들어가기', reach: FOOTHILL_MINE.reach },
    ],
    arrive: { village: { ...FOOTHILL_ARRIVE }, mine: { ...FOOTHILL_MINE_ARRIVE } },
    look: { ground: '#8da36a', groundFar: '#6c7f52', fog: '#dfe3d6', sky: '#c2d6e4' },
    light: { hemi: 1.6, sun: 2.2, exposure: 1.05, shadow: 30, dayCycle: true },
    view: 11,
  },
  farm: {
    area: 'farm',
    name: DISTRICTS.farm.name,
    short: '농장',
    tagline: DISTRICTS.farm.tagline,
    bounds: { w: FARM_W, d: FARM_D },
    colliders: FARM_COLLIDERS,
    exits: [
      { id: 'village', to: 'village', x: FARM_EXIT.x, z: FARM_EXIT.z, stand: { ...FARM_EXIT.stand }, label: '농장 길 따라 마을로', reach: FARM_EXIT.reach },
    ],
    arrive: { village: { ...FARM_ARRIVE } },
    look: { ground: '#98b866', groundFar: '#76954e', fog: '#e3ead0', sky: '#c4def0' },
    light: { hemi: 1.6, sun: 2.3, exposure: 1.05, shadow: 34, dayCycle: true },
    view: 11.5,
  },
  offshore: {
    area: 'offshore',
    name: '먼바다',
    short: '먼바다',
    tagline: '샹크스의 낚싯배 · 뱃전마다 낚시',
    bounds: { w: DECK_W, d: DECK_D },
    colliders: DECK_COLLIDERS,
    exits: [],
    arrive: { harbor: { x: 0, z: 2.8 } },
    look: { ground: '#9a7650', groundFar: '#2c5d78', fog: '#bcd4de', sky: '#a9cfe2' },
    light: { hemi: 1.6, sun: 2.3, exposure: 1.05, shadow: 14, dayCycle: true },
    view: 7.2,
  },
};

/** The village's north gate to 뒷산 (village coordinates, off every path). */
export const VILLAGE_GATE = { x: 12, z: -43.4, stand: { x: 12, z: -41.8 }, reach: 1.9 } as const;
export const villageGateDistance = (p: WalkPoint) => Math.hypot(p.x - VILLAGE_GATE.stand.x, p.z - VILLAGE_GATE.stand.z);
/**
 * Where I stand in the hub after leaving an outdoor area: a step in from its
 * gate on the rim, past the gate's trigger (lounge-map-doors.ts).
 */
export const outdoorReturnPoint = (area: OutdoorArea): WalkPoint =>
  isDistrictArea(area) ? arrivalPoint(DISTRICTS[area].gate) : arrivalPoint(VILLAGE_GATE);

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
