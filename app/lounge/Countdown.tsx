'use client';
/** Small circular countdown ring with the remaining seconds in the middle. */
export function CountdownRing({
  seconds,
  total,
  label,
}: {
  seconds: number;
  total: number;
  label: string;
}) {
  const r = 16,
    c = 2 * Math.PI * r,
    ratio = total > 0 ? Math.max(0, Math.min(1, seconds / total)) : 0;
  return (
    <span
      className={'l-countdown' + (seconds <= 10 ? ' is-urgent' : '')}
      role="timer"
      aria-label={`${label} ${seconds}초 남음`}
    >
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r={r} className="l-countdown-track" />
        <circle
          cx="20"
          cy="20"
          r={r}
          className="l-countdown-bar"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
        />
      </svg>
      <b aria-hidden="true">{seconds}</b>
    </span>
  );
}
