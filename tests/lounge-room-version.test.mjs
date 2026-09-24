import test from 'node:test';
import assert from 'node:assert/strict';
import { accountSave } from '../app/lounge-accounts.ts';
import { defaultBedroom } from '../app/lounge-bedroom-data.ts';
import { freshLounge } from '../app/lounge-look.ts';
test('old browser room writes (v1/v2 canvas) cannot replace any v3 room', () => {
  for (let actor = 0; actor < 7; actor++) {
    const room = { ...defaultBedroom(actor), items: [] };
    const previous = { ...freshLounge(actor), bedroom: room };
    const old = { version: 1, designVersion: 2, wall: 'cream', floor: 'oak', items: [] };
    const updated = accountSave({ ...previous, bedroom: old }, actor, previous);
    assert.deepEqual(updated.bedroom, room);
    const explicitReset = accountSave({ ...previous, bedroom: null }, actor, previous);
    assert.deepEqual(explicitReset.bedroom, defaultBedroom(actor));
    // A server that still holds an old room: the old write becomes the new default.
    const oldServer = { ...freshLounge(actor), bedroom: old };
    assert.deepEqual(accountSave({ ...oldServer }, actor, oldServer).bedroom, defaultBedroom(actor));
  }
});
