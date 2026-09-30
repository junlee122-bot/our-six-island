// ① 시장 거리 (design-village-2x-npcs.md §2, §8): the first separate district,
// 56 × 44, reached by the 큰길 from the hub's east gate. Pure data: the six
// shops' lots (each a kArchive building fitted into it, door toward the
// camera), the plaza with the request board and the market-day stall spots,
// benches, lamps and trees, and the walls a walker bumps into. The 3D set is
// lounge-market-scene.ts; walking uses lounge-areas.ts (regionWalk).
//
// Coordinates: x to the right, z toward the camera, (0, 0) in the middle.
// The street runs west–east along z ≈ −6 in front of the north row; the
// plaza fills the middle; 파출소 and 우체국 stand on the south side.
import type { WalkCollider, WalkPoint } from './lounge-walk-world.ts';

export const MARKET_W = 56,
  MARKET_D = 44;

/** kArchive building models the market reuses (already in the hub's manifest). */
export type MarketModel =
  | 'realtyDuplex'
  | 'furnitureShowroom'
  | 'dumplingShop'
  | 'realtyOffice'
  | 'cottage'
  | 'cornerHouse'
  | 'tavernStall'
  | 'grillHut'
  | 'stallHeritage'
  | 'noticeBoard'
  | 'parkBench'
  | 'gardenLantern'
  | 'picnicTable'
  | 'cafeTable'
  | 'produceCrate'
  | 'onggi'
  | 'broadleafTree'
  | 'smallPine'
  | 'shrub'
  | 'barrelRack'
  | 'menuBoard';

export type MarketShopId = 'coop' | 'general' | 'bakery' | 'newspaper' | 'post' | 'police';
export type MarketShop = {
  id: MarketShopId;
  name: string;
  sub: string;
  /** Who runs it (lounge-npc-data.ts). */
  npc: 'nasera' | 'thresh' | 'frieren' | 'janna' | 'sinjjajang' | 'volibas';
  model: MarketModel;
  /** The lot: centre and size (the building is fitted into it, front on z + d/2). */
  x: number;
  z: number;
  w: number;
  d: number;
  /** Building height the model is scaled to (at most). */
  h: number;
  /** Sign colours (canvas, not CSS). */
  sign: { bg: string; ink: string; line: string };
  /** Where the owner stands at work (just outside the door) and faces. */
  counter: WalkPoint;
};

export const MARKET_SHOPS: readonly MarketShop[] = [
  {
    id: 'coop',
    name: '범마을 농협',
    sub: '작물 매입 · 주간 시세',
    npc: 'nasera',
    model: 'realtyDuplex',
    x: -18.5,
    z: -12.5,
    w: 7,
    d: 5,
    h: 4.2,
    sign: { bg: '#e9f0dc', ink: '#2f5a3a', line: '#6f9a58' },
    counter: { x: -18.5, z: -8.8 },
  },
  {
    id: 'general',
    name: '등불 잡화점',
    sub: '씨앗 · 도구 · 수집품',
    npc: 'thresh',
    model: 'furnitureShowroom',
    x: -6.8,
    z: -12.5,
    w: 6.2,
    d: 5.4,
    h: 4.4,
    sign: { bg: '#23302b', ink: '#bff0d4', line: '#58b98a' },
    counter: { x: -6.8, z: -8.6 },
  },
  {
    id: 'bakery',
    name: '느긋한 빵집 카페',
    sub: '빵 · 차 · 늦게 열어요',
    npc: 'frieren',
    model: 'dumplingShop',
    x: 4.6,
    z: -12.5,
    w: 5.2,
    d: 6,
    h: 4.3,
    sign: { bg: '#f6ecd9', ink: '#6b4a2b', line: '#c79a5c' },
    counter: { x: 4.6, z: -8.3 },
  },
  {
    id: 'newspaper',
    name: '범마을 신문',
    sub: '아침 소식 · 날씨 예보',
    npc: 'janna',
    model: 'realtyOffice',
    x: 16.8,
    z: -12.5,
    w: 6.6,
    d: 5.4,
    h: 4.2,
    sign: { bg: '#e8eef6', ink: '#27406b', line: '#5a78ad' },
    counter: { x: 16.8, z: -8.6 },
  },
  {
    id: 'post',
    name: '범마을 우체국',
    sub: '편지 · 소포 · 배달 의뢰',
    npc: 'sinjjajang',
    model: 'cottage',
    x: 18.5,
    z: 9.5,
    w: 6,
    d: 5.4,
    h: 4.6,
    sign: { bg: '#f6e7dc', ink: '#8a2e24', line: '#c9594a' },
    counter: { x: 18.5, z: 13.3 },
  },
  {
    id: 'police',
    name: '범마을 파출소',
    sub: '분실물 · 신고 · 순찰',
    npc: 'volibas',
    model: 'cornerHouse',
    x: -18.5,
    z: 9.5,
    w: 6,
    d: 5,
    h: 4.3,
    sign: { bg: '#e4e9f3', ink: '#1f3561', line: '#4a64a0' },
    counter: { x: -18.5, z: 13.1 },
  },
];
export const marketShop = (id: MarketShopId) => MARKET_SHOPS.find((s) => s.id === id)!;

/** The west road back to the hub (its 큰길 comes in along z −3). */
export const MARKET_EXIT = { x: -MARKET_W / 2 + 0.6, z: -3, stand: { x: -MARKET_W / 2 + 2, z: -3 }, reach: 1.9 } as const;
export const MARKET_ARRIVE: WalkPoint = { x: -MARKET_W / 2 + 2.4, z: -3 };

/** 의뢰 게시판: residents' daily requests (lounge-npc-requests.ts), in the plaza. */
export const MARKET_BOARD = { x: 0, z: 0.4, w: 1.6, d: 0.5, front: { x: 0, z: 1.5 }, reach: 1.6 } as const;

/** Market-day stall spots (일요 장터): the frames always stand, goods only on market day. */
export const MARKET_STALLS: readonly { id: string; model: MarketModel; x: number; z: number; w: number; d: number; h: number; goods: string }[] = [
  { id: 'stall-w', model: 'tavernStall', x: -9, z: 5.2, w: 2.8, d: 2.1, h: 2.6, goods: '#c9824a' },
  { id: 'stall-e', model: 'stallHeritage', x: 9, z: 5.2, w: 2.8, d: 2.2, h: 2.8, goods: '#7fa857' },
  { id: 'stall-sw', model: 'grillHut', x: -5, z: 13.5, w: 2.6, d: 2.4, h: 2.5, goods: '#d9b25a' },
  { id: 'stall-se', model: 'tavernStall', x: 5, z: 13.5, w: 2.8, d: 2.1, h: 2.6, goods: '#b86a8a' },
];

/** Benches (Frieren naps here) and lamps. Benches face +z; lamps are thin posts. */
export const MARKET_BENCHES: readonly { id: string; x: number; z: number; w: number; d: number }[] = [
  { id: 'bench-w', x: -12.5, z: 1.5, w: 2.2, d: 0.9 },
  { id: 'bench-e', x: 12.5, z: 1.5, w: 2.2, d: 0.9 },
];
export const MARKET_LAMPS: readonly WalkPoint[] = [
  { x: -12.4, z: -5.2 },
  { x: 0.2, z: -5.2 },
  { x: 11.2, z: -5.2 },
  { x: -24, z: -5.2 },
  { x: 23.6, z: -5.2 },
  { x: -9.5, z: 9.2 },
  { x: 9.5, z: 9.2 },
];
/** The bakery's outdoor tables (cafe seats). */
export const MARKET_CAFE_TABLES: readonly WalkPoint[] = [
  { x: 9.6, z: -7.6 },
  { x: 11.8, z: -9.2 },
];

/** A picnic table in the plaza's south half and flower planters at its corners. */
export const MARKET_PICNIC: readonly { x: number; z: number; w: number; d: number }[] = [{ x: -0.6, z: 9.8, w: 2.4, d: 2.2 }];
export const MARKET_PLANTERS: readonly { x: number; z: number; w: number; d: number }[] = [
  { x: -9.6, z: -1.6, w: 2, d: 0.8 },
  { x: 9.6, z: -1.6, w: 2, d: 0.8 },
  { x: -4.6, z: 12.4, w: 1.6, d: 0.8 },
  { x: 3.6, z: 12.4, w: 1.6, d: 0.8 },
];
/** Trees: a tree line behind the north row and loose clusters on the sides. */
export const MARKET_TREES: readonly { x: number; z: number; s: number; pine?: boolean }[] = [
  { x: -25.6, z: -18.6, s: 1.9 },
  { x: -12.6, z: -18.8, s: 1.7, pine: true },
  { x: -0.8, z: -18.9, s: 1.8 },
  { x: 10.8, z: -18.8, s: 1.7, pine: true },
  { x: 24.8, z: -18.6, s: 2 },
  { x: -25.8, z: -11, s: 1.8, pine: true },
  { x: 25.6, z: -11.4, s: 1.9 },
  { x: 25.8, z: 1.6, s: 1.8, pine: true },
  { x: 25.4, z: 18.6, s: 1.9 },
  { x: -25.6, z: 18.4, s: 1.8 },
  { x: -25.8, z: 5.2, s: 1.7, pine: true },
  { x: -11.8, z: 19.4, s: 1.7 },
  { x: 11.6, z: 19.4, s: 1.8, pine: true },
  { x: 0.2, z: 19.8, s: 1.6 },
];

const box = (x: number, z: number, w: number, d: number): WalkCollider => ({ shape: 'box', x, z, w, d });
const round = (n: number) => Math.round(n * 1000) / 1000;
/** Everything solid in the market. */
export const MARKET_COLLIDERS: readonly WalkCollider[] = [
  ...MARKET_SHOPS.map((s) => box(s.x, s.z, s.w - 0.2, s.d - 0.3)),
  ...MARKET_STALLS.map((s) => box(s.x, s.z, s.w - 0.2, s.d - 0.2)),
  ...MARKET_BENCHES.map((b) => box(b.x, b.z, b.w, b.d)),
  ...MARKET_CAFE_TABLES.map((t) => ({ shape: 'circle' as const, x: t.x, z: t.z, r: 0.55 })),
  ...MARKET_LAMPS.map((l) => ({ shape: 'circle' as const, x: l.x, z: l.z, r: 0.14 })),
  box(MARKET_BOARD.x, MARKET_BOARD.z, MARKET_BOARD.w, MARKET_BOARD.d),
  ...MARKET_PICNIC.map((t) => box(t.x, t.z, t.w, t.d)),
  ...MARKET_PLANTERS.map((p) => box(p.x, p.z, p.w, p.d)),
  ...MARKET_TREES.map((t) => ({ shape: 'circle' as const, x: t.x, z: t.z, r: round((t.pine ? 0.22 : 0.2) * t.s) })),
];

/** The street and plaza paving (drawn only). */
export const MARKET_PAVING: readonly { x: number; z: number; w: number; d: number; tone: 'road' | 'plaza' }[] = [
  { x: 0, z: -6.2, w: MARKET_W, d: 3.4, tone: 'road' },
  { x: -MARKET_W / 2 + 6, z: -4.2, w: 12, d: 2.6, tone: 'road' },
  { x: 0, z: 5.5, w: 22, d: 16, tone: 'plaza' },
  { x: -18.5, z: 13.2, w: 4, d: 3, tone: 'road' },
  { x: 18.5, z: 13.3, w: 4, d: 3, tone: 'road' },
];

/**
 * Named spots residents use in the market (lounge-npc-schedule.ts): each
 * shop's counter, the benches, the board, the cafe tables and the stalls'
 * fronts. `face` is where they look (radians about y, 0 = toward the camera).
 */
export const MARKET_SPOTS: Readonly<Record<string, WalkPoint & { face: number }>> = {
  ...Object.fromEntries(MARKET_SHOPS.map((s) => [`${s.id}`, { ...s.counter, face: 0 }])),
  'bench-w': { x: -12.5, z: 2.6, face: 0 },
  'bench-e': { x: 12.5, z: 2.6, face: 0 },
  board: { x: 1.2, z: 1.7, face: Math.PI },
  'cafe-seat': { x: 10.6, z: -6.4, face: -0.6 },
  'cafe-seat-2': { x: 13, z: -8, face: -1.2 },
  'stall-w': { x: -9, z: 7.2, face: 0 },
  'stall-e': { x: 9, z: 7.3, face: 0 },
  'stall-sw': { x: -5, z: 15.7, face: 0 },
  'stall-se': { x: 5, z: 15.6, face: 0 },
  'plaza-n': { x: -3.2, z: -2.6, face: 0 },
  'plaza-s': { x: 2.8, z: 9.2, face: Math.PI },
  'street-e': { x: 22, z: -5.6, face: -Math.PI / 2 },
  gate: { ...MARKET_EXIT.stand, face: Math.PI / 2 },
};
