// Design tokens (app/ui/tokens.css), bundled fonts and the CSS token lint.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { lintAll, lintCss, regressions } from '../scripts/css-lint.mjs';

const tokens = fs.readFileSync(new URL('../app/ui/tokens.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Custom properties of one block (`:root` or `[data-venue='x']`). */
function block(selector) {
  const start = tokens.indexOf(selector + ' {');
  assert.ok(start >= 0, selector);
  const body = tokens.slice(start, tokens.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
const ROOT = block(':root');
const venue = (name) => ({ ...ROOT, ...(name ? block(`[data-venue='${name}']`) : {}) });
function resolve(vars, value, depth = 0) {
  const m = value.match(/^var\((--[\w-]+)\)$/);
  if (m && depth < 8) return resolve(vars, vars[m[1]] ?? ROOT[m[1]], depth + 1);
  return value;
}
function rgb(value) {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16));
  throw new Error('not an opaque colour: ' + value);
}
function contrast(a, b) {
  const lum = (c) => {
    const [r, g, bl] = c.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const PAIRS = [
  ['--text', '--surface', 4.5],
  ['--text', '--surface-raised', 4.5],
  ['--text', '--surface-sunken', 4.5],
  ['--text-soft', '--surface', 4.5],
  ['--text-soft', '--surface-raised', 4.5],
  ['--text-soft', '--surface-sunken', 4.5],
  ['--text-on-accent', '--accent', 4.5],
  ['--text-on-highlight', '--highlight-soft', 4.5],
  ['--text-on-frame', '--frame', 4.5],
  ['--disabled-text', '--disabled-bg', 4.5],
  ['--keycap-text', '--keycap-bg', 4.5],
  ['--focus', '--surface', 3],
  ['--rarity-common-ink', '--rarity-common', 4.5],
  ['--rarity-uncommon-ink', '--rarity-uncommon', 4.5],
  ['--rarity-rare-ink', '--rarity-rare', 4.5],
  ['--rarity-legend-ink', '--rarity-legend', 4.5],
];

for (const v of [null, 'hall', 'casino', 'tavern']) {
  test(`${v ?? 'village'} tokens meet contrast targets`, () => {
    const vars = venue(v);
    for (const [fg, bg, need] of PAIRS) {
      const ratio = contrast(resolve(vars, vars[fg]), resolve(vars, vars[bg]));
      assert.ok(ratio >= need, `${fg} on ${bg}: ${ratio.toFixed(2)} < ${need}`);
    }
  });
}

test('type scale has six steps and none below 12px', () => {
  const steps = Object.entries(ROOT).filter(([k]) => k.startsWith('--fs-'));
  assert.equal(steps.length, 6);
  for (const [k, v] of steps) assert.ok(parseFloat(v) >= 12, k);
});

test('toast and focus stay readable in the village', () => {
  assert.ok(contrast(resolve(ROOT, ROOT['--toast-text']), resolve(ROOT, ROOT['--toast-bg'])) >= 7);
});

test('bundled fonts: every Hangul character in app copy is in a core subset', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../app/ui/fonts/manifest.json', import.meta.url), 'utf8'));
  const core = new Set(manifest.core);
  const missing = new Set();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name)) {
        const text = fs.readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[\s;{}(),])\/\/.*$/gm, '$1');
        for (const c of text) if (c >= '가' && c <= '힣' && !core.has(c)) missing.add(c);
      }
    }
  };
  walk(new URL('../app/', import.meta.url));
  // A new syllable still renders (from the ext file or the fallback font), but
  // the first screen would fetch an extra file: rerun `npm run fonts`.
  assert.ok(missing.size <= 40, `run npm run fonts — not in the core subset: ${[...missing].join('')}`);
  const total = Object.values(manifest.files).reduce((s, n) => s + n, 0);
  assert.ok(total < 2.2 * 1024 * 1024, 'font payload budget (all files) 2.2MB');
  for (const [name, size] of Object.entries(manifest.files)) assert.ok(size < 360 * 1024, `${name} over 360KB`);
});

test('css lint: rules catch raw values and accept tokens', () => {
  const found = lintCss(
    '.a { color: #fff; font-size: 11px; border-radius: 7px; box-shadow: 0 1px 0 red; z-index: 12; }\n' +
      '.b { color: var(--text); font: 600 var(--fs-body)/1 var(--font-body); border-radius: var(--r-m) var(--r-m) 0 0; box-shadow: var(--lift-1), var(--edge-press); z-index: var(--z-hud); }\n' +
      '.c { font: 700 12px/10px x; color: #000; /* lint-allow: test */ }',
    'app/x.css',
  );
  assert.deepEqual(found.map((f) => f.rule).sort((a, b) => a.localeCompare(b)), ['font', 'hex', 'radius', 'shadow', 'z']);
  assert.equal(lintCss(':root { --a: #fff; }', 'app/ui/tokens.css').length, 0);
});

test('css lint: no regressions against scripts/css-lint-baseline.json', () => {
  const problems = regressions(lintAll());
  assert.deepEqual(problems, [], problems.join('\n'));
});
