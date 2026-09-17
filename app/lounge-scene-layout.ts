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
