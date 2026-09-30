// 마을 확장 2단계 town actions: kinds and shapes only (no engine imports), so
// lounge-life.ts can list them at load time without an import cycle. The
// engine is lounge-town.ts.
import type { Crop } from './lounge-life.ts';
import type { SkillId } from './lounge-growth-data.ts';

/** 장날 좌판: four in 시장 거리 (Sundays; stall-sw is 마키마's) and 마키마's harbor stall (Wednesdays and Saturdays). */
export const STALL_IDS = ['stall-w', 'stall-e', 'stall-sw', 'stall-se', 'stall-harbor'] as const;
export type StallId = (typeof STALL_IDS)[number];
export const TOWN_ACTION_KINDS = ['auctionSell', 'coopSell', 'bakeryBuy', 'stallBuy', 'readingClub'] as const;
export type TownActionKind = (typeof TOWN_ACTION_KINDS)[number];
export type TownAction =
  | { kind: 'auctionSell'; item: string; n: number }
  | { kind: 'coopSell'; crop: Crop; n: number; quality?: 0 | 1 | 2 | 3 }
  | { kind: 'bakeryBuy'; item: string }
  | { kind: 'stallBuy'; stall: StallId }
  | { kind: 'readingClub'; skill: SkillId };
/** Where each action must be done (checked by the cloud engine with the real player). */
export const TOWN_ACTION_AREA: Record<TownActionKind, 'harbor' | 'market' | 'hillside'> = {
  auctionSell: 'harbor',
  coopSell: 'market',
  bakeryBuy: 'market',
  stallBuy: 'market',
  readingClub: 'hillside',
};
/** Where one action must be done (마키마's harbor stall is at the harbor). */
export const townActionArea = (a: TownAction): 'harbor' | 'market' | 'hillside' =>
  a.kind === 'stallBuy' && a.stall === 'stall-harbor' ? 'harbor' : TOWN_ACTION_AREA[a.kind];
export const isTownAction = (a: unknown): a is TownAction =>
  !!a && typeof a === 'object' && (TOWN_ACTION_KINDS as readonly string[]).includes((a as { kind?: unknown }).kind as string);

