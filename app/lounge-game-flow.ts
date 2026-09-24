import {
  GAME_INFO,
  GAME_KINDS,
  gameReservation,
  type GameInvite,
  type GameKind,
} from './lounge-room.ts';
import type { LoungeView } from './lounge-room.ts';

/** Hub states describe the next safe action for one game, without performing it. */
export type GameHubStatus =
  | 'resume'
  | 'ready'
  | 'spectate'
  | 'retained'
  | 'invited'
  | 'waiting'
  | 'available'
  | 'blocked';

export type GameFlow = {
  kind: GameKind;
  status: GameHubStatus;
  statusLabel: string;
  detail: string;
  actionLabel: string;
  disabledReason: string;
  active: boolean;
  ended: boolean;
  retained: boolean;
  ownTable: boolean;
  ownSeat: boolean;
  canOpen: boolean;
  canRequest: boolean;
  canShowInvitations: boolean;
  invite: GameInvite | null;
  table: LoungeView['tables'][GameKind] | null;
  seats: LoungeView['seats'][GameKind];
  occupiedSeats: number;
  required: number;
  readyCount: number;
  reservation: number;
  eligibleFriends: LoungeView['players'];
};

const gameMatch = (view: LoungeView, kind: GameKind) => view[kind];

/** True while a game can still accept player actions. */
export const gameIsActive = (view: LoungeView, kind: GameKind): boolean => {
  const match = gameMatch(view, kind);
  if (!match) return false;
  if (kind === 'chess') return !view.chess?.winner;
  return view[kind]?.phase !== 'over';
};

/**
 * A player is busy if any table still retains them, if they occupy a seat in
 * an active match, or if they accepted a waiting invite whose match has not
 * launched yet.
 */
export const playerIsBusy = (view: LoungeView, id: string): boolean => {
  if (!id) return false;
  if (
    Object.values(view.tables ?? {}).some((table) =>
      table?.members.includes(id),
    )
  ) {
    return true;
  }
  if (
    Object.entries(view.seats ?? {}).some(
      ([kind, seats]) =>
        gameIsActive(view, kind as GameKind) && seats.includes(id),
    )
  ) {
    return true;
  }
  return view.invites.some(
    (invite) => invite.status === 'waiting' && invite.accepted.includes(id),
  );
};

/**
 * Friends who are free and can cover this game's reservation at the supplied
 * stake. Blackjack reserves four base bets; other games reserve one stake.
 */
export const eligibleGameFriends = (
  view: LoungeView,
  kind: GameKind,
  stake: number,
): LoungeView['players'] => {
  const requiredReservation = gameReservation(kind, stake);
  return view.players.filter(
    (player) =>
      player.id !== view.self &&
      !playerIsBusy(view, player.id) &&
      player.balance >= requiredReservation,
  );
};

const waitingInvites = (view: LoungeView, kind: GameKind) =>
  view.invites.filter(
    (invite) => invite.game === kind && invite.status === 'waiting',
  );

/**
 * Resolve the visible hub state for one game. `eligibleFriends` and the
 * `canRequest` gate use the smallest supported stake (1,000); the request
 * dialog must recalculate eligibility for its selected stake.
 */
export const gameFlow = (view: LoungeView, kind: GameKind): GameFlow => {
  const match = gameMatch(view, kind);
  const table = view.tables?.[kind] ?? null;
  const seats = view.seats?.[kind] ?? [];
  const active = gameIsActive(view, kind);
  const ended = Boolean(match) && !active;
  const retained = Boolean(table?.members.length);
  const ownTable = Boolean(table?.members.includes(view.self));
  // Departed players keep settlement seats. Table membership determines whether
  // they can still play; snapshots from before tables existed use seat fallback.
  const ownsSeat = seats.includes(view.self) && (!table || ownTable);
  const selfOwnsGame = ownTable || ownsSeat;
  const pendingInvites = waitingInvites(view, kind);
  const incomingInvite = pendingInvites.find(
    (invite) =>
      invite.invited.includes(view.self) &&
      !invite.accepted.includes(view.self) &&
      !invite.declined.includes(view.self),
  );
  const acceptedInvite = pendingInvites.find((invite) =>
    invite.accepted.includes(view.self),
  );
  const outgoingInvite = pendingInvites.find(
    (invite) => invite.from === view.self,
  );
  const invite = incomingInvite ?? acceptedInvite ?? outgoingInvite ?? null;
  const required = table?.required ?? GAME_INFO[kind].players;
  const reservation = gameReservation(kind, 1000);
  const eligibleFriends = eligibleGameFriends(view, kind, 1000);
  const base = {
    kind,
    active,
    ended,
    retained,
    ownTable,
    ownSeat: ownsSeat,
    invite,
    table,
    seats,
    occupiedSeats: seats.filter(Boolean).length,
    required,
    readyCount: table?.ready.length ?? 0,
    reservation,
    eligibleFriends,
    canOpen: false,
    canRequest: false,
    canShowInvitations: false,
    disabledReason: '',
  } as const;

  if (active && selfOwnsGame) {
    return {
      ...base,
      status: 'resume',
      statusLabel: '진행 중',
      detail: '참가 중인 테이블이 있어요.',
      actionLabel: '이어하기',
      canOpen: true,
    };
  }
  if (active) {
    return {
      ...base,
      status: 'spectate',
      statusLabel: '진행 중',
      detail: '친구들이 게임을 하고 있어요.',
      actionLabel: '관전하기',
      canOpen: true,
    };
  }
  if (retained) {
    return selfOwnsGame
      ? {
          ...base,
          status: 'ready',
          statusLabel: '다음 판 준비',
          detail: '내 테이블 자리가 남아 있어요.',
          actionLabel: '테이블 열기',
          canOpen: true,
        }
      : {
          ...base,
          status: 'retained',
          statusLabel: '테이블 자리 유지 중',
          detail: '기존 테이블이 정리되기 전까지 새 초대를 보낼 수 없어요.',
          actionLabel: '테이블 보기',
          canOpen: true,
          disabledReason:
            '기존 테이블의 자리가 유지되고 있어 새 게임을 요청할 수 없어요.',
        };
  }
  if (incomingInvite) {
    return {
      ...base,
      status: 'invited',
      statusLabel: '초대 도착',
      detail: `${GAME_INFO[kind].name} 초대에 답할 수 있어요.`,
      actionLabel: '초대 확인',
      canShowInvitations: true,
      disabledReason: playerIsBusy(view, view.self)
        ? '참가 중인 게임이나 수락한 초대를 먼저 마쳐야 해요.'
        : '',
    };
  }
  if (acceptedInvite || outgoingInvite) {
    const waitingCount = invite?.accepted.length ?? 0;
    return {
      ...base,
      status: 'waiting',
      statusLabel: '친구 응답 대기',
      detail: `${waitingCount}/${invite?.required ?? required}명 수락`,
      actionLabel: '초대 현황 보기',
      canShowInvitations: true,
      disabledReason: '같은 게임의 초대 응답을 기다리고 있어요.',
    };
  }

  const minimumPlayers = kind === 'gostop' ? 3 : 2;
  const fundsOkay = view.wallet.balance >= reservation;
  const enoughFriends = eligibleFriends.length >= minimumPlayers - 1;
  let disabledReason = '';
  if (view.status !== 'connected') {
    disabledReason = '게임방에 연결된 뒤 초대할 수 있어요.';
  } else if (playerIsBusy(view, view.self)) {
    disabledReason =
      '다른 게임이나 수락한 초대가 끝난 뒤 새 초대를 보낼 수 있어요.';
  } else if (pendingInvites.length) {
    disabledReason = '이 게임은 다른 친구들의 참가 응답을 기다리고 있어요.';
  } else if (!fundsOkay) {
    disabledReason = `최소 예약금 ${reservation.toLocaleString('ko-KR')}범이 필요해요.`;
  } else if (!enoughFriends) {
    disabledReason = `예약금이 있는 친구 ${minimumPlayers - 1}명이 필요해요.`;
  }
  const canRequest = !disabledReason;
  return {
    ...base,
    status: canRequest ? 'available' : 'blocked',
    statusLabel: canRequest ? '새 게임 가능' : '지금은 요청할 수 없어요',
    detail: canRequest
      ? `${eligibleFriends.length}명의 친구가 최소 예약금 조건을 충족해요.`
      : disabledReason,
    actionLabel: canRequest ? '친구 초대' : '',
    canRequest,
    disabledReason,
  };
};

export { GAME_KINDS };
