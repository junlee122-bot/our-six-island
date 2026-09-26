import test from 'node:test';
import assert from 'node:assert/strict';
import { LoungeRoom, GAME_KINDS } from '../app/lounge-room.ts';
import { registerWallet } from '../app/lounge-economy.ts';
import { defaultLook } from '../app/lounge-look.ts';

function host() {
  const room = new LoungeRoom();
  room.view = {
    ...room.view,
    status: 'connected',
    role: 'host',
    self: 'p0',
    code: 'ABCDEFGHJK',
  };
  for (let i = 0; i < 7; i++) {
    const id = `p${i}`;
    const wallet = `wallet-${String(i).repeat(24)}`;
    room.wallets.set(id, wallet);
    room.bank.commit(registerWallet(room.bank.ledger, wallet));
    room.members.set(id, {
      id,
      actor: i,
      look: defaultLook(i),
      x: 50,
      y: 70,
      emote: '',
      emoteAt: 0,
      balance: 100000,
      area: 'lounge',
    });
  }
  room.sync();
  return room;
}

const apply = (room, id, action) => room.apply(id, action);

function launch(room, game) {
  const required = game === 'chess' ? 2 : 3;
  const people = ['p0', 'p1', 'p2'].slice(0, required);
  assert.equal(
    apply(room, people[0], {
      kind: 'invite',
      game,
      players: people.slice(1),
      required,
      // 라이어 게임 is never staked.
      ...(game === 'liar' ? {} : { stake: 1000 }),
    }),
    true,
  );
  const invite = room.view.invites.find((item) => item.game === game);
  for (const id of people.slice(1))
    assert.equal(
      apply(room, id, { kind: 'reply', id: invite.id, accept: true }),
      true,
    );
  return { people, table: room.view.tables[game] };
}

function finish(room, game) {
  if (game === 'chess') room.chess = { ...room.chess, winner: 'white' };
  else if (game === 'gostop')
    room.go = { ...room.go, phase: 'over', winner: null };
  else if (game === 'poker')
    room.poker = { ...room.poker, phase: 'over', result: [0, 0, 0] };
  else if (game === 'blackjack')
    room.blackjack = { ...room.blackjack, phase: 'over', result: [0, 0, 0] };
  else if (game === 'yacht')
    room.yacht = { ...room.yacht, phase: 'over', turn: -1, result: [0, 0, 0] };
  else if (game === 'liar')
    room.liar = { ...room.liar, phase: 'over', turn: -1, winner: 'citizens' };
  else room.seotda = { ...room.seotda, phase: 'over', result: [0, 0, 0] };
}

for (const game of GAME_KINDS) {
  test(`${game} rematch starts once every original participant confirms`, () => {
    const room = host();
    const { people, table } = launch(room, game);
    assert.equal(table.round, 1);
    finish(room, game);

    assert.equal(
      apply(room, people[0], {
        kind: 'ready',
        game,
        id: table.matchId,
        ready: true,
      }),
      true,
    );
    assert.deepEqual(room.view.tables[game].ready, [people[0]]);
    assert.equal(
      apply(room, people[1], {
        kind: 'ready',
        game,
        id: table.matchId,
        ready: true,
      }),
      true,
    );
    if (people.length === 3) {
      assert.deepEqual(room.view.tables[game].ready, people.slice(0, 2));
      assert.equal(
        apply(room, people[2], {
          kind: 'ready',
          game,
          id: table.matchId,
          ready: true,
        }),
        true,
      );
    }

    const next = room.view.tables[game];
    assert.equal(next.round, 2);
    assert.notEqual(next.matchId, table.matchId);
    assert.deepEqual(next.members, people);
    assert.deepEqual(next.ready, []);
    assert.equal(room.view.seats[game].filter(Boolean).length, people.length);
    const ledgerAtNextRound = JSON.stringify(room.bank.ledger);
    assert.equal(
      apply(room, people[0], { kind: 'stand', game, id: table.matchId }),
      false,
    );
    assert.equal(room.view.tables[game].matchId, next.matchId);
    assert.equal(JSON.stringify(room.bank.ledger), ledgerAtNextRound);
    assert.equal(
      apply(room, people[0], {
        kind: 'ready',
        game,
        id: table.matchId,
        ready: true,
      }),
      false,
    );
  });
}

test('readiness is cancellable, restricted to table members and fixed rosters block replacement games', () => {
  const room = host();
  const { people, table } = launch(room, 'chess');
  finish(room, 'chess');
  assert.equal(
    apply(room, 'p6', {
      kind: 'ready',
      game: 'chess',
      id: table.matchId,
      ready: true,
    }),
    false,
  );
  assert.equal(
    apply(room, people[0], {
      kind: 'ready',
      game: 'chess',
      id: table.matchId,
      ready: true,
    }),
    true,
  );
  assert.equal(
    apply(room, people[0], {
      kind: 'ready',
      game: 'chess',
      id: table.matchId,
      ready: false,
    }),
    true,
  );
  assert.deepEqual(room.view.tables.chess.ready, []);
  assert.equal(
    apply(room, 'p6', {
      kind: 'invite',
      game: 'chess',
      players: ['p5'],
      required: 2,
    }),
    false,
  );
  assert.equal(apply(room, people[0], { kind: 'stand', game: 'chess' }), true);
  // A short finished table stays for its survivor (empty seats can be filled
  // by invite until the ready check runs out); the last stand dissolves it.
  assert.deepEqual(room.view.tables.chess.members, [people[1]]);
  assert.equal(apply(room, people[1], { kind: 'stand', game: 'chess' }), true);
  assert.equal(room.view.tables.chess, undefined);
});

test('reconnect snapshot retains a rematch table and legacy snapshots default to none', () => {
  const room = host();
  const { table } = launch(room, 'chess');
  finish(room, 'chess');
  assert.equal(
    apply(room, 'p0', {
      kind: 'ready',
      game: 'chess',
      id: table.matchId,
      ready: true,
    }),
    true,
  );
  assert.deepEqual(room.packet('p0').tables.chess.ready, ['p0']);
  const serverRoom = LoungeRoom.hosted(null, room.hostedLedger());
  Object.assign(serverRoom, {
    view: room.view,
    members: room.members,
    wallets: room.wallets,
    chess: room.chess,
    go: room.go,
    poker: room.poker,
    blackjack: room.blackjack,
    seotda: room.seotda,
  });
  const snapshot = serverRoom.hostedSnapshot();
  const restored = LoungeRoom.hosted(snapshot, room.hostedLedger());
  assert.deepEqual(restored.view.tables.chess.ready, ['p0']);
  assert.deepEqual(restored.view.tables.chess.members, ['p0', 'p1']);
  const { tables: _tables, ...legacy } = snapshot;
  const old = LoungeRoom.hosted(legacy, room.hostedLedger());
  assert.deepEqual(old.view.tables, {});
});

test('a failed rematch reservation leaves the ended match, round and ready flags intact', () => {
  const room = host();
  const { people, table } = launch(room, 'chess');
  finish(room, 'chess');
  assert.equal(
    apply(room, people[0], {
      kind: 'ready',
      game: 'chess',
      id: table.matchId,
      ready: true,
    }),
    true,
  );
  const beforeLedger = JSON.stringify(room.bank.ledger);
  room.bank.storage = {
    getItem: () => room.bank.raw,
    setItem: () => {
      throw new Error('quota');
    },
  };
  assert.throws(
    () =>
      apply(room, people[1], {
        kind: 'ready',
        game: 'chess',
        id: table.matchId,
        ready: true,
      }),
    /quota/,
  );
  assert.equal(JSON.stringify(room.bank.ledger), beforeLedger);
  assert.equal(room.view.tables.chess.matchId, table.matchId);
  assert.equal(room.view.tables.chess.round, 1);
  assert.deepEqual(room.view.tables.chess.ready, ['p0']);
});
