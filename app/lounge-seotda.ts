// Two-card Seotda, equal buy-ins. Hand rules follow Hangame's hwatu guide.
// Replay policy is our explicit house rule; see the in-game rules and README.
export const SEOTDA_CARDS = Array.from({ length: 10 }, (_, i) =>
  [1, 2].map((n) => `m${String(i + 1).padStart(2, '0')}-0${n}`),
).flat();
const cardSet = new Set(SEOTDA_CARDS);
export type SeotdaAction =
  | { kind: 'fold' | 'check' | 'call' | 'all-in' }
  | { kind: 'raise'; to: number };
export type SeotdaRank = {
  label: string;
  value: number;
  special: '' | 'assassin' | 'catcher' | 'gusa' | 'mung';
};
export function seotdaRank(cards: string[]): SeotdaRank {
  if (
    cards.length !== 2 ||
    cards[0] === cards[1] ||
    cards.some((c) => !cardSet.has(c))
  )
    throw new Error('섯다 패가 올바르지 않습니다.');
  const [a, b] = cards.map((c) => Number(c.slice(1, 3))).sort((x, y) => x - y);
  const pair = `${a},${b}`,
    has = (c: string) => cards.includes(c);
  if (has('m03-01') && has('m08-01'))
    return { label: '38광땡', value: 50, special: '' };
  if (has('m01-01') && (has('m03-01') || has('m08-01')))
    return {
      label: a === 1 && b === 3 ? '13광땡' : '18광땡',
      value: 40,
      special: '',
    };
  if (a === b)
    return {
      label: [
        '',
        '삥땡',
        '이땡',
        '삼땡',
        '사땡',
        '오땡',
        '육땡',
        '칠땡',
        '팔땡',
        '구땡',
        '장땡',
      ][a],
      value: 20 + a,
      special: '',
    };
  if (has('m04-01') && has('m07-01'))
    return { label: '암행어사', value: 1, special: 'assassin' };
  if (has('m03-01') && has('m07-01'))
    return { label: '땡잡이', value: 0, special: 'catcher' };
  if (pair === '4,9')
    return {
      label: has('m04-01') && has('m09-01') ? '멍텅구리 구사' : '구사',
      value: 3,
      special: has('m04-01') && has('m09-01') ? 'mung' : 'gusa',
    };
  const named: Record<string, [string, number]> = {
    '1,2': ['알리', 20],
    '1,4': ['독사', 19],
    '1,9': ['구삥', 18],
    '1,10': ['장삥', 17],
    '4,10': ['장사', 16],
    '4,6': ['세륙', 15],
  };
  if (named[pair])
    return { label: named[pair][0], value: named[pair][1], special: '' };
  const value = (a + b) % 10;
  return {
    label: value === 9 ? '갑오' : value === 0 ? '망통' : `${value}끗`,
    value,
    special: '',
  };
}
export function resolveSeotda(hands: { seat: number; cards: string[] }[]) {
  if (hands.length < 2)
    throw new Error('공개 승부에는 두 명 이상이 필요합니다.');
  const ranked = hands.map((h) => ({ ...h, rank: seotdaRank(h.cards) }));
  const high = Math.max(...ranked.map((h) => h.rank.value));
  const special = (kind: SeotdaRank['special']) =>
    ranked.filter((h) => h.rank.special === kind);
  const best = ranked.filter((h) => h.rank.value === high);
  if (high === 40 && special('assassin').length)
    return {
      winners: special('assassin').map((h) => h.seat),
      replay: false,
      reason: '암행어사가 13·18광땡을 잡았어요.',
    };
  // A 38 bright pair and a ten pair cannot be caught or replayed by lower specials.
  if (high <= 29 && special('mung').length)
    return {
      winners: [],
      replay: true,
      reason: '멍텅구리 구사! 9땡 이하이므로 재경기해요.',
    };
  if (high >= 21 && high <= 29 && special('catcher').length)
    return {
      winners: special('catcher').map((h) => h.seat),
      replay: false,
      reason: '땡잡이가 1~9땡을 잡았어요.',
    };
  if (high <= 20 && special('gusa').length)
    return {
      winners: [],
      replay: true,
      reason: '구사! 알리 이하이므로 재경기해요.',
    };
  if (best.length > 1)
    return {
      winners: [],
      replay: true,
      reason: `${best[0].rank.label} 동률! 다이하지 않은 친구들이 재경기해요.`,
    };
  return {
    winners: [best[0].seat],
    replay: false,
    reason: `${best[0].rank.label} 승리!`,
  };
}
export function shuffleSeotdaCards() {
  const deck = [...SEOTDA_CARDS],
    word = new Uint32Array(1);
  for (let i = deck.length - 1; i > 0; i--) {
    const limit = Math.floor(0x100000000 / (i + 1)) * (i + 1);
    do {
      crypto.getRandomValues(word);
    } while (word[0] >= limit);
    const j = word[0] % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
export type SeotdaMatch = {
  id: string;
  revision: number;
  phase: 'betting' | 'showdown' | 'redeal' | 'over';
  round: number;
  first: number;
  ante: number;
  buyIn: number;
  stacks: number[];
  bets: number[];
  committed: number[];
  folded: boolean[];
  actedAt: (number | null)[];
  currentBet: number;
  minRaise: number;
  turn: number;
  hands: string[][];
  deck: string[];
  reveal: boolean;
  winners: number[];
  result: number[];
  reason: string;
  previous: {
    round: number;
    reason: string;
    hands: { seat: number; cards: string[]; rank: SeotdaRank }[];
  } | null;
  events: { seq: number; kind: string; seat: number; amount: number }[];
};
export type SeotdaView = Omit<SeotdaMatch, 'hands' | 'deck' | 'actedAt'> & {
  hand: string[];
  handCounts: number[];
  rank: SeotdaRank | null;
  revealed: { seat: number; cards: string[]; rank: SeotdaRank }[];
  legal: ReturnType<typeof seotdaLegal>;
};
const alive = (g: SeotdaMatch) => g.folded.flatMap((v, i) => (v ? [] : [i]));
const active = (g: SeotdaMatch) => alive(g).filter((i) => g.stacks[i] > 0);
function event(g: SeotdaMatch, kind: string, seat = -1, amount = 0) {
  g.events = [
    ...g.events,
    { seq: (g.events.at(-1)?.seq ?? 0) + 1, kind, seat, amount },
  ].slice(-20);
}
function commit(g: SeotdaMatch, seat: number, amount: number) {
  g.stacks[seat] -= amount;
  g.bets[seat] += amount;
  g.committed[seat] += amount;
}
function finish(g: SeotdaMatch, winners: number[], reason: string) {
  const pot = g.committed.reduce((a, b) => a + b, 0);
  winners.forEach(
    (seat, i) =>
      (g.stacks[seat] +=
        Math.floor(pot / winners.length) + (i < pot % winners.length ? 1 : 0)),
  );
  g.winners = winners;
  g.result = g.stacks.map((n) => n - g.buyIn);
  g.reason = reason;
  g.turn = -1;
  g.phase = 'over';
  event(g, 'win', winners.length === 1 ? winners[0] : -1, pot);
}
function advance(g: SeotdaMatch, after: number) {
  const remaining = alive(g);
  if (remaining.length === 1) {
    finish(g, remaining, '다른 친구들이 다이했어요.');
    return;
  }
  const canAct = active(g);
  for (let n = 1; n <= g.stacks.length; n++) {
    const seat = (after + n + g.stacks.length) % g.stacks.length;
    if (
      !g.folded[seat] &&
      g.stacks[seat] > 0 &&
      (g.bets[seat] < g.currentBet ||
        (canAct.length > 1 && g.actedAt[seat] === null))
    ) {
      g.turn = seat;
      return;
    }
  }
  // Equal initial chips + no rebuys means all non-folded players contributed equally.
  // Reject malformed states instead of awarding a pot beyond an all-in's eligibility.
  if (remaining.some((i) => g.committed[i] !== g.committed[remaining[0]]))
    throw new Error('섯다 참가 금액이 일치하지 않습니다.');
  g.turn = -1;
  g.phase = 'showdown';
  g.reveal = true;
  event(g, 'showdown');
}
function validDeck(deck: string[]) {
  return (
    Array.isArray(deck) &&
    deck.length === 20 &&
    new Set(deck).size === 20 &&
    deck.every((c) => cardSet.has(c))
  );
}
function distribute(g: SeotdaMatch, deck: string[]) {
  if (!validDeck(deck)) throw new Error('섯다 카드 구성이 올바르지 않습니다.');
  g.deck = [...deck];
  g.hands = g.hands.map(() => []);
  for (let round = 0; round < 2; round++)
    for (let n = 0; n < g.stacks.length; n++) {
      const i = (g.first + n) % g.stacks.length;
      if (!g.folded[i]) g.hands[i].push(g.deck.shift()!);
    }
}
export function newSeotda(
  id: string,
  count: number,
  buyIn: number,
  deck = shuffleSeotdaCards(),
  first = 0,
): SeotdaMatch {
  if (
    typeof id !== 'string' ||
    !id ||
    id.length > 100 ||
    !Number.isInteger(count) ||
    count < 2 ||
    count > 7 ||
    !Number.isSafeInteger(buyIn) ||
    buyIn < 100 ||
    buyIn > 1_000_000_000 ||
    !validDeck(deck) ||
    !Number.isInteger(first) ||
    first < 0 ||
    first >= count
  )
    throw new Error('섯다 테이블 설정이 올바르지 않습니다.');
  const zero = () => Array(count).fill(0);
  const g: SeotdaMatch = {
    id,
    revision: 0,
    phase: 'betting',
    round: 1,
    first,
    ante: 100,
    buyIn,
    stacks: Array(count).fill(buyIn),
    bets: zero(),
    committed: zero(),
    folded: Array(count).fill(false),
    actedAt: Array(count).fill(null),
    currentBet: 0,
    minRaise: 100,
    turn: -1,
    hands: Array.from({ length: count }, () => []),
    deck: [],
    reveal: false,
    winners: [],
    result: zero(),
    reason: '',
    previous: null,
    events: [],
  };
  distribute(g, deck);
  for (let i = 0; i < count; i++) commit(g, i, g.ante);
  g.bets = zero(); // The ante is in the pot, not a bet to call this round.
  event(g, 'deal', -1, count * g.ante);
  advance(g, first - 1);
  return g;
}
export function seotdaLegal(g: SeotdaMatch, seat: number) {
  const enabled =
    Number.isInteger(seat) &&
    seat >= 0 &&
    seat < g.stacks.length &&
    g.phase === 'betting' &&
    g.turn === seat &&
    !g.folded[seat] &&
    g.stacks[seat] > 0;
  const call = enabled
    ? Math.min(g.currentBet - g.bets[seat], g.stacks[seat])
    : 0;
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
export function seotdaAction(
  game: SeotdaMatch,
  seat: number,
  action: SeotdaAction,
): SeotdaMatch | null {
  const legal = seotdaLegal(game, seat);
  if (!legal.enabled || !action || typeof action !== 'object') return null;
  let a = action;
  if (a.kind === 'all-in')
    a =
      legal.maxTo > game.currentBet
        ? { kind: 'raise', to: legal.maxTo }
        : { kind: 'call' };
  if (
    (a.kind === 'check' && !legal.canCheck) ||
    (a.kind === 'call' && legal.call === 0)
  )
    return null;
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
export function seotdaDeal(
  game: SeotdaMatch,
  replayDeck?: string[],
): SeotdaMatch | null {
  if (game.phase !== 'showdown' && game.phase !== 'redeal') return null;
  const g = structuredClone(game);
  g.revision++;
  if (g.phase === 'showdown') {
    const hands = alive(g).map((seat) => ({ seat, cards: g.hands[seat] }));
    const result = resolveSeotda(hands);
    if (!result.replay) finish(g, result.winners, result.reason);
    else {
      g.phase = 'redeal';
      g.reason = result.reason;
      g.previous = {
        round: g.round,
        reason: result.reason,
        hands: hands.map((h) => ({ ...h, rank: seotdaRank(h.cards) })),
      };
      event(g, 'replay');
    }
    return g;
  }
  g.round++;
  do {
    g.first = (g.first + 1) % g.stacks.length;
  } while (g.folded[g.first]);
  g.phase = 'betting';
  g.reveal = false;
  g.bets = g.bets.map(() => 0);
  g.actedAt = g.actedAt.map(() => null);
  g.currentBet = 0;
  g.minRaise = 100;
  distribute(g, replayDeck ?? shuffleSeotdaCards());
  event(g, 'deal');
  advance(g, (g.first + g.stacks.length - 1) % g.stacks.length);
  return g;
}
export function seotdaView(game: SeotdaMatch, seat: number): SeotdaView {
  const {
    deck: _deck,
    hands,
    actedAt: _actedAt,
    ...publicState
  } = structuredClone(game);
  const hand =
    Number.isInteger(seat) && seat >= 0 && seat < hands.length
      ? hands[seat]
      : [];
  return {
    ...publicState,
    hand,
    handCounts: hands.map((h) => h.length),
    rank: hand.length === 2 ? seotdaRank(hand) : null,
    revealed: game.reveal
      ? hands.flatMap((cards, i) =>
          game.folded[i] ? [] : [{ seat: i, cards, rank: seotdaRank(cards) }],
        )
      : [],
    legal: seotdaLegal(game, seat),
  };
}
