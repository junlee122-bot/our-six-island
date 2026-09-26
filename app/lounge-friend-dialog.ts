// Friend NPC dialog selection (pure, deterministic). Picks what an offline
// friend's NPC says from lounge-friend-lines.ts (and the lines that friend
// wrote themselves) for the moment: time, season and weather, what the
// player is doing or holding, yesterday's village news, hearts, birthdays and
// festivals. The dialog box (app/lounge/FriendDialog.tsx) shows the pages
// with a typewriter and offers the small-talk choices at the end.
import { ACTOR_NAMES, SEASON_INFO, hash32, type Season, type TimeOfDay, type Weather } from './lounge-calendar.ts';
import { FRIEND_LINES, type FriendLineSet } from './lounge-friend-lines.ts';
import type { FeteKind } from './lounge-social-defs.ts';

export type DialogContext = {
  friend: number;
  me: number;
  /** KST day (varies the picks day to day). */
  day: number;
  /** How many times I talked to this friend this session (varies repeat talks). */
  visit: number;
  timeOfDay: TimeOfDay;
  season: Season;
  weather: Weather;
  /** Hearts between us (0–10). */
  hearts: number;
  /** What I'm doing near them. */
  doing: 'farm' | 'fish' | null;
  /** Display name of what I hold in the hotbar (null = nothing notable). */
  holding: string | null;
  /** Recent village news lines ({text, actors}). */
  news: readonly { text: string; actors: readonly number[] }[];
  birthdayFriend: boolean;
  birthdayMe: boolean;
  fete: FeteKind | null;
  /** Today's holiday name (not a festival), if any. */
  holiday: string | null;
  /** Lines the friend wrote for their own NPC. */
  custom: readonly string[];
  /** Small talk already done with this friend today (no choices then). */
  talked: boolean;
  /** They have a request for me today. */
  request: boolean;
};
export type DialogChoice = { label: string; reply: string; kind: 'talk' | 'request' | 'bye' };
export type DialogScript = {
  friend: number;
  pages: string[];
  /** Asked before the choices (small talk question), or null. */
  question: string | null;
  choices: DialogChoice[];
  /** Which line set it came from, per page (tests and debugging). */
  sources: string[];
};

const pick = <T>(list: readonly T[], key: string): T | null => (list.length ? list[hash32(key) % list.length] : null);
/** News text (해요체) → a friend's casual speech: "…줬어요" → "…줬어". */
export function casual(text: string) {
  const t = text.trim().replace(/[.!]$/, '');
  return /(어요|아요|해요|예요|워요)$/.test(t) ? t.slice(0, -1) : t;
}
export function fillLine(
  line: string,
  v: { me: number; friend: number; season: Season; item?: string | null; subject?: number; news?: string; holiday?: string | null },
) {
  return line
    .replaceAll('{me}', ACTOR_NAMES[v.me] ?? '친구')
    .replaceAll('{name}', ACTOR_NAMES[v.friend] ?? '친구')
    .replaceAll('{season}', SEASON_INFO[v.season].name)
    .replaceAll('{item}', v.item ?? '그거')
    .replaceAll('{friend}', v.subject !== undefined ? (ACTOR_NAMES[v.subject] ?? '친구') : '누구')
    .replaceAll('{news}', v.news ?? '')
    .replaceAll('{holiday}', v.holiday ?? '명절');
}
/** The heart line for the highest reached tier (♥6+ is the special talk). */
function heartLine(set: FriendLineSet, hearts: number, key: string): [string, string] | null {
  for (const tier of [10, 8, 6, 4, 2] as const)
    if (hearts >= tier) {
      const line = pick(set.hearts[tier], key + ':h' + tier);
      if (line) return [line, `hearts-${tier}`];
    }
  return null;
}
/**
 * The dialog for talking to `ctx.friend` now. Page 1 greets (birthday →
 * festival → holiday → weather → time of day); page 2 is the friend's own
 * line when they wrote some, else a reaction to what I'm doing, gossip,
 * the season or a heart line; ♥6+ adds a special third page. Choices: small
 * talk (once a day), the request, goodbye.
 */
export function friendDialog(ctx: DialogContext): DialogScript {
  const set = FRIEND_LINES[ctx.friend] ?? FRIEND_LINES[0];
  const key = `talk:${ctx.day}:${ctx.me}>${ctx.friend}:${ctx.visit}`;
  const vars = { me: ctx.me, friend: ctx.friend, season: ctx.season, item: ctx.holding, holiday: ctx.holiday };
  const pages: string[] = [],
    sources: string[] = [];
  const add = (line: string | null, source: string, extra: Partial<Parameters<typeof fillLine>[1]> = {}) => {
    if (!line) return false;
    const text = fillLine(line, { ...vars, ...extra }).trim();
    if (!text || pages.includes(text)) return false;
    pages.push(text);
    sources.push(source);
    return true;
  };
  // 1. Greeting.
  if (ctx.birthdayFriend) add(pick(set.birthday.theirs, key + ':bt'), 'birthday-theirs');
  else if (ctx.birthdayMe) add(pick(set.birthday.yours, key + ':by'), 'birthday-yours');
  else if (ctx.fete) add(pick(set.festival[ctx.fete], key + ':f'), 'festival-' + ctx.fete);
  else if (ctx.holiday) add(pick(set.festival.holiday, key + ':hol'), 'holiday');
  if (!pages.length) {
    const special = ctx.weather !== 'sunny' && ctx.weather !== 'cloudy' ? set.weather[ctx.weather] : undefined;
    const weather = special ?? (hash32(key + ':w') % 3 === 0 ? set.weather[ctx.weather] : undefined);
    if (!(weather && add(pick(weather, key + ':wl'), 'weather-' + ctx.weather)))
      add(pick(set.greet[ctx.timeOfDay], key + ':g'), 'greet-' + ctx.timeOfDay);
  }
  // 2. The main line.
  const custom = ctx.custom.filter((l) => l.trim());
  const roll = hash32(key + ':main') % 100;
  const gossip = ctx.news.filter((n) => n.actors.some((a) => a !== ctx.me && a !== ctx.friend));
  let main = false;
  if (custom.length && roll < 65) main = add(pick(custom, key + ':c'), 'custom');
  if (!main && ctx.doing) main = add(pick(set.doing[ctx.doing], key + ':d'), 'doing-' + ctx.doing);
  if (!main && ctx.holding && roll % 3 === 0) main = add(pick(set.doing.item, key + ':i'), 'doing-item');
  if (!main && gossip.length && roll % 2 === 0) {
    const n = pick(gossip, key + ':n')!,
      subject = n.actors.find((a) => a !== ctx.me && a !== ctx.friend);
    main = add(pick(set.gossip, key + ':gs'), 'gossip', { subject, news: casual(n.text) });
  }
  if (!main && ctx.hearts >= 2 && roll % 4 === 1) {
    const h = heartLine(set, Math.min(ctx.hearts, 5), key);
    if (h) main = add(h[0], h[1]);
  }
  if (!main) main = add(pick(set.season[ctx.season], key + ':s'), 'season-' + ctx.season);
  if (!main && custom.length) add(pick(custom, key + ':c2'), 'custom');
  // 3. ♥6+: the special talk (every other visit so it stays special).
  if (ctx.hearts >= 6 && (ctx.visit % 2 === 0 || ctx.hearts >= 10)) {
    const h = heartLine(set, ctx.hearts, key + ':special');
    if (h) add(h[0], h[1]);
  }
  // Choices.
  const choices: DialogChoice[] = [];
  let question: string | null = null;
  if (ctx.request) {
    const line = pick(set.request, key + ':r');
    if (line) add(line, 'request');
    choices.push({ label: '무슨 부탁인데?', reply: '', kind: 'request' });
  }
  if (!ctx.talked && set.smallTalk.length) {
    const topic = pick(set.smallTalk, key + ':t')!;
    question = fillLine(topic.q, vars);
    for (const [label, reply] of topic.choices) choices.push({ label: fillLine(label, vars), reply: fillLine(reply, vars), kind: 'talk' });
  }
  choices.push({ label: '다음에 또 올게', reply: '', kind: 'bye' });
  return { friend: ctx.friend, pages, question, choices, sources };
}
