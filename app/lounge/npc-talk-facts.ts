// 주민과 진짜 대화 on the client: what a resident's talk can see right now
// (lounge-npc-talk.ts TalkFacts), read from the room view the screen already
// has — today's catch and field work, a 금별 harvest, weather, season and
// festival, my mood, today's village news, who I talked to, their meeting or
// quarrel, my birthday, and my memories with them. Nothing new is stored on
// the server; the 금별 of today is the 금별 count against this browser's
// count at the start of the day (a small per-device convenience).
import type { CloudRoomView } from '../lounge-cloud-room';
import { SEASON_INFO, WEATHER_INFO, holidaysOn, seasonOf, timeOfDay, weatherOf } from '../lounge-calendar';
import { kstDay } from '../lounge-economy';
import { itemName } from '../lounge-life-plus';
import { pickName } from '../lounge-friend-tastes';
import { NPCS, type NpcId } from '../lounge-npc-data';
import { npcRecentKinds } from '../lounge-npc-recent';
import { npcSocialOf, npcSulkingWith } from '../lounge-npc-social';
import { birthdaySoon, chaptersDone, fillTalk, npcTalkBook, talkDays, virtualMemories, type NpcTalkEntry, type TalkFacts } from '../lounge-npc-talk';

/** 금별 harvested today: stats.gold now against this device's count at the start of the KST day. */
function goldToday(gold: number, day: number) {
  const key = `npc-talk-gold:${day}`;
  try {
    const seen = localStorage.getItem(key);
    if (seen === null) {
      localStorage.setItem(key, String(gold));
      return false;
    }
    return gold > Number(seen);
  } catch {
    return false;
  }
}

export type TalkScene = {
  facts: TalkFacts;
  /** Fills a line of `entry` (its {other} is the resident the talk is about). */
  fill: (text: string, entry?: Pick<NpcTalkEntry, 'when'>) => string;
};

/** The facts and the fill-ins ({fish} {taste} {other}) for `npc`, as of `now`. */
export function talkSceneOf(view: CloudRoomView, npc: NpcId, now: number, myName: string): TalkScene {
  const life = view.life;
  const me = view.players.find((p) => p.id === view.self);
  const actor = me?.actor ?? -1;
  const day = kstDay(now);
  const rows = life?.me.npcRelations ?? [];
  const row = rows.find((r) => r.npc === npc);
  const book = npcTalkBook(npc);
  const last = life?.angling?.me.last;
  const caught = last?.ok && last.fish && kstDay(last.at) === day ? last.fish : null;
  const farmToday = (life?.growth?.skills.find((s) => s.id === 'farm')?.today ?? 0) > 0;
  const tier = life?.mood?.tier;
  const meeting = npcSocialOf(npc, now);
  const withOther = meeting ? (meeting.a === npc ? meeting.b : meeting.a) : null;
  const sulk = npcSulkingWith(npc, day);
  const taste = life?.tastes?.all[actor];
  const tasteSet = !!taste?.set;
  const recent = npcRecentKinds({
    now,
    actor,
    fished: last,
    voyage: life?.voyage,
    stocks: view.stocks?.me,
    tables: view.tableStats?.week,
    museum: life?.museum,
  });
  const facts: TalkFacts = {
    time: timeOfDay(now),
    season: seasonOf(now),
    weather: weatherOf(day),
    festival: holidaysOn(day).some((h) => !!h.claim),
    fish: caught,
    bigFish: !!caught && !!(last?.best || last?.record || last?.legend),
    harvest: farmToday,
    gold: goldToday(life?.me.stats?.gold ?? 0, day),
    mood: tier === 'great' || tier === 'good' ? 'high' : tier === 'low' || tier === 'tired' ? 'low' : 'mid',
    news: life?.newsToday?.all ?? [],
    friendNews: life?.newsToday?.others ?? [],
    recent,
    talkedTo: rows.filter((r) => r.talked && r.npc !== npc).map((r) => r.npc),
    with: withOther,
    sulk,
    bday: !!life?.birthday?.today.includes(actor),
    love: row?.love ?? null,
    ch: book && row ? chaptersDone(book, row) : 0,
    mem: row?.mem ?? [],
    virtual: virtualMemories({
      tastes: tasteSet,
      bdaySoon: birthdaySoon(actor, day),
      outing: !!life?.companion?.me.met.includes(npc),
      dates: row?.dates ?? 0,
    }),
  };
  const vars = {
    me: myName,
    name: NPCS[npc].name,
    season: SEASON_INFO[seasonOf(now)].name,
    weather: WEATHER_INFO[weatherOf(day)].name,
    fish: caught ? itemName(caught) : undefined,
    taste: tasteSet && taste?.l[0] ? pickName(taste.l[0], itemName) : undefined,
    days: row ? `${talkDays(row)}일` : undefined,
  };
  return {
    facts,
    fill: (text, entry) => {
      const other = entry?.when?.bond ?? entry?.when?.with ?? withOther ?? sulk;
      return fillTalk(text, { ...vars, other: other ? NPCS[other].name : undefined });
    },
  };
}
