'use client';
import { FISH_PAINTED } from '../lounge-assets';
import { ItemIcon } from './ItemIcon';
import './fishing-reel.css';

/**
 * The painted icon of a fish when there is one (fishing sheet, book), else the
 * vector icon. `unknown` draws its shadow (a mask of the painting, no filter).
 */
export function FishArt({ id, size = 40, unknown = false, className = '' }: { id: string; size?: number; unknown?: boolean; className?: string }) {
  const src = FISH_PAINTED[id];
  // Vector icons: the parent's [data-unknown] / :not([data-known]) rule draws their shadow.
  if (!src) return <ItemIcon id={id} size={size} className={className} />;
  if (unknown)
    return (
      <span
        className={`l-fish-art l-fish-shadow ${className}`.trim()}
        style={{ width: size, height: size, maskImage: `url(${src})`, WebkitMaskImage: `url(${src})` }}
        aria-hidden="true"
      />
    );
  return (
    <span className={`l-item-icon l-fish-art ${className}`.trim()} style={{ width: size, height: size }} aria-hidden="true">
      {/* oxlint-disable-next-line nextjs/no-img-element -- Painted icon at a fixed size. */}
      <img src={src} alt="" width={size} height={size} draggable={false} />
    </span>
  );
}
