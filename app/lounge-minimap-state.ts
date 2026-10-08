// Whether the minimap is folded, shared by the hub map (lounge-village.tsx)
// and the district maps (lounge/DistrictMinimap.tsx). It changes only when
// the player presses the map's own toggle: leaving a house, entering a
// district or an interior and reloading the page keep it as it was (saved in
// localStorage). HUD 다이어트 (D2): it starts folded (the toggle and M open
// it), so a new player or blocked storage sees the folded map.
import { useSyncExternalStore } from 'react';

export const MINIMAP_OPEN_KEY = 'beomdew:minimap-open';
const listeners = new Set<() => void>();
let cached: boolean | null = null;

export function minimapOpen(): boolean {
  if (cached !== null) return cached;
  let raw: string | null = null;
  try {
    raw = globalThis.localStorage?.getItem(MINIMAP_OPEN_KEY) ?? null;
  } catch {
    raw = null;
  }
  cached = raw === '1';
  return cached;
}
export function setMinimapOpen(open: boolean) {
  cached = open;
  try {
    globalThis.localStorage?.setItem(MINIMAP_OPEN_KEY, open ? '1' : '0');
  } catch {
    // Storage blocked: the choice still holds for this page.
  }
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
/** M (지도): opens the folded map, folds the open one. */
export function toggleMinimap() {
  setMinimapOpen(!minimapOpen());
}
/** [open, setOpen] backed by the shared, saved choice. */
export function useMinimapOpen(): [boolean, (open: boolean) => void] {
  const open = useSyncExternalStore(subscribe, minimapOpen, () => false);
  return [open, setMinimapOpen];
}
