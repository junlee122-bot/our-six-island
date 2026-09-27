// CSS design-token lint (app/**/*.css).
//
//   npm run lint:css                    # report: counts per file and rule
//   npm run lint:css -- --ci            # fail on regressions (CI, tests/css-lint.test.mjs)
//   npm run lint:css -- --update-baseline   # after migrating a file, lower its baseline
//   npm run lint:css -- --file app/ui/ui.css  # list every finding in one file
//
// Rules (the token layer lives in app/ui/tokens.css):
//   hex       raw #hex colours outside the token file (use var(--…) tokens)
//   font      font-size below 12px (px/rem literals, also in the `font:` shorthand)
//   radius    border-radius other than 0, 50%, inherit or var(--r-*)
//   shadow    box-shadow other than none or var(--lift-*/--edge-*/--ring-*) tokens
//   z         z-index other than auto, 0, -1 or var(--z-*)
// A line ending in `/* lint-allow: <reason> */` is skipped.
//
// Modes: files listed in scripts/css-lint-baseline.json keep their recorded
// count per rule and only fail when it goes UP ("report" mode for the legacy
// sheets). Files in `enforce` — and every CSS file not in the baseline, i.e. new
// ones — must have zero findings.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const baselinePath = path.join(root, 'scripts/css-lint-baseline.json');
export const TOKEN_FILES = new Set(['app/ui/tokens.css']);
const RULES = ['hex', 'font', 'radius', 'shadow', 'z'];

function cssFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...cssFiles(rel));
    else if (entry.name.endsWith('.css')) out.push(rel);
  }
  return out.sort();
}

const okRadius = (part) => /^(0|0px|50%|inherit|initial|var\(--r-[a-z0-9-]+\))$/.test(part);
const okShadow = (value) =>
  value === 'none' ||
  value === 'inherit' ||
  value
    .split(/,(?![^(]*\))/)
    .map((s) => s.trim())
    .every((s) => /^var\(--(lift|edge|ring)-[a-z0-9-]+\)$/.test(s));
const okZ = (value) => /^(auto|0|-1|inherit|var\(--z-[a-z0-9-]+(,\s*-?\d+)?\))$/.test(value);

/** Findings for one stylesheet's text. */
export function lintCss(text, file = '') {
  const findings = [];
  const isToken = TOKEN_FILES.has(file);
  // Strip comments but keep line numbers (and remember lint-allow lines).
  const allowed = new Set();
  const lines = text.split('\n');
  lines.forEach((l, i) => {
    if (/\/\*\s*lint-allow\b/.test(l)) allowed.add(i + 1);
  });
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const decl = /([a-z-]+)\s*:\s*([^;{}]+)(?=;|})/g;
  for (const m of clean.matchAll(decl)) {
    const prop = m[1];
    const value = m[2].trim().replace(/\s*!important$/, '');
    const line = clean.slice(0, m.index).split('\n').length;
    if (allowed.has(line)) continue;
    // Custom property definitions are the token layer's job; outside it they may
    // still carry raw values only in the token file.
    const add = (rule, detail) => findings.push({ rule, line, prop, value: value.slice(0, 80), detail });
    if (!isToken) {
      for (const hex of value.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) add('hex', hex[0]);
    }
    if (prop.startsWith('--')) continue;
    if (prop === 'font-size' || prop === 'font') {
      // In the shorthand only the size counts (not the /line-height after it).
      const sizes = [...value.matchAll(/(?<!\/\s*)(?<![\w.-])(\d*\.?\d+)(px|rem)\b/g)];
      for (const sz of prop === 'font' ? sizes.slice(0, 1) : sizes) {
        const px = sz[2] === 'rem' ? +sz[1] * 16 : +sz[1];
        if (px < 12) add('font', sz[0]);
      }
    }
    if (/^border(-[a-z]+)*-radius$/.test(prop)) {
      const parts = value.split(/\s+(?![^(]*\))|\s*\/\s*/).filter(Boolean);
      if (!parts.every(okRadius)) add('radius', value);
    }
    if (prop === 'box-shadow' && !okShadow(value)) add('shadow', value);
    if (prop === 'z-index' && !okZ(value)) add('z', value);
  }
  return findings;
}

export function lintAll() {
  const files = cssFiles('app');
  const result = {};
  for (const file of files) result[file] = lintCss(fs.readFileSync(path.join(root, file), 'utf8'), file);
  return result;
}

export function countByRule(findings) {
  const c = Object.fromEntries(RULES.map((r) => [r, 0]));
  for (const f of findings) c[f.rule]++;
  return c;
}

export function readBaseline() {
  return fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : { enforce: [], files: {} };
}

/** Problems that fail CI: enforced/new files with findings, legacy files above baseline. */
export function regressions(result, baseline = readBaseline()) {
  const problems = [];
  for (const [file, findings] of Object.entries(result)) {
    const counts = countByRule(findings);
    const base = baseline.files[file];
    if (baseline.enforce.includes(file) || !base) {
      if (findings.length)
        problems.push(`${file}: ${findings.length} finding(s) in an enforced ${base ? '' : '(new) '}file — ` + findings.slice(0, 5).map((f) => `L${f.line} ${f.rule} ${f.detail}`).join('; '));
      continue;
    }
    for (const rule of RULES)
      if (counts[rule] > (base[rule] ?? 0)) problems.push(`${file}: ${rule} ${base[rule] ?? 0} → ${counts[rule]} (baseline exceeded; use tokens from app/ui/tokens.css)`);
  }
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const result = lintAll();
  const baseline = readBaseline();
  const one = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;
  if (one) {
    for (const f of result[one] ?? []) console.log(`${one}:${f.line}  ${f.rule.padEnd(6)} ${f.prop}: ${f.value}`);
    process.exit(0);
  }
  if (args.includes('--update-baseline')) {
    const files = {};
    for (const [file, findings] of Object.entries(result)) {
      if (baseline.enforce.includes(file) || !findings.length) continue;
      files[file] = countByRule(findings);
    }
    fs.writeFileSync(baselinePath, JSON.stringify({ enforce: baseline.enforce, files }, null, 1) + '\n');
    console.log('baseline updated:', Object.keys(files).length, 'legacy file(s)');
    process.exit(0);
  }
  const total = Object.fromEntries(RULES.map((r) => [r, 0]));
  const rows = [];
  for (const [file, findings] of Object.entries(result)) {
    const c = countByRule(findings);
    for (const r of RULES) total[r] += c[r];
    const mode = baseline.enforce.includes(file) || !baseline.files[file] ? 'enforce' : 'report';
    if (findings.length || mode === 'enforce') rows.push(`${mode.padEnd(8)} ${file.padEnd(42)} ` + RULES.map((r) => `${r} ${c[r]}`).join('  '));
  }
  if (!args.includes('--quiet')) console.log(rows.join('\n'));
  console.log('total', JSON.stringify(total));
  const problems = regressions(result, baseline);
  if (problems.length) {
    console.error(problems.join('\n'));
    if (args.includes('--ci')) process.exit(1);
  } else console.log('css-lint: no regressions');
}
