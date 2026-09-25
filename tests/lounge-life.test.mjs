import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CROP_INFO,
  CROPS,
  FRUIT_COOLDOWN_MS,
  FRUIT_TREES,
  GUESTBOOK_MAX,
  LIFE_REJECT,
  LifeError,
  MAIL_MAX,
  PLOTS_PER_USER,
  SELL_CAP_PER_DAY,
  SHOP,
  TEXT_COOLDOWN_MS,
  emptyLife,
  ensureLifeMember,
  friendLife,
  lifeAction,
  lifeView,
  plotReadyAt,
  plotStage,
  readLife,
} from '../app/lounge-life.ts';
import {
  INITIAL_BEOM,
  kstDay,
  newLoungeLedger,
  registerWallet,
  validateLedger,
} from '../app/lounge-economy.ts';
import {
  DEMAND_FLOOR,
  MARKET_HALF,
  MARKET_SOFT,
  demandMult,
  marketMult,
  sellQuote,
  sellUnit,
} from '../app/lounge-life-plus.ts';

const uuid = () => crypto.randomUUID();
const T0 = Date.UTC(2026, 8, 24, 3, 0, 0); // 12:00 KST
const MIN = 60_000;

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
    return r;
  };
  s.fails = (m, action, now, message) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || e.message === message),
    );
  s.balance = (m) => s.ledger.accounts['wallet-' + m.id];
  return s;
}
/** sum(balances) + reserved + house − granted = accounts × 100,000 */
function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  assert.equal(
    balances + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0),
    Object.keys(ledger.accounts).length * INITIAL_BEOM,
  );
}

test('new members start with 3 carrot + 2 tomato seeds and six empty plots', () => {
  const { members, life } = world(1);
  const v = lifeView(life, members[0].id, 0, T0);
  assert.equal(v.me.farm.length, PLOTS_PER_USER);
  assert.ok(v.me.farm.every((p) => p.crop === null && p.stage === 0));
  assert.deepEqual(v.me.bag.seeds, {
    carrot: 3,
    tomato: 2,
    pumpkin: 0,
    strawberry: 0,
    potato: 0,
    spinach: 0,
    corn: 0,
    watermelon: 0,
    sweetpotato: 0,
    cabbage: 0,
  });
  assert.equal(v.sellCapLeft, SELL_CAP_PER_DAY);
  assert.equal(v.actors[members[0].id], 0);
});

test('growth timing: stages, readiness and the 40% watering speed-up', () => {
  const s = world(1),
    [m] = s.members;
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' }, T0);
  s.act(m, { kind: 'plant', plot: 1, crop: 'carrot' }, T0);
  const grow = CROP_INFO.carrot.growMs;
  assert.equal(grow, 30 * MIN);
  const [p0] = s.life.farms[m.id];
  assert.equal(plotReadyAt(p0), T0 + grow);
  assert.equal(plotStage(p0, T0), 0);
  assert.equal(plotStage(p0, T0 + grow / 3), 1);
  assert.equal(plotStage(p0, T0 + (2 * grow) / 3), 2);
  assert.equal(plotStage(p0, T0 + grow - 1), 2);
  assert.equal(plotStage(p0, T0 + grow), 3);
  // Watering right after planting: 30 min → 18 min.
  s.act(m, { kind: 'water', plot: 1 }, T0);
  assert.equal(plotReadyAt(s.life.farms[m.id][1]), T0 + 18 * MIN);
  s.fails(m, { kind: 'water', plot: 1 }, T0 + MIN, LIFE_REJECT.watered);
  // Watering halfway: remaining 15 min → 9 min.
  s.act(m, { kind: 'water', plot: 0 }, T0 + 15 * MIN);
  assert.equal(plotReadyAt(s.life.farms[m.id][0]), T0 + 24 * MIN);
  s.fails(m, { kind: 'harvest', plot: 0 }, T0 + 23 * MIN, LIFE_REJECT.notReady);
  s.fails(m, { kind: 'water', plot: 2 }, T0, LIFE_REJECT.empty);
  s.fails(m, { kind: 'plant', plot: 0, crop: 'carrot' }, T0, LIFE_REJECT.occupied);
  s.fails(m, { kind: 'plant', plot: 6, crop: 'carrot' }, T0, LIFE_REJECT.plot);
  s.fails(m, { kind: 'plant', plot: 2, crop: 'pumpkin' }, T0, LIFE_REJECT.noSeed);
  s.fails(m, { kind: 'plant', plot: 2, crop: 'banana' }, T0);
  const view = lifeView(s.life, m.id, 0, T0 + 18 * MIN);
  assert.equal(view.me.farm[1].ready, true);
  assert.equal(view.me.farm[0].ready, false);
  assert.equal(view.housesPlotsPublic[m.id][1].stage, 3);
});

test('harvest one plot or every ready plot (-1)', () => {
  const s = world(1),
    [m] = s.members;
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' }, T0);
  s.act(m, { kind: 'plant', plot: 1, crop: 'carrot' }, T0);
  s.act(m, { kind: 'plant', plot: 2, crop: 'tomato' }, T0);
  s.fails(m, { kind: 'harvest', plot: -1 }, T0 + MIN, LIFE_REJECT.nothingReady);
  s.act(m, { kind: 'harvest', plot: 0 }, T0 + 30 * MIN);
  assert.equal(s.life.bag[m.id].produce.carrot, 1);
  assert.equal(s.life.farms[m.id][0].crop, null);
  s.act(m, { kind: 'harvest', plot: -1 }, T0 + 30 * MIN);
  assert.equal(s.life.bag[m.id].produce.carrot, 2);
  assert.equal(s.life.farms[m.id][2].crop, 'tomato'); // still growing
  s.act(m, { kind: 'harvest', plot: -1 }, T0 + 60 * MIN);
  // bag.produce counts every quality (silver/gold are a subset in me.quality).
  assert.equal(s.life.bag[m.id].produce.tomato, 1);
  s.fails(m, { kind: 'harvest', plot: 2 }, T0 + 61 * MIN, LIFE_REJECT.empty);
  // Lifetime counters feed the trophy milestones.
  assert.deepEqual(lifeView(s.life, m.id, 0, T0 + 61 * MIN).me.harvested, { carrot: 2, tomato: 1 });
});

test('plant and water every plot in one request (plot -1)', () => {
  const s = world(1),
    [m] = s.members;
  s.life.bag[m.id].seeds.carrot = 4;
  s.act(m, { kind: 'plant', plot: 1, crop: 'tomato' }, T0);
  // Five empty plots, four carrot seeds: four are planted, one stays empty.
  s.act(m, { kind: 'plant', plot: -1, crop: 'carrot' }, T0 + 1);
  const farm = s.life.farms[m.id];
  assert.deepEqual(farm.map((p) => p.crop), ['carrot', 'tomato', 'carrot', 'carrot', 'carrot', null]);
  assert.equal(s.life.bag[m.id].seeds.carrot, 0);
  s.fails(m, { kind: 'plant', plot: -1, crop: 'carrot' }, T0 + 2, LIFE_REJECT.noSeed);
  s.fails(m, { kind: 'plant', plot: -1, crop: 'gold' }, T0 + 2, LIFE_REJECT.invalid);
  s.act(m, { kind: 'water', plot: 1 }, T0 + 2);
  s.act(m, { kind: 'water', plot: -1 }, T0 + 3);
  assert.ok(s.life.farms[m.id].every((p) => !p.crop || p.wateredAt !== null));
  assert.equal(s.life.farms[m.id][1].wateredAt, T0 + 2); // not re-watered
  s.fails(m, { kind: 'water', plot: -1 }, T0 + 4, LIFE_REJECT.nothingToWater);
  s.life.bag[m.id].seeds.pumpkin = 1;
  s.act(m, { kind: 'plant', plot: -1, crop: 'pumpkin' }, T0 + 5);
  s.fails(m, { kind: 'plant', plot: -1, crop: 'tomato' }, T0 + 6, LIFE_REJECT.noEmpty);
});

test('fruit trees give 1–3 fruit once per 6 hours per user', () => {
  const s = world(2),
    [a, b] = s.members;
  s.act(a, { kind: 'pick', tree: FRUIT_TREES[0] }, T0);
  const got = s.life.bag[a.id].fruit;
  assert.ok(got >= 1 && got <= 3);
  s.fails(a, { kind: 'pick', tree: FRUIT_TREES[0] }, T0 + FRUIT_COOLDOWN_MS - 1, LIFE_REJECT.treeWait);
  s.act(b, { kind: 'pick', tree: FRUIT_TREES[0] }, T0 + 1); // per user
  s.act(a, { kind: 'pick', tree: FRUIT_TREES[1] }, T0 + 2); // per tree
  s.act(a, { kind: 'pick', tree: FRUIT_TREES[0] }, T0 + FRUIT_COOLDOWN_MS);
  s.fails(a, { kind: 'pick', tree: 'tree-99' }, T0, LIFE_REJECT.tree);
  const v = lifeView(s.life, a.id, 0, T0 + FRUIT_COOLDOWN_MS);
  assert.equal(v.me.fruitReadyAt[FRUIT_TREES[0]], T0 + 2 * FRUIT_COOLDOWN_MS);
  assert.equal(v.me.fruitReadyAt[FRUIT_TREES[2]], 0);
});

test('selling grants 범 through the ledger; demand curves per crop recover at KST midnight', () => {
  const s = world(1),
    [m] = s.members;
  s.life.bag[m.id].produce.strawberry = 30;
  s.life.bag[m.id].produce.carrot = 10;
  s.life.bag[m.id].fruit = 5;
  s.act(m, { kind: 'sell', crop: 'fruit', n: 2 }, T0);
  // Fruit sags slowly (half-life 20): 150 + round(150 × 0.5^(1/20)).
  assert.equal(s.balance(m), INITIAL_BEOM + 150 + Math.round(150 * 0.5 ** (1 / 20)));
  assert.equal(s.ledger.entries.at(-1).type, 'grant');
  s.fails(m, { kind: 'sell', crop: 'fruit', n: 4 }, T0, LIFE_REJECT.notEnough);
  s.fails(m, { kind: 'sell', crop: 'fruit', n: 0 }, T0);
  s.fails(m, { kind: 'sell', crop: 'fruit', n: 1.5 }, T0);
  // Strawberries: each one sold today pays less (half-life 4).
  const one = (k) => Math.round(4_500 * demandMult('strawberry', k));
  let before = s.balance(m);
  s.act(m, { kind: 'sell', crop: 'strawberry', n: 4 }, T0);
  assert.equal(s.balance(m) - before, one(0) + one(1) + one(2) + one(3));
  assert.equal(one(4), 2_250);
  before = s.balance(m);
  s.act(m, { kind: 'sell', crop: 'strawberry', n: 1 }, T0 + 1);
  assert.equal(s.balance(m) - before, 2_250);
  // Another crop has its own demand: the first carrot is full price.
  before = s.balance(m);
  s.act(m, { kind: 'sell', crop: 'carrot', n: 1 }, T0 + 2);
  assert.equal(s.balance(m) - before, CROP_INFO.carrot.sell);
  // Flooding one crop bottoms out at DEMAND_FLOOR (below the seed price).
  before = s.balance(m);
  s.act(m, { kind: 'sell', crop: 'strawberry', n: 20 }, T0 + 3);
  const tail = s.balance(m) - before;
  assert.ok(tail < 20 * 4_500 * 0.4, String(tail));
  assert.equal(Math.round(4_500 * demandMult('strawberry', 40)), Math.round(4_500 * DEMAND_FLOOR));
  assert.ok(4_500 * DEMAND_FLOOR < CROP_INFO.strawberry.seed);
  const v = lifeView(s.life, m.id, 0, T0 + 3);
  assert.equal(v.me.demand.strawberry, 25);
  assert.equal(v.soldToday, SELL_CAP_PER_DAY - v.sellCapLeft);
  // Next KST day (00:00 KST = 15:00 UTC) demand and the ceiling reset.
  const tomorrow = Date.UTC(2026, 8, 24, 15, 0, 0);
  assert.equal(lifeView(s.life, m.id, 0, tomorrow).sellCapLeft, SELL_CAP_PER_DAY);
  assert.deepEqual(lifeView(s.life, m.id, 0, tomorrow).me.demand, {});
  before = s.balance(m);
  s.act(m, { kind: 'sell', crop: 'strawberry', n: 1 }, tomorrow);
  assert.equal(s.balance(m) - before, 4_500);
  invariant(s.ledger);
});

test('market saturation tapers very long selling days; the safety ceiling still holds', () => {
  assert.equal(marketMult(MARKET_SOFT), 1);
  assert.equal(marketMult(MARKET_SOFT + MARKET_HALF), 0.5);
  // Quote helper = what the server pays.
  const s = world(1),
    [m] = s.members;
  s.life.ext = { [m.id]: { inv: { carp: 50, crucian: 50, koi: 20 } } };
  const view = () => lifeView(s.life, m.id, 0, T0);
  const q = sellQuote(view(), 'koi', 0, 20, T0);
  const before = s.balance(m);
  s.act(m, { kind: 'sellItem', item: 'koi', n: 20 }, T0);
  assert.equal(s.balance(m) - before, q.total);
  // Rare fish sag fast (half-life 2): the 3rd koi pays half.
  assert.equal(view().me.demand.koi, 20);
  assert.equal(
    sellQuote(view(), 'koi', 0, 1, T0).next,
    Math.round(sellUnit('koi', 0, T0) * DEMAND_FLOOR * marketMult(view().soldToday)),
  );
  // Past MARKET_SOFT범 everything tapers.
  s.life.sold[m.id] = { day: kstDay(T0), amount: MARKET_SOFT + MARKET_HALF };
  const carp = sellQuote(view(), 'carp', 0, 1, T0);
  assert.equal(carp.next, Math.round(sellUnit('carp', 0, T0) * 0.5));
  s.life.sold[m.id] = { day: kstDay(T0), amount: SELL_CAP_PER_DAY - 100 };
  s.fails(m, { kind: 'sellItem', item: 'carp', n: 50 }, T0);
  invariant(s.ledger);
});

test('buying spends through the ledger; unlocks are idempotent, seeds stack', () => {
  const s = world(1),
    [m] = s.members;
  s.act(m, { kind: 'buy', item: 'seed-pumpkin', n: 3 }, T0);
  assert.equal(s.life.bag[m.id].seeds.pumpkin, 3);
  assert.equal(s.balance(m), INITIAL_BEOM - 1_500);
  // Bundles: six seeds at 10% off, stackable.
  s.act(m, { kind: 'buy', item: 'bundle-pumpkin', n: 2 }, T0);
  assert.equal(s.life.bag[m.id].seeds.pumpkin, 15);
  assert.equal(s.balance(m), INITIAL_BEOM - 1_500 - 2 * 2_700);
  // Palette tiers: neon needs pastel first.
  s.fails(m, { kind: 'buy', item: 'palette-neon' }, T0 + 1, LIFE_REJECT.locked);
  s.act(m, { kind: 'buy', item: 'palette-pastel' }, T0 + 1);
  assert.deepEqual(s.life.unlocks[m.id], ['palette-pastel']);
  const before = s.balance(m);
  s.fails(m, { kind: 'buy', item: 'palette-pastel' }, T0 + 2, LIFE_REJECT.owned);
  assert.equal(s.balance(m), before);
  s.fails(m, { kind: 'buy', item: 'palette-neon', n: 2 }, T0 + 2);
  s.fails(m, { kind: 'buy', item: 'rocket' }, T0 + 2, LIFE_REJECT.item);
  s.fails(m, { kind: 'buy', item: 'seed-carrot', n: 21 }, T0 + 2);
  // Trophies need a harvest milestone as well as 범.
  s.fails(m, { kind: 'buy', item: 'trophy-carrot' }, T0 + 3, LIFE_REJECT.locked);
  s.life.harvested = { [m.id]: { carrot: 29 } };
  s.fails(m, { kind: 'buy', item: 'trophy-carrot' }, T0 + 3, LIFE_REJECT.locked);
  s.life.harvested[m.id].carrot = 30;
  s.act(m, { kind: 'buy', item: 'trophy-carrot' }, T0 + 3);
  assert.equal(s.balance(m), before - 20_000);
  s.act(m, { kind: 'buy', item: 'seed-strawberry', n: 20 }, T0 + 11);
  assert.equal(s.balance(m), before - 40_000);
  // Not enough money: rejected without any change.
  const snapshot = JSON.stringify(s.life);
  s.fails(m, { kind: 'buy', item: 'palette-neon' }, T0 + 12, LIFE_REJECT.balance);
  assert.equal(JSON.stringify(s.life), snapshot);
  assert.equal(s.balance(m), before - 40_000);
  invariant(s.ledger);
});

test('ledger invariant holds after many mixed life operations', () => {
  const s = world(3);
  let now = T0;
  for (let round = 0; round < 40; round++) {
    for (const m of s.members) {
      now += 7 * MIN;
      const tries = [
        { kind: 'buy', item: 'seed-carrot', n: 2 },
        { kind: 'plant', plot: round % PLOTS_PER_USER, crop: 'carrot' },
        { kind: 'water', plot: round % PLOTS_PER_USER },
        { kind: 'harvest', plot: -1 },
        { kind: 'pick', tree: FRUIT_TREES[round % FRUIT_TREES.length] },
        { kind: 'sell', crop: 'carrot', n: 1 },
        { kind: 'sell', crop: 'fruit', n: 1 },
      ];
      for (const a of tries) {
        try {
          s.act(m, a, now);
        } catch (e) {
          assert.ok(e instanceof LifeError, String(e));
        }
      }
    }
    invariant(s.ledger);
  }
  const grants = s.ledger.entries.filter((e) => e.type === 'grant').length;
  assert.ok(grants > 0);
  assert.equal(new Set(s.ledger.entries.map((e) => e.id)).size, s.ledger.entries.length);
});

test('mail moves gifts between bags, tracks unread and rejects bad gifts', () => {
  const s = world(2),
    [a, b] = s.members;
  s.life.bag[a.id].produce.tomato = 4;
  s.life.bag[a.id].fruit = 2;
  s.act(a, { kind: 'mail', to: 1, text: '토마토 먹어!', gift: { kind: 'produce', crop: 'tomato', n: 3 } }, T0);
  assert.equal(s.life.bag[a.id].produce.tomato, 1);
  assert.equal(s.life.bag[b.id].produce.tomato, 3);
  s.act(a, { kind: 'mail', to: b.id, text: '', sticker: 'love', gift: { kind: 'fruit', n: 2 } }, T0 + TEXT_COOLDOWN_MS);
  assert.equal(s.life.bag[b.id].fruit, 2);
  assert.equal(s.life.bag[a.id].fruit, 0);
  s.fails(a, { kind: 'mail', to: 1, text: 'x', gift: { kind: 'fruit', n: 1 } }, T0 + 2 * TEXT_COOLDOWN_MS, LIFE_REJECT.notEnough);
  s.fails(a, { kind: 'mail', to: 1, text: 'x', gift: { kind: 'produce', crop: 'gold', n: 1 } }, T0 + 2 * TEXT_COOLDOWN_MS, LIFE_REJECT.gift);
  s.fails(a, { kind: 'mail', to: 0, text: 'me' }, T0 + 2 * TEXT_COOLDOWN_MS, LIFE_REJECT.self);
  s.fails(a, { kind: 'mail', to: 5, text: 'hi' }, T0 + 2 * TEXT_COOLDOWN_MS, LIFE_REJECT.friend);
  const v = lifeView(s.life, b.id, 1, T0 + 10_000);
  assert.equal(v.me.mailUnread, 2);
  assert.equal(v.me.mail[0].actor, 0);
  s.act(b, { kind: 'readMail', id: v.me.mail[0].id }, T0 + 10_000);
  assert.equal(lifeView(s.life, b.id, 1, T0).me.mailUnread, 1);
  s.act(b, { kind: 'readMail', id: 'all' }, T0 + 10_001);
  assert.equal(lifeView(s.life, b.id, 1, T0).me.mailUnread, 0);
  s.fails(b, { kind: 'readMail', id: 'nope' }, T0, LIFE_REJECT.mail);
  // Mailbox is bounded.
  for (let i = 0; i < MAIL_MAX + 5; i++)
    s.act(a, { kind: 'mail', to: 1, text: '편지 ' + i }, T0 + 100_000 + i * TEXT_COOLDOWN_MS);
  assert.equal(s.life.mail[b.id].length, MAIL_MAX);
  assert.equal(s.life.mail[b.id].at(-1).text, '편지 ' + (MAIL_MAX + 4));
});

test('guestbook and status: trimmed, bounded, control characters and rate limit rejected', () => {
  const s = world(2),
    [a, b] = s.members;
  s.act(a, { kind: 'guestbook', owner: 1, text: '   놀러 왔어!  ' }, T0);
  assert.deepEqual(s.life.guestbook[b.id][0], { from: a.id, actor: 0, text: '놀러 왔어!', at: T0 });
  s.fails(a, { kind: 'guestbook', owner: 1, text: '또' }, T0 + 1000, LIFE_REJECT.textRate);
  s.fails(a, { kind: 'guestbook', owner: 1, text: '가'.repeat(81) }, T0 + 5000, LIFE_REJECT.textLong);
  s.fails(a, { kind: 'guestbook', owner: 1, text: '   ' }, T0 + 5000, LIFE_REJECT.text);
  s.fails(a, { kind: 'guestbook', owner: 1, text: 'a\u0007b' }, T0 + 5000, LIFE_REJECT.text);
  s.fails(a, { kind: 'guestbook', owner: 1, text: 'a‮b' }, T0 + 5000, LIFE_REJECT.text);
  s.fails(a, { kind: 'guestbook', owner: 1, text: 42 }, T0 + 5000, LIFE_REJECT.text);
  s.act(a, { kind: 'guestbook', owner: 1, text: '가'.repeat(80) }, T0 + 5000);
  for (let i = 0; i < GUESTBOOK_MAX + 3; i++)
    s.act(b, { kind: 'guestbook', owner: b.id, text: 'n' + i }, T0 + 10_000 + i * TEXT_COOLDOWN_MS);
  assert.equal(s.life.guestbook[b.id].length, GUESTBOOK_MAX);
  // Status
  s.act(a, { kind: 'status', text: '오늘은 낚시 🎣' }, T0 + 60_000);
  s.fails(a, { kind: 'status', text: '가'.repeat(41) }, T0 + 70_000, LIFE_REJECT.textLong);
  const v = lifeView(s.life, b.id, 1, T0 + 70_000);
  assert.deepEqual(v.statuses[a.id], { actor: 0, text: '오늘은 낚시 🎣', at: T0 + 60_000 });
  s.act(a, { kind: 'status', text: '' }, T0 + 70_000);
  assert.equal(lifeView(s.life, b.id, 1, T0).statuses[a.id], undefined);
  assert.equal(friendLife(s.life, 1).guestbook.length, GUESTBOOK_MAX);
});

test('readLife: old worlds load empty, hostile data is bounded and cleaned', () => {
  assert.deepEqual(readLife(undefined), emptyLife());
  assert.deepEqual(readLife(null), emptyLife());
  assert.deepEqual(readLife('junk'), emptyLife());
  const id = uuid();
  const hostile = {
    farms: { [id]: [{ crop: 'carrot', plantedAt: 5, wateredAt: 'x' }, { crop: 'gold' }], 'not-a-uuid': [] },
    bag: { [id]: { seeds: { carrot: -5, tomato: 1e20 }, produce: { pumpkin: 3 }, fruit: 2 } },
    unlocks: { [id]: ['palette-neon', 'palette-neon', 'hack'] },
    guestbook: { [id]: Array.from({ length: 100 }, (_, i) => ({ from: id, actor: 1, text: 'x' + i, at: i })) },
    mail: { [id]: [{ id: 'm1', from: id, actor: 9, text: 'bad actor' }, { id: 'm2', from: id, actor: 2, text: 'ok', gift: { kind: 'fruit', n: 1e9 } }] },
    status: { [id]: { text: 'y'.repeat(500), at: 1 } },
    actors: { [id]: 3 },
    seq: -1,
  };
  const life = readLife(hostile);
  assert.equal(Object.keys(life.farms).length, 1);
  assert.equal(life.farms[id].length, PLOTS_PER_USER);
  assert.deepEqual(life.farms[id][0], { crop: 'carrot', plantedAt: 5, wateredAt: 0 });
  assert.equal(life.farms[id][1].crop, null);
  assert.equal(life.bag[id].seeds.carrot, 0);
  assert.equal(life.bag[id].seeds.tomato, 0);
  assert.equal(life.bag[id].produce.pumpkin, 3);
  assert.deepEqual(life.unlocks[id], ['palette-neon']);
  assert.equal(life.guestbook[id].length, GUESTBOOK_MAX);
  assert.equal(life.mail[id].length, 1);
  assert.equal(life.mail[id][0].gift, undefined);
  assert.equal(life.status[id].text.length, 40);
  assert.equal(life.seq, 0);
  assert.ok(JSON.stringify(life).length < 20_000);
  // Round trip is stable.
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(life))), life);
});

test('crop and shop catalog match the contract', () => {
  assert.deepEqual(
    CROPS.map((c) => [c, CROP_INFO[c].growMs / MIN, CROP_INFO[c].seed, CROP_INFO[c].sell]),
    [
      ['carrot', 30, 100, 200],
      ['tomato', 60, 200, 480],
      ['pumpkin', 180, 500, 1800],
      ['strawberry', 480, 1000, 4500],
      ['potato', 120, 300, 900],
      ['spinach', 240, 600, 2200],
      ['corn', 360, 800, 2400],
      ['watermelon', 720, 2000, 8000],
      ['sweetpotato', 360, 700, 3000],
      ['cabbage', 480, 1000, 3600],
    ],
  );
  // Longer base crops earn more per hour (watered, all six plots), so the
  // "check in twice a day" rhythm beats clicking carrots all day.
  const perHour = CROPS.slice(0, 4).map(
    (c) => (6 * (CROP_INFO[c].sell - CROP_INFO[c].seed)) / ((CROP_INFO[c].growMs * 0.6) / 3_600_000),
  );
  for (let i = 1; i < perHour.length; i++) assert.ok(perHour[i] > perHour[i - 1], String(perHour));
  // ECON-2: one strawberry bed sold on one day pays less than 6 × the price
  // (demand curve), and the flat cap became a 100,000 safety ceiling.
  const bed = [0, 1, 2, 3, 4, 5].reduce((n, k) => n + Math.round(4_500 * demandMult('strawberry', k)), 0);
  assert.ok(bed < 6 * CROP_INFO.strawberry.sell && bed > 15_000, String(bed));
  assert.equal(SELL_CAP_PER_DAY, 100_000);
  // Every trophy has a harvest milestone and costs at least two table stakes.
  for (const id of ['trophy-carrot', 'trophy-tomato', 'trophy-pumpkin', 'trophy-strawberry', 'fruit-basket']) {
    const item = SHOP.find((i) => i.id === id);
    assert.ok(item.price >= 20_000 && item.requires.n >= 24, id);
  }
  assert.deepEqual(
    SHOP.filter((i) => i.kind === 'palette').map((i) => [i.id, i.price, i.after ?? null]),
    [
      ['palette-pastel', 30_000, null],
      ['palette-neon', 80_000, 'palette-pastel'],
      ['palette-sunset', 150_000, 'palette-neon'],
      ['palette-pearl', 250_000, 'palette-sunset'],
      ['palette-aurora', 500_000, 'palette-pearl'],
      ['palette-fountain', 300_000, null],
    ],
  );
  // The fountain dye needs the 광장 대분수 project.
  assert.equal(SHOP.find((i) => i.id === 'palette-fountain').flag, 'plaza');
  // All unlocks cost far more than the 100,000 starting 범 (ECON-2 dyes: +1.05M).
  const unlocks = SHOP.filter((i) => i.kind === 'trophy' || i.kind === 'palette');
  assert.equal(unlocks.reduce((n, i) => n + i.price, 0), 1_630_000);
});
