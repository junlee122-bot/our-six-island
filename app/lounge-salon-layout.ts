/** The salon is a walkable venue; the full wardrobe opens only at a mirror. */
export const SALON_MIRROR = { x: 43, y: 45 } as const;
export const SALON_STYLIST_NAME = '그웬';
export const SALON_STYLIST_SPOT = { x: 50, y: 56 } as const;
export const SALON_FRONT = { x: 43, y: 62 } as const;
export const SALON_REACH = 6;
/** World-space floor props, shared by the drawing and network-space collision map. */
export const SALON_FLOOR_PROPS = {
  waitingSofa: { x: -3.9, z: 4.05, w: 2.7, d: 1.1 },
  readingTable: { x: -3.9, z: 2.65, w: 1.3, d: 1.05 },
  // Leave a usable aisle behind and between both shampoo stations.
  washLeft: { x: 4.3, z: .65, w: 1.1, d: 2.5 },
  washRight: { x: 6.7, z: .65, w: 1.1, d: 2.5 },
  coatStand: { x: -7.15, z: 1.25, w: .65, d: .65 },
  waitingLamp: { x: -1.85, z: 4.25, w: .6, d: .6 },
  waitingPlant: { x: -6.45, z: 4.5, w: .75, d: .6 },
  workTrolley: { x: .45, z: -4.25, w: .65, d: .72 },
} as const;
const floorObstacle = (id: string, p: { x: number; z: number; w: number; d: number }) => ({
  id, x: p.x * 5 + 50, y: p.z * 5 + 65, rx: p.w * 2.5, ry: p.d * 2.5,
});
export const SALON_OBSTACLES = [
  { id: 'stylist', ...SALON_STYLIST_SPOT, rx: 1.6, ry: 1.6 },
  { id: 'vanity-left', x: 43, y: 44.5, rx: 5.5, ry: 2.5 },
  { id: 'vanity-right', x: 61, y: 44.5, rx: 5.5, ry: 2.5 },
  { id: 'chair-left', x: 43, y: 53, rx: 2.4, ry: 2.5 },
  { id: 'chair-right', x: 61, y: 53, rx: 2.4, ry: 2.5 },
  { id: 'reception', x: 25, y: 57.5, rx: 5.3, ry: 2.5 },
  { id: 'wardrobe', x: 17, y: 43.5, rx: 3.5, ry: 2 },
  { id: 'shelf', x: 80, y: 43.5, rx: 4.3, ry: 2.3 },
  ...Object.entries(SALON_FLOOR_PROPS).map(([id, p]) => floorObstacle(id, p)),
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
