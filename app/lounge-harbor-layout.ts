// ② 항구 구역 (design-npcs-stage2.md §1): the second district, 60 × 40, down
// the 둑길 from the hub's south gate. Pure data: the quay on the north half
// (어시장, 낚시조합, the dawn-auction yard with its board), the sea on the
// south half with the big pier (큰 선착장) running out toward the camera, the
// lighthouse (등대) on the rocky point in the east and the breakwater
// (방파제) running south from it. Fishing and crab pots use two spots of the
// fishing engine ('breakwater', 'pier'; lounge-items.ts SPOT_INFO). The 3D set
// is lounge-harbor-scene.ts; walking uses lounge-areas.ts (regionWalk).
//
// Coordinates: x to the right, z toward the camera, (0, 0) in the middle.
// The shore runs along z = SHORE_Z; everything south of it is water except
// the pier and the breakwater.
import type { WalkCollider, WalkPoint } from './lounge-walk-world.ts';
import { arrivalPoint } from './lounge-map-doors.ts';

export const HARBOR_W = 60,
  HARBOR_D = 40;
/** The quay edge: land north of it, sea south of it. */
export const HARBOR_SHORE_Z = 3;

/** kArchive models the harbor reuses (already in the manifest). */
export type HarborModel =
  | 'cottage'
  | 'cornerHouse'
  | 'grillHut'
  | 'tavernStall'
  | 'stallHeritage'
  | 'noticeBoard'
  | 'parkBench'
  | 'gardenLantern'
  | 'produceCrate'
  | 'barrelRack'
  | 'harborFence'
  | 'timberDeck'
  | 'smallPine'
  | 'broadleafTree'
  | 'shrub'
  | 'graniteBoulder'
  | 'valleyRocks'
  | 'fishMackerel'
  | 'fishCod'
  | 'fishHairtail'
  | 'firewood'
  | 'onggi';

export type HarborBuildingId = 'fishmarket' | 'guild';
export type HarborBuilding = {
  id: HarborBuildingId;
  name: string;
  sub: string;
  model: HarborModel;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  sign: { bg: string; ink: string; line: string };
  /** Where you stand to use the counter (E). */
  door: WalkPoint;
};
export const HARBOR_BUILDINGS: readonly HarborBuilding[] = [
  {
    id: 'fishmarket',
    name: '범마을 어시장',
    sub: '새벽 경매 · 물고기 매입',
    model: 'grillHut',
    x: -13,
    z: -12,
    w: 9,
    d: 5.6,
    h: 4,
    sign: { bg: '#e3eef2', ink: '#1f4a5c', line: '#4f8aa0' },
    door: { x: -13, z: -8.2 },
  },
  {
    id: 'guild',
    name: '낚시조합',
    sub: '주간 낚시 대회 · 미끼',
    model: 'cornerHouse',
    x: 3,
    z: -12.5,
    w: 6.4,
    d: 5.4,
    h: 4.4,
    sign: { bg: '#f1ead8', ink: '#4a3620', line: '#a57b48' },
    door: { x: 3, z: -8.8 },
  },
];
export const harborBuilding = (id: HarborBuildingId) => HARBOR_BUILDINGS.find((b) => b.id === id)!;

/** The west road back to the hub (the 둑길). */
export const HARBOR_EXIT = { x: -HARBOR_W / 2 + 0.6, z: -10, stand: { x: -HARBOR_W / 2 + 2, z: -10 }, reach: 1.9 } as const;
/** Arriving from the hub: a step in from the exit, past its trigger (lounge-map-doors.ts). */
export const HARBOR_ARRIVE: WalkPoint = arrivalPoint(HARBOR_EXIT);

/** 새벽 경매 yard: the stall with its bell, crates, and the board (auction + weekly cup). */
export const HARBOR_AUCTION = { x: -13, z: -2.2, w: 3.2, d: 2.2, front: { x: -13, z: -0.2 }, reach: 1.8 } as const;
export const HARBOR_BOARD = { x: -5, z: -2.4, w: 1.6, d: 0.5, front: { x: -5, z: -1.2 }, reach: 1.6 } as const;

/** The lighthouse on the rocky point: a tower you can walk up to (its door), not into. */
export const HARBOR_LIGHTHOUSE = { x: 23, z: -7, r: 2.2, height: 11, door: { x: 23, z: -4.2 } } as const;
/** The rocky point the lighthouse stands on (land east of the quay). */
export const HARBOR_POINT = { x: 23, z: -5, r: 7 } as const;

/** The big pier (큰 선착장): a deck from the shore out to sea. */
export const HARBOR_PIER = { x: 0, z: HARBOR_SHORE_Z + 5.5, w: 4, d: 11 } as const;
/** The breakwater (방파제): a stone arm running south from the point. */
export const HARBOR_BREAKWATER = { x: 23, z: HARBOR_SHORE_Z + 6.8, w: 3, d: 13.6 } as const;

/** Fishing and crab-pot spots (fishing engine spots) and where you stand for them. */
export type HarborSpot = { id: string; spot: 'breakwater' | 'pier'; stand: WalkPoint; reach: number; label: string; pot?: boolean };
export const HARBOR_SPOTS: readonly HarborSpot[] = [
  { id: 'bw-end', spot: 'breakwater', stand: { x: 23, z: 15.2 }, reach: 1.6, label: '방파제 끝에서 낚시' },
  { id: 'bw-mid', spot: 'breakwater', stand: { x: 22, z: 9 }, reach: 1.4, label: '방파제에서 낚시' },
  { id: 'bw-pot', spot: 'breakwater', stand: { x: 24, z: 5.6 }, reach: 1.3, label: '방파제 통발', pot: true },
  { id: 'pier-end', spot: 'pier', stand: { x: 0, z: 13.6 }, reach: 1.6, label: '큰 선착장 끝에서 낚시' },
  { id: 'pier-pot', spot: 'pier', stand: { x: -1.2, z: 10 }, reach: 1.3, label: '선착장 통발', pot: true },
];

/** Moored boats beside the pier (drawn only; on the water). */
export const HARBOR_BOATS: readonly { x: number; z: number; len: number; rot: number; color: string }[] = [
  { x: -4.6, z: 8.5, len: 5.2, rot: 0.08, color: '#b55a3c' },
  { x: 4.8, z: 10.5, len: 4.4, rot: -0.12, color: '#3f6f8f' },
  { x: -10, z: 7, len: 3.6, rot: 0.3, color: '#e0d2b0' },
];

export const HARBOR_BENCHES: readonly { id: string; x: number; z: number; w: number; d: number }[] = [
  { id: 'bench-w', x: -21, z: 0.6, w: 2.2, d: 0.9 },
  { id: 'bench-e', x: 10, z: 0.6, w: 2.2, d: 0.9 },
];
export const HARBOR_LAMPS: readonly WalkPoint[] = [
  { x: -24, z: -5.4 },
  { x: -8, z: -5.4 },
  { x: 8.6, z: -5.4 },
  { x: -2.6, z: 3.6 },
  { x: 2.6, z: 3.6 },
  { x: 16, z: -3 },
];
/** Crates, barrels and nets on the quay (solid). */
export const HARBOR_PROPS: readonly { model: HarborModel; x: number; z: number; w: number; d: number; h: number; rot?: number }[] = [
  { model: 'produceCrate', x: -16.6, z: -1.8, w: 0.8, d: 0.6, h: 0.5 },
  { model: 'produceCrate', x: -15.6, z: -1, w: 0.8, d: 0.6, h: 0.5, rot: 0.4 },
  { model: 'barrelRack', x: -19, z: -9, w: 1.2, d: 0.7, h: 1 },
  { model: 'onggi', x: 7.6, z: -10.6, w: 0.8, d: 0.8, h: 0.9 },
  { model: 'firewood', x: -7, z: 1.2, w: 1.2, d: 0.7, h: 0.6 },
  { model: 'produceCrate', x: 5, z: 1.4, w: 0.8, d: 0.6, h: 0.5, rot: -0.3 },
];
export const HARBOR_TREES: readonly { x: number; z: number; s: number }[] = [
  { x: -26, z: -17.6, s: 1.9 },
  { x: -18, z: -18, s: 1.7 },
  { x: -6, z: -18.2, s: 1.8 },
  { x: 9.5, z: -18, s: 1.7 },
  { x: 15, z: -17.4, s: 1.8 },
  { x: 27.4, z: -17, s: 1.9 },
  { x: -27.4, z: -4, s: 1.6 },
];
export const HARBOR_ROCKS: readonly { x: number; z: number; s: number }[] = [
  { x: 28, z: -2, s: 1.4 },
  { x: 18, z: 1.2, s: 1.1 },
  { x: 27.6, z: -10, s: 1.2 },
];

const box = (x: number, z: number, w: number, d: number): WalkCollider => ({ shape: 'box', x, z, w, d });
const round = (n: number) => Math.round(n * 1000) / 1000;
/** The sea as walls: everything south of the shore except the pier and the breakwater. */
function seaColliders(): WalkCollider[] {
  const top = HARBOR_SHORE_Z,
    bottom = HARBOR_D / 2 + 1;
  const mid = (top + bottom) / 2,
    depth = bottom - top;
  const pierL = HARBOR_PIER.x - HARBOR_PIER.w / 2,
    pierR = HARBOR_PIER.x + HARBOR_PIER.w / 2,
    pierEnd = HARBOR_PIER.z + HARBOR_PIER.d / 2;
  const bwL = HARBOR_BREAKWATER.x - HARBOR_BREAKWATER.w / 2,
    bwR = HARBOR_BREAKWATER.x + HARBOR_BREAKWATER.w / 2,
    bwEnd = HARBOR_BREAKWATER.z + HARBOR_BREAKWATER.d / 2;
  const left = -HARBOR_W / 2 - 1,
    right = HARBOR_W / 2 + 1;
  const span = (a: number, b: number) => ({ x: (a + b) / 2, w: b - a });
  const w1 = span(left, pierL),
    w2 = span(pierR, bwL),
    w3 = span(bwR, right);
  return [
    box(w1.x, mid, w1.w, depth),
    box(w2.x, mid, w2.w, depth),
    box(w3.x, mid, w3.w, depth),
    // Beyond the pier's end and the breakwater's end.
    box(HARBOR_PIER.x, (pierEnd + bottom) / 2, HARBOR_PIER.w, bottom - pierEnd),
    box(HARBOR_BREAKWATER.x, (bwEnd + bottom) / 2, HARBOR_BREAKWATER.w, bottom - bwEnd),
  ].map((c) => (c.shape === 'box' ? { ...c, x: round(c.x), z: round(c.z), w: round(c.w), d: round(c.d) } : c));
}
/** Everything solid in the harbor. */
export const HARBOR_COLLIDERS: readonly WalkCollider[] = [
  ...seaColliders(),
  ...HARBOR_BUILDINGS.map((b) => box(b.x, b.z, b.w - 0.2, b.d - 0.3)),
  { shape: 'circle', x: HARBOR_LIGHTHOUSE.x, z: HARBOR_LIGHTHOUSE.z, r: HARBOR_LIGHTHOUSE.r },
  box(HARBOR_AUCTION.x, HARBOR_AUCTION.z, HARBOR_AUCTION.w, HARBOR_AUCTION.d),
  box(HARBOR_BOARD.x, HARBOR_BOARD.z, HARBOR_BOARD.w, HARBOR_BOARD.d),
  ...HARBOR_BENCHES.map((b) => box(b.x, b.z, b.w, b.d)),
  ...HARBOR_LAMPS.map((l) => ({ shape: 'circle' as const, x: l.x, z: l.z, r: 0.14 })),
  ...HARBOR_PROPS.map((p) => box(p.x, p.z, p.w, p.d)),
  ...HARBOR_TREES.map((t) => ({ shape: 'circle' as const, x: t.x, z: t.z, r: round(0.2 * t.s) })),
  ...HARBOR_ROCKS.map((r) => ({ shape: 'circle' as const, x: r.x, z: r.z, r: round(0.5 * r.s) })),
];

/** Paving (drawn only): the quay road, the auction yard, the lighthouse path. */
export const HARBOR_PAVING: readonly { x: number; z: number; w: number; d: number; tone: 'road' | 'quay' | 'stone' }[] = [
  { x: -3, z: -6.4, w: HARBOR_W - 6, d: 3 },
  { x: -HARBOR_W / 2 + 3, z: -8.2, w: 6, d: 2.8 },
  { x: -8, z: -0.8, w: 26, d: 7.2 },
  { x: 17, z: -1.8, w: 10, d: 2.4 },
].map((p, i) => ({ ...p, tone: i === 2 ? ('quay' as const) : i === 3 ? ('stone' as const) : ('road' as const) }));

/**
 * Named spots residents use in the harbor (lounge-npc-schedule.ts). `face`
 * is where they look (radians about y, 0 = toward the camera).
 */
export const HARBOR_SPOTS_NPC: Readonly<Record<string, WalkPoint & { face: number }>> = {
  gate: { ...HARBOR_EXIT.stand, face: Math.PI / 2 },
  fishmarket: { x: -13, z: -7.8, face: 0 },
  'fishmarket-2': { x: -10.4, z: -7.8, face: -0.4 },
  auction: { x: -13, z: 0.2, face: Math.PI },
  'auction-crowd': { x: -10.6, z: 1, face: -2.4 },
  board: { x: -5.6, z: -1, face: Math.PI },
  guild: { x: 3, z: -8.4, face: 0 },
  'pier-root': { x: 0, z: 2.2, face: 0 },
  'pier-mid': { x: 1, z: 8, face: Math.PI / 2 },
  'pier-end': { x: 0.9, z: 13.1, face: 0 },
  'lighthouse-door': { ...HARBOR_LIGHTHOUSE.door, face: 0 },
  'lighthouse-yard': { x: 19.6, z: -3.2, face: 0.6 },
  'breakwater-mid': { x: 23.6, z: 8, face: -Math.PI / 2 },
  'breakwater-end': { x: 23.8, z: 14.6, face: 0 },
  'bench-w': { x: -21, z: 1.8, face: 0 },
  'bench-e': { x: 10, z: 1.8, face: 0 },
  shed: { x: -24.6, z: -12.6, face: Math.PI / 2 },
  quay: { x: 12, z: -2, face: 0 },
};
