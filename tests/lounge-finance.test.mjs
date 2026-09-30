import test from 'node:test';
import assert from 'node:assert/strict';
import { newLoungeLedger, registerWallet, validateLedger, reserveGame, settleGame, storeBeom, dailyGrantInfo, transferBeom, houseTransfer } from '../app/lounge-economy.ts';
import { ensureLifeMember, readLife } from '../app/lounge-life.ts';
import { collectOverdue, financeAction, financeView, readFinance, recordCasino } from '../app/lounge-finance.ts';
import { CASINO_LENDER_FRONT, CASINO_LENDER_SPOT, CASINO_LENDER_REACH } from '../app/lounge-casino-lender.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
const ids = [0, 1, 2].map((i) => `00000000-0000-4000-8000-00000000000${i}`);
const wallets = ids.map((id) => 'wallet-' + id), now = Date.UTC(2026, 8, 28, 2), day = 86_400_000;
function world() {
  let ledger = newLoungeLedger(), life = readLife(undefined);
  ids.forEach((id, i) => { ledger = registerWallet(ledger, wallets[i]); life = ensureLifeMember(life, id, i); });
  return { state: undefined, ledger, life };
}
const presence = ids.map((id, actor) => ({ id, actor, area: 'village', x: 40 + actor, y: 50 }));
function act(w, who, a, at = now, players = presence, roll = () => 0) {
  const n = financeAction(w.state, w.ledger, w.life, ids[who], { kind: 'finance', ...a }, at, players, roll);
  validateLedger(n.ledger); return n;
}
test('bank reserves deposits without minting; invalid and overdraft operations are atomic', () => {
  const w = world(), initial = structuredClone(w.ledger);
  const n = act(w, 0, { op: 'deposit', amount: 99_000 });
  assert.equal(n.ledger.accounts[wallets[0]], 1000);
  assert.equal(n.ledger.vault[wallets[0]], 99_000);
  assert.equal(dailyGrantInfo(n.ledger, wallets[0], now).amount, 3000);
  const restored = act(n, 0, { op: 'withdraw', amount: 99_000 });
  assert.equal(restored.ledger.accounts[wallets[0]], 100_000);
  for (const bad of [-1, 0, NaN, Infinity, 1.1, Number.MAX_SAFE_INTEGER]) assert.throws(() => storeBeom(w.ledger, wallets[0], bad));
  assert.throws(() => storeBeom(n.ledger, wallets[0], 100_000, true));
  assert.deepEqual(w.ledger, initial);
  assert.throws(() => validateLedger({ ...n.ledger, vault: { [wallets[0]]: 0 } }));
});
test('loans transfer only on borrower acceptance and require each participant authorization', () => {
  const w = world(), offer = act(w, 0, { op: 'offer', to: 1, amount: 10_000, interest: 5, days: 2 });
  assert.deepEqual(offer.ledger, w.ledger);
  const id = offer.state.loans[0].id;
  assert.throws(() => act(offer, 2, { op: 'accept', id }));
  assert.throws(() => act(offer, 0, { op: 'accept', id }));
  assert.throws(() => act(offer, 1, { op: 'accept', id }, now + day));
  const signed = act(offer, 1, { op: 'accept', id });
  assert.equal(signed.ledger.accounts[wallets[0]], 90_000);
  assert.equal(signed.ledger.accounts[wallets[1]], 110_000);
  assert.throws(() => act(signed, 1, { op: 'accept', id }));
  assert.throws(() => act(signed, 0, { op: 'repay', id, amount: 1000 }));
  const part = act(signed, 1, { op: 'repay', id, amount: 500 });
  assert.equal(part.state.loans[0].paid, 500);
  const paid = act(part, 1, { op: 'repay', id, amount: 10_000 });
  assert.equal(paid.state.loans[0].state, 'paid');
  assert.equal(paid.ledger.accounts[wallets[0]], 100_500);
  assert.equal(paid.ledger.accounts[wallets[1]], 99_500);
  assert.throws(() => act(paid, 1, { op: 'repay', id, amount: 1 }));
  assert.equal(financeView(signed.state, signed.ledger, signed.life, ids[2], now).loans.length, 0);
});
test('loan reminders are due-only, lender-only and once per KST day', () => {
  let w = act(world(), 0, { op: 'offer', to: 1, amount: 1000, interest: 0, days: 1 });
  const id = w.state.loans[0].id;
  w = act(w, 1, { op: 'accept', id });
  assert.throws(() => act(w, 0, { op: 'remind', id }));
  assert.throws(() => act(w, 1, { op: 'remind', id }, now + day));
  w = act(w, 0, { op: 'remind', id }, now + day);
  assert.match(financeView(w.state, w.ledger, w.life, ids[1], now + day).logs[0].text, /독촉/);
  assert.throws(() => act(w, 0, { op: 'remind', id }, now + day + 1));
});
test('casino loan is one outstanding fixed-interest contract and preserves the house invariant', () => {
  const casino = presence.map((p) => ({ ...p, ...CASINO_LENDER_FRONT, area: 'casino' }));
  assert.throws(() => act(world(), 0, { op: 'borrow', amount: 10_000 }));
  let w = act(world(), 0, { op: 'borrow', amount: 10_000 }, now, casino);
  assert.equal(w.ledger.houseBalance, -10_000);
  assert.equal(w.ledger.granted ?? 0, 0);
  assert.equal(w.state.loans[0].interest, 3000);
  assert.throws(() => act(w, 0, { op: 'borrow', amount: 1000 }, now, casino));
  w = act(w, 0, { op: 'repay', id: w.state.loans[0].id, amount: 13_000 }, now + 20 * day, casino);
  assert.equal(w.ledger.houseBalance, 3000);
  assert.equal(w.ledger.accounts[wallets[0]], 97_000);
});

test('casino contracts require an idle player at Rosé, while friend repayments remain remote', () => {
  const casino = presence.map((p) => ({ ...p, ...CASINO_LENDER_FRONT, area: 'casino' }));
  const original = world();
  const loan = act(original, 0, { op: 'borrow', amount: 10_000 }, now, casino);
  const id = loan.state.loans[0].id;
  for (const override of [{ area: 'home' }, { x: 15, y: 82 }, { x: NaN }, { y: Infinity }, { busy: true }, { x: CASINO_LENDER_SPOT.x + CASINO_LENDER_REACH + .01, y: CASINO_LENDER_SPOT.y }]) {
    const unavailable = casino.map((p) => p.actor === 0 ? { ...p, ...override } : p);
    const before = structuredClone(loan);
    assert.throws(() => act(original, 0, { op: 'borrow', amount: 1000 }, now, unavailable));
    assert.throws(() => act(loan, 0, { op: 'repay', id, amount: 1000 }, now, unavailable));
    assert.deepEqual(loan, before, 'rejected repayment cannot change a saved debt or ledger');
  }
  const restored = { ...loan, state: readFinance(JSON.parse(JSON.stringify(loan.state))) };
  assert.deepEqual(restored.state.loans[0], loan.state.loans[0]);
  const partlyPaid = act(restored, 0, { op: 'repay', id, amount: 300 }, now + 20 * day, casino);
  assert.deepEqual(partlyPaid.state.loans[0], { ...loan.state.loans[0], paid: 300 });
  const paid = act(partlyPaid, 0, { op: 'repay', id, amount: 12700 }, now + 20 * day, casino);
  assert.equal(paid.state.loans[0].state, 'paid');
  const friend = act(world(), 0, { op: 'offer', to: 1, amount: 1000, interest: 0, days: 1 });
  const signed = act(friend, 1, { op: 'accept', id: friend.state.loans[0].id });
  assert.equal(act(signed, 1, { op: 'repay', id: friend.state.loans[0].id, amount: 1000 }).state.loans[0].state, 'paid');
});
test('robbery targets online nearby friends only, with daily limits and protected deposits', () => {
  let w = world();
  w = act(w, 1, { op: 'deposit', amount: 90_000 });
  const action = { op: 'rob', to: 1, item: 'cash' };
  assert.throws(() => act(w, 0, action, now, presence.slice(0, 1)));
  assert.throws(() => act(w, 0, action, now, presence.map((p) => p.actor === 1 ? { ...p, x: 80 } : p)));
  assert.throws(() => act(w, 0, action, now, presence.map((p) => ({ ...p, busy: true }))));
  const got = act(w, 0, action);
  assert.equal(got.ledger.accounts[wallets[0]], 100_300);
  assert.equal(got.ledger.vault[wallets[1]], 90_000);
  assert.throws(() => act(got, 0, action));
  assert.throws(() => act(got, 2, action));
});
test('robbery preserves crop quality, last furniture copy and property counts', () => {
  let w = world();
  w.life.bag[ids[1]].produce.carrot = 2;
  w.life.ext ??= {}; w.life.ext[ids[1]] = { q2: { carrot: 1 }, furn: { 'furn-chair': 2 } };
  let got = act(w, 0, { op: 'rob', to: 1, item: 'produce' });
  assert.equal(got.life.bag[ids[0]].produce.carrot, 1);
  assert.equal(got.life.bag[ids[1]].produce.carrot, 1);
  assert.equal(got.life.ext[ids[1]].q2.carrot, 1);
  got = act(w, 0, { op: 'rob', to: 1, item: 'furniture' });
  assert.equal(got.life.ext[ids[0]].furn['furn-chair'], 1);
  assert.equal(got.life.ext[ids[1]].furn['furn-chair'], 1);
  assert.equal(got.life.ext[ids[0]].furnStrict['furn-chair'], true);
  assert.equal(got.life.ext[ids[1]].furnStrict['furn-chair'], true);
  assert.equal(got.life.rooms[ids[0]].rev, (w.life.rooms?.[ids[0]]?.rev ?? 0) + 1);
  assert.equal(got.life.rooms[ids[1]].rev, (w.life.rooms?.[ids[1]]?.rev ?? 0) + 1);
  assert.throws(() => act(got, 0, { op: 'rob', to: 1, item: 'furniture' }, now + day));
});

test('purchased locks and whistles stop robbery, charge once and preserve property', () => {
  const original = world(), action = { op: 'rob', to: 1, item: 'cash' };
  const locked = act(original, 1, { op: 'protect', item: 'lock' });
  assert.equal(locked.ledger.accounts[wallets[1]], 98_500);
  assert.equal(locked.state.protection[ids[1]].until, now + day);
  assert.throws(() => act(locked, 1, { op: 'protect', item: 'lock' }));
  const stopped = act(locked, 0, action);
  assert.deepEqual(stopped.ledger, locked.ledger);
  assert.deepEqual(stopped.life, locked.life);
  assert.match(stopped.state.logs.at(-1).text, /자물쇠/);
  assert.throws(() => act(stopped, 2, action));
  const expired = act(locked, 0, action, now + day);
  assert.equal(expired.ledger.accounts[wallets[0]], 102_955);
  let whistled = act(original, 1, { op: 'protect', item: 'whistle' });
  assert.equal(whistled.ledger.accounts[wallets[1]], 99_200);
  const protectedOnce = act(whistled, 0, action);
  assert.equal(protectedOnce.state.protection[ids[1]].whistles, 0);
  assert.deepEqual(protectedOnce.ledger, whistled.ledger);
  assert.match(protectedOnce.state.logs.at(-1).text, /호루라기/);
  whistled = act(whistled, 1, { op: 'protect', item: 'whistle' });
  whistled = act(whistled, 1, { op: 'protect', item: 'whistle' });
  assert.throws(() => act(whistled, 1, { op: 'protect', item: 'whistle' }));
  assert.equal(original.ledger.accounts[wallets[1]], 100_000);
});
test('Lumi stats count paid settlements once and mercy refunds a bounded loss without minting', () => {
  let w = world();
  const before = reserveGame(w.ledger, 'lumi-test', 'blackjack', [wallets[0]], [20_000]);
  w.ledger = settleGame(before, 'lumi-test', [-10_000]);
  w.state = recordCasino(w.state, before, w.ledger, now);
  assert.equal(w.state.casino[0].earned, 10_000);
  assert.equal(recordCasino(w.state, w.ledger, w.ledger, now), w.state);
  const casino = presence.map((p) => ({ ...p, area: 'casino' }));
  const refunded = act(w, 0, { op: 'mercy' }, now, casino);
  assert.equal(refunded.ledger.accounts[wallets[0]], 95_000);
  assert.equal(refunded.ledger.houseBalance, 5000);
  assert.equal(refunded.ledger.granted ?? 0, 0);
  assert.equal(financeView(refunded.state, refunded.ledger, refunded.life, ids[0], now).casino.profit, 5000);
  assert.throws(() => act(refunded, 0, { op: 'mercy' }, now, casino));
  const refused = act(w, 0, { op: 'mercy' }, now, casino, () => .99);
  assert.equal(refused.ledger.accounts[wallets[0]], 90_000);
  assert.throws(() => act(refused, 0, { op: 'mercy' }, now, casino));
});

test('Lumi returns half the net loss without a 10,000 cap and large refunds survive saved-state parsing', () => {
  let w = world();
  for (const [id, stake, result] of [['loss', 60000, -60000], ['win', 10000, 9999]]) {
    const before = reserveGame(w.ledger, id, 'blackjack', [wallets[0]], [stake]);
    w.ledger = settleGame(before, id, [result]);
    w.state = recordCasino(w.state, before, w.ledger, now);
  }
  const casino = presence.map((p) => ({ ...p, area: 'casino' }));
  const refunded = act(w, 0, { op: 'mercy' }, now, casino);
  assert.equal(refunded.state.casino[0].net[wallets[0]], -50001);
  assert.equal(refunded.state.casino[0].mercy[ids[0]], 25000);
  assert.equal(refunded.ledger.accounts[wallets[0]], 74999);
  assert.equal(refunded.ledger.houseBalance, 25001);
  assert.equal(financeView(refunded.state, refunded.ledger, refunded.life, ids[0], now).casino.profit, 25001);
  const restored = { ...refunded, state: readFinance(JSON.parse(JSON.stringify(refunded.state))) };
  assert.equal(restored.state.casino[0].mercy[ids[0]], 25000);
  assert.throws(() => act(restored, 0, { op: 'mercy' }, now, casino));
  assert.throws(() => act(restored, 0, { op: 'mercy' }, now + day, casino), /순손실/);
});

test('cloud lender transactions use server location, preserve legacy debt and replay receipts only once', async () => {
  let state = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const people = [0, 1].map(actor => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), code: '', epoch: 0, sequence: 0 }));
  const [borrower, friend] = people;
  const apply = async (person, command, at = now) => {
    const result = cloudTransition(state, person, command, await commandHash(command), at);
    state = result.state;
    person.epoch = result.response.epoch;
    if (result.response.code) person.code = result.response.code;
    validateLedger(state.ledger);
    assert.equal(Object.values(state.ledger.accounts).reduce((a, b) => a + b, 0) + (state.ledger.houseBalance ?? 0) - (state.ledger.granted ?? 0), Object.keys(state.ledger.accounts).length * 100000);
    return result.response;
  };
  const command = (person, op, extra = {}) => ({ op, connection: person.connection, ...(person.code ? { code: person.code } : {}), ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++person.sequence } : {}), ...(['open', 'join'].includes(op) ? { epoch: person.epoch } : {}), ...extra });
  const run = (person, op, extra = {}) => apply(person, command(person, op, extra));
  const action = (person, a) => run(person, 'action', { action: a });
  assert.equal((await run(borrower, 'open')).ok, true);
  friend.code = borrower.code;
  assert.equal((await run(friend, 'join')).ok, true);
  const borrow = { kind: 'finance', op: 'borrow', amount: 10000 };
  assert.equal((await action(borrower, { ...borrow, area: 'casino', ...CASINO_LENDER_FRONT })).ok, false);
  assert.equal((await action(borrower, { kind: 'area', area: 'casino' })).ok, true);
  assert.equal((await action(borrower, { kind: 'move', x: 15, y: 82 })).ok, true);
  assert.equal((await action(borrower, { ...borrow, ...CASINO_LENDER_FRONT })).ok, false, 'coordinates inside finance payload are not authoritative');
  assert.equal((await action(borrower, { kind: 'move', ...CASINO_LENDER_FRONT })).ok, true);
  const borrowCommand = command(borrower, 'action', { action: borrow });
  const accepted = await apply(borrower, borrowCommand);
  assert.equal(accepted.ok, true, accepted.error);
  const note = structuredClone(accepted.finance.loans[0]);
  assert.equal((await apply(borrower, borrowCommand)).ok, true);
  assert.equal(state.ledger.accounts['wallet-' + borrower.id], 110000);
  assert.equal(state.finance.loans.length, 1);
  assert.deepEqual((await run(friend, 'read')).finance.loans, [], 'another resident cannot see my debt');
  assert.equal((await action(friend, { kind: 'finance', op: 'repay', id: note.id, amount: 1000 })).ok, false);
  assert.equal((await action(borrower, { kind: 'area', area: 'home' })).ok, true);
  assert.equal((await action(borrower, { kind: 'finance', op: 'repay', id: note.id, amount: 1000, area: 'casino', ...CASINO_LENDER_FRONT })).ok, false);
  state = JSON.parse(JSON.stringify(state));
  assert.equal((await action(borrower, { kind: 'area', area: 'casino' })).ok, true);
  assert.equal((await action(borrower, { kind: 'move', ...CASINO_LENDER_FRONT })).ok, true);
  const repayCommand = command(borrower, 'action', { action: { kind: 'finance', op: 'repay', id: note.id, amount: 300 } });
  assert.equal((await apply(borrower, repayCommand)).ok, true);
  assert.equal((await apply(borrower, repayCommand)).ok, true);
  assert.equal(state.finance.loans[0].paid, 300);
  assert.equal(state.finance.loans[0].id, note.id);
  assert.equal(state.finance.loans[0].dueAt, note.dueAt);
  const repaid = await action(borrower, { kind: 'finance', op: 'repay', id: note.id, amount: 12700 });
  assert.equal(repaid.ok, true, repaid.error);
  assert.equal(repaid.finance.loans[0].state, 'paid');
  assert.equal(state.ledger.accounts['wallet-' + borrower.id], 97000);
  assert.equal(state.ledger.houseBalance, 3000);
});
test('newly completed long-running game survives hot-game compaction for daily observers', () => {
  let w = world().ledger;
  w = reserveGame(w, 'old-reservation', 'blackjack', [wallets[0]], [1]);
  for (let i = 0; i < 501; i++) { w = reserveGame(w, `small-${i}`, 'blackjack', [wallets[1]], [0]); w = settleGame(w, `small-${i}`, [0]); }
  const after = settleGame(w, 'old-reservation', [-1]);
  assert.equal(after.games['old-reservation'].state, 'settled');
  assert.equal(recordCasino(undefined, w, after, now).casino[0].earned, 1);
});
test('transfers reject prototype keys and unsafe sums', () => {
  const w = world().ledger;
  assert.throws(() => transferBeom(w, wallets[0], '__proto__', 100));
  assert.throws(() => houseTransfer(w, wallets[0], Number.MAX_SAFE_INTEGER));
  assert.throws(() => houseTransfer(w, wallets[0], -100_001));
});

test('overdue casino loans collect from the wallet, then bank deposits, without minting', () => {
  const casino = presence.map((p, i) => i === 0 ? { ...p, area: 'casino', ...CASINO_LENDER_FRONT } : p);
  let w = act(world(), 0, { op: 'borrow', amount: 10_000 }, now, casino);
  const supply = (l) => Object.values(l.accounts).reduce((a, b) => a + b, 0) + Object.values(l.vault ?? {}).reduce((a, b) => a + b, 0) + (l.houseBalance ?? 0);
  assert.deepEqual(collectOverdue(w.state, w.ledger, ids[0], now + 3 * day - 1), { state: w.state, ledger: w.ledger });
  assert.deepEqual(collectOverdue(w.state, w.ledger, ids[1], now + 4 * day).ledger, w.ledger);
  w = act(w, 0, { op: 'deposit', amount: 110_000 });
  const before = supply(w.ledger), c = collectOverdue(w.state, w.ledger, ids[0], now + 3 * day);
  validateLedger(c.ledger);
  assert.equal(supply(c.ledger), before);
  assert.equal(c.ledger.accounts[wallets[0]], 0);
  assert.equal(c.ledger.vault[wallets[0]], 110_000 - 13_000);
  assert.equal(c.state.loans[0].state, 'paid');
  assert.match(c.state.logs.at(-1).text, /연체 회수 · 13,000범 \(은행 예금 13,000범 포함\) · 완납/);
  assert.deepEqual(collectOverdue(c.state, c.ledger, ids[0], now + 5 * day), { state: c.state, ledger: c.ledger });
  const poor = act(world(), 0, { op: 'borrow', amount: 10_000 }, now, casino);
  const part = collectOverdue(poor.state, transferBeom(poor.ledger, wallets[0], wallets[1], 106_000), ids[0], now + 3 * day);
  assert.equal(part.ledger.accounts[wallets[0]], 0);
  assert.equal(part.state.loans[0].paid, 4_000);
  assert.equal(part.state.loans[0].state, 'active');
});
