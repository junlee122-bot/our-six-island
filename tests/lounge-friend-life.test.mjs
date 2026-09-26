// Friend-life features (design audit C-3..C-7, C-10): NPC dialog selection,
// small talk and friends' own lines, heart rewards (idempotent, ledger-safe),
// bond decay, museum co-donation and shared milestones, participatory
// festivals, the calendar drift fix and the 마을 적응하기 checklist.
import test from 'node:test';
import assert from 'node:assert/strict';
import { kstDate, seasonOfDay, cycleSeasonOfDay, weatherOf, calendarOf, SEASONS } from '../app/lounge-calendar.ts';
import { DISH_BY_ID, FURNITURE_BY_REF, ITEM_BY_ID } from '../app/lounge-items.ts';
import { LifeError, emptyLife, ensureLifeMember, isLifeAction, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { BOND_LEVELS, BOND_POINTS, PLUS_REJECT, bondLevel, recordVisit } from '../app/lounge-life-plus.ts';
import { SOCIAL_REJECT, decayedBond, readSocial, tomorrowLines } from '../app/lounge-life-social.ts';
import {
  ADAPT_DONE_FURNITURE,
  ADAPT_STEPS,
  BOND_DECAY_FLOOR,
  CO_DONATION_GRANT,
  FETES,
  FRIEND_GIFTS,
  HEART_REWARD_LEVELS,
  MUSEUM_MILESTONES,
  MY_LINES_MAX,
  MY_LINE_TEXT_MAX,
  RECIPE_GIFT_N,
  SOCIAL_ACTION_KINDS,
  SONGPYEON_ROUNDS,
  SONGPYEON_ROUND_MS,
  TALK_POINTS,
  feteOn,
  nextFete,
  songpyeonRound,
} from '../app/lounge-social-defs.ts';
import { FRIEND_LINES } from '../app/lounge-friend-lines.ts';
import { casual, friendDialog } from '../app/lounge-friend-dialog.ts';
import { INITIAL_BEOM, kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';

const uuid = () => crypto.randomUUID();
const MIN = 60_000,
  HOUR = 3_600_000,
  DAY = 86_400_000;
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
const T0 = kst(2026, 9, 24); // 추석 day 1 (autumn), Thursday noon
const dayOf = (y, m, d) => kstDay(kst(y, m, d));

function world(n = 2) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
  }
  const s = { members, ledger, life };
  s.act = (m, action, now) => {
    const r = lifeAction(s.life, s.ledger, m, action, now);
    s.life = r.life;
    s.ledger = r.ledger;
    invariant(s.ledger);
    return r;
  };
  s.fails = (m, action, now, message) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || e.message === message),
    );
  s.balance = (m) => s.ledger.accounts['wallet-' + m.id];
  s.view = (m, now) => lifeView(s.life, m.id, m.actor, now);
  s.give = (m, item, n) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + n;
  };
  s.furn = (m) => s.life.ext?.[m.id]?.furn ?? {};
  return s;
}
function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  const reserved = Object.values(ledger.games)
    .filter((g) => g.state === 'reserved')
    .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
  assert.equal(balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0), Object.keys(ledger.accounts).length * INITIAL_BEOM);
}
const baseCtx = (over = {}) => ({
  friend: 1,
  me: 0,
  day: 20_720,
  visit: 1,
  timeOfDay: 'day',
  season: 'spring',
  weather: 'sunny',
  hearts: 0,
  doing: null,
  holding: null,
  news: [],
  birthdayFriend: false,
  birthdayMe: false,
  fete: null,
  holiday: null,
  custom: [],
  talked: false,
  request: false,
  ...over,
});

// ------------------------------------------------------------ lines data
test('friend lines: every friend has every situation, placeholders are known, no emoji, short lines', () => {
  assert.equal(FRIEND_LINES.length, 7);
  const EMOJI = /\p{Extended_Pictographic}/u;
  const known = /\{(me|name|season|item|friend|news|holiday)\}/g;
  for (const [actor, set] of FRIEND_LINES.entries()) {
    const all = [
      ...Object.values(set.greet).flat(),
      ...Object.values(set.weather).flat(),
      ...Object.values(set.season).flat(),
      ...Object.values(set.doing).flat(),
      ...set.gossip,
      ...Object.values(set.hearts).flat(),
      ...set.birthday.theirs,
      ...set.birthday.yours,
      ...set.festival.chuseok,
      ...set.festival.blossom,
      ...set.festival.holiday,
      ...set.request,
      ...set.smallTalk.flatMap((t) => [t.q, ...t.choices.flat()]),
    ];
    for (const tod of ['dawn', 'day', 'evening', 'night']) assert.ok(set.greet[tod].length, `${actor} greet ${tod}`);
    for (const season of SEASONS) assert.ok(set.season[season].length, `${actor} season ${season}`);
    for (const tier of [2, 4, 6, 8, 10]) assert.ok(set.hearts[tier].length, `${actor} hearts ${tier}`);
    assert.ok(set.smallTalk.length >= 2 && set.smallTalk.every((t) => t.choices.length >= 2));
    assert.ok(set.gossip.every((l) => l.includes('{news}')), 'gossip carries the news');
    for (const line of all) {
      assert.ok(!EMOJI.test(line), `emoji in ${line}`);
      assert.ok(line.length <= 60, `too long: ${line}`);
      assert.equal(line.replace(known, '').includes('{'), false, `unknown placeholder: ${line}`);
    }
    assert.ok(set.title && set.archetype.includes('자리 채움'));
  }
});

// ------------------------------------------------------------ dialog selection
test('dialog: deterministic, filled, greets by priority and offers small talk', () => {
  const a = friendDialog(baseCtx());
  assert.deepEqual(friendDialog(baseCtx()), a, 'same context → same dialog');
  assert.ok(a.pages.length >= 2);
  assert.ok(a.pages.every((p) => !p.includes('{')));
  assert.ok(a.sources[0].startsWith('greet-') || a.sources[0].startsWith('weather-'));
  assert.ok(a.question, 'small talk question');
  assert.deepEqual(a.choices.map((c) => c.kind).slice(-1), ['bye']);
  assert.ok(a.choices.filter((c) => c.kind === 'talk').length >= 2);
  // Priority: the friend's birthday, then mine, then festivals, then holidays.
  assert.equal(friendDialog(baseCtx({ birthdayFriend: true, birthdayMe: true, fete: 'chuseok' })).sources[0], 'birthday-theirs');
  assert.equal(friendDialog(baseCtx({ birthdayMe: true, fete: 'chuseok' })).sources[0], 'birthday-yours');
  assert.equal(friendDialog(baseCtx({ fete: 'blossom', holiday: '추석' })).sources[0], 'festival-blossom');
  assert.equal(friendDialog(baseCtx({ holiday: '한글날' })).sources[0], 'holiday');
  assert.equal(friendDialog(baseCtx({ weather: 'storm' })).sources[0], 'weather-storm');
  // Small talk once a day: no talk choices after it; a request adds its choice.
  const talked = friendDialog(baseCtx({ talked: true, request: true }));
  assert.equal(talked.question, null);
  assert.deepEqual(talked.choices.map((c) => c.kind), ['request', 'bye']);
  assert.ok(talked.sources.includes('request'));
});

test('dialog: custom lines, doing / holding, gossip about someone else, hearts', () => {
  const days = Array.from({ length: 40 }, (_, i) => 20_700 + i);
  // A friend's own lines show up often (and never with placeholders unfilled).
  const custom = days.map((day) => friendDialog(baseCtx({ day, custom: ['내가 쓴 대사야'] })));
  assert.ok(custom.filter((d) => d.pages.includes('내가 쓴 대사야')).length >= 20);
  // Reactions to what I'm doing.
  const fish = days.map((day) => friendDialog(baseCtx({ day, doing: 'fish' })));
  assert.ok(fish.every((d) => d.sources.includes('doing-fish')));
  const hold = days.map((day) => friendDialog(baseCtx({ day, holding: '붕어' })));
  assert.ok(hold.some((d) => d.pages.some((p) => p.includes('붕어'))));
  // Gossip only about a third friend, in casual speech.
  const news = [
    { text: '승준이 민서의 밭에 물을 줬어요', actors: [3, 2] },
    { text: '도원이 강재의 방에 놀러 갔어요', actors: [0, 1] },
  ];
  const gossip = days.map((day) => friendDialog(baseCtx({ day, news }))).filter((d) => d.sources.includes('gossip'));
  assert.ok(gossip.length > 0);
  for (const d of gossip) {
    const line = d.pages[d.sources.indexOf('gossip')];
    assert.match(line, /승준이 민서의 밭에 물을 줬어/);
    assert.doesNotMatch(line, /줬어요/);
  }
  assert.equal(casual('도원이 강재의 밭에 물을 줬어요'), '도원이 강재의 밭에 물을 줬어');
  // ♥6+: a special heart page; ♥10 always.
  const special = friendDialog(baseCtx({ hearts: 10 }));
  assert.ok(special.sources.includes('hearts-10'));
  assert.ok(friendDialog(baseCtx({ hearts: 6, visit: 2 })).sources.includes('hearts-6'));
  assert.ok(!friendDialog(baseCtx({ hearts: 3 })).sources.some((s) => /hearts-(6|8|10)/.test(s)));
  // Every friend, every time of day and season: at least two filled pages.
  for (let f = 0; f < 7; f++)
    for (const timeOfDay of ['dawn', 'day', 'evening', 'night'])
      for (const season of SEASONS) {
        const d = friendDialog(baseCtx({ friend: f, me: (f + 1) % 7, timeOfDay, season, hearts: 7 }));
        assert.ok(d.pages.length >= 2 && d.pages.every((p) => p && !p.includes('{')), `${f} ${timeOfDay} ${season}`);
      }
});

// ------------------------------------------------------------ small talk & my lines
test('npcTalk: small talk adds friendship once per friend per day', () => {
  const s = world(2),
    [a] = s.members;
  assert.ok(SOCIAL_ACTION_KINDS.every((kind) => isLifeAction({ kind })));
  s.act(a, { kind: 'npcTalk', to: 3 }, T0);
  s.act(a, { kind: 'npcTalk', to: 3 }, T0 + MIN);
  const v = s.view(a, T0 + MIN);
  assert.equal(v.me.bonds.find((b) => b.actor === 3).points, TALK_POINTS);
  assert.deepEqual(v.social.talked, [3]);
  s.act(a, { kind: 'npcTalk', to: 3 }, T0 + DAY);
  assert.equal(s.view(a, T0 + DAY).me.bonds.find((b) => b.actor === 3).points, TALK_POINTS * 2);
  s.fails(a, { kind: 'npcTalk', to: 0 }, T0, SOCIAL_REJECT.friend);
  s.fails(a, { kind: 'npcTalk', to: 9 }, T0, SOCIAL_REJECT.friend);
});

test('myLines: up to 10 sanitized lines per friend, visible to everyone, rate limited', () => {
  const s = world(2),
    [a, b] = s.members;
  s.act(a, { kind: 'myLines', lines: ['  오늘 밭에   물 줬어? ', '', '낚시 가자!'] }, T0);
  assert.deepEqual(s.view(b, T0).social.lines[0], ['오늘 밭에 물 줬어?', '낚시 가자!']);
  s.fails(a, { kind: 'myLines', lines: ['또'] }, T0 + 1_000, SOCIAL_REJECT.textRate);
  s.fails(a, { kind: 'myLines', lines: Array(MY_LINES_MAX + 1).fill('줄') }, T0 + 10_000, SOCIAL_REJECT.lines);
  s.fails(a, { kind: 'myLines', lines: ['가'.repeat(MY_LINE_TEXT_MAX + 1)] }, T0 + 10_000, SOCIAL_REJECT.lines);
  s.fails(a, { kind: 'myLines', lines: ['몰래‮숨김'] }, T0 + 10_000, SOCIAL_REJECT.text);
  s.fails(a, { kind: 'myLines', lines: [42] }, T0 + 10_000, SOCIAL_REJECT.text);
  s.act(a, { kind: 'myLines', lines: [] }, T0 + 10_000);
  assert.equal(s.view(b, T0).social.lines[0], undefined);
  assert.equal(s.life.social?.lines, undefined, 'cleared lines leave no key');
  // Stored text is bounded when read back from a hostile world.
  const back = readSocial({ lines: { 0: Array(30).fill('가'.repeat(99)), 9: ['x'], 1: 'nope' } });
  assert.equal(back.lines[0].length, MY_LINES_MAX);
  assert.ok(back.lines[0].every((l) => l.length === MY_LINE_TEXT_MAX));
  assert.deepEqual(Object.keys(back.lines), ['0']);
});

// ------------------------------------------------------------ hearts
test('hearts: slower late curve, rewards at 2/4/6/8/10 by mail and furniture, idempotent', () => {
  assert.ok(BOND_LEVELS.every((n, i) => i === 0 || n > BOND_LEVELS[i - 1]));
  assert.ok(BOND_LEVELS[9] >= 4_000, '♥10 takes much longer than the old 2,000');
  for (const g of FRIEND_GIFTS) {
    assert.ok(DISH_BY_ID[g.dish], g.dish);
    for (const ref of [g.furniture, g.room, g.signature]) assert.ok(FURNITURE_BY_REF[ref], ref);
  }
  const s = world(2),
    [a, b] = s.members;
  const ledgerBefore = JSON.stringify(s.ledger);
  // Just below ♥2, then one visit crosses it.
  s.life.bonds = { '0-1': BOND_LEVELS[1] - 1 };
  s.life = recordVisit(s.life, a, 1, T0);
  const mailA = s.life.mail[a.id] ?? [],
    mailB = s.life.mail[b.id] ?? [];
  assert.equal(mailA.length, 1, 'one letter each way');
  assert.equal(mailB.length, 1);
  assert.equal(mailA[0].actor, 1);
  assert.deepEqual(mailA[0].gift, { kind: 'item', item: FRIEND_GIFTS[1].dish, n: RECIPE_GIFT_N });
  assert.equal(s.life.ext[a.id].inv[FRIEND_GIFTS[1].dish], RECIPE_GIFT_N);
  assert.equal(s.life.ext[b.id].inv[FRIEND_GIFTS[0].dish], RECIPE_GIFT_N);
  assert.equal(JSON.stringify(s.ledger), ledgerBefore, 'heart rewards never touch the ledger');
  // More points on the same level: nothing more.
  s.life = recordVisit(s.life, a, 1, T0 + DAY);
  assert.equal(s.life.mail[a.id].length, 1);
  // A retroactive jump to ♥10 (an older world): one letter with everything.
  s.life.bonds['0-1'] = BOND_LEVELS[9] + 10;
  s.act(a, { kind: 'status', text: '' }, T0 + 2 * DAY);
  const letters = s.life.mail[a.id];
  assert.equal(letters.length, 2);
  assert.match(letters[1].text, /♥10/);
  const g = FRIEND_GIFTS[1];
  for (const ref of [g.furniture, g.room, g.signature]) assert.equal(s.furn(a)[ref], 1, ref);
  assert.equal(s.life.social.hr['0>1'], 10);
  // Memories for ♥6 and ♥10 once per pair even after b catches up.
  s.act(b, { kind: 'status', text: '' }, T0 + 2 * DAY);
  const pairMemories = s.life.memories.filter((m) => m.kind === 'bond' && /♥(6|10)\)/.test(m.text));
  assert.equal(pairMemories.length, 2);
  assert.equal(s.life.social.hr['1>0'], 10);
  // Replays change nothing (idempotent).
  const snapshot = JSON.stringify(s.life);
  s.act(a, { kind: 'status', text: '' }, T0 + 2 * DAY + 10_000);
  s.act(b, { kind: 'status', text: '' }, T0 + 2 * DAY + 10_000);
  const again = JSON.parse(JSON.stringify(s.life));
  delete again.lastText;
  const before = JSON.parse(snapshot);
  delete before.lastText;
  assert.deepEqual(again, before);
  // Title from ♥10.
  const v = s.view(a, T0 + 2 * DAY);
  assert.deepEqual(v.social.titles, [FRIEND_LINES[1].title]);
  assert.equal(v.social.hearts[1].granted, 10);
  assert.equal(HEART_REWARD_LEVELS.length, 5);
});

test('hearts: a friend who never joined gives nothing until their pair exists; no uid → no rewards', () => {
  const s = world(1),
    [a] = s.members;
  s.life.bonds = { '0-5': BOND_LEVELS[3] };
  s.act(a, { kind: 'status', text: '' }, T0);
  // Actor 5 has no uid: the letter comes "from" them with my uid as the sender id.
  assert.equal(s.life.mail[a.id].length, 1);
  assert.equal(s.life.mail[a.id][0].actor, 5);
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(s.life))).mail[a.id], s.life.mail[a.id]);
});

test('hearts: points above ♥5 fade slowly after 3 idle days, never below the floor', () => {
  assert.equal(decayedBond(1_000, undefined, 100), 1_000, 'untracked pairs never fade');
  assert.equal(decayedBond(1_000, 100, 103), 1_000, 'grace period');
  assert.equal(decayedBond(1_000, 100, 104), BOND_DECAY_FLOOR + Math.floor(600 * 0.99));
  assert.equal(decayedBond(BOND_DECAY_FLOOR - 5, 0, 500), BOND_DECAY_FLOOR - 5);
  assert.ok(decayedBond(4_000, 0, 1_000) >= BOND_DECAY_FLOOR);
  const s = world(2),
    [a] = s.members;
  s.life.bonds = { '0-1': BOND_LEVELS[6] + 100 };
  s.act(a, { kind: 'npcTalk', to: 1 }, T0);
  const day0 = s.view(a, T0).me.bonds.find((b) => b.actor === 1).points;
  const later = s.view(a, T0 + 13 * DAY);
  const faded = later.me.bonds.find((b) => b.actor === 1).points;
  assert.ok(faded < day0 && faded > BOND_DECAY_FLOOR);
  assert.equal(later.social.hearts[1].fading, true);
  assert.equal(later.social.hearts[1].idle, 13);
  // Talking again settles the decay and adds on top.
  s.act(a, { kind: 'npcTalk', to: 1 }, T0 + 13 * DAY);
  assert.equal(s.life.bonds['0-1'], faded + TALK_POINTS);
  assert.equal(s.view(a, T0 + 13 * DAY).social.hearts[1].fading, false);
  assert.equal(bondLevel(BOND_LEVELS[9]), 10);
});

// ------------------------------------------------------------ museum
test('museum: everyone stamps each item once, first donor keeps the honor, shared milestones reward all', () => {
  const s = world(3),
    [a, b, c] = s.members;
  const ids = Object.keys(ITEM_BY_ID).filter((id) => ITEM_BY_ID[id].museum);
  assert.ok(ids.length >= MUSEUM_MILESTONES[1].n);
  for (const id of ids.slice(0, 10)) s.give(a, id, 1);
  s.give(b, ids[0], 1);
  s.give(c, ids[1], 1);
  // b donates first; a is not first on ids[0] then.
  s.act(b, { kind: 'donate', item: ids[0] }, T0);
  const aBefore = s.balance(a);
  s.act(a, { kind: 'donate', item: ids[0] }, T0);
  assert.equal(s.balance(a) - aBefore, CO_DONATION_GRANT + 500, 'co-donation + first donate achievement');
  s.fails(a, { kind: 'donate', item: ids[0] }, T0, PLUS_REJECT.donated);
  assert.deepEqual(s.life.museum[ids[0]].actor, 1);
  for (const id of ids.slice(1, 9)) s.act(a, { kind: 'donate', item: id }, T0);
  assert.equal(Object.keys(s.life.museum).length, 9);
  const m = MUSEUM_MILESTONES[0];
  const before = { a: s.balance(a), b: s.balance(b), c: s.balance(c) };
  // The 10th distinct item reaches the first milestone: a and b (contributors) get it, c not yet.
  s.act(a, { kind: 'donate', item: ids[9] }, T0);
  assert.ok(s.balance(a) - before.a >= m.beom);
  assert.equal(s.balance(b) - before.b, m.beom);
  assert.equal(s.balance(c), before.c);
  assert.equal(s.life.ext[b.id].inv[m.item[0]], m.item[1]);
  assert.ok(s.life.memories.some((mem) => mem.kind === 'museum'));
  // c contributes later (a co-donation) and gets the milestone then, once.
  const cBefore = s.balance(c);
  s.act(c, { kind: 'donate', item: ids[1] }, T0 + MIN);
  assert.equal(s.balance(c) - cBefore, CO_DONATION_GRANT + 500 + m.beom);
  const cAgain = s.balance(c);
  s.act(c, { kind: 'status', text: '' }, T0 + 2 * MIN);
  assert.equal(s.balance(c), cAgain, 'milestone given once');
  // View: donors per item and per-friend stats.
  const v = s.view(c, T0 + 2 * MIN).social.museum;
  assert.deepEqual(v.donors[ids[0]], [1, 0]);
  assert.deepEqual(v.donors[ids[1]], [0, 2]);
  assert.equal(v.count, 10);
  assert.deepEqual(
    v.stats.filter((r) => r.total).map((r) => [r.actor, r.first, r.total]),
    [
      [0, 9, 10],
      [1, 1, 1],
      [2, 0, 1],
    ],
  );
  assert.equal(v.milestones[0].reached, true);
  assert.deepEqual(v.mine, [ids[1]]);
});

// ------------------------------------------------------------ calendar
test('calendar: 설날 is always winter and 추석 always autumn (drift fix); other days follow the cycle', () => {
  const cases = [
    [2026, 9, 25, 'autumn'],
    [2027, 2, 7, 'winter'],
    [2027, 9, 15, 'autumn'],
    [2028, 1, 27, 'winter'],
    [2028, 10, 3, 'autumn'],
  ];
  for (const [y, m, d, season] of cases) assert.equal(seasonOfDay(dayOf(y, m, d)), season, `${y}-${m}-${d}`);
  // Before the fix these two landed in the game's summer.
  assert.equal(cycleSeasonOfDay(dayOf(2027, 2, 7)), 'summer');
  assert.equal(cycleSeasonOfDay(dayOf(2027, 9, 15)), 'summer');
  // An ordinary day is untouched.
  const plain = dayOf(2026, 10, 20);
  assert.equal(seasonOfDay(plain), cycleSeasonOfDay(plain));
  assert.equal(weatherOf(dayOf(2027, 2, 7)), 'sunny');
  assert.match(calendarOf(kst(2027, 9, 15)).seasonNote, /추석/);
  assert.equal(calendarOf(kst(2026, 10, 20)).seasonNote, undefined);
});

// ------------------------------------------------------------ festivals
test('festivals: 추석 on its three days, 꽃놀이 on the last two days of each game spring', () => {
  const ch = feteOn(dayOf(2026, 9, 25));
  assert.deepEqual(ch, { kind: 'chuseok', id: 'chuseok-2026', start: dayOf(2026, 9, 24), end: dayOf(2026, 9, 26) });
  assert.equal(feteOn(dayOf(2027, 9, 16)).id, 'chuseok-2027');
  let blossom = 0;
  for (let d = dayOf(2026, 9, 7); d < dayOf(2026, 9, 7) + 28; d++) {
    const f = feteOn(d);
    if (f?.kind === 'blossom') {
      blossom++;
      assert.equal(cycleSeasonOfDay(d), 'spring');
      assert.equal(kstDate(f.start) <= kstDate(d) && d <= f.end, true);
    }
  }
  assert.equal(blossom, 2, 'two days per 28-day game year');
  const next = nextFete(dayOf(2026, 9, 27));
  assert.ok(next && next.start > dayOf(2026, 9, 27));
});

test('festival 추석: 송편 빚기 scored on the server, tries capped, lanterns after dark, rewards once, results settle', () => {
  const s = world(3),
    [a, b, c] = s.members;
  const beomA = s.balance(a);
  s.fails(a, { kind: 'fete', op: 'photo' }, T0, SOCIAL_REJECT.feteKind);
  s.fails(a, { kind: 'fete', op: 'finish', token: 'x', marks: [0, 0, 0, 0, 0] }, T0, SOCIAL_REJECT.token);
  s.act(a, { kind: 'fete', op: 'start' }, T0);
  const token = s.view(a, T0).social.fete.play.token;
  assert.ok(token);
  const perfect = Array(SONGPYEON_ROUNDS).fill(0);
  s.fails(a, { kind: 'fete', op: 'finish', token, marks: perfect }, T0 + 1_000, SOCIAL_REJECT.tooFast);
  s.fails(a, { kind: 'fete', op: 'finish', token, marks: [0, 0] }, T0 + 10_000, SOCIAL_REJECT.marks);
  s.fails(a, { kind: 'fete', op: 'finish', token, marks: [0, 0, 0, 0, 9_999] }, T0 + 10_000, SOCIAL_REJECT.marks);
  s.act(a, { kind: 'fete', op: 'finish', token, marks: [0, 40, 80, 120, 800] }, T0 + SONGPYEON_ROUNDS * SONGPYEON_ROUND_MS);
  const expected = [0, 40, 80, 120, 800].reduce((sum, m) => sum + songpyeonRound(m), 0);
  let v = s.view(a, T0 + MIN).social.fete;
  assert.deepEqual(v.board, [{ actor: 0, score: expected }]);
  assert.equal(v.joined, true);
  assert.equal(v.triesLeft, FETES.chuseok.tries - 1);
  // Participation reward: 범 via the ledger, furniture, 송편.
  assert.equal(s.balance(a) - beomA, FETES.chuseok.joinBeom);
  assert.equal(s.furn(a)[FETES.chuseok.joinFurniture], 1);
  assert.equal(s.life.ext[a.id].inv.songpyeon, 2);
  // Replaying the same token fails; the reward is not given twice.
  s.fails(a, { kind: 'fete', op: 'finish', token, marks: perfect }, T0 + MIN, SOCIAL_REJECT.token);
  // b plays perfectly and wins.
  s.act(b, { kind: 'fete', op: 'start' }, T0);
  const tb = s.view(b, T0).social.fete.play.token;
  s.act(b, { kind: 'fete', op: 'finish', token: tb, marks: perfect }, T0 + 8_000);
  // Tries are capped.
  for (let i = 1; i < FETES.chuseok.tries; i++) {
    s.act(a, { kind: 'fete', op: 'start' }, T0 + i * HOUR);
    const t = s.view(a, T0 + i * HOUR).social.fete.play.token;
    s.act(a, { kind: 'fete', op: 'finish', token: t, marks: [400, 400, 400, 400, 400] }, T0 + i * HOUR + 8_000);
  }
  s.fails(a, { kind: 'fete', op: 'start' }, T0 + 9 * HOUR, SOCIAL_REJECT.tries);
  assert.equal(s.view(a, T0 + 9 * HOUR).social.fete.board[0].actor, 1);
  // Lanterns: only after dark, one each, text checked.
  s.fails(c, { kind: 'fete', op: 'lantern', text: '소원' }, T0, SOCIAL_REJECT.night);
  const night = kst(2026, 9, 25, 21);
  s.fails(c, { kind: 'fete', op: 'lantern', text: '‮' }, night, SOCIAL_REJECT.text);
  s.act(c, { kind: 'fete', op: 'lantern', text: '  모두 건강하게  ' }, night);
  s.fails(c, { kind: 'fete', op: 'lantern', text: '하나 더' }, night + 10_000, SOCIAL_REJECT.lanternDone);
  v = s.view(c, night).social.fete;
  assert.deepEqual(v.lanterns, [{ actor: 2, text: '모두 건강하게' }]);
  assert.equal(v.joined, true, 'a lantern also counts as taking part');
  // After the last day any action settles the results once.
  const after = kst(2026, 9, 27, 10);
  s.act(c, { kind: 'status', text: '' }, after);
  assert.equal(s.life.social.fete.settled, true);
  assert.equal(s.furn(b)[FETES.chuseok.winnerFurniture], 1);
  assert.equal(s.furn(a)[FETES.chuseok.winnerFurniture], undefined);
  const festMem = s.life.memories.filter((m) => m.kind === 'festival');
  assert.equal(festMem.length, 2, 'podium + lanterns');
  assert.match(festMem[0].text, /1등 강재/);
  s.act(a, { kind: 'status', text: '' }, after + DAY);
  assert.equal(s.life.memories.filter((m) => m.kind === 'festival').length, 2, 'settled once');
  s.fails(a, { kind: 'fete', op: 'start' }, after, SOCIAL_REJECT.noFete);
  // The ended festival still shows its results for a few days.
  assert.equal(s.view(a, after).social.fete.active, false);
});

test('festival 꽃놀이: flower crowns consume flowers and score, group photo once, a new festival replaces the old', () => {
  // Find the next 꽃놀이 after 추석 2026.
  const slot = nextFete(dayOf(2026, 9, 27));
  assert.equal(slot.kind, 'blossom');
  const at = Date.UTC(1970, 0, 1) + slot.start * DAY + 3 * HOUR; // 12:00 KST
  const s = world(2),
    [a, b] = s.members;
  // An old unsettled 추석 is settled and replaced when the new festival starts.
  s.life.social = { fete: { id: 'chuseok-2026', kind: 'chuseok', start: dayOf(2026, 9, 24), end: dayOf(2026, 9, 26), best: { 1: { s: 300, at: 1 } } } };
  s.fails(a, { kind: 'fete', op: 'crown', items: ['azalea', 'azalea'] }, at, SOCIAL_REJECT.flowers);
  s.fails(a, { kind: 'fete', op: 'crown', items: ['azalea', 'crucian', 'azalea'] }, at, SOCIAL_REJECT.flowers);
  s.fails(a, { kind: 'fete', op: 'crown', items: ['azalea', 'azalea', 'wildflower'] }, at, SOCIAL_REJECT.noFlowers);
  s.give(a, 'azalea', 2);
  s.give(a, 'wildflower', 1);
  s.act(a, { kind: 'fete', op: 'crown', items: ['azalea', 'azalea', 'wildflower'] }, at);
  assert.equal(s.life.ext[a.id].inv?.azalea, undefined);
  const score = ITEM_BY_ID.azalea.sell * 2 + ITEM_BY_ID.wildflower.sell + 2 * 40;
  const v = s.view(a, at).social.fete;
  assert.equal(v.kind, 'blossom');
  assert.deepEqual(v.board, [{ actor: 0, score }]);
  assert.equal(s.furn(b)[FETES.chuseok.winnerFurniture], 1, 'old festival winner got the trophy on replacement');
  s.act(b, { kind: 'fete', op: 'photo' }, at);
  s.act(a, { kind: 'fete', op: 'photo' }, at);
  s.fails(a, { kind: 'fete', op: 'photo' }, at + MIN, SOCIAL_REJECT.photoDone);
  s.fails(a, { kind: 'fete', op: 'start' }, at, SOCIAL_REJECT.feteKind);
  assert.deepEqual(s.view(b, at).social.fete.photo, [1, 0]);
  assert.equal(s.furn(b)[FETES.blossom.joinFurniture], 1);
  // Settles into a photo memory after the festival.
  s.act(a, { kind: 'status', text: '' }, at + 3 * DAY);
  assert.ok(s.life.memories.some((m) => m.kind === 'festival' && /단체 사진/.test(m.text) && m.actors.join() === '0,1'));
});

test('festival state and social data read back bounded from a hostile world', () => {
  const back = readSocial({
    fete: {
      id: 'chuseok-2026',
      kind: 'chuseok',
      start: 5,
      end: 7,
      best: { 0: { s: 10, at: 1 }, 8: { s: 1, at: 1 }, 1: { s: -5, at: 1 } },
      lanterns: Array.from({ length: 30 }, (_, i) => ({ actor: i % 7, text: '소원'.repeat(40), at: 1 })),
      play: { 0: { token: 'BAD TOKEN', at: 1 } },
    },
    hr: { '0>1': 4, '0>0': 2, '1>2': 99 },
    bondAt: { '0-1': 5, '1-0': 3 },
    stamps: { 0: ['crucian', 'nope', 'crucian'], 7: ['carp'] },
    adapt: { 0: ['sell', 'bogus', 'sell'] },
    mm: { 0: 99 },
  });
  assert.deepEqual(Object.keys(back.fete.best), ['0']);
  assert.equal(back.fete.lanterns.length, 7);
  assert.ok(back.fete.lanterns.every((l) => l.text.length <= 24));
  assert.equal(back.fete.play, undefined);
  assert.deepEqual(back.hr, { '0>1': 4 });
  assert.deepEqual(back.bondAt, { '0-1': 5 });
  assert.deepEqual(back.stamps, { 0: ['crucian'] });
  assert.deepEqual(back.adapt, { 0: ['sell'] });
  assert.equal(back.mm[0], MUSEUM_MILESTONES.length);
  assert.equal(readSocial({ fete: { id: 'x', kind: 'nope' } }), undefined);
  // A world without social stays equal after read (no empty key appears).
  const s = world(1);
  s.act(s.members[0], { kind: 'status', text: '안녕' }, T0);
  assert.equal('social' in readLife(JSON.parse(JSON.stringify(s.life))), false);
});

// ------------------------------------------------------------ 마을 적응하기 & 내일 예고
test('adapt: server-checked sell/fish, client board/table, rewards once, all done → furniture', () => {
  const s = world(1),
    [a] = s.members;
  s.fails(a, { kind: 'adapt', step: 'sell' }, T0, SOCIAL_REJECT.stepNotYet);
  s.fails(a, { kind: 'adapt', step: 'fish' }, T0, SOCIAL_REJECT.stepNotYet);
  s.fails(a, { kind: 'adapt', step: 'nope' }, T0, SOCIAL_REJECT.step);
  const before = s.balance(a);
  s.act(a, { kind: 'adapt', step: 'board' }, T0);
  s.fails(a, { kind: 'adapt', step: 'board' }, T0, SOCIAL_REJECT.stepDone);
  s.life.bag[a.id].produce.carrot = 1;
  s.act(a, { kind: 'sell', crop: 'carrot', n: 1 }, T0);
  s.act(a, { kind: 'adapt', step: 'sell' }, T0);
  s.life.ext[a.id].stats.fish = 1;
  s.act(a, { kind: 'adapt', step: 'fish' }, T0);
  assert.equal(s.furn(a)[ADAPT_DONE_FURNITURE], undefined);
  s.act(a, { kind: 'adapt', step: 'table' }, T0);
  assert.equal(s.furn(a)[ADAPT_DONE_FURNITURE], 1);
  const rewards = ADAPT_STEPS.reduce((sum, st) => sum + st.reward, 0);
  assert.ok(s.balance(a) - before >= rewards);
  assert.deepEqual(s.view(a, T0).social.adapt.sort(), ['board', 'fish', 'sell', 'table']);
  assert.ok(s.life.memories.some((m) => m.kind === 'adapt'));
});

test('tomorrow lines: weather always, festival eve, season change and my ripe crops', () => {
  const s = world(1),
    [a] = s.members;
  // The day before 추석 2027 (a festival and a season pin start tomorrow).
  const eve = kst(2027, 9, 13, 20);
  s.life.farms[a.id][0] = { crop: 'strawberry', plantedAt: eve - 2 * HOUR, wateredAt: null };
  const lines = tomorrowLines(s.life, a.id, 0, eve);
  assert.ok(lines.length >= 2 && lines.length <= 4);
  assert.ok(lines.some((l) => l.includes('추석 한가위 잔치')));
  assert.ok(lines.some((l) => /날씨|소식/.test(l)) || lines.length === 4);
  assert.deepEqual(s.view(a, eve).social.tomorrow, lines);
  const plain = tomorrowLines(s.life, a.id, 0, kst(2026, 10, 20, 20));
  assert.ok(plain.some((l) => l.startsWith('내일 날씨') || l.includes('소식')));
  // Crops ready by tomorrow 9am.
  const s2 = world(1);
  const late = kst(2026, 10, 20, 22);
  s2.life.farms[s2.members[0].id][0] = { crop: 'strawberry', plantedAt: late - HOUR, wateredAt: null };
  assert.ok(tomorrowLines(s2.life, s2.members[0].id, 0, late).some((l) => l.includes('1칸')));
  void BOND_POINTS;
});

test('hearts: a world from the old curve migrates once, nobody loses visible hearts, rewards stay idempotent', () => {
  const s = world(3),
    [a, b, c] = s.members;
  // Old curve: 1,500 = ♥9, 700 = ♥6, 200 = ♥3, 20 = ♥0.
  s.life.bonds = { '0-1': 1_500, '0-2': 700, '1-2': 200, '1-3': 20 };
  const hearts = (m, f, now) => s.view(m, now).me.bonds.find((x) => x.actor === f).level;
  // Before any action the view already shows the old hearts.
  assert.equal(hearts(a, 1, T0), 9);
  assert.equal(hearts(a, 2, T0), 6);
  assert.equal(hearts(b, 2, T0), 3);
  s.act(c, { kind: 'status', text: '' }, T0);
  assert.equal(s.life.social.bm, 1);
  assert.deepEqual(s.life.bonds, { '0-1': BOND_LEVELS[8], '0-2': 700, '1-2': 200, '1-3': 20 }); // raised only where the new curve would show fewer hearts
  assert.equal(hearts(a, 1, T0), 9);
  assert.equal(hearts(a, 2, T0), 6);
  // Runs once: new points on the new curve are never raised again.
  s.life.bonds['1-3'] = 600; // old ♥6, new ♥5 — stays 600
  s.act(a, { kind: 'npcTalk', to: 3 }, T0 + MIN);
  assert.equal(s.life.bonds['1-3'], 600);
  assert.equal(readLife(JSON.parse(JSON.stringify(s.life))).social.bm, 1);
  // Rewards for the migrated levels arrive once.
  s.act(a, { kind: 'status', text: '' }, T0 + 10_000);
  s.act(a, { kind: 'status', text: '' }, T0 + 20_000);
  assert.equal(s.life.social.hr['0>1'], 8);
  assert.equal(s.life.mail[a.id].filter((m) => m.actor === 1).length, 1);
  // A migration that starts inside addBond (a visit) gives the same result.
  const t = world(2);
  t.life.bonds = { '0-1': 1_150 };
  t.life = recordVisit(t.life, t.members[0], 1, T0);
  assert.equal(t.life.bonds['0-1'], BOND_LEVELS[7] + BOND_POINTS.visit);
});

test('festival booth spots: walkable, clear of the fountain rim and the stage, reachable from every place', async () => {
  const { FETE_PLAZA, FETE_STAGE, FOUNTAIN_REACH, fountainDistance } = await import('../app/lounge-village-spots.ts');
  const { villageCanWalk, villagePath, villageStep, VILLAGE_PLACES } = await import('../app/lounge-village-layout.ts');
  const { KARCHIVE_STAGE } = await import('../app/lounge-village-karchive-layout.ts');
  assert.ok(fountainDistance(FETE_PLAZA) > FOUNTAIN_REACH + 0.5, 'not on the fountain rim');
  assert.ok(Math.hypot(FETE_STAGE.x - KARCHIVE_STAGE.x, FETE_STAGE.z - KARCHIVE_STAGE.z) > KARCHIVE_STAGE.radius + 1);
  for (const spot of [FETE_PLAZA, FETE_STAGE]) {
    assert.ok(villageCanWalk(spot));
    for (const place of VILLAGE_PLACES) {
      // Click-to-walk: follow the planned route with the village's stepping.
      let p = { ...place.entry };
      const path = villagePath(p, spot);
      for (let f = 0; f < 3600 && path.length; f++) {
        let budget = 5.2 / 60;
        while (path.length && budget > 0) {
          const t = path[0], dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
          if (d < 0.06) { path.shift(); continue; }
          const s = Math.min(d, budget);
          p = villageStep(p, (dx / d) * s, (dz / d) * s);
          budget -= s;
        }
      }
      assert.ok(Math.hypot(p.x - spot.x, p.z - spot.z) < 0.3, `${place.id} → booth`);
    }
  }
});
