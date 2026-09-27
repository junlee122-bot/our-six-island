'use client';
// 범타듀 밸리 UI glyphs — ONE hand-drawn icon family (24 box, ink #4a3423,
// 1.5–1.6 strokes with round joins, flat 1–2 colour fills). Promoted from
// app/lounge/field-glyphs.tsx (ledger / fishing / growth) plus the drafts from
// the UI audit (docs: README → UI primitives). Use this instead of lucide or emoji.
// Glyphs are decorative (aria-hidden); the button or label next to them carries
// the name. Action glyphs (check, close, plus, arrow, undo, redo) are drawn in
// currentColor so they follow the text colour on any surface.
import type { ReactNode } from 'react';

const INK = '#4a3423';
const WOOD = '#b98553';
const IRON = '#9aa3ad';

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
  | 'spark'
  | 'tree'
  | 'mushroom'
  | 'fossil'
  | 'ladder'
  | 'mountain'
  | 'bag'
  | 'letter'
  | 'coin'
  | 'gift'
  | 'map'
  | 'chat'
  | 'sticker'
  | 'menu'
  | 'sun'
  | 'cloud'
  | 'maple'
  | 'people'
  | 'heart'
  | 'gear'
  | 'sprout'
  | 'pot'
  | 'board'
  | 'news'
  | 'camera'
  | 'keyboard'
  | 'house'
  | 'close'
  | 'save'
  | 'warn'
  | 'hand'
  | 'plus'
  | 'chip'
  | 'check'
  | 'arrow'
  | 'undo'
  | 'redo'
  | 'trash'
  | 'armchair'
  | 'copy'
  | 'door'
  | 'refresh';

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
  // 성장 P1/P2: tools, materials, regions.
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
  tree: (
    <>
      <path d="M12 2 L20 13 H15 L19 18 H5 L9 13 H4z" fill="#6f9a52" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 18 v4" stroke="#7a5334" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  mushroom: (
    <>
      <path d="M3 12 C3 5 21 5 21 12 z" fill="#c2413a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="8.5" cy="9" r="1.2" fill="#fff4e0" />
      <circle cx="14.5" cy="8" r="1.4" fill="#fff4e0" />
      <path d="M9 12 h6 v6 a3 3 0 0 1 -6 0z" fill="#f2e3c2" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  fossil: (
    <>
      <circle cx="12" cy="12" r="9" fill="#d8c7a4" stroke={INK} strokeWidth="1.5" />
      <path d="M12 12 m0 -1 a1 1 0 1 1 -1 1 a2.4 2.4 0 1 1 3 -2.2 a4 4 0 1 1 -5.4 4.4 a5.6 5.6 0 1 1 8.6 -4" fill="none" stroke="#8a6a3e" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  ladder: (
    <>
      <path d="M7 3 v18 M17 3 v18" stroke="#8a6242" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7 7 h10 M7 12 h10 M7 17 h10" stroke="#b98553" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  mountain: (
    <>
      <path d="M2 20 L9 8 L13 14 L16 10 L22 20z" fill="#8fa77a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 8 l-2 3.4 h4z" fill="#f4f1e8" />
    </>
  ),
  // UI audit drafts (HUD, menus, letters).
  bag: <><path d="M5 9 h14 l-1 11 a1.5 1.5 0 0 1 -1.5 1.3 h-9 a1.5 1.5 0 0 1 -1.5 -1.3z" fill="#c98f55" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 9 v-2 a3 3 0 0 1 6 0 v2" fill="none" stroke={INK} strokeWidth="1.6" /><path d="M8 13 h8" stroke={INK} strokeWidth="1.4" strokeLinecap="round" /></>,
  letter: <><path d="M3.5 6.5 h17 v11 h-17z" fill="#fff6dc" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><path d="M3.5 6.5 l8.5 6.5 l8.5 -6.5" fill="none" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="13" r="2" fill="#c2413a" /></>,
  coin: <><circle cx="12" cy="12" r="8" fill="#f3c332" stroke="#a87a12" strokeWidth="1.6" /><path d="M9 9.5 h6 M9 12 h6 M12 9.5 v6" stroke="#a87a12" strokeWidth="1.5" strokeLinecap="round" /></>,
  gift: <><path d="M4.5 10 h15 v10 h-15z" fill="#e57a5c" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><path d="M3.5 7 h17 v3 h-17z" fill="#f09a7a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><path d="M12 7 v13" stroke="#f3d98a" strokeWidth="2.4" /><path d="M12 7 c-3 -4 -6 -2 -4 0 M12 7 c3 -4 6 -2 4 0" fill="none" stroke={INK} strokeWidth="1.4" /></>,
  map: <><path d="M3 6 l6 -2 l6 2 l6 -2 v14 l-6 2 l-6 -2 l-6 2z" fill="#f2e3c2" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 4 v14 M15 6 v14" stroke={INK} strokeWidth="1.2" /><path d="M11 11 l2 2 M13 11 l-2 2" stroke="#c2413a" strokeWidth="1.6" strokeLinecap="round" /></>,
  chat: <><path d="M4 5 h16 v10 h-9 l-4 4 v-4 h-3z" fill="#fffaf0" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><path d="M8 9.5 h8 M8 12 h5" stroke={INK} strokeWidth="1.3" strokeLinecap="round" /></>,
  sticker: <><circle cx="12" cy="12" r="8" fill="#f3d98a" stroke={INK} strokeWidth="1.6" /><circle cx="9.3" cy="10.5" r="1.1" fill={INK} /><circle cx="14.7" cy="10.5" r="1.1" fill={INK} /><path d="M8.8 14 c1.8 2 4.6 2 6.4 0" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" /></>,
  menu: <path d="M5 7 h14 M5 12 h14 M5 17 h14" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />,
  sun: <><circle cx="12" cy="12" r="4.5" fill="#f3c332" stroke="#a87a12" strokeWidth="1.4" /><path d="M12 3 v2 M12 19 v2 M3 12 h2 M19 12 h2 M5.6 5.6 l1.4 1.4 M17 17 l1.4 1.4 M5.6 18.4 l1.4 -1.4 M17 7 l1.4 -1.4" stroke="#a87a12" strokeWidth="1.5" strokeLinecap="round" /></>,
  cloud: <path d="M6 18 a4 4 0 0 1 .5 -8 a5.5 5.5 0 0 1 10.5 1.5 a3.3 3.3 0 0 1 1 6.5z" fill="#eef2f4" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
  maple: <path d="M12 3 l1.5 4 3 -1.5 -1 4 4 .5 -3 3 2 1.5 -5 1 .5 3.5 -2 -1.5 -2 1.5 .5 -3.5 -5 -1 2 -1.5 -3 -3 4 -.5 -1 -4 3 1.5z" fill="#e0763a" stroke="#9a4418" strokeWidth="1.2" strokeLinejoin="round" />,
  people: <><circle cx="9" cy="8" r="3" fill="#f2d2b0" stroke={INK} strokeWidth="1.5" /><circle cx="16" cy="9" r="2.5" fill="#f2d2b0" stroke={INK} strokeWidth="1.5" /><path d="M3.5 19 c0 -4 3 -6 5.5 -6 s5.5 2 5.5 6z" fill="#7dbb5d" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" /><path d="M14 13.5 c3.5 -.5 6.5 1.5 6.5 5.5 h-5" fill="#7fb3c8" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" /></>,
  heart: <path d="M12 20 C5 15 3 11.5 3 8.5 a4.5 4.5 0 0 1 9 -1 a4.5 4.5 0 0 1 9 1 c0 3 -2 6.5 -9 11.5z" fill="#e0584a" stroke="#8e2a20" strokeWidth="1.5" strokeLinejoin="round" />,
  gear: <><circle cx="12" cy="12" r="6.5" fill="#c9cfd4" stroke={INK} strokeWidth="1.6" /><circle cx="12" cy="12" r="2.4" fill="#fffaf0" stroke={INK} strokeWidth="1.4" /><path d="M12 2.5 v3 M12 18.5 v3 M2.5 12 h3 M18.5 12 h3 M5.3 5.3 l2.1 2.1 M16.6 16.6 l2.1 2.1 M5.3 18.7 l2.1 -2.1 M16.6 7.4 l2.1 -2.1" stroke={INK} strokeWidth="2.2" strokeLinecap="round" /></>,
  sprout: <><path d="M12 21 v-8" stroke="#5b7a2e" strokeWidth="2" strokeLinecap="round" /><path d="M12 13 c-6 0 -8 -4 -8 -7 c5 0 8 2 8 7z" fill="#7dbb5d" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" /><path d="M12 11 c5 0 7 -3 7 -6 c-4 0 -7 2 -7 6z" fill="#9ccf6f" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" /><path d="M6 21 h12" stroke="#8a5a32" strokeWidth="2.2" strokeLinecap="round" /></>,
  pot: <><path d="M4 11 h16 v4 a5 5 0 0 1 -5 5 h-6 a5 5 0 0 1 -5 -5z" fill="#9aa3ad" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><path d="M2.5 11 h19" stroke={INK} strokeWidth="1.8" strokeLinecap="round" /><path d="M9 7 c0 -2 1.5 -2 1.5 -4 M13.5 7 c0 -2 1.5 -2 1.5 -4" stroke="#b0b8bf" strokeWidth="1.4" strokeLinecap="round" fill="none" /></>,
  board: <><path d="M4 5 h16 v11 h-16z" fill="#c98f55" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><path d="M7 16 v5 M17 16 v5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" /><path d="M7 8 h6 v4 h-6z" fill="#fff6dc" stroke={INK} strokeWidth="1.1" /><path d="M14.5 8.5 h3 v3 h-3z" fill="#f3d98a" stroke={INK} strokeWidth="1.1" /></>,
  news: <><path d="M4 5 h13 v14 a1.5 1.5 0 0 1 -1.5 1.5 h-10 a1.5 1.5 0 0 1 -1.5 -1.5z" fill="#fffaf0" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><path d="M17 9 h3 v10 a1.5 1.5 0 0 1 -3 0" fill="#efe1c0" stroke={INK} strokeWidth="1.5" /><path d="M7 8.5 h7 M7 11.5 h7 M7 14.5 h4" stroke={INK} strokeWidth="1.3" strokeLinecap="round" /></>,
  camera: <><path d="M3.5 8 h4 l1.5 -2.5 h6 l1.5 2.5 h4 v11 h-17z" fill="#e9d6ad" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="13.2" r="3.6" fill="#7fb3c8" stroke={INK} strokeWidth="1.5" /></>,
  keyboard: <><rect x="3" y="7" width="18" height="11" rx="2" fill="#fffaf0" stroke={INK} strokeWidth="1.6" /><path d="M6 10.5 h1 M9 10.5 h1 M12 10.5 h1 M15 10.5 h1 M18 10.5 h0 M7 14.5 h10" stroke={INK} strokeWidth="1.6" strokeLinecap="round" /></>,
  house: <><path d="M4 11 l8 -7 l8 7 v9 h-16z" fill="#f2e3c2" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><path d="M2.5 12 l9.5 -8.5 l9.5 8.5" fill="none" stroke="#c2413a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 20 v-5 h4 v5" fill="#a8784a" stroke={INK} strokeWidth="1.4" /></>,
  close: <path d="M6.5 6.5 l11 11 M17.5 6.5 l-11 11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />,
  save: <path d="M5 12.5 l4.5 4.5 l9.5 -10" fill="none" stroke="#4f7a45" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />,
  warn: <><path d="M12 3.5 l9 16 h-18z" fill="#f3d98a" stroke="#8e2a20" strokeWidth="1.6" strokeLinejoin="round" /><path d="M12 9.5 v4.5" stroke="#8e2a20" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="17" r="1.1" fill="#8e2a20" /></>,
  hand: <path d="M8 12 v-6 a1.4 1.4 0 0 1 2.8 0 v5 v-6.5 a1.4 1.4 0 0 1 2.8 0 v6.5 v-5 a1.4 1.4 0 0 1 2.8 0 v8 c0 4 -2 6.5 -6 6.5 c-3 0 -4.5 -2 -6 -5 l-1.5 -3 a1.3 1.3 0 0 1 2.2 -1.3z" fill="#f2d2b0" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />,
  plus: <path d="M12 5 v14 M5 12 h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />,
  chip: <><circle cx="12" cy="12" r="8.5" fill="#c2413a" stroke="#6b1f24" strokeWidth="1.5" /><circle cx="12" cy="12" r="5" fill="none" stroke="#fff6dc" strokeWidth="1.6" strokeDasharray="2.6 2" /></>,
  // Stage A additions (same hand): actions the primitives need.
  copy: (
    <>
      <path d="M8 3.5 h10 a1.5 1.5 0 0 1 1.5 1.5 v11 h-11.5z" fill="#fffaf0" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4.5 8 h11 v12.5 h-11z" fill="#f2e3c2" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 12 h5 M7.5 15 h5 M7.5 18 h3" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  door: (
    <>
      <path d="M5 21 V4.5 a1.5 1.5 0 0 1 1.5 -1.5 h8 a1.5 1.5 0 0 1 1.5 1.5 V21z" fill="#c98f55" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 7 h5 v5 h-5z" fill="#f2e3c2" stroke={INK} strokeWidth="1.2" />
      <circle cx="13.2" cy="14.5" r="1" fill={INK} />
      <path d="M3 21 h16" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17.5 12 h4.5 M20 9.8 l2.2 2.2 -2.2 2.2" fill="none" stroke="#c2413a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  refresh: <path d="M19 12 a7 7 0 1 1 -2.2 -5.1 M19.5 4 v4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  check: <path d="M5 12.5 l4.5 4.5 l9.5 -10" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />,
  arrow: <path d="M4 12 h14 M13 6.5 l5.5 5.5 -5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />,
  undo: <path d="M9 5 L4.5 9.5 9 14 M4.5 9.5 h9.5 a5.5 5.5 0 0 1 0 11 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  redo: <path d="M15 5 l4.5 4.5 -4.5 4.5 M19.5 9.5 h-9.5 a5.5 5.5 0 0 0 0 11 h4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  trash: (
    <>
      <path d="M6 8 h12 l-1 12 a1.5 1.5 0 0 1 -1.5 1.3 h-7 a1.5 1.5 0 0 1 -1.5 -1.3z" fill="#e9d6ad" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 7.5 h16 M9.5 7.5 v-2.5 h5 v2.5 M10 11.5 v6 M14 11.5 v6" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  armchair: (
    <>
      <path d="M5 11 v-3 a3 3 0 0 1 3 -3 h8 a3 3 0 0 1 3 3 v3" fill="#c98f55" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.5 11 h3 v3 h11 v-3 h3 v6 h-17z" fill="#e0a86a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5.5 17 v3 M18.5 17 v3" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
};

export const GLYPH_NAMES = Object.keys(PATHS) as GlyphName[];

export function Glyph({
  name,
  size = 18,
  className = '',
  title,
}: {
  name: GlyphName;
  size?: number;
  className?: string;
  /** Only for a glyph that stands alone as content (not inside a labelled button). */
  title?: string;
}) {
  return (
    <svg
      className={`l-glyph ui-glyph ${className}`.trim()}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
