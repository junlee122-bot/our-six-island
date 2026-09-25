// PC shell helpers: invite deep links, shareable invite URLs, the village
// hover targets behind the canvas cursor, and UI size variables.
import test from 'node:test';
import assert from 'node:assert/strict';
import { WEB_URL, deepLinkCode, shareableInviteUrl } from '../app/desktop-bridge.ts';
import { villageHoverTarget } from '../app/lounge-village-hover.ts';
import { VILLAGE_PLACES, VILLAGE_BOARD, VILLAGE_POND } from '../app/lounge-village-layout.ts';

test('deep links carry the village code in any supported form', () => {
  assert.equal(deepLinkCode('beomtadew://lounge/ABCDEFGH23'), 'ABCDEFGH23');
  assert.equal(deepLinkCode('beomtadew://lounge=abcdefgh23'), 'ABCDEFGH23');
  assert.equal(deepLinkCode('BEOMTADEW://lounge/ABCDEFGH23/'), 'ABCDEFGH23');
  assert.equal(deepLinkCode(WEB_URL + '#lounge=ABCDEFGH23'), 'ABCDEFGH23');
  assert.equal(deepLinkCode('https://x.test/#a=1&lounge=ABCDEFGH23'), 'ABCDEFGH23');
  assert.equal(deepLinkCode('beomtadew://theater/ABCDEFGH23'), null);
  assert.equal(deepLinkCode('beomtadew://lounge/<script>'), null);
  assert.equal(deepLinkCode(''), null);
});

test('invite links outside the app keep the page; the app uses the public site', () => {
  const saved = globalThis.window;
  try {
    globalThis.window = { __TAURI__: {} };
    assert.equal(shareableInviteUrl('lounge', 'ABC'), WEB_URL + '#lounge=ABC');
  } finally {
    globalThis.window = saved;
  }
});

test('hover targets: buildings, people, spots and plain ground', () => {
  const hall = VILLAGE_PLACES.find((p) => p.kind === 'hall');
  assert.deepEqual(villageHoverTarget({ x: hall.x, z: hall.z }), { kind: 'place', id: hall.id });
  assert.deepEqual(villageHoverTarget({ x: VILLAGE_BOARD.x, z: VILLAGE_BOARD.z }), { kind: 'spot', id: 'board' });
  assert.deepEqual(villageHoverTarget({ x: VILLAGE_POND.x, z: VILLAGE_POND.z }), { kind: 'spot', id: 'pond' });
  assert.deepEqual(villageHoverTarget({ x: 0, z: 0 }), { kind: 'spot', id: 'fountain' });
  assert.deepEqual(villageHoverTarget({ x: 3, z: 20 }, { people: [{ x: 3.2, z: 20.1 }] }), { kind: 'person' });
  assert.equal(villageHoverTarget({ x: 0, z: 10 }), null);
});
