// 텃밭 확장 engine: the yard's tile grid (fixtures: sprinklers, scarecrows,
// bee houses), the work yard (jar, keg, dehydrator, seed maker), artisan
// goods, crows and withering, giant crops, the shipping bin, helping a friend
// harvest and the weekly 품평회. Pure and `now`-injected like lounge-life.ts,
// whose lifeAction / lifeView / readLife call into this module.
//
// Cycle-safe: lounge-life.ts and lounge-life-plus.ts import this module and
// this module imports them back, so it never uses their bindings at the top
// level (only inside functions). Static numbers: lounge-farm-data.ts (a leaf).
// Design: handover/design/design-farming-upgrade.md.
import { grantBeom, spendBeom, kstDay, nextKstMidnight, type LoungeLedger } from './lounge-economy.ts';
import { ACTOR_NAMES, dayStart, hash32, seasonOfDay } from './lounge-calendar.ts';
import {
  BEE_MS,
  BIN_MAX,
  CROP_CAT,
  CROW_CHANCE,
  CROW_HOUR,
  CROW_MIN_CROPS,
  FAIR_FEE,
  FAIR_HISTORY,
  FAIR_JUDGE,
  FAIR_PRIZE_SHARES,
  FIXTURE_BY_ID,
  GIANT_CHANCE,
  GIANT_CROPS,
  GIANT_YIELD,
  GRID_COLS,
  GRID_ROWS,
  MACHINE_BY_ID,
  STAR_FERT_RECIPE,
  TRELLIS_SHADE,
  WORK_SLOTS,
  buildGoods,
  isGoodId,
  productOf,
  sprinklerCovers,
  tileBed,
  tileDist,
  tileFront,
  type FarmActionKind,
  type FixtureKind,
  type GoodDef,
  type MachineKind,
  type Recipe,
} from './lounge-farm-data.ts';
import {
  CROPS,
  CROP_INFO,
  FRUIT_SELL,
  LIFE_REJECT,
  LifeError,
  QUALITY_MULT,
  SELL_CAP_PER_DAY,
  addCount,
  countHarvest,
  isQuality,
  plotGrowMs,
  plotQuality,
  plotRainAt,
  plotReadyAt,
  uidOf,
  type Crop,
  type LifeState,
  type Plot,
  type Quality,
} from './lounge-life.ts';
import {
  BOND_POINTS,
  addBond,
  addCropQ,
  addInv,
  addMemory,
  addNews,
  bondGate,
  bump,
  cropQCount,
  demandSold,
  discover,
  hasFlag,
  invCount,
  noteDemand,
  sellBonus,
  demandSoft,
  sellTotal,
  shopSaleAmount,
  sellUnit,
  soldBeomToday,
  weekOfDay,
  weekResetAt,
} from './lounge-life-plus.ts';
import { gainXp, growthChance, growthMods, skillLevel } from './lounge-growth.ts';
// 가게 나누기: the shipping bin pays SELL_AWAY (85%); goods pay 100% at the 농협.
import { SELL_AWAY, type ShopId } from './lounge-shops.ts';
import { SKILL_INFO, XP } from './lounge-growth-data.ts';

const HOUR = 3_600_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const time = (n: unknown) => (safe(n) && n >= 0 ? n : 0);
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const nonEmpty = (o: object) => Object.keys(o).length > 0;
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const actorValid = (a: unknown): a is number => safe(a) && a >= 0 && a < 7;
const isCropId = (c: unknown): c is Crop => typeof c === 'string' && (CROPS as string[]).includes(c);
const COUNT_MAX = 99_999;
/** Kept "밭 소식" lines per farm. */
export const FARM_LOG_MAX = 8;
/** Kinds of artisan goods one friend may hold at once. */
const GOODS_KINDS_MAX = 64;

// ---------------------------------------------------------------- types
/** A fixture on a tile: kind, when it was placed, and (bee house) the last honey. */
export type Fixture = { k: FixtureKind; at: number; h?: number };
/** A machine in a work-yard slot; `out` while it works (a good id or 'seed-<crop>'). */
export type MachineSlot = { k: MachineKind; out?: string; q?: Quality; n?: number; at?: number; done?: number };
export type FarmLogKind = 'crow' | 'guard' | 'wither' | 'giant' | 'ship' | 'help' | 'fair';
export type FarmLog = { kind: FarmLogKind; at: number; crop?: string; tile?: number; n?: number; beom?: number; actor?: number };
export type FarmX = {
  /** Tile → fixture. */
  fx?: Record<string, Fixture>;
  /** Work-yard slot → machine. */
  mach?: Record<string, MachineSlot>;
  /** Artisan goods: 'id' or 'id@q' → count. */
  goods?: Record<string, number>;
  /** Shipping bin: filled on KST `day`, sold on the first action after that day. */
  bin?: { day: number; items: Record<string, number> };
  /** Last KST day whose 05:00 crow roll was settled. */
  st?: number;
  /** Friends helped (harvest) today. */
  hf?: { day: number; actors: number[] };
  log?: FarmLog[];
};
export type FairEntry = { actor: number; uid: string; item: string; q: Quality; score: number; at: number };
export type FairRank = { actor: number; item: string; q: Quality; score: number; prize: number };
export type FairResult = { week: number; pot: number; judgedAt: number; entrants: number; ranks: FairRank[] };
export type FairState = { week: number; entries: FairEntry[]; results?: FairResult[] };
/** Optional 텃밭 확장 fields of `world.life` (absent in older worlds). */
export type FarmExt = { farmx?: Record<string, FarmX>; fair?: FairState };
export type FarmAction =
  | { kind: 'farmBuild'; item: string }
  | { kind: 'farmPlace'; item: string; tile?: number; slot?: number }
  | { kind: 'farmPickup'; tile?: number; slot?: number }
  | { kind: 'farmMove'; from: number; to: number; area?: 'tile' | 'slot' }
  | { kind: 'farmLoad'; slot: number; item: string; q?: Quality }
  | { kind: 'farmCollect'; slot?: number; tile?: number }
  | { kind: 'ship'; item: string; q?: Quality; n: number }
  | { kind: 'unship'; item: string; q?: Quality; n: number }
  /** `at`: 'coop' pays 100%; from the bag (no `at`) 85%. */
  | { kind: 'sellGoods'; item: string; q?: Quality; n: number; at?: ShopId }
  | { kind: 'harvestFriend'; owner: number | string }
  | { kind: 'fairEnter'; item: string; q?: Quality };
// Compile-time check that the action kinds and the data list agree.
type _Kinds = FarmAction['kind'] extends FarmActionKind ? (FarmActionKind extends FarmAction['kind'] ? true : never) : never;
export const FARM_KINDS_OK: _Kinds = true;

export const FARM_REJECT = {
  tile: '밭 칸을 확인해 주세요.',
  tileLocked: '아직 갈지 않은 칸이에요. 밭을 넓히면 쓸 수 있어요.',
  tileBusy: '작물이나 설비가 있는 칸이에요.',
  fixture: '설비가 놓인 칸이에요.',
  noFixture: '그 칸에는 설비가 없어요.',
  slot: '작업 마당 자리를 확인해 주세요.',
  slotBusy: '그 자리에는 이미 기계가 있어요.',
  noMachine: '그 자리에는 기계가 없어요.',
  machineBusy: '기계가 일하는 중이에요. 다 되면 거둬 주세요.',
  machineFull: '안에 든 것을 먼저 거둬 주세요.',
  machineInput: '이 기계에 넣을 수 없는 것이에요.',
  build: '만들 수 없는 물건이에요.',
  place: '놓을 수 없는 물건이에요.',
  nothing: '거둘 것이 아직 없어요.',
  stock: '가방이나 저장고에 그만큼 없어요.',
  item: '물건을 확인해 주세요.',
  binFull: `출하 상자에는 ${BIN_MAX}개까지 넣을 수 있어요.`,
  binEmpty: '출하 상자에 그만큼 없어요.',
  helped: '오늘은 이미 이 친구 밭을 거들었어요. 내일 또 도와줘요.',
  friendFarm: '친구의 밭을 찾을 수 없어요.',
  fairDone: '이번 주 품평회에는 이미 출품했어요.',
  fairFull: '이번 주 품평회는 자리가 다 찼어요.',
  goodsFull: '저장고가 가득 찼어요. 가공품을 조금 팔아 주세요.',
} as const;
function fail(message: string): never {
  throw new LifeError(message);
}

// ---------------------------------------------------------------- catalog
let goodsMemo: Readonly<Record<string, GoodDef>> | null = null;
/** Every artisan good by id (built once from the crop catalog). */
export function goodsById(): Readonly<Record<string, GoodDef>> {
  goodsMemo ??= Object.fromEntries(
    buildGoods(
      (id) => (id === 'fruit' ? '과일' : CROP_INFO[id as Crop].name),
      (id) => (id === 'fruit' ? FRUIT_SELL : CROP_INFO[id as Crop].sell),
    ).map((g) => [g.id, g]),
  );
  return goodsMemo;
}
/** Display name of a crop, fruit or artisan good. */
export function stockName(id: string) {
  if (id === 'fruit') return '과일';
  if (isCropId(id)) return CROP_INFO[id].name;
  return goodsById()[id]?.name ?? id;
}
/** Bin / goods / fair key of an item at a quality ('carrot', 'jar-grape@2'). */
export const stockKey = (id: string, q: Quality = 0) => (q ? `${id}@${q}` : id);
/** Parses a stock key; null when the id/quality pair is not valid. */
export function parseStock(key: unknown): { id: string; q: Quality } | null {
  if (typeof key !== 'string') return null;
  const m = /^([a-z0-9-]{1,40})(?:@([1-3]))?$/.exec(key);
  if (!m) return null;
  const id = m[1],
    q = (m[2] ? Number(m[2]) : 0) as Quality;
  return stockOk(id, q) ? { id, q } : null;
}
/** Whether an item at a quality can be stored, shipped or entered. */
export function stockOk(id: unknown, q: unknown): boolean {
  if (!isQuality(q)) return false;
  if (isCropId(id)) return true;
  if (id === 'fruit') return q === 0;
  if (!isGoodId(id)) return false;
  return !String(id).startsWith('honey') || q === 0;
}
/** Full price of one unit (crops: in-season premium; goods: base × quality). */
export function stockUnit(id: string, q: Quality, now: number, flags: readonly string[] = []) {
  if (isGoodId(id)) return Math.round((goodsById()[id]?.base ?? 0) * QUALITY_MULT[q]);
  return sellUnit(id, q, now, flags);
}

// ---------------------------------------------------------------- reading
function readFixture(v: unknown): Fixture | undefined {
  const x = obj(v);
  if (typeof x.k !== 'string' || !own(FIXTURE_BY_ID, x.k)) return;
  const out: Fixture = { k: x.k as FixtureKind, at: time(x.at) };
  if (x.k === 'beehouse' && safe(x.h) && x.h > 0) out.h = x.h;
  return out;
}
function readMachine(v: unknown): MachineSlot | undefined {
  const x = obj(v);
  if (typeof x.k !== 'string' || !own(MACHINE_BY_ID, x.k)) return;
  const out: MachineSlot = { k: x.k as MachineKind };
  const seed = typeof x.out === 'string' && x.out.startsWith('seed-') && isCropId(x.out.slice(5));
  if (typeof x.out === 'string' && (seed || isGoodId(x.out)) && safe(x.done) && x.done > 0) {
    out.out = x.out;
    if (!seed && isQuality(x.q) && x.q > 0) out.q = x.q;
    out.n = safe(x.n) && x.n >= 1 && x.n <= 9 ? x.n : 1;
    out.at = time(x.at);
    out.done = x.done;
  }
  return out;
}
function readCounts(v: unknown, ok: (key: string) => boolean, max: number, cap = COUNT_MAX) {
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(obj(v)).slice(0, max * 2)) {
    if (Object.keys(out).length >= max) break;
    if (ok(k) && safe(n) && n > 0) out[k] = Math.min(cap, n);
  }
  return out;
}
function readLog(v: unknown): FarmLog | null {
  const x = obj(v);
  const kinds: readonly FarmLogKind[] = ['crow', 'guard', 'wither', 'giant', 'ship', 'help', 'fair'];
  if (!kinds.includes(x.kind as FarmLogKind)) return null;
  const out: FarmLog = { kind: x.kind as FarmLogKind, at: time(x.at) };
  if (isCropId(x.crop) || x.crop === 'fruit' || isGoodId(x.crop)) out.crop = x.crop as string;
  if (safe(x.tile) && x.tile >= 0 && x.tile < GRID_COLS * GRID_ROWS) out.tile = x.tile;
  if (safe(x.n) && x.n > 0) out.n = Math.min(COUNT_MAX, x.n);
  if (safe(x.beom) && x.beom > 0) out.beom = x.beom;
  if (actorValid(x.actor)) out.actor = x.actor;
  return out;
}
function readFarmX(v: unknown): FarmX | undefined {
  const x = obj(v),
    out: FarmX = {};
  const fx: Record<string, Fixture> = {};
  for (const [k, f] of Object.entries(obj(x.fx)).slice(0, 24)) {
    const tile = Number(k);
    const r = /^\d{1,2}$/.test(k) && tile < GRID_COLS * GRID_ROWS ? readFixture(f) : undefined;
    if (r) fx[k] = r;
  }
  if (nonEmpty(fx)) out.fx = fx;
  const mach: Record<string, MachineSlot> = {};
  for (const [k, m] of Object.entries(obj(x.mach)).slice(0, 8)) {
    const r = /^\d$/.test(k) && Number(k) < WORK_SLOTS ? readMachine(m) : undefined;
    if (r) mach[k] = r;
  }
  if (nonEmpty(mach)) out.mach = mach;
  const goods = readCounts(x.goods, (k) => !!parseStock(k) && isGoodId(parseStock(k)!.id), GOODS_KINDS_MAX);
  if (nonEmpty(goods)) out.goods = goods;
  const bin = obj(x.bin);
  if (safe(bin.day) && bin.day > 0) {
    const items = readCounts(bin.items, (k) => !!parseStock(k), 128, BIN_MAX);
    if (nonEmpty(items)) out.bin = { day: bin.day, items };
  }
  if (safe(x.st) && x.st > 0) out.st = x.st;
  const hf = obj(x.hf);
  if (safe(hf.day) && hf.day > 0 && Array.isArray(hf.actors)) {
    const actors = [...new Set(hf.actors.filter(actorValid))].slice(0, 7);
    if (actors.length) out.hf = { day: hf.day, actors };
  }
  const log = Array.isArray(x.log)
    ? x.log.slice(-FARM_LOG_MAX).map(readLog).filter((l): l is FarmLog => !!l)
    : [];
  if (log.length) out.log = log;
  return nonEmpty(out) ? out : undefined;
}
function readFair(v: unknown): FairState | undefined {
  const x = obj(v);
  if (!safe(x.week) || x.week <= 0) return;
  const entries: FairEntry[] = [];
  for (const e of Array.isArray(x.entries) ? x.entries.slice(0, 16) : []) {
    const y = obj(e);
    if (!actorValid(y.actor) || typeof y.uid !== 'string' || !UUID.test(y.uid)) continue;
    if (typeof y.item !== 'string' || !stockOk(y.item, y.q) || !safe(y.score) || y.score < 0) continue;
    if (entries.some((o) => o.uid === y.uid)) continue;
    entries.push({ actor: y.actor, uid: y.uid, item: y.item, q: y.q as Quality, score: y.score, at: time(y.at) });
  }
  const results: FairResult[] = [];
  for (const r of Array.isArray(x.results) ? x.results.slice(-FAIR_HISTORY) : []) {
    const y = obj(r);
    if (!safe(y.week) || !safe(y.pot) || y.pot < 0) continue;
    const ranks: FairRank[] = [];
    for (const k of Array.isArray(y.ranks) ? y.ranks.slice(0, 3) : []) {
      const z = obj(k);
      if (!actorValid(z.actor) || typeof z.item !== 'string' || !stockOk(z.item, z.q)) continue;
      ranks.push({
        actor: z.actor,
        item: z.item,
        q: z.q as Quality,
        score: safe(z.score) && z.score > 0 ? z.score : 0,
        prize: safe(z.prize) && z.prize > 0 ? z.prize : 0,
      });
    }
    results.push({
      week: y.week,
      pot: y.pot,
      judgedAt: time(y.judgedAt),
      entrants: safe(y.entrants) && y.entrants >= 0 ? Math.min(16, y.entrants) : ranks.length,
      ranks,
    });
  }
  return { week: x.week, entries, ...(results.length ? { results } : {}) };
}
/** Normalizes the 텃밭 확장 fields of `world.life` (bounded, like the rest). */
export function readFarmExt(v: Record<string, unknown>): FarmExt {
  const out: FarmExt = {};
  const farmx: Record<string, FarmX> = {};
  for (const [uid, x] of Object.entries(obj(v.farmx)).slice(0, 32)) {
    if (!UUID.test(uid) || Object.keys(farmx).length >= 16) continue;
    const f = readFarmX(x);
    if (f) farmx[uid] = f;
  }
  if (nonEmpty(farmx)) out.farmx = farmx;
  const fair = readFair(v.fair);
  if (fair) out.fair = fair;
  return out;
}

// ---------------------------------------------------------------- small helpers
const farmxOf = (life: LifeState, uid: string): FarmX => ((life.farmx ??= {})[uid] ??= {});
const emptyPlot = (): Plot => ({ crop: null, plantedAt: 0, wateredAt: null });
const walletOf = (uid: string) => 'wallet-' + uid;
const nameOf = (actor: number) => ACTOR_NAMES[actor] ?? '친구';
const josaGa = (name: string) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 ? '이' : '가');
};
function pushLog(life: LifeState, uid: string, entry: FarmLog) {
  const x = farmxOf(life, uid);
  x.log = [...(x.log ?? []), entry].slice(-FARM_LOG_MAX);
}
export const fixtureAt = (life: LifeState, uid: string, tile: number): Fixture | null =>
  life.farmx?.[uid]?.fx?.[String(tile)] ?? null;
/** Tiles of a bed (0 front: tiles 0–5, 1 back: 6–11). */
export const bedTiles = (bed: number) => Array.from({ length: 6 }, (_, i) => bed * 6 + i);
/** Best water bonus (%p) of the sprinklers covering `tile`, or null when none does. */
export function sprinklerBonus(life: LifeState, uid: string, tile: number): number | null {
  let best: number | null = null;
  for (const [t, f] of Object.entries(life.farmx?.[uid]?.fx ?? {}))
    if (sprinklerCovers(f.k, Number(t), tile)) best = Math.max(best ?? 0, FIXTURE_BY_ID[f.k].water!.bonus);
  return best;
}
/**
 * Sprinklers (and 보습 흙) water a plot the moment it is planted or regrows,
 * or a sprinkler is placed: written as an ordinary `wateredAt`, so moving the
 * sprinkler later never rewrites growth that already happened.
 */
export function applySprinklers(life: LifeState, uid: string, tile: number, plot: Plot, now: number) {
  if (!plot.crop || plot.wateredAt !== null || plotRainAt(plot, now) !== null) return;
  if (now >= plotReadyAt(plot, now)!) return;
  const bonus = sprinklerBonus(life, uid, tile);
  if (bonus !== null) {
    plot.wateredAt = now;
    if (bonus) plot.w = Math.max(plot.w ?? 0, bonus);
  } else if (plot.rs) plot.wateredAt = now;
}
/** % slower growth for a crop planted now on `tile` (a trellis crop right in front shades it). */
export function shadeFor(life: LifeState, uid: string, tile: number) {
  const front = tileFront(tile),
    p = front === null ? null : life.farms[uid]?.[front];
  return p?.crop && CROP_INFO[p.crop].trellis ? TRELLIS_SHADE : 0;
}
/** Seasonal crops on this farm never wither (village greenhouse, 온실지기). */
export const farmSheltered = (life: LifeState, uid: string) => hasFlag(life, 'greenhouse') || growthMods(life, uid).offSeason;
/** When a seasonal crop withers: 00:00 KST of the first day after planting outside its seasons. */
export function witherAt(plot: Plot, sheltered: boolean): number | null {
  if (!plot.crop || sheltered) return null;
  const seasons = CROP_INFO[plot.crop].seasons;
  if (!seasons) return null;
  const d0 = kstDay(plot.plantedAt);
  for (let d = d0 + 1; d <= d0 + 60; d++) if (!seasons.includes(seasonOfDay(d))) return dayStart(d);
  return null;
}
/** Visual growth stage 0–4 (seed, sprout, leaves, flower / green fruit, ripe). */
export function growthStage(plot: Plot, now: number): 0 | 1 | 2 | 3 | 4 {
  if (!plot.crop) return 0;
  const ready = plotReadyAt(plot, now)!;
  if (now >= ready) return 4;
  const total = ready - plot.plantedAt,
    p = total <= 0 ? 1 : Math.max(0, (now - plot.plantedAt) / total);
  return Math.min(3, Math.floor(p * 4)) as 0 | 1 | 2 | 3;
}
/** Whether bed `bed` is one giant crop right now (all six ripe, planted together; hash roll). */
export function giantBed(farm: readonly Plot[], uid: string, bed: number, now: number, chance = GIANT_CHANCE): boolean {
  const tiles = bedTiles(bed);
  if (tiles[5] >= farm.length) return false;
  const first = farm[tiles[0]];
  if (!first.crop || !GIANT_CROPS.includes(first.crop)) return false;
  for (const t of tiles) {
    const p = farm[t];
    if (p.crop !== first.crop || p.plantedAt !== first.plantedAt || (p.n ?? 0) > 0 || now < plotReadyAt(p, now)!) return false;
  }
  return hash32(`giant:${uid}:${bed}:${first.plantedAt}`) % 100 < chance;
}
/** Giant crop chance (%) on a friend's farm (재능 큰 작물 doubles it). */
export const giantChance = (life: LifeState, uid: string) => GIANT_CHANCE * (1 + growthMods(life, uid).giantMult);

// ---------------------------------------------------------------- settling
/** Crows at 05:00 KST of day `d` (see design §4-7). */
function crowDay(life: LifeState, uid: string, d: number, sheltered: boolean) {
  const farm = life.farms[uid],
    at = dayStart(d) + CROW_HOUR * HOUR;
  const growing = farm.flatMap((p, i) =>
    p.crop && p.plantedAt <= at && plotReadyAt(p, at)! > at && (witherAt(p, sheltered) ?? Infinity) > at ? [i] : [],
  );
  // 재능 까마귀 쫓기 halves the chance.
  const chance = CROW_CHANCE * (1 - Math.min(1, growthMods(life, uid).crowGuard));
  if (growing.length < CROW_MIN_CROPS || hash32(`crow:${uid}:${d}`) % 100 >= chance) return;
  const guard = FIXTURE_BY_ID.scarecrow.guard!,
    fx = Object.entries(life.farmx?.[uid]?.fx ?? {});
  const guarded = (i: number) => fx.some(([t, f]) => f.k === 'scarecrow' && f.at <= at && tileDist(Number(t), i) <= guard);
  const open = growing.filter((i) => !guarded(i));
  if (!open.length) {
    pushLog(life, uid, { kind: 'guard', at });
    return;
  }
  const i = open[hash32(`crowpick:${uid}:${d}`) % open.length];
  pushLog(life, uid, { kind: 'crow', at, crop: farm[i].crop!, tile: i });
  farm[i] = emptyPlot();
}
/**
 * Brings a farm up to `now`: the 05:00 crow rolls of every day since the last
 * settle (never before the first one: old saves are not punished), then
 * withering. Withered tiles become empty soil that still shows the dead plant
 * (`dead`) until something is planted or placed there.
 */
export function settleFarmPlots(life: LifeState, uid: string, now: number) {
  const farm = life.farms[uid];
  if (!farm) return;
  const today = kstDay(now),
    x = farmxOf(life, uid),
    sheltered = farmSheltered(life, uid);
  if (x.st === undefined || x.st > today) x.st = today;
  for (let d = Math.max(x.st + 1, today - 14); d <= today; d++) {
    if (now < dayStart(d) + CROW_HOUR * HOUR) break;
    crowDay(life, uid, d, sheltered);
    x.st = d;
  }
  farm.forEach((p, i) => {
    const w = witherAt(p, sheltered);
    if (w !== null && now >= w) {
      pushLog(life, uid, { kind: 'wither', at: w, crop: p.crop!, tile: i });
      farm[i] = { ...emptyPlot(), dead: p.crop! };
    }
  });
}
/** The shipping bin sells as the first sale of the day it is settled on (after its own day). */
function settleBin(life: LifeState, ledger: LoungeLedger, uid: string, now: number) {
  const x = life.farmx?.[uid],
    bin = x?.bin,
    today = kstDay(now);
  if (!x || !bin || bin.day >= today || !own(ledger.accounts, walletOf(uid))) return ledger;
  const flags = life.flags ?? [],
    mods = growthMods(life, uid),
    cap = SELL_CAP_PER_DAY - soldBeomToday(life, uid, now),
    keep: Record<string, number> = {};
  let amount = 0,
    shipped = 0;
  for (const [key, n] of Object.entries(bin.items)) {
    const s = parseStock(key);
    if (!s) continue;
    const unit = stockUnit(s.id, s.q, now, flags),
      bonus = isCropId(s.id) || isGoodId(s.id) ? sellBonus(mods, s.id, s.q) : 0,
      soft = demandSoft(mods, s.id),
      sold = demandSold(life, uid, now, s.id),
      before = soldBeomToday(life, uid, now) + amount;
    let got = 0,
      pay = 0;
    for (; got < n; got++) {
      const one = Math.round(sellTotal(s.id, unit, sold + got, 1, before + pay, soft) * (1 + bonus) * SELL_AWAY);
      if (amount + pay + one > cap) break;
      pay += one;
    }
    if (got) {
      noteDemand(life, uid, now, s.id, got);
      amount += pay;
      shipped += got;
    }
    if (got < n) keep[key] = n - got;
  }
  if (nonEmpty(keep)) x.bin = { day: today, items: keep };
  else delete x.bin;
  if (amount <= 0) return ledger;
  const prev = life.sold[uid];
  life.sold[uid] = { day: today, amount: (prev?.day === today ? prev.amount : 0) + amount };
  bump(life, uid, 'earned', amount);
  pushLog(life, uid, { kind: 'ship', at: now, n: shipped, beom: amount });
  return grantBeom(ledger, walletOf(uid), amount, `life-ship-${uid}-${++life.seq}`, now, 'ship');
}
/** Judges last week's 품평회 once the week is over (prizes come out of the fees). */
function settleFair(life: LifeState, ledger: LoungeLedger, now: number) {
  const fair = life.fair,
    week = weekOfDay(kstDay(now));
  if (!fair || fair.week >= week) return ledger;
  let next = ledger;
  const entries = [...fair.entries].sort((a, b) => b.score - a.score || a.at - b.at);
  const pot = entries.length * FAIR_FEE,
    ranks: FairRank[] = [];
  entries.slice(0, FAIR_PRIZE_SHARES.length).forEach((e, i) => {
    const prize = Math.floor((pot * FAIR_PRIZE_SHARES[i]) / 10) * 10;
    ranks.push({ actor: e.actor, item: e.item, q: e.q, score: e.score, prize });
    if (prize > 0 && own(next.accounts, walletOf(e.uid)))
      next = grantBeom(next, walletOf(e.uid), prize, `life-fair-${e.uid}-${++life.seq}`, now, 'fair');
    pushLog(life, e.uid, { kind: 'fair', at: now, crop: e.item, n: i + 1, ...(prize ? { beom: prize } : {}) });
  });
  const results = entries.length
    ? [...(fair.results ?? []), { week: fair.week, pot, judgedAt: now, entrants: entries.length, ranks }].slice(-FAIR_HISTORY)
    : fair.results;
  life.fair = { week, entries: [], ...(results?.length ? { results } : {}) };
  const top = ranks[0];
  if (top) {
    const text = `${FAIR_JUDGE.name} ${FAIR_JUDGE.role}이 품평회 1등으로 ${nameOf(top.actor)}의 ${stockName(top.item)}을 뽑았어요`;
    addNews(life, now, `fair:${fair.week}`, 'fair', text, ranks.map((r) => r.actor));
    addMemory(life, now, 'fair', ranks.map((r) => r.actor), text);
  }
  return next;
}
/**
 * Settles everything time-based before a member's life action: their farm
 * (crows, withering), their shipping bin, and last week's 품평회.
 */
export function settleFarm(life: LifeState, ledger: LoungeLedger, member: { id: string; actor: number }, now: number) {
  settleFarmPlots(life, member.id, now);
  return settleFair(life, settleBin(life, ledger, member.id, now), now);
}
/** A copy of `life` whose farms are settled to `now` (views never write). */
export function projectFarms(life: LifeState, now: number): LifeState {
  const out: LifeState = { ...life, farms: structuredClone(life.farms), farmx: structuredClone(life.farmx ?? {}) };
  for (const uid of Object.keys(out.farms)) settleFarmPlots(out, uid, now);
  return out;
}

// ---------------------------------------------------------------- harvest (self and friends)
/**
 * Harvests plot `plot` (-1: every ripe plot) of `owner`'s farm into the
 * owner's bag: quality per plot (`lift` = 풍작 영감 for my own harvest),
 * giant beds (the whole bed at once, GIANT_YIELD each), regrowing crops
 * (sprinklers / 보습 흙 water the new cycle). XP goes to `xpTo`.
 */
export function harvestFarm(
  life: LifeState,
  owner: string,
  plot: number,
  now: number,
  opts: { xpTo: string; lift?: (q: Quality) => Quality },
): number {
  const farm = life.farms[owner],
    giants = [0, 1].filter((b) => giantBed(farm, owner, b, now, giantChance(life, owner)));
  let targets = plot === -1 ? farm.map((_, i) => i) : [plot];
  if (plot !== -1 && giants.includes(tileBed(plot))) targets = bedTiles(tileBed(plot));
  let harvested = 0;
  const giantLogged = new Set<number>();
  for (const i of targets) {
    const p = farm[i];
    if (!p.crop) {
      if (i === plot && targets.length === 1) fail(fixtureAt(life, owner, i) ? FARM_REJECT.fixture : LIFE_REJECT.empty);
      continue;
    }
    if (now < plotReadyAt(p, now)!) {
      if (i === plot && targets.length === 1) fail(LIFE_REJECT.notReady);
      continue;
    }
    const crop = p.crop,
      bed = tileBed(i),
      giant = giants.includes(bed),
      base = plotQuality(owner, i, p),
      quality = opts.lift ? opts.lift(base) : base,
      n = giant ? GIANT_YIELD : 1;
    addCropQ(life, owner, crop, quality, n);
    countHarvest(life, owner, crop, n);
    bump(life, owner, 'harvest', n);
    if (quality >= 2) bump(life, owner, 'gold', 1);
    discover(life, owner, crop);
    gainXp(life, opts.xpTo, 'farm', (XP.harvestBase + Math.min(XP.harvestHourMax, plotGrowMs(p) / HOUR)) * QUALITY_MULT[quality], now);
    if (giant && !giantLogged.has(bed)) {
      giantLogged.add(bed);
      pushLog(life, owner, { kind: 'giant', at: now, crop, n: 6 * GIANT_YIELD });
    }
    const regrow = CROP_INFO[crop].regrow,
      k = (p.n ?? 0) + 1;
    if (regrow && k < regrow.harvests) {
      const again: Plot = {
        crop,
        plantedAt: now,
        wateredAt: null,
        ...(p.fert ? { fert: p.fert } : {}),
        ...(p.speed ? { speed: p.speed } : {}),
        n: k,
        ...(p.sg ? { sg: 1 as const } : {}),
        ...(p.rs ? { rs: 1 as const } : {}),
        ...(p.sl ? { sl: p.sl } : {}),
      };
      farm[i] = again;
      applySprinklers(life, owner, i, again, now);
    } else farm[i] = emptyPlot();
    harvested++;
  }
  if (!harvested) fail(LIFE_REJECT.nothingReady);
  return harvested;
}

// ---------------------------------------------------------------- stock (crops, fruit, goods)
export function stockCount(life: LifeState, uid: string, id: string, q: Quality): number {
  if (isCropId(id)) return cropQCount(life, uid, id, q);
  if (id === 'fruit') return q === 0 ? (life.bag[uid]?.fruit ?? 0) : 0;
  return life.farmx?.[uid]?.goods?.[stockKey(id, q)] ?? 0;
}
function stockAdd(life: LifeState, uid: string, id: string, q: Quality, n: number) {
  if (isCropId(id)) return addCropQ(life, uid, id, q, n);
  if (id === 'fruit') {
    const bag = life.bag[uid];
    if (n < 0 && bag.fruit < -n) fail(FARM_REJECT.stock);
    bag.fruit = n >= 0 ? addCount(bag.fruit, n) : bag.fruit + n;
    return;
  }
  const x = farmxOf(life, uid),
    goods = (x.goods ??= {}),
    key = stockKey(id, q),
    next = (goods[key] ?? 0) + n;
  if (next < 0) fail(FARM_REJECT.stock);
  if (n > 0 && !(key in goods) && Object.keys(goods).length >= GOODS_KINDS_MAX) fail(FARM_REJECT.goodsFull);
  if (next > 0) goods[key] = Math.min(COUNT_MAX, next);
  else delete goods[key];
  if (!nonEmpty(goods)) delete x.goods;
}
/** 범 value of a friend's goods and shipping bin (daily relief counts it as wealth). */
export function farmGoodsWealth(life: LifeState, uid: string) {
  const x = life.farmx?.[uid];
  if (!x) return 0;
  let total = 0;
  for (const map of [x.goods ?? {}, x.bin?.items ?? {}])
    for (const [key, n] of Object.entries(map)) {
      const s = parseStock(key);
      if (!s) continue;
      const base = isGoodId(s.id) ? (goodsById()[s.id]?.base ?? 0) : s.id === 'fruit' ? FRUIT_SELL : CROP_INFO[s.id as Crop].sell;
      total += n * Math.round(base * QUALITY_MULT[s.q]);
    }
  return total;
}
/** An item + quality from an action (quality defaults to normal). */
function actionStock(item: unknown, q: unknown): { id: string; q: Quality } {
  const quality = q === undefined ? 0 : q;
  if (typeof item !== 'string' || !stockOk(item, quality)) fail(FARM_REJECT.item);
  return { id: item as string, q: quality as Quality };
}
const nIn = (n: unknown, max: number) => (safe(n) && n >= 1 && n <= max ? n : fail(LIFE_REJECT.invalid));

// ---------------------------------------------------------------- building
/** What building `item` needs (null: not a farm build). */
export function buildRecipe(item: string): Recipe | null {
  if (item === 'fertilizer-star') return STAR_FERT_RECIPE;
  return FIXTURE_BY_ID[item]?.recipe ?? MACHINE_BY_ID[item]?.recipe ?? null;
}
/** Why `uid` cannot build `item` now (null = can), for the UI and the action. */
export function buildBlock(life: LifeState, uid: string, item: string, balance: number): string | null {
  const r = buildRecipe(item);
  if (!r) return FARM_REJECT.build;
  if (skillLevel(life, uid, r.skill) < r.level) return `${SKILL_INFO[r.skill].name} Lv${r.level}부터 만들 수 있어요.`;
  for (const [id, n] of Object.entries(r.mats)) if (invCount(life, uid, id) < n) return '재료가 부족해요.';
  if (balance < r.beom) return LIFE_REJECT.balance;
  return null;
}

// ---------------------------------------------------------------- actions
const tileIndex = (life: LifeState, uid: string, tile: unknown) => {
  if (!safe(tile) || tile < 0 || tile >= GRID_COLS * GRID_ROWS) fail(FARM_REJECT.tile);
  if (tile >= life.farms[uid].length) fail(FARM_REJECT.tileLocked);
  return tile as number;
};
const slotIndex = (slot: unknown) => (safe(slot) && slot >= 0 && slot < WORK_SLOTS ? slot : fail(FARM_REJECT.slot));
/** Sprinkler placed or moved to `tile`: water the growing plots it now covers. */
function sprinklerPlaced(life: LifeState, uid: string, now: number) {
  life.farms[uid].forEach((p, i) => applySprinklers(life, uid, i, p, now));
}
/** Honey of the bee house on `tile` (flower honey from the best ripe flower within 2 tiles). */
function honeyOf(life: LifeState, uid: string, tile: number, now: number) {
  let best: Crop | null = null;
  const farm = life.farms[uid];
  for (let i = 0; i < farm.length; i++) {
    const p = farm[i];
    if (!p.crop || CROP_CAT[p.crop] !== 'flower' || tileDist(i, tile) > 2 || now < plotReadyAt(p, now)!) continue;
    if (best === null || CROP_INFO[p.crop].sell > CROP_INFO[best].sell) best = p.crop;
  }
  return best === null ? 'honey' : 'honey-' + best;
}
export const beeReadyAt = (f: Fixture) => (f.h ?? f.at) + BEE_MS;

export function farmAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: FarmAction,
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  const uid = member.id,
    actor = member.actor,
    farm = life.farms[uid];
  let next = ledger;
  switch (a.kind) {
    case 'farmBuild': {
      if (typeof a.item !== 'string') fail(FARM_REJECT.build);
      const why = buildBlock(life, uid, a.item, ledger.accounts[walletOf(uid)] ?? 0);
      if (why) fail(why);
      const r = buildRecipe(a.item)!;
      for (const [id, n] of Object.entries(r.mats)) addInv(life, uid, id, -n);
      if (r.beom) next = spendBeom(next, walletOf(uid), r.beom, `life-build-${uid}-${++life.seq}`, now, 'build-' + a.item);
      addInv(life, uid, a.item, 1);
      gainXp(life, uid, 'craft', XP.craft, now);
      break;
    }
    case 'farmPlace': {
      if (typeof a.item !== 'string') fail(FARM_REJECT.place);
      // Where first, then whether the bag has one (clearer messages).
      const have = () => invCount(life, uid, a.item) >= 1 || fail(FARM_REJECT.place);
      if (own(FIXTURE_BY_ID, a.item)) {
        const tile = tileIndex(life, uid, a.tile);
        if (farm[tile].crop || fixtureAt(life, uid, tile)) fail(FARM_REJECT.tileBusy);
        have();
        farm[tile] = emptyPlot(); // clears a withered plant
        addInv(life, uid, a.item, -1);
        (farmxOf(life, uid).fx ??= {})[String(tile)] = { k: a.item as FixtureKind, at: now };
        if (FIXTURE_BY_ID[a.item].water) sprinklerPlaced(life, uid, now);
      } else if (own(MACHINE_BY_ID, a.item)) {
        const slot = slotIndex(a.slot),
          mach = (farmxOf(life, uid).mach ??= {});
        if (mach[String(slot)]) fail(FARM_REJECT.slotBusy);
        have();
        addInv(life, uid, a.item, -1);
        mach[String(slot)] = { k: a.item as MachineKind };
      } else fail(FARM_REJECT.place);
      break;
    }
    case 'farmPickup': {
      const x = farmxOf(life, uid);
      if (a.tile !== undefined) {
        const tile = tileIndex(life, uid, a.tile),
          f = fixtureAt(life, uid, tile);
        if (!f) fail(FARM_REJECT.noFixture);
        delete x.fx![String(tile)];
        if (!nonEmpty(x.fx!)) delete x.fx;
        addInv(life, uid, f!.k, 1);
      } else {
        const slot = slotIndex(a.slot),
          m = x.mach?.[String(slot)];
        if (!m) fail(FARM_REJECT.noMachine);
        if (m!.out) fail(FARM_REJECT.machineFull);
        delete x.mach![String(slot)];
        if (!nonEmpty(x.mach!)) delete x.mach;
        addInv(life, uid, m!.k, 1);
      }
      break;
    }
    case 'farmMove': {
      const x = farmxOf(life, uid);
      if (a.area === 'slot') {
        const from = slotIndex(a.from),
          to = slotIndex(a.to),
          mach = x.mach ?? {};
        if (!mach[String(from)]) fail(FARM_REJECT.noMachine);
        if (from === to) break;
        const moving = mach[String(from)],
          there = mach[String(to)];
        mach[String(to)] = moving;
        if (there) mach[String(from)] = there;
        else delete mach[String(from)];
        x.mach = mach;
      } else {
        const from = tileIndex(life, uid, a.from),
          to = tileIndex(life, uid, a.to),
          f = fixtureAt(life, uid, from);
        if (!f) fail(FARM_REJECT.noFixture);
        if (from === to) break;
        if (farm[to].crop || fixtureAt(life, uid, to)) fail(FARM_REJECT.tileBusy);
        farm[to] = emptyPlot();
        delete x.fx![String(from)];
        x.fx![String(to)] = f!;
        if (FIXTURE_BY_ID[f!.k].water) sprinklerPlaced(life, uid, now);
      }
      break;
    }
    case 'farmLoad': {
      const slot = slotIndex(a.slot),
        m = life.farmx?.[uid]?.mach?.[String(slot)];
      if (!m) fail(FARM_REJECT.noMachine);
      if (m!.out) fail(m!.done! > now ? FARM_REJECT.machineBusy : FARM_REJECT.machineFull);
      const def = MACHINE_BY_ID[m!.k],
        item = a.item;
      if (typeof item !== 'string' || !(isCropId(item) || item === 'fruit')) fail(FARM_REJECT.machineInput);
      const out = m!.k === 'seedmaker' ? (isCropId(item) ? `seed-${item}` : null) : productOf(m!.k, item);
      if (!out) fail(FARM_REJECT.machineInput);
      // Quality: the one asked for, else the lowest first (the batch keeps its lowest).
      let q: Quality;
      if (a.q !== undefined) {
        if (!stockOk(item, a.q)) fail(LIFE_REJECT.quality);
        q = a.q;
        if (stockCount(life, uid, item, q) < def.per) fail(FARM_REJECT.stock);
        stockAdd(life, uid, item, q, -def.per);
      } else {
        const have = ([0, 1, 2, 3] as Quality[]).reduce<number>((s, t) => s + stockCount(life, uid, item, t), 0);
        if (have < def.per) fail(FARM_REJECT.stock);
        let left = def.per;
        q = 3;
        for (const t of [0, 1, 2, 3] as Quality[]) {
          const take = Math.min(left, stockCount(life, uid, item, t));
          if (!take) continue;
          stockAdd(life, uid, item, t, -take);
          q = Math.min(q, t) as Quality;
          left -= take;
          if (!left) break;
        }
      }
      const seeds = m!.k === 'seedmaker',
        mods = growthMods(life, uid);
      m!.out = out!;
      // 재능 수리공: my machine sometimes makes two; 손이 빠른: a little faster.
      m!.n = seeds ? 1 + (hash32(`seed:${uid}:${slot}:${now}:${life.seq}`) % 2) : 1 + (growthChance(life, uid, `mach:${slot}`, mods.machineDouble, now) ? 1 : 0);
      if (!seeds && q > 0) m!.q = q;
      else delete m!.q;
      m!.at = now;
      m!.done = now + Math.round(def.ms * (1 - Math.min(0.9, mods.machineFast)));
      break;
    }
    case 'farmCollect': {
      const x = farmxOf(life, uid);
      let got = 0;
      const collectSlot = (key: string) => {
        const m = x.mach?.[key];
        if (!m?.out || now < m.done!) return false;
        if (m.out.startsWith('seed-')) {
          const crop = m.out.slice(5) as Crop;
          life.bag[uid].seeds[crop] = addCount(life.bag[uid].seeds[crop], m.n ?? 1);
        } else {
          stockAdd(life, uid, m.out, m.q ?? 0, m.n ?? 1);
        }
        x.mach![key] = { k: m.k };
        return true;
      };
      const collectBee = (key: string) => {
        const f = x.fx?.[key];
        if (f?.k !== 'beehouse' || now < beeReadyAt(f)) return false;
        const honey = honeyOf(life, uid, Number(key), now);
        stockAdd(life, uid, honey, 0, 1);
        f.h = now;
        return true;
      };
      if (a.tile !== undefined) got += Number(collectBee(String(tileIndex(life, uid, a.tile))));
      else if (a.slot === undefined || a.slot === -1) {
        for (const key of Object.keys(x.mach ?? {})) got += Number(collectSlot(key));
        for (const key of Object.keys(x.fx ?? {})) got += Number(collectBee(key));
      } else got += Number(collectSlot(String(slotIndex(a.slot))));
      if (!got) fail(FARM_REJECT.nothing);
      bump(life, uid, 'craft', got);
      gainXp(life, uid, 'craft', 3 * got, now);
      break;
    }
    case 'ship': {
      const s = actionStock(a.item, a.q),
        n = nIn(a.n, BIN_MAX),
        x = farmxOf(life, uid),
        today = kstDay(now);
      if (stockCount(life, uid, s.id, s.q) < n) fail(FARM_REJECT.stock);
      const bin = x.bin?.day === today ? x.bin : { day: today, items: { ...x.bin?.items } };
      const total = Object.values(bin.items).reduce((t, k) => t + k, 0);
      if (total + n > BIN_MAX) fail(FARM_REJECT.binFull);
      stockAdd(life, uid, s.id, s.q, -n);
      const key = stockKey(s.id, s.q);
      bin.items[key] = (bin.items[key] ?? 0) + n;
      x.bin = bin;
      break;
    }
    case 'unship': {
      const s = actionStock(a.item, a.q),
        n = nIn(a.n, BIN_MAX),
        x = farmxOf(life, uid),
        key = stockKey(s.id, s.q);
      if (!x.bin || (x.bin.items[key] ?? 0) < n) fail(FARM_REJECT.binEmpty);
      x.bin.items[key] -= n;
      if (!x.bin.items[key]) delete x.bin.items[key];
      if (!nonEmpty(x.bin.items)) delete x.bin;
      stockAdd(life, uid, s.id, s.q, n);
      break;
    }
    case 'sellGoods': {
      const s = actionStock(a.item, a.q),
        n = nIn(a.n, 999);
      if (!isGoodId(s.id)) fail(FARM_REJECT.item);
      if (stockCount(life, uid, s.id, s.q) < n) fail(FARM_REJECT.stock);
      const unit = stockUnit(s.id, s.q, now, life.flags ?? []),
        // 재능 포장의 달인: a share on top of the demand curve.
        bonus = sellBonus(growthMods(life, uid), s.id, s.q),
        amount = shopSaleAmount(life, uid, actor, a.at, s.id, Math.round(sellTotal(s.id, unit, demandSold(life, uid, now, s.id), n, soldBeomToday(life, uid, now)) * (1 + bonus)), now),
        left = SELL_CAP_PER_DAY - soldBeomToday(life, uid, now);
      if (amount > left) fail(`오늘은 ${Math.max(0, left).toLocaleString('en-US')}범어치까지만 더 팔 수 있어요.`);
      stockAdd(life, uid, s.id, s.q, -n);
      noteDemand(life, uid, now, s.id, n);
      const day = kstDay(now),
        prev = life.sold[uid];
      life.sold[uid] = { day, amount: (prev?.day === day ? prev.amount : 0) + amount };
      bump(life, uid, 'earned', amount);
      next = grantBeom(next, walletOf(uid), amount, `life-sell-${uid}-${++life.seq}`, now, 'sell-' + s.id);
      break;
    }
    case 'harvestFriend': {
      const owner = uidOf(life, a.owner);
      if (!owner || owner === uid || !life.farms[owner]) fail(FARM_REJECT.friendFarm);
      const ownerActor = life.actors[owner!],
        x = farmxOf(life, uid),
        today = kstDay(now);
      if (x.hf?.day === today && x.hf.actors.includes(ownerActor)) fail(FARM_REJECT.helped);
      settleFarmPlots(life, owner!, now);
      const n = harvestFarm(life, owner!, -1, now, { xpTo: uid });
      x.hf = { day: today, actors: [...(x.hf?.day === today ? x.hf.actors : []), ownerActor] };
      pushLog(life, owner!, { kind: 'help', at: now, actor, n });
      bump(life, uid, 'waterFriend', 1);
      if (bondGate(life, `hf:${actor}>${ownerActor}`, now)) addBond(life, actor, ownerActor, BOND_POINTS.water, now);
      addNews(life, now, `hf:${actor}>${ownerActor}`, 'water', `${josaGa(nameOf(actor))} ${nameOf(ownerActor)}의 밭을 거들어 ${n}칸을 거뒀어요`, [actor, ownerActor]);
      break;
    }
    case 'fairEnter': {
      const s = actionStock(a.item, a.q),
        week = weekOfDay(kstDay(now));
      if (!life.fair || life.fair.week !== week)
        life.fair = { week, entries: [], ...(life.fair?.results ? { results: life.fair.results } : {}) };
      const fair = life.fair;
      if (fair.entries.some((e) => e.uid === uid)) fail(FARM_REJECT.fairDone);
      if (fair.entries.length >= 16) fail(FARM_REJECT.fairFull);
      if (stockCount(life, uid, s.id, s.q) < 1) fail(FARM_REJECT.stock);
      if ((ledger.accounts[walletOf(uid)] ?? 0) < FAIR_FEE) fail(LIFE_REJECT.balance);
      next = spendBeom(next, walletOf(uid), FAIR_FEE, `life-fairfee-${uid}-${++life.seq}`, now, 'fair-fee');
      stockAdd(life, uid, s.id, s.q, -1);
      // 재능 품평회 단골: +10% on my entry's score.
      const score = Math.round(fairScore(s.id, s.q, now, life.flags ?? []) * (1 + growthMods(life, uid).fairBonus));
      fair.entries.push({ actor, uid, item: s.id, q: s.q, score, at: now });
      addNews(life, now, `fairin:${actor}:${week}`, 'fair', `${josaGa(nameOf(actor))} 품평회에 ${stockName(s.id)}을 냈어요`, [actor]);
      break;
    }
  }
  return { life, ledger: next };
}
/** 품평회 score: the item's full price at its quality (crops in season +10%), goods +10%. */
export const fairScore = (id: string, q: Quality, now: number, flags: readonly string[] = []) =>
  Math.round(stockUnit(id, q, now, flags) * (isGoodId(id) ? 1.1 : 1));

// ---------------------------------------------------------------- views
export type FarmXView = {
  grid: { cols: number; rows: number };
  fixtures: { tile: number; kind: FixtureKind; at: number; readyAt?: number }[];
  machines: { slot: number; kind: MachineKind; out?: string; q?: Quality; n?: number; startAt?: number; doneAt?: number }[];
  goods: { id: string; q: Quality; n: number }[];
  bin: { day: number; items: { id: string; q: Quality; n: number }[]; value: number; payAt: number } | null;
  log: FarmLog[];
  /** Beds (0 front, 1 back) that are one giant crop now. */
  giants: number[];
  /** Friends whose farm I helped harvest today. */
  helped: number[];
};
export type FairView = {
  week: number;
  judgeAt: number;
  fee: number;
  judge: typeof FAIR_JUDGE;
  entries: { actor: number; item: string; q: Quality; score: number }[];
  entered: boolean;
  results: FairResult[];
};
const splitStock = (map: Record<string, number>) =>
  Object.entries(map).flatMap(([key, n]) => {
    const s = parseStock(key);
    return s ? [{ id: s.id, q: s.q, n }] : [];
  });
export function farmXView(life: LifeState, uid: string, now: number): FarmXView {
  const x = life.farmx?.[uid] ?? {},
    farm = life.farms[uid] ?? [],
    today = kstDay(now);
  const binItems = x.bin ? splitStock(x.bin.items) : [];
  return {
    grid: { cols: GRID_COLS, rows: GRID_ROWS },
    fixtures: Object.entries(x.fx ?? {}).map(([t, f]) => ({
      tile: Number(t),
      kind: f.k,
      at: f.at,
      ...(f.k === 'beehouse' ? { readyAt: beeReadyAt(f) } : {}),
    })),
    machines: Object.entries(x.mach ?? {}).map(([s, m]) => ({
      slot: Number(s),
      kind: m.k,
      ...(m.out ? { out: m.out, n: m.n ?? 1, startAt: m.at, doneAt: m.done, ...(m.q ? { q: m.q } : {}) } : {}),
    })),
    goods: splitStock(x.goods ?? {}),
    bin: x.bin
      ? {
          day: x.bin.day,
          items: binItems,
          value: Math.round(binItems.reduce((t, s) => t + s.n * stockUnit(s.id, s.q, now, life.flags ?? []), 0) * SELL_AWAY),
          payAt: nextKstMidnight(dayStart(x.bin.day)),
        }
      : null,
    log: [...(x.log ?? [])],
    giants: [0, 1].filter((b) => giantBed(farm, uid, b, now, giantChance(life, uid))),
    helped: x.hf?.day === today ? [...x.hf.actors] : [],
  };
}
export function fairView(life: LifeState, uid: string, now: number): FairView {
  const week = weekOfDay(kstDay(now)),
    fair = life.fair?.week === week ? life.fair : null;
  // A finished week not yet judged shows as judged-soon; its entries stay out of this week.
  return {
    week,
    judgeAt: weekResetAt(week),
    fee: FAIR_FEE,
    judge: FAIR_JUDGE,
    entries: (fair?.entries ?? []).map((e) => ({ actor: e.actor, item: e.item, q: e.q, score: e.score })),
    entered: !!fair?.entries.some((e) => e.uid === uid),
    results: structuredClone(life.fair?.results ?? []),
  };
}
/** Friends' yards for the 3D village: fixtures, machines and giant beds (small). */
export function farmsPublic(life: LifeState, now: number) {
  const out: Record<string, { fx: [number, FixtureKind][]; mach: [number, MachineKind, boolean][]; giants: number[] }> = {};
  for (const [uid, farm] of Object.entries(life.farms)) {
    const x = life.farmx?.[uid],
      giants = [0, 1].filter((b) => giantBed(farm, uid, b, now, giantChance(life, uid)));
    if (!x?.fx && !x?.mach && !giants.length) continue;
    out[uid] = {
      fx: Object.entries(x?.fx ?? {}).map(([t, f]) => [Number(t), f.k]),
      mach: Object.entries(x?.mach ?? {}).map(([s, m]) => [Number(s), m.k, !!m.out]),
      giants,
    };
  }
  return out;
}
