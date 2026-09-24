// Procedural vector art for the shop's rare room props (trophies and the
// fruit basket). Inline SVG data URIs: no image files, no paid generation, and
// they load both as <img> in '내 방 꾸미기' and as textures in '방 산책'.

const svg = (body: string, w = 160, h = 200) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  );

/** A golden cup on a wooden plinth with a crop on top. */
function trophy(crop: string, cup: [string, string]) {
  return svg(`
  <defs>
    <linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${cup[0]}"/><stop offset=".55" stop-color="#fff6c8"/><stop offset="1" stop-color="${cup[1]}"/></linearGradient>
    <linearGradient id="w" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9a6a42"/><stop offset="1" stop-color="#6e4629"/></linearGradient>
  </defs>
  <ellipse cx="80" cy="192" rx="54" ry="6" fill="#3d2c1c" opacity=".22"/>
  <rect x="34" y="160" width="92" height="30" rx="5" fill="url(#w)"/>
  <rect x="48" y="168" width="64" height="12" rx="3" fill="#e9c46a"/>
  <rect x="68" y="136" width="24" height="26" fill="url(#g)"/>
  <rect x="54" y="150" width="52" height="12" rx="4" fill="url(#g)"/>
  <path d="M34 62 H126 C126 110 106 136 80 136 C54 136 34 110 34 62Z" fill="url(#g)" stroke="#b8862b" stroke-width="3"/>
  <path d="M34 72 C14 72 12 104 40 108" fill="none" stroke="#d9a93c" stroke-width="7" stroke-linecap="round"/>
  <path d="M126 72 C146 72 148 104 120 108" fill="none" stroke="#d9a93c" stroke-width="7" stroke-linecap="round"/>
  <path d="M60 80 C60 104 70 118 80 122" fill="none" stroke="#fffbe6" stroke-width="5" opacity=".7" stroke-linecap="round"/>
  ${crop}
  <path d="M132 30 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" fill="#fff3a8"/>
  <path d="M24 44 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z" fill="#fff3a8"/>`);
}

const carrot = `
  <path d="M80 70 L66 20 Q80 12 94 20Z" fill="#f28c28" stroke="#c9661a" stroke-width="2"/>
  <path d="M72 34h14M74 46h11" stroke="#c9661a" stroke-width="2"/>
  <path d="M80 22 C70 6 64 4 60 8 M80 22 C80 4 84 0 88 2 M80 22 C92 8 98 8 102 12" stroke="#4f9a3c" stroke-width="5" fill="none" stroke-linecap="round"/>`;
const tomato = `
  <circle cx="80" cy="46" r="26" fill="#e0432f" stroke="#a82a1c" stroke-width="2"/>
  <ellipse cx="70" cy="38" rx="7" ry="5" fill="#ff9b8a" opacity=".7"/>
  <path d="M80 22 l-12 -6 8 10 -14 2 16 2 -6 10 8 -8 8 8 -6 -10 16 -2 -14 -2 8 -10z" fill="#3f8a34"/>`;
const pumpkin = `
  <ellipse cx="80" cy="48" rx="36" ry="24" fill="#f08a24" stroke="#b85f12" stroke-width="2"/>
  <path d="M80 26 C70 36 70 60 80 70 M80 26 C90 36 90 60 80 70 M60 30 C52 42 54 60 62 68 M100 30 C108 42 106 60 98 68" stroke="#c96c18" stroke-width="2.5" fill="none"/>
  <rect x="76" y="14" width="8" height="14" rx="3" fill="#5b7a2e"/>`;
const strawberry = `
  <path d="M80 76 C56 62 54 34 64 26 C72 20 88 20 96 26 C106 34 104 62 80 76Z" fill="#e8384f" stroke="#a51f33" stroke-width="2"/>
  <g fill="#ffe28a"><circle cx="70" cy="38" r="2"/><circle cx="84" cy="36" r="2"/><circle cx="92" cy="46" r="2"/><circle cx="76" cy="50" r="2"/><circle cx="68" cy="56" r="2"/><circle cx="86" cy="60" r="2"/></g>
  <path d="M80 26 l-14 -6 10 -2 -6 -8 10 6 0 -10 6 10 10 -6 -6 8 10 2z" fill="#3f8a34"/>
  <path d="M60 8 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z" fill="#fff3a8"/>`;

const basket = svg(`
  <defs><linearGradient id="b" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d7a15f"/><stop offset="1" stop-color="#9c6a35"/></linearGradient></defs>
  <ellipse cx="80" cy="170" rx="66" ry="8" fill="#3d2c1c" opacity=".22"/>
  <path d="M30 70 C30 10 130 10 130 70" fill="none" stroke="#9c6a35" stroke-width="8"/>
  <circle cx="58" cy="78" r="18" fill="#e0432f"/><circle cx="96" cy="74" r="20" fill="#f2a33a"/>
  <circle cx="78" cy="64" r="16" fill="#8fc24a"/><circle cx="112" cy="86" r="14" fill="#c93a64"/>
  <circle cx="44" cy="92" r="13" fill="#f5d04a"/>
  <path d="M78 48 q4 -10 12 -10" stroke="#4f7a2e" stroke-width="4" fill="none"/>
  <path d="M20 88 H140 L126 164 H34Z" fill="url(#b)" stroke="#7b4f24" stroke-width="3"/>
  <path d="M26 110 H134 M30 132 H130 M32 152 H128" stroke="#7b4f24" stroke-width="3" opacity=".6"/>
  <path d="M50 88 L56 164 M80 88 V164 M110 88 L104 164" stroke="#7b4f24" stroke-width="3" opacity=".45"/>
  <rect x="18" y="82" width="124" height="12" rx="6" fill="#c58a4a" stroke="#7b4f24" stroke-width="2"/>`, 160, 180);

export const TROPHY_ART = {
  'trophy-carrot': trophy(carrot, ['#e8b93a', '#b98a1d']),
  'trophy-tomato': trophy(tomato, ['#f0a3a0', '#b8433c']),
  'trophy-pumpkin': trophy(pumpkin, ['#e9b35a', '#a8641f']),
  'trophy-strawberry': trophy(strawberry, ['#cdd6f2', '#8e7fc9']),
  'fruit-basket': basket,
} as const;
export type TrophyId = keyof typeof TROPHY_ART;
export const TROPHY_IDS = Object.keys(TROPHY_ART) as TrophyId[];
export const isTrophy = (id: string): id is TrophyId => id in TROPHY_ART;
