/**
 * On-screen (camera-projected) height of the walking figure's canvas. The
 * upright plane is VILLAGE_ACTOR_HEIGHT / cos(elevation) ≈ 1.46 world units
 * tall, and the drawn character ≈ 1.37 — about 0.95 of the 1.45 door every
 * resident home is scaled to (VILLAGE_DOOR_HEIGHT).
 */
export const VILLAGE_ACTOR_HEIGHT = 1.2;

/** Orthographic framing for the fixed village camera (34, 43, 52). */
export function villageCameraFrame(
  width: number,
  height: number,
  mapWidth: number,
  mapDepth: number,
) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const groundLength = Math.hypot(34, 52);
  const cameraLength = Math.hypot(groundLength, 43);
  const horizontal =
    ((52 / groundLength) * mapWidth + (34 / groundLength) * mapDepth) / 2;
  const vertical =
    (((34 / groundLength) * mapWidth + (52 / groundLength) * mapDepth) * 43) /
    cameraLength /
    2;
  const half = Math.max(vertical + 7, (horizontal + 5) / aspect);
  // Keep the 2D actor recognizable even on a tall phone, independently of map size.
  const actorPixels = width < 600 ? 66 : 74;
  const followZoom = Math.max(
    1.7,
    Math.min(
      16,
      (actorPixels * 2 * half) / Math.max(1, height) / VILLAGE_ACTOR_HEIGHT,
    ),
  );
  return { half, followZoom };
}
