// ③ 언덕 주택가 (design-npcs-stage2.md §1): the third district, 50 × 50, up
// the 계단 from the hub's west gate. Pure data: three rows of houses along two
// lanes — one house per resident who lives up here, each with a name board —
// the 도서관 at the north-west end, the 청년 자취방 building, 츠나데's 텃밭
// with decorative crops, and a small park with a plaza (no playground). The
// 3D set is lounge-hillside-scene.ts; walking uses lounge-areas.ts.
//
// Coordinates: x to the right, z toward the camera, (0, 0) in the middle.
// Doors face the camera (+z); each row has its lane just south of it. The
// stairs down to the hub come in on the east edge.
import type { WalkCollider, WalkPoint } from './lounge-walk-world.ts';
import { arrivalPoint } from './lounge-map-doors.ts';
import { VILLAGE_HOUSE_MODELS, villageHouseScale, type VillageHouseModel } from './lounge-village-layout.ts';

export const HILLSIDE_W = 50,
  HILLSIDE_D = 50;

export type HillsideModel =
  | 'cottage'
  | 'cornerHouse'
  | 'courtyardHouse'
  | 'realtyDuplex'
  | 'museumLibrary'
  | 'parkBench'
  | 'gardenLantern'
  | 'picnicTable'
  | 'pavilion'
  | 'wisteriaPergola'
  | 'picketFence'
  | 'vegetableBed'
  | 'scarecrow'
  | 'waterPump'
  | 'toolShed'
  | 'broadleafTree'
  | 'smallPine'
  | 'shrub'
  | 'hydrangea'
  | 'noticeBoard';

/** Who lives in a house (resident ids from lounge-npc-data.ts, kept as strings here). */
export type HillHouse = {
  id: string;
  /** The resident who lives here (their house shows their name once they are drawn in the game). */
  npc: string;
  model: HillsideModel;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  /** Roof/board tint for the name board. */
  sign: { bg: string; ink: string; line: string };
  door: WalkPoint;
};
/**
 * Houses are the hub's own house models at the hub's scale (door 1.45, 구역
 * 공통 규격), so a lot is the model's footprint at that scale.
 */
const footprint = (model: VillageHouseModel) => {
  const m = VILLAGE_HOUSE_MODELS[model],
    k = villageHouseScale(model);
  return { w: Math.round(m.width * k * 100) / 100 + 0.3, d: Math.round(m.depth * k * 100) / 100 + 0.3, h: Math.round(m.height * k * 100) / 100 };
};
const house = (id: string, npc: string, model: VillageHouseModel, x: number, z: number, sign: HillHouse['sign'], w = footprint(model).w, d = footprint(model).d): HillHouse => ({
  id,
  npc,
  model,
  x,
  z,
  w,
  d,
  h: footprint(model).h,
  sign,
  door: { x, z: z + d / 2 + 1.1 },
});
const WARM = { bg: '#f3e6cc', ink: '#5a3b22', line: '#a77b4c' };
const COOL = { bg: '#e6ecef', ink: '#2c4556', line: '#6b8aa0' };
const GREEN = { bg: '#e8f0dc', ink: '#2f5a3a', line: '#6f9a58' };
const ROSE = { bg: '#f4e2e2', ink: '#6b2f3a', line: '#b86a78' };

/** Row 1 (north, doors on the upper lane), row 2 (middle), row 3 (south). */
export const HILL_HOUSES: readonly HillHouse[] = [
  house('h-nasera', 'nasera', 'courtyardHouse', -3.5, -15.5, GREEN),
  house('h-frieren', 'frieren', 'cottage', 4.5, -15.5, WARM),
  house('h-thresh', 'thresh', 'cornerHouse', 12.5, -15.5, COOL),
  house('h-janna', 'janna', 'cottage', 20, -15.5, ROSE),
  house('h-sinjjajang', 'sinjjajang', 'cornerHouse', -18, 0, ROSE),
  house('h-volibas', 'volibas', 'courtyardHouse', -9.5, 0, COOL),
  house('h-lux', 'lux', 'cottage', 9.5, 0, COOL),
  house('h-bocchi', 'bocchi', 'cornerHouse', 18, 0, ROSE),
  house('h-tsunade', 'tsunade', 'courtyardHouse', -18.5, 14, GREEN),
];
/** 청년 자취방: one building, two rooms (힘멜 and 야니네코). */
export const HILL_YOUTH = { id: 'h-youth', npcs: ['himmel', 'yanineko'], model: 'realtyDuplex' as HillsideModel, x: 18, z: 14, w: 7, d: 5.4, h: 4.6, door: { x: 18, z: 17.8 }, name: '청년 자취방' } as const;
/** 도서관 (베아트리스): the big building at the north-west end. */
export const HILL_LIBRARY = { id: 'library', x: -17, z: -16, w: 10, d: 7, h: 5.4, door: { x: -17, z: -11.3 }, reach: 1.8, name: '언덕 도서관', sub: '책 대여 · 수요일 저녁 독서 모임' } as const;
/** 츠나데's 텃밭: six decorative beds (farm 3D crop stages), fenced. */
export const HILL_GARDEN = { x: -8.5, z: 14.2, w: 8, d: 5.2 } as const;
export const HILL_GARDEN_BEDS: readonly { x: number; z: number; crop: string; stage: number }[] = [
  { x: -11, z: 12.8, crop: 'garlic', stage: 3 },
  { x: -8.5, z: 12.8, crop: 'radish', stage: 4 },
  { x: -6, z: 12.8, crop: 'pepper', stage: 3 },
  { x: -11, z: 15.6, crop: 'greenonion', stage: 2 },
  { x: -8.5, z: 15.6, crop: 'eggplant', stage: 4 },
  { x: -6, z: 15.6, crop: 'insam', stage: 1 },
];
/** The small park: a pavilion-free lawn with a plaza, benches and a pergola. */
export const HILL_PARK = { x: 4, z: 15, w: 10, d: 7 } as const;
export const HILL_BENCHES: readonly { id: string; x: number; z: number; w: number; d: number }[] = [
  { id: 'bench-w', x: 0.6, z: 17.6, w: 2.2, d: 0.9 },
  { id: 'bench-e', x: 7.4, z: 17.6, w: 2.2, d: 0.9 },
];
export const HILL_PERGOLA = { x: 4, z: 12.6, w: 3.4, d: 2 } as const;
export const HILL_BOARD = { x: 18.6, z: -7.4, w: 1.4, d: 0.45 } as const;
export const HILL_LAMPS: readonly WalkPoint[] = [
  { x: -12, z: -9.4 },
  { x: 0.2, z: -9.4 },
  { x: 16.2, z: -9.4 },
  { x: -13.8, z: 5.8 },
  { x: 14, z: 5.8 },
  { x: -2, z: 11 },
  { x: 10, z: 11 },
];
export const HILL_TREES: readonly { x: number; z: number; s: number; pine?: boolean }[] = [
  { x: -23, z: -22, s: 1.8, pine: true },
  { x: -9, z: -22.4, s: 1.7 },
  { x: 0, z: -22.6, s: 1.8, pine: true },
  { x: 9, z: -22.4, s: 1.7 },
  { x: 23, z: -22, s: 1.9 },
  { x: -23.4, z: -5, s: 1.7 },
  { x: -23.2, z: 22.4, s: 1.8, pine: true },
  { x: -1.8, z: 22.6, s: 1.7 },
  { x: 10.4, z: 22.4, s: 1.6, pine: true },
  { x: 23.2, z: 22.4, s: 1.8 },
];

/** The stairs down to the hub (east edge). */
export const HILLSIDE_EXIT = { x: HILLSIDE_W / 2 - 0.6, z: -3.5, stand: { x: HILLSIDE_W / 2 - 2, z: -3.5 }, reach: 1.9 } as const;
/** Arriving from the hub: a step in from the exit, past its trigger (lounge-map-doors.ts). */
export const HILLSIDE_ARRIVE: WalkPoint = arrivalPoint(HILLSIDE_EXIT);

const box = (x: number, z: number, w: number, d: number): WalkCollider => ({ shape: 'box', x, z, w, d });
const round = (n: number) => Math.round(n * 1000) / 1000;
export const HILLSIDE_COLLIDERS: readonly WalkCollider[] = [
  ...HILL_HOUSES.map((h) => box(h.x, h.z, h.w - 0.2, h.d - 0.3)),
  box(HILL_YOUTH.x, HILL_YOUTH.z, HILL_YOUTH.w - 0.2, HILL_YOUTH.d - 0.3),
  box(HILL_LIBRARY.x, HILL_LIBRARY.z, HILL_LIBRARY.w - 0.2, HILL_LIBRARY.d - 0.3),
  // The garden's fence (a box; you stand at its south gate).
  box(HILL_GARDEN.x, HILL_GARDEN.z, HILL_GARDEN.w, HILL_GARDEN.d),
  ...HILL_BENCHES.map((b) => box(b.x, b.z, b.w, b.d)),
  box(HILL_PERGOLA.x, HILL_PERGOLA.z, HILL_PERGOLA.w, 0.6),
  box(HILL_BOARD.x, HILL_BOARD.z, HILL_BOARD.w, HILL_BOARD.d),
  ...HILL_LAMPS.map((l) => ({ shape: 'circle' as const, x: l.x, z: l.z, r: 0.14 })),
  ...HILL_TREES.map((t) => ({ shape: 'circle' as const, x: t.x, z: t.z, r: round((t.pine ? 0.22 : 0.2) * t.s) })),
];

/** Lanes and the plaza (drawn only). */
export const HILLSIDE_PAVING: readonly { x: number; z: number; w: number; d: number; tone: 'lane' | 'plaza' | 'stair' }[] = [
  { x: 0, z: -10.2, w: HILLSIDE_W - 4, d: 2.6, tone: 'lane' },
  { x: 0, z: 5, w: HILLSIDE_W - 4, d: 2.6, tone: 'lane' },
  { x: 0, z: -2.6, w: 3, d: 12.6, tone: 'lane' },
  { x: 22.6, z: -2.6, w: 2.6, d: 12.6, tone: 'lane' },
  { x: HILL_PARK.x, z: HILL_PARK.z, w: HILL_PARK.w, d: HILL_PARK.d, tone: 'plaza' },
  { x: HILLSIDE_W / 2 - 1.4, z: -3.5, w: 2.8, d: 3, tone: 'stair' },
];

/** Named spots residents use up here (lounge-npc-schedule.ts). */
export const HILLSIDE_SPOTS: Readonly<Record<string, WalkPoint & { face: number }>> = {
  gate: { ...HILLSIDE_EXIT.stand, face: -Math.PI / 2 },
  ...Object.fromEntries(HILL_HOUSES.map((h) => [`door-${h.npc}`, { ...h.door, face: Math.PI }])),
  'door-youth': { ...HILL_YOUTH.door, face: Math.PI },
  'door-youth-2': { x: HILL_YOUTH.door.x + 1.4, z: HILL_YOUTH.door.z, face: Math.PI },
  'library-door': { ...HILL_LIBRARY.door, face: Math.PI },
  'library-steps': { x: HILL_LIBRARY.x + 3.2, z: HILL_LIBRARY.door.z + 0.4, face: -0.6 },
  'garden-gate': { x: HILL_GARDEN.x, z: HILL_GARDEN.z + HILL_GARDEN.d / 2 + 0.9, face: Math.PI },
  'garden-w': { x: HILL_GARDEN.x - HILL_GARDEN.w / 2 - 0.9, z: HILL_GARDEN.z, face: Math.PI / 2 },
  'garden-e': { x: HILL_GARDEN.x + HILL_GARDEN.w / 2 + 0.9, z: HILL_GARDEN.z, face: -Math.PI / 2 },
  'park-bench-w': { x: 0.6, z: 18.7, face: 0 },
  'park-bench-e': { x: 7.4, z: 18.7, face: 0 },
  'park-corner': { x: 8.6, z: 13.2, face: -2.4 },
  plaza: { x: 3.4, z: 15.2, face: 0 },
  'lane-n': { x: 8, z: -10.2, face: 0 },
  'lane-s': { x: -4, z: 5, face: 0 },
  board: { x: 18.6, z: -6.2, face: Math.PI },
};
