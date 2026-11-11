import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { lifeView, packLife, readLife } from '../app/lounge-life.ts';
import { stockKey } from '../app/lounge-farm.ts';
import { communityOrderCandidates } from '../app/lounge-community-orders-data.ts';
import { communityOrderStartsAt, communityOrderWeek } from '../app/lounge-community-orders.ts';

// In-memory cloud transactions only: no HTTP client, credentials or real account.
const NOW = Date.UTC(2026, 10, 11, 3);
const uuid = () => crypto.randomUUID();
const person = (actor) => ({ id: uuid(), actor, username: ACCOUNT_IDS[actor], connection: uuid(), sequence: 0, epoch: 0, code: '' });
async function setup(difficulty = 'easy') {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} }, now = NOW;
  const a = person(0), b = person(1);
  const h = {
    a, b,
    get world() { return world; }, set world(value) { world = value; },
    get now() { return now; }, set now(value) { now = value; },
    get life() { return readLife(world.life); },
    view(p) { return lifeView(readLife(world.life), p.id, p.actor, now).communityOrders; },
    mutate(fn) { const life = readLife(world.life); fn(life); world.life = packLife(life); },
    reload() {
      world = JSON.parse(JSON.stringify(world));
      world.life = JSON.parse(JSON.stringify(packLife(readLife(world.life))));
    },
    async make(p, op, extra = {}) {
      const command = { op, connection: p.connection, ...(p.code ? { code: p.code } : {}),
        ...(!['read', 'wallet'].includes(op) ? { requestId: uuid(), sequence: ++p.sequence } : {}),
        ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
      return { command, hash: await commandHash(command) };
    },
    apply(p, request) {
      const before = structuredClone(world);
      const result = cloudTransition(world, p, request.command, request.hash, now);
      assert.deepEqual(world, before, 'cloudTransition never mutates its caller-owned world');
      world = result.state; p.epoch = result.response.epoch;
      if (result.response.code) p.code = result.response.code;
      validateLedger(world.ledger);
      return { ...result, ...request };
    },
    async send(p, op, extra = {}) { return this.apply(p, await this.make(p, op, extra)); },
    async action(p, action) { return this.send(p, 'action', { action: { kind: 'communityOrder', week: this.week, ...action } }); },
    give(p, item, n) { this.mutate((life) => { life.bag[p.id].produce[item] = n; }); },
    resources() {
      const life = this.life;
      return structuredClone({ bag: life.bag, ext: life.ext ?? {}, farmx: life.farmx ?? {}, store: life.farm?.store ?? {}, accounts: world.ledger.accounts });
    },
  };
  assert.equal((await h.send(a, 'open', { code: 'COMORDTEST' })).response.ok, true);
  assert.equal((await h.send(b, 'open', { code: 'COMORDTEST' })).response.ok, true);
  h.week = communityOrderWeek(now);
  h.def = communityOrderCandidates(h.week).find((d) => d.difficulty === difficulty);
  if (difficulty === 'hard') h.mutate((life) => { ((life.farmx ??= {})[a.id] ??= {}).mach = { 0: { k: 'jar' } }; });
  const chosen = await h.action(a, { op: 'choose', order: h.def.id });
  assert.equal(chosen.response.ok, true, chosen.response.error);
  return h;
}
const expectOk = (r) => assert.equal(r.response.ok, true, r.response.error);
const expectFailure = (r, pattern) => { assert.equal(r.response.ok, false); if (pattern) assert.match(r.response.error, pattern); };
const deliver = (line, n, extra = {}) => ({ op: 'deliver', line, n, source: 'personal', ...extra });
async function fill(h) {
  for (const [line, need] of h.def.needs.entries()) {
    h.give(h.a, need.item, need.n + 3); h.give(h.b, need.item, need.n + 3);
    expectOk(await h.action(h.a, deliver(line, 1)));
    expectOk(await h.action(h.b, deliver(line, need.n - 1)));
  }
}

test('two cloud members deliver partial amounts, persist a round trip and receive the same completion in both life views', async () => {
  const h = await setup(), balances = structuredClone(h.world.ledger.accounts);
  for (const [line, need] of h.def.needs.entries()) {
    h.give(h.a, need.item, need.n + 4); h.give(h.b, need.item, need.n + 4);
    const first = Math.floor(need.n / 2);
    expectOk(await h.action(h.a, deliver(line, first)));
    assert.equal(h.life.bag[h.a.id].produce[need.item], need.n + 4 - first);
    assert.equal(h.life.bag[h.b.id].produce[need.item], need.n + 4);
    h.reload();
    const read = await h.send(h.b, 'read');
    expectOk(read);
    assert.equal(read.response.life.communityOrders.active.lines[line].delivered, first);
    expectOk(await h.action(h.b, deliver(line, need.n - first)));
    assert.equal(h.life.bag[h.b.id].produce[need.item], 4 + first);
  }
  h.reload();
  const a = h.view(h.a).active, b = h.view(h.b).active;
  assert.ok(a.completedAt); assert.equal(a.completedAt, b.completedAt);
  assert.ok(a.lines.every((line) => line.remaining === 0));
  assert.deepEqual(a.contributions.map((c) => c.actor), [0, 1]);
  assert.equal(a.canClaim, true); assert.equal(b.canClaim, true);
  assert.equal(h.life.memories.filter((m) => m.kind === 'community-order').length, 1);
  assert.deepEqual(h.world.ledger.accounts, balances, 'no cash is paid or minted');
  const before = h.resources();
  expectFailure(await h.action(h.a, deliver(0, 1)), /마친 주문/);
  assert.deepEqual(h.resources(), before, 'post-completion delivery changes no stock');
});

test('last-unit competing requests are safe in either CAS serialization order, including an oversized amount', async () => {
  const h = await setup();
  for (const need of h.def.needs) { h.give(h.a, need.item, need.n + 5); h.give(h.b, need.item, need.n + 5); }
  const last = h.def.needs.length - 1, item = h.def.needs[last].item;
  for (const [line, need] of h.def.needs.entries()) expectOk(await h.action(h.a, deliver(line, need.n - (line === last ? 1 : 0))));
  const pendingA = await h.make(h.a, 'action', { action: { kind: 'communityOrder', week: h.week, ...deliver(last, 9999) } });
  const pendingB = await h.make(h.b, 'action', { action: { kind: 'communityOrder', week: h.week, ...deliver(last, 9999) } });
  const snapshot = structuredClone(h.world), counts = { 0: h.life.bag[h.a.id].produce[item], 1: h.life.bag[h.b.id].produce[item] };
  for (const order of [[[h.a, pendingA], [h.b, pendingB]], [[h.b, pendingB], [h.a, pendingA]]]) {
    h.world = structuredClone(snapshot);
    const [[winner, first], [loser, second]] = order;
    expectOk(h.apply(winner, first));
    expectFailure(h.apply(loser, second), /마친 주문/);
    assert.equal(h.life.bag[winner.id].produce[item], counts[winner.actor] - 1, 'only the remaining unit is consumed');
    assert.equal(h.life.bag[loser.id].produce[item], counts[loser.actor], 'the losing request consumes nothing');
    assert.equal(h.view(winner).active.lines[last].delivered, h.def.needs[last].n);
    assert.equal(h.life.memories.filter((m) => m.kind === 'community-order').length, 1);
    assert.deepEqual(h.world.ledger.accounts, snapshot.ledger.accounts);
  }
});

test('same request/client sequence replays subtract once; a fresh request id cannot reuse the processed client sequence', async () => {
  const h = await setup(), item = h.def.needs[0].item;
  h.give(h.a, item, 20);
  const request = await h.action(h.a, deliver(0, 2)), after = h.resources();
  expectOk(request);
  expectOk(h.apply(h.a, request));
  h.reload();
  expectOk(h.apply(h.a, request));
  assert.equal(h.life.bag[h.a.id].produce[item], 18);
  assert.equal(h.view(h.a).active.lines[0].delivered, 2);
  assert.deepEqual(h.resources(), after);
  const command = { ...request.command, requestId: uuid() }, hash = await commandHash(command);
  assert.throws(() => h.apply(h.a, { command, hash }), /이미 처리|순서/);
  assert.deepEqual(h.resources(), after);
});

test('each contributor claims one keepsake, replay/new-sequence duplicates do not grant again, and unrelated inventory survives', async () => {
  const h = await setup();
  h.mutate((life) => {
    const a = ((life.ext ??= {})[h.a.id] ??= {}); a.inv = { wood: 13, bait: 9 }; a.furn = { 'furn-sofa': 2 };
    const b = ((life.ext ??= {})[h.b.id] ??= {}); b.inv = { pinecone: 11 }; b.furn = { 'furn-table': 3 };
  });
  await fill(h);
  const ref = h.def.reward.furniture, before = h.resources();
  const countA = h.view(h.a).active.claimed, furnitureA = h.life.ext[h.a.id].furn?.[ref] ?? 0, furnitureB = h.life.ext[h.b.id].furn?.[ref] ?? 0;
  assert.equal(countA, false);
  const claimed = await h.action(h.a, { op: 'claim' }); expectOk(claimed);
  expectOk(h.apply(h.a, claimed));
  h.reload();
  expectFailure(await h.action(h.a, { op: 'claim' }), /이미 받/);
  assert.equal(h.life.ext[h.a.id].furn[ref], furnitureA + 1);
  assert.equal(h.life.ext[h.b.id].furn?.[ref] ?? 0, furnitureB);
  expectOk(await h.action(h.b, { op: 'claim' }));
  assert.equal(h.life.ext[h.b.id].furn[ref], furnitureB + 1);
  assert.deepEqual(h.life.ext[h.a.id].inv, before.ext[h.a.id].inv);
  assert.deepEqual(h.life.ext[h.b.id].inv, before.ext[h.b.id].inv);
  assert.equal(h.life.ext[h.a.id].furn['furn-sofa'], 2);
  assert.equal(h.life.ext[h.b.id].furn['furn-table'], before.ext[h.b.id].furn['furn-table'] + (ref === 'furn-table' ? 1 : 0));
  assert.deepEqual(h.world.ledger.accounts, before.accounts);
  assert.equal(h.view(h.a).active.canClaim, false); assert.equal(h.view(h.b).active.claimed, true);
});

test('stale-week delivery after reconnect leaves all personal/shared stock and previous progress unchanged', async () => {
  const h = await setup(), item = h.def.needs[0].item;
  h.give(h.a, item, 10);
  expectOk(await h.action(h.a, deliver(0, 1)));
  h.now = communityOrderStartsAt(h.week + 1) + 3_600_000;
  expectOk(await h.send(h.a, 'open'));
  const before = h.resources(), previous = structuredClone(h.view(h.a).previous[0]);
  expectFailure(await h.action(h.a, deliver(0, 2)), /지난주 주문/);
  assert.deepEqual(h.resources(), before);
  h.reload();
  assert.equal(h.view(h.a).active, null);
  assert.deepEqual(h.view(h.a).previous[0], previous);
  assert.equal(h.view(h.a).previous[0].expired, true);
});

test('assignment mutations affect only the authenticated actor and never another UID or inventory', async () => {
  const h = await setup(), before = h.resources();
  expectOk(await h.action(h.a, { op: 'assign', line: 0, assigned: true }));
  expectOk(await h.action(h.b, { op: 'assign', line: 1, assigned: true }));
  expectFailure(await h.action(h.a, { op: 'assign', line: 1, assigned: false }), /내가 맡은/);
  expectFailure(await h.action(h.b, { op: 'assign', line: 0, assigned: true }), /다른 친구/);
  expectFailure(await h.action(h.a, { op: 'assign', line: 1, assigned: false, uid: h.b.id }), /요청/);
  expectOk(await h.action(h.a, { op: 'assign', line: 0, assigned: false }));
  h.reload();
  const lines = (await h.send(h.b, 'read')).response.life.communityOrders.active.lines;
  assert.equal(lines[0].assigned, undefined);
  assert.equal(lines[1].assigned, h.b.actor);
  assert.deepEqual(h.resources(), before, 'assign/unassign does not touch any player inventory');
});

test('shared-store consent is required and personal shortage never borrows shared or another friend stock; quality consumes lowest first', async () => {
  const h = await setup(), item = h.def.needs[0].item;
  h.give(h.a, item, 1); h.give(h.b, item, 20);
  h.mutate((life) => { (life.farm ??= {}).store = { [stockKey(item, 0)]: 2, [stockKey(item, 1)]: 2, [stockKey(item, 2)]: 3, [stockKey(item, 3)]: 1 }; });
  const before = h.resources();
  expectFailure(await h.action(h.a, deliver(0, 3)), /내 재료가 부족/);
  assert.deepEqual(h.resources(), before);
  expectFailure(await h.action(h.a, deliver(0, 3, { source: 'shared' })), /먼저 확인/);
  assert.deepEqual(h.resources(), before);
  expectFailure(await h.action(h.a, deliver(0, 3, { source: 'shared', confirmShared: false })), /요청/);
  assert.deepEqual(h.resources(), before);
  expectOk(await h.action(h.a, deliver(0, 3, { source: 'shared', confirmShared: true })));
  const after = h.life, store = after.farm.store;
  assert.equal(store[stockKey(item, 0)] ?? 0, 0);
  assert.equal(store[stockKey(item, 1)], 1);
  assert.equal(store[stockKey(item, 2)], 3); assert.equal(store[stockKey(item, 3)], 1);
  assert.equal(after.bag[h.a.id].produce[item], 1); assert.equal(after.bag[h.b.id].produce[item], 20);
  assert.deepEqual(after.ext ?? {}, before.ext);
  assert.equal(h.view(h.a).active.contributions[0].shared[0], 3);
  assert.equal(h.view(h.a).active.lines[0].have.shared, 5);
  assert.deepEqual(h.world.ledger.accounts, before.accounts);
});

test('personal crop qualities and artisan private storage use their real stock, leaving high tiers and another friend untouched', async () => {
  const h = await setup(), item = h.def.needs[0].item;
  h.mutate((life) => {
    life.bag[h.a.id].produce[item] = 8;
    const x = ((life.ext ??= {})[h.a.id] ??= {}); x.q1 = { [item]: 2 }; x.q2 = { [item]: 2 }; x.q3 = { [item]: 1 };
  });
  expectOk(await h.action(h.a, deliver(0, 4)));
  assert.equal(h.life.bag[h.a.id].produce[item], 4);
  assert.equal(h.life.ext[h.a.id].q1[item], 1);
  assert.equal(h.life.ext[h.a.id].q2[item], 2); assert.equal(h.life.ext[h.a.id].q3[item], 1);
  const goods = await setup('hard'), line = goods.def.needs.findIndex((n) => n.item.startsWith('jar-')), product = goods.def.needs[line].item;
  goods.mutate((life) => {
    const x = ((life.farmx ??= {})[goods.a.id] ??= {}); x.goods = { [stockKey(product, 0)]: 1, [stockKey(product, 2)]: 2 };
    ((life.farmx ??= {})[goods.b.id] ??= {}).goods = { [stockKey(product, 1)]: 4 };
    (((life.ext ??= {})[goods.a.id] ??= {}).inv ??= {})[product] = 30;
  });
  expectOk(await goods.action(goods.a, deliver(line, 2)));
  assert.equal(goods.life.farmx[goods.a.id].goods[stockKey(product, 0)] ?? 0, 0);
  assert.equal(goods.life.farmx[goods.a.id].goods[stockKey(product, 2)], 1);
  assert.equal(goods.life.farmx[goods.b.id].goods[stockKey(product, 1)], 4);
  assert.equal(goods.life.ext?.[goods.a.id]?.inv?.[product] ?? 0, 0, 'invalid artisan bag ids are excluded by normal save restoration');
});

test('full keepsake storage rejects a claim atomically and preserves the right to claim after making room', async () => {
  const h = await setup(); await fill(h);
  const ref = h.def.reward.furniture;
  h.mutate((life) => { (((life.ext ??= {})[h.a.id] ??= {}).furn ??= {})[ref] = 99_999; });
  const before = h.resources();
  expectFailure(await h.action(h.a, { op: 'claim' }), /더 보관/);
  assert.deepEqual(h.resources(), before);
  assert.equal(h.view(h.a).active.claimed, false);
  h.reload();
  h.mutate((life) => { life.ext[h.a.id].furn[ref] = 99_998; });
  expectOk(await h.action(h.a, { op: 'claim' }));
  assert.equal(h.life.ext[h.a.id].furn[ref], 99_999);
  assert.equal(h.view(h.a).active.claimed, true);
});
