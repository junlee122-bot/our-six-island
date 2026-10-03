// 우리 농장 F4 (handover/design/design-our-farm.md §4, §11-5): the farm's
// 축사 (barn) and 닭장 (coop) — static numbers and the action kinds. A leaf, so
// lounge-life.ts can list the kinds at load time and the UI can read it.
//
// The loop: animal → 거름 (manure, every day) → 비료 (fertilizer) → field →
// grass cut at the 사일로 → 건초 (hay) → animal.

/** 거름 each animal living at the farm makes a day (the barn and coop daily hooks). */
export const MANURE_PER_ANIMAL = 1;
/** 거름 waiting for one friend at one site (it stops piling up there). */
export const MANURE_HOLD = 40;
/** 거름 for one 비료 (퇴비 만들기 at the barn). */
export const MANURE_PER_FERT = 2;
/** 사일로: 건초 from one grass tile of my field (once per 나의 하루 per tile). */
export const HAY_PER_GRASS = 1;
/** 목축 XP for each 비료 made from 거름, and for each grass tile cut. */
export const COMPOST_XP = 2;
export const SILO_XP = 1;

export const BARN_ACTION_KINDS = ['barnMove', 'barnCare', 'siloCut', 'manureTake', 'compost'] as const;
export type BarnActionKind = (typeof BARN_ACTION_KINDS)[number];
export type BarnAction =
  /** Move my animal `i` (index in my animal list) to the farm or back to 닐라's ranch. */
  | { kind: 'barnMove'; i: number; to: 'farm' | 'ranch' }
  /** Feed and pet my animals living at the farm (`i`: only that one). */
  | { kind: 'barnCare'; i?: number }
  /** 사일로: cut grass on my field (tile −1: every grass tile of my field) into 건초. */
  | { kind: 'siloCut'; tile: number }
  /** Take my 거름 from the barn and the coop. */
  | { kind: 'manureTake' }
  /** 거름 MANURE_PER_FERT → 비료 1, `n` times. */
  | { kind: 'compost'; n: number };
type _Kinds = BarnAction['kind'] extends BarnActionKind ? (BarnActionKind extends BarnAction['kind'] ? true : never) : never;
export const BARN_KINDS_OK: _Kinds = true;
export const isBarnAction = (a: unknown): a is BarnAction =>
  !!a && typeof a === 'object' && (BARN_ACTION_KINDS as readonly string[]).includes((a as { kind?: unknown }).kind as string);

export const BARN_REJECT = {
  noBarn: '우리 농장에 축사가 아직 없어요.',
  noCoop: '우리 농장에 닭장이 아직 없어요.',
  animal: '동물을 다시 골라 주세요.',
  there: '이미 그곳에 사는 동물이에요.',
  farmFull: '농장 축사(닭장)에 내 동물 칸이 다 찼어요.',
  ranchFull: '닐라 목장에 내 동물 칸이 다 찼어요.',
  noFarmAnimals: '농장에 사는 내 동물이 없어요. 닐라 목장에서 옮겨 와 주세요.',
  tile: '밭 칸을 확인해 주세요.',
  noGrass: '벨 풀이 없어요. 갈지 않은 풀밭만 벨 수 있어요.',
  cut: '오늘은 이미 벤 풀밭이에요. 내일 다시 자라요.',
  noManure: '가져갈 거름이 없어요.',
  compostN: '만들 개수를 확인해 주세요.',
  manure: `거름이 모자라요. 비료 하나에 거름 ${MANURE_PER_FERT}개가 들어요.`,
} as const;
