// UI screenshot + readability regression check (mock cloud, never real Supabase).
//
//   npm run ui:shots                               # build to a temp dir, all 3 views
//   npm run ui:shots -- --pages /tmp/pages         # reuse an existing Pages build
//   npm run ui:shots -- --views s --only friends,map
//   npm run ui:shots -- --baseline .ui-shots/before/report.json [--strict]
//   npm run ui:shots -- --games                    # also casino/hall table screens
//   npm run ui:shots -- --low-graphics             # software GPU: low quality, 30 FPS
//   npm run ui:shots -- --fishing-fight            # also the reel fight (needs a fast mock round trip)
//   npm run ui:shots -- --stage3                   # also ④ 목장·과수원 and ⑤ 산기슭 마을 (opened in the mock world)
//   npm run ui:shots -- --furniture-room --views fhd   # only a furnished room (painted furniture next to 3D pieces) and its catalog
//
// For each key screen at 1920×1080 (fhd), 1440×900 (d) and 1280×720 (s) it saves
// a PNG and measures, inside the top dialog (or the whole HUD when none is open):
//   low       text below WCAG AA contrast (4.5:1, 3:1 for large text)
//   small     text rendered below 12px
//   narrow    text broken into a column of 1–2 characters per line
//   cut       text cut off by the viewport or a non-scrolling clipping box
//   overlaps  floating HUD boxes that cover each other
//   close     size of the dialog's close (×) button (target: 44×44)
// and writes <out>/report.json. With --baseline it prints before/after numbers
// and (with --strict) exits 1 when any count got worse or a capture is missing.
// Needs playwright-core (devDependency) and a Chromium (CHROMIUM_PATH or
// playwright's default install).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchBrowser, login, serve, setup, VIEWS } from './ui-harness.mjs';
import { measureInPage } from './ui-measure.mjs';
import { verifyMeasurements } from './ui-measure-fixtures.mjs';
import { reportFailures, UI_METRICS } from './ui-report.mjs';
import { kstDay } from '../app/lounge-economy.ts';
import { freshLounge } from '../app/lounge-look.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes('--' + name);
const label = opt('label', 'current');
const out = path.resolve(opt('out', path.join(root, '.ui-shots', label)));
const views = opt('views', 'fhd,d,s').split(',').filter((v) => VIEWS[v]);
const only = opt('only', '')
  .split(',')
  .filter(Boolean);
const baselineFile = opt('baseline', '');
// --games adds the table screens (casino blackjack, hall seotda): slower, the
// avatar walks to each venue.
const withGames = flag('games');
const lowGraphics = flag('low-graphics');
// --write-baseline <file>: keep only the per-screen counts (the CI baseline).
const writeBaseline = opt('write-baseline', '');
fs.mkdirSync(out, { recursive: true });

let pages = opt('pages', '');
if (!pages) {
  pages = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-shots-pages-'));
  console.log('building Pages into', pages);
  execFileSync(process.execPath, ['scripts/build-standalone.mjs', '--out', pages, '--site-url', '/'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, VITE_UI_KIT: '1' },
  });
}

// ---- screens ------------------------------------------------------------------
const DAY = 86_400_000;
function seedLife(life, uid) {
  const now = Date.now();
  const day = kstDay(now);
  const g = (life.growth ??= {});
  const u = (g.u ??= {});
  u[uid] = { xp: { farm: 590, fish: 410, forage: 230, mine: 158, craft: 170 }, day, dxp: { farm: 120, fish: 64, forage: 25 }, rest: { fish: 200, craft: 100 }, seen: day, retro: now - 3 * DAY, rocks: 7 };
  for (const [id, actor] of Object.entries(life.actors ?? {}))
    if (id !== uid) u[id] = { xp: { farm: 1500 + actor * 120, fish: 700, forage: 400, mine: 100, craft: 300 }, retro: now - 4 * DAY, prof: ['farm-a'] };
  const x = ((life.ext ??= {})[uid] ??= {});
  x.inv = { ...(x.inv ?? {}), wood: 48, stone: 30, copper: 6, pinecone: 4, crucian: 1, azalea: 2, wildflower: 2, bait: 4, 'bait-dough': 6, crabpot: 1 };
  g.r = { forge: { got: 92_000, mat: { wood: 70, stone: 45 }, by: { 0: 2, 6: 1 }, start: now - 2 * DAY } };
  life.bonds = { ...(life.bonds ?? {}), '2-3': 1_180, '1-3': 700, '0-3': 260, '3-6': 90 };
  // 텃밭 확장: a sprinkler and a scarecrow on the grid, two machines at work,
  // a few artisan goods and a filled shipping bin (farm window tabs).
  (life.farmx ??= {})[uid] = {
    fx: { 1: { k: 'sprinkler', at: now - DAY }, 4: { k: 'scarecrow', at: now - DAY } },
    mach: {
      0: { k: 'jar', out: 'jar-cabbage', q: 2, n: 1, at: now - 3_600_000, done: now + 5 * 3_600_000 },
      1: { k: 'keg', out: 'keg-grape', n: 1, at: now - DAY, done: now - 60_000 },
      2: { k: 'dehydrator' },
    },
    goods: { 'jar-strawberry': 2, 'keg-grape@1': 1, 'honey-zinnia': 3 },
    bin: { day, items: { carrot: 6, 'tomato@2': 2 } },
    st: day,
    log: [{ kind: 'guard', at: now - 7 * 3_600_000 }, { kind: 'ship', at: now - 8 * 3_600_000, n: 9, beom: 4_320 }],
  };
  // 우리 농장 F3: a machine yard (tier 2), a greenhouse being funded, the
  // shared field half tilled with carrots, a little in the shared store.
  life.flags = [...new Set([...(life.flags ?? []), 'greenhouse'])];
  life.farm = {
    sites: {
      M1: { kind: 'machineYard', tier: 2, owner: 'shared', state: {}, paid: { 3: { wood: 60, stone: 40 } } },
      L1: { kind: 'greenhouse', tier: 0, owner: 'shared', state: {}, fund: { to: 1, got: 42_000, mat: { wood: 60 }, by: { 3: 2, 1: 1 } } },
      // 우리 농장 F5: my 양식장 on my second personal site, three carp and something to collect.
      Q3: { kind: 'fishPond', tier: 1, owner: uid, state: { pond: { f: 'carp', n: 3, g: day - 1, o: ['carp', 'roe'] } }, paid: { 3: { stone: 80, wood: 30 } } },
    },
    till: Array.from({ length: 18 }, (_, i) => i),
    field: Object.fromEntries(Array.from({ length: 6 }, (_, i) => [String(i), { crop: 'carrot', plantedAt: now - 3_600_000, wateredAt: now - 3_000_000 }])),
    store: { tomato: 4, 'carrot@1': 3 },
    d: day,
    gm: now - DAY,
  };
  // 내 취향: mine (changeable today) and two friends'; the rest read as not chosen yet.
  const me = life.actors?.[uid];
  life.tastes = { ...(life.tastes ?? {}) };
  if (me !== undefined) life.tastes[me] = { l: ['crucian', '#dish', 'strawberry'], d: ['#bug', 'mugwort'], n: '달달한 건 뭐든 좋아요', day: day - 1 };
  for (const a of [0, 1, 2, 3, 4, 5, 6].filter((a) => a !== me).slice(0, 2))
    life.tastes[a] = { l: ['#fish', 'carp'], d: ['#flower'], ...(a % 2 ? {} : { n: '큰 물고기 환영!' }), day: day - 2 };
  // --stage3: the two stage-3 districts are open (design-npcs-stage3.md).
  if (flag('stage3')) life.flags = [...new Set([...(life.flags ?? []), 'district-ranch', 'district-foothill'])];
}

async function runView(browser, base, view, report) {
  const H = await setup({ browser, base, view, seedLife });
  const { page, js, sleep, until } = H;
  const res = (report.views[view] = { screens: {}, notes: [] });
  if (lowGraphics) {
    // Use the game's supported settings, preserving its real buildings and UI.
    // Opt-in only: standard baseline runs keep their existing graphics preset.
    await H.ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, fpsCap: 30, quality: 'low' })));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    res.renderSettings = { fpsCap: 30, quality: 'low', reducedMotion: true };
  }
  const want = (n) => !only.length || only.includes(n);
  const dlg = () => js(() => [...document.querySelectorAll('dialog[open]')].length);
  const closeAll = async () => {
    for (let i = 0; i < 5 && (await dlg()); i++) {
      await page.keyboard.press('Escape');
      await sleep(400);
    }
  };
  const focusScene = async () => {
    await js(() => document.querySelector('[data-testid=village-3d], [data-testid=bedroom-3d], [data-testid=interior-3d]')?.focus({ preventScroll: true }));
    await sleep(200);
  };
  const snap = async (name, extra = {}) => {
    await js(() => document.fonts.ready);
    await sleep(450);
    const file = `${view}-${name}.png`;
    await page.screenshot({ path: path.join(out, file), timeout: 90000 }).catch((e) => res.notes.push(`shot ${name}: ${e.message.slice(0, 80)}`));
    const m = await js(measureInPage).catch((e) => ({ err: e.message }));
    res.screens[name] = { file, ...m, ...extra };
    const d = m.dialog;
    console.log(`  ${view} ${name.padEnd(16)} low ${m.lowCount} small ${m.smallCount} narrow ${m.narrowCount} cut ${m.cutCount} overlap ${m.overlapCount} covered ${m.coveredCount}${d?.close ? ` close ${d.close.w}x${d.close.h}` : ''}`);
  };
  const step = async (name, fn) => {
    if (!want(name)) return;
    try {
      await fn();
    } catch (e) {
      const message = `${name}: ${e.stack || e.message || String(e)}`;
      res.notes.push(message);
      console.error(`  ${view} ${message}`);
      const failureFile = `${view}-${name}-failed.png`;
      try {
        await page.screenshot({ path: path.join(out, failureFile), timeout: 90000 });
        (res.failedScreens ??= {})[name] = failureFile;
      } catch (shotError) {
        res.notes.push(`${name}: failure screenshot: ${shotError.message}`);
        console.error(`  ${view} ${name}: failure screenshot: ${shotError.message}`);
      }
    }
    await closeAll();
  };
  const menu = async (re) => {
    await closeAll();
    await H.clickSel('[aria-label="마을 메뉴"]');
    await sleep(600);
    const ok = await H.clickText(re, 'dialog[open] button');
    await sleep(900);
    return ok;
  };
  // 우리 농장: out a district (the farm, where my room's door opens) by its road home.
  const leaveDistrict = async () => {
    const area = await js(() => document.querySelector('[data-testid=area-3d]')?.dataset.area ?? '');
    if (!area) return;
    const exits = { farm: { x: 0, z: 30 }, market: { x: -26, z: -3 } };
    const at = exits[area];
    if (!at) return;
    await closeAll();
    await js((p) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: p })), at);
    await until((p) => {
      const d = document.querySelector('[data-testid=area-3d]')?.dataset;
      return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - p.x, Number(d.avatarZ) - p.z) < 1;
    }, 120000, at);
    await js(() => document.querySelector('[data-testid=area-3d]')?.focus({ preventScroll: true }));
    await page.keyboard.press('KeyE');
    await until(() => !document.querySelector('[data-testid=area-3d]'), 30000);
  };
  const returnToVillage = async () => {
    await leaveDistrict();
    for (let i = 0; i < 4 && (await js(() => document.querySelector('main.l-app')?.dataset.space)) !== 'village'; i++) {
      await closeAll();
      await focusScene();
      await page.keyboard.press('Escape');
      await sleep(700);
      if (!(await H.clickText(/마을로 나가기/, 'dialog[open] button'))) { await closeAll(); await H.clickText(/^나가기/); }
      await until(() => document.querySelector('main.l-app')?.dataset.space === 'village', 20000);
    }
    assert.notEqual(await until(() => {
      const s = document.querySelector('[data-testid=village-3d]')?.getAttribute('data-load-state');
      return !!s && s !== 'loading';
    }, 180000), -1, '마을로 돌아오지 못했습니다.');
    await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
    await sleep(1500);
    await closeAll();
  };

  await page.goto(base);
  await page.waitForSelector('.l-auth-card', { timeout: 90000 });
  await sleep(800);
  await step('login', () => snap('login'));
  await login(H, base);
  await until(() => !!document.querySelector('.l-world-header'), 60000);
  await until(() => { const s = document.querySelector('[data-testid=bedroom-3d]')?.getAttribute('data-load-state'); return !!s && s !== 'loading'; }, 180000);
  await sleep(2000);
  await closeAll();
  await step('room', () => snap('room'));
  await step('menu', async () => { await H.clickSel('[aria-label="마을 메뉴"]'); await sleep(700); await snap('menu'); });
  await step('esc-menu', async () => { await focusScene(); await page.keyboard.press('Escape'); await sleep(600); await snap('esc-menu'); });
  await step('room-editor', async () => {
    await H.clickText(/^꾸미기/);
    await until(() => !!document.querySelector('[data-testid=room-done]'), 10000);
    await sleep(1500);
    await snap('room-editor');
    // Esc should leave decorate mode (P0-5).
    await js(() => document.activeElement?.blur());
    await page.keyboard.press('Escape');
    await sleep(900);
    const exited = await js(() => !document.querySelector('[data-testid=room-done]'));
    res.screens['room-editor'].escExits = exited;
    if (!exited) { await H.clickSel('[data-testid=room-done]'); await sleep(1500); }
  });
  await step('wallet', async () => { await H.clickSel('[aria-label^="내 범 지갑"]'); await sleep(800); await snap('wallet'); });
  await step('settings', async () => { await menu(/^설정$/); await snap('settings'); });
  await step('controls', async () => { await focusScene(); await page.keyboard.press('F1'); await sleep(800); await snap('controls'); });
  await step('credits', async () => { await menu(/만든 이야기/); await snap('credits'); });
  await step('friends', async () => { await menu(/마을 친구들/); await snap('friends'); });
  await step('invite', async () => { await menu(/게임 초대/); await snap('invite'); });

  // New resident services use the same visible menu and tabs as a player.
  // Each step reopens independently so --only bank-notes (etc.) also works.
  // Viewing these pages does not deposit, borrow, rob, gift or invite anyone.
  for (const [name, title] of [
    ['bank', '보관함'], ['bank-notes', '차용증'],
  ]) {
    await step(name, async () => {
      if (!(await menu(/^은행 · 차용증$/))) throw new Error('은행 메뉴를 찾지 못했습니다.');
      await until(() => !!document.querySelector('dialog[open] .l-finance-balances'), 15000);
      assert.deepEqual(await page.locator('dialog[open] [role="tab"]').allTextContents(), ['보관함', '차용증'], '은행에는 보관함과 차용증만 표시합니다.');
      if (!(await H.clickText(new RegExp(`^${title}$`), 'dialog[open] [role="tab"]'))) throw new Error(`${title} 탭을 찾지 못했습니다.`);
      await until((text) => document.querySelector('dialog[open] [role="tab"][aria-selected="true"]')?.textContent.trim() === text, 10000, title);
      if (name === 'bank' || name === 'bank-notes') {
        const loaded = await until(() => {
          const img = document.querySelector('[data-testid=bank-clerk] img');
          return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
        }, 15000);
        if (loaded < 0) throw new Error('은행원 나모의 그림을 불러오지 못했습니다.');
        assert.equal(await page.getByTestId('bank-clerk').getAttribute('data-portrait'), 'sprite');
      }
      await snap(name);
      if (name === 'bank') {
        const toggle = page.getByTestId('bank-clerk-portrait-toggle');
        assert.equal((await toggle.textContent()).trim(), '잠깐 창구 아래로 와보세요');
        await toggle.click();
        assert.notEqual(await until(() => {
          const clerk = document.querySelector('[data-testid=bank-clerk]');
          const img = clerk?.querySelector('img');
          return clerk?.getAttribute('data-portrait') === 'photo' && img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
        }, 15000), -1, '은행원 나모의 사진을 불러오지 못했습니다.');
        assert.equal((await toggle.textContent()).trim(), '창구로 돌아가기');
        assert.match(await page.getByTestId('bank-clerk').locator('p').innerText(), /오랜만에 왔네, 자기/);
        await snap('bank-portrait');
        for (const metric of UI_METRICS) assert.equal(res.screens['bank-portrait'][metric], 0, `bank-portrait: ${metric}`);
        await toggle.click();
        assert.notEqual(await until(() => {
          const clerk = document.querySelector('[data-testid=bank-clerk]');
          const img = clerk?.querySelector('img');
          return clerk?.getAttribute('data-portrait') === 'sprite' && img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
        }, 15000), -1, '은행원 나모의 창구 모습으로 돌아오지 못했습니다.');
        assert.equal((await toggle.textContent()).trim(), '잠깐 창구 아래로 와보세요');
        assert.doesNotMatch(await page.getByTestId('bank-clerk').locator('p').innerText(), /자기/);
      }
    });
  }
  await step('npc', async () => {
    if (!(await menu(/^주민 수첩$/))) throw new Error('주민 수첩 메뉴를 찾지 못했습니다.');
    await until(() => !!document.querySelector('dialog[open] [data-testid="npc-lumi"]') && !!document.querySelector('dialog[open] [data-testid="npc-maehwa"]'), 15000);
    await snap('npc');
  });

  // 우리 농장: out of my room I stand in front of my own house on the farm.
  await step('farm', async () => {
    await closeAll();
    await focusScene();
    await page.keyboard.press('Escape');
    await sleep(700);
    if (!(await H.clickText(/마을로 나가기/, 'dialog[open] button'))) { await closeAll(); await H.clickText(/^나가기/); }
    assert.notEqual(await until(() => {
      const d = document.querySelector('[data-testid=area-3d]')?.dataset;
      return d?.area === 'farm' && d.loadState === 'ready';
    }, 180000), -1, '우리 농장을 불러오지 못했습니다.');
    await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
    await sleep(6000);
    await snap('farm');
    const pins = await js(() => [...document.querySelectorAll('[data-minimap-area="farm"] [data-minimap-place]')].map((e) => e.getAttribute('data-minimap-place')));
    for (const id of ['home-0', 'home-3', 'bin', 'board', 'common', 'exit-village'])
      assert.ok(pins.includes(id), `우리 농장 미니맵에 ${id} 자리가 없습니다.`);
  });
  // 우리 농장 F3: the 공동 밭 window (E on the shared field).
  await step('farm-sites', async () => {
    await closeAll();
    const at = { x: -13.6, z: 7 };
    await js((p) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: p })), at);
    assert.notEqual(await until((p) => {
      const d = document.querySelector('[data-testid=area-3d]')?.dataset;
      return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - p.x, Number(d.avatarZ) - p.z) < 1;
    }, 120000, at), -1, '공동 밭까지 걷지 못했습니다.');
    await js(() => document.querySelector('[data-testid=area-3d]')?.focus({ preventScroll: true }));
    await page.keyboard.press('KeyE');
    assert.notEqual(await until(() => !!document.querySelector('dialog[open] [data-testid=common-goal]'), 15000), -1, '공동 밭 창이 열리지 않았습니다.');
    await sleep(600);
    await snap('farm-sites');
  });

  // 우리 농장 F5: my 양식장 (E on my second personal site).
  await step('farm-pond', async () => {
    await closeAll();
    const at = { x: 17.1, z: -5.3 };
    await js((p) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: p })), at);
    assert.notEqual(await until((p) => {
      const d = document.querySelector('[data-testid=area-3d]')?.dataset;
      return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - p.x, Number(d.avatarZ) - p.z) < 1;
    }, 120000, at), -1, '양식장까지 걷지 못했습니다.');
    await js(() => document.querySelector('[data-testid=area-3d]')?.focus({ preventScroll: true }));
    await page.keyboard.press('KeyE');
    assert.notEqual(await until(() => !!document.querySelector('dialog[open] [data-testid=pond]'), 15000), -1, '양식장 창이 열리지 않았습니다.');
    await sleep(600);
    await snap('farm-pond');
  });

  // village
  await returnToVillage();
  await step('village', () => snap('village'));
  await step('map', async () => { await focusScene(); await page.keyboard.press('KeyM'); await sleep(1000); await snap('map'); await focusScene(); await page.keyboard.press('KeyM'); await sleep(400); });
  await step('bag', async () => { await focusScene(); await page.keyboard.press('KeyI'); await sleep(1000); await snap('bag'); });
  await step('shop', async () => { await menu(/가게 안내/); await snap('shop'); });
  await step('ledger', async () => { await menu(/내 텃밭/); await snap('ledger'); });
  // 텃밭 확장 tabs of the same window.
  for (const [name, tab] of [['farm-layout', /밭 배치/], ['farm-works', /^가공/], ['farm-market', /출하·품평회/]])
    await step(name, async () => {
      await menu(/내 텃밭/);
      if (!(await H.clickText(tab, 'dialog[open] [role=tab]'))) throw new Error(`텃밭 탭을 찾지 못했습니다: ${tab}`);
      await sleep(700);
      await snap(name);
    });
  await step('growth', async () => {
    await focusScene();
    await page.keyboard.press('KeyT');
    await until(() => !!document.querySelector('[data-testid=growth-panel]'), 8000);
    await sleep(800);
    await snap('growth');
    await page.keyboard.press('Digit3');
    await sleep(1000);
    await snap('growth-research');
  });
  await step('bonds', async () => { await focusScene(); await page.keyboard.press('KeyL'); await sleep(1000); await snap('bonds'); });
  // 내 취향 (☰ → 내 취향): my slots, the searchable picker, the next-change line.
  await step('tastes', async () => {
    if (!(await menu(/내 취향/))) throw new Error('메뉴에서 내 취향을 찾지 못했습니다.');
    assert.notEqual(await until(() => !!document.querySelector('[data-testid=tastes-window]'), 8000), -1, '내 취향 창이 열리지 않았습니다.');
    await sleep(600);
    await snap('tastes');
  });
  await step('collection', async () => { await focusScene(); await page.keyboard.press('KeyK'); await sleep(1000); await snap('collection'); });
  // A walk across the hub (bumtadew:go, Shift held). A walk that stops short
  // (the avatar has not moved for `stallMs`) or runs past `maxMs` fails with
  // what kept it: where the avatar stands, the scene's state, an open panel
  // or dialog, focus. The step's catch saves the failure screenshot.
  const walkTo = async (goal, what, { stallMs = 45000, maxMs = 180000 } = {}) => {
    const state = (g) => {
      const host = document.querySelector('[data-testid=village-3d]');
      const d = host?.dataset ?? {};
      return {
        arrived: d.walking === 'false' && Math.hypot(Number(d.avatarX) - g.x, Number(d.avatarZ) - g.z) < 1.2,
        space: document.querySelector('main.l-app')?.dataset.space,
        avatar: d.avatarX ? `${d.avatarX},${d.avatarZ}` : null,
        walking: d.walking,
        load: host?.getAttribute('data-load-state') ?? null,
        fishing: document.querySelector('[data-testid=fishing]')?.getAttribute('data-phase') ?? null,
        dialogs: [...document.querySelectorAll('dialog[open]')].map((e) => e.getAttribute('aria-label') || e.className).join(' | '),
        area: document.querySelector('[data-testid=area-3d]')?.dataset.area ?? null,
        focus: document.activeElement?.getAttribute('data-testid') || document.activeElement?.tagName,
      };
    };
    await js((g) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: g })), goal);
    await page.keyboard.down('Shift');
    try {
      const start = Date.now();
      let at = null,
        movedAt = start;
      for (;;) {
        const s = await H.jsWithin(state, goal);
        if (s.arrived) return;
        const now = Date.now();
        if (s.avatar !== at) [at, movedAt] = [s.avatar, now];
        if (now - movedAt > stallMs || now - start > maxMs) {
          const why = now - movedAt > stallMs ? `${Math.round((now - movedAt) / 1000)}초째 제자리` : `${Math.round((now - start) / 1000)}초 안에 닿지 못함`;
          const { arrived, ...rest } = s;
          throw new Error(`${what} (${goal.x}, ${goal.z}): ${why} ${JSON.stringify(rest)}`);
        }
        await sleep(500);
      }
    } finally {
      await page.keyboard.up('Shift');
    }
  };
  // 낚시 업그레이드: the tackle board, the 낚시 수첩 and the reel fight at the river.
  const phase = () => js(() => document.querySelector('[data-testid=fishing]')?.getAttribute('data-phase') ?? '');
  const openFishing = async () => {
    await closeAll();
    if (await js(() => !!document.querySelector('[data-testid=fishing]'))) return;
    // On a slow software GPU (1–2 fps) a click can land while a lazily loaded
    // window or the directory is still settling and do nothing: retry until
    // the walk has actually started.
    let started = false;
    for (let i = 0; i < 4 && !started; i++) {
      await closeAll();
      if (!(await page.locator('.hv-directory').count())) {
        await H.clickSel('.hv-top-tools button');
        await until(() => !!document.querySelector('.hv-directory [data-district="fish-river"]'), 15000);
      }
      await sleep(500);
      await H.clickSel('.hv-directory [data-district="fish-river"]');
      started = (await until(() => {
        const d = document.querySelector('[data-testid=village-3d]')?.dataset;
        return d?.walking === 'true' || d?.fishSpot === 'river';
      }, 20000)) !== -1;
    }
    assert.ok(started, '강 낚시터로 출발하지 못했습니다(마을 안내 클릭이 먹지 않음).');
    await focusScene();
    await page.keyboard.down('Shift');
    try {
      assert.notEqual(await until(() => {
        const d = document.querySelector('[data-testid=village-3d]')?.dataset;
        return d?.fishSpot === 'river' && d.walking === 'false';
        // From 우리 농장's side of the hub the river walk runs ~110 s at fhd and close to 180 s at s.
      }, 300000), -1, '강 낚시터까지 걷지 못했습니다.');
    } finally { await page.keyboard.up('Shift'); }
    await H.clickSel('[data-testid=action-button].hv-action');
    assert.notEqual(await until(() => !!document.querySelector('[data-testid=fishing]'), 20000), -1, '낚시 창이 열리지 않았습니다.');
  };
  await step('fishing', async () => {
    await openFishing();
    await until(() => ['wait', 'bite'].includes(document.querySelector('[data-testid=fishing]')?.getAttribute('data-phase')), 20000);
    await snap('fishing');
  });
  await step('fishing-journal', async () => {
    await openFishing();
    await H.clickSel('[data-testid=fish-journal-open]');
    assert.notEqual(await until(() => !!document.querySelector('dialog[open] [data-testid=fj-detail]'), 15000), -1, '낚시 수첩이 열리지 않았습니다.');
    await snap('fishing-journal');
    await page.keyboard.press('Digit3');
    await sleep(600);
    await snap('fishing-cup');
    await page.keyboard.press('Escape');
    await sleep(500);
    // The fishing panel is not a <dialog>, so closeAll leaves it open and the
    // next walk (시장 거리) would never start: Esc again closes it.
    await closeAll();
    for (let i = 0; i < 3 && (await js(() => !!document.querySelector('[data-testid=fishing]'))); i++) {
      await page.keyboard.press('Escape');
      await until(() => !document.querySelector('[data-testid=fishing]'), 10000);
    }
    // While it is up the village ignores bumtadew:go, so the walk below could never start.
    assert.ok(!(await js(() => !!document.querySelector('[data-testid=fishing]'))), `낚시 창이 닫히지 않았습니다 (${await phase()}).`);
  });
  // The fight needs a quick hook reply; under a software GPU the mock round
  // trip can outlast the bite window, so this capture is opt-in (--fishing-fight).
  if (flag('fishing-fight')) await step('fishing-fight', async () => {
    await openFishing();
    let fighting = false;
    for (let i = 0; i < 4 && !fighting; i++) {
      if ((await phase()) === 'result') { await H.clickSel('[data-testid=fish-again]'); await sleep(500); }
      if (await until(() => document.querySelector('[data-testid=fishing]')?.getAttribute('data-phase') === 'bite', 30000) < 0) continue;
      await page.keyboard.press('Space');
      fighting = (await until(() => document.querySelector('[data-testid=fishing]')?.getAttribute('data-phase') === 'fight', 15000)) >= 0;
    }
    assert.ok(fighting, '손맛 겨루기가 시작되지 않았습니다.');
    await page.keyboard.down('Space');
    await sleep(500);
    await page.keyboard.up('Space');
    await snap('fishing-fight');
    await page.keyboard.press('Escape');
    await until(() => !document.querySelector('[data-testid=fishing]'), 20000);
  });

  // 시장 거리 (stage 1 district): walk to the east gate, go through, open the request board.
  await step('market', async () => {
    try {
      await closeAll();
      await focusScene();
      await walkTo({ x: 53.6, z: -5 }, '시장 거리 입구까지 걷지 못했습니다');
      await focusScene();
      await page.keyboard.press('KeyE');
      assert.notEqual(await until(() => {
        const d = document.querySelector('[data-testid=area-3d]')?.dataset;
        return d?.area === 'market' && d.loadState === 'ready';
      }, 180000), -1, '시장 거리를 불러오지 못했습니다.');
      await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
      await sleep(6000);
      await snap('market');
      // The district's own minimap: its shops, the board and the road home; a click walks to the board.
      const pins = await js(() => [...document.querySelectorAll('[data-minimap-area="market"] [data-minimap-place]')].map((e) => e.getAttribute('data-minimap-place')));
      for (const id of ['coop', 'general', 'bakery', 'newspaper', 'post', 'police', 'board', 'exit-village'])
        assert.ok(pins.includes(id), `시장 거리 미니맵에 ${id} 자리가 없습니다.`);
      await page.locator('[data-minimap-area="market"] [data-minimap-place="board"]').click({ timeout: 60000 });
      assert.notEqual(await until(() => {
        const d = document.querySelector('[data-testid=area-3d]')?.dataset;
        return d?.walking === 'false' && Math.hypot(Number(d.avatarX), Number(d.avatarZ) - 1.6) < 1;
      }, 120000), -1, '의뢰 게시판까지 걷지 못했습니다.');
      await js(() => document.querySelector('[data-testid=area-3d]')?.focus({ preventScroll: true }));
      await page.keyboard.press('KeyE');
      await until(() => !!document.querySelector('dialog[open] .l-npc-requests, dialog[open] .ui-empty'), 15000);
      await sleep(800);
      await snap('npc-requests');
    } finally {
      // Back along the 큰길 (the market is outside the village tab's own Esc flow).
      await closeAll();
      if (await js(() => !!document.querySelector('[data-testid=area-3d]'))) {
        await js(() => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: { x: -26, z: -3 } })));
        await until(() => {
          const d = document.querySelector('[data-testid=area-3d]')?.dataset;
          return d?.walking === 'false' && Math.hypot(Number(d.avatarX) + 26, Number(d.avatarZ) + 3) < 1;
        }, 120000);
        await js(() => document.querySelector('[data-testid=area-3d]')?.focus({ preventScroll: true }));
        await page.keyboard.press('KeyE');
        await until(() => {
          const s = document.querySelector('[data-testid=village-3d]')?.getAttribute('data-load-state');
          return !!s && s !== 'loading';
        }, 180000);
        await sleep(1500);
      }
      await returnToVillage();
    }
  });

  // 3단계 (--stage3): through the 들길 to 목장·과수원 and the 산길 to 산기슭 마을, a capture of each and its minimap pins.
  if (flag('stage3'))
    for (const { area, gate, home, pins } of [
      { area: 'ranch', gate: { x: 40, z: -42 }, home: { x: -12, z: 23 }, pins: ['barn', 'orchardShop', 'exit-village'] },
      { area: 'foothill', gate: { x: -20, z: -42 }, home: { x: 0, z: 20 }, pins: ['smithy', 'clinic', 'fortune', 'exit-mine', 'exit-village'] },
    ])
      await step(area, async () => {
        try {
          await closeAll();
          await focusScene();
          await walkTo(gate, `${area} 입구까지 걷지 못했습니다`, { maxMs: 300000 });
          await focusScene();
          await page.keyboard.press('KeyE');
          assert.notEqual(await until((a) => {
            const d = document.querySelector('[data-testid=area-3d]')?.dataset;
            return d?.area === a && d.loadState === 'ready';
          }, 180000, area), -1, `${area}를 불러오지 못했습니다.`);
          await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
          await sleep(6000);
          await snap(area);
          const have = await js((a) => [...document.querySelectorAll(`[data-minimap-area="${a}"] [data-minimap-place]`)].map((e) => e.getAttribute('data-minimap-place')), area);
          for (const id of pins) assert.ok(have.includes(id), `${area} 미니맵에 ${id} 자리가 없습니다.`);
        } finally {
          await closeAll();
          if (await js(() => !!document.querySelector('[data-testid=area-3d]'))) {
            await js((h) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: h })), home);
            await until((h) => {
              const d = document.querySelector('[data-testid=area-3d]')?.dataset;
              return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - h.x, Number(d.avatarZ) - h.z) < 1;
            }, 120000, home);
            await js(() => document.querySelector('[data-testid=area-3d]')?.focus({ preventScroll: true }));
            await page.keyboard.press('KeyE');
            await until(() => {
              const s = document.querySelector('[data-testid=village-3d]')?.getAttribute('data-load-state');
              return !!s && s !== 'loading';
            }, 180000);
            await sleep(1500);
          }
          await returnToVillage();
        }
      });

  // Historical baseline names are retained, but each service now has its own
  // visible entry point. These are read-only captures, never robbery/loan actions.
  await step('bank-rob', async () => {
    if (!(await menu(/마을 친구들/))) throw new Error('마을 친구들 메뉴를 찾지 못했습니다.');
    // Software WebGL can delay actionability; retain the normal hit-target and
    // visibility checks instead of force-clicking a potentially covered button.
    await page.getByTestId('friends-robbery-button').click({ timeout: 60000 });
    const dialog = page.getByRole('dialog', { name: '강도·방범', exact: true });
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await dialog.getByRole('tab').count(), 0, '강도·방범은 은행 탭과 분리됩니다.');
    assert.equal(await dialog.getByTestId('bank-clerk').count(), 0);
    await snap('bank-rob');
  });
  await step('bank-casino', async () => {
    try {
      await closeAll();
      if (!(await page.locator('#hv-minimap-body').count())) await page.getByTestId('minimap-toggle').click();
      await page.locator('[data-minimap-place="casino"]').click({ timeout: 60000 });
      await focusScene(); await page.keyboard.down('Shift');
      try {
        assert.notEqual(await until(() => {
          const d = document.querySelector('[data-testid=village-3d]')?.dataset;
          return d?.nearbyPlace === 'casino' && d.walking === 'false';
        }, 180000), -1, '카지노 입구까지 걷지 못했습니다.');
      } finally { await page.keyboard.up('Shift'); }
      await page.keyboard.press('KeyE');
      assert.notEqual(await until(() => {
        const d = document.querySelector('[data-testid=interior-3d]')?.dataset;
        return d?.area === 'casino' && d.loadState === 'ready';
      }, 180000), -1, '카지노 실내를 불러오지 못했습니다.');
      assert.notEqual(await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000), -1, '카지노 입장 효과가 끝나지 않았습니다.');
      await page.getByTestId('casino-lumi-ledger').click();
      const dialog = page.getByRole('dialog', { name: '미쿠의 카지노 장부', exact: true });
      await dialog.waitFor({ state: 'visible' });
      assert.equal(await dialog.getByRole('tab').count(), 0, '미쿠 장부는 은행 탭과 분리됩니다.');
      assert.equal(await dialog.getByTestId('bank-clerk').count(), 0);
      await snap('bank-casino');
    } finally { await returnToVillage(); }
  });

  // Game tables: walk in, a bot opens the table, sit, capture the game screen.
  if (withGames) {
    const STAKE = { blackjack: 1000, seotda: 10000 };
    const PLACE = { casino: '별빛 카지노', lounge: '범마을 회관' };
    for (const [game, area] of [['blackjack', 'casino'], ['seotda', 'lounge']]) {
      await step('game-' + game, async () => {
        for (const b of H.bots) await H.run(b, 'action', { action: { kind: 'area', area } }).catch(() => {});
        await focusScene();
        await page.keyboard.press('KeyM');
        await sleep(700);
        await H.clickText(new RegExp(PLACE[area]), '.hv-directory button');
        await until((a) => { const d = document.querySelector('[data-testid=village-3d]')?.dataset; return d?.nearbyPlace === a && d?.walking === 'false'; }, 180000, area === 'casino' ? 'casino' : 'hall');
        await page.keyboard.press('KeyE');
        await until(() => document.querySelector('[data-testid=interior-3d]')?.dataset.loadState === 'ready', 60000);
        await sleep(2500);
        const host = H.bots[0];
        await H.run(host, 'action', { action: { kind: 'invite', game, players: [], stake: STAKE[game], required: 2, table: `${area}-${game}` } });
        await sleep(1200);
        await H.clickSel(`[data-testid=interior-table-${game}]`);
        await until((g) => { const d = document.querySelector('[data-testid=interior-3d]')?.dataset; return (d?.action === 'table:' + g && d?.walking === 'false') || !!document.querySelector('[data-testid=table-sheet]'); }, 60000, game);
        if (!(await js(() => !!document.querySelector('[data-testid=table-sheet]')))) {
          await page.keyboard.press('KeyE');
          await until(() => !!document.querySelector('[data-testid=table-sheet]'), 8000);
        }
        await sleep(600);
        // Interior frame cost (lounge-interior-3d.tsx dataset) next to the sheet.
        const cost = await js(() => {
          const d = document.querySelector('[data-testid=interior-3d]')?.dataset;
          return { drawCalls: Number(d?.drawCalls ?? NaN), triangles: Number(d?.triangles ?? NaN) };
        });
        await snap('sheet-' + game, cost);
        await H.clickSel('[data-testid=table-sit]');
        await until(() => !!document.querySelector('.l-game-screen'), 30000);
        await sleep(2500);
        await snap('game-' + game);
        // 규칙·기록 window (TableGuide.tsx), then back to the table.
        if (await js(() => !!document.querySelector('[data-testid=game-guide]'))) {
          await H.clickSel('[data-testid=game-guide]');
          await until(() => !!document.querySelector('dialog[open].l-table-guide'), 15000);
          await sleep(500);
          await snap('guide-' + game);
          await page.keyboard.press('Escape');
          await sleep(500);
        }
        // back to the village for the next venue
        await page.keyboard.press('Escape');
        await sleep(700);
        await H.clickText(/일어나기/, 'dialog[open] button');
        await sleep(1500);
        await closeAll();
        await focusScene();
        await page.keyboard.press('Escape');
        await sleep(700);
        await H.clickText(/마을로|나가기/, 'dialog[open] button');
        await until(() => document.querySelector('main.l-app')?.dataset.space === 'village', 30000);
        await sleep(2500);
      });
    }
  }

  // Primitives page (only in builds made with VITE_UI_KIT=1).
  await step('ui-kit', async () => {
    await page.goto(base + '?ui-kit');
    if ((await until(() => !!document.querySelector('[data-testid=ui-kit]'), 8000)) < 0) return;
    await snap('ui-kit');
    await page.keyboard.press('Digit2');
    await sleep(300);
    await snap('ui-kit-panels');
    await page.keyboard.press('Digit3');
    await sleep(300);
    await snap('ui-kit-glyphs');
  });
  res.errors = H.errors.slice(0, 10);
  res.external = [...H.external];
  await H.close();
}

// ---- furnished room (--furniture-room) --------------------------------------
// 나무결 가구점 paintings next to the 3D basic bed and desk in a tier-0 room:
// floor cards, a rug, a lamp on the desk and back-wall pieces, all owned.
const FURNISHED = [
  ['bed', 'model', 'bed', 4.2, -2.46],
  ['desk', 'model', 'desk', 0.6, -3.42],
  ['lamp', 'prop', 'furn-crystal-lamp', 1.25, -3.42, { y: 1.03 }],
  ['tv', 'prop', 'furn-retro-tv', 2.4, -3.6],
  ['rug', 'prop', 'furn-rug-lilac', 0.2, 1.2],
  ['table', 'prop', 'furn-round-dining-set', 0.2, 0.9],
  ['cat', 'prop', 'furn-cat-tower', -1.6, -2.6],
  ['bean', 'prop', 'furn-beanbag', -3.4, 1.4],
  ['arm', 'prop', 'furn-armchair-navy', 2.6, 1.0],
  ['rock', 'prop', 'furn-rocking-chair', 4.6, 1.6],
  ['vase', 'prop', 'furn-cherry-vase', -4.9, -1.2],
  ['shelf', 'prop', 'furn-wall-shelf', 4.4, -4, { wall: 'back', y: 2.35 }],
  ['garland', 'prop', 'furn-maple-garland', 4.4, -4, { wall: 'back', y: 3.3 }],
  ['plant', 'prop', 'furn-hanging-planter', 2.75, -4, { wall: 'back', y: 2.6 }],
  ['medal', 'prop', 'furn-village-medal', -1.35, -4, { wall: 'back', y: 3.05 }],
];
async function furnitureRoomView(browser, base, view, report) {
  const save = freshLounge(3);
  save.bedroom = {
    ...save.bedroom,
    items: FURNISHED.map(([id, kind, ref, x, z, extra = {}]) => ({ id, kind, ref, x, z, rotY: 0, scale: 1, ...extra })),
  };
  const seed = (life, uid) => {
    seedLife(life, uid);
    const x = ((life.ext ??= {})[uid] ??= {});
    x.furn = { ...(x.furn ?? {}), 'furn-marble-fireplace': 1, 'furn-najeon-wardrobe': 1, 'furn-canopy-bed': 1 };
    for (const [, , ref] of FURNISHED) if (ref !== 'bed') x.furn[ref] = (x.furn[ref] ?? 0) + 1;
  };
  const H = await setup({ browser, base, view, seedLife: seed, seedSave: save });
  const { page, js, sleep, until } = H;
  const res = (report.views[view] = { screens: {}, notes: [] });
  const snap = async (name) => {
    await js(() => document.fonts.ready);
    await sleep(450);
    const file = `${view}-${name}.png`;
    await page.screenshot({ path: path.join(out, file), timeout: 90000 });
    res.screens[name] = { file, ...(await js(measureInPage).catch((e) => ({ err: e.message }))) };
    console.log(`  ${view} ${name}`);
  };
  try {
    await page.goto(base);
    await page.waitForSelector('.l-auth-card', { timeout: 90000 });
    await login(H, base);
    await until(() => { const s = document.querySelector('[data-testid=bedroom-3d]')?.getAttribute('data-load-state'); return !!s && s !== 'loading'; }, 180000);
    await sleep(2500);
    for (let i = 0; i < 4 && (await js(() => document.querySelectorAll('dialog[open]').length)); i++) {
      await page.keyboard.press('Escape');
      await sleep(400);
    }
    res.items = await js(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.items);
    await snap('room-furniture');
    await H.clickText(/^꾸미기/);
    await until(() => !!document.querySelector('[data-testid=room-done]'), 10000);
    await sleep(800);
    res.conflicts = await js(() => document.body.innerText.match(/겹친 곳 \d+/)?.[0] ?? 'none');
    await H.clickText(/놓을 것 고르기|^놓기$/);
    await until(() => !!document.querySelector('[data-testid=catalog-premium]'), 10000);
    await H.clickSel('[data-testid=catalog-premium]');
    await sleep(1500);
    await snap('room-furniture-catalog');
  } catch (e) {
    res.notes.push(e.stack || String(e));
    console.error(`  ${view} furniture room: ${e.message}`);
  }
  res.errors = H.errors.slice(0, 10);
  await H.close();
}

// ---- run --------------------------------------------------------------------
const server = await serve(pages);
const browser = await launchBrowser();
const report = { label, date: new Date().toISOString(), commit: '', views: {} };
try {
  report.commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root }).toString().trim();
} catch {}
try {
  await verifyMeasurements(browser);
  for (const view of views) {
    console.log(`view ${view} (${VIEWS[view].width}x${VIEWS[view].height})`);
    if (flag('furniture-room')) await furnitureRoomView(browser, server.url, view, report);
    else await runView(browser, server.url, view, report);
  }
} finally {
  await browser.close();
  server.close();
}
report.summary = summarize(report);
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
console.log('report:', path.join(out, 'report.json'));
console.log(JSON.stringify(report.summary));

function summarize(r) {
  const s = { screens: 0, low: 0, small: 0, narrow: 0, cut: 0, overlap: 0, covered: 0, closeUnder44: 0, editorEscFails: 0 };
  for (const v of Object.values(r.views))
    for (const m of Object.values(v.screens)) {
      s.screens++;
      s.low += m.lowCount ?? 0;
      s.small += m.smallCount ?? 0;
      s.narrow += m.narrowCount ?? 0;
      s.cut += m.cutCount ?? 0;
      s.overlap += m.overlapCount ?? 0;
      s.covered += m.coveredCount ?? 0;
      if (m.dialog?.close && (m.dialog.close.w < 44 || m.dialog.close.h < 44)) s.closeUnder44++;
      if (m.escExits === false) s.editorEscFails++;
    }
  return s;
}

const before = baselineFile ? JSON.parse(fs.readFileSync(baselineFile, 'utf8')) : undefined;
const coverageFailures = reportFailures(report, { views, only, withGames, withStage3: flag('stage3'), baseline: before });
if (coverageFailures.length) {
  fs.writeFileSync(path.join(out, 'coverage-errors.json'), JSON.stringify(coverageFailures, null, 1));
  console.error(coverageFailures.join('\n'));
  if (flag('strict') || writeBaseline) process.exit(1);
}
if (baselineFile) {
  const rows = [];
  let worse = 0;
  for (const [view, v] of Object.entries(report.views))
    for (const [name, m] of Object.entries(v.screens)) {
      const b = before.views?.[view]?.screens?.[name];
      if (!b) continue;
      const cols = ['lowCount', 'smallCount', 'narrowCount', 'cutCount', 'overlapCount', 'coveredCount'].map((k) => {
        if ((m[k] ?? 0) > (b[k] ?? 0)) worse++;
        return `${b[k] ?? '-'}→${m[k] ?? '-'}`;
      });
      const c = (d) => (d?.close ? `${d.close.w}x${d.close.h}` : '-');
      rows.push(`${view.padEnd(3)} ${name.padEnd(16)} low ${cols[0].padEnd(7)} small ${cols[1].padEnd(7)} narrow ${cols[2].padEnd(6)} cut ${cols[3].padEnd(6)} overlap ${cols[4].padEnd(6)} covered ${cols[5].padEnd(6)} close ${c(b.dialog)}→${c(m.dialog)}`);
    }
  const comparison = { before: before.summary, after: report.summary, worse, rows };
  fs.writeFileSync(path.join(out, 'compare.json'), JSON.stringify(comparison, null, 1));
  console.log(rows.join('\n'));
  console.log('summary before', JSON.stringify(before.summary));
  console.log('summary after ', JSON.stringify(report.summary));
  if (worse && flag('strict')) {
    console.error(`${worse} measurement(s) got worse than the baseline.`);
    process.exit(1);
  }
}

// Never save missing/erroring screens as zero-issue baseline entries. When
// --strict and --baseline are also set, the comparison must pass first.
if (writeBaseline) {
  const keep = ['lowCount', 'smallCount', 'narrowCount', 'cutCount', 'overlapCount', 'coveredCount'];
  const trimmed = { label, commit: report.commit, summary: report.summary, views: {} };
  for (const [view, v] of Object.entries(report.views)) {
    trimmed.views[view] = { screens: {} };
    for (const [name, m] of Object.entries(v.screens))
      trimmed.views[view].screens[name] = Object.fromEntries(keep.map((k) => [k, m[k]]).concat([['dialog', m.dialog?.close ? { close: m.dialog.close } : null]]));
  }
  fs.writeFileSync(writeBaseline, JSON.stringify(trimmed, null, 1) + '\n');
  console.log('baseline written:', writeBaseline);
}
