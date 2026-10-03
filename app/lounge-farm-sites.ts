// 우리 농장 F3 engine (design-our-farm.md §3-5, §10, §11): the facility sites,
// the 공동 밭 and its 공동 창고, the 마을 대형 작물 season goal.
//
//  - Storage: `world.life.farm` = { sites: { siteId: { kind, tier, owner,
//    state, fund?, paid? } }, field, till, store, goal, d, gm }. Everything is
//    read through readFarmCommons (bounded, per-kind state checks).
//  - Shared facilities are funded together like 마을 개척 (tier 0 = being
//    funded); personal ones are paid at once by the site's owner. Demolishing
//    gives back half of the materials to whoever paid them (범 stays spent).
//  - The day settle (settleSites) runs at the same point as the shipping bin
//    (lounge-farm.ts settleFarm, before every life action) and calls each
//    built facility's `daily` hook once per KST day (DAILY).
//  - Plots in the greenhouses and the shared field are ordinary `Plot`s: the
//    growth and watering rules are lounge-life.ts's own (plotReadyAt …);
//    only the greenhouses ignore the season.
//
// Cycle-safe like lounge-farm.ts: lounge-life.ts imports this module and this
// module imports it back, so its bindings are only used inside functions.
import { kstDay, spendBeom, type LoungeLedger } from './lounge-economy.ts';
import { ACTOR_NAMES, CALENDAR_ANCHOR_DAY, SEASON_DAYS, hash32, seasonOf, seasonOfDay } from './lounge-calendar.ts';
import {
  COMMON_BEDS,
  COMMON_GIANT_CHANCE,
  COMMON_GOAL_CROPS,
  COMMON_GOAL_GIANTS,
  COMMON_GOAL_XP,
  COMMON_TILES,
  DEMOLISH_REFUND,
  BASE_WORK_SLOTS,
  FACILITY_BY_ID,
  GREENHOUSE_PER_FRIEND,
  ORCHARD_PLOT_DAYS,
  ORCHARD_PLOT_HOLD,
  SETTLE_BACK_DAYS,
  SITE_IDS,
  SITE_MIN_BEOM,
  STORE_KINDS_MAX,
  commonBedTiles,
  commonTileBed,
  facilitiesFor,
  isFacilityId,
  maxTier,
  siteActor,
  siteSize,
  slotsAt,
  tierCost,
  unlockBlock,
  type DailyId,
  type FacilityDef,
  type FacilityId,
  type SiteActionKind,
} from './lounge-farm-sites-data.ts';
import { FRUIT_TREE_KINDS, SAPLINGS, type FruitTreeKind } from './lounge-stage3-data.ts';
import {
  CROP_INFO,
  CROPS,
  LIFE_REJECT,
  LifeError,
  MAX_SPEED,
  QUALITY_MULT,
  cropInSeason,
  isQuality,
  plotGrowMs,
  plotQuality,
  plotRainAt,
  plotReadyAt,
  plotWateredAt,
  readField,
  uidOf,
  type Crop,
  type LifeState,
  type Plot,
  type Quality,
} from './lounge-life.ts';
import { addCropQ, addInv, addMemory, addNews, bump, discover, hasFlag, invCount, plantSpeed, villageGrowSpeed } from './lounge-life-plus.ts';
import { gainXp, growthMods, skillLevel } from './lounge-growth.ts';
import { XP } from './lounge-growth-data.ts';
import { GIANT_CROPS, GIANT_YIELD } from './lounge-farm-data.ts';
import { growthStage, parseStock, stockKey, stockName, witherAt } from './lounge-farm.ts';

const HOUR = 3_600_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const nonEmpty = (o: object) => Object.keys(o).length > 0;
const actorValid = (a: unknown): a is number => safe(a) && a >= 0 && a < 7;
const isCrop = (c: unknown): c is Crop => typeof c === 'string' && (CROPS as string[]).includes(c);
const COUNT_MAX = 99_999;
const walletOf = (uid: string) => 'wallet-' + uid;
const nameOf = (actor: number) => ACTOR_NAMES[actor] ?? '친구';
const josaGa = (name: string) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 ? '이' : '가');
};
const josaUl = (name: string) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 ? '을' : '를');
};
function fail(message: string): never {
  throw new LifeError(message);
}

// ---------------------------------------------------------------- types
/** A greenhouse plot; `o` = the friend (actor) growing it for themselves, absent = for the shared store. */
export type SitePlot = Plot & { o?: number };
export type OrchardTree = { f: FruitTreeKind; at: number; n?: number };
/** Per-kind facility state (small; validated on read by the kind). */
export type SiteFacilityState = { plots?: Record<string, SitePlot>; trees?: Record<string, OrchardTree> };
/** An open shared funding: for tier `to` (1 = the build). `by`: gifts per actor. */
export type SiteFund = { to: number; got: number; mat: Record<string, number>; by: Record<string, number> };
export type SiteRecord = {
  kind: FacilityId;
  /** 0 = being funded (nothing stands yet). */
  tier: number;
  /** 'shared', or the uid of the personal site's owner. */
  owner: string;
  state: SiteFacilityState;
  fund?: SiteFund;
  /** Materials paid per actor (half comes back on demolish). */
  paid?: Record<string, Record<string, number>>;
};
export type CommonGoal = { k: number; n: number; by: number[]; done?: number };
export type FarmCommons = {
  sites?: Record<string, SiteRecord>;
  /** 공동 밭 plots (sparse, tile → plot). */
  field?: Record<string, Plot>;
  /** 공동 밭 tilled tiles. */
  till?: number[];
  /** 공동 창고: stock key ('pumpkin@2') → count. */
  store?: Record<string, number>;
  goal?: CommonGoal;
  /** Last KST day the daily hooks ran. */
  d?: number;
  /** When this world first settled F3 (crops planted before it under the old village greenhouse never wither). */
  gm?: number;
};
export type FarmSitesExt = { farm?: FarmCommons };
export type SiteAction =
  | { kind: 'siteBuild'; site: string; facility: string }
  | { kind: 'siteGive'; site: string; beom?: number; item?: string; n?: number }
  | { kind: 'siteUpgrade'; site: string }
  | { kind: 'siteDemolish'; site: string }
  /** Greenhouses: tile −1 = every empty tile I may use; `shared` grows for the 공동 창고. */
  | { kind: 'sitePlant'; site: string; tile: number; crop: Crop; shared?: boolean }
  | { kind: 'siteWater'; site: string; tile: number }
  | { kind: 'siteHarvest'; site: string; tile: number }
  /** 과일나무 자리: plant a sapling in `slot` (bought here), or `clear` it. */
  | { kind: 'siteTree'; site: string; slot: number; tree?: FruitTreeKind; clear?: boolean }
  | { kind: 'siteFruit'; site: string }
  | { kind: 'commonTill'; tile: number }
  | { kind: 'commonPlant'; tile: number; crop: Crop }
  | { kind: 'commonWater'; tile: number }
  | { kind: 'commonHarvest'; tile: number };
type _Kinds = SiteAction['kind'] extends SiteActionKind ? (SiteActionKind extends SiteAction['kind'] ? true : never) : never;
export const SITE_KINDS_OK: _Kinds = true;

export const SITE_REJECT = {
  site: '부지를 확인해 주세요.',
  facility: '이 부지에 지을 수 없는 시설이에요.',
  taken: '이미 시설이 있거나 공사 중인 부지예요.',
  one: '이미 농장에 있는 시설이에요.',
  notMine: '내 부지가 아니에요.',
  noSite: '아직 아무것도 없는 부지예요.',
  building: '아직 공사 중이에요. 범과 재료를 보태 주세요.',
  noFund: '지금 모으는 공사가 없어요.',
  give: `범은 ${SITE_MIN_BEOM.toLocaleString('en-US')}범부터 보탤 수 있어요.`,
  giveItem: '이 공사에 필요한 재료가 아니에요.',
  slotFull: '그 재료는 다 모였어요.',
  maxTier: '더 넓힐 수 없어요.',
  upgrading: '이미 넓히는 공사를 하고 있어요.',
  funded: '이미 모인 범과 재료가 있어서 철거할 수 없어요.',
  growing: '자라는 작물을 먼저 거둬 주세요.',
  machines: '가공 마당의 5번째 칸부터 놓인 기계를 먼저 치워 주세요.',
  tile: '칸을 확인해 주세요.',
  tileBusy: '이미 작물이 자라고 있는 칸이에요.',
  myTiles: `온실에서 내 작물은 ${GREENHOUSE_PER_FRIEND}칸까지 키울 수 있어요. 나머지는 공용으로 심어 주세요.`,
  notYours: '다른 친구가 키우는 칸이에요.',
  kind: '그 시설에서는 할 수 없는 일이에요.',
  tree: '묘목을 확인해 주세요.',
  treeBusy: '이미 나무가 있는 자리예요.',
  noTree: '그 자리에는 나무가 없어요.',
  noFruit: '딸 과일이 아직 없어요.',
  untilled: '먼저 괭이로 갈아 주세요.',
  tilled: '이미 갈아 둔 칸이에요.',
  store: '공동 창고에 그만큼 없어요.',
  storeFull: '공동 창고가 가득 찼어요.',
} as const;

// ---------------------------------------------------------------- reading
const isUidOwner = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
function readPlots(v: unknown, tiles: number, owned: boolean): Record<string, SitePlot> {
  const raw = obj(v),
    field = readField(Object.fromEntries(Object.entries(raw).filter(([k]) => /^\d{1,2}$/.test(k) && Number(k) < tiles).slice(0, tiles)));
  const out: Record<string, SitePlot> = {};
  for (let t = 0; t < tiles; t++) {
    const p = field[t] as SitePlot;
    if (!p.crop && !p.dead) continue;
    const o = obj(raw[String(t)]).o;
    out[String(t)] = owned && actorValid(o) && p.crop ? { ...p, o } : p;
  }
  return out;
}
function readTrees(v: unknown, slots: number): Record<string, OrchardTree> {
  const out: Record<string, OrchardTree> = {};
  for (const [k, t] of Object.entries(obj(v)).slice(0, slots * 2)) {
    if (!/^\d$/.test(k) || Number(k) >= slots) continue;
    const x = obj(t);
    if (!(FRUIT_TREE_KINDS as readonly unknown[]).includes(x.f) || !safe(x.at) || x.at <= 0) continue;
    out[k] = { f: x.f as FruitTreeKind, at: x.at, ...(safe(x.n) && x.n > 0 ? { n: Math.min(ORCHARD_PLOT_HOLD, x.n) } : {}) };
  }
  return out;
}
/** Per-kind state (unknown keys dropped). */
function readState(def: FacilityDef, tier: number, v: unknown): SiteFacilityState {
  const x = obj(v),
    out: SiteFacilityState = {};
  if (tier < 1) return out;
  if (def.id === 'greenhouse' || def.id === 'greenhouseMini') {
    const plots = readPlots(x.plots, slotsAt(def, tier), def.id === 'greenhouse');
    if (nonEmpty(plots)) out.plots = plots;
  } else if (def.id === 'orchardPlot') {
    const trees = readTrees(x.trees, slotsAt(def, tier));
    if (nonEmpty(trees)) out.trees = trees;
  }
  return out;
}
/** Materials a facility may ever ask for (build and upgrades). */
const matKeys = (def: FacilityDef) => new Set([def.build, ...(def.upgrades ?? [])].flatMap((c) => Object.keys(c.mats)));
function readFund(def: FacilityDef, tier: number, v: unknown): SiteFund | undefined {
  const x = obj(v);
  if (!safe(x.to) || x.to !== tier + 1 || x.to > maxTier(def)) return;
  const cost = tierCost(def, x.to)!;
  const mat: Record<string, number> = {};
  for (const [id, need] of Object.entries(cost.mats)) {
    const n = obj(x.mat)[id];
    if (safe(n) && n > 0) mat[id] = Math.min(need, n);
  }
  const by: Record<string, number> = {};
  for (const [a, n] of Object.entries(obj(x.by))) if (/^[0-6]$/.test(a) && safe(n) && n > 0) by[a] = Math.min(COUNT_MAX, n);
  return { to: x.to, got: safe(x.got) && x.got > 0 ? Math.min(cost.beom, x.got) : 0, mat, by };
}
function readPaid(def: FacilityDef, v: unknown) {
  const keys = matKeys(def),
    out: Record<string, Record<string, number>> = {};
  for (const [a, m] of Object.entries(obj(v))) {
    if (!/^[0-6]$/.test(a)) continue;
    const mats: Record<string, number> = {};
    for (const [id, n] of Object.entries(obj(m))) if (keys.has(id) && safe(n) && n > 0) mats[id] = Math.min(1_000_000, n);
    if (nonEmpty(mats)) out[a] = mats;
  }
  return out;
}
function readSite(id: string, v: unknown): SiteRecord | undefined {
  const x = obj(v);
  if (!isFacilityId(x.kind)) return;
  const def = FACILITY_BY_ID[x.kind];
  if (!facilitiesFor(id).includes(def)) return;
  const personal = siteActor(id) !== null;
  if (personal ? !isUidOwner(x.owner) : x.owner !== 'shared') return;
  const tier = safe(x.tier) && x.tier >= 0 ? Math.min(maxTier(def), x.tier) : 0;
  const fund = personal ? undefined : readFund(def, tier, x.fund);
  // Nothing stands and nothing is being funded: no record.
  if (tier === 0 && !fund) return;
  const paid = readPaid(def, x.paid);
  return {
    kind: def.id,
    tier,
    owner: x.owner as string,
    state: readState(def, tier, x.state),
    ...(fund ? { fund } : {}),
    ...(nonEmpty(paid) ? { paid } : {}),
  };
}
function readGoal(v: unknown): CommonGoal | undefined {
  const x = obj(v);
  if (!safe(x.k)) return;
  const by = Array.isArray(x.by) ? [...new Set(x.by.filter(actorValid))].sort((a, b) => a - b) : [];
  return { k: x.k, n: safe(x.n) && x.n > 0 ? Math.min(99, x.n) : 0, by, ...(safe(x.done) && x.done > 0 ? { done: x.done } : {}) };
}
/** Normalizes `world.life.farm` (absent in older worlds → omitted). */
export function readFarmCommons(value: unknown): FarmSitesExt {
  const v = obj(value),
    out: FarmCommons = {};
  const sites: Record<string, SiteRecord> = {};
  for (const id of SITE_IDS) {
    const s = readSite(id, obj(v.sites)[id]);
    if (s) sites[id] = s;
  }
  if (nonEmpty(sites)) out.sites = sites;
  const field = readPlots(v.field, COMMON_TILES, false);
  if (nonEmpty(field)) out.field = field;
  if (Array.isArray(v.till)) {
    const till = [...new Set(v.till.filter((t): t is number => safe(t) && t >= 0 && t < COMMON_TILES))].sort((a, b) => a - b);
    if (till.length) out.till = till;
  }
  const store: Record<string, number> = {};
  for (const [k, n] of Object.entries(obj(v.store)).slice(0, STORE_KINDS_MAX * 2)) {
    if (Object.keys(store).length >= STORE_KINDS_MAX) break;
    const s = parseStock(k);
    if (s && isCrop(s.id) && safe(n) && n > 0) store[k] = Math.min(COUNT_MAX, n);
  }
  if (nonEmpty(store)) out.store = store;
  const goal = readGoal(v.goal);
  if (goal) out.goal = goal;
  if (safe(v.d) && v.d > 0) out.d = v.d;
  if (safe(v.gm) && v.gm > 0) out.gm = v.gm;
  return nonEmpty(out) ? { farm: out } : {};
}

// ---------------------------------------------------------------- helpers
const commonsOf = (life: LifeState): FarmCommons => (life.farm ??= {});
const siteOf = (life: LifeState, id: string): SiteRecord | null => life.farm?.sites?.[id] ?? null;
/** The built machine yard's tier (the best one if two stand), 0 when none. */
export function machineYardTier(life: LifeState) {
  let best = 0;
  for (const s of Object.values(life.farm?.sites ?? {})) if (s.kind === 'machineYard') best = Math.max(best, s.tier);
  return best;
}
/** Machine slots each friend has: the machine yard's tier (4 → 8 → 12), 4 without one. */
export const workSlots = (life: LifeState) => {
  const tier = machineYardTier(life);
  return tier ? slotsAt(FACILITY_BY_ID.machineYard, tier) : BASE_WORK_SLOTS;
};
/** Whether the shared greenhouse stands (village requests may then ask for off-season crops). */
export const greenhouseBuilt = (life: LifeState) => Object.values(life.farm?.sites ?? {}).some((s) => s.kind === 'greenhouse' && s.tier >= 1);
/**
 * Crops planted before this world moved to F3 while the old village-wide
 * greenhouse (꾸러미 '여름 수확') was on never wither: nobody loses a crop to
 * the change.
 */
export const legacyShelter = (life: LifeState, plot: Plot) =>
  !!plot.crop && hasFlag(life, 'greenhouse') && plot.plantedAt < (life.farm?.gm ?? Infinity);
/** The 7-day season cycle a day belongs to (the 마을 대형 작물 goal's key). */
export const seasonKey = (day: number) => Math.floor((day - CALENDAR_ANCHOR_DAY) / SEASON_DAYS);
const unlockCtx = (life: LifeState, uid: string) => ({ flags: life.flags ?? [], level: (s: Parameters<typeof skillLevel>[2]) => skillLevel(life, uid, s) });
/** Why `uid` cannot start `facility` on site `id` now (null = can; cost is checked when paying). */
export function siteBuildBlock(life: LifeState, uid: string, actor: number, id: string, facility: string): string | null {
  if (!siteSize(id)) return SITE_REJECT.site;
  if (!isFacilityId(facility) || !facilitiesFor(id).includes(FACILITY_BY_ID[facility])) return SITE_REJECT.facility;
  if (siteOf(life, id)) return SITE_REJECT.taken;
  if (FACILITY_BY_ID[facility].owner === 'shared' && Object.values(life.farm?.sites ?? {}).some((s) => s.kind === facility)) return SITE_REJECT.one;
  const owner = siteActor(id);
  if (owner !== null && owner !== actor) return SITE_REJECT.notMine;
  return unlockBlock(FACILITY_BY_ID[facility], unlockCtx(life, uid));
}
function payMats(life: LifeState, uid: string, mats: Readonly<Record<string, number>>) {
  for (const [id, n] of Object.entries(mats)) if (invCount(life, uid, id) < n) fail(LIFE_REJECT.notEnough);
  for (const [id, n] of Object.entries(mats)) addInv(life, uid, id, -n);
}
function notePaid(site: SiteRecord, actor: number, id: string, n: number) {
  const paid = ((site.paid ??= {})[String(actor)] ??= {});
  paid[id] = Math.min(1_000_000, (paid[id] ?? 0) + n);
}
const fundFull = (def: FacilityDef, f: SiteFund) => {
  const cost = tierCost(def, f.to)!;
  return f.got >= cost.beom && Object.entries(cost.mats).every(([id, n]) => (f.mat[id] ?? 0) >= n);
};
function finishTier(life: LifeState, id: string, site: SiteRecord, tier: number, actors: number[], now: number) {
  const def = FACILITY_BY_ID[site.kind];
  site.tier = tier;
  delete site.fund;
  const helpers = [...new Set(actors)].filter(actorValid).sort((a, b) => a - b);
  const text = tier === 1 ? `우리 농장에 ${def.name} 완공!` : `${def.name}을(를) 넓혔어요 · ${def.upgrades?.find((u) => u.tier === tier)?.effect ?? `${tier}단계`}`;
  addNews(life, now, `site:${id}:${tier}`, 'farm', text, helpers);
  if (tier === 1 && def.owner === 'shared') addMemory(life, now, 'farm', helpers, text);
}
/** Greenhouse / mini greenhouse plots of a site record (created on demand). */
const plotsOf = (site: SiteRecord) => (site.state.plots ??= {});
/** A fresh planting by `uid` (the same speed and star bonuses as their own field). */
function newPlot(life: LifeState, uid: string, crop: Crop, now: number): Plot {
  const mods = growthMods(life, uid),
    speed = Math.min(MAX_SPEED, plantSpeed(life, uid, now) + villageGrowSpeed(life) + mods.growSpeed);
  return { crop, plantedAt: now, wateredAt: null, ...(speed ? { speed } : {}), ...(mods.goldPts ? { g: mods.goldPts } : {}) };
}
/** Whether a plot can be watered by hand now (the same rule as my field). */
const thirsty = (p: Plot, now: number) => !!p.crop && p.wateredAt === null && plotRainAt(p, now) === null && now < plotReadyAt(p, now)!;
function waterPlot(life: LifeState, uid: string, p: Plot, now: number) {
  p.wateredAt = now;
  const pts = growthMods(life, uid).waterPts;
  if (pts) p.w = pts;
}
/** What a harvested plot becomes: the next cycle of a regrowing crop, else empty. */
function afterHarvest(p: Plot, now: number): Plot | null {
  const regrow = CROP_INFO[p.crop!].regrow,
    k = (p.n ?? 0) + 1;
  if (!regrow || k >= regrow.harvests) return null;
  return {
    crop: p.crop,
    plantedAt: now,
    wateredAt: null,
    ...(p.fert ? { fert: p.fert } : {}),
    ...(p.speed ? { speed: p.speed } : {}),
    n: k,
    ...(p.g ? { g: p.g } : {}),
    ...(p.w ? { w: p.w } : {}),
  };
}
const harvestXp = (p: Plot, q: Quality) => (XP.harvestBase + Math.min(XP.harvestHourMax, plotGrowMs(p) / HOUR)) * QUALITY_MULT[q];

// ---------------------------------------------------------------- 공동 창고
export const storeCount = (life: LifeState, id: string, q: Quality) => life.farm?.store?.[stockKey(id, q)] ?? 0;
/** Crops of at least quality `q` in the shared store. */
export const storeCountAtLeast = (life: LifeState, id: string, q: Quality = 0) =>
  ([0, 1, 2, 3] as Quality[]).filter((t) => t >= q).reduce<number>((s, t) => s + storeCount(life, id, t), 0);
function storeAdd(life: LifeState, id: string, q: Quality, n: number) {
  const c = commonsOf(life),
    store = (c.store ??= {}),
    key = stockKey(id, q);
  if (n > 0 && !(key in store) && Object.keys(store).length >= STORE_KINDS_MAX) fail(SITE_REJECT.storeFull);
  const next = (store[key] ?? 0) + n;
  if (next < 0) fail(SITE_REJECT.store);
  if (next > 0) store[key] = Math.min(COUNT_MAX, next);
  else delete store[key];
  if (!nonEmpty(store)) delete c.store;
}
/**
 * Takes `n` crops of at least quality `q` from the shared store, lowest first
 * (bundles, the festival fund). Returns how many of each quality it took.
 */
export function takeStore(life: LifeState, id: string, n: number, q: Quality = 0): number[] {
  if (storeCountAtLeast(life, id, q) < n) fail(SITE_REJECT.store);
  const took = [0, 0, 0, 0];
  let left = n;
  for (const t of [0, 1, 2, 3] as Quality[]) {
    if (t < q || !left) continue;
    const take = Math.min(left, storeCount(life, id, t));
    if (!take) continue;
    storeAdd(life, id, t, -take);
    took[t] = take;
    left -= take;
  }
  return took;
}
/** 범 value of crops (base price × quality), what the festival fund counts a store gift as. */
export const storeValue = (id: Crop, q: Quality, n: number) => Math.round(CROP_INFO[id].sell * QUALITY_MULT[q]) * n;

// ---------------------------------------------------------------- 마을 대형 작물
function goalOf(life: LifeState, now: number): CommonGoal {
  const c = commonsOf(life),
    k = seasonKey(kstDay(now));
  if (c.goal?.k !== k) c.goal = { k, n: 0, by: [] };
  return c.goal;
}
const joinGoal = (life: LifeState, actor: number, now: number) => {
  const g = goalOf(life, now);
  if (!g.by.includes(actor)) g.by = [...g.by, actor].sort((a, b) => a - b);
};
/** Whether bed `bed` of the shared field is one giant crop now (all six ripe, planted together; hash roll). */
export function commonGiant(field: Record<string, Plot>, bed: number, now: number): boolean {
  if (!safe(bed) || bed < 0 || bed >= COMMON_BEDS) return false;
  const tiles = commonBedTiles(bed),
    first = field[String(tiles[0])];
  if (!first?.crop || !GIANT_CROPS.includes(first.crop)) return false;
  for (const t of tiles) {
    const p = field[String(t)];
    if (!p || p.crop !== first.crop || p.plantedAt !== first.plantedAt || (p.n ?? 0) > 0 || now < plotReadyAt(p, now)!) return false;
  }
  return hash32(`cgiant:${bed}:${first.plantedAt}`) % 100 < COMMON_GIANT_CHANCE;
}
export const commonGiants = (field: Record<string, Plot>, now: number) =>
  Array.from({ length: COMMON_BEDS }, (_, b) => b).filter((b) => commonGiant(field, b, now));
function goalGiant(life: LifeState, now: number) {
  const g = goalOf(life, now);
  g.n = Math.min(99, g.n + 1);
  if (g.done || g.n < COMMON_GOAL_GIANTS) return;
  g.done = now;
  for (const helper of g.by) {
    const helperUid = uidOf(life, helper);
    if (!helperUid) continue;
    const furn = (((life.ext ??= {})[helperUid] ??= {}).furn ??= {});
    furn['furn-project-plaque'] = Math.min(COUNT_MAX, (furn['furn-project-plaque'] ?? 0) + 1);
    gainXp(life, helperUid, 'farm', COMMON_GOAL_XP, now);
  }
  const text = `공동 밭에서 ${COMMON_GOAL_CROPS[seasonOf(now)]} ${g.n}개! 이번 계절 마을 대형 작물 목표를 이뤘어요`;
  addNews(life, now, `cgoal:${g.k}`, 'farm', text, g.by);
  addMemory(life, now, 'farm', g.by, text);
}

// ---------------------------------------------------------------- the day settle
type DailyCtx = { life: LifeState; id: string; site: SiteRecord; day: number; now: number };
/** Daily hooks by FacilityDef.daily id (later facilities add theirs here). */
const DAILY: Partial<Record<DailyId, (c: DailyCtx) => void>> = {
  // 과일나무 자리: a grown tree bears one fruit a day in its season (up to ORCHARD_PLOT_HOLD).
  orchard: ({ site, day }) => {
    for (const t of Object.values(site.state.trees ?? {})) {
      if (day < kstDay(t.at) + ORCHARD_PLOT_DAYS || SAPLINGS[t.f].season !== seasonOfDay(day)) continue;
      t.n = Math.min(ORCHARD_PLOT_HOLD, (t.n ?? 0) + 1);
    }
  },
};
/**
 * Brings the farm's facilities up to `now`: each built facility's daily hook
 * once per KST day since the last settle (at most SETTLE_BACK_DAYS back; a
 * world's first settle starts today), and the shared field's withering.
 */
export function settleSites(life: LifeState, now: number) {
  const today = kstDay(now),
    farm = commonsOf(life);
  farm.gm ??= now;
  if (farm.d === undefined || farm.d > today) farm.d = today;
  for (let day = Math.max(farm.d + 1, today - SETTLE_BACK_DAYS); day <= today; day++) {
    for (const [id, site] of Object.entries(farm.sites ?? {})) {
      const hook = FACILITY_BY_ID[site.kind].daily;
      if (site.tier >= 1 && hook) DAILY[hook]?.({ life, id, site, day, now });
    }
  }
  farm.d = today;
  // The shared field is outside: seasonal crops wither like on a field.
  for (const [t, p] of Object.entries(farm.field ?? {})) {
    const w = witherAt(p, false);
    if (w !== null && now >= w) farm.field![t] = { crop: null, plantedAt: 0, wateredAt: null, dead: p.crop! };
  }
}
/** A copy of `life` whose facilities are settled to `now` (views never write). */
export function projectSites(life: LifeState, now: number): LifeState {
  if (!life.farm) return life;
  const out: LifeState = { ...life, farm: structuredClone(life.farm) };
  settleSites(out, now);
  return out;
}

// ---------------------------------------------------------------- actions
const tileIn = (tile: unknown, n: number) => (safe(tile) && tile >= 0 && tile < n ? tile : fail(SITE_REJECT.tile));
const allOr = (tile: unknown, n: number) => (tile === -1 ? Array.from({ length: n }, (_, i) => i) : [tileIn(tile, n)]);
/** A built facility on site `id` (tier ≥ 1) of one of `kinds`. */
function builtSite(life: LifeState, id: unknown, kinds: readonly FacilityId[]) {
  if (typeof id !== 'string' || !siteSize(id)) fail(SITE_REJECT.site);
  const site = siteOf(life, id as string);
  if (!site) fail(SITE_REJECT.noSite);
  if (site!.tier < 1) fail(SITE_REJECT.building);
  if (!kinds.includes(site!.kind)) fail(SITE_REJECT.kind);
  return site!;
}
export function siteAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: SiteAction,
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  const uid = member.id,
    actor = member.actor,
    bag = life.bag[uid];
  let next = ledger;
  const spend = (amount: number, reason: string) => {
    if ((next.accounts[walletOf(uid)] ?? 0) < amount) fail(LIFE_REJECT.balance);
    next = spendBeom(next, walletOf(uid), amount, `life-${reason}-${uid}-${++life.seq}`, now, reason);
  };
  const mine = (site: SiteRecord) => site.owner === 'shared' || site.owner === uid || fail(SITE_REJECT.notMine);
  switch (a.kind) {
    case 'siteBuild': {
      const why = siteBuildBlock(life, uid, actor, a.site, a.facility);
      if (why) fail(why);
      const def = FACILITY_BY_ID[a.facility];
      const sites = (commonsOf(life).sites ??= {});
      if (def.owner === 'personal') {
        if ((ledger.accounts[walletOf(uid)] ?? 0) < def.build.beom) fail(LIFE_REJECT.balance);
        payMats(life, uid, def.build.mats);
        if (def.build.beom) spend(def.build.beom, 'site-' + def.id);
        const site: SiteRecord = { kind: def.id, tier: 0, owner: uid, state: {} };
        for (const [id, n] of Object.entries(def.build.mats)) notePaid(site, actor, id, n);
        sites[a.site] = site;
        finishTier(life, a.site, site, 1, [actor], now);
      } else {
        sites[a.site] = { kind: def.id, tier: 0, owner: 'shared', state: {}, fund: { to: 1, got: 0, mat: {}, by: {} } };
        addNews(life, now, `sitego:${a.site}`, 'farm', `${josaGa(nameOf(actor))} 우리 농장에 ${josaUl(def.name)} 짓자고 했어요. 범과 재료를 보태 주세요`, [actor]);
      }
      break;
    }
    case 'siteGive': {
      if (typeof a.site !== 'string' || !siteSize(a.site)) fail(SITE_REJECT.site);
      const site = siteOf(life, a.site);
      if (!site) fail(SITE_REJECT.noSite);
      const f = site!.fund;
      if (!f) fail(SITE_REJECT.noFund);
      const def = FACILITY_BY_ID[site!.kind],
        cost = tierCost(def, f!.to)!;
      if (a.item !== undefined) {
        if (typeof a.item !== 'string' || !own(cost.mats, a.item)) fail(SITE_REJECT.giveItem);
        const left = cost.mats[a.item!] - (f!.mat[a.item!] ?? 0);
        if (left <= 0) fail(SITE_REJECT.slotFull);
        if (!safe(a.n) || a.n! < 1) fail(LIFE_REJECT.invalid);
        const n = Math.min(a.n!, left);
        if (invCount(life, uid, a.item!) < n) fail(LIFE_REJECT.notEnough);
        addInv(life, uid, a.item!, -n);
        f!.mat[a.item!] = (f!.mat[a.item!] ?? 0) + n;
        notePaid(site!, actor, a.item!, n);
      } else {
        const left = cost.beom - f!.got;
        if (left <= 0) fail(SITE_REJECT.slotFull);
        if (!safe(a.beom) || a.beom! < Math.min(SITE_MIN_BEOM, left)) fail(SITE_REJECT.give);
        const amount = Math.min(a.beom!, left);
        spend(amount, 'site');
        f!.got += amount;
      }
      f!.by[String(actor)] = Math.min(COUNT_MAX, (f!.by[String(actor)] ?? 0) + 1);
      addNews(life, now, `sitegive:${a.site}:${actor}`, 'farm', `${josaGa(nameOf(actor))} 농장 ${def.name} 공사에 힘을 보탰어요`, [actor]);
      if (fundFull(def, f!)) finishTier(life, a.site, site!, f!.to, Object.keys(f!.by).map(Number), now);
      break;
    }
    case 'siteUpgrade': {
      if (typeof a.site !== 'string' || !siteSize(a.site)) fail(SITE_REJECT.site);
      const site = siteOf(life, a.site);
      if (!site) fail(SITE_REJECT.noSite);
      if (site!.tier < 1) fail(SITE_REJECT.building);
      mine(site!);
      const def = FACILITY_BY_ID[site!.kind],
        to = site!.tier + 1,
        cost = tierCost(def, to);
      if (!cost) fail(SITE_REJECT.maxTier);
      if (site!.fund) fail(SITE_REJECT.upgrading);
      if (def.owner === 'personal') {
        if ((ledger.accounts[walletOf(uid)] ?? 0) < cost!.beom) fail(LIFE_REJECT.balance);
        payMats(life, uid, cost!.mats);
        if (cost!.beom) spend(cost!.beom, 'site-' + def.id);
        for (const [id, n] of Object.entries(cost!.mats)) notePaid(site!, actor, id, n);
        finishTier(life, a.site, site!, to, [actor], now);
      } else {
        site!.fund = { to, got: 0, mat: {}, by: {} };
        addNews(life, now, `siteup:${a.site}:${to}`, 'farm', `${josaGa(nameOf(actor))} 농장 ${def.name}을(를) 넓히자고 했어요`, [actor]);
      }
      break;
    }
    case 'siteDemolish': {
      if (typeof a.site !== 'string' || !siteSize(a.site)) fail(SITE_REJECT.site);
      const site = siteOf(life, a.site);
      if (!site) fail(SITE_REJECT.noSite);
      mine(site!);
      const def = FACILITY_BY_ID[site!.kind];
      const f = site!.fund;
      if (f && (f.got > 0 || nonEmpty(f.mat))) fail(SITE_REJECT.funded);
      if (Object.values(site!.state.plots ?? {}).some((p) => p.crop)) fail(SITE_REJECT.growing);
      if (site!.kind === 'machineYard' && site!.tier >= 1 && Object.values(life.farmx ?? {}).some((x) => Object.keys(x.mach ?? {}).some((k) => Number(k) >= BASE_WORK_SLOTS)))
        fail(SITE_REJECT.machines);
      // Half of the materials go back to whoever paid them (범 stays spent).
      for (const [a2, mats] of Object.entries(site!.paid ?? {})) {
        const payer = uidOf(life, Number(a2));
        if (!payer) continue;
        for (const [id, n] of Object.entries(mats)) {
          const back = Math.floor(n * DEMOLISH_REFUND);
          if (back > 0) addInv(life, payer, id, back);
        }
      }
      delete commonsOf(life).sites![a.site];
      if (!nonEmpty(commonsOf(life).sites!)) delete commonsOf(life).sites;
      if (site!.tier >= 1) addNews(life, now, `sitedown:${a.site}:${now}`, 'farm', `${josaGa(nameOf(actor))} 농장 ${josaUl(def.name)} 헐었어요`, [actor]);
      break;
    }
    case 'sitePlant': {
      const site = builtSite(life, a.site, ['greenhouse', 'greenhouseMini']);
      mine(site);
      if (!isCrop(a.crop)) fail(LIFE_REJECT.invalid);
      const def = FACILITY_BY_ID[site.kind],
        n = slotsAt(def, site.tier),
        plots = plotsOf(site),
        shared = site.kind === 'greenhouse' && a.shared === true;
      const myCount = () => Object.values(plots).filter((p) => p.crop && p.o === actor).length;
      const tiles = allOr(a.tile, n).filter((t) => !plots[String(t)]?.crop);
      if (!tiles.length) fail(a.tile === -1 ? LIFE_REJECT.noEmpty : SITE_REJECT.tileBusy);
      if (bag.seeds[a.crop] < 1) fail(LIFE_REJECT.noSeed);
      let planted = 0;
      for (const t of tiles) {
        if (bag.seeds[a.crop] < 1) break;
        if (site.kind === 'greenhouse' && !shared && myCount() >= GREENHOUSE_PER_FRIEND) {
          if (!planted && a.tile !== -1) fail(SITE_REJECT.myTiles);
          break;
        }
        bag.seeds[a.crop] -= 1;
        const p: SitePlot = newPlot(life, uid, a.crop, now);
        if (site.kind === 'greenhouse' && !shared) p.o = actor;
        plots[String(t)] = p;
        planted++;
      }
      if (!planted) fail(SITE_REJECT.myTiles);
      break;
    }
    case 'siteWater': {
      const site = builtSite(life, a.site, ['greenhouse', 'greenhouseMini']);
      mine(site);
      const n = slotsAt(FACILITY_BY_ID[site.kind], site.tier),
        plots = plotsOf(site);
      let watered = 0;
      for (const t of allOr(a.tile, n)) {
        const p = plots[String(t)];
        if (!p || !thirsty(p, now)) {
          if (a.tile !== -1) fail(!p?.crop ? LIFE_REJECT.empty : p.wateredAt !== null ? LIFE_REJECT.watered : now >= plotReadyAt(p, now)! ? LIFE_REJECT.grown : LIFE_REJECT.rained);
          continue;
        }
        waterPlot(life, uid, p, now);
        watered++;
      }
      if (!watered) fail(LIFE_REJECT.nothingToWater);
      bump(life, uid, 'water', watered);
      gainXp(life, uid, 'farm', XP.water * watered, now);
      break;
    }
    case 'siteHarvest': {
      const site = builtSite(life, a.site, ['greenhouse', 'greenhouseMini']);
      mine(site);
      const n = slotsAt(FACILITY_BY_ID[site.kind], site.tier),
        plots = plotsOf(site),
        seedOf = SITE_IDS.indexOf(a.site);
      let got = 0;
      for (const t of allOr(a.tile, n)) {
        const p = plots[String(t)];
        const ownerActor = site.kind === 'greenhouse' ? p?.o : actor;
        if (!p?.crop || now < plotReadyAt(p, now)!) {
          if (a.tile !== -1) fail(p?.crop ? LIFE_REJECT.notReady : LIFE_REJECT.empty);
          continue;
        }
        if (ownerActor !== undefined && ownerActor !== actor) {
          if (a.tile !== -1) fail(SITE_REJECT.notYours);
          continue;
        }
        const crop = p.crop,
          q = plotQuality(ownerActor === undefined ? 'farm-common' : uid, 1000 + seedOf * 40 + t, p);
        if (ownerActor === undefined) storeAdd(life, crop, q, 1);
        else {
          addCropQ(life, uid, crop, q, 1);
          discover(life, uid, crop);
          if (q >= 2) bump(life, uid, 'gold', 1);
        }
        bump(life, uid, 'harvest', 1);
        gainXp(life, uid, 'farm', harvestXp(p, q), now);
        const again = afterHarvest(p, now);
        if (again) plots[String(t)] = ownerActor === undefined ? again : { ...again, o: ownerActor };
        else delete plots[String(t)];
        got++;
      }
      if (!got) fail(LIFE_REJECT.nothingReady);
      if (!nonEmpty(plots)) delete site.state.plots;
      break;
    }
    case 'siteTree': {
      const site = builtSite(life, a.site, ['orchardPlot']);
      if (site.owner !== uid) fail(SITE_REJECT.notMine);
      const slots = slotsAt(FACILITY_BY_ID.orchardPlot, site.tier);
      if (!safe(a.slot) || a.slot < 0 || a.slot >= slots) fail(SITE_REJECT.tile);
      const trees = (site.state.trees ??= {}),
        key = String(a.slot);
      if (a.clear === true) {
        if (!trees[key]) fail(SITE_REJECT.noTree);
        delete trees[key];
      } else {
        if (!(FRUIT_TREE_KINDS as readonly unknown[]).includes(a.tree)) fail(SITE_REJECT.tree);
        if (trees[key]) fail(SITE_REJECT.treeBusy);
        spend(SAPLINGS[a.tree!].price, 'sapling');
        trees[key] = { f: a.tree!, at: now };
      }
      if (!nonEmpty(trees)) delete site.state.trees;
      break;
    }
    case 'siteFruit': {
      const site = builtSite(life, a.site, ['orchardPlot']);
      if (site.owner !== uid) fail(SITE_REJECT.notMine);
      let got = 0;
      for (const t of Object.values(site.state.trees ?? {})) {
        if (!t.n) continue;
        addInv(life, uid, t.f, t.n);
        got += t.n;
        delete t.n;
      }
      if (!got) fail(SITE_REJECT.noFruit);
      gainXp(life, uid, 'forage', 4 * got, now);
      break;
    }
    case 'commonTill': {
      const c = commonsOf(life),
        till = new Set(c.till ?? []);
      const tiles = allOr(a.tile, COMMON_TILES).filter((t) => !till.has(t));
      if (!tiles.length) fail(SITE_REJECT.tilled);
      for (const t of tiles) {
        till.add(t);
        // Tilling clears a withered plant.
        if (c.field?.[String(t)]?.dead) delete c.field[String(t)];
      }
      c.till = [...till].sort((x, y) => x - y);
      gainXp(life, uid, 'farm', XP.water * tiles.length, now);
      joinGoal(life, actor, now);
      break;
    }
    case 'commonPlant': {
      if (!isCrop(a.crop)) fail(LIFE_REJECT.invalid);
      if (!cropInSeason(a.crop, seasonOf(now))) fail(`지금은 ${CROP_INFO[a.crop].name} 철이 아니라 심을 수 없어요.`);
      const c = commonsOf(life),
        field = (c.field ??= {}),
        till = new Set(c.till ?? []);
      const tiles = allOr(a.tile, COMMON_TILES).filter((t) => !field[String(t)]?.crop);
      if (!tiles.length) fail(a.tile === -1 ? LIFE_REJECT.noEmpty : SITE_REJECT.tileBusy);
      if (a.tile !== -1 && !till.has(tiles[0])) fail(SITE_REJECT.untilled);
      if (bag.seeds[a.crop] < 1) fail(LIFE_REJECT.noSeed);
      let planted = 0;
      for (const t of tiles) {
        if (bag.seeds[a.crop] < 1) break;
        if (!till.has(t)) continue;
        bag.seeds[a.crop] -= 1;
        field[String(t)] = newPlot(life, uid, a.crop, now);
        planted++;
      }
      if (!planted) fail(SITE_REJECT.untilled);
      joinGoal(life, actor, now);
      break;
    }
    case 'commonWater': {
      const field = life.farm?.field ?? {};
      let watered = 0;
      for (const t of allOr(a.tile, COMMON_TILES)) {
        const p = field[String(t)];
        if (!p || !thirsty(p, now)) {
          if (a.tile !== -1) fail(!p?.crop ? LIFE_REJECT.empty : p.wateredAt !== null ? LIFE_REJECT.watered : now >= plotReadyAt(p, now)! ? LIFE_REJECT.grown : LIFE_REJECT.rained);
          continue;
        }
        waterPlot(life, uid, p, now);
        watered++;
      }
      if (!watered) fail(LIFE_REJECT.nothingToWater);
      bump(life, uid, 'water', watered);
      gainXp(life, uid, 'farm', XP.water * watered, now);
      joinGoal(life, actor, now);
      break;
    }
    case 'commonHarvest': {
      const c = commonsOf(life),
        field = c.field ?? {},
        giants = commonGiants(field, now);
      let targets = allOr(a.tile, COMMON_TILES);
      // A tile of a giant bed harvests the whole bed.
      if (a.tile !== -1 && giants.includes(commonTileBed(targets[0]))) targets = commonBedTiles(commonTileBed(targets[0]));
      let got = 0;
      const giantDone = new Set<number>();
      for (const t of targets) {
        const p = field[String(t)];
        if (!p?.crop || now < plotReadyAt(p, now)!) {
          if (a.tile !== -1 && targets.length === 1) fail(p?.crop ? LIFE_REJECT.notReady : LIFE_REJECT.empty);
          continue;
        }
        const bed = commonTileBed(t),
          giant = giants.includes(bed),
          q = plotQuality('farm-common', 2000 + t, p),
          n = giant ? GIANT_YIELD : 1;
        storeAdd(life, p.crop, q, n);
        bump(life, uid, 'harvest', n);
        gainXp(life, uid, 'farm', harvestXp(p, q), now);
        if (giant && !giantDone.has(bed)) {
          giantDone.add(bed);
          joinGoal(life, actor, now);
          goalGiant(life, now);
          addNews(life, now, `cgiant:${bed}:${p.plantedAt}`, 'farm', `${josaGa(nameOf(actor))} 공동 밭에서 대형 ${stockName(p.crop)}을(를) 거뒀어요`, [actor]);
        }
        const again = afterHarvest(p, now);
        if (again) field[String(t)] = again;
        else delete field[String(t)];
        got++;
      }
      if (!got) fail(LIFE_REJECT.nothingReady);
      joinGoal(life, actor, now);
      if (!nonEmpty(field)) delete c.field;
      break;
    }
  }
  return { life, ledger: next };
}

// ---------------------------------------------------------------- views
/** A plot as the panels and the scene draw it (short keys: the view is sent often). */
export type SitePlotView = {
  t: number;
  c: Crop | null;
  /** Growth stage 0–4. */
  g: number;
  /** Ready now. */
  r?: 1;
  /** Wet (watered by hand or rain). */
  w?: 1;
  /** When it is ready (growing plots). */
  at?: number;
  /** Greenhouse: the friend growing it (absent: shared). */
  o?: number;
  /** A withered plant still showing. */
  d?: Crop;
};
export type SiteView = {
  id: string;
  k: FacilityId;
  t: number;
  /** Owner actor of a personal facility. */
  o?: number;
  fund?: { to: number; got: number; mat: Record<string, number>; by: number[] };
  p?: SitePlotView[];
  tr?: { s: number; f: FruitTreeKind; at: number; n: number; from: number }[];
};
export type FarmSitesView = {
  sites: SiteView[];
  field: { till: number[]; p: SitePlotView[]; giants: number[] };
  store: { id: string; q: Quality; n: number }[];
  goal: { n: number; need: number; by: number[]; done?: number; crop: string };
  /** My machine slots (the machine yard's tier). */
  slots: number;
};
function plotView(t: number, p: SitePlot, now: number): SitePlotView {
  if (!p.crop) return { t, c: null, g: 0, ...(p.dead ? { d: p.dead } : {}) };
  const ready = plotReadyAt(p, now)!;
  return {
    t,
    c: p.crop,
    g: growthStage(p, now),
    ...(now >= ready ? { r: 1 as const } : { at: ready }),
    ...(plotWateredAt(p, now) !== null ? { w: 1 as const } : {}),
    ...(p.o !== undefined ? { o: p.o } : {}),
  };
}
/** The farm's facilities for everyone (one copy, small); null when the farm has none yet. */
export function farmSitesView(life: LifeState, now: number): FarmSitesView | undefined {
  const c = life.farm;
  if (!c?.sites && !c?.field && !c?.till && !c?.store && !c?.goal) return undefined;
  const k = seasonKey(kstDay(now)),
    goal = c.goal?.k === k ? c.goal : null;
  return {
    sites: Object.entries(c.sites ?? {}).map(([id, s]): SiteView => {
      const ownerActor = s.owner === 'shared' ? undefined : life.actors[s.owner];
      return {
        id,
        k: s.kind,
        t: s.tier,
        ...(ownerActor !== undefined ? { o: ownerActor } : {}),
        ...(s.fund ? { fund: { to: s.fund.to, got: s.fund.got, mat: { ...s.fund.mat }, by: Object.keys(s.fund.by).map(Number).sort((a, b) => a - b) } } : {}),
        ...(s.state.plots ? { p: Object.entries(s.state.plots).map(([t, p]) => plotView(Number(t), p, now)) } : {}),
        ...(s.state.trees
          ? { tr: Object.entries(s.state.trees).map(([slot, t]) => ({ s: Number(slot), f: t.f, at: t.at, n: t.n ?? 0, from: kstDay(t.at) + ORCHARD_PLOT_DAYS })) }
          : {}),
      };
    }),
    field: {
      till: [...(c.till ?? [])],
      p: Object.entries(c.field ?? {}).map(([t, p]) => plotView(Number(t), p, now)),
      giants: commonGiants(c.field ?? {}, now),
    },
    store: Object.entries(c.store ?? {}).flatMap(([key, n]) => {
      const s = parseStock(key);
      return s ? [{ id: s.id, q: s.q, n }] : [];
    }),
    goal: { n: goal?.n ?? 0, need: COMMON_GOAL_GIANTS, by: [...(goal?.by ?? [])], ...(goal?.done ? { done: goal.done } : {}), crop: COMMON_GOAL_CROPS[seasonOf(now)] },
    slots: workSlots(life),
  };
}
/** Quality-checked store gift for the festival fund / bundles (an action's item + quality). */
export function storeStock(item: unknown, q: unknown): { id: Crop; q: Quality } {
  const quality = q === undefined ? 0 : q;
  if (!isCrop(item) || !isQuality(quality)) fail(SITE_REJECT.store);
  return { id: item as Crop, q: quality as Quality };
}
