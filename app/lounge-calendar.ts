// 범타듀 밸리 calendar: seasons, KST days, deterministic weather, Korean
// holidays, the seven friends' birthdays and weekly village events. Pure and
// `now`-injected; safe to import in the client and the hohyeon-api Edge function.
import { kstDay } from './lounge-economy.ts';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_INFO: Record<Season, { name: string; emoji: string }> = {
  spring: { name: '봄', emoji: '🌸' },
  summer: { name: '여름', emoji: '🌻' },
  autumn: { name: '가을', emoji: '🍁' },
  winter: { name: '겨울', emoji: '❄️' },
};
/** Real days per season and per game year. */
export const SEASON_DAYS = 7;
export const YEAR_DAYS = SEASON_DAYS * SEASONS.length;
const DAY = 86_400_000,
  HOUR = 3_600_000,
  KST = 9 * HOUR;
/** KST day number of Monday 2026-09-07: spring, day 1 of year 1. */
export const CALENDAR_ANCHOR_DAY = 20_703;

/** FNV-1a 32-bit hash of a string (same family as lounge-life's fruit yield). */
export function hash32(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
/** Deterministic 0..n-1 from a key. */
export const pickIndex = (key: string, n: number) => (n > 0 ? hash32(key) % n : 0);

const mod = (a: number, n: number) => ((a % n) + n) % n;
export const dayStart = (day: number) => day * DAY - KST;
/** The 7-day season cycle alone (festival scheduling uses this). */
export const cycleSeasonOfDay = (day: number): Season =>
  SEASONS[mod(Math.floor((day - CALENDAR_ANCHOR_DAY) / SEASON_DAYS), 4)];
/**
 * The game season of a KST day. The 7-day cycle drifts against the real
 * lunar holidays (2027 설날 and 추석 would land in the game's summer), so a
 * holiday that carries a `season` pins its days to that season: 설날 is
 * always winter and 추석 always autumn, whatever the cycle says.
 */
export const seasonOfDay = (day: number): Season => holidaySeasonOf(day) ?? cycleSeasonOfDay(day);
export const seasonOf = (now: number) => seasonOfDay(kstDay(now));
/** 0 = Sunday … 6 = Saturday (KST). Day 0 (1970-01-01) was a Thursday. */
export const weekdayOf = (day: number) => mod(day + 4, 7);
export const kstHour = (now: number) => Math.floor(mod(now + KST, DAY) / HOUR);
export type TimeOfDay = 'dawn' | 'day' | 'evening' | 'night';
export function timeOfDay(now: number): TimeOfDay {
  const h = kstHour(now);
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'evening' : 'night';
}
/** Day or night for fish/bug rules (dawn and evening count as both). */
export const isDaytime = (now: number) => timeOfDay(now) !== 'night';
export const isNighttime = (now: number) => timeOfDay(now) !== 'day';
/** 'YYYY-MM-DD' in KST for a KST day number. */
export function kstDate(day: number) {
  return new Date(day * DAY).toISOString().slice(0, 10);
}
const monthDay = (day: number) => kstDate(day).slice(5);

// ---------------------------------------------------------------- friends
export type ItemCategory =
  | 'crop'
  | 'fruit'
  | 'fish'
  | 'bug'
  | 'forage'
  | 'flower'
  | 'material'
  | 'dish';
export type FriendProfile = {
  /** 'MM-DD' (KST). PLACEHOLDER: null = no birthday event until the user fills it in. */
  birthday: string | null;
  /** Gift tastes by item category. PLACEHOLDERS for the user to edit. */
  likes: ItemCategory[];
  dislikes: ItemCategory[];
};
/**
 * ============================================================
 *  PLACEHOLDER TABLE — fill in the real friends' data here.
 *  Index = actor (0 도원, 1 강재, 2 민서, 3 승준, 4 민재, 5 재민, 6 호현).
 *  birthday: 'MM-DD' or null (null = no birthday event).
 *  likes / dislikes: gift categories (crop, fruit, fish, bug, forage,
 *  flower, material, dish). Liked gifts give 2× friendship, disliked 0.2×.
 *  The values below are NOT real preferences; they only vary the game.
 * ============================================================
 */
export const FRIEND_PROFILES: readonly FriendProfile[] = [
  { birthday: null, likes: ['dish', 'flower'], dislikes: ['bug'] }, // 0 도원 (placeholder)
  { birthday: null, likes: ['fish', 'dish'], dislikes: ['flower'] }, // 1 강재 (placeholder)
  { birthday: null, likes: ['fruit', 'flower'], dislikes: ['material'] }, // 2 민서 (placeholder)
  { birthday: null, likes: ['bug', 'fish'], dislikes: ['forage'] }, // 3 승준 (placeholder)
  { birthday: null, likes: ['crop', 'forage'], dislikes: ['fish'] }, // 4 민재 (placeholder)
  { birthday: null, likes: ['dish', 'fruit'], dislikes: ['bug'] }, // 5 재민 (placeholder)
  { birthday: null, likes: ['material', 'crop'], dislikes: ['dish'] }, // 6 호현 (placeholder)
];
export const ACTOR_NAMES = ['도원', '강재', '민서', '승준', '민재', '재민', '호현'] as const;
/** Birthday bonus the birthday person may claim once on the day. */
export const BIRTHDAY_CLAIM = 10_000;
/** Friendship multiplier for gifts sent on the receiver's birthday. */
export const BIRTHDAY_GIFT_BONUS = 3;
export function birthdayActors(day: number, profiles: readonly FriendProfile[] = FRIEND_PROFILES) {
  const md = monthDay(day);
  return profiles.flatMap((p, actor) => (p.birthday === md ? [actor] : []));
}

// ---------------------------------------------------------------- holidays
export type CalendarEvent = {
  id: string;
  kind: 'holiday' | 'birthday' | 'weekly';
  name: string;
  emoji: string;
  text: string;
  actor?: number;
  /** 범 claimable once today with {kind:'claimEvent'} (absent = nothing to claim). */
  claim?: number;
  /** Weekly events with hours: false outside them. */
  active?: boolean;
};
type Holiday = {
  key: string;
  name: string;
  emoji: string;
  text: string;
  claim?: number;
  /** Fixed solar 'MM-DD' days, or explicit 'YYYY-MM-DD' lunar dates. */
  md?: string[];
  dates?: string[];
  /** Weather override while it lasts. */
  weather?: Weather;
  /** Season override while it lasts (calendar drift fix, see seasonOfDay). */
  season?: Season;
};
/** Lunar holidays are fixed tables for 2026–2028 (approximate, with the usual 3-day span). */
export const HOLIDAYS: readonly Holiday[] = [
  { key: 'newyear', name: '신정', emoji: '🎍', text: '새해 첫날 · 마을 모두에게 새해 인사', claim: 1_000, md: ['01-01'] },
  {
    key: 'seollal',
    name: '설날',
    emoji: '🧧',
    text: '세뱃돈을 받고 떡국을 끓여요',
    claim: 5_000,
    dates: [
      '2026-02-16', '2026-02-17', '2026-02-18',
      '2027-02-06', '2027-02-07', '2027-02-08',
      '2028-01-26', '2028-01-27', '2028-01-28',
    ],
    weather: 'sunny',
    season: 'winter',
  },
  { key: 'samiljeol', name: '삼일절', emoji: '🇰🇷', text: '태극기를 다는 날', md: ['03-01'] },
  { key: 'childrensday', name: '어린이날', emoji: '🎈', text: '마음만은 어린이 · 용돈을 받아요', claim: 2_000, md: ['05-05'], weather: 'sunny' },
  {
    key: 'buddha',
    name: '부처님오신날',
    emoji: '🏮',
    text: '연등이 마을을 밝혀요',
    dates: ['2026-05-24', '2027-05-13', '2028-05-02'],
  },
  { key: 'liberation', name: '광복절', emoji: '🇰🇷', text: '빛을 되찾은 날', md: ['08-15'] },
  {
    key: 'chuseok',
    name: '추석',
    emoji: '🌕',
    text: '보름달 아래 송편을 빚어요',
    claim: 5_000,
    dates: [
      '2026-09-24', '2026-09-25', '2026-09-26',
      '2027-09-14', '2027-09-15', '2027-09-16',
      '2028-10-02', '2028-10-03', '2028-10-04',
    ],
    weather: 'sunny',
    season: 'autumn',
  },
  { key: 'gaecheonjeol', name: '개천절', emoji: '⛰️', text: '하늘이 열린 날', md: ['10-03'] },
  { key: 'hangeul', name: '한글날', emoji: '📜', text: '한글로 방명록 한 줄 남기기 좋은 날', claim: 1_000, md: ['10-09'] },
  { key: 'halloween', name: '할로윈', emoji: '🎃', text: '호박이 주인공인 밤', md: ['10-31'] },
  { key: 'pepero', name: '빼빼로데이', emoji: '🍫', text: '친구에게 달콤한 선물을', md: ['11-11'] },
  { key: 'christmas', name: '크리스마스', emoji: '🎄', text: '눈 내리는 마을 · 선물을 나눠요', claim: 3_000, md: ['12-24', '12-25'], weather: 'snow' },
  { key: 'yearend', name: '한 해의 끝', emoji: '🎆', text: '올해도 고마웠어', md: ['12-31'] },
];
export function holidaysOn(day: number): Holiday[] {
  const date = kstDate(day),
    md = date.slice(5);
  return HOLIDAYS.filter((h) => h.md?.includes(md) || h.dates?.includes(date));
}
const holidaySeasonCache = new Map<number, Season | null>();
/** The season a holiday pins its day to (null = the normal cycle). */
export function holidaySeasonOf(day: number): Season | null {
  let season = holidaySeasonCache.get(day);
  if (season === undefined) {
    season = holidaysOn(day).find((h) => h.season)?.season ?? null;
    if (holidaySeasonCache.size > 256) holidaySeasonCache.clear();
    holidaySeasonCache.set(day, season);
  }
  return season;
}
/** Weekly village events (KST weekday). */
export const WEEKLY_EVENTS = [
  { key: 'fishing', weekday: 3, name: '수요 낚시의 날', emoji: '🎣', text: '물고기 판매가 +20%' },
  {
    key: 'casino',
    weekday: 5,
    name: '금요 카지노의 밤',
    emoji: '🎰',
    text: '18–24시 테이블 한 판을 마치면 500범 · 함께한 친구와 추억 2배',
    fromHour: 18,
  },
  { key: 'market', weekday: 0, name: '일요 장터', emoji: '🧺', text: '가구 상점 3종 더 · 10% 할인' },
] as const;
export type WeeklyKey = (typeof WEEKLY_EVENTS)[number]['key'];
export const FISH_DAY_BONUS = 0.2;
export const CASINO_NIGHT_BONUS = 500;
export const MARKET_EXTRA = 3;
export const MARKET_DISCOUNT = 10;
/** Whether a weekly event runs right now (hours included). */
export function weeklyActive(key: WeeklyKey, now: number) {
  const ev = WEEKLY_EVENTS.find((e) => e.key === key)!;
  if (weekdayOf(kstDay(now)) !== ev.weekday) return false;
  return !('fromHour' in ev) || kstHour(now) >= ev.fromHour;
}

// ---------------------------------------------------------------- weather
export type Weather = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow';
export const WEATHER_INFO: Record<Weather, { name: string; emoji: string; waters: boolean }> = {
  sunny: { name: '맑음', emoji: '☀️', waters: false },
  cloudy: { name: '흐림', emoji: '☁️', waters: false },
  rain: { name: '비', emoji: '🌧️', waters: true },
  storm: { name: '폭풍우', emoji: '⛈️', waters: true },
  snow: { name: '눈', emoji: '❄️', waters: false },
};
/** Percent weights per season (sum 100). Storms are rare; snow only in winter. */
export const WEATHER_ODDS: Record<Season, [Weather, number][]> = {
  spring: [['sunny', 45], ['cloudy', 25], ['rain', 26], ['storm', 4]],
  summer: [['sunny', 42], ['cloudy', 18], ['rain', 32], ['storm', 8]],
  autumn: [['sunny', 50], ['cloudy', 26], ['rain', 21], ['storm', 3]],
  winter: [['sunny', 35], ['cloudy', 28], ['snow', 32], ['rain', 5]],
};
const WEATHER_SALT = 'beomdew-weather-v1';
/** Deterministic weather of a KST day; every client and the server agree. */
export function weatherOf(day: number): Weather {
  const forced = holidaysOn(day).find((h) => h.weather)?.weather;
  if (forced) return forced;
  const roll = hash32(`${WEATHER_SALT}:${day}`) % 100;
  let acc = 0;
  for (const [w, p] of WEATHER_ODDS[seasonOfDay(day)]) {
    acc += p;
    if (roll < acc) return w;
  }
  return 'sunny';
}
export const rainsOn = (day: number) => WEATHER_INFO[weatherOf(day)].waters;

// ---------------------------------------------------------------- calendar view
export function eventsOn(
  day: number,
  now: number,
  profiles: readonly FriendProfile[] = FRIEND_PROFILES,
): CalendarEvent[] {
  const year = kstDate(day).slice(0, 4);
  const out: CalendarEvent[] = holidaysOn(day).map((h) => ({
    id: `${h.key}-${year}`,
    kind: 'holiday',
    name: h.name,
    emoji: h.emoji,
    text: h.text,
    ...(h.claim ? { claim: h.claim } : {}),
  }));
  for (const actor of birthdayActors(day, profiles))
    out.push({
      id: `birthday-${actor}-${year}`,
      kind: 'birthday',
      name: `${ACTOR_NAMES[actor]} 생일`,
      emoji: '🎂',
      text: `오늘은 ${ACTOR_NAMES[actor]}의 생일! 선물은 추억 ${BIRTHDAY_GIFT_BONUS}배`,
      actor,
      claim: BIRTHDAY_CLAIM,
    });
  const wd = weekdayOf(day);
  for (const ev of WEEKLY_EVENTS)
    if (ev.weekday === wd)
      out.push({
        id: `weekly-${ev.key}`,
        kind: 'weekly',
        name: ev.name,
        emoji: ev.emoji,
        text: ev.text,
        active: kstDay(now) === day ? weeklyActive(ev.key, now) : false,
      });
  return out;
}
export type CalendarView = {
  day: number;
  date: string;
  season: Season;
  seasonDay: number;
  yearDay: number;
  year: number;
  weekday: number;
  hour: number;
  timeOfDay: TimeOfDay;
  events: CalendarEvent[];
  seasonEndsAt: number;
  /** Set on holiday days that pin the season (e.g. 추석 → autumn). */
  seasonNote?: string;
};
export function calendarOf(now: number): CalendarView {
  const day = kstDay(now),
    rel = day - CALENDAR_ANCHOR_DAY,
    yearDay = mod(rel, YEAR_DAYS) + 1,
    seasonDay = mod(rel, SEASON_DAYS) + 1;
  return {
    day,
    date: kstDate(day),
    season: seasonOfDay(day),
    seasonDay,
    yearDay,
    year: Math.floor(rel / YEAR_DAYS) + 1,
    weekday: weekdayOf(day),
    hour: kstHour(now),
    timeOfDay: timeOfDay(now),
    events: eventsOn(day, now),
    seasonEndsAt: dayStart(day + (SEASON_DAYS - seasonDay + 1)),
    ...(holidaySeasonOf(day) && holidaySeasonOf(day) !== cycleSeasonOfDay(day)
      ? { seasonNote: `${holidaysOn(day).find((h) => h.season)!.name} 동안은 ${SEASON_INFO[holidaySeasonOf(day)!].name} 풍경이에요` }
      : {}),
  };
}
/** Claimable events today (holiday gifts; a birthday only for its person). */
export function claimableEvents(now: number, actor: number) {
  return eventsOn(kstDay(now), now).filter(
    (e) => (e.claim ?? 0) > 0 && (e.kind !== 'birthday' || e.actor === actor),
  );
}
