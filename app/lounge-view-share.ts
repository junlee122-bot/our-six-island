// Keeps unchanged parts of the world view as the same objects between
// responses, so game tables re-render only when their own match changes.
// Pure (no imports): used by lounge-cloud-room.ts and lounge/table-chunks.ts.

/** World keys whose objects are kept (same reference) while unchanged. */
const STABLE_KEYS = [
  'chess',
  'gostop',
  'poker',
  'blackjack',
  'seotda',
  'yacht',
  'liar',
  'liarsbar',
  'party',
  'tables',
  'seats',
  'names',
  'invites',
] as const;
/**
 * The packet with every STABLE_KEYS value that equals the one on screen
 * replaced by that object, so memoized tables (table-chunks.ts) and effects
 * keyed on a match skip the many responses that only moved someone else.
 */
export function keepUnchanged<T extends Partial<Record<(typeof STABLE_KEYS)[number], unknown>>>(
  previous: Partial<Record<(typeof STABLE_KEYS)[number], unknown>>,
  next: T,
): T {
  let out = next;
  for (const k of STABLE_KEYS) {
    const a = previous[k],
      b = next[k];
    if (a == null || b == null || a === b) continue;
    if (JSON.stringify(a) !== JSON.stringify(b)) continue;
    if (out === next) out = { ...next };
    (out as Record<string, unknown>)[k] = a;
  }
  return out;
}

/**
 * Whether a table would render the same. The world view is replaced on every
 * poll and every friend's step in the village; CloudRoom keeps each match
 * object when it did not change, so a table skips those renders.
 * - `match`, `view`, `room`: by identity.
 * - callbacks: ignored. GameScreen builds them from the match (id, revision)
 *   and the room, both compared above.
 * - the rest (seat, names, figures, round, reaction, settlement): by value.
 */
export function sameTableProps(
  a: Readonly<Record<string, unknown>>,
  b: Readonly<Record<string, unknown>>,
): boolean {
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k],
      y = b[k];
    if (x === y) continue;
    if (typeof x === 'function' && typeof y === 'function') continue;
    if (k === 'match' || k === 'view' || k === 'room') return false;
    if (JSON.stringify(x) !== JSON.stringify(y)) return false;
  }
  return true;
}
