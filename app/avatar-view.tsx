'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Canvas is the accessible image because its pixels are drawn locally. */
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
  facing = 1,
}: {
  actor: number;
  look: Look;
  motion?: Motion;
  animated?: boolean;
  portrait?: boolean;
  className?: string;
  facing?: 1 | -1;
}) {
  const lookSnapshot = JSON.stringify(look);
  const ref = useRef<HTMLCanvasElement>(null),
    animationTime = useRef(0),
    [error, setError] = useState(false);
  useEffect(() => {
    let raf = 0,
      timer = 0,
      visible = false,
      pageVisible = document.visibilityState !== 'hidden',
      disposed = false,
      sprites: Awaited<ReturnType<typeof loungeSprites>> | null = null,
      lastFrame = 0,
      lastAnimationTime: number | null = null;
    const c = ref.current!,
      media = matchMedia('(prefers-reduced-motion: reduce)'),
      frameInterval = motion === 'idle' ? 1000 / 8 : 1000 / 24,
      stableLook = JSON.parse(lookSnapshot) as Look;
    const drawOnce = () => {
      if (disposed || !sprites) return;
      sprites.draw(
        c,
        actor,
        stableLook,
        motion,
        animationTime.current,
        portrait,
        media.matches,
        { facing },
      );
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      if (timer) window.clearTimeout(timer);
      raf = 0;
      timer = 0;
      lastAnimationTime = null;
    };
    const tick = (timestamp: number) => {
      raf = 0;
      if (disposed || !visible || !pageVisible || media.matches) return;
      if (timestamp - lastFrame >= frameInterval) {
        const delta =
          lastAnimationTime === null
            ? 0
            : Math.min(
                0.1,
                Math.max(0, (timestamp - lastAnimationTime) / 1000),
              );
        animationTime.current += delta;
        lastAnimationTime = timestamp;
        lastFrame = timestamp;
        drawOnce();
      }
      timer = window.setTimeout(() => {
        timer = 0;
        if (!disposed && visible && pageVisible && !media.matches)
          raf = requestAnimationFrame(tick);
      }, frameInterval);
    };
    const sync = () => {
      if (disposed || !sprites) return;
      if (!animated) {
        drawOnce();
        return;
      }
      if (!visible || !pageVisible) {
        stop();
        return;
      }
      if (media.matches) {
        stop();
        drawOnce();
        return;
      }
      if (!raf && !timer) {
        lastFrame = 0;
        lastAnimationTime = null;
        raf = requestAnimationFrame(tick);
      }
    };
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      sync();
    });
    io.observe(c);
    const onMotionChange = () => sync();
    const onVisibilityChange = () => {
      pageVisible = document.visibilityState !== 'hidden';
      sync();
    };
    media.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    loungeSprites()
      .then((s) => {
        if (disposed) return;
        setError(false);
        sprites = s;
        if (!animated) {
          visible = true;
          drawOnce();
        } else sync();
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    return () => {
      disposed = true;
      stop();
      io.disconnect();
      media.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [actor, lookSnapshot, motion, animated, portrait, facing]);
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
