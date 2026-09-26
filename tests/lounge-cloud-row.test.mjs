// World-row write volume and size (audit D-3, D-4) and unexpected engine errors (D-8).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cloudTransition,
  commandHash,
  isRejection,
  trimReceipts,
  CloudError,
  CLOUD_LEASE_MS,
  RECEIPT_CAP,
  RECEIPT_TTL_MS,
  SEEN_REFRESH_MS,
} from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { LifeError } from '../app/lounge-life.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

const T0 = Date.parse('2026-09-23T03:00:00Z'); // Wednesday 12:00 KST
const member = (actor) => ({
  id: crypto.randomUUID(),
  actor,
  username: ACCOUNT_IDS[actor],
  connection: crypto.randomUUID(),
  sequence: 0,
  epoch: 0,
  code: '',
});
function harness() {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    now = T0;
  return {
    get world() {
      return world;
    },
    set world(w) {
      world = w;
    },
    get now() {
      return now;
    },
    advance(ms) {
      now += ms;
    },
    async run(p, op, extra = {}) {
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
      const hash = await commandHash(c);
      const r = cloudTransition(world, p, c, hash, now);
      world = r.state;
      p.epoch = r.response.epoch;
      if (r.response.code) p.code = r.response.code;
      return { ...r, command: c, hash };
    },
    replay(p, c, hash) {
      const r = cloudTransition(world, p, c, hash, now);
      world = r.state;
      return r;
    },
  };
}

test('D-3: idle reads only rewrite the row to refresh a lease older than SEEN_REFRESH_MS', async () => {
  const h = harness(),
    a = member(0),
    b = member(1);
  await h.run(a, 'open');
  b.code = a.code;
  await h.run(b, 'join');
  let commits = 0,
    reads = 0;
  for (let t = 0; t < 10 * 60000; t += 4000) {
    h.advance(4000);
    for (const p of [a, b]) {
      const r = await h.run(p, 'read');
      reads++;
      if (r.changed) commits++;
      assert.equal(r.response.ok, true);
    }
  }
  // 15 s refresh used to commit ~1 read in 4; now about one per minute each.
  assert.ok(commits / reads < 0.1, `${commits}/${reads}`);
  // Presence still holds: nobody's lease expired while polling.
  for (const p of [a, b]) {
    const lease = h.world.rooms[a.code].leases[p.id];
    assert.ok(h.now - lease.seen <= SEEN_REFRESH_MS + 4000);
  }
});

test('D-3: a lease still expires when its owner stops reading', async () => {
  const h = harness(),
    a = member(0),
    b = member(1);
  await h.run(a, 'open');
  b.code = a.code;
  await h.run(b, 'join');
  for (let t = 0; t < CLOUD_LEASE_MS + 30000; t += 8000) {
    h.advance(8000);
    await h.run(a, 'read');
  }
  assert.ok(h.world.rooms[a.code].leases[a.id]);
  assert.equal(h.world.rooms[a.code].leases[b.id], undefined);
});

test('D-3: a hidden tab polling every 45 s keeps its lease', async () => {
  const h = harness(),
    a = member(0);
  await h.run(a, 'open');
  for (let i = 0; i < 20; i++) {
    h.advance(45000);
    const r = await h.run(a, 'read');
    assert.equal(r.response.ok, true);
  }
  assert.ok(h.world.rooms[a.code].leases[a.id]);
});

test('D-4: receipts are capped per member and expire, legacy ones trimmed on the next write', async () => {
  const h = harness(),
    a = member(0);
  await h.run(a, 'open');
  // A pre-D-4 world: hundreds of legacy receipts without `at`.
  const legacy = Array.from({ length: 512 }, (_, i) => ({
    id: crypto.randomUUID(),
    hash: 'f'.repeat(64),
    code: '',
    ok: true,
    error: '',
    n: i,
  }));
  h.world = { ...h.world, receipts: { ...h.world.receipts, other: legacy } };
  const reads = await h.run(a, 'read');
  assert.equal(reads.state.receipts.other.length, 512, 'a read that does not commit leaves them');
  for (let i = 0; i < RECEIPT_CAP + 20; i++) {
    h.advance(1000);
    await h.run(a, 'action', { action: { kind: 'emote', emote: '♥' } });
  }
  assert.equal(h.world.receipts.other, undefined);
  assert.equal(h.world.receipts[a.id].length, RECEIPT_CAP);
  h.advance(RECEIPT_TTL_MS + 1);
  await h.run(a, 'action', { action: { kind: 'emote', emote: '♥' } });
  assert.equal(h.world.receipts[a.id].length, 1);
  assert.deepEqual(trimReceipts({ x: [{ id: 'a', hash: '', code: '', ok: true, error: '', at: 5 }] }, 5 + RECEIPT_TTL_MS), {});
});

test('D-4: a retry within the window replays; a replay after trimming is still refused', async () => {
  const h = harness(),
    a = member(0);
  await h.run(a, 'open');
  const first = await h.run(a, 'action', { action: { kind: 'emote', emote: '♥' } });
  const again = h.replay(a, first.command, first.hash);
  assert.equal(again.response.ok, true);
  assert.equal(again.changed, false, 'a replayed receipt does not re-run the action');
  // Reused request id with a different body.
  const other = { ...first.command, action: { kind: 'emote', emote: '!' } };
  assert.throws(() => h.replay(a, other, 'x'.repeat(64)), /이미 사용한 요청 번호/);
  // Push the receipt out of the window.
  h.advance(RECEIPT_TTL_MS + 1);
  await h.run(a, 'read');
  await h.run(a, 'action', { action: { kind: 'emote', emote: '♥' } });
  assert.ok(!h.world.receipts[a.id].some((r) => r.id === first.command.requestId));
  // Out-of-room life action replayed after eviction: the sequence mark refuses it.
  const b = member(1);
  const life = await h.run(b, 'action', { action: { kind: 'status', text: '안녕' } });
  h.advance(RECEIPT_TTL_MS + 1);
  await h.run(b, 'action', { action: { kind: 'status', text: '또 안녕' } });
  assert.ok(!(h.world.receipts[b.id] ?? []).some((r) => r.id === life.command.requestId));
  assert.throws(() => h.replay(b, life.command, life.hash), /순서가 지난 요청/);
});

test('D-8: engine bugs are not stored as receipts nor committed; rejections are', async () => {
  assert.equal(isRejection(new CloudError('x', 409)), true);
  assert.equal(isRejection(new LifeError('가방이 가득 찼어요.')), true);
  assert.equal(isRejection(new Error('잔액이 부족해요.')), true);
  assert.equal(isRejection(new TypeError("Cannot read properties of undefined (reading 'x')")), false);
  assert.equal(isRejection(new RangeError('Invalid array length')), false);
  assert.equal(isRejection(new Error('boom')), false);
  const h = harness(),
    a = member(0);
  await h.run(a, 'open');
  // A rejection is a stored 409 receipt.
  const bad = await h.run(a, 'action', { action: { kind: 'invite', game: 'chess', players: [], stake: -1 } });
  assert.equal(bad.response.ok, false);
  assert.ok(h.world.receipts[a.id].some((r) => r.id === bad.command.requestId && !r.ok));
  // A bug inside the transition (simulated with a poisoned action) throws out.
  const before = h.world;
  const poison = {
    get kind() {
      throw new TypeError('poisoned');
    },
  };
  const c = {
    op: 'action',
    connection: a.connection,
    code: a.code,
    requestId: crypto.randomUUID(),
    sequence: ++a.sequence,
    action: poison,
  };
  assert.throws(() => cloudTransition(before, a, c, 'e'.repeat(64), h.now), TypeError);
  assert.ok(!before.receipts[a.id].some((r) => r.id === c.requestId));
});
