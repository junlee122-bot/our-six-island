// Focused, isolated browser checks for village services and life actions.
// node --experimental-strip-types scripts/verify-village-life-ui.mjs --pages <build>
// Optional: --out .ui-shots/village-life --only desktop,mobile
// Uses the real cloud engine behind ui-harness's local request interception.
// The synthetic player always walks/clicks/presses keys; no application state or
// position is injected into the page. Other synthetic friends are fixture actors.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { launchBrowser, login, serve, setup } from './ui-harness.mjs';
import { measureInPage } from './ui-measure.mjs';
import { UI_METRICS } from './ui-report.mjs';
import { VILLAGE_BOUNDS, villageToNetwork } from '../app/lounge-village-layout.ts';
import { villageCameraFrame } from '../app/lounge-village-camera.ts';
import { SPAWN_POINTS } from '../app/lounge-village-spots.ts';
import { lifeView } from '../app/lounge-life.ts';
import { dayStart, seasonOf, seasonOfDay } from '../app/lounge-calendar.ts';
import { kstDay } from '../app/lounge-economy.ts';

const args = process.argv.slice(2);
const opt = (key, fallback) => { const i = args.indexOf('--' + key); return i < 0 ? fallback : args[i + 1]; };
const pages = opt('pages', '');
if (!pages || !fs.existsSync(path.join(pages, 'index.html')))
  throw new Error('Pass --pages with an existing Pages build; this script never builds or deploys.');
const out = path.resolve(opt('out', '.ui-shots/village-life'));
const only = new Set(opt('only', 'desktop,mobile').split(','));
assert.ok(only.size && [...only].every((v) => v === 'desktop' || v === 'mobile'), '--only accepts desktop,mobile');
fs.mkdirSync(out, { recursive: true });

// A winter noon fixture, with real monotonic passage of time for casts and leases.
// Date.now is restored in finally and this never changes OS/browser profile time.
const realNow = Date.now;
let winterDay = kstDay(realNow());
for (let n = 0; n < 40 && seasonOfDay(winterDay) !== 'winter'; n++) winterDay++;
assert.equal(seasonOfDay(winterDay), 'winter');
const fixtureStart = dayStart(winterDay) + 12 * 3_600_000, started = performance.now();
Date.now = () => Math.floor(fixtureStart + performance.now() - started);
const report = { createdAt: new Date(realNow()).toISOString(), fixtureAt: new Date(fixtureStart).toISOString(), build: path.resolve(pages), status: 'running', views: {}, failures: [] };
const persistReport = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
persistReport();
let browser, server, interrupted = false, watchdog;
const stop = () => {
  if (interrupted) return;
  interrupted = true;
  report.failures.push('Browser verification interrupted; incomplete steps are not passes.');
  report.status = 'interrupted';
  persistReport();
  void browser?.close().catch(() => {});
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

async function runView(mobile = false) {
  const name = mobile ? 'mobile' : 'desktop';
  const res = report.views[name] = { viewport: mobile ? [390, 844] : [1280, 720], steps: [], screenshots: [], console: [], errors: [], requests: [] };
  // setup retains its normal mock logic; only the isolated context's device varies.
  const host = mobile ? { newContext: (options) => browser.newContext({ ...options, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }) } : browser;
  let H;
  try {
    H = await setup({ browser: host, base: server.url, view: 's' });
    const { page, ctx, js, sleep } = H;
    // Supported low graphics preset keeps every building and interaction while
    // avoiding costly shadows on CI's software GPU. It is not simpleGraphics.
    await ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, fpsCap: 30, quality: 'low' })));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    res.renderSettings = { fpsCap: 30, quality: 'low', reducedMotion: true };
    // Change only wall time. Playwright's clock also wraps animation callbacks,
    // which can stall the capped WebGL loop; native rAF and timers stay intact.
    await ctx.addInitScript((start) => {
      const at = performance.now();
      Date.now = () => Math.floor(start + performance.now() - at);
    }, Date.now());
    page.on('console', (msg) => { if (msg.type() === 'error') res.console.push(msg.text().slice(0, 500)); });
    page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(server.url)) res.requests.push({ status: r.status(), url: r.url().replace(server.url, '/') }); });
    // Record actual requests made by the tested page, rather than fabricating
    // action counts from render state. Payloads contain synthetic test data only.
    const commands = [];
    // Delay only these synthetic requests to make duplicate-input races visible.
    // fallback always lands in ui-harness's mocked context route (never fetch).
    await page.route('**/functions/v1/hohyeon-api', async (route) => {
      let kind;
      try { kind = JSON.parse(route.request().postData() || '{}').command?.action?.kind; } catch {}
      if (['pick', 'forage', 'chop'].includes(kind)) await new Promise((done) => setTimeout(done, 700));
      await route.fallback();
    });
    page.on('request', (r) => {
      if (!r.url().includes('/functions/v1/hohyeon-api')) return;
      try { const body = JSON.parse(r.postData() || '{}'); if (body.command) commands.push(body.command); } catch {}
    });
    const wait = async (fn, arg, timeout = 30_000) => {
      assert.notEqual(await H.until(fn, timeout, arg), -1, `UI wait timed out: ${fn.toString().slice(0, 150)}`);
    };
    const waitMock = async (check, label) => {
      const end = performance.now() + 15_000;
      while (!check() && performance.now() < end) await sleep(100);
      assert.ok(check(), label);
    };
    const model = () => lifeView(H.world().life, H.uid, 3, Date.now());
    const shot = async (label, allMetrics = false) => {
      await js(() => document.fonts.ready);
      const file = `${name}-${label}.png`;
      await page.screenshot({ path: path.join(out, file), timeout: 90_000 });
      const measurements = await js(measureInPage);
      res.screenshots.push({ label, file, viewport: page.viewportSize(), measurements });
      assert.equal(measurements.coveredCount, 0,
        'visible controls remain reachable: ' + JSON.stringify(measurements.covered));
      if (allMetrics) for (const metric of UI_METRICS) assert.equal(measurements[metric], 0, label + ': ' + metric);
    };
    const step = async (label, work) => {
      const at = performance.now();
      console.log(`${name} START ${label}`);
      try { await work(); res.steps.push({ label, pass: true, ms: Math.round(performance.now() - at) }); console.log(`${name} PASS ${label}`); }
      catch (error) {
        res.steps.push({ label, pass: false, error: error.message });
        report.failures.push(`${name}: ${label}: ${error.message}`);
        res.lastPins = await js(() => [...document.querySelectorAll('[data-minimap-friend], [data-minimap-cluster]')].map((e) => ({ actor: e.getAttribute('data-minimap-friend'), indoor: e.getAttribute('data-indoor'), cluster: e.getAttribute('data-minimap-cluster'), label: e.getAttribute('aria-label') }))).catch(() => []);
        await shot(label + '-failed').catch(() => {});
        console.error(`${name} FAIL ${label}: ${error.message}`);
        throw error;
      } finally { persistReport(); }
    };
    const click = async (selector) => {
      await page.locator(selector).first().waitFor({ state: 'visible', timeout: 30_000 });
      // Use a real pointer at the visible centre. Avoid Playwright's scroll
      // phase stalling behind SwiftShader while the full 3D village animates.
      const hit = await js((s) => {
        const e = document.querySelector(s), r = e.getBoundingClientRect();
        const x = r.x + r.width / 2, y = r.y + r.height / 2;
        return { x, y, clear: e.contains(document.elementFromPoint(x, y)), disabled: e.matches(':disabled') };
      }, selector);
      assert.ok(hit.clear && !hit.disabled, 'click target is visible, enabled and unobstructed: ' + selector);
      await page.mouse.click(hit.x, hit.y);
    };
    const focus = () => page.locator('[data-testid=village-3d], [data-testid=bedroom-3d], [data-testid=interior-3d]').first().focus();
    const runTo = async (arrive) => {
      await focus();
      await page.keyboard.down('Shift');
      try { await arrive(); } finally { await page.keyboard.up('Shift'); }
    };
    const closeDialogs = async () => {
      for (let i = 0; i < 5 && await page.locator('dialog[open]').count(); i++) { await page.keyboard.press('Escape'); await sleep(250); }
    };
    const village = async () => {
      if (await js(() => document.querySelector('main.l-app')?.getAttribute('data-space') === 'village')) return;
      await closeDialogs();
      await page.keyboard.press('Escape');
      await sleep(250);
      if (!(await js(() => document.querySelector('main.l-app')?.getAttribute('data-space') === 'village')))
        await page.getByRole('button', { name: /마을로 나가기/ }).click();
      await wait(() => document.querySelector('[data-testid=village-3d]')?.getAttribute('data-load-state') === 'ready', null, 180_000);
      await sleep(500);
    };
    const stationary = async (near) => wait((id) => {
      const d = document.querySelector('[data-testid=village-3d]')?.dataset;
      return d?.walking === 'false' && (!id || d.nearbyPlace === id);
    }, near, 120_000);
    const position = () => js(() => {
      const d = document.querySelector('[data-testid=village-3d]').dataset;
      return { x: Number(d.avatarX), z: Number(d.avatarZ) };
    });
    const directory = async (district) => {
      await closeDialogs();
      if (!(await page.locator('.hv-directory').count())) await click('.hv-top-tools button');
      await click(`.hv-directory [data-district="${district}"]`);
      await runTo(async () => { await sleep(400); await stationary(); });
    };
    const pressAction = () => click('[data-testid=action-button].hv-action');
    const guardedAction = async (kind, changed, label) => {
      const before = commands.filter((c) => c.action?.kind === kind).length;
      await pressAction();
      await focus();
      for (let i = 0; i < 3; i++) { await page.keyboard.press('KeyE'); await sleep(60); }
      await waitMock(changed, label);
      await sleep(150);
      assert.equal(commands.filter((c) => c.action?.kind === kind).length, before + 1, label + ': repeated E during 700ms reply sends one action');
    };
    const walkBuilding = async (id) => {
      if (!(await page.locator('#hv-minimap-body').count())) await click('[data-testid=minimap-toggle]');
      await click(`[data-minimap-place="${id}"]`);
      await runTo(async () => { await sleep(400); await stationary(id); });
    };
    // The overview makes the real ground clickable. Projection uses the public
    // camera contract + its observable data attributes; it never teleports.
    const walkPoint = async (point) => {
      await closeDialogs();
      if (await page.locator('#hv-minimap-body').count()) await click('[data-testid=minimap-toggle]');
      await click('[aria-label="마을 전체 보기"]');
      await wait(() => document.querySelector('[data-testid=village-3d]')?.dataset.overview === 'true');
      await sleep(650);
      const view = await js(() => {
        const el = document.querySelector('[data-testid=village-3d]'), rect = el.getBoundingClientRect(), d = el.dataset;
        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height, cw: el.clientWidth, ch: el.clientHeight, zoom: Number(d.zoom), tx: Number(d.targetX), tz: Number(d.targetZ) };
      });
      const { half } = villageCameraFrame(view.cw, view.ch, VILLAGE_BOUNDS.width, VILLAGE_BOUNDS.depth), aspect = view.cw / view.ch;
      const camera = new THREE.OrthographicCamera(-half * aspect, half * aspect, half, -half, .1, 180);
      const target = new THREE.Vector3(view.tx, 0, view.tz);
      camera.position.copy(target).add(new THREE.Vector3(34, 43, 52));
      camera.lookAt(target); camera.zoom = view.zoom; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      const p = new THREE.Vector3(point.x, 0, point.z).project(camera);
      const sx = view.x + (p.x + 1) * view.w / 2, sy = view.y + (1 - p.y) * view.h / 2;
      assert.ok(sx > 0 && sy > 0 && sx < 1280 && sy < 720, 'world target projects inside the viewport');
      assert.equal(await js(([x, y]) => document.elementFromPoint(x, y)?.tagName, [sx, sy]), 'CANVAS', 'ground click must not be hidden under a HUD');
      await page.mouse.click(sx, sy);
      await runTo(() => wait((point) => {
        const d = document.querySelector('[data-testid=village-3d]')?.dataset;
        return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - point.x, Number(d.avatarZ) - point.z) < 1.2;
      }, point, 120_000));
      const arrived = await position();
      assert.ok(Math.hypot(arrived.x - point.x, arrived.z - point.z) < 1.2, 'walk reaches resource through collision-safe path');
    };

    if (mobile) {
      await step('pc-guidance-and-link', async () => {
        await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto(server.url + '?lounge=BEMTADUVLY');
        await page.getByTestId('pc-only').waitFor({ timeout: 60_000 });
        assert.match(await page.locator('h1').innerText(), /PC 게임/);
        assert.equal(await page.locator('.l-auth-card, [data-testid=village-3d]').count(), 0);
        await page.getByRole('button', { name: 'PC로 보낼 주소 복사' }).click();
        await page.getByRole('button', { name: '주소를 복사했어요' }).waitFor();
        const copied = await js(() => navigator.clipboard.readText());
        assert.match(copied, /^https:\/\/junlee122-bot\.github\.io\/our-six-island\//);
        assert.equal(await js(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        const links = await page.locator('.l-pc-only-links a').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
        assert.equal(links.length, 2);
        assert.ok(links.every((url) => url === 'https://github.com/junlee122-bot/our-six-island/releases/latest'));
        await shot('pc-guidance');
        res.mobileScope = 'Existing PC-only policy verified; no mobile village features claimed.';
      });
      return;
    }

    await step('login-and-winter-world', async () => {
      await login(H, server.url);
      await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.getAttribute('data-load-state') === 'ready', null, 180_000);
      await village();
      await wait(() => {
        const d = document.querySelector('[data-testid=village-3d]')?.dataset;
        return d?.shopSalonBuilding === 'loaded' && d.shopBankBuilding === 'loaded' && d.karchiveMuseum === 'loaded';
      }, null, 180_000);
      assert.equal(seasonOf(Date.now()), 'winter');
      // Asset promises resolve before the animation loop paints the first
      // frame. Wait for its observable world data, especially under a FPS cap.
      await wait(() => {
        const d = document.querySelector('[data-testid=village-3d]')?.dataset;
        return d?.season === 'winter' && Number.isFinite(Number(d.avatarX));
      }, null, 60_000);
      assert.equal(await page.getByTestId('village-3d').getAttribute('data-season'), 'winter');
      await shot('winter-world');
      res.winterVisualReview = 'Screenshot requires visual review of leaf/bark texture; this test asserts season and loaded model state only.';
    });
    await step('minimap-friends-museum-resize', async () => {
      await click('[data-minimap-cluster]');
      assert.equal(await page.locator('#hv-minimap-peers [data-minimap-friend]').count(), 3);
      for (const button of await page.locator('#hv-minimap-peers [data-minimap-friend]').all()) {
        const r = await button.boundingBox();
        assert.ok(r.height >= 44);
        assert.equal(await button.evaluate((e) => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }), true);
      }
      await shot('friend-cluster-list');
      await click('[aria-label="친구 위치 목록 닫기"]');
      const fixtureResponses = [];
      for (const [bot, action] of [[H.bots[0], { kind: 'area', area: 'casino' }], [H.bots[1], { kind: 'move', ...villageToNetwork({ x: -28, z: 8 }) }]]) {
        const response = await H.run(bot, 'action', { action });
        fixtureResponses.push({ actor: bot.actor, action, response });
        assert.ok(!response.error, 'fixture friend move succeeds: ' + JSON.stringify(response.error));
      }
      res.fixtureResponses = fixtureResponses;
      await wait(() => document.querySelector('[data-minimap-friend="0"]')?.getAttribute('data-indoor') === 'true');
      assert.equal(await page.locator('[data-minimap-friend]').count(), 3);
      assert.equal(await page.locator('[data-minimap-friend="3"]').count(), 0);
      assert.match(await page.locator('[data-minimap-friend="0"]').getAttribute('aria-label'), /카지노 안/);
      assert.equal(await page.locator('[data-minimap-place=museum]').count(), 1);
      const small = await page.locator('#hv-minimap-body').boundingBox();
      await click('[data-testid=minimap-resize]');
      const big = await page.locator('#hv-minimap-body').boundingBox();
      assert.ok(big.width > small.width + 100);
      assert.ok(big.x >= 0 && big.y >= 0 && big.x + big.width <= 1281 && big.y + big.height <= 721, 'expanded map fits 1280×720');
      await shot('expanded-map');
      await click('[data-testid=minimap-toggle]');
      assert.equal(await page.locator('#hv-minimap-body').count(), 0);
      await click('[data-testid=minimap-toggle]'); await click('[data-testid=minimap-resize]');
    });
    await step('museum-walk-and-open', async () => {
      await click('[data-minimap-place=museum]');
      await runTo(async () => { await sleep(400); await stationary(); });
      await wait(() => document.querySelector('[data-testid=village-3d]')?.dataset.spot === 'museum');
      await shot('museum-door'); await pressAction();
      await page.getByRole('dialog').filter({ hasText: '박물관' }).waitFor();
      await shot('museum'); await closeDialogs();
    });
    await step('salon-walk-and-customization', async () => {
      await walkBuilding('wardrobe'); await shot('salon-door'); await pressAction();
      await wait(() => {
        const d = document.querySelector('[data-testid=interior-3d]')?.dataset;
        return d?.area === 'salon' && d.loadState === 'ready' && Number(d.salonModels) === 8 && d.salonState === 'loaded';
      }, null, 180_000);
      assert.equal(await page.getByTestId('wardrobe-preview').count(), 0, 'the salon opens on a walkable floor');
      await shot('salon-interior');
      await click('[data-testid=interior-salon-route]');
      await runTo(() => wait(() => {
        const d = document.querySelector('[data-testid=interior-3d]')?.dataset;
        return d?.action === 'salon' && d.walking === 'false' && d.nearSalon === 'true';
      }, null, 120_000));
      await page.keyboard.press('KeyE');
      await wait(() => document.querySelector('main.l-app')?.getAttribute('data-space') === 'wardrobe', null, 60_000);
      await wait(() => {
        const canvas = document.querySelector('[data-testid=wardrobe-preview] canvas');
        if (!(canvas instanceof HTMLCanvasElement) || !canvas.width || !canvas.height) return false;
        const context = canvas.getContext('2d');
        if (!context) return false;
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let visible = 0;
        for (let p = 3; p < pixels.length; p += 4) if (pixels[p] > 80) visible++;
        return visible > canvas.width * canvas.height * .02;
      });
      await shot('salon-customization', true);
      await page.setViewportSize({ width: 1920, height: 1080 }); await sleep(600);
      await shot('salon-customization-fhd', true);
      await page.setViewportSize({ width: 1280, height: 720 }); await sleep(600);
      const savedColors = page.waitForResponse((response) => {
        if (!response.url().includes('/functions/v1/hohyeon-api')) return false;
        try {
          const body = JSON.parse(response.request().postData() || '{}');
          const look = body.save?.looks?.[3];
          return body.op === 'save' && look?.skinColor === '#b47a58' && look.hairColor?.slice(1, 3) === '25';
        } catch { return false; }
      }, { timeout: 30_000 }).then((response) => ({ response }), (error) => ({ error }));
      await page.getByRole('tab', { name: '머리', exact: true }).click();
      await page.getByRole('group', { name: '나만의 머리 색', exact: true }).getByLabel('R', { exact: true }).fill('37');
      await page.getByRole('tab', { name: '피부', exact: true }).click();
      await page.getByRole('group', { name: '피부 색', exact: true }).getByLabel('HEX', { exact: true }).fill('#b47a58');
      await page.keyboard.press('Tab');
      const colorResult = await savedColors;
      if (colorResult.error) throw colorResult.error;
      const colorResponse = colorResult.response;
      assert.ok(colorResponse.ok(), 'synthetic custom colors are accepted by the profile save API');
      const accepted = await colorResponse.json();
      assert.equal(accepted.save.looks[3].skinColor, '#b47a58');
      assert.equal(parseInt(accepted.save.looks[3].hairColor.slice(1, 3), 16), 37);
      await shot('salon-custom-colors', true);
      await click('[data-testid=wardrobe-exit]');
      await wait(() => {
        const d = document.querySelector('[data-testid=interior-3d]')?.dataset;
        return d?.area === 'salon' && d.loadState === 'ready' && d.action === 'salon';
      }, null, 60_000);
      await focus(); await page.keyboard.press('KeyE');
      await page.getByTestId('wardrobe-preview').waitFor();
      await page.getByRole('tab', { name: '머리', exact: true }).click();
      assert.equal(await page.getByRole('group', { name: '나만의 머리 색', exact: true }).getByLabel('R', { exact: true }).inputValue(), '37');
      await page.getByRole('tab', { name: '피부', exact: true }).click();
      assert.equal((await page.getByRole('group', { name: '피부 색', exact: true }).getByLabel('HEX', { exact: true }).inputValue()).toLowerCase(), '#b47a58');
      await click('[data-testid=wardrobe-exit]');
      await wait(() => document.querySelector('[data-testid=interior-3d]')?.dataset.area === 'salon', null, 60_000);
      await village();
    });
    await step('bank-deposit-withdraw-consent', async () => {
      await walkBuilding('bank'); await shot('bank-door'); await pressAction();
      await wait(() => {
        const d = document.querySelector('[data-testid=interior-3d]')?.dataset;
        return d?.area === 'bank' && d.loadState === 'ready' && d.bankerState === 'loaded' && Number(d.bankModels) === 7;
      }, null, 180_000);
      assert.equal(await page.locator('dialog[open].l-finance').count(), 0, 'entering the bank leaves the player on its walkable floor');
      await shot('bank-interior');
      await click('[data-testid=interior-banker-route]');
      await runTo(() => wait(() => {
        const d = document.querySelector('[data-testid=interior-3d]')?.dataset;
        return d?.action === 'banker' && d.walking === 'false' && d.nearBanker === 'true';
      }, null, 120_000));
      assert.equal(await page.locator('dialog[open].l-finance').count(), 0, 'approaching Nyamo does not transfer money or open a form');
      await page.keyboard.press('KeyE');
      await page.locator('dialog[open].l-finance').waitFor();
      await wait(() => {
        const img = document.querySelector('[data-testid=bank-clerk] img');
        return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
      });
      const key = 'wallet-' + H.uid, before = H.world().ledger.accounts[key];
      await page.getByLabel('맡기거나 찾을 금액').fill('1000');
      await page.getByRole('button', { name: '맡기기', exact: true }).click();
      await waitMock(() => H.world().ledger.vault?.[key] === 1000, 'deposit appears in canonical mock ledger');
      assert.equal(H.world().ledger.vault[key], 1000); assert.equal(H.world().ledger.accounts[key], before - 1000);
      await page.getByRole('button', { name: '찾기', exact: true }).click();
      await waitMock(() => H.world().ledger.vault?.[key] === 0, 'withdraw returns stored balance');
      assert.equal(H.world().ledger.vault[key], 0); assert.equal(H.world().ledger.accounts[key], before);
      // Another synthetic friend offers; only the user's real Accept click transfers money.
      await H.run(H.bots[0], 'action', { action: { kind: 'finance', op: 'offer', to: 3, amount: 1000, interest: 0, days: 3 } });
      await page.getByRole('tab', { name: '차용증', exact: true }).click();
      await page.getByRole('button', { name: '조건 확인 · 수락', exact: true }).waitFor({ timeout: 20_000 });
      assert.equal(H.world().ledger.accounts[key], before);
      await shot('loan-consent');
      await page.getByRole('button', { name: '조건 확인 · 수락', exact: true }).click();
      await page.getByRole('button', { name: '전액 갚기', exact: true }).waitFor();
      assert.equal(H.world().ledger.accounts[key], before + 1000);
      await page.getByRole('button', { name: '전액 갚기', exact: true }).click();
      await wait(() => document.querySelector('.l-finance-note')?.textContent.includes('모두 갚았어요'));
      assert.equal(H.world().ledger.accounts[key], before);
      await shot('bank'); await closeDialogs();
      await village();
      const inside = await H.run(H.bots[1], 'action', { action: { kind: 'area', area: 'bank' } });
      assert.ok(!inside.error, 'another synthetic friend can enter the bank');
      if (!(await page.locator('#hv-minimap-body').count())) await click('[data-testid=minimap-toggle]');
      await wait(() => document.querySelector('[data-minimap-friend="6"]')?.getAttribute('data-indoor') === 'true');
      assert.match(await page.locator('[data-minimap-friend="6"]').getAttribute('aria-label'), /은행 안/);
      await shot('bank-friend-minimap');
    });
    await step('fruit-forage-chop', async () => {
      await directory('orchard');
      await wait(() => document.querySelector('[data-testid=village-3d]')?.dataset.spot === 'tree');
      const pickedBefore = JSON.stringify(H.world().life.fruitPickedAt[H.uid] ?? {});
      await guardedAction('pick', () => JSON.stringify(H.world().life.fruitPickedAt[H.uid] ?? {}) !== pickedBefore, 'fruit action changes canonical harvest state');
      await shot('fruit-picked');
      const spawn = model().me.spawns.find((s) => s.kind === 'forage' && !s.taken && SPAWN_POINTS[s.spot]);
      assert.ok(spawn, 'fixture has collectible forage');
      await walkPoint(SPAWN_POINTS[spawn.spot]);
      await wait(() => document.querySelector('[data-testid=action-button].hv-action')?.getAttribute('data-action') === 'forage');
      await guardedAction('forage', () => model().me.spawns.find((s) => s.spot === spawn.spot && s.kind === 'forage')?.taken, 'forage is taken after action');
      await shot('forage-picked');
      const node = model().growth.nodes.find((n) => !n.taken && n.kind === 'bush');
      assert.ok(node, 'fixture has a base-axe bush');
      await walkPoint(node);
      await wait(() => document.querySelector('[data-testid=action-button].hv-action')?.getAttribute('data-action') === 'chop');
      await guardedAction('chop', () => model().growth.nodes.find((n) => n.id === node.id)?.taken, 'node is taken after chop');
      await shot('wood-chopped');
      res.lifeActionRequests = commands.filter((c) => ['chop', 'pick', 'forage'].includes(c.action?.kind)).map((c) => c.action.kind);
    });
    await step('fishing-lock-cancel-resume', async () => {
      await directory('fish-river');
      await wait(() => document.querySelector('[data-testid=village-3d]')?.dataset.fishSpot === 'river');
      await pressAction(); await page.getByTestId('fishing').waitFor();
      await wait(() => document.querySelector('[data-testid=fishing]')?.getAttribute('data-phase') === 'wait');
      const before = await position();
      await focus(); await page.keyboard.down('ArrowRight'); await sleep(450);
      await page.keyboard.up('ArrowRight');
      assert.ok(Math.hypot((await position()).x - before.x, (await position()).z - before.z) < .02, 'keys cannot move a fishing player');
      // A real minimap request also cannot queue movement while fishing.
      if (!(await page.locator('#hv-minimap-body').count())) await click('[data-testid=minimap-toggle]');
      await click('[data-minimap-place=bank]'); await sleep(350);
      assert.ok(Math.hypot((await position()).x - before.x, (await position()).z - before.z) < .02);
      // A slow screenshot can outlast the bite; recast before the cancellation check.
      if (await page.getByTestId('fish-again').count()) {
        await click('[data-testid=fish-again]');
        await wait(() => document.querySelector('[data-testid=fishing]')?.getAttribute('data-phase') === 'wait');
      }
      await page.keyboard.press('Escape');
      await wait(() => !document.querySelector('[data-testid=fishing]'));
      assert.equal(model().me.fishing.pending, null, 'cancel clears the mock server cast');
      assert.ok(commands.some((c) => c.action?.kind === 'cancelCast'), 'cancel came from browser UI');
      await sleep(450);
      assert.ok(Math.hypot((await position()).x - before.x, (await position()).z - before.z) < .02, 'no queued/held movement survives cancel');
      await focus(); await page.keyboard.down('ArrowUp'); await sleep(600); await page.keyboard.up('ArrowUp'); await sleep(350);
      const after = await position();
      assert.ok(Math.hypot(after.x - before.x, after.z - before.z) > .15, 'walking resumes after cancel');
      await shot('fishing-resumed');
    });
  } catch (error) {
    if (!res.steps.some((s) => !s.pass)) report.failures.push(`${name}: setup/cleanup: ${error.message}`);
  } finally {
    if (H) {
      res.errors = [...H.errors]; res.external = [...H.external];
      if (res.errors.length || res.console.length || res.requests.length)
        report.failures.push(`${name}: browser errors=${res.errors.length}, console=${res.console.length}, HTTP=${res.requests.length}`);
      await H.close();
    }
  }
}

try {
  server = await serve(pages);
  browser = await launchBrowser();
  watchdog = setTimeout(stop, Number(opt('max-ms', 12 * 60_000)));
  watchdog.unref();
  if (only.has('desktop')) await runView(false);
  if (!interrupted && only.has('mobile')) await runView(true);
} finally {
  clearTimeout(watchdog);
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);
  await browser?.close().catch(() => {});
  server?.close();
  Date.now = realNow;
  report.status = interrupted ? 'interrupted' : report.failures.length ? 'failed' : 'passed';
  persistReport();
}
console.log('Report:', path.join(out, 'report.json'));
if (report.failures.length) { console.error(report.failures.join('\n')); process.exitCode = 1; }
