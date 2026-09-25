// Pure helpers for the life-expansion UI (LIFE-B): inventory rows and groups,
// "where from" text, quality prices, recipe / bundle availability, the hotbar,
// fishing phases, calendar labels and seasonal looks. No DOM, no React.
import {
  CROPS,
  CROP_INFO,
  FRUIT_SELL,
  QUALITY_MULT,
  cropInSeason,
  type Crop,
  type LifeView,
  type Quality,
} from './lounge-life.ts';
import {
  ACHIEVEMENTS,
  BUGS,
  DISHES,
  DISH_BY_ID,
  FISH,
  FISH_BY_ID,
  FORAGE,
  FURNITURE,
  FURNITURE_BY_REF,
  ITEM_BY_ID,
  SPOT_INFO,
  type Need,
  type RecipeDef,
} from './lounge-items.ts';
import {
  FRIEND_PROFILES,
  SEASON_INFO,
  WEATHER_INFO,
  type ItemCategory,
  type Season,
  type Weather,
} from './lounge-calendar.ts';
import { itemName } from './lounge-life-plus.ts';

export type LifeMe = LifeView['me'];

/* ------------------------------------------------------------ inventory */

export type InvGroup = 'seed' | 'crop' | 'fish' | 'bug' | 'forage' | 'dish' | 'furniture' | 'material';
export const INV_GROUPS: readonly (readonly [InvGroup, string])[] = [
  ['seed', '씨앗'],
  ['crop', '작물'],
  ['fish', '물고기'],
  ['bug', '곤충'],
  ['forage', '채집물'],
  ['dish', '요리'],
  ['furniture', '가구'],
  ['material', '재료·도구'],
];
export type InvEntry = {
  /** Unique per row: 'seed-carrot', 'carrot@2', 'fruit', 'crucian', 'furn-plant'. */
  key: string;
  group: InvGroup;
  /** Crop / item / furniture id ('seed-carrot' for seeds). */
  id: string;
  name: string;
  n: number;
  quality?: Quality;
  /** Sell price per piece at this quality (0 = cannot be sold). */
  sell: number;
  /** Museum-donatable id (crops and museum items). */
  museum: boolean;
  /** A dish with a buff: can be eaten. */
  eat: boolean;
  /** Can go in the hotbar (seeds, tools, dishes). */
  hotbar: boolean;
};

export function groupOfItem(id: string): InvGroup {
  if (id.startsWith('seed-')) return 'seed';
  if ((CROPS as string[]).includes(id) || id === 'fruit') return 'crop';
  if (id.startsWith('furn-')) return 'furniture';
  const kind = ITEM_BY_ID[id]?.kind;
  if (kind === 'fish' || kind === 'bug' || kind === 'dish') return kind;
  if (kind === 'forage' || kind === 'flower') return 'forage';
  return 'material';
}

/** Normal / silver / gold counts of a crop (bag.produce is the total). */
export function cropSplit(me: Pick<LifeMe, 'bag' | 'quality'>, crop: Crop): Record<Quality, number> {
  const total = me.bag.produce[crop] ?? 0,
    silver = me.quality?.silver?.[crop] ?? 0,
    gold = me.quality?.gold?.[crop] ?? 0;
  return { 0: Math.max(0, total - silver - gold), 1: silver, 2: gold };
}
export const cropPrice = (crop: Crop, q: Quality) => Math.round(CROP_INFO[crop].sell * QUALITY_MULT[q]);
export const QUALITY_LABEL: Record<Quality, string> = { 0: '보통', 1: '은별', 2: '금별' };

/** Every non-empty inventory row, grouped in INV_GROUPS order. */
export function inventoryEntries(me: LifeMe): InvEntry[] {
  const rows: InvEntry[] = [];
  for (const crop of CROPS)
    if (me.bag.seeds[crop] > 0)
      rows.push({
        key: 'seed-' + crop,
        group: 'seed',
        id: 'seed-' + crop,
        name: CROP_INFO[crop].name + ' 씨앗',
        n: me.bag.seeds[crop],
        sell: 0,
        museum: false,
        eat: false,
        hotbar: true,
      });
  for (const crop of CROPS) {
    const split = cropSplit(me, crop);
    for (const q of [2, 1, 0] as Quality[])
      if (split[q] > 0)
        rows.push({
          key: `${crop}@${q}`,
          group: 'crop',
          id: crop,
          name: CROP_INFO[crop].name,
          n: split[q],
          quality: q,
          sell: cropPrice(crop, q),
          museum: true,
          eat: false,
          hotbar: false,
        });
  }
  if (me.bag.fruit > 0)
    rows.push({ key: 'fruit', group: 'crop', id: 'fruit', name: '과일', n: me.bag.fruit, sell: FRUIT_SELL, museum: false, eat: false, hotbar: false });
  for (const [id, n] of Object.entries(me.inv ?? {})) {
    const def = ITEM_BY_ID[id];
    if (!def || !(n > 0)) continue;
    const dish = DISH_BY_ID[id];
    rows.push({
      key: id,
      group: groupOfItem(id),
      id,
      name: def.name,
      n,
      sell: def.sell,
      museum: !!def.museum,
      eat: !!dish?.buff,
      hotbar: def.kind === 'tool' || !!dish?.buff,
    });
  }
  for (const [ref, n] of Object.entries(me.furniture ?? {}))
    if (n > 0)
      rows.push({ key: ref, group: 'furniture', id: ref, name: FURNITURE_BY_REF[ref]?.name ?? ref, n, sell: 0, museum: false, eat: false, hotbar: false });
  const order = INV_GROUPS.map(([g]) => g);
  return rows
    .map((r, i) => [r, i] as const)
    .sort(([a, i], [b, j]) => order.indexOf(a.group) - order.indexOf(b.group) || i - j)
    .map(([r]) => r);
}

const HABITAT: Record<string, string> = { forest: '숲', meadow: '들판', shore: '물가' };
const WHEN: Record<string, string> = { day: '낮', night: '밤', any: '' };
const SKY: Record<string, string> = { rain: '비 오는 날', dry: '맑은 날', any: '' };
const seasonsText = (list: readonly Season[]) =>
  list.length === 4 ? '사계절' : list.map((s) => SEASON_INFO[s].name).join('·');
const joinDots = (parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' · ');

/** Short Korean "where it comes from" for tooltips and the collection book. */
export function whereFrom(id: string): string {
  const raw = id.startsWith('seed-') ? id.slice(5) : id;
  if ((CROPS as string[]).includes(raw)) {
    const info = CROP_INFO[raw as Crop];
    return joinDots([
      id.startsWith('seed-') ? '범타듀 상점' : '내 텃밭',
      info.seasons ? `${seasonsText(info.seasons)}에 심어요` : '사계절 심어요',
      info.regrow && `${info.regrow.harvests}번 수확`,
    ]);
  }
  if (id === 'fruit') return '마을 과일나무';
  const fish = FISH_BY_ID[id];
  if (fish)
    return joinDots([fish.spots.map((s) => SPOT_INFO[s].name).join('·'), seasonsText(fish.seasons), WHEN[fish.time], SKY[fish.sky]]);
  const bug = BUGS.find((b) => b.id === id);
  if (bug) return joinDots([bug.habitat.map((h) => HABITAT[h]).join('·'), seasonsText(bug.seasons), WHEN[bug.time], SKY[bug.sky]]);
  const forage = FORAGE.find((f) => f.id === id);
  if (forage) return joinDots([`${forage.habitat.map((h) => HABITAT[h]).join('·')} 채집`, seasonsText(forage.seasons), SKY[forage.sky]]);
  const dish = DISH_BY_ID[id];
  if (dish) return `요리 · ${dish.needs.map((n) => needLabel(n) + ' ' + n.n).join(', ')}`;
  if (id === 'fertilizer' || id === 'fertilizer-deluxe' || id === 'bait') return '범타듀 상점 · 공방에서 만들기';
  const furn = FURNITURE_BY_REF[id];
  if (furn)
    return furn.unsold
      ? '마을 꾸러미 완성 보상'
      : joinDots([
          furn.season ? `${SEASON_INFO[furn.season].name} 한정 가구 상점` : furn.holiday ? '명절 한정 가구 상점' : '오늘의 가구 상점',
          furn.craft && '공방에서 만들 수 있어요',
        ]);
  return '';
}

/* ------------------------------------------------------------ recipes / bundles */

const CAT_NAME: Record<string, string> = { fish: '물고기', bug: '곤충', flower: '꽃', forage: '채집물' };
export function needLabel(need: Need): string {
  if ('beom' in need) return '범';
  if ('cat' in need) return `아무 ${CAT_NAME[need.cat] ?? need.cat}`;
  return itemName(need.item) + (need.q ? ` (${QUALITY_LABEL[need.q]} 이상)` : '');
}
/** How many of an input I have (mirrors the server's needCount). */
export function needHave(me: LifeMe, need: Need, balance = 0): number {
  if ('beom' in need) return balance;
  if ('cat' in need)
    return Object.entries(me.inv ?? {}).reduce((s, [id, n]) => s + (ITEM_BY_ID[id]?.cat === need.cat ? n : 0), 0);
  const id = need.item;
  if ((CROPS as string[]).includes(id)) {
    const split = cropSplit(me, id as Crop),
      q = need.q ?? 0;
    return ([0, 1, 2] as Quality[]).filter((t) => t >= q).reduce((s: number, t) => s + split[t], 0);
  }
  if (id === 'fruit') return me.bag.fruit;
  return me.inv?.[id] ?? 0;
}
/** How many times a recipe can be made right now (0 = missing something). */
export function recipeMax(me: LifeMe, recipe: Pick<RecipeDef, 'needs'>): number {
  let max = 99;
  for (const need of recipe.needs) {
    if ('beom' in need) continue;
    max = Math.min(max, Math.floor(needHave(me, need) / need.n));
  }
  return Math.max(0, Math.min(10, max));
}

/* ------------------------------------------------------------ hotbar */

export const HOTBAR_SIZE = 9;
export const TOOL_NAMES: Record<string, string> = { can: '물뿌리개', rod: '낚싯대' };
export const DEFAULT_HOTBAR: readonly string[] = ['can', 'rod', 'seed-carrot', 'seed-tomato', 'fertilizer', 'fertilizer-deluxe', 'bait', '', ''];
export const HOTBAR_KEY = 'bumtadew-hotbar-v1';
export function readHotbar(raw: string | null | undefined): string[] {
  let list: unknown = null;
  try {
    list = raw ? JSON.parse(raw) : null;
  } catch {}
  const ok = (v: unknown): v is string =>
    typeof v === 'string' &&
    (v === '' || v in TOOL_NAMES || v.startsWith('seed-') || !!ITEM_BY_ID[v]);
  const slots = Array.isArray(list) ? list.slice(0, HOTBAR_SIZE).map((v) => (ok(v) ? v : '')) : [...DEFAULT_HOTBAR];
  while (slots.length < HOTBAR_SIZE) slots.push('');
  return slots;
}
export function hotbarName(ref: string) {
  if (!ref) return '';
  if (TOOL_NAMES[ref]) return TOOL_NAMES[ref];
  if (ref.startsWith('seed-')) return itemName(ref.slice(5)) + ' 씨앗';
  return itemName(ref);
}
/** Count shown on a hotbar slot (null = a tool, no count). */
export function hotbarCount(me: LifeMe | null | undefined, ref: string): number | null {
  if (!ref || ref in TOOL_NAMES) return null;
  if (!me) return 0;
  if (ref.startsWith('seed-')) return me.bag.seeds[ref.slice(5) as Crop] ?? 0;
  return me.inv?.[ref] ?? 0;
}
/** Puts `ref` in slot `i`; an existing copy elsewhere moves (no duplicates). */
export function placeInHotbar(slots: readonly string[], i: number, ref: string): string[] {
  const next = slots.map((s) => (s === ref ? '' : s));
  if (i >= 0 && i < next.length) next[i] = ref;
  return next;
}

type Plot = LifeMe['farm'][number];
/**
 * What E does at my farm with the selected hotbar item: plant that seed in
 * every empty plot, fertilize every growing plot, water every thirsty plot.
 * null = no quick action (the farm panel opens instead).
 */
export function farmToolAction(
  farm: readonly Plot[],
  me: LifeMe | null | undefined,
  tool: string,
  now: number,
  season: Season,
  greenhouse = false,
): { kind: 'plant' | 'fertilize' | 'water'; label: string; n: number } | null {
  if (!me || !tool) return null;
  const growing = (p: Plot) => !!p.crop && (p.readyAt ?? Infinity) > now;
  if (tool === 'can') {
    const n = farm.filter((p) => growing(p) && p.wateredAt === null && !p.rained).length;
    return n ? { kind: 'water', label: `물 주기 (${n})`, n } : null;
  }
  if (tool.startsWith('seed-')) {
    const crop = tool.slice(5) as Crop;
    if (!CROP_INFO[crop] || !(greenhouse || cropInSeason(crop, season))) return null;
    const n = Math.min(farm.filter((p) => !p.crop).length, me.bag.seeds[crop] ?? 0);
    return n ? { kind: 'plant', label: `${CROP_INFO[crop].name} 심기 (${n})`, n } : null;
  }
  if (tool === 'fertilizer' || tool === 'fertilizer-deluxe') {
    const level = tool === 'fertilizer' ? 1 : 2;
    const n = Math.min(farm.filter((p) => growing(p) && (p.fert ?? 0) < level).length, me.inv?.[tool] ?? 0);
    return n ? { kind: 'fertilize', label: `${level === 2 ? '고급 비료' : '비료'} 주기 (${n})`, n } : null;
  }
  return null;
}

/* ------------------------------------------------------------ fishing */

export type FishPhase = 'none' | 'wait' | 'bite' | 'gone';
/** Where a pending cast is on the server clock. */
export function fishPhase(
  pending: { biteAt: number; windowMs: number; expiresAt: number } | null | undefined,
  serverNow: number,
): FishPhase {
  if (!pending) return 'none';
  if (serverNow < pending.biteAt) return 'wait';
  if (serverNow <= pending.biteAt + pending.windowMs) return 'bite';
  return 'gone';
}
/** Reaction time sent with 'reel' (clamped at 0 for an early press). */
export const reelTiming = (biteAt: number, serverNow: number) => Math.max(0, Math.round(serverNow - biteAt));
export const REEL_REASON: Record<string, string> = {
  early: '너무 빨리 당겼어요. 찌가 쏙 들어갈 때 당겨요!',
  late: '물고기가 미끼만 먹고 도망갔어요.',
  timing: '타이밍이 조금 어긋났어요.',
};

/* ------------------------------------------------------------ calendar */

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
export function calendarLine(cal: { season: Season; seasonDay: number; weekday: number; year: number }) {
  return `${cal.year}년차 ${SEASON_INFO[cal.season].name} ${cal.seasonDay}일 · ${WEEKDAYS[cal.weekday]}요일`;
}
export const weatherName = (w: Weather) => WEATHER_INFO[w].name;
/** The seasonal ambience a village should show (null = none). */
export function ambienceOf(season: Season, weather: Weather): 'rain' | 'snow' | 'leaves' | 'petals' | null {
  if (weather === 'rain' || weather === 'storm') return 'rain';
  if (weather === 'snow') return 'snow';
  if (season === 'autumn') return 'leaves';
  if (season === 'spring') return 'petals';
  return null;
}
/** Grass / foliage colours per season (multiplied onto the village materials). */
export const SEASON_TINT: Record<Season, { grass: string; grassLight: string; leaf: string; leafLight: string; particle: string }> = {
  spring: { grass: '#a9cf7c', grassLight: '#c3dd92', leaf: '#8cc06b', leafLight: '#f2b8c9', particle: '#f6c1d2' },
  summer: { grass: '#8fc16a', grassLight: '#a9d27f', leaf: '#5e9d4c', leafLight: '#79b25c', particle: '#ffffff' },
  autumn: { grass: '#c3c079', grassLight: '#d7c98a', leaf: '#d9853b', leafLight: '#e8b04b', particle: '#e0823a' },
  winter: { grass: '#e3ebe9', grassLight: '#f1f5f4', leaf: '#8aa596', leafLight: '#dfe9e6', particle: '#ffffff' },
};

/* ------------------------------------------------------------ friendship */

export const bondHearts = (level: number) => Math.max(0, Math.min(10, level));
/** Friend gift tastes are shown once you share a heart (placeholder data). */
export const tastesKnown = (level: number) => level >= 1;
const CAT_KO: Record<ItemCategory, string> = {
  crop: '작물',
  fruit: '과일',
  fish: '물고기',
  bug: '곤충',
  forage: '채집물',
  flower: '꽃',
  material: '재료',
  dish: '요리',
};
export const categoryName = (c: ItemCategory) => CAT_KO[c];
export function giftCategory(id: string): ItemCategory | null {
  if ((CROPS as string[]).includes(id)) return 'crop';
  if (id === 'fruit') return 'fruit';
  const cat = ITEM_BY_ID[id]?.cat;
  return cat && cat !== 'tool' ? cat : null;
}
/** 'like' | 'dislike' | null for a gift to a friend. */
export function giftTaste(actor: number, id: string): 'like' | 'dislike' | null {
  const cat = giftCategory(id),
    p = FRIEND_PROFILES[actor];
  if (!cat || !p) return null;
  if (p.likes.includes(cat)) return 'like';
  if (p.dislikes.includes(cat)) return 'dislike';
  return null;
}

/* ------------------------------------------------------------ collection */

export type DexTab = 'fish' | 'bug' | 'forage' | 'crop' | 'dish';
export const DEX_TABS: readonly (readonly [DexTab, string, readonly string[]])[] = [
  ['fish', '물고기', FISH.map((f) => f.id)],
  ['bug', '곤충', BUGS.map((b) => b.id)],
  ['forage', '채집물', FORAGE.filter((f) => f.kind !== 'material').map((f) => f.id)],
  ['crop', '작물', [...CROPS]],
  ['dish', '요리', DISHES.map((d) => d.id)],
];
/** Every museum-donatable id (the museum's shelves). */
export const MUSEUM_IDS: readonly string[] = DEX_TABS.flatMap(([, , ids]) => ids);
export function achievementRows(me: LifeMe | null | undefined) {
  return ACHIEVEMENTS.map((a, i) => {
    const s = me?.achievements?.[i];
    return { ...a, progress: s?.id === a.id ? s.progress : 0, done: s?.id === a.id ? s.done : false };
  });
}
/** Furniture a room may still take: owned copies minus copies placed. */
export function furnitureLeft(owned: Readonly<Record<string, number>>, placed: readonly { ref: string }[]) {
  const left: Record<string, number> = {};
  for (const f of FURNITURE) left[f.ref] = owned[f.ref] ?? 0;
  for (const item of placed) if (item.ref in left) left[item.ref] -= 1;
  return left;
}
/** Premium furniture as the room editor's unlock list: one entry per owned copy. */
export function furnitureUnlocks(owned: Readonly<Record<string, number>> | undefined): string[] {
  const out: string[] = [];
  for (const [ref, n] of Object.entries(owned ?? {})) for (let i = 0; i < Math.min(n, 50); i++) out.push(ref);
  return out;
}
