// 낚시 업그레이드 engine (handover/design/design-fishing-upgrade.md).
// Cast → bite → hook (reaction grade) → 손맛 fight (lounge-fish-minigame,
// replayed here from the stored seed) → catch with size, weight, quality,
// treasure, records, co-op bonus and the weekly cup. Crab pots, tackle
// slots and the weekly cup prizes live here too. State: `world.life.angling`
// (absent in older worlds; the legacy cast/reel in lounge-life-plus stay).
//
// Cycle-safe like lounge-life-plus: lounge-life.ts imports this module and it
// imports the life modules back, so their bindings are only used inside
// functions, never at the top level.
import { districtFlagsFor } from './lounge-districts.ts';
import { hasExplorerPass } from './lounge-explorer-pass.ts';
import { grantBeom, kstDay, type LoungeLedger } from './lounge-economy.ts';
import { ACTOR_NAMES, hash32, gameHour, isDaytime, isNighttime, seasonOf, weatherOf, type Season, type Weather } from './lounge-calendar.ts';
import { FISH, FISH_BY_ID, ITEM_BY_ID, LIGHTS_RARE_BOOST, SPOT_INFO, eligibleSky, eligibleTime, isItemId, type FishDef, type Spot } from './lounge-items.ts';
import {
  BAITS,
  BEHAVIOUR_NAME,
  CRAB_POT,
  FISH_PROFILE,
  LEGACY_LEGENDS,
  POT_FRESH,
  POT_SEA,
  TACKLES,
  TACKLE_USES,
  inHours,
  type BaitId,
  type Behaviour,
  type FishProfile,
  type TackleId,
} from './lounge-fish-data.ts';
import { BAR_BASE, BAR_MAX, GAIN, MAX_TICKS, TICK_MS, baseLoss, replayTrace, type FightResult, type FightSetup } from './lounge-fish-minigame.ts';
import { fishQualitySplit, type FishQ } from './lounge-fish-quality.ts';
import { CROPS, CROP_INFO, LifeError, addCount, cropInSeason, type Crop, type LifeState, type Quality } from './lounge-life.ts';
import {
  BITE_MIN_MS,
  BITE_SPREAD_MS,
  REEL_EARLY_MS,
  ROD_WINDOW,
  addInv,
  addMemory,
  addNews,
  bump,
  discover,
  fishingParcel,
  hasFlag,
  invCount,
  reactionGrade,
  spotBlock,
  weekOfDay,
  weekResetAt,
  type FishingParcel,
  type ReactionGrade,
} from './lounge-life-plus.ts';
import { XP, fishXp } from './lounge-growth-data.ts';
import { gainXp, growthChance, growthMods, skillLevel, toolTier } from './lounge-growth.ts';
import { moodBiteBoost } from './lounge-mood.ts';
// 물고기의 행운: the 식사 칸 (×2 rare, window ×1.2) or 뱃사람 안주 in the 간식 칸 (×1.5, ×1.1).
import { luckMods } from './lounge-food-data.ts';

// ---------------------------------------------------------------- constants
/**
 * Hook grace after the bite window closes, by fish grade: the server still
 * hooks until `biteAt + windowMs + HOOK_SLACK_MS[grade]` (the cast's
 * `expiresAt`). Common fish forgive a slow page or network the most, legends
 * the least; the legacy cast/reel keeps its single REEL_SLACK_MS.
 */
export const HOOK_SLACK_MS = { common: 3_000, uncommon: 2_200, rare: 1_500, legend: 1_000 } as const;
export type FishRarity = keyof typeof HOOK_SLACK_MS;
export const hookSlackMs = (f: FishDef) => HOOK_SLACK_MS[rarityOf(f)];
/** Network allowance: a trace may run this much longer than the server saw. */
export const FIGHT_SLACK_MS = 2_000;
/** A fight left open longer than this is gone (the fish swam off). */
export const FIGHT_STALE_MS = MAX_TICKS * TICK_MS + 60_000;
export const CRAB_READY_MS = 4 * 3_600_000;
export const CRAB_MAX = 3;
/** 낚시 Lv6: one more pot (techtree "통발 +1"). */
export const CRAB_MAX_LV6 = 4;
/** Friends at the same spot within this window count for 함께 낚시. */
export const COOP_WINDOW_MS = 90_000;
export const COOP_MAX = 3;
/** Per friend: size +3%, treasure +2%p, loss −5%. */
export const COOP_SIZE = 0.03;
export const COOP_TREASURE = 2;
export const COOP_LOSS = 5;
/** Treasure chance in percent. */
export const TREASURE_BASE = 12;
export const TREASURE_TACKLE = 15;
export const TACKLE_FLOAT_BAR = 700;
export const LEVEL_BAR = 50;
/** Weekly cup: rarity points, best three catches per friend, prizes for the top three. */
export const CUP_POINTS = { common: 10, uncommon: 20, rare: 40, legend: 100 } as const;
export const CUP_PRIZES = [5_000, 3_000, 1_500] as const;
export const CUP_MIN_PLAYERS = 3;
export const CUP_HISTORY = 4;
const FRESH_SPOTS: readonly Spot[] = ['river', 'pond', 'rapids', 'falls', 'lake', 'bridge'];
const SEA_SPOTS: readonly Spot[] = ['sea', 'rocks', 'harbor'];
const COUNT_MAX = 99_999;

export const ANGLING_REJECT = {
  spot: '갈 수 없는 곳이에요.',
  spotLocked: '아직 복원되지 않은 곳이에요. 마을 꾸러미를 채워 주세요.',
  spotRod: '물살이 세서 낚싯대 2단계부터 던질 수 있어요.',
  spotNight: '항구는 해가 진 뒤(저녁 7시~새벽 5시)에만 열려요.',
  bait: '그 미끼가 없어요.',
  token: '낚싯대를 다시 던져 주세요.',
  tackle: '그 찌가 가방에 없어요.',
  tackleSlot: '찌는 낚싯대 3단계부터 1개, 4단계부터 2개 달 수 있어요.',
  potNone: '통발이 없어요. 상점이나 제작대에서 구해 주세요.',
  potMax: '통발은 더 놓을 수 없어요.',
  potBait: '통발에 넣을 미끼가 없어요.',
  potHere: '여기에 놓은 내 통발이 없어요.',
  potWait: '아직 통발이 비어 있어요. 조금 더 기다려 주세요.',
  potFull: '통발에 뭔가 들었어요. 먼저 거둬 주세요.',
  potBaited: '이미 미끼를 넣어 둔 통발이에요.',
  cup: '받을 수 있는 대회 상품이 없어요.',
  cupClaimed: '이미 받은 상품이에요.',
} as const;
const fail = (message: string): never => {
  throw new LifeError(message);
};

// ---------------------------------------------------------------- types
export type AnglerCast = {
  token: string;
  spot: Spot;
  castAt: number;
  biteAt: number;
  windowMs: number;
  expiresAt: number;
  /** Hidden from the view. */
  fish: string;
  cm: number;
  bait?: BaitId;
  coop: number;
};
export type AnglerFight = {
  token: string;
  spot: Spot;
  castAt: number;
  hookAt: number;
  /** Hidden from the view. */
  fish: string;
  cm: number;
  setup: FightSetup;
  coop: number;
  reactionMs: number;
};
export type TreasureLoot = { kind: 'item'; item: string; n: number } | { kind: 'seed'; item: string; n: number } | { kind: 'furn'; item: string; n: 1 };
export type AnglerLast = {
  ok: boolean;
  at: number;
  fish?: string;
  cm?: number;
  grams?: number;
  quality?: Quality;
  perfect?: boolean;
  treasure?: TreasureLoot;
  /** A treasure chest showed up but got away. */
  treasureLost?: boolean;
  record?: boolean;
  best?: boolean;
  legend?: boolean;
  coop?: number;
  reactionMs?: number;
  grade?: ReactionGrade;
  parcel?: FishingParcel;
  seconds?: number;
  cupScore?: number;
  reason?: 'early' | 'late' | 'escaped' | 'refused';
};
export type SpeciesLog = { n: number; cm: number; g: number; q: Quality; first: number };
export type CrabPot = { spot: Spot; at: number; bait: boolean };
export type TackleSlot = { id: TackleId; uses: number };
export type AnglerUser = {
  cast?: AnglerCast;
  fight?: AnglerFight;
  last?: AnglerLast;
  log?: Record<string, SpeciesLog>;
  fq?: Record<string, FishQ>;
  tackle?: TackleSlot[];
  pots?: CrabPot[];
  legends?: string[];
  /** Spots where I caught something (unlocks the book's time/season hints there). */
  spots?: Spot[];
};
export type CupCatch = { fish: string; cm: number; score: number };
export type CupWeek = { week: number; e: Record<string, CupCatch[]> };
export type CupResult = { week: number; players: number; ranks: { actor: number; score: number }[]; claimed: number[] };
export type AnglingState = {
  u?: Record<string, AnglerUser>;
  cup?: CupWeek;
  cupHistory?: CupResult[];
  /** Every fish the village has landed with the new rod flow (harbor district hook). */
  total?: number;
};
export type AnglingExt = { angling?: AnglingState };
export type AnglingAction =
  | { kind: 'anglerCast'; spot: Spot; bait?: BaitId | null }
  | { kind: 'anglerHook'; token: string }
  | { kind: 'anglerLand'; token: string; runs: number[] }
  | { kind: 'anglerCancel'; token: string }
  | { kind: 'anglerTackle'; slot: number; item: TackleId | null }
  | { kind: 'crabSet'; spot: Spot }
  | { kind: 'crabCollect'; spot: Spot }
  | { kind: 'crabTake'; spot: Spot }
  | { kind: 'cupClaim'; week: number };
export { ANGLING_ACTION_KINDS } from './lounge-fish-data.ts';

// ---------------------------------------------------------------- reading
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const nat = (n: unknown): n is number => safe(n) && n >= 0;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const isSpot = (s: unknown): s is Spot => typeof s === 'string' && own(SPOT_INFO, s);
const isFish = (s: unknown): s is string => typeof s === 'string' && own(FISH_BY_ID, s);
const isBait = (s: unknown): s is BaitId => (BAITS as readonly unknown[]).includes(s);
const isTackle = (s: unknown): s is TackleId => (TACKLES as readonly unknown[]).includes(s);
const isQ = (q: unknown): q is Quality => q === 0 || q === 1 || q === 2;
const TOKEN = /^[a-z0-9]{1,24}$/;
const BEHAVIOURS: readonly Behaviour[] = ['calm', 'dart', 'sink', 'float', 'mixed'];

function readSetup(v: unknown): FightSetup | undefined {
  const s = obj(v),
    t = s.treasure === null || s.treasure === undefined ? null : obj(s.treasure);
  if (
    !nat(s.seed) ||
    s.seed > 0xffffffff ||
    !(BEHAVIOURS as readonly unknown[]).includes(s.behaviour) ||
    ![s.difficulty, s.bar, s.gain, s.loss].every((n) => nat(n) && n <= 10_000) ||
    (t && (!nat(t.at) || !nat(t.pos) || t.at > MAX_TICKS || t.pos > 10_000))
  )
    return;
  return {
    seed: s.seed as number,
    behaviour: s.behaviour as Behaviour,
    difficulty: s.difficulty as number,
    bar: s.bar as number,
    gain: s.gain as number,
    loss: s.loss as number,
    treasure: t ? { at: t.at as number, pos: t.pos as number } : null,
  };
}
function readCast(v: unknown): AnglerCast | undefined {
  const c = obj(v);
  if (typeof c.token !== 'string' || !TOKEN.test(c.token) || !isSpot(c.spot) || !isFish(c.fish)) return;
  if (![c.castAt, c.biteAt, c.windowMs, c.expiresAt, c.cm].every(nat)) return;
  return {
    token: c.token,
    spot: c.spot,
    castAt: c.castAt as number,
    biteAt: c.biteAt as number,
    windowMs: c.windowMs as number,
    expiresAt: c.expiresAt as number,
    fish: c.fish,
    cm: c.cm as number,
    ...(isBait(c.bait) ? { bait: c.bait } : {}),
    coop: nat(c.coop) ? Math.min(COOP_MAX, c.coop) : 0,
  };
}
function readFight(v: unknown): AnglerFight | undefined {
  const f = obj(v),
    setup = readSetup(f.setup);
  if (!setup || typeof f.token !== 'string' || !TOKEN.test(f.token) || !isSpot(f.spot) || !isFish(f.fish)) return;
  if (![f.castAt, f.hookAt, f.cm, f.reactionMs].every(nat)) return;
  return {
    token: f.token,
    spot: f.spot,
    castAt: f.castAt as number,
    hookAt: f.hookAt as number,
    fish: f.fish,
    cm: f.cm as number,
    setup,
    coop: nat(f.coop) ? Math.min(COOP_MAX, f.coop) : 0,
    reactionMs: Math.min(120_000, f.reactionMs as number),
  };
}
function readLoot(v: unknown): TreasureLoot | undefined {
  const l = obj(v);
  if (typeof l.item !== 'string' || !nat(l.n) || l.n < 1 || l.n > 9) return;
  if (l.kind === 'item' && isItemId(l.item)) return { kind: 'item', item: l.item, n: l.n };
  if (l.kind === 'seed' && (CROPS as readonly string[]).includes(l.item)) return { kind: 'seed', item: l.item, n: l.n };
  if (l.kind === 'furn' && TREASURE_FURNITURE.includes(l.item)) return { kind: 'furn', item: l.item, n: 1 };
  return;
}
function readLast(v: unknown): AnglerLast | undefined {
  const l = obj(v);
  if (typeof l.ok !== 'boolean' || !nat(l.at)) return;
  const out: AnglerLast = { ok: l.ok, at: l.at };
  if (isFish(l.fish)) out.fish = l.fish;
  for (const k of ['cm', 'grams', 'seconds', 'cupScore', 'reactionMs', 'coop'] as const) {
    const n = l[k];
    if (nat(n) && n <= 10_000_000) out[k] = n;
  }
  if (out.reactionMs !== undefined) out.grade = reactionGrade(out.reactionMs);
  if (isQ(l.quality)) out.quality = l.quality;
  for (const k of ['perfect', 'record', 'best', 'legend', 'treasureLost'] as const) if (l[k] === true) out[k] = true;
  const loot = readLoot(l.treasure);
  if (loot) out.treasure = loot;
  const parcel = obj(l.parcel);
  if (l.ok && parcel.n === 1 && typeof parcel.item === 'string') {
    if (parcel.kind === 'seed' && (CROPS as readonly string[]).includes(parcel.item)) out.parcel = { kind: 'seed', item: parcel.item as never, n: 1 };
    else if (parcel.kind === 'food' && isItemId(parcel.item)) out.parcel = { kind: 'food', item: parcel.item, n: 1 };
  }
  if (l.reason === 'early' || l.reason === 'late' || l.reason === 'escaped' || l.reason === 'refused') out.reason = l.reason;
  return out;
}
function readUser(v: unknown): AnglerUser | undefined {
  const x = obj(v),
    out: AnglerUser = {};
  const cast = readCast(x.cast);
  if (cast) out.cast = cast;
  const fight = readFight(x.fight);
  if (fight) out.fight = fight;
  const last = readLast(x.last);
  if (last) out.last = last;
  const log: Record<string, SpeciesLog> = {};
  for (const [raw, e] of Object.entries(obj(x.log)).slice(0, FISH.length)) {
    const s = obj(e);
    // 다슬기 was logged as 'snail' before it got its own id (달팽이 the bug keeps 'snail').
    const id = raw === 'snail' ? 'daseulgi' : raw;
    if (isFish(id) && nat(s.n) && s.n > 0 && nat(s.cm) && nat(s.g) && isQ(s.q) && nat(s.first))
      log[id] = { n: Math.min(COUNT_MAX, s.n), cm: s.cm, g: s.g, q: s.q, first: s.first };
  }
  if (Object.keys(log).length) out.log = log;
  const fq: Record<string, FishQ> = {};
  for (const [id, q] of Object.entries(obj(x.fq)).slice(0, FISH.length)) {
    if (isFish(id) && Array.isArray(q) && q.length === 2 && q.every(nat) && (q[0] > 0 || q[1] > 0))
      fq[id] = [Math.min(COUNT_MAX, q[0]), Math.min(COUNT_MAX, q[1])];
  }
  if (Object.keys(fq).length) out.fq = fq;
  if (Array.isArray(x.tackle)) {
    const tackle = x.tackle
      .slice(0, 2)
      .map(obj)
      .filter((t) => isTackle(t.id) && nat(t.uses) && t.uses > 0)
      .map((t) => ({ id: t.id as TackleId, uses: Math.min(TACKLE_USES, t.uses as number) }));
    if (tackle.length) out.tackle = tackle;
  }
  if (Array.isArray(x.pots)) {
    const seen = new Set<string>();
    const pots = x.pots
      .slice(0, CRAB_MAX_LV6)
      .map(obj)
      .filter((p) => isSpot(p.spot) && nat(p.at) && !seen.has(p.spot) && seen.add(p.spot as string))
      .map((p) => ({ spot: p.spot as Spot, at: p.at as number, bait: p.bait === true }));
    if (pots.length) out.pots = pots;
  }
  if (Array.isArray(x.legends)) {
    const legends = [...new Set(x.legends.filter(isFish))].slice(0, 16);
    if (legends.length) out.legends = legends;
  }
  if (Array.isArray(x.spots)) {
    const spots = [...new Set(x.spots.filter(isSpot))];
    if (spots.length) out.spots = spots;
  }
  return Object.keys(out).length ? out : undefined;
}
const readCatches = (v: unknown): CupCatch[] =>
  (Array.isArray(v) ? v : [])
    .slice(0, 3)
    .map(obj)
    .filter((c) => isFish(c.fish) && nat(c.cm) && nat(c.score) && c.score <= 1_000)
    .map((c) => ({ fish: c.fish as string, cm: c.cm as number, score: c.score as number }));
/** Normalizes `world.life.angling`; every key is omitted when empty (older worlds read as before). */
export function readAngling(value: unknown): AnglingExt {
  const v = obj(value);
  if (!Object.keys(v).length) return {};
  const out: AnglingState = {};
  const u: Record<string, AnglerUser> = {};
  for (const [uid, x] of Object.entries(obj(v.u)).slice(0, 32)) {
    if (!UUID.test(uid) || Object.keys(u).length >= 16) continue;
    const r = readUser(x);
    if (r) u[uid] = r;
  }
  if (Object.keys(u).length) out.u = u;
  const cup = obj(v.cup);
  if (nat(cup.week) && cup.week > 0) {
    const e: Record<string, CupCatch[]> = {};
    for (const [a, list] of Object.entries(obj(cup.e))) {
      const catches = readCatches(list);
      if (/^[0-6]$/.test(a) && catches.length) e[a] = catches;
    }
    out.cup = { week: cup.week, e };
  }
  if (Array.isArray(v.cupHistory)) {
    const hist = v.cupHistory
      .slice(-CUP_HISTORY)
      .map(obj)
      .filter((h) => nat(h.week) && nat(h.players))
      .map((h) => ({
        week: h.week as number,
        players: Math.min(7, h.players as number),
        ranks: (Array.isArray(h.ranks) ? h.ranks : [])
          .slice(0, 3)
          .map(obj)
          .filter((r) => nat(r.actor) && r.actor < 7 && nat(r.score))
          .map((r) => ({ actor: r.actor as number, score: r.score as number })),
        claimed: (Array.isArray(h.claimed) ? [...new Set(h.claimed)] : []).filter((a): a is number => nat(a) && a < 7),
      }));
    if (hist.length) out.cupHistory = hist;
  }
  if (nat(v.total) && v.total > 0) out.total = Math.min(Number.MAX_SAFE_INTEGER, v.total);
  return Object.keys(out).length ? { angling: out } : {};
}

// ---------------------------------------------------------------- species rules
/** A rod fish's fight profile (rarity default when the table has none). */
export function profileOf(f: FishDef): FishProfile {
  return FISH_PROFILE[f.id] ?? { behaviour: 'mixed', difficulty: f.weight <= 1 ? 88 : f.weight < 10 ? 65 : f.weight < 20 ? 45 : 25 };
}
export const isLegend = (f: FishDef) => f.weight <= 1;
export type AnglerContext = {
  season: Season;
  weather: Weather;
  now: number;
  /** 낚시 skill level and rod tier (legend gates); defaults let anything through. */
  level?: number;
  rod?: number;
  /** Legends this friend already caught (caught once each). */
  caught?: readonly string[];
};
/** Season, sky, day/night, game-clock hours and legend gates. */
export function fishAvailable(f: FishDef, ctx: AnglerContext): boolean {
  const p = profileOf(f),
    seasons = p.season ? [p.season] : f.seasons;
  if (!seasons.includes(ctx.season) || !eligibleSky(f.sky, ctx.weather)) return false;
  if (!eligibleTime(f.time, isDaytime(ctx.now), isNighttime(ctx.now)) || !inHours(p.hours, gameHour(ctx.now))) return false;
  if (isLegend(f)) {
    if (ctx.caught?.includes(f.id)) return false;
    if (p.legend && ((ctx.level ?? 10) < p.legend.level || (ctx.rod ?? 5) < p.legend.rod)) return false;
  }
  return true;
}
/** What can bite at a spot now (commons fill in quiet water like the legacy table). */
export function anglerCandidates(spot: Spot, ctx: AnglerContext): FishDef[] {
  const local = FISH.filter((f) => f.spots.includes(spot));
  const current = local.filter((f) => fishAvailable(f, ctx));
  if (current.length >= 3) return current;
  const visitors = local
    .filter((f) => f.weight >= 10 && !current.includes(f) && f.seasons.length > 0)
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
  return [...current, ...visitors.slice(0, 3 - current.length)];
}
/** Rarity bucket (cup points, hook grace, UI). */
export const rarityOf = (f: FishDef): FishRarity => (f.weight <= 1 ? 'legend' : f.weight < 10 ? 'rare' : f.weight < 20 ? 'uncommon' : 'common');
/** Rough body build per fish look (g per cm³ ×1e-3): long fish are light for their length. */
const BUILD: Readonly<Record<string, number>> = {
  eel: 0.35, snakehead: 0.7, loach: 0.45, hairtail: 0.28, conger: 0.35, moonhairtail: 0.28,
  flounder: 1.25, puffer: 1.3, goldfish: 1.3, bluegill: 1.35, filefish: 1.2,
  squid: 0.75, mitre: 0.75, octopus: 0.9, crayfish: 1.6, lakelord: 0.8, icecod: 0.9,
  daseulgi: 2.2, shrimp: 1.1, crab: 2.2, clam: 2.4, oyster: 2.2, conch: 2.4,
};
/** Weight in grams of a fish of `cm` (records, cards). */
export const fishGrams = (id: string, cm: number) => Math.max(1, Math.round(15.5 * (BUILD[id] ?? 1) * (cm / 10) ** 3));
export const gramsText = (g: number) => (g >= 1000 ? `${(g / 1000).toFixed(g >= 10_000 ? 0 : 1)}kg` : `${g}g`);
/** Size percentile 0–1 inside the species' range. */
export const sizePct = (f: FishDef, cm: number) => (f.cm[1] > f.cm[0] ? Math.max(0, Math.min(1, (cm - f.cm[0]) / (f.cm[1] - f.cm[0]))) : 0.5);
/** Quality from size (≥60% silver, ≥90% gold) and a perfect fight (+1). */
export function catchQuality(f: FishDef, cm: number, perfect: boolean): Quality {
  const p = sizePct(f, cm),
    base = p >= 0.9 ? 2 : p >= 0.6 ? 1 : 0;
  return Math.min(2, base + (perfect ? 1 : 0)) as Quality;
}
export function cupScore(f: FishDef, cm: number, perfect: boolean) {
  return Math.round(CUP_POINTS[rarityOf(f)] * (1 + sizePct(f, cm)) * (perfect ? 1.2 : 1));
}
/** Catch zone height for a rod tier, skill level and the big float. */
export const barHeight = (rod: number, level: number, float: boolean) =>
  Math.min(BAR_MAX, (BAR_BASE[Math.max(1, Math.min(5, rod))] ?? BAR_BASE[1]) + level * LEVEL_BAR + (float ? TACKLE_FLOAT_BAR : 0));
export const tackleSlots = (rod: number) => (rod >= 4 ? 2 : rod >= 3 ? 1 : 0);
export const potMax = (level: number) => (level >= 6 ? CRAB_MAX_LV6 : CRAB_MAX);

// ---------------------------------------------------------------- treasure
export const TREASURE_FURNITURE = ['furn-cherry-vase', 'furn-fan', 'furn-maple-garland', 'furn-snowman'];
const SEASON_FURN: Record<Season, string> = { spring: 'furn-cherry-vase', summer: 'furn-fan', autumn: 'furn-maple-garland', winter: 'furn-snowman' };
export const TREASURE_TABLE: readonly { kind: 'bait' | 'dough' | 'seeds' | 'copper' | 'rareSeed' | 'tackle' | 'furn'; w: number }[] = [
  { kind: 'bait', w: 30 },
  { kind: 'dough', w: 20 },
  { kind: 'seeds', w: 20 },
  { kind: 'copper', w: 12 },
  { kind: 'rareSeed', w: 8 },
  { kind: 'tackle', w: 6 },
  { kind: 'furn', w: 4 },
];
/** What a chest holds (deterministic from its key). Never 범. */
export function treasureLoot(key: string, season: Season): TreasureLoot {
  const total = TREASURE_TABLE.reduce((s, t) => s + t.w, 0);
  let roll = hash32(`treasure:${key}`) % total;
  const pick = TREASURE_TABLE.find((t) => (roll -= t.w) < 0)?.kind ?? 'bait';
  const k2 = hash32(`treasure-item:${key}`);
  switch (pick) {
    case 'bait':
      return { kind: 'item', item: 'bait', n: 3 };
    case 'dough':
      return { kind: 'item', item: 'bait-dough', n: 3 };
    case 'copper':
      return { kind: 'item', item: 'copper', n: 3 };
    case 'tackle':
      return { kind: 'item', item: TACKLES[k2 % TACKLES.length], n: 1 };
    case 'furn':
      return { kind: 'furn', item: SEASON_FURN[season], n: 1 };
    case 'rareSeed': {
      const rare = CROPS.filter((c) => CROP_INFO[c].seed >= 1_000);
      return { kind: 'seed', item: rare[k2 % rare.length] ?? 'strawberry', n: 1 };
    }
    default: {
      const list = CROPS.filter((c) => cropInSeason(c, season) && CROP_INFO[c].seed <= 800);
      return { kind: 'seed', item: list[k2 % list.length] ?? 'carrot', n: 2 };
    }
  }
}
/** Treasure chance in percent for a fight. */
export const treasureChance = (level: number, tackle: boolean, coop: number) =>
  TREASURE_BASE + (tackle ? TREASURE_TACKLE : 0) + Math.floor(level / 2) + COOP_TREASURE * Math.min(COOP_MAX, coop);

// ---------------------------------------------------------------- helpers
const userOf = (life: LifeState, uid: string): AnglerUser => (((life.angling ??= {}).u ??= {})[uid] ??= {});
const nameOf = (actor: number) => ACTOR_NAMES[actor] ?? '친구';
const josaGa = (name: string) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 ? '이' : '가');
};
const josaUl = (name: string) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 ? '을' : '를');
};
function pickWeighted<T>(list: readonly T[], weight: (t: T) => number, key: string): T | null {
  const total = list.reduce((s, t) => s + Math.max(0, weight(t)), 0);
  if (total <= 0) return null;
  let roll = ((hash32(key) % 1_000_000) / 1_000_000) * total;
  for (const t of list) {
    roll -= Math.max(0, weight(t));
    if (roll < 0) return t;
  }
  return list[list.length - 1];
}

/** Legends a friend already has (new flow, or a personal best from the legacy flow). */
const legendsOf = (life: LifeState, uid: string) => {
  const mine = life.angling?.u?.[uid]?.legends ?? [],
    best = life.ext?.[uid]?.best ?? {};
  return [...new Set([...mine, ...LEGACY_LEGENDS.filter((id) => best[id])])];
};
const contextOf = (life: LifeState, uid: string, now: number): AnglerContext => ({
  season: seasonOf(now),
  weather: weatherOf(kstDay(now)),
  now,
  level: skillLevel(life, uid, 'fish'),
  rod: toolTier(life, uid, 'rod'),
  caught: legendsOf(life, uid),
});
/** Other friends who cast at the same spot in the last 90 s (함께 낚시). */
export function coopCount(life: LifeState, uid: string, spot: Spot, now: number) {
  let n = 0;
  for (const [id, u] of Object.entries(life.angling?.u ?? {})) {
    if (id === uid) continue;
    const c = u.cast ?? u.fight,
      last = u.last;
    const here =
      (c && c.spot === spot && now - c.castAt <= COOP_WINDOW_MS) ||
      (last && last.ok && last.fish && FISH_BY_ID[last.fish]?.spots.includes(spot) && now - last.at <= COOP_WINDOW_MS && u.spots?.includes(spot));
    if (here) n++;
  }
  return Math.min(COOP_MAX, n);
}
function spotCheck(life: LifeState, uid: string, spot: unknown, now: number, clock = true): Spot {
  if (!isSpot(spot)) fail(ANGLING_REJECT.spot);
  // 승준's explorer pass opens the districts' spots (lounge-districts.ts districtFlagsFor).
  const block = spotBlock(spot as Spot, districtFlagsFor(life.flags, hasExplorerPass(life.actors[uid], now)), toolTier(life, uid, 'rod'), now);
  if (block === 'flag') fail(ANGLING_REJECT.spotLocked);
  if (block === 'rod') fail(ANGLING_REJECT.spotRod);
  if (block === 'night' && clock) fail(ANGLING_REJECT.spotNight);
  return spot as Spot;
}
/** Rolls the cup week over (archives the finished week with its top three). */
function rollCup(life: LifeState, now: number) {
  const week = weekOfDay(kstDay(now)),
    state = (life.angling ??= {});
  const cup = state.cup;
  if (cup && cup.week === week) return cup;
  if (cup && Object.keys(cup.e).length) {
    const result = cupResultOf(cup);
    state.cupHistory = [...(state.cupHistory ?? []).filter((h) => h.week !== cup.week), result].slice(-CUP_HISTORY);
  }
  state.cup = { week, e: {} };
  return state.cup;
}
const cupTotal = (list: readonly CupCatch[]) => list.reduce((s, c) => s + c.score, 0);
function cupResultOf(cup: CupWeek): CupResult {
  const rows = Object.entries(cup.e)
    .map(([a, list]) => ({ actor: Number(a), score: cupTotal(list) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.actor - b.actor);
  return { week: cup.week, players: rows.length, ranks: rows.slice(0, 3), claimed: [] };
}
function noteQuality(life: LifeState, uid: string, id: string, q: Quality) {
  const u = userOf(life, uid),
    fq = (u.fq ??= {});
  // Re-base on what the bag really holds (older paths may have used fish up).
  const [, silver, gold] = fishQualitySplit(life, uid, id);
  const next: FishQ = [silver + (q === 1 ? 1 : 0), gold + (q === 2 ? 1 : 0)];
  if (next[0] || next[1]) fq[id] = [Math.min(COUNT_MAX, next[0]), Math.min(COUNT_MAX, next[1])];
  else delete fq[id];
  if (!Object.keys(fq).length) delete u.fq;
}

// ---------------------------------------------------------------- actions
export function anglingAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: AnglingAction,
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  const uid = member.id,
    actor = member.actor;
  let next = ledger;
  const u = userOf(life, uid);
  switch (a.kind) {
    case 'anglerCast': {
      const spot = spotCheck(life, uid, a.spot, now);
      const bait = a.bait === undefined || a.bait === null ? undefined : a.bait;
      if (bait !== undefined && (!isBait(bait) || invCount(life, uid, bait) < 1)) fail(ANGLING_REJECT.bait);
      const ctx = contextOf(life, uid, now),
        mods = growthMods(life, uid),
        rod = ctx.rod ?? 1,
        luck = luckMods(life, uid, now),
        insp = moodBiteBoost(life, uid, now),
        night = isNighttime(now),
        sea = SEA_SPOTS.includes(spot),
        fresh = FRESH_SPOTS.includes(spot);
      if (bait && !growthChance(life, uid, 'bait', mods.baitKeep, now)) addInv(life, uid, bait, -1);
      const seq = ++life.seq,
        token = (hash32(`angle:${uid}:${seq}:${now}`).toString(36) + seq.toString(36)).slice(0, 24);
      const found = anglerCandidates(spot, ctx),
        list = found.length ? found : FISH.filter((f) => f.spots.includes(spot) && f.weight >= 10);
      const lights = spot === 'sea' && night && hasFlag(life, 'lights');
      const rareBoost =
        luck.rare *
        (bait === 'bait' ? 2 : 1) *
        (bait === 'bait-shrimp' && sea ? 1.5 : 1) *
        (bait === 'bait-glow' && night ? 2 : 1) *
        (rod >= 3 ? 1.5 : 1) *
        (lights ? LIGHTS_RARE_BOOST : 1) *
        insp.rare *
        (sea ? 1 + mods.seaRare : 1);
      const legendBoost = (1 + mods.legend) * (rod >= 5 ? 1.3 : 1) * (bait === 'bait-glow' && night ? 1.5 : 1);
      const previous = u.last?.ok ? u.last.fish : undefined;
      const fish =
        pickWeighted(
          list,
          (f) => {
            const native = fishAvailable(f, ctx) ? 1 : 0.25,
              repeat = previous === f.id ? 0.4 : 1;
            return (f.weight < 10 ? f.weight * rareBoost * (isLegend(f) ? legendBoost : 1) : Math.min(32, f.weight)) * native * repeat;
          },
          `angle-fish:${token}`,
        ) ?? FISH_BY_ID.crucian;
      const coop = coopCount(life, uid, spot, now);
      const [lo, hi] = fish.cm;
      let cm = lo + (hash32(`angle-cm:${token}`) % (hi - lo + 1));
      if (bait === 'bait-shrimp' && sea) cm = Math.round(cm * 1.1);
      cm = Math.min(hi, Math.round(cm * (1 + COOP_SIZE * coop)));
      const wait = (BITE_MIN_MS + (hash32(`angle-bite:${token}`) % BITE_SPREAD_MS)) * (bait === 'bait-dough' && fresh ? 0.5 : 1),
        biteAt = now + Math.round(wait),
        rodWindow = rod >= 4 ? 1.75 : ROD_WINDOW[Math.max(1, Math.min(3, rod)) as 1 | 2 | 3],
        windowMs = Math.round(fish.windowMs * rodWindow * luck.window * (1 + mods.biteWindow) * insp.window);
      delete u.fight;
      u.cast = { token, spot, castAt: now, biteAt, windowMs, expiresAt: biteAt + windowMs + hookSlackMs(fish), fish: fish.id, cm, ...(bait ? { bait } : {}), coop };
      break;
    }
    case 'anglerHook': {
      const c = u.cast;
      if (!c || typeof a.token !== 'string' || a.token !== c.token || now > c.expiresAt + 60_000) fail(ANGLING_REJECT.token);
      delete u.cast;
      const reactionMs = Math.max(0, Math.round(now - c!.biteAt));
      if (now < c!.biteAt - REEL_EARLY_MS) {
        u.last = { ok: false, at: now, reason: 'early' };
        gainXp(life, uid, 'fish', XP.fishMiss, now);
        break;
      }
      if (now > c!.expiresAt) {
        u.last = { ok: false, at: now, reason: 'late', reactionMs, grade: reactionGrade(reactionMs) };
        gainXp(life, uid, 'fish', XP.fishMiss, now);
        break;
      }
      const f = FISH_BY_ID[c!.fish],
        p = profileOf(f),
        level = skillLevel(life, uid, 'fish'),
        rod = toolTier(life, uid, 'rod'),
        tackle = (u.tackle ?? []).map((t) => t.id);
      const seed = hash32(`fight:${c!.token}:${uid}:${now}`) >>> 0,
        loss = Math.max(
          1,
          Math.round((baseLoss(p.difficulty) * (tackle.includes('tackle-trap') ? 2 : 3)) / 3 * (100 - COOP_LOSS * c!.coop) / 100),
        ),
        chance = treasureChance(level, tackle.includes('tackle-treasure'), c!.coop),
        treasure =
          hash32(`fight-treasure:${c!.token}`) % 100 < chance
            ? { at: 40 + (hash32(`fight-at:${c!.token}`) % 160), pos: 1_000 + (hash32(`fight-pos:${c!.token}`) % 8_001) }
            : null;
      const setup: FightSetup = {
        seed,
        behaviour: p.behaviour,
        difficulty: p.difficulty,
        bar: barHeight(rod, level, tackle.includes('tackle-float')),
        gain: GAIN,
        loss,
        treasure,
      };
      // Tackle wears one use per hooked fish.
      if (u.tackle) {
        u.tackle = u.tackle.map((t) => ({ ...t, uses: t.uses - 1 })).filter((t) => t.uses > 0);
        if (!u.tackle.length) delete u.tackle;
      }
      u.fight = { token: c!.token, spot: c!.spot, castAt: c!.castAt, hookAt: now, fish: c!.fish, cm: c!.cm, setup, coop: c!.coop, reactionMs };
      break;
    }
    case 'anglerLand': {
      const fight = u.fight;
      if (!fight || typeof a.token !== 'string' || a.token !== fight.token) fail(ANGLING_REJECT.token);
      delete u.fight;
      const f = FISH_BY_ID[fight!.fish];
      const grade = { reactionMs: fight!.reactionMs, grade: reactionGrade(fight!.reactionMs) };
      if (now - fight!.hookAt > FIGHT_STALE_MS) {
        u.last = { ok: false, at: now, reason: 'escaped', ...grade };
        gainXp(life, uid, 'fish', XP.fishMiss, now);
        break;
      }
      const check = replayTrace(fight!.setup, a.runs);
      const elapsedOk = check.ok && check.result.ticks * TICK_MS <= now - fight!.hookAt + FIGHT_SLACK_MS;
      if (!check.ok || !elapsedOk) {
        u.last = { ok: false, at: now, reason: 'refused', ...grade };
        gainXp(life, uid, 'fish', XP.fishMiss, now);
        break;
      }
      const result: FightResult = check.result;
      const seconds = Math.round((result.ticks * TICK_MS) / 1000);
      if (!result.caught) {
        u.last = { ok: false, at: now, reason: 'escaped', seconds, ...grade, ...(fight!.setup.treasure ? { treasureLost: true } : {}) };
        gainXp(life, uid, 'fish', XP.fishMiss, now);
        break;
      }
      const cm = fight!.cm,
        grams = fishGrams(f.id, cm),
        quality = catchQuality(f, cm, result.perfect),
        legend = isLegend(f);
      addInv(life, uid, f.id, 1);
      noteQuality(life, uid, f.id, quality);
      bump(life, uid, 'fish', 1);
      gainXp(life, uid, 'fish', Math.round(fishXp(f.weight) * (result.perfect ? 1.5 : 1)), now);
      discover(life, uid, f.id);
      // Village record (cm, shared with the legacy flow) and personal best.
      const records = (life.records ??= {}),
        record = !records[f.id] || cm > records[f.id].cm;
      const x = ((life.ext ??= {})[uid] ??= {}),
        best = (x.best ??= {}),
        personal = !best[f.id] || cm > best[f.id];
      if (personal) best[f.id] = cm;
      if (record) {
        records[f.id] = { actor, cm, at: now };
        bump(life, uid, 'record', 1);
        addNews(life, now, `rec:${f.id}`, 'record', `${josaGa(nameOf(actor))} ${f.name} ${cm}cm로 마을 기록을 세웠어요`, [actor]);
      }
      const log = (u.log ??= {}),
        prev = log[f.id];
      log[f.id] = {
        n: Math.min(COUNT_MAX, (prev?.n ?? 0) + 1),
        cm: Math.max(prev?.cm ?? 0, cm),
        g: Math.max(prev?.g ?? 0, grams),
        q: Math.max(prev?.q ?? 0, quality) as Quality,
        first: prev?.first ?? now,
      };
      if (!(u.spots ??= []).includes(fight!.spot)) u.spots.push(fight!.spot);
      if (legend) {
        if (!(u.legends ??= []).includes(f.id)) u.legends.push(f.id);
        const text = `${josaGa(nameOf(actor))} 전설의 ${josaUl(f.name)} 낚았어요!`;
        addMemory(life, now, 'legend', [actor], text);
        addNews(life, now, `legend:${f.id}:${actor}`, 'legend', text, [actor]);
      }
      // Treasure chest (never 범).
      let loot: TreasureLoot | undefined;
      if (result.treasure) {
        loot = treasureLoot(`${fight!.token}:${uid}`, seasonOf(now));
        if (loot.kind === 'seed') life.bag[uid].seeds[loot.item as Crop] = addCount(life.bag[uid].seeds[loot.item as Crop] ?? 0, loot.n);
        else if (loot.kind === 'furn') {
          const furn = (x.furn ??= {});
          furn[loot.item] = Math.min(COUNT_MAX, (furn[loot.item] ?? 0) + 1);
          bump(life, uid, 'furniture', 1);
        } else addInv(life, uid, loot.item, loot.n);
      }
      const parcel = fishingParcel(fight!.token, seasonOf(fight!.castAt));
      if (parcel?.kind === 'seed') life.bag[uid].seeds[parcel.item] = addCount(life.bag[uid].seeds[parcel.item], 1);
      else if (parcel?.kind === 'food') {
        addInv(life, uid, parcel.item, 1);
        discover(life, uid, parcel.item);
      }
      // Weekly cup: best three catches per friend.
      const cup = rollCup(life, now),
        score = cupScore(f, cm, result.perfect),
        mine = [...(cup.e[String(actor)] ?? []), { fish: f.id, cm, score }].sort((p, q) => q.score - p.score).slice(0, 3);
      cup.e[String(actor)] = mine;
      life.angling!.total = Math.min(Number.MAX_SAFE_INTEGER, (life.angling!.total ?? 0) + 1);
      // The legacy last catch too (mood notes, older views).
      x.last = { ok: true, fish: f.id, cm, at: now, ...(record ? { record: true } : {}), ...(personal ? { best: true } : {}) };
      u.last = {
        ok: true,
        at: now,
        fish: f.id,
        cm,
        grams,
        quality,
        seconds,
        cupScore: score,
        ...grade,
        ...(result.perfect ? { perfect: true } : {}),
        ...(loot ? { treasure: loot } : fight!.setup.treasure ? { treasureLost: true } : {}),
        ...(record ? { record: true } : {}),
        ...(personal ? { best: true } : {}),
        ...(legend ? { legend: true } : {}),
        ...(fight!.coop ? { coop: fight!.coop } : {}),
        ...(parcel ? { parcel } : {}),
      };
      break;
    }
    case 'anglerCancel': {
      if (typeof a.token !== 'string' || !TOKEN.test(a.token)) fail(ANGLING_REJECT.token);
      if (u.cast?.token === a.token) delete u.cast;
      if (u.fight?.token === a.token) {
        delete u.fight;
        u.last = { ok: false, at: now, reason: 'escaped' };
      }
      break;
    }
    case 'anglerTackle': {
      const rod = toolTier(life, uid, 'rod'),
        slots = tackleSlots(rod),
        slot = a.slot;
      if (!safe(slot) || slot < 0 || slot >= slots) fail(ANGLING_REJECT.tackleSlot);
      const list = [...(u.tackle ?? [])];
      const old = list[slot];
      if (a.item !== null && (!isTackle(a.item) || invCount(life, uid, a.item) < 1)) fail(ANGLING_REJECT.tackle);
      // An unused tackle goes back to the bag; a worn one is spent.
      if (old && old.uses >= TACKLE_USES) addInv(life, uid, old.id, 1);
      if (a.item === null) list.splice(slot, 1);
      else {
        addInv(life, uid, a.item, -1);
        list[slot] = { id: a.item, uses: TACKLE_USES };
      }
      const clean = list.filter(Boolean).slice(0, slots);
      if (clean.length) u.tackle = clean;
      else delete u.tackle;
      break;
    }
    case 'crabSet': {
      const spot = spotCheck(life, uid, a.spot, now, false);
      const pots = (u.pots ??= []),
        pot = pots.find((p) => p.spot === spot);
      if (pot?.bait) fail(now >= pot.at + CRAB_READY_MS ? ANGLING_REJECT.potFull : ANGLING_REJECT.potBaited);
      if (!pot) {
        if (invCount(life, uid, CRAB_POT) < 1) fail(ANGLING_REJECT.potNone);
        if (pots.length >= potMax(skillLevel(life, uid, 'fish'))) fail(ANGLING_REJECT.potMax);
      }
      const bait = ([...BAITS].sort((p, q) => BAIT_ORDER[p] - BAIT_ORDER[q]) as BaitId[]).find((b) => invCount(life, uid, b) > 0);
      if (!bait) fail(ANGLING_REJECT.potBait);
      addInv(life, uid, bait!, -1);
      if (pot) {
        pot.at = now;
        pot.bait = true;
      } else {
        addInv(life, uid, CRAB_POT, -1);
        pots.push({ spot, at: now, bait: true });
      }
      break;
    }
    case 'crabCollect': {
      if (!isSpot(a.spot)) fail(ANGLING_REJECT.spot);
      const pot = u.pots?.find((p) => p.spot === a.spot);
      if (!pot) fail(ANGLING_REJECT.potHere);
      if (!pot!.bait || now < pot!.at + CRAB_READY_MS) fail(ANGLING_REJECT.potWait);
      const item = crabCatch(uid, pot!);
      addInv(life, uid, item, 1);
      discover(life, uid, item);
      const log = (u.log ??= {}),
        prev = log[item],
        cm = crabSize(uid, pot!, item);
      log[item] = { n: Math.min(COUNT_MAX, (prev?.n ?? 0) + 1), cm: Math.max(prev?.cm ?? 0, cm), g: Math.max(prev?.g ?? 0, fishGrams(item, cm)), q: prev?.q ?? 0, first: prev?.first ?? now };
      gainXp(life, uid, 'fish', 2, now);
      pot!.bait = false;
      pot!.at = now;
      break;
    }
    case 'crabTake': {
      if (!isSpot(a.spot)) fail(ANGLING_REJECT.spot);
      const i = u.pots?.findIndex((p) => p.spot === a.spot) ?? -1;
      if (i < 0) fail(ANGLING_REJECT.potHere);
      const pot = u.pots![i];
      if (pot.bait && now >= pot.at + CRAB_READY_MS) fail(ANGLING_REJECT.potFull);
      u.pots!.splice(i, 1);
      if (!u.pots!.length) delete u.pots;
      addInv(life, uid, CRAB_POT, 1);
      break;
    }
    case 'cupClaim': {
      rollCup(life, now);
      const hist = life.angling?.cupHistory?.find((h) => h.week === a.week);
      const rank = hist ? hist.ranks.findIndex((r) => r.actor === actor) : -1;
      if (!hist || rank < 0 || hist.players < CUP_MIN_PLAYERS) fail(ANGLING_REJECT.cup);
      if (hist!.claimed.includes(actor)) fail(ANGLING_REJECT.cupClaimed);
      hist!.claimed.push(actor);
      if (own(next.accounts, 'wallet-' + uid))
        next = grantBeom(next, 'wallet-' + uid, CUP_PRIZES[rank], `life-fish-cup-${uid}-${++life.seq}`, now, 'fish-cup');
      addNews(life, now, `cup:${hist!.week}:${actor}`, 'record', `${josaGa(nameOf(actor))} 주간 낚시 대회 ${rank + 1}위 상품을 받았어요`, [actor]);
      break;
    }
    default:
      fail('요청을 처리할 수 없어요.');
  }
  if (!Object.keys(u).length) delete life.angling?.u?.[uid];
  return { life, ledger: next };
}
const BAIT_ORDER: Record<BaitId, number> = { 'bait-dough': 0, bait: 1, 'bait-shrimp': 2, 'bait-glow': 3 };
const potPool = (spot: Spot): readonly string[] => (SEA_SPOTS.includes(spot) ? POT_SEA : POT_FRESH);
/** What a ready pot holds (deterministic per pot and baiting). */
export function crabCatch(uid: string, pot: CrabPot): string {
  const pool = potPool(pot.spot);
  return pickWeighted(pool, (id) => FISH_BY_ID[id]?.weight ?? 10, `pot:${uid}:${pot.spot}:${pot.at}`) ?? pool[0];
}
const crabSize = (uid: string, pot: CrabPot, item: string) => {
  const [lo, hi] = FISH_BY_ID[item]?.cm ?? [1, 1];
  return lo + (hash32(`pot-cm:${uid}:${pot.spot}:${pot.at}`) % (hi - lo + 1));
};

// ---------------------------------------------------------------- views
/**
 * How much longer the client waits before showing the bite, when the cast
 * request left `sinceSendMs` ago. The server stamped `castAt` after that send,
 * so counting `biteAt − castAt` from the send shows the bite at most one
 * uplink early, which the hook's own uplink (and REEL_EARLY_MS) makes up for.
 * Never count from when the reply ran, or from a clock offset stamped then: on
 * a page busy with software WebGL a reply can wait seconds for the main
 * thread, and that wait pushed the bite on screen so late that the hook
 * reached the server after `expiresAt`.
 */
export function biteDelayMs(cast: Pick<AnglerCastView, 'castAt' | 'biteAt'>, sinceSendMs: number): number {
  return Math.max(0, cast.biteAt - cast.castAt - Math.max(0, sinceSendMs));
}
export type AnglerCastView = Omit<AnglerCast, 'fish' | 'cm'>;
export type AnglerFightView = Omit<AnglerFight, 'fish' | 'cm'> & { behaviourName: string };
export type AnglingView = {
  me: {
    cast: AnglerCastView | null;
    fight: AnglerFightView | null;
    last: AnglerLast | null;
    log: Record<string, SpeciesLog>;
    fq: Record<string, FishQ>;
    tackle: TackleSlot[];
    tackleSlots: number;
    rod: number;
    level: number;
    bar: number;
    pots: (CrabPot & { readyAt: number; ready: boolean })[];
    potMax: number;
    legends: string[];
    spots: Spot[];
    treasurePct: number;
  };
  /** Friends fishing at each spot right now (co-op markers). */
  anglers: Partial<Record<Spot, number[]>>;
  cup: {
    week: number;
    resetAt: number;
    standings: { actor: number; score: number; top: CupCatch[] }[];
    history: CupResult[];
    prizes: readonly number[];
    minPlayers: number;
  };
  total: number;
};
export function anglingView(life: LifeState, uid: string, _actor: number, now: number): AnglingView {
  const st = life.angling ?? {},
    u = st.u?.[uid] ?? {},
    level = skillLevel(life, uid, 'fish'),
    rod = toolTier(life, uid, 'rod'),
    tackle = u.tackle ?? [];
  const cast = u.cast && now <= u.cast.expiresAt ? u.cast : null;
  const fight = u.fight && now - u.fight.hookAt <= FIGHT_STALE_MS ? u.fight : null;
  const anglers: Partial<Record<Spot, number[]>> = {};
  for (const [id, x] of Object.entries(st.u ?? {})) {
    const c = x.fight ?? x.cast,
      a = life.actors[id];
    if (!c || a === undefined || now - c.castAt > COOP_WINDOW_MS) continue;
    (anglers[c.spot] ??= []).push(a);
  }
  const week = weekOfDay(kstDay(now)),
    cup = st.cup?.week === week ? st.cup : null;
  // A finished week that nobody has rolled over yet still shows in history.
  const pending = st.cup && st.cup.week !== week && Object.keys(st.cup.e).length ? [cupResultOf(st.cup)] : [];
  const history = [...(st.cupHistory ?? []).filter((h) => !pending.some((p) => p.week === h.week)), ...pending].slice(-CUP_HISTORY);
  return {
    me: {
      cast: cast ? { token: cast.token, spot: cast.spot, castAt: cast.castAt, biteAt: cast.biteAt, windowMs: cast.windowMs, expiresAt: cast.expiresAt, coop: cast.coop, ...(cast.bait ? { bait: cast.bait } : {}) } : null,
      fight: fight
        ? {
            token: fight.token,
            spot: fight.spot,
            castAt: fight.castAt,
            hookAt: fight.hookAt,
            setup: structuredClone(fight.setup),
            coop: fight.coop,
            reactionMs: fight.reactionMs,
            behaviourName: BEHAVIOUR_NAME[fight.setup.behaviour],
          }
        : null,
      last: u.last ? structuredClone(u.last) : null,
      log: structuredClone(u.log ?? {}),
      fq: structuredClone(u.fq ?? {}),
      tackle: tackle.map((t) => ({ ...t })),
      tackleSlots: tackleSlots(rod),
      rod,
      level,
      bar: barHeight(rod, level, tackle.some((t) => t.id === 'tackle-float')),
      pots: (u.pots ?? []).map((p) => ({ ...p, readyAt: p.at + CRAB_READY_MS, ready: p.bait && now >= p.at + CRAB_READY_MS })),
      potMax: potMax(level),
      legends: legendsOf(life, uid),
      spots: [...(u.spots ?? [])],
      treasurePct: treasureChance(level, tackle.some((t) => t.id === 'tackle-treasure'), 0),
    },
    anglers,
    cup: {
      week,
      resetAt: weekResetAt(week),
      standings: Object.entries(cup?.e ?? {})
        .map(([a, top]) => ({ actor: Number(a), score: cupTotal(top), top: top.map((c) => ({ ...c })) }))
        .sort((p, q) => q.score - p.score || p.actor - q.actor),
      history: history.map((h) => structuredClone(h)),
      prizes: CUP_PRIZES,
      minPlayers: CUP_MIN_PLAYERS,
    },
    total: st.total ?? 0,
  };
}

// ---------------------------------------------------------------- hooks for later features
/**
 * For the future harbor district and its fishmonger NPC (design-npcs-stage2):
 * the weekly cup standings and results, the village fish total (the district
 * opens on a shared fishing goal) and a dawn-auction price bonus slot.
 */
export const anglingHooks = {
  tournamentStandings(life: LifeState, week: number) {
    const cup = life.angling?.cup;
    return cup?.week === week ? Object.entries(cup.e).map(([a, list]) => ({ actor: Number(a), score: cupTotal(list) })).sort((p, q) => q.score - p.score) : [];
  },
  tournamentResult(life: LifeState, week: number): CupResult | null {
    const cup = life.angling?.cup;
    if (cup?.week === week) return cupResultOf(cup);
    return life.angling?.cupHistory?.find((h) => h.week === week) ?? null;
  },
  villageFishTotal: (life: LifeState) => life.angling?.total ?? 0,
  /** Share added to fish prices during a dawn auction (none until the NPC exists). */
  dawnAuctionBonus: (_now: number) => 0,
};

/** True while this friend has a live cast or fight (movement and menus wait). */
export function anglingBusy(life: LifeState, uid: string, now: number) {
  const u = life.angling?.u?.[uid];
  return !!((u?.cast && now <= u.cast.expiresAt) || (u?.fight && now - u.fight.hookAt <= FIGHT_STALE_MS));
}
/** Item names used by the engine's texts (kept local to avoid a view import). */
export const fishName = (id: string) => FISH_BY_ID[id]?.name ?? ITEM_BY_ID[id]?.name ?? id;
