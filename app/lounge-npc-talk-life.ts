// 주민과 진짜 대화, the server side: the life action `npcChat` (on a cloned
// LifeState, like every life action; the cloud engine checks first that I
// stand by the resident, and a replayed request is refused by its sequence).
//   talk   today's choice talk (once per 나의 하루 per resident): the reply's
//          tier becomes relation points, its memory is kept
//   story  the next chapter, when it is open (its item is taken if asked)
//   visit  I came to the place and time the next chapter asked for
// Points go through the same path as every talk (npcAddPoints: 친화력, the
// 8-heart cap without dating), so hearts, presents and love stages are as before.
import { myDay } from './lounge-myday.ts';
import { kstDay } from './lounge-economy.ts';
import { gameHour } from './lounge-calendar.ts';
import { LifeError, type LifeState } from './lounge-life.ts';
import { itemCount, takeItem } from './lounge-life-plus.ts';
import { isNpcId, type NpcId } from './lounge-npc-data.ts';
import { newNpcRelation, npcAddPoints, npcLevelPresents, type NpcRelation } from './lounge-romance.ts';
import {
  STORY_TIER_POINTS,
  TALK_TIER_POINTS,
  chaptersDone,
  condHolds,
  forget,
  nextChapter,
  npcTalkBook,
  remember,
  talkDays,
  talkEntry,
  birthdaySoon,
  virtualMemories,
  visitDue,
  type TalkFacts,
  type TalkTier,
} from './lounge-npc-talk.ts';

export type NpcTalkAction =
  | { kind: 'npcChat'; npc: NpcId; op: 'talk'; id: string; pick: number }
  | { kind: 'npcChat'; npc: NpcId; op: 'story'; pick: number }
  /** `where` is set by the cloud engine from where I really stand. */
  | { kind: 'npcChat'; npc: NpcId; op: 'visit'; where?: string };
export const NPC_TALK_OPS = ['talk', 'story', 'visit'] as const;

const fail = (text: string): never => {
  throw new LifeError(text);
};

/**
 * What the server checks of a talk's conditions: the state it keeps (memories,
 * chapters, love, the '@' memories). The moment (time of day, weather, what I
 * caught…) is left unknown so it holds: the opener was picked when the box
 * opened, and the game clock may roll over before I answer.
 */
export function serverTalkFacts(life: LifeState, uid: string, npc: NpcId, relation: NpcRelation, now: number): TalkFacts {
  const book = npcTalkBook(npc);
  const day = kstDay(now);
  const actor = life.actors?.[uid];
  return {
    love: relation.love ?? null,
    ch: book ? chaptersDone(book, relation) : 0,
    mem: relation.mem ?? [],
    virtual: virtualMemories({
      tastes: typeof actor === 'number' && !!life.tastes?.[String(actor)],
      bdaySoon: birthdaySoon(actor, day),
      outing: !!life.companions?.[uid]?.met?.includes(npc),
      dates: relation.dates ?? 0,
    }),
  };
}

const validPick = (pick: unknown, n: number) => typeof pick === 'number' && Number.isInteger(pick) && pick >= 0 && pick < n;

/** Runs on a cloned LifeState. Returns the tier of my reply (none for a visit). */
export function npcTalkAction(life: LifeState, uid: string, a: NpcTalkAction, now: number): { tier?: TalkTier; presents: [string, number][] } {
  if (!a || !isNpcId(a.npc) || !(NPC_TALK_OPS as readonly string[]).includes(a.op)) fail('주민과 나눌 이야기를 다시 골라 주세요.');
  const book = npcTalkBook(a.npc) ?? fail('이 주민과는 아직 이야기를 고를 수 없어요.');
  const user = ((life.ext ??= {})[uid] ??= {});
  const relation = ((user.npcRelations ??= {})[a.npc] ??= newNpcRelation());
  // From here on this row keeps its own progress (an old row is placed by its points once).
  relation.ch = chaptersDone(book, relation);
  relation.tc = talkDays(relation);
  if (a.op === 'visit') {
    if (typeof a.where !== 'string' || !visitDue(book, relation, a.where, gameHour(now))) fail('약속한 곳과 때가 아니에요.');
    relation.vis = relation.ch + 1;
    return { presents: [] };
  }
  let tier: TalkTier;
  if (a.op === 'talk') {
    const pday = myDay(life, uid, now);
    if (relation.talkedDay === pday) fail('오늘 이야기는 나눴어요. 내일 또 만나 주세요.');
    const entry = talkEntry(book, typeof a.id === 'string' ? a.id : '') ?? fail('주민과 나눌 이야기를 다시 골라 주세요.');
    if (!condHolds(entry.when, serverTalkFacts(life, uid, a.npc, relation, now))) fail('지금은 그 이야기를 꺼낼 때가 아니에요.');
    if (!validPick(a.pick, entry.replies.length)) fail('대답을 다시 골라 주세요.');
    const reply = entry.replies[a.pick];
    relation.talkedDay = pday;
    relation.tc += 1;
    relation.mem = remember(forget(relation.mem, entry.use), reply.remember);
    tier = reply.tier;
    npcAddPoints(life, uid, relation, TALK_TIER_POINTS[tier], now);
  } else {
    const next = nextChapter(book, relation, (item) => itemCount(life, uid, item));
    if (!next.chapter) fail('함께한 이야기를 모두 봤어요.');
    if (!next.open) fail('다음 이야기는 아직이에요. 주민 수첩에서 실마리를 확인해 주세요.');
    const chapter = next.chapter!;
    if (!validPick(a.pick, chapter.replies.length)) fail('대답을 다시 골라 주세요.');
    const reply = chapter.replies[a.pick];
    if (chapter.need.bring?.take) takeItem(life, uid, chapter.need.bring.item, 1);
    relation.ch = next.n!;
    delete relation.vis;
    relation.mem = remember(relation.mem, reply.remember);
    tier = reply.tier;
    npcAddPoints(life, uid, relation, STORY_TIER_POINTS[tier], now);
  }
  if (!relation.mem?.length) delete relation.mem;
  return { tier, presents: npcLevelPresents(life, uid, a.npc, relation) };
}
