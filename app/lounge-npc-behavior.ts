// How residents behave between the steps of their schedule, on this screen
// only (no server, no realtime): look around, turn to someone who comes
// close, greet them, a line now and then (rain and night have their own),
// chat with a friend they bump into, and step aside so they never stand
// inside each other or inside a player. Pure apart from `memory`, a small
// per-screen record of who was greeted when (so a greeting plays once per
// approach). Time windows are hashed from the resident and the clock, so two
// friends watching the same resident mostly see the same idle beats.
import { hash32 } from './lounge-calendar.ts';
import { npcBond, NPCS, type NpcId } from './lounge-npc-data.ts';
import { npcBanter, npcBubble } from './lounge-npc-dialog.ts';
import type { NpcSpot } from './lounge-npc-schedule.ts';

export type ResidentGesture = 'none' | 'wave' | 'nod' | 'look' | 'stretch' | 'shiver' | 'talk';
export type ResidentFrame = {
  id: NpcId;
  x: number;
  z: number;
  /** Radians about y (0 = toward the camera). */
  facing: number;
  walking: boolean;
  gesture: ResidentGesture;
  bubble: string | null;
  /** The schedule's label ("빵집 카페"), for the name tag's tooltip. */
  label: string;
};
export type NearbyPerson = { id: string; name: string; x: number; z: number };
export type BehaviorMemory = {
  /** Resident → person id → when they last greeted (ms). */
  greeted: Map<string, number>;
  /** Resident → person id currently within greeting range. */
  near: Map<string, string>;
};
export const newBehaviorMemory = (): BehaviorMemory => ({ greeted: new Map(), near: new Map() });

export const GREET_RANGE = 3.2;
export const CHAT_RANGE = 3.6;
const PERSONAL = 0.85;
const GREET_MS = 3_600;
const GREET_AGAIN_MS = 90_000;
const IDLE_PERIOD = 26_000;
const BUBBLE_MS = 3_600;
const CHAT_PERIOD = 42_000;
const LINE_MS = 3_800;

const angleTo = (from: { x: number; z: number }, to: { x: number; z: number }) => Math.atan2(to.x - from.x, to.z - from.z);

/**
 * The frame for each resident at `now` from their schedule spots, the people
 * around and the weather. `canStand` keeps a nudged resident on walkable
 * ground (the nudge is skipped when it would not be).
 */
export function residentFrames(
  spots: readonly NpcSpot[],
  people: readonly NearbyPerson[],
  now: number,
  ctx: { rain: boolean; night: boolean; memory: BehaviorMemory; canStand?: (p: { x: number; z: number }) => boolean },
): ResidentFrame[] {
  const out: ResidentFrame[] = spots.map((s) => ({ id: s.id, x: s.x, z: s.z, facing: s.facing, walking: s.walking, gesture: 'none', bubble: null, label: s.label }));
  // 1. Step aside: residents from each other (in id order), then from people.
  for (let i = 0; i < out.length; i++)
    for (let j = i + 1; j < out.length; j++) {
      const a = out[i],
        b = out[j];
      const dx = b.x - a.x,
        dz = b.z - a.z,
        d = Math.hypot(dx, dz);
      if (d >= PERSONAL) continue;
      const push = (PERSONAL - d) / 2;
      const nx = d > 1e-6 ? dx / d : 1,
        nz = d > 1e-6 ? dz / d : 0;
      nudge(a, -nx * push, -nz * push, ctx.canStand);
      nudge(b, nx * push, nz * push, ctx.canStand);
    }
  for (const r of out)
    for (const p of people) {
      const dx = r.x - p.x,
        dz = r.z - p.z,
        d = Math.hypot(dx, dz);
      if (d >= PERSONAL || d < 1e-6) continue;
      nudge(r, (dx / d) * (PERSONAL - d), (dz / d) * (PERSONAL - d), ctx.canStand);
    }
  // 2. Chats: two standing residents close together with a bond take turns.
  const chatting = new Set<NpcId>();
  for (let i = 0; i < out.length; i++)
    for (let j = i + 1; j < out.length; j++) {
      const a = out[i],
        b = out[j];
      if (a.walking || b.walking || chatting.has(a.id) || chatting.has(b.id)) continue;
      if (Math.hypot(a.x - b.x, a.z - b.z) > CHAT_RANGE || !npcBond(a.id, b.id)) continue;
      const pair = [a.id, b.id].sort().join(':');
      const window = Math.floor(now / CHAT_PERIOD);
      const into = now - window * CHAT_PERIOD;
      const banter = npcBanter(a.id, b.id, `${pair}:${window}`);
      if (!banter) continue;
      chatting.add(a.id).add(b.id);
      const first = banter.first === a.id ? a : b,
        second = first === a ? b : a;
      first.facing = angleTo(first, second);
      second.facing = angleTo(second, first);
      if (into < LINE_MS) {
        first.bubble = banter.lines[0];
        first.gesture = 'talk';
      } else if (into < LINE_MS * 2) {
        second.bubble = banter.lines[1];
        second.gesture = 'talk';
      } else if (into < LINE_MS * 2 + 1_500) second.gesture = 'nod';
    }
  // 3. People nearby: turn to the closest, greet on arrival.
  for (const r of out) {
    let best: NearbyPerson | null = null,
      bestD = Infinity;
    for (const p of people) {
      const d = Math.hypot(p.x - r.x, p.z - r.z);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    const key = r.id;
    if (best && bestD <= GREET_RANGE) {
      if (!r.walking) r.facing = angleTo(r, best);
      const was = ctx.memory.near.get(key);
      const greetKey = `${r.id}>${best.id}`;
      const last = ctx.memory.greeted.get(greetKey) ?? -Infinity;
      if (was !== best.id && now - last > GREET_AGAIN_MS) ctx.memory.greeted.set(greetKey, now);
      ctx.memory.near.set(key, best.id);
      const since = now - (ctx.memory.greeted.get(greetKey) ?? -Infinity);
      // Only people with a name on this screen get a spoken greeting (me); others just get a look.
      if (since >= 0 && since < GREET_MS && !chatting.has(r.id) && best.name) {
        r.bubble = npcBubble(r.id, 'near', `${best.id}:${Math.floor((ctx.memory.greeted.get(greetKey) ?? 0) / 1000)}`, { me: best.name, now });
        r.gesture = r.walking ? 'nod' : 'wave';
      }
      continue;
    }
    ctx.memory.near.delete(key);
    if (r.walking || chatting.has(r.id)) continue;
    // 4. Alone: look around now and then; a short line every so often.
    const offset = hash32(`idle:${r.id}`) % IDLE_PERIOD;
    const window = Math.floor((now + offset) / IDLE_PERIOD);
    const into = (now + offset) - window * IDLE_PERIOD;
    const roll = hash32(`idle:${r.id}:${window}`);
    const look = Math.floor(into / 6_500) % 4;
    r.facing += look === 1 ? 0.7 : look === 3 ? -0.7 : 0;
    if (look === 1 || look === 3) r.gesture = 'look';
    if (into < BUBBLE_MS && roll % 3 === 0) {
      const kind = ctx.rain ? 'rain' : ctx.night ? 'night' : 'idle';
      r.bubble = npcBubble(r.id, kind, String(window), { now });
      r.gesture = ctx.rain ? 'shiver' : 'nod';
    } else if (into > 20_000 && into < 21_600 && roll % 5 === 1) r.gesture = ctx.night ? 'stretch' : 'nod';
  }
  return out;
}
function nudge(r: ResidentFrame, dx: number, dz: number, canStand?: (p: { x: number; z: number }) => boolean) {
  const len = Math.hypot(dx, dz);
  if (len > 0.6) {
    dx = (dx / len) * 0.6;
    dz = (dz / len) * 0.6;
  }
  const p = { x: r.x + dx, z: r.z + dz };
  if (!canStand || canStand(p)) {
    r.x = p.x;
    r.z = p.z;
  }
}
/** The name shown over a resident. */
export const residentName = (id: NpcId) => NPCS[id].name;
