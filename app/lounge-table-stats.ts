// 테이블 기록: per-friend, per-game results and a weekly table (주간 순위)
// for every table game that settled 범. Pure and server-side like the other
// engines: the cloud engine feeds it the games that settled in a transition
// (from the ledger, so it never touches money) and returns `tableStatsView`.
// - Only 범 games are in the ledger: 파티 판 / 연습 판 / 라이어 게임 are not
//   counted (nothing is won or lost there).
// - A week runs Monday 00:00 to Sunday 24:00 KST. When a new week starts the
//   finished one is kept as `last` (its top friend per game is shown).
import { kstDay, type EconomyGame, type GameEscrow } from './lounge-economy.ts';

export const STAT_GAMES: readonly EconomyGame[] = ['blackjack', 'poker', 'seotda', 'gostop', 'chess', 'yacht', 'liarsbar'];
export type GameStat = {
  /** Rounds played. */
  n: number;
  /** Rounds won / lost (a draw or push is neither). */
  w: number;
  l: number;
  /** Net 범 over all rounds. */
  net: number;
  /** Biggest single win (범). */
  best: number;
  /** Biggest pot I played in: 범 that changed hands in one round. */
  pot: number;
};
export type WeekRow = { net: number; w: number; n: number };
export type TableStats = {
  v: 1;
  /** uid → game → totals. */
  u: Record<string, Partial<Record<EconomyGame, GameStat>>>;
  /** This week (Monday-based KST week number) per game and uid. */
  week: { k: number; g: Partial<Record<EconomyGame, Record<string, WeekRow>>> };
  /** The finished week before it (same shape), for "지난주 1등". */
  last?: { k: number; g: Partial<Record<EconomyGame, Record<string, WeekRow>>> };
};

/** Monday-based KST week number (day 0, 1970-01-01, was a Thursday). */
export const kstWeek = (now: number) => Math.floor((kstDay(now) + 3) / 7);
export const emptyTableStats = (now: number): TableStats => ({ v: 1, u: {}, week: { k: kstWeek(now), g: {} } });

const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const safe = (n: unknown): n is number => Number.isSafeInteger(n);
const isGame = (g: unknown): g is EconomyGame => typeof g === 'string' && (STAT_GAMES as readonly string[]).includes(g);

function readStat(v: unknown): GameStat | null {
  const s = v as Partial<GameStat> | null;
  if (!s || typeof s !== 'object') return null;
  const n = [s.n, s.w, s.l, s.net, s.best, s.pot];
  if (!n.every(safe) || s.n! < 0 || s.w! < 0 || s.l! < 0 || s.w! + s.l! > s.n!) return null;
  return { n: s.n!, w: s.w!, l: s.l!, net: s.net!, best: Math.max(0, s.best!), pot: Math.max(0, s.pot!) };
}
function readWeek(v: unknown): TableStats['week'] | null {
  const w = v as TableStats['week'] | null;
  if (!w || typeof w !== 'object' || !safe(w.k) || !w.g || typeof w.g !== 'object') return null;
  const g: TableStats['week']['g'] = {};
  for (const [game, rows] of Object.entries(w.g)) {
    if (!isGame(game) || !rows || typeof rows !== 'object') continue;
    const out: Record<string, WeekRow> = {};
    for (const [uid, r] of Object.entries(rows as Record<string, WeekRow>))
      if (uid.length <= 100 && r && safe(r.net) && safe(r.w) && safe(r.n) && r.w >= 0 && r.n >= r.w) out[uid] = { net: r.net, w: r.w, n: r.n };
    g[game] = out;
  }
  return { k: w.k, g };
}
/** Tolerant reader: anything malformed is dropped, never thrown. */
export function readTableStats(v: unknown, now: number): TableStats {
  const s = v as Partial<TableStats> | null;
  const out = emptyTableStats(now);
  if (!s || typeof s !== 'object' || s.v !== 1) return out;
  for (const [uid, games] of Object.entries(s.u ?? {})) {
    if (uid.length > 100 || !games || typeof games !== 'object') continue;
    const row: Partial<Record<EconomyGame, GameStat>> = {};
    for (const [game, stat] of Object.entries(games)) {
      const ok = isGame(game) ? readStat(stat) : null;
      if (ok) row[game as EconomyGame] = ok;
    }
    out.u[uid] = row;
  }
  const week = readWeek(s.week);
  if (week) out.week = week;
  const last = readWeek(s.last);
  if (last) out.last = last;
  return rollWeek(out, now);
}
/** A new KST week: this week becomes `last` (only when it is the week before). */
function rollWeek(s: TableStats, now: number): TableStats {
  const k = kstWeek(now);
  if (s.week.k === k) return s;
  const last = s.week.k === k - 1 ? s.week : s.last?.k === k - 1 ? s.last : undefined;
  return { ...s, week: { k, g: {} }, ...(last ? { last } : { last: undefined }) };
}

/**
 * Adds the games that settled in one transition. `games` come from the ledger
 * (state 'settled'); `uidOf` maps a wallet to its member id (null to skip).
 */
export function recordTableStats(
  stats: TableStats,
  games: readonly Pick<GameEscrow, 'game' | 'wallets' | 'result' | 'state'>[],
  uidOf: (wallet: string) => string | null,
  now: number,
): TableStats {
  const settled = games.filter((g) => g.state === 'settled' && isGame(g.game));
  if (!settled.length) return stats;
  const next = rollWeek(structuredClone(stats), now);
  for (const g of settled) {
    const pot = g.result.reduce((s, r) => s + Math.max(0, r), 0);
    g.wallets.forEach((wallet, i) => {
      const uid = uidOf(wallet),
        r = g.result[i];
      if (!uid || !safe(r)) return;
      const row = (next.u[uid] ??= {});
      const s = (row[g.game] ??= { n: 0, w: 0, l: 0, net: 0, best: 0, pot: 0 });
      s.n++;
      if (r > 0) s.w++;
      else if (r < 0) s.l++;
      s.net += r;
      s.best = Math.max(s.best, r);
      s.pot = Math.max(s.pot, pot);
      const week = (next.week.g[g.game] ??= {});
      const w = (week[uid] ??= { net: 0, w: 0, n: 0 });
      w.n++;
      w.net += r;
      if (r > 0) w.w++;
    });
  }
  return next;
}

export type LeagueRow = { actor: number; net: number; w: number; n: number };
export type TableStatsView = {
  /** My totals per game. */
  mine: Partial<Record<EconomyGame, GameStat>>;
  /** This week's table per game, best first (net, then wins). */
  week: Partial<Record<EconomyGame, LeagueRow[]>>;
  /** Last week's first place per game. */
  last: Partial<Record<EconomyGame, LeagueRow>>;
  /** KST week number of `week`. */
  k: number;
};
const rank = (rows: Record<string, WeekRow> | undefined, actorOf: (uid: string) => number | null): LeagueRow[] =>
  Object.entries(rows ?? {})
    .flatMap(([uid, r]) => {
      const actor = actorOf(uid);
      return actor === null ? [] : [{ actor, ...r }];
    })
    .sort((a, b) => b.net - a.net || b.w - a.w || a.n - b.n || a.actor - b.actor);

/** What one friend sees (friends are shown by actor, never by account id). */
export function tableStatsView(
  stats: TableStats,
  uid: string,
  actorOf: (uid: string) => number | null,
  now: number,
): TableStatsView {
  const s = rollWeek(stats, now);
  const week: TableStatsView['week'] = {},
    last: TableStatsView['last'] = {};
  for (const game of STAT_GAMES) {
    const rows = rank(s.week.g[game], actorOf);
    if (rows.length) week[game] = rows;
    const top = rank(s.last?.g[game], actorOf)[0];
    if (top && top.n > 0) last[game] = top;
  }
  return { mine: structuredClone(own(s.u, uid) ? s.u[uid] : {}), week, last, k: s.week.k };
}
