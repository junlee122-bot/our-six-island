import test from 'node:test';
import assert from 'node:assert/strict';
import { actionAttemptEvidence, assertSingleLogicalAction, assertSingleResourceChange, resourceActionState } from '../scripts/ui-action-guard.mjs';

const command = () => ({ op: 'action', requestId: 'request-1', connection: 'connection-1', sequence: 8,
  code: 'SYNTHETIC', action: { kind: 'pick', tree: 'tree-1' } });

test('resource guard accepts transport retries but records their actual attempts', () => {
  const first = command(), retried = structuredClone(first);
  assert.equal(assertSingleLogicalAction([first], 'pick', 'pick').attempts, 1);
  const evidence = assertSingleLogicalAction([first, retried], 'pick', 'pick');
  assert.equal(evidence.attempts, 2);
  assert.deepEqual(evidence.requestIds, ['request-1']);
  assert.deepEqual(evidence.commands, [first, retried]);
});

test('resource guard rejects a second logical action even if the server rejects its duplicate harvest', () => {
  const first = command(), second = { ...command(), requestId: 'request-2', sequence: 9 };
  assert.equal(actionAttemptEvidence([first, second]).requestIds.length, 2);
  assert.throws(() => assertSingleLogicalAction([first, second], 'pick', 'pick'), /exactly one logical action/);
});

test('same-ID attempts must preserve operation, resource, sequence, connection and all other payload fields', () => {
  for (const patch of [{ op: 'read' }, { action: { kind: 'pick', tree: 'tree-2' } },
    { sequence: 9 }, { connection: 'connection-2' }, { code: 'OTHER' }])
    assert.throws(() => assertSingleLogicalAction([command(), { ...command(), ...patch }], 'pick', 'pick'));
  assert.throws(() => assertSingleLogicalAction([], 'pick', 'pick'), /an action was sent/);
  assert.throws(() => assertSingleLogicalAction([{ ...command(), requestId: undefined }], 'pick', 'pick'), /request ID/);
});

test('canonical check rejects double rewards, second resource changes and unchanged bags', () => {
  const before = { bag: { fruit: 0 }, inv: {}, resource: { readyAt: 0 } };
  const after = { bag: { fruit: 2 }, inv: {}, resource: { readyAt: 1000 } };
  assertSingleResourceChange(before, [after, structuredClone(after)], after, 'pick');
  assert.throws(() => assertSingleResourceChange(before, [after], { ...after, bag: { fruit: 4 } }, 'pick'), /exactly once/);
  assert.throws(() => assertSingleResourceChange(before, [after, { ...after, resource: { readyAt: 2000 } }], after, 'pick'), /gather again/);
  assert.throws(() => assertSingleResourceChange(before, [{ ...after, bag: before.bag }], after, 'pick'), /added to the bag/);
  assert.throws(() => assertSingleResourceChange(before, [], after, 'pick'), /successful canonical reply/);
});

test('canonical snapshots select the exact pick, forage and chop targets and are detached', () => {
  const life = { me: { bag: { fruit: 1 }, inv: { wood: 3 }, fruitReadyAt: { 'tree-1': 120 },
    spawns: [{ kind: 'forage', spot: 'meadow', item: 'stone', taken: true }] },
    growth: { nodes: [{ id: 'bush-1', taken: true }] } };
  const snapshot = resourceActionState(life, command().action);
  life.me.bag.fruit = 10;
  assert.equal(snapshot.bag.fruit, 1);
  assert.deepEqual(snapshot.resource, { readyAt: 120 });
  assert.deepEqual(resourceActionState(life, { kind: 'forage', spot: 'meadow' }).resource, { taken: true, item: 'stone' });
  assert.deepEqual(resourceActionState(life, { kind: 'chop', node: 'bush-1' }).resource, { taken: true });
});
