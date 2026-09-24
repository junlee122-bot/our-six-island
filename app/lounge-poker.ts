// No-limit Texas Hold'em. The host keeps PokerMatch; peers receive PokerView only.
// Rules reference: https://www.pokerstars.com/poker/games/texas-holdem/
export const POKER_RANKS = '23456789TJQKA';
export const POKER_SUITS = ['♣', '♦', '♥', '♠'] as const;
export type PokerStreet = 'preflop' | 'flop' | 'turn' | 'river';
export type PokerPhase = PokerStreet | 'dealing' | 'showdown' | 'over';
export type PokerAction =
  | { kind: 'fold' | 'check' | 'call' | 'all-in' }
  | { kind: 'raise'; to: number };
export type PokerRank = {
  category: number;
  values: number[];
  label: string;
  cards: number[];
};
export type PokerPot = {
  amount: number;
  cap: number;
  eligible: number[];
  winners: number[];
  refund: boolean;
};
export type PokerEvent = {
  seq: number;
  kind:
    | 'blind'
    | 'fold'
    | 'check'
    | 'call'
    | 'raise'
    | 'deal'
    | 'showdown'
    | 'win';
  seat: number;
  amount: number;
  street: PokerStreet;
};
export type PokerMatch = {
  id: string;
  revision: number;
  phase: PokerPhase;
  street: PokerStreet;
  dealer: number;
  smallBlind: number;
  bigBlind: number;
  turn: number;
  initial: number[];
  stacks: number[];
  committed: number[];
  bets: number[];
  folded: boolean[];
  actedAt: (number | null)[];
  currentBet: number;
  minRaise: number;
  hands: number[][];
  board: number[];
  deck: number[];
  reveal: boolean;
  pots: PokerPot[];
  result: number[];
  winners: number[];
  events: PokerEvent[];
};
export type PokerView = Omit<PokerMatch, 'deck' | 'hands' | 'actedAt'> & {
  hand: number[];
  revealed: { seat: number; cards: number[]; rank: PokerRank }[];
  handCounts: number[];
  legal: ReturnType<typeof pokerLegalActions>;
};
const LABELS = [
  '하이 카드',
  '원 페어',
  '투 페어',
  '트리플',
  '스트레이트',
  '플러시',
  '풀 하우스',
  '포카드',
  '스트레이트 플러시',
];
const validCard = (n: number) => Number.isInteger(n) && n >= 0 && n < 52;
const money = (n: number) =>
  Number.isSafeInteger(n) && n > 0 && n <= 1_000_000_000;
const rank = (c: number) => (c % 13) + 2;
const suit = (c: number) => Math.floor(c / 13);
export function comparePokerRanks(a: PokerRank, b: PokerRank) {
  if (a.category !== b.category) return Math.sign(a.category - b.category);
  for (let i = 0; i < Math.max(a.values.length, b.values.length); i++) {
    const d = (a.values[i] ?? 0) - (b.values[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}
function five(cards: number[]): PokerRank {
  const values = cards.map(rank).sort((a, b) => b - a);
  const groups = [...new Set(values)]
    .map((r) => [values.filter((v) => v === r).length, r])
    .sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const flush = cards.every((c) => suit(c) === suit(cards[0]));
  const unique = [...new Set(values)];
  const straight =
    unique.length === 5 && unique[0] - unique[4] === 4
      ? unique[0]
      : unique.join(',') === '14,5,4,3,2'
        ? 5
        : 0;
  let category = 0,
    kickers = values;
  if (flush && straight) {
    category = 8;
    kickers = [straight];
  } else if (groups[0][0] === 4) {
    category = 7;
    kickers = groups.map((g) => g[1]);
  } else if (groups[0][0] === 3 && groups[1][0] === 2) {
    category = 6;
    kickers = groups.map((g) => g[1]);
  } else if (flush) category = 5;
  else if (straight) {
    category = 4;
    kickers = [straight];
  } else if (groups[0][0] === 3) {
    category = 3;
    kickers = groups.map((g) => g[1]);
  } else if (groups[0][0] === 2 && groups[1][0] === 2) {
    category = 2;
    kickers = groups.map((g) => g[1]);
  } else if (groups[0][0] === 2) {
    category = 1;
    kickers = groups.map((g) => g[1]);
  }
  return {
    category,
    values: kickers,
    label: category === 8 && straight === 14 ? '로열 플러시' : LABELS[category],
    cards: [...cards],
  };
}
export function pokerRank(cards: number[]): PokerRank {
  if (
    cards.length < 5 ||
    cards.length > 7 ||
    !cards.every(validCard) ||
    new Set(cards).size !== cards.length
  )
    throw new Error('A poker hand needs five to seven distinct cards.');
  let best: PokerRank | null = null;
  for (let a = 0; a < cards.length - 4; a++)
    for (let b = a + 1; b < cards.length - 3; b++)
      for (let c = b + 1; c < cards.length - 2; c++)
        for (let d = c + 1; d < cards.length - 1; d++)
          for (let e = d + 1; e < cards.length; e++) {
            const value = five([
              cards[a],
              cards[b],
              cards[c],
              cards[d],
              cards[e],
            ]);
            if (!best || comparePokerRanks(value, best) > 0) best = value;
          }
  return best!;
}
export function shufflePokerCards(): number[] {
  const cards = Array.from({ length: 52 }, (_, i) => i),
    sample = new Uint32Array(1);
  for (let i = cards.length - 1; i > 0; i--) {
    const limit = 0x100000000 - (0x100000000 % (i + 1));
    do {
      crypto.getRandomValues(sample);
    } while (sample[0] >= limit);
    const j = sample[0] % (i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
const alive = (g: PokerMatch) => g.folded.flatMap((f, i) => (f ? [] : [i]));
const active = (g: PokerMatch) => alive(g).filter((i) => g.stacks[i] > 0);
const nextSeat = (
  g: PokerMatch,
  after: number,
  predicate: (i: number) => boolean,
) => {
  for (let n = 1; n <= g.stacks.length; n++) {
    const i = (after + n) % g.stacks.length;
    if (predicate(i)) return i;
  }
  return -1;
};
function event(g: PokerMatch, kind: PokerEvent['kind'], seat = -1, amount = 0) {
  g.events.push({
    seq: (g.events.at(-1)?.seq ?? 0) + 1,
    kind,
    seat,
    amount,
    street: g.street,
  });
  g.events = g.events.slice(-24);
}
function commit(g: PokerMatch, seat: number, amount: number) {
  g.stacks[seat] -= amount;
  g.bets[seat] += amount;
  g.committed[seat] += amount;
}
function price(g: PokerMatch, seat: number) {
  // With no opponent able to bet, only the matched portion can be called.
  const target = active(g).some((i) => i !== seat)
    ? g.currentBet
    : Math.min(
        g.currentBet,
        Math.max(
          0,
          ...alive(g)
            .filter((i) => i !== seat)
            .map((i) => g.bets[i]),
        ),
      );
  return Math.max(0, target - g.bets[seat]);
}
function finish(g: PokerMatch) {
  const remaining = alive(g),
    awards = g.stacks.map(() => 0),
    pots: PokerPot[] = [];
  if (remaining.length === 1) {
    const amount = g.committed.reduce((a, b) => a + b, 0);
    awards[remaining[0]] = amount;
    pots.push({
      amount,
      cap: Math.max(...g.committed),
      eligible: remaining,
      winners: remaining,
      refund: false,
    });
  } else {
    const ranks = new Map(
      remaining.map((i) => [i, pokerRank([...g.hands[i], ...g.board])]),
    );
    const levels = [...new Set(g.committed)]
      .filter((v) => v > 0)
      .sort((a, b) => a - b);
    let previous = 0;
    for (const cap of levels) {
      const contributors = g.committed.flatMap((v, i) => (v >= cap ? [i] : []));
      const amount = (cap - previous) * contributors.length;
      previous = cap;
      const refund = contributors.length === 1;
      const eligible = refund
        ? contributors
        : contributors.filter((i) => !g.folded[i]);
      if (!eligible.length)
        throw new Error('Invalid side pot: no eligible player.');
      let winners = refund ? contributors : [eligible[0]];
      if (!refund)
        for (const i of eligible.slice(1)) {
          const comparison = comparePokerRanks(
            ranks.get(i)!,
            ranks.get(winners[0])!,
          );
          if (comparison > 0) winners = [i];
          else if (comparison === 0) winners.push(i);
        }
      // Odd chips go clockwise from the seat immediately left of the button.
      winners.sort(
        (a, b) =>
          ((a - g.dealer - 1 + g.stacks.length) % g.stacks.length) -
          ((b - g.dealer - 1 + g.stacks.length) % g.stacks.length),
      );
      for (let j = 0; j < winners.length; j++)
        awards[winners[j]] +=
          Math.floor(amount / winners.length) +
          (j < amount % winners.length ? 1 : 0);
      pots.push({ amount, cap, eligible, winners, refund });
    }
  }
  g.pots = pots;
  g.winners = [
    ...new Set(pots.filter((p) => !p.refund).flatMap((p) => p.winners)),
  ];
  for (let i = 0; i < awards.length; i++) g.stacks[i] += awards[i];
  g.result = g.stacks.map((v, i) => v - g.initial[i]);
  g.phase = 'over';
  g.turn = -1;
  event(
    g,
    'win',
    g.winners.length === 1 ? g.winners[0] : -1,
    g.committed.reduce((a, b) => a + b, 0),
  );
}
function advance(g: PokerMatch, after: number) {
  if (alive(g).length === 1) {
    finish(g);
    return;
  }
  const canAct = active(g);
  const needsAction = (i: number) =>
    !g.folded[i] &&
    g.stacks[i] > 0 &&
    (price(g, i) > 0 || (canAct.length > 1 && g.actedAt[i] === null));
  const turn = nextSeat(g, after, needsAction);
  if (turn >= 0) {
    g.turn = turn;
    return;
  }
  g.turn = -1;
  if (g.street === 'river') {
    g.phase = 'showdown';
    g.reveal = true;
    event(g, 'showdown');
  } else g.phase = 'dealing';
}
/** Big blind scales with the buy-in: max(200, buyIn / 50) rounded to 100. */
export function pokerBigBlind(buyIn: number) {
  return Math.max(200, Math.round(buyIn / 50 / 100) * 100);
}
export function newPoker(
  id: string,
  buyIns: number[],
  cards = shufflePokerCards(),
  dealer = 0,
  bigBlind = 200,
): PokerMatch {
  if (
    !id ||
    id.length > 100 ||
    buyIns.length < 2 ||
    buyIns.length > 7 ||
    !buyIns.every(money) ||
    !money(bigBlind) ||
    bigBlind < 2 ||
    bigBlind % 2 !== 0 ||
    !Number.isInteger(dealer) ||
    dealer < 0 ||
    dealer >= buyIns.length ||
    cards.length !== 52 ||
    !cards.every(validCard) ||
    new Set(cards).size !== 52
  )
    throw new Error('Invalid poker table configuration.');
  const n = buyIns.length,
    zero = () => buyIns.map(() => 0);
  const g: PokerMatch = {
    id,
    revision: 0,
    phase: 'preflop',
    street: 'preflop',
    dealer,
    smallBlind: bigBlind / 2,
    bigBlind,
    turn: -1,
    initial: [...buyIns],
    stacks: [...buyIns],
    committed: zero(),
    bets: zero(),
    folded: buyIns.map(() => false),
    actedAt: buyIns.map(() => null),
    currentBet: bigBlind,
    minRaise: bigBlind,
    hands: buyIns.map(() => []),
    board: [],
    deck: [...cards],
    reveal: false,
    pots: [],
    result: zero(),
    winners: [],
    events: [],
  };
  for (let round = 0; round < 2; round++)
    for (let i = 1; i <= n; i++)
      g.hands[(dealer + i) % n].push(g.deck.shift()!);
  const sb = n === 2 ? dealer : (dealer + 1) % n,
    bb = (sb + 1) % n;
  for (const [seat, blind] of [
    [sb, g.smallBlind],
    [bb, bigBlind],
  ]) {
    const amount = Math.min(g.stacks[seat], blind);
    commit(g, seat, amount);
    event(g, 'blind', seat, amount);
  }
  advance(g, bb);
  return g;
}
export function pokerLegalActions(g: PokerMatch, seat: number) {
  const enabled =
    g.turn === seat &&
    ['preflop', 'flop', 'turn', 'river'].includes(g.phase) &&
    Number.isInteger(seat) &&
    seat >= 0 &&
    seat < g.stacks.length &&
    !g.folded[seat] &&
    g.stacks[seat] > 0;
  const call = enabled ? Math.min(price(g, seat), g.stacks[seat]) : 0;
  const maxTo = enabled ? g.bets[seat] + g.stacks[seat] : 0;
  const reopened =
    enabled &&
    (g.actedAt[seat] === null || g.currentBet - g.actedAt[seat]! >= g.minRaise);
  const canRaise =
    reopened && maxTo > g.currentBet && active(g).some((i) => i !== seat);
  return {
    enabled,
    canCheck: enabled && call === 0,
    call,
    canRaise,
    minTo: canRaise ? Math.min(maxTo, g.currentBet + g.minRaise) : 0,
    maxTo,
  };
}
export function pokerAction(
  game: PokerMatch,
  seat: number,
  action: PokerAction,
): PokerMatch | null {
  const legal = pokerLegalActions(game, seat);
  if (!legal.enabled || !action || typeof action !== 'object') return null;
  let a = action;
  if (a.kind === 'all-in')
    a =
      legal.maxTo > game.currentBet
        ? { kind: 'raise', to: legal.maxTo }
        : { kind: 'call' };
  if (a.kind === 'check' && !legal.canCheck) return null;
  if (a.kind === 'call' && legal.call === 0) return null;
  if (
    a.kind === 'raise' &&
    (!legal.canRaise ||
      !Number.isSafeInteger(a.to) ||
      a.to < legal.minTo ||
      a.to > legal.maxTo)
  )
    return null;
  if (!['fold', 'check', 'call', 'raise'].includes(a.kind)) return null;
  const g = structuredClone(game);
  if (a.kind === 'fold') {
    g.folded[seat] = true;
    event(g, 'fold', seat);
  } else if (a.kind === 'check') event(g, 'check', seat);
  else if (a.kind === 'call') {
    commit(g, seat, legal.call);
    event(g, 'call', seat, legal.call);
  } else if (a.kind === 'raise') {
    const increment = a.to - g.currentBet,
      amount = a.to - g.bets[seat];
    commit(g, seat, amount);
    if (increment >= g.minRaise) g.minRaise = increment;
    g.currentBet = a.to;
    event(g, 'raise', seat, amount);
  }
  g.actedAt[seat] = g.currentBet;
  g.revision++;
  advance(g, seat);
  return g;
}
// Call on the host after a short animation delay, once per revision.
export function pokerDeal(game: PokerMatch): PokerMatch | null {
  if (game.phase !== 'dealing' && game.phase !== 'showdown') return null;
  const g = structuredClone(game);
  g.revision++;
  if (g.phase === 'showdown') {
    finish(g);
    return g;
  }
  g.deck.shift(); // Burn card is never part of a public view.
  const count = g.street === 'preflop' ? 3 : 1;
  g.board.push(...g.deck.splice(0, count));
  g.street =
    g.street === 'preflop' ? 'flop' : g.street === 'flop' ? 'turn' : 'river';
  g.phase = g.street;
  g.currentBet = 0;
  g.minRaise = g.bigBlind;
  g.bets = g.bets.map(() => 0);
  g.actedAt = g.actedAt.map(() => null);
  event(g, 'deal');
  advance(g, g.dealer);
  return g;
}
export function pokerView(game: PokerMatch, seat: number): PokerView {
  const {
    deck: _deck,
    hands,
    actedAt: _actedAt,
    ...publicState
  } = structuredClone(game);
  return {
    ...publicState,
    hand:
      Number.isInteger(seat) && seat >= 0 && seat < hands.length
        ? hands[seat]
        : [],
    handCounts: hands.map((h) => h.length),
    legal: pokerLegalActions(game, seat),
    revealed: game.reveal
      ? hands.flatMap((cards, i) =>
          game.folded[i]
            ? []
            : [{ seat: i, cards, rank: pokerRank([...cards, ...game.board]) }],
        )
      : [],
  };
}
