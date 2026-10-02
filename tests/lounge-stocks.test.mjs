// 범마을 증권 (handover/design/design-stocks.md §9): prices, band, fees,
// margin, short selling, dividends, market hours and server authority.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newLoungeLedger, registerWallet, validateLedger, INITIAL_BEOM, kstDay } from '../app/lounge-economy.ts';
import {
  STOCKS,
  STOCK_SYMS,
  STOCK_BY_SYM,
  STOCK_CREDIT_LIMIT,
  STOCK_TICKS,
  limitsOf,
  quoteOf,
  stockFee,
  holdLimit,
  listStocks,
  materializeStocks,
  stocksAction,
  stocksView,
  tickOf,
  tickAt,
  marketOpen,
  newsOf,
  longRatio,
} from '../app/lounge-stocks.ts';

const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
const SEED = '0123456789abcdef0123456789abcdef';
const UID = 'aaaaaaaa-0000-4000-8000-000000000001';
const UID2 = 'aaaaaaaa-0000-4000-8000-000000000002';
const W = 'wallet-' + UID;
const T0 = kst(2026, 10, 1, 10, 20); // Thursday 10:20 KST
const broker = { area: 'broker' };

function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  assert.equal(balances + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0), Object.keys(ledger.accounts).length * INITIAL_BEOM);
}
function market(now = T0, seed = SEED) {
  let ledger = registerWallet(newLoungeLedger(), W);
  ledger = registerWallet(ledger, 'wallet-' + UID2);
  const st = listStocks(seed, now, { ledger });
  return { st, ledger };
}
/** Catch the market up to `now` and keep it. */
function advance(m, now) {
  const r = materializeStocks(m.st, m.ledger, { ledger: m.ledger }, now);
  m.st = r.state;
  m.ledger = r.ledger;
  invariant(m.ledger);
  return r;
}
function order(m, action, now, place = broker, uid = UID) {
  advance(m, now);
  const r = stocksAction(m.st, m.ledger, uid, { kind: 'stock', ...action }, now, place);
  m.st = r.state;
  m.ledger = r.ledger;
  invariant(m.ledger);
  return r;
}

test('stocks: twelve listings, nine shops and three themes, no real company names', () => {
  assert.equal(STOCKS.length, 12);
  assert.equal(STOCKS.filter((s) => s.kind === 'shop').length, 9);
  assert.deepEqual(STOCKS.filter((s) => s.kind === 'theme').map((s) => s.name), ['범성전자', '범이닉스', '범비디아']);
  assert.equal(new Set(STOCKS.map((s) => s.code)).size, 12);
  for (const s of STOCKS) {
    assert.ok(s.news.up.length && s.news.down.length, s.sym);
    assert.ok(s.p0 >= 1000 && s.float >= 100, s.sym);
    if (s.kind === 'shop') assert.ok(s.casino || s.g?.length || s.s?.length, `${s.sym} has turnover buckets`);
  }
});

test('stocks: market hours and ticks (09:00–15:00 hourly, orders until 15:30)', () => {
  const day = kstDay(T0);
  assert.equal(tickOf(kst(2026, 10, 1, 9, 0)), day * STOCK_TICKS);
  assert.equal(tickOf(kst(2026, 10, 1, 10, 59)), day * STOCK_TICKS + 1);
  assert.equal(tickOf(kst(2026, 10, 1, 15, 10)), day * STOCK_TICKS + 6);
  assert.equal(tickOf(kst(2026, 10, 1, 23, 0)), day * STOCK_TICKS + 6);
  assert.equal(tickOf(kst(2026, 10, 1, 8, 59)), day * STOCK_TICKS - 1, 'before 09:00 it is still yesterday’s close');
  assert.equal(tickAt(day * STOCK_TICKS + 3), kst(2026, 10, 1, 12));
  assert.equal(marketOpen(kst(2026, 10, 1, 8, 59)), false);
  assert.equal(marketOpen(kst(2026, 10, 1, 9, 0)), true);
  assert.equal(marketOpen(kst(2026, 10, 1, 15, 29)), true);
  assert.equal(marketOpen(kst(2026, 10, 1, 15, 30)), false);
});

test('stocks: prices are deterministic — the same seed and inputs, at once or hour by hour', () => {
  const a = market(),
    b = market();
  assert.deepEqual(a.st, b.st, 'listing is reproducible');
  const end = kst(2026, 10, 4, 14, 5);
  advance(a, end);
  for (let t = T0; t <= end; t += 3_600_000) advance(b, t);
  advance(b, end);
  assert.deepEqual(a.st.px, b.st.px);
  assert.deepEqual(a.st.days, b.st.days);
  assert.deepEqual(a.st.events, b.st.events);
  const c = market(T0, 'fedcba9876543210fedcba9876543210');
  advance(c, end);
  assert.notDeepEqual(a.st.px, c.st.px, 'another seed, another market');
  // News is seeded too, and some stock gets news within a fortnight.
  let any = 0;
  for (let d = kstDay(T0); d < kstDay(T0) + 14; d++) for (const s of STOCKS) any += newsOf(SEED, s, d) ? 1 : 0;
  assert.ok(any > 5, `news days: ${any}`);
});

test('stocks: prelisting history fills the chart and every price stays in the ±15% band', () => {
  const m = market();
  advance(m, kst(2026, 10, 20, 15, 10));
  for (const sym of STOCK_SYMS) {
    const days = m.st.days[sym];
    assert.ok(days.length >= 20, `${sym}: ${days.length} days of candles`);
    for (let i = 1; i < days.length; i++) {
      const [lo, hi] = limitsOf(days[i - 1][3]);
      const [o, h, l, c] = days[i];
      for (const p of [o, h, l, c]) assert.ok(p >= lo && p <= hi, `${sym} day ${i}: ${p} outside ${lo}–${hi}`);
      assert.ok(l <= Math.min(o, c) && h >= Math.max(o, c));
    }
  }
  // The band rounds to the price ticks: upper down, lower up.
  assert.deepEqual(limitsOf(10_000), [8_500, 11_500]);
  assert.deepEqual(limitsOf(3_333), [2_835, 3_830]);
});

test('stocks: buying pays the ask plus a 0.3% fee (rounded up) to the house', () => {
  const m = market();
  const before = m.ledger.accounts[W],
    spent = m.ledger.spent ?? 0;
  order(m, { op: 'buy', sym: 'bakery', qty: 7 }, T0);
  const { ask } = quoteOf(m.st.px.bakery, limitsOf(m.st.prev.bakery));
  const fee = stockFee(7 * ask);
  assert.equal(fee, Math.ceil(7 * ask * 0.003));
  assert.equal(m.ledger.accounts[W], before - 7 * ask - fee);
  assert.equal(m.ledger.spent - spent, fee, 'the fee is a spend (sink)');
  assert.equal(m.ledger.flows.total.s['stock-fee'], fee);
  assert.equal(m.ledger.marketNet, 7 * ask);
  // Selling right away loses only the spread and two fees.
  order(m, { op: 'sell', sym: 'bakery', qty: 7 }, T0 + 60_000);
  const { bid } = quoteOf(m.st.px.bakery, limitsOf(m.st.prev.bakery));
  assert.equal(m.ledger.accounts[W], before - 7 * ask - fee + 7 * bid - stockFee(7 * bid));
  assert.equal(m.st.acct[UID].long.bakery, undefined);
  const log = m.st.acct[UID].log;
  assert.deepEqual(log.map((l) => l.op), ['buy', 'sell']);
});

test('stocks: the server sets the price — a price field is refused, the fill is the server quote', () => {
  const m = market();
  advance(m, T0);
  assert.throws(() => stocksAction(m.st, m.ledger, UID, { kind: 'stock', op: 'buy', sym: 'bsung', qty: 1, price: 1 }, T0, broker), /가격은 서버 시세/);
  assert.throws(() => stocksAction(m.st, m.ledger, UID, { kind: 'stock', op: 'buy', sym: 'nope', qty: 1 }, T0, broker), /종목/);
  assert.throws(() => stocksAction(m.st, m.ledger, UID, { kind: 'stock', op: 'buy', sym: 'bsung', qty: 1.5 }, T0, broker), /정수/);
  assert.throws(() => stocksAction(m.st, m.ledger, UID, { kind: 'stock', op: 'mint', sym: 'bsung', qty: 1 }, T0, broker), /주문 종류/);
  // A stale market (not caught up to now) cannot take orders.
  assert.throws(() => stocksAction(m.st, m.ledger, UID, { kind: 'stock', op: 'buy', sym: 'bsung', qty: 1 }, T0 + 3 * 3_600_000, broker), /시세를 다시/);
  order(m, { op: 'buy', sym: 'bsung', qty: 1 }, T0);
  assert.equal(m.st.acct[UID].log[0].px, quoteOf(m.st.px.bsung, limitsOf(m.st.prev.bsung)).ask);
  // The view never carries the seed or anyone else's account.
  order(m, { op: 'buy', sym: 'coop', qty: 2 }, T0, broker, UID2);
  const view = stocksView(m.st, UID, { [UID]: 0, [UID2]: 3 }, T0);
  const text = JSON.stringify(view);
  assert.ok(!text.includes(SEED), 'no seed');
  assert.ok(!text.includes(UID2), 'no other uid');
  assert.deepEqual(view.me.positions.map((p) => p.sym), ['bsung']);
  assert.deepEqual(view.ranking.map((r) => r.actor).sort((x, y) => x - y), [0, 3]);
});

test('stocks: orders outside 09:00–15:30 are refused; repaying a loan works any time', () => {
  const m = market();
  order(m, { op: 'margin', sym: 'coop', qty: 4 }, T0);
  const shut = (at) => {
    advance(m, at);
    assert.throws(() => stocksAction(m.st, m.ledger, UID, { kind: 'stock', op: 'buy', sym: 'coop', qty: 1 }, at, broker), /장이 닫혀/);
    assert.throws(() => stocksAction(m.st, m.ledger, UID, { kind: 'stock', op: 'sell', sym: 'coop', qty: 1 }, at, broker), /장이 닫혀/);
  };
  shut(kst(2026, 10, 1, 15, 30));
  shut(kst(2026, 10, 1, 22, 0));
  const night = kst(2026, 10, 1, 22, 0);
  const loan = m.st.acct[UID].long.coop.loan;
  order(m, { op: 'repay', sym: 'coop', amount: 1_000 }, night, { area: 'village' });
  assert.equal(m.st.acct[UID].long.coop.loan, loan - 1_000);
  shut(kst(2026, 10, 2, 8, 30));
  order(m, { op: 'sell', sym: 'coop', qty: 1 }, kst(2026, 10, 2, 9, 0), { area: 'village' });
});

test('stocks: opening orders only inside 범마을 증권; closing works anywhere', () => {
  const m = market();
  advance(m, T0);
  for (const op of ['buy', 'margin', 'short'])
    assert.throws(() => stocksAction(m.st, m.ledger, UID, { kind: 'stock', op, sym: 'tavern', qty: 1 }, T0, { area: 'market' }), /범마을 증권 안/);
  order(m, { op: 'buy', sym: 'tavern', qty: 3 }, T0);
  order(m, { op: 'sell', sym: 'tavern', qty: 3 }, T0 + 60_000, { area: 'village' });
  order(m, { op: 'short', sym: 'general', qty: 2 }, T0 + 120_000);
  order(m, { op: 'cover', sym: 'general', qty: 2 }, T0 + 180_000, { area: 'harbor' });
});

test('stocks: margin buys borrow half (2× at most) within the 300,000범 credit line', () => {
  const m = market();
  order(m, { op: 'margin', sym: 'realty', qty: 4 }, T0);
  const l = m.st.acct[UID].long.realty;
  const { ask } = quoteOf(m.st.px.realty, limitsOf(m.st.prev.realty));
  assert.equal(l.loan, Math.floor(4 * ask * 0.5));
  assert.equal(INITIAL_BEOM - m.ledger.accounts[W], 4 * ask - l.loan + stockFee(4 * ask));
  // The credit line: loans plus short value never pass 300,000범.
  const big = { ...m, ledger: { ...m.ledger, accounts: { ...m.ledger.accounts, [W]: 2_000_000 } } };
  big.ledger.granted = (big.ledger.granted ?? 0) + 2_000_000 - m.ledger.accounts[W];
  validateLedger(big.ledger);
  assert.throws(() => stocksAction(big.st, big.ledger, UID, { kind: 'stock', op: 'margin', sym: 'bsung', qty: 40 }, T0, broker), /신용 한도/);
  // Per-stock holding limit: 10% of the float.
  assert.equal(holdLimit('bsung'), 40);
  assert.throws(() => stocksAction(big.st, big.ledger, UID, { kind: 'stock', op: 'buy', sym: 'bsung', qty: 41 }, T0, broker), /유통 주식의 10%/);
  assert.ok(STOCK_CREDIT_LIMIT === 300_000);
});

test('stocks: interest accrues at the close; a margin call is sold at the next day’s close; below 30% at once', () => {
  const m = market();
  order(m, { op: 'margin', sym: 'coop', qty: 6 }, T0);
  const l0 = m.st.acct[UID].long.coop.loan;
  advance(m, kst(2026, 10, 1, 15, 5));
  const l1 = m.st.acct[UID].long.coop;
  assert.equal(l1.loan, l0 + Math.ceil(l0 * 0.001), 'one day of interest');
  assert.equal(l1.int, l1.loan - l0);
  // Push the loan so the ratio sits near 35%: a call, not yet a sale.
  const bid = quoteOf(m.st.px.coop, limitsOf(m.st.prev.coop)).bid;
  l1.loan = Math.round(6 * bid * 0.65);
  l1.int = 0;
  advance(m, kst(2026, 10, 2, 9, 5));
  const called = m.st.acct[UID].long.coop;
  assert.ok(called, 'still held');
  assert.ok(called.call !== undefined, `call set (ratio ${longRatio(called, quoteOf(m.st.px.coop, limitsOf(m.st.prev.coop)).bid).toFixed(3)})`);
  assert.ok(m.st.acct[UID].log.some((x) => x.op === 'call'));
  // More margin is refused while called.
  assert.throws(() => stocksAction(m.st, m.ledger, UID, { kind: 'stock', op: 'margin', sym: 'forge', qty: 1 }, kst(2026, 10, 2, 9, 5), broker), /마진콜/);
  // Unresolved by the next day's close → forced sale.
  const wallet = m.ledger.accounts[W];
  const r = advance(m, kst(2026, 10, 3, 15, 5));
  assert.equal(m.st.acct[UID].long.coop, undefined, 'sold by the broker');
  assert.ok(m.st.acct[UID].log.some((x) => x.op === 'liquidate'));
  assert.ok(m.ledger.accounts[W] >= wallet, 'a forced sale never takes from the wallet');
  assert.ok(m.st.events.some((e) => e.kind === 'liquidate' && e.uid === UID));
  assert.ok(r.news.some((n) => n.key.startsWith('stock-liq-') && n.uids[0] === UID));
  // Below 30%: sold at the very next tick.
  const m2 = market();
  order(m2, { op: 'margin', sym: 'forge', qty: 10 }, T0);
  const pos = m2.st.acct[UID].long.forge;
  pos.loan = Math.round(10 * quoteOf(m2.st.px.forge, limitsOf(m2.st.prev.forge)).bid * 0.8);
  advance(m2, kst(2026, 10, 1, 11, 1));
  assert.equal(m2.st.acct[UID].long.forge, undefined);
  assert.equal(m2.st.stats.at(-1).liquidations, 1);
});

test('stocks: a short loses at most its collateral and fee; the house absorbs a gap', () => {
  const m = market();
  const start = m.ledger.accounts[W];
  order(m, { op: 'short', sym: 'bnix', qty: 5 }, T0);
  const s = m.st.acct[UID].short.bnix;
  const { bid } = quoteOf(m.st.px.bnix, limitsOf(m.st.prev.bnix));
  assert.equal(s.val, 5 * bid);
  assert.equal(s.coll, Math.ceil(5 * bid * 0.5));
  const paid = start - m.ledger.accounts[W];
  assert.equal(paid, s.coll + stockFee(5 * bid));
  // Same stock long and short at once is refused.
  assert.throws(() => stocksAction(m.st, m.ledger, UID, { kind: 'stock', op: 'buy', sym: 'bnix', qty: 1 }, T0, broker), /환매수/);
  // As if the price had tripled overnight: the position is worth less than nothing.
  s.val = 1;
  const after = m.ledger.accounts[W];
  advance(m, kst(2026, 10, 1, 11, 1));
  assert.equal(m.st.acct[UID].short.bnix, undefined, 'forced cover');
  assert.equal(m.ledger.accounts[W], after, 'nothing more is taken from the wallet');
  assert.ok(start - m.ledger.accounts[W] <= paid, 'total loss ≤ collateral + fee');
  assert.ok(m.st.stats.at(-1).absorbed > 0, 'the broker absorbed the shortfall');
  // Borrow fee at the close comes out of the collateral.
  const m2 = market();
  order(m2, { op: 'short', sym: 'bvidia', qty: 5 }, T0);
  const c0 = m2.st.acct[UID].short.bvidia.coll;
  advance(m2, kst(2026, 10, 1, 15, 2));
  const c1 = m2.st.acct[UID].short.bvidia?.coll;
  if (c1 !== undefined) assert.ok(c1 < c0, 'borrow fee taken');
  // Holding limit applies to shorts too (10% of the float).
  assert.throws(() => order(market(), { op: 'short', sym: 'bsung', qty: 41 }, T0), /유통 주식의 10%/);
});

test('stocks: weekly dividends on Monday’s open — longs paid, shorts charged', () => {
  const m = market(kst(2026, 10, 2, 10)); // Friday
  order(m, { op: 'buy', sym: 'bakery', qty: 20 }, kst(2026, 10, 2, 10));
  order(m, { op: 'short', sym: 'coop', qty: 3 }, kst(2026, 10, 2, 10), broker, UID2);
  const w = m.ledger.accounts[W],
    coll = m.st.acct[UID2].short.coop.coll;
  advance(m, kst(2026, 10, 4, 15, 5)); // Sunday close: nothing yet
  assert.equal(m.ledger.accounts[W], w);
  const sunday = { bakery: m.st.px.bakery, coop: m.st.px.coop };
  advance(m, kst(2026, 10, 5, 9, 5)); // Monday open
  const dps = Math.floor(sunday.bakery * 0.004);
  assert.equal(m.st.div.bakery, dps);
  assert.equal(m.ledger.accounts[W], w + 20 * dps);
  const div = m.st.acct[UID].log.find((l) => l.op === 'dividend');
  assert.equal(div.amount, 20 * dps);
  const coopDps = Math.floor(sunday.coop * 0.004);
  assert.ok(m.st.acct[UID2].short.coop.coll <= coll - 3 * coopDps, 'the short paid the dividend from its collateral');
  assert.equal(m.st.div.bsung, undefined, 'themes pay no dividend');
  assert.ok(m.st.events.some((e) => e.kind === 'dividend' && e.sym === 'bakery'));
});

test('stocks: a busy shop is pulled up, a dead one down (turnover from the ledger’s day flows)', () => {
  const day = kstDay(T0);
  const flows = (n) => ({ since: 0, base: { granted: 0, spent: 0 }, total: { g: {}, s: {} }, days: Array.from({ length: 14 }, (_, i) => ({ d: day - 14 + i, g: {}, s: { bakery: i >= 11 ? n : 1_000 } })) });
  const busy = { ledger: { flows: flows(50_000) } },
    quiet = { ledger: { flows: flows(0) } };
  const a = listStocks(SEED, T0, busy),
    b = listStocks(SEED, T0, quiet);
  const ledger = registerWallet(newLoungeLedger(), W);
  const ra = materializeStocks(a, ledger, busy, kst(2026, 10, 3, 15, 5)).state,
    rb = materializeStocks(b, ledger, quiet, kst(2026, 10, 3, 15, 5)).state;
  assert.ok(ra.px.bakery > rb.px.bakery, `${ra.px.bakery} > ${rb.px.bakery}`);
  assert.equal(ra.px.bsung, rb.px.bsung, 'themes ignore shop turnover');
});

test('stocks: friends’ buying nudges the next tick by at most 0.6% (less than a round trip costs)', () => {
  const m = market(),
    n = market();
  advance(m, T0);
  advance(n, T0);
  // A friend buys all the bakery their wallet allows.
  order(m, { op: 'buy', sym: 'bakery', qty: 25 }, T0);
  advance(m, kst(2026, 10, 1, 11, 1));
  advance(n, kst(2026, 10, 1, 11, 1));
  const ratio = m.st.px.bakery / n.st.px.bakery;
  assert.ok(ratio >= 1 && ratio <= 1.006 + 0.002, `impact ${ratio}`);
  // The cheapest round trip costs more than the cap: two fees plus a tick each way.
  for (const def of STOCKS) {
    const p = def.p0;
    const { ask, bid } = quoteOf(p, limitsOf(p));
    const cost = (ask - bid) / p + 2 * 0.003;
    assert.ok(cost > 0.006, `${def.sym} round trip ${cost}`);
  }
  assert.equal(STOCK_BY_SYM.bakery.float, 1_500);
});

test('stocks: catching up after weeks offline matches catching up daily', () => {
  const a = market(),
    b = market();
  order(a, { op: 'buy', sym: 'furniture', qty: 3 }, T0);
  order(b, { op: 'buy', sym: 'furniture', qty: 3 }, T0);
  const end = kst(2026, 10, 30, 13, 30);
  advance(a, end);
  for (let t = T0; t < end; t += 86_400_000) advance(b, t);
  advance(b, end);
  assert.deepEqual(a.st, b.st);
  assert.deepEqual(a.ledger.accounts, b.ledger.accounts);
});

// ---------------------------------------------------------------- through the cloud engine
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { SHOP_INTERIORS } from '../app/lounge-shop-interiors.ts';

async function village(actor = 0, start = T0) {
  let w = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  let now = start;
  const p = { id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' };
  const run = async (op, extra = {}) => {
    const command = {
      op,
      connection: p.connection,
      ...(p.code ? { code: p.code } : {}),
      ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}),
      ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
      ...extra,
    };
    const r = cloudTransition(w, p, command, await commandHash(command), now);
    w = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    invariant(w.ledger);
    return r;
  };
  await run('wallet');
  await run('open', { code: 'BEMTADUVLY' });
  return {
    p,
    run,
    act: async (action) => (await run('action', { action })).response,
    at: (t) => (now = t),
    get w() {
      return w;
    },
  };
}

test('server: a market is listed on the first write, its seed stays on the server', async () => {
  const v = await village();
  assert.ok(v.w.stocks, 'listed');
  assert.match(v.w.stocks.seed, /^[0-9a-f]{32}$/);
  const r = await v.run('read');
  assert.ok(r.response.stocks, 'the view is sent');
  assert.ok(!JSON.stringify(r.response).includes(v.w.stocks.seed), 'never the seed');
  assert.equal(r.response.stocks.stocks.length, 12);
  // A read hours later shows the caught-up market without writing the world.
  v.at(kst(2026, 10, 1, 14, 10));
  const stored = structuredClone(v.w.stocks);
  const later = await v.run('read');
  assert.deepEqual(later.state.stocks, stored, 'a read never stores the market');
  assert.equal(later.response.stocks.tick, tickOf(kst(2026, 10, 1, 14, 10)));
  assert.ok(v.w.stocks.tick < later.response.stocks.tick, 'the stored market is still behind');
  // The next write stores exactly what the read showed.
  await v.act({ kind: 'area', area: 'market', x: 40, y: 40 });
  assert.equal(v.w.stocks.tick, later.response.stocks.tick);
  assert.deepEqual(v.w.stocks.px, Object.fromEntries(later.response.stocks.stocks.map((s) => [s.sym, s.px])));
});

test('server: orders need the 증권사 room, pay the server quote and show in my view only', async () => {
  const v = await village();
  let r = await v.act({ kind: 'stock', op: 'buy', sym: 'bakery', qty: 5 });
  assert.match(r.error, /범마을 증권 안/);
  r = await v.act({ kind: 'area', area: 'broker', ...SHOP_INTERIORS.broker.front });
  assert.equal(r.ok, true, r.error);
  r = await v.act({ kind: 'stock', op: 'buy', sym: 'bakery', qty: 5, price: 1 });
  assert.match(r.error, /가격은 서버 시세/);
  const before = v.w.ledger.accounts['wallet-' + v.p.id];
  r = await v.act({ kind: 'stock', op: 'buy', sym: 'bakery', qty: 5 });
  assert.equal(r.ok, true, r.error);
  const q = r.stocks.stocks.find((s) => s.sym === 'bakery');
  assert.equal(before - v.w.ledger.accounts['wallet-' + v.p.id], 5 * q.ask + stockFee(5 * q.ask));
  assert.deepEqual(r.stocks.me.positions.map((p) => [p.sym, p.q]), [['bakery', 5]]);
  assert.equal(r.stocks.ranking.length, 1);
  // Selling works from the street too.
  r = await v.act({ kind: 'area', area: 'market', x: 40, y: 40 });
  r = await v.act({ kind: 'stock', op: 'sell', sym: 'bakery', qty: 5 });
  assert.equal(r.ok, true, r.error);
  // After hours: refused.
  v.at(kst(2026, 10, 1, 20, 0));
  await v.run('open', { code: 'BEMTADUVLY' });
  r = await v.act({ kind: 'area', area: 'broker', ...SHOP_INTERIORS.broker.front });
  r = await v.act({ kind: 'stock', op: 'buy', sym: 'bakery', qty: 1 });
  assert.match(r.error, /장이 닫혀/);
});

test('server: a forced sale reaches the village news with the friend’s name', async () => {
  const v = await village(2);
  await v.act({ kind: 'area', area: 'broker', ...SHOP_INTERIORS.broker.front });
  const r = await v.act({ kind: 'stock', op: 'margin', sym: 'forge', qty: 6 });
  assert.equal(r.ok, true, r.error);
  // Make the position deeply under water, as if the price had collapsed.
  v.w.stocks.acct[v.p.id].long.forge.loan = 6 * v.w.stocks.px.forge;
  v.at(kst(2026, 10, 1, 11, 2));
  await v.act({ kind: 'area', area: 'market', x: 41, y: 40 });
  assert.equal(v.w.stocks.acct[v.p.id].long.forge, undefined, 'sold');
  const lines = v.w.life.news.find((d) => d.day === kstDay(kst(2026, 10, 1, 11, 2))).lines.filter((l) => l.kind === 'stock');
  assert.ok(lines.some((l) => l.text.includes('민서') && l.text.includes('반대매매')), JSON.stringify(lines));
});

import { economyReport, formatEconomyReport } from '../app/lounge-economy-report.ts';

test('economy report: the market’s money is in the house totals and its own tables', async () => {
  const v = await village(1);
  await v.act({ kind: 'area', area: 'broker', ...SHOP_INTERIORS.broker.front });
  assert.equal((await v.act({ kind: 'stock', op: 'buy', sym: 'casino', qty: 2 })).ok, true);
  const report = economyReport({ state: v.w, now: kst(2026, 10, 1, 11) });
  assert.equal(report.totals.invariantOk, true);
  assert.equal(report.totals.marketNet, v.w.ledger.marketNet);
  assert.ok(report.totals.marketNet > 0);
  assert.equal(report.stocks.accounts.length, 1);
  assert.ok(report.stocks.totals.fee > 0);
  assert.ok(report.flows.sinks.some((f) => f.reason === 'stock-fee' && f.label === '주식 수수료'));
  const text = formatEconomyReport(report);
  assert.match(text, /범마을 증권: 계정별/);
  assert.match(text, /하우스 중 증권 순액/);
  assert.ok(!text.includes(v.w.stocks.seed), 'the report never prints the seed');
});

import { districtMinimap } from '../app/lounge-district-minimap.ts';
import { districtCounters } from '../app/lounge-district-counters.ts';
import { regionWalk } from '../app/lounge-areas.ts';

test('범마을 증권 stands in 시장 거리: a walkable door, a room behind it, a pin on the minimap', () => {
  const map = districtMinimap('market', 4);
  const door = map.places.find((p) => p.id === 'broker');
  assert.ok(door, 'on the minimap');
  assert.equal(door.kind, 'door');
  assert.equal(door.label, '증권사');
  assert.match(door.title, /범마을 증권/);
  const touch = districtCounters('market', 4).find((c) => c.a.kind === 'counter' && c.a.place === 'broker');
  assert.equal(touch.a.enter, 'broker');
  const walk = regionWalk('market');
  assert.ok(walk.canWalk({ x: touch.x, z: touch.z }), 'the door is reachable');
  assert.ok(walk.path({ x: -26, z: -3 }, { x: touch.x, z: touch.z }).length > 0, 'from the road in');
  assert.equal(SHOP_INTERIORS.broker.owner, undefined, 'no resident yet (a seat for one later)');
});
