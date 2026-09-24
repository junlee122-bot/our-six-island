import { useEffect, useState } from 'react';

/**
 * Server clock (local clock + `offset`) that re-renders every `ms` and also
 * exactly when the next of `deadlines` (server ms) passes, so a crop or tree
 * becomes ready on screen the moment its cooldown ends instead of on the
 * next poll or interval.
 */
export function useServerClock(
  offset: number,
  deadlines: readonly (number | null | undefined)[] = [],
  ms = 30_000,
) {
  const [local, setLocal] = useState(() => Date.now());
  const now = local + offset;
  const next = deadlines.reduce<number>(
    (best, at) =>
      typeof at === 'number' && at > now && at < best ? at : best,
    Infinity,
  );
  useEffect(() => {
    const tick = () => setLocal(Date.now());
    const timer = setInterval(tick, ms);
    const first = setTimeout(tick, 0);
    // setTimeout caps at ~24.8 days; far deadlines just wait for the interval.
    const wake = Number.isFinite(next)
      ? setTimeout(tick, Math.min(2 ** 31 - 1, Math.max(0, next - (Date.now() + offset)) + 30))
      : null;
    return () => {
      clearInterval(timer);
      clearTimeout(first);
      if (wake) clearTimeout(wake);
    };
  }, [offset, next, ms]);
  return now;
}
