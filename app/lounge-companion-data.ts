// 주민 동행 (handover/design/design-npc-companion.md 1부 + 결정됨): the rules
// and numbers as plain data. A friend invites one resident (2 hearts or more)
// to walk with them for 18 game hours (45 real minutes). Shopkeepers do not
// leave their shop in its hours; 무잔 only comes along at night. Each resident
// helps with one activity (COMPANION_EFFECTS, lounge-companion-effects.ts);
// none of it makes 범 or touches a table game.
//
// Leaf module: the server engine (lounge-companion.ts), the effect hooks and
// the client all read it.
import { NPC_HEART_POINTS, type NpcId } from './lounge-npc-data.ts';
import { GAME_HOUR_MS } from './lounge-calendar.ts';

/** Life action kinds (lounge-life.ts LIFE_ACTION_KINDS reads this leaf, not the engine). */
export const COMPANION_ACTION_KINDS = ['companion'] as const;

/** Hearts a resident needs before they come along. */
export const COMPANION_HEARTS = 2;
export const COMPANION_MIN_POINTS = COMPANION_HEARTS * NPC_HEART_POINTS;
/** How long one outing lasts: 18 game hours (45 real minutes). */
export const COMPANION_GAME_HOURS = 18;
export const COMPANION_MS = COMPANION_GAME_HOURS * GAME_HOUR_MS;
/** Relation points per game hour together, and at most this many a KST day. */
export const COMPANION_BOND_PER_HOUR = 1;
export const COMPANION_BOND_DAY_CAP = 6;
/** Speech bubbles over the companion's head per game hour (client). */
export const COMPANION_BUBBLES_PER_HOUR = 3;
/** One-off moment keys kept per friend (bounded). */
export const COMPANION_SAID_MAX = 29 * 12;

/** Why an outing ended (the parting line and the toast). */
export type CompanionEnd = 'dismiss' | 'time' | 'shop' | 'night' | 'logout';
export const COMPANION_END_TEXT: Record<CompanionEnd, string> = {
  dismiss: '집으로 돌아갔어요.',
  time: '오늘은 여기까지래요. 다시 부르면 와요.',
  shop: '가게 문 열 시간이라 돌아갔어요.',
  night: '날이 밝아 돌아갔어요.',
  logout: '접속을 끊어서 집으로 돌아갔어요.',
};

/**
 * Residents who keep a shop or a counter: they do not come along in its hours
 * (and leave when it opens). The rest can come along any time they can be met.
 */
export const COMPANION_SHOPKEEPERS: readonly NpcId[] = [
  'lumi',
  'maehwa',
  'captain',
  'realtor',
  'misun',
  'carpenter',
  'nyamo',
  'gwen',
  'nasera',
  'frieren',
  'thresh',
  'sinjjajang',
  'lux',
  'himmel',
  'beatrice',
  'makima',
  'muzan',
  'nilah',
  'haku',
  'ornn',
  'mercy',
  'shinichi',
];
/**
 * Shop hours on the game clock [open, close) for the keepers whose day plan
 * keeps them "at work" around the clock (their scenes draw them at the post):
 * 허풍 주점 runs evenings and nights, the bank, the salon and the furniture
 * shop run days. Everyone else's hours come from their day plan.
 */
export const COMPANION_SHOP_HOURS: Partial<Record<NpcId, readonly [number, number]>> = {
  captain: [17, 2],
  nyamo: [9, 17],
  gwen: [10, 19],
  carpenter: [9, 18],
};
/** 무잔 comes along only at night (game clock: evening, night and dawn). */
export const COMPANION_NIGHT_ONLY: readonly NpcId[] = ['muzan'];

/**
 * What a companion helps with: the activity it applies to (one line on the
 * HUD chip and the notebook) and the effect. The numbers live in
 * lounge-companion-effects.ts (COMPANION_NUMBERS).
 */
export type CompanionEffectKind =
  | 'forage'
  | 'social'
  | 'firsts'
  | 'nightFish'
  | 'harvest'
  | 'trade'
  | 'cook'
  | 'orchard'
  | 'nightXp'
  | 'hints'
  | 'treasure'
  | 'craft'
  | 'plant'
  | 'nightRare'
  | 'walk'
  | 'mine'
  | 'weatherXp'
  | 'reel'
  | 'fishXp'
  | 'animals'
  | 'ore'
  | 'care'
  | 'wood'
  | 'festival'
  | 'hall'
  | 'voyage'
  | 'realty'
  | 'bank';
export type CompanionEffect = { kind: CompanionEffectKind; /** 함께하면 좋은 활동. */ activity: string; /** 효과 한 줄. */ text: string };
export const COMPANION_EFFECTS: Record<NpcId, CompanionEffect> = {
  frieren: { kind: 'forage', activity: '채집·숲', text: '채집할 때 10% 확률로 이상한 물건을 하나 더 주워요' },
  himmel: { kind: 'social', activity: '어디든', text: '기분이 좋아지고, 만나는 주민 호감 +1' },
  beatrice: { kind: 'firsts', activity: '도감', text: '처음 잡거나 캐는 것의 기술 경험치 +30%' },
  bocchi: { kind: 'nightFish', activity: '밤 낚시', text: '밤 낚시 입질 창 +5% (친구와 함께 낚을 땐 없음)' },
  tsunade: { kind: 'harvest', activity: '농사', text: '수확할 때 금별 +3%p' },
  makima: { kind: 'trade', activity: '거래', text: '행상·장터에서 사는 물건 값 −5%' },
  yanineko: { kind: 'cook', activity: '요리', text: '요리할 때 10% 확률로 하나 더' },
  haku: { kind: 'orchard', activity: '과수원·강', text: '과일 다시 열리는 시간 −20%, 강 낚시 희귀 +5%' },
  muzan: { kind: 'nightXp', activity: '밤', text: '밤에만 따라와요. 밤 활동 경험치 +15%' },
  shinichi: { kind: 'hints', activity: '탐험', text: '숨은 채집 지점과 보물 상자 힌트를 알려 줘요' },
  rose: { kind: 'treasure', activity: '먼바다 낚시', text: '먼바다 보물 상자 확률 ×1.3' },
  gwen: { kind: 'craft', activity: '제작', text: '제작 재료 −10% (쓴 재료 일부를 돌려받아요)' },
  nasera: { kind: 'plant', activity: '농사', text: '새로 심는 작물 성장 +5%' },
  thresh: { kind: 'nightRare', activity: '밤 낚시', text: '밤 희귀 물고기 ×1.15 (등불)' },
  sinjjajang: { kind: 'walk', activity: '이동', text: '걷는 속도 +10%' },
  volibas: { kind: 'mine', activity: '광산', text: '광산 사다리가 바위 하나 일찍 나와요' },
  janna: { kind: 'weatherXp', activity: '비·바람', text: '비·폭풍 날 모든 활동 경험치 +10%' },
  gabung: { kind: 'reel', activity: '바다 낚시', text: '바다 낚시 손맛 겨루기 게이지가 덜 줄어요 (−10%)' },
  lux: { kind: 'fishXp', activity: '낚시', text: '낚시 경험치 +15%' },
  nilah: { kind: 'animals', activity: '목축', text: '동물 돌보기 애정 +1 (하루 한 번)' },
  ornn: { kind: 'ore', activity: '광산', text: '광석이 나오면 15% 확률로 +1' },
  mercy: { kind: 'care', activity: '어디든', text: '지치지 않게 돌봐 줘요. 지친 기분의 경험치 감소 무시' },
  carpenter: { kind: 'wood', activity: '채집(나무)', text: '나무를 벨 때 +1' },
  lumi: { kind: 'festival', activity: '축제', text: '축제 미니게임 점수 +10%' },
  maehwa: { kind: 'hall', activity: '회관', text: '회관 게임 구경이 더 즐거워요 (표시용)' },
  captain: { kind: 'voyage', activity: '먼바다', text: '먼바다 출항 시간 +1시간, 뱃멀미 없음' },
  realtor: { kind: 'realty', activity: '마을', text: '집·가구 소식과 할인 정보를 알려 줘요' },
  misun: { kind: 'realty', activity: '마을', text: '집·가구 소식과 할인 정보를 알려 줘요' },
  nyamo: { kind: 'bank', activity: '마을', text: '은행 업무를 어디서든 볼 수 있어요' },
};

/**
 * Favourite and disliked places (the favPlace / badPlace moments). The line
 * files (lounge-npc-companion-lines-<id>.ts `places`) say the same; the server
 * reads this table so it never loads the lines (a test keeps them equal).
 * 'farm' is 우리 농장 (claude/our-farm-f1): its moments wait for that map.
 */
export const COMPANION_PLACES_OF: Record<NpcId, { fav: string; bad: string }> = {
  lumi: { fav: 'market', bad: 'woods' },
  maehwa: { fav: 'ranch', bad: 'harbor' },
  captain: { fav: 'offshore', bad: 'mine' },
  realtor: { fav: 'hillside', bad: 'mine' },
  misun: { fav: 'market', bad: 'woods' },
  carpenter: { fav: 'woods', bad: 'market' },
  rose: { fav: 'offshore', bad: 'farm' },
  nyamo: { fav: 'harbor', bad: 'offshore' },
  gwen: { fav: 'hillside', bad: 'mine' },
  nasera: { fav: 'farm', bad: 'offshore' },
  frieren: { fav: 'woods', bad: 'offshore' },
  thresh: { fav: 'harbor', bad: 'ranch' },
  sinjjajang: { fav: 'hillside', bad: 'offshore' },
  volibas: { fav: 'mine', bad: 'offshore' },
  janna: { fav: 'hill', bad: 'woods' },
  gabung: { fav: 'harbor', bad: 'woods' },
  lux: { fav: 'harbor', bad: 'mine' },
  himmel: { fav: 'village', bad: 'mine' },
  beatrice: { fav: 'hillside', bad: 'market' },
  bocchi: { fav: 'harbor', bad: 'village' },
  tsunade: { fav: 'farm', bad: 'mine' },
  makima: { fav: 'market', bad: 'offshore' },
  yanineko: { fav: 'harbor', bad: 'offshore' },
  muzan: { fav: 'market', bad: 'farm' },
  nilah: { fav: 'offshore', bad: 'mine' },
  haku: { fav: 'woods', bad: 'mine' },
  ornn: { fav: 'mine', bad: 'market' },
  mercy: { fav: 'hill', bad: 'mine' },
  shinichi: { fav: 'woods', bad: 'offshore' },
};
