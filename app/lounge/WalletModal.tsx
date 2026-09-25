'use client';
import { useState } from 'react';
import { Gift } from 'lucide-react';
import { GAME_INFO, type GameKind } from '../lounge-games';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { formatBeom, josa } from '../lounge-text';
import { Details, Modal } from './Modal';
import type { Notify } from './Toast';
import { useNow } from './use-now';

export type DailyGrant = { available: boolean; amount: number; nextAt: number };

/** Contract #5: wallet view exposes `daily` once the server supports it. */
export function dailyOf(view: CloudRoomView): DailyGrant | null {
  const daily = (view.wallet as { daily?: DailyGrant }).daily;
  return daily && typeof daily.available === 'boolean' ? daily : null;
}

function wait(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000)),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : m > 0 ? `${m}분` : `${s % 60}초`;
}

/** "오늘의 범" button; shows the countdown to the next grant when used. */
export function DailyButton({
  room,
  view,
  notify,
  compact = false,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  compact?: boolean;
}) {
  const daily = dailyOf(view);
  const [busy, setBusy] = useState(false);
  const now = useNow(!!daily && !daily.available, 30000);
  if (!daily) return null;
  if (!daily.available)
    return compact ? null : (
      <p className="l-daily-wait">
        다음 오늘의 범까지 {wait(daily.nextAt - (now + view.clockOffset))}
      </p>
    );
  return (
    <button
      className={compact ? 'l-daily-chip' : 'l-primary l-daily'}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          if (await room.daily())
            notify(
              `오늘의 범 ${josa(formatBeom(daily.amount), '을/를')} 받았어요. 내일 0시(한국 시간)에 다시 받을 수 있어요.`,
            );
        } finally {
          setBusy(false);
        }
      }}
    >
      <Gift size={compact ? 15 : 17} aria-hidden="true" />
      {compact
        ? '오늘의 범'
        : daily.amount > 3000
          ? `긴급 지원 받기 · +${formatBeom(daily.amount)}`
          : `오늘의 범 받기 · +${formatBeom(daily.amount)}`}
    </button>
  );
}

export function WalletModal({
  room,
  view,
  username,
  notify,
  onClose,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  username: string;
  notify: Notify;
  onClose: () => void;
}) {
  const low = view.wallet.balance < 10_000;
  return (
    <Modal title="내 범 지갑" onClose={onClose}>
      <div className="l-wallet-info">
        <small>모든 게임에서 함께 쓰는 화폐</small>
        <strong>{formatBeom(view.wallet.balance)}</strong>
        <p>
          {view.wallet.held > 0
            ? `게임에 예약한 금액 ${formatBeom(view.wallet.held)}`
            : '체스 · 고스톱 · 섯다 · 홀덤 · 블랙잭에 써요.'}
        </p>
      </div>
      <DailyButton room={room} view={view} notify={notify} />
      {low && (
        <p className="l-wallet-low" role="note">
          가진 범과 가방 속 물건을 모두 합쳐 10,000범이 안 되면 오늘의 범이 긴급 지원
          6,000범으로 바뀌어요. 파산해도 하루 한 번 다시 시작할 수 있어요.
        </p>
      )}
      <Details summary={`${username} 계정의 공통 지갑이에요.`}>
        모든 방과 기기에서 잔액이 이어져요. 게임이 끝나면 서버가 자동으로
        정산하고, 코디 초기화로는 다시 지급되지 않아요. 오늘의 범은 한국 시간
        기준 하루에 한 번 3,000범이에요.
      </Details>
      {view.wallet.history.length > 0 && (
        <ul className="l-wallet-history">
          {view.wallet.history.map((h) => (
            <li key={h.id}>
              <span>
                {GAME_INFO[h.game as GameKind]?.name ??
                  (h.game === 'daily' ? '오늘의 범' : h.game)}
              </span>
              <b className={h.delta < 0 ? 'is-loss' : ''}>
                {h.delta > 0 ? '+' : ''}
                {formatBeom(h.delta)}
              </b>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
