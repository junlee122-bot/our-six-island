// Friends in each other's rooms together: 'home' + owner presence, room chat,
// stickers, and the owner's 방 공개 / 친구만 / 닫기 setting.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS, friendVisitView } from '../app/lounge-accounts.ts';
import { chatScope, homeScope, HOME_CLOSED, AREA_DEFAULTS } from '../app/lounge-games.ts';
import { lifeAction, readLife, roomAccessOf, mayEnterRoom, lifeView } from '../app/lounge-life.ts';
import { roomFromNetwork, ROOM_DOOR_POINT } from '../app/lounge-bedroom-data.ts';

const uuid = () => crypto.randomUUID();
const member = (actor) => ({ id: uuid(), actor, username: ACCOUNT_IDS[actor], connection: uuid(), sequence: 0, epoch: 0, code: '' });
function harness() {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    now = Date.UTC(2026, 8, 24, 3, 0, 0);
  return {
    get world() {
      return world;
    },
    tick(ms) {
      now += ms;
    },
    async run(p, op, extra = {}) {
      const command = {
          op,
          connection: p.connection,
          ...(p.code ? { code: p.code } : {}),
          ...(!['read', 'wallet'].includes(op) ? { requestId: uuid(), sequence: ++p.sequence } : {}),
          ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
          ...extra,
        },
        result = cloudTransition(world, p, command, await commandHash(command), now);
      world = result.state;
      p.epoch = result.response.epoch;
      if (result.response.code) p.code = result.response.code;
      validateLedger(world.ledger);
      return result.response;
    },
  };
}
const act = (h, p, action) => h.run(p, 'action', { action });
const me = (r, p) => r.packet.players.find((x) => x.id === p.id);

test('chat scope: each friend’s room has its own chat; other areas are unchanged', () => {
  assert.equal(chatScope('village'), 'village');
  assert.equal(chatScope('casino'), 'casino');
  assert.equal(chatScope('lounge'), 'lounge');
  assert.equal(chatScope('wardrobe'), 'lounge');
  assert.equal(chatScope('home', 3), 'home-3');
  assert.equal(homeScope(0), 'home-0');
  assert.equal(chatScope('home', 9), 'lounge');
  assert.equal(chatScope('home'), 'lounge');
  // The home default spot is just inside the door.
  const door = roomFromNetwork(AREA_DEFAULTS.home);
  assert.ok(Math.hypot(door.x - ROOM_DOOR_POINT.x, door.z - ROOM_DOOR_POINT.z) < 0.05);
});

test('room access lives in world.life: default friends, owner-only changes, bounded and revisioned', () => {
  const a = { id: uuid(), actor: 2 };
  let life = readLife(undefined);
  assert.equal(roomAccessOf(life, 2), 'friends');
  assert.equal(mayEnterRoom(life, 2, 5), true);
  ({ life } = lifeAction(life, newLoungeLedger(), a, { kind: 'room', access: 'closed' }, 1));
  assert.equal(roomAccessOf(life, 2), 'closed');
  assert.equal(mayEnterRoom(life, 2, 5), false);
  assert.equal(mayEnterRoom(life, 2, 2), true, 'the owner may always enter');
  const rev = life.rooms[a.id].rev;
  ({ life } = lifeAction(life, newLoungeLedger(), a, { kind: 'room' }, 2));
  assert.equal(life.rooms[a.id].rev, rev + 1, 'a plain bump keeps the access');
  assert.equal(roomAccessOf(life, 2), 'closed');
  assert.throws(() => lifeAction(life, newLoungeLedger(), a, { kind: 'room', access: 'everyone' }, 3));
  const view = lifeView(life, a.id, 2, 4);
  assert.deepEqual(view.rooms[2], { access: 'closed', rev: rev + 1 });
  // Hostile stored values are dropped.
  const hostile = readLife({ ...life, rooms: { [a.id]: { access: 'x', rev: -1 }, nope: { access: 'friends' } } });
  assert.equal(hostile.rooms, undefined);
  assert.equal(friendVisitView(2, null, life).access, 'closed');
});

test('two friends in the same room see each other, chat and stickers stay in that room', async () => {
  const h = harness();
  const dowon = member(0),
    minseo = member(2),
    hohyeon = member(6);
  for (const p of [dowon, minseo, hohyeon]) {
    await h.run(p, 'wallet');
    await h.run(p, 'open', { code: 'BEMTADUVLY' });
  }
  // Dowon goes home, Minseo visits Dowon, Hohyeon stays in the village.
  let r = await act(h, dowon, { kind: 'area', area: 'home', home: 0 });
  assert.equal(r.ok, true, r.error);
  r = await act(h, minseo, { kind: 'area', area: 'home', home: 0, x: 7.5, y: 85.85 });
  assert.equal(r.ok, true, r.error);
  await act(h, hohyeon, { kind: 'area', area: 'village', x: 50, y: 60 });
  r = await act(h, minseo, { kind: 'move', x: 40, y: 55.5 });
  assert.equal(me(r, minseo).x, 40);
  assert.equal(me(r, minseo).y, 55.5, 'home coordinates are not clamped to the hall range');
  const seen = (await h.run(dowon, 'read')).packet.players;
  const guest = seen.find((p) => p.id === minseo.id);
  assert.deepEqual([guest.area, guest.home, guest.x, guest.y], ['home', 0, 40, 55.5]);
  assert.equal(seen.find((p) => p.id === dowon.id).home, 0);
  // Chat in the room reaches the room, not the village (and vice versa).
  await act(h, minseo, { kind: 'chat', text: '방 너무 예쁘다!' });
  h.tick(600);
  await act(h, hohyeon, { kind: 'chat', text: '마을에서 안녕' });
  const ownerChat = (await h.run(dowon, 'read')).packet.chat.map((c) => c.text);
  assert.deepEqual(ownerChat, ['방 너무 예쁘다!']);
  const villageChat = (await h.run(hohyeon, 'read')).packet.chat.map((c) => c.text);
  assert.deepEqual(villageChat, ['마을에서 안녕']);
  // Stickers with the 'home' scope only work while in a room.
  r = await act(h, minseo, { kind: 'reaction', id: 'love', scope: 'home' });
  assert.equal(r.ok, true, r.error);
  r = await act(h, hohyeon, { kind: 'reaction', id: 'love', scope: 'home' });
  assert.equal(r.ok, false);
  // Leaving the room drops the room tag.
  r = await act(h, minseo, { kind: 'area', area: 'village', x: 50, y: 60 });
  assert.equal(me(r, minseo).home, undefined);
});

test('a closed room turns visitors away; the owner may always walk in; offline owners stay visitable', async () => {
  const h = harness();
  const jaemin = member(5),
    gangjae = member(1);
  for (const p of [jaemin, gangjae]) {
    await h.run(p, 'wallet');
    await h.run(p, 'open', { code: 'BEMTADUVLY' });
  }
  // Jaemin's room is open by default, even though Jaemin is not at home.
  let r = await act(h, gangjae, { kind: 'area', area: 'home', home: 5 });
  assert.equal(r.ok, true, r.error);
  // Jaemin closes it: new entries are refused with a clear message.
  r = await act(h, jaemin, { kind: 'room', access: 'closed' });
  assert.equal(r.ok, true, r.error);
  assert.equal(r.life.rooms[5].access, 'closed');
  await act(h, gangjae, { kind: 'area', area: 'village' });
  r = await act(h, gangjae, { kind: 'area', area: 'home', home: 5 });
  assert.equal(r.ok, false);
  assert.equal(r.error, HOME_CLOSED);
  assert.equal(me(r, gangjae)?.area ?? 'village', 'village');
  // The owner can still go home; bad owners are rejected.
  r = await act(h, jaemin, { kind: 'area', area: 'home', home: 5 });
  assert.equal(r.ok, true, r.error);
  r = await act(h, gangjae, { kind: 'area', area: 'home', home: 12 });
  assert.equal(r.ok, false);
  // Going home without an owner means my own room.
  r = await act(h, gangjae, { kind: 'area', area: 'home' });
  assert.equal(me(r, gangjae).home, 1);
  // Reopening lets friends in again; every room change bumps the revision hint.
  r = await act(h, jaemin, { kind: 'room', access: 'public' });
  const rev = r.life.rooms[5].rev;
  r = await act(h, gangjae, { kind: 'area', area: 'home', home: 5 });
  assert.equal(r.ok, true, r.error);
  r = await act(h, jaemin, { kind: 'room' });
  assert.equal(r.life.rooms[5].rev, rev + 1);
  // Only the owner decides: a visitor's 'room' action changes their own room.
  r = await act(h, gangjae, { kind: 'room', access: 'closed' });
  assert.equal(r.life.rooms[5].access, 'public');
  assert.equal(r.life.rooms[1].access, 'closed');
});

test('closing a room moves visitors already inside back to the village (server-side)', async () => {
  const h = harness();
  const jaemin = member(5),
    gangjae = member(1),
    minseo = member(2);
  for (const p of [jaemin, gangjae, minseo]) {
    await h.run(p, 'wallet');
    await h.run(p, 'open', { code: 'BEMTADUVLY' });
  }
  await act(h, jaemin, { kind: 'area', area: 'home', home: 5 });
  await act(h, gangjae, { kind: 'area', area: 'home', home: 5 });
  // Minseo is in her own room, which stays untouched.
  await act(h, minseo, { kind: 'area', area: 'home' });
  let r = await act(h, jaemin, { kind: 'room', access: 'closed' });
  assert.equal(r.ok, true, r.error);
  // Same transition: the visitor is out, the owner and Minseo stay home.
  assert.equal(me(r, gangjae).area, 'village');
  assert.equal(me(r, gangjae).home, undefined);
  assert.deepEqual([me(r, gangjae).x, me(r, gangjae).y], [AREA_DEFAULTS.village.x, AREA_DEFAULTS.village.y]);
  assert.equal(me(r, jaemin).area, 'home');
  assert.equal(me(r, minseo).home, 2);
  r = await h.run(gangjae, 'read');
  assert.equal(me(r, gangjae).area, 'village');
});

test('a visitor left inside a closed room is moved out on the next tick', async () => {
  const h = harness();
  const jaemin = member(5),
    gangjae = member(1);
  for (const p of [jaemin, gangjae]) {
    await h.run(p, 'wallet');
    await h.run(p, 'open', { code: 'BEMTADUVLY' });
  }
  await act(h, gangjae, { kind: 'area', area: 'home', home: 5 });
  // The room was closed outside this room's transitions (e.g. an older
  // server wrote world.life): any later transition evicts the visitor.
  const world = h.world;
  world.life = lifeAction(readLife(world.life), world.ledger, { id: jaemin.id, actor: 5 }, { kind: 'room', access: 'closed' }, Date.now()).life;
  const r = await h.run(jaemin, 'read');
  assert.equal(r.packet.players.find((p) => p.id === gangjae.id).area, 'village');
});
