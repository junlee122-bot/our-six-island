// Pixel checks of every character sprite the game draws (character QA
// 2026-10-01): no key colour left on the silhouette, no figure cut by its
// frame, the residents' chibis standing on a friend's feet line and every
// file a character references present. Decoded with sharp (a dev
// dependency), about two seconds for the whole set.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import { LOUNGE_ASSETS } from '../app/lounge-assets.ts';
import { HOST_CELL, HOST_SHEET } from '../app/lounge-host-sprites.ts';
import { NPC_CHIBI } from '../app/lounge-npc-chibi.ts';
import { NPCS, NPC_IDS } from '../app/lounge-npc-data.ts';

const layouts = JSON.parse(fs.readFileSync(new URL('../app/lounge-motion-layout.json', import.meta.url), 'utf8'));
const file = (url) => new URL(`../public${url}`, import.meta.url);

async function rgba(url) {
  const { data, info } = await sharp(fs.readFileSync(file(url))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Opaque box (alpha > 40) of a rectangle of the image. */
function box(img, x0 = 0, y0 = 0, w = img.width, h = img.height) {
  let l = Infinity,
    r = -1,
    t = Infinity,
    b = -1;
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++)
      if (img.data[(y * img.width + x) * 4 + 3] > 40) {
        l = Math.min(l, x - x0);
        r = Math.max(r, x - x0);
        t = Math.min(t, y - y0);
        b = Math.max(b, y - y0);
      }
  return r < 0 ? null : { l, r, t, b };
}

/**
 * Visible pixels on the silhouette (within 2 px of transparency) that are
 * still the key colour: magenta (min(R, B) − G > 60) or green
 * (G − max(R, B) > 70). A keyed edge has none; a pink or green halo has
 * thousands.
 */
function rimKey(img, key = 'magenta') {
  const { data, width, height } = img;
  const clear = (x, y) => x < 0 || y < 0 || x >= width || y >= height || data[(y * width + x) * 4 + 3] < 24;
  let n = 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 24) continue;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const keyed = key === 'magenta' ? Math.min(r, b) - g > 60 && r > 120 && b > 120 : g - Math.max(r, b) > 70 && g > 140;
      if (keyed && (clear(x - 2, y) || clear(x + 2, y) || clear(x, y - 2) || clear(x, y + 2))) n++;
    }
  return n;
}

test('every resident and host references art that exists', () => {
  for (const id of NPC_IDS) {
    const art = NPCS[id].art;
    if (art.kind === 'sheet') assert.ok(fs.existsSync(file(HOST_SHEET[art.host])), `${id} sheet`);
    if (art.kind === 'image') {
      assert.ok(fs.existsSync(file(art.asset)), `${id} tall art`);
      if (art.portrait) assert.ok(fs.existsSync(file(art.portrait)), `${id} portrait`);
    }
    const chibi = NPC_CHIBI[id];
    if (chibi) assert.ok(fs.existsSync(file(chibi.asset)), `${id} chibi`);
  }
  for (const [key, url] of Object.entries(LOUNGE_ASSETS)) assert.ok(fs.existsSync(file(url)), `LOUNGE_ASSETS.${key} → ${url}`);
});

test('chibi residents fill 94% of their canvas, centred, soles on the friends’ 97% line, no key halo', async () => {
  for (const [id, chibi] of Object.entries(NPC_CHIBI)) {
    const img = await rgba(chibi.asset);
    assert.deepEqual([img.width, img.height], [chibi.w, chibi.h], `${id} size`);
    const b = box(img);
    assert.ok(b, `${id} is empty`);
    assert.ok(Math.abs(b.b / img.height - 0.97) < 0.006, `${id} soles at ${(b.b / img.height).toFixed(3)} of the height, not 0.97: it floats or sinks`);
    assert.ok(Math.abs((b.b - b.t) / img.height - 0.94) < 0.01, `${id} is ${((b.b - b.t) / img.height).toFixed(3)} of the height, not 0.94`);
    assert.ok(Math.abs((b.l + b.r) / 2 / img.width - 0.5) < 0.02, `${id} is off centre`);
    assert.ok(b.l > 0 && b.t > 0 && b.r < img.width - 1, `${id} touches the canvas edge (cut off)`);
    assert.ok(rimKey(img) <= 20, `${id} has a magenta rim`);
    // 쓰레쉬's ghost-fire wisps are green on purpose; the green-keyed pair is checked for green.
    if (id === 'beatrice' || id === 'bocchi') assert.ok(rimKey(img, 'green') <= 20, `${id} has a green rim`);
  }
});

test('host pose sheets: six figures on the 648 px sole line, inside their cells, no magenta rim', async () => {
  for (const [host, url] of Object.entries(HOST_SHEET)) {
    const img = await rgba(url);
    assert.deepEqual([img.width, img.height], [HOST_CELL.w * HOST_CELL.cols, HOST_CELL.h * HOST_CELL.rows], host);
    for (let c = 0; c < HOST_CELL.cols * HOST_CELL.rows; c++) {
      const x0 = (c % HOST_CELL.cols) * HOST_CELL.w,
        y0 = Math.floor(c / HOST_CELL.cols) * HOST_CELL.h;
      const b = box(img, x0, y0, HOST_CELL.w, HOST_CELL.h);
      assert.ok(b, `${host} cell ${c} is empty`);
      assert.ok(Math.abs(b.b - (HOST_CELL.foot - 1)) <= 3, `${host} cell ${c}: soles at ${b.b}, not ${HOST_CELL.foot}`);
      assert.ok(b.l > 0 && b.t > 0 && b.r < HOST_CELL.w - 1, `${host} cell ${c} is cut by its cell`);
      assert.ok(b.b - b.t >= HOST_CELL.figure * 0.95, `${host} cell ${c} is too small`);
    }
    assert.ok(rimKey(img) <= 40, `${host} sheet has a magenta rim (${rimKey(img)} px)`);
  }
});

test('tall dialogue art, portraits and service sprites carry no magenta rim; full bodies are not cut', async () => {
  for (const id of NPC_IDS) {
    const art = NPCS[id].art;
    if (art.kind !== 'image') continue;
    const tall = await rgba(art.asset);
    const b = box(tall);
    assert.ok(b && b.t > 0 && b.b < tall.height - 1 && b.l > 0 && b.r < tall.width - 1, `${id} tall art is cut by its canvas`);
    assert.ok(Math.abs(b.b / tall.height - art.foot) < 0.012, `${id} soles at ${(b.b / tall.height).toFixed(3)}, art.foot says ${art.foot}`);
    assert.ok(rimKey(tall) <= 20, `${id} tall art has a magenta rim`);
    if (art.portrait) assert.ok(rimKey(await rgba(art.portrait)) <= 20, `${id} portrait has a magenta rim`);
  }
  for (const url of Object.values(LOUNGE_ASSETS).filter((u) => u.includes('/login/')))
    assert.ok(rimKey(await rgba(url)) <= 20, `${url} has a magenta rim`);
});

test('friends’ walk and run frames: every pose inside its cell, soles on one line', async () => {
  const actors = ['dowon', 'gangjae', 'minseo', 'seungjun', 'minjae', 'jaemin', 'hohyeon'];
  for (const [i, actor] of actors.entries()) {
    const img = await rgba(`/assets/lounge/motion/${actor}.webp`);
    const soles = new Set();
    for (const motion of ['walk', 'run'])
      for (const [k, f] of layouts[i].rows[motion].entries()) {
        const b = box(img, f.x, f.y, f.w, f.h);
        assert.ok(b, `${actor} ${motion} ${k} is empty`);
        assert.ok(b.l > 0 && b.t > 0 && b.r < f.w - 1 && b.b < f.h - 1, `${actor} ${motion} ${k} is cut by its frame`);
        assert.ok(b.b - b.t > f.h * 0.75, `${actor} ${motion} ${k} is too small (a cropped pose?)`);
        soles.add(b.b);
      }
    assert.ok(Math.max(...soles) - Math.min(...soles) <= 2, `${actor}: soles move between frames (${[...soles].join(', ')})`);
    assert.equal(rimKey(img), 0, `${actor} motion sheet has a magenta rim`);
  }
});
