// 무드 아늑함: room score from the profile save (lounge-mood-room.ts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOM_COPIES_MAX, cozyScore, roomItemValue, roomScore } from '../app/lounge-mood-room.ts';
import { catalogEntry, defaultBedroom } from '../app/lounge-bedroom-data.ts';
import { COZY_TIERS, cozyOf } from '../app/lounge-mood-data.ts';

const room = (items, extra = {}) => ({ bedroom: { ...defaultBedroom(3), ...extra, items } });
const item = (ref, i) => ({ id: `${ref}-${i}`, kind: catalogEntry(ref).kind, ref, x: -3 + (i % 6), z: -2 + Math.floor(i / 6), rotY: 0, scale: 1 });

test('every starting room is at least 아늑해요', () => {
  for (let a = 0; a < 7; a++) {
    const score = roomScore({ bedroom: defaultBedroom(a) }, a);
    assert.ok(score >= 20, `actor ${a}: ${score}`);
    assert.ok(cozyOf(score).value >= 2);
  }
  // No save yet: the actor's default room.
  assert.equal(roomScore(null, 2), roomScore({ bedroom: defaultBedroom(2) }, 2));
});

test('item values: plain 1, rare 5, shop furniture by price (1–8); unknown 0', () => {
  assert.equal(roomItemValue('bed'), 1);
  assert.equal(roomItemValue('trophy-carrot'), 5);
  assert.ok(roomItemValue('furn-grand-piano') >= 2 && roomItemValue('furn-grand-piano') <= 8);
  assert.equal(roomItemValue('no-such-thing'), 0);
});

test('copies past the fifth count nothing; categories add 3 each; premium styles 4; house ×8', () => {
  const five = roomScore(room(Array.from({ length: ROOM_COPIES_MAX }, (_, i) => item('plant', i))));
  const many = roomScore(room(Array.from({ length: 30 }, (_, i) => item('plant', i))));
  assert.equal(many, five, 'carpeting with one thing does not pay');
  assert.equal(five, ROOM_COPIES_MAX * 1 + 3);
  const mixed = roomScore(room([item('plant', 0), item('bed', 1)]));
  assert.equal(mixed, 2 + 3 * 2);
  const gold = roomScore(room([item('plant', 0)], { wall: 'gold' }));
  assert.equal(gold, 1 + 3 + 4);
  assert.equal(cozyScore(40, 4), 72);
  assert.equal(cozyOf(cozyScore(40, 4)).name, '멋져요');
  assert.deepEqual(
    COZY_TIERS.map((t) => t.value),
    [8, 6, 4, 2, 0],
  );
});
