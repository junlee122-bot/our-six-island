// 우리 농장 F3: where the facility sites and the 공동 밭 lie (design-our-farm.md
// §3-5, §10-1). Pure data. The shared sites take the empty ground F1 left on
// the farm's east and south sides (two large 10 × 8, four medium 6 × 6, six
// small 4 × 4); every friend's small personal site sits just under their own
// field, across the lane (the house row has no room between the houses).
// The 공동 밭 (6 × 6) lies west of the central yard. Sites are walkable ground
// like the fields; what stands on them is drawn by lounge-farm-sites-3d.ts.
import type { WalkPoint } from './lounge-walk-world.ts';
import { FARM_FIELDS } from './lounge-farm-layout.ts';
import { COMMON_COLS, COMMON_ROWS, SITE_TILES, siteActor, type SiteSize } from './lounge-farm-sites-data.ts';

const round = (n: number) => Math.round(n * 1000) / 1000;

export type FarmSite = {
  id: string;
  size: SiteSize;
  /** Owner actor of a personal site (absent: shared). */
  actor?: number;
  /** Centre and footprint (world units, one tile = 1). */
  x: number;
  z: number;
  w: number;
  d: number;
};
const site = (id: string, size: SiteSize, x: number, z: number, actor?: number): FarmSite => ({
  id,
  size,
  ...(actor === undefined ? {} : { actor }),
  x,
  z,
  w: SITE_TILES[size].cols,
  d: SITE_TILES[size].rows,
});
/** Personal sites: under each field, across the lane (도원 … 호현); the middle one steps east of the road. */
const PERSONAL_Z = -6.4;
const personalX = (actor: number) => {
  const f = FARM_FIELDS.find((x) => x.actor === actor)!;
  const cx = f.x0 + f.w / 2;
  return Math.abs(cx) < 4 ? 4.5 : round(cx);
};
export const FARM_SITES: readonly FarmSite[] = [
  site('L1', 'large', -31, 8),
  site('L2', 'large', 31, 8),
  site('M1', 'medium', 17, 7),
  site('M2', 'medium', -31, 20),
  site('M3', 'medium', 31, 20),
  site('M4', 'medium', 17, 19),
  site('S1', 'small', -21, 19),
  site('S2', 'small', -10, 19),
  site('S3', 'small', 7, 19),
  site('S4', 'small', -22, 27),
  site('S5', 'small', 12, 27),
  site('S6', 'small', 24, 27),
  ...[0, 1, 2, 3, 4, 5, 6].map((a) => site(`P${a}`, 'small', personalX(a), PERSONAL_Z, a)),
];
export const farmSite = (id: string) => FARM_SITES.find((s) => s.id === id) ?? null;
export const personalSite = (actor: number) => FARM_SITES.find((s) => s.actor === actor) ?? null;
/** How far from a site's edge E still reaches it. */
export const SITE_REACH = 0.6;
/** Distance from `p` to a site (0 inside). */
export function siteDistance(s: { x: number; z: number; w: number; d: number }, p: WalkPoint) {
  const dx = Math.max(0, Math.abs(p.x - s.x) - s.w / 2),
    dz = Math.max(0, Math.abs(p.z - s.z) - s.d / 2);
  return Math.hypot(dx, dz);
}
/** The site under or next to `p` (nearest), if any. */
export function siteAt(p: WalkPoint, reach = SITE_REACH): FarmSite | null {
  let best: FarmSite | null = null,
    bestD = Infinity;
  for (const s of FARM_SITES) {
    const d = siteDistance(s, p);
    if (d <= reach && d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}
export const isPersonalSite = (s: FarmSite) => siteActor(s.id) !== null;

/** A cols × rows bed grid centred in a site: tile t's centre (row-major). */
export function gridTileCenter(s: { x: number; z: number }, cols: number, rows: number, tile: number): WalkPoint {
  const r = Math.floor(tile / cols),
    c = tile % cols;
  return { x: round(s.x - cols / 2 + c + 0.5), z: round(s.z - rows / 2 + r + 0.5) };
}
/** The grid tile under `p`, or null off the grid. */
export function gridTileAt(s: { x: number; z: number }, cols: number, rows: number, p: WalkPoint): number | null {
  const c = Math.floor(p.x - (s.x - cols / 2)),
    r = Math.floor(p.z - (s.z - rows / 2));
  return c >= 0 && c < cols && r >= 0 && r < rows ? r * cols + c : null;
}
/** Orchard plot: three saplings across the middle of the small site. */
export const orchardTreeAt = (s: { x: number; z: number }, slot: number): WalkPoint => ({ x: round(s.x - 1.3 + slot * 1.3), z: s.z });

/** 공동 밭: 6 × 6 tiles west of the central yard. */
export const FARM_COMMON = { x: -16, z: 7, w: COMMON_COLS, d: COMMON_ROWS } as const;
export const commonTileCenter = (tile: number) => gridTileCenter(FARM_COMMON, COMMON_COLS, COMMON_ROWS, tile);
export const commonTileAt = (p: WalkPoint) => gridTileAt(FARM_COMMON, COMMON_COLS, COMMON_ROWS, p);
/** The 공동 창고 crate beside the shared field (solid, E opens the store). */
export const FARM_STORE = { x: -11.9, z: 3.2, w: 1.2, d: 0.8, front: { x: -11.9, z: 4.4 }, reach: 1.2 } as const;
/** The goal board of the 마을 대형 작물 (a sign on the field's north edge). */
export const COMMON_SIGN = { x: -16, z: 3.4 } as const;

/** The machine yard's back strip (the shed and the sign); machines stand in front of it. */
export const YARD_BACK = 1.4;
/**
 * Where a friend's machines stand once the machine yard is built: one row per
 * friend (actor order), one column per slot, small (up to 12 × 7 in front of the shed).
 */
export function yardMachineAt(s: { x: number; z: number; w: number; d: number }, actor: number, slot: number): WalkPoint {
  const pitchX = (s.w - 0.4) / 12,
    pitchZ = (s.d - YARD_BACK - 0.2) / 7;
  return { x: round(s.x - s.w / 2 + 0.2 + (slot + 0.5) * pitchX), z: round(s.z - s.d / 2 + YARD_BACK + (actor + 0.5) * pitchZ) };
}
