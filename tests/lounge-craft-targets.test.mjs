import test from 'node:test';
import assert from 'node:assert/strict';
import { DISHES, CRAFTS } from '../app/lounge-items.ts';
import { readCraftTargets } from '../app/lounge-craft-tracker.ts';
import { ensureLifeMember, lifeAction, lifeView, packLife, readLife } from '../app/lounge-life.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

const NOW = Date.UTC(2026, 10, 11, 4);
const cook = (i, quantity = 1) => ({ kind: 'cook', id: DISHES[i].id, quantity });
const craft = (quantity = 1) => ({ kind: 'craft', id: CRAFTS[0].id, quantity });
const goal = (op, target) => ({ kind: 'craftTarget', op, target });
function setup() {
  const a = { id: crypto.randomUUID(), actor: 0 }, b = { id: crypto.randomUUID(), actor: 1 };
  let life = ensureLifeMember(ensureLifeMember(readLife(undefined), a.id, a.actor), b.id, b.actor);
  const ledger = newLoungeLedger();
  return { a, b, ledger, get life() { return life; },
    act(member, op, target) {
      const before = structuredClone(life), result = lifeAction(life, ledger, member, goal(op, target), NOW);
      assert.deepEqual(life, before, 'the original state is immutable');
      assert.equal(result.ledger, ledger, 'pinning never changes the ledger');
      life = result.life;
      return life;
    },
  };
}

test('craft targets are private, durable and compatible with old or damaged saves', () => {
  const s = setup();
  assert.deepEqual(lifeView(s.life, s.a.id, s.a.actor, NOW).me.craftTargets, []);
  s.act(s.a, 'pin', cook(0, 3));
  s.act(s.b, 'pin', craft(2));
  const reloaded = readLife(JSON.parse(JSON.stringify(packLife(s.life))));
  assert.deepEqual(lifeView(reloaded, s.a.id, s.a.actor, NOW).me.craftTargets, [cook(0, 3)]);
  assert.deepEqual(lifeView(reloaded, s.b.id, s.b.actor, NOW).me.craftTargets, [craft(2)]);
  const ownView = lifeView(reloaded, s.a.id, s.a.actor, NOW);
  assert.equal(ownView.me.craftTargets.some((t) => t.kind === 'craft'), false, 'another account’s private goal is absent');
  ownView.me.craftTargets[0].quantity = 100;
  assert.equal(reloaded.ext[s.a.id].craftTargets[0].quantity, 3, 'views cannot mutate the stored goal');
  reloaded.ext[s.a.id].craftTargets = [cook(0), { ...cook(1), quantity: -1 }, cook(0, 5), { kind: 'cook', id: 'missing', quantity: 1 }];
  assert.deepEqual(readLife(reloaded).ext[s.a.id].craftTargets, readCraftTargets(reloaded.ext[s.a.id].craftTargets));
});

test('atomic pins preserve concurrent goals, enforce three slots and make stale updates harmless', () => {
  const s = setup();
  s.act(s.a, 'pin', cook(0, 2));
  s.act(s.a, 'pin', craft());
  s.act(s.a, 'pin', cook(0, 99));
  assert.deepEqual(s.life.ext[s.a.id].craftTargets, [cook(0, 2), craft()], 'pinning an existing goal keeps its quantity');
  s.act(s.a, 'quantity', cook(0, 4));
  assert.deepEqual(s.life.ext[s.a.id].craftTargets, [cook(0, 4), craft()], 'a quantity update keeps goals added by another client');
  s.act(s.a, 'pin', cook(1));
  assert.throws(() => s.act(s.a, 'pin', cook(2)), /세 개/);
  s.act(s.a, 'remove', cook(0));
  s.act(s.a, 'quantity', cook(0, 7));
  s.act(s.a, 'remove', cook(0));
  assert.deepEqual(s.life.ext[s.a.id].craftTargets, [craft(), cook(1)], 'a delayed update cannot recreate a removed goal');
  s.act(s.a, 'pin', cook(2));
  assert.equal(s.life.ext[s.a.id].craftTargets.length, 3);
});

test('goal requests reject malformed values and never consume goods or settle unrelated life progress', () => {
  const s = setup();
  const before = structuredClone(s.life);
  s.act(s.a, 'pin', cook(0, 999));
  const after = structuredClone(s.life);
  delete after.ext[s.a.id].craftTargets;
  delete after.ext[s.a.id];
  if (!Object.keys(after.ext).length) delete after.ext;
  assert.deepEqual(after, before, 'only the goal list changed: no inventory, farm, XP or daily settlement');
  const badTargets = [null, [], {}, { ...cook(0), quantity: 0 }, { ...cook(0), quantity: 1000 },
    { ...cook(0), quantity: 1.5 }, { ...cook(0), quantity: '2' }, { ...cook(0), kind: 'unknown' },
    { ...cook(0), id: 'missing' }, { ...cook(0), uid: s.b.id }];
  for (const target of badTargets)
    assert.throws(() => lifeAction(s.life, s.ledger, s.a, goal('pin', target), NOW), /제작 목표/);
  assert.throws(() => lifeAction(s.life, s.ledger, s.a, goal('replace', cook(0)), NOW), /제작 목표/);
  assert.throws(() => lifeAction(s.life, s.ledger, s.a, { ...goal('pin', cook(0)), uid: s.b.id }, NOW), /제작 목표/);
  assert.deepEqual(lifeView(s.life, s.b.id, s.b.actor, NOW).me.craftTargets, []);
});

test('cloud commands persist own goals once, return them after reload and refuse forged ownership', async () => {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const member = (actor) => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' });
  const run = async (p, op, extra = {}) => {
    const command = { op, connection: p.connection, ...(p.code ? { code: p.code } : {}),
      ...(op !== 'read' ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}),
      ...(op === 'open' ? { epoch: p.epoch } : {}), ...extra };
    const hash = await commandHash(command), r = cloudTransition(world, p, command, hash, NOW);
    world = r.state; p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    return { ...r, command, hash };
  };
  const a = member(0), b = member(1);
  await run(a, 'open', { code: 'BEMTADUVLY' });
  await run(b, 'open', { code: 'BEMTADUVLY' });
  const bags = structuredClone(readLife(world.life).bag), balances = structuredClone(world.ledger.accounts);
  const pinned = await run(a, 'action', { action: goal('pin', cook(0, 3)) });
  assert.equal(pinned.response.ok, true, pinned.response.error);
  assert.deepEqual(pinned.response.life.me.craftTargets, [cook(0, 3)]);
  world = cloudTransition(world, a, pinned.command, pinned.hash, NOW).state;
  assert.equal(readLife(world.life).ext[a.id].craftTargets.length, 1, 'receipt replay does not add another goal');
  const forged = await run(a, 'action', { action: { ...goal('pin', cook(1)), uid: b.id } });
  assert.equal(forged.response.ok, false);
  assert.deepEqual((await run(b, 'read')).response.life.me.craftTargets, []);
  world = JSON.parse(JSON.stringify(world));
  assert.deepEqual((await run(a, 'read')).response.life.me.craftTargets, [cook(0, 3)]);
  assert.deepEqual(readLife(world.life).bag, bags);
  assert.deepEqual(world.ledger.accounts, balances);
});
