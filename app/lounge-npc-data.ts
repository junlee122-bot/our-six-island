// The village's adult residents (NPCs), one registry for all of them: the
// eight who already work in the village (dealers, shopkeepers, service desks),
// the six stage-1 residents of 시장 거리 (handover/design/
// design-village-2x-npcs.md §8) and the eight stage-2 residents of the harbor
// and the hillside (design-npcs-stage2.md §7). A resident may carry
// `hasSprite: false` while their picture is missing: nothing draws or lists
// them then (VISIBLE_NPC_IDS). Pure data shared by the server (relations,
// gifts, requests) and the client (dialogue, sprites, schedules). All
// residents are adults and all can be dated (user decision 2026-09-30).
//
// Gift tastes are selectors over item ids:
//   'carrot'        one item id
//   'kind:flower'   every item of that kind (fish, bug, flower, forage, dish, material, fossil)
//   'crop'          any crop (and 'crop:gold' = a 금별 crop, 'fruit' = orchard fruit)
//   'gem', 'fossil' shorthands for the mine finds
// A gift is checked loved → disliked → liked; anything else is "neutral".
import { LOUNGE_ASSETS } from './lounge-assets.ts';

export const NPC_IDS = [
  'lumi',
  'maehwa',
  'captain',
  // 범마을 부동산: 신형만 keeps the old 'realtor' id (and its saved rows), 봉미선 joined 2026-10-02.
  'realtor',
  'misun',
  'carpenter',
  'rose',
  'nyamo',
  'gwen',
  'nasera',
  'frieren',
  'thresh',
  'sinjjajang',
  'volibas',
  'janna',
  // Stage 2 (harbor, hillside, travelling).
  'gabung',
  'lux',
  'himmel',
  'beatrice',
  'bocchi',
  'tsunade',
  'makima',
  'yanineko',
] as const;
export type NpcId = (typeof NPC_IDS)[number];
export const isNpcId = (id: unknown): id is NpcId => typeof id === 'string' && (NPC_IDS as readonly string[]).includes(id);
/** The six residents who walk between the hub, 시장 거리 and the tavern (stage 1). */
export const WALKING_NPCS = ['nasera', 'frieren', 'thresh', 'sinjjajang', 'volibas', 'janna'] as const;
export type WalkingNpcId = (typeof WALKING_NPCS)[number];
export const isWalkingNpc = (id: unknown): id is WalkingNpcId =>
  typeof id === 'string' && (WALKING_NPCS as readonly string[]).includes(id);
/** The stage-2 residents of the harbor and the hillside (they walk like the six above). */
export const STAGE2_NPCS = ['gabung', 'lux', 'himmel', 'beatrice', 'bocchi', 'tsunade', 'makima', 'yanineko'] as const;
export type Stage2NpcId = (typeof STAGE2_NPCS)[number];

export type NpcArt =
  /** A 3×2 pose sheet (lounge-host-sprites.ts). */
  | { kind: 'sheet'; host: 'lumi' | 'maehwa' | 'captain' | 'carpenter' }
  /** One keyed full-body image (660×990) and, for dialogue, a head-and-shoulders crop. */
  | { kind: 'image'; asset: string; portrait?: string; foot: number }
  /** No picture yet (stage 2): never drawn; `hasSprite` is false. */
  | { kind: 'pending' };

export type GiftTaste = { loved: readonly string[]; liked: readonly string[]; disliked: readonly string[] };
export type NpcDef = {
  id: NpcId;
  name: string;
  age: number;
  /** Job title ("농협 조합장"). */
  role: string;
  /** Where they work (shown in the notebook). */
  place: string;
  /** One line about them (the notebook card). */
  intro: string;
  /** Loved / disliked, said in words (the notebook card). */
  likesText: string;
  dislikesText: string;
  gifts: GiftTaste;
  /** One-time presents at 40 and 100 points (item id, count). */
  rewards: { 40: readonly [string, number]; 100: readonly [string, number] };
  art: NpcArt;
  /** Voice for dialogue: 'polite' 해요체, 'casual' 반말, 'formal' 하십시오체. */
  speech: 'polite' | 'casual' | 'formal';
  /** Shown instead of the age ("나이는 비밀"). */
  ageText?: string;
  /** False until the resident has a sprite: not drawn, not listed, cannot be met. */
  hasSprite?: boolean;
  /** Expansion stage the resident arrived with. */
  stage?: 2;
};

const img = (asset: string, portrait?: string, foot = 0.985): NpcArt => ({ kind: 'image', asset, ...(portrait ? { portrait } : {}), foot });
const A = LOUNGE_ASSETS;

export const NPCS: Record<NpcId, NpcDef> = {
  lumi: {
    id: 'lumi',
    name: '루미',
    age: 25,
    role: '별빛 카지노 딜러',
    place: '별빛 카지노',
    intro: '쉬는 날에는 꽃을 구경하고 작은 카페를 찾아다녀요.',
    likesText: '꽃, 달콤한 음료',
    dislikesText: '벌레, 쓴 나물',
    gifts: { loved: ['kind:flower'], liked: ['flowertea', 'jam', 'hwachae', 'strawberry'], disliked: ['kind:bug', 'mugwort'] },
    rewards: { 40: ['flowertea', 2], 100: ['camellia', 3] },
    art: { kind: 'sheet', host: 'lumi' },
    speech: 'casual',
  },
  maehwa: {
    id: 'maehwa',
    name: '매화',
    age: 27,
    role: '화투방 진행자',
    place: '범마을 회관',
    intro: '따뜻한 차와 정성껏 차린 한 끼를 좋아해요.',
    likesText: '직접 만든 요리, 차',
    dislikesText: '날생선, 벌레',
    gifts: { loved: ['kind:dish'], liked: ['kind:flower', 'chestnut', 'ginseng'], disliked: ['kind:bug', 'kind:fish'] },
    rewards: { 40: ['songpyeon', 2], 100: ['ginseng', 2] },
    art: { kind: 'sheet', host: 'maehwa' },
    speech: 'casual',
  },
  captain: {
    id: 'captain',
    name: '허 선장',
    age: 46,
    role: '허풍 주점 주인',
    place: '허풍 주점',
    intro: '바다에서 본 것보다 본 척한 게 더 많다는 소문이 있어요.',
    likesText: '큰 바닷고기, 군밤',
    dislikesText: '시금치, 꽃다발',
    gifts: { loved: ['yellowtail', 'hairtail', 'moonhairtail', 'octopus', 'squid'], liked: ['kind:fish', 'roastchestnut', 'grilledfish', 'fishstew'], disliked: ['spinach', 'spinachnamul', 'kind:flower'] },
    rewards: { 40: ['bait', 5], 100: ['gem', 1] },
    art: { kind: 'sheet', host: 'captain' },
    speech: 'casual',
  },
  // 신형만 · 봉미선 (짱구는 못말려 / Crayon Shin-chan, Yoshito Usui / Futabasha): a married
  // couple running 범마을 부동산 in turns (lounge-npc-schedule.ts realtyDuty).
  realtor: {
    id: 'realtor',
    name: '신형만',
    age: 35,
    role: '범마을 부동산 중개인',
    place: '범마을 부동산',
    intro: '월·수·금 부동산을 지키는 피곤하지만 다정한 아빠. 회사 다니던 시절 영업 실적 자랑이 끝이 없고, 퇴근 후 맥주 한 잔에 살아요.',
    likesText: '맥주 안주(오징어, 생선구이, 해물파전), 든든한 요리',
    dislikesText: '달팽이, 쓴 나물',
    gifts: { loved: ['squid', 'grilledfish', 'haemuljeon', 'sashimi'], liked: ['kind:dish', 'kind:fish', 'roastchestnut', 'gamjajeon'], disliked: ['snail', 'mugwort', 'spinachnamul'] },
    rewards: { 40: ['grilledfish', 2], 100: ['gold', 2] },
    art: img(A.npc_shinhyungman, A.npc_shinhyungman_portrait),
    speech: 'polite',
  },
  misun: {
    id: 'misun',
    name: '봉미선',
    age: 29,
    role: '범마을 부동산 실장',
    place: '범마을 부동산',
    intro: '화·목 부동산을 맡는 알뜰한 실장님. 흥정은 마을 최강이고, 세일 소식엔 누구보다 빨라요. 형만 씨 잔소리 담당.',
    likesText: '달콤한 디저트, 반짝이는 보석, 싸고 싱싱한 작물',
    dislikesText: '벌레, 쓸데없는 잡동사니',
    gifts: { loved: ['pumpkinpie', 'vanillapudding', 'jam', 'gem'], liked: ['crop', 'fruit', 'kind:flower', 'mattang', 'hwachae'], disliked: ['kind:bug', 'stone', 'wood'] },
    rewards: { 40: ['jam', 3], 100: ['gem', 1] },
    art: img(A.npc_bongmison, A.npc_bongmison_portrait),
    speech: 'polite',
  },
  // 발키리 (Clash Royale / Clash of Clans, Supercell) recast as the village
  // carpenter (user request 2026-10-01). The id stays 'carpenter' so hearts
  // carry over; the counter keeps the pose sheet (host 'carpenter'), dialogue
  // and the village use the tall art and the chibi. Voice and arc notes:
  // app/lounge-npc-lines-carpenter.ts.
  carpenter: {
    id: 'carpenter',
    name: '발키리',
    age: 30,
    role: '나무결 가구점 목수',
    place: '나무결 가구점',
    intro: '도끼 한 자루로 가구를 짜는 목수. 입만 열면 시비지만, 부탁하면 투덜대면서 다 해 줘요.',
    likesText: '단단한 나무, 좋은 도끼날 감(철·금), 매운 음식',
    dislikesText: '꽃다발, 달달한 차',
    gifts: {
      loved: ['hardwood', 'iron', 'gold', 'maeuntang', 'kimchi'],
      liked: ['wood', 'copper', 'pinecone', 'acorn', 'fishstew', 'pepperpotato', 'grilledfish', 'roastchestnut'],
      disliked: ['kind:flower', 'flowertea', 'jam'],
    },
    rewards: { 40: ['hardwood', 3], 100: ['iron', 5] },
    art: img(A.npc_valkyrie, A.npc_valkyrie_portrait),
    speech: 'casual',
  },
  rose: {
    id: 'rose',
    name: '로제',
    age: 31,
    role: '카지노 대부',
    place: '별빛 카지노',
    intro: '조건은 짧게, 이자는 정확하게. 바다 이야기엔 말이 길어져요.',
    likesText: '귀한 바닷고기, 보석',
    dislikesText: '쑥, 채소 요리',
    gifts: { loved: ['seabream', 'yellowtail', 'gem'], liked: ['kind:fish', 'gold', 'fishstew'], disliked: ['mugwort', 'spinachnamul', 'kimchi'] },
    rewards: { 40: ['bait', 5], 100: ['gem', 2] },
    art: img(A.casinoLenderSprite, A.casinoLenderFace, 0.9808),
    speech: 'casual',
  },
  nyamo: {
    id: 'nyamo',
    name: '냐모',
    age: 26,
    role: '범마을 은행원',
    place: '범마을 은행',
    intro: '장부는 한 번에 맞추고, 점심은 생선이면 다 좋대요.',
    likesText: '생선, 생선구이',
    dislikesText: '김치, 매운 요리',
    gifts: { loved: ['mackerel', 'grilledfish', 'crucian', 'sweetfish'], liked: ['kind:fish', 'jam'], disliked: ['kimchi', 'maeuntang', 'wildgarlic'] },
    rewards: { 40: ['grilledfish', 2], 100: ['goldcarp', 1] },
    art: img(A.bankClerkSprite, A.bankClerkFace, 0.9859),
    speech: 'polite',
  },
  gwen: {
    id: 'gwen',
    name: '그웬',
    age: 24,
    role: '미용실 원장',
    place: '보송 미용실',
    intro: '가위 소리가 음악 같다는 원장님. 예쁜 것엔 칭찬이 끝이 없어요.',
    likesText: '동백·코스모스 같은 꽃, 딸기',
    dislikesText: '벌레, 돌',
    gifts: { loved: ['camellia', 'cosmos', 'azalea'], liked: ['kind:flower', 'strawberry', 'jam', 'flowertea'], disliked: ['kind:bug', 'stone'] },
    rewards: { 40: ['flowertea', 2], 100: ['camellia', 5] },
    art: img(A.salonStylistSprite, A.salonStylistFace, 0.9859),
    speech: 'polite',
  },
  nasera: {
    id: 'nasera',
    name: '나세라',
    age: 34,
    role: '농협 조합장',
    place: '시장 거리 농협',
    intro: '무뚝뚝하고 규칙에 엄격해요. 작물과 책 얘기가 나오면 말이 길어져요.',
    likesText: '금별 작물, 오래된 화석, 보석',
    dislikesText: '돌·나무 같은 잡동사니, 벌레',
    gifts: { loved: ['crop:gold', 'fossil', 'gem'], liked: ['crop', 'fruit', 'kimchi', 'bibimbap'], disliked: ['stone', 'wood', 'kind:bug'] },
    rewards: { 40: ['fertilizer-deluxe', 3], 100: ['fertilizer-deluxe', 8] },
    art: img(A.npc_nasera, A.npc_nasera_portrait),
    speech: 'formal',
  },
  frieren: {
    id: 'frieren',
    name: '프리렌',
    age: 1000,
    role: '빵집 카페 사장',
    place: '시장 거리 빵집 카페',
    intro: '천 살 된 엘프예요. 이상한 빵 레시피를 모으고, 아침잠이 많아 가게를 늦게 열어요.',
    likesText: '달콤한 과일·디저트, 처음 보는 꽃, 옛 화석',
    dislikesText: '쓴 나물, 이른 아침',
    gifts: { loved: ['jam', 'hwachae', 'mattang', 'strawberry', 'fossil-leaf', 'fossil-fern'], liked: ['kind:flower', 'raspberry', 'watermelon', 'fruit', 'pumpkinpie', 'fossil'], disliked: ['mugwort', 'ginseng', 'spinachnamul'] },
    rewards: { 40: ['jam', 3], 100: ['pumpkinpie', 3] },
    art: img(A.npc_frieren, A.npc_frieren_portrait),
    speech: 'casual',
  },
  thresh: {
    id: 'thresh',
    name: '쓰레쉬',
    age: 29,
    role: '잡화점 주인',
    place: '시장 거리 잡화점',
    intro: '능글맞게 웃는 수집광 사장님. 손님이 판 물건은 절대 버리지 않아요.',
    likesText: '보석·화석 같은 수집품, 밤에 잡은 물고기',
    dislikesText: '해바라기처럼 밝은 것, 흔한 돌',
    gifts: { loved: ['gem', 'fossil', 'moonhairtail', 'eel'], liked: ['kind:fish', 'gold', 'iron', 'firefly', 'shell'], disliked: ['sunflower', 'stone', 'jam'] },
    rewards: { 40: ['bait', 6], 100: ['gem', 3] },
    art: img(A.npc_thresh, A.npc_thresh_portrait),
    speech: 'polite',
  },
  sinjjajang: {
    id: 'sinjjajang',
    name: '신짜장',
    age: 36,
    role: '우체부',
    place: '시장 거리 우체국',
    intro: '배달을 "임무"라고 부르는 우직한 우체부. 이름 때문에 짜장면 얘기에 약해요.',
    likesText: '든든한 요리, 감자·양배추, 편지',
    dislikesText: '달팽이, 늦잠',
    gifts: { loved: ['gamjajeon', 'lunchbox', 'tteokguk', 'potato', 'cabbage'], liked: ['kind:dish', 'corn', 'sweetpotato'], disliked: ['snail', 'kind:flower'] },
    rewards: { 40: ['lunchbox', 2], 100: ['tteokguk', 3] },
    art: img(A.npc_sinjjajang, A.npc_sinjjajang_portrait),
    speech: 'formal',
  },
  volibas: {
    id: 'volibas',
    name: '볼리바스',
    age: 42,
    role: '순경',
    place: '시장 거리 파출소',
    intro: '콧수염을 쓸며 수사 드라마처럼 말하는 호탕한 순경. 동네 사람에게는 다정해요.',
    likesText: '연어 같은 민물고기, 달콤한 잼, 프리렌네 빵',
    dislikesText: '벌레 장난, 새치기',
    gifts: { loved: ['trout', 'sweetfish', 'lenok', 'jam'], liked: ['kind:fish', 'kind:dish', 'honeybee'], disliked: ['snail', 'cicada', 'mugwort'] },
    rewards: { 40: ['grilledfish', 2], 100: ['goldcarp', 1] },
    art: img(A.npc_volibas, A.npc_volibas_portrait),
    speech: 'casual',
  },
  janna: {
    id: 'janna',
    name: '잔나',
    age: 28,
    role: '신문 기자',
    place: '시장 거리 신문사',
    intro: '밝고 수다스러운 기자. 날씨 예보가 특기인데 가끔 틀려요.',
    likesText: '꽃차 같은 음료, 꽃, 특종이 될 발견물',
    dislikesText: '달팽이, 마감 직전의 방해',
    gifts: { loved: ['flowertea', 'fossil', 'goldcarp', 'skygazer'], liked: ['kind:flower', 'kind:dish', 'gem'], disliked: ['snail', 'stone', 'mugwort'] },
    rewards: { 40: ['flowertea', 3], 100: ['gem', 1] },
    art: img(A.npc_janna, A.npc_janna_portrait),
    speech: 'polite',
  },
  // ------------------------------------------------------------ stage 2
  gabung: {
    id: 'gabung',
    name: '가붕',
    age: 34,
    role: '등대지기',
    place: '항구 등대',
    intro: '목소리 크고 정의감 넘치는 등대지기. 폭풍이 오면 등대 꼭대기에서 신이 나요.',
    likesText: '든든한 요리, 밤에 잡은 물고기, 광산 금속',
    dislikesText: '달팽이, 쑥',
    gifts: { loved: ['lunchbox', 'grilledfish', 'hairtail', 'conger'], liked: ['kind:dish', 'iron', 'gold', 'rockfish', 'kind:fish'], disliked: ['snail', 'mugwort'] },
    rewards: { 40: ['grilledfish', 2], 100: ['gold', 2] },
    art: img(A.npc_gabung, A.npc_gabung_portrait),
    speech: 'casual',
    stage: 2,
  },
  lux: {
    id: 'lux',
    name: '럭스',
    age: 26,
    role: '어시장 상인 · 낚시조합장',
    place: '항구 어시장',
    intro: '가붕의 여동생. 새벽 경매 때 목청이 제일 큰 밝은 흥정꾼이에요.',
    likesText: '반짝이는 보석, 달콤한 디저트, 귀한 물고기',
    dislikesText: '흔한 돌, 달팽이',
    gifts: { loved: ['gem', 'pumpkinpie', 'jam', 'seabream'], liked: ['kind:fish', 'hwachae', 'mattang', 'gold'], disliked: ['stone', 'snail'] },
    rewards: { 40: ['bait-shrimp', 6], 100: ['gem', 1] },
    art: img(A.npc_lux, A.npc_lux_portrait),
    speech: 'polite',
    stage: 2,
  },
  himmel: {
    id: 'himmel',
    name: '힘멜',
    age: 24,
    role: '빵집 알바생',
    place: '시장 거리 빵집 카페',
    intro: '자칭 마을의 용사. 늦잠 자는 사장 대신 빵집 문을 열고, 광장 동상 청원을 받으러 다녀요.',
    likesText: '꽃, 보석, 빵집 신메뉴',
    dislikesText: '돌멩이, 달팽이',
    gifts: { loved: ['camellia', 'cosmos', 'gem', 'pumpkinpie'], liked: ['kind:flower', 'jam', 'kind:dish'], disliked: ['stone', 'snail'] },
    rewards: { 40: ['camellia', 2], 100: ['gem', 1] },
    art: img(A.npc_himmel, A.npc_himmel_portrait),
    speech: 'casual',
    stage: 2,
  },
  beatrice: {
    id: 'beatrice',
    name: '베아트리스',
    age: 400,
    ageText: '수백 년',
    role: '도서관 사서',
    place: '언덕 도서관',
    intro: '수백 년 동안 도서관을 지켜 온 대정령. 연체에는 가장 엄격한 거야.',
    likesText: '옛 화석, 꽃차, 달콤한 과자',
    dislikesText: '시끄러운 벌레, 달팽이',
    gifts: { loved: ['kind:fossil', 'flowertea', 'jam'], liked: ['mattang', 'hwachae', 'kind:flower', 'pumpkinpie'], disliked: ['cicada', 'cricket', 'snail'] },
    rewards: { 40: ['flowertea', 3], 100: ['fossil-fern', 1] },
    art: img(A.npc_beatrice, A.npc_beatrice_portrait),
    speech: 'casual',
    stage: 2,
  },
  bocchi: {
    id: 'bocchi',
    name: '봇치',
    age: 22,
    role: '떠돌이 악사',
    place: '허풍 주점 무대',
    intro: '낯을 몹시 가려 말을 더듬지만, 기타를 잡으면 사람이 바뀌는 악사예요.',
    likesText: '조용히 먹는 간식, 단단한 나무, 조개',
    dislikesText: '매미, 메뚜기처럼 시끄러운 것',
    gifts: { loved: ['mattang', 'roastchestnut', 'dotorimuk'], liked: ['kind:dish', 'hardwood', 'shell'], disliked: ['cicada', 'grasshopper'] },
    rewards: { 40: ['roastchestnut', 2], 100: ['hardwood', 3] },
    art: img(A.npc_bocchi, A.npc_bocchi_portrait),
    speech: 'polite',
    stage: 2,
  },
  tsunade: {
    id: 'tsunade',
    name: '츠나데',
    age: 50,
    ageText: '나이는 비밀',
    role: '텃밭 할머니',
    place: '언덕 텃밭',
    intro: '겉모습은 젊은데 나이 얘기만 나오면 화내는 텃밭 할머니. 약초에 밝고 도박은 늘 져요.',
    likesText: '약초, 제철 채소 요리, 주점 안주',
    dislikesText: '달팽이, 흔한 돌',
    gifts: { loved: ['ginseng', 'kimchi', 'spinachnamul', 'haemuljeon'], liked: ['kind:forage', 'crop', 'kind:dish'], disliked: ['snail', 'stone'] },
    rewards: { 40: ['fertilizer-deluxe', 2], 100: ['ginseng', 1] },
    art: img(A.npc_tsunade, A.npc_tsunade_portrait),
    speech: 'casual',
    stage: 2,
  },
  makima: {
    id: 'makima',
    name: '마키마',
    age: 30,
    ageText: '성인',
    role: '떠돌이 행상인',
    place: '장날 좌판 · 항구',
    intro: '늘 차분하게 웃는 행상인. 거래를 계약이라고 부르고, 냄새로 사람을 알아봐요.',
    likesText: '맛있는 요리라면 무엇이든, 개, 영화',
    dislikesText: '계약을 어기는 손님',
    gifts: { loved: ['kind:dish'], liked: ['kind:fish', 'fruit', 'crop'], disliked: ['snail', 'stone'] },
    rewards: { 40: ['sashimi', 1], 100: ['gem', 2] },
    art: img(A.npc_makima, A.npc_makima_portrait),
    speech: 'polite',
    stage: 2,
  },
  yanineko: {
    id: 'yanineko',
    name: '야니네코',
    age: 22,
    role: '동네 대학생',
    place: '청년 자취방',
    intro: '늘 나른한 고양이 귀 대학생. 게으른 척하지만 머리가 좋고, 잔나에게 동네 소문을 흘려줘요.',
    likesText: '생선 요리, 따뜻한 음료, 햇볕 좋은 자리',
    dislikesText: '아침 수업, 비 오는 날의 달팽이',
    gifts: { loved: ['grilledfish', 'sashimi', 'fishstew', 'flowertea'], liked: ['kind:fish', 'kind:dish', 'jam'], disliked: ['snail', 'mugwort'] },
    rewards: { 40: ['grilledfish', 2], 100: ['sashimi', 2] },
    art: img(A.npc_yanineko, A.npc_yanineko_portrait),
    speech: 'casual',
    stage: 2,
  },
};

/**
 * Friends (lounge-roster ACTORS names) 발키리 talks to as 언니·동생; everyone
 * else gets her default 한남 ribbing (NpcLineSet.tone). The roster carries no
 * gender, so this stays for the friends to fill in (one name per entry).
 */
export const NPC_SISTER_FRIENDS: readonly string[] = ['도원', '민서'];

/** How residents relate to each other (their chats and a few events come from here). */
export type NpcBond = { a: NpcId; b: NpcId; kind: 'rival' | 'friend' | 'regular' | 'mentor' | 'crush' | 'partner'; note: string };
export const NPC_BONDS: readonly NpcBond[] = [
  { a: 'frieren', b: 'volibas', kind: 'regular', note: '볼리바스는 빵집 카페의 아침 단골' },
  { a: 'frieren', b: 'nasera', kind: 'friend', note: '도서관에서 자주 마주치는 책 친구' },
  { a: 'frieren', b: 'thresh', kind: 'rival', note: '옛 물건을 두고 경쟁하는 수집 라이벌' },
  { a: 'frieren', b: 'janna', kind: 'friend', note: '잔나는 신메뉴 시식회 취재 담당' },
  { a: 'frieren', b: 'sinjjajang', kind: 'regular', note: '점심 배달 가방에 빵을 챙겨 가는 사이' },
  { a: 'nasera', b: 'thresh', kind: 'rival', note: '씨앗 값과 재고를 두고 늘 티격태격' },
  { a: 'nasera', b: 'janna', kind: 'friend', note: '주간 시세 공지를 신문에 싣는 사이' },
  { a: 'volibas', b: 'thresh', kind: 'rival', note: '밤마다 등불 상점을 수상하게 보는 순경' },
  { a: 'volibas', b: 'janna', kind: 'friend', note: '사건 제보와 특종 사이' },
  { a: 'volibas', b: 'sinjjajang', kind: 'friend', note: '순찰과 배달 경로가 겹치는 동료' },
  { a: 'janna', b: 'sinjjajang', kind: 'crush', note: '잔나는 매일 신문을 받으러 우체국 앞에 서 있어요' },
  { a: 'sinjjajang', b: 'nasera', kind: 'regular', note: '농협 소포 담당' },
  { a: 'thresh', b: 'captain', kind: 'regular', note: '밤마다 주점에서 수집품 자랑' },
  { a: 'frieren', b: 'captain', kind: 'regular', note: '주점에서 조용히 우유를 시키는 손님' },
  { a: 'volibas', b: 'captain', kind: 'friend', note: '허풍 경연의 영원한 심판' },
  { a: 'nasera', b: 'maehwa', kind: 'friend', note: '회관 차 모임 친구' },
  { a: 'janna', b: 'lumi', kind: 'friend', note: '카지노의 밤 취재 파트너' },
  { a: 'thresh', b: 'rose', kind: 'rival', note: '보석 값 흥정 맞수' },
  { a: 'sinjjajang', b: 'nyamo', kind: 'regular', note: '은행 서류 배달' },
  { a: 'gwen', b: 'janna', kind: 'friend', note: '방송 전 머리 손질' },
  { a: 'realtor', b: 'carpenter', kind: 'partner', note: '집 확장 공사를 같이 하는 동업자' },
  { a: 'misun', b: 'realtor', kind: 'partner', note: '부동산을 번갈아 지키는 부부. 미선이 형만의 용돈을 관리해요' },
  { a: 'misun', b: 'carpenter', kind: 'regular', note: '공사비를 한 푼이라도 깎으려는 실장과 흥정ㄴㄴ 목수' },
  { a: 'realtor', b: 'captain', kind: 'regular', note: '퇴근하면 주점 바에 앉는 단골' },
  { a: 'misun', b: 'frieren', kind: 'regular', note: '마감 직전 빵 할인을 노리는 단골' },
  { a: 'misun', b: 'nasera', kind: 'rival', note: '농협 시세를 두고 한 푼까지 흥정하는 사이' },
  // 발키리 (2026-10-01): 한남 둘과는 말싸움, 언니 하나와 기자 하나와는 친구.
  { a: 'carpenter', b: 'captain', kind: 'rival', note: '주점 의자를 고쳐 주면서 허풍마다 시비' },
  { a: 'carpenter', b: 'volibas', kind: 'rival', note: '도끼 들고 다닌다고 검문, 검문한다고 시비' },
  { a: 'carpenter', b: 'janna', kind: 'friend', note: '가구점 바이럴을 태워 주는 기자' },
  { a: 'carpenter', b: 'tsunade', kind: 'friend', note: '텃밭 울타리를 고쳐 주는 동생과 언니' },
  // Stage 2 (design-npcs-stage2.md §3 and the cards).
  { a: 'lux', b: 'janna', kind: 'rival', note: '예보가 틀리면 조업을 망쳐서 늘 투덕거림' },
  { a: 'gabung', b: 'janna', kind: 'rival', note: '날씨 예보 대결, 누가 맞혔는지 신문에 실림' },
  { a: 'gabung', b: 'lux', kind: 'friend', note: '오빠와 여동생. 과보호와 도시락' },
  { a: 'beatrice', b: 'nasera', kind: 'friend', note: '책 친구, 주 1회 독서 모임' },
  { a: 'beatrice', b: 'himmel', kind: 'rival', note: '도서관에서 떠든다고 출입 경고' },
  { a: 'makima', b: 'thresh', kind: 'rival', note: '희귀품 경매 라이벌' },
  { a: 'makima', b: 'volibas', kind: 'rival', note: '수상한 행상인을 늘 뒤에서 캠' },
  { a: 'bocchi', b: 'himmel', kind: 'friend', note: '힘멜의 연애 상담역. 상담하다 본인이 더 긴장함' },
  { a: 'bocchi', b: 'frieren', kind: 'regular', note: '공연 중에 늘 조는 손님' },
  { a: 'himmel', b: 'frieren', kind: 'crush', note: '알바생과 사장. 힘멜의 짝사랑, 프리렌은 모름' },
  { a: 'yanineko', b: 'janna', kind: 'friend', note: '동네 소문 제보자와 기자' },
  { a: 'yanineko', b: 'himmel', kind: 'rival', note: '청년 둘의 숨바꼭질 내기 상대' },
  { a: 'yanineko', b: 'beatrice', kind: 'rival', note: '도서관에서 잔다고 쫓겨남' },
  { a: 'yanineko', b: 'lux', kind: 'regular', note: '어시장에서 생선을 얻어먹는 단골' },
  { a: 'tsunade', b: 'nasera', kind: 'mentor', note: '옛 스승과 제자' },
  { a: 'tsunade', b: 'rose', kind: 'rival', note: '카지노 빚 문제로 티격태격' },
  { a: 'tsunade', b: 'gabung', kind: 'mentor', note: '어릴 때부터 돌봐 준 동네 어른' },
  { a: 'tsunade', b: 'lux', kind: 'mentor', note: '어릴 때부터 돌봐 준 동네 어른' },
  { a: 'sinjjajang', b: 'gabung', kind: 'regular', note: '항구 끝 등대까지 배달이 제일 먼 코스' },
  // 연애 이야기 말풍선 (lounge-npc-love-banter-a.ts).
  { a: 'lumi', b: 'maehwa', kind: 'friend', note: '퇴근길에 연애 이야기를 나누는 두 딜러' },
  { a: 'lumi', b: 'rose', kind: 'regular', note: '같은 카지노에서 일하는 동료' },
  { a: 'captain', b: 'rose', kind: 'regular', note: '바다 이야기로 통하는 주점 손님' },
  { a: 'maehwa', b: 'captain', kind: 'regular', note: '회관 차 모임과 주점 안주를 바꿔 먹는 사이' },
  { a: 'rose', b: 'nyamo', kind: 'rival', note: '대부 창구와 은행 창구의 이자 경쟁' },
];
/** Whether a resident has a picture (drawn, listed and met). */
export const npcVisible = (id: NpcId) => NPCS[id].hasSprite !== false;
/** Residents shown anywhere in the game (the rest wait for their sprites). */
export const VISIBLE_NPC_IDS: readonly NpcId[] = NPC_IDS.filter(npcVisible);
export function npcBond(a: NpcId, b: NpcId): NpcBond | null {
  return NPC_BONDS.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)) ?? null;
}

// ---------------------------------------------------------------- relations
export const NPC_TALK_POINTS = 6;
export const NPC_INVITE_POINTS = 20;
export const NPC_REGULAR_POINTS = 40;
export const NPC_DATE_POINTS = 60;
export const NPC_SPECIAL_POINTS = 100;
export const NPC_POINTS_MAX = 120;
// 연애·결혼 (handover/design/design-romance.md). Hearts = points / 12.
export const NPC_HEART_POINTS = 12;
/** 8 hearts: a 꽃다발 is accepted, and points stop here until you date. */
export const NPC_DATING_POINTS = 96;
/** 10 hearts (and at least NPC_DATING_DAYS of dating): a 청혼 반지 is accepted. */
export const NPC_PROPOSE_POINTS = 120;
export const NPC_DATING_DAYS = 3;
/** The wedding is held this many KST days after the proposal (at the village plaza). */
export const NPC_WEDDING_DAYS = 3;
/** Breaking up: points drop to at most this, and no new 꽃다발 for this many days. */
export const NPC_BREAKUP = { points: 60, days: 7 } as const;
/** Breaking an engagement or divorcing (the ring is not returned). */
export const NPC_DIVORCE = { points: 36, days: 14 } as const;
export type NpcLove = 'dating' | 'engaged' | 'married';
export const NPC_LOVE_WORD: Record<NpcLove, string> = { dating: '연인', engaged: '약혼', married: '결혼' };
/** Points for a gift by how the resident likes it. */
export const NPC_GIFT_POINTS = { loved: 12, liked: 8, neutral: 5, disliked: -3 } as const;
export type GiftReaction = keyof typeof NPC_GIFT_POINTS;
export const npcLevel = (points: number) =>
  points >= NPC_SPECIAL_POINTS
    ? '특별한 사이'
    : points >= NPC_DATE_POINTS
      ? '설레는 사이'
      : points >= NPC_REGULAR_POINTS
        ? '단골'
        : points >= NPC_INVITE_POINTS
          ? '친구'
          : '인사하는 사이';
/** 0 인사 · 1 친구 · 2 단골 · 3 설렘 · 4 특별 (dialogue tiers). */
export const npcTier = (points: number): 0 | 1 | 2 | 3 | 4 =>
  points >= NPC_SPECIAL_POINTS ? 4 : points >= NPC_DATE_POINTS ? 3 : points >= NPC_REGULAR_POINTS ? 2 : points >= NPC_INVITE_POINTS ? 1 : 0;

/** What a selector matches; `kindOf` / `isCrop` come from the item tables (kept out of this file). */
export type GiftFacts = { id: string; kind?: string; crop: boolean; gold?: boolean };
function matches(sel: string, f: GiftFacts) {
  if (sel === f.id) return true;
  if (sel.startsWith('kind:')) return f.kind === sel.slice(5);
  if (sel === 'crop') return f.crop;
  if (sel === 'crop:gold') return f.crop && !!f.gold;
  if (sel === 'fossil') return f.id.startsWith('fossil-');
  return false;
}
export function giftReaction(npc: NpcId, f: GiftFacts): GiftReaction {
  const t = NPCS[npc].gifts;
  if (t.loved.some((s) => matches(s, f))) return 'loved';
  if (t.disliked.some((s) => matches(s, f))) return 'disliked';
  if (t.liked.some((s) => matches(s, f))) return 'liked';
  return 'neutral';
}
