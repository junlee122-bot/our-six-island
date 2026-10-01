/**
 * 구역 공통 규격 — how every outdoor map is looked at and walked (the hub,
 * 시장 거리, 항구, 언덕 …). Adopted from ① 시장 거리 on 2026-09-30 after players
 * found the hub's old three-quarter camera tiring to move in
 * (handover/design/art-direction-options.md "카메라 각도 검토"):
 *
 *   - a straight-on orthographic camera pitched VIEW_PITCH down, never turned
 *     sideways, so the arrow keys move along the screen's own axes;
 *   - VIEW_HALF world units from the screen centre to its top edge;
 *   - the camera eases after the walker (VIEW_FOLLOW_RATE, exponential);
 *   - figures look VILLAGE_FIGURE_HEIGHT tall on screen (upright planes
 *     stretched by 1 / cos(pitch), so they never lean into a wall).
 *
 * Pure numbers (no three.js): the server, tests and every renderer share them.
 */
export const VIEW_PITCH = (52 * Math.PI) / 180;
/** Camera distance from what it looks at (orthographic: only the direction matters). */
export const VIEW_DISTANCE = 50;
/** Ground → camera, unit vector (x 0: the camera never turns sideways). */
export const VIEW_DIR = { x: 0, y: Math.sin(VIEW_PITCH), z: Math.cos(VIEW_PITCH) } as const;
/** World units from the screen's centre to its top edge (wide screens). */
export const VIEW_HALF = 11;
/**
 * Rooms (내 방, 모델하우스) are seen closer than the districts: same angle,
 * follow and light, but 7 units above the centre so a 12-wide room fills
 * about half the screen (friends look ~1.6× their village size there).
 * Chosen by the user on 2026-10-02 after seeing the room at VIEW_HALF.
 */
export const ROOM_VIEW_HALF = 7;
/** Tall or square windows see a little more. */
export const viewHalf = (aspect: number, base = VIEW_HALF) => (aspect < 1.2 ? base * 1.25 : base);
/** Camera follow: the gap closes by 1 − e^(−rate·dt) each frame. */
export const VIEW_FOLLOW_RATE = 7;
export const followEase = (dt: number) => 1 - Math.exp(-dt * VIEW_FOLLOW_RATE);
/** A walking friend's body height (world units), on a camera-facing plane. */
export const VILLAGE_FIGURE_HEIGHT = 1.72;
/**
 * A friend's sprite canvas is this many times VILLAGE_FIGURE_HEIGHT tall (the
 * market's 640 px canvas for a 540 px figure line); the body is drawn at 94%
 * of the canvas with the feet on the 97% line (lounge-figure-frame.ts).
 */
export const FIGURE_CANVAS_RATIO = 640 / 540;
/** 루미·매화·허 선장·결 목수 (pose sheets) are drawn a little taller than friends. */
export const RESIDENT_SCALE = 1.12;
/** Walking speed (world units per second); Shift runs. */
export const VIEW_WALK_SPEED = 5.2;
/**
 * Light scale on top of the day palette (lounge-village-life.ts dayLighting):
 * a softer sun and a slightly fuller sky light than the old hub, the market's
 * look. Hemisphere × hemi/1.5, sun × sun/3, exposure × exposure.
 */
export const VIEW_LIGHT = { hemi: 1.6, sun: 2.2, exposure: 1.05 } as const;

/**
 * Kept for older callers: the figure's height seen on screen. With the
 * camera-facing plane that is the figure height itself.
 */
export const VILLAGE_ACTOR_HEIGHT = VILLAGE_FIGURE_HEIGHT;

/**
 * Orthographic framing: `half` fits the whole map (the overview, zoom 1) and
 * `followZoom` brings the view to VIEW_HALF around the walker.
 */
export function villageCameraFrame(width: number, height: number, mapWidth: number, mapDepth: number) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const horizontal = mapWidth / 2;
  // The map's depth seen from the pitch, plus room for roofs on the far edge.
  const vertical = (mapDepth * Math.sin(VIEW_PITCH) + 5 * Math.cos(VIEW_PITCH)) / 2;
  const half = Math.max(vertical + 3, (horizontal + 3) / aspect);
  const followZoom = Math.max(1, half / viewHalf(aspect));
  return { half, followZoom };
}
