/**
 * One substep of collide-and-slide for any walkability test: go straight when
 * clear, else take the least-turned direction (up to 80°) that is clear,
 * shortened by the cosine of the turn — the tangential part of the move. A
 * walker pressing into a wall at an angle slides along it, and one walking
 * straight into a round table or a host steers around instead of stopping.
 * Returns null when every direction is blocked.
 */
const TURNS = [15, 30, 45, 60, 75].map((deg) => (deg * Math.PI) / 180);

export function slideSubstep(
  x: number,
  y: number,
  sx: number,
  sy: number,
  ok: (x: number, y: number) => boolean,
): [number, number] | null {
  if (ok(x + sx, y + sy)) return [x + sx, y + sy];
  for (const turn of TURNS) {
    const c = Math.cos(turn),
      s = Math.sin(turn);
    for (const side of [1, -1]) {
      const rx = (sx * c - sy * s * side) * c,
        ry = (sx * s * side + sy * c) * c;
      if (ok(x + rx, y + ry)) return [x + rx, y + ry];
    }
  }
  if (ok(x + sx, y)) return [x + sx, y];
  if (ok(x, y + sy)) return [x, y + sy];
  return null;
}
