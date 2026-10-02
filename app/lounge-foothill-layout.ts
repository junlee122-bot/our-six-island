// ⑤ 산기슭 마을 (design-npcs-stage3.md §1): the fifth district, 50 × 44, up
// the 산길 from the hub's north gate. Pure data: 오른의 대장간 on the west
// (kArchive forge workshop, its own room) with an anvil yard, 메르시 의원 on
// the east (its own room), a stone plaza in the middle with 신이치's fortune
// tent (open on weekends and festival days), the 산기슭 광산 입구 at the foot
// of the ridge in the north (it leads down to the mine's first floor) and the
// 온천 입구 behind a "공사 중" sign. The 3D set is lounge-foothill-scene.ts;
// walking uses lounge-areas.ts (regionWalk).
//
// Coordinates: x to the right, z toward the camera, (0, 0) in the middle.
import type { WalkCollider, WalkPoint } from './lounge-walk-world.ts';
import { arrivalPoint } from './lounge-map-doors.ts';

export const FOOTHILL_W = 50,
  FOOTHILL_D = 44;

export type FoothillModel =
  | 'forgeWorkshop'
  | 'courtyardHouse'
  | 'cottage'
  | 'barrelRack'
  | 'firewood'
  | 'onggi'
  | 'produceCrate'
  | 'parkBench'
  | 'gardenLantern'
  | 'noticeBoard'
  | 'smallPine'
  | 'broadleafTree'
  | 'shrub'
  | 'graniteBoulder'
  | 'valleyRocks'
  | 'volcanicRock'
  | 'stonePaver'
  | 'hydrangea';

export type FoothillBuildingId = 'smithy' | 'clinic';
export type FoothillBuilding = {
  id: FoothillBuildingId;
  name: string;
  sub: string;
  model: FoothillModel;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  sign: { bg: string; ink: string; line: string };
  door: WalkPoint;
};
export const FOOTHILL_BUILDINGS: readonly FoothillBuilding[] = [
  {
    id: 'smithy',
    name: '오른의 대장간',
    sub: '범위 강화 · 광석 매입',
    model: 'forgeWorkshop',
    x: -13,
    z: -7,
    w: 9,
    d: 7,
    h: 5,
    sign: { bg: '#f1e0d0', ink: '#5a2a16', line: '#b05a32' },
    door: { x: -13, z: -2.4 },
  },
  {
    id: 'clinic',
    name: '메르시 의원',
    sub: '진료 · 수액 · 허브차',
    model: 'courtyardHouse',
    x: 13,
    z: -7,
    w: 8,
    d: 6.6,
    h: 4.6,
    sign: { bg: '#f7f3e8', ink: '#7a2a2a', line: '#d8b25a' },
    door: { x: 13, z: -2.6 },
  },
];
export const foothillBuilding = (id: FoothillBuildingId) => FOOTHILL_BUILDINGS.find((b) => b.id === id)!;

/** The road back to the hub (the 산길, south edge). */
export const FOOTHILL_EXIT = { x: 0, z: FOOTHILL_D / 2 - 0.6, stand: { x: 0, z: FOOTHILL_D / 2 - 2 }, reach: 1.9 } as const;
export const FOOTHILL_ARRIVE: WalkPoint = arrivalPoint(FOOTHILL_EXIT);
/** The 산기슭 광산 입구 in the ridge (leads to the mine's first floor). */
export const FOOTHILL_MINE = { x: 0, z: -19.4, stand: { x: 0, z: -16.8 }, reach: 1.8 } as const;
export const FOOTHILL_MINE_ARRIVE: WalkPoint = arrivalPoint(FOOTHILL_MINE);
/** The ridge along the north edge (solid), with the mine mouth in it. */
export const FOOTHILL_RIDGE = { z: -19.6, d: 4.8, gap: 3.2 } as const;
/** The hot-spring gate (closed: under construction). */
export const FOOTHILL_ONSEN = { x: 16.5, z: -16.2, w: 6, d: 3.4 } as const;
/** The stone plaza and 신이치's tent on it. */
export const FOOTHILL_PLAZA = { x: 0, z: 5, w: 13, d: 8 } as const;
export const FOOTHILL_TENT = { x: -4.4, z: 4.2, r: 1.5, front: { x: -4.4, z: 6.4 }, reach: 1.6 } as const;
/** 오른's anvil in the yard in front of the forge (drawn in code). */
export const FOOTHILL_ANVIL = { x: -9, z: 0.4, w: 1.1, d: 0.6 } as const;
export const FOOTHILL_BOARD = { x: 6.6, z: 1.6, w: 1.5, d: 0.45 } as const;
export const FOOTHILL_BENCHES: readonly { id: string; x: number; z: number; w: number; d: number }[] = [
  { id: 'bench-plaza', x: 3.6, z: 9.6, w: 2.2, d: 0.9 },
  { id: 'bench-clinic', x: 18.4, z: -1.4, w: 2.2, d: 0.9 },
  { id: 'bench-forge', x: -19.4, z: -1.4, w: 2.2, d: 0.9 },
];
export const FOOTHILL_LAMPS: readonly WalkPoint[] = [
  { x: -6.4, z: -1.6 },
  { x: 6.4, z: -1.6 },
  { x: -2.2, z: -12 },
  { x: 2.2, z: -12 },
  { x: -7.6, z: 9.6 },
  { x: 7.6, z: 9.6 },
  { x: 2, z: 17 },
];
export const FOOTHILL_PROPS: readonly { model: FoothillModel | null; x: number; z: number; w: number; d: number; h: number; rot?: number; color?: string }[] = [
  { model: 'barrelRack', x: -19, z: -2.8, w: 1.2, d: 0.7, h: 1 },
  { model: 'firewood', x: -7.2, z: -3.2, w: 1.2, d: 0.7, h: 0.6 },
  { model: 'onggi', x: -11.2, z: 1.2, w: 0.7, d: 0.7, h: 0.8 },
  { model: 'produceCrate', x: -2.8, z: -14.6, w: 0.8, d: 0.6, h: 0.5 },
  { model: 'produceCrate', x: 2.6, z: -14.4, w: 0.8, d: 0.6, h: 0.5, rot: 0.5 },
  { model: 'hydrangea', x: 9, z: -2.8, w: 0.9, d: 0.8, h: 0.85 },
  { model: 'hydrangea', x: 17.2, z: -2.8, w: 0.9, d: 0.8, h: 0.85 },
  // Ore carts by the mine mouth (plain boxes).
  { model: null, x: -4.4, z: -15.6, w: 1.2, d: 0.8, h: 0.7, color: '#6e5a46' },
];
export const FOOTHILL_TREES: readonly { x: number; z: number; s: number; pine?: boolean }[] = [
  { x: -22.6, z: -12, s: 1.8, pine: true },
  { x: -22.4, z: 4, s: 1.7, pine: true },
  { x: -22, z: 17.6, s: 1.8 },
  { x: 22.6, z: -6, s: 1.8, pine: true },
  { x: 22.4, z: 8, s: 1.7 },
  { x: 21.8, z: 18, s: 1.8, pine: true },
  { x: -12, z: 18.6, s: 1.6, pine: true },
  { x: 12, z: 18.8, s: 1.6 },
];
/** Boulders on the slopes (solid). */
export const FOOTHILL_ROCKS: readonly { x: number; z: number; s: number }[] = [
  { x: -8.6, z: -14.6, s: 1.3 },
  { x: 8, z: -13.6, s: 1.2 },
  { x: -18.6, z: 10.6, s: 1.1 },
  { x: 18.4, z: 12, s: 1.2 },
];

const box = (x: number, z: number, w: number, d: number): WalkCollider => ({ shape: 'box', x, z, w, d });
const round = (n: number) => Math.round(n * 1000) / 1000;
/** The ridge as two walls either side of the mine mouth. */
function ridgeColliders(): WalkCollider[] {
  const left = -FOOTHILL_W / 2 - 1,
    right = FOOTHILL_W / 2 + 1,
    g0 = FOOTHILL_MINE.x - FOOTHILL_RIDGE.gap / 2,
    g1 = FOOTHILL_MINE.x + FOOTHILL_RIDGE.gap / 2;
  return [
    box(round((left + g0) / 2), FOOTHILL_RIDGE.z, round(g0 - left), FOOTHILL_RIDGE.d),
    box(round((g1 + right) / 2), FOOTHILL_RIDGE.z, round(right - g1), FOOTHILL_RIDGE.d),
    // The mouth itself stops a step inside the rock.
    box(FOOTHILL_MINE.x, FOOTHILL_RIDGE.z - 1, FOOTHILL_RIDGE.gap, FOOTHILL_RIDGE.d - 2),
  ];
}
export const FOOTHILL_COLLIDERS: readonly WalkCollider[] = [
  ...ridgeColliders(),
  ...FOOTHILL_BUILDINGS.map((b) => box(b.x, b.z, b.w - 0.2, b.d - 0.3)),
  box(FOOTHILL_ONSEN.x, FOOTHILL_ONSEN.z, FOOTHILL_ONSEN.w, FOOTHILL_ONSEN.d),
  { shape: 'circle', x: FOOTHILL_TENT.x, z: FOOTHILL_TENT.z, r: FOOTHILL_TENT.r },
  box(FOOTHILL_ANVIL.x, FOOTHILL_ANVIL.z, FOOTHILL_ANVIL.w, FOOTHILL_ANVIL.d),
  box(FOOTHILL_BOARD.x, FOOTHILL_BOARD.z, FOOTHILL_BOARD.w, FOOTHILL_BOARD.d),
  ...FOOTHILL_BENCHES.map((b) => box(b.x, b.z, b.w, b.d)),
  ...FOOTHILL_LAMPS.map((l) => ({ shape: 'circle' as const, x: l.x, z: l.z, r: 0.14 })),
  ...FOOTHILL_PROPS.map((p) => box(p.x, p.z, p.w, p.d)),
  ...FOOTHILL_TREES.map((t) => ({ shape: 'circle' as const, x: t.x, z: t.z, r: round((t.pine ? 0.22 : 0.2) * t.s) })),
  ...FOOTHILL_ROCKS.map((r) => ({ shape: 'circle' as const, x: r.x, z: r.z, r: round(0.5 * r.s) })),
];

/** Paths (drawn only): the 산길 up to the mine, the forge and clinic yards, the plaza. */
export const FOOTHILL_PAVING: readonly { x: number; z: number; w: number; d: number; tone: 'gravel' | 'stone' | 'yard' }[] = [
  { x: 0, z: 1, w: 3, d: 38, tone: 'gravel' },
  { x: 0, z: -0.6, w: FOOTHILL_W - 8, d: 2.6, tone: 'gravel' },
  { x: FOOTHILL_PLAZA.x, z: FOOTHILL_PLAZA.z, w: FOOTHILL_PLAZA.w, d: FOOTHILL_PLAZA.d, tone: 'stone' },
  { x: -11, z: -1.2, w: 9, d: 3.6, tone: 'yard' },
  { x: 13, z: -1.8, w: 6, d: 2, tone: 'yard' },
  { x: 0, z: -15.4, w: 7, d: 3, tone: 'stone' },
];

/** Named spots residents use here (lounge-npc-schedule.ts). */
export const FOOTHILL_SPOTS: Readonly<Record<string, WalkPoint & { face: number }>> = {
  gate: { ...FOOTHILL_EXIT.stand, face: Math.PI },
  'smithy-door': { x: -11.4, z: -2, face: 0 },
  anvil: { x: -9, z: 1.6, face: Math.PI },
  'smithy-yard': { x: -15, z: 0.6, face: 0.3 },
  'bench-forge': { x: -19.4, z: -0.2, face: 0 },
  'mine-yard': { x: -2.2, z: -13.4, face: -0.4 },
  'mine-mouth': { x: 1.8, z: -15.6, face: Math.PI },
  'clinic-door': { x: 14.6, z: -2, face: 0 },
  'bench-clinic': { x: 18.4, z: -0.2, face: 0 },
  plaza: { x: 2, z: 5.2, face: 0 },
  'plaza-e': { x: 5.4, z: 6.4, face: -Math.PI / 2 },
  'bench-plaza': { x: 3.6, z: 10.8, face: 0 },
  // 신이치 at the tent's mouth, beside his table (the customer stands at FOOTHILL_TENT.front).
  tent: { x: -5.6, z: 6, face: 0.4 },
  onsen: { x: 12.6, z: -13.4, face: Math.PI },
  board: { x: 6.6, z: 2.8, face: Math.PI },
  path: { x: 0, z: 14, face: Math.PI },
};
