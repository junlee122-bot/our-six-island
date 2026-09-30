// 무드(기분) engine: needs that drain only while playing, moodlets (thoughts
// with a value, a real-time lifetime and a stack limit), the shown mood that
// eases toward its target, inspirations (풍작 · 입질 · 요리 · 배움), the
// 촌장님 찻잔 care, snacks, bed rest, the casino bar drink and 응원하기.
//
// Pure and `now`-injected like the rest of the life engine; state lives in
// `world.life.mood` (bounded: ≤ 16 friends, ≤ 24 moodlets each, ~5 KB for 7).
// Mood never touches 범 (prices, rewards, stakes) and never blocks an action:
// its only effects are the skill XP multiplier (the daily cap unchanged) and
// the inspirations, which go through the normal harvest/fishing/cooking paths.
// The one ledger movement is the optional paid bar drink (a spendBeom sink).
//
// Writes piggyback on commands that write the world row anyway (life actions,
// room actions, the lease refresh of a read): a plain read only *projects* the
// mood to `now` (moodView) and never writes (audit D-3).
//
// Cycle-safe: lounge-life.ts, lounge-life-plus.ts and lounge-growth.ts import
// this module and it imports them back, so their bindings are only used
// inside functions.
import { kstDay, spendBeom, type LoungeLedger } from './lounge-economy.ts';
import { ACTOR_NAMES, birthdayActors, hash32, holidaysOn, weatherOf } from './lounge-calendar.ts';
import { DISH_BY_ID, FISH_BY_ID, ITEM_BY_ID } from './lounge-items.ts';
import { LIFE_REJECT, LifeError, CROPS, uidOf, type Crop, type LifeAction, type LifeState, type Quality } from './lounge-life.ts';
import { addBond, addCropQ, addInv, addNews, bondGate, bondLevel, bondPoints, cropQCount, invCount } from './lounge-life-plus.ts';
import { TALK_POINTS } from './lounge-social-defs.ts';
import { cozyScore } from './lounge-mood-room.ts';
import {
  ACTIVE_GAP_MS,
  BACK_MS,
  BIG_RESULT,
  BITE_INSPIRATION_RARE,
  BITE_INSPIRATION_WINDOW,
  CARE_AFTER_MIN,
  CARE_BELOW,
  CARE_CUP_MS,
  CHEER_HOWS,
  CHEER_SNACK_FOOD,
  CHEER_SOCIAL,
  COZY_SCORE_MAX,
  DRINKS_PER_DAY,
  DRINK_FOOD,
  DRINK_FUN,
  DRINK_PRICE,
  FILL,
  FUN_TOLERANCE,
  FUN_TOLERANCE_MIN,
  HARVEST_INSPIRATION_STEP,
  INSPIRATIONS,
  INSPIRATIONS_PER_DAY,
  INSPIRATIONS_PER_WEEK,
  INSPIRATION_FROM,
  INSPIRATION_GAUGE,
  LEARN_INSPIRATION_XP,
  LIVELY_ONLINE,
  MIN,
  MOODLETS,
  MOODLETS_MAX,
  MOOD_ACTION_KINDS,
  MOOD_BASE,
  MOOD_FLOOR,
  MOOD_MAX,
  MOOD_REJECT,
  MOOD_STEP_PER_MIN,
  MOOD_TIER_BY_ID,
  MOOD_USERS_MAX,
  NEEDS,
  NEEDS_START,
  NEED_INFO,
  NEGATIVE_CAP,
  OFFLINE_HALF_MS,
  OFFLINE_TARGET,
  ONLINE_SOCIAL_PER_MIN,
  REST_COOLDOWN_MS,
  REST_GAIN,
  SLEEP_MS,
  SNACKS_PER_DAY,
  SNACK_DISH_FOOD,
  SNACK_FOOD,
  TEA_FOOD_MIN,
  cozyOf,
  isInspirationKind,
  isMoodletId,
  moodWeekOf,
  needWord,
  tierOf,
  xpMultOf,
  type CheerHow,
  type InspirationKind,
  type MoodIcon,
  type MoodTier,
  type MoodletId,
  type NeedId,
} from './lounge-mood-data.ts';

// ---------------------------------------------------------------- types
export type MoodInspiration = { k: InspirationKind; at: number; until: number; left: number };
export type MoodUser = {
  /** 배부름 · 휴식 · 즐거움 · 사교, 0–100 (tenths). */
  n: [number, number, number, number];
  /** Last time the state was advanced. */
  at: number;
  /** Shown mood (tenths), eases toward the target. */
  v: number;
  /** Moodlets: [id, expires at]. One entry per stack. */
  l?: [MoodletId, number][];
  /** Inspiration gauge 0–INSPIRATION_GAUGE. */
  g?: number;
  /** The inspiration being held. */
  i?: MoodInspiration;
  /** [KST week, inspirations this week]. */
  iw?: [number, number];
  /** KST day of the last inspiration (one a day). */
  id?: number;
  /** KST day of the daily fields below (sn, dr, ch, tol). */
  d?: number;
  /** Snacks eaten today. */
  sn?: number;
  /** Bar drinks today. */
  dr?: number;
  /** Last bed rest. */
  rs?: number;
  /** Actors cheered today. */
  ch?: number[];
  /** Recent cheers received: [actor, at, how]. */
  cb?: [number, number, CheerHow][];
  /** KST day 촌장님 찻잔 last came. */
  care?: number;
  /** 촌장님 찻잔 waiting to be drunk (arrival time). */
  cup?: number;
  /** Fun tolerance per source today. */
  tol?: Record<string, number>;
  /** Active minutes in a row below CARE_BELOW. */
  low?: number;
  /** Other friends online at the last touch. */
  o?: number;
  /** Friends may see my top moodlets (설정 → 내 기분 자세히 보여 주기). */
  pub?: 1;
  /** Room score (아늑함) from my profile save, when the server knows it. */
  room?: number;
  /** KST day of the day-start moodlets (sunny walk, birthday, holiday, first snow). */
  wx?: number;
  sd?: number;
  /** KST day of the last 첫눈 moodlet. */
  fs?: number;
};
export type MoodState = Record<string, MoodUser>;
export type MoodExt = { mood?: MoodState };
export type MoodAction =
  | { kind: 'snack'; item: string; q?: Quality }
  | { kind: 'bedRest' }
  | { kind: 'barDrink' }
  | { kind: 'moodTea' }
  | { kind: 'moodShare'; on: boolean }
  | { kind: 'cheer'; to: number | string; how: CheerHow; item?: string };

// ---------------------------------------------------------------- reading
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const time = (v: unknown) => (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0);
const num = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v * 10) / 10)) : fallback;
const int = (v: unknown, lo: number, hi: number) =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= lo && v <= hi ? v : undefined;
const actorOk = (a: unknown): a is number => typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < 7;
const tenth = (x: number) => Math.round(x * 10) / 10;
const clampNeed = (x: number) => Math.max(0, Math.min(100, tenth(x)));

function readUser(value: unknown): MoodUser | null {
  const x = obj(value);
  const at = time(x.at);
  if (!at) return null;
  const n = Array.isArray(x.n) ? x.n : [];
  const u: MoodUser = {
    n: [0, 1, 2, 3].map((i) => num(n[i], 0, 100, NEEDS_START[i])) as MoodUser['n'],
    at,
    v: num(x.v, MOOD_FLOOR, MOOD_MAX, 60),
  };
  if (Array.isArray(x.l)) {
    const l = x.l
      .filter((e): e is [MoodletId, number] => Array.isArray(e) && isMoodletId(e[0]) && time(e[1]) > 0)
      .map(([id, until]) => [id, until] as [MoodletId, number])
      .slice(-MOODLETS_MAX);
    if (l.length) u.l = l;
  }
  const g = num(x.g, 0, INSPIRATION_GAUGE, 0);
  if (g > 0) u.g = g;
  const i = obj(x.i);
  if (isInspirationKind(i.k) && time(i.until) > 0)
    u.i = { k: i.k, at: time(i.at), until: time(i.until), left: int(i.left, 0, 99) ?? 0 };
  if (Array.isArray(x.iw) && int(x.iw[0], 0, 1e7) !== undefined && int(x.iw[1], 0, 99) !== undefined)
    u.iw = [x.iw[0] as number, x.iw[1] as number];
  for (const k of ['id', 'd', 'care', 'wx', 'sd', 'fs'] as const) {
    const d = int(x[k], 0, 1e7);
    if (d !== undefined) u[k] = d;
  }
  for (const k of ['sn', 'dr'] as const) {
    const c = int(x[k], 0, 99);
    if (c) u[k] = c;
  }
  if (time(x.rs)) u.rs = time(x.rs);
  if (time(x.cup)) u.cup = time(x.cup);
  if (Array.isArray(x.ch)) {
    const ch = [...new Set(x.ch.filter(actorOk))].slice(0, 7);
    if (ch.length) u.ch = ch;
  }
  if (Array.isArray(x.cb)) {
    const cb = x.cb
      .filter(
        (e): e is [number, number, CheerHow] =>
          Array.isArray(e) && actorOk(e[0]) && time(e[1]) > 0 && (CHEER_HOWS as readonly unknown[]).includes(e[2]),
      )
      .map(([a, t, h]) => [a, t, h] as [number, number, CheerHow])
      .slice(-5);
    if (cb.length) u.cb = cb;
  }
  const tol: Record<string, number> = {};
  for (const [k, c] of Object.entries(obj(x.tol)).slice(0, 24))
    if (/^[a-z:]{1,24}$/.test(k) && int(c, 1, 999) !== undefined && Object.keys(tol).length < 16) tol[k] = c as number;
  if (Object.keys(tol).length) u.tol = tol;
  const low = num(x.low, 0, 1440, 0);
  if (low > 0) u.low = low;
  const o = int(x.o, 0, 16);
  if (o) u.o = o;
  if (x.pub === 1) u.pub = 1;
  const room = int(x.room, 0, COZY_SCORE_MAX);
  if (room !== undefined) u.room = room;
  return u;
}
/** Normalizes `world.life.mood` (absent in older worlds → omitted). */
export function readMood(value: unknown): MoodExt {
  const mood: MoodState = {};
  for (const [uid, x] of Object.entries(obj(value)).slice(0, 32)) {
    if (!UUID.test(uid) || Object.keys(mood).length >= MOOD_USERS_MAX) continue;
    const u = readUser(x);
    if (u) mood[uid] = u;
  }
  return Object.keys(mood).length ? { mood } : {};
}

// ---------------------------------------------------------------- core math
/** Sum of moodlets (k-th copy of an id ×0.5^(k−1)), split into positive and negative. */
function moodletSums(u: MoodUser, now: number) {
  const by = new Map<MoodletId, number>();
  for (const [id, until] of u.l ?? []) if (until > now) by.set(id, (by.get(id) ?? 0) + 1);
  let pos = 0,
    neg = 0;
  for (const [id, k] of by) {
    const v = MOODLETS[id].value * (2 - 0.5 ** (k - 1)); // 1 + 0.5 + 0.25 …
    if (v >= 0) pos += v;
    else neg += v;
  }
  if (u.i && u.i.until > now && u.i.left > 0) pos += MOODLETS.inspired.value;
  return { pos, neg };
}
/** Target mood: base + needs + 아늑함 + moodlets, negatives capped at −15, 15–100. */
export function moodTarget(u: MoodUser, now: number) {
  let pos = MOOD_BASE,
    neg = 0;
  NEEDS.forEach((id, i) => {
    const o = NEED_INFO[id].offset(u.n[i]);
    if (o >= 0) pos += o;
    else neg += o;
  });
  if (u.room !== undefined) pos += cozyOf(u.room).value;
  const s = moodletSums(u, now);
  pos += s.pos;
  neg += s.neg;
  return Math.max(MOOD_FLOOR, Math.min(MOOD_MAX, tenth(pos + Math.max(NEGATIVE_CAP, neg))));
}
const toward = (v: number, target: number, step: number) =>
  v < target ? Math.min(target, v + step) : Math.max(target, v - step);

/**
 * Moves a friend's state from `u.at` to `now`: up to ACTIVE_GAP_MS counts as
 * play (needs drain, the mood eases 1/min, the inspiration gauge fills), the
 * rest as offline (needs drift toward 60 with a 3 h half-life, ≥ 6 h is sleep,
 * ≥ 2 days away is 돌아왔어요). Pure arithmetic on `u` (mutated).
 */
function advance(u: MoodUser, now: number) {
  if (!(now > u.at)) return;
  const dt = now - u.at,
    active = Math.min(dt, ACTIVE_GAP_MS),
    others = u.o ?? 0;
  let t = u.at,
    left = active;
  while (left > 0) {
    const c = Math.min(MIN, left),
      m = c / MIN;
    t += c;
    left -= c;
    NEEDS.forEach((id, i) => {
      u.n[i] = Math.max(0, u.n[i] - NEED_INFO[id].perMin * m);
    });
    if (others > 0) u.n[3] = Math.min(100, u.n[3] + ONLINE_SOCIAL_PER_MIN * m);
    u.v = toward(u.v, moodTarget(u, t), MOOD_STEP_PER_MIN * m);
    // The gauge stops while an inspiration is held (it waits full).
    if (u.v > INSPIRATION_FROM) u.g = Math.min(INSPIRATION_GAUGE, (u.g ?? 0) + (u.v - INSPIRATION_FROM) * m);
    u.low = u.v < CARE_BELOW ? (u.low ?? 0) + m : 0;
  }
  const off = dt - active;
  if (off > 0) {
    const keep = 0.5 ** (off / OFFLINE_HALF_MS);
    for (const i of [0, 2, 3]) u.n[i] = OFFLINE_TARGET + (u.n[i] - OFFLINE_TARGET) * keep;
    u.low = 0;
    if (off >= SLEEP_MS) {
      u.n[1] = 100;
      addLet(u, 'slept', now);
    }
    if (off >= BACK_MS) addLet(u, 'back', now);
    u.v = toward(u.v, moodTarget(u, now), (off / MIN) * MOOD_STEP_PER_MIN);
  }
  u.n = u.n.map(clampNeed) as MoodUser['n'];
  u.v = Math.max(MOOD_FLOOR, Math.min(MOOD_MAX, tenth(u.v)));
  if (u.g !== undefined) {
    u.g = tenth(u.g);
    if (!u.g) delete u.g;
  }
  if (u.low !== undefined) {
    u.low = tenth(u.low);
    if (!u.low) delete u.low;
  }
  u.at = now;
}
/** Adds one stack of a moodlet (at the stack limit, the oldest is refreshed instead). */
function addLet(u: MoodUser, id: MoodletId, now: number, copies = 1) {
  const def = MOODLETS[id];
  for (let c = 0; c < copies; c++) {
    const list = (u.l ?? []).filter(([, until]) => until > now);
    const same = list.filter(([x]) => x === id);
    if (same.length >= def.max) {
      const oldest = same.reduce((a, b) => (b[1] < a[1] ? b : a));
      oldest[1] = now + def.ms;
    } else list.push([id, now + def.ms]);
    // Over the cap the soonest-to-expire thought goes first.
    list.sort((a, b) => a[1] - b[1]);
    u.l = list.slice(-MOODLETS_MAX);
  }
}
function prune(u: MoodUser, now: number) {
  if (u.l) {
    u.l = u.l.filter(([, until]) => until > now);
    if (!u.l.length) delete u.l;
  }
  if (u.i && (u.i.until <= now || u.i.left <= 0)) delete u.i;
  if (u.cup && now - u.cup > CARE_CUP_MS) delete u.cup;
  if (u.cb) {
    u.cb = u.cb.filter(([, at]) => now - at < MOODLETS.cheered.ms);
    if (!u.cb.length) delete u.cb;
  }
}
/** Resets the daily fields at KST midnight. */
function today(u: MoodUser, now: number) {
  const day = kstDay(now);
  if (u.d === day) return;
  u.d = day;
  delete u.sn;
  delete u.dr;
  delete u.ch;
  delete u.tol;
}
function blank(now: number): MoodUser {
  const u: MoodUser = { n: [...NEEDS_START] as MoodUser['n'], at: now, v: 60 };
  u.v = moodTarget(u, now);
  return u;
}
const moodOf = (life: LifeState): MoodState => (life.mood ??= {});
/** A friend's mood record, created (at `now`, neutral) the first time. */
function userOf(life: LifeState, uid: string, now: number): MoodUser | null {
  if (!UUID.test(uid) || !(uid in life.actors)) return null;
  const mood = moodOf(life);
  if (!mood[uid] && Object.keys(mood).length >= MOOD_USERS_MAX) return null;
  return (mood[uid] ??= blank(now));
}
/** Fills a need; `tol` applies the daily fun tolerance of that source. */
function fill(u: MoodUser, need: NeedId, amount: number, tol?: string) {
  let a = amount;
  if (tol) {
    const n = u.tol?.[tol] ?? 0;
    a *= Math.max(FUN_TOLERANCE_MIN, FUN_TOLERANCE ** n);
    if (Object.keys(u.tol ?? {}).length < 16 || u.tol?.[tol] !== undefined) (u.tol ??= {})[tol] = Math.min(999, n + 1);
  }
  const i = NEEDS.indexOf(need);
  u.n[i] = clampNeed(u.n[i] + a);
}
const nameOf = (actor: number) => ACTOR_NAMES[actor] ?? '친구';
const josa = (name: string, pair: [string, string]) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 ? pair[0] : pair[1]);
};

/** Which inspiration: the skill with the most XP today, else a deterministic pick. */
function inspirationKind(life: LifeState, uid: string, now: number): InspirationKind {
  const dxp = life.growth?.u?.[uid]?.dxp ?? {};
  const by: [InspirationKind, number][] = [
    ['harvest', dxp.farm ?? 0],
    ['bite', dxp.fish ?? 0],
    ['cook', dxp.craft ?? 0],
    ['learn', Math.max(dxp.forage ?? 0, dxp.mine ?? 0)],
  ];
  const best = by.reduce((a, b) => (b[1] > a[1] ? b : a));
  if (best[1] > 0) return best[0];
  return (['harvest', 'bite'] as const)[hash32(`insp:${uid}:${kstDay(now)}`) % 2];
}
const weekCount = (u: MoodUser, day: number) => (u.iw && u.iw[0] === moodWeekOf(day) ? u.iw[1] : 0);

/** After advancing: inspiration, 촌장님 찻잔, the day's weather-free moodlets, cleanup. */
function settle(life: LifeState, uid: string, u: MoodUser, now: number) {
  const day = kstDay(now),
    actor = life.actors[uid];
  prune(u, now);
  if (
    (u.g ?? 0) >= INSPIRATION_GAUGE &&
    !u.i &&
    u.id !== day &&
    weekCount(u, day) < INSPIRATIONS_PER_WEEK &&
    INSPIRATIONS_PER_DAY > 0
  ) {
    const k = inspirationKind(life, uid, now),
      def = INSPIRATIONS[k];
    u.i = { k, at: now, until: now + def.ms, left: def.uses };
    delete u.g;
    u.id = day;
    u.iw = [moodWeekOf(day), weekCount(u, day) + 1];
    addNews(life, now, `insp:${actor}:${day}`, 'mood', `${josa(nameOf(actor), ['이', '가'])} ${def.name}을 받았어요!`, [actor]);
  }
  if ((u.low ?? 0) >= CARE_AFTER_MIN && u.care !== day && !u.cup) {
    u.cup = now;
    u.care = day;
    delete u.low;
  }
  if (u.sd !== day) {
    u.sd = day;
    if (birthdayActors(day).includes(actor)) addLet(u, 'birthday', now);
    if (holidaysOn(day).length) addLet(u, 'holiday', now);
    if (weatherOf(day) === 'snow' && (u.fs === undefined || day - u.fs > 21)) {
      u.fs = day;
      addLet(u, 'snow', now);
    }
  }
}

// ---------------------------------------------------------------- write hooks
/**
 * Brings `uid`'s mood up to `now` (creating it the first time) and settles the
 * inspiration and care rules. `others` = other friends online right now (the
 * cloud engine knows the leases; life actions keep the last known value).
 * Mutates `life` (callers pass a copy). Returns the record, or null for an
 * unknown friend.
 */
export function moodTouch(life: LifeState, uid: string, now: number, others?: number) {
  const u = userOf(life, uid, now);
  if (!u) return null;
  advance(u, now);
  if (others !== undefined) {
    if (others > 0) u.o = Math.min(16, others);
    else delete u.o;
    if (others + 1 >= LIVELY_ONLINE) addLet(u, 'lively', now);
  }
  today(u, now);
  settle(life, uid, u, now);
  return u;
}
/** Another friend's record for an event (their clock is not advanced). */
function other(life: LifeState, uid: string | null | undefined, now: number) {
  if (!uid) return null;
  const u = userOf(life, uid, now);
  if (u) today(u, now);
  return u;
}

/**
 * Before a life action: a shallow copy of `life` whose mood for `member` is
 * brought up to `now`, so the XP multiplier and the inspirations see the
 * current mood. The input is not mutated.
 */
export function moodBeforeLifeAction(life: LifeState, member: { id: string; actor: number }, now: number): LifeState {
  if (!UUID.test(member.id) || !(member.id in life.actors) || life.actors[member.id] !== member.actor) return life;
  const mood = { ...life.mood };
  if (mood[member.id]) mood[member.id] = structuredClone(mood[member.id]);
  const next = { ...life, mood };
  moodTouch(next, member.id, now);
  return next;
}

const OUTDOOR = new Set(['plant', 'water', 'harvest', 'pick', 'cast', 'reel', 'forage', 'catch', 'chop', 'smash', 'waterFriend', 'anglerCast', 'anglerLand', 'crabCollect']);
type Stats = Record<string, number | undefined>;
const statsOf = (life: LifeState, uid: string): Stats => (life.ext?.[uid]?.stats ?? {}) as Stats;
const grew = (a: Stats, b: Stats, k: string) => (b[k] ?? 0) - (a[k] ?? 0);

/**
 * After a successful life action: events derived from what changed (stats,
 * the day's meal, level-ups, hearts…) plus the action itself. `before` is the
 * state the action started from, `life` its result (a fresh copy, mutated).
 */
export function moodAfterLifeAction(
  before: LifeState,
  life: LifeState,
  member: { id: string; actor: number },
  action: LifeAction,
  now: number,
) {
  const uid = member.id,
    actor = member.actor;
  const u = moodTouch(life, uid, now);
  if (!u) return life;
  const kind = (action as { kind: string }).kind;
  const a = statsOf(before, uid),
    b = statsOf(life, uid);
  const xb = before.ext?.[uid],
    xa = life.ext?.[uid];
  // 먹기
  // (ext.ate resets at KST midnight inside the action, so compare the kind.)
  if (kind === 'eat' && xa?.ate) {
    u.n[0] = FILL.eatFood;
    addLet(u, 'meal', now);
  }
  // 농사 · 낚시 · 채집
  if (grew(a, b, 'harvest') > 0) fill(u, 'fun', FILL.harvestFun, 'farm');
  if (grew(a, b, 'gold') > 0) addLet(u, 'gold', now);
  if (grew(a, b, 'fish') > 0) {
    fill(u, 'fun', FILL.fishFun, 'fish');
    const fish = xa?.last?.ok && xa.last.fish ? FISH_BY_ID[xa.last.fish] : undefined;
    if (fish && fish.weight < 10) addLet(u, 'rareFish', now);
    if (xa?.last?.best && (xb?.best?.[xa.last.fish!] ?? 0) > 0) addLet(u, 'best', now);
  } else if (kind === 'reel' && xa?.last && !xa.last.ok) {
    fill(u, 'fun', FILL.missFun, 'fish');
    addLet(u, 'miss', now);
  }
  if (grew(a, b, 'forage') + grew(a, b, 'bug') > 0) fill(u, 'fun', FILL.forageFun, 'forage');
  if (kind === 'chop' || kind === 'smash') fill(u, 'fun', FILL.forageFun, 'forage');
  if (grew(a, b, 'dex') > 0 || (xa?.dex?.length ?? 0) > (xb?.dex?.length ?? 0)) addLet(u, 'dex', now);
  if (grew(a, b, 'donate') > 0) addLet(u, 'donate', now);
  if (grew(a, b, 'request') > 0) {
    addLet(u, 'request', now);
    fill(u, 'social', FILL.requestSocial);
  }
  if (grew(a, b, 'furniture') > 0) addLet(u, 'furniture', now);
  if ((xa?.house ?? 0) > (xb?.house ?? 0)) addLet(u, 'house', now);
  // 기술 레벨 업 (lounge-growth records them with the action's clock).
  if (life.growth?.u?.[uid]?.ups?.some((x) => x.at === now)) addLet(u, 'levelUp', now);
  // 사교
  if (kind === 'npcTalk') {
    addLet(u, 'chat', now);
    fill(u, 'social', FILL.talkSocial);
  }
  if (kind === 'waterFriend' && grew(a, b, 'waterFriend') > 0) {
    addLet(u, 'waterFriend', now);
    fill(u, 'social', FILL.waterSocial);
    const owner = other(life, uidOf(life, (action as { owner?: unknown }).owner), now);
    if (owner) addLet(owner, 'watered', now);
  }
  if (grew(a, b, 'gift') > 0 && kind === 'mail') {
    addLet(u, 'giveGift', now);
    fill(u, 'social', FILL.giftSocial);
    const toUid = uidOf(life, (action as { to?: unknown }).to),
      to = other(life, toUid, now);
    if (to && toUid) {
      addLet(to, 'gift', now);
      if (birthdayActors(kstDay(now)).includes(life.actors[toUid])) addLet(to, 'birthdayCheer', now);
    }
  }
  // Hearts that went up with this action (me and the friend).
  for (let f = 0; f < 7; f++) {
    if (f === actor) continue;
    if (bondLevel(bondPoints(life, actor, f, now)) > bondLevel(bondPoints(before, actor, f, now))) {
      addLet(u, 'heartUp', now);
      const fu = other(life, uidOf(life, f), now);
      if (fu) addLet(fu, 'heartUp', now);
    }
  }
  // 축제 (the fete games and the weekly fund)
  if (kind === 'fete' && ['finish', 'lantern', 'crown', 'photo'].includes(String((action as { op?: unknown }).op))) {
    addLet(u, 'festival', now);
    fill(u, 'fun', FILL.feteFun, 'fete');
  }
  if (kind === 'festival') {
    addLet(u, 'festival', now);
    fill(u, 'fun', FILL.festivalFun, 'festival');
  }
  // 바깥바람: the day's weather on the first outdoor action.
  if (OUTDOOR.has(kind)) {
    const day = kstDay(now),
      w = weatherOf(day);
    if (w === 'sunny' && u.wx !== day) {
      u.wx = day;
      addLet(u, 'sunny', now);
    } else if (w === 'rain' || w === 'storm') addLet(u, w === 'storm' ? 'storm' : 'rain', now);
  }
  // 요리 영감: one more plate of the next dish (a batch still gets only one).
  if (kind === 'cook' && u.i?.k === 'cook' && u.i.left > 0) {
    const recipe = String((action as { recipe?: unknown }).recipe);
    const made = invCount(life, uid, recipe) - invCount(before, uid, recipe);
    if (made > 0 && DISH_BY_ID[recipe]) {
      addInv(life, uid, recipe, 1);
      u.i.left -= 1;
    }
  }
  prune(u, now);
  return life;
}

type LeaseMap = Record<string, { seen: number }>;
type RoomLike = {
  snapshot: {
    seats?: Record<string, (string | null)[]>;
    liarsbar?: { id: string; lastShot: { seat: number; out: boolean; pull: number } | null } | null;
  };
  leases: LeaseMap;
};
/** A read that refreshed `uid`'s lease `seen` (the row is rewritten anyway). */
export function moodWritesAnyway(prev: Record<string, { leases: LeaseMap }>, rooms: Record<string, { leases: LeaseMap }>, uid: string, now: number) {
  return Object.entries(rooms).some(([code, r]) => r.leases?.[uid]?.seen === now && prev[code]?.leases?.[uid]?.seen !== now);
}
type GameLike = { game: string; wallets: string[]; deposits: number[]; state: string; result: number[] };
/**
 * After a cloud transition that writes the row anyway (a life or room action,
 * or a read that refreshed its lease): the member's clock and who is online,
 * a room visit, table games that just settled (all players) and 허풍 주점
 * shots. Returns a new life state (`life` is a fresh readLife copy).
 */
export function moodAfterCloud(opts: {
  life: LifeState;
  before: LifeState;
  member: { id: string; actor: number };
  prevGames: Record<string, GameLike>;
  games: Record<string, GameLike>;
  prevRooms: Record<string, RoomLike>;
  rooms: Record<string, RoomLike>;
  leaseMs: number;
  /** The command was a walk into a friend's room (their actor). */
  visited?: number | null;
  /** Room score of the member's profile save (아늑함), when known. */
  room?: number;
  now: number;
}): LifeState {
  const { life, member, now } = opts;
  if (!(member.id in life.actors)) return life;
  const online = new Set<string>();
  for (const r of Object.values(opts.rooms))
    for (const [id, lease] of Object.entries(r.leases ?? {}))
      if (id !== member.id && id in life.actors && lease.seen >= now - opts.leaseMs) online.add(id);
  const u = moodTouch(life, member.id, now, online.size);
  if (!u) return life;
  // 아늑함: the room part from the profile save plus the house tier × 8.
  if (opts.room !== undefined && Number.isSafeInteger(opts.room)) u.room = cozyScore(opts.room, life.ext?.[member.id]?.house ?? 0);
  // 방문 (the friendship stat counts the first visit per friend per day).
  if (opts.visited !== undefined && opts.visited !== null && opts.visited !== member.actor) {
    addLet(u, 'visit', now);
    if (grew(statsOf(opts.before, member.id), statsOf(life, member.id), 'visit') > 0) {
      fill(u, 'social', FILL.visitSocial);
      const owner = other(life, uidOf(life, opts.visited), now);
      if (owner) {
        addLet(owner, 'guest', now);
        fill(owner, 'social', FILL.guestSocial);
      }
    }
  }
  // 판 게임 정산 (ledger results; practice and party tables hold no escrow).
  for (const [id, game] of Object.entries(opts.games)) {
    if (game.state !== 'settled' || opts.prevGames[id]?.state === 'settled') continue;
    const humans = game.wallets.length;
    game.wallets.forEach((wallet, i) => {
      const p = other(life, wallet.replace(/^wallet-/, ''), now);
      if (!p) return;
      fill(p, 'fun', FILL.tableFun, 't:' + game.game.slice(0, 16));
      if (humans > 1) {
        fill(p, 'social', FILL.tableSocial);
        addLet(p, 'table', now);
      }
      const net = game.result[i] ?? 0,
        stake = game.deposits[i] ?? 0;
      if (net <= -BIG_RESULT) addLet(p, 'bigLoss', now);
      else if (net >= BIG_RESULT || (stake > 0 && net >= 2 * stake)) addLet(p, 'bigWin', now);
    });
  }
  // 허풍 주점: a trigger pull (뻥 = out, 딸깍 = survived).
  for (const [code, r] of Object.entries(opts.rooms)) {
    const g = r.snapshot.liarsbar,
      shot = g?.lastShot;
    if (!g || !shot) continue;
    const prev = opts.prevRooms[code]?.snapshot.liarsbar;
    if (prev && prev.id === g.id && prev.lastShot && prev.lastShot.seat === shot.seat && prev.lastShot.pull === shot.pull) continue;
    const seatUid = r.snapshot.seats?.liarsbar?.[shot.seat];
    const p = other(life, typeof seatUid === 'string' ? seatUid : null, now);
    if (p) addLet(p, shot.out ? 'bang' : 'survived', now);
  }
  prune(u, now);
  return life;
}

// ---------------------------------------------------------------- effect hooks
function held(life: LifeState, uid: string, kind: InspirationKind, now: number) {
  const i = life.mood?.[uid]?.i;
  return i && i.k === kind && i.left > 0 && i.until > now ? i : null;
}
/**
 * Skill XP multiplier (lounge-growth xpMultiplier → gainXp): 신나요 ×1.15,
 * 기분 좋아요 ×1.1, 지쳤어요 ×0.9, 배움 영감 ×1.2 more. The daily soft cap is
 * counted on the unmultiplied XP, so it never moves.
 */
export function moodXpMult(life: LifeState, uid: string, now: number) {
  const u = life.mood?.[uid];
  if (!u) return 1;
  return xpMultOf(u.v) * (held(life, uid, 'learn', now) ? LEARN_INSPIRATION_XP : 1);
}
/** 풍작 영감: one plot's harvest quality, one step better (gold at most); uses a charge. */
export function moodHarvestQuality(life: LifeState, uid: string, quality: Quality, now: number): Quality {
  const i = held(life, uid, 'harvest', now);
  if (!i || quality >= 2) return quality;
  i.left -= 1;
  return Math.min(2, quality + HARVEST_INSPIRATION_STEP) as Quality;
}
/** 입질 영감: multipliers for one cast (rare-fish weight, bite window); uses a charge. */
export function moodBiteBoost(life: LifeState, uid: string, now: number) {
  const i = held(life, uid, 'bite', now);
  if (!i) return { rare: 1, window: 1 };
  i.left -= 1;
  return { rare: BITE_INSPIRATION_RARE, window: BITE_INSPIRATION_WINDOW };
}

// ---------------------------------------------------------------- actions
const fail = (message: string): never => {
  throw new LifeError(message);
};
/** Crop ids, the fruit basket, dishes and edible forage (나물, 산딸기, 밤…). */
export function snackable(id: string): 'crop' | 'fruit' | 'dish' | 'forage' | null {
  if ((CROPS as readonly string[]).includes(id)) return 'crop';
  if (id === 'fruit') return 'fruit';
  if (Object.prototype.hasOwnProperty.call(DISH_BY_ID, id)) return 'dish';
  const item = Object.prototype.hasOwnProperty.call(ITEM_BY_ID, id) ? ITEM_BY_ID[id] : undefined;
  return item && (item as { kind?: string }).kind === 'forage' ? 'forage' : null;
}
/** Takes one snack item out of the bag (crops: the given quality, else the lowest). */
function takeSnack(life: LifeState, uid: string, id: string, q?: Quality): { kind: NonNullable<ReturnType<typeof snackable>>; q: Quality } {
  const kind = snackable(id);
  if (!kind) fail(MOOD_REJECT.snackItem);
  if (kind === 'crop') {
    const crop = id as Crop;
    const pick = q !== undefined ? q : ([0, 1, 2] as Quality[]).find((t) => cropQCount(life, uid, crop, t) > 0);
    if (pick === undefined || ![0, 1, 2].includes(pick) || cropQCount(life, uid, crop, pick) < 1) fail(MOOD_REJECT.notEnough);
    addCropQ(life, uid, crop, pick!, -1);
    return { kind: 'crop', q: pick! };
  }
  if (kind === 'fruit') {
    if ((life.bag[uid]?.fruit ?? 0) < 1) fail(MOOD_REJECT.notEnough);
    life.bag[uid].fruit -= 1;
    return { kind: 'fruit', q: 0 };
  }
  if (invCount(life, uid, id) < 1) fail(MOOD_REJECT.notEnough);
  addInv(life, uid, id, -1);
  return { kind: kind!, q: 0 };
}

/**
 * The mood's own life actions on an already-cloned, registered life
 * (lounge-life.ts lifeAction). Never gates anything else in the game.
 */
export function moodAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: MoodAction,
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  const uid = member.id,
    actor = member.actor;
  const u = moodTouch(life, uid, now);
  if (!u) fail(LIFE_REJECT.invalid);
  const me = u!;
  let next = ledger;
  switch (a.kind) {
    case 'snack': {
      if ((me.sn ?? 0) >= SNACKS_PER_DAY) fail(MOOD_REJECT.snackMax);
      const q = a.q === undefined ? undefined : ([0, 1, 2] as unknown[]).includes(a.q) ? a.q : fail(MOOD_REJECT.snackItem);
      if (typeof a.item !== 'string') fail(MOOD_REJECT.snackItem);
      const got = takeSnack(life, uid, a.item, q as Quality | undefined);
      fill(me, 'food', got.kind === 'dish' ? SNACK_DISH_FOOD : SNACK_FOOD);
      addLet(me, got.q === 2 ? 'fresh' : 'snack', now);
      me.sn = (me.sn ?? 0) + 1;
      break;
    }
    case 'bedRest': {
      if (me.rs && now - me.rs < REST_COOLDOWN_MS) fail(MOOD_REJECT.restWait);
      fill(me, 'rest', REST_GAIN);
      me.rs = now;
      if (me.room !== undefined && cozyOf(me.room).value >= 6) addLet(me, 'bed', now);
      break;
    }
    case 'barDrink': {
      const n = me.dr ?? 0;
      if (n >= DRINKS_PER_DAY) fail(MOOD_REJECT.drinkMax);
      if (n >= 1) {
        const wallet = 'wallet-' + uid;
        if ((ledger.accounts[wallet] ?? 0) < DRINK_PRICE) fail(MOOD_REJECT.balance);
        next = spendBeom(next, wallet, DRINK_PRICE, `life-bar-drink-${uid}-${++life.seq}`, now, 'bar-drink');
      }
      fill(me, 'food', DRINK_FOOD);
      fill(me, 'fun', DRINK_FUN, 'drink');
      addLet(me, 'drink', now);
      me.dr = n + 1;
      break;
    }
    case 'moodTea': {
      if (!me.cup) fail(MOOD_REJECT.noCup);
      delete me.cup;
      me.n[0] = Math.max(me.n[0], TEA_FOOD_MIN);
      addLet(me, 'tea', now);
      break;
    }
    case 'moodShare': {
      if (typeof a.on !== 'boolean') fail(LIFE_REJECT.invalid);
      if (a.on) me.pub = 1;
      else delete me.pub;
      break;
    }
    case 'cheer': {
      const toUid = uidOf(life, a.to);
      if (!toUid) fail(MOOD_REJECT.friend);
      const toActor = life.actors[toUid!];
      if (toUid === uid || toActor === actor) fail(MOOD_REJECT.self);
      if (!(CHEER_HOWS as readonly unknown[]).includes(a.how)) fail(MOOD_REJECT.how);
      if (me.ch?.includes(toActor)) fail(MOOD_REJECT.cheered);
      const to = other(life, toUid, now);
      if (!to) fail(MOOD_REJECT.friend);
      const them = to!;
      if (a.how === 'snack') {
        if (typeof a.item !== 'string') fail(MOOD_REJECT.snackItem);
        takeSnack(life, uid, a.item!);
        fill(them, 'food', CHEER_SNACK_FOOD);
      }
      // A friend who feels low gets twice the cheer.
      const twice = ['low', 'tired'].includes(tierOf(moodNow(them, now).v)) ? 2 : 1;
      addLet(them, 'cheered', now, twice);
      fill(them, 'social', CHEER_SOCIAL * twice);
      if (birthdayActors(kstDay(now)).includes(toActor)) addLet(them, 'birthdayCheer', now);
      them.cb = [...(them.cb ?? []), [actor, now, a.how] as [number, number, CheerHow]].slice(-5);
      me.ch = [...(me.ch ?? []), toActor];
      addLet(me, 'cheer', now);
      // Hearts through the same once-a-day gate as small talk (no new source).
      if (bondGate(life, `c:${actor}>${toActor}`, now)) addBond(life, actor, toActor, TALK_POINTS, now);
      addNews(life, now, `cheer:${actor}>${toActor}`, 'mood', `${josa(nameOf(actor), ['이', '가'])} ${nameOf(toActor)}에게 응원을 보냈어요`, [actor, toActor]);
      break;
    }
    default:
      fail(LIFE_REJECT.invalid);
  }
  prune(me, now);
  return { life, ledger: next };
}
/**
 * A bought treat (빵집 카페 menu, lounge-town.ts): fills needs and adds one
 * existing moodlet through the same helpers as a snack or a bar drink. No
 * ledger here; the caller spends the price. Returns false when this friend
 * has no mood record (the purchase still stands).
 */
export function moodTreat(
  life: LifeState,
  uid: string,
  now: number,
  t: { food?: number; rest?: number; fun?: number; let: 'snack' | 'drink' },
): boolean {
  const u = moodTouch(life, uid, now);
  if (!u) return false;
  if (t.food) fill(u, 'food', t.food);
  if (t.rest) fill(u, 'rest', t.rest);
  if (t.fun) fill(u, 'fun', t.fun, 'bakery');
  addLet(u, t.let, now);
  prune(u, now);
  return true;
}
export const isMoodAction = (kind: string) => (MOOD_ACTION_KINDS as readonly string[]).includes(kind);

// ---------------------------------------------------------------- views
/** A copy of `u` projected to `now` with the same rules as a write (no state change). */
function moodNow(u: MoodUser, now: number): MoodUser {
  const c = structuredClone(u);
  advance(c, now);
  today(c, now);
  prune(c, now);
  return c;
}
export type MoodletView = { id: MoodletId; name: string; value: number; until: number; stacks: number; icon: MoodIcon };
export type MoodNeedView = { id: NeedId; name: string; value: number; word: string; offset: number };
export type MoodFace = {
  tier: MoodTier;
  /** Holding an inspiration (a small sparkle on the name tag). */
  insp?: true;
  /** Not online (last write over 10 minutes ago). */
  away?: true;
  /** Top thoughts, only when that friend shares details. */
  top?: { name: string; value: number; icon: MoodIcon }[];
};
export type MoodView = {
  v: number;
  target: number;
  tier: MoodTier;
  needs: MoodNeedView[];
  lets: MoodletView[];
  cozy: { score: number; name: string; value: number } | null;
  xp: number;
  gauge: number;
  gaugeMax: number;
  week: number;
  weekMax: number;
  /** An inspiration already came today. */
  todayDone: boolean;
  insp: (MoodInspiration & { name: string; text: string }) | null;
  snacksLeft: number;
  drinks: number;
  drinkPrice: number;
  drinksLeft: number;
  restAt: number;
  cup: number | null;
  pub: boolean;
  cheered: number[];
  cheers: { actor: number; at: number; how: CheerHow }[];
  /** Negative thoughts are being held at −15. */
  capped: boolean;
  /** Friends' faces by actor (tier only unless they share details). */
  faces: Record<number, MoodFace>;
};
function letsOf(u: MoodUser, now: number): MoodletView[] {
  const by = new Map<MoodletId, { stacks: number; until: number }>();
  for (const [id, until] of u.l ?? []) {
    if (until <= now) continue;
    const e = by.get(id);
    by.set(id, { stacks: (e?.stacks ?? 0) + 1, until: Math.max(e?.until ?? 0, until) });
  }
  const out: MoodletView[] = [...by].map(([id, e]) => ({
    id,
    name: MOODLETS[id].name,
    value: tenth(MOODLETS[id].value * (2 - 0.5 ** (e.stacks - 1))),
    until: e.until,
    stacks: e.stacks,
    icon: MOODLETS[id].icon,
  }));
  if (u.i && u.i.until > now && u.i.left > 0)
    out.push({ id: 'inspired', name: MOODLETS.inspired.name, value: MOODLETS.inspired.value, until: u.i.until, stacks: 1, icon: 'spark' });
  return out.sort((a, b) => Math.abs(b.value) - Math.abs(a.value) || a.until - b.until);
}
/** A friend's face for name tags and portraits (details only when they share). */
export function moodFace(u: MoodUser, now: number): MoodFace {
  const c = moodNow(u, now);
  const face: MoodFace = { tier: tierOf(c.v) };
  if (c.i) face.insp = true;
  if (now - u.at > ACTIVE_GAP_MS) face.away = true;
  if (u.pub)
    face.top = letsOf(c, now)
      .slice(0, 3)
      .map((l) => ({ name: l.name, value: l.value, icon: l.icon }));
  return face;
}
/** Every friend's face by actor (compute only). */
export function moodFaces(life: LifeState, now: number): Record<number, MoodFace> {
  const out: Record<number, MoodFace> = {};
  for (const [uid, u] of Object.entries(life.mood ?? {})) {
    const actor = life.actors[uid];
    if (actorOk(actor)) out[actor] = moodFace(u, now);
  }
  return out;
}
/**
 * My mood for the HUD and the panel, projected to `now` without writing (a
 * friend who never had a mood sees the neutral start). D-3 safe.
 */
export function moodView(life: LifeState, uid: string, now: number): MoodView {
  const raw = life.mood?.[uid];
  const u = raw ? moodNow(raw, now) : blank(now);
  const s = moodletSums(u, now);
  const target = moodTarget(u, now);
  const day = kstDay(now);
  const faces = moodFaces(life, now);
  delete faces[life.actors[uid]];
  return {
    v: Math.round(u.v),
    target: Math.round(target),
    tier: tierOf(u.v),
    needs: NEEDS.map((id, i) => ({
      id,
      name: NEED_INFO[id].name,
      value: Math.round(u.n[i]),
      word: needWord(id, u.n[i]),
      offset: NEED_INFO[id].offset(u.n[i]),
    })),
    lets: letsOf(u, now),
    cozy: u.room !== undefined ? { score: u.room, name: cozyOf(u.room).name, value: cozyOf(u.room).value } : null,
    xp: moodXpMult({ ...life, mood: { [uid]: u } } as LifeState, uid, now),
    gauge: Math.floor(u.g ?? 0),
    gaugeMax: INSPIRATION_GAUGE,
    week: weekCount(u, day),
    weekMax: INSPIRATIONS_PER_WEEK,
    todayDone: u.id === day,
    insp: u.i ? { ...u.i, name: INSPIRATIONS[u.i.k].name, text: INSPIRATIONS[u.i.k].text } : null,
    snacksLeft: Math.max(0, SNACKS_PER_DAY - (u.sn ?? 0)),
    drinks: u.dr ?? 0,
    drinkPrice: (u.dr ?? 0) >= 1 ? DRINK_PRICE : 0,
    drinksLeft: Math.max(0, DRINKS_PER_DAY - (u.dr ?? 0)),
    restAt: u.rs ? u.rs + REST_COOLDOWN_MS : 0,
    cup: u.cup ?? null,
    pub: !!u.pub,
    cheered: [...(u.ch ?? [])],
    cheers: (u.cb ?? []).map(([actor, at, how]) => ({ actor, at, how })),
    capped: s.neg + NEED_NEGATIVE(u) < NEGATIVE_CAP,
    faces,
  };
}
const NEED_NEGATIVE = (u: MoodUser) =>
  NEEDS.reduce((sum, id, i) => sum + Math.min(0, NEED_INFO[id].offset(u.n[i])), 0);
/** Tier name of a face (for aria labels). */
export const moodTierName = (tier: MoodTier) => MOOD_TIER_BY_ID[tier].name;
