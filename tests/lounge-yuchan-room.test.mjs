import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultBedroom, DEFAULT_BED, readBedroom, roomConflicts, roomShape, roomUnlocks, setActiveRoomShape } from '../app/lounge-bedroom-data.ts';
import { BEDROOM_THEMES, bedroomTheme } from '../app/lounge-bedroom-themes.ts';
import { canWalk, findWalkPath, roomObstacles, walkStart } from '../app/lounge-bedroom-navigation.ts';
import { freshLounge } from '../app/lounge-look.ts';
import { accountSave, serverAccountSave, lifeUnlocksOf, furniturePolicyOf, protectProfileFurniture, friendVisitView } from '../app/lounge-accounts.ts';
import { ensureLifeMember, readLife } from '../app/lounge-life.ts';
import { yuchanBedroom, applyYuchanRoom, canApplyYuchanRoom, yuchanRoomSpots, yuchanRoomSpotAt, withYuchanRoomUnlocks } from '../app/lounge-yuchan-room.ts';
import { ROOMS_RESET_ID } from '../app/lounge-rooms-reset.ts';

const oldRoom = (extra = {}) => ({ version: 4, theme: 'miku', wall: 'cream', floor: 'oak', access: 'friends', items: [{ ...DEFAULT_BED }], ...extra });
const duplicate = (room, ref, n = 1) => ({ ...room, items: [...room.items, ...Array.from({ length: n }, (_, i) => ({ ...room.items.find((v) => v.ref === ref), id: `copy-${room.items.length + i}` }))] });

test('only new Yuchan rooms receive the warm set, without changing the seven old model houses', () => {
  assert.equal(BEDROOM_THEMES.length, 7);
  for (let actor = 0; actor < 7; actor++) {
    assert.deepEqual(defaultBedroom(actor), { version: 4, theme: BEDROOM_THEMES[actor].id, wall: 'cream', floor: 'oak', access: 'friends', items: [{ ...DEFAULT_BED }] });
  }
  const room = defaultBedroom(7);
  assert.equal(room.theme, 'basecamp');
  assert.equal(bedroomTheme(7).title, '느긋한 베이스캠프');
  assert.ok(room.items.length > 8 && room.items.length < 20);
  assert.deepEqual(readBedroom(undefined, 7), room);
  room.items[0].x = 0;
  assert.equal(defaultBedroom(7).items[0].x, DEFAULT_BED.x, 'defaults never share mutable items');
});

test('saved and decorated rooms remain intact; the explicit set only fills a starter or empty room', () => {
  for (const prior of [oldRoom(), oldRoom({ items: [] }), oldRoom({ items: [{ ...DEFAULT_BED, x: 3 }] }), { ...yuchanBedroom(), wall: 'blue' }]) {
    assert.deepEqual(readBedroom(prior, 7), prior);
    const previous = { ...freshLounge(7), bedroom: prior };
    assert.deepEqual(accountSave({ version: previous.version, actor: 7 }, 7, previous).bedroom, prior, 'an old client omitting bedroom preserves it');
  }
  const prior = oldRoom({ wall: 'gold', floor: 'marble', access: 'closed' }), before = structuredClone(prior);
  const applied = applyYuchanRoom(prior, 7);
  assert.equal(applied.items.length, yuchanBedroom().items.length);
  assert.equal(applied.wall, 'gold'); assert.equal(applied.floor, 'marble'); assert.equal(applied.access, 'closed');
  assert.deepEqual(prior, before);
  assert.ok(applyYuchanRoom(oldRoom({ items: [] }), 7));
  assert.equal(applyYuchanRoom(oldRoom({ items: [{ ...DEFAULT_BED, x: 3 }] }), 7), null);
  assert.equal(applyYuchanRoom(yuchanBedroom(), 7), null);
  assert.equal(canApplyYuchanRoom(oldRoom(), 0), false);
});

test('room-only allowances save on the server, remain bounded across repeated saves and add to purchased copies', () => {
  const save = freshLounge(7), before = structuredClone(save);
  assert.deepEqual(serverAccountSave(save, 7).bedroom, save.bedroom);
  const twice = { ...save, bedroom: duplicate(save.bedroom, 'chair') };
  assert.throws(() => serverAccountSave(twice, 7, save), /사지 않은 소품/);
  const paid = roomUnlocks({ actor: 7, furniture: { chair: 1 } });
  assert.equal(paid.filter((r) => r === 'chair').length, 2);
  assert.deepEqual(withYuchanRoomUnlocks(paid, 7), paid, 'merging is idempotent');
  const accepted = serverAccountSave(twice, 7, save, paid);
  assert.throws(() => serverAccountSave({ ...save, bedroom: duplicate(accepted.bedroom, 'chair') }, 7, accepted, paid), /사지 않은 소품/);
  assert.throws(() => serverAccountSave({ ...save, bedroom: duplicate(save.bedroom, 'bed') }, 7, save), /사지 않은 소품/);
  assert.deepEqual(save, before);
  assert.throws(() => serverAccountSave({ ...freshLounge(0), actor: 7, bedroom: save.bedroom }, 0), /사지 않은 소품/, 'payload actor cannot grant a foreign set');
});

test('furniture theft masking preserves only the room-bound set plus actually owned copies', () => {
  const uid = crypto.randomUUID();
  const life = ensureLifeMember(readLife(undefined), uid, 7);
  life.roomsReset = { id: ROOMS_RESET_ID, at: 0, backup: {} };
  life.ext = { [uid]: { furnStrict: { chair: true }, furn: {} } };
  const before = structuredClone(life), save = freshLounge(7);
  assert.equal(lifeUnlocksOf(life, uid).filter((r) => r === 'chair').length, 1);
  assert.equal(furniturePolicyOf(life, uid).roomActor, 7);
  assert.equal(protectProfileFurniture(save, life, uid).bedroom.items.filter((r) => r.ref === 'chair').length, 1);
  assert.equal(friendVisitView(7, save, life).bedroom.items.filter((r) => r.ref === 'chair').length, 1);
  assert.equal(protectProfileFurniture({ ...save, bedroom: duplicate(save.bedroom, 'chair') }, life, uid).bedroom.items.filter((r) => r.ref === 'chair').length, 1);
  assert.deepEqual(life, before, 'placement allowances never grant saleable furniture or alter a saved world');
});

test('the set has no collisions and every interaction, bed, kitchen and closet is reachable in the smallest room', () => {
  const shape = roomShape(0), room = yuchanBedroom();
  setActiveRoomShape(shape);
  assert.deepEqual(roomConflicts(room, shape), []);
  const obstacles = roomObstacles(room, shape), start = walkStart(shape);
  const targets = [
    { x: 2.55, z: -2.6 }, // photographs beside the bed
    { x: -1.8, z: 0 }, // tea table
    { x: 1.55, z: -2.5 }, // desk memo
    { x: 4.2, z: -0.45 }, // bed
    { x: -4.7, z: -2.7 }, // kitchen
    { x: -2.6, z: -2.7 }, // closet
  ];
  assert.equal(canWalk(start, obstacles), true);
  for (const target of targets) {
    assert.equal(canWalk(target, obstacles), true, JSON.stringify(target));
    assert.ok(findWalkPath(start, target, obstacles, { exact: true }).length, JSON.stringify(target));
  }
  assert.equal(yuchanRoomSpotAt(room, 7, targets[0])?.id, 'photo');
  assert.equal(yuchanRoomSpotAt(room, 7, targets[1])?.id, 'rest');
  assert.equal(yuchanRoomSpotAt(room, 7, targets[2])?.id, 'tomato-note');
});

test('reward-free inspections follow actual edited props, require proximity and never open in another home', () => {
  const room = yuchanBedroom(), before = structuredClone(room);
  assert.equal(yuchanRoomSpots(room, 0).length, 0);
  assert.equal(yuchanRoomSpotAt(room, 7, walkStart(roomShape(0))), null);
  assert.equal(yuchanRoomSpotAt(room, 7, { x: NaN, z: 0 }), null);
  const moved = { ...room, items: room.items.map((i) => i.ref === 'tea-set' ? { ...i, id: 'from-catalog', x: 1, z: 2 } : i) };
  assert.equal(yuchanRoomSpots(moved, 7).find((s) => s.id === 'rest').item, 'from-catalog');
  assert.equal(yuchanRoomSpotAt(moved, 7, { x: 1, z: 2 }).id, 'rest');
  assert.equal(yuchanRoomSpots({ ...room, items: room.items.filter((i) => i.ref !== 'tea-set') }, 7).some((s) => s.id === 'rest'), false);
  assert.deepEqual(room, before);
});
