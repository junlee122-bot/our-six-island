// The data format of 주민과 진짜 대화 (handover/design/design-npc-conversation.md,
// guide: handover/design/npc-talk-content-guide.md). One file per resident,
// app/npc-talk/<id>.ts, exports an NpcTalkBook; app/npc-talk/index.ts lists
// them. Pure data: the engine (app/lounge-npc-talk.ts) picks and checks, the
// server (app/lounge-npc-talk-life.ts) records, the speech box shows.
//
// Text may use {me} {name} {season} {weather} {fish} {taste} {other} {days}.
// No numbers that read as points ("+6"), no emoji, no English, ≤ 60 chars a
// line (tests/lounge-npc-talk.test.mjs checks every book).
import type { Season, TimeOfDay, Weather } from '../lounge-calendar.ts';
import type { NpcId, NpcLove } from '../lounge-npc-data.ts';
import type { NpcRecentKind } from '../lounge-npc-extra-types.ts';

/** How well a reply lands: great and good add more hidden points, meh a little (never less). */
export type TalkTier = 'great' | 'good' | 'meh';
/**
 * Their face after my reply: drawn with the pose sheet where one exists,
 * otherwise as a small word bubble beside the portrait.
 */
export type TalkFace = 'smile' | 'laugh' | 'wow' | 'shy' | 'calm' | 'think' | 'sorry';
export type OneOrMore<T> = T | readonly T[];

export type TalkReply = {
  /** What I say (the button), ≤ 30 chars. */
  say: string;
  tier: TalkTier;
  /** Their answer: one line or a few pages. */
  answer: OneOrMore<string>;
  /** Default: great → laugh, good → smile, meh → calm. */
  face?: TalkFace;
  /** A memory tag kept with them (≤ 20 a resident, the oldest goes first). */
  remember?: string;
};

/**
 * When a talk may come up. Every field given must hold. On the server a fact
 * it cannot see (what I caught, my mood…) counts as holding; memories,
 * chapters and love are always checked.
 */
export type TalkCond = {
  time?: OneOrMore<TimeOfDay>;
  season?: OneOrMore<Season>;
  weather?: OneOrMore<Weather>;
  /** A festival day (holidays with a claim). */
  festival?: boolean;
  /** I caught a fish today (true) or one of these fish ids ({fish} is its name). */
  fish?: true | readonly string[];
  /** Today's catch was a personal best or a record. */
  bigFish?: boolean;
  /** I worked my field today (harvest). */
  harvest?: boolean;
  /** I harvested a 금별 crop today. */
  gold?: boolean;
  /** My mood: high (great/good) or low (low/tired). */
  mood?: 'high' | 'low';
  /** Today's village news has a line of this kind ('wedding', 'birthday', 'festival', 'legend'…). */
  news?: string;
  /** Today's village news about another friend has a line of this kind. */
  friendNews?: string;
  /** What I did lately (lounge-npc-recent.ts). */
  recent?: NpcRecentKind;
  /** I talked to this resident today (one of their NPC_BONDS); {other} is their name. */
  bond?: NpcId;
  /** They are with this resident right now (주민끼리 어울리기); {other}. */
  with?: NpcId;
  /** They are sulking with someone today (lounge-npc-social.ts); {other}. */
  sulk?: true;
  /** My love life with them: a stage, 'none' (friends) or 'any' (any stage). */
  love?: NpcLove | 'none' | 'any';
  /** At least this many chapters done. */
  ch?: number;
  /** All of these memories (stored tags, or @taste @bday-soon @outing @date). */
  mem?: OneOrMore<string>;
  /** None of these memories (ask once, then remember). */
  noMem?: OneOrMore<string>;
  /** Today is my birthday. */
  bday?: true;
};

/** One choice talk: they open, I pick one of 2–3 replies, they answer. */
export type NpcTalkEntry = {
  /** Unique within the resident ('sea-dream'). */
  id: string;
  when?: TalkCond;
  /** Their opening line(s). */
  open: OneOrMore<string>;
  replies: readonly TalkReply[];
  /** Memory tags this talk uses up (a callback said once). */
  use?: OneOrMore<string>;
};

/** What opens a chapter, on top of the previous one being done. All given must hold. */
export type ChapterNeed = {
  /** Talks on this many different days. */
  days?: number;
  /** Hidden points at least this (also places old saves: migration). */
  points?: number;
  /** I went to `area` between game hours [from, to) once the previous chapter was done. */
  visit?: { area: string; from: number; to: number };
  /** I bring this item (taken when `take`). */
  bring?: { item: string; take?: true };
  /** A memory they need. */
  mem?: string;
  /** My love stage with them at least this. */
  love?: NpcLove;
};

/** A story chapter: a scene (3–15 lines) and one choice. */
export type NpcChapter = {
  title: string;
  /** Shown in the notebook while it is not open yet ("노을 무렵 선착장에서 보자고 했어요"). */
  hint: string;
  need: ChapterNeed;
  scene: readonly string[];
  replies: readonly TalkReply[];
};

export type NpcTalkBook = {
  npc: NpcId;
  /** Memory tag → what the notebook shows ("딸기를 좋아한다고 했어요"). */
  memories: Readonly<Record<string, string>>;
  /** Everyday choice talks (≥ 12). May gate on love / ch / mem, never on the moment. */
  talks: readonly NpcTalkEntry[];
  /** Openers about the moment (≥ 10): each has a `when` over the day. */
  openers: readonly NpcTalkEntry[];
  /** Memory callbacks (≥ 6): each needs a memory (`when.mem`). */
  callbacks: readonly NpcTalkEntry[];
  /** 5–6 chapters in order. */
  chapters: readonly NpcChapter[];
  /** One line after today's talk (later visits that day). */
  after: readonly string[];
};
