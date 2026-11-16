// Local Pages build and synthetic accounts only. ui-harness blocks external
// traffic and uses the real account validators / cloud engine for every write.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { launchBrowser, login, serve, setup, VIEWS } from './ui-harness.mjs';
import { measureInPage } from './ui-measure.mjs';
import { freshLounge } from '../app/lounge-look.ts';
import { friendVisitView } from '../app/lounge-accounts.ts';
import { CROP_INFO, ensureLifeMember, readLife } from '../app/lounge-life.ts';
import { DEFAULT_BED, roomOfHouse, setActiveRoomShape } from '../app/lounge-bedroom-data.ts';
import { canWalk, findWalkPath, roomAction, roomObstacles } from '../app/lounge-bedroom-navigation.ts';
import { yuchanRoomSpotAt, yuchanRoomSpots } from '../app/lounge-yuchan-room.ts';
import { soilAdvance } from '../app/lounge-farm-soil.ts';
import { farmField, fieldTileCenter } from '../app/lounge-farm-layout.ts';

const args = process.argv.slice(2), opt = (name, fallback) => { const i = args.indexOf('--' + name); return i < 0 ? fallback : args[i + 1]; };
const pages = path.resolve(opt('pages', '')), out = path.resolve(opt('out', '.ui-shots/yuchan-home'));
assert.ok(args.includes('--pages') && fs.existsSync(path.join(pages, 'index.html')), '--pages must name an existing Pages build');
const actors = opt('actors', '7,3').split(',').map(Number), views = opt('views', 's,fhd').split(',');
const selectedSteps = opt('steps', '').split(',').filter(Boolean);
assert.ok(actors.every((a) => a === 7 || a === 3) && views.every((v) => VIEWS[v]));
if (!process.env.CHROMIUM_PATH && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) process.env.CHROMIUM_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(out, { recursive: true });
const ownerUid = '77777777-2222-4333-8444-555555555557';
const oldRoom = () => ({ version: 4, theme: 'miku', wall: 'cream', floor: 'oak', access: 'friends', items: [{ ...DEFAULT_BED }] });
let ownerSave = freshLounge(7);
const report = { status: 'running', mockOnly: true, pages, startedAt: new Date().toISOString(), runs: [] };
const persist = () => fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
let browser, server;

async function run(actor, view) {
  const row = { actor, view, viewport: VIEWS[view], status: 'running', steps: [], screenshots: [], actions: [], pageErrors: [], consoleErrors: [], failedResources: [], apiFailures: [] };
  report.runs.push(row); persist();
  const H = await setup({ browser, base: server.url, actor, view, seedSave: actor === 7 ? (selectedSteps.length ? ownerSave : { ...ownerSave, bedroom: oldRoom() }) : freshLounge(actor), seedLife: (life, uid) => {
    if (actor !== 7) Object.assign(life, ensureLifeMember(life, ownerUid, 7));
    const ext = ((life.ext ??= {})[uid] ??= {});
    ext.furn = { ...ext.furn, plant: 1 }; // One genuinely owned copy in addition to the room-bound starter.
    life.farms[uid][0] = { crop: null, plantedAt: 0, t: 1 };
    life.farms[uid][1] = { crop: 'legendarytomato', plantedAt: Date.now() - CROP_INFO.legendarytomato.growMs, t: 1, wetMs: CROP_INFO.legendarytomato.growMs, wetUntil: Date.now() - 1000 };
    life.bag[uid].seeds = { tomato: 1 };
    life.bag[uid].produce = { ...life.bag[uid].produce, tomato: 1 };
  } });
  const { page, ctx } = H;
  if (actor === 3) await ctx.route('**/functions/v1/hohyeon-api', async (route) => {
    const body = route.request().postDataJSON() ?? {};
    if (body.op === 'visit' && body.owner === 7) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ visit: friendVisitView(7, ownerSave, H.world().life) }) });
    return route.fallback();
  });
  await ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, quality: 'low', fpsCap: 30, dayNight: false })));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('console', (m) => { if (m.type() === 'error') row.consoleErrors.push(m.text().slice(0, 600)); });
  page.on('requestfailed', (r) => { if (r.url().startsWith(server.url) && r.failure()?.errorText !== 'net::ERR_ABORTED') row.failedResources.push({ path: r.url().replace(server.url, '/'), error: r.failure()?.errorText }); });
  page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(server.url)) row.failedResources.push({ path: r.url().replace(server.url, '/'), status: r.status() }); if (r.status() >= 400 && r.url().includes('/functions/v1/')) row.apiFailures.push({ path: new URL(r.url()).pathname, status: r.status() }); });
  page.on('request', (r) => { if (!r.url().includes('/functions/v1/hohyeon-api')) return; try { const a = JSON.parse(r.postData() || '{}').command?.action; if (a) row.actions.push(a); } catch {} });
  const state = () => readLife(H.world().life);
  const resource = () => structuredClone({ ledger: H.world().ledger.accounts['wallet-' + H.uid], bag: state().bag[H.uid], inv: state().ext?.[H.uid]?.inv, furniture: state().ext?.[H.uid]?.furn, goods: state().farmx?.[H.uid]?.goods });
  const wait = async (fn, arg, ms = 30_000) => assert.notEqual(await H.until(fn, ms, arg), -1, `UI wait: ${fn.toString().slice(0, 180)}`);
  const waitState = async (fn, reason) => { const end = Date.now() + 30_000; while (!fn() && Date.now() < end) await H.sleep(120); assert.ok(fn(), reason); };
  const step = async (label, work) => { if (selectedSteps.length && !selectedSteps.includes(label)) return; console.log(`${view} actor ${actor}: ${label}`); const at = performance.now(); try { await work(); row.steps.push({ label, pass: true, ms: Math.round(performance.now() - at) }); } catch (e) { row.steps.push({ label, pass: false, error: e.message }); throw e; } finally { persist(); } };
  const shot = async (label, strict = true) => { await page.evaluate(() => document.fonts.ready); const file = `${view}-actor${actor}-${label}.png`; await page.screenshot({ path: path.join(out, file), timeout: 90_000 }); const metrics = await page.evaluate(measureInPage); row.screenshots.push({ file, label, metrics }); persist(); if (strict) for (const key of ['lowCount', 'smallCount', 'cutCount', 'coveredCount', 'overlapCount']) assert.equal(metrics[key], 0, `${label}: ${key}`); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false); };
  const close = async () => { for (let i = 0; i < 8 && await page.locator('dialog[open]').count(); i++) { await page.keyboard.press('Escape'); await H.sleep(100); } };
  const menu = async (id) => { await close(); await page.locator('.l-world-menu-button').click(); await page.getByTestId(`menu-${id}`).click(); };
  const roomReady = async () => { await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.loadState === 'ready', null, 180_000); await wait(() => !document.querySelector('[data-testid=scene-fade].is-active')); };
  const roomNow = () => actor === 7 ? H.saved()?.bedroom ?? oldRoom() : ownerSave.bedroom;
  const walk = async (point) => { await close(); await page.evaluate((p) => window.dispatchEvent(new CustomEvent('bumtadew:room-go', { detail: p })), point); await wait((p) => { const d = document.querySelector('[data-testid=bedroom-3d]')?.dataset; return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - p.x, Number(d.avatarZ) - p.z) < 0.4; }, point, 120_000); };
  const actionPoint = (kind, spotId) => {
    const room = roomNow(), shape = roomOfHouse(0); setActiveRoomShape(shape);
    const obstacles = roomObstacles(room, shape), own = actor === 7, points = [];
    for (let z = shape.minZ + 0.4; z < shape.maxZ - 0.4; z += 0.2) for (let x = shape.minX + 0.4; x < shape.maxX - 0.4; x += 0.2) {
      const p = { x, z }; if (!canWalk(p, obstacles)) continue;
      const basic = roomAction(p, room, { own, canExit: true, canDress: own, canCook: own, canSleep: own });
      const spot = yuchanRoomSpotAt(room, 7, p);
      if (spotId ? spot?.id !== spotId || ['exit', 'sleep', 'dress'].includes(basic?.kind) : basic?.kind !== kind || spot) continue;
      points.push(p);
    }
    const target = spotId ? yuchanRoomSpots(room, 7).find((s) => s.id === spotId) : { x: 1.5, z: 1.5 };
    points.sort((a, b) => Math.hypot(a.x - target.x, a.z - target.z) - Math.hypot(b.x - target.x, b.z - target.z));
    return points;
  };
  const walkToAction = async (kind, spotId) => {
    const from = await page.getByTestId('bedroom-3d').evaluate((el) => ({ x: Number(el.dataset.avatarX), z: Number(el.dataset.avatarZ) }));
    const obstacles = roomObstacles(roomNow());
    const point = actionPoint(kind, spotId).find((p) => Math.hypot(p.x - from.x, p.z - from.z) < 0.3 || findWalkPath(from, p, obstacles, { exact: true }).length);
    assert.ok(point, `a real walking route exists to ${spotId ?? kind}`); await walk(point);
    await wait(([kind, id]) => { const d = document.querySelector('[data-testid=bedroom-3d]')?.dataset; return d?.action === kind && (!id || d.roomSpot === id); }, [kind, spotId]);
  };
  const e = async () => { await page.getByTestId('bedroom-3d').focus(); await page.keyboard.press('KeyE'); };
  const inspect = async (id, label) => { await walkToAction('look', id); await e(); await page.getByTestId(`yuchan-room-story-${id}`).waitFor(); await page.getByTestId('yuchan-room-reply-0').click(); await page.getByTestId('yuchan-room-answer').waitFor(); await shot(label); await close(); };
  try {
    await login(H, server.url); await wait(() => !!document.querySelector('.l-world-header'), null, 90_000); await roomReady();
    if (actor === 7) {
      await step('old-room-kept-and-explicit-starter-set', async () => {
        assert.deepEqual(H.saved().bedroom, oldRoom(), 'loading an old v4 room never replaces it');
        await walkToAction('decorate'); await e(); await page.getByTestId('room-settings').click(); await page.getByTestId('room-set-yuchan').click(); await page.getByTestId('yuchan-room-set').waitFor();
        assert.deepEqual(H.saved().bedroom, oldRoom(), 'preview does not change a save'); await shot('set-preview');
        await page.getByTestId('yuchan-room-set-apply').click(); await waitState(() => H.saved()?.bedroom.items.length > 10, 'the confirmed starter room is validated and saved');
        await page.getByTestId('room-done').click(); await roomReady();
      });
      await step('three-real-e-interactions-are-reward-free', async () => {
        const before = resource(), actions = row.actions.length;
        for (const id of ['photo', 'rest', 'tomato-note']) await inspect(id, id);
        assert.deepEqual(resource(), before, 'looking, resting and reading grant no food, crops, money or furniture');
        assert.ok(row.actions.slice(actions).every((a) => a.kind === 'move' || (a.kind === 'room' && Object.keys(a).length === 1)), 'stories send no gameplay commands; an earlier room save may finish its visitor notification');
        for (let i = 0; i < 6 && await page.locator('.l-banner-close').count(); i++) await page.locator('.l-banner-close').click();
        await walkToAction('decorate'); await shot('furnished-home');
      });
      await step('decorate-copy-limit-save-and-reconnect', async () => {
        await walkToAction('decorate'); await e(); await page.getByTestId('room-add').click();
        assert.equal(await page.locator('[data-testid=room-catalog] [data-ref=books]').isDisabled(), true, 'the room allowance cannot be duplicated for free');
        await page.locator('[data-testid=room-catalog] [data-ref=plant]').click();
        await waitState(() => H.saved()?.bedroom.items.filter((i) => i.ref === 'plant').length === 2, 'one purchased plant plus one starter plant can be saved');
        const added = H.saved().bedroom.items.find((i) => i.ref === 'plant' && i.id !== 'yc-plant');
        await page.getByTestId('room-flip').click(); await waitState(() => H.saved().bedroom.items.find((i) => i.id === added.id).rotY !== added.rotY, 'the prop’s flip is saved');
        const rotated = structuredClone(H.saved().bedroom.items.find((i) => i.id === added.id));
        await page.getByTestId('bedroom-3d').focus(); await page.keyboard.press('ArrowRight');
        await waitState(() => H.saved().bedroom.items.find((i) => i.id === added.id).x !== rotated.x, 'an actual editing arrow moves the furniture');
        await page.getByTestId('room-settings').click(); await page.getByTestId('room-set-yuchan').click(); await page.getByTestId('yuchan-room-set-preserved').waitFor();
        assert.equal(await page.getByTestId('yuchan-room-set-apply').count(), 0, 'a decorated room cannot be replaced'); await close();
        await page.getByTestId('room-done').click(); ownerSave = H.saved();
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 }); await roomReady();
        assert.deepEqual(H.saved().bedroom, ownerSave.bedroom, 'the entire edited layout survives reconnection');
        await inspect('tomato-note', 'memo-after-reconnect');
      });
    } else {
      await step('friend-visit-owner-room-and-real-e', async () => {
        await menu('friends'); await page.getByTestId('resting-7').getByRole('button', { name: '방에 놀러 가기' }).click(); await page.getByTestId('friend-visit').waitFor({ state: 'attached' }); await roomReady();
        assert.equal(await page.getByTestId('bedroom-3d').getAttribute('data-room-actor'), '7');
        const before = resource(); for (const id of ['photo', 'rest', 'tomato-note']) await inspect(id, `visit-${id}`); assert.deepEqual(resource(), before);
        await page.evaluate(() => window.dispatchEvent(new CustomEvent('bumtadew:room-decorate')));
        assert.equal(await page.getByTestId('bedroom-3d').getAttribute('data-editing'), 'false'); assert.equal(await page.getByTestId('room-set-yuchan').count(), 0);
        await shot('visitor-home');
      });
      await step('guestbook-note-persists-without-owner-edit', async () => {
        const ownerBefore = structuredClone(ownerSave), text = '차 자리와 토마토 메모 잘 보고 가요.';
        await page.getByTestId('visit-guestbook-jump').click(); await page.getByTestId('guestbook-text').fill(text); await page.getByTestId('guestbook-send').click();
        await waitState(() => friendVisitView(7, ownerSave, H.world().life).guestbook.some((n) => n.text === text && n.actor === 3), 'the real cloud engine saves the visiting friend’s note');
        assert.deepEqual(ownerSave, ownerBefore, 'writing a guestbook cannot change the owner profile');
        await shot('guestbook'); await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 }); await roomReady();
        await menu('friends'); await page.getByTestId('resting-7').getByRole('button', { name: '방에 놀러 가기' }).click(); await roomReady(); await page.getByTestId('visit-guestbook-jump').click();
        assert.match(await page.locator('#visit-guestbook').innerText(), new RegExp(text.replace('.', '\\.'))); await page.keyboard.press('Escape');
        await walkToAction('exit'); await e(); await wait(() => { const d = document.querySelector('[data-testid=area-3d]')?.dataset; return d?.area === 'farm' && d.loadState === 'ready'; }, null, 180_000);
      });
    }
    await step('legendary-tomato-seed-plant-water-harvest-and-inventory', async () => {
      await close(); if (await page.getByTestId('bedroom-3d').count()) await page.getByTestId('village-return').click();
      await wait(() => { const d = document.querySelector('[data-testid=area-3d]')?.dataset; return d?.area === 'farm' && d.loadState === 'ready'; }, null, 180_000);
      const tilePoint = fieldTileCenter(farmField(actor), 1), fieldPoint = { x: tilePoint.x, z: tilePoint.z + 2 };
      await page.evaluate((p) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: p })), fieldPoint);
      await wait((p) => { const d = document.querySelector('[data-testid=area-3d]')?.dataset; return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - p.x, Number(d.avatarZ) - p.z) < 0.5; }, fieldPoint, 120_000);
      await shot('tomato-ripe-farm'); // A separate mature visual fixture; tile 0 below is grown through the engine.
      await menu('shop'); await page.getByTestId('guide-general').getByRole('button', { name: '가기', exact: true }).click();
      await wait(() => { const d = document.querySelector('[data-testid=area-3d]')?.dataset; return d?.area === 'market' && d.loadState === 'ready'; }, null, 180_000);
      await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
      if (!await page.locator('[data-minimap-place=general]').isVisible()) await page.getByTestId('minimap-toggle').click();
      await page.locator('[data-minimap-place=general]').click();
      await wait(() => document.querySelector('[data-testid=area-3d]')?.dataset.walking === 'false' && document.querySelector('[data-testid=action-button]')?.textContent.includes('등불 잡화점 들어가기'), null, 120_000);
      await page.getByTestId('area-3d').focus(); await page.keyboard.press('KeyE');
      await wait(() => { const d = document.querySelector('[data-testid=interior-3d]')?.dataset; return d?.area === 'general' && d.loadState === 'ready'; }, null, 180_000);
      await page.getByTestId('interior-counter-route').click();
      await wait(() => document.querySelector('[data-testid=interior-3d]')?.dataset.walking === 'false' && document.querySelector('[data-testid=action-button]')?.textContent.includes('잡화점 이용하기'), null, 120_000);
      await page.getByTestId('interior-3d').focus(); await page.keyboard.press('KeyE');
      const seed = page.getByTestId('shop-buy-seed-legendarytomato'); await seed.waitFor(); await seed.getByRole('button', { name: /사기/ }).click();
      await waitState(() => (state().bag[H.uid].seeds.legendarytomato ?? 0) === 1, 'a seed is actually bought');
      await menu('farm'); await page.getByTestId('plot-0').click(); await page.getByTestId('farm-seed-legendarytomato').click(); await page.getByTestId('farm-plant-selected').click();
      await waitState(() => state().farms[H.uid][0]?.crop === 'legendarytomato', 'the selected seed is planted');
      await page.getByTestId('plot-0-water').click(); await waitState(() => H.world().life.farms[H.uid][0].wetUntil > Date.now(), 'watering changes canonical soil');
      await wait(() => ['growing', 'ready'].includes(document.querySelector('[data-testid=plot-0]')?.dataset.state)); await shot('tomato-growing');
      // Fixture-only elapsed growth, preserving live session clocks. Plant,
      // water, readiness projection and harvest all use the actual engine.
      assert.ok(soilAdvance(H.world().life.farms[H.uid][0], CROP_INFO.legendarytomato.growMs + 1, Date.now()));
      await H.run(H.bots[0], 'read');
      await page.getByTestId('plot-0-harvest').waitFor(); await page.getByTestId('plot-0-harvest').click(); await waitState(() => !state().farms[H.uid][0]?.crop, 'the ripe tomato is harvested once');
      await menu('bag');
      const slot = page.locator('.l-inv-slot[aria-label^="전설의 토마토 "]:not([aria-label*="씨앗"])'); await slot.first().waitFor();
      const normal = page.getByRole('button', { name: '토마토 1개', exact: true }); await normal.waitFor();
      assert.notEqual(await slot.first().locator('svg').first().innerHTML(), await normal.first().locator('svg').first().innerHTML(), 'the golden legendary crop icon is distinct from the normal tomato');
      assert.match(await slot.first().getAttribute('aria-label'), /1개/); await page.mouse.move(20, 20); await shot('tomato-inventory');
      assert.ok(row.actions.some((a) => a.kind === 'plant' && a.crop === 'legendarytomato') && row.actions.some((a) => a.kind === 'harvest'), 'browser actions travel through the cloud engine');
    });
    row.pageErrors = [...H.errors]; assert.deepEqual(row.pageErrors, []); assert.deepEqual(row.consoleErrors, []); assert.deepEqual(row.failedResources, []); assert.deepEqual(row.apiFailures, []); row.status = 'passed';
  } catch (error) { row.status = 'failed'; row.error = error.stack ?? error.message; row.pageErrors = [...H.errors]; await shot('failure', false).catch(() => {}); throw error; }
  finally { persist(); await H.close(); }
}
try { server = await serve(pages); browser = await launchBrowser(); for (let i = 0; i < actors.length; i++) await run(actors[i], views[i % views.length]); report.status = 'passed'; }
catch (error) { report.status = 'failed'; report.error = error.stack ?? error.message; process.exitCode = 1; console.error(error); }
finally { report.finishedAt = new Date().toISOString(); persist(); await browser?.close().catch(() => {}); await server?.close(); }
