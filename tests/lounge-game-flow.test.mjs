import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLoungeView } from '../app/lounge-room.ts';
import {
  eligibleGameFriends,
  gameFlow,
  gameIsActive,
  playerIsBusy,
} from '../app/lounge-game-flow.ts';

const player = (id, balance = 50_000) => ({ id, balance });
const connected = (overrides = {}) => ({
  ...emptyLoungeView(),
  status: 'connected',
  self: 'self',
  wallet: { balance: 50_000, held: 0, history: [] },
  players: [
    player('self'),
    player('friend-1'),
    player('friend-2'),
    player('friend-3'),
  ],
  ...overrides,
});
const table = (members, required = 2, ready = []) => ({
  matchId: 'match-1',
  round: 1,
  stake: 1_000,
  required,
  members,
  ready,
});
const invite = (overrides = {}) => ({
  id: 'invite-1',
  game: 'chess',
  from: 'friend-1',
  invited: ['self'],
  accepted: [],
  declined: [],
  status: 'waiting',
  expires: 10_000,
  matchId: null,
  required: 2,
  stake: 1_000,
  ...overrides,
});

test('active state recognizes each of the five game shapes and ended matches', () => {
  const active = connected({
    chess: { winner: null },
    gostop: { phase: 'play' },
    poker: { phase: 'betting' },
    blackjack: { phase: 'players' },
    seotda: { phase: 'betting' },
  });
  for (const kind of ['chess', 'gostop', 'poker', 'blackjack', 'seotda']) {
    assert.equal(gameIsActive(active, kind), true, `${kind} should be active`);
  }
  const ended = connected({
    chess: { winner: 'self' },
    gostop: { phase: 'over' },
    poker: { phase: 'over' },
    blackjack: { phase: 'over' },
    seotda: { phase: 'over' },
  });
  for (const kind of ['chess', 'gostop', 'poker', 'blackjack', 'seotda']) {
    assert.equal(gameIsActive(ended, kind), false, `${kind} should be ended`);
  }
});

test('busy players include retained tables, active seats, and accepted waiting invites', () => {
  const view = connected({
    seats: { ...emptyLoungeView().seats, poker: ['seat-player', null, null] },
    poker: { phase: 'betting' },
    tables: { chess: table(['retained-player']) },
    invites: [invite({ accepted: ['accepted-player'] })],
  });
  assert.equal(playerIsBusy(view, 'retained-player'), true);
  assert.equal(playerIsBusy(view, 'seat-player'), true);
  assert.equal(playerIsBusy(view, 'accepted-player'), true);
  assert.equal(playerIsBusy(view, 'friend-1'), false);
  assert.equal(playerIsBusy(view, ''), false);

  const endedSeat = connected({
    seats: { ...emptyLoungeView().seats, poker: ['seat-player', null, null] },
    poker: { phase: 'over' },
  });
  assert.equal(playerIsBusy(endedSeat, 'seat-player'), false);
});

test('eligible friends must be free and funded for the game reservation', () => {
  const view = connected({
    players: [
      player('self', 50_000),
      player('short', 999),
      player('funded', 1_000),
      player('busy', 50_000),
      player('dealer-short', 3_999),
      player('dealer-funded', 4_000),
    ],
    seats: { ...emptyLoungeView().seats, chess: ['busy', null] },
    chess: { winner: null },
  });
  assert.deepEqual(
    eligibleGameFriends(view, 'chess', 1_000).map((entry) => entry.id),
    ['funded', 'dealer-short', 'dealer-funded'],
  );
  assert.deepEqual(
    eligibleGameFriends(view, 'blackjack', 1_000).map((entry) => entry.id),
    ['dealer-funded'],
  );
});

test('hub resumes own active games, opens other active games for spectating, and retains ended tables', () => {
  const activeOwn = connected({
    chess: { winner: null },
    seats: { ...emptyLoungeView().seats, chess: ['self', 'friend-1'] },
    tables: { chess: table(['self', 'friend-1']) },
  });
  const resume = gameFlow(activeOwn, 'chess');
  assert.equal(resume.status, 'resume');
  assert.equal(resume.canOpen, true);
  assert.equal(resume.actionLabel, '이어하기');
  assert.equal(resume.ownSeat, true);

  const activeOther = connected({
    blackjack: { phase: 'players' },
    seats: {
      ...emptyLoungeView().seats,
      blackjack: ['friend-1', 'friend-2', null],
    },
    tables: { blackjack: table(['friend-1', 'friend-2'], 2) },
  });
  const spectate = gameFlow(activeOther, 'blackjack');
  assert.equal(spectate.status, 'spectate');
  assert.equal(spectate.canOpen, true);
  assert.equal(spectate.canRequest, false);

  const ownEnded = connected({
    chess: { winner: 'friend-1' },
    seats: { ...emptyLoungeView().seats, chess: ['self', 'friend-1'] },
    tables: { chess: table(['self', 'friend-1'], 2, ['self']) },
  });
  const ready = gameFlow(ownEnded, 'chess');
  assert.equal(ready.status, 'ready');
  assert.equal(ready.canOpen, true);
  assert.equal(ready.readyCount, 1);

  const otherEnded = connected({
    chess: { winner: 'friend-1' },
    seats: { ...emptyLoungeView().seats, chess: ['friend-1', 'friend-2'] },
    tables: { chess: table(['friend-1', 'friend-2']) },
  });
  const retained = gameFlow(otherEnded, 'chess');
  assert.equal(retained.status, 'retained');
  assert.equal(retained.canOpen, true);
  assert.equal(retained.canRequest, false);
  assert.match(retained.disabledReason, /새 게임을 요청할 수 없어요/);
});

test('incoming, accepted, and outgoing waiting invitations never appear as new-game requests', () => {
  const invited = gameFlow(connected({ invites: [invite()] }), 'chess');
  assert.equal(invited.status, 'invited');
  assert.equal(invited.canShowInvitations, true);
  assert.equal(invited.canRequest, false);

  const accepted = gameFlow(
    connected({ invites: [invite({ accepted: ['self'] })] }),
    'chess',
  );
  assert.equal(accepted.status, 'waiting');
  assert.equal(accepted.canShowInvitations, true);
  assert.equal(accepted.canRequest, false);
  assert.match(accepted.detail, /1\/2명 수락/);

  const sent = gameFlow(
    connected({ invites: [invite({ from: 'self', invited: ['friend-1'] })] }),
    'chess',
  );
  assert.equal(sent.status, 'waiting');
  assert.equal(sent.canRequest, false);
});

test('availability uses the minimum stake and explains self-funding, friend-count, and busy blockers', () => {
  const minFunded = connected({
    wallet: { balance: 1_000, held: 0, history: [] },
    players: [player('self', 1_000), player('friend-1', 1_000)],
  });
  const available = gameFlow(minFunded, 'chess');
  assert.equal(available.status, 'available');
  assert.equal(available.reservation, 1_000);
  assert.equal(available.canRequest, true);
  assert.deepEqual(
    available.eligibleFriends.map((entry) => entry.id),
    ['friend-1'],
  );

  const noSelfFunds = gameFlow(
    connected({ wallet: { balance: 999, held: 0, history: [] } }),
    'chess',
  );
  assert.equal(noSelfFunds.status, 'blocked');
  assert.match(noSelfFunds.disabledReason, /최소 예약금/);

  const noFriendFunds = gameFlow(
    connected({ players: [player('self', 50_000), player('friend-1', 999)] }),
    'chess',
  );
  assert.equal(noFriendFunds.status, 'blocked');
  assert.match(noFriendFunds.disabledReason, /예약금이 있는 친구/);

  const selfBusy = gameFlow(
    connected({ tables: { poker: table(['self', 'friend-1']) } }),
    'chess',
  );
  assert.equal(selfBusy.status, 'blocked');
  assert.match(selfBusy.disabledReason, /다른 게임/);
});

test('two funded players can request every flexible-size game, but not three-player gostop', () => {
  const view = connected({
    wallet: { balance: 4_000, held: 0, history: [] },
    players: [player('self', 4_000), player('friend-1', 4_000)],
  });
  for (const kind of ['poker', 'blackjack', 'seotda']) {
    assert.equal(gameFlow(view, kind).canRequest, true, kind);
    assert.equal(gameFlow(view, kind).status, 'available', kind);
  }
  assert.equal(gameFlow(view, 'gostop').canRequest, false);
});

test('a waiting invitation reserves its game even for unrelated or declined players', () => {
  const request = invite({
    from: 'friend-1',
    invited: ['friend-2'],
    accepted: ['friend-1'],
  });
  const unrelated = gameFlow(connected({ invites: [request] }), 'chess');
  assert.equal(unrelated.status, 'blocked');
  assert.equal(unrelated.canRequest, false);
  assert.equal(unrelated.canShowInvitations, false);
  assert.match(unrelated.disabledReason, /참가 응답/);
  const declined = gameFlow(
    connected({
      invites: [
        { ...request, invited: ['friend-2', 'self'], declined: ['self'] },
      ],
    }),
    'chess',
  );
  assert.equal(declined.canRequest, false);
  assert.equal(declined.canShowInvitations, false);
  for (const status of ['cancelled', 'expired', 'started']) {
    assert.equal(
      gameFlow(connected({ invites: [{ ...request, status }] }), 'chess')
        .canRequest,
      true,
      status,
    );
  }
});
