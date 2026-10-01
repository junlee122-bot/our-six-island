// 마을 확장 2단계 town actions: kinds and shapes only (no engine imports), so
// lounge-life.ts can list them at load time without an import cycle. The
// engine is lounge-town.ts.
import type { Crop } from './lounge-life.ts';
import type { SkillId } from './lounge-growth-data.ts';

/** 장날 좌판: four in 시장 거리 (Sundays; stall-sw is 마키마's) and 마키마's harbor stall (Wednesdays and Saturdays). */
export const STALL_IDS = ['stall-w', 'stall-e', 'stall-sw', 'stall-se', 'stall-harbor'] as const;
export type StallId = (typeof STALL_IDS)[number];
export const TOWN_ACTION_KINDS = ['auctionSell', 'coopSell', 'bakeryBuy', 'stallBuy', 'readingClub', 'shopFood', 'peddlerDeal'] as const;
export type TownActionKind = (typeof TOWN_ACTION_KINDS)[number];
export type TownAction =
  | { kind: 'auctionSell'; item: string; n: number }
  | { kind: 'coopSell'; crop: Crop; n: number; quality?: 0 | 1 | 2 | 3 }
  | { kind: 'bakeryBuy'; item: string }
  | { kind: 'stallBuy'; stall: StallId }
  | { kind: 'readingClub'; skill: SkillId }
  /** 음식 시스템: eat a 빵집 / 허풍 주점 menu item on the spot (lounge-food-data SHOP_FOODS). */
  | { kind: 'shopFood'; shop: 'bakery' | 'tavern'; item: string }
  /** 행상인 마키마's weekly 계약: goods instead of 범 for the week's spice. */
  | { kind: 'peddlerDeal' };
export type TownArea = 'harbor' | 'market' | 'hillside' | 'tavern';
/** Where each action must be done (checked by the cloud engine with the real player). */
export const TOWN_ACTION_AREA: Record<TownActionKind, TownArea> = {
  auctionSell: 'harbor',
  coopSell: 'market',
  bakeryBuy: 'market',
  stallBuy: 'market',
  readingClub: 'hillside',
  shopFood: 'market',
  peddlerDeal: 'market',
};
/**
 * Where one action must be done (마키마's harbor stall is at the harbor; the
 * tavern's food in 허풍 주점; the 행상인 is in 시장 거리 on Sundays and at the
 * harbor on Wednesdays and Saturdays — `harborDay`).
 */
export const townActionArea = (a: TownAction, harborDay = false): TownArea =>
  a.kind === 'stallBuy' && a.stall === 'stall-harbor'
    ? 'harbor'
    : a.kind === 'shopFood' && a.shop === 'tavern'
      ? 'tavern'
      : a.kind === 'peddlerDeal' && harborDay
        ? 'harbor'
        : TOWN_ACTION_AREA[a.kind];
export const isTownAction = (a: unknown): a is TownAction =>
  !!a && typeof a === 'object' && (TOWN_ACTION_KINDS as readonly string[]).includes((a as { kind?: unknown }).kind as string);

