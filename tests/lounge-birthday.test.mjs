// 생일 잔치 (lounge-birthday.ts): the friends' birthdays, the shared 도원·민서
// day (one banner, one news line, one cake), the 축하 방명록 (once per signer,
// never your own), the morning news, residents' birthday greetings and a
// partner's present, and the breakup news decided 2026-10-03.
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLife, ensureLifeMember, lifeAction, lifeView, LifeError } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, validateLedger, kstDay } from '../app/lounge-economy.ts';
import { FRIEND_PROFILES, birthdayActors, eventsOn } from '../app/lounge-calendar.ts';
import {
  BIRTHDAY_CAKE_POINT,
  BIRTHDAY_SIGN_BOND,
  assertBirthdayContext,
  birthdayBanners,
  readBdayBook,
} from '../app/lounge-birthday.ts';
import { bondPoints } from '../app/lounge-life-plus.ts';
import { birthdayGiftOf, breakupNewsText } from '../app/lounge-romance.ts';
import { NPC_IDS } from '../app/lounge-npc-data.ts';
import { NPC_BIRTHDAY_LINES, allNpcBirthdayLines } from '../app/lounge-npc-birthday.ts';
import { npcTalk } from '../app/lounge-npc-dialog.ts';
import { npcLoveChoices } from '../app/lounge-npc-speech.ts';

/** KST noon of 2027-08-02 (도원 · 민서) and 2026-10-06 (강재); a plain day. */
const SHARED = Date.UTC(2027, 7, 2, 3);
const GANGJAE = Date.UTC(2026, 9, 6, 3);
const PLAIN = Date.UTC(2026, 9, 7, 3);
const DAY = 86_400_000;

function world(n = 4) {
  const members = Array.from({ length: n }, (_, i) => ({ id: `0000000${i}-1111-4111-8111-111111111111`, actor: i }));
  let ledger = newLoungeLedger();
  let life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
  }
  const s = { members, get life() { return life; }, get ledger() { return ledger; } };
  s.act = (m, action, now) => {
    const r = lifeAction(life, ledger, m, action, now);
    life = r.life;
    ledger = r.ledger;
    validateLedger(ledger);
    return lifeView(life, m.id, m.actor, now);
  };
  s.fails = (m, action, re, now) => assert.throws(() => lifeAction(life, ledger, m, action, now), (e) => e instanceof LifeError && re.test(e.message));
  s.set = (m, npc, row) => {
    const ext = ((life.ext ??= {})[m.id] ??= {});
    (ext.npcRelations ??= {})[npc] = row;
  };
  return s;
}
const cheer = (to) => ({ kind: 'birthdayCheer', to });

test('the friends\' birthdays: month-day only, 도원 and 민서 share 08-02', () => {
  assert.deepEqual(
    FRIEND_PROFILES.map((p) => p.birthday),
    ['08-02', '10-06', '08-02', '01-22', '11-12', '06-15', '07-10'],
  );
  for (const p of FRIEND_PROFILES) assert.match(p.birthday, /^\d{2}-\d{2}$/);
  assert.deepEqual(birthdayActors(kstDay(SHARED)), [0, 2]);
  assert.deepEqual(birthdayActors(kstDay(GANGJAE)), [1]);
  assert.deepEqual(birthdayActors(kstDay(PLAIN)), []);
  // Every birthday is a claimable day for its person (the existing 10,000범 claim).
  assert.equal(eventsOn(kstDay(SHARED), SHARED).filter((e) => e.kind === 'birthday').length, 2);
});

test('the shared day is one banner for everyone else; each sister keeps her own', () => {
  const events = eventsOn(kstDay(SHARED), SHARED);
  const forOthers = birthdayBanners(events, 3);
  assert.equal(forOthers.length, 1);
  assert.deepEqual(forOthers[0].actors, [0, 2]);
  assert.match(forOthers[0].text, /도원·민서 생일/);
  const forDowon = birthdayBanners(events, 0);
  assert.deepEqual(forDowon.map((b) => [b.mine, b.actors]), [[true, [0]], [false, [2]]]);
  assert.match(forDowon[1].text, /민서 생일/);
  assert.deepEqual(birthdayBanners(eventsOn(kstDay(PLAIN), PLAIN), 0), []);
});

test('the morning news says whose birthday it is, once, and the digest tells it the next day', () => {
  const s = world(2), [a, b] = s.members;
  s.act(b, cheer(0), SHARED);
  s.act(a, cheer(2), SHARED + 60_000);
  const today = s.life.news.find((d) => d.day === kstDay(SHARED)).lines.filter((l) => l.kind === 'birthday');
  assert.equal(today.length, 1);
  assert.equal(today[0].text, '오늘은 도원·민서의 생일이에요 🎂');
  assert.deepEqual(today[0].actors, [0, 2]);
  const next = lifeView(s.life, a.id, a.actor, SHARED + DAY);
  assert.ok(next.digest.lines.some((l) => l.kind === 'birthday' && l.text === '도원·민서의 생일이었어요 🎂'));
});

test('the 축하 방명록: once per signer, never your own, only on the day; bond up, ledger untouched', () => {
  const s = world(4), [dowon, gangjae, minseo, seungjun] = s.members;
  const before = JSON.stringify(s.ledger.accounts);
  const bond = bondPoints(s.life, 1, 0, SHARED);
  const view = s.act(gangjae, cheer(0), SHARED);
  assert.deepEqual(view.birthday.books[0], [1]);
  assert.equal(bondPoints(s.life, 1, 0, SHARED), bond + BIRTHDAY_SIGN_BOND);
  s.fails(gangjae, cheer(0), /이미 축하/, SHARED + 60_000);
  s.fails(dowon, cheer(0), /내 방명록/, SHARED);
  s.fails(minseo, cheer(2), /내 방명록/, SHARED);
  // The sisters may sign each other's book; one cake serves both, signed separately.
  s.act(minseo, cheer(0), SHARED);
  s.act(dowon, cheer(2), SHARED);
  s.act(seungjun, cheer(2), SHARED);
  s.act(seungjun, cheer(0), SHARED);
  const v = lifeView(s.life, dowon.id, dowon.actor, SHARED);
  assert.deepEqual(v.birthday.today, [0, 2]);
  assert.deepEqual(v.birthday.books, { 0: [1, 2, 3], 2: [0, 3] });
  assert.deepEqual(v.birthday.mine, [1, 2, 3]);
  // The birthday friend keeps the book after the day.
  assert.deepEqual(lifeView(s.life, dowon.id, dowon.actor, SHARED + 5 * DAY).birthday.mine, [1, 2, 3]);
  // Not their birthday, or a stranger.
  s.fails(gangjae, cheer(3), /생일이 아니에요/, SHARED);
  s.fails(gangjae, cheer(9), /누구의 생일/, SHARED);
  s.fails(dowon, cheer(0), /생일이 아니에요/, PLAIN);
  // Signing hands out no 범.
  assert.equal(JSON.stringify(s.ledger.accounts), before);
  // The signer feels it.
  const mood = s.life.mood?.[gangjae.id]?.l ?? [];
  assert.ok(mood.some(([id]) => id === 'birthdaySign'));
});

test('a saved 방명록 loads back; malformed rows and self-signs are dropped', () => {
  assert.deepEqual(readBdayBook({ '0-2027': [1, 2, 2, 0, 9, 'x'], '9-2027': [1], '1-27': [0], '3-2026': [] }), { '0-2027': [1, 2] });
  assert.equal(readBdayBook([1, 2]), undefined);
  assert.equal(readBdayBook(null), undefined);
});

test('the cloud wants you in the village plaza by the cake', () => {
  assertBirthdayContext('village', { x: BIRTHDAY_CAKE_POINT.x + 1, z: BIRTHDAY_CAKE_POINT.z });
  assert.throws(() => assertBirthdayContext('market', { x: 0, z: 0 }), /광장/);
  assert.throws(() => assertBirthdayContext('village', { x: 40, z: 30 }), /가까이/);
  assert.throws(() => assertBirthdayContext('village', null), /광장/);
});

test('residents greet the birthday friend; a partner says more and has a present once', () => {
  const s = world(2), [gangjae] = [s.members[1]];
  // Every resident has two birthday lines of their own.
  for (const id of NPC_IDS) assert.equal(NPC_BIRTHDAY_LINES[id]?.length, 2, id);
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  for (const line of allNpcBirthdayLines()) {
    assert.ok(line.length <= 60, line);
    assert.ok(!EMOJI.test(line), line);
    assert.ok(!/[A-Za-z]{3,}/.test(line.replace(/\{\w+\}/g, '')), line);
    assert.ok(!/\}(이|가|은|는|을|를|과|와|랑|이랑|의|에게|한테)/.test(line), line);
  }
  const talk = npcTalk({ npc: 'janna', me: '강재', who: 1, now: GANGJAE, points: 0, talkedToday: false, birthday: true });
  assert.ok(NPC_BIRTHDAY_LINES.janna.map((l) => l.replace('{me}', '강재')).includes(talk.lines[0]));
  const lover = npcTalk({ npc: 'janna', me: '강재', who: 1, now: GANGJAE, points: 100, talkedToday: false, birthday: true, love: 'dating', days: 4 });
  assert.match(lover.lines[0], /생일/);
  // The present: lovers only, on my birthday, once.
  s.set(gangjae, 'janna', { points: 100, rw: 3, love: 'dating', since: kstDay(GANGJAE) - 5 });
  s.set(gangjae, 'lux', { points: 50, rw: 1 });
  const rows = (now) => lifeView(s.life, gangjae.id, gangjae.actor, now).me.npcRelations;
  assert.ok(npcLoveChoices({ npc: 'janna', rows: rows(GANGJAE), day: kstDay(GANGJAE), bouquets: 0, rings: 0, area: 'village', birthday: true }).includes('bdayGift'));
  s.fails(gangjae, { kind: 'npcSocial', npc: 'janna', op: 'bdayGift' }, /내 생일/, PLAIN);
  s.fails(gangjae, { kind: 'npcSocial', npc: 'lux', op: 'bdayGift' }, /연인/, GANGJAE);
  const item = birthdayGiftOf('janna', gangjae.id, kstDay(GANGJAE));
  const v = s.act(gangjae, { kind: 'npcSocial', npc: 'janna', op: 'bdayGift' }, GANGJAE);
  assert.equal(v.me.inv[item], 1);
  s.fails(gangjae, { kind: 'npcSocial', npc: 'janna', op: 'bdayGift' }, /이미 받았어요/, GANGJAE + 60_000);
  assert.ok(!npcLoveChoices({ npc: 'janna', rows: rows(GANGJAE), day: kstDay(GANGJAE), bouquets: 0, rings: 0, area: 'village', birthday: true }).includes('bdayGift'));
});

test('breakups are village news too: kind and light, for 연인 · 약혼 · 결혼', () => {
  for (const [love, re] of [['dating', /좋은 친구로/], ['engaged', /약혼은 없던 일/], ['married', /각자의 길/]]) {
    const s = world(1), [m] = s.members;
    s.set(m, 'lumi', { points: 120, love, since: kstDay(PLAIN) - 20, weddingDay: kstDay(PLAIN) - 10 });
    s.act(m, { kind: 'npcSocial', npc: 'lumi', op: 'breakup' }, PLAIN);
    const line = s.life.news.flatMap((d) => d.lines).find((l) => l.kind === 'breakup');
    assert.ok(line, love);
    assert.match(line.text, re);
    assert.match(line.text, /도원/);
    assert.match(line.text, /미쿠/);
    assert.deepEqual(line.actors, [0]);
    assert.ok(!/차였|버림|배신/.test(line.text));
  }
  assert.equal(breakupNewsText('dating', '강재', '잔나'), '강재와 잔나가 연인에서 좋은 친구로 돌아갔어요. 둘 다 씩씩하대요');
});
