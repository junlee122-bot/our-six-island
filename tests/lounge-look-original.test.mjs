import test from 'node:test';
import assert from 'node:assert/strict';
import { collectionsFor, readLook, ORIGINAL_ACTORS } from '../app/lounge-look.ts';

test("'처음 만난 우리' stays only for 호현; other saved looks read as '우리다운 하루'", () => {
  assert.deepEqual(ORIGINAL_ACTORS, [6]);
  for (let actor = 0; actor < 7; actor++) {
    const keep = actor === 6;
    assert.equal(collectionsFor(actor).some((c) => c.id === 'original'), keep, `actor ${actor}`);
    const look = readLook({ collection: 'original', hat: 'none', top: 'ocean' }, actor);
    assert.equal(look.collection, keep ? 'original' : 'classic', `actor ${actor}`);
  }
});
