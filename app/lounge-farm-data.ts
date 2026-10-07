// 텃밭 확장 (farming upgrade) — static data only. A leaf module: it imports
// nothing from the life engines, so lounge-life.ts, lounge-items.ts and the UI
// can all read it at the top level without an import cycle. Design and the
// numbers: handover/design/design-farming-upgrade.md.
import type { Season } from './lounge-calendar.ts';

const MIN = 60_000,
  HOUR = 3_600_000;

// ---------------------------------------------------------------- crops
/** What a crop becomes in the machines (jar: pickles/jam, keg: juice/wine…; dairy: 달걀 → 마요네즈, 우유 → 치즈). */
export type CropCat = 'veg' | 'fruit' | 'flower' | 'herb' | 'roe' | 'dairy';
/** The crops of the farming upgrade and 우리 농장 (appended after the 10 original ones). */
export const NEW_CROP_IDS = [
  'garlic',
  'pea',
  'lettuce',
  'tulip',
  'onion',
  'pepper',
  'cucumber',
  'blueberry',
  'chamoe',
  'zinnia',
  'grape',
  'radish',
  'eggplant',
  'chrysanthemum',
  'greenonion',
  'insam',
  // 우리 농장 F2: the third vine under the 덩굴 시렁 (with grape and pea).
  'hop',
  // 우리 농장 F5: a flower for every season (bee houses make their honey) and 깻잎, which keeps regrowing.
  'rapeseed',
  'lavender',
  'buckwheat',
  'narcissus',
  'perilla',
] as const;
export type NewCrop = (typeof NEW_CROP_IDS)[number];
/** Same shape as lounge-life CropInfo (kept structural so this stays a leaf). */
export type NewCropInfo = {
  name: string;
  growMs: number;
  seed: number;
  sell: number;
  emoji: string;
  seasons: readonly Season[];
  regrow?: { ms: number; harvests: number };
  /** Grows up a stake: tall, and shades the tile right behind it (north) in its bed. */
  trellis?: true;
  /** 덩굴 작물 (F2): planted only under a 덩굴 시렁, and nothing else goes there. */
  vine?: true;
};
/*
 * Profit per hour for a full 6-tile bed, watered (growth × 0.6), seed bought,
 * at full price (regrowing crops: every harvest counted, one seed): the new
 * crops land between ~1,600/h (상추) and ~5,400/h (인삼, which sags fast on
 * the market), around the 2,000–5,300/h of the original ten. Flowers earn no
 * more for feeding bee houses: a ripe flower within 2 tiles only turns the
 * house's honey (one jar per 16 h, however many flowers) into that flower's
 * honey. Table: design-farming-upgrade.md §5.
 *
 * 우리 농장 F5 balance (design-our-farm.md §8): 상추 cost 400 and paid back
 * 4.75× its seed over five quick harvests, more than any crop for the effort
 * (and a seed maker turned one 380범 head into seeds worth more): now 700,
 * four harvests of 450 (2.6×, ~1,830/h). 백일홍 and 참외 regrow (참외 sells
 * for less per melon, the same ~4,700/h overall); four new flowers give every
 * season a flower honey (유채꽃 spring, 라벤더 summer, 메밀꽃 autumn, 수선화
 * winter–spring) and 깻잎 is a cheap summer leaf that regrows five times.
 */
export const NEW_CROP_INFO: Record<NewCrop, NewCropInfo> = {
  garlic: { name: '마늘', growMs: 4 * HOUR, seed: 500, sell: 1_900, emoji: '🧄', seasons: ['spring'] },
  pea: {
    name: '완두콩',
    growMs: 5 * HOUR,
    seed: 900,
    sell: 1_300,
    emoji: '🫛',
    seasons: ['spring'],
    regrow: { ms: 2.5 * HOUR, harvests: 4 },
    trellis: true,
    vine: true,
  },
  lettuce: {
    name: '상추',
    growMs: 90 * MIN,
    seed: 700,
    sell: 450,
    emoji: '🥬',
    seasons: ['spring', 'summer'],
    regrow: { ms: 90 * MIN, harvests: 4 },
  },
  tulip: { name: '튤립', growMs: 3 * HOUR, seed: 300, sell: 900, emoji: '🌷', seasons: ['spring'] },
  onion: { name: '양파', growMs: 6 * HOUR, seed: 700, sell: 2_800, emoji: '🧅', seasons: ['spring'] },
  pepper: {
    name: '고추',
    growMs: 6 * HOUR,
    seed: 1_000,
    sell: 1_100,
    emoji: '🌶️',
    seasons: ['summer', 'autumn'],
    regrow: { ms: 3 * HOUR, harvests: 5 },
  },
  cucumber: {
    name: '오이',
    growMs: 4 * HOUR,
    seed: 800,
    sell: 900,
    emoji: '🥒',
    seasons: ['summer'],
    regrow: { ms: 2 * HOUR, harvests: 4 },
    trellis: true,
  },
  blueberry: {
    name: '블루베리',
    growMs: 8 * HOUR,
    seed: 1_500,
    sell: 1_800,
    emoji: '🫐',
    seasons: ['summer'],
    regrow: { ms: 4 * HOUR, harvests: 4 },
  },
  chamoe: {
    name: '참외',
    growMs: 7 * HOUR,
    seed: 1_200,
    sell: 2_600,
    emoji: '🍈',
    seasons: ['summer'],
    regrow: { ms: 3.5 * HOUR, harvests: 3 },
  },
  zinnia: {
    name: '백일홍',
    growMs: 5 * HOUR,
    seed: 500,
    sell: 1_100,
    emoji: '🌺',
    seasons: ['summer', 'autumn'],
    regrow: { ms: 3 * HOUR, harvests: 3 },
  },
  grape: {
    name: '포도',
    growMs: 8 * HOUR,
    seed: 1_500,
    sell: 1_900,
    emoji: '🍇',
    seasons: ['autumn'],
    regrow: { ms: 4 * HOUR, harvests: 4 },
    trellis: true,
    vine: true,
  },
  radish: { name: '무', growMs: 4 * HOUR, seed: 400, sell: 1_500, emoji: '🥕', seasons: ['autumn', 'winter'] },
  eggplant: {
    name: '가지',
    growMs: 5 * HOUR,
    seed: 800,
    sell: 1_000,
    emoji: '🍆',
    seasons: ['summer', 'autumn'],
    regrow: { ms: 2.5 * HOUR, harvests: 4 },
  },
  chrysanthemum: { name: '국화', growMs: 6 * HOUR, seed: 600, sell: 1_700, emoji: '🌼', seasons: ['autumn'] },
  greenonion: {
    name: '대파',
    growMs: 3 * HOUR,
    seed: 600,
    sell: 900,
    emoji: '🌱',
    seasons: ['winter', 'spring'],
    regrow: { ms: 3 * HOUR, harvests: 3 },
  },
  insam: { name: '인삼', growMs: 24 * HOUR, seed: 5_000, sell: 18_000, emoji: '🌿', seasons: ['autumn', 'winter'] },
  // A modest vine: ~270범/h a tile over its four harvests (grape ~300, pea ~340).
  hop: {
    name: '홉',
    growMs: 7 * HOUR,
    seed: 1_200,
    sell: 1_500,
    emoji: '🍃',
    seasons: ['summer'],
    regrow: { ms: 3.5 * HOUR, harvests: 4 },
    trellis: true,
    vine: true,
  },
  rapeseed: { name: '유채꽃', growMs: 4 * HOUR, seed: 400, sell: 1_300, emoji: '🌼', seasons: ['spring'] },
  lavender: { name: '라벤더', growMs: 6 * HOUR, seed: 700, sell: 2_000, emoji: '💜', seasons: ['summer'] },
  buckwheat: { name: '메밀꽃', growMs: 4 * HOUR, seed: 400, sell: 1_250, emoji: '🤍', seasons: ['autumn'] },
  narcissus: { name: '수선화', growMs: 8 * HOUR, seed: 1_000, sell: 2_600, emoji: '🌼', seasons: ['winter', 'spring'] },
  perilla: {
    name: '깻잎',
    growMs: 4 * HOUR,
    seed: 600,
    sell: 560,
    emoji: '🌿',
    seasons: ['summer', 'autumn'],
    regrow: { ms: 2 * HOUR, harvests: 5 },
  },
};
/** Machine category of every crop (the 10 original ones included), village fruit and orchard fruit. */
export const CROP_CAT: Readonly<Record<string, CropCat>> = {
  carrot: 'veg',
  tomato: 'veg',
  pumpkin: 'veg',
  strawberry: 'fruit',
  potato: 'veg',
  spinach: 'veg',
  corn: 'veg',
  watermelon: 'fruit',
  sweetpotato: 'veg',
  cabbage: 'veg',
  garlic: 'veg',
  pea: 'veg',
  lettuce: 'veg',
  tulip: 'flower',
  onion: 'veg',
  pepper: 'veg',
  cucumber: 'veg',
  blueberry: 'fruit',
  chamoe: 'fruit',
  zinnia: 'flower',
  grape: 'fruit',
  radish: 'veg',
  eggplant: 'veg',
  chrysanthemum: 'flower',
  greenonion: 'veg',
  insam: 'herb',
  hop: 'herb',
  rapeseed: 'flower',
  lavender: 'flower',
  buckwheat: 'flower',
  narcissus: 'flower',
  perilla: 'veg',
  fruit: 'fruit',
  // 과수원 fruit (bag items from 하쿠's orchard, lounge-stage3-data ORCHARD_FRUITS).
  apricot: 'fruit',
  peach: 'fruit',
  apple: 'fruit',
  pear: 'fruit',
  tangerine: 'fruit',
  // 양식장 roe (F5, lounge-farm-pond-data.ts): the jar makes 젓갈 / 캐비아 of it.
  roe: 'roe',
  sturgeonroe: 'roe',
  // 축산 가공품 (우리 농장 축사·닭장, 치즈 장인 갈래): 달걀 → 옹기 마요네즈, 우유 → 숙성통 치즈.
  egg: 'dairy',
  milk: 'dairy',
};
/** 큰 달걀 · 진한 우유 make the same good as 달걀 · 우유, one star better (은별). */
export const DAIRY_BIG: Readonly<Record<string, string>> = { 'egg-big': 'egg', 'milk-big': 'milk' };
/** Ranch products (bag items, no quality of their own) the jar and keg take. */
export const DAIRY_INPUTS: readonly string[] = ['egg', 'egg-big', 'milk', 'milk-big'];
/** Quality a 큰 달걀 / 진한 우유 gives its good (은별). */
export const DAIRY_BIG_Q = 1;
/** 축산 가공품: the goods 치즈 장인's bonuses (판매가 · 시간 · 별) apply to. */
export const RANCH_ARTISAN_GOODS: readonly string[] = ['jar-egg', 'keg-milk'];
export const isRanchGoodId = (id: unknown): id is string => typeof id === 'string' && RANCH_ARTISAN_GOODS.includes(id);
/** Crops that may merge into one giant crop when a whole bed (3 × 2) ripens together. */
export const GIANT_CROPS: readonly string[] = ['pumpkin', 'cabbage', 'watermelon'];
/** Chance (%) a full bed of one giant-capable crop, planted together, turns giant. */
export const GIANT_CHANCE = 8;
/** A giant crop gives this many crops per tile instead of one. */
export const GIANT_YIELD = 2;
/** % slower growth for a crop planted right behind (north of) a trellis crop in the same bed. */
export const TRELLIS_SHADE = 10;
/** Demand half-life (units/day) of the new crops (see lounge-life-plus DEMAND_HALF_LIFE). */
export const NEW_CROP_HALF_LIFE: Readonly<Record<NewCrop, number>> = {
  garlic: 6,
  pea: 8,
  lettuce: 10,
  tulip: 8,
  onion: 6,
  pepper: 10,
  cucumber: 8,
  blueberry: 8,
  chamoe: 4,
  zinnia: 8,
  grape: 8,
  radish: 6,
  eggplant: 8,
  chrysanthemum: 8,
  greenonion: 8,
  insam: 2,
  hop: 8,
  rapeseed: 8,
  lavender: 8,
  buckwheat: 8,
  narcissus: 6,
  perilla: 10,
};

// ---------------------------------------------------------------- quality
/** 별빛 (iridium-like) quality: only with 별빛 비료; chance % + half the plot's gold bonus. */
export const STAR_CHANCE = 10;
export const STAR_MULT = 2;

// ---------------------------------------------------------------- the tile grid
/**
 * 우리 농장 (design-our-farm.md §3-1, §11-4): every friend's field is a
 * 12 × 10 tile grid in front of their house on the farm, row 0 at the north
 * (by the house). Size tiers open the top-left block: 6 × 4 = 24 tiles to
 * start, 8 × 6 = 48, 10 × 8 = 80, and (F5, farm Lv10) the whole 12 × 10 = 120.
 * Each tile holds soil (a plot) or one fixture.
 *
 * Tile numbers: the 10 × 8 block keeps the numbers it had before stage 4
 * (row × 10 + column, 0–79) so saved fields read unchanged; F5's ring comes
 * after it: the two east columns of rows 0–7 (80–95, row by row) and the two
 * south rows across all twelve columns (96–119). Always go through tileRC /
 * tileAt, never row × columns + column.
 */
export const GRID_COLS = 12;
export const GRID_ROWS = 10;
export const GRID_TILES = GRID_COLS * GRID_ROWS;
/** The 10 × 8 block numbered as before stage 4 (row × 10 + column). */
export const CORE_COLS = 10;
export const CORE_ROWS = 8;
export const CORE_TILES = CORE_COLS * CORE_ROWS;
const EAST_COLS = GRID_COLS - CORE_COLS;
const EAST_TILES = CORE_ROWS * EAST_COLS;
export type FieldSize = 24 | 48 | 80 | 120;
export const FIELD_TIERS: readonly { size: FieldSize; cols: number; rows: number }[] = [
  { size: 24, cols: 6, rows: 4 },
  { size: 48, cols: 8, rows: 6 },
  { size: 80, cols: 10, rows: 8 },
  { size: 120, cols: 12, rows: 10 },
];
/** The open block (columns × rows) of a field of `size` tiles. */
export function fieldBlock(size: number): { cols: number; rows: number } {
  const t = FIELD_TIERS.find((f) => f.size === size) ?? FIELD_TIERS[0];
  return { cols: t.cols, rows: t.rows };
}
/** Grid row (0 = north, by the house) and column of a tile. */
export function tileRC(tile: number): { r: number; c: number } {
  if (tile < CORE_TILES) return { r: Math.floor(tile / CORE_COLS), c: tile % CORE_COLS };
  if (tile < CORE_TILES + EAST_TILES) {
    const k = tile - CORE_TILES;
    return { r: Math.floor(k / EAST_COLS), c: CORE_COLS + (k % EAST_COLS) };
  }
  const k = tile - CORE_TILES - EAST_TILES;
  return { r: CORE_ROWS + Math.floor(k / GRID_COLS), c: k % GRID_COLS };
}
export function tileAt(r: number, c: number): number | null {
  if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return null;
  if (r < CORE_ROWS) return c < CORE_COLS ? r * CORE_COLS + c : CORE_TILES + r * EAST_COLS + (c - CORE_COLS);
  return CORE_TILES + EAST_TILES + (r - CORE_ROWS) * GRID_COLS + c;
}
/** Whether `tile` is a real tile and open (tilled) on a field of `size` tiles. */
export function tileOpen(size: number, tile: number): boolean {
  if (!Number.isSafeInteger(tile) || tile < 0 || tile >= GRID_TILES) return false;
  const { r, c } = tileRC(tile),
    b = fieldBlock(size);
  return r < b.rows && c < b.cols;
}
/** Open tiles of a field of `size`, in index order. */
export const openTiles = (size: number) => Array.from({ length: GRID_TILES }, (_, i) => i).filter((i) => tileOpen(size, i));
/** Every tile of the grid, row by row (north first), for drawing the field. */
export const GRID_ROWS_TILES: readonly (readonly number[])[] = Array.from({ length: GRID_ROWS }, (_, r) =>
  Array.from({ length: GRID_COLS }, (_, c) => tileAt(r, c)!),
);
/**
 * The tiles a field panel draws, row by row: the old 10 × 8 block until the
 * field reaches stage 4, then the whole 12 × 10 grid (keeps the panels as
 * compact as before for everyone below Lv10).
 */
export const fieldViewRows = (size: number): readonly (readonly number[])[] =>
  size >= GRID_TILES ? GRID_ROWS_TILES : GRID_ROWS_TILES.slice(0, CORE_ROWS).map((row) => row.slice(0, CORE_COLS));
/**
 * Beds: the field splits into 3 × 2 blocks, the unit of a giant crop and of
 * trellis shade. Beds 0–11 cover the old 10 × 8 block's columns 0–8 (numbered
 * as before stage 4); 12–15 the columns 9–11 of rows 0–7; 16–19 the two south
 * rows (columns 0–2, 3–5, 6–8, 9–11).
 */
export const BED_COLS = 3;
export const BED_ROWS = 2;
const CORE_BEDS_ACROSS = Math.floor(CORE_COLS / BED_COLS);
const CORE_BEDS = CORE_BEDS_ACROSS * (CORE_ROWS / BED_ROWS);
const EAST_BEDS = CORE_ROWS / BED_ROWS;
export const FIELD_BEDS = CORE_BEDS + EAST_BEDS + GRID_COLS / BED_COLS;
/** Which bed a tile is in (null outside the grid). */
export function tileBed(tile: number): number | null {
  if (!Number.isSafeInteger(tile) || tile < 0 || tile >= GRID_TILES) return null;
  const { r, c } = tileRC(tile);
  if (r >= CORE_ROWS) return CORE_BEDS + EAST_BEDS + Math.floor(c / BED_COLS);
  if (c >= CORE_BEDS_ACROSS * BED_COLS) return CORE_BEDS + Math.floor(r / BED_ROWS);
  return Math.floor(r / BED_ROWS) * CORE_BEDS_ACROSS + Math.floor(c / BED_COLS);
}
/** The six tiles of bed `bed`, row-major from its north-west corner. */
export function bedTiles(bed: number): number[] {
  let r0: number, c0: number;
  if (bed < CORE_BEDS) {
    r0 = Math.floor(bed / CORE_BEDS_ACROSS) * BED_ROWS;
    c0 = (bed % CORE_BEDS_ACROSS) * BED_COLS;
  } else if (bed < CORE_BEDS + EAST_BEDS) {
    r0 = (bed - CORE_BEDS) * BED_ROWS;
    c0 = CORE_BEDS_ACROSS * BED_COLS;
  } else {
    r0 = CORE_ROWS;
    c0 = (bed - CORE_BEDS - EAST_BEDS) * BED_COLS;
  }
  const out: number[] = [];
  for (let r = 0; r < BED_ROWS; r++) for (let c = 0; c < BED_COLS; c++) out.push(tileAt(r0 + r, c0 + c)!);
  return out;
}
/** Chebyshev distance between two tiles on the grid. */
export function tileDist(a: number, b: number) {
  const p = tileRC(a),
    q = tileRC(b);
  return Math.max(Math.abs(p.r - q.r), Math.abs(p.c - q.c));
}
/** The tile right in front of (south of) `tile` in the same bed, or null. */
export function tileFront(tile: number): number | null {
  const { r, c } = tileRC(tile);
  const front = tileAt(r + 1, c);
  return front !== null && tileBed(tile) !== null && tileBed(front) === tileBed(tile) ? front : null;
}
/** The tile right behind (north of) `tile` in the same bed, or null. */
export function tileBehind(tile: number): number | null {
  const { r, c } = tileRC(tile);
  const behind = tileAt(r - 1, c);
  return behind !== null && tileBed(tile) !== null && tileBed(behind) === tileBed(tile) ? behind : null;
}

// ---------------------------------------------------------------- the old yard grid (read-time migration)
/**
 * Before 우리 농장 a yard was a 3 × 4 grid over two raised beds in the hub:
 * tiles 0–5 the front bed (rows 2–3), 6–11 the back bed (rows 0–1), and the
 * farm was 6 / 9 / 12 tiles. Saved worlds still hold that shape; reading them
 * moves every old tile into the field's top-left 3 × 4 block, same shape
 * (back bed on top, front bed below), and the paid size to the same tier.
 */
export const LEGACY_SIZES = [6, 9, 12] as const;
export const LEGACY_SIZE_TO_FIELD: Readonly<Record<number, FieldSize>> = { 6: 24, 9: 48, 12: 80 };
/** New tile index of old yard tile `old` (0–11), or null for anything else. */
export function legacyTile(old: number): number | null {
  if (!Number.isSafeInteger(old) || old < 0 || old >= 12) return null;
  const c = old % 3,
    r = old < 6 ? 2 + Math.floor(old / 3) : Math.floor((old - 6) / 3);
  return tileAt(r, c)!;
}
/** Old yard tile of a field tile in the top-left 3 × 4 block (inverse of legacyTile), else null. */
export function legacyIndexOf(tile: number): number | null {
  const { r, c } = tileRC(tile);
  if (r >= 4 || c >= 3) return null;
  return r >= 2 ? (r - 2) * 3 + c : 6 + r * 3 + c;
}
/**
 * Seed for per-tile rolls (quality, giant beds): the old yard index inside
 * the migrated block, so crops planted before the move keep their rolls.
 */
export const tileSeed = (tile: number) => legacyIndexOf(tile) ?? 100 + tile;
/** Seed of a bed (the old front bed was 0, the back bed 1). */
export const bedSeed = (bed: number) => (bed === 3 ? 0 : bed === 0 ? 1 : 100 + bed);

// ---------------------------------------------------------------- fixtures (tile objects)
export type FixtureKind = 'sprinkler' | 'sprinkler-q' | 'sprinkler-s' | 'scarecrow' | 'beehouse' | 'trellis';
export type MachineKind = 'jar' | 'keg' | 'dehydrator' | 'seedmaker';
export type Recipe = { beom: number; mats: Record<string, number>; skill: 'farm' | 'forage' | 'craft'; level: number };
export type FixtureDef = {
  id: FixtureKind;
  name: string;
  note: string;
  recipe: Recipe;
  /** Sprinklers: the tiles around it kept wet (plus: the four beside it; ring: 3 × 3; wide: 5 × 5). */
  water?: { reach: 'plus' | 'ring' | 'wide' };
  /** Scarecrow: Chebyshev radius (tiles, from its front-yard spot) protected from crows. */
  guard?: number;
  /** Stands on a front-yard spot, not on a field tile (F2: scarecrow, bee house). */
  yard?: true;
  /** 덩굴 시렁: lies over three field tiles in a row; vines grow under it. */
  span?: number;
};
export const FIXTURES: readonly FixtureDef[] = [
  {
    id: 'sprinkler',
    name: '스프링클러',
    note: '밭 칸 하나에 세워요. 상하좌우 4칸이 늘 촉촉해요.',
    recipe: { beom: 3_000, mats: { copper: 4, stone: 4 }, skill: 'farm', level: 6 },
    water: { reach: 'plus' },
  },
  {
    id: 'sprinkler-q',
    name: '품질 스프링클러',
    note: '밭 칸 하나에 세워요. 둘레 3×3이 늘 촉촉해요.',
    recipe: { beom: 10_000, mats: { iron: 4, gold: 1 }, skill: 'farm', level: 8 },
    water: { reach: 'ring' },
  },
  {
    id: 'sprinkler-s',
    name: '별빛 스프링클러',
    note: '밭 칸 하나에 세워요. 둘레 두 겹(5×5)이 늘 촉촉해요.',
    recipe: { beom: 40_000, mats: { gold: 6, gem: 1 }, skill: 'farm', level: 10 },
    water: { reach: 'wide' },
  },
  {
    id: 'scarecrow',
    name: '허수아비',
    note: '밭 가장자리 앞마당에 세워요. 반경 4칸 안의 작물을 까마귀가 못 건드려요.',
    recipe: { beom: 2_000, mats: { wood: 10 }, skill: 'farm', level: 1 },
    guard: 4,
    yard: true,
  },
  {
    id: 'beehouse',
    name: '벌통',
    note: '밭 가장자리 앞마당에 놓아요. 16시간마다 꿀 1병. 2칸 안에 다 핀 꽃이 있으면 꽃꿀이 돼요.',
    recipe: { beom: 12_000, mats: { wood: 30, copper: 2 }, skill: 'forage', level: 4 },
    yard: true,
  },
  {
    id: 'trellis',
    name: '덩굴 시렁',
    note: '밭 위 가로 3칸에 걸쳐요. 그 아래에는 포도·완두콩·홉 같은 덩굴 작물만 심어요.',
    recipe: { beom: 4_000, mats: { wood: 20, copper: 2 }, skill: 'farm', level: 5 },
    span: 3,
  },
];
export const FIXTURE_BY_ID: Readonly<Record<string, FixtureDef>> = Object.fromEntries(FIXTURES.map((f) => [f.id, f]));
/** Whether sprinkler `kind` at tile `at` waters `tile`. */
export function sprinklerCovers(kind: string, at: number, tile: number) {
  const reach = FIXTURE_BY_ID[kind]?.water?.reach;
  if (!reach || at === tile) return false;
  const p = tileRC(at),
    q = tileRC(tile),
    dr = Math.abs(p.r - q.r),
    dc = Math.abs(p.c - q.c);
  return reach === 'plus' ? dr + dc === 1 : reach === 'ring' ? Math.max(dr, dc) === 1 : Math.max(dr, dc) <= 2;
}

// ---------------------------------------------------------------- machines (work yard)
export type MachineDef = {
  id: MachineKind;
  name: string;
  note: string;
  recipe: Recipe;
  ms: number;
  /** Inputs per batch (건조기: 5). */
  per: number;
};
export const MACHINES: readonly MachineDef[] = [
  {
    id: 'jar',
    name: '옹기',
    note: '채소는 장아찌·김치, 과일은 잼, 어란은 젓갈·캐비아, 달걀은 마요네즈. 16시간. 값은 2배 + 50.',
    recipe: { beom: 8_000, mats: { stone: 20, wood: 10 }, skill: 'farm', level: 4 },
    ms: 16 * HOUR,
    per: 1,
  },
  {
    id: 'keg',
    name: '숙성통',
    note: '과일·인삼은 술(3배), 채소는 즙(2.25배), 우유는 치즈(2.25배). 24시간.',
    recipe: { beom: 20_000, mats: { wood: 30, iron: 2 }, skill: 'craft', level: 4 },
    ms: 24 * HOUR,
    per: 1,
  },
  {
    id: 'dehydrator',
    name: '건조기',
    note: '과일·고추·국화·라벤더 5개를 말려 1개로(7.5배 + 25). 8시간.',
    recipe: { beom: 15_000, mats: { wood: 20, copper: 5 }, skill: 'farm', level: 5 },
    ms: 8 * HOUR,
    per: 5,
  },
  {
    id: 'seedmaker',
    name: '씨앗 제조기',
    note: '작물 1개에서 씨앗 1~2봉. 2시간.',
    recipe: { beom: 10_000, mats: { wood: 20, copper: 5, iron: 1 }, skill: 'farm', level: 9 },
    ms: 2 * HOUR,
    per: 1,
  },
];
export const MACHINE_BY_ID: Readonly<Record<string, MachineDef>> = Object.fromEntries(MACHINES.map((m) => [m.id, m]));
/** Work-yard slots beside the jar terrace (west of the path). */
export const WORK_SLOTS = 4;
export const BEE_MS = 16 * HOUR;
export const HONEY_BASE = 400;
/** 별빛 비료: crafted at the farm (not sold in the shop). */
export const STAR_FERT_RECIPE: Recipe = { beom: 1_500, mats: { 'fertilizer-deluxe': 1, gold: 1 }, skill: 'farm', level: 8 };

// ---------------------------------------------------------------- artisan goods
export type GoodDef = { id: string; name: string; base: number; machine: MachineKind | 'beehouse'; from: string | null };
const JAR_NAME: Readonly<Record<string, string>> = {
  cabbage: '배추김치',
  radish: '깍두기',
  cucumber: '오이지',
  greenonion: '파김치',
  garlic: '마늘장아찌',
  pepper: '고추장아찌',
  tomato: '토마토 절임',
  perilla: '깻잎장아찌',
  roe: '젓갈',
  sturgeonroe: '캐비아',
  egg: '마요네즈',
};
const KEG_NAME: Readonly<Record<string, string>> = { insam: '인삼주', grape: '포도주', hop: '맥주', fruit: '과일주', milk: '치즈' };
const DRY_NAME: Readonly<Record<string, string>> = { pepper: '고춧가루', chrysanthemum: '국화차', lavender: '라벤더차', fruit: '말린 과일' };
/** Flower honey with its own name (the rest: '<flower> 꿀'). */
const HONEY_NAME: Readonly<Record<string, string>> = { rapeseed: '유채꿀', buckwheat: '메밀꿀', lavender: '라벤더꿀', narcissus: '수선화꿀' };
/** Flowers the dehydrator takes besides fruit (dried into tea or powder). */
const DRY_EXTRA: readonly string[] = ['pepper', 'chrysanthemum', 'lavender'];
/** Artisan product of `crop` in `machine` (null: the machine does not take it). */
export function productOf(machine: MachineKind, crop: string): string | null {
  const big = Object.hasOwn(DAIRY_BIG, crop) ? DAIRY_BIG[crop] : undefined;
  if (big) return productOf(machine, big);
  const cat = Object.hasOwn(CROP_CAT, crop) ? CROP_CAT[crop] : undefined;
  if (!cat) return null;
  // 축산 가공품: 달걀 only in the jar (마요네즈), 우유 only in the keg (치즈).
  if (cat === 'dairy') return (machine === 'jar' && crop === 'egg') || (machine === 'keg' && crop === 'milk') ? `${machine}-${crop}` : null;
  if (machine === 'jar') return cat === 'veg' || cat === 'fruit' || cat === 'roe' ? `jar-${crop}` : null;
  if (machine === 'keg') return cat === 'flower' || cat === 'roe' ? null : `keg-${crop}`;
  if (machine === 'dehydrator') return cat === 'fruit' || DRY_EXTRA.includes(crop) ? `dry-${crop}` : null;
  return null;
}
/**
 * Every artisan good: `jar-*` 2b + 50, `keg-*` 3b (fruit, herb) or 2.25b (veg, 치즈),
 * `dry-*` 7.5b + 25 from five, honey 400 (+2× the flower). `b` = the crop's
 * base price, filled in by `buildGoods` from the crop catalog.
 */
export function buildGoods(cropName: (id: string) => string, cropSell: (id: string) => number): GoodDef[] {
  const out: GoodDef[] = [];
  for (const crop of Object.keys(CROP_CAT)) {
    const b = cropSell(crop),
      name = cropName(crop),
      cat = CROP_CAT[crop];
    if (productOf('jar', crop))
      out.push({ id: `jar-${crop}`, name: JAR_NAME[crop] ?? `${name} ${cat === 'fruit' ? '잼' : '장아찌'}`, base: 2 * b + 50, machine: 'jar', from: crop });
    if (productOf('keg', crop))
      out.push({
        id: `keg-${crop}`,
        name: KEG_NAME[crop] ?? (cat === 'veg' ? `${name}즙` : `${name}주`),
        base: Math.round((cat === 'veg' || cat === 'dairy' ? 2.25 : 3) * b),
        machine: 'keg',
        from: crop,
      });
    if (productOf('dehydrator', crop))
      out.push({ id: `dry-${crop}`, name: DRY_NAME[crop] ?? `말린 ${name}`, base: Math.round(7.5 * b + 25), machine: 'dehydrator', from: crop });
  }
  out.push({ id: 'honey', name: '들꽃 꿀', base: HONEY_BASE, machine: 'beehouse', from: null });
  for (const flower of Object.keys(CROP_CAT).filter((c) => CROP_CAT[c] === 'flower'))
    out.push({ id: `honey-${flower}`, name: HONEY_NAME[flower] ?? `${cropName(flower)} 꿀`, base: HONEY_BASE + 2 * cropSell(flower), machine: 'beehouse', from: flower });
  return out;
}
/** Demand half-life of artisan goods (per product id and day); 인삼주 sags faster. */
export const GOOD_HALF_LIFE = 4;
export const GOOD_HALF_LIFE_BY_ID: Readonly<Record<string, number>> = { 'keg-insam': 2 };
/** Whether `id` is an artisan good (jar-*, keg-*, dry-*, honey, honey-<flower>). */
export function isGoodId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  if (id === 'honey') return true;
  const m = /^(jar|keg|dry|honey)-([a-z]+)$/.exec(id);
  if (!m) return false;
  if (m[1] === 'honey') return CROP_CAT[m[2]] === 'flower';
  return productOf(m[1] === 'dry' ? 'dehydrator' : (m[1] as MachineKind), m[2]) === id;
}

// ---------------------------------------------------------------- crows, shipping, fair
/** Crows come at 05:00 KST: with this % chance they eat one growing crop of an unguarded farm. */
export const CROW_CHANCE = 30;
export const CROW_HOUR = 5;
/** Only farms with at least this many growing crops draw crows. */
export const CROW_MIN_CROPS = 4;
/** 품평회 (weekly crop fair, judged by 나세라 조합장 of the 농협). */
export const FAIR_FEE = 2_000;
/** Shares of the week's entry fees paid to 1st / 2nd / 3rd (the rest stays with the 농협). */
export const FAIR_PRIZE_SHARES = [0.5, 0.3, 0.2] as const;
/** Weeks of fair results kept (for the NPC hook and the ribbon wall). */
export const FAIR_HISTORY = 4;
/** Judge data for the NPC system (another module draws 나세라; this is data only). */
export const FAIR_JUDGE = { id: 'naseira', name: '나세라', role: '농협 조합장' } as const;
/**
 * 품평회 score (우리 농장 F5): quality first, then the price. A plain 인삼주
 * used to beat any gold crop on price alone; now the stars count most and the
 * price adds √price × FAIR_PRICE_K points (at most FAIR_PRICE_MAX), plus a
 * little for a crop in season or a hand-made good. A gold strawberry (618)
 * now beats a plain 인삼 (550); a gold carrot (407) still loses to both.
 */
export const FAIR_QUALITY_PTS = [100, 200, 350, 500] as const;
export const FAIR_PRICE_K = 4;
export const FAIR_PRICE_MAX = 400;
export const FAIR_SEASON_PTS = 50;
export const FAIR_GOOD_PTS = 50;
/** Fair points of an entry worth `unit` (normal quality) at quality `q`. */
export const fairPoints = (unit: number, q: 0 | 1 | 2 | 3, extra: { season?: boolean; good?: boolean } = {}) =>
  FAIR_QUALITY_PTS[q] +
  Math.min(FAIR_PRICE_MAX, Math.round(FAIR_PRICE_K * Math.sqrt(Math.max(0, unit)))) +
  (extra.season ? FAIR_SEASON_PTS : 0) +
  (extra.good ? FAIR_GOOD_PTS : 0);
/** Items a shipping bin holds at most (all kinds together). */
export const BIN_MAX = 999;

// ---------------------------------------------------------------- farm items (bag)
/** Placeables and new soil items, registered as bag tools in lounge-items. */
export const FARM_TOOL_ITEMS: readonly { id: string; name: string; note: string }[] = [
  ...FIXTURES.map((f) => ({ id: f.id, name: f.name, note: f.note })),
  ...MACHINES.map((m) => ({ id: m.id, name: m.name, note: m.note })),
  { id: 'fertilizer-star', name: '별빛 비료', note: '품질 +3 · 별빛 작물이 나올 수 있어요' },
  { id: 'speed-gro', name: '성장 촉진제', note: '성장 15% 빠르게 (품질 비료와 같이 줄 수 있어요)' },
  { id: 'retaining', name: '보습 흙', note: '지금 물을 준 상태가 되고, 다시 자랄 때마다 촉촉해요' },
  { id: 'frostcover', name: '서리 덮개', note: '밭의 4분의 1을 덮어 겨울에도 무엇이든 자라요 (한 번 덮으면 그대로)' },
];
/**
 * 서리 덮개 (우리 농장 F5, farm Lv9, design-our-farm.md §11-2): a plastic
 * tunnel over the first quarter of my field (row by row from the house side).
 * Under it any crop may be planted in winter, and crops there do not wither
 * when winter comes. Built once, it covers the field for good and grows with it.
 */
export const FROST_COVER_RECIPE: Recipe = { beom: 60_000, mats: { wood: 40, copper: 10, iron: 4 }, skill: 'farm', level: 9 };
/** Tiles under a frost cover on a field of `size` (a quarter, north rows first). */
export function frostTiles(size: number): number[] {
  return GRID_ROWS_TILES.flat()
    .filter((t) => tileOpen(size, t))
    .slice(0, Math.floor(size / 4));
}
/**
 * 품종 개량소 (F5, design-our-farm.md §11-3): five crops of one kind become
 * one improved seed of it, at most twice a KST day, each batch taking a few
 * hours. An improved seed plants with more gold-star points, and a bed of six
 * improved seeds planted together is twice as likely to turn giant.
 */
export const SEEDLAB_INPUT = 5;
export const SEEDLAB_PER_DAY = 2;
export const SEEDLAB_MS = 4 * HOUR;
export const IMPROVED_GOLD_PTS = 15;
export const IMPROVED_GIANT_MULT = 2;
/** 명인 표지판: stands in front of a stage-4 (120-tile) field with the owner's name. */
export const MASTER_FIELD = 120;
/** Shop prices of the new soil items (fixtures and machines are built, not bought). */
export const FARM_ITEM_PRICES: Readonly<Record<string, number>> = { 'speed-gro': 600, retaining: 500 };
export const SPEED_GRO = 15;

/** Farm actions handled by lounge-farm.ts (dispatched from lounge-life lifeAction). */
export const FARM_ACTION_KINDS = [
  'farmBuild',
  'farmPlace',
  'farmPickup',
  'farmMove',
  'farmLoad',
  'farmCollect',
  'ship',
  'unship',
  'sellGoods',
  'harvestFriend',
  'fairEnter',
] as const;
export type FarmActionKind = (typeof FARM_ACTION_KINDS)[number];
