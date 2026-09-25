/** Walking in the room: obstacles come from the saved v3 room itself. */
import {
  ROOM,
  ROOM_DOOR_POINT,
  blocksFloor,
  itemFootprint,
  type Bedroom,
} from './lounge-bedroom-data.ts';
import { pickAction, type ActionCandidate, type ActionKind } from './lounge-flow.ts';
import { slideSubstep } from './lounge-walk-slide.ts';

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

/** Substeps prevent tunnelling, and sliding (lounge-walk-slide) makes furniture edges and corners forgiving. */
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
  const ok = (x: number, z: number) => canWalk({ x, z }, obstacles);
  for (let i = 0; i < count; i++) {
    const next = slideSubstep(result.x, result.z, dx / count, dz / count, ok);
    if (!next) break;
    result = { x: next[0], z: next[1] };
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

/* ------------------------------------------------------------ flow helpers */

/** The action button offers "나가기" this close to the door. */
export const ROOM_DOOR_REACH = 1.1;
/** "옷 갈아입기" this close to the wardrobe or the mirror. */
export const ROOM_DRESS_REACH = 0.9;
const DRESS_REFS = new Set(['wardrobe', 'mirror', 'furn-wardrobe-white']);
/** Tables and the hearth double as the kitchen counter / workbench (요리·만들기). */
export const ROOM_COOK_REACH = 0.9;
export const COOK_REFS = new Set(['desk', 'tea-table', 'coffee-table', 'furn-table', 'furn-fireplace']);
/** Furniture with its own action in my room (the pointer cursor shows over it). */
export const roomItemUsable = (ref: string) => DRESS_REFS.has(ref) || COOK_REFS.has(ref);

/**
 * Where I appear when the day starts in my room: on the floor beside the bed
 * (the side facing the room's middle), else just inside the door.
 */
export function besideBed(
  room: Pick<Bedroom, 'items'>,
  obstacles: readonly WalkObstacle[] = roomObstacles(room),
): WalkPoint {
  const bed = room.items.find((item) => item.ref === 'bed');
  const box = bed ? itemFootprint(bed) : null;
  if (box) {
    const cx = (box.x0 + box.x1) / 2,
      cz = (box.z0 + box.z1) / 2;
    const gap = WALK_ROOM.radius + 0.12;
    const sides: WalkPoint[] = [
      { x: box.x1 + gap, z: cz },
      { x: cx, z: box.z1 + gap },
      { x: box.x0 - gap, z: cz },
      { x: cx, z: box.z0 - gap },
    ].sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
    for (const side of sides) if (canWalk(side, obstacles)) return side;
    const near = nearestWalkable({ x: cx, z: box.z1 + gap }, obstacles);
    if (near) return near;
  }
  return nearestWalkable(WALK_START, obstacles) ?? { ...WALK_START };
}

/** Walkable floor beside the first kitchen table / hearth (요리·만들기), or null. */
export function besideCookTable(
  room: Pick<Bedroom, 'items'>,
  obstacles: readonly WalkObstacle[] = roomObstacles(room),
): WalkPoint | null {
  for (const item of room.items) {
    if (!COOK_REFS.has(item.ref)) continue;
    const box = itemFootprint(item);
    if (!box) continue;
    const cx = (box.x0 + box.x1) / 2,
      cz = (box.z0 + box.z1) / 2;
    const gap = WALK_ROOM.radius + 0.15;
    for (const side of [
      { x: cx, z: box.z1 + gap },
      { x: box.x1 + gap, z: cz },
      { x: box.x0 - gap, z: cz },
      { x: cx, z: box.z0 - gap },
    ])
      if (canWalk(side, obstacles)) return side;
  }
  return null;
}

/** Pressing out through the door (walking into the left wall at the doorway). */
export function leavingThroughDoor(point: WalkPoint, dx: number) {
  return (
    dx < 0 &&
    point.x <= ROOM.minX + WALK_ROOM.radius + 0.08 &&
    point.z > ROOM.door.z0 + 0.12 &&
    point.z < ROOM.door.z1 - 0.12
  );
}

const rectDistance = (p: WalkPoint, box: { x0: number; x1: number; z0: number; z1: number }) =>
  Math.hypot(
    Math.max(0, box.x0 - p.x, p.x - box.x1),
    Math.max(0, box.z0 - p.z, p.z - box.z1),
  );

/**
 * The room's action button: 나가기 at the door, 옷 갈아입기 at the wardrobe or
 * mirror (my room), otherwise 꾸미기 in my own room (nothing in a friend's).
 */
export function roomAction(
  point: WalkPoint,
  room: Pick<Bedroom, 'items'>,
  {
    own,
    canExit = true,
    canDress = own,
    canCook = false,
  }: { own: boolean; canExit?: boolean; canDress?: boolean; canCook?: boolean },
): { kind: ActionKind; item?: string } | null {
  const candidates: ActionCandidate<string>[] = [];
  if (canExit)
    candidates.push({
      kind: 'exit' as const,
      distance: Math.hypot(point.x - ROOM_DOOR_POINT.x, point.z - ROOM_DOOR_POINT.z),
      reach: ROOM_DOOR_REACH,
      door: true,
    });
  if (own && canDress)
    for (const item of room.items) {
      if (!DRESS_REFS.has(item.ref)) continue;
      const box = itemFootprint(item);
      if (!box) continue;
      candidates.push({
        kind: 'dress' as const,
        distance: rectDistance(point, box),
        reach: ROOM_DRESS_REACH,
        target: item.id,
      });
    }
  if (own && canCook)
    for (const item of room.items) {
      if (!COOK_REFS.has(item.ref)) continue;
      const box = itemFootprint(item);
      if (!box) continue;
      candidates.push({
        kind: 'cook' as const,
        distance: rectDistance(point, box),
        reach: ROOM_COOK_REACH,
        target: item.id,
      });
    }
  if (own) candidates.push({ kind: 'decorate' as const, distance: 0, reach: 1, fallback: true });
  const best = pickAction<string>(candidates);
  return best ? { kind: best.kind, item: best.target } : null;
}
