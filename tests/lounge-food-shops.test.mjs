// 가게 나누기 · 음식 시스템 (handover/design/design-food-and-shops.md): where
// goods are bought and sold (100% at the shop, 85% from the bag or the bin),
// the shops' specials and the 행상인, the two buff slots, each new buff, 함께
// 먹기, the 맛 도감, migration of older worlds and the 다슬기/달팽이 id fix.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CROP_INFO, LifeError, emptyLife, ensureLifeMember, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { ROD_PRICE, PLUS_REJECT, plantSpeed } from '../app/lounge-life-plus.ts';
import { DISH_BY_ID, DISHES, FISH_BY_ID, ITEM_BY_ID, ITEM_PRICES, GROW_BUFF_SPEED } from '../app/lounge-items.ts';
import {
  COOP_SEED_SHARE,
  LANTERN_SHARE,
  PEDDLER_DAYS,
  SELL_AWAY,
  WEEKLY_SPECIAL_OFF,
  buyerOf,
  lanternSeeds,
  peddlerDeal,
  peddlerStock,
  shopArea,
  shopOffer,
  weekOf,
  weeklySpecial,
} from '../app/lounge-shops.ts';
import {
  HAGGLE_CAP,
  LUNCH_PRICE,
  SHOP_FOOD_BY_ID,
  SHOP_FOOD_PER_DAY,
  TASTE_IDS,
  TASTE_REWARD,
  TASTE_STEP,
  buffPower,
  luckMods,
  mealSlot,
} from '../app/lounge-food-data.ts';
import { INITIAL_BEOM, kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { weekdayOf } from '../app/lounge-calendar.ts';
import { coopWeekCrops } from '../app/lounge-town.ts';
import { gainXp, nodesFor } from '../app/lounge-growth.ts';
import { mineFloor } from '../app/lounge-mine.ts';
import { EXPLORER_PASS } from '../app/lounge-explorer-pass.ts';
import { readAngling, crabCatch } from '../app/lounge-fish-engine.ts';
import { POT_FRESH } from '../app/lounge-fish-data.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { NPC_TALK_POINTS } from '../app/lounge-npc-data.ts';

const uuid = () => crypto.randomUUID();
const MIN = 60_000,
  HOUR = 3_600_000,
  DAY = 86_400_000;
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
const T0 = kst(2026, 9, 24); // Thursday
const SAT_NIGHT = kst(2026, 9, 26, 20);
const SUNDAY = kst(2026, 9, 27, 12);

function world(n = 2, actors) {
  const members = Array.from({ length: n }, (_, i) => ({ id: uuid(), actor: actors?.[i] ?? i }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
  }
  const s = { members, ledger, life };
  s.act = (m, action, now = T0) => {
    const r = lifeAction(s.life, s.ledger, m, action, now);
    s.life = r.life;
    s.ledger = r.ledger;
    invariant(s.ledger);
    return r;
  };
  s.fails = (m, action, now = T0, message) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || (message instanceof RegExp ? message.test(e.message) : e.message === message)),
    );
  s.balance = (m) => s.ledger.accounts['wallet-' + m.id];
  s.view = (m, now = T0) => lifeView(s.life, m.id, m.actor, now);
  s.ext = (m) => ((s.life.ext ??= {})[m.id] ??= {});
  s.give = (m, item, n) => {
    const inv = (s.ext(m).inv ??= {});
    inv[item] = (inv[item] ?? 0) + n;
  };
  s.crops = (m, crop, n) => {
    s.life.bag[m.id].produce[crop] = n;
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
  assert.equal(balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0), Object.keys(ledger.accounts).length * INITIAL_BEOM);
}
const paid = (s, m, fn) => {
  const b = s.balance(m);
  fn();
  return s.balance(m) - b;
};

// ------------------------------------------------------------ selling by place
test('selling: 100% at the item’s own shop, 85% from the bag, refused at the wrong shop', () => {
  const s = world(1),
    [m] = s.members;
  s.crops(m, 'pumpkin', 2);
  const atCoop = paid(s, m, () => s.act(m, { kind: 'sell', crop: 'pumpkin', n: 1, at: 'coop' }));
  assert.equal(atCoop, CROP_INFO.pumpkin.sell);
  // A fresh friend so the demand curve starts at 0 for the bag sale too.
  const t = world(1),
    [n] = t.members;
  t.crops(n, 'pumpkin', 1);
  assert.equal(paid(t, n, () => t.act(n, { kind: 'sell', crop: 'pumpkin', n: 1 })), Math.round(CROP_INFO.pumpkin.sell * SELL_AWAY));
  // Fish are the 어시장's; before the harbor opens the 잡화점 buys them for 럭스.
  s.give(m, 'carp', 3);
  s.fails(m, { kind: 'sellItem', item: 'carp', n: 1, at: 'coop' }, T0, /잡화점에서 제값/);
  s.fails(m, { kind: 'sellItem', item: 'carp', n: 1, at: 'fishmarket' }, T0, /잡화점에서 제값/);
  assert.equal(paid(s, m, () => s.act(m, { kind: 'sellItem', item: 'carp', n: 1, at: 'general' })), ITEM_BY_ID.carp.sell);
  s.life.flags = ['district-harbor'];
  s.fails(m, { kind: 'sellItem', item: 'carp', n: 1, at: 'general' }, T0, /어시장에서 제값/);
  s.act(m, { kind: 'sellItem', item: 'carp', n: 1, at: 'fishmarket' });
  // Who buys what.
  assert.equal(buyerOf('carrot'), 'coop');
  assert.equal(buyerOf('fruit'), 'coop');
  assert.equal(buyerOf('jar-cabbage'), 'coop');
  assert.equal(buyerOf('mushroom'), 'general');
  assert.equal(buyerOf('butterfly'), 'general');
  assert.equal(buyerOf('snail'), 'general', '달팽이 is a bug');
  assert.equal(buyerOf('daseulgi'), 'fishmarket', '다슬기 is the 어시장’s');
  assert.equal(buyerOf('salad'), 'tavern');
  assert.equal(buyerOf('copper'), 'forge');
  assert.equal(buyerOf('fertilizer'), null);
  // Dishes sell at the tavern, ore at the forge.
  s.give(m, 'salad', 1);
  s.give(m, 'iron', 1);
  assert.equal(paid(s, m, () => s.act(m, { kind: 'sellItem', item: 'salad', n: 1, at: 'tavern' })), DISH_BY_ID.salad.sell);
  assert.equal(paid(s, m, () => s.act(m, { kind: 'sellItem', item: 'iron', n: 1, at: 'forge' })), ITEM_BY_ID.iron.sell);
});

test('the shipping bin and farm goods away from the 농협 pay 85%', () => {
  const s = world(1),
    [m] = s.members;
  const x = ((s.life.farmx ??= {})[m.id] ??= {});
  x.goods = { 'jar-cabbage': 2 };
  const shop = paid(s, m, () => s.act(m, { kind: 'sellGoods', item: 'jar-cabbage', n: 1, at: 'coop' }));
  const t = world(1),
    [n] = t.members;
  ((t.life.farmx ??= {})[n.id] ??= {}).goods = { 'jar-cabbage': 1 };
  const away = paid(t, n, () => t.act(n, { kind: 'sellGoods', item: 'jar-cabbage', n: 1 }));
  assert.equal(away, Math.round(shop * SELL_AWAY));
  t.fails(n, { kind: 'sellGoods', item: 'jar-cabbage', n: 1, at: 'tavern' });
});

// ------------------------------------------------------------ buying at shops
test('buying: only at the shop that carries it; specials, lantern night, Sunday seeds', () => {
  const s = world(1),
    [m] = s.members;
  s.fails(m, { kind: 'buy', item: 'seed-carrot', n: 1 }, T0, /가게에 가서/);
  s.fails(m, { kind: 'buy', item: 'seed-carrot', n: 1, at: 'bakery' }, T0, /팔지 않는/);
  s.fails(m, { kind: 'buyItem', item: 'fertilizer', n: 1 }, T0, PLUS_REJECT.shopHere);
  s.fails(m, { kind: 'buyItem', item: 'fertilizer', n: 1, at: 'fishmarket' }, T0, PLUS_REJECT.shopItem);
  assert.equal(-paid(s, m, () => s.act(m, { kind: 'buy', item: 'seed-carrot', n: 2, at: 'general' })), CROP_INFO.carrot.seed * 2);
  // Fishing goods: the 잡화점 until the harbor opens, then only the 어시장.
  s.act(m, { kind: 'buyItem', item: 'bait', n: 1, at: 'general' });
  assert.ok(shopOffer(s.life, 0, 'general', 'rod', T0));
  s.fails(m, { kind: 'upgradeRod', at: 'fishmarket' }, T0, PLUS_REJECT.shopItem);
  s.life.flags = ['district-harbor'];
  s.fails(m, { kind: 'buyItem', item: 'bait', n: 1, at: 'general' }, T0, PLUS_REJECT.shopItem);
  s.fails(m, { kind: 'upgradeRod', at: 'general' }, T0, PLUS_REJECT.shopItem);
  assert.equal(-paid(s, m, () => s.act(m, { kind: 'upgradeRod', at: 'fishmarket' })), ROD_PRICE[2]);
  // 주간 특가: one soil item 20% off this week.
  const week = weekOf(kstDay(T0)),
    special = weeklySpecial(week);
  assert.equal(shopOffer(s.life, 0, 'general', special, T0).price, Math.round((ITEM_PRICES[special] * (1 - WEEKLY_SPECIAL_OFF)) / 10) * 10);
  // 토요일 밤 등불 상점: three dearer seeds 20% off, only Saturday 19:00–24:00.
  const seeds = lanternSeeds(weekOf(kstDay(SAT_NIGHT)));
  assert.equal(seeds.length, 3);
  const seed = 'seed-' + seeds[0];
  assert.equal(shopOffer(s.life, 0, 'general', seed, SAT_NIGHT).price, Math.round((CROP_INFO[seeds[0]].seed * LANTERN_SHARE) / 10) * 10);
  assert.equal(shopOffer(s.life, 0, 'general', seed, SAT_NIGHT - 3 * HOUR).price, CROP_INFO[seeds[0]].seed);
  // 농협 일요 작물 좌판: only the notice crops, only on Sundays.
  const crop = coopWeekCrops(weekOf(kstDay(SUNDAY)))[0];
  assert.equal(shopOffer(s.life, 0, 'coop', 'seed-' + crop, SUNDAY).price, Math.round((CROP_INFO[crop].seed * COOP_SEED_SHARE) / 10) * 10);
  assert.equal(shopOffer(s.life, 0, 'coop', 'seed-' + crop, T0), null);
  // Lunchboxes at the bakery.
  assert.equal(-paid(s, m, () => s.act(m, { kind: 'buyItem', item: 'bento-miner', n: 1, at: 'bakery' })), LUNCH_PRICE);
  assert.ok(DISH_BY_ID['bento-miner'].sell < LUNCH_PRICE, 'buying a lunchbox to resell never pays');
});

test('행상인: open Wed/Sat (harbor) and Sunday (market), each rarity once a week, one contract', () => {
  const s = world(1),
    [m] = s.members;
  const wed = kst(2026, 9, 30, 12);
  assert.deepEqual([...PEDDLER_DAYS], [0, 3, 6]);
  assert.equal(shopArea('peddler', T0), null, 'away on Thursdays');
  assert.equal(shopArea('peddler', wed), 'harbor');
  assert.equal(shopArea('peddler', SUNDAY), 'market');
  const stock = peddlerStock(weekOf(kstDay(wed)));
  assert.equal(stock.length, 3);
  assert.match(stock[0].item, /^spice-/);
  s.fails(m, { kind: 'buyItem', item: stock[1].item, n: 1, at: 'peddler' }, T0, PLUS_REJECT.shopItem);
  s.act(m, { kind: 'buyItem', item: stock[1].item, n: 1, at: 'peddler' }, wed);
  s.fails(m, { kind: 'buyItem', item: stock[1].item, n: 1, at: 'peddler' }, wed + HOUR, PLUS_REJECT.peddlerOnce);
  // 계약 at the harbor needs the harbor open.
  const deal = peddlerDeal(weekOf(kstDay(wed)));
  s.give(m, deal.item, deal.n);
  s.fails(m, { kind: 'peddlerDeal' }, wed, /항구/);
  s.life.flags = ['district-harbor'];
  s.act(m, { kind: 'peddlerDeal' }, wed);
  assert.equal(s.ext(m).inv[stock[0].item], 1);
  assert.equal(s.ext(m).inv[deal.item] ?? 0, 0);
  s.give(m, deal.item, deal.n);
  s.fails(m, { kind: 'peddlerDeal' }, wed + MIN, /이미/);
  assert.equal(s.view(m, wed).shops.peddler.deal.done, true);
  // Next week the rarity can be bought again.
  s.act(m, { kind: 'buyItem', item: peddlerStock(weekOf(kstDay(wed + 7 * DAY)))[0].item, n: 1, at: 'peddler' }, wed + 7 * DAY);
});

// ------------------------------------------------------------ buff slots
test('meal slot: every dish has a buff, once a day, until midnight; 이국 요리 lasts past it', () => {
  for (const d of DISHES) assert.ok(d.buff, `${d.id} has a buff`);
  const s = world(1),
    [m] = s.members;
  s.give(m, 'gamjajeon', 2);
  s.give(m, 'pepperpotato', 1);
  s.act(m, { kind: 'eat', item: 'gamjajeon' });
  const v = s.view(m);
  assert.equal(v.me.buff.kind, 'mine');
  assert.equal(v.me.buff.until, kst(2026, 9, 25, 0));
  s.fails(m, { kind: 'eat', item: 'gamjajeon' }, T0 + HOUR, PLUS_REJECT.ate);
  assert.equal(s.view(m, kst(2026, 9, 25, 0) + 1).me.buff, null, 'gone at midnight');
  s.act(m, { kind: 'eat', item: 'pepperpotato' }, kst(2026, 9, 25, 9));
  assert.equal(s.view(m, kst(2026, 9, 25, 9)).me.buff.until, kst(2026, 9, 26, 6));
});

test('snack slot: shop food for 1–2 hours, both slots together, a new snack replaces the old', () => {
  const s = world(1),
    [m] = s.members;
  s.give(m, 'salad', 1);
  s.act(m, { kind: 'eat', item: 'salad' });
  s.act(m, { kind: 'shopFood', shop: 'bakery', item: 'coffee' });
  let v = s.view(m);
  assert.equal(v.me.buff.kind, 'grow');
  assert.equal(v.me.snack.kind, 'learn');
  assert.equal(v.me.snack.until, T0 + SHOP_FOOD_BY_ID.coffee.hours * HOUR);
  s.act(m, { kind: 'shopFood', shop: 'bakery', item: 'recipepie' }, T0 + 10 * MIN);
  v = s.view(m, T0 + 10 * MIN);
  assert.equal(v.me.snack.kind, 'charm', 'the pie replaced the coffee');
  assert.equal(v.me.buff.kind, 'grow', 'the meal slot is untouched');
  // Two a day at each shop; the tavern counts on its own.
  s.fails(m, { kind: 'shopFood', shop: 'bakery', item: 'milkbread' }, T0 + 20 * MIN, /2번까지/);
  s.act(m, { kind: 'shopFood', shop: 'tavern', item: 'sailor-snack' }, T0 + 30 * MIN);
  s.act(m, { kind: 'shopFood', shop: 'tavern', item: 'merchant-cup' }, T0 + 40 * MIN);
  s.fails(m, { kind: 'shopFood', shop: 'tavern', item: 'captain-feast' }, T0 + 50 * MIN, /2번까지/);
  s.fails(m, { kind: 'shopFood', shop: 'tavern', item: 'coffee' }, T0 + DAY, /메뉴/);
  assert.equal(SHOP_FOOD_PER_DAY, 2);
  // Expiry: two hours later the merchant's cup is gone.
  assert.equal(s.view(m, T0 + 40 * MIN + 2 * HOUR).me.snack, null);
  // The old name still works and spends the price.
  assert.equal(-paid(s, m, () => s.act(m, { kind: 'bakeryBuy', item: 'milkbread' }, T0 + DAY)), SHOP_FOOD_BY_ID.milkbread.price);
});

test('older worlds: ext.buff reads as the meal slot; old bag 달팽이 stays a bug', () => {
  const id = uuid();
  const until = T0 + 5 * HOUR;
  const life = readLife({
    ...emptyLife(),
    actors: { [id]: 0 },
    ext: { [id]: { buff: { kind: 'grow', dish: 'salad', until }, inv: { snail: 3 }, day: kstDay(T0), ate: 'salad' } },
  });
  assert.deepEqual(mealSlot(life, id, T0), { kind: 'grow', food: 'salad', until });
  assert.equal(plantSpeed(life, id, T0), GROW_BUFF_SPEED);
  assert.equal(life.ext[id].inv.snail, 3);
  assert.equal(ITEM_BY_ID.snail.name, '달팽이');
  assert.equal(ITEM_BY_ID.snail.kind, 'bug');
  // A bad snack slot is dropped, a good one kept.
  const again = readLife({ ...life, ext: { [id]: { ...life.ext[id], snack: { kind: 'learn', food: 'coffee', until, weak: true } } } });
  assert.equal(again.ext[id].snack.food, 'coffee');
  const bad = readLife({ ...life, ext: { [id]: { ...life.ext[id], snack: { kind: 'nope', food: 'coffee', until } } } });
  assert.equal(bad.ext[id].snack, undefined);
});

// ------------------------------------------------------------ each buff
test('물고기의 행운: the meal gives ×1.2 bite window, 뱃사람 안주 a weaker ×1.1', () => {
  const s = world(1),
    [m] = s.members;
  s.give(m, 'grilledfish', 1);
  s.act(m, { kind: 'eat', item: 'grilledfish' });
  assert.deepEqual(luckMods(s.life, m.id, T0), { rare: 2, window: 1.2 });
  s.act(m, { kind: 'cast', spot: 'river' }, T0 + MIN);
  const p = s.life.ext[m.id].pending;
  assert.equal(p.windowMs, Math.round(FISH_BY_ID[p.fish].windowMs * 1.2));
  const t = world(1),
    [n] = t.members;
  t.act(n, { kind: 'shopFood', shop: 'tavern', item: 'sailor-snack' });
  assert.equal(buffPower(t.life, n.id, T0, 'luck'), 0.5);
  assert.deepEqual(luckMods(t.life, n.id, T0), { rare: 1.5, window: 1.1 });
  t.act(n, { kind: 'cast', spot: 'river' }, T0 + MIN);
  const q = t.life.ext[n.id].pending;
  assert.equal(q.windowMs, Math.round(FISH_BY_ID[q.fish].windowMs * 1.1));
});

test('흥정: +5% at the item’s own shop only, at most 3,000범 a day', () => {
  const s = world(1),
    [m] = s.members;
  s.act(m, { kind: 'shopFood', shop: 'tavern', item: 'merchant-cup' });
  s.crops(m, 'pumpkin', 1);
  const shop = paid(s, m, () => s.act(m, { kind: 'sell', crop: 'pumpkin', n: 1, at: 'coop' }, T0 + MIN));
  assert.equal(shop, CROP_INFO.pumpkin.sell + Math.round(CROP_INFO.pumpkin.sell * 0.05));
  s.crops(m, 'carrot', 1);
  const bag = paid(s, m, () => s.act(m, { kind: 'sell', crop: 'carrot', n: 1 }, T0 + 2 * MIN));
  assert.equal(bag, Math.round(CROP_INFO.carrot.sell * SELL_AWAY), 'no 흥정 from the bag');
  // The cap: a sale adds at most what is left of HAGGLE_CAP today.
  s.life.ext[m.id].hag = HAGGLE_CAP - 10;
  s.give(m, 'koi', 1);
  const koi = paid(s, m, () => s.act(m, { kind: 'sellItem', item: 'koi', n: 1, at: 'general' }, T0 + 3 * MIN));
  assert.equal(koi, ITEM_BY_ID.koi.sell + 10);
  assert.equal(s.life.ext[m.id].hag, HAGGLE_CAP);
  assert.equal(s.view(m, T0 + 3 * MIN).me.haggleLeft, 0);
});

test('광부의 힘: every third mine rock gives one more ore; 나무꾼: one more wood', () => {
  const pass = EXPLORER_PASS.actor;
  const ore = (s, m) => ['copper', 'iron', 'gold'].reduce((t, k) => t + (s.life.ext?.[m.id]?.inv?.[k] ?? 0), 0);
  const run = (buffed) => {
    const s = world(1, [pass]),
      [m] = s.members;
    m.id = '00000000-0000-4000-8000-000000000001';
    s.life = ensureLifeMember(emptyLife(), m.id, pass);
    s.ledger = registerWallet(newLoungeLedger(), 'wallet-' + m.id);
    if (buffed) {
      s.give(m, 'gamjajeon', 1);
      s.act(m, { kind: 'eat', item: 'gamjajeon' });
    }
    s.act(m, { kind: 'mineGo', floor: 1 });
    const rocks = mineFloor(kstDay(T0), 1).rocks.slice(0, 3);
    rocks.forEach((r, i) => s.act(m, { kind: 'mineRock', floor: 1, rock: r.i }, T0 + i + 1));
    return { ore: ore(s, m), mrk: s.life.ext[m.id].mrk ?? 0 };
  };
  const plain = run(false),
    miner = run(true);
  assert.equal(miner.mrk, 3);
  assert.ok(miner.ore >= plain.ore + 1, JSON.stringify({ plain, miner }));
  // 나무꾼: the same node gives one more wood with the buff.
  const chop = (buffed) => {
    const s = world(1),
      [m] = s.members;
    m.id = '00000000-0000-4000-8000-000000000002';
    s.life = ensureLifeMember(emptyLife(), m.id, 0);
    s.ledger = registerWallet(newLoungeLedger(), 'wallet-' + m.id);
    if (buffed) {
      s.give(m, 'ssukddeok', 1);
      s.act(m, { kind: 'eat', item: 'ssukddeok' });
    }
    const node = nodesFor(s.life, m.id, kstDay(T0)).find((n) => n.kind === 'bush' || n.kind === 'log');
    s.act(m, { kind: 'chop', node: node.id }, T0 + 1);
    return s.life.ext[m.id].inv.wood;
  };
  assert.equal(chop(true), chop(false) + 1);
});

test('배움: skill XP +10% under the soft cap; 친화력: resident points ×1.5', () => {
  const xp = (buffed) => {
    const s = world(1),
      [m] = s.members;
    if (buffed) s.act(m, { kind: 'shopFood', shop: 'bakery', item: 'coffee' });
    return gainXp(s.life, m.id, 'farm', 10, T0 + 1);
  };
  const plain = xp(false);
  assert.ok(Math.abs(xp(true) - plain * 1.1) < 0.11, `${xp(true)} vs ${plain}`);
  const s = world(1),
    [m] = s.members;
  s.act(m, { kind: 'npcSocial', npc: 'nasera', op: 'talk' });
  const base = s.life.ext[m.id].npcRelations.nasera.points;
  assert.equal(base, NPC_TALK_POINTS);
  s.act(m, { kind: 'shopFood', shop: 'bakery', item: 'recipepie' }, T0 + DAY);
  s.act(m, { kind: 'npcSocial', npc: 'nasera', op: 'talk' }, T0 + DAY + MIN);
  assert.equal(s.life.ext[m.id].npcRelations.nasera.points - base, Math.round(NPC_TALK_POINTS * 1.5));
});

test('함께 먹기: friends eating in the same place within 5 minutes both feel it, once a day', () => {
  const s = world(3),
    [a, b, c] = s.members;
  for (const m of s.members) s.give(m, 'bento-river', 2);
  s.act(a, { kind: 'eat', item: 'bento-river', where: 'harbor' });
  s.act(b, { kind: 'eat', item: 'bento-river', where: 'harbor' }, T0 + 3 * MIN);
  const lets = (m) => (s.life.mood?.[m.id]?.l ?? []).map(([id]) => id);
  assert.ok(lets(a).includes('together'));
  assert.ok(lets(b).includes('together'));
  // Too late and elsewhere: no 함께 먹기 for c.
  s.act(c, { kind: 'eat', item: 'bento-river', where: 'mine' }, T0 + 4 * MIN);
  assert.ok(!lets(c).includes('together'));
  // The tavern's is stronger.
  const t = world(2),
    [x, y] = t.members;
  t.act(x, { kind: 'shopFood', shop: 'tavern', item: 'captain-feast' });
  t.act(y, { kind: 'shopFood', shop: 'tavern', item: 'sailor-snack' }, T0 + MIN);
  assert.ok((t.life.mood?.[x.id]?.l ?? []).some(([id]) => id === 'togetherTavern'));
  assert.ok(t.life.news.some((d) => d.lines.some((l) => l.key.startsWith('eat:'))));
});

test('맛 도감: first tastes fill it and every ten pay a little', () => {
  const s = world(1),
    [m] = s.members;
  assert.ok(TASTE_IDS.length >= 40);
  s.ext(m).taste = TASTE_IDS.filter((id) => id !== 'salad' && id !== 'coffee').slice(0, TASTE_STEP - 1);
  s.give(m, 'salad', 1);
  assert.equal(paid(s, m, () => s.act(m, { kind: 'eat', item: 'salad' })), TASTE_REWARD);
  assert.equal(s.view(m).me.taste.paid, 1);
  // The same food again pays nothing.
  s.act(m, { kind: 'shopFood', shop: 'bakery', item: 'coffee' }, T0 + MIN);
  assert.equal(s.view(m, T0 + MIN).me.taste.ids.length, TASTE_STEP + 1);
});

// ------------------------------------------------------------ snail fix
test('다슬기 has its own id; old journal entries move to it', () => {
  assert.equal(FISH_BY_ID.daseulgi.name, '다슬기');
  assert.equal(ITEM_BY_ID.daseulgi.kind, 'fish');
  assert.equal(FISH_BY_ID.snail, undefined);
  assert.ok(POT_FRESH.includes('daseulgi'));
  assert.ok(DISH_BY_ID.daseulgiguk.needs.some((n) => n.item === 'daseulgi'));
  const seen = new Set();
  for (let at = 1; at < 200; at++) seen.add(crabCatch('u', { spot: 'river', at, bait: true }));
  assert.ok(seen.has('daseulgi') && !seen.has('snail'));
  const a = readAngling({ u: { [uuid()]: { log: { snail: { n: 2, cm: 3, g: 5, q: 0, first: 1 } } } } });
  const u = Object.values(a.angling.u)[0];
  assert.equal(u.log.daseulgi.n, 2);
  assert.equal(u.log.snail, undefined);
});

// ------------------------------------------------------------ cloud
test('cloud: home cooking at home, lunchboxes anywhere; tavern food in the tavern; ledger holds', async () => {
  let w = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const p = { id: uuid(), actor: 0, username: ACCOUNT_IDS[0], connection: uuid(), sequence: 0, epoch: 0, code: '' };
  const run = async (op, extra = {}) => {
    const command = { op, connection: p.connection, ...(p.code ? { code: p.code } : {}), ...(!['read', 'wallet'].includes(op) ? { requestId: uuid(), sequence: ++p.sequence } : {}), ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
    const r = cloudTransition(w, p, command, await commandHash(command), T0);
    w = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    invariant(w.ledger);
    return r.response;
  };
  await run('wallet');
  await run('open', { code: 'BEMTADUVLY' });
  const uid = Object.keys(w.life.actors).find((k) => w.life.actors[k] === 0);
  w.life.ext ??= {};
  w.life.ext[uid] = { ...w.life.ext[uid], inv: { salad: 1, 'bento-field': 1 } };
  const outside = await run('action', { action: { kind: 'eat', item: 'salad' } });
  assert.match(outside.error ?? '', /방에서 먹어요/);
  const lunch = await run('action', { action: { kind: 'eat', item: 'bento-field', where: 'home' } });
  assert.ok(!lunch.error, lunch.error);
  assert.equal(w.life.ext[uid].eatAt.w, 'lounge', 'the server says where I ate (not the client’s "home")');
  const away = await run('action', { action: { kind: 'shopFood', shop: 'tavern', item: 'merchant-cup' } });
  assert.match(away.error ?? '', /허풍 주점에 가서/);
  const bakeryAway = await run('action', { action: { kind: 'shopFood', shop: 'bakery', item: 'coffee' } });
  assert.match(bakeryAway.error ?? '', /시장 거리에 가서/);
  assert.ok(!(await run('action', { action: { kind: 'area', area: 'market', x: 0, y: 0 } })).error);
  const coffee = await run('action', { action: { kind: 'shopFood', shop: 'bakery', item: 'coffee' } });
  assert.ok(!coffee.error, coffee.error);
  const sell = await run('action', { action: { kind: 'sellItem', item: 'salad', n: 1, at: 'tavern' } });
  assert.match(sell.error ?? '', /허풍 주점에 가서/);
  assert.equal(weekdayOf(kstDay(T0)), 4);
});
