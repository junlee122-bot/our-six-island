/**
 * 구역 공통 규격 for the public interiors (회관, 카지노, 허풍 주점, 은행,
 * 미용실): the same straight-on camera, walking and figures as ① 시장 거리 and
 * every outdoor map (lounge-village-camera.ts), adopted for the rooms on
 * 2026-10-02 (handover/design/design-rooms-v2.md "모든 실내 공간도 같은 규격으로").
 *
 * A room is modelled in its own units (lounge-interior-layout.ts, 0.2 per
 * network unit, a 16.8 × 11.2 floor). Drawn at the outdoor scale it would fill
 * only half the screen, so one room unit is INTERIOR_VIEW_SCALE outdoor units:
 * the camera shows VIEW_HALF / INTERIOR_VIEW_SCALE room units above the
 * centre and figures are VILLAGE_FIGURE_HEIGHT / INTERIOR_VIEW_SCALE tall. On
 * screen that is exactly the outdoor look: a friend is as many pixels tall as
 * in the market, walks as many screens per second, and the camera eases after
 * them the same way. (An orthographic camera cannot tell a larger room from a
 * closer one.)
 *
 * Pure numbers (no three.js): the tests and the renderer share them.
 */
import {
  FIGURE_CANVAS_RATIO,
  RESIDENT_SCALE,
  VIEW_HALF,
  VIEW_PITCH,
  VIEW_WALK_SPEED,
  VILLAGE_FIGURE_HEIGHT,
  viewHalf,
} from './lounge-village-camera.ts';
import { INTERIOR_ROOM, INTERIOR_SCALE } from './lounge-interior-layout.ts';

/** Outdoor units per room unit (the furniture reads a little larger than houses outside, as in a farm-game interior). */
export const INTERIOR_VIEW_SCALE = 1.5;
/** Room units from the screen's centre to its top edge (VIEW_HALF outdoors). */
export const interiorViewHalf = (aspect: number) => viewHalf(aspect, VIEW_HALF) / INTERIOR_VIEW_SCALE;
/** A friend's body height in room units. */
export const INTERIOR_FIGURE_HEIGHT = VILLAGE_FIGURE_HEIGHT / INTERIOR_VIEW_SCALE;
/** A friend's sprite canvas (the camera-facing card) in room units. */
export const INTERIOR_FIGURE_CARD = INTERIOR_FIGURE_HEIGHT * FIGURE_CANVAS_RATIO;
/**
 * The upright plane that looks exactly like that card from the pitched
 * camera (stretched by 1 / cos(pitch), so it never leans into a wall).
 */
export const INTERIOR_FIGURE_UPRIGHT = INTERIOR_FIGURE_CARD / Math.cos(VIEW_PITCH);
/** Pose-sheet hosts (미쿠, 예림이, 샹크스): their calm figure, a little taller than friends. */
export const INTERIOR_HOST_HEIGHT = INTERIOR_FIGURE_HEIGHT * RESIDENT_SCALE;
/** Screen-up of a point `h` above the ground, per room unit of height on an upright plane. */
export const INTERIOR_UP_Y = Math.cos(VIEW_PITCH);
/** Walking speed in network units per second (outdoors VIEW_WALK_SPEED units per second). */
export const INTERIOR_WALK_SPEED = VIEW_WALK_SPEED / INTERIOR_VIEW_SCALE / INTERIOR_SCALE;

/**
 * The room's extent on screen (room units, screen-right and screen-up
 * relative to the floor's origin): floor front edge to the back wall's top,
 * wall to wall.
 */
export function interiorScreenBox() {
  const up = (y: number, z: number) => y * Math.cos(VIEW_PITCH) - z * Math.sin(VIEW_PITCH);
  return {
    left: INTERIOR_ROOM.minX - 0.3,
    right: INTERIOR_ROOM.maxX + 0.3,
    bottom: up(0, INTERIOR_ROOM.maxZ + 0.3),
    top: up(INTERIOR_ROOM.wallHeight, INTERIOR_ROOM.minZ - 0.2),
  };
}

/**
 * Where the camera centre goes (screen-right x, screen-up u in room units)
 * for a walker at world (x, z): it follows them, but never shows more than a
 * skirt past the room; a room smaller than the view is centred, a little
 * below the middle so the header (`topShare` of the height) covers no wall.
 */
export function interiorCameraAim(
  p: { x: number; z: number },
  half: number,
  aspect: number,
  topShare = 0,
): { x: number; u: number } {
  const box = interiorScreenBox();
  const halfW = half * aspect;
  // The header takes the top `topShare` of the view: the room fits under it.
  const usableTop = half - 2 * half * topShare;
  const pu = -p.z * Math.sin(VIEW_PITCH);
  const axis = (value: number, lo: number, hi: number, below: number, above: number) => {
    // Camera centre c shows [c - below, c + above].
    const min = lo + below,
      max = hi - above;
    return min > max ? (lo + hi) / 2 + (below - above) / 2 : Math.max(min, Math.min(max, value));
  };
  return {
    x: axis(p.x, box.left, box.right, halfW, halfW),
    u: axis(pu, box.bottom, box.top, half, usableTop),
  };
}
