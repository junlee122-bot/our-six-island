import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('../', import.meta.url)).replaceAll('\\', '/');
const manifest=fs.readFileSync(path.join(root,'app/game-assets.ts'),'utf8');
const assets=[...manifest.matchAll(/\/assets\/([^']+)/g)].map(match=>match[1]);
if(assets.length!==9||new Set(assets).size!==9)throw new Error('The game asset manifest must include all nine unique atlases.');
const replacements = new Map(assets.map(name => [
  '/assets/' + name,
  'data:image/'+(name.endsWith('.webp')?'webp':'png')+';base64,' + fs.readFileSync(path.join(root, 'public/assets', name)).toString('base64'),
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
      if (!/\/game-assets\.ts$/.test(id)) return;
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
<meta name="description" content="여섯 친구와 호현 촌장의 섬 생활. 집과 상점에 들어가고, 가구를 만들고, 텃밭과 박물관을 가꾸세요. 최대 6명 멀티플레이.">
<title>우리들의 여섯섬</title><style>${css}</style></head>
<body><div id="root"></div><noscript>게임을 실행하려면 브라우저에서 JavaScript를 켜주세요.</noscript>
<script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`;
const directory = path.join(root, 'docs');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'index.html'), html);
fs.writeFileSync(path.join(directory, '.nojekyll'), '');
console.log(`GitHub Pages / offline game: docs/index.html (${Buffer.byteLength(html)} bytes, ${inlined.size} embedded images)`);

