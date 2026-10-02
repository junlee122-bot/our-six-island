/**
 * Walking in the room: obstacles come from the saved room itself plus the
 * built-in kitchen counter and closet. The room's shape (its 집 확장 tier, or
 * a model house) is the active one (setActiveRoomShape in lounge-bedroom-data).
 */
import {
  ROOM_DOOR_POINT,
  activeRoomShape,
  blocksFloor,
  itemFootprint,
  roomDoorPoint,
  type Bedroom,
  type RoomShape,
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
export const WALK_ROOM = { radius: 0.22 } as const;
/** Everyone walks in through the door (the smallest room's; see walkStart). */
export const WALK_START: WalkPoint = { ...ROOM_DOOR_POINT };
/** Just inside the door of a room. */
export const walkStart = (shape: RoomShape = activeRoomShape()): WalkPoint => roomDoorPoint(shape);

/**
 * Floor footprints that block walking (rugs, wall art and items on surfaces
 * do not), and the room's built-in kitchen counter and closet.
 */
export function roomObstacles(room: Pick<Bedroom, 'items'>, shape: RoomShape = activeRoomShape()): WalkObstacle[] {
  const out: WalkObstacle[] = shape.fixtures.map((f) => ({
    id: 'fixture-' + f.id,
    x: (f.x0 + f.x1) / 2,
    z: (f.z0 + f.z1) / 2,
    width: f.x1 - f.x0,
    depth: f.z1 - f.z0,
  }));
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
  return [...out, ...slotFillers(out, shape)];
}

/**
 * Gaps a walker cannot pass (between two pieces of furniture, or furniture
 * and a wall) are closed, so walking along furniture never wedges into one.
 */
const SLOT = WALK_ROOM.radius * 2 + 0.1;
function slotFillers(items: readonly WalkObstacle[], ROOM: RoomShape): WalkObstacle[] {
  const fills: WalkObstacle[] = [];
  const box = (o: WalkObstacle) => ({
    x0: o.x - o.width / 2,
    x1: o.x + o.width / 2,
    z0: o.z - o.depth / 2,
    z1: o.z + o.depth / 2,
  });
  const add = (id: string, x0: number, x1: number, z0: number, z1: number) => {
    if (x1 - x0 > 1e-3 && z1 - z0 > 1e-3)
      fills.push({ id, x: (x0 + x1) / 2, z: (z0 + z1) / 2, width: x1 - x0, depth: z1 - z0 });
  };
  const walls = { x0: ROOM.minX, x1: ROOM.maxX, z0: ROOM.minZ, z1: ROOM.maxZ };
  items.forEach((item, i) => {
    const a = box(item);
    // Against the walls (the door stays open: nothing stands in its span).
    if (a.x0 - walls.x0 > 0 && a.x0 - walls.x0 < SLOT) add(`slot-${item.id}-w`, walls.x0, a.x0, a.z0, a.z1);
    if (walls.x1 - a.x1 > 0 && walls.x1 - a.x1 < SLOT) add(`slot-${item.id}-e`, a.x1, walls.x1, a.z0, a.z1);
    if (a.z0 - walls.z0 > 0 && a.z0 - walls.z0 < SLOT) add(`slot-${item.id}-n`, a.x0, a.x1, walls.z0, a.z0);
    if (walls.z1 - a.z1 > 0 && walls.z1 - a.z1 < SLOT && (a.x1 < ROOM.door.x0 || a.x0 > ROOM.door.x1))
      add(`slot-${item.id}-s`, a.x0, a.x1, a.z1, walls.z1);
    for (const other of items.slice(i + 1)) {
      const b = box(other);
      const zOverlap = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0),
        xOverlap = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const gapX = Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1),
        gapZ = Math.max(a.z0, b.z0) - Math.min(a.z1, b.z1);
      if (zOverlap > 0 && gapX > 0 && gapX < SLOT)
        add(`slot-${item.id}-${other.id}`, Math.min(a.x1, b.x1), Math.max(a.x0, b.x0), Math.max(a.z0, b.z0), Math.min(a.z1, b.z1));
      else if (xOverlap > 0 && gapZ > 0 && gapZ < SLOT)
        add(`slot-${item.id}-${other.id}`, Math.max(a.x0, b.x0), Math.min(a.x1, b.x1), Math.min(a.z1, b.z1), Math.max(a.z0, b.z0));
      else if (gapX > 0 && gapZ > 0 && Math.hypot(gapX, gapZ) < SLOT)
        // Corner to corner: bridge the diagonal pinch.
        add(`slot-${item.id}-${other.id}`, Math.min(a.x1, b.x1) - 0.05, Math.max(a.x0, b.x0) + 0.05, Math.min(a.z1, b.z1) - 0.05, Math.max(a.z0, b.z0) + 0.05);
    }
  });
  return fills;
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
  const ROOM = activeRoomShape();
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
/** The walk grid of the active room. */
function grid() {
  const ROOM = activeRoomShape();
  const COLS = Math.round((ROOM.maxX - ROOM.minX) / GRID) - 1,
    ROWS = Math.round((ROOM.maxZ - ROOM.minZ) / GRID) - 1;
  const point = (id: number): WalkPoint => ({
    x: ROOM.minX + GRID + (id % COLS) * GRID,
    z: ROOM.minZ + GRID + Math.floor(id / COLS) * GRID,
  });
  return { ROOM, COLS, ROWS, point };
}
const distanceSquared = (a: WalkPoint, b: WalkPoint) =>
  (a.x - b.x) ** 2 + (a.z - b.z) ** 2;

/** The walkable point nearest to `point` (itself when it is walkable). */
export function nearestWalkable(
  point: WalkPoint,
  obstacles: readonly WalkObstacle[] = current,
  radius: number = WALK_ROOM.radius,
): WalkPoint | null {
  if (canWalk(point, obstacles, radius)) return point;
  const { COLS, ROWS, point: gridPoint } = grid();
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
  const { ROOM, COLS, ROWS, point: gridPoint } = grid();
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
/** A built-in fixture's box (walk-distance checks). */
const fixtureRect = (f: { x0: number; x1: number; z0: number; z1: number }) => ({ x0: f.x0, x1: f.x1, z0: f.z0, z1: f.z1 });
/** "옷 갈아입기" this close to the wardrobe or the mirror. */
export const ROOM_DRESS_REACH = 0.9;
const DRESS_REFS = new Set(['wardrobe', 'mirror', 'furn-wardrobe-white', 'furn-gold-mirror', 'furn-najeon-wardrobe']);
/** Tables and the hearth double as the kitchen counter / workbench (요리·만들기). */
export const ROOM_COOK_REACH = 0.9;
export const COOK_REFS = new Set(['desk', 'tea-table', 'coffee-table', 'furn-table', 'furn-fireplace', 'furn-round-dining-set', 'furn-marble-fireplace']);
/** Furniture with its own action in my room (the pointer cursor shows over it; the built-ins always count). */
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
  const start = walkStart();
  return nearestWalkable(start, obstacles) ?? start;
}

/** Walkable floor in front of the kitchen counter (or a table / hearth) for 요리·만들기, or null. */
export function besideCookTable(
  room: Pick<Bedroom, 'items'>,
  obstacles: readonly WalkObstacle[] = roomObstacles(room),
): WalkPoint | null {
  for (const f of activeRoomShape().fixtures) {
    if (f.action !== 'cook') continue;
    const front = { x: (f.x0 + f.x1) / 2, z: f.z1 + WALK_ROOM.radius + 0.15 };
    if (canWalk(front, obstacles)) return front;
  }
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

/** Pressing out through the door (walking down into the front wall at the doorway). */
export function leavingThroughDoor(point: WalkPoint, dz: number) {
  const ROOM = activeRoomShape();
  return (
    dz > 0 &&
    point.z >= ROOM.maxZ - WALK_ROOM.radius - 0.08 &&
    point.x > ROOM.door.x0 + 0.05 &&
    point.x < ROOM.door.x1 - 0.05
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
  const shape = activeRoomShape(),
    door = roomDoorPoint(shape);
  if (canExit)
    candidates.push({
      kind: 'exit' as const,
      distance: Math.hypot(point.x - door.x, point.z - door.z),
      reach: ROOM_DOOR_REACH,
      door: true,
    });
  for (const f of shape.fixtures) {
    if (!own || (f.action === 'dress' ? !canDress : !canCook)) continue;
    candidates.push({
      kind: f.action,
      distance: rectDistance(point, fixtureRect(f)),
      reach: f.action === 'dress' ? ROOM_DRESS_REACH : ROOM_COOK_REACH,
      target: 'fixture-' + f.id,
    });
  }
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
