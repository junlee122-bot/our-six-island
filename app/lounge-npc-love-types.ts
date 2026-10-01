/**
 * ============================================================================
 *  연애·결혼 대사 형식 (NPC LOVE LINE FILES)
 * ============================================================================
 *
 *  주민마다 파일이 하나씩 있어요(app/lounge-npc-love-<id>.ts). 평소 대사
 *  (lounge-npc-lines-<id>.ts)와 같은 규칙이에요. 설계와 숫자는
 *  handover/design/design-romance.md에 있어요.
 *
 *  - 한 줄은 60자 안쪽. 이모지·영어·광고 말투는 쓰지 않아요.
 *  - 주민의 말투(존댓말/반말/하십시오체)와 성격을 그대로 지켜요.
 *  - 노골적인 성적 표현은 쓰지 않아요. 손잡기, 안아 주기, 기대기 정도까지.
 *  - 문장 속 {이름표}는 게임이 채워요:
 *      {me}       말을 건 친구 이름          {name}    이 주민 이름
 *      {season}   지금 계절                  {weather} 오늘 날씨
 *      {item}     건네는 물건 이름(아침 선물)  {partner} 친구의 연인·배우자 이름(질투·놀림)
 *      {days}     함께한 날수(기념일)
 *    이름 뒤에는 조사를 바로 붙이지 말고 "{me}, 안녕"처럼 문장부호를 둬요.
 *  - 같은 날, 같은 사람에게는 같은 대사가 나와요(모든 친구 화면에서 같음).
 * ============================================================================
 */
import type { Season, TimeOfDay } from './lounge-calendar.ts';

/** Heart bands of a friend who is not (yet) their partner, then the three partner states. */
export type NpcLoveTier = 'h0' | 'h3' | 'h5' | 'h7' | 'dating' | 'engaged' | 'married';
export const NPC_LOVE_TIERS: readonly NpcLoveTier[] = ['h0', 'h3', 'h5', 'h7', 'dating', 'engaged', 'married'];

export type NpcLoveSet = {
  /**
   * 하트 단계별 이야기 (평소 대사에 섞여 나와요).
   *   h0 0~2하트 · h3 3~4하트 · h5 5~6하트 · h7 7~8하트(설렘, 고백 직전)
   *   dating 연인 · engaged 약혼 · married 결혼 뒤
   */
  tier: Record<NpcLoveTier, string[]>;
  /** 연인·약혼·결혼 상대에게 하는 인사: 시간대, 날씨, 계절. */
  greet: Record<TimeOfDay, string[]>;
  weather: { rain: string[]; snow: string[]; sunny: string[] };
  season: Record<Season, string[]>;
  /** 꽃다발을 받았을 때: 수락(8하트 이상) · 거절(아직 아님) · 다른 사람과 사귀는 중이라 거절. */
  ask: { accept: string[]; decline: string[]; taken: string[] };
  /** 청혼 반지를 받았을 때: 수락(10하트, 사귄 지 사흘 이상) · 거절(아직 아님). */
  propose: { accept: string[]; decline: string[] };
  /** 결혼식에서 하는 말(혼인 서약), 순서대로 한 장씩. */
  wedding: string[];
  /** 결혼 뒤 일상: 집에서의 아침 · 퇴근 뒤 저녁 · 기념일({days}) · 아침 선물({item}) · 잘 자. */
  home: { morning: string[]; evening: string[]; anniversary: string[]; gift: string[]; night: string[] };
  /** 친구가 다른 주민({partner})과 사귈 때: 5하트 이상이면 질투, 아니면 놀림. */
  jealous: string[];
  tease: string[];
  /** 헤어지거나 이혼했을 때. */
  breakup: string[];
};
