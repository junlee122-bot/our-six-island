import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLife, ensureLifeMember, lifeAction, lifeView, readLife, CROPS, cropInSeason, plotReadyAt } from '../app/lounge-life.ts';
import { fishCandidates, fishEncounterWeight, fishingParcel, reactionGrade, FISHING_FOODS, PLUS_REJECT } from '../app/lounge-life-plus.ts';
import { harvestOf, harvestText } from '../app/lounge-life-ui.ts';
import { newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { FISH, FISH_SPOTS } from '../app/lounge-items.ts';
import { seasonOf, isNighttime } from '../app/lounge-calendar.ts';
import { tillField } from './farm-test-help.mjs';

const T0 = Date.UTC(2026, 8, 24, 3);
function world() {
  const m = { id: '11111111-1111-4111-8111-111111111111', actor: 0 };
  const s = { m, life: tillField(ensureLifeMember(emptyLife(), m.id, m.actor), m.id), ledger: registerWallet(newLoungeLedger(), `wallet-${m.id}`) };
  s.act = (a, now = T0) => {
    const next = lifeAction(s.life, s.ledger, m, a, now);
    s.life = next.life;
    s.ledger = next.ledger;
    validateLedger(s.ledger);
    const balances = Object.values(s.ledger.accounts).reduce((a, b) => a + b, 0);
    assert.equal(balances + (s.ledger.houseBalance ?? 0) - (s.ledger.granted ?? 0), Object.keys(s.ledger.accounts).length * 100000);
    return next;
  };
  s.view = (now = T0) => lifeView(s.life, m.id, m.actor, now);
  return s;
}

test('reaction ranks use the server bite time, not the claimed client reaction', () => {
  for (const [ms, grade] of [[0, 'S'], [200, 'S'], [201, 'A'], [350, 'A'], [351, 'B'], [500, 'B'], [501, 'C'], [750, 'C'], [751, 'D'], [1100, 'D'], [1101, 'E']]) {
    assert.equal(reactionGrade(ms), grade);
  }
  const s = world();
  s.act({ kind: 'cast', spot: 'river' });
  const p = s.view().me.fishing.pending;
  assert.equal(p.fish, undefined);
  s.act({ kind: 'reel', token: p.token, timingMs: 0 }, p.biteAt + 800);
  const last = s.view().me.fishing.last;
  assert.equal(last.ok, true);
  assert.equal(last.reactionMs, 800);
  assert.equal(last.grade, 'D');
  s.act({ kind: 'cast', spot: 'river' }, T0 + 60000);
  const early = s.view().me.fishing.pending;
  s.act({ kind: 'reel', token: early.token, timingMs: 0 }, early.castAt + 10);
  assert.equal(s.view().me.fishing.last.grade, undefined);
  assert.equal(s.view().me.fishing.last.reactionMs, undefined);
});

test('cancel needs the current token; retry and cancel after reel are no-op acknowledgements', () => {
  const s = world();
  s.act({ kind: 'cast', spot: 'pond' });
  const p = s.view().me.fishing.pending;
  assert.throws(() => s.act({ kind: 'cancelCast', token: 'wrong' }), { message: PLUS_REJECT.token });
  assert.equal(s.view().me.fishing.pending.token, p.token);
  const inventory = structuredClone(s.view().me.inv);
  s.act({ kind: 'cancelCast', token: p.token }, p.biteAt);
  assert.equal(s.view().me.fishing.pending, null);
  assert.deepEqual(s.view().me.inv, inventory);
  assert.equal(s.view().me.fishing.last, null);
  const state = s.life, ledger = s.ledger;
  s.act({ kind: 'cancelCast', token: p.token }, p.biteAt + 86400000);
  assert.equal(s.life, state);
  assert.equal(s.ledger, ledger);
  assert.throws(() => s.act({ kind: 'reel', token: p.token, timingMs: 0 }, p.biteAt), { message: PLUS_REJECT.token });
  s.act({ kind: 'cast', spot: 'pond' }, T0 + 60000);
  const p2 = s.view().me.fishing.pending;
  s.act({ kind: 'reel', token: p2.token, timingMs: 150 }, p2.biteAt + 150);
  const caught = s.life;
  s.act({ kind: 'cancelCast', token: p2.token }, p2.biteAt + 151);
  assert.equal(s.life, caught);
});

test('seed and food parcels have separate 12/4 percent rolls and grant exactly once after a successful catch', () => {
  let seedRolls = 0, foodRolls = 0;
  for (let i = 0; i < 10000; i++) {
    const parcel = fishingParcel(`fixture${i}`, 'autumn');
    if (parcel?.kind === 'seed') {
      seedRolls++;
      assert.ok(CROPS.includes(parcel.item) && cropInSeason(parcel.item, 'autumn'));
    } else if (parcel?.kind === 'food') {
      foodRolls++;
      assert.ok(FISHING_FOODS.includes(parcel.item));
    }
    if (parcel) assert.equal(parcel.n, 1);
  }
  assert.ok(seedRolls > 1050 && seedRolls < 1350, `seed rolls: ${seedRolls}`);
  assert.ok(foodRolls > 300 && foodRolls < 500, `food rolls: ${foodRolls}`);
  const s = world(), got = new Set();
  for (let i = 0; i < 250 && got.size < 2; i++) {
    const now = T0 + i * 15000;
    s.act({ kind: 'cast', spot: 'river' }, now);
    const p = s.view().me.fishing.pending;
    const parcel = fishingParcel(p.token, seasonOf(p.castAt));
    const before = s.view();
    s.act({ kind: 'reel', token: p.token, timingMs: 100 }, p.biteAt + 100);
    const after = s.view(), last = after.me.fishing.last;
    if (!parcel) { assert.equal(last.parcel, undefined); continue; }
    assert.deepEqual(last.parcel, parcel);
    got.add(parcel.kind);
    const beforeCount = parcel.kind === 'seed' ? before.me.bag.seeds[parcel.item] : before.me.inv[parcel.item] ?? 0;
    const afterCount = parcel.kind === 'seed' ? after.me.bag.seeds[parcel.item] : after.me.inv[parcel.item];
    assert.equal(afterCount, beforeCount + 1);
    const state = s.life;
    assert.throws(() => s.act({ kind: 'reel', token: p.token, timingMs: 100 }, p.biteAt + 150), { message: PLUS_REJECT.token });
    assert.equal(s.life, state);
  }
  assert.deepEqual([...got].sort((a, b) => a.localeCompare(b)), ['food', 'seed']);
  assert.ok(s.ledger.entries.every(entry => entry.reason === 'ach'), 'only existing catch achievements may grant currency');
});

test('fish pools stay in their habitat, preserve rare restrictions and soften repeated common catches', () => {
  for (const spot of FISH_SPOTS) for (const season of ['spring', 'summer', 'autumn', 'winter']) for (const weather of ['sunny', 'rain', 'snow']) for (const now of [T0, T0 + 12 * 3600000]) {
    const native = FISH.filter(f => f.spots.includes(spot));
    const pool = fishCandidates(spot, season, weather, now);
    assert.ok(pool.length >= Math.min(3, native.filter(f => f.weight >= 10).length));
    assert.equal(new Set(pool.map(f => f.id)).size, pool.length);
    for (const fish of pool) {
      assert.ok(fish.spots.includes(spot));
      if (fish.weight < 10) {
        assert.ok(fish.seasons.includes(season));
        assert.ok(fish.sky === 'any' || (fish.sky === 'rain') === (weather === 'rain'));
        assert.ok(!fish.time || fish.time === 'any' || (fish.time === 'night') === isNighttime(now));
      }
      assert.equal(fishEncounterWeight(fish, season, weather, now, fish.id), fishEncounterWeight(fish, season, weather, now) * 0.4);
    }
  }
});

test('last-catch save migration recomputes rank and strips invalid parcel fields', () => {
  const s = world();
  s.act({ kind: 'cast', spot: 'river' });
  const p = s.view().me.fishing.pending;
  s.act({ kind: 'reel', token: p.token, timingMs: 100 }, p.biteAt + 800);
  const stored = JSON.parse(JSON.stringify(s.life));
  stored.ext[s.m.id].last.grade = 'S';
  stored.ext[s.m.id].last.parcel = { kind: 'food', item: 'house', n: 999 };
  let loaded = readLife(stored);
  assert.equal(loaded.ext[s.m.id].last.grade, 'D');
  assert.equal(loaded.ext[s.m.id].last.parcel, undefined);
  stored.ext[s.m.id].last.parcel = { kind: 'seed', item: 'carrot', n: 1 };
  loaded = readLife(stored);
  assert.deepEqual(loaded.ext[s.m.id].last.parcel, stored.ext[s.m.id].last.parcel);
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(loaded))), loaded);
  delete stored.ext[s.m.id].last.reactionMs;
  delete stored.ext[s.m.id].last.parcel;
  loaded = readLife(stored);
  assert.equal(loaded.ext[s.m.id].last.grade, undefined);
  assert.equal(loaded.ext[s.m.id].last.reactionMs, undefined);
});

test('harvest feedback reports actual quality yield and preserves other plots on a single harvest', () => {
  const s = world();
  s.act({ kind: 'plant', plot: 0, crop: 'carrot' });
  s.act({ kind: 'plant', plot: 1, crop: 'carrot' });
  s.act({ kind: 'water', plot: -1 });
  const now = plotReadyAt(s.life.farms[s.m.id][0], T0) + 1;
  const before = s.view(now);
  s.act({ kind: 'harvest', plot: 0 }, now);
  const after = s.view(now), report = harvestOf(before, after);
  assert.ok(report.length > 0);
  assert.equal(report.reduce((n, r) => n + r.n, 0), after.me.bag.produce.carrot - before.me.bag.produce.carrot);
  assert.match(harvestText(report), /당근.*개/);
  assert.equal(after.me.farm[0].crop, null);
  assert.equal(after.me.farm[1].crop, 'carrot');
  assert.throws(() => s.act({ kind: 'harvest', plot: 0 }, now));
  assert.deepEqual(harvestOf(after, after), []);
  assert.deepEqual(harvestOf(null, after), []);
});
