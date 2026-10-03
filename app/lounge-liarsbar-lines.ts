// 샹크스's lines at the 허풍 카드 table (허풍 주점), in his easy, laughing 반말. Built only from the
// public view (lounge-liarsbar.ts liarsBarView), so a line can never hint at
// a face-down card or a chamber; the pick is a hash of the match, revision
// and event, so every client shows the same line. Every pool entry passes
// FORBIDDEN_LINE (never urges more 범) — tested.
import { pickLine, type DealerLine, type DealerMood } from './lounge-dealer-lines.ts';
import { LB_FACE_NAME, type LiarsBarView } from './lounge-liarsbar.ts';
import { josa } from './lounge-text.ts';

export const CAPTAIN_LINES = {
  start: [
    '어서 와, 허풍 주점이다! 오늘 밤 제일 뻔뻔한 얼굴은 누굴까. 하하!',
    '탄창은 방금 내가 채웠다. 한 손으로도 금방이지. 다들 행운을 빈다.',
    '자리 잡았으면 시작하자. 여긴 웃으면서 속이는 사람이 이기는 데다.',
  ],
  round: [
    '이번 판 오늘의 카드는 {card}다.',
    '{card}! 자, 누가 제일 시치미를 잘 떼나 보자.',
    '오늘의 카드는 {card}. 다하하, 얼굴 표정 관리 잘해라.',
  ],
  play: ['{name|이/가} {n}장이래.', '{n}장이라… 배짱 좋네. 하하!', '{name}, {n}장 내려놨다.'],
  myTurnCall: ['{prev}, {n}장이래. 믿을래, 말래?', '네 차례다. 1–5로 카드를 고르고 Enter, 수상하면 L이다.'],
  myTurn: ['네 차례다. 1–5로 1~3장을 고르고 Enter로 내.', '네 차례다. 웃으면서 “전부 {card}”라고 우겨 봐.'],
  forced: ['다른 사람 손이 다 비었다. 이번엔 “거짓말!”만 할 수 있어.'],
  waiting: ['{name} 차례다.', '{name}, 카드 고르는 중이다. 느긋하게 기다리자.'],
  call: ["{name|이/가} '거짓말!'을 외쳤다!", '딸랑! {name|이/가} 벨을 눌렀다.'],
  truth: ['진짜였네! 이번엔 {shooter|이/가} 당길 차례다.', '전부 진짜! {shooter}, 뻥총 앞으로.'],
  lie: ['뻥이었구나! {shooter}, 방아쇠 앞으로. 하하!', '들켰네! {shooter|이/가} 당길 차례다.'],
  trigger: ['천천히, 숨 한 번 쉬고.', '떨리지? 그 떨림까지가 이 판의 재미다.', '{shooter}, 준비되면 당겨.'],
  myTrigger: ['네가 당길 차례다. Space로 방아쇠를 당겨.', '숨 한 번 쉬고, Space로 당겨.'],
  safe: ['딸깍! 살았다! 다하하!', '하늘이 도왔네.', '딸깍! {shooter}, 아직 버틴다.'],
  out: ['뻥! {shooter}, 오늘은 여기까지다. 검댕은 내가 닦아 줄게.', '뻥! {shooter|이/가} 뻗었다. 한숨 돌리고 구경하자.'],
  win: ['마지막까지 버틴 {name}! 오늘의 허풍왕이다! 하하하!', '{name} 우승! 오늘 밤은 네 이야기로 잔치다!'],
  away: ['{name|이/가} 잠깐 자리를 비웠다. 내가 대신 한 장 내 둘게.'],
} as const;

type Ctx = Record<string, string | number>;
/** Fills {key} and {key|이/가} templates. */
function fill(line: string, ctx: Ctx) {
  return line.replace(/\{(\w+)(?:\|([^}]+))?\}/g, (_, key: string, pair?: string) => {
    const v = ctx[key];
    if (v === undefined) return '';
    return pair ? josa(String(v), pair as Parameters<typeof josa>[1]) : String(v);
  });
}
function say(key: keyof typeof CAPTAIN_LINES, v: Pick<LiarsBarView, 'id' | 'revision'>, ctx: Ctx, mood: DealerMood): DealerLine {
  return { text: fill(pickLine(CAPTAIN_LINES[key], `${v.id}:${v.revision}:${key}`), ctx), mood };
}

/** 샹크스's line for the current public state (`names` by seat). */
export function captainLine(v: LiarsBarView, names: readonly string[], away: readonly number[] = []): DealerLine {
  const card = LB_FACE_NAME[v.table];
  const shooter = v.shooter >= 0 ? (names[v.shooter] ?? '') : '';
  if (v.phase === 'over') return say('win', v, { name: names[v.winner ?? 0] ?? '' }, 'smile');
  if (v.phase === 'reveal' && v.reveal)
    return say(v.reveal.lie ? 'lie' : 'truth', v, { shooter }, 'wow');
  if (v.phase === 'trigger')
    return v.legal.trigger ? say('myTrigger', v, { shooter }, 'focus') : say('trigger', v, { shooter }, 'focus');
  if (v.phase === 'shot' && v.lastShot)
    return v.lastShot.out ? say('out', v, { shooter }, 'sorry') : say('safe', v, { shooter }, 'smile');
  // Play phase.
  const last = v.plays[v.plays.length - 1];
  if (away.includes(v.turn)) return say('away', v, { name: names[v.turn] ?? '' }, 'calm');
  if (v.legal.forced) return say('forced', v, {}, 'focus');
  if (v.legal.play || v.legal.call)
    return last && v.legal.call
      ? say('myTurnCall', v, { prev: names[last.seat] ?? '', n: last.count }, 'focus')
      : say('myTurn', v, { card }, 'calm');
  if (!last) return say(v.round <= 1 ? 'start' : 'round', v, { card }, 'smile');
  return say('play', v, { name: names[last.seat] ?? '', n: last.count }, 'calm');
}

/** Every pool line (tests). */
export const allCaptainLines = (): string[] => Object.values(CAPTAIN_LINES).flat();
