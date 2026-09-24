'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Circle, LogOut, RotateCcw } from 'lucide-react';
import { AvatarView } from './avatar-view';
import { ACTORS } from './theater-data';
import {
  GAME_INFO,
  gameReservation,
  type GameKind,
  type LoungeView,
} from './lounge-room';
import { beom } from './lounge-poker-table';
import './lounge-round-ready.css';

export function RoundReady({
  kind,
  view,
  onReady,
  onLeave,
}: {
  kind: GameKind;
  view: LoungeView;
  onReady: (ready: boolean) => Promise<boolean>;
  onLeave: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      panel.current?.scrollIntoView({
        block: 'nearest',
        behavior: 'instant',
      }),
    );
    return () => cancelAnimationFrame(frame);
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
  const confirm = async () => {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      if (!(await onReady(!confirmed)))
        setError(
          '준비 상태를 바꾸지 못했어요. 연결과 잔액을 확인한 뒤 다시 눌러 주세요.',
        );
    } catch {
      setError('연결을 확인한 뒤 다시 눌러 주세요.');
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
          <h2>다음 판도 함께할까요?</h2>
          <p>자리는 그대로예요. 모두 체크하면 같은 친구들과 이어서 시작해요.</p>
        </div>
        <output className="l-round-count" aria-live="polite">
          <Check size={17} />
          {readyCount} / {table.members.length} 준비
        </output>
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
              {member && <AvatarView actor={member.actor} look={member.look} />}
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
                      : '확인 기다리는 중'}
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
      <p className="l-round-stake">
        다음 {GAME_INFO[kind].name} 판도 같은 조건 ·{' '}
        {kind === 'blackjack'
          ? '최대 예약'
          : kind === 'gostop'
            ? '최대 손실'
            : '참가금'}{' '}
        {beom(reservation)}
        <span>
          전원 준비가 완료될 때 예약하며, 준비 체크만으로는 범을 차감하지
          않아요.
        </span>
      </p>
      {missing > 0 && (
        <p className="l-round-message">
          {GAME_INFO[kind].name}은 {table.required}명이 필요해요. {missing}명이
          부족해 다음 판을 시작할 수 없어요. 새 구성으로 놀려면 테이블에서 나간
          뒤 다시 초대해 주세요.
        </p>
      )}
      {insufficient && !confirmed && (
        <p className="l-round-message">
          다음 판 예약금이 부족해요. 현재 잔액은 {beom(view.wallet.balance)}
          예요.
        </p>
      )}
      <div className="l-round-actions">
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
        <button
          type="button"
          className="l-secondary"
          onClick={onLeave}
          disabled={pending}
        >
          <LogOut size={16} />
          게임 나가기
        </button>
      </div>
      <output className="l-round-feedback" aria-live="polite">
        {error ||
          (confirmed
            ? '체크가 확인됐어요. 다른 친구들이 준비하면 다음 판으로 넘어가요.'
            : '나가기를 누르기 전에는 이 테이블의 참가자로 유지돼요.')}
      </output>
    </section>
  );
}
