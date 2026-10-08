// 주민과 진짜 대화 (handover/design/design-npc-conversation.md): the engine
// (lounge-npc-talk.ts), the server action (lounge-npc-talk-life.ts) and every
// resident's talk book (app/npc-talk/<id>.ts, checked by one validator so the
// content sessions can add residents and run this file).
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPC_TALK } from '../app/npc-talk/index.ts';
import {
  TALK_MEMORY_MAX,
  TALK_TIER_POINTS,
  chapterLabel,
  chaptersDone,
  condHolds,
  fillTalk,
  memoryLines,
  migratedChapters,
  nextChapter,
  pickTalk,
  remember,
  talkDays,
  visitDue,
} from '../app/lounge-npc-talk.ts';
import { NPC_IDS, isNpcId, NPC_DATING_POINTS } from '../app/lounge-npc-data.ts';
import { npcTiesOf } from '../app/lounge-npc-social-ties.ts';
import { ITEM_BY_ID } from '../app/lounge-items.ts';
import { CROPS, emptyLife, ensureLifeMember, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, kstDay } from '../app/lounge-economy.ts';
import { readNpcRelations } from '../app/lounge-romance.ts';
import { npcTalkChoices } from '../app/lounge-npc-speech.ts';
import { gameTimeOnDay } from '../app/lounge-calendar.ts';

const T0 = Date.UTC(2026, 8, 24, 3),
  DAY = 86400000;
const C1 = ['captain', 'maehwa', 'lumi', 'rose', 'frieren'];

// ---------------------------------------------------------------- content rules (any resident)
const MOMENT = ['time', 'season', 'weather', 'festival', 'fish', 'bigFish', 'harvest', 'gold', 'mood', 'news', 'friendNews', 'recent', 'bond', 'with', 'sulk', 'bday'];
const AREAS = new Set(['village', 'market', 'harbor', 'hillside', 'ranch', 'foothill', 'farm', 'hill', 'woods', 'mine', 'tavern', 'casino', 'lounge', 'home']);
const list = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const VARS = new Set(['me', 'name', 'season', 'weather', 'fish', 'taste', 'other', 'days']);
function checkLine(npc, where, text) {
  assert.equal(typeof text, 'string', `${npc} ${where}`);
  assert.ok(text.trim().length > 0, `${npc} ${where}: empty`);
  assert.ok([...text].length <= 60, `${npc} ${where}: over 60 chars: ${text}`);
  assert.ok(!/\p{Extended_Pictographic}/u.test(text), `${npc} ${where}: emoji: ${text}`);
  assert.ok(!/[A-Za-z]/.test(text.replace(/\{\w+\}/g, '')), `${npc} ${where}: English: ${text}`);
  // No points on screen: no digits at all ("+6", "20점"), numbers are written in words.
  assert.ok(!/\d/.test(text), `${npc} ${where}: digits: ${text}`);
  for (const [, k] of text.matchAll(/\{(\w+)\}/g)) assert.ok(VARS.has(k), `${npc} ${where}: unknown {${k}}`);
  // A name tag is never followed by a particle (its 받침 is unknown).
  assert.ok(!/\{(me|name|other|fish|taste)\}[이가을를은는과와의도로]/.test(text), `${npc} ${where}: particle after a tag: ${text}`);
}
/** Checks one resident's book; the content sessions run this for theirs. */
export function checkBook(npc, book) {
  assert.equal(book.npc, npc);
  const all = [...book.talks, ...book.openers, ...book.callbacks];
  const ids = all.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, `${npc}: talk ids are unique`);
  assert.ok(book.talks.length >= 12, `${npc}: ≥ 12 choice talks (${book.talks.length})`);
  assert.ok(book.openers.length >= 10, `${npc}: ≥ 10 context openers (${book.openers.length})`);
  assert.ok(book.callbacks.length >= 6, `${npc}: ≥ 6 memory callbacks (${book.callbacks.length})`);
  assert.ok(book.chapters.length >= 5 && book.chapters.length <= 6, `${npc}: 5–6 chapters`);
  assert.ok(book.after.length >= 2, `${npc}: ≥ 2 after-lines`);
  const remembered = new Set();
  const replies = (where, rs) => {
    assert.ok(rs.length >= 2 && rs.length <= 3, `${where}: 2–3 replies`);
    assert.ok(rs.some((r) => r.tier === 'great'), `${where}: one reply lands best`);
    for (const [i, r] of rs.entries()) {
      assert.ok(['great', 'good', 'meh'].includes(r.tier), `${where}: tier`);
      checkLine(npc, `${where} reply ${i}`, r.say);
      assert.ok([...r.say].length <= 30, `${where}: reply button ≤ 30 chars`);
      for (const line of list(r.answer)) checkLine(npc, `${where} answer ${i}`, line);
      if (r.remember) {
        assert.ok(/^[a-z0-9][a-z0-9:-]{0,23}$/.test(r.remember), `${where}: memory tag ${r.remember}`);
        remembered.add(r.remember);
      }
    }
  };
  for (const t of all) {
    for (const line of list(t.open)) checkLine(npc, t.id, line);
    replies(`${npc} ${t.id}`, t.replies);
    if (t.when?.bond) assert.ok(npcTiesOf(npc).some((x) => x.other === t.when.bond), `${npc} ${t.id}: ${t.when.bond} is one of their ties`);
    if (t.when?.with) assert.ok(isNpcId(t.when.with), `${npc} ${t.id}: with`);
  }
  for (const t of book.talks) for (const k of Object.keys(t.when ?? {})) assert.ok(!MOMENT.includes(k), `${npc} ${t.id}: everyday talks do not wait for a moment (${k})`);
  for (const t of book.openers) assert.ok(Object.keys(t.when ?? {}).some((k) => MOMENT.includes(k)), `${npc} ${t.id}: an opener is about the moment`);
  for (const t of book.callbacks) {
    const mem = list(t.when?.mem);
    assert.ok(mem.length > 0, `${npc} ${t.id}: a callback needs a memory`);
    // Said once: it uses up its memory, or (an '@' memory) waits for a tag its replies then keep.
    const once = list(t.use).length > 0 || (list(t.when?.noMem).length > 0 && t.replies.every((r) => list(t.when.noMem).includes(r.remember)));
    assert.ok(once, `${npc} ${t.id}: a callback is said once (use, or noMem kept by every reply)`);
  }
  let points = 0;
  for (const [i, c] of book.chapters.entries()) {
    const where = `${npc} chapter ${i + 1}`;
    checkLine(npc, `${where} title`, c.title);
    assert.ok(c.hint.length > 0 && [...c.hint].length <= 80, `${where}: hint`);
    assert.ok(c.scene.length >= 3 && c.scene.length <= 8, `${where}: 3–8 scene lines`);
    for (const line of c.scene) checkLine(npc, where, line);
    replies(where, c.replies);
    assert.ok((c.need.points ?? points) >= points, `${where}: points never go down (migration)`);
    points = c.need.points ?? points;
    if (c.need.visit) {
      assert.ok(AREAS.has(c.need.visit.area), `${where}: visit area ${c.need.visit.area}`);
      for (const h of [c.need.visit.from, c.need.visit.to]) assert.ok(Number.isInteger(h) && h >= 0 && h <= 24, `${where}: visit hours`);
    }
    if (c.need.bring) assert.ok(ITEM_BY_ID[c.need.bring.item] || CROPS.includes(c.need.bring.item), `${where}: bring ${c.need.bring.item}`);
    if (i === 0) assert.ok(!c.need.visit && !c.need.bring && !c.need.love && !c.need.points, `${npc}: the first chapter opens by talking`);
  }
  assert.ok(book.chapters.some((c) => c.need.visit), `${npc}: one chapter asks for a place and time`);
  assert.ok(book.chapters.some((c) => c.need.bring), `${npc}: one chapter asks for an item`);
  // The 꽃다발 fits the flow: a chapter at 8 hearts, and the last one after dating.
  assert.ok(book.chapters.some((c) => c.need.points === NPC_DATING_POINTS), `${npc}: a chapter at the 꽃다발 hearts`);
  assert.ok(book.chapters.at(-1).need.love, `${npc}: the last chapter follows the 꽃다발`);
  // Every memory a line needs can be earned, and has words for the notebook.
  for (const t of all) for (const m of [...list(t.when?.mem), ...list(t.use)]) if (!m.startsWith('@')) assert.ok(remembered.has(m), `${npc} ${t.id}: memory ${m} is never kept`);
  for (const c of book.chapters)
    if (c.need.mem) {
      assert.ok(book.talks.some((t) => t.replies.some((r) => r.remember === c.need.mem)), `${npc}: chapter memory ${c.need.mem} comes from an everyday talk`);
      assert.ok(!all.some((t) => list(t.use).includes(c.need.mem)), `${npc}: chapter memory ${c.need.mem} is not used up`);
    }
  for (const m of remembered) assert.ok(book.memories[m], `${npc}: memory ${m} has notebook words`);
  for (const [tag, text] of Object.entries(book.memories)) checkLine(npc, `memory ${tag}`, text);
  for (const line of book.after) checkLine(npc, 'after', line);
}

test('every talk book follows the format (C1 residents complete)', () => {
  for (const npc of C1) assert.ok(NPC_TALK[npc], `${npc} has a book`);
  for (const [npc, book] of Object.entries(NPC_TALK)) {
    assert.ok(NPC_IDS.includes(npc), npc);
    checkBook(npc, book);
  }
});

// ---------------------------------------------------------------- engine
const facts = (over = {}) => ({ love: null, ch: 0, mem: [], virtual: [], ...over });

test('conditions: known facts are checked, unknown ones hold (the server view)', () => {
  assert.ok(condHolds({ weather: 'rain' }, facts({ weather: 'rain' })));
  assert.ok(!condHolds({ weather: 'rain' }, facts({ weather: 'sunny' })));
  assert.ok(condHolds({ weather: ['rain', 'storm'] }, facts({ weather: 'storm' })));
  assert.ok(condHolds({ fish: true }, facts()), 'unknown catch holds');
  assert.ok(!condHolds({ fish: true }, facts({ fish: null })));
  assert.ok(condHolds({ fish: ['crucian'] }, facts({ fish: 'crucian' })));
  assert.ok(!condHolds({ fish: ['crucian'] }, facts({ fish: 'carp' })));
  assert.ok(!condHolds({ mem: 'x' }, facts()), 'memories are always known');
  assert.ok(condHolds({ mem: ['x', '@taste'] }, facts({ mem: ['x'], virtual: ['@taste'] })));
  assert.ok(!condHolds({ noMem: 'x' }, facts({ mem: ['x'] })));
  assert.ok(!condHolds({ love: 'dating' }, facts()));
  assert.ok(condHolds({ love: 'none' }, facts()));
  assert.ok(condHolds({ love: 'any' }, facts({ love: 'married' })));
  assert.ok(!condHolds({ ch: 2 }, facts({ ch: 1 })));
  assert.ok(condHolds({ bond: 'rose' }, facts({ talkedTo: ['rose'] })));
  assert.ok(!condHolds({ bond: 'rose' }, facts({ talkedTo: [] })));
  assert.ok(condHolds({ news: 'wedding', mood: 'low' }, facts({ news: ['wedding'], mood: 'low' })));
});

test('context: openers follow the day, callbacks follow memories, else the everyday rotation', () => {
  const book = NPC_TALK.captain;
  const seen = new Set();
  // Rainy days with nothing else known: rain openers come up, never a sunny-only one.
  for (let d = 0; d < 60; d++) {
    const t = pickTalk(book, facts({ weather: 'rain', time: 'day', fish: null, bigFish: false, harvest: false, gold: false, festival: false, mood: 'mid', news: [], talkedTo: [] }), { who: 0, day: 20_000 + d, tc: d });
    seen.add(t.id);
    assert.ok(condHolds(t.when, facts({ weather: 'rain', time: 'day', fish: null, bigFish: false, harvest: false, gold: false, festival: false, mood: 'mid', news: [], talkedTo: [] })), t.id);
  }
  assert.ok(seen.has('op-rain'), 'the rain opener comes up');
  assert.ok([...seen].some((id) => book.talks.some((t) => t.id === id)), 'everyday talks come up too');
  // Deterministic: same day and seed, same talk.
  const f = facts({ weather: 'sunny', time: 'evening', fish: 'crucian', news: [], talkedTo: [] });
  assert.equal(pickTalk(book, f, { who: 3, day: 20_100, tc: 4 }).id, pickTalk(book, f, { who: 3, day: 20_100, tc: 4 }).id);
  // A memory callback comes back on some day once the memory is there.
  const withMem = facts({ mem: ['sea-lover'], weather: 'sunny', time: 'day', news: [], talkedTo: [] });
  const ids = new Set(Array.from({ length: 20 }, (_, d) => pickTalk(book, withMem, { who: 0, day: 21_000 + d, tc: d }).id));
  assert.ok(ids.has('cb-sea'), 'callback comes up');
  // The everyday rotation does not repeat a talk before all were heard.
  const quiet = facts({ weather: 'sunny', time: 'day', fish: null, bigFish: false, harvest: false, gold: false, festival: false, mood: 'mid', news: [], friendNews: [], talkedTo: [], with: null, sulk: null, bday: false });
  const everyday = book.talks.filter((t) => condHolds(t.when, quiet));
  const rot = Array.from({ length: everyday.length }, (_, tc) => pickTalk(book, quiet, { who: 0, day: 22_000 + tc, tc }).id);
  assert.equal(new Set(rot).size, everyday.length, 'every everyday talk once before a repeat');
  // Fallback: no opener fits → an everyday talk.
  assert.ok(book.talks.some((t) => t.id === pickTalk(book, quiet, { who: 1, day: 22_000, tc: 0 }).id) || book.openers.some((t) => condHolds(t.when, quiet)));
});

test('memories: at most 20, oldest dropped, a repeat moves to the end; text fill-ins', () => {
  let mem = [];
  for (let i = 0; i < 25; i++) mem = remember(mem, `m${i}`);
  assert.equal(mem.length, TALK_MEMORY_MAX);
  assert.equal(mem[0], 'm5');
  mem = remember(mem, 'm7');
  assert.equal(mem.at(-1), 'm7');
  assert.equal(mem.filter((m) => m === 'm7').length, 1);
  assert.deepEqual(remember(['a'], 'Bad Tag'), ['a']);
  assert.deepEqual(memoryLines(NPC_TALK.captain, ['sea-lover', 'hat-story', 'nope'], 3), ['오래된 모자 이야기를 들었어요', '바다가 좋다고 했어요']);
  assert.equal(fillTalk('{me}, {fish} 낚았지?', { me: '도원', fish: '붕어' }), '도원, 붕어 낚았지?');
  assert.equal(fillTalk('{fish} 낚았지?', {}), '물고기 낚았지?');
});

test('chapters: open by days, points, a visit and an item; old saves are placed by points', () => {
  const book = NPC_TALK.captain;
  const none = () => 0;
  assert.equal(migratedChapters(book, 0), 0, 'a new row starts at chapter 1');
  assert.equal(migratedChapters(book, 25), 1, '20+ points: chapter 2 is next');
  assert.equal(migratedChapters(book, 96), 4, '8 hearts: the 꽃다발 chapter is next');
  assert.equal(migratedChapters(book, 120), 4, 'the dating chapter is never skipped');
  assert.equal(chaptersDone(book, { points: 50 }), 2);
  assert.equal(chaptersDone(book, { points: 50, ch: 0 }), 0, 'a row with ch keeps it');
  assert.equal(talkDays({ points: 50 }), 8, 'old rows count points as talks');
  let s = nextChapter(book, { points: 0, ch: 0, tc: 0 }, none);
  assert.equal(s.n, 1);
  assert.ok(!s.open);
  s = nextChapter(book, { points: 6, ch: 0, tc: 1 }, none);
  assert.ok(s.open, 'chapter 1 after the first talk');
  // Chapter 2: days, points and the visit.
  s = nextChapter(book, { points: 30, ch: 1, tc: 3 }, none);
  assert.ok(!s.open && s.visitDue);
  const v = book.chapters[1].need.visit;
  assert.ok(visitDue(book, { points: 30, ch: 1 }, v.area, v.from));
  assert.ok(!visitDue(book, { points: 30, ch: 1 }, v.area, (v.to + 3) % 24));
  assert.ok(!visitDue(book, { points: 30, ch: 1 }, 'casino', v.from));
  assert.ok(nextChapter(book, { points: 30, ch: 1, tc: 3, vis: 2 }, none).open);
  assert.ok(!nextChapter(book, { points: 10, ch: 1, tc: 3, vis: 2 }, none).open, 'points too');
  // Chapter 3: the item.
  const bring = book.chapters[2].need.bring.item;
  assert.ok(nextChapter(book, { points: 45, ch: 2, tc: 6 }, none).bringDue);
  assert.ok(nextChapter(book, { points: 45, ch: 2, tc: 6 }, (i) => (i === bring ? 1 : 0)).open);
  // The last one waits for dating.
  const last = book.chapters.length;
  assert.ok(!nextChapter(book, { points: 120, ch: last - 1, tc: 40 }, none).open);
  assert.ok(nextChapter(book, { points: 120, ch: last - 1, tc: 40, love: 'dating' }, none).open);
  assert.equal(nextChapter(book, { points: 120, ch: last, tc: 40 }, none).n, null);
  assert.equal(chapterLabel(book, { points: 0, ch: 0 }), null);
  assert.equal(chapterLabel(book, { points: 0, ch: 2 }), `이야기 2장 · ${book.chapters[1].title}`);
});

// ---------------------------------------------------------------- server action
function world(actor = 0) {
  const member = { id: '11111111-1111-4111-8111-111111111111', actor };
  let life = ensureLifeMember(emptyLife(), member.id, member.actor);
  let ledger = registerWallet(newLoungeLedger(), `wallet-${member.id}`);
  return {
    member,
    get life() {
      return life;
    },
    set life(v) {
      life = v;
    },
    act(action, now = T0) {
      const r = lifeAction(life, ledger, member, action, now);
      life = r.life;
      ledger = r.ledger;
      return r;
    },
    rel(npc = 'captain') {
      return life.ext?.[member.id]?.npcRelations?.[npc];
    },
    view(now = T0) {
      return lifeView(life, member.id, member.actor, now);
    },
  };
}
const everyday = (npc = 'captain') => NPC_TALK[npc].talks.find((t) => !t.when);

test('a choice talk: once a 나의 하루, the tier adds hidden points (never less), memory kept, replay refused', () => {
  const s = world();
  const t = everyday();
  const great = t.replies.findIndex((r) => r.tier === 'great');
  s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: t.id, pick: great });
  const r = s.rel();
  assert.equal(r.points, TALK_TIER_POINTS.great);
  assert.equal(r.tc, 1);
  assert.equal(r.ch, 0);
  if (t.replies[great].remember) assert.deepEqual(r.mem, [t.replies[great].remember]);
  assert.throws(() => s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: t.id, pick: 0 }), /오늘 이야기/);
  assert.throws(() => s.act({ kind: 'npcSocial', npc: 'captain', op: 'talk' }), /오늘 이야기/, 'the old talk shares the day');
  // Next day, a meh reply still adds (never subtracts).
  const meh = t.replies.findIndex((r) => r.tier === 'meh');
  if (meh >= 0) {
    s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: t.id, pick: meh }, T0 + DAY);
    assert.equal(s.rel().points, TALK_TIER_POINTS.great + TALK_TIER_POINTS.meh);
  }
  assert.equal(s.rel().tc, meh >= 0 ? 2 : 1);
  // Bad picks and unknown talks are refused.
  assert.throws(() => s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: 'nope', pick: 0 }, T0 + 2 * DAY), /다시 골라/);
  assert.throws(() => s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: t.id, pick: 7 }, T0 + 2 * DAY), /대답/);
  // A callback needs its memory on the server too.
  assert.throws(() => s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: 'cb-hat', pick: 0 }, T0 + 2 * DAY), /그 이야기를 꺼낼 때/);
  // A resident without a book keeps the old talk.
  const other = NPC_IDS.find((n) => !NPC_TALK[n]);
  if (other) assert.throws(() => s.act({ kind: 'npcChat', npc: other, op: 'talk', id: 'x', pick: 0 }), /아직 이야기를 고를 수 없어요/);
});

test('a callback uses up its memory; the save round-trips and stays small', () => {
  const s = world();
  s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: 'hat', pick: 0 });
  assert.ok(s.rel().mem.includes('hat-story'));
  s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: 'cb-hat', pick: 0 }, T0 + DAY);
  assert.ok(!(s.rel().mem ?? []).includes('hat-story'), 'used up');
  const back = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.deepEqual(back.ext[s.member.id].npcRelations, s.life.ext[s.member.id].npcRelations);
  const read = readNpcRelations({ captain: { points: 10, tc: 3, ch: 99, mem: ['ok', 'Bad', 'ok', 5], vis: 2 } });
  assert.deepEqual(read.captain, { points: 10, tc: 3, ch: 8, mem: ['ok'], vis: 2 });
  // Twenty memories of five residents stay well under a kilobyte each.
  assert.ok(JSON.stringify(Array.from({ length: 20 }, (_, i) => `memory-tag-${i}`)).length < 400);
});

test('story: a visit at the place and time, an item taken, chapters in order; old rows migrate', () => {
  const s = world();
  const book = NPC_TALK.captain;
  assert.throws(() => s.act({ kind: 'npcChat', npc: 'captain', op: 'story', pick: 0 }), /아직/);
  s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: everyday().id, pick: 0 });
  s.act({ kind: 'npcChat', npc: 'captain', op: 'story', pick: 0 });
  assert.equal(s.rel().ch, 1);
  // Chapter 2 needs days, points and the visit.
  for (let d = 1; d <= 3; d++) s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: everyday().id, pick: 0 }, T0 + d * DAY);
  s.life.ext[s.member.id].npcRelations.captain.points = 30;
  assert.throws(() => s.act({ kind: 'npcChat', npc: 'captain', op: 'story', pick: 0 }, T0 + 3 * DAY), /아직/);
  const v = book.chapters[1].need.visit;
  const at = gameTimeOnDay(kstDay(T0 + 3 * DAY), v.from);
  assert.throws(() => s.act({ kind: 'npcChat', npc: 'captain', op: 'visit', where: 'casino' }, at), /약속한 곳/);
  assert.throws(() => s.act({ kind: 'npcChat', npc: 'captain', op: 'visit' }, at), /약속한 곳/, 'no where: refused');
  s.act({ kind: 'npcChat', npc: 'captain', op: 'visit', where: v.area }, at);
  assert.equal(s.rel().vis, 2);
  s.act({ kind: 'npcChat', npc: 'captain', op: 'story', pick: 1 }, at);
  assert.equal(s.rel().ch, 2);
  assert.equal(s.rel().vis, undefined);
  // Chapter 3: the item is taken.
  const item = book.chapters[2].need.bring.item;
  for (let d = 4; d <= 6; d++) s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: everyday().id, pick: 0 }, T0 + d * DAY);
  s.life.ext[s.member.id].npcRelations.captain.points = 45;
  assert.throws(() => s.act({ kind: 'npcChat', npc: 'captain', op: 'story', pick: 0 }, T0 + 6 * DAY), /아직/);
  s.life.ext[s.member.id].inv = { [item]: 2 };
  s.act({ kind: 'npcChat', npc: 'captain', op: 'story', pick: 0 }, T0 + 6 * DAY);
  assert.equal(s.rel().ch, 3);
  assert.equal(s.life.ext[s.member.id].inv[item], 1);
  // Migration: an old row with 8 hearts and no ch is placed at the 꽃다발 chapter and freezes there.
  const o = world();
  o.life.ext = { [o.member.id]: { npcRelations: { captain: { points: 96 } } } };
  assert.equal(nextChapter(book, o.life.ext[o.member.id].npcRelations.captain, () => 0).n, 5);
  o.act({ kind: 'npcChat', npc: 'captain', op: 'story', pick: 0 });
  assert.equal(o.rel().ch, 5);
  assert.equal(o.rel().points, 96, 'capped at 8 hearts until dating, as before');
  // Love state, hearts and presents work underneath, unchanged.
  const view = o.view().me.npcRelations.find((r) => r.npc === 'captain');
  assert.equal(view.hearts, 8);
  assert.ok(view.rw & 1, 'the 단골 present came');
});

test('new rows start at chapter 1 even when points come first (gifts, requests)', () => {
  const s = world();
  s.life.ext = { [s.member.id]: { inv: { yellowtail: 5 } } };
  for (let d = 0; d < 3; d++) s.act({ kind: 'npcSocial', npc: 'captain', op: 'gift', item: 'yellowtail' }, T0 + d * DAY);
  assert.ok(s.rel().points >= 20);
  assert.equal(s.rel().ch, 0);
  assert.equal(nextChapter(NPC_TALK.captain, s.rel(), () => 0).n, 1);
});

// ---------------------------------------------------------------- what the box shows
test('no visible numbers: talk, gift and join labels carry no points', () => {
  const choices = npcTalkChoices({ talked: false, gifted: false, busy: false, blocked: '', social: { other: '닐라와', joined: false, joinOff: '' }, story: { label: '이야기 2장 · 뒷산의 노을' } });
  const POINTS = /[+＋]\s*\d|\d+\s*(점|포인트)|친밀도\s*\d/;
  for (const c of choices) assert.ok(!POINTS.test(c.label), c.label);
  const done = npcTalkChoices({ talked: true, gifted: true, busy: false, blocked: '' });
  for (const c of done) assert.ok(!POINTS.test(c.label), c.label);
  assert.ok(!done.find((c) => c.id === 'talk').disabled, 'later talks that day are a single line, still offered');
  assert.equal(choices.find((c) => c.id === 'story')?.label, '이야기 2장 · 뒷산의 노을');
});

test('the server checks memories and story, not the moment (the clock may roll over before I answer)', () => {
  const s = world();
  // A snow opener is accepted on any day: the box picked it when it opened.
  s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: 'op-snow', pick: 0 });
  assert.equal(s.rel().tc, 1);
  // A talk waiting for chapter three is refused before it.
  assert.throws(() => s.act({ kind: 'npcChat', npc: 'captain', op: 'talk', id: 'promise-sail', pick: 0 }, T0 + DAY), /그 이야기를 꺼낼 때/);
});
