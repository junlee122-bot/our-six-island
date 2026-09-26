'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Circle, LogOut, RotateCcw, UserPlus } from 'lucide-react';
import { AvatarView } from './avatar-view';
import { ACTORS } from './lounge-roster';
import {
  GAME_INFO,
  READY_LIMIT_MS,
  gameReservation,
  type GameKind,
} from './lounge-games';
import type { LoungeView } from './lounge-room';
import { formatBeom, josa } from './lounge-text';
import { GAME_COPY } from './lounge/game-copy';
import { TurnTimer } from './lounge-turn-timer';
import './lounge-round-ready.css';

/** READY_LIMIT_MS as words, e.g. '1분' or '90초'. */
const readyLimitText =
  READY_LIMIT_MS % 60000 === 0
    ? `${READY_LIMIT_MS / 60000}분`
    : `${Math.round(READY_LIMIT_MS / 1000)}초`;

/** Contract #2: the retained table (or the view) exposes readyDeadline (server ms). */
function readyDeadlineOf(view: LoungeView, kind: GameKind): number | undefined {
  const table = view.tables?.[kind] as { readyDeadline?: number } | undefined;
  const value =
    table?.readyDeadline ?? (view as { readyDeadline?: number }).readyDeadline;
  return Number.isFinite(value) ? value : undefined;
}

/** How long the result stays on the table before the ready check scrolls in. */
export const RESULT_HOLD_MS = 2400;

export function RoundReady({
  kind,
  view,
  onReady,
  onLeave,
  onInvite,
}: {
  kind: GameKind;
  view: LoungeView;
  onReady: (ready: boolean) => Promise<boolean>;
  onLeave: () => void;
  /** Opens the invite flow to fill empty seats. */
  onInvite?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const deadline = readyDeadlineOf(view, kind);
  // Let the result (dealer's hand and the host's verdict) be seen first,
  // then bring the ready check in. A player who scrolls or presses a key in
  // the meantime keeps their own scroll position.
  useEffect(() => {
    let moved = false;
    const stop = () => (moved = true);
    const events = ['wheel', 'touchstart', 'keydown'] as const;
    events.forEach((e) => window.addEventListener(e, stop, { passive: true }));
    const timer = setTimeout(() => {
      if (!moved)
        panel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, RESULT_HOLD_MS);
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, stop));
    };
  }, []);
  const table = view.tables?.[kind];
  if (!table || !table.members.includes(view.self)) return null;
  const confirmed = table.ready.includes(view.self);
  const reservation = gameReservation(kind, table.stake);
  const insufficient = view.wallet.balance < reservation;
  const missing = Math.max(0, table.required - table.members.length);
  const readyCount = table.members.filter((id) =>
    table.ready.includes(id),
  ).length;
  const game = GAME_INFO[kind].name;
  const confirm = async () => {
    if (pending) return;
    setPending(true);
    try {
      // A refusal already shows the server's reason as a toast.
      await onReady(!confirmed);
    } finally {
      setPending(false);
    }
  };
  return (
    <section
      ref={panel}
      className="l-round-ready"
      aria-label="다음 판 준비"
      data-testid="round-ready"
      data-ready-count={readyCount}
    >
      <div className="l-round-heading">
        <div>
          <span className="l-round-kicker">
            {table.round}번째 판을 마쳤어요
          </span>
          <h2>
            {table.practice
              ? '한 판 더 연습할까요?'
              : table.required === 1
                ? '한 판 더 할까요?'
                : '다음 판도 함께할까요?'}
          </h2>
          {table.practice ? (
            <p>연습 판이라 범은 오가지 않아요. 누르면 바로 다음 판을 시작해요.</p>
          ) : table.stake === 0 ? (
            // 파티 판 / 라이어 게임: nothing is staked.
            <p>범 없이 같은 자리로 이어서 해요. 모두 체크하면 바로 시작해요.</p>
          ) : (
            <p>
              {table.required === 1 ? '누르면' : '모두 체크하면'} 같은 조건(
              {GAME_COPY[kind].amountLabel} {formatBeom(table.stake)}
              {reservation !== table.stake &&
                ` · 최대 ${formatBeom(reservation)} 예약`}
              )으로 이어서 시작해요.
            </p>
          )}
        </div>
        <div className="l-round-side">
          <TurnTimer
            deadline={deadline}
            total={READY_LIMIT_MS}
            label="준비 확인"
            mine={!confirmed}
          />
          <output className="l-round-count" aria-live="polite">
            <Check size={17} />
            {readyCount} / {table.members.length} 준비
          </output>
        </div>
      </div>
      <ul className="l-round-friends" aria-label="친구들의 준비 상태">
        {table.members.map((id) => {
          const member = view.players.find((p) => p.id === id),
            checked = table.ready.includes(id);
          const short = member && member.balance < reservation;
          return (
            <li
              key={id}
              className={checked ? 'is-ready' : ''}
              data-member={id}
              data-ready={checked}
            >
              {member && <AvatarView actor={member.actor} look={member.look} portrait />}
              <span>
                <strong>
                  {member ? ACTORS[member.actor] : '친구'}
                  {id === view.self && <small>나</small>}
                </strong>
                <span>
                  {checked
                    ? '준비 완료'
                    : short
                      ? '범 잔액 부족'
                      : '기다리는 중'}
                </span>
              </span>
              {checked ? (
                <Check size={19} aria-label="준비 완료" />
              ) : (
                <Circle size={17} aria-label="미확인" />
              )}
            </li>
          );
        })}
      </ul>
      {missing > 0 && (
        <p className="l-round-message">
          {josa(game, '은/는')} {table.required}명이 필요해요. {missing}자리가
          비었어요.
        </p>
      )}
      {insufficient && !confirmed && (
        <p className="l-round-message">
          예약금이 부족해요. 지금 잔액은{' '}
          {josa(formatBeom(view.wallet.balance), '이에요/예요')}.
        </p>
      )}
      <div className="l-round-actions">
        {missing > 0 && onInvite ? (
          <button type="button" className="l-primary" onClick={onInvite}>
            <UserPlus size={18} />
            빈자리에 친구 초대
          </button>
        ) : (
          <button
            type="button"
            className={
              'l-primary l-round-confirm' + (confirmed ? ' is-ready' : '')
            }
            aria-pressed={confirmed}
            disabled={pending || (!confirmed && (insufficient || missing > 0))}
            onClick={() => void confirm()}
            data-testid="continue-round"
          >
            {confirmed ? <Check size={19} /> : <RotateCcw size={18} />}
            {pending
              ? '확인 중…'
              : confirmed
                ? '준비 완료 · 누르면 취소'
                : '계속 게임 진행하기'}
          </button>
        )}
        <button
          type="button"
          className="l-secondary"
          onClick={onLeave}
          disabled={pending}
        >
          <LogOut size={16} />
          일어나기
        </button>
      </div>
      <output className="l-round-feedback" aria-live="polite">
        {confirmed
          ? '체크했어요. 모두 준비하면 다음 판으로 넘어가요.'
          : deadline !== undefined
            ? `${readyLimitText} 안에 준비하지 않으면 자리에서 빠지고, 인원이 모자라면 테이블이 정리돼요.`
            : '체크만으로는 범이 빠지지 않아요.'}
      </output>
    </section>
  );
}
