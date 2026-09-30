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

// The client's locked gates read the region view: the fallen log to 숲 깊은 곳
// and the mine's floor picker / ladder (lounge-area-3d.tsx, lounge/Outdoor.tsx).
test('the region view carries the pass: 승준 walks past the log and picks any mine floor', async () => {
  const { growthView } = await import('../app/lounge-growth.ts');
  const { lifeAction } = await import('../app/lounge-life.ts');
  const { newLoungeLedger, registerWallet } = await import('../app/lounge-economy.ts');
  const { MINE_FLOORS_P2, mineStops } = await import('../app/lounge-mine.ts');
  let l = life(),
    ledger = newLoungeLedger();
  for (const id of ids) ledger = registerWallet(ledger, 'wallet-' + id);
  const seungjun = { id: ids[EXPLORER_PASS.actor], actor: EXPLORER_PASS.actor },
    other = { id: ids[0], actor: 0 };
  const act = (m, a) => {
    const r = lifeAction(l, ledger, m, a, now);
    l = r.life;
    ledger = r.ledger;
  };
  const his = growthView(l, seungjun.id, now).regions;
  assert.equal(his.pass, true);
  assert.equal(his.hill.open && his.woods.open && his.mine.open, true);
  assert.equal(his.woods.cleared, null, 'the log is still there for everyone');
  const theirs = growthView(l, other.id, now).regions;
  assert.equal(theirs.pass, undefined);
  assert.equal(theirs.mine.open, false);
  // Straight to floor 7 from the entrance picker; the ladder down is there at once.
  act(seungjun, { kind: 'mineGo', floor: 7 });
  const at7 = growthView(l, seungjun.id, now).regions.mine;
  assert.equal(at7.at, 7);
  assert.equal(at7.ladder, true);
  act(seungjun, { kind: 'mineGo', floor: 8 });
  act(seungjun, { kind: 'mineGo', floor: MINE_FLOORS_P2 });
  assert.equal(growthView(l, seungjun.id, now).regions.mine.ladder, false, 'no ladder below the bottom floor');
  assert.throws(() => act(other, { kind: 'mineGo', floor: 1 }));
  // The picker: every floor with the pass (deep rocks still name their pickaxe); the lift's stops without it.
  const stops = mineStops({ deep: 0, pickaxe: 1 }, true);
  assert.deepEqual(stops.map((s) => s.floor), Array.from({ length: MINE_FLOORS_P2 }, (_, i) => i + 1));
  assert.equal(stops[0].pick, null);
  assert.equal(stops.at(-1).pick, 4);
  assert.deepEqual(mineStops({ deep: 12, pickaxe: 1 }).map((s) => [s.floor, s.pick]), [[1, null], [5, null], [10, 2]]);
  // After the pass ends the view goes back to the village's rules.
  assert.equal(growthView(l, seungjun.id, EXPLORER_PASS.until).regions.pass, undefined);
});
