// 텃밭 확장 (farming upgrade) — static data only. A leaf module: it imports
// nothing from the life engines, so lounge-life.ts, lounge-items.ts and the UI
// can all read it at the top level without an import cycle. Design and the
// numbers: handover/design/design-farming-upgrade.md.
import type { Season } from './lounge-calendar.ts';

const MIN = 60_000,
  HOUR = 3_600_000;

// ---------------------------------------------------------------- crops
/** What a crop becomes in the machines (jar: pickles/jam, keg: juice/wine…). */
export type CropCat = 'veg' | 'fruit' | 'flower' | 'herb';
/** The 16 crops of the farming upgrade (appended after the 10 original ones). */
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
};
/*
 * Profit per hour for a full 6-tile bed, watered (growth × 0.6), seed bought
 * (regrowing crops: every harvest counted, one seed): all new crops land
 * between 1,800/h (flowers, which also feed bee houses) and 5,400/h (인삼,
 * which sags fast on the market) — inside the 1,700–5,400/h band of the
 * original crops. Table: design-farming-upgrade.md §5.
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
  },
  lettuce: {
    name: '상추',
    growMs: 90 * MIN,
    seed: 400,
    sell: 380,
    emoji: '🥬',
    seasons: ['spring', 'summer'],
    regrow: { ms: 90 * MIN, harvests: 5 },
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
  chamoe: { name: '참외', growMs: 7 * HOUR, seed: 1_200, sell: 4_400, emoji: '🍈', seasons: ['summer'] },
  zinnia: { name: '백일홍', growMs: 5 * HOUR, seed: 500, sell: 1_500, emoji: '🌺', seasons: ['summer', 'autumn'] },
  grape: {
    name: '포도',
    growMs: 8 * HOUR,
    seed: 1_500,
    sell: 1_900,
    emoji: '🍇',
    seasons: ['autumn'],
    regrow: { ms: 4 * HOUR, harvests: 4 },
    trellis: true,
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
};
/** Machine category of every crop (the 10 original ones included). */
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
  fruit: 'fruit',
};
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
  lettuce: 12,
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
};

// ---------------------------------------------------------------- quality
/** 별빛 (iridium-like) quality: only with 별빛 비료; chance % + half the plot's gold bonus. */
export const STAR_CHANCE = 10;
export const STAR_MULT = 2;

// ---------------------------------------------------------------- the tile grid
/**
 * 우리 농장 (design-our-farm.md §3-1): every friend's field is a 10 × 8 tile
 * grid in front of their house on the farm. Tile index = row × 10 + column,
 * row 0 at the north (by the house). Size tiers open the top-left block:
 * 6 × 4 = 24 tiles to start, 8 × 6 = 48 and 10 × 8 = 80 when the field is
 * expanded. Each tile holds soil (a plot) or one fixture.
 */
export const GRID_COLS = 10;
export const GRID_ROWS = 8;
export const GRID_TILES = GRID_COLS * GRID_ROWS;
export type FieldSize = 24 | 48 | 80;
export const FIELD_TIERS: readonly { size: FieldSize; cols: number; rows: number }[] = [
  { size: 24, cols: 6, rows: 4 },
  { size: 48, cols: 8, rows: 6 },
  { size: 80, cols: 10, rows: 8 },
];
/** The open block (columns × rows) of a field of `size` tiles. */
export function fieldBlock(size: number): { cols: number; rows: number } {
  const t = FIELD_TIERS.find((f) => f.size === size) ?? FIELD_TIERS[0];
  return { cols: t.cols, rows: t.rows };
}
/** Grid row (0 = north, by the house) and column of a tile. */
export function tileRC(tile: number): { r: number; c: number } {
  return { r: Math.floor(tile / GRID_COLS), c: tile % GRID_COLS };
}
export function tileAt(r: number, c: number): number | null {
  if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return null;
  return r * GRID_COLS + c;
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
/**
 * Beds: the field splits into 3 × 2 blocks (columns 0–2, 3–5, 6–8; row pairs),
 * the unit of a giant crop and of trellis shade. Column 9 is in no bed.
 */
export const BED_COLS = 3;
export const BED_ROWS = 2;
const BEDS_ACROSS = Math.floor(GRID_COLS / BED_COLS);
export const FIELD_BEDS = BEDS_ACROSS * Math.floor(GRID_ROWS / BED_ROWS);
/** Which bed a tile is in (null: column 9, outside every bed). */
export function tileBed(tile: number): number | null {
  const { r, c } = tileRC(tile);
  if (c >= BEDS_ACROSS * BED_COLS) return null;
  return Math.floor(r / BED_ROWS) * BEDS_ACROSS + Math.floor(c / BED_COLS);
}
/** The six tiles of bed `bed`, row-major from its north-west corner. */
export function bedTiles(bed: number): number[] {
  const r0 = Math.floor(bed / BEDS_ACROSS) * BED_ROWS,
    c0 = (bed % BEDS_ACROSS) * BED_COLS;
  const out: number[] = [];
  for (let r = 0; r < BED_ROWS; r++) for (let c = 0; c < BED_COLS; c++) out.push((r0 + r) * GRID_COLS + c0 + c);
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
  return r * GRID_COLS + c;
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
export type FixtureKind = 'sprinkler' | 'sprinkler-q' | 'sprinkler-s' | 'scarecrow' | 'beehouse';
export type MachineKind = 'jar' | 'keg' | 'dehydrator' | 'seedmaker';
export type Recipe = { beom: number; mats: Record<string, number>; skill: 'farm' | 'forage' | 'craft'; level: number };
export type FixtureDef = {
  id: FixtureKind;
  name: string;
  note: string;
  recipe: Recipe;
  /** Sprinklers: tiles watered around it (Chebyshev radius, orthogonal only for radius 0.5). */
  water?: { reach: 'plus' | 'ring' | 'wide'; bonus: number };
  /** Scarecrow: Chebyshev radius protected from crows. */
  guard?: number;
};
export const FIXTURES: readonly FixtureDef[] = [
  {
    id: 'sprinkler',
    name: '스프링클러',
    note: '상하좌우 4칸에 물을 줘요. 새로 심거나 다시 자랄 때 바로 촉촉해요.',
    recipe: { beom: 3_000, mats: { copper: 4, stone: 4 }, skill: 'farm', level: 6 },
    water: { reach: 'plus', bonus: 0 },
  },
  {
    id: 'sprinkler-q',
    name: '품질 스프링클러',
    note: '둘레 8칸에 물을 줘요. 물 효과 +5%p.',
    recipe: { beom: 10_000, mats: { iron: 4, gold: 1 }, skill: 'farm', level: 8 },
    water: { reach: 'ring', bonus: 5 },
  },
  {
    id: 'sprinkler-s',
    name: '별빛 스프링클러',
    note: '둘레 두 겹(5×5)에 물을 줘요. 물 효과 +10%p.',
    recipe: { beom: 40_000, mats: { gold: 6, gem: 1 }, skill: 'farm', level: 10 },
    water: { reach: 'wide', bonus: 10 },
  },
  {
    id: 'scarecrow',
    name: '허수아비',
    note: '둘레 2칸 안의 작물을 까마귀가 못 건드려요.',
    recipe: { beom: 2_000, mats: { wood: 10 }, skill: 'farm', level: 1 },
    guard: 2,
  },
  {
    id: 'beehouse',
    name: '벌통',
    note: '16시간마다 꿀 1병. 둘레 2칸에 다 핀 꽃이 있으면 꽃꿀이 돼요.',
    recipe: { beom: 12_000, mats: { wood: 30, copper: 2 }, skill: 'forage', level: 4 },
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
    note: '채소는 장아찌·김치, 과일은 잼. 16시간. 값은 작물의 2배 + 50.',
    recipe: { beom: 8_000, mats: { stone: 20, wood: 10 }, skill: 'farm', level: 4 },
    ms: 16 * HOUR,
    per: 1,
  },
  {
    id: 'keg',
    name: '숙성통',
    note: '과일·인삼은 술(3배), 채소는 즙(2.25배). 24시간.',
    recipe: { beom: 20_000, mats: { wood: 30, iron: 2 }, skill: 'craft', level: 4 },
    ms: 24 * HOUR,
    per: 1,
  },
  {
    id: 'dehydrator',
    name: '건조기',
    note: '과일·고추·국화 5개를 말려 1개로(7.5배 + 25). 8시간.',
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
};
const KEG_NAME: Readonly<Record<string, string>> = { insam: '인삼주', grape: '포도주', fruit: '과일주' };
const DRY_NAME: Readonly<Record<string, string>> = { pepper: '고춧가루', chrysanthemum: '국화차', fruit: '말린 과일' };
/** Artisan product of `crop` in `machine` (null: the machine does not take it). */
export function productOf(machine: MachineKind, crop: string): string | null {
  const cat = CROP_CAT[crop];
  if (!cat) return null;
  if (machine === 'jar') return cat === 'veg' || cat === 'fruit' ? `jar-${crop}` : null;
  if (machine === 'keg') return cat === 'flower' ? null : `keg-${crop}`;
  if (machine === 'dehydrator') return cat === 'fruit' || crop === 'pepper' || crop === 'chrysanthemum' ? `dry-${crop}` : null;
  return null;
}
/**
 * Every artisan good: `jar-*` 2b + 50, `keg-*` 3b (fruit, herb) or 2.25b (veg),
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
        base: Math.round((cat === 'veg' ? 2.25 : 3) * b),
        machine: 'keg',
        from: crop,
      });
    if (productOf('dehydrator', crop))
      out.push({ id: `dry-${crop}`, name: DRY_NAME[crop] ?? `말린 ${name}`, base: Math.round(7.5 * b + 25), machine: 'dehydrator', from: crop });
  }
  out.push({ id: 'honey', name: '들꽃 꿀', base: HONEY_BASE, machine: 'beehouse', from: null });
  for (const flower of Object.keys(CROP_CAT).filter((c) => CROP_CAT[c] === 'flower'))
    out.push({ id: `honey-${flower}`, name: `${cropName(flower)} 꿀`, base: HONEY_BASE + 2 * cropSell(flower), machine: 'beehouse', from: flower });
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
];
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
