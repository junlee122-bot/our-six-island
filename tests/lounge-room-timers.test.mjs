import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LoungeRoom,
  READY_LIMIT_MS,
  REJECT,
  TURN_LIMIT_MS,
  LOOK_THROTTLE_MS,
  snapshotNextDue,
} from '../app/lounge-room.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { defaultLook } from '../app/lounge-look.ts';
import { ALL_CARDS, cardInfo } from '../app/lounge-gostop.ts';

const T0 = Date.UTC(2026, 8, 24, 3, 0, 0);

function room(count) {
  const ids = Array.from({ length: count }, () => crypto.randomUUID());
  const r = LoungeRoom.hosted(null, newLoungeLedger(), 'TIMERROOM', ids[0]);
  ids.forEach((id, actor) => r.hostedJoin(id, actor, defaultLook(actor)));
  return { r, ids };
}
const view = (r, id) => r.hostedPacket(id);
function start(r, ids, game, stake = 1000, now = T0) {
  const [host, ...rest] = ids;
  assert.equal(
    r.hostedAttempt(
      host,
      { kind: 'invite', game, players: rest, required: ids.length, stake },
      now,
    ),
    '',
  );
  const invite = view(r, host).invites.find(
    (i) => i.game === game && i.status === 'waiting',
  );
  for (const id of rest)
    assert.equal(
      r.hostedAttempt(id, { kind: 'reply', id: invite.id, accept: true }, now),
      '',
    );
  return view(r, host)[game];
}
const active = (r, game) => {
  const g = view(r, r.hostedSnapshot().players[0].id)[game];
  return game === 'chess' ? !g.winner : g.phase !== 'over';
};
/** Let the server clocks and dealer steps finish the round. */
function playOut(r, game, now) {
  for (let i = 0; i < 400 && active(r, game); i++) {
    now += TURN_LIMIT_MS[game] + 1;
    r.hostedTick(now);
  }
  assert.equal(active(r, game), false, `${game} did not finish`);
  return now;
}
function readyAll(r, ids, game, now) {
  const matchId = view(r, ids[0]).tables[game].matchId;
  for (const id of ids)
    assert.equal(
      r.hostedAttempt(id, { kind: 'ready', game, id: matchId, ready: true }, now),
      '',
    );
  return view(r, ids[0])[game];
}
const state = (r, id) => r.hostedLedger().games[id]?.state;

test('turn deadlines are exposed and the server acts on expiry for every game', () => {
  // Poker: heads-up SB faces the big blind, cannot check, so it folds.
  {
    const { r, ids } = room(2);
    const g = start(r, ids, 'poker');
    assert.equal(g.turnDeadline, T0 + TURN_LIMIT_MS.poker);
    r.hostedTick(T0 + TURN_LIMIT_MS.poker - 1);
    assert.equal(view(r, ids[0]).poker.revision, g.revision);
    r.hostedTick(T0 + TURN_LIMIT_MS.poker);
    const after = view(r, ids[0]).poker;
    assert.equal(after.phase, 'over');
    assert.equal(after.folded[g.turn], true);
    assert.equal(state(r, g.id), 'settled');
  }
  // Seotda: the first player may check, so the clock checks.
  {
    const { r, ids } = room(2);
    const g = start(r, ids, 'seotda', 10000);
    assert.equal(g.turnDeadline, T0 + TURN_LIMIT_MS.seotda);
    r.hostedTick(T0 + TURN_LIMIT_MS.seotda);
    const after = view(r, ids[0]).seotda;
    assert.equal(after.events.at(-1).kind, 'check');
    assert.equal(after.folded.some(Boolean), false);
  }
  // Blackjack: stand.
  {
    const { r, ids } = room(2);
    const g = start(r, ids, 'blackjack');
    if (g.phase === 'players') {
      assert.equal(g.turnDeadline, T0 + TURN_LIMIT_MS.blackjack);
      const turn = g.turn,
        hand = g.hand;
      r.hostedTick(T0 + TURN_LIMIT_MS.blackjack);
      const after = view(r, ids[0]).blackjack;
      assert.equal(after.hands[turn][hand].status, 'stood');
      assert.equal(after.event.kind, 'stand');
    }
  }
  // Go-stop: the practice AI plays one turn.
  {
    const { r, ids } = room(3);
    const g = start(r, ids, 'gostop', 10000);
    if (g.phase !== 'over') {
      assert.equal(g.turnDeadline, T0 + TURN_LIMIT_MS.gostop);
      r.hostedTick(T0 + TURN_LIMIT_MS.gostop);
      assert.ok(view(r, ids[0]).gostop.revision > g.revision);
    }
  }
  // Chess: white lets two minutes pass and loses on time.
  {
    const { r, ids } = room(2);
    const g = start(r, ids, 'chess');
    assert.equal(g.turnDeadline, T0 + TURN_LIMIT_MS.chess);
    r.hostedTick(T0 + TURN_LIMIT_MS.chess);
    const after = view(r, ids[0]).chess;
    assert.equal(after.winner, 'b');
    assert.equal(after.reason, '시간 초과');
    assert.equal(state(r, g.id), 'settled');
  }
});

test('a move restarts the clock for the next player', () => {
  const { r, ids } = room(2);
  const g = start(r, ids, 'chess');
  const later = T0 + 30_000;
  assert.equal(
    r.hostedAttempt(
      ids[0],
      { kind: 'chess', id: g.id, ply: 0, from: 'e2', to: 'e4' },
      later,
    ),
    '',
  );
  assert.equal(view(r, ids[0]).chess.turnDeadline, later + TURN_LIMIT_MS.chess);
  assert.equal(snapshotNextDue(r.hostedSnapshot()), later + TURN_LIMIT_MS.chess);
});

test('ready check: deadline is exposed, expiry removes non-ready members and dissolves the table', () => {
  const { r, ids } = room(2);
  const g = start(r, ids, 'chess');
  assert.equal(r.hostedAttempt(ids[0], { kind: 'resign', id: g.id }, T0), '');
  const table = view(r, ids[0]).tables.chess;
  assert.equal(table.readyDeadline, T0 + READY_LIMIT_MS);
  assert.equal(
    r.hostedAttempt(ids[0], { kind: 'ready', game: 'chess', id: g.id, ready: true }, T0 + 1000),
    '',
  );
  r.hostedTick(T0 + READY_LIMIT_MS - 1);
  assert.ok(view(r, ids[0]).tables.chess);
  r.hostedTick(T0 + READY_LIMIT_MS);
  assert.equal(view(r, ids[0]).tables.chess, undefined);
  // The game can be requested again by anyone.
  assert.equal(
    r.hostedAttempt(
      ids[1],
      { kind: 'invite', game: 'chess', players: [ids[0]], stake: 1000 },
      T0 + READY_LIMIT_MS + 1,
    ),
    '',
  );
});

test('go-stop: leaving mid-round marks the seat away and auto-plays to a real settlement', () => {
  const { r, ids } = room(3);
  let g = start(r, ids, 'gostop', 10000);
  if (g.phase === 'over') return; // 총통 or a floor redeal at the deal.
  assert.equal(r.hostedAttempt(ids[1], { kind: 'stand', game: 'gostop', id: g.id }, T0), '');
  g = view(r, ids[0]).gostop;
  assert.notEqual(g.phase, 'over');
  assert.deepEqual(g.away, [1]);
  assert.deepEqual(view(r, ids[0]).seats.gostop, ids);
  // The departed seat can no longer act.
  const own = r.hostedSnapshot().go;
  if (own.turn === 1)
    assert.equal(
      r.hostedAttempt(ids[1], { kind: 'gostop', id: g.id, ply: g.ply, action: { kind: 'play', card: own.hands[1][0] } }, T0),
      REJECT.away,
    );
  playOut(r, 'gostop', T0);
  assert.equal(state(r, g.id), 'settled');
  const over = view(r, ids[0]).gostop;
  assert.ok(Array.isArray(over.beom));
  validateLedger(r.hostedLedger());
});

test('empty room: reserved games are auto-completed and settled, never voided', () => {
  // Blackjack after the dealer reveal: everyone leaving no longer refunds.
  for (let attempt = 0; attempt < 20; attempt++) {
    const { r, ids } = room(2);
    let g = start(r, ids, 'blackjack');
    let now = T0;
    while (g.phase === 'players') {
      const id = ids[g.turn];
      assert.equal(
        r.hostedAttempt(id, { kind: 'blackjack', id: g.id, revision: g.revision, action: { kind: 'stand' } }, now),
        '',
      );
      g = view(r, ids[0]).blackjack;
    }
    now += 1200;
    r.hostedTick(now);
    now += 1200;
    r.hostedTick(now);
    for (const id of ids) r.hostedDrop(id);
    r.hostedClose(now);
    assert.equal(state(r, g.id), 'settled');
    const escrow = r.hostedLedger().games[g.id];
    assert.equal(r.hostedLedger().houseBalance, -escrow.result.reduce((a, b) => a + b, 0));
    validateLedger(r.hostedLedger());
    break;
  }
  for (const [game, players, stake] of [
    ['poker', 3, 10000],
    ['seotda', 3, 10000],
    ['gostop', 3, 10000],
  ]) {
    const { r, ids } = room(players);
    const g = start(r, ids, game, stake);
    for (const id of ids) r.hostedDrop(id);
    r.hostedClose(T0 + 1);
    assert.equal(state(r, g.id), 'settled', game);
    validateLedger(r.hostedLedger());
  }
  // Chess: no move yet -> draw at zero; after a move the side to move loses.
  {
    const { r, ids } = room(2);
    const g = start(r, ids, 'chess');
    for (const id of ids) r.hostedDrop(id, 'expired');
    r.hostedClose(T0);
    assert.equal(state(r, g.id), 'settled');
    assert.deepEqual(r.hostedLedger().games[g.id].result, [0, 0]);
  }
  {
    const { r, ids } = room(2);
    const g = start(r, ids, 'chess');
    r.hostedAttempt(ids[0], { kind: 'chess', id: g.id, ply: 0, from: 'e2', to: 'e4' }, T0);
    for (const id of ids) r.hostedDrop(id, 'expired');
    r.hostedClose(T0);
    assert.deepEqual(r.hostedLedger().games[g.id].result, [1000, -1000]);
  }
});

test('rematches rotate the poker button, seotda first seat, chess colours and go-stop first player', () => {
  {
    const { r, ids } = room(3);
    let g = start(r, ids, 'poker', 10000);
    const dealers = [g.dealer];
    let now = T0;
    for (let round = 2; round <= 4; round++) {
      now = playOut(r, 'poker', now);
      g = readyAll(r, ids, 'poker', now);
      dealers.push(g.dealer);
    }
    assert.deepEqual(dealers, [0, 1, 2, 0]);
  }
  {
    const { r, ids } = room(3);
    let g = start(r, ids, 'seotda', 10000);
    const firsts = [g.first];
    let now = T0;
    for (let round = 2; round <= 3; round++) {
      now = playOut(r, 'seotda', now);
      g = readyAll(r, ids, 'seotda', now);
      firsts.push(g.first);
    }
    assert.deepEqual(firsts, [0, 1, 2]);
  }
  {
    const { r, ids } = room(2);
    let g = start(r, ids, 'chess');
    assert.deepEqual(view(r, ids[0]).seats.chess, ids);
    r.hostedAttempt(ids[0], { kind: 'resign', id: g.id }, T0);
    g = readyAll(r, ids, 'chess', T0);
    assert.deepEqual(view(r, ids[0]).seats.chess, [ids[1], ids[0]]);
    // Names follow the seats, and the escrow wallet order matches colours.
    assert.deepEqual(r.hostedLedger().games[g.id].wallets, [
      'wallet-' + ids[1],
      'wallet-' + ids[0],
    ]);
    r.hostedAttempt(ids[1], { kind: 'resign', id: g.id }, T0);
    assert.deepEqual(r.hostedLedger().games[g.id].result, [-1000, 1000]);
    readyAll(r, ids, 'chess', T0);
    assert.deepEqual(view(r, ids[0]).seats.chess, ids);
  }
  {
    const { r, ids } = room(3);
    start(r, ids, 'gostop', 10000);
    let now = T0;
    for (let round = 2; round <= 4; round++) {
      now = playOut(r, 'gostop', now);
      const prev = r.hostedSnapshot().go;
      const expected =
        prev.winner !== null ? ids[prev.winner] : ids[prev.first ?? 0];
      readyAll(r, ids, 'gostop', now);
      const next = r.hostedSnapshot().go;
      assert.equal(ids[next.first], expected);
      if (next.phase !== 'over') assert.equal(next.turn, next.first);
    }
  }
});

test('poker blinds scale with the buy-in', () => {
  for (const [stake, bb] of [
    [1000, 200],
    [10000, 200],
    [20000, 400],
  ]) {
    const { r, ids } = room(2);
    const g = start(r, ids, 'poker', stake);
    assert.equal(g.bigBlind, bb);
    assert.equal(g.smallBlind, bb / 2);
  }
});

test('chess: draw offers can be accepted or declined; one offer per ply', () => {
  const { r, ids } = room(2);
  const g = start(r, ids, 'chess');
  assert.equal(r.hostedAttempt(ids[0], { kind: 'draw', id: g.id, op: 'offer' }, T0), '');
  assert.equal(view(r, ids[1]).chess.drawOffer, 0);
  assert.equal(r.hostedAttempt(ids[0], { kind: 'draw', id: g.id, op: 'accept' }, T0), REJECT.drawOffer);
  assert.equal(r.hostedAttempt(ids[1], { kind: 'draw', id: g.id, op: 'decline' }, T0), '');
  assert.equal(view(r, ids[1]).chess.drawOffer, null);
  assert.equal(r.hostedAttempt(ids[0], { kind: 'draw', id: g.id, op: 'offer' }, T0), REJECT.drawOffer);
  assert.equal(r.hostedAttempt(ids[1], { kind: 'draw', id: g.id, op: 'offer' }, T0), '');
  assert.equal(r.hostedAttempt(ids[0], { kind: 'draw', id: g.id, op: 'accept' }, T0), '');
  const over = view(r, ids[0]).chess;
  assert.equal(over.winner, 'draw');
  assert.deepEqual(r.hostedLedger().games[g.id].result, [0, 0]);
});

test('chess: connection expiry keeps the seat; the move clock, not the lease, decides', () => {
  const { r, ids } = room(2);
  const g = start(r, ids, 'chess');
  r.hostedDrop(ids[1], 'expired');
  let c = view(r, ids[0]).chess;
  assert.equal(c.winner, null);
  assert.deepEqual(c.away, [1]);
  assert.deepEqual(view(r, ids[0]).seats.chess, ids);
  // Rejoining restores play.
  r.hostedJoin(ids[1], 1, defaultLook(1));
  assert.deepEqual(view(r, ids[0]).chess.away, []);
  r.hostedAttempt(ids[0], { kind: 'chess', id: g.id, ply: 0, from: 'e2', to: 'e4' }, T0);
  assert.equal(
    r.hostedAttempt(ids[1], { kind: 'chess', id: g.id, ply: 1, from: 'e7', to: 'e5' }, T0),
    '',
  );
  // An explicit leave still resigns.
  r.hostedDrop(ids[0], 'left');
  c = view(r, ids[1]).chess;
  assert.equal(c.winner, 'b');
});

test('views expose host, invite declines and away seats', () => {
  const { r, ids } = room(3);
  r.hostedAttempt(ids[0], { kind: 'invite', game: 'poker', players: [ids[1], ids[2]], required: 2, stake: 1000 }, T0);
  const invite = view(r, ids[0]).invites[0];
  assert.equal(r.hostedAttempt(ids[2], { kind: 'reply', id: invite.id, accept: false }, T0), '');
  const packet = view(r, ids[1]);
  assert.equal(packet.host, ids[0]);
  assert.deepEqual(packet.invites[0].declined, [ids[2]]);
  assert.equal(r.hostedAttempt(ids[1], { kind: 'reply', id: invite.id, accept: true }, T0), '');
  const g = view(r, ids[0]).poker;
  r.hostedAttempt(ids[1], { kind: 'stand', game: 'poker', id: g.id }, T0);
  assert.deepEqual(view(r, ids[0]).poker.away, [1]);
  // The host role moves on when the opener leaves.
  r.hostedDrop(ids[0]);
  assert.equal(view(r, ids[1]).host, ids[1]);
});

test('area contract: optional coordinates, per-area defaults and area-scoped chat', () => {
  const { r, ids } = room(2);
  assert.equal(r.hostedAttempt(ids[0], { kind: 'area', area: 'village', x: 12, y: 34 }, T0), '');
  let me = view(r, ids[0]).players.find((p) => p.id === ids[0]);
  assert.deepEqual([me.area, me.x, me.y], ['village', 12, 34]);
  assert.equal(r.hostedAttempt(ids[0], { kind: 'area', area: 'village', x: 500 }, T0), '');
  me = view(r, ids[0]).players.find((p) => p.id === ids[0]);
  assert.deepEqual([me.x, me.y], [50, 60]);
  for (const area of ['wardrobe', 'home', 'casino', 'lounge'])
    assert.equal(r.hostedAttempt(ids[1], { kind: 'area', area }, T0), '');
  assert.equal(r.hostedAttempt(ids[1], { kind: 'area', area: 'moon' }, T0), REJECT.area);
  assert.equal(r.hostedAttempt(ids[0], { kind: 'chat', text: '마을 안녕' }, T0), '');
  assert.equal(r.hostedAttempt(ids[1], { kind: 'chat', text: '회관 안녕' }, T0), '');
  assert.deepEqual(view(r, ids[0]).chat.map((c) => c.text), ['마을 안녕']);
  assert.deepEqual(view(r, ids[1]).chat.map((c) => c.text), ['회관 안녕']);
  assert.equal(view(r, ids[0]).chat[0].scope, 'village');
});

test('specific rejection reasons replace the generic state-changed message', () => {
  const { r, ids } = room(2);
  assert.equal(r.hostedAttempt(ids[0], { kind: 'chat', text: 'a' }, T0), '');
  assert.equal(r.hostedAttempt(ids[0], { kind: 'chat', text: 'b' }, T0 + 100), REJECT.chat);
  const g = start(r, ids, 'poker', 1000, T0 + 1000);
  const idle = ids[g.turn === 0 ? 1 : 0];
  assert.equal(
    r.hostedAttempt(idle, { kind: 'poker', id: g.id, revision: g.revision, action: { kind: 'fold' } }, T0),
    REJECT.notTurn,
  );
  assert.equal(
    r.hostedAttempt(idle, { kind: 'poker', id: g.id, revision: g.revision - 1, action: { kind: 'fold' } }, T0),
    REJECT.stale,
  );
  assert.equal(
    r.hostedAttempt(ids[0], { kind: 'invite', game: 'chess', players: [ids[1]], stake: 20000 }, T0),
    REJECT.busy,
  );
});

test('look changes are throttled per member and coalesced to the latest', () => {
  const { r, ids } = room(1);
  const a = { ...defaultLook(0), hair: 'a' },
    b = { ...defaultLook(0), hair: 'b' };
  assert.equal(r.hostedAttempt(ids[0], { kind: 'look', look: defaultLook(0) }, T0), '');
  assert.equal(r.hostedCoalesced, false);
  assert.equal(r.hostedAttempt(ids[0], { kind: 'look', look: a }, T0 + 50), '');
  assert.equal(r.hostedCoalesced, true);
  assert.equal(r.hostedAttempt(ids[0], { kind: 'look', look: b }, T0 + 100), '');
  assert.equal(r.hostedSnapshot().pendingLooks.length, 1);
  assert.equal(snapshotNextDue(r.hostedSnapshot()), T0 + LOOK_THROTTLE_MS);
  r.hostedTick(T0 + LOOK_THROTTLE_MS);
  assert.equal(r.hostedSnapshot().pendingLooks.length, 0);
});

test('snapshots stored before these fields existed still load and tick', () => {
  const { r, ids } = room(3);
  const g = start(r, ids, 'gostop', 10000);
  const snap = r.hostedSnapshot();
  for (const key of ['goAway', 'chessAway', 'deadlines', 'lookAt', 'pendingLooks'])
    delete snap[key];
  if (snap.go) {
    snap.go.events = snap.go.events.map((e) => e.text);
    delete snap.go.first;
  }
  for (const p of snap.players) p.area = 'lounge';
  delete snap.tables;
  const restored = LoungeRoom.hosted(snap, r.hostedLedger());
  restored.hostedTick(T0 + 1);
  const v = restored.hostedPacket(ids[0]);
  assert.equal(v.gostop.id, g.id);
  assert.ok(v.gostop.events.every((e) => typeof e.text === 'string'));
  assert.ok(ALL_CARDS.every((c) => cardInfo(c)));
});
