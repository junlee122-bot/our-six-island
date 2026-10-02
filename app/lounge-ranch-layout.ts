// ④ 목장·과수원 (design-npcs-stage3.md §1): the fourth district, 60 × 50, up
// the 들길 from the hub's north-east gate. Pure data: 닐라 목장 on the west
// bank (the 축사 with its own room, a silo, the chicken coop, a fenced pasture
// with grazing animals), a small stream down the middle with a timber bridge
// on the farm road and stepping stones further south, and 하쿠's 강물 과수원 on
// the east bank (the 과수원 창고 with its own room, rows of fruit trees, a
// 원두막). Friends' own animals and trees live in the server's records
// (lounge-stage3.ts); the map draws the place. The 3D set is
// lounge-ranch-scene.ts; walking uses lounge-areas.ts (regionWalk).
//
// Coordinates: x to the right, z toward the camera, (0, 0) in the middle.
import type { WalkCollider, WalkPoint } from './lounge-walk-world.ts';
import { arrivalPoint } from './lounge-map-doors.ts';

export const RANCH_W = 60,
  RANCH_D = 50;

/** Models the ranch reuses (kArchive and CC0, already in the manifest). */
export type RanchModel =
  | 'toolShed'
  | 'cottage'
  | 'cornerHouse'
  | 'pavilion'
  | 'fruitTree'
  | 'ropeFence'
  | 'picketFence'
  | 'scarecrow'
  | 'waterPump'
  | 'produceCrate'
  | 'barrelRack'
  | 'firewood'
  | 'onggi'
  | 'parkBench'
  | 'gardenLantern'
  | 'noticeBoard'
  | 'broadleafTree'
  | 'smallPine'
  | 'shrub'
  | 'meadowGrass'
  | 'valleyRocks';

export type RanchBuildingId = 'barn' | 'orchardShop';
export type RanchBuilding = {
  id: RanchBuildingId;
  name: string;
  sub: string;
  model: RanchModel;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  sign: { bg: string; ink: string; line: string };
  /** Where you stand to walk in (E). */
  door: WalkPoint;
};
export const RANCH_BUILDINGS: readonly RanchBuilding[] = [
  {
    id: 'barn',
    name: '닐라 목장',
    sub: '축사 · 동물 돌보기 · 건초',
    model: 'toolShed',
    x: -20,
    z: -15,
    w: 9,
    d: 6.4,
    h: 5,
    sign: { bg: '#f6e7cf', ink: '#6a3a1e', line: '#b4763f' },
    door: { x: -20, z: -10.6 },
  },
  {
    id: 'orchardShop',
    name: '강물 과수원',
    sub: '과수원 창고 · 묘목 · 과일',
    model: 'cornerHouse',
    x: 14,
    z: -15,
    w: 6.6,
    d: 5.6,
    h: 4.6,
    sign: { bg: '#e7f1e3', ink: '#2e5a3c', line: '#6f9f74' },
    door: { x: 14, z: -11 },
  },
];
export const ranchBuilding = (id: RanchBuildingId) => RANCH_BUILDINGS.find((b) => b.id === id)!;
/** The two keepers' houses (drawn, not entered). */
export const RANCH_HOUSES: readonly { id: string; npc: string; name: string; model: RanchModel; x: number; z: number; w: number; d: number; h: number; door: WalkPoint }[] = [
  { id: 'nilah', npc: 'nilah', name: '닐라네 집', model: 'cottage', x: -6, z: -16, w: 5.4, d: 5, h: 4.4, door: { x: -6, z: -12.4 } },
  { id: 'haku', npc: 'haku', name: '하쿠네 집', model: 'cottage', x: 24.5, z: -16, w: 5.2, d: 5, h: 4.4, door: { x: 24.5, z: -12.4 } },
];

/** The road back to the hub (the 들길, south edge). */
export const RANCH_EXIT = { x: -12, z: RANCH_D / 2 - 0.6, stand: { x: -12, z: RANCH_D / 2 - 2 }, reach: 1.9 } as const;
export const RANCH_ARRIVE: WalkPoint = arrivalPoint(RANCH_EXIT);

/** The stream down the middle; the bridge carries the farm road, the stones cross further south. */
export const RANCH_STREAM = { x: 0, w: 3 } as const;
export const RANCH_BRIDGE = { x: 0, z: -8, w: 3.6, d: 3 } as const;
export const RANCH_STONES = { x: 0, z: 12, w: 3.4, d: 1.6 } as const;

/** The silo beside the 축사 (drawn in code). */
export const RANCH_SILO = { x: -27, z: -15, r: 1.5, h: 7 } as const;
/** The chicken coop (a small shed) and its run. */
export const RANCH_COOP = { x: -6, z: 4, w: 3.6, d: 3, h: 2.8 } as const;
/** The fenced pasture: a rope fence with a gate on its east side. */
export const RANCH_PASTURE = { x: -21.5, z: 6, w: 13, d: 18, gateZ: 6, gateW: 2.4 } as const;
/** Grazing animals (drawn only, inside the pasture or by the coop). */
export const RANCH_ANIMALS: readonly { kind: 'cow' | 'sheep' | 'chicken'; x: number; z: number; rot: number }[] = [
  { kind: 'cow', x: -24, z: 0, rot: 0.6 },
  { kind: 'cow', x: -19, z: 9, rot: -1.1 },
  { kind: 'sheep', x: -25, z: 6, rot: 1.9 },
  { kind: 'sheep', x: -23.4, z: 7.2, rot: 2.4 },
  { kind: 'sheep', x: -18.6, z: 2.4, rot: -0.4 },
  { kind: 'chicken', x: -8.2, z: 6.6, rot: 0.3 },
  { kind: 'chicken', x: -6.8, z: 7.1, rot: 2.2 },
  { kind: 'chicken', x: -4.6, z: 6.5, rot: -1.2 },
];
/** 하쿠's fruit trees: four rows on the east bank. */
export const RANCH_TREES_FRUIT: readonly WalkPoint[] = [8, 13, 18, 23].flatMap((x) => [-2, 4, 10, 16].map((z) => ({ x, z })));
/** The 원두막 at the orchard's south end. */
export const RANCH_PAVILION = { x: 6, z: 20.5, w: 3.6, d: 3.6, h: 3.6 } as const;
export const RANCH_BOARD = { x: -9, z: -5.4, w: 1.5, d: 0.45 } as const;
export const RANCH_BENCHES: readonly { id: string; x: number; z: number; w: number; d: number }[] = [
  { id: 'bench-stream', x: -4.2, z: 14.4, w: 2.2, d: 0.9 },
  { id: 'bench-orchard', x: 26.4, z: 4, w: 0.9, d: 2.2 },
];
export const RANCH_LAMPS: readonly WalkPoint[] = [
  { x: -14, z: -10.2 },
  { x: -2.6, z: -10.2 },
  { x: 8, z: -10.2 },
  { x: 20, z: -10.2 },
  { x: -10, z: 12 },
  { x: 3.2, z: 17.6 },
];
/** Crates, hay and pails (solid). */
export const RANCH_PROPS: readonly { model: RanchModel | null; x: number; z: number; w: number; d: number; h: number; rot?: number; color?: string }[] = [
  // Hay bales (plain boxes in straw colour).
  { model: null, x: -9.6, z: -2.4, w: 1.3, d: 0.9, h: 0.8, color: '#d8b864' },
  { model: null, x: -8.2, z: -2.2, w: 1.3, d: 0.9, h: 0.8, color: '#cfae58', rot: 0.2 },
  { model: null, x: -8.9, z: -2.3, w: 1.2, d: 0.85, h: 0.75, color: '#dcc072' },
  { model: 'onggi', x: -14.6, z: -11.2, w: 0.7, d: 0.7, h: 0.8 },
  { model: 'firewood', x: -25.4, z: -11, w: 1.2, d: 0.7, h: 0.6 },
  { model: 'waterPump', x: -3.4, z: -2.6, w: 0.8, d: 0.8, h: 1.4 },
  { model: 'produceCrate', x: 10.2, z: -11.2, w: 0.8, d: 0.6, h: 0.5 },
  { model: 'produceCrate', x: 11, z: -10.6, w: 0.8, d: 0.6, h: 0.5, rot: 0.4 },
  { model: 'barrelRack', x: 18.4, z: -11.4, w: 1.2, d: 0.7, h: 1 },
  { model: 'scarecrow', x: 26.2, z: 13, w: 1, d: 0.5, h: 2 },
];
/** Shade trees round the edge (outside the fruit rows). */
export const RANCH_EDGE_TREES: readonly { x: number; z: number; s: number; pine?: boolean }[] = [
  { x: -27.6, z: -22.4, s: 1.8, pine: true },
  { x: -13, z: -22.6, s: 1.7 },
  { x: 2.6, z: -22.4, s: 1.8 },
  { x: 19, z: -22.6, s: 1.7, pine: true },
  { x: 28, z: -22, s: 1.8 },
  { x: -27.6, z: 21.6, s: 1.7 },
  { x: 27.6, z: 21.6, s: 1.8, pine: true },
  { x: 17, z: 22.4, s: 1.6 },
];

const box = (x: number, z: number, w: number, d: number): WalkCollider => ({ shape: 'box', x, z, w, d });
const round = (n: number) => Math.round(n * 1000) / 1000;
/** The stream as walls, except the bridge and the stepping stones. */
function streamColliders(): WalkCollider[] {
  const top = -RANCH_D / 2 - 1,
    bottom = RANCH_D / 2 + 1;
  const cuts = [
    [RANCH_BRIDGE.z - RANCH_BRIDGE.d / 2, RANCH_BRIDGE.z + RANCH_BRIDGE.d / 2],
    [RANCH_STONES.z - RANCH_STONES.d / 2, RANCH_STONES.z + RANCH_STONES.d / 2],
  ].sort((a, b) => a[0] - b[0]);
  const out: WalkCollider[] = [];
  let from = top;
  for (const [a, b] of cuts) {
    out.push(box(RANCH_STREAM.x, round((from + a) / 2), RANCH_STREAM.w, round(a - from)));
    from = b;
  }
  out.push(box(RANCH_STREAM.x, round((from + bottom) / 2), RANCH_STREAM.w, round(bottom - from)));
  return out;
}
/** The pasture's rope fence: four sides, the east one split by its gate. */
export function pastureFence(): { x: number; z: number; w: number; d: number }[] {
  const p = RANCH_PASTURE,
    l = p.x - p.w / 2,
    r = p.x + p.w / 2,
    t = p.z - p.d / 2,
    b = p.z + p.d / 2;
  const g0 = p.gateZ - p.gateW / 2,
    g1 = p.gateZ + p.gateW / 2;
  return [
    { x: p.x, z: t, w: p.w, d: 0.2 },
    { x: p.x, z: b, w: p.w, d: 0.2 },
    { x: l, z: p.z, w: 0.2, d: p.d },
    { x: r, z: round((t + g0) / 2), w: 0.2, d: round(g0 - t) },
    { x: r, z: round((g1 + b) / 2), w: 0.2, d: round(b - g1) },
  ];
}
/** Everything solid in the ranch. */
export const RANCH_COLLIDERS: readonly WalkCollider[] = [
  ...streamColliders(),
  ...RANCH_BUILDINGS.map((b) => box(b.x, b.z, b.w - 0.2, b.d - 0.3)),
  ...RANCH_HOUSES.map((h) => box(h.x, h.z, h.w - 0.2, h.d - 0.3)),
  { shape: 'circle', x: RANCH_SILO.x, z: RANCH_SILO.z, r: RANCH_SILO.r },
  box(RANCH_COOP.x, RANCH_COOP.z, RANCH_COOP.w, RANCH_COOP.d),
  ...pastureFence().map((f) => box(f.x, f.z, f.w, f.d)),
  ...RANCH_TREES_FRUIT.map((t) => ({ shape: 'circle' as const, x: t.x, z: t.z, r: 0.42 })),
  box(RANCH_PAVILION.x, RANCH_PAVILION.z, RANCH_PAVILION.w - 0.6, RANCH_PAVILION.d - 0.6),
  box(RANCH_BOARD.x, RANCH_BOARD.z, RANCH_BOARD.w, RANCH_BOARD.d),
  ...RANCH_BENCHES.map((b) => box(b.x, b.z, b.w, b.d)),
  ...RANCH_LAMPS.map((l) => ({ shape: 'circle' as const, x: l.x, z: l.z, r: 0.14 })),
  ...RANCH_PROPS.map((p) => box(p.x, p.z, p.w, p.d)),
  ...RANCH_EDGE_TREES.map((t) => ({ shape: 'circle' as const, x: t.x, z: t.z, r: round((t.pine ? 0.22 : 0.2) * t.s) })),
];

/** Roads and yards (drawn only). */
export const RANCH_PAVING: readonly { x: number; z: number; w: number; d: number; tone: 'road' | 'yard' | 'wood' }[] = [
  { x: 0, z: -8, w: RANCH_W - 4, d: 3, tone: 'road' },
  { x: -12, z: 8, w: 3, d: 32, tone: 'road' },
  { x: -20, z: -10.4, w: 7, d: 2.2, tone: 'yard' },
  { x: 14, z: -10.6, w: 5, d: 2, tone: 'yard' },
  { x: 15.5, z: 7, w: 2, d: 22, tone: 'road' },
  { x: RANCH_BRIDGE.x, z: RANCH_BRIDGE.z, w: RANCH_BRIDGE.w, d: RANCH_BRIDGE.d, tone: 'wood' },
];

/** Named spots residents use here (lounge-npc-schedule.ts). */
export const RANCH_SPOTS: Readonly<Record<string, WalkPoint & { face: number }>> = {
  gate: { ...RANCH_EXIT.stand, face: 0 },
  'barn-door': { x: -18.4, z: -10.2, face: 0 },
  'barn-yard': { x: -16, z: -6.4, face: -0.4 },
  'pasture-gate': { x: -13.6, z: 6, face: -Math.PI / 2 },
  pasture: { x: -20, z: 4, face: 0.4 },
  coop: { x: -6, z: 6.4, face: Math.PI },
  'nilah-door': { ...RANCH_HOUSES[0].door, face: 0 },
  'stream-w': { x: -2.4, z: 4, face: Math.PI / 2 },
  'stream-e': { x: 2.4, z: 6, face: -Math.PI / 2 },
  stones: { x: -2.6, z: 12, face: Math.PI / 2 },
  bridge: { x: -2.8, z: -6, face: Math.PI / 2 },
  'orchard-door': { x: 15.6, z: -10.2, face: 0 },
  'orchard-row-a': { x: 10.5, z: 1, face: Math.PI / 2 },
  'orchard-row-b': { x: 15.5, z: 7, face: -Math.PI / 2 },
  'orchard-row-c': { x: 20.5, z: 13, face: Math.PI / 2 },
  pavilion: { x: 6, z: 17.8, face: 0 },
  'pavilion-2': { x: 8.6, z: 18.4, face: -0.8 },
  'haku-door': { ...RANCH_HOUSES[1].door, face: 0 },
  'bench-stream': { x: -4.2, z: 15.6, face: 0 },
  'bench-orchard': { x: 25.2, z: 4, face: -Math.PI / 2 },
  board: { x: -9, z: -4.2, face: Math.PI },
  road: { x: 4.6, z: -8, face: 0 },
};
