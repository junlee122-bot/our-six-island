// 내일 예고 (D11): the 결산 card's next-morning forecast.
import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastDay, forecastOf } from '../app/lounge-forecast.ts';
import { birthdayActors, weatherOf, weekdayOf, ACTOR_NAMES, FRIEND_PROFILES } from '../app/lounge-calendar.ts';
import { kstDay } from '../app/lounge-economy.ts';

const HOUR = 3_600_000;
// 2026-10-07 22:00 KST and 2026-10-08 02:00 KST.
const EVENING = Date.UTC(2026, 9, 7, 13),
  NIGHT = Date.UTC(2026, 9, 7, 17);

test('내일 is the KST day of the next 06:00: the next day by evening, the day just begun after midnight', () => {
  assert.equal(forecastDay(EVENING), kstDay(EVENING) + 1);
  assert.equal(forecastDay(NIGHT), kstDay(NIGHT));
  assert.equal(forecastDay(NIGHT), forecastDay(EVENING));
  const f = forecastOf(EVENING);
  assert.equal(f.date, '10월 8일');
  assert.equal(f.weather, weatherOf(f.day));
  assert.ok(f.weatherName.length > 0);
});

test('forecast lists holidays, friend birthdays, 장날 and weekly events from the shared calendar', () => {
  // 한글날 (10-09).
  const hangeul = forecastOf(Date.UTC(2026, 9, 8, 13));
  assert.ok(hangeul.events.some((e) => e.kind === 'holiday' && e.name === '한글날'));
  // Every friend's birthday shows the evening before.
  for (const [actor, p] of FRIEND_PROFILES.entries()) {
    const [mm, dd] = p.birthday.split('-').map(Number);
    const eve = Date.UTC(2027, mm - 1, dd, 13) - 24 * HOUR;
    const f = forecastOf(eve);
    assert.ok(birthdayActors(f.day).includes(actor));
    assert.ok(f.events.some((e) => e.kind === 'birthday' && e.name.includes(ACTOR_NAMES[actor])), ACTOR_NAMES[actor]);
  }
  // A Saturday evening: tomorrow is Sunday's 일요 장터.
  let t = EVENING;
  while (weekdayOf(forecastDay(t)) !== 0) t += 24 * HOUR;
  assert.ok(forecastOf(t).events.some((e) => e.name === '일요 장터'));
});
