import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadWalletIdentity,
  proveWallet,
  verifyWallet,
  LoungeBank,
  BEOM_STORAGE_KEY,
} from '../app/lounge-wallet.ts';
import {
  registerWallet,
  reserveGame,
  settleGame,
} from '../app/lounge-economy.ts';
const wallets = ['wallet-' + 'a'.repeat(24), 'wallet-' + 'b'.repeat(24)];
test('wallet proof binds permanent key to this room, peer and fresh nonce', async () => {
  const identity = await loadWalletIdentity(),
    other = await loadWalletIdentity();
  const proof = await proveWallet(identity, 'ROOM', 'peer-one', 'nonce-one');
  assert.equal(
    await verifyWallet(proof, 'ROOM', 'peer-one', 'nonce-one'),
    identity.id,
  );
  assert.equal(
    await verifyWallet(proof, 'OTHER', 'peer-one', 'nonce-one'),
    null,
  );
  assert.equal(
    await verifyWallet(proof, 'ROOM', 'peer-two', 'nonce-one'),
    null,
  );
  assert.equal(
    await verifyWallet(proof, 'ROOM', 'peer-one', 'nonce-two'),
    null,
  );
  assert.equal(
    await verifyWallet(
      { ...proof, key: other.key },
      'ROOM',
      'peer-one',
      'nonce-one',
    ),
    null,
  );
  const again = await proveWallet(identity, 'ROOM', 'peer-two', 'nonce-two');
  assert.equal(
    await verifyWallet(again, 'ROOM', 'peer-two', 'nonce-two'),
    identity.id,
  );
});
test('storage commits before publication, detects other writers and refunds only unfinished games', () => {
  const data = new Map();
  let denied = false;
  const storage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      if (denied) throw new Error('quota');
      data.set(k, v);
    },
  };
  const bank = new LoungeBank(storage);
  for (const w of wallets) bank.commit(registerWallet(bank.ledger, w));
  bank.commit(
    reserveGame(bank.ledger, 'finished', 'chess', wallets, [1000, 1000]),
  );
  bank.commit(settleGame(bank.ledger, 'finished', [1000, -1000]));
  bank.commit(
    reserveGame(bank.ledger, 'interrupted', 'poker', wallets, [10000, 10000]),
  );
  const loaded = new LoungeBank(storage);
  loaded.recover();
  assert.equal(loaded.ledger.games.finished.state, 'settled');
  assert.equal(loaded.ledger.games.interrupted.state, 'void');
  assert.deepEqual(
    wallets.map((w) => loaded.view(w).balance),
    [101000, 99000],
  );
  assert.throws(
    () => bank.commit(settleGame(bank.ledger, 'interrupted', [-10000, 10000])),
    /다른 창/,
  );
  const before = loaded.ledger;
  denied = true;
  assert.throws(
    () =>
      loaded.commit(
        reserveGame(before, 'quota', 'chess', wallets, [1000, 1000]),
      ),
    /quota/,
  );
  assert.equal(loaded.ledger, before);
  denied = false;
  data.set(BEOM_STORAGE_KEY, 'broken');
  assert.throws(() => new LoungeBank(storage));
});
