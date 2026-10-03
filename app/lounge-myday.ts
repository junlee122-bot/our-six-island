// 시간 체계 P1 (handover/design/design-time-and-endgame.md 1부): "마을의 날"과
// "나의 하루". The village keeps one clock (weather, seasons, festivals, shops,
// stocks, the daily sell cap and demand curve stay on the real KST day); my
// own day may run ahead of it.
//
//  - 나의 하루: pday = kstDay(now) + bonus. 하루 마감 at my bed (game night,
//    20:00–05:59) adds one, at most EXTRA_DAYS_PER_REAL_DAY times a real day
//    (plus 밀린 기회, below). pday never goes down and is never below kstDay,
//    so fields that used to hold a KST day compare the same way.
//  - 하루 마감 (endDay): my field's crops whose soil is wet grow SLEEP_GROW_MS
//    more (wet growth, lounge-farm-soil.ts soilAdvance; a dry crop waits), the
//    same for my greenhouse tiles and my 과일나무 자리 (and its fruit), the
//    village fruit trees' wait, my share of the barn and coop (F4), then my
//    shipping bin sells at once (under today's cap). A report card follows.
//  - Absence protection (§1-4): 밀린 기회 — days of this KST week I missed
//    (up to MAKEUP_MAX) come back as extra 하루 마감 once I am back.
//
// Storage: `world.life.myday[uid]` = { b, s: { d, n }, w: { w, m, u }, r }.
// Cycle-safe like lounge-farm.ts: lounge-life.ts imports this module and this
// module imports the life engine back, so those bindings are used inside
// functions only. myDay itself reads nothing but the record.
import { kstDay, type LoungeLedger } from './lounge-economy.ts';
import { gameHour, seasonOfDay } from './lounge-calendar.ts';
import { LifeError, plotReadyAt, type LifeState, type Plot } from './lounge-life.ts';
import type { SkillId } from './lounge-growth-data.ts';
import { soilAdvance } from './lounge-farm-soil.ts';
import { settleBin } from './lounge-farm.ts';
import { ORCHARD_PLOT_DAYS, ORCHARD_PLOT_HOLD } from './lounge-farm-sites-data.ts';
import { SAPLINGS } from './lounge-stage3-data.ts';
import { moodView } from './lounge-mood.ts';
import { barnMyDay } from './lounge-farm-barn.ts';

const HOUR = 3_600_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

// ---------------------------------------------------------------- numbers
/** 하루 마감 a real day (with the midnight one, three 나의 하루 a real day). */
export const EXTRA_DAYS_PER_REAL_DAY = 2;
/** Wet growth a 하루 마감 gives my crops (and what it takes off fruit waits). */
export const SLEEP_GROW_MS = 12 * HOUR;
/** Game hours of the night (20:00 – 05:59) when the bed offers 하루 마감. */
export const NIGHT_FROM = 20;
export const NIGHT_UNTIL = 6;
/** 밀린 기회: missed days of this week that come back as extra 하루 마감. */
export const MAKEUP_MAX = 3;
/** Others see 💤 over my head this long after my 하루 마감. */
export const ZZZ_MS = 30_000;
/** 목장 도우미 (lounge-stage3.ts careAnimals): an animal left this many days or more is cared for by the helper. */
export const HELPER_AFTER_DAYS = 2;
/** 범 the helper takes per animal per missed day. */
export const HELPER_FEE = 200;
/** Without the 범 for the helper, an animal loses at most this much 정. */
export const HELPER_LOVE_CAP = 2;

export const MYDAY_REJECT = {
  night: `하루 마감은 밤 ${NIGHT_FROM}시부터 새벽 ${NIGHT_UNTIL}시 전까지 할 수 있어요.`,
  enough: '오늘은 충분히 잤어요.',
  bed: '하루 마감은 내 방 침대에서 할 수 있어요.',
} as const;

// ---------------------------------------------------------------- state
/** What one 하루 마감 brought (the 결산 card). */
export type DayEndReport = {
  at: number;
  /** 나의 하루 after it. */
  pd: number;
  /** 범 the shipping bin paid, and how many things it sold. */
  ship: number;
  sold: number;
  /** Crops (field, greenhouses) that grew; how many of mine are ripe now. */
  grew: number;
  ripe: number;
  /** Fruit the 과일나무 자리 bore, 거름 my animals made. */
  fruit?: number;
  manure?: number;
  /** Level-ups since the day began. */
  lv?: { s: SkillId; lv: number }[];
  /** 오늘의 기분 (mood tier id) and whether rested XP waits. */
  mood?: string;
  rest?: 1;
  /** It used a 밀린 기회 day. */
  mk?: 1;
};
export type MyDayUser = {
  /** 하루 마감 so far (pday − kstDay). */
  b?: number;
  /** 하루 마감 on real KST day `d` (the daily limit). */
  s?: { d: number; n: number };
  /** This KST week (`w`), the weekdays I was around (bit 0 = Monday), 밀린 기회 used. */
  w?: { w: number; m: number; u: number };
  /** The last 하루 마감's report. */
  r?: DayEndReport;
};
export type MyDayExt = { myday?: Record<string, MyDayUser> };

const weekOf = (day: number) => Math.floor((day + 3) / 7);
const weekdayOf = (day: number) => (((day + 3) % 7) + 7) % 7;
const bits = (m: number) => {
  let n = 0;
  for (let i = 0; i < 7; i++) if (m & (1 << i)) n++;
  return n;
};
function readReport(v: unknown): DayEndReport | undefined {
  const x = obj(v);
  if (!safe(x.at) || x.at <= 0 || !safe(x.pd)) return;
  const n = (k: string, max = 1_000_000) => (safe(x[k]) && (x[k] as number) > 0 ? Math.min(max, x[k] as number) : 0);
  const lv = Array.isArray(x.lv)
    ? x.lv
        .slice(0, 6)
        .map(obj)
        .filter((u) => typeof u.s === 'string' && /^[a-z]{1,8}$/.test(u.s) && safe(u.lv) && u.lv > 0 && u.lv <= 10)
        .map((u) => ({ s: u.s as SkillId, lv: u.lv as number }))
    : [];
  return {
    at: x.at,
    pd: x.pd,
    ship: n('ship', 10_000_000),
    sold: n('sold', 99_999),
    grew: n('grew', 999),
    ripe: n('ripe', 999),
    ...(n('fruit', 99) ? { fruit: n('fruit', 99) } : {}),
    ...(n('manure', 999) ? { manure: n('manure', 999) } : {}),
    ...(lv.length ? { lv } : {}),
    ...(typeof x.mood === 'string' && /^[a-z]{1,12}$/.test(x.mood) ? { mood: x.mood } : {}),
    ...(x.rest === 1 ? { rest: 1 as const } : {}),
    ...(x.mk === 1 ? { mk: 1 as const } : {}),
  };
}
/** Normalizes `world.life.myday` (absent in older worlds → omitted). */
export function readMyDay(value: unknown): MyDayExt {
  const out: Record<string, MyDayUser> = {};
  for (const [uid, v] of Object.entries(obj(value)).slice(0, 32)) {
    if (!UUID.test(uid) || Object.keys(out).length >= 16) continue;
    const x = obj(v),
      u: MyDayUser = {};
    if (safe(x.b) && x.b > 0) u.b = Math.min(1_000_000, x.b);
    const s = obj(x.s);
    if (safe(s.d) && s.d > 0 && safe(s.n) && s.n > 0) u.s = { d: s.d, n: Math.min(EXTRA_DAYS_PER_REAL_DAY + MAKEUP_MAX, s.n) };
    const w = obj(x.w);
    if (safe(w.w) && w.w > 0 && safe(w.m) && w.m >= 0) u.w = { w: w.w, m: w.m & 0x7f, u: safe(w.u) && w.u > 0 ? Math.min(MAKEUP_MAX, w.u) : 0 };
    const r = readReport(x.r);
    if (r) u.r = r;
    if (Object.keys(u).length) out[uid] = u;
  }
  return Object.keys(out).length ? { myday: out } : {};
}
const recOf = (life: LifeState, uid: string): MyDayUser => ((life.myday ??= {})[uid] ??= {});

// ---------------------------------------------------------------- my day
/** 나의 하루: the real KST day plus my 하루 마감 so far (never goes down). */
export const myDay = (life: Pick<LifeState, 'myday'>, uid: string, now: number) => kstDay(now) + (life.myday?.[uid]?.b ?? 0);
/** Game night: when the bed offers 하루 마감. */
export const isGameNight = (now: number) => {
  const h = gameHour(now);
  return h >= NIGHT_FROM || h < NIGHT_UNTIL;
};
/** 하루 마감 done on today's real day. */
export const endsToday = (life: Pick<LifeState, 'myday'>, uid: string, now: number) => {
  const s = life.myday?.[uid]?.s;
  return s && s.d === kstDay(now) ? s.n : 0;
};
/**
 * 밀린 기회 still open this week: weekdays before today I was not around
 * (MAKEUP_MAX at most), less those already used.
 */
export function makeupLeft(life: Pick<LifeState, 'myday'>, uid: string, now: number) {
  const day = kstDay(now),
    w = life.myday?.[uid]?.w;
  if (!w) return 0;
  const before = (1 << weekdayOf(day)) - 1,
    // A record from an earlier week: nothing of this week was seen yet.
    seen = w.w === weekOf(day) ? w.m & before : 0,
    used = w.w === weekOf(day) ? w.u : 0;
  return Math.max(0, Math.min(MAKEUP_MAX, bits(before) - bits(seen)) - used);
}
/** 하루 마감 left today (the daily ones, then 밀린 기회). */
export const endsLeft = (life: Pick<LifeState, 'myday'>, uid: string, now: number) =>
  Math.max(0, EXTRA_DAYS_PER_REAL_DAY - endsToday(life, uid, now)) + makeupLeft(life, uid, now);
/** Why I cannot end my day now (null = I can). The bed itself is the cloud engine's check. */
export function canEndDay(life: Pick<LifeState, 'myday'>, uid: string, now: number): string | null {
  if (!isGameNight(now)) return MYDAY_REJECT.night;
  if (endsLeft(life, uid, now) <= 0) return MYDAY_REJECT.enough;
  return null;
}
/**
 * Notes that I was around today (every life action): the week's mask for
 * 밀린 기회. A friend seen for the first time owes nothing for the days
 * before they came.
 */
export function noteActive(life: LifeState, uid: string, now: number) {
  if (!UUID.test(uid)) return;
  const day = kstDay(now),
    week = weekOf(day),
    bit = 1 << weekdayOf(day),
    u = recOf(life, uid);
  if (!u.w) u.w = { w: week, m: (bit << 1) - 1, u: 0 };
  else if (u.w.w !== week) u.w = { w: week, m: bit, u: 0 };
  else if (!(u.w.m & bit)) u.w = { ...u.w, m: u.w.m | bit };
}

// ---------------------------------------------------------------- 하루 마감
/** One crop: SLEEP_GROW_MS more if its soil is wet and it is not ripe yet. Returns [grew, ripe after]. */
function sleepPlot(p: Plot, now: number): [boolean, boolean] {
  if (!p.crop) return [false, false];
  if (now >= plotReadyAt(p, now)!) return [false, true];
  const grew = soilAdvance(p, SLEEP_GROW_MS, now);
  return [grew, now >= plotReadyAt(p, now)!];
}
/**
 * 하루 마감 for `member` on an already-cloned life whose farm was just
 * settled (lounge-life.ts lifeActionCore). Re-checks the night and the count
 * (the server runs this same code); the bed is the cloud engine's check.
 */
export function endDayAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  const uid = member.id,
    actor = member.actor;
  const why = canEndDay(life, uid, now);
  if (why) throw new LifeError(why);
  const u = recOf(life, uid),
    day = kstDay(now),
    daily = endsToday(life, uid, now) < EXTRA_DAYS_PER_REAL_DAY;
  const since = u.r?.at ?? now - 24 * HOUR;
  // The count first: the daily ones, then a 밀린 기회 day.
  u.s = { d: day, n: endsToday(life, uid, now) + 1 };
  if (!daily) u.w = { ...u.w!, u: u.w!.u + 1 };
  u.b = (u.b ?? 0) + 1;
  // My crops: 12 hours of wet growth (field, my greenhouse tiles).
  let grew = 0,
    ripe = 0;
  const count = ([g, r]: [boolean, boolean]) => {
    if (g) grew++;
    if (r) ripe++;
  };
  for (const p of life.farms[uid] ?? []) count(sleepPlot(p, now));
  let fruit = 0;
  for (const site of Object.values(life.farm?.sites ?? {})) {
    if (site.tier < 1) continue;
    if (site.kind === 'greenhouse') {
      for (const p of Object.values(site.state.plots ?? {})) if (p.o === actor) count(sleepPlot(p, now));
    } else if (site.kind === 'greenhouseMini' && site.owner === uid) {
      for (const p of Object.values(site.state.plots ?? {})) count(sleepPlot(p, now));
    } else if (site.kind === 'orchardPlot' && site.owner === uid) {
      // My 과일나무 자리: the saplings age, and a grown tree in season bears one more.
      for (const t of Object.values(site.state.trees ?? {})) {
        t.at = Math.max(1, t.at - SLEEP_GROW_MS);
        if (day < kstDay(t.at) + ORCHARD_PLOT_DAYS || SAPLINGS[t.f].season !== seasonOfDay(day)) continue;
        const before = t.n ?? 0;
        t.n = Math.min(ORCHARD_PLOT_HOLD, before + 1);
        fruit += t.n - before;
      }
    }
  }
  // The village fruit trees' wait.
  const picked = life.fruitPickedAt[uid];
  if (picked) for (const k of Object.keys(picked)) picked[k] = Math.max(1, picked[k] - SLEEP_GROW_MS);
  // 우리 농장 F4: my share of the barn and the coop (one more day of 거름).
  const manure = barnMyDay(life, uid, actor, now);
  // The shipping bin sells now (today's sell cap and demand curve).
  const wallet = 'wallet-' + uid,
    before = ledger.accounts[wallet] ?? 0,
    inBin = Object.values(life.farmx?.[uid]?.bin?.items ?? {}).reduce((a, n) => a + n, 0);
  const next = settleBin(life, ledger, uid, now, true);
  const left = Object.values(life.farmx?.[uid]?.bin?.items ?? {}).reduce((a, n) => a + n, 0);
  const ups = (life.growth?.u?.[uid]?.ups ?? []).filter((x) => x.at > since).map((x) => ({ s: x.s, lv: x.lv }));
  const rest = Object.values(life.growth?.u?.[uid]?.rest ?? {}).some((n) => (n ?? 0) > 0);
  u.r = {
    at: now,
    pd: myDay(life, uid, now),
    ship: Math.max(0, (next.accounts[wallet] ?? 0) - before),
    sold: Math.max(0, inBin - left),
    grew,
    ripe,
    ...(fruit ? { fruit } : {}),
    ...(manure ? { manure } : {}),
    ...(ups.length ? { lv: ups.slice(-6) } : {}),
    mood: moodView(life, uid, now).tier,
    ...(rest ? { rest: 1 as const } : {}),
    ...(daily ? {} : { mk: 1 as const }),
  };
  return { life, ledger: next };
}

// ---------------------------------------------------------------- view
export type MyDayView = {
  /** 하루 마감 done today (the HUD badge 나의 하루 +n) and still open (밀린 기회 included). */
  n: number;
  left: number;
  /** 밀린 기회 still open this week. */
  mk: number;
  /** The last report (the 결산 card reads it after 하루 마감). */
  r?: DayEndReport;
  /** Friends (actors) who ended their day a moment ago: 💤 until `at` + ZZZ_MS. */
  zz?: Record<number, number>;
};
export function myDayView(life: LifeState, uid: string, now: number): MyDayView {
  const u = life.myday?.[uid],
    zz: Record<number, number> = {};
  for (const [id, x] of Object.entries(life.myday ?? {})) {
    const at = x.r?.at;
    if (at && now - at < ZZZ_MS && id in life.actors) zz[life.actors[id]] = at;
  }
  return {
    n: endsToday(life, uid, now),
    left: endsLeft(life, uid, now),
    mk: makeupLeft(life, uid, now),
    ...(u?.r ? { r: { ...u.r, ...(u.r.lv ? { lv: u.r.lv.map((x) => ({ ...x })) } : {}) } } : {}),
    ...(Object.keys(zz).length ? { zz } : {}),
  };
}
