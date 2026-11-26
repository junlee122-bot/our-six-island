// Local, isolated accounts only. Real components and cloudTransition handle
// every browser action; fixtures keep valid decks, reservations and match ids.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { launchBrowser, login, serve, setup, VIEWS } from './ui-harness.mjs';
import { measureInPage } from './ui-measure.mjs';
import { freshLounge } from '../app/lounge-look.ts';
import { DEFAULT_BED } from '../app/lounge-bedroom-data.ts';
import { GAME_KINDS, GAME_INFO, TABLE_AREA, tableIdOf } from '../app/lounge-games.ts';
import { validateLedger } from '../app/lounge-economy.ts';
import { newPoker, pokerView } from '../app/lounge-poker.ts';
import { newBlackjack } from '../app/lounge-blackjack.ts';
import { newSeotda, SEOTDA_CARDS, seotdaView } from '../app/lounge-seotda.ts';
import { newYacht, YACHT_CATEGORIES, yachtAuto, yachtTotals } from '../app/lounge-yacht.ts';
import { newLiar } from '../app/lounge-liar.ts';
import { newLiarsBar, lbTrue } from '../app/lounge-liarsbar.ts';
import { chessBoard } from '../app/lounge-chess.ts';
import { newGo, goAction, goPracticeAction, goView } from '../app/lounge-gostop.ts';
import { HWATU_CARDS } from '../app/hwatu-cards.ts';

const args = process.argv.slice(2), opt = (name, fallback) => { const i = args.indexOf('--' + name); return i < 0 ? fallback : args[i + 1]; };
const pages = path.resolve(opt('pages', '')), out = path.resolve(opt('out', '.ui-shots/minigames'));
const games = opt('games', GAME_KINDS.join(',')).split(','), views = opt('views', 's,fhd').split(',');
assert.ok(args.includes('--pages') && fs.existsSync(path.join(pages, 'index.html')), '--pages must name a completed local build');
assert.ok(games.length && games.every((g) => GAME_KINDS.includes(g)) && views.length && views.every((v) => VIEWS[v]));
if (!process.env.CHROMIUM_PATH && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) process.env.CHROMIUM_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(out, { recursive: true });
const report = { status: 'running', mockOnly: true, pages, games, views, startedAt: new Date().toISOString(), runs: [] };
const persist = () => {
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
  const rows = report.runs.flatMap((r) => r.screenshots.map((s) => [r.game, r.view, s.label, ...['lowCount', 'smallCount', 'cutCount', 'coveredCount', 'overlapCount', 'overflowX'].map((k) => s.metrics[k])]));
  fs.writeFileSync(path.join(out, 'metrics.csv'), ['game,view,stage,lowContrast,small,cut,covered,overlap,overflowX', ...rows.map((r) => r.join(','))].join('\n'));
};
const privateKey = (game) => game === 'gostop' ? 'go' : game;
const seededShuffle = (items, seed = 1) => { const a = [...items]; let x = seed; for (let i = a.length - 1; i > 0; i--) { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; const j = x % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const blackjackShoe = (n) => {
  const deck = Array.from({ length: 312 }, (_, i) => i), draws = [];
  for (const rank of [...Array(n).fill(8), 7, ...Array(n).fill(9), 7]) { const i = deck.findIndex((c) => c % 13 === rank); draws.push(deck.splice(i, 1)[0]); }
  return [...deck, ...draws.reverse()];
};
let browser, server;

async function run(game, view) {
  const row = { game, view, viewport: VIEWS[view], status: 'running', fixtures: [], steps: [], screenshots: [], uiFailures: [], actions: [], privacy: null, pageErrors: [], consoleErrors: [], failedResources: [], apiFailures: [], expectedRejections: [] };
  report.runs.push(row); persist();
  const H = await setup({ browser, base: server.url, actor: 3, view, seedSave: { ...freshLounge(3), bedroom: { version: 4, theme: 'friends', items: [{ ...DEFAULT_BED }] } } });
  const { page, ctx } = H, bodyReads = [];
  const state = () => Object.values(H.world().rooms).find((r) => r.leases[H.uid])?.snapshot;
  const match = () => state()?.[privateKey(game)];
  const mySeat = () => state().seats[game].indexOf(H.uid);
  const playerAt = (seat) => H.bots.find((p) => p.id === state().seats[game][seat]);
  let watching = false, watchView, latestView, clock, expectHintRefusal = false, freezeShot = false;
  let holdChat = false, holdHint = false;
  const gates = new Map();
  await ctx.route('**/functions/v1/hohyeon-api', async (route) => {
    const c = route.request().postDataJSON()?.command, a = c?.action;
    const tag = a?.kind === 'chat' && holdChat ? 'chat' : a?.kind === 'liar' && a.action?.kind === 'hint' && holdHint ? 'hint' : null;
    if (tag && !gates.has(tag)) {
      let release; const promise = new Promise((resolve) => { release = resolve; });
      gates.set(tag, { requestId: c.requestId, promise, release });
    }
    const gate = [...gates.values()].find((g) => g.requestId === c?.requestId && !g.released);
    if (gate) await gate.promise;
    return route.fallback();
  });
  const release = (tag) => { const g = gates.get(tag); if (g) { g.released = true; g.release(); } };
  await ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, quality: 'low', fpsCap: 30, dayNight: false })));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('console', (m) => { if (m.type() === 'error' && !(expectHintRefusal && m.location().url.includes('/functions/v1/') && /400|409/.test(m.text()))) row.consoleErrors.push(m.text().slice(0, 600)); });
  page.on('requestfailed', (r) => { if (r.url().startsWith(server.url) && r.failure()?.errorText !== 'net::ERR_ABORTED') row.failedResources.push({ path: r.url().replace(server.url, '/'), error: r.failure()?.errorText }); });
  page.on('request', (r) => { if (r.url().includes('/functions/v1/hohyeon-api')) { try { const c = r.postDataJSON()?.command; if (c?.action) row.actions.push({ requestId: c.requestId, sequence: c.sequence, ...c.action }); } catch {} } });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(server.url)) row.failedResources.push({ path: r.url().replace(server.url, '/'), status: r.status() });
    if (!r.url().includes('/functions/v1/hohyeon-api')) return;
    const a = r.request().postDataJSON()?.command?.action;
    bodyReads.push(r.json().then((b) => {
      if (b.packet?.[game]) latestView = b.packet[game];
      if (watching && b.packet?.[game]) watchView = b.packet[game];
      if (r.status() >= 400) {
        const expected = expectHintRefusal && a?.kind === 'liar' && a.action?.kind === 'hint' && /제시어/.test(b.error ?? '');
        (expected ? row.expectedRejections : row.apiFailures).push({ status: r.status(), action: a, error: b.error });
      }
    }).catch(() => {}));
  });
  const wait = async (fn, arg, ms = 30_000) => assert.notEqual(await H.until(fn, ms, arg), -1, 'UI wait: ' + fn.toString().slice(0, 180));
  const waitState = async (fn, message, ms = 30_000) => { const until = performance.now() + ms; while (!fn() && performance.now() < until) await H.sleep(100); assert.ok(fn(), message); };
  const step = async (label, fn) => { console.log(`${view} ${game}: ${label}`); const at = performance.now(); try { await fn(); row.steps.push({ label, pass: true, ms: Math.round(performance.now() - at) }); } catch (error) { row.steps.push({ label, pass: false, error: error.message }); throw error; } finally { persist(); } };
  const close = async () => { for (let i = 0; i < 7 && await page.locator('dialog[open]').count(); i++) { await page.keyboard.press('Escape'); await H.sleep(120); } };
  const pickTable = async (playing) => {
    await close(); await page.locator('.l-world-menu-button').click(); await page.getByTestId('menu-invite').click();
    const pick = page.getByTestId(`pick-${game}`); await pick.waitFor();
    await wait(([game, playing, required]) => {
      const s = document.querySelector(`[data-testid=pick-${game}]`)?.textContent ?? '';
      // A retained old result also contains a seat count. Wait for this new
      // forming invite, not any previous table's "다음 판 준비 · 2/2명".
      return playing ? s.includes('게임 중') : s.includes(`${required - 1}/${required}명`) && !s.includes('다음 판 준비');
    }, [game, playing, nFor(false)]);
    await pick.click(); await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
  };
  const action = async (p, a) => { const r = await H.run(p, 'action', { action: a }); assert.equal(r.ok, true, r.error); validateLedger(H.world().ledger); return r; };
  const nFor = (watch) => game === 'chess' ? 2 : game === 'gostop' ? 3 : game === 'liar' ? (watch ? 3 : 4) : watch ? 2 : 4;
  const start = async (watch) => {
    const n = nFor(watch), peers = H.bots.slice(0, watch ? n : n - 1), host = peers[0], invited = [...peers.slice(1).map((p) => p.id), ...(watch ? [] : [H.uid])];
    for (const p of peers) await action(p, { kind: 'area', area: TABLE_AREA[game] });
    await action(host, { kind: 'invite', game, players: invited, required: n, stake: game === 'liarsbar' && watch ? 1000 : GAME_INFO[game].stake, table: tableIdOf(game), ...(game === 'liar' || (game === 'liarsbar' && !watch) ? { party: true } : {}) });
    const invite = state().invites.findLast((i) => i.game === game && i.status === 'waiting'); assert.ok(invite);
    for (const p of peers.slice(1)) await action(p, { kind: 'reply', id: invite.id, accept: true });
    if (watch && game === 'blackjack') await replace(newBlackjack(match().id, match().hands.length, match().stake, blackjackShoe(match().hands.length), 0), 'The spectator opening uses a valid non-natural 312-card shoe so an automatic natural reveal cannot race entry.');
    if (watch && game === 'gostop') {
      let opening; for (let seed = 1; seed < 50; seed++) { const g = newGo(match().id, seededShuffle(HWATU_CARDS.map((c) => c.id), seed)); if (g.phase !== 'over') { opening = g; break; } }
      assert.ok(opening); await replace(opening, 'The spectator opening is a valid full deck without an immediate four-of-a-month finish.');
    }
    watching = watch; await pickTable(watch);
    if (!watch) { await page.getByTestId('table-sit').waitFor(); await page.getByTestId('table-sit').click(); }
    await page.locator(`.l-game-screen.${game}`).waitFor({ timeout: 90_000 });
    await page.locator({ yacht: '[data-testid=yacht-table]', liar: '[data-testid=liar-table]', liarsbar: '[data-testid=liarsbar-table]', chess: '.l-chessboard', gostop: '.g-game', poker: '.p-club', blackjack: '.bj-club', seotda: '.s-club' }[game]).waitFor({ timeout: 90_000 });
    if (watch) await waitState(() => !!watchView, 'a real server spectator view arrived');
    else await waitState(() => mySeat() >= 0, 'the browser really sat at the table');
    return peers;
  };
  const extendClock = () => {
    const s = state(), g = match(); if (!s || !g) return;
    const active = game === 'liarsbar' ? ['play', 'trigger'].includes(g.phase) : game === 'blackjack' ? g.phase === 'players' : true;
    if (active && s.deadlines?.[game]) s.deadlines[game].at = Date.now() + 10 * 60_000;
    if (freezeShot && game === 'liarsbar' && g.phase === 'shot' && s.due?.[game]) s.due[game].at = Date.now() + 10 * 60_000;
    if (s.tables?.[game]?.readyDeadline) s.tables[game].readyDeadline = Date.now() + 10 * 60_000;
  };
  const replace = async (g, note) => {
    const old = match(); assert.equal(g.id, old.id);
    if (game === 'gostop') g.stake = old.stake;
    if ('revision' in g) g.revision = old.revision + 10;
    state()[privateKey(game)] = g; row.fixtures.push(note);
    await H.run(H.bots[0], 'read'); extendClock();
    // The engine fixture and the browser's last rendered packet are separate.
    // Observe the real public response, then allow its React paint to commit.
    await waitState(() => latestView?.id === g.id && (game === 'chess' ? JSON.stringify(latestView.moves) === JSON.stringify(g.moves) : latestView.revision === g.revision), 'the browser receives this exact valid fixture before capture', 90_000);
    // The spectator opening is prepared before its GameScreen exists. Once
    // inside a table, require its actual rendered props as well as the packet.
    if (await page.locator(`.l-game-screen.${game}`).count()) {
      await wait(([game, id, revision]) => {
        const screen = document.querySelector(`.l-game-screen.${game}`);
        return screen?.getAttribute('data-match-id') === id && screen.getAttribute('data-match-revision') === String(revision);
      }, [game, g.id, game === 'chess' ? g.moves.length : g.revision], 90_000);
    }
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  const shot = async (label, strict = true, controls = false) => {
    await page.evaluate(() => document.fonts.ready);
    for (let i = 0; i < 8 && await page.locator('.l-banner-close').count(); i++) { await page.locator('.l-banner-close').first().click(); await H.sleep(80); }
    if (controls) { const c = page.locator('[data-table-controls]:visible').first(); if (await c.count()) await c.scrollIntoViewIfNeeded(); }
    const file = `${view}-${game}-${label}.png`; await page.screenshot({ path: path.join(out, file), timeout: 90_000 });
    const metrics = await page.evaluate(measureInPage); row.screenshots.push({ label, file, metrics }); persist();
    console.log(`MEASURE ${view}/${game}/${label}: low=${metrics.lowCount} small=${metrics.smallCount} cut=${metrics.cutCount} covered=${metrics.coveredCount} overlap=${metrics.overlapCount} overflow=${metrics.overflowX}`);
    // Collect every stage's unchanged thresholds, then fail the run at the end.
    // One low-contrast label must not hide later action/settlement regressions.
    if (strict) {
      for (const key of ['lowCount', 'smallCount', 'cutCount', 'coveredCount', 'overlapCount']) if (metrics[key] !== 0) row.uiFailures.push({ label, key, count: metrics[key], details: metrics });
      if (metrics.overflowX) row.uiFailures.push({ label, key: 'overflowX', count: 1 });
    }
  };
  const handPrivacy = (v) => {
    assert.ok(v);
    if (['poker', 'seotda', 'gostop'].includes(game)) { assert.deepEqual(v.hand, []); assert.equal('hands' in v, false); assert.equal('deck' in v, false); }
    if (game === 'liar') { assert.equal(v.role, 'watcher'); assert.equal(v.word, null); assert.equal(v.liar, null); assert.equal('votes' in v, false); }
    if (game === 'liarsbar') { assert.equal(v.role, 'watcher'); assert.equal(v.hand, null); assert.equal(v.chamber, null); assert.equal(v.salt, null); assert.equal('cards' in v, false); }
    if (game === 'blackjack') { assert.equal(v.dealer[1], null); assert.equal('deck' in v, false); }
    if (v.legal) assert.equal(v.legal.enabled, false);
  };
  try {
    await login(H, server.url); await page.locator('.l-world-menu-button').waitFor({ timeout: 180_000 });
    await waitState(() => !!state(), 'the synthetic browser account joined its authoritative room');
    await wait(() => { const p = document.querySelector('[data-testid=presence]'); return p && !p.classList.contains('is-offline'); });
    clock = setInterval(extendClock, 200); row.fixtures.push('Only the current match decision/ready deadlines are extended for captures. Fetch/action timeouts and browser clocks stay real.');
    await step('spectator-privacy-through-the-real-table-picker', async () => {
      const peers = await start(true); await page.getByTestId('game-live').filter({ hasText: '구경 중' }).waitFor(); handPrivacy(watchView); row.privacy = { role: 'spectator', verified: true };
      if (game === 'liarsbar') assert.equal(await page.locator('.lb-hand-wrap').count(), 0);
      if (game === 'liar') assert.equal(await page.getByTestId('liar-role').getAttribute('class').then((s) => s.includes('is-watcher')), true);
      await shot('spectator'); watching = false; await page.locator('.l-game-back').click();
      // Finish the spectator's separate match with legal synthetic-player
      // actions before inviting me. Standing up intentionally delegates some
      // games to the server; it does not make an active match disappear.
      for (let guard = 0; guard < 400; guard++) {
        const g = match(); if (game === 'chess' ? !!g.winner : g.phase === 'over') break;
        if (game === 'chess') { await action(peers[0], { kind: 'resign', id: g.id }); continue; }
        if (game === 'liarsbar') { await action(peers[0], { kind: 'stand', game, id: g.id }); continue; }
        if (game === 'blackjack' && g.phase !== 'players') { await waitState(() => match().phase === 'over', 'the spectator dealer really finishes', 90_000); continue; }
        let inner;
        if (game === 'yacht') inner = yachtAuto(g);
        else if (game === 'gostop') inner = goPracticeAction(goView(g, g.turn));
        else if (game === 'liar') {
          const s = g.phase === 'hint' ? g.turn : g.phase === 'discuss' ? g.ready.findIndex((r) => !r) : g.phase === 'vote' ? g.votes.findIndex((v) => v === null) : g.liar;
          inner = g.phase === 'hint' ? { kind: 'hint', text: '관전 힌트 481' } : g.phase === 'discuss' ? { kind: 'ready' } : g.phase === 'vote' ? { kind: 'vote', target: g.candidates.find((c) => c !== s) } : { kind: 'guess', word: g.word };
          await action(playerAt(s), { kind: game, id: g.id, revision: g.revision, action: inner }); continue;
        } else inner = { kind: game === 'blackjack' ? 'stand' : 'fold' };
        assert.ok(inner); await action(playerAt(g.turn), { kind: game, id: g.id, ...(game === 'gostop' ? { ply: g.ply } : { revision: g.revision }), action: inner });
      }
      assert.ok(game === 'chess' ? match().winner : match().phase === 'over', 'the old spectator match is settled before starting a new one');
      for (const p of peers) if (state().seats[game].includes(p.id)) await action(p, { kind: 'stand', game, id: match().id });
    });
    await step('join-a-real-reserved-table', async () => { await start(false); validateLedger(H.world().ledger); });
    const seat = mySeat();

    if (game === 'poker' || game === 'seotda') await step('bet-preview-validation-and-real-raise', async () => {
      const old = match(), deck = game === 'poker' ? Array.from({ length: 52 }, (_, i) => i) : [...SEOTDA_CARDS];
      await replace(game === 'poker' ? newPoker(old.id, old.initial, deck, (seat - 3 + old.initial.length) % old.initial.length, old.bigBlind) : newSeotda(old.id, old.stacks.length, old.buyIn, deck, seat), 'A valid full deck and existing buy-ins put my seat on a betting decision; ids and reservations stay unchanged.');
      const input = page.getByRole('spinbutton', { name: game === 'poker' ? /레이즈 총액|베팅 금액/ : '섯다 레이즈 총액' }), preview = page.getByTestId(`${game}-bet-preview`);
      await input.waitFor(); await wait(() => !!document.querySelector('input[type=number]:enabled'));
      const g = match(), legal = (game === 'poker' ? pokerView(g, seat) : seotdaView(g, seat)).legal;
      const raise = page.getByRole('button', { name: game === 'poker' && g.currentBet === 0 ? '베팅' : '레이즈', exact: true });
      for (const bad of ['0', '0.5']) { await input.fill(bad); assert.equal(await input.getAttribute('aria-invalid'), 'true'); assert.equal(await raise.isDisabled(), true); }
      await input.fill(String(legal.maxTo)); assert.match(await preview.innerText(), /올인/);
      await input.fill(String(legal.minTo)); const text = (await preview.innerText()).replace(/[,\s]/g, '');
      const extra = legal.minTo - g.bets[seat]; assert.ok(text.includes(`지금${extra}범추가`)); assert.ok(text.includes(`남을칩${g.stacks[seat] - extra}범`));
      await shot('bet-preview', true, true); const before = g.revision; await raise.click(); await waitState(() => match().revision > before, 'a real raise reaches the engine');
      while (match().phase !== 'over') { const p = playerAt(match().turn); assert.ok(p, 'only the other synthetic seats remain after my raise'); await action(p, { kind: game, id: match().id, revision: match().revision, action: { kind: 'fold' } }); }
      await wait(() => !!document.querySelector('.l-round-ready, [data-testid=round-ready], .p-result, .s-result')); await shot('result');
    });

    if (game === 'yacht') await step('choose-without-writing-then-confirm-zero-and-tied-results', async () => {
      const old = match(), g = newYacht(old.id, old.n, old.stake, seat); g.rolls = 1; g.dice = [1, 2, 3, 4, 6];
      await replace(g, 'A legal first roll without any fives makes the explicit zero-score decision reproducible.');
      await page.getByTestId('yacht-category-select').waitFor(); const before = match().revision;
      await page.getByTestId('yacht-category-select').selectOption('fives'); assert.equal(match().revision, before); assert.equal(match().sheet[seat][4], null);
      assert.match(await page.getByTestId('yacht-score-preview').innerText(), /0점으로 채우면/); await shot('zero-score-preview', true, true);
      await page.getByTestId('yacht-write').click(); await waitState(() => match().sheet[seat][4] === 0, 'zero is written only after explicit confirmation');
      const end = newYacht(match().id, match().n, match().stake, (seat + 1) % match().n); end.turn = seat; end.sheet = end.sheet.map(() => YACHT_CATEGORIES.map(() => 0)); end.sheet[0][11] = 50; end.sheet[1][10] = 30; end.sheet[2][10] = 30; end.sheet[seat][6] = null; end.rolls = 3; end.dice = [1, 1, 1, 1, 1]; end.round = 12; end.totals = end.sheet.map((r) => yachtTotals(r).total);
      await replace(end, 'The final legal category completes sheets with a tie below first place; the actual score action performs settlement.');
      await page.getByTestId('yacht-category-select').selectOption('choice'); await page.getByTestId('yacht-write').click(); await waitState(() => match().phase === 'over', 'the final score really ends and settles the match');
      await page.getByTestId('yacht-result').waitFor(); assert.equal(await page.locator('[data-testid=yacht-result] li > span').filter({ hasText: /^2위$/ }).count(), 2); await shot('result');
    });

    if (game === 'liar') await step('queued-sending-failed-draft-then-explicit-vote', async () => {
      await replace(newLiar(match().id, match().n, seat, match().totals, () => 0), 'My synthetic seat is a citizen with a legal hint turn; only the citizen view receives the word.');
      await page.getByTestId('liar-hint-input').waitFor(); const word = match().word; expectHintRefusal = true; holdChat = true; holdHint = true;
      await page.locator('.lg-chat').getByRole('textbox', { name: '채팅 메시지' }).fill('격리된 검증 대기열'); await page.locator('.lg-chat').getByRole('button', { name: '보내기', exact: true }).click();
      await waitState(() => gates.has('chat'), 'the preceding real chat occupies the normal request queue');
      await page.getByTestId('liar-hint-input').fill(word); await page.getByTestId('liar-hint-send').click();
      await wait(() => document.querySelector('[data-testid=table-response]')?.getAttribute('data-state') === 'queued'); release('chat');
      await waitState(() => gates.has('hint'), 'the real hint starts after chat'); await wait(() => document.querySelector('[data-testid=table-response]')?.getAttribute('data-state') === 'sending');
      assert.equal(await page.getByTestId('liar-hint-input').isDisabled(), true); release('hint'); holdChat = false; holdHint = false;
      await wait(() => document.querySelector('[data-testid=table-response]')?.getAttribute('data-state') === 'failed'); assert.equal(await page.getByTestId('liar-hint-input').inputValue(), word); await shot('rejected-hint-keeps-draft', true, true);
      expectHintRefusal = false; await page.getByTestId('liar-hint-input').fill('힌트 927'); await page.getByTestId('liar-hint-send').click(); await waitState(() => match().hints[seat] === '힌트 927', 'the corrected hint is submitted');
      while (match().phase === 'hint') await action(playerAt(match().turn), { kind: 'liar', id: match().id, revision: match().revision, action: { kind: 'hint', text: '다른 힌트 481' } });
      for (let i = 0; i < match().n; i++) if (i !== seat) await action(playerAt(i), { kind: 'liar', id: match().id, revision: match().revision, action: { kind: 'ready' } });
      await page.getByTestId('liar-ready').waitFor(); await page.getByTestId('liar-ready').click(); await page.getByTestId('liar-vote-0').waitFor();
      await page.getByTestId('liar-vote-0').click(); assert.equal(match().votes[seat], null); assert.equal(await page.getByTestId('liar-vote-0').getAttribute('aria-pressed'), 'true'); await shot('vote-selection', true, true);
      await page.getByTestId('liar-vote-confirm').click(); await waitState(() => match().votes[seat] === 0, 'vote is sent only after explicit confirmation');
      for (let i = 0; i < match().n; i++) if (i !== seat) await action(playerAt(i), { kind: 'liar', id: match().id, revision: match().revision, action: { kind: 'vote', target: i === 0 ? 1 : 0 } });
      assert.equal(match().phase, 'guess'); await action(playerAt(0), { kind: 'liar', id: match().id, revision: match().revision, action: { kind: 'guess', word } });
      await page.getByTestId('liar-reveal').waitFor(); await shot('result');
    });

    if (game === 'liarsbar') await step('selection-claim-call-context-and-real-trigger', async () => {
      const old = match(), previous = (seat - 1 + old.n) % old.n, g = newLiarsBar(old.id, old.n, old.stake, previous, old.totals, () => 0);
      const id = g.hands[previous][0], donor = g.cards.findIndex((f) => lbTrue(f, g.table)); [g.cards[id], g.cards[donor]] = [g.cards[donor], g.cards[id]];
      await replace(g, 'A full valid deck permutation gives the preceding player one matching card; chamber commitments and stakes are unchanged by play.');
      await action(playerAt(previous), { kind: 'liarsbar', id: match().id, revision: match().revision, action: { kind: 'play', ids: [id] } });
      await page.getByTestId('liarsbar-call-context').waitFor(); assert.match(await page.getByTestId('liarsbar-call-context').innerText(), /직전 1장/);
      await page.getByTestId('liarsbar-card-0').focus(); await page.keyboard.press('Digit1'); assert.equal(await page.getByTestId('liarsbar-card-0').getAttribute('aria-pressed'), 'true'); assert.match(await page.getByTestId('liarsbar-turn-help').innerText(), /일치 .*다른 카드/); await shot('claim-and-call-context', true, true);
      await page.keyboard.press('Escape'); assert.equal(await page.getByTestId('liarsbar-card-0').getAttribute('aria-pressed'), 'false'); await page.getByTestId('liarsbar-call').click(); await waitState(() => match().phase === 'reveal', 'the real call opens the matching-card reveal');
      await page.getByTestId('liarsbar-trigger').waitFor({ timeout: 30_000 }); assert.equal(match().shooter, seat); await shot('trigger', true, true); freezeShot = true; await page.getByTestId('liarsbar-trigger').click(); await waitState(() => !!match().lastShot, 'the committed real chamber decides the trigger');
      extendClock(); row.fixtures.push('Only this match shot-result display deadline is extended for the screenshot; real trigger transport and chamber outcome are unchanged.');
      await wait(() => document.querySelector('[data-testid=liarsbar-table]')?.getAttribute('data-phase') === 'shot');
      await shot('shot-result');
    });

    if (game === 'blackjack') await step('public-hand-private-hole-and-real-stand', async () => {
      const old = match(), g = newBlackjack(old.id, old.hands.length, old.stake, blackjackShoe(old.hands.length), seat);
      assert.equal(g.phase, 'players'); await replace(g, 'A valid 312-card shoe avoids natural blackjack and puts my hand on a standing decision.');
      const stand = page.getByRole('button', { name: /스탠드.*이대로 승부/ }); await stand.waitFor();
      await wait(() => document.querySelector('.bj-action-buttons')?.getAttribute('aria-disabled') === 'false' && document.querySelector('.bj-turn > strong')?.textContent === '내 차례');
      await shot('stand-decision', true, true); const rev = match().revision; await stand.click(); await waitState(() => match().revision > rev, 'the browser stand reaches the engine');
      while (match().phase === 'players') await action(playerAt(match().turn), { kind: 'blackjack', id: match().id, revision: match().revision, action: { kind: 'stand' } });
      await waitState(() => match().phase === 'over', 'the server dealer reveals and settles', 90_000); await shot('result');
    });

    if (game === 'chess') await step('checked-king-roving-keyboard-and-legal-escape', async () => {
      assert.equal(seat, 1, 'the second invited seat plays black'); await replace({ ...match(), moves: ['e2e4', 'f7f6', 'd1h5'], winner: null, reason: '' }, 'Three legal opening moves produce Qh5+ with my black king in check.');
      const king = page.getByRole('button', { name: /^e8 흑 킹 · 체크$/ }); await king.waitFor(); assert.equal(await page.locator('.l-chessboard button[tabindex="0"]').count(), 1); await shot('checked-king', true, true);
      await page.getByRole('button', { name: /^e7 / }).focus(); await page.keyboard.press('ArrowRight'); assert.match(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), /^d7 /);
      await page.getByRole('button', { name: /^g7 / }).focus(); await page.keyboard.press('Enter'); await page.keyboard.press('ArrowUp'); assert.match(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), /^g6 /); await page.keyboard.press('Enter');
      await waitState(() => match().moves.length === 4, 'a keyboard g7-g6 move reaches the engine'); assert.equal(chessBoard(match()).isCheck(), false); await shot('keyboard-move');
      await action(playerAt(0), { kind: 'resign', id: match().id }); await waitState(() => !!match().winner, 'the real resignation ends the match'); await shot('result');
    });

    if (game === 'gostop') await step('legal-decision-fixture-and-real-stop', async () => {
      let decision;
      for (let seed = 1; seed < 80 && !decision; seed++) {
        let g = newGo(match().id, seededShuffle(HWATU_CARDS.map((c) => c.id), seed), seat);
        for (let i = 0; i < 300 && g.phase !== 'over'; i++) { if (g.phase === 'decide' && g.turn === seat) { decision = g; break; } const a = g.phase === 'decide' ? { kind: 'go' } : goPracticeAction(goView(g, g.turn)); const next = goAction(g, g.turn, a); if (!next) break; g = next; }
      }
      assert.ok(decision); await replace(decision, 'A complete valid 48-card deck is played with the real pure engine until my legal Go/Stop decision; no captured card is fabricated.');
      await wait(() => !!document.querySelector('.l-go-decision')); assert.match(await page.locator('.l-hand-title span').innerText(), /고 또는 스톱/); await shot('go-stop-decision', true, true);
      await page.locator('.l-go-decision').getByRole('button', { name: /^스톱/ }).click(); await waitState(() => match().phase === 'over', 'the real Stop action settles the engine'); await wait(() => !!document.querySelector('.l-go-result')); await shot('result');
    });
    await Promise.all(bodyReads); validateLedger(H.world().ledger); row.pageErrors = [...H.errors];
    assert.deepEqual(row.pageErrors, []); assert.deepEqual(row.consoleErrors, []); assert.deepEqual(row.failedResources, []); assert.deepEqual(row.apiFailures, []); assert.equal(row.uiFailures.length, 0, 'UI thresholds: ' + JSON.stringify(row.uiFailures.map(({ label, key, count }) => ({ label, key, count })))); row.status = 'passed';
  } catch (error) { row.status = 'failed'; row.error = error.stack ?? error.message; row.pageErrors = [...H.errors]; await shot('failure', false).catch(() => {}); }
  finally { clearInterval(clock); for (const tag of gates.keys()) release(tag); persist(); await H.close(); }
}
try { server = await serve(pages); browser = await launchBrowser(); for (const view of views) for (const game of games) await run(game, view); report.status = report.runs.every((r) => r.status === 'passed') ? 'passed' : 'failed'; if (report.status !== 'passed') process.exitCode = 1; }
catch (error) { report.status = 'failed'; report.error = error.stack ?? error.message; process.exitCode = 1; }
finally { report.finishedAt = new Date().toISOString(); persist(); console.log(JSON.stringify({ status: report.status, runs: report.runs.map((r) => ({ game: r.game, view: r.view, status: r.status, steps: r.steps.length, captures: r.screenshots.length, error: r.error })) }, null, 2)); await browser?.close().catch(() => {}); await server?.close(); }
