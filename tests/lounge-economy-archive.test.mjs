import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_BEOM,
  LEDGER_HOT_GAMES,
  claimDailyGrant,
  compactLedger,
  dailyGrantInfo,
  grantBeom,
  kstDay,
  newLoungeLedger,
  nextKstMidnight,
  registerWallet,
  reserveGame,
  settleGame,
  spendBeom,
  validateLedger,
} from '../app/lounge-economy.ts';
import { LoungeBank } from '../app/lounge-wallet.ts';
import {
  CloudError,
  cloudTransition,
  commandHash,
} from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

const wallet = (n) => 'wallet-' + String(n).padStart(24, 'w');
const A = wallet(1),
  B = wallet(2);
const base = () => registerWallet(registerWallet(newLoungeLedger(), A), B);
const total = (l) =>
  Object.values(l.accounts).reduce((a, b) => a + b, 0) + (l.houseBalance ?? 0) - (l.granted ?? 0);

test('archiving keeps reserved games and the newest settled ones without breaking totals', () => {
  let l = base();
  const pending = 'pending-game';
  l = reserveGame(l, pending, 'chess', [A, B], [1000, 1000]);
  let net = 0;
  for (let i = 0; i < LEDGER_HOT_GAMES + 120; i++) {
    const id = `g${i}`;
    if (i % 10 === 0) {
      l = reserveGame(l, id, 'blackjack', [A, B], [4000, 4000]);
      l = settleGame(l, id, [1000, -500]);
      net -= 500;
    } else {
      l = reserveGame(l, id, 'chess', [A, B], [1000, 1000]);
      l = settleGame(l, id, i % 2 ? [1000, -1000] : [-1000, 1000]);
    }
  }
  validateLedger(l);
  const finished = Object.values(l.games).filter((g) => g.state !== 'reserved');
  assert.equal(finished.length, LEDGER_HOT_GAMES);
  assert.equal(l.games[pending].state, 'reserved');
  assert.equal(l.archive.games, 120);
  assert.equal(l.games.g0, undefined);
  assert.ok(l.games[`g${LEDGER_HOT_GAMES + 119}`]);
  assert.equal(l.houseBalance, net);
  assert.equal(total(l) + 2000, 2 * INITIAL_BEOM);
  // Per-account counters cover every archived round.
  assert.equal(l.archive.accounts[A].games, 120);
  assert.equal(
    l.archive.accounts[A].net + l.archive.accounts[B].net,
    -l.archive.houseNet,
  );
  // Compaction is idempotent and cheap when nothing needs moving.
  assert.equal(compactLedger(l), l);
});

test('legacy ledgers with more than 10,000 games still validate and compact', () => {
  let l = base();
  for (let i = 0; i < 10_050; i++)
    l.games[`legacy${i}`] = {
      game: 'chess',
      wallets: [A, B],
      deposits: [1000, 1000],
      state: 'void',
      result: [0, 0],
    };
  validateLedger(l);
  l = compactLedger(l);
  validateLedger(l);
  assert.equal(Object.keys(l.games).length, LEDGER_HOT_GAMES);
});

test('grant and spend entries keep the invariant; tampering is rejected', () => {
  let l = grantBeom(base(), A, 2500, 'bonus-1', 1, 'event');
  assert.equal(l.accounts[A], INITIAL_BEOM + 2500);
  assert.equal(l.granted, 2500);
  l = spendBeom(l, A, 700, 'shop-1', 2, 'hat');
  assert.equal(l.accounts[A], INITIAL_BEOM + 1800);
  assert.equal(l.houseBalance, 700);
  assert.deepEqual(
    l.entries.map((e) => e.type),
    ['grant', 'spend'],
  );
  assert.throws(() => grantBeom(l, A, 1, 'bonus-1', 3));
  assert.throws(() => spendBeom(l, B, INITIAL_BEOM + 1, 'shop-2', 3));
  const forged = structuredClone(l);
  forged.accounts[A] += 1;
  assert.throws(() => validateLedger(forged));
  const hidden = structuredClone(l);
  hidden.granted = 0;
  assert.throws(() => validateLedger(hidden));
});

test('daily grant: once per KST day, 3,000 normally, top-up to 10,000 when low', () => {
  const beforeMidnight = Date.UTC(2026, 8, 24, 14, 59, 59); // 23:59:59 KST
  const afterMidnight = beforeMidnight + 1000; // 00:00:00 KST next day
  assert.equal(kstDay(afterMidnight), kstDay(beforeMidnight) + 1);
  assert.equal(nextKstMidnight(beforeMidnight), afterMidnight);
  let l = base();
  assert.deepEqual(dailyGrantInfo(l, A, beforeMidnight), {
    available: true,
    amount: 3000,
    nextAt: beforeMidnight,
  });
  l = claimDailyGrant(l, A, beforeMidnight);
  assert.equal(l.accounts[A], INITIAL_BEOM + 3000);
  assert.throws(() => claimDailyGrant(l, A, beforeMidnight), /이미 받았어요/);
  assert.equal(dailyGrantInfo(l, A, beforeMidnight).nextAt, afterMidnight);
  l = claimDailyGrant(l, A, afterMidnight);
  assert.equal(l.accounts[A], INITIAL_BEOM + 6000);
  // Bankruptcy relief counts only the available balance (not reservations).
  l = reserveGame(l, 'big', 'chess', [A, B], [INITIAL_BEOM + 3000, 1000]);
  assert.equal(l.accounts[A], 3000);
  const relief = dailyGrantInfo(l, A, afterMidnight + 86_400_000);
  assert.equal(relief.amount, 7000);
  l = claimDailyGrant(l, A, afterMidnight + 86_400_000);
  assert.equal(l.accounts[A], 10_000);
  validateLedger(l);
  // Wallet views expose the daily state.
  const bank = new LoungeBank(null);
  bank.commit(l);
  assert.equal(bank.view(A, afterMidnight + 86_400_000).daily.available, false);
  assert.equal(bank.view(B, afterMidnight).daily.available, true);
});

// ---- Cloud engine ----
const member = (actor) => ({
  id: crypto.randomUUID(),
  actor,
  username: ACCOUNT_IDS[actor],
  connection: crypto.randomUUID(),
  sequence: 0,
  epoch: 0,
  code: '',
});
function harness() {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    now = Date.UTC(2026, 8, 24, 3);
  return {
    get world() {
      return world;
    },
    set world(w) {
      world = w;
    },
    advance(ms) {
      now += ms;
    },
    async run(p, op, extra = {}) {
      const c = {
          op,
          connection: p.connection,
          code: p.code,
          ...(!['read', 'wallet'].includes(op)
            ? { requestId: crypto.randomUUID(), sequence: ++p.sequence }
            : {}),
          ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
          ...extra,
        },
        r = cloudTransition(world, p, c, await commandHash(c), now);
      world = r.state;
      p.epoch = r.response.epoch;
      if (r.response.code) p.code = r.response.code;
      validateLedger(world.ledger);
      return r;
    },
  };
}
async function chessRoom(h) {
  const a = member(0),
    b = member(1);
  await h.run(a, 'open');
  b.code = a.code;
  await h.run(b, 'join');
  const r = await h.run(a, 'action', {
    action: { kind: 'invite', game: 'chess', players: [b.id], stake: 1000 },
  });
  await h.run(b, 'action', {
    action: { kind: 'reply', id: r.response.packet.invites[0].id, accept: true },
  });
  return { a, b, game: h.world.rooms[a.code].snapshot.chess.id };
}

test('cloud: blackjack cannot be voided by everyone leaving after the dealer reveal', async () => {
  const h = harness(),
    a = member(0),
    b = member(1);
  await h.run(a, 'open');
  b.code = a.code;
  await h.run(b, 'join');
  let r = await h.run(a, 'action', {
    action: { kind: 'invite', game: 'blackjack', players: [b.id], stake: 1000, required: 2 },
  });
  r = await h.run(b, 'action', {
    action: { kind: 'reply', id: r.response.packet.invites[0].id, accept: true },
  });
  let g = r.response.packet.blackjack;
  while (g.phase === 'players') {
    const p = g.turn === 0 ? a : b;
    r = await h.run(p, 'action', {
      action: { kind: 'blackjack', id: g.id, revision: g.revision, action: { kind: 'stand' } },
    });
    g = r.response.packet.blackjack;
  }
  h.advance(1200);
  await h.run(a, 'read');
  await h.run(a, 'leave');
  await h.run(b, 'leave');
  assert.equal(h.world.ledger.games[g.id].state, 'settled');
});

test('cloud: specific rejection reasons reach the response', async () => {
  const h = harness(),
    a = member(0);
  await h.run(a, 'open');
  await h.run(a, 'action', { action: { kind: 'chat', text: 'hi' } });
  const again = await h.run(a, 'action', { action: { kind: 'chat', text: 'hi' } });
  assert.equal(again.response.ok, false);
  assert.equal(again.response.error, '채팅은 잠시 후에 다시 보내 주세요.');
});

test('cloud: a non-string room code is a 400, not a crash', async () => {
  const h = harness(),
    a = member(0);
  await assert.rejects(
    h.run(a, 'read', { code: { toString: 1 } }),
    (e) => e instanceof CloudError && e.status === 400,
  );
});

test('cloud: a failing room is isolated, refunded and dropped while others keep working', async () => {
  const h = harness();
  const broken = await chessRoom(h);
  const healthy = await chessRoom(h);
  const w = structuredClone(h.world);
  w.rooms[broken.a.code].snapshot.players = null;
  h.world = w;
  const original = console.error;
  console.error = () => {};
  try {
    const read = await h.run(healthy.a, 'read');
    assert.equal(read.response.ok, true);
  } finally {
    console.error = original;
  }
  assert.equal(h.world.rooms[broken.a.code], undefined);
  assert.equal(h.world.ledger.games[broken.game].state, 'void');
  assert.equal(h.world.ledger.games[healthy.game].state, 'reserved');
});

test('cloud: daily grant works in a room and from the wallet outside one', async () => {
  const h = harness(),
    a = member(0),
    b = member(1);
  await h.run(a, 'open');
  const first = await h.run(a, 'action', { action: { kind: 'daily' } });
  assert.equal(first.response.ok, true);
  assert.equal(first.response.wallet.balance, INITIAL_BEOM + 3000);
  assert.equal(first.response.wallet.daily.available, false);
  const second = await h.run(a, 'action', { action: { kind: 'daily' } });
  assert.equal(second.response.ok, false);
  // Outside any room.
  await h.run(b, 'wallet');
  const outside = await h.run(b, 'action', { action: { kind: 'daily' } });
  assert.equal(outside.response.ok, true);
  assert.equal(outside.response.wallet.balance, INITIAL_BEOM + 3000);
});
