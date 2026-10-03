// 먼바다 낚싯배 · 바다 어종 대량 추가 (handover/design/design-sea-fishing.md):
// 13 new near-shore sea fish (바다 데크·갯바위·밤 항구, so also 방파제 and 큰
// 선착장), 33 offshore fish caught only from the boat (spot 'offshore'), two
// fish of the captain's dawn sailing and three offshore legends. Pure data in
// its own module so the shared catalogs only spread it (lounge-items.ts adds
// SEA_FISH, lounge-fish-data.ts adds SEA_PROFILE and SEA_DISHES).
//
// Prices are on the post-2026-10 fish price scale (기존 ×1.5, 전설 ×1.3:
// claude/fish-prices); the older species keep their own numbers here.
import type { DishDef, FishDef, RecipeDef } from './lounge-items.ts';
import type { Season } from './lounge-calendar.ts';
import type { FishProfile } from './lounge-fish-data.ts';

const ALL: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];
type Row = Omit<FishDef, 'emoji'>;
const fish = (r: Row): FishDef => ({ ...r, emoji: '' });

// ---------------------------------------------------------------- near shore
/** 항구·방파제·갯바위·바다 데크 (the breakwater and big pier get them through lounge-items FISH). */
export const SHORE_FISH: readonly FishDef[] = [
  fish({ id: 'halfbeak', name: '학꽁치', spots: ['sea', 'harbor'], seasons: ['spring', 'autumn'], time: 'day', sky: 'any', weight: 40, sell: 330, cm: [20, 40], windowMs: 1_000, note: '부리가 길쭉한 은빛 젓가락. 회로 뜨면 속이 다 비쳐요.' }),
  fish({ id: 'goby', name: '망둥어', spots: ['rocks', 'harbor'], seasons: ['summer', 'autumn'], time: 'any', sky: 'any', weight: 45, sell: 180, cm: [10, 25], windowMs: 1_100, note: '망둥어가 뛰니 꼴뚜기도 뛴다는, 바로 그 망둥어.' }),
  fish({ id: 'beka', name: '꼴뚜기', spots: ['harbor'], seasons: ['spring'], time: 'night', sky: 'any', weight: 35, sell: 360, cm: [6, 15], windowMs: 950, note: '어물전 망신은 시키지 않겠다고 약속했어요.' }),
  fish({ id: 'webfoot', name: '주꾸미', spots: ['sea', 'rocks'], seasons: ['spring', 'autumn'], time: 'any', sky: 'any', weight: 28, sell: 520, cm: [10, 25], windowMs: 900, note: '알 밴 봄 주꾸미는 머리에 밥알이 꽉 찼대요.' }),
  fish({ id: 'whiting', name: '보리멸', spots: ['sea'], seasons: ['summer'], time: 'day', sky: 'dry', weight: 32, sell: 420, cm: [15, 30], windowMs: 900, note: '모래밭을 스치는 날씬한 은빛. 튀김옷이 제일 잘 어울려요.' }),
  fish({ id: 'gurnard', name: '성대', spots: ['sea'], seasons: ['winter', 'spring'], time: 'day', sky: 'any', weight: 18, sell: 900, cm: [20, 40], windowMs: 850, note: '물 밖에서 꾸욱꾸욱 울어요. 파란 가슴지느러미가 날개 같아요.' }),
  fish({ id: 'lionfish', name: '쏠배감펭', spots: ['rocks'], seasons: ['summer'], time: 'any', sky: 'any', weight: 8, sell: 1_800, cm: [15, 35], windowMs: 650, note: '화려한 갈기는 전부 독가시. 맨손 악수는 사양할게요.' }),
  fish({ id: 'opaleye', name: '벵에돔', spots: ['rocks'], seasons: ['summer', 'autumn'], time: 'day', sky: 'any', weight: 12, sell: 1_500, cm: [20, 45], windowMs: 700, note: '찌를 노려보다 살짝만 무는 예민한 갯바위 손님.' }),
  fish({ id: 'herring', name: '청어', spots: ['sea', 'harbor'], seasons: ['winter'], time: 'any', sky: 'any', weight: 38, sell: 360, cm: [20, 35], windowMs: 1_000, note: '과메기의 원조. 겨울이면 떼로 몰려와 바다가 반짝여요.' }),
  fish({ id: 'dodari', name: '도다리', spots: ['sea'], seasons: ['spring'], time: 'day', sky: 'any', weight: 22, sell: 780, cm: [20, 40], windowMs: 850, note: '봄 도다리 쑥국의 주인공. 광어와는 눈이 반대쪽이에요.' }),
  fish({ id: 'saury', name: '꽁치', spots: ['sea', 'harbor'], seasons: ['autumn'], time: 'night', sky: 'any', weight: 35, sell: 300, cm: [25, 35], windowMs: 1_000, note: '가을밤 등불을 따라 은빛 줄을 지어 와요.' }),
  fish({ id: 'blenny', name: '베도라치', spots: ['rocks'], seasons: ['winter', 'spring'], time: 'day', sky: 'any', weight: 30, sell: 280, cm: [10, 25], windowMs: 1_000, note: '바위틈에서 얼굴만 빼꼼. 숨바꼭질 챔피언이에요.' }),
  fish({ id: 'stingray', name: '노랑가오리', spots: ['sea'], seasons: ['summer'], time: 'night', sky: 'any', weight: 9, sell: 1_600, cm: [50, 120], windowMs: 650, note: '모래 바닥에 납작 엎드린 방석. 꼬리 가시는 조심.' }),
];

// ---------------------------------------------------------------- offshore
/** 먼바다: only from the boat (spot 'offshore'; the engine checks the voyage). */
export const OFFSHORE_FISH: readonly FishDef[] = [
  fish({ id: 'spanishmackerel', name: '삼치', spots: ['offshore'], seasons: ['spring', 'autumn', 'winter'], time: 'any', sky: 'any', weight: 40, sell: 1_450, cm: [50, 100], windowMs: 900, note: '이빨이 칼 같아서 낚싯줄을 자주 끊어 먹어요. 구우면 용서돼요.' }),
  fish({ id: 'amberjack', name: '부시리', spots: ['offshore'], seasons: ['summer', 'autumn'], time: 'day', sky: 'any', weight: 22, sell: 2_400, cm: [60, 120], windowMs: 800, note: '방어랑 헷갈리면 입꼬리를 보세요. 힘은 부시리가 한 수 위.' }),
  fish({ id: 'croaker', name: '민어', spots: ['offshore'], seasons: ['summer'], time: 'any', sky: 'any', weight: 14, sell: 2_700, cm: [50, 100], windowMs: 750, note: '복날 임금님 밥상에 오르던 보양식의 왕. 부레가 쫀득해요.' }),
  fish({ id: 'knifejaw', name: '돌돔', spots: ['offshore'], seasons: ['summer', 'autumn'], time: 'day', sky: 'any', weight: 8, sell: 4_200, cm: [30, 60], windowMs: 650, note: '줄무늬 일곱 개, 소라도 깨 먹는 이빨. 갯바위 꾼들의 꿈.' }),
  fish({ id: 'longtooth', name: '다금바리', spots: ['offshore'], seasons: ['autumn'], time: 'any', sky: 'any', weight: 3, sell: 8_500, cm: [50, 100], windowMs: 550, note: '횟집 수조에서도 부르는 게 값인 귀하신 몸.' }),
  fish({ id: 'giantsquid', name: '대왕오징어', spots: ['offshore'], seasons: ['winter'], time: 'night', sky: 'any', weight: 3, sell: 9_000, cm: [300, 800], windowMs: 550, note: '다리 하나가 갑판 끝까지. 눈은 접시만 해요.' }),
  fish({ id: 'sunfish', name: '개복치', spots: ['offshore'], seasons: ['summer'], time: 'day', sky: 'dry', weight: 4, sell: 6_500, cm: [100, 250], windowMs: 600, note: '햇볕 쬐며 둥둥. 놀라서 기절한다는 소문은 반쯤 과장이래요.' }),
  fish({ id: 'bluefin', name: '참다랑어', spots: ['offshore'], seasons: ['summer', 'autumn'], time: 'day', sky: 'any', weight: 5, sell: 10_500, cm: [100, 250], windowMs: 550, note: '바다의 스포츠카. 뱃전이 떨릴 만큼 당겨요.' }),
  fish({ id: 'marlin', name: '청새치', spots: ['offshore'], seasons: ['summer'], time: 'day', sky: 'dry', weight: 3, sell: 11_000, cm: [150, 300], windowMs: 550, note: '노인과 바다의 그 녀석. 사흘 밤낮은 안 걸리게 해 줄게요.' }),
  fish({ id: 'swordfish', name: '황새치', spots: ['offshore'], seasons: ['autumn'], time: 'night', sky: 'any', weight: 3, sell: 9_500, cm: [120, 300], windowMs: 550, note: '코끝이 진짜 칼. 펜싱 선수 출신이라는 말이 있어요.' }),
  fish({ id: 'mahimahi', name: '만새기', spots: ['offshore'], seasons: ['summer'], time: 'day', sky: 'any', weight: 20, sell: 2_100, cm: [50, 120], windowMs: 800, note: '물 밖에 나오면 금빛에서 초록으로 색이 바뀌는 무지개 머리.' }),
  fish({ id: 'skipjack', name: '가다랑어', spots: ['offshore'], seasons: ['summer', 'autumn'], time: 'any', sky: 'any', weight: 35, sell: 1_550, cm: [40, 80], windowMs: 900, note: '가쓰오부시가 되기엔 아직 너무 신났어요.' }),
  fish({ id: 'flyingfish', name: '날치', spots: ['offshore'], seasons: ['summer'], time: 'day', sky: 'dry', weight: 40, sell: 950, cm: [20, 35], windowMs: 1_000, note: '갑판으로 날아든 것도 낚은 걸로 쳐 주나요? 수첩은 쳐 줘요.' }),
  fish({ id: 'scorpionfish', name: '쏨뱅이', spots: ['offshore'], seasons: ALL, time: 'any', sky: 'any', weight: 40, sell: 1_000, cm: [15, 30], windowMs: 950, note: '바위색 얼룩으로 숨는 먼바다 단골. 매운탕 국물이 진해요.' }),
  fish({ id: 'stonefish', name: '쑤기미', spots: ['offshore'], seasons: ['spring', 'autumn', 'winter'], time: 'any', sky: 'any', weight: 15, sell: 1_700, cm: [15, 35], windowMs: 800, note: '못생김 대회 우승자. 등 가시 독도 우승감이에요.' }),
  fish({ id: 'skate', name: '홍어', spots: ['offshore'], seasons: ['winter', 'spring'], time: 'any', sky: 'any', weight: 14, sell: 2_400, cm: [50, 120], windowMs: 750, note: '갑판 위에 펼치면 연 같아요. 냄새 이야기는 삭힌 다음에.' }),
  fish({ id: 'monkfish', name: '아귀', spots: ['offshore'], seasons: ['winter', 'spring'], time: 'any', sky: 'any', weight: 20, sell: 1_850, cm: [40, 100], windowMs: 800, note: '입이 몸의 반. 아귀찜이 되면 다들 생김새는 잊어요.' }),
  fish({ id: 'atka', name: '임연수어', spots: ['offshore'], seasons: ['winter'], time: 'any', sky: 'any', weight: 30, sell: 1_300, cm: [30, 50], windowMs: 900, note: '껍질 쌈만 먹다 집 날린다는 그 생선. 조심해서 드세요.' }),
  fish({ id: 'snowcrab', name: '대게', spots: ['offshore'], seasons: ['winter'], time: 'any', sky: 'any', weight: 12, sell: 3_050, cm: [10, 18], windowMs: 750, note: '다리가 대나무처럼 곧아서 대게. 낚싯줄에 매달려 올라왔어요.' }),
  fish({ id: 'kingcrab', name: '킹크랩', spots: ['offshore'], seasons: ['winter'], time: 'night', sky: 'any', weight: 5, sell: 7_000, cm: [20, 30], windowMs: 600, note: '집게 하나가 팔뚝만 해요. 왕관은 안 썼지만 왕 맞아요.' }),
  fish({ id: 'barracuda', name: '꼬치고기', spots: ['offshore'], seasons: ['summer', 'autumn'], time: 'day', sky: 'any', weight: 30, sell: 1_350, cm: [30, 60], windowMs: 900, note: '꼬치처럼 길쭉하고 빨라요. 구이 꼬치는 우연이 아니에요.' }),
  fish({ id: 'stripedbonito', name: '줄삼치', spots: ['offshore'], seasons: ['autumn'], time: 'day', sky: 'any', weight: 25, sell: 1_600, cm: [40, 70], windowMs: 850, note: '등에 줄무늬를 그은 삼치 사촌. 가을 먼바다를 쏜살같이 달려요.' }),
  fish({ id: 'grunt', name: '벤자리', spots: ['offshore'], seasons: ['spring', 'summer'], time: 'any', sky: 'any', weight: 30, sell: 1_300, cm: [20, 40], windowMs: 900, note: '잡히면 꿀꿀 소리를 내요. 여름 제주 바다의 맛.' }),
  fish({ id: 'tigerperch', name: '범돔', spots: ['offshore'], seasons: ['spring', 'summer'], time: 'day', sky: 'any', weight: 32, sell: 1_000, cm: [10, 20], windowMs: 950, note: '범 무늬 작은 돔. 범마을 마스코트 후보 1순위.' }),
  fish({ id: 'grouper', name: '능성어', spots: ['offshore'], seasons: ['summer', 'autumn'], time: 'any', sky: 'any', weight: 10, sell: 3_250, cm: [40, 80], windowMs: 700, note: '어릴 땐 줄무늬, 크면 민무늬. 바위굴 깊이 숨는 큰 바리.' }),
  fish({ id: 'kelpgrouper', name: '자바리', spots: ['offshore'], seasons: ['autumn', 'winter'], time: 'any', sky: 'any', weight: 6, sell: 5_200, cm: [50, 100], windowMs: 650, note: '제주에선 이 녀석도 다금바리라 불러요. 수첩엔 따로 적어 둬요.' }),
  fish({ id: 'redrockfish', name: '불볼락', spots: ['offshore'], seasons: ['winter', 'spring'], time: 'any', sky: 'any', weight: 38, sell: 1_100, cm: [15, 30], windowMs: 950, note: '볼락의 먼바다 사촌, 별명은 열기. 줄줄이 올라와요.' }),
  fish({ id: 'goldrockfish', name: '황볼락', spots: ['offshore'], seasons: ['autumn', 'winter'], time: 'night', sky: 'any', weight: 18, sell: 1_450, cm: [15, 30], windowMs: 850, note: '집어등 아래 노랗게 떠오르는 밤 볼락.' }),
  fish({ id: 'anglerlamp', name: '초롱아귀', spots: ['offshore'], seasons: ALL, time: 'night', sky: 'any', weight: 6, sell: 4_500, cm: [20, 50], windowMs: 650, note: '이마에 등불을 단 심해의 낚시꾼. 우리랑 동업자네요.' }),
  fish({ id: 'snailfish', name: '꼼치', spots: ['offshore'], seasons: ['winter'], time: 'night', sky: 'any', weight: 20, sell: 1_350, cm: [30, 60], windowMs: 900, note: '흐물흐물 물메기탕의 주인공. 국물은 하나도 안 흐물해요.' }),
  fish({ id: 'hagfish', name: '먹장어', spots: ['offshore'], seasons: ALL, time: 'night', sky: 'any', weight: 22, sell: 1_200, cm: [40, 70], windowMs: 900, note: '꼼장어 구이로 이름난 밤바다의 끈끈이.' }),
  fish({ id: 'greateramberjack', name: '잿방어', spots: ['offshore'], seasons: ['summer', 'autumn'], time: 'any', sky: 'any', weight: 8, sell: 4_800, cm: [80, 160], windowMs: 650, note: '방어 집안의 맏형. 머리에 잿빛 띠를 둘렀어요.' }),
  fish({ id: 'sailfish', name: '돛새치', spots: ['offshore'], seasons: ['summer'], time: 'day', sky: 'dry', weight: 3, sell: 9_800, cm: [150, 300], windowMs: 550, note: '등지느러미 돛을 펴면 배보다 빨라요. 진짜로.' }),
];

/** Only on the captain's dawn sailing (새벽 초대 배). */
export const DAWN_FISH: readonly FishDef[] = [
  fish({ id: 'dawnbream', name: '여명 참돔', spots: ['offshore'], seasons: ALL, time: 'any', sky: 'any', weight: 6, sell: 5_500, cm: [40, 90], windowMs: 650, note: '해 뜨기 직전 분홍 물빛을 닮은 참돔. 샹크스 단골 자리에서만.' }),
  fish({ id: 'morningstar', name: '샛별 삼치', spots: ['offshore'], seasons: ALL, time: 'any', sky: 'any', weight: 8, sell: 3_200, cm: [60, 110], windowMs: 700, note: '샛별이 질 때까지만 무는 은빛 삼치. 늦잠꾸러기는 못 봐요.' }),
];

/** Offshore legends: `seasons: []` like the other new legends (the real season is in SEA_PROFILE). */
export const SEA_LEGENDS: readonly FishDef[] = [
  fish({ id: 'goldtuna', name: '황금 다랑어', spots: ['offshore'], seasons: [], time: 'day', sky: 'dry', weight: 1, sell: 15_000, cm: [180, 300], windowMs: 450, note: '여름 맑은 새벽, 수평선이 금빛일 때 함께 금빛으로 뛰어오른대요.' }),
  fish({ id: 'deeplantern', name: '심해의 등불', spots: ['offshore'], seasons: [], time: 'night', sky: 'any', weight: 1, sell: 14_000, cm: [60, 110], windowMs: 450, note: '겨울 밤바다 깊은 곳에서 등불 하나가 올라와요. 따라가면 안 된대요.' }),
  fish({ id: 'rainbowsunfish', name: '무지개 개복치', spots: ['offshore'], seasons: [], time: 'day', sky: 'rain', weight: 1, sell: 13_500, cm: [150, 300], windowMs: 450, note: '봄비 그친 한낮, 무지개 아래 떠올라 낮잠을 잔다는 전설.' }),
];

export const SEA_FISH: readonly FishDef[] = [...SHORE_FISH, ...OFFSHORE_FISH, ...DAWN_FISH, ...SEA_LEGENDS];

// ---------------------------------------------------------------- fight profiles
/**
 * Behaviour, difficulty and windows. `need` gates a fish on the rod tier or the
 * bait on the hook; `dawn` keeps it to the dawn sailing; `weather` narrows a
 * legend to one sky (황금 다랑어: 맑음).
 */
export const SEA_PROFILE: Readonly<Record<string, FishProfile>> = {
  halfbeak: { behaviour: 'dart', difficulty: 22 },
  goby: { behaviour: 'sink', difficulty: 15 },
  beka: { behaviour: 'float', difficulty: 24, hours: [19, 1] },
  webfoot: { behaviour: 'sink', difficulty: 30 },
  whiting: { behaviour: 'dart', difficulty: 26 },
  gurnard: { behaviour: 'mixed', difficulty: 40 },
  lionfish: { behaviour: 'float', difficulty: 52 },
  opaleye: { behaviour: 'dart', difficulty: 55, need: { bait: 'bait-shrimp' } },
  herring: { behaviour: 'dart', difficulty: 20 },
  dodari: { behaviour: 'sink', difficulty: 36 },
  saury: { behaviour: 'dart', difficulty: 22, hours: [18, 2] },
  blenny: { behaviour: 'sink', difficulty: 18 },
  stingray: { behaviour: 'sink', difficulty: 58, hours: [20, 4] },
  spanishmackerel: { behaviour: 'dart', difficulty: 40 },
  amberjack: { behaviour: 'dart', difficulty: 62 },
  croaker: { behaviour: 'sink', difficulty: 55 },
  knifejaw: { behaviour: 'mixed', difficulty: 70, need: { rod: 2 } },
  longtooth: { behaviour: 'sink', difficulty: 80, need: { rod: 3 } },
  giantsquid: { behaviour: 'float', difficulty: 82, hours: [21, 4], need: { rod: 3 } },
  sunfish: { behaviour: 'float', difficulty: 60, hours: [10, 16] },
  bluefin: { behaviour: 'dart', difficulty: 85, need: { rod: 3 } },
  marlin: { behaviour: 'dart', difficulty: 88, need: { rod: 3, bait: 'bait-shrimp' } },
  swordfish: { behaviour: 'mixed', difficulty: 84, hours: [20, 4], need: { rod: 3 } },
  mahimahi: { behaviour: 'float', difficulty: 48 },
  skipjack: { behaviour: 'dart', difficulty: 38 },
  flyingfish: { behaviour: 'float', difficulty: 20 },
  scorpionfish: { behaviour: 'sink', difficulty: 26 },
  stonefish: { behaviour: 'sink', difficulty: 44 },
  skate: { behaviour: 'sink', difficulty: 52 },
  monkfish: { behaviour: 'sink', difficulty: 42 },
  atka: { behaviour: 'calm', difficulty: 30 },
  snowcrab: { behaviour: 'sink', difficulty: 50 },
  kingcrab: { behaviour: 'sink', difficulty: 72, need: { rod: 2 } },
  barracuda: { behaviour: 'dart', difficulty: 36 },
  stripedbonito: { behaviour: 'dart', difficulty: 40 },
  grunt: { behaviour: 'mixed', difficulty: 32 },
  tigerperch: { behaviour: 'calm', difficulty: 22 },
  grouper: { behaviour: 'sink', difficulty: 62, need: { rod: 2 } },
  kelpgrouper: { behaviour: 'sink', difficulty: 70, need: { rod: 2 } },
  redrockfish: { behaviour: 'float', difficulty: 26 },
  goldrockfish: { behaviour: 'float', difficulty: 34 },
  anglerlamp: { behaviour: 'mixed', difficulty: 66, hours: [22, 4] },
  snailfish: { behaviour: 'calm', difficulty: 30 },
  hagfish: { behaviour: 'mixed', difficulty: 38 },
  greateramberjack: { behaviour: 'dart', difficulty: 74, need: { rod: 3 } },
  sailfish: { behaviour: 'dart', difficulty: 86, need: { rod: 3 } },
  dawnbream: { behaviour: 'mixed', difficulty: 72, dawn: true },
  morningstar: { behaviour: 'dart', difficulty: 60, dawn: true },
  goldtuna: { behaviour: 'dart', difficulty: 94, hours: [5, 8], season: 'summer', weather: ['sunny'], legend: { level: 8, rod: 3 } },
  deeplantern: { behaviour: 'float', difficulty: 90, hours: [22, 4], season: 'winter', legend: { level: 7, rod: 3 } },
  rainbowsunfish: { behaviour: 'float', difficulty: 86, hours: [10, 14], season: 'spring', legend: { level: 7, rod: 2 } },
};

/** Body build for the weight formula (lounge-fish-engine fishGrams). */
export const SEA_BUILD: Readonly<Record<string, number>> = {
  halfbeak: 0.35, saury: 0.4, beka: 0.75, webfoot: 0.9, stingray: 0.55, gurnard: 1.1,
  barracuda: 0.45, hagfish: 0.3, giantsquid: 0.035, swordfish: 0.45, marlin: 0.4, sailfish: 0.3,
  sunfish: 1.4, rainbowsunfish: 1.4, skate: 0.5, monkfish: 1.4, snowcrab: 2.2, kingcrab: 2.4,
  anglerlamp: 1.5, deeplantern: 1.3, snailfish: 0.9, goldtuna: 1.5, bluefin: 1.5,
};

// ---------------------------------------------------------------- dishes
/**
 * Seafood from the new fish. Priced in lounge-items DISHES like every other
 * dish (ingredients × 1.25 + 100, rounded to 10), so they follow the fish prices.
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
export const SEA_DISHES: readonly DishDef[] = [
  dishOf('tuna-sashimi', '참다랑어 회', [{ item: 'bluefin', n: 1 }], '붉은 속살을 두툼하게. 선장님이 직접 썰었다고 우겨요.', 'luck'),
  dishOf('grilled-spanish', '삼치구이', [{ item: 'spanishmackerel', n: 1 }, { item: 'wood', n: 1 }], '기름이 지글지글. 겨울 밥도둑.', 'luck'),
  dishOf('croaker-soup', '민어탕', [{ item: 'croaker', n: 1 }, { item: 'cabbage', n: 1 }], '복날 한 그릇이면 여름이 거뜬해요.', 'grow'),
  dishOf('steamed-crab', '대게찜', [{ item: 'snowcrab', n: 2 }], '다리살이 쏙쏙. 말 없이 먹게 되는 요리.', 'charm'),
  dishOf('monkfish-stew', '아귀찜', [{ item: 'monkfish', n: 1 }, { item: 'spinach', n: 1 }], '콩나물 대신 시금치를 넣은 범마을식 아귀찜.', 'mine'),
];
