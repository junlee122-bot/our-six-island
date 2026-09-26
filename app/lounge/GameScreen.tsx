'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpFromLine, Coins, Eye, Send } from 'lucide-react';
import {
  GAME_INFO,
  PRACTICE_NAMES,
  isPracticeAi,
  tableIdOf,
  TABLE_AREA,
  type GameKind,
} from '../lounge-games';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { ReactionId } from '../lounge-reactions';
import { ReactionDock } from '../lounge-reaction-ui';
import { RoundReady } from '../lounge-round-ready';
import { latestTableReaction } from '../lounge-dealer-lines';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa, NAMES } from '../lounge-text';
import { GAME_COPY, leaveConsequence } from './game-copy';
import { ConfirmModal } from './Modal';
import { attention, playCue } from './feedback';
import { ErrorState, ScreenBoundary, chunkRecovery } from './ErrorBoundary';
import {
  BlackjackTable,
  ChessBoard,
  GoBoard,
  PokerTable,
  SeotdaTable,
  YachtTable,
  LiarTable,
  LiarsBarTable,
} from './table-chunks';
import { VENUES } from '../lounge-venues';
import { PartyBar } from '../lounge-party-bar';
import type { Notify } from './Toast';
import '../lounge-game-fit.css';
import '../lounge-table-venue.css';

/** Each table's action area (the part that must be on screen on my turn). */
const TABLE_CONTROLS =
  '.p-controls, .s-controls, .bj-controls, .l-action-bar, .l-go-decision, .l-go-hand';

/**
 * One table look per venue: the casino's games (holdem, blackjack, chess) are
 * dark felt, the hall's (섯다, 고스톱) warm wood on cream.
 */
const DARK: GameKind[] = ['poker', 'blackjack', 'chess'];

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
    // Each seat's current portrait (the same chibi face as the header and
    // the ready check); AI seats and friends who left have none.
    figures = seats.map((id) => {
      const p = view.players.find((p) => p.id === id);
      return p ? { actor: p.actor, look: p.look } : null;
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
  // Watching a table I do not sit at (구경하기).
  const watching = !belongs && seat < 0 && !dissolved;
  if (leave && !canLeave && !leaving) setLeave(false);
  // Esc opens the menu (lounge-game.tsx); its 테이블에서 일어나기 lands here:
  // watching just stops, a seat asks first (never an accidental stand-up).
  const standRef = useRef(() => {});
  useEffect(() => {
    standRef.current = () => {
      if (watching || (!canLeave && !leaving)) onBack();
      else if (canLeave) setLeave(true);
    };
  });
  useEffect(() => {
    const stand = () => standRef.current();
    window.addEventListener('bumtadew:game-stand', stand);
    return () => window.removeEventListener('bumtadew:game-stand', stand);
  }, []);
  // 연습 판 (AI seats, no 범) and 혼자 하기 (blackjack alone vs the dealer).
  const practice = !!table?.practice || seats.some(isPracticeAi);
  // 파티 판: friends, no 범 (라이어 게임 always); crops can be eaten.
  const party = !practice && (!!table?.party || kind === 'liar');
  const alone = !practice && seats.length === 1 && seat === 0;
  // Say it once as a toast too (the note stays under the result).
  useEffect(() => {
    if (dissolved) notify?.(dissolved.text, 'info');
  }, [dissolved, notify]);
  useEffect(() => {
    if (turn && !wasTurn.current) {
      attention('turn', `${GAME_INFO[kind].name} · 내 차례예요.`);
      // 'nearest': bring the action bar in without pushing the host's line
      // (and the dealer's cards) off the top at 1440×900. On desktop the
      // stage scrolls inside itself (if at all), so reveal its controls.
      const bar = window.matchMedia('(min-width: 1024px)').matches
        ? stage.current?.querySelector(TABLE_CONTROLS)
        : null;
      (bar ?? stage.current)?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
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
  // The table host (루미 / 매화) greets by round and answers stickers.
  const host = {
    round: table?.round,
    reaction: reactionsHidden
      ? null
      : latestTableReaction(view.players, seats, kind, match?.id),
  };
  return (
    <section
      className={'l-game-screen ' + kind + (dark ? ' is-dark' : '')}
      data-venue={VENUES[TABLE_AREA[kind]].venue}
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
          <small data-testid="game-place">
            {place} · {GAME_INFO[kind].name} 테이블
          </small>
          <strong>
            {GAME_INFO[kind].name}
            {practice ? (
              <em className="l-game-tag" data-testid="game-practice">
                연습
              </em>
            ) : alone ? (
              <em className="l-game-tag">혼자</em>
            ) : party && kind !== 'liar' ? (
              <em className="l-game-tag" data-testid="game-party">
                파티
              </em>
            ) : null}
            {table && table.round > 1 ? ` · ${table.round}번째 판` : ''}
          </strong>
        </span>
        <div>
          {watching ? (
            // 구경하기: one clear pill; 일어나기 puts me beside the table.
            <span className="l-game-watch">
              <Eye size={16} aria-hidden="true" />
              <span data-testid="game-live">구경 중</span>
              <button
                onClick={onBack}
                data-testid="game-watch-stand"
                title="구경 그만하기"
                aria-label={`구경 그만하고 일어나기 · ${josa(place, '으로/로')} 돌아가기`}
              >
                <ArrowUpFromLine size={15} aria-hidden="true" />
                일어나기
              </button>
            </span>
          ) : (
            <span
              className={'l-game-live' + (turn ? ' is-turn' : '')}
              data-testid="game-live"
            >
              <i />
              {turn
                ? '내 차례'
                : ended
                  ? belongs
                    ? '다음 판 준비'
                    : '게임 종료'
                  : '대전 중'}
            </span>
          )}
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
          <span>
            {practice
              ? `연습 판 · ${(PRACTICE_NAMES[kind] ?? []).join('·')}(AI)와 쳐요. 범은 오가지 않아요.`
              : party
                ? kind === 'liar'
                  ? GAME_COPY[kind].moneyRule
                  : '파티 판 · 범은 오가지 않아요. 가방의 작물을 먹어 볼 수 있어요.'
              : alone
                ? `딜러와 혼자 치는 판이에요. ${GAME_COPY[kind].moneyRule}`
                : GAME_COPY[kind].moneyRule}
          </span>
          <b>
            <Coins size={14} /> {formatBeom(view.wallet.balance)}
            {view.wallet.held > 0
              ? ` · 예약 ${formatBeom(view.wallet.held)}`
              : ''}
          </b>
        </div>
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
                    ? '새 버전이 올라왔을 수 있어요. 다시 불러와도 자리는 그대로 유지돼요.'
                    : '잠시 뒤 다시 불러와 주세요. 자리는 그대로 유지돼요.'
                }
                {...(chunk ? chunkRecovery() : { retryLabel: '다시 불러오기', onRetry: retry })}
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
                    round={host.round}
                    reaction={host.reaction}
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
                ) : kind === 'yacht' ? (
                  <YachtTable
                    figures={figures}
                    match={view.yacht!}
                    seat={seat}
                    names={names}
                    onAction={act((action) => ({
                      kind: 'yacht',
                      id: view.yacht!.id,
                      revision: view.yacht!.revision,
                      action,
                    }))}
                  />
                ) : kind === 'liarsbar' ? (
                  <LiarsBarTable
                    figures={figures}
                    match={view.liarsbar!}
                    seat={seat}
                    names={names}
                    onAction={act((action) => ({
                      kind: 'liarsbar',
                      id: view.liarsbar!.id,
                      revision: view.liarsbar!.revision,
                      action,
                    }))}
                  />
                ) : kind === 'liar' ? (
                  <LiarTable
                    figures={figures}
                    match={view.liar!}
                    seat={seat}
                    names={names}
                    room={room}
                    view={view}
                    onAction={act((action) => ({
                      kind: 'liar',
                      id: view.liar!.id,
                      revision: view.liar!.revision,
                      action,
                    }))}
                  />
                ) : kind === 'seotda' ? (
                  <SeotdaTable
                    {...host}
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
                    {...host}
                    figures={figures}
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
                    {...host}
                    figures={figures}
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
                    reaction={host.reaction}
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
        {(practice || party) && belongs && !ended && seat >= 0 && (
          <PartyBar kind={kind} view={view} room={room} seat={seat} names={names} />
        )}
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
              {practice ? (
                // 연습 판: nobody to invite; deal a fresh practice table.
                <button
                  className="l-primary"
                  data-testid="game-practice-again"
                  onClick={() =>
                    void room.action({
                      kind: 'invite',
                      game: kind,
                      players: [],
                      table: tableIdOf(kind),
                      practice: true,
                    })
                  }
                >
                  다시 연습하기
                </button>
              ) : (
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
              )}
              <button className="l-secondary" onClick={onBack}>
                일어나기
              </button>
            </div>
          )}
      </div>
      {leave && (
        <ConfirmModal
          title={`${GAME_INFO[kind].name} 테이블에서 일어날까요?`}
          body={
            practice
              ? `연습 판이라 범은 오가지 않아요. ${kind === 'chess' ? '일어나면 기권으로 끝나요.' : '일어나면 남은 판은 AI가 마무리해요.'}`
              : party && !ended
                ? `범은 오가지 않는 판이에요. ${GAME_COPY[kind].leaveActive}`
                : leaveConsequence(kind, ended)
          }
          consequences={ended || practice || party ? [] : ['일어나면 되돌릴 수 없어요.']}
          confirmLabel="일어나기"
          busyLabel="일어나는 중…"
          cancelLabel="테이블에 남기"
          danger={!ended && !practice && !party}
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
