// Mock-cloud browser harness for UI checks (scripts/ui-shots.mjs).
//
// Serves a built Pages directory from 127.0.0.1 and answers every Supabase call
// in-process with the real game engine (app/lounge-cloud-engine.ts). Nothing
// ever leaves the machine: every request that is not 127.0.0.1 is either
// answered here or aborted, and Realtime websockets are swallowed.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { friendVisitView, serverAccountSave, lifeUnlocksOf } from '../app/lounge-accounts.ts';

export const VIEWS = {
  fhd: { width: 1920, height: 1080 },
  d: { width: 1440, height: 900 },
  s: { width: 1280, height: 720 },
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

/** Static file server for a Pages build. Resolves to { url, close }. */
export function serve(dir) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(root, url);
    if (!file.startsWith(root)) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () =>
      resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() }),
    ),
  );
}

export async function launchBrowser() {
  const { chromium } = await import('playwright-core');
  const executablePath = process.env.CHROMIUM_PATH || undefined;
  return chromium.launch({
    executablePath,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
}

/**
 * A logged-in-able mock world: three friends online, a ripe farm, a letter.
 * Returns helpers bound to one page at the given viewport.
 */
export async function setup({ browser, base, view = 'fhd', seedLife, seedSave, onboard = false }) {
  const VW = VIEWS[view];
  const uid = '11111111-2222-4333-8444-555555555553';
  const me = { id: uid, actor: 3, username: 'seungjun' };
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  let revision = 1;
  const saves = {};
  // A stored profile save for me (e.g. a furnished room), as the server would hold it.
  if (seedSave) saves[3] = JSON.parse(JSON.stringify(seedSave));
  const errors = [];
  const mk = (actor, username) => ({ id: crypto.randomUUID(), actor, username, connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' });
  const bots = [mk(0, 'dowon'), mk(6, 'hohyeon'), mk(2, 'minseo')];
  async function run(p, op, extra = {}) {
    const command = {
      op,
      connection: p.connection,
      code: p.code,
      ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}),
      ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
      ...extra,
    };
    // Hash before reading world: concurrent heartbeats must transition the latest
    // state, not an object captured before the asynchronous digest completed.
    const hash = await commandHash(command);
    const r = cloudTransition(world, p, command, hash, Date.now());
    world = r.state;
    revision++;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    return r.response;
  }
  for (const b of bots) {
    await run(b, 'wallet');
    await run(b, 'open', { code: 'BEMTADUVLY' });
    await run(b, 'action', { action: { kind: 'area', area: 'village' } }).catch(() => {});
  }
  // Keep the bots' leases alive like real clients polling.
  const hb = setInterval(() => {
    for (const b of bots) run(b, 'read').catch(() => {});
  }, 4000);
  {
    // A returning player: ripe carrots, a letter, a guestbook entry.
    const meC = { ...me, connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' };
    await run(meC, 'wallet');
    await run(meC, 'open', { code: 'BEMTADUVLY' });
    // 우리 농장 F2: a new field is grass (the hoe first), and crops grow while watered.
    await run(meC, 'action', { action: { kind: 'till', plot: -1 } });
    for (let i = 0; i < 4; i++) await run(meC, 'action', { action: { kind: 'plant', plot: i, crop: 'carrot' } });
    await run(meC, 'action', { action: { kind: 'water', plot: -1 } });
    // Fields are stored sparse ({ tile: plot }, lounge-life.ts packLife); the watering moves back with the planting.
    for (const p of Object.values(world.life.farms[uid]))
      if (p?.crop) {
        p.plantedAt -= 3 * 3600e3;
        if (p.wetUntil) p.wetUntil -= 3 * 3600e3;
      }
    await run(meC, 'leave');
    await run(bots[0], 'action', { action: { kind: 'mail', to: 3, text: '어제 고스톱 재밌었어! 오늘 저녁에 또 하자', sticker: 'heart' } });
    await run(bots[0], 'action', { action: { kind: 'guestbook', owner: 3, text: '방 너무 예쁘다~ 다녀감!' } });
  }
  seedLife?.(world.life, uid);

  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 86400;
  const jwt = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: uid, exp, role: 'authenticated', aud: 'authenticated', session_id: 's1' }) + '.sig';
  const user = { id: uid, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const profile = () => ({ id: uid, username: 'seungjun', actor: 3, save: saves[3] ?? null, revision: saves[3] ? 1 : 0, updatedAt: '' });

  const ctx = await browser.newContext({ viewport: VW, deviceScaleFactor: 1, locale: 'ko-KR' });
  await ctx.addInitScript((onboard) => {
    if (!onboard) {
      localStorage.setItem('bumtadew-onboarding-v1', 'done');
      localStorage.setItem('bumtadew-onboarding-room-v1', 'done');
    }
  }, onboard);
  await ctx.routeWebSocket(/./, () => {});
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror ' + e.message.slice(0, 160)));
  // A crashed tab fails every evaluate, which `until` reads as "not yet":
  // without this a crash would look like a slow screen until the timeout.
  let crashed = false;
  page.on('crash', () => {
    crashed = true;
    errors.push('page crashed');
  });
  const external = new Set();
  let lastMe = null;
  await ctx.route('**/*', async (r) => {
    const u = r.request().url();
    if (u.startsWith(base)) return r.continue();
    const json = (o, status = 200) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(o) }).catch(() => {});
    if (u.includes('/auth/v1/user')) return json(user);
    if (u.includes('/functions/v1/hohyeon-auth')) {
      const body = JSON.parse(r.request().postData() || '{}');
      return json({ session: { access_token: jwt, refresh_token: 'r', expires_in: 86400, expires_at: exp, token_type: 'bearer', user }, profile: profile(), ...(body.op !== 'login' ? { recoveryCode: 'HR-ABCD-EFGH-IJKL' } : {}) });
    }
    if (u.includes('/functions/v1/hohyeon-api')) {
      const body = JSON.parse(r.request().postData() || '{}');
      if (body.op === 'profile') return json({ profile: profile() });
      if (body.op === 'save') {
        try {
          const saved = serverAccountSave(body.save, 3, saves[3], lifeUnlocksOf(world.life, uid));
          saves[3] = JSON.parse(JSON.stringify(saved));
          return json({ conflict: false, save: saved, revision: (body.revision ?? 0) + 1, updatedAt: '' });
        } catch (e) {
          return json({ error: e.message }, e.status ?? 409);
        }
      }
      if (body.op === 'visit') {
        try {
          return json({ visit: friendVisitView(body.owner, saves[body.owner] ?? null, world.life) });
        } catch (e) {
          return json({ error: e.message }, 400);
        }
      }
      try {
        const c = body.command;
        if (c.connection) lastMe = { connection: c.connection, code: c.code };
        const hash = await commandHash(c);
        const t = cloudTransition(world, me, c, hash, Date.now());
        if (t.response.code && lastMe) lastMe.code = t.response.code;
        world = t.state;
        if (t.changed) revision++;
        return json({ ...t.response, revision }, t.response.status || 200);
      } catch (e) {
        return json({ error: e.message }, e.status || 400);
      }
    }
    try {
      external.add(new URL(u).host);
    } catch {}
    return r.abort();
  });

  const js = (f, a) => page.evaluate(f, a);
  // page.evaluate has no timeout: a page whose main thread never comes back
  // would hold a poll (and the job) forever. Polls give up after `ms`.
  const jsWithin = (f, a, ms = 120000) => {
    let timer;
    const late = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`page did not answer within ${ms / 1000}s (main thread busy or hung)`)), ms);
    });
    return Promise.race([js(f, a), late]).finally(() => clearTimeout(timer));
  };
  const sleep = (ms) => page.waitForTimeout(ms);
  async function until(pred, ms = 30000, arg) {
    const t = Date.now();
    while (Date.now() - t < ms) {
      if (crashed) throw new Error('page crashed (renderer process gone)');
      const ok = await jsWithin(pred, arg).catch((e) => {
        if (e.message.startsWith('page did not answer')) throw e;
        return false;
      });
      if (ok) return Date.now() - t;
      await sleep(120);
    }
    return -1;
  }
  const clickSel = async (sel) => {
    const box = await js((s) => {
      const el = [...document.querySelectorAll(s)].find((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (!el) return null;
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, sel);
    if (!box) return false;
    await page.mouse.click(box.x, box.y);
    return true;
  };
  const clickText = async (re, scope = 'button, a, [role=tab], [role=button]') => {
    const box = await js(([src, scope]) => {
      const rx = new RegExp(src);
      const el = [...document.querySelectorAll(scope)]
        .filter((b) => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && getComputedStyle(b).visibility !== 'hidden';
        })
        .reverse()
        .find((b) => rx.test((b.innerText || b.getAttribute('aria-label') || '').trim()));
      if (!el) return null;
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, [re.source, scope]);
    if (!box) return false;
    await page.mouse.click(box.x, box.y);
    return true;
  };
  const close = async () => {
    clearInterval(hb);
    await ctx.close().catch(() => {});
  };
  return { page, ctx, js, jsWithin, sleep, until, clickSel, clickText, run, bots, uid, VW, errors, external, world: () => world, close };
}

export async function login(H, base) {
  await H.page.goto(base);
  await H.page.waitForSelector('.l-auth-card', { timeout: 90000 });
  await H.clickSel('[data-username=seungjun]');
  await H.sleep(300);
  const inputs = await H.page.$$('.l-account-form input:not([readonly])');
  await inputs[0].fill('password1234');
  await H.clickSel('.l-auth-submit');
}

/** 우리 농장: "마을로 나가기" opens on the farm in front of my house; walk its south road to the hub. */
export async function farmToVillage(page, timeout = 180_000) {
  const area = () => page.evaluate(() => {
    const d = document.querySelector('[data-testid=area-3d]')?.dataset;
    return document.querySelector('[data-testid=village-3d]') ? 'village' : d?.loadState === 'ready' ? d.area : '';
  });
  const t0 = Date.now();
  let at = '';
  while (Date.now() - t0 < timeout && !(at = await area())) await new Promise((r) => setTimeout(r, 250));
  if (at !== 'farm') return;
  await page.waitForFunction(() => !document.querySelector('[data-testid=scene-fade].is-active'), null, { timeout: 30_000 });
  const exit = { x: 0, z: 30 };
  await page.evaluate((p) => window.dispatchEvent(new CustomEvent('bumtadew:go', { detail: p })), exit);
  await page.waitForFunction((p) => {
    const d = document.querySelector('[data-testid=area-3d]')?.dataset;
    return d?.walking === 'false' && Math.hypot(Number(d.avatarX) - p.x, Number(d.avatarZ) - p.z) < 1;
  }, exit, { timeout: 120_000 });
  await page.evaluate(() => document.querySelector('[data-testid=area-3d]')?.focus({ preventScroll: true }));
  await page.keyboard.press('KeyE');
  await page.waitForFunction(() => !document.querySelector('[data-testid=area-3d]'), null, { timeout: 30_000 });
}
