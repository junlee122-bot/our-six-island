// Builds the static GitHub Pages site.
//
//   node scripts/build-standalone.mjs              # -> docs/ (current Pages source)
//   node scripts/build-standalone.mjs --out /tmp/x # -> any scratch directory
//
// Output: one index.html entry plus content-hashed files under <out>/assets/
// (entry JS, lazily imported chunks, CSS, images, models). Asset lists come from
// app/lounge-assets.ts and app/lounge-model-assets.ts — nothing is hardcoded here.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url)).replaceAll('\\', '/');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

// ---- options -------------------------------------------------------------
function option(name) {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index >= 0) {
    if (!args[index + 1] || args[index + 1].startsWith('--'))
      throw new Error(`${name} needs a value`);
    return args[index + 1];
  }
  const inline = args.find((arg) => arg.startsWith(name + '='));
  return inline?.slice(name.length + 1);
}
const outDirectory = path.resolve(root, option('--out') ?? process.env.PAGES_OUT ?? 'docs');
// Absolute base URL for Open Graph images (link previews need absolute URLs).
const siteUrl = (option('--site-url') ?? pkg.homepage ?? '').replace(/\/?$/, '/');
const assetDirectory = path.join(outDirectory, 'assets');
fs.mkdirSync(assetDirectory, { recursive: true });

const TITLE = '범타듀 밸리 · 일곱 친구의 마을';
const DESCRIPTION =
  '일곱 친구가 사는 호현지방의 3D 마을, 범타듀 밸리. 골목을 산책하고 회관·카지노·분장실·내 방에서 함께 놀아요.';
const THEME_COLOR = '#5f8a55';

// ---- budgets -------------------------------------------------------------
const KB = 1024;
const IMAGE_WARN_BYTES = 600 * KB;
const IMAGE_FAIL_BYTES = 3 * KB * KB;
const IMAGE_MAX_SIDE = 4096;
const MODEL_WARN_BYTES = 1024 * KB;
const MODEL_FAIL_BYTES = 4 * KB * KB;
// Character atlases whose size is expected: lossless (exact RGB for dye/keying) or
// many-frame sheets. They skip the per-image budget but still have a hard cap.
const ATLAS_EXCEPTIONS = new Set([
  'friends-motion.webp',
  'accessories.webp',
  'hohyeon-friend.webp',
  'lounge/akatsuki-atlas.webp',
  'lounge/dowon-shampoo-atlas.webp',
  'lounge/daowon-buns.webp',
  'lounge/daowon-outfits.webp',
  'lounge/hachimaki.webp',
  'lounge/club-friends-classic.webp',
  'lounge/club-friends-street.webp',
  'lounge/club-friends-smart.webp',
  'lounge/motion/dowon.webp',
  'lounge/motion/gangjae.webp',
  'lounge/motion/minseo.webp',
  'lounge/motion/seungjun.webp',
  'lounge/motion/minjae.webp',
  'lounge/motion/jaemin.webp',
  'lounge/motion/hohyeon.webp',
]);
const ATLAS_HARD_CAP = 8 * KB * KB;
const warnings = [];

// ---- asset manifests -----------------------------------------------------
function manifestPaths(file, prefix) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const pattern = new RegExp(`["']/${prefix}/([^'" ]+)["']`, 'g');
  const found = [...source.matchAll(pattern)].map((match) => match[1]);
  const duplicates = found.filter((name, i) => found.indexOf(name) !== i);
  if (!found.length) throw new Error(`${file} lists no /${prefix}/ files.`);
  if (duplicates.length)
    throw new Error(`${file} lists duplicates: ${[...new Set(duplicates)].join(', ')}`);
  const missing = found.filter(
    (name) => !fs.existsSync(path.join(root, 'public', prefix, name)),
  );
  if (missing.length)
    throw new Error(`${file} references missing files: ${missing.join(', ')}`);
  return found;
}
const images = manifestPaths('app/lounge-assets.ts', 'assets');
const models = manifestPaths('app/lounge-model-assets.ts', 'models');

function hashed(bytes, name, prefix = '') {
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const extension = path.extname(name);
  return (
    prefix + name.slice(0, -extension.length).replaceAll('/', '-') + '-' + hash + extension
  );
}
function writeOnce(target, bytes) {
  const destination = path.join(assetDirectory, target);
  if (!fs.existsSync(destination)) fs.writeFileSync(destination, bytes);
  return './assets/' + target;
}

const replacements = new Map();
let imageBytes = 0;
for (const name of images) {
  const bytes = fs.readFileSync(path.join(root, 'public/assets', name));
  imageBytes += bytes.length;
  if (!name.endsWith('.svg')) {
    const { width, height } = await sharp(bytes).metadata();
    const exempt = ATLAS_EXCEPTIONS.has(name);
    const size = `${Math.round(bytes.length / KB)}KB ${width}x${height}`;
    if (exempt ? bytes.length > ATLAS_HARD_CAP : bytes.length > IMAGE_FAIL_BYTES)
      throw new Error(
        `Image over budget (${size}): ${name}. Re-encode it (scripts/optimize-assets.mjs) or add it to ATLAS_EXCEPTIONS with a reason.`,
      );
    if (!exempt && bytes.length > IMAGE_WARN_BYTES)
      warnings.push(`image ${name} is ${size} (budget ${IMAGE_WARN_BYTES / KB}KB)`);
    if (!exempt && Math.max(width, height) > IMAGE_MAX_SIDE)
      warnings.push(`image ${name} is ${width}x${height} (max side ${IMAGE_MAX_SIDE})`);
  }
  replacements.set('/assets/' + name, writeOnce(hashed(bytes, name), bytes));
}
let modelBytes = 0;
for (const name of models) {
  const bytes = fs.readFileSync(path.join(root, 'public/models', name));
  modelBytes += bytes.length;
  if (bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(8) !== bytes.length)
    throw new Error('Invalid GLB: ' + name);
  if (bytes.length > MODEL_FAIL_BYTES)
    throw new Error(`Model over budget (${Math.round(bytes.length / KB)}KB): ${name}`);
  if (bytes.length > MODEL_WARN_BYTES)
    warnings.push(`model ${name} is ${Math.round(bytes.length / KB)}KB`);
  replacements.set('/models/' + name, writeOnce(hashed(bytes, name, 'model-'), bytes));
}

// Optional location music (app/lounge-music-tracks.ts, ASSETS.md → 장소 배경음):
// files that exist are content-hashed; absent ones become '' so the game keeps
// the music box there instead of fetching a missing file.
const MUSIC_FAIL_BYTES = 12 * KB * KB;
const musicSource = fs.readFileSync(path.join(root, 'app/lounge-music-tracks.ts'), 'utf8');
const musicFiles = [...musicSource.matchAll(/["']\/assets\/(lounge\/music\/[^'" ]+)["']/g)].map(
  (match) => match[1],
);
// Recorded sound effects (app/lounge-sfx-files.ts), handled like the music files.
const sfxSource = fs.readFileSync(path.join(root, 'app/lounge-sfx-files.ts'), 'utf8');
for (const [, name] of sfxSource.matchAll(/["']\/assets\/(lounge\/sfx\/[^'" ]+)["']/g))
  musicFiles.push(name);
let musicBytes = 0,
  musicCount = 0;
for (const name of musicFiles) {
  const file = path.join(root, 'public/assets', name);
  if (!fs.existsSync(file)) {
    replacements.set('/assets/' + name, '');
    continue;
  }
  const bytes = fs.readFileSync(file);
  if (bytes.length > MUSIC_FAIL_BYTES)
    throw new Error(`Music over budget (${Math.round(bytes.length / KB)}KB): ${name}`);
  musicBytes += bytes.length;
  musicCount++;
  replacements.set('/assets/' + name, writeOnce(hashed(bytes, name), bytes));
}

// Site furniture (favicon, install icons, Open Graph card) — stable names.
const siteFiles = {
  'favicon.svg': 'public/favicon.svg',
  'icons/icon-192.png': 'public/icons/icon-192.png',
  'icons/icon-512.png': 'public/icons/icon-512.png',
};
for (const [target, source] of Object.entries(siteFiles)) {
  fs.mkdirSync(path.dirname(path.join(outDirectory, target)), { recursive: true });
  fs.copyFileSync(path.join(root, source), path.join(outDirectory, target));
}
const ogBytes = fs.readFileSync(path.join(root, 'public/og-image.webp'));
const ogImage = writeOnce(hashed(ogBytes, 'og-image.webp'), ogBytes);
// No web manifest / home-screen metadata: 범타듀 밸리 is a PC game (phones see
// the PC-only screen), and the desktop app is the installable version.

// ---- bundle --------------------------------------------------------------
const rewritten = new Set();
const built = await build({
  configFile: false,
  root,
  base: './',
  publicDir: false,
  logLevel: 'warn',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [
    react(),
    {
      name: 'versioned-game-art',
      enforce: 'pre',
      transform(code, id) {
        if (
          !id.endsWith('/lounge-assets.ts') &&
          !id.endsWith('/lounge-model-assets.ts') &&
          !id.endsWith('/lounge-music-tracks.ts') &&
          !id.endsWith('/lounge-sfx-files.ts')
        )
          return;
        for (const [from, to] of replacements) {
          if (code.includes(from)) {
            rewritten.add(from);
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
    target: 'es2020',
    minify: true,
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    assetsDir: 'assets',
    chunkSizeWarningLimit: 2048,
    rolldownOptions: {
      input: fileURLToPath(new URL('./standalone-entry.tsx', import.meta.url)),
      output: {
        format: 'es',
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Libraries change rarely: keep them in their own long-lived chunks so a
        // game-code release does not make every visitor re-download them.
        advancedChunks: {
          groups: [
            { name: 'vendor-three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'vendor-supabase', test: /node_modules[\\/]@supabase[\\/]/ },
          ],
        },
      },
    },
  },
});
const output = (Array.isArray(built) ? built[0] : built).output;
const unassigned = [...replacements.keys()].filter((from) => !rewritten.has(from));
if (unassigned.length)
  throw new Error('Assets were not assigned a versioned URL: ' + unassigned.join(', '));
const entry = output.find((item) => item.type === 'chunk' && item.isEntry);
if (!entry) throw new Error('The build produced no entry chunk.');
for (const item of output) {
  const destination = path.join(outDirectory, item.fileName);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, item.type === 'chunk' ? item.code : item.source);
}
// Stylesheets the first screen needs: the entry's CSS plus its static imports'.
const initialCss = new Set();
const initialJs = new Set();
const byName = new Map(output.map((item) => [item.fileName, item]));
(function collect(chunk) {
  for (const css of chunk.viteMetadata?.importedCss ?? []) initialCss.add(css);
  for (const name of chunk.imports) {
    if (initialJs.has(name)) continue;
    initialJs.add(name);
    const next = byName.get(name);
    if (next?.type === 'chunk') collect(next);
  }
})(entry);
if (!initialCss.size) throw new Error('The build must include the game styles.');
const lazyChunks = output.filter((item) => item.type === 'chunk' && !item.isEntry);

// ---- licenses and page ---------------------------------------------------
const licenses = {
  three: fs.readFileSync(path.join(root, 'node_modules/three/LICENSE'), 'utf8'),
  kArchive: fs.readFileSync(path.join(root, 'public/models/lounge/ATTRIBUTION.md'), 'utf8'),
  chessRules: fs.readFileSync(path.join(root, 'node_modules/chess.js/LICENSE'), 'utf8'),
  chessArt: fs.readFileSync(path.join(root, 'public/assets/lounge/CHESSNUT-LICENSE.txt'), 'utf8'),
  chessCopyright: fs.readFileSync(
    path.join(root, 'public/assets/lounge/CHESSNUT-COPYRIGHT.txt'),
    'utf8',
  ),
  hwatu: fs.readFileSync(path.join(root, 'public/assets/lounge/HWATU-ATTRIBUTION.txt'), 'utf8'),
};
const escapeAttribute = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const absolute = (relative) => (siteUrl !== '/' ? siteUrl + relative.replace(/^\.\//, '') : relative);
const html = `<!doctype html>
<html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${TITLE}</title>
<meta name="description" content="${escapeAttribute(DESCRIPTION)}">
<meta name="theme-color" content="${THEME_COLOR}">
<link rel="icon" href="./favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="범타듀 밸리">
<meta property="og:title" content="범타듀 밸리">
<meta property="og:description" content="${escapeAttribute(DESCRIPTION)}">
${siteUrl !== '/' ? `<meta property="og:url" content="${escapeAttribute(siteUrl)}">\n` : ''}<meta property="og:image" content="${escapeAttribute(absolute(ogImage))}">
<meta property="og:image:type" content="image/webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="범타듀 밸리의 일곱 친구">
<meta name="twitter:card" content="summary_large_image">
${[...initialCss].map((css) => `<link rel="stylesheet" href="./${css}">`).join('\n')}
${[...initialJs].map((js) => `<link rel="modulepreload" href="./${js}">`).join('\n')}
<script type="module" src="./${entry.fileName}"></script>
</head>
<body><div id="root"></div><noscript>게임을 실행하려면 브라우저에서 JavaScript를 켜주세요.</noscript>
<script type="application/json" id="third-party-licenses">${JSON.stringify(licenses).replaceAll('<', '\\u003c')}</script>
</body></html>
`.replace(/\n{2,}/g, '\n');

// Keep the last working page intact until the complete replacement is on disk
// (every file it references is already written above).
const nextPage = path.join(outDirectory, `.index-${process.pid}.tmp`);
fs.writeFileSync(nextPage, html);
for (let attempt = 0; ; attempt++) {
  try {
    fs.renameSync(nextPage, path.join(outDirectory, 'index.html'));
    break;
  } catch (error) {
    if (attempt >= 19) throw error;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
if (!fs.existsSync(path.join(outDirectory, '.nojekyll')))
  fs.writeFileSync(path.join(outDirectory, '.nojekyll'), '');

// Every relative URL the page references must exist in the output.
for (const [, url] of html.matchAll(/(?:href|src)="\.\/([^"]+)"/g))
  if (!fs.existsSync(path.join(outDirectory, url)))
    throw new Error('index.html references a missing file: ' + url);

const kb = (n) => `${Math.round(n / KB)}KB`;
const jsBytes = output
  .filter((item) => item.type === 'chunk')
  .reduce((sum, item) => sum + Buffer.byteLength(item.code), 0);
for (const warning of warnings) console.warn('budget warning: ' + warning);
console.log(
  [
    `Pages build: ${path.relative(root, outDirectory) || '.'}/index.html (${kb(Buffer.byteLength(html))})`,
    `  entry ${entry.fileName} ${kb(Buffer.byteLength(entry.code))}, ${lazyChunks.length} other chunk(s), JS total ${kb(jsBytes)}, CSS ${[...initialCss].join(', ')}`,
    `  ${images.length} images (${kb(imageBytes)}) + ${models.length} models (${kb(modelBytes)}) + ${musicCount} music (${kb(musicBytes)}) as content-hashed files`,
  ].join('\n'),
);
