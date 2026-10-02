// 민물 어종 확장 (handover/design/design-fresh-fish.md): 30 freshwater
// species and two legends for the existing river, pond, rapids, falls, lake
// and bridge spots, their fight profiles, a few rod/bait conditions, icon
// looks, body builds and four freshwater dishes. Pure data: lounge-items.ts
// spreads FRESH_FISH into its catalog and lounge-fish-data.ts spreads
// FRESH_PROFILE and FRESH_DISHES, so this module imports types only.
//
// Prices are already on the raised scale (old fish ×1.5, legends ×1.3); a
// later blanket price multiplier over FISH should skip FRESH_FISH_IDS.
import type { DishDef, FishDef, RecipeDef } from './lounge-items.ts';
import type { BaitId, FishProfile } from './lounge-fish-data.ts';
import type { Season } from './lounge-calendar.ts';

const ALL: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];
const WARM: readonly Season[] = ['spring', 'summer', 'autumn'];

// ---------------------------------------------------------------- species
/**
 * New freshwater rod fish. The two legends keep `seasons: []` like the other
 * new-flow legends, so the legacy cast never picks them; their real season
 * lives in FRESH_PROFILE.
 */
export const FRESH_FISH: readonly FishDef[] = [
  // 강
  { id: 'moraemuji', name: '모래무지', emoji: '', spots: ['river', 'bridge'], seasons: ALL, time: 'day', sky: 'any', weight: 20, sell: 300, cm: [10, 25], windowMs: 1_000, note: '모래 속에 쏙 숨어서 눈만 빼꼼. 겨울에도 모래 이불을 덮고 버텨요.' },
  { id: 'ureo', name: '웅어', emoji: '', spots: ['river'], seasons: ['spring'], time: 'any', sky: 'any', weight: 14, sell: 1_100, cm: [20, 32], windowMs: 800, note: '봄이면 강을 거슬러 오는 은빛 칼날. 임금님 밥상에 올랐대요.' },
  { id: 'hwangeo', name: '황어', emoji: '', spots: ['river', 'rapids'], seasons: ['spring'], time: 'any', sky: 'rain', weight: 18, sell: 780, cm: [25, 45], windowMs: 850, note: '봄비가 오면 주황 띠를 두르고 떼로 올라와요.' },
  { id: 'lamprey', name: '칠성장어', emoji: '', spots: ['river'], seasons: ['winter', 'spring'], time: 'night', sky: 'any', weight: 7, sell: 2_400, cm: [40, 60], windowMs: 650, note: '눈 옆에 구멍이 일곱 개라 칠성. 턱이 없고 빨판으로 매달려요.' },
  { id: 'swampeel', name: '드렁허리', emoji: '', spots: ['pond', 'river'], seasons: ['summer'], time: 'night', sky: 'rain', weight: 15, sell: 900, cm: [25, 60], windowMs: 800, note: '논두렁에 구멍을 뚫어 농부를 울린다는 장어 닮은 물고기.' },
  { id: 'dongsari', name: '동사리', emoji: '', spots: ['river', 'bridge'], seasons: WARM, time: 'night', sky: 'any', weight: 20, sell: 360, cm: [8, 18], windowMs: 950, note: '멍하니 있다가 지나가는 건 뭐든 덥석. 별명은 구구리.' },
  // 연못
  { id: 'ddeokbungeo', name: '떡붕어', emoji: '', spots: ['pond', 'lake'], seasons: ALL, time: 'any', sky: 'any', weight: 20, sell: 240, cm: [15, 40], windowMs: 1_050, note: '붕어인 척하지만 등이 더 높아요. 떡밥 앞에서는 순둥이.' },
  { id: 'gaksibungeo', name: '각시붕어', emoji: '', spots: ['pond'], seasons: ['spring', 'summer'], time: 'day', sky: 'dry', weight: 20, sell: 300, cm: [3, 6], windowMs: 1_100, note: '혼인색이 무지갯빛. 조개 속에 몰래 알을 낳아요.' },
  { id: 'napjaru', name: '납자루', emoji: '', spots: ['pond', 'river'], seasons: WARM, time: 'day', sky: 'any', weight: 20, sell: 210, cm: [5, 10], windowMs: 1_100, note: '납작한 몸에 반짝이는 비늘. 연잎 그늘을 좋아해요.' },
  { id: 'hyangeo', name: '향어', emoji: '', spots: ['pond', 'lake'], seasons: WARM, time: 'any', sky: 'any', weight: 16, sell: 1_000, cm: [40, 80], windowMs: 850, note: '비늘 없는 잉어. 떡밥 냄새가 아니면 거들떠보지도 않아요.' },
  { id: 'gasigogi', name: '가시고기', emoji: '', spots: ['pond'], seasons: ['spring'], time: 'any', sky: 'any', weight: 20, sell: 330, cm: [4, 7], windowMs: 1_050, note: '새끼가 깨어날 때까지 아빠가 굶으며 둥지를 지켜요.' },
  // 윗물 여울
  { id: 'galgyeoni', name: '갈겨니', emoji: '', spots: ['rapids', 'river'], seasons: WARM, time: 'day', sky: 'any', weight: 20, sell: 140, cm: [8, 18], windowMs: 1_150, note: '피라미 사촌. 눈이 더 크고 옆구리에 검은 띠가 있어요.' },
  { id: 'dolgogi', name: '돌고기', emoji: '', spots: ['rapids'], seasons: ALL, time: 'day', sky: 'any', weight: 20, sell: 240, cm: [8, 15], windowMs: 1_050, note: '주둥이가 뭉툭해서 돌돼지라고도 불려요.' },
  { id: 'eoreumchi', name: '어름치', emoji: '', spots: ['rapids'], seasons: ['spring', 'summer'], time: 'day', sky: 'dry', weight: 4, sell: 2_800, cm: [20, 40], windowMs: 600, note: '알 위에 자갈탑을 쌓는 귀한 물고기. 센 물살 속에서 버텨요.' },
  { id: 'jagasari', name: '자가사리', emoji: '', spots: ['rapids'], seasons: WARM, time: 'night', sky: 'any', weight: 20, sell: 480, cm: [7, 13], windowMs: 950, note: '가슴지느러미 가시에 쏘이면 따끔! 밤 여울의 꼬마 메기.' },
  { id: 'kkuguri', name: '꾸구리', emoji: '', spots: ['rapids'], seasons: ALL, time: 'day', sky: 'any', weight: 8, sell: 2_100, cm: [6, 13], windowMs: 650, note: '눈꺼풀이 있어서 밝으면 눈을 감아요. 그래서 새벽에만 물어요.' },
  // 폭포 소
  { id: 'beodeulgae', name: '버들개', emoji: '', spots: ['falls'], seasons: ['winter', 'spring'], time: 'any', sky: 'any', weight: 20, sell: 210, cm: [8, 14], windowMs: 1_100, note: '버들치 사촌. 더 차가운 물을 좋아해요.' },
  { id: 'yeonjunmochi', name: '연준모치', emoji: '', spots: ['falls'], seasons: ['winter'], time: 'day', sky: 'any', weight: 20, sell: 600, cm: [5, 10], windowMs: 900, note: '얼음장 같은 물에서만 사는 작은 은빛 물고기.' },
  { id: 'songeo', name: '송어', emoji: '', spots: ['falls'], seasons: ['autumn'], time: 'any', sky: 'any', weight: 14, sell: 1_200, cm: [40, 65], windowMs: 800, note: '바다에서 살찌워 돌아온 산천어. 힘이 장사라 튼튼한 낚싯대가 필요해요.' },
  { id: 'dukjunggae', name: '둑중개', emoji: '', spots: ['falls'], seasons: ['winter'], time: 'any', sky: 'any', weight: 18, sell: 720, cm: [8, 15], windowMs: 900, note: '바위에 납작 엎드린 찬물 지킴이.' },
  { id: 'miyugi', name: '미유기', emoji: '', spots: ['falls'], seasons: WARM, time: 'night', sky: 'any', weight: 12, sell: 1_050, cm: [15, 25], windowMs: 800, note: '계곡의 산메기. 반딧불 빛을 따라 바위 밑에서 나와요.' },
  { id: 'tunggari', name: '퉁가리', emoji: '', spots: ['falls'], seasons: ['summer', 'autumn'], time: 'night', sky: 'rain', weight: 16, sell: 780, cm: [7, 12], windowMs: 900, note: '비 오는 밤 폭포 소에서 퉁퉁 소리를 낸대요.' },
  // 호숫가 선착장
  { id: 'sturgeon', name: '철갑상어', emoji: '', spots: ['lake'], seasons: ['autumn', 'winter'], time: 'any', sky: 'any', weight: 4, sell: 3_600, cm: [80, 180], windowMs: 600, note: '공룡 시대부터 갑옷을 입고 살아온 호수의 대물.' },
  { id: 'nunbulgae', name: '눈불개', emoji: '', spots: ['lake'], seasons: ['summer'], time: 'day', sky: 'any', weight: 20, sell: 480, cm: [20, 40], windowMs: 950, note: '눈 위가 빨개서 눈불개. 물 위 날파리를 노려요.' },
  { id: 'keungasigogi', name: '큰가시고기', emoji: '', spots: ['lake'], seasons: ['spring'], time: 'any', sky: 'any', weight: 20, sell: 420, cm: [6, 10], windowMs: 1_000, note: '봄이면 아빠 물고기가 배를 빨갛게 물들이고 둥지를 지어요.' },
  { id: 'salchi', name: '살치', emoji: '', spots: ['lake', 'bridge'], seasons: WARM, time: 'any', sky: 'any', weight: 20, sell: 200, cm: [12, 25], windowMs: 1_050, note: '칼처럼 납작한 몸으로 수면 바로 아래를 휙휙.' },
  { id: 'baekjoeo', name: '백조어', emoji: '', spots: ['lake'], seasons: ['autumn', 'winter'], time: 'day', sky: 'any', weight: 12, sell: 1_000, cm: [20, 40], windowMs: 800, note: '목덜미가 백조처럼 휘었대요. 맑은 날 선착장 끝에 와요.' },
  // 다리 위
  { id: 'chammaja', name: '참마자', emoji: '', spots: ['bridge', 'river'], seasons: WARM, time: 'day', sky: 'any', weight: 20, sell: 270, cm: [12, 22], windowMs: 1_000, note: '옆구리에 까만 점이 줄지어 있는 모래톱의 단골.' },
  { id: 'daenong', name: '대농갱이', emoji: '', spots: ['bridge'], seasons: ['summer', 'autumn'], time: 'night', sky: 'any', weight: 14, sell: 1_050, cm: [20, 35], windowMs: 850, note: '동자개의 큰형님. 낚아 올리면 더 크게 빠각빠각.' },
  { id: 'hwangssogari', name: '황쏘가리', emoji: '', spots: ['bridge', 'river'], seasons: ['summer', 'autumn'], time: 'night', sky: 'dry', weight: 3, sell: 3_800, cm: [25, 50], windowMs: 550, note: '쏘가리의 황금빛 변이. 만나면 그날은 운수 대통.' },
  // 전설
  { id: 'baekdutrout', name: '백두 산천어', emoji: '', spots: ['rapids'], seasons: [], time: 'day', sky: 'dry', weight: 1, sell: 9_000, cm: [50, 85], windowMs: 450, note: '가을 안개가 여울을 덮는 새벽, 붉은 띠를 두른 산천어의 왕이 거슬러 올라요.' },
  { id: 'millcatfish', name: '천년 메기', emoji: '', spots: ['bridge'], seasons: [], time: 'night', sky: 'rain', weight: 1, sell: 10_000, cm: [150, 240], windowMs: 450, note: '장맛비 쏟아지는 한밤, 다리 밑에서 천 년 묵은 수염이 출렁여요.' },
];
export const FRESH_FISH_IDS: ReadonlySet<string> = new Set(FRESH_FISH.map((f) => f.id));

// ---------------------------------------------------------------- fight profiles
export const FRESH_PROFILE: Readonly<Record<string, FishProfile>> = {
  moraemuji: { behaviour: 'sink', difficulty: 22 },
  ureo: { behaviour: 'dart', difficulty: 46, hours: [4, 10] },
  hwangeo: { behaviour: 'dart', difficulty: 40 },
  lamprey: { behaviour: 'mixed', difficulty: 62, hours: [22, 5] },
  swampeel: { behaviour: 'mixed', difficulty: 48 },
  dongsari: { behaviour: 'sink', difficulty: 24 },
  ddeokbungeo: { behaviour: 'calm', difficulty: 18 },
  gaksibungeo: { behaviour: 'float', difficulty: 16 },
  napjaru: { behaviour: 'float', difficulty: 14 },
  hyangeo: { behaviour: 'calm', difficulty: 44 },
  gasigogi: { behaviour: 'dart', difficulty: 18 },
  galgyeoni: { behaviour: 'dart', difficulty: 18 },
  dolgogi: { behaviour: 'calm', difficulty: 20 },
  eoreumchi: { behaviour: 'mixed', difficulty: 70, hours: [7, 16] },
  jagasari: { behaviour: 'sink', difficulty: 30 },
  kkuguri: { behaviour: 'sink', difficulty: 60, hours: [5, 9] },
  beodeulgae: { behaviour: 'calm', difficulty: 16 },
  yeonjunmochi: { behaviour: 'dart', difficulty: 34 },
  songeo: { behaviour: 'dart', difficulty: 52 },
  dukjunggae: { behaviour: 'sink', difficulty: 32 },
  miyugi: { behaviour: 'sink', difficulty: 46, hours: [20, 4] },
  tunggari: { behaviour: 'sink', difficulty: 36 },
  sturgeon: { behaviour: 'sink', difficulty: 76 },
  nunbulgae: { behaviour: 'float', difficulty: 30, hours: [6, 13] },
  keungasigogi: { behaviour: 'dart', difficulty: 26 },
  salchi: { behaviour: 'dart', difficulty: 20 },
  baekjoeo: { behaviour: 'dart', difficulty: 42 },
  chammaja: { behaviour: 'calm', difficulty: 22 },
  daenong: { behaviour: 'sink', difficulty: 44 },
  hwangssogari: { behaviour: 'mixed', difficulty: 78, hours: [19, 1] },
  baekdutrout: { behaviour: 'dart', difficulty: 86, hours: [5, 8], season: 'autumn', legend: { level: 6, rod: 3 } },
  millcatfish: { behaviour: 'sink', difficulty: 94, hours: [0, 4], season: 'summer', legend: { level: 8, rod: 3 } },
};

// ---------------------------------------------------------------- rod and bait conditions
/** Extra conditions on a few fish: a minimum rod tier and/or one bait on the hook. */
export type FishGate = { rod?: number; bait?: BaitId };
export const FISH_GATE: Readonly<Record<string, FishGate>> = {
  eoreumchi: { rod: 2 },
  songeo: { rod: 3 },
  sturgeon: { rod: 3 },
  hwangssogari: { rod: 3 },
  hyangeo: { bait: 'bait-dough' },
  miyugi: { bait: 'bait-glow' },
};
/**
 * Whether a fish's gate lets this cast through. `rod` undefined lets any rod
 * through; `bait` undefined skips the bait check (the spot card shows what
 * could bite), null means a cast with no bait.
 */
export function fishGateOk(id: string, rod?: number, bait?: BaitId | null) {
  const g = FISH_GATE[id];
  if (!g) return true;
  if (g.rod && rod !== undefined && rod < g.rod) return false;
  if (g.bait && bait !== undefined && bait !== g.bait) return false;
  return true;
}
const BAIT_NAME: Record<BaitId, string> = { bait: '미끼를', 'bait-dough': '떡밥을', 'bait-shrimp': '새우 미끼를', 'bait-glow': '반딧불 미끼를' };
/** One line for the fishing book. */
export function gateText(g: FishGate) {
  return [g.rod ? `낚싯대 ${g.rod}단 이상` : '', g.bait ? `${BAIT_NAME[g.bait]} 달아야 물어요` : ''].filter(Boolean).join(' · ');
}

// ---------------------------------------------------------------- body builds
/** Body builds for the grams on catch cards (lounge-fish-engine BUILD; long fish are light). */
export const FRESH_BUILD: Readonly<Record<string, number>> = {
  lamprey: 0.3,
  swampeel: 0.3,
  sturgeon: 0.75,
  millcatfish: 0.8,
  gaksibungeo: 1.3,
  napjaru: 1.25,
  salchi: 0.8,
};

// ---------------------------------------------------------------- dishes
/** Freshwater dishes (sell = ingredients × 1.25 + 100, like lounge-items DISHES). */
const round10 = (n: number) => Math.round(n / 10) * 10;
const SELL = Object.fromEntries(FRESH_FISH.map((f) => [f.id, f.sell]));
// Crop sell prices (lounge-items CROP_SELL_REF; a test pins them equal).
export const FRESH_DISH_CROPS: Readonly<Record<string, number>> = { carrot: 200, potato: 900 };
const valueOf = (needs: RecipeDef['needs']) =>
  needs.reduce((s, n) => s + ('item' in n ? (SELL[n.item] ?? FRESH_DISH_CROPS[n.item] ?? 0) * n.n : 0), 0);
const dishOf = (id: string, name: string, needs: RecipeDef['needs'], note: string, buff: NonNullable<DishDef['buff']>): DishDef => ({
  id,
  name,
  emoji: '',
  needs,
  makes: id,
  count: 1,
  note,
  sell: round10(valueOf(needs) * 1.25 + 100),
  buff,
});
export const FRESH_DISHES: readonly DishDef[] = [
  dishOf('doribaengbaeng', '도리뱅뱅이', [{ item: 'galgyeoni', n: 4 }, { item: 'carrot', n: 1 }], '작은 물고기를 동그랗게 둘러 바삭하게 튀기고 양념을 발랐어요.', 'luck'),
  dishOf('eojuk', '어죽', [{ item: 'dongsari', n: 2 }, { item: 'carrot', n: 1 }], '민물고기를 푹 고아 쌀을 넣고 끓인 걸쭉한 죽.', 'learn'),
  dishOf('songeohoe', '송어회', [{ item: 'songeo', n: 1 }, { item: 'carrot', n: 1 }], '주황빛 송어 살을 채소와 콩가루에 버무려요.', 'charm'),
  dishOf('bungeojjim', '떡붕어찜', [{ item: 'ddeokbungeo', n: 2 }, { item: 'potato', n: 1 }], '감자를 깔고 매콤하게 졸인 붕어찜.', 'mine'),
];
