// 먼바다 낚싯배 · 바다 어종 대량 추가 (handover/design/design-sea-fishing.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLife, ensureLifeMember, lifeAction, lifeView } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, validateLedger, kstDay } from '../app/lounge-economy.ts';
import { FISH, FISH_BY_ID, ITEM_BY_ID, ITEM_PRICES, DISH_BY_ID, ALL_FISH_SPOTS, FISH_SPOTS, SPOT_INFO } from '../app/lounge-items.ts';
import { weatherOf, seasonOf } from '../app/lounge-calendar.ts';
import { BAITS, FISH_PROFILE } from '../app/lounge-fish-data.ts';
import { DAWN_FISH, OFFSHORE_FISH, SEA_FISH, SEA_LEGENDS, SHORE_FISH, SEA_PROFILE } from '../app/lounge-fish-sea-data.ts';
import { TICK_MS, botPlay, replayTrace, swayAt, SWAY_PERIOD, FightSim } from '../app/lounge-fish-minigame.ts';
import { ANGLING_REJECT, anglerCandidates, fishAvailable, treasureChance } from '../app/lounge-fish-engine.ts';
import {
  BOARDING_MS,
  DAWN_FARE,
  DAWN_LEAD_MS,
  PILL,
  PILL_PRICE,
  PILL_SELLERS,
  SEATS,
  VOYAGE_FARE,
  VOYAGE_MS,
  boardingSailing,
  nextSailing,
  sailingsOf,
} from '../app/lounge-voyage-data.ts';
import { SWAY, VOYAGE_REJECT, readVoyage, voyageActionArea, voyageAt, voyageSway } from '../app/lounge-voyage.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { NPC_IDS } from '../app/lounge-npc-data.ts';

const MIN = 60_000,
  HOUR = 60 * MIN,
  DAY = 24 * HOUR;
const UIDS = [0, 1, 2, 3, 4, 5].map((i) => `${i}${i}${i}${i}${i}${i}${i}${i}-1111-4111-8111-11111111111${i}`);
/** KST clock: day `d` from 2026-09-24, hh:mm:ss. */
const kst = (d, h, m = 0, s = 0) => Date.UTC(2026, 8, 24 + d, h - 9, m, s);
/** The first day from `from` whose weather matches. */
const dayWith = (pred, from = 0) => {
  for (let d = from; d < from + 120; d++) if (pred(weatherOf(kstDay(kst(d, 12))), d)) return d;
  throw new Error('no day');
};
const CALM = dayWith((w) => w === 'sunny' || w === 'cloudy');

function world(n = 1) {
  const members = UIDS.slice(0, n).map((id, actor) => ({ id, actor }));
  let ledger = newLoungeLedger();
  let life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, `wallet-${m.id}`);
    life = ensureLifeMember(life, m.id, m.actor);
  }
  life.flags = [...(life.flags ?? []), 'district-harbor'];
  const s = { members, life, ledger };
  s.act = (m, a, now) => {
    const next = lifeAction(s.life, s.ledger, m, a, now);
    s.life = next.life;
    s.ledger = next.ledger;
    validateLedger(s.ledger);
    const balances = Object.values(s.ledger.accounts).reduce((x, y) => x + y, 0);
    assert.equal(balances + (s.ledger.houseBalance ?? 0) - (s.ledger.granted ?? 0), Object.keys(s.ledger.accounts).length * 100_000);
    return next;
  };
  s.fails = (m, a, now, message) => assert.throws(() => s.act(m, a, now), { message });
  s.view = (m, now) => lifeView(s.life, m.id, m.actor, now);
  s.give = (m, item, n) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + n;
  };
  s.skill = (m, xp, rod) => {
    const u = (((s.life.growth ??= {}).u ??= {})[m.id] ??= {});
    u.xp = { ...u.xp, fish: xp };
    if (rod) u.tools = { ...u.tools, rod };
  };
  s.wallet = (m) => s.ledger.accounts[`wallet-${m.id}`];
  for (const m of members) s.skill(m, 600);
  return s;
}

// ---------------------------------------------------------------- data
test('sea species: 40+ new, unique ids and names, valid conditions and prices', () => {
  assert.ok(SEA_FISH.length >= 40, `${SEA_FISH.length} new species`);
  assert.ok(SHORE_FISH.length >= 10 && SHORE_FISH.length <= 15, 'near-shore 10–15');
  assert.ok(OFFSHORE_FISH.length + DAWN_FISH.length + SEA_LEGENDS.length >= 25, 'offshore 25+');
  assert.ok(SEA_LEGENDS.length >= 2 && SEA_LEGENDS.length <= 3);
  assert.ok(DAWN_FISH.length >= 1 && DAWN_FISH.length <= 2);
  const ids = FISH.map((f) => f.id),
    names = FISH.map((f) => f.name);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate fish id');
  assert.equal(new Set(names).size, names.length, 'no duplicate fish name');
  // Nothing new shares an id with any other item either.
  for (const f of SEA_FISH) assert.equal(ITEM_BY_ID[f.id].kind, 'fish', f.id);
  for (const old of ['농어', '고등어', '전어', '광어', '오징어', '방어', '복어', '참돔', '노래미', '볼락', '우럭', '문어', '감성돔', '전갱이', '갈치', '붕장어', '한치', '숭어', '도루묵', '쥐치', '달빛 갈치', '겨울 왕대구'])
    assert.equal(SEA_FISH.filter((f) => f.name === old).length, 0, old);
  const seasons = ['spring', 'summer', 'autumn', 'winter'];
  for (const f of SEA_FISH) {
    const p = SEA_PROFILE[f.id];
    assert.ok(p && FISH_PROFILE[f.id] === p, `${f.id} has a fight profile`);
    assert.ok(['calm', 'dart', 'sink', 'float', 'mixed'].includes(p.behaviour));
    assert.ok(p.difficulty >= 10 && p.difficulty <= 95, f.id);
    assert.ok(f.note.length > 8 && f.note.length <= 60, `${f.id} note`);
    assert.ok(f.cm[0] > 0 && f.cm[1] > f.cm[0], `${f.id} size`);
    assert.ok(f.windowMs >= 450 && f.windowMs <= 1_200);
    assert.ok(f.seasons.every((x) => seasons.includes(x)));
    if (p.hours) assert.ok(p.hours.every((h) => Number.isInteger(h) && h >= 0 && h <= 24) && p.hours[0] !== p.hours[1], `${f.id} hours`);
    if (p.need?.rod) assert.ok(p.need.rod >= 2 && p.need.rod <= 5);
    if (p.need?.bait) assert.ok(BAITS.includes(p.need.bait));
    if (p.season) assert.ok(seasons.includes(p.season));
    // A species must be catchable at some time of its season (window vs day/night).
    const season = p.season ? [p.season] : f.seasons;
    let some = false;
    for (let d = 0; d < 400 && !some; d += 3)
      for (let h = 0; h < 24 && !some; h++) {
        const now = Date.UTC(2026, 0, 1 + d, h - 9);
        if (!season.includes(seasonOf(now))) continue;
        some = fishAvailable(f, { season: seasonOf(now), weather: weatherOf(kstDay(now)), now, level: 10, rod: 5, caught: [], dawn: true });
      }
    assert.ok(some, `${f.id} bites at some hour`);
  }
  // Legends: once each, seasons only in the profile (the legacy cast can never pick them).
  for (const f of SEA_LEGENDS) {
    assert.equal(f.weight, 1);
    assert.deepEqual(f.seasons, []);
    assert.ok(SEA_PROFILE[f.id].legend && SEA_PROFILE[f.id].season);
    assert.ok(f.sell >= 13_000, `${f.id} legend price`);
  }
  for (const f of DAWN_FISH) assert.equal(SEA_PROFILE[f.id].dawn, true);
  // Offshore fish are only offshore; the spot is in no shore list.
  for (const f of [...OFFSHORE_FISH, ...DAWN_FISH, ...SEA_LEGENDS]) assert.deepEqual([...FISH_BY_ID[f.id].spots], ['offshore'], f.id);
  for (const f of SHORE_FISH) assert.ok(!FISH_BY_ID[f.id].spots.includes('offshore'));
  assert.ok(!ALL_FISH_SPOTS.includes('offshore') && !FISH_SPOTS.includes('offshore'));
  assert.ok(SPOT_INFO.offshore);
  // Prices (post-raise scale): an offshore catch averages 2,000–2,500 (by bite weight), big ones 6,000–11,000.
  const off = OFFSHORE_FISH.filter((f) => f.weight > 1);
  const avg = off.reduce((x, f) => x + f.sell * f.weight, 0) / off.reduce((x, f) => x + f.weight, 0);
  assert.ok(avg >= 2_000 && avg <= 2_500, `offshore catch average ${avg}`);
  for (const f of off.filter((f) => f.weight <= 5)) assert.ok(f.sell >= 6_000 && f.sell <= 11_000, `${f.id} big-fish price`);
  // Seafood dishes from the new fish; the 멀미약 is a priced tool.
  for (const id of ['tuna-sashimi', 'grilled-spanish', 'croaker-soup', 'steamed-crab', 'monkfish-stew']) assert.ok(DISH_BY_ID[id], id);
  assert.equal(ITEM_PRICES[PILL], PILL_PRICE);
  assert.equal(ITEM_BY_ID[PILL].kind, 'tool');
});

test('timetable: half-hourly 05:00–19:00, boarding two minutes before', () => {
  const day = kstDay(kst(CALM, 12));
  const list = sailingsOf(day);
  assert.equal(list.length, 29);
  assert.equal(list[0], kst(CALM, 5));
  assert.equal(list.at(-1), kst(CALM, 19));
  assert.equal(boardingSailing(kst(CALM, 9, 58)), kst(CALM, 10));
  assert.equal(boardingSailing(kst(CALM, 9, 57, 59)), null);
  assert.equal(boardingSailing(kst(CALM, 10)), null, 'the gangway is up at departure');
  assert.equal(boardingSailing(kst(CALM, 4, 59)), kst(CALM, 5));
  assert.equal(nextSailing(kst(CALM, 19, 10)), kst(CALM + 1, 5));
  assert.equal(BOARDING_MS, 2 * MIN);
});

// ---------------------------------------------------------------- boarding
test('boarding: unlock, window, fare, seats, once a day, refund before departure', () => {
  const s = world(6),
    [a, b, c, d, e, f] = s.members,
    at = kst(CALM, 9, 58, 30);
  // Locked: Lv4 and the harbor.
  s.skill(a, 0);
  s.fails(a, { kind: 'voyageBoard' }, at, VOYAGE_REJECT.locked);
  s.skill(a, 600);
  s.life.flags = s.life.flags.filter((x) => x !== 'district-harbor');
  s.fails(a, { kind: 'voyageBoard' }, at, VOYAGE_REJECT.locked);
  s.life.flags.push('district-harbor');
  // Outside the window.
  s.fails(a, { kind: 'voyageBoard' }, kst(CALM, 9, 50), VOYAGE_REJECT.window);
  // Not enough 범.
  s.ledger.accounts[`wallet-${a.id}`] = 10_000;
  s.ledger.houseBalance = (s.ledger.houseBalance ?? 0) + 90_000;
  s.fails(a, { kind: 'voyageBoard' }, at, VOYAGE_REJECT.balance);
  s.ledger.accounts[`wallet-${a.id}`] = 100_000;
  s.ledger.houseBalance -= 90_000;
  const before = s.wallet(a);
  s.act(a, { kind: 'voyageBoard' }, at);
  assert.equal(s.wallet(a), before - VOYAGE_FARE);
  const v = s.view(a, at).voyage;
  assert.equal(v.trip.phase, 'boarding');
  assert.equal(v.trip.dep, kst(CALM, 10));
  assert.deepEqual(v.trip.seats, [0]);
  // Four seats.
  for (const m of [b, c, d]) s.act(m, { kind: 'voyageBoard' }, at);
  s.fails(e, { kind: 'voyageBoard' }, at, VOYAGE_REJECT.full);
  assert.equal(s.view(e, at).voyage.boarding.seats, SEATS);
  // Stepping off before departure refunds the fare and frees the seat and the day.
  const mid = s.wallet(d);
  s.act(d, { kind: 'voyageLeave' }, at + 1_000);
  assert.equal(s.wallet(d), mid + VOYAGE_FARE);
  assert.equal(s.view(d, at).voyage.sailedToday, false);
  s.act(e, { kind: 'voyageBoard' }, at + 2_000);
  // Once a day: the next sailing refuses those who already went.
  const later = kst(CALM, 13, 59);
  s.fails(a, { kind: 'voyageBoard' }, later, VOYAGE_REJECT.today);
  s.act(f, { kind: 'voyageBoard' }, later);
  // The next day it is open again.
  const tomorrow = dayWith((w) => w !== 'storm', CALM + 1);
  s.act(a, { kind: 'voyageBoard' }, kst(tomorrow, 5, 59));
});

test('storm days: no sailings (결항), and 가붕 can tell the day before', () => {
  const stormy = dayWith((w) => w === 'storm');
  const s = world(1),
    [a] = s.members;
  s.fails(a, { kind: 'voyageBoard' }, kst(stormy, 9, 59), VOYAGE_REJECT.storm);
  assert.equal(s.view(a, kst(stormy, 9, 59)).voyage.storm, true);
  assert.equal(s.view(a, kst(stormy - 1, 12)).voyage.stormTomorrow, true);
});

test('voyage clock: deck only while sailing; back by the clock or early, no refund', () => {
  const s = world(2),
    [a, b] = s.members,
    at = kst(CALM, 9, 59),
    dep = kst(CALM, 10);
  s.act(a, { kind: 'voyageBoard' }, at);
  s.act(b, { kind: 'voyageBoard' }, at);
  // Before departure: no offshore casting.
  s.fails(a, { kind: 'anglerCast', spot: 'offshore' }, at + 10_000, ANGLING_REJECT.spotBoat);
  assert.equal(voyageAt(s.life, a.id, dep - 1), null);
  assert.ok(voyageAt(s.life, a.id, dep));
  // Out at sea: offshore fish bite.
  s.act(a, { kind: 'anglerCast', spot: 'offshore' }, dep + MIN);
  const cast = s.view(a, dep + MIN).angling.me.cast;
  assert.equal(cast.spot, 'offshore');
  assert.equal(s.view(a, dep + MIN).voyage.trip.phase, 'sailing');
  // 20 minutes later the trip reads as back without anyone acting.
  assert.equal(s.view(a, dep + VOYAGE_MS - 1).voyage.trip.phase, 'sailing');
  assert.equal(s.view(a, dep + VOYAGE_MS).voyage.trip.phase, 'back');
  assert.equal(voyageAt(s.life, a.id, dep + VOYAGE_MS), null);
  s.fails(a, { kind: 'anglerCast', spot: 'offshore' }, dep + VOYAGE_MS, ANGLING_REJECT.spotBoat);
  // 그만 돌아가기: early, no refund.
  const wallet = s.wallet(b);
  s.act(b, { kind: 'voyageLeave' }, dep + 5 * MIN);
  assert.equal(s.wallet(b), wallet);
  assert.equal(s.view(b, dep + 5 * MIN).voyage.trip.phase, 'back');
  s.fails(b, { kind: 'anglerCast', spot: 'offshore' }, dep + 6 * MIN, ANGLING_REJECT.spotBoat);
  // The summary closes once back.
  s.fails(a, { kind: 'voyageDone' }, dep + 5 * MIN, VOYAGE_REJECT.notBack);
  s.act(a, { kind: 'voyageDone' }, dep + VOYAGE_MS + 1);
  assert.equal(s.view(a, dep + VOYAGE_MS + 1).voyage.trip, null);
  // No crab pots on the boat.
  assert.throws(() => s.act(b, { kind: 'crabSet', spot: 'offshore' }, dep + MIN), { message: ANGLING_REJECT.potBoat });
});

test('a whole voyage: catches land in the haul; offshore fish never bite ashore', () => {
  const s = world(1),
    [a] = s.members,
    dep = kst(CALM, 10);
  s.skill(a, 3_200, 3);
  s.act(a, { kind: 'voyageBoard' }, dep - MIN);
  let t = dep + 2_000,
    landed = 0;
  while (t < dep + VOYAGE_MS - 50_000) {
    s.act(a, { kind: 'anglerCast', spot: 'offshore' }, t);
    const cast = s.view(a, t).angling.me.cast;
    const hookAt = cast.biteAt + 150;
    s.act(a, { kind: 'anglerHook', token: cast.token }, hookAt);
    const fight = s.view(a, hookAt).angling.me.fight;
    assert.ok(fight.setup.sway > 0, 'the swell rocks the zone without a 멀미약');
    const play = botPlay(fight.setup);
    const landAt = hookAt + play.result.ticks * TICK_MS + 50;
    s.act(a, { kind: 'anglerLand', token: fight.token, runs: play.runs }, landAt);
    const last = s.view(a, landAt).angling.me.last;
    if (last.ok) {
      landed++;
      assert.deepEqual([...FISH_BY_ID[last.fish].spots], ['offshore'], `${last.fish} is an offshore fish`);
    }
    t = landAt + 4_000;
  }
  const haul = s.view(a, dep + VOYAGE_MS).voyage.trip.haul ?? {};
  assert.equal(Object.values(haul).reduce((x, n) => x + n, 0), landed);
  assert.ok(landed >= 20, `${landed} fish in 20 minutes`);
  // Ashore: no offshore fish in any spot's table.
  const offIds = new Set([...OFFSHORE_FISH, ...DAWN_FISH, ...SEA_LEGENDS].map((f) => f.id));
  for (const spot of ALL_FISH_SPOTS)
    for (let h = 0; h < 24; h += 3) {
      const now = kst(CALM, h);
      const list = anglerCandidates(spot, { season: seasonOf(now), weather: weatherOf(kstDay(now)), now, level: 10, rod: 5, caught: [] });
      assert.ok(list.every((f) => !offIds.has(f.id)), `${spot} ${h}h`);
    }
  // And the offshore table holds no dawn fish on a regular sailing.
  const now = dep + MIN,
    ctx = { season: seasonOf(now), weather: weatherOf(kstDay(now)), now, level: 10, rod: 5, caught: [] };
  assert.ok(anglerCandidates('offshore', ctx).every((f) => !SEA_PROFILE[f.id].dawn));
  assert.ok(anglerCandidates('offshore', { ...ctx, dawn: true }).some((f) => SEA_PROFILE[f.id].dawn));
  // Treasure +5%p at sea.
  assert.equal(treasureChance(4, false, 0, true) - treasureChance(4, false, 0), 5);
});

test('gated fish: rod tier and bait conditions', () => {
  const marlin = FISH_BY_ID.marlin;
  const day = dayWith((w, d) => w === 'sunny' && seasonOf(kst(d, 12)) === 'summer');
  const now = kst(day, 12),
    base = { season: 'summer', weather: weatherOf(kstDay(now)), now, level: 10, caught: [] };
  assert.equal(fishAvailable(marlin, { ...base, rod: 2 }), false, 'rod 3 needed');
  assert.equal(fishAvailable(marlin, { ...base, rod: 3, bait: null }), false, 'shrimp bait needed');
  assert.equal(fishAvailable(marlin, { ...base, rod: 3, bait: 'bait-shrimp' }), true);
  // 황금 다랑어: summer dawn, clear skies only.
  const gold = FISH_BY_ID.goldtuna;
  assert.equal(fishAvailable(gold, { ...base, now: kst(day, 6), rod: 3, level: 8 }), true);
  assert.equal(fishAvailable(gold, { ...base, now: kst(day, 6), rod: 3, level: 7 }), false);
  assert.equal(fishAvailable(gold, { ...base, now: kst(day, 9), rod: 3, level: 8 }), false);
  assert.equal(fishAvailable(gold, { ...base, now: kst(day, 6), weather: 'cloudy', rod: 3, level: 8 }), false);
  assert.equal(fishAvailable(gold, { ...base, now: kst(day, 6), rod: 3, level: 8, caught: ['goldtuna'] }), false, 'once per friend');
});

// ---------------------------------------------------------------- dawn knock
test('dawn knock: regulars only, 05–07, once a day; the discount and up to three friends', () => {
  const s = world(5),
    [a, b, c, d, e] = s.members;
  // Six calm days of voyages for a, two for b.
  let d0 = CALM;
  const days = [];
  while (days.length < 6) {
    if (weatherOf(kstDay(kst(d0, 12))) !== 'storm') days.push(d0);
    d0++;
  }
  for (const [i, day] of days.slice(0, 5).entries()) {
    s.act(a, { kind: 'voyageBoard' }, kst(day, 7, 59));
    s.act(a, { kind: 'voyageDone' }, kst(day, 8, 30));
    if (i < 2) {
      s.act(b, { kind: 'voyageBoard' }, kst(day, 7, 59));
      s.act(b, { kind: 'voyageDone' }, kst(day, 8, 30));
    }
  }
  const today = days[5];
  assert.equal(s.view(a, kst(today, 4, 59)).voyage.knock, false, 'not before 05:00');
  assert.equal(s.view(a, kst(today, 7)).voyage.knock, false, 'not after 07:00');
  assert.equal(s.view(a, kst(today, 5, 30)).voyage.knock, true);
  assert.equal(s.view(a, kst(today, 5, 30)).voyage.recent, 5);
  assert.equal(s.view(b, kst(today, 5, 30)).voyage.knock, false, 'two voyages is not a regular');
  s.fails(b, { kind: 'voyageInvite', answer: 'yes' }, kst(today, 5, 30), VOYAGE_REJECT.knock);
  // Too many guests.
  s.fails(a, { kind: 'voyageInvite', answer: 'yes', guests: [1, 2, 3, 4] }, kst(today, 5, 30), VOYAGE_REJECT.guests);
  const wallet = s.wallet(a),
    at = kst(today, 5, 30);
  s.act(a, { kind: 'voyageInvite', answer: 'yes', guests: [1, 2] }, at);
  assert.equal(s.wallet(a), wallet - DAWN_FARE);
  assert.equal(DAWN_FARE, 10_500);
  const trip = s.view(a, at).voyage.trip;
  assert.equal(trip.dawn, true);
  assert.equal(trip.dep, at + DAWN_LEAD_MS);
  assert.equal(s.view(a, at + 1).voyage.knock, false, 'one knock a day');
  // Guests board at the pier with the same discount; others cannot.
  const g = s.view(b, at).voyage.guestOf;
  assert.equal(g.id, trip.id);
  s.act(b, { kind: 'voyageBoard', dawn: g.id }, at + MIN);
  assert.equal(s.view(b, at + MIN).voyage.trip.fare, DAWN_FARE);
  s.fails(d, { kind: 'voyageBoard', dawn: g.id }, at + MIN, VOYAGE_REJECT.dawn);
  // Too late once the dawn boat has left.
  s.fails(c, { kind: 'voyageBoard', dawn: g.id }, trip.dep, VOYAGE_REJECT.dawn);
  // Dawn fish bite on the dawn boat.
  assert.ok(voyageAt(s.life, a.id, trip.dep).dawn);
  // Saying no: the captain does not come back that day.
  const s2 = world(1),
    [x] = s2.members;
  s2.life.voyage = { u: { [x.id]: { days: days.slice(0, 4).map((dd) => kstDay(kst(dd, 12))) } } };
  assert.equal(s2.view(x, kst(today, 6)).voyage.knock, true);
  s2.act(x, { kind: 'voyageInvite', answer: 'no' }, kst(today, 6));
  assert.equal(s2.view(x, kst(today, 6, 30)).voyage.knock, false);
  s2.fails(x, { kind: 'voyageInvite', answer: 'yes' }, kst(today, 6, 31), VOYAGE_REJECT.knock);
  // He knocks again on the next calm day.
  const next = dayWith((w) => w !== 'storm', today + 1);
  assert.equal(s2.view(x, kst(next, 5, 10)).voyage.knock, next - today <= 3);
  void e;
});

// ---------------------------------------------------------------- 멀미약
test('멀미약: sellers, one KST day of calm deck, no swell on the reel', () => {
  const s = world(1),
    [a] = s.members,
    now = kst(CALM, 10, 5);
  assert.equal(voyageActionArea({ kind: 'pillBuy', from: 'tsunade' }), 'hillside');
  assert.equal(voyageActionArea({ kind: 'voyageBoard' }), 'harbor');
  s.fails(a, { kind: 'pillBuy', from: 'lux' }, now, VOYAGE_REJECT.seller);
  // 의사 메르시 sells only once she lives in the village (stage 3).
  const mercy = PILL_SELLERS.find((p) => p.npc === 'mercy');
  assert.ok(mercy);
  if (!NPC_IDS.includes('mercy')) s.fails(a, { kind: 'pillBuy', from: 'mercy' }, now, VOYAGE_REJECT.seller);
  const wallet = s.wallet(a);
  s.act(a, { kind: 'pillBuy', from: 'tsunade', n: 2 }, now);
  assert.equal(s.wallet(a), wallet - 2 * PILL_PRICE);
  assert.equal(s.life.ext[a.id].inv[PILL], 2);
  const w = weatherOf(kstDay(now));
  assert.equal(voyageSway(s.life, a.id, now), SWAY[w]);
  s.act(a, { kind: 'pillTake' }, now);
  assert.equal(voyageSway(s.life, a.id, now), 0);
  assert.equal(s.view(a, now).voyage.pillUntil, kst(CALM + 1, 0));
  s.fails(a, { kind: 'pillTake' }, now + HOUR, VOYAGE_REJECT.pillToday);
  // Midnight: the swell is back; the second pill works the next day.
  assert.equal(voyageSway(s.life, a.id, kst(CALM + 1, 0)) > 0, true);
  s.act(a, { kind: 'pillTake' }, kst(CALM + 1, 1));
  assert.equal(s.life.ext[a.id].inv?.[PILL] ?? 0, 0);
  s.fails(a, { kind: 'pillTake' }, kst(CALM + 2, 1), VOYAGE_REJECT.pillNone);
});

test('swell: a deterministic integer wave; the replay agrees with the live fight', () => {
  for (let t = 0; t < SWAY_PERIOD * 2; t++) {
    const v = swayAt(400, t);
    assert.ok(Number.isInteger(v) && Math.abs(v) <= 400);
  }
  assert.equal(swayAt(400, 0), 0);
  assert.equal(swayAt(400, SWAY_PERIOD / 4), 400);
  assert.equal(swayAt(400, (3 * SWAY_PERIOD) / 4), -400);
  assert.equal(swayAt(0, 17), 0);
  const setup = { seed: 1234567, behaviour: 'mixed', difficulty: 60, bar: 3_100, gain: 42, loss: 50, treasure: null, sway: 480 };
  const play = botPlay(setup);
  const replay = replayTrace(setup, play.runs);
  assert.ok(replay.ok);
  assert.deepEqual(replay.result, play.result);
  // Without sway the old fights replay exactly as before.
  const calm = { ...setup };
  delete calm.sway;
  const sim = new FightSim(calm);
  for (let i = 0; i < 100; i++) sim.step(i % 7 < 3);
  assert.equal(sim.zoneY(), sim.state.barY);
});

test('determinism: the same cast at the same moment picks the same fish', () => {
  const run = () => {
    const s = world(1),
      [a] = s.members,
      dep = kst(CALM, 14);
    s.act(a, { kind: 'voyageBoard' }, dep - MIN);
    const out = [];
    for (let i = 0; i < 6; i++) {
      const t = dep + i * 30_000 + 1_000;
      s.act(a, { kind: 'anglerCancel', token: 'x' }, t - 1);
      s.act(a, { kind: 'anglerCast', spot: 'offshore' }, t);
      out.push(JSON.stringify(s.life.angling.u[a.id].cast));
    }
    return out;
  };
  assert.deepEqual(run(), run());
  // Old worlds read with no voyage state.
  assert.deepEqual(readVoyage(undefined), {});
  assert.deepEqual(readVoyage({ u: { nope: { trip: {} } } }), {});
});

// ---------------------------------------------------------------- cloud
const uuid = () => crypto.randomUUID();
test('cloud: boarding at the pier, the deck only while sailing, back on the pier after', async () => {
  let w = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    now = kst(CALM, 9, 58, 40);
  const p = { id: uuid(), actor: 0, username: ACCOUNT_IDS[0], connection: uuid(), sequence: 0, epoch: 0, code: '' };
  const run = async (op, extra = {}) => {
    const command = {
      op,
      connection: p.connection,
      ...(p.code ? { code: p.code } : {}),
      ...(!['read', 'wallet'].includes(op) ? { requestId: uuid(), sequence: ++p.sequence } : {}),
      ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
      ...extra,
    };
    const r = cloudTransition(w, p, command, await commandHash(command), now);
    w = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    return r.response;
  };
  const opened = await run('open');
  assert.equal(opened.ok, true, opened.error);
  w.life.flags = [...(w.life.flags ?? []), 'district-harbor'];
  ((w.life.growth ??= {}).u ??= {})[p.id] = { xp: { fish: 600 } };
  const area = async (a, x = 50, y = 50) => run('action', { action: { kind: 'area', area: a, x, y } });
  const me = () => w.rooms[p.code].snapshot.players.find((x) => x.id === p.id);
  // Not at the pier: refused.
  assert.equal((await run('action', { action: { kind: 'voyageBoard' } })).ok, false);
  assert.equal((await area('harbor', 48, 70)).ok, true);
  // No deck before boarding.
  assert.equal((await area('offshore')).ok, false);
  const boarded = await run('action', { action: { kind: 'voyageBoard' } });
  assert.equal(boarded.ok, true, boarded.error);
  assert.equal(w.ledger.accounts['wallet-' + p.id], 100_000 - VOYAGE_FARE);
  // Departure: onto the deck.
  now = kst(CALM, 10, 0, 1);
  const deck = await area('offshore');
  assert.equal(deck.ok, true, deck.error);
  assert.equal(me().area, 'offshore');
  // Casting from the deck only.
  now += MIN;
  assert.equal((await run('action', { action: { kind: 'anglerCast', spot: 'offshore' } })).ok, true);
  // The client polls while at sea; time's up: the next read puts me back on the pier.
  while (now + 60_000 < kst(CALM, 10, 20)) {
    now += 60_000;
    await run('read');
    assert.equal(me().area, 'offshore');
  }
  now = kst(CALM, 10, 20, 2);
  await run('read');
  assert.equal(me().area, 'harbor');
  assert.equal((await area('offshore')).ok, false);
});
