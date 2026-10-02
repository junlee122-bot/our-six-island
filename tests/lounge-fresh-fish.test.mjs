// 민물 어종 확장 (handover/design/design-fresh-fish.md): data integrity,
// availability per spot and season, rod/bait conditions, legends, dishes and
// how much the new fish dilute the old rare ones.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { emptyLife, ensureLifeMember, lifeAction } from '../app/lounge-life.ts';
import { fishCandidates } from '../app/lounge-life-plus.ts';
import { newLoungeLedger, registerWallet, kstDay } from '../app/lounge-economy.ts';
import { BUNDLE_BY_ID, CROP_SELL_REF, DISH_BY_ID, FISH, FISH_BY_ID, FISH_SPOTS, ITEMS, ITEM_BY_ID } from '../app/lounge-items.ts';
import { seasonOf, weatherOf, kstHour, isDaytime, isNighttime } from '../app/lounge-calendar.ts';
import { BAITS, FISH_PROFILE } from '../app/lounge-fish-data.ts';
import { FISH_GATE, FRESH_DISHES, FRESH_DISH_CROPS, FRESH_FISH, FRESH_FISH_IDS, FRESH_PROFILE, fishGateOk, gateText } from '../app/lounge-fish-data-fresh.ts';
import { anglerCandidates, fishAvailable, isLegend } from '../app/lounge-fish-engine.ts';

const HOUR = 3_600_000;
const T0 = Date.UTC(2026, 8, 24, 3); // 12:00 KST
const DAYS = 28;
const FRESH = ['river', 'pond', 'rapids', 'falls', 'lake', 'bridge'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const BEHAVIOURS = ['calm', 'dart', 'sink', 'float', 'mixed'];
const OLD = FISH.filter((f) => !FRESH_FISH_IDS.has(f.id));
const ctxAt = (t, extra = {}) => ({ season: seasonOf(t), weather: weatherOf(kstDay(t)), now: t, ...extra });
const hours = function* (from = T0, step = 1) {
  for (let t = from; t < from + DAYS * 24 * HOUR; t += step * HOUR) yield t;
};

test('new fish: 30 species and 2 legends, unique ids and names, freshwater spots only', () => {
  const legends = FRESH_FISH.filter((f) => f.weight <= 1);
  assert.equal(FRESH_FISH.length - legends.length, 30);
  assert.equal(legends.length, 2);
  // No clash with any item id or fish name already in the game.
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length, 'item ids are unique');
  assert.equal(new Set(FISH.map((f) => f.name)).size, FISH.length, 'fish names are unique');
  for (const f of FRESH_FISH) {
    assert.ok(/^[a-z]+$/.test(f.id), f.id);
    assert.ok(!OLD.some((o) => o.id === f.id || o.name === f.name), `${f.name} is new`);
    assert.equal(FISH_BY_ID[f.id], FISH.find((x) => x.id === f.id));
    assert.ok(ITEM_BY_ID[f.id]?.museum, `${f.id} can be donated`);
    assert.equal(ITEM_BY_ID[f.id].kind, 'fish');
    // Freshwater only: no sea, harbor, rocks or district spots (FISH adds none to these).
    assert.ok(f.spots.length > 0 && f.spots.every((s) => FRESH.includes(s)), `${f.id} spots`);
    assert.deepEqual(FISH_BY_ID[f.id].spots, f.spots, `${f.id} stays out of the harbor district`);
    for (const s of f.spots) assert.ok(FISH_SPOTS.includes(s));
    assert.ok(f.seasons.every((s) => SEASONS.includes(s)));
    assert.ok(['day', 'night', 'any'].includes(f.time) && ['rain', 'dry', 'any'].includes(f.sky));
    assert.ok(f.cm[0] > 0 && f.cm[0] < f.cm[1], `${f.id} size`);
    assert.ok(f.windowMs >= 450 && f.windowMs <= 1_200, `${f.id} window`);
    assert.ok(f.note.length >= 10 && f.note.length <= 60, `${f.id} note`);
    assert.equal(f.emoji, '');
  }
});

test('profiles: every new fish has one, hour windows fit its day/night, gates are valid', () => {
  for (const f of FRESH_FISH) {
    const p = FRESH_PROFILE[f.id];
    assert.ok(p, `${f.id} profile`);
    assert.equal(FISH_PROFILE[f.id], p, 'spread into FISH_PROFILE');
    assert.ok(BEHAVIOURS.includes(p.behaviour));
    assert.ok(p.difficulty >= 10 && p.difficulty <= 95);
    if (p.hours) {
      const [from, to] = p.hours;
      assert.ok(from >= 0 && from < 24 && to >= 0 && to <= 24 && from !== to, `${f.id} hours`);
      // Some hour of the window must also be inside the fish's day/night.
      const ok = [...Array(24).keys()].some((h) => {
        const t = Date.UTC(2026, 8, 24, (h + 15) % 24); // KST hour h
        const inWindow = from <= to ? h >= from && h < to : h >= from || h < to;
        return inWindow && (f.time === 'any' || (f.time === 'day' ? isDaytime(t) : isNighttime(t)));
      });
      assert.ok(ok, `${f.id} hours overlap ${f.time}`);
    }
    // Harder fight for rarer fish (legends hardest).
    if (isLegend(f)) assert.ok(p.difficulty >= 85 && p.legend && p.season, f.id);
    else assert.ok(!p.legend && !p.season, f.id);
  }
  for (const [id, g] of Object.entries(FISH_GATE)) {
    assert.ok(FRESH_FISH_IDS.has(id), id);
    assert.ok(g.rod === undefined || (g.rod >= 2 && g.rod <= 5));
    assert.ok(g.bait === undefined || BAITS.includes(g.bait));
    assert.ok(gateText(g).length > 0);
  }
  assert.equal(gateText({ rod: 3 }), '낚싯대 3단 이상');
  assert.equal(gateText({ bait: 'bait-dough' }), '떡밥을 달아야 물어요');
});

test('prices sit on the raised scale and follow rarity', () => {
  const plain = FRESH_FISH.filter((f) => f.weight > 1);
  for (const f of plain) {
    const band = f.weight < 10 ? [1_800, 4_000] : f.weight < 20 ? [600, 1_400] : [120, 600];
    assert.ok(f.sell >= band[0] && f.sell <= band[1], `${f.id} ${f.sell} in ${band.join('~')}`);
  }
  const top = Math.max(...FISH.filter((f) => f.weight > 1).map((f) => f.sell));
  for (const f of FRESH_FISH.filter((f) => f.weight <= 1)) assert.ok(f.sell > top && f.sell <= 10_400, f.id);
});

test('every fresh spot and season has something new to catch, and every new fish turns up', () => {
  const seen = new Set();
  const bySpotSeason = new Set();
  for (const t of hours()) {
    for (const bait of [null, 'bait-dough', 'bait-glow']) {
      const ctx = ctxAt(t, { level: 10, rod: 5, caught: [], bait });
      for (const spot of FRESH) {
        for (const f of anglerCandidates(spot, ctx)) {
          if (!FRESH_FISH_IDS.has(f.id) || !fishAvailable(f, ctx)) continue;
          seen.add(f.id);
          if (!isLegend(f)) bySpotSeason.add(`${spot}:${ctx.season}`);
        }
      }
    }
  }
  for (const f of FRESH_FISH) assert.ok(seen.has(f.id), `${f.id} can be caught in ${DAYS} days`);
  for (const spot of FRESH) for (const s of SEASONS) assert.ok(bySpotSeason.has(`${spot}:${s}`), `${spot} has a new fish in ${s}`);
  // And each spot still has a basic rod-1, no-bait catch in every season.
  for (const spot of FRESH.filter((s) => s !== 'falls'))
    for (const s of SEASONS) {
      const any = [...hours()].some((t) => seasonOf(t) === s && anglerCandidates(spot, ctxAt(t, { rod: 1, bait: null })).length > 0);
      assert.ok(any, `${spot} ${s}`);
    }
});

test('rod and bait conditions: gated fish never bite without them', () => {
  assert.equal(fishGateOk('crucian', 1, null), true);
  assert.equal(fishGateOk('sturgeon', 2, null), false);
  assert.equal(fishGateOk('sturgeon', 3, null), true);
  assert.equal(fishGateOk('sturgeon', undefined, null), true, 'no rod info lets it through');
  assert.equal(fishGateOk('hyangeo', 5, null), false);
  assert.equal(fishGateOk('hyangeo', 5, 'bait'), false);
  assert.equal(fishGateOk('hyangeo', 1, 'bait-dough'), true);
  assert.equal(fishGateOk('hyangeo', 1, undefined), true, 'the spot card shows it');
  const autumnLake = [...hours()].find((t) => seasonOf(t) === 'autumn');
  const st = FISH_BY_ID.sturgeon;
  assert.equal(fishAvailable(st, ctxAt(autumnLake, { rod: 2 })), false);
  assert.equal(fishAvailable(st, ctxAt(autumnLake, { rod: 3 })), true);
  assert.ok(!anglerCandidates('lake', ctxAt(autumnLake, { rod: 1, bait: null })).some((f) => f.id === 'sturgeon'), 'not even as a visitor');

  // Real casts at the lake on warm days: no 향어 without 떡밥, some with it.
  const uid = '00000000-1111-4111-8111-111111111110';
  const m = { id: uid, actor: 0 };
  let ledger = registerWallet(newLoungeLedger(), `wallet-${uid}`);
  let life = ensureLifeMember(emptyLife(), uid, 0);
  ((life.ext ??= {})[uid] ??= {}).inv = { 'bait-dough': 500 };
  const act = (a, now) => ({ life, ledger } = lifeAction(life, ledger, m, a, now));
  const caught = { none: 0, dough: 0 };
  const warm = [...hours(T0, 3)].filter((t) => ['spring', 'summer', 'autumn'].includes(seasonOf(t)));
  for (const [i, t] of warm.slice(0, 160).entries()) {
    const bait = i % 2 ? 'bait-dough' : null;
    act({ kind: 'anglerCast', spot: 'lake', bait }, t);
    const cast = life.angling.u[uid].cast;
    if (cast.fish === 'hyangeo') caught[bait ? 'dough' : 'none']++;
    act({ kind: 'anglerCancel', token: cast.token }, t + 1_000);
  }
  assert.equal(caught.none, 0, 'no 향어 without 떡밥');
  assert.ok(caught.dough > 0, '향어 bites on 떡밥');
});

test('legends: their own season, hours, weather and gates, once per friend, never in the legacy table', () => {
  const legends = FISH.filter((f) => f.weight <= 1);
  // No two legends share a spot and a season.
  const keys = legends.flatMap((f) => {
    const p = FISH_PROFILE[f.id];
    const seasons = p.season ? [p.season] : f.seasons;
    return f.spots.flatMap((s) => seasons.map((season) => `${s}:${season}`));
  });
  assert.equal(new Set(keys).size, keys.length, 'legends keep apart');

  const bt = FISH_BY_ID.baekdutrout;
  const dawn = [...hours()].find((t) => seasonOf(t) === 'autumn' && !['rain', 'storm'].includes(weatherOf(kstDay(t))) && kstHour(t) === 6);
  assert.equal(fishAvailable(bt, ctxAt(dawn, { level: 6, rod: 3 })), true);
  assert.equal(fishAvailable(bt, ctxAt(dawn, { level: 5, rod: 3 })), false, 'level gate');
  assert.equal(fishAvailable(bt, ctxAt(dawn, { level: 9, rod: 2 })), false, 'rod gate');
  assert.equal(fishAvailable(bt, ctxAt(dawn, { level: 9, rod: 3, caught: ['baekdutrout'] })), false, 'once per friend');
  assert.equal(fishAvailable(bt, ctxAt(dawn + 3 * HOUR, { level: 9, rod: 3 })), false, '9시 is past the dawn window');
  assert.ok(anglerCandidates('rapids', ctxAt(dawn, { level: 9, rod: 3, bait: null })).some((f) => f.id === 'baekdutrout'));

  const mc = FISH_BY_ID.millcatfish;
  const night = [...hours()].find((t) => seasonOf(t) === 'summer' && weatherOf(kstDay(t)) === 'rain' && kstHour(t) === 1);
  assert.equal(fishAvailable(mc, ctxAt(night, { level: 8, rod: 3 })), true);
  assert.equal(fishAvailable(mc, ctxAt(night, { level: 7, rod: 3 })), false);
  assert.equal(fishAvailable(mc, ctxAt(night, { level: 8, rod: 3, caught: ['millcatfish'] })), false);
  const dryNight = [...hours()].find((t) => seasonOf(t) === 'summer' && weatherOf(kstDay(t)) === 'sunny' && kstHour(t) === 1);
  assert.equal(fishAvailable(mc, ctxAt(dryNight, { level: 9, rod: 5 })), false, 'needs rain');

  for (const t of hours(T0, 5))
    for (const spot of FRESH)
      assert.ok(!fishCandidates(spot, seasonOf(t), weatherOf(kstDay(t)), t).some((c) => c.id === 'baekdutrout' || c.id === 'millcatfish'));
});

test('the old rare fish keep most of their odds (dilution is bounded and documented)', () => {
  // Average pick share over 4 weeks of hours (rod 3, no bait), same weights as the cast.
  const share = (spot, pool) => {
    const acc = {};
    let n = 0;
    for (const t of hours()) {
      const ctx = ctxAt(t, { level: 10, rod: 3, caught: [], bait: null });
      const local = pool.filter((f) => f.spots.includes(spot));
      const cur = local.filter((f) => fishAvailable(f, ctx));
      const vis = cur.length >= 3 ? [] : local.filter((f) => f.weight >= 10 && !cur.includes(f) && f.seasons.length > 0).sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id)).slice(0, 3 - cur.length);
      const list = [...cur, ...vis];
      const w = list.map((f) => (f.weight < 10 ? f.weight : Math.min(32, f.weight)) * (cur.includes(f) ? 1 : 0.25));
      const total = w.reduce((a, b) => a + b, 0);
      list.forEach((f, i) => (acc[f.id] = (acc[f.id] ?? 0) + w[i] / total));
      n++;
    }
    for (const k of Object.keys(acc)) acc[k] /= n;
    return acc;
  };
  for (const spot of FRESH) {
    const before = share(spot, OLD),
      after = share(spot, FISH);
    const fresh = Object.entries(after).reduce((s, [id, v]) => s + (FRESH_FISH_IDS.has(id) ? v : 0), 0);
    assert.ok(fresh <= 0.35, `${spot}: new fish take ${(fresh * 100).toFixed(1)}%`);
    for (const f of OLD.filter((f) => f.spots.includes(spot) && f.weight < 10 && before[f.id] > 0)) {
      const kept = (after[f.id] ?? 0) / before[f.id];
      assert.ok(kept >= 0.6, `${spot} ${f.id} keeps ${(kept * 100).toFixed(0)}%`);
    }
  }
});

test('freshwater dishes: dish formula, buffs, museum; bundles are unchanged', () => {
  for (const [id, v] of Object.entries(FRESH_DISH_CROPS)) assert.equal(CROP_SELL_REF[id], v, id);
  for (const d of FRESH_DISHES) {
    const value = d.needs.reduce((s, n) => s + (FISH_BY_ID[n.item]?.sell ?? CROP_SELL_REF[n.item]) * n.n, 0);
    assert.equal(d.sell, Math.round((value * 1.25 + 100) / 10) * 10, d.id);
    assert.equal(DISH_BY_ID[d.id], d);
    assert.ok(d.buff && ITEM_BY_ID[d.id].museum, d.id);
    assert.ok(d.needs.some((n) => FRESH_FISH_IDS.has(n.item)), `${d.id} uses a new fish`);
  }
  assert.deepEqual(
    BUNDLE_BY_ID['river-fish'].slots.map((s) => s.item),
    ['crucian', 'carp', 'sweetfish', 'catfish', 'mandarin', 'trout'],
  );
  const src = fs.readFileSync(new URL('../app/lounge-items.ts', import.meta.url), 'utf8');
  const bundles = src.slice(src.indexOf('export const BUNDLES'), src.indexOf('export const BUNDLE_BY_ID'));
  for (const f of FRESH_FISH) assert.ok(!bundles.includes(`'${f.id}'`), `${f.id} is in no bundle`);
});
