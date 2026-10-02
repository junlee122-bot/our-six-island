// 게임 시계 (handover/design/design-game-clock.md): a game day is one real
// hour; the time of day is on the game clock, daily limits, weekdays and the
// calendar stay on the real KST day.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_DAY_MS,
  GAME_HOUR_MS,
  GAME_MINUTE_MS,
  dayStart,
  gameClockText,
  gameDay,
  gameDayStart,
  gameHour,
  gameMinute,
  gameTimeAt,
  gameTimeOnDay,
  inGameHours,
  isDaytime,
  isNighttime,
  nextGameTime,
  realDayOfGameDay,
  realKstHour,
  timeOfDay,
  weekdayOf,
  weeklyActive,
} from '../app/lounge-calendar.ts';
import { kstDay, newLoungeLedger, registerWallet } from '../app/lounge-economy.ts';
import { FISH_BY_ID, SPAWN_SPOTS } from '../app/lounge-items.ts';
import { fishAvailable } from '../app/lounge-fish-engine.ts';
import { npcPlan, npcSpot, npcTimeline, realtyDuty } from '../app/lounge-npc-schedule.ts';
import { spouseAtHome } from '../app/lounge-romance.ts';
import { auctionOpen, nextSlot, readingOpen, showNight, AUCTION_HOURS, READING_WEEKDAY } from '../app/lounge-town.ts';
import { lanternOpen } from '../app/lounge-shops.ts';
import { dayLighting, dayPhase } from '../app/lounge-village-life.ts';
import { emptyLife, ensureLifeMember, lifeAction, LifeError } from '../app/lounge-life.ts';
import { forageAt, PLUS_REJECT } from '../app/lounge-life-plus.ts';

const HOUR = 3_600_000,
  DAY = 86_400_000;
/** Thursday 2026-10-01 12:00 KST: game midnight. */
const T0 = Date.UTC(2026, 9, 1, 3);
const DAY0 = kstDay(T0);

test('the game clock: one game day per real hour, the same for everyone', () => {
  assert.equal(GAME_DAY_MS, HOUR);
  assert.equal(GAME_HOUR_MS, 150_000, 'a game hour is 2 min 30 s');
  assert.equal(GAME_MINUTE_MS, 2_500);
  // Deterministic: the same instant reads the same time, whoever asks.
  for (const t of [T0, T0 + 1_234_567, T0 + 17 * DAY + 999]) {
    assert.equal(gameHour(t), gameHour(t));
    assert.equal(gameClockText(t), gameClockText(Number(String(t))));
  }
  // Game midnight on every real hour; an hour later the clock reads the same.
  assert.equal(gameHour(T0), 0);
  assert.equal(gameMinute(T0), 0);
  for (let k = 0; k < 48; k++) {
    const t = T0 + k * 37_000;
    assert.equal(gameHour(t + HOUR), gameHour(t));
    assert.equal(gameMinute(t + 5 * HOUR), gameMinute(t));
  }
  assert.equal(gameHour(T0 + 30 * 60_000), 12, 'half past the real hour is game noon');
  assert.equal(gameHour(T0 + GAME_HOUR_MS * 15 + GAME_MINUTE_MS * 20), 15);
  assert.equal(gameMinute(T0 + GAME_HOUR_MS * 15 + GAME_MINUTE_MS * 20), 20);
  assert.equal(gameTimeAt(gameDay(T0), 15, 20), T0 + 15 * GAME_HOUR_MS + 20 * GAME_MINUTE_MS);
  assert.equal(gameDayStart(gameDay(T0 + 1_000)), T0);
  // The real clock is still there for things that need it.
  assert.equal(realKstHour(T0), 12);
  assert.equal(realKstHour(T0 + 30 * 60_000), 12);
});

test('time of day on the game clock: 새벽 5–8, 낮 8–17, 저녁 17–20, 밤 20–5', () => {
  const g = gameDay(T0);
  const at = (h, m = 0) => gameTimeAt(g, h, m);
  assert.equal(timeOfDay(at(4, 59)), 'night');
  assert.equal(timeOfDay(at(5)), 'dawn');
  assert.equal(timeOfDay(at(7, 59)), 'dawn');
  assert.equal(timeOfDay(at(8)), 'day');
  assert.equal(timeOfDay(at(16, 59)), 'day');
  assert.equal(timeOfDay(at(17)), 'evening');
  assert.equal(timeOfDay(at(20)), 'night');
  assert.equal(isDaytime(at(12)), true);
  assert.equal(isNighttime(at(12)), false);
  assert.equal(isDaytime(at(6)) && isNighttime(at(6)), true, 'dawn counts as both');
  // Real 22:00 KST is game midnight: night whatever the real hour says.
  const real22 = dayStart(DAY0) + 22 * HOUR;
  assert.equal(timeOfDay(real22), 'night');
  assert.equal(timeOfDay(real22 + 30 * 60_000), 'day');
  // Every real hour has every time of day: 7.5 / 22.5 / 7.5 / 22.5 real minutes.
  const seen = { dawn: 0, day: 0, evening: 0, night: 0 };
  for (let t = T0; t < T0 + HOUR; t += GAME_MINUTE_MS) seen[timeOfDay(t)]++;
  const realMinutes = Object.fromEntries(Object.entries(seen).map(([k, n]) => [k, (n * GAME_MINUTE_MS) / 60_000]));
  assert.deepEqual(realMinutes, { dawn: 7.5, day: 22.5, evening: 7.5, night: 22.5 });
  // Lighting and its phase follow the same clock.
  assert.equal(dayPhase(at(12)), 'day');
  assert.equal(dayPhase(at(22)), 'night');
  assert.equal(dayLighting(at(13)).lamps, 0);
  assert.equal(dayLighting(at(1)).lamps, 1);
});

test('HUD clock text in ten-minute steps', () => {
  const g = gameDay(T0);
  assert.equal(gameClockText(gameTimeAt(g, 0)), '오전 12:00');
  assert.equal(gameClockText(gameTimeAt(g, 9, 5)), '오전 9:00');
  assert.equal(gameClockText(gameTimeAt(g, 12, 10)), '오후 12:10');
  assert.equal(gameClockText(gameTimeAt(g, 15, 29)), '오후 3:20');
  assert.equal(gameClockText(gameTimeAt(g, 23, 59)), '오후 11:50');
});

test('game days never straddle a real KST midnight; daily resets stay on the real day', () => {
  for (let g = gameDay(dayStart(DAY0)) - 30; g < gameDay(dayStart(DAY0)) + 30; g++)
    assert.equal(realDayOfGameDay(g), kstDay(gameDayStart(g) + GAME_DAY_MS - 1), `game day ${g}`);
  assert.equal(realDayOfGameDay(gameDay(dayStart(DAY0))), DAY0, 'the real 00:00 hour starts the real day');
  assert.equal(realDayOfGameDay(gameDay(dayStart(DAY0)) - 1), DAY0 - 1, 'the real 23:00 hour ends the day before');
  assert.equal(gameTimeOnDay(DAY0, 6, 30), dayStart(DAY0) + 12 * HOUR + 6.5 * GAME_HOUR_MS);
  // Foraging is once per spot per real day: a later game day of the same
  // real day is still "already foraged"; the next real day is a new day.
  const spot = SPAWN_SPOTS.find((sp) => !sp.flag && forageAt(sp.id, DAY0) && forageAt(sp.id, DAY0 + 1));
  assert.ok(spot, 'a spot with forage two days running');
  const m = { id: '11111111-1111-4111-8111-111111111111', actor: 0 };
  let life = ensureLifeMember(emptyLife(), m.id, 0),
    ledger = registerWallet(newLoungeLedger(), 'wallet-' + m.id);
  const act = (now) => {
    const r = lifeAction(life, ledger, m, { kind: 'forage', spot: spot.id }, now);
    life = r.life;
    ledger = r.ledger;
  };
  act(gameTimeOnDay(DAY0, 9, 0, 10));
  assert.throws(() => act(gameTimeOnDay(DAY0, 9, 0, 11)), (e) => e instanceof LifeError && e.message === PLUS_REJECT.foraged, 'the next game day, same real day');
  assert.throws(() => act(gameTimeOnDay(DAY0, 9, 0, 23)), (e) => e instanceof LifeError && e.message === PLUS_REJECT.foraged, 'the last game day of the real day');
  act(gameTimeOnDay(DAY0 + 1, 9, 0, 0));
});

test('fish time windows are read on the game clock', () => {
  const eel = FISH_BY_ID.eel; // night, rain, game hours 20–4
  // Its season and rain are given; only the clock varies.
  const day = DAY0;
  const ctx = (now, extra = {}) => ({ weather: 'rain', now, ...extra });
  const season = eel.seasons[0];
  const lateGame = gameTimeOnDay(day, 22);
  assert.equal(fishAvailable(eel, ctx(lateGame, { season })), true, 'game 22:00 in a real noon hour');
  assert.equal(fishAvailable(eel, ctx(gameTimeOnDay(day, 12), { season })), false, 'game noon');
  // Real 22:00 KST is game midnight → in the window; real 22:30 is game noon → out.
  const real22 = dayStart(day) + 22 * HOUR;
  assert.equal(fishAvailable(eel, ctx(real22 + 10 * GAME_MINUTE_MS, { season })), true);
  assert.equal(fishAvailable(eel, ctx(real22 + 30 * 60_000, { season })), false);
});

test('resident schedules: game-clock hours, real weekdays', () => {
  const dayWith = (wd) => {
    for (let d = 0; d < 7; d++) if (weekdayOf(DAY0 + d) === wd) return DAY0 + d;
  };
  // Every game day is a whole day plan; the plan's weekday is the real day's.
  const mon = dayWith(1),
    tue = dayWith(2);
  for (const slot of [0, 9, 23]) {
    assert.equal(npcSpot('realtor', gameTimeOnDay(mon, 11, 0, slot)).place, 'realty-in', `Monday (real), game 11:00, hour ${slot}`);
    assert.equal(npcSpot('misun', gameTimeOnDay(tue, 11, 0, slot)).place, 'realty-in', `Tuesday (real), game 11:00, hour ${slot}`);
  }
  assert.deepEqual(realtyDuty(weekdayOf(mon)).counter, 'realtor');
  // Same game time on the same real day: the same plan (seeds aside, a shop owner is at work).
  assert.equal(npcSpot('nasera', gameTimeOnDay(mon, 7, 0, 3)).place, 'coop.owner');
  assert.equal(npcSpot('nasera', gameTimeOnDay(mon, 7, 0, 17)).place, 'coop.owner');
  // Everyone walking about sleeps at game 03:00, whatever the real hour.
  for (const slot of [2, 12, 21]) assert.equal(npcSpot('thresh', gameTimeOnDay(mon, 3, 0, slot)).activity, 'sleep');
  // The timeline spans exactly one game day and is the same for the same day.
  const g = gameDay(gameTimeOnDay(mon, 0));
  const ev = npcTimeline('frieren', g);
  assert.equal(ev[0].t0, gameDayStart(g));
  assert.ok(ev.at(-1).t1 >= gameDayStart(g + 1));
  assert.deepEqual(npcPlan('frieren', g), npcPlan('frieren', g));
  // Residents leave early enough to be at work on time (walks keep real seconds).
  assert.equal(npcSpot('himmel', gameTimeOnDay(mon, 8, 0)).place, 'bakery.helper');
  // A married spouse is home 01–08 on the game clock.
  assert.equal(spouseAtHome('lumi', gameTimeOnDay(mon, 3)), true);
  assert.equal(spouseAtHome('lumi', gameTimeOnDay(mon, 14)), false);
});

test('events: real weekday + game hours, and when they open next', () => {
  const g = gameDay(T0);
  assert.deepEqual([...AUCTION_HOURS], [5, 8]);
  assert.equal(auctionOpen(gameTimeAt(g, 4, 59)), false);
  assert.equal(auctionOpen(gameTimeAt(g, 5)), true);
  assert.equal(auctionOpen(gameTimeAt(g, 7, 59)), true);
  assert.equal(auctionOpen(gameTimeAt(g, 8)), false);
  // The auction opens every game day: never more than an hour away.
  for (let t = T0; t < T0 + 3 * HOUR; t += 7 * 60_000) {
    const next = nextSlot(t, [0, 1, 2, 3, 4, 5, 6], AUCTION_HOURS[0]);
    assert.ok(next >= t && next - t <= HOUR, 'next dawn auction within the hour');
    assert.equal(gameHour(next), 5);
    assert.equal(gameMinute(next), 0);
  }
  // 독서 모임: real Wednesday only, game 18–22.
  let wed = DAY0;
  while (weekdayOf(wed) !== READING_WEEKDAY) wed++;
  assert.equal(readingOpen(gameTimeOnDay(wed, 19)), true);
  assert.equal(readingOpen(gameTimeOnDay(wed, 17)), false);
  assert.equal(readingOpen(gameTimeOnDay(wed - 1, 19)), false);
  const next = nextSlot(dayStart(wed) - 3 * HOUR, [READING_WEEKDAY], 18);
  assert.equal(kstDay(next), wed);
  assert.equal(gameHour(next), 18);
  assert.equal(next, gameTimeOnDay(wed, 18, 0, 0), 'the first game evening of the real Wednesday');
  assert.equal(nextGameTime(T0, 0), T0);
  // 공연 밤 (Tue/Fri), 등불 상점 (Sat), 카지노의 밤 (Fri): real weekday, game hours.
  let tue = DAY0,
    fri = DAY0,
    sat = DAY0;
  while (weekdayOf(tue) !== 2) tue++;
  while (weekdayOf(fri) !== 5) fri++;
  while (weekdayOf(sat) !== 6) sat++;
  assert.equal(showNight(gameTimeOnDay(tue, 20)), true);
  assert.equal(showNight(gameTimeOnDay(tue, 12)), false);
  assert.equal(lanternOpen(gameTimeOnDay(sat, 23)), true);
  assert.equal(lanternOpen(gameTimeOnDay(sat, 2)), true, 'past game midnight');
  assert.equal(lanternOpen(gameTimeOnDay(sat, 12)), false);
  assert.equal(lanternOpen(gameTimeOnDay(fri, 23)), false);
  assert.equal(weeklyActive('casino', gameTimeOnDay(fri, 19)), true);
  assert.equal(weeklyActive('casino', gameTimeOnDay(fri, 10)), false);
  assert.equal(inGameHours(gameTimeOnDay(fri, 5, 59), 18, 6), true);
  assert.equal(inGameHours(gameTimeOnDay(fri, 6), 18, 6), false);
});
