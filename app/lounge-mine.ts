// 광산 (성장 P2): the floors under 뒷산's bear cave. Pure and deterministic:
// a floor's room (one of six templates, maybe mirrored) and its rocks follow
// the KST day and the floor number, so every friend sees the same floor; each
// friend breaks their own copy (lounge-growth.ts keeps what they broke today).
// Drops follow the design's floor bands (돌 / 구리 / 철 / 금 / 보석 + 화석),
// the pickaxe tier gates the deeper bands, and one floor a day carries a
// “오늘의 광맥” (the first three rocks drop triple ore). A leaf module.

/** A room is 18 × 14 world units: x −9…9, z −7…7 (the entrance ladder is south, +z). */
export const MINE_ROOM = { w: 18, d: 14 } as const;
export const MINE_FLOORS_P2 = 20;
/** Floors a band spans and the pickaxe tier it needs (lounge-growth-data TOOL tiers). */
export const MINE_BANDS = [
  { from: 1, to: 5, pick: 1, stone: 71, copper: 28, iron: 0, gold: 0, gem: 1, fossils: ['fossil-shell', 'fossil-leaf'] },
  { from: 6, to: 10, pick: 2, stone: 56.5, copper: 25, iron: 17, gold: 0, gem: 1.5, fossils: ['fossil-fish', 'fossil-fern'] },
  { from: 11, to: 15, pick: 3, stone: 52, copper: 5, iron: 30, gold: 10, gem: 3, fossils: ['fossil-trilobite'] },
  { from: 16, to: 20, pick: 4, stone: 48, copper: 0, iron: 20, gold: 28, gem: 4, fossils: ['fossil-tooth'] },
] as const;
export const bandOf = (floor: number) => MINE_BANDS.find((b) => floor >= b.from && floor <= b.to) ?? MINE_BANDS[0];
/** Pickaxe tier a floor needs. */
export const floorPick = (floor: number) => bandOf(floor).pick;
/** Floors 11+ need the 광산 승강기 research (V3); lifts stop every 5 floors. */
export const LIFT_EVERY = 5;
export const LIFT_FROM_FLOOR = 11;
export const FOSSIL_CHANCE = 2;
export const VEIN_ROCKS = 3;
export const VEIN_MULT = 3;
/**
 * Floors the lift cage offers: 1층 and a stop every LIFT_EVERY floors down to
 * the deepest one reached. With 승준's explorer pass (lounge-explorer-pass.ts)
 * it is every floor. `pick` is the pickaxe tier a floor needs when mine is
 * lower: the lift will not stop there; the pass goes anyway (the rocks stay hard).
 */
export function mineStops(m: { deep: number; pickaxe: number }, pass = false): { floor: number; pick: number | null }[] {
  const floors = pass
    ? Array.from({ length: MINE_FLOORS_P2 }, (_, i) => i + 1)
    : [1, ...Array.from({ length: Math.floor(Math.min(m.deep, MINE_FLOORS_P2) / LIFT_EVERY) }, (_, i) => (i + 1) * LIFT_EVERY)];
  return floors.map((floor) => ({ floor, pick: floorPick(floor) > m.pickaxe ? floorPick(floor) : null }));
}
/** Rocks broken on a floor today before its ladder down shows (4–6). */
export const ladderNeed = (day: number, floor: number) => 4 + (mh(`ladder-n:${day}:${floor}`) % 3);

function mh(text: string) {
  // FNV-1a like lounge-calendar hash32 (kept local: this module has no imports).
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type MineTemplate = {
  /** Solid pillars / rubble (walk colliders): centre x, z and radius. */
  pillars: readonly { x: number; z: number; r: number }[];
  /** Candidate rock spots (x, z); 10–14 are up on a given day. */
  cells: readonly { x: number; z: number }[];
  /** Candidate spots for the ladder down. */
  ladders: readonly { x: number; z: number }[];
};
const grid = (xs: number[], zs: number[]) => xs.flatMap((x) => zs.map((z) => ({ x, z })));
/** Six hand-shaped rooms: pillar clusters, a side pool of rubble, a winding lane. */
export const MINE_TEMPLATES: readonly MineTemplate[] = [
  {
    pillars: [{ x: -3, z: -1, r: 1.1 }, { x: 4, z: 1.5, r: 0.9 }],
    cells: grid([-7, -4.5, -1, 1.5, 6.5], [-5, -2.5, 2]).concat([{ x: 7, z: 4.2 }, { x: -6.5, z: 4 }, { x: 0.5, z: -0.2 }, { x: 3, z: -4.8 }, { x: -2, z: 4.2 }]),
    ladders: [{ x: -7.5, z: -5.8 }, { x: 7.5, z: -5.8 }, { x: 0, z: -6 }],
  },
  {
    pillars: [{ x: 0, z: -2, r: 1.4 }, { x: -5.5, z: 2, r: 0.8 }, { x: 5.5, z: 2, r: 0.8 }],
    cells: grid([-7.2, -3.6, 3.6, 7.2], [-5.2, -1.4, 1.6]).concat([{ x: 0, z: 1.8 }, { x: -2, z: -5.4 }, { x: 2, z: -5.4 }, { x: -1.6, z: 4.2 }, { x: 1.6, z: 4.2 }, { x: -7, z: 4.4 }, { x: 7, z: 4.4 }, { x: 0, z: -4.2 }]),
    ladders: [{ x: -7.6, z: -6 }, { x: 7.6, z: -6 }],
  },
  {
    pillars: [{ x: -4.5, z: -3, r: 1 }, { x: 4.5, z: -3, r: 1 }, { x: 0, z: 1.2, r: 1 }],
    cells: grid([-7.4, -2, 2, 7.4], [-5.6, -0.8, 3.2]).concat([{ x: -4.6, z: 0.8 }, { x: 4.6, z: 0.8 }, { x: 0, z: -2.6 }, { x: 0, z: -5.6 }, { x: -4.6, z: 4.6 }, { x: 4.6, z: 4.6 }, { x: -2.4, z: -3.6 }, { x: 2.4, z: -3.6 }]),
    ladders: [{ x: 0, z: -6.1 }, { x: -7.8, z: 0.8 }, { x: 7.8, z: 0.8 }],
  },
  {
    pillars: [{ x: -6, z: -4, r: 1.3 }, { x: 2.5, z: -1, r: 1.2 }],
    cells: grid([-3.5, -0.5, 5, 7.5], [-5.6, -3, 2.6]).concat([{ x: -7.2, z: 0.6 }, { x: -4.6, z: 1.2 }, { x: -1.2, z: 1.4 }, { x: 5.4, z: 0.4 }, { x: -6.8, z: 4.4 }, { x: 2.4, z: 4.4 }, { x: 7.4, z: 4.6 }, { x: -2.6, z: 4.6 }]),
    ladders: [{ x: 7.6, z: -6 }, { x: -1.5, z: -6.2 }],
  },
  {
    pillars: [{ x: -2.5, z: -3.5, r: 0.9 }, { x: 2.5, z: -3.5, r: 0.9 }, { x: -6, z: 1.5, r: 0.9 }, { x: 6, z: 1.5, r: 0.9 }],
    cells: grid([-7.4, -4.4, 0, 4.4, 7.4], [-5.8, -1, 3.8]).concat([{ x: -2.4, z: 1.2 }, { x: 2.4, z: 1.2 }, { x: 0, z: -3.4 }, { x: -3.2, z: 4.4 }, { x: 3.2, z: 4.4 }]),
    ladders: [{ x: 0, z: -6.2 }, { x: -7.6, z: -3.4 }, { x: 7.6, z: -3.4 }],
  },
  {
    pillars: [{ x: -1, z: -1.5, r: 1.6 }, { x: 5.8, z: -4.2, r: 0.9 }],
    cells: grid([-7.2, -4.2, 3, 7.2], [-5.4, -2, 1.6]).concat([{ x: 0, z: 2.4 }, { x: -1, z: -5.8 }, { x: 3.2, z: -5.8 }, { x: -4.4, z: 4.4 }, { x: 0.4, z: 4.6 }, { x: 5.4, z: 4.4 }, { x: -7.4, z: 4.2 }, { x: 7.6, z: 4.6 }]),
    ladders: [{ x: -7.6, z: -6 }, { x: 1.2, z: -6.2 }],
  },
];
/** Where you arrive on a floor (the ladder up / the lift). */
export const MINE_ARRIVE = { x: 0, z: 5.9 } as const;
export const MINE_LIFT_AT = { x: -7.2, z: 5.6 } as const;

export type MineFloor = {
  floor: number;
  template: number;
  mirror: boolean;
  pillars: { x: number; z: number; r: number }[];
  /** Rocks up today (index = rock id on this floor today). */
  rocks: { i: number; x: number; z: number; vein: boolean }[];
  ladder: { x: number; z: number };
  ladderNeed: number;
  vein: boolean;
};
/** The floor carrying today's vein (1…10, or 1…20 once the lift is built). */
export const veinFloor = (day: number, lift: boolean) => 1 + (mh(`vein:${day}`) % (lift ? 20 : 10));
/** Today's floor (same for everyone). */
export function mineFloor(day: number, floor: number, lift = false): MineFloor {
  const template = mh(`tpl:${day}:${floor}`) % MINE_TEMPLATES.length,
    mirror = (mh(`mir:${day}:${floor}`) & 1) === 1,
    t = MINE_TEMPLATES[template];
  const flip = <P extends { x: number }>(p: P): P => (mirror ? { ...p, x: -p.x } : { ...p });
  const count = 10 + (mh(`cnt:${day}:${floor}`) % 5);
  const vein = veinFloor(day, lift) === floor;
  const order = t.cells
    .map((c, i) => ({ c, i, k: mh(`cell:${day}:${floor}:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, count)
    .sort((a, b) => a.i - b.i);
  return {
    floor,
    template,
    mirror,
    pillars: t.pillars.map(flip),
    rocks: order.map(({ c, i }, n) => ({ i, ...flip(c), vein: vein && n < VEIN_ROCKS })),
    ladder: flip(t.ladders[mh(`lad:${day}:${floor}`) % t.ladders.length]),
    ladderNeed: ladderNeed(day, floor),
    vein,
  };
}
export type MineDrop = { item: 'stone' | 'copper' | 'iron' | 'gold' | 'gem'; n: number; fossil?: string };
/**
 * What rock `i` of a floor drops for a friend today (deterministic): one kind
 * by the band table (copper/iron/gold/gem +`orePts`%p taken from stone), 1–2
 * of it (ore +`oreBonus`, ×VEIN_MULT on a vein rock), sometimes a fossil too.
 */
/** The best ore a floor's band gives (광부의 힘's extra ore). */
export function floorOre(floor: number): 'copper' | 'iron' | 'gold' {
  const b = bandOf(floor);
  return b.gold ? 'gold' : b.iron ? 'iron' : 'copper';
}
export function mineDrop(key: string, floor: number, vein: boolean, orePts = 0): MineDrop {
  const b = bandOf(floor);
  const r = (mh(`drop:${key}`) % 10_000) / 100;
  const ore = b.copper + b.iron + b.gold;
  const scale = ore > 0 ? (ore + orePts) / ore : 1;
  let acc = 0;
  let item: MineDrop['item'] = 'stone';
  for (const [k, p] of [
    ['gem', b.gem],
    ['gold', b.gold * scale],
    ['iron', b.iron * scale],
    ['copper', b.copper * scale],
  ] as const) {
    acc += p;
    if (r < acc) {
      item = k;
      break;
    }
  }
  if (vein && item === 'stone') item = b.gold ? 'gold' : b.iron ? 'iron' : 'copper';
  let n = 1 + (mh(`n:${key}`) % 10 < 3 ? 1 : 0);
  if (vein && item !== 'gem') n *= VEIN_MULT;
  const fossils = b.fossils as readonly string[];
  const fossil = mh(`fos:${key}`) % 100 < FOSSIL_CHANCE ? fossils[mh(`fk:${key}`) % fossils.length] : undefined;
  return { item, n, ...(fossil ? { fossil } : {}) };
}
