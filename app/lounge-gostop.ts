import { HWATU_CARDS } from './hwatu-cards.ts';
export const CARD_INFO = new Map<
  string,
  { id: string; month: number; type: string }
>(HWATU_CARDS.map((c) => [c.id, c]));
export const cardInfo = (id: string) => CARD_INFO.get(id)!;
export const ALL_CARDS = HWATU_CARDS.map((c) => c.id) as string[];
export const MONTHS = [
  '송학',
  '매조',
  '벚꽃',
  '흑싸리',
  '난초',
  '모란',
  '홍싸리',
  '공산',
  '국진',
  '단풍',
  '오동',
  '비',
];
export const junkValue = (id: string) =>
  cardInfo(id).type !== 'junk' ? 0 : id === 'm11-02' || id === 'm12-04' ? 2 : 1;
export type GoScore = {
  total: number;
  bright: number;
  animal: number;
  ribbon: number;
  junk: number;
  brightCount: number;
  animalCount: number;
  junkCount: number;
  sets: string[];
};
export function goScore(cards: string[]): GoScore {
  const info = cards.map(cardInfo),
    bright = info.filter((c) => c.type === 'bright'),
    animal = info.filter((c) => c.type === 'animal'),
    ribbon = info.filter((c) => c.type === 'ribbon'),
    junk = cards.reduce((s, c) => s + junkValue(c), 0),
    sets: string[] = [];
  const b =
    bright.length === 5
      ? 15
      : bright.length === 4
        ? 4
        : bright.length === 3
          ? bright.some((c) => c.month === 12)
            ? 2
            : 3
          : 0;
  let a = Math.max(0, animal.length - 4),
    r = Math.max(0, ribbon.length - 4);
  if ([2, 4, 8].every((m) => animal.some((c) => c.month === m))) {
    a += 5;
    sets.push('고도리');
  }
  for (const [name, months] of [
    ['홍단', [1, 2, 3]],
    ['청단', [6, 9, 10]],
    ['초단', [4, 5, 7]],
  ] as [string, number[]][]) {
    if (months.every((m) => ribbon.some((c) => c.month === m))) {
      r += 3;
      sets.push(name);
    }
  }
  const j = Math.max(0, junk - 9);
  return {
    total: b + a + r + j,
    bright: b,
    animal: a,
    ribbon: r,
    junk: j,
    brightCount: bright.length,
    animalCount: animal.length,
    junkCount: junk,
    sets,
  };
}
type Pending = {
  played: string;
  target: string | null;
  drawn: string | null;
  stage: 'hand' | 'draw';
  captured: boolean;
  steals: number;
};
export type GoMotionStep =
  | { kind: 'play' | 'draw'; card: string }
  | { kind: 'collect'; cards: string[] }
  | { kind: 'steal'; cards: { card: string; from: number }[] }
  | { kind: 'announce'; text: string };
export type GoMotion = { seq: number; actor: number; steps: GoMotionStep[] };
export type GoMatch = {
  id: string;
  hands: string[][];
  deck: string[];
  floor: string[];
  captured: string[][];
  turn: number;
  phase: 'play' | 'choose' | 'decide' | 'over';
  options: string[];
  pending: Pending | null;
  go: number[];
  lastGoScore: number[];
  winner: number | null;
  reason: string;
  result: number[];
  events: string[];
  last: string[];
  ply: number;
  revision: number;
  motion: GoMotion | null;
};
export type GoView = Omit<GoMatch, 'hands' | 'deck'> & {
  hand: string[];
  handCounts: number[];
  deckCount: number;
};
export function shuffleCards() {
  const deck = [...ALL_CARDS];
  const random = new Uint32Array(1);
  for (let i = deck.length - 1; i > 0; i--) {
    crypto.getRandomValues(random);
    const j = Math.floor((random[0] / 4294967296) * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
export function newGo(id: string, deck: string[]): GoMatch {
  if (
    deck.length !== 48 ||
    new Set(deck).size !== 48 ||
    deck.some((c) => !CARD_INFO.has(c))
  )
    throw new Error('Invalid 48-card deck');
  const hands = [deck.slice(0, 7), deck.slice(7, 14), deck.slice(14, 21)],
    floor = deck.slice(21, 27),
    g: GoMatch = {
      id,
      hands,
      deck: deck.slice(27),
      floor,
      captured: [[], [], []],
      turn: 0,
      phase: 'play',
      options: [],
      pending: null,
      go: [0, 0, 0],
      lastGoScore: [0, 0, 0],
      winner: null,
      reason: '',
      result: [0, 0, 0],
      events: ['한 사람당 7장, 바닥 6장으로 시작합니다.'],
      last: [],
      ply: 0,
      revision: 0,
      motion: null,
    };
  const four = (cards: string[]) =>
      Array.from({ length: 12 }, (_, i) => i + 1).some(
        (m) => cards.filter((c) => cardInfo(c).month === m).length === 4,
      ),
    winners = hands.map((h, i) => (four(h) ? i : -1)).filter((i) => i >= 0);
  if (four(floor) || winners.length > 1) {
    g.phase = 'over';
    g.reason = '같은 월 네 장 · 다시 섞기';
  } else if (winners.length === 1) {
    g.phase = 'over';
    g.winner = winners[0];
    g.reason = '총통 · 5점';
    g.result = [-5, -5, -5];
    g.result[g.winner] = 10;
  }
  return g;
}
export function goView(g: GoMatch, seat: number): GoView {
  const { hands, deck, ...publicState } = g;
  return structuredClone({
    ...publicState,
    hand: seat >= 0 && seat < 3 ? hands[seat] : [],
    handCounts: hands.map((h) => h.length),
    deckCount: deck.length,
  });
}
const matching = (floor: string[], card: string) =>
  floor.filter((c) => cardInfo(c).month === cardInfo(card).month);
function take(g: GoMatch, card: string, targets: string[]) {
  g.floor = g.floor.filter((c) => !targets.includes(c));
  g.captured[g.turn].push(card, ...targets);
  if (g.pending) g.pending.captured = true;
}
function normalCard(g: GoMatch, card: string, target: string | null) {
  const matches = matching(g.floor, card);
  if (matches.length === 0) g.floor.push(card);
  else if (matches.length === 1) take(g, card, matches);
  else if (matches.length === 3) {
    take(g, card, matches);
    g.pending!.steals++;
    g.events.push('뻑 묶음을 가져왔어요.');
  } else {
    if (!target || !matches.includes(target))
      throw new Error('Capture choice required');
    take(g, card, [target]);
  }
}
function stealJunk(g: GoMatch, times: number) {
  for (let n = 0; n < times; n++)
    for (let p = 0; p < 3; p++)
      if (p !== g.turn) {
        const options = g.captured[p]
          .filter((c) => junkValue(c) > 0)
          .sort((a, b) => junkValue(a) - junkValue(b));
        if (options[0]) {
          g.captured[p] = g.captured[p].filter((c) => c !== options[0]);
          g.captured[g.turn].push(options[0]);
        }
      }
}
function stop(g: GoMatch) {
  const win = g.turn,
    scores = g.captured.map(goScore),
    s = scores[win],
    go = g.go[win],
    points =
      (go < 3 ? s.total + go : s.total * 2 ** (go - 2)) *
      (s.animalCount >= 7 ? 2 : 1);
  g.phase = 'over';
  g.winner = win;
  g.reason = `${points}점 스톱${go ? ` · ${go}고` : ''}`;
  g.result = [0, 0, 0];
  for (let i = 0; i < 3; i++)
    if (i !== win) {
      let amount = points;
      if (s.junk > 0 && scores[i].junkCount > 0 && scores[i].junkCount <= 5)
        amount *= 2;
      if (s.bright > 0 && scores[i].brightCount === 0) amount *= 2;
      g.result[i] = -amount;
      g.result[win] += amount;
    }
}
function nextTurn(g: GoMatch) {
  if (g.hands.every((h) => h.length === 0)) {
    g.phase = 'over';
    g.reason = '나가리 · 다음 판에서 만나요';
    return;
  }
  g.turn = (g.turn + 1) % 3;
  for (let i = 0; i < 3 && !g.hands[g.turn].length; i++)
    g.turn = (g.turn + 1) % 3;
  g.phase = 'play';
}
function finish(g: GoMatch) {
  const p = g.pending!;
  if (p.captured && g.floor.length === 0) {
    p.steals++;
    g.events.push('쓸! 바닥을 모두 가져왔어요.');
  }
  if (g.hands[g.turn].length) stealJunk(g, p.steals);
  g.pending = null;
  g.options = [];
  g.ply++;
  g.events = g.events.slice(-5);
  const score = goScore(g.captured[g.turn]).total;
  if (score >= 3 && score > g.lastGoScore[g.turn]) {
    g.phase = 'decide';
    if (!g.hands[g.turn].length) stop(g);
  } else nextTurn(g);
}
function drawAndResolve(g: GoMatch) {
  const p = g.pending!,
    matches = matching(g.floor, p.played),
    drawn = g.deck.shift();
  p.drawn = drawn ?? null;
  g.last = [p.played, ...(drawn ? [drawn] : [])];
  if (drawn && cardInfo(drawn).month === cardInfo(p.played).month) {
    if (matches.length === 0) {
      g.captured[g.turn].push(p.played, drawn);
      p.captured = true;
      p.steals++;
      g.events.push('쪽! 같은 월 두 장을 만났어요.');
    } else if (matches.length === 1) {
      g.floor.push(p.played, drawn);
      g.events.push('뻑! 세 장이 바닥에 남았어요.');
    } else if (matches.length === 2) {
      take(g, p.played, matches);
      g.captured[g.turn].push(drawn);
      p.steals++;
      g.events.push('따닥! 같은 월 네 장을 가져왔어요.');
    } else throw new Error('Impossible fifth card');
    finish(g);
    return;
  }
  normalCard(g, p.played, p.target);
  if (!drawn) {
    finish(g);
    return;
  }
  const drawMatches = matching(g.floor, drawn);
  if (drawMatches.length === 2) {
    p.stage = 'draw';
    g.options = drawMatches;
    g.phase = 'choose';
    return;
  }
  normalCard(g, drawn, null);
  finish(g);
}
export type GoAction =
  | { kind: 'play'; card: string }
  | { kind: 'pick'; card: string }
  | { kind: 'go' }
  | { kind: 'stop' };
function applyGoAction(
  state: GoMatch,
  seat: number,
  action: GoAction,
): GoMatch | null {
  if (state.phase === 'over' || seat !== state.turn) return null;
  const g = structuredClone(state);
  if (action.kind === 'play') {
    if (g.phase !== 'play' || !g.hands[seat].includes(action.card)) return null;
    g.hands[seat] = g.hands[seat].filter((c) => c !== action.card);
    g.pending = {
      played: action.card,
      target: null,
      drawn: null,
      stage: 'hand',
      captured: false,
      steals: 0,
    };
    const matches = matching(g.floor, action.card);
    if (matches.length === 2) {
      g.phase = 'choose';
      g.options = matches;
    } else drawAndResolve(g);
    return g;
  }
  if (action.kind === 'pick') {
    if (g.phase !== 'choose' || !g.pending || !g.options.includes(action.card))
      return null;
    if (g.pending.stage === 'hand') {
      g.pending.target = action.card;
      drawAndResolve(g);
    } else {
      normalCard(g, g.pending.drawn!, action.card);
      finish(g);
    }
    return g;
  }
  if (g.phase !== 'decide') return null;
  if (action.kind === 'stop') {
    stop(g);
    return g;
  }
  if (action.kind === 'go' && g.hands[seat].length) {
    g.go[seat]++;
    g.lastGoScore[seat] = goScore(g.captured[seat]).total;
    g.events.push(`${g.go[seat]}고! 한 번 더 도전합니다.`);
    nextTurn(g);
    return g;
  }
  return null;
}
export function goAction(
  state: GoMatch,
  seat: number,
  action: GoAction,
): GoMatch | null {
  const next = applyGoAction(state, seat, action);
  if (!next) return null;
  const steps: GoMotionStep[] = [];
  if (action.kind === 'play') steps.push({ kind: 'play', card: action.card });
  // This card is public only after the engine actually removes it from the deck.
  if (next.deck.length < state.deck.length)
    steps.push({ kind: 'draw', card: state.deck[0] });
  const publicBefore = new Set(state.captured.flat());
  const collected = next.captured[seat].filter(
    (card) => !publicBefore.has(card),
  );
  if (collected.length) steps.push({ kind: 'collect', cards: collected });
  const stolen = state.captured.flatMap((cards, from) =>
    from === seat
      ? []
      : cards
          .filter(
            (card) =>
              !next.captured[from].includes(card) &&
              next.captured[seat].includes(card),
          )
          .map((card) => ({ card, from })),
  );
  if (stolen.length) steps.push({ kind: 'steal', cards: stolen });
  if (action.kind === 'go')
    steps.push({ kind: 'announce', text: `${next.go[seat]}고!` });
  else if (action.kind === 'stop')
    steps.push({ kind: 'announce', text: '스톱!' });
  const revision = (state.revision ?? 0) + 1;
  return { ...next, revision, motion: { seq: revision, actor: seat, steps } };
}
export function goPracticeAction(g: GoView): GoAction {
  if (g.phase === 'choose')
    return {
      kind: 'pick',
      card: [...g.options].sort((a, b) => priority(b) - priority(a))[0],
    };
  if (g.phase === 'decide') return { kind: 'stop' };
  const hand = [...g.hand].sort((a, b) => {
    const am = matching(g.floor, a),
      bm = matching(g.floor, b);
    return (
      (bm.length ? 10 + Math.max(...bm.map(priority)) : 0) -
      (am.length ? 10 + Math.max(...am.map(priority)) : 0)
    );
  });
  return { kind: 'play', card: hand[0] };
}
function priority(id: string) {
  return { bright: 5, animal: 3, ribbon: 2, junk: 1 }[cardInfo(id).type] ?? 0;
}
