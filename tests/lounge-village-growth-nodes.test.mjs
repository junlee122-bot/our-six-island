// 성장 수첩 "오늘의 재료" (D10): same-kind nodes fold into one row with a count
// and the nearest untaken one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { groupNodes } from '../app/lounge-village-growth.ts';

test('groupNodes: one row per kind, count left, nearest untaken from the point', () => {
  const nodes = [
    { id: 'b1', kind: 'bush', x: 10, z: 0, taken: false },
    { id: 'r1', kind: 'rock', x: 0, z: 5, taken: false },
    { id: 'b2', kind: 'bush', x: 2, z: 0, taken: false },
    { id: 'b3', kind: 'bush', x: 1, z: 0, taken: true },
    { id: 'r2', kind: 'rock', x: 0, z: 9, taken: true },
  ];
  const rows = groupNodes(nodes, { x: 0, z: 0 });
  assert.deepEqual(
    rows.map((r) => [r.kind, r.total, r.left, r.nearest?.id ?? null]),
    [
      ['bush', 3, 2, 'b2'],
      ['rock', 2, 1, 'r1'],
    ],
  );
  const done = groupNodes([{ id: 'l1', kind: 'log', x: 0, z: 0, taken: true }], { x: 0, z: 0 });
  assert.deepEqual(done, [{ kind: 'log', total: 1, left: 0, nearest: null }]);
});
