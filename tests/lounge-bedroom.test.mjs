import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROOM_PROPS,
  ROOM_PROP_BY_ID,
  BEDROOM_LIMITS,
  defaultBedroom,
  readBedroom,
  roomItemBounds,
} from '../app/lounge-bedroom-data.ts';
import { freshLounge, readLounge, defaultLook } from '../app/lounge-look.ts';
import { accountSave } from '../app/lounge-accounts.ts';
import {
  readAccountDraft,
  restoreAccountDraft,
} from '../app/lounge-cloud-draft.ts';

const item = (id, prop = 'bed', more = {}) => ({
  id,
  prop,
  x: 45,
  y: 76,
  scale: 1,
  flip: false,
  ...more,
});
const custom = {
  version: 1,
  designVersion: 2,
  wall: 'blue',
  floor: 'walnut',
  items: [
    item('my-desk', 'desk'),
    item('my-cat', 'cat-plush', { x: 51, y: 66, scale: 0.85, flip: true }),
  ],
};

test('old saves migrate without losing looks, saved outfits, or visits; account identity determines starter', () => {
  const old = {
    ...freshLounge(0),
    visits: 12,
    saved: [{ id: 'look-1', actor: 0, name: '내 옷', look: defaultLook(0) }],
  };
  delete old.bedroom;
  const restored = readLounge(JSON.stringify(old));
  assert.deepEqual(restored.bedroom, defaultBedroom(0));
  assert.deepEqual(restored.looks, old.looks);
  assert.deepEqual(restored.saved, old.saved);
  assert.equal(restored.visits, 12);
  assert.equal(accountSave({ ...old, actor: 6 }, 0).bedroom.wall, 'blush');
  assert.deepEqual(accountSave(null, 2).bedroom, defaultBedroom(2));
  assert.deepEqual(readLounge('broken').bedroom, defaultBedroom(6));
});

test('room roundtrip keeps exact item order, flip, colors, and intentional empty rooms', () => {
  assert.deepEqual(readBedroom(custom), custom);
  assert.deepEqual(readBedroom(JSON.parse(JSON.stringify(custom))), custom);
  assert.deepEqual(readBedroom({ ...custom, items: [] }).items, []);
  assert.deepEqual(
    readBedroom({ ...custom, items: [...custom.items].reverse() }).items.map(
      (i) => i.id,
    ),
    ['my-cat', 'my-desk'],
  );
  assert.deepEqual(readBedroom({ version: 999 }), defaultBedroom(0));
  const a = defaultBedroom(),
    b = defaultBedroom();
  a.items[0].x = 4;
  assert.notEqual(a.items[0].x, b.items[0].x);
});

test('untrusted item data cannot escape catalog, IDs, item limit, or numeric bounds', () => {
  const source = {
    version: 1,
    designVersion: 2,
    wall: '<script>',
    floor: '__proto__',
    items: [
      item('first', 'bed', {
        x: Infinity,
        y: NaN,
        scale: -Infinity,
        flip: 'true',
        src: 'https://evil.example',
      }),
      item('first', 'sofa'),
      item('bad-id<script>'),
      item('z'.repeat(65)),
      item('unknown', '__proto__'),
      null,
      item('poster', 'music-poster', {
        x: -500,
        y: 500,
        scale: 9000,
        flip: true,
      }),
      ...Array.from({ length: 80 }, (_, i) =>
        item('extra-' + i, 'rug', { x: 1000, y: -999, scale: -2 }),
      ),
    ],
  };
  const safe = readBedroom(source);
  assert.equal(safe.items.length, 48);
  assert.equal(new Set(safe.items.map((i) => i.id)).size, 48);
  assert.deepEqual(safe.items[0], item('first', 'bed', { x: 50, y: 77 }));
  assert.deepEqual(
    safe.items[1],
    item('poster', 'music-poster', { x: 4, y: 58, scale: 1.5, flip: true }),
  );
  for (const value of safe.items) {
    const bounds = roomItemBounds(value.prop);
    assert.ok(
      Number.isFinite(value.x) &&
        value.x >= bounds.minX &&
        value.x <= bounds.maxX,
    );
    assert.ok(
      Number.isFinite(value.y) &&
        value.y >= bounds.minY &&
        value.y <= bounds.maxY,
    );
    assert.ok(value.scale >= 0.65 && value.scale <= 1.5);
    assert.equal(Object.hasOwn(value, 'src'), false);
  }
  assert.equal(safe.wall, 'blush');
  assert.equal(safe.floor, 'oak');
});

test('every approved prop is available to every account, with stable placement metadata', () => {
  assert.equal(ROOM_PROPS.length, 36);
  assert.equal(new Set(ROOM_PROPS.map((p) => p.id)).size, 36);
  for (let actor = 0; actor < 7; actor++) {
    const result = accountSave(
      {
        ...freshLounge(actor),
        bedroom: {
          ...custom,
          items: ROOM_PROPS.map((p) => item('prop-' + p.id, p.id)),
        },
      },
      actor,
    );
    assert.equal(result.bedroom.items.length, 36);
    for (const prop of ROOM_PROPS) {
      assert.ok(prop.width > 0 && ROOM_PROP_BY_ID[prop.id] === prop);
      assert.ok(['floor', 'wall', 'rug'].includes(prop.placement));
    }
  }
});

test('older client outfit saves preserve an existing server bedroom only when the key is absent', () => {
  const previous = { ...freshLounge(0), bedroom: custom };
  const incoming = {
    ...freshLounge(0),
    looks: freshLounge(0).looks.map((look, actor) =>
      actor === 0 ? { ...look, hair: 'ink' } : look,
    ),
  };
  delete incoming.bedroom;
  const saved = accountSave(incoming, 0, previous);
  assert.deepEqual(saved.bedroom, custom);
  assert.equal(saved.looks[0].hair, 'ink');
  for (const invalid of [null, undefined, { version: 8 }, 'bad']) {
    assert.deepEqual(
      accountSave({ ...incoming, bedroom: invalid }, 0, previous).bedroom,
      defaultBedroom(0),
    );
  }
  assert.deepEqual(
    accountSave({ ...incoming, bedroom: { ...custom, items: [] } }, 0, previous)
      .bedroom.items,
    [],
  );
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
  const saved = accountSave(
    { ...previous, actor: 6, bedroom: defaultBedroom(0), balance: 9999999 },
    0,
    previous,
  );
  assert.equal(saved.actor, 0);
  assert.deepEqual(saved.bedroom, defaultBedroom(0));
  assert.deepEqual(saved.looks, previous.looks);
  assert.equal(saved.visits, 23);
  assert.deepEqual(
    saved.saved.map((i) => i.id),
    ['mine'],
  );
  assert.equal(Object.hasOwn(saved, 'balance'), false);
  for (const actor of [-1, 7, NaN, Infinity, 0.5, '0'])
    assert.throws(() => accountSave(previous, actor), /Unknown account actor/);
});

test('legacy draft restore keeps the latest room while restoring the draft outfit', () => {
  const initial = { ...freshLounge(0), bedroom: custom };
  const legacy = {
    ...freshLounge(0),
    looks: freshLounge(0).looks.map((look, actor) =>
      actor === 0 ? { ...look, hair: 'ink' } : look,
    ),
  };
  delete legacy.bedroom;
  const draft = readAccountDraft(JSON.stringify(legacy), 0, initial);
  assert.deepEqual(draft.save.bedroom, custom);
  assert.equal(Object.hasOwn(draft.value, 'bedroom'), false);
  const latest = {
    ...initial,
    bedroom: { ...custom, wall: 'sage', items: [...custom.items].reverse() },
  };
  const restored = restoreAccountDraft(draft, 0, latest);
  assert.deepEqual(restored.bedroom, latest.bedroom);
  assert.equal(restored.looks[0].hair, 'ink');
  assert.deepEqual(latest.bedroom.items, [...custom.items].reverse());
});

test('current drafts restore explicit room edits, empty rooms, and intentional reset data', () => {
  const latest = { ...freshLounge(0), bedroom: custom };
  for (const bedroom of [
    { ...custom, wall: 'sage' },
    { ...custom, items: [] },
    null,
  ]) {
    const draft = readAccountDraft(
      JSON.stringify({ ...freshLounge(0), bedroom }),
      0,
      latest,
    );
    assert.deepEqual(
      restoreAccountDraft(draft, 0, latest).bedroom,
      bedroom ?? defaultBedroom(0),
    );
  }
  assert.throws(() => readAccountDraft('broken JSON', 0, latest), SyntaxError);
});

test('sanitized worst-case room and outfits fit below the existing 64 KiB jsonb limit', () => {
  const maximized = {
    ...freshLounge(0),
    bedroom: {
      ...custom,
      items: Array.from({ length: BEDROOM_LIMITS.maxItems }, (_, i) =>
        item(('id-' + i).padEnd(64, 'x'), 'headband-display', {
          x: 95.999,
          y: 93.999,
          scale: 1.499,
        }),
      ),
    },
    saved: Array.from({ length: 28 }, (_, i) => ({
      id: '💗'.repeat(40),
      actor: 0,
      name: '방'.repeat(50),
      look: defaultLook(i % 7),
    })),
  };
  const safe = accountSave(maximized, 0);
  // Pretty-printed whitespace is larger than Postgres jsonb's separator spaces.
  assert.ok(Buffer.byteLength(JSON.stringify(safe, null, 2)) < 65536);
  assert.deepEqual(accountSave(safe, 0), safe);
});

test('the requested redesign replaces legacy rooms once for seven friends and preserves later edits', () => {
  for (let actor = 0; actor < 7; actor++) {
    const legacy = { ...custom };
    delete legacy.designVersion;
    assert.deepEqual(readBedroom(legacy, actor), defaultBedroom(actor));
    const edited = {
      ...defaultBedroom(actor),
      wall: 'blue',
      floor: 'walnut',
      items: [item('my-miku', 'miku-acrylic', { x: 72, y: 61, scale: 0.9 })],
    };
    assert.deepEqual(readBedroom(edited, actor), edited);
    assert.deepEqual(readBedroom({ ...edited, items: [] }, actor).items, []);
    assert.equal(defaultBedroom(actor).designVersion, 2);
    assert.equal(
      new Set(defaultBedroom(actor).items.map((i) => i.id)).size,
      defaultBedroom(actor).items.length,
    );
  }
  assert.equal(
    new Set(
      Array.from({ length: 7 }, (_, actor) =>
        JSON.stringify(defaultBedroom(actor)),
      ),
    ).size,
    7,
  );
  assert.equal(
    defaultBedroom(0).items.filter((i) => i.prop.startsWith('miku-')).length,
    8,
  );
});
