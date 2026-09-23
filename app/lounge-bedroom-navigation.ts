/** The walk room has its own world coordinates; saved 2D decorations are untouched. */
export type WalkPoint = { x: number; z: number };
export type WalkObstacle = {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
};
export const WALK_ROOM = { width: 8, depth: 6.6, radius: 0.22 } as const;
export const WALK_START: WalkPoint = { x: 0.65, z: 2.15 };
export const WALK_FURNITURE: readonly WalkObstacle[] = [
  { id: 'sofa', x: -1.8, z: -2.25, width: 2.75, depth: 1.15 },
  { id: 'bed', x: 2.55, z: -1.72, width: 1.85, depth: 2.65 },
  { id: 'table', x: -1.35, z: -0.68, width: 1.5, depth: 0.75 },
  { id: 'desk', x: -2.95, z: 0.63, width: 1.3, depth: 0.85 },
  { id: 'shelf', x: -3.68, z: -1.48, width: 0.4, depth: 1.6 },
  { id: 'plant', x: 3.45, z: 2.55, width: 0.52, depth: 0.52 },
] as const;

export function canWalk(point: WalkPoint): boolean {
  const { width, depth, radius } = WALK_ROOM;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) return false;
  if (
    Math.abs(point.x) > width / 2 - radius ||
    Math.abs(point.z) > depth / 2 - radius
  )
    return false;
  return !WALK_FURNITURE.some(
    (item) =>
      Math.abs(point.x - item.x) < item.width / 2 + radius &&
      Math.abs(point.z - item.z) < item.depth / 2 + radius,
  );
}

export function walkLineClear(from: WalkPoint, to: WalkPoint): boolean {
  if (!canWalk(from) || !canWalk(to)) return false;
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 0.06),
  );
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (
      !canWalk({
        x: from.x + (to.x - from.x) * t,
        z: from.z + (to.z - from.z) * t,
      })
    )
      return false;
  }
  return true;
}

/** Substeps prevent tunnelling, and axis sliding makes furniture edges forgiving. */
export function walkStep(from: WalkPoint, dx: number, dz: number): WalkPoint {
  if (!canWalk(from) || !Number.isFinite(dx) || !Number.isFinite(dz))
    return from;
  const distance = Math.hypot(dx, dz);
  // User input is frame bounded; keep this pure helper bounded for other callers.
  if (distance > 20) return from;
  const count = Math.max(1, Math.ceil(distance / 0.07));
  let result = { ...from };
  for (let i = 0; i < count; i++) {
    const next = { x: result.x + dx / count, z: result.z + dz / count };
    if (canWalk(next)) result = next;
    else {
      const slideX = { x: next.x, z: result.z };
      if (canWalk(slideX)) result = slideX;
      const slideZ = { x: result.x, z: next.z };
      if (canWalk(slideZ)) result = slideZ;
    }
  }
  return result;
}

const GRID = 0.2;
const COLS = 39;
const ROWS = 32;
const gridPoint = (id: number): WalkPoint => ({
  x: -3.8 + (id % COLS) * GRID,
  z: -3.1 + Math.floor(id / COLS) * GRID,
});
const distanceSquared = (a: WalkPoint, b: WalkPoint) =>
  (a.x - b.x) ** 2 + (a.z - b.z) ** 2;

/** Finds a reachable place near even blocked clicks, then smooths a collision-safe route. */
export function findWalkPath(
  from: WalkPoint,
  requested: WalkPoint,
): WalkPoint[] {
  if (
    !canWalk(from) ||
    !Number.isFinite(requested.x) ||
    !Number.isFinite(requested.z)
  )
    return [];
  const target = {
    x: Math.max(-3.77, Math.min(3.77, requested.x)),
    z: Math.max(-3.07, Math.min(3.07, requested.z)),
  };
  if (walkLineClear(from, target))
    return distanceSquared(from, target) < 0.0001 ? [] : [target];
  const points = Array.from({ length: COLS * ROWS }, (_, id) => gridPoint(id));
  const valid = points.map(canWalk);
  let start = -1;
  let nearest = Infinity;
  for (let id = 0; id < points.length; id++) {
    const d = distanceSquared(from, points[id]);
    if (valid[id] && d < nearest && walkLineClear(from, points[id])) {
      nearest = d;
      start = id;
    }
  }
  if (start < 0) return [];
  const previous = new Int32Array(points.length).fill(-2);
  previous[start] = -1;
  const queue = [start];
  let best = start;
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index],
      col = id % COLS,
      row = Math.floor(id / COLS);
    if (
      distanceSquared(points[id], target) <
      distanceSquared(points[best], target)
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
      if (
        c < 0 ||
        c >= COLS ||
        r < 0 ||
        r >= ROWS ||
        !valid[next] ||
        previous[next] !== -2
      )
        continue;
      if (!walkLineClear(points[id], points[next])) continue;
      previous[next] = id;
      queue.push(next);
    }
  }
  const route: WalkPoint[] = [];
  for (let id = best; id >= 0; id = previous[id]) route.unshift(points[id]);
  if (walkLineClear(points[best], target)) route.push(target);
  const result: WalkPoint[] = [];
  let anchor = from;
  for (let i = 0; i < route.length;) {
    let next = i;
    for (let j = route.length - 1; j > i; j--)
      if (walkLineClear(anchor, route[j])) {
        next = j;
        break;
      }
    if (distanceSquared(anchor, route[next]) > 0.0001) result.push(route[next]);
    anchor = route[next];
    i = next + 1;
  }
  return result;
}
