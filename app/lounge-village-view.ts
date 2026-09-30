// 구역 공통 규격, the three.js half (the numbers are in lounge-village-camera.ts):
// camera, follow, figure planes and light, shared by the hub
// (lounge-village.tsx) and every separate map (lounge-area-3d.tsx), all taken
// from ① 시장 거리 — the look players found easiest to move in (2026-09-30).
import * as THREE from 'three';
import {
  FIGURE_CANVAS_RATIO,
  VIEW_DIR,
  VIEW_DISTANCE,
  VIEW_LIGHT,
  VIEW_PITCH,
  VILLAGE_FIGURE_HEIGHT,
  RESIDENT_SCALE,
  followEase,
  viewHalf,
  villageCameraFrame,
} from './lounge-village-camera';
import { VILLAGE_BOUNDS } from './lounge-village-layout';
import { dayLighting } from './lounge-village-life';

/** Camera offset from what it looks at. */
export const VILLAGE_CAMERA_OFFSET = new THREE.Vector3(VIEW_DIR.x, VIEW_DIR.y, VIEW_DIR.z).multiplyScalar(VIEW_DISTANCE);
/** Screen-up direction in the world (labels above heads go this way). */
export const VILLAGE_CAMERA_UP = new THREE.Vector3(0, Math.cos(VIEW_PITCH), -Math.sin(VIEW_PITCH));
/** Sprite canvas (px); the body fills it (figures wear no hats, so no band above). */
export const VILLAGE_FIGURE_BODY = { width: 256, height: 320 } as const;
/**
 * Figure planes stand upright facing the camera (it never turns sideways),
 * stretched by 1 / cos(pitch) so they look exactly like camera-facing cards
 * of VILLAGE_FIGURE_HEIGHT without leaning back into a wall behind them.
 * The canvas is the market's (FIGURE_CANVAS_RATIO), so friends are the same
 * size on screen in the hub and in every district.
 */
export const VILLAGE_FIGURE_PLANE = VILLAGE_FIGURE_HEIGHT * FIGURE_CANVAS_RATIO;
/** Vertical world height of a figure's plane (and of a head, for labels). */
export const VILLAGE_FIGURE_UPRIGHT = VILLAGE_FIGURE_PLANE / Math.cos(VIEW_PITCH);
/** Pose-sheet residents' plane height (ResidentLayer, billboard 'upright'). */
export const VILLAGE_RESIDENT_HEIGHT = (VILLAGE_FIGURE_HEIGHT * RESIDENT_SCALE) / Math.cos(VIEW_PITCH);
/** Chibi residents stand exactly as tall as friends (ResidentLayer `chibi`). */
export const VILLAGE_CHIBI = { plane: VILLAGE_FIGURE_UPRIGHT, upY: Math.cos(VIEW_PITCH) } as const;
/** Grass top is ~0.026; props and figures rest on it. */
export const VILLAGE_GROUND_Y = 0.03;

let figureGeometry: THREE.PlaneGeometry | null = null;
/** The shared plane of a walking figure (soles at its origin). */
export function villageFigureGeometry() {
  if (!figureGeometry) {
    figureGeometry = new THREE.PlaneGeometry(VILLAGE_FIGURE_PLANE * (VILLAGE_FIGURE_BODY.width / VILLAGE_FIGURE_BODY.height), VILLAGE_FIGURE_UPRIGHT);
    // loungeSprites.draw places the soles at 97% of the canvas height.
    figureGeometry.translate(0, VILLAGE_FIGURE_UPRIGHT * 0.47, 0);
  }
  return figureGeometry;
}
/** A point `height` above the ground at (x, z), as the screen sees it (for labels and bubbles). */
export const aboveHead = (x: number, z: number, height: number, out = new THREE.Vector3()) =>
  out.set(x, 0, z).addScaledVector(VILLAGE_CAMERA_UP, height);

/** The hub's framing at this canvas size (the overview fits the island; follow is VIEW_HALF). */
export const villageFollowFrame = (width: number, height: number) =>
  villageCameraFrame(width, height, VILLAGE_BOUNDS.width, VILLAGE_BOUNDS.depth);
/** A separate map's view half-height (its region may ask for a little more). */
export { viewHalf, followEase };

/**
 * Keeps the camera's ground footprint on the map (plus a small skirt) and the
 * walker inside the central 75% of the view. The camera looks straight along
 * −z, so screen-right is +x and screen-up is −z on the ground.
 */
export function clampFollowTarget(
  target: THREE.Vector3,
  player: { x: number; z: number },
  halfWidth: number,
  halfHeight: number,
  bounds: { width: number; depth: number } = VILLAGE_BOUNDS,
) {
  const depth = halfHeight / Math.sin(VIEW_PITCH);
  const margin = 3;
  const limitX = Math.max(0, bounds.width / 2 + margin - halfWidth),
    limitZ = Math.max(0, bounds.depth / 2 + margin - depth);
  let x = THREE.MathUtils.clamp(target.x, -limitX, limitX),
    z = THREE.MathUtils.clamp(target.z, -limitZ, limitZ);
  x = THREE.MathUtils.clamp(x, player.x - halfWidth * 0.75, player.x + halfWidth * 0.75);
  z = THREE.MathUtils.clamp(z, player.z - depth * 0.75, player.z + depth * 0.75);
  target.x = x;
  target.z = z;
}

// ---------------------------------------------------------------- light rig
export type VillageLights = { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight };
/** The palette for `now` (or noon when the day/night cycle is off, 설정 → 낮밤 변화). */
export const VILLAGE_NOON = dayLighting(Date.UTC(2026, 0, 1, 3));
export const villageLightAt = (now: number, dayNight: boolean | undefined) => (dayNight === false ? VILLAGE_NOON : dayLighting(now));
/** Grey days are a little dimmer (rain, storms, clouds, snow). */
export const weatherDim = (sky: string | undefined) =>
  sky === 'storm' ? 0.72 : sky === 'rain' ? 0.82 : sky === 'cloudy' ? 0.9 : sky === 'snow' ? 0.94 : 1;
/**
 * Applies a palette with the shared light scale (VIEW_LIGHT, or a map's own)
 * and the weather dim. The sun keeps the palette's elevation; `sunAt` places
 * it (the hub keeps an island-wide shadow, a small map lets it follow).
 */
export function applyVillageLight(
  lights: VillageLights,
  renderer: THREE.WebGLRenderer,
  light: ReturnType<typeof dayLighting>,
  sky: string | undefined,
  scale: { hemi: number; sun: number; exposure: number } = VIEW_LIGHT,
) {
  const { hemi, sun } = lights;
  const dim = weatherDim(sky);
  hemi.color.set(light.hemiSky);
  hemi.groundColor.set(light.hemiGround);
  hemi.intensity = light.hemiIntensity * (scale.hemi / 1.5) * dim;
  sun.color.set(light.sun);
  sun.intensity = light.sunIntensity * (scale.sun / 3) * dim * dim;
  renderer.toneMappingExposure = light.exposure * scale.exposure;
  return light;
}
/** The sky behind a transparent canvas. */
export const villageSkyBackground = (sky: string) => `linear-gradient(180deg, ${sky}, ${sky}ee)`;
const NIGHT_TINT = new THREE.Color('#c9d0ff');
/**
 * Sprites are unlit (toneMapped: false); at night they take a cool tint so
 * the characters do not glow against the dark village.
 */
export const villageFigureTint = (lamps: number) => new THREE.Color('#ffffff').lerp(NIGHT_TINT, Math.min(1, lamps) * 0.85);
