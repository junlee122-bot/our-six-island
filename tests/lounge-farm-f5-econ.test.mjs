// 우리 농장 F5 economy check (design-our-farm.md §3-1, §8 F5, §11-1, §12-2):
// seven friends farm and fish for 120 days twice, from the same start: once
// the way they could before F5 (fields up to 80 tiles, the older crops), once
// with everything F5 adds (the 120-tile field, the new crops and flowers,
// improved seeds, the 서리 덮개, the 양식장 selling its fish and roe). The
// daily sell cap (10만 범) and the demand curve stay as they are, so the
// currency in the world (every wallet, the bank vaults, money held in games)
// may grow at most 1.07× as much with F5 as without it, and the 범 the world
// issues to the friends (sales, grants) at most 1.07× as much too.
// LIFE_SIM_DAYS shortens it while working on it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CROP_INFO, LifeError, emptyLife, ensureLifeMember, lifeAction, plotReadyAt, plotThirsty, sellCapLeft } from '../app/lounge-life.ts';
import { INITIAL_BEOM, claimDailyGrant, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { dayStart, seasonOfDay } from '../app/lounge-calendar.ts';
import { LEVEL_XP } from '../app/lounge-growth-data.ts';
import { tileOpen } from '../app/lounge-farm-data.ts';
import { FACILITY_BY_ID } from '../app/lounge-farm-sites-data.ts';
import { FARM_EXPAND_PRICE, nextFieldSize } from '../app/lounge-life-plus.ts';
import { FISH_BY_ID, ITEM_BY_ID } from '../app/lounge-items.ts';
import { pondFishOk } from '../app/lounge-farm-pond-data.ts';
import { buyerOf } from '../app/lounge-shops.ts';

const HOUR = 3_600_000,
  DAY = 86_400_000,
  MIN = 60_000;
const DAYS = Number(process.env.LIFE_SIM_DAYS ?? 120);
/** 2026-10-12 (Mon), a summer week: the sim starts there and runs through the season cycle. */
const START = dayStart(20_738);

/**
 * What each friend plants, by season. Both runs plant the same (dear) crops,
 * so the F5 run is the worst case for the currency: the extra field, gold
 * from improved seeds and the pond's fish outside the sell cap all add to the
 * best-paying crops (the new crops pay in the same band; tests/lounge-farm-f5).
 */
const CROPS_BY_SEASON = {
  spring: ['strawberry', 'onion', 'garlic', 'potato', 'spinach'],
  summer: ['strawberry', 'watermelon', 'corn', 'blueberry', 'cucumber'],
  autumn: ['strawberry', 'sweetpotato', 'corn', 'cabbage', 'radish'],
  winter: ['strawberry', 'spinach', 'cabbage', 'radish', 'pumpkin'],
};

function simulate(f5) {
  const members = Array.from({ length: 7 }, (_, actor) => ({ id: crypto.randomUUID(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
    // Seasoned friends: every F5 unlock within reach, 오른's 3 × 3 hoe and can.
    const u = (((life.growth ??= {}).u ??= {})[m.id] ??= {});
    u.xp = { farm: LEVEL_XP[9], fish: LEVEL_XP[7] };
    (((life.ext ??= {})[m.id] ??= {}).s3 ??= {}).sm = { hoe: 3, can: 3 };
  }
  const s = { life, ledger };
  let ok = 0;
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
  /** Materials the friends gather anyway (stone, wood, ore): handed over as needed, not bought. */
  const gather = (m, mats) => {
    for (const [id, n] of Object.entries(mats)) inv(m)[id] = (inv(m)[id] ?? 0) + n;
  };
  const money = () => {
    const balances = Object.values(s.ledger.accounts).reduce((a, b) => a + b, 0);
    const reserved = Object.values(s.ledger.games)
      .filter((g) => g.state === 'reserved')
      .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
    const vaults = Object.values(s.life.ext ?? {}).reduce((a, x) => a + (x?.bank?.held ?? 0), 0);
    return balances + reserved + vaults;
  };
  const start = money();
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
      // A bigger field as soon as it pays (F5 friends may go on to 120 tiles).
      const next = nextFieldSize(size());
      if (next && (f5 || next < 120) && balance(m) > FARM_EXPAND_PRICE[next] + 40_000) act(m, { kind: 'expandFarm' }, morning);
      // Harvest every ripe tile, till grass, plant, water (tile by tile past the first stage).
      const each = (pick, a, t = morning) => {
        if (whole()) return void act(m, { ...a, plot: -1 }, t);
        // Tiles that need it; the tool's 3 × 3 reach does the ones around each pick.
        for (const i of open()) if (pick(farm()[i], i) && !act(m, { ...a, plot: i }, t) && a.kind === 'plant') break;
      };
      each((p) => p.crop && plotReadyAt(p, morning) <= morning, { kind: 'harvest' });
      each((p) => !p.t && !p.crop && !p.dead, { kind: 'till' });
      const choices = CROPS_BY_SEASON[season];
      const crop = choices[(m.actor + d) % choices.length];
      const empty = () => open().filter((t) => !farm()[t].crop && farm()[t].t).length;
      if (f5) {
        // Improved seeds first (the 품종 개량소), on the tiles their crop fits.
        for (const [c, n] of Object.entries(s.life.farmx?.[m.id]?.is ?? {}))
          if (n > 0 && CROP_INFO[c].seasons?.includes(season) !== false) each((p) => !p.crop && p.t, { kind: 'plant', crop: c, improved: true });
      }
      for (let k = 0; k < 7 && empty() > 0; k++) {
        if (!act(m, { kind: 'buy', item: 'seed-' + crop, n: Math.min(20, empty()), at: 'general' }, morning)) break;
        each((p) => !p.crop && p.t, { kind: 'plant', crop });
      }
      each((p) => plotThirsty(p, morning), { kind: 'water' });
      // Two casts a day.
      for (let i = 0; i < 2; i++) {
        const t = morning + HOUR + i * MIN;
        if (act(m, { kind: 'cast', spot: i ? 'pond' : 'river' }, t)) {
          const p = s.life.ext[m.id].pending;
          act(m, { kind: 'reel', token: p.token, timingMs: 100 }, p.biteAt + 100);
        }
      }
      if (f5) {
        const sites = () => s.life.farm?.sites ?? {};
        const pondId = `P${m.actor}`,
          labId = `Q${m.actor}`;
        // The field comes first; then the 양식장, the 품종 개량소 and the 서리 덮개 as they can be paid for.
        const saving = next && balance(m) < FARM_EXPAND_PRICE[next] + 40_000 && size() < 80;
        if (!saving && !sites()[pondId] && balance(m) > FACILITY_BY_ID.fishPond.build.beom + 40_000) {
          gather(m, FACILITY_BY_ID.fishPond.build.mats);
          act(m, { kind: 'siteBuild', site: pondId, facility: 'fishPond' }, morning);
        }
        if (!saving && sites()[pondId]?.tier === 1 && balance(m) > 240_000) {
          gather(m, FACILITY_BY_ID.fishPond.upgrades[0].mats);
          act(m, { kind: 'siteUpgrade', site: pondId }, morning);
        }
        if (!saving && !sites()[labId] && balance(m) > FACILITY_BY_ID.seedLab.build.beom + 40_000) {
          gather(m, FACILITY_BY_ID.seedLab.build.mats);
          act(m, { kind: 'siteBuild', site: labId, facility: 'seedLab' }, morning);
        }
        if (!saving && !s.life.farmx?.[m.id]?.fc && balance(m) > 100_000) {
          gather(m, { wood: 40, copper: 10, iron: 4 });
          if (act(m, { kind: 'farmBuild', item: 'frostcover' }, morning)) act(m, { kind: 'farmPlace', item: 'frostcover' }, morning);
        }
        const pond = sites()[pondId];
        if (pond?.tier >= 1) {
          if (!pond.state.pond) {
            // The dearest fish in the bag that may live in a pond.
            const fish = Object.keys(inv(m))
              .filter((id) => inv(m)[id] > 0 && pondFishOk(FISH_BY_ID[id]))
              .sort((a, b) => ITEM_BY_ID[b].sell - ITEM_BY_ID[a].sell)[0];
            if (fish) act(m, { kind: 'pondStock', site: pondId, fish }, morning);
          }
          act(m, { kind: 'pondCollect', site: pondId }, morning);
          // Whatever the pond asks for (crops come from the field).
          if (s.life.farm.sites[pondId].state.pond) {
            gather(m, { wood: 10, stone: 10, fertilizer: 2, bait: 3, shell: 2, copper: 2, pinecone: 3 });
            act(m, { kind: 'pondGive', site: pondId }, morning);
          }
        }
        if (sites()[labId]?.tier >= 1) {
          act(m, { kind: 'labCollect', site: labId }, morning);
          const produce = s.life.bag[m.id].produce;
          const most = Object.keys(produce).sort((a, b) => produce[b] - produce[a])[0];
          for (let k = 0; k < 2; k++) act(m, { kind: 'labLoad', site: labId, crop: most }, morning + k * MIN);
        }
      }
      // Evening: sell crops up to the day's cap (the demand curve sets the price), fish and roe.
      for (const c of Object.keys(s.life.bag[m.id].produce)) {
        const left = sellCapLeft(s.life, m.id, evening),
          n = Math.min(s.life.bag[m.id].produce[c], Math.floor(left / (CROP_INFO[c].sell * 1.5)));
        if (n > 0) act(m, { kind: 'sell', crop: c, n, at: 'coop' }, evening);
      }
      for (const [id, n] of Object.entries(inv(m)))
        if (n > 0 && ITEM_BY_ID[id]?.sell > 0 && (ITEM_BY_ID[id].kind === 'fish' || id === 'roe' || id === 'sturgeonroe'))
          act(m, { kind: 'sellItem', item: id, n, at: buyerOf(id, 'general') }, evening);
    }
    validateLedger(s.ledger);
  }
  return { start, end: money(), granted: s.ledger.granted, spent: s.ledger.spent, actions: ok, sizes: members.map((m) => s.life.ext[m.id].plots ?? 24) };
}
test(`F5 economy: ${DAYS} days, 7 farmers who fish — currency and issuance with F5 stay within 1.07× of without`, () => {
  const base = simulate(false),
    f5 = simulate(true);
  const report = {
    days: DAYS,
    base: { ...base, growth: +(base.end / base.start).toFixed(3) },
    f5: { ...f5, growth: +(f5.end / f5.start).toFixed(3) },
    currencyRatio: +(f5.end / base.end).toFixed(3),
    issuedRatio: +(f5.granted / base.granted).toFixed(3),
  };
  console.log('# F5 economy report', JSON.stringify(report));
  assert.equal(base.start, 7 * INITIAL_BEOM);
  assert.ok(f5.sizes.some((n) => n === 120), 'some friends reached the 120-tile field');
  assert.ok(report.currencyRatio <= 1.07, `currency ${report.currencyRatio}`);
  assert.ok(report.issuedRatio <= 1.07, `issued ${report.issuedRatio}`);
});
