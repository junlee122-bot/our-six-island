// 주민끼리 어울리기: the relation map, the day's story (quarrels, make-ups,
// presents), meetings placed in the world, overhearing / joining (server
// checked), the extra dialogue lines and reactions, and the village news.
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPC_IDS, NPCS, NPC_SISTER_FRIENDS, VISIBLE_NPC_IDS } from '../app/lounge-npc-data.ts';
import { NPC_TIES, NPC_FRIEND_TIES, npcTie, npcTiesOf, npcTieWord, pairKey } from '../app/lounge-npc-social-ties.ts';
import {
  ARC_CYCLE,
  GIFTS_PER_DAY,
  MEET_GAP,
  npcJoinLines,
  npcPairMood,
  npcSocialExchange,
  npcSocialNews,
  npcSocialNow,
  npcSocialOf,
  npcSocialPresent,
  npcSocialScene,
  npcSocialStory,
  npcSocialTalkPool,
  npcSulkingWith,
  npcTile,
} from '../app/lounge-npc-social.ts';
import { NPC_EXTRA } from '../app/lounge-npc-extra.ts';
import { NPC_RECENT_KINDS } from '../app/lounge-npc-extra-types.ts';
import { npcRecentKinds } from '../app/lounge-npc-recent.ts';
import { npcCanStand, npcSpot } from '../app/lounge-npc-schedule.ts';
import { dayStart as kstDayStart } from '../app/lounge-calendar.ts';
import { npcTalk, npcTalkReply, NPC_LINES } from '../app/lounge-npc-dialog.ts';
import { assertNpcSocialContext, npcSocialAction, npcMeetAt, NPC_JOIN_POINTS, readNpcRelations } from '../app/lounge-romance.ts';
import { regionToNetwork } from '../app/lounge-areas.ts';
import { villageToNetwork } from '../app/lounge-village-layout.ts';
import { residentFrames, newBehaviorMemory } from '../app/lounge-npc-behavior.ts';
import { npcTalkChoices } from '../app/lounge-npc-speech.ts';
import { kstDay } from '../app/lounge-economy.ts';

const HOUR = 3_600_000;
const T0 = Date.UTC(2026, 9, 1, 3); // 12:00 KST, 2026-10-01
const DAY0 = kstDay(T0);
const OPEN = { hill: true, ranch: true, foothill: true };
const EMOJI = /\p{Extended_Pictographic}/u;

/** Every meeting over `days` days, every `step` minutes from 06:00 to 24:00. */
function sweep(days, step = 20) {
  const out = [];
  for (let d = 0; d < days; d++)
    for (let m = 6 * 60; m < 24 * 60; m += step) {
      const now = kstDayStart(DAY0 + d) + m * 60_000;
      const spots = VISIBLE_NPC_IDS.map((id) => npcSpot(id, now, OPEN));
      out.push({ now, spots, events: npcSocialScene(spots, now) });
    }
  return out;
}
const SWEEP = sweep(14);

// ---------------------------------------------------------------- relation map
test('relation map: one tie per pair, the married couple, family, crushes, and every resident has friends', () => {
  const keys = NPC_TIES.map((t) => pairKey(t.a, t.b));
  assert.equal(new Set(keys).size, keys.length, 'one tie per pair');
  for (const t of NPC_TIES) assert.ok(NPC_IDS.includes(t.a) && NPC_IDS.includes(t.b) && t.a !== t.b && t.note.length > 4, `${t.a}-${t.b}`);
  assert.equal(npcTie('realtor', 'misun').kind, 'married');
  assert.equal(npcTie('misun', 'realtor').kind, 'married');
  assert.equal(npcTie('gabung', 'lux').kind, 'family');
  assert.equal(npcTie('janna', 'sinjjajang').kind, 'crush');
  assert.equal(npcTieWord(npcTie('janna', 'sinjjajang'), 'janna'), '짝사랑 중');
  assert.equal(npcTieWord(npcTie('tsunade', 'haku'), 'tsunade'), '스승');
  assert.equal(npcTieWord(npcTie('tsunade', 'haku'), 'haku'), '제자');
  // 발키리 is 언니 to 도원 · 민서.
  assert.deepEqual(NPC_FRIEND_TIES.map((t) => [t.npc, t.friend, t.kind]), NPC_SISTER_FRIENDS.map((f) => ['carpenter', f, 'family']));
  assert.deepEqual(NPC_SISTER_FRIENDS, ['도원', '민서']);
  for (const id of NPC_IDS) assert.ok(npcTiesOf(id).length >= 2, `${id} has ${npcTiesOf(id).length} ties`);
  for (const id of ['nilah', 'haku', 'ornn', 'mercy', 'shinichi', 'muzan']) assert.ok(npcTiesOf(id).length >= 5, `${id} is well connected`);
});

// ---------------------------------------------------------------- story
test('the day story is deterministic: quarrel → sulk → make-up on consecutive days, a few presents', () => {
  assert.deepEqual(npcSocialStory(DAY0), npcSocialStory(DAY0));
  let quarrels = 0;
  for (let day = DAY0; day < DAY0 + 60; day++) {
    const story = npcSocialStory(day);
    const gifts = story.filter((s) => s.kind === 'gift');
    assert.ok(gifts.length <= GIFTS_PER_DAY && gifts.length >= 1, `day ${day} gifts`);
    const givers = gifts.flatMap((g) => [g.a, g.b]);
    assert.equal(new Set(givers).size, givers.length, 'one present per resident a day');
    for (const g of gifts) assert.equal(g.item, NPC_EXTRA[g.a].social.giftItem);
    for (const s of story.filter((x) => x.kind === 'quarrel')) {
      quarrels++;
      assert.equal(npcPairMood(s.a, s.b, day + 1), 'sulk');
      assert.equal(npcPairMood(s.a, s.b, day + 2), 'makeup');
      assert.equal(npcPairMood(s.a, s.b, day - 1), null);
      assert.ok(npcSulkingWith(s.a, day + 1) && npcSulkingWith(s.b, day + 1));
      assert.ok(Math.floor(day / ARC_CYCLE) === Math.floor((day + 2) / ARC_CYCLE), 'an arc stays inside its cycle');
    }
  }
  assert.ok(quarrels >= 10, `${quarrels} quarrels in 60 days`);
  // The married couple squabble now and then, and always make up.
  const couple = Array.from({ length: 90 }, (_, i) => npcPairMood('realtor', 'misun', DAY0 + i));
  assert.ok(couple.includes('quarrel') && couple.includes('makeup'));
});

// ---------------------------------------------------------------- meetings
test('meetings: tied pairs only, one meeting each, never on the same tile, on walkable ground, facing each other', () => {
  const kinds = new Set();
  let n = 0;
  for (const { now, spots, events } of SWEEP) {
    const seen = new Set();
    for (const ev of events) {
      n++;
      kinds.add(ev.kind);
      assert.ok(npcTie(ev.a, ev.b), `${ev.a}-${ev.b} tied`);
      assert.ok(!seen.has(ev.a) && !seen.has(ev.b), 'one meeting each');
      seen.add(ev.a).add(ev.b);
      assert.notEqual(npcPairMood(ev.a, ev.b, kstDay(now)), 'sulk', 'a sulking pair never meets');
      const pa = ev.pos[ev.a],
        pb = ev.pos[ev.b];
      const a = spots.find((s) => s.id === ev.a);
      assert.deepEqual([pa.x, pa.z], [a.x, a.z], 'the one who stays does not move');
      assert.ok(Math.abs(Math.hypot(pa.x - pb.x, pa.z - pb.z) - MEET_GAP) < 1e-9);
      assert.ok(npcCanStand(ev.area, pb), `${ev.b} on walkable ground in ${ev.area}`);
      assert.ok(Math.abs(pa.facing - Math.atan2(pb.x - pa.x, pb.z - pa.z)) < 1e-9 && Math.abs(pb.facing - Math.atan2(pa.x - pb.x, pa.z - pb.z)) < 1e-9);
    }
    // No two standing residents of an area on one tile (meeting positions applied).
    const placed = spots
      .filter((s) => s.visible && !s.walking)
      .map((s) => {
        const ev = events.find((e) => e.pos[s.id]);
        return { id: s.id, area: s.area, tile: npcTile(ev ? ev.pos[s.id] : s), moved: !!ev && ev.b === s.id };
      });
    for (const p of placed.filter((x) => x.moved)) {
      const clash = placed.find((q) => q.id !== p.id && q.area === p.area && q.tile === p.tile);
      assert.ok(!clash, `${p.id} shares tile ${p.tile} with ${clash?.id} at ${new Date(now).toISOString()}`);
    }
  }
  assert.ok(n > 200, `${n} meetings in two weeks`);
  for (const k of ['chat', 'meal', 'gift', 'quarrel', 'makeup']) assert.ok(kinds.has(k), `some ${k} meetings`);
});

test('the same meeting from the area view and the whole-village view; npcSocialOf / npcMeetAt agree', () => {
  let checked = 0;
  for (const { now, spots, events } of SWEEP.filter((_, i) => i % 7 === 0)) {
    for (const area of new Set(events.map((e) => e.area))) {
      const local = npcSocialScene(spots.filter((s) => s.visible && s.area === area), now);
      assert.deepEqual(
        local.map((e) => e.key),
        events.filter((e) => e.area === area).map((e) => e.key),
      );
    }
    for (const ev of events) {
      assert.equal(npcSocialOf(ev.a, now, OPEN)?.key, ev.key);
      const meet = npcMeetAt(ev.b, now, OPEN);
      if (meet.point) assert.ok(Math.hypot(meet.point.x - ev.pos[ev.b].x, meet.point.z - ev.pos[ev.b].z) < 1e-9, 'you meet them where they stand');
      checked++;
    }
  }
  assert.ok(checked > 10);
});

test('exchanges: four filled bubbles from both voices, the giver first; join lines name me', () => {
  for (const { events } of SWEEP.filter((_, i) => i % 3 === 0))
    for (const ev of events) {
      const lines = npcSocialExchange(ev);
      assert.ok(lines.length >= 3 && lines.length <= 4, ev.key);
      assert.equal(lines[0].who === ev.a || lines[0].who === ev.b, true);
      assert.ok(lines.some((l) => l.who === ev.a) && lines.some((l) => l.who === ev.b));
      for (const l of lines) assert.ok(!/\{\w+\}/.test(l.text) && l.text.length > 0, `${ev.key}: ${l.text}`);
      if (ev.kind === 'gift') {
        assert.equal(lines[0].who, ev.first);
        assert.ok(lines[0].text.includes(ev.item), lines[0].text);
      }
      assert.deepEqual(npcSocialExchange(ev), lines);
      const join = npcJoinLines(ev, '민서');
      assert.equal(join.length, 3);
      assert.ok(join[0].text.includes('민서') && join[1].text.includes('민서'));
      for (const l of join) assert.ok(!/\{\w+\}/.test(l.text), l.text);
    }
});

// ---------------------------------------------------------------- 끼어들기 (server)
function netPoint(area, p) {
  if (area === 'village') return villageToNetwork(p);
  if (['market', 'harbor', 'hillside', 'ranch', 'foothill'].includes(area)) return regionToNetwork(area, p);
  return null;
}
test('joining a meeting: the server checks they are together and I am near, then +2 with both once a day', () => {
  const found = SWEEP.flatMap(({ now, events }) => events.filter((e) => ['village', 'market', 'harbor', 'ranch', 'foothill', 'hillside'].includes(e.area)).map((e) => ({ now, ev: e })));
  assert.ok(found.length > 0);
  const { now, ev } = found[0];
  const near = netPoint(ev.area, ev.pos[ev.a]);
  const ctx = { area: ev.area, actor: 0, fishing: false, x: near.x, y: near.y, ...OPEN };
  const join = { kind: 'npcSocial', npc: ev.a, op: 'join', with: ev.b };
  assert.doesNotThrow(() => assertNpcSocialContext(join, {}, ctx, now));
  // Not with someone else, not from another area, not from afar.
  const stranger = NPC_IDS.find((id) => id !== ev.a && id !== ev.b);
  assert.throws(() => assertNpcSocialContext({ ...join, with: stranger }, {}, ctx, now), /함께 있지 않아요/);
  assert.throws(() => assertNpcSocialContext(join, {}, { ...ctx, area: ev.area === 'village' ? 'market' : 'village' }, now), /가까이/);
  assert.throws(() => assertNpcSocialContext({ ...join, with: ev.a }, {}, ctx, now), /다시 골라/);
  const life = { ext: { u: { npcRelations: { [ev.a]: { points: 30 } } } }, bag: {}, farms: {} };
  npcSocialAction(life, 'u', join, now);
  assert.equal(life.ext.u.npcRelations[ev.a].points, 30 + NPC_JOIN_POINTS);
  assert.equal(life.ext.u.npcRelations[ev.b].points, NPC_JOIN_POINTS);
  assert.throws(() => npcSocialAction(life, 'u', join, now), /이미 끼어들었어요/);
  // The day is saved with the relation.
  assert.equal(readNpcRelations(life.ext.u.npcRelations)[ev.a].joinedDay, kstDay(now));
  // The talk box offers it while they are together.
  const choices = npcTalkChoices({ talked: false, gifted: false, busy: false, blocked: '', social: { other: '하쿠와', joined: false, joinOff: '' } });
  assert.deepEqual(choices.slice(2, 4).map((c) => [c.id, c.disabled]), [['overhear', false], ['join', false]]);
});

// ---------------------------------------------------------------- dialogue
test('extra lines: every resident has them, in house style, merged after their own lines', () => {
  const SHORT = ['chat', 'reply', 'quarrel', 'makeup', 'meal', 'stroll', 'give', 'thanks'];
  for (const id of NPC_IDS) {
    const x = NPC_EXTRA[id];
    assert.ok(x, id);
    const walk = (v, max, where) => {
      if (typeof v === 'string') {
        assert.ok(v.length <= max, `${id} ${where}: ${v}`);
        assert.ok(!EMOJI.test(v) && !/[A-Za-z]{3,}/.test(v.replace(/\{\w+\}/g, '')), `${id} ${where}: ${v}`);
        assert.ok(!/\{\w+\}[가-힣]/.test(v), `${id} ${where}: particle after a placeholder: ${v}`);
        for (const m of v.matchAll(/\{(\w+)\}/g)) assert.ok(['me', 'other', 'item', 'season', 'weather', 'place'].includes(m[1]), `${id} ${where}: {${m[1]}}`);
      } else if (Array.isArray(v)) v.forEach((s) => walk(s, max, where));
      else for (const [k, s] of Object.entries(v)) walk(s, SHORT.includes(k) ? 24 : max, `${where}.${k}`);
    };
    walk({ greet: x.greet, weather: x.weather, season: x.season, tier: x.tier, react: x.react }, 60, 'lines');
    walk(x.social, 60, 'social');
    for (const k of NPC_RECENT_KINDS) assert.ok(x.react[k].length >= 2, `${id} react ${k}`);
    for (const k of SHORT) assert.ok(x.social[k].length >= 2 && x.social[k].every((s) => !s.includes('{me}')), `${id} social ${k}`);
    assert.ok(x.social.give.every((s) => s.includes('{item}')) && x.social.sulk.every((s) => s.includes('{other}')) && x.social.join.every((s) => s.includes('{me}')));
    for (const t of [0, 1, 2, 3, 4]) assert.ok(x.tier[t].length >= 2);
  }
});

test('talks: new lines come up, activity reactions and a sulk now and then, always filled', () => {
  const recentSeen = new Set(),
    extraSeen = new Set();
  for (const id of NPC_IDS) {
    const react = Object.values(NPC_EXTRA[id].react).flat();
    const extra = [...Object.values(NPC_EXTRA[id].greet).flat(), ...Object.values(NPC_EXTRA[id].tier).flat()];
    for (let d = 0; d < 30; d++) {
      const now = T0 + d * 24 * HOUR;
      const talk = npcTalk({ npc: id, me: '강재', who: 1, now, points: 45, talkedToday: false, recent: ['fishing', 'stockUp'] });
      for (const l of talk.lines) {
        assert.ok(!/\{\w+\}/.test(l), `${id}: ${l}`);
        if (react.some((t) => t.replaceAll('{me}', '강재') === l)) recentSeen.add(id);
        if (extra.some((t) => t.replaceAll('{me}', '강재') === l)) extraSeen.add(id);
      }
    }
    // The reply can bring up what I did too, and never repeats a page.
    const said = npcTalk({ npc: id, me: '강재', who: 1, now: T0, points: 45, talkedToday: false, recent: ['museum'] }).lines;
    assert.ok(!said.includes(npcTalkReply({ npc: id, me: '강재', who: 1, now: T0, points: 45, recent: ['museum'] }, said)));
  }
  assert.ok(recentSeen.size >= NPC_IDS.length - 3, `${recentSeen.size} residents brought up what I did`);
  assert.ok(extraSeen.size >= NPC_IDS.length - 3, `${extraSeen.size} residents said a new line`);
  // Without recent activity a talk is unchanged by reactions.
  for (let d = 0; d < 10; d++) {
    const now = T0 + d * 24 * HOUR;
    const sulk = NPC_IDS.find((id) => npcSulkingWith(id, kstDay(now)));
    if (!sulk) continue;
    const pool = npcSocialTalkPool(sulk, kstDay(now));
    assert.ok(pool.length >= 2 && pool.every((s) => s.includes(NPCS[npcSulkingWith(sulk, kstDay(now))].name)));
  }
  // The merged line set keeps the file's own lines first.
  assert.ok(NPC_LINES.nilah.greet.day.length >= 3);
});

test('recent activity: today only for fishing, boat, stocks and museum; this week for the tables', () => {
  const now = T0;
  assert.deepEqual(npcRecentKinds({ now, actor: 2 }), []);
  assert.deepEqual(npcRecentKinds({ now, actor: 2, fished: { ok: true, at: now - HOUR } }), ['fishing']);
  assert.deepEqual(npcRecentKinds({ now, actor: 2, fished: { ok: true, at: now - 30 * HOUR } }), []);
  assert.deepEqual(npcRecentKinds({ now, actor: 2, fished: { ok: true, at: now - HOUR }, voyage: { sailedToday: true, trip: null } }), ['voyage']);
  assert.deepEqual(npcRecentKinds({ now, actor: 2, stocks: { log: [{ at: now - HOUR }], profit: -500 } }), ['stockDown']);
  assert.deepEqual(npcRecentKinds({ now, actor: 2, stocks: { log: [{ at: now - 40 * HOUR }], profit: 500 } }), []);
  assert.deepEqual(npcRecentKinds({ now, actor: 2, museum: { carp: { actor: 2, at: now - HOUR }, eel: { actor: 1, at: now } } }), ['museum']);
  assert.deepEqual(npcRecentKinds({ now, actor: 2, tables: { blackjack: [{ actor: 2, net: 3000, n: 4 }], poker: [{ actor: 2, net: -1000, n: 2 }] } }), ['casinoWin']);
  assert.deepEqual(npcRecentKinds({ now, actor: 2, tables: { blackjack: [{ actor: 1, net: 3000, n: 4 }] } }), []);
});

// ---------------------------------------------------------------- world + news
test('in the world: the pair faces each other and talks only while a named person is close', () => {
  const hit = SWEEP.find(({ events }) => events.some((e) => e.area === 'village' && e.kind !== 'stroll'));
  assert.ok(hit);
  const ev = hit.events.find((e) => e.area === 'village' && e.kind !== 'stroll');
  const spots = hit.spots.filter((s) => s.visible && s.area === 'village');
  const far = residentFrames(spots, [{ id: 'me', name: '도원', x: 9999, z: 9999 }], hit.now, { rain: false, night: false, memory: newBehaviorMemory() });
  const fa = far.find((r) => r.id === ev.a),
    fb = far.find((r) => r.id === ev.b);
  assert.ok(Math.abs(fa.x - ev.pos[ev.a].x) < 1 && Math.abs(fb.x - ev.pos[ev.b].x) < 1, 'they stand together');
  assert.equal(fa.bubble, null);
  let spoke = 0;
  for (let t = 0; t < 24_000; t += 1_000) {
    const near = residentFrames(spots, [{ id: 'me', name: '도원', x: ev.pos[ev.a].x + 2, z: ev.pos[ev.a].z + 2 }], hit.now + t, { rain: false, night: false, memory: newBehaviorMemory() });
    const a = near.find((r) => r.id === ev.a),
      b = near.find((r) => r.id === ev.b);
    if (a.bubble || b.bubble) spoke++;
    // They keep facing each other even with me right there.
    assert.ok(Math.abs(a.facing - Math.atan2(b.x - a.x, b.z - a.z)) < 0.3, 'a faces b');
  }
  assert.ok(spoke >= 10, `spoke in ${spoke} of 24 seconds`);
  // Fixed posts (social: false) never wander off to meet anyone.
  const posts = residentFrames(spots, [], hit.now, { rain: false, night: false, memory: newBehaviorMemory(), social: false });
  assert.ok(!posts.some((r) => r.label.includes('중') && /수다|같이|선물|티격|화해/.test(r.label)));
});

test('village news: yesterday\'s make-ups, quarrels and presents, and only residents who live here yet', () => {
  let lines = 0;
  for (let day = DAY0; day < DAY0 + 20; day++) {
    const news = npcSocialNews(day);
    assert.deepEqual(news, npcSocialNews(day));
    assert.ok(news.length <= 3);
    for (const l of news) assert.ok(!EMOJI.test(l) && /대요/.test(l), l);
    lines += news.length;
    const shut = npcSocialNews(day, npcSocialPresent({}), 10);
    for (const l of shut) for (const id of ['nilah', 'haku', 'ornn', 'mercy', 'shinichi']) assert.ok(!l.includes(NPCS[id].name), `${NPCS[id].name} is not here yet: ${l}`);
  }
  assert.ok(lines >= 30);
  // npcSocialNow (the client's and server's whole-village view) is cached but exact.
  const now = SWEEP[40].now;
  assert.deepEqual(npcSocialNow(now, OPEN).map((e) => e.key), SWEEP[40].events.map((e) => e.key));
});
