import assert from 'node:assert/strict';

/** HTTP attempts may repeat; a second user action must have a new request ID. */
export function actionAttemptEvidence(commands) {
  return {
    attempts: commands.length,
    requestIds: [...new Set(commands.map((command) => command.requestId))],
    commands: structuredClone(commands),
  };
}

export function assertSingleLogicalAction(commands, kind, label) {
  assert.ok(commands.length, label + ': an action was sent');
  for (const command of commands) {
    assert.equal(command.op, 'action', label + ': action operation');
    assert.equal(command.action?.kind, kind, label + ': expected resource action');
    assert.ok(typeof command.requestId === 'string' && command.requestId.length > 0,
      label + ': every attempt has a request ID');
  }
  const evidence = actionAttemptEvidence(commands);
  assert.equal(evidence.requestIds.length, 1, label + ': exactly one logical action');
  for (const command of commands.slice(1))
    assert.deepEqual(command, commands[0], label + ': a retry preserves the entire command');
  return evidence;
}

/** Only this synthetic player's holdings and the resource being gathered. */
export function resourceActionState(life, action) {
  assert.ok(life?.me?.bag, 'resource response includes a life view');
  let resource;
  if (action.kind === 'pick') resource = { readyAt: life.me.fruitReadyAt?.[action.tree] ?? 0 };
  else if (action.kind === 'forage') {
    const spawn = life.me.spawns.find((s) => s.spot === action.spot && s.kind === 'forage');
    assert.ok(spawn, 'forage remains in the canonical daily resource view');
    resource = { taken: spawn.taken, item: spawn.item };
  } else if (action.kind === 'chop') {
    const node = life.growth.nodes.find((n) => n.id === action.node);
    assert.ok(node, 'node remains in the canonical daily resource view');
    resource = { taken: node.taken };
  } else assert.fail('Unsupported resource action: ' + action.kind);
  return structuredClone({ bag: life.me.bag, inv: life.me.inv ?? {}, resource });
}

export function assertSingleResourceChange(before, replies, after, label) {
  assert.ok(replies.length, label + ': a successful canonical reply was observed');
  const first = replies[0];
  assert.notDeepEqual(first.resource, before.resource, label + ': resource was collected');
  assert.notDeepEqual({ bag: first.bag, inv: first.inv }, { bag: before.bag, inv: before.inv },
    label + ': gathering added to the bag');
  for (const reply of replies.slice(1))
    assert.deepEqual(reply, first, label + ': retry did not gather again');
  assert.deepEqual(after, first, label + ': canonical resource and bag changed exactly once');
}
