// 우리 농장 F3 (handover/design/design-our-farm.md §10, §11): the generic
// facility sites — static data only. A site knows its size and where it is
// (lounge-farm-sites-layout.ts); a facility kind (FacilityDef) says what can
// stand on which size, what opens it, what it costs, its upgrades and slots,
// and which daily hook (`daily`) the server's day settle calls for it. New
// facilities are rows in FACILITIES plus, when they make something every day,
// one entry in the engine's daily table (lounge-farm-sites.ts DAILY).
//
// A leaf module (growth ids and calendar types only), so lounge-life.ts can
// list the action kinds at load time and the UI can read the table.
import type { Season } from './lounge-calendar.ts';
import type { SkillId } from './lounge-growth-data.ts';

// ---------------------------------------------------------------- sites
export type SiteSize = 'small' | 'medium' | 'large';
/** Tiles of a site (one tile is one world unit, like a field tile). */
export const SITE_TILES: Readonly<Record<SiteSize, { cols: number; rows: number }>> = {
  small: { cols: 4, rows: 4 },
  medium: { cols: 6, rows: 6 },
  large: { cols: 10, rows: 8 },
};
export const SITE_SIZE_NAME: Readonly<Record<SiteSize, string>> = { small: '작은 부지', medium: '중간 부지', large: '큰 부지' };
/**
 * Shared site ids (east and south edges of the farm) and the personal ones:
 * two small sites per friend under their field (P, and Q since F5 brought the
 * 양식장 and the 품종 개량소, so a friend can keep an orchard and a pond).
 */
export const SHARED_SITE_IDS = ['L1', 'L2', 'M1', 'M2', 'M3', 'M4', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'] as const;
export const personalSiteId = (actor: number) => `P${actor}`;
/** A friend's second personal site (F5). */
export const secondSiteId = (actor: number) => `Q${actor}`;
export const PERSONAL_SITE_IDS = [0, 1, 2, 3, 4, 5, 6].flatMap((a) => [personalSiteId(a), secondSiteId(a)]);
export const SITE_IDS: readonly string[] = [...SHARED_SITE_IDS, ...PERSONAL_SITE_IDS];
/** Size of a site by id (L = large, M = medium, S / P / Q = small). */
export const siteSize = (id: string): SiteSize | null =>
  !SITE_IDS.includes(id) ? null : id[0] === 'L' ? 'large' : id[0] === 'M' ? 'medium' : 'small';
/** The actor a personal site belongs to, or null for a shared site. */
export const siteActor = (id: string): number | null => (/^[PQ][0-6]$/.test(id) ? Number(id[1]) : null);

// ---------------------------------------------------------------- facilities
export type FacilityId =
  | 'greenhouse'
  | 'machineYard'
  | 'orchardPlot'
  | 'greenhouseMini'
  // Hooks for later stages (shown as 준비 중, not buildable yet).
  | 'barn'
  | 'coop'
  | 'fishPond'
  | 'beeYard'
  | 'mushroomCave'
  | 'seedLab';
/** Daily hooks the server's day settle may call (lounge-farm-sites.ts DAILY). */
export type DailyId = 'orchard' | 'barn' | 'coop' | 'fishPond' | 'beeYard' | 'mushroomCave' | 'seedLab';
export type FacilityCost = { beom: number; mats: Readonly<Record<string, number>> };
export type FacilityUnlock = {
  /** A skill level the builder needs (shared: whoever starts it). */
  skill?: SkillId;
  level?: number;
  /** A 마을 개척 project that must be finished (its village flag). */
  research?: string;
  /** A village flag (bundles, projects). */
  flag?: string;
};
export type FacilityDef = {
  id: FacilityId;
  name: string;
  size: SiteSize;
  /** Shared: friends fund it together like 마을 개척. Personal: the site's owner pays alone. */
  owner: 'shared' | 'personal';
  unlock: FacilityUnlock;
  build: FacilityCost;
  /** Tier 2, 3… (tier 1 is the build); `level`: the unlock skill's level the tier needs (양식장 중간 연못: 낚시 Lv8). */
  upgrades?: readonly (FacilityCost & { tier: number; effect: string; level?: number })[];
  /** Per tier (index = tier − 1): machine slots, tiles, trees, animals… */
  slots?: readonly number[];
  daily?: DailyId;
  /** kArchive model or procedural set id (lounge-farm-sites-3d.ts). */
  model: string;
  /** What it does (build list). */
  note: string;
  /** false: a hook for a later stage (listed, not buildable). */
  live: boolean;
  /** When a hook arrives ('F4' …). */
  stage?: string;
};
export const FACILITIES: readonly FacilityDef[] = [
  {
    id: 'greenhouse',
    name: '공용 온실',
    size: 'large',
    owner: 'shared',
    unlock: { flag: 'greenhouse' },
    build: { beom: 150_000, mats: { wood: 120, stone: 80, copper: 20 } },
    slots: [24],
    model: 'greenhouse',
    note: '온실 칸 24개. 온실 안에서만 계절과 상관없이 심을 수 있어요. 한 사람 4칸까지 내 작물, 남는 칸은 공용 작물(공동 창고로)',
    live: true,
  },
  {
    id: 'machineYard',
    name: '가공 마당',
    size: 'medium',
    owner: 'shared',
    unlock: {},
    build: { beom: 40_000, mats: { wood: 60, stone: 40 } },
    upgrades: [
      { tier: 2, beom: 200_000, mats: { wood: 150, stone: 100, copper: 30 }, effect: '친구마다 기계 칸 8개' },
      { tier: 3, beom: 500_000, mats: { wood: 200, iron: 40, gold: 10 }, effect: '친구마다 기계 칸 12개' },
    ],
    slots: [4, 8, 12],
    model: 'machineYard',
    note: '친구마다 기계를 놓는 마당. 기계 칸 4 → 8 → 12',
    live: true,
  },
  {
    id: 'orchardPlot',
    name: '과일나무 자리',
    size: 'small',
    owner: 'personal',
    unlock: { skill: 'farm', level: 4 },
    build: { beom: 30_000, mats: { wood: 40, fertilizer: 5 } },
    slots: [3],
    daily: 'orchard',
    model: 'orchard',
    note: '묘목 3그루. 심고 28일 뒤부터 제철마다 매일 과일이 하나씩 열려요(나무마다 3개까지)',
    live: true,
  },
  {
    id: 'greenhouseMini',
    name: '개인 온실',
    size: 'small',
    owner: 'personal',
    unlock: { skill: 'farm', level: 7 },
    build: { beom: 300_000, mats: { wood: 100, copper: 30, iron: 10 } },
    slots: [12],
    model: 'greenhouseMini',
    note: '4 × 3 = 12칸, 계절과 상관없이 자라요',
    live: true,
  },
  // ---- hooks for later stages (data only; design-our-farm.md §4, §10-3, §10-4, §11-3)
  {
    id: 'barn',
    name: '축사',
    size: 'large',
    owner: 'shared',
    unlock: { research: 'ranch' },
    build: { beom: 300_000, mats: { wood: 300, stone: 150 } },
    slots: [8],
    daily: 'barn',
    model: 'barn',
    note: '소·양, 사일로와 건초, 거름',
    live: false,
    stage: '목장 울타리(V5) 뒤',
  },
  {
    id: 'coop',
    name: '닭장',
    size: 'medium',
    owner: 'shared',
    unlock: { research: 'ranch' },
    build: { beom: 120_000, mats: { wood: 150, stone: 50 } },
    slots: [8],
    daily: 'coop',
    model: 'coop',
    note: '닭과 달걀',
    live: false,
    stage: '목장 울타리(V5) 뒤',
  },
  {
    id: 'fishPond',
    name: '양식장',
    size: 'small',
    owner: 'personal',
    unlock: { skill: 'fish', level: 5 },
    build: { beom: 80_000, mats: { stone: 80, wood: 30 } },
    upgrades: [{ tier: 2, beom: 200_000, mats: { stone: 120, copper: 20 }, effect: '중간 연못 · 물고기 10마리까지', level: 8 }],
    slots: [5, 10],
    daily: 'fishPond',
    model: 'fishPond',
    note: '내가 잡은 물고기 한 마리를 넣으면 며칠마다 한 마리씩 늘고, 매일 물고기나 어란을 줘요. 작은 연못 5마리, 낚시 Lv8 중간 연못 10마리',
    live: true,
  },
  {
    id: 'beeYard',
    name: '양봉장',
    size: 'small',
    owner: 'shared',
    unlock: { skill: 'forage', level: 4 },
    build: { beom: 60_000, mats: { wood: 80 } },
    slots: [4],
    daily: 'beeYard',
    model: 'beeYard',
    note: '벌통 여러 개, 근처 꽃에 따라 꿀 맛이 달라요',
    live: false,
    stage: '다음 공사',
  },
  {
    id: 'mushroomCave',
    name: '버섯 동굴',
    size: 'small',
    owner: 'shared',
    unlock: { skill: 'forage', level: 6 },
    build: { beom: 80_000, mats: { stone: 150, wood: 60 } },
    daily: 'mushroomCave',
    model: 'mushroomCave',
    note: '매일 버섯',
    live: false,
    stage: '다음 공사',
  },
  {
    id: 'seedLab',
    name: '품종 개량소',
    size: 'small',
    owner: 'personal',
    unlock: { skill: 'farm', level: 8 },
    build: { beom: 200_000, mats: { wood: 80, iron: 20 } },
    slots: [2],
    model: 'seedLab',
    note: '같은 작물 5개 → 개량 씨앗 1개(4시간), 하루 2번. 개량 씨앗은 금별이 잘 나오고, 한 두둑을 다 심으면 대형 작물이 두 배로 잘 돼요',
    live: true,
  },
];
export const FACILITY_BY_ID: Readonly<Record<string, FacilityDef>> = Object.fromEntries(FACILITIES.map((f) => [f.id, f]));
export const isFacilityId = (id: unknown): id is FacilityId => typeof id === 'string' && Object.hasOwn(FACILITY_BY_ID, id);
/** Highest tier of a facility (1 + its upgrades). */
export const maxTier = (def: FacilityDef) => 1 + (def.upgrades?.length ?? 0);
/** What tier `tier` costs (1 = the build). */
export const tierCost = (def: FacilityDef, tier: number): FacilityCost | null =>
  tier === 1 ? def.build : (def.upgrades?.find((u) => u.tier === tier) ?? null);
/** Slots at a tier (the last listed value holds for higher tiers). */
export const slotsAt = (def: FacilityDef, tier: number) => {
  const s = def.slots ?? [];
  return s.length ? s[Math.max(0, Math.min(s.length, tier) - 1)] : 0;
};
/** Facilities that may stand on a site (size and owner match). */
export const facilitiesFor = (siteId: string) => {
  const size = siteSize(siteId),
    personal = siteActor(siteId) !== null;
  return FACILITIES.filter((f) => f.size === size && (f.owner === 'personal') === personal);
};

/** What the unlock check reads (the server from the life state, the UI from the view). */
export type UnlockCtx = { flags: readonly string[]; level: (skill: SkillId) => number };
const SKILL_NAME: Readonly<Record<SkillId, string>> = { farm: '농사', fish: '낚시', forage: '채집', mine: '광업', craft: '솜씨', ranch: '목축' };
const FLAG_NAME: Readonly<Record<string, string>> = { greenhouse: '꾸러미 “여름 수확 꾸러미” 완성', ranch: '마을 개척 “목장 울타리” 완공' };
/** The unlock line of a facility ('농사 Lv4', '꾸러미 “여름 수확 꾸러미” 완성'), or '' when always open. */
export function unlockText(def: FacilityDef) {
  const u = def.unlock,
    out: string[] = [];
  if (u.skill && u.level) out.push(`${SKILL_NAME[u.skill]} Lv${u.level}`);
  if (u.research) out.push(FLAG_NAME[u.research] ?? `마을 개척 “${u.research}”`);
  if (u.flag) out.push(FLAG_NAME[u.flag] ?? u.flag);
  return out.join(' · ');
}
/** Why tier `tier` of a built facility cannot be reached by this builder yet (null = open). */
export function upgradeBlock(def: FacilityDef, tier: number, ctx: UnlockCtx): string | null {
  const up = def.upgrades?.find((u) => u.tier === tier),
    skill = def.unlock.skill;
  if (up?.level && skill && ctx.level(skill) < up.level) return `${SKILL_NAME[skill]} Lv${up.level}부터 넓힐 수 있어요.`;
  return null;
}
/** Why a facility is locked for this builder (null = open). Levels only open, building still costs. */
export function unlockBlock(def: FacilityDef, ctx: UnlockCtx): string | null {
  if (!def.live) return `준비 중 · ${def.stage ?? '다음 공사'}`;
  const u = def.unlock;
  if (u.skill && u.level && ctx.level(u.skill) < u.level) return `${SKILL_NAME[u.skill]} Lv${u.level}부터 지을 수 있어요.`;
  if (u.research && !ctx.flags.includes(u.research)) return `${unlockText(def)} 뒤에 지을 수 있어요.`;
  if (u.flag && !ctx.flags.includes(u.flag)) return `${unlockText(def)} 뒤에 지을 수 있어요.`;
  return null;
}

// ---------------------------------------------------------------- numbers
/** Smallest 범 gift to a shared build (or what is left), like 마을 개척. */
export const SITE_MIN_BEOM = 1_000;
/** Demolishing gives back this share of the materials (범 is not refunded). */
export const DEMOLISH_REFUND = 0.5;
/** 공용 온실: tiles one friend may grow for themselves; the rest grow for the shared store. */
export const GREENHOUSE_PER_FRIEND = 4;
export const GREENHOUSE_COLS = 6;
export const GREENHOUSE_ROWS = 4;
export const MINI_GREENHOUSE_COLS = 4;
export const MINI_GREENHOUSE_ROWS = 3;
/** 과일나무 자리: a sapling bears from this many KST days after planting, in its season. */
export const ORCHARD_PLOT_DAYS = 28;
/** Fruit one tree holds before it is picked. */
export const ORCHARD_PLOT_HOLD = 3;
/** Days the settle looks back (a quiet farm does not grow fruit forever). */
export const SETTLE_BACK_DAYS = 7;
/** Machine slots without a machine yard (the work yard by the house). */
export const BASE_WORK_SLOTS = 4;
/** Machine slots a friend may ever hold (machine yard tier 3). */
export const MAX_WORK_SLOTS = 12;

// ---------------------------------------------------------------- 공동 밭 (§3-5)
export const COMMON_COLS = 6;
export const COMMON_ROWS = 6;
export const COMMON_TILES = COMMON_COLS * COMMON_ROWS;
/** Giant beds of the shared field: 3 × 2 blocks (2 across, 3 down). */
export const COMMON_BEDS = 6;
export const commonBedTiles = (bed: number) => {
  const r0 = Math.floor(bed / 2) * 2,
    c0 = (bed % 2) * 3;
  return [0, 1].flatMap((dr) => [0, 1, 2].map((dc) => (r0 + dr) * COMMON_COLS + c0 + dc));
};
export const commonTileBed = (tile: number) => {
  const r = Math.floor(tile / COMMON_COLS),
    c = tile % COMMON_COLS;
  return Math.floor(r / 2) * 2 + Math.floor(c / 3);
};
/** 마을 대형 작물: the shared field's giant chance (%), up from the private 8%. */
export const COMMON_GIANT_CHANCE = 25;
/** Giant crops the shared field must grow in one season for the 마을 대형 작물 goal. */
export const COMMON_GOAL_GIANTS = 2;
/** Farm XP each helper gets when the season's goal is reached. */
export const COMMON_GOAL_XP = 60;
/** Kinds of crops (with quality) the shared store keeps. */
export const STORE_KINDS_MAX = 64;
/** Season cycles the goal history keeps. */
export const COMMON_GOAL_HISTORY = 4;
export const COMMON_GOAL_CROPS: Readonly<Record<Season, string>> = {
  spring: '대형 양배추',
  summer: '대형 수박',
  autumn: '대형 호박',
  winter: '대형 양배추',
};

// ---------------------------------------------------------------- actions
export const SITE_ACTION_KINDS = [
  'siteBuild',
  'siteGive',
  'siteUpgrade',
  'siteDemolish',
  'sitePlant',
  'siteWater',
  'siteHarvest',
  'siteTree',
  'siteFruit',
  'commonTill',
  'commonPlant',
  'commonWater',
  'commonHarvest',
  // 우리 농장 F5: 양식장 (lounge-farm-pond.ts) and 품종 개량소 (lounge-farm-seedlab.ts).
  'pondStock',
  'pondCollect',
  'pondGive',
  'pondEmpty',
  'labLoad',
  'labCollect',
] as const;
export type SiteActionKind = (typeof SITE_ACTION_KINDS)[number];
