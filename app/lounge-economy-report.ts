// Admin-only economy report ("경제 대시보드"). Pure: computes everything from a
// world state object (hohyeon.world.state or a hohyeon.world_snapshots row) so it
// can be unit tested and run from supabase/admin/economy-report.mjs. Never ship
// this to the browser bundle — it reads every friend's balance.
//
// Data limits (see ACCOUNTS.md "경제 대시보드"):
// - ledger.granted / ledger.spent / houseBalance / balances are exact lifetime
//   totals.
// - Breakdowns by source (daily grant, farm sales, shop items) come from
//   ledger.entries, which keeps only the most recent 200 grant/spend entries.
//   `entries.complete` says whether they still cover every grant/spend ever.
// - Settled games carry no timestamp, and games older than the newest 500 are
//   folded into ledger.archive (per-account net, blackjack house net only), so
//   gambling results are lifetime totals, not per day.
import {
  INITIAL_BEOM,
  kstDay,
  type EconomyGame,
  type LedgerEntry,
} from './lounge-economy.ts';
import { CROP_INFO, SHOP_BY_ID, type Crop } from './lounge-life.ts';
import { ACCOUNT_IDS } from './lounge-accounts.ts';
import { ACTORS } from './theater-data.ts';

const DAY_MS = 86_400_000;
export const ECONOMY_GAMES: readonly EconomyGame[] = [
  'chess',
  'gostop',
  'poker',
  'blackjack',
  'seotda',
];
export const GAME_LABEL: Record<EconomyGame, string> = {
  chess: '체스',
  gostop: '고스톱',
  poker: '홀덤',
  blackjack: '블랙잭',
  seotda: '섯다',
};
export type ReportMember = { uid: string; username?: string; actor?: number };
export type EconomyReportInput = {
  /** hohyeon.world.state (only `ledger` and `life` are read). */
  state: unknown;
  /** Current time (or the snapshot time) in epoch ms. */
  now: number;
  /** hohyeon.world.revision, if known. */
  revision?: number | null;
  updatedAt?: string | null;
  /** hohyeon.members (user_id → username/actor). Falls back to life.actors. */
  members?: ReportMember[];
  /** Window for "recent" sources/sinks, default 7 days. */
  days?: number;
  /** Where the state came from, e.g. 'live' or 'snapshot #12'. */
  source?: string;
};
/** Money in/out category of a grant/spend entry. */
export type FlowKind =
  | 'daily'
  | 'relief'
  | 'farm'
  | 'grantOther'
  | 'shop'
  | 'spendOther';
export const FLOW_LABEL: Record<FlowKind, string> = {
  daily: '오늘의 범',
  relief: '오늘의 범(구제)',
  farm: '농작물 판매',
  grantOther: '기타 지급',
  shop: '상점 구매',
  spendOther: '기타 지출',
};
export type AccountRow = {
  wallet: string;
  uid: string;
  username: string | null;
  actor: number | null;
  /** Korean display name, e.g. "도원(dowon)"; unknown wallets show a short id. */
  name: string;
  balance: number;
  reserved: number;
  /** balance + reserved. */
  total: number;
  /** Finished games (hot + archived). */
  games: number;
  /** Net won/lost in games over the whole ledger (hot + archived). */
  gamblingNet: number;
  /** Net per game type (hot games); archived games are under `archived`. */
  gamblingByGame: Partial<Record<EconomyGame | 'archived', number>>;
  // From retained ledger entries only (see `entries.complete`).
  farmEarned: number;
  dailyGranted: number;
  otherGranted: number;
  shopSpent: number;
  otherSpent: number;
  /** 범 sold today (KST) against the daily sell cap. */
  soldToday: number;
  /** Lifetime harvest + fruit pick count (life.harvested). */
  harvested: number;
};
export type GameRow = {
  game: EconomyGame;
  label: string;
  reserved: number;
  settled: number;
  void: number;
  /** Deposits currently held by reserved games. */
  held: number;
  /** Sum of deposits of settled games (table stakes put at risk). */
  staked: number;
  /** Sum of positive results of settled games (money that changed hands). */
  moved: number;
  /** Casino result (blackjack only; player-vs-player games are zero-sum). */
  houseNet: number;
};
export type FlowRow = {
  reason: string;
  label: string;
  kind: FlowKind;
  count: number;
  amount: number;
};
export type DayRow = {
  /** KST date, YYYY-MM-DD. */
  date: string;
  daily: number;
  relief: number;
  farm: number;
  grantOther: number;
  shop: number;
  spendOther: number;
  granted: number;
  spent: number;
  /** granted − spent (new money for players that day, games excluded). */
  net: number;
};
export type EconomyReport = {
  generatedAt: number;
  source: string;
  revision: number | null;
  ledgerRevision: number | null;
  updatedAt: string | null;
  totals: {
    accounts: number;
    balances: number;
    reserved: number;
    /** Money supply held by players: balances + reserved. */
    playerMoney: number;
    houseBalance: number;
    /** Lifetime minted by grants (daily, relief, farm sales). */
    granted: number;
    /** Lifetime moved to the house by spends (shop). */
    spent: number;
    /** accounts × 100,000 starting 범. */
    initial: number;
    /** playerMoney + houseBalance; must equal initial + granted. */
    supply: number;
    invariantOk: boolean;
    /** supply − (initial + granted); 0 when healthy. */
    invariantDiff: number;
  };
  accounts: AccountRow[];
  games: GameRow[];
  archive: { games: number; houseNet: number };
  entries: {
    retained: number;
    oldestAt: number | null;
    newestAt: number | null;
    /** Retained entries still add up to ledger.granted/spent (nothing dropped). */
    complete: boolean;
  };
  /** All retained grants/spends grouped by reason, largest first. */
  sources: FlowRow[];
  sinks: FlowRow[];
  recent: {
    days: number;
    since: number;
    granted: number;
    spent: number;
    sources: FlowRow[];
    sinks: FlowRow[];
  };
  /** Per KST day (retained entries), newest first. */
  daily: DayRow[];
  warnings: string[];
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const int = (v: unknown) =>
  typeof v === 'number' && Number.isSafeInteger(v) ? v : 0;
const add = <K extends string>(
  o: Partial<Record<K, number>>,
  k: K,
  n: number,
) => {
  o[k] = (o[k] ?? 0) + n;
};

export function flowKind(type: LedgerEntry['type'], reason: string): FlowKind {
  if (type === 'grant') {
    if (reason === 'daily') return 'daily';
    if (reason === 'daily-relief') return 'relief';
    if (reason.startsWith('sell-')) return 'farm';
    return 'grantOther';
  }
  return reason.startsWith('buy-') ? 'shop' : 'spendOther';
}
/** Korean label of a ledger entry reason ('sell-tomato' → '토마토 판매'). */
export function reasonLabel(reason: string): string {
  if (reason === 'daily') return FLOW_LABEL.daily;
  if (reason === 'daily-relief') return FLOW_LABEL.relief;
  if (reason.startsWith('sell-')) {
    const crop = reason.slice(5);
    if (crop === 'fruit') return '과일 판매';
    const info = Object.hasOwn(CROP_INFO, crop) ? CROP_INFO[crop as Crop] : null;
    return (info ? info.name : crop) + ' 판매';
  }
  if (reason.startsWith('buy-')) {
    const id = reason.slice(4),
      item = Object.hasOwn(SHOP_BY_ID, id) ? SHOP_BY_ID[id] : null;
    return '상점: ' + (item ? item.name : id);
  }
  return reason || '(사유 없음)';
}
/** KST calendar date (YYYY-MM-DD) of an epoch-ms time. */
export const kstDate = (at: number) =>
  new Date(kstDay(at) * DAY_MS).toISOString().slice(0, 10);

function readEntries(v: unknown, warnings: string[]): LedgerEntry[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    warnings.push('ledger.entries가 배열이 아닙니다.');
    return [];
  }
  const out: LedgerEntry[] = [];
  for (const e of v) {
    if (
      isObj(e) &&
      (e.type === 'grant' || e.type === 'spend') &&
      typeof e.wallet === 'string' &&
      int(e.amount) > 0
    )
      out.push({
        id: typeof e.id === 'string' ? e.id : '',
        type: e.type,
        wallet: e.wallet,
        amount: int(e.amount),
        at: int(e.at),
        reason: typeof e.reason === 'string' ? e.reason : '',
      });
    else warnings.push('읽을 수 없는 지갑 기록 1건을 건너뛰었습니다.');
  }
  return out;
}
function groupFlows(entries: LedgerEntry[], type: LedgerEntry['type']) {
  const map = new Map<string, FlowRow>();
  for (const e of entries) {
    if (e.type !== type) continue;
    const row = map.get(e.reason) ?? {
      reason: e.reason,
      label: reasonLabel(e.reason),
      kind: flowKind(e.type, e.reason),
      count: 0,
      amount: 0,
    };
    row.count++;
    row.amount += e.amount;
    map.set(e.reason, row);
  }
  return [...map.values()].sort(
    (a, b) => b.amount - a.amount || a.reason.localeCompare(b.reason),
  );
}

export function economyReport(input: EconomyReportInput): EconomyReport {
  const warnings: string[] = [];
  const now = input.now,
    days = Math.max(1, Math.floor(input.days ?? 7)),
    state = isObj(input.state) ? input.state : {},
    ledger = isObj(state.ledger) ? state.ledger : null,
    life = isObj(state.life) ? state.life : {};
  if (!isObj(input.state)) warnings.push('world state가 객체가 아닙니다.');
  if (!ledger) warnings.push('world.state.ledger가 없습니다.');
  const L = ledger ?? {};
  const accountsRaw = isObj(L.accounts) ? L.accounts : {},
    gamesRaw = isObj(L.games) ? L.games : {},
    archiveRaw = isObj(L.archive) ? L.archive : {},
    archiveAccounts = isObj(archiveRaw.accounts) ? archiveRaw.accounts : {},
    entries = readEntries(L.entries, warnings),
    actors = isObj(life.actors) ? life.actors : {},
    sold = isObj(life.sold) ? life.sold : {},
    harvestedRaw = isObj(life.harvested) ? life.harvested : {};

  const memberByUid = new Map<string, ReportMember>();
  for (const m of input.members ?? []) if (m?.uid) memberByUid.set(m.uid, m);
  const today = kstDay(now);
  const rows = new Map<string, AccountRow>();
  const row = (wallet: string): AccountRow => {
    let r = rows.get(wallet);
    if (r) return r;
    const uid = wallet.startsWith('wallet-') ? wallet.slice(7) : wallet,
      m = memberByUid.get(uid),
      lifeActor = actors[uid],
      actor =
        typeof m?.actor === 'number'
          ? m.actor
          : typeof lifeActor === 'number'
            ? lifeActor
            : null,
      username =
        m?.username ??
        (actor !== null && actor >= 0 && actor < ACCOUNT_IDS.length
          ? ACCOUNT_IDS[actor]
          : null),
      korean = actor !== null && actor >= 0 ? ACTORS[actor] : undefined,
      s = sold[uid],
      h = harvestedRaw[uid];
    r = {
      wallet,
      uid,
      username,
      actor,
      name: korean
        ? `${korean}(${username ?? '?'})`
        : (username ?? `알 수 없음 ${uid.slice(0, 8)}`),
      balance: 0,
      reserved: 0,
      total: 0,
      games: 0,
      gamblingNet: 0,
      gamblingByGame: {},
      farmEarned: 0,
      dailyGranted: 0,
      otherGranted: 0,
      shopSpent: 0,
      otherSpent: 0,
      soldToday: isObj(s) && s.day === today ? int(s.amount) : 0,
      harvested: isObj(h)
        ? Object.values(h).reduce<number>((a, n) => a + int(n), 0)
        : 0,
    };
    rows.set(wallet, r);
    return r;
  };

  for (const [wallet, amount] of Object.entries(accountsRaw)) {
    row(wallet).balance = int(amount);
    if (!Number.isSafeInteger(amount) || (amount as number) < 0)
      warnings.push(`${wallet.slice(0, 16)}… 잔액이 올바르지 않습니다.`);
  }

  const games = new Map<EconomyGame, GameRow>(
    ECONOMY_GAMES.map((game) => [
      game,
      {
        game,
        label: GAME_LABEL[game],
        reserved: 0,
        settled: 0,
        void: 0,
        held: 0,
        staked: 0,
        moved: 0,
        houseNet: 0,
      },
    ]),
  );
  let held = 0;
  for (const [id, g] of Object.entries(gamesRaw)) {
    const game = isObj(g) ? (g.game as EconomyGame) : undefined;
    const gr = game ? games.get(game) : undefined;
    if (
      !isObj(g) ||
      !gr ||
      !Array.isArray(g.wallets) ||
      !Array.isArray(g.deposits) ||
      !Array.isArray(g.result)
    ) {
      warnings.push(`게임 기록 ${id}을(를) 읽을 수 없습니다.`);
      continue;
    }
    const wallets = g.wallets as string[],
      deposits = (g.deposits as unknown[]).map(int),
      result = (g.result as unknown[]).map(int);
    if (g.state === 'reserved') {
      gr.reserved++;
      wallets.forEach((w, i) => {
        row(w).reserved += deposits[i] ?? 0;
        held += deposits[i] ?? 0;
        gr.held += deposits[i] ?? 0;
      });
    } else if (g.state === 'settled') {
      gr.settled++;
      wallets.forEach((w, i) => {
        const r = row(w),
          n = result[i] ?? 0;
        r.games++;
        r.gamblingNet += n;
        add(r.gamblingByGame, game!, n);
        gr.staked += deposits[i] ?? 0;
        if (n > 0) gr.moved += n;
      });
      if (game === 'blackjack') gr.houseNet -= result.reduce((a, b) => a + b, 0);
    } else if (g.state === 'void') {
      gr.void++;
      for (const w of wallets) row(w).games++;
    } else warnings.push(`게임 기록 ${id}의 상태를 알 수 없습니다.`);
  }
  for (const [wallet, a] of Object.entries(archiveAccounts)) {
    if (!isObj(a)) continue;
    const r = row(wallet);
    r.games += int(a.games);
    r.gamblingNet += int(a.net);
    if (int(a.net)) add(r.gamblingByGame, 'archived', int(a.net));
  }

  for (const e of entries) {
    const r = row(e.wallet);
    switch (flowKind(e.type, e.reason)) {
      case 'farm':
        r.farmEarned += e.amount;
        break;
      case 'daily':
      case 'relief':
        r.dailyGranted += e.amount;
        break;
      case 'grantOther':
        r.otherGranted += e.amount;
        break;
      case 'shop':
        r.shopSpent += e.amount;
        break;
      case 'spendOther':
        r.otherSpent += e.amount;
        break;
    }
  }

  const accounts = [...rows.values()];
  for (const r of accounts) {
    r.total = r.balance + r.reserved;
    if (!Object.hasOwn(accountsRaw, r.wallet))
      warnings.push(`${r.name}: 원장에 없는 지갑이 기록에 나옵니다.`);
  }
  accounts.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const balances = accounts.reduce((a, r) => a + r.balance, 0),
    registered = Object.keys(accountsRaw).length,
    houseBalance = int(L.houseBalance),
    granted = int(L.granted),
    spent = int(L.spent),
    initial = registered * INITIAL_BEOM,
    playerMoney = balances + held,
    supply = playerMoney + houseBalance,
    invariantDiff = supply - (initial + granted);
  if (ledger && invariantDiff !== 0)
    warnings.push(
      `총액 불일치: 잔액+예약+하우스(${supply})가 초기 지급+발행(${initial + granted})과 ${invariantDiff}만큼 다릅니다.`,
    );

  const sumOf = (type: LedgerEntry['type']) =>
    entries.filter((e) => e.type === type).reduce((a, e) => a + e.amount, 0);
  const complete = sumOf('grant') === granted && sumOf('spend') === spent;
  const times = entries.map((e) => e.at).filter((t) => t > 0);
  const since = now - days * DAY_MS,
    recentEntries = entries.filter((e) => e.at >= since && e.at <= now);
  if (!complete && times.length && Math.min(...times) > since)
    warnings.push(
      `보관된 지갑 기록(최근 ${entries.length}건)이 ${kstDate(Math.min(...times))}부터라 최근 ${days}일 전체를 덮지 못합니다.`,
    );

  const byDay = new Map<string, DayRow>();
  for (const e of entries) {
    if (!(e.at > 0)) continue;
    const date = kstDate(e.at);
    const d = byDay.get(date) ?? {
      date,
      daily: 0,
      relief: 0,
      farm: 0,
      grantOther: 0,
      shop: 0,
      spendOther: 0,
      granted: 0,
      spent: 0,
      net: 0,
    };
    d[flowKind(e.type, e.reason)] += e.amount;
    if (e.type === 'grant') d.granted += e.amount;
    else d.spent += e.amount;
    d.net = d.granted - d.spent;
    byDay.set(date, d);
  }

  const archiveGames = int(archiveRaw.games),
    archiveHouseNet = int(archiveRaw.houseNet);
  return {
    generatedAt: now,
    source: input.source ?? 'live',
    revision: input.revision ?? null,
    ledgerRevision: ledger ? int(L.revision) : null,
    updatedAt: input.updatedAt ?? null,
    totals: {
      accounts: registered,
      balances,
      reserved: held,
      playerMoney,
      houseBalance,
      granted,
      spent,
      initial,
      supply,
      invariantOk: !!ledger && invariantDiff === 0,
      invariantDiff,
    },
    accounts,
    games: [...games.values()],
    archive: { games: archiveGames, houseNet: archiveHouseNet },
    entries: {
      retained: entries.length,
      oldestAt: times.length ? Math.min(...times) : null,
      newestAt: times.length ? Math.max(...times) : null,
      complete,
    },
    sources: groupFlows(entries, 'grant'),
    sinks: groupFlows(entries, 'spend'),
    recent: {
      days,
      since,
      granted: recentEntries
        .filter((e) => e.type === 'grant')
        .reduce((a, e) => a + e.amount, 0),
      spent: recentEntries
        .filter((e) => e.type === 'spend')
        .reduce((a, e) => a + e.amount, 0),
      sources: groupFlows(recentEntries, 'grant'),
      sinks: groupFlows(recentEntries, 'spend'),
    },
    daily: [...byDay.values()].sort((a, b) => b.date.localeCompare(a.date)),
    warnings,
  };
}

// ------------------------------------------------------------------ render
/** 12,345범 / -1,200범 */
export const beomText = (n: number) =>
  (n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-US') + '범';
const signed = (n: number) => (n > 0 ? '+' : '') + beomText(n);
const kstTime = (at: number) =>
  new Date(at + 9 * 3_600_000).toISOString().slice(0, 16).replace('T', ' ') +
  ' KST';
/** Terminal column width: Hangul and other wide characters count as 2. */
export function displayWidth(text: string) {
  let w = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    w +=
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe4f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6)
        ? 2
        : 1;
  }
  return w;
}
type Table = { title: string; head: string[]; rows: string[][]; right?: number[] };
/** Plain-text table; columns listed in `right` are right-aligned (numbers). */
export function textTable({ head, rows, right = [] }: Table): string {
  const widths = head.map((h, i) =>
    Math.max(displayWidth(h), ...rows.map((r) => displayWidth(r[i] ?? ''))),
  );
  const pad = (s: string, i: number) => {
    const gap = ' '.repeat(widths[i] - displayWidth(s));
    return right.includes(i) ? gap + s : s + gap;
  };
  const line = (r: string[]) => r.map(pad).join('  ').trimEnd();
  return [
    line(head),
    widths.map((w) => '-'.repeat(w)).join('  '),
    ...rows.map(line),
  ].join('\n');
}
const flowRows = (rows: FlowRow[], limit = 10) =>
  rows
    .slice(0, limit)
    .map((r) => [r.label, FLOW_LABEL[r.kind], String(r.count), beomText(r.amount)]);

function tables(r: EconomyReport): Table[] {
  const t = r.totals;
  const out: Table[] = [
    {
      title: '총계',
      head: ['항목', '금액'],
      right: [1],
      rows: [
        ['지갑 수', `${t.accounts}개`],
        ['잔액 합계', beomText(t.balances)],
        ['게임 예약금', beomText(t.reserved)],
        ['통화량(플레이어 보유 = 잔액+예약)', beomText(t.playerMoney)],
        ['하우스(카지노+상점 수입)', beomText(t.houseBalance)],
        ['초기 지급(지갑×100,000)', beomText(t.initial)],
        ['누적 발행(오늘의 범·판매)', beomText(t.granted)],
        ['누적 상점 지출', beomText(t.spent)],
        ['총액 검증', t.invariantOk ? '일치' : `불일치 ${signed(t.invariantDiff)}`],
      ],
    },
    {
      title: '계정별',
      head: [
        '친구',
        '잔액',
        '예약',
        '합계',
        '게임 수',
        '게임 손익',
        '농사 수입*',
        '오늘의 범*',
        '상점 지출*',
        '오늘 판매',
      ],
      right: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      rows: r.accounts.map((a) => [
        a.name,
        beomText(a.balance),
        beomText(a.reserved),
        beomText(a.total),
        String(a.games),
        signed(a.gamblingNet),
        beomText(a.farmEarned),
        beomText(a.dailyGranted),
        beomText(a.shopSpent),
        beomText(a.soldToday),
      ]),
    },
    {
      title: '게임 종류별 손익(친구별)',
      head: ['친구', ...ECONOMY_GAMES.map((g) => GAME_LABEL[g]), '보관(종류 미상)'],
      right: [1, 2, 3, 4, 5, 6],
      rows: r.accounts.map((a) => [
        a.name,
        ...[...ECONOMY_GAMES, 'archived' as const].map((g) =>
          signed(a.gamblingByGame[g] ?? 0),
        ),
      ]),
    },
    {
      title: '게임 종류별 요약',
      head: ['게임', '진행 중', '정산', '무효', '예약금', '건 판돈', '오간 금액', '하우스 손익'],
      right: [1, 2, 3, 4, 5, 6, 7],
      rows: [
        ...r.games.map((g) => [
          g.label,
          String(g.reserved),
          String(g.settled),
          String(g.void),
          beomText(g.held),
          beomText(g.staked),
          beomText(g.moved),
          signed(g.houseNet),
        ]),
        [
          '보관된 과거 게임',
          '',
          String(r.archive.games),
          '',
          '',
          '',
          '',
          signed(r.archive.houseNet),
        ],
      ],
    },
    {
      title: `최근 ${r.recent.days}일 주요 공급원(발행) · 합계 ${beomText(r.recent.granted)}`,
      head: ['사유', '분류', '건수', '금액'],
      right: [2, 3],
      rows: flowRows(r.recent.sources),
    },
    {
      title: `최근 ${r.recent.days}일 주요 소비처(회수) · 합계 ${beomText(r.recent.spent)}`,
      head: ['사유', '분류', '건수', '금액'],
      right: [2, 3],
      rows: flowRows(r.recent.sinks),
    },
    {
      title: '일별 지급·지출(KST)*',
      head: ['날짜', '오늘의 범', '구제', '농사 판매', '기타 지급', '상점', '기타 지출', '순증'],
      right: [1, 2, 3, 4, 5, 6, 7],
      rows: r.daily.map((d) => [
        d.date,
        beomText(d.daily),
        beomText(d.relief),
        beomText(d.farm),
        beomText(d.grantOther),
        beomText(d.shop),
        beomText(d.spendOther),
        signed(d.net),
      ]),
    },
    {
      title: '보관 기록 전체 공급원/소비처*',
      head: ['사유', '분류', '건수', '금액'],
      right: [2, 3],
      rows: [...flowRows(r.sources, 50), ...flowRows(r.sinks, 50)],
    },
  ];
  return out;
}
function headerLines(r: EconomyReport) {
  return [
    `생성: ${kstTime(r.generatedAt)} · 출처: ${r.source}` +
      (r.revision !== null ? ` · world revision ${r.revision}` : '') +
      (r.ledgerRevision !== null ? ` · 원장 revision ${r.ledgerRevision}` : ''),
    `별표(*) 항목은 원장에 보관된 최근 지갑 기록 ${r.entries.retained}건 기준` +
      (r.entries.oldestAt !== null ? ` (${kstTime(r.entries.oldestAt)}부터)` : '') +
      (r.entries.complete
        ? ' — 누적 발행·지출 전체와 일치합니다.'
        : ' — 더 오래된 기록은 누적 합계에만 남아 있습니다.'),
    '게임 손익은 시각 정보가 없어 전체 기간 누적입니다.',
  ];
}

/** Readable Korean plain-text report for the terminal. */
export function formatEconomyReport(r: EconomyReport): string {
  const parts = ['범타듀 밸리 경제 리포트', ...headerLines(r), ''];
  for (const t of tables(r)) {
    parts.push(`■ ${t.title}`);
    parts.push(t.rows.length ? textTable(t) : '(기록 없음)');
    parts.push('');
  }
  if (r.warnings.length) {
    parts.push('■ 경고');
    for (const w of r.warnings) parts.push('- ' + w);
  }
  return parts.join('\n').trimEnd() + '\n';
}

const mdCell = (s: string) => s.replace(/[|*_\\]/g, (c) => '\\' + c);
/** Markdown version of the report (for a local file, not the repository). */
export function economyReportMarkdown(r: EconomyReport): string {
  const parts = ['# 범타듀 밸리 경제 리포트', '', ...headerLines(r).map((l) => `- ${mdCell(l)}`), ''];
  for (const t of tables(r)) {
    parts.push(`## ${mdCell(t.title)}`, '');
    if (!t.rows.length) {
      parts.push('(기록 없음)', '');
      continue;
    }
    const right = t.right ?? [];
    parts.push('| ' + t.head.map(mdCell).join(' | ') + ' |');
    parts.push('|' + t.head.map((_, i) => (right.includes(i) ? '---:' : '---')).join('|') + '|');
    for (const row of t.rows) parts.push('| ' + row.map(mdCell).join(' | ') + ' |');
    parts.push('');
  }
  if (r.warnings.length) {
    parts.push('## 경고', '');
    for (const w of r.warnings) parts.push('- ' + mdCell(w));
    parts.push('');
  }
  return parts.join('\n');
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
/** Standalone HTML version of the report (a local file; no scripts). */
export function economyReportHtml(r: EconomyReport): string {
  const body = tables(r)
    .map((t) => {
      const right = t.right ?? [];
      const cls = (i: number) => (right.includes(i) ? ' class="n"' : '');
      const rows = t.rows.length
        ? t.rows
            .map(
              (row) =>
                '<tr>' + row.map((c, i) => `<td${cls(i)}>${esc(c)}</td>`).join('') + '</tr>',
            )
            .join('\n')
        : `<tr><td colspan="${t.head.length}">(기록 없음)</td></tr>`;
      return `<section><h2>${esc(t.title)}</h2><div class="scroll"><table><thead><tr>${t.head
        .map((h, i) => `<th${cls(i)}>${esc(h)}</th>`)
        .join('')}</tr></thead><tbody>\n${rows}\n</tbody></table></div></section>`;
    })
    .join('\n');
  const warnings = r.warnings.length
    ? `<section class="warn"><h2>경고</h2><ul>${r.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></section>`
    : '';
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>경제 리포트</title>
<style>
:root{--bg:#faf8f4;--fg:#26231f;--muted:#6d665c;--line:#e3ddd2;--head:#f0ebe2;--warn:#a23b2a}
@media (prefers-color-scheme:dark){:root{--bg:#1c1b19;--fg:#ece7de;--muted:#a59d90;--line:#38352f;--head:#2a2825;--warn:#f08a74}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}
main{max-width:1100px;margin:0 auto}h1{font-size:22px;margin:0 0 8px}h2{font-size:16px;margin:28px 0 8px}
p{color:var(--muted);margin:2px 0}.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%}
th,td{border-bottom:1px solid var(--line);padding:6px 10px;text-align:left;white-space:nowrap}
th{background:var(--head);font-weight:600}.n{text-align:right;font-variant-numeric:tabular-nums}
.warn h2,.warn li{color:var(--warn)}
</style></head><body><main>
<h1>범타듀 밸리 경제 리포트</h1>
${headerLines(r).map((l) => `<p>${esc(l)}</p>`).join('\n')}
${body}
${warnings}
</main></body></html>
`;
}
