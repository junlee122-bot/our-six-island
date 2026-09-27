// Actual tavern game on an isolated mock cloud, never a DOM/card re-creation.
// node --experimental-strip-types scripts/verify-tavern-cards-ui.mjs --pages <scratch-build>
// The only fixtures are server-side: a legal deck permutation and long visual
// capture deadlines. The browser walks, sits, selects and plays with real input.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { launchBrowser, login, serve, setup, VIEWS } from './ui-harness.mjs';
import { measureInPage } from './ui-measure.mjs';
import { UI_METRICS } from './ui-report.mjs';
import { LB_DECK, liarsBarKey } from '../app/lounge-liarsbar.ts';
import { validateLedger } from '../app/lounge-economy.ts';

const args = process.argv.slice(2);
const opt = (key, fallback) => { const i = args.indexOf('--' + key); return i < 0 ? fallback : args[i + 1]; };
const pages = opt('pages', '');
assert.ok(pages && fs.existsSync(path.join(pages, 'index.html')), '--pages must name an existing scratch Pages build');
const out = path.resolve(opt('out', '.ui-shots/tavern-cards'));
fs.mkdirSync(out, { recursive: true });
const report = { createdAt: new Date().toISOString(), build: path.resolve(pages), status: 'running', steps: [], screens: {}, fixtures: [], failures: [], console: [], requests: [] };
const persist = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
persist();
let browser, server, H, clockFixture, watchdog, interrupted = false;
const stop = () => {
  if (interrupted) return;
  interrupted = true;
  report.failures.push('Verification interrupted; incomplete checks are not passes.');
  report.status = 'interrupted'; persist();
  void browser?.close().catch(() => {});
};
process.once('SIGINT', stop); process.once('SIGTERM', stop);

try {
  server = await serve(pages);
  browser = await launchBrowser();
  watchdog = setTimeout(stop, Number(opt('max-ms', 15 * 60_000))); watchdog.unref();
  H = await setup({ browser, base: server.url, view: 's' });
  const { page, ctx, js, sleep } = H;
  await ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, quality: 'low', fpsCap: 30 })));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('console', (m) => { if (m.type() === 'error') report.console.push(m.text().slice(0, 500)); });
  page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(server.url)) report.requests.push({ status: r.status(), url: r.url().replace(server.url, '/') }); });
  const wait = async (fn, arg, ms = 30_000) => assert.notEqual(await H.until(fn, ms, arg), -1, 'UI wait timed out: ' + fn.toString().slice(0, 180));
  const state = () => Object.values(H.world().rooms).find((room) => room.leases[H.uid])?.snapshot;
  const match = () => state()?.liarsbar;
  const focusScene = () => page.locator('[data-testid=interior-3d], [data-testid=village-3d], [data-testid=bedroom-3d]').first().focus();
  const closeDialogs = async () => {
    for (let i = 0; i < 5 && await page.locator('dialog[open]').count(); i++) { await page.keyboard.press('Escape'); await sleep(250); }
  };
  const click = async (selector) => {
    const target = page.locator(selector).first();
    await target.waitFor({ state: 'visible', timeout: 30_000 });
    await target.click();
  };
  const holdClock = () => {
    const snapshot = state(), game = snapshot?.liarsbar;
    if (!game || game.phase === 'over') return;
    (snapshot.deadlines ??= {}).liarsbar = { key: liarsBarKey(game), at: Date.now() + 10 * 60_000 };
  };
  const action = async (player, value) => {
    const response = await H.run(player, 'action', { action: value });
    assert.ok(response.ok !== false && !response.error, JSON.stringify(response.error));
    validateLedger(H.world().ledger);
    return response;
  };
  const shot = async (name, strict = true) => {
    await js(() => document.fonts.ready); await sleep(450);
    const file = name + '.png';
    await page.screenshot({ path: path.join(out, file), timeout: 90_000 });
    const metrics = await js(measureInPage);
    report.screens[name] = { file, ...metrics }; persist();
    if (strict) for (const metric of UI_METRICS) assert.equal(metrics[metric], 0, name + ': ' + metric);
  };
  const both = async (suffix) => {
    for (const view of ['s', 'fhd']) {
      await page.setViewportSize(VIEWS[view]); await sleep(500);
      await shot(view + '-' + suffix);
      const clipped = await js(() => [...document.querySelectorAll('.lb-hand-card, .lb-actions button')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.top < 0 || r.left < 0 || r.bottom > innerHeight || r.right > innerWidth);
      }).map((el) => el.getAttribute('data-testid') || el.textContent.trim()));
      assert.deepEqual(clipped, [], view + ': hand and play controls fit the first screen');
    }
    await page.setViewportSize(VIEWS.s); await sleep(300);
  };
  const step = async (label, fn) => {
    const start = Date.now(); report.phase = label; persist(); console.log('START', label);
    try { await fn(); report.steps.push({ label, pass: true, ms: Date.now() - start }); console.log('PASS', label); }
    catch (error) {
      report.steps.push({ label, pass: false, error: error.message, ms: Date.now() - start });
      report.failures.push(label + ': ' + error.message);
      await shot(label + '-failed', false).catch(() => {});
      throw error;
    } finally { persist(); }
  };

  await step('walk-to-tavern-and-join-real-table', async () => {
    await login(H, server.url);
    await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.loadState === 'ready', null, 180_000);
    await closeDialogs(); await focusScene(); await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /마을로 나가기/ }).click();
    await wait(() => document.querySelector('[data-testid=village-3d]')?.dataset.loadState === 'ready', null, 180_000);
    if (!(await page.locator('#hv-minimap-body').count())) await click('[data-testid=minimap-toggle]');
    await click('[data-minimap-place=tavern]'); await focusScene(); await page.keyboard.down('Shift');
    try {
      await wait(() => { const d = document.querySelector('[data-testid=village-3d]')?.dataset; return d?.walking === 'false' && d.nearbyPlace === 'tavern'; }, null, 180_000);
    } finally { await page.keyboard.up('Shift'); }
    await page.keyboard.press('KeyE');
    await wait(() => document.querySelector('[data-testid=interior-3d]')?.dataset.loadState === 'ready', null, 180_000);
    const host = H.bots[0];
    await action(host, { kind: 'area', area: 'tavern' });
    await action(host, { kind: 'invite', game: 'liarsbar', players: [], required: 2, party: true, table: 'tavern-liarsbar' });
    await click('[data-testid=interior-table-liarsbar]'); await focusScene();
    await wait(() => { const d = document.querySelector('[data-testid=interior-3d]')?.dataset; return (d?.action === 'table:liarsbar' && d.walking === 'false') || !!document.querySelector('[data-testid=table-sheet]'); }, null, 90_000);
    if (!(await page.getByTestId('table-sheet').count())) await page.keyboard.press('KeyE');
    await click('[data-testid=table-sit]');
    await page.getByTestId('liarsbar-table').waitFor({ timeout: 30_000 });
    assert.equal(match()?.n, 2);
    validateLedger(H.world().ledger);
  });

  await step('all-fronts-and-backs-load-in-a-legal-hand', async () => {
    const snapshot = state(), game = match(), seat = snapshot.seats.liarsbar.indexOf(H.uid);
    assert.ok(seat >= 0 && game.phase === 'play');
    const cards = game.hands[seat];
    // Permute actual card faces, keeping the deck's six K/Q/A and two jokers.
    // Every hand remains private in liarsBarView; no hidden cards reach the page.
    const desired = ['K', 'Q', 'A', 'J', 'K'];
    for (let i = 0; i < desired.length; i++) {
      const locked = new Set(cards.slice(0, i));
      const donor = game.cards.findIndex((face, id) => face === desired[i] && !locked.has(id));
      assert.ok(donor >= 0);
      [game.cards[cards[i]], game.cards[donor]] = [game.cards[donor], game.cards[cards[i]]];
    }
    game.table = 'K'; game.turn = seat; game.revision++;
    assert.deepEqual([...game.cards].sort((a, b) => a.localeCompare(b)), [...LB_DECK].sort((a, b) => a.localeCompare(b)));
    holdClock(); clockFixture = setInterval(holdClock, 250);
    report.fixtures.push('Server-only legal deck permutation K/Q/A/J/K for my hand, today K; no card count or rule changes.');
    report.fixtures.push('Server-only visual deadlines extended while capturing; browser clocks and application state are untouched.');
    await wait(() => [...document.querySelectorAll('.lb-hand .lb-card')].map((e) => e.getAttribute('data-face')).join('') === 'KQAJK');
    await wait(() => [...document.querySelectorAll('.lb-card-art')].length > 5 && [...document.querySelectorAll('.lb-card-art')].every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0));
    const art = await js(() => [...new Set([...document.querySelectorAll('.lb-card-art')].map((image) => new URL(image.src).pathname))]);
    for (const face of ['king', 'queen', 'ace', 'joker', 'back']) assert.ok(art.some((src) => new RegExp('tavern-' + face + '(?:-[a-f0-9]+)?\\.webp$').test(src)), face + ' image is loaded');
    assert.equal(await page.locator('.lb-hand .lb-card.is-match').count(), 3, 'K/K/J match today K');
    assert.equal(await page.locator('.lb-hand .lb-good').count(), 3);
    assert.equal(await page.locator('.lb-backs .lb-card.is-back').count(), 5, 'the other player has five private card backs');
    report.art = art;
    await both('tavern-hand');
  });

  await step('keyboard-selection-is-visible-and-reversible', async () => {
    await wait(() => document.querySelector('[data-testid=liarsbar-card-0]')?.matches(':enabled'));
    await page.getByTestId('liarsbar-card-0').focus(); await page.keyboard.press('Digit1');
    await wait(() => document.querySelector('[data-testid=liarsbar-card-0]')?.getAttribute('aria-pressed') === 'true');
    assert.equal(await page.locator('.lb-picked-mark').count(), 1);
    await both('tavern-selected');
    await page.keyboard.press('Escape');
    await wait(() => !document.querySelector('.lb-hand-card.is-picked'));
    assert.equal(await page.locator('dialog[open]').count(), 0, 'Escape clears selection before opening a menu');
  });

  await step('real-play-and-call-reveal-true-and-lie-art', async () => {
    await page.keyboard.press('Digit1'); await page.keyboard.press('Digit2');
    await wait(() => document.querySelectorAll('.lb-hand-card.is-picked').length === 2);
    // Enter belongs to a focused card button; submit through the real play
    // button rather than injecting focus or calling a component handler.
    await click('[data-testid=liarsbar-play]');
    const start = Date.now();
    while (!match()?.plays.length && Date.now() - start < 30_000) await sleep(150);
    assert.equal(match().plays.length, 1);
    assert.deepEqual(match().plays[0].ids.map((id) => match().cards[id]), ['K', 'Q']);
    holdClock();
    await action(H.bots[0], { kind: 'liarsbar', id: match().id, revision: match().revision, action: { kind: 'call' } });
    holdClock();
    assert.equal(match().phase, 'reveal'); assert.equal(match().reveal.lie, true);
    await wait(() => !!document.querySelector('.lb-reveal .lb-card.is-true') && !!document.querySelector('.lb-reveal .lb-card.is-lie'));
    assert.equal(await page.locator('.lb-reveal .is-true .lb-stamp').innerText(), '진짜');
    assert.equal(await page.locator('.lb-reveal .is-lie .lb-stamp').innerText(), '뻥');
    await both('tavern-reveal');
    validateLedger(H.world().ledger);
    assert.equal(Object.keys(report.screens).length, 6, 'all six required real-game views captured');
  });
} catch (error) {
  if (!report.failures.length) report.failures.push(error.message);
  console.error(error.stack ?? error);
} finally {
  clearInterval(clockFixture); clearTimeout(watchdog);
  process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
  if (H) {
    report.errors = [...H.errors]; report.external = [...H.external];
    if (report.errors.length || report.console.length || report.requests.length || report.external.length)
      report.failures.push(`browser errors=${report.errors.length}, console=${report.console.length}, HTTP=${report.requests.length}, unexpected external=${report.external.length}`);
    await H.close();
  }
  await browser?.close().catch(() => {}); server?.close();
  report.status = interrupted ? 'interrupted' : report.failures.length ? 'failed' : 'passed'; persist();
}
console.log('Report:', path.join(out, 'report.json'));
if (report.failures.length) { console.error(report.failures.join('\n')); process.exitCode = 1; }
