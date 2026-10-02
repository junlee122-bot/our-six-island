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
import { REGIONS, regionToNetwork } from '../app/lounge-areas.ts';
import { districtMinimap } from '../app/lounge-district-minimap.ts';
import { measureInPage } from './ui-measure.mjs';
import { districtCounters } from '../app/lounge-district-counters.ts';
import { npcSpot } from '../app/lounge-npc-schedule.ts';
import { NPC_IDS } from '../app/lounge-npc-data.ts';
import { SHOP_INTERIORS, seatPoint } from '../app/lounge-shop-interiors.ts';

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
// --shops: walk into each shop room (가게 실내), capture it at the door and at
// the counter with its draw calls, open the counter's window, then walk out.
// Two friends sit on the bakery's café chairs. Costs go to <out>/<view>-shops.json.
const shops = args.includes('--shops');
// --minimap: in each district put two friends on the map and one inside a shop room,
// capture the minimap compact and enlarged, and walk somewhere by clicking a place on it.
const minimap = args.includes('--minimap');
// --residents: also walk to the biggest group of residents in the hub and capture it.
const residents = args.includes('--residents');
// --at HH:MM: run the mock world (and so the page's clock) at this game time
// in the current game day (게임 하루 = 실제 1시간: game midnight on the real hour).
const atOpt = opt('at', '');
if (atOpt) {
  const [hh, mm] = atOpt.split(':').map(Number);
  const HOUR = 3_600_000,
    GAME_MINUTE = 2_500;
  const real = Date.now();
  const shift = Math.floor(real / HOUR) * HOUR + (hh * 60 + (mm || 0)) * GAME_MINUTE - real;
  const original = Date.now;
  Date.now = () => original() + shift;
}
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
const shopCosts = {};
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
const walkVillage = async (p, near = 0) => {
  await scene('[data-testid=village-3d]');
  await js((d) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: d })), p);
  await page.keyboard.down('Shift');
  try {
    // The walk has started (slow frames can hold it back a while) or I am there already…
    await until((q) => {
      const d = document.querySelector('[data-testid=village-3d]')?.dataset;
      return d?.walking === 'true' || Math.hypot(Number(d?.avatarX) - q.x, Number(d?.avatarZ) - q.z) < 0.6;
    }, 30000, p);
    // …then arrived (within `near` when given: a gate must be in reach before E), or
    // stopped as close as the paths allow (a point inside a wall).
    await until((q) => {
      const d = document.querySelector('[data-testid=village-3d]')?.dataset;
      return d?.walking === 'false' && (!q.near || Math.hypot(Number(d.avatarX) - q.x, Number(d.avatarZ) - q.z) < q.near);
    }, 900000, { ...p, near });
  } finally {
    await page.keyboard.up('Shift');
  }
};
/**
 * Walks to `p` on the current outdoor map: waits for the walk to start (the
 * software renderer can take a while to draw the next frame), then to end,
 * within `near` of `p` when given (an exit must be in reach before E).
 */
const walkArea = async (p, near = 0) => {
  await scene('[data-testid=area-3d]');
  await js((d) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: d })), p);
  await page.keyboard.down('Shift');
  try {
    await until((q) => {
      const d = document.querySelector('[data-testid=area-3d]')?.dataset;
      return d?.walking === 'true' || Math.hypot(Number(d?.avatarX) - q.x, Number(d?.avatarZ) - q.z) < 0.6;
    }, 30000, p);
    await until((q) => {
      const d = document.querySelector('[data-testid=area-3d]')?.dataset;
      return d?.walking === 'false' && (!q.near || Math.hypot(Number(d.avatarX) - q.x, Number(d.avatarZ) - q.z) < q.near);
    }, 600000, { ...p, near });
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
  if (residents) {
    // The residents drawn in the hub right now (the mock world has 언덕 open).
    const here = NPC_IDS.map((id) => npcSpot(id, Date.now(), { hill: true })).filter((s) => s.visible && s.area === 'village' && !s.walking);
    let best = null;
    for (const a of here) {
      const n = here.filter((b) => Math.hypot(a.x - b.x, a.z - b.z) < 10);
      if (!best || n.length > best.length) best = n;
    }
    if (best?.length) {
      const cx = best.reduce((t, s) => t + s.x, 0) / best.length,
        cz = best.reduce((t, s) => t + s.z, 0) / best.length;
      console.log('   residents near', best.map((s) => s.id).join(', '));
      await walkVillage({ x: cx, z: cz + 1.6 });
      await sleep(3000);
      await shot('hub-residents');
    }
  }
  for (const id of only) {
    const g = DISTRICTS[id].gate;
    await walkVillage(g.stand, g.reach);
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
    await walkArea({ x: 0, z: 0 });
    await sleep(2500);
    await shot(`${id}-centre`);
    if (minimap) {
      // Two friends close together (a cluster) and one inside a shop room of this district (at its door).
      const shop = Object.values(SHOP_INTERIORS).find((s) => s.district === id);
      const [a, b, c] = H.bots;
      await H.run(a, 'action', { action: { kind: 'area', area: id, ...regionToNetwork(id, { x: 6, z: 4 }) } });
      await H.run(b, 'action', { action: { kind: 'area', area: id, ...regionToNetwork(id, { x: 6.6, z: 4.4 }) } });
      if (shop) await H.run(c, 'action', { action: { kind: 'area', area: shop.area, ...shop.front } });
      const want = 1 + (shop ? 1 : 0);
      if ((await until((n) => document.querySelectorAll('[data-minimap-area] [data-minimap-friend], [data-minimap-area] [data-minimap-cluster]').length >= n, 30000, want)) < 0)
        throw new Error(`${id}: friend pins did not appear on the minimap`);
      const places = await js(() => document.querySelectorAll('[data-minimap-area] [data-minimap-place]').length);
      const expected = districtMinimap(id, new Date(Date.now() + 9 * 3_600_000).getUTCDay()).places.length;
      if (places !== expected) throw new Error(`${id}: ${places} places on the minimap, expected ${expected}`);
      // The ui-shots measurements on the map's own controls: nothing covered, no small or faint text.
      const check = async (name) => {
        const m = await js(measureInPage);
        const own = (list) => (list ?? []).filter((x) => /minimap/.test(x.cls ?? '') || /minimap/.test(x.by ?? ''));
        const bad = { covered: own(m.covered), low: own(m.low), small: own(m.small) };
        console.log(`   ${name}: covered ${bad.covered.length} low ${bad.low.length} small ${bad.small.length}`);
        if (bad.covered.length || bad.low.length || bad.small.length) {
          const pins = await js(() => [...document.querySelectorAll('[data-minimap-area] .hv-minimap-place')].map((b) => { const r = b.getBoundingClientRect(), t = b.querySelector('span')?.getBoundingClientRect(); return `${b.getAttribute('aria-label')} @${Math.round(r.x)},${Math.round(r.y)} label ${t ? Math.round(t.x) + '-' + Math.round(t.right) : '-'}`; }));
          console.log(pins.join('\n'));
          throw new Error(`${name}: ${JSON.stringify(bad)}`);
        }
      };
      await shot(`${id}-minimap`);
      await check(`${id}-minimap`);
      await page.getByTestId('minimap-resize').click();
      await sleep(600);
      await shot(`${id}-minimap-big`);
      await check(`${id}-minimap-big`);
      await page.getByTestId('minimap-resize').click();
      // Click the road home on the map: I walk there.
      const exit = REGIONS[id].exits[0].stand;
      await page.locator('[data-minimap-area] [data-minimap-place="exit-village"]').click();
      if ((await until((q) => {
        const d = document.querySelector('[data-testid=area-3d]')?.dataset;
        return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - q.x, Number(d.avatarZ) - q.z) < 1;
      }, 600000, exit)) < 0) throw new Error(`${id}: clicking 마을로 on the minimap did not walk me there`);
      for (const bot of [a, b, c]) await H.run(bot, 'action', { action: { kind: 'area', area: 'village' } });
    }
    if (panels) {
      const weekday = new Date(Date.now() + 9 * 3_600_000).getUTCDay();
      const seen = new Set();
      for (const c of districtCounters(id, weekday)) {
        const key = c.a.kind === 'counter' ? c.a.place : c.a.kind;
        // Shop doors walk in (see --shops), they open no window out here.
        if (seen.has(key) || c.a.kind === 'fish' || c.a.kind === 'board' || (c.a.kind === 'counter' && c.a.enter)) continue;
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
    if (shops) {
      const weekday = new Date(Date.now() + 9 * 3_600_000).getUTCDay();
      const cost = () => js(() => {
        const d = document.querySelector('[data-testid=interior-3d]')?.dataset;
        return { drawCalls: Number(d?.drawCalls), triangles: Number(d?.triangles), models: d?.shopModels ?? '', residents: d?.residents ?? '' };
      });
      for (const c of districtCounters(id, weekday).filter((t) => t.a.kind === 'counter' && t.a.enter)) {
        const area = c.a.enter;
        console.log(' ', area);
        try {
          // Two friends on the bakery's front chairs (standing on a chair's spot is sitting; the far ones are the residents').
          if (area === 'bakery')
            for (const [i, b] of H.bots.slice(0, 2).entries()) {
              const seat = seatPoint(SHOP_INTERIORS.bakery.seats.filter((q) => !q.npc)[i]);
              await H.run(b, 'action', { action: { kind: 'area', area, x: seat.x, y: seat.y } }).catch(() => {});
            }
          await walkArea({ x: c.x, z: c.z }, 0.6);
          await sleep(1500);
          await shot(`${area}-street`);
          await scene('[data-testid=area-3d]');
          await page.keyboard.press('KeyE');
          if ((await until((a) => { const d = document.querySelector('[data-testid=interior-3d]')?.dataset; return d?.area === a && d.loadState === 'ready'; }, 180000, area)) < 0)
            throw new Error('room did not load');
          await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
          // Every model placed (or given up on), then a settled frame.
          await until(() => { const d = document.querySelector('[data-testid=interior-3d]')?.dataset; const [a, b] = (d?.shopModels ?? '').split('/'); return !!b && a === b; }, 60000);
          await sleep(3500);
          shopCosts[area] = { door: await cost() };
          await shot(`${area}-door`);
          await H.clickSel('[data-testid=interior-counter-route]');
          await until(() => document.querySelector('[data-testid=interior-3d]')?.dataset.walking === 'true', 10000);
          await until(() => document.querySelector('[data-testid=interior-3d]')?.dataset.walking === 'false', 60000);
          await sleep(2500);
          shopCosts[area].counter = { ...(await cost()), action: await js(() => document.querySelector('[data-testid=interior-3d]')?.dataset.action) };
          await shot(`${area}-counter`);
          await scene('[data-testid=interior-3d]');
          await page.keyboard.press('KeyE');
          await until(() => !!document.querySelector('dialog[open]'), 15000);
          await sleep(900);
          await shot(`${area}-panel`);
          for (let i = 0; i < 3 && (await js(() => !!document.querySelector('dialog[open]'))); i++) {
            await page.keyboard.press('Escape');
            await sleep(400);
          }
          // Out through the door (walk to it, then E): back in front of the shop.
          await scene('[data-testid=interior-3d]');
          await page.keyboard.down('ArrowLeft');
          await page.keyboard.down('ArrowDown');
          await page.keyboard.down('Shift');
          await until(() => document.querySelector('[data-testid=interior-3d]')?.dataset.action === 'door', 20000);
          await page.keyboard.up('Shift');
          await page.keyboard.up('ArrowDown');
          await page.keyboard.up('ArrowLeft');
          // Slow frames can carry me past the door's reach: nudge back up until it is offered.
          for (let i = 0; i < 12 && (await js(() => document.querySelector('[data-testid=interior-3d]')?.dataset.action)) !== 'door'; i++) {
            await page.keyboard.down('ArrowUp');
            await sleep(120);
            await page.keyboard.up('ArrowUp');
            await sleep(400);
          }
          await page.keyboard.press('KeyE');
          await until((a) => document.querySelector('[data-testid=area-3d]')?.dataset.area === a, 60000, id);
          await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
          await sleep(2500);
          shopCosts[area].out = await js(() => { const d = document.querySelector('[data-testid=area-3d]')?.dataset; return { x: Number(d?.avatarX), z: Number(d?.avatarZ) }; });
          await shot(`${area}-out`);
        } catch (e) {
          console.log('   failed:', e.message.split('\n')[0]);
          shopCosts[area] = { ...shopCosts[area], error: e.message.split('\n')[0] };
        }
      }
    }
    // Back to the hub through the exit (in reach first, or E does nothing and the next gate is walked to in here).
    const back = REGIONS[id].exits[0];
    if (back) {
      await walkArea(back.stand, back.reach);
      await scene('[data-testid=area-3d]');
      await page.keyboard.press('KeyE');
      await until(() => !document.querySelector('[data-testid=area-3d]'), 60000);
      await villageReady();
      await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
      await sleep(2500);
    }
  }
} finally {
  if (shops) {
    fs.writeFileSync(path.join(out, `${view}-shops.json`), JSON.stringify(shopCosts, null, 2));
    console.log(JSON.stringify(shopCosts, null, 2));
  }
  if (H.errors.length) console.log('page errors:', H.errors.slice(0, 5));
  await H.close?.();
  await browser.close();
  server.close();
}
