// 낚시 업그레이드 data (handover/design/design-fishing-upgrade.md): new
// species, crab-pot catches, per-species fight profiles (behaviour and
// difficulty), KST hour windows, legendary conditions, bait, tackle, crab
// pots and seafood dishes. Pure data. lounge-items.ts spreads the new fish,
// items, prices, crafts and dishes into its catalogs, so this module must not
// import lounge-items at runtime (types only).
import type { DishDef, FishDef, ItemDef, RecipeDef } from './lounge-items.ts';
import type { Season } from './lounge-calendar.ts';

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
  { id: 'mullet', name: '숭어', emoji: '', spots: ['sea', 'harbor'], seasons: ['winter', 'spring'], time: 'any', sky: 'any', weight: 30, sell: 320, cm: [30, 70], windowMs: 900, note: '물 위로 펄쩍 뛰어오르는 겨울 바다의 단골.' },
  { id: 'sandfish', name: '도루묵', emoji: '', spots: ['sea'], seasons: ['winter'], time: 'any', sky: 'any', weight: 28, sell: 380, cm: [15, 26], windowMs: 900, note: '말짱 도루묵이라지만 알이 꽉 찼어요.' },
  { id: 'filefish', name: '쥐치', emoji: '', spots: ['rocks'], seasons: ['summer', 'autumn'], time: 'day', sky: 'any', weight: 22, sell: 420, cm: [15, 35], windowMs: 850, note: '미끼만 쏙 빼 먹는 갯바위 얌체.' },
  { id: 'blossomtrout', name: '벚꽃 산천어', emoji: '', spots: ['falls'], seasons: [], time: 'day', sky: 'dry', weight: 1, sell: 6_000, cm: [40, 70], windowMs: 450, note: '벚꽃잎이 폭포 소를 덮는 봄 아침에만 나온다는 전설.' },
  { id: 'lakelord', name: '호수의 주인', emoji: '', spots: ['lake'], seasons: [], time: 'night', sky: 'rain', weight: 1, sell: 7_500, cm: [120, 200], windowMs: 450, note: '여름 장맛비 내리는 한밤, 선착장 밑 그림자가 움직여요.' },
  { id: 'icecod', name: '겨울 왕대구', emoji: '', spots: ['rocks'], seasons: [], time: 'any', sky: 'any', weight: 1, sell: 7_000, cm: [90, 140], windowMs: 450, note: '겨울 새벽 갯바위에만 들른다는 커다란 대구.' },
];
/**
 * 2026-10-02 어종 확장: 36 more rod fish (16 common, 11 uncommon, 6 rare,
 * 3 legends). Legends keep `seasons: []` like EXTRA_FISH; FISH_PROFILE holds
 * their real season, hours and gates. Painted icons: fishing/generation-2.json.
 */
const WARM3: readonly Season[] = ['spring', 'summer', 'autumn'];
export const MORE_FISH: readonly FishDef[] = [
  // Common
  { id: 'hwangeo', name: '황어', emoji: '', spots: ['river', 'rapids'], seasons: ['spring'], time: 'any', sky: 'any', weight: 35, sell: 200, cm: [20, 45], windowMs: 950, note: '봄이면 몸에 붉은 띠를 두르고 강을 거슬러 올라와요.' },
  { id: 'galgyeoni', name: '갈겨니', emoji: '', spots: ['rapids', 'bridge'], seasons: ALL, time: 'day', sky: 'any', weight: 45, sell: 80, cm: [8, 18], windowMs: 1_100, note: '피라미 사촌. 눈 위가 빨개요.' },
  { id: 'chambungeo', name: '참붕어', emoji: '', spots: ['pond'], seasons: WARM3, time: 'any', sky: 'any', weight: 45, sell: 70, cm: [5, 10], windowMs: 1_100, note: '연못가 수초 사이를 쪼르르 헤엄쳐요.' },
  { id: 'moraemuji', name: '모래무지', emoji: '', spots: ['river', 'bridge'], seasons: WARM3, time: 'day', sky: 'any', weight: 35, sell: 150, cm: [10, 20], windowMs: 1_000, note: '모래 속에 쏙 숨었다가 눈만 내밀어요.' },
  { id: 'dongsari', name: '동사리', emoji: '', spots: ['river'], seasons: ALL, time: 'night', sky: 'any', weight: 30, sell: 180, cm: [10, 20], windowMs: 950, note: '밤이면 돌 밑에서 나와 느릿느릿 사냥해요.' },
  { id: 'hyangeo', name: '향어', emoji: '', spots: ['lake'], seasons: WARM3, time: 'any', sky: 'any', weight: 35, sell: 300, cm: [30, 60], windowMs: 900, note: '잉어를 닮았지만 비늘이 듬성듬성해요.' },
  { id: 'halfbeak', name: '학공치', emoji: '', spots: ['harbor', 'sea'], seasons: ['autumn', 'winter'], time: 'day', sky: 'any', weight: 40, sell: 180, cm: [20, 40], windowMs: 1_000, note: '뾰족한 아래턱이 학의 부리를 닮았어요.' },
  { id: 'sardine', name: '정어리', emoji: '', spots: ['sea'], seasons: ['summer', 'autumn'], time: 'any', sky: 'any', weight: 55, sell: 90, cm: [12, 22], windowMs: 1_100, note: '반짝이는 은빛 떼가 한꺼번에 몰려와요.' },
  { id: 'anchovy', name: '멸치', emoji: '', spots: ['sea', 'harbor'], seasons: ALL, time: 'any', sky: 'any', weight: 60, sell: 40, cm: [6, 14], windowMs: 1_200, note: '작아도 국물 맛은 바다에서 제일.' },
  { id: 'scorpionfish', name: '쏨뱅이', emoji: '', spots: ['rocks'], seasons: ALL, time: 'night', sky: 'any', weight: 35, sell: 250, cm: [15, 30], windowMs: 950, note: '지느러미 가시가 뾰족하니 조심해서 잡아요.' },
  { id: 'jjukkumi', name: '주꾸미', emoji: '', spots: ['harbor'], seasons: ['spring'], time: 'any', sky: 'any', weight: 35, sell: 280, cm: [10, 25], windowMs: 950, note: '봄 주꾸미는 머리에 알이 꽉 찼어요.' },
  { id: 'cod', name: '대구', emoji: '', spots: ['sea'], seasons: ['winter'], time: 'any', sky: 'any', weight: 30, sell: 420, cm: [40, 80], windowMs: 900, note: '입이 커서 대구래요. 겨울 탕거리 일등.' },
  { id: 'atka', name: '임연수어', emoji: '', spots: ['sea', 'rocks'], seasons: ['winter', 'spring'], time: 'any', sky: 'any', weight: 35, sell: 240, cm: [25, 45], windowMs: 950, note: '껍질이 고소해서 구이로 인기 만점이에요.' },
  { id: 'flatfish', name: '가자미', emoji: '', spots: ['sea'], seasons: ALL, time: 'day', sky: 'any', weight: 35, sell: 280, cm: [20, 40], windowMs: 950, note: '눈이 한쪽으로 몰린 모래밭 납작이.' },
  { id: 'sillago', name: '보리멸', emoji: '', spots: ['sea'], seasons: ['summer'], time: 'day', sky: 'dry', weight: 40, sell: 200, cm: [15, 30], windowMs: 1_000, note: '모래사장 가까이 오는 날씬한 여름 물고기.' },
  { id: 'saury', name: '꽁치', emoji: '', spots: ['sea', 'harbor'], seasons: ['autumn'], time: 'night', sky: 'any', weight: 45, sell: 160, cm: [25, 35], windowMs: 1_000, note: '가을밤 불빛에 모여드는 길쭉한 은빛 물고기.' },
  // Uncommon
  { id: 'bitterling', name: '각시붕어', emoji: '', spots: ['pond'], seasons: ['spring', 'summer'], time: 'day', sky: 'dry', weight: 15, sell: 380, cm: [4, 8], windowMs: 900, note: '봄이면 무지갯빛 혼인색으로 반짝여요.' },
  { id: 'tunggari', name: '퉁가리', emoji: '', spots: ['rapids'], seasons: WARM3, time: 'night', sky: 'any', weight: 15, sell: 360, cm: [8, 14], windowMs: 850, note: '가슴지느러미 가시에 쏘이면 따끔해요.' },
  { id: 'sculpin', name: '둑중개', emoji: '', spots: ['falls'], seasons: ['winter', 'spring'], time: 'any', sky: 'any', weight: 14, sell: 400, cm: [10, 16], windowMs: 850, note: '찬 폭포 소 바닥의 얼룩무늬 숨바꼭질 선수.' },
  { id: 'paradise', name: '버들붕어', emoji: '', spots: ['pond'], seasons: ['summer'], time: 'day', sky: 'any', weight: 15, sell: 380, cm: [5, 9], windowMs: 850, note: '지느러미가 비단처럼 길게 늘어져요.' },
  { id: 'swampeel', name: '드렁허리', emoji: '', spots: ['pond', 'river'], seasons: ['summer'], time: 'night', sky: 'rain', weight: 14, sell: 450, cm: [30, 60], windowMs: 800, note: '논두렁에 구멍을 뚫고 사는 뱀 같은 물고기.' },
  { id: 'salmon', name: '연어', emoji: '', spots: ['river', 'bridge'], seasons: ['autumn'], time: 'any', sky: 'any', weight: 16, sell: 700, cm: [50, 80], windowMs: 800, note: '가을이면 태어난 강으로 돌아와요.' },
  { id: 'spanish', name: '삼치', emoji: '', spots: ['sea'], seasons: ['autumn', 'winter'], time: 'any', sky: 'any', weight: 16, sell: 650, cm: [50, 90], windowMs: 800, note: '빠르게 내달리는 등 푸른 생선.' },
  { id: 'opaleye', name: '벵에돔', emoji: '', spots: ['rocks'], seasons: ['summer', 'autumn'], time: 'day', sky: 'any', weight: 14, sell: 700, cm: [20, 40], windowMs: 750, note: '파도 거품 아래 숨어 미끼만 똑 따 먹어요.' },
  { id: 'cuttlefish', name: '갑오징어', emoji: '', spots: ['sea', 'harbor'], seasons: ['spring'], time: 'any', sky: 'any', weight: 16, sell: 500, cm: [15, 30], windowMs: 850, note: '등에 단단한 뼈가 있는 통통한 오징어.' },
  { id: 'monkfish', name: '아귀', emoji: '', spots: ['sea'], seasons: ['winter'], time: 'night', sky: 'any', weight: 13, sell: 620, cm: [40, 90], windowMs: 750, note: '머리 위 낚싯대로 물고기를 꾀어요.' },
  { id: 'skate', name: '홍어', emoji: '', spots: ['sea'], seasons: ['winter', 'spring'], time: 'any', sky: 'any', weight: 12, sell: 720, cm: [50, 100], windowMs: 750, note: '넓은 지느러미로 바닥을 날듯이 헤엄쳐요.' },
  // Rare
  { id: 'stickleback', name: '큰가시고기', emoji: '', spots: ['river'], seasons: ['spring'], time: 'day', sky: 'dry', weight: 7, sell: 1_100, cm: [6, 10], windowMs: 600, note: '아빠 물고기가 수초로 집을 짓고 알을 지켜요.' },
  { id: 'sturgeon', name: '철갑상어', emoji: '', spots: ['lake'], seasons: ['autumn', 'winter'], time: 'any', sky: 'any', weight: 5, sell: 1_800, cm: [80, 150], windowMs: 600, note: '공룡 시대부터 살아온 갑옷 입은 물고기.' },
  { id: 'goldmandarin', name: '황쏘가리', emoji: '', spots: ['river', 'bridge'], seasons: ['summer'], time: 'night', sky: 'dry', weight: 5, sell: 1_700, cm: [25, 50], windowMs: 600, note: '온몸이 황금빛인 귀한 쏘가리.' },
  { id: 'beakperch', name: '돌돔', emoji: '', spots: ['rocks'], seasons: ['summer', 'autumn'], time: 'day', sky: 'any', weight: 6, sell: 1_600, cm: [30, 60], windowMs: 600, note: '줄무늬 갯바위 왕. 이빨로 소라도 깨 먹어요.' },
  { id: 'tuna', name: '참다랑어', emoji: '', spots: ['sea'], seasons: ['summer', 'autumn'], time: 'day', sky: 'dry', weight: 4, sell: 2_000, cm: [100, 200], windowMs: 550, note: '바다의 고속열차. 손맛이 어마어마해요.' },
  { id: 'sunfish', name: '개복치', emoji: '', spots: ['sea'], seasons: ['summer'], time: 'day', sky: 'dry', weight: 4, sell: 1_700, cm: [100, 250], windowMs: 600, note: '수면 위에 둥둥 누워 햇볕을 쬐어요.' },
  // Legends
  { id: 'eldercat', name: '천년 메기', emoji: '', spots: ['pond'], seasons: [], time: 'night', sky: 'rain', weight: 1, sell: 7_000, cm: [150, 250], windowMs: 450, note: '가을비 내리는 밤, 연못 바닥이 통째로 움직인대요.' },
  { id: 'prismayu', name: '무지개 은어', emoji: '', spots: ['rapids'], seasons: [], time: 'day', sky: 'dry', weight: 1, sell: 6_500, cm: [30, 45], windowMs: 450, note: '한여름 정오 햇살 아래 일곱 빛깔로 번쩍인다는 은어.' },
  { id: 'startuna', name: '별바다 다랑어', emoji: '', spots: ['pier'], seasons: [], time: 'night', sky: 'dry', weight: 1, sell: 8_000, cm: [200, 300], windowMs: 450, note: '겨울 밤하늘 별이 바다에 비치는 새벽, 큰 선착장 끝에 나타난대요.' },
];
/** Crab-pot catches: museum and cooking items with no rod spot. */
export const POT_FISH: readonly FishDef[] = [
  { id: 'snail', name: '다슬기', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 40, sell: 60, cm: [2, 4], windowMs: 1_000, note: '맑은 물 돌바닥에 붙어 살아요. 통발로 건져요.' },
  { id: 'shrimp', name: '민물새우', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 30, sell: 90, cm: [3, 6], windowMs: 1_000, note: '톡톡 튀는 새뱅이. 통발로 건져요.' },
  { id: 'crab', name: '꽃게', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 15, sell: 450, cm: [12, 22], windowMs: 1_000, note: '집게를 들고 통발 안에서 버텨요.' },
  { id: 'clam', name: '바지락', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 40, sell: 120, cm: [3, 6], windowMs: 1_000, note: '칼국수에 넣으면 국물이 시원해요.' },
  { id: 'oyster', name: '굴', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 25, sell: 260, cm: [6, 12], windowMs: 1_000, note: '바위에 붙어 자라는 바다의 우유.' },
  { id: 'conch', name: '소라', emoji: '', spots: [], seasons: ALL, time: 'any', sky: 'any', weight: 20, sell: 320, cm: [7, 14], windowMs: 1_000, note: '귀에 대면 파도 소리가 들린대요.' },
];
export const POT_FRESH = ['snail', 'shrimp', 'crayfish'] as const;
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
};
/** Every rod fish; missing ids fall back to profileOf's rarity default. */
export const FISH_PROFILE: Readonly<Record<string, FishProfile>> = {
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
  hwangeo: { behaviour: 'dart', difficulty: 28 },
  galgyeoni: { behaviour: 'dart', difficulty: 14 },
  chambungeo: { behaviour: 'calm', difficulty: 12 },
  moraemuji: { behaviour: 'sink', difficulty: 20 },
  dongsari: { behaviour: 'sink', difficulty: 24 },
  hyangeo: { behaviour: 'calm', difficulty: 28 },
  halfbeak: { behaviour: 'dart', difficulty: 20 },
  sardine: { behaviour: 'dart', difficulty: 12 },
  anchovy: { behaviour: 'dart', difficulty: 10 },
  scorpionfish: { behaviour: 'sink', difficulty: 30 },
  jjukkumi: { behaviour: 'sink', difficulty: 26 },
  cod: { behaviour: 'sink', difficulty: 34 },
  atka: { behaviour: 'calm', difficulty: 22 },
  flatfish: { behaviour: 'sink', difficulty: 26 },
  sillago: { behaviour: 'dart', difficulty: 18 },
  saury: { behaviour: 'dart', difficulty: 16, hours: [18, 4] },
  bitterling: { behaviour: 'float', difficulty: 36 },
  tunggari: { behaviour: 'sink', difficulty: 40 },
  sculpin: { behaviour: 'sink', difficulty: 42 },
  paradise: { behaviour: 'float', difficulty: 38 },
  swampeel: { behaviour: 'mixed', difficulty: 46 },
  salmon: { behaviour: 'dart', difficulty: 50 },
  spanish: { behaviour: 'dart', difficulty: 48 },
  opaleye: { behaviour: 'mixed', difficulty: 52 },
  cuttlefish: { behaviour: 'float', difficulty: 40 },
  monkfish: { behaviour: 'sink', difficulty: 48 },
  skate: { behaviour: 'float', difficulty: 50 },
  stickleback: { behaviour: 'dart', difficulty: 58 },
  sturgeon: { behaviour: 'sink', difficulty: 72 },
  goldmandarin: { behaviour: 'sink', difficulty: 68, hours: [20, 2] },
  beakperch: { behaviour: 'mixed', difficulty: 70 },
  tuna: { behaviour: 'dart', difficulty: 78, hours: [6, 12] },
  sunfish: { behaviour: 'float', difficulty: 62, hours: [10, 16] },
  eldercat: { behaviour: 'sink', difficulty: 90, hours: [21, 3], season: 'autumn', legend: { level: 6, rod: 2 } },
  prismayu: { behaviour: 'dart', difficulty: 86, hours: [11, 14], season: 'summer', legend: { level: 5, rod: 2 } },
  startuna: { behaviour: 'dart', difficulty: 94, hours: [3, 6], season: 'winter', legend: { level: 8, rod: 4 } },
  blossomtrout: { behaviour: 'dart', difficulty: 80, hours: [6, 10], season: 'spring', legend: { level: 5, rod: 3 } },
  lakelord: { behaviour: 'sink', difficulty: 92, hours: [22, 3], season: 'summer', legend: { level: 7, rod: 3 } },
  icecod: { behaviour: 'mixed', difficulty: 88, hours: [5, 8], season: 'winter', legend: { level: 6, rod: 2 } },
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
/** Seafood dishes (sell = ingredients × 1.25 + 100, like lounge-items DISHES). */
const round10 = (n: number) => Math.round(n / 10) * 10;
const dishOf = (id: string, name: string, needs: RecipeDef['needs'], value: number, note: string, buff?: DishDef['buff']): DishDef => ({
  id,
  name,
  emoji: '',
  needs,
  makes: id,
  count: 1,
  note,
  sell: round10(value * 1.25 + 100),
  ...(buff ? { buff } : {}),
});
export const FISH_DISHES: readonly DishDef[] = [
  dishOf('sashimi', '모둠 회', [{ cat: 'fish', n: 2 }], 600, '갓 잡은 물고기를 얇게 떴어요.', 'luck'),
  dishOf('haemuljeon', '해물파전', [{ item: 'clam', n: 2 }, { item: 'potato', n: 1 }], 1_140, '바지락을 듬뿍 넣은 비 오는 날의 전.'),
  dishOf('guljeon', '굴전', [{ item: 'oyster', n: 2 }, { item: 'potato', n: 1 }], 1_420, '달걀옷을 입혀 노릇하게.'),
  dishOf('kkotgetang', '꽃게탕', [{ item: 'crab', n: 1 }, { item: 'potato', n: 1 }, { cat: 'fish', n: 1 }], 1_650, '빨간 국물에 게살이 가득.', 'luck'),
  dishOf('daseulgiguk', '다슬기국', [{ item: 'snail', n: 3 }, { item: 'carrot', n: 1 }], 380, '맑고 파란 국물. 속이 편해져요.'),
];
