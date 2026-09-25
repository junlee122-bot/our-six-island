// Procedural vector art for the premium 'furn-*' room props (life expansion
// furniture shop, crafting and bundle rewards). Inline SVG data URIs in the
// room's painted style: warm outlines, soft fills and one highlight. The image
// aspect follows the catalog size, because the room draws props as cards of
// width w and height w × aspect (rugs: w × d from above).
import { catalogEntry } from './lounge-bedroom-catalog.ts';

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
const armchair = (fabric: string): Draw => (H) => `
  <rect x="34" y="${H * 0.06}" width="132" height="${H * 0.56}" rx="36" fill="${fabric}"/>
  <rect x="10" y="${H * 0.36}" width="46" height="${H * 0.46}" rx="20" fill="${fabric}"/>
  <rect x="144" y="${H * 0.36}" width="46" height="${H * 0.46}" rx="20" fill="${fabric}"/>
  <rect x="48" y="${H * 0.52}" width="104" height="${H * 0.28}" rx="14" fill="${fabric}"/>
  ${shade(48, H * 0.68, 104, H * 0.12)}
  <rect x="30" y="${H * 0.82}" width="12" height="${H * 0.16}" rx="4" fill="#8a5a34"/><rect x="158" y="${H * 0.82}" width="12" height="${H * 0.16}" rx="4" fill="#8a5a34"/>
  ${hi(60, H * 0.14, 130, H * 0.14)}`;
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
const wardrobe = (body: string, knob: string): Draw => (H) => `
  <rect x="14" y="${H * 0.04}" width="172" height="${H * 0.88}" rx="8" fill="${body}"/>
  <path d="M100 ${H * 0.08} V${H * 0.88}" fill="none"/>
  <rect x="26" y="${H * 0.1}" width="64" height="${H * 0.74}" rx="6" fill="#fff" opacity=".35"/>
  <rect x="110" y="${H * 0.1}" width="64" height="${H * 0.74}" rx="6" fill="#fff" opacity=".35"/>
  <circle cx="90" cy="${H * 0.48}" r="5" fill="${knob}"/><circle cx="110" cy="${H * 0.48}" r="5" fill="${knob}"/>
  <rect x="22" y="${H * 0.92}" width="14" height="${H * 0.07}" fill="${body}"/><rect x="164" y="${H * 0.92}" width="14" height="${H * 0.07}" fill="${body}"/>
  ${hi(30, H * 0.14, 30, H * 0.6)}`;
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
  'furn-bed-mint': bed('#9fd8c8', '#fbfaf5', '#7cc9b4'),
  'furn-sofa-rose': sofa('#e8a3b1', '#8a5a4a'),
  'furn-armchair-navy': armchair('#3f5a86'),
  'furn-rug-lilac': rug('#d9c8ee', '#c3aee3', '#ece2f8'),
  'furn-bookcase-walnut': shelf('#6b4a33', '#3e2a1c', 5),
  'furn-wardrobe-white': wardrobe('#f6f2ea', '#c9a36a'),
  'furn-cherry-vase': (H) => `
    <path d="M78 ${H * 0.62} C66 ${H * 0.72} 70 ${H * 0.96} 100 ${H * 0.96} C130 ${H * 0.96} 134 ${H * 0.72} 122 ${H * 0.62} V${H * 0.54} H78Z" fill="#8fb8d9"/>
    <path d="M100 ${H * 0.56} C96 ${H * 0.36} 72 ${H * 0.24} 56 ${H * 0.1} M100 ${H * 0.56} C108 ${H * 0.34} 130 ${H * 0.22} 150 ${H * 0.08} M100 ${H * 0.5} C102 ${H * 0.34} 98 ${H * 0.2} 102 ${H * 0.04}" stroke="#6b4222" stroke-width="4" fill="none"/>
    ${[[56, 0.1], [72, 0.2], [150, 0.08], [132, 0.2], [102, 0.05], [96, 0.22], [118, 0.3], [80, 0.32]].map(([x, y]) => `<circle cx="${x}" cy="${H * y}" r="11" fill="#f7c1d2" stroke-width="2"/><circle cx="${x}" cy="${H * y}" r="3" fill="#e2708f" stroke="none"/>`).join('')}`,
  'furn-fan': (H) => `
    <circle cx="100" cy="${H * 0.28}" r="${H * 0.24}" fill="#bfe3d9"/>
    ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="100" cy="${H * 0.18}" rx="16" ry="${H * 0.08}" fill="#fff" stroke-width="2" transform="rotate(${a} 100 ${H * 0.28})"/>`).join('')}
    <circle cx="100" cy="${H * 0.28}" r="10" fill="#6fb3a3"/>
    <rect x="94" y="${H * 0.52}" width="12" height="${H * 0.36}" fill="#6fb3a3"/>
    <ellipse cx="100" cy="${H * 0.92}" rx="52" ry="${H * 0.05}" fill="#6fb3a3"/>`,
  'furn-maple-garland': (H) =>
    `<path d="M4 ${H * 0.2} Q100 ${H * 0.62} 196 ${H * 0.2}" fill="none" stroke-width="3"/>
    ${Array.from({ length: 9 }, (_, i) => {
      const x = 14 + i * 21.5,
        y = H * 0.2 + Math.sin((i / 8) * Math.PI) * H * 0.3;
      return `<path d="M${x} ${y} l-10 8 4 2 -8 10 10 -2 4 12 4 -12 10 2 -8 -10 4 -2z" fill="${['#e0823a', '#d9452f', '#f2b233'][i % 3]}" stroke-width="2"/>`;
    }).join('')}`,
  'furn-snowman': (H) => `
    <circle cx="100" cy="${H * 0.7}" r="${H * 0.26}" fill="#fbfdff"/>
    <circle cx="100" cy="${H * 0.32}" r="${H * 0.18}" fill="#fbfdff"/>
    <path d="M66 ${H * 0.18} H134 L124 ${H * 0.02} H76Z" fill="#3d3d4a"/><rect x="58" y="${H * 0.16}" width="84" height="10" rx="4" fill="#3d3d4a"/>
    <circle cx="90" cy="${H * 0.3}" r="4" fill="${OUT}"/><circle cx="110" cy="${H * 0.3}" r="4" fill="${OUT}"/>
    <path d="M100 ${H * 0.35} l22 5 -22 4z" fill="#f28c28" stroke-width="2"/>
    <path d="M70 ${H * 0.48} Q100 ${H * 0.56} 130 ${H * 0.48} L136 ${H * 0.62} L124 ${H * 0.6}" fill="#d9452f"/>`,
  'furn-moon-lantern': (H) => `
    <path d="M100 0 V${H * 0.12}" stroke-width="3"/>
    <circle cx="100" cy="${H * 0.5}" r="${H * 0.36}" fill="#ffe7a0"/>
    <circle cx="100" cy="${H * 0.5}" r="${H * 0.44}" fill="#fff3c0" opacity=".35" stroke="none"/>
    <circle cx="84" cy="${H * 0.42}" r="10" fill="#f2d27a" stroke="none"/><circle cx="116" cy="${H * 0.58}" r="7" fill="#f2d27a" stroke="none"/>
    <rect x="80" y="${H * 0.1}" width="40" height="${H * 0.06}" rx="3" fill="#b9854a"/><rect x="80" y="${H * 0.86}" width="40" height="${H * 0.06}" rx="3" fill="#b9854a"/>
    <path d="M100 ${H * 0.92} V${H}" stroke="#d9452f" stroke-width="4"/>`,
  'furn-lucky-pouch': (H) => `
    <path d="M60 ${H * 0.34} C20 ${H * 0.5} 26 ${H * 0.94} 100 ${H * 0.94} C174 ${H * 0.94} 180 ${H * 0.5} 140 ${H * 0.34}Z" fill="#d9313f"/>
    <path d="M60 ${H * 0.34} C70 ${H * 0.2} 130 ${H * 0.2} 140 ${H * 0.34}" fill="#e9c46a"/>
    <path d="M70 ${H * 0.3} Q100 ${H * 0.4} 130 ${H * 0.3}" stroke="#f5c518" stroke-width="5" fill="none"/>
    <circle cx="100" cy="${H * 0.64}" r="${H * 0.12}" fill="#f5c518"/>
    <path d="M100 ${H * 0.56} v${H * 0.16} M92 ${H * 0.6} h16 M92 ${H * 0.68} h16" stroke="#d9313f" stroke-width="3" fill="none"/>
    <path d="M100 ${H * 0.2} V${H * 0.02}" stroke-width="3"/>`,
  'furn-jack-lantern': (H) => `
    <ellipse cx="100" cy="${H * 0.58}" rx="88" ry="${H * 0.38}" fill="#ee8a2c"/>
    <path d="M100 ${H * 0.2} C80 ${H * 0.3} 80 ${H * 0.86} 100 ${H * 0.96} M100 ${H * 0.2} C120 ${H * 0.3} 120 ${H * 0.86} 100 ${H * 0.96}" stroke="#b85f14" fill="none"/>
    <path d="M60 ${H * 0.46} l14 -14 14 14z M112 ${H * 0.46} l14 -14 14 14z" fill="#fff1a8"/>
    <path d="M56 ${H * 0.66} Q100 ${H * 0.92} 144 ${H * 0.66} l-12 4 -8 -8 -10 10 -14 -10 -14 10 -10 -10 -8 8z" fill="#fff1a8"/>
    <path d="M100 ${H * 0.22} C98 ${H * 0.1} 106 ${H * 0.04} 116 ${H * 0.02}" stroke="#5b7a2e" stroke-width="7" fill="none"/>`,
  'furn-xmas-tree': (H) => `
    <path d="M100 ${H * 0.04} L40 ${H * 0.36} H70 L24 ${H * 0.62} H62 L12 ${H * 0.86} H188 L138 ${H * 0.62} H176 L130 ${H * 0.36} H160Z" fill="#3f8a4c"/>
    <rect x="88" y="${H * 0.86}" width="24" height="${H * 0.12}" fill="#8a5a34"/>
    <path d="M100 2 l5 10 11 1 -8 7 3 11 -11 -6 -11 6 3 -11 -8 -7 11 -1z" fill="#f5c518" stroke-width="2"/>
    ${[[80, 0.3], [120, 0.44], [70, 0.56], [134, 0.66], [90, 0.72], [60, 0.8], [148, 0.8], [110, 0.24]].map(([x, y], i) => `<circle cx="${x}" cy="${H * y}" r="7" fill="${['#e2334a', '#f5c518', '#5b8fb9', '#fff'][i % 4]}" stroke-width="2"/>`).join('')}`,
  'furn-village-medal': (H) => `
    <path d="M70 0 L86 ${H * 0.36} M130 0 L114 ${H * 0.36}" stroke="#5b8fb9" stroke-width="10"/>
    <circle cx="100" cy="${H * 0.62}" r="${H * 0.3}" fill="#e9c46a"/>
    <circle cx="100" cy="${H * 0.62}" r="${H * 0.22}" fill="#f5d77a" stroke-width="2"/>
    <path d="M100 ${H * 0.46} l8 15 17 2 -12 11 3 17 -16 -8 -16 8 3 -17 -12 -11 17 -2z" fill="#fff6c8" stroke-width="2"/>`,
};

function aspectHeight(ref: string) {
  const e = catalogEntry(ref);
  if (!e) return W;
  const ratio = e.mount === 'rug' ? e.d / e.w : e.h / e.w;
  return Math.max(40, Math.min(W * 3, W * ratio));
}

/** Room / catalog art for every premium furniture piece (ref → data URI). */
export const FURNITURE_ART: Record<string, string> = Object.fromEntries(
  Object.entries(DRAW).map(([ref, draw]) => {
    const h = aspectHeight(ref);
    return [ref, svg(h, draw(h))];
  }),
);
