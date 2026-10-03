// 우리 농장 F5: 양식장 (fishPond, design-our-farm.md §10-4) — static data
// only. A leaf (the fish catalog types and the item list), so the site
// engine, the farm engine and the UI can read it at the top level.
//
//  - Built on a personal site at 낚시 Lv5 (small pond); 낚시 Lv8 widens it to
//    the medium pond (twice the fish).
//  - Stocked with one fish from my bag: legends (weight ≤ 1) and the boat's
//    offshore fish cannot live in it.
//  - It grows by one fish every POND_GROW_DAYS days up to its cap. The cap
//    starts low and rises one fish for each request the pond makes (a speech
//    bubble: an item it wants) up to the pond's size; 어부's 양식장 지기 adds two.
//  - Every day it makes something (more likely with more fish): one of its
//    fish, or roe. Farmed fish are ordinary fish in the bag, so the old rule
//    holds (decided §12-2): four of a species a day at the full price.
//  - Roe goes into the jar: 젓갈, or 캐비아 from 철갑상어 roe.
import type { FishDef } from './lounge-items.ts';

/** Fish a pond holds at most, by tier (1 small, 2 medium). */
export const POND_MAX = [5, 10] as const;
/** Cap before any request is met (each met request raises it by one, up to POND_MAX). */
export const POND_START_CAP = 3;
/** Days between one more fish. */
export const POND_GROW_DAYS = 3;
/** Output a pond keeps waiting before it stops making more. */
export const POND_HOLD = 6;
/** Chance (%) of an output today: base + per fish (a full small pond: 80%). */
export const POND_MAKE_BASE = 30;
export const POND_MAKE_PER_FISH = 10;
/** From this many fish a second output may come the same day (+25%p per fish above). */
export const POND_SECOND_FROM = 8;
export const POND_SECOND_PER_FISH = 25;
/** Chance (%) an output is roe instead of a fish (미끼꾼's 알 받기 adds more). */
export const POND_ROE_CHANCE = 25;
/** Fishing XP for collecting each output. */
export const POND_XP = 4;

/** Roe items (bag items; the jar makes 젓갈 / 캐비아 of them). */
export const ROE_ITEMS = {
  roe: { name: '어란', sell: 160, note: '양식장 물고기가 낳은 알. 옹기에 넣으면 젓갈이 돼요.' },
  sturgeonroe: { name: '철갑상어 알', sell: 900, note: '철갑상어 양식장의 귀한 알. 옹기에 넣으면 캐비아가 돼요.' },
} as const;
export type RoeId = keyof typeof ROE_ITEMS;
export const ROE_IDS = Object.keys(ROE_ITEMS) as RoeId[];
export const isRoeId = (id: unknown): id is RoeId => typeof id === 'string' && Object.hasOwn(ROE_ITEMS, id);
/** The roe a pond of `fish` lays. */
export const roeOf = (fish: string): RoeId => (fish === 'sturgeon' ? 'sturgeonroe' : 'roe');

/** Whether a fish may live in a pond: not a legend, not one of the boat's offshore fish. */
export const pondFishOk = (f: Pick<FishDef, 'weight' | 'spots'> | undefined) =>
  !!f && f.weight > 1 && f.spots.length > 0 && !f.spots.includes('offshore');

/**
 * What a pond may ask for to raise its cap (the item and how many). Things
 * every friend can find or make: farm crops, forage, materials and bait.
 */
export const POND_WANTS: readonly { item: string; n: number }[] = [
  { item: 'wood', n: 10 },
  { item: 'stone', n: 10 },
  { item: 'fertilizer', n: 2 },
  { item: 'bait', n: 3 },
  { item: 'shell', n: 2 },
  { item: 'carrot', n: 3 },
  { item: 'corn', n: 2 },
  { item: 'copper', n: 2 },
  { item: 'cabbage', n: 1 },
  { item: 'pinecone', n: 3 },
];

export const POND_REJECT = {
  stocked: '양식장에 이미 물고기가 살고 있어요.',
  notStocked: '아직 물고기를 넣지 않았어요.',
  fish: '양식장에 넣을 수 없는 물고기예요. 전설 물고기와 먼바다 대형 어종은 안 돼요.',
  noFish: '가방에 그 물고기가 없어요.',
  nothing: '아직 거둘 것이 없어요.',
  noWant: '양식장이 지금 바라는 것이 없어요.',
  want: '양식장이 바라는 물건이 부족해요.',
  full: '물고기가 가득 차서 비워야 해요. 먼저 꺼낸 것을 정리해 주세요.',
} as const;
