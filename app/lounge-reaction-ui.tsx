'use client';
/* oxlint-disable next/no-img-element -- GitHub Pages embeds these transparent assets; no image optimization server is available. */
import { useEffect, useRef, useState } from 'react';
import { Smile, Eye, EyeOff, X } from 'lucide-react';
import { LOUNGE_ASSETS } from './lounge-assets';
import { ACTORS } from './lounge-roster';
import type { LoungePlayer } from './lounge-room';
import {
  REACTIONS,
  REACTION_COOLDOWN,
  REACTION_TTL,
  reactionVisible,
  type ReactionId,
  type ReactionScope,
} from './lounge-reactions';

export const reactionImage = (id: ReactionId) =>
  LOUNGE_ASSETS[`reaction_${id}`];

export function ReactionDock({
  players,
  self,
  scope,
  matchId,
  connected,
  hidden,
  onHidden,
  onSend,
}: {
  players: LoungePlayer[];
  self: string;
  scope: ReactionScope;
  matchId?: string;
  connected: boolean;
  hidden: boolean;
  onHidden: (value: boolean) => void;
  onSend: (id: ReactionId) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [until, setUntil] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const [message, setMessage] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const sending = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const now = clock;
  const own = players.find((p) => p.id === self)?.reaction;
  const cooldownUntil = Math.max(
    until,
    (own?.expiresAt ?? 0) - REACTION_TTL + REACTION_COOLDOWN,
  );
  const visible = players
    .filter((p) => reactionVisible(p.reaction, scope, matchId, now))
    .sort((a, b) => b.reaction!.at - a.reaction!.at)
    .slice(0, 3);
  // Re-render only when something visible changes: the next sticker expiry or
  // the end of my cooldown (instead of a 4×/s interval).
  const nextChange = Math.min(
    ...players.map((p) => p.reaction?.expiresAt ?? 0).filter((at) => at > now),
    cooldownUntil > now ? cooldownUntil : Infinity,
  );
  useEffect(() => {
    const tick = () => setClock(Date.now());
    if (!Number.isFinite(nextChange)) {
      // A new reaction arrived through props: refresh the clock once.
      const t = setTimeout(tick, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(tick, Math.max(50, nextChange - Date.now() + 20));
    return () => clearTimeout(t);
  }, [nextChange, players]);
  useEffect(() => {
    if (!open) return;
    const d = dialog.current!;
    const opener = trigger.current;
    d.showModal();
    return () => {
      d.close();
      opener?.focus();
    };
  }, [open]);
  async function send(id: ReactionId) {
    // oxlint-disable-next-line react/react-compiler -- This click handler reads the clock at the moment of sending, never during render.
    if (sending.current || Date.now() < cooldownUntil) return;
    sending.current = true;
    setPending(true);
    setMessage('');
    try {
      if (await onSend(id)) {
        // oxlint-disable-next-line react/react-compiler -- Start the local cooldown after asynchronous delivery succeeds.
        setUntil(Date.now() + REACTION_COOLDOWN);
        setOpen(false);
        setMessage(
          connected
            ? '친구들에게 스티커를 보냈어요.'
            : '미리보기예요. 방에 연결하면 친구들도 볼 수 있어요.',
        );
      } else
        setMessage(
          '전송하지 못했어요. 연결 상태를 확인하고 잠시 뒤 다시 보내 주세요.',
        );
    } catch {
      setMessage('스티커를 보내지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
  return (
    <aside className="l-reactions" aria-label="친구들의 감정 스티커">
      <div className="l-reaction-bar">
        <span>
          <b>한 판, 한마디</b>
          <small>
            {connected ? '친구와 주고받는 범티콘' : '범티콘 미리보기'}
          </small>
        </span>
        <div>
          <button
            type="button"
            className="l-reaction-toggle"
            aria-label={hidden ? '스티커 표시하기' : '스티커 숨기기'}
            aria-pressed={hidden}
            onClick={() => onHidden(!hidden)}
          >
            {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            type="button"
            ref={trigger}
            className="l-reaction-open"
            onClick={() => {
              setMessage('');
              setOpen(true);
            }}
            aria-haspopup="dialog"
          >
            <Smile size={18} /> 스티커
          </button>
        </div>
      </div>
      <div
        className="l-reaction-feed"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {!hidden &&
          visible.map((p) => (
            <div
              className={'l-reaction-card ' + p.reaction!.id}
              key={p.id + ':' + p.reaction!.at}
            >
              <img
                src={reactionImage(p.reaction!.id)}
                alt={
                  REACTIONS.find((r) => r.id === p.reaction!.id)!.description
                }
              />
              <span>
                <b>{ACTORS[p.actor]}</b>
                <small>
                  {REACTIONS.find((r) => r.id === p.reaction!.id)!.label}
                </small>
              </span>
            </div>
          ))}
        {(hidden || !visible.length) && (
          <p>
            {hidden
              ? '스티커를 숨겼어요. 눈 아이콘으로 다시 켤 수 있어요.'
              : '좋은 수에는 나이스! 아쉬운 패에는 엉엉.'}
          </p>
        )}
      </div>
      <output className="l-reaction-status">{message}</output>
      {open && (
        <dialog
          ref={dialog}
          className="l-reaction-picker"
          aria-labelledby="reaction-picker-title"
          onCancel={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <header>
            <div>
              <small>범티콘</small>
              <h2 id="reaction-picker-title">말 대신, 범티콘</h2>
            </div>
            <button
              type="button"
              aria-label="스티커 선택창 닫기"
              onClick={() => setOpen(false)}
            >
              <X size={22} />
            </button>
          </header>
          <p>
            {connected
              ? '선택하면 바로 보내요. 같은 공간의 친구들이 볼 수 있어요.'
              : '지금은 미리보기예요. 친구와 방을 연결한 뒤 함께 사용해요.'}
          </p>
          <div className="l-reaction-grid">
            {REACTIONS.map((r) => (
              <button
                type="button"
                key={r.id}
                aria-label={r.label + ' 스티커 보내기'}
                disabled={pending || now < cooldownUntil}
                onClick={() => void send(r.id)}
              >
                <img src={reactionImage(r.id)} alt="" />
                <b>{r.label}</b>
                <small>{r.description}</small>
              </button>
            ))}
          </div>
          <output className="l-reaction-picker-status">
            {pending
              ? '보내는 중…'
              : now < cooldownUntil
                ? '잠깐만요! 곧 다시 보낼 수 있어요.'
                : message || '한 번에 하나씩 · 6초 동안 표시돼요'}
          </output>
        </dialog>
      )}
    </aside>
  );
}
