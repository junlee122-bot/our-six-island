'use client';
// Small vector icons for every life item (crops, seeds, fish, bugs, forage,
// dishes, tools) so no emoji is used as an icon. Shapes are simple painted
// silhouettes in one 48×48 box; colour comes from the item. Furniture uses its
// room art (lounge-furniture-art.ts).
import type { ReactNode } from 'react';
import { FURNITURE_ART } from '../lounge-furniture-art';
import type { Quality } from '../lounge-life';

const INK = '#3d2f25';
const eye = (x: number, y: number) => (
  <>
    <circle cx={x} cy={y} r="2.2" fill="#fff" />
    <circle cx={x - 0.4} cy={y} r="1.1" fill={INK} />
  </>
);

/* ------------------------------------------------------------ crops */
const CROP_ART: Record<string, ReactNode> = {
  carrot: (
    <>
      <path d="M24 44 L14 16 Q24 10 34 16 Z" fill="#f28c28" stroke="#c9661a" strokeWidth="1.5" />
      <path d="M19 24h8M21 31h6" stroke="#c9661a" strokeWidth="1.5" />
      <path d="M24 14 C18 4 14 4 12 7 M24 14 C24 3 27 1 30 3 M24 14 C31 6 35 6 37 9" stroke="#4f9a3c" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  tomato: (
    <>
      <circle cx="24" cy="27" r="16" fill="#e0432f" stroke="#a82a1c" strokeWidth="1.5" />
      <ellipse cx="18" cy="22" rx="4" ry="3" fill="#ff9b8a" opacity=".7" />
      <path d="M24 12 l-7 -3 4 6 -8 1 9 1 -3 6 5 -5 5 5 -3 -6 9 -1 -8 -1 4 -6z" fill="#3f8a34" />
    </>
  ),
  pumpkin: (
    <>
      <ellipse cx="24" cy="29" rx="18" ry="14" fill="#ee8a2c" stroke="#b85f14" strokeWidth="1.5" />
      <path d="M24 16 C18 20 18 38 24 42 M24 16 C30 20 30 38 24 42 M13 19 C9 26 10 36 16 41 M35 19 C39 26 38 36 32 41" stroke="#b85f14" strokeWidth="1.5" fill="none" />
      <path d="M24 16 C24 11 26 8 30 7" stroke="#5b7a2e" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  strawberry: (
    <>
      <path d="M24 44 C12 36 8 26 12 19 C16 13 32 13 36 19 C40 26 36 36 24 44Z" fill="#e2334a" stroke="#a51f33" strokeWidth="1.5" />
      {[
        [18, 24],
        [24, 22],
        [30, 24],
        [20, 31],
        [28, 31],
        [24, 37],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1" ry="1.5" fill="#ffe08a" />
      ))}
      <path d="M24 16 l-8 -4 4 5 -6 2 8 0 2 4 2 -4 8 0 -6 -2 4 -5z" fill="#3f8a34" />
    </>
  ),
  potato: (
    <>
      <ellipse cx="24" cy="26" rx="17" ry="13" fill="#c99a5b" stroke="#8e6637" strokeWidth="1.5" transform="rotate(-12 24 26)" />
      <circle cx="17" cy="23" r="1.4" fill="#8e6637" />
      <circle cx="28" cy="20" r="1.2" fill="#8e6637" />
      <circle cx="30" cy="31" r="1.4" fill="#8e6637" />
    </>
  ),
  spinach: (
    <>
      <path d="M24 44 C10 36 8 18 16 8 C22 18 24 30 24 44Z" fill="#3f8a3c" />
      <path d="M24 44 C38 36 40 18 32 8 C26 18 24 30 24 44Z" fill="#57a64c" />
      <path d="M24 44 V14" stroke="#b7dca2" strokeWidth="2" />
    </>
  ),
  corn: (
    <>
      <ellipse cx="24" cy="24" rx="8" ry="17" fill="#f3cc3c" stroke="#c99a18" strokeWidth="1.5" />
      <path d="M18 16h12M17 22h14M17 28h14M18 34h12" stroke="#d9ad24" strokeWidth="1.2" />
      <path d="M16 44 C10 32 12 20 18 14 C18 26 20 36 24 44Z" fill="#6aa84f" />
      <path d="M32 44 C38 32 36 20 30 14 C30 26 28 36 24 44Z" fill="#7dbb5d" />
    </>
  ),
  watermelon: (
    <>
      <circle cx="24" cy="25" r="18" fill="#3f8f3e" stroke="#2b6a2b" strokeWidth="1.5" />
      <path d="M14 11 C10 20 10 32 16 40 M24 7 V43 M34 11 C38 20 38 32 32 40" stroke="#205a22" strokeWidth="3" fill="none" />
    </>
  ),
  sweetpotato: (
    <>
      <path d="M8 30 C10 18 30 12 40 18 C44 22 40 32 30 36 C20 40 7 38 8 30Z" fill="#b24a6a" stroke="#7d2c49" strokeWidth="1.5" />
      <path d="M40 18 l5 -3" stroke="#7d2c49" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 28 q4 -2 8 0 M26 24 q3 -1 6 1" stroke="#e8a3b8" strokeWidth="1.3" fill="none" />
    </>
  ),
  cabbage: (
    <>
      <circle cx="24" cy="26" r="17" fill="#b8dc8f" stroke="#6f9c4a" strokeWidth="1.5" />
      <path d="M24 10 C16 18 16 34 24 42 M24 10 C32 18 32 34 24 42 M10 22 C18 24 30 24 38 22" stroke="#7fae55" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="26" r="6" fill="#e3f2c8" />
    </>
  ),
  fruit: (
    <>
      <path d="M24 16 C14 8 6 18 8 28 C10 38 18 44 24 40 C30 44 38 38 40 28 C42 18 34 8 24 16Z" fill="#d9412e" stroke="#9e2a1c" strokeWidth="1.5" />
      <path d="M24 16 C24 11 25 8 27 6" stroke="#6b4a2b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 10 C31 5 37 7 38 9 C34 12 29 12 26 10Z" fill="#4f9a3c" />
      <ellipse cx="16" cy="22" rx="3" ry="4" fill="#ff9a8a" opacity=".6" />
    </>
  ),
};

/* ------------------------------------------------------------ fish */
type FishLook = { shape: 'fish' | 'long' | 'flat' | 'round' | 'squid' | 'claw' | 'tiny' | 'octo'; body: string; belly?: string; mark?: string };
const FISH_LOOK: Record<string, FishLook> = {
  crucian: { shape: 'fish', body: '#8a8f5a', belly: '#c9c99a' },
  carp: { shape: 'fish', body: '#b9854a', belly: '#e3c08a' },
  koi: { shape: 'fish', body: '#f6f1e7', belly: '#fff', mark: '#f06b3a' },
  bass: { shape: 'fish', body: '#6f8fa3', belly: '#d7e2e8' },
  minnow: { shape: 'tiny', body: '#9fb8c2', mark: '#6b8aa0' },
  sweetfish: { shape: 'fish', body: '#a9c7b5', belly: '#f1e4a6' },
  mandarin: { shape: 'fish', body: '#a58a4f', belly: '#e0cf98', mark: '#5a4a26' },
  catfish: { shape: 'fish', body: '#5d5a4f', belly: '#a9a28c', mark: '#3a372f' },
  eel: { shape: 'long', body: '#4c5a4a', belly: '#a5ab8e' },
  trout: { shape: 'fish', body: '#9aa7b8', belly: '#f2dede', mark: '#e38a9a' },
  medaka: { shape: 'tiny', body: '#c9b98a' },
  goldfish: { shape: 'round', body: '#f4892f', belly: '#ffc07a' },
  snakehead: { shape: 'long', body: '#58624a', belly: '#b0b48f', mark: '#343a2a' },
  smelt: { shape: 'tiny', body: '#c7dce3', mark: '#8fb0bd' },
  loach: { shape: 'long', body: '#8a7a55', belly: '#cbbf95' },
  crayfish: { shape: 'claw', body: '#c8452f' },
  mackerel: { shape: 'fish', body: '#4f7ea0', belly: '#e3eef2', mark: '#2c4f6a' },
  shad: { shape: 'fish', body: '#9bb0c0', belly: '#eef3f6', mark: '#e9c46a' },
  flounder: { shape: 'flat', body: '#a08a67', mark: '#6f5a3c' },
  squid: { shape: 'squid', body: '#e8b6a8' },
  yellowtail: { shape: 'fish', body: '#6d8fb0', belly: '#eef3f6', mark: '#f1c232' },
  puffer: { shape: 'round', body: '#d8c07a', belly: '#fff6d6', mark: '#6f5a2a' },
  seabream: { shape: 'fish', body: '#e0655e', belly: '#ffd2c8' },
  goldcarp: { shape: 'fish', body: '#f2c14e', belly: '#fff1b0', mark: '#fffbe0' },
  // VILL-2 spots.
  kkeokji: { shape: 'fish', body: '#7d7a4a', belly: '#c9c08a', mark: '#4a4630' },
  shiri: { shape: 'tiny', body: '#c9b36a', mark: '#3f4f7a' },
  lenok: { shape: 'fish', body: '#a07e5a', belly: '#ecd2b8', mark: '#c2413a' },
  beodeulchi: { shape: 'tiny', body: '#a89a6a', mark: '#6e6444' },
  rainbow: { shape: 'fish', body: '#8fa7a2', belly: '#f1e6e6', mark: '#e0708a' },
  mochi: { shape: 'tiny', body: '#d9c27a', mark: '#c9573f' },
  bluegill: { shape: 'round', body: '#6d8a8f', belly: '#e9c46a', mark: '#2f4a5a' },
  blackbass: { shape: 'fish', body: '#5f7a4a', belly: '#dfe2c0', mark: '#2f3f25' },
  skygazer: { shape: 'fish', body: '#b9c7cf', belly: '#f4f7f8', mark: '#8a9aa8' },
  greenling: { shape: 'fish', body: '#8a6a4a', belly: '#d9c29a', mark: '#5a4028' },
  rockfish: { shape: 'fish', body: '#8a5a4a', belly: '#e0b8a0', mark: '#5a3024' },
  jacopever: { shape: 'fish', body: '#5a5a52', belly: '#b9b4a4', mark: '#35352f' },
  octopus: { shape: 'octo', body: '#c96a5a', mark: '#f2c4b4' },
  blackbream: { shape: 'fish', body: '#5e6b78', belly: '#d9dfe4', mark: '#2c3640' },
  horsemackerel: { shape: 'fish', body: '#6f93a8', belly: '#eef3f6', mark: '#d9c26a' },
  hairtail: { shape: 'long', body: '#d9e2e8', belly: '#ffffff', mark: '#9fb3c2' },
  conger: { shape: 'long', body: '#7a6a52', belly: '#d9ccb0', mark: '#4a3e2c' },
  mitre: { shape: 'squid', body: '#f0c8b8' },
  moonhairtail: { shape: 'long', body: '#f3e3a3', belly: '#fffbe8', mark: '#d9b64a' },
  kkeuri: { shape: 'fish', body: '#8fa0a8', belly: '#eef0ea', mark: '#e08a4a' },
  nuchi: { shape: 'fish', body: '#b3a37f', belly: '#efe6cf', mark: '#7d6e4f' },
  bagrid: { shape: 'fish', body: '#b58a3f', belly: '#f0dca0', mark: '#4a3a1f' },
};
function fishArt(id: string): ReactNode {
  const f = FISH_LOOK[id];
  if (!f) return null;
  const stroke = { stroke: INK, strokeOpacity: 0.35, strokeWidth: 1.2 };
  switch (f.shape) {
    case 'long':
      return (
        <>
          <path d="M5 26 C10 18 16 32 23 24 S35 16 41 23 L45 20 L44 28 L40 27 C34 33 28 22 22 30 S9 34 5 26Z" fill={f.body} {...stroke} />
          <path d="M9 27 C14 23 18 31 23 27" stroke={f.belly} strokeWidth="1.6" fill="none" />
          {f.mark && <path d="M26 24 l3 2 M31 22 l3 2" stroke={f.mark} strokeWidth="1.6" />}
          {eye(9, 24)}
        </>
      );
    case 'flat':
      return (
        <>
          <ellipse cx="22" cy="25" rx="17" ry="12" fill={f.body} {...stroke} />
          <path d="M38 25 L46 18 L45 32 Z" fill={f.body} {...stroke} />
          {[
            [16, 22],
            [24, 28],
            [28, 20],
            [19, 31],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.8" fill={f.mark} opacity=".7" />
          ))}
          {eye(10, 21)}
        </>
      );
    case 'round':
      return (
        <>
          <circle cx="21" cy="25" r="14" fill={f.body} {...stroke} />
          <path d="M34 25 L45 17 L44 33 Z" fill={f.body} {...stroke} />
          <ellipse cx="20" cy="30" rx="9" ry="5" fill={f.belly} opacity=".9" />
          {f.mark &&
            [
              [14, 16],
              [22, 13],
              [29, 17],
            ].map(([x, y]) => <path key={x} d={`M${x} ${y} l-1 -3 M${x} ${y} l2 -2`} stroke={f.mark} strokeWidth="1.3" />)}
          {eye(12, 22)}
        </>
      );
    case 'squid':
      return (
        <>
          <path d="M24 3 L36 22 C34 28 14 28 12 22 Z" fill={f.body} {...stroke} />
          <path d="M15 26 C13 34 10 38 8 44 M20 27 C19 35 18 40 17 45 M24 27 V45 M28 27 C29 35 30 40 31 45 M33 26 C35 34 38 38 40 44" stroke={f.body} strokeWidth="3" strokeLinecap="round" fill="none" />
          {eye(19, 21)}
          {eye(29, 21)}
        </>
      );
    case 'octo':
      return (
        <>
          <path d="M24 6 C35 6 38 16 36 23 C34 28 14 28 12 23 C10 16 13 6 24 6Z" fill={f.body} {...stroke} />
          <path d="M14 25 C10 32 12 38 8 43 M19 27 C17 34 19 40 15 45 M24 27 V45 M29 27 C31 34 29 40 33 45 M34 25 C38 32 36 38 40 43" stroke={f.body} strokeWidth="3.4" strokeLinecap="round" fill="none" />
          {[[18, 14], [29, 12], [31, 19]].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="1.6" fill={f.mark} />
          ))}
          {eye(20, 20)}
          {eye(28, 20)}
        </>
      );
    case 'claw':
      return (
        <>
          <ellipse cx="24" cy="28" rx="7" ry="12" fill={f.body} {...stroke} />
          <path d="M19 22 C12 18 10 12 12 8 C16 10 18 14 20 18 M29 22 C36 18 38 12 36 8 C32 10 30 14 28 18" stroke={f.body} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M18 30h12M18 35h12" stroke="#8e2a1a" strokeWidth="1.3" />
          <path d="M24 40 l-5 5 h10 z" fill={f.body} />
          {eye(21, 19)}
          {eye(27, 19)}
        </>
      );
    default: {
      const tiny = f.shape === 'tiny';
      return (
        <g transform={tiny ? 'translate(6 7) scale(.75)' : undefined}>
          <path d="M5 25 C11 13 28 11 36 20 L45 12 L43 25 L45 38 L36 30 C28 39 11 37 5 25Z" fill={f.body} {...stroke} />
          <path d="M9 28 C16 33 27 33 34 28" stroke={f.belly ?? '#fff'} strokeWidth="3" fill="none" opacity=".85" strokeLinecap="round" />
          <path d="M22 15 C24 11 28 10 31 12" stroke={f.body} strokeWidth="3" fill="none" strokeLinecap="round" />
          {f.mark && (
            <>
              <path d="M18 18 C20 22 20 26 18 30" stroke={f.mark} strokeWidth="2.2" fill="none" opacity=".9" />
              <path d="M25 17 C27 21 27 26 25 30" stroke={f.mark} strokeWidth="2.2" fill="none" opacity=".7" />
            </>
          )}
          {eye(12, 22)}
        </g>
      );
    }
  }
}

/* ------------------------------------------------------------ bugs */
type BugLook = { shape: 'butterfly' | 'beetle' | 'bee' | 'dragonfly' | 'cicada' | 'hopper' | 'mantis' | 'snail' | 'fly' | 'firefly'; body: string; wing?: string; mark?: string };
const BUG_LOOK: Record<string, BugLook> = {
  butterfly: { shape: 'butterfly', body: '#4a3a2a', wing: '#f5d34b' },
  swallowtail: { shape: 'butterfly', body: '#2f2a24', wing: '#f0c043', mark: '#2f2a24' },
  ladybug: { shape: 'beetle', body: '#d93a2b', mark: '#2b2320' },
  honeybee: { shape: 'bee', body: '#f2b233', mark: '#3a2c1f', wing: '#e6f3fb' },
  cicada: { shape: 'cicada', body: '#6f7f5a', wing: '#dff0ea' },
  beetle: { shape: 'beetle', body: '#5a3a24', mark: '#8a6040' },
  stagbeetle: { shape: 'beetle', body: '#4a2e1c', mark: '#2b1a10' },
  firefly: { shape: 'firefly', body: '#3a342a', wing: '#e8e36a' },
  dragonfly: { shape: 'dragonfly', body: '#4a90b8', wing: '#e3f1f8' },
  reddragonfly: { shape: 'dragonfly', body: '#d9452f', wing: '#fbe6df' },
  grasshopper: { shape: 'hopper', body: '#7fae4a' },
  cricket: { shape: 'hopper', body: '#5a4632' },
  mantis: { shape: 'mantis', body: '#8cc05a' },
  snail: { shape: 'snail', body: '#d8c2a0', mark: '#b07a4a' },
  snowfly: { shape: 'fly', body: '#6f7a88', wing: '#eef3f8' },
};
function bugArt(id: string): ReactNode {
  const b = BUG_LOOK[id];
  if (!b) return null;
  switch (b.shape) {
    case 'butterfly':
      return (
        <>
          <path d="M24 22 C14 6 4 10 6 20 C8 26 16 26 24 24Z M24 22 C34 6 44 10 42 20 C40 26 32 26 24 24Z" fill={b.wing} stroke={INK} strokeOpacity=".4" />
          <path d="M24 25 C16 26 8 32 12 38 C16 42 22 34 24 28Z M24 25 C32 26 40 32 36 38 C32 42 26 34 24 28Z" fill={b.wing} stroke={INK} strokeOpacity=".4" />
          {b.mark && <path d="M10 14 l8 6 M38 14 l-8 6 M14 32 l6 -3 M34 32 l-6 -3" stroke={b.mark} strokeWidth="2" />}
          <rect x="22.5" y="14" width="3" height="22" rx="1.5" fill={b.body} />
          <path d="M23 14 C21 9 19 8 17 8 M25 14 C27 9 29 8 31 8" stroke={b.body} strokeWidth="1.2" fill="none" />
        </>
      );
    case 'beetle':
      return (
        <>
          <path d="M14 22 l-6 -4 M14 30 l-7 0 M16 37 l-5 5 M34 22 l6 -4 M34 30 l7 0 M32 37 l5 5" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
          <ellipse cx="24" cy="29" rx="11" ry="14" fill={b.body} stroke={INK} strokeOpacity=".4" />
          <circle cx="24" cy="13" r="5" fill={INK} />
          <path d="M24 16 V43" stroke={INK} strokeOpacity=".5" strokeWidth="1.2" />
          {id === 'ladybug' &&
            [
              [19, 24],
              [29, 24],
              [18, 33],
              [30, 33],
              [24, 38],
            ].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" fill={b.mark} />)}
          {id === 'beetle' && <path d="M24 9 C24 4 22 2 19 2 M22 5 l-3 1" stroke={b.body} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
          {id === 'stagbeetle' && <path d="M21 9 C17 6 16 3 18 1 M27 9 C31 6 32 3 30 1" stroke={b.body} strokeWidth="2.4" fill="none" strokeLinecap="round" />}
        </>
      );
    case 'bee':
      return (
        <>
          <ellipse cx="17" cy="17" rx="7" ry="5" fill={b.wing} stroke={INK} strokeOpacity=".3" transform="rotate(-25 17 17)" />
          <ellipse cx="30" cy="16" rx="7" ry="5" fill={b.wing} stroke={INK} strokeOpacity=".3" transform="rotate(25 30 16)" />
          <ellipse cx="24" cy="29" rx="13" ry="10" fill={b.body} stroke={INK} strokeOpacity=".4" />
          <path d="M18 20 V38 M24 19 V39 M30 20 V38" stroke={b.mark} strokeWidth="2.6" />
          {eye(13, 27)}
        </>
      );
    case 'dragonfly':
      return (
        <>
          <ellipse cx="14" cy="16" rx="10" ry="3.2" fill={b.wing} stroke={INK} strokeOpacity=".3" transform="rotate(-12 14 16)" />
          <ellipse cx="34" cy="16" rx="10" ry="3.2" fill={b.wing} stroke={INK} strokeOpacity=".3" transform="rotate(12 34 16)" />
          <ellipse cx="14" cy="23" rx="9" ry="3" fill={b.wing} stroke={INK} strokeOpacity=".3" transform="rotate(10 14 23)" />
          <ellipse cx="34" cy="23" rx="9" ry="3" fill={b.wing} stroke={INK} strokeOpacity=".3" transform="rotate(-10 34 23)" />
          <rect x="22" y="12" width="4" height="33" rx="2" fill={b.body} />
          <circle cx="24" cy="10" r="4" fill={b.body} />
        </>
      );
    case 'cicada':
      return (
        <>
          <path d="M24 14 C12 16 8 34 12 42 C18 40 22 30 24 20Z M24 14 C36 16 40 34 36 42 C30 40 26 30 24 20Z" fill={b.wing} stroke={INK} strokeOpacity=".35" />
          <ellipse cx="24" cy="24" rx="6" ry="12" fill={b.body} />
          <circle cx="20" cy="12" r="2.4" fill={INK} />
          <circle cx="28" cy="12" r="2.4" fill={INK} />
        </>
      );
    case 'hopper':
      return (
        <>
          <path d="M8 30 C14 22 30 18 40 22 C42 26 36 30 26 32 C18 34 10 34 8 30Z" fill={b.body} stroke={INK} strokeOpacity=".4" />
          <path d="M26 30 L34 16 L42 36 M18 32 l-3 9 M24 32 l1 9" stroke={b.body} strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M10 27 C6 20 4 14 6 10 M11 26 C9 18 10 12 13 9" stroke={b.body} strokeWidth="1.2" fill="none" />
          {eye(12, 27)}
        </>
      );
    case 'mantis':
      return (
        <>
          <path d="M26 44 C24 34 24 26 26 18" stroke={b.body} strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M26 22 L16 14 L14 22 M26 24 L18 20 L17 27" stroke={b.body} strokeWidth="2.4" fill="none" strokeLinejoin="round" />
          <path d="M26 18 l-3 -7 l7 2 z" fill={b.body} />
          <path d="M25 34 l-8 8 M27 34 l8 8" stroke={b.body} strokeWidth="1.8" />
        </>
      );
    case 'snail':
      return (
        <>
          <path d="M4 40 C10 36 30 36 44 40 C44 43 6 44 4 40Z" fill={b.body} stroke={INK} strokeOpacity=".35" />
          <path d="M40 38 C42 32 42 26 40 20 M42 38 C45 32 46 26 46 22" stroke={b.body} strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="22" cy="26" r="13" fill={b.mark} stroke={INK} strokeOpacity=".35" />
          <path d="M22 26 m-8 0 a8 8 0 1 1 8 8 a5 5 0 1 1 -5 -5 a2.5 2.5 0 1 1 2.5 2.5" stroke="#f3dcb5" strokeWidth="1.8" fill="none" />
        </>
      );
    case 'firefly':
      return (
        <>
          <circle cx="24" cy="34" r="11" fill={b.wing} opacity=".45" />
          <ellipse cx="24" cy="22" rx="7" ry="11" fill={b.body} />
          <ellipse cx="24" cy="31" rx="5" ry="4" fill={b.wing} />
          <path d="M20 12 C18 7 16 6 14 6 M28 12 C30 7 32 6 34 6" stroke={b.body} strokeWidth="1.3" fill="none" />
        </>
      );
    default:
      return (
        <>
          <ellipse cx="16" cy="20" rx="9" ry="4" fill={b.wing} stroke={INK} strokeOpacity=".3" transform="rotate(-30 16 20)" />
          <ellipse cx="32" cy="20" rx="9" ry="4" fill={b.wing} stroke={INK} strokeOpacity=".3" transform="rotate(30 32 20)" />
          <ellipse cx="24" cy="28" rx="5" ry="10" fill={b.body} />
          <path d="M20 32 l-8 6 M28 32 l8 6 M20 28 l-9 1 M28 28 l9 1" stroke={b.body} strokeWidth="1.4" />
        </>
      );
  }
}

/* ------------------------------------------------------------ forage */
const flower = (petal: string, center: string, n = 5, r = 9) => (
  <>
    <path d="M24 30 V46" stroke="#4f8a3c" strokeWidth="2.5" />
    <path d="M24 40 C18 36 14 38 12 40 C16 42 20 42 24 40Z" fill="#6aa84f" />
    {Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return (
        <ellipse
          key={i}
          cx={24 + Math.cos(a) * r * 0.9}
          cy={19 + Math.sin(a) * r * 0.9}
          rx={r * 0.62}
          ry={r * 0.42}
          fill={petal}
          stroke={INK}
          strokeOpacity=".2"
          transform={`rotate(${(a * 180) / Math.PI} ${24 + Math.cos(a) * r * 0.9} ${19 + Math.sin(a) * r * 0.9})`}
        />
      );
    })}
    <circle cx="24" cy="19" r={r * 0.42} fill={center} />
  </>
);
const leafy = (a: string, b: string) => (
  <>
    <path d="M24 44 C12 38 6 24 12 12 C20 20 24 32 24 44Z" fill={a} />
    <path d="M24 44 C36 38 42 24 36 12 C28 20 24 32 24 44Z" fill={b} />
    <path d="M24 44 C22 30 22 18 24 6 C26 18 26 30 24 44Z" fill={a} />
  </>
);
const nut = (body: string, cap: string, round = false) => (
  <>
    <path d={round ? 'M8 26 C8 14 40 14 40 26 C40 38 30 44 24 44 C18 44 8 38 8 26Z' : 'M12 22 C12 34 18 44 24 44 C30 44 36 34 36 22Z'} fill={body} stroke={INK} strokeOpacity=".35" />
    {round ? (
      <path d="M8 26 C8 20 40 20 40 26 C36 24 12 24 8 26Z" fill={cap} />
    ) : (
      <path d="M10 22 C10 12 38 12 38 22 C34 24 14 24 10 22Z M24 12 V7" fill={cap} stroke={cap} strokeWidth="2" />
    )}
    <ellipse cx="18" cy="30" rx="2.5" ry="5" fill="#fff" opacity=".25" />
  </>
);
const FORAGE_ART: Record<string, ReactNode> = {
  wood: (
    <>
      <path d="M6 38 L40 12" stroke="#8a5a34" strokeWidth="6" strokeLinecap="round" />
      <path d="M22 26 L30 32 M30 19 L28 10" stroke="#8a5a34" strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="30" cy="33" rx="4" ry="2.5" fill="#6aa84f" />
    </>
  ),
  stone: (
    <>
      <path d="M8 34 C6 24 16 14 26 14 C36 14 42 22 40 32 C38 40 12 42 8 34Z" fill="#a3a6a0" stroke="#6f726b" strokeWidth="1.5" />
      <path d="M16 22 C20 19 24 18 28 19" stroke="#d6d8d2" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  pinecone: (
    <>
      <ellipse cx="24" cy="26" rx="11" ry="16" fill="#9a6538" stroke="#6b4222" strokeWidth="1.5" />
      <path d="M14 20 L24 26 L34 20 M13 28 L24 34 L35 28 M16 36 L24 40 L32 36 M16 14 L24 18 L32 14" stroke="#6b4222" strokeWidth="1.5" fill="none" />
    </>
  ),
  shell: (
    <>
      <path d="M24 42 L6 20 C12 8 36 8 42 20 Z" fill="#f4d9c6" stroke="#c99b83" strokeWidth="1.5" />
      <path d="M24 42 L12 14 M24 42 L20 11 M24 42 L28 11 M24 42 L36 14" stroke="#d9ad93" strokeWidth="1.5" />
    </>
  ),
  wildflower: flower('#f8d648', '#e08a2b'),
  azalea: flower('#f28bb5', '#c2437a'),
  sunflower: flower('#f5c518', '#6b4222', 10, 10),
  cosmos: flower('#f7a8c9', '#f5d34b', 8, 9),
  camellia: flower('#d8313f', '#f5d34b', 6, 9),
  mugwort: leafy('#6f9a5b', '#8ab874'),
  shepherd: leafy('#7ea45a', '#9cc271'),
  wildgarlic: (
    <>
      <path d="M20 44 C18 30 14 18 10 6 M24 44 C24 30 24 16 26 4 M28 44 C30 32 34 20 40 10" stroke="#5f9a47" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="24" cy="40" rx="8" ry="6" fill="#f3efe0" stroke="#c9c3a8" />
    </>
  ),
  raspberry: (
    <>
      {[
        [18, 24],
        [26, 22],
        [22, 31],
        [30, 30],
        [16, 33],
        [26, 38],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="5.5" fill="#d93a4b" stroke="#9e1f30" strokeWidth="1" />
      ))}
      <path d="M22 16 l-6 -6 M22 16 l6 -7 M22 16 v-8" stroke="#4f8a3c" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  mushroom: (
    <>
      <path d="M18 26 h12 l2 18 h-16z" fill="#f4ead6" stroke="#c9b894" />
      <path d="M4 28 C4 12 44 12 44 28 Z" fill="#d9413a" stroke="#9e2a24" strokeWidth="1.5" />
      <circle cx="16" cy="20" r="2.5" fill="#fff" />
      <circle cx="28" cy="17" r="2" fill="#fff" />
      <circle cx="36" cy="23" r="2" fill="#fff" />
    </>
  ),
  acorn: nut('#b27a3e', '#6f4a26'),
  chestnut: nut('#8a4f2a', '#d9b98a', true),
  ginseng: (
    <>
      <path d="M24 16 C18 24 18 32 14 44 M24 16 C28 26 30 34 34 44 M22 30 C18 32 12 34 8 36" stroke="#e3c79a" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M24 16 L24 6 M24 10 L16 4 M24 10 L32 4" stroke="#4f8a3c" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="4" r="2.5" fill="#d9413a" />
    </>
  ),
  icicle: (
    <>
      <path d="M8 8 h32 l-4 4 -3 26 -3 -24 -3 18 -3 -18 -3 30 -3 -30 -3 16 -3 -18z" fill="#cfeaf6" stroke="#8fc3da" strokeWidth="1.3" strokeLinejoin="round" />
    </>
  ),
};

/* ------------------------------------------------------------ dishes */
type DishLook = { shape: 'bowl' | 'plate' | 'jar' | 'box' | 'cup' | 'pot' | 'cob' | 'pie'; food: string; bits?: string };
const DISH_LOOK: Record<string, DishLook> = {
  salad: { shape: 'bowl', food: '#7dbb5d', bits: '#e0432f' },
  pumpkinsoup: { shape: 'bowl', food: '#ee9a3c' },
  lunchbox: { shape: 'box', food: '#f7f1e2', bits: '#f28c28' },
  grilledfish: { shape: 'plate', food: '#c98a4a', bits: '#8a5a34' },
  maeuntang: { shape: 'pot', food: '#d9492f', bits: '#7dbb5d' },
  jam: { shape: 'jar', food: '#d63447' },
  buttercorn: { shape: 'cob', food: '#f3cc3c' },
  hwachae: { shape: 'bowl', food: '#f7a8b8', bits: '#e0432f' },
  mattang: { shape: 'plate', food: '#e0923a', bits: '#b24a6a' },
  kimchi: { shape: 'plate', food: '#e0633a', bits: '#f3e1a0' },
  mushroomhotpot: { shape: 'pot', food: '#a8784a', bits: '#f4ead6' },
  ssukddeok: { shape: 'plate', food: '#7ea45a', bits: '#9cc271' },
  bibimbap: { shape: 'bowl', food: '#f5efe0', bits: '#f28c28' },
  dotorimuk: { shape: 'plate', food: '#7a5534', bits: '#9a6f48' },
  roastchestnut: { shape: 'plate', food: '#8a4f2a', bits: '#e3c79a' },
  spinachnamul: { shape: 'plate', food: '#4f8a3c', bits: '#7dbb5d' },
  gamjajeon: { shape: 'plate', food: '#e8c46a', bits: '#c99a3c' },
  pumpkinpie: { shape: 'pie', food: '#ee8a2c' },
  songpyeon: { shape: 'plate', food: '#f4f1e6', bits: '#9cc271' },
  tteokguk: { shape: 'bowl', food: '#f4f1e6', bits: '#f3cc3c' },
  fishstew: { shape: 'pot', food: '#e0562f', bits: '#e8b6a8' },
  flowertea: { shape: 'cup', food: '#f3c677', bits: '#f28bb5' },
};
function dishArt(id: string): ReactNode {
  const d = DISH_LOOK[id];
  if (!d) return null;
  const bits = d.bits
    ? [
        [17, 22],
        [25, 19],
        [31, 23],
        [21, 26],
      ].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.4" fill={d.bits} />)
    : null;
  switch (d.shape) {
    case 'bowl':
      return (
        <>
          <ellipse cx="24" cy="22" rx="17" ry="6" fill={d.food} />
          {bits}
          <path d="M6 22 C8 36 16 42 24 42 C32 42 40 36 42 22 Z" fill="#f6efe2" stroke="#b9a88a" strokeWidth="1.5" />
          <path d="M10 30 h28" stroke="#6f9ab8" strokeWidth="2" opacity=".6" />
          <path d="M20 12 C18 8 22 6 20 3 M28 12 C26 8 30 6 28 3" stroke="#c7c1b6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      );
    case 'pot':
      return (
        <>
          <path d="M8 20 h32 v14 C40 40 34 42 24 42 C14 42 8 40 8 34Z" fill="#5a4a3e" stroke="#2f261f" strokeWidth="1.5" />
          <ellipse cx="24" cy="20" rx="16" ry="5" fill={d.food} />
          {bits}
          <path d="M8 24 h-4 M40 24 h4" stroke="#2f261f" strokeWidth="3" strokeLinecap="round" />
          <path d="M18 12 C16 8 20 6 18 3 M28 12 C26 8 30 6 28 3" stroke="#c7c1b6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      );
    case 'jar':
      return (
        <>
          <rect x="12" y="14" width="24" height="28" rx="6" fill={d.food} stroke="#8e1f2c" strokeWidth="1.5" />
          <rect x="11" y="8" width="26" height="8" rx="2" fill="#f2e6c8" stroke="#b9a88a" />
          <rect x="16" y="24" width="16" height="10" rx="2" fill="#fff7e8" />
        </>
      );
    case 'box':
      return (
        <>
          <rect x="6" y="12" width="36" height="26" rx="4" fill="#3d6a8f" stroke="#274a66" strokeWidth="1.5" />
          <rect x="9" y="15" width="16" height="20" rx="2" fill={d.food} />
          <rect x="27" y="15" width="12" height="9" rx="2" fill="#7dbb5d" />
          <rect x="27" y="26" width="12" height="9" rx="2" fill={d.bits} />
        </>
      );
    case 'cup':
      return (
        <>
          <path d="M10 18 h26 v12 C36 38 30 42 23 42 C16 42 10 38 10 30Z" fill="#f6efe2" stroke="#b9a88a" strokeWidth="1.5" />
          <path d="M36 22 C44 22 44 32 36 32" stroke="#b9a88a" strokeWidth="2.5" fill="none" />
          <ellipse cx="23" cy="18" rx="13" ry="3.5" fill={d.food} />
          <circle cx="20" cy="18" r="2" fill={d.bits} />
          <path d="M20 12 C18 8 22 6 20 3" stroke="#c7c1b6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      );
    case 'cob':
      return (
        <>
          <ellipse cx="24" cy="24" rx="9" ry="17" fill={d.food} stroke="#c99a18" strokeWidth="1.5" transform="rotate(35 24 24)" />
          <path d="M14 16 l18 14 M12 22 l18 14 M17 11 l18 14" stroke="#e8a92a" strokeWidth="1.2" />
          <path d="M22 18 l8 6" stroke="#fff6c8" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        </>
      );
    case 'pie':
      return (
        <>
          <path d="M6 34 L24 10 L42 34 Z" fill={d.food} stroke="#b85f14" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M6 34 h36 v5 h-36z" fill="#e3b77a" stroke="#b9884a" />
          <circle cx="24" cy="26" r="3" fill="#fff7e8" />
        </>
      );
    default:
      return (
        <>
          <ellipse cx="24" cy="32" rx="20" ry="8" fill="#f6efe2" stroke="#b9a88a" strokeWidth="1.5" />
          <ellipse cx="24" cy="30" rx="12" ry="7" fill={d.food} />
          {bits}
        </>
      );
  }
}

/* ------------------------------------------------------------ tools */
const TOOL_ART: Record<string, ReactNode> = {
  can: (
    <>
      <path d="M12 18 h20 v20 C32 42 12 42 12 38Z" fill="#7aa9c8" stroke="#4d7f9f" strokeWidth="1.5" />
      <path d="M32 24 L44 14 l2 3 -12 12" fill="#7aa9c8" stroke="#4d7f9f" strokeWidth="1.5" />
      <path d="M14 18 C14 8 30 8 30 18" stroke="#4d7f9f" strokeWidth="3" fill="none" />
      <path d="M44 20 l2 3 M42 23 l1 4 M46 17 l3 1" stroke="#8fd0f0" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  rod: (
    <>
      <path d="M8 42 L38 6" stroke="#8a5a34" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 6 C44 14 44 26 40 32" stroke="#6f726b" strokeWidth="1" fill="none" />
      <circle cx="40" cy="34" r="3" fill="#e0432f" stroke="#fff" strokeWidth="1" />
      <circle cx="14" cy="35" r="4" fill="#3d2f25" />
    </>
  ),
  fertilizer: (
    <>
      <path d="M12 12 h24 l4 30 h-32z" fill="#8aa35a" stroke="#5c7336" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 12 l4 -5 h16 l4 5" fill="#a9c07a" stroke="#5c7336" strokeWidth="1.5" />
      <path d="M24 22 C18 26 18 34 24 36 C30 34 30 26 24 22Z" fill="#e8f2d0" />
    </>
  ),
  'fertilizer-deluxe': (
    <>
      <path d="M12 12 h24 l4 30 h-32z" fill="#8a6fb8" stroke="#5a4488" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 12 l4 -5 h16 l4 5" fill="#a891d0" stroke="#5a4488" strokeWidth="1.5" />
      <path d="M24 21 l3 6 7 1 -5 4 1 7 -6 -3 -6 3 1 -7 -5 -4 7 -1z" fill="#fff1a8" />
    </>
  ),
  bait: (
    <>
      <path d="M8 32 C12 22 18 38 24 28 S34 20 40 26" stroke="#e58ba0" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M14 30 v4 M20 30 v4 M26 25 v4 M32 24 v4" stroke="#c9667e" strokeWidth="1.2" />
      <circle cx="40" cy="25" r="1.3" fill={INK} />
    </>
  ),
};

/** The painted icon for any life item id (crops, 'seed-*', fish, bugs, forage, dishes, tools). */
export function itemArt(id: string): ReactNode {
  if (id.startsWith('seed-')) {
    const crop = CROP_ART[id.slice(5)];
    return (
      <>
        <path d="M8 6 h32 v36 h-32z" fill="#f2e3c2" stroke="#b9956a" strokeWidth="1.5" />
        <path d="M8 6 h32 v6 h-32z" fill="#c9a36a" />
        <g transform="translate(12 13) scale(.5)">{crop}</g>
        <path d="M13 40 h22" stroke="#b9956a" strokeWidth="1.5" strokeDasharray="2 2" />
      </>
    );
  }
  return CROP_ART[id] ?? fishArt(id) ?? bugArt(id) ?? FORAGE_ART[id] ?? dishArt(id) ?? TOOL_ART[id] ?? null;
}

/* ------------------------------------------------------------ growth stages */
type Leaf = 'feather' | 'vine' | 'rosette' | 'stalk' | 'bush';
const CROP_LEAF: Record<string, { leaf: Leaf; tone: string; dark: string; hint: string }> = {
  carrot: { leaf: 'feather', tone: '#6fae4f', dark: '#4f8a3a', hint: '#f28c28' },
  tomato: { leaf: 'vine', tone: '#5f9e48', dark: '#3f7a34', hint: '#9bc45a' },
  pumpkin: { leaf: 'vine', tone: '#6aa54c', dark: '#4a8238', hint: '#f5c542' },
  strawberry: { leaf: 'rosette', tone: '#4f9444', dark: '#357a35', hint: '#fff6d8' },
  potato: { leaf: 'bush', tone: '#6aa54c', dark: '#4a8238', hint: '#f3eefc' },
  spinach: { leaf: 'rosette', tone: '#3f8a3c', dark: '#2f6e2e', hint: '#57a64c' },
  corn: { leaf: 'stalk', tone: '#7dbb5d', dark: '#5a9a45', hint: '#e8c65a' },
  watermelon: { leaf: 'vine', tone: '#5a9a45', dark: '#3f7a34', hint: '#4f8f3c' },
  sweetpotato: { leaf: 'vine', tone: '#6a9e4a', dark: '#6b4a7a', hint: '#b0587a' },
  cabbage: { leaf: 'rosette', tone: '#8cc063', dark: '#5f9a48', hint: '#cfe7a8' },
};
function leaves(kind: Leaf, tone: string, dark: string, grow: number) {
  const s = 0.55 + grow * 0.45;
  const t = `translate(24 42) scale(${s}) translate(-24 -42)`;
  switch (kind) {
    case 'feather':
      return (
        <g transform={t} fill="none" strokeLinecap="round">
          <path d="M24 42 C22 30 16 24 12 18 M24 42 C24 28 24 20 24 10 M24 42 C26 30 32 24 36 18" stroke={dark} strokeWidth="2.4" />
          <path d="M14 22 l-3 -1 M13 19 l-3 1 M34 22 l3 -1 M35 19 l3 1 M22 16 l-3 -1 M26 16 l3 -1 M22 12 l-2 -2 M26 12 l2 -2" stroke={tone} strokeWidth="2.2" />
        </g>
      );
    case 'stalk':
      return (
        <g transform={t}>
          <path d="M24 42 V8" stroke={dark} strokeWidth="3" strokeLinecap="round" />
          <path d="M24 34 C16 32 10 26 8 20 C16 22 22 26 24 32Z M24 26 C32 24 38 18 40 12 C32 14 26 18 24 24Z M24 18 C18 16 14 12 13 7 C19 9 23 12 24 16Z" fill={tone} />
        </g>
      );
    case 'rosette':
      return (
        <g transform={t}>
          <path d="M24 42 C12 42 6 34 8 26 C16 28 22 34 24 42Z" fill={dark} />
          <path d="M24 42 C36 42 42 34 40 26 C32 28 26 34 24 42Z" fill={dark} />
          <path d="M24 42 C16 34 16 22 22 14 C28 22 30 34 24 42Z" fill={tone} />
          <path d="M24 42 C20 36 12 34 10 30 M24 42 C28 36 36 34 38 30" stroke="#dbeec8" strokeWidth="1" fill="none" opacity=".6" />
        </g>
      );
    case 'bush':
      return (
        <g transform={t}>
          <circle cx="17" cy="32" r="8" fill={dark} />
          <circle cx="31" cy="32" r="8" fill={dark} />
          <circle cx="24" cy="24" r="10" fill={tone} />
          <path d="M24 42 V30" stroke={dark} strokeWidth="2.4" />
        </g>
      );
    default:
      return (
        <g transform={t}>
          <path d="M24 42 C20 34 26 28 22 20 C20 16 24 12 28 12" stroke={dark} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M22 30 C12 32 8 24 10 18 C18 18 22 24 22 30Z" fill={tone} />
          <path d="M24 22 C34 24 40 18 38 12 C30 12 25 16 24 22Z" fill={tone} />
          <path d="M23 36 C31 38 36 34 36 28 C30 28 25 31 23 36Z" fill={dark} />
        </g>
      );
  }
}
/**
 * Growth art for a crop at a stage (0 seed, 1 sprout, 2 growing, 3 ripe):
 * each crop keeps its own leaf shape, stage 2 shows what is coming (a green
 * tomato, a strawberry flower, a corn tassel…) and stage 3 the produce.
 */
export function CropStageArt({ crop, stage, size = 40 }: { crop: string; stage: number; size?: number }) {
  const look = CROP_LEAF[crop] ?? CROP_LEAF.carrot;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className="l-stage-art" data-stage={stage}>
      {stage <= 0 ? (
        <>
          <ellipse cx="24" cy="40" rx="11" ry="4" fill="#6a452b" />
          <ellipse cx="21" cy="37.5" rx="2.2" ry="1.4" fill="#e7cf97" />
          <ellipse cx="27" cy="38.5" rx="1.8" ry="1.2" fill="#e7cf97" />
          <path d="M24 37 v-3" stroke={look.tone} strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : stage === 1 ? (
        <>
          <path d="M24 42 V30" stroke={look.dark} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M24 32 C18 32 14 28 14 24 C20 24 24 27 24 32Z" fill={look.tone} />
          <path d="M24 32 C30 32 34 28 34 24 C28 24 24 27 24 32Z" fill={look.tone} />
        </>
      ) : stage === 2 ? (
        <>
          {leaves(look.leaf, look.tone, look.dark, 0.6)}
          {crop === 'strawberry' || crop === 'potato' ? (
            <g fill={look.hint}>
              <circle cx="16" cy="26" r="2.6" />
              <circle cx="31" cy="23" r="2.4" />
              <circle cx="16" cy="26" r="0.9" fill="#f2c14e" />
              <circle cx="31" cy="23" r="0.9" fill="#f2c14e" />
            </g>
          ) : crop === 'corn' ? (
            <path d="M24 10 l-3 -5 M24 10 l0 -6 M24 10 l3 -5" stroke={look.hint} strokeWidth="1.8" strokeLinecap="round" />
          ) : crop === 'carrot' ? (
            <path d="M20 42 Q24 38 28 42Z" fill={look.hint} />
          ) : (
            <circle cx="30" cy="31" r="3.4" fill={look.hint} />
          )}
        </>
      ) : (
        <>
          {leaves(look.leaf, look.tone, look.dark, 1)}
          <g transform="translate(11 13) scale(.54)">{itemArt(crop)}</g>
        </>
      )}
    </svg>
  );
}

/** A 48×48 item icon (default 32px), with optional quality star and count. */
export function ItemIcon({
  id,
  size = 32,
  quality,
  count,
  title,
  className = '',
}: {
  id: string;
  size?: number;
  quality?: Quality;
  count?: number;
  title?: string;
  className?: string;
}) {
  const furn = id.startsWith('furn-') ? FURNITURE_ART[id] : undefined;
  return (
    <span className={`l-item-icon ${className}`} style={{ width: size, height: size }} title={title} aria-hidden={title ? undefined : true}>
      {furn ? (
        // oxlint-disable-next-line nextjs/no-img-element -- Inline SVG furniture art.
        <img src={furn} alt="" draggable={false} />
      ) : (
        <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
          {itemArt(id) ?? <circle cx="24" cy="24" r="14" fill="#d9cdb5" />}
        </svg>
      )}
      {quality ? <QualityStar quality={quality} /> : null}
      {count !== undefined && count > 1 ? <b className="l-item-count">{count > 999 ? '999+' : count}</b> : null}
    </span>
  );
}

/** Silver / gold quality star (vector). */
export function QualityStar({ quality, size = 13 }: { quality: Quality; size?: number }) {
  if (!quality) return null;
  const fill = quality === 2 ? '#f3c332' : '#c9d2dc';
  const stroke = quality === 2 ? '#a87a12' : '#7f8a96';
  return (
    <svg className="l-q-star" data-quality={quality} viewBox="0 0 20 20" width={size} height={size} aria-label={quality === 2 ? '금별' : '은별'} role="img">
      <path d="M10 1.5 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.8z" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
