// 내일 예고 (D11): what the 결산 card shows about the next morning. Pure and
// `now`-injected; everything comes from the shared calendar, so every client
// and the server agree. "내일" is the KST day of the next 06:00 (when hand
// watering dries out): after midnight it is the day that has just begun.
import { SEASON_INFO, WEATHER_INFO, eventsOn, kstDate, seasonOfDay, weatherOf, weekdayOf, type Season, type Weather } from './lounge-calendar.ts';
import { kstDay } from './lounge-economy.ts';
import { nextWetEnd } from './lounge-farm-soil.ts';
import { READING_WEEKDAY, SHOW_WEEKDAYS, harborStallOn } from './lounge-town.ts';

export type ForecastEvent = { id: string; kind: 'holiday' | 'birthday' | 'weekly' | 'stall' | 'season'; name: string };
export type Forecast = {
  day: number;
  /** 'M월 D일'. */
  date: string;
  weather: Weather;
  weatherName: string;
  /** Rain waters the fields by itself. */
  waters: boolean;
  season: Season;
  events: ForecastEvent[];
};

export const forecastDay = (now: number) => kstDay(nextWetEnd(now) - 1);

export function forecastOf(now: number): Forecast {
  const day = forecastDay(now),
    weather = weatherOf(day),
    season = seasonOfDay(day),
    [, m, d] = kstDate(day).split('-').map(Number);
  const events: ForecastEvent[] = eventsOn(day, now).map((e) => ({ id: e.id, kind: e.kind, name: e.name }));
  const wd = weekdayOf(day);
  if (harborStallOn(day)) events.push({ id: 'stall-harbor', kind: 'stall', name: '항구 좌판' });
  if (wd === READING_WEEKDAY) events.push({ id: 'reading', kind: 'weekly', name: '독서 모임' });
  if ((SHOW_WEEKDAYS as readonly number[]).includes(wd)) events.push({ id: 'show', kind: 'weekly', name: '공연 밤' });
  if (seasonOfDay(day - 1) !== season) events.unshift({ id: `season-${season}`, kind: 'season', name: `${SEASON_INFO[season].name}이 시작돼요` });
  return { day, date: `${m}월 ${d}일`, weather, weatherName: WEATHER_INFO[weather].name, waters: WEATHER_INFO[weather].waters, season, events };
}
