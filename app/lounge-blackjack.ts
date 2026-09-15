// Six-deck blackjack: S17, natural 3:2, one split, double after split.
// Rules reference: https://bicyclecards.com/how-to-play/blackjack
export type BlackjackAction = { kind: 'hit' | 'stand' | 'double' | 'split' };
export type BlackjackHand = {
  cards: number[];
  bet: number;
  split: boolean;
  status: 'playing' | 'stood' | 'bust' | 'blackjack';
  result: number;
  outcome: '' | 'win' | 'lose' | 'push' | 'blackjack';
};
export type BlackjackMatch = {
  id: string;
  revision: number;
  phase: 'players' | 'reveal' | 'dealer' | 'settling' | 'over';
  stake: number;
  hands: BlackjackHand[][];
  dealer: number[];
  deck: number[];
  turn: number;
  hand: number;
  result: number[];
  event: { kind: string; seat: number; hand: number };
};
export type BlackjackView = Omit<BlackjackMatch, 'deck' | 'dealer'> & {
  dealer: (number | null)[];
  legal: ReturnType<typeof blackjackLegal>;
};
export function blackjackValue(cards: number[]) {
  let aces = 0;
  let total = cards.reduce((n, c) => {
    const r = c % 13;
    if (r === 12) {
      aces++;
      return n + 11;
    }
    return n + Math.min(r + 2, 10);
  }, 0);
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0, bust: total > 21 };
}
export function shuffleBlackjackCards(): number[] {
  const deck = Array.from({ length: 312 }, (_, i) => i);
  const word = new Uint32Array(1);
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
const cardValue = (c: number) =>
  c % 13 === 12 ? 11 : Math.min((c % 13) + 2, 10);
const natural = (cards: number[]) =>
  cards.length === 2 && blackjackValue(cards).total === 21;
function draw(g: BlackjackMatch) {
  const card = g.deck.shift();
  if (card === undefined) throw new Error('블랙잭 카드가 부족합니다.');
  return card;
}
function finishHand(h: BlackjackHand) {
  const value = blackjackValue(h.cards);
  if (value.bust) h.status = 'bust';
  else if (value.total === 21)
    h.status = h.split ? 'stood' : h.cards.length === 2 ? 'blackjack' : 'stood';
}
function advanceTurn(g: BlackjackMatch) {
  for (let i = 0; i < g.hands.length; i++) {
    const h = g.hands[i].findIndex((hand) => hand.status === 'playing');
    if (h >= 0) {
      g.turn = i;
      g.hand = h;
      return;
    }
  }
  g.turn = -1;
  g.hand = -1;
  g.phase = 'reveal';
}
export function newBlackjack(
  id: string,
  count: number,
  stake: number,
  deck = shuffleBlackjackCards(),
): BlackjackMatch {
  if (
    !Number.isInteger(count) ||
    count < 2 ||
    count > 7 ||
    !Number.isSafeInteger(stake) ||
    stake <= 0 ||
    stake > 20000 ||
    stake % 2 ||
    deck.length !== 312 ||
    new Set(deck).size !== 312 ||
    deck.some((c) => !Number.isInteger(c) || c < 0 || c >= 312)
  )
    throw new Error('블랙잭 인원, 베팅 또는 카드가 올바르지 않습니다.');
  const g: BlackjackMatch = {
    id,
    revision: 0,
    phase: 'players',
    stake,
    hands: Array.from({ length: count }, () => [
      {
        cards: [],
        bet: stake,
        split: false,
        status: 'playing',
        result: 0,
        outcome: '',
      },
    ]),
    dealer: [],
    deck: [...deck],
    turn: 0,
    hand: 0,
    result: Array(count).fill(0),
    event: { kind: 'deal', seat: -1, hand: -1 },
  };
  for (let round = 0; round < 2; round++) {
    for (const hands of g.hands) hands[0].cards.push(draw(g));
    g.dealer.push(draw(g));
  }
  for (const hands of g.hands) finishHand(hands[0]);
  advanceTurn(g);
  // Peek before accepting any double or split. Only reveal through the dealer step.
  if (natural(g.dealer)) {
    g.phase = 'reveal';
    g.turn = -1;
    g.hand = -1;
  }
  return g;
}
export function blackjackLegal(g: BlackjackMatch, seat: number) {
  const enabled =
    g.phase === 'players' &&
    seat === g.turn &&
    Number.isInteger(seat) &&
    seat >= 0;
  const hands = g.hands[seat],
    h = enabled ? hands?.[g.hand] : undefined;
  return {
    enabled: !!h && h.status === 'playing',
    hit: !!h && h.status === 'playing',
    stand: !!h && h.status === 'playing',
    double: !!h && h.status === 'playing' && h.cards.length === 2,
    split:
      !!h &&
      h.status === 'playing' &&
      hands.length === 1 &&
      h.cards.length === 2 &&
      cardValue(h.cards[0]) === cardValue(h.cards[1]),
  };
}
export function blackjackAction(
  g: BlackjackMatch,
  seat: number,
  action: BlackjackAction,
): BlackjackMatch | null {
  if (
    !action ||
    typeof action !== 'object' ||
    !['hit', 'stand', 'double', 'split'].includes(action.kind)
  )
    return null;
  const legal = blackjackLegal(g, seat);
  if (!legal.enabled || !legal[action.kind]) return null;
  const next = structuredClone(g),
    h = next.hands[seat][g.hand];
  next.revision++;
  next.event = { kind: action.kind, seat, hand: g.hand };
  if (action.kind === 'stand') h.status = 'stood';
  else if (action.kind === 'split') {
    const pair = h.cards;
    next.hands[seat] = pair.map((card) => {
      const hand: BlackjackHand = {
        cards: [card, draw(next)],
        bet: next.stake,
        split: true,
        status: card % 13 === 12 ? 'stood' : 'playing',
        result: 0,
        outcome: '',
      };
      finishHand(hand);
      return hand;
    });
  } else {
    h.cards.push(draw(next));
    if (action.kind === 'double') {
      h.bet *= 2;
      h.status = 'stood';
    }
    finishHand(h);
  }
  advanceTurn(next);
  return next;
}
export function blackjackDeal(g: BlackjackMatch): BlackjackMatch | null {
  if (!['reveal', 'dealer', 'settling'].includes(g.phase)) return null;
  const next = structuredClone(g);
  next.revision++;
  next.event = { kind: 'dealer', seat: -1, hand: -1 };
  if (g.phase === 'reveal') {
    next.phase = 'dealer';
    next.event.kind = 'reveal';
  } else if (g.phase === 'dealer') {
    const needsDealer = next.hands.some((hands) =>
      hands.some((h) => h.status !== 'bust' && h.status !== 'blackjack'),
    );
    if (
      !natural(next.dealer) &&
      needsDealer &&
      blackjackValue(next.dealer).total < 17
    )
      next.dealer.push(draw(next));
    else next.phase = 'settling';
  } else {
    const d = blackjackValue(next.dealer),
      dealerNatural = natural(next.dealer);
    next.result = next.hands.map((hands) =>
      hands.reduce((total, h) => {
        const v = blackjackValue(h.cards);
        if (v.bust) {
          h.result = -h.bet;
          h.outcome = 'lose';
        } else if (dealerNatural) {
          h.result = h.status === 'blackjack' ? 0 : -h.bet;
          h.outcome = h.result ? 'lose' : 'push';
        } else if (h.status === 'blackjack') {
          h.result = (h.bet * 3) / 2;
          h.outcome = 'blackjack';
        } else if (d.bust || v.total > d.total) {
          h.result = h.bet;
          h.outcome = 'win';
        } else if (v.total < d.total) {
          h.result = -h.bet;
          h.outcome = 'lose';
        } else {
          h.result = 0;
          h.outcome = 'push';
        }
        return total + h.result;
      }, 0),
    );
    next.phase = 'over';
    next.event.kind = 'settled';
  }
  return next;
}
export function blackjackView(g: BlackjackMatch, seat: number): BlackjackView {
  // Build explicitly: no deck or hidden hole-card value, even for observers.
  const hidden = g.phase === 'players' || g.phase === 'reveal';
  return {
    id: g.id,
    revision: g.revision,
    phase: g.phase,
    stake: g.stake,
    hands: structuredClone(g.hands),
    dealer: g.dealer.map((c, i) => (hidden && i === 1 ? null : c)),
    turn: g.turn,
    hand: g.hand,
    result: [...g.result],
    event: { ...g.event },
    legal: blackjackLegal(g, seat),
  };
}
