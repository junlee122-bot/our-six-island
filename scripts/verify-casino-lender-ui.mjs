// Isolated, real-input checks for Rosé's casino desk. No production accounts or API.
// node --experimental-strip-types scripts/verify-casino-lender-ui.mjs --pages <build>
// The player walks normally. Only another synthetic actor and an overdue timestamp
// are server fixtures; no browser position, application state or balances are injected.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { launchBrowser, login, serve, setup, VIEWS } from './ui-harness.mjs';
import { measureInPage } from './ui-measure.mjs';
import { UI_METRICS } from './ui-report.mjs';
import { validateLedger } from '../app/lounge-economy.ts';
import { CASINO_LENDER_FRONT, nearCasinoLender } from '../app/lounge-casino-lender.ts';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf('--' + name); return i < 0 ? fallback : args[i + 1]; };
const pages = opt('pages', '');
assert.ok(pages && fs.existsSync(path.join(pages, 'index.html')), '--pages must name an existing scratch Pages build');
const out = path.resolve(opt('out', '.ui-shots/casino-lender'));
fs.mkdirSync(out, { recursive: true });
const report = { createdAt: new Date().toISOString(), build: path.resolve(pages), status: 'running', steps: [], screens: {}, errors: [], console: [], requests: [], fixtures: [], failures: [] };
const persist = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
persist();
let browser, server, H, watchdog, interrupted = false;
const stop = () => {
  if (interrupted) return;
  interrupted = true;
  report.failures.push('Verification interrupted; unfinished checks are not passes.');
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
  const commands = [];
  page.on('request', (r) => {
    if (!r.url().includes('/functions/v1/hohyeon-api')) return;
    try { const c = JSON.parse(r.postData() || '{}').command; if (c) commands.push(c); } catch {}
  });
  const wait = async (fn, arg, timeout = 30_000) => assert.notEqual(await H.until(fn, timeout, arg), -1, 'UI wait timed out: ' + fn.toString().slice(0, 160));
  const canonical = async (fn, label, timeout = 30_000) => {
    const start = Date.now();
    while (!fn() && Date.now() - start < timeout) await sleep(150);
    assert.ok(fn(), label); validateLedger(H.world().ledger);
  };
  const click = async (selector) => {
    // Visibility alone does not mean the scene accepts input: the entrance
    // fade can still intercept the pointer after its models are ready. Keep
    // real pointer input, waiting for enabled/stable/unobstructed actionability
    // rather than failing on one animation frame (or forcing the click).
    await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
    await page.locator(selector).first().click({ timeout: 30_000 });
  };
  const sceneFocus = () => page.locator('[data-testid=interior-3d], [data-testid=village-3d], [data-testid=bedroom-3d]').first().focus();
  const closeDialogs = async () => {
    for (let i = 0; i < 5 && await page.locator('dialog[open]').count(); i++) { await page.keyboard.press('Escape'); await sleep(250); }
  };
  const shot = async (name, strict = true) => {
    await js(() => document.fonts.ready); await sleep(350);
    const file = name + '.png';
    await page.screenshot({ path: path.join(out, file), timeout: 90_000 });
    const metrics = await js(measureInPage);
    report.screens[name] = { file, ...metrics }; persist();
    if (strict) {
      for (const metric of UI_METRICS) assert.equal(metrics[metric], 0, `${name}: ${metric}`);
      if (metrics.dialog?.close) assert.ok(metrics.dialog.close.w >= 44 && metrics.dialog.close.h >= 44, name + ': close target >=44');
    }
  };
  const bothScreens = async (state) => {
    for (const view of ['s', 'fhd']) {
      await page.setViewportSize(VIEWS[view]); await sleep(600);
      await shot(view + '-lender-' + state);
    }
    await page.setViewportSize(VIEWS.s); await sleep(500);
  };
  const step = async (label, fn) => {
    const start = Date.now();
    report.phase = label; persist(); console.log('START', label);
    try { await fn(); report.steps.push({ label, pass: true, ms: Date.now() - start }); console.log('PASS', label); }
    catch (error) {
      report.steps.push({ label, pass: false, error: error.message, ms: Date.now() - start });
      report.failures.push(label + ': ' + error.message);
      await shot(label + '-failed', false).catch(() => {});
      throw error;
    } finally { persist(); }
  };
  const wallet = 'wallet-' + H.uid;
  const myLoan = () => H.world().finance?.loans.find((l) => l.borrower === H.uid && l.lender === 'house' && l.state === 'active');
  const action = (p, a) => H.run(p, 'action', { action: a });
  const assertAction = async (p, a) => {
    const r = await action(p, a); assert.ok(!r.error, JSON.stringify(r.error)); validateLedger(H.world().ledger); return r;
  };
  const rejected = async (p, a) => {
    const ledger = structuredClone(H.world().ledger), finance = structuredClone(H.world().finance);
    const r = await action(p, a);
    assert.match(r.error?.message ?? r.error ?? '', /로제|거래|앞으로/);
    assert.deepEqual(H.world().ledger, ledger, 'rejected remote action cannot change wallet, bank or house');
    assert.deepEqual(H.world().finance, finance, 'rejected remote action cannot change notes');
  };
  const enterCasino = async () => {
    await closeDialogs();
    if (await js(() => document.querySelector('main.l-app')?.dataset.space === 'casino')) return;
    if (!(await js(() => document.querySelector('main.l-app')?.dataset.space === 'village'))) {
      await sceneFocus(); await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /마을로 나가기/ }).click();
    }
    await wait(() => document.querySelector('[data-testid=village-3d]')?.dataset.loadState === 'ready', null, 180_000);
    if (!(await page.locator('#hv-minimap-body').count())) await click('[data-testid=minimap-toggle]');
    await click('[data-minimap-place=casino]'); await sceneFocus();
    await page.keyboard.down('Shift');
    try {
      await wait(() => { const d = document.querySelector('[data-testid=village-3d]')?.dataset; return d?.walking === 'false' && d.nearbyPlace === 'casino'; }, null, 180_000);
    } finally { await page.keyboard.up('Shift'); }
    await page.keyboard.press('KeyE');
    await wait(() => document.querySelector('[data-testid=interior-3d]')?.dataset.loadState === 'ready', null, 180_000);
    await wait(() => document.querySelector('[data-testid=interior-3d]')?.dataset.lenderState === 'loaded', null, 90_000);
    await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
  };
  const approachLender = async (selector = '[data-testid=interior-lender-route]') => {
    await click(selector); await sceneFocus(); await page.keyboard.down('Shift');
    try {
      await wait(() => { const d = document.querySelector('[data-testid=interior-3d]')?.dataset; return d?.action === 'lender' && d.walking === 'false' && d.nearLender === 'true'; }, null, 120_000);
    } finally { await page.keyboard.up('Shift'); }
    const position = await js(() => { const d = document.querySelector('[data-testid=interior-3d]').dataset; return { x: Number(d.avatarX), y: Number(d.avatarY) }; });
    assert.ok(nearCasinoLender(position, 'casino'), 'visible player really reached Rosé');
    assert.equal(await page.getByTestId('casino-lender-panel').count(), 0, 'walking alone does not sign or open a contract');
    await page.keyboard.press('KeyE');
    await page.getByTestId('casino-lender-panel').waitFor({ timeout: 30_000 });
    await wait(() => { const img = document.querySelector('.l-lender-portrait'); return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0; });
    assert.equal(await page.getByTestId('lender-location').count(), 0);
  };

  await step('remote-borrow-and-repayment-are-rejected', async () => {
    const bot = H.bots[0];
    await rejected(bot, { kind: 'finance', op: 'borrow', amount: 1000 });
    await assertAction(bot, { kind: 'area', area: 'casino' });
    await rejected(bot, { kind: 'finance', op: 'borrow', amount: 1000 });
    await assertAction(bot, { kind: 'move', ...CASINO_LENDER_FRONT });
    await assertAction(bot, { kind: 'finance', op: 'borrow', amount: 1000 });
    const note = H.world().finance.loans.find((l) => l.borrower === bot.id && l.lender === 'house' && l.state === 'active');
    assert.ok(note);
    await assertAction(bot, { kind: 'move', x: 50, y: 83 });
    await rejected(bot, { kind: 'finance', op: 'repay', id: note.id, amount: 1300 });
    await assertAction(bot, { kind: 'area', area: 'village' });
    await rejected(bot, { kind: 'finance', op: 'repay', id: note.id, amount: 1300 });
    await assertAction(bot, { kind: 'area', area: 'casino' });
    await assertAction(bot, { kind: 'move', ...CASINO_LENDER_FRONT });
    await assertAction(bot, { kind: 'finance', op: 'repay', id: note.id, amount: 1300 });
    await assertAction(bot, { kind: 'area', area: 'village' });
    report.fixtures.push('Synthetic friend probes exercise real cloud authorization; no production requests.');
  });
  await step('casino-entry-and-distinct-lumi', async () => {
    await login(H, server.url);
    await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.loadState === 'ready', null, 180_000);
    await enterCasino();
    assert.equal(await page.getByTestId('casino-lender-panel').count(), 0);
    // Opening an ordinary modal must stop an in-progress click-to-walk route,
    // just as sitting at a table does. Test this through actual pointer input.
    await click('[data-testid=interior-lender-route]');
    await wait(() => document.querySelector('[data-testid=interior-3d]')?.dataset.walking === 'true');
    await click('[data-testid=casino-lumi-ledger]');
    await page.locator('dialog[open].l-finance').waitFor();
    await wait(() => document.querySelector('[data-testid=interior-3d]')?.dataset.paused === 'true');
    const pausePosition = () => js(() => { const d = document.querySelector('[data-testid=interior-3d]').dataset; return { x: Number(d.avatarX), y: Number(d.avatarY) }; });
    await sleep(250);
    const stopped = await pausePosition();
    await page.keyboard.down('ArrowRight'); await sleep(450); await page.keyboard.up('ArrowRight');
    const underModal = await pausePosition();
    assert.ok(Math.hypot(underModal.x - stopped.x, underModal.y - stopped.y) <= .05, 'modal stops queued walking and ignores movement keys');
    assert.equal(await page.getByTestId('casino-lender-panel').count(), 0);
    assert.equal(await page.getByTestId('lender-borrow').count(), 0);
    assert.match(await page.locator('dialog[open]').innerText(), /루미/);
    await closeDialogs();
    await wait(() => document.querySelector('[data-testid=interior-3d]')?.dataset.paused === 'false');
    await sleep(450);
    const resumed = await pausePosition();
    assert.ok(Math.hypot(resumed.x - stopped.x, resumed.y - stopped.y) <= .05, 'closing the modal does not resume a stale walking route');
    await shot('casino-two-hosts');
  });
  let before, noteId;
  await step('walk-to-rose-and-borrow-with-consent', async () => {
    await approachLender(); await bothScreens('fresh');
    before = H.world().ledger.accounts[wallet];
    await page.getByTestId('lender-borrow-amount').fill('10000');
    assert.equal(H.world().ledger.accounts[wallet], before, 'editing an amount never transfers money');
    await click('[data-testid=lender-borrow]');
    await canonical(() => !!myLoan(), 'accepted contract is stored on the mock server');
    noteId = myLoan().id;
    assert.equal(myLoan().principal, 10000); assert.equal(myLoan().interest, 3000);
    assert.equal(H.world().ledger.accounts[wallet], before + 10000);
    await page.getByTestId('lender-active-note').waitFor(); await bothScreens('active');
  });
  await step('partial-payment-persists-after-reload', async () => {
    await page.getByTestId('lender-repay-amount').fill('1000');
    await click('[data-testid=lender-repay]');
    await canonical(() => myLoan()?.paid === 1000, 'partial repayment is canonical');
    assert.equal(H.world().ledger.accounts[wallet], before + 9000);
    await page.reload();
    await wait(() => !!document.querySelector('.l-world-header'), null, 90_000);
    await wait(() => { const s = document.querySelector('[data-testid=bedroom-3d], [data-testid=interior-3d], [data-testid=village-3d]')?.dataset.loadState; return s === 'ready'; }, null, 180_000);
    await enterCasino(); await approachLender('[data-testid=interior-lender-name]');
    assert.equal(myLoan().id, noteId); assert.equal(myLoan().paid, 1000);
    assert.match(await page.getByTestId('lender-active-note').innerText(), /12,000/);
    await closeDialogs();
    await click('[aria-label="마을 메뉴"]');
    await page.getByRole('button', { name: '은행 · 차용증', exact: true }).click();
    await page.getByRole('tab', { name: '차용증', exact: true }).click();
    assert.match(await page.locator('dialog[open]').innerText(), /로제/);
    assert.equal(await page.getByRole('button', { name: /전액 갚기|1,000범 갚기|입력한 금액 갚기/ }).count(), 0, 'bank lists a casino note but cannot repay it remotely');
    await closeDialogs(); await approachLender();
  });
  await step('overdue-contract-and-full-payment', async () => {
    // Only time fields of the existing synthetic server contract are aged. Its
    // balance, principal, interest, paid amount and player position stay intact.
    const note = myLoan(); note.offeredAt = Date.now() - 4 * 86_400_000; note.dueAt = note.offeredAt + 3 * 86_400_000;
    report.fixtures.push('Existing synthetic note dates aged four days to exercise overdue UI.');
    // An overdue casino note collects itself on the borrower's next request
    // (wallet first, then bank deposits). Depending on timing the panel either
    // shows the overdue note first (then the borrower pays it in full) or the
    // next request has already collected it; both end fully paid.
    await wait(() => document.querySelector('[data-testid=lender-active-note]')?.textContent.includes('기한이 지난') ||
      !!document.querySelector('[data-testid=lender-borrow]'), null, 30_000);
    if (myLoan()) {
      await bothScreens('overdue');
      await click('[data-testid=lender-repay-all]');
    }
    await canonical(() => !myLoan(), 'overdue note ends fully paid');
    const paid = H.world().finance.loans.find((l) => l.id === noteId);
    assert.equal(paid.state, 'paid'); assert.equal(paid.paid, 13000);
    assert.equal(H.world().ledger.accounts[wallet], before - 3000);
    await page.getByTestId('lender-borrow').waitFor();
    await page.getByTestId('lender-history').locator('summary').click();
    assert.match(await page.getByTestId('lender-history').innerText(), /완납/);
    await shot('lender-paid-history');
    const contracts = commands.filter((c) => c.action?.kind === 'finance' && c.action.op === 'borrow');
    assert.equal(contracts.length, 1, 'one explicit browser consent creates exactly one contract');
    await page.keyboard.press('Escape');
    assert.equal(await page.getByTestId('casino-lender-panel').count(), 0, 'Escape closes lender panel');
  });
} catch (error) {
  if (!report.failures.length) report.failures.push(error.message);
  console.error(error.stack ?? error);
} finally {
  clearTimeout(watchdog);
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
