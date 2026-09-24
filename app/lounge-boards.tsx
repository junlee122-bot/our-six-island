'use client';
import { useMemo, useRef, useState } from 'react';
import type { Square } from 'chess.js';
import { LOUNGE_ASSETS } from './lounge-assets';
import { chessBoard, CHESS_MOVE_MS, type ChessMatch } from './lounge-chess';
import type { TurnTiming } from './lounge-room';
import { AWAY_LABEL, TurnTimer } from './lounge-turn-timer';
import { formatBeom } from './lounge-text';
const art = LOUNGE_ASSETS as Record<string, string>;
export function ChessBoard({
  match,
  seat,
  onMove,
  onResign,
  onDraw,
  names,
  settlement,
}: {
  match: ChessMatch & TurnTiming;
  seat: number;
  /** Resolves false when the server refused the move (unlocks the board). */
  onMove: (
    from: string,
    to: string,
    promotion?: string,
  ) => Promise<boolean> | void;
  onResign: () => void;
  /** Sends {kind:'draw', id, op}. Buttons are hidden when not provided. */
  onDraw?: (op: 'offer' | 'accept' | 'decline') => void;
  names: string[];
  /** My 범 result for this match once it is settled. */
  settlement?: number;
}) {
  const board = useMemo(() => chessBoard(match), [match]),
    [selected, setSelected] = useState<string | null>(null),
    // Colours alternate between rematches, so orientation resets per match.
    [flip, setFlip] = useState({ id: match.id, value: seat === 1 }),
    flipped = flip.id === match.id ? flip.value : seat === 1,
    setFlipped = (value: boolean) => setFlip({ id: match.id, value }),
    [promotion, setPromotion] = useState<{ from: string; to: string } | null>(
      null,
    ),
    [resign, setResign] = useState(false),
    // One move per ply: a second tap before the server answers is ignored.
    [sentPly, setSentPly] = useState<string | null>(null);
  const plyKey = `${match.id}:${match.moves.length}`;
  const turn = board.turn() === 'w' ? 0 : 1,
    canPlay = seat === turn && !match.winner && sentPly !== plyKey,
    legal =
      selected && canPlay
        ? board.moves({ square: selected as Square, verbose: true })
        : [];
  // Every new ply clears the local selection (reset during render).
  const [seenPly, setSeenPly] = useState(plyKey);
  if (seenPly !== plyKey) {
    setSeenPly(plyKey);
    setSelected(null);
    setPromotion(null);
    setResign(false);
  }
  const inFlight = useRef<string | null>(null);
  const send = (from: string, to: string, promo?: string) => {
    if (inFlight.current === plyKey) return;
    inFlight.current = plyKey;
    setSentPly(plyKey);
    const answer = onMove(from, to, promo);
    if (answer)
      void answer.then((ok) => {
        if (ok) return;
        if (inFlight.current === plyKey) inFlight.current = null;
        setSentPly((value) => (value === plyKey ? null : value));
      });
  };
  const choose = (sq: string) => {
    if (!canPlay) return;
    const move = legal.find((m) => m.to === sq);
    if (move) {
      if (move.isPromotion()) setPromotion({ from: selected!, to: sq });
      else send(selected!, sq);
      setSelected(null);
    } else
      setSelected(board.get(sq as Square)?.color === board.turn() ? sq : null);
  };
  const squares = Array.from(
    { length: 64 },
    (_, i) =>
      `${'abcdefgh'[flipped ? 7 - (i % 8) : i % 8]}${flipped ? 1 + Math.floor(i / 8) : 8 - Math.floor(i / 8)}`,
  );
  return (
    <div className="l-chess-layout">
      <div>
        <div className="l-turn-row">
          <div className="l-game-status" aria-live="polite">
            {match.winner
              ? `${match.winner === 'draw' ? '무승부' : names[match.winner === 'w' ? 0 : 1] + ' 승리'} · ${match.reason}`
              : `${names[turn]}의 차례${board.isCheck() ? ' · 체크!' : ''}`}
          </div>
          {!match.winner && (
            <TurnTimer
              deadline={match.turnDeadline}
              total={CHESS_MOVE_MS}
              label={
                match.away?.includes(turn)
                  ? `${names[turn]} 연결 끊김`
                  : seat === turn
                    ? '내 수'
                    : `${names[turn]}의 수`
              }
              mine={seat === turn}
            />
          )}
        </div>
        <div className="l-chessboard" role="group" aria-label="체스판">
          {squares.map((sq, i) => {
            const piece = board.get(sq as Square),
              last = match.moves.at(-1),
              highlight = legal.some((m) => m.to === sq);
            return (
              <button
                key={sq}
                aria-label={`${sq}${piece ? ' ' + (piece.color === 'w' ? '백' : '흑') + ' ' + { k: '킹', q: '퀸', r: '룩', b: '비숍', n: '나이트', p: '폰' }[piece.type] : ' 빈 칸'}`}
                aria-pressed={selected === sq}
                onClick={() => choose(sq)}
                className={`${(Math.floor(i / 8) + (i % 8)) % 2 ? 'dark' : 'light'} ${highlight ? 'legal' : ''} ${selected === sq ? 'selected' : ''} ${last && (last.slice(0, 2) === sq || last.slice(2, 4) === sq) ? 'last' : ''}`}
              >
                {i % 8 === 0 && <small className="rank">{sq[1]}</small>}
                {i >= 56 && <small className="file">{sq[0]}</small>}
                {piece && (
                  <img
                    src={art[piece.color + piece.type.toUpperCase()]}
                    alt=""
                    draggable={false}
                  />
                )}
              </button>
            );
          })}
        </div>
        {promotion && (
          <div
            className="l-promotion"
            role="group"
            aria-label="승급할 기물 선택"
          >
            <strong>어떤 기물로 승급할까요?</strong>
            <button
              className="l-text"
              aria-label="승급 취소"
              onClick={() => setPromotion(null)}
            >
              취소
            </button>
            {['q', 'r', 'b', 'n'].map((p) => (
              <button
                key={p}
                aria-label={{ q: '퀸', r: '룩', b: '비숍', n: '나이트' }[p]}
                onClick={() => {
                  send(promotion.from, promotion.to, p);
                  setPromotion(null);
                }}
              >
                <img src={art[board.turn() + p.toUpperCase()]} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <aside className="l-game-aside">
        <span className="l-kicker">체스 · 2명</span>
        <h3>한 수의 여유</h3>
        <p>
          {seat < 0
            ? '관전 중이에요. 친구들의 다음 수를 지켜봐 주세요.'
            : '기물을 선택하면 갈 수 있는 칸이 표시돼요. 캐슬링·앙파상·승급을 지원하며, 3회 반복과 50수는 자동 무승부로 처리해요. 한 수에 2분이 지나면 시간패(상대 기물이 부족하면 무승부)이고, 색은 판마다 바뀌어요.'}
        </p>
        <div className="l-move-log">
          <strong>기보</strong>
          {board.history().length ? (
            Array.from(
              { length: Math.ceil(board.history().length / 2) },
              (_, i) => (
                <div key={i}>
                  <small>{i + 1}.</small>
                  <span>{board.history()[i * 2]}</span>
                  <span>{board.history()[i * 2 + 1] ?? '—'}</span>
                </div>
              ),
            )
          ) : (
            <p>
              {match.winner
                ? '수를 두기 전에 끝났어요.'
                : '첫 수를 기다리고 있어요.'}
            </p>
          )}
        </div>
        {match.winner && seat >= 0 && settlement !== undefined && (
          <output className="l-chess-settlement">
            <small>이번 판 정산</small>
            <b className={settlement > 0 ? 'is-win' : settlement < 0 ? 'is-lose' : ''}>
              {settlement > 0 ? '+' : settlement < 0 ? '−' : ''}
              {formatBeom(Math.abs(settlement))}
            </b>
          </output>
        )}
        <button className="l-secondary" onClick={() => setFlipped(!flipped)}>
          체스판 뒤집기
        </button>
        {match.away?.map((s) => (
          <span key={s} className="seat-away">
            {names[s]} · {AWAY_LABEL.replace('자동 진행', '시간 초과 시 패배')}
          </span>
        ))}
        {onDraw &&
          seat >= 0 &&
          !match.winner &&
          (match.drawOffer === 1 - seat ? (
            <div className="l-inline-confirm">
              <span>{names[1 - seat]}의 무승부 제안</span>
              <button onClick={() => onDraw('accept')}>수락</button>
              <button onClick={() => onDraw('decline')}>거절</button>
            </div>
          ) : match.drawOffer === seat ? (
            <p className="l-text">무승부를 제안했어요. 답을 기다리는 중…</p>
          ) : (
            <button
              className="l-text"
              disabled={match.drawOfferPly?.[seat] === match.moves.length}
              onClick={() => onDraw('offer')}
            >
              무승부 제안
            </button>
          ))}
        {seat >= 0 &&
          !match.winner &&
          (resign ? (
            <div className="l-inline-confirm">
              <span>이번 판을 기권할까요?</span>
              <button onClick={onResign}>기권</button>
              <button onClick={() => setResign(false)}>계속</button>
            </div>
          ) : (
            <button className="l-text" onClick={() => setResign(true)}>
              기권하기
            </button>
          ))}
      </aside>
    </div>
  );
}
export { GoBoard } from './lounge-go-table';
