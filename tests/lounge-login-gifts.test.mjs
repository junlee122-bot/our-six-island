import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  applyLoginGifts, completeLoginGifts, LoginGiftError, LOGIN_GIFT_CAS_ATTEMPTS,
} from '../app/lounge-login-gifts.ts';
import {
  newLoungeLedger, registerWallet, grantBeom, storeBeom, validateLedger,
} from '../app/lounge-economy.ts';
import { readLife, ensureLifeMember, MAIL_MAX } from '../app/lounge-life.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';

// Synthetic members only: no application account, password, token or network.
const NOW = Date.UTC(2026, 8, 28, 12);
const alice = { id: 'aaaaaaaa-1111-4444-8888-aaaaaaaaaaaa', actor: 0 };
const bob = { id: 'bbbbbbbb-2222-4444-8888-bbbbbbbbbbbb', actor: 1 };
const wallet = (member) => 'wallet-' + member.id;
const gift = (overrides = {}) => ({
  uid: alice.id, amount: 200_000, title: '테스트 로그인 선물', armedAt: NOW - 1_000,
  ...overrides,
});
function fixture() {
  let ledger = registerWallet(newLoungeLedger(), wallet(alice));
  ledger = registerWallet(ledger, wallet(bob));
  const life = ensureLifeMember(ensureLifeMember(readLife(null), alice.id, 0), bob.id, 1);
  return { schema: 1, ledger, rooms: {}, receipts: {}, life,
    loginGifts: { 'synthetic-gift-1': gift() },
    futureExtension: { preserve: ['unrelated', 'data'] },
  };
}
function storeOf(initial = fixture()) {
  let row = { revision: 40, now: NOW, state: structuredClone(initial) };
  const counts = { reads: 0, commits: 0, conflicts: 0, sleeps: [] };
  const store = {
    read: async () => { counts.reads++; return structuredClone(row); },
    commit: async (revision, state) => {
      counts.commits++;
      if (revision !== row.revision) { counts.conflicts++; return null; }
      row = { ...row, revision: row.revision + 1, state: structuredClone(state) };
      return row.revision;
    },
    sleep: async (ms) => { counts.sleeps.push(ms); },
  };
  return { store, counts, get row() { return row; }, set row(value) { row = value; } };
}

test('login gift atomically updates money, grant accounting, delivery marker and non-reward mail', () => {
  const world = fixture(), before = structuredClone(world);
  const result = applyLoginGifts(world, alice, NOW), next = result.state;
  assert.equal(result.changed, true);
  assert.deepEqual(result.delivered, ['synthetic-gift-1']);
  assert.deepEqual(world, before, 'the original world must stay immutable');
  assert.equal(next.ledger.accounts[wallet(alice)], 300_000);
  assert.equal(next.ledger.accounts[wallet(bob)], 100_000);
  assert.equal(next.ledger.granted, 200_000);
  assert.equal(next.ledger.revision, before.ledger.revision + 1);
  assert.equal(next.ledger.houseBalance, before.ledger.houseBalance);
  assert.deepEqual(next.ledger.games, before.ledger.games);
  assert.equal(next.ledger.flows.total.g['grant-other'], 200_000);
  assert.deepEqual(next.futureExtension, before.futureExtension);
  const record = next.loginGifts['synthetic-gift-1'];
  assert.equal(record.deliveredAt, NOW);
  assert.equal(record.ledgerEntryId, 'login-gift-synthetic-gift-1');
  assert.equal(next.ledger.entries.at(-1).reason, gift().title);
  const notice = next.life.mail[alice.id][0];
  assert.equal(notice.from, alice.id);
  assert.equal(notice.actor, alice.actor);
  assert.equal(notice.read, false);
  assert.ok(notice.text.includes(gift().title));
  assert.ok(notice.text.includes('200,000범'));
  assert.equal('gift' in notice, false, 'mail must never grant money a second time');
  assert.deepEqual(readLife(next.life).mail[alice.id][0], notice);
  validateLedger(next.ledger);
});

test('other members, future gifts and worlds without pending gifts remain unchanged', () => {
  const world = fixture();
  assert.equal(applyLoginGifts(world, bob, NOW).state, world);
  world.loginGifts['synthetic-gift-1'].armedAt = NOW + 1;
  assert.equal(applyLoginGifts(world, alice, NOW).state, world);
  delete world.loginGifts;
  assert.equal(applyLoginGifts(world, alice, NOW).changed, false);
});

test('invalid amounts, malformed metadata and missing wallets never mutate a world', () => {
  for (const value of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '200000', null]) {
    const world = fixture();
    world.loginGifts['synthetic-gift-1'].amount = value;
    const before = structuredClone(world);
    assert.throws(() => applyLoginGifts(world, alice, NOW), LoginGiftError);
    assert.deepEqual(world, before);
  }
  for (const overrides of [
    { title: '' }, { title: 'x'.repeat(41) }, { title: 'bad\ntitle' },
    { armedAt: -1 }, { deliveredAt: null }, { deliveredAt: NOW },
    { ledgerEntryId: 'unmatched' }, { deliveredAt: NOW, ledgerEntryId: 'wrong' },
  ]) {
    const world = fixture();
    world.loginGifts['synthetic-gift-1'] = gift(overrides);
    assert.throws(() => applyLoginGifts(world, alice, NOW), LoginGiftError);
  }
  const world = fixture();
  world.ledger = registerWallet(newLoungeLedger(), wallet(bob));
  assert.throws(() => applyLoginGifts(world, alice, NOW), (e) => e.reason === 'missing_wallet');
  assert.equal(world.ledger.accounts[wallet(alice)], undefined);
});

test('safe-integer accounting overflow fails before any original mutation', () => {
  const world = fixture();
  world.loginGifts['synthetic-gift-1'] = gift({ amount: Number.MAX_SAFE_INTEGER, title: '선물' });
  const before = structuredClone(world);
  assert.throws(() => applyLoginGifts(world, alice, NOW));
  assert.deepEqual(world, before);
});

test('a bad second gift cannot partially deliver a valid first gift', () => {
  const world = fixture();
  world.loginGifts.second = gift({ amount: -50 });
  const before = structuredClone(world);
  assert.throws(() => applyLoginGifts(world, alice, NOW));
  assert.deepEqual(world, before);
});

test('multiple runtime-configured gifts deliver once and respect mailbox capacity', () => {
  const world = fixture();
  world.loginGifts.second = gift({ amount: 701, title: '별도의 선물' });
  world.life.mail[alice.id] = Array.from({ length: MAIL_MAX }, (_, i) => ({
    id: 'old-' + i, from: bob.id, actor: 1, text: '기존 우편', at: NOW - i - 1, read: true,
  }));
  const next = applyLoginGifts(world, alice, NOW).state;
  assert.equal(next.ledger.accounts[wallet(alice)], 300_701);
  assert.equal(next.ledger.granted, 200_701);
  assert.equal(next.life.mail[alice.id].length, MAIL_MAX);
  assert.equal(next.life.mail[alice.id].at(-1).id, 'login-gift-second');
  assert.equal(applyLoginGifts(next, alice, NOW + 1).state, next);
});

test('permanent delivery marker prevents regrant after receipt, ledger-entry and mailbox trimming', () => {
  const world = applyLoginGifts(fixture(), alice, NOW).state;
  for (let i = 0; i < 205; i++)
    world.ledger = grantBeom(world.ledger, wallet(bob), 1, 'subsequent-' + i, NOW + i + 1, 'test');
  assert.equal(world.ledger.entries.some((e) => e.id === 'login-gift-synthetic-gift-1'), false);
  world.life.mail[alice.id] = [];
  world.receipts = {};
  const before = structuredClone(world);
  assert.equal(applyLoginGifts(world, alice, NOW + 10_000).changed, false);
  assert.deepEqual(world, before);
  assert.equal(world.ledger.accounts[wallet(alice)], 300_000);
});

test('simultaneous authenticated logins commit one payout after a real CAS conflict', async () => {
  const h = storeOf();
  const [one, two] = await Promise.all([
    completeLoginGifts('login', alice, h.store),
    completeLoginGifts('login', alice, h.store),
  ]);
  assert.equal(h.counts.conflicts, 1);
  assert.equal(h.row.revision, 41);
  assert.equal(one.state.ledger.accounts[wallet(alice)], 300_000);
  assert.equal(two.state.ledger.accounts[wallet(alice)], 300_000);
  assert.equal(h.row.state.ledger.granted, 200_000);
  assert.equal(h.row.state.life.mail[alice.id].length, 1);
});

test('CAS retry recomputes from the newest world and preserves an intervening bank deposit', async () => {
  const h = storeOf(), commit = h.store.commit;
  h.store.commit = async (revision, state) => {
    if (h.row.revision === 40) {
      h.row = { ...h.row, revision: 41, state: { ...h.row.state,
        ledger: storeBeom(h.row.state.ledger, wallet(bob), 1_000),
      } };
    }
    return commit(revision, state);
  };
  const result = await completeLoginGifts('login', alice, h.store);
  assert.equal(h.counts.conflicts, 1);
  assert.equal(result.revision, 42);
  assert.equal(result.state.ledger.accounts[wallet(bob)], 99_000);
  assert.equal(result.state.ledger.vault[wallet(bob)], 1_000);
  assert.equal(result.state.ledger.granted, 200_000);
  validateLedger(result.state.ledger);
});

test('lost successful commit response can be retried without another grant or mail', async () => {
  const h = storeOf(), commit = h.store.commit;
  h.store.commit = async (revision, state) => {
    await commit(revision, state);
    throw new Error('synthetic lost response');
  };
  await assert.rejects(completeLoginGifts('login', alice, h.store), /lost response/);
  h.store.commit = commit;
  const result = await completeLoginGifts('login', alice, h.store);
  assert.equal(result.revision, 41);
  assert.equal(result.state.ledger.granted, 200_000);
  assert.equal(result.state.life.mail[alice.id].length, 1);
});

test('bounded CAS exhaustion leaves the pending gift available for a later login', async () => {
  const h = storeOf(), before = structuredClone(h.row);
  let attempts = 0;
  h.store.commit = async () => { attempts++; return null; };
  await assert.rejects(completeLoginGifts('login', alice, h.store), (e) => e.reason === 'cas_exhausted');
  assert.equal(attempts, LOGIN_GIFT_CAS_ATTEMPTS);
  assert.equal(h.counts.sleeps.length, LOGIN_GIFT_CAS_ATTEMPTS - 1);
  assert.deepEqual(h.row, before);
});

test('refresh, profile, open/read, activation and credential maintenance do not claim gifts', async () => {
  for (const op of ['refresh', 'profile', 'open', 'read', 'activate', 'recover', 'password', 'logout', '']) {
    const h = storeOf(), before = structuredClone(h.row);
    await completeLoginGifts(op, alice, h.store);
    assert.equal(h.counts.reads, 1);
    assert.equal(h.counts.commits, 0);
    assert.deepEqual(h.row, before);
  }
});

test('ordinary cloud entry preserves pending gifts and never pays them', async () => {
  const world = fixture(), command = {
    op: 'open', connection: crypto.randomUUID(), requestId: crypto.randomUUID(), sequence: 1, epoch: 0,
  };
  const result = cloudTransition(world, { ...alice, username: 'dowon' }, command, await commandHash(command), NOW);
  assert.equal(result.response.ok, true);
  assert.deepEqual(result.state.loginGifts, world.loginGifts);
  assert.equal(result.state.ledger.accounts[wallet(alice)], 100_000);
  assert.equal(result.state.ledger.granted ?? 0, 0);
  assert.equal('loginGifts' in result.response, false, 'private pending records are never sent to clients');
});

test('auth uses verified member identity and completes gifts before returning success', () => {
  const source = readFileSync(new URL('../supabase/functions/hohyeon-auth/index.ts', import.meta.url), 'utf8');
  const verifyAt = source.indexOf('if (data.user.id !== m.user_id)');
  const giftAt = source.indexOf('completeLoginGifts(op, { id: m.user_id, actor: m.actor }');
  const returnAt = source.indexOf('access_token: data.session.access_token', giftAt);
  assert.ok(verifyAt > 0 && giftAt > verifyAt && returnAt > giftAt);
  assert.doesNotMatch(source.slice(giftAt, returnAt), /\bb\.(uid|actor|amount|title|gift)/);
});
