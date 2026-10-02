'use client';
import { useState } from 'react';
import { shareableInviteUrl } from '../desktop-bridge';
import { AvatarView } from '../avatar-view';
import {
  VILLAGE_CODE,
  type CloudRoom,
  type CloudRoomView,
} from '../lounge-cloud-room';
import type { Look } from '../lounge-look';
import { ACTORS } from '../lounge-roster';
import { presenceLine } from '../lounge-presence';
import { Modal } from './Modal';
import { lookFor } from './friend-looks';
import type { Notify } from './Toast';
import { FriendMoodBadge } from './MoodHud';
import { GameButton } from '../ui/GameButton';
import { Glyph } from '../ui/Glyph';
import './friends.css';

export function FriendsModal({
  room,
  view,
  look,
  onClose,
  notify,
  onLeaveRoom,
  onInvite,
  onRobbery,
  onVisit,
  onMail,
  selfActor,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  look: Look;
  onClose: () => void;
  notify: Notify;
  /** Asks for confirmation (if a seat is active) and leaves the room. */
  onLeaveRoom: () => void;
  onInvite: () => void;
  /** Open the village-only protection and robbery screen. */
  onRobbery?: () => void;
  /** Walk into that friend's room (shared live with whoever is there). */
  onVisit?: (actor: number) => void;
  /** Write a letter (friends who are resting get one instead of an invite). */
  onMail?: (actor: number) => void;
  /** My own actor, so the resting list leaves me out. */
  selfActor?: number;
}) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const offline = view.link.state === 'offline';
  const connected = view.status === 'connected' && !offline;
  const online = new Set(view.players.map((p) => p.actor));
  const me = selfActor ?? view.players.find((p) => p.id === view.self)?.actor;
  const canOpenRobbery = connected && view.players.some((p) => p.id === view.self && p.area === 'village');
  // Friends who are not logged in: they walk their daily round in the village
  // as "쉬는 중" figures. Letters and room visits work; games do not.
  const resting = ACTORS.map((_, actor) => actor).filter(
    (actor) => actor !== me && !online.has(actor),
  );
  const inVillage = view.code === VILLAGE_CODE;
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify('복사했어요.');
    } catch {
      notify('복사하지 못했어요. 표시된 코드를 직접 전달해 주세요.', 'error');
    }
  };
  // In the desktop app location is tauri://localhost: link the public site.
  const link = () => shareableInviteUrl('lounge', view.code);
  const run = async (task: () => Promise<boolean>) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  };
  const restingList = (connected || offline) && resting.length > 0 && (
    <section className="fr-section" aria-labelledby="l-resting-title">
      <h3 id="l-resting-title" className="fr-heading">
        쉬는 중인 친구 <small>{resting.length}명 · 지금은 접속하지 않았어요</small>
      </h3>
      <ul className="fr-list" aria-label="쉬는 중인 친구">
        {resting.map((actor) => (
          <li key={actor} className="fr-row is-resting" data-testid={`resting-${actor}`}>
            <span className="l-mood-portrait fr-face">
              <span className="l-resting-face" aria-hidden="true">
                <AvatarView actor={actor} look={lookFor(actor)} portrait />
              </span>
              <FriendMoodBadge face={view.life?.mood?.faces[actor]} />
            </span>
            <span className="fr-who">
              <strong>{ACTORS[actor]}</strong>
              <span>쉬는 중 · 마을을 산책해요</span>
            </span>
            <span className="fr-actions">
              {onMail && (
                <GameButton size="s" glyph="letter" onClick={() => onMail(actor)}>
                  편지 쓰기
                </GameButton>
              )}
              {onVisit && (
                <GameButton size="s" variant="ghost" glyph="house" onClick={() => onVisit(actor)}>
                  방에 놀러 가기
                </GameButton>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <Modal
      title="친구들"
      onClose={onClose}
      panel="journal"
      className="fr-modal"
      keyHints={[{ keys: [{ label: 'Tab' }], does: '버튼 옮기기' }, { keys: [{ code: 'Enter' }], does: '누르기' }]}
    >
      {offline ? (
        <div className="l-empty">
          <h3>연결이 끊겼어요.</h3>
          <p className="l-help-text">
            다시 연결되면 누가 접속했는지 보여요. 지금 보이는 친구들은 마지막
            모습이에요.
          </p>
          <GameButton variant="primary" glyph="refresh" onClick={() => room.reconnect()}>
            지금 다시 연결
          </GameButton>
        </div>
      ) : view.status === 'connecting' ? (
        <div className="l-empty">
          <span className="l-spinner" />
          <h3>마을에 들어가는 중이에요.</h3>
        </div>
      ) : connected ? (
        <>
          <p className="fr-intro">
            로그인한 친구는 모두 같은 마을에서 만나요. 게임은 회관과 카지노의
            테이블에 앉아서 시작해요.
          </p>
          <section className="fr-section" aria-labelledby="l-online-title">
            <h3 id="l-online-title" className="fr-heading">
              <i className="fr-dot" aria-hidden="true" /> 지금 접속{' '}
              <small>{Math.max(0, view.players.length - 1)}명</small>
            </h3>
            <ul className="fr-list" aria-label="접속 중인 친구">
              {view.players.map((p) => (
                <li key={p.id} className="fr-row">
                  <span className="l-mood-portrait fr-face">
                    <AvatarView actor={p.actor} look={p.look} portrait />
                    {p.id !== view.self && <FriendMoodBadge face={view.life?.mood?.faces[p.actor]} />}
                  </span>
                  <span className="fr-who">
                    <strong>
                      {ACTORS[p.actor]}
                      {view.host === p.id && <em className="fr-host">방장</em>}
                    </strong>
                    <span>
                      {p.id === view.self ? '나' : `접속 중 · ${presenceLine(p, me)}`}
                    </span>
                  </span>
                  {onVisit &&
                    p.id !== view.self &&
                    p.area === 'home' &&
                    view.life?.rooms?.[p.home ?? p.actor]?.access !== 'closed' && (
                      <span className="fr-actions">
                        <GameButton
                          size="s"
                          glyph="house"
                          onClick={() => onVisit(p.home ?? p.actor)}
                          data-testid={`visit-room-${p.home ?? p.actor}`}
                        >
                          {ACTORS[p.home ?? p.actor]} 방으로 가기
                        </GameButton>
                      </span>
                    )}
                </li>
              ))}
            </ul>
            {view.players.length < 2 && (
              <p className="fr-note">
                아직 혼자예요. 친구가 로그인하면 바로 여기에 나타나요.
              </p>
            )}
          </section>
          {restingList}
          {canOpenRobbery && onRobbery && (
            <section className="fr-section" aria-label="마을 방범">
              <GameButton glyph="shield" onClick={onRobbery} data-testid="friends-robbery-button">강도·방범</GameButton>
            </section>
          )}
          <div className="l-modal-actions fr-footer">
            <GameButton onClick={onClose}>닫기</GameButton>
            <GameButton
              variant="primary"
              glyph="arrow"
              disabled={view.players.length < 2}
              disabledReason="친구가 접속하면 초대할 수 있어요"
              onClick={onInvite}
            >
              게임 초대하기
            </GameButton>
          </div>
        </>
      ) : (
        <div className="l-empty">
          <h3>
            {view.lost
              ? '마을과 연결이 끊겼어요.'
              : '마을에 연결되어 있지 않아요.'}
          </h3>
          <GameButton
            variant="primary"
            glyph="refresh"
            disabled={busy}
            onClick={() => void run(() => room.rejoin(look))}
          >
            다시 들어가기
          </GameButton>
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
                <Glyph name="copy" size={16} /> 코드 복사
              </button>
              <button onClick={() => void copy(link())}>
                <Glyph name="copy" size={16} /> 링크 복사
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
              <Glyph name="door" size={16} /> 방 나가기
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
