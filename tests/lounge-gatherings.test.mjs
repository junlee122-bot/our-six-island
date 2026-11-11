import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLife, ensureLifeMember, lifeAction, lifeView, packLife, readLife } from '../app/lounge-life.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { ACTOR_COUNT, ACTOR_IDS } from '../app/lounge-roster.ts';
import { GATHERING_PLACES } from '../app/lounge-gatherings-data.ts';
import {
  GATHERING_DURATIONS, GATHERING_MAX_AHEAD_MS, GATHERING_HISTORY_MS,
  GATHERING_HISTORY_MAX, GATHERING_MAX_RECORDS, GATHERING_NOTE_MAX,
  gatheringsView, readGatherings,
} from '../app/lounge-gatherings.ts';

const NOW = Date.UTC(2026, 10, 12, 3), MINUTE = 60_000;
const action = (op, fields = {}) => ({ kind: 'gathering', op, ...fields });
function setup() {
  const members = ACTOR_IDS.map((actor) => ({ id: crypto.randomUUID(), actor }));
  let life = emptyLife();
  for (const member of members) life = ensureLifeMember(life, member.id, member.actor);
  const ledger = newLoungeLedger();
  return {
    members, ledger,
    get life() { return life; }, set life(value) { life = value; },
    view(member = members[0], now = NOW) { return gatheringsView(life, member.id, member.actor, now); },
    act(a, member = members[0], now = NOW) {
      const before = structuredClone(life);
      const next = lifeAction(life, ledger, member, a, now);
      assert.deepEqual(life, before, 'the caller-owned CAS proposal stays immutable');
      assert.equal(next.ledger, ledger, 'meetings have no wallet mutation');
      life = next.life;
      return life;
    },
    reject(a, pattern, member = members[0], now = NOW) {
      const before = structuredClone(life);
      assert.throws(() => lifeAction(life, ledger, member, a, now), pattern);
      assert.deepEqual(life, before, 'rejections cannot partly change a gathering');
    },
    create(fields = {}, member = members[0], now = NOW) {
      this.act(action('create', { place: 'river-fishing', duration: 60, ...fields }), member, now);
      return this.view(member, now).open.find((entry) => entry.host === member.actor);
    },
  };
}
const metadataOnly = (life) => {
  const { gatherings: _gatherings, seq: _seq, ...rest } = life;
  return structuredClone(rest);
};

test('old saves and a fresh account have no invented gathering; public views do not leak ownership ids', () => {
  assert.equal(readLife(undefined).gatherings, undefined);
  assert.deepEqual(readGatherings(null), {});
  const s = setup(), before = structuredClone(s.life);
  assert.deepEqual(s.view(), { open: [], previous: [], canCreate: true });
  assert.deepEqual(lifeView(s.life, s.members[7].id, 7, NOW).gatherings, s.view(s.members[7]));
  assert.deepEqual(s.life, before);
  const meeting = s.create();
  assert.equal(meeting.host, 0);
  assert.equal('hostId' in meeting, false);
  assert.equal(JSON.stringify(s.view()).includes(s.members[0].id), false);
});

test('every fixed location and duration opens immediately with only the host RSVP', () => {
  for (const place of GATHERING_PLACES) for (const duration of GATHERING_DURATIONS) {
    const s = setup(), before = metadataOnly(s.life);
    const meeting = s.create({ place: place.id, duration });
    assert.equal(meeting.place, place.id);
    assert.equal(meeting.startsAt, NOW);
    assert.equal(meeting.endsAt, NOW + duration * MINUTE);
    assert.equal(meeting.status, 'running');
    assert.deepEqual(meeting.participants, [0]);
    assert.equal(meeting.isHost, true);
    assert.equal(meeting.canFinish, true);
    assert.equal(meeting.canCancel, false);
    assert.equal(meeting.canLeave, false);
    assert.deepEqual(metadataOnly(s.life), before);
  }
});

test('reservations use server epoch boundaries, accept exactly seven days, and reject malformed times and durations', () => {
  const s = setup();
  const reserved = s.create({ startsAt: NOW + GATHERING_MAX_AHEAD_MS, duration: 120 });
  assert.equal(reserved.status, 'scheduled');
  assert.equal(reserved.startsAt, NOW + GATHERING_MAX_AHEAD_MS);
  assert.equal(reserved.canCancel, true);
  const bad = [NOW - 1, NOW, NOW + GATHERING_MAX_AHEAD_MS + 1, NOW + 0.5, 'tomorrow', null, NaN, Infinity];
  for (const startsAt of bad) {
    const other = setup();
    other.reject(action('create', { place: 'river-fishing', duration: 30, startsAt }), /예약/);
  }
  for (const duration of [0, 1, 29, 31, 121, 30.5, '60', undefined, null, NaN]) {
    setup().reject(action('create', { place: 'river-fishing', duration }), /모임 요청/);
  }
});

test('scheduled, running and expired change exactly at server time without an online host or writes', () => {
  const s = setup(), start = NOW + 10 * MINUTE;
  const meeting = s.create({ startsAt: start, duration: 30 });
  const before = structuredClone(s.life);
  assert.equal(s.view(s.members[1], start - 1).open[0].status, 'scheduled');
  assert.equal(s.view(s.members[1], start).open[0].status, 'running');
  assert.equal(s.view(s.members[1], meeting.endsAt - 1).open[0].canJoin, true);
  const ended = s.view(s.members[1], meeting.endsAt);
  assert.equal(ended.open.length, 0);
  assert.equal(ended.previous[0].status, 'expired');
  assert.equal(ended.previous[0].closedAt, meeting.endsAt);
  assert.equal(ended.previous[0].canJoin, false);
  assert.equal(s.view(s.members[0], meeting.endsAt).canCreate, true);
  assert.deepEqual(s.life, before, 'time-based projection does not write an expiry marker');
});

test('all eight friends can RSVP, repeat join, leave, join late, and join another host without reserving seats', () => {
  const s = setup(), first = s.create();
  for (const member of s.members) s.act(action('join', { id: first.id }), member);
  assert.deepEqual(s.view().open[0].participants, ACTOR_IDS);
  assert.equal(s.view(s.members[7]).open[0].joined, true);
  assert.equal(s.view(s.members[7]).open[0].canJoin, false);
  s.act(action('leave', { id: first.id }), s.members[7]);
  s.act(action('leave', { id: first.id }), s.members[7]);
  assert.equal(s.view(s.members[7]).open[0].joined, false);
  s.act(action('join', { id: first.id }), s.members[7], NOW + 20 * MINUTE);
  assert.deepEqual(s.view(s.members[7], NOW + 20 * MINUTE).open[0].participants, ACTOR_IDS);
  const second = s.create({ place: 'hall-yacht' }, s.members[1], NOW + 20 * MINUTE);
  s.act(action('join', { id: second.id }), s.members[7], NOW + 20 * MINUTE);
  assert.equal(s.view(s.members[7], NOW + 20 * MINUTE).open.filter((entry) => entry.joined).length, 2);
});

test('one scheduled or running gathering per host; ending or cancelling frees that host slot', () => {
  const s = setup(), scheduled = s.create({ startsAt: NOW + 5 * MINUTE });
  s.reject(action('create', { place: 'pond-fishing', duration: 30 }), /내가 연 모임/);
  s.reject(action('leave', { id: scheduled.id }), /모임을 연 친구/);
  s.act(action('cancel', { id: scheduled.id }));
  const current = s.create({ place: 'tavern-meal' });
  s.reject(action('create', { place: 'pond-fishing', duration: 30 }), /내가 연 모임/);
  s.act(action('finish', { id: current.id }));
  assert.equal(s.view().open.length, 0);
  assert.equal(s.view().previous.length, 2);
  assert.notEqual(s.create().id, current.id);
});

test('only the authenticated host can close; scheduled cancel and running finish have distinct time checks', () => {
  const s = setup(), start = NOW + MINUTE, meeting = s.create({ startsAt: start });
  s.reject(action('cancel', { id: meeting.id }), /모임을 연 친구만/, s.members[1]);
  s.reject(action('finish', { id: meeting.id }), /모임을 연 친구만/, s.members[7]);
  s.reject(action('finish', { id: meeting.id }), /아직 시작 전/);
  s.reject(action('cancel', { id: meeting.id }), /이미 시작/, s.members[0], start);
  s.act(action('finish', { id: meeting.id }), s.members[0], start);
  assert.equal(s.view(s.members[0], start).previous[0].status, 'finished');
  assert.equal(s.view(s.members[0], start).previous[0].closedAt, start);
});

test('cancelled, finished and expired records are immutable even for repeated participants or the host', () => {
  for (const status of ['cancelled', 'finished', 'expired']) {
    const s = setup(), meeting = s.create(status === 'cancelled' ? { startsAt: NOW + MINUTE } : {});
    s.act(action('join', { id: meeting.id }), s.members[1]);
    let at = NOW;
    if (status === 'cancelled') s.act(action('cancel', { id: meeting.id }));
    else if (status === 'finished') s.act(action('finish', { id: meeting.id }));
    else at = meeting.endsAt;
    for (const op of ['join', 'leave']) s.reject(action(op, { id: meeting.id }), /이미 끝나거나 취소/, s.members[1], at);
    for (const op of ['cancel', 'finish']) s.reject(action(op, { id: meeting.id }), /이미 끝나거나 취소/, s.members[0], at);
    s.reject(action('finish', { id: meeting.id }), /모임을 연 친구만/, s.members[1], at);
    assert.equal(s.view(s.members[0], at).previous[0].status, status);
  }
});

test('strict payloads and roster identities reject forged owners, other participants and unknown locations atomically', () => {
  const s = setup(), meeting = s.create();
  const bad = [
    action('create', { place: 'private-home', duration: 30 }),
    action('create', { place: 'river-fishing', duration: 30, host: 7 }),
    action('join', { id: meeting.id, actor: 1 }),
    action('leave', { id: meeting.id, participant: 0 }),
    action('finish', { id: meeting.id, hostId: s.members[0].id }),
    action('edit', { id: meeting.id }),
    action('join', { id: '__proto__' }),
    action('join', { id: 'gathering-01' }),
  ];
  for (const a of bad) s.reject(a, /모임 요청/);
  s.reject(action('join', { id: meeting.id }), /다시|요청/, { ...s.members[1], actor: 0 });
  s.reject(action('join', { id: meeting.id }), /다시|요청/, { ...s.members[7], actor: ACTOR_COUNT });
  assert.equal(s.view().open[0].isHost, true);
});

test('notes count Unicode code points, normalize whitespace and reject controls, spoofing and overlong input', () => {
  const s = setup();
  const exact = '🙂'.repeat(GATHERING_NOTE_MAX);
  assert.equal(s.create({ note: exact }).note, exact);
  for (const note of ['가'.repeat(81), '🙂'.repeat(81), '친구\u202e모임', '친구\u0000모임', '\ud83d', 123, null]) {
    setup().reject(action('create', { place: 'bakery-meal', duration: 30, note }), /글|문장|텍스트|내용|다시/);
  }
  assert.equal(setup().create({ note: '  같이   낚시해요  ' }).note, '같이 낚시해요');
  assert.equal('note' in setup().create({ note: '   ' }), false);
});

test('JSON and packLife/readLife preserve future RSVP and host permissions across reconnects', () => {
  const s = setup(), meeting = s.create({ startsAt: NOW + GATHERING_MAX_AHEAD_MS, note: '일요일 강가' });
  s.act(action('join', { id: meeting.id }), s.members[7]);
  const before = s.view();
  s.life = readLife(JSON.parse(JSON.stringify(packLife(s.life))));
  assert.deepEqual(s.view(), before);
  assert.equal(s.view(s.members[7]).open[0].joined, true);
  assert.equal(s.view(s.members[7]).open[0].isHost, false);
  const copied = s.view(); copied.open[0].participants.push(99);
  assert.deepEqual(s.view().open[0].participants, [0, 7]);
});

test('restore rejects malformed saved records and cleans old text without growing an unbounded array', () => {
  const s = setup(); s.create({ startsAt: NOW + MINUTE });
  const good = structuredClone(s.life.gatherings.records[0]);
  for (const patch of [
    { id: 'gathering-9007199254740992' }, { host: 8 }, { hostId: 'fake' }, { place: 'unknown' },
    { startsAt: NOW - 1 }, { endsAt: good.startsAt + 5 * MINUTE },
    { participants: [1] }, { participants: [0, 8] }, { participants: Array(9).fill(0) },
    { closed: 'expired' }, { closedAt: NOW }, { closed: 'finished', closedAt: NOW },
  ]) assert.deepEqual(readGatherings({ records: [{ ...good, ...patch }] }), {});
  const restored = readGatherings({ records: [{ ...good, participants: [0, 0, 7], note: '앞\u202e뒤\ud83d' }, good] });
  assert.equal(restored.gatherings.records.length, 1);
  assert.deepEqual(restored.gatherings.records[0].participants, [0, 7]);
  assert.equal(restored.gatherings.records[0].note, '앞뒤');
  assert.deepEqual(readGatherings({ records: {} }), {});
});

test('history is capped at sixteen recent closes alongside all eight open hosts, and disappears after seven days', () => {
  const s = setup();
  const record = (id, host, createdAt, closed) => ({
    id: `gathering-${id}`, host, hostId: s.members[host].id, place: 'river-fishing',
    createdAt, startsAt: createdAt + 60 * MINUTE, endsAt: createdAt + 120 * MINUTE,
    participants: [host], ...(closed ? { closed: 'cancelled', closedAt: createdAt } : {}),
  });
  const history = Array.from({ length: 20 }, (_, i) => record(i + 1, i % ACTOR_COUNT, NOW - (60 - i) * MINUTE, true));
  const active = ACTOR_IDS.map((actor) => record(100 + actor, actor, NOW - 30 * MINUTE));
  s.life.gatherings = { records: [...history, ...active] };
  const current = s.view();
  assert.equal(current.open.length, ACTOR_COUNT);
  assert.equal(current.previous.length, GATHERING_HISTORY_MAX);
  assert.equal(readLife(packLife(s.life)).gatherings.records.length, GATHERING_MAX_RECORDS);
  assert.equal(current.canCreate, false);
  assert.equal(s.view(s.members[0], NOW + GATHERING_HISTORY_MS + 121 * MINUTE).previous.length, 0);
  const edge = record(200, 0, NOW - GATHERING_HISTORY_MS, true);
  s.life.gatherings = { records: [edge] };
  assert.equal(s.view().previous.length, 1);
  assert.equal(s.view(s.members[0], NOW + 1).previous.length, 0);
});

test('server sequence stays unique after restoration, and an exhausted counter rejects instead of rounding', () => {
  const s = setup(), first = s.create();
  s.life.seq = 0;
  const next = s.create({}, s.members[1]);
  assert.notEqual(next.id, first.id);
  assert.equal(s.life.seq, 2);
  s.life.seq = Number.MAX_SAFE_INTEGER;
  s.reject(action('create', { place: 'pond-fishing', duration: 30 }), /모임 기록/, s.members[2]);
});

test('all gathering operations leave inventory, growth, farming, personal day and memories exactly unchanged', () => {
  const s = setup(), uid = s.members[0].id;
  s.life.bag[uid].fruit = 20;
  s.life.farms[uid][0] = { crop: 'carrot', plantedAt: NOW - 10 * 86_400_000, t: 1, wetMs: 3_600_000, wetUntil: NOW - 9 * 86_400_000 };
  s.life.ext = { [uid]: { inv: { wood: 12 }, furn: { 'furn-table': 2 } } };
  s.life.farmx = { [uid]: { goods: { 'pickle@0': 4 }, bin: { day: 0, items: { carrot: 5 } } } };
  s.life.myday = { [uid]: { b: 2, w: { w: 3000, m: 1, u: 0 } } };
  s.life.memories = [{ id: 'old', kind: 'old', at: NOW - MINUTE, text: '기존 기억', actors: [0] }];
  const baseline = metadataOnly(s.life), ledger = structuredClone(s.ledger);
  const scheduled = s.create({ startsAt: NOW + MINUTE, place: 'tavern-meal' });
  s.act(action('join', { id: scheduled.id }), s.members[7]);
  s.act(action('leave', { id: scheduled.id }), s.members[7]);
  s.act(action('cancel', { id: scheduled.id }));
  const running = s.create({ place: 'casino-chess' });
  s.act(action('join', { id: running.id }), s.members[1]);
  s.act(action('finish', { id: running.id }), s.members[0], NOW + 20 * MINUTE);
  assert.deepEqual(metadataOnly(s.life), baseline);
  assert.deepEqual(s.ledger, ledger);
});
