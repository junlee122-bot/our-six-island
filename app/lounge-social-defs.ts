// Static data for the friend-life features (C-3..C-7, C-10): heart rewards,
// museum co-donation milestones, the participatory festival calendar and the
// "마을 적응하기" checklist. A leaf module (imports only the calendar), so the
// life engine can use these constants at module top level without the
// lounge-life ⇄ lounge-life-plus ⇄ lounge-life-social import cycle biting.
// Engine: lounge-life-social.ts. Dialog lines: lounge-friend-lines.ts.
import {
  HOLIDAYS,
  SEASON_DAYS,
  CALENDAR_ANCHOR_DAY,
  cycleSeasonOfDay,
  dayStart,
  kstDate,
} from './lounge-calendar.ts';

/** Life actions of this module (names must not collide with room actions). */
export const SOCIAL_ACTION_KINDS = ['npcTalk', 'myLines', 'fete', 'adapt'] as const;
export type SocialActionKind = (typeof SOCIAL_ACTION_KINDS)[number];

// ---------------------------------------------------------------- my NPC lines
/** Lines a friend may write for their own NPC (shown to others who talk to it). */
export const MY_LINES_MAX = 10;
export const MY_LINE_TEXT_MAX = 40;

// ---------------------------------------------------------------- hearts
/** Friendship points for small talk with a friend's NPC (once per friend per day). */
export const TALK_POINTS = 4;
/** Days without any friendship source before a pair's points start to fade. */
export const BOND_GRACE_DAYS = 3;
/** Share kept per further idle day (only the part above BOND_DECAY_FLOOR fades). */
export const BOND_DECAY_KEEP = 0.99;
/** Points (♥5) that never fade: early hearts are safe. */
export const BOND_DECAY_FLOOR = 400;

export type HeartRewardKind = 'recipe' | 'furniture' | 'memory' | 'room' | 'signature';
/** Heart levels that give a reward from that friend, in order. */
export const HEART_REWARD_LEVELS = [2, 4, 6, 8, 10] as const;
export const HEART_REWARD_KIND: Record<(typeof HEART_REWARD_LEVELS)[number], HeartRewardKind> = {
  2: 'recipe',
  4: 'furniture',
  6: 'memory',
  8: 'room',
  10: 'signature',
};
export const HEART_REWARD_LABEL: Record<HeartRewardKind, string> = {
  recipe: '레시피 편지와 요리 2인분',
  furniture: '방 가구 선물 (우편)',
  memory: '특별한 대화와 추억 한 장',
  room: '방 꾸미기 선물',
  signature: '대표 선물과 칭호',
};
/**
 * What each friend gives at ♥2 (a dish with its recipe), ♥4 (furniture by
 * mail), ♥8 (a room piece) and ♥10 (their signature piece). Index = actor.
 * Every id must exist in lounge-items (tests check it). Change freely.
 */
export const FRIEND_GIFTS: readonly { dish: string; furniture: string; room: string; signature: string }[] = [
  { dish: 'bibimbap', furniture: 'furn-planter', room: 'furn-fruit-tree', signature: 'furn-bonsai' }, // 0 도원
  { dish: 'grilledfish', furniture: 'furn-radio', room: 'furn-tent', signature: 'furn-aquarium' }, // 1 강재
  { dish: 'flowertea', furniture: 'furn-plant', room: 'furn-rug-lilac', signature: 'furn-crystal-lamp' }, // 2 민서
  { dish: 'buttercorn', furniture: 'furn-lamp', room: 'furn-bench', signature: 'furn-telescope' }, // 3 승준
  { dish: 'dotorimuk', furniture: 'furn-bookshelf', room: 'furn-rocking-chair', signature: 'furn-mother-pearl' }, // 4 민재
  { dish: 'hwachae', furniture: 'furn-table', room: 'furn-sofa-rose', signature: 'furn-grand-piano' }, // 5 재민
  { dish: 'kimchi', furniture: 'furn-fireplace', room: 'furn-armchair-navy', signature: 'furn-gold-mirror' }, // 6 호현
];
/** Dishes that come with a ♥2 recipe letter. */
export const RECIPE_GIFT_N = 2;

// ---------------------------------------------------------------- museum
/** 범 for stamping an item that someone else already donated first. */
export const CO_DONATION_GRANT = 100;
/**
 * Village museum milestones (distinct items on display). When one is reached,
 * everyone who has donated at least once gets the reward (and later first
 * donors get it on their first donation).
 */
export const MUSEUM_MILESTONES: readonly { n: number; beom: number; item?: [string, number]; furniture?: string; name: string }[] = [
  { n: 10, beom: 1_000, item: ['bait', 5], name: '작은 전시실' },
  { n: 25, beom: 2_000, item: ['fertilizer-deluxe', 2], name: '두 번째 전시실' },
  { n: 45, beom: 3_000, furniture: 'furn-bookcase-walnut', name: '박물관 도록' },
  { n: 70, beom: 5_000, furniture: 'furn-telescope', name: '마을 박물관 완성 기념' },
];

// ---------------------------------------------------------------- festivals
/**
 * Participatory festivals. `chuseok` runs on the three 추석 days; `blossom`
 * (봄 꽃놀이) on the last two days of every game spring (once per 28-day game
 * year, so roughly monthly). More kinds can be added here with their own
 * activity ops in lounge-life-social.ts (feteAction).
 */
export type FeteKind = 'chuseok' | 'blossom';
export type FeteDef = {
  kind: FeteKind;
  name: string;
  /** The leaderboard activity. */
  game: string;
  gameHelp: string;
  /** Second activity (lantern / photo). */
  extra: string;
  extraHelp: string;
  /** Participation reward (first activity). */
  joinBeom: number;
  joinFurniture: string;
  joinItem?: [string, number];
  /** Best score when the festival ends. */
  winnerFurniture: string;
  /** Plays of the leaderboard activity per friend per festival. */
  tries: number;
};
export const FETES: Record<FeteKind, FeteDef> = {
  chuseok: {
    kind: 'chuseok',
    name: '추석 한가위 잔치',
    game: '송편 빚기',
    gameHelp: '반죽이 둥글게 모이는 순간에 E나 Space를 눌러 송편을 빚어요. 다섯 번 빚어 점수를 모아요.',
    extra: '달맞이 등 날리기',
    extraHelp: '해가 진 뒤(저녁 5시부터 새벽 5시)에 소원 한 줄을 적어 등을 띄워요. 한 사람에 한 번이에요.',
    joinBeom: 1_000,
    joinFurniture: 'furn-moon-lantern',
    joinItem: ['songpyeon', 2],
    winnerFurniture: 'furn-festival-drum',
    tries: 5,
  },
  blossom: {
    kind: 'blossom',
    name: '봄 꽃놀이',
    game: '화관 만들기',
    gameHelp: '가방의 꽃 세 송이로 화관을 엮어요. 귀한 꽃, 여러 종류일수록 점수가 높아요.',
    extra: '꽃길 단체 사진',
    extraHelp: '꽃길 포토존에서 사진에 들어가요. 축제가 끝나면 함께 찍힌 친구들과 추억 앨범에 남아요.',
    joinBeom: 1_000,
    joinFurniture: 'furn-cherry-vase',
    winnerFurniture: 'furn-festival-fan',
    tries: 3,
  },
};
export type FeteSlot = { kind: FeteKind; id: string; start: number; end: number };
/** Rounds of 송편 빚기 and the largest accepted miss (ms) per round. */
export const SONGPYEON_ROUNDS = 5;
export const SONGPYEON_MISS_MS = 800;
/** One sweep of the dough marker (client timing and server minimum). */
export const SONGPYEON_ROUND_MS = 1_400;
/** A started game must be finished within this long. */
export const FETE_PLAY_MS = 120_000;
export const LANTERN_TEXT_MAX = 24;
export const CROWN_FLOWERS = 3;
/** Score of one 송편 round from its miss (ms): 100 at perfect, 0 at SONGPYEON_MISS_MS/… */
export const songpyeonRound = (missMs: number) =>
  Math.max(0, Math.round(100 - Math.min(SONGPYEON_MISS_MS, Math.abs(missMs)) / 4));

const mod = (a: number, n: number) => ((a % n) + n) % n;
const CHUSEOK = HOLIDAYS.find((h) => h.key === 'chuseok')!;
/** The festival running on a KST day (추석 wins over 꽃놀이), or null. */
export function feteOn(day: number): FeteSlot | null {
  const date = kstDate(day);
  if (CHUSEOK.dates?.includes(date)) {
    const year = date.slice(0, 4),
      days = CHUSEOK.dates.filter((d) => d.startsWith(year)).map((d) => Math.round(Date.parse(d) / 86_400_000));
    return { kind: 'chuseok', id: `chuseok-${year}`, start: Math.min(...days), end: Math.max(...days) };
  }
  const seasonDay = mod(day - CALENDAR_ANCHOR_DAY, SEASON_DAYS) + 1;
  if (cycleSeasonOfDay(day) === 'spring' && seasonDay >= SEASON_DAYS - 1) {
    const start = day - (seasonDay - (SEASON_DAYS - 1));
    return { kind: 'blossom', id: `blossom-${start}`, start, end: start + 1 };
  }
  return null;
}
/** The next festival starting after `day` (within 60 days), or null. */
export function nextFete(day: number): FeteSlot | null {
  for (let d = day + 1; d <= day + 60; d++) {
    const f = feteOn(d);
    if (f && f.start === d) return f;
  }
  return null;
}
/** When a festival ends (00:00 KST after its last day). */
export const feteEndsAt = (slot: FeteSlot) => dayStart(slot.end + 1);

// ---------------------------------------------------------------- 마을 적응하기
export type AdaptStepId = 'sell' | 'fish' | 'board' | 'table';
/**
 * Optional follow-up steps after the first-day tutorial. `sell` and `fish`
 * are checked on the server (stats); `board` and `table` are reported by the
 * client when the board opens or a table/solo game starts.
 */
export const ADAPT_STEPS: readonly { id: AdaptStepId; title: string; hint: string; reward: number }[] = [
  { id: 'sell', title: '수확물 팔기', hint: '시장 가판대(상점)의 팔기 탭이나 가방에서 팔아요.', reward: 500 },
  { id: 'fish', title: '물고기 한 마리 낚기', hint: '강가·연못에서 E로 던지고, 입질(!)에 맞춰 다시 눌러요.', reward: 500 },
  { id: 'board', title: '마을 게시판 보기', hint: '광장 게시판에서 꾸러미와 마을 공사를 확인해요.', reward: 300 },
  { id: 'table', title: '테이블에 앉아 보기', hint: '회관·카지노 테이블에 앉거나 혼자 하는 연습 판을 열어요.', reward: 300 },
];
/** All steps claimed: a small piece of furniture. */
export const ADAPT_DONE_FURNITURE = 'furn-radio';
