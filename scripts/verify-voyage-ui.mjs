// Browser check for the 먼바다 낚싯배 boarding edge (design-sea-fishing.md):
// boarding at the harbor's 출항 안내판 just before a departure, with the
// player's clock running ahead of or behind the server's, ends on the deck;
// a tap after the departure says the boat left (and never moves the player to
// the next boat).
//   node --experimental-strip-types --no-warnings scripts/verify-voyage-ui.mjs --pages <build> [--out .ui-shots/voyage] [--cases a,b]
// Uses the real cloud engine behind ui-harness's local request interception.
// The player clicks and walks; only the fixture is seeded (the harbor flag,
// 낚시 Lv4, a calm day) and, between cases, the one-voyage-a-day mark is
// cleared so the next case can board again. The clock is moved (server and
// page together) to just before a departure so a case never waits long.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { launchBrowser, login, serve, setup } from './ui-harness.mjs';
import { HARBOR_VOYAGE } from '../app/lounge-harbor-layout.ts';
import { VOYAGE_FARE, sailingsOf, gameDayOf } from '../app/lounge-voyage-data.ts';
import { gameTimeAt, gameDay, weatherOf } from '../app/lounge-calendar.ts';
import { grantBeom, kstDay } from '../app/lounge-economy.ts';

const args = process.argv.slice(2);
const opt = (key, fallback) => {
  const i = args.indexOf('--' + key);
  return i < 0 ? fallback : args[i + 1];
};
const pages = opt('pages', '');
if (!pages || !fs.existsSync(path.join(pages, 'index.html'))) throw new Error('Pass --pages with an existing Pages build; this script never builds or deploys.');
const out = path.resolve(opt('out', '.ui-shots/voyage'));
fs.mkdirSync(out, { recursive: true });

// Where the board button is pressed, by the player's clock (ms from the
// departure), and how far that clock is off the server's (+ ahead, − behind).
const CASES = [
  { id: 'early-60s', at: -60_000, skew: 0, boards: true },
  { id: 'late-5s-ahead', at: -5_000, skew: 3_000, boards: true },
  { id: 'last-half-second', at: -500, skew: 0, boards: true },
  { id: 'last-half-second-behind', at: -500, skew: -3_000, boards: true },
  { id: 'last-half-second-ahead', at: -500, skew: 3_000, boards: true },
  { id: 'after-departure', at: 500, skew: 0, boards: false },
  { id: 'after-departure-behind', at: 500, skew: -3_000, boards: false },
  { id: 'after-grace', at: 6_000, skew: 0, boards: false },
];
const pick = opt('cases', '') ? new Set(opt('cases', '').split(',')) : null;
const cases = CASES.filter((c) => !pick || pick.has(c.id));

// The clock: a calm day (no 결항), game 07:00 to start. Moved together on both sides.
const realNow = Date.now;
let day = kstDay(realNow());
while (weatherOf(day) === 'storm') day++;
let shift = gameTimeAt(gameDay(realNow() + (day - kstDay(realNow())) * 86_400_000), 7) - realNow();
Date.now = () => realNow() + shift;
let skew = 0;

const report = { createdAt: new Date(realNow()).toISOString(), build: path.resolve(pages), cases: [], failures: [] };
const persist = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
const log = (...a) => console.log(new Date(realNow()).toISOString().slice(11, 19), ...a);

const server = await serve(pages);
const browser = await launchBrowser();
let H;
try {
  H = await setup({
    browser,
    base: server.url,
    view: 's',
    serverSkew: () => skew,
    seedLife: (life, uid) => {
      life.flags = [...new Set([...(life.flags ?? []), 'district-harbor'])];
      const u = (((life.growth ??= {}).u ??= {})[uid] ??= {});
      u.xp = { ...u.xp, fish: 600 };
    },
  });
  const { page, ctx, js, sleep, until } = H;
  // Enough 범 for a fare every case (a grant, so the ledger stays balanced).
  {
    const w = H.world();
    w.ledger = grantBeom(w.ledger, `wallet-${H.uid}`, cases.length * VOYAGE_FARE, 'fixture-voyage-fares', Date.now(), 'test-fixture');
  }
  await ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, fpsCap: 30, quality: 'low' })));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Wall time only (native timers and animation frames stay intact): the same shift as the mock server.
  await ctx.addInitScript((s) => {
    const real = Date.now;
    window.__voyageShift = s;
    Date.now = () => real() + window.__voyageShift;
  }, shift);
  // What the server answered to each boarding (evidence for the report).
  const answers = [];
  page.on('response', (r) => {
    if (!r.url().includes('/functions/v1/hohyeon-api')) return;
    let kind;
    try {
      kind = JSON.parse(r.request().postData() || '{}').command?.action?.kind;
    } catch {}
    if (kind === 'voyageBoard') r.json().then((b) => answers.push({ at: Date.now(), ok: b.ok, error: b.error ?? null })).catch(() => {});
  });
  const jump = async (ms) => {
    shift += ms;
    await js((s) => (window.__voyageShift = s), shift);
  };
  const wait = async (fn, arg, ms = 30_000, what = fn.toString().slice(0, 120)) => assert.notEqual(await until(fn, ms, arg), -1, `timed out: ${what}`);
  const area = () => js(() => document.querySelector('[data-testid=area-3d]')?.dataset.area ?? '');
  const shot = (name) => page.screenshot({ path: path.join(out, `${name}.png`), timeout: 90_000 }).catch(() => {});
  const me = () => H.world().life.voyage?.u?.[H.uid];

  await login(H, server.url);
  // Login opens in my room (or on the farm or the hub): out to the hub, then 가게 안내 → 항구 가기 travels straight to the harbor.
  const loaded = (sels) => sels.some((s) => document.querySelector(s)?.getAttribute('data-load-state') === 'ready');
  await wait(loaded, ['[data-testid=bedroom-3d]', '[data-testid=village-3d]', '[data-testid=area-3d]'], 900_000, 'first scene loaded');
  await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
  if (!(await js(() => !!document.querySelector('[data-testid=area-3d]')))) {
    // My room: Esc → 마을로 나가기 opens on 우리 농장 (outdoors, where travel is a fade away).
    await sleep(1_500);
    await js(() => document.querySelector('[data-testid=bedroom-3d], [data-testid=village-3d]')?.focus({ preventScroll: true }));
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /마을로 나가기/ }).first().click();
    await wait(loaded, ['[data-testid=area-3d]'], 600_000, 'farm loaded');
    await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
  }
  await page.locator('.l-world-menu-button').click();
  await page.getByRole('button', { name: /가게 안내/ }).first().click();
  await page.locator('li', { hasText: '항구' }).getByRole('button', { name: '가기' }).first().click();
  await wait(() => {
    const d = document.querySelector('[data-testid=area-3d]')?.dataset;
    return d?.area === 'harbor' && d.loadState === 'ready';
  }, null, 600_000, 'harbor loaded');
  await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
  log('at the harbor');

  const toBoard = async () => {
    await js(() => document.querySelector('[data-testid=area-3d]')?.focus({ preventScroll: true }));
    await js((p) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: p })), HARBOR_VOYAGE.stand);
    await wait((q) => {
      const d = document.querySelector('[data-testid=area-3d]')?.dataset;
      return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - q.x, Number(d.avatarZ) - q.z) < 1;
    }, HARBOR_VOYAGE.stand, 300_000, 'walked to the board');
    await js(() => document.querySelector('[data-testid=area-3d]')?.focus({ preventScroll: true }));
    await page.keyboard.press('KeyE');
    await wait(() => !!document.querySelector('[data-testid=voyage-board]'), null, 15_000, 'board window open');
  };

  for (const c of cases) {
    const res = { ...c, pass: false };
    report.cases.push(res);
    try {
      log('case', c.id);
      // A fresh day for this case (the fixture's one-voyage mark), the skew for this case.
      if (H.world().life.voyage?.u) delete H.world().life.voyage.u[H.uid];
      skew = c.skew;
      assert.ok((H.world().ledger.accounts[`wallet-${H.uid}`] ?? 0) >= VOYAGE_FARE, 'enough 범 for the fare');
      // Game 08:00–09:00's boats of the current game day: jump to 14 s before the press.
      if (!(await js(() => !!document.querySelector('[data-testid=voyage-board]')))) await toBoard();
      const now = Date.now();
      const deps = sailingsOf(gameDayOf(now)).filter((t) => t >= gameTimeAt(gameDayOf(now), 8));
      const dep = deps.find((t) => t + c.at - c.skew - 14_000 > now) ?? deps[0];
      await jump(dep + c.at - c.skew - 14_000 - Date.now());
      // Fresh polls carry the skewed clock before the press.
      await sleep(Math.max(0, dep + c.at - c.skew - Date.now() - 2_000));
      const shown = await js(() => document.querySelector('[data-testid=voyage-next]')?.innerText ?? '');
      res.boardBefore = shown;
      while (Date.now() < dep + c.at - c.skew) await sleep(20);
      const pressAt = Date.now();
      const btn = page.getByTestId('voyage-board');
      const enabled = await btn.isEnabled().catch(() => false);
      res.enabled = enabled;
      answers.length = 0;
      // A real mouse click on the button (Playwright's stability wait can stall on the busy WebGL page).
      if (enabled && !(await H.clickSel('[data-testid=voyage-board]'))) res.clickError = 'board button not found';
      res.pressedAt = pressAt - dep;
      for (let i = 0; i < 40 && enabled && !answers.length; i++) await sleep(100);
      res.server = answers[0] ?? null;
      log('  pressed', res.pressedAt, 'ms; server:', JSON.stringify(res.server), res.clickError ?? '');
      // After departure the board may not have redrawn yet (it ticks every 250 ms): a tap that
      // still reached the server inside the grace window seats me on that same boat. Either
      // way, never on the next boat, and never in silence.
      const seated = !!res.server?.ok || !!me()?.trip;
      res.outcome = seated ? 'boarded' : 'missed';
      if (c.boards || seated) {
        if (c.boards) assert.ok(enabled, `the board button is enabled at ${c.at} ms (skew ${c.skew})`);
        await wait(() => !!document.querySelector('[data-testid=voyage-aboard]') || !!document.querySelector('[data-testid=voyage-sailout]') || document.querySelector('[data-testid=area-3d]')?.dataset.area === 'offshore', null, 8_000, 'boarded');
        const trip = me()?.trip;
        assert.ok(trip, 'the server holds my trip');
        assert.equal(trip.dep, dep, 'on the boat the board showed, not the next one');
        // Until departure the board keeps my boat (never the next one).
        if (Date.now() < dep - 1_500) {
          const text = await js(() => document.querySelector('[data-testid=voyage-aboard]')?.innerText ?? '');
          assert.match(text, /자리를 잡았어요/);
        }
        // The boat leaves: the board steps aside and the sail-out takes me to the deck.
        await wait(() => {
          const d = document.querySelector('[data-testid=area-3d]')?.dataset;
          return d?.area === 'offshore' && d.loadState === 'ready';
        }, null, 120_000, 'carried out to the offshore deck');
        await wait(() => !!document.querySelector('[data-testid=voyage-hud]'), null, 15_000, 'voyage HUD');
        res.deckAfter = Date.now() - dep;
        const onDeck = () => Object.values(H.world().rooms).some((r) => r.snapshot.players.some((p) => p.id === H.uid && p.area === 'offshore'));
        for (let i = 0; i < 50 && !onDeck(); i++) await sleep(100);
        assert.ok(onDeck(), 'the server has me on the deck');
        await shot(`${c.id}-deck`);
        // Back to the pier for the next case: 그만 돌아가기, then the catch summary.
        await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
        assert.ok(await H.clickSel('[data-testid=voyage-leave]'), '그만 돌아가기');
        await wait(() => !!document.querySelector('[data-testid=voyage-done]'), null, 120_000, 'catch summary');
        assert.ok(await H.clickSel('[data-testid=voyage-done]'), '닫기');
        await wait(() => document.querySelector('[data-testid=area-3d]')?.dataset.area === 'harbor', null, 60_000, 'back on the pier');
        await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
        // Already sailed today: the board says why the button is off.
        if (c === cases.find((x) => x.boards)) {
          await toBoard();
          const why = await js(() => document.querySelector('[data-testid=voyage-why]')?.innerText ?? '');
          assert.match(why, /하루에 한 번/);
          assert.equal(await page.getByTestId('voyage-board').isEnabled(), false);
        }
      } else {
        // Too late: the button is off (or the server said so) and the board says the boat just left and when the next boards.
        await sleep(400);
        const why = await js(() => document.querySelector('[data-testid=voyage-why]')?.innerText ?? '');
        res.why = why;
        if (enabled) assert.match(res.server?.error ?? '', /방금 떠났어요/, 'the server says the boat left');
        assert.equal(await page.getByTestId('voyage-board').isEnabled(), false, 'the board button is off after departure');
        assert.match(why, /방금 떠났어요/);
        assert.match(why, /다음 배는 .*부터/);
        assert.equal(me()?.trip, undefined, 'not put on any boat');
        assert.equal(await area(), 'harbor');
        await shot(`${c.id}-missed`);
      }
      res.pass = true;
      log('PASS', c.id, JSON.stringify({ outcome: res.outcome, boardBefore: res.boardBefore, deckAfter: res.deckAfter, why: res.why }));
    } catch (e) {
      res.error = e.message;
      report.failures.push(`${c.id}: ${e.message}`);
      log('FAIL', c.id, e.message);
      await shot(`${c.id}-failed`);
      // Recover for the next case: windows closed, off the deck, the summary closed.
      for (let i = 0; i < 3 && (await js(() => !!document.querySelector('dialog[open]'))); i++) {
        if (await js(() => !!document.querySelector('[data-testid=voyage-done]'))) await H.clickSel('[data-testid=voyage-done]');
        else await page.keyboard.press('Escape').catch(() => {});
        await sleep(400);
      }
      if (me()?.trip && Date.now() < me().trip.dep + 20_000) await until(() => document.querySelector('[data-testid=area-3d]')?.dataset.area === 'offshore', Math.max(0, me().trip.dep + 20_000 - Date.now()));
      if ((await area()) === 'offshore') {
        await H.clickSel('[data-testid=voyage-leave]');
        if ((await until(() => !!document.querySelector('[data-testid=voyage-done]'), 60_000)) >= 0) await H.clickSel('[data-testid=voyage-done]');
        await until(() => document.querySelector('[data-testid=area-3d]')?.dataset.area === 'harbor', 60_000);
      }
    } finally {
      persist();
    }
  }
  report.errors = H.errors;
  report.external = [...H.external];
} catch (e) {
  report.failures.push(`setup: ${e.message}`);
  await H?.page.screenshot({ path: path.join(out, 'setup-failed.png'), timeout: 60_000 }).catch(() => {});
  console.error(e);
} finally {
  report.status = report.failures.length ? 'failed' : 'passed';
  persist();
  await H?.close();
  await browser.close();
  server.close();
}
console.log(report.status, `${report.cases.filter((c) => c.pass).length}/${report.cases.length}`);
if (report.failures.length) {
  for (const f of report.failures) console.error(' -', f);
  process.exit(1);
}
