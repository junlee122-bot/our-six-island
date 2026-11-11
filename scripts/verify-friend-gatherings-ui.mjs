// Synthetic friends and a local Pages build only. ui-harness routes every API
// call through the actual cloud engine and blocks all other external traffic.
// node --experimental-strip-types scripts/verify-friend-gatherings-ui.mjs --pages <build> --out <evidence-dir>
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { farmToVillage, launchBrowser, login, serve, setup, VIEWS } from './ui-harness.mjs';
import { measureInPage } from './ui-measure.mjs';
import { readLife } from '../app/lounge-life.ts';
import { FISH_STAND, BOARD_FRONT } from '../app/lounge-village-spots.ts';
import { gatheringNavigation } from '../app/lounge-gatherings-navigation.ts';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf('--' + name); return i < 0 ? fallback : args[i + 1]; };
const pages = path.resolve(opt('pages', ''));
assert.ok(args.includes('--pages') && fs.existsSync(path.join(pages, 'index.html')), 'Pass --pages with a completed build; this script never builds or deploys.');
const out = path.resolve(opt('out', '.ui-shots/friend-gatherings'));
const actors = opt('actors', '3,7').split(',').map(Number), views = opt('views', 's,fhd').split(',');
const selectedStep = opt('steps', '');
assert.ok(!selectedStep || selectedStep === 'village-board-entry-and-native-guides', '--steps supports the independent village-board-entry-and-native-guides stage; omit it for the complete CI flow.');
assert.ok(actors.length && actors.every((a) => a === 3 || a === 7) && views.every((v) => VIEWS[v]));
if (!process.env.CHROMIUM_PATH && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) process.env.CHROMIUM_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(out, { recursive: true });
const realNow = Date.now, started = performance.now(), fixtureStart = Date.UTC(2026, 10, 12, 3);
Date.now = () => Math.floor(fixtureStart + performance.now() - started);
const kstInput = (at) => new Date(at + 9 * 3_600_000).toISOString().slice(0, 16);
const MINUTE = 60_000, DAY = 86_400_000;
const runningId = 'gathering-9001', scheduledId = 'gathering-9002', expiredId = 'gathering-9003';
function seedLife(life, uid, actor) {
  const now = Date.now(), owner = (a) => Object.keys(life.actors).find((id) => life.actors[id] === a);
  life.gatherings = { records: [
    { id: runningId, host: 0, hostId: owner(0), place: 'pond-fishing', createdAt: now - 2 * MINUTE, startsAt: now - MINUTE, endsAt: now + 29 * MINUTE, note: '늦게 와도 괜찮아. 연못에서 만나자.', participants: [0, 4] },
    { id: scheduledId, host: 6, hostId: owner(6), place: 'bakery-meal', createdAt: now - MINUTE, startsAt: now + 60 * MINUTE, endsAt: now + 120 * MINUTE, note: '카페에서 각자 먹고 싶은 걸 골라요.', participants: [6] },
    { id: expiredId, host: 2, hostId: owner(2), place: 'hall-yacht', createdAt: now - 61 * MINUTE, startsAt: now - 60 * MINUTE, endsAt: now - 30 * MINUTE, participants: [2, actor] },
  ] };
  life.seq = Math.max(life.seq, 9010);
  ((life.ext ??= {})[uid] ??= {}).inv = { wood: 10, bait: 3, flowertea: 1 };
  assert.ok(readLife(life).gatherings?.records.some((g) => g.id === expiredId), 'the expired fixture survives canonical restoration');
}
const report = { status: 'running', mockOnly: true, pages, startedAt: new Date(realNow()).toISOString(), fixtureAt: new Date(fixtureStart).toISOString(), runs: [] };
const persist = () => fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
persist();
let browser, server;

async function run(actor, view) {
  // One context deliberately uses a different browser timezone. Reservations
  // still represent the Korean time printed beside the field.
  const timezoneId = actor === 3 ? 'America/Los_Angeles' : 'Asia/Seoul';
  const host = { newContext: (options) => browser.newContext({ ...options, timezoneId }) };
  const row = { actor, view, viewport: VIEWS[view], timezoneId, status: 'running', steps: [], screenshots: [], pageErrors: [], consoleErrors: [], failedResources: [], apiFailures: [], actions: [] };
  report.runs.push(row); persist();
  const H = await setup({ browser: host, base: server.url, actor, view, seedLife: (life, uid) => seedLife(life, uid, actor) });
  const { page, ctx } = H;
  const responseReads = [];
  const state = () => readLife(H.world().life), records = () => state().gatherings?.records ?? [];
  const record = (id) => records().find((g) => g.id === id);
  const resource = () => { const s = state(); return structuredClone({ wallet: H.world().ledger.accounts['wallet-' + H.uid], bag: s.bag[H.uid], inv: s.ext?.[H.uid]?.inv ?? {}, goods: s.farmx?.[H.uid]?.goods ?? {}, furniture: s.ext?.[H.uid]?.furn ?? {}, xp: s.growth?.u?.[H.uid]?.xp ?? {} }); };
  const wait = async (fn, arg, ms = 30_000) => assert.notEqual(await H.until(fn, ms, arg), -1, `UI wait: ${fn.toString().slice(0, 160)}`);
  const waitState = async (fn, label) => { const end = performance.now() + 20_000; while (!fn() && performance.now() < end) await H.sleep(100); assert.ok(fn(), label); };
  await ctx.addInitScript((clock) => { localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, quality: 'low', fpsCap: 30, dayNight: false })); const at = performance.now(); Date.now = () => Math.floor(clock + performance.now() - at); }, Date.now());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('console', (m) => { if (m.type() === 'error') row.consoleErrors.push(m.text().slice(0, 600)); });
  page.on('requestfailed', (r) => { if (r.url().startsWith(server.url) && r.failure()?.errorText !== 'net::ERR_ABORTED') row.failedResources.push({ url: r.url().replace(server.url, '/'), error: r.failure()?.errorText }); });
  page.on('request', (r) => { if (!r.url().includes('/functions/v1/hohyeon-api')) return; try { const action = JSON.parse(r.postData() || '{}').command?.action; if (action) row.actions.push(action); } catch {} });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(server.url)) row.failedResources.push({ url: r.url().replace(server.url, '/'), status: r.status() });
    if (r.status() >= 400 && r.url().includes('/functions/v1/')) { const item = { status: r.status(), path: new URL(r.url()).pathname }; row.apiFailures.push(item); responseReads.push(r.json().then((b) => { item.error = b.error; }).catch(() => {})); }
  });
  const shot = async (label) => {
    await page.evaluate(() => document.fonts.ready);
    const file = `${view}-actor${actor}-${label}.png`; await page.screenshot({ path: path.join(out, file), timeout: 90_000 });
    const metrics = await page.evaluate(measureInPage); row.screenshots.push({ label, file, metrics }); persist();
    for (const key of ['coveredCount', 'lowCount', 'smallCount', 'cutCount']) assert.equal(metrics[key], 0, `${label}: ${key} ${JSON.stringify(metrics)}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'no page horizontal overflow');
  };
  const step = async (label, work) => { if (selectedStep && selectedStep !== label) return; console.log(`${view} actor ${actor}: ${label}`); const at = performance.now(); try { await work(); row.steps.push({ label, pass: true, ms: Math.round(performance.now() - at) }); } catch (error) { row.steps.push({ label, pass: false, error: error.message }); throw error; } finally { persist(); } };
  const closeDialogs = async () => { for (let i = 0; i < 6 && await page.locator('dialog[open]').count(); i++) { await page.keyboard.press('Escape'); await H.sleep(150); } };
  const menu = async (item) => { await closeDialogs(); await page.locator('.l-world-menu-button').click(); await page.getByTestId(`menu-${item}`).click(); };
  const openGatherings = async () => { await menu('gatherings'); await page.getByTestId('friend-gatherings').waitFor(); };
  const tabs = () => page.getByRole('tablist', { name: '친구 모임 쪽' });
  const tab = (name) => tabs().getByRole('tab', { name });
  const card = (id) => page.getByTestId(`gathering-card-${id}`);
  const confirmDialog = () => page.locator('dialog[open]').last();
  const selfArea = () => Object.values(H.world().rooms).flatMap((r) => r.snapshot.players).find((p) => p.id === H.uid)?.area;
  let nowId, reservationId, metadataBefore;
  try {
    await login(H, server.url); await wait(() => !!document.querySelector('.l-world-header'), null, 90_000);
    await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.loadState === 'ready', null, 180_000);
    await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
    row.entryPoints = { menu: false, friends: false, returnBoard: false, villageBoard: false };
    await step('entry-points-and-three-activities', async () => {
      await openGatherings(); await card(runningId).waitFor(); await card(scheduledId).waitFor();
      row.entryPoints.menu = true;
      await menu('friends'); await page.getByTestId('friends-gatherings').click(); await page.getByTestId('friend-gatherings').waitFor(); row.entryPoints.friends = true;
      await menu('digest'); await page.getByTestId('return-board-gatherings').click(); await page.getByTestId('friend-gatherings').waitFor(); row.entryPoints.returnBoard = true;
      assert.equal(await page.locator('dialog[open]').count(), 1, 'the entry swaps dialogs');
      await tab('모임 열기').click();
      assert.deepEqual(await page.getByTestId('gathering-activity').locator('option').evaluateAll((options) => options.map((o) => o.value)), ['fishing', 'meal', 'table']);
      await shot('create-form');
      await tab(/열린 모임/).click(); await shot('open-gatherings');
      metadataBefore = resource();
    });
    await step('create-now-host-limit-and-finish', async () => {
      await tab('모임 열기').click();
      await page.getByTestId('gathering-activity').selectOption('fishing'); await page.getByTestId('gathering-place').selectOption('river-fishing');
      await page.getByTestId('gathering-duration').selectOption('30'); await page.getByTestId('gathering-note').fill('강가에서 천천히 낚시해요.');
      const before = records().length; await page.getByTestId('gathering-create-submit').click();
      await waitState(() => records().length === before + 1, 'a now gathering is created');
      const created = records().find((g) => g.host === actor && !g.closed && g.endsAt > Date.now()); nowId = created.id;
      assert.equal(created.place, 'river-fishing'); assert.deepEqual(created.participants, [actor]); assert.equal(created.endsAt - created.startsAt, 30 * MINUTE);
      const payload = row.actions.find((a) => a.kind === 'gathering' && a.op === 'create'); assert.equal(Object.hasOwn(payload, 'startsAt'), false, 'now is determined by the server');
      await card(nowId).waitFor(); assert.equal(await page.getByTestId(`gathering-leave-${nowId}`).count(), 0, 'the host uses finish instead of leaving');
      await tab('모임 열기').click(); assert.equal(await page.getByTestId('gathering-create-submit').isDisabled(), true, 'one open gathering per host');
      await tab(/열린 모임/).click(); await page.getByTestId(`gathering-finish-${nowId}`).click();
      assert.equal(record(nowId).closed, undefined); await confirmDialog().getByRole('button', { name: '취소', exact: true }).click(); assert.equal(record(nowId).closed, undefined);
      await page.getByTestId(`gathering-finish-${nowId}`).click(); await confirmDialog().getByRole('button', { name: '모임 마치기', exact: true }).click();
      await waitState(() => record(nowId)?.closed === 'finished', 'host finishes the now gathering');
    });
    await step('korean-time-reservation-and-seven-day-limit', async () => {
      await tab('모임 열기').click(); await page.getByTestId('gathering-activity').selectOption('meal'); await page.getByTestId('gathering-place').selectOption('tavern-meal');
      await page.getByTestId('gathering-when-scheduled').check();
      await page.getByTestId('gathering-starts-at').fill(kstInput(Date.now() + 8 * DAY));
      assert.equal(await page.getByTestId('gathering-create-submit').isDisabled(), true); assert.match(await page.getByTestId('gathering-create-form').getByRole('alert').innerText(), /7일/);
      await page.getByTestId('gathering-starts-at').fill(kstInput(Date.now() - 60 * MINUTE)); assert.equal(await page.getByTestId('gathering-create-submit').isDisabled(), true, 'past reservation is blocked');
      const startsAt = Math.floor((Date.now() + 2 * DAY) / MINUTE) * MINUTE, input = kstInput(startsAt);
      await page.getByTestId('gathering-starts-at').fill(input); await page.getByTestId('gathering-duration').selectOption('120'); await page.getByTestId('gathering-note').fill('각자 먹고 싶은 걸 골라서 이야기해요.');
      await shot('korean-time-reservation'); await page.getByTestId('gathering-create-submit').click();
      await waitState(() => records().some((g) => g.host === actor && g.startsAt === startsAt), 'Korean time is kept as the intended epoch even in a different timezone');
      reservationId = records().find((g) => g.host === actor && g.startsAt === startsAt).id;
      assert.equal(record(reservationId).endsAt, startsAt + 120 * MINUTE);
      row.reservationEvidence = { browserTimezone: timezoneId, typedKoreanTime: input, expectedEpoch: startsAt, savedEpoch: record(reservationId).startsAt };
      await page.getByTestId(`gathering-cancel-${reservationId}`).click(); await confirmDialog().getByRole('button', { name: '예약 취소하기', exact: true }).click();
      await waitState(() => record(reservationId)?.closed === 'cancelled', 'host cancels their reservation');
    });
    await step('late-rsvp-leave-and-absent-host', async () => {
      const other = H.bots.find((p) => p.actor === 0); await H.run(other, 'leave');
      assert.equal(record(runningId).closed, undefined, 'a host disconnect does not end the gathering');
      const area = selfArea(); await page.getByTestId(`gathering-join-${runningId}`).click();
      await waitState(() => record(runningId).participants.includes(actor), 'late RSVP is allowed before the end');
      assert.equal(selfArea(), area, 'joining does not move the player');
      assert.doesNotMatch(await card(runningId).innerText(), /오프라인|접속하지 않았/, 'unseen participants are not declared offline');
      await page.getByTestId(`gathering-leave-${runningId}`).click(); await waitState(() => !record(runningId).participants.includes(actor), 'the participant may leave');
      await page.getByTestId(`gathering-join-${scheduledId}`).click(); await waitState(() => record(scheduledId).participants.includes(actor), 'scheduled RSVP is saved');
      assert.deepEqual(resource(), metadataBefore, 'gathering metadata changes no wallet, bag, goods, furniture or XP');
      await shot('rsvp-and-status');
    });
    await step('history-expiry-and-refresh-persistence', async () => {
      await tab('지난 모임').click();
      await card(expiredId).waitFor(); assert.match(await card(expiredId).innerText(), /모임 시간이 지났어요/);
      assert.match(await card(expiredId).innerText(), /모임 시간이 끝났어요/, 'automatic expiry is distinct from a host finishing');
      assert.doesNotMatch(await card(expiredId).innerText(), /주최자가 모임 약속을 마쳤어요/);
      await card(nowId).waitFor(); await card(reservationId).waitFor();
      assert.equal(await page.getByTestId(`gathering-join-${expiredId}`).count(), 0, 'expired history cannot be joined');
      await shot('previous-gatherings');
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 }); await wait(() => !!document.querySelector('.l-world-header'), null, 90_000); await openGatherings();
      await page.getByTestId(`gathering-leave-${scheduledId}`).waitFor(); assert.ok(record(scheduledId).participants.includes(actor), 'refresh keeps RSVP');
      assert.equal(record(nowId).closed, 'finished'); assert.equal(record(reservationId).closed, 'cancelled');
      await page.getByTestId(`gathering-leave-${scheduledId}`).click(); await waitState(() => !record(scheduledId).participants.includes(actor), 'leave after refresh is authoritative');
    });
    if (actor === 3) await step('village-board-entry-and-native-guides', async () => {
      await closeDialogs(); if (await page.getByTestId('bedroom-3d').count()) await page.getByTestId('village-return').click();
      await wait(() => { const d = document.querySelector('[data-testid=area-3d]')?.dataset; return d?.area === 'farm' && d.loadState === 'ready'; }, null, 180_000); await farmToVillage(page);
      await wait(() => document.querySelector('[data-testid=village-3d]')?.dataset.loadState === 'ready', null, 180_000);
      await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
      await page.evaluate((point) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: point })), BOARD_FRONT);
      await wait((point) => { const d = document.querySelector('[data-testid=village-3d]')?.dataset; return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - point.x, Number(d.avatarZ) - point.z) < 1; }, BOARD_FRONT, 120_000);
      await page.getByTestId('village-3d').focus(); await page.keyboard.press('KeyE'); await page.getByTestId('board-tab-gatherings').click(); await page.getByTestId('friend-gatherings').waitFor();
      assert.equal(await page.locator('dialog[open]').count(), 1, 'the board embeds one body'); row.entryPoints.villageBoard = true; await shot('village-board');
      const guideStart = row.actions.length;
      await page.getByTestId(`gathering-guide-${runningId}`).click();
      await wait(() => !document.querySelector('dialog[open]'));
      await wait((point) => { const d = document.querySelector('[data-testid=village-3d]')?.dataset; return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - point.x, Number(d.avatarZ) - point.z) < 1; }, FISH_STAND.pond, 120_000);
      assert.equal(selfArea(), 'village', 'same-area directions do not teleport to a different area'); await shot('pond-directions');
      // The guide starts after a short scene handoff. A newer keyboard or
      // menu destination must win even during that pending interval.
      await page.evaluate((id) => {
        const audit = window.__gatheringGuideAudit = { guideAt: 0, boardKeyAt: 0, menuAt: 0, boardMenuAt: 0, go: [] };
        document.addEventListener('click', (event) => {
          const button = event.target instanceof Element ? event.target.closest('button') : null;
          if (button?.dataset.testid === `gathering-guide-${id}`) {
            audit.guideAt = performance.now(); audit.boardKeyAt = 0; audit.menuAt = 0; audit.boardMenuAt = 0; audit.beforeInterruptGo = undefined; audit.beforeMenuSelectionGo = undefined; audit.go = [];
          }
          if (button?.classList.contains('l-world-menu-button')) audit.menuAt = performance.now();
          if (button?.dataset.testid === 'menu-board') audit.boardMenuAt = performance.now();
        }, true);
        window.addEventListener('keydown', (event) => { if (event.code === 'KeyB') audit.boardKeyAt = performance.now(); }, true);
        window.addEventListener('bumtadew:go', (event) => audit.go.push({ ...event.detail, at: performance.now() }));
      }, scheduledId);
      const browserWait = async (ms) => page.evaluate((ms) => new Promise((resolve) => setTimeout(resolve, ms)), ms);
      const boardWins = async (reason) => {
        await browserWait(1100);
        const commands = await page.evaluate(() => window.__gatheringGuideAudit.go);
        assert.ok(commands.length > 0 && commands.every((point) => Math.hypot(point.x - BOARD_FRONT.x, point.z - BOARD_FRONT.z) < 1), `${reason}: no stale market-gate command is dispatched`);
        // data-target-x/z describe the camera look-at, not the walking goal.
        // Observe the actual navigation commands and then the avatar arrival.
        const { x, z } = commands.at(-1), target = { x, z };
        await wait((point) => { const d = document.querySelector('[data-testid=village-3d]')?.dataset; return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - point.x, Number(d.avatarZ) - point.z) < 1; }, BOARD_FRONT, 120_000);
        assert.equal(selfArea(), 'village', `${reason}: the player walks to the board in the same area`);
        return { target, commands: commands.map(({ x, z }) => ({ x, z })), arrived: true };
      };
      // Observe ordering rather than click-to-key wall time: rendering the
      // closed dialog can delay the effect that starts the real guide timer.
      // The interrupt must precede its first go command. These DOM events use
      // the application's normal click/key paths.
      const interruptGuide = async (mode) => page.evaluate(async ([id, mode]) => {
        const tick = () => new Promise((resolve) => setTimeout(resolve, 25));
        document.querySelector(`[data-testid="gathering-guide-${id}"]`).click();
        await tick();
        if (document.querySelector('dialog[open]')) throw new Error('The gathering dialog must close before the interrupting action.');
        const audit = window.__gatheringGuideAudit;
        audit.beforeInterruptGo = audit.go.length;
        if (audit.beforeInterruptGo !== 0) throw new Error('The interrupt must occur before the first guide go command.');
        if (mode === 'keyboard') {
          document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', code: 'KeyB', bubbles: true, cancelable: true }));
          document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'b', code: 'KeyB', bubbles: true, cancelable: true }));
        } else {
          document.querySelector('.l-world-menu-button').click();
          for (let n = 0; !document.querySelector('[data-testid="village-menu"]'); n++) {
            if (n > 200) throw new Error('The mouse menu did not commit.');
            await tick();
          }
          if (mode === 'quick-menu') {
            await tick();
            audit.beforeMenuSelectionGo = audit.go.length;
            if (audit.beforeMenuSelectionGo !== 0) throw new Error('No guide go command may run before the quick menu selection.');
            document.querySelector('[data-testid="menu-board"]').click();
          }
        }
      }, [scheduledId, mode]);
      await openGatherings(); await interruptGuide('keyboard');
      const keyAudit = await page.evaluate(() => { const a = window.__gatheringGuideAudit; return { delayMs: Math.round(a.boardKeyAt - a.guideAt), beforeInterruptGo: a.beforeInterruptGo }; });
      assert.equal(keyAudit.beforeInterruptGo, 0, 'B interrupts before the first guide command');
      const keyboardOverride = { ...keyAudit, ...await boardWins('B shortcut') };
      console.log(`${view} actor ${actor}: guide-keyboard-override ${JSON.stringify(keyboardOverride)}`);
      await openGatherings(); await interruptGuide('quick-menu');
      const quickMenuAudit = await page.evaluate(() => { const a = window.__gatheringGuideAudit; return { delayMs: Math.round(a.boardMenuAt - a.guideAt), beforeInterruptGo: a.beforeInterruptGo, beforeMenuSelectionGo: a.beforeMenuSelectionGo }; });
      assert.equal(quickMenuAudit.beforeInterruptGo, 0); assert.equal(quickMenuAudit.beforeMenuSelectionGo, 0);
      const quickMouseMenuOverride = { ...quickMenuAudit, ...await boardWins('Quick mouse menu board') };
      console.log(`${view} actor ${actor}: guide-quick-menu-override ${JSON.stringify(quickMouseMenuOverride)}`);
      await openGatherings(); await interruptGuide('held-menu'); await page.getByTestId('village-menu').waitFor();
      const menuDelay = await page.evaluate(() => window.__gatheringGuideAudit.menuAt - window.__gatheringGuideAudit.guideAt);
      await browserWait(1100);
      assert.deepEqual(await page.evaluate(() => window.__gatheringGuideAudit.go), [], 'opening a modal cancels the pending guide without dispatching it');
      await page.getByTestId('menu-board').click();
      const mouseMenuOverride = { delayMs: Math.round(menuDelay), heldMenuMs: 1100, ...await boardWins('Mouse menu board') };
      console.log(`${view} actor ${actor}: guide-held-menu-override ${JSON.stringify(mouseMenuOverride)}`);
      await shot('board-directions-override');
      await openGatherings(); await page.getByTestId(`gathering-guide-${scheduledId}`).click(); await wait(() => !document.querySelector('dialog[open]'));
      const stage = async (area) => {
        const next = gatheringNavigation('bakery-meal', area); assert.notEqual(next.kind, 'unavailable');
        const selector = next.kind === 'interior' ? '[data-testid=interior-3d]' : area === 'village' ? '[data-testid=village-3d]' : '[data-testid=area-3d]';
        await wait(([selector, point, indoor]) => { const d = document.querySelector(selector)?.dataset; return d?.loadState === 'ready' && d.walking === 'false' && Math.hypot(Number(d.avatarX) - point.x, Number(indoor ? d.avatarY : d.avatarZ) - (indoor ? point.y : point.z)) < 1; }, [selector, next.point, next.kind === 'interior'], 150_000);
        assert.equal(selfArea(), area, 'the guide waits at the door for a user action');
        return { next, selector };
      };
      const first = await stage('village'); await page.locator(first.selector).focus(); await page.keyboard.press('KeyE');
      await wait(() => { const d = document.querySelector('[data-testid=area-3d]')?.dataset; return d?.area === 'market' && d.loadState === 'ready'; }, null, 180_000);
      const second = await stage('market'); await page.locator(second.selector).focus(); await page.keyboard.press('KeyE');
      await wait(() => { const d = document.querySelector('[data-testid=interior-3d]')?.dataset; return d?.area === 'bakery' && d.loadState === 'ready'; }, null, 180_000);
      await stage('bakery'); await shot('bakery-counter-directions');
      const guided = row.actions.slice(guideStart); const forbidden = new Set(['cast', 'anglerCast', 'eat', 'snack', 'shopFood', 'bakeryBuy', 'party', 'join', 'sit', 'start']);
      assert.deepEqual(guided.filter((a) => forbidden.has(a.kind)), [], 'directions never fish, eat, spend on food or reserve a seat');
      row.guideEvidence = { pond: true, bakery: true, keyboardOverride, quickMouseMenuOverride, mouseMenuOverride, explicitDoorActions: 2, actionKinds: [...new Set(guided.map((a) => a.kind))] };
      console.log(`${view} actor ${actor}: guide-door-continuation ${JSON.stringify({ pond: true, bakery: true, explicitDoorActions: 2, actionKinds: row.guideEvidence.actionKinds })}`);
    });
    await Promise.all(responseReads); row.pageErrors = [...H.errors]; row.blockedExternalHosts = [...H.external];
    assert.deepEqual(row.pageErrors, []); assert.deepEqual(row.consoleErrors, []); assert.deepEqual(row.failedResources, []); assert.deepEqual(row.apiFailures, []);
    row.status = 'passed';
  } catch (error) { row.status = 'failed'; row.error = error.stack ?? error.message; row.pageErrors = [...H.errors]; row.guideAudit = await page.evaluate(() => window.__gatheringGuideAudit ?? null).catch(() => null); await shot('failure').catch(() => {}); throw error; }
  finally { persist(); await H.close(); }
}
try { server = await serve(pages); browser = await launchBrowser(); for (let i = 0; i < actors.length; i++) await run(actors[i], views[i % views.length]); report.status = 'passed'; }
catch (error) { report.status = 'failed'; report.error = error.stack ?? error.message; process.exitCode = 1; console.error(error); }
finally { report.finishedAt = new Date(realNow()).toISOString(); persist(); await browser?.close().catch(() => {}); await server?.close(); Date.now = realNow; }
