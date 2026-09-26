// 야추 (Yacht dice), 2–4 friends, no dealer. Pure, server-authoritative:
// the room calls these with the server's RNG and keeps the match private
// only in the sense of every other game (nothing here is hidden: dice and
// score sheets are public, so yachtView adds legal moves and potentials).
//
// Rules (the 12-category "Yacht" of the Clubhouse / 51 Worldwide Games set):
// - Each turn: up to 3 rolls of 5 dice; any dice may be kept between rolls.
// - After rolling, the player must write the dice into one empty category.
//   1–6 (에이스…식스): the sum of that face. 초이스: the sum of all dice.
//   포 카인드: 4+ of one face → the sum of all 5 dice. 풀하우스: 3 + 2 of
//   two faces → the sum of all dice. S. 스트레이트 (4 in a row) 15,
//   L. 스트레이트 (5 in a row) 30, 야추 (5 of a kind) 50. Otherwise 0.
// - Upper section (1–6) of 63 or more earns a 35-point bonus.
// - 12 rounds; the highest total wins. With 범 at stake the winner takes the
//   pot (every stake); tied winners split it (remainders go seat by seat).
export const YACHT_CATEGORIES = [
  'ones',
  'twos',
  'threes',
  'fours',
  'fives',
  'sixes',
  'choice',
  'fourKind',
  'fullHouse',
  'smallStraight',
  'largeStraight',
  'yacht',
] as const;
export type YachtCategory = (typeof YACHT_CATEGORIES)[number];
export const YACHT_UPPER: readonly YachtCategory[] = YACHT_CATEGORIES.slice(0, 6);
export const YACHT_LABEL: Record<YachtCategory, string> = {
  ones: '에이스',
  twos: '듀스',
  threes: '트레이',
  fours: '포',
  fives: '파이브',
  sixes: '식스',
  choice: '초이스',
  fourKind: '포 카인드',
  fullHouse: '풀하우스',
  smallStraight: 'S. 스트레이트',
  largeStraight: 'L. 스트레이트',
  yacht: '야추',
};
export const YACHT_HINT: Record<YachtCategory, string> = {
  ones: '1의 눈 합',
  twos: '2의 눈 합',
  threes: '3의 눈 합',
  fours: '4의 눈 합',
  fives: '5의 눈 합',
  sixes: '6의 눈 합',
  choice: '주사위 5개의 합',
  fourKind: '같은 눈 4개 이상 → 5개의 합',
  fullHouse: '3개 + 2개 → 5개의 합',
  smallStraight: '4개 연속 → 15점',
  largeStraight: '5개 연속 → 30점',
  yacht: '5개 모두 같은 눈 → 50점',
};
export const YACHT_BONUS = 35;
export const YACHT_BONUS_AT = 63;
export const YACHT_ROLLS = 3;
export const YACHT_DICE = 5;
export const YACHT_ROUNDS = YACHT_CATEGORIES.length;

export type YachtLine = { seat: number; text: string };
export type YachtMatch = {
  id: string;
  revision: number;
  /** Seats (2–4). */
  n: number;
  /** Per-seat stake (0 = 파티 판 / no 범). */
  stake: number;
  turn: number;
  /** Seat that started round 1 (rotates across rematches). */
  first: number;
  /** 1–12. */
  round: number;
  /** Rolls used this turn (0–3). */
  rolls: number;
  /** Five dice (0 before the turn's first roll). */
  dice: number[];
  /** Dice that did not move on the last throw (kept, or 당근's other dice). */
  held: boolean[];
  /** Written scores per seat and category (null = still open). */
  sheet: (number | null)[][];
  phase: 'playing' | 'over';
  /** Totals with bonus (updated as scores are written). */
  totals: number[];
  winners: number[];
  /** 범 per seat once over (sums to zero). */
  result: number[];
  /** The last written score, for the table's caption. */
  last: { seat: number; category: YachtCategory; points: number } | null;
  /** Recent events, newest last (at most 12). */
  log: YachtLine[];
  /** Counts every roll this match (the dice animation keys on it). */
  rollCount: number;
};
export type YachtAction =
  | { kind: 'roll'; held?: boolean[] }
  | { kind: 'score'; category: YachtCategory };
export type YachtLegal = {
  enabled: boolean;
  canRoll: boolean;
  canScore: boolean;
};
export type YachtView = YachtMatch & {
  legal: YachtLegal;
  /** Scores the player to act would get now, per open category. */
  potential: Partial<Record<YachtCategory, number>>;
};

/** One fair die (rejection sampling on a random byte). */
export function cryptoDie(): number {
  const b = new Uint8Array(1);
  for (;;) {
    crypto.getRandomValues(b);
    if (b[0] < 252) return (b[0] % 6) + 1;
  }
}

const sum = (ns: readonly number[]) => ns.reduce((a, b) => a + b, 0);
const counts = (dice: readonly number[]) => {
  const c = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dice) if (d >= 1 && d <= 6) c[d]++;
  return c;
};
const run = (dice: readonly number[]) => {
  const has = new Set(dice);
  let best = 0,
    cur = 0;
  for (let v = 1; v <= 6; v++) {
    cur = has.has(v) ? cur + 1 : 0;
    best = Math.max(best, cur);
  }
  return best;
};

/** Points these five dice score in a category. */
export function yachtScore(dice: readonly number[], category: YachtCategory): number {
  if (dice.length !== YACHT_DICE || dice.some((d) => !Number.isInteger(d) || d < 1 || d > 6))
    return 0;
  const c = counts(dice);
  const upper = YACHT_UPPER.indexOf(category);
  if (upper >= 0) return c[upper + 1] * (upper + 1);
  switch (category) {
    case 'choice':
      return sum(dice);
    case 'fourKind':
      return c.some((n) => n >= 4) ? sum(dice) : 0;
    case 'fullHouse': {
      const sorted = c.filter((n) => n > 0).sort((a, b) => a - b);
      return sorted.length === 2 && sorted[0] === 2 && sorted[1] === 3 ? sum(dice) : 0;
    }
    case 'smallStraight':
      return run(dice) >= 4 ? 15 : 0;
    case 'largeStraight':
      return run(dice) === 5 ? 30 : 0;
    case 'yacht':
      return c.some((n) => n === 5) ? 50 : 0;
    default:
      return 0;
  }
}

/** Upper sum, bonus and total of one seat's sheet. */
export function yachtTotals(row: readonly (number | null)[]) {
  const upper = sum(row.slice(0, 6).map((n) => n ?? 0));
  const bonus = upper >= YACHT_BONUS_AT ? YACHT_BONUS : 0;
  return { upper, bonus, total: sum(row.map((n) => n ?? 0)) + bonus };
}

/** Winner takes the pot; tied winners split it (remainder seat by seat). */
export function yachtSettlement(totals: readonly number[], stake: number) {
  const best = Math.max(...totals);
  const winners = totals.flatMap((t, i) => (t === best ? [i] : []));
  const pot = stake * totals.length,
    share = Math.floor(pot / winners.length),
    extra = pot - share * winners.length;
  const result = totals.map((_, i) => {
    const w = winners.indexOf(i);
    return (w < 0 ? 0 : share + (w < extra ? 1 : 0)) - stake;
  });
  return { winners, result };
}

export function newYacht(id: string, n: number, stake = 0, first = 0): YachtMatch {
  if (!Number.isInteger(n) || n < 2 || n > 4) throw new Error('야추는 2–4명이 해요.');
  if (!Number.isSafeInteger(stake) || stake < 0) throw new Error('Invalid stake');
  const start = ((first % n) + n) % n;
  return {
    id,
    revision: 0,
    n,
    stake,
    turn: start,
    first: start,
    round: 1,
    rolls: 0,
    dice: [0, 0, 0, 0, 0],
    held: [false, false, false, false, false],
    sheet: Array.from({ length: n }, () => YACHT_CATEGORIES.map(() => null)),
    phase: 'playing',
    totals: Array.from({ length: n }, () => 0),
    winners: [],
    result: Array.from({ length: n }, () => 0),
    last: null,
    log: [],
    rollCount: 0,
  };
}

export function yachtLegal(g: YachtMatch, seat: number): YachtLegal {
  const enabled = g.phase === 'playing' && seat >= 0 && g.turn === seat;
  return {
    enabled,
    canRoll: enabled && g.rolls < YACHT_ROLLS,
    canScore: enabled && g.rolls > 0,
  };
}

const say = (g: YachtMatch, seat: number, text: string) => {
  g.log = [...g.log, { seat, text }].slice(-12);
};

/**
 * Applies one action for `seat`; null when it is not legal. `die` supplies
 * the server's RNG (tests pass a fixed sequence).
 */
export function yachtAction(
  original: YachtMatch,
  seat: number,
  a: YachtAction,
  die: () => number = cryptoDie,
): YachtMatch | null {
  const legal = yachtLegal(original, seat);
  if (!legal.enabled || !a || typeof a !== 'object') return null;
  const g = structuredClone(original);
  if (a.kind === 'roll') {
    if (!legal.canRoll) return null;
    // The first roll of a turn throws all five dice.
    const held =
      g.rolls === 0
        ? [false, false, false, false, false]
        : Array.isArray(a.held) && a.held.length === YACHT_DICE
          ? a.held.map((h) => h === true)
          : g.held;
    if (held.every(Boolean)) return null;
    g.dice = g.dice.map((d, i) => (held[i] ? d : die()));
    g.held = held;
    g.rolls++;
    g.rollCount++;
  } else if (a.kind === 'score') {
    if (!legal.canScore || !YACHT_CATEGORIES.includes(a.category)) return null;
    const index = YACHT_CATEGORIES.indexOf(a.category);
    if (g.sheet[seat][index] !== null) return null;
    const points = yachtScore(g.dice, a.category);
    g.sheet[seat][index] = points;
    g.totals = g.sheet.map((row) => yachtTotals(row).total);
    g.last = { seat, category: a.category, points };
    say(g, seat, `${YACHT_LABEL[a.category]} ${points}점`);
    g.rolls = 0;
    g.dice = [0, 0, 0, 0, 0];
    g.held = [false, false, false, false, false];
    const next = (seat + 1) % g.n;
    if (next === g.first) g.round++;
    if (g.round > YACHT_ROUNDS) {
      g.round = YACHT_ROUNDS;
      g.phase = 'over';
      g.turn = -1;
      const s = yachtSettlement(g.totals, g.stake);
      g.winners = s.winners;
      g.result = s.result;
    } else g.turn = next;
  } else return null;
  g.revision++;
  return g;
}

/** 당근 (파티 판): throw one die again, outside the three rolls. */
export function yachtRerollOne(
  original: YachtMatch,
  seat: number,
  index: number,
  die: () => number = cryptoDie,
): YachtMatch | null {
  if (!yachtLegal(original, seat).canScore) return null;
  if (!Number.isInteger(index) || index < 0 || index >= YACHT_DICE) return null;
  const g = structuredClone(original);
  const before = g.dice[index];
  g.dice[index] = die();
  // `held` = the dice that did not move on the last throw (only this one moved).
  g.held = g.held.map((_, i) => i !== index);
  g.rollCount++;
  say(g, seat, `당근 한 입! 주사위 ${before} → ${g.dice[index]}`);
  g.revision++;
  return g;
}

/** Order in which a 0 is written when nothing scores (least valuable first). */
const SACRIFICE: readonly YachtCategory[] = [
  'ones',
  'yacht',
  'twos',
  'largeStraight',
  'fourKind',
  'threes',
  'smallStraight',
  'fullHouse',
  'fours',
  'fives',
  'sixes',
  'choice',
];
/** The open category that scores the most now (away / timeout play). */
export function yachtBest(dice: readonly number[], row: readonly (number | null)[]): YachtCategory {
  const open = YACHT_CATEGORIES.filter((_, i) => row[i] === null);
  let best: YachtCategory | null = null,
    points = 0;
  for (const c of open) {
    const p = yachtScore(dice, c);
    // Choice is kept for bad rolls: prefer anything else worth as much.
    if (p > points || (p === points && p > 0 && best === 'choice')) {
      best = c;
      points = p;
    }
  }
  return best ?? SACRIFICE.find((c) => open.includes(c)) ?? open[0];
}

/** The server's move for a seat that is away or ran out of time. */
export function yachtAuto(g: YachtMatch): YachtAction | null {
  if (g.phase !== 'playing' || g.turn < 0) return null;
  if (g.rolls === 0) return { kind: 'roll' };
  return { kind: 'score', category: yachtBest(g.dice, g.sheet[g.turn]) };
}

export function yachtView(g: YachtMatch, seat: number): YachtView {
  const potential: Partial<Record<YachtCategory, number>> = {};
  if (g.phase === 'playing' && g.rolls > 0 && g.turn >= 0)
    YACHT_CATEGORIES.forEach((c, i) => {
      if (g.sheet[g.turn][i] === null) potential[c] = yachtScore(g.dice, c);
    });
  return { ...structuredClone(g), legal: yachtLegal(g, seat), potential };
}
