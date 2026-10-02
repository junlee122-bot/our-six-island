// Residents living with each other (주민끼리 어울리기), as a pure function of
// the day, the time slot and where their schedules put them. No server row,
// no realtime: every screen (and the server, for 끼어들기) works out the same
// meetings from the same clock.
//
//   Story of the day (npcSocialStory): per KST day, from the ties
//   (lounge-npc-social-ties.ts) — a few pairs fall out over something small
//   (다툼), keep apart the next day (서먹), and make up the day after (화해);
//   a few friends hand each other a present. The story needs no positions,
//   so the village news can tell yesterday's from the day number alone.
//
//   Meetings (npcSocialScene): two tied residents standing in the same area
//   close to each other meet in a 2-game-hour slot (game clock, the same
//   clock the schedule reads): chat, a meal, a short walk together, the
//   present of the day, the quarrel or the making up. One of them (the one at
//   work, else the receiver of a present, else by id) stays; the other comes
//   over and they face each other, on walkable ground and never on a tile
//   another resident stands on. A sulking pair never meets.
//
//   Lines (npcSocialExchange): four bubbles from both voices
//   (lounge-npc-extra-<id>.ts social, and the pair's banter for chats). A
//   friend nearby can overhear the whole exchange or join it (3 lines, a
//   small friendship gain with both; the server checks the meeting with the
//   same functions, lounge-romance.ts).
import { GAME_HOUR_MS, SEASON_INFO, WEATHER_INFO, hash32, seasonOfDay, weatherOf } from './lounge-calendar.ts';
import { kstDay } from './lounge-economy.ts';
import { NPCS, NPC_IDS, VISIBLE_NPC_IDS, type NpcId } from './lounge-npc-data.ts';
import { NPC_EXTRA } from './lounge-npc-extra.ts';
import { NPC_WALK_AREAS, npcCanStand, npcSpot, type NpcArea, type NpcSpot, type NpcWorld } from './lounge-npc-schedule.ts';
import { NPC_TIES, npcTie, pairKey, type NpcTie, type NpcTieKind } from './lounge-npc-social-ties.ts';
import { NPC_BANTER } from './lounge-npc-banter.ts';
import { josa } from './lounge-text.ts';

export type NpcSocialKind = 'chat' | 'meal' | 'stroll' | 'gift' | 'quarrel' | 'makeup';
export const NPC_SOCIAL_WORD: Record<NpcSocialKind, string> = {
  chat: '수다 떠는 중',
  meal: '같이 먹는 중',
  stroll: '같이 걷는 중',
  gift: '선물 주고받는 중',
  quarrel: '티격태격하는 중',
  makeup: '화해하는 중',
};
/** Where a pair stands in a quarrel arc today. */
export type NpcPairMood = 'quarrel' | 'sulk' | 'makeup';

// ---------------------------------------------------------------- story
/** Quarrel arcs run in cycles of this many days (3 days each: 다툼 · 서먹 · 화해). */
export const ARC_CYCLE = 9;
/** Chance (of 100) that a pair has an arc in a cycle, by tie. */
const ARC_ODDS: Partial<Record<NpcTieKind, number>> = { rival: 45, friend: 18, married: 30, family: 25, partner: 20, regular: 10 };
/** Ties that hand each other presents. */
const GIFT_TIES: readonly NpcTieKind[] = ['married', 'family', 'crush', 'friend', 'mentor', 'regular', 'partner'];
/** Presents a day across the village. */
export const GIFTS_PER_DAY = 4;

/** The pair's quarrel arc today (null on most days). */
export function npcPairMood(a: NpcId, b: NpcId, day: number): NpcPairMood | null {
  const tie = npcTie(a, b);
  const odds = tie ? ARC_ODDS[tie.kind] ?? 0 : 0;
  if (!odds) return null;
  const key = pairKey(a, b);
  const cycle = Math.floor(day / ARC_CYCLE);
  if (hash32(`arc:${key}:${cycle}`) % 100 >= odds) return null;
  const start = cycle * ARC_CYCLE + (hash32(`arc-day:${key}:${cycle}`) % (ARC_CYCLE - 2));
  return day === start ? 'quarrel' : day === start + 1 ? 'sulk' : day === start + 2 ? 'makeup' : null;
}
export type NpcStoryLine = { kind: 'quarrel' | 'sulk' | 'makeup' | 'gift'; a: NpcId; b: NpcId; item?: string; tie: NpcTie };
const storyCache = new Map<number, NpcStoryLine[]>();
/** What happens between residents today: quarrel arcs and the day's presents (a gives to b). */
export function npcSocialStory(day: number): NpcStoryLine[] {
  const hit = storyCache.get(day);
  if (hit) return hit;
  const out: NpcStoryLine[] = [];
  for (const tie of NPC_TIES) {
    const mood = npcPairMood(tie.a, tie.b, day);
    if (mood) out.push({ kind: mood, a: tie.a, b: tie.b, tie });
  }
  const busy = new Set<NpcId>();
  const giving = NPC_TIES.filter((t) => GIFT_TIES.includes(t.kind) && !npcPairMood(t.a, t.b, day))
    .map((t) => ({ t, h: hash32(`gift:${day}:${pairKey(t.a, t.b)}`) }))
    .sort((x, y) => x.h - y.h || (pairKey(x.t.a, x.t.b) < pairKey(y.t.a, y.t.b) ? -1 : 1));
  for (const { t, h } of giving) {
    if (out.filter((s) => s.kind === 'gift').length >= GIFTS_PER_DAY) break;
    if (busy.has(t.a) || busy.has(t.b)) continue;
    // The one with the crush gives; otherwise the hash picks.
    const [a, b] = t.kind === 'crush' || (h >> 8) % 2 === 0 ? [t.a, t.b] : [t.b, t.a];
    busy.add(a).add(b);
    out.push({ kind: 'gift', a, b, item: NPC_EXTRA[a].social.giftItem, tie: t });
  }
  if (storyCache.size > 64) storyCache.clear();
  storyCache.set(day, out);
  return out;
}
/** Who `npc` is sulking with today (the day after a quarrel), if anyone. */
export function npcSulkingWith(npc: NpcId, day: number): NpcId | null {
  const s = npcSocialStory(day).find((x) => x.kind === 'sulk' && (x.a === npc || x.b === npc));
  return s ? (s.a === npc ? s.b : s.a) : null;
}

// ---------------------------------------------------------------- meetings
/** Two game hours a slot: who meets whom changes through each game day. */
export const SOCIAL_SLOT_HOURS = 2;
/** Absolute slot number on the game clock (unique across game days, like the schedule). */
export const socialSlotOf = (now: number) => Math.floor(now / (SOCIAL_SLOT_HOURS * GAME_HOUR_MS));
/** Residents this close (area units) can meet; the one who comes over stands this far from the other. */
export const MEET_RANGE = 8;
export const MEET_GAP = 1.5;
/** Chance (of 100) that a tied pair close together meets in a slot. */
const MEET_ODDS: Record<NpcTieKind, number> = { married: 80, family: 75, crush: 70, friend: 60, mentor: 55, partner: 55, regular: 45, rival: 45 };
const AT_WORK = new Set(['work', 'stall', 'report', 'forecast']);
const QUIET = new Set(['sleep', 'nap', 'transit', 'read']);
/** Tile of a point: two residents never stand on the same one. */
export const npcTile = (p: { x: number; z: number }) => `${Math.round(p.x)},${Math.round(p.z)}`;

export type NpcSocialEvent = {
  /** `a` stays where the schedule put them; `b` comes over. */
  a: NpcId;
  b: NpcId;
  kind: NpcSocialKind;
  area: NpcArea;
  /** Where each stands and faces during the meeting. */
  pos: Record<string, { x: number; z: number; facing: number }>;
  /** Who speaks first. */
  first: NpcId;
  /** The present (gift meetings), given by `first`. */
  item?: string;
  tie: NpcTie;
  day: number;
  slot: number;
  /** Stable key of this meeting (day, slot, pair). */
  key: string;
};

type Cand = { s: NpcSpot; t: NpcSpot; tie: NpcTie; mood: NpcPairMood | null; gift: NpcStoryLine | undefined; prio: number; h: number };
/**
 * The meetings among `spots` (raw schedule spots, any areas) at `now`. Pure:
 * the same spots and clock give the same meetings on every screen.
 */
export function npcSocialScene(spots: readonly NpcSpot[], now: number): NpcSocialEvent[] {
  const day = kstDay(now),
    slot = socialSlotOf(now);
  const story = npcSocialStory(day);
  const ready = spots.filter((s) => s.visible && !s.walking && !QUIET.has(s.activity) && NPC_WALK_AREAS.includes(s.area));
  const cands: Cand[] = [];
  for (let i = 0; i < ready.length; i++)
    for (let j = i + 1; j < ready.length; j++) {
      const s = ready[i],
        t = ready[j];
      if (s.area !== t.area || Math.hypot(s.x - t.x, s.z - t.z) > MEET_RANGE) continue;
      const tie = npcTie(s.id, t.id);
      if (!tie) continue;
      const mood = npcPairMood(s.id, t.id, day);
      if (mood === 'sulk') continue;
      const key = pairKey(s.id, t.id);
      const gift = story.find((x) => x.kind === 'gift' && pairKey(x.a, x.b) === key);
      const h = hash32(`meet:${day}:${slot}:${key}`);
      const prio = mood || gift ? 2 : h % 100 < MEET_ODDS[tie.kind] ? 1 : 0;
      if (prio) cands.push({ s, t, tie, mood, gift, prio, h });
    }
  cands.sort((x, y) => y.prio - x.prio || x.h - y.h);
  const taken = new Set<NpcId>();
  // Tiles held by everyone standing in each area (walkers pass through).
  const held = new Map<string, Map<string, NpcId>>();
  for (const s of spots) if (s.visible && !s.walking) (held.get(s.area) ?? held.set(s.area, new Map()).get(s.area)!).set(npcTile(s), s.id);
  const out: NpcSocialEvent[] = [];
  for (const c of cands) {
    if (taken.has(c.s.id) || taken.has(c.t.id)) continue;
    // Who stays: the one at work, else the receiver of a present, else the first by id order.
    const order = (x: NpcSpot, y: NpcSpot) => NPC_IDS.indexOf(x.id) - NPC_IDS.indexOf(y.id);
    let [stay, come] = order(c.s, c.t) <= 0 ? [c.s, c.t] : [c.t, c.s];
    if (c.gift) [stay, come] = c.gift.b === c.s.id ? [c.s, c.t] : [c.t, c.s];
    if (AT_WORK.has(come.activity) && !AT_WORK.has(stay.activity)) [stay, come] = [come, stay];
    const tiles = held.get(stay.area)!;
    const p = placeBeside(stay, come, tiles);
    if (!p) continue;
    tiles.delete(npcTile(come));
    tiles.set(npcTile(p), come.id);
    taken.add(stay.id).add(come.id);
    const kind: NpcSocialKind = c.mood === 'quarrel' || c.mood === 'makeup' ? c.mood : c.gift ? 'gift' : kindOf(stay, come, c.h);
    const face = (from: { x: number; z: number }, to: { x: number; z: number }) => Math.atan2(to.x - from.x, to.z - from.z);
    const first = c.gift ? c.gift.a : (c.h >> 4) % 2 === 0 ? stay.id : come.id;
    out.push({
      a: stay.id,
      b: come.id,
      kind,
      area: stay.area,
      pos: { [stay.id]: { x: stay.x, z: stay.z, facing: face(stay, p) }, [come.id]: { x: p.x, z: p.z, facing: face(p, stay) } },
      first,
      ...(c.gift?.item ? { item: c.gift.item } : {}),
      tie: c.tie,
      day,
      slot,
      key: `${day}:${slot}:${pairKey(stay.id, come.id)}`,
    });
  }
  return out;
}
function kindOf(a: NpcSpot, b: NpcSpot, h: number): NpcSocialKind {
  if (a.activity === 'eat' || b.activity === 'eat' || a.activity === 'drink' || b.activity === 'drink') return 'meal';
  const loose = (s: NpcSpot) => s.activity === 'stroll' || s.activity === 'rest' || s.activity === 'gather';
  if (loose(a) && loose(b) && (a.area === 'village' || a.area === 'market' || a.area === 'harbor' || a.area === 'hillside' || a.area === 'ranch' || a.area === 'foothill') && (h >> 2) % 3 === 0) return 'stroll';
  return 'chat';
}
/** A free walkable tile next to `stay`, toward where `come` was (null when there is none). */
function placeBeside(stay: NpcSpot, come: NpcSpot, tiles: Map<string, NpcId>): { x: number; z: number } | null {
  const d = Math.hypot(come.x - stay.x, come.z - stay.z);
  const base = d > 1e-6 ? Math.atan2(come.x - stay.x, come.z - stay.z) : 0;
  for (const turn of [0, 1, -1, 2, -2, 3, -3, 4]) {
    const ang = base + (turn * Math.PI) / 4;
    const p = { x: stay.x + Math.sin(ang) * MEET_GAP, z: stay.z + Math.cos(ang) * MEET_GAP };
    const tile = npcTile(p);
    const owner = tiles.get(tile);
    if (owner !== undefined && owner !== come.id) continue;
    if (tile === npcTile(stay)) continue;
    if (!npcCanStand(stay.area, p)) continue;
    return p;
  }
  return null;
}

const sceneCache = new Map<string, NpcSocialEvent[]>();
/** Every meeting in the village right now (the server and the talk box use this). */
export function npcSocialNow(now: number, world?: NpcWorld): NpcSocialEvent[] {
  // Spots move only while walking, and walkers do not meet: a minute of cache is exact enough.
  // No world: the schedule's own (the client's, setNpcWorld).
  const key = `${Math.floor(now / 60_000)}:${world ? `${world.hill ? 1 : 0}${world.ranch ? 1 : 0}${world.foothill ? 1 : 0}` : 'd'}`;
  const hit = sceneCache.get(key);
  if (hit) return hit;
  const events = npcSocialScene(
    VISIBLE_NPC_IDS.map((id) => npcSpot(id, now, world)),
    now,
  );
  if (sceneCache.size > 32) sceneCache.clear();
  sceneCache.set(key, events);
  return events;
}
/** The meeting `npc` is in right now, if any. */
export const npcSocialOf = (npc: NpcId, now: number, world?: NpcWorld) => npcSocialNow(now, world).find((e) => e.a === npc || e.b === npc) ?? null;
/** Where `npc` stands during a meeting (the schedule spot otherwise). */
export function npcSocialSpot(spot: NpcSpot, now: number, world?: NpcWorld): NpcSpot {
  if (!spot.visible || spot.walking) return spot;
  const ev = npcSocialOf(spot.id, now, world);
  const p = ev?.pos[spot.id];
  return p ? { ...spot, x: p.x, z: p.z, facing: p.facing } : spot;
}

// ---------------------------------------------------------------- lines
export type NpcSaid = { who: NpcId; text: string };
const fill = (line: string, vars: Record<string, string | undefined>) => line.replace(/\{(\w+)\}/g, (all, k: string) => vars[k] ?? all);
const pickLine = (pool: readonly string[], key: string) => pool[hash32(key) % pool.length];
function varsFor(who: NpcId, other: NpcId, day: number, item?: string, place?: string) {
  return { other: NPCS[other].name, item, season: SEASON_INFO[seasonOfDay(day)].name, weather: WEATHER_INFO[weatherOf(day)].name, place };
}
/**
 * The whole exchange of a meeting: four bubbles, the first speaker first.
 * Chats use the pair's own banter when they have it. Placeholders are filled.
 */
export function npcSocialExchange(ev: Pick<NpcSocialEvent, 'a' | 'b' | 'kind' | 'first' | 'item' | 'key' | 'day'>): NpcSaid[] {
  const x = ev.first,
    y = ev.first === ev.a ? ev.b : ev.a;
  const X = NPC_EXTRA[x].social,
    Y = NPC_EXTRA[y].social;
  const k = (s: string) => `${ev.key}:${s}`;
  const sx = (pool: readonly string[], s: string, item?: string) => ({ who: x, text: fill(pickLine(pool, k(s)), varsFor(x, y, ev.day, item)) });
  const sy = (pool: readonly string[], s: string, item?: string) => ({ who: y, text: fill(pickLine(pool, k(s)), varsFor(y, x, ev.day, item)) });
  switch (ev.kind) {
    case 'quarrel':
      return [sx(X.quarrel, 'q1'), sy(Y.quarrel, 'q2'), sx(X.quarrel, 'q3'), sy(Y.reply, 'q4')].filter(distinct);
    case 'makeup':
      return [sx(X.makeup, 'm1'), sy(Y.makeup, 'm2'), sx(X.chat, 'm3'), sy(Y.reply, 'm4')];
    case 'gift':
      return [sx(X.give, 'g1', ev.item), sy(Y.thanks, 'g2', ev.item), sx(X.reply, 'g3'), sy(Y.chat, 'g4')];
    case 'meal':
      return [sx(X.meal, 'e1'), sy(Y.meal, 'e2'), sx(X.chat, 'e3'), sy(Y.reply, 'e4')];
    case 'stroll':
      return [sx(X.stroll, 's1'), sy(Y.stroll, 's2'), sx(X.chat, 's3'), sy(Y.reply, 's4')];
    default: {
      const own = NPC_BANTER.find((e) => (e.a === x && e.b === y) || (e.a === y && e.b === x));
      if (own) {
        const [l1, l2] = own.lines[hash32(k('banter')) % own.lines.length];
        const [p, q] = own.a === x ? [x, y] : [y, x];
        return [{ who: p, text: l1 }, { who: q, text: l2 }, sx(X.chat, 'c3'), sy(Y.reply, 'c4')];
      }
      return [sx(X.chat, 'c1'), sy(Y.reply, 'c2'), sy(Y.chat, 'c3'), sx(X.reply, 'c4')];
    }
  }
}
// Two quarrel lines from the same voice could match on tiny pools: keep the page from repeating.
function distinct(s: NpcSaid, i: number, all: NpcSaid[]) {
  return all.findIndex((o) => o.text === s.text) === i;
}
/** A friend ({me}) joins the meeting: three lines, then they go back to it. */
export function npcJoinLines(ev: Pick<NpcSocialEvent, 'a' | 'b' | 'key' | 'day'>, me: string): NpcSaid[] {
  const A = NPC_EXTRA[ev.a].social,
    B = NPC_EXTRA[ev.b].social;
  const v = (who: NpcId, other: NpcId) => ({ ...varsFor(who, other, ev.day), me });
  return [
    { who: ev.a, text: fill(pickLine(A.join, `${ev.key}:${me}:j1`), v(ev.a, ev.b)) },
    { who: ev.b, text: fill(pickLine(B.join, `${ev.key}:${me}:j2`), v(ev.b, ev.a)) },
    { who: ev.a, text: fill(pickLine(A.chat, `${ev.key}:${me}:j3`), v(ev.a, ev.b)) },
  ];
}
/** The talk box's extra pool for `npc` today: still sulking about someone (filled but for {me}). */
export function npcSocialTalkPool(npc: NpcId, day: number): string[] {
  const other = npcSulkingWith(npc, day);
  return other ? NPC_EXTRA[npc].social.sulk.map((s) => s.replace(/\{other\}/g, NPCS[other].name)) : [];
}
/** "닐라 · 하쿠" for a talk box status line. */
export const npcSocialLabel = (ev: Pick<NpcSocialEvent, 'a' | 'b' | 'kind'>, npc: NpcId) => {
  const other = ev.a === npc ? ev.b : ev.a;
  return `${josa(NPCS[other].name, '과/와')} ${NPC_SOCIAL_WORD[ev.kind]}`;
};

// ---------------------------------------------------------------- news
/** Stage-3 residents live behind a district gate until it opens (lounge-npc-schedule.ts dayPlan). */
const DISTRICT_OF: Partial<Record<NpcId, 'ranch' | 'foothill'>> = { nilah: 'ranch', haku: 'ranch', ornn: 'foothill', mercy: 'foothill', shinichi: 'foothill' };
/** Who the news may name: residents with a picture whose district is open. */
export const npcSocialPresent =
  (world: NpcWorld) =>
  (id: NpcId): boolean => {
    const d = DISTRICT_OF[id];
    return VISIBLE_NPC_IDS.includes(id) && (!d || !!world[d]);
  };
/**
 * Village-news lines for a day's story: make-ups first, then quarrels, then
 * presents (at most `max`). `present` keeps residents who are not in the
 * village yet (a shut district) out of the news.
 */
export function npcSocialNews(day: number, present: (id: NpcId) => boolean = () => true, max = 3): string[] {
  const story = npcSocialStory(day).filter((s) => present(s.a) && present(s.b));
  const name = (id: NpcId) => NPCS[id].name;
  const lines: string[] = [];
  for (const s of story.filter((x) => x.kind === 'makeup')) lines.push(`${josa(name(s.a), '과/와')} ${josa(name(s.b), '이/가')} 화해했대요. 오늘은 다시 사이가 좋아 보여요`);
  for (const s of story.filter((x) => x.kind === 'quarrel'))
    lines.push(`${josa(name(s.a), '과/와')} ${josa(name(s.b), '이/가')} 사소한 일로 티격태격했대요. 하루쯤은 서먹할 것 같아요`);
  for (const s of story.filter((x) => x.kind === 'gift' && x.item)) lines.push(`${josa(name(s.a), '이/가')} ${name(s.b)}에게 ${josa(s.item!, '을/를')} 건넸대요`);
  return lines.slice(0, max);
}
