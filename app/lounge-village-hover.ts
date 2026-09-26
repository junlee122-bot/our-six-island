// What the mouse points at on the village floor, for the canvas cursor
// (pointer over things you can click to walk to and use) and for clicks on a
// building (walk to its door). Pure geometry on the ground plane.
import {
  VILLAGE_BOARD,
  VILLAGE_MARKET,
  VILLAGE_MUSEUM,
  VILLAGE_ORCHARD,
  VILLAGE_FALLS,
  VILLAGE_HARBOR,
  VILLAGE_LAKE,
  VILLAGE_PIER,
  VILLAGE_PLACES,
  VILLAGE_POND,
  VILLAGE_ROCKS,
  type VillagePoint,
} from './lounge-village-layout.ts';
import { FARM_BEDS, farmBedRect } from './lounge-village-life.ts';

export type VillageHover =
  | { kind: 'place'; id: string }
  | { kind: 'person' }
  | { kind: 'spot'; id: string };

type Rect = { x: number; z: number; w: number; d: number };
const inRect = (p: VillagePoint, r: Rect, pad = 0) =>
  Math.abs(p.x - r.x) <= r.w / 2 + pad && Math.abs(p.z - r.z) <= r.d / 2 + pad;

const SPOTS: readonly { id: string; rect: Rect }[] = [
  { id: 'market', rect: { x: VILLAGE_MARKET.x, z: VILLAGE_MARKET.z, w: VILLAGE_MARKET.width, d: VILLAGE_MARKET.depth } },
  { id: 'museum', rect: { x: VILLAGE_MUSEUM.x, z: VILLAGE_MUSEUM.z, w: VILLAGE_MUSEUM.width, d: VILLAGE_MUSEUM.depth } },
  { id: 'board', rect: { x: VILLAGE_BOARD.x, z: VILLAGE_BOARD.z, w: VILLAGE_BOARD.width, d: 0.9 } },
  { id: 'pier', rect: { x: VILLAGE_PIER.x + 1.5, z: VILLAGE_PIER.z, w: 6, d: VILLAGE_PIER.width + 0.6 } },
  { id: 'harbor', rect: { x: VILLAGE_HARBOR.x, z: VILLAGE_HARBOR.z + VILLAGE_HARBOR.length / 2, w: VILLAGE_HARBOR.width + 0.6, d: VILLAGE_HARBOR.length + 1 } },
  ...FARM_BEDS.map((bed) => {
    const r = farmBedRect(bed);
    return { id: 'farm-' + bed.actor, rect: { x: r.x, z: r.z, w: r.w, d: r.d } };
  }),
];

/**
 * The interactive thing under a floor point: another person (friend or
 * resident) first, then a building footprint, then a village spot (farm beds,
 * market, museum, board, pond, fountain, fruit trees, pier). Null for plain
 * ground.
 */
export function villageHoverTarget(
  p: VillagePoint,
  extra: { people?: readonly VillagePoint[] } = {},
): VillageHover | null {
  for (const person of extra.people ?? [])
    if (Math.hypot(p.x - person.x, p.z - person.z) < 0.7) return { kind: 'person' };
  for (const place of VILLAGE_PLACES)
    if (inRect(p, { x: place.x, z: place.z, w: place.width, d: place.depth }, 0.15))
      return { kind: 'place', id: place.id };
  for (const spot of SPOTS) if (inRect(p, spot.rect, 0.2)) return { kind: 'spot', id: spot.id };
  for (const w of [VILLAGE_POND, VILLAGE_LAKE, VILLAGE_FALLS, VILLAGE_ROCKS])
    if (Math.hypot(p.x - w.x, p.z - w.z) < w.radius + 0.2) return { kind: 'spot', id: w.id };
  if (Math.hypot(p.x, p.z) < 2.1) return { kind: 'spot', id: 'fountain' };
  for (const tree of VILLAGE_ORCHARD)
    if (Math.hypot(p.x - tree.x, p.z - tree.z) < 1.1) return { kind: 'spot', id: 'tree' };
  return null;
}

/** Roof height (world units) of a building's click volume. */
export function villagePlaceHeight(place: { kind: string }): number {
  return place.kind === 'home' ? 3.2 : 4.2;
}

type Vec3 = { x: number; y: number; z: number };

/**
 * The building a camera ray points at: each place is a box (footprint ×
 * roof height), and the nearest box the ray enters wins. A click on a roof
 * or a wall then means that building, not the floor point behind it (which
 * in the tilted view often belongs to the house further back).
 */
export function villagePlaceOnRay(origin: Vec3, dir: Vec3): string | null {
  let best: string | null = null,
    bestT = Infinity;
  for (const place of VILLAGE_PLACES) {
    const min = { x: place.x - place.width / 2, y: 0, z: place.z - place.depth / 2 },
      max = { x: place.x + place.width / 2, y: villagePlaceHeight(place), z: place.z + place.depth / 2 };
    let t0 = -Infinity,
      t1 = Infinity;
    let miss = false;
    for (const axis of ['x', 'y', 'z'] as const) {
      const o = origin[axis],
        d = dir[axis];
      if (Math.abs(d) < 1e-9) {
        if (o < min[axis] || o > max[axis]) {
          miss = true;
          break;
        }
        continue;
      }
      let a = (min[axis] - o) / d,
        b = (max[axis] - o) / d;
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
      if (t0 > t1) {
        miss = true;
        break;
      }
    }
    if (miss || t1 < 0) continue;
    const t = Math.max(0, t0);
    if (t < bestT) {
      bestT = t;
      best = place.id;
    }
  }
  return best;
}
