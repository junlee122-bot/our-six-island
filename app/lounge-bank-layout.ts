/** Bank network floor. The scene, simple floor and server share these positions. */
export const BANKER_NAME = '냐모';
export const BANKER_SPOT = { x: 50, y: 46 } as const;
export const BANKER_FRONT = { x: 50, y: 62 } as const;
export const BANKER_REACH = 6;

/** Each credited GLB is loaded once and shared by all of its placements. */
export const BANK_MODEL_KEYS = [
  'counter', 'bookcase', 'sofa', 'teaTable', 'plants', 'bell', 'calendar',
  'desk', 'chair', 'lamp', 'sideboard', 'pencil', 'ticketRail',
] as const;
export type BankModel = (typeof BANK_MODEL_KEYS)[number];
export const BANK_MODEL_COUNT = BANK_MODEL_KEYS.length;
export type BankPlacement = {
  x: number; z: number; width: number; height: number; depth: number;
  turn?: number; y?: number;
};
export type BankFloorItem = BankPlacement & { id: string; model: BankModel | null };

/** World-space furniture envelopes shared by the 3D scene and both floors.
 * Models fit without stretching. The left entrance and centre aisle stay open.
 */
export const BANK_FLOOR_ITEMS: readonly BankFloorItem[] = [
  { id: 'counter-left', model: 'counter', x: -1.005, z: -2.2, width: 2.01, height: 1, depth: .88 },
  { id: 'counter-right', model: 'counter', x: 1.005, z: -2.2, width: 2.01, height: 1, depth: .88 },
  { id: 'archive-left', model: 'bookcase', x: -6.3, z: -4.95, width: 2.07, height: 2.25, depth: .91 },
  { id: 'archive-right', model: 'bookcase', x: -3.85, z: -4.95, width: 2.07, height: 2.25, depth: .91 },
  { id: 'writing-desk', model: 'desk', x: -4.6, z: -.75, width: 2.4, height: 1.022, depth: 1.508 },
  { id: 'writing-chair-left', model: 'chair', x: -5.28, z: .8, width: .632, height: 1.08, depth: .709, turn: Math.PI },
  { id: 'writing-chair-right', model: 'chair', x: -3.92, z: .8, width: .632, height: 1.08, depth: .709, turn: Math.PI },
  { id: 'adviser-chair', model: 'chair', x: -4.6, z: -2.22, width: .632, height: 1.08, depth: .709 },
  { id: 'sofa-side', model: 'sofa', x: 6.35, z: .7, width: 2.8, height: 1.4, depth: 1.25, turn: -Math.PI / 2 },
  { id: 'sofa-front', model: 'sofa', x: 5.4, z: 3.55, width: 2.8, height: 1.4, depth: 1.25, turn: Math.PI },
  { id: 'tea-table', model: 'teaTable', x: 4.55, z: 1, width: 1.08, height: .701, depth: 1.078 },
  { id: 'reading-lamp', model: 'lamp', x: 7.18, z: 2.65, width: .72, height: 1.633, depth: .72 },
  { id: 'tea-sideboard', model: 'sideboard', x: 6.7, z: -1.9, width: 1.54, height: 1, depth: .998, turn: -Math.PI / 2 },
  { id: 'plant-writing', model: 'plants', x: -6.9, z: -.9, width: 1.35, height: 1.65, depth: .533 },
  { id: 'plant-vault', model: 'plants', x: 7.15, z: -4.8, width: 1.023, height: 1.25, depth: .405 },
  { id: 'vault', model: null, x: 4.25, z: -4.75, width: 3.15, height: 2.1, depth: .95 },
  { id: 'ticket-stand', model: null, x: -2.7, z: 2.15, width: .56, height: 1.15, depth: .48 },
];

/** Rotated footprints before player radius: network = world / .2 + {50,65}.
 * The 4cm edge allowance includes the continuous counter cap and chair legs.
 */
export const BANK_OBSTACLES = [
  ...BANK_FLOOR_ITEMS.map(p => {
    const c = Math.abs(Math.cos(p.turn ?? 0)), s = Math.abs(Math.sin(p.turn ?? 0));
    return {
      id: p.id, x: p.x * 5 + 50, y: p.z * 5 + 65,
      rx: (p.width * c + p.depth * s) * 2.5 + .2,
      ry: (p.width * s + p.depth * c) * 2.5 + .2,
    };
  }),
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
