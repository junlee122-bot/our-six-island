/** The salon is a walkable venue; the full wardrobe opens only at a mirror. */
export const SALON_MIRROR = { x: 43, y: 45 } as const;
export const SALON_STYLIST_NAME = '그웬';
export const SALON_STYLIST_SPOT = { x: 50, y: 56 } as const;
export const SALON_FRONT = { x: 43, y: 62 } as const;
export const SALON_REACH = 6;
export const SALON_OBSTACLES = [
  { id: 'stylist', ...SALON_STYLIST_SPOT, rx: 1.6, ry: 1.6 },
  { id: 'vanity-left', x: 43, y: 44.5, rx: 5.5, ry: 2.5 },
  { id: 'vanity-right', x: 61, y: 44.5, rx: 5.5, ry: 2.5 },
  { id: 'chair-left', x: 43, y: 53, rx: 2.4, ry: 2.5 },
  { id: 'chair-right', x: 61, y: 53, rx: 2.4, ry: 2.5 },
  { id: 'reception', x: 25, y: 57.5, rx: 5.3, ry: 2.5 },
  { id: 'waiting-sofa', x: 79, y: 76.5, rx: 3, ry: 7 },
  { id: 'wardrobe', x: 17, y: 43.5, rx: 3.5, ry: 2 },
  { id: 'shelf', x: 80, y: 43.5, rx: 3.8, ry: 2 },
] as const;
export function salonCanWalk(point: { x: number; y: number }, playerRadius = 2.2): boolean {
  return !SALON_OBSTACLES.some(o => Math.abs(point.x - o.x) < o.rx + playerRadius
    && Math.abs(point.y - o.y) < o.ry + playerRadius);
}
export function nearSalon(point: { x: number; y: number }, area: string): boolean {
  return area === 'salon' && Number.isFinite(point.x) && Number.isFinite(point.y)
    && point.y >= 59 && point.y <= 88 && point.x >= 15 && point.x <= 85
    && Math.hypot(point.x - SALON_FRONT.x, point.y - SALON_FRONT.y) <= SALON_REACH;
}
