import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LINK_OK,
  OFFLINE_AFTER,
  isNetworkFailure,
  linkLabel,
  nextLink,
  offlineReason,
  retryCountdown,
  retryDelay,
  shouldToastError,
} from '../app/lounge-connection.ts';
import { othersOnline, soloActivities } from '../app/lounge-solo.ts';
import { CALL_LABEL, callChanges, callClock, pendingCalls, tableCalls } from '../app/lounge-table-calls.ts';
import { TUTORIAL_STEPS, tutorialNext, tutorialStepDone } from '../app/lounge-tutorial.ts';
import { villageHoverTarget, villagePlaceHeight, villagePlaceOnRay } from '../app/lounge-village-hover.ts';
import { VILLAGE_PLACES } from '../app/lounge-village-layout.ts';

test('connection: one failure retries quietly, two in a row is offline, success resets', () => {
  const one = nextLink(LINK_OK, { kind: 'fail', now: 1000 });
  assert.equal(one.state, 'retrying');
  assert.equal(one.retryAt, 1000 + retryDelay(1));
  assert.equal(one.since, 1000);
  const two = nextLink(one, { kind: 'fail', now: 4000 });
  assert.equal(OFFLINE_AFTER, 2);
  assert.equal(two.state, 'offline');
  assert.equal(two.since, 1000, 'keeps when the drop started');
  assert.equal(nextLink(two, { kind: 'ok' }), LINK_OK);
  assert.equal(nextLink(LINK_OK, { kind: 'ok' }), LINK_OK, 'no churn while healthy');
  assert.equal(nextLink(LINK_OK, { kind: 'browser-offline', now: 5 }).state, 'offline');
});

test('connection: retry backoff 2s, 4s, 8s, then 15s', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 9].map(retryDelay), [0, 2000, 4000, 8000, 15000, 15000]);
});

test('connection: network failures vs refusals', () => {
  assert.equal(isNetworkFailure({ status: 503 }), true);
  assert.equal(isNetworkFailure(new TypeError('fetch failed')), true);
  assert.equal(isNetworkFailure({ status: 409 }), false);
  assert.equal(isNetworkFailure({ status: 401 }), false);
});

test('connection: header label counts down to the next try', () => {
  const link = { state: 'offline', failures: 3, retryAt: 10_000, since: 0 };
  assert.equal(retryCountdown(link, 7_100), 3);
  assert.deepEqual(linkLabel(link, 7_100), { title: '연결 끊김', detail: '다시 연결 중 (3)' });
  assert.deepEqual(linkLabel(link, 11_000), { title: '연결 끊김', detail: '다시 연결 중…' });
  assert.deepEqual(linkLabel(LINK_OK, 0), { title: '', detail: '' });
});

test('connection: online-only actions say why they are off', () => {
  assert.equal(offlineReason('ok', 'connected'), null);
  assert.match(offlineReason('offline', 'connected'), /연결이 끊겼어요/);
  assert.match(offlineReason('ok', 'connecting'), /들어가는 중/);
  assert.match(offlineReason('ok', 'error'), /다시 들어가기/);
  assert.equal(offlineReason('retrying', 'connected'), null, 'a single hiccup is not offline');
});

test('connection: the same error toast shows once per quiet window', () => {
  assert.equal(shouldToastError(null, 'a', 0), true);
  assert.equal(shouldToastError({ text: 'a', at: 0 }, 'a', 5_000), false);
  assert.equal(shouldToastError({ text: 'a', at: 0 }, 'b', 5_000), true);
  assert.equal(shouldToastError({ text: 'a', at: 0 }, 'a', 20_000), true);
  assert.equal(shouldToastError(null, '', 0), false);
});

test('solo: suggestions lead with what is waiting', () => {
  const life = {
    me: {
      farm: [{ crop: 'carrot', ready: true }, { crop: 'carrot', ready: false }, { crop: null }],
      requests: [{ done: false }, { done: true }],
    },
  };
  const list = soloActivities(life, 'F');
  assert.deepEqual(list.map((a) => a.kind), ['farm', 'requests', 'fish', 'museum', 'decorate']);
  assert.match(list[0].detail, /수확할 작물 1개/);
  assert.equal(list[0].hot, true);
  assert.match(list[1].detail, /1개가 남았어요/);
  assert.match(list[2].detail, /F$/, 'uses the bound action key');
  const empty = soloActivities(null);
  assert.equal(empty.every((a) => !a.hot), true);
  assert.match(soloActivities({ me: { farm: [{ crop: null }, { crop: null }] } })[0].detail, /빈 칸 2곳/);
  assert.equal(othersOnline([{ id: 'me' }], 'me'), 0);
  assert.equal(othersOnline([{ id: 'me' }, { id: 'a' }], 'me'), 1);
});

test('table calls: sent → coming → seated / declined / gone, with the time left', () => {
  const invite = {
    from: 'me',
    invited: ['a', 'b', 'c', 'd', 'a'],
    accepted: ['me', 'c'],
    declined: ['d'],
    expires: 300_000,
    status: 'waiting',
  };
  const players = [
    { id: 'me', actor: 3, area: 'lounge' },
    { id: 'a', actor: 0, area: 'village' },
    { id: 'b', actor: 6, area: 'lounge' },
    { id: 'c', actor: 2, area: 'lounge' },
  ];
  const calls = tableCalls(invite, players, 'lounge', 1_000);
  assert.deepEqual(
    calls.map((c) => [c.id, c.status]),
    [['a', 'sent'], ['b', 'coming'], ['c', 'seated'], ['d', 'declined']],
  );
  assert.equal(calls[0].leftMs, 299_000);
  assert.deepEqual(pendingCalls(calls).map((c) => c.id), ['a', 'b']);
  assert.equal(tableCalls({ ...invite, status: 'started' }, players, 'lounge', 0).length, 0);
  assert.equal(tableCalls(null, players, 'lounge', 0).length, 0);
  const gone = tableCalls(invite, players.filter((p) => p.id !== 'a'), 'lounge', 0);
  assert.equal(gone[0].status, 'gone');
  assert.equal(CALL_LABEL.sent, '초대 보냄');
  assert.equal(callClock(299_000), '4:59');
  assert.equal(callClock(-5), '0:00');
  const later = calls.map((c) => (c.id === 'b' ? { ...c, status: 'seated' } : c.id === 'a' ? { ...c, status: 'declined' } : c));
  assert.deepEqual(callChanges(calls, later), [
    { id: 'a', status: 'declined' },
    { id: 'b', status: 'seated' },
  ]);
  assert.deepEqual(callChanges(calls, calls), [], 'no toast without a change');
});

test('tutorial: four hands-on steps, each done by doing it', () => {
  assert.deepEqual([...TUTORIAL_STEPS], ['move', 'door', 'bag', 'plant']);
  assert.equal(tutorialNext('move'), 'door');
  assert.equal(tutorialNext('plant'), null);
  const start = { place: 'bedroom', planted: 2 };
  const idle = { moved: false, place: 'bedroom', bagOpen: false, planted: 2 };
  for (const step of TUTORIAL_STEPS) assert.equal(tutorialStepDone(step, idle, start), false, step);
  assert.equal(tutorialStepDone('move', { ...idle, moved: true }, start), true);
  assert.equal(tutorialStepDone('door', { ...idle, place: 'village' }, start), true);
  assert.equal(tutorialStepDone('bag', { ...idle, bagOpen: true }, start), true);
  assert.equal(tutorialStepDone('plant', { ...idle, planted: 3 }, start), true);
});

test('village: a ray into a roof picks that building, not the floor behind it', () => {
  const hall = VILLAGE_PLACES.find((p) => p.id === 'hall');
  // Straight down onto the hall's roof.
  assert.equal(villagePlaceOnRay({ x: hall.x, y: 50, z: hall.z }, { x: 0, y: -1, z: 0 }), 'hall');
  // The isometric camera looks down and towards -z: a ray through the top of
  // the wardrobe lands on the floor well behind it.
  const w = VILLAGE_PLACES.find((p) => p.id === 'wardrobe');
  const dir = { x: -0.4, y: -0.7, z: -0.6 };
  const n = Math.hypot(dir.x, dir.y, dir.z);
  const d = { x: dir.x / n, y: dir.y / n, z: dir.z / n };
  const roof = { x: w.x, y: villagePlaceHeight(w) - 0.2, z: w.z };
  const origin = { x: roof.x - d.x * 60, y: roof.y - d.y * 60, z: roof.z - d.z * 60 };
  assert.equal(villagePlaceOnRay(origin, d), 'wardrobe');
  const t = -roof.y / d.y;
  const floor = { x: roof.x + d.x * t, z: roof.z + d.z * t };
  assert.notDeepEqual(villageHoverTarget(floor), { kind: 'place', id: 'wardrobe' }, 'the old floor test missed it');
  // Nothing in the sky.
  assert.equal(villagePlaceOnRay({ x: 0, y: 50, z: 0 }, { x: 0, y: 1, z: 0 }), null);
  assert.equal(villagePlaceHeight({ kind: 'home' }) < villagePlaceHeight({ kind: 'hall' }), true);
});
