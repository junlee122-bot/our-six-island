// 우리 농장 F5 engine: the 양식장 (fishPond, design-our-farm.md §10-4). Its
// rules and numbers are in lounge-farm-pond-data.ts; the site framework
// (building, the 낚시 Lv8 medium pond as tier 2, demolishing) is
// lounge-farm-sites.ts, which calls in here for the pond's state, its daily
// hook, its actions and its view.
//
// State (`site.state.pond`, small): the species, how many fish, how many of
// the pond's requests were met, the last day it grew, and what waits to be
// collected. The request itself is not stored: it follows from the site and
// the number of requests met (pondWant), so nothing can drift.
//
// Cycle-safe like lounge-farm-sites.ts: lounge-life.ts → sites → here → life
// helpers, used only inside functions.
import { hash32 } from './lounge-calendar.ts';
import { FISH_BY_ID, ITEM_BY_ID } from './lounge-items.ts';
import {
  POND_GROW_DAYS,
  POND_HOLD,
  POND_MAKE_BASE,
  POND_MAKE_PER_FISH,
  POND_MAX,
  POND_REJECT,
  POND_ROE_CHANCE,
  POND_SECOND_FROM,
  POND_SECOND_PER_FISH,
  POND_START_CAP,
  POND_WANTS,
  POND_XP,
  isRoeId,
  pondFishOk,
  roeOf,
} from './lounge-farm-pond-data.ts';
import { CROP_INFO, LifeError, type Crop, type LifeState } from './lounge-life.ts';
import { addInv, discover, invCount, itemCount, takeItem } from './lounge-life-plus.ts';
import { gainXp, growthMods } from './lounge-growth.ts';

const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
function fail(message: string): never {
  throw new LifeError(message);
}

/** A pond's state: species `f`, `n` fish, `b` requests met, last growth day `g`, waiting output `o`. */
export type PondState = { f?: string; n?: number; b?: number; g?: number; o?: string[] };
export type PondAction =
  | { kind: 'pondStock'; site: string; fish: string }
  | { kind: 'pondCollect'; site: string }
  | { kind: 'pondGive'; site: string }
  | { kind: 'pondEmpty'; site: string };
export const POND_ACTIONS = ['pondStock', 'pondCollect', 'pondGive', 'pondEmpty'] as const;

/** Fish a pond of `tier` may ever hold before the talent (5 small, 10 medium). */
export const pondMax = (tier: number) => POND_MAX[Math.max(0, Math.min(POND_MAX.length, tier) - 1)];
/** The cap now: the start cap plus the requests met, up to the pond's size, plus 양식장 지기. */
export function pondCap(tier: number, p: PondState, bonus = 0) {
  return Math.min(pondMax(tier), POND_START_CAP + (p.b ?? 0)) + bonus;
}
/** The owner's talent bonus (재능 양식장 지기). */
const capBonus = (life: LifeState, owner: string) => growthMods(life, owner).pondCap;
/**
 * What the pond asks for right now (null: nothing): once it is full and the
 * cap can still rise. The item is picked from the site and the requests met.
 */
export function pondWant(siteId: string, tier: number, p: PondState, bonus = 0): { item: string; n: number } | null {
  if (!p.f || (p.n ?? 0) < pondCap(tier, p, bonus) || POND_START_CAP + (p.b ?? 0) >= pondMax(tier)) return null;
  return POND_WANTS[hash32(`pondwant:${siteId}:${p.f}:${p.b ?? 0}`) % POND_WANTS.length];
}

/** Reads a stored pond (unknown keys and impossible numbers dropped). */
export function readPond(v: unknown, tier: number): PondState | undefined {
  const x = obj(v);
  if (typeof x.f !== 'string' || !pondFishOk(FISH_BY_ID[x.f])) return undefined;
  const max = pondMax(tier) + 4;
  const out: PondState = { f: x.f, n: safe(x.n) && x.n >= 1 ? Math.min(max, x.n) : 1 };
  if (safe(x.b) && x.b > 0) out.b = Math.min(POND_MAX[POND_MAX.length - 1], x.b);
  if (safe(x.g) && x.g > 0) out.g = x.g;
  const o = Array.isArray(x.o) ? x.o.filter((id): id is string => id === x.f || isRoeId(id)).slice(0, POND_HOLD) : [];
  if (o.length) out.o = o;
  return out;
}

/**
 * The daily hook (lounge-farm-sites.ts DAILY, once per KST day): one more
 * fish every POND_GROW_DAYS days up to the cap, then today's output (more
 * likely with more fish; a second one from POND_SECOND_FROM fish) while
 * fewer than POND_HOLD wait.
 */
export function dailyPond(life: LifeState, siteId: string, tier: number, owner: string, p: PondState, day: number) {
  if (!p.f) return;
  const mods = growthMods(life, owner),
    cap = pondCap(tier, p, mods.pondCap);
  let n = p.n ?? 1;
  if (n < cap) {
    if (day - (p.g ?? day) >= POND_GROW_DAYS) {
      n++;
      p.g = day;
    }
  } else p.g = day;
  p.n = n;
  const out = (p.o ??= []);
  const make = (k: number, chance: number) => {
    if (out.length >= POND_HOLD || hash32(`pond:${siteId}:${p.f}:${day}:${k}`) % 100 >= chance) return;
    const roe = hash32(`pondroe:${siteId}:${p.f}:${day}:${k}`) % 100 < POND_ROE_CHANCE + mods.pondRoe;
    out.push(roe ? roeOf(p.f!) : p.f!);
  };
  make(0, POND_MAKE_BASE + POND_MAKE_PER_FISH * n);
  if (n >= POND_SECOND_FROM) make(1, (n - POND_SECOND_FROM + 1) * POND_SECOND_PER_FISH);
  if (!out.length) delete p.o;
}

/** Runs a pond action on the owner's built pond (`p` is the site's pond state, created on stocking). */
export function pondAction(
  life: LifeState,
  uid: string,
  siteId: string,
  tier: number,
  state: { pond?: PondState },
  a: PondAction,
  now: number,
  day: number,
) {
  const p = state.pond;
  switch (a.kind) {
    case 'pondStock': {
      if (p?.f) fail(POND_REJECT.stocked);
      if (typeof a.fish !== 'string' || !pondFishOk(FISH_BY_ID[a.fish])) fail(POND_REJECT.fish);
      if (invCount(life, uid, a.fish) < 1) fail(POND_REJECT.noFish);
      addInv(life, uid, a.fish, -1);
      state.pond = { f: a.fish, n: 1, g: day };
      gainXp(life, uid, 'fish', POND_XP, now);
      return;
    }
    case 'pondCollect': {
      if (!p?.f) fail(POND_REJECT.notStocked);
      if (!p.o?.length) fail(POND_REJECT.nothing);
      for (const id of p.o) {
        addInv(life, uid, id, 1);
        if (!isRoeId(id)) discover(life, uid, id);
      }
      gainXp(life, uid, 'fish', POND_XP * p.o.length, now);
      delete p.o;
      return;
    }
    case 'pondGive': {
      if (!p?.f) fail(POND_REJECT.notStocked);
      const want = pondWant(siteId, tier, p, capBonus(life, uid));
      if (!want) fail(POND_REJECT.noWant);
      if (itemCount(life, uid, want!.item) < want!.n) fail(POND_REJECT.want);
      takeItem(life, uid, want!.item, want!.n);
      p.b = (p.b ?? 0) + 1;
      gainXp(life, uid, 'fish', 3 * POND_XP, now);
      return;
    }
    case 'pondEmpty': {
      if (!p?.f) fail(POND_REJECT.notStocked);
      if (p.o?.length) fail(POND_REJECT.full);
      // The fish put in comes back; the rest swim off to the river.
      addInv(life, uid, p.f, 1);
      delete state.pond;
      return;
    }
  }
}

/** A pond as the panel and the scene draw it. */
export type PondView = { f: string; n: number; cap: number; max: number; o: string[]; want?: { item: string; n: number; name: string }; growAt: number };
export function pondView(life: LifeState, siteId: string, tier: number, owner: string, p: PondState | undefined, today: number): PondView | undefined {
  if (!p?.f) return undefined;
  const bonus = capBonus(life, owner),
    want = pondWant(siteId, tier, p, bonus);
  return {
    f: p.f,
    n: p.n ?? 1,
    cap: pondCap(tier, p, bonus),
    max: pondMax(tier) + bonus,
    o: [...(p.o ?? [])],
    ...(want ? { want: { ...want, name: ITEM_BY_ID[want.item]?.name ?? CROP_INFO[want.item as Crop]?.name ?? want.item } } : {}),
    growAt: (p.g ?? today) + POND_GROW_DAYS,
  };
}
