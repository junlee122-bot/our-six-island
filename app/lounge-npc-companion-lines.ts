// 동행 대사 고르기 (design-npc-companion.md 1-4, 결정됨): the companion files
// (lounge-npc-companion-lines-<id>.ts) and the pure pickers the client uses —
// the companion talk (E), the bubbles over their head (a few per game hour),
// the accept / parting lines and the suggestions toward a nearby spot.
// Deterministic like lounge-npc-dialog.ts: the same moment gives the same line.
// Client only (the server never loads the lines; lounge-companion-data.ts has
// the places it needs).
import { GAME_HOUR_MS, SEASON_INFO, WEATHER_INFO, hash32, seasonOf, timeOfDay, weatherOf } from './lounge-calendar.ts';
import { kstDay } from './lounge-economy.ts';
import { NPCS, type NpcId } from './lounge-npc-data.ts';
import { fillNpcLine } from './lounge-npc-dialog.ts';
import { companionMomentNow, momentKey } from './lounge-companion.ts';
import { COMPANION_BUBBLES_PER_HOUR, type CompanionEnd } from './lounge-companion-data.ts';
import {
  COMPANION_MOMENTS,
  isCompanionPlace,
  type CompanionActivity,
  type CompanionLineSet,
  type CompanionMoment,
  type CompanionPlace,
  type CompanionReact,
} from './lounge-npc-companion-line-types.ts';
import { LUMI_COMPANION } from './lounge-npc-companion-lines-lumi.ts';
import { MAEHWA_COMPANION } from './lounge-npc-companion-lines-maehwa.ts';
import { CAPTAIN_COMPANION } from './lounge-npc-companion-lines-captain.ts';
import { REALTOR_COMPANION } from './lounge-npc-companion-lines-realtor.ts';
import { MISUN_COMPANION } from './lounge-npc-companion-lines-misun.ts';
import { CARPENTER_COMPANION } from './lounge-npc-companion-lines-carpenter.ts';
import { ROSE_COMPANION } from './lounge-npc-companion-lines-rose.ts';
import { NYAMO_COMPANION } from './lounge-npc-companion-lines-nyamo.ts';
import { GWEN_COMPANION } from './lounge-npc-companion-lines-gwen.ts';
import { NASERA_COMPANION } from './lounge-npc-companion-lines-nasera.ts';
import { FRIEREN_COMPANION } from './lounge-npc-companion-lines-frieren.ts';
import { THRESH_COMPANION } from './lounge-npc-companion-lines-thresh.ts';
import { SINJJAJANG_COMPANION } from './lounge-npc-companion-lines-sinjjajang.ts';
import { VOLIBAS_COMPANION } from './lounge-npc-companion-lines-volibas.ts';
import { JANNA_COMPANION } from './lounge-npc-companion-lines-janna.ts';
import { GABUNG_COMPANION } from './lounge-npc-companion-lines-gabung.ts';
import { LUX_COMPANION } from './lounge-npc-companion-lines-lux.ts';
import { HIMMEL_COMPANION } from './lounge-npc-companion-lines-himmel.ts';
import { BEATRICE_COMPANION } from './lounge-npc-companion-lines-beatrice.ts';
import { BOCCHI_COMPANION } from './lounge-npc-companion-lines-bocchi.ts';
import { TSUNADE_COMPANION } from './lounge-npc-companion-lines-tsunade.ts';
import { MAKIMA_COMPANION } from './lounge-npc-companion-lines-makima.ts';
import { YANINEKO_COMPANION } from './lounge-npc-companion-lines-yanineko.ts';
import { MUZAN_COMPANION } from './lounge-npc-companion-lines-muzan.ts';
import { NILAH_COMPANION } from './lounge-npc-companion-lines-nilah.ts';
import { HAKU_COMPANION } from './lounge-npc-companion-lines-haku.ts';
import { ORNN_COMPANION } from './lounge-npc-companion-lines-ornn.ts';
import { MERCY_COMPANION } from './lounge-npc-companion-lines-mercy.ts';
import { SHINICHI_COMPANION } from './lounge-npc-companion-lines-shinichi.ts';

export const COMPANION_LINES: Record<NpcId, CompanionLineSet> = {
  lumi: LUMI_COMPANION,
  maehwa: MAEHWA_COMPANION,
  captain: CAPTAIN_COMPANION,
  realtor: REALTOR_COMPANION,
  misun: MISUN_COMPANION,
  carpenter: CARPENTER_COMPANION,
  rose: ROSE_COMPANION,
  nyamo: NYAMO_COMPANION,
  gwen: GWEN_COMPANION,
  nasera: NASERA_COMPANION,
  frieren: FRIEREN_COMPANION,
  thresh: THRESH_COMPANION,
  sinjjajang: SINJJAJANG_COMPANION,
  volibas: VOLIBAS_COMPANION,
  janna: JANNA_COMPANION,
  gabung: GABUNG_COMPANION,
  lux: LUX_COMPANION,
  himmel: HIMMEL_COMPANION,
  beatrice: BEATRICE_COMPANION,
  bocchi: BOCCHI_COMPANION,
  tsunade: TSUNADE_COMPANION,
  makima: MAKIMA_COMPANION,
  yanineko: YANINEKO_COMPANION,
  muzan: MUZAN_COMPANION,
  nilah: NILAH_COMPANION,
  haku: HAKU_COMPANION,
  ornn: ORNN_COMPANION,
  mercy: MERCY_COMPANION,
  shinichi: SHINICHI_COMPANION,
};

/** What a place is called in a line ({place}). */
export const COMPANION_PLACE_NAMES: Record<CompanionPlace, string> = {
  village: '마을 광장',
  market: '시장 거리',
  harbor: '항구',
  hillside: '언덕 주택가',
  ranch: '목장·과수원',
  foothill: '산기슭 마을',
  hill: '뒷산',
  woods: '숲 깊은 곳',
  mine: '광산',
  offshore: '먼바다',
  farm: '우리 농장',
};
/** Spots a companion may suggest, per place ({spot}). The village forage spots come from today's spawns. */
const SUGGEST_SPOTS: Record<CompanionPlace, { fish: readonly string[]; forage: readonly string[] }> = {
  village: { fish: ['강', '연못', '다리 위', '호숫가 선착장', '윗물 여울'], forage: ['북쪽 숲길', '강변 캠프', '과수원 피크닉', '동쪽 산책길'] },
  market: { fish: ['마을 강', '다리 위'], forage: ['북쪽 숲길', '과수원 피크닉'] },
  harbor: { fish: ['방파제', '큰 선착장'], forage: ['갯바위 쪽 모래밭', '방파제 끝'] },
  hillside: { fish: ['마을 강', '연못'], forage: ['언덕 공원', '츠나데 텃밭 울타리'] },
  ranch: { fish: ['개울', '징검다리'], forage: ['과일나무 아래', '초원 끝'] },
  foothill: { fish: ['윗물 여울', '폭포 소'], forage: ['광산 입구 옆 덤불', '온천 공사장 뒤'] },
  hill: { fish: ['폭포 소', '윗물 여울'], forage: ['능선 덤불', '곰바위 동굴 옆'] },
  woods: { fish: ['폭포 소', '숲 개울'], forage: ['버섯 통나무', '오래된 그루터기'] },
  mine: { fish: ['폭포 소', '윗물 여울'], forage: ['다음 층 바위', '광맥 줄기'] },
  offshore: { fish: ['뱃머리', '뱃전 아래'], forage: ['뱃머리', '갑판 끝'] },
  farm: { fish: ['마을 강', '연못'], forage: ['밭 가장자리', '울타리 너머'] },
};

const pick = <T>(pool: readonly T[] | undefined, key: string): T | undefined => (pool && pool.length ? pool[hash32(key) % pool.length] : undefined);
const placeOf = (area: string | undefined): CompanionPlace | null => (isCompanionPlace(area) ? area : null);

export type CompanionLineVars = { me: string; npc: NpcId; now: number; area?: string; spot?: string; other?: string; friend?: string };
export function fillCompanionLine(text: string, v: CompanionLineVars) {
  const day = kstDay(v.now),
    place = placeOf(v.area);
  return fillNpcLine(text, {
    me: v.me,
    name: NPCS[v.npc].name,
    place: place ? COMPANION_PLACE_NAMES[place] : '여기',
    weather: WEATHER_INFO[weatherOf(day)].name,
    season: SEASON_INFO[seasonOf(v.now)].name,
    spot: v.spot,
    other: v.other,
    friend: v.friend,
  });
}

/** 같이 다닐래요? → yes (the first time with them: their first-accept line; a partner: the love line). */
export function companionAcceptLine(npc: NpcId, o: { first: boolean; love: boolean; me: string; now: number }) {
  const set = COMPANION_LINES[npc];
  const pool = o.first ? set.firstAccept : o.love ? set.love.accept : set.accept;
  return fillCompanionLine(pick(pool, `accept:${npc}:${o.me}:${Math.floor(o.now / GAME_HOUR_MS)}`) ?? set.accept[0], { me: o.me, npc, now: o.now });
}
/** Turning down because of their shop (or 무잔's daylight). */
export const companionBusyLine = (npc: NpcId, me: string, now: number) =>
  fillCompanionLine(pick(COMPANION_LINES[npc].busy, `busy:${npc}:${me}:${Math.floor(now / GAME_HOUR_MS)}`)!, { me, npc, now });
/** The parting line (보내기, the clock, the shop's opening). */
export function companionPartLine(npc: NpcId, o: { love: boolean; me: string; now: number; end?: CompanionEnd }) {
  const set = COMPANION_LINES[npc];
  const pool = o.end === 'shop' || o.end === 'night' ? set.busy : o.love ? set.love.part : set.part;
  return fillCompanionLine(pick(pool, `part:${npc}:${o.me}:${o.now}`)!, { me: o.me, npc, now: o.now });
}

export type CompanionTalkContext = {
  npc: NpcId;
  me: string;
  actor: number;
  now: number;
  /** Where I stand (the area id). */
  area?: string;
  /** What I did last (the companion's event, or the last activity). */
  activity?: CompanionActivity | null;
  /** My partner (연인·약혼·결혼). */
  love: boolean;
  /** My mood is low (지쳤어요). */
  lowMood?: boolean;
  /** One-off moments already said, and the ones the server saw on this outing. */
  said: readonly string[];
  pend: readonly CompanionMoment[];
  /** A resident within earshot ({other}) and a friend nearby ({friend}). */
  other?: string;
  friend?: string;
  /** An untaken forage spot nearby (the village's spawns; 신이치's hint). */
  forageSpot?: string;
  /** How many times I pressed E this outing (the talk walks through its kinds). */
  turn: number;
};
export type CompanionTalkLine = { text: string; moment?: CompanionMoment; kind: string };

/** The one-off moment that can be said right now (pending ones first), if any. */
export function companionMomentDue(c: Pick<CompanionTalkContext, 'npc' | 'actor' | 'now' | 'area' | 'said' | 'pend'>): CompanionMoment | null {
  const fresh = (m: CompanionMoment) => !c.said.includes(momentKey(c.npc, m));
  for (const m of c.pend) if (fresh(m)) return m;
  const places = COMPANION_LINES[c.npc].places;
  for (const m of COMPANION_MOMENTS)
    if (fresh(m) && companionMomentNow({ moment: m, npc: c.npc, actor: c.actor, now: c.now, where: c.area, fav: places.fav, bad: places.bad })) return m;
  return null;
}

/**
 * What the companion says when I press E: a one-off moment when one is due,
 * otherwise a turn through the kinds — where we are, what I just did, the
 * time or the weather, our small talk, now and then a suggestion toward a
 * nearby spot, a word about a passer-by or a friend nearby, and the love
 * lines with a partner.
 */
export function companionTalk(c: CompanionTalkContext): CompanionTalkLine {
  const set = COMPANION_LINES[c.npc];
  const vars = { me: c.me, npc: c.npc, now: c.now, area: c.area, other: c.other, friend: c.friend };
  const key = `talk:${c.npc}:${c.me}:${Math.floor(c.now / GAME_HOUR_MS)}:${c.turn}`;
  const moment = companionMomentDue(c);
  if (moment) return { text: fillCompanionLine(pick(set.moment[moment], key)!, vars), moment, kind: 'moment' };
  if (c.lowMood && c.turn % 3 === 0) return { text: fillCompanionLine(pick(set.lowMood, key)!, vars), kind: 'lowMood' };
  const place = placeOf(c.area);
  const day = kstDay(c.now),
    sky = weatherOf(day);
  const kinds: string[] = ['place', 'chat', 'activity', 'time', 'chat', 'suggest'];
  if (c.love) kinds.splice(2, 0, 'love');
  if (c.other) kinds.push('meet');
  if (c.friend) kinds.push('friend');
  if (sky === 'rain' || sky === 'storm' || sky === 'snow') kinds.push('weather');
  const kind = kinds[c.turn % kinds.length];
  switch (kind) {
    case 'place':
      if (place) return { text: fillCompanionLine(pick(set.place[place], key)!, vars), kind };
      break;
    case 'activity':
      if (c.activity) return { text: fillCompanionLine(pick(set.activity[c.activity], key)!, vars), kind };
      break;
    case 'time':
      return { text: fillCompanionLine(pick(set.time[timeOfDay(c.now)], key)!, vars), kind };
    case 'weather':
      return { text: fillCompanionLine(pick(sky === 'snow' ? set.weather.snow : set.weather.rain, key)!, vars), kind };
    case 'love':
      return { text: fillCompanionLine(pick(set.love.chat, key)!, vars), kind };
    case 'meet':
      return { text: fillCompanionLine(pick(set.meet, key)!, vars), kind };
    case 'friend':
      return { text: fillCompanionLine(pick(set.friend, key)!, vars), kind };
    case 'suggest': {
      const forage = c.npc === 'shinichi' || hash32(`${key}:s`) % 2 === 0;
      const spots = SUGGEST_SPOTS[place ?? 'village'];
      const spot = forage ? (c.forageSpot ?? pick(spots.forage, key)!) : pick(spots.fish, key)!;
      return { text: fillCompanionLine(pick(forage ? set.suggest.forage : set.suggest.fish, key)!, { ...vars, spot }), kind };
    }
  }
  return { text: fillCompanionLine(pick(set.chat, key)!, vars), kind: 'chat' };
}

/**
 * The bubble over the companion's head at `now`, or null: a reaction to what
 * just happened (within a few seconds of it), otherwise an idle line or a
 * word to a passer-by in a few short windows per game hour
 * (COMPANION_BUBBLES_PER_HOUR). Deterministic for one screen and moment.
 */
export const COMPANION_BUBBLE_MS = 4_000;
export function companionBubble(o: { npc: NpcId; me: string; now: number; ev?: { k: CompanionReact; at: number } | null; other?: string | null }): string | null {
  const set = COMPANION_LINES[o.npc];
  const vars = { me: o.me, npc: o.npc, now: o.now, other: o.other ?? undefined };
  if (o.ev && o.now >= o.ev.at && o.now - o.ev.at < COMPANION_BUBBLE_MS) return fillCompanionLine(pick(set.react[o.ev.k], `react:${o.npc}:${o.ev.at}`)!, vars);
  // A few windows per game hour, at hashed offsets.
  const hour = Math.floor(o.now / GAME_HOUR_MS),
    into = o.now - hour * GAME_HOUR_MS,
    slot = GAME_HOUR_MS / COMPANION_BUBBLES_PER_HOUR;
  const i = Math.floor(into / slot),
    start = i * slot + (hash32(`bubble:${o.npc}:${hour}:${i}`) % Math.max(1, slot - COMPANION_BUBBLE_MS));
  if (into < start || into >= start + COMPANION_BUBBLE_MS) return null;
  // The first window of the hour stays quiet every other hour (2–3 a game hour).
  if (i === 0 && hour % 2 === 1) return null;
  if (o.other && hash32(`bubble-meet:${o.npc}:${hour}:${i}`) % 2 === 0) {
    const line = pick(set.meet, `meet:${o.npc}:${hour}:${i}`)!;
    return fillCompanionLine(line, vars).length <= 34 ? fillCompanionLine(line, vars) : fillCompanionLine(pick(set.react.idle, `idle:${o.npc}:${hour}:${i}`)!, vars);
  }
  return fillCompanionLine(pick(set.react.idle, `idle:${o.npc}:${hour}:${i}`)!, vars);
}
