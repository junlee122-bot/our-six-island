// Isolated browser verification: synthetic accounts, local Pages files and the
// actual cloud engine. ui-harness intercepts or blocks every external request.
// node --experimental-strip-types scripts/verify-community-orders-ui.mjs --pages <build> --out <evidence-dir>
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { farmToVillage, launchBrowser, login, serve, setup, VIEWS } from './ui-harness.mjs';
import { measureInPage } from './ui-measure.mjs';
import { readLife } from '../app/lounge-life.ts';
import { communityOrderWeek, communityOrderStartsAt } from '../app/lounge-community-orders.ts';
import { communityOrderCandidates, communityOrderItemKind } from '../app/lounge-community-orders-data.ts';
import { BOARD_FRONT } from '../app/lounge-village-spots.ts';

const args = process.argv.slice(2);
const opt = (key, fallback) => { const i = args.indexOf('--' + key); return i < 0 ? fallback : args[i + 1]; };
const pages = path.resolve(opt('pages', ''));
assert.ok(args.includes('--pages') && fs.existsSync(path.join(pages, 'index.html')), 'Pass --pages with a completed Pages build. This script never builds or deploys.');
const out = path.resolve(opt('out', '.ui-shots/community-orders'));
const actors = opt('actors', '3,7').split(',').map(Number), views = opt('views', 's,fhd').split(',');
assert.ok(actors.every((a) => [3, 7].includes(a)) && views.every((v) => VIEWS[v]));
if (!process.env.CHROMIUM_PATH && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) process.env.CHROMIUM_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(out, { recursive: true });
const realNow = Date.now, started = performance.now();
const fixtureStart = communityOrderStartsAt(communityOrderWeek(realNow())) + 2 * 86_400_000 + 12 * 3_600_000;
Date.now = () => Math.floor(fixtureStart + performance.now() - started);
const week = communityOrderWeek(Date.now());
function seedLife(life, uid, actor) {
  for (const id of Object.keys(life.actors)) {
    const ext = ((life.ext ??= {})[id] ??= {});
    for (const crop of ['carrot', 'tomato', 'pumpkin', 'strawberry']) life.bag[id].produce[crop] = 80;
    ext.inv = { ...ext.inv, crucian: 20, goldfish: 20 };
    ext.q1 = {}; ext.q2 = {}; ext.q3 = {};
    (life.farmx ??= {})[id] = { goods: { 'jar-carrot': 10, 'jar-tomato': 10, 'jar-pumpkin': 10, 'jar-strawberry': 10 }, ...(actor === 7 && id === uid ? { mach: { 0: { k: 'jar' } } } : {}) };
  }
  life.farm = { store: { carrot: 40, tomato: 40, pumpkin: 40, strawberry: 40 }, d: 0, gm: Date.now() };
  const previous = communityOrderCandidates(week - 1)[0], expired = communityOrderCandidates(week - 2)[0];
  const previousAt = communityOrderStartsAt(week - 1) + 86_400_000, expiredAt = communityOrderStartsAt(week - 2) + 86_400_000;
  life.communityOrders = { records: [
    { week: week - 1, order: previous.id, chosenBy: actor, chosenAt: previousAt, assigned: previous.needs.map(() => null), by: { [actor]: { n: previous.needs.map((n) => n.n), s: previous.needs.map(() => 0) } }, claimed: [], completedAt: previousAt + 3_600_000, log: previous.needs.map((n, line) => ({ actor, line, n: n.n, source: 'personal', at: previousAt + 3_600_000 })) },
    { week: week - 2, order: expired.id, chosenBy: actor, chosenAt: expiredAt, assigned: expired.needs.map(() => null), by: { [actor]: { n: expired.needs.map((_, i) => i === 0 ? 1 : 0), s: expired.needs.map(() => 0) } }, claimed: [], log: [{ actor, line: 0, n: 1, source: 'personal', at: expiredAt }] },
  ] };
}
const report = { status: 'running', mockOnly: true, pages, startedAt: new Date(realNow()).toISOString(), fixtureAt: new Date(fixtureStart).toISOString(), runs: [] };
const persist = () => fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
persist();
let browser, server;
async function run(actor, view) {
  const row = { actor, view, viewport: VIEWS[view], status: 'running', steps: [], screenshots: [], consoleErrors: [], failedResources: [], apiFailures: [], commands: [] };
  report.runs.push(row); persist();
  const H = await setup({ browser, base: server.url, actor, view, seedLife: (life, uid) => seedLife(life, uid, actor) });
  const { page, ctx } = H;
  const pendingReads = [], state = () => readLife(H.world().life);
  const record = (w = week) => state().communityOrders?.records.find((r) => r.week === w);
  const delivered = (line) => Object.values(record()?.by ?? {}).reduce((sum, c) => sum + c.n[line], 0);
  const ownedReward = (ref) => state().ext?.[H.uid]?.furn?.[ref] ?? 0;
  const wait = async (fn, arg, ms = 30_000) => assert.notEqual(await H.until(fn, ms, arg), -1, `UI wait: ${fn.toString().slice(0, 160)}`);
  const waitState = async (fn, label) => { const end = performance.now() + 20_000; while (!fn() && performance.now() < end) await H.sleep(100); assert.ok(fn(), label); };
  await ctx.addInitScript((clock) => { localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, quality: 'low', fpsCap: 30, dayNight: false })); const start = performance.now(); Date.now = () => Math.floor(clock + performance.now() - start); }, Date.now());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('console', (m) => { if (m.type() === 'error') row.consoleErrors.push(m.text().slice(0, 600)); });
  page.on('requestfailed', (r) => { if (r.url().startsWith(server.url) && r.failure()?.errorText !== 'net::ERR_ABORTED') row.failedResources.push({ url: r.url().replace(server.url, '/'), error: r.failure()?.errorText }); });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(server.url)) row.failedResources.push({ url: r.url().replace(server.url, '/'), status: r.status() });
    if (r.status() >= 400 && r.url().includes('/functions/v1/')) { const item = { status: r.status(), path: new URL(r.url()).pathname }; row.apiFailures.push(item); pendingReads.push(r.json().then((b) => { item.error = b.error; }).catch(() => {})); }
  });
  page.on('request', (r) => { if (!r.url().includes('/functions/v1/hohyeon-api')) return; try { const a = JSON.parse(r.postData() || '{}').command?.action; if (a?.kind === 'communityOrder') row.commands.push(a); } catch {} });
  const shot = async (label) => {
    await page.evaluate(() => document.fonts.ready);
    const file = `${view}-actor${actor}-${label}.png`; await page.screenshot({ path: path.join(out, file), timeout: 90_000 });
    const metrics = await page.evaluate(measureInPage); row.screenshots.push({ label, file, metrics }); persist();
    assert.equal(metrics.coveredCount, 0, `${label}: no covered controls ${JSON.stringify(metrics.covered)}`);
    assert.equal(metrics.lowCount, 0, `${label}: text contrast ${JSON.stringify(metrics.low)}`);
    assert.equal(metrics.smallCount, 0, `${label}: readable text ${JSON.stringify(metrics.small)}`);
    assert.equal(metrics.cutCount, 0, `${label}: no clipped text ${JSON.stringify(metrics.cut)}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'no page horizontal overflow');
  };
  const step = async (label, work) => { console.log(`${view} actor ${actor}: ${label}`); const at = performance.now(); try { await work(); row.steps.push({ label, pass: true, ms: Math.round(performance.now() - at) }); } catch (e) { row.steps.push({ label, pass: false, error: e.message }); throw e; } finally { persist(); } };
  const closeDialogs = async () => { for (let i = 0; i < 6 && await page.locator('dialog[open]').count(); i++) { await page.keyboard.press('Escape'); await H.sleep(150); } };
  const openOrders = async () => { await closeDialogs(); await page.locator('.l-world-menu-button').click(); await page.getByTestId('menu-communityOrders').click(); await page.getByTestId('community-orders').waitFor(); };
  const tabs = () => page.getByRole('tablist', { name: '공동 주문서 쪽' });
  const confirmDialog = () => page.locator('dialog[open]').last();
  const candidate = communityOrderCandidates(week).find((d) => d.difficulty === (actor === 7 ? 'hard' : 'easy'));
  const personalLine = candidate.needs.findIndex((n) => n.n > 1);
  const sharedLine = candidate.needs.findIndex((n) => communityOrderItemKind(n.item) === 'crop');
  const otherLine = candidate.needs.findIndex((_, i) => i !== personalLine);
  const other = H.bots[0];
  try {
    await step('three-weekly-candidates-and-choice', async () => {
      await login(H, server.url); await wait(() => !!document.querySelector('.l-world-header'), null, 90_000);
      await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.loadState === 'ready', null, 180_000);
      await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
      await openOrders();
      row.entryPoints = { menu: true, returnBoard: false, villageBoard: false };
      if (actor === 3) {
        await closeDialogs(); await page.getByTestId('village-return').click();
        await wait(() => { const d = document.querySelector('[data-testid=area-3d]')?.dataset; return d?.area === 'farm' && d.loadState === 'ready'; }, null, 180_000);
        await farmToVillage(page);
        await wait(() => document.querySelector('[data-testid=village-3d]')?.dataset.loadState === 'ready', null, 180_000);
        await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
        await page.getByTestId('village-3d').focus(); await page.keyboard.down('Shift');
        try {
          await page.evaluate((point) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: point })), BOARD_FRONT);
          await wait((point) => { const d = document.querySelector('[data-testid=village-3d]')?.dataset; return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - point.x, Number(d.avatarZ) - point.z) < 1; }, BOARD_FRONT, 120_000);
        } finally { await page.keyboard.up('Shift'); }
        await page.getByTestId('village-3d').focus(); await page.keyboard.press('KeyE');
        await page.getByTestId('board-tab-orders').click(); await page.getByTestId('community-orders').waitFor();
        assert.equal(await page.locator('dialog[open]').count(), 1, 'the village board embeds the body without a second dialog');
        row.entryPoints.villageBoard = true;
        await shot('village-board-entry');
      }
      await closeDialogs(); await page.locator('.l-world-menu-button').click(); await page.getByTestId('menu-digest').click();
      await page.getByTestId('return-board-orders').click(); await page.getByTestId('community-orders').waitFor();
      assert.equal(await page.locator('dialog[open]').count(), 1, 'the return board opens one orders dialog');
      row.entryPoints.returnBoard = true;
      assert.equal(await page.locator('[data-testid^="community-candidate-"]').count(), 3);
      const hard = communityOrderCandidates(week).find((d) => d.difficulty === 'hard');
      assert.equal(await page.getByTestId(`community-choose-${hard.id}`).isDisabled(), actor === 3, 'a jar unlock controls the hard candidate');
      await shot('three-candidates');
      await page.getByTestId(`community-choose-${candidate.id}`).click();
      assert.equal(record(), undefined, 'a choice is not made until its confirmation');
      await confirmDialog().getByRole('button', { name: '취소', exact: true }).click();
      assert.equal(record(), undefined);
      await page.getByTestId(`community-choose-${candidate.id}`).click();
      await confirmDialog().getByRole('button', { name: '이 주문으로 정하기', exact: true }).click();
      await waitState(() => record()?.order === candidate.id, 'one weekly order was chosen by the actual cloud action');
      await page.getByTestId('community-active-order').waitFor();
      assert.equal(await page.locator('[data-testid^="community-candidate-"]').count(), 0, 'the weekly choice is fixed');
    });
    await step('self-assignment-and-personal-partial-delivery', async () => {
      await page.getByTestId(`community-assign-${personalLine}`).click();
      await waitState(() => record()?.assigned[personalLine] === actor, 'own assignment is saved');
      assert.equal((await H.run(other, 'action', { action: { kind: 'communityOrder', op: 'assign', week, line: otherLine, assigned: true } })).ok, true);
      await wait((line) => document.querySelector(`[data-testid="community-assign-${line}"]`)?.disabled, otherLine);
      const before = structuredClone(state()), need = candidate.needs[personalLine];
      await page.getByTestId(`community-quantity-${personalLine}`).fill('1');
      await page.getByTestId(`community-deliver-${personalLine}`).click();
      await waitState(() => delivered(personalLine) === 1, 'one personal item delivered, not the entire requirement');
      assert.equal(record().by[actor].n[personalLine], 1);
      assert.equal(record().by[actor].s[personalLine], 0);
      assert.deepEqual(state().farm?.store, before.farm?.store, 'personal delivery leaves shared storage alone');
      const now = state();
      if (communityOrderItemKind(need.item) === 'good') assert.equal(now.farmx[H.uid].goods[need.item], before.farmx[H.uid].goods[need.item] - 1, 'artisan output came from private storage');
      else assert.equal(now.bag[H.uid].produce[need.item], before.bag[H.uid].produce[need.item] - 1, 'crop came from my bag');
      await shot('partial-and-assignment');
    });
    await step('shared-storage-explicit-confirm-and-cancel', async () => {
      const before = structuredClone(state()), count = delivered(sharedLine), need = candidate.needs[sharedLine];
      await page.getByTestId(`community-source-${sharedLine}`).selectOption('shared');
      await page.getByTestId(`community-quantity-${sharedLine}`).fill('1');
      await page.getByTestId(`community-deliver-${sharedLine}`).click();
      await confirmDialog().getByText('공동 창고에서 납품할까요?', { exact: true }).waitFor();
      await shot('shared-confirm');
      assert.deepEqual(state().farm.store, before.farm.store, 'opening the confirmation does not consume stock');
      await confirmDialog().getByRole('button', { name: '취소', exact: true }).click();
      assert.equal(delivered(sharedLine), count); assert.deepEqual(state().farm.store, before.farm.store);
      await page.getByTestId(`community-deliver-${sharedLine}`).click();
      await confirmDialog().getByRole('button', { name: '공동 창고에서 최대 1개 납품', exact: true }).click();
      await waitState(() => delivered(sharedLine) === count + 1, 'confirmed shared delivery counts once');
      assert.equal(state().farm.store[need.item], before.farm.store[need.item] - 1);
      assert.deepEqual(state().bag[H.uid], before.bag[H.uid], 'shared delivery preserves my bag');
      assert.equal(record().by[actor].s[sharedLine], 1, 'source is explicitly kept in contribution history');
      assert.equal(row.commands.filter((a) => a.op === 'deliver' && a.source === 'shared').length, 1);
      assert.equal(row.commands.find((a) => a.op === 'deliver' && a.source === 'shared').confirmShared, true);
      await tabs().getByRole('tab', { name: '기여 내역' }).click();
      await page.getByTestId('community-contribution-log').waitFor();
      assert.ok((await page.getByTestId('community-contribution-log').innerText()).includes('공동 창고'));
      await shot('contribution-history');
    });
    await step('offline-friend-completion-and-once-only-reward', async () => {
      await H.run(other, 'leave');
      assert.ok(!Object.values(H.world().rooms).some((r) => r.snapshot.players.some((p) => p.id === other.id)), 'friend is offline before finishing their share');
      for (let line = 0; line < candidate.needs.length; line++) {
        const n = candidate.needs[line].n - delivered(line);
        if (n) assert.equal((await H.run(other, 'action', { action: { kind: 'communityOrder', op: 'deliver', week, line, n, source: 'personal' } })).ok, true, 'offline friend can contribute asynchronously');
      }
      assert.ok(record().completedAt);
      await tabs().getByRole('tab', { name: '이번 주 주문' }).click();
      await wait((w) => document.querySelector(`[data-testid="community-claim-${w}"]`)?.disabled === false, week);
      const before = ownedReward(candidate.reward.furniture);
      await page.getByTestId(`community-claim-${week}`).click();
      await waitState(() => record().claimed.includes(actor), 'my reward is marked claimed');
      assert.equal(ownedReward(candidate.reward.furniture), before + 1, 'one decorative reward is granted');
      await wait((w) => document.querySelector(`[data-testid="community-claim-${w}"]`)?.disabled === true, week);
      assert.equal(record().claimed.includes(other.actor), false, 'another contributor’s reward is not taken for them');
      await shot('complete-and-reward');
    });
    await step('previous-unclaimed-expired-and-refresh', async () => {
      await tabs().getByRole('tab', { name: /지난 주문/ }).click();
      await page.getByTestId(`community-previous-${week - 1}`).waitFor();
      assert.ok((await page.getByTestId(`community-previous-${week - 2}`).innerText()).includes('기간 만료'));
      const def = communityOrderCandidates(week - 1)[0], before = ownedReward(def.reward.furniture);
      await page.getByTestId(`community-claim-${week - 1}`).click();
      await waitState(() => record(week - 1).claimed.includes(actor), 'an unclaimed reward remains available after the week ends');
      assert.equal(ownedReward(def.reward.furniture), before + 1);
      await shot('previous-orders');
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
      await wait(() => !!document.querySelector('.l-world-header'), null, 90_000); await openOrders();
      assert.ok(record().claimed.includes(actor) && record(week - 1).claimed.includes(actor), 'refresh retains progress and reward receipts');
      assert.equal(await page.getByTestId(`community-claim-${week}`).isDisabled(), true);
      await shot('persisted-order');
    });
    await Promise.all(pendingReads); row.pageErrors = [...H.errors]; row.blockedExternalHosts = [...H.external];
    assert.deepEqual(row.pageErrors, []); assert.deepEqual(row.consoleErrors, []); assert.deepEqual(row.failedResources, []); assert.deepEqual(row.apiFailures, []);
    row.status = 'passed';
  } catch (error) { row.status = 'failed'; row.error = error.stack ?? error.message; row.pageErrors = [...H.errors]; await shot('failure').catch(() => {}); throw error; }
  finally { persist(); await H.close(); }
}
try { server = await serve(pages); browser = await launchBrowser(); for (let i = 0; i < actors.length; i++) await run(actors[i], views[i % views.length]); report.status = 'passed'; }
catch (error) { report.status = 'failed'; report.error = error.stack ?? error.message; process.exitCode = 1; console.error(error); }
finally { report.finishedAt = new Date(realNow()).toISOString(); persist(); await browser?.close().catch(() => {}); await server?.close(); Date.now = realNow; }
