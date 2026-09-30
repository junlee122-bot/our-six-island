// 승준's temporary explorer pass: every area and mine floor without unlocks,
// only for 승준 and only until it expires.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPLORER_PASS, hasExplorerPass } from '../app/lounge-explorer-pass.ts';
import { ACTORS } from '../app/lounge-roster.ts';
import { areaOpen, mineCanGo } from '../app/lounge-growth.ts';
import { ensureLifeMember, readLife } from '../app/lounge-life.ts';

const ids = ACTORS.map((_, i) => `00000000-0000-4000-8000-00000000000${i}`);
const life = () => {
  let l = readLife(undefined);
  ids.forEach((id, i) => { l = ensureLifeMember(l, id, i); });
  return l;
};
const now = Date.UTC(2026, 9, 1, 3);

test('the pass belongs to 승준 and expires', () => {
  assert.equal(ACTORS[EXPLORER_PASS.actor], '승준');
  assert.equal(hasExplorerPass(EXPLORER_PASS.actor, now), true);
  assert.equal(hasExplorerPass(EXPLORER_PASS.actor, EXPLORER_PASS.until), false);
  for (let a = 0; a < ACTORS.length; a++) if (a !== EXPLORER_PASS.actor) assert.equal(hasExplorerPass(a, now), false);
  assert.equal(hasExplorerPass(undefined, now), false);
});

test('승준 enters locked areas and any mine floor; others still need the unlocks', () => {
  const l = life(), seungjun = ids[EXPLORER_PASS.actor], other = ids[0];
  assert.equal(areaOpen(l, 'hill', now, seungjun), true);
  assert.equal(areaOpen(l, 'woods', now, seungjun), true);
  assert.equal(areaOpen(l, 'hill', now, other), false);
  assert.equal(mineCanGo(l, seungjun, 15, now), null);
  assert.notEqual(mineCanGo(l, other, 1, now), null);
  assert.notEqual(mineCanGo(l, seungjun, 999, now), null, 'floors outside the mine stay invalid');
  assert.equal(areaOpen(l, 'hill', EXPLORER_PASS.until, seungjun), false);
});
