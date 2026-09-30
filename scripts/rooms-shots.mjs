// 새 방 captures (mock cloud, never real Supabase): my room empty and
// decorated through the real editor, 범마을 부동산's 모델하우스 관람 (all seven
// old themed rooms) and 나무결 가구점's 기본 가구 shelf.
//
//   node --experimental-strip-types --no-warnings scripts/rooms-shots.mjs --pages /tmp/pages --out .ui-shots/rooms [--view fhd|s] [--house 0-4] [--noon] [--skip models] [--models 0,3]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, login, serve, setup } from './ui-harness.mjs';
import { VILLAGE_PLACES } from '../app/lounge-village-layout.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const pages = opt('pages', '');
if (!pages) throw new Error('--pages <Pages build> is required (node scripts/build-standalone.mjs --out <dir> --site-url /)');
const out = path.resolve(opt('out', path.join(root, '.ui-shots', 'rooms')));
const view = opt('view', 'fhd');
const house = Number(opt('house', '1'));
const skip = new Set(opt('skip', '').split(',').filter(Boolean));
const models = opt('models', '0,1,2,3,4,5,6').split(',').filter(Boolean).map(Number);
fs.mkdirSync(out, { recursive: true });

const server = await serve(pages);
const browser = await launchBrowser();
const H = await setup({
  browser,
  base: server.url,
  view,
  seedLife: (life, uid) => {
    const x = ((life.ext ??= {})[uid] ??= {});
    // Bought after the reset: a few 기본 가구, a daily piece, a model-house wall.
    x.house = house;
    x.furn = { desk: 1, chair: 1, sofa: 1, 'wool-rug': 1, plant: 2, 'table-lamp': 1, 'music-poster': 1, bookcase: 1, 'furn-radio': 1 };
    x.styles = ['sage'];
  },
});
const { page, js, sleep, until } = H;
if (args.includes('--noon')) await H.ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, dayNight: false })));
const shot = async (name) => {
  await js(() => document.fonts.ready);
  await sleep(1200);
  const file = path.join(out, `${view}-${name}.png`);
  for (let i = 0; i < 2; i++)
    try {
      await page.screenshot({ path: file, timeout: 180000 });
      console.log('  ', file);
      return;
    } catch (e) {
      console.log(`   shot ${name} failed (${i + 1}/2): ${e.message.split('\n')[0]}`);
    }
};
const focus = (sel) => js((s) => document.querySelector(s)?.focus({ preventScroll: true }), sel);
const roomReady = (sel = '[data-testid=bedroom-3d]') =>
  until((s) => {
    const v = document.querySelector(s)?.getAttribute('data-load-state');
    return !!v && v !== 'loading';
  }, 180000, sel);
const report = { view, house, steps: {} };

try {
  await login(H, server.url);
  await until(() => !!document.querySelector('.l-world-header'), 60000);
  await roomReady();
  await sleep(2500);
  report.steps.room = await js(() => ({ ...document.querySelector('[data-testid=bedroom-3d]')?.dataset }));
  await shot('room-new');

  // 꾸미기 through the real editor: add what I own from "방에 놓을 것들".
  await H.clickText(/^꾸미기/);
  await until(() => !!document.querySelector('[data-testid=room-done]'), 10000);
  await sleep(800);
  const added = [];
  for (const ref of ['desk', 'chair', 'sofa', 'wool-rug', 'plant', 'bookcase', 'music-poster', 'table-lamp', 'furn-radio']) {
    if (!(await js(() => !!document.querySelector('[data-testid=room-catalog]')))) {
      const opened = await H.clickSel("[data-testid=room-add]");
      if (!opened) break;
      await until(() => !!document.querySelector('[data-testid=room-catalog]'), 5000);
    }
    const ok = await H.clickSel(`[data-testid=room-catalog] button[data-ref="${ref}"]:not([disabled])`);
    if (ok) added.push(ref);
    await sleep(700);
  }
  report.steps.added = added;
  report.steps.catalogEmptyNote = await js(() => !!document.querySelector('[data-testid=catalog-empty]'));
  await sleep(1500);
  await shot('room-decorating');
  await H.clickSel('[data-testid=room-done]');
  await sleep(2000);
  await shot('room-decorated');

  // Out to the hub, then 범마을 부동산 and 나무결 가구점 (E at the door).
  await focus('[data-testid=bedroom-3d]');
  await page.keyboard.press('Escape');
  await sleep(700);
  if (!(await H.clickText(/마을로 나가기/, 'dialog[open] button'))) await H.clickText(/^나가기/);
  await roomReady('[data-testid=village-3d]');
  await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
  const counter = async (id) => {
    const place = VILLAGE_PLACES.find((p) => p.id === id);
    await focus('[data-testid=village-3d]');
    await js((d) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: d })), place.entry);
    await until((q) => {
      const d = document.querySelector('[data-testid=village-3d]')?.dataset;
      return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - q.x, Number(d.avatarZ) - q.z) < 1.2;
    }, 600000, place.entry);
    await focus('[data-testid=village-3d]');
    await page.keyboard.press('KeyE');
    await until(() => !!document.querySelector('dialog[open]'), 20000);
    await sleep(900);
  };
  await counter('realty');
  await shot('realty-house');
  await H.clickSel('[data-testid=shop-page-models]');
  await until(() => !!document.querySelector('[data-testid=model-houses]'), 5000);
  await sleep(600);
  await shot('realty-models');
  if (!skip.has('models'))
    for (const actor of models) {
      await H.clickSel(`[data-testid=model-${actor}] button`);
      await sleep(300);
      await H.clickSel('[data-testid=visit-model]');
      await until(() => !!document.querySelector('[data-testid=model-house] [data-testid=bedroom-3d]'), 60000);
      await roomReady('[data-testid=model-house] [data-testid=bedroom-3d]');
      await sleep(2500);
      report.steps['model-' + actor] = await js(() => ({ ...document.querySelector('[data-testid=model-house] [data-testid=bedroom-3d]')?.dataset }));
      await shot(`model-${actor}`);
      await page.keyboard.press('Escape');
      await until(() => !document.querySelector('[data-testid=model-house]'), 10000);
      await sleep(500);
    }
  for (let i = 0; i < 3 && (await js(() => !!document.querySelector('dialog[open]'))); i++) {
    await page.keyboard.press('Escape');
    await sleep(400);
  }
  await counter('furniture');
  await H.clickSel('[data-testid=shop-page-basic]');
  await until(() => !!document.querySelector('[data-testid=basic-shop]'), 5000);
  await sleep(800);
  await shot('furniture-basic');
  await H.clickSel('[data-testid="furn-wardrobe"] button');
  await sleep(600);
  await shot('furniture-basic-wardrobe');
  await H.clickSel('[data-testid=shop-page-today]');
  await sleep(800);
  await shot('furniture-today');
} finally {
  report.errors = H.errors;
  fs.writeFileSync(path.join(out, `${view}-report.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2).slice(0, 3000));
  await browser.close();
  server.close();
}
