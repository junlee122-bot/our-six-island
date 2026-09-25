'use client';
import { useRef, useState } from 'react';
import { ArrowRight, Check, Send } from 'lucide-react';
import { AvatarView } from '../avatar-view';
import {
  GAME_INFO,
  GAME_KINDS,
  gameReservation,
  type GameKind,
} from '../lounge-games';
import {
  gameIsActive,
  playerIsBusy,
  eligibleGameFriends,
} from '../lounge-game-flow';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa } from '../lounge-text';
import { GAME_COPY } from './game-copy';
import { TABLE_PLACE, tableLabel, tableState } from '../lounge-table-state';
import { Modal } from './Modal';
import { offlineReason } from '../lounge-connection';
import { othersOnline, soloActivities, type SoloKind } from '../lounge-solo';
import { keyLabel } from '../lounge-keybinds';
import { getSettings } from '../lounge-settings';
import type { Notify } from './Toast';

const FLEX: GameKind[] = ['poker', 'blackjack', 'seotda'];

export function RequestGameModal({
  room,
  view,
  onClose,
  initial,
  notify,
  preselect,
  onPick,
  onSolo,
  watching,
  onWatch,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  onClose: () => void;
  initial: GameKind | null;
  notify: Notify;
  /** Friends to pre-select (e.g. "빈자리에 친구 초대"). */
  preselect?: string[];
  /** Games start at a table: picking one walks me to it (setup sheet). */
  onPick?: (game: GameKind) => void;
  /** Something to do alone (nobody online or offline). */
  onSolo?: (kind: SoloKind) => void;
  /** "친구가 오면 알려 드릴게요" is on. */
  watching?: boolean;
  onWatch?: (on: boolean) => void;
}) {
  const fillTable =
    initial && view.tables?.[initial]?.members.includes(view.self)
      ? view.tables[initial]
      : undefined;
  if (!fillTable && onPick)
    return (
      <TablePicker
        view={view}
        onClose={onClose}
        onPick={onPick}
        onSolo={onSolo}
        watching={watching}
        onWatch={onWatch}
      />
    );
  return (
    <FillInvite
      room={room}
      view={view}
      onClose={onClose}
      initial={initial}
      notify={notify}
      preselect={preselect}
    />
  );
}

/**
 * "게임 초대" from the menu: choose a table; I walk there and sit. With
 * nobody else online it leads with things to do alone (every table needs two
 * or more) and offers a heads-up when a friend logs in; offline, the tables
 * are switched off with the reason.
 */
function TablePicker({
  view,
  onClose,
  onPick,
  onSolo,
  watching,
  onWatch,
}: {
  view: CloudRoomView;
  onClose: () => void;
  onPick: (game: GameKind) => void;
  onSolo?: (kind: SoloKind) => void;
  watching?: boolean;
  onWatch?: (on: boolean) => void;
}) {
  const reason = offlineReason(view.link.state, view.status);
  const alone = !reason && othersOnline(view.players, view.self) === 0;
  const solo = soloActivities(view.life, keyLabel(getSettings().keys.action));
  return (
    <Modal
      title={alone ? '지금은 혼자예요' : reason ? '테이블은 잠시 쉬어요' : '어느 테이블로 갈까요?'}
      onClose={onClose}
    >
      {reason ? (
        <p className="l-offline-note" role="status" data-testid="picker-offline">
          {reason} 그동안 혼자 할 수 있는 것도 있어요.
        </p>
      ) : alone ? (
        <p className="l-modal-intro" data-testid="picker-alone">
          지금 접속한 친구가 없어요. 테이블 게임은 2명부터라, 혼자 할 수 있는
          걸 골라 봤어요.
        </p>
      ) : (
        <p className="l-modal-intro">
          게임은 테이블에 앉아서 시작해요. 고르면 그 테이블 옆으로 가서 판돈과
          인원을 정하고, 앉은 뒤 친구를 불러요.
        </p>
      )}
      {(alone || reason) && onSolo && (
        <ul className="l-solo-list" aria-label="혼자 할 수 있는 것">
          {solo.map((a) => (
            <li key={a.kind}>
              <button
                onClick={() => onSolo(a.kind)}
                data-testid={`solo-${a.kind}`}
                data-hot={a.hot || undefined}
              >
                <strong>{a.title}</strong>
                <small>{a.detail}</small>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {alone && onWatch && (
        <div className="l-watch-friends">
          <label>
            <input
              type="checkbox"
              checked={!!watching}
              onChange={(e) => onWatch(e.target.checked)}
              data-testid="watch-friends"
            />
            친구가 오면 알려 드릴게요
          </label>
          <small>누군가 로그인하면 알림을 한 번 보내요.</small>
        </div>
      )}
      {(alone || reason) && (
        <h3 className="l-picker-subtitle">
          테이블{alone ? ' · 친구가 오면 함께해요' : ''}
        </h3>
      )}
      <ul className="l-table-picker" data-muted={alone || !!reason || undefined}>
        {GAME_KINDS.map((k) => {
          const state = tableState(view, k);
          return (
            <li key={k}>
            <button
              onClick={() => onPick(k)}
              data-testid={`pick-${k}`}
              disabled={!!reason}
              title={reason ?? undefined}
            >
              <span aria-hidden="true">{GAME_INFO[k].symbol}</span>
              <span>
                <strong>{GAME_INFO[k].name}</strong>
                <small>
                  {TABLE_PLACE[state.area]} · {GAME_COPY[k].players} ·{' '}
                  {reason ? '연결되면 열려요' : tableLabel(state).status}
                </small>
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            </li>
          );
        })}
      </ul>
      <div className="l-modal-actions">
        <button className="l-secondary" onClick={onClose}>
          닫기
        </button>
      </div>
    </Modal>
  );
}

function FillInvite({
  room,
  view,
  onClose,
  initial,
  notify,
  preselect,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  onClose: () => void;
  initial: GameKind | null;
  notify: Notify;
  preselect?: string[];
}) {
  const first = initial ?? 'chess';
  const [game, setGame] = useState<GameKind>(first),
    [stake, setStake] = useState<number>(GAME_INFO[first].stake),
    [count, setCount] = useState(Math.max(2, Math.min(3, view.players.length))),
    [chosen, setChosen] = useState<string[]>(
      preselect ??
        view.players.filter((p) => p.id !== view.self).map((p) => p.id),
    );
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  // "빈자리에 친구 초대": a member of a short retained table invites friends
  // to its empty seats; the server uses the table's stake and seat count.
  const fillTable =
    initial && view.tables?.[initial]?.members.includes(view.self)
      ? view.tables[initial]
      : undefined;
  const fill = !!fillTable && game === initial;
  const tableStake = fill ? fillTable!.stake : stake;
  const needed = fill
      ? Math.max(2, fillTable!.required - fillTable!.members.length + 1)
      : FLEX.includes(game)
        ? count
        : GAME_INFO[game].players,
    reserved = gameReservation(game, tableStake),
    eligible = eligibleGameFriends(view, game, tableStake),
    busy = (id: string) => playerIsBusy(view, id),
    unavailable = fill
      ? view.invites.some((r) => r.game === game && r.status === 'waiting')
      : !!view.tables?.[game]?.members.length ||
        gameIsActive(view, game) ||
        view.invites.some((r) => r.game === game && r.status === 'waiting'),
    targets = chosen.filter((id) => eligible.some((p) => p.id === id)),
    others = view.players.filter((p) => p.id !== view.self);
  return (
    <Modal
      title={fill ? '빈자리 채우기' : '함께할 게임을 골라요'}
      onClose={onClose}
    >
      <p className="l-modal-intro">
        {fill
          ? `${GAME_INFO[game].name} 테이블의 빈자리 ${needed - 1}곳에 친구를 불러요. 판돈과 인원은 지금 테이블 그대로예요.`
          : '친구가 수락하면 함께 게임 화면으로 이동해요. 초대는 90초 동안 유효해요.'}
      </p>
      <fieldset disabled={pending} className="l-plain-fieldset">
        <legend className="l-sr">게임</legend>
        <div
          className="l-game-choices"
          role="radiogroup"
          aria-label="게임"
          hidden={fill}
        >
          {GAME_KINDS.map((k) => (
            <button
              key={k}
              role="radio"
              aria-checked={game === k}
              onClick={() => {
                setGame(k);
                setStake(GAME_INFO[k].stake);
              }}
            >
              <span>{GAME_INFO[k].symbol}</span>
              <strong>{GAME_INFO[k].name}</strong>
              <small>
                {GAME_COPY[k].players} · {GAME_COPY[k].tagline}
              </small>
            </button>
          ))}
        </div>
        <div className="l-request-heading" hidden={fill}>
          <div className="l-money-settings">
            <label>
              {GAME_COPY[game].amountLabel}
              <select
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
              >
                {[1000, 5000, 10000, 20000].map((n) => (
                  <option key={n} value={n}>
                    {formatBeom(n)}
                  </option>
                ))}
              </select>
            </label>
            {FLEX.includes(game) && (
              <label>
                정원
                <select
                  aria-label={GAME_INFO[game].name + ' 정원'}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  {[2, 3, 4, 5, 6, 7].map((n) => (
                    <option value={n} key={n}>
                      {n}명
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p>
              {GAME_COPY[game].moneyRule} 내 잔액{' '}
              {formatBeom(view.wallet.balance)}
            </p>
          </div>
        </div>
        <div className="l-request-heading">
          <h3>누구와 함께할까요?</h3>
          <small>나 + 친구 {needed - 1}명</small>
        </div>
        {others.length ? (
          <div className="l-invite-targets">
            {others.map((p) => {
              const canPlay = eligible.some((f) => f.id === p.id);
              return (
                <button
                  key={p.id}
                  disabled={busy(p.id) || !canPlay}
                  aria-pressed={chosen.includes(p.id)}
                  onClick={() =>
                    setChosen((v) =>
                      v.includes(p.id)
                        ? v.filter((id) => id !== p.id)
                        : [...v, p.id],
                    )
                  }
                >
                  <AvatarView actor={p.actor} look={p.look} portrait />
                  <strong>{ACTORS[p.actor]}</strong>
                  <span>
                    {busy(p.id) ? (
                      '다른 게임 중'
                    ) : !canPlay ? (
                      '잔액 부족'
                    ) : chosen.includes(p.id) ? (
                      <Check size={17} aria-label="선택됨" />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="l-help-text">
            아직 마을에 다른 친구가 없어요. 친구가 들어오면 여기에 나타나요.
          </p>
        )}
        {others.length > 0 && !fill && targets.length < needed - 1 && (
          <p className="l-help-text">
            참가할 수 있는 친구를 {needed - 1}명 이상 골라 주세요.
          </p>
        )}
        {unavailable && (
          <p className="l-error">
            {josa(GAME_INFO[game].name, '은/는')} 이미 진행 중이거나 수락을
            기다리고 있어요.
          </p>
        )}
        {busy(view.self) && !fill && (
          <p className="l-error">
            참가한 게임이나 기다리는 초대가 있어요. 먼저 마친 뒤 요청해 주세요.
          </p>
        )}
      </fieldset>
      <div className="l-modal-actions">
        <button className="l-secondary" onClick={onClose} disabled={pending}>
          닫기
        </button>
        <button
          className="l-primary"
          disabled={
            pending ||
            unavailable ||
            (busy(view.self) && !fill) ||
            targets.length < (fill ? 1 : needed - 1) ||
            view.wallet.balance < reserved
          }
          onClick={async () => {
            if (submitting.current) return;
            submitting.current = true;
            setPending(true);
            try {
              // A fill invite is plain: the server uses the table's stake and seats.
              const ok = await room.action(
                fill
                  ? { kind: 'invite', game, players: targets }
                  : {
                      kind: 'invite',
                      game,
                      players: targets,
                      stake,
                      required: needed,
                    },
              );
              // A refusal already shows the server's reason as a toast.
              if (ok) {
                onClose();
                notify('초대장을 보냈어요. 친구들의 응답을 기다려요.', 'info');
              }
            } finally {
              submitting.current = false;
              setPending(false);
            }
          }}
        >
          {pending ? '초대 보내는 중…' : '초대장 보내기'}
          <Send size={15} />
        </button>
      </div>
    </Modal>
  );
}
