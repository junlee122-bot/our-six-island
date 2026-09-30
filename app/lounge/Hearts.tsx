'use client';
// The row of ten hearts (친구 사이, the speech box). Its own small module so
// the resident speech box does not pull the whole 친구 사이 chunk (Bonds.tsx)
// into the first screen.
import { Heart } from '../ui/icons';
import { bondHearts } from '../lounge-life-ui';

export function Hearts({ level, size = 14 }: { level: number; size?: number }) {
  const n = bondHearts(level);
  return (
    <span className="l-hearts" role="img" aria-label={`하트 ${n}개`}>
      {Array.from({ length: 10 }, (_, i) => (
        <Heart key={i} size={size} aria-hidden="true" fill={i < n ? '#e2574c' : 'none'} color={i < n ? '#c43d33' : '#c9bfb2'} />
      ))}
    </span>
  );
}
