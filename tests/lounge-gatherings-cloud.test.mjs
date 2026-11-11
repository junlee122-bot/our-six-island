import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS, ACTOR_IDS } from '../app/lounge-roster.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { lifeView, packLife, readLife } from '../app/lounge-life.ts';

// The real cloud transition/CAS proposals against an in-memory world only.
const NOW = Date.UTC(2026, 10, 12, 3), MINUTE = 60_000;
const uuid = () => crypto.randomUUID();
const op = (op, fields = {}) => ({ kind: 'gathering', op, ...fields });
const expectOk = (result) => assert.equal(result.response.ok, true, result.response.error);
const expectFailure = (result, pattern) => { assert.equal(result.response.ok, false); if (pattern) assert.match(result.response.error, pattern); };
async function setup(actors = [0, 1, 7]) {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} }, now = NOW;
  const members = actors.map((actor) => ({ id: uuid(), actor, username: ACCOUNT_IDS[actor], connection: uuid(), sequence: 0, epoch: 0, code: '' }));
  const h = {
    members,
    get world() { return world; }, set world(value) { world = value; },
    get now() { return now; }, set now(value) { now = value; },
    get life() { return readLife(world.life); },
    view(member = members[0]) { return lifeView(this.life, member.id, member.actor, now).gatherings; },
    reload() { world = JSON.parse(JSON.stringify(world)); world.life = packLife(readLife(world.life)); },
    async request(member, operation, fields = {}) {
      const command = { op: operation, connection: member.connection,
        ...(member.code ? { code: member.code } : {}),
        ...(!['read', 'wallet'].includes(operation) ? { requestId: uuid(), sequence: ++member.sequence } : {}),
        ...(['open', 'join'].includes(operation) ? { epoch: member.epoch } : {}), ...fields };
      return { command, hash: await commandHash(command) };
    },
    apply(member, request) {
      const before = structuredClone(world);
      const result = cloudTransition(world, member, request.command, request.hash, now);
      assert.deepEqual(world, before, 'a CAS attempt cannot modify its source row');
      world = result.state;
      member.epoch = result.response.epoch;
      if (result.response.code) member.code = result.response.code;
      validateLedger(world.ledger);
      return { ...result, ...request };
    },
    async send(member, operation, fields = {}) { return this.apply(member, await this.request(member, operation, fields)); },
    async act(member, action) { return this.send(member, 'action', { action }); },
    async create(member = members[0], fields = {}) {
      const result = await this.act(member, op('create', { place: 'river-fishing', duration: 60, ...fields }));
      expectOk(result);
      return { result, meeting: this.view(member).open.find((entry) => entry.host === member.actor) };
    },
    resources() {
      const life = this.life;
      return structuredClone({ bag: life.bag, farms: life.farms, ext: life.ext, growth: life.growth, myday: life.myday,
        farmx: life.farmx, common: life.farm, memories: life.memories, ledger: world.ledger,
        tables: Object.fromEntries(Object.entries(world.rooms).map(([code, room]) => [code, { tables: room.snapshot.tables, seats: room.snapshot.seats, invites: room.snapshot.invites }])) });
    },
  };
  for (const member of members) expectOk(await h.send(member, 'open', { code: 'GATHERTST2' }));
  return h;
}

test('a shared gathering and RSVP reach every member, including actor seven, without money, rewards or automatic seats', async () => {
  const h = await setup(ACTOR_IDS), before = h.resources();
  const { result, meeting } = await h.create(h.members[0], { place: 'hall-yacht', note: '회관에서 만나요' });
  assert.ok(result.notifications.includes('GATHERTST2'));
  for (const member of h.members.slice(1)) expectOk(await h.act(member, op('join', { id: meeting.id })));
  assert.deepEqual(h.view(h.members[7]).open[0].participants, ACTOR_IDS);
  assert.deepEqual(h.resources(), before, 'RSVP consumes nothing and changes no farming, XP, personal day, game table or cash state');
  for (const member of h.members) {
    const read = await h.send(member, 'read'); expectOk(read);
    assert.equal(read.response.life.gatherings.open[0].id, meeting.id);
    assert.equal(read.response.life.gatherings.open[0].joined, true);
    assert.equal(read.response.life.gatherings.open[0].isHost, member.actor === 0);
    assert.equal('hostId' in read.response.life.gatherings.open[0], false);
  }
  expectOk(await h.act(h.members[0], op('finish', { id: meeting.id })));
  assert.equal(h.view(h.members[7]).previous[0].status, 'finished');
  assert.deepEqual(h.resources(), before, 'ending a meeting also grants no rewards or activity credit');
});

test('request replay and persisted receipts create exactly one meeting; fresh ids cannot reuse a processed sequence', async () => {
  const h = await setup(), host = h.members[0];
  const { result, meeting } = await h.create();
  const after = structuredClone(h.life.gatherings), seq = h.life.seq;
  expectOk(h.apply(host, result));
  h.reload(); expectOk(h.apply(host, result));
  assert.deepEqual(h.life.gatherings, after);
  assert.equal(h.life.seq, seq);
  assert.equal(h.view().open[0].id, meeting.id);
  const reused = { ...result.command, requestId: uuid() };
  const reusedHash = await commandHash(reused);
  assert.throws(() => h.apply(host, { command: reused, hash: reusedHash }), /이미 처리|순서/);
  const mismatched = { ...result.command, action: { ...result.command.action, duration: 120 } };
  assert.throws(() => h.apply(host, { command: mismatched, hash: 'f'.repeat(64) }), /이미 사용한 요청/);
  assert.deepEqual(h.life.gatherings, after);
});

test('competing host creations are re-evaluated after CAS and retain one open meeting in either commit order', async () => {
  const h = await setup(), host = h.members[0];
  const requests = await Promise.all([
    h.request(host, 'action', { action: op('create', { place: 'river-fishing', duration: 30 }) }),
    h.request(host, 'action', { action: op('create', { place: 'bakery-meal', duration: 120 }) }),
  ]);
  const base = structuredClone(h.world);
  for (const request of requests) assert.equal(cloudTransition(base, host, request.command, request.hash, NOW).response.ok, true);
  for (const order of [requests, [...requests].reverse()]) {
    h.world = structuredClone(base);
    expectOk(h.apply(host, order[0]));
    try { expectFailure(h.apply(host, order[1]), /내가 연 모임/); }
    catch (error) { assert.match(error.message, /이미 처리|순서/); }
    assert.equal(h.view().open.length, 1);
    assert.equal(h.view().open[0].place, order[0].command.action.place);
    assert.equal(h.life.seq, 1);
  }
});

test('concurrent joins merge after CAS, while cancel-versus-join cannot append a participant to a closed record', async () => {
  const h = await setup(), [host, b, c] = h.members;
  const { meeting } = await h.create(host, { startsAt: NOW + MINUTE });
  const joins = await Promise.all([b, c].map((member) => h.request(member, 'action', { action: op('join', { id: meeting.id }) })));
  const base = structuredClone(h.world);
  for (const entries of [[[b, joins[0]], [c, joins[1]]], [[c, joins[1]], [b, joins[0]]]]) {
    h.world = structuredClone(base);
    for (const [member, request] of entries) expectOk(h.apply(member, request));
    assert.deepEqual(h.view().open[0].participants, [0, 1, 7]);
  }
  h.world = structuredClone(base);
  const cancel = await h.request(host, 'action', { action: op('cancel', { id: meeting.id }) });
  for (const cancelFirst of [true, false]) {
    h.world = structuredClone(base);
    if (cancelFirst) { expectOk(h.apply(host, cancel)); expectFailure(h.apply(b, joins[0]), /이미 끝나거나 취소/); }
    else { expectOk(h.apply(b, joins[0])); expectOk(h.apply(host, cancel)); }
    const closed = structuredClone(h.life.gatherings);
    expectFailure(await h.act(c, op('join', { id: meeting.id })), /이미 끝나거나 취소/);
    assert.equal(h.view().previous[0].status, 'cancelled');
    assert.deepEqual(h.life.gatherings, closed);
    assert.deepEqual(h.view().previous[0].participants, cancelFirst ? [0] : [0, 1]);
  }
});

test('leaving the cloud room does not withdraw RSVP; reconnect restores the same future plan and permissions', async () => {
  const h = await setup(), [host, member] = h.members;
  const { meeting } = await h.create(host, { startsAt: NOW + 2 * MINUTE, place: 'tavern-meal' });
  expectOk(await h.act(member, op('join', { id: meeting.id })));
  expectOk(await h.send(member, 'leave'));
  member.code = '';
  h.reload();
  assert.equal(h.view(member).open[0].joined, true);
  expectOk(await h.act(member, op('leave', { id: meeting.id })));
  expectOk(await h.act(member, op('leave', { id: meeting.id })));
  assert.equal(h.view(member).open[0].joined, false);
  expectOk(await h.send(member, 'open', { code: 'GATHERTST2' }));
  expectOk(await h.act(member, op('join', { id: meeting.id })));
  assert.deepEqual(h.view(member).open[0].participants, [0, 1]);
  assert.equal(h.view(host).open[0].canCancel, true);
  assert.equal(h.view(member).open[0].canCancel, false);
});

test('host disconnect and room expiry do not erase plans; server time alone starts and expires the meeting', async () => {
  const h = await setup(), [host, member] = h.members;
  const { meeting } = await h.create(host, { startsAt: NOW + 5 * MINUTE, duration: 30 });
  const saved = structuredClone(h.life.gatherings);
  expectOk(await h.send(host, 'leave')); host.code = '';
  h.now = NOW + 6 * MINUTE;
  expectOk(await h.send(member, 'open', { code: 'GATHERTST2' }));
  assert.equal(h.view(member).open[0].status, 'running');
  expectOk(await h.act(member, op('join', { id: meeting.id })));
  const joined = structuredClone(h.life.gatherings);
  h.reload(); h.now = meeting.endsAt;
  const read = await h.send(member, 'open', { code: 'GATHERTST2' }); expectOk(read);
  assert.equal(read.response.life.gatherings.open.length, 0);
  assert.equal(read.response.life.gatherings.previous[0].status, 'expired');
  assert.deepEqual(h.life.gatherings, joined, 'time projection does not need a host heartbeat or mutate the saved plan');
  assert.equal(saved.records[0].id, h.life.gatherings.records[0].id);
});

test('strict actions and ownership failures preserve state and persist safe rejection receipts', async () => {
  const h = await setup(), [host, member] = h.members;
  const { meeting } = await h.create(host, { startsAt: NOW + MINUTE });
  const before = h.resources(), gatherings = structuredClone(h.life.gatherings);
  for (const a of [
    op('cancel', { id: meeting.id }), op('finish', { id: meeting.id }),
    op('join', { id: meeting.id, actor: 0 }),
    op('create', { place: 'home', duration: 30 }),
    op('create', { place: 'river-fishing', duration: 30, host: 0 }),
  ]) {
    const rejected = await h.act(member, a); expectFailure(rejected);
    expectFailure(h.apply(member, rejected));
    assert.deepEqual(h.life.gatherings, gatherings);
    assert.deepEqual(h.resources(), before);
  }
  const wrongMember = { ...member, actor: 8 };
  const request = await h.request(member, 'action', { action: op('join', { id: meeting.id }) });
  assert.throws(() => h.apply(wrongMember, request), /등록된 계정/);
});

test('membership changes invalidate lifeHash and broadcast to every room while unchanged reads can omit the life payload', async () => {
  const h = await setup(), [, member, other] = h.members;
  expectOk(await h.send(other, 'leave')); other.code = '';
  expectOk(await h.send(other, 'open', { code: 'GATHERALT2' }));
  const { result, meeting } = await h.create();
  assert.deepEqual(new Set(result.notifications), new Set(['GATHERTST2', 'GATHERALT2']));
  const read = await h.send(member, 'read'); expectOk(read);
  const unchanged = await h.send(member, 'read', { lifeHash: read.response.lifeHash }); expectOk(unchanged);
  assert.equal(unchanged.response.life, undefined);
  const joined = await h.act(other, op('join', { id: meeting.id })); expectOk(joined);
  assert.deepEqual(new Set(joined.notifications), new Set(['GATHERTST2', 'GATHERALT2']));
  const changed = await h.send(member, 'read', { lifeHash: read.response.lifeHash }); expectOk(changed);
  assert.deepEqual(changed.response.life.gatherings.open[0].participants, [0, 7]);
  assert.notEqual(changed.response.lifeHash, read.response.lifeHash);
});
