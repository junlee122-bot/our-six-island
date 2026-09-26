// Friend-only tables without a dealer: 야추 (Yacht dice), 라이어 게임, and
// the 파티 판 crop effects. Engine rules, the hosted room's flow (turn clocks,
// away seats, rematch), 범 settlement with the ledger invariant, and that the
// liar's identity and the word never reach the wrong client.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  YACHT_CATEGORIES,
  YACHT_ROUNDS,
  newYacht,
  yachtAction,
  yachtAuto,
  yachtBest,
  yachtLegal,
  yachtRerollOne,
  yachtScore,
  yachtSettlement,
  yachtTotals,
  yachtView,
} from '../app/lounge-yacht.ts';
import {
  LIAR_LIMIT_MS,
  LIAR_PASS,
  liarAction,
  liarAuto,
  liarView,
  newLiar,
} from '../app/lounge-liar.ts';
import { LIAR_CATEGORIES } from '../app/lounge-liar-words.ts';
import {
  PARTY_EXTEND_MS,
  PARTY_REJECT,
  eatPartyItem,
  partyTable,
} from '../app/lounge-party.ts';
import { LoungeRoom, REJECT } from '../app/lounge-room.ts';
import { TURN_LIMIT_MS, READY_LIMIT_MS, tableIdOf, TABLE_AREA } from '../app/lounge-games.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, validateLedger, INITIAL_BEOM } from '../app/lounge-economy.ts';
import { defaultLook } from '../app/lounge-look.ts';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { FRIEND_MODELS } from '../app/lounge-friend-props.ts';
import { LOUNGE_MODELS } from '../app/lounge-model-assets.ts';
import { SFX_FILES } from '../app/lounge-sfx-files.ts';

const seq = (...values) => {
  let i = 0;
  return () => values[i++ % values.length];
};
const sum = (ns) => ns.reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------- 야추 rules

test('yacht scores every category by the standard rules', () => {
  const s = (d, c) => yachtScore(d, c);
  assert.equal(s([1, 1, 2, 3, 1], 'ones'), 3);
  assert.equal(s([6, 6, 6, 2, 6], 'sixes'), 24);
  assert.equal(s([2, 3, 4, 5, 6], 'choice'), 20);
  assert.equal(s([4, 4, 4, 4, 2], 'fourKind'), 18);
  assert.equal(s([5, 5, 5, 5, 5], 'fourKind'), 25);
  assert.equal(s([4, 4, 4, 2, 2], 'fourKind'), 0);
  assert.equal(s([3, 3, 3, 2, 2], 'fullHouse'), 13);
  assert.equal(s([3, 3, 3, 3, 3], 'fullHouse'), 0, 'five of a kind is not a full house');
  assert.equal(s([3, 3, 2, 2, 1], 'fullHouse'), 0);
  assert.equal(s([1, 2, 3, 4, 6], 'smallStraight'), 15);
  assert.equal(s([3, 4, 5, 6, 6], 'smallStraight'), 15);
  assert.equal(s([1, 2, 3, 5, 6], 'smallStraight'), 0);
  assert.equal(s([2, 3, 4, 5, 6], 'largeStraight'), 30);
  assert.equal(s([1, 2, 3, 4, 5], 'largeStraight'), 30);
  assert.equal(s([1, 2, 3, 4, 6], 'largeStraight'), 0);
  assert.equal(s([6, 6, 6, 6, 6], 'yacht'), 50);
  assert.equal(s([6, 6, 6, 6, 5], 'yacht'), 0);
  assert.equal(s([0, 0, 0, 0, 0], 'choice'), 0, 'unrolled dice score nothing');
  assert.equal(YACHT_CATEGORIES.length, 12);
});

test('the upper bonus of 35 comes at 63', () => {
  const row = [3, 6, 9, 12, 15, 18, null, null, null, null, null, null];
  assert.deepEqual(yachtTotals(row), { upper: 63, bonus: 35, total: 98 });
  row[5] = 12;
  assert.deepEqual(yachtTotals(row), { upper: 57, bonus: 0, total: 57 });
});

test('a turn: three rolls at most, kept dice stay, one category per turn', () => {
  let g = newYacht('y1', 2, 0, 0);
  assert.equal(yachtLegal(g, 1).enabled, false);
  assert.equal(yachtAction(g, 1, { kind: 'roll' }), null, 'not my turn');
  assert.equal(yachtAction(g, 0, { kind: 'score', category: 'ones' }), null, 'must roll first');
  g = yachtAction(g, 0, { kind: 'roll', held: [true, true, true, true, true] }, seq(1, 2, 3, 4, 5));
  assert.deepEqual(g.dice, [1, 2, 3, 4, 5], 'the first roll throws all five');
  g = yachtAction(g, 0, { kind: 'roll', held: [true, false, true, false, true] }, seq(6));
  assert.deepEqual(g.dice, [1, 6, 3, 6, 5]);
  assert.equal(yachtAction(g, 0, { kind: 'roll', held: [true, true, true, true, true] }), null, 'keeping all is not a roll');
  g = yachtAction(g, 0, { kind: 'roll', held: [false, true, false, true, false] }, seq(6));
  assert.deepEqual(g.dice, [6, 6, 6, 6, 6]);
  assert.equal(g.rolls, 3);
  assert.equal(yachtAction(g, 0, { kind: 'roll' }), null, 'three rolls only');
  const view = yachtView(g, 1);
  assert.equal(view.potential.yacht, 50);
  assert.equal(view.legal.enabled, false);
  g = yachtAction(g, 0, { kind: 'score', category: 'yacht' });
  assert.equal(g.sheet[0][11], 50);
  assert.equal(g.turn, 1);
  assert.equal(g.rolls, 0);
  g = yachtAction(g, 1, { kind: 'roll' }, seq(2));
  assert.equal(yachtAction(g, 1, { kind: 'score', category: 'nope' }), null);
  g = yachtAction(g, 1, { kind: 'score', category: 'twos' });
  assert.equal(g.sheet[1][1], 10);
  assert.equal(g.round, 2);
  g = yachtAction(g, 0, { kind: 'roll' }, seq(1));
  assert.equal(yachtAction(g, 0, { kind: 'score', category: 'yacht' }), null, 'a used category stays closed');
});

test('the server plays a timed-out / away seat: best open category, a 0 in the cheapest', () => {
  const row = YACHT_CATEGORIES.map(() => null);
  assert.equal(yachtBest([2, 3, 4, 5, 6], row), 'largeStraight');
  assert.equal(yachtBest([1, 1, 1, 1, 1], row), 'yacht');
  assert.equal(yachtBest([2, 2, 3, 3, 3], row), 'fullHouse', 'choice is kept for bad rolls');
  const used = [...row];
  used[0] = 1;
  used[6] = 20;
  // Nothing scores in the lower section and ones are used: the cheapest 0.
  assert.equal(yachtBest([2, 2, 3, 5, 6], used.map((n, i) => (i >= 1 && i <= 5 ? 5 : n))), 'yacht');
  const g = newYacht('y2', 2);
  assert.deepEqual(yachtAuto(g), { kind: 'roll' });
});

test('a whole game ends after 12 rounds and pays the pot to the winner (ties split)', () => {
  let g = newYacht('y3', 3, 1000, 1);
  let guard = 0;
  while (g.phase !== 'over' && guard++ < 200) g = yachtAction(g, g.turn, yachtAuto(g), seq(3, 3, 5, 5, 1, 2, 6, 4));
  assert.equal(g.phase, 'over');
  assert.equal(guard, YACHT_ROUNDS * 3 * 2, 'each turn: one roll and one score');
  assert.ok(g.sheet.every((row) => row.every((n) => n !== null)));
  assert.equal(sum(g.result), 0);
  assert.deepEqual(yachtSettlement([100, 120, 90], 1000), { winners: [1], result: [-1000, 2000, -1000] });
  assert.deepEqual(yachtSettlement([120, 120, 90], 1000), { winners: [0, 1], result: [500, 500, -1000] });
  assert.deepEqual(yachtSettlement([7, 7, 7], 1000), { winners: [0, 1, 2], result: [0, 0, 0] });
  assert.deepEqual(yachtSettlement([9, 9, 9, 1], 1000), { winners: [0, 1, 2], result: [334, 333, 333, -1000] });
  assert.deepEqual(yachtSettlement([5, 1], 0), { winners: [0], result: [0, 0] });
});

test('당근 rerolls one die only after a roll, on my turn', () => {
  let g = newYacht('y4', 2);
  assert.equal(yachtRerollOne(g, 0, 2, seq(6)), null);
  g = yachtAction(g, 0, { kind: 'roll' }, seq(1, 2, 3, 4, 1));
  assert.equal(yachtRerollOne(g, 1, 2, seq(6)), null);
  assert.equal(yachtRerollOne(g, 0, 7, seq(6)), null);
  const next = yachtRerollOne(g, 0, 4, seq(5));
  assert.deepEqual(next.dice, [1, 2, 3, 4, 5]);
  assert.equal(next.rolls, 1, 'the three rolls are untouched');
});

// ----------------------------------------------------------- 라이어 rules

const fixed = (liar, cat = 0, word = 0) => {
  const picks = [cat, word, liar];
  let i = 0;
  return () => picks[i++];
};

test('the word list: 15 categories of 20 distinct words', () => {
  assert.equal(LIAR_CATEGORIES.length, 15);
  for (const c of LIAR_CATEGORIES) {
    assert.equal(c.words.length, 20, c.name);
    assert.equal(new Set(c.words).size, 20, c.name);
  }
});

test('liar flow: hints in order, discussion, vote, the caught liar guesses', () => {
  let g = newLiar('L1', 4, 1, undefined, fixed(2));
  const word = LIAR_CATEGORIES[0].words[0];
  assert.equal(g.word, word);
  assert.equal(g.liar, 2);
  assert.equal(g.turn, 1);
  assert.equal(liarAction(g, 0, { kind: 'hint', text: '뜨끈한 거' }), null, 'seat 1 starts');
  assert.match(liarAction(g, 1, { kind: 'hint', text: `이건 ${word}!` }), /제시어/);
  g = liarAction(g, 1, { kind: 'hint', text: '빨간 국물' });
  g = liarAction(g, 2, { kind: 'hint', text: `${word}` }); // the liar may say anything
  assert.equal(g.hints[2], word);
  g = liarAction(g, 3, { kind: 'hint', text: '밥이랑 먹어요' });
  g = liarAction(g, 0, { kind: 'hint', text: '겨울에 좋아' });
  assert.equal(g.phase, 'discuss');
  for (const s of [0, 1, 2, 3]) g = liarAction(g, s, { kind: 'ready' });
  assert.equal(g.phase, 'vote');
  assert.equal(liarAction(g, 0, { kind: 'vote', target: 0 }), null, 'not myself');
  g = liarAction(g, 0, { kind: 'vote', target: 2 });
  g = liarAction(g, 1, { kind: 'vote', target: 2 });
  g = liarAction(g, 2, { kind: 'vote', target: 3 });
  g = liarAction(g, 3, { kind: 'vote', target: 2 });
  assert.equal(g.phase, 'guess');
  assert.equal(g.accused, 2);
  assert.deepEqual(g.ballots[0].tally, [0, 0, 3, 1]);
  assert.equal(liarAction(g, 0, { kind: 'guess', word }), null, 'only the liar guesses');
  assert.equal(liarAction(g, 2, { kind: 'guess', word: '없는 단어' }), null, 'from the list only');
  const wrong = liarAction(g, 2, { kind: 'guess', word: LIAR_CATEGORIES[0].words[1] });
  assert.equal(wrong.winner, 'citizens');
  assert.deepEqual(wrong.points, [1, 1, 0, 1]);
  const right = liarAction(g, 2, { kind: 'guess', word });
  assert.equal(right.winner, 'liar');
  assert.deepEqual(right.points, [0, 0, 2, 0]);
});

test('a tie is voted again among the tied; a second tie lets the liar go', () => {
  let g = newLiar('L2', 4, 0, undefined, fixed(0));
  for (let i = 0; i < 4; i++) g = liarAuto(g, new Set(), true);
  assert.deepEqual(g.hints, [LIAR_PASS, LIAR_PASS, LIAR_PASS, LIAR_PASS]);
  g = liarAuto(g, new Set(), true);
  assert.equal(g.phase, 'vote');
  g = liarAction(g, 0, { kind: 'vote', target: 1 });
  g = liarAction(g, 1, { kind: 'vote', target: 2 });
  g = liarAction(g, 2, { kind: 'vote', target: 1 });
  g = liarAction(g, 3, { kind: 'vote', target: 2 });
  assert.equal(g.phase, 'vote');
  assert.equal(g.voteRound, 2);
  assert.deepEqual(g.candidates, [1, 2]);
  assert.equal(liarAction(g, 0, { kind: 'vote', target: 3 }), null, 'only the tied');
  g = liarAction(g, 0, { kind: 'vote', target: 1 });
  g = liarAction(g, 3, { kind: 'vote', target: 2 });
  g = liarAuto(g, new Set(), true); // 1 and 2 did not vote: abstain
  assert.equal(g.phase, 'over');
  assert.equal(g.winner, 'liar');
  assert.equal(g.accused, null);
  assert.deepEqual(g.points, [2, 0, 0, 0]);
});

test('views: the liar never gets the word, nobody else gets the liar before the reveal', () => {
  let g = newLiar('L3', 3, 0, undefined, fixed(1, 3, 5));
  const secret = LIAR_CATEGORIES[3].words[5];
  const seen = (seat) => JSON.stringify(liarView(g, seat));
  const check = () => {
    if (g.phase === 'over') return;
    const liarSees = seen(1),
      watcher = seen(-1);
    assert.ok(!liarSees.includes(secret), 'the liar does not see the word');
    assert.ok(!watcher.includes(secret), 'watchers do not see the word');
    for (const s of [0, 2, -1]) {
      const v = liarView(g, s);
      if (g.phase !== 'guess') assert.equal(v.liar, null);
      assert.ok(!('votes' in v) || v.votes === undefined);
    }
    assert.equal(liarView(g, 0).word, secret);
    assert.equal(liarView(g, 1).role, 'liar');
    assert.equal(liarView(g, 0).role, 'citizen');
    assert.equal(liarView(g, -1).role, 'watcher');
  };
  check();
  for (const [s, t] of [[0, '힌트1'], [1, '힌트2'], [2, '힌트3']]) {
    g = liarAction(g, s, { kind: 'hint', text: t });
    check();
  }
  g = liarAuto(g, new Set(), true);
  g = liarAction(g, 0, { kind: 'vote', target: 1 });
  check();
  // Who voted is public, whom is not until the vote closes.
  assert.deepEqual(liarView(g, 2).voted, [true, false, false]);
  assert.equal(liarView(g, 2).myVote, null);
  assert.equal(liarView(g, 0).myVote, 1);
  g = liarAction(g, 1, { kind: 'vote', target: 0 });
  g = liarAction(g, 2, { kind: 'vote', target: 1 });
  assert.equal(g.phase, 'guess');
  assert.equal(liarView(g, 0).liar, 1, 'caught: now public');
  assert.equal(liarView(g, 1).word, null, 'still no word for the liar');
  assert.equal(liarView(g, 1).choices.length, 20);
  assert.equal(liarView(g, 0).choices, null);
  g = liarAuto(g, new Set(), true);
  assert.equal(g.phase, 'over');
  assert.equal(liarView(g, -1).word, secret, 'revealed to all at the end');
  assert.equal(liarView(g, 2).liar, 1);
});

test('away seats pass, abstain and never answer the guess', () => {
  let g = newLiar('L4', 3, 0, undefined, fixed(2));
  const away = new Set([2]);
  assert.equal(liarAuto(g, away, false), null, 'not their turn yet');
  g = liarAction(g, 0, { kind: 'hint', text: 'a' });
  g = liarAction(g, 1, { kind: 'hint', text: 'b' });
  g = liarAuto(g, away, false);
  assert.equal(g.hints[2], LIAR_PASS);
  g = liarAction(g, 0, { kind: 'ready' });
  g = liarAction(g, 1, { kind: 'ready' });
  g = liarAuto(g, away, false);
  assert.equal(g.phase, 'vote');
  g = liarAction(g, 0, { kind: 'vote', target: 2 });
  g = liarAction(g, 1, { kind: 'vote', target: 2 });
  g = liarAuto(g, away, false);
  assert.equal(g.phase, 'guess');
  g = liarAuto(g, away, false);
  assert.equal(g.winner, 'citizens');
});

// ----------------------------------------------------- hosted room: 야추

function hall(count = 4) {
  const ids = Array.from({ length: count }, () => crypto.randomUUID());
  const room = LoungeRoom.hosted(null, newLoungeLedger(), 'FRIENDSRMA', ids[0]);
  ids.forEach((id, actor) => room.hostedJoin(id, actor, defaultLook(actor)));
  let now = 1_800_000_000_000;
  const h = {
    room,
    ids,
    act: (id, action) => room.hostedAttempt(id, action, now),
    packet: (id = ids[0]) => room.hostedPacket(id),
    advance(ms) {
      now += ms;
      room.hostedTick(now);
    },
    get now() {
      return now;
    },
    waiting: () => room.hostedPacket(ids[0]).invites.find((r) => r.status === 'waiting'),
    ledger: () => room.hostedLedger(),
  };
  return h;
}
const YACHT = tableIdOf('yacht');
const LIAR = tableIdOf('liar');

function sitAll(h, game, seats, extra = {}) {
  const [a, ...rest] = seats;
  assert.equal(h.act(a, { kind: 'invite', game, players: [], required: seats.length, table: tableIdOf(game), ...extra }), '');
  const r = h.waiting();
  for (const id of rest) assert.equal(h.act(id, { kind: 'reply', id: r.id, accept: true }), '');
}

test('both friend tables live in the hall', () => {
  assert.equal(TABLE_AREA.yacht, 'lounge');
  assert.equal(TABLE_AREA.liar, 'lounge');
  assert.equal(YACHT, 'lounge-yacht');
});

test('a staked yacht table reserves, settles the pot and keeps the ledger invariant', () => {
  const h = hall(3);
  const [a, b, c] = h.ids;
  sitAll(h, 'yacht', [a, b, c], { stake: 5000 });
  const p = h.packet(a);
  assert.ok(p.yacht, 'started');
  assert.equal(p.wallet.held, 5000);
  assert.equal(p.tables.yacht.party, undefined);
  validateLedger(h.ledger());
  // Everyone plays by the server's choice until the end.
  let guard = 0;
  while (h.packet(a).yacht.phase !== 'over' && guard++ < 400) {
    const y = h.packet(a).yacht;
    const id = h.room.hostedPacket(a).seats.yacht[y.turn];
    const action = yachtAuto(y);
    assert.equal(h.act(id, { kind: 'yacht', id: y.id, revision: y.revision, action }), '');
  }
  const y = h.packet(a).yacht;
  assert.equal(y.phase, 'over');
  const game = h.ledger().games[y.id];
  assert.equal(game.state, 'settled');
  assert.deepEqual(game.result, y.result);
  assert.equal(sum(game.result), 0);
  validateLedger(h.ledger());
  const balances = h.ids.map((id) => h.packet(id).wallet.balance);
  assert.equal(sum(balances), 3 * INITIAL_BEOM);
  // Rematch: all ready starts round 2 with the next first seat.
  for (const id of [a, b, c]) assert.equal(h.act(id, { kind: 'ready', game: 'yacht', id: y.id, ready: true }), '');
  const next = h.packet(a).yacht;
  assert.notEqual(next.id, y.id);
  assert.equal(next.first, 1);
  assert.equal(h.packet(a).tables.yacht.round, 2);
});

test('yacht: a stale revision or another seat is refused; the clock plays a late seat', () => {
  const h = hall(2);
  const [a, b] = h.ids;
  sitAll(h, 'yacht', [a, b], { party: true });
  let y = h.packet(a).yacht;
  assert.equal(y.stake, 0);
  assert.equal(h.packet(a).wallet.held, 0, 'a 파티 판 reserves nothing');
  assert.equal(h.act(b, { kind: 'yacht', id: y.id, revision: y.revision, action: { kind: 'roll' } }), REJECT.notTurn);
  assert.equal(h.act(a, { kind: 'yacht', id: y.id, revision: y.revision + 1, action: { kind: 'roll' } }), REJECT.stale);
  assert.ok(y.turnDeadline > h.now);
  h.advance(TURN_LIMIT_MS.yacht + 10);
  y = h.packet(a).yacht;
  assert.equal(y.turn, 1, 'the late turn was rolled and written');
  assert.equal(y.sheet[0].filter((n) => n !== null).length, 1);
});

test('yacht: a friend who leaves is played by the server to the end', () => {
  const h = hall(2);
  const [a, b] = h.ids;
  sitAll(h, 'yacht', [a, b], { stake: 1000 });
  assert.equal(h.act(b, { kind: 'stand', game: 'yacht' }), '');
  let y = h.packet(a).yacht;
  assert.deepEqual(y.away, [1]);
  let guard = 0;
  while (y.phase !== 'over' && guard++ < 300) {
    if (y.turn === 0) h.act(a, { kind: 'yacht', id: y.id, revision: y.revision, action: yachtAuto(y) });
    else h.advance(1000);
    y = h.packet(a).yacht;
  }
  assert.equal(y.phase, 'over');
  assert.equal(h.ledger().games[y.id].state, 'settled');
  validateLedger(h.ledger());
});

// ---------------------------------------------------- hosted room: 라이어

test('liar table: 3–7 seats, never staked; each client sees only its own role', () => {
  const h = hall(4);
  const [a, b, c, d] = h.ids;
  assert.equal(h.act(a, { kind: 'invite', game: 'liar', players: [], required: 2, table: LIAR }), REJECT.stake);
  assert.equal(h.act(a, { kind: 'invite', game: 'liar', players: [], required: 3, stake: 5000, table: LIAR }), REJECT.stake);
  sitAll(h, 'liar', [a, b, c]);
  const packets = [a, b, c].map((id) => h.packet(id));
  assert.ok(packets.every((p) => p.liar && p.wallet.held === 0));
  assert.equal(packets[0].tables.liar.party, true);
  const liars = packets.filter((p) => p.liar.role === 'liar');
  assert.equal(liars.length, 1);
  const word = packets.find((p) => p.liar.role === 'citizen').liar.word;
  assert.ok(word);
  for (const p of packets) {
    const text = JSON.stringify(p);
    assert.equal(p.liar.liar, null, 'nobody is told who the liar is');
    if (p.liar.role === 'liar') assert.ok(!text.includes(word), 'the liar packet never holds the word');
  }
  // A watcher (not seated) sees neither.
  const watcher = h.packet(d);
  assert.equal(watcher.liar.role, 'watcher');
  assert.ok(!JSON.stringify(watcher).includes(word));
  // The private snapshot does hold them (never sent).
  assert.equal(h.room.hostedSnapshot().liar.word, word);
});

test('liar: hints on the clock, a friend who leaves passes and abstains; rematch keeps totals', () => {
  const h = hall(3);
  const [a, b, c] = h.ids;
  sitAll(h, 'liar', [a, b, c]);
  let g = h.packet(a).liar;
  const seatOf = (id) => h.packet(a).seats.liar.indexOf(id);
  const turnId = () => h.packet(a).seats.liar[h.packet(a).liar.turn];
  assert.ok(g.turnDeadline - h.now === LIAR_LIMIT_MS.hint);
  assert.equal(h.act(turnId(), { kind: 'liar', id: g.id, revision: 0, action: { kind: 'hint', text: '음…' } }), '');
  h.advance(LIAR_LIMIT_MS.hint + 5);
  g = h.packet(a).liar;
  assert.equal(g.hints.filter((x) => x === LIAR_PASS).length, 1, 'the late hint passed');
  // The third friend leaves: their hint passes at once, the discussion goes on.
  const left = turnId();
  assert.equal(h.act(left, { kind: 'stand', game: 'liar' }), '');
  h.advance(1000);
  h.advance(1000);
  g = h.packet(a).liar;
  assert.equal(g.phase, 'discuss');
  assert.deepEqual(g.away, [seatOf(left)]);
  const stay = [a, b, c].filter((id) => id !== left);
  for (const id of stay) assert.equal(h.act(id, { kind: 'liar', id: g.id, revision: 0, action: { kind: 'ready' } }), '');
  h.advance(1000);
  h.advance(1000);
  g = h.packet(a).liar;
  assert.equal(g.phase, 'vote');
  // Simultaneous votes: an old revision does not matter, only the match.
  const [s0, s1] = stay.map(seatOf);
  assert.equal(h.act(stay[0], { kind: 'liar', id: g.id, revision: 0, action: { kind: 'vote', target: s1 } }), '');
  assert.equal(h.act(stay[1], { kind: 'liar', id: g.id, revision: 0, action: { kind: 'vote', target: s0 } }), '');
  h.advance(1000);
  h.advance(1000);
  g = h.packet(a).liar;
  assert.ok(['guess', 'over', 'vote'].includes(g.phase));
  h.advance(LIAR_LIMIT_MS.vote + LIAR_LIMIT_MS.guess + 10);
  h.advance(LIAR_LIMIT_MS.guess + 10);
  g = h.packet(a).liar;
  assert.equal(g.phase, 'over');
  assert.ok(g.word && g.liar !== null, 'revealed');
  assert.equal(h.ledger().games[g.id], undefined, 'no escrow ever');
  validateLedger(h.ledger());
  // The one who left is out of the table; the others' ready check runs.
  assert.ok(!h.packet(a).tables.liar.members.includes(left));
  h.advance(READY_LIMIT_MS + 10);
  assert.equal(h.packet(a).tables.liar, undefined, 'short table dissolved');
});

test('liar rematch carries the running score', () => {
  const h = hall(3);
  const [a, b, c] = h.ids;
  sitAll(h, 'liar', [a, b, c]);
  for (let i = 0; i < 12 && h.packet(a).liar.phase !== 'over'; i++) h.advance(LIAR_LIMIT_MS.discuss + 10);
  const first = h.packet(a).liar;
  assert.equal(first.phase, 'over');
  assert.equal(sum(first.totals), sum(first.points));
  for (const id of [a, b, c]) assert.equal(h.act(id, { kind: 'ready', game: 'liar', id: first.id, ready: true }), '');
  const second = h.packet(a).liar;
  assert.notEqual(second.id, first.id);
  assert.deepEqual(second.totals, first.totals);
  assert.equal(second.first, 1);
});

// ------------------------------------------------------ 파티 판 items

test('party items: never with 범 at stake, once per round, logged for the table', () => {
  assert.equal(partyTable('yacht', { stake: 1000 }, true), false);
  assert.equal(partyTable('yacht', { stake: 0, party: true }, true), false, 'escrow blocks');
  assert.equal(partyTable('yacht', { stake: 0, party: true }, false), true);
  assert.equal(partyTable('poker', { stake: 0, party: true }, false), false);
  assert.equal(partyTable('chess', { stake: 0, practice: true }, false), true);
  // Staked yacht: refused.
  const h = hall(2);
  const [a, b] = h.ids;
  sitAll(h, 'yacht', [a, b], { stake: 1000 });
  let y = h.packet(a).yacht;
  h.act(a, { kind: 'yacht', id: y.id, revision: y.revision, action: { kind: 'roll' } });
  assert.equal(h.act(a, { kind: 'party', game: 'yacht', id: y.id, item: 'carrot', die: 0 }), PARTY_REJECT.staked);
  assert.equal(h.act(a, { kind: 'party', game: 'yacht', id: y.id, item: 'watermelon' }), PARTY_REJECT.staked);
  // A 파티 판 allows it.
  const p = hall(2);
  const [x, z] = p.ids;
  sitAll(p, 'yacht', [x, z], { party: true });
  y = p.packet(x).yacht;
  assert.equal(p.act(x, { kind: 'party', game: 'yacht', id: y.id, item: 'carrot', die: 0 }), PARTY_REJECT.moment, 'roll first');
  assert.equal(p.act(x, { kind: 'party', game: 'yacht', id: y.id, item: 'strawberry', target: 1 }), PARTY_REJECT.game);
  p.act(x, { kind: 'yacht', id: y.id, revision: y.revision, action: { kind: 'roll' } });
  const deadline = p.packet(x).yacht.turnDeadline;
  assert.equal(p.act(z, { kind: 'party', game: 'yacht', id: y.id, item: 'watermelon' }), PARTY_REJECT.moment, 'only on my own clock');
  assert.equal(p.act(x, { kind: 'party', game: 'yacht', id: y.id, item: 'watermelon' }), '');
  assert.equal(p.packet(x).yacht.turnDeadline, deadline + PARTY_EXTEND_MS);
  assert.equal(p.act(x, { kind: 'party', game: 'yacht', id: y.id, item: 'carrot', die: 1 }), PARTY_REJECT.used);
  const log = p.packet(z).party.yacht.log;
  assert.equal(log.length, 1);
  assert.match(log[0].text, /수박/);
  assert.equal(p.packet(z).yacht.rolls, 1);
});

test('딸기 peek: the card only for the peeker, the fact for everyone', () => {
  const h = hall(1);
  const [a] = h.ids;
  assert.equal(h.act(a, { kind: 'invite', game: 'gostop', players: [], table: tableIdOf('gostop'), practice: true }), '');
  const g = h.packet(a).gostop;
  assert.equal(h.act(a, { kind: 'party', game: 'gostop', id: g.id, item: 'strawberry', target: 0 }), PARTY_REJECT.moment, 'not my own hand');
  assert.equal(h.act(a, { kind: 'party', game: 'gostop', id: g.id, item: 'strawberry', target: 1 }), '');
  const mine = h.packet(a).party.gostop;
  assert.ok(mine.peek.card, 'the peeker sees the card');
  const hands = h.room.hostedSnapshot().go.hands;
  assert.ok(hands[1].includes(mine.peek.card));
  assert.match(mine.log[0].text, /딸기/);
  h.advance(6000);
  assert.equal(h.packet(a).party.gostop.peek, undefined, 'gone after 5 s');
});

test('the cloud engine takes the crop from the bag, and only on success', async () => {
  const uid = '11111111-2222-4333-8444-555555555551';
  const uid2 = '11111111-2222-4333-8444-555555555552';
  const me = { id: uid, actor: 1, username: 'a' };
  const you = { id: uid2, actor: 2, username: 'b' };
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const now = 1_800_000_000_000;
  const conns = { [uid]: crypto.randomUUID(), [uid2]: crypto.randomUUID() };
  const seqs = { [uid]: 0, [uid2]: 0 };
  let code = '';
  const run = async (m, op, extra = {}) => {
    const c = { op, connection: conns[m.id], ...(code ? { code } : {}), requestId: crypto.randomUUID(), sequence: ++seqs[m.id], ...(op === 'open' ? { epoch: 0 } : op === 'join' ? { epoch: 0 } : {}), ...extra };
    const t = cloudTransition(world, m, c, await commandHash(c), now);
    world = t.state;
    if (t.response.code) code = t.response.code;
    return t.response;
  };
  await run(me, 'open');
  await run(you, 'join');
  await run(me, 'action', { action: { kind: 'invite', game: 'yacht', players: [], required: 2, table: YACHT, party: true } });
  const inv = (await run(me, 'read')).packet.invites.find((i) => i.status === 'waiting');
  await run(you, 'action', { action: { kind: 'reply', id: inv.id, accept: true } });
  const y = (await run(me, 'read')).packet.yacht;
  await run(me, 'action', { action: { kind: 'yacht', id: y.id, revision: y.revision, action: { kind: 'roll' } } });
  world.life.bag[uid].produce.carrot = 0;
  let r = await run(me, 'action', { action: { kind: 'party', game: 'yacht', id: y.id, item: 'carrot', die: 0 } });
  assert.equal(r.ok, false);
  assert.match(r.error, /당근이 없어요/);
  world.life.bag[uid].produce.carrot = 2;
  r = await run(me, 'action', { action: { kind: 'party', game: 'yacht', id: y.id, item: 'carrot', die: 0 } });
  assert.equal(r.ok, true, r.error);
  assert.equal(world.life.bag[uid].produce.carrot, 1);
  r = await run(me, 'action', { action: { kind: 'party', game: 'yacht', id: y.id, item: 'carrot', die: 0 } });
  assert.equal(r.ok, false, 'second one this round');
  assert.equal(world.life.bag[uid].produce.carrot, 1, 'a refused use keeps the crop');
  assert.throws(() => eatPartyItem({ produce: { carrot: 0 } }, 'carrot'));
  validateLedger(world.ledger);
});

// ------------------------------------------------ assets of the two tables


test('kArchive props of the friends’ tables: originals match assets.json, sizes match the code', () => {
  const root = new URL('../public/models/', import.meta.url);
  const manifest = JSON.parse(fs.readFileSync(new URL('lounge/friends/assets.json', root), 'utf8'));
  assert.match(manifest.terms, /출처 표기 필수/);
  assert.equal(manifest.assets.length, Object.keys(FRIEND_MODELS).length);
  for (const a of manifest.assets) {
    const original = fs.readFileSync(new URL(`_originals/lounge/friends/${a.file}`, root));
    assert.equal(original.length, a.bytes, a.key);
    assert.equal(createHash('sha256').update(original).digest('hex'), a.sha256, a.key);
    const web = fs.readFileSync(new URL(`lounge/friends/${a.file}`, root));
    assert.equal(web.toString('ascii', 0, 4), 'glTF');
    assert.ok(web.length < original.length, `${a.key} web copy is smaller`);
    assert.equal(LOUNGE_MODELS[a.key], `/models/lounge/friends/${a.file}`);
    const m = FRIEND_MODELS[a.key];
    assert.ok(Math.abs(a.bounds.size[1] - m.h) < 0.005, `${a.key} height`);
    assert.ok(Math.abs(Math.max(a.bounds.size[0], a.bounds.size[2]) - (m.w ?? 0)) < 0.005 || a.key === 'deskCalendar' || a.key === 'lectern' || a.key === 'ballotBox' || a.key === 'ovalTable', `${a.key} width`);
  }
  const attribution = fs.readFileSync(new URL('lounge/ATTRIBUTION.md', root), 'utf8');
  for (const a of manifest.assets) assert.ok(attribution.includes(a.source), a.source);
});

test('every recorded sound has an Ogg original and an AAC copy, and a license', () => {
  const pub = new URL('../public', import.meta.url);
  for (const [id, s] of Object.entries(SFX_FILES)) {
    assert.deepEqual(s.files.map((f) => f.split('.').pop()), ['ogg', 'm4a'], id);
    for (const f of s.files) assert.ok(fs.statSync(new URL('.' + f, pub + '/')).size > 500, f);
    assert.ok(s.gain > 0 && s.gain <= 0.5, id);
  }
  assert.match(fs.readFileSync(new URL('./assets/lounge/sfx/LICENSE-KENNEY.txt', pub + '/'), 'utf8'), /CC0/);
});
