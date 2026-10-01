// 범마을 부동산 kept in turns by 신형만 ('realtor') and 봉미선 ('misun'):
// the KST weekday rule, where the off-duty one is, meeting them at the realty
// door, both as full residents (art, lines, gifts, banter) and the relations
// that 문 사장's old 'realtor' rows carry over to 신형만.
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCS, NPC_IDS, NPC_BONDS, giftReaction } from '../app/lounge-npc-data.ts';
import { NPC_CHIBI } from '../app/lounge-npc-chibi.ts';
import { HOST_SHEET } from '../app/lounge-host-sprites.ts';
import { HOSTS } from '../app/lounge-dealer-lines.ts';
import { npcSpot, kstDayStart, realtyDuty, realtyKeeper } from '../app/lounge-npc-schedule.ts';
import { readNpcRelations, npcMeetAt, assertNpcSocialContext, npcSocialAction } from '../app/lounge-romance.ts';
import { allNpcLines, npcBanter, npcTalk } from '../app/lounge-npc-dialog.ts';
import { weekdayOf } from '../app/lounge-calendar.ts';
import { kstDay } from '../app/lounge-economy.ts';
import { VILLAGE_PLACES } from '../app/lounge-village-layout.ts';
import { emptyLife, ensureLifeMember, readLife } from '../app/lounge-life.ts';

// Thursday 2026-10-01 12:00 KST; find each weekday from there.
const T0 = Date.UTC(2026, 9, 1, 3);
const DAY0 = kstDay(T0);
const dayOf = (weekday) => {
  for (let d = DAY0; d < DAY0 + 7; d++) if (weekdayOf(d) === weekday) return d;
  throw new Error('no day');
};
const at = (id, weekday, h, m = 0) => npcSpot(id, kstDayStart(dayOf(weekday)) + (h * 60 + m) * 60_000);
const NAMES = ['일', '월', '화', '수', '목', '금', '토'];

test('weekday rule: 월·수·금 신형만, 화·목 봉미선, 토·일 both (one at the counter, one in the model house)', () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6].map((w) => realtyDuty(w)),
    [
      { counter: 'misun', model: 'realtor' },
      { counter: 'realtor', model: null },
      { counter: 'misun', model: null },
      { counter: 'realtor', model: null },
      { counter: 'misun', model: null },
      { counter: 'realtor', model: null },
      { counter: 'realtor', model: 'misun' },
    ],
  );
  for (let w = 0; w < 7; w++) {
    const duty = realtyDuty(w);
    // The keeper of the day is at the counter in the afternoon.
    const keeper = at(duty.counter, w, 14);
    assert.equal(keeper.area, 'realty', `${NAMES[w]}: ${duty.counter} at the realty`);
    assert.equal(keeper.place, 'realty-in', `${NAMES[w]}: ${duty.counter} at the counter`);
    assert.equal(realtyKeeper(kstDayStart(dayOf(w)) + 14 * 3_600_000), duty.counter);
    const other = duty.counter === 'realtor' ? 'misun' : 'realtor';
    const o = at(other, w, 14);
    if (duty.model) {
      assert.equal(o.area, 'realty', `${NAMES[w]}: ${other} at the realty too`);
      assert.equal(o.place, 'realty-model', `${NAMES[w]}: ${other} in the model house`);
    } else assert.notEqual(o.area, 'realty', `${NAMES[w]}: ${other} is off duty`);
  }
  // The rule follows the KST day, not the UTC day: Monday 00:30 KST is still Sunday in UTC.
  const monday = kstDayStart(dayOf(1));
  assert.equal(new Date(monday + 30 * 60_000).getUTCDay(), 0);
  assert.equal(realtyKeeper(monday + 30 * 60_000), 'realtor');
  assert.equal(realtyKeeper(monday - 30 * 60_000), 'misun');
});

test('off duty: 형만 works out of the village and drinks at the tavern; 미선 shops in the market and the bakery', () => {
  // 화·목: 형만 is away by day, at the tavern after work until 01:00, then home.
  for (const w of [2, 4]) {
    assert.equal(at('realtor', w, 11).area, 'away');
    assert.equal(at('realtor', w, 20).area, 'tavern');
    assert.match(at('realtor', w, 20).label, /맥주/);
    assert.equal(at('realtor', w, 23, 30).area, 'tavern');
    assert.equal(at('realtor', (w + 1) % 7, 3).area, 'home');
  }
  // Late at night 미선 comes to fetch him: side by side at the bar (and they banter).
  for (let w = 0; w < 7; w++) {
    const a = at('realtor', w, 23),
      b = at('misun', w, 23);
    assert.equal(a.area, 'tavern', NAMES[w]);
    assert.equal(b.area, 'tavern', NAMES[w]);
    assert.ok(Math.hypot(a.x - b.x, a.z - b.z) < 3.6, NAMES[w]);
  }
  // 월·수·금: 형만 at the counter, then the tavern.
  for (const w of [1, 3, 5]) assert.equal(at('realtor', w, 21).area, 'tavern');
  // 월·수·금: 미선 at the 농협, the bakery and the market square.
  const seen = new Set();
  for (const w of [1, 3, 5]) for (const [h, m] of [[10, 30], [12, 0], [14, 0], [17, 0]]) seen.add(at('misun', w, h, m).area);
  assert.ok(seen.has('coop') && seen.has('bakery') && seen.has('market'), [...seen].join(','));
  // Sunday evening they walk side by side in the hub (and banter there).
  const a = at('realtor', 0, 19, 30),
    b = at('misun', 0, 19, 30);
  assert.equal(a.area, 'village');
  assert.equal(b.area, 'village');
  assert.ok(a.visible && b.visible);
  const d = Math.hypot(a.x - b.x, a.z - b.z);
  assert.ok(d > 0.85 && d < 3.6, `${d}`);
  assert.ok(npcBanter('realtor', 'misun', 'k'));
});

test('the server meets either keeper at the realty door, and refuses the absent one', () => {
  const door = VILLAGE_PLACES.find((p) => p.id === 'realty').entry;
  const friday = kstDayStart(dayOf(5)) + 14 * 3_600_000;
  const meet = npcMeetAt('realtor', friday);
  assert.equal(meet.area, 'village');
  assert.deepEqual(meet.point, door);
  // At the hub (no point given: the server's area check is what matters here).
  const near = () => ({ area: 'village', actor: 0, fishing: false });
  assert.doesNotThrow(() => assertNpcSocialContext({ kind: 'npcSocial', npc: 'realtor', op: 'talk' }, undefined, near(), friday));
  // 봉미선 is shopping on Friday: not at the realty door but in the market.
  assert.equal(npcMeetAt('misun', friday).area, 'market');
  assert.throws(() => assertNpcSocialContext({ kind: 'npcSocial', npc: 'misun', op: 'talk' }, undefined, near(), friday), /시장 거리/);
  // Saturday afternoon both are at the realty and both meet at its door.
  const saturday = kstDayStart(dayOf(6)) + 14 * 3_600_000;
  for (const id of ['realtor', 'misun']) {
    const m = npcMeetAt(id, saturday);
    assert.equal(m.area, 'village', id);
    assert.deepEqual(m.point, door, id);
    assert.doesNotThrow(() => assertNpcSocialContext({ kind: 'npcSocial', npc: id, op: 'talk' }, undefined, near(), saturday));
  }
  // Tuesday: 형만 is out of the village.
  const tuesday = kstDayStart(dayOf(2)) + 11 * 3_600_000;
  assert.equal(npcMeetAt('realtor', tuesday).away, true);
  assert.throws(() => assertNpcSocialContext({ kind: 'npcSocial', npc: 'realtor', op: 'talk' }, undefined, near(), tuesday), /신형만/);
});

test('migration: 문 사장’s saved realtor rows become 신형만’s; 봉미선 starts fresh', () => {
  const saved = { realtor: { points: 64, talkedDay: 20000, dates: 3, lastGift: 'gem', rw: 1 } };
  const read = readNpcRelations(saved);
  assert.deepEqual(read.realtor, { points: 64, talkedDay: 20000, dates: 3, lastGift: 'gem', rw: 1 });
  assert.equal(read.misun, undefined);
  assert.equal(NPCS.realtor.name, '신형만');
  assert.equal(NPCS.misun.name, '봉미선');
  // Through a whole save: the old row loads under 신형만, 봉미선 has none until met.
  const uid = '11111110-1111-4111-8111-111111111111';
  let life = ensureLifeMember(emptyLife(), uid, 0);
  life.ext = { [uid]: { npcRelations: saved } };
  life = readLife(JSON.parse(JSON.stringify(life)));
  assert.equal(life.ext[uid].npcRelations.realtor.points, 64);
  assert.equal(life.ext[uid].npcRelations.misun, undefined);
  // 봉미선 is met like anyone else; her row is her own.
  const saturday = kstDayStart(dayOf(6)) + 14 * 3_600_000;
  npcSocialAction(life, uid, { kind: 'npcSocial', npc: 'misun', op: 'talk' }, saturday);
  assert.equal(life.ext[uid].npcRelations.misun.points > 0, true);
  assert.equal(life.ext[uid].npcRelations.realtor.points, 64);
});

test('both are full residents: tall art, portrait, chibi, host sheet, lines, gifts, romance and banter', () => {
  for (const id of ['realtor', 'misun']) {
    assert.ok(NPC_IDS.includes(id));
    const n = NPCS[id];
    assert.equal(n.art.kind, 'image', `${id} tall art`);
    assert.ok(n.art.portrait, `${id} portrait`);
    assert.ok(NPC_CHIBI[id], `${id} chibi`);
    assert.ok(HOST_SHEET[id] && HOSTS[id], `${id} counter sheet`);
    assert.equal(HOSTS[id].name, n.name);
    assert.ok(n.age >= 20, `${id} adult`);
    const lines = allNpcLines(id);
    assert.ok(lines.length >= 90, `${id} ${lines.length} lines`);
    for (const t of [0, 1, 2, 3, 4]) assert.ok(npcTalk({ npc: id, me: '도원', who: 0, now: T0, points: t * 30, talkedToday: false }).lines.length);
  }
  const all = (id) => allNpcLines(id).join('\n');
  assert.match(all('realtor'), /맥주/);
  assert.match(all('realtor'), /실적/);
  assert.match(all('misun'), /세일|할인/);
  assert.match(all('misun'), /형만/);
  assert.equal(giftReaction('realtor', { id: 'squid', kind: 'fish', crop: false }), 'loved');
  assert.equal(giftReaction('misun', { id: 'pumpkinpie', kind: 'dish', crop: false }), 'loved');
  assert.equal(giftReaction('misun', { id: 'stone', kind: 'material', crop: false }), 'disliked');
  for (const [a, b] of [['misun', 'realtor'], ['realtor', 'carpenter'], ['misun', 'carpenter'], ['realtor', 'captain'], ['misun', 'frieren'], ['misun', 'nasera']]) {
    assert.ok(NPC_BONDS.some((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)), `${a}-${b} bond`);
    assert.ok(npcBanter(a, b, 'k'), `${a}-${b} banter`);
  }
});
