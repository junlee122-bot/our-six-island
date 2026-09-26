'use client';
// 무드 glyphs: the five mood faces and the small moodle icons, drawn like the
// field glyphs (field-glyphs.tsx): thick rounded ink strokes and flat fills in
// the village palette. No emoji. The faces also exist as data-URI strings for
// the village name tags (CSS custom properties, see mood.css).
import type { CSSProperties, ReactNode } from 'react';
import { MOOD_TIER_BY_ID, type MoodIcon, type MoodTier } from '../lounge-mood-data';
import type { MoodFace } from '../lounge-mood';

const INK = '#4a3423';
const SKIN = '#ffe2a6';
const BLUSH = '#f2a38a';

/** Eyes and mouth of each face (24×24), shared by the JSX and the data URIs. */
const FACE: Record<MoodTier, { parts: { d: string; fill?: string; w?: number }[] }> = {
  great: {
    parts: [
      { d: 'M7.2 10.4 q1.6 -2.2 3.2 0 M13.6 10.4 q1.6 -2.2 3.2 0', w: 1.6 },
      { d: 'M7.4 13.6 h9.2 a4.6 4.6 0 0 1 -9.2 0z', fill: '#c9573f', w: 1.4 },
      { d: 'M5.6 13.4 a1.3 0.9 0 1 0 0.01 0 M18.4 13.4 a1.3 0.9 0 1 0 0.01 0', fill: BLUSH, w: 0 },
    ],
  },
  good: {
    parts: [
      { d: 'M9 9.2 a1.1 1.3 0 1 0 0.01 0 M15 9.2 a1.1 1.3 0 1 0 0.01 0', fill: INK, w: 0 },
      { d: 'M8 14 q4 3.6 8 0', w: 1.6 },
      { d: 'M5.8 13.2 a1.2 0.8 0 1 0 0.01 0 M18.2 13.2 a1.2 0.8 0 1 0 0.01 0', fill: BLUSH, w: 0 },
    ],
  },
  ok: {
    parts: [
      { d: 'M9 9.4 a1.1 1.2 0 1 0 0.01 0 M15 9.4 a1.1 1.2 0 1 0 0.01 0', fill: INK, w: 0 },
      { d: 'M8.6 15 q3.4 1.2 6.8 0', w: 1.6 },
    ],
  },
  low: {
    parts: [
      { d: 'M7 8 l3 1 M17 8 l-3 1', w: 1.4 },
      { d: 'M9 10.6 a1.1 1.2 0 1 0 0.01 0 M15 10.6 a1.1 1.2 0 1 0 0.01 0', fill: INK, w: 0 },
      { d: 'M8.8 16.4 q3.2 -2.6 6.4 0', w: 1.6 },
    ],
  },
  tired: {
    parts: [
      { d: 'M7.4 10.6 q1.6 1.4 3.2 0 M13.4 10.6 q1.6 1.4 3.2 0', w: 1.6 },
      { d: 'M10.6 15.2 a1.4 1.2 0 1 0 2.8 0 a1.4 1.2 0 1 0 -2.8 0', fill: '#8a5a3c', w: 1.2 },
      { d: 'M17.5 3.2 h3 l-3 3 h3', w: 1.2 },
    ],
  },
};

function faceSvgInner(tier: MoodTier, ring: string) {
  const parts = FACE[tier].parts
    .map((p) => `<path d="${p.d}" fill="${p.fill ?? 'none'}" stroke="${p.w === 0 ? 'none' : INK}" stroke-width="${p.w ?? 1.6}" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
  return `<circle cx="12" cy="12.4" r="9.6" fill="${SKIN}" stroke="${ring}" stroke-width="2.4"/>${parts}`;
}
/** A face as a data URI (village name tags). */
export function moodFaceUri(tier: MoodTier) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${faceSvgInner(tier, MOOD_TIER_BY_ID[tier].color)}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
/**
 * CSS custom properties for the village name tags: `--mood-a3` is actor 3's
 * face (mood.css draws it on `.hv-tag[data-actor="3"]`), `--mood-s3` a sparkle
 * while they hold an inspiration.
 */
export function moodTagStyle(faces: Record<number, MoodFace> | undefined): CSSProperties | undefined {
  if (!faces) return undefined;
  const out: Record<string, string> = {};
  for (const [actor, face] of Object.entries(faces)) {
    out[`--mood-a${actor}`] = moodFaceUri(face.tier);
    if (face.insp) out[`--mood-s${actor}`] = '1';
  }
  return out as CSSProperties;
}

/** One mood face (decorative; give the label next to it). */
export function MoodFaceIcon({ tier, size = 28, className = '' }: { tier: MoodTier; size?: number; className?: string }) {
  const ring = MOOD_TIER_BY_ID[tier].color;
  return (
    <svg className={`l-mood-face-svg ${className}`} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" data-tier={tier}>
      <circle cx="12" cy="12.4" r="9.6" fill={SKIN} stroke={ring} strokeWidth="2.4" />
      {FACE[tier].parts.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={p.fill ?? 'none'}
          stroke={p.w === 0 ? 'none' : INK}
          strokeWidth={p.w ?? 1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

const ICON: Record<MoodIcon, ReactNode> = {
  bowl: (
    <>
      <path d="M3.5 11 h17 a8.5 7 0 0 1 -17 0z" fill="#e9c58f" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 18.5 h8" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 8 c0 -2 2 -2 2 -4 M13.5 8 c0 -2 2 -2 2 -4" fill="none" stroke="#b0876a" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  moon: <path d="M15 3 a8.5 8.5 0 1 0 6 13 a7 7 0 0 1 -6 -13z" fill="#f3d98a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
  star: <path d="M12 3 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.8z" fill="#f3c332" stroke="#a87a12" strokeWidth="1.4" strokeLinejoin="round" />,
  chat: (
    <>
      <path d="M4 5 h16 a1.5 1.5 0 0 1 1.5 1.5 v8 a1.5 1.5 0 0 1 -1.5 1.5 h-9 l-4.5 3.5 v-3.5 h-2.5 a1.5 1.5 0 0 1 -1.5 -1.5 v-8 a1.5 1.5 0 0 1 1.5 -1.5z" fill="#fdf3dc" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 10.5 h.01 M12 10.5 h.01 M16 10.5 h.01" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  house: (
    <>
      <path d="M3.5 11 L12 4 l8.5 7" fill="none" stroke="#b5533c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10 v9.5 h12 v-9.5" fill="#f2e3c2" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10.5 19.5 v-5 h3 v5" fill="#b98553" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    </>
  ),
  cloud: <path d="M6.5 18 a4 4 0 0 1 -.5 -8 a5.5 5.5 0 0 1 10.6 -1.2 a4.6 4.6 0 0 1 1 9.2z" fill="#dfe3ea" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
  bolt: <path d="M13.5 2.5 L5 13.5 h6 l-1.5 8 L19 10 h-6z" fill="#f3a53a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />,
  spark: (
    <>
      <path d="M12 2 l2 7 7 2 -7 2 -2 7 -2 -7 -7 -2 7 -2z" fill="#f3c332" stroke="#a87a12" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M19 3.5 v3 M17.5 5 h3" stroke="#a87a12" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  cup: (
    <>
      <path d="M5 9 h11 v5.5 a5.5 5.5 0 0 1 -11 0z" fill="#e9d6ad" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 10.5 h1.5 a2.5 2.5 0 0 1 0 5 h-1.8" fill="none" stroke={INK} strokeWidth="1.6" />
      <path d="M8 6.5 c0 -1.5 1.5 -1.5 1.5 -3 M12 6.5 c0 -1.5 1.5 -1.5 1.5 -3" fill="none" stroke="#b0876a" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  fish: (
    <>
      <path d="M3 12 c4 -6 11 -6 14 0 c-3 6 -10 6 -14 0z" fill="#7fb3c8" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M17 12 l4 -3.5 v7z" fill="#7fb3c8" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 11 h.01" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  cards: (
    <>
      <path d="M4 7 l8 -3 4 11 -8 3z" fill="#fdf3dc" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 5.5 h8 v13 h-8z" fill="#fff" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M15 9 c-1.4 1.6 -1.6 2.6 0 3.8 c1.6 -1.2 1.4 -2.2 0 -3.8z" fill="#c9573f" />
    </>
  ),
  heart: <path d="M12 20 C4 14 3 9 6 6.5 C8.5 4.5 11 6 12 8 C13 6 15.5 4.5 18 6.5 C21 9 20 14 12 20z" fill="#e57a7a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" fill="#f3c332" stroke={INK} strokeWidth="1.5" />
      <path d="M12 2.5 v2.5 M12 19 v2.5 M2.5 12 h2.5 M19 12 h2.5 M5.3 5.3 l1.8 1.8 M16.9 16.9 l1.8 1.8 M5.3 18.7 l1.8 -1.8 M16.9 7.1 l1.8 -1.8" stroke="#d68b1f" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  rain: (
    <>
      <path d="M6.5 13 a4 4 0 0 1 -.5 -8 a5.5 5.5 0 0 1 10.6 -1.2 a4.6 4.6 0 0 1 1 9.2z" fill="#c9d3de" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 16 l-1 3 M12 16 l-1 3 M16 16 l-1 3" stroke="#4f8aa6" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  gift: (
    <>
      <path d="M4 10 h16 v10 h-16z" fill="#e57a7a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 7 h18 v3 h-18z" fill="#f09a8a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 7 v13" stroke="#f3c332" strokeWidth="2" />
      <path d="M12 7 c-2 -4 -6 -3 -4 0 M12 7 c2 -4 6 -3 4 0" fill="none" stroke={INK} strokeWidth="1.4" />
    </>
  ),
  party: (
    <>
      <path d="M4 20 L8 7 l9 9z" fill="#f3c332" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 14 l3 3 M7.5 10 l5.5 5.5" stroke="#c9573f" strokeWidth="1.3" />
      <path d="M14 4 v2 M18 6.5 l-1.5 1.5 M20 11 h-2" stroke="#7aa35a" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  up: (
    <>
      <circle cx="12" cy="12" r="9" fill="#a8d08d" stroke={INK} strokeWidth="1.5" />
      <path d="M12 17 v-9 M8 11.5 l4 -4 4 4" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  wave: <path d="M2 12 c3 -3 5 -3 8 0 s5 3 8 0 s3 -2 4 -1 M2 17 c3 -3 5 -3 8 0 s5 3 8 0" fill="none" stroke="#4f8aa6" strokeWidth="1.8" strokeLinecap="round" />,
  sofa: (
    <>
      <path d="M5 10 v-2.5 a2 2 0 0 1 2 -2 h10 a2 2 0 0 1 2 2 v2.5" fill="#c98b6b" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 11 a1.8 1.8 0 0 1 3.6 0 v2 h10.8 v-2 a1.8 1.8 0 0 1 3.6 0 v6 h-18z" fill="#e0a482" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 17 v2 M19 17 v2" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  leaf: <path d="M5 19 C5 9 11 5 20 4 C19 13 15 19 5 19z M5 19 L13 11" fill="#7dbb5d" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />,
};

/** A small moodle icon (decorative). */
export function MoodGlyph({ name, size = 18, className = '' }: { name: MoodIcon; size?: number; className?: string }) {
  return (
    <svg className={`l-glyph l-mood-glyph ${className}`} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {ICON[name]}
    </svg>
  );
}
/** Needs → icon. */
export const NEED_ICON = { food: 'bowl', rest: 'moon', fun: 'party', social: 'chat' } as const satisfies Record<string, MoodIcon>;
