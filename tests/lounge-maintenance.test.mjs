// 점검 중 ("범타듀 밸리가 예뻐지는 중"): the HH_MAINTENANCE switch, the notice
// in server answers, the "다시 열려요" time and the client store.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  maintenanceNow,
  maintenanceOf,
  maintenanceUntilText,
  readMaintenance,
  setMaintenance,
  subscribeMaintenance,
} from '../app/lounge-maintenance.ts';

test('the switch: empty / 0 / off / false is off; 1 or a JSON object is on', () => {
  for (const off of [undefined, null, '', '  ', '0', 'off', 'OFF', 'false', 'null'])
    assert.equal(readMaintenance(off), null, String(off));
  assert.deepEqual(readMaintenance('1'), {});
  assert.deepEqual(readMaintenance('on'), {});
  assert.deepEqual(readMaintenance('{"until":"2026-10-03T06:20:00Z","note":"새 지역을 다듬고 있어요"}'), {
    until: '2026-10-03T06:20:00.000Z',
    note: '새 지역을 다듬고 있어요',
  });
  // Bad fields are dropped, long notes cut, control characters removed.
  assert.deepEqual(readMaintenance('{"until":"soon","note":7}'), {});
  assert.equal(readMaintenance(JSON.stringify({ note: 'a\u0000b'.padEnd(500, 'x') })).note.length, 120);
  assert.ok(!readMaintenance(JSON.stringify({ note: 'a\u0007b' })).note.includes('\u0007'));
});

test('a server answer carries the notice only when it has one', () => {
  assert.equal(maintenanceOf(null), null);
  assert.equal(maintenanceOf({ ok: true, maintenance: null }), null);
  assert.equal(maintenanceOf({ error: 'x' }), null);
  assert.deepEqual(maintenanceOf({ error: 'x', maintenance: {} }), {});
  assert.deepEqual(maintenanceOf({ maintenance: { until: '2026-10-03T06:20:00.000Z', note: '곧 끝나요' } }), { until: '2026-10-03T06:20:00.000Z', note: '곧 끝나요' });
});

test('"다시 열려요" time in KST; nothing when unknown or already past', () => {
  const now = Date.UTC(2026, 9, 3, 5, 0); // 14:00 KST
  assert.equal(maintenanceUntilText({ until: '2026-10-03T06:20:00Z' }, now), '오후 3:20쯤');
  assert.equal(maintenanceUntilText({ until: '2026-10-03T23:05:00Z' }, now), '10월 4일 오전 8:05쯤');
  assert.equal(maintenanceUntilText({ until: '2026-10-03T04:00:00Z' }, now), '');
  assert.equal(maintenanceUntilText({}, now), '');
  assert.equal(maintenanceUntilText(null, now), '');
});

test('the store tells its listeners once per change', () => {
  let calls = 0;
  const off = subscribeMaintenance(() => calls++);
  setMaintenance(null);
  assert.equal(calls, 0, 'already off');
  setMaintenance({ note: '점검' });
  setMaintenance({ note: '점검' });
  assert.equal(calls, 1);
  assert.deepEqual(maintenanceNow(), { note: '점검' });
  setMaintenance(null);
  assert.equal(calls, 2);
  off();
  setMaintenance({});
  assert.equal(calls, 2);
  setMaintenance(null);
});
