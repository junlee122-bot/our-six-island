// 시간 체계 P1 (handover/design/design-time-and-endgame.md 1부): 나의 하루 and
// 하루 마감. The tests of §1-7: three days a real day at most, the sell cap
// and demand stay on the real day, pday never goes down, a 하루 마감 across
// midnight, the shipping bin sells at once, crops grow exactly 12 hours of
// wet growth (dry ones wait), absence protection (밀린 기회; bonds and the
// 목장 도우미 are in their own files too), the late-harvest guarantee, the
// greenhouse and orchard plots, and the cloud op at my bed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CROPS, CROP_INFO, LifeError, SELL_CAP_PER_DAY, emptyLife, ensureLifeMember, lifeAction, lifeView, plotGrowMs, plotGrowth, readLife } from '../app/lounge-life.ts';
import { INITIAL_BEOM, kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { dayStart, gameHour, gameTimeOnDay, rainsOn, seasonOfDay } from '../app/lounge-calendar.ts';
import { openTiles } from '../app/lounge-farm-data.ts';
import { LATE_HARVEST_MS, witherAt } from '../app/lounge-farm.ts';
import {
  EXTRA_DAYS_PER_REAL_DAY,
  MAKEUP_MAX,
  MYDAY_REJECT,
  SLEEP_GROW_MS,
  canEndDay,
  endsLeft,
  isGameNight,
  makeupLeft,
  myDay,
  readMyDay,
} from '../app/lounge-myday.ts';
import { ORCHARD_PLOT_DAYS } from '../app/lounge-farm-sites-data.ts';
import { SAPLINGS } from '../app/lounge-stage3-data.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { tillField } from './farm-test-help.mjs';

const uuid = () => crypto.randomUUID();
const HOUR = 3_600_000;
// A dry autumn or winter Monday (no rain that day or the day before): watering
// decides growth, and 인삼 (14.4 hours, the slowest crop) is in season.
let D = kstDay(Date.UTC(2026, 9, 5, 3));
while ((D + 3) % 7 !== 0 || rainsOn(D) || rainsOn(D - 1) || !['autumn', 'winter'].includes(seasonOfDay(D))) D++;
const SLOW = 'insam';
/** Game time `h` on real day `d`, in the real hour `slot`. */
const at = (d, h, slot = 12) => gameTimeOnDay(d, h, 0, slot);
const night = (d, slot = 12) => at(d, 22, slot);

function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  const reserved = Object.values(ledger.games)
    .filter((g) => g.state === 'reserved')
    .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
  assert.equal(balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0), Object.keys(ledger.accounts).length * INITIAL_BEOM);
}
function world(n = 1) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
    tillField(life, m.id);
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
      message,
    );
  s.balance = (m) => s.ledger.accounts['wallet-' + m.id];
  return s;
}

test('the night: 하루 마감 only at game 20:00–05:59', () => {
  assert.equal(gameHour(night(D)), 22);
  assert.ok(isGameNight(night(D)));
  assert.ok(isGameNight(at(D, 3)));
  assert.ok(!isGameNight(at(D, 12)));
  assert.ok(!isGameNight(at(D, 6)));
  const s = world();
  const [m] = s.members;
  s.fails(m, { kind: 'endDay' }, at(D, 12), MYDAY_REJECT.night);
  assert.equal(canEndDay(s.life, m.id, at(D, 19)), MYDAY_REJECT.night);
  assert.equal(canEndDay(s.life, m.id, night(D)), null);
});

test('three 나의 하루 a real day at most; pday = kstDay + bonus, never down', () => {
  const s = world();
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, at(D, 9));
  assert.equal(myDay(s.life, m.id, at(D, 9)), D);
  assert.equal(endsLeft(s.life, m.id, night(D)), EXTRA_DAYS_PER_REAL_DAY);
  let last = D;
  for (let i = 1; i <= EXTRA_DAYS_PER_REAL_DAY; i++) {
    const r = s.act(m, { kind: 'endDay' }, night(D, 12 + i));
    const pd = myDay(s.life, m.id, night(D, 12 + i));
    assert.equal(pd, D + i);
    assert.ok(pd > last && pd >= kstDay(night(D, 12 + i)));
    last = pd;
    assert.equal(r.life.myday[m.id].r.pd, pd, 'the report names the new day');
    assert.equal(lifeView(s.life, m.id, m.actor, night(D, 12 + i)).myday.n, i, 'the HUD badge');
  }
  s.fails(m, { kind: 'endDay' }, night(D, 16), MYDAY_REJECT.enough);
  // The midnight day is the third: the real day moves on, my day too, never back.
  const next = at(D + 1, 9, 0);
  assert.equal(myDay(s.life, m.id, next), D + 1 + EXTRA_DAYS_PER_REAL_DAY);
  assert.ok(myDay(s.life, m.id, next) > last);
  // The record survives a save.
  const back = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.deepEqual(back.myday, s.life.myday);
  assert.deepEqual(readMyDay({ bad: 1, [m.id]: { b: -3, s: 'x' } }), {});
});

test('a 하루 마감 across real midnight: the count is per real day', () => {
  const s = world();
  const [m] = s.members;
  s.act(m, { kind: 'endDay' }, night(D, 23));
  s.act(m, { kind: 'endDay' }, night(D, 23) + 60_000);
  s.fails(m, { kind: 'endDay' }, night(D, 23) + 120_000, MYDAY_REJECT.enough);
  // 00:xx of the next real day (still game night): two more.
  s.act(m, { kind: 'endDay' }, at(D + 1, 2, 0));
  s.act(m, { kind: 'endDay' }, at(D + 1, 3, 0));
  s.fails(m, { kind: 'endDay' }, at(D + 1, 4, 0), MYDAY_REJECT.enough);
  assert.equal(myDay(s.life, m.id, at(D + 1, 4, 0)), D + 1 + 4);
});

test('the shipping bin sells at once; the sell cap and the demand curve stay on the real day', () => {
  const s = world();
  const [m] = s.members;
  const t = night(D);
  s.life.bag[m.id].produce.carrot = 60;
  s.act(m, { kind: 'sell', crop: 'carrot', n: 5 }, at(D, 9));
  assert.equal(s.life.ext[m.id].dem.carrot, 5);
  s.act(m, { kind: 'ship', item: 'carrot', n: 10 }, at(D, 9) + 1000);
  const before = s.balance(m),
    sold = s.life.sold[m.id].amount;
  s.act(m, { kind: 'endDay' }, t);
  assert.ok(s.balance(m) > before, 'paid now, not at midnight');
  assert.equal(s.life.farmx[m.id].bin, undefined);
  const rep = s.life.myday[m.id].r;
  assert.equal(rep.sold, 10);
  assert.equal(rep.ship, s.balance(m) - before);
  // The real day's books: the same sold record, demand kept counting (5 + 10).
  assert.equal(s.life.sold[m.id].day, kstDay(t));
  assert.equal(s.life.sold[m.id].amount, sold + rep.ship);
  assert.equal(s.life.ext[m.id].dem.carrot, 15, 'a new 나의 하루 does not reset the demand curve');
  // At the cap: a 하루 마감 sells nothing more today, the bin waits for the real day.
  s.life.sold[m.id] = { day: kstDay(t), amount: SELL_CAP_PER_DAY };
  s.act(m, { kind: 'ship', item: 'carrot', n: 5 }, t + 1000);
  const capped = s.balance(m);
  s.act(m, { kind: 'endDay' }, t + 2000);
  assert.equal(s.balance(m), capped);
  assert.equal(s.life.farmx[m.id].bin.items.carrot, 5);
  assert.equal(lifeView(s.life, m.id, m.actor, t + 3000).sellCapLeft, 0);
  s.act(m, { kind: 'status', text: '' }, at(D + 1, 9, 9));
  assert.ok(s.balance(m) > capped, 'the next real day sells it');
});

test('crops grow exactly 12 hours of wet growth; dry ones wait', () => {
  const s = world();
  const [m] = s.members;
  const crop = SLOW;
  assert.ok(CROP_INFO[crop].seasons.includes(seasonOfDay(D)) && plotGrowMs({ crop, plantedAt: 0 }) > 14 * HOUR);
  const [wet, dry] = openTiles(24);
  s.life.bag[m.id].seeds[crop] = 2;
  const t0 = at(D, 6, 8);
  s.act(m, { kind: 'plant', plot: wet, crop }, t0);
  s.act(m, { kind: 'plant', plot: dry, crop }, t0 + 1000);
  s.act(m, { kind: 'water', plot: wet }, t0 + 2000);
  const t = night(D, 8);
  const g0 = plotGrowth(s.life.farms[m.id][wet], t);
  assert.ok(g0 > 0 && g0 < plotGrowMs(s.life.farms[m.id][wet]) - SLEEP_GROW_MS);
  assert.equal(plotGrowth(s.life.farms[m.id][dry], t), 0);
  s.act(m, { kind: 'endDay' }, t);
  assert.equal(plotGrowth(s.life.farms[m.id][wet], t), g0 + SLEEP_GROW_MS);
  assert.equal(plotGrowth(s.life.farms[m.id][dry], t), 0, 'a dry crop waits');
  assert.equal(s.life.myday[m.id].r.grew, 1);
  // It keeps the extra after a save (wet soil fields, no wateredAt).
  const back = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.equal(plotGrowth(back.farms[m.id][wet], t), g0 + SLEEP_GROW_MS);
  assert.equal(Object.hasOwn(back.farms[m.id][wet], 'wateredAt'), false);
});

test('my greenhouse tiles grow and my 과일나무 자리 bears; the village fruit trees wait less', () => {
  const s = world(2);
  const [a, b] = s.members;
  const crop = SLOW;
  const t = night(D, 10);
  // 개인 온실 (a's personal site) with a watered crop; b's watered crop in the shared greenhouse is not mine.
  const plot = (o) => ({ crop, plantedAt: t - HOUR, t: 1, wetMs: HOUR + 2 * HOUR, wetUntil: t + 2 * HOUR, ...(o !== undefined ? { o } : {}) });
  const kind = SAPLINGS.apple ? 'apple' : Object.keys(SAPLINGS)[0];
  const tree = Object.keys(SAPLINGS).find((k) => SAPLINGS[k].season === seasonOfDay(kstDay(t))) ?? kind;
  s.life.farm = {
    sites: {
      P0: { kind: 'greenhouseMini', tier: 1, owner: a.id, state: { plots: { 0: plot() } } },
      L1: { kind: 'greenhouse', tier: 1, owner: 'shared', state: { plots: { 0: plot(0), 1: plot(1) } } },
      P1: { kind: 'orchardPlot', tier: 1, owner: b.id, state: { trees: { 0: { f: tree, at: dayStart(kstDay(t) - ORCHARD_PLOT_DAYS - 1) } } } },
    },
    d: kstDay(t),
  };
  s.life.fruitPickedAt[a.id] = { apple: t - HOUR };
  const g = (site, k) => plotGrowth(s.life.farm.sites[site].state.plots[k], t);
  const [mini, mine, theirs] = [g('P0', 0), g('L1', 0), g('L1', 1)];
  s.act(a, { kind: 'endDay' }, t);
  assert.equal(g('P0', 0), mini + SLEEP_GROW_MS);
  assert.equal(g('L1', 0), mine + SLEEP_GROW_MS);
  assert.equal(g('L1', 1), theirs, "a friend's greenhouse tile is theirs");
  assert.equal(s.life.fruitPickedAt[a.id].apple, t - HOUR - SLEEP_GROW_MS);
  const before = s.life.farm.sites.P1.state.trees[0].n ?? 0;
  s.act(b, { kind: 'endDay' }, t + 1000);
  if (SAPLINGS[tree].season === seasonOfDay(kstDay(t))) assert.equal(s.life.farm.sites.P1.state.trees[0].n, before + 1);
});

test('밀린 기회: days of this week I missed come back as extra 하루 마감 (at most 3)', () => {
  const s = world();
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '' }, at(D, 9)); // Monday
  assert.equal(makeupLeft(s.life, m.id, at(D, 9)), 0, 'a first visit owes nothing for the days before');
  // Back on Thursday: Tuesday and Wednesday were missed.
  const thu = D + 3;
  s.act(m, { kind: 'status', text: '' }, at(thu, 9));
  assert.equal(makeupLeft(s.life, m.id, at(thu, 9)), 2);
  assert.equal(endsLeft(s.life, m.id, night(thu)), EXTRA_DAYS_PER_REAL_DAY + 2);
  for (let i = 0; i < EXTRA_DAYS_PER_REAL_DAY + 2; i++) s.act(m, { kind: 'endDay' }, night(thu, 13 + i));
  assert.equal(s.life.myday[m.id].r.mk, 1, 'the last one used a 밀린 기회 day');
  s.fails(m, { kind: 'endDay' }, night(thu, 18), MYDAY_REJECT.enough);
  // Sunday after a quiet Friday and Saturday: two more (at most MAKEUP_MAX a week).
  assert.equal(makeupLeft(s.life, m.id, at(D + 6, 9)), Math.min(MAKEUP_MAX, 4) - 2);
  // A new week starts fresh.
  s.act(m, { kind: 'status', text: '' }, at(D + 7, 9));
  assert.equal(makeupLeft(s.life, m.id, at(D + 7, 9)), 0);
});

test('막바지 수확 보장: a crop ripe when its season ends lasts 30 hours more', () => {
  const crop = CROPS.find((c) => CROP_INFO[c].seasons?.length === 1 && !CROP_INFO[c].regrow);
  assert.ok(crop);
  const season = CROP_INFO[crop].seasons[0];
  let last = D;
  while (seasonOfDay(last) !== season || seasonOfDay(last + 1) === season) last++;
  const end = dayStart(last + 1);
  const plantedAt = dayStart(last) + HOUR;
  const grow = Math.ceil(CROP_INFO[crop].growMs);
  // Ripe at 01:00 + its grow time (hand-watered past it) vs. a dry one.
  const ripe = { crop, plantedAt: end - grow - HOUR, t: 1, wetMs: grow + HOUR, wetUntil: end };
  const green = { crop, plantedAt, t: 1 };
  assert.equal(witherAt(ripe, false), end + LATE_HARVEST_MS);
  assert.equal(witherAt(green, false), end);
});

test('views: myday shows the count, what is left and the last report; friends see 💤 for 30 seconds', () => {
  const s = world(2);
  const [a, b] = s.members;
  const t = night(D);
  s.act(a, { kind: 'endDay' }, t);
  const mine = lifeView(s.life, a.id, a.actor, t + 1000).myday;
  assert.equal(mine.n, 1);
  assert.equal(mine.left, EXTRA_DAYS_PER_REAL_DAY - 1);
  assert.equal(mine.r.pd, D + 1);
  assert.equal(lifeView(s.life, b.id, b.actor, t + 1000).myday.zz[a.actor], t);
  assert.equal(lifeView(s.life, b.id, b.actor, t + 31_000).myday.zz, undefined);
});

// ------------------------------------------------------------ the cloud op at my bed
const member = (actor) => ({ id: uuid(), actor, username: ACCOUNT_IDS[actor], connection: uuid(), sequence: 0, epoch: 0, code: '' });
test("cloud op 'endDay': in my own room only; the server re-checks the night and the count", async () => {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    now = night(D);
  const run = async (p, op, extra = {}) => {
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
  };
  const a = member(0);
  await run(a, 'wallet');
  await run(a, 'open', { code: 'MYDAYTESTA' });
  const outside = await run(a, 'endDay');
  assert.equal(outside.response.ok, false);
  assert.equal(outside.response.error, MYDAY_REJECT.bed);
  await run(a, 'action', { action: { kind: 'area', area: 'home', home: 0 } });
  now += 1000;
  const slept = await run(a, 'endDay');
  assert.equal(slept.response.ok, true, slept.response.error);
  assert.equal(slept.response.life.myday.n, 1);
  now += 1000;
  assert.equal((await run(a, 'endDay')).response.ok, true);
  now += 1000;
  const third = await run(a, 'endDay');
  assert.equal(third.response.error, MYDAY_REJECT.enough);
});

test('economy: ending every day twice for a week never sells past the real day cap', () => {
  const s = world();
  const [m] = s.members;
  for (let d = D; d < D + 7; d++) {
    for (let i = 0; i < EXTRA_DAYS_PER_REAL_DAY; i++) {
      s.life.bag[m.id].produce.pumpkin = 400;
      s.act(m, { kind: 'ship', item: 'pumpkin', n: 300 }, night(d, 13 + i));
      s.act(m, { kind: 'endDay' }, night(d, 13 + i) + 1000);
      const sold = s.life.sold[m.id];
      assert.equal(sold.day, d);
      assert.ok(sold.amount <= SELL_CAP_PER_DAY, `${sold.amount} on day ${d}`);
    }
  }
});
