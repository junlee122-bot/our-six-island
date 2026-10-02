'use client';
// Small vector icons for every life item (crops, seeds, fish, bugs, forage,
// dishes, tools) so no emoji is used as an icon. Shapes are simple painted
// silhouettes in one 48×48 box; colour comes from the item. Furniture uses its
// room art (lounge-furniture-art.ts).
import type { ReactNode } from 'react';
import { FURNITURE_ART } from '../lounge-furniture-art';
import { THUMBNAILS } from '../lounge-bedroom-art';
import { FURNITURE_BY_REF } from '../lounge-items';
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
  garlic: (
    <>
      <path d="M24 12 C14 18 10 28 14 36 C18 44 30 44 34 36 C38 28 34 18 24 12Z" fill="#f4eee0" stroke="#b9ab8a" strokeWidth="1.5" />
      <path d="M24 14 C20 24 20 34 24 42 M24 14 C28 24 28 34 24 42" stroke="#d6c9a8" strokeWidth="1.3" fill="none" />
      <path d="M24 12 C24 8 23 5 21 3" stroke="#8aa35a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 42 l-2 3 M24 43 v3 M30 42 l2 3" stroke="#b9ab8a" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  pea: (
    <>
      <path d="M8 30 C12 18 30 12 42 16 C40 28 24 36 8 30Z" fill="#7cc05a" stroke="#4f8a3a" strokeWidth="1.5" />
      <circle cx="17" cy="26" r="3.6" fill="#a6dc7a" />
      <circle cx="25" cy="23" r="3.6" fill="#a6dc7a" />
      <circle cx="33" cy="20" r="3.4" fill="#a6dc7a" />
      <path d="M42 16 C44 12 42 8 38 8" stroke="#4f8a3a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  lettuce: (
    <>
      <path d="M24 42 C10 42 6 30 10 22 C14 14 20 18 24 12 C28 18 34 14 38 22 C42 30 38 42 24 42Z" fill="#9fd36e" stroke="#5f9a48" strokeWidth="1.5" />
      <path d="M24 42 C18 34 18 26 24 18 C30 26 30 34 24 42Z" fill="#c8ec9c" />
      <path d="M24 40 V22" stroke="#e8f6d4" strokeWidth="1.4" />
    </>
  ),
  tulip: (
    <>
      <path d="M24 44 V24" stroke="#4f8a3a" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M24 38 C16 36 12 30 12 24 C18 26 22 30 24 36Z" fill="#5f9e48" />
      <path d="M14 10 L18 16 L24 8 L30 16 L34 10 C36 22 32 28 24 28 C16 28 12 22 14 10Z" fill="#e8546e" stroke="#a82a44" strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  onion: (
    <>
      <path d="M24 12 C12 18 8 30 14 38 C18 43 30 43 34 38 C40 30 36 18 24 12Z" fill="#d9a060" stroke="#9a6a34" strokeWidth="1.5" />
      <path d="M24 14 C18 22 18 34 22 42 M24 14 C30 22 30 34 26 42" stroke="#b9834a" strokeWidth="1.2" fill="none" />
      <path d="M24 12 V4" stroke="#8aa35a" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  pepper: (
    <>
      <path d="M20 12 C28 12 34 18 32 28 C30 36 22 42 12 44 C18 36 18 24 20 12Z" fill="#d8352a" stroke="#9a2018" strokeWidth="1.5" />
      <path d="M22 18 C24 22 24 28 22 34" stroke="#f08a80" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M20 12 C20 8 23 5 27 5 M18 12 h8" stroke="#3f8a34" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  ),
  cucumber: (
    <>
      <path d="M10 36 C8 30 14 20 26 14 C34 10 40 12 40 16 C40 22 32 32 22 38 C16 41 11 40 10 36Z" fill="#4f9a3c" stroke="#2f6a2a" strokeWidth="1.5" />
      <circle cx="20" cy="30" r="1" fill="#c8ec9c" />
      <circle cx="27" cy="24" r="1" fill="#c8ec9c" />
      <circle cx="33" cy="19" r="1" fill="#c8ec9c" />
      <path d="M40 15 l4 -3" stroke="#6a8a3a" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  blueberry: (
    <>
      <circle cx="17" cy="28" r="9" fill="#4a5fa8" stroke="#2f3f7a" strokeWidth="1.5" />
      <circle cx="31" cy="30" r="9" fill="#5a6fba" stroke="#2f3f7a" strokeWidth="1.5" />
      <circle cx="24" cy="18" r="8" fill="#51669f" stroke="#2f3f7a" strokeWidth="1.5" />
      <path d="M22 15 l2 2 2 -2 M15 25 l2 2 2 -2 M29 27 l2 2 2 -2" stroke="#1f2a55" strokeWidth="1.2" fill="none" />
    </>
  ),
  chamoe: (
    <>
      <ellipse cx="24" cy="27" rx="18" ry="13" fill="#f2c230" stroke="#b88a10" strokeWidth="1.5" />
      <path d="M8 27 h32 M10 21 C18 23 30 23 38 21 M10 33 C18 31 30 31 38 33" stroke="#fff3c0" strokeWidth="1.8" fill="none" />
      <path d="M24 14 C24 10 26 8 29 7" stroke="#6a8a3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  ),
  zinnia: (
    <>
      <path d="M24 44 V30" stroke="#4f8a3a" strokeWidth="2.6" />
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
        <ellipse key={a} cx="24" cy="10" rx="4.2" ry="6.5" fill="#e0506a" stroke="#a82a44" strokeWidth="1" transform={`rotate(${a} 24 19)`} />
      ))}
      {[20, 100, 180, 260, 340].map((a) => (
        <ellipse key={a} cx="24" cy="13" rx="3" ry="4.5" fill="#f07888" transform={`rotate(${a} 24 19)`} />
      ))}
      <circle cx="24" cy="19" r="4" fill="#f5c52a" stroke="#b8861a" strokeWidth="1" />
    </>
  ),
  grape: (
    <>
      {[
        [18, 18],
        [26, 18],
        [34, 18],
        [22, 25],
        [30, 25],
        [18, 32],
        [26, 32],
        [22, 39],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4.6" fill="#7a3f96" stroke="#4f2266" strokeWidth="1.2" />
      ))}
      <path d="M26 13 C26 9 28 6 32 5" stroke="#6b4a2b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M28 9 C34 4 40 8 40 11 C34 12 30 12 28 9Z" fill="#5f9e48" />
    </>
  ),
  radish: (
    <>
      <path d="M14 16 C14 30 18 40 24 44 C30 40 34 30 34 16Z" fill="#f6f2e8" stroke="#b8b09a" strokeWidth="1.5" />
      <path d="M14 16 C14 22 34 22 34 16 C34 12 14 12 14 16Z" fill="#b8d88a" />
      <path d="M24 14 C18 6 14 6 12 8 M24 14 C24 4 27 2 30 4 M24 14 C30 7 34 7 36 10" stroke="#4f9a3c" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  eggplant: (
    <>
      <path d="M22 14 C32 14 38 22 36 32 C34 40 26 44 18 42 C10 40 8 32 12 26 C16 20 16 14 22 14Z" fill="#6a3a84" stroke="#43205a" strokeWidth="1.5" />
      <path d="M18 24 C16 28 16 34 18 37" stroke="#9a6ab4" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M22 14 l-5 -2 4 5 M22 14 l6 -3 -3 5 M22 14 C22 10 24 6 27 5" stroke="#3f8a34" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  ),
  chrysanthemum: (
    <>
      <path d="M24 44 V30" stroke="#4f8a3a" strokeWidth="2.6" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
        <ellipse key={a} cx="24" cy="9" rx="2.6" ry="8" fill="#f0c83c" stroke="#c8961a" strokeWidth=".8" transform={`rotate(${a} 24 19)`} />
      ))}
      <circle cx="24" cy="19" r="4" fill="#e0a020" />
    </>
  ),
  greenonion: (
    <>
      <path d="M18 44 C18 34 20 20 16 6 M24 44 C24 30 24 18 24 4 M30 44 C30 34 28 20 32 6" stroke="#4f9a3c" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M16 30 h16 v12 C32 45 16 45 16 42Z" fill="#f4f1e6" stroke="#bdb49a" strokeWidth="1.3" />
    </>
  ),
  insam: (
    <>
      <path d="M24 10 C30 14 30 22 26 28 C30 32 34 38 36 44 M26 28 C22 34 18 38 12 42 M24 10 C20 16 20 22 24 28" stroke="#d9b27a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M24 10 C22 6 20 4 16 4 M24 10 C26 5 29 3 33 4" stroke="#4f8a3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="5" r="2.2" fill="#d8352a" />
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
type FishLook = { shape: 'fish' | 'long' | 'flat' | 'round' | 'squid' | 'claw' | 'tiny' | 'octo' | 'shell'; body: string; belly?: string; mark?: string };
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
  // 낚시 업그레이드 (lounge-fish-data.ts).
  mullet: { shape: 'fish', body: '#8f9aa3', belly: '#eef1f2', mark: '#5f6a73' },
  sandfish: { shape: 'fish', body: '#a39a7c', belly: '#f1ebd8', mark: '#7a6e50' },
  filefish: { shape: 'flat', body: '#b8a07a', mark: '#6f5a3a' },
  blossomtrout: { shape: 'fish', body: '#e9a7b4', belly: '#fff0f3', mark: '#c95a78' },
  lakelord: { shape: 'fish', body: '#4a5a4f', belly: '#9fae98', mark: '#2d3a31' },
  icecod: { shape: 'fish', body: '#9fb3c4', belly: '#f2f6f9', mark: '#6a8196' },
  daseulgi: { shape: 'shell', body: '#6e6a4a', mark: '#2f2d20' },
  shrimp: { shape: 'claw', body: '#c9a88a' },
  crab: { shape: 'claw', body: '#d0602f' },
  clam: { shape: 'shell', body: '#c9b48f', mark: '#7a6546' },
  oyster: { shape: 'shell', body: '#a9a49a', mark: '#6d685e' },
  conch: { shape: 'shell', body: '#e0b890', mark: '#a8704a' },
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
    case 'shell':
      return (
        <>
          <path d="M7 35 C7 19 19 10 31 12 C42 14 45 27 39 35 Z" fill={f.body} {...stroke} />
          <path d="M13 34 C15 25 19 18 25 15 M20 35 C22 27 26 20 32 17 M28 35 C30 29 33 25 38 23" stroke={f.mark} strokeWidth="1.5" fill="none" opacity=".75" />
          <path d="M7 35 h32" stroke={INK} strokeOpacity=".35" strokeWidth="1.2" />
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
  // 성장 P1 ores (lounge-growth-data ORE_ITEMS).
  copper: (
    <>
      <path d="M7 36 C5 26 13 15 24 14 C35 13 43 22 41 32 C39 41 10 43 7 36Z" fill="#8f8a83" stroke="#5f5a52" strokeWidth="1.5" />
      <path d="M15 27 l5 -6 5 6 -5 6z M26 31 l4 -5 4 5 -4 5z M22 20 l3 -4 3 4 -3 4z" fill="#d9844a" stroke="#8a4a22" strokeWidth="1.2" />
      <path d="M17 26 l3 -3" stroke="#fff" strokeWidth="1.2" opacity=".6" />
    </>
  ),
  iron: (
    <>
      <path d="M7 36 C5 26 13 15 24 14 C35 13 43 22 41 32 C39 41 10 43 7 36Z" fill="#8f8a83" stroke="#5f5a52" strokeWidth="1.5" />
      <path d="M15 27 l5 -6 5 6 -5 6z M26 31 l4 -5 4 5 -4 5z M22 20 l3 -4 3 4 -3 4z" fill="#b8c2cc" stroke="#5d6873" strokeWidth="1.2" />
      <path d="M17 26 l3 -3" stroke="#fff" strokeWidth="1.2" opacity=".6" />
    </>
  ),
  gold: (
    <>
      <path d="M7 36 C5 26 13 15 24 14 C35 13 43 22 41 32 C39 41 10 43 7 36Z" fill="#8f8a83" stroke="#5f5a52" strokeWidth="1.5" />
      <path d="M15 27 l5 -6 5 6 -5 6z M26 31 l4 -5 4 5 -4 5z M22 20 l3 -4 3 4 -3 4z" fill="#f3c332" stroke="#a87a12" strokeWidth="1.2" />
      <path d="M17 26 l3 -3" stroke="#fff" strokeWidth="1.2" opacity=".6" />
    </>
  ),
  gem: (
    <>
      <path d="M7 36 C5 26 13 15 24 14 C35 13 43 22 41 32 C39 41 10 43 7 36Z" fill="#8f8a83" stroke="#5f5a52" strokeWidth="1.5" />
      <path d="M15 27 l5 -6 5 6 -5 6z M26 31 l4 -5 4 5 -4 5z M22 20 l3 -4 3 4 -3 4z" fill="#b07be0" stroke="#6a3d99" strokeWidth="1.2" />
      <path d="M17 26 l3 -3" stroke="#fff" strokeWidth="1.2" opacity=".6" />
    </>
  ),
  // 성장 P2 region items (lounge-growth-data REGION_ITEMS).
  hardwood: (
    <>
      <rect x="8" y="16" width="32" height="18" rx="9" fill="#7a4a2a" stroke="#4f2e18" strokeWidth="1.5" />
      <ellipse cx="36" cy="25" rx="6" ry="9" fill="#c79a66" stroke="#4f2e18" strokeWidth="1.5" />
      <ellipse cx="36" cy="25" rx="3" ry="4.5" fill="none" stroke="#8a5a34" strokeWidth="1.2" />
      <path d="M12 21 H28 M14 29 H30" stroke="#5d3820" strokeWidth="1.2" />
    </>
  ),
  songi: (
    <>
      <path d="M20 22 h8 l2 22 h-12z" fill="#efe2c8" stroke="#b9a37a" />
      <path d="M11 24 C11 12 37 12 37 24 C32 22 16 22 11 24Z" fill="#8a5a34" stroke="#5d3820" strokeWidth="1.5" />
      <path d="M22 30 v10 M26 30 v10" stroke="#d2c29f" strokeWidth="1" />
    </>
  ),
  yeongji: (
    <>
      <path d="M22 30 C22 36 20 42 18 44 h8 C26 40 26 34 26 30Z" fill="#6b3a24" />
      <path d="M6 28 C6 14 42 12 42 26 C36 32 12 34 6 28Z" fill="#9c3b22" stroke="#5c1f10" strokeWidth="1.5" />
      <path d="M10 26 C18 22 32 20 38 23" stroke="#e0a25a" strokeWidth="2" fill="none" />
    </>
  ),
  'fossil-shell': (
    <>
      <path d="M6 30 C6 16 18 8 28 10 C40 12 44 24 40 34 C36 42 10 42 6 30Z" fill="#d8c9a8" stroke="#9c8a66" strokeWidth="1.5" />
      <path d="M24 36 L12 20 C16 12 32 12 36 20 Z" fill="none" stroke="#7a6848" strokeWidth="1.6" />
      <path d="M24 36 L18 16 M24 36 L24 14 M24 36 L30 16" stroke="#7a6848" strokeWidth="1.2" />
    </>
  ),
  'fossil-leaf': (
    <>
      <path d="M6 30 C6 16 18 8 28 10 C40 12 44 24 40 34 C36 42 10 42 6 30Z" fill="#d8c9a8" stroke="#9c8a66" strokeWidth="1.5" />
      <path d="M12 34 C14 22 24 14 36 14 C34 26 26 34 12 34Z" fill="none" stroke="#6f7d4a" strokeWidth="1.6" />
      <path d="M12 34 L32 18 M20 28 l-2 -6 M26 24 l-1 -6 M20 28 l6 1" stroke="#6f7d4a" strokeWidth="1.1" />
    </>
  ),
  'fossil-fish': (
    <>
      <path d="M6 30 C6 16 18 8 28 10 C40 12 44 24 40 34 C36 42 10 42 6 30Z" fill="#d8c9a8" stroke="#9c8a66" strokeWidth="1.5" />
      <path d="M12 26 C18 18 28 18 32 26 C28 34 18 34 12 26Z M32 26 l6 -5 v10z" fill="none" stroke="#7a6848" strokeWidth="1.6" />
      <path d="M18 22 v8 M22 21 v10 M26 22 v8" stroke="#7a6848" strokeWidth="1.1" />
      <circle cx="15.5" cy="25" r="1.2" fill="#7a6848" />
    </>
  ),
  'fossil-fern': (
    <>
      <path d="M6 30 C6 16 18 8 28 10 C40 12 44 24 40 34 C36 42 10 42 6 30Z" fill="#d8c9a8" stroke="#9c8a66" strokeWidth="1.5" />
      <path d="M14 36 C18 28 24 20 34 14" stroke="#5f7442" strokeWidth="1.6" fill="none" />
      <path d="M18 31 l-4 -3 M18 31 l3 3 M22 26 l-4 -4 M22 26 l4 3 M26 21 l-3 -4 M26 21 l4 2 M30 17 l-2 -3 M30 17 l3 1" stroke="#5f7442" strokeWidth="1.2" />
    </>
  ),
  'fossil-trilobite': (
    <>
      <path d="M6 30 C6 16 18 8 28 10 C40 12 44 24 40 34 C36 42 10 42 6 30Z" fill="#d8c9a8" stroke="#9c8a66" strokeWidth="1.5" />
      <path d="M16 18 C16 12 32 12 32 18 L30 36 C28 40 20 40 18 36Z" fill="none" stroke="#6a5a44" strokeWidth="1.6" />
      <path d="M20 16 V38 M28 16 V38 M17 22 H31 M18 27 H30 M18 32 H30" stroke="#6a5a44" strokeWidth="1.1" />
    </>
  ),
  'fossil-tooth': (
    <>
      <path d="M6 30 C6 16 18 8 28 10 C40 12 44 24 40 34 C36 42 10 42 6 30Z" fill="#d8c9a8" stroke="#9c8a66" strokeWidth="1.5" />
      <path d="M16 14 C22 12 30 14 32 18 C34 26 30 34 26 38 C24 32 22 24 16 14Z" fill="#f1ead8" stroke="#7a6848" strokeWidth="1.6" />
      <path d="M22 20 l3 2 M24 25 l3 2" stroke="#b5a47f" strokeWidth="1" />
    </>
  ),
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
  sashimi: { shape: 'plate', food: '#f2a08a', bits: '#f7efe4' },
  haemuljeon: { shape: 'plate', food: '#e3b85a', bits: '#6fa04a' },
  guljeon: { shape: 'plate', food: '#efd07a', bits: '#b9b4a8' },
  kkotgetang: { shape: 'pot', food: '#d9542f', bits: '#e8a07a' },
  daseulgiguk: { shape: 'bowl', food: '#7fb0a0', bits: '#4f6a4a' },
  // 음식 시스템: lunchboxes, 이국 요리, and the 빵집 / 주점 menus (eaten on the spot).
  'bento-miner': { shape: 'box', food: '#f4f1e6', bits: '#b07a3a' },
  'bento-river': { shape: 'box', food: '#f4f1e6', bits: '#c98a4a' },
  'bento-field': { shape: 'box', food: '#f4f1e6', bits: '#6fa04a' },
  saffronrice: { shape: 'pot', food: '#f0c23a', bits: '#e0562f' },
  pepperpotato: { shape: 'plate', food: '#e3b85a', bits: '#3a2f28' },
  vanillapudding: { shape: 'cup', food: '#f7e3a8', bits: '#8a5a34' },
  milkbread: { shape: 'plate', food: '#f2dfb4', bits: '#d9b77a' },
  coffee: { shape: 'cup', food: '#6b4a32' },
  'flowertea-cup': { shape: 'cup', food: '#f3c677', bits: '#f28bb5' },
  recipepie: { shape: 'pie', food: '#d98a4a' },
  'sailor-snack': { shape: 'plate', food: '#d9a15a', bits: '#8a5a34' },
  'merchant-cup': { shape: 'cup', food: '#c9793a', bits: '#f3cc3c' },
  'captain-feast': { shape: 'pot', food: '#e0562f', bits: '#f2a08a' },
  // 행상인 향신료 (drawn as little jars).
  'spice-saffron': { shape: 'jar', food: '#d9492f' },
  'spice-pepper': { shape: 'jar', food: '#3a2f28' },
  'spice-vanilla': { shape: 'jar', food: '#6b4a32' },
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
function sprinklerArt(head: string, dark: string): ReactNode {
  return (
    <>
      <path d="M24 44 V22" stroke="#6f726b" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="24" cy="44" rx="8" ry="2.5" fill="#8a6a44" />
      <path d="M14 22 h20 l-3 -7 h-14z" fill={head} stroke={dark} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 12 q-3 -4 -1 -8 M38 12 q3 -4 1 -8 M24 10 v-6 M16 10 l-3 -5 M32 10 l3 -5" stroke="#8fd0f0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  );
}
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
  ),  'bait-dough': (
    <>
      <ellipse cx="24" cy="30" rx="15" ry="10" fill="#d9b77a" stroke="#a8844a" strokeWidth="1.5" />
      <circle cx="18" cy="28" r="2" fill="#f1dcaa" />
      <circle cx="28" cy="32" r="2.4" fill="#f1dcaa" />
      <circle cx="25" cy="25" r="1.6" fill="#b89458" />
    </>
  ),
  'bait-shrimp': (
    <>
      <path d="M10 30 C10 18 24 12 34 18 C40 22 38 32 30 34" stroke="#e8866a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M16 22 v6 M22 18 v6 M28 17 v6" stroke="#c9604a" strokeWidth="1.3" />
      <path d="M34 18 L42 10 M36 20 L45 16" stroke="#c9604a" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  'bait-glow': (
    <>
      <circle cx="24" cy="26" r="15" fill="#fff3b0" opacity=".55" />
      <ellipse cx="24" cy="26" rx="7" ry="10" fill="#e8d23a" stroke="#a8941a" strokeWidth="1.4" />
      <path d="M17 22 C10 16 10 12 14 11 M31 22 C38 16 38 12 34 11" stroke="#a8941a" strokeWidth="1.4" fill="none" />
    </>
  ),
  bouquet: (
    <>
      <path d="M17 30 L24 45 L31 30 Z" fill="#f4e3c3" stroke="#b08a5a" strokeWidth="1.4" />
      <path d="M20 36 h8" stroke="#d9573f" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="17" cy="20" r="6" fill="#ee7a96" stroke="#b84a66" strokeWidth="1.2" />
      <circle cx="31" cy="20" r="6" fill="#f6c34a" stroke="#b8902a" strokeWidth="1.2" />
      <circle cx="24" cy="13" r="6.5" fill="#e2334a" stroke="#a51f33" strokeWidth="1.2" />
      <circle cx="24" cy="25" r="5" fill="#fff6f0" stroke="#c9a08a" strokeWidth="1.2" />
      <path d="M12 27 C10 23 12 21 14 22 M36 27 C38 23 36 21 34 22" stroke="#4f9a3c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </>
  ),
  'pledge-ring': (
    <>
      <circle cx="24" cy="30" r="12" fill="none" stroke="#d9a93a" strokeWidth="4" />
      <circle cx="24" cy="30" r="12" fill="none" stroke="#f7d77a" strokeWidth="1.4" />
      <path d="M18 12 L24 6 L30 12 L24 19 Z" fill="#bfe6f5" stroke="#5b9ab8" strokeWidth="1.4" />
      <path d="M18 12 h12 M24 6 v13" stroke="#e8f7fd" strokeWidth=".9" />
    </>
  ),
  'tackle-float': (
    <>
      <path d="M24 4 v8 M24 38 v6" stroke="#4a3423" strokeWidth="1.6" />
      <ellipse cx="24" cy="25" rx="10" ry="13" fill="#fffaf0" stroke="#4a3423" strokeWidth="1.5" />
      <path d="M14 25 a10 13 0 0 0 20 0z" fill="#d9573f" />
    </>
  ),
  'tackle-trap': (
    <>
      <path d="M24 4 v10" stroke="#4a3423" strokeWidth="1.6" />
      <ellipse cx="24" cy="24" rx="8" ry="10" fill="#6f8fa3" stroke="#3d5566" strokeWidth="1.5" />
      <path d="M24 34 v4 C24 44 16 44 16 38" stroke="#5a5a52" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M18 20 l12 8 M30 20 l-12 8" stroke="#dfe8ee" strokeWidth="1.4" />
    </>
  ),
  'tackle-treasure': (
    <>
      <path d="M24 4 v8" stroke="#4a3423" strokeWidth="1.6" />
      <ellipse cx="24" cy="24" rx="9" ry="12" fill="#f3c332" stroke="#a87a12" strokeWidth="1.5" />
      <path d="M24 17 l2 4 4.5 .6 -3.3 3 .8 4.4 -4 -2.2 -4 2.2 .8 -4.4 -3.3 -3 4.5 -.6z" fill="#fff6c8" />
      <path d="M24 36 v6" stroke="#4a3423" strokeWidth="1.6" />
    </>
  ),
  crabpot: (
    <>
      <path d="M8 18 h32 l-3 22 h-26z" fill="#b58a52" stroke="#7a5530" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M13 18 l2 22 M19 18 l1 22 M25 18 v22 M31 18 l-1 22 M37 18 l-2 22 M9 26 h30 M10 33 h28" stroke="#7a5530" strokeWidth="1.1" />
      <path d="M16 18 C16 10 32 10 32 18" stroke="#6f726b" strokeWidth="2" fill="none" />
    </>
  ),
  sprinkler: sprinklerArt('#c77a3f', '#8a4a20'),
  'sprinkler-q': sprinklerArt('#a9b4be', '#5f6a74'),
  'sprinkler-s': sprinklerArt('#b99cf0', '#6a4bb0'),
  scarecrow: (
    <>
      <path d="M24 16 V46 M10 24 H38" stroke="#8a5a34" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 22 h16 l-2 14 h-12z" fill="#c95f3f" stroke="#8a3a24" strokeWidth="1.3" />
      <circle cx="24" cy="12" r="7" fill="#f2d88a" stroke="#b9956a" strokeWidth="1.3" />
      <path d="M14 8 C18 2 30 2 34 8Z" fill="#c9a36a" stroke="#8a6a3a" strokeWidth="1.2" />
      <path d="M21 12 h1 M26 12 h1 M21 15 q3 2 6 0" stroke={INK} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </>
  ),
  beehouse: (
    <>
      <path d="M10 18 L24 8 L38 18Z" fill="#9a6a3a" stroke="#6a4424" strokeWidth="1.3" strokeLinejoin="round" />
      <rect x="12" y="18" width="24" height="24" rx="2" fill="#e8c27a" stroke="#9a7a44" strokeWidth="1.3" />
      <path d="M12 26 h24 M12 34 h24" stroke="#c9a05a" strokeWidth="1.2" />
      <rect x="21" y="36" width="6" height="4" rx="1" fill="#6a4424" />
      <circle cx="38" cy="12" r="2.6" fill="#f5c52a" stroke={INK} strokeWidth=".8" />
    </>
  ),
  jar: (
    <>
      <path d="M14 14 h20 C40 20 42 30 38 38 C36 43 12 43 10 38 C6 30 8 20 14 14Z" fill="#7a4a2a" stroke="#4a2a14" strokeWidth="1.5" />
      <path d="M12 12 h24 v4 h-24z" fill="#5a3418" />
      <path d="M13 24 C20 26 28 26 35 24" stroke="#a8764a" strokeWidth="1.5" fill="none" />
    </>
  ),
  keg: (
    <>
      <path d="M12 8 h24 C40 18 40 30 36 42 h-24 C8 30 8 18 12 8Z" fill="#b9854a" stroke="#6a4424" strokeWidth="1.5" />
      <path d="M11 16 h26 M10 34 h28" stroke="#5f6a74" strokeWidth="2.5" />
      <path d="M24 8 v34" stroke="#8a5a34" strokeWidth="1" />
      <rect x="21" y="23" width="6" height="4" rx="1" fill="#5a3418" />
    </>
  ),
  dehydrator: (
    <>
      <rect x="8" y="10" width="32" height="30" rx="3" fill="#c9a36a" stroke="#6a4424" strokeWidth="1.5" />
      <path d="M12 18 h24 M12 25 h24 M12 32 h24" stroke="#8a5a34" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M16 6 q2 -3 4 0 q2 3 4 0 M26 6 q2 -3 4 0" stroke="#e8a060" strokeWidth="1.4" fill="none" />
    </>
  ),
  seedmaker: (
    <>
      <path d="M12 12 h24 l-4 14 h-16z" fill="#a9b4be" stroke="#5f6a74" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="14" y="26" width="20" height="14" rx="2" fill="#8a5a34" stroke="#4a2a14" strokeWidth="1.3" />
      <ellipse cx="20" cy="44" rx="2" ry="1.4" fill="#e7cf97" />
      <ellipse cx="26" cy="45" rx="2" ry="1.4" fill="#e7cf97" />
      <circle cx="24" cy="33" r="3" fill="#e7cf97" stroke="#b9956a" />
    </>
  ),
  'fertilizer-star': (
    <>
      <path d="M12 12 h24 l4 30 h-32z" fill="#6a4bb0" stroke="#43307a" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 12 l4 -5 h16 l4 5" fill="#8a6ad0" stroke="#43307a" strokeWidth="1.5" />
      <path d="M24 20 l3 6 7 1 -5 4 1 7 -6 -3 -6 3 1 -7 -5 -4 7 -1z" fill="#d8c8ff" />
    </>
  ),
  'speed-gro': (
    <>
      <path d="M12 12 h24 l4 30 h-32z" fill="#d88a3a" stroke="#9a5a1a" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 12 l4 -5 h16 l4 5" fill="#e8a860" stroke="#9a5a1a" strokeWidth="1.5" />
      <path d="M26 18 l-8 12 h6 l-2 10 8 -13 h-6z" fill="#fff1a8" />
    </>
  ),
  retaining: (
    <>
      <path d="M12 12 h24 l4 30 h-32z" fill="#5f7a8a" stroke="#3a4f5a" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 12 l4 -5 h16 l4 5" fill="#7a98a8" stroke="#3a4f5a" strokeWidth="1.5" />
      <path d="M24 20 C20 26 18 30 18 33 C18 37 30 37 30 33 C30 30 28 26 24 20Z" fill="#bfe8f2" />
    </>
  ),
};

/** The painted icon for any life item id (crops, 'seed-*', fish, bugs, forage, dishes, tools). */
/* ------------------------------------------------------------ 3단계: 목장·과수원 (design-npcs-stage3.md) */
const fruit = (body: string, dark: string, leaf = '#5f9e48', blush?: string) => (
  <>
    <path d="M24 12 C34 10 40 18 39 27 C38 37 31 42 24 42 C17 42 10 37 9 27 C8 18 14 10 24 12Z" fill={body} stroke={dark} strokeWidth="1.5" />
    {blush ? <ellipse cx="18" cy="24" rx="5" ry="7" fill={blush} opacity=".45" /> : null}
    <path d="M24 13 C24 9 25 7 27 5" stroke="#6b4b33" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M26 9 C30 4 36 5 37 7 C33 10 29 10 26 9Z" fill={leaf} />
    <ellipse cx="17" cy="20" rx="2.5" ry="4" fill="#ffffff" opacity=".35" />
  </>
);
const egg = (big: boolean) => (
  <>
    <path d={big ? 'M24 5 C34 5 40 21 40 30 C40 39 33 44 24 44 C15 44 8 39 8 30 C8 21 14 5 24 5Z' : 'M24 9 C32 9 37 22 37 30 C37 37 31 41 24 41 C17 41 11 37 11 30 C11 22 16 9 24 9Z'} fill="#f6ead2" stroke="#b9956a" strokeWidth="1.5" />
    <ellipse cx="19" cy="22" rx="3" ry="5" fill="#ffffff" opacity=".6" />
    {big ? <path d="M30 12 l1.5 3 3 .5 -2.2 2 .6 3 -2.9 -1.5 -2.9 1.5 .6 -3 -2.2 -2 3 -.5z" fill="#f3c332" /> : null}
  </>
);
const milk = (rich: boolean) => (
  <>
    <path d="M17 6 h14 v6 l5 7 v21 c0 2 -2 3 -4 3 h-16 c-2 0 -4 -1 -4 -3 v-21 l5 -7z" fill="#fbf8f0" stroke="#8fa3b0" strokeWidth="1.5" />
    <rect x="17" y="4" width="14" height="4" rx="1" fill={rich ? '#c98a4a' : '#5f8fb0'} />
    <path d="M13 24 h22 v10 h-22z" fill={rich ? '#f1d9a8' : '#cfe3ee'} />
    <path d="M18 29 c3 -3 9 -3 12 0" stroke={rich ? '#a8722e' : '#5f8fb0'} strokeWidth="1.5" fill="none" />
  </>
);
const STAGE3_ART: Record<string, ReactNode> = {
  egg: egg(false),
  'egg-big': egg(true),
  milk: milk(false),
  'milk-big': milk(true),
  wool: (
    <>
      <circle cx="18" cy="22" r="9" fill="#f6f2e8" stroke="#bdb39f" strokeWidth="1.5" />
      <circle cx="30" cy="20" r="9" fill="#f6f2e8" stroke="#bdb39f" strokeWidth="1.5" />
      <circle cx="24" cy="31" r="10" fill="#fbf8f0" stroke="#bdb39f" strokeWidth="1.5" />
      <path d="M16 31 c4 2 12 2 16 0" stroke="#d8cfbd" strokeWidth="1.5" fill="none" />
    </>
  ),
  apricot: fruit('#f2a43a', '#b8701e', '#5f9e48', '#e86a3a'),
  peach: fruit('#f7b8a0', '#c9786a', '#5f9e48', '#e85a6a'),
  apple: fruit('#d9402f', '#8f2418', '#5f9e48'),
  pear: (
    <>
      <path d="M24 10 C29 10 31 16 31 20 C36 24 38 30 37 35 C35 42 29 44 24 44 C19 44 13 42 11 35 C10 30 12 24 17 20 C17 16 19 10 24 10Z" fill="#d8d06a" stroke="#9a8f2e" strokeWidth="1.5" />
      <path d="M24 11 C24 7 25 5 27 4" stroke="#6b4b33" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M26 8 C30 3 35 4 36 6 C32 9 29 9 26 8Z" fill="#5f9e48" />
    </>
  ),
  tangerine: fruit('#f39a2a', '#b8641a', '#3f7a34'),
  hay: (
    <>
      <path d="M8 18 h32 v20 h-32z" fill="#d8b864" stroke="#9a7a2e" strokeWidth="1.5" />
      <path d="M8 26 h32 M8 32 h32" stroke="#b8963e" strokeWidth="1.2" />
      <path d="M14 18 v20 M34 18 v20" stroke="#8a5a34" strokeWidth="2" />
      <path d="M10 18 l3 -5 M18 18 l2 -6 M26 18 l-1 -6 M34 18 l3 -5" stroke="#cfae58" strokeWidth="1.5" />
    </>
  ),
};

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
  return CROP_ART[id] ?? fishArt(id) ?? bugArt(id) ?? FORAGE_ART[id] ?? dishArt(id) ?? TOOL_ART[id] ?? goodArt(id) ?? STAGE3_ART[id] ?? null;
}

/* ------------------------------------------------------------ artisan goods (텃밭 확장) */
/** Jar / bottle / tray / honey pot with the source crop drawn small on its label. */
function goodArt(id: string): ReactNode {
  const m = /^(jar|keg|dry|honey)(?:-([a-z]+))?$/.exec(id);
  if (!m || (m[1] !== 'honey' && !m[2])) return null;
  const crop = m[2] ? CROP_ART[m[2]] : null;
  const label = crop ? <g transform="translate(16 22) scale(.34)">{crop}</g> : null;
  switch (m[1]) {
    case 'jar':
      return (
        <>
          <path d="M14 14 h20 C40 20 42 30 38 38 C36 43 12 43 10 38 C6 30 8 20 14 14Z" fill="#7a4a2a" stroke="#4a2a14" strokeWidth="1.5" />
          <path d="M12 11 h24 v4 h-24z" fill="#5a3418" />
          <rect x="14" y="20" width="20" height="16" rx="3" fill="#f2e3c2" />
          {label}
        </>
      );
    case 'keg':
      return (
        <>
          <path d="M20 4 h8 v8 C34 16 36 22 36 28 V42 C36 44 12 44 12 42 V28 C12 22 14 16 20 12Z" fill="#6a8a5a" stroke="#3a5a34" strokeWidth="1.5" />
          <rect x="19" y="2" width="10" height="4" rx="1" fill="#8a5a34" />
          <rect x="14" y="20" width="20" height="16" rx="2" fill="#f2e3c2" />
          {label}
        </>
      );
    case 'dry':
      return (
        <>
          <ellipse cx="24" cy="36" rx="19" ry="7" fill="#c9a36a" stroke="#8a6a3a" strokeWidth="1.5" />
          <path d="M8 34 C14 38 34 38 40 34" stroke="#a8804a" strokeWidth="1.2" fill="none" />
          <g transform="translate(10 12) scale(.42)" opacity=".85">{crop}</g>
          <g transform="translate(20 16) scale(.42)" opacity=".85">{crop}</g>
        </>
      );
    default:
      return (
        <>
          <path d="M12 16 h24 v22 C36 43 12 43 12 38Z" fill="#f0a830" stroke="#b8741a" strokeWidth="1.5" />
          <path d="M10 12 h28 v5 h-28z" fill="#c9a36a" stroke="#8a6a3a" strokeWidth="1.2" />
          <path d="M16 22 C18 30 18 34 16 38" stroke="#ffd98a" strokeWidth="2" fill="none" strokeLinecap="round" />
          {crop ? <g transform="translate(22 22) scale(.3)">{crop}</g> : null}
        </>
      );
  }
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
  garlic: { leaf: 'stalk', tone: '#8aa35a', dark: '#6a8a3a', hint: '#f4eee0' },
  pea: { leaf: 'vine', tone: '#7cc05a', dark: '#4f8a3a', hint: '#f6f2e8' },
  lettuce: { leaf: 'rosette', tone: '#9fd36e', dark: '#6aa54c', hint: '#c8ec9c' },
  tulip: { leaf: 'stalk', tone: '#5f9e48', dark: '#3f7a34', hint: '#e8546e' },
  onion: { leaf: 'stalk', tone: '#8aa35a', dark: '#5f8a3a', hint: '#d9a060' },
  pepper: { leaf: 'bush', tone: '#5f9e48', dark: '#3f7a34', hint: '#f6f2e8' },
  cucumber: { leaf: 'vine', tone: '#5f9e48', dark: '#3f7a34', hint: '#f5d04a' },
  blueberry: { leaf: 'bush', tone: '#5a9a55', dark: '#3a6a3f', hint: '#f6f2e8' },
  chamoe: { leaf: 'vine', tone: '#6aa54c', dark: '#4a8238', hint: '#f5d04a' },
  zinnia: { leaf: 'bush', tone: '#6aa54c', dark: '#4a8238', hint: '#e0506a' },
  grape: { leaf: 'vine', tone: '#6a9e4a', dark: '#4a7a34', hint: '#9a6ab4' },
  radish: { leaf: 'feather', tone: '#6fae4f', dark: '#4f8a3a', hint: '#f6f2e8' },
  eggplant: { leaf: 'bush', tone: '#5f9e48', dark: '#3f7a34', hint: '#b48ad0' },
  chrysanthemum: { leaf: 'bush', tone: '#5f8e48', dark: '#3f6a34', hint: '#f0c83c' },
  greenonion: { leaf: 'stalk', tone: '#4f9a3c', dark: '#3a7a2e', hint: '#f4f1e6' },
  insam: { leaf: 'feather', tone: '#5f9e48', dark: '#3f7a34', hint: '#d8352a' },
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
  // 'furn-*': drawn art; 기본 가구 (새 방): the room catalog thumbnail.
  const furn = id.startsWith('furn-') ? FURNITURE_ART[id] : FURNITURE_BY_REF[id]?.basic ? THUMBNAILS[id] : undefined;
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

const QUALITY_WORD: Record<Quality, string> = { 0: '보통', 1: '은별', 2: '금별', 3: '별빛' };
/** Silver / gold / 별빛 quality star (vector). */
export function QualityStar({ quality, size = 13 }: { quality: Quality; size?: number }) {
  if (!quality) return null;
  // 별빛 (3): a lilac star with a small inner glint (Stardew's iridium tier).
  const fill = quality === 3 ? '#b99cf0' : quality === 2 ? '#f3c332' : '#c9d2dc';
  const stroke = quality === 3 ? '#6a4bb0' : quality === 2 ? '#a87a12' : '#7f8a96';
  return (
    <svg className="l-q-star" data-quality={quality} viewBox="0 0 20 20" width={size} height={size} aria-label={QUALITY_WORD[quality]} role="img">
      <path d="M10 1.5 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.8z" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
