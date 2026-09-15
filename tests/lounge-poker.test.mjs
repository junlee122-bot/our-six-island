import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newPoker,
  pokerAction,
  pokerDeal,
  pokerView,
  pokerRank,
  comparePokerRanks,
  pokerLegalActions,
  shufflePokerCards,
} from '../app/lounge-poker.ts';

const card = (s) => 'cdhs'.indexOf(s[1]) * 13 + '23456789TJQKA'.indexOf(s[0]);
const cards = (s) => s.split(' ').map(card);
const deck = (prefix = []) => [
  ...prefix,
  ...Array.from({ length: 52 }, (_, i) => i).filter((c) => !prefix.includes(c)),
];
function act(g, action) {
  const next = pokerAction(g, g.turn, action);
  assert.ok(
    next,
    `Rejected ${JSON.stringify(action)} at ${g.phase} seat ${g.turn}`,
  );
  return next;
}
function finish(g) {
  for (let i = 0; i < 200 && g.phase !== 'over'; i++) {
    if (['dealing', 'showdown'].includes(g.phase)) g = pokerDeal(g);
    else
      g = act(g, {
        kind: pokerLegalActions(g, g.turn).canCheck ? 'check' : 'call',
      });
    assert.ok(g);
  }
  assert.equal(g.phase, 'over');
  assert.equal(
    g.result.reduce((a, b) => a + b, 0),
    0,
  );
  assert.equal(
    g.stacks.reduce((a, b) => a + b, 0),
    g.initial.reduce((a, b) => a + b, 0),
  );
  return g;
}
test('rank all nine categories and ace-low straight', () => {
  const examples = [
    'Ac Jd 9h 6s 3c',
    'Ac Ad 9h 6s 3c',
    'Ac Ad 9h 9s 3c',
    'Ac Ad Ah 6s 3c',
    'Ac 2d 3h 4s 5c',
    'Ac Jc 9c 6c 3c',
    'Ac Ad Ah 6s 6c',
    'Ac Ad Ah As 3c',
    '9c Tc Jc Qc Kc',
  ];
  examples.forEach((s, i) => assert.equal(pokerRank(cards(s)).category, i));
  assert.deepEqual(pokerRank(cards(examples[4])).values, [5]);
  assert.equal(pokerRank(cards('Ts Js Qs Ks As')).label, '로열 플러시');
});
test('best five use kickers, two triples, board-only ties, and no suit precedence', () => {
  assert.deepEqual(pokerRank(cards('Ac Ad Ah Kc Kd Kh 2s')).values, [14, 13]);
  assert.equal(
    comparePokerRanks(
      pokerRank(cards('Ac Ad Kh Qs 9c')),
      pokerRank(cards('Ah As Kd Qc 8s')),
    ),
    1,
  );
  assert.equal(
    comparePokerRanks(
      pokerRank(cards('Ac Kd Qh Js 9c')),
      pokerRank(cards('Ad Kh Qs Jc 9d')),
    ),
    0,
  );
  const board = cards('Ts Js Qs Ks As');
  assert.equal(
    comparePokerRanks(
      pokerRank([...board, ...cards('2c 3c')]),
      pokerRank([...board, ...cards('4d 5d')]),
    ),
    0,
  );
  assert.throws(() => pokerRank(cards('Ac Ac Qh Js 9c')));
  assert.throws(() => pokerRank([52, 1, 2, 3, 4]));
});
test('heads-up button is small blind, acts first preflop and last postflop', () => {
  let g = newPoker('hu', [1000, 1000], deck());
  assert.deepEqual(g.bets, [100, 200]);
  assert.equal(g.turn, 0);
  g = act(g, { kind: 'call' });
  assert.equal(g.turn, 1);
  assert.equal(pokerLegalActions(g, 1).canCheck, true);
  g = act(g, { kind: 'check' });
  assert.equal(g.phase, 'dealing');
  g = pokerDeal(g);
  assert.equal(g.phase, 'flop');
  assert.equal(g.turn, 1);
  assert.equal(g.board.length, 3);
});
test('ring blinds, minimum raise, turn checks, and immutable rejection', () => {
  const g = newPoker('ring', [1000, 1000, 1000], deck());
  assert.deepEqual(g.bets, [0, 100, 200]);
  assert.equal(g.turn, 0);
  const original = structuredClone(g);
  for (const action of [
    { kind: 'raise', to: 399 },
    { kind: 'raise', to: 1001 },
    { kind: 'raise', to: NaN },
    { kind: 'check' },
    { kind: 'raise', to: 400.5 },
  ])
    assert.equal(pokerAction(g, 0, action), null);
  assert.equal(pokerAction(g, 1, { kind: 'call' }), null);
  assert.equal(pokerAction(g, -1, { kind: 'fold' }), null);
  assert.deepEqual(g, original);
  assert.equal(act(g, { kind: 'raise', to: 400 }).minRaise, 200);
});
test('short all-in does not reopen a player who already faced the full raise', () => {
  let g = newPoker('short', [1000, 1000, 1000, 450], deck(), 3);
  assert.equal(g.turn, 2);
  g = act(g, { kind: 'raise', to: 400 });
  g = act(g, { kind: 'all-in' });
  g = act(g, { kind: 'call' });
  g = act(g, { kind: 'call' });
  assert.equal(g.turn, 2);
  assert.equal(pokerLegalActions(g, 2).call, 50);
  assert.equal(pokerLegalActions(g, 2).canRaise, false);
  assert.equal(pokerAction(g, 2, { kind: 'all-in' }), null);
  finish(act(g, { kind: 'call' }));
});
test('cumulative short all-ins reopen after a full raise amount is faced', () => {
  let g = newPoker('cumulative', [1000, 1000, 1000, 450, 600], deck(), 4);
  g = act(g, { kind: 'raise', to: 400 });
  g = act(g, { kind: 'all-in' });
  g = act(g, { kind: 'all-in' });
  g = act(g, { kind: 'call' });
  g = act(g, { kind: 'call' });
  assert.equal(g.turn, 2);
  assert.equal(pokerLegalActions(g, 2).canRaise, true);
  assert.equal(pokerLegalActions(g, 2).minTo, 800);
  finish(act(g, { kind: 'raise', to: 800 }));
});
test('fold ends hand without exposing either private hand', () => {
  const g = act(newPoker('fold', [1000, 1000], deck()), { kind: 'fold' });
  assert.equal(g.phase, 'over');
  assert.deepEqual(g.result, [-100, 100]);
  const view = pokerView(g, -1);
  assert.deepEqual(view.hand, []);
  assert.deepEqual(view.revealed, []);
  assert.ok(!('hands' in view));
  assert.ok(!('deck' in view));
  assert.ok(!('actedAt' in view));
  assert.equal(pokerDeal(g), null);
  assert.equal(pokerAction(g, 0, { kind: 'fold' }), null);
});
test('unequal all-ins award the main and side pots to separate hands', () => {
  const prefix = cards('Kc Qc Ac Kd Qd Ad 2c 2h 5s 7h 3c 9s 4c Jc');
  let g = newPoker('side', [100, 300, 600], deck(prefix));
  g = act(g, { kind: 'call' });
  g = act(g, { kind: 'all-in' });
  g = act(g, { kind: 'call' });
  g = finish(g);
  assert.deepEqual(g.stacks, [300, 400, 300]);
  assert.deepEqual(
    g.pots.map((p) => [p.amount, p.winners]),
    [
      [300, [0]],
      [400, [1]],
    ],
  );
});
test('unmatched overbet returns to its owner independently of showdown winner', () => {
  let g = newPoker('refund', [1000, 500], deck());
  g = act(g, { kind: 'all-in' });
  g = act(g, { kind: 'call' });
  g = finish(g);
  const refund = g.pots.find((p) => p.refund);
  assert.deepEqual(refund, {
    amount: 500,
    cap: 1000,
    eligible: [0],
    winners: [0],
    refund: true,
  });
  assert.ok(g.stacks[0] >= 500);
});
test('odd chip in a tied pot starts left of the button; folded hand stays private', () => {
  const prefix = cards('2c 4c 6c 3c 5c 7c 8c Ts Js Qs 9c Ks Tc As');
  let g = newPoker('odd', [20, 20, 20], deck(prefix), 0, 2);
  g = act(g, { kind: 'raise', to: 5 });
  g = act(g, { kind: 'call' });
  g = act(g, { kind: 'call' });
  g = pokerDeal(g);
  assert.equal(g.turn, 1);
  g = act(g, { kind: 'fold' });
  g = finish(g);
  assert.deepEqual(g.result, [2, -5, 3]);
  assert.deepEqual(
    pokerView(g, -1).revealed.map((p) => p.seat),
    [0, 2],
  );
});
test('spectators get no private cards and returned views cannot mutate the host', () => {
  const g = newPoker('private', [1000, 1000, 1000], deck());
  const own = pokerView(g, 0),
    other = pokerView(g, 1),
    spectator = pokerView(g, -1);
  assert.deepEqual(own.hand, g.hands[0]);
  assert.deepEqual(other.hand, g.hands[1]);
  assert.deepEqual(spectator.hand, []);
  assert.deepEqual(spectator.revealed, []);
  assert.equal(spectator.legal.enabled, false);
  own.hand[0] = 51;
  own.stacks[0] = 0;
  assert.notEqual(g.hands[0][0], 51);
  assert.equal(g.stacks[0], 1000);
});
test('short big blind heads-up runs out and refunds without an impossible call', () => {
  const g = finish(newPoker('shortblind', [1000, 50], deck()));
  assert.deepEqual(g.committed, [100, 50]);
  assert.equal(g.pots.find((p) => p.refund)?.amount, 50);
});
test('invalid configurations fail and cryptographic shuffle is a permutation', () => {
  for (const buyIns of [
    [100],
    [100, 0],
    [100, -2],
    [100, Infinity],
    [100, 1.5],
    Array(8).fill(100),
  ])
    assert.throws(() => newPoker('bad', buyIns));
  assert.throws(() => newPoker('bad', [100, 100], Array(52).fill(0)));
  assert.throws(() => newPoker('bad', [100, 100], deck(), 0, 3));
  assert.deepEqual(
    shufflePokerCards().sort((a, b) => a - b),
    deck(),
  );
});
test('500 deterministic mixed-action hands conserve integer chips and terminate', () => {
  let seed = 95117;
  const random = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  for (let t = 0; t < 500; t++) {
    const count = 2 + (t % 6);
    const shuffled = deck();
    for (let i = 51; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    let g = newPoker(
      'random' + t,
      Array.from({ length: count }, () => 50 + Math.floor(random() * 1500)),
      shuffled,
      t % count,
    );
    const total = g.initial.reduce((a, b) => a + b, 0);
    for (let step = 0; step < 500 && g.phase !== 'over'; step++) {
      if (['dealing', 'showdown'].includes(g.phase)) g = pokerDeal(g);
      else {
        const legal = pokerLegalActions(g, g.turn),
          r = random();
        const action =
          r < 0.15
            ? { kind: 'fold' }
            : r < 0.4 && legal.canRaise
              ? {
                  kind: 'raise',
                  to: random() < 0.5 ? legal.minTo : legal.maxTo,
                }
              : { kind: legal.canCheck ? 'check' : 'call' };
        g = act(g, action);
      }
      assert.ok(g.stacks.every((v) => Number.isSafeInteger(v) && v >= 0));
      assert.equal(
        g.stacks.reduce((a, b) => a + b, 0) +
          (g.phase === 'over' ? 0 : g.committed.reduce((a, b) => a + b, 0)),
        total,
      );
    }
    assert.equal(g.phase, 'over');
    assert.equal(
      g.result.reduce((a, b) => a + b, 0),
      0,
    );
  }
});
