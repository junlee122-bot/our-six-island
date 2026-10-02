// Walks into 시장 거리 in the mock harness and saves screenshots (stage 1 check).
//   CHROMIUM_PATH=... node --experimental-strip-types scripts/market-check.mjs <pages-dir> <out-dir>
import path from 'node:path';
import fs from 'node:fs';
import { launchBrowser, login, serve, setup } from './ui-harness.mjs';

const pages = process.argv[2];
const out = process.argv[3] ?? '.';
fs.mkdirSync(out, { recursive: true });
const server = await serve(pages);
const base = server.url;
const browser = await launchBrowser();
const H = await setup({ browser, base, view: 'd' });
const { page, js, sleep, until } = H;
const shot = async (name) => {
  await page.screenshot({ path: path.join(out, name + '.png'), timeout: 120000 }).catch((e) => console.log('shot', name, e.message));
  console.log('shot', name);
};
await page.goto(base);
await page.waitForSelector('.l-auth-card', { timeout: 90000 });
await login(H, base);
await until(() => !!document.querySelector('.l-world-header'), 60000);
await sleep(3000);
for (let i = 0; i < 6; i++) {
  const s = await js(() => document.querySelector('main.l-app')?.dataset.space);
  console.log('space', s);
  if (s === 'village') break;
  await js(() => document.querySelector('[data-testid=bedroom-3d]')?.focus());
  await page.keyboard.press('Escape');
  await sleep(1500);
  if (!(await H.clickText(/마을로 나가기/, 'dialog[open] button'))) { await page.keyboard.press('Escape'); await H.clickText(/^나가기/); }
  await sleep(4000);
}
await until(() => { const s = document.querySelector('[data-testid=village-3d]')?.getAttribute('data-load-state'); return !!s && s !== 'loading'; }, 180000);
await sleep(3000);
for (let i = 0; i < 4; i++) await page.keyboard.press('Escape');
const goTo = async (x, z, testid) => {
  await js((p) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: p })), { x, z });
  for (let k = 0; k < 60; k++) {
    await sleep(3000);
    const d = await js((t) => ({ ...document.querySelector(`[data-testid=${t}]`)?.dataset }), testid);
    console.log(testid, d.avatarX, d.avatarZ, d.walking, d.action ?? '');
    if (d.walking === 'false' && Math.hypot(Number(d.avatarX) - x, Number(d.avatarZ) - z) < 1.2) return true;
  }
  return false;
};
console.log('to gate', await goTo(53.6, -5, 'village-3d'));
await shot('hub-gate');
await js(() => document.querySelector('[data-testid=village-3d]')?.focus());
await page.keyboard.press('KeyE');
await until(() => document.querySelector('[data-testid=area-3d]')?.dataset.loadState === 'ready', 180000);
await sleep(15000);
await shot('market-arrive');
// Residents at lunch (game 12:20 of this game day; 게임 하루 = 실제 1시간,
// game midnight on every real hour, a game minute is 2.5 s) on the bakery terrace.
await js(() => {
  const now = Date.now(), hour = 3600e3;
  const target = Math.floor(now / hour) * hour + (12 * 60 + 20) * 2500;
  window.dispatchEvent(new CustomEvent('bumtadew:npc-clock', { detail: target - now }));
});
console.log('to plaza', await goTo(0, 4, 'area-3d'));
await sleep(5000);
await shot('market-plaza');
console.log('to terrace', await goTo(9, -4.2, 'area-3d'));
await sleep(5000);
await shot('market-bakery');
await browser.close();
server.close();
process.exit(0);
