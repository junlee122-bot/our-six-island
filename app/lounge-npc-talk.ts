// 주민과 진짜 대화 (handover/design/design-npc-conversation.md): the engine.
// Pure and shared by the server and the client. It picks today's talk from a
// resident's book (app/npc-talk/<id>.ts) by what is going on (context
// openers), what I told them before (memory callbacks) or the everyday
// rotation; says which story chapter comes next and whether it is open; and
// keeps the small memory list. Points stay inside: replies have a tier, the
// server turns it into the existing relation points (lounge-romance.ts), so
// hearts, presents and love stages work as before and nothing shows a number.
//
// Saved per resident (life.ext[uid].npcRelations[npc], next to `points`):
//   tc   talks on different days (absent on old rows: points / 6)
//   ch   chapters done (absent on old rows: placed by points, below)
//   mem  memory tags, oldest first, at most TALK_MEMORY_MAX
//   vis  the chapter whose place-and-time visit is done
import { hash32, type Season, type TimeOfDay, type Weather } from './lounge-calendar.ts';
import { NPC_TALK_POINTS, type NpcId, type NpcLove } from './lounge-npc-data.ts';
import type { NpcRecentKind } from './lounge-npc-extra-types.ts';
import { NPC_TALK } from './npc-talk/index.ts';
import type { ChapterNeed, NpcChapter, NpcTalkBook, NpcTalkEntry, OneOrMore, TalkCond, TalkFace, TalkReply, TalkTier } from './npc-talk/types.ts';

export type { ChapterNeed, NpcChapter, NpcTalkBook, NpcTalkEntry, TalkCond, TalkFace, TalkReply, TalkTier };

export const TALK_MEMORY_MAX = 20;
/** Hidden points for today's talk by how the reply landed (never below zero). */
export const TALK_TIER_POINTS: Record<TalkTier, number> = { great: 8, good: NPC_TALK_POINTS, meh: 3 };
/** A chapter's choice, once per chapter. */
export const STORY_TIER_POINTS: Record<TalkTier, number> = { great: 6, good: 4, meh: 2 };
/** A memory tag: lower-case words with '-' or ':' (≤ 24 chars); '@' tags are read from the game, not stored. */
export const isMemoryTag = (t: unknown): t is string => typeof t === 'string' && /^[a-z0-9][a-z0-9:-]{0,23}$/.test(t);
/** Memory tags read from the game rather than stored: 내 취향, my birthday soon, an outing together, a date. */
export const VIRTUAL_MEMORIES = ['@taste', '@bday-soon', '@outing', '@date'] as const;

export const npcTalkBook = (npc: NpcId): NpcTalkBook | undefined => NPC_TALK[npc];
export const hasTalkBook = (npc: NpcId) => !!NPC_TALK[npc];

/** What a resident's talk can see. `undefined` = not known (the server's view): such a condition holds. */
export type TalkFacts = {
  time?: TimeOfDay;
  season?: Season;
  weather?: Weather;
  festival?: boolean;
  /** Fish id caught today (null: none). */
  fish?: string | null;
  bigFish?: boolean;
  harvest?: boolean;
  gold?: boolean;
  mood?: 'high' | 'mid' | 'low';
  news?: readonly string[];
  friendNews?: readonly string[];
  recent?: readonly NpcRecentKind[];
  /** Residents I talked to today. */
  talkedTo?: readonly NpcId[];
  /** The resident they are with right now. */
  with?: NpcId | null;
  /** Who they are sulking with today. */
  sulk?: NpcId | null;
  bday?: boolean;
  /** Always known (server and client). */
  love: NpcLove | null;
  ch: number;
  mem: readonly string[];
  /** The '@' memories that hold (VIRTUAL_MEMORIES). */
  virtual: readonly string[];
};

const list = <T>(v: OneOrMore<T> | undefined): readonly T[] => (v === undefined ? [] : Array.isArray(v) ? (v as readonly T[]) : [v as T]);
const LOVE_ORDER: Record<NpcLove, number> = { dating: 1, engaged: 2, married: 3 };
export const loveAtLeast = (have: NpcLove | null | undefined, need: NpcLove) => !!have && LOVE_ORDER[have] >= LOVE_ORDER[need];

/** Whether a talk's condition holds (unknown facts hold; see TalkFacts). */
export function condHolds(c: TalkCond | undefined, f: TalkFacts): boolean {
  if (!c) return true;
  const known = <T>(v: T | undefined, ok: (v: T) => boolean) => v === undefined || ok(v);
  if (c.time !== undefined && !known(f.time, (t) => list(c.time).includes(t))) return false;
  if (c.season !== undefined && !known(f.season, (s) => list(c.season).includes(s))) return false;
  if (c.weather !== undefined && !known(f.weather, (w) => list(c.weather).includes(w))) return false;
  if (c.festival !== undefined && !known(f.festival, (x) => x === c.festival)) return false;
  if (c.fish !== undefined && !known(f.fish, (x) => !!x && (c.fish === true || (c.fish as readonly string[]).includes(x)))) return false;
  if (c.bigFish !== undefined && !known(f.bigFish, (x) => x === c.bigFish)) return false;
  if (c.harvest !== undefined && !known(f.harvest, (x) => x === c.harvest)) return false;
  if (c.gold !== undefined && !known(f.gold, (x) => x === c.gold)) return false;
  if (c.mood !== undefined && !known(f.mood, (m) => m === c.mood)) return false;
  if (c.news !== undefined && !known(f.news, (n) => n.includes(c.news!))) return false;
  if (c.friendNews !== undefined && !known(f.friendNews, (n) => n.includes(c.friendNews!))) return false;
  if (c.recent !== undefined && !known(f.recent, (r) => r.includes(c.recent!))) return false;
  if (c.bond !== undefined && !known(f.talkedTo, (t) => t.includes(c.bond!))) return false;
  if (c.with !== undefined && !known(f.with, (w) => w === c.with)) return false;
  if (c.sulk && !known(f.sulk, (s) => !!s)) return false;
  if (c.bday && !known(f.bday, (b) => b)) return false;
  if (c.love !== undefined) {
    if (c.love === 'none' ? !!f.love : c.love === 'any' ? !f.love : f.love !== c.love) return false;
  }
  if (c.ch !== undefined && f.ch < c.ch) return false;
  const has = (t: string) => (t.startsWith('@') ? f.virtual.includes(t) : f.mem.includes(t));
  if (!list(c.mem).every(has)) return false;
  if (list(c.noMem).some(has)) return false;
  return true;
}

/** Every talk of a book by id (talks, openers, callbacks). */
export function talkEntry(book: NpcTalkBook, id: string): NpcTalkEntry | undefined {
  return book.talks.find((t) => t.id === id) ?? book.openers.find((t) => t.id === id) ?? book.callbacks.find((t) => t.id === id);
}

export type TalkSeed = { who: string | number; /** 나의 하루. */ day: number; /** Talks so far (tc). */ tc: number };
/**
 * Today's talk: a memory callback on about two days in three when one fits,
 * else an opener about the moment on about two days in three, else the next
 * everyday talk in turn (a rotation by talk count, so they do not repeat).
 * The same person, resident, day and facts always give the same talk.
 */
export function pickTalk(book: NpcTalkBook, f: TalkFacts, seed: TalkSeed): NpcTalkEntry {
  const key = (k: string) => `${book.npc}:${seed.who}:${seed.day}:${k}`;
  const ok = (t: NpcTalkEntry) => condHolds(t.when, f);
  const callbacks = book.callbacks.filter(ok);
  if (callbacks.length && hash32(key('cb')) % 3 !== 0) return callbacks[hash32(key('cb-pick')) % callbacks.length];
  const openers = book.openers.filter(ok);
  if (openers.length && hash32(key('op')) % 3 !== 0) return openers[hash32(key('op-pick')) % openers.length];
  const talks = book.talks.filter(ok);
  const pool = talks.length ? talks : book.talks;
  return pool[(hash32(`${book.npc}:${seed.who}:rot`) + seed.tc) % pool.length];
}

// ---------------------------------------------------------------- memories
/** Adds a tag at the end (an old copy moves), keeping the newest TALK_MEMORY_MAX. */
export function remember(mem: readonly string[] | undefined, tag: string | undefined): string[] {
  const out = (mem ?? []).filter((t) => t !== tag);
  if (tag && isMemoryTag(tag)) out.push(tag);
  return out.slice(-TALK_MEMORY_MAX);
}
export const forget = (mem: readonly string[] | undefined, tags: OneOrMore<string> | undefined) => (mem ?? []).filter((t) => !list(tags).includes(t));
/** Saved memories, read: real tags only, no repeats, the newest TALK_MEMORY_MAX. */
export function readMemories(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return;
  const out = [...new Set(v.filter(isMemoryTag))].slice(-TALK_MEMORY_MAX);
  return out.length ? out : undefined;
}
/** The newest memories with words for them (the notebook), newest first. */
export function memoryLines(book: NpcTalkBook, mem: readonly string[] | undefined, n = 3): string[] {
  return [...(mem ?? [])]
    .reverse()
    .map((t) => book.memories[t])
    .filter((s): s is string => !!s)
    .slice(0, n);
}

// ---------------------------------------------------------------- progress (and old saves)
type Progress = { points: number; tc?: number; ch?: number; mem?: readonly string[]; vis?: number; love?: NpcLove };
/** Talks on different days; an old row counts its points as talks. */
export const talkDays = (r: Progress) => r.tc ?? Math.floor(Math.max(0, r.points) / NPC_TALK_POINTS);
/**
 * Where an old save (no `ch`) stands: the chapter matching its points is the
 * one to play next, those before it count as done. A new row starts at 0.
 */
export function migratedChapters(book: NpcTalkBook, points: number) {
  let n = 0;
  for (const c of book.chapters) {
    if (c.need.love || (c.need.points ?? 0) > points) break;
    n++;
  }
  return Math.max(0, n - 1);
}
export const chaptersDone = (book: NpcTalkBook, r: Progress) => Math.min(book.chapters.length, r.ch ?? migratedChapters(book, r.points));

export type ChapterState = {
  /** 1-based number of the next chapter (null: all done). */
  n: number | null;
  chapter: NpcChapter | null;
  /** It can be played now. */
  open: boolean;
  /** Its place-and-time visit is still to do. */
  visitDue: boolean;
  /** The item they asked for is not in my bag. */
  bringDue: boolean;
};
/** The next chapter and whether it is open. `have` counts an item in my bag. */
export function nextChapter(book: NpcTalkBook, r: Progress, have: (item: string) => number): ChapterState {
  const done = chaptersDone(book, r);
  const chapter = book.chapters[done] ?? null;
  if (!chapter) return { n: null, chapter: null, open: false, visitDue: false, bringDue: false };
  const n = done + 1;
  const need: ChapterNeed = chapter.need;
  const visitDue = !!need.visit && r.vis !== n;
  const bringDue = !!need.bring && have(need.bring.item) < 1;
  const open =
    talkDays(r) >= (need.days ?? 0) &&
    r.points >= (need.points ?? 0) &&
    !visitDue &&
    !bringDue &&
    (!need.mem || (r.mem ?? []).includes(need.mem)) &&
    (!need.love || loveAtLeast(r.love, need.love));
  return { n, chapter, open, visitDue, bringDue };
}
/** The game hour is inside [from, to) (wrapping past midnight when from > to). */
export const inHours = (hour: number, from: number, to: number) => (from <= to ? hour >= from && hour < to : hour >= from || hour < to);
/** The next chapter waits for me at this area and game hour. */
export function visitDue(book: NpcTalkBook, r: Progress, area: string, hour: number) {
  const done = chaptersDone(book, r);
  const v = book.chapters[done]?.need.visit;
  return !!v && r.vis !== done + 1 && v.area === area && inHours(hour, v.from, v.to);
}
/** "이야기 2장 · 바다 너머" for the chapters done (null before the first). */
export function chapterLabel(book: NpcTalkBook, r: Progress): string | null {
  const done = chaptersDone(book, r);
  return done > 0 ? `이야기 ${done}장 · ${book.chapters[done - 1].title}` : null;
}

// ---------------------------------------------------------------- what the box shows
/** The face after a reply. */
export const replyFace = (r: Pick<TalkReply, 'tier' | 'face'>): TalkFace => r.face ?? (r.tier === 'great' ? 'laugh' : r.tier === 'good' ? 'smile' : 'calm');
/** The small word bubble beside a portrait without a pose for it. */
export const FACE_WORD: Record<TalkFace, string> = {
  smile: '빙긋',
  laugh: '하하',
  wow: '어머',
  shy: '머쓱',
  calm: '끄덕',
  think: '음…',
  sorry: '시무룩',
};
/** The pose sheet cell for a face (lounge-dealer-lines DealerMood). */
export const FACE_POSE: Record<TalkFace, 'calm' | 'smile' | 'wow' | 'sorry' | 'focus'> = {
  smile: 'smile',
  laugh: 'smile',
  wow: 'wow',
  shy: 'smile',
  calm: 'calm',
  think: 'focus',
  sorry: 'sorry',
};
export const asLines = (v: OneOrMore<string>) => [...list(v)];
/** Fills {me} {name} {season} {weather} {fish} {taste} {other} {days}; a missing value reads as a soft word. */
export function fillTalk(text: string, vars: Record<string, string | number | undefined>) {
  const soft: Record<string, string> = { fish: '물고기', taste: '좋아하는 것', other: '이웃', days: '며칠' };
  return text.replace(/\{(\w+)\}/g, (all, k: string) => (vars[k] !== undefined && vars[k] !== '' ? String(vars[k]) : (soft[k] ?? all)));
}
