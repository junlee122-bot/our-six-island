'use client';
// Small hand-drawn glyphs for the farm ledger and the fishing screens (VILL-2):
// thick rounded ink strokes and flat fills in the village palette, instead of
// a generic line-icon set. 24×24, decorative (aria-hidden).
import type { ReactNode } from 'react';

const INK = '#4a3423';
export type GlyphName =
  | 'can'
  | 'drop'
  | 'basket'
  | 'seed'
  | 'leaf'
  | 'sack'
  | 'hook'
  | 'star'
  | 'moon'
  | 'lock'
  | 'walk'
  | 'wave'
  | 'bell'
  | 'book';

const PATHS: Record<GlyphName, ReactNode> = {
  can: (
    <>
      <path d="M5 10 h10 v8 a2 2 0 0 1 -2 2 h-6 a2 2 0 0 1 -2 -2z" fill="#7fb3c8" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M15 12 l5 -4 v2 l-4 4" fill="#7fb3c8" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7 10 c0 -4 6 -4 6 0" fill="none" stroke={INK} strokeWidth="1.6" />
      <path d="M20.5 6.5 l1 -1 M21 9 l1.4 0.2" stroke="#7fb3c8" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  drop: <path d="M12 3 C8 9 6 12 6 15 a6 6 0 0 0 12 0 c0 -3 -2 -6 -6 -12z" fill="#6fb2d4" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
  basket: (
    <>
      <path d="M3.5 10 h17 l-2 9 a2 2 0 0 1 -2 1.6 h-9 a2 2 0 0 1 -2 -1.6z" fill="#d9a35b" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7 10 l3 -6 M17 10 l-3 -6" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.5 14 h11 M7.5 17 h9" stroke="#a8743a" strokeWidth="1.3" />
    </>
  ),
  seed: (
    <>
      <path d="M6 4 h12 v16 h-12z" fill="#f2e3c2" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 4 h12 v4 h-12z" fill="#c9a36a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 18 c-3 -2 -3 -5 0 -7 c3 2 3 5 0 7z" fill="#6aa84f" />
    </>
  ),
  leaf: <path d="M5 19 C5 9 11 5 20 4 C19 13 15 19 5 19z M5 19 L13 11" fill="#7dbb5d" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
  sack: (
    <>
      <path d="M8 6 h8 l-1 3 c4 2 5 6 5 9 a2 2 0 0 1 -2 2 h-12 a2 2 0 0 1 -2 -2 c0 -3 1 -7 5 -9z" fill="#e0c28e" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 9 h6" stroke={INK} strokeWidth="1.6" />
    </>
  ),
  hook: <path d="M14 3 v10 a4 4 0 0 1 -8 0 v-1 l2 2" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  star: <path d="M12 3 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.8z" fill="#f3c332" stroke="#a87a12" strokeWidth="1.4" strokeLinejoin="round" />,
  moon: <path d="M15 3 a8.5 8.5 0 1 0 6 13 a7 7 0 0 1 -6 -13z" fill="#f3d98a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
  lock: (
    <>
      <path d="M6 11 h12 v9 h-12z" fill="#c9a36a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.5 11 v-3 a3.5 3.5 0 0 1 7 0 v3" fill="none" stroke={INK} strokeWidth="1.6" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4.5" r="2" fill={INK} />
      <path d="M12 8 l-2 6 l3 2 l-1 5 M10 14 l-3 5 M12 8 l4 3 l3 -1" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  wave: <path d="M2 14 c3 -3 5 -3 8 0 s5 3 8 0 s3 -2 4 -1 M2 19 c3 -3 5 -3 8 0 s5 3 8 0" fill="none" stroke="#4f8aa6" strokeWidth="1.8" strokeLinecap="round" />,
  bell: (
    <>
      <path d="M6 17 h12 l-1.5 -2 v-4 a4.5 4.5 0 0 0 -9 0 v4z" fill="#f3d98a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10.5 19.5 a1.6 1.6 0 0 0 3 0" fill="none" stroke={INK} strokeWidth="1.6" />
    </>
  ),
  book: (
    <>
      <path d="M3 5 c3 -1 6 -1 9 1 v14 c-3 -2 -6 -2 -9 -1z" fill="#f2e3c2" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M21 5 c-3 -1 -6 -1 -9 1 v14 c3 -2 6 -2 9 -1z" fill="#e9d6ad" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
};

export function Glyph({ name, size = 18, className = '' }: { name: GlyphName; size?: number; className?: string }) {
  return (
    <svg className={`l-glyph ${className}`} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
