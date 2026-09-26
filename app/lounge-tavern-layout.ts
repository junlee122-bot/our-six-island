// 허풍 주점 interior layout (pure data, no three.js): where every kArchive
// prop of the base set and of each upgrade tier stands (world units, the
// room box of lounge-interior-layout.ts: x −8.4…8.4, z −6…5.2). Everything
// stands off the walkable floor (world x −7…7, z −4.6…4.6), along the back
// wall, the two side strips or the front edge, so no new colliders are
// needed; the tests check that. Sizes are the measured GLB bounds
// (public/models/lounge/tavern/assets.json, model units; the holiday-set
// models are normalized to a 2-unit longest side and scaled down here).
import type { TavernModel } from './lounge-model-assets.ts';

export const TAVERN_MODEL_SIZE: Record<TavernModel, { w: number; h: number; d: number }> = {
  barCounter: { w: 1.828, h: 0.91, d: 0.8 },
  wallShelf: { w: 0.934, h: 1, d: 0.59 },
  bottle: { w: 0.714, h: 2, d: 0.694 },
  keg: { w: 0.662, h: 0.793, d: 0.7 },
  cafeTable: { w: 0.8, h: 0.565, d: 0.8 },
  saddleStool: { w: 1.172, h: 0.832, d: 0.8 },
  fireplace: { w: 1.718, h: 2, d: 1.04 },
  glass: { w: 0.808, h: 2, d: 0.81 },
  cupTree: { w: 0.152, h: 0.5, d: 0.3 },
  bottleCrate: { w: 0.5, h: 0.25, d: 0.286 },
  cornerCabinet: { w: 0.91, h: 1, d: 0.566 },
  teaSideboard: { w: 0.772, h: 0.502, d: 0.5 },
  glassRack: { w: 0.364, h: 0.2, d: 0.364 },
  sodaTap: { w: 0.528, h: 0.7, d: 0.546 },
  beverageBar: { w: 1.798, h: 1.607, d: 0.7 },
  boothBench: { w: 1.3, h: 0.817, d: 0.472 },
  shelterBench: { w: 1.136, h: 0.823, d: 0.8 },
  soban: { w: 2, h: 0.959, d: 2 },
  stringLights: { w: 2, h: 1.191, d: 0.288 },
  starLamp: { w: 1.624, h: 2, d: 1.024 },
  floorLamp: { w: 0.65, h: 1.474, d: 0.65 },
  coatStand: { w: 0.55, h: 1.26, d: 0.366 },
  bambooPlanter: { w: 0.556, h: 0.5, d: 0.282 },
  doorway: { w: 2, h: 2.4, d: 0.16 },
  windowFrame: { w: 2, h: 2.4, d: 0.16 },
  audioConsole: { w: 1.2, h: 0.771, d: 0.612 },
  bookcase: { w: 0.92, h: 1, d: 0.404 },
  ticketRail: { w: 0.518, h: 0.15, d: 0.072 },
  cauldron: { w: 2, h: 1.285, d: 1.66 },
  stove: { w: 2, h: 1.427, d: 1.576 },
  teaUrn: { w: 0.258, h: 0.55, d: 0.26 },
  register: { w: 0.45, h: 0.39, d: 0.364 },
  storageShelf: { w: 0.836, h: 1.371, d: 0.45 },
  barrelRack: { w: 1.5, h: 1.428, d: 0.802 },
  chestnutRoaster: { w: 1.801, h: 1.24, d: 1.895 },
};

/** Bar top height (the reception desk scaled ×1.1). */
export const TAVERN_BAR = { scale: 1.1, z: -5.06, x: [-4.6, -2.6] as const, top: 0.91 * 1.1 } as const;

/** One placed copy: centre (world), height above the floor, turn, uniform scale. */
export type TavernSpot = { x: number; z: number; y?: number; rot?: number; s: number };
const S = (x: number, z: number, s: number, rot = 0, y = 0): TavernSpot => ({ x, z, s, rot, y });
const LEFT = Math.PI / 2,
  RIGHT = -Math.PI / 2;
const top = TAVERN_BAR.top;

/** Where each prop goes (every copy); the table and chairs are placed by the scene. */
export const TAVERN_SPOTS: Partial<Record<TavernModel, readonly TavernSpot[]>> = {
  barCounter: TAVERN_BAR.x.map((x) => S(x, TAVERN_BAR.z, TAVERN_BAR.scale)),
  wallShelf: [S(-5.25, -5.74, 0.8), S(-1.95, -5.74, 0.8)],
  bottle: [
    S(-5.45, -5.74, 0.13, 0, 0.8),
    S(-5.1, -5.74, 0.13, 0.4, 0.8),
    S(-2.15, -5.74, 0.13, 0.2, 0.8),
    S(-1.8, -5.74, 0.13, -0.3, 0.8),
  ],
  keg: [S(-7.72, -5.35, 0.9, LEFT), S(-7.72, -4.45, 0.9, LEFT)],
  fireplace: [S(7.78, -2.2, 0.66, RIGHT)],
  // Bar tier 1–3.
  glass: [S(-5.2, -4.8, 0.09, 0, top), S(-3.9, -4.85, 0.09, 0, top), S(-2.2, -4.8, 0.09, 0, top)],
  cupTree: [S(-1.85, -5.1, 1, 0, top)],
  bottleCrate: [S(-6.25, -5.55, 1, 0), S(-6.25, -5.55, 1, 0.1, 0.25)],
  cornerCabinet: [S(-6.6, -5.72, 0.85)],
  teaSideboard: [S(1.2, -5.72, 1)],
  glassRack: [S(1.2, -5.72, 1, 0, 0.5)],
  sodaTap: [S(-4.25, -5.15, 0.8, 0, top)],
  beverageBar: [S(3.9, -5.62, 0.92)],
  // Seats tier 1–3.
  boothBench: [S(7.72, 1.3, 1, RIGHT)],
  shelterBench: [S(-7.7, 1.05, 0.95, LEFT)],
  soban: [S(5.6, 4.9, 0.28)],
  // Lights tier 1–3.
  stringLights: [S(-5.4, -5.84, 1.05, 0, 2.35), S(5.9, -5.84, 1.05, 0, 2.35)],
  starLamp: [S(7.6, 3.2, 0.32, RIGHT)],
  floorLamp: [S(-6.9, 4.9, 0.9), S(6.9, 4.9, 0.9)],
  // Walls and decor tier 1–3.
  coatStand: [S(-7.72, 2.15, 1, LEFT)],
  bambooPlanter: [S(7.6, 4.75, 1.1, RIGHT)],
  doorway: [S(-8.3, 3.4, 1, LEFT)],
  windowFrame: [S(6.2, -5.93, 1)],
  audioConsole: [S(5.95, -5.62, 0.95)],
  bookcase: [S(-7.75, -0.45, 1, LEFT)],
  ticketRail: [S(-3.6, -5.95, 1.2, 0, 2.3)],
  // Kitchen tier 1–3.
  stove: [S(7.62, -4.6, 0.42, RIGHT)],
  cauldron: [S(7.62, -4.6, 0.3, RIGHT, 0.46)],
  teaUrn: [S(-5.55, -5.05, 0.9, 0, top)],
  register: [S(-3.0, -5.1, 0.9, 0, top)],
  storageShelf: [S(-0.55, -5.72, 0.9)],
  barrelRack: [S(-7.7, -3.3, 0.72, LEFT)],
  chestnutRoaster: [S(7.6, -0.1, 0.36, RIGHT)],
};

/** Axis-aligned footprint of a placed copy (world units). */
export function tavernFootprint(model: TavernModel, spot: TavernSpot) {
  const m = TAVERN_MODEL_SIZE[model];
  const turned = Math.abs(Math.sin(spot.rot ?? 0)) > 0.5;
  const w = (turned ? m.d : m.w) * spot.s,
    d = (turned ? m.w : m.d) * spot.s;
  return { x0: spot.x - w / 2, x1: spot.x + w / 2, z0: spot.z - d / 2, z1: spot.z + d / 2, h: m.h * spot.s + (spot.y ?? 0) };
}

/** Procedural pieces (no model): the gramophone, the dartboard and the posters. */
export const TAVERN_DECOR = {
  gramophone: { x: 7.45, z: -5.45 },
  dartboard: { x: 2.85, y: 2.05 },
  /** On the left wall (z), above the jars and the bookcase. */
  posters: [
    { z: -3.0, y: 2.05, title: '이달의 허풍왕' },
    { z: -0.9, y: 2.05, title: '뻥총 조심' },
  ],
  /** Hanji lanterns hung over the 허풍 카드 table. */
  lanterns: [-1.2, 0, 1.2],
} as const;
