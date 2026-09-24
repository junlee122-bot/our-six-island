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
  const actorPixels = width < 600 ? 66 : 76;
  const followZoom = Math.max(
    1.7,
    Math.min(12, (actorPixels * 2 * half) / Math.max(1, height) / 1.88),
  );
  return { half, followZoom };
}
