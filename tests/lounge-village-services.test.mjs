import test from 'node:test';
import { DISTRICTS } from '../app/lounge-districts.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { VILLAGE_PLACES, VILLAGE_START, villageToNetwork, villageCanWalk, villagePath } from '../app/lounge-village-layout.ts';
import { SHOP_LOTS, SHOP_MODEL_SIZE, shopFit } from '../app/lounge-village-shops-layout.ts';
import { villageFriendPins, villageFriendGroups } from '../app/lounge-village-minimap.ts';
import { villageFoliageTint } from '../app/lounge-village-foliage.ts';

test('salon and bank use bounded models and reachable real entrances', () => {
  for (const [id, lotId, model] of [['wardrobe', 'salon', 'salonBuilding'], ['bank', 'bank', 'bankBuilding']]) {
    const p = VILLAGE_PLACES.find((v) => v.id === id), lot = SHOP_LOTS[lotId];
    assert.deepEqual({ x: p.x, z: p.z, w: p.width, d: p.depth }, lot);
    assert.equal(villageCanWalk(p), false);
    assert.ok(villageCanWalk(p.entry));
    assert.deepEqual(villagePath(VILLAGE_START, p.entry).at(-1), p.entry);
    const fit = shopFit(lotId, model), size = SHOP_MODEL_SIZE[model];
    assert.ok(size.w * fit.scale <= lot.w);
    assert.ok(size.d * fit.scale <= lot.d);
    assert.ok(Math.abs(fit.z + size.d * fit.scale / 2 - (lot.z + lot.d / 2)) < 0.01);
  }
});

test('minimap translates village coordinates but maps interior friends to their building', () => {
  const outdoor = { x: 18, z: 12 }, net = villageToNetwork(outdoor);
  const p = (id, actor, area, extra = {}) => ({ id, actor, area, ...net, ...extra });
  const pins = villageFriendPins([
    p('self', 0, 'village'), p('friend-6', 6, 'village'),
    p('a', 1, 'village'), p('b', 2, 'home', { home: 4 }),
    p('c', 3, 'casino'), p('d', 4, 'wardrobe'), p('e', 5, 'lounge'),
    p('a', 1, 'village'), p('bad', 100, 'village'), p('unknown', 6, 'elsewhere'),
  ], 'self');
  assert.equal(pins.length, 5);
  assert.ok(Math.hypot(pins[0].point.x - outdoor.x, pins[0].point.z - outdoor.z) < 1e-8);
  assert.equal(pins[0].indoor, false);
  // 우리 농장: a friend in a room is in their house on the farm (pinned at the farm gate).
  assert.equal(pins[1].indoor, true);
  assert.deepEqual(pins[1].point, DISTRICTS.farm.gate.stand);
  assert.equal(pins[1].location, '민재의 집');
  for (const [pin, placeId] of [[pins[2], 'casino'], [pins[3], 'wardrobe'], [pins[4], 'hall']]) {
    assert.equal(pin.indoor, true);
    assert.equal(pin.placeId, placeId);
    assert.deepEqual(pin.point, VILLAGE_PLACES.find((v) => v.id === placeId).entry);
  }
});

test('winter tint preserves baked tree bark and resets out of winter', () => {
  for (const tree of ['broadleafTree', 'smallPine', 'shrub', 'meadowGrass']) {
    const tint = villageFoliageTint(tree, 'winter');
    assert.equal(tint.glow, '#000000');
    assert.equal(tint.glowIntensity, 0);
    assert.equal(villageFoliageTint(tree, 'spring'), undefined);
    assert.equal(villageFoliageTint(tree, null), undefined);
  }
  assert.equal(villageFoliageTint('house', 'winter'), undefined);
  assert.ok(villageFoliageTint('broadleafTree', 'autumn').glowIntensity > 0);
});

test('nearby friends share one map button and retain every individual destination', () => {
  const pin = (actor, x, z) => ({ id: `test-${actor}`, actor, point: { x, z }, indoor: false, location: '마을' });
  const pins = [pin(0, 0, 10), pin(6, 0, 10), pin(2, 0.2, 10.1), pin(3, 28, -15)];
  const copy = structuredClone(pins), groups = villageFriendGroups(pins, 2.6);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].friends.map((p) => p.actor), [0, 2, 6]);
  assert.deepEqual(groups.flatMap((g) => g.friends).map((p) => p.id).sort(), pins.map((p) => p.id).sort());
  assert.deepEqual(pins, copy);
  assert.deepEqual(villageFriendGroups([...pins].reverse(), 2.6), groups);
  const separate = [pin(0, 0, 0), pin(1, 8, 0)];
  assert.equal(villageFriendGroups(separate, 2.6).length, 1);
  assert.equal(villageFriendGroups(separate, 4.6).length, 2);
  assert.deepEqual(villageFriendGroups([], 2.6), []);
});

test('new kArchive models retain source originals, credits and valid self-contained web assets', () => {
  const dir = 'public/models/village/life-services/';
  const rec = JSON.parse(fs.readFileSync(dir + 'assets.json', 'utf8'));
  assert.equal(rec.provider, 'kArchive');
  assert.equal(rec.assets.length, 9); // + 붕어·쏘가리·갈치·대구 (낚시 업그레이드)
  for (const asset of rec.assets) {
    assert.match(asset.source, /^https:\/\/karchive\.vibeline\.co\.kr\/models\//);
    for (const [path, hash] of [[dir + asset.file, asset.webSha256], ['public/models/_originals/village/life-services/' + asset.file, asset.sha256]]) {
      const buf = fs.readFileSync(path);
      assert.equal(createHash('sha256').update(buf).digest('hex'), hash);
      assert.equal(buf.toString('ascii', 0, 4), 'glTF');
      const json = JSON.parse(buf.toString('utf8', 20, 20 + buf.readUInt32LE(12)));
      for (const b of [...(json.buffers ?? []), ...(json.images ?? [])]) assert.equal(b.uri, undefined);
    }
    assert.ok(asset.webBytes < asset.bytes);
  }
});
