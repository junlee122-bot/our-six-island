import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import {
  grantBeom,
  kstDay,
  newLoungeLedger,
  registerWallet,
  reserveGame,
  settleGame,
  spendBeom,
  storeBeom,
  transferBeom,
} from '../app/lounge-economy.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import {
  DAY_KEEP,
  LINE_MAX,
  moneyHint,
  moneyLogView,
  readMoneyLog,
  recordMoney,
} from '../app/lounge-money-log.ts';

const T0 = Date.UTC(2026, 9, 1, 3, 0, 0);
const A = 'wallet-11111111-2222-4333-8444-555555555551',
  B = 'wallet-11111111-2222-4333-8444-555555555552';
const base = () => registerWallet(registerWallet(newLoungeLedger(), A), B);

test('shop, food and income lines come from the ledger entries, named and sorted into categories', () => {
  const before = base();
  let after = spendBeom(before, A, 30_000, 'life-buy-1', T0, 'buy-palette-pastel');
  after = spendBeom(after, A, 1_500, 'life-bake-1', T0, 'bakery');
  after = grantBeom(after, A, 400, 'life-sell-1', T0, 'sell-tomato');
  after = grantBeom(after, A, 400, 'life-sell-2', T0, 'sell-tomato');
  const log = recordMoney({}, before, after, T0, null);
  const lines = log['11111111-2222-4333-8444-555555555551'].lines;
  assert.deepEqual(
    lines.map((l) => [l.label, l.amount, l.cat]),
    [
      ['상점: 파스텔 팔레트', -30_000, 'shop'],
      ['빵집 음식', -1_500, 'food'],
      ['토마토 판매', 800, 'income'],
    ],
  );
  assert.equal(log['11111111-2222-4333-8444-555555555552'], undefined, 'a wallet that did not move gets no line');
  const view = moneyLogView(log, '11111111-2222-4333-8444-555555555551', T0);
  assert.equal(view.lines[0].label, '토마토 판매', 'newest first');
  assert.equal(view.summary.today.spent, 31_500);
  assert.equal(view.summary.today.earned, 800);
  assert.deepEqual(view.summary.week.cats.map((c) => c.cat), ['shop', 'food', 'income']);
});

test('table stakes, the bank vault and a loan between friends are each accounted for', () => {
  const start = base();
  // A table: the stake is held, then paid back with the result.
  const held = reserveGame(start, 'm-1', 'poker', [A, B], [10_000, 10_000]);
  let log = recordMoney({}, start, held, T0, null);
  assert.deepEqual(log['11111111-2222-4333-8444-555555555551'].lines.map((l) => [l.label, l.amount]), [['텍사스 홀덤 판돈', -10_000]]);
  const done = settleGame(held, 'm-1', [6_000, -6_000]);
  log = recordMoney(log, held, done, T0 + 1, null);
  assert.deepEqual(log['11111111-2222-4333-8444-555555555551'].lines.at(-1), { at: T0 + 1, amount: 16_000, cat: 'game', label: '텍사스 홀덤 정산' });
  assert.deepEqual(log['11111111-2222-4333-8444-555555555552'].lines.at(-1).amount, 4_000);
  // Net over the game: +6,000 for A, −6,000 for B.
  assert.equal(moneyLogView(log, '11111111-2222-4333-8444-555555555551', T0).summary.today.earned - moneyLogView(log, '11111111-2222-4333-8444-555555555551', T0).summary.today.spent, 6_000);
  assert.equal(moneyLogView(log, '11111111-2222-4333-8444-555555555552', T0).summary.today.earned - moneyLogView(log, '11111111-2222-4333-8444-555555555552', T0).summary.today.spent, -6_000);
  // The vault: a line, but not spending.
  const stored = storeBeom(done, A, 5_000);
  log = recordMoney(log, done, stored, T0 + 2, null);
  assert.deepEqual(log['11111111-2222-4333-8444-555555555551'].lines.at(-1), { at: T0 + 2, amount: -5_000, cat: 'bank', label: '은행 보관함에 맡김' });
  assert.equal(moneyLogView(log, '11111111-2222-4333-8444-555555555551', T0).summary.today.cats.find((c) => c.cat === 'bank'), undefined);
  // A loan accepted: both wallets, named after the command.
  const lent = transferBeom(stored, B, A, 2_000);
  log = recordMoney(log, stored, lent, T0 + 3, moneyHint({ kind: 'finance', op: 'accept', id: 'x' }));
  assert.deepEqual(log['11111111-2222-4333-8444-555555555551'].lines.at(-1), { at: T0 + 3, amount: 2_000, cat: 'friend', label: '친구 사이 대출' });
  assert.deepEqual(log['11111111-2222-4333-8444-555555555552'].lines.at(-1), { at: T0 + 3, amount: -2_000, cat: 'friend', label: '친구 사이 대출' });
});

test('the log stays small: newest lines and days are kept, broken data is dropped', () => {
  let ledger = base(),
    log = {};
  for (let i = 0; i < LINE_MAX + 40; i++) {
    const next = spendBeom(ledger, A, 10, `life-x-${i}`, T0 + i * 86_400_000, 'bakery');
    log = recordMoney(log, ledger, next, T0 + i * 86_400_000, null);
    ledger = next;
  }
  assert.equal(log['11111111-2222-4333-8444-555555555551'].lines.length, LINE_MAX);
  assert.equal(Object.keys(log['11111111-2222-4333-8444-555555555551'].days).length, DAY_KEEP);
  assert.equal(Object.keys(log['11111111-2222-4333-8444-555555555551'].days).at(-1), String(kstDay(T0 + (LINE_MAX + 39) * 86_400_000)));
  const read = readMoneyLog({ '11111111-2222-4333-8444-555555555551': { lines: [{ at: 1, amount: 'x', cat: 'food', label: 'a' }, { at: 2, amount: -3, cat: 'nope', label: 'b' }, { at: 3, amount: -3, cat: 'food', label: 'c' }], days: { 20000: { food: [0, 3], bad: [1, 1] }, x: {} } }, junk: 5 });
  assert.deepEqual(read, { '11111111-2222-4333-8444-555555555551': { lines: [{ at: 3, amount: -3, cat: 'food', label: 'c' }], days: { 20000: { food: [0, 3] } } } });
  assert.equal(JSON.stringify(log).length < 16_000, true, `${JSON.stringify(log).length} bytes for one friend`);
});

test('a purchase through the cloud engine shows up in the bank’s 범 내역', async () => {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const me = { id: crypto.randomUUID(), actor: 0, username: ACCOUNT_IDS[0], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' };
  const run = async (op, extra = {}) => {
    const command = { op, connection: me.connection, ...(me.code ? { code: me.code } : {}), requestId: crypto.randomUUID(), sequence: ++me.sequence, ...(op === 'open' ? { epoch: me.epoch } : {}), ...extra };
    const r = cloudTransition(world, me, command, await commandHash(command), T0);
    world = r.state;
    me.epoch = r.response.epoch;
    if (r.response.code) me.code = r.response.code;
    return r.response;
  };
  const opened = await run('open');
  assert.deepEqual(opened.moneyLog.lines, []);
  await run('action', { action: { kind: 'area', area: 'market', x: 0, y: 0 } });
  const bought = await run('action', { action: { kind: 'buy', item: 'palette-pastel', at: 'general' } });
  assert.equal(bought.ok, true, bought.error);
  assert.deepEqual(bought.moneyLog.lines.map((l) => [l.label, l.amount, l.cat]), [['상점: 파스텔 팔레트', -30_000, 'shop']]);
  assert.equal(bought.moneyLog.summary.today.spent, 30_000);
  // A refused purchase writes nothing.
  const again = await run('action', { action: { kind: 'buy', item: 'palette-pastel', at: 'general' } });
  assert.equal(again.ok, false);
  assert.equal(again.moneyLog.lines.length, 1);
});
