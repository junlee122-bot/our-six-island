// G4 물고기 하루 상한 economy check (design-improvements-2026-10-07 §8-1):
// fish pay the full price for the first 15만 범 of fish a friend sells each
// KST day, then taper on the crops' market curve (marketMult, no hard stop).
// Seven friends farm the same way for FISH_SIM_DAYS days (30: the cap is a
// per-day rule; the 120-day ≤1.07× currency check with the cap in place is
// lounge-farm-f5-econ.test.mjs), from the same start:
//   base  — the F5 check's routine: farm, two casts a day, sell in the evening;
//   heavy — the same, plus a very long fishing day: HEAVY_CATCHES catches
//           round the village and harbor spots and a daily 먼바다 voyage
//           (VOYAGE_CATCHES offshore fish, the fare paid), all sold that evening,
//           dearest first, at the fish's own shop.
// Heavy runs twice: with the fish tally (the rule now) and without it (the
// tally wiped before every sale = the rule before G4: no daily limit at all).
// Checks: normal play never reaches the tally, so the cap changes nothing for
// it (its runs with and without the tally are the same run); heavy
// fishers do reach it every day, and what fish pay them stays near the
// allowance (the crops' curve tail) instead of growing with every catch.
// Catches are rolled from the spot lists by encounter weight (seasons
// ignored: more species, the worst case for the per-species demand curve).
// LIFE_SIM_DAYS shortens it while working on it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CROP_INFO, LifeError, emptyLife, ensureLifeMember, lifeAction, plotReadyAt, plotThirsty, sellCapLeft } from '../app/lounge-life.ts';
import { INITIAL_BEOM, claimDailyGrant, newLoungeLedger, registerWallet, spendBeom, validateLedger } from '../app/lounge-economy.ts';
import { dayStart, seasonOfDay } from '../app/lounge-calendar.ts';
import { LEVEL_XP } from '../app/lounge-growth-data.ts';
import { tileOpen } from '../app/lounge-farm-data.ts';
import { FARM_EXPAND_PRICE, FISH_FULL_PER_DAY, nextFieldSize } from '../app/lounge-life-plus.ts';
import { ALL_FISH_SPOTS, FISH, ITEM_BY_ID, SPOT_INFO } from '../app/lounge-items.ts';
import { buyerOf } from '../app/lounge-shops.ts';
import { VOYAGE_FARE } from '../app/lounge-voyage-data.ts';

const HOUR = 3_600_000,
  DAY = 86_400_000,
  MIN = 60_000;
const DAYS = Number(process.env.FISH_SIM_DAYS ?? process.env.LIFE_SIM_DAYS ?? 30);
const START = dayStart(20_738);
/** About an hour of fishing a day (one catch every ~15 s) around the spots. */
const HEAVY_CATCHES = 240;
/** One 20-minute 먼바다 voyage a day (VOYAGES_PER_DAY), a catch every ~20 s. */
const VOYAGE_CATCHES = 60;
/** The full-price fish allowance of the decision. */
const FISH_ALLOWANCE = FISH_FULL_PER_DAY;
const CROPS_BY_SEASON = {
  spring: ['strawberry', 'onion', 'garlic', 'potato', 'spinach'],
  summer: ['strawberry', 'watermelon', 'corn', 'blueberry', 'cucumber'],
  autumn: ['strawberry', 'sweetpotato', 'corn', 'cabbage', 'radish'],
  winter: ['strawberry', 'spinach', 'cabbage', 'radish', 'pumpkin'],
};

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const bySpot = Object.fromEntries(ALL_FISH_SPOTS.concat('offshore').map((spot) => [spot, FISH.filter((f) => f.spots.includes(spot))]));
/** A catch at `spot` by encounter weight (deterministic per key). */
function roll(spot, key) {
  const list = bySpot[spot],
    total = list.reduce((a, f) => a + f.weight, 0);
  let r = hash(key) % total;
  for (const f of list) if ((r -= f.weight) < 0) return f.id;
  return list[0].id;
}

/** `heavy`: the long fishing day; `capped`: false wipes the fish tally before each sale (the rule before G4). */
function simulate(heavy, capped) {
  const members = Array.from({ length: 7 }, (_, actor) => ({ id: `0000000${actor}-f4f4-4f4f-8f4f-00000000000${actor}`, actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
    const u = (((life.growth ??= {}).u ??= {})[m.id] ??= {});
    u.xp = { farm: LEVEL_XP[9], fish: LEVEL_XP[7] };
    const x = ((life.ext ??= {})[m.id] ??= {});
    (x.s3 ??= {}).sm = { hoe: 3, can: 3 };
    x.rod = 3;
  }
  // Every spot open (the 다리, the harbor district): the heavy fisher's best case.
  life.flags = [...new Set([...(life.flags ?? []), ...Object.values(SPOT_INFO).flatMap((i) => (i.flag ? [i.flag] : []))])];
  const s = { life, ledger };
  let ok = 0,
    fishPaid = 0;
  const act = (m, a, t) => {
    try {
      const r = lifeAction(s.life, s.ledger, m, a, t);
      s.life = r.life;
      s.ledger = r.ledger;
      ok++;
      return true;
    } catch (e) {
      if (!(e instanceof LifeError)) throw e;
      return false;
    }
  };
  const balance = (m) => s.ledger.accounts['wallet-' + m.id] ?? 0;
  const inv = (m) => (s.life.ext[m.id].inv ??= {});
  const money = () => {
    const balances = Object.values(s.ledger.accounts).reduce((a, b) => a + b, 0);
    const reserved = Object.values(s.ledger.games)
      .filter((g) => g.state === 'reserved')
      .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
    const vaults = Object.values(s.life.ext ?? {}).reduce((a, x) => a + (x?.bank?.held ?? 0), 0);
    return balances + reserved + vaults;
  };
  const start = money();
  const day = [];
  for (let d = 0; d < DAYS; d++) {
    const morning = START + d * DAY + 8 * HOUR - 9 * HOUR,
      evening = morning + 12 * HOUR,
      season = seasonOfDay(20_738 + d);
    for (const m of members) {
      s.ledger = claimDailyGrant(s.ledger, 'wallet-' + m.id, morning);
      const size = () => s.life.ext[m.id].plots ?? 24;
      const farm = () => s.life.farms[m.id];
      const open = () => farm().flatMap((_, i) => (tileOpen(size(), i) ? [i] : []));
      const whole = () => size() === 24;
      const next = nextFieldSize(size());
      if (next && next < 120 && balance(m) > FARM_EXPAND_PRICE[next] + 40_000) act(m, { kind: 'expandFarm' }, morning);
      const each = (pick, a, t = morning) => {
        if (whole()) return void act(m, { ...a, plot: -1 }, t);
        for (const i of open()) if (pick(farm()[i], i) && !act(m, { ...a, plot: i }, t) && a.kind === 'plant') break;
      };
      each((p) => p.crop && plotReadyAt(p, morning) <= morning, { kind: 'harvest' });
      each((p) => !p.t && !p.crop && !p.dead, { kind: 'till' });
      const choices = CROPS_BY_SEASON[season];
      const crop = choices[(m.actor + d) % choices.length];
      const empty = () => open().filter((t) => !farm()[t].crop && farm()[t].t).length;
      for (let k = 0; k < 7 && empty() > 0; k++) {
        if (!act(m, { kind: 'buy', item: 'seed-' + crop, n: Math.min(20, empty()), at: 'general' }, morning)) break;
        each((p) => !p.crop && p.t, { kind: 'plant', crop });
      }
      each((p) => plotThirsty(p, morning), { kind: 'water' });
      for (let i = 0; i < 2; i++) {
        const t = morning + HOUR + i * MIN;
        if (act(m, { kind: 'cast', spot: i ? 'pond' : 'river' }, t)) {
          const p = s.life.ext[m.id].pending;
          act(m, { kind: 'reel', token: p.token, timingMs: 100 }, p.biteAt + 100);
        }
      }
      if (heavy) {
        // A long fishing day round every spot (night harbor in the evening), then the voyage.
        const spots = ALL_FISH_SPOTS.filter((sp) => !SPOT_INFO[sp].night);
        for (let i = 0; i < HEAVY_CATCHES; i++) {
          const spot = i % 12 === 11 ? 'harbor' : spots[i % spots.length];
          const id = roll(spot, `c:${m.actor}:${d}:${i}`);
          inv(m)[id] = (inv(m)[id] ?? 0) + 1;
        }
        if (balance(m) >= VOYAGE_FARE) {
          s.ledger = spendBeom(s.ledger, 'wallet-' + m.id, VOYAGE_FARE, `sim-voyage-${m.actor}-${d}`, morning, 'voyage');
          for (let i = 0; i < VOYAGE_CATCHES; i++) {
            const id = roll('offshore', `v:${m.actor}:${d}:${i}`);
            inv(m)[id] = (inv(m)[id] ?? 0) + 1;
          }
        }
      }
      for (const c of Object.keys(s.life.bag[m.id].produce)) {
        const left = sellCapLeft(s.life, m.id, evening),
          n = Math.min(s.life.bag[m.id].produce[c], Math.floor(left / (CROP_INFO[c].sell * 1.5)));
        if (n > 0) act(m, { kind: 'sell', crop: c, n, at: 'coop' }, evening);
      }
      // Fish at their own shop, dearest first (the best a seller can do).
      let paidToday = 0;
      const fish = Object.entries(inv(m))
        .filter(([id, n]) => n > 0 && ITEM_BY_ID[id]?.sell > 0 && ITEM_BY_ID[id].kind === 'fish')
        .sort((a, b) => ITEM_BY_ID[b[0]].sell - ITEM_BY_ID[a[0]].sell);
      for (const [id, n] of fish) {
        if (!capped) delete s.life.ext[m.id].fsb;
        const before = balance(m);
        if (act(m, { kind: 'sellItem', item: id, n, at: buyerOf(id, 'fishmarket') }, evening)) paidToday += balance(m) - before;
      }
      fishPaid += paidToday;
      day.push(paidToday);
    }
    validateLedger(s.ledger);
  }
  return { start, end: money(), granted: s.ledger.granted, actions: ok, fishPaid, fishDay: Math.round(fishPaid / day.length), maxFishDay: Math.max(...day), minFishDay: Math.min(...day) };
}

test(`G4 fish cap: ${DAYS} days, 7 farmers — normal play never reaches it, all-day fishers held near 15만 범 a day`, () => {
  const base = simulate(false, true),
    heavy = simulate(true, true),
    heavyFree = simulate(true, false);
  const g = (r) => ({ ...r, growth: +(r.end / r.start).toFixed(3) });
  const ratio = (a, b) => +(a / b).toFixed(3);
  const report = {
    days: DAYS,
    base: g(base),
    heavy: g(heavy),
    heavyFree: g(heavyFree),
    heavyCap: {
      currencyRatio: ratio(heavy.end, heavyFree.end),
      issuedRatio: ratio(heavy.granted, heavyFree.granted),
      fishRatio: ratio(heavy.fishPaid, heavyFree.fishPaid),
      fishDayVsAllowance: ratio(heavy.fishDay, FISH_ALLOWANCE),
      maxFishDayVsAllowance: ratio(heavy.maxFishDay, FISH_ALLOWANCE),
    },
  };
  console.log('# G4 fish-cap economy report', JSON.stringify(report));
  assert.equal(base.start, 7 * INITIAL_BEOM);
  // Normal play: two casts a day never reach the tally, so every fish sale pays as before G4.
  assert.ok(base.maxFishDay < FISH_ALLOWANCE, `fish day ${base.maxFishDay}`);
  // All-day fishers: past the allowance every day before G4, held near it now.
  assert.ok(heavyFree.fishDay > FISH_ALLOWANCE * 1.5, `uncapped fish day ${heavyFree.fishDay}`);
  assert.ok(heavy.fishDay >= FISH_ALLOWANCE, `fish day ${heavy.fishDay}`);
  assert.ok(report.heavyCap.maxFishDayVsAllowance <= 1.5, `max fish day ${report.heavyCap.maxFishDayVsAllowance}`);
  assert.ok(report.heavyCap.fishRatio < 0.8, `fish ${report.heavyCap.fishRatio}`);
  assert.ok(report.heavyCap.currencyRatio < 1 && report.heavyCap.issuedRatio < 1, JSON.stringify(report.heavyCap));
});
