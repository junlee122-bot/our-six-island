'use client';
import { useEffect, useState } from 'react';

// Deadlines come from the server clock. The cloud client reports the skew
// (serverNow - Date.now()) from each response; until then local time is used.
let clockOffset = 0;
export function setServerClockOffset(offset: number) {
  if (Number.isFinite(offset)) clockOffset = offset;
}
export const serverNow = () => Date.now() + clockOffset;

const secondsUntil = (deadline: number) =>
  Math.max(0, Math.ceil((deadline - serverNow()) / 1000));

/**
 * Whole seconds left until `deadline` (server epoch ms). Checks every 250ms but
 * only re-renders when the whole second changes.
 */
export function useSecondsLeft(deadline: number | undefined) {
  const [left, setLeft] = useState(() =>
    deadline === undefined ? null : secondsUntil(deadline),
  );
  const [shownFor, setShownFor] = useState(deadline);
  if (shownFor !== deadline) {
    // New deadline: recompute during render (no stale frame).
    setShownFor(deadline);
    setLeft(deadline === undefined ? null : secondsUntil(deadline));
  }
  useEffect(() => {
    if (deadline === undefined) return;
    const timer = setInterval(() => setLeft(secondsUntil(deadline)), 250);
    return () => clearInterval(timer);
  }, [deadline]);
  return deadline === undefined ? null : left;
}

/**
 * Countdown ring for the seat that must act. `total` is the full turn length
 * so the ring can show the fraction left; `label` names whose clock it is.
 */
export function TurnTimer({
  deadline,
  total,
  label,
  mine = false,
}: {
  deadline?: number;
  total: number;
  label: string;
  mine?: boolean;
}) {
  const seconds = useSecondsLeft(deadline);
  if (seconds === null) return null;
  const fraction = Math.max(0, Math.min(1, (seconds * 1000) / total)),
    urgent = seconds <= 10;
  return (
    <span
      className={
        'turn-timer' + (urgent ? ' urgent' : '') + (mine ? ' mine' : '')
      }
      role="timer"
      aria-live={urgent && mine ? 'assertive' : 'off'}
      aria-label={`${label} 남은 시간 ${seconds}초`}
      title={`${label} · ${seconds}초 뒤 자동 진행`}
    >
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className="turn-timer-track" cx="18" cy="18" r="15.5" />
        <circle
          className="turn-timer-fill"
          cx="18"
          cy="18"
          r="15.5"
          pathLength={100}
          strokeDasharray={`${fraction * 100} 100`}
        />
      </svg>
      <b>{seconds}</b>
      <small>{label}</small>
    </span>
  );
}

/** Label for seats the server plays automatically. */
export const AWAY_LABEL = '자리 비움 · 자동 진행';
/**
 * Calls `unlock` once an action was rejected (or failed). Cloud rooms return a
 * Promise<boolean>; a legacy void return unlocks after 2.5s so a dropped
 * peer-to-peer action can be retried.
 */
export function awaitAnswer(
  result: void | Promise<boolean>,
  unlock: () => void,
) {
  if (result && typeof (result as Promise<boolean>).then === 'function')
    (result as Promise<boolean>).then(
      (ok) => {
        if (!ok) unlock();
      },
      unlock,
    );
  else setTimeout(unlock, 2500);
}
