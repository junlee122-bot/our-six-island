// Shared, immutable ledger logic. Persist the returned ledger before publishing
// a game transition. Wallet IDs must be authenticated by the storage/room owner.
// This module alone does not provide durable storage or cross-host authority.
export const INITIAL_BEOM = 100_000;
export const BEOM_LABEL = '범';
export type EconomyGame = 'chess' | 'gostop' | 'poker';
export type GameEscrow = {
  game: EconomyGame;
  wallets: string[];
  deposits: number[];
  state: 'reserved' | 'settled' | 'void';
  result: number[];
};
export type LoungeLedger = {
  version: 1;
  revision: number;
  accounts: Record<string, number>;
  games: Record<string, GameEscrow>;
};
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
});

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
  if (accounts.length > 512 || games.length > 10_000)
    fail('공통 지갑의 저장 한도에 도달했습니다.');
  for (const [id, amount] of accounts)
    if (!walletKey(id) || !safe(amount) || amount < 0)
      fail('유효하지 않은 지갑 잔액입니다.');
  let held = 0;
  for (const [id, g] of games) {
    if (
      !matchKey(id) ||
      !g ||
      !['chess', 'gostop', 'poker'].includes(g.game) ||
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
      sum(g.result) !== 0 ||
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
          : n < 2 || n > 7
    )
      fail('게임의 참가 인원이 올바르지 않습니다.');
    if (g.state === 'reserved') held += sum(g.deposits);
  }
  if (
    !safe(held) ||
    sum(accounts.map(([, amount]) => amount)) + held !==
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
    sum(result) !== 0 ||
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
  next.games[id] = { ...next.games[id], state, result: [...result] };
  escrow.wallets.forEach((wallet, i) => {
    next.accounts[wallet] += escrow.deposits[i] + result[i];
  });
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
