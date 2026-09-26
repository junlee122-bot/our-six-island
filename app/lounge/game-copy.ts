// One place for per-game UI copy (descriptions, money labels, leave consequences).
import { GAME_INFO, type GameKind } from '../lounge-games';
import { josa } from '../lounge-text';

type Copy = {
  /** Player count, e.g. '2명' or '2–7명'. */
  players: string;
  /** One short line for choosers. */
  tagline: string;
  /** Label for the amount chosen in the invite. */
  amountLabel: string;
  /** One-line money rule shown under the amount. */
  moneyRule: string;
  /** What happens if I leave mid-game (game-screen leave / room leave / logout). */
  leaveActive: string;
};

export const GAME_COPY: Record<GameKind, Copy> = {
  chess: {
    players: '2명',
    tagline: '한 수의 여유 · 관전 가능',
    amountLabel: '판돈',
    moneyRule: '승자가 판돈을 가져가고, 무승부는 전액 돌려받아요.',
    leaveActive: '체스는 이번 대국이 기권패로 정산돼요.',
  },
  gostop: {
    players: '3명',
    tagline: '고와 스톱 사이',
    amountLabel: '최대 손실',
    moneyRule: '1점 = 100범. 정한 최대 손실 안에서 정산해요.',
    leaveActive:
      "고스톱은 무효가 되지 않아요. 내 자리는 '자리 비움'으로 표시되고 서버가 끝까지 대신 패를 내며, 결과대로 범이 정산돼요.",
  },
  seotda: {
    players: '2–7명',
    tagline: '두 장의 승부',
    amountLabel: '바이인',
    moneyRule: '처음에 100범씩 내요. 바이인이 최대 손실이에요.',
    leaveActive:
      '섯다는 남은 차례를 서버가 대신 진행하고(체크, 안 되면 다이) 결과대로 정산돼요.',
  },
  poker: {
    players: '2–7명',
    tagline: 'AI 딜러 · 칩으로 겨루기',
    amountLabel: '바이인',
    moneyRule:
      '바이인만큼의 칩으로 진행해요. 블라인드는 바이인의 1/50(최소 200범)이에요.',
    leaveActive:
      '홀덤은 남은 차례를 서버가 대신 진행하고(체크, 안 되면 폴드) 결과대로 정산돼요.',
  },
  blackjack: {
    players: '2–7명',
    tagline: 'AI 딜러와 21',
    amountLabel: '기본 베팅',
    moneyRule:
      '기본 베팅의 4배까지 예약하고, 쓰지 않은 금액은 끝나면 돌려받아요.',
    leaveActive: '블랙잭은 남은 손을 서버가 스탠드하고 결과대로 정산돼요.',
  },
  yacht: {
    players: '2–4명',
    tagline: '주사위 다섯 개 · 딜러 없이',
    amountLabel: '판돈',
    moneyRule: '1등이 모든 판돈을 가져가고, 동점이면 나눠 가져요.',
    leaveActive:
      '야추는 남은 차례를 서버가 대신 굴리고(가장 높은 칸에 기록) 결과대로 정산돼요.',
  },
  liar: {
    players: '3–7명',
    tagline: '거짓말쟁이를 찾아라 · 범 없이',
    amountLabel: '판돈',
    moneyRule: '범은 오가지 않아요. 점수만 겨뤄요.',
    leaveActive:
      '라이어 게임은 내 차례를 서버가 넘기고(힌트 패스·기권표) 끝까지 진행돼요.',
  },
};

/** Text for the "leave this game" confirmation. */
export function leaveConsequence(kind: GameKind, ended: boolean) {
  if (ended)
    return `${josa(GAME_INFO[kind].name, '은/는')} 이번 판 정산이 끝났어요. 일어나면 다음 판 참가자에서 빠져요.`;
  return GAME_COPY[kind].leaveActive;
}
