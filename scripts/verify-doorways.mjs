// Walk-through of every map doorway (mock cloud, never real Supabase): my
// room → hub, each built district's gate in (walking on into it) and out
// (E at the exit, then the action button, then walking into it), a shop room
// of each district in and out, a hub interior in and out, and a locked gate.
// At each arrival it checks: I stand a step inside the doorway (not on its
// trigger), the way back is not offered at once, nothing bounces me back, and
// the music follows the map (<html data-music>: the hub's box, a district's
// piece, its shop room hears it muffled).
//
//   node --experimental-strip-types --no-warnings scripts/verify-doorways.mjs --pages /tmp/pages [--view s] [--max-ms 1200000]
import { launchBrowser, login, serve, setup } from './ui-harness.mjs';
import { BUILT_DISTRICTS, DISTRICTS } from '../app/lounge-districts.ts';
import { REGIONS, outdoorReturnPoint } from '../app/lounge-areas.ts';
import { arrivalPoint, inward } from '../app/lounge-map-doors.ts';
import { districtCounters, shopDoorOutside } from '../app/lounge-district-counters.ts';
import { VILLAGE_PLACES } from '../app/lounge-village-layout.ts';
import { interiorArrival } from '../app/lounge-interior-layout.ts';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const pages = opt('pages', '');
if (!pages) throw new Error('--pages <Pages build> is required (node scripts/build-standalone.mjs --out <dir> --site-url /)');
const view = opt('view', 's');
const maxMs = Number(opt('max-ms', '1500000'));
const only = opt('only', BUILT_DISTRICTS.join(',')).split(',');
const shotDir = opt('shots', '');
const started = Date.now();

const server = await serve(pages);
const browser = await launchBrowser();
const H = await setup({ browser, base: server.url, view });
const { page, js, sleep, until } = H;
const failures = [];
const passed = [];
const check = (ok, what) => {
  (ok ? passed : failures).push(what);
  console.log(`${ok ? '  ok ' : '  FAIL'} ${what}`);
};
const step = async (label, work) => {
  if (Date.now() - started > maxMs) throw new Error(`time budget spent before: ${label}`);
  console.log(label);
  try {
    await work();
  } catch (e) {
    check(false, `${label}: ${e.message.split('\n')[0]}`);
  }
};
const KEY = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
/** The arrow keys that walk along (x, z) on screen (the camera never turns). */
const keysFor = (x, z) => [x < -0.3 ? KEY.left : x > 0.3 ? KEY.right : null, z < -0.3 ? KEY.up : z > 0.3 ? KEY.down : null].filter(Boolean);
const fadeClear = () => until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
const focus = (sel) => js((s) => document.querySelector(s)?.focus({ preventScroll: true }), sel);
const data = (sel) => js((s) => ({ ...(document.querySelector(s)?.dataset ?? {}) }), sel);
const music = () => js(() => ({ ...document.documentElement.dataset }));
const near = (d, p, r) => Math.hypot(Number(d.avatarX) - p.x, Number(d.avatarZ) - p.z) < r;
const villageReady = () => until(() => {
  const s = document.querySelector('[data-testid=village-3d]')?.getAttribute('data-load-state');
  return !!s && s !== 'loading';
}, 240000);
const areaReady = (area) => until((a) => {
  const d = document.querySelector('[data-testid=area-3d]')?.dataset;
  return d?.area === a && d.loadState === 'ready';
}, 240000, area);
/** Walks (bumtadew:go, running) and waits until I stop within `r` of `p`. */
const walk = async (sel, p, r = 0.8) => {
  await focus(sel);
  await js((d) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: d })), p);
  await page.keyboard.down('Shift');
  try {
    await until((q) => {
      const d = document.querySelector(q.sel)?.dataset;
      return d?.walking === 'true' || Math.hypot(Number(d?.avatarX) - q.x, Number(d?.avatarZ) - q.z) < q.r;
    }, 30000, { ...p, sel, r });
    await until((q) => {
      const d = document.querySelector(q.sel)?.dataset;
      return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - q.x, Number(d.avatarZ) - q.z) < q.r;
    }, 240000, { ...p, sel, r });
  } finally {
    await page.keyboard.up('Shift');
  }
};
/** Holds the keys that walk outward through `door` until `done` (or the timeout). */
const pushInto = async (sel, door, done, ms = 120000, arg) => {
  const n = inward(door);
  const keys = keysFor(-n.x, -n.z);
  await focus(sel);
  for (const k of keys) await page.keyboard.down(k);
  try {
    return await until(done, ms, arg);
  } finally {
    for (const k of keys) await page.keyboard.up(k);
  }
};
const toast = () => js(() => [...document.querySelectorAll('.l-toast')].map((t) => t.textContent ?? '').join(' | '));

try {
  await step('my room → the hub', async () => {
    await login(H, server.url);
    await until(() => !!document.querySelector('.l-world-header'), 90000);
    await until(() => { const s = document.querySelector('[data-testid=bedroom-3d]')?.getAttribute('data-load-state'); return !!s && s !== 'loading'; }, 240000);
    await sleep(1500);
    // Holding ↓ right after walking in must not bounce me out (the doorway rests a moment).
    await focus('[data-testid=bedroom-3d]');
    await page.keyboard.down('ArrowDown');
    await sleep(250);
    await page.keyboard.up('ArrowDown');
    // …then walking on down through the doorway takes it.
    const out = await pushInto('[data-testid=bedroom-3d]', { x: 0, z: 1, stand: { x: 0, z: 0 }, reach: 1 }, () => !!document.querySelector('[data-testid=village-3d]'), 60000);
    if (out < 0) {
      await page.keyboard.press('Escape');
      await sleep(700);
      if (!(await H.clickText(/마을로 나가기/, 'dialog[open] button'))) await H.clickText(/^나가기/);
    }
    // (I may wake up beside the bed, away from the door: then the menu takes me out.)
    console.log(`  info walking down ${out >= 0 ? 'took' : 'did not reach'} my room's door; out via ${out >= 0 ? 'the doorway' : 'the menu'}`);
    await villageReady();
    await fadeClear();
    await sleep(1500);
  });

  for (const id of BUILT_DISTRICTS.filter((d) => only.includes(d))) {
    const gate = DISTRICTS[id].gate;
    const exit = REGIONS[id].exits.find((e) => e.to === 'village');
    await step(`hub → ${id}: walking on into the gate`, async () => {
      await walk('[data-testid=village-3d]', arrivalPoint(gate), 0.9);
      const took = await pushInto('[data-testid=village-3d]', gate, (a) => document.querySelector('[data-testid=area-3d]')?.dataset.area === a || !!document.querySelector('[data-testid=area-loading]'), 60000, id);
      check(took >= 0, `${id}: the gate takes me in without E`);
      check((await areaReady(id)) >= 0, `${id}: the map loads`);
      await fadeClear();
      await sleep(1200);
      const d = await data('[data-testid=area-3d]');
      check(near(d, REGIONS[id].arrive.village, 0.6), `${id}: I arrive a step in (${d.avatarX}, ${d.avatarZ})`);
      check(!String(d.action ?? '').startsWith('exit'), `${id}: the way back is not offered at once (${d.action || 'nothing'})`);
      check((await music()).music === id, `${id}: its own music plays (${(await music()).music})`);
      if (id === 'harbor') check((await music()).ambience === 'surf', 'harbor: surf and gulls');
      // E right away does nothing; I am still here a moment later.
      await focus('[data-testid=area-3d]');
      await page.keyboard.press('KeyE');
      await sleep(1500);
      check((await data('[data-testid=area-3d]')).area === id, `${id}: no bounce back to the hub`);
    });

    if (id !== 'hillside') {
      const weekday = new Date(Date.now() + 9 * 3_600_000).getUTCDay();
      const door = districtCounters(id, weekday).find((c) => c.a.kind === 'counter' && c.a.enter);
      const shop = door.a.enter;
      await step(`${id} → ${shop} → ${id}`, async () => {
        await walk('[data-testid=area-3d]', { x: door.x, z: door.z }, 0.6);
        await focus('[data-testid=area-3d]');
        await page.keyboard.press('KeyE');
        check((await until((a) => { const d = document.querySelector('[data-testid=interior-3d]')?.dataset; return d?.area === a && d.loadState === 'ready'; }, 240000, shop)) >= 0, `${shop}: the room loads`);
        await fadeClear();
        await sleep(1200);
        const d = await data('[data-testid=interior-3d]');
        const at = interiorArrival(shop);
        check(Math.hypot(Number(d.avatarX) - at.x, Number(d.avatarY) - at.y) < 3, `${shop}: I arrive a step inside (${d.avatarX}, ${d.avatarY})`);
        check(d.action !== 'door', `${shop}: 나가기 is not offered at once (${d.action || 'nothing'})`);
        const m = await music();
        check(m.music === id && m.musicIndoor === 'true', `${shop}: the ${id} piece goes on, muffled (${m.music}, indoor ${m.musicIndoor})`);
        // Walking left into the door takes me out.
        const out = await pushInto('[data-testid=interior-3d]', { x: 0, z: 0, stand: { x: 1, z: 0 }, reach: 1 }, (a) => document.querySelector('[data-testid=area-3d]')?.dataset.area === a, 120000, id);
        if (out < 0) await H.clickSel('.ih-action, [data-testid=interior-3d] .l-action-button');
        check(out >= 0, `${shop}: walking into the door goes back out`);
        await areaReady(id);
        await fadeClear();
        await sleep(1200);
        if (shotDir) await page.screenshot({ path: `${shotDir}/${shop}-out.png` });
        console.log('  info scenes:', await js(() => [...document.querySelectorAll('[data-testid$=\"-3d\"]')].map((e) => `${e.dataset.testid}:${e.dataset.area ?? ''}`).join(' ')));
        const o = await data('[data-testid=area-3d]');
        check(near(o, shopDoorOutside(shop).at, 0.7), `${shop}: back in front of the shop (${o.avatarX}, ${o.avatarZ})`);
        check(o.action !== 'counter', `${shop}: its door is not in my face (${o.action || 'nothing'})`);
        check((await music()).musicIndoor === 'false', `${id}: open air again`);
      });
    }

    await step(`${id} → hub: ${id === 'market' ? 'E at the exit' : id === 'harbor' ? 'the action button' : 'walking on into the exit'}`, async () => {
      await walk('[data-testid=area-3d]', exit.stand, 0.6);
      await sleep(900);
      if (id === 'market') {
        await focus('[data-testid=area-3d]');
        await page.keyboard.press('KeyE');
      } else if (id === 'harbor') check(await H.clickSel('.ar-action'), 'harbor: the exit button is there to click');
      else await pushInto('[data-testid=area-3d]', exit, () => !document.querySelector('[data-testid=area-3d]'), 60000);
      check((await until(() => !document.querySelector('[data-testid=area-3d]'), 60000)) >= 0, `${id}: out to the hub`);
      await villageReady();
      await fadeClear();
      await sleep(1500);
      const d = await data('[data-testid=village-3d]');
      check(near(d, outdoorReturnPoint(id), 0.9), `${id}: back a step in from its gate (${d.avatarX}, ${d.avatarZ})`);
      check(d.spot !== 'district', `${id}: the gate is not in my face (${d.spot || 'nothing'})`);
      check((await music()).music === 'box', `hub: the music box again (${(await music()).music})`);
    });
  }

  await step('a locked gate says why', async () => {
    const gate = DISTRICTS.ranch.gate;
    await walk('[data-testid=village-3d]', arrivalPoint(gate), 0.9);
    const said = await pushInto('[data-testid=village-3d]', gate, () => [...document.querySelectorAll('.l-toast')].some((t) => /목장|들길|연구/.test(t.textContent ?? '')), 60000);
    check(said >= 0, `ranch: walking into the locked gate explains it (${await toast()})`);
    check(!(await js(() => !!document.querySelector('[data-testid=area-3d]'))), 'ranch: I stay in the hub');
  });

  await step('hub → 회관 → hub', async () => {
    const hall = VILLAGE_PLACES.find((p) => p.id === 'hall');
    await walk('[data-testid=village-3d]', hall.entry, 0.6);
    await focus('[data-testid=village-3d]');
    await page.keyboard.press('KeyE');
    check((await until(() => { const d = document.querySelector('[data-testid=interior-3d]')?.dataset; return d?.area === 'lounge' && d.loadState === 'ready'; }, 240000)) >= 0, 'hall: loads');
    await fadeClear();
    await sleep(1200);
    const d = await data('[data-testid=interior-3d]');
    check(d.action !== 'door', `hall: 나가기 is not offered at once (${d.action || 'nothing'})`);
    check((await music()).music === 'hall', `hall: its piece (${(await music()).music})`);
    const out = await pushInto('[data-testid=interior-3d]', { x: 0, z: 0, stand: { x: 1, z: 0 }, reach: 1 }, () => !!document.querySelector('[data-testid=village-3d]'), 120000);
    check(out >= 0, 'hall: walking into the door goes back out');
    await villageReady();
    await fadeClear();
    await sleep(1500);
    const v = await data('[data-testid=village-3d]');
    check(v.entryReady !== 'true' || v.nearbyPlace !== 'hall', `hall: its door is not in my face (${v.nearbyPlace})`);
  });
} finally {
  console.log(`\n${passed.length} passed, ${failures.length} failed${H.errors.length ? `, page errors: ${H.errors.slice(0, 3).join(' / ')}` : ''}`);
  await H.close?.();
  await browser.close();
  server.close?.();
  if (failures.length) {
    for (const f of failures) console.log('  -', f);
    process.exitCode = 1;
  }
}
