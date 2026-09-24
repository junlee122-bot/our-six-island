import test from 'node:test';
import assert from 'node:assert/strict';
import { LoungeRoom, GAME_KINDS, emptyLoungeView } from '../app/lounge-room.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { defaultLook } from '../app/lounge-look.ts';
import {
  gameFlow,
  gameIsActive,
  playerIsBusy,
} from '../app/lounge-game-flow.ts';

function departedGame(kind) {
  const players = [crypto.randomUUID(), crypto.randomUUID()];
  const room = LoungeRoom.hosted(
    null,
    newLoungeLedger(),
    'AUDITROOM',
    players[0],
  );
  for (const [actor, id] of players.entries())
    room.hostedJoin(id, actor, defaultLook(actor));
  assert.equal(
    room.hostedAction(players[0], {
      kind: 'invite',
      game: kind,
      players: [players[1]],
      required: 2,
      stake: 1000,
    }),
    true,
  );
  const invite = room.hostedPacket(players[0]).invites[0];
  assert.equal(
    room.hostedAction(players[1], {
      kind: 'reply',
      id: invite.id,
      accept: true,
    }),
    true,
  );
  assert.equal(
    room.hostedAction(players[0], {
      kind: 'stand',
      game: kind,
      id: room.hostedPacket(players[0])[kind].id,
    }),
    true,
  );
  const view = (self = players[0]) => ({
    ...emptyLoungeView(),
    ...room.hostedPacket(self),
    status: 'connected',
    self,
  });
  return { room, players, view };
}

function finishAfterDeparture(kind, fixture) {
  const { room, players, view } = fixture;
  let now = Date.now();
  for (let step = 0; step < 100; step += 1) {
    const current = view(players[1]);
    if (!gameIsActive(current, kind)) return now;
    const match = current[kind];
    const canAct =
      kind === 'poker'
        ? ['preflop', 'flop', 'turn', 'river'].includes(match.phase)
        : kind === 'blackjack'
          ? match.phase === 'players'
          : match.phase === 'betting';
    if (canAct && current.seats[kind][match.turn] === players[1])
      assert.equal(
        room.hostedAction(players[1], {
          kind,
          id: match.id,
          revision: match.revision,
          action: { kind: kind === 'blackjack' ? 'stand' : 'fold' },
        }),
        true,
      );
    now += 5000;
    room.hostedTick(now);
  }
  assert.fail(
    `${kind} did not finish after the departing player was automated`,
  );
}

for (const kind of ['poker', 'blackjack', 'seotda']) {
  test(`${kind}: explicit departure spectates while its settlement seat remains busy`, () => {
    const { players, view } = departedGame(kind);
    const current = view();
    assert.equal(gameIsActive(current, kind), true);
    assert.equal(current.seats[kind].includes(players[0]), true);
    assert.equal(current.tables[kind].members.includes(players[0]), false);
    assert.equal(playerIsBusy(current, players[0]), true);

    const flow = gameFlow(current, kind);
    assert.equal(flow.status, 'spectate');
    assert.equal(flow.ownTable, false);
    assert.equal(flow.ownSeat, false);
    assert.equal(flow.canOpen, true);
    assert.equal(flow.canRequest, false);
  });

  test(`${kind}: after a departure the short table waits for a fill, then dissolves and a new invite is possible`, () => {
    const fixture = departedGame(kind);
    const end = finishAfterDeparture(kind, fixture);
    let current = fixture.view();
    assert.equal(current[kind].phase, 'over');
    assert.equal(current.seats[kind].includes(fixture.players[0]), true);
    // The survivor keeps the short table until the ready check runs out.
    assert.deepEqual(current.tables[kind].members, [fixture.players[1]]);
    assert.equal(playerIsBusy(current, fixture.players[0]), false);
    fixture.room.hostedTick(end + 61_000);
    current = fixture.view();
    assert.equal(current.tables[kind], undefined);

    const flow = gameFlow(current, kind);
    assert.equal(flow.retained, false);
    assert.equal(flow.ownTable, false);
    assert.equal(flow.canRequest, true);
  });
}

for (const kind of GAME_KINDS) {
  test(`${kind}: legacy active snapshots without tables still resume their own seat`, () => {
    const current = {
      ...emptyLoungeView(),
      status: 'connected',
      self: 'legacy-player',
      seats: {
        ...emptyLoungeView().seats,
        [kind]: ['legacy-player', 'friend'],
      },
      [kind]: kind === 'chess' ? { winner: null } : { phase: 'play' },
    };
    delete current.tables;

    const flow = gameFlow(current, kind);
    assert.equal(flow.status, 'resume');
    assert.equal(flow.ownTable, false);
    assert.equal(flow.ownSeat, true);
    assert.equal(flow.canOpen, true);
    assert.equal(flow.canRequest, false);
    assert.equal(playerIsBusy(current, current.self), true);
  });
}
