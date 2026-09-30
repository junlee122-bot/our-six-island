// Games review (2026-09-30): engine fixes, hidden information and the ledger
// invariant around table games in the cloud engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

const T0 = Date.UTC(2026, 8, 30, 3, 0, 0); // Wednesday 12:00 KST
const member = (actor) => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' });
export function harness() {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    now = T0;
  return {
    get world() {
      return world;
    },
    set world(w) {
      world = w;
    },
    get now() {
      return now;
    },
    advance(ms) {
      now += ms;
    },
    async run(p, op, extra = {}) {
      const c = {
          op,
          connection: p.connection,
          code: p.code,
          ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}),
          ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
          ...extra,
        },
        hash = await commandHash(c),
        r = cloudTransition(world, p, c, hash, now);
      world = r.state;
      p.epoch = r.response.epoch;
      if (r.response.code) p.code = r.response.code;
      validateLedger(world.ledger);
      return r;
    },
  };
}
const AREA = { poker: 'casino', blackjack: 'casino', chess: 'casino', seotda: 'lounge', gostop: 'lounge', yacht: 'lounge', liar: 'lounge', liarsbar: 'tavern' };
/** 7 friends in one room; `n` of them start `kind` at `stake`. */
export async function startTable(kind, n, stake, extra = {}) {
  const h = harness(),
    ps = [0, 1, 2, 3, 4, 5, 6].map(member);
  await h.run(ps[0], 'open');
  for (const p of ps.slice(1)) {
    p.code = ps[0].code;
    await h.run(p, 'join');
  }
  for (const p of ps) await h.run(p, 'action', { action: { kind: 'area', area: AREA[kind] } });
  let r = await h.run(ps[0], 'action', { action: { kind: 'invite', game: kind, players: ps.slice(1, n).map((p) => p.id), stake, required: n, ...extra } });
  assert.equal(r.response.ok, true, r.response.error);
  const inv = r.response.packet.invites.at(-1);
  for (const p of ps.slice(1, n)) {
    r = await h.run(p, 'action', { action: { kind: 'reply', id: inv.id, accept: true } });
    assert.equal(r.response.ok, true, r.response.error);
  }
  return { h, ps };
}

test('a broken room refunds a staked 허풍 카드 match instead of leaving it reserved', async () => {
  const { h, ps } = await startTable('liarsbar', 4, 1000);
  const code = ps[0].code,
    id = h.world.rooms[code].snapshot.liarsbar.id;
  assert.equal(h.world.ledger.games[id].state, 'reserved');
  // Corrupt the stored room so LoungeRoom.hosted throws while ticking it.
  const w = structuredClone(h.world);
  w.rooms[code].snapshot.players = null;
  h.world = w;
  const outsider = member(0);
  await h.run(outsider, 'wallet');
  assert.equal(h.world.rooms[code], undefined);
  assert.equal(h.world.ledger.games[id].state, 'void');
  for (const p of ps) assert.equal(h.world.ledger.accounts['wallet-' + p.id], 100000);
});
