// Whether the minimap is open and enlarged, shared by the hub's and every
// district's minimap (closing it in the hub keeps it closed in 시장 거리).
import { useSyncExternalStore } from 'react';

export type MinimapState = { open: boolean; expanded: boolean };
let state: MinimapState = { open: true, expanded: false };
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export function setMinimap(next: Partial<MinimapState>) {
  state = { ...state, ...next };
  for (const fn of listeners) fn();
}
export const useMinimap = () => useSyncExternalStore(subscribe, () => state, () => state);
