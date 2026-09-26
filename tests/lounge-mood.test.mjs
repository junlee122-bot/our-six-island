// 무드(기분) engine: needs, offline rules, moodlets, bounds, inspirations,
// care, snack/rest/drink/cheer, the XP multiplier, D-3 (no write on read),
// migration of older worlds and what friends may see.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVE_GAP_MS,
  DRINK_PRICE,
  HOUR,
  INSPIRATIONS,
  INSPIRATION_GAUGE,
  MIN,
  MOODLETS,
  MOODLETS_MAX,
  MOOD_FLOOR,
  MOOD_REJECT,
  NEED_INFO,
  NEGATIVE_CAP,
  NEGATIVE_MOODLETS,
  REST_COOLDOWN_MS,
  SNACKS_PER_DAY,
  moodWeekOf,
  tierOf,
} from '../app/lounge-mood-data.ts';
import {
  moodAfterCloud,
  moodBiteBoost,
  moodHarvestQuality,
  moodTarget,
  moodTouch,
  moodXpMult,
  readMood,
} from '../app/lounge-mood.ts';
import { gainXp, xpMultiplier } from '../app/lounge-growth.ts';
import { SOFT_CAP, OVER_CAP_RATE } from '../app/lounge-growth-data.ts';
import { LifeError, emptyLife, ensureLifeMember, lifeAction, lifeView, readLife, cloneLife } from '../app/lounge-life.ts';
import { INITIAL_BEOM, grantBeom, spendBeom, kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { sellTotal, sellUnit } from '../app/lounge-life-plus.ts';
import { cloudTransition, commandHash, CLOUD_LEASE_MS, SEEN_REFRESH_MS } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { weatherOf } from '../app/lounge-calendar.ts';

const DAY = 24 * HOUR;
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
// A cloudy weekday (no weather moodlets) in autumn: Thursday 2026-09-24 is checked below.
let T0 = kst(2026, 9, 24, 12);
for (let d = 0; d < 60 && weatherOf(kstDay(T0)) !== 'cloudy'; d++) T0 += DAY;
const uuid = () => crypto.randomUUID();

function world(n = 2, rich = 0) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    if (rich) ledger = grantBeom(ledger, 'wallet-' + m.id, rich, 'test-' + m.id, T0 - DAY, 'test');
    life = ensureLifeMember(life, m.id, m.actor);
  }
  const s = { members, ledger, life };
  s.act = (m, action, now) => {
    const r = lifeAction(s.life, s.ledger, m, action, now);
    s.life = r.life;
    s.ledger = r.ledger;
    validateLedger(s.ledger);
    return r;
  };
  s.fails = (m, action, now, message) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || e.message === message),
    );
  s.mood = (m) => s.life.mood?.[m.id];
  s.view = (m, now) => lifeView(s.life, m.id, m.actor, now).mood;
  s.touch = (m, now) => {
    s.life = cloneLife(s.life);
    return moodTouch(s.life, m.id, now);
  };
  s.give = (m, item, k) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + k;
  };
  return s;
}
const lets = (u, id) => (u.l ?? []).filter(([x]) => x === id).length;
const near = (a, b, eps = 0.25) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

test('the test day has no weather moodlets and is a weekday', () => {
  assert.equal(weatherOf(kstDay(T0)), 'cloudy');
});

// ------------------------------------------------------------ state and migration
test('migration: an older world without mood reads, shows a neutral view and starts on the first write', () => {
  const s = world(1);
  const [m] = s.members;
  const old = JSON.parse(JSON.stringify(s.life));
  delete old.mood;
  const life = readLife(old);
  assert.equal(life.mood, undefined, 'absent stays absent');
  const view = lifeView(life, m.id, m.actor, T0).mood;
  assert.equal(view.tier, 'ok');
  assert.ok(view.v >= 50 && view.v <= 60, `neutral start ${view.v}`);
  assert.equal(life.mood, undefined, 'a view never creates state');
  s.life = life;
  s.act(m, { kind: 'status', text: '안녕' }, T0);
  const u = s.mood(m);
  assert.equal(u.at, T0);
  assert.deepEqual(u.n, [70, 100, 60, 60]);
  assert.equal(Math.round(u.v), Math.round(moodTarget(u, T0)));
  // Round trip through JSON keeps it.
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(s.life))).mood, s.life.mood);
});

test('readMood: hostile values are bounded (ids, numbers, lists, users)', () => {
  const id = uuid();
  const junk = {
    [id]: {
      n: [500, -3, 'x', 50.123],
      at: T0,
      v: 3,
      l: [...Array.from({ length: 80 }, () => ['chat', T0 + HOUR]), ['nope', T0], ['inspired', T0 + HOUR], 'bad'],
      g: 99_999,
      i: { k: 'harvest', until: T0 + HOUR, left: 1000, at: T0 },
      tol: Object.fromEntries(Array.from({ length: 40 }, (_, i) => ['k' + String.fromCharCode(97 + (i % 26)) + i, 3])),
      ch: [1, 1, 2, 9, -1],
      pub: true,
      room: 50_000,
    },
    'not-a-uuid': { n: [1, 1, 1, 1], at: T0, v: 50 },
    [uuid()]: { at: 0 },
  };
  for (let i = 0; i < 30; i++) junk[uuid()] = { n: [50, 50, 50, 50], at: T0, v: 50 };
  const { mood } = readMood(junk);
  const u = mood[id];
  assert.deepEqual(u.n, [100, 0, 60, 50.1]);
  assert.equal(u.v, MOOD_FLOOR, 'the shown mood is never below 15');
  assert.equal(u.l.length, MOODLETS_MAX);
  assert.ok(u.l.every(([x]) => x in MOODLETS && x !== 'inspired'));
  assert.equal(u.g, INSPIRATION_GAUGE);
  assert.equal(u.i.left, 0, 'charges are bounded (out of range → 0)');
  assert.ok(Object.keys(u.tol ?? {}).length <= 16);
  assert.deepEqual(u.ch, [1, 2]);
  assert.equal(u.pub, undefined, 'only the literal 1 shares');
  assert.equal(u.room, undefined);
  assert.ok(Object.keys(mood).length <= 16);
  assert.ok(!('not-a-uuid' in mood));
  assert.ok(JSON.stringify(mood).length < 16 * 1200, 'bounded size');
});

test('size: seven busy friends stay around 5 KB', () => {
  const s = world(7);
  let t = T0;
  for (const m of s.members) {
    s.act(m, { kind: 'status', text: '' }, t);
    s.act(m, { kind: 'npcTalk', to: (m.actor + 1) % 7 }, (t += 1000));
    s.act(m, { kind: 'bedRest' }, (t += 1000));
    s.act(m, { kind: 'barDrink' }, (t += 1000));
  }
  const bytes = JSON.stringify(s.life.mood).length;
  assert.ok(bytes < 6000, `${bytes} bytes`);
});

// ------------------------------------------------------------ needs
test('needs drain only during active play; a long gap is offline (drift toward 60)', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  const u0 = structuredClone(s.mood(m));
  s.touch(m, T0 + 5 * MIN);
  const u1 = s.mood(m);
  near(u1.n[0], u0.n[0] - 5 * NEED_INFO.food.perMin);
  near(u1.n[1], u0.n[1] - 5 * NEED_INFO.rest.perMin);
  near(u1.n[2], u0.n[2] - 5 * NEED_INFO.fun.perMin);
  // Three hours later: only the first 10 minutes drain, the rest drifts to 60.
  const before = structuredClone(u1);
  s.touch(m, T0 + 5 * MIN + 3 * HOUR);
  const u2 = s.mood(m);
  const active = ACTIVE_GAP_MS / MIN,
    keep = 0.5 ** ((3 * HOUR - ACTIVE_GAP_MS) / (3 * HOUR));
  const food = before.n[0] - active * NEED_INFO.food.perMin;
  near(u2.n[0], 60 + (food - 60) * keep, 0.3);
  near(u2.n[1], before.n[1] - active * NEED_INFO.rest.perMin, 0.3);
});

test('offline drift: 20 rises and 90 falls toward 60 with a 3 h half-life', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  const u = s.mood(m);
  u.n = [20, 50, 90, 60];
  s.touch(m, T0 + ACTIVE_GAP_MS + 3 * HOUR);
  const after = s.mood(m).n;
  const drainedFood = 20 - (ACTIVE_GAP_MS / MIN) * NEED_INFO.food.perMin,
    drainedFun = 90 - (ACTIVE_GAP_MS / MIN) * NEED_INFO.fun.perMin;
  near(after[0], 60 + (drainedFood - 60) / 2, 0.3);
  near(after[2], 60 + (drainedFun - 60) / 2, 0.3);
  assert.ok(after[0] > 20 && after[2] < 90);
});

test('six hours away is sleep (휴식 100, 잘 잤어요); two days away is 돌아왔어요', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  s.mood(m).n[1] = 10;
  s.touch(m, T0 + 5 * HOUR);
  assert.ok(s.mood(m).n[1] < 10, 'five hours is not sleep');
  assert.equal(lets(s.mood(m), 'slept'), 0);
  s.touch(m, T0 + 5 * HOUR + ACTIVE_GAP_MS + 6 * HOUR);
  assert.equal(s.mood(m).n[1], 100);
  assert.equal(lets(s.mood(m), 'slept'), 1);
  s.touch(m, T0 + 4 * DAY);
  assert.equal(lets(s.mood(m), 'back'), 1);
  // Nobody comes back sad: the shown mood caught up with its (good) target.
  const v = s.view(m, T0 + 4 * DAY);
  assert.ok(v.v >= 55, `after a break ${v.v}`);
});

// ------------------------------------------------------------ moodlets
test('moodlets stack to their limit with ×0.5 each, refresh the oldest, and expire in real time', () => {
  const s = world(2);
  const [m] = s.members;
  for (let i = 0; i < 5; i++) s.act(m, { kind: 'npcTalk', to: 1 }, T0 + i * 1000);
  assert.equal(lets(s.mood(m), 'chat'), MOODLETS.chat.max);
  const chat = s.view(m, T0 + 5000).lets.find((l) => l.id === 'chat');
  assert.equal(chat.stacks, 3);
  assert.equal(chat.value, 2 * (1 + 0.5 + 0.25));
  assert.equal(s.view(m, T0 + MOODLETS.chat.ms + 5000).lets.find((l) => l.id === 'chat'), undefined, 'gone after 4 h');
});

test('negative thoughts and needs are capped at −15 together; the mood never goes below 15', () => {
  assert.deepEqual(NEGATIVE_MOODLETS.sort(), ['bang', 'bigLoss', 'miss', 'rain', 'storm']);
  const u = { n: [0, 0, 0, 0], at: T0, v: 50, l: [] };
  for (const id of ['bigLoss', 'bigLoss', 'bang', 'bang', 'rain', 'miss', 'storm']) u.l.push([id, T0 + HOUR]);
  assert.equal(moodTarget(u, T0), 45 + NEGATIVE_CAP);
  assert.ok(moodTarget(u, T0) >= MOOD_FLOOR);
  // Positive thoughts still count fully on top.
  u.l.push(['festival', T0 + HOUR]);
  assert.equal(moodTarget(u, T0), 45 + NEGATIVE_CAP + 10);
  // Worst world state through the engine: still ≥ 15, view says it is capped.
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  Object.assign(s.mood(m), structuredClone(u), { v: 15 });
  s.mood(m).l = s.mood(m).l.filter(([id]) => id !== 'festival');
  const view = s.view(m, T0 + MIN);
  assert.ok(view.v >= MOOD_FLOOR && view.capped);
});

test('festival and talk raise the target; the shown mood follows one point a minute', () => {
  const s = world(2);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  const start = s.mood(m).v;
  s.mood(m).l = [['festival', T0 + 12 * HOUR]];
  const target = moodTarget(s.mood(m), T0);
  assert.ok(target >= start + 9);
  s.touch(m, T0 + 3 * MIN);
  near(s.mood(m).v, start + 3, 0.2);
  s.touch(m, T0 + 13 * MIN);
  assert.ok(s.mood(m).v >= start + 9);
});

// ------------------------------------------------------------ XP multiplier
test('XP multiplier: +15% / +10% / ×1 / −10% by tier, before the soft cap (reached sooner, never raised)', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  const u = s.mood(m);
  for (const [v, mult] of [[90, 1.15], [70, 1.1], [50, 1], [25, 1], [17, 0.9]]) {
    u.v = v;
    assert.equal(moodXpMult(s.life, m.id, T0), mult, `mood ${v}`);
    assert.equal(xpMultiplier(s.life, m.id, 'fish', T0), mult);
    assert.equal(tierOf(v), ['great', 'good', 'ok', 'low', 'tired'][[90, 70, 50, 25, 17].indexOf(v)]);
  }
  const run = (v, gains) => {
    const t = world(1);
    const [p] = t.members;
    t.act(p, { kind: 'status', text: '' }, T0);
    t.mood(p).v = v;
    const got = gains.map((g) => gainXp(t.life, p.id, 'fish', g, T0));
    const g = t.life.growth.u[p.id];
    return { xp: g.xp.fish, dxp: g.dxp.fish, got };
  };
  // Under the cap: ×1.15 / ×0.9.
  const small = SOFT_CAP / 2;
  near(run(90, [small]).xp, small * 1.15, 0.11);
  near(run(50, [small]).xp, small, 0.11);
  near(run(17, [small]).xp, small * 0.9, 0.11);
  // Reaching the cap: everyone ends at the same cap; a good mood gets there with less play.
  const hi = run(90, [SOFT_CAP, SOFT_CAP]),
    mid = run(50, [SOFT_CAP, SOFT_CAP]);
  assert.ok(hi.dxp >= SOFT_CAP && mid.dxp >= SOFT_CAP);
  near(hi.xp - (hi.dxp - SOFT_CAP) * OVER_CAP_RATE, SOFT_CAP, 0.2);
  near(mid.xp - (mid.dxp - SOFT_CAP) * OVER_CAP_RATE, SOFT_CAP, 0.2);
  // Past the cap: capped XP gets no bonus (the same trickle at any mood).
  const after = (v) => run(v, [SOFT_CAP * 2, 50]).got[1];
  near(after(90), 50 * OVER_CAP_RATE, 0.11);
  near(after(50), 50 * OVER_CAP_RATE, 0.11);
  near(after(17), 50 * OVER_CAP_RATE, 0.11);
});

// ------------------------------------------------------------ inspirations
test('inspiration: gauge fills above 65, one a day, three a KST week, held one stops the gauge', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  const pump = (at) => {
    const u = s.mood(m);
    u.v = 95;
    u.n = [100, 100, 100, 100];
    u.l = [['festival', at + 12 * HOUR], ['birthdayCheer', at + 12 * HOUR]];
    u.at = at;
    for (let k = 1; k <= 4; k++) s.touch(m, at + k * 10 * MIN);
  };
  // Monday of the test week (KST).
  const day0 = kstDay(T0),
    monday = day0 - ((day0 + 3) % 7);
  const at = (d, h = 10) => (monday + d) * DAY - 9 * HOUR + h * HOUR;
  pump(at(0));
  const u = s.mood(m);
  assert.ok(u.i, 'got one');
  assert.equal(u.iw[1], 1);
  assert.ok(INSPIRATIONS[u.i.k]);
  // Holding it: the gauge waits, no second one the same day.
  pump(at(0, 14));
  assert.equal(s.mood(m).iw[1], 1);
  delete s.mood(m).i;
  pump(at(0, 18));
  assert.equal(s.mood(m).iw[1], 1, 'one a day');
  assert.equal(s.mood(m).g, INSPIRATION_GAUGE, 'full gauge waits');
  for (const d of [1, 2, 3, 4]) {
    delete s.mood(m).i;
    pump(at(d));
  }
  assert.equal(s.mood(m).iw[1], 3, 'three a week');
  assert.equal(s.mood(m).iw[0], moodWeekOf(monday));
  // Next Monday (KST) the week counter restarts.
  delete s.mood(m).i;
  pump(at(7));
  assert.deepEqual(s.mood(m).iw, [moodWeekOf(monday + 7), 1]);
  // A low mood never fills the gauge.
  const t = world(1);
  const [p] = t.members;
  t.act(p, { kind: 'status', text: '' }, T0);
  t.mood(p).v = 30;
  t.mood(p).n = [0, 0, 0, 0];
  t.touch(p, T0 + 10 * MIN);
  assert.equal(t.mood(p).g ?? 0, 0);
});

test('풍작 영감 lifts up to 12 plots one quality step (gold at most); 입질 영감 lasts 10 casts', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  s.mood(m).i = { k: 'harvest', at: T0, until: T0 + DAY, left: 12 };
  assert.equal(moodHarvestQuality(s.life, m.id, 0, T0), 1);
  assert.equal(moodHarvestQuality(s.life, m.id, 1, T0), 2);
  assert.equal(moodHarvestQuality(s.life, m.id, 2, T0), 2, 'gold stays gold');
  assert.equal(s.mood(m).i.left, 10, 'a gold plot uses no charge');
  s.mood(m).i.left = 1;
  moodHarvestQuality(s.life, m.id, 0, T0);
  assert.equal(moodHarvestQuality(s.life, m.id, 0, T0), 0, 'used up');
  s.mood(m).i = { k: 'bite', at: T0, until: T0 + DAY, left: 10 };
  const boosts = Array.from({ length: 11 }, () => moodBiteBoost(s.life, m.id, T0));
  assert.deepEqual(boosts[0], { rare: 2, window: 1.2 });
  assert.deepEqual(boosts[10], { rare: 1, window: 1 });
  // Expired: nothing.
  s.mood(m).i = { k: 'bite', at: T0, until: T0 + 10, left: 10 };
  assert.deepEqual(moodBiteBoost(s.life, m.id, T0 + 20), { rare: 1, window: 1 });
});

test('풍작 영감 through a real harvest: the whole field one step better', () => {
  const s = world(1);
  const [m] = s.members;
  s.life.bag[m.id].seeds.carrot = 6;
  s.act(m, { kind: 'plant', plot: -1, crop: 'carrot' }, T0);
  const ready = Math.max(...lifeView(s.life, m.id, m.actor, T0).me.farm.map((p) => p.readyAt));
  const plain = lifeView(s.life, m.id, m.actor, ready).me.farm.map((p) => p.quality);
  s.mood(m).i = { k: 'harvest', at: T0, until: ready + DAY, left: 12 };
  s.act(m, { kind: 'harvest', plot: -1 }, ready);
  const x = s.life.ext?.[m.id] ?? {};
  const q1 = x.q1?.carrot ?? 0,
    q2 = x.q2?.carrot ?? 0;
  const want1 = plain.filter((q) => q === 0).length,
    want2 = plain.filter((q) => q >= 1).length;
  assert.equal(q1, want1);
  assert.equal(q2, want2);
});

test('입질 영감 widens the bite window of a real cast by 20%', () => {
  const s = world(1);
  const [m] = s.members;
  const a = world(1);
  const [n] = a.members;
  // Same uid and seq so both casts roll the same fish.
  a.members[0].id = m.id;
  a.life = structuredClone(s.life);
  s.act(m, { kind: 'status', text: '' }, T0);
  a.act(n, { kind: 'status', text: '' }, T0);
  a.mood(n).i = { k: 'bite', at: T0, until: T0 + DAY, left: 10 };
  s.act(m, { kind: 'cast', spot: 'river' }, T0 + 1000);
  a.act(n, { kind: 'cast', spot: 'river' }, T0 + 1000);
  const w0 = s.life.ext[m.id].pending.windowMs,
    w1 = a.life.ext[n.id].pending.windowMs;
  assert.ok(Math.abs(w1 - w0 * 1.2) <= 1, `${w1} vs ${w0}`);
  assert.equal(a.mood(n).i.left, 9);
});

// ------------------------------------------------------------ care
test('촌장님 찻잔: 20 active minutes below 35 → one cup a day; drinking it helps', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  const low = () => {
    const u = s.mood(m);
    u.v = 25;
    u.n = [0, 0, 0, 0];
    u.l = [['bigLoss', T0 + DAY], ['bang', T0 + DAY]];
  };
  low();
  s.touch(m, T0 + 10 * MIN);
  assert.equal(s.mood(m).cup, undefined, '10 minutes is not enough');
  s.touch(m, T0 + 20 * MIN);
  s.touch(m, T0 + 21 * MIN);
  assert.ok(s.mood(m).cup >= T0 + 20 * MIN, 'the cup arrived');
  assert.equal(s.view(m, T0 + 21 * MIN).cup, s.mood(m).cup);
  s.act(m, { kind: 'moodTea' }, T0 + 22 * MIN);
  assert.equal(s.mood(m).cup, undefined);
  assert.ok(s.mood(m).n[0] >= 60);
  assert.equal(lets(s.mood(m), 'tea'), 1);
  s.fails(m, { kind: 'moodTea' }, T0 + 23 * MIN, MOOD_REJECT.noCup);
  // Still low: no second cup the same KST day.
  low();
  s.touch(m, T0 + 40 * MIN);
  s.touch(m, T0 + 50 * MIN);
  s.touch(m, T0 + 60 * MIN);
  assert.equal(s.mood(m).cup, undefined);
});

// ------------------------------------------------------------ actions
test('snack: crops, fruit, dishes (+40) and forage; three a day; takes the item', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  s.life.bag[m.id].produce.carrot = 2;
  s.life.bag[m.id].fruit = 1;
  s.give(m, 'salad', 1);
  s.mood(m).n[0] = 10;
  s.act(m, { kind: 'snack', item: 'carrot' }, T0 + 1000);
  assert.equal(s.life.bag[m.id].produce.carrot, 1);
  near(s.mood(m).n[0], 35, 0.1);
  s.act(m, { kind: 'snack', item: 'fruit' }, T0 + 2000);
  assert.equal(s.life.bag[m.id].fruit, 0);
  s.fails(m, { kind: 'snack', item: 'fruit' }, T0 + 3000, MOOD_REJECT.notEnough);
  s.fails(m, { kind: 'snack', item: 'wood' }, T0 + 3000, MOOD_REJECT.snackItem);
  const dish = Object.keys(s.life.ext[m.id].inv)[0];
  const food = s.mood(m).n[0];
  s.act(m, { kind: 'snack', item: dish }, T0 + 4000);
  near(s.mood(m).n[0], Math.min(100, food + 40), 0.1);
  assert.equal(s.view(m, T0 + 5000).snacksLeft, 0);
  s.fails(m, { kind: 'snack', item: 'carrot' }, T0 + 5000, MOOD_REJECT.snackMax);
  // Next KST day: three again. A gold carrot is 갓 수확한 걸 먹었어요.
  const x = ((s.life.ext ??= {})[m.id] ??= {});
  x.q2 = { carrot: 1 };
  s.act(m, { kind: 'snack', item: 'carrot', q: 2 }, T0 + DAY);
  assert.equal(lets(s.mood(m), 'fresh'), 1);
  assert.equal(SNACKS_PER_DAY, 3);
});

test('bed rest: +50 휴식, then an hour to wait', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  s.mood(m).n[1] = 20;
  s.act(m, { kind: 'bedRest' }, T0 + 1000);
  near(s.mood(m).n[1], 70, 0.1);
  s.fails(m, { kind: 'bedRest' }, T0 + 30 * MIN, MOOD_REJECT.restWait);
  assert.equal(s.view(m, T0 + 30 * MIN).restAt, T0 + 1000 + REST_COOLDOWN_MS);
  s.act(m, { kind: 'bedRest' }, T0 + 1000 + REST_COOLDOWN_MS);
});

test('bar drink: first of the day free, then 500범 through the ledger (sink), five a day', () => {
  const s = world(1, 10_000);
  const [m] = s.members;
  const wallet = 'wallet-' + m.id;
  const b0 = s.ledger.accounts[wallet];
  s.act(m, { kind: 'barDrink' }, T0);
  assert.equal(s.ledger.accounts[wallet], b0, 'free');
  const house0 = s.ledger.houseBalance ?? 0;
  s.act(m, { kind: 'barDrink' }, T0 + 1000);
  assert.equal(s.ledger.accounts[wallet], b0 - DRINK_PRICE);
  assert.equal((s.ledger.houseBalance ?? 0) - house0, DRINK_PRICE);
  assert.equal(s.ledger.entries.at(-1).reason, 'bar-drink');
  for (let i = 0; i < 3; i++) s.act(m, { kind: 'barDrink' }, T0 + 2000 + i);
  s.fails(m, { kind: 'barDrink' }, T0 + 9000, MOOD_REJECT.drinkMax);
  // Ledger invariant.
  const balances = Object.values(s.ledger.accounts).reduce((a, b) => a + b, 0);
  assert.equal(balances + (s.ledger.houseBalance ?? 0) - (s.ledger.granted ?? 0), INITIAL_BEOM);
  // Broke: the paid one is refused, nothing is taken.
  const p = world(1);
  const [q] = p.members;
  p.ledger = spendBeom(p.ledger, 'wallet-' + q.id, INITIAL_BEOM, 'drain-' + q.id, T0 - 1, 'test');
  p.act(q, { kind: 'barDrink' }, T0);
  p.fails(q, { kind: 'barDrink' }, T0 + 1, MOOD_REJECT.balance);
});

test('cheer: once per friend a day, never myself, snack comes out of my bag; a low friend gets twice', () => {
  const s = world(3);
  const [a, b, c] = s.members;
  s.act(a, { kind: 'status', text: '' }, T0);
  s.act(b, { kind: 'status', text: '' }, T0);
  s.act(a, { kind: 'cheer', to: 1, how: 'pat' }, T0 + 1000);
  assert.equal(lets(s.mood(b), 'cheered'), 1);
  assert.equal(lets(s.mood(a), 'cheer'), 1);
  assert.deepEqual(s.view(a, T0 + 2000).cheered, [1]);
  assert.equal(s.view(b, T0 + 2000).cheers[0].actor, 0);
  s.fails(a, { kind: 'cheer', to: 1, how: 'pat' }, T0 + 3000, MOOD_REJECT.cheered);
  s.fails(a, { kind: 'cheer', to: 0, how: 'pat' }, T0 + 3000, MOOD_REJECT.self);
  s.fails(a, { kind: 'cheer', to: 5, how: 'pat' }, T0 + 3000, MOOD_REJECT.friend);
  s.fails(a, { kind: 'cheer', to: 2, how: 'dance' }, T0 + 3000, MOOD_REJECT.how);
  s.fails(a, { kind: 'cheer', to: 2, how: 'snack', item: 'carrot' }, T0 + 3000, MOOD_REJECT.notEnough);
  // c feels low: twice the cheer; a snack from my bag.
  s.act(c, { kind: 'status', text: '' }, T0);
  s.mood(c).v = 22;
  s.mood(c).n = [0, 50, 50, 50];
  s.life.bag[a.id].produce.carrot = 1;
  s.act(a, { kind: 'cheer', to: 2, how: 'snack', item: 'carrot' }, T0 + 4000);
  assert.equal(s.life.bag[a.id].produce.carrot, 0);
  assert.equal(lets(s.mood(c), 'cheered'), 2);
  assert.ok(s.mood(c).n[0] >= 40);
  // Tomorrow again.
  s.act(a, { kind: 'cheer', to: 1, how: 'highfive' }, T0 + DAY);
});

// ------------------------------------------------------------ economy separation
test('mood never touches 범: the same sale pays the same at mood 95 and 16', () => {
  const pay = (v) => {
    const s = world(1);
    const [m] = s.members;
    s.act(m, { kind: 'status', text: '' }, T0);
    s.mood(m).v = v;
    s.life.bag[m.id].produce.pumpkin = 5;
    const before = s.ledger.accounts['wallet-' + m.id];
    s.act(m, { kind: 'sell', crop: 'pumpkin', n: 5 }, T0 + 1000);
    return s.ledger.accounts['wallet-' + m.id] - before;
  };
  assert.equal(pay(95), pay(16));
  assert.ok(pay(95) > 0);
  assert.equal(sellTotal('pumpkin', sellUnit('pumpkin', 0, T0), 0, 5), sellTotal('pumpkin', sellUnit('pumpkin', 0, T0), 0, 5));
});

// ------------------------------------------------------------ events
test('events: a meal fills 배부름 (+ 맛있는 식사), npcTalk fills 사교, gold harvests add 금별 수확', () => {
  const s = world(2);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  s.mood(m).n = [20, 80, 50, 20];
  s.give(m, 'salad', 1);
  const dish = Object.keys(s.life.ext[m.id].inv)[0];
  s.act(m, { kind: 'eat', item: dish }, T0 + 1000);
  assert.equal(s.mood(m).n[0], 100);
  assert.equal(lets(s.mood(m), 'meal'), 1);
  s.act(m, { kind: 'npcTalk', to: 1 }, T0 + 2000);
  near(s.mood(m).n[3], 30, 0.2);
  // The next KST day's meal counts again (ext.ate resets inside the action).
  s.mood(m).n[0] = 20;
  s.mood(m).l = [];
  s.give(m, 'salad', 1);
  s.act(m, { kind: 'eat', item: 'salad' }, T0 + DAY);
  assert.equal(s.mood(m).n[0], 100);
  assert.equal(lets(s.mood(m), 'meal'), 1);
});

test('cloud: table results and 허풍 주점 shots reach every player; visits count', () => {
  const s = world(3);
  const [a, b, c] = s.members;
  for (const m of s.members) s.act(m, { kind: 'status', text: '' }, T0);
  const w = (m) => 'wallet-' + m.id;
  const life = cloneLife(s.life);
  const room = (liarsbar) => ({ snapshot: { seats: { liarsbar: [a.id, b.id, null, null] }, liarsbar }, leases: { [a.id]: { seen: T0 }, [b.id]: { seen: T0 }, [c.id]: { seen: T0 - CLOUD_LEASE_MS - 1 } } });
  const next = moodAfterCloud({
    life,
    before: s.life,
    member: a,
    prevGames: { g1: { game: 'poker', wallets: [w(a), w(b)], deposits: [30_000, 30_000], state: 'reserved', result: [0, 0] } },
    games: { g1: { game: 'poker', wallets: [w(a), w(b)], deposits: [30_000, 30_000], state: 'settled', result: [25_000, -25_000] } },
    prevRooms: { R: room({ id: 'lb1', lastShot: null }) },
    rooms: { R: room({ id: 'lb1', lastShot: { seat: 1, out: true, pull: 2 } }) },
    leaseMs: CLOUD_LEASE_MS,
    visited: 2,
    now: T0 + 1000,
  });
  const ua = next.mood[a.id],
    ub = next.mood[b.id],
    uc = next.mood[c.id];
  assert.equal(lets(ua, 'table'), 1);
  assert.equal(lets(ub, 'table'), 1);
  assert.equal(lets(ua, 'bigWin'), 1);
  assert.equal(lets(ub, 'bigLoss'), 1);
  assert.equal(lets(ub, 'bang'), 1);
  assert.equal(lets(ua, 'visit'), 1);
  assert.equal(ua.o, 1, 'b is online, c expired');
  assert.equal(lets(uc, 'table'), 0);
  // The same shot seen again is not counted twice.
  const again = moodAfterCloud({
    life: cloneLife(next),
    before: next,
    member: a,
    prevGames: {},
    games: {},
    prevRooms: { R: room({ id: 'lb1', lastShot: { seat: 1, out: true, pull: 2 } }) },
    rooms: { R: room({ id: 'lb1', lastShot: { seat: 1, out: true, pull: 2 } }) },
    leaseMs: CLOUD_LEASE_MS,
    now: T0 + 2000,
  });
  assert.equal(lets(again.mood[b.id], 'bang'), 1);
});

// ------------------------------------------------------------ views and privacy
test('friends see only the face tier; details only when the friend shares them', () => {
  const s = world(2);
  const [a, b] = s.members;
  s.act(a, { kind: 'status', text: '' }, T0);
  s.act(b, { kind: 'npcTalk', to: 0 }, T0);
  const va = lifeView(s.life, a.id, a.actor, T0 + 1000);
  assert.deepEqual(Object.keys(va.mood.faces), ['1']);
  const face = va.mood.faces[1];
  assert.deepEqual(Object.keys(face).sort(), ['tier']);
  assert.ok(!JSON.stringify(va.mood.faces).includes('"v"'));
  assert.equal(va.mood.faces[0], undefined, 'my own face is not in the list');
  // b shares: top thoughts appear (names and values), still no numbers of the mood itself.
  s.act(b, { kind: 'moodShare', on: true }, T0 + 2000);
  const shared = lifeView(s.life, a.id, a.actor, T0 + 3000).mood.faces[1];
  assert.ok(shared.top.length >= 1);
  assert.ok(shared.top.some((t) => t.name === MOODLETS.chat.name));
  assert.equal(shared.v, undefined);
  s.act(b, { kind: 'moodShare', on: false }, T0 + 4000);
  assert.equal(lifeView(s.life, a.id, a.actor, T0 + 5000).mood.faces[1].top, undefined);
  // An offline friend shows as away.
  assert.equal(lifeView(s.life, a.id, a.actor, T0 + HOUR).mood.faces[1].away, true);
});

test('views are pure: lifeView never changes the state; determinism', () => {
  const s = world(2);
  const [a] = s.members;
  s.act(a, { kind: 'npcTalk', to: 1 }, T0);
  const snap = JSON.stringify(s.life);
  const v1 = lifeView(s.life, a.id, a.actor, T0 + 3 * HOUR);
  const v2 = lifeView(s.life, a.id, a.actor, T0 + 3 * HOUR);
  assert.equal(JSON.stringify(s.life), snap);
  assert.deepEqual(v1.mood, v2.mood);
});

// ------------------------------------------------------------ D-3 through the cloud engine
const member = (actor) => ({ id: uuid(), actor, username: ACCOUNT_IDS[actor], connection: uuid(), sequence: 0, epoch: 0, code: '' });
function cloud() {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    now = T0;
  return {
    get world() {
      return world;
    },
    advance(ms) {
      now += ms;
    },
    get now() {
      return now;
    },
    async run(p, op, extra = {}) {
      const c = {
        op,
        connection: p.connection,
        code: p.code,
        ...(!['read', 'wallet'].includes(op) ? { requestId: uuid(), sequence: ++p.sequence } : {}),
        ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
        ...extra,
      };
      const r = cloudTransition(world, p, c, await commandHash(c), now);
      world = r.state;
      p.epoch = r.response.epoch;
      if (r.response.code) p.code = r.response.code;
      return r;
    },
  };
}

test('D-3: a fresh read never writes the row, even with mood; the lease refresh carries the mood clock', async () => {
  const h = cloud();
  const a = member(0),
    b = member(1);
  await h.run(a, 'wallet');
  await h.run(a, 'open', { code: 'MOODTESTAA' });
  await h.run(b, 'wallet');
  await h.run(b, 'join', { code: a.code });
  await h.run(a, 'action', { action: { kind: 'status', text: '안녕' } });
  const at0 = h.world.life.mood[a.id].at;
  h.advance(10_000);
  const read = await h.run(a, 'read');
  assert.equal(read.changed, false, 'a fresh read does not write');
  assert.equal(h.world.life.mood[a.id].at, at0);
  assert.ok(read.response.life.mood.v > 0, 'the view is still there (projected)');
  // A stale lease is refreshed by the read: the mood rides along.
  h.advance(SEEN_REFRESH_MS + 1000);
  const stale = await h.run(a, 'read');
  assert.equal(stale.changed, true);
  assert.equal(h.world.life.mood[a.id].at, h.now);
  assert.equal(h.world.life.mood[a.id].o, 1, 'b is online');
  // A replayed receipt changes nothing (no mood write either).
  const c = { op: 'action', connection: a.connection, code: a.code, requestId: uuid(), sequence: ++a.sequence, action: { kind: 'bedRest' } };
  const first = cloudTransition(h.world, a, c, await commandHash(c), h.now + 1000);
  const again = cloudTransition(first.state, a, c, await commandHash(c), h.now + 5000);
  assert.equal(again.changed, false);
});

test('cloud: a room walk into a friend’s home gives 친구 방에서 놀았어요 and the owner 친구가 놀러 왔어요', async () => {
  const h = cloud();
  const a = member(0),
    b = member(1);
  await h.run(a, 'wallet');
  await h.run(a, 'open', { code: 'MOODVISITA' });
  await h.run(b, 'wallet');
  await h.run(b, 'join', { code: a.code });
  h.advance(1000);
  const r = await h.run(a, 'action', { action: { kind: 'area', area: 'home', home: 1 } });
  assert.equal(r.response.ok, true, r.response.error);
  assert.equal(lets(h.world.life.mood[a.id], 'visit'), 1);
  assert.equal(lets(h.world.life.mood[b.id], 'guest'), 1);
  assert.ok(r.response.life.mood.lets.some((l) => l.id === 'visit'), 'the response already shows it');
});

test('요리 영감: one more plate once; 배움 영감: +20% XP for an hour; level-up and gold thoughts', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, T0);
  s.life.bag[m.id].produce.carrot = 4;
  s.life.bag[m.id].produce.tomato = 4;
  s.mood(m).i = { k: 'cook', at: T0, until: T0 + DAY, left: 1 };
  s.act(m, { kind: 'cook', recipe: 'salad', n: 2 }, T0 + 1000);
  const salads = s.life.ext[m.id].inv.salad;
  assert.ok(salads >= 3, `2 cooked + 1 inspired (${salads})`);
  assert.equal(s.mood(m).i, undefined, 'used up');
  s.act(m, { kind: 'cook', recipe: 'salad', n: 1 }, T0 + 2000);
  assert.ok(s.life.ext[m.id].inv.salad <= salads + 2);
  // 배움 영감 multiplies on top of the tier.
  s.mood(m).v = 50;
  s.mood(m).i = { k: 'learn', at: T0, until: T0 + HOUR, left: 1 };
  assert.equal(moodXpMult(s.life, m.id, T0 + 1000), 1.2);
  assert.equal(moodXpMult(s.life, m.id, T0 + 2 * HOUR), 1);
  // A level-up through a real action leaves 기술 레벨 업!
  const g = ((s.life.growth ??= {}).u ??= {})[m.id];
  g.xp = { ...g.xp, craft: 59 };
  s.act(m, { kind: 'cook', recipe: 'salad', n: 1 }, T0 + 3000);
  assert.equal(lets(s.mood(m), 'levelUp'), 1);
});
