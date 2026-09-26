/**
 * 미쿠 테마 room set: original vector illustrations of a "mint twin-tail
 * singer" (fan tribute; no official artwork, logos or trademark text).
 * Drawn to sit next to the painted Higgsfield props: matte fills with soft
 * gradients, a thin warm-brown outline, a slightly elevated front view and a
 * soft contact shadow. Also provides the flat print textures used by the 3D
 * versions (record sleeves, acrylic print, cushion face, rug top).
 * Exception: the concert poster is a framed Higgsfield fan-art print
 * (public/assets/lounge/bedroom/miku-poster.webp; see ASSETS.md).
 */
import { LOUNGE_ASSETS } from './lounge-assets';

const OUT = '#4a3c35';
const svg = (body: string, width: number, height: number, defs = '') =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${PAPER}${defs}</defs>${body}</svg>`,
  )}`;
/** Fine paper grain, multiplied at low strength for a hand-painted matte finish. */
const PAPER = `<filter id="paper" filterUnits="userSpaceOnUse" x="-40" y="-40" width="1200" height="1200"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .5  0 0 0 0 .42  0 0 0 0 .36  0 0 0 .09 0" result="g"/><feComposite in="g" in2="SourceGraphic" operator="in" result="gg"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gg"/></feMerge></filter><radialGradient id="shadow"><stop offset="0" stop-color="#3b2e25" stop-opacity=".32"/><stop offset=".6" stop-color="#3b2e25" stop-opacity=".12"/><stop offset="1" stop-color="#3b2e25" stop-opacity="0"/></radialGradient>`;
const shadow = (cx: number, cy: number, rx: number, ry: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#shadow)"/>`;
const lw = (w = 1.6) =>
  `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const line = lw();

/** Palette shared by the whole set. */
export const MINT = {
  hair: '#6fd3c4',
  hairDeep: '#3ea99b',
  hairShade: '#2f8378',
  tie: '#e27fa0',
  skin: '#fbe2cf',
  cheek: '#f2a9a0',
  eye: '#2c8a83',
  navy: '#34405e',
  cream: '#f4ecdc',
  oak: '#d2ad7c',
  oakDeep: '#a97f51',
  glow: '#9ff5e2',
} as const;

const SINGER_DEFS = `<linearGradient id="hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8be3d6"/><stop offset=".55" stop-color="${MINT.hair}"/><stop offset="1" stop-color="${MINT.hairDeep}"/></linearGradient><linearGradient id="coat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f2e8"/><stop offset="1" stop-color="#ddd6c8"/></linearGradient><linearGradient id="skirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46516d"/><stop offset="1" stop-color="#2d3650"/></linearGradient><radialGradient id="face" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#fff0e4"/><stop offset="1" stop-color="${MINT.skin}"/></radialGradient>`;
/**
 * The mint twin-tail singer (200×240 box): long twin tails with pink ties,
 * a cream stage jacket with a mint ribbon, a navy pleated skirt, and a
 * microphone raised mid-song. `wave` bends the tails for motion.
 */
function singer(wave = 0) {
  const w = wave;
  return `<g class="singer">
  <path d="M66 60C38 70 24 104 26 146C28 182 36 206 30 232C44 226 54 204 56 176C58 146 62 112 76 84Z" fill="url(#hair)" ${line}/>
  <path d="M134 60C162 70 176 104 174 146C${172 + w} 182 ${164 + w} 206 ${170 + w} 232C${156 + w} 226 146 204 144 176C142 146 138 112 124 84Z" fill="url(#hair)" ${line}/>
  <path d="M40 112C38 150 44 186 38 214M160 112C${162 + w} 150 ${156 + w} 186 ${162 + w} 214" fill="none" stroke="${MINT.hairShade}" stroke-width="2" opacity=".45"/>
  <path d="M84 186L82 212H94L96 186ZM104 186L106 212H118L116 186Z" fill="${MINT.skin}" ${line}/>
  <path d="M79 207Q78 224 88 226H98L97 207ZM103 207L102 226H112Q122 224 121 207Z" fill="${MINT.navy}" ${line}/>
  <path d="M81 209H97M103 209H119" stroke="${MINT.hair}" stroke-width="2.4"/>
  <path d="M74 156L64 188Q100 198 136 188L126 156Z" fill="url(#skirt)" ${line}/>
  <path d="M86 160L81 190M100 160V193M114 160L119 190" stroke="#1f2638" stroke-width="1.4" opacity=".55"/>
  <path d="M66 184Q100 194 134 184" fill="none" stroke="${MINT.hair}" stroke-width="3"/>
  <path d="M82 116Q100 110 118 116L127 158Q100 166 73 158Z" fill="url(#coat)" ${line}/>
  <path d="M92 118L100 134L108 118" fill="none" stroke="#c9c0b0" stroke-width="1.6"/>
  <path d="M100 124L92 118Q90 128 96 130ZM100 124L108 118Q110 128 104 130Z" fill="${MINT.hair}" ${line}/>
  <path d="M98 128L94 152L100 158L106 152L102 128Z" fill="${MINT.hairDeep}" ${line}/>
  <path d="M82 120Q70 132 68 150Q68 160 76 160Q80 150 86 138" fill="url(#coat)" ${line}/>
  <circle cx="74" cy="160" r="5.5" fill="${MINT.skin}" ${line}/>
  <ellipse cx="100" cy="72" rx="42" ry="40" fill="url(#hair)" ${line}/>
  <path d="M68 78Q68 108 100 112Q132 108 132 78Q128 62 100 60Q72 62 68 78Z" fill="url(#face)" ${line}/>
  <path d="M60 80Q56 36 100 32Q144 36 140 80L134 70L130 80L122 60L114 76L106 56L98 74L90 56L82 76L76 62L70 78L66 70Z" fill="url(#hair)" ${line}/>
  <path d="M86 42Q100 36 116 42" stroke="#b5f0e6" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round"/>
  <rect x="56" y="52" width="13" height="20" rx="4" transform="rotate(-24 62 62)" fill="${MINT.tie}" ${line}/>
  <rect x="131" y="52" width="13" height="20" rx="4" transform="rotate(24 138 62)" fill="${MINT.tie}" ${line}/>
  <ellipse cx="87" cy="86" rx="5.6" ry="7.4" fill="${MINT.eye}"/>
  <ellipse cx="113" cy="86" rx="5.6" ry="7.4" fill="${MINT.eye}"/>
  <ellipse cx="87" cy="89" rx="3.6" ry="4" fill="#1d5a55"/>
  <ellipse cx="113" cy="89" rx="3.6" ry="4" fill="#1d5a55"/>
  <circle cx="89" cy="83" r="2.2" fill="#fff"/><circle cx="115" cy="83" r="2.2" fill="#fff"/>
  <path d="M80 78Q87 74 94 78M106 78Q113 74 120 78" stroke="#3b4a4a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <ellipse cx="78" cy="97" rx="6" ry="3.4" fill="${MINT.cheek}" opacity=".6"/>
  <ellipse cx="122" cy="97" rx="6" ry="3.4" fill="${MINT.cheek}" opacity=".6"/>
  <path d="M95 99Q100 106 105 99Z" fill="#b8566a" ${lw(1.2)}/>
  <path d="M118 121Q132 122 132 110" fill="none" stroke="${OUT}" stroke-width="12.4" stroke-linecap="round"/>
  <path d="M118 121Q132 122 132 110" fill="none" stroke="#efe9dd" stroke-width="9.2" stroke-linecap="round"/>
  <path d="M130 110L120 100" stroke="#3d3f47" stroke-width="4.4" stroke-linecap="round"/>
  <circle cx="131" cy="109" r="5.6" fill="${MINT.skin}" ${line}/>
  <ellipse cx="117" cy="97" rx="5.4" ry="6.2" transform="rotate(-40 117 97)" fill="#6a6f7c" ${line}/>
  <path d="M114 95Q117 92 120 95" stroke="#c8ccd4" stroke-width="1.3" fill="none"/>
  <path d="M40 120Q36 160 42 196M160 120Q164 160 158 196" stroke="#b5f0e6" stroke-width="2.4" fill="none" opacity=".55" stroke-linecap="round"/>
</g>`;
}
const note = (x: number, y: number, s = 1, fill: string = MINT.hairDeep) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0V-26L16 -30V-6" fill="none" stroke="${fill}" stroke-width="3" stroke-linecap="round"/><ellipse cx="-4" cy="0" rx="6" ry="4.5" transform="rotate(-20 -4 0)" fill="${fill}"/><ellipse cx="12" cy="-6" rx="6" ry="4.5" transform="rotate(-20 12 -6)" fill="${fill}"/></g>`;
const star = (x: number, y: number, r: number, fill: string) =>
  `<path d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z" fill="${fill}"/>`;

// ---------------------------------------------------------------- flat art
const banner = svg(
  `<g filter="url(#paper)">
  <path d="M40 30Q62 28 70 20M240 30Q218 28 210 20" stroke="#8a6a4a" stroke-width="2.4" fill="none"/>
  <circle cx="140" cy="14" r="5" fill="#b89366" ${line}/>
  <path d="M70 20L140 14L210 20" stroke="#8a6a4a" stroke-width="2" fill="none"/>
  <path d="M46 34H234V314Q210 330 188 318Q164 334 140 318Q116 334 92 318Q70 330 46 314Z" fill="url(#cloth)" ${line}/>
  <path d="M46 34H234V314Q210 330 188 318Q164 334 140 318Q116 334 92 318Q70 330 46 314Z" fill="url(#folds)"/>
  <rect x="58" y="46" width="164" height="248" rx="4" fill="none" stroke="#f4ecdc" stroke-width="3" stroke-dasharray="7 5" opacity=".85"/>
  <circle cx="140" cy="150" r="70" fill="#f4ecdc" opacity=".92"/>
  <g transform="translate(140 150) scale(.62) translate(-100 -118)"><clipPath id="c"><circle cx="100" cy="112" r="112"/></clipPath><g clip-path="url(#c)">${singer(0)}</g></g>
  <circle cx="140" cy="150" r="70" fill="none" stroke="${MINT.navy}" stroke-width="2.4"/>
  ${note(84, 262, 0.9, '#f4ecdc')}${note(186, 268, 0.8, '#f4ecdc')}${star(140, 256, 9, '#f7d77c')}
  <path d="M62 86Q80 70 98 86M182 86Q200 70 218 86" stroke="#bff2e7" stroke-width="3" fill="none" opacity=".7"/>
  <rect x="30" y="24" width="220" height="14" rx="7" fill="url(#rod)" ${line}/>
  <circle cx="30" cy="31" r="9" fill="${MINT.oak}" ${line}/><circle cx="250" cy="31" r="9" fill="${MINT.oak}" ${line}/>
  <g stroke="#e8b4c4" stroke-width="3" stroke-linecap="round"><path d="M92 322V344M140 322V346M188 322V344"/></g>
  <g fill="${MINT.tie}" ${line}><circle cx="92" cy="348" r="5"/><circle cx="140" cy="350" r="5"/><circle cx="188" cy="348" r="5"/></g>
</g>`,
  280,
  370,
  `<linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd8ca"/><stop offset="1" stop-color="#4bb3a5"/></linearGradient><linearGradient id="folds" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c4a45" stop-opacity=".22"/><stop offset=".16" stop-color="#fff" stop-opacity=".12"/><stop offset=".34" stop-color="#1c4a45" stop-opacity=".08"/><stop offset=".52" stop-color="#fff" stop-opacity=".12"/><stop offset=".72" stop-color="#1c4a45" stop-opacity=".1"/><stop offset=".88" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#1c4a45" stop-opacity=".24"/></linearGradient><linearGradient id="rod" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6c9a0"/><stop offset="1" stop-color="${MINT.oakDeep}"/></linearGradient>${SINGER_DEFS}`,
);

/** Square record sleeves (also textures for the 3D record shelf). */
const sleeve = (variant: 0 | 1 | 2) => {
  const bodies = [
    `<rect width="256" height="256" fill="url(#s0)"/><circle cx="128" cy="140" r="84" fill="#f4ecdc" opacity=".25"/><g transform="translate(46 26) scale(.82)">${singer(3)}</g>${note(40, 60, 1, '#fff')}${star(220, 44, 10, '#f7d77c')}`,
    `<rect width="256" height="256" fill="${MINT.navy}"/><circle cx="128" cy="128" r="92" fill="#2a3450"/><g fill="none" stroke="${MINT.hair}" stroke-width="3">${Array.from({ length: 6 }, (_, i) => `<circle cx="128" cy="128" r="${30 + i * 12}" opacity="${1 - i * 0.13}"/>`).join('')}</g><circle cx="128" cy="128" r="18" fill="${MINT.tie}"/><path d="M40 216H216" stroke="#f4ecdc" stroke-width="4"/><path d="M40 228H150" stroke="#f4ecdc" stroke-width="4" opacity=".6"/>`,
    `<rect width="256" height="256" fill="#f6d9df"/><path d="M0 180Q64 140 128 180T256 180V256H0Z" fill="${MINT.hair}"/><path d="M0 200Q64 160 128 200T256 200V256H0Z" fill="${MINT.hairDeep}"/>${star(70, 70, 22, '#fff')}${star(180, 100, 14, '#f7d77c')}${note(150, 80, 1.3, MINT.navy)}`,
  ];
  return svg(
    `<g filter="url(#paper)">${bodies[variant]}<rect x="2" y="2" width="252" height="252" fill="none" stroke="#fff" stroke-width="4" opacity=".35"/></g>`,
    256,
    256,
    `<linearGradient id="s0" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fe6d9"/><stop offset="1" stop-color="#3ea99b"/></linearGradient>${SINGER_DEFS}`,
  );
};
const SLEEVES = [sleeve(0), sleeve(1), sleeve(2)] as const;

const records = svg(
  `<g filter="url(#paper)">
  ${shadow(180, 214, 160, 12)}
  <g transform="translate(40 34) rotate(-6 70 70)"><rect width="140" height="140" rx="3" fill="#9fe6d9" ${line}/><image href="${SLEEVES[1]}" width="140" height="140"/><rect width="140" height="140" rx="3" fill="none" ${line}/></g>
  <circle cx="226" cy="118" r="72" fill="#27262c" ${line}/><circle cx="226" cy="118" r="58" fill="none" stroke="#3f3e46" stroke-width="2"/><circle cx="226" cy="118" r="44" fill="none" stroke="#3f3e46" stroke-width="1.5"/><circle cx="226" cy="118" r="22" fill="${MINT.tie}"/><circle cx="226" cy="118" r="3" fill="#f4ecdc"/><path d="M180 84Q204 64 236 70" stroke="#6b6a74" stroke-width="3" fill="none" opacity=".7"/>
  <g transform="translate(118 44) rotate(4 70 70)"><image href="${SLEEVES[0]}" width="140" height="140"/><rect width="140" height="140" rx="3" fill="none" ${line}/></g>
  <g transform="translate(248 76) rotate(9 50 50)"><image href="${SLEEVES[2]}" width="100" height="100"/><rect width="100" height="100" rx="3" fill="none" ${line}/></g>
  <path d="M14 186H346L336 204H24Z" fill="url(#ledgeTop)" ${line}/>
  <path d="M24 204H336V218H24Z" fill="url(#ledge)" ${line}/>
  <path d="M58 218V232M302 218V232" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>
</g>`,
  360,
  250,
  `<linearGradient id="ledgeTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecd3ae"/><stop offset="1" stop-color="${MINT.oak}"/></linearGradient><linearGradient id="ledge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${MINT.oak}"/><stop offset="1" stop-color="${MINT.oakDeep}"/></linearGradient>`,
);

/** The acrylic print alone (transparent), used on the 3D acrylic stand. */
const acrylicPrint = svg(
  `<path d="M40 30Q120 0 200 30L224 250Q120 272 16 250Z" fill="#e8fbf6" opacity=".55"/><g transform="translate(20 20)">${singer(2)}</g>${star(206, 52, 10, '#f7d77c')}${note(30, 70, 0.9, '#e27fa0')}`,
  240,
  280,
  SINGER_DEFS,
);
const acrylic = svg(
  `<g filter="url(#paper)" transform="translate(0 10)">
  ${shadow(120, 270, 96, 12)}
  <path d="M34 246Q120 226 206 246L204 262Q120 280 36 262Z" fill="url(#base)" ${line}/>
  <ellipse cx="120" cy="246" rx="86" ry="14" fill="#e6fbf6" opacity=".9" ${line}/>
  <path d="M112 236H128V250H112Z" fill="#cdeee7" ${line}/>
  <path d="M46 34Q120 6 194 34L214 238Q120 256 26 238Z" fill="#f2fffc" opacity=".55" ${line}/>
  <g transform="translate(24 20) scale(.96)">${singer(2)}</g>
  ${star(190, 58, 9, '#f7d77c')}${note(44, 76, 0.8, '#e27fa0')}
  <path d="M58 44L44 226M72 40L60 150" stroke="#fff" stroke-width="5" opacity=".7" stroke-linecap="round"/>
  <path d="M46 34Q120 6 194 34L214 238Q120 256 26 238Z" fill="none" stroke="#9fd8cc" stroke-width="2.4"/>
</g>`,
  240,
  300,
  `<linearGradient id="base" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7f0e8"/><stop offset="1" stop-color="#7cc7bb"/></linearGradient>${SINGER_DEFS}`,
);

const stick = (x: number, tilt: number) =>
  `<g transform="rotate(${tilt} ${x} 236)"><rect x="${x - 26}" y="34" width="52" height="170" rx="26" fill="url(#halo)"/><rect x="${x - 12}" y="44" width="24" height="152" rx="12" fill="url(#glowTube)" ${line}/><path d="M${x - 5} 56V184" stroke="#fff" stroke-width="4" opacity=".75" stroke-linecap="round"/><path d="M${x - 14} 192H${x + 14}V260Q${x} 268 ${x - 14} 260Z" fill="url(#grip)" ${line}/><rect x="${x - 9}" y="208" width="18" height="10" rx="3" fill="${MINT.hairDeep}" ${line}/><path d="M${x - 14} 232H${x + 14}" stroke="#9aa0a8" stroke-width="2"/></g>`;
const lightSticks = svg(
  `<g filter="url(#paper)">
  ${shadow(120, 282, 90, 12)}
  ${stick(92, -9)}${stick(148, 8)}
  <path d="M60 244H180L172 280Q120 290 68 280Z" fill="url(#cup)" ${line}/>
  <ellipse cx="120" cy="244" rx="60" ry="10" fill="#f6efe2" ${line}/>
  <ellipse cx="120" cy="245" rx="48" ry="6" fill="#3b3a48" opacity=".35"/>
  <path d="M84 262Q120 270 156 262" stroke="${MINT.hair}" stroke-width="4" fill="none"/>
  ${star(46, 72, 9, MINT.glow)}${star(196, 58, 7, MINT.glow)}${star(204, 130, 5, '#fff')}
</g>`,
  240,
  300,
  `<linearGradient id="glowTube" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7fe9d6"/><stop offset=".45" stop-color="#d8fff7"/><stop offset="1" stop-color="#55cdb9"/></linearGradient><radialGradient id="halo"><stop offset="0" stop-color="${MINT.glow}" stop-opacity=".75"/><stop offset="1" stop-color="${MINT.glow}" stop-opacity="0"/></radialGradient><linearGradient id="grip" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3f1ec"/><stop offset="1" stop-color="#c9c6be"/></linearGradient><linearGradient id="cup" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${MINT.oak}"/><stop offset=".5" stop-color="#ebd0a8"/><stop offset="1" stop-color="${MINT.oakDeep}"/></linearGradient>`,
);

const headphones = svg(
  `<g filter="url(#paper)" transform="translate(0 14)">
  ${shadow(130, 286, 96, 12)}
  <path d="M60 262Q130 244 200 262L196 280Q130 294 64 280Z" fill="url(#wood)" ${line}/>
  <ellipse cx="130" cy="262" rx="70" ry="14" fill="#e4c79d" ${line}/>
  <rect x="122" y="66" width="16" height="198" rx="6" fill="url(#pole)" ${line}/>
  <path d="M96 76Q130 56 164 76Q166 84 158 84Q130 72 102 84Q94 84 96 76Z" fill="url(#wood)" ${line}/>
  <path d="M58 170Q52 62 130 58Q208 62 202 170" fill="none" stroke="${OUT}" stroke-width="22" stroke-linecap="round"/>
  <path d="M58 170Q52 62 130 58Q208 62 202 170" fill="none" stroke="#40485e" stroke-width="18" stroke-linecap="round"/>
  <path d="M66 150Q64 76 130 70Q196 76 194 150" fill="none" stroke="${MINT.hair}" stroke-width="7" stroke-linecap="round"/>
  <path d="M98 80Q130 66 162 80" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>
  <rect x="34" y="140" width="52" height="84" rx="22" fill="url(#cupL)" ${line}/>
  <rect x="174" y="140" width="52" height="84" rx="22" fill="url(#cupR)" ${line}/>
  <rect x="78" y="150" width="14" height="64" rx="6" fill="#f0e8dc" ${line}/>
  <rect x="168" y="150" width="14" height="64" rx="6" fill="#f0e8dc" ${line}/>
  <circle cx="60" cy="182" r="12" fill="${MINT.tie}" ${line}/><circle cx="200" cy="182" r="12" fill="${MINT.tie}" ${line}/>
  <path d="M54 176Q60 170 66 176" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>
  <path d="M200 224Q214 256 184 266Q164 272 166 286" fill="none" stroke="${OUT}" stroke-width="3.4"/>
</g>`,
  260,
  318,
  `<linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6c9a0"/><stop offset="1" stop-color="${MINT.oakDeep}"/></linearGradient><linearGradient id="pole" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${MINT.oakDeep}"/><stop offset=".5" stop-color="#e6c9a0"/><stop offset="1" stop-color="${MINT.oakDeep}"/></linearGradient><linearGradient id="cupL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2d8c80"/><stop offset=".6" stop-color="${MINT.hair}"/><stop offset="1" stop-color="#57b9ab"/></linearGradient><linearGradient id="cupR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#2d8c80"/><stop offset=".6" stop-color="${MINT.hair}"/><stop offset="1" stop-color="#57b9ab"/></linearGradient>`,
);

/** Cushion front print: the singer's face (also the 3D cushion's texture). */
const cushionFace = svg(
  `<rect width="256" height="256" fill="#eaf8f2"/><g transform="translate(128 150) scale(1.9) translate(-100 -80)"><path d="M68 78Q68 108 100 112Q132 108 132 78Q128 62 100 60Q72 62 68 78Z" fill="url(#face)"/><path d="M60 80Q56 36 100 32Q144 36 140 80L134 70L130 80L122 60L114 76L106 56L98 74L90 56L82 76L76 62L70 78L66 70Z" fill="url(#hair)" ${line}/><ellipse cx="87" cy="86" rx="5.6" ry="7.4" fill="${MINT.eye}"/><ellipse cx="113" cy="86" rx="5.6" ry="7.4" fill="${MINT.eye}"/><circle cx="89" cy="83" r="2.2" fill="#fff"/><circle cx="115" cy="83" r="2.2" fill="#fff"/><ellipse cx="78" cy="97" rx="6" ry="3.4" fill="${MINT.cheek}" opacity=".6"/><ellipse cx="122" cy="97" rx="6" ry="3.4" fill="${MINT.cheek}" opacity=".6"/><path d="M95 99Q100 104 105 99" fill="none" stroke="#b8566a" stroke-width="2" stroke-linecap="round"/></g>`,
  256,
  256,
  SINGER_DEFS,
);
const cushion = svg(
  `<g filter="url(#paper)">
  ${shadow(160, 262, 138, 14)}
  <path d="M50 96Q14 104 10 170Q8 222 30 250Q48 230 58 196Z" fill="url(#hair)" ${line}/>
  <path d="M270 96Q306 104 310 170Q312 222 290 250Q272 230 262 196Z" fill="url(#hair)" ${line}/>
  <path d="M24 170Q22 206 32 234M296 170Q298 206 288 234" stroke="${MINT.hairShade}" stroke-width="2" opacity=".45" fill="none"/>
  <rect x="34" y="86" width="22" height="30" rx="6" transform="rotate(-20 45 101)" fill="${MINT.tie}" ${line}/>
  <rect x="264" y="86" width="22" height="30" rx="6" transform="rotate(20 275 101)" fill="${MINT.tie}" ${line}/>
  <path d="M60 60Q160 36 260 60Q282 150 262 236Q160 262 58 236Q38 150 60 60Z" fill="url(#pillow)" ${line}/>
  <clipPath id="pc"><path d="M60 60Q160 36 260 60Q282 150 262 236Q160 262 58 236Q38 150 60 60Z"/></clipPath>
  <path clip-path="url(#pc)" d="M40 30H280V112Q272 128 262 140L250 116L236 136L222 112L206 132L192 106L178 128L162 102L146 128L132 106L116 132L102 112L88 136L74 116L60 140Q48 128 40 112Z" fill="url(#hair)" ${line}/>
  <path d="M60 60Q160 36 260 60Q282 150 262 236Q160 262 58 236Q38 150 60 60Z" fill="none" ${line}/>
  <ellipse cx="124" cy="168" rx="10" ry="13" fill="${MINT.eye}"/><ellipse cx="196" cy="168" rx="10" ry="13" fill="${MINT.eye}"/>
  <circle cx="128" cy="162" r="4" fill="#fff"/><circle cx="200" cy="162" r="4" fill="#fff"/>
  <ellipse cx="104" cy="192" rx="13" ry="7" fill="${MINT.cheek}" opacity=".55"/><ellipse cx="216" cy="192" rx="13" ry="7" fill="${MINT.cheek}" opacity=".55"/>
  <path d="M150 192Q160 202 170 192" stroke="#b8566a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M84 222Q160 238 236 222" stroke="#c9d9d0" stroke-width="2" fill="none" stroke-dasharray="4 5"/>
  <path d="M86 72Q124 60 160 60" stroke="#c5f5ec" stroke-width="4" fill="none" opacity=".8" stroke-linecap="round"/>
</g>`,
  320,
  280,
  `<radialGradient id="pillow" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#fffaf1"/><stop offset=".75" stop-color="#eee6d6"/><stop offset="1" stop-color="#d8cebb"/></radialGradient>${SINGER_DEFS}`,
);

/** Transparent face features for the 3D cushion (bangs, eyes, blush, smile). */
const cushionFeatures = svg(
  `<path d="M0 0H256V92L240 80L226 104L210 78L194 102L176 76L160 102L144 76L128 104L112 76L96 102L80 76L62 102L46 78L30 104L16 80L0 92Z" fill="${MINT.hair}"/><path d="M0 92L16 80L30 104L46 78L62 102L80 76L96 102L112 76L128 104L144 76L160 102L176 76L194 102L210 78L226 104L240 80L256 92" fill="none" stroke="${MINT.hairShade}" stroke-width="2.4" stroke-linejoin="round" opacity=".55"/><ellipse cx="92" cy="150" rx="15" ry="20" fill="${MINT.eye}"/><ellipse cx="164" cy="150" rx="15" ry="20" fill="${MINT.eye}"/><ellipse cx="92" cy="156" rx="9" ry="11" fill="#1d5a55"/><ellipse cx="164" cy="156" rx="9" ry="11" fill="#1d5a55"/><circle cx="97" cy="142" r="5.5" fill="#fff"/><circle cx="169" cy="142" r="5.5" fill="#fff"/><ellipse cx="62" cy="186" rx="17" ry="9" fill="${MINT.cheek}" opacity=".6"/><ellipse cx="194" cy="186" rx="17" ry="9" fill="${MINT.cheek}" opacity=".6"/><path d="M116 186Q128 198 140 186" stroke="#b8566a" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
  256,
  256,
);
/** Round braided rug seen from above (3D rug texture). */
const rugTop = svg(
  `<g filter="url(#paper)"><circle cx="256" cy="256" r="250" fill="${MINT.hairDeep}"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="256" cy="256" r="${240 - i * 26}" fill="none" stroke="${i % 3 === 0 ? '#f4ecdc' : i % 3 === 1 ? '#7fd8ca' : '#58bfb1'}" stroke-width="16" stroke-dasharray="${i % 2 ? '10 6' : '14 5'}"/>`).join('')}<circle cx="256" cy="256" r="64" fill="#f4ecdc"/>${note(250, 280, 2.2, MINT.hairDeep)}<circle cx="256" cy="256" r="250" fill="none" stroke="#2f8378" stroke-width="5"/></g>`,
  512,
  512,
);
const rug = svg(
  `<g filter="url(#paper)">
  <ellipse cx="200" cy="140" rx="192" ry="102" fill="#2f7f75" opacity=".5"/>
  <image href="${rugTop}" x="8" y="30" width="384" height="204" preserveAspectRatio="none"/>
  <ellipse cx="200" cy="132" rx="192" ry="102" fill="none" stroke="${OUT}" stroke-width="1.6"/>
  <path d="M8 132Q10 148 20 160" fill="none" stroke="${OUT}" stroke-width="1.2" opacity=".5"/>
</g>`,
  400,
  250,
);

const leek = svg(
  `<g filter="url(#paper)">
  ${shadow(170, 196, 150, 14)}
  <path d="M40 150Q30 120 56 104L214 70Q244 64 252 90Q258 116 232 126L78 176Q50 182 40 150Z" fill="url(#stalk)" ${line}/>
  <path d="M214 70Q254 34 318 36Q298 52 278 60Q316 60 332 84Q300 86 270 88Q300 102 306 126Q276 116 248 108Q236 128 232 126" fill="url(#leaf)" ${line}/>
  <path d="M232 76Q268 60 300 52M244 92Q284 84 314 84M240 108Q268 110 294 118" stroke="#2f7a4c" stroke-width="2" fill="none" opacity=".45"/>
  <path d="M42 150Q36 170 28 178M50 160Q48 178 42 188M58 166Q62 184 58 194" stroke="#d9cfae" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M60 116L210 82" stroke="#fff" stroke-width="6" opacity=".55" stroke-linecap="round"/>
  <ellipse cx="116" cy="130" rx="6" ry="8" fill="#3b3a48"/><ellipse cx="156" cy="120" rx="6" ry="8" fill="#3b3a48"/>
  <circle cx="118" cy="127" r="2" fill="#fff"/><circle cx="158" cy="117" r="2" fill="#fff"/>
  <ellipse cx="102" cy="146" rx="10" ry="5.5" fill="${MINT.cheek}" opacity=".6"/><ellipse cx="174" cy="134" rx="10" ry="5.5" fill="${MINT.cheek}" opacity=".6"/>
  <path d="M130 140Q138 146 146 138" stroke="#9c5360" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M196 80Q200 104 206 118" stroke="#8fc9a0" stroke-width="3" fill="none" opacity=".6"/>
</g>`,
  340,
  210,
  `<linearGradient id="stalk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fbf8ef"/><stop offset=".62" stop-color="#eef3e2"/><stop offset=".86" stop-color="#bfe1a8"/><stop offset="1" stop-color="#8fcf86"/></linearGradient><linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fcf7a"/><stop offset="1" stop-color="#3f9a5c"/></linearGradient>`,
);

const miniSinger = (x: number, y: number, s: number, wave = 0) =>
  `<g transform="translate(${x} ${y}) scale(${s})">${singer(wave)}</g>`;
const figureShelf = svg(
  `<g filter="url(#paper)">
  ${shadow(130, 372, 118, 10)}
  <path d="M26 40H234L222 26H38Z" fill="#ead0a8" ${line}/>
  <rect x="26" y="40" width="208" height="324" rx="4" fill="url(#oakV)" ${line}/>
  <rect x="38" y="52" width="184" height="300" fill="url(#back)" ${line}/>
  <g>${[140, 232, 322].map((y) => `<path d="M38 ${y}H222L214 ${y - 8}H46Z" fill="#dff5f0" opacity=".9" ${lw(1)}/><rect x="38" y="${y}" width="184" height="5" fill="#bfe6de" ${lw(1)}/>`).join('')}</g>
  <path d="M40 56H220" stroke="${MINT.glow}" stroke-width="3" opacity=".9"/>
  ${miniSinger(52, 72, 0.3)}${miniSinger(102, 64, 0.34, 3)}${miniSinger(160, 72, 0.3)}
  ${miniSinger(66, 164, 0.3, 2)}${miniSinger(142, 158, 0.34)}
  <g transform="translate(62 280)"><rect width="46" height="46" rx="2" fill="#9fe6d9" ${line}/><circle cx="23" cy="23" r="12" fill="${MINT.navy}"/></g>
  <g transform="translate(118 268)"><rect x="0" y="0" width="30" height="58" rx="15" fill="url(#glowTubeS)" ${line}/></g>
  <g transform="translate(160 286)">${star(20, 20, 18, '#f7d77c')}</g>
  <path d="M40 54L90 350M120 54L170 350" stroke="#fff" stroke-width="6" opacity=".22"/>
  <rect x="38" y="52" width="184" height="300" fill="none" stroke="${OUT}" stroke-width="1.4"/>
  <path d="M130 52V352" stroke="#b28a5c" stroke-width="3" opacity=".6"/>
  <rect x="122" y="190" width="4" height="26" rx="2" fill="${MINT.oakDeep}"/><rect x="134" y="190" width="4" height="26" rx="2" fill="${MINT.oakDeep}"/>
  <path d="M34 364V376M226 364V376" stroke="${OUT}" stroke-width="6" stroke-linecap="round"/>
</g>`,
  260,
  384,
  `<linearGradient id="oakV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${MINT.oakDeep}"/><stop offset=".2" stop-color="${MINT.oak}"/><stop offset=".8" stop-color="#dcbb8d"/><stop offset="1" stop-color="${MINT.oakDeep}"/></linearGradient><linearGradient id="back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f7f2"/><stop offset="1" stop-color="#cfe9e2"/></linearGradient><linearGradient id="glowTubeS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7fe9d6"/><stop offset=".45" stop-color="#d8fff7"/><stop offset="1" stop-color="#55cdb9"/></linearGradient>${SINGER_DEFS}`,
);

/** Catalog art (thumbnails, and the flat wall items in the room). */
export const MIKU_ROOM_ART = {
  // Higgsfield fan-art concert poster in a painted oak frame (ASSETS.md).
  'miku-poster': LOUNGE_ASSETS.bedroom_miku_poster,
  'miku-banner': banner,
  'miku-records': records,
  'miku-acrylic': acrylic,
  'miku-light-sticks': lightSticks,
  'miku-headphones': headphones,
  'miku-cushion': cushion,
  'miku-rug': rug,
  'miku-leek': leek,
  'miku-figure-shelf': figureShelf,
} as const;
/** Flat prints used on the 3D meshes (lounge-bedroom-miku3d.ts). */
export const MIKU_PRINTS = {
  sleeves: SLEEVES,
  acrylic: acrylicPrint,
  cushionFace,
  cushionFeatures,
  rugTop,
} as const;
