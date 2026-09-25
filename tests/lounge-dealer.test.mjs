// AI dealer 루미 / 진행자 매화: engine dealer events, step delays, all-in
// run-out reveal, and the curated lines (tone, josa, determinism, facts).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newBlackjack,
  blackjackAction,
  blackjackDeal,
  blackjackView,
  blackjackStepDelay,
  BLACKJACK_DELAYS,
} from '../app/lounge-blackjack.ts';
import {
  newPoker,
  pokerAction,
  pokerDeal,
  pokerView,
  pokerContested,
  pokerStepDelay,
  pokerRankSoFar,
} from '../app/lounge-poker.ts';
import {
  DEALER_LINES,
  FORBIDDEN_LINE,
  allPoolLines,
  blackjackHandReports,
  blackjackLine,
  blackjackTip,
  blackjackTotalLabel,
  blackjackVerdict,
  cardName,
  fillLine,
  gostopHostLine,
  latestTableReaction,
  newTableMemory,
  pickLine,
  pokerLine,
  pokerResultLines,
  reactionLine,
  rememberRound,
  seotdaLine,
} from '../app/lounge-dealer-lines.ts';

// Blackjack shoe: the listed ranks come first, in order.
function shoe(ranks) {
  const deck = Array.from({ length: 312 }, (_, i) => i),
    top = [];
  for (const rank of ranks.split(' ')) {
    const at = deck.findIndex((c) => c % 13 === '23456789TJQKA'.indexOf(rank));
    top.push(...deck.splice(at, 1));
  }
  return [...top, ...deck];
}
const standAll = (g) => {
  while (g.phase === 'players') g = blackjackAction(g, g.turn, { kind: 'stand' });
  return g;
};
const dealerSteps = (g) => {
  const kinds = [];
  while (g.phase !== 'over') {
    g = blackjackDeal(g);
    kinds.push(g.event.kind);
  }
  return { g, kinds };
};
const NAMES = ['도원', '호현', '승준'];

test('dealer hit, stand and bust are separate events and settle in the same step', () => {
  // Deal order: seat0, seat1, dealer, seat0, seat1, dealer. Dealer T+6 = 16.
  let g = standAll(newBlackjack('bj-hit', 2, 1000, shoe('T T T 9 8 6 5 K')));
  assert.equal(g.phase, 'reveal');
  assert.equal(blackjackStepDelay(g), BLACKJACK_DELAYS.reveal);
  g = blackjackDeal(g);
  assert.deepEqual([g.event.kind, g.event.total], ['reveal', 16]);
  assert.equal(blackjackStepDelay(g), BLACKJACK_DELAYS.hit);
  g = blackjackDeal(g);
  // 16 + 5 = 21: a hit that ends at 21 is followed by one stand step.
  assert.deepEqual([g.event.kind, g.event.total, g.event.card % 13], [
    'dealer-hit',
    21,
    3,
  ]);
  assert.equal(g.phase, 'dealer');
  assert.equal(blackjackStepDelay(g), BLACKJACK_DELAYS.settle);
  const hitLine = blackjackLine(blackjackView(g, 0), 0, NAMES);
  assert.match(hitLine.text, /5[♣♦♥♠]/);
  assert.match(hitLine.text, /합계 21이에요\./);
  assert.doesNotMatch(hitLine.text, /16 이하/);
  g = blackjackDeal(g);
  assert.deepEqual([g.event.kind, g.phase], ['dealer-stand', 'over']);
  assert.equal(blackjackStepDelay(g), null);
  assert.deepEqual(g.result, [-1000, -1000]);

  const bust = dealerSteps(
    standAll(newBlackjack('bj-bust', 2, 1000, shoe('T T T 9 8 6 K'))),
  );
  assert.deepEqual(bust.kinds, ['reveal', 'dealer-bust']);
  assert.equal(bust.g.phase, 'over');
  assert.equal(bust.g.event.total, 26);
  assert.deepEqual(bust.g.result, [1000, 1000]);
});
test('dealer skips drawing when every hand busted, and says so', () => {
  let g = newBlackjack('bj-skip', 2, 1000, shoe('T T T 6 6 6 K K'));
  g = blackjackAction(g, 0, { kind: 'hit' });
  g = blackjackAction(g, 1, { kind: 'hit' });
  const { g: done, kinds } = dealerSteps(g);
  assert.deepEqual(kinds, ['reveal', 'dealer-skip']);
  assert.equal(done.dealer.length, 2);
  const line = blackjackLine(blackjackView(done, 0), 0, NAMES);
  assert.match(line.text, /모두 버스트해서 카드를 더 받지 않을게요/);
  assert.doesNotMatch(line.text, /16 이하/);
  assert.equal(
    blackjackVerdict(done.dealer, done.hands),
    '버스트한 손은 딜러와 상관없이 패배예요.',
  );
});
test('a stored settling snapshot (older engine) still settles', () => {
  let g = standAll(newBlackjack('bj-old', 2, 1000, shoe('T T T 9 8 8')));
  g = blackjackDeal(g);
  g = { ...g, phase: 'settling', event: { kind: 'dealer', seat: -1, hand: -1 } };
  g = blackjackDeal(g);
  assert.deepEqual([g.phase, g.event.kind], ['over', 'settled']);
});
test('blackjack action order and deal start rotate with the first seat', () => {
  // first = 1: cards go seat1, seat2, seat0, dealer, then again.
  const g = newBlackjack('bj-rot', 3, 1000, shoe('2 3 4 5 6 7 8 9'), 1);
  assert.equal(g.turn, 1);
  assert.equal(g.hands[1][0].cards[0] % 13, 0);
  assert.equal(g.hands[0][0].cards[0] % 13, 2);
  assert.equal(g.dealer[0] % 13, 3);
  let next = blackjackAction(g, 1, { kind: 'stand' });
  assert.equal(next.turn, 2);
  next = blackjackAction(next, 2, { kind: 'stand' });
  assert.equal(next.turn, 0);
  assert.throws(() => newBlackjack('bad', 3, 1000, undefined, 3));
  assert.equal(blackjackView(g, 0).first, 1);
});
test('blackjack view keeps the hole card hidden until the reveal step', () => {
  let g = newBlackjack('bj-hide', 2, 1000, shoe('T T T 9 8 6 K'));
  const hole = g.dealer[1];
  assert.equal(blackjackView(g, 0).dealer[1], null);
  g = standAll(g);
  assert.equal(blackjackView(g, -1).dealer[1], null);
  assert.equal(JSON.stringify(blackjackView(g, 0)).includes('"deck"'), false);
  g = blackjackDeal(g);
  assert.equal(blackjackView(g, 0).dealer[1], hole);
});

test('hold\'em all-in run-out opens hands only once no decision is left', () => {
  // Heads-up, button = seat 0 (SB). Both all-in preflop.
  let g = newPoker('p-runout', [2000, 2000], undefined, 0, 200);
  g = pokerAction(g, g.turn, { kind: 'all-in' });
  // One player still to decide: nothing is revealed yet.
  assert.equal(g.reveal, false);
  assert.equal(pokerView(g, -1).revealed.length, 0);
  const other = g.turn;
  const secretBefore = JSON.stringify(pokerView(g, other === 0 ? 1 : 0));
  assert.equal(secretBefore.includes(JSON.stringify(g.hands[other])), false);
  g = pokerAction(g, g.turn, { kind: 'call' });
  assert.equal(g.phase, 'dealing');
  assert.equal(g.reveal, true);
  assert.equal(g.events.at(-1).kind, 'runout');
  assert.equal(g.events.at(-2).allIn, true);
  const view = pokerView(g, -1);
  assert.equal(view.revealed.length, 2);
  assert.equal(view.board.length, 0);
  assert.ok(view.revealed.every((r) => r.rank.label));
  assert.equal(pokerStepDelay(g), 1100);
  assert.match(pokerLine(view, -1, NAMES).text, /패를 모두 공개하고 보드를 끝까지/);
  for (let i = 0; i < 10 && g.phase !== 'over'; i++) g = pokerDeal(g);
  assert.equal(g.phase, 'over');
  assert.equal(pokerStepDelay(g), null);
});
test('hold\'em without an all-in never reveals before the showdown', () => {
  let g = newPoker('p-plain', [5000, 5000, 5000], undefined, 0, 200);
  for (let i = 0; i < 60 && g.phase !== 'showdown' && g.phase !== 'over'; i++) {
    if (g.phase === 'dealing') g = pokerDeal(g);
    else {
      assert.equal(pokerView(g, -1).revealed.length, 0);
      g = pokerAction(g, g.turn, {
        kind: g.currentBet === g.bets[g.turn] ? 'check' : 'call',
      });
    }
  }
  assert.equal(g.phase, 'showdown');
});
test('bet, raise and all-in are told apart; returned bets are not pot', () => {
  let g = newPoker('p-kinds', [1000, 5000, 5000], undefined, 0, 200);
  // Preflop: seat 0 acts first (UTG with 3 players, button 0 → SB 1, BB 2).
  g = pokerAction(g, g.turn, { kind: 'raise', to: 600 });
  let e = g.events.at(-1);
  assert.deepEqual([e.kind, e.to, e.open ?? false, e.allIn ?? false], [
    'raise',
    600,
    false,
    false,
  ]);
  const v = pokerView(g, 1);
  assert.match(pokerLine(v, 1, NAMES).text, /도원 님이 600범으로 레이즈했어요/);
  assert.match(pokerLine(v, 1, NAMES).text, /내 차례예요/);
  assert.match(pokerLine(v, 2, NAMES).text, /이제 호현 님 차례예요/);
  g = pokerAction(g, g.turn, { kind: 'fold' });
  g = pokerAction(g, g.turn, { kind: 'call' });
  g = pokerDeal(g);
  // Post-flop first bet is a bet (open).
  const seat = g.turn;
  g = pokerAction(g, seat, { kind: 'raise', to: 200 });
  e = g.events.at(-1);
  assert.equal(e.open, true);
  assert.match(pokerLine(pokerView(g, -1), -1, NAMES).text, /200범 베팅했어요/);
  g = pokerAction(g, g.turn, { kind: 'all-in' });
  e = g.events.at(-1);
  assert.equal(e.allIn, true);
  assert.match(pokerLine(pokerView(g, -1), -1, NAMES).text, /올인했어요!/);
  // Folding to a bet returns the uncalled part; it is not counted as pot.
  g = pokerAction(g, g.turn, { kind: 'fold' });
  assert.equal(g.phase, 'over');
  const refund = g.pots.find((p) => p.refund);
  assert.ok(refund);
  const contested = pokerContested(g);
  assert.equal(
    contested,
    g.committed.reduce((a, b) => a + b, 0) - refund.amount,
  );
  assert.equal(g.events.at(-1).amount, contested);
  const lines = pokerResultLines(pokerView(g, -1), NAMES);
  assert.match(lines[0], /모두 폴드해서 .+ 님이 팟 .+범을 가져가요\./);
  assert.match(lines.at(-1), /받지 않은 베팅 .+범은 .+ 님께 돌려드렸어요\./);
});
test('pokerRankSoFar names pairs before the flop', () => {
  assert.equal(pokerRankSoFar([12, 25]).label, '원 페어');
  assert.equal(pokerRankSoFar([12, 11]).label, '하이 카드');
});
test('hold\'em opening line greets by name, announces blinds and who starts', () => {
  const g = newPoker('p-open', [5000, 5000, 5000], undefined, 0, 200);
  const mine = pokerLine(pokerView(g, 0), 0, NAMES).text;
  assert.match(mine, /도원 님, 호현 님, 승준 님/);
  assert.match(mine, /블라인드는 호현 님 100범, 승준 님 200범이에요\./);
  assert.match(mine, /내 차례부터 시작해요\./);
  const theirs = pokerLine(pokerView(g, 1), 1, NAMES, { round: 3 }).text;
  assert.match(theirs, /3번째 판/);
  assert.match(theirs, /도원 님부터 시작해요\./);
});

test('blackjack lines: my turn lists legal actions, others are named, results explained', () => {
  // Seat 0 holds 8+8 (split and double legal), seat 1 T+9, dealer T+7.
  let g = newBlackjack('bj-lines', 2, 1000, shoe('8 T T 8 9 7'));
  let text = blackjackLine(blackjackView(g, 0), 0, NAMES).text;
  assert.match(text, /도원 님, 호현 님/);
  assert.match(text, /내 차례예요\. 히트·스탠드·더블다운과 스플릿 중에서 골라 주세요\./);
  text = blackjackLine(blackjackView(g, 1), 1, NAMES).text;
  assert.match(text, /이제 도원 님 차례예요\./);
  g = blackjackAction(g, 0, { kind: 'split' });
  assert.match(
    blackjackLine(blackjackView(g, 0), 0, NAMES).text,
    /^내가 스플릿했어요/,
  );
  text = blackjackLine(blackjackView(g, 1), 1, NAMES).text;
  assert.match(text, /도원 님이 스플릿했어요/);
  assert.match(text, /이제 도원 님의 1번 손 차례예요\./);
  g = standAll(g);
  g = blackjackDeal(g);
  text = blackjackLine(blackjackView(g, 0), 0, NAMES).text;
  assert.match(text, /딜러 17이에요\. 17 이상이라 여기서 멈춰요\./);
  g = blackjackDeal(g);
  assert.equal(g.phase, 'over');
  const view = blackjackView(g, 1);
  text = blackjackLine(view, 1, NAMES).text;
  // Stood on the first two cards: the reveal already said so, no repeat.
  assert.doesNotMatch(text, /멈출게요|멈춰요/);
  assert.match(text, /18 이상 승리 · 17 푸시 · 16 이하 패배예요\./);
  const reports = blackjackHandReports(view, NAMES);
  assert.equal(reports.length, 3);
  assert.deepEqual(
    reports.map((r) => [r.name, r.hand]),
    [
      ['도원', 0],
      ['도원', 1],
      ['호현', 0],
    ],
  );
  assert.equal(reports[2].reason, '19 > 딜러 17');
});
test('blackjack natural pays 3:2 and the reason says so', () => {
  const g = standAll(newBlackjack('bj-nat', 2, 1000, shoe('A T K K 8 7')));
  const { g: done } = dealerSteps(g);
  const r = blackjackHandReports(blackjackView(done, 0), NAMES);
  assert.equal(r[0].amount, 1500);
  assert.equal(r[0].label, '블랙잭');
  assert.match(r[0].reason, /3:2/);
  assert.equal(blackjackTotalLabel(done.hands[1][0].cards), '18');
});
test('dealer bust line and a dealer-bust streak aside', () => {
  const g = standAll(newBlackjack('bj-streak', 2, 1000, shoe('T T T 9 8 6 K')));
  const { g: done } = dealerSteps(g);
  let memory = newTableMemory();
  memory = rememberRound(memory, 'a', NAMES.slice(0, 2), [1, 1], true);
  memory = rememberRound(memory, 'b', NAMES.slice(0, 2), [1, 1], true);
  assert.equal(rememberRound(memory, 'b', NAMES, [1, 1], true), memory);
  const line = blackjackLine(blackjackView(done, 0), 0, NAMES, { memory });
  assert.match(line.text, /26.*버스트예요/);
  assert.match(line.text, /버스트하지 않은 손은 모두 이겨요\./);
  assert.ok(DEALER_LINES.dealerBustStreak.some((s) => line.text.includes(s)));
  assert.equal(line.mood, 'wow');
});
test('losing streak consoles without urging another round', () => {
  let memory = newTableMemory();
  for (const id of ['1', '2', '3'])
    memory = rememberRound(memory, id, ['도원', '호현'], [-1, 1]);
  assert.equal(memory.losses['도원'], 3);
  assert.equal(memory.losses['호현'], 0);
  const g = standAll(newBlackjack('bj-lose', 2, 1000, shoe('5 T 9 6 T 8')));
  const { g: done } = dealerSteps(g);
  assert.ok(done.result[0] < 0);
  const line = blackjackLine(blackjackView(done, 0), 0, ['도원', '호현'], {
    memory,
  });
  assert.ok(DEALER_LINES.consolation.some((s) => line.text.includes(s)));
  assert.equal(line.mood, 'sorry');
});
test('beginner tips are off by default and never suggest a bigger bet', () => {
  const g = newBlackjack('bj-tip', 2, 1000, shoe('T 2 5 6 T 9'));
  const off = blackjackLine(blackjackView(g, 0), 0, NAMES).text;
  assert.doesNotMatch(off, /팁:/);
  const on = blackjackLine(blackjackView(g, 0), 0, NAMES, { tips: true }).text;
  assert.match(on, /팁: 딜러 업카드가 5면 딜러가 버스트하기 쉬워서 보통 16에서 스탠드해요\./);
  assert.equal(blackjackTip([8, 0], 5), '팁: 딜러 업카드가 7이면 보통 12에서 히트해요.');
  for (let a = 0; a < 13; a++)
    for (let b = 0; b < 13; b++)
      for (let up = 0; up < 13; up++)
        assert.doesNotMatch(blackjackTip([a, b], up), /더블|스플릿|걸/);
});

test('every curated line keeps the tone rules and fills its placeholders', () => {
  const lines = allPoolLines();
  assert.ok(lines.length > 40);
  for (const line of lines) {
    assert.doesNotMatch(line, FORBIDDEN_LINE, line);
    const filled = fillLine(line, {
      names: '도원 님',
      round: 2,
      card: 'A♠',
      total: 17,
      extra: '',
      who: '호현 님',
    });
    assert.doesNotMatch(filled, /\{/, line);
    assert.ok(/[요!.…]$/.test(filled.trim()), `ends politely: ${filled}`);
  }
  assert.equal(fillLine('{total|이에요/예요}', { total: 17 }), '17이에요');
  assert.equal(fillLine('{total|이에요/예요}', { total: 19 }), '19예요');
  assert.equal(fillLine('{total|으로/로}', { total: 27 }), '27로');
  assert.equal(fillLine('{total|으로/로}', { total: 26 }), '26으로');
});
test('line choice is deterministic per match, revision and event', () => {
  const pool = DEALER_LINES.greet;
  assert.equal(pickLine(pool, 'm1:3:deal'), pickLine(pool, 'm1:3:deal'));
  const seen = new Set();
  for (let i = 0; i < 40; i++) seen.add(pickLine(pool, `m${i}:0:deal`));
  assert.ok(seen.size > 1);
  assert.equal(cardName(12), 'A♣');
  assert.equal(cardName(52 + 8), '10♣');
});
test('sticker replies answer the newest seated sticker for this match', () => {
  const players = [
    { id: 'a', reaction: { id: 'cheer', at: 10, scope: 'poker', matchId: 'm' } },
    { id: 'b', reaction: { id: 'cry', at: 20, scope: 'poker', matchId: 'm' } },
    { id: 'c', reaction: { id: 'laugh', at: 30, scope: 'village' } },
  ];
  const r = latestTableReaction(players, ['a', 'b', 'c'], 'poker', 'm');
  assert.deepEqual(r, { seat: 1, id: 'cry', at: 20 });
  assert.equal(latestTableReaction(players, ['a'], 'poker', 'other'), null);
  const text = reactionLine('m', r, NAMES);
  assert.ok(DEALER_LINES.reaction.cry.includes(text));
  assert.equal(reactionLine('m', { seat: 0, id: 'hello', at: 1 }, NAMES).includes('도원 님'), true);
});
test('seotda host 매화 explains the win and the pot; go-stop host is light', () => {
  const over = {
    id: 's1',
    phase: 'over',
    winners: [1],
    reason: '38광땡 승리!',
    events: [{ seq: 3, kind: 'win', seat: 1, amount: 3000 }],
    turn: -1,
  };
  assert.equal(
    seotdaLine(over, 0, NAMES).text,
    '호현 님이 38광땡으로 이겼어요! 판돈 3,000범을 가져가요.',
  );
  const betting = {
    id: 's1',
    phase: 'betting',
    winners: [],
    reason: '',
    events: [{ seq: 2, kind: 'fold', seat: 2, amount: 0 }],
    turn: 0,
  };
  assert.equal(seotdaLine(betting, 0, NAMES).text, '승준 님이 다이했어요. 내 차례예요.');
  assert.match(
    gostopHostLine({ id: 'g', phase: 'play', turn: 1, ply: 4 }, 0, NAMES).text,
    /호현 님 차례예요/,
  );
  assert.match(
    gostopHostLine({ id: 'g', phase: 'play', turn: 0, ply: 0 }, 0, NAMES).text,
    /도원 님, 호현 님, 승준 님/,
  );
});
