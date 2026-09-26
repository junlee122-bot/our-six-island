// 성장 (tech tree P1) static data: the five personal skills (XP curve, daily
// cap, catch-up rules, level perks, professions), the blacksmith's tools and
// tiers, the shared 마을 개척 research, the ores and the daily material nodes
// (bushes, logs, rocks) around the village edge. A leaf module: no imports, so
// lounge-items.ts (ore items, flags, action kinds) and the engines can use it
// at module top level without touching the lounge-life import cycle.
// Engine: lounge-growth.ts. UI: lounge/GrowthPanel.tsx, lounge/Forge.tsx.

// ---------------------------------------------------------------- skills
export type SkillId = 'farm' | 'fish' | 'forage' | 'mine' | 'craft';
export const SKILLS: readonly SkillId[] = ['farm', 'fish', 'forage', 'mine', 'craft'];
export const SKILL_INFO: Record<SkillId, { name: string; verb: string; note: string; color: string }> = {
  farm: { name: '농사', verb: '심고 가꾸고 거두기', note: '물 주기와 수확에서 자라요. 오래 자라는 작물, 은별·금별일수록 더 많이.', color: '#5f8a55' },
  fish: { name: '낚시', verb: '물고기 낚기', note: '낚을 때마다 자라요. 드문 물고기일수록 훨씬 많이, 놓쳐도 조금.', color: '#4f8aa6' },
  forage: { name: '채집', verb: '줍고 잡고 베기', note: '채집·곤충 잡기와 마을 가장자리 잡목·통나무 베기에서 자라요.', color: '#a07a3c' },
  mine: { name: '광업', verb: '바위 깨기', note: '마을 가장자리 바위를 깨면 자라요. 구리가 나오면 더. 광산은 다음 개척에서 열려요.', color: '#7a7f8c' },
  craft: { name: '솜씨', verb: '요리하고 만들기', note: '요리와 제작 한 번마다 자라요.', color: '#c2703a' },
};
export const MAX_LEVEL = 10;
/** Cumulative XP for Lv1..Lv10 (index = level − 1). */
export const LEVEL_XP = [0, 60, 160, 320, 560, 900, 1_400, 2_100, 3_100, 4_500] as const;
export const levelOf = (xp: number) => {
  let lv = 1;
  while (lv < MAX_LEVEL && xp >= LEVEL_XP[lv]) lv++;
  return lv;
};
/** XP a day counts in full per skill; past it each point counts OVER_CAP_RATE. */
export const SOFT_CAP = 200;
export const OVER_CAP_RATE = 0.2;
/** Rested XP: per skill per day away, at most REST_MAX; while it lasts XP is doubled. */
export const REST_PER_DAY = 100;
export const REST_MAX = 300;
/** Behind the village median level of a skill: XP ×CATCH_UP. */
export const CATCH_UP = 1.5;
/** Retro XP from lifetime stats is capped at this level (professions stay a choice). */
export const RETRO_LEVEL = 5;
export const RETRO_PER: Record<string, number> = { harvest: 4, fish: 4, forage: 5, bug: 4, cook: 6, craft: 4 };
/** Choosing again (both picks of one skill) costs this (a sink). */
export const RESPEC_PRICE = 50_000;
/** Base XP per action (before quality, catch-up, rest and the daily cap). */
export const XP = {
  water: 1,
  harvestBase: 2,
  harvestHourMax: 12,
  fishCommon: 3,
  fishUncommon: 6,
  fishRare: 12,
  fishLegend: 50,
  fishMiss: 1,
  forage: 5,
  bug: 4,
  bush: 3,
  log: 5,
  rock: 3,
  ore: 2,
  cook: 6,
  craft: 4,
} as const;
/** Fish XP by FishDef.weight (≥20 common, 10–19 uncommon, 2–9 rare, ≤1 legend). */
export const fishXp = (weight: number) =>
  weight <= 1 ? XP.fishLegend : weight < 10 ? XP.fishRare : weight < 20 ? XP.fishUncommon : XP.fishCommon;

// ---------------------------------------------------------------- modifiers
/** Everything skills, professions and tools change in the engines (0 = none). */
export type GrowthMods = {
  /** % faster growth for crops planted now. */
  growSpeed: number;
  /** Gold-star chance +%p for crops planted now. */
  goldPts: number;
  /** Watering speed-up +%p (on top of WATER_SPEEDUP 40%). */
  waterPts: number;
  /** Seasonal crops may be planted in any season on my own farm. */
  offSeason: boolean;
  /** Crop sale price bonus (share, 0.1 = +10%). */
  cropSell: number;
  /** Extra bonus for silver/gold crops. */
  starSell: number;
  /** Bite window ×(1 + x). */
  biteWindow: number;
  /** Legendary fish weight ×(1 + x). */
  legend: number;
  /** Rare fish at sea / harbor / rocks ×(1 + x). */
  seaRare: number;
  /** Extra bait per bait craft. */
  baitExtra: number;
  /** Chance (0–1) a cast keeps its bait. */
  baitKeep: number;
  /** Fish sale price bonus. */
  fishSell: number;
  /** Chance (0–1) a forage gives one more. */
  forageDouble: number;
  /** Flowers always give two. */
  flowerDouble: boolean;
  /** Extra wood per bush/log. */
  woodBonus: number;
  /** Wood ×. */
  woodMult: number;
  /** Stone ×. */
  stoneMult: number;
  /** Copper chance +%p on rocks. */
  copperPts: number;
  /** Extra copper when a rock gives copper. */
  oreBonus: number;
  /** Copper × when found. */
  oreMult: number;
  /** Extra daily bush / rock nodes. */
  extraBush: number;
  extraRock: number;
  /** Chance (0–1) a cook makes one more. */
  cookExtra: number;
  /** Share of craft materials saved (per input, rounded down, ≥1 kept). */
  craftDiscount: number;
  /** Dish buff lasts until 06:00 KST the next day. */
  longBuff: boolean;
  /** Dish sale price bonus. */
  dishSell: number;
  /** Tool upgrade: share of ore saved / share of 범 saved. */
  toolOre: number;
  toolBeom: number;
  /** Extra fertilizer per fertilizer craft (농사 Lv2). */
  fertExtra: number;
  /** Deluxe fertilizer needs one less fertilizer (농사 Lv7). */
  deluxeCheap: boolean;
};
export const NO_MODS: Readonly<GrowthMods> = Object.freeze({
  growSpeed: 0,
  goldPts: 0,
  waterPts: 0,
  offSeason: false,
  cropSell: 0,
  starSell: 0,
  biteWindow: 0,
  legend: 0,
  seaRare: 0,
  baitExtra: 0,
  baitKeep: 0,
  fishSell: 0,
  forageDouble: 0,
  flowerDouble: false,
  woodBonus: 0,
  woodMult: 1,
  stoneMult: 1,
  copperPts: 0,
  oreBonus: 0,
  oreMult: 1,
  extraBush: 0,
  extraRock: 0,
  cookExtra: 0,
  craftDiscount: 0,
  longBuff: false,
  dishSell: 0,
  toolOre: 0,
  toolBeom: 0,
  fertExtra: 0,
  deluxeCheap: false,
});
type ModPatch = Partial<GrowthMods>;

// ---------------------------------------------------------------- level perks
/** One small unlock per level (numbers stay small; `soon` = arrives with a later region). */
export type LevelPerk = { level: number; text: string; mods?: ModPatch; soon?: string };
export const LEVEL_PERKS: Record<SkillId, readonly LevelPerk[]> = {
  farm: [
    { level: 2, text: '퇴비 · 비료를 만들면 1개 더', mods: { fertExtra: 1 } },
    { level: 3, text: '괭이 손맛 · 금별 확률 +2%p', mods: { goldPts: 2 } },
    { level: 4, text: '옹기 레시피', soon: '과수원 언덕' },
    { level: 5, text: '전문가 선택 ①' },
    { level: 6, text: '기본 스프링클러', soon: '기상 관측소' },
    { level: 7, text: '고급 비료 재료 −1', mods: { deluxeCheap: true } },
    { level: 8, text: '품질 스프링클러', soon: '기상 관측소' },
    { level: 9, text: '씨앗 제조기', soon: '목장 초원' },
    { level: 10, text: '전문가 선택 ②' },
  ],
  fish: [
    { level: 2, text: '미끼 제작 3→4개', mods: { baitExtra: 1 } },
    { level: 3, text: '통발 레시피', soon: '광산 승강기' },
    { level: 4, text: '입질 창 +5%', mods: { biteWindow: 0.05 } },
    { level: 5, text: '전문가 선택 ①' },
    { level: 6, text: '통발 +1', soon: '광산 승강기' },
    { level: 7, text: '입질 창 +5% 더', mods: { biteWindow: 0.05 } },
    { level: 8, text: '희귀 물고기 알림', soon: '기상 관측소' },
    { level: 9, text: '전설 물고기 힌트 편지', soon: '여섯섬 항로' },
    { level: 10, text: '전문가 선택 ②' },
  ],
  forage: [
    { level: 2, text: '나무 바구니 가구', soon: '과수원 언덕' },
    { level: 3, text: '잡목 1곳 더 (매일)', mods: { extraBush: 1 } },
    { level: 4, text: '벌통 레시피', soon: '과수원 언덕' },
    { level: 5, text: '전문가 선택 ①' },
    { level: 6, text: '채집할 때 10% 확률로 하나 더', mods: { forageDouble: 0.1 } },
    { level: 7, text: '계절 씨앗 제작', soon: '과수원 언덕' },
    { level: 8, text: '잡목에서 나무 +1', mods: { woodBonus: 1 } },
    { level: 9, text: '산삼 표시', soon: '숲 깊은 곳' },
    { level: 10, text: '전문가 선택 ②' },
  ],
  mine: [
    { level: 2, text: '돌 계단 장식', soon: '산길 정비' },
    { level: 3, text: '구리 확률 +3%p', mods: { copperPts: 3 } },
    { level: 4, text: '바위 1곳 더 (매일)', mods: { extraRock: 1 } },
    { level: 5, text: '전문가 선택 ①' },
    { level: 6, text: '보석 판독', soon: '광산 승강기' },
    { level: 7, text: '큰 망치 (바위 3×3)', soon: '산길 정비' },
    { level: 8, text: '구리 확률 +3%p 더', mods: { copperPts: 3 } },
    { level: 9, text: '승강기로 가장 깊은 층', soon: '광산 승강기' },
    { level: 10, text: '전문가 선택 ②' },
  ],
  craft: [
    { level: 2, text: '요리할 때 5% 확률로 하나 더', mods: { cookExtra: 0.05 } },
    { level: 3, text: '제작 재료 −10%', mods: { craftDiscount: 0.1 } },
    { level: 4, text: '숙성통 레시피', soon: '과수원 언덕' },
    { level: 5, text: '전문가 선택 ①' },
    { level: 6, text: '베틀', soon: '목장 초원' },
    { level: 7, text: '새 요리 3종', soon: '온천 발굴' },
    { level: 8, text: '원목 가구 레시피 4종', soon: '산길 정비' },
    { level: 9, text: '자개 가구 레시피 4종', soon: '깊은 굴' },
    { level: 10, text: '전문가 선택 ②' },
  ],
};

// ---------------------------------------------------------------- professions
export type ProfDef = {
  id: string;
  skill: SkillId;
  /** 5 = first pick; 10 = second pick (under `parent`). */
  level: 5 | 10;
  parent?: string;
  name: string;
  text: string;
  mods: ModPatch;
};
const prof = (id: string, skill: SkillId, level: 5 | 10, name: string, text: string, mods: ModPatch, parent?: string): ProfDef => ({
  id,
  skill,
  level,
  name,
  text,
  mods,
  ...(parent ? { parent } : {}),
});
export const PROFESSIONS: readonly ProfDef[] = [
  prof('farm-a', 'farm', 5, '정원사', '새로 심는 작물이 10% 빨리 자라요', { growSpeed: 10 }),
  prof('farm-b', 'farm', 5, '장터 농부', '작물 판매가 +10%', { cropSell: 0.1 }),
  prof('farm-a1', 'farm', 10, '금손', '금별 확률 +8%p', { goldPts: 8 }, 'farm-a'),
  prof('farm-a2', 'farm', 10, '온실지기', '내 밭에는 철 지난 작물도 심어요', { offSeason: true }, 'farm-a'),
  prof('farm-b1', 'farm', 10, '명인', '은별·금별 작물 판매가 +20% 더', { starSell: 0.2 }, 'farm-b'),
  prof('farm-b2', 'farm', 10, '큰손 농부', '작물 판매가 +15% 더', { cropSell: 0.15 }, 'farm-b'),
  prof('fish-a', 'fish', 5, '어부', '입질 창이 15% 넓어져요', { biteWindow: 0.15 }),
  prof('fish-b', 'fish', 5, '미끼꾼', '미끼 제작 +2개, 미끼가 30% 확률로 남아요', { baitExtra: 2, baitKeep: 0.3 }),
  prof('fish-a1', 'fish', 10, '낚시왕', '전설 물고기 확률 ×1.5', { legend: 0.5 }, 'fish-a'),
  prof('fish-a2', 'fish', 10, '바다사나이', '바다·항구·갯바위 희귀 물고기 ×1.3', { seaRare: 0.3 }, 'fish-a'),
  prof('fish-b1', 'fish', 10, '미끼 연구가', '미끼가 남을 확률 60%', { baitKeep: 0.3 }, 'fish-b'),
  prof('fish-b2', 'fish', 10, '수산 시장', '물고기 판매가 +15%', { fishSell: 0.15 }, 'fish-b'),
  prof('forage-a', 'forage', 5, '약초꾼', '채집할 때 25% 확률로 하나 더', { forageDouble: 0.25 }),
  prof('forage-b', 'forage', 5, '나무꾼', '잡목·통나무에서 나무 +1', { woodBonus: 1 }),
  prof('forage-a1', 'forage', 10, '심마니', '하나 더 확률 50%로', { forageDouble: 0.25 }, 'forage-a'),
  prof('forage-a2', 'forage', 10, '꽃집', '꽃은 늘 두 송이', { flowerDouble: true }, 'forage-a'),
  prof('forage-b1', 'forage', 10, '벌목왕', '나무 두 배', { woodMult: 2 }, 'forage-b'),
  prof('forage-b2', 'forage', 10, '숲지기', '매일 잡목 2곳 더', { extraBush: 2 }, 'forage-b'),
  prof('mine-a', 'mine', 5, '광부', '구리가 나오면 +1', { oreBonus: 1 }),
  prof('mine-b', 'mine', 5, '탐광꾼', '구리 확률 +10%p', { copperPts: 10 }),
  prof('mine-a1', 'mine', 10, '대장장이', '도구 광석 비용 −25%', { toolOre: 0.25 }, 'mine-a'),
  prof('mine-a2', 'mine', 10, '돌깨기 명수', '돌 두 배', { stoneMult: 2 }, 'mine-a'),
  prof('mine-b1', 'mine', 10, '구리맥', '구리가 나오면 두 배', { oreMult: 2 }, 'mine-b'),
  prof('mine-b2', 'mine', 10, '부지런한 광부', '매일 바위 2곳 더', { extraRock: 2 }, 'mine-b'),
  prof('craft-a', 'craft', 5, '요리사', '요리할 때 20% 확률로 하나 더', { cookExtra: 0.2 }),
  prof('craft-b', 'craft', 5, '공예가', '제작 재료 −25%', { craftDiscount: 0.25 }),
  prof('craft-a1', 'craft', 10, '미식가', '요리 효과가 다음 날 아침 6시까지', { longBuff: true }, 'craft-a'),
  prof('craft-a2', 'craft', 10, '잔치꾼', '요리 판매가 +25%', { dishSell: 0.25 }, 'craft-a'),
  prof('craft-b1', 'craft', 10, '목수', '제작 재료 −40%', { craftDiscount: 0.15 }, 'craft-b'),
  prof('craft-b2', 'craft', 10, '대장간 단골', '도구 업그레이드 범 −20%', { toolBeom: 0.2 }, 'craft-b'),
];
export const PROF_BY_ID: Readonly<Record<string, ProfDef>> = Object.fromEntries(PROFESSIONS.map((p) => [p.id, p]));
export const isProfId = (id: unknown): id is string =>
  typeof id === 'string' && Object.prototype.hasOwnProperty.call(PROF_BY_ID, id);
/** Picks offered for a skill at a level ('' parent = the Lv5 pair). */
export const profChoices = (skill: SkillId, parent?: string) =>
  PROFESSIONS.filter((p) => p.skill === skill && (parent ? p.parent === parent : p.level === 5));

/** Adds a patch onto mods (numbers add, multipliers multiply, flags or). */
export function addMods(into: GrowthMods, patch: ModPatch) {
  for (const [k, v] of Object.entries(patch) as [keyof GrowthMods, number | boolean][]) {
    if (typeof v === 'boolean') (into[k] as boolean) = (into[k] as boolean) || v;
    else if (k === 'woodMult' || k === 'stoneMult' || k === 'oreMult') (into[k] as number) = (into[k] as number) * v;
    else (into[k] as number) = (into[k] as number) + v;
  }
  return into;
}

// ---------------------------------------------------------------- ores
/** Ore items (inventory ids). Only copper drops in the village (P1). */
export const ORE_ITEMS = [
  { id: 'copper', name: '구리 광석', sell: 30, note: '마을 가장자리 바위에서 가끔 나와요. 대장간 2단계 도구 재료.' },
  { id: 'iron', name: '철 광석', sell: 60, note: '뒷산 광산 6층부터 나와요. (다음 개척)' },
  { id: 'gold', name: '금 광석', sell: 150, note: '광산 11층부터 나와요. (다음 개척)' },
  { id: 'gem', name: '보석 원석', sell: 300, note: '광산 깊은 곳에서 드물게 나와요. (다음 개척)' },
] as const;
export type OreId = (typeof ORE_ITEMS)[number]['id'];

// ---------------------------------------------------------------- tools
export type ToolId = 'can' | 'hoe' | 'rod' | 'axe' | 'pickaxe';
export const TOOLS: readonly ToolId[] = ['can', 'hoe', 'rod', 'axe', 'pickaxe'];
export type ToolTier = 1 | 2 | 3 | 4 | 5;
export const TIER_NAME: Record<ToolTier, string> = { 1: '헌', 2: '구리', 3: '철', 4: '금', 5: '별빛' };
export const TOOL_INFO: Record<ToolId, { name: string; skill: SkillId; tiers: Record<ToolTier, string> }> = {
  can: {
    name: '물뿌리개',
    skill: 'farm',
    tiers: { 1: '물 주면 남은 시간 40% 단축', 2: '45% 단축', 3: '50% 단축', 4: '55% 단축', 5: '60% 단축' },
  },
  hoe: {
    name: '괭이',
    skill: 'farm',
    tiers: { 1: '기본 품질', 2: '금별 확률 +3%p', 3: '+6%p', 4: '+9%p', 5: '+12%p' },
  },
  rod: {
    name: '낚싯대',
    skill: 'fish',
    tiers: { 1: '강·연못·호수', 2: '입질 창 ×1.25 · 폭포 소', 3: '입질 창 ×1.5 · 희귀 ×1.5', 4: '섬 깊은 바다 · 입질 창 ×1.75', 5: '전설 확률 ×1.3' },
  },
  axe: {
    name: '도끼',
    skill: 'forage',
    tiers: { 1: '잡목·통나무 베기', 2: '통나무 나무 +1 · 숲 통나무 치우기', 3: '나무 +2 · 큰 그루터기', 4: '나무 +50%', 5: '나무 두 배' },
  },
  pickaxe: {
    name: '곡괭이',
    skill: 'mine',
    tiers: { 1: '바위 깨기 · 광산 1~5층', 2: '구리 확률 +5%p · 6~10층', 3: '구리 +10%p · 11~15층', 4: '16~20층', 5: '21~30층 · 광석 +10%' },
  },
};
/** Upgrade to a tier: 범 + ore (tier 2 needs only copper, which the village rocks give). */
export const TOOL_COST: Record<2 | 3 | 4 | 5, { beom: number; mats: Readonly<Record<string, number>> }> = {
  2: { beom: 15_000, mats: { copper: 8 } },
  3: { beom: 50_000, mats: { iron: 8, copper: 4 } },
  4: { beom: 120_000, mats: { gold: 8, iron: 4 } },
  5: { beom: 250_000, mats: { gold: 10, gem: 2 } },
};
/** The rod keeps its fishing-shop path for tiers 2–3 (lounge-life-plus ROD_PRICE); 4–5 open with 여섯섬 항로. */
export const ROD_FORGE_FROM = 4;
/** Tool effects the engines read. */
export const WATER_TIER_PTS = [0, 0, 5, 10, 15, 20] as const;
export const HOE_TIER_PTS = [0, 0, 3, 6, 9, 12] as const;
export const AXE_TIER_WOOD = [0, 0, 1, 2, 2, 2] as const;
export const AXE_TIER_MULT = [1, 1, 1, 1, 1.5, 2] as const;
export const PICK_TIER_COPPER = [0, 0, 5, 10, 10, 10] as const;
/** When a tool left at the forge is ready: 06:00 KST the next calendar day. */
export const FORGE_READY_HOUR = 6;
/** Senior discount: a tool this many tiers below the village's best costs half. */
export const SENIOR_GAP = 2;
/** 촌장 편지 "첫 도구": break this many village rocks → a copper pickaxe, free. */
export const FIRST_TOOL_ROCKS = 10;

// ---------------------------------------------------------------- research
export type ResearchDef = {
  id: string;
  code: string;
  name: string;
  /** Village flag set when finished (lounge-items VILLAGE_FLAGS). */
  flag: string;
  requires: readonly string[];
  /** A bundle/project flag that must exist too (여섯섬 항로: 선착장). */
  requiresFlag?: string;
  beom: number;
  mats: Readonly<Record<string, number>>;
  /** What it opens (board card). */
  opens: string;
  /** Region preview line. */
  preview: string;
  /** false = shown as 준비 중 (its region ships in a later update). */
  live: boolean;
};
export const RESEARCH: readonly ResearchDef[] = [
  { id: 'forge', code: 'V1', name: '대장간 재건', flag: 'forge', requires: [], beom: 150_000, mats: { wood: 120, stone: 100 }, opens: '대장간과 무쇠 아저씨 · 도구 2단계', preview: '북서쪽 폭포 아래 무너진 공방을 다시 세워요. 맡긴 도구는 다음 날 아침 6시에 찾아요.', live: true },
  { id: 'trail', code: 'V2', name: '산길 정비', flag: 'trail', requires: ['forge'], beom: 250_000, mats: { wood: 150, stone: 200 }, opens: '뒷산 · 광산 1~10층 · 광업 확장', preview: '북쪽 돌담 틈으로 이어지는 산길 계단. 소나무 능선과 곰 동굴 광산 입구, 약수터.', live: false },
  { id: 'lift', code: 'V3', name: '광산 승강기', flag: 'lift', requires: ['trail'], beom: 350_000, mats: { copper: 60, stone: 150, wood: 100 }, opens: '광산 11~20층 · 5층마다 승강기 · 화석', preview: '광차 레일과 등불이 이어진 깊은 굴. 수정 동굴이 15층부터 반짝여요.', live: false },
  { id: 'orchardHill', code: 'V4', name: '과수원 언덕 개간', flag: 'orchardHill', requires: ['trail'], beom: 400_000, mats: { wood: 200, fertilizer: 30 }, opens: '과수원 언덕 · 친구마다 과일나무 3그루 · 벌통 명당', preview: '서쪽 과수원 너머 계단식 언덕과 원두막. 사과·배·감·복숭아.', live: false },
  { id: 'ranch', code: 'V5', name: '목장 울타리', flag: 'ranch', requires: ['orchardHill'], beom: 600_000, mats: { wood: 300, stone: 150, iron: 30 }, opens: '목장 초원 · 닭장·외양간 · 공동 외양간', preview: '윗물 여울 징검다리 건너 풍차와 곡물 창고가 있는 초원.', live: false },
  { id: 'weather', code: 'V8', name: '기상 관측소', flag: 'weather', requires: ['lift'], beom: 500_000, mats: { copper: 40, iron: 40 }, opens: '내일 날씨 예보 · 스프링클러 레시피', preview: '뒷산 능선의 작은 풍향계 관측소.', live: false },
  { id: 'onsen', code: 'V6', name: '온천 발굴', flag: 'onsen', requires: ['lift'], beom: 900_000, mats: { iron: 60, gold: 20, stone: 300 }, opens: '온천 마을 · 노곤노곤 버프', preview: '뒷산 동쪽 능선의 김 오르는 노천탕과 족욕.', live: false },
  { id: 'ferry', code: 'V7', name: '여섯섬 항로', flag: 'ferry', requires: ['ranch'], requiresFlag: 'dock', beom: 1_200_000, mats: { wood: 400, iron: 80, gold: 30 }, opens: '여섯섬 · 배 · 낚싯대 4·5단계', preview: '밤 항구에서 배를 타고 가는 야자수와 현무암 섬.', live: false },
  { id: 'deep', code: 'V9', name: '깊은 굴', flag: 'deep', requires: ['onsen'], beom: 1_500_000, mats: { gold: 40, gem: 10 }, opens: '광산 21~30층 · 별빛 광석', preview: '수정이 자라는 가장 깊은 굴.', live: false },
];
export const RESEARCH_BY_ID: Readonly<Record<string, ResearchDef>> = Object.fromEntries(RESEARCH.map((r) => [r.id, r]));
/** Different friends that must help before a project may finish (lifted after RESEARCH_RELAX_DAYS). */
export const RESEARCH_HELPERS = 3;
export const RESEARCH_RELAX_DAYS = 7;
/** Smallest 범 gift (or what is left); also each missing helper's reserved share. */
export const RESEARCH_MIN_BEOM = 1_000;
/** Research flags and what they read as on the board (merged into VILLAGE_FLAGS). */
export const RESEARCH_FLAGS: Record<string, string> = Object.fromEntries(RESEARCH.map((r) => [r.flag, `${r.name} · ${r.opens}`]));

// ---------------------------------------------------------------- material nodes
export type NodeKind = 'bush' | 'log' | 'rock';
export const NODE_INFO: Record<NodeKind, { name: string; verb: string; tool: ToolId; skill: SkillId }> = {
  bush: { name: '잡목', verb: '베기', tool: 'axe', skill: 'forage' },
  log: { name: '쓰러진 통나무', verb: '쪼개기', tool: 'axe', skill: 'forage' },
  rock: { name: '바위', verb: '깨기', tool: 'pickaxe', skill: 'mine' },
};
/**
 * Candidate spots near the village edge (x/z on walkable ground, off every
 * path, no collider: they never block a route). Each day a hashed few are up.
 */
export const NODE_SPOTS: readonly { id: string; kind: NodeKind; x: number; z: number }[] = [
  { id: 'r1', kind: 'rock', x: -43.6, z: -13.9 },
  { id: 'r2', kind: 'rock', x: -45, z: 10 },
  { id: 'r3', kind: 'rock', x: -19.2, z: -31.2 },
  { id: 'r4', kind: 'rock', x: 21.6, z: -34.9 },
  { id: 'r5', kind: 'rock', x: 42.6, z: -6.6 },
  { id: 'r6', kind: 'rock', x: -30, z: 33 },
  { id: 'r7', kind: 'rock', x: 26, z: 31 },
  { id: 'r8', kind: 'rock', x: 44.8, z: 25.8 },
  { id: 'r9', kind: 'rock', x: -8, z: -36 },
  { id: 'b1', kind: 'bush', x: -40.5, z: -24.2 },
  { id: 'b2', kind: 'bush', x: -45, z: -2 },
  { id: 'b3', kind: 'bush', x: -42, z: 28 },
  { id: 'b4', kind: 'bush', x: 16.8, z: -31.2 },
  { id: 'b5', kind: 'bush', x: 42, z: -15 },
  { id: 'b6', kind: 'bush', x: -12, z: 31 },
  { id: 'b7', kind: 'bush', x: 40, z: 30 },
  { id: 'b8', kind: 'bush', x: 30.5, z: -32 },
  { id: 'l1', kind: 'log', x: -46, z: 18 },
  { id: 'l2', kind: 'log', x: -28, z: -35 },
  { id: 'l4', kind: 'log', x: 19.6, z: 26.1 },
  { id: 'l5', kind: 'log', x: -2.2, z: -31.2 },
];
export const NODE_BY_ID: Readonly<Record<string, (typeof NODE_SPOTS)[number]>> = Object.fromEntries(NODE_SPOTS.map((n) => [n.id, n]));
/** Nodes up each day (shared positions; each friend breaks their own copy). */
export const NODES_PER_DAY: Record<NodeKind, number> = { bush: 2, log: 1, rock: 3 };
/** Base yields. */
export const NODE_YIELD = { bush: 2, log: 3, rock: 2 } as const;
/** Copper from a village rock: chance and amount (1–2, mean 1.3). */
export const COPPER_CHANCE = 20;

// ---------------------------------------------------------------- actions
/** Life actions of the growth engine (names must not collide with other life/room actions). */
export const GROWTH_ACTION_KINDS = ['chooseProf', 'respec', 'forge', 'forgePickup', 'forgeGift', 'research', 'chop', 'smash'] as const;
export type GrowthActionKind = (typeof GROWTH_ACTION_KINDS)[number];
