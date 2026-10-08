// 내 취향: each of the seven friends picks what they like and dislike as a
// gift — up to 3 좋아하는 것 and 2 싫어하는 것, each a gift category ('#fish')
// or one giftable item ('crucian') — plus an optional one-line note. Friends
// see each other's tastes openly (a group of friends), and gifts follow them:
// an item match is loved (×2), else a category match is liked (×2) or
// disliked (×0.2) as before, else neutral. Changes are allowed once per KST
// day, so nobody retunes their tastes right before a gift arrives.
//
// Friends who have not chosen yet keep the old placeholder table
// (lounge-calendar.ts FRIEND_PROFILES) at read time; the UI says
// "아직 안 정했어요". Pure and `now`-injected; the hohyeon-api Edge function
// runs the same code.
//
// Saved: life.tastes = { '<actor>': { l: picks, d: picks, n?: note, day } }.
//
// Cycle-safe: lounge-life-plus.ts imports this module and this module imports
// lounge-life(-plus) back, so nothing here touches their bindings at load time.
import { kstDay, nextKstMidnight } from './lounge-economy.ts';
import { ACTOR_NAMES, FRIEND_PROFILES, type ItemCategory } from './lounge-calendar.ts';
import { ITEMS } from './lounge-items.ts';
import { CROPS, LifeError, lifeText, type Gift, type LifeState } from './lounge-life.ts';
import { addNews } from './lounge-life-plus.ts';
import { cleanText } from './text-clean.ts';
import { josa } from './lounge-text.ts';

export const TASTE_LIKES_MAX = 3;
export const TASTE_DISLIKES_MAX = 2;
export const TASTE_NOTE_MAX = 40;
/** Friendship multiplier per taste (a birthday's ×3 comes on top). */
export const TASTE_MULT = { love: 2, like: 2, dislike: 0.2 } as const;
export const TASTE_CATEGORIES: readonly ItemCategory[] = ['crop', 'fruit', 'fish', 'bug', 'forage', 'flower', 'material', 'dish'];

/** '#fish' (a category) or an item id ('crucian', 'carrot', 'fruit'). */
export type TastePick = string;
export type FriendTastes = { l: TastePick[]; d: TastePick[]; n?: string; day: number };
export type TastesBook = Record<string, FriendTastes>;
export type TastesAction = { kind: 'setTastes'; likes: unknown; dislikes: unknown; note?: unknown };
export type GiftTaste = 'love' | 'like' | 'dislike' | null;
/** One friend's tastes in the view (`set` false = the placeholder table). */
export type TasteView = { l: TastePick[]; d: TastePick[]; n?: string; set: boolean };
export type TastesView = {
  /** Every friend by actor, chosen or placeholder. */
  all: Record<number, TasteView>;
  /** When I may change mine again (0 = now). */
  nextAt: number;
};

const fail = (text: string): never => {
  throw new LifeError(text);
};
const actorOk = (a: unknown): a is number => typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < ACTOR_NAMES.length;
export const categoryPick = (c: ItemCategory): TastePick => `#${c}`;
export const pickCategory = (p: TastePick): ItemCategory | null => {
  const c = p.startsWith('#') ? (p.slice(1) as ItemCategory) : null;
  return c && TASTE_CATEGORIES.includes(c) ? c : null;
};

let catalog: Map<string, ItemCategory> | null = null;
/** Every giftable item id → its gift category: crops, 과일, and non-tool items. Built on first use (cycle-safe). */
export function giftCatalog(): ReadonlyMap<string, ItemCategory> {
  if (!catalog) {
    catalog = new Map<string, ItemCategory>();
    for (const c of CROPS) catalog.set(c, 'crop');
    catalog.set('fruit', 'fruit');
    for (const i of ITEMS) if (i.cat !== 'tool' && !catalog.has(i.id)) catalog.set(i.id, i.cat);
  }
  return catalog;
}
/** The gift category of an item id (null: not giftable). */
export const giftCategoryOf = (id: string): ItemCategory | null => giftCatalog().get(id) ?? null;
export const isTastePick = (p: unknown): p is TastePick =>
  typeof p === 'string' && (pickCategory(p) !== null || giftCatalog().has(p));

/** Picks the server keeps: known ids, no repeats, at most `max`. */
function readPicks(v: unknown, max: number): TastePick[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter(isTastePick))].slice(0, max);
}
function readOne(v: unknown): FriendTastes | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const x = v as Record<string, unknown>;
  const l = readPicks(x.l, TASTE_LIKES_MAX),
    d = readPicks(x.d, TASTE_DISLIKES_MAX).filter((p) => !l.includes(p)),
    n = cleanText(x.n, TASTE_NOTE_MAX),
    day = typeof x.day === 'number' && Number.isSafeInteger(x.day) && x.day > 0 ? x.day : 0;
  if (!l.length && !d.length && !n) return null;
  return { l, d, ...(n ? { n } : {}), day };
}
/** Validates the saved book: actors 0–6 only. */
export function readTastes(v: unknown): TastesBook | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: TastesBook = {};
  for (const [key, t] of Object.entries(v as Record<string, unknown>)) {
    if (!/^[0-6]$/.test(key)) continue;
    const one = readOne(t);
    if (one) out[key] = one;
  }
  return Object.keys(out).length ? out : undefined;
}

/** A friend's tastes: what they chose, else the placeholder table. */
export function tastesOf(book: TastesBook | undefined, actor: number): TasteView {
  const t = book?.[actor];
  if (t) return { l: [...t.l], d: [...t.d], ...(t.n ? { n: t.n } : {}), set: true };
  const p = FRIEND_PROFILES[actor];
  return { l: (p?.likes ?? []).map(categoryPick), d: (p?.dislikes ?? []).map(categoryPick), set: false };
}

/** How a friend with `tastes` takes a gift of item `id`: specific items beat categories. */
export function tasteFor(tastes: Pick<TasteView, 'l' | 'd'> | undefined, id: string): GiftTaste {
  if (!tastes) return null;
  if (tastes.l.includes(id)) return 'love';
  if (tastes.d.includes(id)) return 'dislike';
  const cat = giftCategoryOf(id);
  if (!cat) return null;
  if (tastes.l.includes(categoryPick(cat))) return 'like';
  if (tastes.d.includes(categoryPick(cat))) return 'dislike';
  return null;
}
export const tasteMult = (t: GiftTaste) => (t ? TASTE_MULT[t] : 1);
/** The item id a gift carries ('carrot', 'fruit', 'crucian'). */
export const giftItemId = (gift: Gift) => (gift.kind === 'produce' ? gift.crop : gift.kind === 'fruit' ? 'fruit' : gift.item);
/** Friendship multiplier of a gift to `toActor` from their saved (or placeholder) tastes. */
export const giftTasteMult = (life: LifeState, toActor: number, gift: Gift) =>
  tasteMult(tasteFor(tastesOf(life.tastes, toActor), giftItemId(gift)));

/** The gift categories a friend likes (for their daily requests): category picks first, then their items' categories. */
export function likedCategories(life: LifeState, actor: number): ItemCategory[] {
  const t = tastesOf(life.tastes, actor);
  const cats = t.l.map((p) => pickCategory(p) ?? giftCategoryOf(p)).filter((c): c is ItemCategory => !!c);
  return [...new Set(cats)];
}

/** 취향 정하기: validated picks, once per KST day; the first time makes a news line. */
export function setTastes(life: LifeState, member: { id: string; actor: number }, a: TastesAction, now: number) {
  if (!actorOk(member.actor)) fail('누구의 취향인지 확인해 주세요.');
  const list = (v: unknown, max: number, what: string) => {
    if (!Array.isArray(v) || v.length > max) fail(`${what}은 ${max}개까지 고를 수 있어요.`);
    const picks = v as unknown[];
    if (!picks.every(isTastePick)) fail('고를 수 없는 선물이 섞여 있어요.');
    if (new Set(picks).size !== picks.length) fail('같은 것을 두 번 골랐어요.');
    return picks as TastePick[];
  };
  const l = list(a.likes, TASTE_LIKES_MAX, '좋아하는 것'),
    d = list(a.dislikes, TASTE_DISLIKES_MAX, '싫어하는 것');
  if (l.some((p) => d.includes(p))) fail('좋아하는 것과 싫어하는 것에 같은 것을 고를 수 없어요.');
  if (!l.length) fail('좋아하는 것을 하나 이상 골라 주세요.');
  const n = a.note === undefined ? '' : lifeText(a.note, TASTE_NOTE_MAX, true);
  const day = kstDay(now),
    key = String(member.actor),
    before = life.tastes?.[key];
  if (before?.day === day) fail('취향은 하루에 한 번만 바꿀 수 있어요. 내일 다시 바꿔 주세요.');
  (life.tastes ??= {})[key] = { l, d, ...(n ? { n } : {}), day };
  if (!before) addNews(life, now, `tastes:${member.actor}`, 'tastes', `${josa(ACTOR_NAMES[member.actor], '이/가')} 취향을 정했어요`, [member.actor]);
}

export function tastesView(life: LifeState, actor: number, now: number): TastesView {
  const all: Record<number, TasteView> = {};
  for (let a = 0; a < ACTOR_NAMES.length; a++) all[a] = tastesOf(life.tastes, a);
  const mine = actorOk(actor) ? life.tastes?.[actor] : undefined;
  return { all, nextAt: mine?.day === kstDay(now) ? nextKstMidnight(now) : 0 };
}

// ---------------------------------------------------------------- UI helpers
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
/** "물고기 전부" for a category, the item's name otherwise. */
export function pickName(p: TastePick, itemName: (id: string) => string) {
  const c = pickCategory(p);
  return c ? `${CAT_KO[c]} 전부` : itemName(p);
}
export const tasteCategoryName = (c: ItemCategory) => CAT_KO[c];
/** Item ids per category for the picker, in catalog order. */
export function catalogByCategory(): Record<ItemCategory, string[]> {
  const out = Object.fromEntries(TASTE_CATEGORIES.map((c) => [c, [] as string[]])) as Record<ItemCategory, string[]>;
  for (const [id, c] of giftCatalog()) out[c].push(id);
  return out;
}
/** Search: the query appears in the name (spaces ignored). */
export function matchesQuery(name: string, query: string) {
  const q = query.replace(/\s+/g, '');
  return !q || name.replace(/\s+/g, '').includes(q);
}
