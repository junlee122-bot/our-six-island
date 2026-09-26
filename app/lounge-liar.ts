// 라이어 게임, 3–7 friends, no 범 and no dealer. Pure and server-authoritative:
// the match (with the word and the liar's seat) stays in the room's private
// snapshot; every client only ever receives liarView for its own seat.
//
// A round:
// 1. 힌트: the server picks a category and a word (lounge-liar-words.ts) and
//    one random liar, who only learns the category. In seat order each
//    player gives a one-line hint (timed; away / late seats pass).
// 2. 토론: free talk in the table chat (timed); everyone can press "투표로".
// 3. 투표: everyone names who they think the liar is (not themselves). A tie
//    at the top is voted again among the tied; a second tie lets the liar go.
// 4. 정답: if the accused is the liar, they get one guess of the word (picked
//    from the category's list). Right → the liar wins after all.
// Scoring: the liar winning (escaped, or caught and guessed) scores 2 for
// the liar; the citizens winning scores 1 for each citizen. Totals carry
// over the table's rounds.
import { cleanText } from './text-clean.ts';
import { LIAR_CATEGORIES } from './lounge-liar-words.ts';

export type LiarPhase = 'hint' | 'discuss' | 'vote' | 'guess' | 'over';
export type LiarLine = { seat: number; text: string };
export type LiarMatch = {
  id: string;
  revision: number;
  n: number;
  first: number;
  phase: LiarPhase;
  category: string;
  /** Secret: never sent to the liar or to watchers before the reveal. */
  word: string;
  /** Secret: the liar's seat (public only once caught or over). */
  liar: number;
  /** Hint turn (seat), -1 outside the hint phase. */
  turn: number;
  hints: (string | null)[];
  /** Pressed "투표로" during the discussion. */
  ready: boolean[];
  /** Secret while voting: target seat, -1 abstain, null not yet. */
  votes: (number | null)[];
  voteRound: 1 | 2;
  candidates: number[];
  /** Closed votes (public): each round's ballots. */
  ballots: { round: number; votes: (number | null)[]; tally: number[] }[];
  accused: number | null;
  guess: string | null;
  winner: 'liar' | 'citizens' | null;
  reason: string;
  /** This round's points and the table's running totals. */
  points: number[];
  totals: number[];
  log: LiarLine[];
};
export type LiarAction =
  | { kind: 'hint'; text: string }
  | { kind: 'ready' }
  | { kind: 'vote'; target: number }
  | { kind: 'guess'; word: string };
export type LiarView = Omit<LiarMatch, 'word' | 'liar' | 'votes'> & {
  role: 'liar' | 'citizen' | 'watcher';
  /** The word, for citizens (and for everyone once over). */
  word: string | null;
  /** The liar's seat once it is public (caught, or over). */
  liar: number | null;
  /** Who has voted in the current vote (not whom). */
  voted: boolean[];
  myVote: number | null;
  /** The liar's guess options (the category's words), in the guess phase. */
  choices: string[] | null;
  legal: {
    enabled: boolean;
    hint: boolean;
    ready: boolean;
    vote: boolean;
    guess: boolean;
  };
};

export const LIAR_HINT_MAX = 40;
/** Phase clocks (ms). The hint clock is per player. */
export const LIAR_LIMIT_MS: Record<Exclude<LiarPhase, 'over'>, number> = {
  hint: 40_000,
  discuss: 75_000,
  vote: 30_000,
  guess: 30_000,
};
export const LIAR_WIN_POINTS = 2;
export const CITIZEN_WIN_POINTS = 1;
/** Shown for a seat that passed (time out / away). */
export const LIAR_PASS = '(패스)';

/** Uniform integer in [0, n) from the crypto RNG. */
export function cryptoPick(n: number): number {
  const b = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  for (;;) {
    crypto.getRandomValues(b);
    if (b[0] < limit) return b[0] % n;
  }
}
const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

export function newLiar(
  id: string,
  n: number,
  first = 0,
  totals?: readonly number[],
  pick: (n: number) => number = cryptoPick,
): LiarMatch {
  if (!Number.isInteger(n) || n < 3 || n > 7) throw new Error('라이어 게임은 3–7명이 해요.');
  const cat = LIAR_CATEGORIES[pick(LIAR_CATEGORIES.length)];
  const word = cat.words[pick(cat.words.length)];
  const start = ((first % n) + n) % n;
  return {
    id,
    revision: 0,
    n,
    first: start,
    phase: 'hint',
    category: cat.name,
    word,
    liar: pick(n),
    turn: start,
    hints: Array.from({ length: n }, () => null),
    ready: Array.from({ length: n }, () => false),
    votes: Array.from({ length: n }, () => null),
    voteRound: 1,
    candidates: Array.from({ length: n }, (_, i) => i),
    ballots: [],
    accused: null,
    guess: null,
    winner: null,
    reason: '',
    points: Array.from({ length: n }, () => 0),
    totals: totals?.length === n ? [...totals] : Array.from({ length: n }, () => 0),
    log: [],
  };
}

const say = (g: LiarMatch, seat: number, text: string) => {
  g.log = [...g.log, { seat, text }].slice(-16);
};

/** Identifies one pending decision: a new key restarts the room's clock. */
export function liarKey(g: LiarMatch): string | null {
  if (g.phase === 'over') return null;
  if (g.phase === 'hint') return `${g.id}:hint:${g.turn}`;
  if (g.phase === 'vote') return `${g.id}:vote:${g.voteRound}`;
  return `${g.id}:${g.phase}`;
}
export const liarLimit = (g: LiarMatch) =>
  g.phase === 'over' ? 0 : LIAR_LIMIT_MS[g.phase];

function finish(g: LiarMatch, winner: 'liar' | 'citizens', reason: string) {
  g.phase = 'over';
  g.turn = -1;
  g.winner = winner;
  g.reason = reason;
  g.points = g.points.map((_, i) =>
    winner === 'liar'
      ? i === g.liar
        ? LIAR_WIN_POINTS
        : 0
      : i === g.liar
        ? 0
        : CITIZEN_WIN_POINTS,
  );
  g.totals = g.totals.map((t, i) => t + g.points[i]);
}

function nextHint(g: LiarMatch) {
  for (let k = 1; k <= g.n; k++) {
    const seat = (g.turn + k) % g.n;
    if (g.hints[seat] === null) {
      g.turn = seat;
      return;
    }
  }
  g.phase = 'discuss';
  g.turn = -1;
}

function openVote(g: LiarMatch, round: 1 | 2, candidates: number[]) {
  g.phase = 'vote';
  g.voteRound = round;
  g.candidates = candidates;
  g.votes = Array.from({ length: g.n }, () => null);
}

/** Counts the ballots (missing = abstain) and moves on. */
function closeVote(g: LiarMatch) {
  const tally = Array.from({ length: g.n }, () => 0);
  const votes = g.votes.map((v) => (v === null ? -1 : v));
  for (const v of votes) if (v >= 0) tally[v]++;
  g.ballots = [...g.ballots, { round: g.voteRound, votes, tally }];
  const top = Math.max(...tally);
  const leaders = tally.flatMap((t, i) => (t === top && top > 0 ? [i] : []));
  if (leaders.length !== 1) {
    if (g.voteRound === 1 && leaders.length > 1) {
      say(g, -1, '표가 똑같이 나뉘었어요. 동점자끼리 다시 투표해요.');
      openVote(g, 2, leaders);
      return;
    }
    g.accused = null;
    finish(g, 'liar', leaders.length ? '다시 투표해도 동점이라 라이어가 빠져나갔어요.' : '아무도 지목되지 않아 라이어가 빠져나갔어요.');
    return;
  }
  g.accused = leaders[0];
  if (g.accused !== g.liar) {
    finish(g, 'liar', '엉뚱한 사람을 지목해 라이어가 이겼어요.');
    return;
  }
  g.phase = 'guess';
  g.turn = g.liar;
  say(g, -1, '라이어를 찾았어요! 마지막으로 제시어를 맞힐 기회가 있어요.');
}

export function liarLegal(g: LiarMatch, seat: number): LiarView['legal'] {
  const seated = seat >= 0 && seat < g.n;
  const hint = seated && g.phase === 'hint' && g.turn === seat;
  const ready = seated && g.phase === 'discuss' && !g.ready[seat];
  const vote = seated && g.phase === 'vote' && g.votes[seat] === null;
  const guess = seated && g.phase === 'guess' && g.liar === seat;
  return { enabled: hint || ready || vote || guess, hint, ready, vote, guess };
}

/** Applies one action for `seat`; null when not legal, a string when refused with a reason. */
export function liarAction(
  original: LiarMatch,
  seat: number,
  a: LiarAction,
): LiarMatch | string | null {
  const legal = liarLegal(original, seat);
  if (!a || typeof a !== 'object') return null;
  const g = structuredClone(original);
  if (a.kind === 'hint') {
    if (!legal.hint) return null;
    const text = cleanText(typeof a.text === 'string' ? a.text : '', LIAR_HINT_MAX);
    if (!text) return '힌트를 한 줄 적어 주세요.';
    // Only a citizen can be told this (the liar must not learn the word).
    if (seat !== g.liar && norm(text).includes(norm(g.word)))
      return '제시어를 그대로 말하면 안 돼요. 돌려서 설명해 주세요.';
    g.hints[seat] = text;
    nextHint(g);
  } else if (a.kind === 'ready') {
    if (!legal.ready) return null;
    g.ready[seat] = true;
    if (g.ready.every(Boolean)) openVote(g, 1, Array.from({ length: g.n }, (_, i) => i));
  } else if (a.kind === 'vote') {
    if (!legal.vote) return null;
    if (!Number.isInteger(a.target) || a.target === seat || !g.candidates.includes(a.target))
      return null;
    g.votes[seat] = a.target;
    if (g.votes.every((v) => v !== null)) closeVote(g);
  } else if (a.kind === 'guess') {
    if (!legal.guess || typeof a.word !== 'string') return null;
    const words = LIAR_CATEGORIES.find((c) => c.name === g.category)?.words ?? [];
    const pickWord = words.find((w) => norm(w) === norm(a.word));
    if (!pickWord) return null;
    g.guess = pickWord;
    if (norm(pickWord) === norm(g.word)) finish(g, 'liar', `라이어가 제시어 '${g.word}'를 맞혔어요!`);
    else finish(g, 'citizens', `라이어의 답은 '${pickWord}'. 제시어는 '${g.word}'였어요.`);
  } else return null;
  g.revision++;
  return g;
}

/**
 * The server's step when the clock runs out (timeout) or for seats that are
 * away: late hints pass, the discussion ends, missing votes abstain, and a
 * liar who does not answer guesses nothing.
 */
export function liarAuto(original: LiarMatch, away: ReadonlySet<number>, timeout: boolean): LiarMatch | null {
  const g = structuredClone(original);
  if (g.phase === 'hint') {
    if (!timeout && !away.has(g.turn)) return null;
    g.hints[g.turn] = LIAR_PASS;
    nextHint(g);
  } else if (g.phase === 'discuss') {
    if (timeout) openVote(g, 1, Array.from({ length: g.n }, (_, i) => i));
    else {
      const missing = g.ready.flatMap((r, i) => (!r && away.has(i) ? [i] : []));
      if (!missing.length) return null;
      for (const i of missing) g.ready[i] = true;
      if (g.ready.every(Boolean)) openVote(g, 1, Array.from({ length: g.n }, (_, i) => i));
    }
  } else if (g.phase === 'vote') {
    const missing = g.votes.flatMap((v, i) => (v === null && (timeout || away.has(i)) ? [i] : []));
    if (!missing.length) return null;
    for (const i of missing) g.votes[i] = -1;
    if (g.votes.every((v) => v !== null)) closeVote(g);
  } else if (g.phase === 'guess') {
    if (!timeout && !away.has(g.liar)) return null;
    finish(g, 'citizens', `라이어가 답하지 못했어요. 제시어는 '${g.word}'였어요.`);
  } else return null;
  g.revision++;
  return g;
}

/** What one seat (or a watcher, seat -1) may see. */
export function liarView(g: LiarMatch, seat: number): LiarView {
  const over = g.phase === 'over';
  const seated = seat >= 0 && seat < g.n;
  const role: LiarView['role'] = !seated ? 'watcher' : seat === g.liar ? 'liar' : 'citizen';
  const { word, liar, votes, ...rest } = structuredClone(g);
  return {
    ...rest,
    role,
    word: over || role === 'citizen' ? word : null,
    liar: over || g.phase === 'guess' ? liar : null,
    voted: votes.map((v) => v !== null),
    myVote: seated ? votes[seat] : null,
    choices:
      g.phase === 'guess' && role === 'liar'
        ? [...(LIAR_CATEGORIES.find((c) => c.name === g.category)?.words ?? [])]
        : null,
    legal: liarLegal(g, seat),
  };
}
