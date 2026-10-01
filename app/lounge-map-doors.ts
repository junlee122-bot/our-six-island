// Shared rules for every map-to-map doorway (hub gates, district exits, the
// 뒷산 / 숲 / 광산 trail, shop doors, interior doors): pure geometry, so each
// scene and the tests agree on the numbers.
// - Arriving puts you a step inside the doorway you came through, past its
//   trigger (reach + ARRIVE_CLEARANCE), so the "go back" prompt is not in your
//   face and a second press of E cannot bounce you straight back.
// - Right after arriving, doorways ignore you for DOOR_COOLDOWN_MS.
// - Besides E / Enter / the action button, walking on into a doorway (keys or
//   a click past it) takes it: `walksInto`.
import type { WalkPoint } from './lounge-walk-world.ts';

/** Doorways do nothing this long after you arrive on a map. */
export const DOOR_COOLDOWN_MS = 700;
/** How far past a doorway's trigger you arrive. */
export const ARRIVE_CLEARANCE = 0.9;
/** A locked gate repeats its "why" at most this often while you push on it. */
export const LOCKED_NOTICE_MS = 2500;

export type Doorway = {
  /** The doorway itself (gate post, map edge, door). */
  x: number;
  z: number;
  /** Where you stand to use it (E). */
  stand: WalkPoint;
  reach: number;
};

/** Unit vector from the doorway into the map (doorway → stand). */
export function inward(d: Doorway): WalkPoint {
  const x = d.stand.x - d.x,
    z = d.stand.z - d.z,
    len = Math.hypot(x, z) || 1;
  return { x: x / len, z: z / len };
}
/** Where you arrive through `d`: in from its stand, just past its trigger. */
export function arrivalPoint(d: Doorway, clearance = ARRIVE_CLEARANCE): WalkPoint {
  const n = inward(d),
    by = d.reach + clearance;
  return { x: round(d.stand.x + n.x * by), z: round(d.stand.z + n.z * by) };
}
const round = (v: number) => Math.round(v * 100) / 100;
/** The sprite facing (−1 left, 1 right) for walking in through `d`. */
export const arrivalFacing = (d: Doorway): 1 | -1 => (inward(d).x < -0.05 ? -1 : 1);

/**
 * Walking into a doorway: within its reach (or past the stand toward it) and
 * moving outward (`move`: this frame's intended step, keys or a route).
 */
export function walksInto(p: WalkPoint, move: WalkPoint, d: Doorway): boolean {
  const len = Math.hypot(move.x, move.z);
  if (len < 1e-6) return false;
  const n = inward(d);
  // Outward is −n; the step must point mostly that way.
  if ((-move.x * n.x - move.z * n.z) / len < 0.6) return false;
  const rx = p.x - d.stand.x,
    rz = p.z - d.stand.z;
  const past = -(rx * n.x + rz * n.z); // how far beyond the stand toward the doorway
  const side = Math.abs(rx * n.z - rz * n.x);
  return past >= -0.25 && side <= d.reach && Math.hypot(rx, rz) <= d.reach + 1.2;
}

/** A small clock for a scene: doorways wake up DOOR_COOLDOWN_MS after `arrive()`. */
export function doorClock(now: () => number = () => performance.now()) {
  let at = now();
  return {
    arrive() {
      at = now();
    },
    ready() {
      return now() - at >= DOOR_COOLDOWN_MS;
    },
  };
}
