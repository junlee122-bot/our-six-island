// Which residents' ties I have found out (주민 수첩 · 관계): a tie is known
// once I have overheard or joined the pair on this device, or once I am
// friends (20 points) with one of them, since a friend tells you about the
// people around them. The overheard pairs are a per-device convenience
// (localStorage, guarded); the friendship rule needs nothing stored.
import { NPC_INVITE_POINTS, type NpcId } from '../lounge-npc-data';
import { pairKey } from '../lounge-npc-social-ties';

const KEY = 'bumtadew:npc-ties-seen';
function read(): Set<string> {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string').slice(0, 400) : []);
  } catch {
    return new Set();
  }
}
/** Remember that I overheard or joined `a` and `b`. */
export function rememberNpcTie(a: NpcId, b: NpcId) {
  try {
    const seen = read();
    seen.add(pairKey(a, b));
    globalThis.localStorage?.setItem(KEY, JSON.stringify([...seen]));
  } catch {
    // Storage blocked: the friendship rule still applies.
  }
}
/** Whether the tie between `a` and `b` shows on the 관계 page. */
export function npcTieKnown(a: NpcId, b: NpcId, points: (id: NpcId) => number, seen: ReadonlySet<string> = read()) {
  return seen.has(pairKey(a, b)) || points(a) >= NPC_INVITE_POINTS || points(b) >= NPC_INVITE_POINTS;
}
/** The overheard pairs, read once per render. */
export const npcTiesSeen = () => read();
