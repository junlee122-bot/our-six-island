import test from 'node:test';
import assert from 'node:assert/strict';
import { LoungeRoom, READY_LIMIT_MS, REJECT } from '../app/lounge-room.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { defaultLook } from '../app/lounge-look.ts';

function finishedChess() {
  const ids = Array.from({ length: 4 }, () => crypto.randomUUID());
  const [a, b, c, d] = ids;
  const room = LoungeRoom.hosted(null, newLoungeLedger(), 'FILLROOMAB', a);
  ids.forEach((id, actor) => room.hostedJoin(id, actor, defaultLook(actor)));
  let now = Date.now();
  const act = (id, action) => room.hostedAttempt(id, action, now);
  assert.equal(act(a, { kind: 'invite', game: 'chess', players: [b], stake: 1000 }), '');
  const inv = room.hostedPacket(a).invites.find((r) => r.status === 'waiting');
  assert.equal(act(b, { kind: 'reply', id: inv.id, accept: true }), '');
  const match = room.hostedPacket(a).chess;
  assert.equal(act(b, { kind: 'resign', id: match.id }), '');
  room.hostedTick(now);
  return {
    room,
    a,
    b,
    c,
    d,
    matchId: match.id,
    act,
    tick(ms) {
      now += ms;
      room.hostedTick(now);
    },
    get now() {
      return now;
    },
  };
}

test('빈자리에 친구 초대: an invite fills a short retained table for its next round', () => {
  const f = finishedChess();
  const { room, a, b, c, act, matchId } = f;
  assert.equal(act(b, { kind: 'stand', game: 'chess' }), '');
  let table = room.hostedPacket(a).tables.chess;
  assert.deepEqual(table.members, [a]);
  assert.equal(table.required, 2);
  // Only a table member may fill; outsiders still see the retained table.
  assert.equal(
    act(c, { kind: 'invite', game: 'chess', players: [f.d] }),
    REJECT.retained,
  );
  assert.equal(act(a, { kind: 'invite', game: 'chess', players: [c] }), '');
  const fill = room.hostedPacket(a).invites.find((r) => r.status === 'waiting');
  assert.equal(fill.fill, matchId);
  assert.equal(fill.required, 2);
  assert.equal(fill.stake, 1000);
  // A second fill for the same game waits for the first.
  assert.equal(
    act(a, { kind: 'invite', game: 'chess', players: [f.d] }),
    REJECT.pending,
  );
  assert.equal(act(c, { kind: 'reply', id: fill.id, accept: true }), '');
  const after = room.hostedPacket(a);
  assert.equal(after.invites.find((r) => r.id === fill.id).status, 'started');
  table = after.tables.chess;
  assert.deepEqual(table.members, [a, c]);
  assert.deepEqual(table.ready, [c]);
  assert.equal(after.chess.id, matchId, 'no new round until everyone is ready');
  // The inviter readies: the next round starts with the new player seated.
  assert.equal(act(a, { kind: 'ready', game: 'chess', id: matchId, ready: true }), '');
  const next = room.hostedPacket(a);
  assert.notEqual(next.chess.id, matchId);
  assert.equal(next.chess.winner, null);
  assert.deepEqual(new Set(next.seats.chess), new Set([a, c]));
  assert.equal(next.tables.chess.round, 2);
  validateLedger(room.hostedLedger());
});

test('a declined fill cancels; an unfilled short table dissolves at the ready deadline', () => {
  const f = finishedChess();
  const { room, a, b, c, act } = f;
  assert.equal(act(b, { kind: 'stand', game: 'chess' }), '');
  assert.equal(act(a, { kind: 'invite', game: 'chess', players: [c] }), '');
  const fill = room.hostedPacket(a).invites.find((r) => r.status === 'waiting');
  assert.equal(act(c, { kind: 'reply', id: fill.id, accept: false }), '');
  assert.equal(
    room.hostedPacket(a).invites.find((r) => r.id === fill.id).status,
    'cancelled',
  );
  assert.deepEqual(room.hostedPacket(a).tables.chess.members, [a]);
  f.tick(READY_LIMIT_MS + 1);
  assert.equal(room.hostedPacket(a).tables.chess, undefined);
  // Now anyone may open a fresh chess invite.
  assert.equal(act(c, { kind: 'invite', game: 'chess', players: [f.d], stake: 1000 }), '');
});

test('a waiting fill invite is cancelled when its table dissolves', () => {
  const f = finishedChess();
  const { room, a, b, c, act } = f;
  assert.equal(act(b, { kind: 'stand', game: 'chess' }), '');
  assert.equal(act(a, { kind: 'invite', game: 'chess', players: [c] }), '');
  const fill = room.hostedPacket(a).invites.find((r) => r.status === 'waiting');
  assert.equal(act(a, { kind: 'stand', game: 'chess' }), '');
  f.tick(1);
  const invite = room.hostedPacket(c).invites.find((r) => r.id === fill.id);
  assert.notEqual(invite.status, 'waiting');
  assert.equal(act(c, { kind: 'reply', id: fill.id, accept: true }), REJECT.invite);
});
