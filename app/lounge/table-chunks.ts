import { memo, type ComponentType } from 'react';
import type { GameKind } from '../lounge-games';
import { lazyRetry } from './ErrorBoundary';
import { sameTableProps } from '../lounge-view-share';

// Each game table is its own chunk (with its own CSS).
const chess = lazyRetry(() =>
  import('../lounge-boards').then((m) => ({ default: m.ChessBoard })),
);
const gostop = lazyRetry(() =>
  import('../lounge-go-table').then((m) => ({ default: m.GoBoard })),
);
const poker = lazyRetry(() =>
  import('../lounge-poker-table').then((m) => ({ default: m.PokerTable })),
);
const blackjack = lazyRetry(() =>
  import('../lounge-blackjack-table').then((m) => ({
    default: m.BlackjackTable,
  })),
);
const seotda = lazyRetry(() =>
  import('../lounge-seotda-table').then((m) => ({ default: m.SeotdaTable })),
);
const yacht = lazyRetry(() =>
  import('../lounge-yacht-table').then((m) => ({ default: m.YachtTable })),
);
const liar = lazyRetry(() =>
  import('../lounge-liar-table').then((m) => ({ default: m.LiarTable })),
);
const liarsbar = lazyRetry(() =>
  import('../lounge-liarsbar-table').then((m) => ({ default: m.LiarsBarTable })),
);

const table = <T extends ComponentType<never>>(c: T) =>
  memo(c as unknown as ComponentType<Record<string, unknown>>, sameTableProps) as unknown as T;

export const ChessBoard = table(chess);
export const GoBoard = table(gostop);
export const PokerTable = table(poker);
export const BlackjackTable = table(blackjack);
export const SeotdaTable = table(seotda);
export const YachtTable = table(yacht);
export const LiarTable = table(liar);
export const LiarsBarTable = table(liarsbar);

const TABLES = {
  chess,
  gostop,
  poker,
  blackjack,
  seotda,
  yacht,
  liar,
  liarsbar,
} satisfies Record<GameKind, { preload: () => void }>;

/**
 * Starts downloading a table early (e.g. when its invite card appears) so
 * joining renders it at once instead of flashing "테이블을 준비하는 중…".
 */
export function prefetchTable(kind: GameKind) {
  TABLES[kind].preload();
}
