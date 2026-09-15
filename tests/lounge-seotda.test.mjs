import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEOTDA_CARDS,
  newSeotda,
  seotdaAction,
  seotdaDeal,
  seotdaLegal,
  seotdaRank,
  seotdaView,
  resolveSeotda,
} from '../app/lounge-seotda.ts';
import {
  newLoungeLedger,
  registerWallet,
  reserveGame,
  settleGame,
  validateLedger,
  voidGame,
} from '../app/lounge-economy.ts';
import { LoungeRoom } from '../app/lounge-room.ts';
import { defaultLook } from '../app/lounge-look.ts';
const card = (n, v = 1) => `m${String(n).padStart(2, '0')}-0${v}`;
const hand = (a, b, va = 1, vb = 1) => [card(a, va), card(b, vb)];
const duel = (...hands) =>
  resolveSeotda(hands.map((cards, seat) => ({ seat, cards })));
function deck(hands, first = 0, count = hands.length) {
  const top = [];
  for (let j = 0; j < 2; j++)
    for (let n = 0; n < count; n++) {
      const h = hands[(first + n) % count];
      if (h?.length) top.push(h[j]);
    }
  assert.equal(new Set(top).size, top.length);
  return [...top, ...SEOTDA_CARDS.filter((c) => !top.includes(c))];
}
function checks(g) {
  while (g.phase === 'betting')
    g = seotdaAction(g, g.turn, {
      kind: seotdaLegal(g, g.turn).canCheck ? 'check' : 'call',
    });
  return g;
}
const sum = (ns) => ns.reduce((a, b) => a + b, 0);

test('all 190 two-card combinations rank symmetrically; only actual brights make gwangddaeng', () => {
  let total = 0;
  for (let a = 0; a < 20; a++)
    for (let b = a + 1; b < 20; b++) {
      const h = [SEOTDA_CARDS[a], SEOTDA_CARDS[b]],
        rank = seotdaRank(h);
      assert.deepEqual(rank, seotdaRank([...h].reverse()));
      assert(Number.isFinite(rank.value));
      total++;
    }
  assert.equal(total, 190);
  assert.equal(seotdaRank(hand(3, 8)).label, '38광땡');
  assert.equal(seotdaRank(hand(3, 8, 2, 1)).value, 1);
  assert.equal(seotdaRank(hand(1, 3)).label, '13광땡');
  assert.equal(seotdaRank(hand(1, 8)).label, '18광땡');
  const combos = [
    [1, 2, '알리'],
    [1, 4, '독사'],
    [1, 9, '구삥'],
    [1, 10, '장삥'],
    [4, 10, '장사'],
    [4, 6, '세륙'],
  ];
  for (const [a, b, label] of combos)
    assert.equal(seotdaRank(hand(a, b)).label, label);
  assert.throws(() => seotdaRank([card(1), card(1)]));
  assert.throws(() => newSeotda('bad', 8, 1000));
  assert.throws(() => newSeotda('bad', 2, 1000, SEOTDA_CARDS.slice(1)));
});
test('contextual catchers need exact cards and cannot catch 38 or ten pair', () => {
  assert.deepEqual(duel(hand(1, 3), hand(4, 7)).winners, [1]);
  assert.deepEqual(duel(hand(3, 8), hand(4, 7)).winners, [0]);
  assert.deepEqual(duel(hand(1, 3), hand(4, 7, 2, 1)).winners, [0]);
  assert.deepEqual(duel(hand(9, 9, 1, 2), hand(3, 7)).winners, [1]);
  assert.deepEqual(duel(hand(10, 10, 1, 2), hand(3, 7)).winners, [0]);
  assert.deepEqual(duel(hand(1, 2), hand(3, 7)).winners, [0]);
  assert.deepEqual(duel(hand(2, 4, 1, 2), hand(4, 7)).winners, [0]);
  assert.deepEqual(
    duel(hand(1, 8), hand(4, 7), hand(10, 10, 1, 2)).winners,
    [1],
  );
});
test('gusa/mung caps and explicit priority over catcher; ordinary rank ties replay', () => {
  assert(duel(hand(1, 2), hand(4, 9, 2, 2)).replay);
  assert(!duel(hand(2, 2, 1, 2), hand(4, 9, 2, 2)).replay);
  assert(duel(hand(8, 8, 1, 2), hand(4, 9)).replay);
  assert(!duel(hand(10, 10, 1, 2), hand(4, 9)).replay);
  assert(!duel(hand(3, 8), hand(4, 9)).replay);
  assert(duel(hand(2, 2, 1, 2), hand(3, 7), hand(4, 9)).replay);
  assert(duel(hand(1, 2), hand(1, 2, 2, 2)).replay);
});
test('replay retains pot, excludes folds, rotates next living first seat, hides fresh cards', () => {
  let g = newSeotda(
    'replay',
    4,
    1000,
    deck([hand(1, 2), hand(3, 4), hand(5, 6), hand(1, 2, 2, 2)]),
  );
  g = seotdaAction(g, 0, { kind: 'check' });
  g = seotdaAction(g, 1, { kind: 'fold' });
  g = seotdaAction(g, 2, { kind: 'fold' });
  g = seotdaAction(g, 3, { kind: 'check' });
  assert.equal(g.phase, 'showdown');
  g = seotdaDeal(g);
  assert.equal(g.phase, 'redeal');
  assert.equal(g.previous.hands.length, 2);
  const before = { stacks: g.stacks, committed: g.committed };
  g = seotdaDeal(g, deck([hand(1, 2), [], [], hand(1, 2, 2, 2)], 3, 4));
  assert.equal(g.first, 3);
  assert.equal(g.turn, 3);
  assert.equal(g.hands[1].length, 0);
  assert.deepEqual({ stacks: g.stacks, committed: g.committed }, before);
  assert.equal(seotdaView(g, 0).revealed.length, 0);
  assert.equal(seotdaView(g, 1).hand.length, 0);
  g = seotdaDeal(checks(g));
  g = seotdaDeal(g, deck([hand(10, 10, 1, 2), [], [], hand(1, 2)], 0, 4));
  assert.equal(g.first, 0);
  assert.equal(g.turn, 0);
  g = seotdaDeal(checks(g));
  assert.equal(g.phase, 'over');
  assert.deepEqual(g.result, [300, -100, -100, -100]);
});
test('all-in replay is automatic with no new ante and zero-sum settlement', () => {
  let g = newSeotda(
    'all-replay',
    2,
    1000,
    deck([hand(1, 2), hand(1, 2, 2, 2)]),
  );
  g = seotdaAction(g, 0, { kind: 'all-in' });
  g = seotdaAction(g, 1, { kind: 'call' });
  assert.equal(g.phase, 'showdown');
  g = seotdaDeal(g);
  assert.equal(g.phase, 'redeal');
  g = seotdaDeal(g, deck([hand(3, 8), hand(1, 2)], 1));
  assert.equal(g.phase, 'showdown');
  assert.deepEqual(g.stacks, [0, 0]);
  assert.equal(sum(g.committed), 2000);
  g = seotdaDeal(g);
  assert.deepEqual(g.result, [1000, -1000]);
  assert.equal(sum(g.stacks), 2000);
});
test('invalid bets, wrong turn, and observer actions never mutate; views have no deck or other private hands', () => {
  const g = newSeotda('privacy', 3, 1000),
    before = JSON.stringify(g);
  for (const a of [
    { kind: 'raise', to: -1 },
    { kind: 'raise', to: NaN },
    { kind: 'raise', to: 1.5 },
    { kind: 'raise', to: 1001 },
    { kind: 'call' },
    { kind: 'invented' },
  ])
    assert.equal(seotdaAction(g, 0, a), null);
  assert.equal(seotdaAction(g, 1, { kind: 'fold' }), null);
  assert.equal(seotdaAction(g, -1, { kind: 'check' }), null);
  assert.equal(JSON.stringify(g), before);
  for (const seat of [-1, 0, 1, 2]) {
    const v = seotdaView(g, seat);
    assert(!('deck' in v));
    assert(!('hands' in v));
    assert(!('actedAt' in v));
    assert.equal(v.revealed.length, 0);
    assert.equal(v.hand.length, seat < 0 ? 0 : 2);
  }
  const raised = seotdaAction(g, 0, { kind: 'raise', to: 200 });
  assert.equal(seotdaLegal(raised, 1).minTo, 400);
  assert.equal(seotdaAction(raised, 1, { kind: 'check' }), null);
});
test('1000 seeded mixed-action games conserve all chips through folds and replay', () => {
  let seed = 7013;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const shuffled = () => {
    const d = [...SEOTDA_CARDS];
    for (let i = 19; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  };
  for (let run = 0; run < 1000; run++) {
    const count = 2 + (run % 6),
      buyIn = run % 2 ? 1000 : 5000;
    let g = newSeotda('sim' + run, count, buyIn, shuffled()),
      steps = 0;
    while (g.phase !== 'over' && ++steps < 300) {
      assert.equal(sum(g.stacks) + sum(g.committed), count * buyIn);
      assert.equal(new Set([...g.deck, ...g.hands.flat()]).size, 20);
      const l = seotdaLegal(g, g.turn);
      if (g.phase !== 'betting') g = seotdaDeal(g, shuffled());
      else {
        const roll = random();
        const a =
          roll < 0.1
            ? { kind: 'fold' }
            : l.canRaise && roll < 0.35
              ? { kind: 'raise', to: roll < 0.2 ? l.maxTo : l.minTo }
              : { kind: l.canCheck ? 'check' : 'call' };
        g = seotdaAction(g, g.turn, a);
        assert(g);
      }
    }
    assert.equal(g.phase, 'over');
    assert.equal(sum(g.result), 0);
    assert.equal(sum(g.stacks), count * buyIn);
    assert(g.stacks.every((n) => n >= 0 && Number.isSafeInteger(n)));
  }
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
    const id = 'p' + i,
      w = 'wallet-' + String(i).repeat(24);
    r.wallets.set(id, w);
    r.bank.commit(registerWallet(r.bank.ledger, w));
    r.members.set(id, {
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
  r.sync();
  return r;
}
function invite(r, count = 2) {
  assert(
    r.apply('p0', {
      kind: 'invite',
      game: 'seotda',
      players: Array.from({ length: count - 1 }, (_, i) => 'p' + (i + 1)),
      stake: 1000,
      required: count,
    }),
  );
  const req = r.view.invites.find((i) => i.game === 'seotda');
  for (let i = 1; i < count; i++)
    assert(r.apply('p' + i, { kind: 'reply', id: req.id, accept: true }));
  return r.seotda.id;
}
const wait = async (predicate) => {
  const end = Date.now() + 10000;
  while (!predicate() && Date.now() < end)
    await new Promise((r) => setTimeout(r, 30));
  assert(predicate());
};
test('room launches 7 seats, reserves shared wallet, masks cards, blocks stale/observer/duplicate games', () => {
  const r = roomHost();
  try {
    const id = invite(r, 7);
    assert.equal(r.seotda.hands.length, 7);
    assert.equal(r.view.wallet.held, 1000);
    assert.equal(r.view.wallet.balance, 99000);
    assert(r.view.players.every((p) => p.area === 'lounge'));
    const a = { kind: 'seotda', id, revision: 0, action: { kind: 'check' } };
    assert.equal(r.apply('p1', a), false);
    assert.equal(r.apply('p0', { ...a, revision: 3 }), false);
    assert.equal(r.apply('p0', { ...a, id: 'old' }), false);
    assert.equal(
      r.apply('p0', { kind: 'invite', game: 'chess', players: ['p1'] }),
      false,
    );
    assert(r.apply('p0', a));
    assert.equal(r.apply('p0', a), false);
    const packet = r.packet('observer');
    assert.equal(packet.seotda.hand.length, 0);
    assert(!('hands' in packet.seotda));
    assert(!('deck' in packet.seotda));
  } finally {
    r.leave();
  }
});
test('leaving auto-folds on next turn and settles once; all-in departure keeps showdown eligibility', async () => {
  const r = roomHost();
  try {
    const id = invite(r);
    assert(r.apply('p0', { kind: 'stand', game: 'seotda' }));
    await wait(() => r.seotda.phase === 'over');
    assert.deepEqual(r.seotda.result, [-100, 100]);
    assert.equal(r.bank.ledger.games[id].state, 'settled');
    assert.equal(r.view.wallet.held, 0);
    const before = JSON.stringify(r.bank.ledger);
    r.settle('seotda', r.seotda);
    assert.equal(JSON.stringify(r.bank.ledger), before);
    const nextId = invite(r);
    r.seotda = newSeotda(nextId, 2, 1000, deck([hand(3, 8), hand(1, 2)]));
    r.sync();
    assert(
      r.apply('p0', {
        kind: 'seotda',
        id: nextId,
        revision: 0,
        action: { kind: 'all-in' },
      }),
    );
    assert(r.apply('p0', { kind: 'stand', game: 'seotda' }));
    assert(
      r.apply('p1', {
        kind: 'seotda',
        id: nextId,
        revision: 1,
        action: { kind: 'call' },
      }),
    );
    await wait(() => r.seotda.phase === 'over');
    assert.deepEqual(r.seotda.result, [1000, -1000]);
    validateLedger(r.bank.ledger);
  } finally {
    r.leave();
  }
});
test('room refuses launch or final action if ledger cannot be saved, without advancing game', () => {
  const r = roomHost();
  try {
    assert(
      r.apply('p0', {
        kind: 'invite',
        game: 'seotda',
        players: ['p1'],
        stake: 1000,
        required: 2,
      }),
    );
    const commit = r.bank.commit.bind(r.bank);
    r.bank.commit = () => {
      throw Error('disk full');
    };
    assert.throws(
      () =>
        r.apply('p1', {
          kind: 'reply',
          id: r.view.invites[0].id,
          accept: true,
        }),
      /disk full/,
    );
    assert.equal(r.seotda, null);
    assert.deepEqual(r.view.invites[0].accepted, ['p0']);
    r.bank.commit = commit;
    assert(
      r.apply('p1', { kind: 'reply', id: r.view.invites[0].id, accept: true }),
    );
    const before = JSON.stringify(r.seotda);
    r.bank.commit = () => {
      throw Error('disk full');
    };
    assert.throws(
      () =>
        r.apply('p0', {
          kind: 'seotda',
          id: r.seotda.id,
          revision: 0,
          action: { kind: 'fold' },
        }),
      /disk full/,
    );
    assert.equal(JSON.stringify(r.seotda), before);
    assert.equal(r.bank.ledger.games[r.seotda.id].state, 'reserved');
  } finally {
    r.leave();
  }
});
test('Seotda uses shared zero-sum wallet and cannot mint money or settle twice', () => {
  const ids = ['wallet-' + 'a'.repeat(24), 'wallet-' + 'b'.repeat(24)];
  let l = ids.reduce(registerWallet, newLoungeLedger());
  l = reserveGame(l, 'seotda', 'seotda', ids, [1000, 1000]);
  assert.throws(() => settleGame(l, 'seotda', [1000, 0]));
  l = settleGame(l, 'seotda', [100, -100]);
  assert.deepEqual(Object.values(l.accounts), [100100, 99900]);
  assert.equal(settleGame(l, 'seotda', [100, -100]), l);
  assert.throws(() => voidGame(l, 'seotda'));
  l = reserveGame(l, 'chess', 'chess', ids, [1000, 1000]);
  l = settleGame(l, 'chess', [-1000, 1000]);
  assert.deepEqual(Object.values(l.accounts), [99100, 100900]);
  validateLedger(l);
});
