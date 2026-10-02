// 마을 확장 2단계: the district events and the six 시장 거리 shops that move
// money or items (handover/design/design-npcs-stage2.md §4, design-village-
// 2x-npcs.md §9 "남은 일"). Server-authoritative; lounge-life.ts dispatches
// TOWN_ACTION_KINDS here and the cloud engine checks the player stands in the
// right district (lounge-cloud-engine.ts). Money only through the ledger
// helpers (grantBeom / spendBeom); every grant here is capped per friend per
// KST day and listed below.
//
//   새벽 경매 (항구, 06:00–07:00 KST): fish sold through the normal sell
//     path (demand curve, 100,000범 daily sell cap, quality) plus a 30%
//     premium, at most AUCTION_UNITS_MAX fish and AUCTION_PREMIUM_CAP 범 of
//     premium a day. The premium is a grant, reason 'auction'.
//   농협 주간 시세 (시장): three crops a week (나세라's notice) sell through the
//     normal crop sale plus 15%, at most COOP_BONUS_CAP 범 a day, reason
//     'coop-week'.
//   빵집 카페 (시장) and 허풍 주점 (음식 시스템, 2026-10): food bought and eaten
//     on the spot ('shopFood'; 'bakeryBuy' is the older name); a spend (sink)
//     that fills mood needs through lounge-mood.ts moodTreat and the 간식 칸
//     buff (lounge-food-data.ts), SHOP_FOOD_PER_DAY a day at each shop.
//   행상인 계약 (시장 on Sundays, 항구 on Wednesdays and Saturdays): once a
//     week, the week's goods for the week's spice. No 범.
//   장날 좌판 (시장, Sundays): one item of the day per stall at 80% of the
//     general-store price, three purchases a day; a spend.
//   독서 모임 (언덕 도서관, Wednesdays 19:00–21:00 KST): once a week, skill XP
//     through lounge-growth.ts gainXp (its daily soft cap applies). No 범.
//   공연 밤 (허풍 주점, Tuesdays and Fridays 20:00–22:00 KST): a schedule
//     slot only (the stage waits for its performer); nothing moves.
//
// Per-friend state: life.ext[uid].town (absent in older worlds).
import { grantBeom, kstDay, spendBeom, type LoungeLedger } from './lounge-economy.ts';
import { hash32, inGameHours, nextGameTime, seasonOf, seasonOfDay, weekdayOf } from './lounge-calendar.ts';
import { ITEM_BY_ID, ITEM_PRICES, isItemId } from './lounge-items.ts';
import { SHOP_FOODS, SHOP_FOOD_BY_ID, SHOP_FOOD_PER_DAY, type ShopFoodDef } from './lounge-food-data.ts';
import { tasteNote } from './lounge-food.ts';
import { peddlerDeal, peddlerOpenOn, peddlerStock, weekOf } from './lounge-shops.ts';
import { CROPS, CROP_INFO, LifeError, cropInSeason, type Crop, type LifeState } from './lounge-life.ts';
import { addInv, hasFlag, invCount, soldBeomToday, weekOfDay } from './lounge-life-plus.ts';
import { gainXp } from './lounge-growth.ts';
import { SKILLS } from './lounge-growth-data.ts';
import { moodTreat } from './lounge-mood.ts';
import { STALL_IDS, TOWN_ACTION_AREA, TOWN_ACTION_KINDS, isTownAction, type StallId, type TownAction, type TownActionKind } from './lounge-town-data.ts';
import { DISTRICT_FLAG, DISTRICT_IDS, type DistrictId } from './lounge-districts.ts';
import { hasExplorerPass } from './lounge-explorer-pass.ts';

// ---------------------------------------------------------------- numbers
/** 새벽 경매: game hours [from, to) every game day (game clock: design-game-clock.md §5). */
export const AUCTION_HOURS = [5, 8] as const;
export const AUCTION_PREMIUM = 0.3;
/** Premium 범 a friend can get from the dawn auction in one KST day. */
export const AUCTION_PREMIUM_CAP = 3_000;
/** Fish a friend can put up at one dawn auction. */
export const AUCTION_UNITS_MAX = 10;
/** 농협 주간 시세: bonus share for this week's three crops, and its daily cap. */
export const COOP_WEEK_BONUS = 0.15;
export const COOP_BONUS_CAP = 3_000;
export const COOP_WEEK_CROPS = 3;
/** 빵집 카페 / 허풍 주점: treats a friend can have a day at each. */
export const BAKERY_PER_DAY = SHOP_FOOD_PER_DAY;
/** 장날 좌판: price share of the general-store price and purchases a day. */
export const STALL_DISCOUNT = 0.8;
export const STALL_PER_DAY = 3;
/** 독서 모임: real weekday (0 = Sunday), game hours [from, to), XP for the chosen skill. */
export const READING_WEEKDAY = 3;
export const READING_HOURS = [18, 22] as const;
export const READING_XP = 30;
/** 공연 밤: real weekdays and game hours [from, to) (the tavern's stage slot). */
export const SHOW_WEEKDAYS = [2, 5] as const;
export const SHOW_HOURS = [19, 23] as const;

export type BakeryItem = ShopFoodDef;
/** Prices are sinks; fills are need points (0–100 scale). The menus live in lounge-food-data.ts. */
export const BAKERY_MENU: readonly BakeryItem[] = SHOP_FOODS.filter((f) => f.shop === 'bakery');
export const TAVERN_MENU: readonly BakeryItem[] = SHOP_FOODS.filter((f) => f.shop === 'tavern');
export const BAKERY_BY_ID: Readonly<Record<string, BakeryItem>> = Object.fromEntries(BAKERY_MENU.map((b) => [b.id, b]));
/** What the market-day stalls can carry (general-store consumables). */
const STALL_POOL = ['fertilizer', 'fertilizer-deluxe', 'bait', 'bait-dough', 'bait-shrimp', 'speed-gro', 'retaining'] as const;

export { TOWN_ACTION_KINDS, TOWN_ACTION_AREA, isTownAction, STALL_IDS };
export type { TownAction, TownActionKind, StallId };

export const TOWN_REJECT = {
  harborShut: '항구 구역이 아직 열리지 않았어요.',
  hillShut: '언덕 주택가가 아직 열리지 않았어요.',
  auctionClosed: '새벽 경매는 게임 시각 새벽 5시부터 8시까지만 열려요.',
  auctionFish: '경매에는 물고기만 올릴 수 있어요.',
  auctionUnits: `경매에는 하루 ${AUCTION_UNITS_MAX}마리까지 올릴 수 있어요.`,
  coopCrop: '이번 주 시세표에 있는 작물만 웃돈을 받아요. 다른 작물은 텃밭 장부에서 팔아 주세요.',
  bakeryItem: '메뉴를 다시 골라 주세요.',
  bakeryMax: `빵집 카페는 하루 ${BAKERY_PER_DAY}번까지 들를 수 있어요. 내일 또 와요.`,
  tavernMax: `주점 음식은 하루 ${SHOP_FOOD_PER_DAY}번까지예요. 내일 또 와요.`,
  peddlerAway: '행상인 마키마는 수요일·토요일(항구)과 일요일(시장 거리)에만 와요.',
  peddlerDone: '이번 주 계약은 이미 맺었어요. 다음 주에 새 계약을 가져와요.',
  peddlerGoods: '계약에 필요한 물건이 모자라요.',
  stallClosed: '장날(일요일)에만 좌판이 열려요.',
  harborStallClosed: '마키마의 항구 좌판은 수요일과 토요일에만 열려요.',
  stallMax: `장날 좌판은 하루 ${STALL_PER_DAY}번까지 살 수 있어요.`,
  stallBought: '이 좌판 물건은 오늘 이미 샀어요.',
  clubClosed: '독서 모임은 수요일, 게임 시각 저녁 6시부터 10시까지 도서관에서 열려요.',
  clubDone: '이번 주 독서 모임에는 이미 참석했어요.',
  clubSkill: '읽을 책을 다시 골라 주세요.',
  balance: '범이 부족해요.',
} as const;
const fail = (text: string): never => {
  throw new LifeError(text);
};

// ---------------------------------------------------------------- state
export type TownUser = {
  /** KST day of the daily fields. */
  day?: number;
  /** Dawn auction premium 범 and fish today. */
  auc?: number;
  aucN?: number;
  /** 농협 weekly bonus 범 today. */
  coop?: number;
  /** Bakery treats today. */
  bake?: number;
  /** 허풍 주점 food today. */
  tav?: number;
  /** Market-day stalls bought from today. */
  stall?: StallId[];
  /** Week of the last reading club. */
  club?: number;
  /** Districts I have walked into (the 친구에게 가기 signpost). */
  seen?: DistrictId[];
};
const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
/** Normalizes life.ext[uid].town; unknown fields drop, an empty record is undefined. */
export function readTownUser(v: unknown): TownUser | undefined {
  const x = obj(v),
    out: TownUser = {};
  if (safe(x.day) && x.day > 0) {
    out.day = x.day;
    if (safe(x.auc) && x.auc > 0) out.auc = Math.min(AUCTION_PREMIUM_CAP, x.auc);
    if (safe(x.aucN) && x.aucN > 0) out.aucN = Math.min(AUCTION_UNITS_MAX, x.aucN);
    if (safe(x.coop) && x.coop > 0) out.coop = Math.min(COOP_BONUS_CAP, x.coop);
    if (safe(x.bake) && x.bake > 0) out.bake = Math.min(BAKERY_PER_DAY, x.bake);
    if (safe(x.tav) && x.tav > 0) out.tav = Math.min(SHOP_FOOD_PER_DAY, x.tav);
    const stall = Array.isArray(x.stall) ? [...new Set(x.stall.filter((s): s is StallId => (STALL_IDS as readonly unknown[]).includes(s)))] : [];
    if (stall.length) out.stall = stall;
  }
  if (safe(x.club) && x.club > 0) out.club = x.club;
  const seen = Array.isArray(x.seen) ? [...new Set(x.seen.filter((s): s is DistrictId => (DISTRICT_IDS as readonly unknown[]).includes(s)))] : [];
  if (seen.length) out.seen = seen;
  return Object.keys(out).length ? out : undefined;
}
type Ext = { town?: TownUser };
function townOf(life: LifeState, uid: string, now: number): TownUser {
  const x = ((life.ext ??= {})[uid] ??= {}) as Ext;
  const t = (x.town ??= {});
  const day = kstDay(now);
  if (t.day !== day) {
    t.day = day;
    delete t.auc;
    delete t.aucN;
    delete t.coop;
    delete t.bake;
    delete t.tav;
    delete t.stall;
  }
  return t;
}
const townRead = (life: LifeState, uid: string, now: number): TownUser => {
  const t = ((life.ext?.[uid] ?? {}) as Ext).town ?? {};
  return t.day === kstDay(now) ? t : { club: t.club, seen: t.seen };
};

/** A district walked into for the first time (signpost list). Returns true when it changed life. */
export function recordDistrictVisit(life: LifeState, uid: string, district: DistrictId): boolean {
  const x = ((life.ext ??= {})[uid] ??= {}) as Ext;
  if (x.town?.seen?.includes(district)) return false;
  const t = (x.town ??= {});
  t.seen = [...(t.seen ?? []), district];
  return true;
}

// ---------------------------------------------------------------- clocks
export const auctionOpen = (now: number) => inGameHours(now, AUCTION_HOURS[0], AUCTION_HOURS[1]);
export const marketDayOn = (day: number) => weekdayOf(day) === 0;
/** 마키마 sets up at the harbor on Wednesdays and Saturdays. */
export const HARBOR_STALL_DAYS = [3, 6] as const;
export const harborStallOn = (day: number) => (HARBOR_STALL_DAYS as readonly number[]).includes(weekdayOf(day));
/** Whether a stall is open on `day`. */
export const stallOpenOn = (stall: StallId, day: number) => (stall === 'stall-harbor' ? harborStallOn(day) : marketDayOn(day));
export const readingOpen = (now: number) =>
  weekdayOf(kstDay(now)) === READING_WEEKDAY && inGameHours(now, READING_HOURS[0], READING_HOURS[1]);
export const showNight = (now: number) =>
  (SHOW_WEEKDAYS as readonly number[]).includes(weekdayOf(kstDay(now))) && inGameHours(now, SHOW_HOURS[0], SHOW_HOURS[1]);
/** Next start of a slot (real weekdays, game hour) at or after `now` (ms). */
export const nextSlot = (now: number, weekdays: readonly number[], hour: number): number =>
  nextGameTime(now, hour, 0, (day) => weekdays.includes(weekdayOf(day)));

/** 나세라's weekly price notice: three crops in season this week (deterministic). */
export function coopWeekCrops(week: number): Crop[] {
  const season = seasonOfDay(week * 7 - 3);
  const pool = CROPS.filter((c) => cropInSeason(c, season));
  const list = pool.length >= COOP_WEEK_CROPS ? pool : CROPS;
  return [...list].sort((a, b) => hash32(`coop-week:${week}:${a}`) - hash32(`coop-week:${week}:${b}`)).slice(0, COOP_WEEK_CROPS);
}
/** Today's market-day goods: one item per stall. */
export function stallGoods(day: number): Record<StallId, { item: string; price: number }> {
  const out = {} as Record<StallId, { item: string; price: number }>;
  const pool = STALL_POOL.filter((id) => ITEM_PRICES[id]);
  STALL_IDS.forEach((s, i) => {
    const item = pool[(hash32(`stall:${day}:${s}`) + i) % pool.length];
    out[s] = { item, price: Math.max(10, Math.round((ITEM_PRICES[item] * STALL_DISCOUNT) / 10) * 10) };
  });
  return out;
}

// ---------------------------------------------------------------- actions
const walletOf = (uid: string) => 'wallet-' + uid;
/** Runs the normal sale (lounge-life core 'sell' / 'sellItem') on a life and returns the result. */
export type SellRunner = (
  life: LifeState,
  ledger: LoungeLedger,
  action: { kind: 'sellItem'; item: string; n: number; at?: 'fishmarket' } | { kind: 'sell'; crop: Crop; n: number; quality?: 0 | 1 | 2 | 3; at?: 'coop' },
) => { life: LifeState; ledger: LoungeLedger };

/**
 * One town action on an already-cloned, settled life (lounge-life.ts
 * lifeAction). `sell` runs the ordinary sale so every existing rule (demand,
 * daily cap for crops, quality, 성장 bonus) applies; the town only adds its capped extra.
 */
export function townAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: TownAction,
  now: number,
  sell: SellRunner,
): { life: LifeState; ledger: LoungeLedger } {
  const uid = member.id,
    wallet = walletOf(uid);
  // A district counts as open for this friend once the village opened it, or with 승준's explorer pass.
  const opened = (flag: string) => hasFlag(life, flag) || hasExplorerPass(member.actor, now);
  switch (a.kind) {
    case 'auctionSell': {
      if (!opened(DISTRICT_FLAG.harbor!)) fail(TOWN_REJECT.harborShut);
      if (!auctionOpen(now)) fail(TOWN_REJECT.auctionClosed);
      if (!isItemId(a.item) || ITEM_BY_ID[a.item].kind !== 'fish') fail(TOWN_REJECT.auctionFish);
      const n = a.n;
      if (!safe(n) || n < 1) fail(TOWN_REJECT.auctionUnits);
      if ((townRead(life, uid, now).aucN ?? 0) + n > AUCTION_UNITS_MAX) fail(TOWN_REJECT.auctionUnits);
      // Fish sales stay out of life.sold (no daily cap), so the sale is read off the wallet.
      const before = ledger.accounts[wallet] ?? 0;
      // The auction is at the 어시장, so the fish fetch their full price before the premium.
      const base = sell(life, ledger, { kind: 'sellItem', item: a.item, n, at: 'fishmarket' });
      const amount = (base.ledger.accounts[wallet] ?? 0) - before;
      const t = townOf(base.life, uid, now);
      t.aucN = (t.aucN ?? 0) + n;
      const premium = Math.min(Math.round(amount * AUCTION_PREMIUM), AUCTION_PREMIUM_CAP - (t.auc ?? 0));
      let next = base.ledger;
      if (premium > 0 && Object.prototype.hasOwnProperty.call(next.accounts, wallet)) {
        t.auc = (t.auc ?? 0) + premium;
        next = grantBeom(next, wallet, premium, `life-auction-${uid}-${++base.life.seq}`, now, 'auction');
      }
      return { life: base.life, ledger: next };
    }
    case 'coopSell': {
      const week = weekOfDay(kstDay(now));
      if (!(CROPS as readonly unknown[]).includes(a.crop) || !coopWeekCrops(week).includes(a.crop)) fail(TOWN_REJECT.coopCrop);
      const before = soldBeomToday(life, uid, now);
      const base = sell(life, ledger, { kind: 'sell', crop: a.crop, n: a.n, at: 'coop', ...(a.quality !== undefined ? { quality: a.quality } : {}) });
      const amount = soldBeomToday(base.life, uid, now) - before;
      const t = townOf(base.life, uid, now);
      const bonus = Math.min(Math.round(amount * COOP_WEEK_BONUS), COOP_BONUS_CAP - (t.coop ?? 0));
      let next = base.ledger;
      if (bonus > 0 && Object.prototype.hasOwnProperty.call(next.accounts, wallet)) {
        t.coop = (t.coop ?? 0) + bonus;
        next = grantBeom(next, wallet, bonus, `life-coop-${uid}-${++base.life.seq}`, now, 'coop-week');
      }
      return { life: base.life, ledger: next };
    }
    case 'bakeryBuy':
    case 'shopFood': {
      const shop = a.kind === 'bakeryBuy' ? 'bakery' : a.shop;
      const item = typeof a.item === 'string' && Object.prototype.hasOwnProperty.call(SHOP_FOOD_BY_ID, a.item) ? SHOP_FOOD_BY_ID[a.item] : undefined;
      if (!item || item.shop !== shop) fail(TOWN_REJECT.bakeryItem);
      const t = townOf(life, uid, now),
        key = shop === 'tavern' ? 'tav' : 'bake';
      if ((t[key] ?? 0) >= SHOP_FOOD_PER_DAY) fail(shop === 'tavern' ? TOWN_REJECT.tavernMax : TOWN_REJECT.bakeryMax);
      if ((ledger.accounts[wallet] ?? 0) < item!.price) fail(TOWN_REJECT.balance);
      let next = spendBeom(ledger, wallet, item!.price, `life-${shop}-${uid}-${++life.seq}`, now, shop === 'tavern' ? 'tavern-food' : 'bakery');
      t[key] = (t[key] ?? 0) + 1;
      moodTreat(life, uid, now, { food: item!.food, rest: item!.rest, fun: item!.fun, let: item!.let });
      // 간식 칸: the menu's buff for an hour or two (replaces what was there).
      if (item!.buff && item!.hours) {
        const x = (life.ext ??= {})[uid] ?? {};
        (life.ext[uid] = x).snack = { kind: item!.buff, food: item!.id, until: now + item!.hours * 3_600_000, ...(item!.weak ? { weak: true as const } : {}) };
      }
      next = tasteNote(life, next, uid, item!.id, now);
      return { life, ledger: next };
    }
    case 'peddlerDeal': {
      const day = kstDay(now),
        week = weekOf(day);
      if (!peddlerOpenOn(day)) fail(TOWN_REJECT.peddlerAway);
      if (weekdayOf(day) !== 0 && !opened(DISTRICT_FLAG.harbor!)) fail(TOWN_REJECT.harborShut);
      const x = ((life.ext ??= {})[uid] ??= {});
      const ped = x.ped?.w === week ? x.ped : { w: week, got: [] as string[] };
      if (ped.deal) fail(TOWN_REJECT.peddlerDone);
      const deal = peddlerDeal(week);
      if (invCount(life, uid, deal.item) < deal.n) fail(TOWN_REJECT.peddlerGoods);
      addInv(life, uid, deal.item, -deal.n);
      addInv(life, uid, peddlerStock(week)[0].item, 1);
      x.ped = { ...ped, deal: true };
      return { life, ledger };
    }
    case 'stallBuy': {
      const day = kstDay(now);
      if (!(STALL_IDS as readonly unknown[]).includes(a.stall)) fail(TOWN_REJECT.stallClosed);
      if (!stallOpenOn(a.stall, day)) fail(a.stall === 'stall-harbor' ? TOWN_REJECT.harborStallClosed : TOWN_REJECT.stallClosed);
      if (a.stall === 'stall-harbor' && !opened(DISTRICT_FLAG.harbor!)) fail(TOWN_REJECT.harborShut);
      const t = townOf(life, uid, now);
      if ((t.stall ?? []).includes(a.stall)) fail(TOWN_REJECT.stallBought);
      if ((t.stall ?? []).length >= STALL_PER_DAY) fail(TOWN_REJECT.stallMax);
      const good = stallGoods(day)[a.stall];
      if ((ledger.accounts[wallet] ?? 0) < good.price) fail(TOWN_REJECT.balance);
      const next = spendBeom(ledger, wallet, good.price, `life-stall-${uid}-${++life.seq}`, now, 'stall');
      t.stall = [...(t.stall ?? []), a.stall];
      addInv(life, uid, good.item, 1);
      return { life, ledger: next };
    }
    case 'readingClub': {
      if (!(SKILLS as readonly unknown[]).includes(a.skill)) fail(TOWN_REJECT.clubSkill);
      if (!opened(DISTRICT_FLAG.hillside!)) fail(TOWN_REJECT.hillShut);
      if (!readingOpen(now)) fail(TOWN_REJECT.clubClosed);
      const week = weekOfDay(kstDay(now));
      const t = townOf(life, uid, now);
      if (t.club === week) fail(TOWN_REJECT.clubDone);
      t.club = week;
      gainXp(life, uid, a.skill, READING_XP, now);
      return { life, ledger };
    }
    default:
      return fail('요청을 처리할 수 없어요.');
  }
}

// ---------------------------------------------------------------- view
export type TownView = {
  auction: { open: boolean; premiumLeft: number; unitsLeft: number; next: number };
  coop: { week: number; crops: Crop[]; bonusLeft: number };
  bakery: { left: number };
  tavern: { left: number };
  stalls: { open: boolean; harbor: boolean; goods: Record<StallId, { item: string; price: number }>; bought: StallId[]; left: number };
  club: { open: boolean; done: boolean; next: number };
  show: { on: boolean; next: number };
  seen: DistrictId[];
};
export function townView(life: LifeState, uid: string, now: number): TownView {
  const t = townRead(life, uid, now),
    day = kstDay(now),
    week = weekOfDay(day);
  return {
    auction: {
      open: auctionOpen(now),
      premiumLeft: Math.max(0, AUCTION_PREMIUM_CAP - (t.auc ?? 0)),
      unitsLeft: Math.max(0, AUCTION_UNITS_MAX - (t.aucN ?? 0)),
      next: nextSlot(now, [0, 1, 2, 3, 4, 5, 6], AUCTION_HOURS[0]),
    },
    coop: { week, crops: coopWeekCrops(week), bonusLeft: Math.max(0, COOP_BONUS_CAP - (t.coop ?? 0)) },
    bakery: { left: Math.max(0, BAKERY_PER_DAY - (t.bake ?? 0)) },
    tavern: { left: Math.max(0, SHOP_FOOD_PER_DAY - (t.tav ?? 0)) },
    stalls: { open: marketDayOn(day), harbor: harborStallOn(day), goods: stallGoods(day), bought: [...(t.stall ?? [])], left: Math.max(0, STALL_PER_DAY - (t.stall?.length ?? 0)) },
    club: { open: readingOpen(now), done: t.club === week, next: nextSlot(now, [READING_WEEKDAY], READING_HOURS[0]) },
    show: { on: showNight(now), next: nextSlot(now, SHOW_WEEKDAYS, SHOW_HOURS[0]) },
    seen: [...(t.seen ?? [])],
  };
}
/** Season shown with the weekly notice. */
export const coopWeekSeason = (now: number) => seasonOf(now);
export const cropName = (c: Crop) => CROP_INFO[c]?.name ?? c;
