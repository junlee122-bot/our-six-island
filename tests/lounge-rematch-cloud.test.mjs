import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cloudTransition,
  commandHash,
  CLOUD_LEASE_MS,
} from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { LoungeBank } from '../app/lounge-wallet.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

const uuid = () => crypto.randomUUID();
const member = (actor) => ({
  id: uuid(),
  actor,
  username: ACCOUNT_IDS[actor],
  connection: uuid(),
  sequence: 0,
  epoch: 0,
  code: '',
});

function harness(initial = null) {
  let world = structuredClone(
      initial ?? { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    ),
    now = Date.now();
  return {
    get world() {
      return world;
    },
    async run(p, op, extra = {}) {
      const command = {
          op,
          connection: p.connection,
          code: p.code,
          ...(!['read', 'wallet'].includes(op)
            ? { requestId: uuid(), sequence: ++p.sequence }
            : {}),
          ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
          ...extra,
        },
        hash = await commandHash(command),
        result = cloudTransition(world, p, command, hash, now);
      world = result.state;
      p.epoch = result.response.epoch;
      if (result.response.code) p.code = result.response.code;
      validateLedger(world.ledger);
      return { ...result, command, hash };
    },
    replay(p, command, hash) {
      const result = cloudTransition(world, p, command, hash, now);
      world = result.state;
      validateLedger(world.ledger);
      return result;
    },
    advance(ms) {
      now += ms;
    },
  };
}

const roomSnapshot = (h, p) => h.world.rooms[p.code].snapshot;
const tableFor = (h, p, game = 'chess') =>
  h.world.rooms[p.code].snapshot.tables?.[game];
function walletFor(world, p) {
  const bank = new LoungeBank(null);
  bank.commit(world.ledger);
  return bank.view('wallet-' + p.id);
}
const readyAction = (game, id, ready = true) => ({
  kind: 'ready',
  game,
  id,
  ready,
});

async function openRoom(h, players) {
  await h.run(players[0], 'open');
  for (const player of players.slice(1)) {
    player.code = players[0].code;
    await h.run(player, 'join');
  }
}

async function startChess(h, a, b, stake = 1000) {
  const invited = await h.run(a, 'action', {
    action: { kind: 'invite', game: 'chess', players: [b.id], stake },
  });
  assert.equal(invited.response.ok, true);
  const invite = invited.response.packet.invites.find((item) => item.game === 'chess');
  assert.ok(invite);
  const accepted = await h.run(b, 'action', {
    action: { kind: 'reply', id: invite.id, accept: true },
  });
  assert.equal(accepted.response.ok, true);
  return roomSnapshot(h, a).chess.id;
}

async function finishChess(h, player, id) {
  const result = await h.run(player, 'action', {
    action: { kind: 'resign', id },
  });
  assert.equal(result.response.ok, true);
  assert.equal(roomSnapshot(h, player).chess.winner !== null, true);
}

test('rematch readiness survives cloud reconstruction and a short reconnect', async () => {
  const h = harness(),
    a = member(0),
    b = member(1);
  await openRoom(h, [a, b]);
  const previousId = await startChess(h, a, b),
    firstTable = tableFor(h, a);
  assert.equal(firstTable.matchId, previousId);
  await finishChess(h, a, previousId);
  const persisted = await h.run(a, 'action', {
    action: readyAction('chess', previousId),
  });
  assert.deepEqual(persisted.response.packet.tables.chess.ready, [a.id]);
  assert.deepEqual(tableFor(h, a).ready, [a.id]);
  assert.deepEqual(tableFor(h, a).members, [a.id, b.id]);

  // The next command reconstructs LoungeRoom from its persisted hosted snapshot.
  const resumed = harness(h.world),
    reconnectedA = { ...a, connection: uuid() };
  const rejoin = await resumed.run(reconnectedA, 'join', { code: a.code });
  assert.equal(rejoin.response.ok, true);
  assert.deepEqual(rejoin.response.packet.tables.chess.ready, [a.id]);
  assert.deepEqual(tableFor(resumed, a).ready, [a.id]);
  const rematchReady = await resumed.run(b, 'action', {
    action: readyAction('chess', previousId),
  });

  const rematch = roomSnapshot(resumed, a).chess,
    nextTable = tableFor(resumed, a);
  assert.notEqual(rematch.id, previousId);
  assert.equal(nextTable.matchId, rematch.id);
  assert.equal(rematchReady.response.packet.tables.chess.matchId, rematch.id);
  assert.equal(nextTable.round, firstTable.round + 1);
  assert.deepEqual(nextTable.members, [a.id, b.id]);
  assert.deepEqual(nextTable.ready, []);
  assert.equal(walletFor(resumed.world, a).held, 1000);
  assert.equal(walletFor(resumed.world, b).held, 1000);
});

test('last-ready receipt retries do not double-reserve; stale match IDs and reused IDs are isolated', async () => {
  const h = harness(),
    a = member(0),
    b = member(1);
  await openRoom(h, [a, b]);
  const oldId = await startChess(h, a, b),
    stake = tableFor(h, a).stake;
  await finishChess(h, a, oldId);
  await h.run(a, 'action', { action: readyAction('chess', oldId) });
  const lastReady = await h.run(b, 'action', {
    action: readyAction('chess', oldId),
  });
  assert.equal(lastReady.response.ok, true);
  const firstRematch = roomSnapshot(h, a).chess.id,
    ledgerAfterLaunch = structuredClone(h.world.ledger),
    retry = h.replay(b, lastReady.command, lastReady.hash);
  assert.equal(retry.response.ok, true);
  assert.equal(retry.response.packet.tables.chess.matchId, firstRematch);
  assert.equal(roomSnapshot(h, a).chess.id, firstRematch);
  assert.deepEqual(h.world.ledger, ledgerAfterLaunch);
  assert.equal(walletFor(h.world, a).held, stake);
  assert.equal(walletFor(h.world, b).held, stake);

  const snapshotBeforeStale = structuredClone(roomSnapshot(h, a)),
    ledgerBeforeStale = structuredClone(h.world.ledger),
    stale = await h.run(b, 'action', {
      action: readyAction('chess', oldId),
    });
  assert.equal(stale.response.ok, false);
  assert.deepEqual(roomSnapshot(h, a), snapshotBeforeStale);
  assert.deepEqual(h.world.ledger, ledgerBeforeStale);

  const alteredRetry = {
    ...lastReady.command,
    action: readyAction('chess', firstRematch, false),
  };
  await assert.rejects(
    commandHash(alteredRetry).then((hash) =>
      h.replay(b, alteredRetry, hash),
    ),
    (error) => error.status === 409,
  );
  assert.deepEqual(h.world.ledger, ledgerBeforeStale);
});

test('active games and nonparticipants cannot ready; a short table waits for the ready check, then dissolves', async () => {
  const h = harness(),
    a = member(0),
    b = member(1),
    c = member(2);
  await openRoom(h, [a, b, c]);
  const id = await startChess(h, a, b),
    initialMembers = tableFor(h, a).members;
  const activeReady = await h.run(a, 'action', {
    action: readyAction('chess', id),
  });
  assert.equal(activeReady.response.ok, false);
  assert.deepEqual(tableFor(h, a).members, initialMembers);

  await finishChess(h, a, id);
  assert.deepEqual(tableFor(h, a).members, [a.id, b.id]);
  const outsider = await h.run(c, 'action', {
    action: readyAction('chess', id),
  });
  assert.equal(outsider.response.ok, false);
  assert.deepEqual(tableFor(h, a).ready, []);

  const stand = await h.run(a, 'action', { action: { kind: 'stand', game: 'chess' } });
  assert.equal(stand.response.ok, true);
  // The survivor keeps the short table so an invite can fill the empty seat;
  // when the ready check runs out unfilled, the table dissolves.
  assert.deepEqual(tableFor(h, a).members, [b.id]);
  h.advance(61_000);
  await h.run(b, 'read');
  assert.equal(tableFor(h, a), undefined);
});

test('legacy hosted snapshots without tables reconstruct as empty tables', async () => {
  const h = harness(),
    a = member(0);
  await openRoom(h, [a]);
  delete h.world.rooms[a.code].snapshot.tables;
  const reconstructed = harness(h.world),
    read = await reconstructed.run(a, 'read');
  assert.equal(read.response.ok, true);
  assert.ok(read.response.packet);
  assert.deepEqual(read.response.packet.tables ?? {}, {});
  assert.deepEqual(reconstructed.world.rooms[a.code].snapshot.tables ?? {}, {});
});

test('a failed rematch reservation leaves match, table, and wallet state unchanged', async () => {
  const h = harness(),
    a = member(0),
    b = member(1),
    stake = 20000;
  await openRoom(h, [a, b]);
  let id = await startChess(h, a, b, stake);

  // Let B lose five legitimate rounds. The fifth round is affordable, while
  // the next rematch must fail because B has no remaining balance.
  for (let round = 1; round <= 5; round += 1) {
    await finishChess(h, b, id);
    if (round < 5) {
      await h.run(a, 'action', { action: readyAction('chess', id) });
      const next = await h.run(b, 'action', {
        action: readyAction('chess', id),
      });
      assert.equal(next.response.ok, true);
      id = roomSnapshot(h, a).chess.id;
    }
  }

  assert.equal(walletFor(h.world, b).balance, 0);
  assert.equal(walletFor(h.world, b).held, 0);
  const firstReady = await h.run(a, 'action', {
    action: readyAction('chess', id),
  });
  assert.equal(firstReady.response.ok, true);
  const beforeSnapshot = structuredClone(roomSnapshot(h, a)),
    beforeLedger = structuredClone(h.world.ledger);
  const failedReservation = await h.run(b, 'action', {
    action: readyAction('chess', id),
  });
  assert.equal(failedReservation.response.ok, false);
  assert.deepEqual(roomSnapshot(h, a), beforeSnapshot);
  assert.deepEqual(h.world.ledger, beforeLedger);
});

test('an explicit leave removes its ended-table membership and lets the survivor invite again', async () => {
  const h = harness(),
    a = member(0),
    b = member(1),
    c = member(2);
  await openRoom(h, [a, b, c]);
  const id = await startChess(h, a, b);
  await finishChess(h, a, id);
  const ready = await h.run(a, 'action', { action: readyAction('chess', id) });
  assert.equal(ready.response.ok, true);
  assert.deepEqual(ready.response.packet.tables.chess.ready, [a.id]);
  assert.deepEqual(tableFor(h, a).ready, [a.id]);

  const left = await h.run(b, 'leave');
  assert.equal(left.response.ok, true);
  assert.deepEqual(tableFor(h, a).members, [a.id]);
  assert.equal(h.world.rooms[a.code].leases[b.id], undefined);

  const stood = await h.run(a, 'action', {
    action: { kind: 'stand', game: 'chess' },
  });
  assert.equal(stood.response.ok, true);
  assert.equal(tableFor(h, a), undefined);

  const invited = await h.run(a, 'action', {
    action: { kind: 'invite', game: 'chess', players: [c.id], stake: 1000 },
  });
  assert.equal(invited.response.ok, true);
  const nextInvite = invited.response.packet.invites.find(
    (item) => item.game === 'chess' && item.status === 'waiting',
  );
  assert.ok(nextInvite);
  const accepted = await h.run(c, 'action', {
    action: { kind: 'reply', id: nextInvite.id, accept: true },
  });
  assert.equal(accepted.response.ok, true);
  assert.notEqual(roomSnapshot(h, a).chess.id, id);
});

test('a short reconnect preserves ready membership, then the ready deadline dissolves the idle table', async () => {
  const h = harness(),
    a = member(0),
    b = member(1);
  await openRoom(h, [a, b]);
  const id = await startChess(h, a, b);
  await finishChess(h, a, id);
  await h.run(a, 'action', { action: readyAction('chess', id) });

  const deadline = tableFor(h, a).readyDeadline;
  assert.equal(typeof deadline, 'number');
  h.advance(30000);
  const reconnectedB = { ...b, connection: uuid() },
    rejoin = await h.run(reconnectedB, 'join', { code: a.code });
  assert.equal(rejoin.response.ok, true);
  assert.deepEqual(rejoin.response.packet.tables.chess.ready, [a.id]);
  assert.deepEqual(tableFor(h, a).members, [a.id, b.id]);
  assert.deepEqual(tableFor(h, a).ready, [a.id]);

  assert.equal(tableFor(h, a).readyDeadline, deadline);
  // B never readies: after 60 seconds the non-ready member is removed and the
  // table, now below its required size, dissolves.
  h.advance(30001);
  const afterExpiry = await h.run(a, 'read');
  assert.equal(afterExpiry.response.ok, true);
  assert.equal(tableFor(h, a), undefined);
  assert.equal(afterExpiry.response.packet.tables.chess, undefined);
  // Lease expiry still removes the idle member from the room later on.
  h.advance(CLOUD_LEASE_MS);
  await h.run(a, 'read');
  assert.equal(h.world.rooms[a.code].leases[b.id], undefined);
});
