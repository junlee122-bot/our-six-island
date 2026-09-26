// Where the life expansion happens in the village (pure geometry, no three.js):
// fishing spots (river, rapids, bridges, pond, falls, lake, sea pier, rocks, harbor), today's forage / bug spawn
// markers, the museum pavilion, the bundle notice board and the fountain wish.
import {
  VILLAGE_BOARD,
  VILLAGE_BOUNDS,
  VILLAGE_FALLS,
  VILLAGE_HARBOR,
  VILLAGE_LAKE,
  VILLAGE_MUSEUM,
  VILLAGE_PIER,
  VILLAGE_POND,
  VILLAGE_RAPIDS,
  VILLAGE_RIVER,
  VILLAGE_ROCKS,
  type VillagePoint,
} from './lounge-village-layout.ts';
import { walkableNear } from './lounge-village-life.ts';
import { KARCHIVE_STAGE } from './lounge-village-karchive-layout.ts';
import { SPAWN_SPOTS, type Spot } from './lounge-items.ts';

const rectDistance = (p: VillagePoint, r: { x: number; z: number; width: number; depth: number }) =>
  Math.hypot(
    Math.max(0, Math.abs(p.x - r.x) - r.width / 2),
    Math.max(0, Math.abs(p.z - r.z) - r.depth / 2),
  );

/** Casting reach from the water's edge. */
export const FISH_REACH = 1.25;
const RIVER_MID = (VILLAGE_RIVER.minZ + VILLAGE_RIVER.maxZ) / 2;
/** The bridge deck `p` stands on (null when not on one). */
function bridgeAt(p: VillagePoint) {
  if (p.z < VILLAGE_RIVER.minZ - 0.3 || p.z > VILLAGE_RIVER.maxZ + 0.3) return null;
  return VILLAGE_RIVER.bridges.find((b) => Math.abs(p.x - b.x) <= b.halfWidth) ?? null;
}
/** Distance to the river's water (Infinity on a bridge: that is the bridge spot). */
export function riverDistance(p: VillagePoint) {
  if (bridgeAt(p)) return Infinity;
  return Math.max(0, VILLAGE_RIVER.minZ - p.z, p.z - VILLAGE_RIVER.maxZ);
}
const discDistance = (p: VillagePoint, w: { x: number; z: number; radius: number }) =>
  Math.max(0, Math.hypot(p.x - w.x, p.z - w.z) - w.radius);
export const pondDistance = (p: VillagePoint) => discDistance(p, VILLAGE_POND);
/** The pier's root on the island edge (you fish from there). */
export const PIER_POINT: VillagePoint = { x: VILLAGE_PIER.x, z: VILLAGE_PIER.z };
export const seaDistance = (p: VillagePoint) =>
  Math.max(0, Math.hypot(p.x - PIER_POINT.x, p.z - PIER_POINT.z) - 0.6);
/** The harbor dock's root on the south edge. */
export const HARBOR_POINT: VillagePoint = { x: VILLAGE_HARBOR.x, z: VILLAGE_BOUNDS.depth / 2 - 0.4 };
const harborDistance = (p: VillagePoint) => Math.max(0, Math.hypot(p.x - HARBOR_POINT.x, p.z - HARBOR_POINT.z) - 0.7);
/** Upstream rapids: the river bank west of the last bridge. */
const rapidsDistance = (p: VillagePoint) =>
  p.x > VILLAGE_RAPIDS.x1 ? Infinity : Math.max(0, VILLAGE_RIVER.minZ - p.z, p.z - VILLAGE_RIVER.maxZ);
type SpotDistance = { spot: Spot; distance: number };
/** Every fishing water and how far `p` is from it (order breaks ties). */
export function fishSpotDistances(p: VillagePoint): SpotDistance[] {
  const onBridge = bridgeAt(p);
  const rapids = rapidsDistance(p);
  return [
    { spot: 'bridge', distance: onBridge ? 0 : Infinity },
    { spot: 'rapids', distance: rapids },
    { spot: 'river', distance: Number.isFinite(rapids) ? Infinity : riverDistance(p) },
    { spot: 'pond', distance: pondDistance(p) },
    { spot: 'falls', distance: discDistance(p, VILLAGE_FALLS) },
    { spot: 'lake', distance: discDistance(p, VILLAGE_LAKE) },
    { spot: 'rocks', distance: discDistance(p, VILLAGE_ROCKS) },
    { spot: 'harbor', distance: harborDistance(p) },
    { spot: 'sea', distance: seaDistance(p) },
  ];
}
/** The nearest fishing water within reach. */
export function nearestFishSpot(p: VillagePoint, reach = FISH_REACH): SpotDistance | null {
  let best: SpotDistance | null = null;
  for (const c of fishSpotDistances(p)) if (c.distance <= reach && (!best || c.distance < best.distance)) best = c;
  return best;
}
const intoDisc = (w: { x: number; z: number; radius: number }, p: VillagePoint, depth = 1.1) => {
  const dx = w.x - p.x,
    dz = w.z - p.z,
    d = Math.hypot(dx, dz) || 1;
  const into = Math.min(d - 0.4, Math.max(0.2, d - w.radius + depth));
  return { x: p.x + (dx / d) * into, z: p.z + (dz / d) * into };
};
/** Where the bobber lands for a cast from `p` (a little into the water). */
export function bobberPoint(spot: Spot, p: VillagePoint): VillagePoint {
  switch (spot) {
    case 'pond':
      return intoDisc(VILLAGE_POND, p);
    case 'falls':
      return intoDisc(VILLAGE_FALLS, p, 1.6);
    case 'lake':
      return intoDisc(VILLAGE_LAKE, p, 2.2);
    case 'rocks':
      return { x: p.x + 0.6, z: VILLAGE_BOUNDS.depth / 2 + 2.2 };
    case 'harbor':
      return { x: HARBOR_POINT.x + 0.9, z: HARBOR_POINT.z + 3.6 };
    case 'sea':
      return { x: PIER_POINT.x + 3.2, z: PIER_POINT.z + 0.2 };
    case 'bridge': {
      // Over the rail, into the water beside the deck.
      const bridge = bridgeAt(p) ?? VILLAGE_RIVER.bridges[1];
      const side = p.x >= bridge.x ? 1 : -1;
      return { x: bridge.x + side * (bridge.halfWidth + 1.1), z: RIVER_MID + (p.z < RIVER_MID ? -0.2 : 0.2) };
    }
    default:
      return { x: p.x + 0.4, z: p.z < RIVER_MID ? RIVER_MID - 0.35 : RIVER_MID + 0.35 };
  }
}

/** Today's spawn markers stand on the nearest walkable ground to each spot. */
export const SPAWN_POINTS: Readonly<Record<string, VillagePoint>> = Object.fromEntries(
  SPAWN_SPOTS.map((s) => [s.id, walkableNear({ x: s.x, z: s.z })]),
);
export const SPAWN_REACH = 1.3;
export function nearestSpawn<T extends { spot: string; taken: boolean }>(
  p: VillagePoint,
  spawns: readonly T[],
  reach = SPAWN_REACH,
): (T & { distance: number }) | null {
  let best: (T & { distance: number }) | null = null;
  for (const s of spawns) {
    if (s.taken) continue;
    const at = SPAWN_POINTS[s.spot];
    if (!at) continue;
    const distance = Math.hypot(p.x - at.x, p.z - at.z);
    if (distance <= reach && (!best || distance < best.distance)) best = { ...s, distance };
  }
  return best;
}

export const MUSEUM_REACH = 1.5;
export const museumDistance = (p: VillagePoint) => rectDistance(p, VILLAGE_MUSEUM);
export const BOARD_REACH = 1.3;
export const boardDistance = (p: VillagePoint) => rectDistance(p, VILLAGE_BOARD);
/** Standing points in front (+z) of the museum and the board (directory "가 보기"). */
export const MUSEUM_FRONT = walkableNear({ x: VILLAGE_MUSEUM.x, z: VILLAGE_MUSEUM.z + VILLAGE_MUSEUM.depth / 2 + 0.6 });
export const BOARD_FRONT = walkableNear({ x: VILLAGE_BOARD.x, z: VILLAGE_BOARD.z + 0.8 });
export const POND_EDGE = walkableNear({ x: VILLAGE_POND.x, z: VILLAGE_POND.z + VILLAGE_POND.radius + 0.5 });
export const RIVER_BANK: VillagePoint = walkableNear({ x: -12, z: VILLAGE_RIVER.minZ - 0.6 });
/**
 * Where to stand to fish each spot (directory "가 보기", NPC-free walkable
 * ground within FISH_REACH of the water).
 */
export const FISH_STAND: Readonly<Record<Spot, VillagePoint>> = {
  river: RIVER_BANK,
  pond: POND_EDGE,
  sea: walkableNear({ x: PIER_POINT.x + 0.2, z: PIER_POINT.z }),
  rapids: walkableNear({ x: -41, z: VILLAGE_RIVER.minZ - 0.62 }),
  falls: walkableNear({ x: -37, z: -32.9 }),
  lake: walkableNear({ x: VILLAGE_LAKE.x - VILLAGE_LAKE.radius - 0.7, z: VILLAGE_LAKE.dockZ }),
  rocks: walkableNear({ x: VILLAGE_ROCKS.x, z: VILLAGE_ROCKS.z - VILLAGE_ROCKS.radius - 0.55 }),
  harbor: walkableNear({ x: HARBOR_POINT.x, z: HARBOR_POINT.z - 0.1 }),
  bridge: { x: 0.9, z: RIVER_MID },
};
/** The plaza fountain (radius 2): wishes once the 'fountain' bundle is done. */
export const FOUNTAIN_REACH = 1.1;
export const fountainDistance = (p: VillagePoint) => Math.max(0, Math.hypot(p.x, p.z) - 2);

/**
 * The festival booth (C-6): south of the plaza fountain, or in front of the
 * 축제 무대 once the 'stage' project is built.
 */
// Both points are chosen clear of the fountain rim and the stage's round
// footprint, so click routes always arrive and 8-way key walking toward them
// does not brush a collider (checked with scripts/village-walk-check.mjs).
export const FETE_REACH = 1.4;
export const FETE_PLAZA: VillagePoint = walkableNear({ x: 0.5, z: 4.8 });
export const FETE_STAGE: VillagePoint = walkableNear({ x: KARCHIVE_STAGE.x, z: KARCHIVE_STAGE.z + KARCHIVE_STAGE.radius + 1.2 });
export const feteSpot = (flags: readonly string[]) => (flags.includes('stage') ? FETE_STAGE : FETE_PLAZA);
export const feteDistance = (p: VillagePoint, flags: readonly string[]) => {
  const at = feteSpot(flags);
  return Math.hypot(p.x - at.x, p.z - at.z);
};
