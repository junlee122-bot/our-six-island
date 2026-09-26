// "범타듀의 하루" life engine: farming, fruit, selling/buying, guestbook,
// mail and status text. Pure functions with injected `now`; the Edge function
// (lounge-cloud-engine.ts) stores the result in `world.life`. Safe to import in
// the client for catalog data and helpers (no room or chess imports).
import {
  grantBeom,
  spendBeom,
  kstDay,
  nextKstMidnight,
  type LoungeLedger,
} from './lounge-economy.ts';
import { dayStart, hash32, rainsOn, seasonOf, type Season } from './lounge-calendar.ts';
import { cleanText, hasUnsafeText, textLength } from './text-clean.ts';
import { ITEM_BY_ID, isItemId, PLUS_ACTION_KINDS } from './lounge-items.ts';
// Cycle-safe: lounge-life-plus.ts imports this module back, so neither module
// may use the other's bindings at the top level (only inside functions).
import {
  farmSizeOf,
  plusAction,
  plusView,
  readLifeExt,
  afterCoreAction,
  plantSpeed,
  villageGrowSpeed,
  demandSold,
  noteDemand,
  sellTotal,
  sellUnit,
  soldBeomToday,
  hasFlag,
  bump,
  discover,
  addCropQ,
  cropQCount,
  takeCrop,
  invCount,
  addInv,
  onGift,
  type LifeExt,
  type PlusAction,
  type PlusView,
  type PlusMe,
} from './lounge-life-plus.ts';
import { SOCIAL_ACTION_KINDS } from './lounge-social-defs.ts';
// 성장 P1 (skills, blacksmith, 마을 개척): same cycle rule as lounge-life-plus.
import { GROWTH_ACTION_KINDS, XP } from './lounge-growth-data.ts';
import {
  gainXp,
  growthAction,
  growthMods,
  growthNeedsSettle,
  growthView,
  readGrowth,
  settleResearch,
  touchGrowth,
  type GrowthAction,
  type GrowthExt,
  type GrowthView,
} from './lounge-growth.ts';
import { socialAction, socialView, type SocialAction, type SocialView } from './lounge-life-social.ts';

/** Base crops (all seasons) first, then the seasonal crops of the life expansion. */
export type Crop =
  | 'carrot'
  | 'tomato'
  | 'pumpkin'
  | 'strawberry'
  | 'potato'
  | 'spinach'
  | 'corn'
  | 'watermelon'
  | 'sweetpotato'
  | 'cabbage';
export const BASE_CROPS: Crop[] = ['carrot', 'tomato', 'pumpkin', 'strawberry'];
export const CROPS: Crop[] = [
  ...BASE_CROPS,
  'potato',
  'spinach',
  'corn',
  'watermelon',
  'sweetpotato',
  'cabbage',
];
const MIN = 60_000,
  HOUR = 3_600_000;
/*
 * Economy (documented in GAME_PROGRESS / POLISH-B / LIFE-A notes; tests pin it):
 * - Start 100,000범, daily grant 3,000범, table stakes ~10,000범.
 * - Profit per hour with all 6 plots watered rises with the crop's length, so
 *   the "twice a day" rhythm (long crops) beats clicking carrots every few
 *   minutes: carrot 2,000/h < tomato 2,800/h < pumpkin ~4,300/h < strawberry
 *   5,000/h. One overnight strawberry bed = 30,000범 (3 table stakes).
 * - The four base crops grow in every season (old bags stay useful). The six
 *   seasonal crops grow only in their seasons (or anywhere once the village
 *   greenhouse is restored) and land in the same 3,000–5,400/h band; corn
 *   regrows twice after the first harvest.
 * - ECON-2 (demand curves): every crop, fruit and item has its own daily
 *   demand. The k-th unit of the same thing sold today pays
 *   unit × max(DEMAND_FLOOR, 0.5^(k / half-life)), recovering at KST midnight
 *   (lounge-life-plus.ts demandMult). Selling a mix pays; one crop in bulk
 *   soon drops below its seed price. Seasonal crops pay +10% in season.
 *   Past MARKET_SOFT범 of sales in a day everything tapers (marketMult).
 *   SELL_CAP_PER_DAY is now only a safety ceiling. Quality: silver ×1.25, gold ×1.5.
 * - Sinks: trophies need a harvest milestone *and* 20k–150k범, palettes come
 *   in tiers (30k → 80k → 150k), seed bundles. All unlocks ≈ 580,000범.
 *   The life expansion adds furniture (5k–40k each), fertilizer, farm
 *   expansion (150k + 400k), rod upgrades (30k + 120k) and the shared village
 *   bundles (1.6M범 in 범 slots) — see lounge-life-plus.ts.
 */
export type CropInfo = {
  name: string;
  growMs: number;
  seed: number;
  sell: number;
  emoji: string;
  /** Seasons it can be planted in (absent = every season). */
  seasons?: readonly Season[];
  /** Regrows after harvest: time to the next harvest and total harvests. */
  regrow?: { ms: number; harvests: number };
};
export const CROP_INFO: Record<Crop, CropInfo> = {
  carrot: { name: '당근', growMs: 30 * MIN, seed: 100, sell: 200, emoji: '🥕' },
  tomato: { name: '토마토', growMs: HOUR, seed: 200, sell: 480, emoji: '🍅' },
  pumpkin: { name: '호박', growMs: 3 * HOUR, seed: 500, sell: 1_800, emoji: '🎃' },
  strawberry: {
    name: '딸기',
    growMs: 8 * HOUR,
    seed: 1_000,
    sell: 4_500,
    emoji: '🍓',
  },
  potato: { name: '감자', growMs: 2 * HOUR, seed: 300, sell: 900, emoji: '🥔', seasons: ['spring'] },
  spinach: {
    name: '시금치',
    growMs: 4 * HOUR,
    seed: 600,
    sell: 2_200,
    emoji: '🥬',
    seasons: ['winter', 'spring'],
  },
  corn: {
    name: '옥수수',
    growMs: 6 * HOUR,
    seed: 800,
    sell: 2_400,
    emoji: '🌽',
    seasons: ['summer', 'autumn'],
    regrow: { ms: 3 * HOUR, harvests: 3 },
  },
  watermelon: {
    name: '수박',
    growMs: 12 * HOUR,
    seed: 2_000,
    sell: 8_000,
    emoji: '🍉',
    seasons: ['summer'],
  },
  sweetpotato: {
    name: '고구마',
    growMs: 6 * HOUR,
    seed: 700,
    sell: 3_000,
    emoji: '🍠',
    seasons: ['autumn'],
  },
  cabbage: {
    name: '배추',
    growMs: 8 * HOUR,
    seed: 1_000,
    sell: 3_600,
    emoji: '🥬',
    seasons: ['autumn', 'winter'],
  },
};
/** Whether a crop can be planted in a season (base crops: always). */
export const cropInSeason = (crop: Crop, season: Season) =>
  !CROP_INFO[crop].seasons || CROP_INFO[crop].seasons!.includes(season);
/** Quality stars: 0 normal, 1 silver, 2 gold. */
export type Quality = 0 | 1 | 2;
export const QUALITY_MULT: Record<Quality, number> = { 0: 1, 1: 1.25, 2: 1.5 };
export const QUALITY_NAME: Record<Quality, string> = { 0: '', 1: '은별', 2: '금별' };
/** [gold below, silver below] out of 100 per fertilizer level. */
export const QUALITY_ODDS: Record<0 | 1 | 2, [number, number]> = {
  0: [5, 25],
  1: [15, 50],
  2: [35, 80],
};
/** Deluxe fertilizer growth bonus (percent faster). */
export const DELUXE_SPEED = 10;
export const MAX_SPEED = 40;
export const FRUIT_SELL = 150;
/** Watering makes the remaining growth 40% shorter (runs at 1/0.6 speed). */
export const WATER_SPEEDUP = 0.4;
export const PLOTS_PER_USER = 6;
/** Farm sizes: 6 plots, expandable to 9 and 12 (see FARM_EXPAND_PRICE). */
export const FARM_SIZES = [6, 9, 12] as const;
export type FarmSize = (typeof FARM_SIZES)[number];
export const FRUIT_TREES = [
  'tree-1',
  'tree-2',
  'tree-3',
  'tree-4',
  'tree-5',
  'tree-6',
] as const;
export type FruitTree = (typeof FRUIT_TREES)[number];
export const FRUIT_COOLDOWN_MS = 6 * HOUR;
/** Safety ceiling of 범 from selling per KST day (demand curves do the pacing). */
export const SELL_CAP_PER_DAY = 100_000;
export const GUESTBOOK_MAX = 30;
export const GUESTBOOK_TEXT_MAX = 80;
export const MAIL_MAX = 30;
export const MAIL_TEXT_MAX = 80;
export const STATUS_TEXT_MAX = 40;
export const TEXT_COOLDOWN_MS = 3_000;
export const SELL_MAX_N = 999;
export const BUY_MAX_N = 20;
export const GIFT_MAX_N = 99;
const BAG_MAX = 99_999;
const MAX_USERS = 16;
export const STARTER_SEEDS: Partial<Record<Crop, number>> = {
  carrot: 3,
  tomato: 2,
};

/** What a milestone counts: harvested crops or picked fruit. */
export type HarvestKind = Crop | 'fruit';
export const HARVEST_KINDS: HarvestKind[] = [...CROPS, 'fruit'];
export type ShopItem = {
  id: string;
  name: string;
  price: number;
  kind: 'seed' | 'bundle' | 'trophy' | 'palette';
  crop?: Crop;
  /** Seeds per purchase ('bundle' only). */
  seeds?: number;
  /** Harvest milestone that must be reached before buying. */
  requires?: { kind: HarvestKind; n: number };
  /** Another unlock that must be owned first (palette tiers). */
  after?: string;
  /** A village flag (마을 공사) that must exist first. */
  flag?: string;
  description: string;
};
/** Korean thousands format without importing UI helpers into the engine. */
const beom = (n: number) => n.toLocaleString('en-US') + '범';
const growText = (crop: Crop) =>
  CROP_INFO[crop].growMs >= HOUR
    ? CROP_INFO[crop].growMs / HOUR + '시간'
    : CROP_INFO[crop].growMs / MIN + '분';
const trophy = (
  id: string,
  name: string,
  price: number,
  kind: HarvestKind,
  n: number,
): ShopItem => ({
  id,
  name,
  price,
  kind: 'trophy',
  requires: { kind, n },
  description: `내 방에 놓는 희귀 소품 · ${kind === 'fruit' ? '과일' : CROP_INFO[kind].name} ${n}개를 ${kind === 'fruit' ? '따면' : '수확하면'} 살 수 있어요`,
});
/** Seed bundles: six seeds (one full bed) at 10% off. */
export const BUNDLE_SEEDS = 6;
export const SHOP: ShopItem[] = [
  ...CROPS.map(
    (crop): ShopItem => ({
      id: 'seed-' + crop,
      name: CROP_INFO[crop].name + ' 씨앗',
      price: CROP_INFO[crop].seed,
      kind: 'seed',
      crop,
      description: `${growText(crop)} 뒤 수확 · ${beom(CROP_INFO[crop].sell)}에 팔려요`,
    }),
  ),
  ...(['pumpkin', 'strawberry'] as const).map(
    (crop): ShopItem => ({
      id: 'bundle-' + crop,
      name: CROP_INFO[crop].name + ' 씨앗 꾸러미',
      price: Math.round((CROP_INFO[crop].seed * BUNDLE_SEEDS * 0.9) / 10) * 10,
      kind: 'bundle',
      crop,
      seeds: BUNDLE_SEEDS,
      description: `밭 한 판(${BUNDLE_SEEDS}칸)을 10% 싸게 · 씨앗 ${BUNDLE_SEEDS}개`,
    }),
  ),
  trophy('trophy-carrot', '황금 당근 트로피', 20_000, 'carrot', 30),
  trophy('trophy-tomato', '루비 토마토 트로피', 40_000, 'tomato', 30),
  trophy('trophy-pumpkin', '대왕 호박 트로피', 80_000, 'pumpkin', 24),
  trophy('trophy-strawberry', '별빛 딸기 트로피', 150_000, 'strawberry', 24),
  trophy('fruit-basket', '과일 바구니', 30_000, 'fruit', 40),
  {
    id: 'palette-pastel',
    name: '파스텔 팔레트',
    price: 30_000,
    kind: 'palette',
    description: '머리색에 파스텔 색 한 줄이 더 생겨요',
  },
  {
    id: 'palette-neon',
    name: '네온 팔레트',
    price: 80_000,
    kind: 'palette',
    after: 'palette-pastel',
    description: '머리색에 네온 색 한 줄 · 파스텔 팔레트 다음 단계',
  },
  {
    id: 'palette-sunset',
    name: '노을 팔레트',
    price: 150_000,
    kind: 'palette',
    after: 'palette-neon',
    description: '머리색에 노을빛 한 줄 · 네온 팔레트 다음 단계',
  },
  {
    id: 'palette-pearl',
    name: '진주 팔레트',
    price: 250_000,
    kind: 'palette',
    after: 'palette-sunset',
    description: '은은한 진줏빛 한정 염색 · 노을 팔레트 다음 단계',
  },
  {
    id: 'palette-aurora',
    name: '오로라 팔레트',
    price: 500_000,
    kind: 'palette',
    after: 'palette-pearl',
    description: '오로라빛 명품 염색 · 진주 팔레트 다음 단계',
  },
  {
    id: 'palette-fountain',
    name: '분수 물빛 팔레트',
    price: 300_000,
    kind: 'palette',
    flag: 'plaza',
    description: '광장 대분수 물빛 염색 · 마을 공사 “광장 대분수”가 끝나면 열려요',
  },
];
export const SHOP_BY_ID: Record<string, ShopItem> = Object.fromEntries(
  SHOP.map((s) => [s.id, s]),
);
export const UNLOCK_IDS = SHOP.filter(
  (s) => s.kind === 'trophy' || s.kind === 'palette',
).map((s) => s.id);
export const PALETTES: Record<
  | 'palette-pastel'
  | 'palette-neon'
  | 'palette-sunset'
  | 'palette-pearl'
  | 'palette-aurora'
  | 'palette-fountain',
  string[]
> = {
  'palette-pastel': ['#f7c6d9', '#c9e4f5', '#d7f2c8', '#fff1b8', '#e3d4f7'],
  'palette-neon': ['#ff2e88', '#00e5ff', '#39ff14', '#ffe600', '#b026ff'],
  'palette-sunset': ['#ff7e5f', '#feb47b', '#c94b4b', '#7b4397', '#f9d423'],
  'palette-pearl': ['#f4efe6', '#e8dfd3', '#dcd6e4', '#efe2e6', '#d9e4e2'],
  'palette-aurora': ['#3ee0b0', '#5a8dee', '#9b6cf0', '#e46fd2', '#1c2f5e'],
  'palette-fountain': ['#8fd0e6', '#5fb7d4', '#bfe8f2', '#3f8fb0', '#e6f7fb'],
};
/** Why an unlock cannot be bought yet (null = buyable apart from 범). */
export function shopLock(
  item: ShopItem,
  owned: readonly string[],
  harvested: Partial<Record<HarvestKind, number>>,
  flags: readonly string[] = [],
): string | null {
  if (item.flag && !flags.includes(item.flag))
    return '마을 공사가 끝나면 열려요';
  if (item.after && !owned.includes(item.after))
    return `${SHOP_BY_ID[item.after]?.name ?? '이전 단계'}부터 사야 해요`;
  if (item.requires) {
    const have = harvested[item.requires.kind] ?? 0;
    if (have < item.requires.n) {
      const what =
        item.requires.kind === 'fruit' ? '과일' : CROP_INFO[item.requires.kind].name;
      return `${what} ${have}/${item.requires.n}개 ${item.requires.kind === 'fruit' ? '땀' : '수확'}`;
    }
  }
  return null;
}

export type Plot = {
  crop: Crop | null;
  plantedAt: number;
  wateredAt: number | null;
  /** Fertilizer level (quality odds; deluxe also grows faster). */
  fert?: 1 | 2;
  /** Percent faster growth (deluxe fertilizer, 초록 손 buff), ≤ MAX_SPEED. */
  speed?: number;
  /** Harvests already taken from a regrowing crop. */
  n?: number;
  /** 성장: gold-star chance +%p from the planter's hoe and farming (set at planting). */
  g?: number;
  /** 성장: watering speed-up +%p from the waterer's can (set when watered by hand). */
  w?: number;
};
export type Bag = {
  seeds: Record<Crop, number>;
  produce: Record<Crop, number>;
  fruit: number;
};
export type GuestEntry = { from: string; actor: number; text: string; at: number };
export type Gift =
  | { kind: 'produce'; crop: Crop; n: number }
  | { kind: 'fruit'; n: number }
  /** Life-expansion items (fish, bugs, forage, dishes, materials). */
  | { kind: 'item'; item: string; n: number };
export type MailItem = {
  id: string;
  from: string;
  actor: number;
  text: string;
  sticker?: string;
  gift?: Gift;
  at: number;
  read: boolean;
};
export type LifeState = {
  farms: Record<string, Plot[]>;
  bag: Record<string, Bag>;
  fruitPickedAt: Record<string, Record<string, number>>;
  unlocks: Record<string, string[]>;
  guestbook: Record<string, GuestEntry[]>;
  mail: Record<string, MailItem[]>;
  status: Record<string, { text: string; at: number }>;
  /** uid → actor for everyone who has used the life engine. */
  actors: Record<string, number>;
  /** 범 sold per user on a KST day (daily sell cap). */
  sold: Record<string, { day: number; amount: number }>;
  /** Last guestbook/mail/status write per user (3s rate limit). */
  lastText: Record<string, number>;
  /** Monotonic counter for unique ledger entry and mail ids. */
  seq: number;
  /**
   * Each member's room: who may walk in, and a revision the owner bumps after
   * saving decoration edits so visitors refetch the room. Optional in older worlds.
   */
  rooms?: Record<string, RoomState>;
  /** When each owner last opened their guestbook (entries after it are unread). */
  guestbookSeen?: Record<string, number>;
  /** Lifetime harvest/pick counts per user (trophy milestones). Optional. */
  harvested?: Record<string, Partial<Record<HarvestKind, number>>>;
} & LifeExt &
  GrowthExt;
export type RoomAccess = 'public' | 'friends' | 'closed';
export const ROOM_ACCESS_VALUES: readonly RoomAccess[] = ['public', 'friends', 'closed'];
export type RoomState = { access: RoomAccess; rev: number };
export type LifeAction =
  | { kind: 'plant'; plot: number; crop: Crop }
  | { kind: 'water'; plot: number }
  | { kind: 'harvest'; plot: number }
  | { kind: 'pick'; tree: string }
  | { kind: 'sell'; crop: Crop | 'fruit'; n: number; quality?: Quality }
  | { kind: 'buy'; item: string; n?: number }
  | { kind: 'guestbook'; owner: number | string; text: string }
  | {
      kind: 'mail';
      to: number | string;
      text: string;
      sticker?: string;
      gift?: Gift;
    }
  | { kind: 'readMail'; id: string }
  | { kind: 'status'; text: string }
  /** Room access setting and/or "my room changed" revision bump (owner only). */
  | { kind: 'room'; access?: RoomAccess }
  /** The owner looked at their guestbook (clears the unread badge). */
  | { kind: 'readGuestbook' }
  | PlusAction
  /** Friend NPC talk, my NPC lines, festivals, 마을 적응하기 (lounge-life-social.ts). */
  | SocialAction
  /** Skills, blacksmith, 마을 개척, material nodes (lounge-growth.ts). */
  | GrowthAction;
export const LIFE_ACTION_KINDS = [
  'plant',
  'water',
  'harvest',
  'pick',
  'sell',
  'buy',
  'guestbook',
  'mail',
  'readMail',
  'status',
  'room',
  'readGuestbook',
  ...PLUS_ACTION_KINDS,
  ...SOCIAL_ACTION_KINDS,
  ...GROWTH_ACTION_KINDS,
] as const;
export const isLifeAction = (a: unknown): a is LifeAction =>
  !!a &&
  typeof a === 'object' &&
  (LIFE_ACTION_KINDS as readonly string[]).includes(
    (a as { kind?: unknown }).kind as string,
  );

export const LIFE_REJECT = {
  invalid: '요청을 처리할 수 없어요. 화면을 새로 고친 뒤 다시 시도해 주세요.',
  plot: '밭 칸을 확인해 주세요.',
  occupied: '이미 작물이 자라고 있는 칸이에요.',
  noSeed: '씨앗이 없어요. 상점에서 씨앗을 사 주세요.',
  empty: '비어 있는 칸이에요.',
  watered: '이미 물을 줬어요.',
  grown: '이미 다 자랐어요. 수확해 주세요.',
  notReady: '아직 다 자라지 않았어요.',
  nothingReady: '수확할 작물이 없어요.',
  tree: '과일나무를 확인해 주세요.',
  treeWait: '이 나무의 과일은 아직 익지 않았어요. 나중에 다시 와 주세요.',
  notEnough: '가방에 그만큼 없어요.',
  sellCap: `오늘 팔 수 있는 한도(${SELL_CAP_PER_DAY.toLocaleString('en-US')}범)를 넘어요.`,
  noEmpty: '빈 칸이 없어요.',
  nothingToWater: '물을 줄 작물이 없어요.',
  locked: '아직 살 수 없는 물건이에요.',
  item: '상점에 없는 물건이에요.',
  owned: '이미 가지고 있는 물건이에요.',
  balance: '잔액이 부족해요.',
  text: '글자를 확인해 주세요.',
  textLong: '글이 너무 길어요.',
  textRate: '잠시 후에 다시 써 주세요.',
  friend: '아직 마을에 온 적 없는 친구예요.',
  self: '나에게는 편지를 보낼 수 없어요.',
  mail: '편지를 찾을 수 없어요.',
  sticker: '스티커를 확인해 주세요.',
  gift: '선물을 확인해 주세요.',
  season: '지금은 심을 수 없는 계절이에요.',
  rained: '비가 와서 이미 촉촉해요.',
  quality: '품질을 확인해 주세요.',
} as const;
export class LifeError extends Error {
  status = 409;
}
function fail(message: string): never {
  throw new LifeError(message);
}

// ---------------------------------------------------------------- helpers
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safe = (n: unknown): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n);
const time = (n: unknown) => (safe(n) && n >= 0 ? n : 0);
const count = (n: unknown) =>
  safe(n) && n >= 0 ? Math.min(n, BAG_MAX) : 0;
const isCrop = (c: unknown): c is Crop => CROPS.includes(c as Crop);
const actorValid = (a: unknown): a is number => safe(a) && a >= 0 && a < 7;
const cropCounts = (): Record<Crop, number> =>
  Object.fromEntries(CROPS.map((c) => [c, 0])) as Record<Crop, number>;
const emptyPlot = (): Plot => ({ crop: null, plantedAt: 0, wateredAt: null });
export const emptyBag = (): Bag => ({
  seeds: cropCounts(),
  produce: cropCounts(),
  fruit: 0,
});
const starterBag = (): Bag => {
  const bag = emptyBag();
  for (const crop of CROPS) bag.seeds[crop] = STARTER_SEEDS[crop] ?? 0;
  return bag;
};
export const emptyLife = (): LifeState => ({
  farms: {},
  bag: {},
  fruitPickedAt: {},
  unlocks: {},
  guestbook: {},
  mail: {},
  status: {},
  actors: {},
  sold: {},
  lastText: {},
  seq: 0,
});
/**
 * Text for guestbook/mail/status: trimmed, bounded, and REJECTED (not
 * silently changed) when it holds control/bidi characters or a lone surrogate.
 * Stored text is re-read with the shared lenient `cleanText` (text-clean.ts).
 */
export function lifeText(value: unknown, max: number, allowEmpty = false) {
  if (typeof value !== 'string') return fail(LIFE_REJECT.text);
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text && !allowEmpty) return fail(LIFE_REJECT.text);
  if (hasUnsafeText(value.trim())) return fail(LIFE_REJECT.text);
  if (textLength(text) > max) return fail(LIFE_REJECT.textLong);
  return text;
}

// ---------------------------------------------------------------- growth
/** Growth time of this plot's current cycle (regrow cycles are shorter). */
export function plotGrowMs(plot: Plot) {
  if (!plot.crop) return 0;
  const info = CROP_INFO[plot.crop],
    base = (plot.n ?? 0) > 0 && info.regrow ? info.regrow.ms : info.growMs;
  return Math.ceil((base * (100 - Math.min(MAX_SPEED, plot.speed ?? 0))) / 100);
}
/**
 * When rain watered this plot (the start of the first rainy KST day on or
 * after planting, never before planting), or null. Only rain that has begun
 * by `now` counts; the forecast is deterministic (lounge-calendar weatherOf).
 */
export function plotRainAt(plot: Plot, now = Infinity): number | null {
  if (!plot.crop) return null;
  const end = Math.min(now, plot.plantedAt + plotGrowMs(plot));
  for (let d = kstDay(plot.plantedAt); d <= kstDay(end) && d <= kstDay(plot.plantedAt) + 3; d++)
    if (rainsOn(d)) {
      const at = Math.max(plot.plantedAt, dayStart(d));
      return at <= end ? at : null;
    }
  return null;
}
/** Effective watering time: by hand or by rain, whichever came first. */
export function plotWateredAt(plot: Plot, now = Infinity): number | null {
  const rain = plotRainAt(plot, now),
    hand = plot.wateredAt !== null && plot.wateredAt >= plot.plantedAt ? plot.wateredAt : null;
  return rain === null ? hand : hand === null ? rain : Math.min(rain, hand);
}
/**
 * When a planted crop is ready (server clock), or null for an empty plot.
 * Rain that has started by `now` waters the plot (default: the whole forecast).
 */
export function plotReadyAt(plot: Plot, now = Infinity): number | null {
  if (!plot.crop) return null;
  const grow = plotGrowMs(plot),
    w = plotWateredAt(plot, now);
  if (w === null) return plot.plantedAt + grow;
  const done = w - plot.plantedAt;
  if (done >= grow) return plot.plantedAt + grow;
  // After watering, the remaining growth runs 40% shorter (+ the can's tier, 성장).
  return w + Math.ceil((grow - done) * (1 - WATER_SPEEDUP - (plot.w ?? 0) / 100));
}
/** Quality this plot will give at harvest (deterministic per planting). */
export function plotQuality(uid: string, index: number, plot: Plot): Quality {
  if (!plot.crop) return 0;
  const roll = hash32(`q:${uid}:${index}:${plot.plantedAt}:${plot.crop}`) % 100,
    [gold, silver] = QUALITY_ODDS[plot.fert ?? 0],
    bonus = plot.g ?? 0;
  return roll < gold + bonus ? 2 : roll < silver + bonus ? 1 : 0;
}
export function plotProgress(plot: Plot, now: number) {
  const ready = plotReadyAt(plot, now);
  if (ready === null) return 0;
  if (now >= ready) return 1;
  const total = ready - plot.plantedAt;
  return total <= 0 ? 1 : Math.max(0, (now - plot.plantedAt) / total);
}
/** 0 = empty or just planted, 1 = sprout, 2 = growing, 3 = ready. */
export function plotStage(plot: Plot, now: number): 0 | 1 | 2 | 3 {
  if (!plot.crop) return 0;
  const p = plotProgress(plot, now);
  return p >= 1 ? 3 : p >= 2 / 3 ? 2 : p >= 1 / 3 ? 1 : 0;
}
/** Deterministic 1–3 fruit per pick (no RNG in the pure engine). */
function fruitYield(uid: string, tree: string, now: number, seq: number) {
  let h = 2166136261;
  for (const ch of `${uid}:${tree}:${now}:${seq}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 3) + 1;
}

// ---------------------------------------------------------------- loading
function readPlot(value: unknown): Plot {
  const p = (value ?? {}) as Partial<Plot>;
  if (!isCrop(p.crop)) return emptyPlot();
  const out: Plot = {
    crop: p.crop,
    plantedAt: time(p.plantedAt),
    wateredAt: p.wateredAt === null || p.wateredAt === undefined ? null : time(p.wateredAt),
  };
  if (p.fert === 1 || p.fert === 2) out.fert = p.fert;
  if (safe(p.speed) && p.speed > 0) out.speed = Math.min(MAX_SPEED, p.speed);
  const regrow = CROP_INFO[p.crop].regrow;
  if (regrow && safe(p.n) && p.n > 0) out.n = Math.min(regrow.harvests - 1, p.n);
  if (safe(p.g) && p.g > 0) out.g = Math.min(40, p.g);
  if (safe(p.w) && p.w > 0) out.w = Math.min(30, p.w);
  return out;
}
/** Farm length for a stored array (6, 9 or 12; anything else → 6). */
const farmLength = (f: unknown) =>
  Array.isArray(f) && (FARM_SIZES as readonly number[]).includes(f.length) ? f.length : PLOTS_PER_USER;
function readBag(value: unknown): Bag {
  const b = (value ?? {}) as Partial<Bag>,
    bag = emptyBag();
  for (const crop of CROPS) {
    bag.seeds[crop] = count(b.seeds?.[crop]);
    bag.produce[crop] = count(b.produce?.[crop]);
  }
  bag.fruit = count(b.fruit);
  return bag;
}
function readGift(value: unknown): Gift | undefined {
  const g = value as Partial<{ kind: string; crop: unknown; n: unknown }> | null;
  if (!g || typeof g !== 'object' || !safe(g.n) || g.n < 1 || g.n > GIFT_MAX_N)
    return;
  if (g.kind === 'fruit') return { kind: 'fruit', n: g.n };
  if (g.kind === 'produce' && isCrop(g.crop))
    return { kind: 'produce', crop: g.crop, n: g.n };
  const item = (g as { item?: unknown }).item;
  if (g.kind === 'item' && isItemId(item) && ITEM_BY_ID[item].kind !== 'tool')
    return { kind: 'item', item, n: g.n };
}
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
function users<T>(
  value: unknown,
  read: (v: unknown) => T | undefined,
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(obj(value)).slice(0, MAX_USERS * 2)) {
    if (!UUID.test(k) || Object.keys(out).length >= MAX_USERS) continue;
    const r = read(v);
    if (r !== undefined) out[k] = r;
  }
  return out;
}
/** Room access/revision per member; omitted when empty (older worlds stay equal). */
function guestbookSeenOf(value: unknown): { guestbookSeen?: Record<string, number> } {
  const seen = users(value, (t) => (safe(t) && t > 0 ? t : undefined));
  return Object.keys(seen).length ? { guestbookSeen: seen } : {};
}
function roomsOf(value: unknown): { rooms?: Record<string, RoomState> } {
  const rooms = users(value, (r) => {
    const x = obj(r);
    return ROOM_ACCESS_VALUES.includes(x.access as RoomAccess)
      ? { access: x.access as RoomAccess, rev: safe(x.rev) && x.rev >= 0 ? x.rev : 0 }
      : undefined;
  });
  return Object.keys(rooms).length ? { rooms } : {};
}
/**
 * Normalizes `world.life` (absent in older worlds → empty). Everything is
 * bounded so a corrupt or hostile value cannot grow the world row.
 */
export function readLife(value: unknown): LifeState {
  const v = obj(value);
  const entry = (e: unknown): GuestEntry | null => {
    const x = obj(e);
    if (typeof x.from !== 'string' || !UUID.test(x.from) || !actorValid(x.actor))
      return null;
    const text = cleanText(x.text, GUESTBOOK_TEXT_MAX);
    return text ? { from: x.from, actor: x.actor, text, at: time(x.at) } : null;
  };
  const mail = (e: unknown): MailItem | null => {
    const x = obj(e);
    if (
      typeof x.id !== 'string' ||
      !/^[A-Za-z0-9-]{1,64}$/.test(x.id) ||
      typeof x.from !== 'string' ||
      !UUID.test(x.from) ||
      !actorValid(x.actor)
    )
      return null;
    const gift = readGift(x.gift),
      sticker =
        typeof x.sticker === 'string' && /^[a-z0-9-]{1,24}$/.test(x.sticker)
          ? x.sticker
          : undefined;
    return {
      id: x.id,
      from: x.from,
      actor: x.actor,
      text: cleanText(x.text, MAIL_TEXT_MAX),
      ...(sticker ? { sticker } : {}),
      ...(gift ? { gift } : {}),
      at: time(x.at),
      read: x.read === true,
    };
  };
  return {
    farms: users(v.farms, (f) =>
      Array.from({ length: farmLength(f) }, (_, i) =>
        readPlot(Array.isArray(f) ? f[i] : null),
      ),
    ),
    bag: users(v.bag, readBag),
    fruitPickedAt: users(v.fruitPickedAt, (t) => {
      const out: Record<string, number> = {};
      for (const tree of FRUIT_TREES) {
        const at = obj(t)[tree];
        if (safe(at) && at > 0) out[tree] = at;
      }
      return out;
    }),
    unlocks: users(v.unlocks, (u) =>
      Array.isArray(u)
        ? [...new Set(u.filter((id) => UNLOCK_IDS.includes(id)))]
        : [],
    ),
    guestbook: users(v.guestbook, (g) =>
      Array.isArray(g)
        ? g
            .slice(-GUESTBOOK_MAX)
            .map(entry)
            .filter((e): e is GuestEntry => !!e)
        : [],
    ),
    mail: users(v.mail, (m) =>
      Array.isArray(m)
        ? m
            .slice(-MAIL_MAX)
            .map(mail)
            .filter((e): e is MailItem => !!e)
        : [],
    ),
    status: users(v.status, (s) => {
      const x = obj(s),
        text = cleanText(x.text, STATUS_TEXT_MAX);
      return text ? { text, at: time(x.at) } : undefined;
    }),
    actors: users(v.actors, (a) => (actorValid(a) ? a : undefined)),
    sold: users(v.sold, (s) => {
      const x = obj(s);
      return safe(x.day) && safe(x.amount) && x.amount >= 0
        ? { day: x.day, amount: x.amount }
        : undefined;
    }),
    lastText: users(v.lastText, (t) => (safe(t) && t > 0 ? t : undefined)),
    seq: safe(v.seq) && v.seq >= 0 ? v.seq : 0,
    ...roomsOf(v.rooms),
    ...guestbookSeenOf(v.guestbookSeen),
    ...harvestedOf(v.harvested),
    ...readLifeExt(v),
    ...readGrowth(v.growth),
  };
}
function harvestedOf(value: unknown): Pick<LifeState, 'harvested'> {
  const harvested = users(value, (h) => {
    const x = obj(h),
      out: Partial<Record<HarvestKind, number>> = {};
    for (const kind of HARVEST_KINDS) {
      const n = count(x[kind]);
      if (n > 0) out[kind] = n;
    }
    return Object.keys(out).length ? out : undefined;
  });
  return Object.keys(harvested).length ? { harvested } : {};
}
const countHarvest = (life: LifeState, uid: string, kind: HarvestKind, n: number) => {
  const mine = ((life.harvested ??= {})[uid] ??= {});
  mine[kind] = addCount(mine[kind] ?? 0, n);
};
/** Registers a member: actor mapping, starter seeds and an empty farm. */
export function ensureLifeMember(
  life: LifeState,
  uid: string,
  actor: number,
): LifeState {
  if (!UUID.test(uid) || !actorValid(actor)) fail(LIFE_REJECT.invalid);
  const size = farmSizeOf(life, uid);
  if (life.actors[uid] === actor && life.bag[uid] && life.farms[uid]?.length === size)
    return life;
  const next = cloneLife(life);
  // One uid per actor: a re-created account replaces the old mapping.
  for (const [id, a] of Object.entries(next.actors))
    if (a === actor && id !== uid) delete next.actors[id];
  next.actors[uid] = actor;
  next.bag[uid] ??= starterBag();
  const farm = (next.farms[uid] ??= []);
  while (farm.length < size) farm.push(emptyPlot());
  farm.length = size;
  return next;
}
export const uidOf = (life: LifeState, target: unknown): string | null => {
  if (typeof target === 'string' && UUID.test(target))
    return target in life.actors ? target : null;
  if (!actorValid(target)) return null;
  return (
    Object.entries(life.actors).find(([, a]) => a === target)?.[0] ?? null
  );
};
export function sellCapLeft(life: LifeState, uid: string, now: number) {
  const s = life.sold[uid];
  return SELL_CAP_PER_DAY - (s && s.day === kstDay(now) ? s.amount : 0);
}
const plotIndex = (plot: unknown, size: number) =>
  safe(plot) && plot >= 0 && plot < size ? plot : fail(LIFE_REJECT.plot);
const pushBounded = <T>(list: T[] | undefined, item: T, max: number) =>
  [...(list ?? []), item].slice(-max);
export const addCount = (n: number, add: number) => Math.min(BAG_MAX, n + add);

// ---------------------------------------------------------------- actions
/**
 * Copy of the life state for one transition. Mail, guestbooks and memories
 * are only ever replaced (never mutated in place), so their per-user lists are
 * shared; everything else is deep-copied. Keeps key order.
 */
const SHARED_KEYS = new Set(['mail', 'guestbook', 'memories']);
export function cloneLife(life: LifeState): LifeState {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(life))
    out[key] = SHARED_KEYS.has(key)
      ? Array.isArray(value)
        ? value
        : { ...(value as object) }
      : typeof value === 'object' && value !== null
        ? structuredClone(value)
        : value;
  return out as LifeState;
}
/**
 * Applies one life action for `member`. Returns new state and ledger (inputs
 * are not mutated). Throws LifeError with a Korean message on rejection.
 */
export function lifeAction(
  original: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  action: LifeAction,
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  if (!isLifeAction(action)) fail(LIFE_REJECT.invalid);
  const life = cloneLife(ensureLifeMember(original, member.id, member.actor));
  const uid = member.id,
    wallet = 'wallet-' + uid,
    bag = life.bag[uid],
    farm = life.farms[uid],
    a = action as LifeAction;
  const textGate = () => {
    if (now - (life.lastText[uid] ?? 0) < TEXT_COOLDOWN_MS)
      fail(LIFE_REJECT.textRate);
    life.lastText[uid] = now;
  };
  const nextId = (prefix: string) => `${prefix}-${uid}-${++life.seq}`;
  let nextLedger = ledger;
  const kind = a.kind as string;
  // 성장: today's fields, rested/retro XP and finished 마을 개척 settle first.
  touchGrowth(life, uid, now);
  if ((GROWTH_ACTION_KINDS as readonly string[]).includes(kind)) {
    const next = growthAction(life, ledger, member, a as GrowthAction, now);
    return afterCoreAction(next.life, next.ledger, member, now);
  }
  if ((PLUS_ACTION_KINDS as readonly string[]).includes(kind)) {
    const next = plusAction(life, ledger, member, a as PlusAction, now);
    return afterCoreAction(next.life, next.ledger, member, now);
  }
  if ((SOCIAL_ACTION_KINDS as readonly string[]).includes(kind)) {
    const next = socialAction(life, ledger, member, a as SocialAction, now);
    return afterCoreAction(next.life, next.ledger, member, now);
  }
  const size = farm.length;
  const mods = growthMods(life, uid);
  const plantOk = (crop: Crop) => {
    if (!cropInSeason(crop, seasonOf(now)) && !hasFlag(life, 'greenhouse') && !mods.offSeason)
      fail(`지금은 ${CROP_INFO[crop].name} 철이 아니라 심을 수 없어요.`);
  };
  const newPlot = (crop: Crop): Plot => {
    const speed = Math.min(MAX_SPEED, plantSpeed(life, uid, now) + villageGrowSpeed(life) + mods.growSpeed);
    return { crop, plantedAt: now, wateredAt: null, ...(speed ? { speed } : {}), ...(mods.goldPts ? { g: mods.goldPts } : {}) };
  };
  switch (a.kind) {
    case 'plant': {
      // plot -1 plants every empty plot (as many as there are seeds): one
      // request and one friend broadcast instead of six.
      if (!isCrop(a.crop)) fail(LIFE_REJECT.invalid);
      plantOk(a.crop);
      if (a.plot === -1) {
        const empty = farm.flatMap((p, i) => (p.crop ? [] : [i]));
        if (!empty.length) fail(LIFE_REJECT.noEmpty);
        if (bag.seeds[a.crop] < 1) fail(LIFE_REJECT.noSeed);
        for (const i of empty.slice(0, bag.seeds[a.crop])) {
          bag.seeds[a.crop] -= 1;
          farm[i] = newPlot(a.crop);
        }
        break;
      }
      const i = plotIndex(a.plot, size);
      if (farm[i].crop) fail(LIFE_REJECT.occupied);
      if (bag.seeds[a.crop] < 1) fail(LIFE_REJECT.noSeed);
      bag.seeds[a.crop] -= 1;
      farm[i] = newPlot(a.crop);
      break;
    }
    case 'water': {
      if (a.plot === -1) {
        let watered = 0;
        for (const plot of farm)
          if (
            plot.crop &&
            plot.wateredAt === null &&
            plotRainAt(plot, now) === null &&
            now < plotReadyAt(plot, now)!
          ) {
            plot.wateredAt = now;
            if (mods.waterPts) plot.w = mods.waterPts;
            watered++;
          }
        if (!watered) fail(LIFE_REJECT.nothingToWater);
        bump(life, uid, 'water', watered);
        gainXp(life, uid, 'farm', XP.water * watered, now);
        break;
      }
      const i = plotIndex(a.plot, size),
        plot = farm[i];
      if (!plot.crop) fail(LIFE_REJECT.empty);
      if (plot.wateredAt !== null) fail(LIFE_REJECT.watered);
      if (now >= plotReadyAt(plot, now)!) fail(LIFE_REJECT.grown);
      if (plotRainAt(plot, now) !== null) fail(LIFE_REJECT.rained);
      plot.wateredAt = now;
      if (mods.waterPts) plot.w = mods.waterPts;
      bump(life, uid, 'water', 1);
      gainXp(life, uid, 'farm', XP.water, now);
      break;
    }
    case 'harvest': {
      if (a.plot !== -1) plotIndex(a.plot, size);
      const targets =
        a.plot === -1 ? farm.map((_, i) => i) : [a.plot as number];
      let harvested = 0;
      for (const i of targets) {
        const plot = farm[i];
        if (!plot.crop) {
          if (a.plot !== -1) fail(LIFE_REJECT.empty);
          continue;
        }
        if (now < plotReadyAt(plot, now)!) {
          if (a.plot !== -1) fail(LIFE_REJECT.notReady);
          continue;
        }
        const crop = plot.crop,
          quality = plotQuality(uid, i, plot);
        addCropQ(life, uid, crop, quality, 1);
        countHarvest(life, uid, crop, 1);
        bump(life, uid, 'harvest', 1);
        if (quality === 2) bump(life, uid, 'gold', 1);
        discover(life, uid, crop);
        gainXp(
          life,
          uid,
          'farm',
          (XP.harvestBase + Math.min(XP.harvestHourMax, plotGrowMs(plot) / HOUR)) * QUALITY_MULT[quality],
          now,
        );
        const regrow = CROP_INFO[crop].regrow,
          n = (plot.n ?? 0) + 1;
        farm[i] =
          regrow && n < regrow.harvests
            ? {
                crop,
                plantedAt: now,
                wateredAt: null,
                ...(plot.fert ? { fert: plot.fert } : {}),
                ...(plot.speed ? { speed: plot.speed } : {}),
                n,
              }
            : emptyPlot();
        harvested++;
      }
      if (!harvested) fail(LIFE_REJECT.nothingReady);
      break;
    }
    case 'pick': {
      if (!(FRUIT_TREES as readonly string[]).includes(a.tree))
        fail(LIFE_REJECT.tree);
      const picked = (life.fruitPickedAt[uid] ??= {});
      if (now - (picked[a.tree] ?? -Infinity) < FRUIT_COOLDOWN_MS)
        fail(LIFE_REJECT.treeWait);
      picked[a.tree] = now;
      const got = fruitYield(uid, a.tree, now, ++life.seq);
      bag.fruit = addCount(bag.fruit, got);
      countHarvest(life, uid, 'fruit', got);
      break;
    }
    case 'sell': {
      // No quality: lowest stars first (older clients); a quality sells only that tier.
      const fruit = a.crop === 'fruit';
      if (!fruit && !isCrop(a.crop)) fail(LIFE_REJECT.invalid);
      if (!safe(a.n) || a.n < 1 || a.n > SELL_MAX_N) fail(LIFE_REJECT.invalid);
      const q = a.quality;
      if (q !== undefined && q !== 0 && q !== 1 && q !== 2) fail(LIFE_REJECT.quality);
      if (fruit && q) fail(LIFE_REJECT.quality);
      const have = fruit
        ? bag.fruit
        : q === undefined
          ? bag.produce[a.crop as Crop]
          : cropQCount(life, uid, a.crop as Crop, q);
      if (have < a.n) fail(LIFE_REJECT.notEnough);
      // Demand curve: each unit of the same crop sold today pays a bit less.
      const id = a.crop as Crop | 'fruit',
        flags = life.flags ?? [];
      let amount = 0,
        sold = demandSold(life, uid, now, id);
      const soldBeom = soldBeomToday(life, uid, now);
      const tiers: number[] = fruit
        ? [a.n, 0, 0]
        : q === undefined
          ? takeCrop(life, uid, a.crop as Crop, a.n)
          : [0, 1, 2].map((t) => (t === q ? a.n : 0));
      if (fruit) bag.fruit -= a.n;
      else if (q !== undefined) addCropQ(life, uid, a.crop as Crop, q, -a.n);
      tiers.forEach((n, t) => {
        if (!n) return;
        // 성장: 장터 농부 / 명인 add a share on top (the demand curve stays the same).
        const bonus = fruit ? 0 : mods.cropSell + (t > 0 ? mods.starSell : 0);
        amount += Math.round(sellTotal(id, sellUnit(id, t as Quality, now, flags), sold, n, soldBeom + amount) * (1 + bonus));
        sold += n;
      });
      const left = sellCapLeft(life, uid, now);
      if (amount > left)
        fail(`오늘은 ${beom(Math.max(0, left))}어치까지만 더 팔 수 있어요.`);
      noteDemand(life, uid, now, id, a.n);
      const day = kstDay(now),
        prev = life.sold[uid];
      life.sold[uid] = {
        day,
        amount: (prev?.day === day ? prev.amount : 0) + amount,
      };
      bump(life, uid, 'earned', amount);
      nextLedger = grantBeom(
        ledger,
        wallet,
        amount,
        nextId('life-sell'),
        now,
        'sell-' + a.crop,
      );
      break;
    }
    case 'buy': {
      const item = typeof a.item === 'string' ? SHOP_BY_ID[a.item] : undefined;
      if (!item) fail(LIFE_REJECT.item);
      const n = a.n ?? 1;
      const stacks = item!.kind === 'seed' || item!.kind === 'bundle';
      if (!safe(n) || n < 1 || n > (stacks ? BUY_MAX_N : 1))
        fail(LIFE_REJECT.invalid);
      const owned = (life.unlocks[uid] ??= []);
      if (!stacks && owned.includes(item!.id)) fail(LIFE_REJECT.owned);
      if (shopLock(item!, owned, life.harvested?.[uid] ?? {}, life.flags ?? []))
        fail(LIFE_REJECT.locked);
      const price = item!.price * n;
      if ((ledger.accounts[wallet] ?? 0) < price) fail(LIFE_REJECT.balance);
      nextLedger = spendBeom(
        ledger,
        wallet,
        price,
        nextId('life-buy'),
        now,
        'buy-' + item!.id,
      );
      if (stacks)
        bag.seeds[item!.crop!] = addCount(
          bag.seeds[item!.crop!],
          n * (item!.seeds ?? 1),
        );
      else owned.push(item!.id);
      break;
    }
    case 'guestbook': {
      const owner = uidOf(life, a.owner);
      if (!owner) fail(LIFE_REJECT.friend);
      const text = lifeText(a.text, GUESTBOOK_TEXT_MAX);
      textGate();
      life.guestbook[owner!] = pushBounded(
        life.guestbook[owner!],
        { from: uid, actor: member.actor, text, at: now },
        GUESTBOOK_MAX,
      );
      break;
    }
    case 'mail': {
      const to = uidOf(life, a.to);
      if (!to) fail(LIFE_REJECT.friend);
      if (to === uid) fail(LIFE_REJECT.self);
      const text = lifeText(a.text, MAIL_TEXT_MAX, !!a.gift || !!a.sticker);
      if (
        a.sticker !== undefined &&
        (typeof a.sticker !== 'string' || !/^[a-z0-9-]{1,24}$/.test(a.sticker))
      )
        fail(LIFE_REJECT.sticker);
      let gift: Gift | undefined;
      if (a.gift !== undefined) {
        gift = readGift(a.gift);
        if (!gift) fail(LIFE_REJECT.gift);
        const theirs = (life.bag[to] ??= starterBag());
        if (gift!.kind === 'item') {
          const { item, n } = gift as { item: string; n: number };
          if (invCount(life, uid, item) < n) fail(LIFE_REJECT.notEnough);
          addInv(life, uid, item, -n);
          addInv(life, to!, item, n);
        } else if (gift!.kind === 'fruit') {
          if (bag.fruit < gift!.n) fail(LIFE_REJECT.notEnough);
          bag.fruit -= gift!.n;
          theirs.fruit = addCount(theirs.fruit, gift!.n);
        } else {
          // Stars travel with the gift (lowest first).
          const crop = gift!.crop;
          if (bag.produce[crop] < gift!.n) fail(LIFE_REJECT.notEnough);
          takeCrop(life, uid, crop, gift!.n).forEach((n, t) => {
            if (n) addCropQ(life, to!, crop, t as Quality, n);
          });
        }
      }
      textGate();
      life.mail[to] = pushBounded(
        life.mail[to],
        {
          id: `m${now.toString(36)}-${++life.seq}`,
          from: uid,
          actor: member.actor,
          text,
          ...(a.sticker ? { sticker: a.sticker } : {}),
          ...(gift ? { gift } : {}),
          at: now,
          read: false,
        },
        MAIL_MAX,
      );
      if (gift) onGift(life, member, to!, gift, now);
      break;
    }
    case 'readMail': {
      const box = (life.mail[uid] ?? []).map((m) => ({ ...m }));
      if (a.id === 'all') for (const m of box) m.read = true;
      else {
        const m = box.find((m) => m.id === a.id);
        if (!m) fail(LIFE_REJECT.mail);
        m!.read = true;
      }
      life.mail[uid] = box;
      break;
    }
    case 'readGuestbook': {
      (life.guestbookSeen ??= {})[uid] = now;
      break;
    }
    case 'room': {
      if (a.access !== undefined && !ROOM_ACCESS_VALUES.includes(a.access))
        fail(LIFE_REJECT.invalid);
      const rooms = (life.rooms ??= {}),
        prev = rooms[uid] ?? { access: 'friends', rev: 0 };
      rooms[uid] = {
        access: a.access ?? prev.access,
        rev: (prev.rev + 1) % Number.MAX_SAFE_INTEGER,
      };
      break;
    }
    case 'status': {
      const text = lifeText(a.text, STATUS_TEXT_MAX, true);
      textGate();
      if (text) life.status[uid] = { text, at: now };
      else delete life.status[uid];
      break;
    }
  }
  return afterCoreAction(life, nextLedger, member, now);
}

// ---------------------------------------------------------------- views
export type PlotView = Plot & {
  readyAt: number | null;
  stage: 0 | 1 | 2 | 3;
  ready: boolean;
  /** Watered by rain today (no watering can needed). */
  rained: boolean;
  /** Quality the harvest will have (0 normal, 1 silver, 2 gold). */
  quality: Quality;
  /** Harvests left including the next one (regrowing crops), else 1. */
  harvestsLeft: number;
};
export type LifeView = {
  me: {
    farm: PlotView[];
    bag: Bag;
    unlocks: string[];
    mailUnread: number;
    /** Guestbook entries friends wrote since I last opened it. */
    guestbookUnread: number;
    mail: MailItem[];
    status: { text: string; at: number } | null;
    guestbook: GuestEntry[];
    fruitReadyAt: Record<string, number>;
    /** Lifetime harvest/pick counts (trophy milestones). */
    harvested: Partial<Record<HarvestKind, number>>;
  } & PlusMe;
  statuses: Record<string, { actor: number; text: string; at: number }>;
  housesPlotsPublic: Record<
    string,
    { crop: Crop | null; stage: 0 | 1 | 2 | 3; needsWater: boolean }[]
  >;
  actors: Record<string, number>;
  /** Room access and revision per owner actor (absent = 'friends', rev 0). */
  rooms: Record<number, RoomState>;
  sellCapLeft: number;
  /** 범 sold today (all goods; drives the market saturation, see marketMult). */
  soldToday: number;
  sellCapResetAt: number;
  serverNow: number;
  /** Friend-life view (absent from older servers). */
  social?: SocialView;
  /** 성장: skills, tools, 마을 개척, material nodes (absent from older servers). */
  growth?: GrowthView;
} & PlusView;
export function lifeView(
  state: LifeState,
  uid: string,
  actor: number,
  now: number,
): LifeView {
  let life =
    UUID.test(uid) && actorValid(actor)
      ? ensureLifeMember(state, uid, actor)
      : state;
  // 성장: finished 마을 개척 shows (flags) before anyone acts again.
  if (growthNeedsSettle(life, now)) {
    life = cloneLife(life);
    settleResearch(life, now);
  }
  const farm = life.farms[uid] ?? [];
  const mail = life.mail[uid] ?? [];
  const picked = life.fruitPickedAt[uid] ?? {};
  const statuses: LifeView['statuses'] = {};
  for (const [id, s] of Object.entries(life.status))
    if (id in life.actors)
      statuses[id] = { actor: life.actors[id], text: s.text, at: s.at };
  const housesPlotsPublic: LifeView['housesPlotsPublic'] = {};
  for (const [id, plots] of Object.entries(life.farms))
    housesPlotsPublic[id] = plots.map((p) => ({
      crop: p.crop,
      stage: plotStage(p, now),
      needsWater:
        !!p.crop &&
        p.wateredAt === null &&
        plotRainAt(p, now) === null &&
        now < plotReadyAt(p, now)!,
    }));
  const base = {
    me: {
      farm: farm.map((p, i) => {
        const readyAt = plotReadyAt(p, now),
          regrow = p.crop ? CROP_INFO[p.crop].regrow : undefined;
        return {
          ...p,
          readyAt,
          stage: plotStage(p, now),
          ready: readyAt !== null && now >= readyAt,
          rained: plotRainAt(p, now) !== null,
          quality: plotQuality(uid, i, p),
          harvestsLeft: regrow ? regrow.harvests - (p.n ?? 0) : 1,
        };
      }),
      bag: structuredClone(life.bag[uid] ?? emptyBag()),
      unlocks: [...(life.unlocks[uid] ?? [])],
      harvested: { ...life.harvested?.[uid] },
      mailUnread: mail.filter((m) => !m.read).length,
      guestbookUnread: (life.guestbook[uid] ?? []).filter(
        (g) => g.from !== uid && g.at > (life.guestbookSeen?.[uid] ?? 0),
      ).length,
      mail: structuredClone(mail),
      status: life.status[uid] ? { ...life.status[uid] } : null,
      guestbook: structuredClone(life.guestbook[uid] ?? []),
      fruitReadyAt: Object.fromEntries(
        FRUIT_TREES.map((t) => [
          t,
          picked[t] && now - picked[t] < FRUIT_COOLDOWN_MS
            ? picked[t] + FRUIT_COOLDOWN_MS
            : 0,
        ]),
      ),
    },
    statuses,
    housesPlotsPublic,
    actors: { ...life.actors },
    rooms: Object.fromEntries(
      Object.entries(life.rooms ?? {})
        .filter(([id]) => id in life.actors)
        .map(([id, room]) => [life.actors[id], { ...room }]),
    ),
    sellCapLeft: Math.max(0, sellCapLeft(life, uid, now)),
    soldToday: soldBeomToday(life, uid, now),
    sellCapResetAt: nextKstMidnight(now),
    serverNow: now,
  };
  const { me, ...plus } = plusView(life, uid, actor, now);
  return {
    ...base,
    ...plus,
    me: { ...base.me, ...me },
    ...(UUID.test(uid) && actorValid(actor) ? { social: socialView(life, uid, actor, now) } : {}),
    ...(UUID.test(uid) && actorValid(actor) ? { growth: growthView(life, uid, now) } : {}),
  };
}
/** Read-only parts of a friend's life shown when visiting their room. */
export function friendLife(state: LifeState, actor: number) {
  const uid = uidOf(state, actor);
  return {
    guestbook: uid ? structuredClone(state.guestbook[uid] ?? []) : [],
    status: uid && state.status[uid] ? { ...state.status[uid] } : null,
    unlocks: uid ? [...(state.unlocks[uid] ?? [])] : [],
    access: roomAccessOf(state, actor),
  };
}
/** Who may enter `owner`'s room right now (default: all friends). */
export function roomAccessOf(state: LifeState, owner: number): RoomAccess {
  const uid = uidOf(state, owner);
  return (uid && state.rooms?.[uid]?.access) || 'friends';
}
/** Whether `visitor` may walk into `owner`'s room. The owner always may. */
export const mayEnterRoom = (state: LifeState, owner: number, visitor: number) =>
  owner === visitor || roomAccessOf(state, owner) !== 'closed';
