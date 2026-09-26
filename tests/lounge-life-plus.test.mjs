import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CALENDAR_ANCHOR_DAY,
  FRIEND_PROFILES,
  HOLIDAYS,
  SEASON_DAYS,
  birthdayActors,
  calendarOf,
  eventsOn,
  kstDate,
  weatherOf,
  weekdayOf,
} from '../app/lounge-calendar.ts';
import {
  ACHIEVEMENTS,
  BUNDLES,
  BUNDLE_REWARD_BEOM,
  CROP_SELL_REF,
  DISHES,
  FISH_BY_ID,
  FURNITURE,
  ITEM_BY_ID,
  PLUS_ACTION_KINDS,
  SPAWN_SPOTS,
} from '../app/lounge-items.ts';
import {
  CROP_INFO,
  CROPS,
  LIFE_REJECT,
  LifeError,
  QUALITY_MULT,
  emptyLife,
  ensureLifeMember,
  isLifeAction,
  lifeAction,
  lifeView,
  plotQuality,
  plotReadyAt,
  readLife,
  sellCapLeft,
} from '../app/lounge-life.ts';
import {
  BOND_LEVELS,
  BOND_POINTS,
  FARM_EXPAND_PRICE,
  FIRST_DONATION_GRANT,
  PLUS_REJECT,
  REQUESTS_PER_DAY,
  ROD_PRICE,
  bugAt,
  forageAt,
  recordTables,
  recordVisit,
  requestsFor,
  shopStock,
  demandMult,
} from '../app/lounge-life-plus.ts';
import {
  INITIAL_BEOM,
  claimDailyGrant,
  kstDay,
  newLoungeLedger,
  registerWallet,
  validateLedger,
} from '../app/lounge-economy.ts';
import { accountSave, lifeUnlocksOf, ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { CO_DONATION_GRANT } from '../app/lounge-social-defs.ts';
import { catalogEntry, ROOM_CATALOG } from '../app/lounge-bedroom-catalog.ts';
import { defaultBedroom, lockedRoomItems } from '../app/lounge-bedroom-data.ts';
import { freshLounge } from '../app/lounge-look.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';

const uuid = () => crypto.randomUUID();
const MIN = 60_000,
  HOUR = 3_600_000,
  DAY = 86_400_000;
/** KST wall clock → epoch ms. */
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
const T0 = kst(2026, 9, 24); // Thursday, autumn, 추석 (sunny)
const RAIN = kst(2026, 10, 5, 9); // Monday, spring, rain

function world(n = 2) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
  }
  const s = { members, ledger, life };
  s.act = (m, action, now) => {
    const r = lifeAction(s.life, s.ledger, m, action, now);
    s.life = r.life;
    s.ledger = r.ledger;
    invariant(s.ledger);
    return r;
  };
  s.fails = (m, action, now, message) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || e.message === message),
    );
  s.balance = (m) => s.ledger.accounts['wallet-' + m.id];
  s.view = (m, now) => lifeView(s.life, m.id, m.actor, now);
  s.give = (m, item, n) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + n;
  };
  return s;
}
/** balances + reserved + house − granted = accounts × 100,000 */
function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  const reserved = Object.values(ledger.games)
    .filter((g) => g.state === 'reserved')
    .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
  assert.equal(
    balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0),
    Object.keys(ledger.accounts).length * INITIAL_BEOM,
  );
}

// ------------------------------------------------------------ calendar
test('calendar: KST seasons rotate every 7 real days from the Monday anchor', () => {
  assert.equal(kstDate(CALENDAR_ANCHOR_DAY), '2026-09-07');
  assert.equal(weekdayOf(CALENDAR_ANCHOR_DAY), 1);
  const at = (y, m, d, h) => calendarOf(kst(y, m, d, h));
  assert.equal(at(2026, 9, 7, 0).season, 'spring');
  assert.equal(at(2026, 9, 13, 23).season, 'spring');
  assert.equal(at(2026, 9, 14, 0).season, 'summer');
  assert.equal(at(2026, 9, 24, 12).season, 'autumn');
  assert.equal(at(2026, 9, 28, 0).season, 'winter');
  assert.equal(at(2026, 10, 5, 0).season, 'spring');
  const c = calendarOf(T0);
  assert.equal(c.date, '2026-09-24');
  assert.equal(c.seasonDay, 4);
  assert.equal(c.yearDay, 18);
  assert.equal(c.year, 1);
  assert.equal(c.weekday, 4);
  assert.equal(c.hour, 12);
  assert.equal(c.timeOfDay, 'day');
  assert.equal(c.seasonEndsAt, kst(2026, 9, 28, 0));
  // 28-day game years.
  assert.equal(calendarOf(T0 + 28 * DAY).year, 2);
  assert.equal(calendarOf(T0 + 28 * DAY).season, 'autumn');
  assert.equal(SEASON_DAYS, 7);
  assert.equal(calendarOf(kst(2026, 9, 24, 6)).timeOfDay, 'dawn');
  assert.equal(calendarOf(kst(2026, 9, 24, 18)).timeOfDay, 'evening');
  assert.equal(calendarOf(kst(2026, 9, 24, 23)).timeOfDay, 'night');
});

test('calendar: Korean holidays 2026–2028, weekly events, placeholder birthdays', () => {
  const ids = (y, m, d, h = 12) => calendarOf(kst(y, m, d, h)).events.map((e) => e.id);
  assert.ok(ids(2026, 9, 25).includes('chuseok-2026'));
  assert.ok(ids(2027, 2, 7).includes('seollal-2027'));
  assert.ok(ids(2028, 10, 3).includes('chuseok-2028'));
  assert.ok(ids(2028, 10, 3).includes('gaecheonjeol-2028'));
  assert.ok(ids(2026, 12, 25).includes('christmas-2026'));
  assert.ok(ids(2027, 5, 5).includes('childrensday-2027'));
  for (const h of HOLIDAYS)
    for (const d of h.dates ?? []) assert.match(d, /^202[678]-\d\d-\d\d$/, h.key);
  // Weekly: Wed fishing, Fri casino (18–24 KST), Sun market.
  assert.ok(ids(2026, 9, 23).includes('weekly-fishing'));
  const fri = calendarOf(kst(2026, 9, 25, 12)).events.find((e) => e.id === 'weekly-casino');
  assert.equal(fri.active, false);
  assert.equal(calendarOf(kst(2026, 9, 25, 20)).events.find((e) => e.id === 'weekly-casino').active, true);
  assert.ok(ids(2026, 9, 27).includes('weekly-market'));
  // Birthdays are placeholders (null) until the user fills them in.
  assert.equal(FRIEND_PROFILES.length, 7);
  assert.ok(FRIEND_PROFILES.every((p) => p.birthday === null));
  for (let d = 0; d < 366; d++) assert.deepEqual(birthdayActors(kstDay(T0) + d), []);
  const profiles = FRIEND_PROFILES.map((p, i) => (i === 2 ? { ...p, birthday: '09-24' } : p));
  assert.deepEqual(birthdayActors(kstDay(T0), profiles), [2]);
  const bday = eventsOn(kstDay(T0), T0, profiles).find((e) => e.kind === 'birthday');
  assert.equal(bday.id, 'birthday-2-2026');
  assert.equal(bday.actor, 2);
  assert.ok(bday.claim > 0);
});

test('weather: deterministic per KST day, seasonal, holidays forced, forecast in the view', () => {
  const counts = {};
  for (let d = 0; d < 364; d++) {
    const day = kstDay(T0) + d,
      w = weatherOf(day);
    assert.equal(weatherOf(day), w);
    counts[w] = (counts[w] ?? 0) + 1;
    if (w === 'snow') assert.equal(calendarOf(day * DAY).season === 'winter' || HOLIDAYS.some((h) => h.weather === 'snow'), true);
  }
  for (const w of ['sunny', 'cloudy', 'rain', 'storm', 'snow']) assert.ok(counts[w] > 0, w);
  assert.equal(weatherOf(kstDay(T0)), 'sunny'); // 추석
  assert.equal(weatherOf(kstDay(kst(2026, 12, 25))), 'snow'); // 크리스마스
  const s = world(1),
    v = s.view(s.members[0], T0);
  assert.deepEqual(v.weather, { today: weatherOf(kstDay(T0)), tomorrow: weatherOf(kstDay(T0) + 1) });
  assert.equal(v.calendar.season, 'autumn');
});

// ------------------------------------------------------------ farming
test('farming: seasonal crops, greenhouse, base crops all year', () => {
  const s = world(1),
    [m] = s.members;
  s.life.bag[m.id].seeds.watermelon = 2;
  s.life.bag[m.id].seeds.sweetpotato = 2;
  s.fails(m, { kind: 'plant', plot: 0, crop: 'watermelon' }, T0, '지금은 수박 철이 아니라 심을 수 없어요.');
  s.act(m, { kind: 'plant', plot: 0, crop: 'sweetpotato' }, T0);
  s.act(m, { kind: 'plant', plot: 1, crop: 'carrot' }, T0);
  s.life.flags = ['greenhouse'];
  s.act(m, { kind: 'plant', plot: 2, crop: 'watermelon' }, T0);
  // Catalog: crop sell prices are shared with lounge-items (dish values).
  for (const c of CROPS) assert.equal(CROP_SELL_REF[c], CROP_INFO[c].sell, c);
  assert.equal(CROPS.filter((c) => !CROP_INFO[c].seasons).length, 4);
});

test('farming: rain waters crops, watering is refused, today+tomorrow forecast', () => {
  const s = world(1),
    [m] = s.members;
  assert.equal(weatherOf(kstDay(RAIN)), 'rain');
  s.act(m, { kind: 'plant', plot: 0, crop: 'tomato' }, RAIN);
  const plot = s.life.farms[m.id][0];
  // Watered by rain at planting: 60 min × 0.6.
  assert.equal(plotReadyAt(plot, RAIN), RAIN + 36 * MIN);
  s.fails(m, { kind: 'water', plot: 0 }, RAIN + MIN, LIFE_REJECT.rained);
  s.fails(m, { kind: 'water', plot: -1 }, RAIN + MIN, LIFE_REJECT.nothingToWater);
  const v = s.view(m, RAIN + MIN);
  assert.equal(v.me.farm[0].rained, true);
  assert.equal(v.housesPlotsPublic[m.id][0].needsWater, false);
  // Planted the evening before a rainy day: rain waters it at 00:00 KST.
  const t = kst(2026, 10, 4, 23);
  assert.notEqual(weatherOf(kstDay(t)), 'rain');
  s.life.bag[m.id].seeds.strawberry = 1;
  s.act(m, { kind: 'plant', plot: 1, crop: 'strawberry' }, t);
  const p1 = s.life.farms[m.id][1];
  assert.equal(plotReadyAt(p1, t + MIN), t + 8 * HOUR); // no rain yet
  const midnight = kst(2026, 10, 5, 0);
  assert.equal(plotReadyAt(p1, midnight + MIN), midnight + Math.ceil((8 * HOUR - HOUR) * 0.6));
});

test('farming: regrowing corn, quality stars from fertilizer, quality sell prices', () => {
  const s = world(1),
    [m] = s.members,
    summer = kst(2026, 9, 14, 8);
  s.life.bag[m.id].seeds.corn = 1;
  s.act(m, { kind: 'plant', plot: 0, crop: 'corn' }, summer);
  let t = summer;
  for (let i = 0; i < 3; i++) {
    t = plotReadyAt(s.life.farms[m.id][0], Infinity);
    s.act(m, { kind: 'harvest', plot: 0 }, t);
    if (i < 2) {
      assert.equal(s.life.farms[m.id][0].crop, 'corn');
      assert.equal(s.life.farms[m.id][0].n, i + 1);
      assert.equal(s.view(m, t).me.farm[0].harvestsLeft, 2 - i);
    }
  }
  assert.equal(s.life.farms[m.id][0].crop, null);
  assert.equal(s.life.bag[m.id].produce.corn, 3);
  // Fertilizer raises the odds deterministically.
  const odds = (fert) => {
    let gold = 0,
      silver = 0;
    for (let i = 0; i < 2000; i++) {
      const q = plotQuality('u', i % 12, { crop: 'carrot', plantedAt: i * 1000, wateredAt: null, ...(fert ? { fert } : {}) });
      if (q === 2) gold++;
      if (q === 1) silver++;
    }
    return { gold: gold / 2000, silver: silver / 2000 };
  };
  const q0 = odds(0),
    q2 = odds(2);
  assert.ok(q0.gold < 0.1 && q2.gold > 0.25, JSON.stringify({ q0, q2 }));
  // Selling by quality: gold ×1.5, silver ×1.25; unspecified sells lowest first.
  s.life.bag[m.id].produce.pumpkin = 3;
  s.life.ext[m.id].q1 = { pumpkin: 1 };
  s.life.ext[m.id].q2 = { pumpkin: 1 };
  let before = s.balance(m);
  s.act(m, { kind: 'sell', crop: 'pumpkin', n: 1, quality: 2 }, t);
  assert.equal(s.balance(m) - before, 1_800 * QUALITY_MULT[2]);
  before = s.balance(m);
  s.act(m, { kind: 'sell', crop: 'pumpkin', n: 2 }, t);
  // Units 2 and 3 of pumpkin today: the demand curve (half-life 6) applies.
  assert.equal(
    s.balance(m) - before,
    Math.round(1_800 * demandMult('pumpkin', 1)) + Math.round(1_800 * QUALITY_MULT[1] * demandMult('pumpkin', 2)),
  );
  assert.equal(s.life.bag[m.id].produce.pumpkin, 0);
  assert.equal(s.life.ext[m.id].q1, undefined);
  s.fails(m, { kind: 'sell', crop: 'pumpkin', n: 1, quality: 1 }, t, LIFE_REJECT.notEnough);
});

test('farming: fertilizer purchase and use, farm expansion 6→9→12', () => {
  const s = world(1),
    [m] = s.members;
  s.act(m, { kind: 'plant', plot: -1, crop: 'carrot' }, T0);
  s.fails(m, { kind: 'fertilize', plot: 0, item: 'fertilizer' }, T0, LIFE_REJECT.notEnough);
  const before = s.balance(m);
  s.act(m, { kind: 'buyItem', item: 'fertilizer', n: 2 }, T0);
  s.act(m, { kind: 'buyItem', item: 'fertilizer-deluxe', n: 1 }, T0);
  assert.equal(before - s.balance(m), 2 * 400 + 2_000);
  s.act(m, { kind: 'fertilize', plot: 0, item: 'fertilizer-deluxe' }, T0);
  assert.equal(s.life.farms[m.id][0].fert, 2);
  assert.equal(s.life.farms[m.id][0].speed, 10);
  s.fails(m, { kind: 'fertilize', plot: 0, item: 'fertilizer' }, T0, PLUS_REJECT.fertDone);
  s.act(m, { kind: 'fertilize', plot: -1, item: 'fertilizer' }, T0);
  assert.deepEqual(s.life.farms[m.id].map((p) => p.fert ?? 0), [2, 1, 1, 0, 0, 0]);
  assert.equal(s.view(m, T0).me.inv.fertilizer, undefined);
  // Expansion.
  const rich = world(1),
    [r] = rich.members;
  rich.ledger = claimDailyGrant(rich.ledger, 'wallet-' + r.id, T0);
  rich.fails(r, { kind: 'expandFarm' }, T0, LIFE_REJECT.balance);
  // Sell a lot over several days to afford it.
  let t = T0;
  while (rich.balance(r) < FARM_EXPAND_PRICE[9]) {
    rich.life.bag[r.id].produce.strawberry = 8;
    rich.act(r, { kind: 'sell', crop: 'strawberry', n: 8 }, t);
    t += DAY;
  }
  rich.act(r, { kind: 'expandFarm' }, t);
  assert.equal(rich.life.farms[r.id].length, 9);
  assert.equal(rich.view(r, t).me.plots, 9);
  rich.act(r, { kind: 'plant', plot: 8, crop: 'carrot' }, t);
  // Reload keeps the 9-plot farm.
  const back = readLife(JSON.parse(JSON.stringify(rich.life)));
  assert.equal(back.farms[r.id].length, 9);
  assert.equal(ensureLifeMember(back, r.id, 0).farms[r.id].length, 9);
  while (rich.balance(r) < FARM_EXPAND_PRICE[12]) {
    rich.life.bag[r.id].produce.strawberry = 8;
    rich.act(r, { kind: 'sell', crop: 'strawberry', n: 8 }, t);
    t += DAY;
  }
  rich.act(r, { kind: 'expandFarm' }, t);
  assert.equal(rich.life.farms[r.id].length, 12);
  rich.fails(r, { kind: 'expandFarm' }, t, PLUS_REJECT.farmMax);
});

test('friend watering: once per friend farm per KST day, friendship and stats', () => {
  const s = world(3),
    [a, b, c] = s.members;
  s.act(b, { kind: 'plant', plot: -1, crop: 'carrot' }, T0);
  s.fails(a, { kind: 'waterFriend', owner: 0, plot: -1 }, T0, PLUS_REJECT.friendFarm);
  s.act(a, { kind: 'waterFriend', owner: 1, plot: 0 }, T0 + MIN);
  assert.equal(s.life.farms[b.id][0].wateredAt, T0 + MIN);
  s.fails(a, { kind: 'waterFriend', owner: 1, plot: 1 }, T0 + 2 * MIN, PLUS_REJECT.friendWatered);
  s.act(c, { kind: 'waterFriend', owner: b.id, plot: -1 }, T0 + 2 * MIN);
  assert.ok(s.life.farms[b.id].filter((p) => p.crop).every((p) => p.wateredAt !== null));
  const v = s.view(a, T0 + 3 * MIN);
  assert.deepEqual(v.me.waterFriend, [1]);
  assert.equal(v.me.stats.waterFriend, 1);
  assert.equal(v.me.bonds.find((x) => x.actor === 1).points, BOND_POINTS.water);
  assert.ok(v.me.achievements.find((x) => x.id === 'waterfriend-1').done);
  // Next day it works again (but no dry plot left → nothing to water).
  s.fails(a, { kind: 'waterFriend', owner: 1, plot: -1 }, T0 + DAY, LIFE_REJECT.nothingToWater);
});

// ------------------------------------------------------------ shop & room
test('furniture shop: daily rotation, Sunday market, seasonal/holiday stock, purchases', () => {
  const life = emptyLife(),
    thu = shopStock(life, T0),
    sun = shopStock(life, kst(2026, 9, 27));
  assert.equal(thu.discount, 0);
  assert.equal(sun.discount, 10);
  assert.ok(thu.items.length >= 6);
  assert.equal(sun.items.length, 9);
  assert.deepEqual(shopStock(life, T0 + HOUR), thu);
  assert.notDeepEqual(shopStock(life, T0 + 3 * DAY).items, thu.items);
  // Autumn garland and the Chuseok lantern are in stock; winter's snowman is not.
  const refs = thu.items.map((i) => i.ref);
  assert.ok(refs.includes('furn-maple-garland'));
  assert.ok(refs.includes('furn-moon-lantern'));
  assert.ok(!refs.includes('furn-snowman'));
  assert.ok(!refs.includes('furn-village-medal'));
  const market = shopStock({ ...life, flags: ['market'] }, T0);
  assert.equal(market.items.length, thu.items.length + 2);
  const s = world(1),
    [m] = s.members,
    item = thu.items.find((i) => !i.limited),
    missing = FURNITURE.find((f) => !f.unsold && !refs.includes(f.ref));
  s.fails(m, { kind: 'buyFurniture', ref: missing.ref }, T0, PLUS_REJECT.stock);
  const before = s.balance(m);
  s.act(m, { kind: 'buyFurniture', ref: item.ref, n: 2 }, T0);
  assert.equal(before - s.balance(m), item.price * 2);
  assert.equal(s.view(m, T0).me.furniture[item.ref], 2);
  assert.equal(s.ledger.spent, before - s.balance(m));
});

test('room save validator: premium furniture only up to owned copies; free items stay free', () => {
  // Every FURNITURE entry exists in the room catalog as a premium prop.
  for (const f of FURNITURE) {
    const e = catalogEntry(f.ref);
    assert.ok(e, f.ref);
    assert.equal(e.name, f.name);
    assert.equal(e.premium, true);
    assert.equal(e.unlock, f.ref);
  }
  // The existing room items stay free (47 free + 5 shop trophies).
  assert.equal(ROOM_CATALOG.filter((e) => !e.unlock).length, 47);
  assert.equal(ROOM_CATALOG.filter((e) => e.unlock && !e.premium).length, 5);
  const s = world(1),
    [m] = s.members;
  s.life.ext = { [m.id]: { furn: { 'furn-chair': 1 } } };
  const unlocks = lifeUnlocksOf(JSON.parse(JSON.stringify(s.life)), m.id);
  assert.deepEqual(unlocks, ['furn-chair']);
  const room = defaultBedroom(0),
    item = (id, x) => ({ id, kind: 'prop', ref: 'furn-chair', x, z: 0, rotY: 0, scale: 1 });
  const one = { ...room, items: [...room.items, item('p1', 3.5)] },
    two = { ...one, items: [...one.items, item('p2', 3.5)] };
  assert.deepEqual(lockedRoomItems(one, unlocks), []);
  assert.deepEqual(lockedRoomItems(two, unlocks), ['furn-chair']);
  assert.deepEqual(lockedRoomItems(one, []), ['furn-chair']);
  // Grandfathered copies already saved in the room stay.
  assert.deepEqual(lockedRoomItems(two, unlocks, one), []);
  const save = { ...freshLounge(0), bedroom: one };
  assert.doesNotThrow(() => accountSave(save, 0, null, { unlocks }));
  assert.throws(() => accountSave(save, 0, null, { unlocks: [] }));
  assert.equal(ACCOUNT_IDS.length, 7);
});

// ------------------------------------------------------------ fishing
test('fishing: cast → server bite window → reel; early/late misses; records; rod', () => {
  const s = world(2),
    [m, n] = s.members;
  s.fails(m, { kind: 'cast', spot: 'sea' }, T0, PLUS_REJECT.spotLocked);
  s.fails(m, { kind: 'cast', spot: 'ocean' }, T0, PLUS_REJECT.spot);
  s.act(m, { kind: 'cast', spot: 'river' }, T0);
  let p = s.view(m, T0).me.fishing.pending;
  assert.ok(p.token && p.biteAt >= T0 + 1_500 && p.biteAt <= T0 + 6_000);
  assert.equal(p.fish, undefined); // hidden
  assert.equal(p.expiresAt, p.biteAt + p.windowMs + 1_500);
  // Too early.
  s.act(m, { kind: 'reel', token: p.token, timingMs: 100 }, T0 + 500);
  assert.equal(s.view(m, T0 + 500).me.fishing.last.reason, 'early');
  s.fails(m, { kind: 'reel', token: p.token, timingMs: 100 }, T0 + 600, PLUS_REJECT.token);
  // In the window.
  s.act(m, { kind: 'cast', spot: 'river' }, T0 + MIN);
  p = s.view(m, T0 + MIN).me.fishing.pending;
  s.fails(m, { kind: 'reel', token: 'wrong', timingMs: 100 }, p.biteAt + 100, PLUS_REJECT.token);
  s.act(m, { kind: 'reel', token: p.token, timingMs: 200 }, p.biteAt + 200);
  const last = s.view(m, p.biteAt + 200).me.fishing.last;
  assert.equal(last.ok, true);
  assert.ok(FISH_BY_ID[last.fish].spots.includes('river'));
  assert.equal(s.view(m, p.biteAt + 200).me.inv[last.fish], 1);
  assert.equal(last.record, true);
  assert.equal(s.view(n, p.biteAt + 300).records[last.fish].actor, 0);
  assert.ok(s.view(m, p.biteAt + 300).me.dex.includes(last.fish));
  // Too late.
  s.act(m, { kind: 'cast', spot: 'pond' }, T0 + 2 * MIN);
  p = s.view(m, T0 + 2 * MIN).me.fishing.pending;
  s.act(m, { kind: 'reel', token: p.token, timingMs: 100 }, p.expiresAt + 1);
  assert.equal(s.view(m, p.expiresAt + 1).me.fishing.last.reason, 'late');
  // Rod upgrades are a sink; the window grows.
  const before = s.balance(m);
  s.act(m, { kind: 'upgradeRod' }, T0);
  assert.equal(before - s.balance(m), ROD_PRICE[2]);
  assert.equal(s.view(m, T0).me.fishing.rod, 2);
  // The sea opens with the bridge flag.
  s.life.flags = ['bridge'];
  s.act(m, { kind: 'cast', spot: 'sea' }, T0 + 3 * MIN);
});

test('fishing: deterministic fish table by season/weather/time; Wednesday sells +20%', () => {
  const s = world(1),
    [m] = s.members,
    wed = kst(2026, 9, 23, 12);
  s.give(m, 'carp', 2);
  let before = s.balance(m);
  s.act(m, { kind: 'sellItem', item: 'carp', n: 1 }, T0);
  assert.equal(s.balance(m) - before, ITEM_BY_ID.carp.sell);
  before = s.balance(m);
  s.act(m, { kind: 'sellItem', item: 'carp', n: 1 }, wed);
  assert.equal(s.balance(m) - before, Math.round(ITEM_BY_ID.carp.sell * 1.2));
  s.fails(m, { kind: 'sellItem', item: 'fertilizer', n: 1 }, wed, PLUS_REJECT.noSell);
  // Night river casts can give night fish; winter pond gives smelt-type fish.
  const caught = new Set();
  for (let i = 0; i < 60; i++) {
    const t = kst(2026, 9, 29, 22) + i * 10 * MIN;
    s.act(m, { kind: 'cast', spot: 'pond' }, t);
    const p = s.view(m, t).me.fishing.pending;
    s.act(m, { kind: 'reel', token: p.token, timingMs: 50 }, p.biteAt + 50);
    caught.add(s.view(m, t).me.fishing.last.fish);
  }
  for (const id of caught) {
    const f = FISH_BY_ID[id];
    assert.ok(f.spots.includes('pond') && f.seasons.includes('winter'), id);
  }
});

// ------------------------------------------------------------ foraging & bugs
test('foraging and bugs: daily deterministic spawns per district, per-user pickup', () => {
  const s = world(2),
    [a, b] = s.members,
    day = kstDay(T0);
  const v = s.view(a, T0);
  assert.ok(v.me.spawns.length > 0);
  for (const sp of v.me.spawns) assert.ok(SPAWN_SPOTS.find((x) => x.id === sp.spot && x.district === sp.district));
  assert.ok(!v.me.spawns.some((sp) => sp.spot === 'east-3')); // needs the bridge
  const forage = v.me.spawns.find((sp) => sp.kind === 'forage');
  assert.equal(forageAt(forage.spot, day), forage.item);
  s.act(a, { kind: 'forage', spot: forage.spot }, T0);
  s.fails(a, { kind: 'forage', spot: forage.spot }, T0 + MIN, PLUS_REJECT.foraged);
  s.act(b, { kind: 'forage', spot: forage.spot }, T0 + MIN);
  assert.equal(s.view(a, T0).me.inv[forage.item], 1);
  assert.equal(s.view(a, T0).me.spawns.find((sp) => sp.spot === forage.spot && sp.kind === 'forage').taken, true);
  assert.equal(s.view(a, T0 + DAY).me.spawns.find((sp) => sp.kind === 'forage' && sp.taken), undefined);
  const empty = SPAWN_SPOTS.find((sp) => !sp.flag && !forageAt(sp.id, day));
  if (empty) s.fails(a, { kind: 'forage', spot: empty.id }, T0, PLUS_REJECT.nothingHere);
  // Bugs are per time slot.
  const bug = v.me.spawns.find((sp) => sp.kind === 'bug');
  assert.equal(bugAt(bug.spot, day, 1), bug.item);
  s.act(a, { kind: 'catch', spot: bug.spot }, T0);
  s.fails(a, { kind: 'catch', spot: bug.spot }, T0 + MIN, PLUS_REJECT.caught);
  assert.equal(s.view(a, T0).me.stats.bug, 1);
  // Forage buff gives one more.
  s.give(a, 'lunchbox', 1);
  s.act(a, { kind: 'eat', item: 'lunchbox' }, T0 + DAY);
  const f2 = s.view(a, T0 + DAY).me.spawns.find((sp) => sp.kind === 'forage');
  s.act(a, { kind: 'forage', spot: f2.spot }, T0 + DAY);
  assert.ok(s.view(a, T0 + DAY).me.inv[f2.item] >= 2);
});

// ------------------------------------------------------------ museum & achievements
test('museum: first donor recorded, one stamp per friend per item; achievements grant once', () => {
  const s = world(2),
    [a, b] = s.members;
  s.give(a, 'crucian', 2);
  s.give(b, 'crucian', 1);
  const before = s.balance(a);
  s.act(a, { kind: 'donate', item: 'crucian' }, T0);
  // First donation (300) + 첫 기증 achievement (500).
  assert.equal(s.balance(a) - before, FIRST_DONATION_GRANT + 500);
  // The first donor cannot stamp the same item twice.
  s.fails(a, { kind: 'donate', item: 'crucian' }, T0, PLUS_REJECT.donated);
  // C-5: a friend may still donate it (co-donation stamp), the honor stays.
  const bBefore = s.balance(b);
  s.act(b, { kind: 'donate', item: 'crucian' }, T0);
  assert.equal(s.balance(b) - bBefore, CO_DONATION_GRANT + 500);
  s.fails(b, { kind: 'donate', item: 'crucian' }, T0, PLUS_REJECT.donated);
  assert.deepEqual(s.view(b, T0).social.museum.donors.crucian, [0, 1]);
  s.fails(a, { kind: 'donate', item: 'fertilizer' }, T0, PLUS_REJECT.noDonate);
  assert.deepEqual(s.view(b, T0).museum.crucian, { actor: 0, at: T0 });
  s.life.bag[a.id].produce.carrot = 1;
  const b2 = s.balance(a);
  s.act(a, { kind: 'donate', item: 'carrot' }, T0);
  assert.equal(s.balance(a) - b2, FIRST_DONATION_GRANT); // achievement not granted twice
  const ach = s.view(a, T0).me.achievements;
  assert.equal(ach.length, ACHIEVEMENTS.length);
  assert.deepEqual(ach.find((x) => x.id === 'donate-1'), { id: 'donate-1', progress: 1, done: true });
  assert.deepEqual(ach.map((x) => x.id), ACHIEVEMENTS.map((x) => x.id));
});

// ------------------------------------------------------------ cooking & crafting
test('cooking and crafting: recipes, buffs, furniture and fertilizer', () => {
  const s = world(1),
    [m] = s.members;
  assert.ok(DISHES.length >= 10);
  s.fails(m, { kind: 'cook', recipe: 'salad' }, T0, PLUS_REJECT.ingredients);
  s.life.bag[m.id].produce.carrot = 2;
  s.life.bag[m.id].produce.tomato = 2;
  s.act(m, { kind: 'cook', recipe: 'salad', n: 2 }, T0);
  assert.equal(s.view(m, T0).me.inv.salad, 2);
  assert.equal(s.life.bag[m.id].produce.carrot, 0);
  s.fails(m, { kind: 'cook', recipe: 'songpyeon' }, T0, PLUS_REJECT.recipeLocked);
  s.act(m, { kind: 'eat', item: 'salad' }, T0);
  s.fails(m, { kind: 'eat', item: 'salad' }, T0 + MIN, PLUS_REJECT.ate);
  const v = s.view(m, T0);
  assert.equal(v.me.buff.kind, 'grow');
  // 초록 손: crops planted today grow 15% faster.
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' }, T0 + MIN);
  assert.equal(s.life.farms[m.id][0].speed, 15);
  assert.equal(s.view(m, T0 + DAY).me.buff, null);
  // Crafting: category inputs take the cheapest items first.
  s.give(m, 'wood', 10);
  s.give(m, 'pinecone', 2);
  s.give(m, 'wildflower', 1);
  s.give(m, 'azalea', 1);
  s.act(m, { kind: 'craft', recipe: 'fertilizer', n: 2 }, T0);
  assert.equal(s.view(m, T0).me.inv.fertilizer, 4);
  s.act(m, { kind: 'craft', recipe: 'furn-plant' }, T0);
  const after = s.view(m, T0).me;
  assert.equal(after.furniture['furn-plant'], 1);
  assert.equal(after.inv.wildflower, undefined); // cheaper flower used
  assert.equal(after.inv.azalea, 1);
  assert.equal(after.stats.craft, 3);
});

// ------------------------------------------------------------ bundles
test('village bundles: shared contributions, 범 slots are sinks, completion flag + rewards', () => {
  const s = world(3),
    [a, b, c] = s.members,
    bundle = BUNDLES.find((x) => x.id === 'spring-forage');
  s.give(a, 'mugwort', 5);
  s.give(a, 'shepherd', 5);
  s.give(b, 'wildgarlic', 3);
  s.give(b, 'azalea', 5);
  s.act(a, { kind: 'contribute', bundle: bundle.id, slot: 0, n: 5 }, T0);
  s.act(a, { kind: 'contribute', bundle: bundle.id, slot: 1, n: 99 }, T0);
  s.fails(a, { kind: 'contribute', bundle: bundle.id, slot: 1, n: 1 }, T0, PLUS_REJECT.slotFull);
  s.act(b, { kind: 'contribute', bundle: bundle.id, slot: 2, n: 3 }, T0);
  s.act(b, { kind: 'contribute', bundle: bundle.id, slot: 3, n: 5 }, T0);
  assert.equal(s.view(b, T0).me.inv.azalea, 2); // only 3 were needed
  const spentBefore = s.ledger.spent ?? 0;
  s.act(c, { kind: 'contribute', bundle: bundle.id, slot: 4, n: 60_000 }, T0);
  assert.equal((s.ledger.spent ?? 0) - spentBefore, 60_000);
  assert.equal(s.view(a, T0).flags.includes('bridge'), false);
  const balances = [a, b, c].map((m) => s.balance(m));
  s.act(c, { kind: 'contribute', bundle: bundle.id, slot: 4, n: 40_000 }, T0 + MIN);
  const v = s.view(a, T0 + MIN);
  assert.ok(v.flags.includes('bridge'));
  const bv = v.bundles.find((x) => x.id === bundle.id);
  assert.equal(bv.done, true);
  assert.deepEqual(bv.contributors, { 0: 2, 1: 2, 2: 2 });
  // Every contributor: 3,000범 + the 기념패 (+ one-time achievements).
  assert.ok(s.balance(a) - balances[0] >= BUNDLE_REWARD_BEOM);
  assert.equal(s.view(b, T0).me.furniture['furn-village-medal'], 1);
  assert.ok(v.memories.some((mem) => mem.kind === 'bundle'));
  s.fails(a, { kind: 'contribute', bundle: bundle.id, slot: 0, n: 1 }, T0, PLUS_REJECT.bundleDone);
  // Invariant through all of it.
  invariant(s.ledger);
});

// ------------------------------------------------------------ friendship, requests, events, digest
test('friendship: gifts by taste (placeholders), visits, levels, memories', () => {
  const s = world(3),
    [a, b] = s.members;
  s.give(a, 'crucian', 3);
  s.act(a, { kind: 'mail', to: 1, text: '', gift: { kind: 'item', item: 'crucian', n: 1 } }, T0);
  // 강재 (1) likes fish (placeholder table): 2×.
  assert.equal(s.view(a, T0).me.bonds.find((x) => x.actor === 1).points, BOND_POINTS.gift * 2);
  assert.equal(s.view(b, T0).me.inv.crucian, 1);
  // Only the first gift per day counts for friendship.
  s.act(a, { kind: 'mail', to: 1, text: '하나 더', gift: { kind: 'item', item: 'crucian', n: 1 } }, T0 + 5_000);
  assert.equal(s.view(a, T0).me.bonds.find((x) => x.actor === 1).points, BOND_POINTS.gift * 2);
  s.fails(a, { kind: 'mail', to: 1, text: '', gift: { kind: 'item', item: 'carp', n: 1 } }, T0 + 10_000, LIFE_REJECT.notEnough);
  // Visits (cloud hook), once per day per direction.
  const life = recordVisit(s.life, a, 1, T0);
  assert.equal(recordVisit(life, a, 1, T0 + MIN), life);
  assert.equal(recordVisit(life, a, 0, T0 + MIN), life); // own room
  s.life = life;
  assert.equal(s.view(a, T0).me.bonds.find((x) => x.actor === 1).points, BOND_POINTS.gift * 2 + BOND_POINTS.visit);
  // Level-ups create memories (capped).
  s.life.bonds['0-1'] = BOND_LEVELS[2] - 1;
  s.life = recordVisit(s.life, a, 1, T0 + DAY);
  const v = s.view(a, T0 + DAY);
  assert.equal(v.me.bonds.find((x) => x.actor === 1).level, 3);
  assert.ok(v.memories.some((mem) => mem.kind === 'bond'));
  assert.equal(v.bondsAll['0-1'], BOND_LEVELS[2] - 1 + BOND_POINTS.visit);
});

test('requests: three deterministic friend requests a day; deliver once for a reward', () => {
  const s = world(1),
    [m] = s.members,
    day = kstDay(T0),
    reqs = requestsFor(s.life, 0, day);
  assert.equal(reqs.length, REQUESTS_PER_DAY);
  assert.deepEqual(requestsFor(s.life, 0, day), reqs);
  assert.ok(reqs.every((r) => r.from !== 0 && r.reward > 0));
  const r = reqs[0];
  s.fails(m, { kind: 'deliver', to: r.from }, T0, LIFE_REJECT.notEnough);
  if (CROPS.includes(r.item)) s.life.bag[m.id].produce[r.item] = r.n;
  else if (r.item === 'fruit') s.life.bag[m.id].fruit = r.n;
  else s.give(m, r.item, r.n);
  const before = s.balance(m);
  s.act(m, { kind: 'deliver', to: r.from }, T0);
  assert.ok(s.balance(m) - before >= r.reward);
  s.fails(m, { kind: 'deliver', to: r.from }, T0, PLUS_REJECT.requestDone);
  const v = s.view(m, T0);
  assert.equal(v.me.requests.find((x) => x.from === r.from).done, true);
  assert.equal(v.me.bonds.find((x) => x.actor === r.from).points, BOND_POINTS.request);
  const other = [1, 2, 3, 4, 5, 6].find((f) => !reqs.some((x) => x.from === f));
  s.fails(m, { kind: 'deliver', to: other }, T0, PLUS_REJECT.request);
});

test('events: holiday gifts claim once; fountain wish; tables and the Friday casino night', () => {
  const s = world(3),
    [a, b, c] = s.members;
  const before = s.balance(a);
  s.act(a, { kind: 'claimEvent', event: 'chuseok-2026' }, T0);
  assert.equal(s.balance(a) - before, 5_000);
  s.fails(a, { kind: 'claimEvent', event: 'chuseok-2026' }, T0 + MIN, PLUS_REJECT.claimed);
  // 추석 lasts three days but its gift is claimed once.
  s.fails(a, { kind: 'claimEvent', event: 'chuseok-2026' }, T0 + DAY, PLUS_REJECT.claimed);
  s.fails(a, { kind: 'claimEvent', event: 'seollal-2027' }, T0, PLUS_REJECT.event);
  s.fails(a, { kind: 'wish' }, T0, PLUS_REJECT.wish);
  s.life.flags = ['fountain'];
  s.act(a, { kind: 'wish' }, T0);
  s.fails(a, { kind: 'wish' }, T0, PLUS_REJECT.wished);
  // Friday 20:00 KST: finishing a table pays 500범 once per player per day.
  const fri = kst(2026, 9, 25, 20),
    game = { id: 'g1', wallets: [a, b, c].map((m) => 'wallet-' + m.id) };
  const bal = [a, b, c].map((m) => s.balance(m));
  let r = recordTables(s.life, s.ledger, [game], fri);
  r = recordTables(r.life, r.ledger, [{ ...game, id: 'g2' }], fri + MIN);
  s.life = r.life;
  s.ledger = r.ledger;
  invariant(s.ledger);
  [a, b, c].forEach((m, i) => assert.equal(s.balance(m) - bal[i], 500));
  const v = s.view(a, fri);
  assert.equal(v.me.stats.tables, 2);
  assert.equal(v.me.bonds.find((x) => x.actor === 1).points, BOND_POINTS.table * 2);
  // Not Friday night: no bonus.
  const bal2 = s.balance(a);
  r = recordTables(s.life, s.ledger, [{ ...game, id: 'g3' }], T0);
  assert.equal(r.ledger.accounts['wallet-' + a.id], bal2);
});

test('digest: yesterday’s village news, capped', () => {
  const s = world(3),
    [a, b] = s.members;
  s.act(b, { kind: 'plant', plot: -1, crop: 'carrot' }, T0);
  s.act(a, { kind: 'waterFriend', owner: 1, plot: -1 }, T0);
  s.life = recordVisit(s.life, a, 1, T0);
  assert.equal(s.view(a, T0).digest.lines.length, 0);
  const v = s.view(a, T0 + DAY);
  assert.equal(v.digest.date, '2026-09-24');
  assert.deepEqual(v.digest.lines.map((l) => l.kind), ['water', 'visit']);
  assert.match(v.digest.lines[0].text, /도원이 강재의 밭에 물을 줬어요/);
  // Two days later it is gone; storage keeps ≤ 2 days.
  assert.equal(s.view(a, T0 + 2 * DAY).digest.lines.length, 0);
  for (let i = 0; i < 60; i++) s.life = recordVisit(s.life, { id: a.id, actor: i % 2 ? 0 : 2 }, i % 7, T0 + DAY + i);
  assert.ok(s.life.news.every((d) => d.lines.length <= 40));
  assert.ok(s.view(a, T0 + 2 * DAY).digest.lines.length <= 12);
});

// ------------------------------------------------------------ compatibility
test('compatibility: older worlds read back unchanged; hostile ext values are bounded', () => {
  const s = world(2),
    [a] = s.members;
  s.act(a, { kind: 'plant', plot: 0, crop: 'carrot' }, T0);
  const legacy = JSON.parse(JSON.stringify(s.life));
  delete legacy.ext;
  assert.deepEqual(readLife(legacy), legacy);
  assert.equal('ext' in readLife(legacy), false);
  const hostile = {
    ...legacy,
    ext: {
      [a.id]: {
        plots: 99,
        inv: { crucian: 5, nope: 3, __proto__: 1, bait: -4 },
        furn: { 'furn-chair': 2, bed: 1 },
        dex: ['crucian', 'x', 'crucian'],
        stats: { fish: 3, bogus: 9 },
        ach: ['fish-1', 'nope'],
        rod: 7,
        pending: { token: 'abc', spot: 'river', castAt: 1, biteAt: 2, windowMs: 3, expiresAt: 4, fish: 'nope', cm: 1 },
      },
      'not-a-uuid': { inv: { crucian: 1 } },
    },
    museum: { crucian: { actor: 0, at: 1 }, wood: { actor: 1, at: 1 }, bogus: { actor: 0 } },
    flags: ['bridge', 'moon'],
    bonds: { '0-1': 50, '1-0': 5, '0-9': 1 },
    memories: Array.from({ length: 200 }, (_, i) => ({ id: 'mem-' + i, kind: 'bond', actors: [0], text: 'x', at: i })),
  };
  const back = readLife(hostile);
  assert.deepEqual(back.ext[a.id].inv, { crucian: 5 });
  assert.deepEqual(back.ext[a.id].furn, { 'furn-chair': 2 });
  assert.deepEqual(back.ext[a.id].dex, ['crucian']);
  assert.deepEqual(back.ext[a.id].stats, { fish: 3 });
  assert.deepEqual(back.ext[a.id].ach, ['fish-1']);
  assert.equal(back.ext[a.id].plots, undefined);
  assert.equal(back.ext[a.id].rod, undefined);
  assert.equal(back.ext[a.id].pending, undefined);
  assert.equal(Object.keys(back.ext).length, 1);
  assert.deepEqual(Object.keys(back.museum), ['crucian']);
  assert.deepEqual(back.flags, ['bridge']);
  assert.deepEqual(back.bonds, { '0-1': 50 });
  assert.equal(back.memories.length, 60);
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(back))), back);
  // Every new action kind is a life action (goes through the life path).
  for (const kind of PLUS_ACTION_KINDS) assert.ok(isLifeAction({ kind }), kind);
});

test('cloud: new actions and room visits flow through cloudTransition with the ledger invariant', async () => {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const members = [0, 1].map((actor) => ({
    id: uuid(),
    actor,
    username: ACCOUNT_IDS[actor],
    connection: uuid(),
    sequence: 0,
    epoch: 0,
    code: '',
  }));
  const run = async (p, op, extra = {}) => {
    const command = {
      op,
      connection: p.connection,
      ...(p.code ? { code: p.code } : {}),
      ...(!['read', 'wallet'].includes(op) ? { requestId: uuid(), sequence: ++p.sequence } : {}),
      ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
      ...extra,
    };
    const r = cloudTransition(world, p, command, await commandHash(command), T0);
    world = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    invariant(world.ledger);
    return r.response;
  };
  const [a, b] = members;
  await run(a, 'open');
  b.code = a.code;
  await run(b, 'join');
  const bought = await run(a, 'action', { action: { kind: 'buyItem', item: 'bait', n: 2 } });
  assert.equal(bought.ok, true, bought.error);
  assert.equal(bought.life.me.inv.bait, 2);
  assert.equal(bought.life.me.fishing.bait, 2);
  assert.equal(bought.life.calendar.season, 'autumn');
  assert.ok(bought.life.shop.items.length >= 6);
  assert.equal(bought.life.bundles.length, BUNDLES.length);
  const visit = await run(b, 'action', { action: { kind: 'area', area: 'home', home: 0 } });
  assert.equal(visit.ok, true, visit.error);
  assert.equal(visit.life.me.bonds.find((x) => x.actor === 0).points, BOND_POINTS.visit);
  assert.equal(visit.life.me.stats.visit, 1);
  const bad = await run(a, 'action', { action: { kind: 'reel', token: 'nope', timingMs: 1 } });
  assert.equal(bad.ok, false);
  assert.equal(bad.error, PLUS_REJECT.token);
});

// ------------------------------------------------------------ one simulated year
test('one simulated year, 7 players: world size bounded and the ledger invariant holds', () => {
  const s = world(7),
    start = kst(2026, 9, 7, 7),
    days = Number(process.env.LIFE_SIM_DAYS ?? 365);
  let ok = 0,
    rejected = 0;
  // Raw act (the daily invariant check below covers the ledger).
  const act = (m, action, t) => {
    try {
      const r = lifeAction(s.life, s.ledger, m, action, t);
      s.life = r.life;
      s.ledger = r.ledger;
      ok++;
      return true;
    } catch (e) {
      if (!(e instanceof LifeError)) throw e;
      rejected++;
      return false;
    }
  };
  const have = (v, id) =>
    CROPS.includes(id) ? v.me.bag.produce[id] : id === 'fruit' ? v.me.bag.fruit : (v.me.inv[id] ?? 0);
  const order = ['watermelon', 'cabbage', 'sweetpotato', 'corn', 'spinach', 'potato', 'strawberry'];
  for (let d = 0; d < days; d++) {
    const morning = start + d * DAY,
      evening = morning + 12 * HOUR;
    for (const m of s.members) {
      s.ledger = claimDailyGrant(s.ledger, 'wallet-' + m.id, morning);
      let v = lifeView(s.life, m.id, m.actor, morning);
      if (v.me.farm.some((p) => p.ready)) act(m, { kind: 'harvest', plot: -1 }, morning);
      const crop = order.find((c) => !CROP_INFO[c].seasons || CROP_INFO[c].seasons.includes(v.calendar.season)),
        empty = v.me.farm.filter((p) => !p.crop || p.ready).length;
      if (empty) {
        act(m, { kind: 'buy', item: 'seed-' + crop, n: Math.min(20, empty) }, morning);
        act(m, { kind: 'plant', plot: -1, crop }, morning);
      }
      v = lifeView(s.life, m.id, m.actor, morning);
      if (v.me.farm.some((p) => p.crop && p.wateredAt === null && !p.rained && !p.ready))
        act(m, { kind: 'water', plot: -1 }, morning);
      if ((v.me.inv.fertilizer ?? 0) > 0 && v.me.farm.some((p) => p.crop && !p.fert && !p.ready))
        act(m, { kind: 'fertilize', plot: -1, item: 'fertilizer' }, morning);
      for (const sp of v.me.spawns.filter((x) => !x.taken).slice(0, 4))
        act(m, { kind: sp.kind === 'forage' ? 'forage' : 'catch', spot: sp.spot }, morning);
      for (let i = 0; i < 2; i++) {
        const t = morning + HOUR + i * MIN;
        const spot = v.flags.includes('bridge') && i ? 'sea' : i ? 'pond' : 'river';
        if (act(m, { kind: 'cast', spot }, t)) {
          const p = s.life.ext[m.id].pending;
          act(m, { kind: 'reel', token: p.token, timingMs: 100 }, p.biteAt + 100);
        }
      }
      const friend = (m.actor + 1) % 7,
        friendUid = s.members[friend].id;
      if (v.housesPlotsPublic[friendUid]?.some((p) => p.needsWater))
        act(m, { kind: 'waterFriend', owner: friend, plot: -1 }, morning + 2 * HOUR);
      for (const r of v.me.requests)
        if (!r.done && have(v, r.item) >= r.n) act(m, { kind: 'deliver', to: r.from }, morning + 2 * HOUR);
      for (const e of v.calendar.events)
        if (e.claim && !v.me.claimed.includes(e.id) && (e.kind !== 'birthday' || e.actor === m.actor))
          act(m, { kind: 'claimEvent', event: e.id }, morning + 2 * HOUR);
      if (v.flags.includes('fountain') && !v.me.wished) act(m, { kind: 'wish' }, morning + 2 * HOUR);
      const fish = Object.keys(v.me.inv).find((id) => ITEM_BY_ID[id].kind === 'fish');
      if (!v.me.ate && fish && (v.me.inv.wood ?? 0) > 0) {
        act(m, { kind: 'cook', recipe: 'grilledfish' }, morning + 2 * HOUR);
        act(m, { kind: 'eat', item: 'grilledfish' }, morning + 2 * HOUR);
      }
      // Evening: harvest, donate, contribute, sell, gift, craft, shop.
      act(m, { kind: 'harvest', plot: -1 }, evening);
      let ev = lifeView(s.life, m.id, m.actor, evening);
      for (const id of Object.keys(ev.me.inv).filter((id) => ITEM_BY_ID[id].museum && !ev.museum[id]).slice(0, 2))
        act(m, { kind: 'donate', item: id }, evening);
      for (const c of CROPS.filter((c) => ev.me.bag.produce[c] > 0 && !ev.museum[c]).slice(0, 1))
        act(m, { kind: 'donate', item: c }, evening);
      ev = lifeView(s.life, m.id, m.actor, evening);
      for (const b of ev.bundles.filter((x) => !x.done))
        BUNDLES.find((x) => x.id === b.id).slots.forEach(({ n: need_n, ...need }, i) => {
          const slot = { need, n: need_n, got: b.got[i] };
          if (slot.got >= slot.n) return;
          if ('beom' in slot.need) {
            if (s.balance(m) > 80_000)
              act(m, { kind: 'contribute', bundle: b.id, slot: i, n: 10_000 }, evening);
            return;
          }
          const n =
            'item' in slot.need
              ? slot.need.q
                ? slot.need.q === 1
                  ? (ev.me.quality.silver[slot.need.item] ?? 0) + (ev.me.quality.gold[slot.need.item] ?? 0)
                  : (ev.me.quality.gold[slot.need.item] ?? 0)
                : have(ev, slot.need.item)
              : 0;
          if (n > 0) act(m, { kind: 'contribute', bundle: b.id, slot: i, n: Math.min(n, slot.n - slot.got) }, evening);
        });
      ev = lifeView(s.life, m.id, m.actor, evening);
      const keep = new Set(['wood', 'pinecone', 'stone', 'shell']);
      for (const [id, n] of Object.entries(ev.me.inv))
        if (ITEM_BY_ID[id].sell > 0 && !keep.has(id) && n > 3) act(m, { kind: 'sellItem', item: id, n: n - 3 }, evening);
      for (const c of CROPS) {
        const left = sellCapLeft(s.life, m.id, evening),
          n = Math.min(ev.me.bag.produce[c] - 6, Math.floor(left / (CROP_INFO[c].sell * 1.5)));
        if (n > 0) act(m, { kind: 'sell', crop: c, n }, evening);
      }
      if (d % 5 === m.actor % 5) {
        const gift = Object.keys(ev.me.inv).find((id) => ITEM_BY_ID[id].kind !== 'tool');
        if (gift)
          act(m, { kind: 'mail', to: (m.actor + 2) % 7, text: '선물!', gift: { kind: 'item', item: gift, n: 1 } }, evening + m.actor * 5_000);
      }
      if ((ev.me.inv.wood ?? 0) > 1 && (ev.me.inv.pinecone ?? 0) > 0) act(m, { kind: 'craft', recipe: 'fertilizer' }, evening);
      if (d % 30 === 10) {
        if (s.balance(m) > FARM_EXPAND_PRICE[9] + 50_000) act(m, { kind: 'expandFarm' }, evening);
        if (s.balance(m) > ROD_PRICE[2] + 50_000) act(m, { kind: 'upgradeRod' }, evening);
        const stock = ev.shop.items[m.actor % ev.shop.items.length];
        if (s.balance(m) > stock.price + 50_000) act(m, { kind: 'buyFurniture', ref: stock.ref }, evening);
      }
      if (d % 7 === m.actor) s.life = recordVisit(s.life, m, (m.actor + 3) % 7, evening);
    }
    const r = recordTables(
      s.life,
      s.ledger,
      [{ id: 'sim-' + d, wallets: s.members.slice(0, 4).map((m) => 'wallet-' + m.id) }],
      start + d * DAY + 13 * HOUR, // 20:00 KST: Fridays are casino nights
    );
    s.life = r.life;
    s.ledger = r.ledger;
    invariant(s.ledger);
  }
  const end = start + days * DAY;
  // Receipts: the cloud keeps ≤ 512 per member (≈ what a busy year leaves).
  const receipts = Object.fromEntries(
    s.members.map((m) => [
      m.id,
      Array.from({ length: 512 }, () => ({ id: uuid(), hash: 'f'.repeat(64), code: 'ABCDEFGHJK', ok: true, error: '' })),
    ]),
  );
  const cloud = { schema: 1, ledger: s.ledger, rooms: {}, receipts, life: s.life },
    worldBytes = Buffer.byteLength(JSON.stringify(cloud)),
    lifeBytes = Buffer.byteLength(JSON.stringify(s.life)),
    ledgerBytes = Buffer.byteLength(JSON.stringify(s.ledger)),
    viewBytes = Buffer.byteLength(JSON.stringify(lifeView(s.life, s.members[0].id, 0, end)));
  const balances = s.members.map((m) => s.balance(m));
  const report = {
    actions: ok,
    rejected,
    worldBytes,
    lifeBytes,
    ledgerBytes,
    viewBytes,
    granted: s.ledger.granted,
    spent: s.ledger.spent,
    money: balances.reduce((x, y) => x + y, 0),
    balances,
    flags: s.life.flags ?? [],
    museum: Object.keys(s.life.museum ?? {}).length,
    memories: s.life.memories?.length ?? 0,
  };
  console.log('# life year report', JSON.stringify(report));
  if (process.env.LIFE_SIM_DUMP) {
    const sizes = Object.fromEntries(Object.entries(s.life).map(([k, v]) => [k, JSON.stringify(v).length]));
    console.log('# life parts', JSON.stringify(sizes));
  }
  assert.ok(worldBytes < 6 * 1024 * 1024, 'world under 6MB');
  assert.ok(lifeBytes < 400 * 1024, `life ${lifeBytes} bytes`);
  assert.ok(viewBytes < 64 * 1024, `view ${viewBytes} bytes`);
  assert.ok((s.life.flags ?? []).length >= 2, 'some bundles completed');
  assert.ok(report.spent > 0);
  const back = readLife(JSON.parse(JSON.stringify(s.life)));
  for (const key of Object.keys(s.life)) assert.deepEqual(back[key], s.life[key], key);
  assert.deepEqual(back, s.life);
});

// ------------------------------------------------------------ VILL-2 fishing spots
test('VILL-2 spots: falls need rod 2, the harbor opens at night, personal bests are kept', () => {
  const s = world(1),
    [m] = s.members;
  // 폭포 소: strong water.
  s.fails(m, { kind: 'cast', spot: 'falls' }, T0, PLUS_REJECT.spotRod);
  s.act(m, { kind: 'upgradeRod' }, T0);
  s.act(m, { kind: 'cast', spot: 'falls' }, T0 + MIN);
  let p = s.view(m, T0 + MIN).me.fishing.pending;
  s.act(m, { kind: 'reel', token: p.token, timingMs: 100 }, p.biteAt + 100);
  let last = s.view(m, p.biteAt + 100).me.fishing.last;
  assert.equal(last.ok, true);
  assert.ok(FISH_BY_ID[last.fish].spots.includes('falls'));
  assert.equal(last.best, true);
  assert.equal(s.view(m, p.biteAt + 100).me.fishing.best[last.fish], last.cm);
  // 밤 항구: closed at noon, open at 21:00 KST with night fish.
  s.fails(m, { kind: 'cast', spot: 'harbor' }, T0 + 2 * MIN, PLUS_REJECT.spotNight);
  const night = kst(2026, 9, 24, 21);
  s.act(m, { kind: 'cast', spot: 'harbor' }, night);
  p = s.view(m, night).me.fishing.pending;
  s.act(m, { kind: 'reel', token: p.token, timingMs: 100 }, p.biteAt + 100);
  last = s.view(m, p.biteAt + 100).me.fishing.last;
  assert.ok(FISH_BY_ID[last.fish].spots.includes('harbor'));
  // The other new waters are open to everyone.
  for (const spot of ['rapids', 'lake', 'rocks', 'bridge']) {
    const t = night + HOUR * (1 + ['rapids', 'lake', 'rocks', 'bridge'].indexOf(spot));
    s.act(m, { kind: 'cast', spot }, t);
    p = s.view(m, t).me.fishing.pending;
    s.act(m, { kind: 'reel', token: p.token, timingMs: 50 }, p.biteAt + 50);
    last = s.view(m, p.biteAt + 50).me.fishing.last;
    assert.ok(FISH_BY_ID[last.fish].spots.includes(spot), `${spot} → ${last.fish}`);
  }
  // A smaller catch of the same fish keeps the old best (no 'best' flag).
  s.act(m, { kind: 'cast', spot: 'bridge' }, night + 9 * HOUR);
  p = s.view(m, night + 9 * HOUR).me.fishing.pending;
  const fishId = s.life.ext[m.id].pending.fish;
  (s.life.ext[m.id].best ??= {})[fishId] = 999;
  s.act(m, { kind: 'reel', token: p.token, timingMs: 50 }, p.biteAt + 50);
  assert.equal(s.view(m, p.biteAt + 50).me.fishing.last.best, undefined);
  assert.equal(s.view(m, p.biteAt + 50).me.fishing.best[fishId], 999);
  // Bests survive the strict reader.
  assert.equal(readLife(JSON.parse(JSON.stringify(s.life))).ext[m.id].best[fishId], 999);
});
