import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HOST_CELL, HOST_SHEET, hostCell, hostPose } from '../app/lounge-host-sprites.ts';

test('every host pose has its own cell in the sheet', () => {
  const poses = ['calm', 'smile', 'deal', 'focus', 'wow', 'sorry'];
  const cells = new Set(poses.map((p) => JSON.stringify(hostCell(p))));
  assert.equal(cells.size, poses.length);
  for (const p of poses) {
    const c = hostCell(p);
    assert.ok(c.x + HOST_CELL.w <= HOST_CELL.w * HOST_CELL.cols);
    assert.ok(c.y + HOST_CELL.h <= HOST_CELL.h * HOST_CELL.rows);
  }
  for (const url of Object.values(HOST_SHEET)) assert.ok(fs.existsSync('public' + url), url);
});

test('hosts follow their table: calm when empty, dealing and focused in a match, happy after', () => {
  const seen = (phase, since = -1e6) =>
    new Set(Array.from({ length: 400 }, (_, i) => hostPose(phase, 100000 + i * 97, since)));
  assert.deepEqual([...seen('empty')].sort(), ['calm', 'smile']);
  assert.deepEqual([...seen('forming')].sort(), ['calm', 'smile']);
  assert.deepEqual([...seen('playing')].sort(), ['deal', 'focus']);
  assert.equal(hostPose('playing', 5000, 4500), 'deal');
  assert.equal(hostPose('retained', 5000, 4500), 'wow');
  assert.equal(hostPose('retained', 9000, 4500), 'smile');
});
