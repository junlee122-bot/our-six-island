// 우리 농장 손맛 (D4): world pops — a harvested crop rising "+1" from its
// plot, earth puffs where the hoe bit, droplets where the can poured, and a
// little sparkle (and shake) for a gold-star harvest. Pure helpers only (no
// DOM, no three.js): what changed on my field between two snapshots, which
// particles a pop throws, and the capped queue the overlay
// (lounge/WorldPops.tsx) draws. The hub (lounge-village.tsx) and the farm
// district (lounge-area-3d.tsx) project the world point to screen px.

/** What a pop shows: a harvest (+1 icon), hoe dust, or watering droplets. */
export type WorldPopKind = 'harvest' | 'till' | 'water';

/** The fields of a plot the diff reads (lounge-life PlotView). */
export type FarmFxPlot = {
  crop: string | null;
  t?: 1;
  readyAt?: number | null;
  wateredAt?: number | null;
  quality?: number;
  locked?: true;
};

/** Something that just happened on a field tile. */
export type FarmFx = { kind: WorldPopKind; tile: number; crop?: string; quality?: number };

/** One particle: where it flies (px from the pop), how big, when and how long. */
export type WorldParticle = { dx: number; dy: number; size: number; delay: number; ms: number };

/** A pop on screen (px inside the scene). */
export type WorldPop = {
  id: string;
  kind: WorldPopKind;
  x: number;
  y: number;
  /** ms before it starts (several tiles at once ripple). */
  delay: number;
  crop?: string;
  quality?: number;
  /** Reduced motion: no particles, no shake; the pop only fades. */
  still: boolean;
  /** Gold star or better: sparkle and a small shake. */
  gold: boolean;
  parts: WorldParticle[];
};

/** Pops on screen at once (older ones drop first). */
export const POP_MAX = 16;
/** Fx from one snapshot at most (a sprinkler morning wets many tiles at once). */
export const FX_BATCH_MAX = 10;
/** Delay between the pops of one batch. */
export const POP_STAGGER_MS = 70;

/** 금별 (2) and 별빛 (3) harvests sparkle and shake. */
export const isGoldHarvest = (quality: number | undefined) => (quality ?? 0) >= 2;

const ripeAt = (p: FarmFxPlot | undefined, now: number) => !!p?.crop && p.readyAt !== null && p.readyAt !== undefined && p.readyAt <= now;

/**
 * What changed on my field from `prev` to `next` (same tile numbering):
 * a ripe crop gone or regrowing (harvest), bare soil now tilled (till), a
 * crop's soil wet again or wet longer (water). Locked or new tiles are
 * skipped; at most FX_BATCH_MAX, harvests first.
 */
export function farmFxDiff(prev: readonly FarmFxPlot[], next: readonly FarmFxPlot[], now: number): FarmFx[] {
  const harvests: FarmFx[] = [],
    rest: FarmFx[] = [];
  const n = Math.min(prev.length, next.length);
  for (let tile = 0; tile < n; tile++) {
    const was = prev[tile],
      is = next[tile];
    if (!was || !is || was.locked || is.locked) continue;
    if (ripeAt(was, now) && (is.crop !== was.crop || !ripeAt(is, now))) {
      harvests.push({ kind: 'harvest', tile, crop: was.crop!, quality: was.quality ?? 0 });
      continue;
    }
    if (!was.t && !was.crop && is.t && !is.crop) {
      rest.push({ kind: 'till', tile });
      continue;
    }
    const wet = is.wateredAt ?? null,
      dry = was.wateredAt ?? null;
    if (is.crop && is.crop === was.crop && wet !== null && (dry === null || wet > dry)) rest.push({ kind: 'water', tile });
  }
  return [...harvests, ...rest].slice(0, FX_BATCH_MAX);
}

/** A small deterministic random (mulberry32) so a pop's particles are stable per id. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The particles a pop throws: hoe dust puffs out low and sideways, droplets
 * splash up and fall, a gold harvest sparkles in a ring. None for a plain
 * harvest, and none at all with reduced motion.
 */
export function particleSpec(kind: WorldPopKind, seed: number, opts: { gold?: boolean; reduced?: boolean } = {}): WorldParticle[] {
  if (opts.reduced) return [];
  const r = rng(seed);
  const round = (v: number) => Math.round(v * 10) / 10;
  if (kind === 'till')
    return Array.from({ length: 6 }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      return { dx: round(side * (10 + r() * 22)), dy: round(-(4 + r() * 14)), size: Math.round(7 + r() * 7), delay: Math.round(r() * 80), ms: Math.round(520 + r() * 220) };
    });
  if (kind === 'water')
    return Array.from({ length: 7 }, (_, i) => {
      const a = Math.PI * (0.15 + (0.7 * i) / 6) + (r() - 0.5) * 0.3;
      return { dx: round(-Math.cos(a) * (12 + r() * 14)), dy: round(-(10 + r() * 16)), size: Math.round(4 + r() * 3), delay: Math.round(r() * 120), ms: Math.round(560 + r() * 200) };
    });
  if (!opts.gold) return [];
  return Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 8 + (r() - 0.5) * 0.4,
      d = 26 + r() * 14;
    return { dx: round(Math.cos(a) * d), dy: round(Math.sin(a) * d - 18), size: Math.round(5 + r() * 4), delay: Math.round(120 + r() * 160), ms: Math.round(620 + r() * 260) };
  });
}

/** How long a pop stays mounted (its animation plus its delay and particles). */
export function popLifetime(pop: Pick<WorldPop, 'kind' | 'delay' | 'parts'>): number {
  const base = pop.kind === 'harvest' ? 1350 : 200;
  const tail = pop.parts.reduce((m, p) => Math.max(m, p.delay + p.ms), 0);
  return pop.delay + Math.max(base, tail) + 100;
}

let popSeq = 0;
/**
 * Pops for a batch of fx at screen points. Reduced motion: dust and drops
 * are left out (only harvests show, still); the batch staggers by
 * POP_STAGGER_MS.
 */
export function makePops(
  born: readonly { kind: WorldPopKind; x: number; y: number; crop?: string; quality?: number }[],
  reduced: boolean,
  stamp = Date.now(),
): WorldPop[] {
  const out: WorldPop[] = [];
  for (const b of born) {
    if (reduced && b.kind !== 'harvest') continue;
    const seq = ++popSeq,
      gold = b.kind === 'harvest' && isGoldHarvest(b.quality);
    out.push({
      id: `${stamp}-${seq}`,
      kind: b.kind,
      x: Math.round(b.x),
      y: Math.round(b.y),
      delay: out.length * POP_STAGGER_MS,
      ...(b.crop ? { crop: b.crop } : {}),
      ...(b.quality !== undefined ? { quality: b.quality } : {}),
      still: reduced,
      gold,
      parts: particleSpec(b.kind, stamp + seq * 7919, { gold, reduced }),
    });
  }
  return out;
}

/** The queue after adding `born`: the newest POP_MAX. */
export const queuePops = (list: readonly WorldPop[], born: readonly WorldPop[], max = POP_MAX): WorldPop[] => [...list, ...born].slice(-max);

/** prefers-reduced-motion (false where matchMedia is missing). */
export function prefersReducedMotion(): boolean {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
