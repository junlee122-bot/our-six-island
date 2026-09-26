// 가게 업그레이드 (pure data; the action is in lounge-venue-upgrades.ts):
// shared village purchases for 허풍 주점, 범마을 부동산 and
// 나무결 가구점 (like the 마을 공사 board). Every upgrade belongs to one shop and
// one category and is bought in tier order; friends chip in 범 (any amount
// from VENUE_MIN_GIVE, capped at what is left) and when it is full the shop
// changes for everyone: kArchive props appear or swap (lounge-tavern-interior,
// lounge-village-shops) and a few upgrades change shop rules (the furniture
// store's stock and luxury slots, the realty's plan discounts).
//
// Server-authoritative and ledger-safe: 범 only leaves a wallet through
// spendBeom with a fresh ledger entry id, the stored state is re-read and
// clamped (readVenues), and a finished upgrade refuses more money. The
// room-command receipts make a retried request idempotent.
import type { TavernModel, ShopModel } from './lounge-model-assets.ts';

export type UpgradeVenue = 'tavern' | 'realty' | 'furniture';
export type UpgradeCategory =
  | 'exterior'
  | 'bar'
  | 'seats'
  | 'lights'
  | 'decor'
  | 'kitchen'
  | 'plans'
  | 'stock'
  | 'luxury'
  | 'service';
export const UPGRADE_CATEGORY_NAME: Record<UpgradeCategory, string> = {
  exterior: '외관',
  bar: '바·카운터',
  seats: '좌석',
  lights: '조명',
  decor: '벽·장식',
  kitchen: '주방',
  plans: '설계 도면',
  stock: '진열대',
  luxury: '명품관',
  service: '손님 맞이',
};
export const VENUE_CATEGORIES: Record<UpgradeVenue, readonly UpgradeCategory[]> = {
  tavern: ['exterior', 'bar', 'seats', 'lights', 'decor', 'kitchen'],
  realty: ['exterior', 'plans'],
  furniture: ['exterior', 'stock', 'luxury', 'service'],
};
export const VENUE_NAME: Record<UpgradeVenue, string> = {
  tavern: '허풍 주점',
  realty: '범마을 부동산',
  furniture: '나무결 가구점',
};

export type UpgradeDef = {
  id: string;
  venue: UpgradeVenue;
  category: UpgradeCategory;
  tier: 1 | 2 | 3;
  name: string;
  cost: number;
  note: string;
  /** Interior props (TAVERN_MODELS) this tier adds. */
  props?: readonly TavernModel[];
  /** Village props / building (SHOP_MODELS) this tier adds or swaps in. */
  outside?: readonly ShopModel[];
  /** The building model this tier swaps in (exterior tiers). */
  building?: ShopModel;
};

/**
 * The base set every shop starts with (no upgrade needed): the models the
 * design picked as 기본 (scratchpad design-tavern.md §2).
 */
export const VENUE_BASE: {
  tavern: { building: ShopModel; props: readonly TavernModel[] };
  realty: { building: ShopModel };
  furniture: { building: ShopModel };
} = {
  tavern: {
    building: 'tavernStall',
    props: ['barCounter', 'wallShelf', 'bottle', 'keg', 'cafeTable', 'saddleStool', 'fireplace'],
  },
  realty: { building: 'realtyOffice' },
  furniture: { building: 'furnitureShop' },
};

const up = (def: UpgradeDef) => def;
export const VENUE_UPGRADES: readonly UpgradeDef[] = [
  // ---------------------------------------------------------- 허풍 주점
  up({ id: 'tavern-ext-1', venue: 'tavern', category: 'exterior', tier: 1, name: '입구 단장', cost: 100_000, note: '입구에 “오늘의 카드: ?” 칠판을 세우고 한지 등을 두 개 더 달아요.', outside: ['menuBoard'] }),
  up({ id: 'tavern-ext-2', venue: 'tavern', category: 'exterior', tier: 2, name: '본채 새 단장', cost: 300_000, note: '청록 지붕의 닫힌 가게(만두집 본채)로 새 단장해요. 문이 달린 아늑한 주막이 돼요.', building: 'dumplingShop' }),
  up({ id: 'tavern-ext-3', venue: 'tavern', category: 'exterior', tier: 3, name: '홍등 거리', cost: 600_000, note: '홍등이 가장 선명한 주막 본채로 바꾸고, 옆에 항구 구이 좌판을 세워요.', building: 'stallHeritage', outside: ['grillHut'] }),
  up({ id: 'tavern-bar-1', venue: 'tavern', category: 'bar', tier: 1, name: '잔과 머그', cost: 80_000, note: '바 위에 잔과 머그 걸이, 바닥에 병 상자를 들여요.', props: ['glass', 'cupTree', 'bottleCrate'] }),
  up({ id: 'tavern-bar-2', venue: 'tavern', category: 'bar', tier: 2, name: '장식장과 찻장', cost: 200_000, note: '바 끝에 코너 장식장, 찻장, 잔 상자를 놓아요.', props: ['cornerCabinet', 'teaSideboard', 'glassRack'] }),
  up({ id: 'tavern-bar-3', venue: 'tavern', category: 'bar', tier: 3, name: '생맥주 탭과 음료 바', cost: 400_000, note: '맥주 탭과 음료 바를 들여 바를 한 칸 더 넓혀요.', props: ['sodaTap', 'beverageBar'] }),
  up({ id: 'tavern-seats-1', venue: 'tavern', category: 'seats', tier: 1, name: '관전석 부스', cost: 80_000, note: '구경하는 친구를 위한 부스 의자를 오른쪽 벽에 붙여요.', props: ['boothBench'] }),
  up({ id: 'tavern-seats-2', venue: 'tavern', category: 'seats', tier: 2, name: '지붕 벤치', cost: 200_000, note: '문 옆에 지붕 달린 벤치를 놓아요.', props: ['shelterBench'] }),
  up({ id: 'tavern-seats-3', venue: 'tavern', category: 'seats', tier: 3, name: '막걸리 소반', cost: 400_000, note: '관전 구역에 막걸리 사발을 올린 소반을 놓아요.', props: ['soban'] }),
  up({ id: 'tavern-lights-1', venue: 'tavern', category: 'lights', tier: 1, name: '전구 줄', cost: 80_000, note: '천장 들보를 따라 호박색 전구 줄을 걸어요.', props: ['stringLights'] }),
  up({ id: 'tavern-lights-2', venue: 'tavern', category: 'lights', tier: 2, name: '별 등', cost: 200_000, note: '바 끝에 노란 별 등을 켜요.', props: ['starLamp'] }),
  up({ id: 'tavern-lights-3', venue: 'tavern', category: 'lights', tier: 3, name: '스탠드 등', cost: 400_000, note: '관전 구역 양쪽에 스탠드 등을 세워요.', props: ['floorLamp'] }),
  up({ id: 'tavern-decor-1', venue: 'tavern', category: 'decor', tier: 1, name: '옷걸이와 대나무', cost: 80_000, note: '문 옆 옷걸이와 대나무 화분으로 사람 사는 느낌을 더해요.', props: ['coatStand', 'bambooPlanter'] }),
  up({ id: 'tavern-decor-2', venue: 'tavern', category: 'decor', tier: 2, name: '판자 문틀과 창틀', cost: 200_000, note: '벽에 판자 문틀과 창틀을 덧대요.', props: ['doorway', 'windowFrame'] }),
  up({ id: 'tavern-decor-3', venue: 'tavern', category: 'decor', tier: 3, name: '음향 콘솔과 책장', cost: 400_000, note: '축음기 옆에 음향 콘솔과 책장, 바에 주문표 걸이를 달아요.', props: ['audioConsole', 'bookcase', 'ticketRail'] }),
  up({ id: 'tavern-kitchen-1', venue: 'tavern', category: 'kitchen', tier: 1, name: '국밥 가마솥', cost: 80_000, note: '오른쪽 구석에 아궁이와 김 나는 가마솥을 걸어요.', props: ['cauldron', 'stove'] }),
  up({ id: 'tavern-kitchen-2', venue: 'tavern', category: 'kitchen', tier: 2, name: '보리차 통과 계산대', cost: 200_000, note: '바 위에 보리차 통과 계산대를 놓아요.', props: ['teaUrn', 'register'] }),
  up({ id: 'tavern-kitchen-3', venue: 'tavern', category: 'kitchen', tier: 3, name: '식료품 선반과 군밤 화로', cost: 400_000, note: '식료품 선반, 술통 받침, 군밤 화로로 주방을 채워요.', props: ['storageShelf', 'barrelRack', 'chestnutRoaster'] }),
  // ---------------------------------------------------------- 범마을 부동산
  up({ id: 'realty-ext-1', venue: 'realty', category: 'exterior', tier: 1, name: '간판과 화단', cost: 120_000, note: '사무소 앞에 “매물 있어요” 입간판과 화단을 놓아요.' }),
  up({ id: 'realty-ext-2', venue: 'realty', category: 'exterior', tier: 2, name: '2층 사무소', cost: 400_000, note: '사무소를 2층 건물로 올려요.', building: 'realtyDuplex' }),
  up({ id: 'realty-plans-1', venue: 'realty', category: 'plans', tier: 1, name: '정원 도면실', cost: 300_000, note: '집 확장 3단계 “앞마당 정원” 공사비가 10% 줄어요.' }),
  up({ id: 'realty-plans-2', venue: 'realty', category: 'plans', tier: 2, name: '증축 도면실', cost: 600_000, note: '집 확장 4단계 “2층 증축” 공사비가 10% 줄어요.' }),
  // ---------------------------------------------------------- 나무결 가구점
  up({ id: 'furniture-ext-1', venue: 'furniture', category: 'exterior', tier: 1, name: '차양과 화분', cost: 120_000, note: '가게 앞에 화분과 “오늘의 가구” 입간판을 놓아요.' }),
  up({ id: 'furniture-ext-2', venue: 'furniture', category: 'exterior', tier: 2, name: '쇼윈도 증축', cost: 400_000, note: '둥근 쇼윈도가 달린 가게로 넓혀요.', building: 'furnitureShowroom' }),
  up({ id: 'furniture-stock-1', venue: 'furniture', category: 'stock', tier: 1, name: '진열대 늘리기', cost: 250_000, note: '오늘의 가구가 매일 2종 더 들어와요.' }),
  up({ id: 'furniture-stock-2', venue: 'furniture', category: 'stock', tier: 2, name: '창고 진열대', cost: 500_000, note: '오늘의 가구가 매일 2종 더 들어와요(모두 4종).' }),
  up({ id: 'furniture-luxury-1', venue: 'furniture', category: 'luxury', tier: 1, name: '명품관 한 칸', cost: 400_000, note: '이번 주 명품 가구가 1종 더 들어와요.' }),
  up({ id: 'furniture-luxury-2', venue: 'furniture', category: 'luxury', tier: 2, name: '명품관 두 칸', cost: 800_000, note: '이번 주 명품 가구가 1종 더 들어와요(모두 2종).' }),
  up({ id: 'furniture-service-1', venue: 'furniture', category: 'service', tier: 1, name: '단골 손님 대접', cost: 150_000, note: '오늘의 가구를 하루 2번 더 새로 고칠 수 있어요.' }),
];
export const VENUE_UPGRADE_BY_ID: Readonly<Record<string, UpgradeDef>> = Object.fromEntries(
  VENUE_UPGRADES.map((u) => [u.id, u]),
);
export const VENUE_MIN_GIVE = 1_000;
/** Percent off a house tier once the realty's plan room for it is built. */
export const PLAN_DISCOUNT = 10;
/** Extra daily furniture per stock tier, luxury slots per luxury tier, rerolls per service tier. */
export const STOCK_PER_TIER = 2;
export const LUXURY_PER_TIER = 1;
export const REROLL_PER_TIER = 2;

/** Stored progress per upgrade id (like ProjectState). */
export type VenueUpgradeState = { got: number; by: Record<string, number>; doneAt?: number };
export type VenueExt = { venues?: Record<string, VenueUpgradeState> };
export type VenueAction = { kind: 'venueUpgrade'; upgrade: string; n: number };
export const VENUE_ACTION_KINDS = ['venueUpgrade'] as const;

export const VENUE_REJECT = {
  upgrade: '가게 업그레이드를 확인해 주세요.',
  locked: '앞 단계 업그레이드를 먼저 마쳐야 해요.',
  done: '이미 끝난 업그레이드예요.',
  give: `${VENUE_MIN_GIVE.toLocaleString('en-US')}범부터 보탤 수 있어요.`,
  balance: '범이 부족해요.',
} as const;

const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

/** Re-reads stored progress: known ids only, amounts clamped to the cost. */
export function readVenues(value: unknown): VenueExt {
  const out: Record<string, VenueUpgradeState> = {};
  for (const def of VENUE_UPGRADES) {
    const p = obj(obj(value)[def.id]);
    const got = safe(p.got) && p.got > 0 ? Math.min(def.cost, p.got) : 0;
    const by: Record<string, number> = {};
    for (const [a, n] of Object.entries(obj(p.by))) if (/^[0-6]$/.test(a) && safe(n) && n > 0) by[a] = n;
    const state: VenueUpgradeState = { got, by };
    if (safe(p.doneAt) && p.doneAt > 0) state.doneAt = p.doneAt;
    if (got > 0 || state.doneAt) out[def.id] = state;
  }
  return Object.keys(out).length ? { venues: out } : {};
}

type Venues = { venues?: Record<string, VenueUpgradeState> } | null | undefined;
export const upgradeDone = (life: Venues, id: string) => !!life?.venues?.[id]?.doneAt;
/** The highest finished tier of a shop's category (0 = base). */
export function venueTier(life: Venues, venue: UpgradeVenue, category: UpgradeCategory): number {
  let tier = 0;
  for (const def of VENUE_UPGRADES)
    if (def.venue === venue && def.category === category && upgradeDone(life, def.id)) tier = Math.max(tier, def.tier);
  return tier;
}
/** Whether an upgrade can take 범 now (its previous tier is done, itself not). */
export function upgradeOpen(life: Venues, def: UpgradeDef) {
  if (upgradeDone(life, def.id)) return false;
  return def.tier === 1 || VENUE_UPGRADES.some((d) => d.venue === def.venue && d.category === def.category && d.tier === def.tier - 1 && upgradeDone(life, d.id));
}

/** What a shop shows: its building and every prop of the finished tiers. */
export function venueLook(life: Venues, venue: UpgradeVenue) {
  let building: ShopModel = VENUE_BASE[venue].building;
  const props = new Set<TavernModel>(venue === 'tavern' ? VENUE_BASE.tavern.props : []);
  const outside = new Set<ShopModel>();
  const tiers: Partial<Record<UpgradeCategory, number>> = {};
  for (const def of VENUE_UPGRADES) {
    if (def.venue !== venue || !upgradeDone(life, def.id)) continue;
    tiers[def.category] = Math.max(tiers[def.category] ?? 0, def.tier);
    if (def.building) building = def.building;
    for (const p of def.props ?? []) props.add(p);
    for (const p of def.outside ?? []) outside.add(p);
  }
  return { building, props: [...props], outside: [...outside], tiers };
}

/** Furniture store rules from its upgrades (lounge-life-plus shopStock). */
export function furnitureBonus(life: Venues) {
  return {
    stock: venueTier(life, 'furniture', 'stock') * STOCK_PER_TIER,
    luxury: venueTier(life, 'furniture', 'luxury') * LUXURY_PER_TIER,
    rerolls: venueTier(life, 'furniture', 'service') * REROLL_PER_TIER,
  };
}
/** A house tier's price after the realty's plan rooms (3 → plans 1, 4 → plans 2). */
export function housePrice(life: Venues, tier: number, price: number) {
  const plans = venueTier(life, 'realty', 'plans');
  const off = (tier === 3 && plans >= 1) || (tier === 4 && plans >= 2) ? PLAN_DISCOUNT : 0;
  return Math.round((price * (100 - off)) / 100 / 1000) * 1000;
}

export type VenueUpgradeView = {
  id: string;
  got: number;
  done: boolean;
  doneAt?: number;
  open: boolean;
  by: Record<string, number>;
};
export function venuesView(life: Venues): VenueUpgradeView[] {
  return VENUE_UPGRADES.map((def) => {
    const st = life?.venues?.[def.id];
    return {
      id: def.id,
      got: st?.got ?? 0,
      done: !!st?.doneAt,
      ...(st?.doneAt ? { doneAt: st.doneAt } : {}),
      open: upgradeOpen(life, def),
      by: { ...st?.by },
    };
  });
}

/** The same shape from a client life view's `venues` list (done upgrades only). */
export function venuesFromView(list: readonly { id: string; done: boolean }[] | undefined): Venues {
  const venues: Record<string, VenueUpgradeState> = {};
  for (const v of list ?? []) if (v.done) venues[v.id] = { got: 0, by: {}, doneAt: 1 };
  return { venues };
}
