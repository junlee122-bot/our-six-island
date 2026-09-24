import type { GameKind } from './lounge-room';

export type SceneArea = 'lounge' | 'casino';
export type ScenePoint = { x: number; y: number };
export type SceneTable = {
  game: GameKind;
  /** Ground contact in the background image, expressed in percent. */
  foot: ScenePoint;
  width: number;
  /** Ground contact within the transparent 3:2 table image. */
  imageAnchor: ScenePoint;
};

// Scene data is independent of the sprite renderer so a later 3D renderer can
// reuse game IDs and ground anchors without changing room state or movement.
export const SCENE_LAYOUT: Record<
  SceneArea,
  {
    floor: { left: number; right: number; back: number; front: number };
    tables: SceneTable[];
  }
> = {
  lounge: {
    floor: { left: 12, right: 88, back: 58, front: 90 },
    tables: [
      {
        game: 'seotda',
        foot: { x: 31, y: 72 },
        width: 30,
        imageAnchor: { x: 50, y: 91 },
      },
      {
        game: 'gostop',
        foot: { x: 70, y: 78 },
        width: 30,
        imageAnchor: { x: 50, y: 91 },
      },
    ],
  },
  casino: {
    floor: { left: 12, right: 88, back: 57, front: 90 },
    tables: [
      {
        game: 'chess',
        foot: { x: 24, y: 66 },
        width: 25,
        imageAnchor: { x: 50, y: 91 },
      },
      {
        game: 'poker',
        foot: { x: 50, y: 81 },
        width: 28,
        imageAnchor: { x: 50, y: 91 },
      },
      {
        game: 'blackjack',
        foot: { x: 78, y: 68 },
        width: 25,
        imageAnchor: { x: 50, y: 91 },
      },
    ],
  },
};

const clamp = (n: number, low: number, high: number) =>
  Math.max(low, Math.min(high, n));

/** Existing server bounds stay unchanged; only their screen projection changes. */
export function projectPlayer(point: ScenePoint, area: SceneArea): ScenePoint {
  const f = SCENE_LAYOUT[area].floor;
  return {
    x: f.left + ((clamp(point.x, 15, 85) - 15) / 70) * (f.right - f.left),
    y: f.back + ((clamp(point.y, 42, 88) - 42) / 46) * (f.front - f.back),
  };
}

/** Inverse projection keeps pointer movement aligned with visible feet. */
export function unprojectFloor(point: ScenePoint, area: SceneArea): ScenePoint {
  const f = SCENE_LAYOUT[area].floor;
  return {
    x:
      15 +
      ((clamp(point.x, f.left, f.right) - f.left) / (f.right - f.left)) * 70,
    y:
      42 +
      ((clamp(point.y, f.back, f.front) - f.back) / (f.front - f.back)) * 46,
  };
}

export const sceneDepth = (footY: number) => Math.round(footY * 10);

/** Walking radius of a player's feet, in server units. */
export const SCENE_PLAYER_RADIUS = 2.2;
export type SceneCollider = { game: GameKind; x: number; y: number; rx: number; ry: number };

/**
 * Each table blocks an ellipse around its ground footprint, in server units,
 * derived from the same foot/width data the renderer uses.
 */
export function sceneColliders(area: SceneArea): SceneCollider[] {
  const f = SCENE_LAYOUT[area].floor;
  const perX = 70 / (f.right - f.left),
    perY = 46 / (f.front - f.back);
  return SCENE_LAYOUT[area].tables.map((table) => {
    const foot = unprojectFloor(table.foot, area);
    const rx = table.width * perX * 0.36,
      ry = table.width * 0.16 * perY;
    return { game: table.game, x: foot.x, y: foot.y - ry * 0.75, rx, ry };
  });
}

export function sceneCanWalk(point: ScenePoint, area: SceneArea): boolean {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
  if (point.x < 15 || point.x > 85 || point.y < 42 || point.y > 88) return false;
  return !sceneColliders(area).some(
    (c) =>
      ((point.x - c.x) / (c.rx + SCENE_PLAYER_RADIUS)) ** 2 +
        ((point.y - c.y) / (c.ry + SCENE_PLAYER_RADIUS)) ** 2 <
      1,
  );
}

/** Substepped movement that slides along table edges, like the village. */
export function sceneStep(
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
  // A player standing inside a table (e.g. an old seat position) may walk out.
  if (!sceneCanWalk(from, area)) return clampPoint({ x: from.x + dx, y: from.y + dy });
  const distance = Math.hypot(dx, dy);
  const count = Math.max(1, Math.ceil(distance / 0.4));
  let point = { ...from };
  for (let i = 0; i < count; i++) {
    const next = clampPoint({ x: point.x + dx / count, y: point.y + dy / count });
    if (sceneCanWalk(next, area)) point = next;
    else {
      const slideX = clampPoint({ x: next.x, y: point.y });
      if (sceneCanWalk(slideX, area)) point = slideX;
      const slideY = clampPoint({ x: point.x, y: next.y });
      if (sceneCanWalk(slideY, area)) point = slideY;
    }
  }
  return point;
}

/** The action button offers a table ("둘러보기") within this many units of its edge. */
export const SCENE_TABLE_REACH = 5;

/** Approximate distance (server units) from a point to a table's walk edge. */
export function sceneTableDistance(point: ScenePoint, c: SceneCollider) {
  const ax = c.rx + SCENE_PLAYER_RADIUS,
    ay = c.ry + SCENE_PLAYER_RADIUS;
  const norm = Math.hypot((point.x - c.x) / ax, (point.y - c.y) / ay);
  return Math.max(0, (norm - 1) * ((ax + ay) / 2));
}

/** The table closest to `point` within reach (the hall's action button). */
export function sceneNearestTable(
  point: ScenePoint,
  area: SceneArea,
  reach = SCENE_TABLE_REACH,
): { game: GameKind; distance: number } | null {
  let best: { game: GameKind; distance: number } | null = null;
  for (const c of sceneColliders(area)) {
    const distance = sceneTableDistance(point, c);
    if (distance <= reach && (!best || distance < best.distance))
      best = { game: c.game, distance };
  }
  return best;
}

/**
 * Where I stand next to a table (walking up to it, [가기], 일어나기): on open
 * floor at its front corner towards the room's middle, else in front or beside it.
 */
export function sceneTableSide(area: SceneArea, game: GameKind): ScenePoint {
  const c = sceneColliders(area).find((t) => t.game === game);
  if (!c) return { x: 50, y: 80 };
  const gap = SCENE_PLAYER_RADIUS + 1;
  // Front corner towards the room's middle first: the table's label (in its
  // centre) stays visible above my head.
  const toward = c.x < 50 ? 1 : -1;
  const tries: ScenePoint[] = [
    { x: c.x + toward * c.rx, y: c.y + c.ry * 0.8 + gap },
    { x: c.x, y: c.y + c.ry + gap },
    { x: c.x + c.rx + gap, y: c.y },
    { x: c.x - c.rx - gap, y: c.y },
    { x: c.x, y: c.y - c.ry - gap },
  ];
  for (const t of tries) {
    const p = { x: clamp(t.x, 15, 85), y: clamp(t.y, 42, 88) };
    if (sceneCanWalk(p, area)) return p;
  }
  return { x: 50, y: 88 };
}

/**
 * Where seat `index` of `count` sits at a table: along its back edge (left →
 * right, wider round the sides for more seats), so the table top is drawn in
 * front of the seated figure and its label stays readable.
 */
export function sceneSeatPoint(
  area: SceneArea,
  game: GameKind,
  index: number,
  count: number,
): ScenePoint {
  const c = sceneColliders(area).find((t) => t.game === game);
  if (!c) return { x: 50, y: 80 };
  const n = Math.max(1, Math.min(7, Math.round(count) || 1));
  const i = Math.max(0, Math.min(n - 1, Math.round(index) || 0));
  const span = Math.min(180, 45 * (n - 1));
  const angle = ((270 - span / 2 + (n > 1 ? (i * span) / (n - 1) : 0)) * Math.PI) / 180;
  const ax = c.rx + 1.2,
    ay = c.ry + 6;
  return {
    x: clamp(c.x + ax * Math.cos(angle), 15, 85),
    y: clamp(c.y + ay * Math.sin(angle), 42, 88),
  };
}
