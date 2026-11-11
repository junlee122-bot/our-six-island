// Synthetic accounts and the local cloud engine only. Every non-local request
// is intercepted or blocked by ui-harness; this never signs into a real account.
// node --experimental-strip-types scripts/verify-eighth-friend-ui.mjs --pages ../player-preview --out ../yuchan-ui
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { launchBrowser, login, serve, setup, VIEWS } from './ui-harness.mjs';
import { ACTORS, ACCOUNT_IDS } from '../app/lounge-roster.ts';
import { COLLECTIONS, collectionsFor } from '../app/lounge-look.ts';
import { roomOfHouse } from '../app/lounge-bedroom-data.ts';
import { farmHouse, farmField, farmStart } from '../app/lounge-farm-layout.ts';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf('--' + name); return i < 0 ? fallback : args[i + 1]; };
const pages = path.resolve(opt('pages', '../player-preview'));
const out = path.resolve(opt('out', '../yuchan-ui'));
const views = opt('views', 's,fhd').split(',');
const actors = opt('actors', '7,3').split(',').map(Number);
assert.ok(fs.existsSync(path.join(pages, 'index.html')), 'a completed Pages build is required');
if (!process.env.CHROMIUM_PATH) {
  const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  if (fs.existsSync(chrome)) process.env.CHROMIUM_PATH = chrome;
}
fs.mkdirSync(out, { recursive: true });
const report = { status: 'running', mockOnly: true, pages, viewports: {}, startedAt: new Date().toISOString(), runs: [] };
const persist = () => fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(report, null, 2));
persist();
const server = await serve(pages);
let browser;

async function run(view, actor) {
  const row = { view, viewport: VIEWS[view], actor, name: ACTORS[actor], username: ACCOUNT_IDS[actor], status: 'running', steps: {}, screenshots: [], pageErrors: [], consoleErrors: [], failedLocalRequests: [], apiFailures: [], authLogins: [] };
  report.runs.push(row);
  report.viewports[view] = VIEWS[view];
  persist();
  const H = await setup({ browser, base: server.url, view, actor });
  const {page, ctx} = H;
  const responseWork = [];
  page.on('console', m => { if (m.type() === 'error') row.consoleErrors.push(m.text().slice(0, 600)); });
  page.on('request', request => {
    if (!request.url().includes('/functions/v1/hohyeon-auth')) return;
    try { const body = JSON.parse(request.postData() || '{}'); if (body.op === 'login') row.authLogins.push({op:body.op,username:body.username}); } catch {}
  });
  page.on('response', response => {
    if (response.status() >= 400 && response.url().startsWith(server.url)) row.failedLocalRequests.push({status:response.status(),url:response.url().replace(server.url,'/')});
    if (response.status() >= 400 && response.url().includes('/functions/v1/')) {
      const failure = {status:response.status(),endpoint:new URL(response.url()).pathname};
      row.apiFailures.push(failure);
      responseWork.push(response.json().then(body=>{failure.error=body.error;}).catch(()=>{}));
    }
  });
  await ctx.addInitScript(() => {
    localStorage.setItem('bumtadew-settings-v1', JSON.stringify({version:2,quality:'low',fpsCap:30,dayNight:false}));
    // Trace the image source through offscreen sprite canvases. The renderer's
    // pixels and application state are not changed by this observation hook.
    const origins = new WeakMap();
    const draw = Function.prototype.call.bind(Reflect.get(CanvasRenderingContext2D.prototype, 'drawImage'));
    CanvasRenderingContext2D.prototype.drawImage = function(source, ...rest) {
      const result = draw(this, source, ...rest);
      const values = origins.get(this.canvas) ?? new Set();
      if (source instanceof HTMLImageElement && source.currentSrc) values.add(source.currentSrc);
      for (const url of origins.get(source) ?? []) values.add(url);
      origins.set(this.canvas, values);
      return result;
    };
    const readPixels = Function.prototype.call.bind(Reflect.get(CanvasRenderingContext2D.prototype, 'getImageData'));
    CanvasRenderingContext2D.prototype.getImageData = function(...args) {
      const pixels = readPixels(this, ...args);
      origins.set(pixels, new Set(origins.get(this.canvas) ?? []));
      return pixels;
    };
    const writePixels = Function.prototype.call.bind(Reflect.get(CanvasRenderingContext2D.prototype, 'putImageData'));
    CanvasRenderingContext2D.prototype.putImageData = function(pixels, ...args) {
      const result = writePixels(this, pixels, ...args);
      const values = origins.get(this.canvas) ?? new Set();
      for (const url of origins.get(pixels) ?? []) values.add(url);
      origins.set(this.canvas, values);
      return result;
    };
    window.__eighthSpriteSources = canvas => [...(origins.get(canvas) ?? [])];
  });
  await page.emulateMedia({reducedMotion:'reduce'});
  const wait = async (predicate, arg, ms = 30000) => assert.notEqual(await H.until(predicate, ms, arg), -1, `UI wait: ${predicate.toString().slice(0,160)}`);
  const fixtureWait = async (predicate, label, ms = 20000) => {
    const until = Date.now() + ms;
    while (!predicate() && Date.now() < until) await H.sleep(150);
    assert.ok(predicate(), label);
  };
  const shot = async label => {
    await page.evaluate(() => document.fonts.ready);
    const file = `${view}-actor${actor}-${label}.png`;
    await page.screenshot({path:path.join(out,file),timeout:90000});
    row.screenshots.push(file);
    persist();
  };
  const roomReady = async () => {
    await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.loadState === 'ready', null, 180000);
    await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
  };
  try {
    console.log(`${view} actor ${actor}: login grid`);
    await page.goto(server.url, { waitUntil:'domcontentloaded', timeout:90000 });
    await page.waitForSelector('.l-auth-card', {timeout:90000});
    assert.ok(await H.clickSel(`[data-username=${ACCOUNT_IDS[actor]}]`));
    await wait(a => document.querySelector('.l-login-preview')?.dataset.actor === String(a), actor);
    await wait(() => { const im=document.querySelector('.l-login-character'); return im?.complete && im.naturalWidth > 0; });
    const grid = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('[role=radio][data-username]')];
      const rect = el => { const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}; };
      return {buttons:buttons.map(el=>({username:el.dataset.username,checked:el.getAttribute('aria-checked'),...rect(el)})),preview:{actor:document.querySelector('.l-login-preview')?.dataset.actor,src:document.querySelector('.l-login-character')?.currentSrc,alt:document.querySelector('.l-login-character')?.alt},scrollWidth:document.documentElement.scrollWidth};
    });
    assert.equal(grid.buttons.length, 8);
    assert.deepEqual(grid.buttons.map(b=>b.username), [...ACCOUNT_IDS]);
    const rows = new Set(grid.buttons.map(b=>Math.round(b.y)));
    const columns = new Set(grid.buttons.map(b=>Math.round(b.x)));
    assert.equal(rows.size, 2, 'eight login radios form two rows');
    assert.equal(columns.size, 4, 'eight login radios form four columns');
    for (const y of rows) assert.equal(grid.buttons.filter(b=>Math.round(b.y)===y).length,4);
    for (const b of grid.buttons) {
      assert.ok(b.x>=0 && b.y>=0 && b.right<=VIEWS[view].width+1 && b.bottom<=VIEWS[view].height+1, `${b.username} is visible`);
      assert.ok(b.width>=44 && b.height>=44, `${b.username} has a usable target`);
    }
    assert.equal(grid.buttons.find(b=>b.username===ACCOUNT_IDS[actor]).checked, 'true');
    assert.ok(grid.preview.alt.includes(ACTORS[actor]));
    if (actor===7) assert.match(grid.preview.src,/yuchan/);
    assert.ok(grid.scrollWidth<=VIEWS[view].width+1, 'login has no horizontal overflow');
    row.steps.loginGrid = grid;
    await shot('login');

    console.log(`${view} actor ${actor}: sign in and own room`);
    await login(H,server.url,{navigate:false});
    await wait(() => !!document.querySelector('.l-world-header'),null,90000);
    await roomReady();
    assert.equal(H.world().life.actors[H.uid], actor, 'real mock-engine identity is the selected actor');
    assert.equal(row.authLogins.at(-1)?.username, ACCOUNT_IDS[actor]);
    const room = await page.evaluate(() => ({...document.querySelector('[data-testid=bedroom-3d]').dataset,header:document.querySelector('.l-world-header').innerText}));
    assert.ok(room.header.includes(`${ACTORS[actor]}의 집`));
    row.steps.ownRoom = room;
    await shot('room');

    if (actor===7) {
      console.log(`${view} actor ${actor}: walk to wardrobe, switch five outfits`);
      const closet = roomOfHouse(0).fixtures.find(f=>f.action==='dress');
      const destination = {x:(closet.x0+closet.x1)/2,z:closet.z1+0.8};
      await page.evaluate(p=>window.dispatchEvent(new CustomEvent('bumtadew:room-go',{detail:p})),destination);
      await wait(() => document.querySelector('[data-testid=bedroom-3d]')?.dataset.action==='dress',null,60000);
      await page.locator('[data-testid=bedroom-3d]').focus();
      await page.keyboard.press('KeyE');
      await wait(() => !!document.querySelector('[data-testid=wardrobe-scene]'),null,60000);
      const available = ['classic','street','smart','akatsuki','maid'];
      assert.deepEqual(collectionsFor(actor).map(c=>c.id),available);
      // Change away from the initial classic outfit first, so every checked
      // outfit causes a real save rather than clicking an unchanged value.
      const expected = ['street','classic','smart','akatsuki','maid'];
      const outfits=row.steps.outfits=[];
      for (const collection of expected) {
        const definition = COLLECTIONS.find(c=>c.id===collection);
        const button=page.locator('.l-outfits button').filter({has:page.locator('strong',{hasText:definition.name})});
        assert.equal(await button.count(),1,definition.name);
        await button.click();
        await wait(name => document.querySelector('.l-mirror-top strong')?.textContent===name,definition.name);
        await wait(() => {
          const c=document.querySelector('[data-testid=wardrobe-preview] canvas');
          if(!c || document.querySelector('[data-testid=wardrobe-preview] .avatar-error')) return false;
          const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
          let n=0; for(let i=3;i<p.length;i+=4) if(p[i]>20)n++;
          return n>1000;
        },null,60000);
        await fixtureWait(()=>H.saved()?.looks[actor]?.collection===collection,`saved own ${collection}`);
        const avatar=await page.evaluate(() => {
          const c=document.querySelector('[data-testid=wardrobe-preview] canvas');
          return {label:c.getAttribute('aria-label'),pixels:c.toDataURL(),sources:window.__eighthSpriteSources(c)};
        });
        row.steps.lastAvatar={collection,label:avatar.label,sources:avatar.sources,savedActor:H.saved().actor,savedCollection:H.saved().looks[actor].collection};
        assert.equal(avatar.label,'유찬 2D 캐릭터');
        assert.ok(avatar.sources.some(url=>/yuchan-atlas/.test(url)), `own atlas reaches ${collection} preview pixels`);
        assert.ok(avatar.sources.every(url=>/yuchan/.test(url)), `no other friend's art reaches ${collection} preview`);
        const hash=createHash('sha256').update(avatar.pixels).digest('hex');
        outfits.push({collection,name:definition.name,hash,sources:avatar.sources.map(url=>url.replace(server.url,'/')),savedActor:H.saved().actor,savedCollection:H.saved().looks[actor].collection});
        await shot(`outfit-${collection}`);
      }
      assert.equal(new Set(outfits.map(o=>o.hash)).size,5,'five outfits have distinct rendered pixels');
      row.steps.outfits=outfits;
      assert.ok(await H.clickSel('[data-testid=wardrobe-exit]'));
      await roomReady();
    }

    console.log(`${view} actor ${actor}: own farm door and eight map pins`);
    assert.ok(await H.clickSel('[data-testid=village-return]'));
    await wait(() => {const d=document.querySelector('[data-testid=area-3d]')?.dataset; return d?.area==='farm' && d.loadState==='ready';},null,180000);
    await wait(() => !document.querySelector('[data-testid=scene-fade].is-active'));
    const farm=await page.evaluate(()=>({...document.querySelector('[data-testid=area-3d]').dataset}));
    const start=farmStart(actor);
    assert.ok(Math.hypot(Number(farm.avatarX)-start.x,Number(farm.avatarZ)-start.z)<1.1,'exiting own room lands by the unchanged own house');
    assert.equal(farmHouse(actor).x,actor===7?54.4:13.6);
    row.steps.farm={...farm,expectedStart:start,house:farmHouse(actor),field:farmField(actor)};
    await shot('farm');
    if(await page.locator('[data-testid=minimap-toggle]').getAttribute('aria-expanded')==='false') await H.clickSel('[data-testid=minimap-toggle]');
    await wait(()=>document.querySelectorAll('[data-minimap-place^="home-"]').length===8);
    const pins=await page.locator('[data-minimap-place^="home-"]').evaluateAll(els=>els.map(el=>({id:el.dataset.minimapPlace,label:el.getAttribute('aria-label'),style:el.getAttribute('style')})));
    assert.deepEqual(pins.map(p=>p.id).sort(),[...ACTORS.keys()].map(a=>`home-${a}`).sort());
    assert.ok(pins.find(p=>p.id==='home-7').label.includes('유찬'));
    row.steps.map={count:pins.length,pins};
    await shot('minimap');
    if(actor===7) {
      await H.clickSel('[data-minimap-place=home-7]');
      await wait(p => { const d=document.querySelector('[data-testid=area-3d]')?.dataset; return d?.action==='farm' && d.walking==='false' && Math.hypot(Number(d.avatarX)-p.x,Number(d.avatarZ)-p.z)<0.4; },farmHouse(actor).door,60000);
      await page.locator('[data-testid=area-3d]').focus();
      await page.keyboard.press('KeyE');
      await roomReady();
      row.steps.homeReturn=true;
      await shot('home-return');
    }
    await Promise.all(responseWork);
    row.pageErrors=[...H.errors];
    row.blockedExternalHosts=[...H.external];
    assert.equal(row.pageErrors.length,0,JSON.stringify(row.pageErrors));
    assert.equal(row.failedLocalRequests.length,0,JSON.stringify(row.failedLocalRequests));
    assert.equal(row.apiFailures.length,0,JSON.stringify(row.apiFailures));
    row.status='passed';
    console.log(`${view} actor ${actor}: passed`);
  } catch(error) {
    row.status='failed'; row.error=error.stack;
    row.pageErrors=[...H.errors]; row.blockedExternalHosts=[...H.external];
    await shot('failure').catch(()=>{});
    throw error;
  } finally {
    persist();
    await H.close();
  }
}

try {
  browser=await launchBrowser();
  for(const view of views) for(const actor of actors) await run(view,actor);
  report.status='passed';
} catch(error) {
  report.status='failed'; report.error=error.stack;
  process.exitCode=1;
} finally {
  report.finishedAt=new Date().toISOString();
  persist();
  await browser?.close().catch(()=>{});
  await server.close();
  console.log(JSON.stringify({status:report.status,mockOnly:true,runs:report.runs.map(r=>({view:r.view,actor:r.actor,status:r.status,outfits:r.steps.outfits?.length??0,screenshots:r.screenshots.length})),summary:path.join(out,'summary.json')},null,2));
}
