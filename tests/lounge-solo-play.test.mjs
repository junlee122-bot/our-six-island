// 혼자 하기 (playtest A-3): with nobody else online, blackjack can be played
// alone against the dealer (real 범, the usual escrow and house edge), and
// chess / go-stop have a 연습 판 against the practice AI with nothing staked.
// Everything runs through the server-authoritative cloud engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { LoungeRoom, REJECT } from '../app/lounge-room.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { goPracticeAction } from '../app/lounge-gostop.ts';
import { chessPracticeMove } from '../app/lounge-chess.ts';
import { isPracticeAi, tableIdOf } from '../app/lounge-games.ts';
import { defaultLook } from '../app/lounge-look.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

const uuid = () => crypto.randomUUID();
const member = (actor) => ({
  id: uuid(),
  actor,
  username: ACCOUNT_IDS[actor],
  connection: uuid(),
  sequence: 0,
  epoch: 0,
  code: '',
});

function harness() {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    // Tuesday noon KST: no weekly casino-night bonus in play.
    now = Date.UTC(2026, 5, 9, 3);
  const total = (w) =>
    Object.values(w.ledger.accounts).reduce((a, b) => a + b, 0) +
    Object.values(w.ledger.games)
      .filter((g) => g.state === 'reserved')
      .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0) +
    (w.ledger.houseBalance ?? 0) -
    (w.ledger.granted ?? 0) +
    (w.ledger.spent ?? 0);
  return {
    get world() {
      return world;
    },
    total: () => total(world),
    async run(p, op, extra = {}) {
      const command = {
        op,
        connection: p.connection,
        code: p.code,
        ...(!['read', 'wallet'].includes(op)
          ? { requestId: uuid(), sequence: ++p.sequence }
          : {}),
        ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
        ...extra,
      };
      const result = cloudTransition(world, p, command, await commandHash(command), now);
      world = result.state;
      p.epoch = result.response.epoch;
      if (result.response.code) p.code = result.response.code;
      validateLedger(world.ledger);
      return result.response;
    },
    act(p, action) {
      return this.run(p, 'action', { action });
    },
    advance(ms) {
      now += ms;
    },
  };
}

const snapshot = (h, p) => h.world.rooms[p.code].snapshot;

async function alone(area) {
  const h = harness(),
    a = member(3);
  await h.run(a, 'open');
  assert.equal((await h.act(a, { kind: 'area', area })).ok, true);
  return { h, a };
}

test('blackjack alone: one seat vs the dealer, reserved and settled like any table', async () => {
  const { h, a } = await alone('casino');
  const before = await h.run(a, 'read');
  const start = before.packet.wallet.balance,
    invariant = h.total();
  const sat = await h.act(a, {
    kind: 'invite',
    game: 'blackjack',
    players: [],
    stake: 1000,
    required: 1,
    table: tableIdOf('blackjack'),
  });
  assert.equal(sat.ok, true, sat.error);
  // Full as I sit: the round starts at once and holds the usual 4× reservation.
  assert.deepEqual(sat.packet.seats.blackjack, [a.id]);
  assert.equal(sat.packet.blackjack.hands.length, 1);
  assert.equal(sat.packet.wallet.held, 4000);
  assert.equal(sat.packet.tables.blackjack.required, 1);
  assert.equal(h.total(), invariant);
  let bj = sat.packet.blackjack;
  for (let i = 0; i < 40 && bj.phase !== 'over'; i++) {
    let r;
    if (bj.legal.enabled)
      r = await h.act(a, {
        kind: 'blackjack',
        id: bj.id,
        revision: bj.revision,
        action: { kind: 'stand' },
      });
    else {
      h.advance(1500);
      r = await h.run(a, 'read');
    }
    bj = r.packet.blackjack;
  }
  assert.equal(bj.phase, 'over');
  const after = await h.run(a, 'read');
  assert.equal(after.packet.wallet.held, 0);
  assert.equal(after.packet.wallet.balance, start + bj.result[0]);
  const escrow = h.world.ledger.games[bj.id];
  assert.equal(escrow?.state, 'settled');
  assert.deepEqual(escrow.wallets, ['wallet-' + a.id]);
  assert.equal(h.total(), invariant);
  // Ready for the next hand: a one-seat table starts again right away.
  const again = await h.act(a, { kind: 'ready', game: 'blackjack', id: bj.id, ready: true });
  assert.equal(again.ok, true, again.error);
  assert.notEqual(again.packet.blackjack.id, bj.id);
  assert.equal(again.packet.tables.blackjack.round, 2);
  assert.equal(h.total(), invariant);
});

test('only blackjack seats one; the other stake games still need friends', async () => {
  const { h, a } = await alone('casino');
  for (const game of ['poker']) {
    const r = await h.act(a, {
      kind: 'invite',
      game,
      players: [],
      stake: 1000,
      required: 1,
      table: tableIdOf(game),
    });
    assert.equal(r.ok, false);
    assert.equal(r.error, REJECT.stake);
  }
  await h.act(a, { kind: 'area', area: 'lounge' });
  const seotda = await h.act(a, {
    kind: 'invite',
    game: 'seotda',
    players: [],
    stake: 1000,
    required: 1,
    table: tableIdOf('seotda'),
  });
  assert.equal(seotda.error, REJECT.stake);
  // Practice is only for chess and go-stop.
  const practice = await h.act(a, {
    kind: 'invite',
    game: 'seotda',
    players: [],
    table: tableIdOf('seotda'),
    practice: true,
  });
  assert.equal(practice.error, REJECT.invalid);
  assert.deepEqual(Object.keys(h.world.ledger.games), []);
});

test('go-stop 연습 판: me and two practice AIs, played to the end with no 범 moving', async () => {
  const { h, a } = await alone('lounge');
  const start = (await h.run(a, 'read')).packet.wallet.balance,
    invariant = h.total();
  const staked = await h.act(a, {
    kind: 'invite',
    game: 'gostop',
    players: [],
    stake: 10000,
    table: tableIdOf('gostop'),
    practice: true,
  });
  assert.equal(staked.error, REJECT.stake);
  const sat = await h.act(a, {
    kind: 'invite',
    game: 'gostop',
    players: [],
    table: tableIdOf('gostop'),
    practice: true,
  });
  assert.equal(sat.ok, true, sat.error);
  const seats = sat.packet.seats.gostop;
  assert.equal(seats[0], a.id);
  assert.equal(seats.filter(isPracticeAi).length, 2);
  assert.deepEqual(sat.packet.names.gostop.slice(1), ['매화', '루미']);
  assert.equal(sat.packet.tables.gostop.practice, true);
  assert.equal(sat.packet.wallet.held, 0);
  let g = sat.packet.gostop;
  for (let i = 0; i < 400 && g.phase !== 'over'; i++) {
    let r;
    if (g.turn === 0)
      r = await h.act(a, {
        kind: 'gostop',
        id: g.id,
        ply: g.ply,
        action: goPracticeAction(g),
      });
    else {
      h.advance(1300);
      r = await h.run(a, 'read');
    }
    assert.equal(r.ok, true, r.error);
    g = r.packet.gostop;
  }
  assert.equal(g.phase, 'over');
  const after = await h.run(a, 'read');
  assert.equal(after.packet.wallet.balance, start);
  assert.equal(after.packet.wallet.held, 0);
  assert.deepEqual(Object.keys(h.world.ledger.games), []);
  assert.equal(h.total(), invariant);
  // 한 판 더: the practice table deals again, still practice.
  const again = await h.act(a, { kind: 'ready', game: 'gostop', id: g.id, ready: true });
  assert.equal(again.ok, true, again.error);
  assert.notEqual(again.packet.gostop.id, g.id);
  assert.equal(again.packet.tables.gostop.practice, true);
  assert.deepEqual(Object.keys(h.world.ledger.games), []);
});

test('chess 연습 판: the practice AI answers my moves on the server clock', async () => {
  const { h, a } = await alone('casino');
  const start = (await h.run(a, 'read')).packet.wallet.balance;
  const sat = await h.act(a, {
    kind: 'invite',
    game: 'chess',
    players: [],
    table: tableIdOf('chess'),
    practice: true,
  });
  assert.equal(sat.ok, true, sat.error);
  assert.equal(sat.packet.seats.chess[0], a.id);
  assert.ok(isPracticeAi(sat.packet.seats.chess[1]));
  assert.deepEqual(sat.packet.names.chess, [sat.packet.names.chess[0], '루미']);
  let c = sat.packet.chess;
  for (let ply = 0; ply < 6 && !c.winner; ply += 2) {
    const m = chessPracticeMove(c);
    const moved = await h.act(a, {
      kind: 'chess',
      id: c.id,
      ply: c.moves.length,
      from: m.slice(0, 2),
      to: m.slice(2, 4),
    });
    assert.equal(moved.ok, true, moved.error);
    // The answer is due shortly; the next poll after it sees the AI's move.
    assert.ok(moved.nextDue && moved.nextDue - moved.serverNow <= 1000);
    h.advance(1000);
    c = (await h.run(a, 'read')).packet.chess;
    assert.equal(c.moves.length, ply + 2);
  }
  const resigned = await h.act(a, { kind: 'resign', id: c.id });
  assert.equal(resigned.ok, true);
  assert.equal(resigned.packet.chess.winner, 'b');
  assert.equal(resigned.packet.wallet.balance, start);
  assert.deepEqual(Object.keys(h.world.ledger.games), []);
});

test('leaving mid-practice lets the AI finish; nothing is refunded or charged', async () => {
  const { h, a } = await alone('lounge');
  await h.act(a, {
    kind: 'invite',
    game: 'gostop',
    players: [],
    table: tableIdOf('gostop'),
    practice: true,
  });
  assert.equal((await h.run(a, 'leave')).ok, true);
  assert.deepEqual(h.world.rooms, {});
  assert.deepEqual(Object.keys(h.world.ledger.games), []);
});

test('practice needs the server clock (peer rooms refuse it)', () => {
  const id = uuid();
  const room = new LoungeRoom();
  // A peer-mode room is never connected in tests; the action is refused before anything runs.
  assert.equal(room.action({ kind: 'invite', game: 'chess', players: [], table: 'casino-chess', practice: true }), false);
  const hosted = LoungeRoom.hosted(null, newLoungeLedger(), 'PRACTICEAA', id);
  hosted.hostedJoin(id, 0, defaultLook(0));
  hosted.hostedAttempt(id, { kind: 'area', area: 'casino' });
  assert.equal(
    hosted.hostedAttempt(id, {
      kind: 'invite',
      game: 'chess',
      players: [],
      table: 'casino-chess',
      practice: 'yes',
    }),
    REJECT.invalid,
  );
});
