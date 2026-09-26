// 허풍 카드 (허풍 주점): the engine's rules, the fixed-chamber roulette and its
// commitments, what each view may show (never another hand, a face-down card
// or a chamber), the bots deciding from their own view only, clocks and
// forfeits, and the hosted room: 파티 판 with 대타 봇, 연습 판, staked tables
// that pay the last one standing with the ledger invariant intact.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LB_CHAMBERS,
  LB_DECK,
  LB_HAND,
  LB_IDLE_FORFEIT,
  LB_LIMIT_MS,
  lbCommit,
  lbRisk,
  lbTrue,
  lbVerify,
  liarsBarAction,
  liarsBarAdvance,
  liarsBarAuto,
  liarsBarBot,
  liarsBarKey,
  liarsBarLegal,
  liarsBarLimit,
  liarsBarSettlement,
  liarsBarView,
  newLiarsBar,
} from '../app/lounge-liarsbar.ts';
import { sha256Hex } from '../app/lounge-sha256.ts';
import { captainLine, allCaptainLines } from '../app/lounge-liarsbar-lines.ts';
import { FORBIDDEN_LINE } from '../app/lounge-dealer-lines.ts';
import { LoungeRoom, REJECT } from '../app/lounge-room.ts';
import { GAME_INFO, TABLE_AREA, TURN_LIMIT_MS, stakesOf, tableIdOf } from '../app/lounge-games.ts';
import { newLoungeLedger, validateLedger, INITIAL_BEOM } from '../app/lounge-economy.ts';
import { defaultLook } from '../app/lounge-look.ts';
import { createHash } from 'node:crypto';

const sum = (ns) => ns.reduce((a, b) => a + b, 0);
/** Deterministic RNG for the engine's `pick`. */
function rng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { pick: (n) => Math.floor(next() * n), rnd: next };
}
/** Plays a whole match with bots deciding from each seat's view. */
function playOut(g, r, level = 'normal', guard = 5000) {
  const seen = [g];
  for (let i = 0; g.phase !== 'over' && i < guard; i++) {
    const next = liarsBarAuto(g, {
      timeout: g.phase === 'reveal' || g.phase === 'shot',
      bot: (seat) => liarsBarBot(liarsBarView(g, seat), level, r.rnd),
      pick: r.pick,
    });
    assert.ok(next, `stuck in ${g.phase}`);
    g = next;
    seen.push(g);
  }
  return { g, seen };
}

// ---------------------------------------------------------------- rules

test('the deck: K, Q, A × 6 and two jokers; five cards each, fresh random ids every round', () => {
  const count = (f) => LB_DECK.filter((c) => c === f).length;
  assert.deepEqual([count('K'), count('Q'), count('A'), count('J')], [6, 6, 6, 2]);
  const r = rng(7);
  const g = newLiarsBar('m1', 4, 0, 0, undefined, r.pick);
  assert.equal(g.round, 1);
  assert.deepEqual(g.hands.map((h) => h.length), [5, 5, 5, 5]);
  const ids = g.hands.flat();
  assert.equal(new Set(ids).size, 20);
  assert.ok(['K', 'Q', 'A'].includes(g.table));
  // Ids are reshuffled per round: over many deals every id takes every face.
  const faces = new Map();
  for (let s = 0; s < 400; s++) {
    const h = newLiarsBar('x' + s, 4, 0, 0, undefined, rng(s + 11).pick);
    h.cards.forEach((f, id) => faces.set(id + f, true));
  }
  assert.equal(faces.size, 20 * 4, 'every id has been every face');
  assert.equal(LB_HAND, 5);
});

test('오늘의 카드 is drawn evenly', () => {
  const tally = { K: 0, Q: 0, A: 0 };
  for (let s = 0; s < 3000; s++) tally[newLiarsBar('t' + s, 2, 0, 0, undefined, rng(s + 3).pick).table]++;
  for (const k of ['K', 'Q', 'A']) assert.ok(Math.abs(tally[k] - 1000) < 120, `${k} ${tally[k]}`);
});

test('plays: 1–3 own cards on my turn only; a call needs a play before me', () => {
  const r = rng(5);
  let g = newLiarsBar('m', 3, 0, 0, undefined, r.pick);
  const mine = g.hands[0];
  assert.equal(liarsBarLegal(g, 0).call, false, 'nothing to call at the start');
  assert.equal(liarsBarAction(g, 1, { kind: 'play', ids: [g.hands[1][0]] }), null, 'not my turn');
  assert.equal(liarsBarAction(g, 0, { kind: 'play', ids: [] }), null);
  assert.equal(liarsBarAction(g, 0, { kind: 'play', ids: mine.slice(0, 4) }), null, 'at most three');
  assert.equal(liarsBarAction(g, 0, { kind: 'play', ids: [g.hands[1][0]] }), null, 'only my cards');
  assert.equal(liarsBarAction(g, 0, { kind: 'play', ids: [mine[0], mine[0]] }), null, 'no duplicates');
  assert.equal(liarsBarAction(g, 0, { kind: 'call' }), null);
  g = liarsBarAction(g, 0, { kind: 'play', ids: mine.slice(0, 2) });
  assert.equal(g.turn, 1);
  assert.deepEqual(g.hands.map((h) => h.length), [3, 5, 5]);
  assert.equal(liarsBarLegal(g, 1).call, true);
  assert.equal(liarsBarLegal(g, 1).forced, false);
});

test('a lie is any card that is neither 오늘의 카드 nor a joker; the liar or the caller pulls', () => {
  for (let s = 0; s < 200; s++) {
    const r = rng(100 + s);
    let g = newLiarsBar('c' + s, 2, 0, 0, undefined, r.pick);
    const ids = g.hands[0].slice(0, 2);
    g = liarsBarAction(g, 0, { kind: 'play', ids });
    const lie = ids.some((id) => !lbTrue(g.cards[id], g.table));
    g = liarsBarAction(g, 1, { kind: 'call' });
    assert.equal(g.phase, 'reveal');
    assert.equal(g.reveal.lie, lie);
    assert.deepEqual(g.reveal.faces, ids.map((id) => g.cards[id]));
    assert.equal(g.shooter, lie ? 0 : 1);
  }
  assert.equal(lbTrue('J', 'K'), true);
  assert.equal(lbTrue('Q', 'K'), false);
});

test('skip empty hands; when everyone else is empty the next player must call', () => {
  const r = rng(9);
  let g = newLiarsBar('f', 3, 0, 0, undefined, r.pick);
  // Seat 1 and 2 empty out; seat 0 plays three, then two.
  g = { ...g, hands: [g.hands[0], [], []] };
  g = liarsBarAction(g, 0, { kind: 'play', ids: g.hands[0].slice(0, 3) });
  // Everyone else is empty: seat 1 takes the turn and can only call.
  assert.equal(g.turn, 1);
  const legal = liarsBarLegal(g, 1);
  assert.equal(legal.play, false);
  assert.equal(legal.call, true);
  // A seat with cards facing a play when all others are out is forced.
  let h = newLiarsBar('f2', 3, 0, 0, undefined, rng(10).pick);
  h = liarsBarAction(h, 0, { kind: 'play', ids: [h.hands[0][0]] });
  h = { ...h, hands: [[], h.hands[1], []] };
  const forced = liarsBarLegal(h, 1);
  assert.equal(forced.forced, true);
  assert.equal(forced.play, false);
  assert.equal(liarsBarAction(h, 1, { kind: 'play', ids: [h.hands[1][0]] }), null);
});

// ---------------------------------------------------------------- roulette

test('each revolver: one fixed chamber, risk 1/6 → 1/1, the sixth pull always fires', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(lbRisk), [6, 5, 4, 3, 2, 1]);
  for (let chamber = 0; chamber < LB_CHAMBERS; chamber++) {
    let g = newLiarsBar('r' + chamber, 2, 0, 0, undefined, rng(chamber).pick);
    g = { ...g, chamber: [chamber, 5], commit: [lbCommit(g.id, 0, chamber, g.salt[0]), g.commit[1]] };
    let pulls = 0;
    for (;;) {
      g = { ...g, phase: 'trigger', turn: -1, shooter: 0, reveal: null };
      g = liarsBarAction(g, 0, { kind: 'trigger' });
      pulls++;
      if (g.lastShot.out) break;
      assert.ok(pulls <= chamber, 'fires exactly at its chamber');
    }
    assert.equal(pulls, chamber + 1);
    assert.equal(g.alive[0], false);
  }
});

test('fairness: every chamber is equally likely and the commitment proves it afterwards', () => {
  const tally = [0, 0, 0, 0, 0, 0];
  for (let s = 0; s < 3000; s++) {
    const g = newLiarsBar('fair' + s, 4, 0, 0);
    for (const c of g.chamber) tally[c]++;
    for (let i = 0; i < 4; i++)
      assert.equal(g.commit[i], createHash('sha256').update(`${g.id}|${i}|${g.chamber[i]}|${g.salt[i]}`).digest('hex'));
  }
  for (const n of tally) assert.ok(Math.abs(n - 2000) < 200, `chamber tally ${tally.join(",")}`);
  // Our synchronous SHA-256 equals node's.
  for (const t of ['', 'abc', '허풍|3|5|beef'.repeat(9)]) assert.equal(sha256Hex(t), createHash('sha256').update(t).digest('hex'));
  // After the match everyone can check; a tampered chamber fails.
  const r = rng(77);
  const { g } = playOut(newLiarsBar('proof', 3, 0, 0, undefined, r.pick), r);
  const v = liarsBarView(g, 0);
  for (let i = 0; i < 3; i++) assert.equal(lbVerify(v, i), true);
  assert.equal(lbVerify({ ...v, chamber: v.chamber.map((c) => (c + 1) % 6) }, 0), false);
});

test('whole matches: exactly one winner, no draws, pulls ≤ 6 per seat, invariants hold', () => {
  let pulls = 0;
  for (let s = 0; s < 300; s++) {
    const r = rng(1000 + s);
    const n = 2 + (s % 3);
    const { g, seen } = playOut(newLiarsBar('w' + s, n, 1000, s % n, undefined, r.pick), r);
    assert.equal(g.phase, 'over');
    assert.equal(g.alive.filter(Boolean).length, 1);
    assert.equal(g.alive[g.winner], true);
    assert.equal(sum(g.result), 0);
    assert.equal(g.result[g.winner], 1000 * (n - 1));
    assert.ok(g.pulls.every((p) => p <= LB_CHAMBERS));
    for (const step of seen) assert.ok(step.hands.flat().length + step.plays.flatMap((p) => p.ids).length <= 20);
    pulls += sum(g.pulls);
  }
  assert.ok(pulls / 300 > 3, 'the roulette happens');
});

test('the next round starts with the one who pulled, or the next seat still standing', () => {
  const r = rng(4);
  let g = newLiarsBar('next', 3, 0, 0, undefined, r.pick);
  g = { ...g, chamber: [5, 0, 5] };
  g = liarsBarAction(g, 0, { kind: 'play', ids: [g.hands[0][0]] });
  g = liarsBarAction(g, 1, { kind: 'call' });
  const shooter = g.shooter;
  g = liarsBarAdvance(g, r.pick);
  assert.equal(g.phase, 'trigger');
  g = liarsBarAction(g, shooter, { kind: 'trigger' });
  g = liarsBarAdvance(g, r.pick);
  assert.equal(g.round, 2);
  const expect = g.alive[shooter] ? shooter : (shooter + 1) % 3;
  assert.equal(g.turn, expect);
});

test('settlement: winner takes every stake, sums to zero; 파티 판 moves nothing', () => {
  assert.deepEqual(liarsBarSettlement(2, 4, 5000), [-5000, -5000, 15000, -5000]);
  assert.deepEqual(liarsBarSettlement(0, 2, 0), [0, 0]);
  assert.deepEqual(stakesOf('liarsbar'), [1000, 5000, 10000]);
  assert.equal(GAME_INFO.liarsbar.stake, 0);
});

// ---------------------------------------------------------------- hidden info

test('views never carry another hand, a face-down card, a chamber or a salt before the end', () => {
  for (let s = 0; s < 1000; s++) {
    const r = rng(5000 + s);
    let g = newLiarsBar('h' + s, 2 + (s % 3), 0, 0, undefined, r.pick);
    for (let step = 0; step < 6 && g.phase !== 'over'; step++) {
      for (let seat = -1; seat < g.n; seat++) {
        const v = liarsBarView(g, seat);
        const text = JSON.stringify(v);
        assert.ok(!('cards' in v) && !('hands' in v) && !('idle' in v));
        assert.equal(v.chamber, null);
        assert.equal(v.salt, null);
        for (const salt of g.salt) assert.ok(!text.includes(salt), 'no salt');
        if (seat >= 0 && g.alive[seat]) {
          assert.deepEqual(v.hand.map((c) => c.id), g.hands[seat]);
          assert.deepEqual(v.hand.map((c) => c.face), g.hands[seat].map((id) => g.cards[id]));
        } else assert.equal(v.hand, null);
        // Plays: only seat and count, faces only for the called play.
        for (const p of v.plays) assert.deepEqual(Object.keys(p).sort(), ['count', 'seat']);
        if (v.reveal) {
          const last = g.plays[g.plays.length - 1];
          assert.deepEqual(v.reveal.ids, last.ids);
        }
      }
      const next = liarsBarAuto(g, {
        timeout: true,
        bot: (seat) => liarsBarBot(liarsBarView(g, seat), 'normal', r.rnd),
        pick: r.pick,
      });
      g = next;
    }
  }
});

test('the chambers are revealed only when the match is over', () => {
  const r = rng(31);
  const { g } = playOut(newLiarsBar('end', 2, 0, 0, undefined, r.pick), r);
  const v = liarsBarView(g, -1);
  assert.deepEqual(v.chamber, g.chamber);
  assert.deepEqual(v.salt, g.salt);
});

test('bots decide from their view only: the same view gives the same move whatever the secrets', () => {
  for (let s = 0; s < 300; s++) {
    const r = rng(9000 + s);
    let g = newLiarsBar('b' + s, 3, 0, 0, undefined, r.pick);
    if (s % 2) g = liarsBarAction(g, 0, { kind: 'play', ids: [g.hands[0][0], g.hands[0][1]] });
    const seat = g.turn;
    const view = liarsBarView(g, seat);
    // Scramble everything the bot must not know (others' faces, chambers).
    const scrambled = structuredClone(g);
    for (let id = 0; id < 20; id++) if (!g.hands[seat].includes(id)) scrambled.cards[id] = ['K', 'Q', 'A', 'J'][(id + s) % 4];
    scrambled.chamber = scrambled.chamber.map((c) => (c + 3) % 6);
    const viewScrambled = liarsBarView(scrambled, seat);
    assert.deepEqual(viewScrambled, view, 'the secrets are not in the view');
    const a = liarsBarBot(view, 'normal', rng(s).rnd);
    const b = liarsBarBot(viewScrambled, 'normal', rng(s).rnd);
    assert.deepEqual(a, b);
    assert.ok(a, 'a bot always has a move on its turn');
    assert.ok(liarsBarAction(g, seat, a), 'and it is legal');
  }
});

test('the bot calls a certain lie and never plays when forced', () => {
  const r = rng(3);
  let g = newLiarsBar('cert', 2, 0, 0, undefined, r.pick);
  // Seat 1 holds 6 of the 8 true cards (오늘의 카드 + jokers), so a claim of
  // three true cards from seat 0 is impossible.
  const trueIds = g.cards.flatMap((f, id) => (lbTrue(f, g.table) ? [id] : []));
  g = { ...g, hands: [g.cards.flatMap((f, id) => (lbTrue(f, g.table) ? [] : [id])).slice(0, 3), trueIds.slice(0, 6)] };
  g = liarsBarAction({ ...g, cards: g.cards }, 0, { kind: 'play', ids: g.hands[0].slice(0, 3) });
  const v = liarsBarView(g, 1);
  assert.deepEqual(liarsBarBot(v, 'normal', () => 0.99), { kind: 'call' });
});

// ---------------------------------------------------------------- clocks

test('clock keys and limits: play 30 s, reveal 3.5 s, trigger 10 s, shot 3 s', () => {
  const r = rng(12);
  let g = newLiarsBar('k', 2, 0, 0, undefined, r.pick);
  assert.equal(liarsBarLimit(g), 30_000);
  assert.equal(TURN_LIMIT_MS.liarsbar, 30_000);
  const k1 = liarsBarKey(g);
  g = liarsBarAction(g, 0, { kind: 'play', ids: [g.hands[0][0]] });
  assert.notEqual(liarsBarKey(g), k1);
  g = liarsBarAction(g, 1, { kind: 'call' });
  assert.equal(liarsBarLimit(g), LB_LIMIT_MS.reveal);
  g = liarsBarAdvance(g, r.pick);
  assert.equal(liarsBarLimit(g), 10_000);
  const shooter = g.shooter;
  g = liarsBarAction(g, shooter, { kind: 'trigger' });
  assert.equal(liarsBarLimit(g), 3_000);
});

test('a timeout plays one card (a true one if any); forced turns call; the trigger pulls itself', () => {
  const r = rng(21);
  let g = newLiarsBar('t', 2, 0, 0, undefined, r.pick);
  const hand = g.hands[0];
  const truthy = hand.filter((id) => lbTrue(g.cards[id], g.table));
  g = liarsBarAuto(g, { timeout: true, pick: r.pick });
  assert.equal(g.plays.length, 1);
  assert.equal(g.plays[0].ids.length, 1);
  if (truthy.length) assert.ok(truthy.includes(g.plays[0].ids[0]));
  assert.equal(g.idle[0], 1);
  // Nothing happens without a timeout or an away seat.
  assert.equal(liarsBarAuto(g, { timeout: false, pick: r.pick }), null);
  // Forced.
  g = { ...g, hands: [[], g.hands[1]] };
  g = liarsBarAuto(g, { timeout: true, pick: r.pick });
  assert.equal(g.phase, 'reveal');
  g = liarsBarAuto(g, { timeout: true, pick: r.pick });
  assert.equal(g.phase, 'trigger');
  g = liarsBarAuto(g, { timeout: true, pick: r.pick });
  assert.equal(g.phase, 'shot');
});

test('staked: two automatic moves in a row forfeit; a real move resets the count', () => {
  const r = rng(22);
  let g = newLiarsBar('idle', 3, 1000, 0, undefined, r.pick);
  g = liarsBarAuto(g, { timeout: true, staked: true, pick: r.pick });
  assert.equal(g.idle[0], 1);
  // Seats 1 and 2 answer themselves; seat 0 idles again on its next turn.
  while (g.turn !== 0 || g.phase !== 'play') {
    const seat = g.phase === 'play' ? g.turn : g.shooter;
    const a = liarsBarBot(liarsBarView(g, seat), 'normal', r.rnd);
    g = a ? liarsBarAction(g, seat, a, { pick: r.pick }) : liarsBarAdvance(g, r.pick);
    if (g.phase === 'over' || !g.alive[0]) return; // the roulette decided first
  }
  if (g.idle[0] + 1 >= LB_IDLE_FORFEIT) {
    const next = liarsBarAuto(g, { timeout: true, staked: true, pick: r.pick });
    assert.equal(next.alive[0], false);
    assert.equal(next.quit[0], true);
  }
  // A real move clears the count.
  let h = newLiarsBar('idle2', 2, 1000, 0, undefined, rng(23).pick);
  h = liarsBarAuto(h, { timeout: true, staked: true, pick: rng(1).pick });
  assert.equal(h.idle[0], 1);
  h = liarsBarAction(h, 1, { kind: 'play', ids: [h.hands[1][0]] });
  h = liarsBarAction(h, 0, { kind: 'play', ids: [h.hands[0][0]] });
  assert.equal(h.idle[0], 0);
});

// ---------------------------------------------------------------- lines

test('허 선장 never urges more 범 and always has a line', () => {
  for (const line of allCaptainLines()) assert.doesNotMatch(line, FORBIDDEN_LINE, line);
  const r = rng(40);
  const { seen } = playOut(newLiarsBar('lines', 3, 0, 0, undefined, r.pick), r);
  for (const g of seen.slice(0, 200))
    for (let seat = -1; seat < 3; seat++) {
      const line = captainLine(liarsBarView(g, seat), ['도원', '강재', '민서']);
      assert.ok(line.text.length > 3);
      assert.doesNotMatch(line.text, /\{|\}/, 'no template left');
    }
});

// ---------------------------------------------------------------- hosted room

function tavern(count = 4) {
  const ids = Array.from({ length: count }, () => crypto.randomUUID());
  const room = LoungeRoom.hosted(null, newLoungeLedger(), 'TAVERNROOM', ids[0]);
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
    waiting: () => room.hostedPacket(ids[0]).invites.find((r) => r.status === 'waiting'),
    ledger: () => room.hostedLedger(),
  };
  for (const id of ids) assert.equal(h.act(id, { kind: 'area', area: 'tavern' }), '');
  return h;
}
const LB = tableIdOf('liarsbar');
function sit(h, seats, extra = {}) {
  const [a, ...rest] = seats;
  assert.equal(h.act(a, { kind: 'invite', game: 'liarsbar', players: [], required: seats.length, table: LB, ...extra }), '');
  const r = h.waiting();
  for (const id of rest) assert.equal(h.act(id, { kind: 'reply', id: r.id, accept: true }), '');
}
/** Drives a hosted match to the end: humans move with the bot's choice, the clock does the rest. */
function drive(h, guard = 4000) {
  const seatsOf = () => h.packet(h.ids[0]).seats.liarsbar;
  for (let i = 0; i < guard; i++) {
    const g = h.packet(h.ids[0]).liarsbar;
    if (!g || g.phase === 'over') return g;
    const actor = g.phase === 'play' ? g.turn : g.phase === 'trigger' ? g.shooter : -1;
    const id = actor >= 0 ? seatsOf()[actor] : null;
    if (id && h.ids.includes(id) && !(g.away ?? []).includes(actor)) {
      const v = h.packet(id).liarsbar;
      const a = liarsBarBot(v, 'normal', Math.random);
      assert.equal(h.act(id, { kind: 'liarsbar', id: v.id, revision: v.revision, action: a }), '');
    } else h.advance(3600);
  }
  return h.packet(h.ids[0]).liarsbar;
}

test('the table is in the tavern; you must stand there to sit', () => {
  assert.equal(TABLE_AREA.liarsbar, 'tavern');
  const h = tavern(2);
  assert.equal(h.act(h.ids[0], { kind: 'area', area: 'lounge' }), '');
  assert.equal(h.act(h.ids[0], { kind: 'invite', game: 'liarsbar', players: [], required: 2, table: LB, party: true }), REJECT.tableArea);
});

test('a staked table reserves, pays the last one standing, and keeps the ledger invariant', () => {
  const h = tavern(3);
  sit(h, h.ids, { stake: 5000 });
  const p = h.packet(h.ids[0]);
  assert.ok(p.liarsbar, 'started');
  assert.equal(p.wallet.held, 5000);
  validateLedger(h.ledger());
  // A 50,000 chip is not offered here.
  const g = drive(h);
  assert.equal(g.phase, 'over');
  const game = h.ledger().games[g.id];
  assert.equal(game.game, 'liarsbar');
  assert.equal(game.state, 'settled');
  assert.deepEqual(game.result, g.result);
  assert.equal(g.result[g.winner], 10000);
  validateLedger(h.ledger());
  assert.equal(sum(h.ids.map((id) => h.packet(id).wallet.balance)), 3 * INITIAL_BEOM);
  // Rematch: all ready → round 2, first seat moves on, totals carry.
  for (const id of h.ids) assert.equal(h.act(id, { kind: 'ready', game: 'liarsbar', id: g.id, ready: true }), '');
  const next = h.packet(h.ids[0]).liarsbar;
  assert.notEqual(next.id, g.id);
  assert.equal(next.first, 1);
  assert.equal(sum(next.totals.wins), 1);
});

test('only 1천 / 5천 / 1만 chips; bots never sit at a staked table', () => {
  const h = tavern(2);
  const [a] = h.ids;
  assert.equal(h.act(a, { kind: 'invite', game: 'liarsbar', players: [], required: 2, table: LB, stake: 50000 }), REJECT.stake);
  assert.equal(h.act(a, { kind: 'invite', game: 'liarsbar', players: [], required: 2, table: LB, stake: 1000, bots: 1 }), REJECT.invalid);
});

test('each client sees only its own hand; watchers see none', () => {
  const h = tavern(3);
  const [a, b, c] = h.ids;
  sit(h, [a, b], { party: true });
  const pa = h.packet(a).liarsbar,
    pb = h.packet(b).liarsbar,
    pc = h.packet(c).liarsbar;
  assert.equal(pa.role, 'player');
  assert.equal(pc.role, 'watcher');
  assert.equal(pc.hand, null);
  const idsA = pa.hand.map((x) => x.id),
    idsB = pb.hand.map((x) => x.id);
  assert.equal(idsA.filter((id) => idsB.includes(id)).length, 0);
  assert.ok(!JSON.stringify(h.packet(a)).includes('"chamber":['), 'no chambers on the wire');
});

test('파티 판 with 대타 봇: two friends and two bots; bots move on the server clock', () => {
  const h = tavern(2);
  const [a, b] = h.ids;
  assert.equal(h.act(a, { kind: 'invite', game: 'liarsbar', players: [], required: 2, bots: 2, party: true, table: LB }), '');
  assert.equal(h.act(b, { kind: 'reply', id: h.waiting().id, accept: true }), '');
  const p = h.packet(a);
  assert.equal(p.liarsbar.n, 4);
  assert.deepEqual(p.names.liarsbar.slice(2), ['루미', '매화']);
  assert.equal(p.tables.liarsbar.bots, 2);
  assert.equal(p.wallet.held, 0);
  const g = drive(h);
  assert.equal(g.phase, 'over');
  assert.equal(h.ledger().games[g.id], undefined, 'nothing reserved or settled');
});

test('연습 판: me and three bots right away, no 범', () => {
  const h = tavern(1);
  const [a] = h.ids;
  assert.equal(h.act(a, { kind: 'invite', game: 'liarsbar', players: [], table: LB, practice: true }), '');
  const p = h.packet(a);
  assert.equal(p.liarsbar.n, 4);
  assert.equal(p.tables.liarsbar.practice, true);
  const g = drive(h);
  assert.equal(g.phase, 'over');
});

test('standing up from a staked match forfeits at once; at a 파티 판 대타 봇 takes over', () => {
  const h = tavern(3);
  const [a, b, c] = h.ids;
  sit(h, [a, b, c], { stake: 1000 });
  assert.equal(h.act(c, { kind: 'stand', game: 'liarsbar' }), '');
  const g = h.packet(a).liarsbar;
  assert.equal(g.alive[2], false);
  assert.equal(g.quit[2], true);
  const end = drive(h);
  assert.equal(end.result[2], -1000);
  validateLedger(h.ledger());

  const p = tavern(2);
  sit(p, p.ids, { party: true });
  assert.equal(p.act(p.ids[1], { kind: 'stand', game: 'liarsbar' }), '');
  assert.deepEqual(p.packet(p.ids[0]).liarsbar.away, [1]);
  assert.equal(p.packet(p.ids[0]).liarsbar.alive[1], true, 'the bot plays on');
  assert.equal(drive(p).phase, 'over');
});

test('a stale revision or another seat is refused; the clock plays a late seat', () => {
  const h = tavern(2);
  const [a, b] = h.ids;
  sit(h, [a, b], { party: true });
  const g = h.packet(a).liarsbar;
  const mine = h.packet(a).liarsbar.hand[0].id;
  assert.equal(h.act(b, { kind: 'liarsbar', id: g.id, revision: g.revision, action: { kind: 'play', ids: [mine] } }), REJECT.illegal);
  assert.equal(h.act(a, { kind: 'liarsbar', id: g.id, revision: g.revision + 1, action: { kind: 'play', ids: [mine] } }), REJECT.stale);
  assert.ok(g.turnDeadline > 0);
  h.advance(LB_LIMIT_MS.play + 10);
  const after = h.packet(a).liarsbar;
  assert.equal(after.plays.length, 1, 'one card played for the late seat');
  assert.equal(after.turn, 1);
});
