import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_BEOM,
  newLoungeLedger,
  registerWallet,
  reserveGame,
  settleGame,
  voidGame,
  validateLedger,
  readLoungeLedger,
  chessBeomResult,
  goBeomResult,
} from '../app/lounge-economy.ts';
const wallets = ['a', 'b', 'c'].map((s) => 'wallet-' + s.repeat(24));
const fresh = () => wallets.reduce(registerWallet, newLoungeLedger());
test('initial grant is 100,000 per wallet and repeated registration never remints', () => {
  const ledger = fresh();
  assert.deepEqual(Object.values(ledger.accounts), [100000, 100000, 100000]);
  assert.equal(INITIAL_BEOM, 100000);
  assert.equal(registerWallet(ledger, wallets[0]), ledger);
  assert.equal(
    registerWallet(readLoungeLedger(JSON.stringify(ledger)), wallets[0])
      .accounts[wallets[0]],
    100000,
  );
});
test('all minigames reserve and settle against the same balance', () => {
  let l = fresh();
  l = reserveGame(l, 'chess-1', 'chess', wallets.slice(0, 2), [1000, 1000]);
  l = settleGame(l, 'chess-1', chessBeomResult('w', 1000));
  l = reserveGame(l, 'go-1', 'gostop', wallets, [5000, 5000, 5000]);
  l = settleGame(l, 'go-1', goBeomResult([-4, 8, -4], 100, [5000, 5000, 5000]));
  l = reserveGame(l, 'poker-1', 'poker', wallets, [10000, 10000, 10000]);
  l = settleGame(l, 'poker-1', [-10000, 15000, -5000]);
  assert.deepEqual(
    wallets.map((w) => l.accounts[w]),
    [90600, 114800, 94600],
  );
  validateLedger(l);
});
test('duplicate settlement is idempotent and conflicting settlement is rejected', () => {
  let l = reserveGame(fresh(), 'once', 'poker', wallets, [1000, 1000, 1000]);
  l = settleGame(l, 'once', [-1000, 2000, -1000]);
  assert.equal(settleGame(l, 'once', [-1000, 2000, -1000]), l);
  assert.throws(() => settleGame(l, 'once', [0, 0, 0]));
  assert.throws(() => voidGame(l, 'once'));
  assert.throws(() =>
    reserveGame(l, 'once', 'poker', wallets, [1000, 1000, 1000]),
  );
});
test('reservation prevents overspending and errors leave the original intact', () => {
  const l = reserveGame(
    fresh(),
    'reserved',
    'poker',
    wallets,
    [90000, 90000, 90000],
  );
  const before = structuredClone(l);
  assert.throws(() =>
    reserveGame(l, 'second', 'chess', wallets.slice(0, 2), [20000, 20000]),
  );
  assert.throws(() => settleGame(l, 'reserved', [-90001, 90001, 0]));
  assert.throws(() => settleGame(l, 'reserved', [-100, 100, 1]));
  assert.throws(() =>
    reserveGame(l, 'invalid', 'chess', [wallets[0], wallets[0]], [1, 1]),
  );
  assert.deepEqual(l, before);
});
test('draw and void return deposits once; a reload retains the transaction IDs', () => {
  let l = reserveGame(
    fresh(),
    'draw',
    'chess',
    wallets.slice(0, 2),
    [10000, 10000],
  );
  l = settleGame(l, 'draw', chessBeomResult('draw', 10000));
  l = reserveGame(l, 'void', 'gostop', wallets, [10000, 10000, 10000]);
  l = voidGame(l, 'void');
  l = readLoungeLedger(JSON.stringify(l));
  assert.equal(voidGame(l, 'void'), l);
  assert.deepEqual(Object.values(l.accounts), [100000, 100000, 100000]);
});
test('Go-Stop charges each loser only up to the agreed loss limit', () => {
  assert.deepEqual(
    goBeomResult([120, -40, -80], 100, [5000, 3000, 6000]),
    [9000, -3000, -6000],
  );
  assert.deepEqual(goBeomResult([0, 0, 0], 100, [5000, 5000, 5000]), [0, 0, 0]);
  assert.throws(() => goBeomResult([2, 2, -4], 100, [5000, 5000, 5000]));
});
test('damaged or altered storage fails closed rather than granting new balances', () => {
  assert.equal(readLoungeLedger(null), null);
  for (const raw of ['', '{}', '{"version":2}', '{bad'])
    assert.throws(() => readLoungeLedger(raw));
  const l = fresh();
  l.accounts[wallets[0]]++;
  assert.throws(() => readLoungeLedger(JSON.stringify(l)));
  assert.throws(() => registerWallet(fresh(), '__proto__'));
  assert.throws(() =>
    reserveGame(fresh(), null, 'chess', wallets.slice(0, 2), [1, 1]),
  );
  assert.throws(() =>
    reserveGame(fresh(), 123, 'chess', wallets.slice(0, 2), [1, 1]),
  );
  assert.throws(() =>
    reserveGame(fresh(), 'nested', 'chess', [wallets[0], [wallets[0]]], [1, 1]),
  );
  const nested = reserveGame(
    fresh(),
    'nested',
    'chess',
    wallets.slice(0, 2),
    [1, 1],
  );
  nested.games.nested.wallets[0] = [wallets[0]];
  assert.throws(() => readLoungeLedger(JSON.stringify(nested)));
});
