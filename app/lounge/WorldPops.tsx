'use client';
// 우리 농장 손맛 (D4): the world-pop overlay shared by the hub and the
// districts — "+1" crops rising from their plot, hoe dust, watering
// droplets, a gold-star sparkle. The scene projects the world point and
// calls push(); the pops clean themselves up (lounge-world-pops.ts).
import { useCallback, useState, type CSSProperties } from 'react';
import { ItemIcon } from './ItemIcon';
import type { Quality } from '../lounge-life';
import { makePops, popLifetime, prefersReducedMotion, queuePops, type WorldPop, type WorldPopKind } from '../lounge-world-pops';
import './world-pops.css';

export type WorldPopBirth = { kind: WorldPopKind; x: number; y: number; crop?: string; quality?: number };

/** The pops on screen and push() for a scene (stable; safe from a frame loop). */
export function useWorldPops(): [WorldPop[], (born: readonly WorldPopBirth[]) => void] {
  const [pops, setPops] = useState<WorldPop[]>([]);
  const push = useCallback((born: readonly WorldPopBirth[]) => {
    const made = makePops(born, prefersReducedMotion());
    if (!made.length) return;
    setPops((list) => queuePops(list, made));
    const ids = new Set(made.map((p) => p.id));
    // Each batch clears itself (after unmount this is a no-op).
    setTimeout(() => setPops((list) => list.filter((p) => !ids.has(p.id))), Math.max(...made.map(popLifetime)));
  }, []);
  return [pops, push];
}

const at = (style: Record<string, string | number>) => style as CSSProperties;

/** The overlay: absolute over the scene, no pointer events. */
export function WorldPops({ pops, className = '' }: { pops: readonly WorldPop[]; className?: string }) {
  return (
    <div className={`wp-pops ${className}`.trim()} aria-hidden="true">
      {pops.map((p) => (
        <span
          key={p.id}
          className={`wp-pop wp-${p.kind}`}
          data-q={p.quality ?? undefined}
          data-gold={p.gold || undefined}
          data-still={p.still || undefined}
          style={{ left: p.x, top: p.y, animationDelay: `${p.delay}ms` }}
        >
          {p.kind === 'harvest' && p.crop && (
            <span className="wp-pop-item" style={{ animationDelay: `${p.delay + 220}ms` }}>
              <ItemIcon id={p.crop} size={44} quality={(p.quality || undefined) as Quality | undefined} />
              <b>+1</b>
            </span>
          )}
          {p.parts.map((q, i) => (
            <i
              key={i}
              className="wp-part"
              style={at({
                '--dx': `${q.dx}px`,
                '--dy': `${q.dy}px`,
                width: q.size,
                height: q.size,
                animationDelay: `${p.delay + q.delay}ms`,
                animationDuration: `${q.ms}ms`,
              })}
            />
          ))}
        </span>
      ))}
    </div>
  );
}
