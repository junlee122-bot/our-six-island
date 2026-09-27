// UI screenshot + readability regression check (mock cloud, never real Supabase).
//
//   npm run ui:shots                               # build to a temp dir, all 3 views
//   npm run ui:shots -- --pages /tmp/pages         # reuse an existing Pages build
//   npm run ui:shots -- --views s --only friends,map
//   npm run ui:shots -- --baseline .ui-shots/before/report.json [--strict]
//
// For each key screen at 1920×1080 (fhd), 1440×900 (d) and 1280×720 (s) it saves
// a PNG and measures, inside the top dialog (or the whole HUD when none is open):
//   low       text below WCAG AA contrast (4.5:1, 3:1 for large text)
//   small     text rendered below 12px
//   narrow    text broken into a column of 1–2 characters per line
//   cut       text cut off by the viewport or a non-scrolling clipping box
//   overlaps  floating HUD boxes that cover each other
//   close     size of the dialog's close (×) button (target: 44×44)
// and writes <out>/report.json. With --baseline it prints before/after numbers
// and (with --strict) exits 1 when any count got worse.
// Needs playwright-core (devDependency) and a Chromium (CHROMIUM_PATH or
// playwright's default install).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchBrowser, login, serve, setup, VIEWS } from './ui-harness.mjs';
import { kstDay } from '../app/lounge-economy.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes('--' + name);
const label = opt('label', 'current');
const out = path.resolve(opt('out', path.join(root, '.ui-shots', label)));
const views = opt('views', 'fhd,d,s').split(',').filter((v) => VIEWS[v]);
const only = opt('only', '')
  .split(',')
  .filter(Boolean);
const baselineFile = opt('baseline', '');
fs.mkdirSync(out, { recursive: true });

let pages = opt('pages', '');
if (!pages) {
  pages = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-shots-pages-'));
  console.log('building Pages into', pages);
  execFileSync(process.execPath, ['scripts/build-standalone.mjs', '--out', pages, '--site-url', '/'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, VITE_UI_KIT: '1' },
  });
}

// ---- in-page measurement ----------------------------------------------------
function measureInPage() {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const blend = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  function bgOf(el) {
    const stack = [];
    let opacity = 1;
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      opacity *= +cs.opacity;
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !cs.backgroundImage.startsWith('repeating-linear-gradient')) return { img: true };
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        stack.push(c);
        if (c.a >= 0.99) break;
      }
      if (cs.backdropFilter && cs.backdropFilter !== 'none' && stack.length === 0) return { img: true };
    }
    if (!stack.length || stack[stack.length - 1].a < 0.99) return { img: true };
    let out = stack.pop();
    while (stack.length) out = blend(stack.pop(), out);
    return out;
  }
  const cls = (e) => (e.className?.baseVal ?? e.className ?? '').toString().trim().split(/\s+/).slice(0, 2).join('.') || e.tagName.toLowerCase();
  const top = [...document.querySelectorAll('dialog[open]')].pop() ?? document.querySelector('main') ?? document.body;
  const visible = (e) => {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom < 0 || r.right < 0 || r.left > innerWidth || r.top > innerHeight) return false;
    const cs = getComputedStyle(e);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const ownText = (e) => [...e.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent).join('').trim();
  const low = [], small = [], narrow = [], cut = [];
  let texts = 0, minFont = 99;
  for (const e of top.querySelectorAll('*')) {
    const t = ownText(e);
    if (!t || !visible(e)) continue;
    const cs = getComputedStyle(e);
    let op = 1;
    for (let p = e; p; p = p.parentElement) op *= +getComputedStyle(p).opacity;
    if (op < 0.1) continue;
    texts++;
    const size = parseFloat(cs.fontSize);
    minFont = Math.min(minFont, size);
    if (size < 12) small.push({ t: t.slice(0, 18), size, cls: cls(e) });
    // contrast (the element's own opacity chain multiplies the text alpha)
    const fg0 = parse(cs.color);
    const bg = bgOf(e);
    if (fg0 && !bg.img) {
      const fg = blend({ ...fg0, a: fg0.a * op }, bg);
      const L1 = lum(fg), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const bold = +cs.fontWeight >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      if (ratio < need) low.push({ t: t.slice(0, 18), ratio: +ratio.toFixed(2), size, cls: cls(e) });
    }
    // one or two characters per line
    for (const node of e.childNodes) {
      if (node.nodeType !== 3) continue;
      const chars = [...node.textContent.replace(/\s+/g, '')].length;
      if (chars < 3) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const lines = new Set([...range.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top / (size * 0.6))));
      if (lines.size >= 3 && chars / lines.size <= 2.2) {
        narrow.push({ t: t.slice(0, 18), lines: lines.size, cls: cls(e) });
        break;
      }
    }
    // cut off: outside the viewport, or outside a clipping ancestor that cannot scroll
    // (Text below the fold of a scrolling box is reachable, so it does not count.)
    const r = e.getBoundingClientRect();
    let isCut = false, scrolls = false;
    for (let p = e.parentElement; p && !isCut && p !== document.body; p = p.parentElement) {
      const pc = getComputedStyle(p);
      if ((pc.overflowY === 'auto' || pc.overflowY === 'scroll') && p.scrollHeight > p.clientHeight + 1) {
        scrolls = true;
        break;
      }
      if (pc.overflowY === 'hidden' || pc.overflowY === 'clip') {
        const pr = p.getBoundingClientRect();
        if (r.top >= pr.bottom - 1 || r.bottom > pr.bottom + 2) isCut = true;
      }
    }
    if (!scrolls && (r.bottom > innerHeight + 1 || r.right > innerWidth + 1)) isCut = true;
    if (isCut && top.tagName === 'DIALOG') cut.push({ t: t.slice(0, 18), cls: cls(e) });
  }
  // Floating HUD boxes that cover each other (only without a dialog on top).
  const overlaps = [];
  if (top.tagName !== 'DIALOG') {
    const boxes = [...top.querySelectorAll('*')].filter((e) => {
      const cs = getComputedStyle(e);
      if (cs.position !== 'fixed' && cs.position !== 'absolute') return false;
      if (e.closest('canvas') || e.tagName === 'CANVAS' || !visible(e) || cs.pointerEvents === 'none') return false;
      const r = e.getBoundingClientRect();
      if (r.width * r.height < 3000 || (r.width > innerWidth * 0.6 && r.height > innerHeight * 0.6)) return false;
      return !!e.innerText?.trim();
    });
    const tops = boxes.filter((e) => !boxes.some((o) => o !== e && o.contains(e)));
    for (let i = 0; i < tops.length; i++)
      for (let j = i + 1; j < tops.length; j++) {
        const a = tops[i].getBoundingClientRect(), b = tops[j].getBoundingClientRect();
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w <= 4 || h <= 4) continue;
        const frac = (w * h) / Math.min(a.width * a.height, b.width * b.height);
        if (frac < 0.05) continue;
        const cx = Math.max(a.left, b.left) + w / 2, cy = Math.max(a.top, b.top) + h / 2;
        const hit = document.elementFromPoint(cx, cy);
        overlaps.push({ a: cls(tops[i]), b: cls(tops[j]), px: Math.round(w * h), onTop: hit && tops[i].contains(hit) ? cls(tops[i]) : hit && tops[j].contains(hit) ? cls(tops[j]) : '?' });
      }
  }
  let dialog = null;
  if (top.tagName === 'DIALOG') {
    const r = top.getBoundingClientRect();
    const x = top.querySelector('button[aria-label="닫기"], button[aria-label$="닫기"], [data-close]');
    const xr = x?.getBoundingClientRect();
    const targets = [...top.querySelectorAll('button, [role=tab], a[href]')].filter(visible);
    dialog = {
      label: top.getAttribute('aria-label') || cls(top),
      w: Math.round(r.width),
      h: Math.round(r.height),
      offscreen: r.top < -1 || r.bottom > innerHeight + 1,
      close: xr ? { w: Math.round(xr.width), h: Math.round(xr.height) } : null,
      smallTargets: targets.filter((b) => { const q = b.getBoundingClientRect(); return q.height < 32 || q.width < 32; }).length,
      fonts: [...new Set([...top.querySelectorAll('h1,h2,h3,p,button')].map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '')))],
    };
  }
  low.sort((a, b) => a.ratio - b.ratio);
  return {
    texts,
    minFont: minFont === 99 ? null : minFont,
    lowCount: low.length,
    low: low.slice(0, 12),
    smallCount: small.length,
    small: small.slice(0, 8),
    narrowCount: narrow.length,
    narrow: narrow.slice(0, 8),
    cutCount: cut.length,
    cut: cut.slice(0, 8),
    overlapCount: overlaps.length,
    overlaps: overlaps.slice(0, 8),
    dialog,
    overflowX: document.documentElement.scrollWidth > innerWidth,
    fontsLoaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '') + ' ' + f.weight).filter((v, i, a) => a.indexOf(v) === i),
  };
}

// ---- screens ------------------------------------------------------------------
const DAY = 86_400_000;
function seedLife(life, uid) {
  const now = Date.now();
  const day = kstDay(now);
  const g = (life.growth ??= {});
  const u = (g.u ??= {});
  u[uid] = { xp: { farm: 590, fish: 410, forage: 230, mine: 158, craft: 170 }, day, dxp: { farm: 120, fish: 64, forage: 25 }, rest: { fish: 200, craft: 100 }, seen: day, retro: now - 3 * DAY, rocks: 7 };
  for (const [id, actor] of Object.entries(life.actors ?? {}))
    if (id !== uid) u[id] = { xp: { farm: 1500 + actor * 120, fish: 700, forage: 400, mine: 100, craft: 300 }, retro: now - 4 * DAY, prof: ['farm-a'] };
  const x = ((life.ext ??= {})[uid] ??= {});
  x.inv = { ...(x.inv ?? {}), wood: 48, stone: 30, copper: 6, pinecone: 4, crucian: 1, azalea: 2, wildflower: 2 };
  g.r = { forge: { got: 92_000, mat: { wood: 70, stone: 45 }, by: { 0: 2, 6: 1 }, start: now - 2 * DAY } };
  life.bonds = { ...(life.bonds ?? {}), '2-3': 1_180, '1-3': 700, '0-3': 260, '3-6': 90 };
}

async function runView(browser, base, view, report) {
  const H = await setup({ browser, base, view, seedLife });
  const { page, js, sleep, until } = H;
  const res = (report.views[view] = { screens: {}, notes: [] });
  const want = (n) => !only.length || only.includes(n);
  const dlg = () => js(() => [...document.querySelectorAll('dialog[open]')].length);
  const closeAll = async () => {
    for (let i = 0; i < 5 && (await dlg()); i++) {
      await page.keyboard.press('Escape');
      await sleep(400);
    }
  };
  const focusScene = async () => {
    await js(() => document.querySelector('[data-testid=village-3d], [data-testid=bedroom-3d]')?.focus({ preventScroll: true }));
    await sleep(200);
  };
  const snap = async (name, extra = {}) => {
    await js(() => document.fonts.ready);
    await sleep(450);
    const file = `${view}-${name}.png`;
    await page.screenshot({ path: path.join(out, file), timeout: 90000 }).catch((e) => res.notes.push(`shot ${name}: ${e.message.slice(0, 80)}`));
    const m = await js(measureInPage).catch((e) => ({ err: e.message }));
    res.screens[name] = { file, ...m, ...extra };
    const d = m.dialog;
    console.log(`  ${view} ${name.padEnd(16)} low ${m.lowCount} small ${m.smallCount} narrow ${m.narrowCount} cut ${m.cutCount} overlap ${m.overlapCount}${d?.close ? ` close ${d.close.w}x${d.close.h}` : ''}`);
  };
  const step = async (name, fn) => {
    if (!want(name)) return;
    try {
      await fn();
    } catch (e) {
      res.notes.push(`${name}: ${e.message.slice(0, 140)}`);
    }
    await closeAll();
  };
  const menu = async (re) => {
    await closeAll();
    await H.clickSel('[aria-label="마을 메뉴"]');
    await sleep(600);
    const ok = await H.clickText(re, 'dialog[open] button');
    await sleep(900);
    return ok;
  };

  await page.goto(base);
  await page.waitForSelector('.l-auth-card', { timeout: 90000 });
  await sleep(800);
  await step('login', () => snap('login'));
  await login(H, base);
  await until(() => !!document.querySelector('.l-world-header'), 60000);
  await until(() => { const s = document.querySelector('[data-testid=bedroom-3d]')?.getAttribute('data-load-state'); return !!s && s !== 'loading'; }, 180000);
  await sleep(2000);
  await closeAll();
  await step('room', () => snap('room'));
  await step('menu', async () => { await H.clickSel('[aria-label="마을 메뉴"]'); await sleep(700); await snap('menu'); });
  await step('esc-menu', async () => { await focusScene(); await page.keyboard.press('Escape'); await sleep(600); await snap('esc-menu'); });
  await step('room-editor', async () => {
    await H.clickText(/^꾸미기/);
    await until(() => !!document.querySelector('[data-testid=room-done]'), 10000);
    await sleep(1500);
    await snap('room-editor');
    // Esc should leave decorate mode (P0-5).
    await js(() => document.activeElement?.blur());
    await page.keyboard.press('Escape');
    await sleep(900);
    const exited = await js(() => !document.querySelector('[data-testid=room-done]'));
    res.screens['room-editor'].escExits = exited;
    if (!exited) { await H.clickSel('[data-testid=room-done]'); await sleep(1500); }
  });
  await step('wallet', async () => { await H.clickSel('[aria-label^="내 범 지갑"]'); await sleep(800); await snap('wallet'); });
  await step('settings', async () => { await menu(/^설정$/); await snap('settings'); });
  await step('controls', async () => { await focusScene(); await page.keyboard.press('F1'); await sleep(800); await snap('controls'); });
  await step('credits', async () => { await menu(/만든 이야기/); await snap('credits'); });
  await step('friends', async () => { await menu(/마을 친구들/); await snap('friends'); });
  await step('invite', async () => { await menu(/게임 초대/); await snap('invite'); });

  // village
  for (let i = 0; i < 4 && (await js(() => document.querySelector('main.l-app')?.dataset.space)) !== 'village'; i++) {
    await closeAll();
    await focusScene();
    await page.keyboard.press('Escape');
    await sleep(700);
    if (!(await H.clickText(/마을로 나가기/, 'dialog[open] button'))) { await closeAll(); await H.clickText(/^나가기/); }
    await until(() => document.querySelector('main.l-app')?.dataset.space === 'village', 20000);
  }
  await until(() => { const s = document.querySelector('[data-testid=village-3d]')?.getAttribute('data-load-state'); return !!s && s !== 'loading'; }, 180000);
  await sleep(3000);
  await closeAll();
  await step('village', () => snap('village'));
  await step('map', async () => { await focusScene(); await page.keyboard.press('KeyM'); await sleep(1000); await snap('map'); await focusScene(); await page.keyboard.press('KeyM'); await sleep(400); });
  await step('bag', async () => { await focusScene(); await page.keyboard.press('KeyI'); await sleep(1000); await snap('bag'); });
  await step('shop', async () => { await menu(/범타듀 상점/); await snap('shop'); });
  await step('ledger', async () => { await menu(/내 텃밭/); await snap('ledger'); });
  await step('growth', async () => {
    await focusScene();
    await page.keyboard.press('KeyT');
    await until(() => !!document.querySelector('[data-testid=growth-panel]'), 8000);
    await sleep(800);
    await snap('growth');
    await page.keyboard.press('Digit3');
    await sleep(1000);
    await snap('growth-research');
  });
  await step('bonds', async () => { await focusScene(); await page.keyboard.press('KeyL'); await sleep(1000); await snap('bonds'); });
  await step('collection', async () => { await focusScene(); await page.keyboard.press('KeyK'); await sleep(1000); await snap('collection'); });

  // Primitives page (only in builds made with VITE_UI_KIT=1).
  await step('ui-kit', async () => {
    await page.goto(base + '?ui-kit');
    if ((await until(() => !!document.querySelector('[data-testid=ui-kit]'), 8000)) < 0) return;
    await snap('ui-kit');
    await page.keyboard.press('Digit2');
    await sleep(300);
    await snap('ui-kit-panels');
    await page.keyboard.press('Digit3');
    await sleep(300);
    await snap('ui-kit-glyphs');
  });
  res.errors = H.errors.slice(0, 10);
  res.external = [...H.external];
  await H.close();
}

// ---- run --------------------------------------------------------------------
const server = await serve(pages);
const browser = await launchBrowser();
const report = { label, date: new Date().toISOString(), commit: '', views: {} };
try {
  report.commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root }).toString().trim();
} catch {}
try {
  for (const view of views) {
    console.log(`view ${view} (${VIEWS[view].width}x${VIEWS[view].height})`);
    await runView(browser, server.url, view, report);
  }
} finally {
  await browser.close();
  server.close();
}
report.summary = summarize(report);
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
console.log('report:', path.join(out, 'report.json'));
console.log(JSON.stringify(report.summary));

function summarize(r) {
  const s = { screens: 0, low: 0, small: 0, narrow: 0, cut: 0, overlap: 0, closeUnder44: 0, editorEscFails: 0 };
  for (const v of Object.values(r.views))
    for (const m of Object.values(v.screens)) {
      s.screens++;
      s.low += m.lowCount ?? 0;
      s.small += m.smallCount ?? 0;
      s.narrow += m.narrowCount ?? 0;
      s.cut += m.cutCount ?? 0;
      s.overlap += m.overlapCount ?? 0;
      if (m.dialog?.close && (m.dialog.close.w < 44 || m.dialog.close.h < 44)) s.closeUnder44++;
      if (m.escExits === false) s.editorEscFails++;
    }
  return s;
}

if (baselineFile) {
  const before = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  const rows = [];
  let worse = 0;
  for (const [view, v] of Object.entries(report.views))
    for (const [name, m] of Object.entries(v.screens)) {
      const b = before.views?.[view]?.screens?.[name];
      if (!b) continue;
      const cols = ['lowCount', 'smallCount', 'narrowCount', 'cutCount', 'overlapCount'].map((k) => {
        if ((m[k] ?? 0) > (b[k] ?? 0)) worse++;
        return `${b[k] ?? '-'}→${m[k] ?? '-'}`;
      });
      const c = (d) => (d?.close ? `${d.close.w}x${d.close.h}` : '-');
      rows.push(`${view.padEnd(3)} ${name.padEnd(16)} low ${cols[0].padEnd(7)} small ${cols[1].padEnd(7)} narrow ${cols[2].padEnd(6)} cut ${cols[3].padEnd(6)} overlap ${cols[4].padEnd(6)} close ${c(b.dialog)}→${c(m.dialog)}`);
    }
  const comparison = { before: before.summary, after: report.summary, worse, rows };
  fs.writeFileSync(path.join(out, 'compare.json'), JSON.stringify(comparison, null, 1));
  console.log(rows.join('\n'));
  console.log('summary before', JSON.stringify(before.summary));
  console.log('summary after ', JSON.stringify(report.summary));
  if (worse && flag('strict')) {
    console.error(`${worse} measurement(s) got worse than the baseline.`);
    process.exit(1);
  }
}
