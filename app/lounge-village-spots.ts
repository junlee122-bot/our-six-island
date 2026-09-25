// Where the life expansion happens in the village (pure geometry, no three.js):
// fishing spots (river bank, pond edge, sea pier), today's forage / bug spawn
// markers, the museum pavilion, the bundle notice board and the fountain wish.
import {
  VILLAGE_BOARD,
  VILLAGE_MUSEUM,
  VILLAGE_PIER,
  VILLAGE_POND,
  VILLAGE_RIVER,
  type VillagePoint,
} from './lounge-village-layout.ts';
import { walkableNear } from './lounge-village-life.ts';
import { SPAWN_SPOTS, type Spot } from './lounge-items.ts';

const rectDistance = (p: VillagePoint, r: { x: number; z: number; width: number; depth: number }) =>
  Math.hypot(
    Math.max(0, Math.abs(p.x - r.x) - r.width / 2),
    Math.max(0, Math.abs(p.z - r.z) - r.depth / 2),
  );

/** Casting reach from the water's edge. */
export const FISH_REACH = 1.25;
/** Distance to the river's water (0 on a bridge over it). */
export function riverDistance(p: VillagePoint) {
  return Math.max(0, VILLAGE_RIVER.minZ - p.z, p.z - VILLAGE_RIVER.maxZ);
}
export const pondDistance = (p: VillagePoint) =>
  Math.max(0, Math.hypot(p.x - VILLAGE_POND.x, p.z - VILLAGE_POND.z) - VILLAGE_POND.radius);
/** The pier's root on the island edge (you fish from there). */
export const PIER_POINT: VillagePoint = { x: VILLAGE_PIER.x, z: VILLAGE_PIER.z };
export const seaDistance = (p: VillagePoint) =>
  Math.max(0, Math.hypot(p.x - PIER_POINT.x, p.z - PIER_POINT.z) - 0.6);
/** The nearest fishing water within reach. */
export function nearestFishSpot(p: VillagePoint, reach = FISH_REACH): { spot: Spot; distance: number } | null {
  const all: { spot: Spot; distance: number }[] = [
    { spot: 'river', distance: riverDistance(p) },
    { spot: 'pond', distance: pondDistance(p) },
    { spot: 'sea', distance: seaDistance(p) },
  ];
  let best: { spot: Spot; distance: number } | null = null;
  for (const c of all) if (c.distance <= reach && (!best || c.distance < best.distance)) best = c;
  return best;
}
/** Where the bobber lands for a cast from `p` (a little into the water). */
export function bobberPoint(spot: Spot, p: VillagePoint): VillagePoint {
  if (spot === 'pond') {
    const dx = VILLAGE_POND.x - p.x,
      dz = VILLAGE_POND.z - p.z,
      d = Math.hypot(dx, dz) || 1;
    const into = Math.min(d - 0.4, Math.max(0.2, d - VILLAGE_POND.radius + 1.1));
    return { x: p.x + (dx / d) * into, z: p.z + (dz / d) * into };
  }
  if (spot === 'sea') return { x: PIER_POINT.x + 3.2, z: PIER_POINT.z + 0.2 };
  const mid = (VILLAGE_RIVER.minZ + VILLAGE_RIVER.maxZ) / 2;
  return { x: p.x + 0.4, z: p.z < mid ? mid - 0.35 : mid + 0.35 };
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
/** The plaza fountain (radius 2): wishes once the 'fountain' bundle is done. */
export const FOUNTAIN_REACH = 1.1;
export const fountainDistance = (p: VillagePoint) => Math.max(0, Math.hypot(p.x, p.z) - 2);
