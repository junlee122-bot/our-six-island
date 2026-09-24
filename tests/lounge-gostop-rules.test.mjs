import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_CARDS,
  cardInfo,
  goAction,
  goStopProjection,
  newGo,
  normalizeGo,
  shuffleCards,
} from '../app/lounge-gostop.ts';

const of = (type, month) =>
  ALL_CARDS.filter(
    (c) =>
      cardInfo(c).type === type &&
      (month === undefined || cardInfo(c).month === month),
  );
// Cards ordered by their index within the month, so any consecutive seven
// cards span seven different months (no accidental 총통 in fixtures).
const spread = [...ALL_CARDS].sort(
  (a, b) => a.slice(4).localeCompare(b.slice(4)) || a.localeCompare(b),
);
// Single pi only (쌍피 m11-02 / m12-04 count as two).
const singlePi = of('junk').filter((c) => c !== 'm11-02' && c !== 'm12-04');

// A round in the go/stop decision with fixed captures for seat 0.
function decide(captured, go = [0, 0, 0]) {
  const base = newGo('fixture', spread);
  const used = new Set(captured.flat());
  const rest = ALL_CARDS.filter((c) => !used.has(c));
  return {
    ...base,
    hands: [rest.slice(0, 2), rest.slice(2, 4), rest.slice(4, 6)],
    deck: rest.slice(6, 12),
    floor: [],
    captured,
    turn: 0,
    phase: 'decide',
    go,
    winner: null,
    events: [],
  };
}
const brights = ['m01-01', 'm03-01', 'm08-01'];

test('stop: 광박 doubles only the loser without a bright', () => {
  const g = decide([brights, ['m11-01'], []]);
  const next = goAction(g, 0, { kind: 'stop' });
  assert.equal(next.phase, 'over');
  assert.equal(next.winner, 0);
  assert.deepEqual(next.result, [9, -3, -6]);
});

test('stop: 피박 doubles a loser with 1-5 pi when the winner scores pi; zero pi is exempt', () => {
  const g = decide([
    [...brights, ...singlePi.slice(0, 10)],
    ['m11-01', ...singlePi.slice(10, 13)],
    ['m12-01'],
  ]);
  // 3 brights + 10 pi (1 point) = 4. Seat 1 has 3 pi -> 피박, seat 2 has none.
  const p = goStopProjection(g.captured, g.go, 0);
  assert.equal(p.points, 4);
  assert.deepEqual(p.pibak, [false, true, false]);
  assert.deepEqual(goAction(g, 0, { kind: 'stop' }).result, [12, -8, -4]);
});

test('stop: 멍따 (7+ animals) doubles the winner points', () => {
  const animals = of('animal').filter((c) => cardInfo(c).month !== 8);
  assert.ok(animals.length >= 7);
  const g = decide([animals.slice(0, 7), ['m01-01'], ['m03-01']]);
  const p = goStopProjection(g.captured, g.go, 0);
  // 7 animals = 3 points, doubled by 멍따.
  assert.equal(p.base, 3);
  assert.equal(p.mungtta, true);
  assert.equal(p.points, 6);
  assert.match(goAction(g, 0, { kind: 'stop' }).reason, /멍따/);
});

test('go bonus: 1·2고 add points, 3고+ uses (score + go) x 2^(go-2)', () => {
  // 3 brights + 10 pi = 4 base points.
  const cards = [[...brights, ...singlePi.slice(0, 10)], ['m11-01'], ['m12-01']];
  const points = (go) => goStopProjection(cards, [go, 0, 0], 0).points;
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(points), [4, 5, 6, 14, 32, 72]);
});

test('총통 ends the deal for the four-card hand and reveals those cards to all', () => {
  const four = ALL_CARDS.filter((c) => cardInfo(c).month === 5);
  const rest = spread.filter((c) => cardInfo(c).month !== 5);
  // Seat 1 is dealt all four May cards; nobody else has four of a month.
  const deck = [...rest.slice(0, 7), ...four, ...rest.slice(7, 10), ...rest.slice(10)];
  const g = newGo('chongtong', deck);
  assert.equal(g.winner, 1);
  assert.equal(g.phase, 'over');
  assert.deepEqual(g.result, [-5, 10, -5]);
  assert.deepEqual(g.revealed, [{ seat: 1, cards: four }]);
});

test('four of a month on the floor voids the deal with accurate copy', () => {
  const four = ALL_CARDS.filter((c) => cardInfo(c).month === 6);
  const rest = spread.filter((c) => cardInfo(c).month !== 6);
  const g = newGo('floor-four', [...rest.slice(0, 21), ...four, ...rest.slice(21)]);
  assert.equal(g.phase, 'over');
  assert.equal(g.winner, null);
  assert.doesNotMatch(g.reason, /다시 섞기/);
  assert.match(g.reason, /무효/);
});

test('newGo starts with the requested first seat', () => {
  for (const first of [0, 1, 2]) {
    const g = newGo('first-' + first, shuffleCards(), first);
    if (g.phase === 'over') continue;
    assert.equal(g.turn, first);
    assert.equal(g.first, first);
  }
  assert.throws(() => newGo('bad', shuffleCards(), 3));
});

test('events carry the actor seat and are cleared when the next turn starts', () => {
  let g = newGo('events', spread);
  assert.equal(g.phase, 'play');
  for (let step = 0; step < 6 && g.phase !== 'over'; step++) {
    const seat = g.turn;
    const action =
      g.phase === 'choose'
        ? { kind: 'pick', card: g.options[0] }
        : g.phase === 'decide'
          ? { kind: 'go' }
          : { kind: 'play', card: g.hands[seat][0] };
    g = goAction(g, seat, action);
    for (const e of g.events) {
      assert.equal(typeof e.text, 'string');
      assert.ok(e.seat === seat || e.seat === -1);
    }
    if (action.kind === 'play') assert.ok(g.events.every((e) => e.seat === seat));
  }
});

test('the last hand card never announces 쪽 because no pi is stolen', () => {
  // Seat 0 holds one card; the floor has no match and the deck top matches it.
  const base = newGo('last-card', spread);
  const card = 'm02-03',
    drawn = 'm02-04';
  const g = {
    ...base,
    hands: [[card], ['m03-03'], ['m04-03']],
    deck: [drawn, 'm05-03', 'm06-03'],
    floor: ['m07-03', 'm09-03'],
    captured: [[], ['m01-03', 'm01-04'], ['m10-03']],
    turn: 0,
    phase: 'play',
    events: [],
  };
  const next = goAction(g, 0, { kind: 'play', card });
  assert.ok(next.captured[0].includes(card) && next.captured[0].includes(drawn));
  assert.equal(next.events.some((e) => e.text.includes('쪽')), false);
  // Nothing was taken from the opponents.
  assert.deepEqual(next.captured[1], ['m01-03', 'm01-04']);
  // With cards left in hand, the same capture is a 쪽 and steals.
  const withHand = goAction(
    { ...g, hands: [[card, 'm08-03'], ['m03-03'], ['m04-03']] },
    0,
    { kind: 'play', card },
  );
  assert.ok(withHand.events.some((e) => e.text.startsWith('쪽!')));
  assert.equal(withHand.captured[1].length, 1);
});

test('two equivalent pi on the floor are taken without asking', () => {
  const base = newGo('auto-pick', spread);
  const g = {
    ...base,
    hands: [['m03-01', 'm05-01'], ['m06-03'], ['m07-03']],
    deck: ['m10-03', 'm11-03', 'm12-03'],
    floor: ['m03-03', 'm03-04', 'm09-03'],
    captured: [[], [], []],
    turn: 0,
    phase: 'play',
    events: [],
  };
  const next = goAction(g, 0, { kind: 'play', card: 'm03-01' });
  assert.notEqual(next.phase, 'choose');
  assert.ok(next.captured[0].includes('m03-01'));
  // A ribbon and a pi are different choices, so the player still picks.
  const choose = goAction(
    { ...g, floor: ['m03-02', 'm03-04', 'm09-03'] },
    0,
    { kind: 'play', card: 'm03-01' },
  );
  assert.equal(choose.phase, 'choose');
});

test('legacy string events are normalized with an unknown actor', () => {
  const g = normalizeGo({ ...newGo('legacy', spread), events: ['뻑!'], first: undefined });
  assert.deepEqual(g.events, [{ seat: -1, text: '뻑!' }]);
  assert.equal(g.first, 0);
});
