import { useEffect, useState } from 'react';

/** Re-renders every `ms` while `active`; returns the local clock. */
export function useNow(active: boolean, ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, ms);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, [active, ms]);
  return now;
}
