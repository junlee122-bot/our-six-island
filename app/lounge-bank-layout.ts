/** Bank network floor. The scene, simple floor and server share these positions. */
export const BANKER_NAME = '냐모';
export const BANKER_SPOT = { x: 50, y: 46 } as const;
export const BANKER_FRONT = { x: 50, y: 62 } as const;
export const BANKER_REACH = 6;

/** Visible furniture footprint, before the player's radius is added. */
export const BANK_OBSTACLES = [
  { id: 'counter', x: 50, y: 54, rx: 10.1, ry: 2.5 },
  { id: 'bookcase', x: 23.5, y: 43.5, rx: 5.1, ry: 2.3 },
  { id: 'sofa', x: 82, y: 71, rx: 2.9, ry: 7 },
  { id: 'tea-table', x: 71.5, y: 71, rx: 3.2, ry: 3.2 },
  { id: 'plant-stand', x: 22.5, y: 65, rx: 4.2, ry: 1.7 },
  { id: 'banker', ...BANKER_SPOT, rx: 1.6, ry: 1.6 },
] as const;

export function bankCanWalk(point: { x: number; y: number }, playerRadius = 2.2): boolean {
  return !BANK_OBSTACLES.some(o => Math.abs(point.x - o.x) < o.rx + playerRadius
    && Math.abs(point.y - o.y) < o.ry + playerRadius);
}

/** Talk across the desk from the public side, never through the rear wall. */
export function nearBanker(point: { x: number; y: number }, area: string): boolean {
  return area === 'bank' && Number.isFinite(point.x) && Number.isFinite(point.y)
    && point.y >= 59 && point.y <= 88 && point.x >= 15 && point.x <= 85
    && Math.hypot(point.x - BANKER_FRONT.x, point.y - BANKER_FRONT.y) <= BANKER_REACH;
}
