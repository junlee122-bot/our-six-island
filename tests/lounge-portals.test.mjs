import test from 'node:test';
import assert from 'node:assert/strict';
import { PORTALS, nearPortal, portalAt, portalNetwork, portalOpen } from '../app/lounge-portals.ts';
import { REGIONS, regionWalk } from '../app/lounge-areas.ts';
import { VILLAGE_START, villageCanWalk, villagePath } from '../app/lounge-village-layout.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { packLife, readLife } from '../app/lounge-life.ts';

const NOW = Date.UTC(2026, 10, 25, 3);
test('all nine waystones are reachable on foot and preserve the existing unlocks', () => {
  assert.equal(new Set(PORTALS.map((p) => p.area)).size, 9);
  for (const p of PORTALS) {
    const w = p.area === 'village' ? { canWalk: villageCanWalk, path: villagePath } : regionWalk(p.area);
    const from = p.area === 'village' ? VILLAGE_START : Object.values(REGIONS[p.area].arrive)[0];
    assert.equal(w.canWalk(p.point), true, p.area);
    const path = w.path(from, p.point);
    assert.deepEqual(path.at(-1), p.point, `${p.area} exact arrival is reachable`);
    for (let k = 0; k < 8; k++) assert.equal(w.canWalk({ x: p.point.x + Math.cos(k * Math.PI / 4) * .8, z: p.point.z + Math.sin(k * Math.PI / 4) * .8 }), true, `${p.area} arrival clearance ${k}`);
    assert.equal(nearPortal({ area: p.area, ...portalNetwork(p.area) }), true);
    assert.equal(portalOpen(p.area, { pass: true }), true);
  }
  for (const a of ['village', 'farm', 'market']) assert.equal(portalOpen(a), true);
  for (const a of ['harbor', 'hillside', 'ranch', 'foothill', 'hill', 'woods']) assert.equal(portalOpen(a), false);
  assert.equal(portalOpen('harbor', { flags: ['district-harbor'] }), true);
  assert.equal(portalAt('mine'), undefined);
  assert.equal(portalAt('offshore'), undefined);
  assert.equal(nearPortal({ area: 'home', x: 50, y: 50 }), false);
  assert.equal(nearPortal({ area: 'village', x: NaN, y: 50 }), false);
});

async function fixture() {
  const p = { id: crypto.randomUUID(), actor: 7, username: ACCOUNT_IDS[7], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' };
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const h = {
    p,
    get world() { return world; },
    player() { return world.rooms[p.code].snapshot.players.find((m) => m.id === p.id); },
    mutate(fn) { const life = readLife(world.life); fn(life); world.life = packLife(life); },
    async make(action) { const command = { op: 'action', code: p.code, connection: p.connection, requestId: crypto.randomUUID(), sequence: ++p.sequence, action }; return { command, hash: await commandHash(command) }; },
    apply({ command, hash }) {
      const before = structuredClone(world);
      const r = cloudTransition(world, p, command, hash, NOW);
      assert.deepEqual(world, before, 'caller-owned state is immutable');
      world = r.state; p.epoch = r.response.epoch;
      if (r.response.code) p.code = r.response.code;
      validateLedger(world.ledger);
      return r.response;
    },
    async send(action) { return this.apply(await this.make(action)); },
    async at(area) { const r = await this.send({ kind: 'area', area, ...portalNetwork(area) }); assert.equal(r.ok, true, r.error); },
    resources() { const life = readLife(world.life); return structuredClone({ accounts: world.ledger.accounts, bag: life.bag, farm: life.farm, growth: life.growth }); },
    reload() { world = JSON.parse(JSON.stringify(world)); },
  };
  const command = { op: 'open', code: 'PORTALTEST', connection: p.connection, epoch: p.epoch, requestId: crypto.randomUUID(), sequence: ++p.sequence };
  const opened = h.apply({ command, hash: await commandHash(command) });
  assert.equal(opened.ok, true, opened.error);
  return h;
}

test('cloud portals validate origin, destination and unlocks; canonical travel survives reload and replay', async () => {
  const h = await fixture();
  assert.equal((await h.send({ kind: 'portal', to: 'farm' })).ok, false, 'initial lounge is not a portal');
  await h.at('village');
  for (const to of ['mine', 'offshore', 'home', 'lighthouseTop', 'bogus', null]) {
    const before = structuredClone(h.player());
    assert.equal((await h.send({ kind: 'portal', to })).ok, false);
    assert.deepEqual(h.player(), before);
  }
  assert.equal((await h.send({ kind: 'portal', to: 'village' })).ok, false);
  for (const to of ['harbor', 'hillside', 'ranch', 'foothill', 'hill', 'woods']) assert.equal((await h.send({ kind: 'portal', to })).ok, false, `locked ${to}`);
  const before = h.resources();
  const request = await h.make({ kind: 'portal', to: 'farm', x: 0, y: 0, home: 0 });
  assert.equal(h.apply(request).ok, true);
  assert.equal(h.player().area, 'farm');
  assert.deepEqual({ x: h.player().x, y: h.player().y }, portalNetwork('farm'), 'client coordinates are ignored');
  assert.deepEqual(h.resources(), before, 'travel neither charges nor grants items');
  h.reload();
  assert.equal((await h.send({ kind: 'portal', to: 'market' })).ok, true, 'can use the destination portal immediately after reload');
  assert.equal(h.apply(request).ok, true, 'receipt replay returns success without repeating the trip');
  assert.equal(h.player().area, 'market');
  assert.equal(readLife(h.world.life).ext[h.p.id].town.seen.includes('farm'), true);
  assert.equal(readLife(h.world.life).ext[h.p.id].town.seen.includes('market'), true);
  await h.send({ kind: 'move', x: 50, y: 50 });
  assert.equal((await h.send({ kind: 'portal', to: 'farm' })).ok, false, 'cannot use a remote pad');
});

test('cloud portals honour district and mountain progress and block active fishing', async () => {
  const h = await fixture();
  await h.at('village');
  h.mutate((life) => {
    life.flags = [...(life.flags ?? []), 'district-harbor', 'district-hillside', 'district-ranch', 'district-foothill'];
    const done = { got: 1, mat: {}, by: { 7: 1 }, start: NOW - 2000, fullAt: NOW - 1000, doneAt: NOW - 1000 };
    life.growth = { ...(life.growth ?? {}), r: { forge: { ...done }, trail: { ...done } }, c: { woods: { actor: 7, at: NOW - 1000 } } };
  });
  for (const to of ['harbor', 'hillside', 'ranch', 'foothill', 'hill', 'woods', 'village']) {
    const r = await h.send({ kind: 'portal', to });
    assert.equal(r.ok, true, `${to}: ${r.error}`);
    assert.equal(h.player().area, to);
    assert.deepEqual({ x: h.player().x, y: h.player().y }, portalNetwork(to));
  }
  h.mutate((life) => { ((life.ext ??= {})[h.p.id] ??= {}).pending = { expiresAt: NOW + 10_000 }; });
  const from = structuredClone(h.player());
  const blocked = await h.send({ kind: 'portal', to: 'farm' });
  assert.equal(blocked.ok, false);
  assert.match(blocked.error, /낚시/);
  assert.deepEqual(h.player(), from);
});

test('a retained table seat blocks portal travel even if the player is outdoors', async () => {
  const h = await fixture();
  await h.at('village');
  h.world.rooms[h.p.code].snapshot.seats.chess[0] = h.p.id;
  const before = structuredClone(h.player());
  const r = await h.send({ kind: 'portal', to: 'farm' });
  assert.equal(r.ok, false);
  assert.match(r.error, /자리/);
  assert.deepEqual(h.player(), before);
});
