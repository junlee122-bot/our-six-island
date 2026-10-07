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
import { basketExtra } from './lounge-stage3-data.ts';
import { myDay } from './lounge-myday.ts';
import { spendBeom, kstDay, type LoungeLedger } from './lounge-economy.ts';
import { ACTOR_NAMES, dayStart, hash32 } from './lounge-calendar.ts';
import { ITEM_BY_ID } from './lounge-items.ts';
import {
  AXE_TIER_MULT,
  AXE_TIER_WOOD,
  CATCH_UP,
  CATCH_UP_GAP,
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
  XP,
  GATES,
  MINE_XP,
  NODE_XP,
  REGION_ITEMS,
  addMods,
  isProfId,
  levelOf,
  profChoices,
  type GrowthMods,
  type NodeArea,
  type NodeKind,
  type SkillId,
  type ToolId,
} from './lounge-growth-data.ts';
import { LIFE_REJECT, LifeError, uidOf, type LifeState } from './lounge-life.ts';
import { RESPEC_PRICE_MAX_TIMES, TALENT_BY_ID, isTalentId, respecPrice, talentPoints, type TalentDef } from './lounge-growth-talents.ts';
import { DISTRICT_FLAG } from './lounge-districts.ts';
import { LIFT_EVERY, LIFT_FROM_FLOOR, MINE_FLOORS_P2, floorOre, floorPick, mineDrop, mineFloor, veinFloor } from './lounge-mine.ts';
// 음식 버프: 배움 (XP), 광부의 힘 (mine ore), 나무꾼 (wood) — lounge-food-data.ts.
import { MINE_BUFF_EVERY, MINE_BUFF_VEIN, buffBoost, hasBuff, learnMult } from './lounge-food-data.ts';
import { addInv, addMemory, addNews, invCount } from './lounge-life-plus.ts';
// 무드: the XP multiplier of the current mood (functions only, same cycle rule).
import { moodXpCapMult, moodXpMult } from './lounge-mood.ts';
import { hasExplorerPass } from './lounge-explorer-pass.ts';
// 주민 동행: 럭스·무잔·잔나·메르시 (XP) and 볼리바스 (the ladder), lounge-companion-effects.ts.
import { companionLadderEarly, companionXpMult } from './lounge-companion-effects.ts';

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
  /** Talents taken (design-skill-tree.md §2; ≤ 5 per skill, older saves: none). */
  tal?: string[];
  /** Talents taken today (the day's one batched news line). */
  tn?: string[];
  /** 운명 다시 보기 so far per skill (the price doubles each time). */
  resp?: Partial<Record<SkillId, number>>;
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
  /** 광산: the floor I am on (0 = outside) and the deepest floor reached. */
  mine?: { at: number; deep: number };
  /** 광산 rocks broken today ('floor:rock'), daily. */
  mrock?: string[];
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
export type GrowthState = {
  u?: Record<string, GrowthUser>;
  r?: Record<string, ResearchState>;
  /** Shared gates cleared once for everyone (GATES): who and when. */
  c?: Record<string, { actor: number; at: number }>;
};
export type GrowthExt = { growth?: GrowthState };
export type GrowthAction =
  | { kind: 'chooseProf'; skill: SkillId; prof: string }
  | { kind: 'respec'; skill: SkillId }
  | { kind: 'pickTalent'; skill: SkillId; talent: string }
  | { kind: 'forge'; tool: ToolId }
  | { kind: 'forgePickup' }
  | { kind: 'forgeGift' }
  | { kind: 'research'; project: string; beom?: number; item?: string; n?: number }
  | { kind: 'chop'; node: string }
  | { kind: 'smash'; node: string }
  | { kind: 'mineGo'; floor: number }
  | { kind: 'mineRock'; floor: number; rock: number }
  | { kind: 'clearGate'; gate: string };

export const GROWTH_REJECT = {
  skill: '기술을 확인해 주세요.',
  prof: '전문가를 확인해 주세요.',
  profLevel: '아직 고를 수 있는 레벨이 아니에요.',
  profTaken: '이미 고른 전문가예요. 다시 고르려면 점집 신이치에게 운명 다시 보기를 부탁해요.',
  profParent: '먼저 고른 전문가 아래에서만 고를 수 있어요.',
  noProf: '되돌릴 전문가나 재능이 없어요.',
  talent: '재능을 확인해 주세요.',
  talentTaken: '이미 익힌 재능이에요.',
  talentLevel: '아직 찍을 수 있는 레벨이 아니에요.',
  talentPoints: '남은 재능 점수가 없어요. 2·4·6·8·10레벨에 1점씩 생겨요.',
  talentAfter: '먼저 앞 칸의 재능을 익혀야 해요.',
  talentBranch: '이 갈래의 5레벨 전문가를 고른 뒤에 찍을 수 있어요.',
  respecShut: '운명 다시 보기는 산기슭 마을이 열리면 점집 신이치에게 부탁할 수 있어요.',
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
  nodeTool: '도끼가 더 튼튼해야 해요. 대장간에서 도끼를 3단계로 두드려 주세요.',
  area: '아직 갈 수 없는 곳이에요.',
  mineClosed: '광산은 마을 개척 “산길 정비”가 끝나면 열려요.',
  mineFloor: '그 층으로는 갈 수 없어요.',
  mineLadder: '아직 사다리를 찾지 못했어요. 바위를 더 깨 보세요.',
  mineLift: '승강기는 마을 개척 “광산 승강기”가 끝나면 움직여요.',
  minePick: '곡괭이가 더 튼튼해야 이 층의 바위를 깰 수 있어요.',
  mineHere: '지금 있는 층의 바위만 깰 수 있어요.',
  mineRock: '그 바위는 여기에 없어요.',
  gate: '치울 수 있는 곳이 아니에요.',
  gateDone: '이미 누군가 치웠어요.',
  gateTool: '도끼 2단계부터 이 통나무를 쪼갤 수 있어요.',
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
  if (Array.isArray(x.tal)) {
    const tal: string[] = [];
    for (const id of x.tal) {
      if (!isTalentId(id) || tal.includes(id)) continue;
      const skill = TALENT_BY_ID[id].skill;
      if (tal.filter((t) => TALENT_BY_ID[t].skill === skill).length < talentPoints(MAX_LEVEL)) tal.push(id);
    }
    if (tal.length) out.tal = tal;
  }
  const resp: Partial<Record<SkillId, number>> = {};
  for (const s of SKILLS) {
    const n = obj(x.resp)[s];
    if (safe(n) && n > 0) resp[s] = Math.min(RESPEC_PRICE_MAX_TIMES, n);
  }
  if (Object.keys(resp).length) out.resp = resp;
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
  const m = obj(x.mine);
  if (safe(m.at) && safe(m.deep) && m.at >= 0 && m.deep >= 0)
    out.mine = { at: Math.min(MINE_FLOORS_P2, m.at), deep: Math.min(MINE_FLOORS_P2, m.deep) };
  if (safe(x.day) && x.day > 0 && Array.isArray(x.mrock)) {
    const mrock = [...new Set(x.mrock.filter((k): k is string => typeof k === 'string' && /^\d{1,2}:\d{1,2}$/.test(k)))];
    if (mrock.length) out.mrock = mrock.slice(0, MINE_FLOORS_P2 * 20);
  }
  if (safe(x.day) && x.day > 0 && Array.isArray(x.tn)) {
    const tn = [...new Set(x.tn.filter(isTalentId))];
    if (tn.length) out.tn = tn.slice(-12);
  }
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
  const c: NonNullable<GrowthState['c']> = {};
  for (const id of Object.keys(GATES)) {
    const g = obj(obj(v.c)[id]);
    if (safe(g.actor) && g.actor >= 0 && g.actor < 7 && safe(g.at) && g.at > 0) c[id] = { actor: g.actor, at: g.at };
  }
  const out: GrowthState = {};
  if (Object.keys(u).length) out.u = u;
  if (Object.keys(r).length) out.r = r;
  if (Object.keys(c).length) out.c = c;
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
/** 06:00 KST of the next calendar day (tool pickup); 재능 용광로: 18:00 the same day when left before then. */
export const forgeReadyAt = (now: number, fast = false) => {
  const evening = dayStart(kstDay(now)) + FORGE_FAST_HOUR * HOUR;
  return fast && now < evening ? evening : dayStart(kstDay(now) + 1) + FORGE_READY_HOUR * HOUR;
};
/** 재능 용광로: a tool left before this KST hour is ready the same evening. */
export const FORGE_FAST_HOUR = 18;
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
  // 나의 하루 (lounge-myday.ts): the daily XP cap, nodes and mine rocks are mine.
  const pday = myDay(life, uid, now);
  if (u.day !== pday) {
    u.day = pday;
    delete u.dxp;
    delete u.nodes;
    delete u.mrock;
    delete u.tn;
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
export const behindVillage = (life: LifeState, uid: string, skill: SkillId) =>
  skillLevel(life, uid, skill) <= villageMedian(life, skill) - CATCH_UP_GAP;

/**
 * The one hook other systems use to scale skill XP (e.g. the mood system's
 * +10/+15% and −10% at 지쳤어요). Applied to the raw gain before the daily
 * soft cap, so a good mood reaches the cap sooner (capped XP gets no bonus).
 * 1 = no change. The cap itself moves with xpSoftCap.
 */
export function xpMultiplier(life: LifeState, uid: string, _skill: SkillId, now: number): number {
  return moodXpMult(life, uid, now) * learnMult(life, uid, now) * companionXpMult(life, uid, _skill, now);
}
/** Today's daily XP soft cap: SOFT_CAP, +20% in a good mood (기분의 의미, G9). */
export function xpSoftCap(life: LifeState, uid: string, now: number) {
  return Math.round(SOFT_CAP * moodXpCapMult(life, uid, now));
}
/**
 * Adds XP from a life action: ×CATCH_UP when behind the village median, the
 * daily soft cap (xpSoftCap in full, the rest at OVER_CAP_RATE), then rested XP
 * doubles what is left of the gain. Records level-ups (news + banner).
 */
export function gainXp(life: LifeState, uid: string, skill: SkillId, base: number, now: number) {
  if (!(base > 0) || !UUID.test(uid) || !(uid in life.actors)) return 0;
  const u = userToday(life, uid, now);
  const raw = base * (behindVillage(life, uid, skill) ? CATCH_UP : 1);
  const used = u.dxp?.[skill] ?? 0;
  // Multipliers from other systems (mood…) scale only the part under the soft
  // cap (it fills sooner); what spills over counts unmultiplied.
  const mult = xpMultiplier(life, uid, skill, now);
  const full = Math.max(0, Math.min(raw * mult, xpSoftCap(life, uid, now) - used));
  const over = Math.max(0, raw - full / mult);
  let gain = full + over * OVER_CAP_RATE;
  (u.dxp ??= {})[skill] = tenth(Math.min(XP_MAX, used + full + over));
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
  for (const id of u?.tal ?? []) if (own(TALENT_BY_ID, id) && !TALENT_BY_ID[id].lock) addMods(out, TALENT_BY_ID[id].mods ?? {});
  // The can's tiers give reach now (lounge-farm-soil CAN_FORGE_REACH), no mod.
  const hoe = toolTier(life, uid, 'hoe'),
    axe = toolTier(life, uid, 'axe'),
    pick = toolTier(life, uid, 'pickaxe');
  addMods(out, {
    goldPts: HOE_TIER_PTS[hoe],
    woodBonus: AXE_TIER_WOOD[axe],
    woodMult: AXE_TIER_MULT[axe],
    copperPts: PICK_TIER_COPPER[pick],
  });
  return out;
}
/** 재능 꽃말 · 잔칫상: how much more a gift of `item` counts (flowers, dishes). */
export function giftMult(life: LifeState, uid: string, item: string) {
  const kind = ITEM_BY_ID[item]?.kind;
  if (kind !== 'flower' && kind !== 'dish') return 1;
  const mods = growthMods(life, uid);
  return 1 + (kind === 'flower' ? mods.flowerGift : mods.dishGift);
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
export function nodesFor(life: LifeState, uid: string, day: number, area: NodeArea = 'village') {
  const mods = uid ? growthMods(life, uid) : NO_MODS;
  const out: { id: string; kind: NodeKind; x: number; z: number }[] = [];
  const perDay = NODES_PER_DAY[area];
  for (const kind of Object.keys(perDay) as NodeKind[]) {
    const pool = NODE_SPOTS.filter((n) => n.kind === kind && (n.area ?? 'village') === area).sort(
      (a, b) => hash32(`node:${day}:${a.id}`) - hash32(`node:${day}:${b.id}`),
    );
    const base = perDay[kind] ?? 0;
    // Profession / perk extras apply at the village edge only.
    const extra = area !== 'village' ? 0 : kind === 'bush' ? mods.extraBush : kind === 'rock' ? mods.extraRock : 0;
    const shared = pool.slice(0, base);
    const rest = pool.slice(base).sort((a, b) => hash32(`node:${day}:${uid}:${a.id}`) - hash32(`node:${day}:${uid}:${b.id}`));
    out.push(...shared, ...rest.slice(0, Math.max(0, extra)));
  }
  return out.map(({ id, kind, x, z }) => ({ id, kind, x, z }));
}
/** Whether a region is open for everyone now. */
export function areaOpen(life: LifeState, area: NodeArea | 'mine', now: number, uid?: string) {
  if (area === 'village') return true;
  if (uid !== undefined && hasExplorerPass(life.actors[uid], now)) return true;
  if (!researchDone(life, 'trail', now)) return false;
  return area === 'woods' ? !!life.growth?.c?.woods : true;
}
/** Floors a friend may go to now (1, the next one after a found ladder, lift floors). */
export function mineCanGo(life: LifeState, uid: string, floor: number, now: number): string | null {
  if (floor === 0) return null;
  if (!researchDone(life, 'trail', now) && !hasExplorerPass(life.actors[uid], now)) return GROWTH_REJECT.mineClosed;
  if (!safe(floor) || floor < 1 || floor > MINE_FLOORS_P2) return GROWTH_REJECT.mineFloor;
  if (hasExplorerPass(life.actors[uid], now)) return null;
  const lift = researchDone(life, 'lift', now);
  if (floor >= LIFT_FROM_FLOOR && !lift) return GROWTH_REJECT.mineLift;
  if (floorPick(floor) > toolTier(life, uid, 'pickaxe')) return GROWTH_REJECT.minePick;
  if (floor === 1) return null;
  const u = life.growth?.u?.[uid],
    at = u?.mine?.at ?? 0,
    deep = u?.mine?.deep ?? 0;
  if (lift && floor % LIFT_EVERY === 0 && floor <= deep) return null;
  // 재능 깊은 숨: the lift also stops `liftPlus` floors below each stop I reached.
  const plus = growthMods(life, uid).liftPlus,
    stop = floor - plus;
  if (lift && plus > 0 && stop >= LIFT_EVERY && stop % LIFT_EVERY === 0 && stop <= deep) return null;
  if (floor === at + 1 && ladderFound(life, uid, at, now)) return null;
  if (floor <= at && floor >= 1 && at > 0 && floor === at) return null;
  return floor === at + 1 ? GROWTH_REJECT.mineLadder : GROWTH_REJECT.mineFloor;
}
/** Rocks broken on a floor today by this friend. */
const brokenOn = (u: GrowthUser | undefined, floor: number) => (u?.mrock ?? []).filter((k) => k.startsWith(floor + ':')).length;
export function ladderFound(life: LifeState, uid: string, floor: number, now: number) {
  if (floor < 1) return false;
  const u = life.growth?.u?.[uid];
  if (u?.day !== myDay(life, uid, now)) return false;
  // 재능 사다리 감 and 주민 동행: one rock fewer each.
  return brokenOn(u, floor) >= Math.max(1, mineFloor(kstDay(now), floor, researchDone(life, 'lift', now)).ladderNeed - growthMods(life, uid).ladderEarly - companionLadderEarly(life, uid, now));
}

// ---------------------------------------------------------------- actions
const skillArg = (s: unknown) => (isSkill(s) ? s : fail(GROWTH_REJECT.skill));
/** Talent points earned in a skill and still free (design-skill-tree.md §2: floor(level/2) − taken). */
export function talentsLeft(life: LifeState, uid: string, skill: SkillId) {
  const taken = (rawUser(life, uid)?.tal ?? []).filter((t) => TALENT_BY_ID[t]?.skill === skill).length;
  return Math.max(0, talentPoints(skillLevel(life, uid, skill)) - taken);
}
/** Why a talent cannot be taken now ('' = it can). */
export function talentBlock(life: LifeState, uid: string, def: TalentDef): string {
  const u = rawUser(life, uid);
  if (u?.tal?.includes(def.id)) return GROWTH_REJECT.talentTaken;
  if (def.lock) return def.lock;
  if (skillLevel(life, uid, def.skill) < def.level) return GROWTH_REJECT.talentLevel;
  if (def.branch && !u?.prof?.includes(def.branch)) return GROWTH_REJECT.talentBranch;
  // A predecessor nobody can take yet (locked) does not hold its successor back.
  if (def.after && !u?.tal?.includes(def.after) && !TALENT_BY_ID[def.after]?.lock) return GROWTH_REJECT.talentAfter;
  if (talentsLeft(life, uid, def.skill) <= 0) return GROWTH_REJECT.talentPoints;
  return '';
}
/** What the next 운명 다시 보기 of a skill costs this friend. */
export const respecCost = (life: LifeState, uid: string, skill: SkillId) => respecPrice(rawUser(life, uid)?.resp?.[skill] ?? 0);
/** The one news line a day per friend for talents ("… 재능 낚시 ‘밤낚시’·‘보물 냄새’를 익혔어요"). */
function talentNews(life: LifeState, u: GrowthUser, now: number, actor: number) {
  const key = `tal:${actor}`,
    day = kstDay(now);
  const names = (u.tn ?? []).filter(isTalentId).map((t) => `${SKILL_INFO[TALENT_BY_ID[t].skill].name} ‘${TALENT_BY_ID[t].name}’`);
  const full = `${josaGa(nameOf(actor))} 재능 ${names.join('·')}을(를) 익혔어요`;
  const text = full.length > 80 ? `${josaGa(nameOf(actor))} 오늘 재능 ${names.length}개를 익혔어요` : full;
  const line = life.news?.find((d) => d.day === day)?.lines.find((l) => l.key === key);
  if (line) line.text = text;
  else addNews(life, now, key, 'growth', text, [actor]);
}
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
      if (PROF_BY_ID[a.prof].lock) fail(PROF_BY_ID[a.prof].lock!);
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
    case 'pickTalent': {
      const skill = skillArg(a.skill);
      const def = isTalentId(a.talent) ? TALENT_BY_ID[a.talent] : undefined;
      if (!def || def.skill !== skill) fail(GROWTH_REJECT.talent);
      const why = talentBlock(life, uid, def!);
      if (why) fail(why);
      u.tal = [...(u.tal ?? []), def!.id];
      u.tn = [...(u.tn ?? []), def!.id].slice(-12);
      talentNews(life, u, now, actor);
      break;
    }
    case 'respec': {
      // 운명 다시 보기 (신이치, design-skill-tree.md §2): a skill's professions and
      // talents, 500,000범 doubling per skill each time (a pure sink).
      const skill = skillArg(a.skill);
      if (!life.flags?.includes(DISTRICT_FLAG.foothill!) && !hasExplorerPass(actor, now)) fail(GROWTH_REJECT.respecShut);
      const mine = (u.prof ?? []).filter((p) => PROF_BY_ID[p].skill === skill);
      const tal = (u.tal ?? []).filter((t) => TALENT_BY_ID[t]?.skill === skill);
      if (!mine.length && !tal.length) fail(GROWTH_REJECT.noProf);
      spend(respecPrice(u.resp?.[skill] ?? 0), 'respec');
      (u.resp ??= {})[skill] = Math.min(RESPEC_PRICE_MAX_TIMES, (u.resp[skill] ?? 0) + 1);
      u.prof = (u.prof ?? []).filter((p) => !mine.includes(p));
      if (!u.prof.length) delete u.prof;
      u.tal = (u.tal ?? []).filter((t) => !tal.includes(t));
      if (!u.tal.length) delete u.tal;
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
      u.forge = { tool: a.tool, to: cost.to, at: now, readyAt: forgeReadyAt(now, growthMods(life, uid).forgeFast) };
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
      const nodeArea = node!.area ?? 'village';
      if (!areaOpen(life, nodeArea, now, uid)) fail(GROWTH_REJECT.area);
      if (!nodesFor(life, uid, kstDay(now), nodeArea).some((n) => n.id === node!.id)) fail(GROWTH_REJECT.node);
      if (u.nodes?.includes(node!.id)) fail(GROWTH_REJECT.nodeTaken);
      const needTier = NODE_INFO[node!.kind].tier ?? 1;
      if (toolTier(life, uid, NODE_INFO[node!.kind].tool) < needTier) fail(GROWTH_REJECT.nodeTool);
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
      } else if (node!.kind === 'shroom') {
        // 송이 or 영지 (영지 1 in 3); 약초꾼's double chance applies.
        const item = roll(`shroom:${uid}:${node!.id}:${seq}`) < 34 ? 'yeongji' : 'songi';
        // 채집 바구니 (오른's range upgrade, lounge-stage3-data.ts) may add one more.
        addInv(life, uid, item, NODE_YIELD.shroom + (growthChance(life, uid, 'shroom', mods.forageDouble, now) ? 1 : 0) + basketExtra(life, uid, `shroom:${node!.id}:${seq}`));
        gainXp(life, uid, 'forage', NODE_XP.shroom, now);
      } else if (node!.kind === 'stump') {
        addInv(life, uid, 'hardwood', Math.round(NODE_YIELD.stump * mods.woodMult) + (hasBuff(life, uid, now, 'wood') ? 1 : 0));
        gainXp(life, uid, 'forage', NODE_XP.stump, now);
      } else {
        const wood = Math.round((NODE_YIELD[node!.kind] + mods.woodBonus) * mods.woodMult) + (hasBuff(life, uid, now, 'wood') ? 1 : 0);
        addInv(life, uid, 'wood', wood);
        gainXp(life, uid, NODE_INFO[node!.kind].skill, NODE_XP[node!.kind], now);
      }
      break;
    }
    case 'mineGo': {
      const why = mineCanGo(life, uid, a.floor, now);
      if (why) fail(why);
      const m = (u.mine ??= { at: 0, deep: 0 });
      m.at = a.floor;
      if (a.floor > 0 && a.floor > m.deep) {
        m.deep = a.floor;
        gainXp(life, uid, 'mine', MINE_XP.newFloor, now);
        if (a.floor % LIFT_EVERY === 0 || a.floor === MINE_FLOORS_P2)
          addNews(life, now, `deep:${actor}:${a.floor}`, 'growth', `${josaGa(nameOf(actor))} 광산 ${a.floor}층에 도착했어요`, [actor]);
      }
      break;
    }
    case 'mineRock': {
      const m = u.mine;
      if (!m || !safe(a.floor) || m.at !== a.floor || a.floor < 1) fail(GROWTH_REJECT.mineHere);
      if (floorPick(a.floor) > toolTier(life, uid, 'pickaxe')) fail(GROWTH_REJECT.minePick);
      const day = kstDay(now),
        floor = mineFloor(day, a.floor, researchDone(life, 'lift', now));
      const rock = floor.rocks.find((r) => r.i === a.rock);
      if (!rock) fail(GROWTH_REJECT.mineRock);
      const key = `${a.floor}:${a.rock}`;
      if (u.mrock?.includes(key)) fail(GROWTH_REJECT.nodeTaken);
      (u.mrock ??= []).push(key);
      const mods = growthMods(life, uid),
        seq = ++life.seq;
      const miner = hasBuff(life, uid, now, 'mine');
      const drop = mineDrop(
        `${uid}:${day}:${key}:${seq}`,
        a.floor,
        rock!.vein,
        mods.copperPts + (miner ? MINE_BUFF_VEIN * buffBoost(life, uid, now, 'mine') : 0),
        1 + mods.fossil,
      );
      const ore = drop.item !== 'stone' && drop.item !== 'gem';
      const n = ore ? Math.round((drop.n + mods.oreBonus) * mods.oreMult) : drop.item === 'stone' ? Math.round(drop.n * mods.stoneMult) : drop.n;
      addInv(life, uid, drop.item, n);
      // 광부의 힘: every third rock under the buff gives one more of the floor's ore.
      if (miner) {
        const x = ((life.ext ??= {})[uid] ??= {});
        x.mrk = (x.mrk ?? 0) + 1;
        if (x.mrk % MINE_BUFF_EVERY === 0) addInv(life, uid, floorOre(a.floor), 1);
      }
      if (drop.fossil) {
        addInv(life, uid, drop.fossil, 1);
        const name = REGION_ITEMS.find((i) => i.id === drop.fossil)?.name ?? '화석';
        addNews(life, now, `fossil:${actor}:${drop.fossil}`, 'growth', `${josaGa(nameOf(actor))} 광산 ${a.floor}층에서 ${josaUl(name)} 찾았어요`, [actor]);
      }
      u.rocks = Math.min(1_000_000, (u.rocks ?? 0) + 1);
      gainXp(
        life,
        uid,
        'mine',
        XP.rock + (ore ? XP.ore : 0) + (drop.item === 'gem' ? MINE_XP.gem : 0) + (drop.fossil ? MINE_XP.fossil : 0),
        now,
      );
      break;
    }
    case 'clearGate': {
      const def = typeof a.gate === 'string' && own(GATES, a.gate) ? GATES[a.gate] : undefined;
      if (!def) fail(GROWTH_REJECT.gate);
      if (!researchDone(life, def!.flag, now)) fail(GROWTH_REJECT.area);
      const cleared = (growthOf(life).c ??= {});
      if (cleared[a.gate]) fail(GROWTH_REJECT.gateDone);
      if (toolTier(life, uid, def!.tool) < def!.tier) fail(GROWTH_REJECT.gateTool);
      cleared[a.gate] = { actor, at: now };
      const text = `${josaGa(nameOf(actor))} ${def!.name}를 쪼개 길을 열었어요`;
      addMemory(life, now, 'area', [actor], text);
      addNews(life, now, `gate:${a.gate}`, 'growth', text, [actor]);
      gainXp(life, uid, 'forage', NODE_XP.stump, now);
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
  /** Talents taken, points earned (≤ 5) and still free (absent from older servers). */
  tal?: string[];
  points?: number;
  left?: number;
  /** The next 운명 다시 보기 of this skill (신이치). */
  respec?: number;
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
  /** 성장 P2 regions (absent from older servers). */
  regions?: RegionsView;
  /** Friends' skill trees, read-only (친구 창 → 기술; absent from older servers). */
  friends?: FriendTreeView[];
};
export type FriendTreeView = { actor: number; skills: { id: SkillId; level: number; prof: string[]; tal: string[] }[] };
/** Every other friend's levels, professions and talents (the 친구 창's tree view). */
export function friendTrees(life: LifeState, uid: string): FriendTreeView[] {
  return Object.entries(life.actors)
    .filter(([id]) => id !== uid)
    .map(([id, actor]) => {
      const u = rawUser(life, id);
      return {
        actor,
        skills: SKILLS.map((s) => ({
          id: s,
          level: skillLevel(life, id, s),
          prof: (u?.prof ?? []).filter((p) => PROF_BY_ID[p]?.skill === s),
          tal: (u?.tal ?? []).filter((t) => TALENT_BY_ID[t]?.skill === s),
        })),
      };
    })
    .sort((a, b) => a.actor - b.actor);
}
export type RegionsView = {
  /**
   * 승준's temporary explorer pass (lounge-explorer-pass.ts): the fallen log
   * lets him through and every mine floor is his to pick (the rocks still
   * need the pickaxe). Only present while it is his and valid.
   */
  pass?: true;
  hill: { open: boolean; nodes: { id: string; kind: NodeKind; x: number; z: number; taken: boolean }[] };
  woods: {
    open: boolean;
    cleared: { actor: number; at: number } | null;
    nodes: { id: string; kind: NodeKind; x: number; z: number; taken: boolean }[];
  };
  mine: {
    open: boolean;
    lift: boolean;
    at: number;
    deep: number;
    /** Rocks I broke today per floor. */
    broken: Record<number, number[]>;
    /** The ladder down on my current floor has shown today (always, above the bottom, with the explorer pass). */
    ladder: boolean;
    /** Friends in the mine today: actor → floor. */
    friends: Record<number, number>;
    pickaxe: number;
    /** 재능 광맥 냄새: today's vein floor (absent without it). */
    vein?: number;
    /** 재능 사다리 감: rocks fewer before a ladder shows. */
    less?: number;
  };
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
      tal: (u.tal ?? []).filter((t) => TALENT_BY_ID[t]?.skill === id),
      points: talentPoints(level),
      left: ok ? talentsLeft(life, uid, id) : 0,
      respec: respecPrice(u.resp?.[id] ?? 0),
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
    respecPrice: respecPrice(0),
    softCap: ok ? xpSoftCap(life, uid, now) : SOFT_CAP,
    regions: regionsView(life, uid, u, taken, now),
    friends: friendTrees(life, uid),
  };
}
function regionsView(life: LifeState, uid: string, u: GrowthUser, taken: Set<string>, now: number): RegionsView {
  const day = kstDay(now),
    ok = UUID.test(uid) && uid in life.actors;
  const nodes = (area: NodeArea) =>
    ok && areaOpen(life, area, now, uid) ? nodesFor(life, uid, day, area).map((n) => ({ ...n, taken: taken.has(n.id) })) : [];
  const broken: Record<number, number[]> = {};
  for (const k of u.mrock ?? []) {
    const [f, r] = k.split(':').map(Number);
    (broken[f] ??= []).push(r);
  }
  const friends: Record<number, number> = {};
  for (const [id, x] of Object.entries(life.growth?.u ?? {}))
    if (id !== uid && id in life.actors && x.day === myDay(life, id, now) && (x.mine?.at ?? 0) > 0) friends[life.actors[id]] = x.mine!.at;
  const at = u.mine?.at ?? 0;
  const pass = ok && hasExplorerPass(life.actors[uid], now);
  return {
    ...(pass ? { pass: true as const } : {}),
    hill: { open: areaOpen(life, 'hill', now, uid), nodes: nodes('hill') },
    woods: { open: areaOpen(life, 'woods', now, uid), cleared: life.growth?.c?.woods ?? null, nodes: nodes('woods') },
    mine: {
      open: areaOpen(life, 'mine', now, uid),
      lift: researchDone(life, 'lift', now),
      at,
      deep: u.mine?.deep ?? 0,
      broken,
      ladder: ok && at > 0 && (ladderFound(life, uid, at, now) || (pass && at < MINE_FLOORS_P2)),
      friends,
      pickaxe: ok ? toolTier(life, uid, 'pickaxe') : 1,
      ...(ok && growthMods(life, uid).veinHint ? { vein: veinFloor(day, researchDone(life, 'lift', now)) } : {}),
      ...(ok && growthMods(life, uid).ladderEarly ? { less: growthMods(life, uid).ladderEarly } : {}),
    },
  };
}
/** Item ids the growth screens name (materials must exist in the item catalog). */
export const growthItemName = (id: string) => ITEM_BY_ID[id]?.name ?? id;
