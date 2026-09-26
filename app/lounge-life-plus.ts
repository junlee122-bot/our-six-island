// Life expansion engine: farm depth (fertilizer, expansion, friend watering),
// fishing, foraging and bugs, museum, cooking and crafting, village bundles,
// furniture shop, friendship, requests, calendar events, memories and the
// daily digest. Pure and `now`-injected like lounge-life.ts, whose
// lifeAction/lifeView/readLife call into this module.
//
// Cycle-safe: lounge-life.ts imports this module and this module imports it
// back, so neither may use the other's bindings at the top level.
import { cleanText, clipText } from './text-clean.ts';
import {
  grantBeom,
  spendBeom,
  kstDay,
  nextKstMidnight,
  type LoungeLedger,
} from './lounge-economy.ts';
import {
  ACTOR_NAMES,
  BIRTHDAY_GIFT_BONUS,
  dayStart,
  CASINO_NIGHT_BONUS,
  FISH_DAY_BONUS,
  FRIEND_PROFILES,
  MARKET_DISCOUNT,
  MARKET_EXTRA,
  birthdayActors,
  calendarOf,
  claimableEvents,
  hash32,
  holidaysOn,
  isDaytime,
  isNighttime,
  seasonOf,
  seasonOfDay,
  timeOfDay,
  weatherOf,
  weekdayOf,
  weeklyActive,
  type CalendarView,
  type ItemCategory,
  type Season,
  type Weather,
} from './lounge-calendar.ts';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_BY_ID,
  BUFF_INFO,
  BUGS,
  BUNDLES,
  BUNDLE_BY_ID,
  BUNDLE_REWARD_BEOM,
  CRAFT_BY_ID,
  DISHES,
  DISH_BY_ID,
  FERTILIZERS,
  FESTIVAL_GOAL,
  FESTIVAL_SOUVENIRS,
  FESTIVAL_SOUVENIR_MIN,
  GREENHOUSE2_SPEED,
  HOUSE_TIERS,
  LIGHTS_RARE_BOOST,
  LUXURY_PER_WEEK,
  PROJECTS,
  PROJECT_BY_ID,
  PROJECT_MIN_GIVE,
  SHOP_REROLL_MAX,
  shopRerollPrice,
  FISH,
  FISH_BY_ID,
  FISH_SPOTS,
  FORAGE,
  FURNITURE,
  FURNITURE_BY_REF,
  GROW_BUFF_SPEED,
  ITEM_BY_ID,
  ITEM_PRICES,
  SHOP_BUY_MAX_N,
  SHOP_DAILY_ITEMS,
  SPAWN_SPOTS,
  SPOT_BY_ID,
  SPOT_INFO,
  STAT_KEYS,
  VILLAGE_FLAGS,
  eligibleSky,
  eligibleTime,
  isFurnitureRef,
  isItemId,
  type DishBuff,
  type Need,
  type Spot,
  type StatKey,
} from './lounge-items.ts';
import {
  CROPS,
  CROP_INFO,
  DELUXE_SPEED,
  FARM_SIZES,
  FRUIT_SELL,
  QUALITY_MULT,
  LIFE_REJECT,
  LifeError,
  MAX_SPEED,
  addCount,
  cloneLife,
  cropInSeason,
  emptyBag,
  plotRainAt,
  plotReadyAt,
  sellCapLeft,
  uidOf,
  type Crop,
  type FarmSize,
  type Gift,
  type LifeState,
  type Quality,
} from './lounge-life.ts';
import {
  addStamp,
  bondLastDay,
  decayedBond,
  grantHeartRewards,
  legacyBond,
  migrateBonds,
  museumStamped,
  readSocial,
  settleMuseum,
  settleSocial,
  touchBond,
  type SocialState,
} from './lounge-life-social.ts';
import { CO_DONATION_GRANT } from './lounge-social-defs.ts';
// 성장 P1: XP and skill/tool effects (functions only; see the cycle note above).
import { XP, fishXp } from './lounge-growth-data.ts';
import { gainXp, growthChance, growthMods } from './lounge-growth.ts';
import { furnitureBonus, housePrice } from './lounge-venue-data.ts';
/** 오늘의 가구 rerolls a day (+2 with 나무결 가구점's 단골 손님 대접). */
const rerollMax = (life: LifeState) => SHOP_REROLL_MAX + furnitureBonus(life).rerolls;

// ---------------------------------------------------------------- constants
/** 6 → 9 and 9 → 12 plots. */
export const FARM_EXPAND_PRICE: Record<9 | 12, number> = { 9: 150_000, 12: 400_000 };
export const ROD_PRICE: Record<2 | 3, number> = { 2: 30_000, 3: 120_000 };
/** Bite window multiplier per rod level (rod 3 also makes rare fish 1.5× likelier). */
export const ROD_WINDOW: Record<1 | 2 | 3, number> = { 1: 1, 2: 1.25, 3: 1.5 };
/** Bite comes 1.5–6 s after the cast. */
export const BITE_MIN_MS = 1_500;
export const BITE_SPREAD_MS = 4_500;
/** Network allowance after the window closes, and before the bite (clock skew). */
export const REEL_SLACK_MS = 1_500;
export const REEL_EARLY_MS = 300;
export const FIRST_DONATION_GRANT = 300;
export const REQUESTS_PER_DAY = 3;
export const REQUEST_BASE_REWARD = 300;
export const REQUEST_REWARD_MAX = 8_000;
export const WISH_MIN = 100;
export const WISH_MAX = 1_000;
/** Friendship points per source (gift: ×2 liked, ×0.2 disliked, ×3 on a birthday). */
export const BOND_POINTS = { gift: 20, visit: 8, water: 5, table: 6, request: 25 } as const;
/**
 * Cumulative points for hearts 1..10. The late hearts are slow on purpose
 * (C-4: the 120-day simulation saturated every pair at ♥9.5 on the old
 * 2,000-point curve); ♥6+ also fade a little after 3 idle days
 * (lounge-life-social decayedBond) and ♥2/4/6/8/10 give rewards.
 */
export const BOND_LEVELS = [30, 80, 150, 250, 400, 650, 1_000, 1_600, 2_600, 4_000] as const;
export const BOND_MAX = 9_999;
export const MEMORY_MAX = 60;
export const NEWS_DAY_MAX = 40;
export const DIGEST_LINES = 12;
const CLAIMED_MAX = 24,
  DEX_MAX = 400,
  DAILY_KEYS_MAX = 64,
  COUNT_MAX = 99_999,
  STAT_MAX = Number.MAX_SAFE_INTEGER;

// ---------------------------------------------------------------- types
export type FishPending = {
  token: string;
  spot: Spot;
  castAt: number;
  biteAt: number;
  windowMs: number;
  expiresAt: number;
  /** Hidden from the view. */
  fish: string;
  cm: number;
};
export type FishLast = {
  ok: boolean;
  fish?: string;
  cm?: number;
  record?: boolean;
  /** A new personal best for this fish. */
  best?: boolean;
  at: number;
  reason?: 'early' | 'late' | 'timing';
};
export type UserExt = {
  plots?: 9 | 12;
  inv?: Record<string, number>;
  q1?: Partial<Record<Crop, number>>;
  q2?: Partial<Record<Crop, number>>;
  furn?: Record<string, number>;
  dex?: string[];
  stats?: Partial<Record<StatKey, number>>;
  ach?: string[];
  rod?: 2 | 3;
  pending?: FishPending;
  last?: FishLast;
  /** Personal best length (cm) per fish id (VILL-2 fish card). */
  best?: Record<string, number>;
  /** KST day of the daily fields below. */
  day?: number;
  taken?: string[];
  req?: number[];
  claimed?: string[];
  wf?: number[];
  ate?: string;
  wished?: boolean;
  buff?: { kind: DishBuff; dish: string; until: number };
  /** Units sold today per crop/fruit/item id (demand curves; daily). */
  dem?: Record<string, number>;
  /** 오늘의 가구 rerolls today (daily). */
  reroll?: number;
  /** House tier bought (집 확장, 1–4). */
  house?: 1 | 2 | 3 | 4;
  /** Weekly luxury furniture bought this KST week. */
  lux?: { w: number; refs: string[] };
};
export type Memory = { id: string; kind: string; actors: number[]; text: string; at: number };
export type NewsLine = { key: string; kind: string; text: string; actors: number[] };
export type BundleState = { got: number[]; by: Record<string, number>; doneAt?: number };
/** 마을 공사: 범 given so far and 범 per actor. */
export type ProjectState = { got: number; by: Record<string, number>; doneAt?: number };
/** 주간 마을 축제 기금 of one KST week (Monday start). */
export type FestivalState = { week: number; got: number; by: Record<string, number>; doneAt?: number };
/** Optional life-expansion fields of `world.life` (absent in older worlds). */
export type LifeExt = {
  ext?: Record<string, UserExt>;
  museum?: Record<string, { actor: number; at: number }>;
  bundles?: Record<string, BundleState>;
  flags?: string[];
  memories?: Memory[];
  news?: { day: number; lines: NewsLine[] }[];
  records?: Record<string, { actor: number; cm: number; at: number }>;
  /** Friendship points per actor pair 'a-b' (a < b). */
  bonds?: Record<string, number>;
  /** Friendship sources already counted today. */
  bondDay?: { day: number; keys: string[] };
  /** 마을 공사 2차 (PROJECTS). */
  projects?: Record<string, ProjectState>;
  /** This week's festival fund. */
  festival?: FestivalState;
  /** Friend-life state: NPC lines, heart rewards, museum stamps, festivals (lounge-life-social). */
  social?: SocialState;
};
export type PlusAction =
  | { kind: 'fertilize'; plot: number; item: string }
  | { kind: 'expandFarm' }
  | { kind: 'waterFriend'; owner: number | string; plot: number }
  | { kind: 'buyFurniture'; ref: string; n?: number }
  | { kind: 'buyItem'; item: string; n?: number }
  | { kind: 'upgradeRod' }
  | { kind: 'cast'; spot: Spot }
  | { kind: 'reel'; token: string; timingMs: number }
  | { kind: 'forage'; spot: string }
  | { kind: 'catch'; spot: string }
  | { kind: 'sellItem'; item: string; n: number }
  | { kind: 'donate'; item: string }
  | { kind: 'cook'; recipe: string; n?: number }
  | { kind: 'craft'; recipe: string; n?: number }
  | { kind: 'eat'; item: string }
  | { kind: 'contribute'; bundle: string; slot: number; n: number }
  | { kind: 'deliver'; to: number }
  | { kind: 'claimEvent'; event: string }
  | { kind: 'wish' }
  | { kind: 'project'; project: string; n: number }
  | { kind: 'festival'; n: number }
  | { kind: 'upgradeHouse' }
  | { kind: 'rerollShop' };

export const PLUS_REJECT = {
  fert: '비료를 확인해 주세요.',
  fertDone: '이미 그 비료를 준 칸이에요.',
  nothingToFert: '비료를 줄 작물이 없어요.',
  farmMax: '밭은 12칸까지 넓힐 수 있어요.',
  friendFarm: '친구의 밭을 찾을 수 없어요.',
  friendWatered: '오늘은 이미 이 친구 밭에 물을 줬어요. 내일 또 도와줘요.',
  stock: '오늘 상점에 없는 가구예요.',
  rodMax: '이미 가장 좋은 낚싯대예요.',
  spot: '갈 수 없는 곳이에요.',
  spotLocked: '아직 복원되지 않은 곳이에요. 마을 꾸러미를 채워 주세요.',
  spotRod: '물살이 세서 낚싯대 2단계부터 던질 수 있어요.',
  spotNight: '항구는 해가 진 뒤(저녁 7시~새벽 5시)에만 열려요.',
  token: '낚싯대를 다시 던져 주세요.',
  foraged: '여기는 오늘 이미 채집했어요. 내일 다시 와 주세요.',
  nothingHere: '지금은 여기에 아무것도 없어요.',
  caught: '여기 곤충은 이미 잡았어요. 다른 시간에 다시 와 주세요.',
  noSell: '팔 수 없는 물건이에요.',
  donated: '이미 기증한 물건이에요. 박물관에 내 도장이 찍혀 있어요.',
  noDonate: '박물관에 기증할 수 없는 물건이에요.',
  recipe: '레시피를 확인해 주세요.',
  recipeLocked: '아직 배우지 못한 레시피예요. 마을 복원이 필요해요.',
  ingredients: '재료가 부족해요.',
  noBuff: '먹어도 특별한 효과가 없는 음식이에요.',
  ate: '오늘은 이미 든든하게 먹었어요.',
  bundle: '꾸러미를 확인해 주세요.',
  bundleDone: '이미 완성된 꾸러미예요.',
  slotFull: '이미 다 채운 칸이에요.',
  request: '오늘 그 친구의 부탁이 없어요.',
  requestDone: '오늘 그 친구의 부탁은 이미 들어줬어요.',
  event: '오늘 받을 수 있는 선물이 아니에요.',
  claimed: '이미 받았어요.',
  wish: '광장 분수가 복원되면 소원을 빌 수 있어요.',
  wished: '오늘은 이미 소원을 빌었어요. 내일 또 와요.',
  project: '마을 공사를 확인해 주세요.',
  projectLocked: '먼저 마을 복원을 마쳐야 시작할 수 있는 공사예요.',
  projectDone: '이미 끝난 공사예요.',
  give: '보탤 범을 확인해 주세요.',
  festivalDone: '이번 주 축제 기금은 다 모였어요. 다음 주 월요일에 새로 모아요.',
  houseMax: '집을 끝까지 넓혔어요.',
  rerollMax: '오늘은 더 새로 고칠 수 없어요. 내일 새 가구가 들어와요.',
  luxuryBought: '이번 주에는 이미 산 명품 가구예요. 다음 주에 또 들어올 수도 있어요.',
  luxuryOne: '명품 가구는 한 번에 하나씩 살 수 있어요.',
} as const;
function fail(message: string): never {
  throw new LifeError(message);
}

// ---------------------------------------------------------------- reading
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const time = (n: unknown) => (safe(n) && n >= 0 ? n : 0);
const count = (n: unknown) => (safe(n) && n > 0 ? Math.min(n, COUNT_MAX) : 0);
const actorValid = (a: unknown): a is number => safe(a) && a >= 0 && a < 7;
const isCropId = (c: unknown): c is Crop => typeof c === 'string' && (CROPS as string[]).includes(c);
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const nonEmpty = <T extends object>(o: T) => Object.keys(o).length > 0;
const counts = <K extends string>(v: unknown, ok: (k: string) => boolean, limit = 500) => {
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(obj(v)).slice(0, limit)) {
    const c = count(n);
    if (ok(k) && c > 0) out[k] = c;
  }
  return out as Partial<Record<K, number>>;
};
const actorList = (v: unknown) =>
  Array.isArray(v) ? [...new Set(v.filter(actorValid))].slice(0, 7) : [];
const idList = (v: unknown, max: number, ok: (s: string) => boolean = () => true) =>
  Array.isArray(v)
    ? [...new Set(v.filter((s): s is string => typeof s === 'string' && s.length <= 48 && ok(s)))].slice(0, max)
    : [];
const isDexId = (id: string) => isCropId(id) || (isItemId(id) && ITEM_BY_ID[id].kind !== 'tool');
const isMuseumId = (id: string) => isCropId(id) || (isItemId(id) && !!ITEM_BY_ID[id].museum);
const isDemandId = (id: string) => isCropId(id) || id === 'fruit' || (isItemId(id) && ITEM_BY_ID[id].sell > 0);
const readActorAmounts = (v: unknown) => {
  const by: Record<string, number> = {};
  for (const [a, n] of Object.entries(obj(v)))
    if (/^[0-6]$/.test(a) && safe(n) && n > 0) by[a] = n;
  return by;
};

function readPending(v: unknown): FishPending | undefined {
  const p = obj(v);
  if (
    typeof p.token !== 'string' ||
    !/^[a-z0-9]{1,24}$/.test(p.token) ||
    !(FISH_SPOTS as readonly unknown[]).includes(p.spot) ||
    typeof p.fish !== 'string' ||
    !own(FISH_BY_ID, p.fish) ||
    ![p.castAt, p.biteAt, p.windowMs, p.expiresAt, p.cm].every((n) => safe(n) && n >= 0)
  )
    return;
  return {
    token: p.token,
    spot: p.spot as Spot,
    castAt: p.castAt as number,
    biteAt: p.biteAt as number,
    windowMs: p.windowMs as number,
    expiresAt: p.expiresAt as number,
    fish: p.fish,
    cm: p.cm as number,
  };
}
function readLast(v: unknown): FishLast | undefined {
  const l = obj(v);
  if (typeof l.ok !== 'boolean' || !safe(l.at)) return;
  const out: FishLast = { ok: l.ok, at: time(l.at) };
  if (typeof l.fish === 'string' && own(FISH_BY_ID, l.fish)) out.fish = l.fish;
  if (safe(l.cm) && l.cm > 0) out.cm = l.cm;
  if (l.record === true) out.record = true;
  if (l.best === true) out.best = true;
  if (l.reason === 'early' || l.reason === 'late' || l.reason === 'timing') out.reason = l.reason;
  return out;
}
function readUserExt(v: unknown): UserExt | undefined {
  const x = obj(v),
    out: UserExt = {};
  if (x.plots === 9 || x.plots === 12) out.plots = x.plots;
  const inv = counts(x.inv, isItemId);
  if (nonEmpty(inv)) out.inv = inv as Record<string, number>;
  const q1 = counts<Crop>(x.q1, isCropId),
    q2 = counts<Crop>(x.q2, isCropId);
  if (nonEmpty(q1)) out.q1 = q1;
  if (nonEmpty(q2)) out.q2 = q2;
  const furn = counts(x.furn, isFurnitureRef);
  if (nonEmpty(furn)) out.furn = furn as Record<string, number>;
  const dex = idList(x.dex, DEX_MAX, isDexId);
  if (dex.length) out.dex = dex;
  const stats: Partial<Record<StatKey, number>> = {};
  for (const k of STAT_KEYS) {
    const n = obj(x.stats)[k];
    if (safe(n) && n > 0) stats[k] = n;
  }
  if (nonEmpty(stats)) out.stats = stats;
  const ach = idList(x.ach, ACHIEVEMENTS.length, (id) => own(ACHIEVEMENT_BY_ID, id));
  if (ach.length) out.ach = ach;
  if (x.rod === 2 || x.rod === 3) out.rod = x.rod;
  // Claimed event ids carry their year/day, so they persist (bounded).
  const claimed = idList(Array.isArray(x.claimed) ? x.claimed.slice(-CLAIMED_MAX) : [], CLAIMED_MAX, (s) =>
    /^[a-z0-9-]+$/.test(s),
  );
  if (claimed.length) out.claimed = claimed;
  const pending = readPending(x.pending);
  if (pending) out.pending = pending;
  const last = readLast(x.last);
  if (last) out.last = last;
  const best = counts(x.best, (id) => own(FISH_BY_ID, id), FISH.length);
  if (nonEmpty(best)) out.best = best as Record<string, number>;
  if (safe(x.day) && x.day > 0) {
    out.day = x.day;
    const taken = idList(x.taken, DAILY_KEYS_MAX, (s) => /^[a-z0-9:-]+$/.test(s));
    if (taken.length) out.taken = taken;
    const req = actorList(x.req);
    if (req.length) out.req = req;
    const wf = actorList(x.wf);
    if (wf.length) out.wf = wf;
    if (typeof x.ate === 'string' && own(DISH_BY_ID, x.ate)) out.ate = x.ate;
    if (x.wished === true) out.wished = true;
    const dem = counts(x.dem, isDemandId, DAILY_KEYS_MAX * 2);
    if (nonEmpty(dem)) out.dem = dem as Record<string, number>;
    if (safe(x.reroll) && x.reroll > 0) out.reroll = Math.min(SHOP_REROLL_MAX, x.reroll);
  }
  if (x.house === 1 || x.house === 2 || x.house === 3 || x.house === 4) out.house = x.house;
  const lux = obj(x.lux);
  if (safe(lux.w) && lux.w > 0) {
    const refs = idList(lux.refs, 8, (r) => isFurnitureRef(r) && !!FURNITURE_BY_REF[r].luxury);
    if (refs.length) out.lux = { w: lux.w, refs };
  }
  const b = obj(x.buff);
  if (
    typeof b.kind === 'string' &&
    own(BUFF_INFO, b.kind) &&
    typeof b.dish === 'string' &&
    own(DISH_BY_ID, b.dish) &&
    safe(b.until)
  )
    out.buff = { kind: b.kind as DishBuff, dish: b.dish, until: b.until };
  return nonEmpty(out) ? out : undefined;
}
function readMemory(v: unknown): Memory | null {
  const m = obj(v);
  if (typeof m.id !== 'string' || !/^[a-z0-9-]{1,48}$/.test(m.id) || typeof m.kind !== 'string') return null;
  const text = cleanText(m.text, 80);
  return text
    ? { id: m.id, kind: cleanText(m.kind, 16), actors: actorList(m.actors), text, at: time(m.at) }
    : null;
}
function readNewsLine(v: unknown): NewsLine | null {
  const l = obj(v);
  const text = cleanText(l.text, 80);
  if (!text || typeof l.key !== 'string' || typeof l.kind !== 'string') return null;
  return { key: cleanText(l.key, 48), kind: cleanText(l.kind, 16), text, actors: actorList(l.actors) };
}
/**
 * Normalizes the life-expansion fields of `world.life`. Every key is omitted
 * when empty, so an older world reads back exactly as before.
 */
export function readLifeExt(v: Record<string, unknown>): LifeExt {
  const out: LifeExt = {};
  const ext: Record<string, UserExt> = {};
  for (const [uid, x] of Object.entries(obj(v.ext)).slice(0, 32)) {
    if (!UUID.test(uid) || Object.keys(ext).length >= 16) continue;
    const u = readUserExt(x);
    if (u) ext[uid] = u;
  }
  if (nonEmpty(ext)) out.ext = ext;
  const museum: LifeExt['museum'] = {};
  for (const [id, m] of Object.entries(obj(v.museum)).slice(0, 400)) {
    const x = obj(m);
    if (isMuseumId(id) && actorValid(x.actor)) museum[id] = { actor: x.actor, at: time(x.at) };
  }
  if (nonEmpty(museum)) out.museum = museum;
  const bundles: Record<string, BundleState> = {};
  for (const def of BUNDLES) {
    const b = obj(obj(v.bundles)[def.id]);
    if (!nonEmpty(b)) continue;
    const got = def.slots.map((slot, i) => {
      const n = Array.isArray(b.got) ? b.got[i] : 0;
      return safe(n) && n > 0 ? Math.min(slot.n, n) : 0;
    });
    const by: Record<string, number> = {};
    for (const [a, n] of Object.entries(obj(b.by)))
      if (/^[0-6]$/.test(a) && safe(n) && n > 0) by[a] = n;
    const state: BundleState = { got, by };
    if (safe(b.doneAt) && b.doneAt > 0) state.doneAt = b.doneAt;
    if (got.some((n) => n > 0) || state.doneAt) bundles[def.id] = state;
  }
  if (nonEmpty(bundles)) out.bundles = bundles;
  const projects: Record<string, ProjectState> = {};
  for (const def of PROJECTS) {
    const p = obj(obj(v.projects)[def.id]);
    if (!nonEmpty(p)) continue;
    const state: ProjectState = {
      got: safe(p.got) && p.got > 0 ? Math.min(def.cost, p.got) : 0,
      by: readActorAmounts(p.by),
    };
    if (safe(p.doneAt) && p.doneAt > 0) state.doneAt = p.doneAt;
    if (state.got > 0 || state.doneAt) projects[def.id] = state;
  }
  if (nonEmpty(projects)) out.projects = projects;
  const fest = obj(v.festival);
  if (safe(fest.week) && fest.week > 0) {
    const state: FestivalState = {
      week: fest.week,
      got: safe(fest.got) && fest.got > 0 ? Math.min(FESTIVAL_GOAL, fest.got) : 0,
      by: readActorAmounts(fest.by),
    };
    if (safe(fest.doneAt) && fest.doneAt > 0) state.doneAt = fest.doneAt;
    out.festival = state;
  }
  const flags = idList(v.flags, 32, (f) => own(VILLAGE_FLAGS, f));
  if (flags.length) out.flags = flags;
  const memories = Array.isArray(v.memories)
    ? v.memories.slice(-MEMORY_MAX).map(readMemory).filter((m): m is Memory => !!m)
    : [];
  if (memories.length) out.memories = memories;
  const news = Array.isArray(v.news)
    ? v.news
        .slice(-2)
        .map((d) => {
          const x = obj(d);
          return safe(x.day) && Array.isArray(x.lines)
            ? {
                day: x.day,
                lines: x.lines.slice(-NEWS_DAY_MAX).map(readNewsLine).filter((l): l is NewsLine => !!l),
              }
            : null;
        })
        .filter((d): d is { day: number; lines: NewsLine[] } => !!d && d.lines.length > 0)
    : [];
  if (news.length) out.news = news;
  const records: LifeExt['records'] = {};
  for (const [id, r] of Object.entries(obj(v.records)).slice(0, 100)) {
    const x = obj(r);
    if (own(FISH_BY_ID, id) && actorValid(x.actor) && safe(x.cm) && x.cm > 0)
      records[id] = { actor: x.actor, cm: x.cm, at: time(x.at) };
  }
  if (nonEmpty(records)) out.records = records;
  const bonds: Record<string, number> = {};
  for (const [k, n] of Object.entries(obj(v.bonds)).slice(0, 64)) {
    const m = /^([0-6])-([0-6])$/.exec(k);
    if (m && Number(m[1]) < Number(m[2]) && safe(n) && n > 0) bonds[k] = Math.min(BOND_MAX, n);
  }
  if (nonEmpty(bonds)) out.bonds = bonds;
  const social = readSocial(v.social);
  if (social) out.social = social;
  const bd = obj(v.bondDay);
  if (safe(bd.day)) {
    const keys = idList(bd.keys, 200, (s) => /^[a-z0-9:>-]+$/.test(s));
    if (keys.length) out.bondDay = { day: bd.day, keys };
  }
  return out;
}

// ---------------------------------------------------------------- helpers
const extOf = (life: LifeState, uid: string): UserExt => ((life.ext ??= {})[uid] ??= {});
/** The user's ext with daily fields reset when the KST day changed. */
function todayExt(life: LifeState, uid: string, now: number): UserExt {
  const x = extOf(life, uid),
    day = kstDay(now);
  if (x.day !== day) {
    x.day = day;
    delete x.taken;
    delete x.req;
    delete x.wf;
    delete x.ate;
    delete x.wished;
    delete x.dem;
    delete x.reroll;
  }
  return x;
}
export const farmSizeOf = (life: LifeState, uid: string): FarmSize =>
  life.ext?.[uid]?.plots ?? FARM_SIZES[0];
export const hasFlag = (life: LifeState, flag: string) => !!life.flags?.includes(flag);
const buffOf = (life: LifeState, uid: string, now: number) => {
  const b = life.ext?.[uid]?.buff;
  return b && now < b.until ? b : null;
};
/** Growth bonus for crops planted or fertilized now (초록 손 buff). */
export const plantSpeed = (life: LifeState, uid: string, now: number) =>
  buffOf(life, uid, now)?.kind === 'grow' ? GROW_BUFF_SPEED : 0;
/** Village-wide growth bonus for newly planted crops (온실 확장). */
export const villageGrowSpeed = (life: LifeState) => (hasFlag(life, 'greenhouse2') ? GREENHOUSE2_SPEED : 0);

// ---------------------------------------------------------------- demand (ECON-2)
/** Lowest share of the price a flooded item still fetches. */
export const DEMAND_FLOOR = 0.15;
/** Seasonal crops sell for this much more in their own season. */
export const SEASON_PREMIUM = 1.1;
/**
 * Units of the same thing (per friend, per KST day) after which the price has
 * halved. Short-growing base crops take more before they sag; strawberries
 * and watermelons sag fast, so a varied field (and seasonal crops) pays.
 */
export const DEMAND_HALF_LIFE: Readonly<Record<string, number>> = {
  carrot: 12,
  tomato: 10,
  pumpkin: 6,
  strawberry: 4,
  watermelon: 3,
  potato: 6,
  spinach: 5,
  corn: 6,
  sweetpotato: 5,
  cabbage: 5,
  fruit: 20,
};
export function demandHalfLife(id: string): number {
  if (Object.hasOwn(DEMAND_HALF_LIFE, id)) return DEMAND_HALF_LIFE[id];
  if (isCropId(id)) return 5;
  const def = ITEM_BY_ID[id];
  if (!def) return 6;
  if (def.kind === 'fish') {
    const w = FISH_BY_ID[id]?.weight ?? 20;
    return w >= 20 ? 6 : w >= 10 ? 4 : 2;
  }
  if (def.kind === 'bug') return 5;
  if (def.kind === 'dish') return 4;
  return 10;
}
/** Price multiplier of the k-th unit (0-based) of `id` sold today. */
export const demandMult = (id: string, k: number) =>
  Math.max(DEMAND_FLOOR, 0.5 ** (Math.max(0, k) / demandHalfLife(id)));
/**
 * Market saturation: once a friend has sold MARKET_SOFT범 today (all goods
 * together), each further 범 of sales pays 0.5^(over / MARKET_HALF). Casual
 * days never reach it; it only tapers very long selling days (no hard stop).
 */
export const MARKET_SOFT = 30_000;
export const MARKET_HALF = 20_000;
export const marketMult = (soldBeom: number) =>
  soldBeom <= MARKET_SOFT ? 1 : 0.5 ** ((soldBeom - MARKET_SOFT) / MARKET_HALF);
/**
 * 범 for selling n more units at `unit` each after `sold` units of the same
 * thing and `soldBeom` 범 of everything today.
 */
export function sellTotal(id: string, unit: number, sold: number, n: number, soldBeom = 0) {
  let total = 0;
  for (let i = 0; i < n; i++)
    total += Math.max(1, Math.round(unit * demandMult(id, sold + i) * marketMult(soldBeom + total)));
  return total;
}
/**
 * Client-side quote for the sell UI from a life view: 범 for n units of `id`
 * (crops: quality q), the undamped unit price and the price of the next unit.
 * Mirrors the server (same helpers); older servers without `demand` in the
 * view simply quote the full price.
 */
export function sellQuote(
  view: {
    me: { demand?: Record<string, number> };
    soldToday?: number;
    flags?: readonly string[];
    growth?: { mods: { cropSell: number; starSell: number; fishSell: number; dishSell: number } };
  },
  id: string,
  q: Quality,
  n: number,
  now: number,
) {
  const unit = sellUnit(id, q, now, view.flags ?? []),
    sold = view.me.demand?.[id] ?? 0,
    soldBeom = view.soldToday ?? 0,
    bonus = view.growth ? sellBonus(view.growth.mods, id, q) : 0;
  return {
    unit,
    total: n > 0 ? Math.round(sellTotal(id, unit, sold, n, soldBeom) * (1 + bonus)) : 0,
    next: sellTotal(id, unit, sold, 1, soldBeom),
    /** Share of the full price the next unit fetches (demand × market). */
    share: unit > 0 ? sellTotal(id, unit, sold, 1, soldBeom) / unit : 1,
  };
}
/** 성장 sale bonus share for an item (crops by star, fish, dishes). */
export function sellBonus(
  mods: { cropSell: number; starSell: number; fishSell: number; dishSell: number },
  id: string,
  q: Quality = 0,
) {
  if (isCropId(id)) return mods.cropSell + (q > 0 ? mods.starSell : 0);
  const kind = ITEM_BY_ID[id]?.kind;
  return kind === 'fish' ? mods.fishSell : kind === 'dish' ? mods.dishSell : 0;
}
/** 범 this friend has sold today (all goods). */
export function soldBeomToday(life: LifeState, uid: string, now: number) {
  const s = life.sold[uid];
  return s && s.day === kstDay(now) ? s.amount : 0;
}
/**
 * Full (undamped) price of one unit: crops by quality (+SEASON_PREMIUM in
 * season), fruit, or an item (fish on 낚시의 날 get the weekly bonus).
 */
export function sellUnit(id: string, quality: Quality, now: number, flags: readonly string[] = []) {
  if (id === 'fruit') return FRUIT_SELL;
  if (isCropId(id)) {
    const info = CROP_INFO[id],
      premium = info.seasons && cropInSeason(id, seasonOf(now)) ? SEASON_PREMIUM : 1;
    return Math.round(info.sell * QUALITY_MULT[quality] * premium);
  }
  const def = ITEM_BY_ID[id];
  if (!def || def.sell <= 0) return 0;
  const bonus =
    def.kind === 'fish' && weeklyActive('fishing', now) ? FISH_DAY_BONUS * (flags.includes('stage') ? 2 : 1) : 0;
  return Math.round(def.sell * (1 + bonus));
}
/** Units of `id` this friend already sold today. */
export function demandSold(life: LifeState, uid: string, now: number, id: string) {
  const x = life.ext?.[uid];
  return x?.day === kstDay(now) ? (x.dem?.[id] ?? 0) : 0;
}
export function noteDemand(life: LifeState, uid: string, now: number, id: string, n: number) {
  const x = todayExt(life, uid, now),
    dem = (x.dem ??= {});
  dem[id] = Math.min(COUNT_MAX, (dem[id] ?? 0) + n);
}
/**
 * What a friend owns outside the ledger at base sell value (bag produce,
 * fruit, items, seeds at seed price). Used by the daily relief so spending
 * 범 on goods before claiming does not count as being broke.
 */
export function lifeWealth(life: LifeState, uid: string) {
  const bag = life.bag[uid];
  let total = 0;
  if (bag) {
    for (const c of CROPS) total += (bag.produce[c] ?? 0) * CROP_INFO[c].sell + (bag.seeds[c] ?? 0) * CROP_INFO[c].seed;
    total += (bag.fruit ?? 0) * FRUIT_SELL;
  }
  for (const [id, n] of Object.entries(life.ext?.[uid]?.inv ?? {})) total += n * (ITEM_BY_ID[id]?.sell ?? 0);
  return Math.min(Number.MAX_SAFE_INTEGER, total);
}
/** KST week (Monday start) of a KST day number. */
export const weekOfDay = (day: number) => Math.floor((day + 3) / 7);
/** When a KST week ends (next Monday 00:00 KST). */
export const weekResetAt = (week: number) => dayStart(week * 7 + 4);
export function bump(life: LifeState, uid: string, stat: StatKey, n: number) {
  if (n <= 0) return;
  const stats = (extOf(life, uid).stats ??= {});
  stats[stat] = Math.min(STAT_MAX, (stats[stat] ?? 0) + n);
}
export function discover(life: LifeState, uid: string, id: string) {
  const x = extOf(life, uid),
    dex = (x.dex ??= []);
  if (!dex.includes(id) && dex.length < DEX_MAX) dex.push(id);
}
function setCount<K extends string>(map: Partial<Record<K, number>>, key: K, n: number) {
  if (n > 0) map[key] = Math.min(COUNT_MAX, n);
  else delete map[key];
}
/**
 * Crop quality tiers: `bag.produce[crop]` is the total of every quality (so
 * older clients keep working); ext.q1/q2 count how many of those are
 * silver/gold. Normal = total − silver − gold.
 */
export function cropQCount(life: LifeState, uid: string, crop: Crop, q: Quality) {
  const total = life.bag[uid]?.produce[crop] ?? 0,
    x = life.ext?.[uid],
    q1 = Math.min(total, x?.q1?.[crop] ?? 0),
    q2 = Math.min(total - q1, x?.q2?.[crop] ?? 0);
  return q === 0 ? total - q1 - q2 : q === 1 ? q1 : q2;
}
/** Adds (or with negative n removes) crops of exactly one quality. */
export function addCropQ(life: LifeState, uid: string, crop: Crop, q: Quality, n: number) {
  if (n < 0 && cropQCount(life, uid, crop, q) < -n) fail(LIFE_REJECT.notEnough);
  const bag = (life.bag[uid] ??= emptyBag());
  const before = bag.produce[crop];
  bag.produce[crop] = n >= 0 ? addCount(before, n) : before + n;
  const added = bag.produce[crop] - before;
  if (q === 0 || added === 0) return;
  const x = extOf(life, uid),
    key = q === 1 ? 'q1' : 'q2',
    map = (x[key] ??= {});
  setCount(map, crop, (map[crop] ?? 0) + added);
  if (!nonEmpty(map)) delete x[key];
}
/** Removes n crops, lowest eligible quality first; returns [normal, silver, gold] taken. */
export function takeCrop(life: LifeState, uid: string, crop: Crop, n: number, minQ: Quality = 0) {
  const taken: [number, number, number] = [0, 0, 0];
  let left = n;
  for (const t of [0, 1, 2] as Quality[]) {
    if (t < minQ || !left) continue;
    const take = Math.min(left, cropQCount(life, uid, crop, t));
    if (take) addCropQ(life, uid, crop, t, -take);
    taken[t] = take;
    left -= take;
  }
  if (left) fail(LIFE_REJECT.notEnough);
  return taken;
}
export const invCount = (life: LifeState, uid: string, item: string) =>
  life.ext?.[uid]?.inv?.[item] ?? 0;
export function addInv(life: LifeState, uid: string, item: string, n: number) {
  const x = extOf(life, uid),
    inv = (x.inv ??= {});
  setCount(inv, item, (inv[item] ?? 0) + n);
  if (!nonEmpty(inv)) delete x.inv;
}
/** How many of an item (crops: at least quality q, any tier) the user has. */
function itemCount(life: LifeState, uid: string, id: string, q: Quality = 0) {
  if (isCropId(id))
    return ([0, 1, 2] as Quality[])
      .filter((t) => t >= q)
      .reduce((s: number, t) => s + cropQCount(life, uid, id, t), 0);
  if (id === 'fruit') return life.bag[uid]?.fruit ?? 0;
  return invCount(life, uid, id);
}
/** Removes n of an item; crops go lowest eligible quality first. */
function takeItem(life: LifeState, uid: string, id: string, n: number, q: Quality = 0) {
  if (itemCount(life, uid, id, q) < n) fail(PLUS_REJECT.ingredients);
  if (isCropId(id)) takeCrop(life, uid, id, n, q);
  else if (id === 'fruit') life.bag[uid].fruit -= n;
  else addInv(life, uid, id, -n);
}
const catItems = (life: LifeState, uid: string, cat: string) =>
  Object.entries(life.ext?.[uid]?.inv ?? {})
    .filter(([id]) => ITEM_BY_ID[id]?.cat === cat)
    .sort(([a], [b]) => ITEM_BY_ID[a].sell - ITEM_BY_ID[b].sell || (a < b ? -1 : 1));
function needCount(life: LifeState, uid: string, need: Need) {
  if ('beom' in need) return 0;
  if ('cat' in need) return catItems(life, uid, need.cat).reduce((s, [, n]) => s + n, 0);
  return itemCount(life, uid, need.item, need.q ?? 0);
}
/** Takes n of a recipe/bundle input (a category takes its cheapest items first). */
function takeNeed(life: LifeState, uid: string, need: Need, n: number) {
  if ('beom' in need) return;
  if (needCount(life, uid, need) < n) fail(PLUS_REJECT.ingredients);
  if ('item' in need) return takeItem(life, uid, need.item, n, need.q ?? 0);
  let left = n;
  for (const [id, have] of catItems(life, uid, need.cat)) {
    const take = Math.min(left, have);
    addInv(life, uid, id, -take);
    left -= take;
    if (!left) break;
  }
}
const nameOf = (actor: number) => ACTOR_NAMES[actor] ?? '친구';
const josaGa = (name: string) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 ? '이' : '가');
};
export const itemName = (id: string) =>
  isCropId(id) ? CROP_INFO[id].name : id === 'fruit' ? '과일' : (ITEM_BY_ID[id]?.name ?? FURNITURE_BY_REF[id]?.name ?? id);
const round10 = (n: number) => Math.round(n / 10) * 10;
const seqId = (life: LifeState, prefix: string, uid: string) => `${prefix}-${uid}-${++life.seq}`;
const walletOf = (uid: string) => 'wallet-' + uid;
function grant(ledger: LoungeLedger, life: LifeState, uid: string, amount: number, reason: string, now: number) {
  if (amount <= 0 || !own(ledger.accounts, walletOf(uid))) return ledger;
  return grantBeom(ledger, walletOf(uid), amount, seqId(life, 'life-' + reason, uid), now, reason);
}
function spend(ledger: LoungeLedger, life: LifeState, uid: string, amount: number, reason: string, now: number) {
  if ((ledger.accounts[walletOf(uid)] ?? 0) < amount) fail(LIFE_REJECT.balance);
  return spendBeom(ledger, walletOf(uid), amount, seqId(life, 'life-' + reason, uid), now, reason);
}
/** Weighted deterministic pick. */
function pickWeighted<T>(list: readonly T[], weight: (t: T) => number, key: string): T | null {
  const total = list.reduce((s, t) => s + Math.max(0, weight(t)), 0);
  if (total <= 0) return null;
  let roll = (hash32(key) % 1_000_000) / 1_000_000 * total;
  for (const t of list) {
    roll -= Math.max(0, weight(t));
    if (roll < 0) return t;
  }
  return list[list.length - 1];
}

// ---------------------------------------------------------------- news, memories, bonds
export function addNews(life: LifeState, now: number, key: string, kind: string, text: string, actors: number[]) {
  const day = kstDay(now),
    news = (life.news ??= []).filter((d) => d.day >= day - 1);
  let today = news.find((d) => d.day === day);
  if (!today) news.push((today = { day, lines: [] }));
  if (!today.lines.some((l) => l.key === key) && today.lines.length < NEWS_DAY_MAX)
    today.lines.push({ key, kind, text: clipText(text, 80), actors });
  life.news = news;
}
export function addMemory(life: LifeState, now: number, kind: string, actors: number[], text: string) {
  life.memories = [
    ...(life.memories ?? []),
    { id: `mem-${(++life.seq).toString(36)}`, kind, actors, text: clipText(text, 80), at: now },
  ].slice(-MEMORY_MAX);
}
export const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
export const bondLevel = (points: number) => BOND_LEVELS.filter((t) => points >= t).length;
/** Friendship points of a pair; with `now`, after idle decay (lounge-life-social decayedBond). */
export const bondPoints = (life: LifeState, a: number, b: number, now?: number) => {
  if (a === b) return 0;
  const key = pairKey(a, b),
    points = legacyBond(life, life.bonds?.[key] ?? 0);
  return now === undefined ? points : decayedBond(points, bondLastDay(life, key), kstDay(now));
};
/** Counts a friendship source once per `gate` key per KST day. Returns false when already counted. */
export function bondGate(life: LifeState, gate: string, now: number) {
  const day = kstDay(now);
  if (life.bondDay?.day !== day) life.bondDay = { day, keys: [] };
  if (life.bondDay.keys.includes(gate) || life.bondDay.keys.length >= 200) return false;
  life.bondDay.keys.push(gate);
  return true;
}
export function addBond(life: LifeState, a: number, b: number, points: number, now: number) {
  if (a === b || !actorValid(a) || !actorValid(b) || points <= 0) return;
  migrateBonds(life);
  const key = pairKey(a, b),
    stored = life.bonds?.[key] ?? 0,
    // Idle decay is applied lazily: first settle it, then add the new points.
    before = decayedBond(stored, bondLastDay(life, key), kstDay(now)),
    after = Math.min(BOND_MAX, before + Math.round(points));
  (life.bonds ??= {})[key] = after;
  touchBond(life, key, kstDay(now));
  const from = bondLevel(before),
    to = bondLevel(after);
  if (to > from) {
    const text = `${nameOf(a)}와(과) ${nameOf(b)}의 우정이 ♥${to}이 됐어요`;
    addMemory(life, now, 'bond', [a, b], text);
    addNews(life, now, `bond:${key}:${to}`, 'bond', text, [a, b]);
  }
  // Heart-level rewards both ways (idempotent; lounge-life-social).
  grantHeartRewards(life, a, b, now);
  grantHeartRewards(life, b, a, now);
}

// ---------------------------------------------------------------- achievements
function achProgress(x: UserExt | undefined, stat: StatKey) {
  return stat === 'dex' ? (x?.dex?.length ?? 0) : (x?.stats?.[stat] ?? 0);
}
/** Grants every newly reached achievement (one-time, recorded in ext.ach). */
export function settleAchievements(life: LifeState, ledger: LoungeLedger, uid: string, now: number) {
  let next = ledger;
  const x = life.ext?.[uid];
  // Without a registered wallet nothing is marked done (retried next time).
  if (!x || !own(ledger.accounts, walletOf(uid))) return next;
  for (const a of ACHIEVEMENTS) {
    if (x.ach?.includes(a.id) || achProgress(x, a.stat) < a.goal) continue;
    (x.ach ??= []).push(a.id);
    next = grant(next, life, uid, a.reward, 'ach', now);
  }
  return next;
}
export function afterCoreAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  now: number,
) {
  const next = settleSocial(life, ledger, member, now);
  return { life, ledger: settleAchievements(life, next, member.id, now) };
}

// ---------------------------------------------------------------- shop
const holidayNear = (key: string, day: number, span = 3) => {
  for (let d = day - span; d <= day + span; d++) if (holidaysOn(d).some((h) => h.key === key)) return true;
  return false;
};
export type ShopItemView = {
  ref: string;
  name: string;
  price: number;
  limited?: 'season' | 'holiday' | 'luxury';
};
export type ShopView = {
  day: number;
  resetAt: number;
  discount: number;
  items: ShopItemView[];
  /** 이번 주 명품 가구 (one copy per friend per week). */
  luxury?: ShopItemView[];
  /** When the luxury rotation changes (next Monday 00:00 KST). */
  luxuryResetAt?: number;
  /** Luxury refs this friend already bought this week. */
  luxuryBought?: string[];
  /** Rerolls used today and the price of the next one (null = none left). */
  rerolls?: number;
  rerollPrice?: number | null;
};
/** This week's luxury pieces (weekly rarity; +1 with the 축제 무대 project). */
export function luxuryStock(life: LifeState, now: number) {
  const week = weekOfDay(kstDay(now));
  return FURNITURE.filter((f) => f.luxury)
    .sort((a, b) => hash32(`lux:${week}:${a.ref}`) - hash32(`lux:${week}:${b.ref}`))
    .slice(0, LUXURY_PER_WEEK + (hasFlag(life, 'festival') ? 1 : 0) + furnitureBonus(life).luxury);
}
/**
 * Today's furniture stock: limited pieces always, then a daily rotation. With
 * `uid`, the rotation follows that friend's rerolls today and the view adds
 * the weekly luxury pieces.
 */
export function shopStock(life: LifeState, now: number, uid?: string): ShopView {
  const day = kstDay(now),
    season = seasonOfDay(day),
    sunday = weekdayOf(day) === 0,
    discount = sunday ? MARKET_DISCOUNT : 0,
    size = SHOP_DAILY_ITEMS + (sunday ? MARKET_EXTRA : 0) + (hasFlag(life, 'market') ? 2 : 0) + furnitureBonus(life).stock;
  const x = uid ? life.ext?.[uid] : undefined,
    rerolls = x?.day === day ? (x.reroll ?? 0) : 0,
    seed = rerolls ? `shop:${day}:r${rerolls}:${uid}` : `shop:${day}`;
  const pool = FURNITURE.filter(
    (f) => !f.unsold && !f.luxury && (!f.season || f.season === season) && (!f.holiday || holidayNear(f.holiday, day)),
  );
  const limited = pool.filter((f) => f.season || f.holiday),
    regular = pool
      .filter((f) => !f.season && !f.holiday)
      .sort((a, b) => hash32(`${seed}:${a.ref}`) - hash32(`${seed}:${b.ref}`));
  const price = (p: number) => Math.round((p * (100 - discount)) / 100 / 100) * 100;
  const items = [...limited, ...regular].slice(0, Math.max(size, limited.length)).map((f) => ({
    ref: f.ref,
    name: f.name,
    price: price(f.price),
    ...(f.holiday ? { limited: 'holiday' as const } : f.season ? { limited: 'season' as const } : {}),
  }));
  const view: ShopView = { day, resetAt: nextKstMidnight(now), discount, items };
  if (uid) {
    const week = weekOfDay(day);
    view.luxury = luxuryStock(life, now).map((f) => ({ ref: f.ref, name: f.name, price: f.price, limited: 'luxury' as const }));
    view.luxuryResetAt = weekResetAt(week);
    view.luxuryBought = x?.lux?.w === week ? [...x.lux.refs] : [];
    view.rerolls = rerolls;
    view.rerollPrice = rerolls < rerollMax(life) ? shopRerollPrice(rerolls) : null;
  }
  return view;
}

// ---------------------------------------------------------------- spawns
const spotOpen = (life: LifeState, flag?: string) => !flag || hasFlag(life, flag);
/** Today's forage item at a spot (null = nothing grows there today). */
export function forageAt(spotId: string, day: number): string | null {
  const spot = SPOT_BY_ID[spotId];
  if (!spot) return null;
  if (hash32(`forage-on:${spotId}:${day}`) % 100 >= 85) return null;
  const season = seasonOfDay(day),
    weather = weatherOf(day);
  const list = FORAGE.filter(
    (f) => f.seasons.includes(season) && f.habitat.includes(spot.habitat) && eligibleSky(f.sky, weather),
  );
  return pickWeighted(list, (f) => f.weight, `forage:${spotId}:${day}`)?.id ?? null;
}
export const BUG_SLOTS = ['dawn', 'day', 'evening', 'night'] as const;
/** The bug at a spot in a time slot of a day (null = none). */
export function bugAt(spotId: string, day: number, slot: number): string | null {
  const spot = SPOT_BY_ID[spotId];
  if (!spot) return null;
  if (hash32(`bug-on:${spotId}:${day}:${slot}`) % 100 >= 60) return null;
  const season = seasonOfDay(day),
    weather = weatherOf(day),
    tod = BUG_SLOTS[slot],
    daytime = tod !== 'night',
    nighttime = tod !== 'day';
  const list = BUGS.filter(
    (b) =>
      b.seasons.includes(season) &&
      b.habitat.includes(spot.habitat) &&
      eligibleSky(b.sky, weather) &&
      eligibleTime(b.time, daytime, nighttime),
  );
  return pickWeighted(list, (b) => b.weight, `bug:${spotId}:${day}:${slot}`)?.id ?? null;
}
const slotOf = (now: number) => BUG_SLOTS.indexOf(timeOfDay(now));

// ---------------------------------------------------------------- fishing
export function fishCandidates(spot: Spot, season: Season, weather: Weather, now: number) {
  const day = isDaytime(now),
    night = isNighttime(now);
  return FISH.filter(
    (f) =>
      f.spots.includes(spot) &&
      f.seasons.includes(season) &&
      eligibleSky(f.sky, weather) &&
      eligibleTime(f.time, day, night),
  );
}

// ---------------------------------------------------------------- requests
export type RequestView = { from: number; item: string; n: number; reward: number; done: boolean };
function requestItemValue(id: string) {
  if (isCropId(id)) return CROP_INFO[id].sell;
  if (id === 'fruit') return FRUIT_SELL;
  return ITEM_BY_ID[id]?.sell ?? 0;
}
function requestCandidates(life: LifeState, cat: ItemCategory, season: Season): string[] {
  const greenhouse = hasFlag(life, 'greenhouse');
  switch (cat) {
    case 'crop':
      return CROPS.filter((c) => greenhouse || cropInSeason(c, season));
    case 'fruit':
      return ['fruit'];
    case 'fish':
      return FISH.filter(
        (f) =>
          f.seasons.includes(season) &&
          f.weight >= 5 &&
          // Requests ask only for fish from spots anyone can use now (no rod / night gate).
          f.spots.some(
            (s) => (!SPOT_INFO[s].flag || hasFlag(life, SPOT_INFO[s].flag!)) && !SPOT_INFO[s].rod && !SPOT_INFO[s].night,
          ),
      ).map((f) => f.id);
    case 'bug':
      return BUGS.filter((b) => b.seasons.includes(season) && b.weight >= 10).map((b) => b.id);
    case 'dish':
      // Only dishes whose ingredients can be found this season.
      return DISHES.filter(
        (d) =>
          (!d.flag || hasFlag(life, d.flag)) &&
          d.needs.every((n) =>
            !('item' in n)
              ? true
              : isCropId(n.item)
                ? greenhouse || cropInSeason(n.item, season)
                : !FORAGE.some((f) => f.id === n.item) ||
                  FORAGE.some((f) => f.id === n.item && f.seasons.includes(season)),
          ),
      ).map((d) => d.id);
    default:
      return FORAGE.filter(
        (f) =>
          f.seasons.includes(season) &&
          f.weight >= 10 &&
          (cat === 'forage' ? f.kind === 'forage' : cat === 'flower' ? f.kind === 'flower' : f.kind === 'material'),
      ).map((f) => f.id);
  }
}
/** Today's requests to `actor` from three friends (deterministic, offline-friend NPCs). */
export function requestsFor(life: LifeState, actor: number, day: number): Omit<RequestView, 'done'>[] {
  const season = seasonOfDay(day);
  const friends = [0, 1, 2, 3, 4, 5, 6]
    .filter((f) => f !== actor)
    .sort((a, b) => hash32(`req:${day}:${actor}:${a}`) - hash32(`req:${day}:${actor}:${b}`))
    .slice(0, REQUESTS_PER_DAY)
    .sort((a, b) => a - b);
  return friends.map((from) => {
    const likes = FRIEND_PROFILES[from]?.likes ?? [];
    const cats: ItemCategory[] = likes.length ? likes : ['crop'];
    const key = `req:${day}:${actor}:${from}`;
    let list: string[] = [];
    for (let i = 0; i < cats.length && !list.length; i++)
      list = requestCandidates(life, cats[(hash32(key + ':cat') + i) % cats.length], season);
    if (!list.length) list = ['carrot'];
    const item = list[hash32(key + ':item') % list.length],
      single = !isCropId(item) && item !== 'fruit' && ['fish', 'bug', 'dish'].includes(ITEM_BY_ID[item]?.cat as string),
      n = single ? 1 : 1 + (hash32(key + ':n') % 3);
    return { from, item, n, reward: Math.min(REQUEST_REWARD_MAX, round10(requestItemValue(item) * n * 1.5 + REQUEST_BASE_REWARD)) };
  });
}

// ---------------------------------------------------------------- actions
const nInRange = (n: unknown, max: number, def = 1) => {
  const v = n === undefined ? def : n;
  return safe(v) && v >= 1 && v <= max ? v : fail(LIFE_REJECT.invalid);
};
const expected = (spot: Spot, life: LifeState, rod: number, now: number) => {
  if (!(FISH_SPOTS as readonly string[]).includes(spot)) fail(PLUS_REJECT.spot);
  const info = SPOT_INFO[spot];
  if (!spotOpen(life, info.flag)) fail(PLUS_REJECT.spotLocked);
  if (info.rod && rod < info.rod) fail(PLUS_REJECT.spotRod);
  if (info.night && !isNighttime(now)) fail(PLUS_REJECT.spotNight);
};
/** Why a spot cannot be fished now ('' = open): flag, rod level or the clock. */
export function spotBlock(spot: Spot, flags: readonly string[], rod: number, now: number): '' | 'flag' | 'rod' | 'night' {
  const info = SPOT_INFO[spot];
  if (!info) return 'flag';
  if (info.flag && !flags.includes(info.flag)) return 'flag';
  if (info.rod && rod < info.rod) return 'rod';
  if (info.night && !isNighttime(now)) return 'night';
  return '';
}
/**
 * Applies one life-expansion action for `member` on an already-cloned life
 * (lounge-life.ts lifeAction clones and registers the member first).
 */
export function plusAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: PlusAction,
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  const uid = member.id,
    actor = member.actor,
    x = todayExt(life, uid, now),
    farm = life.farms[uid];
  let next = ledger;
  switch (a.kind) {
    case 'fertilize': {
      const level = a.item === 'fertilizer' ? 1 : a.item === 'fertilizer-deluxe' ? 2 : 0;
      if (!level || !(FERTILIZERS as readonly string[]).includes(a.item)) fail(PLUS_REJECT.fert);
      const open = (i: number) => {
        const p = farm[i];
        return !!p.crop && (p.fert ?? 0) < level && now < plotReadyAt(p, now)!;
      };
      let targets: number[];
      if (a.plot === -1) targets = farm.flatMap((_, i) => (open(i) ? [i] : []));
      else {
        if (!safe(a.plot) || a.plot < 0 || a.plot >= farm.length) fail(LIFE_REJECT.plot);
        const p = farm[a.plot];
        if (!p.crop) fail(LIFE_REJECT.empty);
        if ((p.fert ?? 0) >= level) fail(PLUS_REJECT.fertDone);
        if (now >= plotReadyAt(p, now)!) fail(LIFE_REJECT.grown);
        targets = [a.plot];
      }
      if (!targets.length) fail(PLUS_REJECT.nothingToFert);
      if (invCount(life, uid, a.item) < 1) fail(LIFE_REJECT.notEnough);
      targets = targets.slice(0, invCount(life, uid, a.item));
      const speedUp = (level === 2 ? DELUXE_SPEED : 0) + plantSpeed(life, uid, now);
      for (const i of targets) {
        const p = farm[i];
        addInv(life, uid, a.item, -1);
        p.fert = level as 1 | 2;
        if (speedUp) p.speed = Math.min(MAX_SPEED, (p.speed ?? 0) + speedUp);
      }
      break;
    }
    case 'expandFarm': {
      const size = farmSizeOf(life, uid),
        to = size === 6 ? 9 : size === 9 ? 12 : 0;
      if (!to) fail(PLUS_REJECT.farmMax);
      next = spend(next, life, uid, FARM_EXPAND_PRICE[to as 9 | 12], 'farm-' + to, now);
      x.plots = to as 9 | 12;
      while (farm.length < to) farm.push({ crop: null, plantedAt: 0, wateredAt: null });
      break;
    }
    case 'waterFriend': {
      const owner = uidOf(life, a.owner);
      if (!owner || owner === uid || !life.farms[owner]) fail(PLUS_REJECT.friendFarm);
      const ownerActor = life.actors[owner!],
        theirs = life.farms[owner!];
      if (x.wf?.includes(ownerActor)) fail(PLUS_REJECT.friendWatered);
      const needs = (i: number) => {
        const p = theirs[i];
        return !!p.crop && p.wateredAt === null && plotRainAt(p, now) === null && now < plotReadyAt(p, now)!;
      };
      let targets: number[];
      if (a.plot === -1) targets = theirs.flatMap((_, i) => (needs(i) ? [i] : []));
      else {
        if (!safe(a.plot) || a.plot < 0 || a.plot >= theirs.length) fail(LIFE_REJECT.plot);
        targets = needs(a.plot) ? [a.plot] : [];
      }
      if (!targets.length) fail(LIFE_REJECT.nothingToWater);
      for (const i of targets) theirs[i].wateredAt = now;
      (x.wf ??= []).push(ownerActor);
      bump(life, uid, 'waterFriend', 1);
      gainXp(life, uid, 'farm', XP.water * targets.length, now);
      if (bondGate(life, `w:${actor}>${ownerActor}`, now)) addBond(life, actor, ownerActor, BOND_POINTS.water, now);
      addNews(
        life,
        now,
        `wf:${actor}>${ownerActor}`,
        'water',
        `${josaGa(nameOf(actor))} ${nameOf(ownerActor)}의 밭에 물을 줬어요`,
        [actor, ownerActor],
      );
      break;
    }
    case 'buyFurniture': {
      const n = nInRange(a.n, SHOP_BUY_MAX_N),
        view = shopStock(life, now, uid),
        luxury = view.luxury?.find((i) => i.ref === a.ref),
        stock = luxury ?? view.items.find((i) => i.ref === a.ref);
      if (!stock) fail(PLUS_REJECT.stock);
      if (luxury) {
        const week = weekOfDay(kstDay(now));
        if (n !== 1) fail(PLUS_REJECT.luxuryOne);
        if (x.lux?.w === week && x.lux.refs.includes(luxury.ref)) fail(PLUS_REJECT.luxuryBought);
        next = spend(next, life, uid, luxury.price, 'furn-premium', now);
        x.lux = { w: week, refs: [...(x.lux?.w === week ? x.lux.refs : []), luxury.ref] };
        addNews(
          life,
          now,
          `lux:${actor}:${luxury.ref}`,
          'shop',
          `${josaGa(nameOf(actor))} 이번 주 명품 가구 ${luxury.name}을(를) 들였어요`,
          [actor],
        );
      } else next = spend(next, life, uid, stock!.price * n, 'furn', now);
      const furn = (x.furn ??= {});
      furn[stock!.ref] = Math.min(COUNT_MAX, (furn[stock!.ref] ?? 0) + n);
      bump(life, uid, 'furniture', n);
      break;
    }
    case 'rerollShop': {
      const used = x.reroll ?? 0;
      if (used >= rerollMax(life)) fail(PLUS_REJECT.rerollMax);
      next = spend(next, life, uid, shopRerollPrice(used), 'shop-reroll', now);
      x.reroll = used + 1;
      break;
    }
    case 'upgradeHouse': {
      const tier = HOUSE_TIERS.find((t) => t.tier === (x.house ?? 0) + 1);
      if (!tier) fail(PLUS_REJECT.houseMax);
      // 범마을 부동산's plan rooms take 10% off tiers 3 and 4.
      next = spend(next, life, uid, housePrice(life, tier!.tier, tier!.price), 'house-' + tier!.tier, now);
      x.house = tier!.tier;
      const text = `${josaGa(nameOf(actor))} 집을 넓혔어요 · ${tier!.name}`;
      addNews(life, now, `house:${actor}:${tier!.tier}`, 'house', text, [actor]);
      if (tier!.tier >= 3) addMemory(life, now, 'house', [actor], text);
      break;
    }
    case 'project': {
      const def = typeof a.project === 'string' && own(PROJECT_BY_ID, a.project) ? PROJECT_BY_ID[a.project] : undefined;
      if (!def) fail(PLUS_REJECT.project);
      if (def!.requires && !hasFlag(life, def!.requires)) fail(PLUS_REJECT.projectLocked);
      const projects = (life.projects ??= {}),
        state = (projects[def!.id] ??= { got: 0, by: {} });
      if (state.doneAt || state.got >= def!.cost) fail(PLUS_REJECT.projectDone);
      const left = def!.cost - state.got;
      if (!safe(a.n) || a.n < Math.min(PROJECT_MIN_GIVE, left)) fail(PLUS_REJECT.give);
      const amount = Math.min(a.n, left);
      next = spend(next, life, uid, amount, 'project', now);
      state.got += amount;
      state.by[String(actor)] = Math.min(Number.MAX_SAFE_INTEGER, (state.by[String(actor)] ?? 0) + amount);
      bump(life, uid, 'bundle', 1);
      addNews(life, now, `proj:${def!.id}:${actor}`, 'bundle', `${josaGa(nameOf(actor))} 마을 공사 “${def!.name}”에 범을 보탰어요`, [actor]);
      if (state.got >= def!.cost) {
        state.doneAt = now;
        if (!hasFlag(life, def!.flag)) (life.flags ??= []).push(def!.flag);
        const helpers = Object.keys(state.by).map(Number).filter(actorValid).sort((p, q) => p - q);
        for (const helper of helpers) {
          const helperUid = uidOf(life, helper);
          if (!helperUid) continue;
          const furn = (extOf(life, helperUid).furn ??= {});
          furn['furn-project-plaque'] = Math.min(COUNT_MAX, (furn['furn-project-plaque'] ?? 0) + 1);
        }
        const text = `마을 공사 “${def!.name}” 완공! ${VILLAGE_FLAGS[def!.flag].split(' · ')[0]}이(가) 생겼어요`;
        addMemory(life, now, 'project', helpers, text);
        addNews(life, now, `projdone:${def!.id}`, 'bundle', text, helpers);
      }
      break;
    }
    case 'festival': {
      const week = weekOfDay(kstDay(now));
      if (life.festival?.week !== week) life.festival = { week, got: 0, by: {} };
      const fest = life.festival;
      if (fest.doneAt || fest.got >= FESTIVAL_GOAL) fail(PLUS_REJECT.festivalDone);
      const left = FESTIVAL_GOAL - fest.got;
      if (!safe(a.n) || a.n < Math.min(PROJECT_MIN_GIVE, left)) fail(PLUS_REJECT.give);
      const amount = Math.min(a.n, left);
      next = spend(next, life, uid, amount, 'festival', now);
      fest.got += amount;
      fest.by[String(actor)] = Math.min(Number.MAX_SAFE_INTEGER, (fest.by[String(actor)] ?? 0) + amount);
      addNews(life, now, `fest:${week}:${actor}`, 'bundle', `${josaGa(nameOf(actor))} 이번 주 마을 축제 기금에 범을 보탰어요`, [actor]);
      if (fest.got >= FESTIVAL_GOAL) {
        fest.doneAt = now;
        const souvenir = festivalSouvenir(week),
          helpers = Object.entries(fest.by)
            .filter(([, n]) => n >= FESTIVAL_SOUVENIR_MIN)
            .map(([a]) => Number(a))
            .filter(actorValid)
            .sort((p, q) => p - q);
        for (const helper of helpers) {
          const helperUid = uidOf(life, helper);
          if (!helperUid) continue;
          const furn = (extOf(life, helperUid).furn ??= {});
          furn[souvenir] = Math.min(COUNT_MAX, (furn[souvenir] ?? 0) + 1);
        }
        const text = `이번 주 마을 축제 기금이 다 모였어요! 기념품 ${FURNITURE_BY_REF[souvenir].name}`;
        addMemory(life, now, 'festival', helpers, text);
        addNews(life, now, `festdone:${week}`, 'bundle', text, helpers);
      }
      break;
    }
    case 'buyItem': {
      const price = typeof a.item === 'string' && own(ITEM_PRICES, a.item) ? ITEM_PRICES[a.item] : 0;
      if (!price) fail(LIFE_REJECT.item);
      const n = nInRange(a.n, 20);
      next = spend(next, life, uid, price * n, 'buy-' + a.item, now);
      addInv(life, uid, a.item, n);
      break;
    }
    case 'upgradeRod': {
      const rod = x.rod ?? 1;
      if (rod >= 3) fail(PLUS_REJECT.rodMax);
      const to = (rod + 1) as 2 | 3;
      next = spend(next, life, uid, ROD_PRICE[to], 'rod-' + to, now);
      x.rod = to;
      break;
    }
    case 'cast': {
      expected(a.spot, life, x.rod ?? 1, now);
      const season = seasonOf(now),
        weather = weatherOf(kstDay(now)),
        rod = x.rod ?? 1,
        luck = buffOf(life, uid, now)?.kind === 'luck',
        bait = invCount(life, uid, 'bait') > 0,
        mods = growthMods(life, uid);
      // 성장: 미끼꾼 / 미끼 연구가 sometimes keep the bait.
      if (bait && !growthChance(life, uid, 'bait', mods.baitKeep, now)) addInv(life, uid, 'bait', -1);
      const seq = ++life.seq,
        token = hash32(`cast:${uid}:${seq}:${now}`).toString(36) + seq.toString(36);
      const found = fishCandidates(a.spot, season, weather, now),
        list = found.length ? found : FISH.filter((f) => f.spots.includes(a.spot) && f.weight >= 10);
      const lights = a.spot === 'sea' && isNighttime(now) && hasFlag(life, 'lights');
      const rareBoost =
        (luck ? 2 : 1) *
        (bait ? 2 : 1) *
        (rod === 3 ? 1.5 : 1) *
        (lights ? LIGHTS_RARE_BOOST : 1) *
        (a.spot === 'sea' || a.spot === 'harbor' || a.spot === 'rocks' ? 1 + mods.seaRare : 1);
      const fish =
        pickWeighted(
          list,
          (f) => (f.weight < 10 ? f.weight * rareBoost * (f.weight <= 1 ? 1 + mods.legend : 1) : f.weight),
          `fish:${token}`,
        ) ?? FISH_BY_ID.crucian;
      const [lo, hi] = fish.cm,
        cm = lo + (hash32(`cm:${token}`) % (hi - lo + 1)),
        biteAt = now + BITE_MIN_MS + (hash32(`bite:${token}`) % BITE_SPREAD_MS),
        windowMs = Math.round(fish.windowMs * ROD_WINDOW[rod] * (luck ? 1.2 : 1) * (1 + mods.biteWindow));
      x.pending = {
        token: token.slice(0, 24),
        spot: a.spot,
        castAt: now,
        biteAt,
        windowMs,
        expiresAt: biteAt + windowMs + REEL_SLACK_MS,
        fish: fish.id,
        cm,
      };
      break;
    }
    case 'reel': {
      const p = x.pending;
      if (!p || typeof a.token !== 'string' || a.token !== p.token || now > p.expiresAt + 60_000)
        fail(PLUS_REJECT.token);
      delete x.pending;
      const timing = a.timingMs;
      if (now < p!.biteAt - REEL_EARLY_MS) {
        x.last = { ok: false, at: now, reason: 'early' };
        gainXp(life, uid, 'fish', XP.fishMiss, now);
        break;
      }
      if (now > p!.expiresAt) {
        x.last = { ok: false, at: now, reason: 'late' };
        gainXp(life, uid, 'fish', XP.fishMiss, now);
        break;
      }
      if (!safe(timing) || timing < 0 || timing > p!.windowMs) {
        x.last = { ok: false, at: now, reason: 'timing' };
        gainXp(life, uid, 'fish', XP.fishMiss, now);
        break;
      }
      const fish = FISH_BY_ID[p!.fish];
      addInv(life, uid, fish.id, 1);
      bump(life, uid, 'fish', 1);
      gainXp(life, uid, 'fish', fishXp(fish.weight), now);
      discover(life, uid, fish.id);
      const records = (life.records ??= {}),
        record = !records[fish.id] || p!.cm > records[fish.id].cm;
      const best = (x.best ??= {}),
        personal = !best[fish.id] || p!.cm > best[fish.id];
      if (personal) best[fish.id] = p!.cm;
      if (record) {
        records[fish.id] = { actor, cm: p!.cm, at: now };
        bump(life, uid, 'record', 1);
        addNews(
          life,
          now,
          `rec:${fish.id}`,
          'record',
          `${josaGa(nameOf(actor))} ${fish.name} ${p!.cm}cm로 마을 기록을 세웠어요`,
          [actor],
        );
      }
      if (fish.weight <= 1) {
        const text = `${josaGa(nameOf(actor))} 전설의 ${fish.name}을(를) 낚았어요!`;
        addMemory(life, now, 'legend', [actor], text);
        addNews(life, now, `legend:${fish.id}:${actor}`, 'legend', text, [actor]);
      }
      x.last = { ok: true, fish: fish.id, cm: p!.cm, ...(record ? { record: true } : {}), ...(personal ? { best: true } : {}), at: now };
      break;
    }
    case 'forage': {
      const spot = typeof a.spot === 'string' ? SPOT_BY_ID[a.spot] : undefined;
      if (!spot || !own(SPOT_BY_ID, a.spot)) fail(PLUS_REJECT.spot);
      if (!spotOpen(life, spot!.flag)) fail(PLUS_REJECT.spotLocked);
      const key = `f:${spot!.id}`;
      if (x.taken?.includes(key)) fail(PLUS_REJECT.foraged);
      const item = forageAt(spot!.id, kstDay(now));
      if (!item) fail(PLUS_REJECT.nothingHere);
      // 성장: 약초꾼 / 채집 Lv6 may give one more; 꽃집 always doubles flowers.
      const mods = growthMods(life, uid),
        flower = ITEM_BY_ID[item!]?.kind === 'flower',
        n =
          (1 + (buffOf(life, uid, now)?.kind === 'forage' ? 1 : 0)) *
            (flower && mods.flowerDouble ? 2 : 1) +
          (growthChance(life, uid, 'forage', mods.forageDouble, now) ? 1 : 0);
      (x.taken ??= []).push(key);
      addInv(life, uid, item!, n);
      bump(life, uid, 'forage', 1);
      gainXp(life, uid, 'forage', XP.forage, now);
      discover(life, uid, item!);
      if (item === 'ginseng') {
        const text = `${josaGa(nameOf(actor))} 산삼을 찾았어요. 심봤다!`;
        addMemory(life, now, 'legend', [actor], text);
        addNews(life, now, `legend:ginseng:${actor}`, 'legend', text, [actor]);
      }
      break;
    }
    case 'catch': {
      const spot = typeof a.spot === 'string' ? SPOT_BY_ID[a.spot] : undefined;
      if (!spot || !own(SPOT_BY_ID, a.spot)) fail(PLUS_REJECT.spot);
      if (!spotOpen(life, spot!.flag)) fail(PLUS_REJECT.spotLocked);
      const slot = slotOf(now),
        key = `b:${spot!.id}:${slot}`;
      if (x.taken?.includes(key)) fail(PLUS_REJECT.caught);
      const bug = bugAt(spot!.id, kstDay(now), slot);
      if (!bug) fail(PLUS_REJECT.nothingHere);
      (x.taken ??= []).push(key);
      addInv(life, uid, bug!, 1 + (buffOf(life, uid, now)?.kind === 'bug' ? 1 : 0));
      bump(life, uid, 'bug', 1);
      gainXp(life, uid, 'forage', XP.bug, now);
      discover(life, uid, bug!);
      break;
    }
    case 'sellItem': {
      const def = isItemId(a.item) ? ITEM_BY_ID[a.item] : undefined;
      if (!def || def.sell <= 0) fail(PLUS_REJECT.noSell);
      if (!safe(a.n) || a.n < 1 || a.n > 999) fail(LIFE_REJECT.invalid);
      if (invCount(life, uid, def!.id) < a.n) fail(LIFE_REJECT.notEnough);
      // Demand curve per item (fish per species): see demandMult. 성장 bonus on top.
      const amount = Math.round(
          sellTotal(
            def!.id,
            sellUnit(def!.id, 0, now, life.flags ?? []),
            demandSold(life, uid, now, def!.id),
            a.n,
            soldBeomToday(life, uid, now),
          ) *
            (1 + sellBonus(growthMods(life, uid), def!.id)),
        ),
        left = sellCapLeft(life, uid, now);
      if (amount > left)
        fail(`오늘은 ${Math.max(0, left).toLocaleString('en-US')}범어치까지만 더 팔 수 있어요.`);
      addInv(life, uid, def!.id, -a.n);
      noteDemand(life, uid, now, def!.id, a.n);
      const day = kstDay(now),
        prev = life.sold[uid];
      life.sold[uid] = { day, amount: (prev?.day === day ? prev.amount : 0) + amount };
      bump(life, uid, 'earned', amount);
      next = grant(next, life, uid, amount, 'sell-' + def!.kind, now);
      break;
    }
    case 'donate': {
      // C-5 co-donation: the first donor keeps the honor (life.museum), and
      // every friend may still stamp each item once for their own collection.
      if (typeof a.item !== 'string' || !isMuseumId(a.item)) fail(PLUS_REJECT.noDonate);
      if (museumStamped(life, actor, a.item)) fail(PLUS_REJECT.donated);
      takeItem(life, uid, a.item, 1);
      const first = !life.museum?.[a.item],
        shown = Object.keys(life.museum ?? {}).length,
        mult = hasFlag(life, 'museum') ? 2 : 1;
      if (first) (life.museum ??= {})[a.item] = { actor, at: now };
      else addStamp(life, actor, a.item);
      bump(life, uid, 'donate', 1);
      discover(life, uid, a.item);
      next = grant(next, life, uid, (first ? FIRST_DONATION_GRANT : CO_DONATION_GRANT) * mult, 'donate', now);
      addNews(
        life,
        now,
        first ? `don:${a.item}` : `don:${a.item}:${actor}`,
        'museum',
        first
          ? `${josaGa(nameOf(actor))} 박물관에 ${itemName(a.item)}을(를) 처음 기증했어요`
          : `${josaGa(nameOf(actor))} 박물관 ${itemName(a.item)} 칸에 기증 도장을 찍었어요`,
        [actor],
      );
      next = settleMuseum(life, next, now, shown);
      break;
    }
    case 'cook':
    case 'craft': {
      const recipe =
        a.kind === 'cook'
          ? typeof a.recipe === 'string' && own(DISH_BY_ID, a.recipe)
            ? DISH_BY_ID[a.recipe]
            : undefined
          : typeof a.recipe === 'string' && own(CRAFT_BY_ID, a.recipe)
            ? CRAFT_BY_ID[a.recipe]
            : undefined;
      if (!recipe) fail(PLUS_REJECT.recipe);
      if (recipe!.flag && !hasFlag(life, recipe!.flag)) fail(PLUS_REJECT.recipeLocked);
      const n = nInRange(a.n, 10);
      // 성장: 솜씨 perks / 공예가 / 목수 save craft inputs; recipe-specific perks add output.
      const mods = growthMods(life, uid);
      const needOf = (need: Need & { n: number }) => {
        if (a.kind !== 'craft' || 'beom' in need) return need.n;
        let k = need.n;
        if (recipe!.id === 'fertilizer-deluxe' && 'item' in need && need.item === 'fertilizer' && mods.deluxeCheap) k -= 1;
        if (mods.craftDiscount > 0 && k >= 2) k -= Math.floor(k * mods.craftDiscount);
        return Math.max(1, k);
      };
      for (let i = 0; i < n; i++) for (const need of recipe!.needs) takeNeed(life, uid, need, needOf(need));
      let made = recipe!.count * n;
      if (a.kind === 'craft' && recipe!.makes === 'bait') made += mods.baitExtra * n;
      if (a.kind === 'craft' && recipe!.makes === 'fertilizer') made += mods.fertExtra * n;
      if (a.kind === 'cook') for (let i = 0; i < n; i++) if (growthChance(life, uid, 'cook' + i, mods.cookExtra, now)) made += 1;
      if (recipe!.makes.startsWith('furn-')) {
        const furn = (x.furn ??= {});
        furn[recipe!.makes] = Math.min(COUNT_MAX, (furn[recipe!.makes] ?? 0) + made);
        bump(life, uid, 'furniture', made);
      } else addInv(life, uid, recipe!.makes, made);
      if (a.kind === 'cook') {
        bump(life, uid, 'cook', n);
        discover(life, uid, recipe!.makes);
        gainXp(life, uid, 'craft', XP.cook * n, now);
      } else {
        bump(life, uid, 'craft', n);
        gainXp(life, uid, 'craft', XP.craft * n, now);
      }
      break;
    }
    case 'eat': {
      const dish = typeof a.item === 'string' && own(DISH_BY_ID, a.item) ? DISH_BY_ID[a.item] : undefined;
      if (!dish) fail(PLUS_REJECT.recipe);
      if (!dish!.buff) fail(PLUS_REJECT.noBuff);
      if (x.ate) fail(PLUS_REJECT.ate);
      if (invCount(life, uid, dish!.id) < 1) fail(LIFE_REJECT.notEnough);
      addInv(life, uid, dish!.id, -1);
      x.ate = dish!.id;
      // 성장: 미식가 keeps the buff until 06:00 KST the next day.
      x.buff = { kind: dish!.buff!, dish: dish!.id, until: nextKstMidnight(now) + (growthMods(life, uid).longBuff ? 6 * 3_600_000 : 0) };
      break;
    }
    case 'contribute': {
      const def = typeof a.bundle === 'string' && own(BUNDLE_BY_ID, a.bundle) ? BUNDLE_BY_ID[a.bundle] : undefined;
      if (!def) fail(PLUS_REJECT.bundle);
      const bundles = (life.bundles ??= {}),
        state = (bundles[def!.id] ??= { got: def!.slots.map(() => 0), by: {} });
      if (state.doneAt) fail(PLUS_REJECT.bundleDone);
      if (!safe(a.slot) || a.slot < 0 || a.slot >= def!.slots.length) fail(PLUS_REJECT.bundle);
      if (!safe(a.n) || a.n < 1) fail(LIFE_REJECT.invalid);
      const slot = def!.slots[a.slot],
        amount = Math.min(a.n, slot.n - state.got[a.slot]);
      if (amount <= 0) fail(PLUS_REJECT.slotFull);
      if ('beom' in slot) next = spend(next, life, uid, amount, 'bundle', now);
      else takeNeed(life, uid, slot, amount);
      state.got[a.slot] += amount;
      state.by[String(actor)] = (state.by[String(actor)] ?? 0) + 1;
      bump(life, uid, 'bundle', 1);
      addNews(
        life,
        now,
        `bun:${def!.id}:${actor}`,
        'bundle',
        `${josaGa(nameOf(actor))} ${def!.name}에 힘을 보탰어요`,
        [actor],
      );
      if (state.got.every((got, i) => got >= def!.slots[i].n)) {
        state.doneAt = now;
        if (!hasFlag(life, def!.flag)) (life.flags ??= []).push(def!.flag);
        const helpers = Object.keys(state.by).map(Number).filter(actorValid).sort((p, q) => p - q);
        for (const helper of helpers) {
          const helperUid = uidOf(life, helper);
          if (!helperUid) continue;
          next = grant(next, life, helperUid, BUNDLE_REWARD_BEOM, 'bundle-done', now);
          const furn = (extOf(life, helperUid).furn ??= {});
          if (!furn['furn-village-medal']) furn['furn-village-medal'] = 1;
        }
        const text = `${def!.name} 완성! ${def!.reward}`;
        addMemory(life, now, 'bundle', helpers, text);
        addNews(life, now, `bundone:${def!.id}`, 'bundle', text, helpers);
      }
      break;
    }
    case 'deliver': {
      const req = requestsFor(life, actor, kstDay(now)).find((r) => r.from === a.to);
      if (!req) fail(PLUS_REJECT.request);
      if (x.req?.includes(req!.from)) fail(PLUS_REJECT.requestDone);
      if (itemCount(life, uid, req!.item) < req!.n) fail(LIFE_REJECT.notEnough);
      takeItem(life, uid, req!.item, req!.n);
      (x.req ??= []).push(req!.from);
      next = grant(next, life, uid, req!.reward, 'request', now);
      bump(life, uid, 'request', 1);
      addBond(life, actor, req!.from, BOND_POINTS.request, now);
      addNews(
        life,
        now,
        `req:${actor}>${req!.from}`,
        'request',
        `${josaGa(nameOf(actor))} ${nameOf(req!.from)}의 부탁(${itemName(req!.item)})을 들어줬어요`,
        [actor, req!.from],
      );
      break;
    }
    case 'claimEvent': {
      const event = claimableEvents(now, actor).find((e) => e.id === a.event);
      if (!event) fail(PLUS_REJECT.event);
      if (x.claimed?.includes(event!.id)) fail(PLUS_REJECT.claimed);
      x.claimed = [...(x.claimed ?? []), event!.id].slice(-CLAIMED_MAX);
      next = grant(next, life, uid, event!.claim!, 'event', now);
      bump(life, uid, 'event', 1);
      if (event!.kind === 'birthday')
        addMemory(life, now, 'birthday', [actor], `${nameOf(actor)}의 생일을 마을이 함께 축하했어요`);
      break;
    }
    case 'wish': {
      if (!hasFlag(life, 'fountain')) fail(PLUS_REJECT.wish);
      if (x.wished) fail(PLUS_REJECT.wished);
      x.wished = true;
      const amount = round10(WISH_MIN + (hash32(`wish:${uid}:${kstDay(now)}`) % (WISH_MAX - WISH_MIN + 1)));
      next = grant(next, life, uid, amount, 'wish', now);
      break;
    }
    default:
      fail(LIFE_REJECT.invalid);
  }
  return { life, ledger: next };
}

/** The souvenir furniture of a festival week (rotates through FESTIVAL_SOUVENIRS). */
export const festivalSouvenir = (week: number) => FESTIVAL_SOUVENIRS[((week % 4) + 4) % 4];

/** Friendship and news for a gift sent by mail (called by lounge-life's mail). */
export function onGift(life: LifeState, member: { id: string; actor: number }, to: string, gift: Gift, now: number) {
  const toActor = life.actors[to];
  if (!actorValid(toActor)) return;
  const cat: ItemCategory | null =
    gift.kind === 'produce'
      ? 'crop'
      : gift.kind === 'fruit'
        ? 'fruit'
        : ITEM_BY_ID[gift.item]?.cat === 'tool'
          ? null
          : (ITEM_BY_ID[gift.item]?.cat as ItemCategory);
  const profile = FRIEND_PROFILES[toActor];
  const taste = cat && profile?.likes.includes(cat) ? 2 : cat && profile?.dislikes.includes(cat) ? 0.2 : 1;
  const birthday = birthdayActors(kstDay(now)).includes(toActor) ? BIRTHDAY_GIFT_BONUS : 1;
  bump(life, member.id, 'gift', 1);
  if (bondGate(life, `g:${member.actor}>${toActor}`, now))
    addBond(life, member.actor, toActor, BOND_POINTS.gift * taste * birthday, now);
  addNews(
    life,
    now,
    `gift:${member.actor}>${toActor}`,
    'gift',
    `${josaGa(nameOf(member.actor))} ${nameOf(toActor)}에게 선물을 보냈어요`,
    [member.actor, toActor],
  );
  if (birthday > 1)
    addMemory(life, now, 'birthday', [member.actor, toActor], `${nameOf(member.actor)}의 생일 선물이 ${nameOf(toActor)}에게 도착했어요`);
}

// ---------------------------------------------------------------- cloud hooks
/** A friend walked into `owner`'s room (lounge-cloud-engine calls this). */
export function recordVisit(life: LifeState, visitor: { id: string; actor: number }, owner: number, now: number): LifeState {
  if (!actorValid(owner) || owner === visitor.actor) return life;
  const next = cloneLife(life);
  if (!bondGate(next, `v:${visitor.actor}>${owner}`, now)) return life;
  bump(next, visitor.id, 'visit', 1);
  addBond(next, visitor.actor, owner, BOND_POINTS.visit, now);
  addNews(
    next,
    now,
    `visit:${visitor.actor}>${owner}`,
    'visit',
    `${josaGa(nameOf(visitor.actor))} ${nameOf(owner)}의 방에 놀러 갔어요`,
    [visitor.actor, owner],
  );
  return next;
}
/**
 * Table games that just settled (lounge-cloud-engine passes their wallets):
 * friendship between the players, the `tables` stat, the Friday casino-night
 * bonus (once per player per day) and a digest line.
 */
export function recordTables(
  life: LifeState,
  ledger: LoungeLedger,
  games: { id: string; wallets: string[] }[],
  now: number,
) {
  if (!games.length) return { life, ledger };
  const next = cloneLife(life);
  let nextLedger = ledger;
  const casino = weeklyActive('casino', now),
    touched = new Set<string>();
  for (const game of games) {
    const players = game.wallets
      .map((w) => w.replace(/^wallet-/, ''))
      .filter((uid) => own(next.actors, uid))
      .map((uid) => ({ uid, actor: next.actors[uid] }));
    for (const p of players) {
      touched.add(p.uid);
      bump(next, p.uid, 'tables', 1);
      if (casino) {
        const x = todayExt(next, p.uid, now),
          id = `casino-${kstDay(now)}`;
        if (!x.claimed?.includes(id)) {
          x.claimed = [...(x.claimed ?? []), id].slice(-CLAIMED_MAX);
          nextLedger = grant(nextLedger, next, p.uid, CASINO_NIGHT_BONUS * (hasFlag(next, 'stage') ? 2 : 1), 'casino-night', now);
        }
      }
    }
    for (let i = 0; i < players.length; i++)
      for (let j = i + 1; j < players.length; j++) {
        const a = players[i].actor,
          b = players[j].actor;
        if (bondGate(next, `t:${pairKey(a, b)}`, now)) addBond(next, a, b, BOND_POINTS.table * (casino ? 2 : 1), now);
      }
    const actors = players.map((p) => p.actor).sort((p, q) => p - q);
    if (actors.length > 1)
      addNews(
        next,
        now,
        `table:${actors.join('')}`,
        'table',
        `${actors.map(nameOf).join(', ')}이(가) 테이블에서 한 판 했어요`,
        actors,
      );
  }
  for (const uid of touched) nextLedger = settleAchievements(next, nextLedger, uid, now);
  return { life: next, ledger: nextLedger };
}

// ---------------------------------------------------------------- views
export type PlusMe = {
  plots: FarmSize;
  inv: Record<string, number>;
  quality: { silver: Partial<Record<Crop, number>>; gold: Partial<Record<Crop, number>> };
  furniture: Record<string, number>;
  dex: string[];
  stats: Partial<Record<StatKey, number>>;
  /** Static names/texts/goals/rewards: lounge-items ACHIEVEMENTS (same order). */
  achievements: { id: string; progress: number; done: boolean }[];
  fishing: {
    rod: 1 | 2 | 3;
    bait: number;
    pending: Omit<FishPending, 'fish' | 'cm'> | null;
    last: FishLast | null;
    /** Personal best cm per fish id. */
    best: Record<string, number>;
  };
  spawns: { spot: string; district: string; kind: 'forage' | 'bug'; item: string; taken: boolean }[];
  requests: RequestView[];
  bonds: { actor: number; points: number; level: number; next: number | null }[];
  buff: null | { kind: DishBuff; name: string; text: string; dish: string; until: number };
  ate: string | null;
  wished: boolean;
  claimed: string[];
  waterFriend: number[];
  /** Units sold today per crop/fruit/item id (demand curves). */
  demand: Record<string, number>;
  /** House tier (0 = the starting house). */
  house: number;
};
export type PlusView = {
  calendar: CalendarView;
  weather: { today: Weather; tomorrow: Weather };
  shop: ShopView;
  museum: Record<string, { actor: number; at: number }>;
  /** Static names/slots/flags: lounge-items BUNDLES (same order); got[i] per slot. */
  bundles: { id: string; done: boolean; doneAt?: number; got: number[]; contributors: Record<string, number> }[];
  flags: string[];
  memories: Memory[];
  digest: { day: number; date: string; lines: { kind: string; text: string; actors: number[] }[] };
  records: Record<string, { actor: number; cm: number; at: number }>;
  /** Friendship between every pair of the seven ('a-b', a < b). */
  bondsAll: Record<string, number>;
  /** 마을 공사 2차 (static defs: lounge-items PROJECTS, same order). */
  projects: { id: string; got: number; done: boolean; doneAt?: number; open: boolean; by: Record<string, number> }[];
  /** This week's festival fund. */
  festival: { week: number; got: number; goal: number; done: boolean; by: Record<string, number>; souvenir: string; resetAt: number };
  /** House tier per actor (houses in the village). */
  houses: Record<number, number>;
};
export function plusView(life: LifeState, uid: string, actor: number, now: number): PlusView & { me: PlusMe } {
  const day = kstDay(now),
    raw = life.ext?.[uid] ?? {},
    fresh = raw.day === day,
    buff = buffOf(life, uid, now),
    slot = slotOf(now);
  const spawns: PlusMe['spawns'] = [];
  for (const spot of SPAWN_SPOTS) {
    if (!spotOpen(life, spot.flag)) continue;
    const f = forageAt(spot.id, day);
    if (f)
      spawns.push({
        spot: spot.id,
        district: spot.district,
        kind: 'forage',
        item: f,
        taken: fresh && !!raw.taken?.includes(`f:${spot.id}`),
      });
    const b = bugAt(spot.id, day, slot);
    if (b)
      spawns.push({
        spot: spot.id,
        district: spot.district,
        kind: 'bug',
        item: b,
        taken: fresh && !!raw.taken?.includes(`b:${spot.id}:${slot}`),
      });
  }
  const pending = raw.pending && now <= raw.pending.expiresAt ? raw.pending : null;
  const yesterday = life.news?.find((d) => d.day === day - 1);
  const me: PlusMe = {
    plots: raw.plots ?? 6,
    inv: { ...raw.inv },
    quality: { silver: { ...raw.q1 }, gold: { ...raw.q2 } },
    furniture: { ...raw.furn },
    dex: [...(raw.dex ?? [])],
    stats: { ...raw.stats, ...(raw.dex?.length ? { dex: raw.dex.length } : {}) },
    achievements: ACHIEVEMENTS.map((a) => ({
      id: a.id,
      progress: Math.min(a.goal, achProgress(raw, a.stat)),
      done: !!raw.ach?.includes(a.id),
    })),
    fishing: {
      rod: raw.rod ?? 1,
      bait: raw.inv?.bait ?? 0,
      pending: pending
        ? {
            token: pending.token,
            spot: pending.spot,
            castAt: pending.castAt,
            biteAt: pending.biteAt,
            windowMs: pending.windowMs,
            expiresAt: pending.expiresAt,
          }
        : null,
      last: raw.last ? { ...raw.last } : null,
      best: { ...(raw.best ?? {}) },
    },
    spawns,
    requests: actorValid(actor)
      ? requestsFor(life, actor, day).map((r) => ({ ...r, done: fresh && !!raw.req?.includes(r.from) }))
      : [],
    bonds: [0, 1, 2, 3, 4, 5, 6]
      .filter((f) => f !== actor)
      .map((f) => {
        const points = bondPoints(life, actor, f, now),
          level = bondLevel(points);
        return { actor: f, points, level, next: BOND_LEVELS[level] ?? null };
      }),
    buff: buff ? { kind: buff.kind, name: BUFF_INFO[buff.kind].name, text: BUFF_INFO[buff.kind].text, dish: buff.dish, until: buff.until } : null,
    ate: fresh ? (raw.ate ?? null) : null,
    wished: fresh && !!raw.wished,
    claimed: [...(raw.claimed ?? [])],
    waterFriend: fresh ? [...(raw.wf ?? [])] : [],
    demand: fresh ? { ...raw.dem } : {},
    house: raw.house ?? 0,
  };
  const week = weekOfDay(day),
    fest = life.festival?.week === week ? life.festival : null;
  const calendar = calendarOf(now);
  return {
    me,
    calendar,
    weather: { today: weatherOf(day), tomorrow: weatherOf(day + 1) },
    shop: shopStock(life, now, uid),
    museum: Object.fromEntries(Object.entries(life.museum ?? {}).map(([k, m]) => [k, { ...m }])),
    bundles: BUNDLES.map((b) => {
      const s = life.bundles?.[b.id];
      return {
        id: b.id,
        done: !!s?.doneAt,
        ...(s?.doneAt ? { doneAt: s.doneAt } : {}),
        got: b.slots.map((_, i) => s?.got[i] ?? 0),
        contributors: { ...s?.by },
      };
    }),
    flags: [...(life.flags ?? [])],
    memories: (life.memories ?? []).map((m) => ({ ...m, actors: [...m.actors] })),
    digest: {
      day: day - 1,
      date: calendarOf(now - 86_400_000).date,
      lines: (yesterday?.lines ?? []).slice(-DIGEST_LINES).map((l) => ({ kind: l.kind, text: l.text, actors: [...l.actors] })),
    },
    records: Object.fromEntries(Object.entries(life.records ?? {}).map(([k, r]) => [k, { ...r }])),
    bondsAll: { ...life.bonds },
    projects: PROJECTS.map((p) => {
      const st = life.projects?.[p.id];
      return {
        id: p.id,
        got: st?.got ?? 0,
        done: !!st?.doneAt,
        ...(st?.doneAt ? { doneAt: st.doneAt } : {}),
        open: !p.requires || hasFlag(life, p.requires),
        by: { ...st?.by },
      };
    }),
    festival: {
      week,
      got: fest?.got ?? 0,
      goal: FESTIVAL_GOAL,
      done: !!fest?.doneAt,
      by: { ...fest?.by },
      souvenir: festivalSouvenir(week),
      resetAt: weekResetAt(week),
    },
    houses: Object.fromEntries(
      Object.entries(life.ext ?? {})
        .filter(([id, x]) => x.house && id in life.actors)
        .map(([id, x]) => [life.actors[id], x.house!]),
    ),
  };
}
/** Owned premium furniture copies per ref (room-save validator input). */
export const furnitureOf = (life: LifeState, uid: string): Record<string, number> => ({
  ...life.ext?.[uid]?.furn,
});
/** Room-style unlock ids ('house-1'…) from the friend's house tier. */
export const houseUnlocksOf = (life: LifeState, uid: string): string[] =>
  Array.from({ length: life.ext?.[uid]?.house ?? 0 }, (_, i) => `house-${i + 1}`);
