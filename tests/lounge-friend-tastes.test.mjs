// 내 취향 (lounge-friend-tastes.ts): each friend picks up to 3 좋아하는 것 and
// 2 싫어하는 것 (categories or giftable items) and a short note; the server
// checks ids, counts and overlaps, allows one change per KST day, reads an
// unset friend as the placeholder table, makes one news line the first time,
// and gifts follow the saved tastes (item ×2 > category ×2 / ×0.2, birthday ×3).
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLife, ensureLifeMember, lifeAction, lifeView, readLife, LifeError } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, validateLedger, nextKstMidnight } from '../app/lounge-economy.ts';
import { FRIEND_PROFILES } from '../app/lounge-calendar.ts';
import { bondPoints, requestsFor } from '../app/lounge-life-plus.ts';
import {
  TASTE_NOTE_MAX,
  giftCatalog,
  readTastes,
  tasteFor,
  tastesOf,
} from '../app/lounge-friend-tastes.ts';
import { PLUS_ACTION_KINDS } from '../app/lounge-items.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

const PLAIN = Date.UTC(2026, 9, 7, 3); // 2026-10-07 12:00 KST, nobody's birthday
const GANGJAE = Date.UTC(2027, 9, 6, 3); // 강재's birthday
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
  s.give = (m, item, n) => {
    const x = ((life.ext ??= {})[m.id] ??= {});
    x.inv = { ...x.inv, [item]: n };
  };
  return s;
}
const set = (likes, dislikes = [], note) => ({ kind: 'setTastes', likes, dislikes, ...(note === undefined ? {} : { note }) });

test('setTastes is a life action (the cloud engine routes it)', () => {
  assert.ok(PLUS_ACTION_KINDS.includes('setTastes'));
  assert.ok(giftCatalog().has('carrot') && giftCatalog().has('fruit') && giftCatalog().has('crucian'));
  assert.ok(!giftCatalog().has('hay'), 'tools are not gifts');
});

test('unset friends read as the placeholder table, marked as not chosen', () => {
  const s = world();
  const v = s.act(s.members[0], { kind: 'status', text: '' }, PLAIN);
  for (let a = 0; a < 7; a++) {
    assert.equal(v.tastes.all[a].set, false);
    assert.deepEqual(v.tastes.all[a].l, FRIEND_PROFILES[a].likes.map((c) => `#${c}`));
    assert.deepEqual(v.tastes.all[a].d, FRIEND_PROFILES[a].dislikes.map((c) => `#${c}`));
  }
  assert.equal(v.tastes.nextAt, 0);
});

test('a friend saves tastes: open to everyone, a first-time news line, once per KST day', () => {
  const s = world();
  const [a, b] = s.members;
  let v = s.act(a, set(['crucian', '#dish', 'strawberry'], ['#bug', 'mugwort'], '  달달한 거면 다 좋아요  '), PLAIN);
  assert.deepEqual(v.tastes.all[0], { l: ['crucian', '#dish', 'strawberry'], d: ['#bug', 'mugwort'], n: '달달한 거면 다 좋아요', set: true });
  assert.equal(v.tastes.nextAt, nextKstMidnight(PLAIN));
  assert.ok(s.life.news.at(-1).lines.some((l) => l.kind === 'tastes' && l.text === '도원이 취향을 정했어요'));
  // Others see it too, and their own window is free to change.
  const vb = s.act(b, { kind: 'status', text: '' }, PLAIN);
  assert.deepEqual(vb.tastes.all[0].l, ['crucian', '#dish', 'strawberry']);
  assert.equal(vb.tastes.nextAt, 0);
  // Same KST day: no.
  s.fails(a, set(['#fish']), /하루에 한 번/, PLAIN + 3_600_000);
  // Next day: yes, and no second news line.
  v = s.act(a, set(['#fish']), PLAIN + DAY);
  assert.deepEqual(v.tastes.all[0], { l: ['#fish'], d: [], set: true });
  assert.equal(s.life.news.flatMap((d) => d.lines).filter((l) => l.kind === 'tastes').length, 1);
  // It survives a save round trip.
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(s.life))).tastes, s.life.tastes);
});

test('the server checks ids, counts, overlaps and the note', () => {
  const s = world();
  const a = s.members[0];
  s.fails(a, set(['#fish', '#bug', '#dish', '#crop']), /3개까지/, PLAIN);
  s.fails(a, set(['#fish'], ['#bug', '#dish', '#crop']), /2개까지/, PLAIN);
  s.fails(a, set(['#rocks']), /고를 수 없는/, PLAIN);
  s.fails(a, set(['hay']), /고를 수 없는/, PLAIN); // a tool
  s.fails(a, set(['nope']), /고를 수 없는/, PLAIN);
  s.fails(a, set([42]), /고를 수 없는/, PLAIN);
  s.fails(a, set(['#fish', '#fish']), /두 번/, PLAIN);
  s.fails(a, set(['#fish', 'crucian'], ['crucian']), /같은 것/, PLAIN);
  s.fails(a, set([], ['#bug']), /하나 이상/, PLAIN);
  s.fails(a, { kind: 'setTastes', likes: '#fish', dislikes: [] }, /3개까지/, PLAIN);
  s.fails(a, set(['#fish'], [], 'ㅋ'.repeat(TASTE_NOTE_MAX + 1)), /길어요|글자/, PLAIN);
  s.fails(a, set(['#fish'], [], 'a‮b'), /./, PLAIN);
  // Nothing was saved by the failures, so a good one still goes through today.
  s.act(a, set(['#fish'], [], 'ㅋ'.repeat(TASTE_NOTE_MAX)), PLAIN);
});

test('read-time cleanup drops unknown picks, overlaps and other keys', () => {
  assert.equal(readTastes(null), undefined);
  assert.deepEqual(
    readTastes({ 0: { l: ['#fish', 'nope', '#fish', 'carrot', 'jam', 'crucian'], d: ['carrot', '#bug', '#dish'], n: 'x'.repeat(99), day: 5 }, 9: { l: ['#fish'] }, x: 1 }),
    { 0: { l: ['#fish', 'carrot', 'jam'], d: ['#bug'], n: 'x'.repeat(TASTE_NOTE_MAX), day: 5 } },
  );
  assert.equal(readTastes({ 1: { l: [], d: [] } }), undefined);
});

test('gift friendship follows saved tastes: item ×2, category ×2 / ×0.2, birthday ×3 on top', () => {
  assert.equal(tasteFor({ l: ['crucian'], d: ['#fish'] }, 'crucian'), 'love');
  assert.equal(tasteFor({ l: ['crucian'], d: ['#fish'] }, 'carp'), 'dislike');
  assert.equal(tasteFor({ l: ['#fish'], d: ['carp'] }, 'carp'), 'dislike'); // the item wins
  assert.equal(tasteFor({ l: ['#crop'], d: [] }, 'carrot'), 'like');
  assert.equal(tasteFor({ l: ['#fruit'], d: [] }, 'fruit'), 'like');
  assert.equal(tasteFor(tastesOf(undefined, 1), 'crucian'), 'like'); // placeholder: 강재 likes fish
  const points = (tastes, item, now = PLAIN) => {
    const s = world();
    const [a, b] = s.members;
    if (tastes) s.act(b, tastes, now - DAY);
    s.give(a, item, 1);
    s.act(a, { kind: 'mail', to: 1, text: '선물이야', gift: { kind: 'item', item, n: 1 } }, now);
    return bondPoints(s.life, 0, 1);
  };
  const neutral = points(set(['#dish']), 'crucian');
  assert.ok(neutral > 0);
  assert.equal(points(set(['crucian']), 'crucian'), neutral * 2);
  assert.equal(points(set(['#fish']), 'crucian'), neutral * 2);
  assert.ok(Math.abs(points(set(['#dish'], ['#fish']), 'crucian') - neutral * 0.2) <= 1);
  assert.equal(points(set(['crucian'], ['#fish']), 'crucian'), neutral * 2);
  // Unset: 강재's placeholder likes fish.
  assert.equal(points(null, 'crucian'), neutral * 2);
  // Birthday ×3 on top of a loved item.
  assert.equal(points(set(['crucian']), 'crucian', GANGJAE), neutral * 2 * 3);
});

test('daily requests ask for what a friend likes (their categories, or their items’ categories)', () => {
  const s = world();
  const b = s.members[1];
  const before = requestsFor(s.life, 0, 20_000);
  s.act(b, set(['crucian']), PLAIN);
  // Requests stay deterministic and valid either way.
  const after = requestsFor(s.life, 0, 20_000);
  assert.equal(before.length, after.length);
  const fromB = after.find((r) => r.from === 1);
  if (fromB) assert.ok(giftCatalog().get(fromB.item) === 'fish' || fromB.item === 'carrot', fromB.item);
});

test('cloud engine: setTastes goes through the life action path', async () => {
  const T0 = PLAIN;
  const p = { id: crypto.randomUUID(), actor: 2, username: ACCOUNT_IDS[2], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' };
  let state = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const run = async (op, extra = {}) => {
    const c = {
      op,
      connection: p.connection,
      code: p.code,
      ...(op !== 'read' ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}),
      ...(op === 'open' ? { epoch: p.epoch } : {}),
      ...extra,
    };
    const r = cloudTransition(state, p, c, await commandHash(c), T0);
    state = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    return r.response;
  };
  await run('open');
  const ok = await run('action', { action: set(['#flower', 'strawberry'], ['#material'], '꽃이 좋아요') });
  assert.equal(ok.ok, true, ok.error);
  const lives = JSON.stringify(state);
  assert.ok(lives.includes('"tastes":{"2":{"l":["#flower","strawberry"],"d":["#material"],"n":"꽃이 좋아요"'), 'saved in the shared world');
  const again = await run('action', { action: set(['#fish']) });
  assert.equal(again.ok, false);
  assert.match(again.error, /하루에 한 번/);
});
