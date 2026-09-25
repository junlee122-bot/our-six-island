// What the mouse points at on the village floor, for the canvas cursor
// (pointer over things you can click to walk to and use) and for clicks on a
// building (walk to its door). Pure geometry on the ground plane.
import {
  VILLAGE_BOARD,
  VILLAGE_MARKET,
  VILLAGE_MUSEUM,
  VILLAGE_ORCHARD,
  VILLAGE_PIER,
  VILLAGE_PLACES,
  VILLAGE_POND,
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
  { id: 'pier', rect: { x: VILLAGE_PIER.x, z: VILLAGE_PIER.z, w: VILLAGE_PIER.width + 0.6, d: 6 } },
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
  if (Math.hypot(p.x - VILLAGE_POND.x, p.z - VILLAGE_POND.z) < VILLAGE_POND.radius + 0.2)
    return { kind: 'spot', id: 'pond' };
  if (Math.hypot(p.x, p.z) < 2.1) return { kind: 'spot', id: 'fountain' };
  for (const tree of VILLAGE_ORCHARD)
    if (Math.hypot(p.x - tree.x, p.z - tree.z) < 1.1) return { kind: 'spot', id: 'tree' };
  return null;
}
