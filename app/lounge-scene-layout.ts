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
