import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CROPS, CROP_INFO, QUALITY_MULT, SHOP_BY_ID, emptyLife, ensureLifeMember,
  lifeAction, lifeView, packLife, plotReadyAt, plotThirsty, readLife, cropInSeason,
} from '../app/lounge-life.ts';
import { NEW_CROP_INFO, NEW_CROP_IDS, CROP_CAT, productOf, isGoodId } from '../app/lounge-farm-data.ts';
import { addCropQ, cropQCount, itemCount, demandHalfLife, demandMult, sellUnit } from '../app/lounge-life-plus.ts';
import { goodsById, stockCount, stockKey, parseStock } from '../app/lounge-farm.ts';
import { storeCountAtLeast, takeStore } from '../app/lounge-farm-sites.ts';
import { giftCatalog, giftCategoryOf } from '../app/lounge-friend-tastes.ts';
import { npcGiftable } from '../app/lounge-romance.ts';
import { buyerOf, sellerOf, shopOffer } from '../app/lounge-shops.ts';
import { craftTracker, craftTargetOptions, readCraftTargets } from '../app/lounge-craft-tracker.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACTOR_IDS, ACCOUNT_IDS } from '../app/lounge-roster.ts';
import { newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { tillAll } from './farm-test-help.mjs';

const CROP = 'legendarytomato', JAR = `jar-${CROP}`, KEG = `keg-${CROP}`;
const NOW = Date.UTC(2026, 10, 16, 1), HOUR = 3_600_000, MINUTE = 60_000;
function world(actors = [0, 7]) {
  const members = actors.map((actor) => ({ id: crypto.randomUUID(), actor }));
  let life = emptyLife(), ledger = newLoungeLedger();
  for (const m of members) { life = ensureLifeMember(life, m.id, m.actor); ledger = registerWallet(ledger, 'wallet-' + m.id); }
  tillAll(life);
  return {
    members,
    get life() { return life; }, set life(v) { life = v; },
    get ledger() { return ledger; },
    balance(m = members[0]) { return ledger.accounts['wallet-' + m.id]; },
    view(m = members[0], now = NOW) { return lifeView(life, m.id, m.actor, now); },
    act(action, m = members[0], now = NOW) {
      const before = structuredClone(life), next = lifeAction(life, ledger, m, action, now);
      assert.deepEqual(life, before, 'a failed/retried CAS proposal never mutates the original');
      life = next.life; ledger = next.ledger; validateLedger(ledger); return next;
    },
    reject(action, m = members[0], now = NOW) {
      const before = structuredClone(life), cash = structuredClone(ledger);
      assert.throws(() => lifeAction(life, ledger, m, action, now));
      assert.deepEqual(life, before); assert.deepEqual(ledger, cash);
    },
    crop(n, q = 0, m = members[0], crop = CROP) { addCropQ(life, m.id, crop, q, n); },
    machine(kind, slot = 0, m = members[0]) { (((life.farmx ??= {})[m.id] ??= {}).mach ??= {})[slot] = { k: kind }; },
    plan(targets, m = members[0], now = NOW) { return craftTracker({ life: this.view(m, now), balance: this.balance(m), targets, actor: m.actor, now }); },
  };
}

test('legendary tomato is an appended, separate all-season crop with the approved slow economy and no starter grants', () => {
  assert.equal(CROPS.at(-1), CROP); assert.equal(NEW_CROP_IDS.at(-1), CROP);
  assert.equal(CROPS.filter((c) => c === CROP).length, 1);
  assert.equal(CROP_INFO[CROP].name, '전설의 토마토');
  assert.equal(NEW_CROP_INFO[CROP].growMs, 24 * HOUR);
  assert.equal(CROP_INFO[CROP].growMs, 14.4 * HOUR);
  assert.equal(CROP_INFO[CROP].seed, 4_000); assert.equal(CROP_INFO[CROP].sell, 10_000);
  assert.equal(CROP_INFO[CROP].regrow, undefined); assert.equal(CROP_CAT[CROP], 'veg');
  for (const season of ['spring', 'summer', 'autumn', 'winter']) assert.equal(cropInSeason(CROP, season), true);
  assert.equal(CROP_INFO.tomato.seed, 200); assert.equal(CROP_INFO.tomato.sell, 480); assert.equal(CROP_INFO.tomato.growMs, 0.6 * HOUR);
  assert.equal(demandHalfLife(CROP), 3); assert.equal(demandHalfLife('tomato'), 10);
  const profit = 6 * (CROP_INFO[CROP].sell - CROP_INFO[CROP].seed) / (CROP_INFO[CROP].growMs / HOUR);
  assert.ok(profit >= 1_800 && profit < 4_000);
  const s = world(ACTOR_IDS);
  for (const m of s.members) { assert.equal(s.life.bag[m.id].seeds[CROP], 0); assert.equal(s.life.bag[m.id].produce[CROP], 0); }
  assert.deepEqual(readLife(packLife(s.life)), readLife(packLife(readLife(packLife(s.life)))));
});

test('all eight friends buy paid seeds or existing discounted bundles; ordinary tomato stock stays separate', () => {
  const s = world(ACTOR_IDS), seed = `seed-${CROP}`, bundle = `bundle-${CROP}`;
  assert.equal(SHOP_BY_ID[seed].crop, CROP); assert.equal(buyerOf(CROP), 'coop');
  for (const m of s.members) {
    assert.equal(sellerOf(s.life, m.actor, seed, NOW), 'general');
    assert.equal(shopOffer(s.life, m.actor, 'general', seed, NOW).price, 4_000);
    const before = s.balance(m), tomato = s.life.bag[m.id].seeds.tomato;
    s.act({ kind: 'buy', at: 'general', item: seed }, m);
    assert.equal(s.balance(m), before - 4_000);
    assert.equal(s.life.bag[m.id].seeds[CROP], 1);
    assert.equal(s.life.bag[m.id].seeds.tomato, tomato);
  }
  const m = s.members[7], before = s.balance(m), offer = shopOffer(s.life, m.actor, 'general', bundle, NOW);
  s.act({ kind: 'buy', at: 'general', item: bundle }, m);
  assert.equal(s.balance(m), before - offer.price);
  assert.equal(s.life.bag[m.id].seeds[CROP], 1 + SHOP_BY_ID[bundle].seeds);
});

test('a paid seed grows in the real private field, cannot harvest early, yields once and clears instead of regrowing', () => {
  const s = world(), m = s.members[1];
  s.act({ kind: 'buy', at: 'general', item: `seed-${CROP}` }, m);
  s.act({ kind: 'plant', plot: 0, crop: CROP }, m);
  assert.equal(s.life.bag[m.id].seeds[CROP], 0);
  if (plotThirsty(s.life.farms[m.id][0], NOW)) s.act({ kind: 'water', plot: 0 }, m);
  const ready = plotReadyAt(s.life.farms[m.id][0], NOW);
  assert.equal(ready, NOW + CROP_INFO[CROP].growMs);
  s.reject({ kind: 'harvest', plot: 0 }, m, ready - 1);
  s.act({ kind: 'harvest', plot: 0 }, m, ready);
  assert.equal(s.life.bag[m.id].produce[CROP], 1);
  assert.equal([0, 1, 2, 3].reduce((sum, q) => sum + cropQCount(s.life, m.id, CROP, q), 0), 1);
  assert.equal(s.life.farms[m.id][0].crop, null);
  s.reject({ kind: 'harvest', plot: 0 }, m, ready + MINUTE);
});

test('all qualities survive shipping/unshipping, friend gifts and JSON restoration without becoming normal tomatoes', () => {
  for (const q of [0, 1, 2, 3]) {
    const s = world(), [a, b] = s.members;
    s.crop(2, q); s.crop(3, 0, a, 'tomato');
    assert.deepEqual(parseStock(stockKey(CROP, q)), { id: CROP, q });
    s.act({ kind: 'ship', item: CROP, q, n: 1 });
    assert.equal(stockCount(s.life, a.id, CROP, q), 1);
    s.act({ kind: 'unship', item: CROP, q, n: 1 });
    assert.equal(cropQCount(s.life, a.id, CROP, q), 2);
    s.act({ kind: 'mail', to: b.actor, text: '잘 익은 토마토야', gift: { kind: 'produce', crop: CROP, n: 1 } });
    assert.equal(cropQCount(s.life, a.id, CROP, q), 1);
    assert.equal(cropQCount(s.life, b.id, CROP, q), 1);
    assert.equal(s.life.bag[a.id].produce.tomato, 3); assert.equal(s.life.bag[b.id].produce.tomato, 0);
    s.life = readLife(JSON.parse(JSON.stringify(packLife(s.life))));
    assert.equal(cropQCount(s.life, b.id, CROP, q), 1);
    assert.equal(s.life.mail[b.id][0].gift.crop, CROP);
  }
  assert.equal(giftCategoryOf(CROP), 'crop'); assert.equal(giftCatalog().has(CROP), true); assert.equal(npcGiftable(CROP), true);
});

test('legendary tomato sales use normal quality, seasonal premium, demand and individual account stock', () => {
  for (const q of [0, 1, 2, 3]) {
    const s = world(), [a, b] = s.members; s.crop(1, q); s.crop(2, q, b);
    const before = s.balance(); s.act({ kind: 'sell', crop: CROP, quality: q, n: 1, at: 'coop' });
    assert.equal(s.balance() - before, Math.round(10_000 * QUALITY_MULT[q] * 1.1));
    assert.equal(cropQCount(s.life, a.id, CROP, q), 0);
    assert.equal(cropQCount(s.life, b.id, CROP, q), 2);
    assert.equal(s.life.sold[a.id].amount, s.balance() - before);
  }
  assert.equal(sellUnit(CROP, 0, NOW), 11_000);
  assert.equal(demandMult(CROP, 3), 0.5);
  assert.ok(demandMult(CROP, 20) < demandMult(CROP, 1));
});

test('ordinary tomato recipes and bundle requirements never accept legendary tomato as a substitute', () => {
  const s = world(), m = s.members[0];
  s.crop(20, 3); s.crop(1, 0, m, 'carrot');
  s.reject({ kind: 'cook', recipe: 'salad' });
  s.reject({ kind: 'contribute', bundle: 'summer-harvest', slot: 0, n: 10 });
  assert.equal(itemCount(s.life, m.id, CROP), 20);
  s.crop(1, 0, m, 'tomato'); s.act({ kind: 'cook', recipe: 'salad' });
  assert.equal(itemCount(s.life, m.id, CROP), 20);
  assert.equal(itemCount(s.life, m.id, 'tomato'), 0);
});

test('jar and keg preserve the chosen input quality and have distinct registered outputs and tracker requirements', () => {
  for (const kind of ['jar', 'keg']) for (const q of [0, 1, 2, 3]) {
    const s = world(), m = s.members[0], output = `${kind}-${CROP}`;
    s.crop(1, q); s.machine(kind);
    assert.equal(productOf(kind, CROP), output); assert.equal(isGoodId(output), true);
    assert.equal(goodsById()[output].from, CROP);
    assert.equal(goodsById()[output].base, kind === 'jar' ? 20_050 : 22_500);
    const goal = { kind: 'good', id: output, quantity: 1 };
    assert.equal(readCraftTargets([goal]).length, 1);
    assert.equal(craftTargetOptions().some((o) => o.id === output), true);
    const plan = s.plan([goal]);
    assert.equal(plan.targets[0].requirements[0].id, CROP);
    assert.equal(plan.targets[0].requirements[0].allocated, 1);
    s.act({ kind: 'farmLoad', slot: 0, item: CROP, q });
    const machine = s.life.farmx[m.id].mach[0];
    assert.equal(cropQCount(s.life, m.id, CROP, q), 0);
    assert.equal(machine.out, output); assert.equal(machine.q ?? 0, q);
    s.reject({ kind: 'farmCollect', slot: 0 }, m, machine.done - 1);
    const queued = s.plan([goal]);
    assert.equal(queued.targets[0].queued, machine.n);
    assert.deepEqual(queued.raw, [], 'already loaded raw crops are not required again');
    assert.equal(queued.production[0].readyAt, machine.done);
    s.act({ kind: 'farmCollect', slot: 0 }, m, machine.done);
    assert.equal(stockCount(s.life, m.id, output, q), machine.n);
    assert.equal(s.plan([goal], m, machine.done).targets[0].complete, true);
    s.reject({ kind: 'farmCollect', slot: 0 }, m, machine.done);
  }
  assert.equal(goodsById()[JAR].name, '전설의 토마토 절임');
  assert.equal(goodsById()[KEG].name, '전설의 토마토즙');
  assert.equal(productOf('dehydrator', CROP), null);
});

test('a seedmaker consumes one real crop and yields only its recorded one or two seeds once', () => {
  const s = world(), m = s.members[0]; s.crop(1, 3); s.machine('seedmaker');
  s.act({ kind: 'farmLoad', slot: 0, item: CROP, q: 3 });
  const machine = { ...s.life.farmx[m.id].mach[0] };
  assert.equal(machine.out, `seed-${CROP}`); assert.ok(machine.n === 1 || machine.n === 2);
  assert.equal(s.life.bag[m.id].produce[CROP], 0);
  s.reject({ kind: 'farmCollect', slot: 0 }, m, machine.done - 1);
  s.act({ kind: 'farmCollect', slot: 0 }, m, machine.done);
  assert.equal(s.life.bag[m.id].seeds[CROP], machine.n);
  s.reject({ kind: 'farmCollect', slot: 0 }, m, machine.done);
  assert.ok(machine.n * CROP_INFO[CROP].seed <= CROP_INFO[CROP].sell, 'seed conversion cannot multiply the crop value for free');
});

test('the shared field harvest keeps the new crop and quality in shared storage across restore', () => {
  const s = world(), [a, b] = s.members;
  s.life.bag[a.id].seeds[CROP] = 4;
  s.act({ kind: 'commonTill', tile: 0 });
  s.act({ kind: 'commonPlant', tile: 0, crop: CROP });
  if (plotThirsty(s.life.farm.field[0], NOW)) s.act({ kind: 'commonWater', tile: 0 }, b);
  const ready = plotReadyAt(s.life.farm.field[0], NOW);
  s.act({ kind: 'commonHarvest', tile: 0 }, b, ready);
  assert.equal(storeCountAtLeast(s.life, CROP), 1);
  assert.equal(s.life.bag[b.id].produce[CROP], 0);
  const restored = readLife(JSON.parse(JSON.stringify(packLife(s.life))));
  assert.equal(storeCountAtLeast(restored, CROP), 1);
  const quality = s.view(a, ready).farmSites.store.find((row) => row.id === CROP).q;
  assert.equal(takeStore(restored, CROP, 1, quality).reduce((sum, n) => sum + n, 0), 1);
});

test('personal and shared greenhouse harvests keep crop ownership and shared storage separate', () => {
  const s = world(), [a, b] = s.members;
  s.life.bag[a.id].seeds[CROP] = 3;
  s.life.farm = { sites: {
    P0: { kind: 'greenhouseMini', tier: 1, owner: a.id, state: {} },
    L1: { kind: 'greenhouse', tier: 1, owner: 'shared', state: {} },
  } };
  s.act({ kind: 'sitePlant', site: 'P0', tile: 0, crop: CROP });
  s.act({ kind: 'sitePlant', site: 'L1', tile: 0, crop: CROP });
  s.act({ kind: 'sitePlant', site: 'L1', tile: 1, crop: CROP, shared: true });
  s.reject({ kind: 'siteHarvest', site: 'P0', tile: 0 }, b);
  s.reject({ kind: 'siteHarvest', site: 'L1', tile: 0 }, b);
  for (const site of ['P0', 'L1']) {
    if (Object.values(s.life.farm.sites[site].state.plots).some((p) => plotThirsty(p, NOW))) s.act({ kind: 'siteWater', site, tile: -1 });
  }
  const done = Math.max(...Object.values(s.life.farm.sites).flatMap((site) => Object.values(site.state.plots ?? {}).map((p) => plotReadyAt(p, NOW))));
  s.act({ kind: 'siteHarvest', site: 'P0', tile: 0 }, a, done);
  s.act({ kind: 'siteHarvest', site: 'L1', tile: -1 }, a, done);
  assert.equal(s.life.bag[a.id].produce[CROP], 2);
  assert.equal(storeCountAtLeast(s.life, CROP), 1);
  const restored = readLife(JSON.parse(JSON.stringify(packLife(s.life))));
  assert.equal(storeCountAtLeast(restored, CROP), 1);
});

test('cloud paid purchases and seedmaker collection replay once and retain the new crop after reconnect', async () => {
  let state = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const member = { id: crypto.randomUUID(), actor: 7, username: ACCOUNT_IDS[7], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' };
  let now = NOW;
  const send = async (action, extra = {}) => {
    const command = { op: 'action', action, connection: member.connection, requestId: crypto.randomUUID(), sequence: ++member.sequence, ...(member.code ? { code: member.code } : {}), ...extra };
    const hash = await commandHash(command), r = cloudTransition(state, member, command, hash, now);
    state = r.state; member.epoch = r.response.epoch; if (r.response.code) member.code = r.response.code;
    assert.equal(r.response.ok, true, r.response.error); validateLedger(state.ledger);
    return { ...r, command, hash };
  };
  await send(undefined, { op: 'open', epoch: 0, code: 'LEGENDTST2' });
  await send({ kind: 'area', area: 'market', x: 50, y: 50 });
  const bought = await send({ kind: 'buy', item: `seed-${CROP}`, at: 'general' });
  const cash = state.ledger.accounts['wallet-' + member.id];
  assert.equal(readLife(state.life).bag[member.id].seeds[CROP], 1);
  state = cloudTransition(state, member, bought.command, bought.hash, now).state;
  assert.equal(state.ledger.accounts['wallet-' + member.id], cash);
  assert.equal(readLife(state.life).bag[member.id].seeds[CROP], 1);
  let life = readLife(state.life); addCropQ(life, member.id, CROP, 3, 1);
  (life.farmx ??= {})[member.id] = { mach: { 0: { k: 'seedmaker' } } }; state.life = packLife(life);
  await send({ kind: 'farmLoad', slot: 0, item: CROP, q: 3 });
  life = readLife(state.life); const machine = { ...life.farmx[member.id].mach[0] };
  now = machine.done;
  const collected = await send({ kind: 'farmCollect', slot: 0 });
  state = JSON.parse(JSON.stringify(state));
  state = cloudTransition(state, member, collected.command, collected.hash, now).state;
  const restored = readLife(state.life);
  assert.equal(restored.bag[member.id].seeds[CROP], 1 + machine.n);
  assert.equal(restored.bag[member.id].produce[CROP], 0);
  assert.equal(restored.bag[member.id].seeds.tomato, 2);
});
