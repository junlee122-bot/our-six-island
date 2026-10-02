// Which residents' ties I have found out (주민 수첩 · 관계): a tie is known
// once I have overheard or joined the pair, or once I am friends (20 points)
// with one of them, since a friend tells you about the people around them.
// The overheard pairs are kept with the account (life.ext npcTiesSeen, noted
// by the server's 엿듣기 / 끼어들기); older clients kept them in this browser,
// and those are sent once (npcTies) and then cleared here.
import type { CloudRoom } from '../lounge-cloud-room';
import { NPC_INVITE_POINTS, type NpcId } from '../lounge-npc-data.ts';
import { NPC_TIE_KEYS, pairKey } from '../lounge-npc-social-ties.ts';

const KEY = 'bumtadew:npc-ties-seen';
/** Pairs the older client kept in this browser (valid tie keys only). */
export function legacyNpcTiesSeen(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): string[] {
  try {
    const raw = storage?.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? [...new Set(list.filter((x): x is string => typeof x === 'string' && NPC_TIE_KEYS.has(x)))] : [];
  } catch {
    return [];
  }
}
/**
 * Sends this browser's old overheard pairs to the account once, then clears
 * them. Nothing is sent when there are none (or storage is blocked).
 */
export async function migrateNpcTiesSeen(room: Pick<CloudRoom, 'life'>, storage: Pick<Storage, 'getItem' | 'removeItem'> | undefined = globalThis.localStorage) {
  let raw: string | null = null;
  try {
    raw = storage?.getItem(KEY) ?? null;
  } catch {
    return false;
  }
  if (raw === null) return false;
  const pairs = legacyNpcTiesSeen(storage);
  if (pairs.length && !(await room.life({ kind: 'npcTies', pairs }))) return false;
  try {
    storage?.removeItem(KEY);
  } catch {
    // Storage blocked: the next load tries again (the server takes them once).
  }
  return true;
}
/** Whether the tie between `a` and `b` shows on the 관계 page. */
export function npcTieKnown(a: NpcId, b: NpcId, points: (id: NpcId) => number, seen: ReadonlySet<string>) {
  return seen.has(pairKey(a, b)) || points(a) >= NPC_INVITE_POINTS || points(b) >= NPC_INVITE_POINTS;
}
