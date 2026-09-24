import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import {
  readColorHex,
  colorRgb,
  rgbColor,
  createSkinMask,
  createHairMask,
  dyeSkinPixel,
} from '../app/lounge-color.ts';
import {
  defaultLook,
  readLook,
  readLounge,
  freshLounge,
  collectionsFor,
} from '../app/lounge-look.ts';
import { accountSave } from '../app/lounge-accounts.ts';
import { LoungeRoom } from '../app/lounge-room.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';

test('moving fists in front of the chest inherit skin color while a cream shirt stays untouched', () => {
  const width = 200,
    height = 300,
    data = new Uint8ClampedArray(width * height * 4);
  const fill = (x0, y0, w, h, rgb) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++)
        data.set([...rgb, 255], (y * width + x) * 4);
  };
  fill(40, 10, 120, 90, [20, 60, 180]);
  fill(65, 50, 70, 55, [224, 166, 126]);
  fill(65, 112, 75, 100, [241, 228, 198]);
  fill(70, 212, 60, 78, [35, 35, 40]);
  fill(94, 142, 14, 14, [224, 166, 126]);
  const anchors = { cx: 100, eyes: 75, head: 100 };
  const still = createSkinMask(data, width, height, anchors);
  const moving = createSkinMask(data, width, height, {
    ...anchors,
    movingHands: true,
  });
  assert.equal(still.pixels[148 * width + 100], 0);
  assert.equal(moving.pixels[148 * width + 100], 1);
  assert.equal(moving.pixels[180 * width + 100], 0);
  assert.equal(moving.pixels[240 * width + 100], 0);
});
import {
  readAccountDraft,
  restoreAccountDraft,
} from '../app/lounge-cloud-draft.ts';

// Decode the actual transparent atlas without a native image dependency in CI.
function shampooAtlasCells() {
  const file = readFileSync(
    new URL('../public/assets/lounge/dowon-shampoo-atlas.png', import.meta.url),
  );
  assert.equal(file.subarray(1, 4).toString(), 'PNG');
  const width = file.readUInt32BE(16),
    height = file.readUInt32BE(20),
    channels = file[25] === 6 ? 4 : 3;
  assert.equal(file[24], 8);
  assert([2, 6].includes(file[25]));
  assert.equal(file[28], 0);
  const chunks = [];
  for (let i = 8; i < file.length;) {
    const length = file.readUInt32BE(i);
    if (file.toString('ascii', i + 4, i + 8) === 'IDAT')
      chunks.push(file.subarray(i + 8, i + 8 + length));
    i += length + 12;
  }
  const scan = inflateSync(Buffer.concat(chunks)),
    stride = width * channels,
    decoded = new Uint8Array(stride * height);
  assert.equal(scan.length, (stride + 1) * height);
  const paeth = (a, b, c) => {
    const p = a + b - c,
      da = Math.abs(p - a),
      db = Math.abs(p - b),
      dc = Math.abs(p - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = scan[y * (stride + 1)];
    assert(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const at = y * stride + x,
        a = x >= channels ? decoded[at - channels] : 0,
        b = y ? decoded[at - stride] : 0,
        c = y && x >= channels ? decoded[at - stride - channels] : 0;
      const prediction = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][
        filter
      ];
      decoded[at] = scan[y * (stride + 1) + 1 + x] + prediction;
    }
  }
  return [0, 1].map((cell) => {
    const cellWidth = width / 2,
      source = new Uint8ClampedArray(cellWidth * height * 4);
    let left = cellWidth,
      top = height,
      right = 0,
      bottom = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < cellWidth; x++) {
        const from = (y * width + cell * cellWidth + x) * channels,
          to = (y * cellWidth + x) * 4;
        const r = decoded[from],
          g = decoded[from + 1],
          b = decoded[from + 2];
        const magenta =
          r > g * 1.45 &&
          b > g * 1.45 &&
          r > b * 0.62 &&
          b > r * 0.72 &&
          Math.min(r, b) > 32;
        const alpha = magenta ? 0 : channels === 4 ? decoded[from + 3] : 255;
        source.set([r, g, b, alpha], to);
        if (alpha > 30) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    const w = right - left + 1,
      h = bottom - top + 1,
      scale = Math.min(356 / w, 450 / h),
      dx = (400 - w * scale) / 2,
      dy = 465 - h * scale;
    const data = new Uint8ClampedArray(400 * 480 * 4);
    for (let y = 0; y < 480; y++)
      for (let x = 0; x < 400; x++) {
        const sx = (x + 0.5 - dx) / scale + left - 0.5,
          sy = (y + 0.5 - dy) / scale + top - 0.5;
        if (sx < left || sx > right || sy < top || sy > bottom) continue;
        const ix = Math.floor(sx),
          iy = Math.floor(sy),
          fx = sx - ix,
          fy = sy - iy;
        const sum = [0, 0, 0, 0];
        for (const [ox, oy, weight] of [
          [0, 0, (1 - fx) * (1 - fy)],
          [1, 0, fx * (1 - fy)],
          [0, 1, (1 - fx) * fy],
          [1, 1, fx * fy],
        ]) {
          const k =
              (Math.min(height - 1, iy + oy) * cellWidth +
                Math.min(cellWidth - 1, ix + ox)) *
              4,
            alpha = source[k + 3] / 255;
          for (let c = 0; c < 3; c++) sum[c] += source[k + c] * alpha * weight;
          sum[3] += alpha * weight;
        }
        if (sum[3])
          data.set(
            [...sum.slice(0, 3).map((c) => c / sum[3]), sum[3] * 255],
            (y * 400 + x) * 4,
          );
      }
    return data;
  });
}

test('custom colors accept only six hexadecimal digits and RGB channels stay within byte range', () => {
  assert.equal(readColorHex('#Ab03F9'), '#ab03f9');
  for (const invalid of [
    null,
    15,
    {},
    ['#abcdef'],
    '#fff',
    'abcdef',
    '#abcdef00',
    ' #abcdef',
    '#gg1122',
    'red',
    'url(x)',
    '#abcdef\n',
  ])
    assert.equal(readColorHex(invalid), undefined);
  assert.deepEqual(colorRgb('#aB03F9'), [171, 3, 249]);
  assert.equal(rgbColor([0, 128, 255]), '#0080ff');
  for (const invalid of [
    [-1, 0, 0],
    [256, 0, 0],
    [NaN, 0, 0],
    [0.1, 0, 0],
    [0, 0],
  ])
    assert.throws(() => rgbColor(invalid), RangeError);
});

test('legacy looks preserve their defaults and invalid custom color payloads are discarded', () => {
  assert.deepEqual(readLook(defaultLook(0), 0), defaultLook(0));
  const look = readLook(
    {
      ...defaultLook(0),
      hairColor: '#FF8800',
      skinColor: '#704A32',
      arbitrary: 'discard',
    },
    0,
  );
  assert.equal(look.hairColor, '#ff8800');
  assert.equal(look.skinColor, '#704a32');
  assert.equal(look.arbitrary, undefined);
  const clean = readLook(
    { ...look, hairColor: 'var(--color)', skinColor: { hex: '#123456' } },
    0,
  );
  assert.deepEqual(clean, defaultLook(0));
  assert.equal(Object.hasOwn(clean, 'hairColor'), false);
  assert.equal(Object.hasOwn(clean, 'skinColor'), false);
});

test('hair dye follows long hair below the shoulders but leaves blue clothing disconnected from the head', () => {
  const width = 80,
    height = 120,
    data = new Uint8ClampedArray(width * height * 4);
  const fill = (x, y, w, h, color) => {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++)
        data.set([...color, 255], (j * width + i) * 4);
  };
  fill(18, 8, 44, 14, [50, 80, 170]);
  fill(18, 22, 9, 74, [50, 80, 170]); // Long hair continues beside the jacket.
  fill(53, 22, 9, 74, [50, 80, 170]);
  fill(30, 55, 20, 35, [50, 80, 170]); // Same blue, different material.
  fill(31, 32, 6, 2, [50, 80, 170]); // An isolated blue eyebrow is also dyed.
  fill(40, 46, 6, 3, [50, 80, 170]); // A nape lock is separated by an ear outline.
  fill(32, 95, 18, 20, [50, 80, 170]); // Blue denim.
  const mask = createHairMask(data, width, height, {
    cx: 40,
    eyes: 38,
    head: 44,
  });
  for (const [x, y] of [
    [20, 15],
    [20, 90],
    [58, 90],
    [33, 32],
    [42, 47],
  ])
    assert.equal(mask[y * width + x], 1, `hair ${x},${y}`);
  for (const [x, y] of [
    [40, 70],
    [40, 100],
    [0, 0],
  ])
    assert.equal(mask[y * width + x], 0, `clothing or background ${x},${y}`);
});

test('custom colors survive local restore, account save validation, and saved outfit restore', () => {
  const save = freshLounge(0);
  const look = readLook(
    {
      ...save.looks[0],
      collection: 'shampoo',
      hairstyle: 'buns',
      hairColor: '#6b20e0',
      skinColor: '#8f593e',
    },
    0,
  );
  save.looks[0] = look;
  save.saved = [
    { id: 'color-look', actor: 0, name: '직접 만든 코디', look: { ...look } },
  ];
  const local = readLounge(JSON.stringify(save), 0);
  const account = accountSave(save, 0);
  assert.deepEqual(local.looks[0], look);
  assert.deepEqual(local.saved[0].look, look);
  assert.deepEqual(account.looks[0], look);
  assert.deepEqual(account.saved[0].look, look);
  const injected = accountSave(
    { ...save, looks: [{ ...look, hairColor: '#abc', skinColor: '<script>' }] },
    0,
  );
  assert.equal(injected.looks[0].hairColor, undefined);
  assert.equal(injected.looks[0].skinColor, undefined);
  const draft = readAccountDraft(JSON.stringify(save), 0, freshLounge(0));
  assert.deepEqual(
    restoreAccountDraft(draft, 0, freshLounge(0)).looks[0],
    look,
  );
  const legacyDraft = { ...save, looks: [defaultLook(0)] };
  delete legacyDraft.bedroom;
  const pending = readAccountDraft(JSON.stringify(legacyDraft), 0, save);
  assert.equal(Object.hasOwn(pending.value, 'bedroom'), false);
  assert.equal(
    restoreAccountDraft(pending, 0, save).looks[0].hairColor,
    undefined,
  );
});

test('skin mask selects face and lower hands while preserving eyes, outlines and warm clothing', () => {
  const width = 100,
    height = 160,
    data = new Uint8ClampedArray(width * height * 4);
  const fill = (left, top, w, h, color) => {
    for (let y = top; y < top + h; y++)
      for (let x = left; x < left + w; x++)
        data.set([...color, 255], (y * width + x) * 4);
  };
  fill(49, 5, 2, 150, [30, 30, 30]);
  fill(31, 25, 38, 35, [30, 30, 30]);
  fill(33, 27, 34, 31, [254, 216, 172]);
  fill(39, 38, 6, 4, [255, 255, 255]);
  fill(40, 39, 3, 2, [111, 67, 38]);
  fill(34, 75, 32, 45, [210, 157, 106]);
  fill(12, 89, 12, 8, [251, 220, 165]); // Warm cuff, above the hand.
  fill(12, 106, 12, 13, [251, 220, 165]);
  fill(76, 106, 12, 13, [251, 220, 165]);
  fill(25, 70, 8, 15, [254, 216, 172]); // Exposed upper arm in a sleeveless look.
  fill(37, 132, 9, 10, [254, 216, 172]);
  fill(37, 13, 20, 9, [49, 84, 172]);
  fill(39, 125, 22, 10, [32, 179, 173]);
  const mask = createSkinMask(data, width, height, {
    cx: 50,
    eyes: 40,
    head: 50,
  });
  const at = (x, y) => mask.pixels[y * width + x];
  assert.equal(at(38, 50), 1);
  assert.equal(at(17, 112), 1);
  assert.equal(at(81, 112), 1);
  for (const [x, y] of [
    [17, 92],
    [50, 95],
    [40, 39],
    [43, 38],
    [31, 32],
    [43, 17],
    [48, 130],
    [0, 0],
  ])
    assert.equal(at(x, y), 0, `preserve non-skin pixel ${x},${y}`);
  const target = [112, 70, 42];
  const light = dyeSkinPixel(254, 216, 172, target, mask.luminance);
  const shade = dyeSkinPixel(205, 169, 131, target, mask.luminance);
  assert(light.every((value, index) => value > shade[index]));
  assert(light.every((value) => value >= 0 && value <= 255));
  assert.equal(at(38, 140), 0, 'covered legs stay untouched by default');
  assert.equal(at(28, 75), 0, 'covered shoulders stay untouched by default');
  const sleeveless = createSkinMask(data, width, height, {
    cx: 50,
    eyes: 40,
    head: 50,
    bareShoulders: true,
  });
  assert.equal(
    sleeveless.pixels[75 * width + 28],
    1,
    'sleeveless arms include disconnected upper-arm highlights',
  );
  const collared = createSkinMask(data, width, height, {
    cx: 50,
    eyes: 40,
    head: 50,
    collared: true,
  });
  assert.equal(
    collared.pixels[55 * width + 45],
    0,
    'warm collar edges below the face are not skin',
  );
  const bareLegs = createSkinMask(data, width, height, {
    cx: 50,
    eyes: 40,
    head: 50,
    bareLegs: true,
  });
  assert.equal(
    bareLegs.pixels[140 * width + 38],
    1,
    'shorts and skirt styles include exposed legs',
  );
});

test('pale hand highlights are recovered without selecting cream cuffs or trousers', () => {
  const width = 100,
    height = 160,
    data = new Uint8ClampedArray(width * height * 4);
  const fill = (x, y, w, h, color) => {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++)
        data.set([...color, 255], (j * width + i) * 4);
  };
  fill(49, 5, 2, 150, [30, 30, 30]);
  fill(33, 27, 34, 31, [254, 190, 140]);
  fill(74, 106, 5, 11, [254, 235, 204]);
  fill(74, 98, 5, 7, [254, 235, 204]);
  fill(74, 105, 5, 1, [30, 30, 30]); // The garment outline separates the cuff.
  fill(64, 119, 9, 23, [254, 235, 204]);
  const mask = createSkinMask(data, width, height, {
    cx: 50,
    eyes: 40,
    head: 50,
  });
  assert.equal(mask.pixels[112 * width + 76], 1);
  assert.equal(mask.pixels[104 * width + 76], 0);
  assert.equal(mask.pixels[129 * width + 69], 0);
});

test('both transparent Shampoo atlas cells dye bare arms and neck while preserving gold and ivory cloth', () => {
  for (const [cell, data] of shampooAtlasCells().entries()) {
    const mask = createSkinMask(data, 400, 480, {
      cx: 199.5,
      head: [183, 193][cell],
      eyes: [113, 119][cell],
      collared: true,
      shortSleeveTunic: true,
    });
    for (const [x, y] of [
      [149, 235],
      [135, 270],
      [132, 290],
      [250, 235],
      [263, 270],
      [266, 290],
      [200, 143],
      [200, 164],
    ]) {
      assert(
        data[(y * 400 + x) * 4 + 3] > 200,
        `source skin is opaque: cell ${cell}, ${x},${y}`,
      );
      assert.equal(
        mask.pixels[y * 400 + x],
        1,
        `recolor source skin: cell ${cell}, ${x},${y}`,
      );
    }
    for (const [x, y] of [
      [155, 218],
      [177, 204],
      [166, 292],
      [165, 351],
      [224, 400],
    ])
      assert.equal(
        mask.pixels[y * 400 + x],
        0,
        `preserve trim and trousers: cell ${cell}, ${x},${y}`,
      );
  }
});

test('Shampoo outfit belongs to Dowon and custom colors are sanitized in shared room looks', () => {
  assert(collectionsFor(0).some((collection) => collection.id === 'shampoo'));
  for (let actor = 1; actor < 7; actor++) {
    assert(
      !collectionsFor(actor).some((collection) => collection.id === 'shampoo'),
    );
    assert.equal(
      readLook({ collection: 'shampoo', hairstyle: 'buns' }, actor).collection,
      'classic',
    );
  }
  const room = LoungeRoom.hosted(null, newLoungeLedger());
  const id = crypto.randomUUID();
  const look = {
    ...defaultLook(0),
    collection: 'shampoo',
    hairColor: '#ABCDEF',
    skinColor: '#765432',
  };
  room.hostedJoin(id, 0, look);
  assert.equal(room.members.get(id).look.hairColor, '#abcdef');
  assert.equal(room.members.get(id).look.skinColor, '#765432');
});
