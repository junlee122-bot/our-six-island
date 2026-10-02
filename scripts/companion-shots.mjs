// 주민 동행 screenshots (mock cloud, never real Supabase): walk up to a
// resident, "같이 다닐래요?", then the HUD chip with them along, the
// resident walking beside me in the village, and the companion talk (E).
//
//   node --experimental-strip-types --no-warnings scripts/companion-shots.mjs --pages <pages-dir> [--out <dir>] [--view s] [--npc frieren]
//
// Like scripts/talk-shots.mjs the mock server's clock is moved to an evening
// when the resident is in the village and off duty (so they can come along).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { npcDayStart, npcSpot } from '../app/lounge-npc-schedule.ts';
import { GAME_MINUTE_MS, gameDay } from '../app/lounge-calendar.ts';
import { companionBusy } from '../app/lounge-companion.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const pages = opt('pages', '');
if (!pages) throw new Error('--pages <dir> (a build from scripts/build-standalone.mjs --site-url /)');
const out = path.resolve(opt('out', path.join(root, '.ui-shots', 'companion')));
const view = opt('view', 's');
const NPC = opt('npc', 'frieren');
fs.mkdirSync(out, { recursive: true });

const realNow = Date.now.bind(Date);
const ok = (t) => {
  const s = npcSpot(NPC, t);
  return s.area === 'village' && s.visible && !s.walking && !companionBusy(NPC, t);
};
const dayStart = npcDayStart(gameDay(realNow()) + 1);
const at = Number(opt('at', String([22 * 60 + 5, ...Array.from({ length: 48 }, (_, i) => i * 30)].map((m) => dayStart + m * GAME_MINUTE_MS).find(ok) ?? dayStart)));
const shift = at - realNow();
Date.now = () => realNow() + shift;
const spot = npcSpot(NPC, at);
console.log(`server clock ${new Date(at).toISOString()} · ${NPC}: ${spot.area} ${spot.label}`);
assert.equal(spot.area, 'village');

const { launchBrowser, login, serve, setup } = await import('./ui-harness.mjs');
function seedLife(life, uid) {
  const x = ((life.ext ??= {})[uid] ??= {});
  x.npcRelations = { ...x.npcRelations, [NPC]: { points: 40 } };
}
const server = await serve(pages);
const browser = await launchBrowser();
const report = { at: new Date(at).toISOString(), npc: NPC, screens: [] };
try {
  const H = await setup({ browser, base: server.url, view, seedLife });
  const { page, js, sleep, until } = H;
  await H.ctx.addInitScript(() => localStorage.setItem('bumtadew-settings-v1', JSON.stringify({ version: 2, fpsCap: 30, quality: 'low' })));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const snap = async (name) => {
    await js(() => document.fonts.ready);
    await sleep(500);
    const file = `${view}-${name}.png`;
    await page.screenshot({ path: path.join(out, file), timeout: 90000 });
    report.screens.push(file);
    console.log('  shot', file);
  };
  const closeAll = async () => {
    for (let i = 0; i < 5 && (await js(() => document.querySelectorAll('dialog[open]').length)); i++) {
      await page.keyboard.press('Escape');
      await sleep(400);
    }
  };
  const focusScene = async () => {
    await js(() => document.querySelector('[data-testid=village-3d], [data-testid=bedroom-3d]')?.focus({ preventScroll: true }));
    await sleep(200);
  };
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
  const typed = () => until(() => !document.querySelector('dialog[open] [data-typing]'), 60000);

  await page.goto(server.url);
  await page.waitForSelector('.l-auth-card', { timeout: 90000 });
  await login(H, server.url);
  await until(() => !!document.querySelector('.l-world-header'), 60000);
  await until(() => {
    const s = document.querySelector('[data-testid=bedroom-3d]')?.getAttribute('data-load-state');
    return !!s && s !== 'loading';
  }, 180000);
  await sleep(2000);
  await closeAll();
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
  await until(() => {
    const s = document.querySelector('[data-testid=village-3d]')?.getAttribute('data-load-state');
    return !!s && s !== 'loading';
  }, 180000);
  await sleep(1500);
  await closeAll();
  await focusScene();
  assert.ok(await walkTo({ x: spot.x, z: spot.z }, 1.2), `${NPC} 곁까지 걷지 못했습니다.`);
  let opened = false;
  for (let tries = 0; tries < 6 && !opened; tries++) {
    const s = await js(() => document.querySelector('[data-testid=village-3d]')?.dataset.spot);
    if (s !== 'resident') {
      await walkTo({ x: spot.x + (tries % 2 ? 0.4 : -0.4), z: spot.z + 1 + tries * 0.15 }, 0.6, 45000);
      continue;
    }
    await focusScene();
    await page.keyboard.press('KeyE');
    opened = (await until(() => !!document.querySelector('[data-testid=npc-dialog]'), 60000)) >= 0;
  }
  assert.ok(opened, `${NPC}에게 말을 걸지 못했습니다.`);
  for (let i = 0; i < 6 && !(await js(() => !!document.querySelector('dialog[open] .l-talk-choices'))); i++) {
    await page.keyboard.press('KeyE');
    await sleep(250);
    await typed();
  }
  report.inviteLabel = await js(() => document.querySelector('[data-testid=npc-choice-companion]')?.textContent?.trim() ?? null);
  await snap('invite-choice');
  await js(() => document.querySelector('[data-testid=npc-choice-companion]')?.click());
  await until(() => !!document.querySelector('[data-testid=companion-hud]'), 60000);
  await typed();
  report.accept = await js(() => document.querySelector('[data-testid=npc-dialog-text]')?.textContent ?? '');
  await snap('accepted');
  await closeAll();
  await sleep(800);
  report.hud = await js(() => document.querySelector('[data-testid=companion-hud]')?.textContent ?? null);
  await snap('hud');
  // A short walk: the companion follows.
  await focusScene();
  await walkTo({ x: spot.x + 6, z: spot.z + 4 }, 1.2, 45000);
  await sleep(1500);
  await snap('walking');
  // The companion talk (the HUD chip opens it like E beside them).
  await js(() => document.querySelector('[data-testid=companion-hud] .l-companion-chip')?.click());
  await until(() => !!document.querySelector('[data-testid=companion-dialog]'), 30000);
  await typed();
  report.talk = [await js(() => document.querySelector('[data-testid=companion-dialog-text]')?.textContent ?? '')];
  await snap('talk');
  for (let i = 0; i < 3; i++) {
    await js(() => document.querySelector('[data-testid=companion-choice-more]')?.click());
    await sleep(600);
    await typed();
    report.talk.push(await js(() => document.querySelector('[data-testid=companion-dialog-text]')?.textContent ?? ''));
  }
  await snap('talk-more');
  await js(() => document.querySelector('[data-testid=companion-choice-dismiss]')?.click());
  await until(() => !document.querySelector('[data-testid=companion-hud]'), 30000);
  await sleep(800);
  // Their parting line comes as a toast.
  report.part = await js(() => [...document.querySelectorAll('[role=status], [role=alert]')].map((n) => n.textContent ?? '').find((t) => t.includes('“')) ?? '');
  await snap('parted');
} finally {
  await browser.close();
  server.close();
}
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
