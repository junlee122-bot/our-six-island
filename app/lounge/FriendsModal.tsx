'use client';
import { useState } from 'react';
import { ArrowRight, Copy, LogOut, RotateCcw } from 'lucide-react';
import { AvatarView } from '../avatar-view';
import {
  VILLAGE_CODE,
  type CloudRoom,
  type CloudRoomView,
} from '../lounge-cloud-room';
import type { Look } from '../lounge-look';
import { ACTORS } from '../lounge-roster';
import { NAMES } from '../lounge-text';
import { Modal } from './Modal';
import type { Notify } from './Toast';

export const AREA_NAMES: Record<string, string> = {
  village: NAMES.village,
  lounge: '회관',
  casino: '카지노',
  wardrobe: NAMES.wardrobe,
  home: NAMES.home,
};

export function FriendsModal({
  room,
  view,
  look,
  onClose,
  notify,
  onLeaveRoom,
  onInvite,
  onVisit,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  look: Look;
  onClose: () => void;
  notify: Notify;
  /** Asks for confirmation (if a seat is active) and leaves the room. */
  onLeaveRoom: () => void;
  onInvite: () => void;
  /** Walk into that friend's room (shared live with whoever is there). */
  onVisit?: (actor: number) => void;
}) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const connected = view.status === 'connected';
  const inVillage = view.code === VILLAGE_CODE;
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify('복사했어요.');
    } catch {
      notify('복사하지 못했어요. 표시된 코드를 직접 전달해 주세요.', 'error');
    }
  };
  const link = () => {
    const u = new URL(location.href);
    u.hash = 'lounge=' + view.code;
    return u.href;
  };
  const run = async (task: () => Promise<boolean>) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="지금 마을에 있는 친구" onClose={onClose}>
      {view.status === 'connecting' ? (
        <div className="l-empty">
          <span className="l-spinner" />
          <h3>마을에 들어가는 중이에요.</h3>
        </div>
      ) : connected ? (
        <>
          <p className="l-modal-intro">
            로그인한 친구는 모두 같은 마을에서 만나요. 게임은 회관과 카지노의
            테이블에 앉아서 시작해요.
          </p>
          <ul className="l-online-list" aria-label="접속 중인 친구">
            {view.players.map((p) => (
              <li key={p.id}>
                <AvatarView actor={p.actor} look={p.look} portrait />
                <strong>{ACTORS[p.actor]}</strong>
                <span>
                  {p.id === view.self
                    ? '나'
                    : p.area === 'home'
                      ? `${ACTORS[p.home ?? p.actor]}의 방`
                      : (AREA_NAMES[p.area] ?? NAMES.village)}
                  {view.host === p.id && <em className="l-host-badge">방장</em>}
                </span>
                {onVisit &&
                  p.id !== view.self &&
                  p.area === 'home' &&
                  view.life?.rooms?.[p.home ?? p.actor]?.access !== 'closed' && (
                    <button
                      className="l-secondary"
                      onClick={() => onVisit(p.home ?? p.actor)}
                      data-testid={`visit-room-${p.home ?? p.actor}`}
                    >
                      {ACTORS[p.home ?? p.actor]} 방으로 가기
                    </button>
                  )}
              </li>
            ))}
          </ul>
          {view.players.length < 2 && (
            <p className="l-help-text">
              아직 혼자예요. 친구가 로그인하면 바로 여기에 나타나요.
            </p>
          )}
          <div className="l-modal-actions">
            <button className="l-secondary" onClick={onClose}>
              닫기
            </button>
            <button
              className="l-primary"
              disabled={view.players.length < 2}
              onClick={onInvite}
            >
              게임 초대하기 <ArrowRight size={16} />
            </button>
          </div>
        </>
      ) : (
        <div className="l-empty">
          <h3>
            {view.lost
              ? '마을과 연결이 끊겼어요.'
              : '마을에 연결되어 있지 않아요.'}
          </h3>
          <button
            className="l-primary"
            disabled={busy}
            onClick={() => void run(() => room.rejoin(look))}
          >
            <RotateCcw size={16} /> 다시 들어가기
          </button>
        </div>
      )}
      <details className="l-advanced">
        <summary>고급 · 따로 모이는 방</summary>
        <p className="l-help-text">
          평소에는 필요 없어요. 몇 명만 따로 모이고 싶을 때 코드로 방을 나눠요.
        </p>
        {connected && (
          <div className="l-invite">
            <span>{inVillage ? '마을 코드' : '지금 방 코드'}</span>
            <strong>{view.code}</strong>
            <div>
              <button onClick={() => void copy(view.code)}>
                <Copy size={15} /> 코드 복사
              </button>
              <button onClick={() => void copy(link())}>
                <Copy size={15} /> 링크 복사
              </button>
            </div>
          </div>
        )}
        <form
          className="l-join-form"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => room.switchTo(input, look));
          }}
        >
          <label htmlFor="room-code">다른 방 코드로 참가</label>
          <input
            id="room-code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="초대 코드 또는 링크"
            maxLength={1000}
            autoComplete="off"
          />
          <button className="l-secondary" disabled={busy || !input.trim()}>
            참가하기
          </button>
        </form>
        <div className="l-advanced-actions">
          {connected && !inVillage && (
            <button
              className="l-text"
              disabled={busy}
              onClick={() =>
                void run(
                  async () => (await room.leave()) && room.joinVillage(look),
                )
              }
            >
              모두의 마을로 돌아가기
            </button>
          )}
          {connected && (
            <button
              className="l-text danger"
              disabled={busy}
              onClick={onLeaveRoom}
            >
              <LogOut size={15} /> 방 나가기
            </button>
          )}
        </div>
      </details>
      {view.error && !connected && (
        <p role="alert" className="l-error">
          {view.error}
        </p>
      )}
    </Modal>
  );
}
