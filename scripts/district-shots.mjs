// Side-by-side captures of the hub and the districts (mock cloud, never real
// Supabase): the same time of day, 1920×1080, standing by each gate.
//
//   node --experimental-strip-types --no-warnings scripts/district-shots.mjs --pages /tmp/pages --out .ui-shots/districts [--noon] [--view fhd|s] [--only market,harbor]
//
// --noon turns the day/night cycle off (설정 → 낮밤 변화) so every capture is
// lit like noon. Districts behind a goal are opened in the mock world first.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, login, serve, setup } from './ui-harness.mjs';
import { DISTRICTS } from '../app/lounge-districts.ts';
import { REGIONS } from '../app/lounge-areas.ts';
import { districtCounters } from '../app/lounge-district-counters.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const pages = opt('pages', '');
if (!pages) throw new Error('--pages <Pages build> is required (node scripts/build-standalone.mjs --out <dir> --site-url /)');
const out = path.resolve(opt('out', path.join(root, '.ui-shots', 'districts')));
const only = opt('only', 'market,harbor,hillside').split(',').filter(Boolean);
const noon = args.includes('--noon');
const view = opt('view', 'fhd');
// --panels: also open each counter window (E at the door) and capture it.
const panels = args.includes('--panels');
fs.mkdirSync(out, { recursive: true });

const server = await serve(pages);
const base = server.url;
const browser = await launchBrowser();
const H = await setup({
  browser,
  base,
  view,
  seedLife: (life, uid) => {
    life.flags = [...new Set([...(life.flags ?? []), 'district-harbor', 'district-hillside'])];
    // Something to sell at 농협 and 어시장, and a visited harbor for the signpost.
    const bag = life.bag?.[uid];
    if (bag) Object.assign(bag.produce, { carrot: 6, tomato: 3, potato: 4 });
    const x = ((life.ext ??= {})[uid] ??= {});
    x.inv = { ...(x.inv ?? {}), mackerel: 3, crucian: 2, hairtail: 1 };
    x.town = { seen: ['market', 'harbor', 'hillside'] };
  },
});
const { page, js, sleep, until } = H;
if (noon) await H.ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, dayNight: false })));
const shot = async (name) => {
  await js(() => document.fonts.ready);
  await sleep(1500);
  const file = path.join(out, `${view}-${name}.png`);
  // The software renderer can be slow under load: retry once, never abort the run.
  for (let i = 0; i < 2; i++)
    try {
      await page.screenshot({ path: file, timeout: 180000 });
      console.log('  ', file);
      return;
    } catch (e) {
      console.log(`   shot ${name} failed (${i + 1}/2): ${e.message.split('\n')[0]}`);
    }
};
const scene = (sel) => js((s) => document.querySelector(s)?.focus({ preventScroll: true }), sel);
const walkVillage = async (p) => {
  await scene('[data-testid=village-3d]');
  await js((d) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: d })), p);
  await page.keyboard.down('Shift');
  try {
    await until((q) => {
      const d = document.querySelector('[data-testid=village-3d]')?.dataset;
      return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - q.x, Number(d.avatarZ) - q.z) < 1.2;
    }, 900000, p);
  } finally {
    await page.keyboard.up('Shift');
  }
};
const villageReady = () =>
  until(() => {
    const s = document.querySelector('[data-testid=village-3d]')?.getAttribute('data-load-state');
    return !!s && s !== 'loading';
  }, 180000);

try {
  await login(H, base);
  await until(() => !!document.querySelector('.l-world-header'), 60000);
  await until(() => { const s = document.querySelector('[data-testid=bedroom-3d]')?.getAttribute('data-load-state'); return !!s && s !== 'loading'; }, 180000);
  await sleep(1500);
  // Out of my room into the hub.
  await scene('[data-testid=bedroom-3d]');
  await page.keyboard.press('Escape');
  await sleep(700);
  if (!(await H.clickText(/마을로 나가기/, 'dialog[open] button'))) await H.clickText(/^나가기/);
  await villageReady();
  await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
  await sleep(4000);
  await shot('hub-plaza');
  for (const id of only) {
    const g = DISTRICTS[id].gate;
    await walkVillage(g.stand);
    await sleep(2500);
    await shot(`hub-${id}-gate`);
    await scene('[data-testid=village-3d]');
    await page.keyboard.press('KeyE');
    await until((a) => {
      const d = document.querySelector('[data-testid=area-3d]')?.dataset;
      return d?.area === a && d.loadState === 'ready';
    }, 180000, id);
    await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
    await sleep(6000);
    await shot(`${id}-arrive`);
    // A second look further in (the district's centre).
    await js(() => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: { x: 0, z: 0 } })));
    await until(() => document.querySelector('[data-testid=area-3d]')?.dataset.walking === 'false', 120000);
    await sleep(2500);
    await shot(`${id}-centre`);
    if (panels) {
      const weekday = new Date(Date.now() + 9 * 3_600_000).getUTCDay();
      const seen = new Set();
      for (const c of districtCounters(id, weekday)) {
        const key = c.a.kind === 'counter' ? c.a.place : c.a.kind;
        if (seen.has(key) || c.a.kind === 'fish' || c.a.kind === 'board') continue;
        seen.add(key);
        await js((d) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: d })), { x: c.x, z: c.z });
        await until((q) => {
          const d = document.querySelector('[data-testid=area-3d]')?.dataset;
          return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - q.x, Number(d.avatarZ) - q.z) < 0.6;
        }, 120000, { x: c.x, z: c.z });
        await scene('[data-testid=area-3d]');
        await page.keyboard.press('KeyE');
        await until(() => !!document.querySelector('dialog[open]'), 15000);
        await sleep(900);
        await shot(`${id}-panel-${key}`);
        for (let i = 0; i < 3 && (await js(() => !!document.querySelector('dialog[open]'))); i++) {
          await page.keyboard.press('Escape');
          await sleep(400);
        }
      }
    }
    // Back to the hub through the exit.
    const back = REGIONS[id].exits[0]?.stand;
    if (back) {
      await js((d) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: d })), back);
      await until(() => document.querySelector('[data-testid=area-3d]')?.dataset.walking === 'false', 120000);
      await scene('[data-testid=area-3d]');
      await page.keyboard.press('KeyE');
      await villageReady();
      await sleep(2500);
    }
  }
} finally {
  if (H.errors.length) console.log('page errors:', H.errors.slice(0, 5));
  await H.close?.();
  await browser.close();
  server.close();
}
