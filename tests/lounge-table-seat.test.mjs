// Step 2 of the game-flow redesign: games start by sitting at an interior
// table (a table-forming invite: `invite` with `table`), not by an invitation card.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LoungeRoom, REJECT, snapshotNextDue } from '../app/lounge-room.ts';
import {
  TABLE_FORM_MS,
  tableIdOf,
  gameOfTable,
  TABLE_AREA,
} from '../app/lounge-games.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { defaultLook } from '../app/lounge-look.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

function hall(count = 4) {
  const ids = Array.from({ length: count }, () => crypto.randomUUID());
  const room = LoungeRoom.hosted(null, newLoungeLedger(), 'TABLEROOMA', ids[0]);
  ids.forEach((id, actor) => room.hostedJoin(id, actor, defaultLook(actor)));
  let now = Date.now();
  const act = (id, action) => room.hostedAttempt(id, action, now);
  const waiting = () =>
    room.hostedPacket(ids[0]).invites.find((r) => r.status === 'waiting');
  return {
    room,
    ids,
    act,
    waiting,
    packet: (id = ids[0]) => room.hostedPacket(id),
    advance(ms) {
      now += ms;
      room.hostedTick(now);
    },
    get now() {
      return now;
    },
  };
}
const SEOTDA = tableIdOf('seotda');

test('table ids map each game to its interior', () => {
  assert.equal(SEOTDA, 'lounge-seotda');
  assert.equal(tableIdOf('blackjack'), 'casino-blackjack');
  assert.equal(gameOfTable('casino-chess'), 'chess');
  assert.equal(gameOfTable('lounge-poker'), null);
  assert.equal(gameOfTable(undefined), null);
  assert.equal(TABLE_AREA.gostop, 'lounge');
});

test('sitting at an empty table forms it: no friends needed, nothing reserved', () => {
  const h = hall();
  const [a] = h.ids;
  assert.equal(
    h.act(a, {
      kind: 'invite',
      game: 'seotda',
      players: [],
      stake: 5000,
      required: 3,
      table: SEOTDA,
    }),
    '',
  );
  const r = h.waiting();
  assert.equal(r.table, SEOTDA);
  assert.deepEqual(r.accepted, [a]);
  assert.deepEqual(r.invited, []);
  assert.equal(r.required, 3);
  assert.equal(r.stake, 5000);
  assert.equal(r.expires, h.now + TABLE_FORM_MS);
  assert.equal(h.packet(a).wallet.held, 0);
  assert.equal(h.packet(a).seotda, null);
});

test('the table must be in my interior and be the game’s own table', () => {
  const h = hall();
  const [a] = h.ids;
  // Everyone joins in the hall ('lounge'); blackjack is in the casino.
  assert.equal(
    h.act(a, {
      kind: 'invite',
      game: 'blackjack',
      players: [],
      stake: 1000,
      required: 2,
      table: 'casino-blackjack',
    }),
    REJECT.tableArea,
  );
  assert.equal(
    h.act(a, {
      kind: 'invite',
      game: 'seotda',
      players: [],
      table: 'casino-blackjack',
    }),
    REJECT.invalid,
  );
  assert.equal(
    h.act(a, {
      kind: 'invite',
      game: 'seotda',
      players: [],
      stake: 1234,
      table: SEOTDA,
    }),
    REJECT.stake,
  );
  assert.equal(h.act(a, { kind: 'area', area: 'casino' }), '');
  assert.equal(
    h.act(a, {
      kind: 'invite',
      game: 'blackjack',
      players: [],
      stake: 1000,
      required: 2,
      table: 'casino-blackjack',
    }),
    '',
  );
});

test('calling friends, walk-up seats and the last seat starting the game', () => {
  const h = hall(4);
  const [a, b, c] = h.ids;
  h.act(a, {
    kind: 'invite',
    game: 'seotda',
    players: [],
    stake: 5000,
    required: 3,
    table: SEOTDA,
  });
  // 친구 부르기: the seated host calls b.
  assert.equal(
    h.act(a, { kind: 'invite', game: 'seotda', players: [b], table: SEOTDA }),
    '',
  );
  assert.deepEqual(h.waiting().invited, [b]);
  // A friend who is not seated cannot call anyone to it.
  assert.equal(
    h.act(c, { kind: 'invite', game: 'seotda', players: [b], table: SEOTDA }),
    REJECT.pending,
  );
  // c walks up without being called and sits.
  const id = h.waiting().id;
  assert.equal(h.act(c, { kind: 'reply', id, accept: true }), '');
  assert.deepEqual(h.waiting().accepted, [a, c]);
  assert.equal(h.packet(a).seotda, null, 'still forming');
  // The called friend is somewhere else: sitting needs being in the hall.
  assert.equal(h.act(b, { kind: 'area', area: 'village', x: 50, y: 60 }), '');
  assert.equal(h.act(b, { kind: 'reply', id, accept: true }), REJECT.tableArea);
  assert.equal(h.act(b, { kind: 'area', area: 'lounge' }), '');
  assert.equal(h.act(b, { kind: 'reply', id, accept: true }), '');
  const p = h.packet(a);
  assert.ok(p.seotda, 'the game started');
  assert.deepEqual(p.seats.seotda, [a, c, b]);
  assert.equal(p.tables.seotda.stake, 5000);
  const started = p.invites.find((r) => r.id === id);
  assert.equal(started.status, 'started');
  assert.equal(started.matchId, p.seotda.id);
  assert.equal(p.wallet.held, 5000);
  validateLedger(h.room.hostedLedger());
  // Now the table is in progress: nobody can sit.
  assert.equal(
    h.act(h.ids[3], {
      kind: 'invite',
      game: 'seotda',
      players: [],
      table: SEOTDA,
    }),
    REJECT.active,
  );
});

test('standing up leaves only my seat; the host seat passes on; the last one closes it', () => {
  const h = hall(4);
  const [a, b, c] = h.ids;
  h.act(a, {
    kind: 'invite',
    game: 'seotda',
    players: [b],
    stake: 1000,
    required: 4,
    table: SEOTDA,
  });
  const id = h.waiting().id;
  h.act(b, { kind: 'reply', id, accept: true });
  h.act(c, { kind: 'reply', id, accept: true });
  // Guest stands (cancel = leave seat).
  assert.equal(h.act(c, { kind: 'cancel', id }), '');
  assert.equal(h.waiting().id, id);
  assert.deepEqual(h.waiting().accepted, [a, b]);
  // c may sit again.
  assert.equal(h.act(c, { kind: 'reply', id, accept: true }), '');
  assert.equal(h.act(c, { kind: 'cancel', id }), '');
  // The host stands: b hosts now.
  assert.equal(h.act(a, { kind: 'cancel', id }), '');
  let r = h.waiting();
  assert.equal(r.from, b);
  assert.deepEqual(r.accepted, [b]);
  assert.ok(!r.invited.includes(b));
  // b calls again and then stands: the table closes.
  assert.equal(h.act(b, { kind: 'cancel', id }), '');
  assert.equal(h.waiting(), undefined);
  assert.equal(
    h.packet(a).invites.find((x) => x.id === id).status,
    'cancelled',
  );
});

test('a called friend saying no does not close a forming table', () => {
  const h = hall(3);
  const [a, b, c] = h.ids;
  h.act(a, {
    kind: 'invite',
    game: 'gostop',
    players: [b],
    stake: 1000,
    table: tableIdOf('gostop'),
  });
  const r = h.waiting();
  assert.equal(r.required, 3, 'go-stop is always three');
  assert.equal(h.act(b, { kind: 'reply', id: r.id, accept: false }), '');
  assert.equal(h.waiting().id, r.id);
  // Calling b again clears the answer.
  assert.equal(
    h.act(a, {
      kind: 'invite',
      game: 'gostop',
      players: [b],
      table: tableIdOf('gostop'),
    }),
    '',
  );
  assert.deepEqual(h.waiting().declined, []);
  assert.equal(h.act(c, { kind: 'reply', id: r.id, accept: true }), '');
  assert.equal(h.act(b, { kind: 'reply', id: r.id, accept: true }), '');
  assert.ok(h.packet(a).gostop);
});

test('walking out of the interior or leaving the village stands me up', () => {
  const h = hall(3);
  const [a, b, c] = h.ids;
  h.act(a, {
    kind: 'invite',
    game: 'seotda',
    players: [],
    stake: 1000,
    required: 3,
    table: SEOTDA,
  });
  const id = h.waiting().id;
  h.act(b, { kind: 'reply', id, accept: true });
  // Walking inside the hall keeps the seat.
  assert.equal(h.act(b, { kind: 'area', area: 'lounge', x: 40, y: 70 }), '');
  // The client puts a seated player on their seat around the table.
  assert.equal(h.act(b, { kind: 'move', x: 30, y: 49 }), '');
  const seatedB = h.packet(a).players.find((p) => p.id === b);
  assert.deepEqual([seatedB.x, seatedB.y], [30, 49]);
  assert.deepEqual(h.waiting().accepted, [a, b]);
  assert.equal(h.act(b, { kind: 'area', area: 'village', x: 50, y: 60 }), '');
  assert.deepEqual(h.waiting().accepted, [a]);
  // The host disconnects: c had not sat, so the table closes.
  h.room.hostedDrop(a);
  assert.equal(
    h.packet(c).invites.find((x) => x.id === id).status,
    'cancelled',
  );
});

test('a forming table expires after TABLE_FORM_MS; sits and calls restart it', () => {
  const h = hall(3);
  const [a, b] = h.ids;
  h.act(a, {
    kind: 'invite',
    game: 'seotda',
    players: [],
    stake: 1000,
    required: 3,
    table: SEOTDA,
  });
  const snap = h.room.hostedSnapshot();
  assert.equal(snapshotNextDue(snap), h.now + TABLE_FORM_MS);
  h.advance(TABLE_FORM_MS - 1000);
  h.act(b, { kind: 'reply', id: h.waiting().id, accept: true });
  h.advance(2000);
  assert.ok(h.waiting(), 'the sit restarted the clock');
  h.advance(TABLE_FORM_MS);
  assert.equal(h.waiting(), undefined);
  assert.equal(h.packet(a).invites[0].status, 'expired');
});

test('a seat needs the stake; busy players cannot sit at two tables', () => {
  const h = hall(3);
  const [a, b, c] = h.ids;
  h.act(a, {
    kind: 'invite',
    game: 'seotda',
    players: [],
    stake: 1000,
    required: 3,
    table: SEOTDA,
  });
  const id = h.waiting().id;
  h.act(b, { kind: 'reply', id, accept: true });
  // b already sits at seotda: go-stop is refused.
  assert.equal(
    h.act(b, {
      kind: 'invite',
      game: 'gostop',
      players: [],
      stake: 1000,
      table: tableIdOf('gostop'),
    }),
    REJECT.busy,
  );
  assert.equal(h.act(b, { kind: 'reply', id, accept: true }), REJECT.invalid);
  assert.equal(h.act(c, { kind: 'reply', id, accept: 'yes' }), REJECT.invalid);
});

test('old snapshots (invites without table) still load and plain invites still work', () => {
  const h = hall(2);
  const [a, b] = h.ids;
  assert.equal(
    h.act(a, { kind: 'invite', game: 'chess', players: [b], stake: 1000 }),
    '',
  );
  const snap = h.room.hostedSnapshot();
  assert.equal(snap.invites[0].table, undefined);
  const again = LoungeRoom.hosted(
    JSON.parse(JSON.stringify(snap)),
    h.room.hostedLedger(),
  );
  const inv = again.hostedPacket(a).invites[0];
  assert.equal(
    again.hostedAttempt(b, { kind: 'reply', id: inv.id, accept: true }, h.now),
    '',
  );
  assert.ok(again.hostedPacket(a).chess);
});

const member = (actor) => ({
  id: crypto.randomUUID(),
  actor,
  username: ACCOUNT_IDS[actor],
  connection: crypto.randomUUID(),
  sequence: 0,
  epoch: 0,
  code: '',
});
test('cloud: sit at the casino blackjack table, call a friend, friend walks in and sits', async () => {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const now = Date.now();
  const run = async (p, op, extra = {}) => {
    const c = {
      op,
      connection: p.connection,
      code: p.code,
      ...(!['read', 'wallet'].includes(op)
        ? { requestId: crypto.randomUUID(), sequence: ++p.sequence }
        : {}),
      ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
      ...extra,
    };
    const r = cloudTransition(world, p, c, await commandHash(c), now);
    world = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    validateLedger(world.ledger);
    return r;
  };
  const a = member(0),
    b = member(1);
  await run(a, 'open', { code: 'BEMTADUVLY' });
  await run(b, 'open', { code: 'BEMTADUVLY' });
  await run(a, 'action', { action: { kind: 'area', area: 'casino' } });
  let r = await run(a, 'action', {
    action: {
      kind: 'invite',
      game: 'blackjack',
      players: [b.id],
      stake: 1000,
      required: 2,
      table: 'casino-blackjack',
    },
  });
  assert.equal(r.response.ok, true);
  const inv = r.response.packet.invites.find((x) => x.status === 'waiting');
  assert.equal(inv.table, 'casino-blackjack');
  assert.equal(r.response.nextDue, inv.expires);
  // Still in the village: refused with a clear reason (409).
  await run(b, 'action', {
    action: { kind: 'area', area: 'village', x: 50, y: 60 },
  });
  r = await run(b, 'action', {
    action: { kind: 'reply', id: inv.id, accept: true },
  });
  assert.equal(r.response.ok, false);
  assert.equal(r.response.error, REJECT.tableArea);
  await run(b, 'action', { action: { kind: 'area', area: 'casino' } });
  r = await run(b, 'action', {
    action: { kind: 'reply', id: inv.id, accept: true },
  });
  assert.equal(r.response.ok, true);
  assert.ok(r.response.packet.blackjack);
  assert.deepEqual(r.response.packet.seats.blackjack, [a.id, b.id]);
});
