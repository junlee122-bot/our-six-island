import test from 'node:test';
import assert from 'node:assert/strict';
import { createHairMask, createSkinMask } from '../app/lounge-color.ts';
import {
  collectionsFor,
  COLLECTIONS,
  COSTUME_COLLECTIONS,
  defaultLook,
  FEMALE_ACTORS,
  freshLounge,
  readLook,
  readLounge,
  readLoungeStrict,
  WOMEN_COLLECTIONS,
} from '../app/lounge-look.ts';
import { accountSave } from '../app/lounge-accounts.ts';
import { LoungeRoom } from '../app/lounge-room.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { RIG_CELLS } from '../app/lounge-rig-data.ts';
import { readSpriteAtlasCells } from './sprite-atlas-helper.mjs';

const NEW = ['gold-braid', 'cape-coat', 'maid'];

test('금빛 브레이드 · 케이프 코트 are offered to 도원 and 민서 only; 메이드 to all seven', () => {
  assert.deepEqual(FEMALE_ACTORS, [0, 2]);
  assert.deepEqual(WOMEN_COLLECTIONS, ['gold-braid', 'cape-coat']);
  assert(COSTUME_COLLECTIONS.includes('maid'));
  for (const id of NEW) {
    const c = COLLECTIONS.find((x) => x.id === id);
    assert(c && c.name && c.note, id);
  }
  for (let actor = 0; actor < 7; actor++) {
    const ids = collectionsFor(actor).map((c) => c.id);
    assert(ids.includes('maid'), `maid for ${actor}`);
    for (const id of WOMEN_COLLECTIONS)
      assert.equal(ids.includes(id), actor === 0 || actor === 2, `${id} for ${actor}`);
  }
});

test('readLook keeps allowed new outfits and normalizes the rest (server path too)', () => {
  for (let actor = 0; actor < 7; actor++)
    for (const collection of NEW) {
      const look = readLook(
        { ...defaultLook(actor), collection, hairstyle: 'buns', glasses: 'round', clip: true },
        actor,
      );
      const allowed = collection === 'maid' || actor === 0 || actor === 2;
      assert.equal(look.collection, allowed ? collection : 'classic', `${actor} ${collection}`);
      assert.equal(look.hairstyle, actor === 0 ? 'buns' : 'signature');
      assert.equal(look.glasses, 'round');
      assert.equal(look.clip, true);
    }
  // A tampered save that dresses 강재 in the cape coat is repaired by the strict reader.
  const save = freshLounge(1);
  save.looks[1] = { ...save.looks[1], collection: 'cape-coat' };
  save.looks[2] = { ...save.looks[2], collection: 'cape-coat' };
  save.saved = [{ id: 'x', actor: 3, name: '브레이드', look: { collection: 'gold-braid' } }];
  const back = readLoungeStrict(JSON.stringify(save), 1);
  assert.equal(back.looks[1].collection, 'classic');
  assert.equal(back.looks[2].collection, 'cape-coat');
  assert.equal(back.saved[0].look.collection, 'classic');
});

test('new outfits survive account, local and multiplayer validation', () => {
  for (let actor = 0; actor < 7; actor++)
    for (const collection of collectionsFor(actor).map((c) => c.id).filter((id) => NEW.includes(id))) {
      const look = readLook(
        { ...defaultLook(actor), collection, hairColor: '#334477', skinColor: '#a66e4d' },
        actor,
      );
      assert.equal(look.collection, collection);
      const save = freshLounge(actor);
      save.looks[actor] = look;
      save.saved = [{ id: collection + actor, actor, name: '새 옷', look }];
      const account = accountSave(save, actor);
      assert.deepEqual(readLounge(JSON.stringify(account), actor).looks[actor], look);
      assert.deepEqual(account.saved[0].look, look);
      const room = LoungeRoom.hosted(null, newLoungeLedger()),
        id = crypto.randomUUID();
      room.hostedJoin(id, actor, look);
      assert.deepEqual(room.members.get(id).look, look);
    }
});

test('every new atlas cell has a hem rig (skirt, coat or apron stays with the torso)', () => {
  for (let i = 0; i < 6; i++) assert.equal(RIG_CELLS[`ladies:${i}`]?.mode, 'hem', `ladies:${i}`);
  for (let i = 0; i < 8; i++) {
    assert.equal(RIG_CELLS[`maid:${i}`]?.mode, 'hem', `maid:${i}`);
    // The black panels beside the apron are not forearms.
    assert.equal(RIG_CELLS[`maid:${i}`].arms.length, 0, `maid:${i}`);
  }
  // 금빛 브레이드 swings both bare arms or neither.
  for (let i = 0; i < 3; i++) assert([0, 2].includes(RIG_CELLS[`ladies:${i}`].arms.length));
});

// Normalized eye rows used by lounge-sprites.ts (LADIES_EYES / MAID_EYES).
const ATLASES = [
  { file: 'ladies-outfits-atlas', columns: 3, rows: 2, eyes: [133, 132, 130, 134, 132, 130] },
  { file: 'maid-atlas', columns: 4, rows: 2, eyes: [133, 129, 131, 135, 134, 137, 137, 134] },
];
const headOf = (data) => {
  let left = 400,
    right = 0;
  for (let y = 0; y < 480 * 0.47; y++)
    for (let x = 0; x < 400; x++) {
      const k = (y * 400 + x) * 4;
      if (data[k + 3] > 20 && data[k + 2] > Math.max(data[k], data[k + 1]) * 1.17) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  return { head: Math.max(40, right - left), cx: (left + right) / 2 };
};

test('new atlas faces follow the skin colour; gold braid, apron, gloves and coat never do', () => {
  for (const { file, columns, rows, eyes } of ATLASES) {
    const cells = readSpriteAtlasCells(
      new URL(`../public/assets/lounge/${file}.png`, import.meta.url),
      columns,
      rows,
    );
    for (const [cell, data] of cells.entries()) {
      const { head, cx } = headOf(data);
      const bare = file.startsWith('ladies') && cell < 3;
      const anchors = { cx, head, eyes: eyes[cell], collared: true, bareLegs: bare, paleFaceHighlights: true };
      const skin = createSkinMask(data, 400, 480, anchors);
      let face = 0,
        faceSkin = 0,
        garments = 0,
        leaked = 0;
      for (let y = 0; y < 480; y++)
        for (let x = 0; x < 400; x++) {
          const p = y * 400 + x,
            k = p * 4,
            [r, g, b, a] = data.subarray(k, k + 4);
          if (a < 180) continue;
          const skinLike = r >= 140 && g >= 90 && r - g >= 18 && g - b >= 17 && g / r >= 0.62;
          if (
            skinLike &&
            Math.abs(x - cx) < head * 0.1 &&
            y > eyes[cell] + head * 0.08 &&
            y < eyes[cell] + head * 0.22
          ) {
            face++;
            faceSkin += skin.pixels[p];
          }
          // Below the chin: white apron/collar, black cloth, gold braid, brown gloves.
          if (y > eyes[cell] + head * 0.45) {
            const white = r > 225 && g > 225 && b > 215;
            const gold = r > 150 && g > 110 && b < 110 && g - b > 60;
            const dark = r < 70 && g < 70 && b < 70;
            if (white || gold || dark) {
              garments++;
              leaked += skin.pixels[p];
            }
          }
        }
      assert(face > 20 && faceSkin / face > 0.95, `${file} ${cell} face ${faceSkin}/${face}`);
      assert(garments > 2000, `${file} ${cell} garments`);
      assert(leaked / garments < 0.002, `${file} ${cell} garment skin ${leaked}/${garments}`);
      // Hair mask stays on the head: no cloth below the collar turns into hair.
      const hair = createHairMask(data, 400, 480, anchors);
      let clothHair = 0;
      for (let y = Math.round(eyes[cell] + head * 0.45); y < 480; y++)
        for (let x = 0; x < 400; x++) {
          const k = (y * 400 + x) * 4;
          if (hair[y * 400 + x] && data[k + 2] <= Math.max(data[k], data[k + 1]) * 1.12) clothHair++;
        }
      assert.equal(clothHair, 0, `${file} ${cell}`);
      // No garment is blue (blue is reserved for hair). 민서's hair reaches the
      // waist, so her cells are checked by the hair-mask test above instead.
      const longHair = file.startsWith('ladies') ? cell % 3 === 1 : cell === 2;
      let blueCloth = 0;
      for (let y = 300; y < 480; y++)
        for (let x = 0; x < 400; x++) {
          const k = (y * 400 + x) * 4;
          if (
            data[k + 3] > 180 &&
            Math.abs(x - cx) < head * 0.25 &&
            data[k + 2] > 70 &&
            data[k + 2] > Math.max(data[k], data[k + 1]) * 1.4
          )
            blueCloth++;
        }
      if (!longHair) assert(blueCloth < 30, `${file} ${cell} blue cloth ${blueCloth}`);
    }
  }
});

test('bare legs and forearms of 금빛 브레이드 follow the skin colour', () => {
  const cells = readSpriteAtlasCells(
    new URL('../public/assets/lounge/ladies-outfits-atlas.png', import.meta.url),
    3,
    2,
  );
  for (let cell = 0; cell < 3; cell++) {
    const data = cells[cell],
      { head, cx } = headOf(data),
      eyes = ATLASES[0].eyes[cell];
    const skin = createSkinMask(data, 400, 480, {
      cx,
      head,
      eyes,
      collared: true,
      bareLegs: true,
      paleFaceHighlights: true,
    });
    let legs = 0,
      legSkin = 0;
    // Knees/shins between the skirt and the socks.
    for (let y = 340; y < 400; y++)
      for (let x = Math.round(cx - head * 0.4); x < cx + head * 0.4; x++) {
        const k = (y * 400 + x) * 4,
          [r, g, b, a] = data.subarray(k, k + 4);
        if (a < 180 || !(r >= 140 && g >= 90 && r - g >= 18 && g - b >= 17)) continue;
        legs++;
        legSkin += skin.pixels[y * 400 + x];
      }
    assert(legs > 200 && legSkin / legs > 0.9, `cell ${cell} legs ${legSkin}/${legs}`);
  }
});
