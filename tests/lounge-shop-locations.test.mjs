// Where the server lets you buy and sell (handover/design/design-food-and-shops.md
// §1 "서버에서 위치 확인"): 나무결 가구점 and 범마을 부동산 only at their door in
// the hub (lounge-hub-counters.ts), and the four shop rooms (가게 실내) count as
// standing at their own counter for `at` purchases and sales.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { INITIAL_BEOM, newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { HUB_COUNTER_REACH, atHubCounter, hubCounterDoor, hubCounterFor } from '../app/lounge-hub-counters.ts';
import { villageToNetwork } from '../app/lounge-village-layout.ts';
import { SHOP_AREAS, SHOP_INTERIORS } from '../app/lounge-shop-interiors.ts';
import { MARKET_SHOPS } from '../app/lounge-market-layout.ts';
import { BASIC_FURNITURE_PRICES } from '../app/lounge-items.ts';

const uuid = () => crypto.randomUUID();
const kst = (y, m, d, h = 12) => Date.UTC(y, m - 1, d, h - 9);
const T0 = kst(2026, 10, 1); // Thursday noon

function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  const reserved = Object.values(ledger.games)
    .filter((g) => g.state === 'reserved')
    .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
  assert.equal(balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0), Object.keys(ledger.accounts).length * INITIAL_BEOM);
}

async function cloud(actor = 0) {
  let w = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const p = { id: uuid(), actor, username: ACCOUNT_IDS[actor], connection: uuid(), sequence: 0, epoch: 0, code: '' };
  const run = async (op, extra = {}) => {
    const command = {
      op,
      connection: p.connection,
      ...(p.code ? { code: p.code } : {}),
      ...(!['read', 'wallet'].includes(op) ? { requestId: uuid(), sequence: ++p.sequence } : {}),
      ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
      ...extra,
    };
    const r = cloudTransition(w, p, command, await commandHash(command), T0);
    w = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    invariant(w.ledger);
    return r.response;
  };
  const act = (action) => run('action', { action });
  const go = async (area, x, y) => {
    const r = await act({ kind: 'area', area, x, y });
    assert.ok(!r.error, `${area}: ${r.error}`);
  };
  await run('wallet');
  return {
    p,
    run,
    act,
    go,
    get w() {
      return w;
    },
    uid: () => Object.keys(w.life.actors).find((k) => w.life.actors[k] === actor),
    wallet: () => w.ledger.accounts['wallet-' + p.id],
  };
}
const door = (counter) => villageToNetwork(hubCounterDoor(counter));

test('hub counters: which actions need which shop', () => {
  assert.equal(hubCounterFor('buyFurniture'), 'furniture');
  assert.equal(hubCounterFor('rerollShop'), 'furniture');
  assert.equal(hubCounterFor('upgradeHouse'), 'realty');
  assert.equal(hubCounterFor('buyRoomStyle'), 'realty');
  for (const kind of ['buyItem', 'sellItem', 'plant', 'move', undefined]) assert.equal(hubCounterFor(kind), null);
  // The two doors are far enough apart that no spot counts for both.
  const f = hubCounterDoor('furniture'),
    r = hubCounterDoor('realty');
  assert.ok(Math.hypot(f.x - r.x, f.z - r.z) > HUB_COUNTER_REACH * 2);
  assert.ok(atHubCounter('furniture', { area: 'village', ...door('furniture') }));
  assert.ok(!atHubCounter('furniture', { area: 'village', ...door('realty') }));
  assert.ok(!atHubCounter('furniture', { area: 'market', ...door('furniture') }), 'the same numbers in a district are somewhere else');
  assert.ok(!atHubCounter('realty', undefined));
  assert.ok(!atHubCounter('realty', { area: 'village', x: NaN, y: 50 }));
});

test('나무결 가구점: furniture and rerolls only at its door in the hub', async () => {
  const c = await cloud(1);
  // Not connected to the village at all.
  assert.match((await c.act({ kind: 'buyFurniture', ref: 'desk', n: 1 })).error ?? '', /나무결 가구점에 가서/);
  await c.run('open', { code: 'BEMTADUVLY' });
  const start = c.wallet();
  // The plaza, the realty's door, 시장 거리: all refused, nothing paid.
  for (const [area, at] of [['village', villageToNetwork({ x: 0, z: 10 })], ['village', door('realty')], ['market', { x: 50, y: 50 }]]) {
    await c.go(area, at.x, at.y);
    assert.match((await c.act({ kind: 'buyFurniture', ref: 'desk', n: 1 })).error ?? '', /나무결 가구점에 가서/, area);
    assert.match((await c.act({ kind: 'rerollShop' })).error ?? '', /나무결 가구점에 가서/, area);
  }
  assert.equal(c.wallet(), start);
  await c.go('village', door('furniture').x, door('furniture').y);
  const bought = await c.act({ kind: 'buyFurniture', ref: 'desk', n: 1 });
  assert.ok(!bought.error, bought.error);
  assert.equal(start - c.wallet(), BASIC_FURNITURE_PRICES.desk);
  assert.equal(bought.life.me.furniture.desk, 1);
  const reroll = await c.act({ kind: 'rerollShop' });
  assert.ok(!reroll.error, reroll.error);
  // The realty's actions are still not sold here.
  assert.match((await c.act({ kind: 'upgradeHouse' })).error ?? '', /범마을 부동산에 가서/);
  assert.match((await c.act({ kind: 'buyRoomStyle', style: 'sage' })).error ?? '', /범마을 부동산에 가서/);
});

test('범마을 부동산: house upgrades and model-house styles only at its door in the hub', async () => {
  const c = await cloud(2);
  await c.run('open', { code: 'BEMTADUVLY' });
  const start = c.wallet();
  await c.go('village', door('furniture').x, door('furniture').y);
  assert.match((await c.act({ kind: 'buyRoomStyle', style: 'sage' })).error ?? '', /범마을 부동산에 가서/);
  assert.match((await c.act({ kind: 'upgradeHouse' })).error ?? '', /범마을 부동산에 가서/);
  await c.go('coop', SHOP_INTERIORS.coop.front.x, SHOP_INTERIORS.coop.front.y);
  assert.match((await c.act({ kind: 'buyRoomStyle', style: 'sage' })).error ?? '', /범마을 부동산에 가서/);
  assert.equal(c.wallet(), start);
  await c.go('village', door('realty').x, door('realty').y);
  const style = await c.act({ kind: 'buyRoomStyle', style: 'sage' });
  assert.ok(!style.error, style.error);
  assert.deepEqual(style.life.me.styles, ['sage']);
  // Past the location check, the house upgrade is the engine's own rule (here: not enough 범).
  const house = await c.act({ kind: 'upgradeHouse' });
  assert.doesNotMatch(house.error ?? '', /에 가서/);
});

// Guards the merge fix in lounge-cloud-engine.ts: "its counter inside the shop's own room counts too".
test('shop rooms: buying and selling with `at` works inside the shop and nowhere else', async () => {
  const c = await cloud(3);
  await c.run('open', { code: 'BEMTADUVLY' });
  c.w.life.flags = [...(c.w.life.flags ?? []), 'district-harbor'];
  const uid = c.uid();
  const give = (crop, n) => (c.w.life.bag[uid].produce[crop] = n);
  const deals = {
    bakery: { kind: 'buyItem', item: 'bento-miner', n: 1, at: 'bakery' },
    general: { kind: 'buy', item: 'seed-carrot', n: 1, at: 'general' },
    coop: { kind: 'sell', crop: 'pumpkin', n: 1, at: 'coop' },
    fishmarket: { kind: 'buyItem', item: 'bait', n: 1, at: 'fishmarket' },
  };
  // 범마을 증권 sells no goods; its orders are checked in lounge-stocks.test.mjs.
  const goods = SHOP_AREAS.filter((s) => s !== 'broker');
  assert.deepEqual(Object.keys(deals).sort(), [...goods].sort(), 'every shop room is covered');
  for (const shop of goods) {
    give('pumpkin', 3);
    const deal = deals[shop],
      name = SHOP_INTERIORS[shop].name.split(' ').at(-1);
    // From the hub and from another shop's room: refused, nothing paid.
    await c.go('village', 50, 60);
    let before = c.wallet();
    assert.match((await c.act(deal)).error ?? '', /에 가서 해 주세요/, `${shop} from the village`);
    const other = SHOP_AREAS.find((s) => s !== shop && SHOP_INTERIORS[s].district === SHOP_INTERIORS[shop].district) ?? SHOP_AREAS.find((s) => s !== shop);
    await c.go(other, SHOP_INTERIORS[other].front.x, SHOP_INTERIORS[other].front.y);
    assert.match((await c.act(deal)).error ?? '', /에 가서 해 주세요/, `${shop} from inside ${other}`);
    assert.equal(c.wallet(), before);
    // Inside its own room, at the counter: done.
    await c.go(shop, SHOP_INTERIORS[shop].front.x, SHOP_INTERIORS[shop].front.y);
    before = c.wallet();
    const r = await c.act(deal);
    assert.ok(!r.error, `${shop} (${name}) inside: ${r.error}`);
    assert.notEqual(c.wallet(), before, `${shop}: money moved`);
  }
  // Out in the shop's district still works as before (the counter at the door).
  give('pumpkin', 1);
  const coop = MARKET_SHOPS.find((s) => s.id === 'coop');
  assert.ok(coop);
  await c.go('market', 50, 50);
  assert.ok(!(await c.act(deals.coop)).error);
});

test('room editor hint: trophies and the fruit basket are sold at 등불 잡화점 only', async () => {
  const { readFileSync } = await import('node:fs');
  const { emptyLife } = await import('../app/lounge-life.ts');
  const { SHOP_IDS, shopOffer } = await import('../app/lounge-shops.ts');
  const life = emptyLife();
  for (const item of ['fruit-basket', 'trophy-carrot']) {
    const sellers = SHOP_IDS.filter((s) => shopOffer(life, 0, s, item, T0));
    assert.deepEqual(sellers, ['general'], item);
  }
  const editor = readFileSync(new URL('../app/lounge-bedroom-editor.tsx', import.meta.url), 'utf8');
  assert.match(editor, /등불 잡화점에서 트로피와 과일 바구니를 살 수 있어요/);
});
