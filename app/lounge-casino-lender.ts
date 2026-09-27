/** Rosé's independent casino desk. All positions use the shared network floor. */
export const LENDER_NAME = '로제';
export const CASINO_LENDER_SPOT = { x: 50, y: 45 } as const;
export const CASINO_LENDER_FRONT = { x: 50, y: 51 } as const;
export const CASINO_LENDER_REACH = 7.5;
export const CASINO_LENDER_RADIUS = 1.6;

/** The server and both renderers use the same place and distance check. */
export function nearCasinoLender(point: { x: number; y: number }, area: string): boolean {
  return area === 'casino' && Number.isFinite(point.x) && Number.isFinite(point.y)
    && point.x >= 15 && point.x <= 85 && point.y >= 42 && point.y <= 88
    && Math.hypot(point.x - CASINO_LENDER_SPOT.x, point.y - CASINO_LENDER_SPOT.y) <= CASINO_LENDER_REACH;
}
