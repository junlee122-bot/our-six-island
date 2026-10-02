// Being in another area is not being away: friends anywhere in the village
// world stay in everyone's packet with their place named, outdoor moves keep
// their real position (목장·산기슭 too), stickers work from every district,
// and only a lease that really ran out drops someone (then the client walks
// back in by itself).
import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { AREAS, moveClamp } from '../app/lounge-games.ts';
import { areaPlace, presenceLine } from '../app/lounge-presence.ts';
import { villageFriendPins } from '../app/lounge-village-minimap.ts';
import { shouldRecover } from '../app/lounge-connection.ts';
import { DISTRICT_IDS } from '../app/lounge-districts.ts';

const uuid = () => crypto.randomUUID();
const member = (actor) => ({ id: uuid(), actor, username: ACCOUNT_IDS[actor], connection: uuid(), sequence: 0, epoch: 0, code: '' });
function harness() {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {}, life: { flags: DISTRICT_IDS.map((d) => `district-${d}`) } },
    now = Date.UTC(2026, 8, 24, 3, 0, 0);
  return {
    get world() {
      return world;
    },
    tick(ms) {
      now += ms;
    },
    async run(p, op, extra = {}) {
      const command = { op, connection: p.connection, ...(p.code ? { code: p.code } : {}), ...(!['read', 'wallet'].includes(op) ? { requestId: uuid(), sequence: ++p.sequence } : {}), ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
      const r = cloudTransition(world, p, command, await commandHash(command), now);
      world = r.state;
      p.epoch = r.response.epoch;
      if (r.response.code) p.code = r.response.code;
      return r.response;
    },
  };
}

test('every area has a place name; a friend elsewhere never reads as "마을"', () => {
  for (const area of AREAS) {
    const place = areaPlace(area, 2);
    assert.ok(place && place !== '마을', area);
    if (area !== 'village') assert.notEqual(place, areaPlace('village'), area);
  }
  assert.equal(presenceLine({ area: 'market', actor: 1 }), '시장 거리에 있어요');
  assert.equal(presenceLine({ area: 'offshore', actor: 1 }), '먼바다 낚싯배에 있어요');
  assert.equal(presenceLine({ area: 'home', home: 3, actor: 1 }, 3), '내 방에 와 있어요');
  assert.equal(presenceLine({ area: 'home', home: 1, actor: 1 }, 3), '자기 방에 있어요');
  assert.match(presenceLine({ area: 'home', home: 4, actor: 1 }, 3), /의 방에 있어요$/);
});

test('the village minimap pins friends in every district and on the deck', () => {
  for (const area of [...DISTRICT_IDS, 'offshore']) {
    const pins = villageFriendPins([{ id: 'f', actor: 1, area, x: 50, y: 50 }], 'me');
    assert.equal(pins.length, 1, area);
  }
});

test('outdoor moves keep the full map (목장·산기슭 included); hall-style rooms keep their box', () => {
  for (const area of ['village', 'market', 'harbor', 'hillside', 'ranch', 'foothill', 'offshore', 'hill', 'woods', 'mine', 'home'])
    assert.deepEqual(moveClamp(area, 3, 97), { x: 3, y: 97 }, area);
  assert.deepEqual(moveClamp('casino', 3, 97), { x: 15, y: 88 });
});

test('cloud: friends in different areas all stay in each other’s packet; moves and stickers work everywhere', async () => {
  const h = harness();
  const areas = ['market', 'ranch', 'foothill', 'harbor', 'bakery', 'tavern', 'home'];
  const ps = areas.map((_, i) => member(i));
  for (const p of ps) await h.run(p, 'open', { code: 'BEMTADUVLY' });
  for (const [i, p] of ps.entries()) {
    const r = await h.run(p, 'action', { action: { kind: 'area', area: areas[i], ...(areas[i] === 'home' ? { home: p.actor } : {}) } });
    assert.equal(r.ok, true, `${areas[i]}: ${r.error}`);
  }
  // 목장 at its far corner: the position is kept, not squeezed into a room's box.
  const ranch = ps[1];
  assert.equal((await h.run(ranch, 'action', { action: { kind: 'move', x: 4, y: 96 } })).ok, true);
  // A sticker from 시장 거리 (the client sends the outdoor 'village' scope).
  const sticker = await h.run(ps[0], 'action', { action: { kind: 'reaction', id: 'yoi', scope: 'village' } });
  for (const p of ps) {
    h.tick(1000);
    const r = await h.run(p, 'read');
    assert.equal(r.ok, true);
    assert.deepEqual(r.packet.players.map((x) => x.area).sort(), [...areas].sort(), 'everyone sees everyone');
    const far = r.packet.players.find((x) => x.id === ranch.id);
    assert.deepEqual([far.x, far.y], [4, 96]);
  }
  assert.equal(sticker.ok, true, sticker.error);
  // From inside a shop the outdoor scope is still refused (it has its own chat).
  assert.equal((await h.run(ps[4], 'action', { action: { kind: 'reaction', id: 'yoi', scope: 'village' } })).ok, false);
});

test('cloud: a long stay in another area keeps presence while the client polls', async () => {
  const h = harness();
  const a = member(0), b = member(1);
  await h.run(a, 'open', { code: 'BEMTADUVLY' });
  await h.run(b, 'open', { code: 'BEMTADUVLY' });
  await h.run(a, 'action', { action: { kind: 'area', area: 'harbor' } });
  for (let t = 0; t < 30 * 60_000; t += 45_000) {
    h.tick(45_000);
    assert.equal((await h.run(a, 'read')).ok, true);
    assert.equal((await h.run(b, 'read')).ok, true);
  }
  assert.equal((await h.run(b, 'read')).packet.players.length, 2);
});

test('the client rejoins by itself only after its lease ran out, with the tab in view', () => {
  const base = { lost: true, expired: true, stopped: false, recovering: false, visible: true, look: true };
  assert.equal(shouldRecover(base), true);
  assert.equal(shouldRecover({ ...base, expired: false }), false, 'another window took over: stay out');
  assert.equal(shouldRecover({ ...base, visible: false }), false, 'a hidden tab waits until it is back');
  assert.equal(shouldRecover({ ...base, recovering: true }), false);
  assert.equal(shouldRecover({ ...base, stopped: true }), false);
  assert.equal(shouldRecover({ ...base, lost: false }), false);
  assert.equal(shouldRecover({ ...base, look: false }), false);
});
