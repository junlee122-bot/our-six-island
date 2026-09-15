import assert from 'node:assert/strict';
import { LoungeRoom } from '../app/lounge-room.ts';
import { defaultLook } from '../app/lounge-look.ts';
import { goPracticeAction } from '../app/lounge-gostop.ts';
const rooms = [],
  sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wait = async (fn, label) => {
  const until = Date.now() + 40000;
  while (!fn()) {
    if (Date.now() > until)
      throw new Error(
        label +
          ' timeout: ' +
          JSON.stringify(
            rooms.map((r) => ({
              status: r.view.status,
              error: r.view.error,
              players: r.view.players.length,
              claiming: r.view.claiming,
            })),
          ),
      );
    await sleep(100);
  }
};
const add = () => {
  const r = new LoungeRoom();
  rooms.push(r);
  return r;
};
try {
  const host = add();
  await host.start('host', '', 6, defaultLook(6));
  assert.equal(host.view.status, 'connected');
  console.log('Lounge host connected.');
  const guests = Array.from({ length: 6 }, add);
  await Promise.all(
    guests.map((r, i) => r.start('guest', host.view.code, i, defaultLook(i))),
  );
  await wait(
    () => guests.every((r) => r.view.status === 'selecting'),
    'guest selection',
  );
  guests[0].claim(0, defaultLook(0));
  guests[1].claim(0, defaultLook(0));
  await wait(
    () =>
      [guests[0], guests[1]].filter((r) => r.view.status === 'connected')
        .length === 1 &&
      [guests[0], guests[1]].some(
        (r) => r.view.status === 'selecting' && r.view.error,
      ),
    'atomic identity claim',
  );
  const loser = [guests[0], guests[1]].find(
    (r) => r.view.status === 'selecting',
  );
  loser.claim(1, defaultLook(1));
  for (let i = 2; i < 6; i++) guests[i].claim(i, defaultLook(i));
  await wait(
    () =>
      rooms.every(
        (r) => r.view.status === 'connected' && r.view.players.length === 7,
      ),
    'seven peers',
  );
  console.log('Seven peers connected with exclusive characters.');
  assert(rooms.every((r) => r.view.wallet.balance === 100000));
  guests[0].action({
    kind: 'look',
    look: { ...defaultLook(0), collection: 'street', hair: 'rose' },
  });
  await wait(
    () =>
      rooms.every(
        (r) =>
          r.view.players.find((p) => p.id === guests[0].view.self)?.look
            .collection === 'street',
      ),
    'shared 2D outfit',
  );
  const daowon = rooms.find(
    (r) => r.view.players.find((p) => p.id === r.view.self)?.actor === 0,
  );
  daowon.action({
    kind: 'look',
    look: {
      ...defaultLook(0),
      collection: 'miku',
      hairstyle: 'buns',
      hat: 'hachimaki',
    },
  });
  await wait(
    () =>
      rooms.every((r) => {
        const l = r.view.players.find((p) => p.id === daowon.view.self)?.look;
        return (
          l?.collection === 'miku' &&
          l.hairstyle === 'buns' &&
          l.hat === 'hachimaki'
        );
      }),
    'Daowon costume and hairstyle synchronization',
  );
  console.log(
    'Daowon costume, bun hair and hachimaki synchronized across all peers.',
  );
  assert(
    host.action({
      kind: 'invite',
      game: 'gostop',
      players: guests.slice(0, 3).map((r) => r.view.self),
    }),
  );
  await wait(
    () => guests[0].view.invites.some((r) => r.status === 'waiting'),
    'Go invitation',
  );
  const goInvite = host.view.invites.find((r) => r.game === 'gostop');
  guests[0].action({ kind: 'reply', id: goInvite.id, accept: true });
  guests[1].action({ kind: 'reply', id: goInvite.id, accept: true });
  await wait(() => rooms.every((r) => r.view.gostop?.id), 'Go start');
  assert.equal(host.view.seats.gostop[0], host.view.self);
  // Guests are seated in the order their consent arrives over the network.
  assert.deepEqual(
    new Set(host.view.seats.gostop.slice(1)),
    new Set([guests[0].view.self, guests[1].view.self]),
  );
  for (const r of rooms)
    assert.deepEqual(r.view.seats.gostop, host.view.seats.gostop);
  assert.equal(guests[2].view.gostop.hand.length, 0);
  assert.equal(guests[0].view.gostop.hand.length, 7);
  assert.notDeepEqual(guests[0].view.gostop.hand, guests[1].view.gostop.hand);
  guests[2].action({
    kind: 'invite',
    game: 'chess',
    players: [guests[3].view.self],
  });
  await wait(
    () =>
      guests[3].view.invites.some(
        (r) => r.game === 'chess' && r.status === 'waiting',
      ),
    'Chess invitation',
  );
  const chessInvite = guests[3].view.invites.find((r) => r.game === 'chess');
  guests[3].action({ kind: 'reply', id: chessInvite.id, accept: true });
  await wait(() => rooms.every((r) => r.view.chess?.id), 'Chess start');
  console.log(
    'Two invited games started concurrently; spectator has no hidden hand.',
  );
  for (const [r, from, to] of [
    [guests[2], 'f2', 'f3'],
    [guests[3], 'e7', 'e5'],
    [guests[2], 'g2', 'g4'],
    [guests[3], 'd8', 'h4'],
  ]) {
    const g = r.view.chess,
      ply = g.moves.length;
    r.action({ kind: 'chess', id: g.id, ply, from, to });
    await wait(
      () => rooms.every((v) => v.view.chess?.moves.length === ply + 1),
      'Chess move ' + from + to,
    );
  }
  assert(rooms.every((r) => r.view.chess.winner === 'b'));
  console.log('Shared checkmate and move history verified.');
  let steps = 0;
  while (host.view.gostop.phase !== 'over') {
    assert(++steps < 110);
    const state = host.view.gostop,
      seat = state.turn,
      r = rooms.find((r) => r.view.self === host.view.seats.gostop[seat]);
    const before = JSON.stringify([
      state.ply,
      state.turn,
      state.phase,
      state.options,
      state.handCounts,
    ]);
    r.action({
      kind: 'gostop',
      id: state.id,
      ply: state.ply,
      action: goPracticeAction(r.view.gostop),
    });
    await wait(
      () =>
        rooms.every(
          (v) =>
            JSON.stringify([
              v.view.gostop.ply,
              v.view.gostop.turn,
              v.view.gostop.phase,
              v.view.gostop.options,
              v.view.gostop.handCounts,
            ]) !== before,
        ),
      'Go action ' + steps,
    );
  }
  assert(rooms.every((r) => r.view.gostop.phase === 'over'));
  assert.equal(
    host.view.gostop.result.reduce((a, b) => a + b, 0),
    0,
  );
  console.log(
    'Go-Stop round completed through real encrypted player actions:',
    steps,
  );
  assert(
    host.action({
      kind: 'invite',
      game: 'poker',
      players: guests.map((r) => r.view.self),
      required: 7,
      stake: 10000,
    }),
  );
  await wait(
    () =>
      rooms.every((r) =>
        r.view.invites.some(
          (i) => i.game === 'poker' && i.status === 'waiting',
        ),
      ),
    'poker invitation',
  );
  const pokerInvite = host.view.invites.find((i) => i.game === 'poker');
  for (const guest of guests)
    guest.action({ kind: 'reply', id: pokerInvite.id, accept: true });
  await wait(
    () => rooms.every((r) => r.view.poker?.id),
    'seven-seat poker start',
  );
  assert(
    rooms.every(
      (r) => r.view.wallet.held === 10000 && r.view.poker.hand.length === 2,
    ),
  );
  for (const r of rooms) {
    assert(!('deck' in r.view.poker));
    assert(!('hands' in r.view.poker));
  }
  let pokerActions = 0;
  while (host.view.poker.phase !== 'over') {
    const state = host.view.poker;
    if (state.turn < 0) {
      await wait(
        () => host.view.poker.revision > state.revision,
        'automatic dealer',
      );
      continue;
    }
    await wait(
      () =>
        rooms.every((r) => r.view.poker.revision === host.view.poker.revision),
      'poker revision sync',
    );
    const actor = rooms.find(
      (r) => r.view.self === host.view.seats.poker[host.view.poker.turn],
    );
    const g = actor.view.poker;
    assert(++pokerActions < 100);
    actor.action({
      kind: 'poker',
      id: g.id,
      revision: g.revision,
      action: { kind: g.legal.canCheck ? 'check' : 'call' },
    });
    await wait(() => host.view.poker.revision > g.revision, 'poker action');
  }
  await wait(
    () =>
      rooms.every(
        (r) => r.view.poker.phase === 'over' && r.view.wallet.held === 0,
      ),
    'poker settlement',
  );
  assert.equal(
    rooms.reduce((total, r) => total + r.view.wallet.balance, 0),
    700000,
  );
  assert(
    rooms.every((r) =>
      r.view.wallet.history.some((h) => h.id === host.view.poker.id),
    ),
  );
  console.log(
    'Seven-seat poker, automatic dealer, private cards and shared Beom settlement verified.',
  );
  host.action({
    kind: 'invite',
    game: 'blackjack',
    players: guests.map((r) => r.view.self),
    required: 7,
    stake: 1000,
  });
  await wait(
    () =>
      guests.every((r) =>
        r.view.invites.some(
          (i) => i.game === 'blackjack' && i.status === 'waiting',
        ),
      ),
    'blackjack invitation',
  );
  const bjInvite = host.view.invites.find((i) => i.game === 'blackjack');
  for (const guest of guests)
    guest.action({ kind: 'reply', id: bjInvite.id, accept: true });
  await wait(
    () => rooms.every((r) => r.view.blackjack?.id),
    'seven-seat blackjack start',
  );
  assert(rooms.every((r) => r.view.wallet.held === 4000));
  let bjActions = 0;
  while (host.view.blackjack.phase !== 'over') {
    await wait(
      () =>
        rooms.every(
          (r) => r.view.blackjack.revision === host.view.blackjack.revision,
        ),
      'blackjack revision sync',
    );
    const state = host.view.blackjack;
    for (const r of rooms) {
      assert(!('deck' in r.view.blackjack));
      if (['players', 'reveal'].includes(state.phase))
        assert.equal(r.view.blackjack.dealer[1], null);
    }
    if (state.phase !== 'players') {
      await wait(
        () => host.view.blackjack.revision > state.revision,
        'blackjack automatic dealer',
      );
      continue;
    }
    const actor = rooms.find(
      (r) => r.view.self === host.view.seats.blackjack[state.turn],
    );
    const legal = actor.view.blackjack.legal;
    const kind = legal.split ? 'split' : legal.double ? 'double' : 'stand';
    assert(++bjActions < 80);
    actor.action({
      kind: 'blackjack',
      id: state.id,
      revision: state.revision,
      action: { kind },
    });
    await wait(
      () => host.view.blackjack.revision > state.revision,
      'blackjack action',
    );
  }
  await wait(
    () =>
      rooms.every(
        (r) => r.view.blackjack.phase === 'over' && r.view.wallet.held === 0,
      ),
    'blackjack wallet settlement',
  );
  assert.equal(
    rooms.reduce((n, r) => n + r.view.wallet.balance, 0) +
      (host.bank.ledger.houseBalance ?? 0),
    700000,
  );
  assert(
    rooms.every((r) =>
      r.view.wallet.history.some((h) => h.id === host.view.blackjack.id),
    ),
  );
  console.log(
    'Seven-seat blackjack, dealer hole privacy, doubles and casino Beom settlement verified.',
  );
  for (let i = 0; i < 12; i++) {
    host.lastChat.clear();
    host.action({ kind: 'chat', text: '가'.repeat(120) });
    await sleep(150);
  }
  await wait(
    () => rooms.every((r) => r.view.chat.length === 12),
    'maximum Korean chat snapshot',
  );
  const returning = guests[5],
    priorBalance = returning.view.wallet.balance,
    priorActor = returning.view.players.find(
      (p) => p.id === returning.view.self,
    ).actor;
  returning.leave();
  await wait(() => host.view.players.length === 6, 'departed role release');
  await returning.start(
    'guest',
    host.view.code,
    priorActor,
    defaultLook(priorActor),
  );
  await wait(
    () => returning.view.status === 'selecting',
    'returning wallet selection',
  );
  returning.claim(priorActor, defaultLook(priorActor));
  await wait(() => returning.view.status === 'connected', 'returning wallet');
  assert.equal(returning.view.wallet.balance, priorBalance);
  host.leave();
  await wait(
    () =>
      rooms.filter((r) => r !== host).every((r) => r.view.status === 'error'),
    'host close',
  );
  console.log(
    JSON.stringify({
      sevenClients: true,
      exclusiveCharacters: true,
      shared2dOutfits: true,
      invitations: true,
      concurrentGames: true,
      chessCheckmate: true,
      goStopComplete: true,
      sevenSeatPoker: true,
      sevenSeatBlackjack: true,
      automaticDealer: true,
      sharedBeom: true,
      returningWallet: true,
      privateHands: true,
      koreanChat: true,
      departures: true,
    }),
  );
} finally {
  for (const r of rooms) r.leave();
  await sleep(600);
}
