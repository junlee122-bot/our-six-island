// 허 선장's lines at the 허풍 카드 table (허풍 주점). Built only from the
// public view (lounge-liarsbar.ts liarsBarView), so a line can never hint at
// a face-down card or a chamber; the pick is a hash of the match, revision
// and event, so every client shows the same line. Every pool entry passes
// FORBIDDEN_LINE (never urges more 범) — tested.
import { pickLine, type DealerLine, type DealerMood } from './lounge-dealer-lines.ts';
import { LB_FACE_NAME, type LiarsBarView } from './lounge-liarsbar.ts';
import { josa } from './lounge-text.ts';

export const CAPTAIN_LINES = {
  start: [
    '어서 와요, 허풍 주점이에요. 오늘 밤도 허풍 한 판!',
    '탄창은 제가 방금 채웠어요. 다들 행운을 빌어요.',
    '자리 잡았으면 시작해요. 뻔뻔한 사람이 이기는 곳이에요.',
  ],
  round: [
    '이번 판 오늘의 카드는 {card}예요.',
    '{card}! 자, 누가 제일 뻔뻔한지 볼까요?',
    '오늘의 카드는 {card}. 내가 젊을 때는 이 카드로 고래도 속였어요.',
  ],
  play: ['{name|이/가} {n}장이래요.', '{n}장이라… 배짱 좋네요.', '{name} 님, {n}장을 내려놨어요.'],
  myTurnCall: ['{prev} 님이 {n}장이래요. 믿을까요, 말까요?', '내 차례예요. 1–5로 카드를 고르고 Enter, 의심되면 L이에요.'],
  myTurn: ['내 차례예요. 1–5로 1~3장을 고르고 Enter로 내요.', '내 차례예요. “전부 {card}”라고 우겨 봐요.'],
  forced: ['다른 사람 손이 다 비었어요. 이번엔 “거짓말!”만 할 수 있어요.'],
  waiting: ['{name} 님 차례예요.', '{name} 님이 카드를 고르는 중이에요.'],
  call: ["{name|이/가} '거짓말!'을 외쳤어요!", '딸랑! {name|이/가} 벨을 눌렀어요.'],
  truth: ['진짜였네요! 이번엔 {shooter|이/가} 당겨야겠어요.', '전부 진짜! {shooter} 님, 뻥총 앞으로요.'],
  lie: ['뻥이었어요! {shooter} 님, 방아쇠 앞으로요.', '들켰네요! {shooter} 님이 당길 차례예요.'],
  trigger: ['천천히 숨 한 번 쉬고요.', '내가 젊을 때 고래 앞에서도 이렇게 떨진 않았어요.', '{shooter} 님, 준비되면 당겨요.'],
  myTrigger: ['내가 당길 차례예요. Space로 방아쇠를 당겨요.', '숨 한 번 쉬고, Space로 당겨요.'],
  safe: ['휴, 딸깍! 살았다!', '하늘이 도왔네요.', '딸깍! {shooter} 님은 아직 버텨요.'],
  out: ['뻥! {shooter} 님은 오늘 여기까지예요. 검댕은 제가 닦아 줄게요.', '뻥! {shooter} 님이 뻗었어요. 한숨 돌리고 구경해요.'],
  win: ['마지막까지 버틴 {name} 님! 오늘의 허풍왕이에요!', '{name} 님 우승! 라고 내가 그랬지!'],
  away: ['{name} 님이 잠깐 자리를 비웠어요. 제가 대신 한 장 내 둘게요.'],
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

/** 허 선장's line for the current public state (`names` by seat). */
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
