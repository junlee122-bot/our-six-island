/** Shared frame time and route budget for local walking. Collision remains
 * the caller's real map/room stepper; this never teleports or sends requests. */
export const MAX_WALK_FRAME_SECONDS = 0.5;
export function walkFrameSeconds(now: number, previous: number): number {
  return Number.isFinite(now) && Number.isFinite(previous) && previous > 0 && now >= previous
    ? Math.min((now - previous) / 1000, MAX_WALK_FRAME_SECONDS) : 0;
}
export type RoutePoint = { x: number; z: number };
/** Map steppers round to millimetres; raw floor clicks need not. Skip a
 * sub-millimetre remainder without ever snapping across a collision. */
const ARRIVAL_EPSILON = 0.002;
export function advanceWalkRoute(
  from: RoutePoint,
  route: readonly RoutePoint[],
  budget: number,
  step: (from: RoutePoint, dx: number, dz: number) => RoutePoint,
): { point: RoutePoint; route: RoutePoint[] } {
  let point = from, at = 0;
  let left = Number.isFinite(budget) ? Math.max(0, Math.min(20, budget)) : 0;
  while (at < route.length && left > 1e-8 && at < 256) {
    const target = route[at], dx = target.x - point.x, dz = target.z - point.z;
    const distance = Math.hypot(dx, dz);
    if (!Number.isFinite(distance)) return { point, route: [] };
    if (distance <= ARRIVAL_EPSILON) { at++; continue; }
    const amount = Math.min(left, distance);
    const next = step(point, dx / distance * amount, dz / distance * amount);
    left -= amount;
    if (Math.hypot(next.x - point.x, next.z - point.z) < Math.min(1e-4, amount * 0.5))
      return { point, route: [] };
    point = next;
    if (Math.hypot(target.x - point.x, target.z - point.z) <= ARRIVAL_EPSILON) at++;
  }
  return { point, route: route.slice(at) };
}
