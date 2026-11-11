import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  COMMUNITY_ORDER_DIFFICULTY, COMMUNITY_ORDER_POOL, communityOrderById, communityOrderCandidates, communityOrderDefinition,
  communityOrderItemKind, communityOrderItemName, communityOrderItemSource,
} from '../app/lounge-community-orders-data.ts';
import { CROPS, CROP_INFO } from '../app/lounge-life.ts';
import { FISH_BY_ID, FURNITURE_BY_REF, SPOT_INFO } from '../app/lounge-items.ts';
import { buildGoods, MACHINE_BY_ID, productOf } from '../app/lounge-farm-data.ts';
import { catalogEntry } from '../app/lounge-bedroom-catalog.ts';
import { CALENDAR_ANCHOR_DAY, SEASONS } from '../app/lounge-calendar.ts';

const HOUR = 3_600_000, WEEK = 7 * 24 * HOUR;
const goods = Object.fromEntries(buildGoods((id) => CROP_INFO[id]?.name ?? id, (id) => CROP_INFO[id]?.sell ?? 0).map((g) => [g.id, g]));
const week = (day) => Math.floor((day + 3) / 7);

test('a KST week always offers one stable candidate per difficulty, including historical week numbers', () => {
  assert.equal(COMMUNITY_ORDER_POOL.length, 9);
  assert.equal(new Set(COMMUNITY_ORDER_POOL.map((d) => d.id)).size, COMMUNITY_ORDER_POOL.length);
  const seen = new Set();
  for (const w of [-4, -3, -2, -1, 0, 1, 2, 3, ...Array.from({ length: 60 }, (_, i) => week(CALENDAR_ANCHOR_DAY) + i)]) {
    const candidates = communityOrderCandidates(w);
    assert.deepEqual(candidates.map((d) => d.difficulty), ['easy', 'normal', 'hard']);
    assert.deepEqual(communityOrderCandidates(w), candidates);
    for (const def of candidates) {
      seen.add(def.id);
      assert.equal(communityOrderById(w, def.id), def);
      assert.match(def.id, /^[a-z][a-z0-9-]{1,47}-v1$/);
      assert.ok(COMMUNITY_ORDER_DIFFICULTY[def.difficulty]);
    }
    for (const other of COMMUNITY_ORDER_POOL.filter((d) => !candidates.includes(d))) assert.equal(communityOrderById(w, other.id), undefined);
  }
  assert.equal(seen.size, 9);
  assert.deepEqual(communityOrderCandidates(1.5), []);
  assert.deepEqual(communityOrderCandidates(NaN), []);
  assert.equal(communityOrderById(3000, '__proto__'), undefined);
});

test('Monday boundary uses the existing village week without a UTC Sunday shift', () => {
  const monday = CALENDAR_ANCHOR_DAY;
  assert.equal(week(monday - 1) + 1, week(monday));
  assert.equal(week(monday), week(monday + 6));
  assert.deepEqual(communityOrderCandidates(week(monday)), communityOrderCandidates(week(monday + 6)));
  assert.notDeepEqual(communityOrderCandidates(week(monday - 1)), communityOrderCandidates(week(monday)));
});

test('version registry restores a registered order outside this week candidates without permitting a new choice', () => {
  const w = 3000, candidates = communityOrderCandidates(w);
  const old = COMMUNITY_ORDER_POOL.find((def) => !candidates.includes(def));
  assert.ok(old);
  assert.equal(communityOrderById(w, old.id), undefined, 'new selections remain limited to three weekly candidates');
  assert.equal(communityOrderDefinition(old.id), old, 'existing records keep their original versioned requirement and reward');
  assert.equal(communityOrderDefinition('not-an-order'), undefined);
  assert.equal(communityOrderDefinition('__proto__'), undefined);
});

test('every crop and raw artisan input is actually obtainable in every season without a greenhouse', () => {
  for (const def of COMMUNITY_ORDER_POOL) for (const need of def.needs) {
    assert.ok(Number.isInteger(need.n) && need.n > 0 && need.n <= 20, def.id);
    assert.ok((need.q ?? 0) === 0, 'orders never require a random high quality');
    const kind = communityOrderItemKind(need.item);
    assert.ok(kind, need.item);
    const crop = kind === 'good' ? goods[need.item]?.from : kind === 'crop' ? need.item : null;
    if (crop) {
      assert.ok(CROPS.includes(crop), crop);
      for (const season of SEASONS) assert.ok(!CROP_INFO[crop].seasons || CROP_INFO[crop].seasons.includes(season), `${def.id}: ${crop} / ${season}`);
      assert.ok(CROP_INFO[crop].growMs < 24 * HOUR);
      assert.ok(CROP_INFO[crop].seed <= 1000, 'no expensive specialist crop');
    }
    if (kind === 'crop') assert.equal(communityOrderItemName(need.item), CROP_INFO[need.item].name);
    if (kind === 'fish') assert.equal(communityOrderItemName(need.item), FISH_BY_ID[need.item].name);
    if (kind === 'good') assert.equal(communityOrderItemName(need.item), goods[need.item].name);
    assert.equal(communityOrderItemSource(need.item), kind === 'good' ? 'private' : 'bag');
  }
  assert.equal(communityOrderItemKind('__proto__'), null);
  assert.equal(communityOrderItemName('not-an-item'), '알 수 없는 품목');
});

test('normal fish needs avoid season, weather, hour, bridge, rod-level and rare-spawn gates', () => {
  for (const def of COMMUNITY_ORDER_POOL.filter((d) => d.difficulty === 'normal')) {
    let fishCount = 0;
    for (const need of def.needs.filter((n) => communityOrderItemKind(n.item) === 'fish')) {
      const fish = FISH_BY_ID[need.item];
      fishCount += need.n;
      assert.deepEqual([...fish.seasons].sort(), [...SEASONS].sort());
      assert.equal(fish.sky, 'any'); assert.equal(fish.time, 'any');
      assert.ok(fish.weight >= 25); assert.ok(fish.windowMs >= 1000);
      assert.ok(fish.spots.some((spot) => ['river', 'pond'].includes(spot) && !SPOT_INFO[spot].flag && !SPOT_INFO[spot].rod));
    }
    assert.ok(fishCount >= 1 && fishCount <= 8, def.id);
    assert.equal(def.gate, undefined);
  }
});

test('solo-friendly budgets fit starter fields; hard orders fit one personal jar inside the KST week', () => {
  for (const def of COMMUNITY_ORDER_POOL) {
    assert.ok(def.needs.length <= 3);
    assert.equal(new Set(def.needs.map((n) => n.item)).size, def.needs.length);
    if (def.difficulty === 'easy') {
      assert.equal(def.gate, undefined);
      assert.ok(def.needs.every((n) => communityOrderItemKind(n.item) === 'crop'));
      assert.ok(def.needs.reduce((n, row) => n + row.n, 0) <= 18, 'less than the initial 24 plots');
    }
    if (def.difficulty === 'hard') {
      assert.deepEqual(def.gate, { machine: 'jar' });
      const made = def.needs.filter((n) => communityOrderItemKind(n.item) === 'good');
      assert.equal(made.reduce((n, row) => n + row.n, 0), 4);
      for (const need of made) {
        const good = goods[need.item];
        assert.equal(good.machine, 'jar');
        assert.equal(productOf('jar', good.from), need.item);
        assert.equal(MACHINE_BY_ID.jar.per, 1);
      }
      const serialMs = made.reduce((n, row) => n + row.n * MACHINE_BY_ID.jar.ms, 0);
      assert.equal(serialMs, 64 * HOUR);
      assert.ok(serialMs < WEEK / 2, 'one jar has more than half a week spare for visits and raw crops');
      assert.equal(MACHINE_BY_ID.jar.recipe.skill, 'farm');
      assert.equal(MACHINE_BY_ID.jar.recipe.level, 4);
    }
  }
});

test('rewards are existing decorative catalog items without cash, production boosts or exclusive milestone badges', () => {
  for (const def of COMMUNITY_ORDER_POOL) {
    const reward = FURNITURE_BY_REF[def.reward.furniture];
    assert.ok(reward, def.reward.furniture);
    assert.ok(catalogEntry(def.reward.furniture), def.reward.furniture);
    assert.deepEqual(Object.keys(def.reward).sort(), ['furniture', 'label']);
    assert.ok(!reward.unsold && !reward.luxury, 'festival/project and luxury prizes remain exclusive');
    assert.ok(def.reward.label.includes(reward.name));
    assert.ok(def.title && def.note);
  }
});

test('versioned public definitions cannot be changed through a returned candidate reference', () => {
  const def = communityOrderCandidates(3000)[0], saved = structuredClone(def);
  assert.throws(() => { def.needs[0].n = 9999; }, TypeError);
  assert.throws(() => { def.reward.furniture = 'furn-grand-piano'; }, TypeError);
  assert.throws(() => { def.needs.push({ item: 'carrot', n: 9999 }); }, TypeError);
  assert.deepEqual(communityOrderById(3000, def.id), saved);
  const source = readFileSync(new URL('../app/lounge-community-orders-data.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /^\s*import\s.*from\s*['"].*(?:lounge-life|lounge-farm\.ts|lounge-growth\.ts)/m);
});
