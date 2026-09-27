// Builds the bundled Korean web fonts (app/ui/fonts/*.woff2 + app/ui/fonts.css).
//
//   npm run fonts
//
// Three voices (SIL Open Font License 1.1, see licenses/):
//   Jua         display  — window titles, signs, big numbers
//   Pretendard  body     — text, buttons, tables (400 / 600 / 700)
//   Gaegu       hand     — letters, notes, news (400 / 700)
//
// Each face is split in two unicode-range files so the first screen downloads
// only what the game's own copy uses:
//   core  ASCII + Latin-1 punctuation + symbols + every Hangul syllable/jamo that
//         appears in app/**/*.ts(x) (window titles, buttons, help text …)
//   ext   the rest of KS X 1001's 2,350 common syllables (player-typed chat,
//         letters, names). The browser fetches it only when such a glyph shows.
// Anything outside both falls back to the next family (Malgun Gothic etc.).
//
// Source fonts are downloaded once into node_modules/.cache/bumtadew-fonts from
// the upstream OFL releases (google/fonts, Pretendard on npm via jsDelivr).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = fileURLToPath(new URL('../', import.meta.url));
const cache = path.join(root, 'node_modules/.cache/bumtadew-fonts');
const outDir = path.join(root, 'app/ui/fonts');
fs.mkdirSync(cache, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
// Pretendard carries a Reserved Font Name, and the OFL forbids that name on a
// modified (e.g. re-subsetted) font. So Pretendard ships as the author's own
// published KS X 1001 + Latin subset, byte for byte (`asIs`); only Jua and
// Gaegu (no reserved name) are subset here.
const PRETENDARD = 'https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/woff2-subset';
const FACES = [
  { family: 'Pretendard', weight: 400, url: `${PRETENDARD}/Pretendard-Regular.subset.woff2`, file: 'pretendard-400', asIs: true },
  { family: 'Pretendard', weight: 600, url: `${PRETENDARD}/Pretendard-SemiBold.subset.woff2`, file: 'pretendard-600', asIs: true },
  { family: 'Pretendard', weight: 700, url: `${PRETENDARD}/Pretendard-Bold.subset.woff2`, file: 'pretendard-700', asIs: true },
  { family: 'Jua', weight: 400, url: `${GF}/jua/Jua-Regular.ttf`, file: 'jua-400' },
  { family: 'Gaegu', weight: 400, url: `${GF}/gaegu/Gaegu-Regular.ttf`, file: 'gaegu-400' },
  { family: 'Gaegu', weight: 700, url: `${GF}/gaegu/Gaegu-Bold.ttf`, file: 'gaegu-700' },
];

async function source(url) {
  const file = path.join(cache, path.basename(url));
  if (!fs.existsSync(file)) {
    console.log('download', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return fs.readFileSync(file);
}

// ---- character sets ------------------------------------------------------------
const ksx = (() => {
  const decoder = new TextDecoder('euc-kr');
  let s = '';
  for (let a = 0xb0; a <= 0xc8; a++) for (let b = 0xa1; b <= 0xfe; b++) s += decoder.decode(new Uint8Array([a, b]));
  return new Set(Array.from(s).filter((c) => c >= '가' && c <= '힣'));
})();
function sourceChars(dir) {
  const set = new Set();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'fonts') for (const c of sourceChars(p)) set.add(c);
    } else if (/\.(tsx?|json)$/.test(entry.name)) {
      // Comments are not on screen: leave them out of the core set.
      const text = fs
        .readFileSync(p, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[\s;{}(),])\/\/.*$/gm, '$1');
      for (const c of text) set.add(c);
    }
  }
  return set;
}
const inApp = sourceChars(path.join(root, 'app'));
const HANGUL = (c) => (c >= '가' && c <= '힣') || (c >= 'ㄱ' && c <= 'ㆎ');
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i));
const base = [
  ...range(0x20, 0x7e), // ASCII
  ...range(0xa0, 0xff), // Latin-1 (·, ×, ©, é …)
  ...range(0x2010, 0x2027), // dashes, quotes, bullets, ellipsis
  ...range(0x2030, 0x203a),
  ...range(0x2190, 0x2199), // arrows (key hints)
  ...range(0x2460, 0x2473), // ①–⑳
  ...range(0x25a0, 0x25ff), // shapes ● ○ ■ □ ▲ ▶ ◆
  ...range(0x2600, 0x2667), // ★ ☆ ♥ ♠ ♣ ♦
  ...range(0x3000, 0x3015), // CJK punctuation 「」〈〉
  '₩', // ₩
];
// Symbols the copy uses beyond the base ranges (not emoji: fonts don't draw those).
const extraSymbols = [...inApp].filter((c) => !HANGUL(c) && c.codePointAt(0) > 0xff && c.codePointAt(0) < 0x3100);
const coreHangul = [...inApp].filter(HANGUL);
const core = [...new Set([...base, ...extraSymbols, ...coreHangul])].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
const coreSet = new Set(core);
const ext = [...ksx, ...range(0x3131, 0x318e)].filter((c) => !coreSet.has(c)).sort();

/** Compact CSS unicode-range for a set of characters. */
function unicodeRange(chars) {
  const cps = [...new Set(chars.map((c) => c.codePointAt(0)))].sort((a, b) => a - b);
  const parts = [];
  for (let i = 0; i < cps.length; ) {
    let j = i;
    while (j + 1 < cps.length && cps[j + 1] === cps[j] + 1) j++;
    const hex = (n) => n.toString(16).toUpperCase();
    parts.push(i === j ? `U+${hex(cps[i])}` : `U+${hex(cps[i])}-${hex(cps[j])}`);
    i = j + 1;
  }
  return parts.join(', ');
}

// ---- build --------------------------------------------------------------------
const report = [];
const faces = [];
// Both files of a face claim the whole Hangul block. Faces sharing a family are
// tried last-declared first, so the browser downloads core, and fetches ext only
// for a syllable core does not contain (Chrome and WebKit both do this). Keeps
// the stylesheet small instead of listing ~1,000 code points.
const HANGUL_RANGE = 'U+3131-318E, U+AC00-D7A3';
const coreRange = unicodeRange(core.filter((c) => !HANGUL(c))) + ', ' + HANGUL_RANGE;
for (const face of FACES) {
  const font = await source(face.url);
  const rule = (name, range) =>
    `@font-face {\n  font-family: '${face.family}';\n  font-style: normal;\n  font-weight: ${face.weight};\n  font-display: swap;\n  src: url('./fonts/${name}') format('woff2');${range ? `\n  unicode-range: ${range};` : ''}\n}`;
  if (face.asIs) {
    const name = `${face.file}.woff2`;
    fs.writeFileSync(path.join(outDir, name), font);
    report.push([name, font.length]);
    faces.push(rule(name, ''));
    continue;
  }
  for (const [part, chars] of [['ext', ext], ['core', core]]) {
    const woff2 = await subsetFont(font, chars.join(''), { targetFormat: 'woff2' });
    const name = `${face.file}-${String(part)}.woff2`;
    fs.writeFileSync(path.join(outDir, name), woff2);
    report.push([name, woff2.length]);
    faces.push(rule(name, part === 'core' ? coreRange : HANGUL_RANGE));
  }
}
const css = `/* GENERATED by scripts/build-fonts.mjs — do not edit by hand (npm run fonts).
   Jua, Pretendard, Gaegu: SIL Open Font License 1.1 (licenses/OFL-*.txt).
   Pretendard: the author's KS X 1001 subset, unmodified (Reserved Font Name).
   Jua / Gaegu core = ASCII/symbols + the ${coreHangul.length} Hangul characters used in app/ copy;
   ext = the rest of KS X 1001 (${ext.length} characters), fetched only when needed. */
${faces.join('\n')}
`;
fs.writeFileSync(path.join(root, 'app/ui/fonts.css'), css);
fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify({ core: core.join(''), files: Object.fromEntries(report) }, null, 1) + '\n',
);
const kb = (n) => (n / 1024).toFixed(1) + 'KB';
for (const [name, size] of report) console.log(name.padEnd(28), kb(size));
const sum = (re) => report.filter(([n]) => re.test(n)).reduce((s, [, n]) => s + n, 0);
console.log(`core total ${kb(sum(/core/))}, ext total ${kb(sum(/ext/))}, all ${kb(sum(/./))}`);
console.log(`core Hangul ${coreHangul.length}, ext ${ext.length}`);
