// 낚시 업그레이드 data (handover/design/design-fishing-upgrade.md): new
// species, crab-pot catches, per-species fight profiles (behaviour and
// difficulty), KST hour windows, legendary conditions, bait, tackle, crab
// pots and seafood dishes. Pure data. lounge-items.ts spreads the new fish,
// items, prices, crafts and dishes into its catalogs, so this module must not
// import lounge-items at runtime (types only).
import type { DishDef, FishDef, ItemDef, RecipeDef } from './lounge-items.ts';
import type { Season, Weather } from './lounge-calendar.ts';
// 먼바다 낚싯배 (design-sea-fishing.md): the new sea and offshore species' profiles.
import { SEA_PROFILE } from './lounge-fish-sea-data.ts';
// 민물 어종 확장: profiles and dishes of the new freshwater fish.
import { FRESH_DISHES, FRESH_PROFILE } from './lounge-fish-data-fresh.ts';

/** Action kinds of lounge-fish-engine (a leaf module, so lounge-life can spread them at load). */
export const ANGLING_ACTION_KINDS = [
  'anglerCast',
  'anglerHook',
  'anglerLand',
  'anglerCancel',
  'anglerTackle',
  'crabSet',
  'crabCollect',
  'crabTake',
  'cupClaim',
] as const;

const ALL: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];

// ---------------------------------------------------------------- species
/**
 * New rod fish. The three new legends keep `seasons: []` in the shared
 * catalog so the legacy cast (lounge-life-plus) can never pick them; their
 * real season and conditions live in FISH_PROFILE below.
 */
export const EXTRA_FISH: readonly FishDef[] = [
  { id: 'mullet', name: '숭어', emoji: '', spots: ['sea', 'harbor'], seasons: ['winter', 'spring'], time: 'any', sky: 'any', weight: 30, sell: 480, cm: [30, 70], windowMs: 900, note: '물 위로 펄쩍 뛰어오르는 겨울 바다의 단골.' },
  { id: 'sandfish', name: '도루묵', emoji: '', spots: ['sea'], seasons: ['winter'], time: 'any', sky: 'any', weight: 28, sell: 570, cm: [15, 26], windowMs: 900, note: '말짱 도루묵이라지만 알이 꽉 찼어요.' },
  { id: 'filefish', name: '쥐치', emoji: '', spots: ['rocks'], seasons: ['summer', 'autumn'], time: 'day', sky: 'any', weight: 22, sell: 630, cm: [15, 35], windowMs: 850, note: '미끼만 쏙 빼 먹는 갯바위 얌체.' },
  { id: 'blossomtrout', name: '벚꽃 산천어', emoji: '', spots: ['falls'], seasons: [], time: 'day', sky: 'dry', weight: 1, sell: 7_800, cm: [40, 70], windowMs: 450, note: '벚꽃잎이 폭포 소를 덮는 봄 아침에만 나온다는 전설.' },
  { id: 'lakelord', name: '호수의 주인', emoji: '', spots: ['lake'], seasons: [], time: 'night', sky: 'rain', weight: 1, sell: 9_750, cm: [120, 200], windowMs: 450, note: '여름 장맛비 내리는 한밤, 선착장 밑 그림자가 움직여요.' },
  { id: 'icecod', name: '겨울 왕대구', emoji: '', spots: ['rocks'], seasons: [], time: 'any', sky: 'any', weight: 1, sell: 9_100, cm: [90, 140], windowMs: 450, note: '겨울 새벽 갯바위에만 들른다는 커다란 대구.' },
];
/** Crab-pot catches: museum and cooking items with no rod spot. */
export const POT_FISH: readonly FishDef[] = [
  { id: 'daseulgi', name: '다슬기', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 40, sell: 90, cm: [2, 4], windowMs: 1_000, note: '맑은 물 돌바닥에 붙어 살아요. 통발로 건져요.' },
  { id: 'shrimp', name: '민물새우', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 30, sell: 140, cm: [3, 6], windowMs: 1_000, note: '톡톡 튀는 새뱅이. 통발로 건져요.' },
  { id: 'crab', name: '꽃게', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 15, sell: 680, cm: [12, 22], windowMs: 1_000, note: '집게를 들고 통발 안에서 버텨요.' },
  { id: 'clam', name: '바지락', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 40, sell: 180, cm: [3, 6], windowMs: 1_000, note: '칼국수에 넣으면 국물이 시원해요.' },
  { id: 'oyster', name: '굴', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 25, sell: 390, cm: [6, 12], windowMs: 1_000, note: '바위에 붙어 자라는 바다의 우유.' },
  { id: 'conch', name: '소라', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 20, sell: 480, cm: [7, 14], windowMs: 1_000, note: '귀에 대면 파도 소리가 들린대요.' },
];
export const POT_FRESH = ['daseulgi', 'shrimp', 'crayfish'] as const;
export const POT_SEA = ['clam', 'oyster', 'conch', 'crab'] as const;

// ---------------------------------------------------------------- fight profiles
/** How the fish moves in the reel minigame (lounge-fish-minigame). */
export type Behaviour = 'calm' | 'dart' | 'sink' | 'float' | 'mixed';
export const BEHAVIOUR_NAME: Record<Behaviour, string> = {
  calm: '느긋함',
  dart: '쏜살같음',
  sink: '가라앉음',
  float: '떠오름',
  mixed: '제멋대로',
};
export type FishProfile = {
  behaviour: Behaviour;
  /** 10 (easy) … 95 (legend). */
  difficulty: number;
  /** KST hours [from, to) when it bites (wraps past midnight). */
  hours?: readonly [number, number];
  /** Real season of the new legends (their catalog entry says none). */
  season?: Season;
  /** Legendary: caught once per friend, with skill and rod gates. */
  legend?: { level: number; rod: number };
  /** Bites only with this rod tier or more, or with this bait on the hook (먼바다 대물). */
  need?: { rod?: number; bait?: BaitId };
  /** Only on the captain's dawn sailing (lounge-voyage.ts). */
  dawn?: true;
  /** Only under these skies (a legend's 맑음); `sky` on the catalog entry still applies. */
  weather?: readonly Weather[];
};
/** Every rod fish; missing ids fall back to profileOf's rarity default. */
export const FISH_PROFILE: Readonly<Record<string, FishProfile>> = {
  ...FRESH_PROFILE,
  crucian: { behaviour: 'calm', difficulty: 15 },
  carp: { behaviour: 'calm', difficulty: 30 },
  koi: { behaviour: 'float', difficulty: 60, hours: [9, 17] },
  bass: { behaviour: 'dart', difficulty: 45 },
  minnow: { behaviour: 'dart', difficulty: 12 },
  sweetfish: { behaviour: 'dart', difficulty: 50, hours: [8, 18] },
  mandarin: { behaviour: 'sink', difficulty: 58, hours: [18, 1] },
  catfish: { behaviour: 'sink', difficulty: 45 },
  eel: { behaviour: 'mixed', difficulty: 64, hours: [20, 4] },
  trout: { behaviour: 'dart', difficulty: 42 },
  medaka: { behaviour: 'float', difficulty: 10 },
  goldfish: { behaviour: 'float', difficulty: 20 },
  snakehead: { behaviour: 'sink', difficulty: 55 },
  smelt: { behaviour: 'calm', difficulty: 18 },
  loach: { behaviour: 'mixed', difficulty: 28 },
  crayfish: { behaviour: 'sink', difficulty: 25 },
  mackerel: { behaviour: 'dart', difficulty: 20 },
  shad: { behaviour: 'dart', difficulty: 32 },
  flounder: { behaviour: 'sink', difficulty: 40 },
  squid: { behaviour: 'float', difficulty: 40, hours: [20, 3] },
  yellowtail: { behaviour: 'dart', difficulty: 55 },
  puffer: { behaviour: 'float', difficulty: 50 },
  seabream: { behaviour: 'mixed', difficulty: 72 },
  goldcarp: { behaviour: 'mixed', difficulty: 90 },
  kkeokji: { behaviour: 'sink', difficulty: 30 },
  shiri: { behaviour: 'dart', difficulty: 30, hours: [7, 18] },
  lenok: { behaviour: 'dart', difficulty: 68 },
  beodeulchi: { behaviour: 'calm', difficulty: 14 },
  rainbow: { behaviour: 'mixed', difficulty: 38 },
  mochi: { behaviour: 'dart', difficulty: 66, hours: [6, 11] },
  bluegill: { behaviour: 'calm', difficulty: 14 },
  blackbass: { behaviour: 'dart', difficulty: 40 },
  skygazer: { behaviour: 'float', difficulty: 66, hours: [21, 4] },
  greenling: { behaviour: 'sink', difficulty: 25 },
  rockfish: { behaviour: 'float', difficulty: 26 },
  jacopever: { behaviour: 'sink', difficulty: 32 },
  octopus: { behaviour: 'sink', difficulty: 55 },
  blackbream: { behaviour: 'mixed', difficulty: 70 },
  horsemackerel: { behaviour: 'dart', difficulty: 22 },
  hairtail: { behaviour: 'float', difficulty: 42, hours: [19, 4] },
  conger: { behaviour: 'mixed', difficulty: 40 },
  mitre: { behaviour: 'float', difficulty: 44, hours: [20, 3] },
  moonhairtail: { behaviour: 'float', difficulty: 88 },
  kkeuri: { behaviour: 'dart', difficulty: 32 },
  nuchi: { behaviour: 'sink', difficulty: 26 },
  bagrid: { behaviour: 'sink', difficulty: 40 },
  mullet: { behaviour: 'float', difficulty: 34 },
  sandfish: { behaviour: 'sink', difficulty: 30 },
  filefish: { behaviour: 'mixed', difficulty: 38 },
  blossomtrout: { behaviour: 'dart', difficulty: 80, hours: [6, 10], season: 'spring', legend: { level: 5, rod: 3 } },
  lakelord: { behaviour: 'sink', difficulty: 92, hours: [22, 3], season: 'summer', legend: { level: 7, rod: 3 } },
  icecod: { behaviour: 'mixed', difficulty: 88, hours: [5, 8], season: 'winter', legend: { level: 6, rod: 2 } },
  ...SEA_PROFILE,
};
/** The two legends from before the upgrade: once per friend, no extra gates. */
export const LEGACY_LEGENDS = ['goldcarp', 'moonhairtail'] as const;

/** Hours window check (KST hour 0–23; [from, to) wraps past midnight). */
export function inHours(hours: readonly [number, number] | undefined, hour: number) {
  if (!hours) return true;
  const [from, to] = hours;
  return from <= to ? hour >= from && hour < to : hour >= from || hour < to;
}

// ---------------------------------------------------------------- bait and tackle
export type BaitId = 'bait' | 'bait-dough' | 'bait-shrimp' | 'bait-glow';
export const BAITS: readonly BaitId[] = ['bait', 'bait-dough', 'bait-shrimp', 'bait-glow'];
export type TackleId = 'tackle-float' | 'tackle-trap' | 'tackle-treasure';
export const TACKLES: readonly TackleId[] = ['tackle-float', 'tackle-trap', 'tackle-treasure'];
/** Uses before a tackle wears out. */
export const TACKLE_USES = 20;
export const CRAB_POT = 'crabpot';
const tool = (id: string, name: string, note: string): ItemDef => ({ id, name, emoji: '', cat: 'tool', kind: 'tool', sell: 0, note });
export const FISHING_TOOL_ITEMS: readonly ItemDef[] = [
  tool('bait-dough', '떡밥', '민물에서 입질이 두 배 빨리 와요'),
  tool('bait-shrimp', '새우 미끼', '바다·항구·갯바위: 희귀 ×1.5, 크기 +10%'),
  tool('bait-glow', '반딧불 미끼', '밤에 희귀 ×2, 전설 ×1.5'),
  tool('tackle-float', '큰 찌', `손맛 칸이 넓어져요 · ${TACKLE_USES}번`),
  tool('tackle-trap', '덫 찌', `물고기가 달아나는 속도가 느려져요 · ${TACKLE_USES}번`),
  tool('tackle-treasure', '보물 찌', `보물 상자가 더 자주 떠올라요 · ${TACKLE_USES}번`),
  tool(CRAB_POT, '통발', '낚시터에 놓아 두면 4시간 뒤 해산물이 들어 있어요'),
];
export const FISHING_ITEM_PRICES: Readonly<Record<string, number>> = {
  'bait-dough': 40,
  'bait-shrimp': 80,
  'tackle-float': 4_000,
  'tackle-trap': 5_000,
  'tackle-treasure': 6_000,
  [CRAB_POT]: 2_500,
};
export const FISHING_CRAFTS: readonly RecipeDef[] = [
  { id: 'bait-glow', name: '반딧불 미끼', emoji: '', needs: [{ cat: 'bug', n: 2 }], makes: 'bait-glow', count: 2 },
  { id: CRAB_POT, name: '통발', emoji: '', needs: [{ item: 'wood', n: 6 }, { item: 'copper', n: 2 }], makes: CRAB_POT, count: 1 },
];

// ---------------------------------------------------------------- dishes
/**
 * Seafood dishes. Priced in lounge-items DISHES like every other dish
 * (ingredients × 1.25 + 100, rounded to 10), so they follow the fish prices.
 */
const dishOf = (id: string, name: string, needs: RecipeDef['needs'], note: string, buff?: DishDef['buff']): DishDef => ({
  id,
  name,
  emoji: '',
  needs,
  makes: id,
  count: 1,
  note,
  sell: 0,
  ...(buff ? { buff } : {}),
});
export const FISH_DISHES: readonly DishDef[] = [
  ...FRESH_DISHES,
  dishOf('sashimi', '모둠 회', [{ cat: 'fish', n: 2 }], '갓 잡은 물고기를 얇게 떴어요.', 'luck'),
  dishOf('haemuljeon', '해물파전', [{ item: 'clam', n: 2 }, { item: 'potato', n: 1 }], '바지락을 듬뿍 넣은 비 오는 날의 전.', 'mine'),
  dishOf('guljeon', '굴전', [{ item: 'oyster', n: 2 }, { item: 'potato', n: 1 }], '달걀옷을 입혀 노릇하게.', 'charm'),
  dishOf('kkotgetang', '꽃게탕', [{ item: 'crab', n: 1 }, { item: 'potato', n: 1 }, { cat: 'fish', n: 1 }], '빨간 국물에 게살이 가득.', 'luck'),
  dishOf('daseulgiguk', '다슬기국', [{ item: 'daseulgi', n: 3 }, { item: 'carrot', n: 1 }], '맑고 파란 국물. 속이 편해져요.', 'wood'),
];
