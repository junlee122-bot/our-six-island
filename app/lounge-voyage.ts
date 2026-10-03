// 먼바다 낚싯배 engine (handover/design/design-sea-fishing.md): boarding the
// captain's boat at the harbor pier, the 20-minute voyage (the fishing engine
// lets 'offshore' bite only while one is on), coming back by the clock or
// early, the catch summary, the captain's dawn knock for regulars and the
// 멀미약. Server-authoritative and deterministic: every state follows from the
// stored trip and the clock, so a voyage that ran out simply reads as "back"
// on the next command or read (nothing has to run at the 20-minute mark).
//
// State: `world.life.voyage` (absent in older worlds).
//
// Cycle-safe like lounge-fish-engine: lounge-life.ts imports this module and
// it imports the life modules back, so their bindings are only used inside
// functions, never at the top level.
import { grantBeom, kstDay, nextKstMidnight, spendBeom, type LoungeLedger } from './lounge-economy.ts';
import { ACTOR_NAMES, GAME_HOUR_MS, weatherOf, type Weather } from './lounge-calendar.ts';
import { companionNow } from './lounge-companion-effects.ts';
import { districtFlagsFor } from './lounge-districts.ts';
import { hasExplorerPass } from './lounge-explorer-pass.ts';
import { FISH_BY_ID } from './lounge-items.ts';
import { isNpcId } from './lounge-npc-data.ts';
import { LifeError, type LifeState } from './lounge-life.ts';
import { addInv, addNews, invCount } from './lounge-life-plus.ts';
import { growthMods, skillLevel } from './lounge-growth.ts';
import {
  BOARDING_MS,
  DAWN_FARE,
  DAWN_GUESTS,
  DAWN_LEAD_MS,
  PILL,
  PILL_PRICE,
  PILL_SELLERS,
  REGULAR_DAYS,
  REGULAR_TRIPS,
  SEATS,
  VOYAGE_FARE,
  VOYAGE_LEVEL,
  VOYAGE_MS,
  boardableSailing,
  boardingSailing,
  dawnId,
  inDawnHours,
  nextSailing,
  nightHarbor,
  sailingId,
  type VoyageAction,
} from './lounge-voyage-data.ts';

export const VOYAGE_REJECT = {
  locked: '항구 구역이 열리고 낚시 Lv4가 되면 샹크스의 배를 탈 수 있어요.',
  storm: '오늘은 폭풍이라 배가 뜨지 않아요(결항). 가붕이 전날 예보해 줘요.',
  today: '배는 하루에 한 번만 탈 수 있어요. 내일 또 와 주세요.',
  aboard: '이미 배에 타 있어요.',
  window: '지금은 승선 시간이 아니에요. 출항 2분 전부터 탈 수 있어요.',
  missed: '배가 방금 떠났어요. 다음 배를 타 주세요.',
  night: '밤에는 배가 쉬어요. 게임 시각 새벽 5시 배부터 다시 떠요.',
  full: '이 배는 자리가 다 찼어요(4명). 다음 배를 기다려 주세요.',
  balance: '승선료가 모자라요.',
  none: '타고 있는 배가 없어요.',
  notBack: '아직 항해 중이에요.',
  dawn: '새벽 초대 배를 찾을 수 없어요. 출항했거나 초대가 끝났어요.',
  knock: '지금은 샹크스가 찾아오지 않았어요.',
  guests: '함께 갈 친구를 확인해 주세요(최대 3명).',
  seller: '멀미약을 파는 곳이 아니에요.',
  pillNone: '멀미약이 없어요. 츠나데 텃밭에서 살 수 있어요.',
  pillToday: '오늘은 이미 멀미약을 먹었어요. 자정까지 효과가 있어요.',
  count: '개수를 확인해 주세요.',
} as const;
const fail = (message: string): never => {
  throw new LifeError(message);
};
/** Real KST hh:mm. */
const hhmm = (t: number) => {
  const d = new Date(t + 9 * 3_600_000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
/** When the next boat's boarding opens, in words. */
const nextBoardingText = (now: number) => {
  const open = nextSailing(now) - BOARDING_MS;
  return open <= now ? '' : ` 다음 배는 ${hhmm(open)}부터 탈 수 있어요(${Math.ceil((open - now) / 1000)}초 뒤).`;
};
const windowLine = (now: number) => (nightHarbor(now) ? VOYAGE_REJECT.night : VOYAGE_REJECT.window + nextBoardingText(now));
const missedLine = (now: number) => (boardingSailing(now) !== null ? VOYAGE_REJECT.missed : VOYAGE_REJECT.missed + nextBoardingText(now));

// ---------------------------------------------------------------- types
export type VoyageTrip = {
  /** Sailing id (sailingId / dawnId). */
  id: string;
  /** Departure (epoch ms). */
  dep: number;
  /** 범 paid. */
  fare: number;
  /** The captain's dawn sailing. */
  dawn?: true;
  /** 그만 돌아가기: when I went back early (no refund). */
  left?: number;
  /** What I landed on this voyage (fish id → count). */
  haul?: Record<string, number>;
  /** 재능 바다 체질: I stay out this much longer (one game hour). */
  more?: number;
  /** 주민 동행: extra time at sea with 샹크스 along (ms, one game hour at most). */
  x?: number;
};
/** 멀미약: a buff slot shaped like the food slots (lounge-food-data SlotBuff), until KST midnight. */
export type PillSlot = { kind: 'steady'; food: string; until: number };
export type VoyageUser = {
  trip?: VoyageTrip;
  /** KST days with a voyage (the last REGULAR_DAYS + 1). */
  days?: number[];
  /** The captain's dawn knock today and my answer. */
  knock?: { day: number; answer: 'yes' | 'no' };
  pill?: PillSlot;
  /** A friend took me along on their dawn boat. */
  guestOf?: { id: string; dep: number; from: number };
};
export type VoyageState = { u?: Record<string, VoyageUser> };
export type VoyageExt = { voyage?: VoyageState };

// ---------------------------------------------------------------- reading
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID = /^[sd][0-9]{1,12}(a[0-6])?$/;
const nat = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
function readTrip(v: unknown): VoyageTrip | undefined {
  const t = obj(v);
  if (typeof t.id !== 'string' || !ID.test(t.id) || !nat(t.dep) || !nat(t.fare) || t.fare > 1_000_000) return;
  const out: VoyageTrip = { id: t.id, dep: t.dep, fare: t.fare };
  if (t.dawn === true) out.dawn = true;
  if (nat(t.left)) out.left = t.left;
  if (nat(t.more) && t.more > 0) out.more = Math.min(GAME_HOUR_MS, t.more);
  if (nat(t.x) && t.x > 0) out.x = Math.min(t.x, GAME_HOUR_MS);
  const haul: Record<string, number> = {};
  for (const [id, n] of Object.entries(obj(t.haul)).slice(0, 80)) if (Object.hasOwn(FISH_BY_ID, id) && nat(n) && n > 0) haul[id] = Math.min(9_999, n);
  if (Object.keys(haul).length) out.haul = haul;
  return out;
}
function readUser(v: unknown): VoyageUser | undefined {
  const x = obj(v),
    out: VoyageUser = {};
  const trip = readTrip(x.trip);
  if (trip) out.trip = trip;
  if (Array.isArray(x.days)) {
    const days = [...new Set(x.days.filter(nat))].sort((a, b) => a - b).slice(-(REGULAR_DAYS + 1));
    if (days.length) out.days = days;
  }
  const k = obj(x.knock);
  if (nat(k.day) && (k.answer === 'yes' || k.answer === 'no')) out.knock = { day: k.day, answer: k.answer };
  const p = obj(x.pill);
  if (p.kind === 'steady' && p.food === PILL && nat(p.until)) out.pill = { kind: 'steady', food: PILL, until: p.until };
  const g = obj(x.guestOf);
  if (typeof g.id === 'string' && ID.test(g.id) && nat(g.dep) && nat(g.from) && g.from < 7) out.guestOf = { id: g.id, dep: g.dep, from: g.from };
  return Object.keys(out).length ? out : undefined;
}
/** Normalizes `world.life.voyage` (every key omitted when empty, so older worlds read as before). */
export function readVoyage(value: unknown): VoyageExt {
  const u: Record<string, VoyageUser> = {};
  for (const [uid, x] of Object.entries(obj(obj(value).u)).slice(0, 32)) {
    if (!UUID.test(uid) || Object.keys(u).length >= 16) continue;
    const r = readUser(x);
    if (r) u[uid] = r;
  }
  return Object.keys(u).length ? { voyage: { u } } : {};
}

// ---------------------------------------------------------------- rules
/** When a trip is over: 20 minutes after it left, or when I went back early. */
export const tripEnd = (t: VoyageTrip) => Math.min(t.dep + VOYAGE_MS + (t.more ?? 0) + (t.x ?? 0), t.left ?? Infinity);
export type TripPhase = 'boarding' | 'sailing' | 'back';
export const tripPhase = (t: VoyageTrip, now: number): TripPhase => (now < t.dep ? 'boarding' : now < tripEnd(t) ? 'sailing' : 'back');
const userOf = (life: LifeState, uid: string): VoyageUser => (((life.voyage ??= {}).u ??= {})[uid] ??= {});
/** The trip I am out on right now (`early`: a few seconds' clock slack for the area check). */
export function voyageAt(life: LifeState, uid: string, now: number, early = 0): VoyageTrip | null {
  const t = life.voyage?.u?.[uid]?.trip;
  return t && now + early >= t.dep && now < tripEnd(t) ? t : null;
}
/** Friends on one sailing (boarded, not stepped off). */
export function seatsTaken(life: LifeState, id: string): string[] {
  return Object.entries(life.voyage?.u ?? {})
    .filter(([, x]) => x.trip?.id === id)
    .map(([uid]) => uid);
}
export const pillOn = (life: LifeState, uid: string, now: number) => {
  const p = life.voyage?.u?.[uid]?.pill;
  return !!p && now < p.until;
};
/** The swell on the catch zone by today's sky (0 after a 멀미약). */
export const SWAY: Record<Weather, number> = { sunny: 220, cloudy: 320, snow: 420, rain: 480, storm: 600 };
export function voyageSway(life: LifeState, uid: string, now: number): number {
  // 재능 바다 체질 or 주민 동행 with 샹크스: never seasick.
  return pillOn(life, uid, now) || growthMods(life, uid).seaLegs || companionNow(life, uid, now) === 'captain' ? 0 : SWAY[weatherOf(kstDay(now))];
}
/** 재능 바다 체질: one game hour more on board. */
const seaMore = (life: LifeState, uid: string) => (growthMods(life, uid).seaLegs ? { more: GAME_HOUR_MS } : {});
/** Whether the boat runs today (폭풍 = 결항). */
export const sailsOn = (day: number) => weatherOf(day) !== 'storm';
/** Voyage days in the REGULAR_DAYS before today. */
export function recentTrips(life: LifeState, uid: string, now: number): number {
  const today = kstDay(now);
  return (life.voyage?.u?.[uid]?.days ?? []).filter((d) => d < today && d >= today - REGULAR_DAYS).length;
}
const unlocked = (life: LifeState, uid: string, now: number) =>
  districtFlagsFor(life.flags, hasExplorerPass(life.actors[uid], now)).includes('district-harbor') && skillLevel(life, uid, 'fish') >= VOYAGE_LEVEL;
const sailedToday = (life: LifeState, uid: string, now: number) => (life.voyage?.u?.[uid]?.days ?? []).includes(kstDay(now));
/**
 * Whether the captain comes to my door now (새벽 초대): dawn hours, a regular
 * (REGULAR_TRIPS voyage days in the last week), not asked yet today, no
 * voyage today, the boat open to me and running.
 */
export function dawnKnock(life: LifeState, uid: string, now: number): boolean {
  const day = kstDay(now),
    x = life.voyage?.u?.[uid];
  return (
    inDawnHours(now) &&
    x?.knock?.day !== day &&
    !sailedToday(life, uid, now) &&
    sailsOn(day) &&
    unlocked(life, uid, now) &&
    recentTrips(life, uid, now) >= REGULAR_TRIPS
  );
}
const markDay = (u: VoyageUser, day: number) => {
  u.days = [...new Set([...(u.days ?? []), day])].sort((a, b) => a - b).slice(-(REGULAR_DAYS + 1));
};
const unmarkDay = (u: VoyageUser, day: number) => {
  u.days = (u.days ?? []).filter((d) => d !== day);
  if (!u.days.length) delete u.days;
};
const nameOf = (actor: number) => ACTOR_NAMES[actor] ?? '친구';
const uidOfActor = (life: LifeState, actor: number) => Object.keys(life.actors).find((id) => life.actors[id] === actor);

/** Fishing engine hook: a catch at 'offshore' goes in the trip's haul. */
export function noteVoyageCatch(life: LifeState, uid: string, fish: string, now: number) {
  const t = voyageAt(life, uid, now);
  if (!t) return;
  const haul = (t.haul ??= {});
  haul[fish] = Math.min(9_999, (haul[fish] ?? 0) + 1);
}

// ---------------------------------------------------------------- actions
export function voyageAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: VoyageAction,
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  const uid = member.id,
    wallet = 'wallet-' + uid,
    day = kstDay(now);
  let next = ledger;
  const u = userOf(life, uid);
  const pay = (fare: number, reason: string) => {
    if ((next.accounts[wallet] ?? 0) < fare) fail(VOYAGE_REJECT.balance);
    next = spendBeom(next, wallet, fare, `life-${reason}-${uid}-${++life.seq}`, now, 'voyage');
  };
  const ready = () => {
    if (!unlocked(life, uid, now)) fail(VOYAGE_REJECT.locked);
    if (!sailsOn(day)) fail(VOYAGE_REJECT.storm);
    if (u.trip && tripPhase(u.trip, now) !== 'back') fail(VOYAGE_REJECT.aboard);
    if (sailedToday(life, uid, now)) fail(VOYAGE_REJECT.today);
  };
  switch (a.kind) {
    case 'voyageBoard': {
      ready();
      if (a.dawn !== undefined) {
        const g = u.guestOf;
        if (typeof a.dawn !== 'string' || !g || g.id !== a.dawn || now >= g.dep) fail(VOYAGE_REJECT.dawn);
        if (seatsTaken(life, g!.id).length >= SEATS) fail(VOYAGE_REJECT.full);
        pay(DAWN_FARE, 'voyage');
        u.trip = { id: g!.id, dep: g!.dep, fare: DAWN_FARE, dawn: true, ...seaMore(life, uid) };
        delete u.guestOf;
      } else {
        // The server decides the boat: the one boarding now, or one that left
        // less than BOARD_GRACE_MS ago (a tap on the countdown's last second).
        // When the board showed me a boat (`sailing`), only that boat: a late tap
        // is told it missed it, never moved onto the next one.
        const dep = boardableSailing(now);
        if (a.sailing !== undefined) {
          if (!nat(a.sailing)) fail(VOYAGE_REJECT.window);
          if (dep !== a.sailing) fail(a.sailing < now ? missedLine(now) : windowLine(now));
        }
        if (dep === null) fail(windowLine(now));
        const id = sailingId(dep!);
        if (seatsTaken(life, id).length >= SEATS) fail(VOYAGE_REJECT.full);
        pay(VOYAGE_FARE, 'voyage');
        u.trip = { id, dep: dep!, fare: VOYAGE_FARE, ...seaMore(life, uid) };
      }
      markDay(u, day);
      break;
    }
    case 'voyageLeave': {
      const t = u.trip;
      if (!t || tripPhase(t, now) === 'back') fail(VOYAGE_REJECT.none);
      if (now < t!.dep) {
        // Off the gangway before the boat leaves: the fare comes back and the day is free again.
        if (Object.hasOwn(next.accounts, wallet) && t!.fare > 0)
          next = grantBeom(next, wallet, t!.fare, `life-voyage-refund-${uid}-${++life.seq}`, now, 'voyage-refund');
        delete u.trip;
        unmarkDay(u, kstDay(t!.dep));
      } else t!.left = now;
      break;
    }
    case 'voyageDone': {
      if (!u.trip) fail(VOYAGE_REJECT.none);
      if (tripPhase(u.trip!, now) !== 'back') fail(VOYAGE_REJECT.notBack);
      delete u.trip;
      break;
    }
    case 'voyageInvite': {
      if (!dawnKnock(life, uid, now)) fail(VOYAGE_REJECT.knock);
      if (a.answer === 'no') {
        u.knock = { day, answer: 'no' };
        break;
      }
      if (a.answer !== 'yes') fail(VOYAGE_REJECT.knock);
      const guests = a.guests ?? [];
      if (!Array.isArray(guests) || guests.length > DAWN_GUESTS || new Set(guests).size !== guests.length) fail(VOYAGE_REJECT.guests);
      const guestUids = guests.map((g) => {
        const id = typeof g === 'number' && Number.isInteger(g) && g !== member.actor ? uidOfActor(life, g) : undefined;
        return id ?? fail(VOYAGE_REJECT.guests);
      });
      ready();
      pay(DAWN_FARE, 'voyage');
      const dep = now + DAWN_LEAD_MS,
        id = dawnId(dep, member.actor);
      u.trip = { id, dep, fare: DAWN_FARE, dawn: true, ...seaMore(life, uid) };
      u.knock = { day, answer: 'yes' };
      markDay(u, day);
      for (const g of guestUids) userOf(life, g).guestOf = { id, dep, from: member.actor };
      addNews(life, now, `dawnboat:${member.actor}`, 'event', `샹크스가 ${nameOf(member.actor)}의 문을 두드렸어요. 새벽 배가 떠요!`, [member.actor]);
      break;
    }
    case 'pillBuy': {
      const seller = PILL_SELLERS.find((s) => s.npc === a.from);
      if (!seller || !isNpcId(seller.npc)) fail(VOYAGE_REJECT.seller);
      const n = a.n ?? 1;
      if (!Number.isInteger(n) || n < 1 || n > 5) fail(VOYAGE_REJECT.count);
      if ((next.accounts[wallet] ?? 0) < PILL_PRICE * n) fail(VOYAGE_REJECT.balance);
      next = spendBeom(next, wallet, PILL_PRICE * n, `life-pill-${uid}-${++life.seq}`, now, 'buy-pill');
      addInv(life, uid, PILL, n);
      break;
    }
    case 'pillTake': {
      if (pillOn(life, uid, now)) fail(VOYAGE_REJECT.pillToday);
      if (invCount(life, uid, PILL) < 1) fail(VOYAGE_REJECT.pillNone);
      addInv(life, uid, PILL, -1);
      u.pill = { kind: 'steady', food: PILL, until: nextKstMidnight(now) };
      break;
    }
    default:
      fail('요청을 처리할 수 없어요.');
  }
  // Old pills and invitations fall away.
  if (u.pill && now >= u.pill.until) delete u.pill;
  if (u.guestOf && now >= u.guestOf.dep) delete u.guestOf;
  if (!Object.keys(u).length) delete life.voyage?.u?.[uid];
  return { life, ledger: next };
}
/** Where a voyage action must be done (the cloud engine checks it against the real player). */
export function voyageActionArea(a: VoyageAction): string | null {
  if (a.kind === 'voyageBoard') return 'harbor';
  if (a.kind === 'pillBuy') return PILL_SELLERS.find((s) => s.npc === a.from)?.area ?? null;
  return null;
}

// ---------------------------------------------------------------- view
export type VoyageView = {
  /** Boat open to me (항구 + Lv4). */
  unlocked: boolean;
  level: number;
  fare: number;
  dawnFare: number;
  /** 결항 today / tomorrow (가붕's forecast). */
  storm: boolean;
  stormTomorrow: boolean;
  /** The departure boarding now (null between windows) and the next one. */
  boarding: { dep: number; id: string; seats: number } | null;
  next: number;
  sailedToday: boolean;
  trip: (VoyageTrip & { phase: TripPhase; endsAt: number; seats: number[] }) | null;
  /** The captain is at my door (새벽 초대). */
  knock: boolean;
  recent: number;
  /** A friend's dawn boat I may board at the pier. */
  guestOf: { id: string; dep: number; from: number } | null;
  pillUntil: number | null;
  /** Friends on boats right now (minimap, "친구에게 가기"). */
  sailing: number[];
};
export function voyageView(life: LifeState, uid: string, now: number): VoyageView {
  const day = kstDay(now),
    x = life.voyage?.u?.[uid],
    dep = boardingSailing(now);
  const t = x?.trip ?? null;
  const actorsOn = (id: string) => seatsTaken(life, id).map((u) => life.actors[u]).filter((a): a is number => a !== undefined);
  return {
    unlocked: unlocked(life, uid, now),
    level: VOYAGE_LEVEL,
    fare: VOYAGE_FARE,
    dawnFare: DAWN_FARE,
    storm: !sailsOn(day),
    stormTomorrow: !sailsOn(day + 1),
    boarding: dep === null ? null : { dep, id: sailingId(dep), seats: seatsTaken(life, sailingId(dep)).length },
    next: nextSailing(now),
    sailedToday: sailedToday(life, uid, now),
    trip: t ? { ...structuredClone(t), phase: tripPhase(t, now), endsAt: tripEnd(t), seats: actorsOn(t.id) } : null,
    knock: dawnKnock(life, uid, now),
    recent: recentTrips(life, uid, now),
    guestOf: x?.guestOf && now < x.guestOf.dep ? { ...x.guestOf } : null,
    pillUntil: x?.pill && now < x.pill.until ? x.pill.until : null,
    sailing: Object.entries(life.voyage?.u ?? {})
      .filter(([id]) => voyageAt(life, id, now))
      .map(([id]) => life.actors[id])
      .filter((a): a is number => a !== undefined),
  };
}
export { BOARDING_MS };
