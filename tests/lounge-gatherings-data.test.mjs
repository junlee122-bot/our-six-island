import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GATHERING_ACTIVITY_LABEL, GATHERING_PLACES, gatheringPlace } from '../app/lounge-gatherings-data.ts';
import { TABLE_AREA, GAME_INFO } from '../app/lounge-games.ts';
import { districtOpen } from '../app/lounge-districts.ts';
import { VENUES } from '../app/lounge-venues.ts';
import { SPOT_INFO } from '../app/lounge-items.ts';

test('eight canonical basic-access places cover all three activities without accepting a free-form location', () => {
  assert.equal(GATHERING_PLACES.length, 8);
  assert.equal(new Set(GATHERING_PLACES.map((p) => p.id)).size, 8);
  assert.deepEqual([...new Set(GATHERING_PLACES.map((p) => p.activity))].sort(), ['fishing', 'meal', 'table']);
  for (const place of GATHERING_PLACES) {
    assert.equal(gatheringPlace(place.id), place);
    assert.ok(place.label && place.hint && GATHERING_ACTIVITY_LABEL[place.activity]);
    if (place.activity === 'table') {
      assert.ok(GAME_INFO[place.game]); assert.equal(TABLE_AREA[place.game], place.area);
      assert.ok(VENUES[place.area]);
    } else assert.equal(place.game, undefined);
  }
  assert.equal(districtOpen('market'), true, 'bakery is in an initially open district');
  assert.equal(SPOT_INFO.river.flag, undefined); assert.equal(SPOT_INFO.pond.flag, undefined);
  for (const unknown of [undefined, null, 7, {}, [], '__proto__', 'sea-fishing', 'my-house']) assert.equal(gatheringPlace(unknown), undefined);
});

test('engine metadata is immutable and imports no renderer, life engine, coordinates or browser APIs', () => {
  const place = gatheringPlace('hall-yacht');
  assert.throws(() => { place.game = 'poker'; }, TypeError);
  assert.throws(() => { GATHERING_PLACES.push(place); }, TypeError);
  assert.deepEqual(Object.keys(place).sort(), ['activity', 'area', 'game', 'hint', 'id', 'label']);
  const source = readFileSync(new URL('../app/lounge-gatherings-data.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /^\s*import\s/m);
  assert.doesNotMatch(source, /\b(?:window|document|localStorage|fetch)\s*[.(]/);
});
