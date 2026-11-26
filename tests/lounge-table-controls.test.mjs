import test from 'node:test';
import assert from 'node:assert/strict';
import {
  claimTableAction,
  isTableActionPending,
  newTableActionLock,
  releaseTableAction,
  tableActionKey,
  tableBetPreview,
} from '../app/lounge-table-controls.ts';
import {
  newPoker,
  pokerAction,
  pokerLegalActions,
} from '../app/lounge-poker.ts';
import { newSeotda, seotdaAction, seotdaLegal } from '../app/lounge-seotda.ts';

test('the first tap claims a snapshot before React can render the disabled button', () => {
  const lock = newTableActionLock(),
    key = tableActionKey({ id: 'table', revision: 4 });
  const ticket = claimTableAction(lock, key);
  assert.ok(ticket);
  assert.equal(claimTableAction(lock, key), null);
  assert.equal(isTableActionPending(lock, key), true);
  assert.equal(releaseTableAction(lock, ticket), true);
  assert.ok(claimTableAction(lock, key), 'a failed action can be retried');
});

test('a late failure from an older snapshot cannot unlock the next queued choice', async () => {
  const lock = newTableActionLock();
  let rejectOld;
  const result = new Promise((resolve) => {
    rejectOld = resolve;
  });
  const old = claimTableAction(lock, 'table:4');
  const lateFailure = result.then(() => releaseTableAction(lock, old));
  // A poll/automatic game step arrived before the old request finished.
  const next = claimTableAction(lock, 'table:5');
  assert.ok(next);
  rejectOld(false);
  assert.equal(await lateFailure, false);
  assert.equal(isTableActionPending(lock, 'table:5'), true);
  assert.equal(
    claimTableAction(lock, 'table:5'),
    null,
    'the queued choice still blocks a second tap',
  );
  assert.equal(releaseTableAction(lock, next), true);
  const retry = claimTableAction(lock, 'table:5');
  assert.ok(retry);
  assert.equal(
    releaseTableAction(lock, next),
    false,
    'an old callback cannot unlock a retry of the same snapshot',
  );
  assert.equal(isTableActionPending(lock, 'table:5'), true);
});

test('changing tables or starting a new match does not reuse an old revision lock', () => {
  const lock = newTableActionLock();
  const old = claimTableAction(
    lock,
    tableActionKey({ id: 'first', revision: 0 }),
  );
  const key = tableActionKey({ id: 'second', revision: 0 });
  assert.ok(claimTableAction(lock, key));
  assert.equal(releaseTableAction(lock, old), false);
  assert.equal(isTableActionPending(lock, key), true);
});

test('holdem preview spends only the additional chips, including a previously posted blind', () => {
  const g = newPoker('preview', [1000, 1000]);
  const seat = g.turn,
    legal = pokerLegalActions(g, seat);
  assert.equal(g.bets[seat], 100);
  const before = structuredClone(g);
  for (const to of [legal.minTo, legal.maxTo]) {
    const preview = tableBetPreview(to, g.bets[seat], g.stacks[seat], legal);
    const next = pokerAction(g, seat, { kind: 'raise', to });
    assert.ok(preview && next);
    assert.equal(preview.additional, g.stacks[seat] - next.stacks[seat]);
    assert.equal(preview.remaining, next.stacks[seat]);
    assert.equal(preview.allIn, next.stacks[seat] === 0);
  }
  assert.deepEqual(g, before, 'preview does not alter the game or wallet');
});

test('seotda preview includes chips already bet in the current betting round', () => {
  let g = newSeotda('preview', 3, 1000);
  for (const action of [
    { kind: 'raise', to: 200 },
    { kind: 'raise', to: 400 },
    { kind: 'call' },
  ]) {
    g = seotdaAction(g, g.turn, action);
    assert.ok(g);
  }
  const seat = g.turn,
    legal = seotdaLegal(g, seat);
  assert.equal(g.bets[seat], 200);
  const preview = tableBetPreview(
    legal.minTo,
    g.bets[seat],
    g.stacks[seat],
    legal,
  );
  const next = seotdaAction(g, seat, { kind: 'raise', to: legal.minTo });
  assert.ok(preview && next);
  assert.equal(preview.additional, g.stacks[seat] - next.stacks[seat]);
  assert.equal(preview.remaining, next.stacks[seat]);
});

test('invalid and unavailable amounts never show an actionable bet preview', () => {
  const g = newPoker('invalid-preview', [1000, 1000]);
  const seat = g.turn,
    legal = pokerLegalActions(g, seat);
  for (const to of [
    NaN,
    Infinity,
    -1,
    0,
    legal.minTo - 1,
    legal.maxTo + 1,
    legal.minTo + 0.5,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    assert.equal(
      tableBetPreview(to, g.bets[seat], g.stacks[seat], legal),
      null,
    );
    assert.equal(pokerAction(g, seat, { kind: 'raise', to }), null);
  }
  assert.equal(
    tableBetPreview(400, 100, 900, { ...legal, canRaise: false }),
    null,
  );
  assert.equal(
    tableBetPreview(400, undefined, undefined, legal),
    null,
    'spectators have no own stack',
  );
});
