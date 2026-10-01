/**
 * 가게 실내 (2026-10-02): the shops that used to have only an outdoor counter
 * get a walkable room on the common interior standard (lounge-interior-view.ts):
 * 느긋한 빵집 카페, 범마을 농협 and 등불 잡화점 in 시장 거리, 범마을 어시장 at
 * the harbor. Pure data and geometry (no three.js) shared by the server
 * (areas), the 3D rooms (lounge-shop-interior.ts), the flat fallback screen,
 * the residents' schedule and the tests.
 *
 * Coordinates: furniture and resident spots are in room world units (as the
 * bank's BANK_FLOOR_ITEMS); players walk in network units (x 15–85, y 42–88),
 * network = world / 0.2 + (50, 65). The door is the shared INTERIOR_DOOR on the
 * left wall. Every shop has a service counter across the back with its owner
 * behind it; the strip behind the counter is for staff only (the owner and a
 * helper walk round its ends, players are kept out by `staffGates`).
 */
import type { DistrictCounter } from './lounge-district-counters.ts';
import type { NpcId } from './lounge-npc-data.ts';

export type ShopArea = 'bakery' | 'coop' | 'general' | 'fishmarket';
export const SHOP_AREAS: readonly ShopArea[] = ['bakery', 'coop', 'general', 'fishmarket'];
export const isShopArea = (a: unknown): a is ShopArea => typeof a === 'string' && (SHOP_AREAS as readonly string[]).includes(a);

type World = { x: number; z: number };
type Net = { x: number; y: number };
const toNet = (p: World): Net => ({ x: p.x * 5 + 50, y: p.z * 5 + 65 });
export const shopWorld = (p: Net): World => ({ x: (p.x - 50) * 0.2, z: (p.y - 65) * 0.2 });

/** Models a shop room places (new ones in SHOP_INTERIOR_MODELS, the rest already credited). */
export type ShopModel =
  | 'breadStand'
  | 'espresso'
  | 'cakeCase'
  | 'pastryCase'
  | 'flourCart'
  | 'scale'
  | 'fruitCrate'
  | 'seedCabinet'
  | 'goodsGondola'
  | 'basketStand'
  | 'toolTrunk'
  | 'iceBin'
  | 'fishFreezer'
  | 'cafeTable'
  | 'register'
  | 'storageShelf'
  | 'teaSideboard'
  | 'produceCrate'
  | 'banquetChair'
  | 'plantStand'
  | 'hanjiLantern'
  | 'gardenLantern'
  | 'onggi'
  | 'barrelRack'
  | 'fishMackerel'
  | 'fishCod'
  | 'fishHairtail';

/**
 * One piece of furniture: a model fitted into its box without stretching
 * (or a plain box in `color` when `model` is null). `y` lifts it onto a
 * counter or table; `solid: false` pieces (on a counter, against the back
 * wall) never block walking.
 */
export type ShopItem = {
  id: string;
  model: ShopModel | null;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  turn?: number;
  y?: number;
  solid?: boolean;
  color?: string;
};
/** A café chair: residents sit only on the far-side ones (`npc`), friends anywhere. */
export type ShopSeat = { id: string; x: number; z: number; face: number; table: string; npc: boolean };
export type ShopBox = { x: number; z: number; w: number; d: number };

export type ShopInterior = {
  area: ShopArea;
  /** Full and short name (the room's banner, the header). */
  name: string;
  short: string;
  tagline: string;
  chat: string;
  /** The district counter (TownPanel place) the room's counter opens. */
  counter: Extract<DistrictCounter, 'bakery' | 'coop' | 'general' | 'fishmarket'>;
  /** Where the shop's front door is. */
  district: 'market' | 'harbor';
  owner: NpcId;
  /** Second staff member behind the counter (힘멜 helps at the bakery). */
  helper?: NpcId;
  /** The owner's (and helper's) spot behind the counter, world units. */
  ownerAt: World;
  helperAt?: World;
  /** The service counter (blocks walking). */
  desk: ShopBox;
  /** Where a customer stands to use the counter (network units). */
  front: Net;
  /** Players never pass these (the ends of the staff strip); staff walk through. */
  staffGates: readonly ShopBox[];
  items: readonly ShopItem[];
  seats: readonly ShopSeat[];
  /** Resident spots on the shop floor (world units, walkable). */
  spots: Readonly<Record<string, World & { face: number }>>;
  /** Wall signs (text on the back wall, world x and height). */
  signs: readonly { text: string; x: number; y: number; w: number }[];
};

/** Network units within which the counter's action is offered. */
export const SHOP_COUNTER_REACH = 6;
/** Network units within which a free café chair offers 앉기. */
export const SHOP_SEAT_REACH = 4.2;
/** Players are this close to a chair's spot (network units) to count as sitting on it. */
export const SHOP_SEATED_AT = 0.6;
/** Chair spots stand this far (world) from the table's centre. */
const CHAIR_OFF = 0.82;

/** Two chairs per café table: one on the far side (residents too), one toward the camera. */
const cafeTable = (id: string, x: number, z: number): { table: ShopItem; seats: ShopSeat[] } => ({
  table: { id, model: 'cafeTable', x, z, w: 0.9, h: 0.64, d: 0.9 },
  seats: [
    { id: `${id}-back`, x, z: z - CHAIR_OFF, face: 0, table: id, npc: true },
    { id: `${id}-front`, x, z: z + CHAIR_OFF, face: Math.PI, table: id, npc: false },
  ],
});
const cafe = [cafeTable('cafe-1', 2.5, -0.5), cafeTable('cafe-2', 5.3, -0.5), cafeTable('cafe-3', 3.9, 2.55)];

export const SHOP_INTERIORS: Record<ShopArea, ShopInterior> = {
  bakery: {
    area: 'bakery',
    name: '느긋한 빵집 카페',
    short: '빵집',
    tagline: '갓 구운 빵과 따뜻한 차',
    chat: '빵집 수다',
    counter: 'bakery',
    district: 'market',
    owner: 'frieren',
    helper: 'himmel',
    ownerAt: { x: -1.05, z: -4.15 },
    helperAt: { x: 0.4, z: -4.15 },
    desk: { x: -0.32, z: -3.2, w: 2.95, d: 0.85 },
    front: toNet({ x: -0.32, z: -2.05 }),
    staffGates: [
      { x: -2.25, z: -3.75, w: 0.9, d: 1.75 },
      { x: 1.65, z: -3.75, w: 1.0, d: 1.75 },
    ],
    items: [
      // The counter: a cake case and a pastry case side by side.
      { id: 'cake-case', model: 'cakeCase', x: -1.05, z: -3.2, w: 1.45, h: 1.08, d: 0.85, solid: false },
      { id: 'pastry-case', model: 'pastryCase', x: 0.4, z: -3.2, w: 1.45, h: 1.12, d: 0.85, solid: false },
      // Behind the counter, against the back wall.
      { id: 'bread-back-1', model: 'breadStand', x: -3.3, z: -5.5, w: 1.0, h: 1.35, d: 0.8, solid: false },
      { id: 'bread-back-2', model: 'breadStand', x: -2.1, z: -5.5, w: 1.0, h: 1.35, d: 0.8, solid: false },
      { id: 'coffee-sideboard', model: 'teaSideboard', x: 0.2, z: -5.55, w: 1.6, h: 0.95, d: 0.75, solid: false },
      { id: 'espresso', model: 'espresso', x: 0.2, z: -5.5, w: 0.75, h: 0.55, d: 0.6, y: 0.95, solid: false },
      { id: 'shelf-back', model: 'storageShelf', x: 2.4, z: -5.55, w: 1.5, h: 1.8, d: 0.7, solid: false },
      // Bread on the shop floor, by the window side.
      { id: 'bread-floor-1', model: 'breadStand', x: -5.3, z: -2.4, w: 1.0, h: 1.35, d: 0.8, turn: 0.25 },
      { id: 'bread-floor-2', model: 'breadStand', x: -4.0, z: -2.4, w: 1.0, h: 1.35, d: 0.8, turn: -0.15 },
      { id: 'plant-corner', model: 'plantStand', x: 6.45, z: -4.0, w: 1.0, h: 1.2, d: 0.45 },
      ...cafe.map((c) => c.table),
    ],
    seats: cafe.flatMap((c) => c.seats),
    spots: {
      browse: { x: -4.7, z: -1.2, face: Math.PI, },
      window: { x: -2.6, z: 0.2, face: Math.PI / 2 },
      queue: { x: 0.9, z: -1.6, face: Math.PI },
    },
    signs: [
      { text: '오늘의 빵', x: -3.05, y: 2.4, w: 2.0 },
      { text: '차 · 커피', x: 3.05, y: 2.4, w: 2.0 },
    ],
  },
  coop: {
    area: 'coop',
    name: '범마을 농협',
    short: '농협',
    tagline: '땀 흘린 만큼 정직하게',
    chat: '농협 수다',
    counter: 'coop',
    district: 'market',
    owner: 'nasera',
    ownerAt: { x: -0.2, z: -4.15 },
    desk: { x: 0, z: -3.2, w: 3.4, d: 0.85 },
    front: toNet({ x: 0, z: -2.05 }),
    staffGates: [
      { x: -2.15, z: -3.75, w: 0.9, d: 1.75 },
      { x: 2.15, z: -3.75, w: 0.9, d: 1.75 },
    ],
    items: [
      { id: 'desk', model: null, x: 0, z: -3.2, w: 3.4, h: 0.98, d: 0.85, solid: false, color: '#9a7652' },
      { id: 'register', model: 'register', x: 1.05, z: -3.25, w: 0.55, h: 0.45, d: 0.45, y: 0.98, solid: false },
      { id: 'scale', model: 'scale', x: -0.95, z: -3.2, w: 0.55, h: 0.5, d: 0.5, y: 0.98, solid: false },
      { id: 'seed-cabinet', model: 'seedCabinet', x: -3.0, z: -5.45, w: 1.6, h: 1.2, d: 1.0, solid: false },
      { id: 'flour-1', model: 'flourCart', x: 1.7, z: -5.45, w: 0.65, h: 1.0, d: 0.65, solid: false },
      { id: 'flour-2', model: 'flourCart', x: 2.5, z: -5.45, w: 0.65, h: 1.0, d: 0.65, solid: false, turn: 0.3 },
      { id: 'shelf-back', model: 'storageShelf', x: 4.2, z: -5.55, w: 1.5, h: 1.8, d: 0.7, solid: false },
      // Produce tables left and right with crates on them.
      { id: 'table-left', model: null, x: -4.4, z: -0.75, w: 2.4, h: 0.62, d: 1.05, color: '#8c6a48' },
      { id: 'crate-left-1', model: 'produceCrate', x: -5.0, z: -0.75, w: 0.95, h: 0.5, d: 0.75, y: 0.62, solid: false },
      { id: 'crate-left-2', model: 'fruitCrate', x: -3.8, z: -0.75, w: 0.95, h: 0.5, d: 0.75, y: 0.62, solid: false },
      { id: 'table-right', model: null, x: 4.4, z: -0.75, w: 2.4, h: 0.62, d: 1.05, color: '#8c6a48' },
      { id: 'crate-right-1', model: 'fruitCrate', x: 3.8, z: -0.75, w: 0.95, h: 0.5, d: 0.75, y: 0.62, solid: false },
      { id: 'crate-right-2', model: 'produceCrate', x: 5.0, z: -0.75, w: 0.95, h: 0.5, d: 0.75, y: 0.62, solid: false },
      { id: 'flour-floor', model: 'flourCart', x: 6.3, z: -3.3, w: 0.7, h: 1.05, d: 0.7, turn: -0.5 },
      { id: 'onggi-1', model: 'onggi', x: 6.45, z: 3.95, w: 0.75, h: 0.8, d: 0.75 },
      { id: 'onggi-2', model: 'onggi', x: 5.45, z: 4.1, w: 0.6, h: 0.65, d: 0.6 },
      { id: 'crate-stack', model: 'produceCrate', x: 1.8, z: 3.5, w: 0.95, h: 0.5, d: 0.75, turn: 0.2 },
    ],
    seats: [],
    spots: {
      browse: { x: -4.2, z: 0.45, face: Math.PI },
      'browse-2': { x: 4.4, z: 0.45, face: Math.PI },
      drop: { x: 1.4, z: -2.1, face: Math.PI },
    },
    signs: [
      { text: '작물 매입', x: -3.05, y: 2.4, w: 2.0 },
      { text: '이번 주 시세', x: 3.05, y: 2.4, w: 2.0 },
    ],
  },
  general: {
    area: 'general',
    name: '등불 잡화점',
    short: '잡화점',
    tagline: '씨앗부터 등불까지',
    chat: '잡화점 수다',
    counter: 'general',
    district: 'market',
    owner: 'thresh',
    ownerAt: { x: 1.4, z: -4.15 },
    desk: { x: 1.4, z: -3.2, w: 3.2, d: 0.85 },
    front: toNet({ x: 1.4, z: -2.05 }),
    staffGates: [
      { x: -0.65, z: -3.75, w: 0.9, d: 1.75 },
      { x: 3.45, z: -3.75, w: 0.9, d: 1.75 },
    ],
    items: [
      { id: 'desk', model: null, x: 1.4, z: -3.2, w: 3.2, h: 0.98, d: 0.85, solid: false, color: '#4d3f33' },
      { id: 'register', model: 'register', x: 2.35, z: -3.25, w: 0.55, h: 0.45, d: 0.45, y: 0.98, solid: false },
      { id: 'desk-lantern', model: 'hanjiLantern', x: 0.3, z: -3.2, w: 0.4, h: 0.55, d: 0.4, y: 0.98, solid: false },
      { id: 'shelf-back-1', model: 'storageShelf', x: -0.2, z: -5.55, w: 1.5, h: 1.8, d: 0.7, solid: false },
      { id: 'shelf-back-2', model: 'storageShelf', x: 1.5, z: -5.55, w: 1.5, h: 1.8, d: 0.7, solid: false },
      { id: 'seed-cabinet', model: 'seedCabinet', x: 3.4, z: -5.45, w: 1.6, h: 1.2, d: 1.0, solid: false },
      { id: 'gondola-1', model: 'goodsGondola', x: -4.3, z: -2.9, w: 1.35, h: 1.55, d: 0.85 },
      { id: 'gondola-2', model: 'goodsGondola', x: -2.2, z: -0.4, w: 1.35, h: 1.55, d: 0.85 },
      { id: 'baskets', model: 'basketStand', x: -5.3, z: 0.5, w: 0.85, h: 1.1, d: 0.7, turn: 0.4 },
      { id: 'tool-trunk', model: 'toolTrunk', x: 4.8, z: 0.6, w: 0.95, h: 0.85, d: 0.65, turn: -0.3 },
      { id: 'lantern-floor', model: 'gardenLantern', x: 6.4, z: -3.6, w: 0.7, h: 1.4, d: 0.7 },
      { id: 'barrel-rack', model: 'barrelRack', x: 6.1, z: 2.9, w: 1.3, h: 1.1, d: 0.9, turn: -Math.PI / 2 },
      { id: 'lantern-table', model: null, x: 2.4, z: 1.6, w: 1.5, h: 0.7, d: 0.85, color: '#5a4a3a' },
      { id: 'lantern-1', model: 'hanjiLantern', x: 2.0, z: 1.6, w: 0.42, h: 0.6, d: 0.42, y: 0.7, solid: false },
      { id: 'lantern-2', model: 'hanjiLantern', x: 2.8, z: 1.55, w: 0.36, h: 0.5, d: 0.36, y: 0.7, solid: false },
    ],
    seats: [],
    spots: {
      browse: { x: -4.3, z: -1.7, face: Math.PI },
      'browse-2': { x: 2.4, z: 2.7, face: Math.PI },
      lanterns: { x: 5.4, z: -2.2, face: -Math.PI / 2 },
    },
    signs: [
      { text: '씨앗 · 도구', x: -3.05, y: 2.4, w: 2.0 },
      { text: '등불', x: 3.05, y: 2.4, w: 2.0 },
    ],
  },
  fishmarket: {
    area: 'fishmarket',
    name: '범마을 어시장',
    short: '어시장',
    tagline: '오늘 아침 바다에서 온 것',
    chat: '어시장 수다',
    counter: 'fishmarket',
    district: 'harbor',
    owner: 'lux',
    ownerAt: { x: -0.8, z: -4.15 },
    desk: { x: -0.8, z: -3.2, w: 3.2, d: 0.85 },
    front: toNet({ x: -0.8, z: -2.05 }),
    staffGates: [
      { x: -2.85, z: -3.75, w: 0.9, d: 1.75 },
      { x: 1.25, z: -3.75, w: 0.9, d: 1.75 },
    ],
    items: [
      { id: 'desk', model: null, x: -0.8, z: -3.2, w: 3.2, h: 0.95, d: 0.85, solid: false, color: '#5f7d86' },
      { id: 'scale', model: 'scale', x: -1.75, z: -3.2, w: 0.55, h: 0.5, d: 0.5, y: 0.95, solid: false },
      { id: 'register', model: 'register', x: 0.2, z: -3.25, w: 0.55, h: 0.45, d: 0.45, y: 0.95, solid: false },
      { id: 'freezer-back-1', model: 'fishFreezer', x: 2.4, z: -5.45, w: 1.1, h: 1.0, d: 0.75, solid: false },
      { id: 'freezer-back-2', model: 'fishFreezer', x: 3.6, z: -5.45, w: 1.1, h: 1.0, d: 0.75, solid: false },
      { id: 'barrels', model: 'barrelRack', x: -3.4, z: -5.4, w: 1.6, h: 1.2, d: 0.9, solid: false },
      // Ice beds with today's catch.
      { id: 'ice-left', model: null, x: -4.4, z: -1.0, w: 2.6, h: 0.72, d: 1.15, color: '#6b8792' },
      { id: 'fish-left-1', model: 'fishMackerel', x: -5.1, z: -1.05, w: 1.0, h: 0.28, d: 0.45, y: 0.78, solid: false, turn: 0.3 },
      { id: 'fish-left-2', model: 'fishMackerel', x: -4.3, z: -0.85, w: 1.0, h: 0.28, d: 0.45, y: 0.78, solid: false, turn: -0.2 },
      { id: 'fish-left-3', model: 'fishCod', x: -3.6, z: -1.15, w: 1.1, h: 0.32, d: 0.5, y: 0.78, solid: false, turn: 0.15 },
      { id: 'ice-right', model: null, x: 4.2, z: -1.0, w: 2.6, h: 0.72, d: 1.15, color: '#6b8792' },
      { id: 'fish-right-1', model: 'fishHairtail', x: 3.6, z: -0.95, w: 1.3, h: 0.2, d: 0.4, y: 0.78, solid: false, turn: 0.1 },
      { id: 'fish-right-2', model: 'fishCod', x: 4.5, z: -1.1, w: 1.1, h: 0.32, d: 0.5, y: 0.78, solid: false, turn: -0.3 },
      { id: 'fish-right-3', model: 'fishMackerel', x: 5.2, z: -0.85, w: 1.0, h: 0.28, d: 0.45, y: 0.78, solid: false, turn: 0.4 },
      { id: 'ice-bin', model: 'iceBin', x: 6.3, z: -3.4, w: 0.75, h: 1.05, d: 0.6 },
      { id: 'freezer-floor', model: 'fishFreezer', x: 3.4, z: 2.9, w: 1.2, h: 1.1, d: 0.8, turn: -0.15 },
      { id: 'crates', model: 'produceCrate', x: 5.4, z: 3.6, w: 0.95, h: 0.5, d: 0.75, turn: 0.35 },
    ],
    seats: [],
    spots: {
      browse: { x: -4.4, z: 0.2, face: Math.PI },
      'browse-2': { x: 4.2, z: 0.2, face: Math.PI },
      quay: { x: 1.6, z: 1.2, face: 0 },
    },
    signs: [
      { text: '오늘 들어온 생선', x: -3.05, y: 2.4, w: 2.0 },
      { text: '새벽 경매 여섯 시', x: 3.05, y: 2.4, w: 2.0 },
    ],
  },
};

export const shopOf = (area: ShopArea) => SHOP_INTERIORS[area];
/** The room a district counter leads into (null: it stays an outdoor counter). */
export const shopForCounter = (place: string): ShopArea | null =>
  SHOP_AREAS.find((a) => SHOP_INTERIORS[a].counter === place) ?? null;

/** A box's walk blocker in network units (the bank's 4 cm edge allowance included). */
const blocker = (id: string, b: ShopBox, turn = 0) => {
  const c = Math.abs(Math.cos(turn)),
    s = Math.abs(Math.sin(turn));
  const p = toNet(b);
  return { id, x: p.x, y: p.y, rx: (b.w * c + b.d * s) * 2.5 + 0.2, ry: (b.w * s + b.d * c) * 2.5 + 0.2 };
};
export type ShopObstacle = { id: string; x: number; y: number; rx: number; ry: number; staff?: boolean };
/** Café tables block a smaller square so their chairs' spots stay reachable. */
const TABLE_HALF = 0.32;
const obstacleCache = new Map<ShopArea, ShopObstacle[]>();
/** Everything that blocks walking in a shop (network units, before the walker's radius). */
export function shopObstacles(area: ShopArea): ShopObstacle[] {
  let list = obstacleCache.get(area);
  if (list) return list;
  const s = SHOP_INTERIORS[area];
  list = [blocker('desk', s.desk)];
  for (const it of s.items) {
    if (it.solid === false) continue;
    if (it.model === 'cafeTable') list.push(blocker(it.id, { x: it.x, z: it.z, w: TABLE_HALF * 2, d: TABLE_HALF * 2 }));
    else list.push(blocker(it.id, it, it.turn ?? 0));
  }
  for (const [i, g] of s.staffGates.entries()) list.push({ ...blocker(`staff-${i}`, g), staff: true });
  // The whole strip behind the counter, back wall to counter, is staff only.
  const back = s.desk.z - s.desk.d / 2;
  list.push({ ...blocker('staff-strip', { x: s.desk.x, z: (back - 4.9) / 2, w: s.desk.w, d: back + 4.9 }), staff: true });
  obstacleCache.set(area, list);
  return list;
}

/** A chair spot is always standable (sitting down there is the point). */
const onSeat = (p: Net, area: ShopArea) =>
  SHOP_INTERIORS[area].seats.some((s) => {
    const q = toNet(s);
    return Math.hypot(p.x - q.x, p.y - q.y) <= SHOP_SEATED_AT;
  });

/**
 * Can a walker of `radius` (network units) stand here? Staff (the owner and
 * residents walking to the counter) pass the staff gates.
 */
export function shopCanWalk(p: Net, area: ShopArea, radius = 2.2, staff = false): boolean {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  if (p.x < 15 || p.x > 85 || p.y < 42 || p.y > 88) return false;
  if (onSeat(p, area)) return true;
  return !shopObstacles(area).some(
    (o) => (!staff || !o.staff) && Math.abs(p.x - o.x) < o.rx + radius && Math.abs(p.y - o.y) < o.ry + radius,
  );
}

/** Close enough to the counter, on the customers' side. */
export function nearShopCounter(p: Net, area: string): boolean {
  if (!isShopArea(area) || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  const f = SHOP_INTERIORS[area].front;
  return p.y >= f.y - 1 && Math.hypot(p.x - f.x, p.y - f.y) <= SHOP_COUNTER_REACH;
}

/** A chair's spot in network units. */
export const seatPoint = (s: ShopSeat): Net => toNet(s);
/** The chair someone standing at `p` sits on (null: standing). */
export function shopSeatAt(p: Net, area: string): ShopSeat | null {
  if (!isShopArea(area)) return null;
  return (
    SHOP_INTERIORS[area].seats.find((s) => {
      const q = toNet(s);
      return Math.hypot(p.x - q.x, p.y - q.y) <= SHOP_SEATED_AT;
    }) ?? null
  );
}
/** The nearest chair within reach that nobody in `taken` sits on. */
export function nearShopSeat(p: Net, area: string, taken: readonly Net[] = []): ShopSeat | null {
  if (!isShopArea(area)) return null;
  let best: ShopSeat | null = null,
    bestD = SHOP_SEAT_REACH;
  for (const s of SHOP_INTERIORS[area].seats) {
    const q = toNet(s);
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d > bestD || taken.some((t) => Math.hypot(t.x - q.x, t.y - q.y) <= SHOP_SEATED_AT)) continue;
    best = s;
    bestD = d;
  }
  return best;
}

/** Corner spots around every obstacle (walking round them). */
function waypoints(area: ShopArea, radius: number, staff: boolean): Net[] {
  const out: Net[] = [];
  for (const o of shopObstacles(area)) {
    if (staff && o.staff) continue;
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        const q = {
          x: Math.max(15, Math.min(85, o.x + sx * (o.rx + radius + 0.9))),
          y: Math.max(42, Math.min(88, o.y + sy * (o.ry + radius + 0.9))),
        };
        if (shopCanWalk(q, area, radius, staff)) out.push(q);
      }
  }
  return out;
}
const segmentOk = (a: Net, b: Net, area: ShopArea, radius: number, staff: boolean) => {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.5));
  for (let i = 1; i <= n; i++)
    if (!shopCanWalk({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n }, area, radius, staff)) return false;
  return true;
};
const pathCache = new Map<string, Net[]>();
/**
 * The way from `from` to `to` (network units) round the furniture: straight
 * when clear, else the shortest way through corner spots. The last point is
 * the destination. Residents walk as staff with a slimmer radius.
 */
export function shopPath(area: ShopArea, from: Net, to: Net, { staff = false, radius = 2.2 } = {}): Net[] {
  const key = `${area}:${staff}:${radius}:${from.x},${from.y}>${to.x},${to.y}`;
  const hit = pathCache.get(key);
  if (hit) return hit;
  let out: Net[] = [to];
  if (segmentOk(from, to, area, radius, staff) || !shopCanWalk(to, area, radius, staff)) {
    // Straight (or an unreachable goal, walked at directly).
  } else {
    const nodes = [from, ...waypoints(area, radius, staff), to];
    const n = nodes.length;
    const dist = Array.from({ length: n }, () => Infinity),
      prev = Array.from({ length: n }, () => -1),
      done = Array.from({ length: n }, () => false);
    dist[0] = 0;
    for (;;) {
      let u = -1;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || u === n - 1) break;
      done[u] = true;
      for (let v = 0; v < n; v++) {
        if (done[v] || v === u) continue;
        const d = Math.hypot(nodes[v].x - nodes[u].x, nodes[v].y - nodes[u].y);
        if (dist[u] + d >= dist[v] || !segmentOk(nodes[u], nodes[v], area, radius, staff)) continue;
        dist[v] = dist[u] + d;
        prev[v] = u;
      }
    }
    if (prev[n - 1] >= 0) {
      out = [];
      for (let v = n - 1; v > 0; v = prev[v]) out.unshift(nodes[v]);
    }
  }
  if (pathCache.size > 2000) pathCache.clear();
  pathCache.set(key, out);
  return out;
}
/** Residents' slimmer walking radius (network units). */
export const SHOP_STAFF_RADIUS = 1.4;

/**
 * Town actions that may also be done inside a shop room (the counter there
 * opens the same window as the old outdoor counter): the cloud engine accepts
 * them in the district or in this room.
 */
const TOWN_ACTION_SHOP: Readonly<Record<string, ShopArea>> = {
  coopSell: 'coop',
  bakeryBuy: 'bakery',
  auctionSell: 'fishmarket',
};
export const townActionShop = (kind: unknown): ShopArea | null =>
  typeof kind === 'string' && Object.prototype.hasOwnProperty.call(TOWN_ACTION_SHOP, kind) ? TOWN_ACTION_SHOP[kind] : null;

/** Where to step to when getting up from a café chair (away from its table first). */
export function standUpSpot(p: Net, area: ShopArea): Net | null {
  const seat = shopSeatAt(p, area);
  const table = seat && SHOP_INTERIORS[area].items.find((i) => i.id === seat.table);
  if (!seat || !table) return null;
  const q = toNet(seat),
    c = toNet(table);
  const d = Math.hypot(q.x - c.x, q.y - c.y) || 1;
  const ux = (q.x - c.x) / d,
    uy = (q.y - c.y) / d;
  for (const r of [2.6, 3.6, 4.8])
    for (const [ax, ay] of [[ux, uy], [uy, -ux], [-uy, ux]] as const) {
      const s = { x: q.x + ax * r, y: q.y + ay * r };
      if (shopCanWalk(s, area) && !shopSeatAt(s, area)) return s;
    }
  return null;
}
