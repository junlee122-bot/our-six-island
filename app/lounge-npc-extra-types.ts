/**
 * ============================================================================
 *  주민 대사 더하기 (NPC EXTRA LINES) · 주민끼리 어울리는 말 (SOCIAL VOICE)
 * ============================================================================
 *
 *  주민마다 파일이 하나 더 있어요(app/lounge-npc-extra-<id>.ts). 원래 대사
 *  파일(lounge-npc-lines-<id>.ts)에 더해져서, 같은 자리에서 고르는 줄이
 *  늘어나요. 규칙은 lounge-npc-line-types.ts와 같아요.
 *
 *  - 대화창 한 줄은 60자 안쪽, 말풍선(social의 짧은 칸)은 24자 안쪽.
 *  - 이모지·영어 없음, 광고 말투 없음, 캐릭터 말투 그대로.
 *  - 이름표: {me} 말을 건 친구 · {other} 함께 있는 주민 · {item} 건네는 물건
 *    · {season} {weather} {place}. 이름 뒤에는 조사를 바로 붙이지 말고
 *    "{other}, 고마워"처럼 문장부호를 둬요.
 * ============================================================================
 */
import type { Season, TimeOfDay } from './lounge-calendar.ts';

/** What a friend did lately that residents notice (lounge-npc-recent.ts). */
export type NpcRecentKind = 'fishing' | 'voyage' | 'stockUp' | 'stockDown' | 'casinoWin' | 'casinoLose' | 'museum';
export const NPC_RECENT_KINDS: readonly NpcRecentKind[] = ['fishing', 'voyage', 'stockUp', 'stockDown', 'casinoWin', 'casinoLose', 'museum'];

/**
 * How a resident talks with another resident (lounge-npc-social.ts). Short
 * kinds are speech bubbles over their heads (24자 안쪽); `sulk` and `join`
 * are said to a friend in the talk box (60자 안쪽).
 */
export type NpcSocialVoice = {
  /** Opening a chat with a neighbor ({other}). 말풍선. */
  chat: string[];
  /** Answering whatever {other} said. 말풍선. */
  reply: string[];
  /** A sharp line in a small quarrel with {other}. 말풍선. */
  quarrel: string[];
  /** Making up with {other} a day or two later. 말풍선. */
  makeup: string[];
  /** Eating together with {other}. 말풍선. */
  meal: string[];
  /** Walking together with {other}. 말풍선. */
  stroll: string[];
  /** Handing {other} a present ({item}: their usual present, giftItem). 말풍선. */
  give: string[];
  /** Thanking {other} for a present ({item}). 말풍선. */
  thanks: string[];
  /** To a friend, the day after a quarrel, still sulking about {other}. 대화창. */
  sulk: string[];
  /** To a friend ({me}) who joins their chat with {other}. 대화창. */
  join: string[];
  /** What they usually give to friends, as said in a line ("우유 한 통"). */
  giftItem: string;
};

/** More everyday lines on top of the line file, plus reactions and the social voice. */
export type NpcExtraLines = {
  greet: Record<TimeOfDay, string[]>;
  weather: { rain: string[]; storm: string[]; snow: string[]; sunny: string[]; cloudy: string[] };
  season: Record<Season, string[]>;
  tier: Record<0 | 1 | 2 | 3 | 4, string[]>;
  /** Reactions to what {me} did today / this week. */
  react: Record<NpcRecentKind, string[]>;
  social: NpcSocialVoice;
};
