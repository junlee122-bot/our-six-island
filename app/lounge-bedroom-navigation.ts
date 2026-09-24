/** Walking in the room: obstacles come from the saved v3 room itself. */
import {
  ROOM,
  ROOM_DOOR_POINT,
  blocksFloor,
  itemFootprint,
  type Bedroom,
} from './lounge-bedroom-data.ts';

export type WalkPoint = { x: number; z: number };
export type WalkObstacle = {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
};
export const WALK_ROOM = {
  width: ROOM.maxX - ROOM.minX,
  depth: ROOM.maxZ - ROOM.minZ,
  radius: 0.22,
} as const;
/** Everyone walks in through the door. */
export const WALK_START: WalkPoint = { ...ROOM_DOOR_POINT };

/** Floor footprints that block walking (rugs, wall art and items on surfaces do not). */
export function roomObstacles(room: Pick<Bedroom, 'items'>): WalkObstacle[] {
  const out: WalkObstacle[] = [];
  for (const item of room.items) {
    if (!blocksFloor(item)) continue;
    const box = itemFootprint(item);
    if (!box) continue;
    out.push({
      id: item.id,
      x: (box.x0 + box.x1) / 2,
      z: (box.z0 + box.z1) / 2,
      width: box.x1 - box.x0,
      depth: box.z1 - box.z0,
    });
  }
  return out;
}

/** Obstacles of the room that is open right now (the walk loop uses these). */
let current: readonly WalkObstacle[] = [];
export function setWalkObstacles(obstacles: readonly WalkObstacle[]) {
  current = obstacles;
}

export function canWalk(
  point: WalkPoint,
  obstacles: readonly WalkObstacle[] = current,
  radius: number = WALK_ROOM.radius,
): boolean {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) return false;
  if (
    point.x < ROOM.minX + radius ||
    point.x > ROOM.maxX - radius ||
    point.z < ROOM.minZ + radius ||
    point.z > ROOM.maxZ - radius
  )
    return false;
  return !obstacles.some(
    (item) =>
      Math.abs(point.x - item.x) < item.width / 2 + radius &&
      Math.abs(point.z - item.z) < item.depth / 2 + radius,
  );
}

export function walkLineClear(
  from: WalkPoint,
  to: WalkPoint,
  obstacles: readonly WalkObstacle[] = current,
  radius: number = WALK_ROOM.radius,
): boolean {
  if (!canWalk(from, obstacles, radius) || !canWalk(to, obstacles, radius))
    return false;
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 0.06),
  );
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (
      !canWalk(
        { x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t },
        obstacles,
        radius,
      )
    )
      return false;
  }
  return true;
}

/** Substeps prevent tunnelling, and axis sliding makes furniture edges forgiving. */
export function walkStep(
  from: WalkPoint,
  dx: number,
  dz: number,
  obstacles: readonly WalkObstacle[] = current,
): WalkPoint {
  if (!canWalk(from, obstacles) || !Number.isFinite(dx) || !Number.isFinite(dz))
    return from;
  const distance = Math.hypot(dx, dz);
  // User input is frame bounded; keep this pure helper bounded for other callers.
  if (distance > 20) return from;
  const count = Math.max(1, Math.ceil(distance / 0.07));
  let result = { ...from };
  for (let i = 0; i < count; i++) {
    const next = { x: result.x + dx / count, z: result.z + dz / count };
    if (canWalk(next, obstacles)) result = next;
    else {
      const slideX = { x: next.x, z: result.z };
      if (canWalk(slideX, obstacles)) result = slideX;
      const slideZ = { x: result.x, z: next.z };
      if (canWalk(slideZ, obstacles)) result = slideZ;
    }
  }
  return result;
}

const GRID = 0.2;
const COLS = Math.round((ROOM.maxX - ROOM.minX) / GRID) - 1;
const ROWS = Math.round((ROOM.maxZ - ROOM.minZ) / GRID) - 1;
const gridPoint = (id: number): WalkPoint => ({
  x: ROOM.minX + GRID + (id % COLS) * GRID,
  z: ROOM.minZ + GRID + Math.floor(id / COLS) * GRID,
});
const distanceSquared = (a: WalkPoint, b: WalkPoint) =>
  (a.x - b.x) ** 2 + (a.z - b.z) ** 2;

/** The walkable point nearest to `point` (itself when it is walkable). */
export function nearestWalkable(
  point: WalkPoint,
  obstacles: readonly WalkObstacle[] = current,
  radius: number = WALK_ROOM.radius,
): WalkPoint | null {
  if (canWalk(point, obstacles, radius)) return point;
  let best: WalkPoint | null = null,
    bestD = Infinity;
  for (let id = 0; id < COLS * ROWS; id++) {
    const p = gridPoint(id),
      d = distanceSquared(p, point);
    if (d < bestD && canWalk(p, obstacles, radius)) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

/**
 * Finds a reachable place near even blocked clicks, then smooths a
 * collision-safe route. `exact` returns [] when the target itself cannot be
 * reached (used by tests); otherwise the closest reachable point is used.
 */
export function findWalkPath(
  from: WalkPoint,
  requested: WalkPoint,
  obstacles: readonly WalkObstacle[] = current,
  options: { radius?: number; exact?: boolean } = {},
): WalkPoint[] {
  const radius = options.radius ?? WALK_ROOM.radius;
  if (
    !canWalk(from, obstacles, radius) ||
    !Number.isFinite(requested.x) ||
    !Number.isFinite(requested.z)
  )
    return [];
  const target = {
    x: Math.max(ROOM.minX + radius, Math.min(ROOM.maxX - radius, requested.x)),
    z: Math.max(ROOM.minZ + radius, Math.min(ROOM.maxZ - radius, requested.z)),
  };
  const clear = (a: WalkPoint, b: WalkPoint) =>
    walkLineClear(a, b, obstacles, radius);
  if (clear(from, target))
    return distanceSquared(from, target) < 0.0001 ? [] : [target];
  const total = COLS * ROWS;
  const valid = new Uint8Array(total);
  for (let id = 0; id < total; id++)
    valid[id] = canWalk(gridPoint(id), obstacles, radius) ? 1 : 0;
  let start = -1;
  let nearest = Infinity;
  for (let id = 0; id < total; id++) {
    if (!valid[id]) continue;
    const p = gridPoint(id),
      d = distanceSquared(from, p);
    if (d < nearest && d < 0.5 && clear(from, p)) {
      nearest = d;
      start = id;
    }
  }
  if (start < 0) return [];
  const previous = new Int32Array(total).fill(-2);
  previous[start] = -1;
  const queue = [start];
  let best = start;
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index],
      col = id % COLS,
      row = Math.floor(id / COLS);
    if (
      distanceSquared(gridPoint(id), target) <
      distanceSquared(gridPoint(best), target)
    )
      best = id;
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const c = col + dc,
        r = row + dr,
        next = r * COLS + c;
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS || !valid[next] || previous[next] !== -2)
        continue;
      // Diagonal moves must not cut a corner.
      if (dc && dr && (!valid[row * COLS + c] || !valid[r * COLS + col])) continue;
      previous[next] = id;
      queue.push(next);
    }
  }
  const route: WalkPoint[] = [];
  for (let id = best; id >= 0; id = previous[id]) route.unshift(gridPoint(id));
  const reached = clear(gridPoint(best), target);
  if (reached) route.push(target);
  else if (options.exact) return [];
  const result: WalkPoint[] = [];
  let anchor = from;
  for (let i = 0; i < route.length; ) {
    let next = i;
    for (let j = route.length - 1; j > i; j--)
      if (clear(anchor, route[j])) {
        next = j;
        break;
      }
    if (distanceSquared(anchor, route[next]) > 0.0001) result.push(route[next]);
    anchor = route[next];
    i = next + 1;
  }
  return result;
}
