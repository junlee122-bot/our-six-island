import test from 'node:test';
import assert from 'node:assert/strict';
import { accountSave } from '../app/lounge-accounts.ts';
import { defaultBedroom } from '../app/lounge-bedroom-data.ts';
import { freshLounge } from '../app/lounge-look.ts';
test('old browser room writes cannot replace any newly designed and customized room', () => {
  for (let actor = 0; actor < 7; actor++) {
    const room = { ...defaultBedroom(actor), designVersion: 2, items: [] };
    const previous = { ...freshLounge(actor), bedroom: room };
    const old = { ...defaultBedroom(actor) };
    delete old.designVersion;
    const updated = accountSave({ ...previous, bedroom: old }, actor, previous);
    assert.deepEqual(updated.bedroom, room);
    const explicitReset = accountSave(
      { ...previous, bedroom: null },
      actor,
      previous,
    );
    assert.deepEqual(explicitReset.bedroom, defaultBedroom(actor));
  }
});
