import test from 'node:test';
import assert from 'node:assert/strict';
import { createHairMask, createSkinMask } from '../app/lounge-color.ts';
import {
  collectionsFor,
  COSTUME_COLLECTIONS,
  defaultLook,
  freshLounge,
  readLook,
  readLounge,
} from '../app/lounge-look.ts';
import { accountSave } from '../app/lounge-accounts.ts';
import { LoungeRoom } from '../app/lounge-room.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { readSpriteAtlasCells } from './sprite-atlas-helper.mjs';

test('Akatsuki is a shared costume and survives account, bookmark, local, and multiplayer validation', () => {
  const room = LoungeRoom.hosted(null, newLoungeLedger());
  for (let actor = 0; actor < 7; actor++) {
    const costumes = collectionsFor(actor).filter((c) =>
      COSTUME_COLLECTIONS.includes(c.id),
    );
    assert(costumes.some((c) => c.id === 'akatsuki'));
    if (actor !== 0)
      assert.deepEqual(
        costumes.map((c) => c.id),
        ['akatsuki', 'maid'],
      );
    const look = readLook(
      {
        ...defaultLook(actor),
        collection: 'akatsuki',
        hairstyle: 'buns',
        hairColor: '#334477',
        skinColor: '#a66e4d',
        hat: 'cap',
        glasses: 'round',
      },
      actor,
    );
    assert.equal(look.collection, 'akatsuki');
    assert.equal(look.hairstyle, actor === 0 ? 'buns' : 'signature');
    assert.equal(look.hat, 'none'); // hats were removed; old values read as none
    assert.equal(look.glasses, 'round');
    const save = freshLounge(actor);
    save.looks[actor] = look;
    save.saved = [
      { id: 'akatsuki-' + actor, actor, name: '아카츠키 코디', look },
    ];
    const account = accountSave(save, actor);
    assert.deepEqual(account.looks[actor], look);
    assert.deepEqual(account.saved[0].look, look);
    assert.deepEqual(
      readLounge(JSON.stringify(account), actor).looks[actor],
      look,
    );
    const id = crypto.randomUUID();
    room.hostedJoin(id, actor, look);
    assert.deepEqual(room.members.get(id).look, look);
  }
});

test('eight real Akatsuki source cells include skin on face, neck, hands and toes without dyeing cloak clouds', () => {
  // Exercise the generated source atlas; runtime WebP is also checked during asset QA.
  const cells = readSpriteAtlasCells(
    new URL('../public/assets/lounge/akatsuki-atlas.png', import.meta.url),
    4,
    2,
  );
  const eyes = [136, 133, 136, 135, 139, 133, 138, 138];
  for (const [cell, data] of cells.entries()) {
    let left = 400,
      right = 0;
    for (let y = 0; y < 480 * 0.47; y++)
      for (let x = 0; x < 400; x++) {
        const k = (y * 400 + x) * 4;
        if (
          data[k + 3] > 20 &&
          data[k + 2] > Math.max(data[k], data[k + 1]) * 1.17
        ) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
      }
    const head = Math.max(40, right - left),
      cx = (left + right) / 2;
    const anchors = {
      cx,
      head,
      eyes: eyes[cell],
      collared: true,
      bareToes: true,
      darkHighCollar: true,
    };
    const skin = createSkinMask(data, 400, 480, anchors),
      hair = createHairMask(data, 400, 480, anchors);
    const regions = {
      face: (x, y) =>
        Math.abs(x - cx) < head * 0.1 &&
        y > eyes[cell] + head * 0.08 &&
        y < eyes[cell] + head * 0.22,
      neck: (x, y) =>
        Math.abs(x - cx) < head * 0.1 &&
        y > eyes[cell] + head * 0.25 &&
        y < eyes[cell] + head * 0.34,
      leftHand: (x, y) =>
        x < cx - head * 0.26 && x > cx - head * 0.65 && y > 285 && y < 365,
      rightHand: (x, y) =>
        x > cx + head * 0.26 && x < cx + head * 0.65 && y > 285 && y < 365,
      toes: (x, y) => Math.abs(x - cx) < head * 0.7 && y > 438 && y < 464,
    };
    for (const [name, region] of Object.entries(regions)) {
      let count = 0,
        selected = 0;
      for (let y = 0; y < 480; y++)
        for (let x = 0; x < 400; x++) {
          if (!region(x, y)) continue;
          const p = y * 400 + x,
            k = p * 4,
            r = data[k],
            g = data[k + 1],
            b = data[k + 2];
          const toeHighlight =
            name === 'toes' &&
            r >= 160 &&
            g >= 120 &&
            r > g &&
            g >= b &&
            r - b >= 6;
          const normalSkin =
            r >= 140 && g >= 90 && r - g >= 18 && g - b >= 17 && g / r >= 0.62;
          if (data[k + 3] < 180 || !(toeHighlight || normalSkin)) continue;
          count++;
          selected += skin.pixels[p];
        }
      assert(count >= 4, 'source ' + name + ' missing in cell ' + cell);
      assert(
        selected / count > 0.9,
        'skin coverage ' +
          name +
          ' cell ' +
          cell +
          ': ' +
          selected +
          '/' +
          count,
      );
    }
    let clouds = 0,
      borders = 0;
    for (let y = 215; y < 415; y++)
      for (let x = Math.ceil(cx - head * 0.2); x <= cx + head * 0.2; x++) {
        const p = y * 400 + x,
          k = p * 4,
          r = data[k],
          g = data[k + 1],
          b = data[k + 2];
        if (data[k + 3] < 180) continue;
        const red = r > 100 && g < 110 && b < 110 && r > g * 1.6 && r > b * 1.6;
        const cream =
          r > 170 &&
          g > 160 &&
          b > 130 &&
          r - g < 30 &&
          g - b < 40 &&
          g / r > 0.87;
        if (!red && !cream) continue;
        if (red) clouds++;
        else borders++;
        assert.equal(
          skin.pixels[p],
          0,
          'preserve cloak skin dye ' + cell + ' ' + x + ',' + y,
        );
        assert.equal(
          hair[p],
          0,
          'preserve cloak hair dye ' + cell + ' ' + x + ',' + y,
        );
      }
    assert(
      clouds > 100 && borders > 30,
      'visible red clouds and cream borders in cell ' + cell,
    );
  }
});
