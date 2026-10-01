// 범 내역 (범마을 은행 → "범 내역" 탭): where each friend's 범 went and where
// it came from. Pure and server-side: lounge-cloud-engine.ts compares the
// ledger before and after every command and writes one line per change to a
// wallet, so every path that moves 범 (shops, food, the house, tables, the
// bank, loans) is covered without touching the money functions themselves.
//
// - A ledger grant/spend entry gives its own line, named by its reason.
// - A table stake held or paid back is a line per game ("블랙잭 판돈",
//   "블랙잭 정산").
// - Money moved to or from the bank vault is "보관함에 맡김 / 찾음".
// - Whatever is left (a loan between friends, the casino lender, a robbery)
//   is named after the command that caused it.
//
// Each friend keeps the newest LINE_MAX lines and per-day totals by category
// for DAY_KEEP days (the 오늘 / 7일 / 30일 summary), so the world row stays
// small (≈ 12 KB per friend at most).
import { kstDay, type GameEscrow, type LedgerEntry, type LoungeLedger } from './lounge-economy.ts';
import { reasonLabel } from './lounge-economy-report.ts';
import { GAME_INFO } from './lounge-games.ts';
import type { FinanceAction } from './lounge-finance.ts';

export const MONEY_CATS = ['food', 'shop', 'house', 'farm', 'village', 'game', 'bank', 'friend', 'income', 'other'] as const;
export type MoneyCat = (typeof MONEY_CATS)[number];
export const MONEY_CAT_LABEL: Record<MoneyCat, string> = {
  food: '음식',
  shop: '가게 물건',
  house: '집·가구',
  farm: '농사·도구',
  village: '마을 기부',
  game: '테이블 게임',
  bank: '은행·대출',
  friend: '친구와 주고받음',
  income: '번 돈',
  other: '기타',
};
export type MoneyLine = {
  /** Server time (ms). */
  at: number;
  /** Change to the wallet in 범: negative = spent or paid out. */
  amount: number;
  cat: MoneyCat;
  /** Korean, at most 30 characters. */
  label: string;
};
/** Per KST day: category → [in, out] (out is positive). */
export type MoneyDay = Partial<Record<MoneyCat, [number, number]>>;
export type MoneyBook = { lines: MoneyLine[]; days: Record<string, MoneyDay> };
export type MoneyLog = Record<string, MoneyBook>;

export const LINE_MAX = 120;
export const DAY_KEEP = 30;
const USERS_MAX = 16;
const LABEL_MAX = 30;

const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isCat = (v: unknown): v is MoneyCat => typeof v === 'string' && (MONEY_CATS as readonly string[]).includes(v);

/** A stored log, cleaned (unknown or broken parts dropped) and capped. */
export function readMoneyLog(raw: unknown): MoneyLog {
  const out: MoneyLog = {};
  if (!isObj(raw)) return out;
  for (const uid of Object.keys(raw).slice(-USERS_MAX)) {
    const book = raw[uid];
    if (!isObj(book)) continue;
    const lines = (Array.isArray(book.lines) ? book.lines : [])
      .filter((l): l is MoneyLine => isObj(l) && safe(l.at) && safe(l.amount) && isCat(l.cat) && typeof l.label === 'string')
      .slice(-LINE_MAX)
      .map((l) => ({ at: l.at, amount: l.amount, cat: l.cat, label: l.label.slice(0, LABEL_MAX) }));
    const days: Record<string, MoneyDay> = {};
    if (isObj(book.days))
      for (const day of Object.keys(book.days).filter((d) => /^\d{1,6}$/.test(d)).sort((a, b) => +a - +b).slice(-DAY_KEEP)) {
        const src = book.days[day];
        if (!isObj(src)) continue;
        const clean: MoneyDay = {};
        for (const [cat, pair] of Object.entries(src))
          if (isCat(cat) && Array.isArray(pair) && pair.length === 2 && safe(pair[0]) && safe(pair[1])) clean[cat] = [pair[0], pair[1]];
        days[day] = clean;
      }
    out[uid] = { lines, days };
  }
  return out;
}

/** Category of a ledger grant/spend reason (lounge-economy flowBucket's reasons). */
export function reasonCat(type: LedgerEntry['type'], reason: string): MoneyCat {
  if (type === 'grant') return 'income';
  if (['bakery', 'tavern-food', 'bar-drink', 'stall'].includes(reason)) return 'food';
  if (reason.startsWith('house-') || reason.startsWith('furn') || ['shop-reroll', 'room-style'].includes(reason)) return 'house';
  if (reason.startsWith('farm-') || reason.startsWith('rod-') || reason.startsWith('tool-') || reason.startsWith('build-') || ['research', 'respec'].includes(reason))
    return 'farm';
  if (['bundle', 'project', 'festival', 'venue-up', 'fair-fee'].includes(reason)) return 'village';
  if (reason === 'buy-guard') return 'bank';
  if (reason.startsWith('buy-')) return 'shop';
  return 'other';
}

const EXTRA_LABEL: Record<string, string> = {
  'buy-guard': '도둑 대비 (자물쇠·호루라기)',
  stall: '시장 노점 간식',
  'fair-fee': '농산물 품평회 참가비',
  fair: '농산물 품평회 상금',
  'fish-cup': '낚시 대회 상금',
  'museum-ms': '박물관 기증 보상',
  fete: '마을 잔치 보상',
  adapt: '마을 적응하기 보상',
  auction: '새벽 경매 판매',
  'coop-week': '농협 주간 웃돈',
};
/** Korean name of a grant/spend reason. */
export function moneyReasonLabel(reason: string): string {
  if (Object.hasOwn(EXTRA_LABEL, reason)) return EXTRA_LABEL[reason];
  if (reason.startsWith('build-')) return '짓기: ' + reasonLabel('buy-' + reason.slice(6)).replace(/^상점: /, '');
  return reasonLabel(reason);
}

const gameName = (g: GameEscrow) => (Object.hasOwn(GAME_INFO, g.game) ? GAME_INFO[g.game as keyof typeof GAME_INFO].name : g.game);

/** The remainder's name for a command (a loan, the lender, a robbery…). */
export function moneyHint(action: unknown): { label: string; cat: MoneyCat } | null {
  if (!isObj(action) || action.kind !== 'finance') return null;
  switch ((action as FinanceAction).op) {
    case 'accept':
      return { label: '친구 사이 대출', cat: 'friend' };
    case 'repay':
      return { label: '대출 갚기', cat: 'friend' };
    case 'borrow':
      return { label: '카지노 대출 (로제)', cat: 'bank' };
    case 'rob':
      return { label: '도둑질 · 벌금', cat: 'friend' };
    case 'mercy':
      return { label: '로제의 선처', cat: 'bank' };
    default:
      return { label: '은행 거래', cat: 'bank' };
  }
}

/**
 * The log after one command: every wallet whose 범 changed between `before`
 * and `after` gets its lines (see the header). `hint` names what is left
 * after entries, tables and the vault are accounted for.
 */
export function recordMoney(
  log: MoneyLog,
  before: LoungeLedger,
  after: LoungeLedger,
  now: number,
  hint: { label: string; cat: MoneyCat } | null,
): MoneyLog {
  const seen = new Set((before.entries ?? []).map((e) => e.id));
  const fresh = (after.entries ?? []).filter((e) => !seen.has(e.id));
  let next: MoneyLog | null = null;
  for (const [wallet, balance] of Object.entries(after.accounts)) {
    if (!wallet.startsWith('wallet-') || !Object.hasOwn(before.accounts, wallet)) continue;
    const delta = balance - before.accounts[wallet];
    const vault = (after.vault?.[wallet] ?? 0) - (before.vault?.[wallet] ?? 0);
    const lines: MoneyLine[] = [];
    const add = (amount: number, cat: MoneyCat, label: string) => {
      if (!amount) return;
      // One line per name in one command (selling ten tomatoes is one line).
      const same = lines.find((l) => l.label === label && l.cat === cat && Math.sign(l.amount) === Math.sign(amount));
      if (same) same.amount += amount;
      else lines.push({ at: now, amount, cat, label: label.slice(0, LABEL_MAX) });
    };
    for (const e of fresh)
      if (e.wallet === wallet) add(e.type === 'spend' ? -e.amount : e.amount, reasonCat(e.type, e.reason), moneyReasonLabel(e.reason));
    for (const [id, game] of Object.entries(after.games)) {
      const i = game.wallets.indexOf(wallet);
      if (i < 0) continue;
      const was = Object.hasOwn(before.games, id) ? before.games[id] : null;
      if (was && was.state === game.state) continue;
      const held = !was || was.state !== 'reserved' ? 0 : game.deposits[i];
      if (game.state === 'reserved' && !was) add(-game.deposits[i], 'game', `${gameName(game)} 판돈`);
      else if (game.state === 'settled') {
        // Reserved earlier: the stake comes back with the result; reserved and
        // settled in one go: only the result moves.
        add(held + game.result[i], 'game', `${gameName(game)} 정산`);
      } else if (game.state === 'void' && held) add(held, 'game', `${gameName(game)} 판돈 돌려받음`);
    }
    if (vault) add(-vault, 'bank', vault > 0 ? '은행 보관함에 맡김' : '은행 보관함에서 찾음');
    const rest = delta - lines.reduce((t, l) => t + l.amount, 0);
    if (rest) add(rest, hint?.cat ?? 'other', hint?.label ?? (rest > 0 ? '받은 범' : '나간 범'));
    if (!lines.length) continue;
    next ??= { ...log };
    const uid = wallet.slice(7);
    const book = next[uid] ?? { lines: [], days: {} };
    const day = String(kstDay(now));
    const totals: MoneyDay = { ...book.days[day] };
    for (const l of lines) {
      // Moving 범 into or out of my own vault is neither spending nor income.
      if (l.label.startsWith('은행 보관함')) continue;
      const [gain, loss] = totals[l.cat] ?? [0, 0];
      totals[l.cat] = l.amount > 0 ? [gain + l.amount, loss] : [gain, loss - l.amount];
    }
    const days = { ...book.days, [day]: totals };
    const keep = Object.keys(days).sort((a, b) => +a - +b).slice(-DAY_KEEP);
    next[uid] = {
      lines: [...book.lines, ...lines].slice(-LINE_MAX),
      days: Object.fromEntries(keep.map((d) => [d, days[d]])),
    };
  }
  if (!next) return log;
  const users = Object.keys(next);
  if (users.length > USERS_MAX) for (const uid of users.slice(0, users.length - USERS_MAX)) delete next[uid];
  return next;
}

export type MoneyLogView = {
  /** Newest first. */
  lines: MoneyLine[];
  /** Totals by category over the last 1, 7 and 30 KST days (today included). */
  summary: Record<'today' | 'week' | 'month', { spent: number; earned: number; cats: { cat: MoneyCat; spent: number; earned: number }[] }>;
};

/** One friend's 범 내역 for the bank window. */
export function moneyLogView(log: MoneyLog, uid: string, now: number): MoneyLogView {
  const book = log[uid] ?? { lines: [], days: {} };
  const today = kstDay(now);
  const span = (n: number) => {
    const cats = new Map<MoneyCat, { spent: number; earned: number }>();
    for (const [day, totals] of Object.entries(book.days)) {
      if (+day <= today - n || +day > today) continue;
      for (const [cat, [gain, loss]] of Object.entries(totals) as [MoneyCat, [number, number]][]) {
        const c = cats.get(cat) ?? { spent: 0, earned: 0 };
        c.spent += loss;
        c.earned += gain;
        cats.set(cat, c);
      }
    }
    const list = [...cats.entries()].map(([cat, v]) => ({ cat, ...v })).sort((a, b) => b.spent - a.spent || b.earned - a.earned);
    return { spent: list.reduce((t, c) => t + c.spent, 0), earned: list.reduce((t, c) => t + c.earned, 0), cats: list };
  };
  return { lines: [...book.lines].reverse(), summary: { today: span(1), week: span(7), month: span(30) } };
}
