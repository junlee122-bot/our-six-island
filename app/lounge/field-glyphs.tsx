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
  | 'book'
  // 성장 P1: tools, materials and the forge.
  | 'hoe'
  | 'axe'
  | 'pickaxe'
  | 'rod'
  | 'anvil'
  | 'log'
  | 'rock'
  | 'ore'
  | 'bush'
  | 'sign'
  | 'spark';

const PATHS = {
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
  hook: (
    <>
      <path d="M14 3 v10 a4 4 0 0 1 -8 0 v-1 l2 2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14" cy="3" r="1.6" fill="#d9573f" />
    </>
  ),
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
      <circle cx="13" cy="4.5" r="2" fill="currentColor" />
      <path d="M12 8 l-2 6 l3 2 l-1 5 M10 14 l-3 5 M12 8 l4 3 l3 -1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
} as Record<GlyphName, ReactNode>;

const WOOD = '#b98553';
const IRON = '#9aa3ad';
Object.assign(PATHS, {
  hoe: (
    <>
      <path d="M6 21 L17 6" stroke={WOOD} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M6 21 L17 6" stroke={INK} strokeWidth="0.9" strokeLinecap="round" opacity=".35" />
      <path d="M14.5 4.5 l6 1.5 -1.2 4.6 -3.6 -1.2z" fill={IRON} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  axe: (
    <>
      <path d="M7 21 L16 6" stroke={WOOD} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M13.5 5.5 c2 -3 6 -3 7.5 0.5 c-1 2.5 -3.5 4.5 -6.5 4.5 z" fill={IRON} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 8.5 l3 -1.8" stroke="#dfe5ea" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  pickaxe: (
    <>
      <path d="M8 21 L15 8" stroke={WOOD} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M4 8 C8 3 17 2 21 5 C17 4.5 11 6 7 10z" fill={IRON} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  rod: (
    <>
      <path d="M4 20 L18 4" stroke={WOOD} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M18 4 C21 9 20 14 17 17" fill="none" stroke={INK} strokeWidth="1" />
      <circle cx="6.8" cy="16.6" r="1.8" fill="#d9573f" stroke={INK} strokeWidth="1" />
      <path d="M17 17 v2 a1.4 1.4 0 0 1 -2.8 0" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  anvil: (
    <>
      <path d="M3 8 h14 c0 2.5 2 3.5 4 3.5 v1 h-6 l-1.5 2 h-5 l-1.5 -2 c-2.5 0 -4 -2 -4 -4.5z" fill="#6f7780" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 14.5 h6 l1.5 5 h-9z" fill="#59616a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 9.8 h9" stroke="#b9c1c9" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M18.5 4 l1 -2 M21 5.5 l2 -1 M16 3.2 v-2" stroke="#f3a53a" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  log: (
    <>
      <path d="M5 9 h13 v8 h-13z" fill={WOOD} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="18" cy="13" rx="3" ry="4" fill="#e9c58f" stroke={INK} strokeWidth="1.5" />
      <path d="M18 11.3 a1.6 1.6 0 1 1 -0.1 0" fill="none" stroke="#b98553" strokeWidth="1" />
      <path d="M7 12 h7 M8 15 h5" stroke="#8e613a" strokeWidth="1.1" strokeLinecap="round" />
    </>
  ),
  rock: (
    <>
      <path d="M3.5 18 C3 12 7 7 12 7 C17 7 21 11 20.5 17 C20 20.5 5 21 3.5 18z" fill="#a3a6a0" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 11.5 c2 -1.4 4 -1.8 6 -1.2" stroke="#d6d8d2" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  ),
  ore: (
    <>
      <path d="M3.5 18 C3 12 7 7 12 7 C17 7 21 11 20.5 17 C20 20.5 5 21 3.5 18z" fill="#8f8a83" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 12 l2 -2 2 2 -2 2z M13.5 14 l2 -2.2 2 2.2 -2 2z M10 16.5 l1.5 -1.5 1.5 1.5 -1.5 1.5z" fill="#d9844a" stroke="#8a4a22" strokeWidth=".8" />
    </>
  ),
  bush: (
    <>
      <path d="M4 19 c-2 -4 1 -8 5 -7 c0 -4 6 -5 8 -2 c4 -1 6 4 3 8 z" fill="#7aa35a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 19 v-4 M14 19 v-5" stroke="#5b4027" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  sign: (
    <>
      <path d="M12 21 V9" stroke={WOOD} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 4 h14 l3 3 -3 3 h-14z" fill="#f2e3c2" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 7 h8" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  spark: (
    <path d="M12 2 l2 7 7 2 -7 2 -2 7 -2 -7 -7 -2 7 -2z" fill="#f3c332" stroke="#a87a12" strokeWidth="1.3" strokeLinejoin="round" />
  ),
} satisfies Partial<Record<GlyphName, ReactNode>>);

export function Glyph({ name, size = 18, className = '' }: { name: GlyphName; size?: number; className?: string }) {
  return (
    <svg className={`l-glyph ${className}`} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
