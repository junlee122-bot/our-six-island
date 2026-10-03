// 우리 농장 (design-our-farm.md §2): the friends' farm, 100 × 64, up the 농장 길
// from the hub's north gate. Pure data: the seven houses in one row along the
// north edge (the same kArchive houses that stood in the hub; rooms and doors
// unchanged, only where the door is), each friend's 12 × 10 field right in
// front of their house (F5's stage 4; smaller stages open its top-left block),
// a lane under the fields, and the central yard with the shipping bin, the
// mailbox and the farm board. F3's facility sites and the
// 공동 밭 are lounge-farm-sites-layout.ts (on the ground F1 left empty). The 3D
// set is lounge-farm-scene.ts; walking uses lounge-areas.ts (regionWalk).
//
// Coordinates: x to the right, z toward the camera, (0, 0) in the middle.
import type { WalkCollider, WalkPoint } from './lounge-walk-world.ts';
import { arrivalPoint } from './lounge-map-doors.ts';
import { GRID_COLS, GRID_ROWS, MASTER_FIELD, fieldBlock, tileAt, tileOpen, tileRC } from './lounge-farm-data.ts';
import { VILLAGE_HOUSE_MODELS, villageHouseScale, type VillageHouseModel, type VillagePlace } from './lounge-village-layout.ts';

/** F5 widened the farm from 84 to 100 so seven 12-tile fields fit (houses and the road keep their places along z). */
export const FARM_W = 100,
  FARM_D = 64;

/** Models the farm uses (kArchive and CC0, already in the manifest). */
export type FarmModel =
  | 'cottage'
  | 'cornerHouse'
  | 'courtyardHouse'
  | 'noticeBoard'
  | 'gardenLantern'
  | 'parkBench'
  | 'produceCrate'
  | 'barrelRack'
  | 'onggi'
  | 'waterPump'
  | 'scarecrow'
  | 'toolShed'
  | 'hydrangea'
  | 'picketFence'
  | 'broadleafTree'
  | 'smallPine'
  | 'shrub'
  // 우리 농장 F3: the shared greenhouse's potting house (placed only once it is built).
  | 'greenhouse';

/** One field tile is FIELD_TILE world units; a 12 × 10 field is 12 × 10 units. */
export const FIELD_TILE = 1;
/** House row (centres) and the fields' north edge, right in front of the doors. */
export const FARM_HOUSE_Z = -27;
export const FIELD_TOP_Z = -20.6;
/** The lane under the fields (east–west), past the lane-side front-yard spots. */
export const FARM_LANE_Z = -8.8;
/** Slot pitch: a field (12) and a 1.6 path between neighbours. */
const PITCH = 13.6;
/** Left-to-right house order, the hub's old row (west end 재민, east end 호현). */
export const FARM_ORDER: readonly number[] = [5, 0, 1, 2, 3, 4, 6];
const HOME_NAMES = ['도원', '강재', '민서', '승준', '민재', '재민', '호현'];
const HOME_MODELS: readonly VillageHouseModel[] = ['cornerHouse', 'cottage', 'cornerHouse', 'cottage', 'cornerHouse', 'courtyardHouse', 'courtyardHouse'];
/** Sign colours per friend (the hub's house colours). */
export const HOME_COLORS = ['#f2c789', '#e9b9a7', '#b7d4b1', '#e7d58e', '#a9c8da', '#d0b0dc', '#dfaa9c'];
export const HOME_ROOFS = ['#9d5946', '#557a74', '#927047', '#526c8b', '#9a604e', '#75608c', '#a56851'];

const round = (n: number) => Math.round(n * 1000) / 1000;

export type FarmHouse = {
  actor: number;
  name: string;
  model: VillageHouseModel;
  x: number;
  z: number;
  /** Footprint of the scaled model. */
  w: number;
  d: number;
  /** Where you stand to walk in (E): a step in front of the door. */
  door: WalkPoint;
  /** Front-yard spot for a bee house or a scarecrow (F2; marked, empty). */
  yard: WalkPoint;
};
export type FarmField = {
  actor: number;
  /** North-west corner of the field (tile 0's corner). */
  x0: number;
  z0: number;
  w: number;
  d: number;
};
const slotX = (i: number) => round((i - (FARM_ORDER.length - 1) / 2) * PITCH);

export const FARM_HOUSES: readonly FarmHouse[] = FARM_ORDER.map((actor, i) => {
  const model = HOME_MODELS[actor],
    spec = VILLAGE_HOUSE_MODELS[model],
    s = villageHouseScale(model);
  const x = slotX(i),
    w = round(spec.width * s + 0.1),
    d = round(spec.depth * s + 0.1);
  return {
    actor,
    name: `${HOME_NAMES[actor]}의 집`,
    model,
    x,
    z: FARM_HOUSE_Z,
    w,
    d,
    door: { x: round(x + spec.doorX * s), z: round(FARM_HOUSE_Z + d / 2 + 1) },
    yard: { x: round(x + 3.6), z: round(FARM_HOUSE_Z + d / 2 + 1) },
  };
});
export const farmHouse = (actor: number) => FARM_HOUSES.find((h) => h.actor === actor) ?? null;
/**
 * The houses as door places (farm coordinates): what the game enters a room
 * through and comes back out of (the hub's VillagePlace shape, kind 'home').
 */
export const FARM_HOME_PLACES: readonly VillagePlace[] = FARM_HOUSES.map((h) => ({
  id: `home-${h.actor}`,
  name: h.name,
  subtitle: '주민의 집',
  kind: 'home',
  actor: h.actor,
  x: h.x,
  z: h.z,
  width: h.w,
  depth: h.d,
  color: HOME_COLORS[h.actor],
  roofColor: HOME_ROOFS[h.actor],
  entry: { x: h.door.x, z: round(h.door.z - 0.6) },
  destination: 'bedroom',
  model: h.model,
}));
export const farmHomePlace = (actor: number) => FARM_HOME_PLACES.find((p) => p.actor === actor) ?? null;

export const FARM_FIELDS: readonly FarmField[] = FARM_ORDER.map((actor, i) => ({
  actor,
  x0: round(slotX(i) - (GRID_COLS * FIELD_TILE) / 2),
  z0: FIELD_TOP_Z,
  w: GRID_COLS * FIELD_TILE,
  d: GRID_ROWS * FIELD_TILE,
}));
export const farmField = (actor: number) => FARM_FIELDS.find((f) => f.actor === actor) ?? null;
/** Centre of tile `tile` of a field (lounge-farm-data tileRC numbering). */
export function fieldTileCenter(f: FarmField, tile: number): WalkPoint {
  const { r, c } = tileRC(tile);
  return { x: round(f.x0 + (c + 0.5) * FIELD_TILE), z: round(f.z0 + (r + 0.5) * FIELD_TILE) };
}
/** Centre of grid cell (row, column) of a field, also off the tiles (front-yard spots). */
export const fieldCellCenter = (f: FarmField, r: number, c: number): WalkPoint => ({
  x: round(f.x0 + (c + 0.5) * FIELD_TILE),
  z: round(f.z0 + (r + 0.5) * FIELD_TILE),
});
/** The tile under `p` on a field, or null off it. */
export function fieldTileAt(f: FarmField, p: WalkPoint): number | null {
  const c = Math.floor((p.x - f.x0) / FIELD_TILE),
    r = Math.floor((p.z - f.z0) / FIELD_TILE);
  return tileAt(r, c);
}
/** The tilled block of a field of `size` tiles (world rect, x/z = centre). */
export function fieldOpenRect(f: FarmField, size: number) {
  const b = fieldBlock(size);
  return { x: round(f.x0 + (b.cols * FIELD_TILE) / 2), z: round(f.z0 + (b.rows * FIELD_TILE) / 2), w: b.cols * FIELD_TILE, d: b.rows * FIELD_TILE };
}
/** How far from a field's edge E still reaches it. */
export const FIELD_REACH = 0.7;
/** Distance from `p` to the tilled block of a field (0 inside). */
export function fieldDistance(f: FarmField, size: number, p: WalkPoint) {
  const r = fieldOpenRect(f, size);
  const dx = Math.max(0, Math.abs(p.x - r.x) - r.w / 2),
    dz = Math.max(0, Math.abs(p.z - r.z) - r.d / 2);
  return Math.hypot(dx, dz);
}
/** Whether `p` stands on an open tile of a field of `size`. */
export const onOpenTile = (f: FarmField, size: number, p: WalkPoint) => {
  const t = fieldTileAt(f, p);
  return t !== null && tileOpen(size, t);
};

/** Where work-yard slot `slot` (0–3) of a house stands: west of its door, 2 × 2 (once the machine yard stands, there instead). */
export function farmWorkSlot(h: FarmHouse, slot: number): WalkPoint {
  const col = slot % 2,
    row = Math.floor(slot / 2);
  return { x: round(h.door.x - 2.4 - col * 0.8), z: round(h.door.z - 0.2 + row * 0.8) };
}

/**
 * 명인 표지판 (F5): a stage-4 field (120 tiles) gets a sign with its owner's
 * name in front of it, on the lane side between the front-yard spots.
 */
export const masterSign = (f: FarmField): WalkPoint => fieldCellCenter(f, GRID_ROWS, 7.5);
export const isMasterField = (size: number) => size >= MASTER_FIELD;

/** The road back to the hub (농장 길, south edge, the middle). */
export const FARM_EXIT = { x: 0, z: FARM_D / 2 - 0.6, stand: { x: 0, z: FARM_D / 2 - 2 }, reach: 1.9 } as const;
export const FARM_ARRIVE: WalkPoint = arrivalPoint(FARM_EXIT);
/** Where you stand after walking out of a house: in front of its door, a step past its reach. */
export const HOUSE_DOOR_REACH = 1.3;
export const houseOutside = (h: FarmHouse): WalkPoint => ({ x: h.door.x, z: round(h.door.z + HOUSE_DOOR_REACH + 0.6) });
/** Where a friend starts the day (login): in front of their own house. */
export const farmStart = (actor: number): WalkPoint => {
  const h = farmHouse(actor);
  return h ? houseOutside(h) : FARM_ARRIVE;
};

/** The central yard: one shipping bin for everyone (paid per friend), the mailbox and the farm board. */
export const FARM_YARD = { x: 0, z: 6, w: 22, d: 10 } as const;
export const FARM_BIN = { x: 4.4, z: 3.4, w: 1.8, d: 1.1, h: 1, front: { x: 4.4, z: 4.8 }, reach: 1.3 } as const;
export const FARM_MAILBOX = { x: -2.6, z: 3.2, w: 0.6, d: 0.5, front: { x: -2.6, z: 4.4 }, reach: 1.2 } as const;
export const FARM_BOARD = { x: -6.2, z: 3, w: 1.6, d: 0.45, front: { x: -6.2, z: 4.3 }, reach: 1.3 } as const;

export const FARM_LAMPS: readonly WalkPoint[] = [
  { x: -2.4, z: 18 },
  { x: 2.4, z: 26 },
  { x: -8, z: 1.4 },
  { x: 8, z: 1.4 },
  // On the paths between the fields, under the lane.
  { x: round(-1.5 * PITCH), z: -5.6 },
  { x: round(1.5 * PITCH), z: -5.6 },
];
export const FARM_BENCHES: readonly { id: string; x: number; z: number; w: number; d: number }[] = [
  { id: 'bench-yard', x: 8.2, z: 9.4, w: 2.2, d: 0.9 },
  { id: 'bench-road', x: -3.4, z: 22, w: 0.9, d: 2.2 },
];
/** Crates, barrels and the pump by the yard (solid). */
export const FARM_PROPS: readonly { model: FarmModel; x: number; z: number; w: number; d: number; h: number; rot?: number }[] = [
  { model: 'produceCrate', x: 6.2, z: 3.2, w: 0.8, d: 0.6, h: 0.5 },
  { model: 'produceCrate', x: 6.9, z: 3.7, w: 0.8, d: 0.6, h: 0.5, rot: 0.4 },
  { model: 'waterPump', x: -9.4, z: 6, w: 0.8, d: 0.8, h: 1.4 },
  { model: 'barrelRack', x: 9.6, z: 3, w: 1.2, d: 0.7, h: 1 },
  { model: 'onggi', x: -8.6, z: 2.8, w: 0.7, d: 0.7, h: 0.8 },
];
/** Shade trees in the yard and along the road (off the fields). */
export const FARM_TREES: readonly { x: number; z: number; s: number; pine?: boolean }[] = [
  { x: -44, z: 22, s: 1.8, pine: true },
  { x: -16.6, z: 26, s: 1.7 },
  { x: -9, z: 28, s: 1.6 },
  { x: 6, z: 28.6, s: 1.7, pine: true },
  { x: 22, z: 24, s: 1.8 },
  { x: 44, z: 21, s: 1.7 },
  { x: -46, z: -2, s: 1.6 },
  { x: 46, z: -2, s: 1.6, pine: true },
];

const box = (x: number, z: number, w: number, d: number): WalkCollider => ({ shape: 'box', x, z, w, d });
/** Everything solid on the farm (fields and marked-out spots are walkable). */
export const FARM_COLLIDERS: readonly WalkCollider[] = [
  ...FARM_HOUSES.map((h) => box(h.x, h.z, h.w - 0.2, h.d - 0.3)),
  box(FARM_BIN.x, FARM_BIN.z, FARM_BIN.w, FARM_BIN.d),
  { shape: 'circle', x: FARM_MAILBOX.x, z: FARM_MAILBOX.z, r: 0.3 },
  box(FARM_BOARD.x, FARM_BOARD.z, FARM_BOARD.w, FARM_BOARD.d),
  ...FARM_BENCHES.map((b) => box(b.x, b.z, b.w, b.d)),
  ...FARM_LAMPS.map((l) => ({ shape: 'circle' as const, x: l.x, z: l.z, r: 0.14 })),
  ...FARM_PROPS.map((p) => box(p.x, p.z, p.w, p.d)),
  ...FARM_TREES.map((t) => ({ shape: 'circle' as const, x: t.x, z: t.z, r: round((t.pine ? 0.22 : 0.2) * t.s) })),
];

/** Roads, paths and the yard (drawn only). */
export const FARM_PAVING: readonly { x: number; z: number; w: number; d: number; tone: 'road' | 'yard' | 'lane' }[] = [
  // The lane under the fields and the paths up between them to the houses.
  { x: 0, z: FARM_LANE_Z, w: FARM_W - 4, d: 2.2, tone: 'lane' },
  ...FARM_ORDER.slice(0, -1).map((_, i) => ({ x: round(slotX(i) + PITCH / 2), z: -15.7, w: 1.4, d: 12.4, tone: 'lane' as const })),
  // The house fronts (door yards).
  { x: 0, z: round(FIELD_TOP_Z - 1.2), w: FARM_W - 4, d: 2, tone: 'lane' },
  // 농장 길 down to the hub, and the central yard.
  { x: 0, z: 19, w: 3, d: 26, tone: 'road' },
  { x: 0, z: -2.6, w: 3, d: 14, tone: 'road' },
  { x: FARM_YARD.x, z: FARM_YARD.z, w: FARM_YARD.w, d: FARM_YARD.d, tone: 'yard' },
];

/** Named spots residents use here (lounge-npc-schedule.ts). */
export const FARM_SPOTS: Readonly<Record<string, WalkPoint & { face: number }>> = {
  gate: { ...FARM_EXIT.stand, face: 0 },
  bin: { x: FARM_BIN.front.x - 1.2, z: FARM_BIN.front.z + 0.6, face: 0 },
  board: { x: FARM_BOARD.front.x, z: FARM_BOARD.front.z + 0.4, face: Math.PI },
  yard: { x: 1.6, z: 8.4, face: -0.4 },
  'bench-yard': { x: 8.2, z: 10.6, face: 0 },
  lane: { x: -6, z: FARM_LANE_Z, face: Math.PI / 2 },
  ...Object.fromEntries(FARM_HOUSES.map((h) => [`door-${h.actor}`, { x: round(h.door.x - 1.2), z: round(h.door.z + 1.4), face: Math.PI }])),
};
