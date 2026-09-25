import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newBlackjack,
  blackjackValue,
  blackjackLegal,
  blackjackAction,
  blackjackDeal,
  blackjackView,
} from '../app/lounge-blackjack.ts';
import {
  newLoungeLedger,
  registerWallet,
  reserveGame,
  settleGame,
  voidGame,
  validateLedger,
  readLoungeLedger,
} from '../app/lounge-economy.ts';
import { LoungeRoom } from '../app/lounge-room.ts';
import { defaultLook } from '../app/lounge-look.ts';
function shoe(ranks) {
  const deck = Array.from({ length: 312 }, (_, i) => i),
    top = [];
  for (const rank of ranks.split(' ')) {
    const at = deck.findIndex((c) => c % 13 === '23456789TJQKA'.indexOf(rank));
    top.push(...deck.splice(at, 1));
  }
  return [...top, ...deck];
}
function finish(g) {
  for (let step = 0; g.phase !== 'over' && step < 100; step++)
    g =
      g.phase === 'players'
        ? blackjackAction(g, g.turn, { kind: 'stand' })
        : blackjackDeal(g);
  assert.equal(g.phase, 'over');
  return g;
}
test('aces downgrade correctly and distinguish hard and soft totals', () => {
  assert.deepEqual(blackjackValue([12, 25, 3]), {
    total: 17,
    soft: true,
    bust: false,
  });
  assert.deepEqual(blackjackValue([12, 4, 8]), {
    total: 17,
    soft: false,
    bust: false,
  });
  assert.deepEqual(blackjackValue([8, 9, 0]), {
    total: 22,
    soft: false,
    bust: true,
  });
});
test('natural pays 3:2 and dealer soft 17 stands', () => {
  const g = finish(newBlackjack('natural', 2, 1000, shoe('A T A K 8 6')));
  assert.deepEqual(g.result, [1500, 1000]);
  assert.equal(g.dealer.length, 2);
});
test('dealer peeks before doubles and both naturals push', () => {
  const g = newBlackjack('peek', 2, 1000, shoe('A T A K 8 K'));
  assert.equal(g.phase, 'reveal');
  assert.equal(blackjackAction(g, 0, { kind: 'double' }), null);
  assert.deepEqual(finish(g).result, [0, -1000]);
});
test('player natural outranks dealer three-card 21', () => {
  const g = finish(newBlackjack('twenty-one', 2, 1000, shoe('A T 6 K 8 T 5')));
  assert.deepEqual(g.result, [1500, -1000]);
  assert.equal(g.dealer.length, 3);
});
test('split, double both hands, and settle all four bets', () => {
  let g = newBlackjack('split', 2, 1000, shoe('8 T 6 8 7 T 3 2 9 T 5'));
  g = blackjackAction(g, 0, { kind: 'split' });
  assert.equal(g.hands[0].length, 2);
  assert.equal(blackjackLegal(g, 0).split, false);
  g = blackjackAction(g, 0, { kind: 'double' });
  assert.equal(g.hand, 1);
  g = blackjackAction(g, 0, { kind: 'double' });
  assert.equal(g.turn, 1);
  g = finish(g);
  assert.deepEqual(g.result, [-4000, -1000]);
});
test('split aces receive one card and split 21 is not a natural', () => {
  let g = newBlackjack('aces', 2, 1000, shoe('A T 9 A 8 8 T 9'));
  g = blackjackAction(g, 0, { kind: 'split' });
  assert.equal(g.turn, 1);
  assert.deepEqual(
    g.hands[0].map((h) => h.status),
    ['stood', 'stood'],
  );
  assert.equal(blackjackAction(g, 0, { kind: 'double' }), null);
  assert.deepEqual(finish(g).result, [2000, 1000]);
});
test('bust loses even when dealer later busts', () => {
  let g = newBlackjack('bust', 2, 1000, shoe('T T 6 8 9 T K K'));
  g = blackjackAction(g, 0, { kind: 'hit' });
  g = finish(g);
  assert.deepEqual(g.result, [-1000, 1000]);
});
test('public views omit dealer hole, deck and their values until reveal', () => {
  const g = newBlackjack('privacy', 2, 1000, shoe('8 T 6 8 9 T'));
  for (const seat of [-1, 0, 1, 7]) {
    const view = blackjackView(g, seat);
    assert.equal('deck' in view, false);
    assert.deepEqual(view.dealer, [g.dealer[0], null]);
    assert.equal(view.legal.enabled, seat === 0);
  }
  const before = structuredClone(g);
  for (const a of [null, {}, { kind: 'hack' }, { kind: ['hit'] }])
    assert.equal(blackjackAction(g, 0, a), null);
  for (const seat of [-1, 1, 8, NaN, '0', 0.5])
    assert.equal(blackjackAction(g, seat, { kind: 'hit' }), null);
  assert.deepEqual(g, before);
  assert.throws(() => newBlackjack('bad', 1, 1000));
  assert.throws(() => newBlackjack('odd', 2, 1001));
});
test('600 seeded games conserve 312 cards, terminate, and stay within reserved stakes', () => {
  let seed = 7103;
  const rand = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32;
  for (let round = 0; round < 600; round++) {
    const deck = Array.from({ length: 312 }, (_, i) => i);
    for (let i = 311; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    let g = newBlackjack('seed' + round, 2 + (round % 6), 1000, deck),
      steps = 0;
    while (g.phase !== 'over') {
      const cards = [
        ...g.deck,
        ...g.dealer,
        ...g.hands.flatMap((hs) => hs.flatMap((h) => h.cards)),
      ];
      assert.equal(cards.length, 312);
      assert.equal(new Set(cards).size, 312);
      if (g.phase === 'players') {
        const legal = blackjackLegal(g, g.turn),
          options = ['hit', 'stand', 'double', 'split'].filter((k) => legal[k]);
        g = blackjackAction(g, g.turn, {
          kind: options[Math.floor(rand() * options.length)],
        });
      } else g = blackjackDeal(g);
      assert(++steps < 160);
    }
    assert(
      g.result.every((n) => Number.isSafeInteger(n) && n >= -4000 && n <= 4000),
    );
    g.hands.forEach((hs, i) =>
      assert.equal(
        g.result[i],
        hs.reduce((sum, h) => sum + h.result, 0),
      ),
    );
    assert(blackjackView(g, -1).dealer.every((c) => c !== null));
  }
});
test('casino net balances player winnings without reminting legacy wallets', () => {
  const ws = ['a', 'b'].map((s) => 'wallet-' + s.repeat(24));
  let l = ws.reduce(registerWallet, newLoungeLedger());
  delete l.houseBalance;
  l = readLoungeLedger(JSON.stringify(l));
  l = reserveGame(l, 'bj', 'blackjack', ws, [4000, 4000]);
  assert.deepEqual(Object.values(l.accounts), [96000, 96000]);
  l = settleGame(l, 'bj', [1500, -1000]);
  assert.deepEqual(Object.values(l.accounts), [101500, 99000]);
  assert.equal(l.houseBalance, -500);
  assert.equal(settleGame(l, 'bj', [1500, -1000]), l);
  assert.throws(() => settleGame(l, 'bj', [0, 0]));
  assert.throws(() => voidGame(l, 'bj'));
  const damaged = structuredClone(l);
  damaged.houseBalance = 0;
  assert.throws(() => validateLedger(damaged));
  const lost = structuredClone(l);
  delete lost.houseBalance;
  assert.throws(() => validateLedger(lost));
  l = reserveGame(l, 'chess-after', 'chess', ws, [1000, 1000]);
  assert.throws(() => settleGame(l, 'chess-after', [1000, 0]));
  l = settleGame(l, 'chess-after', [1000, -1000]);
  l = reserveGame(l, 'cancelled', 'blackjack', ws, [4000, 4000]);
  const before = l.houseBalance;
  l = voidGame(l, 'cancelled');
  assert.equal(l.houseBalance, before);
  validateLedger(l);
  assert.equal(
    Object.values(l.accounts).reduce((a, b) => a + b, 0) + l.houseBalance,
    200000,
  );
});
function roomHost() {
  const r = new LoungeRoom();
  r.view = {
    ...r.view,
    status: 'connected',
    role: 'host',
    self: 'p0',
    code: 'ABCDEFGHJK',
  };
  for (let i = 0; i < 7; i++) {
    const wallet = 'wallet-' + String(i).repeat(24);
    r.wallets.set('p' + i, wallet);
    r.bank.commit(registerWallet(r.bank.ledger, wallet));
    r.members.set('p' + i, {
      id: 'p' + i,
      actor: i,
      look: defaultLook(i),
      x: 50,
      y: 70,
      emote: '',
      emoteAt: 0,
      balance: 100000,
      area: 'casino',
    });
  }
  r.sync();
  return r;
}
test('room reserves max four stakes and rejects stale/observer actions, leaving auto-stands', (t) => {
  // Fake timers: the room's auto-stand and dealer timers are driven by hand,
  // so the test never races real time under parallel `npm test` load.
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const r = roomHost();
  try {
    assert(
      r.apply('p0', {
        kind: 'invite',
        game: 'blackjack',
        players: ['p1'],
        stake: 1000,
        required: 2,
      }),
    );
    assert(
      r.apply('p1', { kind: 'reply', id: r.view.invites[0].id, accept: true }),
    );
    const id = r.blackjack.id;
    // The random launch deal can open on a dealer natural ('reveal'), which
    // arms a dealer timer for that deal (same id, revision 0). Drop it before
    // swapping in the fixed shoe, or it would fire as a dealer step on the new
    // players' phase and swallow the away auto-stand (the old ~10% flake).
    clearTimeout(r.blackjackTimer);
    r.blackjackTimer = null;
    r.blackjack = newBlackjack(id, 2, 1000, shoe('8 T 6 8 9 T 8'));
    r.sync();
    assert.equal(r.view.wallet.held, 4000);
    assert.equal(r.view.wallet.balance, 96000);
    const bad = { kind: 'blackjack', id, revision: 1, action: { kind: 'hit' } };
    assert.equal(r.apply('p0', bad), false);
    assert.equal(r.apply('p2', { ...bad, revision: 0 }), false);
    assert(r.apply('p0', { kind: 'stand', game: 'blackjack' }));
    // Leaving seat 0 stands it after the short away delay, not before.
    t.mock.timers.tick(100);
    assert.equal(r.blackjack.turn, 0);
    for (let i = 0; i < 20 && r.blackjack.turn === 0; i++)
      t.mock.timers.tick(100);
    assert.equal(r.blackjack.turn, 1);
    assert.equal(r.blackjack.hands[0][0].status, 'stood');
    assert.equal(r.view.seats.blackjack[0], 'p0');
    assert(
      r.apply('p1', {
        kind: 'blackjack',
        id,
        revision: r.blackjack.revision,
        action: { kind: 'stand' },
      }),
    );
    // Dealer steps run on the room timer: reveal, then stand/hit until over.
    for (let i = 0; i < 100 && r.blackjack.phase !== 'over'; i++)
      t.mock.timers.tick(100);
    assert.equal(r.blackjack.phase, 'over');
    assert.equal(r.bank.ledger.games[id].state, 'settled');
    assert.equal(r.view.wallet.held, 0);
    validateLedger(r.bank.ledger);
    const before = JSON.stringify(r.bank.ledger);
    r.settle('blackjack', r.blackjack);
    assert.equal(JSON.stringify(r.bank.ledger), before);
  } finally {
    r.leave();
    t.mock.timers.reset();
  }
});
test('storage failure before launch leaves request and game unchanged', () => {
  const r = roomHost();
  try {
    assert(
      r.apply('p0', {
        kind: 'invite',
        game: 'blackjack',
        players: ['p1'],
        stake: 1000,
        required: 2,
      }),
    );
    const before = JSON.stringify(r.bank.ledger),
      request = r.view.invites[0];
    r.bank.commit = () => {
      throw new Error('disk full');
    };
    assert.throws(
      () => r.apply('p1', { kind: 'reply', id: request.id, accept: true }),
      /disk full/,
    );
    assert.equal(r.blackjack, null);
    assert.equal(JSON.stringify(r.bank.ledger), before);
    assert.deepEqual(request.accepted, ['p0']);
  } finally {
    r.leave();
  }
});
