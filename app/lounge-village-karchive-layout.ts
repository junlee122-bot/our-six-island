// Where the kArchive civic set (2026-09-25) stands in the village: pure
// geometry shared by the three.js layer (lounge-village-karchive.ts), the
// walk collision (lounge-village-layout.ts adds KARCHIVE_COLLIDERS) and the
// tests. No imports: lounge-village-layout.ts imports this module, so it must
// not import the layout back (the tests keep the shared numbers in step).
//
// `model` sizes are the GLBs' measured bounding boxes (model units, +z is the
// front / door side); public/models/village/civic/assets.json records them.
// Footprints are tight and, where the shape allows, round: only posts and
// solid bases block walking, so friends slide around props instead of
// snagging on invisible box corners.

export type KarchiveCollider =
  | { shape: 'circle'; r: number }
  | { shape: 'box'; w: number; d: number };
export type KarchiveSolid = {
  id: string;
  x: number;
  z: number;
  collider: KarchiveCollider;
  rotation: 0;
};

/** Measured GLB bounds (model units): width (x), height (y), depth (z). */
export const KARCHIVE_MODEL_SIZE = {
  greenhouse: { w: 3.2, h: 2.3667, d: 2.3438 },
  noticeBoard: { w: 1.2, h: 1.0898, d: 0.5086 },
  museumLibrary: { w: 2.6768, h: 2.2091, d: 3 },
  hanokHall: { w: 2, h: 1.5704, d: 1.3066 },
  festivalStage: { w: 1.84, h: 1.4182, d: 2 },
  wisteriaPergola: { w: 2.1832, h: 1.7771, d: 2.5 },
  vegetableBed: { w: 1.2, h: 0.4311, d: 0.7766 },
  timberDeck: { w: 1, h: 0.08, d: 1 },
  harborFence: { w: 1, h: 1.2, d: 0.16 },
  picketFence: { w: 1, h: 1.2, d: 0.16 },
} as const;
export type KarchiveVillageModel = keyof typeof KARCHIVE_MODEL_SIZE;

/** Height (model units) of the soil surface inside the vegetable bed frame. */
export const VEGETABLE_BED_SOIL = 0.36;

/**
 * Greenhouse on the river's north bank, between the hall lane and the
 * south crossing (the lot west of the plaza's flower bed and lamp). Its
 * glass door (+x side) faces the crossing.
 */
export const KARCHIVE_GREENHOUSE = { x: -10, z: 12.6, scale: 1 } as const;
/**
 * '온실 2동' (greenhouse2 project) replaces the economy pass's primitive glass
 * box beside the greenhouse. It appears only once that project is done, so it
 * adds no static collider (like the primitive it replaces); its lot is off
 * every route.
 */
export const KARCHIVE_GREENHOUSE2 = { x: -7.0, z: 12.6, scale: 0.8 } as const;
/** Museum pavilion: the public library model, door (+z) toward the plaza lane. */
export const KARCHIVE_MUSEUM = { x: -9.2, z: 1.5, scale: 0.97 } as const;
/** Notice board: posts span the board's collider width (1.4). */
export const KARCHIVE_BOARD = { x: 4.4, z: 4.8, scale: 1.4 / 1.2 } as const;
/**
 * 범마을 회관 exterior: the hanok, scaled to the hall's 8-wide footprint with
 * its front wall on the collider's front edge (so the door is where you stop).
 */
export const KARCHIVE_HALL = { x: -16, front: 8, width: 7.9 } as const;
/**
 * Festival stage (마을 공사 'stage') at the south riverside camp, opening
 * toward the camp lane and the camera. Before the project is done a small
 * construction site stands here instead (same round footprint).
 */
export const KARCHIVE_STAGE = { x: 12, z: 21.3, scale: 1.75, radius: 1.7 } as const;
/**
 * Wisteria pergola in the east garden by the boardwalk: you can walk under
 * it; only its four posts block (post centres ±0.82 × ±0.95 model units).
 */
export const KARCHIVE_PERGOLA = {
  x: 34.8,
  z: 1.4,
  scale: 1.25,
  posts: { x: 0.83, z: 0.95, r: 0.12 },
} as const;
/** Sea pier deck (마을 공사 'bridge'): four 1.5 m tiles from the island edge. */
export const KARCHIVE_PIER = {
  x0: 37.55,
  z: 24,
  tile: 1.5,
  tiles: 4,
  top: 0.35,
  /** Railings stand only over the sea (past the walkable island edge). */
  railFrom: 40.3,
} as const;

/** Every solid footprint the kArchive layer adds to village walking. */
export const KARCHIVE_COLLIDERS: readonly KarchiveSolid[] = [
  {
    id: 'karchive-stage',
    x: KARCHIVE_STAGE.x,
    z: KARCHIVE_STAGE.z,
    collider: { shape: 'circle', r: KARCHIVE_STAGE.radius },
    rotation: 0,
  },
  ...[-1, 1].flatMap((sx) =>
    [-1, 1].map(
      (sz): KarchiveSolid => ({
        id: `karchive-pergola-${sx}${sz}`,
        x: KARCHIVE_PERGOLA.x + sx * KARCHIVE_PERGOLA.posts.x * KARCHIVE_PERGOLA.scale,
        z: KARCHIVE_PERGOLA.z + sz * KARCHIVE_PERGOLA.posts.z * KARCHIVE_PERGOLA.scale,
        collider: { shape: 'circle', r: KARCHIVE_PERGOLA.posts.r },
        rotation: 0,
      }),
    ),
  ),
];

/** Footprint (world units) of a model at a scale, optionally turned 90°. */
export function karchiveFootprint(model: KarchiveVillageModel, scale: number, turned = false) {
  const s = KARCHIVE_MODEL_SIZE[model];
  return turned
    ? { w: s.d * scale, d: s.w * scale, h: s.h * scale }
    : { w: s.w * scale, d: s.d * scale, h: s.h * scale };
}
