import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tableState,
  tableAction,
  tableLabel,
  mySeat,
  TABLE_ACTION_LABEL,
} from '../app/lounge-table-state.ts';
import { emptyLoungeView } from '../app/lounge-games.ts';
import {
  sceneSeatPoint,
  sceneColliders,
  sceneTableSide,
  sceneCanWalk,
} from '../app/lounge-scene-layout.ts';

const view = (extra = {}) => ({
  ...emptyLoungeView(),
  status: 'connected',
  self: 'me',
  ...extra,
});
const forming = (extra = {}) => ({
  id: 'inv',
  game: 'seotda',
  from: 'dowon',
  invited: [],
  accepted: ['dowon'],
  declined: [],
  status: 'waiting',
  expires: 1,
  matchId: null,
  required: 3,
  stake: 5000,
  table: 'lounge-seotda',
  ...extra,
});

test('an empty table offers 앉기', () => {
  const s = tableState(view(), 'seotda');
  assert.equal(s.phase, 'empty');
  assert.equal(s.area, 'lounge');
  assert.equal(tableAction(s), 'sit');
  assert.equal(tableLabel(s).text, '섯다 · 빈 테이블 · 앉기');
  assert.equal(TABLE_ACTION_LABEL.sit, '앉기');
});

test('a forming table: 자리 잡기 for others, my seat when seated, called flag', () => {
  let s = tableState(view({ invites: [forming()] }), 'seotda');
  assert.equal(s.phase, 'forming');
  assert.deepEqual(s.occupants, ['dowon']);
  assert.equal(tableAction(s), 'join');
  assert.equal(tableLabel(s).text, '섯다 · 1/3명 · 5,000범 · 앉기');
  assert.equal(s.called, false);
  s = tableState(view({ invites: [forming({ invited: ['me'] })] }), 'seotda');
  assert.equal(s.called, true);
  s = tableState(
    view({ invites: [forming({ invited: ['me'], declined: ['me'] })] }),
    'seotda',
  );
  assert.equal(s.called, false);
  const v = view({ invites: [forming({ accepted: ['dowon', 'me'] })] });
  s = tableState(v, 'seotda');
  assert.equal(s.seated, true);
  assert.equal(tableAction(s), 'stand');
  assert.equal(tableLabel(s).text, '섯다 · 2/3명 · 5,000범 · 내 자리');
  assert.equal(mySeat(v)?.id, 'inv');
  // Old-style invites (no table) are not tables.
  assert.equal(
    tableState(view({ invites: [forming({ table: undefined })] }), 'seotda')
      .phase,
    'empty',
  );
  assert.equal(
    mySeat(
      view({ invites: [forming({ table: undefined, accepted: ['me'] })] }),
    ),
    null,
  );
});

test('a running game: 구경하기, or 이어하기 for its players', () => {
  const running = view({
    seotda: { id: 'm', phase: 'betting' },
    seats: { ...emptyLoungeView().seats, seotda: ['dowon', 'minseo'] },
    tables: {
      seotda: {
        matchId: 'm',
        round: 1,
        stake: 5000,
        required: 2,
        members: ['dowon', 'minseo'],
        ready: [],
      },
    },
  });
  let s = tableState(running, 'seotda');
  assert.equal(s.phase, 'playing');
  assert.equal(tableAction(s), 'watch');
  assert.equal(tableLabel(s).text, '섯다 · 게임 중 · 구경하기');
  s = tableState({ ...running, self: 'dowon' }, 'seotda');
  assert.equal(tableAction(s), 'resume');
});

test('a retained table after a round: members resume, a fill invite lets me sit', () => {
  const retained = view({
    seotda: { id: 'm', phase: 'over' },
    tables: {
      seotda: {
        matchId: 'm',
        round: 1,
        stake: 5000,
        required: 3,
        members: ['dowon', 'minseo'],
        ready: [],
      },
    },
  });
  let s = tableState(retained, 'seotda');
  assert.equal(s.phase, 'retained');
  assert.equal(tableAction(s), 'watch');
  s = tableState({ ...retained, self: 'dowon' }, 'seotda');
  assert.equal(tableAction(s), 'resume');
  const fill = forming({
    table: undefined,
    fill: 'm',
    invited: ['me'],
    required: 2,
  });
  s = tableState({ ...retained, invites: [fill] }, 'seotda');
  assert.equal(tableAction(s), 'join');
  assert.equal(s.fill?.id, 'inv');
});

test('offline: every table looks empty', () => {
  const s = tableState(
    { ...view({ invites: [forming()] }), status: 'offline' },
    'seotda',
  );
  assert.equal(s.phase, 'empty');
});

test('seat points sit behind the table edge, spread left to right', () => {
  for (const [area, game] of [
    ['lounge', 'seotda'],
    ['lounge', 'gostop'],
    ['casino', 'poker'],
    ['casino', 'blackjack'],
    ['casino', 'chess'],
  ]) {
    const c = sceneColliders(area).find((t) => t.game === game);
    for (const n of [1, 2, 3, 7]) {
      const seats = Array.from({ length: n }, (_, i) =>
        sceneSeatPoint(area, game, i, n),
      );
      for (const p of seats) {
        assert.ok(
          p.x >= 15 && p.x <= 85 && p.y >= 42 && p.y <= 88,
          `${area}/${game} in bounds`,
        );
        assert.ok(p.y < c.y + 0.01, `${area}/${game} behind the table centre`);
      }
      for (let i = 1; i < n; i++)
        assert.ok(seats[i].x > seats[i - 1].x, 'left to right');
    }
    // Standing up and walking up use the walkable front point.
    assert.ok(sceneCanWalk(sceneTableSide(area, game), area));
  }
});
