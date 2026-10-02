// 생일 잔치: on a friend's birthday a cake stands in the plaza and every OTHER
// friend may sign that friend's 축하 방명록 once (그해 한 번), which gives the
// signer a small mood lift and a little friendship with the birthday friend.
// The morning village news says whose birthday it is (one line for a shared
// day: 도원·민서). Pure and `now`-injected; the hohyeon-api Edge function runs
// the same code. Currency is never touched (the 10,000범 birthday claim stays
// the only 범 of the day, lounge-calendar.ts BIRTHDAY_CLAIM).
//
// Saved: life.bdayBook = { 'actor-YYYY': [signer actors in signing order] }.
import { kstDay } from './lounge-economy.ts';
import { ACTOR_NAMES, birthdayActors, kstDate } from './lounge-calendar.ts';
import { LifeError, type LifeState } from './lounge-life.ts';
import { addBond, addMemory, addNews } from './lounge-life-plus.ts';

export type BirthdayAction = { kind: 'birthdayCheer'; to: number };
/** Friendship for signing a birthday friend's 방명록 (a gift is 20, a visit 8). */
export const BIRTHDAY_SIGN_BOND = 10;
/** How many books (birthday person × year) stay saved: every friend, about three years. */
export const BDAY_BOOK_KEEP = 21;
/** The plaza cake (village world units): south-west of the fountain, clear of the festival booth and the board. */
export const BIRTHDAY_CAKE_POINT = { x: -4.2, z: 3.4 } as const;
/** Where to stand to use the cake (the banner's "축하하러 가기" walks here). */
export const BIRTHDAY_CAKE_FRONT = { x: -4.2, z: 4.3 } as const;
/** How close (world units) the server wants you to the cake (network positions lag a little). */
export const BIRTHDAY_CAKE_REACH = 6;
export type BirthdayBook = Record<string, number[]>;

const actorOk = (a: unknown): a is number => typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < ACTOR_NAMES.length;
const fail = (text: string): never => {
  throw new LifeError(text);
};
/** 'actor-YYYY' of the birthday friend's book for the KST year of `day`. */
export const bdayBookKey = (actor: number, day: number) => `${actor}-${kstDate(day).slice(0, 4)}`;

/** Validates a saved book: known keys, signers 0–6 once each, never the birthday friend. */
export function readBdayBook(v: unknown): BirthdayBook | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: BirthdayBook = {};
  for (const [key, list] of Object.entries(v as Record<string, unknown>).slice(-BDAY_BOOK_KEEP * 2)) {
    const m = /^([0-6])-(\d{4})$/.exec(key);
    if (!m || !Array.isArray(list)) continue;
    const owner = Number(m[1]);
    const signers = [...new Set(list.filter((a): a is number => actorOk(a) && a !== owner))].slice(0, ACTOR_NAMES.length - 1);
    if (signers.length) out[key] = signers;
  }
  const keys = Object.keys(out);
  for (const key of keys.slice(0, Math.max(0, keys.length - BDAY_BOOK_KEEP))) delete out[key];
  return keys.length ? out : undefined;
}

/** "도원", "도원·민서" (a shared birthday reads as one). */
export const birthdayNames = (actors: readonly number[]) => actors.map((a) => ACTOR_NAMES[a] ?? '친구').join('·');
/** The morning news line of a birthday day. */
export const birthdayNewsText = (actors: readonly number[]) => `오늘은 ${birthdayNames(actors)}의 생일이에요 🎂`;
/** The same line in the next day's digest ("어제 마을 소식"). */
export const birthdayPastText = (actors: readonly number[]) => `${birthdayNames(actors)}의 생일이었어요 🎂`;

/**
 * Today's birthday banners for `self`: my own birthday stays its own banner
 * (with its [받기]); everyone else's birthdays of the day are ONE banner, so
 * 도원·민서's shared day does not show two duplicate banners.
 */
export function birthdayBanners(events: readonly { id: string; kind: string; actor?: number }[], self: number) {
  const days = events.filter((e) => e.kind === 'birthday' && actorOk(e.actor));
  const others = days.filter((e) => e.actor !== self);
  const out: { ids: string[]; actors: number[]; mine: boolean; text: string }[] = days
    .filter((e) => e.actor === self)
    .map((e) => ({ ids: [e.id], actors: [self], mine: true, text: '생일 축하해요!' }));
  if (others.length)
    out.push({
      ids: others.map((e) => e.id),
      actors: others.map((e) => e.actor!),
      mine: false,
      text:
        others.length > 1
          ? `오늘은 ${birthdayNames(others.map((e) => e.actor!))} 생일이에요! 광장 케이크에서 축하해 주세요.`
          : `오늘은 ${birthdayNames([others[0].actor!])} 생일이에요! 선물은 추억이 세 배예요.`,
    });
  return out;
}

/**
 * The morning news: once per birthday (day) per year, one line for everyone
 * born that day. Called after every life action (addNews ignores a repeat key).
 */
export function settleBirthdayNews(life: LifeState, now: number) {
  const day = kstDay(now),
    actors = birthdayActors(day);
  if (!actors.length) return;
  const key = `bday:${actors.join('-')}:${kstDate(day).slice(0, 4)}`;
  if (life.news?.find((d) => d.day === day)?.lines.some((l) => l.key === key)) return;
  addNews(life, now, key, 'birthday', birthdayNewsText(actors), actors);
}

/** 축하하기 at the plaza cake (the cloud checks you stand in the village near it). */
export function birthdayCheer(life: LifeState, member: { id: string; actor: number }, a: BirthdayAction, now: number) {
  const day = kstDay(now),
    today = birthdayActors(day);
  if (!actorOk(a.to)) fail('누구의 생일인지 확인해 주세요.');
  if (!today.includes(a.to)) fail(`오늘은 ${ACTOR_NAMES[a.to]}의 생일이 아니에요.`);
  if (a.to === member.actor) fail('내 방명록에는 친구들이 축하를 남겨 줘요.');
  const key = bdayBookKey(a.to, day);
  const book = (life.bdayBook ??= {});
  const signers = book[key] ?? [];
  if (signers.includes(member.actor)) fail(`${ACTOR_NAMES[a.to]}의 방명록에는 이미 축하를 남겼어요.`);
  book[key] = [...signers, member.actor];
  // Oldest books go first (the keys are written in time order).
  const keys = Object.keys(book);
  for (const old of keys.slice(0, Math.max(0, keys.length - BDAY_BOOK_KEEP))) delete book[old];
  addBond(life, member.actor, a.to, BIRTHDAY_SIGN_BOND, now);
  if (!signers.length) addMemory(life, now, 'birthday', [a.to, member.actor], `${ACTOR_NAMES[member.actor]}이(가) ${ACTOR_NAMES[a.to]}의 생일 방명록에 첫 축하를 남겼어요`);
}

/** Cloud check: in the village, by the cake. */
export function assertBirthdayContext(area: string, at: { x: number; z: number } | null) {
  if (area !== 'village' || !at) fail('마을 광장의 생일 케이크 앞에서 축하해 주세요.');
  if (Math.hypot(at!.x - BIRTHDAY_CAKE_POINT.x, at!.z - BIRTHDAY_CAKE_POINT.z) > BIRTHDAY_CAKE_REACH) fail('생일 케이크 곁으로 조금 더 가까이 가 주세요.');
}

export type BirthdayView = {
  /** Today's birthday friends (actors). */
  today: number[];
  /** Today's books: birthday actor → who signed it. */
  books: Record<number, number[]>;
  /** Who signed my own book this year (kept after the day). */
  mine: number[];
};
export function birthdayView(life: LifeState, actor: number, now: number): BirthdayView {
  const day = kstDay(now),
    today = birthdayActors(day),
    book = life.bdayBook ?? {};
  const year = kstDate(day).slice(0, 4);
  return {
    today,
    books: Object.fromEntries(today.map((a) => [a, [...(book[bdayBookKey(a, day)] ?? [])]])),
    mine: actorOk(actor) ? [...(book[`${actor}-${year}`] ?? [])] : [],
  };
}
