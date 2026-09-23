import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

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
if (assets.length !== 120 || new Set(assets).size !== 120)
  throw new Error('The lounge manifest must include all 120 unique images.');
const modelManifest = fs.readFileSync(
  path.join(root, 'app/lounge-model-assets.ts'),
  'utf8',
);
const models = [...modelManifest.matchAll(/["']\/models\/([^'" ]+)["']/g)].map(
  (match) => match[1],
);
if (models.length !== 2 || new Set(models).size !== 2)
  throw new Error('The room manifest must include both kArchive models.');
const assetDirectory = path.join(root, 'docs/assets');
fs.mkdirSync(assetDirectory, { recursive: true });
const replacements = new Map(
  assets.map((name) => {
    const bytes = fs.readFileSync(path.join(root, 'public/assets', name));
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    const extension = path.extname(name);
    const target =
      name.slice(0, -extension.length).replaceAll('/', '-') +
      '-' +
      hash +
      extension;
    const destination = path.join(assetDirectory, target);
    if (!fs.existsSync(destination)) fs.writeFileSync(destination, bytes);
    return ['/assets/' + name, './assets/' + target];
  }),
);
const inlined = new Set();
for (const name of models) {
  const bytes = fs.readFileSync(path.join(root, 'public/models', name));
  if (
    bytes.toString('ascii', 0, 4) !== 'glTF' ||
    bytes.readUInt32LE(8) !== bytes.length
  )
    throw new Error('Invalid GLB: ' + name);
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const target =
    'model-' +
    name.replaceAll('/', '-').replace(/\.glb$/, '') +
    '-' +
    hash +
    '.glb';
  fs.writeFileSync(path.join(assetDirectory, target), bytes);
  replacements.set('/models/' + name, './assets/' + target);
}
const built = await build({
  configFile: false,
  root,
  publicDir: false,
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [
    react(),
    {
      name: 'versioned-game-art',
      enforce: 'pre',
      transform(code, id) {
        if (
          !id.endsWith('/lounge-assets.ts') &&
          !id.endsWith('/lounge-model-assets.ts')
        )
          return;
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
if (inlined.size !== assets.length + models.length)
  throw new Error('Some game images were not assigned a versioned asset URL.');
// Preserve Supabase's exact base64 whitespace alphabet while escaping the
// minifier's literal tab/newline in the generated HTML source.
const js = chunks[0].code.replaceAll('` \t\n\\r=`', '" \\t\\n\\r="');
const licenses = {
  three: fs.readFileSync(path.join(root, 'node_modules/three/LICENSE'), 'utf8'),
  kArchive: fs.readFileSync(
    path.join(root, 'public/models/lounge/ATTRIBUTION.md'),
    'utf8',
  ),
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
const css = output
  .filter((item) => item.type === 'asset' && item.fileName.endsWith('.css'))
  .map((item) =>
    typeof item.source === 'string'
      ? item.source
      : Buffer.from(item.source).toString('utf8'),
  )
  .join('\n');
if (!css)
  throw new Error('The standalone bundle must include the game styles.');
const html = `<!doctype html>
<html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="일곱 친구의 게임 라운지와 카지노. 캐릭터와 내 방을 꾸미고 체스·고스톱·섯다·홀덤·블랙잭을 공통 화폐 범으로 함께 즐겨 보세요.">
<title>호현지방 · 게임 라운지</title><style>${css}</style></head>
<body><div id="root"></div><noscript>게임을 실행하려면 브라우저에서 JavaScript를 켜주세요.</noscript>
<script type="application/json" id="third-party-licenses">${JSON.stringify(licenses).replaceAll('<', '\\u003c')}</script>
<script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`;
const directory = path.join(root, 'docs');
fs.mkdirSync(directory, { recursive: true });
// Keep the last working page intact until the complete replacement is on disk.
const nextPage = path.join(directory, `.index-${process.pid}.tmp`);
fs.writeFileSync(nextPage, html);
for (let attempt = 0; ; attempt++) {
  try {
    fs.renameSync(nextPage, path.join(directory, 'index.html'));
    break;
  } catch (error) {
    if (attempt >= 19) throw error;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
if (!fs.existsSync(path.join(directory, '.nojekyll')))
  fs.writeFileSync(path.join(directory, '.nojekyll'), '');
console.log(
  `GitHub Pages: docs/index.html (${Buffer.byteLength(html)} bytes, ${assets.length} images + ${models.length} models cached separately)`,
);
