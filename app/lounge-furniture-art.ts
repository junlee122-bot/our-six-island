// Room and shop art for the 'furn-*' pieces.
//
// 나무결 가구점 pieces, luxury pieces and the festival / project / bundle
// rewards are Higgsfield paintings in the bedroom props' style
// (furniture-art-generation.json), cut by `node scripts/optimize-assets.mjs
// furniture` into public/assets/lounge/furniture/<name>.webp on a canvas of the
// catalog aspect, with a 256² thumbnail in furniture/thumbs/.
//
// The 16 craftable pieces (the legacy island DECOR, 만들기 recipes) have no
// painting yet and keep the procedural vector art below: inline SVG data URIs
// with warm outlines, soft fills and one highlight. Their image aspect follows
// the catalog size, because the room draws props as cards of width w and
// height w × aspect (rugs: w × d from above).
import { catalogEntry } from './lounge-bedroom-catalog.ts';
import { LOUNGE_ASSETS } from './lounge-assets.ts';

const W = 200;
const OUT = '#5a4636';
const svg = (h: number, body: string) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Math.round(h)}" viewBox="0 0 ${W} ${Math.round(h)}"><g stroke="${OUT}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`,
  );
const shade = (x: number, y: number, w: number, h: number, r = 8) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#000" opacity=".08" stroke="none"/>`;
const hi = (x1: number, y1: number, x2: number, y2: number) =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#fff" stroke-width="5" opacity=".45" fill="none"/>`;

/* Each drawer gets the image height H (width is 200). */
type Draw = (H: number) => string;

const bed = (frame: string, sheet: string, blanket: string): Draw => (H) => `
  <rect x="8" y="${H * 0.08}" width="184" height="${H * 0.45}" rx="16" fill="${frame}"/>
  <rect x="14" y="${H * 0.4}" width="172" height="${H * 0.36}" rx="10" fill="${sheet}"/>
  <rect x="26" y="${H * 0.3}" width="62" height="${H * 0.16}" rx="12" fill="#fffaf0"/>
  <rect x="112" y="${H * 0.3}" width="62" height="${H * 0.16}" rx="12" fill="#fffaf0"/>
  <path d="M14 ${H * 0.52} H186 V${H * 0.8} Q100 ${H * 0.86} 14 ${H * 0.8}Z" fill="${blanket}"/>
  <rect x="8" y="${H * 0.76}" width="184" height="${H * 0.14}" rx="6" fill="${frame}"/>
  <rect x="12" y="${H * 0.9}" width="14" height="${H * 0.09}" fill="${frame}"/><rect x="174" y="${H * 0.9}" width="14" height="${H * 0.09}" fill="${frame}"/>
  ${hi(30, H * 0.14, 170, H * 0.14)}`;
const sofa = (fabric: string, trim: string): Draw => (H) => `
  <rect x="14" y="${H * 0.12}" width="172" height="${H * 0.5}" rx="22" fill="${fabric}"/>
  <rect x="6" y="${H * 0.38}" width="36" height="${H * 0.42}" rx="14" fill="${fabric}"/>
  <rect x="158" y="${H * 0.38}" width="36" height="${H * 0.42}" rx="14" fill="${fabric}"/>
  <rect x="36" y="${H * 0.5}" width="128" height="${H * 0.28}" rx="12" fill="${fabric}"/>
  <path d="M100 ${H * 0.52} V${H * 0.76}" fill="none"/>
  ${shade(36, H * 0.66, 128, H * 0.1)}
  <rect x="20" y="${H * 0.8}" width="160" height="${H * 0.06}" rx="3" fill="${trim}"/>
  <rect x="26" y="${H * 0.86}" width="10" height="${H * 0.12}" fill="${trim}"/><rect x="164" y="${H * 0.86}" width="10" height="${H * 0.12}" fill="${trim}"/>
  ${hi(40, H * 0.2, 150, H * 0.2)}`;
const shelf = (wood: string, dark: string, rows: number): Draw => (H) => {
  const top = H * 0.04,
    bottom = H * 0.96,
    step = (bottom - top - 20) / rows;
  let books = '';
  const colors = ['#d9534f', '#5b8fb9', '#e9c46a', '#7dbb5d', '#b07ab9', '#f28c28'];
  for (let r = 0; r < rows; r++) {
    const y = top + 10 + r * step;
    let x = 26;
    let i = r * 2;
    while (x < 160) {
      const w = 12 + ((i * 7) % 9);
      const h = step * (0.6 + ((i * 13) % 4) * 0.08);
      books += `<rect x="${x}" y="${y + step - h - 4}" width="${w}" height="${h}" rx="2" fill="${colors[i % colors.length]}" stroke-width="2"/>`;
      x += w + 3;
      i++;
    }
    books += `<rect x="18" y="${y + step - 4}" width="164" height="7" fill="${dark}" stroke-width="2"/>`;
  }
  return `<rect x="12" y="${top}" width="176" height="${bottom - top}" rx="6" fill="${wood}"/>
    <rect x="22" y="${top + 8}" width="156" height="${bottom - top - 16}" fill="${dark}" opacity=".45"/>${books}`;
};
const rug = (base: string, a: string, b: string, checks = false): Draw => (H) => {
  if (checks) {
    let cells = '';
    for (let y = 0; y < 6; y++)
      for (let x = 0; x < 8; x++)
        if ((x + y) % 2) cells += `<rect x="${12 + x * 22}" y="${H * 0.08 + (y * H * 0.84) / 6}" width="22" height="${(H * 0.84) / 6}" fill="${a}" stroke="none" opacity=".8"/>`;
    return `<rect x="12" y="${H * 0.08}" width="176" height="${H * 0.84}" rx="10" fill="${base}"/>${cells}<rect x="12" y="${H * 0.08}" width="176" height="${H * 0.84}" rx="10" fill="none"/>`;
  }
  return `<ellipse cx="100" cy="${H / 2}" rx="92" ry="${H * 0.44}" fill="${base}"/>
    <ellipse cx="100" cy="${H / 2}" rx="70" ry="${H * 0.32}" fill="${a}" stroke-width="2"/>
    <ellipse cx="100" cy="${H / 2}" rx="42" ry="${H * 0.18}" fill="${b}" stroke-width="2"/>`;
};
const pot = (H: number, y: number, color = '#c86f4a') =>
  `<path d="M66 ${y} H134 L124 ${H - 6} H76Z" fill="${color}"/><rect x="60" y="${y - 10}" width="80" height="14" rx="5" fill="${color}"/>`;

const DRAW: Record<string, Draw> = {
  'furn-plant': (H) =>
    `${pot(H, H * 0.62)}
    <path d="M100 ${H * 0.6} C80 ${H * 0.4} 60 ${H * 0.36} 44 ${H * 0.3} C64 ${H * 0.22} 88 ${H * 0.34} 100 ${H * 0.52}" fill="#6aa84f"/>
    <path d="M100 ${H * 0.6} C120 ${H * 0.4} 140 ${H * 0.34} 158 ${H * 0.26} C136 ${H * 0.2} 112 ${H * 0.34} 100 ${H * 0.5}" fill="#7dbb5d"/>
    ${[70, 100, 130].map((x, i) => `<circle cx="${x}" cy="${H * (0.18 + i * 0.04)}" r="14" fill="${['#f28bb5', '#f5d34b', '#e2334a'][i]}"/><circle cx="${x}" cy="${H * (0.18 + i * 0.04)}" r="5" fill="#fff3a8" stroke-width="2"/>`).join('')}`,
  'furn-chair': (H) => `
    <rect x="44" y="${H * 0.06}" width="112" height="${H * 0.4}" rx="10" fill="#e9c46a"/>
    <path d="M56 ${H * 0.14} H144 M56 ${H * 0.24} H144 M56 ${H * 0.34} H144" stroke="#c99a3c" fill="none"/>
    <rect x="34" y="${H * 0.46}" width="132" height="${H * 0.14}" rx="6" fill="#d9ad5a"/>
    <path d="M44 ${H * 0.6} L36 ${H * 0.96} M156 ${H * 0.6} L164 ${H * 0.96} M70 ${H * 0.6} L74 ${H * 0.9} M130 ${H * 0.6} L126 ${H * 0.9}" stroke-width="7" fill="none" stroke="#9a6538"/>`,
  'furn-lamp': (H) => `
    <path d="M60 ${H * 0.1} H140 L160 ${H * 0.46} H40Z" fill="#fff1c8"/>
    ${[70, 100, 130].map((x) => `<path d="M${x} ${H * 0.22} l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="#f5c518" stroke-width="1.5"/>`).join('')}
    <rect x="94" y="${H * 0.46}" width="12" height="${H * 0.38}" fill="#b08a5a"/>
    <ellipse cx="100" cy="${H * 0.9}" rx="46" ry="${H * 0.06}" fill="#8a6a4a"/>
    <ellipse cx="100" cy="${H * 0.3}" rx="90" ry="${H * 0.26}" fill="#fff3a8" opacity=".25" stroke="none"/>`,
  'furn-tent': (H) => `
    <path d="M100 ${H * 0.06} L8 ${H * 0.94} H192Z" fill="#e97f5a"/>
    <path d="M100 ${H * 0.06} L60 ${H * 0.94} H140Z" fill="#fbe3c8"/>
    <path d="M100 ${H * 0.3} L78 ${H * 0.94} H122Z" fill="#5a4636" opacity=".85"/>
    <path d="M100 ${H * 0.06} V0" stroke-width="4"/><path d="M100 2 l16 6 -16 6z" fill="#f5c518" stroke-width="2"/>
    <path d="M30 ${H * 0.94} L20 ${H} M170 ${H * 0.94} L180 ${H}" fill="none"/>`,
  'furn-table': (H) => `
    <rect x="6" y="${H * 0.16}" width="188" height="${H * 0.14}" rx="6" fill="#b9854a"/>
    ${hi(20, H * 0.2, 180, H * 0.2)}
    <rect x="18" y="${H * 0.3}" width="14" height="${H * 0.66}" fill="#9a6538"/><rect x="168" y="${H * 0.3}" width="14" height="${H * 0.66}" fill="#9a6538"/>
    <rect x="30" y="${H * 0.3}" width="140" height="${H * 0.08}" fill="#9a6538"/>
    <ellipse cx="100" cy="${H * 0.12}" rx="18" ry="${H * 0.05}" fill="#fff" /><path d="M100 ${H * 0.02} v${H * 0.08}" stroke="#7dbb5d" stroke-width="4"/>`,
  'furn-sofa': sofa('#e8b77a', '#8a5a34'),
  'furn-bookshelf': shelf('#b9854a', '#6b4222', 4),
  'furn-logbed': bed('#a8743f', '#f6efe2', '#7fae8a'),
  'furn-rug': rug('#f6efe2', '#d9534f', '#fff', true),
  'furn-bench': (H) => `
    <rect x="6" y="${H * 0.08}" width="188" height="${H * 0.14}" rx="5" fill="#b9854a"/><rect x="6" y="${H * 0.26}" width="188" height="${H * 0.14}" rx="5" fill="#b9854a"/>
    <rect x="2" y="${H * 0.48}" width="196" height="${H * 0.14}" rx="5" fill="#a8743f"/>
    <path d="M20 ${H * 0.1} L16 ${H * 0.96} M180 ${H * 0.1} L184 ${H * 0.96}" stroke="#3d3d3d" stroke-width="8" fill="none"/>`,
  'furn-fence': (H) =>
    `<rect x="4" y="${H * 0.36}" width="192" height="${H * 0.12}" fill="#e9dcc2"/><rect x="4" y="${H * 0.64}" width="192" height="${H * 0.12}" fill="#e9dcc2"/>
    ${[10, 50, 90, 130, 170].map((x) => `<path d="M${x} ${H * 0.98} V${H * 0.14} L${x + 10} ${H * 0.02} L${x + 20} ${H * 0.14} V${H * 0.98}Z" fill="#fbf4e4"/>`).join('')}`,
  'furn-fountain': (H) => `
    <ellipse cx="100" cy="${H * 0.82}" rx="94" ry="${H * 0.14}" fill="#c9c3b6"/>
    <ellipse cx="100" cy="${H * 0.78}" rx="80" ry="${H * 0.09}" fill="#8fd0e6"/>
    <rect x="88" y="${H * 0.36}" width="24" height="${H * 0.42}" fill="#d9d3c6"/>
    <ellipse cx="100" cy="${H * 0.36}" rx="46" ry="${H * 0.07}" fill="#d9d3c6"/>
    <path d="M100 ${H * 0.34} C80 ${H * 0.1} 60 ${H * 0.2} 56 ${H * 0.4} M100 ${H * 0.34} C120 ${H * 0.1} 140 ${H * 0.2} 144 ${H * 0.4}" stroke="#8fd0e6" stroke-width="6" fill="none"/>`,
  'furn-radio': (H) => `
    <rect x="10" y="${H * 0.2}" width="180" height="${H * 0.72}" rx="18" fill="#c98a4a"/>
    <circle cx="62" cy="${H * 0.56}" r="${H * 0.24}" fill="#f2e6c8"/>
    <circle cx="62" cy="${H * 0.56}" r="${H * 0.14}" fill="none" stroke-width="2"/>
    <rect x="112" y="${H * 0.36}" width="62" height="${H * 0.18}" rx="4" fill="#fff7d6"/>
    <circle cx="126" cy="${H * 0.74}" r="10" fill="#6b4222"/><circle cx="160" cy="${H * 0.74}" r="10" fill="#6b4222"/>
    <path d="M40 ${H * 0.2} L70 0" stroke-width="3"/>`,
  'furn-planter': (H) => `
    <rect x="6" y="${H * 0.5}" width="188" height="${H * 0.46}" rx="6" fill="#a8743f"/>
    <path d="M6 ${H * 0.66} H194 M6 ${H * 0.82} H194" stroke="#8a5a34" fill="none"/>
    ${[30, 62, 94, 126, 158].map((x, i) => `<path d="M${x + 6} ${H * 0.5} V${H * 0.24}" stroke="#4f8a3c" stroke-width="4"/><circle cx="${x + 6}" cy="${H * 0.2}" r="14" fill="${['#f28bb5', '#f5d34b', '#e2334a', '#b07ab9', '#f7a8c9'][i]}"/><circle cx="${x + 6}" cy="${H * 0.2}" r="5" fill="#fff3a8" stroke-width="2"/>`).join('')}`,
  'furn-fireplace': (H) => `
    <rect x="6" y="${H * 0.1}" width="188" height="${H * 0.88}" rx="6" fill="#c9785a"/>
    <path d="M6 ${H * 0.3} H194 M6 ${H * 0.5} H194 M6 ${H * 0.7} H194" stroke="#a45a3e" fill="none" stroke-width="2"/>
    <rect x="0" y="${H * 0.04}" width="200" height="${H * 0.1}" rx="4" fill="#8a5a34"/>
    <path d="M48 ${H * 0.98} V${H * 0.48} Q100 ${H * 0.26} 152 ${H * 0.48} V${H * 0.98}Z" fill="#3d2f25"/>
    <path d="M100 ${H * 0.9} C74 ${H * 0.84} 82 ${H * 0.66} 96 ${H * 0.56} C96 ${H * 0.68} 110 ${H * 0.66} 112 ${H * 0.58} C126 ${H * 0.7} 124 ${H * 0.86} 100 ${H * 0.9}Z" fill="#f5a623"/>
    <path d="M100 ${H * 0.9} C90 ${H * 0.86} 92 ${H * 0.76} 100 ${H * 0.7} C108 ${H * 0.76} 110 ${H * 0.86} 100 ${H * 0.9}Z" fill="#fff1a8" stroke-width="2"/>`,
  'furn-fruit-tree': (H) => `
    ${pot(H, H * 0.78, '#e0b27a')}
    <rect x="92" y="${H * 0.46}" width="16" height="${H * 0.34}" fill="#8a5a34"/>
    <circle cx="100" cy="${H * 0.3}" r="${H * 0.24}" fill="#5e9d4c"/>
    <circle cx="70" cy="${H * 0.38}" r="${H * 0.14}" fill="#6aa84f"/><circle cx="132" cy="${H * 0.36}" r="${H * 0.14}" fill="#6aa84f"/>
    ${[[80, 0.22], [118, 0.2], [100, 0.36], [66, 0.4], [136, 0.4], [96, 0.14]].map(([x, y]) => `<circle cx="${x}" cy="${H * y}" r="9" fill="#f28c28" stroke-width="2"/>`).join('')}`,
};

function aspectHeight(ref: string) {
  const e = catalogEntry(ref);
  if (!e) return W;
  const ratio = e.mount === 'rug' ? e.d / e.w : e.h / e.w;
  return Math.max(40, Math.min(W * 3, W * ratio));
}

/** Pieces painted on the furniture sheets (web copy furniture/<ref without 'furn-'>.webp). */
export const PAINTED_FURNITURE: readonly string[] = [
  'furn-bed-mint',
  'furn-sofa-rose',
  'furn-armchair-navy',
  'furn-rug-lilac',
  'furn-bookcase-walnut',
  'furn-wardrobe-white',
  'furn-rocking-chair',
  'furn-cherry-vase',
  'furn-fan',
  'furn-maple-garland',
  'furn-snowman',
  'furn-moon-lantern',
  'furn-lucky-pouch',
  'furn-jack-lantern',
  'furn-xmas-tree',
  'furn-village-medal',
  'furn-project-plaque',
  'furn-festival-lantern',
  'furn-festival-drum',
  'furn-festival-kite',
  'furn-festival-fan',
  'furn-round-dining-set',
  'furn-beanbag',
  'furn-hanging-planter',
  'furn-cat-tower',
  'furn-retro-tv',
  'furn-wall-shelf',
  'furn-grand-piano',
  'furn-canopy-bed',
  'furn-aquarium',
  'furn-crystal-lamp',
  'furn-gold-mirror',
  'furn-arcade',
  'furn-telescope',
  'furn-mother-pearl',
  'furn-velvet-sofa',
  'furn-bonsai',
  'furn-marble-fireplace',
  'furn-najeon-wardrobe',
];
// LOUNGE_ASSETS lists each file literally so the Pages build content-hashes it.
const painted = (ref: string, thumb = false) =>
  (LOUNGE_ASSETS as Record<string, string>)[`furniture_${thumb ? 'thumb_' : ''}${ref.replace(/^furn-/, '').replaceAll('-', '_')}`];

/** Room / shop art for every premium furniture piece (ref → image URL or data URI). */
export const FURNITURE_ART: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(DRAW).map(([ref, draw]) => {
      const h = aspectHeight(ref);
      return [ref, svg(h, draw(h))];
    }),
  ),
  ...Object.fromEntries(PAINTED_FURNITURE.map((ref) => [ref, painted(ref)])),
};
/** Small square previews (room editor list, item icons): the painted pieces' thumbnails, else the art. */
export const FURNITURE_THUMBS: Record<string, string> = {
  ...FURNITURE_ART,
  ...Object.fromEntries(PAINTED_FURNITURE.map((ref) => [ref, painted(ref, true)])),
};
