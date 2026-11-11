import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { YUCHAN_ACTOR, YUCHAN_ATLAS, YUCHAN_OUTFIT_CELL } from '../app/lounge-yuchan.ts';
import { RIG_CELLS } from '../app/lounge-rig-data.ts';

test('Yuchan has his own five complete wardrobe cells and matching walking rigs', async () => {
  assert.equal(YUCHAN_ACTOR, 7);
  assert.equal(YUCHAN_ATLAS.outfits, 5);
  assert.deepEqual(Object.values(YUCHAN_OUTFIT_CELL), [0, 1, 2, 3, 4]);
  const { data, info } = await sharp(fileURLToPath(new URL('../public/assets/lounge/yuchan-atlas.webp', import.meta.url))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cw = info.width / YUCHAN_ATLAS.columns, ch = info.height / YUCHAN_ATLAS.rows;
  const heights = [];
  for (let i = 0; i < YUCHAN_ATLAS.outfits; i++) {
    const rig = RIG_CELLS[`yuchan:${i}`];
    assert.ok(rig, `outfit ${i} has its own rig`);
    assert.equal(rig.legs.length, 2);
    assert.equal(rig.mode, i >= 3 ? 'hem' : 'legs');
    let y0 = ch, y1 = 0, opaque = 0;
    const left = Math.floor((i % 3) * cw), top = Math.floor(i / 3) * ch;
    for (let y = 0; y < ch; y++) for (let x = 0; x < Math.floor(cw); x++) {
      const k = ((top + y) * info.width + left + x) * 4;
      const r = data[k], g = data[k + 1], b = data[k + 2];
      const background = r > g * 1.45 && b > g * 1.45 && r > b * .62 && b > r * .72 && Math.min(r, b) > 32;
      if (data[k + 3] && !background) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); opaque++; }
    }
    assert.ok(opaque > cw * ch * .15, `outfit ${i} is not a blank spare slot`);
    assert.ok(y0 > 0 && y1 < ch - 1, `outfit ${i} is not cropped at head or feet`);
    heights.push(y1 - y0);
  }
  assert.ok(Math.max(...heights) / Math.min(...heights) < 1.08, 'outfits keep a consistent full-body scale');
});

test('the login portrait has a transparent backdrop and the same 440×540 canvas as existing friends', async () => {
  const portrait = await sharp(fileURLToPath(new URL('../public/assets/lounge/login/yuchan.webp', import.meta.url))).metadata();
  assert.equal(portrait.width, 440);
  assert.equal(portrait.height, 540);
  assert.equal(portrait.hasAlpha, true);
});
