/** A hold continues until every pressed key and pointer has been released. */
export function fishingInput() {
  const keys = new Set<string>(), pointers = new Set<number>();
  const holding = () => keys.size > 0 || pointers.size > 0;
  return {
    key(code: string, down: boolean) { if (down) keys.add(code); else keys.delete(code); return holding(); },
    pointer(id: number, down: boolean) { if (down) pointers.add(id); else pointers.delete(id); return holding(); },
    clear() { keys.clear(); pointers.clear(); return false; },
    holding,
  };
}
