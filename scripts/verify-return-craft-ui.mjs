// Synthetic accounts, local Pages files and the real cloud engine only.
// Every non-local request is intercepted or blocked by ui-harness.
// node --experimental-strip-types scripts/verify-return-craft-ui.mjs --pages <build> --out <evidence-dir>
// Defaults to two independent contexts: actor 3 at 1280x720, actor 7 at 1920x1080.
// Add --matrix for both actors at both viewports. This never builds or deploys.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { launchBrowser, login, serve, setup, VIEWS } from './ui-harness.mjs';
import { measureInPage } from './ui-measure.mjs';
import { ACTORS } from '../app/lounge-roster.ts';
import { CRAFTS, DISHES, ITEM_BY_ID } from '../app/lounge-items.ts';
import { lifeView, readLife } from '../app/lounge-life.ts';
import { gameTimeOnDay } from '../app/lounge-calendar.ts';
import { kstDay } from '../app/lounge-economy.ts';
import { personalSite } from '../app/lounge-farm-sites-layout.ts';

const args = process.argv.slice(2);
const opt = (key, fallback) => { const i = args.indexOf('--' + key); return i < 0 ? fallback : args[i + 1]; };
const pages = path.resolve(opt('pages', ''));
assert.ok(args.includes('--pages') && fs.existsSync(path.join(pages, 'index.html')), 'Pass --pages with a completed Pages build.');
const out = path.resolve(opt('out', '.ui-shots/return-craft'));
const views = opt('views', 's,fhd').split(',');
const actors = opt('actors', '3,7').split(',').map(Number);
assert.ok(views.every((v) => VIEWS[v]) && actors.every((a) => [3, 7].includes(a)), 'Supported synthetic actors: 3,7; views: s,fhd,d.');
const contexts = args.includes('--matrix') ? actors.flatMap((actor) => views.map((view) => ({ actor, view })))
  : actors.map((actor, i) => ({ actor, view: views[i % views.length] }));
if (!process.env.CHROMIUM_PATH && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe'))
  process.env.CHROMIUM_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(out, { recursive: true });

// A Thursday game evening gives an existing account two missed weekdays.
// Keep native timers/rAF; only synthetic server/browser wall time changes.
const realNow = Date.now;
let day = kstDay(realNow());
while (((day + 3) % 7 + 7) % 7 !== 3) day++;
const fixtureStart = gameTimeOnDay(day, 21), started = performance.now();
Date.now = () => Math.floor(fixtureStart + performance.now() - started);
const woodRecipes = CRAFTS.filter((r) => r.count === 1 && r.makes.startsWith('furn-') && r.needs.some((n) => 'item' in n && n.item === 'wood')).slice(0, 3);
const meal = DISHES.find((r) => r.count === 1 && r.needs.some((n) => 'item' in n && n.item === 'carrot'));
assert.ok(woodRecipes.length === 3 && meal, 'fixture recipes exist');
const goalId = (t) => `craft-goal-${t.kind}-${t.id}`;
const initialGoals = [
  { kind: 'craft', id: woodRecipes[0].id, quantity: 2 },
  { kind: 'craft', id: woodRecipes[1].id, quantity: 3 },
  { kind: 'cook', id: meal.id, quantity: 10 },
];
function seedLife(life, uid, actor) {
  const now = Date.now(), d = kstDay(now);
  const x = ((life.ext ??= {})[uid] ??= {});
  x.inv = { wood: 3, stone: 2, pinecone: 1, fertilizer: 1 };
  x.furn = {};
  delete x.craftTargets;
  x.npcRelations = { lumi: { points: 100, tc: 10, ch: 0 } };
  life.bag[uid].produce.carrot = 2;
  x.q1 = {}; x.q2 = {}; x.q3 = {};
  ((life.growth ??= {}).u ??= {})[uid] = { xp: { farm: 0, fish: 0, forage: 0, mine: 0, craft: 0 }, retro: now, seen: d };
  (life.farmx ??= {})[uid] = {
    mach: { 0: { k: 'jar', out: 'jar-carrot', n: 1, at: now - 7 * 3_600_000, done: now - 60_000 } },
    goods: { 'jar-strawberry': 1 }, st: d,
  };
  life.farm = { sites: { M1: { kind: 'machineYard', tier: 1, owner: 'shared', state: {}, paid: {} } }, store: { carrot: 50 }, d, gm: now - 86_400_000 };
  (life.myday ??= {})[uid] = { w: { w: Math.floor((d + 3) / 7), m: 1, u: 0 } };
  if (actor === 7) {
    // A new account starts without someone else's field/story or missed days.
    life.farms[uid] = {};
    delete x.npcRelations;
    delete life.myday[uid];
    life.farmx[uid] = {};
  }
}
const report = { status: 'running', mockOnly: true, pages, fixtureAt: new Date(fixtureStart).toISOString(), startedAt: new Date(realNow()).toISOString(), runs: [] };
const persist = () => fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
persist();
let browser, server;

async function run({ actor, view }) {
  const row = { actor, name: ACTORS[actor], view, viewport: VIEWS[view], status: 'running', steps: [], screenshots: [], consoleErrors: [], failedResources: [], apiFailures: [], commands: [] };
  report.runs.push(row); persist();
  const H = await setup({ browser, base: server.url, actor, view, seedLife: (life, uid) => seedLife(life, uid, actor) });
  const { page, ctx } = H;
  const pendingResponses = [];
  const state = () => readLife(H.world().life);
  const targets = () => state().ext?.[H.uid]?.craftTargets ?? [];
  const model = () => lifeView(state(), H.uid, actor, Date.now());
  const wait = async (fn, arg, timeout = 30_000) => assert.notEqual(await H.until(fn, timeout, arg), -1, `UI wait: ${fn.toString().slice(0, 160)}`);
  const waitState = async (fn, label) => {
    const deadline = performance.now() + 20_000;
    while (!fn() && performance.now() < deadline) await H.sleep(100);
    assert.ok(fn(), label);
  };
  await ctx.addInitScript((clock) => {
    localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, quality: 'low', fpsCap: 30, dayNight: false }));
    const start = performance.now(); Date.now = () => Math.floor(clock + performance.now() - start);
  }, Date.now());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('console', (message) => { if (message.type() === 'error') row.consoleErrors.push(message.text().slice(0, 600)); });
  page.on('requestfailed', (request) => { if (request.url().startsWith(server.url) && request.failure()?.errorText !== 'net::ERR_ABORTED') row.failedResources.push({ url: request.url().replace(server.url, '/'), error: request.failure()?.errorText }); });
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().startsWith(server.url)) row.failedResources.push({ url: response.url().replace(server.url, '/'), status: response.status() });
    if (response.status() >= 400 && response.url().includes('/functions/v1/')) {
      const failure = { status: response.status(), path: new URL(response.url()).pathname };
      row.apiFailures.push(failure);
      pendingResponses.push(response.json().then((body) => { failure.error = body.error; }).catch(() => {}));
    }
  });
  page.on('request', (request) => {
    if (!request.url().includes('/functions/v1/hohyeon-api')) return;
    try {
      const command = JSON.parse(request.postData() || '{}').command;
      if (command?.action?.kind === 'craftTarget' || command?.action?.kind === 'npcChat') row.commands.push({ op: command.op, action: command.action });
    } catch {}
  });
  const shot = async (label) => {
    await page.evaluate(() => document.fonts.ready);
    const file = `${view}-actor${actor}-${label}.png`;
    await page.screenshot({ path: path.join(out, file), timeout: 90_000 });
    const metrics = await page.evaluate(measureInPage);
    row.screenshots.push({ label, file, metrics }); persist();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${label}: no page horizontal overflow`);
    assert.equal(metrics.coveredCount, 0, `${label}: visible controls are reachable ${JSON.stringify(metrics.covered)}`);
    assert.equal(metrics.lowCount, 0, `${label}: all measured text meets contrast targets ${JSON.stringify(metrics.low)}`);
  };
  const step = async (label, work) => {
    console.log(`${view} actor ${actor}: ${label}`);
    const at = performance.now();
    try { await work(); row.steps.push({ label, pass: true, ms: Math.round(performance.now() - at) }); }
    catch (error) { row.steps.push({ label, pass: false, error: error.message }); throw error; }
    finally { persist(); }
  };
  const closeDialogs = async () => {
    for (let n = 0; n < 6 && await page.locator('dialog[open]').count(); n++) { await page.keyboard.press('Escape'); await H.sleep(150); }
  };
  const menu = async (item) => {
    await closeDialogs();
    await page.locator('.l-world-menu-button').click();
    await page.getByTestId('village-menu').waitFor();
    await page.getByTestId(`menu-${item}`).click();
  };
  const openBoard = async () => { await menu('digest'); await page.getByTestId('return-board').waitFor({ timeout: 30_000 }); };
  const openTracker = async () => { await menu('growth'); await page.getByTestId('growth-tab-targets').click(); await page.getByTestId('craft-tracker').waitFor(); };
  const add = async (target) => {
    await page.getByTestId('craft-add-select').selectOption(`${target.kind}:${target.id}`);
    if (target.kind !== 'facility') await page.getByTestId('craft-add-quantity').fill(String(target.quantity));
    await page.getByTestId('craft-add-submit').click();
    await waitState(() => targets().some((t) => t.kind === target.kind && t.id === target.id && t.quantity === target.quantity), 'UI pin persisted through the real cloud engine');
    await page.getByTestId(goalId(target)).waitFor();
  };
  const toggleRecipeGoal = async (selector) => {
    const button = page.locator(selector).first();
    await button.waitFor({ state: 'attached' });
    for (const details of await button.locator('xpath=ancestor::details').all()) {
      if (await details.getAttribute('open') === null) await details.locator(':scope > summary').click();
    }
    await button.click();
    await button.waitFor();
    await waitState(() => targets().length === 3, 'recipe button pins into the free slot');
    await wait((sel) => document.querySelector(sel)?.getAttribute('aria-pressed') === 'true', selector);
    await button.click();
    await waitState(() => targets().length === 2, 'the same recipe button unpins its target');
    await wait((sel) => document.querySelector(sel)?.getAttribute('aria-pressed') === 'false', selector);
  };
  try {
    // The other account exists in this same authoritative world, rather than
    // proving isolation using only two unrelated empty fixtures.
    const other = H.bots[0];
    assert.equal((await H.run(other, 'action', { action: { kind: 'craftTarget', op: 'pin', target: { kind: 'craft', id: woodRecipes[2].id, quantity: 7 } } })).ok, true);
    await step('login-and-return-board', async () => {
      await login(H, server.url);
      await wait(() => !!document.querySelector('.l-world-header'), null, 90_000);
      await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.loadState === 'ready', null, 180_000);
      await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
      await openBoard();
      if (actor === 3) {
        for (const id of ['harvest-field', 'processing-0', 'story-lumi', 'makeup']) await page.getByTestId(`return-board-item-${id}`).waitFor();
        assert.ok(model().myday.mk > 0, 'existing account fixture has missed-day chances');
      } else {
        assert.equal(await page.locator('[data-testid^="return-board-item-"]').count(), 0, 'new account inherits no other player’s tasks');
        assert.equal(model().myday.mk, 0, 'a first visit owes no missed days');
      }
      await shot('return-board');
      await page.getByTestId('return-board-targets').click();
      await page.getByTestId('craft-tracker').waitFor();
      assert.equal(await page.locator('[data-testid^="craft-goal-"]').count(), 0, 'another account’s goal is absent from this UI');
    });
    await step('three-goals-material-totals-and-cap', async () => {
      for (const target of initialGoals) await add(target);
      assert.equal(targets().length, 3);
      const table = page.getByTestId('craft-totals').locator('table').first();
      const cells = async (name) => table.locator('tbody tr').filter({ has: page.locator('th', { hasText: name }) }).first().locator('td').allTextContents();
      const wood = await cells(ITEM_BY_ID.wood.name);
      const woodNeeded = woodRecipes.slice(0, 2).reduce((n, recipe, i) => n + recipe.needs.find((need) => 'item' in need && need.item === 'wood').n * initialGoals[i].quantity, 0);
      assert.equal(Number(wood[0].replace(/[^0-9]/g, '')), woodNeeded, 'same-material requirements add across both goals');
      assert.equal(Number(wood[1].replace(/[^0-9]/g, '')), 3, 'personal wood is shown once in the total');
      const carrot = await cells('당근');
      assert.equal(carrot[1].trim(), '2', 'my carrot count excludes shared storage');
      assert.equal(carrot[2].trim(), '50', 'shared carrots are a separate reference count');
      assert.ok(Number(carrot[3].match(/^\s*([0-9,]+)/)?.[1].replaceAll(',', '')) > 0, 'shared carrots do not remove my shortage');
      await page.getByTestId('craft-add-select').selectOption(`craft:${woodRecipes[2].id}`);
      assert.equal(await page.getByTestId('craft-add-submit').isDisabled(), true, 'a fourth goal is disabled');
      row.materialEvidence = { wood, carrot, woodNeeded };
      await shot('three-goals-and-totals');
    });
    await step('quantity-remove-refresh-and-account-isolation', async () => {
      const first = initialGoals[0];
      const input = page.getByTestId(`craft-quantity-${first.kind}-${first.id}`);
      await input.fill('5');
      await input.locator('xpath=ancestor::form').getByRole('button', { name: '수량 바꾸기', exact: true }).click();
      await waitState(() => targets().find((t) => t.id === first.id)?.quantity === 5, 'quantity updates are saved');
      await page.getByTestId(`craft-remove-cook-${meal.id}`).click();
      await waitState(() => targets().length === 2, 'unpin frees a slot');
      const expected = structuredClone(targets());
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
      await wait(() => !!document.querySelector('.l-world-header'), null, 90_000);
      await openTracker();
      assert.deepEqual(targets(), expected, 'refresh preserves account goals');
      for (const target of expected) await page.getByTestId(goalId(target)).waitFor();
      assert.equal(await page.locator('[data-testid^="craft-goal-"]').count(), 2);
      assert.deepEqual(state().ext[other.id].craftTargets, [{ kind: 'craft', id: woodRecipes[2].id, quantity: 7 }], 'my edits do not touch the other account');
      await shot('persisted-goals');
    });
    await step('additional-stock-limit-is-explicit-and-does-not-save', async () => {
      assert.equal(targets().length, 2, 'there is a free goal slot, so this is the quantity limit');
      assert.equal(model().me.inv.fertilizer, 1, 'the selected product is already owned');
      const before = structuredClone(targets()), requestsBefore = row.commands.length;
      await page.getByTestId('craft-add-select').selectOption('craft:fertilizer');
      await page.getByTestId('craft-add-quantity').fill('999');
      const submit = page.getByTestId('craft-add-submit');
      assert.equal(await submit.isDisabled(), true, 'one owned plus 999 additional is blocked');
      const alert = page.getByTestId('craft-tracker').getByRole('alert');
      await alert.waitFor();
      const message = await alert.innerText();
      assert.match(message, /현재 1개.*최대 999개/, 'the limit explains both existing stock and the maximum');
      assert.match(await submit.getAttribute('title'), /최대 999개/, 'the disabled button explains the limit');
      await page.getByTestId('craft-add-quantity').press('Enter');
      await H.sleep(300);
      assert.deepEqual(targets(), before, 'an over-limit input never changes saved goals');
      assert.equal(row.commands.length, requestsBefore, 'an over-limit form never sends a save command');
      row.limitEvidence = { owned: 1, additional: 999, disabled: true, message, requestDelta: row.commands.length - requestsBefore };
      await shot('additional-stock-limit');
      await page.getByTestId('craft-add-select').selectOption('');
      await page.getByTestId('craft-add-quantity').fill('1');
    });
    await step('kitchen-cooking-and-furniture-pin-buttons', async () => {
      await menu('kitchen');
      await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.action === 'cook', null, 90_000);
      await page.getByTestId('bedroom-3d').focus(); await page.keyboard.press('KeyE');
      await page.getByTestId(`recipe-${meal.id}`).click();
      await toggleRecipeGoal(`[data-testid="track-goal-cook-${meal.id}"]`);
      await page.getByTestId('kitchen-tab-craft').click();
      await page.getByTestId(`recipe-${woodRecipes[2].id}`).click();
      await toggleRecipeGoal(`[data-testid="track-goal-craft-${woodRecipes[2].id}"]`);
      await shot('kitchen-furniture-pin');
    });
    if (actor === 3) await step('return-links-farm-processing-and-notebook', async () => {
      await openBoard();
      await page.getByTestId('return-board-item-harvest-field').getByRole('button', { name: /밭 보기/ }).click();
      await page.getByTestId('farm-ledger').waitFor();
      await shot('return-farm-ledger');
      await page.getByTestId('farm-harvest-all').click();
      await waitState(() => model().me.farm.every((p) => !p.ready), 'the board opens the real harvest action');
      await openBoard();
      assert.equal(await page.getByTestId('return-board-item-harvest-field').count(), 0, 'completed harvest leaves the board');
      await page.getByTestId('return-board-item-processing-0').getByRole('button', { name: /가공 보기/ }).click();
      await page.getByTestId('farm-works-works').waitFor();
      await toggleRecipeGoal('[data-testid="track-goal-farm-jar"]');
      await toggleRecipeGoal('[data-testid^="track-goal-good-"]');
      await shot('return-processing-and-pin');
      await page.getByTestId('farm-collect-all').click();
      await waitState(() => !model().farmx.machines.find((m) => m.slot === 0)?.out, 'the board opens the real processing collection');
      await openBoard();
      assert.equal(await page.getByTestId('return-board-item-processing-0').count(), 0, 'collected processing leaves the board');
      await page.getByTestId('return-board-item-story-lumi').getByRole('button', { name: /수첩 보기/ }).click();
      await page.getByTestId('npc-card-lumi').waitFor();
      await page.getByTestId('npc-story').waitFor();
      assert.equal(row.commands.filter((c) => c.action.kind === 'npcChat').length, 0, 'notebook navigation does not remotely complete a chapter');
      await shot('return-npc-notebook');
    });
    await step('facility-pin', async () => {
      await closeDialogs();
      if (await page.getByTestId('bedroom-3d').count()) await page.getByTestId('village-return').click();
      await wait(() => { const d = document.querySelector('[data-testid=area-3d]')?.dataset; return d?.area === 'farm' && d.loadState === 'ready'; }, null, 180_000);
      await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
      const site = personalSite(actor);
      await page.evaluate((point) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: point })), { x: site.x, z: site.z });
      await wait((point) => { const d = document.querySelector('[data-testid=area-3d]')?.dataset; return d?.action === 'farm' && d.walking === 'false' && Math.hypot(Number(d.avatarX) - point.x, Number(d.avatarZ) - point.z) < 0.6; }, { x: site.x, z: site.z }, 90_000);
      await page.getByTestId('area-3d').focus(); await page.keyboard.press('KeyE');
      await toggleRecipeGoal('[data-testid^="track-goal-facility-"]');
      await shot('facility-pin');
    });
    if (actor === 3) await step('return-bed-directions', async () => {
      await openBoard();
      await page.getByTestId('return-board-item-makeup').getByRole('button', { name: /길 안내/ }).click();
      await wait(() => !document.querySelector('[data-testid=return-board]'));
      // The shell's normal route walks to my house and then to the bed.
      await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.loadState === 'ready', null, 180_000);
      await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.action === 'sleep', null, 90_000);
      await shot('bed-directions');
    });
    await Promise.all(pendingResponses);
    row.pageErrors = [...H.errors]; row.blockedExternalHosts = [...H.external];
    assert.deepEqual(row.pageErrors, [], 'no page exceptions');
    assert.deepEqual(row.consoleErrors, [], 'no console errors');
    assert.deepEqual(row.failedResources, [], 'all requested local resources loaded');
    assert.deepEqual(row.apiFailures, [], 'no mocked API errors');
    assert.ok(row.commands.filter((c) => c.action.kind === 'craftTarget').length >= 10, 'buttons used real cloud commands');
    row.status = 'passed';
  } catch (error) {
    row.status = 'failed'; row.error = error.stack ?? error.message; row.pageErrors = [...H.errors];
    await shot('failure').catch(() => {}); throw error;
  } finally { persist(); await H.close(); }
}

try {
  server = await serve(pages); browser = await launchBrowser();
  for (const context of contexts) await run(context);
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = error.stack ?? error.message; process.exitCode = 1;
  console.error(error);
} finally {
  report.finishedAt = new Date(realNow()).toISOString(); persist();
  await browser?.close().catch(() => {}); await server?.close(); Date.now = realNow;
}
