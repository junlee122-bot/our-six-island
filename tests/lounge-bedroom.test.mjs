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
  version: 3,
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

test('v3 rooms round-trip exactly (order, rotation, wall items, surfaces, empty rooms)', () => {
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
  a.items[0].x = 4;
  assert.notEqual(a.items[0].x, b.items[0].x);
});

test('RESET: every older room (v1, v2 percent canvas, unknown) becomes the actor’s new default v3 room', () => {
  for (let actor = 0; actor < 7; actor++) {
    for (const old of [legacyV2, { ...legacyV2, designVersion: undefined }, { version: 2, items: [] }, null, 'x', { version: 999 }]) {
      assert.deepEqual(readBedroom(old, actor), defaultBedroom(actor));
      if (!(old && old.version === 999)) assert.deepEqual(readBedroomStrict(old, actor), defaultBedroom(actor));
    }
    assert.equal(defaultBedroom(actor).version, 3);
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
    { ...custom, items: [null] },
    { ...custom, items: Array.from({ length: BEDROOM_LIMITS.maxItems + 1 }, (_, i) => item('i' + i, 'cat-plush')) },
    { ...custom, version: 4 },
  ];
  for (const room of bad) {
    assert.throws(() => readBedroomStrict(room, 0), BedroomError, JSON.stringify(room).slice(0, 120));
    // The browser never crashes on it: it gets a usable v3 room.
    const lenient = readBedroom(room, 0);
    assert.equal(lenient.version, 3);
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
          ...(i % 2 ? { wall: 'left', y: 2.345678 } : { y: 1.234567 }),
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
  const safe = serverAccountSave(maximized, 0);
  assert.equal(safe.bedroom.items.length, BEDROOM_LIMITS.maxItems);
  assert.ok(jsonbTextBytes(safe) < 65536, String(jsonbTextBytes(safe)));
  assert.ok(Buffer.byteLength(JSON.stringify(safe, null, 2)) < 65536);
  assert.ok(JSON.stringify(safe.bedroom).length < 16384);
  assert.deepEqual(accountSave(safe, 0), safe);
});

test('older clients cannot overwrite a v3 room; missing bedroom keeps the server room', () => {
  const previous = { ...freshLounge(0), bedroom: custom };
  const incoming = { ...freshLounge(0), looks: freshLounge(0).looks.map((l, a) => (a === 0 ? { ...l, hair: 'ink' } : l)) };
  delete incoming.bedroom;
  const saved = accountSave(incoming, 0, previous);
  assert.deepEqual(saved.bedroom, custom);
  assert.equal(saved.looks[0].hair, 'ink');
  // An old browser still writing the v2 canvas keeps the v3 room.
  assert.deepEqual(accountSave({ ...incoming, bedroom: legacyV2 }, 0, previous).bedroom, custom);
  assert.deepEqual(serverAccountSave({ ...incoming, bedroom: legacyV2 }, 0, previous).bedroom, custom);
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

test('seven distinct default rooms; only Dowon’s is the Miku fan room', () => {
  const rooms = Array.from({ length: 7 }, (_, a) => defaultBedroom(a));
  assert.equal(new Set(rooms.map((r) => JSON.stringify(r))).size, 7);
  assert.equal(new Set(rooms.map((r) => r.theme)).size, 7);
  assert.equal(roomHasMiku(rooms[0]), true);
  assert.ok(rooms[0].items.filter((i) => catalogEntry(i.ref).category === 'miku').length >= 9);
  // Others may own a single painted figure at most (호현's game shelf), never the fan-room set.
  for (let a = 1; a < 7; a++)
    assert.ok(rooms[a].items.filter((i) => catalogEntry(i.ref).category === 'miku').length <= 1, String(a));
  assert.equal(roomHasMiku(rooms[3]), false);
  for (const [a, room] of rooms.entries()) {
    assert.deepEqual(readBedroomStrict(JSON.parse(JSON.stringify(room)), a), room);
    assert.equal(new Set(room.items.map((i) => i.id)).size, room.items.length);
    const refs = room.items.map((i) => i.ref);
    for (const ref of ['bed', 'desk', 'chair']) assert.ok(refs.includes(ref), `${a} has ${ref}`);
    assert.ok(refs.some((r) => catalogEntry(r).mount === 'rug'), `${a} has a rug`);
  }
});

test('default rooms are believable: bed and desk against the back wall, desk under the window, rug centred, no conflicts', () => {
  for (let a = 0; a < 7; a++) {
    const room = defaultBedroom(a);
    assert.deepEqual(roomConflicts(room), [], `room ${a}`);
    const f = (ref) => itemFootprint(room.items.find((i) => i.ref === ref));
    assert.ok(Math.abs(f('bed').z0 - ROOM.minZ) < 0.06, `${a} bed against the wall`);
    assert.ok(Math.abs(f('desk').z0 - ROOM.minZ) < 0.06, `${a} desk against the wall`);
    const desk = f('desk'),
      mid = (desk.x0 + desk.x1) / 2;
    assert.ok(mid > ROOM.window.x0 && mid < ROOM.window.x1, `${a} desk under the window`);
    const rug = room.items.find((i) => catalogEntry(i.ref).mount === 'rug');
    assert.ok(Math.abs(rug.x) < 3.2 && Math.abs(rug.z) < 1.6, `${a} rug near the centre`);
    // Small items stand on something (surface) or the floor, never float.
    for (const i of room.items.filter((i) => catalogEntry(i.ref).mount === 'small' && i.y))
      assert.ok(i.y >= 0.5 && i.y <= 1.6, `${a} ${i.id} y`);
  }
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
  // Owned: accepted.
  assert.equal(serverAccountSave(save, 0, undefined, ['trophy-carrot']).bedroom.items.length, 5);
  // Already in the stored room: grandfathered, but not a second copy.
  const previous = { ...freshLounge(0), bedroom: withTrophy };
  assert.equal(serverAccountSave(save, 0, previous).bedroom.items.length, 5);
  const twice = { ...freshLounge(0), bedroom: { ...withTrophy, items: [...withTrophy.items, { ...trophy, id: 'gold2' }] } };
  assert.throws(() => serverAccountSave(twice, 0, previous), AccountSaveError);
  assert.deepEqual(lockedRoomItems(twice.bedroom, [], withTrophy), ['trophy-carrot']);
  // The client path (no unlock list) does not check.
  assert.equal(accountSave(save, 0).bedroom.items.length, 5);
  // Default rooms never contain shop rarities.
  for (let a = 0; a < 7; a++) assert.deepEqual(lockedRoomItems(defaultBedroom(a), []), []);
  // Unlocks come from the world's life state, per member uid.
  const uid = '11111111-1111-4111-8111-111111111111';
  assert.deepEqual(lifeUnlocksOf(null, uid), []);
  assert.deepEqual(lifeUnlocksOf({ unlocks: { [uid]: ['trophy-carrot', 'not-a-shop-item'] } }, uid), ['trophy-carrot']);
});
