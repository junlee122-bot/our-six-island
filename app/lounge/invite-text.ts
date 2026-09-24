// Pure helpers that describe invite states in Korean (unit-tested).
import type { GameInvite, LoungePlayer } from '../lounge-room.ts';
import { GAME_INFO } from '../lounge-games.ts';
import { ACTORS } from '../lounge-roster.ts';
import { josa } from '../lounge-text.ts';

type Who = Pick<LoungePlayer, 'id' | 'actor'>;

export function nameOf(id: string, players: readonly Who[], self?: string) {
  if (self && id === self) return '나';
  const p = players.find((p) => p.id === id);
  return p ? ACTORS[p.actor] : '친구';
}

export type InviteChip = {
  id: string;
  name: string;
  state: 'accepted' | 'declined' | 'waiting';
};

/** Per-friend status chips: sender first, then invited friends. */
export function inviteChips(
  invite: GameInvite,
  players: readonly Who[],
  self?: string,
): InviteChip[] {
  const ids = [
    invite.from,
    ...invite.invited.filter((id) => id !== invite.from),
  ];
  return ids.map((id) => ({
    id,
    name: nameOf(id, players, self),
    state: invite.accepted.includes(id)
      ? 'accepted'
      : (invite.declined ?? []).includes(id)
        ? 'declined'
        : 'waiting',
  }));
}

const list = (names: string[]) => names.join(', ');

/** Why an invite ended without a game (shown in a toast). */
export function inviteEndReason(
  previous: GameInvite,
  next: GameInvite,
  players: readonly Who[],
  previousPlayers: readonly Who[],
  self: string,
): string {
  const game = GAME_INFO[next.game].name;
  if (next.status === 'expired')
    return `${game} 초대 시간이 지났어요. ${next.accepted.length}/${next.required}명만 수락했어요.`;
  const everyone = [...previousPlayers, ...players];
  const gone = [...new Set([...previous.accepted, ...previous.invited])].filter(
    (id) =>
      id !== self &&
      previousPlayers.some((p) => p.id === id) &&
      !players.some((p) => p.id === id),
  );
  if (gone.length) {
    const names = gone.map((id) => nameOf(id, everyone));
    return `${josa(list(names), '이/가')} 마을을 떠나서 ${game} 초대가 취소됐어요.`;
  }
  const newlyDeclined = (next.declined ?? []).filter(
    (id) => !(previous.declined ?? []).includes(id),
  );
  const declined = newlyDeclined.length ? newlyDeclined : (next.declined ?? []);
  if (
    declined.length &&
    1 + next.invited.length - next.declined.length < next.required
  ) {
    const names = declined.map((id) => nameOf(id, everyone, self));
    if (names.length === 1 && names[0] === '나')
      return `${game} 초대를 거절했어요.`;
    return `${josa(list(names.filter((n) => n !== '나')), '이/가')} 다음에 하기로 해서 ${game} 인원이 모자라요.`;
  }
  if (next.from === self) return `${game} 초대를 취소했어요.`;
  if (previous.accepted.length <= 1)
    return `${josa(nameOf(next.from, everyone), '이/가')} ${game} 초대를 취소했어요.`;
  return `수락한 친구가 ${game} 초대를 취소했어요.`;
}

/** Seconds left on an invite, using the server clock offset. */
export function secondsLeft(expires: number, now: number, clockOffset = 0) {
  return Math.max(0, Math.ceil((expires - (now + clockOffset)) / 1000));
}
