// Speech box screenshots (mock cloud, never real Supabase): talking to a
// resting friend (FriendDialog) and to a resident (NpcTalkDialog: the lines,
// the choices, the gift picker and their reaction), measured like ui:shots
// (contrast, small / narrow / cut text) and checked for Esc + focus return.
//
//   node --experimental-strip-types --no-warnings scripts/talk-shots.mjs --pages <pages-dir> [--out <dir>] [--views fhd,s,phone] [--skip-friend] [--npc carpenter]
//
// --npc <id> talks to another resident instead (the first half game hour of
// the next game day they stand in the village, e.g. 발키리's evening walk).
//
// The mock server's clock is moved to game 22:05 of the next game day (or the
// first half game hour 프리렌 rests in the village, see below), when 프리렌 sits on the
// plaza bench looking at the stars ("빵집 카페 사장 · 광장 벤치에서 별 보는
// 중"). The page reads that clock from the server like the real game, so the
// talk and the gift really go through (only on this mock world). --at <ms>
// picks another moment. A build without the speech box (older pages) gets the
// resident's window captured as it is, for before/after comparisons.
// The 3D scene runs at 간단 그래픽 (low quality, 30 FPS) with reduced motion
// (the text appears at once) so a software GPU keeps up; --full-graphics
// turns that off.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { npcDayStart, npcSpot } from '../app/lounge-npc-schedule.ts';
import { GAME_MINUTE_MS, gameDay } from '../app/lounge-calendar.ts';
import { npcPose } from '../app/lounge-village-life.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const pages = opt('pages', '');
if (!pages) throw new Error('--pages <dir> (a build from scripts/build-standalone.mjs --site-url /)');
const out = path.resolve(opt('out', path.join(root, '.ui-shots', 'talk')));
const views = opt('views', 'fhd,s').split(',');
const fullGraphics = args.includes('--full-graphics');
// --skip-friend: only the resident (a friend resting on a bench can take minutes to find).
const skipFriend = args.includes('--skip-friend');
const NPC = opt('npc', 'frieren');
fs.mkdirSync(out, { recursive: true });

// Move this process's clock (the mock server's) before the harness starts.
const realNow = Date.now.bind(Date);
// 22:05 when 프리렌 is on the plaza then; else the first half hour of today she
// rests in the village (her evenings moved to 시장 거리, character QA 2026-10-01).
const inVillage = (t) => {
  const s = npcSpot(NPC, t);
  return s.area === 'village' && s.visible && !s.walking;
};
// Game times in the next game day (게임 하루 = 실제 1시간; a game minute is 2.5 s).
const dayStart = npcDayStart(gameDay(realNow()) + 1);
const defaultAt = [22 * 60 + 5, ...Array.from({ length: 36 }, (_, i) => 6 * 60 + i * 30)].map((m) => dayStart + m * GAME_MINUTE_MS).find(inVillage) ?? dayStart + (22 * 60 + 5) * GAME_MINUTE_MS;
const at = Number(opt('at', String(defaultAt)));
const shift = at - realNow();
Date.now = () => realNow() + shift;
const bench = npcSpot(NPC, at);
console.log(`server clock ${new Date(at).toISOString()} (shift ${(shift / 3_600_000).toFixed(2)} h) · ${NPC}: ${bench.area} ${bench.label}`);
assert.equal(bench.area, 'village', `${NPC}이(가) 그 시각 마을에 있어야 합니다.`);

const { launchBrowser, login, serve, setup, VIEWS } = await import('./ui-harness.mjs');
// A phone-width view for the box only (ui:shots keeps its own three).
VIEWS.phone ??= { width: 390, height: 844 };
const { measureInPage } = await import('./ui-measure.mjs');

const OFFLINE = [1, 4, 5];
function seedLife(life, uid) {
  const x = ((life.ext ??= {})[uid] ??= {});
  x.inv = { ...x.inv, crucian: 2, azalea: 3, wildflower: 2, pinecone: 4, copper: 6, wood: 20 };
  x.q2 = { ...x.q2, carrot: 2 };
  x.npcRelations = { ...x.npcRelations, [NPC]: { points: 26 } };
  const bag = life.bag?.[uid];
  if (bag) {
    bag.produce.carrot = (bag.produce.carrot ?? 0) + 5;
    bag.fruit = (bag.fruit ?? 0) + 3;
  }
  life.bonds = { ...life.bonds, '1-3': 700, '3-4': 260, '3-5': 90 };
}

const report = { at: new Date(at).toISOString(), views: {} };
const server = await serve(pages);
const browser = await launchBrowser();
try {
  for (const view of views) {
    console.log(`view ${view} (${VIEWS[view].width}x${VIEWS[view].height})`);
    report.views[view] = await runView(view);
  }
} finally {
  await browser.close();
  server.close();
}
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
console.log('report:', path.join(out, 'report.json'));

async function runView(view) {
  const H = await setup({ browser, base: server.url, view, seedLife });
  const { page, js, sleep, until } = H;
  const res = { screens: {}, notes: [], lowGraphics: !fullGraphics };
  // The phone view is a narrow window on a desktop screen: a real phone gets
  // the "PC 게임이에요" screen (PcOnly.tsx decides by the screen's width).
  if (view === 'phone') await H.ctx.addInitScript(() => Object.defineProperty(screen, 'width', { get: () => 1280 }));
  if (!fullGraphics) {
    await H.ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, fpsCap: 30, quality: 'low' })));
    await page.emulateMedia({ reducedMotion: 'reduce' });
  }
  const dialogs = () => js(() => document.querySelectorAll('dialog[open]').length);
  const closeAll = async () => {
    for (let i = 0; i < 5 && (await dialogs()); i++) {
      await page.keyboard.press('Escape');
      await sleep(400);
    }
  };
  const focusScene = async () => {
    await js(() => document.querySelector('[data-testid=village-3d], [data-testid=bedroom-3d]')?.focus({ preventScroll: true }));
    await sleep(200);
  };
  const snap = async (name) => {
    await js(() => document.fonts.ready);
    await sleep(450);
    const file = `${view}-${name}.png`;
    await page.screenshot({ path: path.join(out, file), timeout: 90000 });
    const m = await js(measureInPage);
    const box = await js(() => {
      const r = document.querySelector('dialog[open] .l-talk-box, dialog[open]')?.getBoundingClientRect();
      return r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null;
    });
    res.screens[name] = { file, box, lowCount: m.lowCount, smallCount: m.smallCount, narrowCount: m.narrowCount, cutCount: m.cutCount, low: m.low, cut: m.cut, minFont: m.minFont };
    console.log(`  ${view} ${name.padEnd(18)} low ${m.lowCount} small ${m.smallCount} narrow ${m.narrowCount} cut ${m.cutCount} box ${box ? `${box.x},${box.y} ${box.w}x${box.h}` : '-'}`);
  };
  const typed = () => until(() => !document.querySelector('dialog[open] [data-typing]'), 60000);
  const walkTo = async (p, near = 1.2, ms = 120000) => {
    await js((q) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: q })), p);
    await page.keyboard.down('Shift');
    try {
      return (await until((q) => {
        const d = document.querySelector('[data-testid=village-3d]')?.dataset;
        return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - q.x, Number(d.avatarZ) - q.z) < q.near;
      }, ms, { x: p.x, z: p.z, near })) >= 0;
    } finally {
      await page.keyboard.up('Shift');
    }
  };
  const linkOk = () => until(() => !document.querySelector('.l-presence.is-retrying'), 180000);
  /**
   * Presses `key` until `done(arg)` holds (up to 4 tries, each after the link
   * is back); the try that worked, or 0. A software GPU drawing the full
   * viewport can starve the page so its polls time out and the header stays
   * on 연결 끊김 (the game then refuses online actions, as it should): the
   * viewport shrinks while waiting for the server and is restored before the
   * next capture.
   */
  const tryKey = async (key, done, arg) => {
    await page.setViewportSize({ width: 800, height: 450 });
    try {
      for (let n = 1; n <= 4; n++) {
        await linkOk();
        await page.keyboard.press(key);
        if ((await until(done, 30000, arg)) >= 0) return n;
        const why = await js(() => ({
          banner: document.querySelector('[data-testid=banner] span')?.textContent ?? '',
          retrying: !!document.querySelector('.l-presence.is-retrying'),
          focus: document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName,
        }));
        res.notes.push(`${key} try ${n}: ${JSON.stringify(why)}`);
        console.log(`  ${view} ${key}: no answer yet (try ${n}) ${JSON.stringify(why)}`);
      }
      return 0;
    } finally {
      await page.setViewportSize(VIEWS[view]);
      await sleep(1500);
    }
  };
  /** Esc closes the box and the scene has focus again (keys walk at once). */
  const escBack = async (name) => {
    await page.keyboard.press('Escape');
    await sleep(500);
    const state = await js(() => ({ open: document.querySelectorAll('dialog[open]').length, focus: document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName }));
    res.screens[name].escCloses = state.open === 0;
    res.screens[name].focusAfterEsc = state.focus;
    console.log(`  ${view} ${name}: Esc → open dialogs ${state.open}, focus ${state.focus}`);
  };

  try {
    await page.goto(server.url);
    await page.waitForSelector('.l-auth-card', { timeout: 90000 });
    await login(H, server.url);
    console.log(`  ${view} logged in`);
    await until(() => !!document.querySelector('.l-world-header'), 60000);
    await until(() => {
      const s = document.querySelector('[data-testid=bedroom-3d]')?.getAttribute('data-load-state');
      return !!s && s !== 'loading';
    }, 180000);
    await sleep(2000);
    await closeAll();
    // Out to the village (Esc menu → 마을로 나가기).
    for (let i = 0; i < 4 && (await js(() => document.querySelector('main.l-app')?.dataset.space)) !== 'village'; i++) {
      await closeAll();
      await focusScene();
      await page.keyboard.press('Escape');
      await sleep(700);
      if (!(await H.clickText(/마을로 나가기/, 'dialog[open] button'))) {
        await closeAll();
        await H.clickText(/^나가기/);
      }
      await until(() => document.querySelector('main.l-app')?.dataset.space === 'village', 20000);
    }
    assert.notEqual(await until(() => {
      const s = document.querySelector('[data-testid=village-3d]')?.getAttribute('data-load-state');
      return !!s && s !== 'loading';
    }, 180000), -1, '마을을 불러오지 못했습니다.');
    await until(() => !document.querySelector('[data-testid=scene-fade].is-active'), 15000);
    await sleep(1500);
    await closeAll();
    console.log(`  ${view} in the village`);

    // ---- a resting friend (FriendDialog) -----------------------------------
    // Offline friends rest at their door, a plaza bench, their farm or the
    // plaza (lounge-village-life.ts npcPose, a new spot every 80 s). Doors and
    // farms have their own actions, so wait for one resting on a bench or the
    // plaza and walk up to them.
    if (!skipFriend) {
      let friend = -1;
      const deadline = Date.now() + 8 * 60_000;
      while (friend < 0 && Date.now() < deadline) {
        const now = Date.now();
        const resting = OFFLINE.map((actor) => ({ actor, pose: npcPose(actor, now) })).filter(({ pose }) => !pose.walking && (pose.target === 1 || pose.target === 3) && Math.hypot(pose.point.x - bench.x, pose.point.z - bench.z) > 2);
        if (!resting.length) {
          await sleep(3000);
          continue;
        }
        const { actor, pose } = resting[0];
        await focusScene();
        const arrived = await walkTo(pose.point, 1.3, 45000);
        const d = await js(() => ({ ...document.querySelector('[data-testid=village-3d]')?.dataset }));
        console.log(`  ${view} friend ${actor} at ${pose.point.x.toFixed(1)},${pose.point.z.toFixed(1)}: arrived ${arrived}, me ${d.avatarX},${d.avatarZ}, spot ${d.spot || '-'}`);
        if (d.spot !== 'npc') continue;
        await focusScene();
        await page.keyboard.press('KeyE');
        if ((await until(() => !!document.querySelector('[data-testid=friend-dialog]'), 60000)) >= 0) friend = actor;
      }
      assert.ok(friend >= 0, '쉬는 친구에게 말을 걸지 못했습니다.');
      await typed();
      await snap('friend');
      for (let i = 0; i < 6 && !(await js(() => !!document.querySelector('dialog[open] .l-talk-choices'))); i++) {
        await page.keyboard.press('KeyE');
        await sleep(250);
        await typed();
      }
      await snap('friend-choices');
      await escBack('friend-choices');
      await closeAll();
    }

    // ---- a resident (NpcTalkDialog) ------------------------------------------
    await focusScene();
    assert.ok(await walkTo({ x: bench.x, z: bench.z }, 1.2), '광장 벤치까지 걷지 못했습니다.');
    await sleep(800);
    let opened = false;
    for (let tries = 0; tries < 6 && !opened; tries++) {
      const spot = await js(() => document.querySelector('[data-testid=village-3d]')?.dataset.spot);
      console.log(`  ${view} bench try ${tries}: spot ${spot || '-'}`);
      if (spot !== 'resident') {
        await walkTo({ x: bench.x + (tries % 2 ? 0.4 : -0.4), z: bench.z + 1 + tries * 0.15 }, 0.6, 45000);
        continue;
      }
      await focusScene();
      await page.keyboard.press('KeyE');
      opened = (await until(() => !!document.querySelector('[data-testid=npc-dialog], dialog.l-npc-talk'), 60000)) >= 0;
    }
    assert.ok(opened, `${NPC}에게 말을 걸지 못했습니다.`);
    const speechBox = await js(() => !!document.querySelector('[data-testid=npc-dialog]'));
    res.speechBox = speechBox;
    if (!speechBox) {
      // Older build: the centred window.
      await sleep(800);
      await snap('npc');
      await escBack('npc');
    } else {
      await typed();
      await snap('npc');
      const text = () => js(() => document.querySelector('[data-testid=npc-dialog-text]')?.textContent ?? '');
      res.said = [await text()];
      for (let i = 0; i < 6 && !(await js(() => !!document.querySelector('dialog[open] .l-talk-choices'))); i++) {
        await page.keyboard.press('KeyE');
        await sleep(250);
        await typed();
        const t = await text();
        if (!res.said.includes(t)) res.said.push(t);
      }
      await snap('npc-choices');
      res.focusedChoice = await js(() => document.activeElement?.getAttribute('data-testid'));
      // 2 → the gift picker inside the box.
      await page.keyboard.press('Digit2');
      assert.notEqual(await until(() => !!document.querySelector('[data-testid=npc-gift-picker]'), 30000), -1, '선물 고르기가 열리지 않았습니다.');
      await sleep(300);
      res.pickerFocus = await js(() => document.activeElement?.getAttribute('data-testid'));
      await page.keyboard.press('ArrowRight');
      await sleep(150);
      res.pickerAfterRight = await js(() => document.activeElement?.getAttribute('data-testid'));
      await page.keyboard.press('ArrowLeft');
      await sleep(150);
      await snap('npc-gift');
      // E hands over the focused item; their reaction is the next page. Under
      // a busy software GPU the mock link can drop for a few seconds (the
      // header shows 연결 끊김) and the server call fails: the picker then
      // stays open, nothing is given, and E is pressed again once it is back.
      const before = await js(() => document.querySelector('[data-testid=npc-dialog-text]')?.textContent ?? '');
      res.giftTries = await tryKey('KeyE', (b) => {
        const t = document.querySelector('[data-testid=npc-dialog-text]')?.textContent ?? '';
        return !document.querySelector('[data-testid=npc-gift-picker]') && t !== b;
      }, before);
      assert.ok(res.giftTries > 0, '선물 반응이 나오지 않았습니다.');
      await typed();
      await until(() => !!document.querySelector('dialog[open] .l-talk-choices'), 30000);
      await sleep(600);
      await snap('npc-gift-reply');
      res.giftReply = await js(() => document.querySelector('[data-testid=npc-dialog-text]')?.textContent ?? '');
      res.giftChoice = await js(() => document.querySelector('[data-testid=npc-choice-gift]')?.textContent?.trim());
      res.focusAfterReply = await js(() => document.activeElement?.getAttribute('data-testid'));
      // 1 → today's talk: a resident with a talk book (lounge-npc-talk.ts)
      // opens and waits for my reply buttons; the rest answer with one line
      // (never a line already said). Gifts stay locked for today.
      const beforeTalk = await js(() => document.querySelector('[data-testid=npc-dialog-text]')?.textContent ?? '');
      res.talkTries = await tryKey('Digit1', (b) => (document.querySelector('[data-testid=npc-dialog-text]')?.textContent ?? '') !== b, beforeTalk);
      assert.ok(res.talkTries > 0, '이야기 나누기 대답이 나오지 않았습니다.');
      await typed();
      await until(() => !!document.querySelector('dialog[open] .l-talk-choices'), 30000);
      res.talkReply = await js(() => document.querySelector('[data-testid=npc-dialog-text]')?.textContent ?? '');
      res.talkRepeats = [...res.said, res.giftReply].includes(res.talkReply);
      await sleep(600);
      await snap('npc-talked');
      res.talkChoice = await js(() => document.querySelector('[data-testid=npc-choice-talk]')?.textContent?.trim());
      res.hearts = await js(() => document.querySelector('dialog[open] .l-hearts')?.getAttribute('aria-label'));
      await escBack('npc-talked');
    }
  } catch (e) {
    res.notes.push(e.stack || String(e));
    console.error(`  ${view}: ${e.stack || e}`);
    await page.screenshot({ path: path.join(out, `${view}-failed.png`) }).catch(() => {});
  }
  res.errors = H.errors.slice(0, 10);
  await H.close();
  return res;
}
