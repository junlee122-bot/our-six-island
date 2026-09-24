'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Coins, Send } from 'lucide-react';
import { GAME_INFO, type GameKind } from '../lounge-games';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { ReactionId } from '../lounge-reactions';
import { ReactionDock } from '../lounge-reaction-ui';
import { RoundReady } from '../lounge-round-ready';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa, NAMES } from '../lounge-text';
import { GAME_COPY, leaveConsequence } from './game-copy';
import { Invitations } from './Invitations';
import { ConfirmModal } from './Modal';
import { attention, playCue } from './feedback';
import { ErrorState, ScreenBoundary } from './ErrorBoundary';
import {
  BlackjackTable,
  ChessBoard,
  GoBoard,
  PokerTable,
  SeotdaTable,
} from './table-chunks';
import type { Notify } from './Toast';

/** Dark casino screens get a dark sticker bar (chess is a light screen). */
const DARK: GameKind[] = ['poker', 'blackjack'];

type TableSnapshot = { members: string[]; ready: string[]; required: number };

/** Why my retained table went away (or dropped me) while I was looking at it. */
function dissolvedText(
  kind: GameKind,
  previous: TableSnapshot,
  stillSeated: boolean,
  view: CloudRoomView,
) {
  const game = GAME_INFO[kind].name;
  if (stillSeated) return '';
  if (!previous.ready.includes(view.self))
    return `준비 시간이 지나 ${game} 자리에서 빠졌어요. 범은 빠지지 않았어요.`;
  const late = previous.members
    .filter((id) => id !== view.self && !previous.ready.includes(id))
    .map((id) => {
      const p = view.players.find((p) => p.id === id);
      return p ? ACTORS[p.actor] : '친구';
    });
  return late.length
    ? `${josa(late.join(', '), '이/가')} 준비하지 않아 ${game} 테이블이 정리됐어요. 범은 빠지지 않았어요.`
    : `인원이 모자라 ${game} 테이블이 정리됐어요. 범은 빠지지 않았어요.`;
}

type Legal = { legal?: { enabled?: boolean } };

/** Whether the local seat must act now (drives highlight, scroll and sound). */
export function myTurn(kind: GameKind, view: CloudRoomView, seat: number) {
  if (seat < 0) return false;
  if (kind === 'chess') {
    const m = view.chess;
    return !!m && !m.winner && m.moves.length % 2 === seat;
  }
  if (kind === 'gostop') {
    const g = view.gostop;
    return !!g && g.phase !== 'over' && g.turn === seat;
  }
  return !!(view[kind] as Legal | null)?.legal?.enabled;
}

function gameEnded(kind: GameKind, view: CloudRoomView) {
  return kind === 'chess'
    ? !!view.chess?.winner
    : kind === 'gostop'
      ? view.gostop?.phase === 'over'
      : view[kind]?.phase === 'over';
}

export function GameScreen({
  kind,
  room,
  view,
  onBack,
  onRequest,
  reactionsHidden,
  onReactionsHidden,
  notify,
  place = NAMES.village,
}: {
  kind: GameKind;
  room: CloudRoom;
  view: CloudRoomView;
  onBack: () => void;
  onRequest: (kind: GameKind, preselect?: string[]) => void;
  reactionsHidden: boolean;
  onReactionsHidden: (value: boolean) => void;
  /** Toasts (e.g. when the ready deadline dissolves my table). */
  notify?: Notify;
  /** Where closing the table returns to (회관, 카지노, 마을…). */
  place?: string;
}) {
  const backLabel = `${josa(place, '으로/로')} 돌아가기`;
  const [leave, setLeave] = useState(false),
    [leaveError, setLeaveError] = useState(''),
    [displayedGoRevision, setDisplayedGoRevision] = useState(
      view.gostop?.revision,
    ),
    table = view.tables?.[kind],
    belongs = !!table?.members.includes(view.self),
    seats = view.seats[kind],
    seat = table && !belongs ? -1 : seats.indexOf(view.self),
    names = seats.map((id, i) => {
      const p = view.players.find((p) => p.id === id);
      return p ? ACTORS[p.actor] : (view.names[kind]?.[i] ?? `참가자 ${i + 1}`);
    }),
    match =
      kind === 'chess'
        ? view.chess
        : kind === 'gostop'
          ? view.gostop
          : view[kind],
    ended = gameEnded(kind, view),
    turn = myTurn(kind, view, seat),
    stage = useRef<HTMLDivElement>(null),
    wasTurn = useRef(false),
    wasEnded = useRef(ended),
    [leaving, setLeaving] = useState(false),
    // The table I sit at (as last seen) and, once the ready deadline dissolves
    // it or drops me, why. Tracked during render (no effect cascade).
    [seen, setSeen] = useState<{
      table: TableSnapshot | null;
      dissolved: { text: string; members: string[] } | null;
    }>({ table: belongs && table ? table : null, dissolved: null }),
    dissolved = seen.dissolved,
    settlement = view.wallet.history.find((h) => h.id === match?.id)?.delta;
  if (belongs && table) {
    if (
      seen.table?.members !== table.members ||
      seen.table?.ready !== table.ready ||
      seen.dissolved
    )
      setSeen({ table, dissolved: null });
  } else if (seen.table) {
    const text = leaving
      ? ''
      : dissolvedText(kind, seen.table, belongs, view);
    setSeen({
      table: null,
      dissolved: text
        ? {
            text,
            members: seen.table.members.filter((id) => id !== view.self),
          }
        : null,
    });
  }
  // Only while I hold a seat: once the table is dissolved (or I was dropped)
  // the old match's seat list still names me, but there is nothing to leave.
  const canLeave = belongs || (seat >= 0 && !table && !ended && !dissolved);
  if (leave && !canLeave && !leaving) setLeave(false);
  // Say it once as a toast too (the note stays under the result).
  useEffect(() => {
    if (dissolved) notify?.(dissolved.text, 'info');
  }, [dissolved, notify]);
  useEffect(() => {
    if (turn && !wasTurn.current) {
      attention('turn', `${GAME_INFO[kind].name} · 내 차례예요.`);
      stage.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
    wasTurn.current = turn;
  }, [turn, kind]);
  useEffect(() => {
    if (ended && !wasEnded.current && seat >= 0) {
      // This match's own result (the newest history row can be another game).
      const last = settlement ?? 0;
      playCue(last > 0 ? 'win' : last < 0 ? 'lose' : 'start');
    }
    wasEnded.current = ended;
  }, [ended, seat, settlement]);
  const act =
    <A,>(build: (a: A) => Parameters<CloudRoom['action']>[0]) =>
    // Returns the Promise so tables can unlock when the server answers.
    (a: A) =>
      room.action(build(a));
  const dark = DARK.includes(kind);
  const sendReaction = (id: ReactionId) =>
    room.action({ kind: 'reaction', id, scope: kind, matchId: match?.id });
  const empty = table ? Math.max(0, table.required - table.members.length) : 0;
  return (
    <section
      className={'l-game-screen ' + kind + (dark ? ' is-dark' : '')}
      data-my-turn={turn || undefined}
    >
      <header>
        <button
          className="l-game-back"
          onClick={onBack}
          title="둘러보는 동안에도 테이블 자리는 유지돼요"
          aria-label={backLabel}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          <span className="l-back-short">{place}</span>
          <span className="l-back-more">{backLabel}</span>
        </button>
        <span>
          <small>{table ? `${table.round}번째 판` : '친구와 한 판'}</small>
          <strong>{GAME_INFO[kind].name}</strong>
        </span>
        <div>
          <span className={'l-game-live' + (turn ? ' is-turn' : '')}>
            <i />
            {turn
              ? '내 차례'
              : ended
                ? belongs
                  ? '다음 판 준비'
                  : '게임 종료'
                : seat < 0
                  ? '관전 중'
                  : '대전 중'}
          </span>
          {canLeave && (
            <button
              className="l-text"
              onClick={() => setLeave(true)}
              data-testid="game-stand"
            >
              일어나기
            </button>
          )}
        </div>
      </header>
      <div className="l-game-content">
        <div className={dark ? 'l-sticker-float' : 'l-sticker-inline'}>
          <ReactionDock
            players={view.players}
            self={view.self}
            scope={kind}
            matchId={match?.id}
            connected
            hidden={reactionsHidden}
            onHidden={onReactionsHidden}
            onSend={sendReaction}
          />
        </div>
        <div className="l-game-money">
          <span>{GAME_COPY[kind].moneyRule}</span>
          <b>
            <Coins size={14} /> {formatBeom(view.wallet.balance)}
            {view.wallet.held > 0
              ? ` · 예약 ${formatBeom(view.wallet.held)}`
              : ''}
          </b>
        </div>
        <Invitations room={room} view={view} />
        <div
          ref={stage}
          className={'l-table-stage' + (turn ? ' is-my-turn' : '')}
        >
          <ScreenBoundary
            name={kind}
            fallback={(retry, chunk) => (
              <ErrorState
                compact
                title="테이블을 불러오지 못했어요."
                body={
                  chunk
                    ? '새 버전이 올라왔을 수 있어요. 새로 고치면 자리는 그대로 유지돼요.'
                    : '잠시 뒤 다시 불러와 주세요. 자리는 그대로 유지돼요.'
                }
                retryLabel={chunk ? '새로 고치기' : '다시 불러오기'}
                onRetry={chunk ? () => location.reload() : retry}
                onBack={onBack}
                backLabel={backLabel}
              />
            )}
          >
            <Suspense
              fallback={
                <div className="l-empty">
                  <span className="l-spinner" />
                  <p>테이블을 준비하는 중…</p>
                </div>
              }
            >
              {match ? (
                kind === 'chess' ? (
                  <ChessBoard
                    match={view.chess!}
                    seat={seat}
                    names={names}
                    settlement={settlement}
                    onMove={(from, to, promotion) =>
                      room.action({
                        kind: 'chess',
                        id: view.chess!.id,
                        ply: view.chess!.moves.length,
                        from,
                        to,
                        promotion,
                      })
                    }
                    onResign={() =>
                      void room.action({ kind: 'resign', id: view.chess!.id })
                    }
                    onDraw={(op) =>
                      void room.action({ kind: 'draw', id: view.chess!.id, op })
                    }
                  />
                ) : kind === 'seotda' ? (
                  <SeotdaTable
                    match={view.seotda!}
                    seat={seat}
                    names={names}
                    onAction={act((action) => ({
                      kind: 'seotda',
                      id: view.seotda!.id,
                      revision: view.seotda!.revision,
                      action,
                    }))}
                  />
                ) : kind === 'blackjack' ? (
                  <BlackjackTable
                    match={view.blackjack!}
                    seat={seat}
                    names={names}
                    onAction={act((action) => ({
                      kind: 'blackjack',
                      id: view.blackjack!.id,
                      revision: view.blackjack!.revision,
                      action,
                    }))}
                  />
                ) : kind === 'poker' ? (
                  <PokerTable
                    match={view.poker!}
                    seat={seat}
                    names={names}
                    onAction={act((action) => ({
                      kind: 'poker',
                      id: view.poker!.id,
                      revision: view.poker!.revision,
                      action,
                    }))}
                  />
                ) : (
                  <GoBoard
                    match={view.gostop!}
                    seat={seat}
                    names={names}
                    onDisplayChange={setDisplayedGoRevision}
                    onAction={act((action) => ({
                      kind: 'gostop',
                      id: view.gostop!.id,
                      ply: view.gostop!.ply,
                      action,
                    }))}
                  />
                )
              ) : (
                <div className="l-empty">
                  <h2>아직 시작된 게임이 없어요.</h2>
                  <button className="l-primary" onClick={onBack}>
                    {backLabel}
                  </button>
                </div>
              )}
            </Suspense>
          </ScreenBoundary>
        </div>
        {ended &&
          belongs &&
          (kind !== 'gostop' ||
            displayedGoRevision === view.gostop?.revision) && (
            <RoundReady
              kind={kind}
              view={view}
              onReady={(ready) =>
                room.action({ kind: 'ready', game: kind, id: match!.id, ready })
              }
              onLeave={() => setLeave(true)}
              onInvite={
                empty > 0
                  ? () =>
                      onRequest(
                        kind,
                        view.players
                          .filter((p) => !table!.members.includes(p.id))
                          .map((p) => p.id),
                      )
                  : undefined
              }
            />
          )}
        {ended &&
          !belongs &&
          (kind !== 'gostop' ||
            displayedGoRevision === view.gostop?.revision) && (
            <div className="l-game-ending">
              {dissolved && (
                <output className="l-game-ending-note">{dissolved.text}</output>
              )}
              <button
                className="l-primary"
                onClick={() => {
                  onBack();
                  onRequest(
                    kind,
                    dissolved?.members.filter((id) =>
                      view.players.some((p) => p.id === id),
                    ),
                  );
                }}
              >
                다시 초대하기
                <Send size={16} />
              </button>
              <button className="l-secondary" onClick={onBack}>
                일어나기
              </button>
            </div>
          )}
      </div>
      {leave && (
        <ConfirmModal
          title={`${GAME_INFO[kind].name} 테이블에서 일어날까요?`}
          body={leaveConsequence(kind, ended)}
          consequences={ended ? [] : ['일어나면 되돌릴 수 없어요.']}
          confirmLabel="일어나기"
          busyLabel="일어나는 중…"
          cancelLabel="테이블에 남기"
          danger={!ended}
          onClose={() => {
            setLeave(false);
            setLeaveError('');
          }}
          onConfirm={async () => {
            setLeaveError('');
            setLeaving(true);
            if (
              await room.action({ kind: 'stand', game: kind, id: match?.id })
            ) {
              onBack();
              return true;
            }
            setLeaving(false);
            setLeaveError('일어나기를 처리하지 못했어요. 다시 눌러 주세요.');
            return false;
          }}
        />
      )}
      {leaveError && (
        <p className="l-sr" role="alert">
          {leaveError}
        </p>
      )}
    </section>
  );
}
