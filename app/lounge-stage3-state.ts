// 마을 확장 3단계: a friend's saved stage-3 record (`life.ext[uid].s3`) and its
// reader. A leaf (data only), so lounge-life-plus.ts can read saves without an
// import cycle; the engine is lounge-stage3.ts.
import type { DishBuff } from './lounge-items.ts';
import {
  ANIMAL_KINDS,
  ANIMAL_LOVE_MAX,
  BARN_ROOM,
  CLINIC_PER_DAY,
  COOP_ROOM,
  FORTUNE_HOURS,
  FORTUNES,
  FRUIT_TREE_KINDS,
  ORCHARD_SLOTS,
  ORE_PREMIUM_CAP,
  SMITH_TOOLS,
  type AnimalKind,
  type FruitTreeKind,
  type SmithTier,
  type SmithTool,
} from './lounge-stage3-data.ts';

/** One animal: kind, its number among that kind ("닭 2"), 정 (0–10), the last KST day cared for, cares so far. */
export type Animal = { k: AnimalKind; n: number; love: number; last?: number; cares: number };
/** One fruit tree: kind, the KST day planted, the last KST day picked. */
export type FruitTree = { k: FruitTreeKind; at: number; picked?: number };
export type Stage3User = {
  a?: Animal[];
  /** ORCHARD_SLOTS spots (null = empty). */
  t?: (FruitTree | null)[];
  /** Range upgrades bought at 오른's (absent = tier 1). */
  sm?: Partial<Record<SmithTool, SmithTier>>;
  /** KST day of the daily fields below. */
  day?: number;
  /** Clinic visits today. */
  cl?: number;
  /** Today's-ore premium 범 today. */
  ore?: number;
  /** Today's fortune: its buff and the KST day it was read. */
  fo?: { kind: DishBuff; until: number; day: number };
};

const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const FORTUNE_KINDS = new Set<string>(FORTUNES.map((f) => f.kind));

/** Normalizes life.ext[uid].s3; unknown fields drop, an empty record is undefined. */
export function readStage3User(v: unknown): Stage3User | undefined {
  const x = obj(v),
    out: Stage3User = {};
  if (Array.isArray(x.a)) {
    const counts: Record<string, number> = {};
    const animals: Animal[] = [];
    for (const raw of x.a.slice(0, COOP_ROOM + BARN_ROOM)) {
      const a = obj(raw);
      if (!(ANIMAL_KINDS as readonly unknown[]).includes(a.k)) continue;
      const k = a.k as AnimalKind;
      const home = k === 'chicken' ? 'coop' : 'barn';
      const inHome = animals.filter((o) => (o.k === 'chicken' ? 'coop' : 'barn') === home).length;
      if (inHome >= (home === 'coop' ? COOP_ROOM : BARN_ROOM)) continue;
      counts[k] = (counts[k] ?? 0) + 1;
      animals.push({
        k,
        n: safe(a.n) && a.n > 0 ? Math.min(99, a.n) : counts[k],
        love: safe(a.love) ? Math.min(ANIMAL_LOVE_MAX, a.love) : 0,
        cares: safe(a.cares) ? Math.min(1_000_000, a.cares) : 0,
        ...(safe(a.last) && a.last > 0 ? { last: a.last } : {}),
      });
    }
    if (animals.length) out.a = animals;
  }
  if (Array.isArray(x.t)) {
    const trees = x.t.slice(0, ORCHARD_SLOTS).map((raw): FruitTree | null => {
      const t = obj(raw);
      if (!(FRUIT_TREE_KINDS as readonly unknown[]).includes(t.k) || !safe(t.at) || t.at <= 0) return null;
      return { k: t.k as FruitTreeKind, at: t.at, ...(safe(t.picked) && t.picked > 0 ? { picked: t.picked } : {}) };
    });
    if (trees.some(Boolean)) out.t = trees;
  }
  const sm: Partial<Record<SmithTool, SmithTier>> = {};
  for (const tool of SMITH_TOOLS) {
    const tier = obj(x.sm)[tool];
    if (tier === 2 || tier === 3) sm[tool] = tier;
  }
  if (Object.keys(sm).length) out.sm = sm;
  if (safe(x.day) && x.day > 0) {
    out.day = x.day;
    if (safe(x.cl) && x.cl > 0) out.cl = Math.min(CLINIC_PER_DAY, x.cl);
    if (safe(x.ore) && x.ore > 0) out.ore = Math.min(ORE_PREMIUM_CAP, x.ore);
  }
  const fo = obj(x.fo);
  if (typeof fo.kind === 'string' && FORTUNE_KINDS.has(fo.kind) && safe(fo.until) && safe(fo.day) && fo.day > 0)
    out.fo = { kind: fo.kind as DishBuff, until: fo.until, day: fo.day };
  return Object.keys(out).length ? out : undefined;
}
/** The fortune's buff if still on (the 운세 칸; lounge-food-data.ts buffPower reads it as a weak buff). */
export const fortuneSlotOf = (s3: Stage3User | undefined, now: number) => (s3?.fo && now < s3.fo.until ? s3.fo : null);
export const FORTUNE_MS = FORTUNE_HOURS * 3_600_000;
