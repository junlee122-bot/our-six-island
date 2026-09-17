import test from 'node:test';
import assert from 'node:assert/strict';
import { LoungeRoom } from '../app/lounge-room.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { defaultLook } from '../app/lounge-look.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import {
  REACTIONS,
  REACTION_TTL,
  REACTION_COOLDOWN,
  readReaction,
  receiveReaction,
  reactionVisible,
} from '../app/lounge-reactions.ts';

const now = 1800000000000;
function room(count = 3) {
  const r = LoungeRoom.hosted(null, newLoungeLedger(), 'ABCDEFGHIJ', 'a');
  for (let i = 0; i < count; i++)
    r.hostedJoin(
      'reaction-test-member-000-' + String.fromCharCode(97 + i),
      i,
      defaultLook(i),
    );
  const action = r.hostedAction.bind(r),
    packet = r.hostedPacket.bind(r);
  r.hostedAction = (id, a, time) =>
    action(
      id.length === 1 ? 'reaction-test-member-000-' + id : id,
      a.kind === 'invite'
        ? {
            ...a,
            players: a.players.map((p) => 'reaction-test-member-000-' + p),
          }
        : a,
      time,
    );
  r.hostedPacket = (id) =>
    packet(id.length === 1 ? 'reaction-test-member-000-' + id : id);
  return r;
}
test('reaction allowlist rejects arbitrary content and constructs authoritative fields', () => {
  const r = room();
  for (const bad of [
    { id: '<img>' },
    { scope: 'admin' },
    { scope: 'casino' },
    { matchId: 'fake' },
  ])
    assert.equal(
      r.hostedAction(
        'a',
        { kind: 'reaction', id: 'hello', scope: 'lounge', ...bad },
        now,
      ),
      false,
    );
  assert.equal(
    r.hostedAction(
      'intruder',
      { kind: 'reaction', id: 'hello', scope: 'lounge' },
      now,
    ),
    false,
  );
  assert.equal(
    r.hostedAction(
      'a',
      {
        kind: 'reaction',
        id: 'hello',
        scope: 'lounge',
        at: 1,
        expiresAt: Infinity,
        actor: 6,
        url: 'https://evil.test',
      },
      now,
    ),
    true,
  );
  assert.deepEqual(r.hostedPacket('b').players[0].reaction, {
    id: 'hello',
    scope: 'lounge',
    at: now,
  });
});
test('cooldown survives snapshot restore, limits cross-scope spam, and invalid requests do not consume it', () => {
  let r = room();
  assert.equal(
    r.hostedAction(
      'a',
      { kind: 'reaction', id: 'laugh', scope: 'lounge' },
      now,
    ),
    true,
  );
  r = LoungeRoom.hosted(r.hostedSnapshot(), r.hostedLedger());
  assert.equal(
    r.hostedAction(
      'reaction-test-member-000-a',
      { kind: 'reaction', id: 'love', scope: 'lounge' },
      now + REACTION_COOLDOWN - 1,
    ),
    false,
  );
  assert.equal(
    r.hostedAction(
      'reaction-test-member-000-a',
      { kind: 'reaction', id: 'love', scope: 'lounge' },
      now + REACTION_COOLDOWN,
    ),
    true,
  );
  assert.equal(
    r.hostedAction(
      'reaction-test-member-000-b',
      { kind: 'reaction', id: 'invalid', scope: 'lounge' },
      now,
    ),
    false,
  );
  assert.equal(
    r.hostedAction(
      'reaction-test-member-000-b',
      { kind: 'reaction', id: 'love', scope: 'lounge' },
      now,
    ),
    true,
  );
});
for (const game of ['chess', 'gostop', 'seotda', 'poker', 'blackjack'])
  test(`${game}: participants and spectators share reactions only for the current match`, () => {
    const r = room(4),
      invited = game === 'chess' ? ['b'] : ['b', 'c'];
    assert.equal(
      r.hostedAction('a', { kind: 'invite', game, players: invited }, now),
      true,
    );
    const invite = r.hostedPacket('a').invites[0];
    for (const id of invited)
      assert.equal(
        r.hostedAction(id, { kind: 'reply', id: invite.id, accept: true }, now),
        true,
      );
    const match = r.hostedPacket('a')[game];
    assert.ok(match);
    assert.equal(
      r.hostedAction(
        'a',
        { kind: 'reaction', id: 'cheer', scope: game, matchId: 'old-match' },
        now,
      ),
      false,
    );
    assert.equal(
      r.hostedAction(
        'a',
        { kind: 'reaction', id: 'cheer', scope: game, matchId: match.id },
        now,
      ),
      true,
    );
    assert.equal(
      r.hostedAction(
        'd',
        { kind: 'reaction', id: 'wow', scope: game, matchId: match.id },
        now,
      ),
      true,
    );
    const p = r.hostedPacket('b').players[0];
    assert.equal(reactionVisible(p.reaction, game, match.id, now), true);
    assert.equal(reactionVisible(p.reaction, game, 'next-match', now), false);
    assert.equal(reactionVisible(p.reaction, 'lounge', undefined, now), false);
    assert.equal(
      reactionVisible(p.reaction, game, match.id, now + REACTION_TTL),
      false,
    );
  });
test('skewed clocks, expired events and duplicate packets cannot replay reactions', () => {
  const event = { id: 'think', at: now, scope: 'lounge' };
  for (const skew of [-86400000, 0, 86400000]) {
    const local = now + skew;
    const first = receiveReaction(event, undefined, now + 1000, local);
    assert.equal(first.expiresAt, local + 5000);
    assert.equal(
      receiveReaction(event, first, now + 1000, local + 3000).expiresAt,
      first.expiresAt,
    );
    assert.equal(
      reactionVisible(first, 'lounge', undefined, local + 4999),
      true,
    );
    assert.equal(
      reactionVisible(first, 'lounge', undefined, local + 5000),
      false,
    );
    const expired = receiveReaction(event, undefined, now + 7000, local);
    assert.equal(reactionVisible(expired, 'lounge', undefined, local), false);
    assert.equal(
      reactionVisible(
        receiveReaction(event, undefined, now - 1, local),
        'lounge',
        undefined,
        local,
      ),
      false,
    );
  }
  assert.equal(readReaction({ ...event, scope: 'chess' }), undefined);
  assert.equal(readReaction({ ...event, at: Infinity }), undefined);
});
test('bounded latest reaction per seven friends and old saves remain compatible', () => {
  let r = room(7);
  for (let j = 0; j < 8; j++)
    for (let i = 0; i < 7; i++)
      assert.equal(
        r.hostedAction(
          String.fromCharCode(97 + i),
          { kind: 'reaction', id: REACTIONS[j].id, scope: 'lounge' },
          now + j * REACTION_COOLDOWN,
        ),
        true,
      );
  assert.equal(r.hostedPacket('a').players.length, 7);
  assert.ok(
    r.hostedPacket('a').players.every((p) => p.reaction.id === 'hello'),
  );
  const old = r.hostedSnapshot();
  for (const p of old.players) delete p.reaction;
  r = LoungeRoom.hosted(old, r.hostedLedger());
  assert.equal(
    r.hostedAction(
      'reaction-test-member-000-a',
      { kind: 'reaction', id: 'hello', scope: 'lounge' },
      now,
    ),
    true,
  );
});
test('cloud reactions use server clock, retries are idempotent, stale connections are rejected', async () => {
  const member = { id: crypto.randomUUID(), actor: 0, username: 'dowon' };
  const connection = crypto.randomUUID();
  let state = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const open = {
    op: 'open',
    requestId: crypto.randomUUID(),
    connection,
    sequence: 1,
    epoch: 0,
  };
  let result = cloudTransition(
    state,
    member,
    open,
    await commandHash(open),
    now,
  );
  state = result.state;
  const action = {
    op: 'action',
    code: result.response.code,
    connection,
    requestId: crypto.randomUUID(),
    sequence: 2,
    action: { kind: 'reaction', id: 'cry', scope: 'lounge' },
  };
  const hash = await commandHash(action);
  result = cloudTransition(state, member, action, hash, now + 20000);
  assert.equal(result.response.ok, true);
  assert.equal(result.response.packet.players[0].reaction.at, now + 20000);
  result = cloudTransition(result.state, member, action, hash, now + 21000);
  assert.equal(result.response.packet.players[0].reaction.at, now + 20000);
  const stale = {
    ...action,
    requestId: crypto.randomUUID(),
    connection: crypto.randomUUID(),
    sequence: 3,
  };
  const denied = cloudTransition(
    result.state,
    member,
    stale,
    await commandHash(stale),
    now + 22000,
  );
  assert.equal(denied.response.ok, false);
  assert.equal(denied.response.packet, null);
});
