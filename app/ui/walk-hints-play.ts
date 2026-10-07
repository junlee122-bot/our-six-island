// 걷기 키 안내 (D16): how long this device has played in the walking scenes.
// WalkHints adds the visible time while it is on screen; after the first
// 30 minutes the strip folds to one small "키 안내" button (설정 → 화면 can keep
// it open or always fold it). Per device, in localStorage; blocked storage
// just means the strip stays open.
import type { WalkHintMode } from '../lounge-settings.ts';

export const WALK_HINTS_PLAY_KEY = 'bumtadew-walkhints-play-ms';
/** Play time after which the 'auto' strip folds. */
export const WALK_HINTS_FOLD_MS = 30 * 60_000;
/** How often the counter is written while the strip is on screen. */
export const WALK_HINTS_TICK_MS = 15_000;

export function readPlayMs(raw: string | null | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 1e12) : 0;
}
/** Whether the strip starts folded. */
export const walkHintsFolded = (mode: WalkHintMode, playMs: number) => mode === 'fold' || (mode === 'auto' && playMs >= WALK_HINTS_FOLD_MS);

export function loadPlayMs(): number {
  try {
    return readPlayMs(globalThis.localStorage?.getItem(WALK_HINTS_PLAY_KEY));
  } catch {
    return 0;
  }
}
/** Adds play time (capped per call so a sleeping laptop does not count) and returns the total. */
export function addPlayMs(ms: number): number {
  const total = loadPlayMs() + Math.max(0, Math.min(ms, 2 * WALK_HINTS_TICK_MS));
  try {
    globalThis.localStorage?.setItem(WALK_HINTS_PLAY_KEY, String(Math.round(total)));
  } catch {}
  return total;
}
