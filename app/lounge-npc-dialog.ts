// Picks what a resident says, deterministically: the same resident, person,
// day and situation give the same line on every screen (hash-chosen from the
// line files, like the dealers' voices). Pure; no randomness, no server.
import { SEASON_INFO, WEATHER_INFO, seasonOf, timeOfDay, weatherOf, holidaysOn, hash32, type Weather } from './lounge-calendar.ts';
import { kstDay } from './lounge-economy.ts';
import { NPCS, NPC_SISTER_FRIENDS, npcTier, type GiftReaction, type NpcId } from './lounge-npc-data.ts';
import type { NpcLineSet } from './lounge-npc-line-types.ts';
import { NPC_BANTER } from './lounge-npc-banter.ts';
import { NPC_LOVE_BANTER, npcLoveOpener, npcLovePools, type NpcLoveContext } from './lounge-npc-love.ts';
import type { NpcSpot } from './lounge-npc-schedule.ts';
import { LUMI_LINES } from './lounge-npc-lines-lumi.ts';
import { MAEHWA_LINES } from './lounge-npc-lines-maehwa.ts';
import { CAPTAIN_LINES } from './lounge-npc-lines-captain.ts';
import { REALTOR_LINES } from './lounge-npc-lines-realtor.ts';
import { MISUN_LINES } from './lounge-npc-lines-misun.ts';
import { CARPENTER_LINES } from './lounge-npc-lines-carpenter.ts';
import { ROSE_LINES } from './lounge-npc-lines-rose.ts';
import { NYAMO_LINES } from './lounge-npc-lines-nyamo.ts';
import { GWEN_LINES } from './lounge-npc-lines-gwen.ts';
import { NASERA_LINES } from './lounge-npc-lines-nasera.ts';
import { FRIEREN_LINES } from './lounge-npc-lines-frieren.ts';
import { THRESH_LINES } from './lounge-npc-lines-thresh.ts';
import { SINJJAJANG_LINES } from './lounge-npc-lines-sinjjajang.ts';
import { VOLIBAS_LINES } from './lounge-npc-lines-volibas.ts';
import { JANNA_LINES } from './lounge-npc-lines-janna.ts';
import { GABUNG_LINES } from './lounge-npc-lines-gabung.ts';
import { LUX_LINES } from './lounge-npc-lines-lux.ts';
import { HIMMEL_LINES } from './lounge-npc-lines-himmel.ts';
import { BEATRICE_LINES } from './lounge-npc-lines-beatrice.ts';
import { BOCCHI_LINES } from './lounge-npc-lines-bocchi.ts';
import { TSUNADE_LINES } from './lounge-npc-lines-tsunade.ts';
import { MAKIMA_LINES } from './lounge-npc-lines-makima.ts';
import { YANINEKO_LINES } from './lounge-npc-lines-yanineko.ts';

export const NPC_LINES: Record<NpcId, NpcLineSet> = {
  lumi: LUMI_LINES,
  maehwa: MAEHWA_LINES,
  captain: CAPTAIN_LINES,
  realtor: REALTOR_LINES,
  misun: MISUN_LINES,
  carpenter: CARPENTER_LINES,
  rose: ROSE_LINES,
  nyamo: NYAMO_LINES,
  gwen: GWEN_LINES,
  nasera: NASERA_LINES,
  frieren: FRIEREN_LINES,
  thresh: THRESH_LINES,
  sinjjajang: SINJJAJANG_LINES,
  volibas: VOLIBAS_LINES,
  janna: JANNA_LINES,
  gabung: GABUNG_LINES,
  lux: LUX_LINES,
  himmel: HIMMEL_LINES,
  beatrice: BEATRICE_LINES,
  bocchi: BOCCHI_LINES,
  tsunade: TSUNADE_LINES,
  makima: MAKIMA_LINES,
  yanineko: YANINEKO_LINES,
};

const pick = <T>(pool: readonly T[] | undefined, key: string): T | undefined => (pool && pool.length ? pool[hash32(key) % pool.length] : undefined);

/** Fills {me} {name} {season} {weather} {item} {n} {place} {other} {forecast}; unknown keys stay visible. */
export function fillNpcLine(template: string, vars: Record<string, string | number | undefined>) {
  return template.replace(/\{(\w+)\}/g, (all, key: string) => (vars[key] === undefined ? all : String(vars[key])));
}

/**
 * 잔나's forecast for tomorrow. It is right most days; on about one day in
 * four she says something else (her running joke). The miss is part of the
 * forecast, so every screen hears the same wrong forecast.
 */
export function jannaForecast(day: number): { weather: Weather; text: string; wrong: boolean } {
  const actual = weatherOf(day + 1);
  const wrong = hash32(`janna-forecast:${day}`) % 4 === 0;
  const options: Weather[] = ['sunny', 'cloudy', 'rain'].filter((w) => w !== actual) as Weather[];
  const weather = wrong ? options[hash32(`janna-miss:${day}`) % options.length] : actual;
  return { weather, text: WEATHER_INFO[weather].name, wrong };
}
/** Whether yesterday's forecast missed today (she apologizes). */
export const jannaMissedToday = (day: number) => jannaForecast(day - 1).weather !== weatherOf(day);

export type NpcTalkContext = {
  npc: NpcId;
  /** The speaker's name ({me}). */
  me: string;
  /** Stable per-person key (actor number or uid). */
  who: string | number;
  now: number;
  points: number;
  talkedToday: boolean;
  lastGift?: string;
  /** Item name of lastGift (the caller resolves names). */
  lastGiftName?: string;
  spot?: Pick<NpcSpot, 'activity' | 'area' | 'label'> | null;
} & Partial<Pick<NpcLoveContext, 'love' | 'days' | 'atHome' | 'otherPartner'>>;
export type NpcTalk = { lines: string[]; tier: 0 | 1 | 2 | 3 | 4 };

/** The fill-ins and the body pools of a talk (npcTalk, npcTalkReply). */
function talkParts(ctx: Omit<NpcTalkContext, 'talkedToday'>) {
  const L = NPC_LINES[ctx.npc];
  const day = kstDay(ctx.now);
  const tier = npcTier(ctx.points);
  const key = (k: string) => `${ctx.npc}:${ctx.who}:${day}:${k}`;
  const weather = weatherOf(day);
  const vars = {
    me: ctx.me,
    name: NPCS[ctx.npc].name,
    season: SEASON_INFO[seasonOf(ctx.now)].name,
    weather: WEATHER_INFO[weather].name,
    place: ctx.spot?.label,
    item: ctx.lastGiftName,
    forecast: jannaForecast(day).text,
    partner: ctx.otherPartner,
    days: ctx.days,
  };
  const f = (s: string | undefined) => (s ? fillNpcLine(s, vars) : '');
  // Body: what they are doing, you two, the season, a joke or a memory.
  const pools = () =>
    [
      ctx.spot?.activity ? L.activity[ctx.spot.activity] : undefined,
      L.tier[tier],
      L.tier[tier],
      L.season[seasonOf(ctx.now)],
      L.jokes,
      L.tone?.[NPC_SISTER_FRIENDS.includes(ctx.me) ? 'sister' : 'hannam'],
      ctx.lastGiftName ? L.gift.remember : undefined,
      ctx.npc === 'janna' && jannaMissedToday(day) ? JANNA_MISS : undefined,
      // 연애·결혼 (lounge-npc-love.ts): the heart band or partner lines, home, jealousy.
      ...npcLovePools(ctx, ctx.now),
    ].filter((p): p is string[] => !!p && p.length > 0);
  return { L, day, tier, key, weather, f, pools };
}

/** Two lines: an opener (time/weather/festival) and something about them, you, the season or a joke. */
export function npcTalk(ctx: NpcTalkContext): NpcTalk {
  const { L, day, tier, key, weather, f, pools } = talkParts(ctx);
  if (ctx.talkedToday) return { lines: [f(pick(L.talked, key('talked')))], tier };
  const festival = holidaysOn(day).some((h) => !!h.claim);
  const marketDay = new Date(ctx.now + 9 * 3_600_000).getUTCDay() === 0;
  // Opener.
  let opener: string | undefined;
  const slot = hash32(key('opener')) % 10;
  if (festival && slot < 6) opener = pick(L.festival, key('festival'));
  else if (weather !== 'sunny' && weather !== 'cloudy' && slot < 5) opener = pick(L.weather[weather as keyof NpcLineSet['weather']], key('weather'));
  else if (marketDay && ctx.spot?.area === 'market' && slot < 5) opener = pick(L.marketDay, key('market'));
  if (!opener && ctx.love) opener = npcLoveOpener(ctx.npc, ctx.now, weather, seasonOf(ctx.now), key('love'));
  opener ??= pick(L.greet[timeOfDay(ctx.now)], key('greet'));
  const body = pick(pick(pools(), key('pool')), key('body'));
  const lines = [f(opener), f(body)].filter((s, i, a) => s && a.indexOf(s) === i);
  return { lines, tier };
}

/**
 * What they answer after "이야기 나누기" in the speech box: a line from the
 * same pools as the talk's second line, but never one already said in this
 * conversation (`said`), so the talk does not repeat the page just read.
 * Same person, day and lines give the same answer on every screen.
 */
export function npcTalkReply(ctx: Omit<NpcTalkContext, 'talkedToday'>, said: readonly string[]): string {
  const { L, key, f, pools } = talkParts(ctx);
  const fresh = [...new Set(pools().flat().map(f))].filter((s) => s && !said.includes(s));
  return pick(fresh, key('reply')) ?? f(pick(L.talked, key('talked')));
}
const JANNA_MISS = ['어제 예보가 빗나갔어요. 정정 보도 나갑니다. 죄송해요!', '어제 제가 뭐라고 했죠? …못 들은 걸로 해 주세요.'];

/** A gift reaction line. */
export function npcGiftLine(npc: NpcId, reaction: GiftReaction | 'again', vars: { me: string; item: string; who: string | number; now: number }) {
  const L = NPC_LINES[npc];
  const pool = reaction === 'again' ? L.gift.again : L.gift[reaction];
  const line = pick(pool, `${npc}:${vars.who}:${kstDay(vars.now)}:gift:${reaction}:${vars.item}`) ?? '';
  return fillNpcLine(line, { me: vars.me, item: vars.item, name: NPCS[npc].name });
}
/** Invite / date / dismiss replies. */
export function npcVisitLine(npc: NpcId, op: 'invite' | 'date' | 'dismiss', vars: { me: string; who: string | number; now: number }) {
  const line = pick(NPC_LINES[npc][op], `${npc}:${vars.who}:${kstDay(vars.now)}:${op}`) ?? '';
  return fillNpcLine(line, { me: vars.me, name: NPCS[npc].name });
}
/** An overhead bubble: idle, someone near, rain, night (short lines). */
export function npcBubble(npc: NpcId, kind: 'idle' | 'near' | 'rain' | 'night', key: string, vars: { me?: string; now: number }) {
  const line = pick(NPC_LINES[npc].bubble[kind], `${npc}:bubble:${kind}:${key}`) ?? '';
  return fillNpcLine(line, { me: vars.me ?? '', forecast: jannaForecast(kstDay(vars.now)).text });
}
/** Request board text for a posted request. */
export function npcRequestLine(npc: NpcId, kind: 'post' | 'done' | 'coop', vars: { item: string; n: number; key: string }) {
  const line = pick(NPC_LINES[npc].request[kind], `${npc}:req:${kind}:${vars.key}`) ?? '';
  return fillNpcLine(line, { item: vars.item, n: vars.n, name: NPCS[npc].name });
}
/** Banter between two residents: the exchange for this meeting (null when they have none). */
export function npcBanter(a: NpcId, b: NpcId, key: string): { first: NpcId; second: NpcId; lines: readonly [string, string] } | null {
  // Everyday and love banter of the pair together (each keeps its own speaking order).
  const entries = [...NPC_BANTER, ...NPC_LOVE_BANTER].filter((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  const all = entries.flatMap((e) => e.lines.map((lines) => ({ first: e.a as NpcId, second: e.b as NpcId, lines })));
  if (!all.length) return null;
  const [x, y] = a < b ? [a, b] : [b, a];
  return all[hash32(`banter:${x}:${y}:${key}`) % all.length];
}
/** Every line of a resident (tests: counts, no emoji). */
export function allNpcLines(npc: NpcId): string[] {
  const L = NPC_LINES[npc];
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(L);
  return out;
}
