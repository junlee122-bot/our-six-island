// 허풍 카드 (허풍 주점), 2–4 friends, no dealer. Pure and server-authoritative
// like 라이어 게임: the match (every hand, the face-down cards, the secret
// chambers) stays in the room's private snapshot; every client only ever
// receives liarsBarView for its own seat, and the bots decide from that same
// view (liarsBarBot), never from the match.
//
// Rules (Liar's Deck, our names; see scratchpad design-tavern.md §5):
// - Deck of 20: K, Q, A × 6 and 2 조커 (wild). Every round the deck is
//   shuffled, each seat still standing gets 5 cards (the rest stay hidden)
//   and a "오늘의 카드" (K / Q / A) is drawn. Card ids are reassigned at
//   random each round so an id says nothing about its face.
// - On your turn: put 1–3 cards face down, claiming they are all 오늘의 카드
//   (or 조커); the count is public. Or call "거짓말!" on the play right before
//   yours. Seats with no cards are skipped; when everyone but you is empty
//   you must call (강제 지목), so every round ends with a trigger.
// - A call turns the last play over: one card that is neither 오늘의 카드
//   nor 조커 makes it a lie (the player who put it down pulls the trigger);
//   otherwise the caller pulls.
// - 러시안룰렛 exactly as the original: every seat has its own toy revolver
//   (뻥총) with 6 chambers and one cork round at a secret fixed position,
//   set when the match starts. Each pull advances one chamber, so the risk is
//   1/6 → 1/5 → … → 1/1. The server commits sha256(id|seat|chamber|salt) at
//   the start and reveals chamber and salt when the match is over.
// - The next round starts with the one who pulled (or the next seat still
//   standing). The last one standing wins; with 범 at stake the winner takes
//   every stake.
// - Clocks: 30 s to play (then one card is played automatically: a true one
//   if any), 3.5 s reveal, 10 s to pull (then the server pulls; the chamber is
//   fixed, so when never changes the outcome), 3 s result. In a staked match
//   two automatic moves in a row forfeit.
import { sha256Hex } from './lounge-sha256.ts';

export type LbFace = 'K' | 'Q' | 'A' | 'J';
export type LbTableCard = 'K' | 'Q' | 'A';
export type LbPhase = 'play' | 'reveal' | 'trigger' | 'shot' | 'over';
export type LbLine = { seat: number; text: string };
export type LbReveal = { caller: number; target: number; ids: number[]; faces: LbFace[]; lie: boolean };
export type LiarsBarTotals = { wins: number[]; caught: number[]; survived: number[] };
export type LiarsBarMatch = {
  id: string;
  revision: number;
  n: number;
  first: number;
  stake: number;
  phase: LbPhase;
  round: number;
  /** Seat to act (play phase), -1 otherwise. */
  turn: number;
  table: LbTableCard;
  /** Secret: this round's card id → face. */
  cards: LbFace[];
  /** Secret: each seat's card ids. */
  hands: number[][];
  /** Secret ids; public as { seat, count }. */
  plays: { seat: number; ids: number[] }[];
  alive: boolean[];
  /** Forfeited (left, or two automatic moves in a staked match). */
  quit: boolean[];
  pulls: number[];
  /** Secret until over: zero-based chamber of the round (pull k fires when k − 1 = chamber). */
  chamber: number[];
  salt: string[];
  commit: string[];
  reveal: LbReveal | null;
  /** Who pulls in the trigger phase (and who pulled in the shot phase). */
  shooter: number;
  lastShot: { seat: number; out: boolean; pull: number } | null;
  /** Consecutive automatic moves per seat (staked forfeit). */
  idle: number[];
  winner: number | null;
  result: number[];
  totals: LiarsBarTotals;
  log: LbLine[];
};
export type LiarsBarAction =
  | { kind: 'play'; ids: number[] }
  | { kind: 'call' }
  | { kind: 'trigger' }
  | { kind: 'forfeit' };
export type LiarsBarLegal = {
  play: boolean;
  call: boolean;
  /** Everyone else is out of cards: only 거짓말! is allowed. */
  forced: boolean;
  trigger: boolean;
  /** Anything to do now (the game screen's 내 차례). */
  enabled: boolean;
  /** Most cards that can be put down now. */
  max: number;
};
export type LiarsBarView = {
  id: string;
  revision: number;
  n: number;
  first: number;
  stake: number;
  phase: LbPhase;
  round: number;
  turn: number;
  table: LbTableCard;
  role: 'player' | 'out' | 'watcher';
  seat: number;
  /** My cards (my seat only, while I am in). */
  hand: { id: number; face: LbFace }[] | null;
  handCount: number[];
  plays: { seat: number; count: number }[];
  alive: boolean[];
  quit: boolean[];
  pulls: number[];
  commit: string[];
  reveal: LbReveal | null;
  shooter: number;
  lastShot: { seat: number; out: boolean; pull: number } | null;
  winner: number | null;
  result: number[];
  totals: LiarsBarTotals;
  log: LbLine[];
  /** Revealed only once the match is over (to check the commitments). */
  chamber: number[] | null;
  salt: string[] | null;
  legal: LiarsBarLegal;
};

export const LB_DECK: readonly LbFace[] = [
  ...Array.from({ length: 6 }, () => 'K' as const),
  ...Array.from({ length: 6 }, () => 'Q' as const),
  ...Array.from({ length: 6 }, () => 'A' as const),
  'J',
  'J',
];
export const LB_HAND = 5;
export const LB_CHAMBERS = 6;
export const LB_MAX_PLAY = 3;
export const LB_TABLE_CARDS: readonly LbTableCard[] = ['K', 'Q', 'A'];
export const LB_FACE_NAME: Record<LbFace, string> = { K: '왕(K)', Q: '여왕(Q)', A: '에이스(A)', J: '조커' };
/** Phase clocks (ms). */
export const LB_LIMIT_MS: Record<Exclude<LbPhase, 'over'>, number> = {
  play: 30_000,
  reveal: 3_500,
  trigger: 10_000,
  shot: 3_000,
};
/** Automatic moves in a row that forfeit a staked match. */
export const LB_IDLE_FORFEIT = 2;

/** Uniform integer in [0, n) from the crypto RNG. */
export function lbPick(n: number): number {
  const b = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  for (;;) {
    crypto.getRandomValues(b);
    if (b[0] < limit) return b[0] % n;
  }
}
type Pick = (n: number) => number;

export const lbCommit = (id: string, seat: number, chamber: number, salt: string) =>
  sha256Hex(`${id}|${seat}|${chamber}|${salt}`);
/** Checks one seat's commitment after the match (the result screen's 탄창 확인). */
export const lbVerify = (v: Pick2<LiarsBarView, 'id' | 'commit' | 'chamber' | 'salt'>, seat: number) =>
  !!v.chamber &&
  !!v.salt &&
  Number.isInteger(v.chamber[seat]) &&
  lbCommit(v.id, seat, v.chamber[seat], v.salt[seat]) === v.commit[seat];
type Pick2<T, K extends keyof T> = { [P in K]: T[P] };

/** 1/k for the next pull of a seat (null when out). */
export const lbRisk = (pulls: number) => Math.max(1, LB_CHAMBERS - pulls);
export const lbTrue = (face: LbFace, table: LbTableCard) => face === table || face === 'J';

const say = (g: LiarsBarMatch, seat: number, text: string) => {
  g.log = [...g.log, { seat, text }].slice(-16);
};
const aliveCount = (g: LiarsBarMatch) => g.alive.filter(Boolean).length;
const nextAlive = (g: LiarsBarMatch, from: number) => {
  for (let k = 1; k <= g.n; k++) {
    const s = (from + k) % g.n;
    if (g.alive[s]) return s;
  }
  return from;
};

function shuffle<T>(list: readonly T[], pick: Pick): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Deals a new round starting with `starter` (who must be standing). */
function deal(g: LiarsBarMatch, starter: number, pick: Pick) {
  g.cards = shuffle(LB_DECK, pick);
  const ids = shuffle(
    Array.from({ length: LB_DECK.length }, (_, i) => i),
    pick,
  );
  let k = 0;
  g.hands = g.alive.map((a) => (a ? ids.slice(k, (k += LB_HAND)).sort((x, y) => x - y) : []));
  g.table = LB_TABLE_CARDS[pick(3)];
  g.plays = [];
  g.reveal = null;
  g.lastShot = null;
  g.phase = 'play';
  g.turn = starter;
  g.shooter = -1;
  g.round++;
  say(g, -1, `${g.round}판째 · 오늘의 카드는 ${LB_FACE_NAME[g.table]}예요.`);
}

export function newLiarsBar(
  id: string,
  n: number,
  stake = 0,
  first = 0,
  totals?: LiarsBarTotals,
  pick: Pick = lbPick,
): LiarsBarMatch {
  if (!Number.isInteger(n) || n < 2 || n > 4) throw new Error('허풍 카드는 2–4명이 해요.');
  const zeros = () => Array.from({ length: n }, () => 0);
  const chamber = Array.from({ length: n }, () => pick(LB_CHAMBERS));
  const salt = Array.from({ length: n }, () =>
    Array.from({ length: 8 }, () => pick(0x1_0000).toString(16).padStart(4, '0')).join(''),
  );
  const start = ((first % n) + n) % n;
  const g: LiarsBarMatch = {
    id,
    revision: 0,
    n,
    first: start,
    stake: Math.max(0, Math.trunc(stake) || 0),
    phase: 'play',
    round: 0,
    turn: start,
    table: 'K',
    cards: [],
    hands: [],
    plays: [],
    alive: Array.from({ length: n }, () => true),
    quit: Array.from({ length: n }, () => false),
    pulls: zeros(),
    chamber,
    salt,
    commit: chamber.map((c, i) => lbCommit(id, i, c, salt[i])),
    reveal: null,
    shooter: -1,
    lastShot: null,
    idle: zeros(),
    winner: null,
    result: zeros(),
    totals:
      totals && totals.wins?.length === n
        ? structuredClone(totals)
        : { wins: zeros(), caught: zeros(), survived: zeros() },
    log: [],
  };
  say(g, -1, '탄창을 채웠어요. 사람마다 뻥총 한 자루, 여섯 칸에 코르크 한 발이에요.');
  deal(g, start, pick);
  return g;
}

/** Winner takes the pot: +stake × (n − 1) for the winner, −stake for the rest (sum 0). */
export function liarsBarSettlement(winner: number, n: number, stake: number): number[] {
  return Array.from({ length: n }, (_, i) => (stake <= 0 ? 0 : i === winner ? stake * (n - 1) : -stake));
}

function finishIfLast(g: LiarsBarMatch) {
  if (aliveCount(g) > 1) return false;
  const winner = g.alive.indexOf(true);
  g.phase = 'over';
  g.turn = -1;
  g.shooter = -1;
  g.winner = winner;
  g.result = liarsBarSettlement(winner, g.n, g.stake);
  g.totals.wins[winner]++;
  say(g, winner, '마지막까지 버텼어요! 오늘의 허풍왕이에요.');
  return true;
}

/** Everyone standing except `seat` has no cards left. */
const othersEmpty = (g: LiarsBarMatch, seat: number) =>
  g.alive.every((a, i) => !a || i === seat || g.hands[i].length === 0);

export function liarsBarLegal(g: LiarsBarMatch, seat: number): LiarsBarLegal {
  const none = { play: false, call: false, forced: false, trigger: false, enabled: false, max: 0 };
  if (seat < 0 || seat >= g.n || !g.alive[seat]) return none;
  if (g.phase === 'trigger') return { ...none, trigger: g.shooter === seat, enabled: g.shooter === seat };
  if (g.phase !== 'play' || g.turn !== seat) return none;
  const pending = g.plays.length > 0 && g.plays[g.plays.length - 1].seat !== seat;
  const forced = pending && othersEmpty(g, seat);
  const max = Math.min(LB_MAX_PLAY, g.hands[seat].length);
  const play = !forced && max > 0;
  return { play, call: pending, forced, trigger: false, enabled: play || pending, max: forced ? 0 : max };
}

/**
 * Whose turn after `seat` played: the next standing seat with cards; when
 * nobody else has any, the next standing seat (it must call).
 */
function passTurn(g: LiarsBarMatch, seat: number) {
  for (let k = 1; k < g.n; k++) {
    const s = (seat + k) % g.n;
    if (g.alive[s] && g.hands[s].length > 0) {
      g.turn = s;
      return;
    }
  }
  g.turn = nextAlive(g, seat);
}

function removeSeat(g: LiarsBarMatch, seat: number, pick: Pick) {
  // A forfeit ends the round: the cards go back and a new round is dealt.
  g.alive[seat] = false;
  g.quit[seat] = true;
  g.hands[seat] = [];
  say(g, seat, '자리를 떠나 기권했어요.');
  if (finishIfLast(g)) return;
  const starter = g.alive[g.turn] && g.phase === 'play' ? g.turn : nextAlive(g, seat);
  deal(g, starter, pick);
}

/**
 * Applies one action for `seat`; null when not legal. `auto` marks a move the
 * server made for the seat (idle counting); `pick` is the round RNG.
 */
export function liarsBarAction(
  original: LiarsBarMatch,
  seat: number,
  a: LiarsBarAction,
  opts: { auto?: boolean; pick?: Pick } = {},
): LiarsBarMatch | null {
  if (!a || typeof a !== 'object' || original.phase === 'over') return null;
  const pick = opts.pick ?? lbPick;
  const legal = liarsBarLegal(original, seat);
  const g = structuredClone(original);
  if (a.kind === 'forfeit') {
    if (seat < 0 || seat >= g.n || !g.alive[seat]) return null;
    removeSeat(g, seat, pick);
  } else if (a.kind === 'play') {
    if (!legal.play || !Array.isArray(a.ids)) return null;
    const ids = a.ids;
    if (
      ids.length < 1 ||
      ids.length > legal.max ||
      new Set(ids).size !== ids.length ||
      !ids.every((id) => Number.isInteger(id) && g.hands[seat].includes(id))
    )
      return null;
    const before = g.plays[g.plays.length - 1];
    // Playing on accepts the claim before: a lie that slipped by is a bluff.
    if (before && before.ids.some((id) => !lbTrue(g.cards[id], g.table)))
      say(g, -1, '앞 사람의 주장은 그대로 넘어갔어요.');
    g.hands[seat] = g.hands[seat].filter((id) => !ids.includes(id));
    g.plays = [...g.plays, { seat, ids: [...ids] }];
    say(g, seat, `${ids.length}장을 내며 “전부 ${LB_FACE_NAME[g.table]}”라고 했어요.`);
    passTurn(g, seat);
  } else if (a.kind === 'call') {
    if (!legal.call) return null;
    const last = g.plays[g.plays.length - 1];
    const faces = last.ids.map((id) => g.cards[id]);
    const lie = faces.some((f) => !lbTrue(f, g.table));
    g.reveal = { caller: seat, target: last.seat, ids: [...last.ids], faces, lie };
    g.shooter = lie ? last.seat : seat;
    if (lie) g.totals.caught[seat]++;
    say(g, seat, '“거짓말!”을 외쳤어요.');
    say(g, -1, lie ? '뒤집어 보니 뻥이었어요!' : '뒤집어 보니 전부 진짜였어요!');
    g.phase = 'reveal';
    g.turn = -1;
  } else if (a.kind === 'trigger') {
    if (!legal.trigger) return null;
    const pull = g.pulls[seat] + 1;
    const out = g.pulls[seat] === g.chamber[seat];
    g.pulls[seat] = pull;
    g.lastShot = { seat, out, pull };
    if (out) {
      g.alive[seat] = false;
      g.hands[seat] = [];
      say(g, seat, `방아쇠를 당겼어요… 뻥! 검댕을 뒤집어쓰고 뻗었어요.`);
    } else {
      g.totals.survived[seat]++;
      say(g, seat, `방아쇠를 당겼어요… 딸깍! 살았어요 (${pull}/${LB_CHAMBERS}).`);
    }
    g.phase = 'shot';
  } else return null;
  if (a.kind !== 'forfeit' && seat >= 0 && seat < g.n) g.idle[seat] = opts.auto ? g.idle[seat] + 1 : 0;
  g.revision++;
  assertLiarsBar(g);
  return g;
}

/**
 * The phases that move on their own clock: reveal → trigger, shot → next
 * round or over. Null when the phase waits for a player.
 */
export function liarsBarAdvance(original: LiarsBarMatch, pick: Pick = lbPick): LiarsBarMatch | null {
  if (original.phase !== 'reveal' && original.phase !== 'shot') return null;
  const g = structuredClone(original);
  if (g.phase === 'reveal') {
    g.phase = 'trigger';
    say(g, g.shooter, '뻥총을 집었어요.');
  } else if (!finishIfLast(g)) {
    const s = g.shooter;
    deal(g, g.alive[s] ? s : nextAlive(g, s), pick);
  }
  g.revision++;
  assertLiarsBar(g);
  return g;
}

/** Identifies one pending decision: a new key restarts the room's clock. */
export function liarsBarKey(g: LiarsBarMatch): string | null {
  if (g.phase === 'over') return null;
  if (g.phase === 'play') return `${g.id}:play:${g.round}:${g.plays.length}:${g.turn}`;
  return `${g.id}:${g.phase}:${g.round}`;
}
export const liarsBarLimit = (g: LiarsBarMatch) => (g.phase === 'over' ? 0 : LB_LIMIT_MS[g.phase]);
/** The seat whose decision the clock waits for (-1: the table's own clock). */
export const liarsBarActor = (g: LiarsBarMatch) =>
  g.phase === 'play' ? g.turn : g.phase === 'trigger' ? g.shooter : -1;

/** The automatic move for the seat the clock waits for (one card, a forced call, the trigger). */
export function liarsBarDefault(g: LiarsBarMatch, seat: number): LiarsBarAction | null {
  const legal = liarsBarLegal(g, seat);
  if (legal.trigger) return { kind: 'trigger' };
  if (legal.forced || (!legal.play && legal.call)) return { kind: 'call' };
  if (!legal.play) return null;
  const hand = g.hands[seat];
  const truthful = hand.find((id) => lbTrue(g.cards[id], g.table));
  return { kind: 'play', ids: [truthful ?? hand[0]] };
}

/**
 * The server's step when the clock runs out (`timeout`) or for a seat that is
 * away / a bot (`bot` decides for it from its own view). Staked matches
 * forfeit a seat after LB_IDLE_FORFEIT automatic moves in a row.
 */
export function liarsBarAuto(
  g: LiarsBarMatch,
  opts: {
    timeout: boolean;
    away?: ReadonlySet<number>;
    bot?: (seat: number) => LiarsBarAction | null;
    staked?: boolean;
    pick?: Pick;
  },
): LiarsBarMatch | null {
  if (g.phase === 'over') return null;
  const pick = opts.pick ?? lbPick;
  if (g.phase === 'reveal' || g.phase === 'shot') return opts.timeout ? liarsBarAdvance(g, pick) : null;
  const seat = liarsBarActor(g);
  if (seat < 0) return null;
  const away = !!opts.away?.has(seat);
  const botMove = opts.bot?.(seat) ?? null;
  if (!opts.timeout && !away && !botMove) return null;
  // A bot seat plays as itself (never idle).
  if (botMove) return liarsBarAction(g, seat, botMove, { pick });
  if (opts.staked && g.idle[seat] + 1 >= LB_IDLE_FORFEIT)
    return liarsBarAction(g, seat, { kind: 'forfeit' }, { pick });
  const a = liarsBarDefault(g, seat);
  return a ? liarsBarAction(g, seat, a, { auto: true, pick }) : null;
}

/** What one seat (or a watcher, seat -1) may see. */
export function liarsBarView(g: LiarsBarMatch, seat: number): LiarsBarView {
  const seated = seat >= 0 && seat < g.n;
  const over = g.phase === 'over';
  const role: LiarsBarView['role'] = !seated ? 'watcher' : g.alive[seat] ? 'player' : 'out';
  return {
    id: g.id,
    revision: g.revision,
    n: g.n,
    first: g.first,
    stake: g.stake,
    phase: g.phase,
    round: g.round,
    turn: g.turn,
    table: g.table,
    role,
    seat: seated ? seat : -1,
    hand: role === 'player' ? g.hands[seat].map((id) => ({ id, face: g.cards[id] })) : null,
    handCount: g.hands.map((h) => h.length),
    plays: g.plays.map((p) => ({ seat: p.seat, count: p.ids.length })),
    alive: [...g.alive],
    quit: [...g.quit],
    pulls: [...g.pulls],
    commit: [...g.commit],
    reveal: g.reveal ? structuredClone(g.reveal) : null,
    shooter: g.shooter,
    lastShot: g.lastShot ? { ...g.lastShot } : null,
    winner: g.winner,
    result: [...g.result],
    totals: structuredClone(g.totals),
    log: structuredClone(g.log),
    chamber: over ? [...g.chamber] : null,
    salt: over ? [...g.salt] : null,
    legal: role === 'player' ? liarsBarLegal(g, seat) : liarsBarLegal(g, -1),
  };
}

/** Invariants checked after every step (on the server too). */
export function assertLiarsBar(g: LiarsBarMatch) {
  const inHands = g.hands.flat(),
    played = g.plays.flatMap((p) => p.ids);
  const all = [...inHands, ...played];
  if (new Set(all).size !== all.length || all.some((id) => id < 0 || id >= LB_DECK.length))
    throw new Error('허풍 카드: 카드가 겹쳤어요.');
  if (g.cards.length !== LB_DECK.length) throw new Error('허풍 카드: 덱이 20장이 아니에요.');
  if (aliveCount(g) < 1) throw new Error('허풍 카드: 살아 있는 사람이 없어요.');
  for (let i = 0; i < g.n; i++) {
    if (g.alive[i] && g.pulls[i] > g.chamber[i]) throw new Error('허풍 카드: 약실을 넘었어요.');
    if (!g.alive[i] && !g.quit[i] && g.pulls[i] !== g.chamber[i] + 1) throw new Error('허풍 카드: 탈락이 약실과 달라요.');
  }
  if (g.result.reduce((s, v) => s + v, 0) !== 0) throw new Error('허풍 카드: 정산 합이 0이 아니에요.');
}

/* ------------------------------------------------------------------ bots */

/** P(at least k of h hidden cards are true) drawing without replacement. */
function atLeast(k: number, h: number, good: number, total: number) {
  if (k <= 0) return 1;
  if (k > h || good < k) return 0;
  const choose = (a: number, b: number) => {
    if (b < 0 || b > a) return 0;
    let r = 1;
    for (let i = 1; i <= b; i++) r = (r * (a - b + i)) / i;
    return r;
  };
  let p = 0;
  for (let x = k; x <= Math.min(h, good); x++) p += choose(good, x) * choose(total - good, h - x);
  return p / choose(total, h);
}

/**
 * A bot's move from its own public view only (it cannot see anything else):
 * certain lies are called, likely ones by a threshold that grows more careful
 * with its own pulls; plays are mostly true cards with an occasional bluff.
 */
export function liarsBarBot(v: LiarsBarView, level: 'easy' | 'normal' = 'normal', rnd: () => number = Math.random): LiarsBarAction | null {
  const { legal } = v;
  if (legal.trigger) return { kind: 'trigger' };
  if (!legal.play && !legal.call) return null;
  if (legal.forced) return { kind: 'call' };
  const hand = v.hand ?? [];
  const mine = hand.filter((c) => lbTrue(c.face, v.table));
  if (legal.call) {
    const last = v.plays[v.plays.length - 1];
    const k = last.count;
    // True cards in the deck: 6 of the table card + 2 jokers = 8.
    const unseenTrue = 8 - mine.length;
    const certain = k > unseenTrue;
    let call = certain;
    if (!call && level === 'normal') {
      const unseen = 20 - hand.length;
      const heldBefore = (v.handCount[last.seat] ?? 0) + k;
      const pTrue = atLeast(k, Math.max(k, heldBefore), unseenTrue, unseen);
      const pLie = 1 - pTrue;
      const threshold = 0.3 + 0.05 * (v.pulls[v.seat] ?? 0) - 0.03 * (v.pulls[last.seat] ?? 0) + (rnd() - 0.5) * 0.16;
      call = pLie > threshold || (!legal.play && hand.length === 0);
    } else if (!call) call = k >= 3;
    if (call || !legal.play) return { kind: 'call' };
  }
  if (!legal.play) return null;
  const fakes = hand.filter((c) => !lbTrue(c.face, v.table));
  // The next seat will be forced to call if I empty my hand: never bluff big then.
  const bluffRate = level === 'easy' ? 0.35 : 0.15;
  if (mine.length) {
    const count = fakes.length === 0 ? Math.min(legal.max, mine.length) : Math.min(legal.max, mine.length, rnd() < 0.5 ? 1 : 2);
    const ids = mine.slice(0, count).map((c) => c.id);
    if (fakes.length && rnd() < bluffRate && ids.length < legal.max) ids.push(fakes[0].id);
    return { kind: 'play', ids };
  }
  return { kind: 'play', ids: [fakes[Math.floor(rnd() * fakes.length)]?.id ?? hand[0].id] };
}
