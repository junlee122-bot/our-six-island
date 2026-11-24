// Two isolated local worlds; every write uses the real cloud engine. No real accounts.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { launchBrowser, login, serve, setup, VIEWS } from './ui-harness.mjs';
import { measureInPage } from './ui-measure.mjs';
import { freshLounge } from '../app/lounge-look.ts';
import { DEFAULT_BED } from '../app/lounge-bedroom-data.ts';
import { readLife } from '../app/lounge-life.ts';
import { PORTALS, portalAt, portalNetwork } from '../app/lounge-portals.ts';
import { BOARD_FRONT } from '../app/lounge-village-spots.ts';
import { hasExplorerPass } from '../app/lounge-explorer-pass.ts';

const args = process.argv.slice(2), opt = (name, fallback) => { const i = args.indexOf('--' + name); return i < 0 ? fallback : args[i + 1]; };
const pages = path.resolve(opt('pages', '')), out = path.resolve(opt('out', '.ui-shots/walking-portals'));
assert.ok(args.includes('--pages') && fs.existsSync(path.join(pages, 'index.html')), 'Pass an existing Pages build with --pages. This script never builds or deploys.');
const actors = opt('actors', '3,7').split(',').map(Number), views = opt('views', 's,fhd').split(',');
const forcePendingRetry = args.includes('--force-pending-retry');
assert.ok(actors.every((a) => a === 3 || a === 7) && views.every((v) => VIEWS[v]));
if (!process.env.CHROMIUM_PATH && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) process.env.CHROMIUM_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(out, { recursive: true });
const gatheringId = 'gathering-9501';
const report = { status: 'running', mockOnly: true, pages, startedAt: new Date().toISOString(), runs: [] };
const persist = () => fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
let browser, server;

async function run(actor, view) {
  const row = { actor, view, viewport: VIEWS[view], status: 'running', steps: [], screenshots: [], actions: [], portalRequests: [], expectedRejections: [], expectedConsoleErrors: [], consoleErrors: [], pageErrors: [], failedResources: [], apiFailures: [] };
  report.runs.push(row); persist();
  const H = await setup({ browser, base: server.url, actor, view,
    seedSave: { ...freshLounge(actor), bedroom: { version: 4, theme: 'friends', items: [{ ...DEFAULT_BED }] } },
    seedLife: (life) => {
      if (actor === 7) life.flags = [...(life.flags ?? []), 'district-harbor'];
      const host = Object.keys(life.actors).find((id) => life.actors[id] === 0), now = Date.now();
      life.gatherings = { records: [{ id: gatheringId, host: 0, hostId: host, place: 'bakery-meal', createdAt: now - 60_000, startsAt: now + 3_600_000, endsAt: now + 7_200_000, participants: [0], note: '카페에서 만나자.' }] };
      life.seq = Math.max(life.seq, 9510);
    },
  });
  const { page, ctx } = H, reads = [];
  let holdNext = false, held = false, release, rejectNext = false, rejectedRequestId, portalGate;
  await ctx.route('**/functions/v1/hohyeon-api', async (route) => {
    const c = route.request().postDataJSON()?.command;
    if (c?.action?.kind === 'portal') {
      if (holdNext) {
        holdNext = false;
        const promise = new Promise((resolve) => { release = () => { portalGate.released = true; resolve(); }; });
        portalGate = { requestId: c.requestId, promise, released: false, attempts: [] };
      }
      // cloudCall legitimately retries a timed-out action with the same ID.
      // Hold every transport attempt of that logical request until release.
      if (portalGate?.requestId === c.requestId && !portalGate.released) {
        portalGate.attempts.push({ requestId: c.requestId, sequence: c.sequence, at: Date.now() });
        held = true;
        await portalGate.promise;
      }
      if (rejectNext) {
        rejectNext = false; rejectedRequestId = c.requestId;
        // A server-side activity started after the panel opened. The real
        // engine must refuse departure; this fixture never touches coordinates.
        ((H.world().life.ext ??= {})[H.uid] ??= {}).pending = { expiresAt: Date.now() + 60_000 };
      }
    }
    return route.fallback();
  });
  await ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, quality: 'low', fpsCap: 30, dayNight: false })));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text().slice(0, 600);
    if (rejectedRequestId && m.location().url.includes('/functions/v1/hohyeon-api') && /409/.test(text)) row.expectedConsoleErrors.push(text);
    else row.consoleErrors.push(text);
  });
  page.on('requestfailed', (r) => { if (r.url().startsWith(server.url) && r.failure()?.errorText !== 'net::ERR_ABORTED') row.failedResources.push({ path: r.url().replace(server.url, '/'), error: r.failure()?.errorText }); });
  page.on('request', (r) => { if (r.url().includes('/functions/v1/hohyeon-api')) { try {
    const c = r.postDataJSON()?.command, a = c?.action;
    if (a) row.actions.push(a);
    if (a?.kind === 'portal') row.portalRequests.push({ requestId: c.requestId, sequence: c.sequence, to: a.to, at: Date.now() });
  } catch {} } });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(server.url)) row.failedResources.push({ path: r.url().replace(server.url, '/'), status: r.status() });
    if (r.status() < 400 || !r.url().includes('/functions/v1/')) return;
    const c = r.request().postDataJSON()?.command;
    const expected = c?.requestId === rejectedRequestId && c?.action?.kind === 'portal' && r.status() === 409;
    const item = { status: r.status(), action: c?.action };
    (expected ? row.expectedRejections : row.apiFailures).push(item);
    reads.push(r.json().then((b) => { item.error = b.error; }).catch(() => {}));
  });
  const self = () => Object.values(H.world().rooms).flatMap((r) => r.snapshot?.players ?? []).find((p) => p.id === H.uid);
  const resources = () => { const life = readLife(H.world().life); return structuredClone({ wallet: H.world().ledger.accounts['wallet-' + H.uid], bag: life.bag[H.uid], farms: life.farms[H.uid], inv: life.ext?.[H.uid]?.inv, goods: life.farmx?.[H.uid]?.goods }); };
  const wait = async (fn, arg, ms = 30_000) => assert.notEqual(await H.until(fn, ms, arg), -1, `UI wait: ${fn.toString().slice(0, 180)}`);
  const waitState = async (fn, label) => { const end = performance.now() + 30_000; while (!fn() && performance.now() < end) await H.sleep(100); assert.ok(fn(), label); };
  const step = async (label, work) => { console.log(`${view} actor ${actor}: ${label}`); const at = performance.now(); try { await work(); row.steps.push({ label, pass: true, ms: Math.round(performance.now() - at) }); } catch (error) { row.steps.push({ label, pass: false, error: error.message }); throw error; } finally { persist(); } };
  const shot = async (label, strict = true) => {
    await page.evaluate(() => document.fonts.ready);
    const file = `${view}-actor${actor}-${label}.png`; await page.screenshot({ path: path.join(out, file), timeout: 90_000 });
    const metrics = await page.evaluate(measureInPage); row.screenshots.push({ file, label, metrics }); persist();
    if (strict) for (const key of ['lowCount', 'smallCount', 'cutCount', 'coveredCount', 'overlapCount']) assert.equal(metrics[key], 0, `${label}: ${key} ${JSON.stringify(metrics)}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'no horizontal page overflow');
  };
  const close = async () => { for (let i = 0; i < 6 && await page.locator('dialog[open]').count(); i++) { await page.keyboard.press('Escape'); await H.sleep(100); } };
  const menu = async (id) => { await close(); await page.locator('.l-world-menu-button').click(); await page.getByTestId(`menu-${id}`).click(); };
  const scene = (area) => page.getByTestId(area === 'village' ? 'village-3d' : 'area-3d');
  const ready = async (area) => { await wait((area) => { const d = document.querySelector(`[data-testid=${area === 'village' ? 'village-3d' : 'area-3d'}]`)?.dataset; return d?.loadState === 'ready' && (area === 'village' || d.area === area) && !document.querySelector('[data-testid=scene-fade].is-active'); }, area, 180_000); };
  const arrived = async (area, point) => { await wait(([area, p]) => { const d = document.querySelector(`[data-testid=${area === 'village' ? 'village-3d' : 'area-3d'}]`)?.dataset; return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - p.x, Number(d.avatarZ) - p.z) < 0.6; }, [area, point], 120_000); };
  const e = async (area) => { await scene(area).focus(); await page.keyboard.press('KeyE'); };
  const openPortal = async (area) => { await page.getByTestId('action-button').filter({ hasText: '포탈' }).waitFor(); await e(area); await page.getByTestId('portal-panel').waitFor(); assert.equal(await page.locator('dialog[open]').count(), 1); };
  const padSync = async (area) => {
    await ready(area); await arrived(area, portalAt(area).point);
    await waitState(() => self()?.area === area, 'the authoritative player area matches the displayed scene');
    const n = portalNetwork(area); assert.ok(Math.hypot(self().x - n.x, self().y - n.y) < 0.2, 'the authoritative player is at the fixed destination pad');
  };
  try {
    await login(H, server.url); await page.getByTestId('village-return').waitFor({ timeout: 180_000 }); await page.getByTestId('village-return').click(); await ready('farm');
    const baseline = resources();
    await step('walk-to-the-physical-pad', async () => {
      const pin = page.locator('[data-minimap-place=portal]'); if (!await pin.isVisible()) await page.getByTestId('minimap-toggle').click();
      const before = row.actions.filter((a) => a.kind === 'portal').length;
      await pin.click(); await arrived('farm', portalAt('farm').point);
      assert.equal(row.actions.filter((a) => a.kind === 'portal').length, before, 'the map pin walks, without teleporting or opening a destination menu');
      assert.equal(await page.getByTestId('portal-panel').count(), 0); await shot('farm-waystone');
    });
    await step('pending-input-guard-and-authoritative-arrival', async () => {
      await openPortal('farm'); holdNext = true; const begin = row.actions.length, requestBegin = row.portalRequests.length;
      await page.getByTestId('portal-to-village').click(); await waitState(() => held, 'the real portal request is held by the local test transport');
      assert.equal(await page.getByTestId('portal-panel').getAttribute('aria-busy'), 'true');
      assert.equal(await page.locator('[data-testid^=portal-to-]:enabled').count(), 0);
      await page.keyboard.press('Escape'); await page.keyboard.press('ArrowRight');
      await page.getByTestId('portal-to-market').evaluate((el) => el.click());
      assert.equal(await page.getByTestId('portal-panel').count(), 1, 'Escape cannot expose the old scene during travel');
      // A screenshot can take longer than the real 12s action timeout on a
      // busy FHD software renderer. Check the pending DOM and layout directly,
      // then release promptly; captures resume after the real arrival.
      const metrics = await page.evaluate(measureInPage);
      for (const key of ['lowCount', 'smallCount', 'cutCount', 'coveredCount', 'overlapCount']) assert.equal(metrics[key], 0, `pending-travel: ${key} ${JSON.stringify(metrics)}`);
      assert.equal(metrics.overflowX, false, 'pending-travel: no horizontal page overflow');
      if (forcePendingRetry) {
        await waitState(() => portalGate.attempts.length >= 2, 'the actual 12s timeout retries the held logical request');
        assert.equal(await page.getByTestId('portal-panel').getAttribute('aria-busy'), 'true');
        assert.equal(await page.locator('[data-testid^=portal-to-]:enabled').count(), 0);
      }
      assert.equal(self().area, 'farm', 'no held transport attempt reaches the engine before release');
      row.pendingChecks = { metrics, forcedRetry: forcePendingRetry, heldAttempts: structuredClone(portalGate.attempts), sourceArea: self().area };
      release(); await padSync('village');
      const requests = row.portalRequests.slice(requestBegin);
      assert.equal(new Set(requests.map((r) => r.requestId)).size, 1, 'pending clicks do not enqueue a second logical trip; HTTP retries reuse its ID');
      assert.equal(new Set(requests.map((r) => r.sequence)).size, 1, 'all transport retries preserve the action sequence');
      row.pendingChecks.requests = structuredClone(requests);
      const travel = row.actions.slice(begin);
      assert.equal(travel.filter((a) => a.kind === 'area').length, 0, 'the UI applies the approved arrival without another area command');
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 700)));
      await padSync('village'); await shot('village-waystone');
    });
    await step('locked-destinations-and-excluded-areas', async () => {
      await openPortal('village'); assert.equal(await page.locator('[data-testid^=portal-to-]').count(), PORTALS.length);
      const explorer = hasExplorerPass(actor, Date.now());
      for (const id of ['hill', 'woods', 'hillside', 'ranch', 'foothill']) assert.equal(await page.getByTestId(`portal-to-${id}`).isDisabled(), !explorer, id);
      assert.equal(await page.getByTestId('portal-to-harbor').isDisabled(), !explorer && actor !== 7);
      assert.equal(await page.getByTestId('portal-to-village').isDisabled(), true);
      for (const id of ['farm', 'market']) assert.equal(await page.getByTestId(`portal-to-${id}`).isEnabled(), true);
      for (const id of ['mine', 'offshore', 'home']) assert.equal(await page.getByTestId(`portal-to-${id}`).count(), 0);
      if (!explorer) assert.match(await page.getByTestId('portal-panel').innerText(), /산길 정비/); await shot('destinations-and-unlock-hints'); await close();
    });
    await step('server-rejection-retains-the-source-pad', async () => {
      await openPortal('village'); rejectNext = true; await page.getByTestId('portal-to-market').click();
      await waitState(() => row.expectedRejections.length === 1, 'the actual engine rejects the concurrent activity with HTTP409'); await Promise.all(reads);
      await wait(() => document.querySelector('[data-testid=portal-panel]')?.getAttribute('aria-busy') === 'false');
      assert.match(row.expectedRejections[0].error, /낚시/); assert.equal(self().area, 'village');
      assert.deepEqual({ x: self().x, y: self().y }, portalNetwork('village')); assert.deepEqual(resources(), baseline);
      delete H.world().life.ext[H.uid].pending; await H.run(H.bots[0], 'read');
      await shot('refused-trip-keeps-the-menu'); await close();
    });
    await step('portal-cancels-pending-gathering-directions', async () => {
      await menu('gatherings'); await page.getByTestId(`gathering-guide-${gatheringId}`).waitFor();
      await page.evaluate(async (id) => {
        const audit = window.__portalGuideAudit = { go: [], beforePortal: -1 };
        window.addEventListener('bumtadew:go', (event) => audit.go.push({ ...event.detail }));
        document.querySelector(`[data-testid=gathering-guide-${id}]`).click();
        for (let i = 0; i < 25 && document.querySelector('dialog[open]'); i++) await new Promise((resolve) => setTimeout(resolve, 10));
        if (document.querySelector('dialog[open]')) throw new Error('The gathering dialog must close before E.');
        audit.beforePortal = audit.go.length;
        if (audit.beforePortal !== 0) throw new Error('The portal must open before the first pending guide command.');
        document.querySelector('[data-testid=village-3d]').focus();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', code: 'KeyE', bubbles: true, cancelable: true }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'e', code: 'KeyE', bubbles: true }));
      }, gatheringId);
      await page.getByTestId('portal-panel').waitFor(); const begin = row.actions.length;
      await page.getByTestId('portal-to-market').click(); await padSync('market');
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1100)));
      row.guideAudit = await page.evaluate(() => window.__portalGuideAudit); assert.equal(row.guideAudit.beforePortal, 0); assert.deepEqual(row.guideAudit.go, [], 'no stale gathering direction survives the portal');
      await padSync('market'); assert.equal(row.actions.slice(begin).filter((a) => a.kind === 'area').length, 0); await shot('market-arrival');
    });
    await step('walk-after-arrival-return-and-use-the-board', async () => {
      await scene('market').focus(); await page.keyboard.down('ArrowRight'); await H.sleep(500); await page.keyboard.up('ArrowRight');
      const pin = page.locator('[data-minimap-place=portal]'); if (!await pin.isVisible()) await page.getByTestId('minimap-toggle').click(); await pin.click(); await arrived('market', portalAt('market').point);
      await openPortal('market'); await page.getByTestId('portal-to-village').click(); await padSync('village');
      await scene('village').focus(); await page.keyboard.press('KeyB'); await arrived('village', BOARD_FRONT);
      await e('village'); await page.getByTestId('board-tab-gatherings').waitFor(); await shot('ordinary-board-after-return');
      assert.equal(self().area, 'village'); assert.deepEqual(resources(), baseline, 'walking and all successful/refused trips preserve money, bags and farms');
    });
    await Promise.all(reads); row.pageErrors = [...H.errors]; row.blockedExternalHosts = [...H.external];
    assert.deepEqual(row.pageErrors, []); assert.deepEqual(row.consoleErrors, []); assert.deepEqual(row.failedResources, []); assert.deepEqual(row.apiFailures, []); assert.equal(row.expectedRejections.length, 1);
    row.status = 'passed';
  } catch (error) { row.status = 'failed'; row.error = error.stack ?? error.message; row.pageErrors = [...H.errors]; await shot('failure', false).catch(() => {}); throw error; }
  finally { release?.(); persist(); await H.close(); }
}
try { server = await serve(pages); browser = await launchBrowser(); for (let i = 0; i < actors.length; i++) await run(actors[i], views[i % views.length]); report.status = 'passed'; }
catch (error) { report.status = 'failed'; report.error = error.stack ?? error.message; process.exitCode = 1; console.error(error); }
finally {
  report.finishedAt = new Date().toISOString(); persist();
  console.log(JSON.stringify({ status: report.status, contexts: report.runs.length,
    passedSteps: report.runs.reduce((n, r) => n + r.steps.filter((s) => s.pass).length, 0),
    captures: report.runs.reduce((n, r) => n + r.screenshots.length, 0),
    unexpectedErrors: report.runs.reduce((n, r) => n + r.pageErrors.length + r.consoleErrors.length + r.failedResources.length + r.apiFailures.length, 0),
    expectedServerRejections: report.runs.reduce((n, r) => n + r.expectedRejections.length, 0),
    guideAudits: report.runs.map((r) => ({ actor: r.actor, ...r.guideAudit })),
    pendingChecks: report.runs.map((r) => ({ actor: r.actor, heldAttempts: r.pendingChecks?.heldAttempts, requests: r.pendingChecks?.requests })),
  }, null, 2));
  await browser?.close().catch(() => {}); await server?.close();
}
