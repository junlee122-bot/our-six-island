import test from 'node:test';
import assert from 'node:assert/strict';
import { newLoungeLedger, registerWallet, validateLedger, reserveGame, settleGame, storeBeom, dailyGrantInfo, transferBeom, houseTransfer } from '../app/lounge-economy.ts';
import { ensureLifeMember, readLife } from '../app/lounge-life.ts';
import { financeAction, financeView, recordCasino } from '../app/lounge-finance.ts';
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
  const casino = presence.map((p) => ({ ...p, area: 'casino' }));
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
  assert.equal(refunded.ledger.accounts[wallets[0]], 92_000);
  assert.equal(refunded.ledger.houseBalance, 8000);
  assert.equal(refunded.ledger.granted ?? 0, 0);
  assert.equal(financeView(refunded.state, refunded.ledger, refunded.life, ids[0], now).casino.profit, 8000);
  assert.throws(() => act(refunded, 0, { op: 'mercy' }, now, casino));
  const refused = act(w, 0, { op: 'mercy' }, now, casino, () => .99);
  assert.equal(refused.ledger.accounts[wallets[0]], 90_000);
  assert.throws(() => act(refused, 0, { op: 'mercy' }, now, casino));
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
