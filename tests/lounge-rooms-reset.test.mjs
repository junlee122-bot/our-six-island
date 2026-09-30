// 새 방 가구 초기화 (lounge-rooms-reset.ts): a dry run on a realistic world,
// the reset through the real cloud transition, idempotency, the ledger
// untouched, and the model-house styles / 기본 가구 bought afterwards.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { INITIAL_BEOM, newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS, friendVisitView, lifeUnlocksOf, serverAccountSave, furniturePolicyOf } from '../app/lounge-accounts.ts';
import { readLife } from '../app/lounge-life.ts';
import { ROOMS_RESET_ID, afterRoomsReset, applyRoomsReset, readRoomsReset, roomsResetReport } from '../app/lounge-rooms-reset.ts';
import { DEFAULT_BED, defaultBedroom, readBedroom } from '../app/lounge-bedroom-data.ts';
import { legacyRoomItems } from '../app/lounge-bedroom-layouts.ts';
import { freshLounge } from '../app/lounge-look.ts';
import { THEME_STYLES, THEME_STYLE_PRICE, BASIC_FURNITURE_PRICES, FURNITURE_BY_REF } from '../app/lounge-items.ts';

const uuid = () => crypto.randomUUID();
const T0 = Date.UTC(2026, 9, 2, 3, 0, 0); // 2026-10-02 12:00 KST
const member = (actor) => ({ id: uuid(), actor, username: ACCOUNT_IDS[actor], connection: uuid(), sequence: 0, epoch: 0, code: '' });

function harness(initial) {
  let world = structuredClone(initial ?? { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} }),
    now = T0;
  return {
    get world() {
      return world;
    },
    set world(w) {
      world = w;
    },
    advance(ms) {
      now += ms;
    },
    async run(p, op, extra = {}) {
      const command = {
        op,
        connection: p.connection,
        ...(!['read', 'wallet'].includes(op) ? { requestId: uuid(), sequence: ++p.sequence } : {}),
        ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
        ...extra,
      };
      const result = cloudTransition(world, p, command, await commandHash(command), now);
      world = result.state;
      p.epoch = result.response.epoch;
      validateLedger(world.ledger);
      return result;
    },
  };
}
const act = (h, p, action) => h.run(p, 'action', { action });
function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  const reserved = Object.values(ledger.games)
    .filter((g) => g.state === 'reserved')
    .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
  assert.equal(balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0), Object.keys(ledger.accounts).length * INITIAL_BEOM);
}

/**
 * A world as it looked before 2026-10-02: three friends who played for a
 * while (fields, sales, mail, a house tier), with furniture bought, crafted,
 * gifted and one stolen copy — and no reset mark yet.
 */
async function oldWorld() {
  const h = harness(),
    [a, b, c] = [member(0), member(3), member(6)];
  for (const p of [a, b, c]) {
    const r = await act(h, p, { kind: 'plant', plot: 0, crop: 'carrot' });
    assert.equal(r.response.ok, true, r.response.error);
  }
  await act(h, a, { kind: 'status', text: '오늘은 낚시' });
  await act(h, b, { kind: 'mail', to: 0, text: '방 구경 갈게' });
  const w = structuredClone(h.world);
  const life = w.life;
  // Stored before the new rooms: no done-mark.
  delete life.roomsReset;
  life.ext ??= {};
  life.ext[a.id] = { ...(life.ext[a.id] ?? {}), furn: { 'furn-chair': 2, 'furn-sofa-rose': 1, 'furn-bonsai': 1 }, house: 2, lux: { w: 1, refs: ['furn-bonsai'] } };
  life.ext[b.id] = { ...(life.ext[b.id] ?? {}), furn: { 'furn-radio': 1, 'furn-project-plaque': 1 }, furnStrict: { 'furn-plant': true } };
  // c owns nothing (a theft mark only would also count; here nothing at all).
  life.bonds = { '0-3': 120, '3-6': 40 };
  h.world = w;
  return { h, a, b, c };
}
const stripFurniture = (life) => {
  const copy = structuredClone(life);
  delete copy.roomsReset;
  for (const x of Object.values(copy.ext ?? {})) {
    delete x.furn;
    delete x.furnStrict;
  }
  // Room revisions are bumped (checked separately).
  delete copy.rooms;
  return copy;
};

test('dry run on a realistic old world: exactly the furniture counts and theft marks, nothing else', async () => {
  const { h, a, b, c } = await oldWorld();
  const before = structuredClone(h.world);
  const report = roomsResetReport(readLife(h.world.life));
  const by = Object.fromEntries(report.members.map((m) => [m.uid, m]));
  assert.deepEqual(by[a.id], { uid: a.id, actor: 0, kinds: 3, copies: 4, strict: 0 });
  assert.deepEqual(by[b.id], { uid: b.id, actor: 3, kinds: 2, copies: 2, strict: 1 });
  assert.equal(by[c.id], undefined);
  assert.equal(report.copies, 6);
  assert.equal(report.kinds, 5);
  // A dry run changes nothing.
  assert.deepEqual(h.world, before);
  // Applying it in memory never touches its input either.
  const input = readLife(h.world.life),
    snapshot = structuredClone(input);
  const out = applyRoomsReset(input, T0);
  assert.deepEqual(input, snapshot);
  assert.equal(out.applied, true);
  assert.equal(out.empty, false);
  assert.deepEqual(out.life.roomsReset.backup[a.id], { actor: 0, furn: { 'furn-chair': 2, 'furn-sofa-rose': 1, 'furn-bonsai': 1 } });
  assert.deepEqual(out.life.roomsReset.backup[b.id], { actor: 3, furn: { 'furn-radio': 1, 'furn-project-plaque': 1 }, furnStrict: { 'furn-plant': true } });
  // Everything but the furniture is the same (범 lives in the ledger, not here).
  assert.deepEqual(stripFurniture(out.life), stripFurniture(input));
  assert.equal(out.life.ext[a.id].house, 2);
  assert.deepEqual(out.life.ext[a.id].lux, { w: 1, refs: ['furn-bonsai'] });
});

test('the cloud transition runs it once: backup stored, ledger untouched, furniture views empty', async () => {
  const { h, a, b } = await oldWorld();
  const ledgerBefore = JSON.stringify(h.world.ledger),
    lifeBefore = readLife(h.world.life),
    revs = Object.fromEntries(Object.entries(lifeBefore.rooms ?? {}).map(([uid, r]) => [uid, r.rev]));
  // Even a plain read commits it (there is something to wipe).
  const read = await h.run(a, 'read');
  assert.equal(read.changed, true);
  assert.equal(JSON.stringify(h.world.ledger), ledgerBefore, 'the ledger is exactly the same');
  invariant(h.world.ledger);
  const life = readLife(h.world.life);
  assert.equal(life.roomsReset.id, ROOMS_RESET_ID);
  assert.equal(life.roomsReset.at, T0);
  assert.equal(life.ext[a.id].furn, undefined);
  assert.equal(life.ext?.[b.id]?.furnStrict, undefined);
  assert.deepEqual(life.roomsReset.backup[a.id].furn, { 'furn-chair': 2, 'furn-sofa-rose': 1, 'furn-bonsai': 1 });
  assert.equal(life.rooms[a.id].rev, (revs[a.id] ?? 0) + 1, 'visitors refetch the room');
  assert.deepEqual(read.response.life.me.furniture, {});
  assert.deepEqual(read.response.life.me.furnitureStrict, {});
  // The backup never travels to a client.
  assert.equal(JSON.stringify(read.response).includes('roomsReset'), false);
  assert.equal(JSON.stringify(read.response.life).includes('furn-sofa-rose'), false);
  // Other fields are the same as before.
  assert.deepEqual(stripFurniture(life).bonds, stripFurniture(lifeBefore).bonds);
  assert.deepEqual(life.farms, lifeBefore.farms);
  assert.deepEqual(life.mail, lifeBefore.mail);
  assert.equal(life.ext[a.id].house, 2);

  // Idempotent: furniture bought after the reset stays through any number of transitions.
  const bought = await act(h, a, { kind: 'buyFurniture', ref: 'desk', n: 1 });
  assert.equal(bought.response.ok, true, bought.response.error);
  const stored = JSON.stringify(h.world.life.roomsReset);
  for (let i = 0; i < 3; i++) {
    h.advance(60_000);
    await h.run(b, 'read');
    await act(h, b, { kind: 'status', text: '새 방 ' + i });
  }
  assert.equal(readLife(h.world.life).ext[a.id].furn.desk, 1);
  assert.equal(JSON.stringify(h.world.life.roomsReset), stored, 'the mark and backup never change again');
  const current = readLife(h.world.life),
    again = applyRoomsReset(current, T0 + 99);
  assert.equal(again.applied, false);
  assert.equal(again.life, current, 'the same object: nothing to do');
  invariant(h.world.ledger);
});

test('a fresh world only gets the mark with its first real write; later purchases are never wiped', async () => {
  const h = harness(),
    a = member(1);
  // Life is created by this action; the mark comes with it.
  const planted = await act(h, a, { kind: 'plant', plot: 0, crop: 'carrot' });
  assert.equal(planted.response.ok, true);
  assert.equal(h.world.life.roomsReset.id, ROOMS_RESET_ID);
  assert.deepEqual(h.world.life.roomsReset.backup, {});
  // An old world that has life but no furniture: a plain read writes nothing.
  const w = structuredClone(h.world);
  delete w.life.roomsReset;
  h.world = w;
  const read = await h.run(a, 'read');
  assert.equal(read.changed, false);
  // Its next real write stores the mark, and the purchase in it stays.
  const bought = await act(h, a, { kind: 'buyFurniture', ref: 'chair', n: 2 });
  assert.equal(bought.response.ok, true, bought.response.error);
  assert.equal(h.world.life.roomsReset.id, ROOMS_RESET_ID);
  await h.run(a, 'read');
  await act(h, a, { kind: 'status', text: '의자 두 개' });
  assert.equal(readLife(h.world.life).ext[a.id].furn.chair, 2);
});

test('profile, save and visit paths read the counts as reset even before the mark is stored', async () => {
  const { h, a } = await oldWorld();
  const life = h.world.life;
  assert.equal(life.roomsReset, undefined);
  // Old counts no longer allow placements…
  assert.deepEqual(lifeUnlocksOf(life, a.id), ['house-1', 'house-2', 'bed']);
  assert.deepEqual(furniturePolicyOf(life, a.id), { owned: undefined, strict: undefined });
  assert.deepEqual(afterRoomsReset(readLife(life)).ext[a.id].furn, undefined);
  // …so an old themed room cannot be saved back as a v4 room with old pieces.
  const oldRoom = { ...defaultBedroom(0), items: legacyRoomItems(0).filter((i) => !i.wall).slice(0, 4) };
  const save = { ...freshLounge(0), bedroom: oldRoom };
  assert.throws(() => serverAccountSave(save, 0, { ...freshLounge(0) }, lifeUnlocksOf(life, a.id)));
  // The stored v3 room itself reads as the new default room with its one bed.
  assert.deepEqual(readBedroom({ ...oldRoom, version: 3 }, 0).items, [DEFAULT_BED]);
  const visit = friendVisitView(0, { ...freshLounge(0), bedroom: { ...oldRoom, version: 3 } }, life);
  assert.deepEqual(visit.bedroom.items, [DEFAULT_BED]);
  assert.equal(visit.house, 2);
});

test('stored marks are read back strictly; junk is dropped', () => {
  const uid = '11111111-1111-4111-8111-111111111111';
  assert.equal(readRoomsReset(null), undefined);
  assert.equal(readRoomsReset({ id: 'other', at: 1, backup: {} }), undefined);
  const read = readRoomsReset({
    id: ROOMS_RESET_ID,
    at: -5,
    backup: { [uid]: { actor: 9, furn: { 'furn-chair': 2, 'BAD REF': 1, desk: -1 }, furnStrict: { 'furn-plant': true, x: 1 } }, nope: {} },
  });
  assert.deepEqual(read, { id: ROOMS_RESET_ID, at: 0, backup: { [uid]: { furn: { 'furn-chair': 2 }, furnStrict: { 'furn-plant': true } } } });
  // readLife keeps it (so every later write keeps the mark).
  const life = readLife({ roomsReset: read });
  assert.deepEqual(life.roomsReset, read);
});

test('모델하우스 벽지·바닥 and 기본 가구 are bought through the ledger', async () => {
  const h = harness(),
    a = member(2);
  await act(h, a, { kind: 'plant', plot: 0, crop: 'carrot' });
  const wallet = () => h.world.ledger.accounts['wallet-' + a.id];
  const start = wallet();
  const ok = await act(h, a, { kind: 'buyRoomStyle', style: 'sage' });
  assert.equal(ok.response.ok, true, ok.response.error);
  assert.equal(wallet(), start - THEME_STYLE_PRICE);
  assert.deepEqual(ok.response.life.me.styles, ['sage']);
  assert.equal((await act(h, a, { kind: 'buyRoomStyle', style: 'sage' })).response.ok, false, 'once is enough');
  assert.equal((await act(h, a, { kind: 'buyRoomStyle', style: 'gold' })).response.ok, false, 'house-tier styles are not sold here');
  assert.equal((await act(h, a, { kind: 'buyRoomStyle', style: '__proto__' })).response.ok, false);
  assert.equal(wallet(), start - THEME_STYLE_PRICE);
  invariant(h.world.ledger);
  assert.ok(lifeUnlocksOf(h.world.life, a.id).includes('style-sage'));
  // The wall can now be saved; the floor of that theme is a separate purchase.
  const room = { ...defaultBedroom(2), wall: 'sage' };
  assert.doesNotThrow(() => serverAccountSave({ ...freshLounge(2), bedroom: room }, 2, undefined, lifeUnlocksOf(h.world.life, a.id)));
  assert.throws(() => serverAccountSave({ ...freshLounge(2), bedroom: { ...room, floor: 'pale' } }, 2, undefined, lifeUnlocksOf(h.world.life, a.id)));
  assert.equal(THEME_STYLES.length, 8);
  // 기본 가구 is always on the shelf (every day, never rotated away).
  const shelf = ok.response.life.shop.basic;
  assert.equal(shelf.length, Object.keys(BASIC_FURNITURE_PRICES).length);
  for (const item of shelf) assert.equal(FURNITURE_BY_REF[item.ref].basic, true);
  assert.ok(!ok.response.life.shop.items.some((i) => FURNITURE_BY_REF[i.ref].basic), 'not in the daily rotation');
  const before = wallet();
  const desk = await act(h, a, { kind: 'buyFurniture', ref: 'desk', n: 2 });
  assert.equal(desk.response.ok, true, desk.response.error);
  assert.equal(before - wallet(), shelf.find((i) => i.ref === 'desk').price * 2);
  assert.equal(desk.response.life.me.furniture.desk, 2);
  invariant(h.world.ledger);
});
