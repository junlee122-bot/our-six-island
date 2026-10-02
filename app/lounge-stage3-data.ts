// 마을 확장 3단계 (handover/design/design-npcs-stage3.md §2): the ranch's
// animals, the orchard's trees, 오른's range upgrades and ore counter, 메르시's
// clinic and 신이치's fortune tent — action kinds, shapes and every number.
// A leaf module (calendar, social-defs and item types only), so lounge-life.ts
// can list the kinds at load time without an import cycle and the schedule can
// ask when the tent is open. The engine is lounge-stage3.ts.
import { hash32, holidaysOn, weekdayOf, type Season } from './lounge-calendar.ts';
import { feteOn } from './lounge-social-defs.ts';
import type { DishBuff } from './lounge-items.ts';

// ---------------------------------------------------------------- 목장 동물 (닐라)
export type AnimalKind = 'chicken' | 'cow' | 'sheep';
export const ANIMAL_KINDS: readonly AnimalKind[] = ['chicken', 'cow', 'sheep'];
export type AnimalDef = {
  name: string;
  price: number;
  /** What a day's care gives (plain / when the animal is bonded). */
  product: string;
  bonded: string;
  /** Produces on every `every`-th care (sheep: every other); bonded sheep give wool every care. */
  every: number;
  /** Which shelter it lives in. */
  home: 'coop' | 'barn';
};
export const ANIMALS: Record<AnimalKind, AnimalDef> = {
  chicken: { name: '닭', price: 6_000, product: 'egg', bonded: 'egg-big', every: 1, home: 'coop' },
  cow: { name: '소', price: 15_000, product: 'milk', bonded: 'milk-big', every: 1, home: 'barn' },
  sheep: { name: '양', price: 18_000, product: 'wool', bonded: 'wool', every: 2, home: 'barn' },
};
/** Shelter room: chickens in the coop, cows and sheep together in the barn. */
export const COOP_ROOM = 4;
export const BARN_ROOM = 4;
/** 정(애정): +1 a day cared, −1 a day missed, bonded from ANIMAL_BOND. */
export const ANIMAL_LOVE_MAX = 10;
export const ANIMAL_BOND = 5;
/** 건초: one per animal per care, bought at 닐라's (a sink). */
export const HAY_PRICE = 30;
export const HAY_PER_BUY = 20;

// ---------------------------------------------------------------- 과수원 (하쿠)
export type FruitTreeKind = 'apricot' | 'peach' | 'apple' | 'pear' | 'tangerine';
export const FRUIT_TREE_KINDS: readonly FruitTreeKind[] = ['apricot', 'peach', 'apple', 'pear', 'tangerine'];
export const SAPLINGS: Record<FruitTreeKind, { name: string; price: number; season: Season }> = {
  apricot: { name: '살구나무', price: 3_000, season: 'spring' },
  peach: { name: '복숭아나무', price: 4_000, season: 'summer' },
  apple: { name: '사과나무', price: 4_000, season: 'autumn' },
  pear: { name: '배나무', price: 4_000, season: 'autumn' },
  tangerine: { name: '귤나무', price: 3_500, season: 'winter' },
};
/** Tree spots per friend. */
export const ORCHARD_SLOTS = 3;
/** A sapling bears fruit this many KST days after planting. */
export const ORCHARD_GROW_DAYS = 4;
/** Fruit per pick, and one more once the tree is this old (days). */
export const ORCHARD_YIELD = 2;
export const ORCHARD_OLD_DAYS = 14;

// ---------------------------------------------------------------- 대장간 범위 강화 (오른)
export type SmithTool = 'can' | 'hoe' | 'basket';
export const SMITH_TOOLS: readonly SmithTool[] = ['can', 'hoe', 'basket'];
export type SmithTier = 2 | 3;
export const SMITH_TOOL_NAME: Record<SmithTool, string> = { can: '물뿌리개 범위', hoe: '괭이 범위', basket: '채집 바구니' };
/** Like the fishing rod: tier 1 is what everyone has; tiers 2–3 are bought here. */
export const SMITH_COST: Record<SmithTool, Record<SmithTier, { beom: number; mats: Readonly<Record<string, number>> }>> = {
  can: { 2: { beom: 20_000, mats: { copper: 10 } }, 3: { beom: 70_000, mats: { iron: 10 } } },
  hoe: { 2: { beom: 20_000, mats: { copper: 10 } }, 3: { beom: 70_000, mats: { iron: 10 } } },
  basket: { 2: { beom: 15_000, mats: { copper: 5 } }, 3: { beom: 50_000, mats: { iron: 5 } } },
};
export const SMITH_EFFECT: Record<SmithTool, Record<1 | SmithTier, string>> = {
  can: { 1: '한 칸씩 물 주기', 2: '한 칸에 물 주면 그 줄(1×3)까지', 3: '한 칸에 물 주면 둘레 3×3까지' },
  hoe: { 1: '한 칸씩 심기', 2: '한 칸에 심으면 그 줄(1×3)에 같은 씨앗', 3: '한 칸에 심으면 둘레 3×3에 같은 씨앗' },
  basket: { 1: '덤 없음', 2: '채집·과일 따기 때 30% 확률로 1개 더', 3: '채집·과일 따기 때 60% 확률로 1개 더' },
};
/** 채집 바구니: the chance (%) of one more forage or fruit. */
export const BASKET_EXTRA: Record<1 | SmithTier, number> = { 1: 0, 2: 30, 3: 60 };

// ---------------------------------------------------------------- 광석 매입 · 오늘의 광석 (오른)
export const SMITH_ORES = ['copper', 'iron', 'gold', 'gem'] as const;
export type SmithOre = (typeof SMITH_ORES)[number];
/** Today's ore pays this much on top of the sale (a grant, reason 'smith-ore'). */
export const ORE_OF_DAY_PREMIUM = 0.2;
/** Premium 범 a friend can get from today's ore in one KST day. */
export const ORE_PREMIUM_CAP = 3_000;
export const oreOfDay = (day: number): SmithOre => SMITH_ORES[hash32(`smith-ore:${day}`) % SMITH_ORES.length];

// ---------------------------------------------------------------- 의원 (메르시)
export type ClinicCare = { id: string; name: string; price: number; rest?: number; fun?: number; note: string };
export const CLINIC_MENU: readonly ClinicCare[] = [
  { id: 'checkup', name: '진료', price: 1_200, rest: 40, fun: 10, note: '휴식 +40 · 즐거움 +10' },
  { id: 'drip', name: '피로회복 수액', price: 2_500, rest: 80, note: '휴식 +80' },
  { id: 'herbtea', name: '허브차', price: 800, rest: 20, fun: 15, note: '휴식 +20 · 즐거움 +15' },
];
export const CLINIC_BY_ID: Readonly<Record<string, ClinicCare>> = Object.fromEntries(CLINIC_MENU.map((c) => [c.id, c]));
export const CLINIC_PER_DAY = 2;

// ---------------------------------------------------------------- 점집 (신이치)
export const FORTUNE_PRICE = 500;
/** The fortune's small buff lasts this long (the 운세 칸, apart from meals and snacks). */
export const FORTUNE_HOURS = 3;
export type FortuneDef = { kind: DishBuff; name: string; line: string };
export const FORTUNES: readonly FortuneDef[] = [
  { kind: 'luck', name: '낚시운', line: '물가에 단서가 있어. 오늘은 큰 놈이 걸릴 확률이 높아.' },
  { kind: 'forage', name: '채집운', line: '발밑을 잘 봐. 덤불 속에 하나씩 더 숨어 있어.' },
  { kind: 'mine', name: '광산운', line: '바위의 결이 말해 주고 있어. 광석이 잘 나올 거야.' },
  { kind: 'haggle', name: '흥정운', line: '상대의 눈빛을 읽었어. 오늘은 제값보다 조금 더 받아.' },
  { kind: 'charm', name: '인연운', line: '말 한마디가 사건을 푼다. 주민과 이야기해 봐.' },
  { kind: 'learn', name: '공부운', line: '진실은 언제나 하나. 오늘 배운 건 오래 남아.' },
];
/** Today's fortune for a friend (the same all day). */
export const fortuneFor = (uid: string, day: number): FortuneDef => FORTUNES[hash32(`fortune:${uid}:${day}`) % FORTUNES.length];
/** A festival day (설날·추석 holidays with a claim, 꽃놀이·추석 fêtes). */
export const festivalDay = (day: number) => holidaysOn(day).some((h) => !!h.claim) || !!feteOn(day);
/** The tent is up on weekends and festival days. */
export const fortuneOpenOn = (day: number) => {
  const w = weekdayOf(day);
  return w === 0 || w === 6 || festivalDay(day);
};

// ---------------------------------------------------------------- actions
export const STAGE3_ACTION_KINDS = [
  'animalBuy',
  'animalCare',
  'hayBuy',
  'treePlant',
  'treePick',
  'treeClear',
  'smithUpgrade',
  'oreSell',
  'clinicCare',
  'fortuneRead',
] as const;
export type Stage3ActionKind = (typeof STAGE3_ACTION_KINDS)[number];
export type Stage3Action =
  | { kind: 'animalBuy'; animal: AnimalKind }
  /** Feed (one 건초) and pet every animal not yet cared for today; `i` = only that one. */
  | { kind: 'animalCare'; i?: number }
  | { kind: 'hayBuy'; n: number }
  | { kind: 'treePlant'; slot: number; tree: FruitTreeKind }
  | { kind: 'treePick'; slot: number }
  | { kind: 'treeClear'; slot: number }
  | { kind: 'smithUpgrade'; tool: SmithTool }
  | { kind: 'oreSell'; item: SmithOre; n: number }
  | { kind: 'clinicCare'; care: string }
  | { kind: 'fortuneRead' };
export const isStage3Action = (a: unknown): a is Stage3Action =>
  !!a && typeof a === 'object' && (STAGE3_ACTION_KINDS as readonly string[]).includes((a as { kind?: unknown }).kind as string);

/** Where each action is done: the district, or the shop room inside it (both are accepted). */
export const STAGE3_ACTION_PLACE: Record<Stage3ActionKind, { district: 'ranch' | 'foothill'; room: 'barn' | 'orchardShop' | 'smithy' | 'clinic' | null }> = {
  animalBuy: { district: 'ranch', room: 'barn' },
  animalCare: { district: 'ranch', room: 'barn' },
  hayBuy: { district: 'ranch', room: 'barn' },
  treePlant: { district: 'ranch', room: 'orchardShop' },
  treePick: { district: 'ranch', room: 'orchardShop' },
  treeClear: { district: 'ranch', room: 'orchardShop' },
  smithUpgrade: { district: 'foothill', room: 'smithy' },
  oreSell: { district: 'foothill', room: 'smithy' },
  clinicCare: { district: 'foothill', room: 'clinic' },
  fortuneRead: { district: 'foothill', room: null },
};
/** Areas where an action is accepted (the cloud engine checks the real player). 운세 on a festival day: the hub plaza too. */
export function stage3ActionAreas(kind: Stage3ActionKind, festival = false): string[] {
  const p = STAGE3_ACTION_PLACE[kind];
  const out: string[] = [p.district];
  if (p.room) out.push(p.room);
  if (kind === 'fortuneRead' && festival) out.push('village');
  return out;
}

/** New items of stage 3: the ranch's goods, the orchard's fruit, hay. */
export const STAGE3_ITEMS = {
  egg: { name: '달걀', emoji: '🥚', sell: 80, note: '닐라 목장 닭이 낳은 달걀' },
  'egg-big': { name: '큰 달걀', emoji: '🥚', sell: 150, note: '정든 닭이 낳은 큰 달걀' },
  milk: { name: '우유', emoji: '🥛', sell: 200, note: '닐라 목장 소의 우유' },
  'milk-big': { name: '진한 우유', emoji: '🥛', sell: 320, note: '정든 소의 진한 우유' },
  wool: { name: '양털', emoji: '🧶', sell: 450, note: '닐라 목장 양의 양털' },
  apricot: { name: '살구', emoji: '🍑', sell: 120, note: '하쿠 과수원의 봄 과일' },
  peach: { name: '복숭아', emoji: '🍑', sell: 180, note: '하쿠 과수원의 여름 과일' },
  apple: { name: '사과', emoji: '🍎', sell: 160, note: '하쿠 과수원의 가을 과일' },
  pear: { name: '배', emoji: '🍐', sell: 170, note: '하쿠 과수원의 가을 과일' },
  tangerine: { name: '귤', emoji: '🍊', sell: 140, note: '하쿠 과수원의 겨울 과일' },
} as const;
export type Stage3ItemId = keyof typeof STAGE3_ITEMS;
export const RANCH_GOODS: readonly string[] = ['egg', 'egg-big', 'milk', 'milk-big', 'wool'];
export const ORCHARD_FRUITS: readonly string[] = ['apricot', 'peach', 'apple', 'pear', 'tangerine'];
/**
 * Ledger reason of an item sale: the ranch's goods and the orchard's fruit get
 * their own buckets ('sell-ranch', 'sell-orchard') instead of their item kind's
 * ('sell-material', 'sell-forage'), so they don't count as 대장간 / 등불 잡화점
 * turnover on the stock exchange and a 목장·과수원 stock can be listed on them
 * later (design-stocks.md §11).
 */
export const itemSaleReason = (id: string, kind: string) =>
  RANCH_GOODS.includes(id) ? 'sell-ranch' : ORCHARD_FRUITS.includes(id) ? 'sell-orchard' : 'sell-' + kind;

// ---------------------------------------------------------------- readers (no engine imports)
type SmithLike = { ext?: Record<string, { s3?: { sm?: Partial<Record<SmithTool, SmithTier>> } } | undefined> };
/** A friend's range tier of a tool (1 = not upgraded). */
export const smithTier = (life: SmithLike, uid: string, tool: SmithTool): 1 | SmithTier => life.ext?.[uid]?.s3?.sm?.[tool] ?? 1;
/** 채집 바구니: one more forage or fruit this time (deterministic per key). */
export const basketExtra = (life: SmithLike, uid: string, key: string): 0 | 1 =>
  hash32(`basket:${uid}:${key}`) % 100 < BASKET_EXTRA[smithTier(life, uid, 'basket')] ? 1 : 0;
