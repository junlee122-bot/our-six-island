// 우리 농장 F2: the soil (design-our-farm.md §3-2 – §3-4, §11). Pure and
// `now`-injected; a leaf (the calendar and the farm data only), so the life
// engine, the farm engine and the UI can all read it at the top level.
//
//  - Tilling: a field starts as grass; only tilled tiles take seeds. A tile
//    stays tilled after its harvest (Plot.t).
//  - Wet soil (model A): a crop grows only while its soil is wet. Watering by
//    hand keeps a tile wet until the next 06:00 KST; rain, a sprinkler
//    (Plot.sp: covered since) and 보습 흙 (Plot.rs) wet it on their own. Dry
//    crops wait; they never die of thirst. Stored per plot as `wetMs` (growth
//    by `wetUntil`) and `wetUntil` (when the hand watering runs out).
//  - Tool reach: 1 tile → its row (1 × 3) → the 3 × 3 around it.
//  - Front-yard spots for scarecrows and bee houses, and the 덩굴 시렁 (trellis).
import { dayStart, rainsOn } from './lounge-calendar.ts';
import { GRID_COLS, GRID_ROWS, GRID_TILES, tileAt, tileRC } from './lounge-farm-data.ts';

const HOUR = 3_600_000,
  DAY = 24 * HOUR,
  KST = 9 * HOUR;
const kday = (t: number) => Math.floor((t + KST) / DAY);

// ---------------------------------------------------------------- wet soil
/** Hand watering keeps a tile wet until this hour (KST) comes round. */
export const WET_HOUR = 6;
/**
 * Every grow time is 0.6× what it was before wet soil: a friend who waters
 * every day grows as fast as the old "watered" crop (which grew 40% faster),
 * so a day's harvests (and the economy) stay where they were.
 */
export const GROW_WET = 0.6;
/** How far back rain is looked up (a crop left dry longer is not slower to read). */
const RAIN_LOOKBACK_DAYS = 400;
/** rainsOn by KST day, remembered (a view reads the same days for every tile). */
const rainMemo = new Map<number, boolean>();
function rainy(d: number) {
  let r = rainMemo.get(d);
  if (r === undefined) {
    if (rainMemo.size > 4_000) rainMemo.clear();
    r = rainsOn(d);
    rainMemo.set(d, r);
  }
  return r;
}

/** The next 06:00 KST strictly after `t`: how long a watering lasts. */
export function nextWetEnd(t: number): number {
  const six = dayStart(kday(t)) + WET_HOUR * HOUR;
  return t < six ? six : six + DAY;
}
/** Rain on KST day `d` keeps the soil wet from its 00:00 until 06:00 the next day. */
export const rainWindow = (d: number): [number, number] => [dayStart(d), dayStart(d + 1) + WET_HOUR * HOUR];

/** The soil fields of a plot (lounge-life Plot has them all). */
export type SoilPlot = {
  plantedAt: number;
  /** Growth (ms) the crop has by `wetUntil` (absent: never watered by hand). */
  wetMs?: number;
  /** When the last hand watering dries out (06:00 KST); a checkpoint when ≤ now. */
  wetUntil?: number;
  /** Under a sprinkler since then. */
  sp?: number;
  /** 보습 흙: always wet. */
  rs?: 1;
};

/**
 * Walks the soil's own wet time (rain, sprinkler, 보습 흙) between `a` and
 * `b`: how much of it is wet, and when `need` of it has passed (Infinity if
 * not by `b`). Rain counts only for days that have begun by `rainUntil`
 * (the forecast is not known yet).
 */
function walkWet(p: SoilPlot, a: number, b: number, rainUntil: number, need = Infinity): { got: number; at: number } {
  let got = 0,
    at = Infinity;
  const add = (s: number, e: number) => {
    s = Math.max(s, a);
    e = Math.min(e, b);
    if (e <= s) return false;
    if (got + (e - s) >= need) {
      at = s + (need - got);
      got = need;
      return true;
    }
    got += e - s;
    return false;
  };
  if (b <= a) return { got, at: need <= 0 ? a : Infinity };
  if (need <= 0) return { got, at: a };
  if (p.rs) {
    add(a, b);
    return { got, at };
  }
  const sp = p.sp ?? Infinity,
    rainEnd = Math.min(b, sp);
  let cursor = a;
  if (rainEnd > a) {
    // `now` = Infinity (the whole forecast) still looks ahead only so far.
    const last = kday(Math.min(rainEnd, rainUntil, a + RAIN_LOOKBACK_DAYS * DAY)),
      first = Math.max(kday(a) - 1, last - RAIN_LOOKBACK_DAYS);
    for (let d = first; d <= last; d++) {
      if (!rainy(d)) continue;
      const [ws, we] = rainWindow(d);
      if (ws > rainUntil) break;
      const s = Math.max(ws, cursor),
        e = Math.min(we, rainEnd);
      if (e > s && add(s, e)) return { got, at };
      cursor = Math.max(cursor, e);
    }
  }
  if (sp < b) add(sp, b);
  return { got, at };
}

/** Growth (wet ms) a planted crop has at `t` (counting stops at `cap`). */
export function soilGrowth(p: SoilPlot, t: number, cap = Infinity): number {
  if (p.wetUntil !== undefined && p.wetMs !== undefined) {
    if (t <= p.wetUntil) return Math.min(cap, Math.max(0, p.wetMs - (p.wetUntil - t)));
    if (p.wetMs >= cap) return cap;
    return p.wetMs + walkWet(p, p.wetUntil, t, t, cap - p.wetMs).got;
  }
  return walkWet(p, p.plantedAt, t, t, cap).got;
}
/**
 * When a crop needing `grow` wet ms is ripe, as known at `now`: the moment it
 * ripened if it has; else when it will if the soil stays as wet as it is now
 * (hand watering until `wetUntil`, a sprinkler, 보습 흙, today's rain).
 * Infinity: it is dry and waits for water.
 */
export function soilReadyAt(p: SoilPlot, grow: number, now: number): number {
  let base = 0,
    from = p.plantedAt;
  if (p.wetUntil !== undefined && p.wetMs !== undefined) {
    if (p.wetMs >= grow) return p.wetUntil - (p.wetMs - grow);
    base = p.wetMs;
    from = p.wetUntil;
  }
  return walkWet(p, from, Infinity, now, grow - base).at;
}
/** What keeps the soil wet at `t` (hand first), or null when it is dry. */
export function soilWetBy(p: SoilPlot, t: number): 'hand' | 'rain' | 'sprinkler' | 'soil' | null {
  if (p.wetUntil !== undefined && p.wetUntil > t) return 'hand';
  if (p.rs) return 'soil';
  if (p.sp !== undefined && p.sp <= t) return 'sprinkler';
  for (const d of [kday(t) - 1, kday(t)]) {
    const [s, e] = rainWindow(d);
    if (rainy(d) && s <= t && t < e) return 'rain';
  }
  return null;
}
/** Waters a plot by hand at `now`: wet until the next 06:00 KST. */
export function soilWater(p: SoilPlot, now: number) {
  const until = nextWetEnd(now);
  p.wetMs = soilGrowth(p, now) + (until - now);
  p.wetUntil = until;
}
/**
 * Writes the growth so far into the plot (before its sprinkler or 보습 흙
 * changes), so the change never rewrites growth that already happened.
 */
export function soilCheckpoint(p: SoilPlot, now: number) {
  if (p.wetUntil !== undefined && p.wetUntil > now) return;
  p.wetMs = soilGrowth(p, now);
  p.wetUntil = now;
}
/**
 * 하루 마감 (lounge-myday.ts): `ms` more wet growth for a crop whose soil is
 * wet at `now` (watered by hand, rain, a sprinkler or 보습 흙). A dry crop
 * waits, as it would overnight. Returns whether the crop grew.
 */
export function soilAdvance(p: SoilPlot, ms: number, now: number): boolean {
  if (!(ms > 0) || soilWetBy(p, now) === null) return false;
  soilCheckpoint(p, now);
  p.wetMs = (p.wetMs ?? 0) + ms;
  return true;
}
/**
 * Read-time migration of a plot saved before wet soil (`wateredAt`, and `w`
 * the can's speed-up): it reads as already watered. It keeps growing until
 * the moment the old rules had it ripe (a crop never left unwatered there
 * counts as watered when it was planted), so nobody's crop comes up later.
 */
export function legacyWet(plantedAt: number, wateredAt: number | null, grow: number, w = 0): { wetMs: number; wetUntil: number } {
  const old = Math.round(grow / GROW_WET),
    at = wateredAt !== null && wateredAt >= plantedAt ? wateredAt : plantedAt,
    done = at - plantedAt;
  const ready = done >= old ? plantedAt + old : at + Math.ceil((old - done) * Math.max(0.2, GROW_WET - w / 100));
  return { wetMs: grow, wetUntil: ready };
}

/** Tilled tiles of a field as 20 hex digits (tile i = bit i), for the small friends' view. */
export function tilledMask(field: readonly { t?: 1; crop?: unknown; dead?: unknown }[]): string {
  const digits = Array.from({ length: GRID_TILES / 4 }, () => 0);
  field.forEach((p, i) => {
    if (i < GRID_TILES && (p.t || p.crop || p.dead)) digits[i >> 2] |= 1 << (i & 3);
  });
  return digits.map((d) => d.toString(16)).join('');
}
/** Whether tile `tile` is tilled in a tilledMask string. */
export const maskHas = (mask: string | undefined, tile: number) => !!mask && (parseInt(mask[tile >> 2] ?? '0', 16) & (1 << (tile & 3))) !== 0;

// ---------------------------------------------------------------- tool reach
/** Reach tiers: 1 the tile, 2 its row (1 × 3), 3 the 3 × 3 around it. */
export type ReachTier = 1 | 2 | 3;
/** Tiles a tool of `tier` reaches from `tile` (the tile first), on the grid. */
export function reachTiles(tile: number, tier: number): number[] {
  if (!Number.isSafeInteger(tile) || tile < 0 || tile >= GRID_TILES) return [];
  const { r, c } = tileRC(tile),
    out = [tile];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if ((!dr && !dc) || tier < 2 || (tier === 2 && dr)) continue;
      const t = tileAt(r + dr, c + dc);
      if (t !== null) out.push(t);
    }
  return out;
}
/** 물뿌리개 대장간 단계 (헌·구리·철·금·별빛) → reach (오른's range upgrade can give more). */
export const CAN_FORGE_REACH: readonly ReachTier[] = [1, 1, 2, 2, 3, 3];

// ---------------------------------------------------------------- front-yard spots
/**
 * Scarecrows and bee houses stand on the field's edge, not on its tiles:
 * spots in grid coordinates (row −1 = the house side, row 8 = the lane side),
 * clear of the path from the door. Key in the fixture map: 'y0' … 'y4'.
 */
export const YARD_SPOTS: readonly { r: number; c: number }[] = [
  { r: -1, c: 1 },
  { r: -1, c: 8 },
  { r: GRID_ROWS, c: 1 },
  { r: GRID_ROWS, c: 4 },
  { r: GRID_ROWS, c: 8 },
];
export const yardKey = (spot: number) => 'y' + spot;
/** Spot of a fixture key ('y2' → 2), null for a tile key. */
export function yardOf(key: string): number | null {
  const m = /^y(\d)$/.exec(key);
  return m && Number(m[1]) < YARD_SPOTS.length ? Number(m[1]) : null;
}
/** Grid position (row, column) of a fixture key: a tile or a yard spot. */
export function fixturePos(key: string): { r: number; c: number } | null {
  const y = yardOf(key);
  if (y !== null) return YARD_SPOTS[y];
  if (!/^\d{1,2}$/.test(key) || Number(key) >= GRID_TILES) return null;
  return tileRC(Number(key));
}
/** Chebyshev distance from a fixture key's position to a tile. */
export function fixtureDist(key: string, tile: number) {
  const p = fixturePos(key),
    q = tileRC(tile);
  return p ? Math.max(Math.abs(p.r - q.r), Math.abs(p.c - q.c)) : Infinity;
}
/** Bee house: a ripe flower within this many tiles of its spot makes flower honey. */
export const BEE_REACH = 2;
/** Fixtures that stand in the front yard (the rest stand on a tile). */
export const YARD_KINDS: readonly string[] = ['scarecrow', 'beehouse'];
/**
 * Read-time migration: scarecrows and bee houses still on field tiles move to
 * the free yard spot nearest them (ties: the lower spot); any left over (no
 * spot free) stay on their tile and keep working there until picked up.
 */
export function moveYardFixtures<F extends { k: string }>(fx: Record<string, F>): Record<string, F> {
  const out: Record<string, F> = { ...fx };
  const onTiles = Object.keys(out)
    .filter((k) => yardOf(k) === null && YARD_KINDS.includes(out[k].k))
    .sort((a, b) => Number(a) - Number(b));
  for (const key of onTiles) {
    let best = -1;
    for (let s = 0; s < YARD_SPOTS.length; s++) {
      if (out[yardKey(s)]) continue;
      if (best < 0 || fixtureDist(yardKey(s), Number(key)) < fixtureDist(yardKey(best), Number(key))) best = s;
    }
    if (best < 0) break;
    out[yardKey(best)] = out[key];
    delete out[key];
  }
  return out;
}

// ---------------------------------------------------------------- 덩굴 시렁 (trellis)
/** A trellis covers its tile and the next two to the east (1 × 3). */
export const TRELLIS_LEN = 3;
/** Tiles of a trellis anchored at `tile` (null when it would run off the grid). */
export function trellisTiles(tile: number): number[] | null {
  if (!Number.isSafeInteger(tile) || tile < 0 || tile >= GRID_TILES) return null;
  const { c } = tileRC(tile);
  if (c + TRELLIS_LEN > GRID_COLS) return null;
  return Array.from({ length: TRELLIS_LEN }, (_, i) => tile + i);
}
/** The anchor of the trellis over `tile` in a trellis map (anchor → placed at), or null. */
export function trellisOver(tr: Readonly<Record<string, number>> | undefined, tile: number): number | null {
  for (const k of Object.keys(tr ?? {})) if (trellisTiles(Number(k))?.includes(tile)) return Number(k);
  return null;
}
