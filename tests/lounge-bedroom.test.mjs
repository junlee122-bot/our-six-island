import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BEDROOM_LIMITS,
  BEDROOM_INVALID,
  ROOM,
  ROOM_CATALOG,
  BedroomError,
  catalogEntry,
  defaultBedroom,
  itemFootprint,
  readBedroom,
  readBedroomStrict,
  roomConflicts,
  roomFromNetwork,
  roomToNetwork,
  roomHasMiku,
  lockedRoomItems,
  ROOM_ITEM_LOCKED,
  LEGACY_ROOM,
  DEFAULT_BED,
  legacyThemeRoom,
  roomShape,
  roomUnlocks,
  ROOM_TIERS,
} from '../app/lounge-bedroom-data.ts';
import { freshLounge, readLounge, readLoungeStrict, defaultLook } from '../app/lounge-look.ts';
import { accountSave, serverAccountSave, AccountSaveError, jsonbTextBytes, lifeUnlocksOf } from '../app/lounge-accounts.ts';
import { readAccountDraft, restoreAccountDraft } from '../app/lounge-cloud-draft.ts';

const item = (id, ref = 'bed', more = {}) => ({
  id,
  kind: catalogEntry(ref)?.kind ?? 'model',
  ref,
  x: 1,
  z: 1,
  rotY: 0,
  scale: 1,
  ...more,
});
const custom = {
  version: 4,
  theme: 'study',
  wall: 'blue',
  floor: 'walnut',
  access: 'friends',
  items: [
    item('my-desk', 'desk', { x: -2, z: -3.6 }),
    item('my-cat', 'cat-plush', { x: 0.5, z: 1, rotY: 180, scale: 0.85 }),
    item('my-poster', 'miku-poster', { x: 1.5, z: ROOM.minZ, wall: 'back', y: 2.2 }),
    item('my-lamp', 'table-lamp', { x: -2.3, z: -3.6, y: 0.86 }),
  ],
};
// Items saved by the old 2D editor (designVersion 2, percent coordinates).
const legacyV2 = {
  version: 1,
  designVersion: 2,
  wall: 'blue',
  floor: 'walnut',
  items: [{ id: 'old-desk', prop: 'desk', x: 45, y: 76, scale: 1, flip: false }],
};

test('v4 rooms round-trip exactly (order, rotation, wall items, surfaces, empty rooms)', () => {
  assert.deepEqual(readBedroom(custom), custom);
  assert.deepEqual(readBedroomStrict(JSON.parse(JSON.stringify(custom))), custom);
  assert.deepEqual(readBedroom({ ...custom, items: [] }).items, []);
  assert.deepEqual(
    readBedroom({ ...custom, items: [...custom.items].reverse() }).items.map((i) => i.id),
    ['my-lamp', 'my-poster', 'my-cat', 'my-desk'],
  );
  // Access defaults to friends; rotations are normalized.
  const { access, ...noAccess } = custom;
  assert.equal(readBedroom(noAccess).access, 'friends');
  assert.equal(access, 'friends');
  assert.equal(readBedroom({ ...custom, items: [item('r', 'sofa', { rotY: -90 })] }).items[0].rotY, 270);
  const a = defaultBedroom(),
    b = defaultBedroom();
  a.items[0].x = 1;
  assert.notEqual(a.items[0].x, b.items[0].x);
});

test('RESET: every older room (v1, v2 percent canvas, the v3 themed rooms, unknown) becomes the new default room with one bed', () => {
  const v3 = { ...custom, version: 3, items: [...custom.items, item('left-art', 'wall-clock', { x: -5, z: 0, wall: 'left', y: 2.4 })] };
  for (let actor = 0; actor < 7; actor++) {
    for (const old of [legacyV2, { ...legacyV2, designVersion: undefined }, { version: 2, items: [] }, v3, null, 'x', { version: 999 }]) {
      assert.deepEqual(readBedroom(old, actor), defaultBedroom(actor));
      if (!(old && old.version === 999)) assert.deepEqual(readBedroomStrict(old, actor), defaultBedroom(actor));
    }
    assert.equal(defaultBedroom(actor).version, 4);
    assert.deepEqual(defaultBedroom(actor).items, [DEFAULT_BED]);
    assert.equal(defaultBedroom(actor).wall, 'cream');
    assert.equal(defaultBedroom(actor).floor, 'oak');
    // A whole old profile save is read with the new default room, keeping outfits.
    const save = { ...freshLounge(actor), visits: 5, bedroom: legacyV2 };
    const read = readLounge(JSON.stringify(save), actor);
    assert.deepEqual(read.bedroom, defaultBedroom(actor));
    assert.equal(read.visits, 5);
    assert.deepEqual(serverAccountSave(save, actor).bedroom, defaultBedroom(actor));
  }
});

test('strict (server) validator rejects malformed v3 rooms; lenient reader repairs them', () => {
  const bad = [
    { ...custom, wall: '<script>' },
    { ...custom, floor: '__proto__' },
    { ...custom, theme: 'hacker' },
    { ...custom, access: 'everyone' },
    { ...custom, items: 'nope' },
    { ...custom, items: [item('x', '__proto__')] },
    { ...custom, items: [item('x', 'bed', { kind: 'prop' })] },
    { ...custom, items: [item('bad id<script>')] },
    { ...custom, items: [item('z'.repeat(33))] },
    { ...custom, items: [item('dup'), item('dup', 'sofa')] },
    { ...custom, items: [item('x', 'bed', { x: Infinity })] },
    { ...custom, items: [item('x', 'bed', { z: 99 })] },
    { ...custom, items: [item('x', 'bed', { scale: 9 })] },
    { ...custom, items: [item('x', 'bed', { rotY: 'north' })] },
    { ...custom, items: [item('x', 'bed', { y: 0.5 })] },
    { ...custom, items: [item('x', 'bed', { wall: 'back' })] },
    { ...custom, items: [item('x', 'music-poster')] },
    { ...custom, items: [item('x', 'music-poster', { wall: 'ceiling', y: 2 })] },
    { ...custom, items: [item('x', 'music-poster', { wall: 'back', y: 50 })] },
    { ...custom, items: [item('x', 'music-poster', { wall: 'left', y: 2 })] },
    { ...custom, items: [null] },
    { ...custom, items: Array.from({ length: BEDROOM_LIMITS.maxItems + 1 }, (_, i) => item('i' + i, 'cat-plush')) },
    { ...custom, version: 5 },
  ];
  for (const room of bad) {
    assert.throws(() => readBedroomStrict(room, 0), BedroomError, JSON.stringify(room).slice(0, 120));
    // The browser never crashes on it: it gets a usable v4 room.
    const lenient = readBedroom(room, 0);
    assert.equal(lenient.version, 4);
    assert.ok(lenient.items.length <= BEDROOM_LIMITS.maxItems);
  }
  // A malformed room inside a whole save is a 400 with a room-specific message.
  const save = { ...freshLounge(0), bedroom: bad[5] };
  assert.throws(() => readLoungeStrict(JSON.stringify(save), 0), (e) => e.reason === 'room');
  assert.throws(
    () => serverAccountSave(save, 0),
    (e) => e instanceof AccountSaveError && e.status === 400 && e.message === BEDROOM_INVALID,
  );
  // …but the lenient client read keeps looks and outfits.
  const kept = readLounge(JSON.stringify({ ...save, visits: 9 }), 0);
  assert.equal(kept.visits, 9);
  // Lenient: unknown/extra fields are dropped and values clamped.
  const repaired = readBedroom({ ...custom, items: [item('x', 'bed', { x: 1000, src: 'https://evil.example' })] });
  assert.equal(repaired.items[0].x, ROOM.maxX);
  assert.equal(Object.hasOwn(repaired.items[0], 'src'), false);
});

test('the largest valid room and outfits stay within the 64KB profile limit', () => {
  const maximized = {
    ...freshLounge(0),
    bedroom: {
      ...custom,
      items: Array.from({ length: BEDROOM_LIMITS.maxItems }, (_, i) =>
        item(('i' + i).padEnd(32, 'x'), i % 2 ? 'miku-poster' : 'headband-display', {
          x: -4.123456,
          z: -3.987654,
          rotY: 359.9,
          scale: 1.999,
          ...(i % 2 ? { wall: 'back', y: 2.345678 } : { y: 1.234567 }),
        }),
      ),
    },
    saved: Array.from({ length: 28 }, () => ({
      id: '💗'.repeat(40),
      actor: 0,
      name: '방'.repeat(50),
      look: defaultLook(0),
    })),
  };
  const safe = serverAccountSave(maximized, 0, undefined, roomUnlocks({ styles: ['blue', 'walnut'], furniture: { 'miku-poster': 40, 'headband-display': 40 } }));
  assert.equal(safe.bedroom.items.length, BEDROOM_LIMITS.maxItems);
  assert.ok(jsonbTextBytes(safe) < 65536, String(jsonbTextBytes(safe)));
  assert.ok(Buffer.byteLength(JSON.stringify(safe, null, 2)) < 65536);
  assert.ok(JSON.stringify(safe.bedroom).length < 16384);
  assert.deepEqual(accountSave(safe, 0), safe);
});

test('older clients cannot overwrite a v4 room; missing bedroom keeps the server room', () => {
  const previous = { ...freshLounge(0), bedroom: custom };
  const incoming = { ...freshLounge(0), looks: freshLounge(0).looks.map((l, a) => (a === 0 ? { ...l, hair: 'ink' } : l)) };
  delete incoming.bedroom;
  const saved = accountSave(incoming, 0, previous);
  assert.deepEqual(saved.bedroom, custom);
  assert.equal(saved.looks[0].hair, 'ink');
  // An old browser still writing the v2 canvas or a v3 themed room keeps the v4 room.
  assert.deepEqual(accountSave({ ...incoming, bedroom: legacyV2 }, 0, previous).bedroom, custom);
  assert.deepEqual(serverAccountSave({ ...incoming, bedroom: legacyV2 }, 0, previous).bedroom, custom);
  assert.deepEqual(accountSave({ ...incoming, bedroom: { ...custom, version: 3 } }, 0, previous).bedroom, custom);
  // An explicit null/unknown value is an intentional reset to the default v3 room.
  for (const invalid of [null, { version: 8 }, 'bad'])
    assert.deepEqual(accountSave({ ...incoming, bedroom: invalid }, 0, previous).bedroom, defaultBedroom(0));
  assert.deepEqual(accountSave({ ...incoming, bedroom: { ...custom, items: [] } }, 0, previous).bedroom.items, []);
  assert.deepEqual(accountSave(incoming, 0).bedroom, defaultBedroom(0));
});

test('explicit reset changes only bedroom; malicious saved actor does not alter account identity', () => {
  const previous = {
    ...freshLounge(0),
    bedroom: custom,
    visits: 23,
    saved: [
      { id: 'mine', actor: 0, name: '좋은 옷', look: defaultLook(0) },
      { id: 'theirs', actor: 1, name: '다른 옷', look: defaultLook(1) },
    ],
  };
  const saved = accountSave({ ...previous, actor: 6, bedroom: defaultBedroom(0), balance: 9999999 }, 0, previous);
  assert.equal(saved.actor, 0);
  assert.deepEqual(saved.bedroom, defaultBedroom(0));
  assert.equal(saved.visits, 23);
  assert.deepEqual(saved.saved.map((i) => i.id), ['mine']);
  assert.equal(Object.hasOwn(saved, 'balance'), false);
  for (const actor of [-1, 7, NaN, Infinity, 0.5, '0'])
    assert.throws(() => accountSave(previous, actor), /Unknown account actor/);
});

test('drafts restore explicit room edits, empty rooms and intentional resets', () => {
  const latest = { ...freshLounge(0), bedroom: custom };
  for (const bedroom of [{ ...custom, wall: 'sage' }, { ...custom, items: [] }, null]) {
    const draft = readAccountDraft(JSON.stringify({ ...freshLounge(0), bedroom }), 0, latest);
    assert.deepEqual(restoreAccountDraft(draft, 0, latest).bedroom, bedroom ?? defaultBedroom(0));
  }
  const legacy = { ...freshLounge(0) };
  delete legacy.bedroom;
  const draft = readAccountDraft(JSON.stringify(legacy), 0, latest);
  assert.deepEqual(draft.save.bedroom, custom);
  assert.throws(() => readAccountDraft('broken JSON', 0, latest), SyntaxError);
});

test('catalog: unique refs, sane sizes, GLB furniture + painted props + Miku set + shop rarities', () => {
  const refs = ROOM_CATALOG.map((e) => e.ref);
  assert.equal(new Set(refs).size, refs.length);
  for (const e of ROOM_CATALOG) {
    assert.ok(e.w > 0 && e.d > 0 && e.h > 0, e.ref);
    assert.ok(['model', 'prop'].includes(e.kind));
    if (e.top) assert.ok(e.top <= e.h + 1e-9, e.ref);
  }
  for (const ref of ['bed', 'desk', 'wardrobe', 'sofa', 'wool-rug'])
    assert.equal(catalogEntry(ref).kind, 'model');
  for (const ref of ['miku-light-sticks', 'miku-headphones', 'miku-figure-shelf', 'miku-cushion', 'miku-rug', 'miku-leek', 'miku-records', 'miku-acrylic'])
    assert.equal(catalogEntry(ref).kind, 'model', ref);
  for (const ref of ['trophy-carrot', 'trophy-tomato', 'trophy-pumpkin', 'trophy-strawberry', 'fruit-basket'])
    assert.equal(catalogEntry(ref).unlock, ref);
  assert.equal(catalogEntry('__proto__'), undefined);
  // No trademark text in item names.
  for (const e of ROOM_CATALOG) assert.doesNotMatch(e.name, /hatsune|하츠네/i);
});

test('seven distinct model houses (the old themed rooms); only Dowon’s is the Miku fan room', () => {
  const rooms = Array.from({ length: 7 }, (_, a) => legacyThemeRoom(a));
  assert.equal(new Set(rooms.map((r) => JSON.stringify(r))).size, 7);
  assert.equal(new Set(rooms.map((r) => r.theme)).size, 7);
  assert.equal(roomHasMiku(rooms[0]), true);
  assert.ok(rooms[0].items.filter((i) => catalogEntry(i.ref).category === 'miku').length >= 9);
  for (let a = 1; a < 7; a++)
    assert.ok(rooms[a].items.filter((i) => catalogEntry(i.ref).category === 'miku').length <= 1, String(a));
  for (const [a, room] of rooms.entries()) {
    assert.equal(new Set(room.items.map((i) => i.id)).size, room.items.length);
    const refs = room.items.map((i) => i.ref);
    for (const ref of ['bed', 'desk', 'chair']) assert.ok(refs.includes(ref), `${a} has ${ref}`);
    assert.ok(refs.some((r) => catalogEntry(r).mount === 'rug'), `${a} has a rug`);
    // Art from the old left wall moved to the back wall (the camera sees side walls edge-on).
    assert.ok(room.items.every((i) => i.wall !== 'left'), `${a} no left-wall art`);
    // Believable and conflict-free in the old room's shape.
    assert.deepEqual(roomConflicts(room, LEGACY_ROOM).filter((c) => c.reason !== 'door'), [], `room ${a}`);
    const f = (ref) => itemFootprint(room.items.find((i) => i.ref === ref));
    assert.ok(Math.abs(f('bed').z0 - LEGACY_ROOM.minZ) < 0.06, `${a} bed against the wall`);
    const desk = f('desk'),
      mid = (desk.x0 + desk.x1) / 2;
    assert.ok(mid > LEGACY_ROOM.window.x0 && mid < LEGACY_ROOM.window.x1, `${a} desk under the window`);
  }
});

test('new rooms: one shape for everyone, growing with 집 확장; the default bed fits every tier', () => {
  assert.equal(ROOM_TIERS.length, 5);
  let previous = null;
  for (let tier = 0; tier < ROOM_TIERS.length; tier++) {
    const shape = roomShape(tier);
    // The back-left corner (kitchen, closet, door) never moves; the room only grows.
    assert.equal(shape.minX, -6);
    assert.equal(shape.minZ, -4);
    if (previous) assert.ok(shape.maxX > previous.maxX && shape.maxZ > previous.maxZ, String(tier));
    previous = shape;
    for (let a = 0; a < 7; a++) assert.deepEqual(roomConflicts(defaultBedroom(a), shape), [], `tier ${tier} actor ${a}`);
    const bed = itemFootprint(DEFAULT_BED);
    assert.ok(Math.abs(bed.z0 - shape.minZ) < 0.06, 'bed headboard against the back wall');
    assert.ok(shape.fixtures.some((f) => f.action === 'cook') && shape.fixtures.some((f) => f.action === 'dress'));
    const w = shape.window;
    assert.ok(shape.fixtures.every((f) => f.x1 < w.x0), 'kitchen and closet sit left of the window');
  }
  assert.deepEqual(roomShape(4), ROOM);
  // Tier-4 furniture outside a smaller room is reported (the editor keeps it in).
  const far = { ...defaultBedroom(0), items: [{ ...DEFAULT_BED, id: 'far', x: 10 }] };
  assert.deepEqual(roomConflicts(far, roomShape(4)), []);
  assert.ok(roomConflicts(far, roomShape(0)).some((c) => c.reason === 'outside'));
  // Nothing stands on the kitchen counter or in the doorway.
  const onKitchen = { ...defaultBedroom(0), items: [item('desk', 'desk', { x: -5, z: -3.5 })] };
  assert.ok(roomConflicts(onKitchen, roomShape(0)).some((c) => c.with === 'kitchen'));
  const door = roomShape(0).door;
  const inDoor = { ...defaultBedroom(0), items: [item('chair', 'chair', { x: (door.x0 + door.x1) / 2, z: 3.6 })] };
  assert.ok(roomConflicts(inDoor, roomShape(0)).some((c) => c.reason === 'door'));
});

test('presence coordinates map the walk room onto 0..100 and back', () => {
  for (const p of [{ x: ROOM.minX, z: ROOM.minZ }, { x: 0, z: 0 }, { x: 4.2, z: 3.9 }]) {
    const n = roomToNetwork(p);
    assert.ok(n.x >= 0 && n.x <= 100 && n.y >= 0 && n.y <= 100);
    const back = roomFromNetwork(n);
    assert.ok(Math.abs(back.x - p.x) < 0.01 && Math.abs(back.z - p.z) < 0.01);
  }
});

test('shop rarities need ownership on the server save path; stored copies are kept', () => {
  const trophy = item('gold', 'trophy-carrot', { x: -2.3, z: -3.6, y: 0.86 });
  assert.equal(catalogEntry('trophy-carrot').unlock, 'trophy-carrot');
  const withTrophy = { ...custom, items: [...custom.items, trophy] };
  const save = { ...freshLounge(0), bedroom: withTrophy };
  // No unlock: rejected with a 400 and nothing is written.
  assert.throws(
    () => serverAccountSave(save, 0, { ...freshLounge(0), bedroom: custom }),
    (e) => e instanceof AccountSaveError && e.status === 400 && e.message === ROOM_ITEM_LOCKED,
  );
  // Owned: accepted (every other piece is owned furniture now, 새 방).
  const pieces = custom.items.map((i) => i.ref);
  const styles = ['style-blue', 'style-walnut'];
  assert.equal(serverAccountSave(save, 0, undefined, ['trophy-carrot', ...pieces, ...styles]).bedroom.items.length, 5);
  assert.throws(() => serverAccountSave(save, 0, undefined, ['trophy-carrot', ...styles]), AccountSaveError);
  // The model-house walls and floors need buying too (범마을 부동산).
  assert.throws(() => serverAccountSave(save, 0, undefined, ['trophy-carrot', ...pieces]), AccountSaveError);
  // Already in the stored room: grandfathered, but not a second copy.
  const previous = { ...freshLounge(0), bedroom: withTrophy };
  assert.equal(serverAccountSave(save, 0, previous).bedroom.items.length, 5);
  const twice = { ...freshLounge(0), bedroom: { ...withTrophy, items: [...withTrophy.items, { ...trophy, id: 'gold2' }] } };
  assert.throws(() => serverAccountSave(twice, 0, previous), AccountSaveError);
  assert.deepEqual(lockedRoomItems(twice.bedroom, [], withTrophy), ['trophy-carrot']);
  // The client path (no unlock list) does not check.
  assert.equal(accountSave(save, 0).bedroom.items.length, 5);
  // Default rooms hold only the bed every room keeps for free.
  for (let a = 0; a < 7; a++) {
    assert.deepEqual(lockedRoomItems(defaultBedroom(a), roomUnlocks({})), []);
    assert.deepEqual(lockedRoomItems(defaultBedroom(a), []), ['bed']);
  }
  // A second bed needs a bought one.
  const twoBeds = { ...defaultBedroom(0), items: [DEFAULT_BED, { ...DEFAULT_BED, id: 'bed2', x: 0 }] };
  assert.deepEqual(lockedRoomItems(twoBeds, roomUnlocks({})), ['bed']);
  assert.deepEqual(lockedRoomItems(twoBeds, roomUnlocks({ furniture: { bed: 1 } })), []);
  // Unlocks come from the world's life state, per member uid.
  const uid = '11111111-1111-4111-8111-111111111111';
  assert.deepEqual(lifeUnlocksOf(null, uid), ['bed']);
  assert.deepEqual(lifeUnlocksOf({ unlocks: { [uid]: ['trophy-carrot', 'not-a-shop-item'] } }, uid), ['trophy-carrot', 'bed']);
});
