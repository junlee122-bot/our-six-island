// 나무결 가구점 furniture paintings (2026-10-02): every 'furn-*' piece has art,
// the painted web copies match the record written by
// `node scripts/optimize-assets.mjs furniture`, the eight new pieces are priced
// and sold where they should be, and rooms saved before the change still read.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { ROOM, ROOM_CATALOG, catalogEntry } from '../app/lounge-bedroom-catalog.ts';
import { FURNITURE_ART, FURNITURE_THUMBS, PAINTED_FURNITURE } from '../app/lounge-furniture-art.ts';
import { FURNITURE, FURNITURE_BY_REF, BASIC_FURNITURE_PRICES } from '../app/lounge-items.ts';
import { emptyLife } from '../app/lounge-life.ts';
import { luxuryStock, shopStock } from '../app/lounge-life-plus.ts';
import { readBedroom, readBedroomStrict } from '../app/lounge-bedroom-data.ts';
import { whereFrom } from '../app/lounge-life-ui.ts';

const PUBLIC = new URL('../public', import.meta.url);
const file = (url) => new URL('.' + url, PUBLIC + '/');
const sha = (url) => crypto.createHash('sha256').update(fs.readFileSync(url)).digest('hex').toUpperCase();
const record = JSON.parse(fs.readFileSync(new URL('../public/assets/lounge/furniture-art-generation.json', import.meta.url), 'utf8'));
const DAY = 86_400_000;
const kst = (y, m, d, h = 12) => Date.UTC(y, m - 1, d, h - 9);
const T0 = kst(2026, 10, 1);

const NEW_DAILY = {
  'furn-round-dining-set': 24_000,
  'furn-beanbag': 16_000,
  'furn-hanging-planter': 9_000,
  'furn-cat-tower': 22_000,
  'furn-retro-tv': 20_000,
  'furn-wall-shelf': 10_000,
};
const NEW_LUXURY = { 'furn-marble-fireplace': 230_000, 'furn-najeon-wardrobe': 260_000 };

test('every furn-* piece has room art and a thumbnail; painted ones are files on disk', () => {
  const refs = new Set([...ROOM_CATALOG.map((e) => e.ref), ...FURNITURE.map((f) => f.ref)].filter((r) => r.startsWith('furn-')));
  for (const ref of refs) {
    const entry = catalogEntry(ref);
    assert.ok(entry, `${ref} is in the room catalog`);
    assert.ok(FURNITURE_BY_REF[ref], `${ref} is a furniture item`);
    assert.equal(entry.kind, 'prop', `${ref} is drawn as a painting`);
    // lounge-bedroom-art.ts spreads these into PROP_ART / THUMBNAILS (browser-only imports).
    assert.ok(FURNITURE_ART[ref] && FURNITURE_THUMBS[ref], ref);
  }
  for (const ref of PAINTED_FURNITURE) {
    assert.equal(FURNITURE_ART[ref], `/assets/lounge/furniture/${ref.slice(5)}.webp`);
    assert.ok(fs.existsSync(file(FURNITURE_ART[ref])), ref);
    assert.ok(fs.existsSync(file(FURNITURE_THUMBS[ref])), ref + ' thumb');
  }
  // Pieces without a painting are the 16 craftable ones (drawn SVG).
  for (const ref of refs)
    if (!PAINTED_FURNITURE.includes(ref)) {
      assert.ok(FURNITURE_BY_REF[ref].craft, `${ref} has no painting`);
      assert.match(FURNITURE_ART[ref], /^data:image\/svg\+xml/);
    }
});

test('furniture record: sheet hashes, every cell mapped, web copies hashed at the catalog aspect', async () => {
  const cells = [];
  for (const sheet of record.sheets) {
    assert.equal(sha(new URL('../public/assets/lounge/' + sheet.original, import.meta.url)), sheet.sha256, sheet.original);
    const [cols, rows] = sheet.grid.split('x').map(Number);
    assert.equal(sheet.cells.length, cols * rows);
    for (const cell of sheet.cells) cells.push(cell.replace(/^NEW(?:-LUXURY)?:([a-z0-9-]+).*$/, 'furn-$1'));
  }
  assert.deepEqual([...cells].sort((a, b) => a.localeCompare(b)), [...PAINTED_FURNITURE].sort((a, b) => a.localeCompare(b)));
  assert.deepEqual(Object.keys(record.web).sort((a, b) => a.localeCompare(b)), [...PAINTED_FURNITURE].sort((a, b) => a.localeCompare(b)));
  for (const ref of PAINTED_FURNITURE) {
    const web = record.web[ref],
      entry = catalogEntry(ref);
    assert.equal('/assets/lounge/' + web.file, FURNITURE_ART[ref]);
    assert.equal('/assets/lounge/' + web.thumb, FURNITURE_THUMBS[ref]);
    assert.equal(sha(file(FURNITURE_ART[ref])), web.sha256, ref);
    assert.equal(sha(file(FURNITURE_THUMBS[ref])), web.thumbSha256, ref + ' thumb');
    const meta = await sharp(fs.readFileSync(file(FURNITURE_ART[ref]))).metadata();
    assert.deepEqual([meta.width, meta.height], [web.w, web.h], ref);
    assert.ok(Math.max(meta.width, meta.height) <= 768, ref);
    // The room draws a card w wide and w × aspect tall: the aspect is the catalog's.
    const aspect = entry.mount === 'rug' ? entry.d / entry.w : entry.h / entry.w;
    assert.ok(Math.abs(meta.height / meta.width - aspect) < 0.02, `${ref} ${meta.height / meta.width} vs ${aspect}`);
    const thumb = await sharp(fs.readFileSync(file(FURNITURE_THUMBS[ref]))).metadata();
    assert.deepEqual([thumb.width, thumb.height], [256, 256]);
  }
});

test('mounts: wall hangings hang, the lilac rug lies flat, stands stand; sizes stay sane', () => {
  for (const ref of ['furn-maple-garland', 'furn-project-plaque', 'furn-village-medal', 'furn-wall-shelf', 'furn-lucky-pouch', 'furn-hanging-planter'])
    assert.equal(catalogEntry(ref).mount, 'wall', ref);
  assert.equal(catalogEntry('furn-rug-lilac').mount, 'rug');
  for (const ref of ['furn-festival-kite', 'furn-festival-fan']) assert.equal(catalogEntry(ref).mount, 'small', ref);
  for (const e of ROOM_CATALOG.filter((x) => x.ref.startsWith('furn-'))) {
    assert.ok(e.w >= 0.4 && e.w <= (e.mount === 'rug' ? 3.4 : 2.6), `${e.ref} width ${e.w}`);
    assert.ok(e.h > 0 && e.h <= 2.6, `${e.ref} height ${e.h}`);
    if (e.mount === 'wall') assert.ok(e.h < ROOM.wallHeight - 1, e.ref);
  }
});

test('eight new pieces: 나무결 가구점 daily rotation and the weekly luxury slots', () => {
  for (const [ref, price] of Object.entries(NEW_DAILY)) {
    const f = FURNITURE_BY_REF[ref];
    assert.equal(f.price, price, ref);
    assert.ok(!f.luxury && !f.unsold && !f.basic && !f.season && !f.holiday, ref);
    assert.ok(price >= 5_000 && price <= 40_000, ref);
    assert.ok(catalogEntry(ref).premium);
    assert.equal(whereFrom(ref), '나무결 가구점 오늘의 가구');
  }
  for (const [ref, price] of Object.entries(NEW_LUXURY)) {
    assert.equal(FURNITURE_BY_REF[ref].price, price, ref);
    assert.ok(FURNITURE_BY_REF[ref].luxury);
    assert.equal(whereFrom(ref), '나무결 가구점 이번 주 명품');
  }
  // Luxury prices stay in the old band; daily pieces never reach a basic piece's floor.
  const lux = FURNITURE.filter((f) => f.luxury).map((f) => f.price);
  assert.ok(Math.min(...lux) >= 100_000 && Math.max(...lux) <= 300_000);
  assert.ok(Object.keys(NEW_DAILY).every((r) => !(r in BASIC_FURNITURE_PRICES)));
  // Every daily piece shows up within a few weeks of rotation; luxury pieces never do.
  const life = emptyLife(),
    seen = new Set(),
    seenLux = new Set();
  for (let d = 0; d < 120; d++) {
    for (const i of shopStock(life, T0 + d * DAY).items) seen.add(i.ref);
    for (const f of luxuryStock(life, T0 + d * DAY)) seenLux.add(f.ref);
  }
  for (const ref of Object.keys(NEW_DAILY)) assert.ok(seen.has(ref), ref);
  for (const ref of Object.keys(NEW_LUXURY)) {
    assert.ok(seenLux.has(ref), ref);
    assert.ok(!seen.has(ref), ref);
  }
});

test('where-from hints name the real seller', () => {
  assert.equal(whereFrom('furn-project-plaque'), '마을 공사 완공 보상');
  assert.equal(whereFrom('furn-festival-drum'), '주간 마을 축제 기금 기념품');
  assert.equal(whereFrom('furn-village-medal'), '마을 꾸러미 완성 보상');
  assert.equal(whereFrom('bed'), '나무결 가구점 기본 가구');
  assert.equal(whereFrom('furn-fan'), '나무결 가구점 여름 한정');
  assert.match(whereFrom('furn-plant'), /요리·만들기/);
});

test('rooms saved before the paintings still read: 3D rocking chair, kite and fan on the wall', () => {
  const room = {
    version: 4,
    theme: defaultTheme(),
    wall: 'cream',
    floor: 'oak',
    access: 'friends',
    items: [
      { id: 'rock', kind: 'model', ref: 'furn-rocking-chair', x: 1, z: 1, rotY: 30, scale: 1 },
      { id: 'kite', kind: 'prop', ref: 'furn-festival-kite', x: 2, z: ROOM.minZ, y: 2.2, wall: 'back', rotY: 0, scale: 1 },
      { id: 'fan', kind: 'prop', ref: 'furn-festival-fan', x: -2, z: ROOM.minZ, y: 2, wall: 'back', rotY: 0, scale: 1 },
      { id: 'pouch', kind: 'prop', ref: 'furn-lucky-pouch', x: 0, z: ROOM.minZ, y: 2, wall: 'back', rotY: 0, scale: 1 },
    ],
  };
  for (const read of [readBedroomStrict, readBedroom]) {
    const out = read(room, 0);
    assert.equal(out.items.length, 4);
    const by = Object.fromEntries(out.items.map((i) => [i.id, i]));
    assert.equal(by.rock.kind, 'prop');
    for (const id of ['kite', 'fan']) {
      assert.equal(by[id].wall, undefined);
      assert.equal(by[id].y, undefined);
      assert.ok(by[id].z > ROOM.minZ);
    }
    assert.equal(by.pouch.wall, 'back');
    // Read twice: the normalized room reads the same.
    assert.deepEqual(read(out, 0), out);
  }
  // Other kind mismatches still fail closed.
  assert.throws(() => readBedroomStrict({ ...room, items: [{ ...room.items[0], ref: 'furn-fan' }] }, 0));
});

function defaultTheme() {
  return readBedroom(undefined, 0).theme;
}
