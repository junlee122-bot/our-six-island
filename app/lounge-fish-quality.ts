// Fish quality (은별·금별) kept beside the plain inventory count: the bag
// holds `ext.inv[id]` fish of every quality and `angling.u[uid].fq[id]` says
// how many of them are silver/gold. Reads clamp to the bag, so cooking,
// gifts or bundles that take fish through the older paths use up normal
// fish first; selling goes best first. No imports from the life engines (it
// is called from lounge-life-plus, which the fishing engine imports).
import type { LifeState } from './lounge-life.ts';

export const FISH_QUALITY_MULT = [1, 1.25, 1.5] as const;
export type FishQ = [silver: number, gold: number];

type QualityLife = { angling?: { u?: Record<string, { fq?: Record<string, FishQ> }> }; ext?: Record<string, { inv?: Record<string, number> }> };
const qOf = (life: QualityLife, uid: string) => life.angling?.u?.[uid]?.fq;

/** [normal, silver, gold] of a fish in the bag right now. */
export function fishQualitySplit(life: Pick<LifeState, 'ext'> & QualityLife, uid: string, id: string): [number, number, number] {
  const total = life.ext?.[uid]?.inv?.[id] ?? 0,
    q = qOf(life, uid)?.[id],
    gold = Math.min(total, q?.[1] ?? 0),
    silver = Math.min(total - gold, q?.[0] ?? 0);
  return [total - silver - gold, silver, gold];
}
/** Price multiplier for selling n of a fish, best quality first. */
export function fishSaleMult(life: Pick<LifeState, 'ext'> & QualityLife, uid: string, id: string, n: number) {
  if (n <= 0) return 1;
  const [normal, silver, gold] = fishQualitySplit(life, uid, id),
    g = Math.min(n, gold),
    s = Math.min(n - g, silver),
    rest = Math.min(n - g - s, normal);
  const sold = g + s + rest;
  return sold > 0 ? (g * FISH_QUALITY_MULT[2] + s * FISH_QUALITY_MULT[1] + rest) / sold : 1;
}
/** Takes the quality marks of n sold fish (best first). Call before the bag count drops. */
export function takeSoldFishQuality(life: QualityLife & Pick<LifeState, 'ext'>, uid: string, id: string, n: number) {
  const fq = qOf(life, uid);
  if (!fq?.[id]) return;
  const [, silver, gold] = fishQualitySplit(life, uid, id),
    g = Math.min(n, gold),
    s = Math.min(n - g, silver),
    next: FishQ = [silver - s, gold - g];
  if (next[0] > 0 || next[1] > 0) fq[id] = next;
  else delete fq[id];
}
