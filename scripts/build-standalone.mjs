import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('../', import.meta.url)).replaceAll('\\', '/');
const assets = ['island.png', 'friends-v2.png'];
const replacements = new Map(assets.map(name => [
  '/assets/' + name,
  'data:image/png;base64,' + fs.readFileSync(path.join(root, 'public/assets', name)).toString('base64'),
]));
const inlined = new Set();
const built = await build({
  configFile: false,
  root,
  publicDir: false,
  plugins: [react(), {
    name: 'inline-game-art',
    enforce: 'pre',
    transform(code, id) {
      if (!/\/(world|sprite-sheet)\.tsx?$/.test(id)) return;
      for (const [from, to] of replacements) {
        if (code.includes(from)) {
          inlined.add(from);
          code = code.replaceAll(from, to);
        }
      }
      return code;
    },
  }],
  resolve: { alias: { '@': root } },
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    write: false,
    lib: {
      entry: fileURLToPath(new URL('./standalone-entry.tsx', import.meta.url)),
      name: 'SixIsland',
      formats: ['iife'],
    },
    minify: true,
  },
});
const output = (Array.isArray(built) ? built[0] : built).output;
const chunks = output.filter(item => item.type === 'chunk');
if (chunks.length !== 1 || chunks[0].imports.length || chunks[0].dynamicImports.length) {
  throw new Error('Standalone game must contain exactly one self-contained script.');
}
if (inlined.size !== assets.length) throw new Error('Some game images were not embedded.');
const js = chunks[0].code;
const cssRoot = path.join(root, 'dist/client/_next/static/css');
const css = fs.readdirSync(cssRoot).filter(name => name.endsWith('.css'))
  .map(name => fs.readFileSync(path.join(cssRoot, name), 'utf8')).join('\n');
if (!css) throw new Error('Run the production build before packaging for Pages.');
const html = `<!doctype html>
<html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="도원, 강재, 민서, 승준, 민재, 재민과 함께하는 작은 섬 생활 게임. 산책하고, 낚시하고, 함께 소풍을 준비하세요.">
<title>우리들의 여섯섬</title><style>${css}</style></head>
<body><div id="root"></div><noscript>게임을 실행하려면 브라우저에서 JavaScript를 켜주세요.</noscript>
<script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`;
const directory = path.join(root, 'docs');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'index.html'), html);
fs.writeFileSync(path.join(directory, '.nojekyll'), '');
console.log(`GitHub Pages / offline game: docs/index.html (${Buffer.byteLength(html)} bytes, ${inlined.size} embedded images)`);
