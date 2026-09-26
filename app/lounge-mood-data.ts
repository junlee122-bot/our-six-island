// 무드(기분) data: needs, moodlets, tiers, inspirations and the numbers of the
// mood engine (lounge-mood.ts). A leaf module (no engine imports), so the life
// engine and the client may use these tables at module top level.
//
// Design: scratchpad design-mood.md (owner-approved defaults D1–D12). Mood is
// completely separate from 범: nothing here changes a price, reward or stake,
// and nothing blocks an action.

// ---------------------------------------------------------------- time
export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

// ---------------------------------------------------------------- needs
/** 배부름 · 휴식 · 즐거움 · 사교 (indices into MoodUser.n). */
export const NEEDS = ['food', 'rest', 'fun', 'social'] as const;
export type NeedId = (typeof NEEDS)[number];
export const NEED_INDEX: Readonly<Record<NeedId, number>> = { food: 0, rest: 1, fun: 2, social: 3 };
export const NEED_INFO: Readonly<
  Record<NeedId, { name: string; perMin: number; words: [number, string][]; offset: (v: number) => number }>
> = {
  // 4 h of play empties a full stomach.
  food: {
    name: '배부름',
    perMin: 100 / 240,
    words: [[80, '든든해요'], [30, '괜찮아요'], [10, '출출해요'], [0, '배고파요']],
    offset: (v) => (v >= 80 ? 5 : v >= 30 ? 0 : v >= 10 ? -3 : -6),
  },
  rest: {
    name: '휴식',
    perMin: 100 / 300,
    words: [[70, '개운해요'], [30, '괜찮아요'], [10, '졸려요'], [0, '너무 졸려요']],
    offset: (v) => (v >= 70 ? 3 : v >= 30 ? 0 : v >= 10 ? -3 : -6),
  },
  fun: {
    name: '즐거움',
    perMin: 100 / 180,
    words: [[80, '신나요'], [50, '즐거워요'], [20, '그저 그래요'], [0, '심심해요']],
    offset: (v) => (v >= 80 ? 6 : v >= 50 ? 2 : v >= 20 ? 0 : -4),
  },
  social: {
    name: '사교',
    perMin: 100 / 360,
    words: [[80, '북적여요'], [50, '따뜻해요'], [20, '조용해요'], [0, '외로워요']],
    offset: (v) => (v >= 80 ? 6 : v >= 50 ? 2 : v >= 20 ? 0 : -4),
  },
};
export const needWord = (id: NeedId, v: number) => NEED_INFO[id].words.find(([at]) => v >= at)?.[1] ?? '';
/** A new friend (or an old world's friend on first touch) starts here. */
export const NEEDS_START: readonly [number, number, number, number] = [70, 100, 60, 60];

// ---------------------------------------------------------------- mood
export const MOOD_BASE = 45;
export const MOOD_FLOOR = 15;
export const MOOD_MAX = 100;
/** Negative moodlets and need penalties together never pull more than this. */
export const NEGATIVE_CAP = -15;
/** The shown mood moves toward its target by 1 per minute (no sudden jumps). */
export const MOOD_STEP_PER_MIN = 1;
/** A gap up to this long between two writes counts as active play. */
export const ACTIVE_GAP_MS = 10 * MIN;
/** Offline: 배부름 · 즐거움 · 사교 drift toward this with a 3 h half-life. */
export const OFFLINE_TARGET = 60;
export const OFFLINE_HALF_MS = 3 * HOUR;
/** Offline at least this long counts as sleep (휴식 100 + 잘 잤어요). */
export const SLEEP_MS = 6 * HOUR;
/** Away at least this long: 돌아왔어요! */
export const BACK_MS = 2 * DAY;
/** 사교 trickle per active minute while another friend is online. */
export const ONLINE_SOCIAL_PER_MIN = 0.1;
/** Friends online at once (me included) for 마을이 들썩여요. */
export const LIVELY_ONLINE = 4;
/** Same fun source today: ×0.9ⁿ, never below 40%. Resets at KST midnight. */
export const FUN_TOLERANCE = 0.9;
export const FUN_TOLERANCE_MIN = 0.4;
/** Per-friend state caps (the world row stays small: ~5 KB for 7). */
export const MOODLETS_MAX = 24;
export const MOOD_USERS_MAX = 16;

export type MoodTier = 'great' | 'good' | 'ok' | 'low' | 'tired';
export const MOOD_TIERS: readonly { id: MoodTier; min: number; name: string; xp: number; color: string }[] = [
  { id: 'great', min: 85, name: '신나요!', xp: 1.15, color: '#e8a93a' },
  { id: 'good', min: 65, name: '기분 좋아요', xp: 1.1, color: '#6aa84f' },
  { id: 'ok', min: 35, name: '괜찮아요', xp: 1, color: '#7f9bb0' },
  { id: 'low', min: 20, name: '시무룩해요', xp: 1, color: '#9b8bb4' },
  { id: 'tired', min: 0, name: '지쳤어요', xp: 0.9, color: '#b58a6a' },
];
export const MOOD_TIER_BY_ID = Object.fromEntries(MOOD_TIERS.map((t) => [t.id, t])) as Record<
  MoodTier,
  (typeof MOOD_TIERS)[number]
>;
export const tierOf = (v: number): MoodTier => MOOD_TIERS.find((t) => v >= t.min)!.id;
/** Skill XP multiplier of a mood (the daily cap is untouched, see lounge-growth gainXp). */
export const xpMultOf = (v: number) => MOOD_TIER_BY_ID[tierOf(v)].xp;

// ---------------------------------------------------------------- moodlets
export type MoodIcon =
  | 'bowl'
  | 'moon'
  | 'star'
  | 'chat'
  | 'house'
  | 'cloud'
  | 'bolt'
  | 'spark'
  | 'cup'
  | 'fish'
  | 'cards'
  | 'heart'
  | 'sun'
  | 'rain'
  | 'gift'
  | 'party'
  | 'up'
  | 'wave'
  | 'sofa'
  | 'leaf';
export type MoodletDef = {
  name: string;
  value: number;
  /** Lifetime in real time. */
  ms: number;
  /** Stacks at most (the k-th copy counts ×0.5^(k−1)). */
  max: number;
  icon: MoodIcon;
  /** Phase of the design roadmap (1 = MVP). */
  phase: 1 | 2;
};
const ml = (name: string, value: number, hours: number, max: number, icon: MoodIcon, phase: 1 | 2 = 1): MoodletDef => ({
  name,
  value,
  ms: Math.round(hours * HOUR),
  max,
  icon,
  phase,
});
/**
 * Registry of thoughts (RimWorld-style). Only ids are stored in the world; a
 * content pack may add entries later. Negative ones (D10): bigLoss, bang,
 * rain, miss, storm — small and gone within hours.
 */
export const MOODLETS = {
  // 먹기 · 쉬기
  meal: ml('맛있는 식사를 했어요', 3, 8, 1, 'bowl'),
  fresh: ml('갓 수확한 걸 먹었어요', 6, 6, 1, 'leaf', 2),
  snack: ml('간식을 먹었어요', 1, 2, 2, 'bowl', 2),
  drink: ml('바에서 시원한 한 잔', 2, 2, 1, 'cup', 2),
  slept: ml('잘 잤어요', 4, 6, 1, 'moon'),
  bed: ml('내 침대가 최고예요', 3, 3, 1, 'sofa', 2),
  back: ml('돌아왔어요!', 5, 12, 1, 'house'),
  tea: ml('촌장님의 따뜻한 차', 6, 4, 1, 'cup'),
  // 농사 · 낚시 · 성취
  gold: ml('금별 수확!', 4, 6, 2, 'star'),
  rareFish: ml('드문 물고기를 낚았어요', 6, 6, 1, 'fish'),
  best: ml('내 최고 기록!', 5, 12, 1, 'fish', 2),
  miss: ml('아깝게 놓쳤어요', -1, 0.5, 2, 'wave', 2),
  dex: ml('도감에 새 칸이 찼어요', 3, 6, 2, 'star', 2),
  donate: ml('박물관에 기증했어요', 4, 12, 1, 'star', 2),
  levelUp: ml('기술 레벨 업!', 6, 8, 1, 'up'),
  request: ml('오늘의 부탁을 들어줬어요', 3, 8, 2, 'gift', 2),
  furniture: ml('새 가구를 들였어요', 3, 12, 2, 'sofa', 2),
  house: ml('집이 넓어졌어요', 10, 48, 1, 'house', 2),
  // 사교
  chat: ml('친구와 수다 떨었어요', 2, 4, 3, 'chat'),
  visit: ml('친구 방에서 놀았어요', 6, 6, 1, 'house'),
  guest: ml('친구가 놀러 왔어요', 4, 6, 2, 'house', 2),
  waterFriend: ml('친구 밭에 물을 줬어요', 2, 4, 2, 'leaf', 2),
  watered: ml('누가 내 밭에 물을 줬어요', 3, 8, 1, 'leaf', 2),
  gift: ml('선물을 받았어요', 4, 12, 3, 'gift'),
  giveGift: ml('선물을 건넸어요', 2, 6, 2, 'gift', 2),
  cheered: ml('친구가 응원해 줬어요', 4, 12, 3, 'heart'),
  cheer: ml('친구를 응원했어요', 2, 6, 2, 'heart', 2),
  heartUp: ml('하트가 하나 늘었어요', 8, 24, 1, 'heart', 2),
  lively: ml('마을이 들썩여요', 3, 2, 1, 'party'),
  // 판 게임 · 카지노 · 주점
  table: ml('친구들과 한 판 했어요', 4, 3, 2, 'cards'),
  bigWin: ml('크게 땄어요', 6, 6, 1, 'cards', 2),
  bigLoss: ml('카지노에서 크게 잃었어요', -6, 6, 2, 'cloud'),
  bang: ml('허풍 주점에서 뻥총에 뻗었어요', -4, 2, 2, 'bolt'),
  survived: ml('뻥총에서 살아남았어요', 3, 2, 1, 'bolt', 2),
  // 달력 · 날씨
  birthdayCheer: ml('생일 축하받았어요', 15, 24, 1, 'party'),
  birthday: ml('오늘은 내 생일!', 5, 24, 1, 'party', 2),
  holiday: ml('명절이에요', 5, 24, 1, 'party', 2),
  festival: ml('축제에 참가했어요', 10, 12, 1, 'party'),
  sunny: ml('맑은 날 산책', 2, 4, 1, 'sun'),
  rain: ml('비 맞았어요', -3, 2, 1, 'rain'),
  storm: ml('폭풍우 소리가 무서워요', -2, 2, 1, 'rain', 2),
  snow: ml('첫눈이에요!', 6, 24, 1, 'cloud', 2),
  // 영감을 들고 있는 동안 (not stored; added by the engine).
  inspired: ml('영감이 샘솟아요', 3, 24, 1, 'spark'),
} as const satisfies Record<string, MoodletDef>;
export type MoodletId = keyof typeof MOODLETS;
export const isMoodletId = (id: unknown): id is MoodletId =>
  typeof id === 'string' && Object.prototype.hasOwnProperty.call(MOODLETS, id) && id !== 'inspired';
export const NEGATIVE_MOODLETS = (Object.keys(MOODLETS) as MoodletId[]).filter((id) => MOODLETS[id].value < 0);

// ---------------------------------------------------------------- 아늑함 (room score, phase 2)
export const COZY_TIERS: readonly { min: number; name: string; value: number }[] = [
  { min: 130, name: '황홀해요', value: 8 },
  { min: 80, name: '근사해요', value: 6 },
  { min: 45, name: '멋져요', value: 4 },
  { min: 20, name: '아늑해요', value: 2 },
  { min: 0, name: '소박해요', value: 0 },
];
export const cozyOf = (score: number) => COZY_TIERS.find((t) => score >= t.min)!;
export const COZY_SCORE_MAX = 999;

// ---------------------------------------------------------------- inspirations
/** Gauge fills by (mood − 65) per active minute; full at 600 → one inspiration. */
export const INSPIRATION_GAUGE = 720;
export const INSPIRATION_FROM = 65;
export const INSPIRATIONS_PER_DAY = 1;
export const INSPIRATIONS_PER_WEEK = 3;
export const INSPIRATION_MS = DAY;
export type InspirationKind = 'harvest' | 'bite' | 'cook' | 'learn';
export const INSPIRATIONS: Readonly<
  Record<InspirationKind, { name: string; text: string; uses: number; ms: number; icon: MoodIcon; phase: 1 | 2; go: string }>
> = {
  harvest: {
    name: '풍작 영감',
    text: '다음 수확 한 판(최대 12칸)이 한 단계 좋아져요',
    uses: 12,
    ms: INSPIRATION_MS,
    icon: 'leaf',
    phase: 1,
    go: '밭으로',
  },
  bite: {
    name: '입질 영감',
    text: '다음 낚시 10번은 드문 물고기가 두 배로 잘 물고, 입질 판정이 20% 넉넉해요',
    uses: 10,
    ms: INSPIRATION_MS,
    icon: 'fish',
    phase: 1,
    go: '낚시터로',
  },
  cook: {
    name: '요리 영감',
    text: '다음 요리 한 번은 대성공! 한 접시가 더 나와요',
    uses: 1,
    ms: INSPIRATION_MS,
    icon: 'bowl',
    phase: 2,
    go: '부엌으로',
  },
  learn: {
    name: '배움 영감',
    text: '한 시간 동안 기술 XP +20% (하루 한도 안에서)',
    uses: 1,
    ms: HOUR,
    icon: 'up',
    phase: 2,
    go: '성장 수첩',
  },
};
export const isInspirationKind = (k: unknown): k is InspirationKind =>
  typeof k === 'string' && Object.prototype.hasOwnProperty.call(INSPIRATIONS, k);
/** 풍작 영감: quality steps added per harvested plot. */
export const HARVEST_INSPIRATION_STEP = 1;
/** 입질 영감: rare-fish weight and bite-window multipliers. */
export const BITE_INSPIRATION_RARE = 2;
export const BITE_INSPIRATION_WINDOW = 1.2;
/** 배움 영감: extra XP multiplier (the daily cap still applies). */
export const LEARN_INSPIRATION_XP = 1.2;

// ---------------------------------------------------------------- care and actions
/** Active minutes below this mood before 촌장님 찻잔 arrives (once a KST day). */
export const CARE_BELOW = 35;
export const CARE_AFTER_MIN = 20;
export const CARE_CUP_MS = DAY;
export const TEA_FOOD_MIN = 60;
/** 간식: +25 배부름 (요리는 +40), three a day. */
export const SNACKS_PER_DAY = 3;
export const SNACK_FOOD = 25;
export const SNACK_DISH_FOOD = 40;
/** 침대에서 쉬기: +50 휴식, one hour between rests. */
export const REST_GAIN = 50;
export const REST_COOLDOWN_MS = HOUR;
/** 카지노 바 음료: first one of the KST day free, then 500범 (a ledger spend), five a day. */
export const DRINK_PRICE = 500;
export const DRINKS_PER_DAY = 5;
export const DRINK_FOOD = 20;
export const DRINK_FUN = 5;
/** 응원하기: once per friend per KST day; ×2 when they feel low. */
export const CHEER_SOCIAL = 10;
export const CHEER_SNACK_FOOD = 40;
export const CHEER_HOWS = ['pat', 'highfive', 'snack', 'sticker'] as const;
export type CheerHow = (typeof CHEER_HOWS)[number];
export const CHEER_LABEL: Readonly<Record<CheerHow, string>> = {
  pat: '토닥토닥',
  highfive: '하이파이브',
  snack: '간식 건네기',
  sticker: '스티커 보내기',
};

// Fun and social fills (need points; fun uses the daily tolerance per source).
export const FILL = {
  eatFood: 100,
  harvestFun: 1,
  fishFun: 1,
  missFun: 0.5,
  forageFun: 0.6,
  tableFun: 25,
  tableSocial: 15,
  feteFun: 40,
  festivalFun: 20,
  talkSocial: 10,
  visitSocial: 15,
  guestSocial: 5,
  waterSocial: 5,
  giftSocial: 10,
  requestSocial: 5,
} as const;
/** Big table results (ledger net per wallet). */
export const BIG_RESULT = 20_000;

/** Life actions of the mood module (names must not collide with room actions). */
export const MOOD_ACTION_KINDS = ['snack', 'bedRest', 'barDrink', 'moodTea', 'moodShare', 'cheer'] as const;
export type MoodActionKind = (typeof MOOD_ACTION_KINDS)[number];

export const MOOD_REJECT = {
  snackItem: '간식으로 먹을 수 있는 것을 골라 주세요.',
  snackMax: `간식은 하루 ${SNACKS_PER_DAY}번까지예요. 내일 또 먹어요.`,
  notEnough: '가방에 그만큼 없어요.',
  restWait: '방금 쉬었어요. 조금 뒤에 다시 누워 봐요.',
  drinkMax: `바 음료는 하루 ${DRINKS_PER_DAY}잔까지예요.`,
  balance: '잔액이 부족해요.',
  noCup: '받은 찻잔이 없어요.',
  friend: '응원할 친구를 확인해 주세요.',
  self: '나를 응원할 수는 없어요. 대신 간식 어때요?',
  cheered: '오늘은 이미 이 친구를 응원했어요. 내일 또 응원해요.',
  how: '응원 방법을 확인해 주세요.',
} as const;

/** Monday-based KST week (same as lounge-life-plus weekOfDay). */
export const moodWeekOf = (day: number) => Math.floor((day + 3) / 7);
