/**
 * ============================================================================
 *  동행 대사 형식 (NPC COMPANION LINE FILES)
 * ============================================================================
 *
 *  주민마다 파일이 하나씩 있어요(app/lounge-npc-companion-lines-<id>.ts).
 *  평소 대사(lounge-npc-lines-<id>.ts)와 따로, 주민이 친구와 "같이 다니는"
 *  동안에만 나와요. 설계: handover/design/design-npc-companion.md 1-4와 "결정됨".
 *
 *  - 대화창 한 줄은 60자 안쪽. 말풍선(react, 머리 위)은 20자 안쪽.
 *  - 이모지·영어·광고 말투는 쓰지 않아요. 원작 대사를 그대로 옮기지 않아요
 *    (원작 소재·말버릇·관계만 빌려 와요). 모두 성인이에요.
 *  - 문장 속 {이름표}는 게임이 채워요:
 *      {me}      같이 다니는 친구 이름      {name}   이 주민 이름
 *      {place}   지금 있는 곳(시장 거리…)   {weather} 오늘 날씨
 *      {spot}    가 볼 만한 곳(제안 대사)    {other}  지나가는 다른 주민 이름
 *      {friend}  근처에 있는 다른 친구 이름  {season} 지금 계절
 *    이름 뒤에는 조사를 바로 붙이지 말고 "{me}, 가자"처럼 문장부호를 둬요.
 *  - 같은 순간에는 모든 친구 화면에서 같은 대사가 나와요.
 * ============================================================================
 */
import type { TimeOfDay } from './lounge-calendar.ts';

/**
 * Where a companion can walk with you: the hub, the five districts, the back
 * hill and the deep woods, the mine, the boat, and 우리 농장 once it exists
 * (claude/our-farm-f1). Indoors they wait at the door.
 */
export type CompanionPlace = 'village' | 'market' | 'harbor' | 'hillside' | 'ranch' | 'foothill' | 'hill' | 'woods' | 'mine' | 'offshore' | 'farm';
export const COMPANION_PLACES: readonly CompanionPlace[] = ['village', 'market', 'harbor', 'hillside', 'ranch', 'foothill', 'hill', 'woods', 'mine', 'offshore', 'farm'];
export const isCompanionPlace = (a: unknown): a is CompanionPlace => typeof a === 'string' && (COMPANION_PLACES as readonly string[]).includes(a);

/** What you are doing (the E-talk context line and the bubbles). */
export type CompanionActivity = 'fish' | 'farm' | 'forage' | 'mine' | 'cook';
export const COMPANION_ACTIVITIES: readonly CompanionActivity[] = ['fish', 'farm', 'forage', 'mine', 'cook'];

/** Short bubbles over the companion's head when something happens (20자 안쪽). */
export type CompanionReact = 'bite' | 'bigFish' | 'harvest' | 'goldStar' | 'mineFloor' | 'treasure' | 'cook' | 'idle';
export const COMPANION_REACTS: readonly CompanionReact[] = ['bite', 'bigFish', 'harvest', 'goldStar', 'mineFloor', 'treasure', 'cook', 'idle'];

/** One-off moments (each said once per friend and resident, then never again). */
export type CompanionMoment =
  | 'firstLegend'
  | 'firstGold'
  | 'deepest'
  | 'rain'
  | 'snow'
  | 'sunrise'
  | 'sunset'
  | 'birthday'
  | 'favPlace'
  | 'badPlace';
export const COMPANION_MOMENTS: readonly CompanionMoment[] = ['firstLegend', 'firstGold', 'deepest', 'rain', 'snow', 'sunrise', 'sunset', 'birthday', 'favPlace', 'badPlace'];

export type CompanionLineSet = {
  /** 좋아하는 곳·싫어하는 곳 (favPlace / badPlace 순간 대사가 여기서 나와요). */
  places: { fav: CompanionPlace; bad: CompanionPlace };
  /** 같이 다닐래요? → 수락 (매번) · 처음 수락 (한 번) · 영업·일 때문에 거절. */
  accept: string[];
  firstAccept: string[];
  busy: string[];
  /** 헤어질 때 인사 (보내기, 시간이 다 됐을 때, 가게 문 열 시간). */
  part: string[];
  /** 동행 대화(E): 지금 있는 곳 한마디. */
  place: Record<CompanionPlace, string[]>;
  /** 동행 대화(E): 시간대 한마디. */
  time: Record<TimeOfDay, string[]>;
  /** 동행 대화(E): 비·눈 오는 날 한마디. */
  weather: { rain: string[]; snow: string[] };
  /** 동행 대화(E): 방금 하던 일에 맞춘 한마디. */
  activity: Record<CompanionActivity, string[]>;
  /** 동행 대화(E): 둘만의 잡담. */
  chat: string[];
  /** 동행 대화(E): 가끔 하는 제안 ({spot}: 가까운 낚시터 · 채집 지점). */
  suggest: { fish: string[]; forage: string[] };
  /** 머리 위 말풍선 (20자 안쪽). */
  react: Record<CompanionReact, string[]>;
  /** 지나가는 다른 주민({other})을 만났을 때 · 근처 다른 친구({friend})에게. */
  meet: string[];
  friend: string[];
  /** 내 기분이 낮을 때. */
  lowMood: string[];
  /** 특별한 순간 (한 번씩). */
  moment: Record<CompanionMoment, string[]>;
  /** 연인·약혼·배우자와 다닐 때: 수락 · 잡담 · 헤어질 때. */
  love: { accept: string[]; chat: string[]; part: string[] };
};
