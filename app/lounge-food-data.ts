// 음식 시스템 data (handover/design/design-food-and-shops.md §2): the two buff
// slots, the 빵집 and 허풍 주점 menus, lunchbox prices, 함께 먹기 and the 맛
// 도감. Pure data and readers of `life.ext[uid]` (no engine imports), so the
// growth, fishing, romance and life engines can all ask "is this buff on?"
// without an import cycle. The eating itself is in lounge-food.ts.
//
// Rules (no stamina stat; food never touches the casino):
//   식사 칸 — home cooking (eaten at home) or a lunchbox (eaten anywhere),
//     once a KST day, until midnight (+6 h for 미식가 or an 이국 요리).
//   간식 칸 — food bought and eaten at the 빵집 or 허풍 주점, 1–2 hours,
//     at most SHOP_FOOD_PER_DAY a day at each shop.
//   Both slots can be on together; eating into a slot replaces what was there.
import { BUFF_INFO, DISH_BY_ID, type DishBuff } from './lounge-items.ts';

const HOUR = 3_600_000;
export type BuffSlot = 'meal' | 'snack';
/** Kinds a meal (dish or lunchbox) can give. */
export const MEAL_BUFFS: readonly DishBuff[] = ['grow', 'luck', 'forage', 'bug', 'mine', 'wood', 'charm'];
/** A slot as stored: `food` is a dish id (meal) or a menu id (snack). */
export type SlotBuff = { kind: DishBuff; food: string; until: number; weak?: true };

/** 가게 음식: eaten on the spot. `buff` goes to the 간식 칸 for `hours`. */
export type ShopFoodDef = {
  id: string;
  shop: 'bakery' | 'tavern';
  name: string;
  price: number;
  /** Mood need points (0–100 scale). */
  food?: number;
  rest?: number;
  fun?: number;
  /** Moodlet the treat adds (lounge-mood-data MOODLETS). */
  let: 'snack' | 'drink' | 'meal';
  buff?: DishBuff;
  hours?: number;
  /** A weaker version of the buff (뱃사람 안주's luck: ×1.5 rare, +10% window). */
  weak?: true;
  /** 함께 먹기 value when shared (default TOGETHER_MOOD). */
  together?: number;
  note: string;
};
/** Prices sit at 1–3% of a friend's average day (economy report, 2026-10). */
export const SHOP_FOODS: readonly ShopFoodDef[] = [
  { id: 'milkbread', shop: 'bakery', name: '느긋한 우유 식빵', price: 400, food: 30, let: 'snack', note: '배부름 +30' },
  { id: 'coffee', shop: 'bakery', name: '늦잠 깨는 커피', price: 500, rest: 30, let: 'drink', buff: 'learn', hours: 1, note: '휴식 +30 · 배움 1시간' },
  { id: 'flowertea-cup', shop: 'bakery', name: '꽃차 한 잔', price: 600, rest: 20, fun: 8, let: 'drink', buff: 'learn', hours: 1, note: '휴식 +20 · 즐거움 +8 · 배움 1시간' },
  { id: 'recipepie', shop: 'bakery', name: '천 년 레시피 파이', price: 900, food: 25, fun: 10, let: 'snack', buff: 'charm', hours: 2, note: '배부름 +25 · 즐거움 +10 · 친화력 2시간' },
  { id: 'sailor-snack', shop: 'tavern', name: '뱃사람 안주', price: 800, food: 30, let: 'snack', buff: 'luck', hours: 1, weak: true, note: '배부름 +30 · 물고기의 행운(약하게) 1시간' },
  { id: 'merchant-cup', shop: 'tavern', name: '상인의 한 잔', price: 1_000, fun: 15, let: 'drink', buff: 'haggle', hours: 2, note: '즐거움 +15 · 흥정 2시간' },
  { id: 'captain-feast', shop: 'tavern', name: '선장의 해물 한 상', price: 2_500, food: 100, let: 'meal', together: 8, note: '배부름 100 · 친구와 같이 먹으면 함께 먹기 +8' },
];
export const SHOP_FOOD_BY_ID: Readonly<Record<string, ShopFoodDef>> = Object.fromEntries(SHOP_FOODS.map((f) => [f.id, f]));
/** 가게 음식 a friend can have at each shop in a KST day. */
export const SHOP_FOOD_PER_DAY = 2;
/** Ready-made lunchboxes at the 빵집 (they go to the bag). */
export const LUNCH_PRICE = 1_500;
export const LUNCHES = ['bento-miner', 'bento-river', 'bento-field'] as const;
/** 미식가 (growth) and 이국 요리 keep the 식사 칸 this long past midnight. */
export const LONG_MEAL_MS = 6 * HOUR;

// ---------------------------------------------------------------- buff numbers
export const LUCK_RARE = 2;
export const LUCK_WINDOW = 1.2;
export const LUCK_WEAK_RARE = 1.5;
export const LUCK_WEAK_WINDOW = 1.1;
/** 광부의 힘: every MINE_BUFF_EVERY-th mine rock gives one more ore; vein odds +points. */
export const MINE_BUFF_EVERY = 3;
export const MINE_BUFF_VEIN = 10;
/** 배움: skill XP multiplier (under the daily soft cap only, like mood). */
export const LEARN_XP = 1.1;
/** 흥정: extra share at the item's own shop, and the most 범 it adds in a KST day. */
export const HAGGLE_SHARE = 0.05;
export const HAGGLE_CAP = 3_000;
/** 친화력: resident points ×. */
export const CHARM_MULT = 1.5;

// ---------------------------------------------------------------- 함께 먹기
/** Friends who eat within this long of each other in the same place eat together. */
export const TOGETHER_MS = 5 * 60_000;
export const TOGETHER_MOOD = 5;
export const TOGETHER_TAVERN_MOOD = 8;
export const TOGETHER_SOCIAL = 30;
/** Places a meal can be eaten (player areas; the cloud engine fills `where` from the real player). */
export const EAT_PLACES = ['village', 'lounge', 'casino', 'tavern', 'bank', 'salon', 'wardrobe', 'home', 'hill', 'woods', 'mine', 'market', 'harbor', 'hillside', 'offshore'] as const;
export type EatPlace = (typeof EAT_PLACES)[number];

// ---------------------------------------------------------------- 맛 도감
/** Every TASTE_STEP new foods tasted pays TASTE_REWARD 범 (reason 'taste'). */
export const TASTE_STEP = 10;
export const TASTE_REWARD = 2_000;
/** Everything that counts in the 맛 도감: every dish, then the shop menus. */
export const TASTE_IDS: readonly string[] = [...Object.keys(DISH_BY_ID), ...SHOP_FOODS.map((f) => f.id)];
export const isTasteId = (id: unknown): id is string => typeof id === 'string' && (Object.hasOwn(DISH_BY_ID, id) || Object.hasOwn(SHOP_FOOD_BY_ID, id));
export const tasteName = (id: string) => DISH_BY_ID[id]?.name ?? SHOP_FOOD_BY_ID[id]?.name ?? id;

// ---------------------------------------------------------------- readers
type ExtLike = { buff?: { kind: DishBuff; dish: string; until: number }; snack?: SlotBuff };
type LifeLike = { ext?: Record<string, ExtLike | undefined> };
/** The 식사 칸 (the pre-2026-10 `ext.buff`) if still on. */
export function mealSlot(life: LifeLike, uid: string, now: number): SlotBuff | null {
  const b = life.ext?.[uid]?.buff;
  return b && now < b.until ? { kind: b.kind, food: b.dish, until: b.until } : null;
}
/** The 간식 칸 if still on. */
export function snackSlot(life: LifeLike, uid: string, now: number): SlotBuff | null {
  const b = life.ext?.[uid]?.snack;
  return b && now < b.until ? b : null;
}
/** 1 when a slot gives `kind` at full strength, 0.5 when only a weak one does, else 0. */
export function buffPower(life: LifeLike, uid: string, now: number, kind: DishBuff): number {
  let p = 0;
  for (const b of [mealSlot(life, uid, now), snackSlot(life, uid, now)])
    if (b?.kind === kind) p = Math.max(p, b.weak ? 0.5 : 1);
  return p;
}
export const hasBuff = (life: LifeLike, uid: string, now: number, kind: DishBuff) => buffPower(life, uid, now, kind) > 0;
/** 물고기의 행운 multipliers for one cast. */
export function luckMods(life: LifeLike, uid: string, now: number) {
  const p = buffPower(life, uid, now, 'luck');
  return p >= 1 ? { rare: LUCK_RARE, window: LUCK_WINDOW } : p > 0 ? { rare: LUCK_WEAK_RARE, window: LUCK_WEAK_WINDOW } : { rare: 1, window: 1 };
}
/** 배움: the XP multiplier from food. */
export const learnMult = (life: LifeLike, uid: string, now: number) => (hasBuff(life, uid, now, 'learn') ? LEARN_XP : 1);
/** 친화력: resident points after the buff (whole points, at least the base). */
export const charmPoints = (life: LifeLike, uid: string, now: number, n: number) =>
  n > 0 && hasBuff(life, uid, now, 'charm') ? Math.round(n * CHARM_MULT) : n;
/** What eating `id` would switch on (the preview on every 먹기 button). */
export function foodPreview(id: string): { slot: BuffSlot; kind?: DishBuff; name?: string; text?: string; hours?: number; weak?: true } | null {
  const dish = DISH_BY_ID[id];
  if (dish) return { slot: 'meal', ...(dish.buff ? { kind: dish.buff, name: BUFF_INFO[dish.buff].name, text: BUFF_INFO[dish.buff].text } : {}) };
  const f = SHOP_FOOD_BY_ID[id];
  if (!f) return null;
  return { slot: 'snack', ...(f.buff ? { kind: f.buff, name: BUFF_INFO[f.buff].name + (f.weak ? '(약하게)' : ''), text: BUFF_INFO[f.buff].text, hours: f.hours } : {}), ...(f.weak ? { weak: true as const } : {}) };
}
