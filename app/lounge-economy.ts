// Shared, immutable ledger logic. Persist the returned ledger before publishing
// a game transition. Wallet IDs must be authenticated by the storage/room owner.
// This module alone does not provide durable storage or cross-host authority.
export const INITIAL_BEOM = 100_000;
export const BEOM_LABEL = '범';
export type EconomyGame = 'chess' | 'gostop' | 'poker' | 'blackjack' | 'seotda';
export type GameEscrow = {
  game: EconomyGame;
  wallets: string[];
  deposits: number[];
  state: 'reserved' | 'settled' | 'void';
  result: number[];
};
/** House → account (`grant`, minted) or account → house (`spend`). */
export type LedgerEntry = {
  id: string;
  type: 'grant' | 'spend';
  wallet: string;
  amount: number;
  at: number;
  reason: string;
};
/** Totals folded out of the hot `games` map (see `compactLedger`). */
export type LedgerArchive = {
  games: number;
  /** Casino net of archived blackjack rounds. */
  houseNet: number;
  accounts: Record<string, { games: number; net: number }>;
};
export type LoungeLedger = {
  version: 1;
  revision: number;
  accounts: Record<string, number>;
  games: Record<string, GameEscrow>;
  // Optional only for legacy v1 ledgers. Casino net is the counterparty to blackjack
  // plus every `spend` entry.
  houseBalance?: number;
  /** Total minted by `grant` entries (daily bonus / bankruptcy relief). */
  granted?: number;
  /** Total moved account → house by `spend` entries. */
  spent?: number;
  /** Most recent grant/spend entries (older ones stay in the totals). */
  entries?: LedgerEntry[];
  /** Last claimed KST day number per wallet for the daily grant. */
  daily?: Record<string, number>;
  archive?: LedgerArchive;
  /**
   * Daily and lifetime grant/spend totals by source bucket (see `flowBucket`),
   * so the economy report is not limited to the last 200 `entries`. Absent in
   * older ledgers; created by the first grant/spend after the update (`base`
   * records the lifetime totals at that moment).
   */
  flows?: LedgerFlows;
};
/** One KST day of grant (`g`) and spend (`s`) totals per bucket. */
export type FlowDay = { d: number; g: Record<string, number>; s: Record<string, number> };
export type LedgerFlows = {
  /** When the counters started (older money is only in `base`). */
  since: number;
  base: { granted: number; spent: number };
  total: { g: Record<string, number>; s: Record<string, number> };
  /** Most recent KST days, oldest first (at most LEDGER_FLOW_DAYS). */
  days: FlowDay[];
};
/** Days of per-day flow totals kept in the ledger (bounded world row). */
export const LEDGER_FLOW_DAYS = 90;
const FLOW_BUCKETS_MAX = 48;
/** Settled/void games kept in hot state; older ones are folded into `archive`. */
export const LEDGER_HOT_GAMES = 500;
const LEDGER_ENTRY_LIMIT = 200;
const LEDGER_GAME_SANITY_LIMIT = 100_000;
const safe = (n: unknown): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n);
const walletKey = (id: unknown): id is string =>
  typeof id === 'string' && /^wallet-[A-Za-z0-9_-]{20,86}$/.test(id);
const matchKey = (id: unknown): id is string =>
  typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(id);
const own = (o: object, key: string) => Object.hasOwn(o, key);
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
function fail(message: string): never {
  throw new Error(message);
}
export const newLoungeLedger = (): LoungeLedger => ({
  version: 1,
  revision: 0,
  accounts: {},
  games: {},
  houseBalance: 0,
});

const bucketsOk = (o: unknown) =>
  !!o &&
  typeof o === 'object' &&
  !Array.isArray(o) &&
  Object.keys(o).length <= FLOW_BUCKETS_MAX &&
  Object.entries(o).every(
    ([k, n]) => /^[a-z0-9-]{1,24}$/.test(k) && safe(n) && n >= 0,
  );
function flowsOk(f: LedgerFlows) {
  return (
    !!f &&
    typeof f === 'object' &&
    safe(f.since) &&
    !!f.base &&
    safe(f.base.granted) &&
    safe(f.base.spent) &&
    !!f.total &&
    bucketsOk(f.total.g) &&
    bucketsOk(f.total.s) &&
    Array.isArray(f.days) &&
    f.days.length <= LEDGER_FLOW_DAYS &&
    f.days.every((d) => !!d && safe(d.d) && bucketsOk(d.g) && bucketsOk(d.s))
  );
}
/**
 * Source/sink bucket of a grant/spend reason for the daily flow totals.
 * Crop sales stay per crop ('sell-strawberry'); everything else is grouped so
 * the key set stays small (FLOW_BUCKETS_MAX).
 */
export function flowBucket(type: LedgerEntry['type'], reason: string): string {
  if (type === 'grant') {
    if (reason === 'daily' || reason === 'daily-relief') return reason;
    if (reason.startsWith('sell-')) return reason.slice(0, 24);
    if (
      ['ach', 'request', 'event', 'wish', 'donate', 'bundle-done', 'casino-night'].includes(reason)
    )
      return reason;
    return 'grant-other';
  }
  if (reason.startsWith('buy-seed') || reason.startsWith('buy-bundle')) return 'seeds';
  if (reason.startsWith('buy-trophy') || reason === 'buy-fruit-basket') return 'trophy';
  if (reason.startsWith('buy-palette')) return 'palette';
  if (reason.startsWith('buy-')) return 'consumable';
  if (reason.startsWith('farm-')) return 'farm-expand';
  if (reason.startsWith('rod-')) return 'rod';
  if (reason.startsWith('house-')) return 'house';
  if (
    ['furn', 'furn-premium', 'shop-reroll', 'bundle', 'project', 'festival'].includes(reason)
  )
    return reason;
  return 'spend-other';
}
function addFlow(
  ledger: LoungeLedger,
  type: LedgerEntry['type'],
  amount: number,
  at: number,
  reason: string,
) {
  const flows = (ledger.flows ??= {
    since: at,
    // Totals before this entry was applied (entry() updates granted/spent first).
    base: {
      granted: (ledger.granted ?? 0) - (type === 'grant' ? amount : 0),
      spent: (ledger.spent ?? 0) - (type === 'spend' ? amount : 0),
    },
    total: { g: {}, s: {} },
    days: [],
  });
  const key = flowBucket(type, reason),
    side = type === 'grant' ? 'g' : 's',
    day = kstDay(at);
  const bump = (o: Record<string, number>) => {
    if (!(key in o) && Object.keys(o).length >= FLOW_BUCKETS_MAX) {
      const other = type === 'grant' ? 'grant-other' : 'spend-other';
      o[other] = (o[other] ?? 0) + amount;
    } else o[key] = (o[key] ?? 0) + amount;
  };
  bump(flows.total[side]);
  // Per day, crop sales share one bucket so a day stays small (the lifetime
  // totals keep them per crop).
  const dayKey = type === 'grant' && key.startsWith('sell-') && !DAY_SELL_KEYS.has(key) ? 'sell-crop' : key;
  let today = flows.days.find((d) => d.d === day);
  if (!today) {
    today = { d: day, g: {}, s: {} };
    flows.days.push(today);
    flows.days.sort((a, b) => a.d - b.d);
    if (flows.days.length > LEDGER_FLOW_DAYS)
      flows.days = flows.days.slice(-LEDGER_FLOW_DAYS);
  }
  const o = today[side];
  o[dayKey] = (o[dayKey] ?? 0) + amount;
}
/** Item sale buckets kept apart per day (everything else 'sell-*' is a crop). */
const DAY_SELL_KEYS = new Set([
  'sell-fish',
  'sell-bug',
  'sell-forage',
  'sell-flower',
  'sell-material',
  'sell-dish',
  'sell-fruit',
]);

export function validateLedger(value: unknown): asserts value is LoungeLedger {
  const v = value as LoungeLedger;
  if (
    !v ||
    typeof v !== 'object' ||
    v.version !== 1 ||
    !safe(v.revision) ||
    v.revision < 0 ||
    !v.accounts ||
    typeof v.accounts !== 'object' ||
    Array.isArray(v.accounts) ||
    !v.games ||
    typeof v.games !== 'object' ||
    Array.isArray(v.games)
  )
    fail('공통 지갑 기록을 읽을 수 없습니다.');
  const accounts = Object.entries(v.accounts),
    games = Object.entries(v.games);
  // Settled games are archived by compactLedger, so only a corrupt world gets here.
  if (accounts.length > 512 || games.length > LEDGER_GAME_SANITY_LIMIT)
    fail('공통 지갑의 저장 한도에 도달했습니다.');
  for (const [id, amount] of accounts)
    if (!walletKey(id) || !safe(amount) || amount < 0)
      fail('유효하지 않은 지갑 잔액입니다.');
  let held = 0,
    casinoNet = 0;
  for (const [id, g] of games) {
    if (
      !matchKey(id) ||
      !g ||
      !['chess', 'gostop', 'poker', 'blackjack', 'seotda'].includes(g.game) ||
      !['reserved', 'settled', 'void'].includes(g.state) ||
      !Array.isArray(g.wallets) ||
      !Array.isArray(g.deposits) ||
      !Array.isArray(g.result) ||
      g.wallets.length !== g.deposits.length ||
      g.wallets.length !== g.result.length ||
      g.wallets.some((w) => !walletKey(w) || !own(v.accounts, w)) ||
      new Set(g.wallets).size !== g.wallets.length ||
      g.deposits.some((n) => !safe(n) || n < 0) ||
      g.result.some((n, i) => !safe(n) || n < -g.deposits[i]) ||
      (g.game !== 'blackjack' && sum(g.result) !== 0) ||
      (g.game === 'blackjack' && g.result.some((n, i) => n > g.deposits[i])) ||
      ((g.state === 'reserved' || g.state === 'void') &&
        g.result.some((n) => n !== 0))
    )
      fail('유효하지 않은 게임 정산 기록입니다.');
    const n = g.wallets.length;
    if (
      g.game === 'chess'
        ? n !== 2
        : g.game === 'gostop'
          ? n !== 3
          : // Blackjack may be played alone against the dealer (혼자 하기).
            n < (g.game === 'blackjack' ? 1 : 2) || n > 7
    )
      fail('게임의 참가 인원이 올바르지 않습니다.');
    if (g.state === 'reserved') held += sum(g.deposits);
    if (g.game === 'blackjack' && g.state === 'settled')
      casinoNet -= sum(g.result);
  }
  const houseBalance = v.houseBalance === undefined ? 0 : v.houseBalance,
    granted = v.granted ?? 0,
    spent = v.spent ?? 0,
    archive = v.archive ?? { games: 0, houseNet: 0, accounts: {} };
  if (
    !safe(granted) ||
    granted < 0 ||
    !safe(spent) ||
    spent < 0 ||
    !archive ||
    !safe(archive.games) ||
    archive.games < 0 ||
    !safe(archive.houseNet) ||
    !archive.accounts ||
    typeof archive.accounts !== 'object' ||
    Object.values(archive.accounts).some(
      (a) => !a || !safe(a.games) || !safe(a.net),
    ) ||
    (v.entries !== undefined &&
      (!Array.isArray(v.entries) ||
        v.entries.some(
          (e) =>
            !e ||
            !['grant', 'spend'].includes(e.type) ||
            !safe(e.amount) ||
            e.amount <= 0,
        ))) ||
    (v.daily !== undefined &&
      (typeof v.daily !== 'object' ||
        Object.values(v.daily).some((d) => !safe(d)))) ||
    (v.flows !== undefined && !flowsOk(v.flows))
  )
    fail('공통 지갑 기록을 읽을 수 없습니다.');
  // Invariant: balances + reservations + house − minted grants = initial total.
  if (
    !safe(houseBalance) ||
    houseBalance !== casinoNet + archive.houseNet + spent ||
    !safe(held) ||
    sum(accounts.map(([, amount]) => amount)) + held + houseBalance - granted !==
      accounts.length * INITIAL_BEOM
  )
    fail('공통 지갑 총액이 일치하지 않습니다.');
}
// Missing storage and damaged storage are deliberately different outcomes.
export function readLoungeLedger(raw: string | null): LoungeLedger | null {
  if (raw === null) return null;
  const ledger: unknown = JSON.parse(raw);
  validateLedger(ledger);
  return ledger;
}
function changed(ledger: LoungeLedger) {
  const next = structuredClone(ledger);
  next.revision++;
  if (!safe(next.revision)) fail('공통 지갑 기록 한도를 초과했습니다.');
  return next;
}
export function registerWallet(
  ledger: LoungeLedger,
  wallet: string,
): LoungeLedger {
  validateLedger(ledger);
  if (!walletKey(wallet)) fail('지갑 식별자가 올바르지 않습니다.');
  if (own(ledger.accounts, wallet)) return ledger;
  if (Object.keys(ledger.accounts).length >= 512)
    fail('공통 지갑의 저장 한도에 도달했습니다.');
  const next = changed(ledger);
  next.accounts[wallet] = INITIAL_BEOM;
  validateLedger(next);
  return next;
}
export function reserveGame(
  ledger: LoungeLedger,
  id: string,
  game: EconomyGame,
  wallets: string[],
  deposits: number[],
): LoungeLedger {
  validateLedger(ledger);
  if (!matchKey(id) || own(ledger.games, id))
    fail('이미 처리했거나 올바르지 않은 게임입니다.');
  if (
    wallets.length !== deposits.length ||
    new Set(wallets).size !== wallets.length ||
    wallets.some(
      (w, i) =>
        !walletKey(w) ||
        !own(ledger.accounts, w) ||
        !safe(deposits[i]) ||
        deposits[i] < 0 ||
        ledger.accounts[w] < deposits[i],
    )
  )
    fail('참가자의 잔액 또는 참가 금액을 확인해 주세요.');
  const next = changed(ledger);
  next.games[id] = {
    game,
    wallets: [...wallets],
    deposits: [...deposits],
    state: 'reserved',
    result: wallets.map(() => 0),
  };
  wallets.forEach((wallet, i) => {
    next.accounts[wallet] -= deposits[i];
  });
  validateLedger(next);
  return next;
}
export function settleGame(
  ledger: LoungeLedger,
  id: string,
  result: number[],
  voided = false,
): LoungeLedger {
  validateLedger(ledger);
  const escrow = own(ledger.games, id) ? ledger.games[id] : null;
  if (
    !escrow ||
    !Array.isArray(result) ||
    result.length !== escrow.wallets.length ||
    result.some((n, i) => !safe(n) || n < -escrow.deposits[i]) ||
    (escrow.game !== 'blackjack' && sum(result) !== 0) ||
    (escrow.game === 'blackjack' &&
      result.some((n, i) => n > escrow.deposits[i])) ||
    (voided && result.some((n) => n !== 0))
  )
    fail('정산 금액이 올바르지 않습니다.');
  const state = voided ? 'void' : 'settled';
  if (escrow.state !== 'reserved') {
    if (escrow.state !== state || escrow.result.some((n, i) => n !== result[i]))
      fail('이미 완료된 정산을 바꿀 수 없습니다.');
    return ledger;
  }
  const next = changed(ledger);
  // Canonical zeros: a -0 (e.g. from `-stake * 0`) must not leak into the ledger.
  if (escrow.game === 'blackjack')
    next.houseBalance = (next.houseBalance ?? 0) - sum(result) || 0;
  next.games[id] = { ...next.games[id], state, result: result.map((n) => n || 0) };
  escrow.wallets.forEach((wallet, i) => {
    next.accounts[wallet] += escrow.deposits[i] + result[i];
  });
  const compact = compactLedger(next);
  validateLedger(compact);
  return compact;
}
/**
 * Keep every reserved game plus the most recent `keep` settled/void games.
 * Older finished games fold into per-account counters and the archived casino
 * net, so validateLedger's totals are unchanged. Returns the same object when
 * nothing needs archiving.
 */
export function compactLedger(
  ledger: LoungeLedger,
  keep = LEDGER_HOT_GAMES,
): LoungeLedger {
  const finished = Object.entries(ledger.games).filter(
    ([, g]) => g.state !== 'reserved',
  );
  if (finished.length <= keep) return ledger;
  const next = structuredClone(ledger),
    archive = (next.archive ??= { games: 0, houseNet: 0, accounts: {} });
  for (const [id, g] of finished.slice(0, finished.length - keep)) {
    archive.games++;
    if (g.game === 'blackjack' && g.state === 'settled')
      archive.houseNet -= sum(g.result);
    g.wallets.forEach((wallet, i) => {
      const a = (archive.accounts[wallet] ??= { games: 0, net: 0 });
      a.games++;
      a.net += g.result[i];
    });
    delete next.games[id];
  }
  return next;
}
function entry(
  ledger: LoungeLedger,
  type: LedgerEntry['type'],
  wallet: string,
  amount: number,
  id: string,
  at: number,
  reason: string,
) {
  validateLedger(ledger);
  if (!walletKey(wallet) || !own(ledger.accounts, wallet))
    fail('지갑 식별자가 올바르지 않습니다.');
  if (!safe(amount) || amount <= 0) fail('금액이 올바르지 않습니다.');
  if (ledger.entries?.some((e) => e.id === id))
    fail('이미 처리한 지갑 기록입니다.');
  const next = changed(ledger);
  if (type === 'grant') {
    next.accounts[wallet] += amount;
    next.granted = (next.granted ?? 0) + amount;
  } else {
    if (next.accounts[wallet] < amount) fail('잔액이 부족해요.');
    next.accounts[wallet] -= amount;
    next.houseBalance = (next.houseBalance ?? 0) + amount;
    next.spent = (next.spent ?? 0) + amount;
  }
  next.entries = [
    ...(next.entries ?? []),
    { id, type, wallet, amount, at, reason: reason.slice(0, 40) },
  ].slice(-LEDGER_ENTRY_LIMIT);
  addFlow(next, type, amount, at, reason);
  validateLedger(next);
  return next;
}
/** House → account. The minted amount is tracked in `granted`. */
export const grantBeom = (
  ledger: LoungeLedger,
  wallet: string,
  amount: number,
  id: string,
  at: number,
  reason = 'grant',
) => entry(ledger, 'grant', wallet, amount, id, at, reason);
/** Account → house (a purchase or fee). */
export const spendBeom = (
  ledger: LoungeLedger,
  wallet: string,
  amount: number,
  id: string,
  at: number,
  reason = 'spend',
) => entry(ledger, 'spend', wallet, amount, id, at, reason);
export const DAILY_GRANT = 3_000;
/**
 * Relief: when a friend's whole wealth (available balance + table
 * reservations + `extraWealth`, i.e. bag contents at sell value supplied by
 * the life engine) is below this, the daily grant is DAILY_RELIEF instead.
 * A flat amount (not a top-up), so spending down before claiming gains
 * nothing but the 3,000범 difference, and only when truly broke.
 */
export const DAILY_RELIEF_BELOW = 10_000;
export const DAILY_RELIEF = 6_000;
const KST_OFFSET = 9 * 3_600_000,
  DAY = 86_400_000;
/** Day number in Korea Standard Time (UTC+9, no DST). */
export const kstDay = (now: number) => Math.floor((now + KST_OFFSET) / DAY);
/** Next KST midnight after `now`, as an epoch in ms. */
export const nextKstMidnight = (now: number) =>
  (kstDay(now) + 1) * DAY - KST_OFFSET;
/** 범 a wallet has locked in reserved (unsettled) games. */
export function reservedOf(ledger: LoungeLedger, wallet: string) {
  let held = 0;
  for (const g of Object.values(ledger.games))
    if (g.state === 'reserved') {
      const i = g.wallets.indexOf(wallet);
      if (i >= 0) held += g.deposits[i];
    }
  return held;
}
export function dailyGrantInfo(
  ledger: LoungeLedger,
  wallet: string | undefined,
  now: number,
  extraWealth = 0,
) {
  const balance = wallet ? (ledger.accounts[wallet] ?? 0) : 0,
    claimed = !!wallet && ledger.daily?.[wallet] === kstDay(now),
    wealth =
      balance +
      (wallet ? reservedOf(ledger, wallet) : 0) +
      (safe(extraWealth) && extraWealth > 0 ? extraWealth : 0),
    amount = wealth < DAILY_RELIEF_BELOW ? DAILY_RELIEF : DAILY_GRANT;
  return {
    available: !!wallet && own(ledger.accounts, wallet) && !claimed,
    amount,
    nextAt: claimed ? nextKstMidnight(now) : now,
  };
}
/**
 * Once per KST day: 3,000범, or a flat DAILY_RELIEF when the friend's whole
 * wealth (see DAILY_RELIEF_BELOW) is low.
 */
export function claimDailyGrant(
  ledger: LoungeLedger,
  wallet: string,
  now: number,
  extraWealth = 0,
): LoungeLedger {
  const info = dailyGrantInfo(ledger, wallet, now, extraWealth);
  if (!info.available) fail('오늘의 범은 이미 받았어요. 내일 다시 받을 수 있어요.');
  const day = kstDay(now),
    next = grantBeom(
      ledger,
      wallet,
      info.amount,
      `daily-${day}-${wallet}`,
      now,
      info.amount === DAILY_GRANT ? 'daily' : 'daily-relief',
    );
  next.daily = { ...next.daily, [wallet]: day };
  validateLedger(next);
  return next;
}
export function voidGame(ledger: LoungeLedger, id: string) {
  const escrow = own(ledger.games, id) ? ledger.games[id] : null;
  if (!escrow) fail('게임의 예약금을 찾을 수 없습니다.');
  return settleGame(
    ledger,
    id,
    escrow.wallets.map(() => 0),
    true,
  );
}
export function chessBeomResult(
  winner: 'w' | 'b' | 'draw',
  stake: number,
): number[] {
  if (!safe(stake) || stake < 0 || !['w', 'b', 'draw'].includes(winner))
    fail('체스 정산 금액이 올바르지 않습니다.');
  return winner === 'draw'
    ? [0, 0]
    : winner === 'w'
      ? [stake, -stake]
      : [-stake, stake];
}
export function goBeomResult(
  points: number[],
  perPoint: number,
  deposits: number[],
): number[] {
  if (
    points.length !== 3 ||
    deposits.length !== 3 ||
    !safe(perPoint) ||
    perPoint < 0 ||
    points.some((p) => !safe(p)) ||
    sum(points) !== 0 ||
    points.filter((p) => p > 0).length > 1 ||
    deposits.some((n) => !safe(n) || n < 0)
  )
    fail('고스톱 정산 금액이 올바르지 않습니다.');
  const winner = points.findIndex((p) => p > 0),
    result = [0, 0, 0];
  if (winner < 0) return result;
  points.forEach((p, i) => {
    if (i === winner) return;
    const amount = Math.min(deposits[i], -p * perPoint);
    result[i] = amount === 0 ? 0 : -amount;
    result[winner] += amount;
  });
  if (!result.every(safe)) fail('고스톱 정산 한도를 초과했습니다.');
  return result;
}
