// The walkable 3D hall (회관) and casino (카지노): pure geometry shared by the
// scene, its cursor and the tests. Positions stay in the server's network
// units (x 15–85, y 42–88) and reuse the flat scene's table colliders, seats
// and "beside the table" spots (lounge-scene-layout.ts), so a friend on the
// simple-graphics screen and one in 3D see each other at the same tables.
// The 3D world is that floor scaled onto the ground plane (x → x, y → z).
import {
  SCENE_PLAYER_RADIUS,
  sceneCanWalk,
  sceneColliders,
  sceneNearestTable,
  sceneSeatPoint,
  sceneTableSide,
  type SceneArea,
  type SceneCollider,
  type ScenePoint,
} from './lounge-scene-layout.ts';
import type { GameKind } from './lounge-games.ts';

export type InteriorWorld = { x: number; z: number };

/** World units per network unit (the floor is 70 × 46 units → 14 × 9.2). */
export const INTERIOR_SCALE = 0.2;
const CENTER = { x: 50, y: 65 };

export const interiorToWorld = (p: ScenePoint): InteriorWorld => ({
  x: (p.x - CENTER.x) * INTERIOR_SCALE,
  z: (p.y - CENTER.y) * INTERIOR_SCALE,
});
export const worldToInterior = (p: InteriorWorld): ScenePoint => ({
  x: p.x / INTERIOR_SCALE + CENTER.x,
  y: p.z / INTERIOR_SCALE + CENTER.y,
});

/** The room box in world units: back wall, two side walls, open front. */
export const INTERIOR_ROOM = {
  minX: -8.4,
  maxX: 8.4,
  minZ: -6,
  maxZ: 5.2,
  wallHeight: 3.6,
} as const;

/**
 * Window event (detail: a network point) the game sends when it puts me
 * somewhere in the hall / casino (a seat, beside a table after a game).
 */
export const INTERIOR_PLACE_EVENT = 'bumtadew:interior-place';

/** Just inside the door on the left wall, where I appear after walking in. */
export const INTERIOR_DOOR: ScenePoint = { x: 17, y: 82 };
/** The door opening on the left wall (world z range). */
export const INTERIOR_DOOR_Z = { z0: 2.55, z1: 4.25 } as const;
/** "나가기" is offered this close (network units) to the door spot. */
export const INTERIOR_DOOR_REACH = 5.5;

/** The table hosts: 루미 deals in the casino, 매화 runs the hwatu tables. */
export const TABLE_HOST: Record<GameKind, 'lumi' | 'maehwa' | null> = {
  blackjack: 'lumi',
  poker: 'lumi',
  seotda: 'maehwa',
  gostop: 'maehwa',
  chess: null,
};

/** Radius (network units) a standing host blocks. */
export const HOST_RADIUS = 1.6;

const clamp = (n: number, low: number, high: number) =>
  Math.max(low, Math.min(high, n));
const inFloor = (p: ScenePoint) =>
  p.x >= 15 && p.x <= 85 && p.y >= 42 && p.y <= 88;

/**
 * Where the host stands: at one end of the table (the wall end first, else
 * the room's middle end), clear of every seat (up to 7), of the spot where a
 * player walks up to the table and of the other tables.
 */
export function hostSpot(area: SceneArea, game: GameKind): ScenePoint | null {
  if (!TABLE_HOST[game]) return null;
  const c = sceneColliders(area).find((t) => t.game === game);
  if (!c) return null;
  const toward = c.x < 50 ? 1 : -1;
  const side = sceneTableSide(area, game);
  const reach = c.rx + 4.4;
  const keepClear: ScenePoint[] = [side];
  for (let n = 2; n <= 7; n++)
    for (let i = 0; i < n; i++) keepClear.push(sceneSeatPoint(area, game, i, n));
  for (const dir of [-toward, toward]) {
    const p = { x: c.x + dir * reach, y: c.y };
    if (!inFloor(p) || !sceneCanWalk(p, area)) continue;
    if (keepClear.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < HOST_RADIUS + 1.2)) continue;
    return p;
  }
  return null;
}

/** Standing hosts block walking like small round obstacles. */
export function interiorObstacles(area: SceneArea): { game: GameKind; x: number; y: number; r: number }[] {
  const out: { game: GameKind; x: number; y: number; r: number }[] = [];
  for (const c of sceneColliders(area)) {
    const p = hostSpot(area, c.game);
    if (p) out.push({ game: c.game, x: p.x, y: p.y, r: HOST_RADIUS });
  }
  return out;
}

const obstacleCache = new Map<SceneArea, ReturnType<typeof interiorObstacles>>();
const obstaclesOf = (area: SceneArea) => {
  let list = obstacleCache.get(area);
  if (!list) {
    list = interiorObstacles(area);
    obstacleCache.set(area, list);
  }
  return list;
};

export function interiorCanWalk(p: ScenePoint, area: SceneArea): boolean {
  if (!sceneCanWalk(p, area)) return false;
  return !obstaclesOf(area).some(
    (o) => Math.hypot(p.x - o.x, p.y - o.y) < o.r + SCENE_PLAYER_RADIUS * 0.7,
  );
}

/** Substepped walking that slides along tables and hosts (like sceneStep). */
export function interiorStep(
  from: ScenePoint,
  dx: number,
  dy: number,
  area: SceneArea,
): ScenePoint {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return from;
  const clampPoint = (p: ScenePoint) => ({
    x: clamp(p.x, 15, 85),
    y: clamp(p.y, 42, 88),
  });
  // Standing somewhere blocked (an old seat spot): walking out is allowed.
  if (!interiorCanWalk(from, area)) return clampPoint({ x: from.x + dx, y: from.y + dy });
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.4));
  let point = { ...from };
  for (let i = 0; i < count; i++) {
    const next = clampPoint({ x: point.x + dx / count, y: point.y + dy / count });
    if (interiorCanWalk(next, area)) point = next;
    else {
      const slideX = clampPoint({ x: next.x, y: point.y });
      if (interiorCanWalk(slideX, area)) point = slideX;
      const slideY = clampPoint({ x: point.x, y: next.y });
      if (interiorCanWalk(slideY, area)) point = slideY;
    }
  }
  return point;
}

export const nearDoor = (p: ScenePoint) =>
  Math.hypot(p.x - INTERIOR_DOOR.x, p.y - INTERIOR_DOOR.y) <= INTERIOR_DOOR_REACH;

/** What the one action button offers here: a table within reach, else the door. */
export type InteriorAction = { kind: 'table'; game: GameKind } | { kind: 'door' };
export function interiorAction(p: ScenePoint, area: SceneArea): InteriorAction | null {
  const table = sceneNearestTable(p, area);
  if (table) return { kind: 'table', game: table.game };
  return nearDoor(p) ? { kind: 'door' } : null;
}

/** What the mouse points at on the floor (for the cursor and for clicks). */
export function interiorHover(p: ScenePoint, area: SceneArea): InteriorAction | null {
  for (const c of sceneColliders(area))
    if (((p.x - c.x) / (c.rx + 1)) ** 2 + ((p.y - c.y) / (c.ry + 1)) ** 2 <= 1)
      return { kind: 'table', game: c.game };
  if (p.x < 15.5 && Math.abs(p.y - INTERIOR_DOOR.y) < 5) return { kind: 'door' };
  return null;
}

/** Seats shown at a table: its size once set up, else the game's usual count. */
export function seatCount(state: { phase: string; required: number; occupants: readonly string[] }, usual: number) {
  const n = state.phase === 'empty' ? usual : Math.max(state.required, state.occupants.length);
  return clamp(Math.round(n) || usual, 2, 7);
}

/** Every seat of a table in world units, with who sits there (or null). */
export function tableSeats(
  area: SceneArea,
  game: GameKind,
  count: number,
  occupants: readonly string[],
): { at: ScenePoint; world: InteriorWorld; who: string | null }[] {
  return Array.from({ length: count }, (_, i) => {
    const at = sceneSeatPoint(area, game, i, count);
    return { at, world: interiorToWorld(at), who: occupants[i] ?? null };
  });
}

/** One table's footprint in world units (the scene builds furniture on it). */
export type InteriorTable = {
  game: GameKind;
  center: InteriorWorld;
  /** Half extents of the table top. */
  rx: number;
  rz: number;
  host: 'lumi' | 'maehwa' | null;
  hostAt: InteriorWorld | null;
  collider: SceneCollider;
  /** Which way the room's middle is (the sign stands at the other end). */
  toward: 1 | -1;
};
export function interiorTables(area: SceneArea): InteriorTable[] {
  return sceneColliders(area).map((c) => {
    const host = hostSpot(area, c.game);
    return {
      game: c.game,
      center: interiorToWorld(c),
      // The walk ellipse includes a margin around the furniture.
      rx: c.rx * INTERIOR_SCALE * 0.82,
      rz: c.ry * INTERIOR_SCALE * 0.8,
      host: host ? TABLE_HOST[c.game] : null,
      hostAt: host ? interiorToWorld(host) : null,
      collider: c,
      toward: c.x < 50 ? 1 : -1,
    };
  });
}

/**
 * Is a point (world units, relative to the table's centre) over the table's
 * furniture? Matches what lounge-interior-scene.ts builds for each game.
 */
export function overTable(t: Pick<InteriorTable, 'game' | 'rx' | 'rz'>, x: number, z: number): boolean {
  const { rx, rz } = t;
  switch (t.game) {
    case 'poker':
      return (x / (rx + 0.07)) ** 2 + (z / (rz + 0.07)) ** 2 <= 1;
    case 'blackjack':
      // A half oval: the curve toward the back wall, the flat side forward.
      return z <= rz * 0.35 + 0.07 && (x / (rx + 0.07)) ** 2 + ((z - rz * 0.35) / (rz + 0.07)) ** 2 <= 1;
    case 'chess':
      return Math.abs(x) <= rx * 0.85 && Math.abs(z) <= rz * 0.95;
    default:
      return Math.abs(x) <= rx * 0.875 && Math.abs(z) <= rz * 0.9;
  }
}

/** Gap (world units) between the table's edge and a chair's centre. */
export const CHAIR_GAP = 0.36;
/** The blackjack curve is tight: its chairs sit a little further out so seven fit. */
const chairGap = (game: GameKind) => (game === 'blackjack' ? 0.52 : CHAIR_GAP);

/**
 * Where a seat's chair stands: on the line from the table's centre to the
 * seat spot, just off the table's edge (the seat spot itself is further out,
 * where a standing player waits), and which way it faces (y rotation).
 */
export function seatChair(
  t: Pick<InteriorTable, 'game' | 'rx' | 'rz' | 'center'>,
  seat: InteriorWorld,
): InteriorWorld & { face: number } {
  const dx = seat.x - t.center.x,
    dz = seat.z - t.center.z,
    d = Math.hypot(dx, dz) || 1;
  const ux = dx / d,
    uz = dz / d;
  let lo = 0,
    hi = 6;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (overTable(t, ux * mid, uz * mid)) lo = mid;
    else hi = mid;
  }
  const r = hi + chairGap(t.game);
  const x = t.center.x + ux * r,
    z = t.center.z + uz * r;
  return { x, z, face: Math.atan2(t.center.x - x, t.center.z - z) };
}

/**
 * Where the host is drawn: close to her table's end, or out at her spot
 * (hostAt, which is also what blocks walking) while the table's end chairs
 * are in use (five seats or more reach round to the ends).
 */
export function hostStand(
  t: Pick<InteriorTable, 'game' | 'rx' | 'rz' | 'center' | 'hostAt'>,
  seats: number,
): InteriorWorld | null {
  if (!t.hostAt) return null;
  if (seats >= 5) return t.hostAt;
  const dir = Math.sign(t.hostAt.x - t.center.x) || 1;
  let lo = 0,
    hi = 6;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (overTable(t, dir * mid, 0)) lo = mid;
    else hi = mid;
  }
  const x = t.center.x + dir * (hi + 0.42);
  // Never further out than her own spot.
  return { x: dir > 0 ? Math.min(x, t.hostAt.x) : Math.max(x, t.hostAt.x), z: t.hostAt.z };
}

/** A straight walk from a to b stays clear of tables and hosts. */
export function segmentWalkable(a: ScenePoint, b: ScenePoint, area: SceneArea): boolean {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.5));
  for (let i = 1; i <= n; i++)
    if (!interiorCanWalk({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n }, area))
      return false;
  return true;
}

const waypointCache = new Map<SceneArea, ScenePoint[]>();
/** Corner spots around every table and host (for walking around them). */
export function interiorWaypoints(area: SceneArea): ScenePoint[] {
  let list = waypointCache.get(area);
  if (list) return list;
  list = [];
  const push = (p: ScenePoint) => {
    const q = { x: clamp(p.x, 15, 85), y: clamp(p.y, 42, 88) };
    if (interiorCanWalk(q, area)) list!.push(q);
  };
  for (const c of sceneColliders(area))
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      push({
        x: c.x + (c.rx + SCENE_PLAYER_RADIUS + 1.4) * Math.cos(a),
        y: c.y + (c.ry + SCENE_PLAYER_RADIUS + 1.4) * Math.sin(a),
      });
    }
  for (const o of obstaclesOf(area))
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const r = o.r + SCENE_PLAYER_RADIUS + 1.2;
      push({ x: o.x + r * Math.cos(a), y: o.y + r * Math.sin(a) });
    }
  waypointCache.set(area, list);
  return list;
}

/**
 * The route to walk (a clicked spot, a table's side): straight when clear,
 * else the shortest way around the tables through their corner spots. The
 * last point is the destination; an unreachable one is walked at directly
 * (sliding along what is in the way).
 */
export function interiorPath(from: ScenePoint, to: ScenePoint, area: SceneArea): ScenePoint[] {
  if (!interiorCanWalk(from, area) || !interiorCanWalk(to, area) || segmentWalkable(from, to, area))
    return [to];
  const nodes = [from, ...interiorWaypoints(area), to];
  const n = nodes.length;
  const dist = Array.from({ length: n }, () => Infinity);
  const prev = Array.from({ length: n }, () => -1);
  const done = Array.from({ length: n }, () => false);
  dist[0] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || u === n - 1) break;
    done[u] = true;
    for (let v = 0; v < n; v++) {
      if (done[v] || v === u) continue;
      const d = Math.hypot(nodes[v].x - nodes[u].x, nodes[v].y - nodes[u].y);
      if (dist[u] + d >= dist[v] || !segmentWalkable(nodes[u], nodes[v], area)) continue;
      dist[v] = dist[u] + d;
      prev[v] = u;
    }
  }
  if (prev[n - 1] < 0) return [to];
  const path: ScenePoint[] = [];
  for (let v = n - 1; v > 0; v = prev[v]) path.unshift(nodes[v]);
  return path;
}
