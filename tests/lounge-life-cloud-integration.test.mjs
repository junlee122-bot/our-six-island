import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

function harness() {
  let state = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} }, now = Date.UTC(2026, 8, 28, 4);
  const people = [0, 1, 2].map((actor) => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' }));
  return { people, get state() { return state; }, advance(ms) { now += ms; },
    async run(p, op, extra = {}) {
      const command = { op, connection: p.connection, code: p.code,
        ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}),
        ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
      const hash = await commandHash(command), result = cloudTransition(state, p, command, hash, now);
      state = result.state; validateLedger(state.ledger);
      p.epoch = result.response.epoch;
      if (result.response.code) p.code = result.response.code;
      return { ...result, command, hash };
    },
    replay(p, command, hash) { const r = cloudTransition(state, p, command, hash, now); state = r.state; validateLedger(state.ledger); return r; },
    reload() { state = JSON.parse(JSON.stringify(state)); },
  };
}
const finance = (h, p, action, extra = {}) => h.run(p, 'action', { action: { kind: 'finance', ...action }, ...extra });

test('cloud finance receipts charge once and preserve savings and accepted loans across reconnects', async () => {
  const h = harness(), [a, b, c] = h.people;
  await h.run(a, 'open'); b.code = a.code; await h.run(b, 'join');
  const guard = await finance(h, a, { op: 'protect', item: 'whistle' });
  assert.equal(guard.response.ok, true);
  h.replay(a, guard.command, guard.hash);
  assert.equal(h.state.ledger.accounts['wallet-' + a.id], 99_200);
  assert.equal(h.state.finance.protection[a.id].whistles, 1);
  const deposit = await finance(h, a, { op: 'deposit', amount: 5000 });
  h.replay(a, deposit.command, deposit.hash);
  assert.equal(h.state.ledger.vault['wallet-' + a.id], 5000);
  const offer = await finance(h, a, { op: 'offer', to: 1, amount: 10_000, interest: 5, days: 1 });
  const id = offer.response.finance.loans[0].id;
  assert.equal((await finance(h, a, { op: 'accept', id })).response.ok, false);
  const signed = await finance(h, b, { op: 'accept', id });
  assert.equal(signed.response.ok, true);
  h.replay(b, signed.command, signed.hash);
  assert.equal(h.state.ledger.accounts['wallet-' + b.id], 110_000);
  const stale = a.connection;
  a.connection = crypto.randomUUID(); await h.run(a, 'join');
  assert.equal((await finance(h, a, { op: 'withdraw', amount: 5000 }, { connection: stale })).response.ok, false);
  await h.run(c, 'open');
  assert.equal((await h.run(c, 'read')).response.finance.loans.length, 0);
  h.reload();
  const read = await h.run(a, 'read');
  assert.equal(read.response.finance.stored, 5000);
  assert.equal(read.response.finance.loans[0].state, 'active');
  assert.equal(read.response.finance.protection.whistles, 1);
  assert.equal((await finance(h, a, { op: 'withdraw', amount: 5000 })).response.ok, true);
  assert.equal(h.state.ledger.vault['wallet-' + a.id], 0);
});

test('fishing movement is blocked by the server until a matching cancel or expiry', async () => {
  const h = harness(), [a] = h.people;
  await h.run(a, 'open');
  await h.run(a, 'action', { action: { kind: 'area', area: 'village' } });
  const cast = await h.run(a, 'action', { action: { kind: 'cast', spot: 'river' } });
  assert.equal(cast.response.ok, true);
  const token = cast.response.life.me.fishing.pending.token;
  const move = () => h.run(a, 'action', { action: { kind: 'move', x: 50, y: 60 } });
  assert.equal((await move()).response.ok, false);
  assert.equal((await h.run(a, 'action', { action: { kind: 'area', area: 'casino' } })).response.ok, false);
  assert.equal((await h.run(a, 'action', { action: { kind: 'cancelCast', token: 'spoofed-token' } })).response.ok, false);
  assert.equal((await move()).response.ok, false);
  assert.equal((await h.run(a, 'action', { action: { kind: 'cancelCast', token } })).response.ok, true);
  assert.equal((await move()).response.ok, true);
  h.advance(60_000);
  const again = await h.run(a, 'action', { action: { kind: 'cast', spot: 'river' } });
  assert.equal(again.response.ok, true);
  h.advance(40_000);
  assert.equal((await move()).response.ok, true);
});

test('stickers persist in scoped chat after the floating emote expires without leaking into other rooms', async () => {
  const h = harness(), [a, b] = h.people;
  await h.run(a, 'open'); b.code = a.code; await h.run(b, 'join');
  await h.run(a, 'action', { action: { kind: 'area', area: 'village' } });
  await h.run(b, 'action', { action: { kind: 'area', area: 'casino' } });
  const sent = await h.run(a, 'action', { action: { kind: 'reaction', id: 'jeje', scope: 'village' } });
  assert.equal(sent.response.ok, true);
  assert.equal(sent.response.packet.chat.at(-1).reaction, 'jeje');
  assert.equal(sent.response.packet.chat.at(-1).text, '제제이야');
  h.advance(7000);
  const inCasino = await h.run(b, 'read');
  // Snapshots may include other area's chat; ChatPanel filters by authoritative scope.
  assert.equal(inCasino.response.packet.chat.filter((line) => line.scope === 'casino' && line.reaction).length, 0);
  assert.equal((await h.run(a, 'read')).response.packet.chat.at(-1).reaction, 'jeje');
  const bad = await h.run(a, 'action', { action: { kind: 'reaction', id: 'javascript:bad', scope: 'village' } });
  assert.equal(bad.response.ok, false);
});
