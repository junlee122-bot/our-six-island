import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { chessBoard, chessInsufficientFor, chessMove, chessTimeout, newChess } from '../app/lounge-chess.ts';
import { LoungeRoom, TURN_LIMIT_MS } from '../app/lounge-room.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { defaultLook } from '../app/lounge-look.ts';

const minorClockMoves = 'b1c3 a7a6 a2a4 a6a5 a1a3 d7d5 a3b3 c8f5 b3b7 f5c2 c3d5 c2d1 d5c7 d8c7 e1d1 b8a6 b7a7 a8a7 e2e4 c7h2 h1h2 f7f5 e4f5 a6c7 h2h7 h8h7 g1f3 a7b7 f3e5 b7b2 c1b2 h7h1 f2f3 h1f1 d1e2 f1f3 e5f3 c7a6 b2g7 f8g7 e2d1 g7a1 d2d4 a1d4 f3d4 e7e6 f5e6 a6c5 d4c2 c5a4 e6e7 e8e7 c2e3 e7f7 g2g3 f7g6 e3c4 g8e7 c4a5 e7c8 d1d2 g6g7 a5b3 c8d6 d2d1 g7g6 b3a5 d6e8 a5b7 e8d6 b7d6 g6g7'.split(' ');

test('a lone minor can mate with the defender’s help: legal mate witnesses', () => {
  for (const [fen, move] of [
    // The h7 pawn blocks its king; it cannot capture the knight on f7.
    ['5k1K/7P/3n4/8/8/8/8/8 b - - 0 1', 'Nf7#'],
    // The defending bishop is on the other square colour and blocks h2.
    ['8/8/8/8/4b3/8/5k1B/7K b - - 0 1', 'Bf3#'],
  ]) {
    const board = new Chess(fen), before = board.fen();
    assert.equal(board.isCheck(), false);
    assert.equal(chessInsufficientFor(board, 'b'), false, fen);
    assert.equal(board.fen(), before, 'classification must not change the position');
    assert.equal(board.move(move).san, move, 'the witness is a legal move');
    assert.equal(board.isCheckmate(), true, 'mate is possible, even when it cannot be forced');
  }
});

test('material draws consider both armies, defending queens and bishop square colours', () => {
  for (const fen of [
    '7k/8/8/8/8/8/8/K7 w - - 0 1', // bare king
    '7k/8/8/8/8/8/8/KN6 w - - 0 1', // one knight vs bare king
    '7k/6q1/8/8/8/8/8/KN6 w - - 0 1', // one knight vs king + queen
    '7k/8/8/8/8/8/8/KB6 w - - 0 1', // one bishop vs bare king
    '7k/6r1/8/8/8/8/8/KB6 w - - 0 1', // rook alone cannot help a bishop mate
    '7k/6q1/8/8/8/8/8/KB6 w - - 0 1',
    '7k/8/8/8/8/5b2/8/KB6 w - - 0 1', // both bishops on the same colour
    '7k/8/8/8/8/8/8/KB1B4 w - - 0 1', // even two same-colour promoted bishops
  ]) assert.equal(chessInsufficientFor(new Chess(fen), 'w'), true, fen);
  for (const fen of [
    '7k/6r1/8/8/8/8/8/KN6 w - - 0 1', // a rook can help a knight mate
    '7k/6n1/8/8/8/8/8/KN6 w - - 0 1',
    '7k/8/8/8/8/8/8/KNN5 w - - 0 1', // two knights can cooperate into mate
    '7k/8/8/8/8/4b3/8/KB6 w - - 0 1', // opposite-colour bishops
    '7k/6p1/8/8/8/8/8/KB6 w - - 0 1',
    '7k/8/8/8/8/8/8/KBB5 w - - 0 1',
  ]) assert.equal(chessInsufficientFor(new Chess(fen), 'w'), false, fen);
});

test('timeout still uses the actual side to move and never replaces a finished game', () => {
  const game = newChess('clock');
  assert.equal(chessTimeout(game).winner, 'b');
  const moved = chessMove(game, 0, 'e2', 'e4');
  assert.equal(chessTimeout(moved).winner, 'w');
  assert.deepEqual(game.moves, []);
  let mate = game;
  for (const [from, to] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]) {
    mate = chessMove(mate, mate.moves.length % 2, from, to);
  }
  assert.equal(chessBoard(mate).isCheckmate(), true);
  assert.equal(chessTimeout(mate), null);
});

test('a complete legal game no longer gives king plus knight a false timeout draw', () => {
  // Reached from the ordinary starting position, without overriding a FEN,
  // bypassing an earlier game-over condition or modifying the saved board.
  let game = newChess('minor-clock');
  for (const move of minorClockMoves) {
    game = chessMove(game, game.moves.length % 2, move.slice(0, 2), move.slice(2, 4), move[4] ?? 'q');
    assert.ok(game, move + ' is legal');
    assert.equal(game.winner, null, 'the round is still active');
  }
  assert.equal(chessBoard(game).fen(), '8/6k1/3N4/8/n7/6P1/8/3K4 w - - 1 37');
  const before = structuredClone(game), ended = chessTimeout(game);
  assert.equal(ended.winner, 'b', 'the defending white knight/pawn can help a legal selfmate');
  assert.equal(ended.reason, '시간 초과');
  assert.deepEqual(game, before, 'settlement receives a new match rather than mutated saved state');
});

test('the real room settles the minor timeout once, keeps the funded pot and rejects later moves', () => {
  const ids = [crypto.randomUUID(), crypto.randomUUID()],
    room = LoungeRoom.hosted(null, newLoungeLedger(), 'MINORCLOCK', ids[0]);
  ids.forEach((id, actor) => room.hostedJoin(id, actor, defaultLook(actor)));
  const balances = { ...room.hostedLedger().accounts }, t0 = Date.UTC(2026, 10, 27, 3);
  assert.equal(room.hostedAttempt(ids[0], { kind: 'invite', game: 'chess', players: [ids[1]], required: 2, stake: 1000 }, t0), '');
  const invite = room.hostedPacket(ids[0]).invites.at(-1);
  assert.equal(room.hostedAttempt(ids[1], { kind: 'reply', id: invite.id, accept: true }, t0), '');
  const id = room.hostedPacket(ids[0]).chess.id;
  let now = t0;
  minorClockMoves.forEach((move, ply) => {
    now += 1000;
    assert.equal(room.hostedAttempt(ids[ply % 2], { kind: 'chess', id, ply, from: move.slice(0, 2), to: move.slice(2, 4) }, now), '', move);
  });
  assert.equal(room.hostedLedger().games[id].state, 'reserved');
  room.hostedTick(now + TURN_LIMIT_MS.chess);
  assert.equal(room.hostedPacket(ids[0]).chess.winner, 'b');
  const settled = structuredClone(room.hostedLedger());
  assert.equal(settled.games[id].state, 'settled');
  assert.deepEqual(settled.games[id].result, [-1000, 1000]);
  assert.equal(settled.accounts['wallet-' + ids[0]], balances['wallet-' + ids[0]] - 1000);
  assert.equal(settled.accounts['wallet-' + ids[1]], balances['wallet-' + ids[1]] + 1000);
  validateLedger(settled);
  assert.notEqual(room.hostedAttempt(ids[0], { kind: 'chess', id, ply: minorClockMoves.length, from: 'd1', to: 'e1' }, now + TURN_LIMIT_MS.chess + 1), '');
  room.hostedTick(now + TURN_LIMIT_MS.chess * 2);
  assert.deepEqual(room.hostedLedger().accounts, settled.accounts);
  assert.deepEqual(room.hostedLedger().games[id].result, settled.games[id].result);
});
