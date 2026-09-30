/**
 * ============================================================================
 *  마을 주민 대사 형식 (NPC LINE FILES)
 * ============================================================================
 *
 *  주민마다 파일이 하나씩 있어요(app/lounge-npc-lines-<id>.ts). 문장을 바꾸거나
 *  더하고 빼면 바로 게임에 반영돼요. 친구 NPC 대사집(lounge-friend-lines.ts)과
 *  같은 규칙을 따라요.
 *
 *  - 한 줄은 60자 안쪽이 대화창에 보기 좋아요. 말풍선(bubble)은 20자 안쪽.
 *  - 이모지나 영어는 쓰지 않아요. "~를 경험해 보세요" 같은 광고 말투도 안 써요.
 *  - 문장 속 {이름표}는 게임이 채워요:
 *      {me}       말을 건 사람 이름            {name}    이 주민 이름
 *      {season}   지금 계절(봄·여름·가을·겨울)  {weather} 오늘 날씨(맑음·비…)
 *      {item}     선물·의뢰 물건 이름          {n}       의뢰 개수
 *      {place}    주민이 지금 있는 곳          {other}   함께 있는 다른 주민 이름
 *      {forecast} 잔나의 내일 예보(가끔 틀려요)
 *    이름 뒤에는 조사를 바로 붙이지 말고 "{me}, 안녕"처럼 문장부호를 둬요.
 *  - 비워 둔 배열([])이면 그 상황에는 다른 종류의 대사가 나와요.
 *  - 같은 날, 같은 사람에게는 같은 대사가 나와요(모든 친구 화면에서 같음).
 * ============================================================================
 */
import type { Season, TimeOfDay } from './lounge-calendar.ts';
import type { NpcActivity } from './lounge-npc-schedule.ts';

export type NpcLineSet = {
  /** 시간대 인사. */
  greet: Record<TimeOfDay, string[]>;
  /** 날씨 이야기 (없는 날씨는 인사로 대신). */
  weather: { rain?: string[]; storm?: string[]; snow?: string[]; sunny?: string[]; cloudy?: string[] };
  /** 계절 이야기. */
  season: Record<Season, string[]>;
  /** 지금 하는 일·있는 곳에 맞춘 말 (npcSpot의 activity). */
  activity: Partial<Record<NpcActivity, string[]>>;
  /** 친밀도 단계: 0 인사하는 사이 · 1 친구 · 2 단골 · 3 설레는 사이 · 4 특별한 사이. */
  tier: Record<0 | 1 | 2 | 3 | 4, string[]>;
  /** 선물 반응 + 오늘 이미 받았을 때 + 지난 선물 기억({item}). */
  gift: { loved: string[]; liked: string[]; neutral: string[]; disliked: string[]; again: string[]; remember: string[] };
  /** 의뢰 게시판: 올릴 때({item}, {n}) · 끝냈을 때 · 친구와 같이 끝냈을 때. */
  request: { post: string[]; done: string[]; coop: string[] };
  /** 명절·축제 날, 일요 장날. */
  festival: string[];
  marketDay: string[];
  /** 이 주민만의 반복 농담. */
  jokes: string[];
  /** 머리 위 말풍선(짧게): 혼자 있을 때 · 누가 다가올 때 · 비 올 때 · 밤. */
  bubble: { idle: string[]; near: string[]; rain: string[]; night: string[] };
  /** 오늘 이미 이야기했을 때. */
  talked: string[];
  /** 내 방에 초대 · 데이트 · 배웅. */
  invite: string[];
  date: string[];
  dismiss: string[];
};

/** Two residents meeting: a few exchanges, [first speaker, reply]. */
export type NpcBanter = { a: string; b: string; lines: readonly (readonly [string, string])[] };
