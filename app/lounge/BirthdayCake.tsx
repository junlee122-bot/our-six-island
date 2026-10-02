'use client';
// 생일 잔치: the plaza cake opens this panel. Each other friend leaves their
// name in the birthday friend's 축하 방명록 once (server-checked, lounge-
// birthday.ts); the birthday friend reads who came. On 도원·민서's shared day
// one cake serves both: one row per birthday friend, signed separately.
import { useEffect, useState } from 'react';
import { PartyPopper } from '../ui/icons';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { ACTORS } from '../lounge-roster';
import { BIRTHDAY_SIGN_BOND, birthdayNames } from '../lounge-birthday';
import { lifeSfx } from '../lounge-audio-life';
import { Modal } from './Modal';
import type { Notify } from './Toast';
import { useLifeAction } from './LifePanels';
import './birthday.css';

const CONFETTI = ['var(--pal-red-60)', 'var(--gold-400)', 'var(--pal-blue-52)', 'var(--pal-green-58)', 'var(--pal-orange-69)'];

/** Who signed a book, in signing order ("아직 아무도 없어요" when empty). */
export function GuestbookNames({ signers }: { signers: readonly number[] }) {
  if (!signers.length) return <span className="l-bday-empty">아직 아무도 없어요</span>;
  return (
    <ul className="l-bday-names">
      {signers.map((a) => (
        <li key={a}>{ACTORS[a] ?? '친구'}</li>
      ))}
    </ul>
  );
}

export function BirthdayCakePanel({ room, view, notify, selfActor, onClose }: { room: CloudRoom; view: CloudRoomView; notify: Notify; selfActor: number; onClose: () => void }) {
  const bday = view.life?.birthday;
  const today = bday?.today ?? [];
  const [run, busy] = useLifeAction(room, notify);
  const [sticker, setSticker] = useState<number | null>(null);
  useEffect(() => {
    if (sticker === null) return;
    const t = setTimeout(() => setSticker(null), 2600);
    return () => clearTimeout(t);
  }, [sticker]);
  const sign = async (to: number) => {
    if (await run({ kind: 'birthdayCheer', to }, `${ACTORS[to]}의 방명록에 축하를 남겼어요.`)) {
      setSticker(to);
      lifeSfx('fanfare');
    }
  };
  return (
    <Modal title={today.length ? `${birthdayNames(today)} 생일 케이크` : '생일 케이크'} onClose={onClose} className="l-life-modal l-bday">
      {!today.length ? (
        <p className="l-help-text" data-testid="bday-none">
          오늘은 생일인 친구가 없어요.
        </p>
      ) : (
        <>
          <p className="l-help-text">
            축하 방명록에 이름을 남겨요. 한 사람에 한 번, 기분이 좋아지고 우정이 조금(+{BIRTHDAY_SIGN_BOND}) 쌓여요.
          </p>
          <ul className="l-bday-books" data-testid="bday-books">
            {today.map((a) => {
              const signers = bday?.books[a] ?? [];
              const mine = a === selfActor;
              const signed = signers.includes(selfActor);
              return (
                <li key={a} className="l-bday-book" data-testid={`bday-book-${a}`}>
                  <header>
                    <strong>{ACTORS[a]}의 축하 방명록</strong>
                    <small>{signers.length}명이 축하했어요</small>
                  </header>
                  <GuestbookNames signers={signers} />
                  {mine ? (
                    <small className="l-bday-note">내 생일이에요! 친구들이 남긴 축하를 모아 둘게요.</small>
                  ) : (
                    <button type="button" className="l-primary" disabled={busy || signed} onClick={() => void sign(a)} data-testid={`bday-sign-${a}`}>
                      {signed ? '축하를 남겼어요' : '축하하기'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {sticker !== null && (
        <div className="l-bday-sticker" aria-live="polite" data-testid="bday-sticker">
          {Array.from({ length: 18 }, (_, i) => (
            <i key={i} aria-hidden="true" style={{ left: `${(i * 37) % 100}%`, background: CONFETTI[i % CONFETTI.length], animationDelay: `${(i % 6) * 0.1}s` }} />
          ))}
          <div className="l-bday-stamp">
            <PartyPopper size={28} aria-hidden="true" />
            <strong>생일 축하해, {ACTORS[sticker]}!</strong>
          </div>
        </div>
      )}
    </Modal>
  );
}
