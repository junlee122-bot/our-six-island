import test from 'node:test';
import assert from 'node:assert/strict';
import { villageWalkCheck } from '../scripts/village-walk-check.mjs';
import { villageCanWalk, villageStep } from '../app/lounge-village-layout.ts';

test('walking between every house and building never snags', () => {
  const r = villageWalkCheck();
  assert.ok(r.routes >= 150, `${r.routes} routes`);
  // Click-to-walk always arrives without a stalled frame.
  assert.equal(r.click.stuck, 0, JSON.stringify(r.worst));
  assert.equal(r.click.stalls, 0, JSON.stringify(r.worst));
  // Held 8-way keys slide along whatever stands beside the road.
  assert.equal(r.key.stuck, 0, JSON.stringify(r.worst));
  assert.ok(r.key.stalls < r.key.frames * 0.002, `${r.key.stalls} stall frames`);
});

test('walking straight into a lamp steers around it; a wall still stops you', () => {
  // lamp-0 stands at (-4.9, -1); approach it head-on from the west.
  let p = { x: -6.2, z: -1 };
  assert.ok(villageCanWalk(p));
  for (let i = 0; i < 60; i++) p = villageStep(p, 0.087, 0);
  assert.ok(p.x > -4.9, `passed the lamp (${p.x.toFixed(2)})`);
  // The fountain is not a small prop: pressing into it only slides.
  let q = { x: 0, z: 2.5 };
  for (let i = 0; i < 30; i++) q = villageStep(q, 0, -0.087);
  assert.ok(villageCanWalk(q) && q.z > 2.3);
});
