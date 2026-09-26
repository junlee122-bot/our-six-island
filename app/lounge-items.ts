// Item catalog for the life expansion: fish, bugs, forage, materials, dishes,
// fertilizer; recipes (cooking + crafting), village bundles, achievements,
// forage/bug spots and the rotating furniture shop pool. Pure data + tiny
// helpers; shared by the client and the hohyeon-api Edge function.
import type { ItemCategory, Season, Weather } from './lounge-calendar.ts';

/** Crop ids live in lounge-life.ts; they are repeated here as a string set only. */
export type Spot = 'river' | 'pond' | 'sea' | 'rapids' | 'falls' | 'lake' | 'rocks' | 'harbor' | 'bridge';
export const FISH_SPOTS: readonly Spot[] = ['river', 'pond', 'sea', 'rapids', 'falls', 'lake', 'rocks', 'harbor', 'bridge'];
export type SpotInfo = {
  name: string;
  /** Village flag (bundle / project) that opens the spot. */
  flag?: string;
  /** Fishing rod level needed (strong water). */
  rod?: 2 | 3;
  /** Open only at night (KST 19:00–05:00). */
  night?: boolean;
  /** One line about the water, shown on the spot card. */
  note: string;
};
export const SPOT_INFO: Record<Spot, SpotInfo> = {
  river: { name: '강', note: '마을을 가로지르는 느린 강. 무엇이든 조금씩 물어요.' },
  pond: { name: '연못', note: '연잎 사이 고요한 물. 작은 물고기와 비단잉어가 살아요.' },
  sea: { name: '동쪽 바다 데크', flag: 'bridge', note: '데크 끝에서 던지는 바다낚시. 큼직한 바닷물고기가 와요.' },
  rapids: { name: '윗물 여울', note: '바위 사이로 물살이 빠른 강 윗물. 여울 물고기가 살아요.' },
  falls: { name: '폭포 소', rod: 2, note: '폭포 아래 깊은 소. 물살이 세서 튼튼한 낚싯대가 필요해요.' },
  lake: { name: '호숫가 선착장', note: '북동쪽 호수의 나무 선착장. 느긋하게 큰 놈을 기다려요.' },
  rocks: { name: '갯바위', note: '파도가 부서지는 바닷가 바위. 바위틈 물고기가 숨어 있어요.' },
  harbor: { name: '밤 항구', night: true, note: '해가 지면 등불이 켜지는 작은 항구. 밤바다 물고기가 몰려와요.' },
  bridge: { name: '다리 위', note: '다리 난간에서 내려 던지는 낚시. 강 한가운데 물고기가 와요.' },
};
type When = 'day' | 'night' | 'any';
type Sky = 'rain' | 'dry' | 'any';
const ALL: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];
const WARM: readonly Season[] = ['spring', 'summer', 'autumn'];

export type ItemKind = 'fish' | 'bug' | 'forage' | 'flower' | 'material' | 'dish' | 'tool';
export type ItemDef = {
  id: string;
  name: string;
  emoji: string;
  /** Gift/request category (tools have none). */
  cat: ItemCategory | 'tool';
  kind: ItemKind;
  /** Sell price per piece (0 = cannot be sold). */
  sell: number;
  note: string;
  /** Museum-donatable (fish, bugs, forage, flowers, dishes). */
  museum?: boolean;
};
export type FishDef = {
  id: string;
  name: string;
  emoji: string;
  spots: readonly Spot[];
  seasons: readonly Season[];
  time: When;
  sky: Sky;
  /** Relative weight; < 10 counts as rare (luck buff doubles it). */
  weight: number;
  sell: number;
  cm: readonly [number, number];
  /** Reaction window after the bite (rod level 1). */
  windowMs: number;
  note: string;
};
export const FISH: readonly FishDef[] = [
  // Legacy island fish (life-data.ts COLLECTION) first.
  { id: 'crucian', name: '붕어', emoji: '🐟', spots: ['river', 'pond', 'lake', 'bridge'], seasons: ALL, time: 'any', sky: 'any', weight: 60, sell: 120, cm: [10, 30], windowMs: 1_100, note: '호수에서 자주 만날 수 있는 느긋한 물고기.' },
  { id: 'carp', name: '잉어', emoji: '🐠', spots: ['river', 'pond', 'lake'], seasons: WARM, time: 'any', sky: 'any', weight: 35, sell: 250, cm: [30, 70], windowMs: 950, note: '부두 그늘 아래 숨어 있어요.' },
  { id: 'koi', name: '비단잉어', emoji: '🐠', spots: ['pond'], seasons: ALL, time: 'day', sky: 'dry', weight: 6, sell: 1_500, cm: [30, 80], windowMs: 650, note: '반짝이는 비늘이 무척 아름다워요.' },
  { id: 'bass', name: '농어', emoji: '🐟', spots: ['sea'], seasons: ['summer', 'autumn'], time: 'any', sky: 'any', weight: 25, sell: 650, cm: [40, 90], windowMs: 800, note: '힘차게 헤엄치는 멋진 친구예요.' },
  { id: 'minnow', name: '피라미', emoji: '🐟', spots: ['river', 'rapids', 'bridge'], seasons: ALL, time: 'day', sky: 'any', weight: 70, sell: 60, cm: [6, 15], windowMs: 1_200, note: '여울에서 반짝 튀어 올라요.' },
  { id: 'sweetfish', name: '은어', emoji: '🐟', spots: ['river', 'rapids'], seasons: ['summer'], time: 'day', sky: 'dry', weight: 18, sell: 500, cm: [15, 30], windowMs: 800, note: '맑은 여름 강에서만 보여요. 수박 향이 난대요.' },
  { id: 'mandarin', name: '쏘가리', emoji: '🐟', spots: ['river', 'bridge'], seasons: ['summer', 'autumn'], time: 'night', sky: 'any', weight: 10, sell: 900, cm: [20, 50], windowMs: 700, note: '바위틈의 강의 왕.' },
  { id: 'catfish', name: '메기', emoji: '🐟', spots: ['river', 'pond', 'lake'], seasons: ['summer', 'autumn'], time: 'night', sky: 'rain', weight: 22, sell: 800, cm: [30, 90], windowMs: 900, note: '비 오는 밤에 수염을 흔들며 나와요.' },
  { id: 'eel', name: '뱀장어', emoji: '🐍', spots: ['river'], seasons: ['spring', 'summer'], time: 'night', sky: 'rain', weight: 9, sell: 1_200, cm: [40, 100], windowMs: 600, note: '미끌미끌, 놓치기 쉬워요.' },
  { id: 'trout', name: '산천어', emoji: '🐟', spots: ['river', 'rapids', 'falls'], seasons: ['winter'], time: 'day', sky: 'any', weight: 20, sell: 700, cm: [20, 45], windowMs: 850, note: '차가운 겨울 강의 보석.' },
  { id: 'medaka', name: '송사리', emoji: '🐟', spots: ['pond'], seasons: ['spring', 'summer'], time: 'day', sky: 'any', weight: 60, sell: 40, cm: [2, 5], windowMs: 1_200, note: '작디작은 연못 친구.' },
  { id: 'goldfish', name: '금붕어', emoji: '🐡', spots: ['pond'], seasons: ALL, time: 'any', sky: 'any', weight: 25, sell: 150, cm: [5, 20], windowMs: 1_000, note: '누군가 풀어 준 걸까요?' },
  { id: 'snakehead', name: '가물치', emoji: '🐟', spots: ['pond'], seasons: ['summer'], time: 'night', sky: 'any', weight: 12, sell: 700, cm: [40, 90], windowMs: 750, note: '연못 깊은 곳의 터줏대감.' },
  { id: 'smelt', name: '빙어', emoji: '🐟', spots: ['pond', 'lake'], seasons: ['winter'], time: 'any', sky: 'any', weight: 55, sell: 200, cm: [8, 15], windowMs: 1_000, note: '얼음 아래에서 떼 지어 다녀요.' },
  { id: 'loach', name: '미꾸라지', emoji: '🐟', spots: ['pond', 'river'], seasons: WARM, time: 'any', sky: 'rain', weight: 30, sell: 180, cm: [10, 20], windowMs: 1_000, note: '비 온 뒤 진흙 속에서 꿈틀.' },
  { id: 'crayfish', name: '가재', emoji: '🦞', spots: ['pond', 'river'], seasons: WARM, time: 'night', sky: 'any', weight: 20, sell: 300, cm: [6, 14], windowMs: 1_000, note: '돌을 들추면 집게를 번쩍.' },
  { id: 'mackerel', name: '고등어', emoji: '🐟', spots: ['sea', 'harbor'], seasons: ALL, time: 'any', sky: 'any', weight: 60, sell: 200, cm: [25, 45], windowMs: 1_000, note: '바다 데크의 단골손님.' },
  { id: 'shad', name: '전어', emoji: '🐟', spots: ['sea'], seasons: ['autumn'], time: 'any', sky: 'any', weight: 35, sell: 450, cm: [15, 30], windowMs: 900, note: '가을 전어 굽는 냄새에 집 나간 친구도 돌아온대요.' },
  { id: 'flounder', name: '광어', emoji: '🐟', spots: ['sea'], seasons: ALL, time: 'any', sky: 'any', weight: 20, sell: 600, cm: [30, 80], windowMs: 850, note: '모래 바닥에 납작 숨어 있어요.' },
  { id: 'squid', name: '오징어', emoji: '🦑', spots: ['sea', 'harbor'], seasons: ['summer'], time: 'night', sky: 'dry', weight: 25, sell: 500, cm: [20, 50], windowMs: 850, note: '여름밤 불빛을 따라 올라와요.' },
  { id: 'yellowtail', name: '방어', emoji: '🐟', spots: ['sea'], seasons: ['winter'], time: 'any', sky: 'any', weight: 18, sell: 1_100, cm: [50, 100], windowMs: 700, note: '겨울 바다의 기름진 주인공.' },
  { id: 'puffer', name: '복어', emoji: '🐡', spots: ['sea'], seasons: ['summer'], time: 'day', sky: 'any', weight: 10, sell: 900, cm: [15, 40], windowMs: 750, note: '화나면 빵빵해져요.' },
  { id: 'seabream', name: '참돔', emoji: '🐟', spots: ['sea'], seasons: ['spring', 'autumn'], time: 'day', sky: 'any', weight: 5, sell: 2_000, cm: [30, 90], windowMs: 600, note: '바다의 여왕, 행운의 붉은 물고기.' },
  { id: 'goldcarp', name: '황금 잉어', emoji: '✨', spots: ['river'], seasons: ALL, time: 'any', sky: 'rain', weight: 1, sell: 8_000, cm: [60, 120], windowMs: 450, note: '폭우 속 강에 나타난다는 전설의 물고기.' },
  // VILL-2 spots: 윗물 여울, 폭포 소, 호숫가 선착장, 갯바위, 밤 항구, 다리 위.
  { id: 'kkeokji', name: '꺽지', emoji: '🐟', spots: ['rapids'], seasons: WARM, time: 'any', sky: 'any', weight: 35, sell: 340, cm: [12, 25], windowMs: 850, note: '여울 바위틈을 제 집처럼 지켜요.' },
  { id: 'shiri', name: '쉬리', emoji: '🐟', spots: ['rapids'], seasons: ALL, time: 'day', sky: 'dry', weight: 30, sell: 300, cm: [8, 14], windowMs: 800, note: '맑은 여울에만 사는 우리 물고기. 줄무늬가 선명해요.' },
  { id: 'lenok', name: '열목어', emoji: '🐟', spots: ['rapids', 'falls'], seasons: ['winter', 'spring'], time: 'day', sky: 'any', weight: 7, sell: 1_600, cm: [30, 70], windowMs: 600, note: '눈이 붉은 찬물의 물고기. 쉽게 볼 수 없어요.' },
  { id: 'beodeulchi', name: '버들치', emoji: '🐟', spots: ['falls'], seasons: ALL, time: 'any', sky: 'any', weight: 55, sell: 120, cm: [6, 15], windowMs: 1_100, note: '폭포 소의 맑은 물을 떼 지어 헤엄쳐요.' },
  { id: 'rainbow', name: '무지개송어', emoji: '🐟', spots: ['falls'], seasons: ['autumn', 'winter', 'spring'], time: 'any', sky: 'any', weight: 25, sell: 620, cm: [25, 60], windowMs: 800, note: '물보라 속에서 옆구리가 무지개빛으로 번쩍여요.' },
  { id: 'mochi', name: '금강모치', emoji: '🐟', spots: ['falls'], seasons: ['spring', 'summer'], time: 'day', sky: 'dry', weight: 6, sell: 1_700, cm: [6, 10], windowMs: 550, note: '차고 맑은 물에서만 사는 작고 귀한 물고기.' },
  { id: 'bluegill', name: '블루길', emoji: '🐟', spots: ['lake'], seasons: WARM, time: 'day', sky: 'any', weight: 55, sell: 90, cm: [8, 20], windowMs: 1_100, note: '선착장 기둥 아래 떼 지어 모여요.' },
  { id: 'blackbass', name: '큰입배스', emoji: '🐟', spots: ['lake'], seasons: WARM, time: 'any', sky: 'any', weight: 25, sell: 560, cm: [25, 55], windowMs: 800, note: '미끼를 덥석 무는 욕심쟁이.' },
  { id: 'skygazer', name: '강준치', emoji: '🐟', spots: ['lake'], seasons: ['summer', 'autumn'], time: 'night', sky: 'any', weight: 8, sell: 1_300, cm: [40, 90], windowMs: 650, note: '달을 올려다보듯 입이 위로 향해 있어요.' },
  { id: 'greenling', name: '노래미', emoji: '🐟', spots: ['rocks'], seasons: ['autumn', 'winter', 'spring'], time: 'day', sky: 'any', weight: 40, sell: 240, cm: [15, 35], windowMs: 950, note: '갯바위 해초 사이에 숨어 있어요.' },
  { id: 'rockfish', name: '볼락', emoji: '🐟', spots: ['rocks', 'harbor'], seasons: ALL, time: 'night', sky: 'any', weight: 40, sell: 280, cm: [12, 28], windowMs: 950, note: '밤이면 눈을 반짝이며 떠올라요.' },
  { id: 'jacopever', name: '우럭', emoji: '🐟', spots: ['rocks', 'harbor'], seasons: ALL, time: 'any', sky: 'any', weight: 30, sell: 400, cm: [20, 45], windowMs: 900, note: '바위 그늘의 듬직한 조피볼락.' },
  { id: 'octopus', name: '문어', emoji: '🐙', spots: ['rocks'], seasons: ['summer', 'autumn'], time: 'any', sky: 'rain', weight: 12, sell: 950, cm: [30, 90], windowMs: 700, note: '비 오는 날 바위 구멍에서 다리를 쭉.' },
  { id: 'blackbream', name: '감성돔', emoji: '🐟', spots: ['rocks'], seasons: ['autumn', 'winter'], time: 'any', sky: 'any', weight: 6, sell: 1_900, cm: [25, 55], windowMs: 600, note: '갯바위 낚시꾼들이 꿈꾸는 은빛 돔.' },
  { id: 'horsemackerel', name: '전갱이', emoji: '🐟', spots: ['harbor'], seasons: ['summer', 'autumn'], time: 'night', sky: 'any', weight: 45, sell: 170, cm: [15, 30], windowMs: 1_000, note: '항구 등불 아래 떼로 몰려와요.' },
  { id: 'hairtail', name: '갈치', emoji: '🐟', spots: ['harbor'], seasons: ['summer', 'autumn'], time: 'night', sky: 'any', weight: 25, sell: 620, cm: [60, 120], windowMs: 800, note: '은빛 칼처럼 번쩍이는 밤바다의 물고기.' },
  { id: 'conger', name: '붕장어', emoji: '🐍', spots: ['harbor'], seasons: ALL, time: 'night', sky: 'any', weight: 25, sell: 480, cm: [40, 90], windowMs: 850, note: '방파제 틈에서 스르륵 나와요.' },
  { id: 'mitre', name: '한치', emoji: '🦑', spots: ['harbor'], seasons: ['summer'], time: 'night', sky: 'dry', weight: 20, sell: 650, cm: [15, 35], windowMs: 850, note: '한 치밖에 안 되는 다리. 여름밤 집어등의 손님.' },
  { id: 'moonhairtail', name: '달빛 갈치', emoji: '✨', spots: ['harbor'], seasons: ['autumn'], time: 'night', sky: 'dry', weight: 1, sell: 7_000, cm: [120, 180], windowMs: 450, note: '보름달 뜬 가을밤 항구에 나타난다는 전설.' },
  { id: 'kkeuri', name: '끄리', emoji: '🐟', spots: ['bridge'], seasons: WARM, time: 'any', sky: 'any', weight: 30, sell: 260, cm: [20, 40], windowMs: 900, note: '다리 아래 물살을 거슬러 사냥해요.' },
  { id: 'nuchi', name: '누치', emoji: '🐟', spots: ['bridge'], seasons: ALL, time: 'day', sky: 'any', weight: 30, sell: 220, cm: [25, 50], windowMs: 950, note: '모래 바닥을 입으로 뒤지는 강의 청소부.' },
  { id: 'bagrid', name: '동자개', emoji: '🐟', spots: ['bridge'], seasons: ['summer', 'autumn'], time: 'night', sky: 'rain', weight: 18, sell: 500, cm: [15, 30], windowMs: 900, note: '낚으면 "빠가빠가" 운다는 빠가사리.' },
];
export type BugDef = {
  id: string;
  name: string;
  emoji: string;
  seasons: readonly Season[];
  time: When;
  sky: Sky;
  habitat: readonly Habitat[];
  weight: number;
  sell: number;
  note: string;
};
export type Habitat = 'forest' | 'meadow' | 'shore';
export const BUGS: readonly BugDef[] = [
  { id: 'butterfly', name: '노랑나비', emoji: '🦋', seasons: ['spring', 'summer'], time: 'day', sky: 'dry', habitat: ['meadow'], weight: 50, sell: 90, note: '과수원과 꽃밭을 찾아보세요.' },
  { id: 'swallowtail', name: '호랑나비', emoji: '🦋', seasons: ['spring', 'summer'], time: 'day', sky: 'dry', habitat: ['meadow', 'forest'], weight: 20, sell: 250, note: '날개에 호랑이 무늬가 있어요.' },
  { id: 'ladybug', name: '무당벌레', emoji: '🐞', seasons: ['spring'], time: 'day', sky: 'dry', habitat: ['meadow'], weight: 40, sell: 80, note: '점 일곱 개, 행운의 벌레.' },
  { id: 'honeybee', name: '꿀벌', emoji: '🐝', seasons: ['spring', 'summer'], time: 'day', sky: 'dry', habitat: ['meadow'], weight: 35, sell: 120, note: '과수원 꽃 사이를 바쁘게 다녀요.' },
  { id: 'cicada', name: '매미', emoji: '🪰', seasons: ['summer'], time: 'day', sky: 'dry', habitat: ['forest'], weight: 45, sell: 150, note: '맴맴, 여름이 왔다는 신호.' },
  { id: 'beetle', name: '장수풍뎅이', emoji: '🪲', seasons: ['summer'], time: 'night', sky: 'any', habitat: ['forest'], weight: 12, sell: 800, note: '북쪽 숲의 나무 가까이에 살아요.' },
  { id: 'stagbeetle', name: '사슴벌레', emoji: '🪲', seasons: ['summer'], time: 'night', sky: 'dry', habitat: ['forest'], weight: 10, sell: 900, note: '멋진 뿔을 자랑해요.' },
  { id: 'firefly', name: '반딧불이', emoji: '✨', seasons: ['summer'], time: 'night', sky: 'dry', habitat: ['shore', 'meadow'], weight: 30, sell: 400, note: '여름밤 강가를 밝히는 작은 별.' },
  { id: 'dragonfly', name: '잠자리', emoji: '🪰', seasons: ['summer', 'autumn'], time: 'day', sky: 'dry', habitat: ['shore'], weight: 40, sell: 120, note: '동쪽 호수 주변을 맴돌아요.' },
  { id: 'reddragonfly', name: '고추잠자리', emoji: '🪰', seasons: ['autumn'], time: 'day', sky: 'dry', habitat: ['meadow', 'shore'], weight: 35, sell: 200, note: '가을 하늘에 빨갛게.' },
  { id: 'grasshopper', name: '메뚜기', emoji: '🦗', seasons: ['autumn'], time: 'day', sky: 'dry', habitat: ['meadow'], weight: 40, sell: 100, note: '풀숲에서 폴짝.' },
  { id: 'cricket', name: '귀뚜라미', emoji: '🦗', seasons: ['autumn'], time: 'night', sky: 'any', habitat: ['meadow', 'forest'], weight: 40, sell: 150, note: '가을밤의 노래꾼.' },
  { id: 'mantis', name: '사마귀', emoji: '🦗', seasons: ['autumn'], time: 'day', sky: 'dry', habitat: ['forest', 'meadow'], weight: 12, sell: 350, note: '앞발을 모은 채 기도하듯 서 있어요.' },
  { id: 'snail', name: '달팽이', emoji: '🐌', seasons: WARM, time: 'any', sky: 'rain', habitat: ['forest', 'meadow', 'shore'], weight: 45, sell: 120, note: '비 오는 날 천천히 산책 중.' },
  { id: 'snowfly', name: '눈각다귀', emoji: '🪰', seasons: ['winter'], time: 'day', sky: 'any', habitat: ['forest', 'meadow'], weight: 25, sell: 300, note: '눈 위를 걷는 겨울 곤충.' },
];
type ForageDef = {
  id: string;
  name: string;
  emoji: string;
  kind: 'forage' | 'flower' | 'material';
  seasons: readonly Season[];
  sky: Sky;
  habitat: readonly Habitat[];
  weight: number;
  sell: number;
  note: string;
};
export const FORAGE: readonly ForageDef[] = [
  { id: 'wood', name: '나뭇가지', emoji: '🪵', kind: 'material', seasons: ALL, sky: 'any', habitat: ['forest', 'meadow'], weight: 40, sell: 20, note: '공방의 모든 이야기는 여기서 시작돼요.' },
  { id: 'stone', name: '조약돌', emoji: '🪨', kind: 'material', seasons: ALL, sky: 'any', habitat: ['shore', 'forest'], weight: 35, sell: 20, note: '동글동글 강가의 돌.' },
  { id: 'pinecone', name: '솔방울', emoji: '🌰', kind: 'material', seasons: ALL, sky: 'any', habitat: ['forest'], weight: 30, sell: 30, note: '비료 만들 때 좋아요.' },
  { id: 'shell', name: '바닷조개', emoji: '🐚', kind: 'material', seasons: ALL, sky: 'any', habitat: ['shore'], weight: 30, sell: 60, note: '파도가 놓고 간 선물.' },
  { id: 'wildflower', name: '들꽃', emoji: '🌼', kind: 'flower', seasons: WARM, sky: 'any', habitat: ['meadow'], weight: 35, sell: 50, note: '숲과 마을 사이에 피어난 작은 꽃.' },
  { id: 'azalea', name: '진달래', emoji: '🌺', kind: 'flower', seasons: ['spring'], sky: 'any', habitat: ['forest', 'meadow'], weight: 25, sell: 90, note: '봄 산을 분홍으로 물들여요.' },
  { id: 'sunflower', name: '해바라기', emoji: '🌻', kind: 'flower', seasons: ['summer'], sky: 'dry', habitat: ['meadow'], weight: 25, sell: 110, note: '해를 따라 고개를 돌려요.' },
  { id: 'cosmos', name: '코스모스', emoji: '🌸', kind: 'flower', seasons: ['autumn'], sky: 'any', habitat: ['meadow', 'shore'], weight: 30, sell: 90, note: '가을 길가에 한들한들.' },
  { id: 'camellia', name: '동백꽃', emoji: '🌹', kind: 'flower', seasons: ['winter'], sky: 'any', habitat: ['forest', 'shore'], weight: 25, sell: 150, note: '눈 속에 피는 붉은 꽃.' },
  { id: 'mugwort', name: '쑥', emoji: '🌿', kind: 'forage', seasons: ['spring'], sky: 'any', habitat: ['meadow', 'shore'], weight: 35, sell: 70, note: '봄 향기 가득한 들나물.' },
  { id: 'shepherd', name: '냉이', emoji: '🌱', kind: 'forage', seasons: ['spring'], sky: 'any', habitat: ['meadow'], weight: 30, sell: 80, note: '된장국에 넣으면 봄이 와요.' },
  { id: 'wildgarlic', name: '달래', emoji: '🧄', kind: 'forage', seasons: ['spring'], sky: 'any', habitat: ['forest'], weight: 20, sell: 100, note: '알싸한 봄나물.' },
  { id: 'raspberry', name: '산딸기', emoji: '🍓', kind: 'forage', seasons: ['summer'], sky: 'any', habitat: ['forest', 'meadow'], weight: 30, sell: 120, note: '숲길 덤불 속의 새콤한 간식.' },
  { id: 'mushroom', name: '버섯', emoji: '🍄', kind: 'forage', seasons: ['summer', 'autumn'], sky: 'rain', habitat: ['forest'], weight: 45, sell: 150, note: '비 온 뒤 숲에서 쑥쑥.' },
  { id: 'acorn', name: '도토리', emoji: '🌰', kind: 'forage', seasons: ['autumn'], sky: 'any', habitat: ['forest'], weight: 35, sell: 60, note: '다람쥐와 나눠 먹어요.' },
  { id: 'chestnut', name: '밤', emoji: '🌰', kind: 'forage', seasons: ['autumn'], sky: 'any', habitat: ['forest'], weight: 25, sell: 120, note: '가시 속 달콤한 선물.' },
  { id: 'ginseng', name: '산삼', emoji: '🥕', kind: 'forage', seasons: WARM, sky: 'any', habitat: ['forest'], weight: 1, sell: 5_000, note: '심봤다! 아주 드물게 나타나요.' },
  { id: 'icicle', name: '고드름', emoji: '🧊', kind: 'material', seasons: ['winter'], sky: 'any', habitat: ['forest', 'shore'], weight: 20, sell: 40, note: '처마 끝의 투명한 창.' },
];
export type DishBuff = 'grow' | 'luck' | 'forage' | 'bug';
export const BUFF_INFO: Record<DishBuff, { name: string; text: string }> = {
  grow: { name: '초록 손', text: '오늘 심거나 비료를 준 작물이 15% 빨리 자라요' },
  luck: { name: '물고기의 행운', text: '오늘 희귀 물고기 확률 2배 · 입질 판정 +20%' },
  forage: { name: '채집 달인', text: '오늘 채집할 때 1개씩 더' },
  bug: { name: '곤충 박사', text: '오늘 곤충을 잡을 때 1마리씩 더' },
};
/** Buffed growth: speed-up percent applied at planting/fertilizing. */
export const GROW_BUFF_SPEED = 15;
/** One recipe input: a specific item/crop (optionally minimum quality) or any of a category. */
export type Need =
  | { item: string; q?: 0 | 1 | 2 }
  | { cat: 'fish' | 'bug' | 'flower' | 'forage' }
  | { beom: true };
export type RecipeDef = {
  id: string;
  name: string;
  emoji: string;
  needs: readonly (Need & { n: number })[];
  /** What it makes (item id or furniture ref) and how many. */
  makes: string;
  count: number;
  /** Village flag needed to cook/craft it. */
  flag?: string;
};
export type DishDef = RecipeDef & { sell: number; buff?: DishBuff; note: string };
/** Reference values for "any of a category" inputs (dish prices). */
const CAT_VALUE = { fish: 300, bug: 150, flower: 80, forage: 100 } as const;
const it = (item: string, n: number, q?: 0 | 1 | 2) => ({ item, n, ...(q ? { q } : {}) });
const anyOf = (cat: 'fish' | 'bug' | 'flower' | 'forage', n: number) => ({ cat, n });
const dish = (
  id: string,
  name: string,
  emoji: string,
  needs: (Need & { n: number })[],
  note: string,
  extra: { buff?: DishBuff; flag?: string } = {},
) => ({ id, name, emoji, needs, makes: id, count: 1, note, ...extra, sell: 0 });
// Crop sell prices are repeated here (lounge-life.ts is the authority; a test pins them equal).
export const CROP_SELL_REF: Record<string, number> = {
  carrot: 200,
  tomato: 480,
  pumpkin: 1_800,
  strawberry: 4_500,
  potato: 900,
  corn: 2_400,
  watermelon: 8_000,
  sweetpotato: 3_000,
  cabbage: 3_600,
  spinach: 2_200,
};
const RAW_DISHES = [
  // Legacy island meals (life-data.ts MEALS).
  dish('salad', '햇살 샐러드', '🥗', [it('carrot', 1), it('tomato', 1)], '갓 딴 채소 그대로.', { buff: 'grow' }),
  dish('pumpkinsoup', '따끈한 호박 수프', '🍲', [it('carrot', 1), it('pumpkin', 1)], '쌀쌀한 날 한 그릇.'),
  dish('lunchbox', '여섯섬 도시락', '🍱', [it('carrot', 1), it('tomato', 1), it('pumpkin', 1)], '소풍 가는 날의 도시락.', { buff: 'forage' }),
  // New dishes from crops, fish and forage.
  dish('grilledfish', '생선구이', '🐟', [anyOf('fish', 1), it('wood', 1)], '모닥불에 노릇노릇.', { buff: 'luck' }),
  dish('maeuntang', '매운탕', '🍲', [anyOf('fish', 2), it('cabbage', 1)], '얼큰하게 속을 풀어 줘요.', { buff: 'luck' }),
  dish('jam', '딸기잼', '🍯', [it('strawberry', 2)], '빵에 발라 먹어요.'),
  dish('buttercorn', '옥수수 버터구이', '🌽', [it('corn', 2)], '여름 캠프의 맛.', { buff: 'bug' }),
  dish('hwachae', '수박화채', '🍉', [it('watermelon', 1), it('raspberry', 1)], '한여름 더위 탈출.', { buff: 'bug' }),
  dish('mattang', '고구마 맛탕', '🍠', [it('sweetpotato', 2)], '달콤 바삭.'),
  dish('kimchi', '김치', '🥬', [it('cabbage', 2)], '마을 김장의 결과물.', { buff: 'grow' }),
  dish('mushroomhotpot', '버섯전골', '🍄', [it('mushroom', 2), it('cabbage', 1)], '비 오는 날엔 전골.', { buff: 'forage' }),
  dish('ssukddeok', '쑥떡', '🍡', [it('mugwort', 3)], '봄을 한 입에.'),
  dish('bibimbap', '봄나물 비빔밥', '🍚', [it('shepherd', 1), it('wildgarlic', 1), it('carrot', 1)], '냉이와 달래를 듬뿍.', { buff: 'grow' }),
  dish('dotorimuk', '도토리묵', '🟫', [it('acorn', 3)], '탱글탱글 가을 별미.', { buff: 'forage' }),
  dish('roastchestnut', '군밤', '🌰', [it('chestnut', 3), it('wood', 1)], '호호 불어 먹어요.'),
  dish('spinachnamul', '시금치나물', '🥬', [it('spinach', 2)], '겨울 섬초의 단맛.', { buff: 'grow' }),
  dish('gamjajeon', '감자전', '🥔', [it('potato', 2)], '비 오는 날 생각나는 맛.'),
  dish('pumpkinpie', '호박파이', '🥧', [it('pumpkin', 2), it('chestnut', 1)], '할로윈의 주인공.'),
  dish('songpyeon', '송편', '🌙', [it('chestnut', 1), it('sweetpotato', 1), it('mugwort', 1)], '추석 보름달 아래 빚는 떡.', { flag: 'cafe' }),
  dish('tteokguk', '떡국', '🍜', [it('potato', 1), it('spinach', 1), anyOf('forage', 1)], '한 그릇 먹으면 한 살 더.', { flag: 'cafe' }),
  dish('fishstew', '해물탕', '🦑', [anyOf('fish', 3), it('potato', 1)], '바다 데크의 선물.', { flag: 'cafe', buff: 'luck' }),
  dish('flowertea', '꽃차', '🍵', [anyOf('flower', 3)], '향긋한 한 잔.', { flag: 'cafe', buff: 'bug' }),
];
function valueOfNeed(n: Need & { n: number }): number {
  if ('beom' in n) return 0;
  if ('cat' in n) return CAT_VALUE[n.cat] * n.n;
  const v = CROP_SELL_REF[n.item] ?? ITEM_BY_ID_RAW()[n.item]?.sell ?? 0;
  return v * n.n;
}
let rawItems: Record<string, { sell: number }> | null = null;
function ITEM_BY_ID_RAW() {
  if (!rawItems) {
    rawItems = {};
    for (const f of FORAGE) rawItems[f.id] = f;
  }
  return rawItems;
}
/** Dishes sell for 25% over their ingredients (+100범), rounded to 10. */
export const DISHES: readonly DishDef[] = RAW_DISHES.map((d) => ({
  ...d,
  sell: Math.round((d.needs.reduce((s, n) => s + valueOfNeed(n), 0) * 1.25 + 100) / 10) * 10,
}));

export const FERTILIZERS = ['fertilizer', 'fertilizer-deluxe'] as const;
export type FertilizerId = (typeof FERTILIZERS)[number];
/** Buyable consumables (a sink). */
export const ITEM_PRICES: Record<string, number> = {
  fertilizer: 400,
  'fertilizer-deluxe': 2_000,
  bait: 150,
};
const tools: ItemDef[] = [
  { id: 'fertilizer', name: '비료', emoji: '🧪', cat: 'tool', kind: 'tool', sell: 0, note: '품질 +1 (은별·금별 확률이 올라요)' },
  { id: 'fertilizer-deluxe', name: '고급 비료', emoji: '⚗️', cat: 'tool', kind: 'tool', sell: 0, note: '품질 +2, 성장 10% 빠르게' },
  { id: 'bait', name: '미끼', emoji: '🪱', cat: 'tool', kind: 'tool', sell: 0, note: '다음 낚시 한 번: 희귀 확률 2배' },
];
export const ITEMS: readonly ItemDef[] = [
  ...FISH.map((f): ItemDef => ({ id: f.id, name: f.name, emoji: f.emoji, cat: 'fish', kind: 'fish', sell: f.sell, note: f.note, museum: true })),
  ...BUGS.map((b): ItemDef => ({ id: b.id, name: b.name, emoji: b.emoji, cat: 'bug', kind: 'bug', sell: b.sell, note: b.note, museum: true })),
  ...FORAGE.map((f): ItemDef => ({
    id: f.id,
    name: f.name,
    emoji: f.emoji,
    cat: f.kind === 'flower' ? 'flower' : f.kind === 'material' ? 'material' : 'forage',
    kind: f.kind,
    sell: f.sell,
    note: f.note,
    museum: f.kind !== 'material',
  })),
  ...DISHES.map((d): ItemDef => ({ id: d.id, name: d.name, emoji: d.emoji, cat: 'dish', kind: 'dish', sell: d.sell, note: d.note, museum: true })),
  ...tools,
];
export const ITEM_BY_ID: Readonly<Record<string, ItemDef>> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const isItemId = (id: unknown): id is string =>
  typeof id === 'string' && Object.prototype.hasOwnProperty.call(ITEM_BY_ID, id);
export const FISH_BY_ID: Readonly<Record<string, FishDef>> = Object.fromEntries(FISH.map((f) => [f.id, f]));
export const DISH_BY_ID: Readonly<Record<string, DishDef>> = Object.fromEntries(DISHES.map((d) => [d.id, d]));

// ---------------------------------------------------------------- crafting
/**
 * Premium furniture ('furn-*'): the 16 legacy island DECOR pieces (prices =
 * legacy acorns × 250), colorways of existing room items, seasonal and
 * holiday limited pieces. Catalog entries live in lounge-bedroom-catalog.ts.
 */
export type FurnitureDef = {
  ref: string;
  name: string;
  price: number;
  /** Only in the shop during this season. */
  season?: Season;
  /** Only in the shop within 3 days of this holiday key (lounge-calendar HOLIDAYS). */
  holiday?: string;
  /** Not sold (craft / bundle / project / festival reward only). */
  unsold?: boolean;
  /**
   * 이번 주 명품 가구: never in the daily rotation; two pieces are on sale
   * each KST week (LUXURY_PER_WEEK), one copy per friend per week.
   */
  luxury?: boolean;
  /** Craft recipe (legacy island RECIPES: wood / flower / shell). */
  craft?: { wood: number; flower: number; shell: number };
};
const legacy = (ref: string, name: string, acorns: number, wood: number, flower: number, shell: number): FurnitureDef => ({
  ref: 'furn-' + ref,
  name,
  price: Math.round((acorns * 250) / 500) * 500,
  craft: { wood, flower, shell },
});
export const FURNITURE: readonly FurnitureDef[] = [
  legacy('plant', '꽃 화분', 24, 2, 1, 0),
  legacy('chair', '소풍 의자', 32, 3, 0, 0),
  legacy('lamp', '별빛 조명', 40, 2, 2, 2),
  legacy('tent', '작은 텐트', 60, 5, 1, 0),
  legacy('table', '원목 식탁', 48, 4, 0, 0),
  legacy('sofa', '푹신한 소파', 85, 6, 3, 0),
  legacy('bookshelf', '이야기 책장', 70, 5, 0, 0),
  legacy('logbed', '통나무 침대', 95, 6, 2, 0),
  legacy('rug', '체크 피크닉 매트', 42, 2, 3, 0),
  legacy('bench', '산책길 벤치', 55, 4, 1, 0),
  legacy('fence', '정원 울타리', 20, 1, 0, 0),
  legacy('fountain', '작은 분수', 120, 6, 4, 2),
  legacy('radio', '빈티지 라디오', 65, 4, 1, 2),
  legacy('planter', '정원 화단', 45, 3, 3, 0),
  legacy('fireplace', '따뜻한 벽난로', 110, 7, 2, 0),
  legacy('fruit-tree', '작은 귤나무', 80, 4, 2, 0),
  // Premium colorways of existing room items.
  { ref: 'furn-bed-mint', name: '민트 침대', price: 35_000 },
  { ref: 'furn-sofa-rose', name: '로즈 벤치 소파', price: 30_000 },
  { ref: 'furn-armchair-navy', name: '네이비 1인 소파', price: 18_000 },
  { ref: 'furn-rug-lilac', name: '라일락 울 러그', price: 15_000 },
  { ref: 'furn-bookcase-walnut', name: '월넛 5단 책장', price: 25_000 },
  { ref: 'furn-wardrobe-white', name: '화이트 옷장', price: 28_000 },
  // kArchive 3D model (lounge-bedroom-catalog.ts 'model' entry).
  { ref: 'furn-rocking-chair', name: '흔들의자', price: 26_000 },
  // Seasonal limited.
  { ref: 'furn-cherry-vase', name: '벚꽃 가지 화병', price: 12_000, season: 'spring' },
  { ref: 'furn-fan', name: '레트로 선풍기', price: 14_000, season: 'summer' },
  { ref: 'furn-maple-garland', name: '단풍 가랜드', price: 12_000, season: 'autumn' },
  { ref: 'furn-snowman', name: '눈사람 인형', price: 15_000, season: 'winter' },
  // Holiday limited.
  { ref: 'furn-moon-lantern', name: '보름달 등', price: 20_000, holiday: 'chuseok' },
  { ref: 'furn-lucky-pouch', name: '복주머니 장식', price: 18_000, holiday: 'seollal' },
  { ref: 'furn-jack-lantern', name: '호박 등불', price: 16_000, holiday: 'halloween' },
  { ref: 'furn-xmas-tree', name: '크리스마스 트리', price: 40_000, holiday: 'christmas' },
  // Bundle reward (not sold).
  { ref: 'furn-village-medal', name: '마을 복원 기념패', price: 0, unsold: true },
  // 이번 주 명품 가구 (weekly luxury rotation, a long-term 범 sink).
  { ref: 'furn-grand-piano', name: '그랜드 피아노', price: 240_000, luxury: true },
  { ref: 'furn-canopy-bed', name: '캐노피 침대', price: 280_000, luxury: true },
  { ref: 'furn-aquarium', name: '대형 수족관', price: 200_000, luxury: true },
  { ref: 'furn-crystal-lamp', name: '크리스탈 스탠드', price: 120_000, luxury: true },
  { ref: 'furn-gold-mirror', name: '금테 전신 거울', price: 150_000, luxury: true },
  { ref: 'furn-arcade', name: '레트로 오락기', price: 170_000, luxury: true },
  { ref: 'furn-telescope', name: '별 보는 망원경', price: 160_000, luxury: true },
  { ref: 'furn-mother-pearl', name: '자개 병풍', price: 220_000, luxury: true },
  { ref: 'furn-velvet-sofa', name: '벨벳 체스터필드 소파', price: 190_000, luxury: true },
  { ref: 'furn-bonsai', name: '명품 분재', price: 110_000, luxury: true },
  // Project and festival rewards (not sold).
  { ref: 'furn-project-plaque', name: '마을 공사 현판', price: 0, unsold: true },
  { ref: 'furn-festival-lantern', name: '축제 청사초롱', price: 0, unsold: true },
  { ref: 'furn-festival-drum', name: '축제 북', price: 0, unsold: true },
  { ref: 'furn-festival-kite', name: '축제 방패연', price: 0, unsold: true },
  { ref: 'furn-festival-fan', name: '축제 부채', price: 0, unsold: true },
];
export const LUXURY_PER_WEEK = 2;
export const FURNITURE_BY_REF: Readonly<Record<string, FurnitureDef>> = Object.fromEntries(FURNITURE.map((f) => [f.ref, f]));
export const isFurnitureRef = (ref: unknown): ref is string =>
  typeof ref === 'string' && Object.prototype.hasOwnProperty.call(FURNITURE_BY_REF, ref);
export const SHOP_DAILY_ITEMS = 6;
export const SHOP_BUY_MAX_N = 5;

export const CRAFTS: readonly RecipeDef[] = [
  ...FURNITURE.filter((f) => f.craft).map(
    (f): RecipeDef => ({
      id: f.ref,
      name: f.name,
      emoji: '🔨',
      needs: [
        ...(f.craft!.wood ? [it('wood', f.craft!.wood)] : []),
        ...(f.craft!.flower ? [anyOf('flower', f.craft!.flower)] : []),
        ...(f.craft!.shell ? [it('shell', f.craft!.shell)] : []),
      ],
      makes: f.ref,
      count: 1,
    }),
  ),
  { id: 'fertilizer', name: '비료', emoji: '🧪', needs: [it('wood', 1), it('pinecone', 1)], makes: 'fertilizer', count: 2 },
  { id: 'fertilizer-deluxe', name: '고급 비료', emoji: '⚗️', needs: [it('fertilizer', 2), it('stone', 2)], makes: 'fertilizer-deluxe', count: 1 },
  { id: 'bait', name: '미끼', emoji: '🪱', needs: [anyOf('bug', 1)], makes: 'bait', count: 3 },
];
export const CRAFT_BY_ID: Readonly<Record<string, RecipeDef>> = Object.fromEntries(CRAFTS.map((r) => [r.id, r]));

// ---------------------------------------------------------------- spots
export type SpawnSpot = { id: string; district: string; habitat: Habitat; x: number; z: number; flag?: string };
/** Named forage/bug spots per district (x/z are suggestions near VILLAGE_DISTRICTS points). */
export const SPAWN_SPOTS: readonly SpawnSpot[] = [
  { id: 'orchard-1', district: 'west-orchard', habitat: 'meadow', x: -34, z: 2 },
  { id: 'orchard-2', district: 'west-orchard', habitat: 'meadow', x: -29, z: 8 },
  { id: 'orchard-3', district: 'west-orchard', habitat: 'forest', x: -36, z: 9 },
  { id: 'camp-1', district: 'south-camp', habitat: 'shore', x: 2, z: 22 },
  { id: 'camp-2', district: 'south-camp', habitat: 'shore', x: 9, z: 25 },
  { id: 'camp-3', district: 'south-camp', habitat: 'meadow', x: 5, z: 27 },
  { id: 'east-1', district: 'east-boardwalk', habitat: 'meadow', x: 31, z: -8 },
  { id: 'east-2', district: 'east-boardwalk', habitat: 'shore', x: 35, z: -2 },
  { id: 'east-3', district: 'east-boardwalk', habitat: 'shore', x: 36, z: 12, flag: 'bridge' },
  { id: 'east-4', district: 'east-boardwalk', habitat: 'forest', x: 32, z: 18, flag: 'bridge' },
  // VILL-2: the forest walk moved 8 north with the resident row.
  { id: 'forest-1', district: 'north-forest', habitat: 'forest', x: -6, z: -31.6 },
  { id: 'forest-2', district: 'north-forest', habitat: 'forest', x: 4, z: -34.6 },
  { id: 'forest-3', district: 'north-forest', habitat: 'forest', x: 10, z: -31.6 },
  { id: 'forest-4', district: 'north-forest', habitat: 'meadow', x: -12, z: -31.2 },
  { id: 'falls-1', district: 'north-falls', habitat: 'forest', x: -33, z: -29.4 },
  { id: 'lake-1', district: 'east-lake', habitat: 'shore', x: 32.6, z: -23.6 },
  { id: 'beach-1', district: 'south-beach', habitat: 'shore', x: -8, z: 35 },
  { id: 'beach-2', district: 'south-beach', habitat: 'shore', x: 14, z: 35.2 },
];
export const SPOT_BY_ID: Readonly<Record<string, SpawnSpot>> = Object.fromEntries(SPAWN_SPOTS.map((s) => [s.id, s]));

// ---------------------------------------------------------------- bundles
export type BundleDef = {
  id: string;
  name: string;
  /** Village improvement flag set when complete. */
  flag: string;
  reward: string;
  slots: readonly (Need & { n: number })[];
};
export const VILLAGE_FLAGS: Record<string, string> = {
  bridge: '동쪽 다리 수리 · 바다 낚시터와 동쪽 채집 자리 2곳',
  greenhouse: '마을 온실 · 계절과 상관없이 심을 수 있어요',
  cafe: '노을 카페 · 송편·떡국·해물탕·꽃차 레시피',
  fountain: '광장 분수 · 매일 분수에 소원 빌기(작은 행운)',
  stage: '축제 무대 · 주간 이벤트 보너스 2배',
  museum: '박물관 2층 · 첫 기증 보상 2배',
  market: '장터 확장 · 가구 상점 매일 2종 더',
  dock: '선착장 · 여섯섬으로 가는 배 (다음 업데이트)',
  // 마을 공사 2차 (PROJECTS): big shared 범 projects.
  lights: '다리 등불 · 밤 바다 낚시 희귀 물고기 1.3배',
  plaza: '광장 대분수 · 분수 물빛 팔레트를 살 수 있어요',
  vip: '카지노 VIP룸 · 판돈 10만 범 테이블',
  greenhouse2: '온실 2동 · 모든 작물이 10% 빨리 자라요',
  festival: '축제 무대 조명 · 이번 주 명품 가구가 1종 더',
};
/**
 * 마을 공사 2차: shared 범-only public projects. Friends contribute any
 * amount (PROJECT_MIN_GIVE or what is left); when full the flag is set, the
 * village changes and every contributor gets a 마을 공사 현판 (no 범 back —
 * these are sinks). `requires`: a village flag that must exist first.
 */
export type ProjectDef = {
  id: string;
  name: string;
  flag: string;
  cost: number;
  requires?: string;
  /** Short description of the world change (board detail). */
  note: string;
};
export const PROJECTS: readonly ProjectDef[] = [
  { id: 'bridge-lights', name: '다리 보수와 등불', flag: 'lights', cost: 600_000, requires: 'bridge', note: '동쪽 다리 난간을 고치고 등불을 달아요. 밤바다가 환해져 희귀 물고기가 더 자주 와요.' },
  { id: 'plaza-fountain', name: '광장 대분수', flag: 'plaza', cost: 900_000, requires: 'fountain', note: '광장 분수를 3단 대분수로 키워요. 분수 물빛 팔레트가 상점에 들어와요.' },
  { id: 'greenhouse-wing', name: '온실 확장', flag: 'greenhouse2', cost: 1_200_000, requires: 'greenhouse', note: '온실 옆에 2동을 지어요. 마을 모든 밭의 작물이 10% 빨리 자라요.' },
  { id: 'casino-vip', name: '카지노 VIP룸', flag: 'vip', cost: 1_500_000, note: '별빛 카지노에 VIP룸을 열어요. 판돈 10만 범 테이블을 만들 수 있어요.' },
  { id: 'festival-stage', name: '마을 축제 무대', flag: 'festival', cost: 2_000_000, requires: 'stage', note: '광장 무대에 조명과 현수막을 달아요. 이번 주 명품 가구가 1종 더 들어와요.' },
];
export const PROJECT_BY_ID: Readonly<Record<string, ProjectDef>> = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
export const PROJECT_MIN_GIVE = 1_000;
/** Crop growth bonus (percent faster) once 온실 확장 is done. */
export const GREENHOUSE2_SPEED = 10;
/** Rare-fish weight multiplier at night on the sea deck once 다리 등불 is done. */
export const LIGHTS_RARE_BOOST = 1.3;
/**
 * 주간 마을 축제 기금: a recurring shared sink that resets every KST week
 * (Monday). When the week's goal is met, everyone who gave at least
 * FESTIVAL_SOUVENIR_MIN that week gets the week's souvenir (rotating).
 */
export const FESTIVAL_GOAL = 200_000;
export const FESTIVAL_SOUVENIR_MIN = 20_000;
export const FESTIVAL_SOUVENIRS = [
  'furn-festival-lantern',
  'furn-festival-drum',
  'furn-festival-kite',
  'furn-festival-fan',
] as const;
/**
 * 집 확장 단계 (per friend, bought in order, rising cost). Each tier unlocks
 * room styles (`walls`/`floors`, see lounge-bedroom-data.ts) and/or changes
 * the house outside in the village.
 */
export type HouseTier = {
  tier: 1 | 2 | 3 | 4;
  name: string;
  price: number;
  note: string;
  walls?: readonly string[];
  floors?: readonly string[];
};
export const HOUSE_TIERS: readonly HouseTier[] = [
  { tier: 1, name: '벽지 리모델링', price: 150_000, note: '프리미엄 벽지 4종(샴페인 골드·밤바다 남색·로즈 스모크·깊은 숲)', walls: ['gold', 'navy', 'rose', 'forest'] },
  { tier: 2, name: '바닥 시공', price: 400_000, note: '프리미엄 바닥 3종(대리석·헤링본·체리목)', floors: ['marble', 'herringbone', 'cherry'] },
  { tier: 3, name: '앞마당 정원', price: 900_000, note: '마을의 내 집 앞에 꽃밭과 등불이 생기고, 벽지 2종(달빛 은색·노을 테라코타)이 더 열려요', walls: ['silver', 'terracotta'] },
  { tier: 4, name: '2층 증축', price: 2_000_000, note: '마을의 내 집에 2층 다락과 명패가 올라가고, 벽지 “별밤 벨벳”과 바닥 “흑단”이 열려요', walls: ['velvet'], floors: ['ebony'] },
];
export const HOUSE_UNLOCK = (tier: number) => `house-${tier}`;
/** 오늘의 가구 새로고침: price of the n-th reroll today (n from 0), at most SHOP_REROLL_MAX. */
export const SHOP_REROLL_MAX = 5;
export const shopRerollPrice = (n: number) => 3_000 * 2 ** n;
export const BUNDLES: readonly BundleDef[] = [
  { id: 'spring-forage', name: '봄나물 꾸러미', flag: 'bridge', reward: '동쪽 다리 수리', slots: [it('mugwort', 5), it('shepherd', 5), it('wildgarlic', 3), it('azalea', 3), { beom: true, n: 100_000 }] },
  { id: 'summer-harvest', name: '여름 수확 꾸러미', flag: 'greenhouse', reward: '마을 온실', slots: [it('tomato', 10, 1), it('corn', 8), it('watermelon', 3), it('strawberry', 3, 2), { beom: true, n: 300_000 }] },
  { id: 'autumn-harvest', name: '가을 수확 꾸러미', flag: 'cafe', reward: '노을 카페', slots: [it('pumpkin', 10), it('sweetpotato', 8), it('cabbage', 6), it('chestnut', 5)] },
  { id: 'winter-gifts', name: '겨울 선물 꾸러미', flag: 'fountain', reward: '광장 분수', slots: [it('spinach', 5), it('camellia', 3), it('smelt', 3), it('snowfly', 2), it('pinecone', 10)] },
  { id: 'river-fish', name: '강의 물고기 꾸러미', flag: 'stage', reward: '축제 무대', slots: [it('crucian', 3), it('carp', 2), it('sweetfish', 1), it('catfish', 1), it('mandarin', 1), it('trout', 1)] },
  { id: 'bug-garden', name: '곤충 정원 꾸러미', flag: 'museum', reward: '박물관 2층', slots: [it('butterfly', 1), it('cicada', 1), it('firefly', 1), it('dragonfly', 1), it('cricket', 1), it('beetle', 1)] },
  { id: 'workshop', name: '공방 꾸러미', flag: 'market', reward: '장터 확장', slots: [it('wood', 30), it('stone', 20), it('fertilizer', 5), it('shell', 5), { beom: true, n: 200_000 }] },
  { id: 'village-fund', name: '마을 기금', flag: 'dock', reward: '선착장', slots: [{ beom: true, n: 1_000_000 }, it('lunchbox', 3), it('grilledfish', 3)] },
];
export const BUNDLE_BY_ID: Readonly<Record<string, BundleDef>> = Object.fromEntries(BUNDLES.map((b) => [b.id, b]));
/** Every contributor gets this when a bundle completes (plus a 기념패 once). */
export const BUNDLE_REWARD_BEOM = 3_000;

// ---------------------------------------------------------------- achievements
export type StatKey =
  | 'harvest'
  | 'gold'
  | 'water'
  | 'waterFriend'
  | 'fish'
  | 'bug'
  | 'forage'
  | 'cook'
  | 'craft'
  | 'donate'
  | 'gift'
  | 'request'
  | 'visit'
  | 'tables'
  | 'earned'
  | 'bundle'
  | 'furniture'
  | 'dex'
  | 'record'
  | 'event';
export const STAT_KEYS: readonly StatKey[] = [
  'harvest', 'gold', 'water', 'waterFriend', 'fish', 'bug', 'forage', 'cook', 'craft', 'donate',
  'gift', 'request', 'visit', 'tables', 'earned', 'bundle', 'furniture', 'dex', 'record', 'event',
];
export type AchievementDef = { id: string; name: string; text: string; stat: StatKey; goal: number; reward: number };
const ach = (id: string, name: string, text: string, stat: StatKey, goal: number, reward: number): AchievementDef => ({ id, name, text, stat, goal, reward });
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  ach('harvest-1', '첫 수확', '작물을 처음 수확했어요', 'harvest', 1, 500),
  ach('harvest-100', '부지런한 농부', '작물 100개 수확', 'harvest', 100, 3_000),
  ach('harvest-1000', '범타듀의 곳간', '작물 1,000개 수확', 'harvest', 1_000, 15_000),
  ach('gold-1', '금별 하나', '금별 작물 수확', 'gold', 1, 1_000),
  ach('gold-50', '황금 들판', '금별 작물 50개', 'gold', 50, 8_000),
  ach('water-100', '물뿌리개 장인', '물 주기 100번', 'water', 100, 2_000),
  ach('waterfriend-1', '품앗이', '친구 밭에 처음 물 주기', 'waterFriend', 1, 500),
  ach('waterfriend-30', '마을의 단비', '친구 밭에 30번 물 주기', 'waterFriend', 30, 5_000),
  ach('fish-1', '첫 입질', '물고기를 처음 낚았어요', 'fish', 1, 500),
  ach('fish-100', '강태공', '물고기 100마리', 'fish', 100, 5_000),
  ach('fish-500', '바다의 전설', '물고기 500마리', 'fish', 500, 15_000),
  ach('bug-1', '잠자리채 데뷔', '곤충을 처음 잡았어요', 'bug', 1, 500),
  ach('bug-100', '곤충 박사', '곤충 100마리', 'bug', 100, 5_000),
  ach('forage-10', '숲길 산책', '채집 10번', 'forage', 10, 500),
  ach('forage-200', '숲의 친구', '채집 200번', 'forage', 200, 5_000),
  ach('cook-1', '첫 요리', '요리를 처음 만들었어요', 'cook', 1, 500),
  ach('cook-50', '마을 요리사', '요리 50번', 'cook', 50, 5_000),
  ach('craft-1', '뚝딱뚝딱', '처음으로 무언가 만들었어요', 'craft', 1, 500),
  ach('craft-30', '공방 장인', '제작 30번', 'craft', 30, 5_000),
  ach('donate-1', '첫 기증', '박물관에 처음 기증했어요', 'donate', 1, 500),
  ach('donate-30', '박물관 후원자', '첫 기증 30종', 'donate', 30, 10_000),
  ach('gift-1', '마음을 담아', '친구에게 선물 보내기', 'gift', 1, 300),
  ach('gift-50', '선물 요정', '선물 50번', 'gift', 50, 5_000),
  ach('request-5', '해결사', '친구 부탁 5번 들어주기', 'request', 5, 1_000),
  ach('request-50', '마을의 해결사', '친구 부탁 50번', 'request', 50, 8_000),
  ach('visit-10', '마실 다니기', '친구 방 10번 방문', 'visit', 10, 1_000),
  ach('tables-10', '테이블의 단골', '테이블 게임 10판', 'tables', 10, 1_000),
  ach('earned-1m', '백만장자 농부', '판매로 100만 범 벌기', 'earned', 1_000_000, 10_000),
  ach('bundle-1', '마을 복원 첫걸음', '꾸러미에 처음 기여', 'bundle', 1, 500),
  ach('bundle-50', '복원 일꾼', '꾸러미에 50번 기여', 'bundle', 50, 8_000),
  ach('furniture-5', '인테리어 입문', '가구 5개 사기·만들기', 'furniture', 5, 1_000),
  ach('dex-30', '도감 수집가', '도감 30종', 'dex', 30, 3_000),
  ach('dex-80', '걸어 다니는 도감', '도감 80종', 'dex', 80, 12_000),
  ach('record-1', '월척!', '마을 최대어 기록 세우기', 'record', 1, 2_000),
  ach('event-5', '명절 부자', '명절·생일 선물 5번 받기', 'event', 5, 2_000),
];
export const ACHIEVEMENT_BY_ID: Readonly<Record<string, AchievementDef>> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// ---------------------------------------------------------------- actions
/** Life-expansion action kinds (handled by lounge-life-plus.ts). */
export const PLUS_ACTION_KINDS = [
  'fertilize',
  'expandFarm',
  'waterFriend',
  'buyFurniture',
  'buyItem',
  'upgradeRod',
  'cast',
  'reel',
  'forage',
  'catch',
  'sellItem',
  'donate',
  'cook',
  'craft',
  'eat',
  'contribute',
  'deliver',
  'claimEvent',
  'wish',
  'project',
  'festival',
  'upgradeHouse',
  'rerollShop',
] as const;
export type PlusActionKind = (typeof PLUS_ACTION_KINDS)[number];

// ---------------------------------------------------------------- helpers
export const eligibleSky = (sky: Sky, weather: Weather) =>
  sky === 'any' || (sky === 'rain' ? weather === 'rain' || weather === 'storm' : weather !== 'rain' && weather !== 'storm');
export const eligibleTime = (when: When, daytime: boolean, nighttime: boolean) =>
  when === 'any' || (when === 'day' ? daytime : nighttime);
