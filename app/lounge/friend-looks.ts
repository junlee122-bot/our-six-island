// The last look this device saw for each friend (from village presence or a
// room visit), so NPCs, mail and simple-mode avatars wear the friend's own
// outfit instead of the default. Per-device convenience only: storage can be
// missing or throw, and everything falls back to defaultLook.
import { isActor } from '../lounge-roster';
import { defaultLook, readLook, type Look } from '../lounge-look';

const KEY = 'bumtadew-friend-looks-v1';
let cache: Record<number, Look> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function load(): Record<number, Look> {
  if (cache) return cache;
  cache = {};
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem(KEY) ?? '{}');
    if (raw && typeof raw === 'object')
      for (const [k, v] of Object.entries(raw)) {
        const actor = Number(k);
        if (isActor(actor))
          cache[actor] = readLook(v, actor);
      }
  } catch {}
  return cache;
}

/** Remembers `look` for `actor` (no-op when unchanged). */
export function rememberLook(actor: number, look: Look | undefined | null) {
  if (!look || !isActor(actor)) return;
  const all = load();
  const clean = readLook(look, actor);
  if (JSON.stringify(all[actor]) === JSON.stringify(clean)) return;
  all[actor] = clean;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      globalThis.localStorage?.setItem(KEY, JSON.stringify(load()));
    } catch {}
  }, 1000);
}

/** The friend's last seen look, else their default look. */
export function lookFor(actor: number): Look {
  return load()[actor] ?? defaultLook(actor);
}
