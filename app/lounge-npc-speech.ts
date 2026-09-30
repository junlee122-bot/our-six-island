// The resident speech box (app/lounge/NpcTalkDialog.tsx) as pure functions:
// hearts from relation points, the small status on the right of the name,
// and the choices offered after the lines. The rules themselves (one talk
// and one gift a day, where they can be met) stay in lounge-romance.ts;
// this only says what the box shows.
import { NPCS, NPC_POINTS_MAX, NPC_TALK_POINTS, type NpcId } from './lounge-npc-data.ts';
import type { NpcSpot } from './lounge-npc-schedule.ts';

/** Relation points (0–120) as the ten hearts a friend shows: one heart per 12 points. */
export function npcHearts(points: number) {
  if (!Number.isFinite(points)) return 0;
  return Math.max(0, Math.min(10, Math.floor(points / (NPC_POINTS_MAX / 10))));
}

/**
 * "빵집 카페 사장 · 광장 벤치에서 별 보는 중": their job, then what they are
 * doing. A label that only repeats their workplace ("빵집 카페" for the
 * bakery owner) reads "일하는 중" instead.
 */
export function npcTalkStatus(npc: NpcId, spot: Pick<NpcSpot, 'label' | 'activity'>) {
  const role = NPCS[npc].role;
  const label = spot.label.trim();
  if (!label) return role;
  if (!role.includes(label) && !label.startsWith(role)) return `${role} · ${label}`;
  return spot.activity === 'work' || spot.activity === 'stall' ? `${role} · 일하는 중` : role;
}

export type NpcTalkChoiceId = 'talk' | 'gift' | 'book' | 'request' | 'bye';
export type NpcTalkChoice = { id: NpcTalkChoiceId; label: string; disabled: boolean };

/**
 * The choices after the lines, in this order: talk, gift, 주민 수첩, today's
 * request (only where the board can be opened), leave. Talk and gift stay
 * listed once done or out of reach, but cannot be picked.
 */
export function npcTalkChoices(o: {
  talked: boolean;
  gifted: boolean;
  /** A talk or gift is on its way to the server. */
  busy: boolean;
  /** Why talking and giving are not possible right now ('' when they are). */
  blocked: string;
  /** Today's request ("당근 3개") when it is open and the board is reachable. */
  request?: string | null;
}): NpcTalkChoice[] {
  const off = o.busy || !!o.blocked;
  return [
    { id: 'talk', label: o.talked ? '오늘 대화 완료' : `이야기 나누기 · +${NPC_TALK_POINTS}`, disabled: off || o.talked },
    { id: 'gift', label: o.gifted ? '오늘 선물 완료' : '선물 주기', disabled: off || o.gifted },
    { id: 'book', label: '주민 수첩', disabled: false },
    ...(o.request ? [{ id: 'request' as const, label: `부탁 보기 · ${o.request}`, disabled: false }] : []),
    { id: 'bye', label: '그만 가기', disabled: false },
  ];
}

/**
 * Where the cursor starts when the choices appear. Holding E through a talk
 * should never hand over an item or open another window: the cursor starts
 * on talking while that is possible, else on leaving; after a reply it goes
 * to leaving (like a friend's box, which closes after their reply), and back
 * from the gift picker it returns to "선물 주기".
 */
export function npcTalkFocus(choices: readonly NpcTalkChoice[], after: 'open' | 'reply' | 'picker' = 'open') {
  const at = (id: NpcTalkChoiceId) => choices.findIndex((c) => c.id === id && !c.disabled);
  if (after === 'picker' && at('gift') >= 0) return at('gift');
  if (after === 'open' && at('talk') >= 0) return at('talk');
  return choices.findIndex((c) => c.id === 'bye');
}
