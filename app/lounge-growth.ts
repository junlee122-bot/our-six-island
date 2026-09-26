// 성장 engine (tech tree P1): personal skills (XP, levels, daily cap, rested
// XP, catch-up, retro XP, professions, respec), the blacksmith (drop a tool off,
// pick it up at 06:00 KST the next day, keep using the old one meanwhile), the
// shared 마을 개척 research (범 + materials, three different helpers, relaxed
// after seven days, finishes at the next 06:00 KST) and the daily material
// nodes at the village edge (bushes, logs, rocks → wood, stone, copper).
//
// Pure and `now`-injected like lounge-life.ts; state lives in `world.life.growth`
// (bounded: fixed keys per friend, ≤ 9 research entries). Every 범 goes through
// spendBeom (the ledger invariant holds). Random rolls are hashes of the
// friend, the life sequence and the clock, like the rest of the life engine.
//
// Cycle-safe: lounge-life.ts and lounge-life-plus.ts import this module and it
// imports them back, so their bindings are only used inside functions.
import { spendBeom, kstDay, type LoungeLedger } from './lounge-economy.ts';
import { ACTOR_NAMES, dayStart, hash32 } from './lounge-calendar.ts';
import { ITEM_BY_ID } from './lounge-items.ts';
import {
  AXE_TIER_MULT,
  AXE_TIER_WOOD,
  CATCH_UP,
  COPPER_CHANCE,
  FIRST_TOOL_ROCKS,
  FORGE_READY_HOUR,
  HOE_TIER_PTS,
  LEVEL_PERKS,
  LEVEL_XP,
  MAX_LEVEL,
  NODES_PER_DAY,
  NODE_BY_ID,
  NODE_INFO,
  NODE_SPOTS,
  NODE_YIELD,
  NO_MODS,
  OVER_CAP_RATE,
  PICK_TIER_COPPER,
  PROF_BY_ID,
  RESEARCH,
  RESEARCH_BY_ID,
  RESEARCH_HELPERS,
  RESEARCH_MIN_BEOM,
  RESEARCH_RELAX_DAYS,
  RESPEC_PRICE,
  REST_MAX,
  REST_PER_DAY,
  RETRO_LEVEL,
  RETRO_PER,
  ROD_FORGE_FROM,
  SENIOR_GAP,
  SKILLS,
  SKILL_INFO,
  SOFT_CAP,
  TIER_NAME,
  TOOLS,
  TOOL_COST,
  TOOL_INFO,
  WATER_TIER_PTS,
  XP,
  addMods,
  isProfId,
  levelOf,
  profChoices,
  type GrowthMods,
  type NodeKind,
  type SkillId,
  type ToolId,
} from './lounge-growth-data.ts';
import { LIFE_REJECT, LifeError, uidOf, type LifeState } from './lounge-life.ts';
import { addInv, addMemory, addNews, invCount } from './lounge-life-plus.ts';

const DAY = 86_400_000,
  HOUR = 3_600_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UPS_MAX = 8;
const UPS_KEEP_MS = 3 * DAY;
const XP_MAX = 1_000_000;

// ---------------------------------------------------------------- types
export type GrowthUser = {
  /** Lifetime XP per skill (tenths precision). */
  xp?: Partial<Record<SkillId, number>>;
  /** KST day of the daily fields (dxp, nodes). */
  day?: number;
  /** XP counted toward today's soft cap per skill (before rest). */
  dxp?: Partial<Record<SkillId, number>>;
  /** Material nodes broken today. */
  nodes?: string[];
  /** Rested XP left per skill. */
  rest?: Partial<Record<SkillId, number>>;
  /** Last KST day with any life action (rested XP). */
  seen?: number;
  /** When retro XP from lifetime stats was applied (once). */
  retro?: number;
  /** Chosen professions (≤ 2 per skill). */
  prof?: string[];
  /** Tool tiers 2–5 (absent = 1; the rod's 2–3 live in ext.rod). */
  tools?: Partial<Record<ToolId, number>>;
  /** The tool at the forge. */
  forge?: { tool: ToolId; to: number; at: number; readyAt: number };
  /** Village rocks broken (촌장 편지 "첫 도구"). */
  rocks?: number;
  /** The first-tool gift was claimed. */
  gift?: boolean;
  /** Recent level-ups (banner + notifications), newest last. */
  ups?: { s: SkillId; lv: number; at: number }[];
};
export type ResearchState = {
  got: number;
  mat: Record<string, number>;
  /** Contributions per actor ('0'…'6'). */
  by: Record<string, number>;
  start: number;
  fullAt?: number;
  doneAt?: number;
};
export type GrowthState = { u?: Record<string, GrowthUser>; r?: Record<string, ResearchState> };
export type GrowthExt = { growth?: GrowthState };
export type GrowthAction =
  | { kind: 'chooseProf'; skill: SkillId; prof: string }
  | { kind: 'respec'; skill: SkillId }
  | { kind: 'forge'; tool: ToolId }
  | { kind: 'forgePickup' }
  | { kind: 'forgeGift' }
  | { kind: 'research'; project: string; beom?: number; item?: string; n?: number }
  | { kind: 'chop'; node: string }
  | { kind: 'smash'; node: string };

export const GROWTH_REJECT = {
  skill: '기술을 확인해 주세요.',
  prof: '전문가를 확인해 주세요.',
  profLevel: '아직 고를 수 있는 레벨이 아니에요.',
  profTaken: '이미 고른 전문가예요. 다시 고르려면 망설임 석상에서 바꿔 주세요.',
  profParent: '먼저 고른 전문가 아래에서만 고를 수 있어요.',
  noProf: '아직 고른 전문가가 없어요.',
  tool: '도구를 확인해 주세요.',
  forgeClosed: '대장간은 마을 개척 “대장간 재건”이 끝나면 열려요.',
  forgeBusy: '이미 맡긴 도구가 있어요. 찾아간 뒤에 다른 도구를 맡겨 주세요.',
  forgeNone: '맡긴 도구가 없어요.',
  forgeWait: '아직 두드리는 중이에요. 내일 아침 6시에 찾으러 와요.',
  toolMax: '이미 가장 좋은 도구예요.',
  rodShop: '낚싯대 2·3단계는 낚시 도구함에서 바로 바꿀 수 있어요.',
  rodLater: '낚싯대 4단계는 “여섯섬 항로”가 열리면 두드릴 수 있어요.',
  materials: '재료가 부족해요.',
  gift: '아직 받을 수 있는 선물이 아니에요.',
  gifted: '이미 받은 선물이에요.',
  project: '마을 개척을 확인해 주세요.',
  projectSoon: '이 개척지는 다음 업데이트에서 열려요. 지금은 미리 보기만 할 수 있어요.',
  projectLocked: '먼저 앞 단계 개척을 마쳐야 해요.',
  projectFull: '다 모였어요. 완공을 기다려요.',
  projectDone: '이미 완공된 개척이에요.',
  give: '보탤 양을 확인해 주세요.',
  giveItem: '이 개척에 필요 없는 재료예요.',
  slotFull: '이 재료는 다 모였어요.',
  reserved: '남은 범은 아직 보태지 않은 친구 몫이에요. 재료를 보태거나 친구를 기다려 주세요.',
  node: '여기에는 오늘 벨 것이 없어요.',
  nodeTaken: '오늘은 이미 여기서 거뒀어요. 내일 다시 자라요.',
} as const;
function fail(message: string): never {
  throw new LifeError(message);
}

// ---------------------------------------------------------------- reading
const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const num = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const isSkill = (s: unknown): s is SkillId => typeof s === 'string' && (SKILLS as readonly string[]).includes(s);
const isTool = (t: unknown): t is ToolId => typeof t === 'string' && (TOOLS as readonly string[]).includes(t);
const tenth = (n: number) => Math.round(n * 10) / 10;
function skillMap(v: unknown, max: number): Partial<Record<SkillId, number>> | undefined {
  const out: Partial<Record<SkillId, number>> = {};
  for (const s of SKILLS) {
    const n = obj(v)[s];
    if (num(n) && n > 0) out[s] = Math.min(max, tenth(n));
  }
  return Object.keys(out).length ? out : undefined;
}
function readUser(v: unknown): GrowthUser | undefined {
  const x = obj(v),
    out: GrowthUser = {};
  const xp = skillMap(x.xp, XP_MAX);
  if (xp) out.xp = xp;
  if (safe(x.day) && x.day > 0) {
    out.day = x.day;
    const dxp = skillMap(x.dxp, XP_MAX);
    if (dxp) out.dxp = dxp;
    if (Array.isArray(x.nodes)) {
      const nodes = [...new Set(x.nodes.filter((n): n is string => typeof n === 'string' && own(NODE_BY_ID, n)))];
      if (nodes.length) out.nodes = nodes.slice(0, NODE_SPOTS.length);
    }
  }
  const rest = skillMap(x.rest, REST_MAX);
  if (rest) out.rest = rest;
  if (safe(x.seen) && x.seen > 0) out.seen = x.seen;
  if (safe(x.retro) && x.retro > 0) out.retro = x.retro;
  if (Array.isArray(x.prof)) {
    const prof: string[] = [];
    for (const id of x.prof) {
      if (!isProfId(id) || prof.includes(id)) continue;
      const def = PROF_BY_ID[id];
      const mine = prof.filter((p) => PROF_BY_ID[p].skill === def.skill);
      if (def.level === 5 ? mine.length === 0 : mine.length === 1 && mine[0] === def.parent) prof.push(id);
    }
    if (prof.length) out.prof = prof;
  }
  const tools: Partial<Record<ToolId, number>> = {};
  for (const t of TOOLS) {
    const n = obj(x.tools)[t];
    if (safe(n) && n >= 2 && n <= 5) tools[t] = n;
  }
  if (Object.keys(tools).length) out.tools = tools;
  const f = obj(x.forge);
  if (isTool(f.tool) && safe(f.to) && f.to >= 2 && f.to <= 5 && safe(f.at) && safe(f.readyAt))
    out.forge = { tool: f.tool, to: f.to, at: f.at, readyAt: f.readyAt };
  if (safe(x.rocks) && x.rocks > 0) out.rocks = Math.min(1_000_000, x.rocks);
  if (x.gift === true) out.gift = true;
  if (Array.isArray(x.ups)) {
    const ups = x.ups
      .slice(-UPS_MAX)
      .map((u) => obj(u))
      .filter((u) => isSkill(u.s) && safe(u.lv) && u.lv >= 2 && u.lv <= MAX_LEVEL && safe(u.at))
      .map((u) => ({ s: u.s as SkillId, lv: u.lv as number, at: u.at as number }));
    if (ups.length) out.ups = ups;
  }
  return Object.keys(out).length ? out : undefined;
}
function readResearch(def: (typeof RESEARCH)[number], v: unknown): ResearchState | undefined {
  const x = obj(v);
  if (!safe(x.start) || x.start <= 0) return;
  const mat: Record<string, number> = {};
  for (const [id, need] of Object.entries(def.mats)) {
    const n = obj(x.mat)[id];
    if (safe(n) && n > 0) mat[id] = Math.min(need, n);
  }
  const by: Record<string, number> = {};
  for (const [a, n] of Object.entries(obj(x.by))) if (/^[0-6]$/.test(a) && safe(n) && n > 0) by[a] = Math.min(1_000_000, n);
  const out: ResearchState = { got: safe(x.got) && x.got > 0 ? Math.min(def.beom, x.got) : 0, mat, by, start: x.start };
  if (safe(x.fullAt) && x.fullAt > 0) out.fullAt = x.fullAt;
  if (safe(x.doneAt) && x.doneAt > 0) out.doneAt = x.doneAt;
  return out;
}
/** Normalizes `world.life.growth` (absent in older worlds → omitted). */
export function readGrowth(value: unknown): GrowthExt {
  const v = obj(value);
  const u: Record<string, GrowthUser> = {};
  for (const [uid, x] of Object.entries(obj(v.u)).slice(0, 32)) {
    if (!UUID.test(uid) || Object.keys(u).length >= 16) continue;
    const g = readUser(x);
    if (g) u[uid] = g;
  }
  const r: Record<string, ResearchState> = {};
  for (const def of RESEARCH) {
    const s = readResearch(def, obj(v.r)[def.id]);
    if (s) r[def.id] = s;
  }
  const out: GrowthState = {};
  if (Object.keys(u).length) out.u = u;
  if (Object.keys(r).length) out.r = r;
  return Object.keys(out).length ? { growth: out } : {};
}

// ---------------------------------------------------------------- helpers
const nameOf = (actor: number) => ACTOR_NAMES[actor] ?? '친구';
const josaGa = (name: string) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 ? '이' : '가');
};
const josaUl = (name: string) => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return name + (code >= 0 && code <= 11171 && code % 28 ? '을' : '를');
};
const growthOf = (life: LifeState): GrowthState => (life.growth ??= {});
const rawUser = (life: LifeState, uid: string): GrowthUser | undefined => life.growth?.u?.[uid];
const userOf = (life: LifeState, uid: string): GrowthUser => ((growthOf(life).u ??= {})[uid] ??= {});
export const skillXp = (life: LifeState, uid: string, skill: SkillId) => rawUser(life, uid)?.xp?.[skill] ?? 0;
export const skillLevel = (life: LifeState, uid: string, skill: SkillId) => levelOf(skillXp(life, uid, skill));
/** 06:00 KST of the next calendar day (tool pickup). */
export const forgeReadyAt = (now: number) => dayStart(kstDay(now) + 1) + FORGE_READY_HOUR * HOUR;
/** The next 06:00 KST after `now` (research completion). */
export function nextSixAm(now: number) {
  const today = dayStart(kstDay(now)) + FORGE_READY_HOUR * HOUR;
  return today > now ? today : today + DAY;
}
/** Deterministic 0–99 roll. */
const roll = (key: string) => hash32(key) % 100;

/**
 * The friend's growth record with the daily fields reset for today's KST day,
 * rested XP accrued for days away and retro XP applied once.
 */
function userToday(life: LifeState, uid: string, now: number): GrowthUser {
  const u = userOf(life, uid),
    day = kstDay(now);
  if (u.retro === undefined) {
    const stats = life.ext?.[uid]?.stats ?? {};
    const cap = LEVEL_XP[RETRO_LEVEL - 1];
    const from = (keys: string[]) => keys.reduce((s, k) => s + (stats[k as keyof typeof stats] ?? 0) * (RETRO_PER[k] ?? 0), 0);
    const retro: Partial<Record<SkillId, number>> = {
      farm: from(['harvest']),
      fish: from(['fish']),
      forage: from(['forage', 'bug']),
      craft: from(['cook', 'craft']),
    };
    for (const s of SKILLS) {
      const add = Math.min(cap, retro[s] ?? 0);
      if (add > (u.xp?.[s] ?? 0)) (u.xp ??= {})[s] = add;
    }
    u.retro = now;
  }
  if (u.day !== day) {
    u.day = day;
    delete u.dxp;
    delete u.nodes;
  }
  if (u.seen !== undefined && day > u.seen + 1) {
    const away = Math.min(REST_MAX / REST_PER_DAY, day - u.seen - 1);
    for (const s of SKILLS) {
      const rest = Math.min(REST_MAX, (u.rest?.[s] ?? 0) + away * REST_PER_DAY);
      (u.rest ??= {})[s] = rest;
    }
  }
  u.seen = day;
  if (u.ups) {
    u.ups = u.ups.filter((x) => now - x.at < UPS_KEEP_MS);
    if (!u.ups.length) delete u.ups;
  }
  return u;
}

/** Levels of every registered friend in a skill (median for catch-up). */
export function villageMedian(life: LifeState, skill: SkillId) {
  const levels = Object.keys(life.actors)
    .map((uid) => skillLevel(life, uid, skill))
    .sort((a, b) => a - b);
  return levels.length ? levels[(levels.length - 1) >> 1] : 1;
}
export const behindVillage = (life: LifeState, uid: string, skill: SkillId) => skillLevel(life, uid, skill) < villageMedian(life, skill);

/**
 * Adds XP from a life action: ×CATCH_UP when behind the village median, the
 * daily soft cap (SOFT_CAP in full, the rest at OVER_CAP_RATE), then rested XP
 * doubles what is left of the gain. Records level-ups (news + banner).
 */
export function gainXp(life: LifeState, uid: string, skill: SkillId, base: number, now: number) {
  if (!(base > 0) || !UUID.test(uid) || !(uid in life.actors)) return 0;
  const u = userToday(life, uid, now);
  const raw = base * (behindVillage(life, uid, skill) ? CATCH_UP : 1);
  const used = u.dxp?.[skill] ?? 0;
  const full = Math.max(0, Math.min(raw, SOFT_CAP - used));
  let gain = full + (raw - full) * OVER_CAP_RATE;
  (u.dxp ??= {})[skill] = tenth(Math.min(XP_MAX, used + raw));
  const rest = u.rest?.[skill] ?? 0;
  if (rest > 0 && gain > 0) {
    const bonus = Math.min(rest, gain);
    gain += bonus;
    const left = tenth(rest - bonus);
    if (left > 0) u.rest![skill] = left;
    else delete u.rest![skill];
    if (u.rest && !Object.keys(u.rest).length) delete u.rest;
  }
  gain = tenth(gain);
  if (gain <= 0) return 0;
  const before = u.xp?.[skill] ?? 0,
    after = Math.min(XP_MAX, tenth(before + gain));
  (u.xp ??= {})[skill] = after;
  const from = levelOf(before),
    to = levelOf(after);
  if (to > from) {
    const actor = life.actors[uid];
    u.ups = [...(u.ups ?? []), { s: skill, lv: to, at: now }].slice(-UPS_MAX);
    const text = `${nameOf(actor)}의 ${SKILL_INFO[skill].name} 기술이 Lv${to}이 됐어요`;
    addNews(life, now, `lv:${actor}:${skill}:${to}`, 'growth', text, [actor]);
    if (to === 5 || to === MAX_LEVEL) addMemory(life, now, 'growth', [actor], text);
  }
  return gain;
}

// ---------------------------------------------------------------- tools and mods
/** Current tier of a tool (the rod reads the fishing shop's level too). */
export function toolTier(life: LifeState, uid: string, tool: ToolId): number {
  const t = rawUser(life, uid)?.tools?.[tool] ?? 1;
  return tool === 'rod' ? Math.max(t, life.ext?.[uid]?.rod ?? 1) : t;
}
/** The best tier of a tool anyone in the village has. */
export function villageBestTier(life: LifeState, tool: ToolId) {
  return Object.keys(life.actors).reduce((best, uid) => Math.max(best, toolTier(life, uid, tool)), 1);
}
/** Everything skills, professions and tools change for this friend. */
export function growthMods(life: LifeState, uid: string): GrowthMods {
  const out: GrowthMods = { ...NO_MODS };
  const u = rawUser(life, uid);
  for (const s of SKILLS) {
    const lv = levelOf(u?.xp?.[s] ?? 0);
    for (const perk of LEVEL_PERKS[s]) if (perk.mods && !perk.soon && lv >= perk.level) addMods(out, perk.mods);
  }
  for (const id of u?.prof ?? []) if (own(PROF_BY_ID, id)) addMods(out, PROF_BY_ID[id].mods);
  const can = toolTier(life, uid, 'can'),
    hoe = toolTier(life, uid, 'hoe'),
    axe = toolTier(life, uid, 'axe'),
    pick = toolTier(life, uid, 'pickaxe');
  addMods(out, {
    waterPts: WATER_TIER_PTS[can],
    goldPts: HOE_TIER_PTS[hoe],
    woodBonus: AXE_TIER_WOOD[axe],
    woodMult: AXE_TIER_MULT[axe],
    copperPts: PICK_TIER_COPPER[pick],
  });
  return out;
}
/** Deterministic chance roll for an effect (key: what, who, sequence). */
export const growthChance = (life: LifeState, uid: string, what: string, chance: number, now: number) =>
  chance > 0 && roll(`gc:${what}:${uid}:${life.seq}:${now}`) < Math.round(chance * 100);

/** What an upgrade to the next tier costs this friend (null = not possible now). */
export function toolUpgrade(life: LifeState, uid: string, tool: ToolId, now: number) {
  const tier = toolTier(life, uid, tool);
  if (tier >= 5) return { to: null, why: GROWTH_REJECT.toolMax } as const;
  const to = (tier + 1) as 2 | 3 | 4 | 5;
  if (tool === 'rod' && to < ROD_FORGE_FROM) return { to, why: GROWTH_REJECT.rodShop, shop: true } as const;
  if (tool === 'rod' && !researchDone(life, 'ferry', now)) return { to, why: GROWTH_REJECT.rodLater } as const;
  const base = TOOL_COST[to],
    mods = growthMods(life, uid),
    senior = villageBestTier(life, tool) - tier >= SENIOR_GAP;
  const half = senior ? 0.5 : 1;
  const beom = Math.round((base.beom * half * (1 - mods.toolBeom)) / 100) * 100;
  const mats: Record<string, number> = {};
  for (const [id, n] of Object.entries(base.mats)) mats[id] = Math.max(1, Math.ceil(n * half * (1 - mods.toolOre)));
  return { to, beom, mats, senior, why: null } as const;
}

// ---------------------------------------------------------------- research
export const researchDone = (life: LifeState, id: string, now: number) => {
  const s = life.growth?.r?.[id];
  return !!s?.doneAt && s.doneAt <= now;
};
const researchFull = (def: (typeof RESEARCH)[number], s: ResearchState) =>
  s.got >= def.beom && Object.entries(def.mats).every(([id, n]) => (s.mat[id] ?? 0) >= n);
export const researchOpen = (life: LifeState, def: (typeof RESEARCH)[number], now: number) =>
  def.requires.every((r) => researchDone(life, r, now)) && (!def.requiresFlag || !!life.flags?.includes(def.requiresFlag));
/** Helpers still missing before the project may finish (0 once relaxed). */
export function researchMissing(s: ResearchState | undefined, now: number, extraActor?: number) {
  if (s && now >= s.start + RESEARCH_RELAX_DAYS * DAY) return 0;
  const by = new Set(Object.keys(s?.by ?? {}));
  if (extraActor !== undefined) by.add(String(extraActor));
  return Math.max(0, RESEARCH_HELPERS - by.size);
}
/**
 * Sets the flags of finished research (doneAt passed): plaques for every
 * helper, a memory and a news line. Idempotent; returns true when it changed.
 */
export function settleResearch(life: LifeState, now: number) {
  let changed = false;
  for (const def of RESEARCH) {
    const s = life.growth?.r?.[def.id];
    if (!s?.doneAt || s.doneAt > now || life.flags?.includes(def.flag)) continue;
    (life.flags ??= []).push(def.flag);
    changed = true;
    const helpers = Object.keys(s.by).map(Number).filter((a) => a >= 0 && a < 7).sort((p, q) => p - q);
    for (const helper of helpers) {
      const helperUid = uidOf(life, helper);
      if (!helperUid) continue;
      const furn = (((life.ext ??= {})[helperUid] ??= {}).furn ??= {});
      furn['furn-project-plaque'] = Math.min(99_999, (furn['furn-project-plaque'] ?? 0) + 1);
    }
    const text = `마을 개척 “${def.name}” 완공! ${def.opens.split(' · ')[0]}이(가) 열렸어요`;
    addMemory(life, now, 'area', helpers, text);
    addNews(life, now, `research:${def.id}`, 'growth', text, helpers);
  }
  return changed;
}
/** Whether a view at `now` would change anything (finished research to settle). */
export const growthNeedsSettle = (life: LifeState, now: number) =>
  RESEARCH.some((def) => {
    const s = life.growth?.r?.[def.id];
    return !!s?.doneAt && s.doneAt <= now && !life.flags?.includes(def.flag);
  });

// ---------------------------------------------------------------- nodes
/** Today's material nodes for a friend: the shared daily set plus perk/profession extras. */
export function nodesFor(life: LifeState, uid: string, day: number) {
  const mods = uid ? growthMods(life, uid) : NO_MODS;
  const out: { id: string; kind: NodeKind; x: number; z: number }[] = [];
  for (const kind of ['bush', 'log', 'rock'] as const) {
    const pool = NODE_SPOTS.filter((n) => n.kind === kind).sort(
      (a, b) => hash32(`node:${day}:${a.id}`) - hash32(`node:${day}:${b.id}`),
    );
    const base = NODES_PER_DAY[kind];
    const extra = kind === 'bush' ? mods.extraBush : kind === 'rock' ? mods.extraRock : 0;
    const shared = pool.slice(0, base);
    const rest = pool.slice(base).sort((a, b) => hash32(`node:${day}:${uid}:${a.id}`) - hash32(`node:${day}:${uid}:${b.id}`));
    out.push(...shared, ...rest.slice(0, Math.max(0, extra)));
  }
  return out;
}

// ---------------------------------------------------------------- actions
const skillArg = (s: unknown) => (isSkill(s) ? s : fail(GROWTH_REJECT.skill));
/**
 * Applies one growth action for `member` on an already-cloned life
 * (lounge-life.ts lifeAction clones and registers the member first).
 */
export function growthAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: GrowthAction,
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  const uid = member.id,
    actor = member.actor,
    u = userToday(life, uid, now),
    wallet = 'wallet-' + uid;
  let next = ledger;
  const spend = (amount: number, reason: string) => {
    if (amount <= 0) return;
    if ((next.accounts[wallet] ?? 0) < amount) fail(LIFE_REJECT.balance);
    next = spendBeom(next, wallet, amount, `life-${reason}-${uid}-${++life.seq}`, now, reason);
  };
  switch (a.kind) {
    case 'chooseProf': {
      const skill = skillArg(a.skill);
      if (!isProfId(a.prof) || PROF_BY_ID[a.prof].skill !== skill) fail(GROWTH_REJECT.prof);
      const def = PROF_BY_ID[a.prof],
        level = skillLevel(life, uid, skill),
        mine = (u.prof ?? []).filter((p) => PROF_BY_ID[p].skill === skill);
      if (mine.includes(def.id)) fail(GROWTH_REJECT.profTaken);
      if (level < def.level) fail(GROWTH_REJECT.profLevel);
      if (def.level === 5 && mine.length) fail(GROWTH_REJECT.profTaken);
      if (def.level === 10) {
        if (mine.length !== 1) fail(mine.length ? GROWTH_REJECT.profTaken : GROWTH_REJECT.profParent);
        if (mine[0] !== def.parent) fail(GROWTH_REJECT.profParent);
      }
      u.prof = [...(u.prof ?? []), def.id];
      addNews(life, now, `prof:${actor}:${def.id}`, 'growth', `${josaGa(nameOf(actor))} ${SKILL_INFO[skill].name} 전문가 “${def.name}”이(가) 됐어요`, [actor]);
      break;
    }
    case 'respec': {
      const skill = skillArg(a.skill);
      const mine = (u.prof ?? []).filter((p) => PROF_BY_ID[p].skill === skill);
      if (!mine.length) fail(GROWTH_REJECT.noProf);
      spend(RESPEC_PRICE, 'respec');
      u.prof = (u.prof ?? []).filter((p) => !mine.includes(p));
      if (!u.prof.length) delete u.prof;
      break;
    }
    case 'forge': {
      if (!isTool(a.tool)) fail(GROWTH_REJECT.tool);
      if (!researchDone(life, 'forge', now)) fail(GROWTH_REJECT.forgeClosed);
      if (u.forge) fail(GROWTH_REJECT.forgeBusy);
      const up = toolUpgrade(life, uid, a.tool, now);
      if (up.why || !up.to) fail(up.why ?? GROWTH_REJECT.toolMax);
      const cost = up as { to: 2 | 3 | 4 | 5; beom: number; mats: Record<string, number> };
      for (const [id, n] of Object.entries(cost.mats)) if (invCount(life, uid, id) < n) fail(GROWTH_REJECT.materials);
      if ((next.accounts[wallet] ?? 0) < cost.beom) fail(LIFE_REJECT.balance);
      for (const [id, n] of Object.entries(cost.mats)) addInv(life, uid, id, -n);
      spend(cost.beom, `tool-${a.tool}-${cost.to}`);
      u.forge = { tool: a.tool, to: cost.to, at: now, readyAt: forgeReadyAt(now) };
      addNews(life, now, `forge:${actor}:${a.tool}:${cost.to}`, 'growth', `${josaGa(nameOf(actor))} 대장간에 ${josaUl(TOOL_INFO[a.tool].name)} 맡겼어요`, [actor]);
      break;
    }
    case 'forgePickup': {
      const job = u.forge;
      if (!job) fail(GROWTH_REJECT.forgeNone);
      if (now < job!.readyAt) fail(GROWTH_REJECT.forgeWait);
      (u.tools ??= {})[job!.tool] = Math.max(job!.to, u.tools[job!.tool] ?? 1);
      delete u.forge;
      const text = `${josaGa(nameOf(actor))} ${TIER_NAME[job!.to as 2]} ${josaUl(TOOL_INFO[job!.tool].name)} 받았어요`;
      addNews(life, now, `pickup:${actor}:${job!.tool}:${job!.to}`, 'growth', text, [actor]);
      if (job!.to >= 3) addMemory(life, now, 'growth', [actor], text);
      break;
    }
    case 'forgeGift': {
      if (u.gift) fail(GROWTH_REJECT.gifted);
      if (!researchDone(life, 'forge', now) || (u.rocks ?? 0) < FIRST_TOOL_ROCKS || toolTier(life, uid, 'pickaxe') > 1 || u.forge?.tool === 'pickaxe')
        fail(GROWTH_REJECT.gift);
      u.gift = true;
      (u.tools ??= {}).pickaxe = 2;
      addNews(life, now, `gift:${actor}`, 'growth', `${josaGa(nameOf(actor))} 촌장님께 구리 곡괭이를 선물받았어요`, [actor]);
      break;
    }
    case 'research': {
      const def = typeof a.project === 'string' && own(RESEARCH_BY_ID, a.project) ? RESEARCH_BY_ID[a.project] : undefined;
      if (!def) fail(GROWTH_REJECT.project);
      if (!def!.live) fail(GROWTH_REJECT.projectSoon);
      if (!researchOpen(life, def!, now)) fail(GROWTH_REJECT.projectLocked);
      const all = (growthOf(life).r ??= {});
      const s = (all[def!.id] ??= { got: 0, mat: {}, by: {}, start: now });
      if (s.doneAt && s.doneAt <= now) fail(GROWTH_REJECT.projectDone);
      if (s.fullAt || researchFull(def!, s)) fail(GROWTH_REJECT.projectFull);
      if (a.item !== undefined) {
        if (typeof a.item !== 'string' || !own(def!.mats, a.item)) fail(GROWTH_REJECT.giveItem);
        const left = def!.mats[a.item!] - (s.mat[a.item!] ?? 0);
        if (left <= 0) fail(GROWTH_REJECT.slotFull);
        if (!safe(a.n) || a.n! < 1) fail(GROWTH_REJECT.give);
        const n = Math.min(a.n!, left);
        if (invCount(life, uid, a.item!) < n) fail(LIFE_REJECT.notEnough);
        addInv(life, uid, a.item!, -n);
        s.mat[a.item!] = (s.mat[a.item!] ?? 0) + n;
      } else {
        const left = def!.beom - s.got;
        if (left <= 0) fail(GROWTH_REJECT.slotFull);
        const room = left - researchMissing(s, now, actor) * RESEARCH_MIN_BEOM;
        if (room <= 0) fail(GROWTH_REJECT.reserved);
        if (!safe(a.beom) || a.beom! < Math.min(RESEARCH_MIN_BEOM, room)) fail(GROWTH_REJECT.give);
        const amount = Math.min(a.beom!, room);
        spend(amount, 'research');
        s.got += amount;
      }
      s.by[String(actor)] = Math.min(1_000_000, (s.by[String(actor)] ?? 0) + 1);
      addNews(life, now, `res:${def!.id}:${actor}`, 'growth', `${josaGa(nameOf(actor))} 마을 개척 “${def!.name}”에 힘을 보탰어요`, [actor]);
      if (researchFull(def!, s) && researchMissing(s, now) === 0) {
        s.fullAt = now;
        s.doneAt = nextSixAm(now);
        const helpers = Object.keys(s.by).map(Number).sort((p, q) => p - q);
        addNews(life, now, `resfull:${def!.id}`, 'growth', `“${def!.name}” 재료가 다 모였어요! 내일 아침 6시에 완공돼요`, helpers);
      }
      break;
    }
    case 'chop':
    case 'smash': {
      const node = typeof a.node === 'string' && own(NODE_BY_ID, a.node) ? NODE_BY_ID[a.node] : undefined;
      if (!node) fail(GROWTH_REJECT.node);
      if ((a.kind === 'smash') !== (node!.kind === 'rock')) fail(GROWTH_REJECT.node);
      if (!nodesFor(life, uid, kstDay(now)).some((n) => n.id === node!.id)) fail(GROWTH_REJECT.node);
      if (u.nodes?.includes(node!.id)) fail(GROWTH_REJECT.nodeTaken);
      (u.nodes ??= []).push(node!.id);
      const mods = growthMods(life, uid),
        seq = ++life.seq;
      if (node!.kind === 'rock') {
        const stone = Math.round(NODE_YIELD.rock * mods.stoneMult);
        addInv(life, uid, 'stone', stone);
        const chance = COPPER_CHANCE + mods.copperPts;
        let copper = 0;
        if (roll(`cu:${uid}:${node!.id}:${seq}:${now}`) < chance)
          copper = Math.round(((roll(`cun:${uid}:${seq}`) < 30 ? 2 : 1) + mods.oreBonus) * mods.oreMult);
        if (copper) addInv(life, uid, 'copper', copper);
        u.rocks = Math.min(1_000_000, (u.rocks ?? 0) + 1);
        gainXp(life, uid, 'mine', XP.rock + (copper ? XP.ore : 0), now);
      } else {
        const wood = Math.round((NODE_YIELD[node!.kind] + mods.woodBonus) * mods.woodMult);
        addInv(life, uid, 'wood', wood);
        gainXp(life, uid, NODE_INFO[node!.kind].skill, node!.kind === 'log' ? XP.log : XP.bush, now);
      }
      break;
    }
    default:
      fail(LIFE_REJECT.invalid);
  }
  return { life, ledger: next };
}
/** Settles today's fields, rested XP and retro XP for `uid` (every life action). */
export function touchGrowth(life: LifeState, uid: string, now: number) {
  if (UUID.test(uid) && uid in life.actors) userToday(life, uid, now);
  settleResearch(life, now);
}

// ---------------------------------------------------------------- view
export type SkillView = {
  id: SkillId;
  xp: number;
  level: number;
  /** XP where the current level starts / the next one starts (null at Lv10). */
  from: number;
  next: number | null;
  /** XP counted toward today's soft cap. */
  today: number;
  rest: number;
  behind: boolean;
  median: number;
  prof: string[];
  /** A pick is waiting (Lv5 / Lv10 reached, not chosen yet). */
  choice: string[] | null;
};
export type ToolView = {
  id: ToolId;
  tier: number;
  best: number;
  next: null | {
    to: number;
    beom?: number;
    mats?: Record<string, number>;
    senior?: boolean;
    /** Why it cannot be forged now ('' = it can). */
    why: string;
    shop?: boolean;
  };
};
export type ResearchView = {
  id: string;
  got: number;
  mat: Record<string, number>;
  helpers: number[];
  mine: number;
  start: number | null;
  missing: number;
  relaxAt: number | null;
  full: boolean;
  doneAt: number | null;
  done: boolean;
  open: boolean;
};
export type GrowthView = {
  skills: SkillView[];
  mods: GrowthMods;
  tools: ToolView[];
  forge: { tool: ToolId; to: number; at: number; readyAt: number; ready: boolean } | null;
  forgeOpen: boolean;
  gift: { rocks: number; need: number; claimed: boolean; available: boolean };
  research: ResearchView[];
  nodes: { id: string; kind: NodeKind; x: number; z: number; taken: boolean }[];
  ups: { s: SkillId; lv: number; at: number }[];
  retroAt: number | null;
  respecPrice: number;
  softCap: number;
};
export function growthView(state: LifeState, uid: string, now: number): GrowthView {
  // Views never mutate: settle a throwaway copy of this friend's record.
  const life: LifeState = { ...state, growth: structuredClone(state.growth ?? {}) };
  const ok = UUID.test(uid) && uid in life.actors;
  const u = ok ? userToday(life, uid, now) : {};
  const mods = ok ? growthMods(life, uid) : { ...NO_MODS };
  const day = kstDay(now);
  const skills = SKILLS.map((id): SkillView => {
    const xp = u.xp?.[id] ?? 0,
      level = levelOf(xp),
      prof = (u.prof ?? []).filter((p) => PROF_BY_ID[p]?.skill === id);
    const choice =
      level >= 5 && !prof.length
        ? profChoices(id).map((p) => p.id)
        : level >= 10 && prof.length === 1
          ? profChoices(id, prof[0]).map((p) => p.id)
          : null;
    return {
      id,
      xp,
      level,
      from: LEVEL_XP[level - 1],
      next: level < MAX_LEVEL ? LEVEL_XP[level] : null,
      today: u.dxp?.[id] ?? 0,
      rest: u.rest?.[id] ?? 0,
      behind: ok && behindVillage(life, uid, id),
      median: villageMedian(life, id),
      prof,
      choice,
    };
  });
  const tools = TOOLS.map((id): ToolView => {
    const tier = ok ? toolTier(life, uid, id) : 1,
      best = villageBestTier(life, id);
    if (!ok) return { id, tier, best, next: null };
    const up = toolUpgrade(life, uid, id, now);
    if (!up.to) return { id, tier, best, next: null };
    if (up.why) return { id, tier, best, next: { to: up.to, why: up.why, ...('shop' in up && up.shop ? { shop: true } : {}) } };
    const c = up as { to: number; beom: number; mats: Record<string, number>; senior: boolean };
    const short = Object.entries(c.mats).some(([m, n]) => invCount(life, uid, m) < n);
    return { id, tier, best, next: { to: c.to, beom: c.beom, mats: c.mats, senior: c.senior, why: short ? GROWTH_REJECT.materials : '' } };
  });
  const research = RESEARCH.map((def): ResearchView => {
    const s = life.growth?.r?.[def.id];
    return {
      id: def.id,
      got: s?.got ?? 0,
      mat: { ...s?.mat },
      helpers: Object.keys(s?.by ?? {}).map(Number).sort((a, b) => a - b),
      mine: ok ? (s?.by[String(life.actors[uid])] ?? 0) : 0,
      start: s?.start ?? null,
      missing: researchMissing(s, now),
      relaxAt: s ? s.start + RESEARCH_RELAX_DAYS * DAY : null,
      full: !!s && researchFull(def, s),
      doneAt: s?.doneAt ?? null,
      done: researchDone(life, def.id, now),
      open: def.live && researchOpen(life, def, now),
    };
  });
  const taken = new Set(u.nodes ?? []);
  return {
    skills,
    mods,
    tools,
    forge: u.forge ? { ...u.forge, ready: now >= u.forge.readyAt } : null,
    forgeOpen: researchDone(life, 'forge', now),
    gift: {
      rocks: u.rocks ?? 0,
      need: FIRST_TOOL_ROCKS,
      claimed: !!u.gift,
      available:
        ok && !u.gift && researchDone(life, 'forge', now) && (u.rocks ?? 0) >= FIRST_TOOL_ROCKS && toolTier(life, uid, 'pickaxe') === 1 && u.forge?.tool !== 'pickaxe',
    },
    research,
    nodes: ok ? nodesFor(life, uid, day).map((n) => ({ ...n, taken: taken.has(n.id) })) : [],
    ups: [...(u.ups ?? [])],
    retroAt: u.retro ?? null,
    respecPrice: RESPEC_PRICE,
    softCap: SOFT_CAP,
  };
}
/** Item ids the growth screens name (materials must exist in the item catalog). */
export const growthItemName = (id: string) => ITEM_BY_ID[id]?.name ?? id;
