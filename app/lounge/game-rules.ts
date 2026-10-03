// 규칙 카드: one short card per game (goal, turn, examples, clock), opened
// from the game screen header. Numbers come from the engines so the card
// never drifts from the rules the server applies.
import { TURN_LIMIT_MS, type GameKind } from '../lounge-games';
import { LB_CHAMBERS, LB_LIMIT_MS, LB_MAX_PLAY } from '../lounge-liarsbar';
import { LIAR_LIMIT_MS } from '../lounge-liar';
import { YACHT_BONUS, YACHT_BONUS_AT } from '../lounge-yacht';

export type RulesCard = {
  /** One sentence: how you win. */
  goal: string;
  /** What you do on your turn, in order. */
  turn: string[];
  /** Worked examples ("이럴 때는 이렇게 돼요"). */
  examples: { title: string; body: string }[];
  /** Clock and what the server does for a seat that does not act. */
  clock: string;
};

const sec = (ms: number) => `${Math.round(ms / 1000)}초`;

export const GAME_RULES: Record<GameKind, RulesCard> = {
  blackjack: {
    goal: '21을 넘지 않으면서 딜러 미쿠보다 21에 가까우면 이겨요.',
    turn: [
      '히트: 한 장 더 받아요. 21을 넘으면 버스트로 바로 져요.',
      '스탠드: 지금 합으로 멈춰요.',
      '더블: 처음 두 장일 때 베팅을 두 배로 하고 딱 한 장만 받아요.',
      '스플릿: 같은 값 두 장을 두 손으로 나눠요(한 번만, 나눈 손도 더블 가능).',
      '서렌더: 처음 두 장만 보고 포기하면 베팅의 절반만 잃어요(나누기 전, 딜러 블랙잭 확인 뒤).',
    ],
    examples: [
      { title: 'A + 6', body: '소프트 17이에요. A를 11로 세다가 21을 넘으면 1로 바뀌니 한 장 더 받아도 버스트가 없어요.' },
      { title: '1,000범으로 블랙잭', body: '처음 두 장이 A와 10이면 1,500범을 더 받아요(3:2). 딜러도 블랙잭이면 비겨요.' },
      { title: '16 대 딜러 10', body: '가장 불리한 손이에요. 서렌더하면 500범만 잃고 판을 끝내요.' },
    ],
    clock: `차례마다 ${sec(TURN_LIMIT_MS.blackjack)}. 시간이 지나거나 자리를 비우면 서버가 스탠드해요. 딜러는 17 이상에서 멈춰요.`,
  },
  poker: {
    goal: '내 카드 2장과 바닥 5장 중 가장 좋은 5장으로 겨뤄 팟을 가져가요.',
    turn: [
      '체크: 앞에 베팅이 없으면 그냥 넘겨요.',
      '콜: 앞사람 베팅만큼 맞춰요.',
      '레이즈: 더 올려요. 최소한 직전에 올린 만큼 더 올려야 해요.',
      '폴드: 이번 판을 포기해요. 이미 낸 칩은 돌려받지 못해요.',
    ],
    examples: [
      { title: '족보 순서', body: '로열·스트레이트 플러시 > 포카드 > 풀하우스 > 플러시 > 스트레이트 > 트리플 > 투 페어 > 원 페어 > 하이 카드.' },
      { title: '올인과 사이드 팟', body: '칩이 모자라도 올인할 수 있어요. 내가 맞춘 만큼만 걸린 팟에서 겨루고, 나머지는 사이드 팟으로 남은 사람끼리 겨뤄요.' },
      { title: '같은 족보', body: '남은 카드(키커)로 가려요. 그래도 같으면 팟을 나눠요.' },
    ],
    clock: `차례마다 ${sec(TURN_LIMIT_MS.poker)}. 시간이 지나면 체크, 체크할 수 없으면 폴드예요.`,
  },
  seotda: {
    goal: '화투 두 장의 족보가 가장 높은 사람이 판돈을 가져가요.',
    turn: [
      '두 장을 받은 뒤 한 번의 베팅으로 승부해요.',
      '체크 · 콜 · 레이즈 · 올인 · 다이 중에서 골라요.',
      '끝까지 남은 사람끼리 패를 열어요.',
    ],
    examples: [
      { title: '광땡과 땡', body: '38광땡이 가장 높고, 그다음 18·13광땡, 장땡(10땡)부터 1땡 순이에요.' },
      { title: '끗', body: '땡이 아니면 두 장 합의 끝자리로 겨뤄요. 5월 + 4월 = 9, 갑오(9끗)가 가장 높아요.' },
      { title: '땡잡이', body: '3월 광 + 7월 열끗은 상대 최고 패가 1~9땡일 때 이겨요. 아니면 망통이에요.' },
    ],
    clock: `차례마다 ${sec(TURN_LIMIT_MS.seotda)}. 시간이 지나면 체크, 체크할 수 없으면 다이예요.`,
  },
  gostop: {
    goal: '3점 이상 먼저 내고 스톱하면 이겨요. 1점 = 100범이에요.',
    turn: [
      '손패 한 장을 내요. 바닥에 같은 달이 있으면 가져와요.',
      '덱에서 한 장을 뒤집어 한 번 더 맞춰요.',
      '3점이 되면 고(더 하기) 또는 스톱(끝내기)을 골라요.',
    ],
    examples: [
      { title: '고도리', body: '2월·4월·8월 새 열끗 세 장을 모으면 5점이에요.' },
      { title: '홍단 · 청단 · 초단', body: '같은 무리 띠 세 장이면 각각 3점이에요.' },
      { title: '피', body: '피 10장부터 1점, 한 장 늘 때마다 1점씩 더해요. 쌍피는 두 장으로 세요.' },
    ],
    clock: `차례마다 ${sec(TURN_LIMIT_MS.gostop)}. 시간이 지나거나 자리를 비우면 서버가 대신 패를 내요.`,
  },
  chess: {
    goal: '상대 킹을 체크메이트하면 이겨요. 무승부면 판돈을 그대로 돌려받아요.',
    turn: [
      '내 말을 누르면 갈 수 있는 칸이 표시돼요. 그 칸을 누르면 옮겨요.',
      '폰이 끝 줄에 닿으면 승급할 말을 골라요.',
      '무승부 제안이나 기권은 판 옆의 버튼으로 해요.',
    ],
    examples: [
      { title: '캐슬링', body: '킹과 룩이 한 번도 움직이지 않았고 사이가 비어 있으면, 킹을 룩 쪽으로 두 칸 옮겨요.' },
      { title: '앙파상', body: '상대 폰이 두 칸 전진해 내 폰 옆에 서면, 바로 다음 수에 대각선으로 잡을 수 있어요.' },
      { title: '무승부', body: '체크가 아닌데 둘 수가 없거나(스테일메이트), 같은 형태가 3번 나오거나, 50수 동안 잡거나 폰을 움직이지 않으면 무승부예요.' },
    ],
    clock: `한 수에 ${sec(TURN_LIMIT_MS.chess)}. 시간이 지나면 시간패예요(상대 기물이 부족하면 무승부). 색은 판마다 바뀌어요.`,
  },
  yacht: {
    goal: '주사위 다섯 개로 12칸을 채워 총점이 가장 높으면 이겨요.',
    turn: [
      '최대 세 번 굴려요. 남길 주사위를 눌러 고정해요.',
      '다 굴렸으면 비어 있는 칸 하나에 점수를 적어요. 0점이라도 한 칸은 꼭 적어요.',
    ],
    examples: [
      { title: '풀하우스', body: '3 3 3 5 5 → 다섯 개 합 19점.' },
      { title: '스트레이트', body: '1 2 3 4 + 아무 눈 → S. 스트레이트 15점. 2 3 4 5 6 → L. 스트레이트 30점.' },
      { title: '보너스', body: `에이스부터 식스까지 합이 ${YACHT_BONUS_AT}점 이상이면 ${YACHT_BONUS}점을 더 받아요. 칸마다 같은 눈 세 개면 딱 ${YACHT_BONUS_AT}점이에요.` },
    ],
    clock: `차례마다 ${sec(TURN_LIMIT_MS.yacht)}. 시간이 지나면 서버가 굴리고 가장 높은 칸에 적어요.`,
  },
  liar: {
    goal: '시민은 라이어를 찾고, 라이어는 들키지 않거나 제시어를 맞혀요.',
    turn: [
      '시민은 제시어를, 라이어는 주제만 봐요.',
      '돌아가며 한 줄 힌트를 말해요. 너무 쉬우면 라이어가 알아채요.',
      '토론한 뒤 라이어라고 생각하는 사람에게 투표해요.',
      '라이어가 지목되면 제시어를 한 번 맞혀 볼 수 있어요.',
    ],
    examples: [
      { title: '주제: 과일, 제시어: 수박', body: '"여름에 많이 먹어요"는 좋은 힌트, "초록 줄무늬"는 라이어에게 너무 쉬운 힌트예요.' },
      { title: '점수', body: '라이어가 이기면 2점, 시민이 이기면 시민 모두 1점이에요.' },
    ],
    clock: `힌트 ${sec(LIAR_LIMIT_MS.hint)} · 토론 ${sec(LIAR_LIMIT_MS.discuss)} · 투표 ${sec(LIAR_LIMIT_MS.vote)}. 시간이 지나면 힌트는 패스, 투표는 기권이에요.`,
  },
  liarsbar: {
    goal: '허풍을 들키지 않고 뻥총에서 끝까지 살아남으면 이겨요.',
    turn: [
      `오늘의 카드(K · Q · A)라고 주장하며 1~${LB_MAX_PLAY}장을 뒤집어 내요. 조커는 무엇이든 돼요.`,
      '앞사람이 거짓말 같으면 "거짓말!"을 외쳐요.',
      '틀린 카드가 한 장이라도 있으면 낸 사람이, 모두 맞으면 외친 사람이 방아쇠를 당겨요.',
    ],
    examples: [
      { title: '오늘의 카드 Q', body: 'Q, 조커, K를 내며 "Q 세 장"이라고 하면 K 때문에 거짓말이에요.' },
      { title: '뻥총', body: `총마다 ${LB_CHAMBERS}칸 중 한 칸에 코르크가 있어요. 당길 때마다 확률이 1/${LB_CHAMBERS} → 1/${LB_CHAMBERS - 1} … 로 올라가요. 칸 위치는 시작할 때 암호로 잠가 두고, 끝나면 확인할 수 있어요.` },
    ],
    clock: `내기 ${sec(LB_LIMIT_MS.play)} · 방아쇠 ${sec(LB_LIMIT_MS.trigger)}. 시간이 지나면 맞는 카드 한 장을 대신 내요. 참가비가 걸린 판에서 두 번 연속 넘기면 기권이에요.`,
  },
};
