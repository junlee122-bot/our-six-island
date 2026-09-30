// Captures every public interior (mock cloud, never real Supabase) and its
// frame cost, for before/after comparisons of the 3D rooms:
//
//   node --experimental-strip-types --no-warnings scripts/interior-shots.mjs --pages /tmp/pages --out .ui-shots/interiors [--view fhd|s] [--only casino,hall] [--seated]
//
// For each place it walks to the door on the village map, presses E, waits
// for the room, captures it at the door, then walks to the first table (or
// the counter) and captures again with the drawCalls / triangles the scene
// reports (lounge-interior-3d.tsx dataset). Two friends come in too.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, login, serve, setup } from './ui-harness.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const pages = opt('pages', '');
if (!pages) throw new Error('--pages <Pages build> is required (node scripts/build-standalone.mjs --out <dir> --site-url /)');
const out = path.resolve(opt('out', path.join(root, '.ui-shots', 'interiors')));
const view = opt('view', 'fhd');
// place id on the village map → server area of the room
const PLACES = { casino: 'casino', hall: 'lounge', tavern: 'tavern', bank: 'bank', wardrobe: 'salon' };
const only = opt('only', Object.keys(PLACES).join(',')).split(',').filter(Boolean);
const seated = args.includes('--seated');
fs.mkdirSync(out, { recursive: true });

const server = await serve(pages);
const browser = await launchBrowser();
const H = await setup({ browser, base: server.url, view });
const { page, js, sleep, until } = H;
await H.ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, dayNight: false })));
const results = {};
const shot = async (name) => {
  await js(() => document.fonts.ready);
  await sleep(1500);
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
const cost = () =>
  js(() => {
    const d = document.querySelector('[data-testid=interior-3d]')?.dataset;
    return { drawCalls: Number(d?.drawCalls ?? NaN), triangles: Number(d?.triangles ?? NaN) };
  });
const dialogOpen = () => js(() => !!document.querySelector('dialog[open]'));
/** Out of a room (Esc menu → 마을로 나가기) and wait for the village. */
const leave = async (sel) => {
  for (let i = 0; i < 4 && (await js(() => document.querySelector('main.l-app')?.dataset.space)) !== 'village'; i++) {
    for (let j = 0; j < 4 && (await dialogOpen()); j++) {
      await page.keyboard.press('Escape');
      await sleep(400);
    }
    await focus(sel);
    await page.keyboard.press('Escape');
    await sleep(700);
    if (!(await H.clickText(/마을로 나가기/, 'dialog[open] button'))) await H.clickText(/^나가기/);
    await until(() => document.querySelector('main.l-app')?.dataset.space === 'village', 20000);
  }
  await until(() => { const s = document.querySelector('[data-testid=village-3d]')?.getAttribute('data-load-state'); return !!s && s !== 'loading'; }, 180000);
  await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
  await sleep(2000);
  for (let j = 0; j < 4 && (await dialogOpen()); j++) {
    await page.keyboard.press('Escape');
    await sleep(400);
  }
};
const focus = (sel) => js((s) => document.querySelector(s)?.focus({ preventScroll: true }), sel);

try {
  await login(H, server.url);
  await until(() => !!document.querySelector('.l-world-header'), 60000);
  await until(() => { const s = document.querySelector('[data-testid=bedroom-3d]')?.getAttribute('data-load-state'); return !!s && s !== 'loading'; }, 180000);
  await sleep(1500);
  await leave('[data-testid=bedroom-3d]');
  for (const place of only) {
    const area = PLACES[place];
    console.log(place);
    try {
      for (const b of H.bots.slice(0, 2)) await H.run(b, 'action', { action: { kind: 'area', area } }).catch(() => {});
      if (!(await page.locator('#hv-minimap-body').count())) await page.getByTestId('minimap-toggle').click();
      await page.locator(`[data-minimap-place="${place}"]`).first().click({ timeout: 60000 });
      await focus('[data-testid=village-3d]');
      await page.keyboard.down('Shift');
      try {
        const ok = await until((p) => {
          const d = document.querySelector('[data-testid=village-3d]')?.dataset;
          return d?.nearbyPlace === p && d.walking === 'false';
        }, 300000, place);
        if (ok < 0) throw new Error('did not reach the door');
      } finally {
        await page.keyboard.up('Shift');
      }
      await page.keyboard.press('KeyE');
      if ((await until((a) => { const d = document.querySelector('[data-testid=interior-3d]')?.dataset; return d?.area === a && d.loadState === 'ready'; }, 180000, area)) < 0)
        throw new Error('room did not load');
      await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
      await sleep(4000);
      results[place] = { door: await cost() };
      await shot(`${place}-door`);
      // --seated: a friend opens a table and sits (casino blackjack, hall 섯다).
      const SEAT = { casino: ['blackjack', 1000], lounge: ['seotda', 10000] }[area];
      if (seated && SEAT) {
        const [game, stake] = SEAT;
        await H.run(H.bots[0], 'action', { action: { kind: 'invite', game, players: [], stake, required: 2, table: `${area}-${game}` } }).catch((e) => console.log('   invite failed:', e.message));
        await sleep(4000);
        await shot(`${place}-seated`);
      }
      // Walk to the first table (or the counter) and capture again.
      const route = await js(() => {
        const b = document.querySelector('.ih-tables button');
        return b ? b.getAttribute('data-testid') : null;
      });
      if (route) {
        await H.clickSel(`[data-testid=${route}]`);
        await until(() => document.querySelector('[data-testid=interior-3d]')?.dataset.walking === 'true', 10000);
        await until(() => document.querySelector('[data-testid=interior-3d]')?.dataset.walking === 'false', 60000);
        await sleep(2500);
        // An auto-opened sheet (table) covers the room: close it for the capture.
        if (await dialogOpen()) {
          await page.keyboard.press('Escape').catch(() => {});
          await sleep(800);
        }
        const at = await js(() => {
          const d = document.querySelector('[data-testid=interior-3d]')?.dataset;
          return { x: Number(d?.avatarX), y: Number(d?.avatarY), action: d?.action ?? '' };
        });
        results[place].inside = { ...(await cost()), route, at };
        await shot(`${place}-inside`);
      }
    } catch (e) {
      console.log('   failed:', e.message.split('\n')[0]);
      results[place] = { ...results[place], error: e.message.split('\n')[0] };
    } finally {
      // Back to the village for the next place.
      await leave('[data-testid=interior-3d]');
    }
  }
} finally {
  fs.writeFileSync(path.join(out, `${view}-cost.json`), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  if (H.errors.length) console.log('page errors:', H.errors.slice(0, 5));
  await H.close();
  await browser.close();
  server.close?.();
}
