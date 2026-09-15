import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('../', import.meta.url)).replaceAll(
  '\\',
  '/',
);
const manifest = fs.readFileSync(
  path.join(root, 'app/lounge-assets.ts'),
  'utf8',
);
const assets = [...manifest.matchAll(/["']\/assets\/([^'"]+)["']/g)].map(
  (match) => match[1],
);
if (assets.length !== 68 || new Set(assets).size !== 68)
  throw new Error('The lounge manifest must include all 68 unique images.');
const replacements = new Map(
  assets.map((name) => [
    '/assets/' + name,
    'data:image/' +
      (name.endsWith('.svg')
        ? 'svg+xml'
        : name.endsWith('.webp')
          ? 'webp'
          : 'png') +
      ';base64,' +
      fs
        .readFileSync(path.join(root, 'public/assets', name))
        .toString('base64'),
  ]),
);
const inlined = new Set();
const built = await build({
  configFile: false,
  root,
  publicDir: false,
  plugins: [
    react(),
    {
      name: 'inline-game-art',
      enforce: 'pre',
      transform(code, id) {
        if (!/\/lounge-assets\.ts$/.test(id)) return;
        for (const [from, to] of replacements) {
          if (code.includes(from)) {
            inlined.add(from);
            code = code.replaceAll(from, to);
          }
        }
        return code;
      },
    },
  ],
  resolve: { alias: { '@': root } },
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    write: false,
    lib: {
      entry: fileURLToPath(new URL('./standalone-entry.tsx', import.meta.url)),
      name: 'HohyeonGameClub',
      formats: ['iife'],
    },
    minify: true,
  },
});
const output = (Array.isArray(built) ? built[0] : built).output;
const chunks = output.filter((item) => item.type === 'chunk');
if (
  chunks.length !== 1 ||
  chunks[0].imports.length ||
  chunks[0].dynamicImports.length
) {
  throw new Error(
    'Standalone game must contain exactly one self-contained script.',
  );
}
if (inlined.size !== assets.length)
  throw new Error('Some game images were not embedded.');
const js = chunks[0].code;
const licenses = {
  chessRules: fs.readFileSync(
    path.join(root, 'node_modules/chess.js/LICENSE'),
    'utf8',
  ),
  chessArt: fs.readFileSync(
    path.join(root, 'public/assets/lounge/CHESSNUT-LICENSE.txt'),
    'utf8',
  ),
  chessCopyright: fs.readFileSync(
    path.join(root, 'public/assets/lounge/CHESSNUT-COPYRIGHT.txt'),
    'utf8',
  ),
  hwatu: fs.readFileSync(
    path.join(root, 'public/assets/lounge/HWATU-ATTRIBUTION.txt'),
    'utf8',
  ),
};
const cssRoot = path.join(root, 'dist/client/_next/static/css');
const css = fs
  .readdirSync(cssRoot)
  .filter((name) => name.endsWith('.css'))
  .map((name) => fs.readFileSync(path.join(cssRoot, name), 'utf8'))
  .join('\n');
if (!css)
  throw new Error('Run the production build before packaging for Pages.');
const html = `<!doctype html>
<html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="일곱 친구의 게임 라운지. 2D 캐릭터를 꾸미고, 초대장을 보내 함께 체스와 고스톱을 즐겨 보세요.">
<title>호현지방 · 게임 라운지</title><style>${css}</style></head>
<body><div id="root"></div><noscript>게임을 실행하려면 브라우저에서 JavaScript를 켜주세요.</noscript>
<script type="application/json" id="third-party-licenses">${JSON.stringify(licenses).replaceAll('<', '\\u003c')}</script>
<script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`;
const directory = path.join(root, 'docs');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'index.html'), html);
fs.writeFileSync(path.join(directory, '.nojekyll'), '');
console.log(
  `GitHub Pages / offline game: docs/index.html (${Buffer.byteLength(html)} bytes, ${inlined.size} embedded images)`,
);
