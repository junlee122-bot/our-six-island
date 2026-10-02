// 가게 나누기 (handover/design/design-food-and-shops.md §1, decided 2026-10-01):
// there is no single "범타듀 상점" any more; each shop sells its own goods
// and buys its own kind of goods. Server-authoritative: the life engines ask
// this module what a shop carries and at what price, and the cloud engine
// checks the player really stands in the shop's district (shopArea).
//
//   가게             파는 것                                   사는 것 (100%)
//   등불 잡화점       씨앗·꾸러미·비료·흙·소품·염색, 주간 특가,   채집물·꽃·재료·곤충
//                    꽃다발·청혼 반지(연애·결혼)
//                    토요일 밤 등불 상점(비싼 씨앗 할인)
//   범마을 농협       일요일 작물 좌판(시세표 작물 씨앗)          작물·과일·가공품
//   느긋한 빵집       빵·음료(그 자리에서), 도시락(가방)          —
//   범마을 어시장     미끼·찌·통발·낚싯대 2~3단계                물고기·통발 해산물
//   허풍 주점         안주·음료(그 자리에서)                    요리
//   행상인 마키마     주마다 바뀌는 희귀품 3종, 계약 한 건        —
//   대장간           (도구 강화)                               광석·보석
//   닐라 목장(축사)   동물·건초(lounge-stage3.ts)                 달걀·우유·양털
//   강물 과수원 창고   묘목(lounge-stage3.ts)                      과수원 과일
//   오른의 대장간     범위 강화(lounge-stage3.ts)                 광석·보석(+오늘의 광석 웃돈)
//   메르시 의원       진료·수액·허브차(그 자리에서)               —
//
// Selling the same goods from the bag or the shipping bin pays SELL_AWAY
// (85%); the daily 100,000범 cap and the demand curves are unchanged. Until
// the 항구 구역 opens for a friend, the 잡화점 keeps the fishing goods and buys
// fish for 럭스.
//
// Cycle-safe: lounge-life / lounge-life-plus / lounge-town import this module
// and it imports them back, so their bindings are used inside functions only.
import { hash32, kstHour, weekdayOf } from './lounge-calendar.ts';
import { kstDay } from './lounge-economy.ts';
import { CROP_SELL_REF, FERTILIZERS, ITEM_BY_ID, ITEM_PRICES, ROMANCE_ITEMS, SPICES } from './lounge-items.ts';
import { ORE_ITEMS } from './lounge-growth-data.ts';
import { isGoodId } from './lounge-farm-data.ts';
import { CRAB_POT, FISHING_ITEM_PRICES } from './lounge-fish-data.ts';
import { hasExplorerPass } from './lounge-explorer-pass.ts';
import { LUNCHES, LUNCH_PRICE } from './lounge-food-data.ts';
import { CROP_INFO, LifeError, SHOP_BY_ID, type Crop, type LifeState } from './lounge-life.ts';
import { coopWeekCrops } from './lounge-town.ts';
import { ORCHARD_FRUITS, RANCH_GOODS } from './lounge-stage3-data.ts';

export type ShopId = 'general' | 'coop' | 'bakery' | 'fishmarket' | 'tavern' | 'peddler' | 'forge' | 'barn' | 'orchardShop' | 'smithy' | 'clinic';
export const SHOP_IDS: readonly ShopId[] = ['general', 'coop', 'bakery', 'fishmarket', 'tavern', 'peddler', 'forge', 'barn', 'orchardShop', 'smithy', 'clinic'];
export const isShopId = (s: unknown): s is ShopId => typeof s === 'string' && (SHOP_IDS as readonly string[]).includes(s);
/** Where a shop's counter is (player.area); the 행상인 moves with the week. */
export type ShopArea = 'market' | 'harbor' | 'tavern' | 'village' | 'ranch' | 'foothill';
export type ShopInfo = { name: string; keeper: string; area: ShopArea; sells: string; buys: string };
export const SHOP_INFO: Record<ShopId, ShopInfo> = {
  general: { name: '등불 잡화점', keeper: '쓰레쉬', area: 'market', sells: '씨앗 · 비료 · 흙 · 희귀 소품 · 염색 팔레트', buys: '채집물 · 꽃 · 재료 · 곤충' },
  coop: { name: '범마을 농협', keeper: '나세라', area: 'market', sells: '일요일 작물 좌판(시세표 작물 씨앗)', buys: '작물 · 과일 · 가공품' },
  bakery: { name: '느긋한 빵집', keeper: '프리렌 · 힘멜', area: 'market', sells: '빵과 음료(그 자리에서) · 도시락', buys: '' },
  fishmarket: { name: '범마을 어시장', keeper: '럭스', area: 'harbor', sells: '미끼 · 찌 · 통발 · 낚싯대', buys: '물고기 · 통발 해산물' },
  tavern: { name: '허풍 주점', keeper: '허 선장', area: 'tavern', sells: '안주와 음료(그 자리에서)', buys: '요리' },
  peddler: { name: '행상인 마키마', keeper: '마키마', area: 'market', sells: '이번 주 희귀품 3종 · 계약', buys: '' },
  forge: { name: '대장간', keeper: '대장장이', area: 'village', sells: '도구 강화', buys: '광석 · 보석' },
  // Stage 3 (design-npcs-stage3.md §2): the shop ids are their rooms' ids (lounge-shop-interiors.ts).
  barn: { name: '닐라 목장', keeper: '닐라', area: 'ranch', sells: '닭 · 소 · 양 · 건초', buys: '달걀 · 우유 · 양털' },
  orchardShop: { name: '강물 과수원', keeper: '하쿠', area: 'ranch', sells: '과일나무 묘목', buys: '과수원 과일' },
  smithy: { name: '오른의 대장간', keeper: '오른', area: 'foothill', sells: '물뿌리개·괭이 범위 · 채집 바구니', buys: '광석 · 보석' },
  clinic: { name: '메르시 의원', keeper: '메르시', area: 'foothill', sells: '진료 · 수액 · 허브차', buys: '' },
};
/** Share of the price when the goods are sold from the bag or the shipping bin. */
export const SELL_AWAY = 0.85;
/** 등불 잡화점's 주간 특가: one consumable this much off for the KST week. */
export const WEEKLY_SPECIAL_OFF = 0.2;
/** 토요일 밤 등불 상점: KST hours [from, to) on Saturdays, share of the price, seeds. */
export const LANTERN_HOURS = [19, 24] as const;
export const LANTERN_SHARE = 0.8;
export const LANTERN_SEEDS = 3;
/** 농협 일요일 작물 좌판: this week's notice crops' seeds at this share. */
export const COOP_SEED_SHARE = 0.9;
/** 행상인: open days (0 = Sunday; Sunday in 시장 거리, Wednesday and Saturday at the harbor). */
export const PEDDLER_DAYS = [0, 3, 6] as const;
/** 행상인's rarities besides the week's spice (two a week), with their prices. */
export const PEDDLER_POOL: readonly { item: string; price: number }[] = [
  { item: 'fertilizer-star', price: 6_000 },
  { item: 'gem', price: 900 },
  { item: 'bait-glow', price: 300 },
  { item: 'hardwood', price: 300 },
  { item: 'songi', price: 1_500 },
];
export const SPICE_PRICE = 3_000;
export const SPICES_IDS: readonly string[] = SPICES.map((sp) => sp.id);
/** 계약: bring these instead of 범 and get the week's spice (one deal a week). */
export const PEDDLER_DEALS: readonly { item: string; n: number }[] = [
  { item: 'wood', n: 30 },
  { item: 'stone', n: 30 },
  { item: 'pinecone', n: 12 },
  { item: 'shell', n: 8 },
  { item: 'copper', n: 8 },
];

const ORE_IDS = new Set<string>(ORE_ITEMS.map((o) => o.id));
const FISHING_GOODS = new Set<string>(['bait', CRAB_POT, ...Object.keys(FISHING_ITEM_PRICES)]);
const GENERAL_GOODS = new Set<string>([...FERTILIZERS, 'speed-gro', 'retaining']);

// ---------------------------------------------------------------- places and days
export const weekOf = (day: number) => Math.floor((day + 3) / 7);
/** Whether the 항구 구역 (and so the 어시장) is open for this friend. */
export const harborOpenFor = (life: Pick<LifeState, 'flags'>, actor: number, now: number) =>
  !!life.flags?.includes('district-harbor') || hasExplorerPass(actor, now);
/** Who sells fishing goods and buys fish for this friend today. */
export const fishShopFor = (life: Pick<LifeState, 'flags'>, actor: number, now: number): ShopId =>
  harborOpenFor(life, actor, now) ? 'fishmarket' : 'general';
export const peddlerOpenOn = (day: number) => (PEDDLER_DAYS as readonly number[]).includes(weekdayOf(day));
/** The district a shop's counter stands in right now (null: the 행상인 is away today). */
export function shopArea(shop: ShopId, now: number): ShopArea | null {
  if (shop !== 'peddler') return SHOP_INFO[shop].area;
  const day = kstDay(now);
  if (!peddlerOpenOn(day)) return null;
  return weekdayOf(day) === 0 ? 'market' : 'harbor';
}
export const lanternOpen = (now: number) => {
  const h = kstHour(now);
  return weekdayOf(kstDay(now)) === 6 && h >= LANTERN_HOURS[0] && h < LANTERN_HOURS[1];
};

// ---------------------------------------------------------------- selling
/** The shop that pays full price for `id` (crop, 'fruit', goods key or item id); null = nobody buys it. */
export function buyerOf(id: string, fishShop: ShopId = 'fishmarket'): ShopId | null {
  if (id === 'fruit' || Object.hasOwn(CROP_SELL_REF, id) || isGoodId(id)) return 'coop';
  if (RANCH_GOODS.includes(id)) return 'barn';
  if (ORCHARD_FRUITS.includes(id)) return 'orchardShop';
  const def = Object.hasOwn(ITEM_BY_ID, id) ? ITEM_BY_ID[id] : undefined;
  if (!def || def.sell <= 0) return null;
  if (def.kind === 'fish') return fishShop;
  if (def.kind === 'dish') return 'tavern';
  if (ORE_IDS.has(id)) return 'forge';
  return def.kind === 'tool' ? null : 'general';
}
/**
 * The share a sale pays: 1 at the item's own shop, SELL_AWAY from the bag
 * (`at` absent). Selling at a shop that does not buy the item is refused.
 */
export function saleShare(life: Pick<LifeState, 'flags'>, actor: number, at: unknown, id: string, now: number): number {
  if (at === undefined || at === null) return SELL_AWAY;
  const buyer = buyerOf(id, fishShopFor(life, actor, now));
  // 오른's 대장간 buys ores and gems at full price like the village forge.
  if (at === 'smithy' && buyer === 'forge') return 1;
  if (!isShopId(at) || at !== buyer) throw new LifeError(buyer ? `${SHOP_INFO[buyer].name}에서 제값을 받아요. 가방에서 팔면 ${Math.round(SELL_AWAY * 100)}%예요.` : '팔 수 없는 물건이에요.');
  return 1;
}

// ---------------------------------------------------------------- buying
/** 등불 잡화점's 주간 특가 of a KST week. */
export function weeklySpecial(week: number): string {
  const pool = [...GENERAL_GOODS].filter((id) => ITEM_PRICES[id]);
  return pool[hash32(`general-special:${week}`) % pool.length];
}
/** Seeds at the 토요일 밤 등불 상점 (the dearer seeds, three a week). */
export function lanternSeeds(week: number): Crop[] {
  const crops = (Object.keys(CROP_INFO) as Crop[]).filter((c) => CROP_INFO[c].seed >= 1_000);
  return crops.sort((a, b) => hash32(`lantern:${week}:${a}`) - hash32(`lantern:${week}:${b}`)).slice(0, LANTERN_SEEDS);
}
/** 행상인's stock of a week: the week's spice and two rarities. */
export function peddlerStock(week: number): { item: string; price: number }[] {
  const spice = SPICES[((week % SPICES.length) + SPICES.length) % SPICES.length].id;
  const rare = [...PEDDLER_POOL].sort((a, b) => hash32(`peddler:${week}:${a.item}`) - hash32(`peddler:${week}:${b.item}`)).slice(0, 2);
  return [{ item: spice, price: SPICE_PRICE }, ...rare];
}
export const peddlerDeal = (week: number) => PEDDLER_DEALS[hash32(`peddler-deal:${week}`) % PEDDLER_DEALS.length];

export type Offer = { price: number; /** most per purchase */ max: number; /** once per friend per week */ once?: true; note?: string };
/**
 * What `shop` sells as `item` right now and at what price (null: not here).
 * `item` is a ShopItem id ('seed-carrot', 'bundle-pumpkin', 'trophy-…',
 * 'palette-…'), an ITEM_PRICES / lunchbox / 행상인 item id, or 'rod' (the next
 * fishing rod; its price is ROD_PRICE, checked by the caller).
 */
export function shopOffer(life: Pick<LifeState, 'flags'>, actor: number, shop: ShopId, item: string, now: number): Offer | null {
  const day = kstDay(now),
    week = weekOf(day),
    fishShop = fishShopFor(life, actor, now);
  if (item === 'rod') return shop === fishShop ? { price: 0, max: 1 } : null;
  const unlock = Object.hasOwn(SHOP_BY_ID, item) ? SHOP_BY_ID[item] : undefined;
  if (unlock) {
    const crop = unlock.crop;
    if (shop === 'general') {
      const lantern = unlock.kind === 'seed' && lanternOpen(now) && lanternSeeds(week).includes(crop!);
      return { price: lantern ? Math.round((unlock.price * LANTERN_SHARE) / 10) * 10 : unlock.price, max: unlock.kind === 'seed' || unlock.kind === 'bundle' ? 20 : 1, ...(lantern ? { note: '등불 상점' } : {}) };
    }
    if (shop === 'coop' && unlock.kind === 'seed' && weekdayOf(day) === 0 && coopWeekCrops(week).includes(crop!))
      return { price: Math.round((unlock.price * COOP_SEED_SHARE) / 10) * 10, max: 20, note: '일요 작물 좌판' };
    return null;
  }
  if (shop === 'bakery') return (LUNCHES as readonly string[]).includes(item) ? { price: LUNCH_PRICE, max: 5 } : null;
  if (shop === 'peddler') {
    if (!peddlerOpenOn(day)) return null;
    const hit = peddlerStock(week).find((p) => p.item === item);
    return hit ? { price: hit.price, max: 1, once: true } : null;
  }
  const price = Object.hasOwn(ITEM_PRICES, item) ? ITEM_PRICES[item] : 0;
  if (!price) return null;
  if ((ROMANCE_ITEMS as readonly string[]).includes(item)) return shop === 'general' ? { price, max: item === 'bouquet' ? 3 : 1 } : null;
  if (FISHING_GOODS.has(item)) return shop === fishShop ? { price, max: 20 } : null;
  if (shop !== 'general' || !GENERAL_GOODS.has(item)) return null;
  const special = weeklySpecial(week) === item;
  return { price: special ? Math.round((price * (1 - WEEKLY_SPECIAL_OFF)) / 10) * 10 : price, max: 20, ...(special ? { note: '주간 특가' } : {}) };
}
/** Which shop sells `item` for this friend right now (for "어디서 사요?" hints). */
export function sellerOf(life: Pick<LifeState, 'flags'>, actor: number, item: string, now: number): ShopId | null {
  return SHOP_IDS.find((s) => shopOffer(life, actor, s, item, now)) ?? null;
}

// ---------------------------------------------------------------- view
export type ShopsView = {
  fishShop: ShopId;
  week: number;
  special: { item: string; price: number };
  lantern: { open: boolean; seeds: Crop[] };
  coopSeeds: { open: boolean; crops: Crop[] };
  peddler: { open: boolean; area: ShopArea | null; stock: { item: string; price: number }[]; bought: string[]; deal: { item: string; n: number; done: boolean } };
};
export function shopsView(life: LifeState, actor: number, now: number, bought: string[], dealDone: boolean): ShopsView {
  const day = kstDay(now),
    week = weekOf(day),
    special = weeklySpecial(week);
  return {
    fishShop: fishShopFor(life, actor, now),
    week,
    special: { item: special, price: shopOffer(life, actor, 'general', special, now)?.price ?? ITEM_PRICES[special] },
    lantern: { open: lanternOpen(now), seeds: lanternSeeds(week) },
    coopSeeds: { open: weekdayOf(day) === 0, crops: coopWeekCrops(week) },
    peddler: { open: peddlerOpenOn(day), area: shopArea('peddler', now), stock: peddlerStock(week), bought, deal: { ...peddlerDeal(week), done: dealDone } },
  };
}
