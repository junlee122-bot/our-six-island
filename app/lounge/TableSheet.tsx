'use client';
// The compact table sheet over the hall / casino scene (game-flow step 2):
// setup (empty table: stake + seats → 앉기), join (a forming table → 앉기),
// seated (N/M명 · 친구 부르기 · 일어나기). No separate page, no invitation card.
import { useEffect, useId, useRef, useState } from 'react';
import { Armchair, ArrowUpFromLine, BellRing, Check, X } from 'lucide-react';
import { AvatarView } from '../avatar-view';
import {
  FLEX_GAMES,
  GAME_INFO,
  GAME_KINDS,
  TABLE_STAKES,
  gameReservation,
  tableIdOf,
  type GameKind,
} from '../lounge-games';
import { playerIsBusy } from '../lounge-game-flow';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { LoungePlayer } from '../lounge-room';
import { ACTORS } from '../lounge-roster';
import { TABLE_PLACE, tableState } from '../lounge-table-state';
import { formatBeom, josa, NAMES } from '../lounge-text';
import { GAME_COPY } from './game-copy';
import { AREA_NAMES } from './FriendsModal';
import { SCENE_LAYOUT } from '../lounge-scene-layout';
import { boundAction } from '../lounge-scene-keys';
import {
  CALL_LABEL,
  callChanges,
  callClock,
  pendingCalls,
  tableCalls,
  type TableCall,
} from '../lounge-table-calls';
import { useNow } from './use-now';
import type { Notify } from './Toast';

export type SheetMode = 'setup' | 'join' | 'seated';

/** Where a friend is right now, for the "친구 부르기" list. */
export function whereIs(view: CloudRoomView, p: LoungePlayer): string {
  const game = GAME_KINDS.find(
    (k) =>
      view.invites.some(
        (r) =>
          r.status === 'waiting' && r.game === k && r.accepted.includes(p.id),
      ) ||
      view.tables?.[k]?.members.includes(p.id) ||
      (view.seats[k].includes(p.id) && !!view[k]),
  );
  const place =
    p.area === 'home'
      ? `${ACTORS[p.home ?? p.actor]}의 방`
      : (AREA_NAMES[p.area] ?? NAMES.village);
  return game ? `${place} · ${GAME_INFO[game].name} 테이블` : place;
}

function SeatChips({
  view,
  occupants,
  required,
  calls = [],
}: {
  view: CloudRoomView;
  occupants: string[];
  required: number;
  /** Friends called and not answered yet: they hold the empty seats. */
  calls?: readonly TableCall[];
}) {
  const waiting = pendingCalls(calls).filter((c) => !occupants.includes(c.id));
  const seats = Array.from(
    { length: Math.max(required, occupants.length) },
    (_, i) => occupants[i] ?? null,
  );
  let next = 0;
  return (
    <ul
      className="l-sheet-seats"
      aria-label={`자리 ${occupants.length}/${required}`}
    >
      {seats.map((id, i) => {
        const p = id ? view.players.find((q) => q.id === id) : null;
        const call = !p ? waiting[next++] : undefined;
        const caller = call ? view.players.find((q) => q.id === call.id) : null;
        return (
          <li
            key={id ?? call?.id ?? 'empty-' + i}
            className={p ? 'is-taken' : call ? 'is-called' : 'is-empty'}
            data-call={call?.status}
          >
            {p ? (
              <>
                <AvatarView actor={p.actor} look={p.look} portrait />
                <span>{p.id === view.self ? '나' : ACTORS[p.actor]}</span>
              </>
            ) : call && caller ? (
              <>
                <AvatarView actor={caller.actor} look={caller.look} portrait />
                <span>
                  {ACTORS[caller.actor]}
                  <small>
                    {CALL_LABEL[call.status]} · {callClock(call.leftMs)}
                  </small>
                </span>
              </>
            ) : (
              <>
                <i aria-hidden="true" />
                <span>빈자리</span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function TableSheet({
  room,
  view,
  game,
  mode,
  preselect,
  onClose,
  onStand,
  onSat,
  notify,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  game: GameKind;
  mode: SheetMode;
  /** Friends to call as soon as I sit (e.g. "다시 초대하기" or the old menu). */
  preselect?: string[];
  onClose: () => void;
  /** Stood up from a forming table (the scene puts me beside it). */
  onStand: () => void;
  /** Sat down (the server accepted my seat). */
  onSat?: () => void;
  /** Toasts: "도원·호현을 불렀어요", "도원이 앉았어요". */
  notify?: Notify;
}) {
  const titleId = useId();
  const state = tableState(view, game);
  const name = GAME_INFO[game].name;
  const flex = FLEX_GAMES.includes(game);
  const [stake, setStake] = useState<number>(GAME_INFO[game].stake),
    [count, setCount] = useState<number>(
      flex
        ? Math.max(2, Math.min(3, view.players.length || 2))
        : GAME_INFO[game].players,
    ),
    [calling, setCalling] = useState(false),
    [chosen, setChosen] = useState<string[]>([]),
    [pending, setPending] = useState(false);
  const busyRef = useRef(false);
  const sheetRef = useRef<HTMLElement>(null);
  const invite = state.invite;
  const tableStake = mode === 'setup' ? stake : (state.stake ?? stake);
  const reservation = gameReservation(game, tableStake);
  const short = view.wallet.balance < reservation;
  const run = async (fn: () => Promise<boolean>) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setPending(true);
    try {
      return await fn();
    } finally {
      busyRef.current = false;
      setPending(false);
    }
  };
  const sit = () =>
    run(async () => {
      const ok = await (mode === 'setup'
        ? room.action({
            kind: 'invite',
            game,
            players: preselect ?? [],
            stake,
            required: flex ? count : GAME_INFO[game].players,
            table: tableIdOf(game),
          })
        : invite
          ? room.action({ kind: 'reply', id: invite.id, accept: true })
          : Promise.resolve(false));
      if (ok) onSat?.();
      return ok;
    });
  const stand = () =>
    run(async () => {
      if (!invite) return false;
      const ok = await room.action({ kind: 'cancel', id: invite.id });
      if (ok) onStand();
      return ok;
    });
  const call = () =>
    run(async () => {
      const names = chosen
        .map((id) => view.players.find((p) => p.id === id))
        .filter((p): p is LoungePlayer => !!p)
        .map((p) => ACTORS[p.actor])
        .join('·');
      const ok = await room.action({
        kind: 'invite',
        game,
        players: chosen,
        table: tableIdOf(game),
      });
      if (ok) {
        setCalling(false);
        setChosen([]);
        if (names)
          notify?.(`${josa(names, '을/를')} 불렀어요. 오면 알려 드릴게요.`, 'info');
      }
      return ok;
    });
  // Called friends: pending seats with a timer, and a toast when one sits
  // down or says no.
  const hasCalls = mode === 'seated' && !!invite?.invited.length;
  const clock = useNow(hasCalls);
  const calls = tableCalls(
    mode === 'seated' ? invite : null,
    view.players,
    state.area,
    clock + (view.clockOffset ?? 0),
  );
  const lastCalls = useRef<TableCall[]>([]);
  useEffect(() => {
    const changes = callChanges(lastCalls.current, calls);
    lastCalls.current = calls;
    for (const change of changes) {
      const p = view.players.find((q) => q.id === change.id);
      const who = p ? ACTORS[p.actor] : '친구';
      if (change.status === 'seated')
        notify?.(`${josa(who, '이/가')} 와서 앉았어요.`, 'success');
      else notify?.(`${josa(who, '은/는')} 다음에 함께한대요.`, 'info');
    }
  }, [calls, view.players, notify]);
  // Desktop keys (the sheet is not modal: the scene keeps its own keys):
  // E / Enter = 앉기 (or send the call), 1–4 = stake, Shift+2–7 = seats,
  // C = 친구 부르기, 1–7 toggle friends in the call list, Esc = close / stand up.
  const friendsRef = useRef<string[]>([]);
  const keysRef = useRef<(e: KeyboardEvent) => boolean>(() => false);
  useEffect(() => {
    keysRef.current = (e) => {
      const digit = /^Digit([1-9])$/.exec(e.code)?.[1];
      if (e.key === 'Escape') {
        if (mode === 'seated' && calling) setCalling(false);
        else if (mode === 'seated') void stand();
        else onClose();
        return true;
      }
      const onButton = (e.target as HTMLElement | null)?.closest?.('button, a');
      if (boundAction(e) === 'action' || (e.key === 'Enter' && !onButton)) {
        if (mode === 'seated') {
          if (!calling || !chosen.length) return false;
          void call();
        } else if (!short) void sit();
        return true;
      }
      if (mode === 'setup' && digit && !e.shiftKey) {
        const n = TABLE_STAKES[Number(digit) - 1];
        if (!n) return false;
        setStake(n);
        return true;
      }
      if (mode === 'setup' && digit && e.shiftKey && flex) {
        const n = Number(digit);
        if (n < 2 || n > 7) return false;
        setCount(n);
        return true;
      }
      if (mode === 'seated' && e.code === 'KeyC' && !calling) {
        setCalling(true);
        return true;
      }
      if (mode === 'seated' && calling && digit) {
        const id = friendsRef.current[Number(digit) - 1];
        if (!id) return false;
        setChosen((v) =>
          v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
        );
        return true;
      }
      return false;
    };
  });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.repeat)
        return;
      if (document.querySelector('dialog[open], .l-coach')) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)
      )
        return;
      if (keysRef.current(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    // Capture: runs before the scene's own E / Enter handling.
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, []);
  // Move focus into the sheet when it opens or its mode changes.
  useEffect(() => {
    sheetRef.current
      ?.querySelector<HTMLElement>('[data-autofocus]')
      ?.focus({ preventScroll: true });
  }, [mode]);
  // Closing gives the keyboard back to the scene (walking, E).
  useEffect(() => {
    const sheet = sheetRef.current;
    return () => {
      const active = document.activeElement;
      if (!active || active === document.body || sheet?.contains(active))
        document
          .querySelector<HTMLElement>('[data-testid=interior-3d], .cf-scene')
          ?.focus({ preventScroll: true });
    };
  }, []);
  const callNames = (preselect ?? [])
    .map((id) => view.players.find((p) => p.id === id))
    .filter((p): p is LoungePlayer => !!p)
    .map((p) => ACTORS[p.actor])
    .join(', ');
  const host = invite ? view.players.find((p) => p.id === invite.from) : null;
  const left = Math.max(0, state.required - state.occupants.length);
  const friends = view.players.filter(
    (p) => p.id !== view.self && !state.occupants.includes(p.id),
  );
  const selectable = friends.filter(
    (p) => !playerIsBusy(view, p.id) && p.balance >= reservation,
  );
  useEffect(() => {
    friendsRef.current = selectable.map((p) => p.id);
  });
  return (
    <section
      ref={sheetRef}
      className="l-table-sheet"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-testid="table-sheet"
      data-mode={mode}
      data-game={game}
      // Opposite the table, so the table and the seated figures stay in view.
      data-side={
        (SCENE_LAYOUT[state.area].tables.find((t) => t.game === game)?.foot.x ??
          0) <= 50
          ? 'right'
          : 'left'
      }
    >
      <header>
        <span className="l-sheet-symbol" aria-hidden="true">
          {GAME_INFO[game].symbol}
        </span>
        <div>
          <small>
            {TABLE_PLACE[state.area]} · {GAME_COPY[game].players}
          </small>
          <h2 id={titleId}>{name} 테이블</h2>
        </div>
        {mode !== 'seated' && (
          <button
            type="button"
            className="l-sheet-close"
            onClick={onClose}
            aria-label="닫기 (Esc)"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </header>
      {mode !== 'setup' && (
        <SeatChips
          view={view}
          occupants={state.occupants}
          required={state.required}
          calls={calls}
        />
      )}
      {calls.some((c) => c.status === 'declined' || c.status === 'gone') && (
        <p className="l-sheet-declined" data-testid="table-declined">
          {calls
            .filter((c) => c.status === 'declined' || c.status === 'gone')
            .map((c) =>
              `${c.actor === null ? '친구' : ACTORS[c.actor]} · ${c.status === 'declined' ? '다음에' : CALL_LABEL.gone}`,
            )
            .join(', ')}
        </p>
      )}
      {mode === 'setup' && (
        <div className="l-sheet-setup">
          <fieldset>
            <legend>{GAME_COPY[game].amountLabel}</legend>
            <div
              className="l-sheet-chips"
              role="radiogroup"
              aria-label={GAME_COPY[game].amountLabel}
            >
              {TABLE_STAKES.map((n, i) => (
                <button
                  type="button"
                  key={n}
                  role="radio"
                  aria-checked={stake === n}
                  aria-keyshortcuts={String(i + 1)}
                  title={`${formatBeom(n)} (${i + 1})`}
                  onClick={() => setStake(n)}
                >
                  {formatBeom(n)}
                  <kbd className="l-sheet-key" aria-hidden="true">
                    {i + 1}
                  </kbd>
                </button>
              ))}
            </div>
          </fieldset>
          {flex && (
            <fieldset>
              <legend>인원</legend>
              <div
                className="l-sheet-chips is-count"
                role="radiogroup"
                aria-label={`${name} 인원`}
              >
                {[2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    type="button"
                    key={n}
                    role="radio"
                    aria-checked={count === n}
                    aria-keyshortcuts={`Shift+${n}`}
                    title={`${n}명 (Shift+${n})`}
                    onClick={() => setCount(n)}
                  >
                    {n}명
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <p className="l-sheet-note">
            {GAME_COPY[game].moneyRule} 내 잔액{' '}
            {formatBeom(view.wallet.balance)}
            {callNames ? ` 앉으면 ${josa(callNames, '을/를')} 불러요.` : ''}
          </p>
        </div>
      )}
      {mode === 'join' && (
        <p className="l-sheet-note">
          {state.phase === 'retained'
            ? `빈자리에 앉으면 다음 판부터 함께해요.`
            : `${host ? `${ACTORS[host.actor]}의 테이블 · ` : ''}${state.occupants.length}/${state.required}명 · 판돈 ${formatBeom(tableStake)}. ${state.required}명이 앉으면 바로 시작해요.`}
          {game === 'blackjack' &&
            ` 최대 ${formatBeom(reservation)}까지 예약돼요.`}
        </p>
      )}
      {mode === 'seated' && (
        <p
          className="l-sheet-status"
          aria-live="polite"
          data-testid="table-status"
        >
          <strong>
            {state.occupants.length}/{state.required}명 · 판돈{' '}
            {formatBeom(tableStake)}
          </strong>
          <span>
            {left > 0
              ? pendingCalls(calls).length
                ? `${pendingCalls(calls).length}명을 기다리는 중 · ${left}명 더 앉으면 시작해요.`
                : `${left}명 더 앉으면 시작해요.`
              : '곧 시작해요.'}{' '}
            범은 시작할 때 예약돼요.
          </span>
        </p>
      )}
      {mode === 'seated' && calling && (
        <div className="l-sheet-call">
          <h3>누구를 부를까요?</h3>
          {friends.length ? (
            <ul className="l-sheet-friends">
              {friends.map((p) => {
                const busy = playerIsBusy(view, p.id);
                const broke = p.balance < reservation;
                const called =
                  !!invite?.invited.includes(p.id) &&
                  !invite.declined.includes(p.id);
                const on = chosen.includes(p.id);
                const hotkey = selectable.findIndex((f) => f.id === p.id) + 1;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-keyshortcuts={hotkey ? String(hotkey) : undefined}
                      title={`${ACTORS[p.actor]} · ${whereIs(view, p)}`}
                      disabled={busy || broke || pending}
                      onClick={() =>
                        setChosen((v) =>
                          on ? v.filter((id) => id !== p.id) : [...v, p.id],
                        )
                      }
                      data-friend={p.actor}
                    >
                      {hotkey > 0 && (
                        <kbd className="l-sheet-key" aria-hidden="true">
                          {hotkey}
                        </kbd>
                      )}
                      <AvatarView actor={p.actor} look={p.look} portrait />
                      <span>
                        <strong>{ACTORS[p.actor]}</strong>
                        <small>{whereIs(view, p)}</small>
                      </span>
                      <em>
                        {busy ? (
                          '다른 게임 중'
                        ) : broke ? (
                          '잔액 부족'
                        ) : on ? (
                          <Check size={17} aria-label="선택됨" />
                        ) : called ? (
                          '불렀어요'
                        ) : null}
                      </em>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="l-sheet-note">지금 마을에 다른 친구가 없어요.</p>
          )}
        </div>
      )}
      <p className="l-sheet-keys" aria-hidden="true">
        {mode === 'seated'
          ? calling
            ? '1–7 친구 고르기 · Enter 부르기 · Esc 닫기'
            : 'C 친구 부르기 · Esc 일어나기'
          : mode === 'setup'
            ? `E 앉기 · 1–4 판돈${flex ? ' · Shift+2–7 인원' : ''} · Esc 닫기`
            : 'E 앉기 · Esc 닫기'}
      </p>
      <div className="l-sheet-actions">
        {mode === 'seated' ? (
          <>
            {calling ? (
              <button
                type="button"
                className="l-primary"
                disabled={!chosen.length || pending}
                onClick={() => void call()}
                data-testid="table-call-send"
              >
                <BellRing size={16} aria-hidden="true" />
                {chosen.length
                  ? `${chosen.length}명 부르기`
                  : '친구를 골라 주세요'}
              </button>
            ) : (
              <button
                type="button"
                className="l-primary"
                onClick={() => setCalling(true)}
                data-testid="table-call"
                data-autofocus
                aria-keyshortcuts="C"
              >
                <BellRing size={16} aria-hidden="true" />
                친구 부르기
              </button>
            )}
            <button
              type="button"
              className="l-secondary"
              disabled={pending}
              onClick={() => (calling ? setCalling(false) : void stand())}
              data-testid="table-stand"
            >
              {calling ? (
                '닫기'
              ) : (
                <>
                  <ArrowUpFromLine size={16} aria-hidden="true" />
                  일어나기
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="l-primary"
              disabled={pending || short}
              onClick={() => void sit()}
              data-testid="table-sit"
              data-autofocus
              aria-keyshortcuts="E"
            >
              <Armchair size={16} aria-hidden="true" />
              {pending
                ? '앉는 중…'
                : short
                  ? `${josa(formatBeom(reservation), '이/가')} 필요해요`
                  : `앉기 · 판돈 ${formatBeom(tableStake)}`}
            </button>
            <button type="button" className="l-secondary" onClick={onClose}>
              닫기
            </button>
          </>
        )}
      </div>
    </section>
  );
}
