import type { GameKind } from '../lounge-games';
import { lazyRetry } from './ErrorBoundary';

// Each game table is its own chunk (with its own CSS).
export const ChessBoard = lazyRetry(() =>
  import('../lounge-boards').then((m) => ({ default: m.ChessBoard })),
);
export const GoBoard = lazyRetry(() =>
  import('../lounge-go-table').then((m) => ({ default: m.GoBoard })),
);
export const PokerTable = lazyRetry(() =>
  import('../lounge-poker-table').then((m) => ({ default: m.PokerTable })),
);
export const BlackjackTable = lazyRetry(() =>
  import('../lounge-blackjack-table').then((m) => ({
    default: m.BlackjackTable,
  })),
);
export const SeotdaTable = lazyRetry(() =>
  import('../lounge-seotda-table').then((m) => ({ default: m.SeotdaTable })),
);

const TABLES = {
  chess: ChessBoard,
  gostop: GoBoard,
  poker: PokerTable,
  blackjack: BlackjackTable,
  seotda: SeotdaTable,
} satisfies Record<GameKind, { preload: () => void }>;

/**
 * Starts downloading a table early (e.g. when its invite card appears) so
 * joining renders it at once instead of flashing "테이블을 준비하는 중…".
 */
export function prefetchTable(kind: GameKind) {
  TABLES[kind].preload();
}
