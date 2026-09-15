'use client';
import { memo, useEffect, useRef, useState } from 'react';
import { ACTORS } from './theater-data';
import { loungeSprites } from './lounge-sprites';
import type { Look } from './lounge-look';
import type { Motion } from './character-style';
export const AvatarView = memo(function AvatarView({
  actor,
  look,
  motion = 'idle',
  animated = false,
  portrait = false,
  className = '',
}: {
  actor: number;
  look: Look;
  motion?: Motion;
  animated?: boolean;
  portrait?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    let raf = 0,
      visible = true,
      disposed = false;
    const c = ref.current!,
      media = matchMedia('(prefers-reduced-motion: reduce)');
    const io = new IntersectionObserver((e) => {
      visible = e[0].isIntersecting;
    });
    io.observe(c);
    setError(false);
    loungeSprites()
      .then((s) => {
        if (disposed) return;
        const draw = (t = 0) => {
          if (disposed) return;
          if (visible || !animated)
            s.draw(c, actor, look, motion, t / 1000, portrait, media.matches);
          if (animated) raf = requestAnimationFrame(draw);
        };
        draw();
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [actor, look, motion, animated, portrait]);
  return (
    <span className={'avatar-view ' + className}>
      <canvas
        ref={ref}
        width={portrait ? 200 : 440}
        height={portrait ? 200 : 540}
        role="img"
        aria-label={`${ACTORS[actor]} 2D 캐릭터`}
      />
      {error && (
        <span className="avatar-error">
          그림을 불러오지 못했어요. 새로고침해 주세요.
        </span>
      )}
    </span>
  );
});
