'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, X, MoreHorizontal } from 'lucide-react';
import { GAME_INFO, gameReservation, type GameKind } from '../lounge-games';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { formatBeom, josa } from '../lounge-text';
import { GAME_COPY } from './game-copy';
import { inviteChips, nameOf, secondsLeft } from './invite-text';
import { useNow } from './use-now';
import { CountdownRing } from './Countdown';
import { prefetchTable } from './table-chunks';

const INVITE_MS = 90000;

/** Waiting invites that involve me, with countdown and per-friend chips. */
export function Invitations({
  room,
  view,
}: {
  room: CloudRoom;
  view: CloudRoomView;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const inFlight = useRef(false);
  // Tables (forming or filling seats) show in the scene and call with a
  // banner; only old-style invites from older clients are listed here.
  const relevant = view.invites.filter(
    (r) =>
      !r.table &&
      !r.fill &&
      (r.from === view.self || r.invited.includes(view.self)) &&
      r.status === 'waiting',
  );
  const now = useNow(relevant.length > 0);
  // Download the table while friends are still answering, so joining shows
  // the table right away instead of a loading spinner.
  const games = [...new Set(relevant.map((r) => r.game))].join(',');
  useEffect(() => {
    for (const game of games.split(',')) if (game) prefetchTable(game as GameKind);
  }, [games]);
  if (!relevant.length) return null;
  // Failures already show the server's reason as a toast (no second message).
  const respond = async (id: string, accept?: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(id);
    try {
      await room.action(
        accept === undefined
          ? { kind: 'cancel', id }
          : { kind: 'reply', id, accept },
      );
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  };
  return (
    <div className="l-invitations" aria-live="polite">
      {relevant.map((r) => {
        const accepted = r.accepted.includes(view.self),
          declined = (r.declined ?? []).includes(view.self),
          mine = r.from === view.self,
          reservation = gameReservation(r.game, r.stake),
          short = view.wallet.balance < reservation,
          left = secondsLeft(r.expires, now, view.clockOffset),
          game = GAME_INFO[r.game].name;
        return (
          <article
            key={r.id}
            className="l-invitation-card"
            data-testid="invite-card"
          >
            <CountdownRing
              seconds={left}
              total={INVITE_MS / 1000}
              label="초대"
            />
            <div>
              <strong>
                {mine
                  ? `내가 보낸 ${game} 초대`
                  : `${nameOf(r.from, view.players)}의 ${game} 초대`}
              </strong>
              <p>
                {r.stake > 0 ? `${GAME_COPY[r.game].amountLabel} ${formatBeom(r.stake)}` : '파티 판 · 범 없이'}
                {r.game === 'blackjack' &&
                  ` · 최대 ${formatBeom(reservation)} 예약`}
                {' · '}
                {r.accepted.length}/{r.required}명 수락
              </p>
              <ul className="l-invite-chips" aria-label="친구별 응답">
                {inviteChips(r, view.players, view.self).map((chip) => (
                  <li key={chip.id} className={'is-' + chip.state}>
                    {chip.state === 'accepted' ? (
                      <Check size={13} aria-hidden="true" />
                    ) : chip.state === 'declined' ? (
                      <X size={13} aria-hidden="true" />
                    ) : (
                      <MoreHorizontal size={13} aria-hidden="true" />
                    )}
                    {chip.name}
                    <span className="l-sr">
                      {chip.state === 'accepted'
                        ? ' 수락'
                        : chip.state === 'declined'
                          ? ' 다음에'
                          : ' 기다리는 중'}
                    </span>
                  </li>
                ))}
              </ul>
              {declined && (
                <p className="l-invite-note">이번에는 쉬어 가기로 했어요.</p>
              )}
              {!accepted && !declined && short && (
                <p className="l-invite-note">
                  {josa(formatBeom(reservation), '이/가')} 필요해요. 지갑에서
                  오늘의 범을 받아 보세요.
                </p>
              )}
            </div>
            {accepted ? (
              <button
                className="l-text"
                disabled={!!pending}
                onClick={() => void respond(r.id)}
                title={
                  mine
                    ? '모두에게서 이 초대를 거둬요.'
                    : '나만 빠지고, 초대는 다른 친구들에게 그대로 남아요.'
                }
              >
                {mine ? '초대 취소' : '참가 취소'}
              </button>
            ) : !declined ? (
              <div className="l-invite-actions">
                <button
                  className="l-primary"
                  disabled={!!pending || short}
                  onClick={() => void respond(r.id, true)}
                >
                  {pending === r.id
                    ? '보내는 중…'
                    : short
                      ? '범 잔액 부족'
                      : '참가하기'}
                </button>
                <button
                  className="l-text"
                  disabled={!!pending}
                  onClick={() => void respond(r.id, false)}
                >
                  다음에
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
