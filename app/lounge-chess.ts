import { Chess, type Square } from 'chess.js';
export type ChessMatch = {
  id: string;
  moves: string[];
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
  /** Seat (0 white, 1 black) with a pending draw offer. Absent in old snapshots. */
  drawOffer?: number | null;
  /** Ply at which each seat last offered a draw; one offer per seat per ply. */
  drawOfferPly?: [number, number];
};
export const CHESS_MOVE_MS = 120_000;
export const newChess = (id: string): ChessMatch => ({
  id,
  moves: [],
  winner: null,
  reason: '',
});
export function chessBoard(game: ChessMatch) {
  const c = new Chess();
  for (const uci of game.moves)
    c.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      ...(uci[4] ? { promotion: uci[4] } : {}),
    });
  return c;
}
export function chessMove(
  game: ChessMatch,
  seat: number,
  from: string,
  to: string,
  promotion = 'q',
): ChessMatch | null {
  if (
    game.winner ||
    seat < 0 ||
    seat > 1 ||
    !['q', 'r', 'b', 'n'].includes(promotion)
  )
    return null;
  const c = chessBoard(game);
  if (c.turn() !== (seat === 0 ? 'w' : 'b')) return null;
  try {
    const m = c.move({ from: from as Square, to: to as Square, promotion });
    if (!m) return null;
    // Moving answers a pending offer with a decline.
    const next = {
      ...game,
      drawOffer: null,
      moves: [...game.moves, m.from + m.to + (m.promotion ?? '')],
    };
    if (c.isCheckmate())
      return {
        ...next,
        winner: c.turn() === 'w' ? 'b' : 'w',
        reason: '체크메이트',
      };
    if (c.isDraw())
      return {
        ...next,
        winner: 'draw',
        reason: c.isStalemate()
          ? '스테일메이트'
          : c.isThreefoldRepetition()
            ? '동일 포지션 3회'
            : c.isInsufficientMaterial()
              ? '기물 부족'
              : '50수 규칙',
      };
    return next;
  } catch {
    return null;
  }
}
export function chessResign(game: ChessMatch, seat: number): ChessMatch | null {
  return game.winner || ![0, 1].includes(seat)
    ? null
    : { ...game, winner: seat === 0 ? 'b' : 'w', reason: '기권' };
}
export function chessOfferDraw(
  game: ChessMatch,
  seat: number,
): ChessMatch | null {
  if (game.winner || ![0, 1].includes(seat)) return null;
  const plies = game.drawOfferPly ?? [-1, -1];
  if (
    (game.drawOffer !== undefined && game.drawOffer !== null) ||
    plies[seat] === game.moves.length
  )
    return null;
  const drawOfferPly: [number, number] = [...plies] as [number, number];
  drawOfferPly[seat] = game.moves.length;
  return { ...game, drawOffer: seat, drawOfferPly };
}
export function chessAnswerDraw(
  game: ChessMatch,
  seat: number,
  accept: boolean,
): ChessMatch | null {
  if (
    game.winner ||
    ![0, 1].includes(seat) ||
    game.drawOffer === undefined ||
    game.drawOffer === null ||
    game.drawOffer === seat
  )
    return null;
  return accept
    ? { ...game, drawOffer: null, winner: 'draw', reason: '무승부 합의' }
    : { ...game, drawOffer: null };
}
/** Side to move ran out of time. A lone king (or king + one minor) cannot win. */
export function chessTimeout(game: ChessMatch): ChessMatch | null {
  if (game.winner) return null;
  const c = chessBoard(game),
    loser = c.turn(),
    winner = loser === 'w' ? 'b' : 'w';
  const pieces = c
    .board()
    .flat()
    .filter((p) => p && p.color === winner && p.type !== 'k');
  const cannotMate =
    pieces.length === 0 ||
    (pieces.length === 1 && ['n', 'b'].includes(pieces[0]!.type));
  return cannotMate
    ? { ...game, drawOffer: null, winner: 'draw', reason: '시간 초과 · 기물 부족' }
    : { ...game, drawOffer: null, winner, reason: '시간 초과' };
}
export function chessPracticeMove(game: ChessMatch) {
  const c = chessBoard(game),
    values: Record<string, number> = { p: 1, n: 3, b: 3.1, r: 5, q: 9, k: 0 };
  let best = -Infinity,
    selected = '';
  for (const m of c.moves({ verbose: true })) {
    c.move(m);
    let score =
      (m.captured ? values[m.captured] : 0) +
      (m.promotion ? 8 : 0) +
      (c.isCheckmate() ? 10000 : 0) +
      (c.isCheck() ? 0.15 : 0);
    const replies = c.moves({ verbose: true });
    score -= Math.max(
      0,
      ...replies.map((r) => (r.captured ? values[r.captured] : 0)),
    );
    score +=
      0.02 * (3.5 - Math.abs(m.to.charCodeAt(0) - 97 - 3.5)) +
      Math.random() * 0.05;
    c.undo();
    if (score > best) {
      best = score;
      selected = m.from + m.to + (m.promotion ?? '');
    }
  }
  return selected;
}
