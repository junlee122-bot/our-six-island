// D17: the hub's far edge is closed off by pines past the rim, with gaps for the gates.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BACKDROP_SIDE_SOUTH_Z, backdropTrees } from '../app/lounge-village-backdrop.ts';
import { DISTRICTS, DISTRICT_IDS } from '../app/lounge-districts.ts';
import { VILLAGE_BOUNDS, VILLAGE_FALLS } from '../app/lounge-village-layout.ts';

const hw = VILLAGE_BOUNDS.width / 2,
  hd = VILLAGE_BOUNDS.depth / 2;

test('backdrop pines stand outside the island, never on the walkable ground or the south coast', () => {
  const trees = backdropTrees();
  assert.ok(trees.length > 100);
  for (const t of trees) {
    assert.ok(Math.abs(t.x) > hw || t.z < -hd, `(${t.x}, ${t.z}) is outside`);
    assert.ok(t.z <= BACKDROP_SIDE_SOUTH_Z + 2, 'the south (beach, sea) stays open');
  }
  // The whole north rim is covered: no stretch wider than a gate gap without a near pine.
  const north = trees.filter((t) => t.z < -hd && t.row === 0).map((t) => t.x).sort((a, b) => a - b);
  for (let i = 1; i < north.length; i++) assert.ok(north[i] - north[i - 1] < 12, `gap at x=${north[i - 1]}`);
  assert.ok(trees.some((t) => t.row === 2 && t.z < -hd), 'a hazy far row');
});

test('the roads through the gates and the falls stay clear of near pines', () => {
  const trees = backdropTrees().filter((t) => t.row < 2);
  for (const id of DISTRICT_IDS) {
    const g = DISTRICTS[id].gate;
    if (g.z < -hd + 2) assert.ok(!trees.some((t) => t.z < -hd && Math.abs(t.x - g.x) < 3), id);
    else if (Math.abs(g.x) > hw - 2) assert.ok(!trees.some((t) => Math.sign(t.x) === Math.sign(g.x) && Math.abs(t.x) > hw && Math.abs(t.z - g.z) < 3), id);
  }
  assert.ok(!trees.some((t) => t.z < -hd && Math.abs(t.x - VILLAGE_FALLS.x) < 3), 'falls');
});
