// Where the three shop buildings of 2026-09-26 stand and how their kArchive
// models are fitted (pure data, no imports: lounge-village-layout.ts imports
// SHOP_COLLIDERS from here). The building lots themselves are VILLAGE_PLACES
// ('tavern', 'realty', 'furniture'); this adds the harbor grill stall's lot
// (허풍 주점 외관 3단계; reserved from the start so walking never changes when
// it is built) and the model fits every exterior tier uses.
//
// Model sizes: public/models/village/{tavern,shops}/assets.json (model units,
// +z is the front / door side).
export const SHOP_MODEL_SIZE = {
  tavernStall: { w: 3.0, h: 2.689, d: 2.222 },
  dumplingShop: { w: 1.962, h: 1.98, d: 2.6 },
  stallHeritage: { w: 2.728, h: 2.8, d: 2.178 },
  grillHut: { w: 2.796, h: 2.557, d: 2.6 },
  menuBoard: { w: 0.818, h: 1.1, d: 0.592 },
  realtyOffice: { w: 3.2, h: 2.077, d: 2.598 },
  realtyDuplex: { w: 3.2, h: 2.542, d: 2.412 },
  furnitureShop: { w: 2.2, h: 1.983, d: 2.8 },
  furnitureShowroom: { w: 2.874, h: 2.257, d: 2.8 },
} as const;
export type ShopBuildingModel = keyof typeof SHOP_MODEL_SIZE;

/** A building fitted into its lot: centre, scale, front wall (z) and turn. */
export type ShopFit = { x: number; z: number; scale: number; rot: number };
/** Lots (match VILLAGE_PLACES): centre, width, depth. */
export const SHOP_LOTS = {
  tavern: { x: 35.8, z: 27.6, w: 6.4, d: 5 },
  realty: { x: -32.3, z: 21.7, w: 5.5, d: 4.5 },
  furniture: { x: -21.8, z: 21.7, w: 5.3, d: 5.1 },
} as const;
export type ShopLot = keyof typeof SHOP_LOTS;

/** The largest uniform scale that fits a model in its lot (never above `cap`). */
export function shopFit(lot: ShopLot, model: ShopBuildingModel, cap = 3): ShopFit {
  const l = SHOP_LOTS[lot],
    m = SHOP_MODEL_SIZE[model];
  const scale = Math.min(cap, (l.w - 0.1) / m.w, (l.d - 0.1) / m.d);
  // Front wall on the lot's front edge (the door is where you stop).
  const z = l.z + l.d / 2 - (m.d * scale) / 2;
  return { x: l.x, z: Math.round(z * 1000) / 1000, scale: Math.round(scale * 1000) / 1000, rot: 0 };
}

/** 허풍 주점 외관 3단계: the harbor grill stall on the beach east of the dock. */
export const GRILL_STALL = { x: 42, z: 34.2, scale: 0.9 } as const;
/**
 * Entrance props: the chalkboard (tier 1) left of the tavern door, the 酒 flag
 * right of it and two hanji lanterns. Walkable decoration (no collider), like
 * the flower beds: the flag pole is thin and the board knee-high.
 */
export const TAVERN_FRONT = {
  board: { x: 33.9, z: 30.6, scale: 0.9 },
  flag: { x: 38.3, z: 30.5, height: 3 },
  lanterns: [
    { x: 34.3, z: 30.5 },
    { x: 37.3, z: 30.5 },
  ],
} as const;

/** Solid footprints this module adds to village walking (lounge-village-layout.ts). */
export const SHOP_COLLIDERS: readonly {
  id: string;
  x: number;
  z: number;
  collider: { shape: 'box'; w: number; d: number } | { shape: 'circle'; r: number };
  rotation: 0;
}[] = [
  {
    id: 'shop-grill-stall',
    x: GRILL_STALL.x,
    z: GRILL_STALL.z,
    collider: {
      shape: 'box',
      w: Math.round(SHOP_MODEL_SIZE.grillHut.w * GRILL_STALL.scale * 100) / 100,
      d: Math.round(SHOP_MODEL_SIZE.grillHut.d * GRILL_STALL.scale * 100) / 100,
    },
    rotation: 0,
  },
];
