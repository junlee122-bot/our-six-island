// 주민 동행 on screen: the resident walks a step behind the friend they are
// with (on every friend's screen, from the server's who-walks-with-whom), not
// at their schedule spot; a few bubbles a game hour over their head; the
// minimap dot beside the friend; 신짜장's quicker step. The scenes
// (lounge-village.tsx, lounge-area-3d.tsx) pass their resident spots through
// companionSpots before residentFrames, so the companion also greets and
// chats with residents they pass like anyone else, then companionBubbles
// puts the companion's own bubble on top.
//
// A small per-tab store (set from the life view by lounge-game.tsx); pure
// apart from it.
import type { NpcId } from './lounge-npc-data.ts';
import { NPCS } from './lounge-npc-data.ts';
import type { NpcArea, NpcSpot } from './lounge-npc-schedule.ts';
import type { ResidentFrame } from './lounge-npc-behavior.ts';
import { companionWalkMult } from './lounge-companion-effects.ts';
import { companionBubble } from './lounge-npc-companion-lines.ts';
import type { CompanionReact } from './lounge-npc-companion-line-types.ts';

export type CompanionSceneState = {
  /** uid → their companion (everyone's, from the life view). */
  all: Record<string, { actor: number; npc: NpcId; until: number }>;
  /** My uid (scenes call me 'self' or by my player id). */
  self: string | null;
  /** My name (the bubbles' {me}). */
  me: string;
  /** My companion's last event (its reaction bubble). */
  ev: { k: CompanionReact; at: number } | null;
};
let state: CompanionSceneState = { all: {}, self: null, me: '', ev: null };
export const setCompanionScene = (next: CompanionSceneState) => {
  state = next;
};
export const companionScene = () => state;
/** Residents walking with someone right now (drawn beside them, not at their spot). */
export const companionNpcs = (now: number) => new Set(Object.values(state.all).filter((c) => c.until > now).map((c) => c.npc));
/** My companion right now (null: none). */
export const myCompanion = (now: number): NpcId | null => {
  const c = state.self ? state.all[state.self] : undefined;
  return c && c.until > now ? c.npc : null;
};
/** Walking speed multiplier for me (신짜장 along: +10%). */
export const companionStep = () => companionWalkMult(myCompanion(Date.now()));

/** How far behind the friend the companion walks (world units). */
export const COMPANION_TRAIL = 1.2;
type Trail = { x: number; z: number; ox: number; oz: number; facing: number; at: number };
const trails = new Map<string, Trail>();
const uidOf = (id: string) => (id === 'self' ? state.self : id);

/**
 * The resident spots of a scene with the companions moved: anyone walking
 * with a friend is taken off their schedule spot and put a step behind that
 * friend if the friend is in this scene (`people`: the friends drawn here,
 * 'self' or by player id).
 */
export function companionSpots(spots: readonly NpcSpot[], people: readonly { id: string; x: number; z: number }[], area: string, now: number): NpcSpot[] {
  const busy = companionNpcs(now);
  const out = spots.filter((s) => !busy.has(s.id));
  for (const p of people) {
    const uid = uidOf(p.id);
    const c = uid ? state.all[uid] : undefined;
    if (!c || c.until <= now) continue;
    const key = `${uid}:${c.npc}`;
    let t = trails.get(key);
    if (!t || now - t.at > 5_000) t = { x: p.x, z: p.z, ox: -COMPANION_TRAIL * 0.7, oz: COMPANION_TRAIL * 0.7, facing: 0, at: now };
    const dx = p.x - t.x,
      dz = p.z - t.z,
      moved = Math.hypot(dx, dz);
    // Walking: stay behind, on the line the friend came along.
    if (moved > 0.02) {
      t.ox = (-dx / moved) * COMPANION_TRAIL;
      t.oz = (-dz / moved) * COMPANION_TRAIL;
      t.facing = Math.atan2(dx, dz);
    }
    t.x = p.x;
    t.z = p.z;
    const walking = moved > 0.02 || now - t.at < 300;
    if (moved > 0.02) t.at = now;
    trails.set(key, t);
    out.push({
      id: c.npc,
      area: area as NpcArea,
      x: p.x + t.ox,
      z: p.z + t.oz,
      facing: t.facing,
      walking,
      visible: true,
      activity: 'walk',
      label: `${NPCS[c.npc].name} · 같이 다니는 중`,
      place: '',
    });
  }
  return out;
}

/** Puts the companions' own bubbles (reactions, a few idle lines an hour, a word to a passer-by) on their frames. */
export function companionBubbles(frames: ResidentFrame[], now: number): ResidentFrame[] {
  for (const [uid, c] of Object.entries(state.all)) {
    if (c.until <= now) continue;
    const f = frames.find((r) => r.id === c.npc);
    if (!f) continue;
    const near = frames.find((r) => r.id !== c.npc && Math.hypot(r.x - f.x, r.z - f.z) < 4);
    const text = companionBubble({ npc: c.npc, me: uid === state.self ? state.me : '', now, ev: uid === state.self ? state.ev : null, other: near ? NPCS[near.id].name : null });
    if (text) f.bubble = text;
  }
  return frames;
}

/** Minimap: the companions as small dots beside their friends (friend uid → resident). */
export const companionDots = (now: number) =>
  Object.entries(state.all)
    .filter(([, c]) => c.until > now)
    .map(([uid, c]) => ({ uid, actor: c.actor, npc: c.npc }));
