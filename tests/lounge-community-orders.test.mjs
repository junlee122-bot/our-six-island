import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CROPS,
  emptyLife,
  ensureLifeMember,
  lifeAction,
  lifeView,
  packLife,
  readLife,
} from '../app/lounge-life.ts';
import {
  addCropQ,
  addInv,
  cropQCount,
  itemCount,
} from '../app/lounge-life-plus.ts';
import { stockKey } from '../app/lounge-farm.ts';
import { isGoodId } from '../app/lounge-farm-data.ts';
import {
  COMMUNITY_ORDER_POOL,
  communityOrderCandidates,
} from '../app/lounge-community-orders-data.ts';
import {
  COMMUNITY_ORDER_HISTORY_WEEKS,
  COMMUNITY_ORDER_LOG_MAX,
  communityOrderWeek,
  communityOrderStartsAt,
  communityOrderHave,
  readCommunityOrders,
} from '../app/lounge-community-orders.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { makeupLeft, noteActive } from '../app/lounge-myday.ts';

const NOW = Date.UTC(2026, 10, 11, 5),
  WEEK = 7 * 86_400_000;
const week = communityOrderWeek(NOW);
const op = (op, fields = {}, w = week) => ({
  kind: 'communityOrder',
  op,
  week: w,
  ...fields,
});
function give(life, member, item, n, q = 0) {
  if (CROPS.includes(item)) addCropQ(life, member.id, item, q, n);
  else if (isGoodId(item)) {
    const yard = ((life.farmx ??= {})[member.id] ??= {});
    const goods = (yard.goods ??= {}),
      key = stockKey(item, q);
    goods[key] = (goods[key] ?? 0) + n;
  } else addInv(life, member.id, item, n);
}
function setup() {
  const members = [0, 1, 7].map((actor) => ({
    id: crypto.randomUUID(),
    actor,
  }));
  let life = emptyLife();
  for (const m of members) life = ensureLifeMember(life, m.id, m.actor);
  const ledger = newLoungeLedger();
  const s = {
    members,
    ledger,
    get life() {
      return life;
    },
    set life(v) {
      life = v;
    },
    get active() {
      return this.view().active;
    },
    view(member = members[0], at = NOW) {
      return lifeView(life, member.id, member.actor, at).communityOrders;
    },
    act(action, member = members[0], at = NOW) {
      const before = structuredClone(life),
        next = lifeAction(life, ledger, member, action, at);
      assert.deepEqual(
        life,
        before,
        'the original CAS proposal is never mutated',
      );
      assert.equal(
        next.ledger,
        ledger,
        'orders have no cash reward or sale settlement',
      );
      life = next.life;
      return life;
    },
    choose(difficulty = 'easy', at = NOW) {
      const def = communityOrderCandidates(communityOrderWeek(at)).find(
        (d) => d.difficulty === difficulty,
      );
      this.act(
        op('choose', { order: def.id }, communityOrderWeek(at)),
        members[0],
        at,
      );
      return def;
    },
    give(member, item, n, q = 0) {
      give(life, member, item, n, q);
    },
    fill(def, member = members[0], at = NOW) {
      for (const [line, need] of def.needs.entries()) {
        const remain = this.view(member, at).active.lines[line].remaining;
        if (!remain) continue;
        this.give(member, need.item, remain);
        this.act(
          op(
            'deliver',
            { line, n: remain, source: 'personal' },
            communityOrderWeek(at),
          ),
          member,
          at,
        );
      }
    },
  };
  return s;
}

test('KST Monday boundaries, old saves and fresh player views have three stable choices and no invented order', () => {
  assert.equal(communityOrderWeek(communityOrderStartsAt(week) - 1), week - 1);
  assert.equal(communityOrderWeek(communityOrderStartsAt(week)), week);
  const s = setup(),
    before = structuredClone(s.life),
    view = s.view();
  assert.equal(view.candidates.length, 3);
  assert.equal(view.active, null);
  assert.deepEqual(view.previous, []);
  assert.equal(view.endsAt - view.startsAt, WEEK);
  assert.equal(readLife(undefined).communityOrders, undefined);
  assert.deepEqual(s.life, before);
  assert.deepEqual(
    s.view(s.members[2]).candidates.map((d) => d.id),
    view.candidates.map((d) => d.id),
  );
});

test('first selection wins and hard processing is gated only when choosing, not after the machine is removed', () => {
  const s = setup();
  const hard = s.view().candidates.find((d) => d.difficulty === 'hard');
  assert.ok(hard.lockedReason);
  assert.throws(() => s.act(op('choose', { order: hard.id })), /옹기/);
  (s.life.farmx ??= {})[s.members[1].id] = { mach: { 0: { k: 'jar' } } };
  s.act(op('choose', { order: hard.id }));
  const before = structuredClone(s.life.communityOrders);
  s.act(op('choose', { order: hard.id }), s.members[1]);
  assert.deepEqual(s.life.communityOrders, before);
  assert.throws(
    () =>
      s.act(op('choose', { order: s.view().candidates[0].id }), s.members[1]),
    /먼저/,
  );
  delete s.life.farmx[s.members[1].id].mach;
  s.give(s.members[1], hard.needs[0].item, 1);
  s.act(op('deliver', { line: 0, n: 1, source: 'personal' }), s.members[1]);
  assert.equal(s.active.lines[0].delivered, 1);
});

test('successful deliveries and keepsake pickups mark activity days without making order metadata or failures active', () => {
  const s = setup(),
    a = s.members[0],
    monday = communityOrderStartsAt(week) + 12 * 3_600_000;
  const tuesday = monday + 86_400_000,
    wednesday = tuesday + 86_400_000,
    thursday = wednesday + 86_400_000;
  noteActive(s.life, a.id, monday);
  const farms = structuredClone(s.life.farms),
    growth = structuredClone(s.life.growth);
  const def = s.choose('easy', tuesday);
  s.act(op('assign', { line: 0, assigned: true }), a, tuesday);
  assert.equal(
    s.life.myday[a.id].w.m,
    1,
    'choosing/assignment do not mark a new visit',
  );
  assert.throws(() =>
    s.act(op('deliver', { line: 0, n: 1, source: 'personal' }), a, tuesday),
  );
  assert.equal(
    s.life.myday[a.id].w.m,
    1,
    'a rejected delivery is not activity',
  );
  s.give(a, def.needs[0].item, 1);
  s.act(op('deliver', { line: 0, n: 1, source: 'personal' }), a, tuesday);
  assert.equal(
    s.life.myday[a.id].w.m,
    3,
    'a successful delivery marks Tuesday',
  );
  assert.throws(() => s.act(op('claim'), a, wednesday));
  assert.equal(s.life.myday[a.id].w.m, 3, 'a premature claim is not activity');
  s.fill(def, a, tuesday);
  s.act(op('claim'), a, wednesday);
  assert.equal(s.life.myday[a.id].w.m, 7, 'a successful claim marks Wednesday');
  assert.equal(
    makeupLeft(s.life, a.id, thursday),
    0,
    'order-only visits are not counted as missed days',
  );
  assert.equal(s.life.myday[a.id].b, undefined);
  assert.equal(s.life.myday[a.id].s, undefined);
  assert.deepEqual(
    s.life.growth,
    growth,
    'no XP/rested/daily progression is settled',
  );
  assert.deepEqual(
    s.life.farms,
    farms,
    'no crop growth or farm settlement is added',
  );
});

test('members can only assign and release themselves, while unassigned friends may still deliver', () => {
  const s = setup(),
    def = s.choose();
  s.act(op('assign', { line: 0, assigned: true }));
  assert.equal(s.active.lines[0].assigned, 0);
  assert.throws(
    () => s.act(op('assign', { line: 0, assigned: true }), s.members[1]),
    /다른 친구/,
  );
  assert.throws(
    () => s.act(op('assign', { line: 0, assigned: false }), s.members[1]),
    /내가 맡은/,
  );
  s.give(s.members[2], def.needs[0].item, 1);
  s.act(op('deliver', { line: 0, n: 1, source: 'personal' }), s.members[2]);
  assert.equal(s.active.contributions[0].actor, 7);
  assert.equal(s.active.lines[0].assigned, 0);
  s.act(op('assign', { line: 0, assigned: false }));
  assert.equal(s.active.lines[0].assigned, undefined);
});

test('partial deliveries take only own stock, cap excess at remaining, and reject insufficient stock atomically', () => {
  const s = setup(),
    def = s.choose(),
    a = s.members[0],
    b = s.members[1],
    item = def.needs[0].item;
  s.give(b, item, 100);
  assert.throws(
    () => s.act(op('deliver', { line: 0, n: 1, source: 'personal' }), a),
    /내 재료/,
  );
  s.give(a, item, 1);
  const before = structuredClone(s.life);
  assert.throws(
    () => s.act(op('deliver', { line: 0, n: 2, source: 'personal' }), a),
    /내 재료/,
  );
  assert.deepEqual(s.life, before);
  s.act(op('deliver', { line: 0, n: 1, source: 'personal' }), a);
  const remaining = s.active.lines[0].remaining;
  s.give(a, item, remaining + 3);
  s.act(op('deliver', { line: 0, n: 999, source: 'personal' }), a);
  assert.equal(itemCount(s.life, a.id, item), 3);
  assert.equal(itemCount(s.life, b.id, item), 100);
  assert.equal(s.active.lines[0].delivered, def.needs[0].n);
  assert.throws(
    () => s.act(op('deliver', { line: 0, n: 1, source: 'personal' }), a),
    /모두 받았/,
  );
});

test('personal crop donation consumes normal, silver, gold then starlight exactly once and reports minimum-quality counts', () => {
  const s = setup(),
    def = s.choose(),
    a = s.members[0],
    item = def.needs[0].item;
  for (const q of [0, 1, 2, 3]) s.give(a, item, 2, q);
  assert.deepEqual(communityOrderHave(s.life, a.id, item, 2), {
    personal: 4,
    shared: 0,
  });
  s.act(op('deliver', { line: 0, n: 5, source: 'personal' }), a);
  assert.deepEqual(
    [0, 1, 2, 3].map((q) => cropQCount(s.life, a.id, item, q)),
    [0, 0, 1, 2],
  );
  assert.equal(s.active.lines[0].have.personal, 3);
});

test('shared storage requires explicit source and confirmation and records its contribution separately', () => {
  const s = setup(),
    def = s.choose(),
    a = s.members[0],
    item = def.needs[0].item;
  s.life.farm = {
    store: { [item]: 2, [stockKey(item, 1)]: 3, [stockKey(item, 2)]: 4 },
  };
  assert.equal(s.active.lines[0].have.shared, 9);
  assert.throws(
    () => s.act(op('deliver', { line: 0, n: 3, source: 'personal' })),
    /내 재료/,
  );
  assert.throws(
    () => s.act(op('deliver', { line: 0, n: 3, source: 'shared' })),
    /확인/,
  );
  assert.throws(
    () =>
      s.act(
        op('deliver', {
          line: 0,
          n: 3,
          source: 'shared',
          confirmShared: false,
        }),
      ),
    /공동 주문/,
  );
  s.act(
    op('deliver', { line: 0, n: 3, source: 'shared', confirmShared: true }),
  );
  assert.equal(s.life.farm.store[item] ?? 0, 0);
  assert.equal(s.life.farm.store[stockKey(item, 1)], 2);
  assert.equal(s.life.farm.store[stockKey(item, 2)], 4);
  assert.equal(itemCount(s.life, a.id, item), 0);
  assert.equal(s.active.contributions[0].shared[0], 3);
  assert.equal(s.active.log[0].source, 'shared');
  assert.deepEqual(communityOrderHave(s.life, a.id, 'crucian'), {
    personal: 0,
    shared: 0,
  });
});

test('artisan goods come only from collected private goods, with lower quality spent first', () => {
  const s = setup(),
    a = s.members[0];
  s.life.farmx = {
    [a.id]: {
      mach: {
        0: { k: 'jar', out: 'jar-carrot', n: 1, at: NOW - 100, done: NOW - 1 },
      },
    },
  };
  const def = s.choose('hard'),
    item = def.needs[0].item;
  addInv(s.life, a.id, item, 99);
  assert.equal(
    s.active.lines[0].have.personal,
    0,
    'wrong storage and an uncollected machine output are not available',
  );
  assert.throws(
    () => s.act(op('deliver', { line: 0, n: 1, source: 'personal' })),
    /내 재료/,
  );
  for (const q of [0, 1, 2, 3]) s.give(a, item, 1, q);
  const n = Math.min(2, def.needs[0].n);
  s.act(op('deliver', { line: 0, n, source: 'personal' }));
  assert.equal(s.life.ext[a.id].inv[item], 99);
  assert.equal(s.life.farmx[a.id].goods[stockKey(item, 0)] ?? 0, 0);
  if (n === 2)
    assert.equal(s.life.farmx[a.id].goods[stockKey(item, 1)] ?? 0, 0);
  assert.equal(s.life.farmx[a.id].mach[0].out, 'jar-carrot');
});

test('completion, album/news and contributor-only non-cash keepsakes commit once and survive serialization', () => {
  const s = setup(),
    def = s.choose(),
    [a, b, c] = s.members;
  s.give(a, def.needs[0].item, 1);
  s.act(op('deliver', { line: 0, n: 1, source: 'personal' }), a);
  s.fill(def, b);
  assert.equal(s.active.completedAt, NOW);
  assert.equal(s.active.contributions.length, 2);
  assert.equal(
    s.life.memories.filter((m) => m.kind === 'community-order').length,
    1,
  );
  assert.equal(s.view(a).active.canClaim, true);
  assert.equal(s.view(c).active.canClaim, false);
  assert.throws(() => s.act(op('claim'), c), /직접 납품/);
  s.act(op('claim'), a);
  s.act(op('claim'), b);
  assert.equal(s.life.ext[a.id].furn[def.reward.furniture], 1);
  assert.equal(s.life.ext[b.id].furn[def.reward.furniture], 1);
  assert.throws(() => s.act(op('claim'), a), /이미 받았/);
  const reload = readLife(JSON.parse(JSON.stringify(packLife(s.life))));
  assert.deepEqual(reload.communityOrders, s.life.communityOrders);
  assert.equal(
    lifeView(reload, a.id, a.actor, NOW).communityOrders.active.claimed,
    true,
  );
  const detached = s.view(a);
  detached.active.lines[0].delivered = 0;
  detached.active.contributions[0].items[0] = 0;
  assert.equal(s.active.lines[0].remaining, 0, 'the UI receives detached data');
});

test('expired incomplete orders become read-only history; completed rewards remain claimable for three further weeks', () => {
  const s = setup(),
    def = s.choose(),
    a = s.members[0];
  s.fill(def, a);
  const next = NOW + WEEK;
  assert.equal(s.view(a, next).active, null);
  assert.equal(s.view(a, next).previous[0].canClaim, true);
  assert.throws(
    () => s.act(op('deliver', { line: 0, n: 1, source: 'personal' }), a, next),
    /지난주/,
  );
  assert.throws(
    () => s.act(op('assign', { line: 0, assigned: true }), a, next),
    /지난주/,
  );
  s.act(op('claim'), a, NOW + COMMUNITY_ORDER_HISTORY_WEEKS * WEEK);
  assert.equal(s.life.ext[a.id].furn[def.reward.furniture], 1);
  assert.equal(s.view(a, NOW + 4 * WEEK).previous.length, 0);
  assert.throws(() => s.act(op('claim'), a, NOW + 4 * WEEK), /기간/);
  const t = setup(),
    unfinished = t.choose();
  t.give(t.members[0], unfinished.needs[0].item, 1);
  t.act(op('deliver', { line: 0, n: 1, source: 'personal' }));
  const old = t.view(t.members[0], next).previous[0];
  assert.equal(old.expired, true);
  assert.equal(old.completedAt, undefined);
  assert.equal(old.canClaim, false);
  for (let i = 1; i <= 6; i++) t.choose('easy', NOW + i * WEEK);
  assert.equal(t.life.communityOrders.records.length, 4);
  assert.deepEqual(
    t.life.communityOrders.records.map((r) => r.week),
    [week + 6, week + 5, week + 4, week + 3],
  );
});

test('a previously chosen version survives a changed candidate rotation but cannot be newly selected', () => {
  const s = setup(),
    current = communityOrderCandidates(week);
  const old = COMMUNITY_ORDER_POOL.find(
    (def) => !current.some((candidate) => candidate.id === def.id),
  );
  assert.ok(old);
  const counts = old.needs.map((need) => need.n);
  s.life.communityOrders = {
    records: [
      {
        week,
        order: old.id,
        chosenBy: 0,
        chosenAt: NOW,
        assigned: counts.map(() => null),
        by: { 0: { n: counts, s: counts.map(() => 0) } },
        claimed: [],
        completedAt: NOW,
        log: [],
      },
    ],
  };
  s.life = readLife(JSON.parse(JSON.stringify(packLife(s.life))));
  assert.equal(s.active.order.id, old.id);
  assert.equal(s.active.canClaim, true);
  assert.throws(() => s.act(op('choose', { order: old.id })), /공동 주문/);
  s.act(op('claim'));
  assert.equal(s.life.ext[s.members[0].id].furn[old.reward.furniture], 1);
});

test('strict inputs reject spoofed owners, malformed quantities, arbitrary operations and stale candidate ids without side effects', () => {
  const s = setup();
  s.choose();
  const before = structuredClone(s.life);
  const bad = [
    op('deliver', { line: 0, n: 0, source: 'personal' }),
    op('deliver', { line: 0, n: '1', source: 'personal' }),
    op('deliver', { line: 0, n: 1.5, source: 'personal' }),
    op('deliver', { line: 0, n: 10000, source: 'personal' }),
    op('deliver', { line: 0, n: 1, source: 'friend', uid: s.members[1].id }),
    op('deliver', { line: 0, n: 1, source: 'personal', actor: 1 }),
    op('claim', { uid: s.members[1].id }),
    op('assign', { line: -1, assigned: true }),
    op('assign', { line: 0, assigned: 'yes' }),
    op('replace', { order: 'missing' }),
    op('choose', { order: '__proto__' }),
    op('choose', { order: communityOrderCandidates(week - 1)[0].id }),
  ];
  for (const action of bad)
    assert.throws(() => s.act(action), undefined, JSON.stringify(action));
  assert.deepEqual(s.life, before);
  assert.throws(() =>
    lifeAction(
      s.life,
      s.ledger,
      { ...s.members[0], actor: 1 },
      op('claim'),
      NOW,
    ),
  );
  assert.deepEqual(s.life, before);
});

test('bounded save recovery cannot invent completion from a done flag or overfilled contributor totals', () => {
  const s = setup(),
    def = s.choose();
  const valid = s.life.communityOrders.records[0];
  const fake = {
    ...structuredClone(valid),
    completedAt: NOW,
    claimed: [0, 1, 7],
    log: [],
  };
  const decoded = readCommunityOrders({ records: [fake] }).communityOrders
    .records[0];
  assert.equal(decoded.completedAt, undefined);
  assert.deepEqual(decoded.claimed, []);
  const counts = def.needs.map((need) => need.n);
  fake.by = {
    0: { n: counts, s: counts.map(() => 0) },
    1: { n: counts, s: counts.map(() => 0) },
  };
  assert.deepEqual(readCommunityOrders({ records: [fake] }), {});
  fake.by = { '07': { n: counts, s: counts.map(() => 0) }, __proto__: {} };
  assert.equal(
    readCommunityOrders({ records: [fake] }).communityOrders.records[0]
      .completedAt,
    undefined,
  );
  assert.deepEqual(readCommunityOrders(null), {});
  assert.equal(COMMUNITY_ORDER_LOG_MAX, 24);
});

test('cloud CAS retries preserve the winning choice and final quantity; receipts never redeliver or regrant', async () => {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const members = [0, 7].map((actor) => ({
    id: crypto.randomUUID(),
    actor,
    username: ACCOUNT_IDS[actor],
    connection: crypto.randomUUID(),
    sequence: 0,
    epoch: 0,
    code: '',
  }));
  const command = async (p, opName, extra = {}) => {
    const cmd = {
      op: opName,
      connection: p.connection,
      ...(p.code ? { code: p.code } : {}),
      ...(opName !== 'read'
        ? { requestId: crypto.randomUUID(), sequence: ++p.sequence }
        : {}),
      ...(opName === 'open' ? { epoch: p.epoch } : {}),
      ...extra,
    };
    return { cmd, hash: await commandHash(cmd) };
  };
  const run = async (p, action) => {
    const { cmd, hash } = await command(p, 'action', { action });
    const result = cloudTransition(world, p, cmd, hash, NOW);
    world = result.state;
    assert.equal(result.response.ok, true, result.response.error);
    return { ...result, cmd, hash };
  };
  for (const p of members) {
    const { cmd, hash } = await command(p, 'open', { code: 'BEMTADUVLY' });
    const result = cloudTransition(world, p, cmd, hash, NOW);
    world = result.state;
    assert.equal(result.response.ok, true, result.response.error);
    p.code = result.response.code;
    p.epoch = result.response.epoch;
  }
  const [a, b] = members,
    candidates = communityOrderCandidates(week),
    def = candidates[0];
  const aChoice = await command(a, 'action', {
    action: op('choose', { order: def.id }),
  });
  const bChoice = await command(b, 'action', {
    action: op('choose', { order: candidates[1].id }),
  });
  const base = structuredClone(world);
  const chosenA = cloudTransition(base, a, aChoice.cmd, aChoice.hash, NOW);
  const losingProposal = cloudTransition(
    base,
    b,
    bChoice.cmd,
    bChoice.hash,
    NOW,
  );
  assert.equal(
    losingProposal.response.ok,
    true,
    'both proposals read the initially empty week',
  );
  world = chosenA.state; // Only this proposal wins the world revision CAS.
  const retried = cloudTransition(world, b, bChoice.cmd, bChoice.hash, NOW);
  world = retried.state;
  assert.equal(retried.response.ok, false);
  assert.equal(readLife(world.life).communityOrders.records[0].order, def.id);
  for (const need of def.needs) give(world.life, a, need.item, need.n);
  give(world.life, b, def.needs[0].item, 10);
  await run(
    a,
    op('deliver', { line: 0, n: def.needs[0].n - 1, source: 'personal' }),
  );
  const aLast = await command(a, 'action', {
    action: op('deliver', { line: 0, n: 5, source: 'personal' }),
  });
  const bLast = await command(b, 'action', {
    action: op('deliver', { line: 0, n: 5, source: 'personal' }),
  });
  const lastBase = structuredClone(world);
  const finalA = cloudTransition(lastBase, a, aLast.cmd, aLast.hash, NOW);
  assert.equal(
    cloudTransition(lastBase, b, bLast.cmd, bLast.hash, NOW).response.ok,
    true,
  );
  world = finalA.state;
  const finalB = cloudTransition(world, b, bLast.cmd, bLast.hash, NOW);
  world = finalB.state;
  assert.equal(finalB.response.ok, false);
  assert.equal(
    itemCount(readLife(world.life), b.id, def.needs[0].item),
    10,
    'CAS retry sees no remainder and does not spend',
  );
  for (let line = 1; line < def.needs.length; line++)
    await run(
      a,
      op('deliver', { line, n: def.needs[line].n, source: 'personal' }),
    );
  const claimed = await run(a, op('claim'));
  assert.equal(readLife(world.life).ext[a.id].furn[def.reward.furniture], 1);
  const replay = cloudTransition(world, a, claimed.cmd, claimed.hash, NOW);
  assert.equal(replay.response.ok, true);
  assert.equal(
    readLife(replay.state.life).ext[a.id].furn[def.reward.furniture],
    1,
  );
  const replayDelivery = cloudTransition(
    replay.state,
    a,
    aLast.cmd,
    aLast.hash,
    NOW,
  );
  assert.equal(
    itemCount(readLife(replayDelivery.state.life), a.id, def.needs[0].item),
    0,
  );
  assert.equal(
    readLife(replayDelivery.state.life).communityOrders.records[0].by['0'].n[0],
    def.needs[0].n,
  );
});
