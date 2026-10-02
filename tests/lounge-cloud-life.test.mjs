import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import {
  INITIAL_BEOM,
  newLoungeLedger,
  validateLedger,
} from '../app/lounge-economy.ts';
import {
  ACCOUNT_IDS,
  friendVisitView,
  visitOwnerValid,
} from '../app/lounge-accounts.ts';
import { freshLounge, defaultLook } from '../app/lounge-look.ts';
import { TURN_LIMIT_MS, GAME_INFO } from '../app/lounge-games.ts';
import { CHESS_MOVE_MS } from '../app/lounge-chess.ts';
import * as room from '../app/lounge-room.ts';
import { SELL_CAP_PER_DAY } from '../app/lounge-life.ts';

const uuid = () => crypto.randomUUID();
const member = (actor) => ({
  id: uuid(),
  actor,
  username: ACCOUNT_IDS[actor],
  connection: uuid(),
  sequence: 0,
  epoch: 0,
  code: '',
});
function harness(initial = null) {
  let world = structuredClone(
      initial ?? { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    ),
    now = Date.UTC(2026, 8, 24, 3, 0, 0);
  return {
    get world() {
      return world;
    },
    get now() {
      return now;
    },
    async run(p, op, extra = {}, withCode = true) {
      const command = {
          op,
          connection: p.connection,
          ...(withCode && p.code ? { code: p.code } : {}),
          ...(!['read', 'wallet'].includes(op)
            ? { requestId: uuid(), sequence: ++p.sequence }
            : {}),
          ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
          ...extra,
        },
        hash = await commandHash(command),
        result = cloudTransition(world, p, command, hash, now);
      world = result.state;
      p.epoch = result.response.epoch;
      if (result.response.code) p.code = result.response.code;
      validateLedger(world.ledger);
      return { ...result, command, hash };
    },
    replay(p, command, hash) {
      const result = cloudTransition(world, p, command, hash, now);
      world = result.state;
      return result;
    },
    advance(ms) {
      now += ms;
    },
  };
}
const balance = (h, p) => h.world.ledger.accounts['wallet-' + p.id];

test('old worlds without life load; every response carries a life view', async () => {
  const h = harness(),
    a = member(0);
  assert.equal(h.world.life, undefined);
  const wallet = await h.run(a, 'wallet');
  assert.equal(wallet.response.ok, true);
  assert.deepEqual(wallet.response.life.me.bag.seeds.carrot, 3);
  // A read-only wallet call does not write life state.
  assert.equal(h.world.life, undefined);
  const opened = await h.run(a, 'open');
  assert.equal(opened.response.ok, true);
  assert.equal(h.world.life.actors[a.id], 0);
  assert.ok(opened.response.packet);
  assert.equal(opened.response.packet.life, undefined, "life travels once, at the top level");
  assert.equal(opened.response.life.me.farm.filter((p) => !p.locked).length, 24);
});

test('life actions work outside rooms and inside the village room', async () => {
  const h = harness(),
    a = member(0),
    b = member(1);
  // Outside any room.
  const planted = await h.run(a, 'action', {
    action: { kind: 'plant', plot: 0, crop: 'carrot' },
  });
  assert.equal(planted.response.ok, true, planted.response.error);
  assert.equal(planted.response.life.me.farm[0].crop, 'carrot');
  // Inside a room: the lease sequence is honoured and friends are notified.
  await h.run(a, 'open');
  b.code = a.code;
  await h.run(b, 'join');
  const status = await h.run(b, 'action', {
    action: { kind: 'status', text: '밭 가꾸는 중' },
  });
  assert.equal(status.response.ok, true, status.response.error);
  assert.deepEqual(status.notifications, [a.code]);
  assert.equal(status.response.life.statuses[b.id].text, '밭 가꾸는 중');
  const readA = await h.run(a, 'read');
  assert.equal(readA.response.life.statuses[b.id].actor, 1);
  assert.equal(readA.response.life.housesPlotsPublic[a.id][0].crop, 'carrot');
  // A stale connection cannot act in the room.
  const stale = await h.run({ ...b, connection: uuid() }, 'action', {
    action: { kind: 'status', text: 'x' },
  });
  assert.equal(stale.response.ok, false);
  // Rejections carry the Korean reason.
  const bad = await h.run(a, 'action', { action: { kind: 'harvest', plot: 0 } });
  assert.equal(bad.response.ok, false);
  assert.equal(bad.response.error, '아직 다 자라지 않았어요.');
  h.advance(30 * 60_000);
  const harvested = await h.run(a, 'action', { action: { kind: 'harvest', plot: -1 } });
  assert.equal(harvested.response.life.me.bag.produce.carrot, 1);
});

test('buy is idempotent: replaying the same request never charges twice', async () => {
  const h = harness(),
    a = member(0);
  await h.run(a, 'open');
  // 가게 나누기: palettes are at the 등불 잡화점 in 시장 거리, bought only at its counter.
  const away = await h.run(a, 'action', { action: { kind: 'buy', item: 'palette-pastel', at: 'general' } });
  assert.equal(away.response.ok, false);
  assert.equal(away.response.error, '등불 잡화점에 가서 해 주세요.');
  const noShop = await h.run(a, 'action', { action: { kind: 'buy', item: 'palette-pastel' } });
  assert.equal(noShop.response.ok, false);
  assert.equal((await h.run(a, 'action', { action: { kind: 'area', area: 'market', x: 0, y: 0 } })).response.ok, true);
  const bought = await h.run(a, 'action', {
    action: { kind: 'buy', item: 'palette-pastel', at: 'general' },
  });
  assert.equal(bought.response.ok, true);
  assert.equal(balance(h, a), INITIAL_BEOM - 30_000);
  const replay = h.replay(a, bought.command, bought.hash);
  assert.equal(replay.response.ok, true);
  assert.equal(balance(h, a), INITIAL_BEOM - 30_000);
  const again = await h.run(a, 'action', {
    action: { kind: 'buy', item: 'palette-pastel', at: 'general' },
  });
  assert.equal(again.response.ok, false);
  assert.equal(again.response.error, '이미 가지고 있는 물건이에요.');
  assert.equal(balance(h, a), INITIAL_BEOM - 30_000);
  assert.deepEqual(again.response.life.me.unlocks, ['palette-pastel']);
});

test('a lost fruit-pick response replays once without adding fruit or moving the harvest time again', async () => {
  const h = harness(), a = member(0);
  await h.run(a, 'open');
  const before = h.world.life.bag[a.id].fruit;
  const picked = await h.run(a, 'action', { action: { kind: 'pick', tree: 'tree-1' } });
  assert.equal(picked.response.ok, true, picked.response.error);
  const bag = structuredClone(h.world.life.bag[a.id]);
  const pickedAt = structuredClone(h.world.life.fruitPickedAt[a.id]);
  assert.ok(bag.fruit > before);
  // The client lost that reply, then retried after its 12s action timeout.
  h.advance(21_000);
  const retry = h.replay(a, picked.command, picked.hash);
  assert.equal(retry.response.ok, true, retry.response.error);
  assert.deepEqual(h.world.life.bag[a.id], bag);
  assert.deepEqual(h.world.life.fruitPickedAt[a.id], pickedAt);
  assert.equal(h.world.receipts[a.id].filter((r) => r.id === picked.command.requestId).length, 1);
  validateLedger(h.world.ledger);
});

test('sell and mail gifts through the cloud keep the ledger valid', async () => {
  const h = harness(),
    a = member(0),
    b = member(1);
  await h.run(a, 'open');
  b.code = a.code;
  await h.run(b, 'join');
  await h.run(a, 'action', { action: { kind: 'pick', tree: 'tree-1' } });
  const fruit = h.world.life.bag[a.id].fruit;
  assert.ok(fruit >= 1);
  // From the bag (not at the 농협 counter) fruit pays 85%: 150 → 128.
  const sold = await h.run(a, 'action', { action: { kind: 'sell', crop: 'fruit', n: 1 } });
  assert.equal(sold.response.ok, true);
  assert.equal(balance(h, a), INITIAL_BEOM + 128);
  assert.equal(sold.response.life.sellCapLeft, SELL_CAP_PER_DAY - 128);
  assert.equal(sold.response.life.soldToday, 128);
  assert.equal(sold.response.life.me.demand.fruit, 1);
  h.world.life.bag[a.id].fruit = 3;
  {
    const mailed = await h.run(a, 'action', {
      action: { kind: 'mail', to: 1, text: '과일 선물', gift: { kind: 'fruit', n: 1 } },
    });
    assert.equal(mailed.response.ok, true, mailed.response.error);
    const readB = await h.run(b, 'read');
    assert.equal(readB.response.life.me.mailUnread, 1);
    assert.equal(readB.response.life.me.bag.fruit, 1);
  }
});

test('friend visit view: bedroom and look from the save, guestbook from the world', async () => {
  assert.equal(visitOwnerValid(7), false);
  assert.equal(visitOwnerValid(-1), false);
  assert.equal(visitOwnerValid('1'), false);
  assert.throws(() => friendVisitView(9, null, null));
  const empty = friendVisitView(2, null, undefined);
  assert.equal(empty.bedroom, null);
  assert.deepEqual(empty.look, defaultLook(2));
  assert.deepEqual(empty.guestbook, []);
  const h = harness(),
    a = member(0),
    b = member(2);
  await h.run(b, 'wallet');
  await h.run(b, 'action', { action: { kind: 'status', text: '놀러 와!' } });
  await h.run(a, 'action', { action: { kind: 'guestbook', owner: 2, text: '방 예쁘다' } });
  const save = freshLounge(2);
  const visit = friendVisitView(2, save, h.world.life);
  assert.equal(visit.owner, 2);
  assert.deepEqual(visit.bedroom, save.bedroom);
  assert.equal(visit.guestbook[0].text, '방 예쁘다');
  assert.equal(visit.guestbook[0].actor, 0);
  assert.equal(visit.status.text, '놀러 와!');
  // Garbage saves fall back to the default room instead of throwing.
  assert.ok(friendVisitView(2, { version: 99, junk: true }, null).bedroom);
});

test('light games module matches the engine', () => {
  assert.equal(TURN_LIMIT_MS.chess, CHESS_MOVE_MS);
  assert.equal(room.GAME_INFO, GAME_INFO);
  assert.equal(room.emptyLoungeView().status, 'offline');
});
