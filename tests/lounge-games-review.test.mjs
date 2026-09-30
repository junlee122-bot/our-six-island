// Games review (2026-09-30): engine fixes, hidden information and the ledger
// invariant around table games in the cloud engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash, CLOUD_LEASE_MS } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { keepUnchanged, sameTableProps } from '../app/lounge-view-share.ts';

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

test('an unchanged life view is not resent; the packet no longer repeats it', async () => {
  const { h, ps } = await startTable('poker', 3, 10000);
  // A life action stores growth's one-time fields (a never-written member's
  // view is stamped with the current time until then).
  await h.run(ps[4], 'action', { action: { kind: 'status', text: '구경 중' } });
  const first = await h.run(ps[4], 'read');
  assert.ok(first.response.life, 'first read carries the life view');
  assert.equal(first.response.packet.life, undefined);
  assert.equal(typeof first.response.lifeHash, 'string');
  h.advance(8000);
  const again = await h.run(ps[4], 'read', { lifeHash: first.response.lifeHash });
  assert.equal(again.response.lifeHash, first.response.lifeHash, 'a poll 8 s later sees the same life view');
  assert.equal(again.response.life, undefined);
  const stale = await h.run(ps[4], 'read', { lifeHash: 'old' });
  assert.deepEqual({ ...stale.response.life, serverNow: 0 }, { ...first.response.life, serverNow: 0 });
  const bytes = (o) => JSON.stringify(o).length;
  assert.ok(bytes(again.response) * 3 < bytes(first.response), `${bytes(again.response)} vs ${bytes(first.response)}`);
});

test('keepUnchanged keeps equal matches as the same object and replaces changed ones', () => {
  const poker = { id: 'p', revision: 3, hand: [1, 2] },
    tables = { poker: { members: ['a'] } };
  const before = { poker, tables, chess: null };
  const same = keepUnchanged(before, { poker: structuredClone(poker), tables: structuredClone(tables), chess: null, players: [] });
  assert.equal(same.poker, poker);
  assert.equal(same.tables, tables);
  const moved = { ...poker, revision: 4 };
  const next = keepUnchanged(before, { poker: moved, tables: structuredClone(tables), chess: null });
  assert.equal(next.poker, moved);
  assert.equal(next.tables, tables);
  const untouched = { poker: moved };
  assert.equal(keepUnchanged({}, untouched), untouched, 'nothing to share: the same packet');
});

test('sameTableProps ignores callbacks and compares the match by identity', () => {
  const match = { id: 'm', revision: 1 };
  const base = { match, seat: 0, names: ['도원', '강재'], onAction: () => {} };
  assert.equal(sameTableProps(base, { ...base, names: ['도원', '강재'], onAction: () => {} }), true);
  assert.equal(sameTableProps(base, { ...base, match: { ...match } }), false);
  assert.equal(sameTableProps(base, { ...base, seat: 1 }), false);
  assert.equal(sameTableProps(base, { ...base, names: ['도원', '민서'] }), false);
  assert.equal(sameTableProps(base, { ...base, reaction: { id: 'x' } }), false);
});

/** Every member's packet of the running match, from a fresh read. */
async function packets(h, ps, kind) {
  const out = [];
  for (const p of ps) out.push((await h.run(p, 'read')).response.packet[kind]);
  return out;
}

test('card games never send another seat\'s hand, the deck or the hole card', async () => {
  for (const [kind, n, stake] of [
    ['poker', 5, 10000],
    ['seotda', 5, 10000],
    ['blackjack', 5, 1000],
    ['gostop', 3, 10000],
  ]) {
    const { h, ps } = await startTable(kind, n, stake);
    const snap = h.world.rooms[ps[0].code].snapshot,
      match = kind === 'gostop' ? snap.go : snap[kind];
    const views = await packets(h, ps, kind);
    views.forEach((v, i) => {
      const seated = i < n,
        text = JSON.stringify(v);
      assert.equal(v.deck, undefined, `${kind}: no deck`);
      if (kind === 'blackjack') {
        // Hands are public at the blackjack table; the dealer's second card is not.
        if (match.phase === 'players') assert.equal(v.dealer[1], null, 'hole card hidden');
        return;
      }
      assert.equal(v.hands, undefined, `${kind}: no hands array`);
      assert.deepEqual(v.hand, seated ? match.hands[i] : [], `${kind}: seat ${i} sees only its own hand`);
      if (kind === 'gostop')
        match.hands.forEach((hand, j) => {
          if (j !== i) for (const card of hand) assert.ok(!text.includes(card), `gostop: seat ${i} must not see ${card}`);
        });
      else if (!match.reveal) assert.deepEqual(v.revealed, [], `${kind}: nothing revealed before the showdown`);
    });
  }
});

test('허풍 카드 and 라이어 게임 keep secrets per seat and from watchers', async () => {
  {
    const { h, ps } = await startTable('liarsbar', 4, 1000);
    const g = h.world.rooms[ps[0].code].snapshot.liarsbar;
    const views = await packets(h, ps, 'liarsbar');
    views.forEach((v, i) => {
      assert.equal(v.cards, undefined);
      assert.equal(v.hands, undefined);
      assert.equal(v.chamber, null, 'chambers stay secret until the end');
      assert.equal(v.salt, null);
      if (i < 4) assert.deepEqual(v.hand.map((c) => c.id), g.hands[i]);
      else assert.equal(v.hand, null, 'watchers see no cards');
    });
  }
  {
    const { h, ps } = await startTable('liar', 5, 0, { party: true });
    const g = h.world.rooms[ps[0].code].snapshot.liar;
    const views = await packets(h, ps, 'liar');
    views.forEach((v, i) => {
      assert.equal(v.votes, undefined);
      assert.equal(v.liar, null, 'the liar seat is secret');
      const citizen = i < 5 && i !== g.liar;
      assert.equal(v.word, citizen ? g.word : null, `seat ${i}`);
      if (!citizen) assert.ok(!JSON.stringify(v).includes(g.word), 'the word never leaks to the liar or watchers');
    });
  }
});

test('coming back after the connection expired takes the seat back from the server', async () => {
  const { h, ps } = await startTable('yacht', 4, 1000);
  const code = ps[0].code,
    gone = ps[3];
  // Everyone else keeps polling for longer than the lease; seat 3 is silent.
  for (let t = 0; t * 70_000 <= CLOUD_LEASE_MS; t++) {
    h.advance(70_000);
    for (const p of ps) if (p !== gone) await h.run(p, 'read');
  }
  let snap = h.world.rooms[code].snapshot;
  assert.equal(snap.players.some((p) => p.id === gone.id), false, 'dropped after the lease');
  assert.ok(snap.yachtAway.includes(3), 'the server plays seat 3 meanwhile');
  assert.equal(snap.yacht.phase, 'playing');
  const back = await h.run(gone, 'open');
  assert.equal(back.response.ok, true, back.response.error);
  snap = h.world.rooms[code].snapshot;
  assert.equal(snap.yachtAway.includes(3), false, 'seat 3 is mine again');
  assert.ok(snap.tables.yacht.members.includes(gone.id), 'back at the table');
  assert.deepEqual(back.response.packet.yacht.away, []);
  assert.equal(back.response.packet.yacht.legal.enabled, back.response.packet.yacht.turn === 3);
});
