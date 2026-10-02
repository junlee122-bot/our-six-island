// 범마을 증권 (handover/design/design-stocks.md): the village stock market.
// Server-authoritative and pure: the cloud engine owns `world.stocks`, calls
// `materializeStocks` on every command (reads only look, they never write)
// and `stocksAction` for orders; `stocksView` is what a friend may see.
//
// Prices move once an hour from 09:00 to 15:00 KST (seven ticks a day) by a
// random walk drawn from SHA-256 of a server-only seed, pulled toward a
// target that follows each shop's real turnover (the ledger's daily flow
// buckets), the season and the weather, plus seeded news shocks and a small,
// capped effect of friends' own net buying. Every input of a tick is fixed
// once the tick has passed, so catching up later gives the same prices.
//
// Money only moves between a wallet and the house (`marketTransfer`, tracked
// as ledger.marketNet) and fees are `spend` entries, so the ledger invariant
// holds. Margin loans and short positions are numbers in this state; a
// forced sale never takes more than the position itself holds.
import { sha256Hex } from './lounge-sha256.ts';
import { kstDay, marketTransfer, spendBeom, type LoungeLedger } from './lounge-economy.ts';
import { dayStart, seasonOfDay, weatherOf, type Season, type Weather } from './lounge-calendar.ts';

// ---------------------------------------------------------------- rules
/** Ticks a day: 09:00, 10:00 … 15:00 KST. */
export const STOCK_TICKS = 7;
export const STOCK_OPEN_HOUR = 9;
/** Orders are taken until 15:30 (the last half hour trades at the close). */
export const STOCK_CLOSE_MINUTE = 15 * 60 + 30;
/** Daily price band around the previous close. */
export const STOCK_LIMIT = 0.15;
/** Commission on every buy and sell (rounded up). */
export const STOCK_FEE = 0.003;
/** Own money share of a margin purchase (2× at most) and of a short's value. */
export const STOCK_MARGIN = 0.5;
/** Margin call below this collateral ratio; a forced sale below STOCK_MAINTENANCE. */
export const STOCK_CALL = 0.4;
export const STOCK_MAINTENANCE = 0.3;
/** Margin loans plus short entry value per friend. */
export const STOCK_CREDIT_LIMIT = 300_000;
/** Daily margin interest and short borrow fee, charged at the 15:00 close. */
export const STOCK_INTEREST = 0.001;
export const STOCK_BORROW_FEE = 0.001;
/** One friend holds (long or short) at most this share of a stock's float. */
export const STOCK_HOLD_SHARE = 0.1;
/** All friends' short positions in one stock stay under this share of its float. */
export const STOCK_SHORT_POOL = 0.3;
/** Friends' net buying moves the next tick by at most this much (below the round-trip cost). */
export const STOCK_MAX_IMPACT = 0.006;
/** Net buying worth this share of the market cap reaches STOCK_MAX_IMPACT. */
export const STOCK_IMPACT_SCALE = 0.25;
/** Weekly dividend of a shop stock at its usual turnover, share of the close. */
export const STOCK_DIVIDEND = 0.004;
export const STOCK_DIVIDEND_MAX = 2.5;
export const STOCK_MIN_PRICE = 50;
/** Days of candles kept, days of history made up at listing. */
const HIST_DAYS = 30,
  PRELIST_DAYS = 20,
  ACCOUNT_LOG = 30,
  EVENT_LOG = 40,
  STAT_DAYS = 30;
/** Turnover smoothing (범) of the shop signal and its weight on the target. */
const REV_K = 3_000,
  REV_BETA = 0.12;
const HOUR = 3_600_000;

// ---------------------------------------------------------------- the stocks
export type StockSym = 'coop' | 'general' | 'bakery' | 'fishmarket' | 'furniture' | 'realty' | 'casino' | 'tavern' | 'forge' | 'bsung' | 'bnix' | 'bvidia';
export type StockDef = {
  sym: StockSym;
  code: string;
  name: string;
  kind: 'shop' | 'theme';
  /** Who runs the shop (shown only; residents are not traders). */
  keeper?: string;
  p0: number;
  float: number;
  /** Hourly and overnight volatility, mean reversion per tick. */
  sigma: number;
  gap: number;
  kappa: number;
  /** Ledger day-flow buckets that count as the shop's turnover (grants paid out, spends taken in). */
  g?: readonly string[];
  s?: readonly string[];
  /** 별빛 카지노: turnover is blackjack money (finance.casino). */
  casino?: true;
  season?: Partial<Record<Season, number>>;
  weather?: Partial<Record<Weather, number>>;
  news: { up: readonly string[]; down: readonly string[]; min: number; max: number; chance: number };
};
const shop = (d: Omit<StockDef, 'kind' | 'sigma' | 'gap' | 'kappa' | 'news'> & { up: readonly string[]; down: readonly string[] }): StockDef => {
  const { up, down, ...rest } = d;
  return { ...rest, kind: 'shop', sigma: 0.007, gap: 0.01, kappa: 0.03, news: { up, down, min: 0.03, max: 0.07, chance: 0.07 } };
};
export const STOCKS: readonly StockDef[] = [
  shop({
    sym: 'coop', code: '900110', name: '범마을 농협', keeper: '나세라', p0: 12_000, float: 1_000,
    g: ['sell-crop', 'sell-fruit', 'coop-week'], season: { autumn: 0.04, winter: -0.03 }, weather: { rain: 0.005, storm: -0.01 },
    up: ['농협, 이번 주 시세표 작물 매입 늘린다', '나세라 조합장 “올해 작황 기대 이상”', '농협 창고 증축 소식에 기대감'],
    down: ['농협 창고에 재고가 쌓였다는 소문', '작물 값 약세에 농협 매입 줄어', '농협 저울 고장으로 하루 쉬어'],
  }),
  shop({
    sym: 'general', code: '900120', name: '등불 잡화점', keeper: '쓰레쉬', p0: 6_500, float: 1_200,
    g: ['sell-forage', 'sell-flower', 'sell-bug'], s: ['seeds', 'consumable', 'palette', 'trophy'], season: { spring: 0.04 },
    up: ['잡화점 토요일 밤 등불 상점 대성황', '쓰레쉬 “새 씨앗 들어왔다”', '잡화점 주간 특가 손님 몰려'],
    down: ['잡화점 등불 기름값 올라 부담', '잡화점 씨앗 입고 늦어져', '쓰레쉬 장부 정리로 반나절 휴업'],
  }),
  shop({
    sym: 'bakery', code: '900130', name: '느긋한 빵집', keeper: '프리렌 · 힘멜', p0: 3_200, float: 1_500,
    s: ['bakery'], season: { winter: 0.03 }, weather: { rain: 0.005, storm: 0.005 },
    up: ['빵집 신메뉴 시식회 줄이 길다', '힘멜 “오늘 빵은 완벽하게 구웠다”', '빵집 카페 자리 만석'],
    down: ['프리렌 늦잠, 빵집 늦게 열어', '밀가루 값이 올랐다', '빵집 오븐 점검으로 메뉴 줄어'],
  }),
  shop({
    sym: 'fishmarket', code: '900140', name: '범마을 어시장', keeper: '럭스', p0: 8_400, float: 1_000,
    g: ['sell-fish', 'auction'], s: ['rod'], season: { summer: 0.04 }, weather: { storm: -0.02 },
    up: ['새벽 경매 낙찰가 사상 최고', '럭스 “오늘 바다가 넉넉해요”', '어시장 냉동 창고 새로 들여'],
    down: ['궂은 바다에 배가 덜 나가', '어시장 얼음이 모자라', '새벽 경매 손님 줄어'],
  }),
  shop({
    sym: 'furniture', code: '900150', name: '나무결 가구점', keeper: '발키리', p0: 15_000, float: 600,
    s: ['furn', 'furn-premium', 'shop-reroll'],
    up: ['발키리의 이번 주 명품 가구 완판', '가구점 공방 증축', '발키리 “도끼질이 잘 된다!”'],
    down: ['좋은 목재가 모자라 주문 밀려', '가구점 공방 지붕 수리', '가구 새로고침 손님 줄어'],
  }),
  shop({
    sym: 'realty', code: '900160', name: '범마을 부동산', keeper: '신형만 · 봉미선', p0: 24_000, float: 500,
    s: ['house', 'room-style', 'farm-expand'], season: { spring: 0.03 },
    up: ['집 넓히기 상담이 밀려 들어', '모델하우스 관람객 늘어', '신형만 “이번 달 계약 최고!”'],
    down: ['집 확장 상담 뜸해', '봉미선 “장부부터 다시 봐요”', '모델하우스 벽지 교체로 휴관'],
  }),
  shop({
    sym: 'casino', code: '900170', name: '별빛 카지노', keeper: '루미 · 매화', p0: 31_000, float: 400,
    casino: true,
    up: ['금요 카지노의 밤 손님 북적', '카지노 새 테이블 들여', '블랙잭 테이블 대기 줄'],
    down: ['카지노가 큰 판을 내줬다는 소문', '카지노 조명 수리로 일찍 닫아', '블랙잭 손님 뜸해'],
  }),
  shop({
    sym: 'tavern', code: '900180', name: '허풍 주점', keeper: '허 선장', p0: 4_800, float: 1_200,
    g: ['sell-dish'], s: ['bar-drink', 'venue-up'], season: { winter: 0.02 },
    up: ['허풍 주점 새 안주 인기', '허 선장 “오늘은 내가 쏜다!”', '주점 업그레이드 마쳐'],
    down: ['허풍 카드 판이 뜸해', '주점 술통이 바닥났다', '허 선장 항해 이야기만 길어'],
  }),
  shop({
    // 마을 대장간(도구 등급) and 산기슭 오른의 대장간(범위 강화, 오늘의 광석) are one smith's two shops.
    sym: 'forge', code: '900190', name: '대장간', keeper: '오른', p0: 7_700, float: 900,
    g: ['sell-material', 'smith-ore'], s: ['tool', 'smith'],
    up: ['대장간 별빛 도구 주문 늘어', '광산 깊은 층 광석 쏟아져', '대장간 새 화덕 들여'],
    down: ['숯이 모자라 화덕이 식어', '광석 값 약세', '대장간 망치 수리'],
  }),
  {
    sym: 'bsung', code: '900210', name: '범성전자', kind: 'theme', p0: 52_000, float: 400, sigma: 0.018, gap: 0.03, kappa: 0.01,
    news: {
      up: ['범성전자, 마을 첫 반도체 공방 착공', '범성전자 새 접이식 계산기 예약 몰려', '범성전자 공장 불빛이 밤새 켜져'],
      down: ['범성전자 공방 정전으로 생산 멈춰', '범성전자 신제품 출시 미뤄', '범성전자 창고에 부품 모자라'],
      min: 0.06, max: 0.12, chance: 0.2,
    },
  },
  {
    sym: 'bnix', code: '900220', name: '범이닉스', kind: 'theme', p0: 18_500, float: 800, sigma: 0.022, gap: 0.03, kappa: 0.01,
    news: {
      up: ['범이닉스 기억 칩 주문 줄 서', '범이닉스 “칩 값 오른다” 전망', '범이닉스 새 공정 수율 쑥쑥'],
      down: ['범이닉스 칩 재고 창고에 쌓여', '범이닉스 기억 칩 값 미끄럼', '범이닉스 공방 먼지 청소로 하루 쉬어'],
      min: 0.06, max: 0.12, chance: 0.2,
    },
  },
  {
    sym: 'bvidia', code: '900230', name: '범비디아', kind: 'theme', p0: 30_000, float: 600, sigma: 0.026, gap: 0.035, kappa: 0.01,
    news: {
      up: ['범비디아 그림 칩, 마을 컴퓨터마다 품절', '범비디아 “똑똑한 기계 붐 이제 시작”', '범비디아 새 칩 발표회 박수 쏟아져'],
      down: ['범비디아 칩 너무 뜨거워 회수 소동', '범비디아 거품 논란', '범비디아 큰손 친구들 차익 실현'],
      min: 0.07, max: 0.13, chance: 0.2,
    },
  },
];
export const STOCK_SYMS: readonly StockSym[] = STOCKS.map((s) => s.sym);
export const STOCK_BY_SYM = Object.fromEntries(STOCKS.map((s) => [s.sym, s])) as Record<StockSym, StockDef>;
export const isStockSym = (v: unknown): v is StockSym => typeof v === 'string' && Object.hasOwn(STOCK_BY_SYM, v);

// ---------------------------------------------------------------- prices and time
/** KRX-style tick size of a price. */
export function tickSize(p: number) {
  return p < 2_000 ? 1 : p < 5_000 ? 5 : p < 20_000 ? 10 : p < 50_000 ? 50 : p < 200_000 ? 100 : 500;
}
const roundTick = (p: number) => Math.round(p / tickSize(p)) * tickSize(p);
const floorTick = (p: number) => Math.floor(p / tickSize(p)) * tickSize(p);
const ceilTick = (p: number) => Math.ceil(p / tickSize(p)) * tickSize(p);
/** The day's band around the previous close [lower, upper]. */
export function limitsOf(prevClose: number): [number, number] {
  return [Math.max(STOCK_MIN_PRICE, ceilTick(prevClose * (1 - STOCK_LIMIT))), floorTick(prevClose * (1 + STOCK_LIMIT))];
}
/** What a buyer pays (매도1호가) and a seller gets (매수1호가) at price p within the band. */
export function quoteOf(p: number, band: [number, number]) {
  return { ask: Math.min(band[1], p + tickSize(p)), bid: Math.max(band[0], p - tickSize(p)) };
}
export const stockFee = (value: number) => Math.ceil(value * STOCK_FEE);
/** Epoch ms of global tick T (day × 7 + hour − 9). */
export const tickAt = (t: number) => dayStart(Math.floor(t / STOCK_TICKS)) + (STOCK_OPEN_HOUR + (t % STOCK_TICKS)) * HOUR;
/** The latest tick at or before `now` (before 09:00 it is yesterday's close). */
export function tickOf(now: number) {
  const day = kstDay(now),
    hour = Math.floor((now - dayStart(day)) / HOUR);
  if (hour < STOCK_OPEN_HOUR) return day * STOCK_TICKS - 1;
  return day * STOCK_TICKS + Math.min(STOCK_TICKS - 1, hour - STOCK_OPEN_HOUR);
}
/** Orders are taken 09:00 ≤ KST time < 15:30. */
export function marketOpen(now: number) {
  const minute = Math.floor((now - dayStart(kstDay(now))) / 60_000);
  return minute >= STOCK_OPEN_HOUR * 60 && minute < STOCK_CLOSE_MINUTE;
}
/** Next opening (09:00 KST) at or after `now`. */
export function nextOpenAt(now: number) {
  const day = kstDay(now),
    open = dayStart(day) + STOCK_OPEN_HOUR * HOUR;
  return now < open ? open : open + 24 * HOUR;
}
const weekOfDay = (day: number) => Math.floor((day + 3) / 7);

// ---------------------------------------------------------------- state
export type Candle = [o: number, h: number, l: number, c: number];
export type StockLong = { q: number; cost: number; loan: number; int: number; call?: number };
export type StockShort = { q: number; val: number; coll: number; call?: number };
export type StockOp = 'buy' | 'margin' | 'sell' | 'short' | 'cover' | 'repay' | 'dividend' | 'liquidate' | 'call';
/** One line of a friend's own record; `amount` is the wallet change (fees included). */
export type StockLog = { at: number; sym: StockSym; op: StockOp; q: number; px: number; amount: number; fee: number };
export type StockAccount = {
  long: Partial<Record<StockSym, StockLong>>;
  short: Partial<Record<StockSym, StockShort>>;
  /** Wallet → market (purchases, collateral, fees, repayments) and back (sales, dividends). */
  paidIn: number;
  paidOut: number;
  /** Most money ever in the market at once (paidIn − paidOut), the return's base. */
  peak: number;
  log: StockLog[];
};
export type StockEventKind = 'news' | 'up' | 'down' | 'dividend' | 'liquidate';
export type StockEvent = { tick: number; sym: StockSym; kind: StockEventKind; text: string; uid?: string; good?: boolean };
export type StockStatDay = { d: number; fee: number; interest: number; borrow: number; dividend: number; absorbed: number; volume: number; liquidations: number };
export type StockState = {
  v: 1;
  /** Server-only randomness; never leaves stocksView. */
  seed: string;
  listed: number;
  tick: number;
  seq: number;
  px: Record<StockSym, number>;
  /** Close of the day before `tick`'s day (the band's base). */
  prev: Record<StockSym, number>;
  days: Record<StockSym, Candle[]>;
  today: Record<StockSym, number[]>;
  /** Friends' net buying (범) since the last tick. */
  flow: Partial<Record<StockSym, number>>;
  /** Last dividend per share. */
  div: Partial<Record<StockSym, number>>;
  acct: Record<string, StockAccount>;
  events: StockEvent[];
  stats: StockStatDay[];
};

/** Inputs of the shop signal: the ledger's day flows and the casino's days. */
export type StockInputs = {
  ledger: Pick<LoungeLedger, 'flows'>;
  casino?: readonly { day: number; earned: number; paid: number }[];
};

function fail(text: string): never {
  throw new Error(text);
}
const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const nat = (n: unknown): n is number => safe(n) && n >= 0;
const dict = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const validUid = (v: string) => /^[a-zA-Z0-9-]{1,80}$/.test(v) && !['constructor', 'prototype', '__proto__'].includes(v);
const OPS: readonly StockOp[] = ['buy', 'margin', 'sell', 'short', 'cover', 'repay', 'dividend', 'liquidate', 'call'];
const KINDS: readonly StockEventKind[] = ['news', 'up', 'down', 'dividend', 'liquidate'];

/** Validates a stored state (throws on damage) and returns a private copy. */
export function readStocks(raw: unknown): StockState {
  const v = raw as StockState;
  const perSym = (o: unknown, ok: (x: unknown) => boolean, all = true) =>
    dict(o) && Object.keys(o).every((k) => isStockSym(k)) && (!all || STOCK_SYMS.every((s) => Object.hasOwn(o, s))) && Object.values(o).every(ok);
  const candle = (c: unknown) => Array.isArray(c) && c.length === 4 && c.every((n) => nat(n) && n > 0);
  if (
    !dict(v) || v.v !== 1 || typeof v.seed !== 'string' || !/^[0-9a-f]{16,64}$/.test(v.seed) ||
    !safe(v.listed) || !safe(v.tick) || v.tick < v.listed || !nat(v.seq) ||
    !perSym(v.px, (n) => nat(n) && (n as number) >= STOCK_MIN_PRICE) ||
    !perSym(v.prev, (n) => nat(n) && (n as number) >= STOCK_MIN_PRICE) ||
    !perSym(v.days, (d) => Array.isArray(d) && d.length >= 1 && d.length <= HIST_DAYS && d.every(candle)) ||
    !perSym(v.today, (d) => Array.isArray(d) && d.length <= STOCK_TICKS && d.every((n) => nat(n) && n > 0)) ||
    !perSym(v.flow, (n) => safe(n), false) ||
    !perSym(v.div, (n) => nat(n), false) ||
    !dict(v.acct) || Object.keys(v.acct).length > 64 ||
    !Array.isArray(v.events) || v.events.length > EVENT_LOG ||
    !Array.isArray(v.stats) || v.stats.length > STAT_DAYS
  )
    fail('증권 장부를 읽을 수 없습니다.');
  for (const [uid, a] of Object.entries(v.acct)) {
    if (
      !validUid(uid) || !dict(a) || !nat(a.paidIn) || !nat(a.paidOut) || !nat(a.peak) ||
      !perSym(a.long, (l) => dict(l) && nat(l.q) && (l.q as number) > 0 && nat(l.cost) && nat(l.loan) && nat(l.int) && (l.int as number) <= (l.loan as number) && (l.call === undefined || safe(l.call)), false) ||
      !perSym(a.short, (s) => dict(s) && nat(s.q) && (s.q as number) > 0 && nat(s.val) && nat(s.coll) && (s.call === undefined || safe(s.call)), false) ||
      Object.keys(a.long).some((s) => Object.hasOwn(a.short, s)) ||
      !Array.isArray(a.log) || a.log.length > ACCOUNT_LOG ||
      a.log.some((l) => !dict(l) || !nat(l.at) || !isStockSym(l.sym) || !OPS.includes(l.op) || !nat(l.q) || !nat(l.px) || !safe(l.amount) || !nat(l.fee))
    )
      fail('증권 장부를 읽을 수 없습니다.');
  }
  if (
    v.events.some((e) => !dict(e) || !safe(e.tick) || !isStockSym(e.sym) || !KINDS.includes(e.kind) || typeof e.text !== 'string' || e.text.length > 120 || (e.uid !== undefined && (typeof e.uid !== 'string' || !validUid(e.uid)))) ||
    v.stats.some((d) => !dict(d) || !safe(d.d) || !['fee', 'interest', 'borrow', 'dividend', 'absorbed', 'volume', 'liquidations'].every((k) => nat((d as Record<string, unknown>)[k])))
  )
    fail('증권 장부를 읽을 수 없습니다.');
  return structuredClone(v);
}

// ---------------------------------------------------------------- randomness
/** 8 uniforms in [0, 1) from SHA-256 of the seed and a key. */
function draws(seed: string, key: string): number[] {
  const hex = sha256Hex(`${seed}|${key}`);
  const out: number[] = [];
  for (let i = 0; i < 8; i++) out.push(parseInt(hex.slice(i * 8, i * 8 + 8), 16) / 2 ** 32);
  return out;
}
const gauss = (u1: number, u2: number) => Math.sqrt(-2 * Math.log(1 - u1)) * Math.cos(2 * Math.PI * u2);

// ---------------------------------------------------------------- turnover and targets
/** One day's turnover (범) of a shop stock. */
function turnover(def: StockDef, day: number, inputs: StockInputs) {
  if (def.casino) {
    const c = inputs.casino?.find((d) => d.day === day);
    return c ? c.earned + c.paid : 0;
  }
  const f = inputs.ledger.flows?.days.find((d) => d.d === day);
  if (!f) return 0;
  let n = 0;
  for (const b of def.g ?? []) n += f.g[b] ?? 0;
  for (const b of def.s ?? []) n += f.s[b] ?? 0;
  return n;
}
const mean = (def: StockDef, from: number, to: number, inputs: StockInputs) => {
  let n = 0;
  for (let d = from; d <= to; d++) n += turnover(def, d, inputs);
  return n / (to - from + 1);
};
/** Busy shop vs its own last two weeks, −1…1 (finished days before `day` only). */
export function revenueSignal(def: StockDef, day: number, inputs: StockInputs) {
  if (def.kind !== 'shop') return 0;
  const recent = mean(def, day - 3, day - 1, inputs),
    usual = mean(def, day - 14, day - 1, inputs);
  return Math.max(-1, Math.min(1, Math.log((recent + REV_K) / (usual + REV_K))));
}
/** The log price a stock is pulled toward on a day. */
function targetLog(def: StockDef, day: number, seed: string, inputs: StockInputs, cache: Map<string, number>) {
  const key = `${def.sym}:${day}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let t = Math.log(def.p0);
  if (def.kind === 'shop') {
    t += REV_BETA * revenueSignal(def, day, inputs);
    t += def.season?.[seasonOfDay(day)] ?? 0;
    t += def.weather?.[weatherOf(day)] ?? 0;
  } else {
    // A weekly "story" level: themes trend for days, then turn.
    const u = draws(seed, `story|${def.sym}|${weekOfDay(day)}`);
    t += 0.25 * (u[0] * 2 - 1);
  }
  cache.set(key, t);
  return t;
}
/** The day's seeded news of a stock: at which tick, up or down, how much, which headline. */
export function newsOf(seed: string, def: StockDef, day: number) {
  const u = draws(seed, `news|${def.sym}|${day}`);
  if (u[0] >= def.news.chance) return null;
  const up = u[2] < 0.5,
    list = up ? def.news.up : def.news.down;
  return { hour: Math.floor(u[1] * STOCK_TICKS), up, size: def.news.min + u[3] * (def.news.max - def.news.min), text: list[Math.floor(u[4] * list.length)] };
}

// ---------------------------------------------------------------- listing and ticks
const perSym = <T>(f: (d: StockDef) => T) => Object.fromEntries(STOCKS.map((d) => [d.sym, f(d)])) as Record<StockSym, T>;
const dayOfTick = (t: number) => Math.floor(t / STOCK_TICKS);
const statDay = (st: StockState, d: number) => {
  let s = st.stats.find((x) => x.d === d);
  if (!s) {
    s = { d, fee: 0, interest: 0, borrow: 0, dividend: 0, absorbed: 0, volume: 0, liquidations: 0 };
    st.stats.push(s);
    st.stats.sort((a, b) => a.d - b.d);
    if (st.stats.length > STAT_DAYS) st.stats = st.stats.slice(-STAT_DAYS);
  }
  return s;
};
const event = (st: StockState, e: StockEvent) => {
  st.events = [...st.events, e].slice(-EVENT_LOG);
};
const note = (a: StockAccount, l: StockLog) => {
  a.log = [...a.log, l].slice(-ACCOUNT_LOG);
};
/** A village news line (lounge-life-plus addNews) the cloud engine adds for a market event. */
export type StockNews = { at: number; key: string; kind: 'stock'; text: string; uids: string[] };

type Run = { st: StockState; ledger: LoungeLedger; inputs: StockInputs; news: StockNews[]; cache: Map<string, number>; quiet: boolean };

/** A fresh market listed at `now`, with PRELIST_DAYS of seeded history behind it. */
export function listStocks(seed: string, now: number, inputs: StockInputs): StockState {
  if (!/^[0-9a-f]{16,64}$/.test(seed)) fail('증권 씨앗이 올바르지 않습니다.');
  const listed = tickOf(now);
  const start = (dayOfTick(listed) - PRELIST_DAYS) * STOCK_TICKS - 1;
  const st: StockState = {
    v: 1, seed, listed, tick: start, seq: 0,
    px: perSym((d) => d.p0), prev: perSym((d) => d.p0),
    days: perSym(() => [] as Candle[]), today: perSym(() => []),
    flow: {}, div: {}, acct: {}, events: [], stats: [],
  };
  const run: Run = { st, ledger: { version: 1, revision: 0, accounts: {}, games: {} }, inputs, news: [], cache: new Map(), quiet: true };
  for (let t = start + 1; t <= listed; t++) step(run, t);
  st.listed = listed;
  st.flow = {};
  return st;
}

/** Price of one stock at tick t (state holds tick t − 1). */
function priceAt(run: Run, def: StockDef, t: number) {
  const { st } = run,
    day = dayOfTick(t),
    hour = t % STOCK_TICKS,
    before = st.px[def.sym];
  const u = draws(st.seed, `tick|${def.sym}|${t}`);
  const open = hour === 0;
  let r = (open ? def.gap : def.sigma) * gauss(u[0], u[1]);
  r += (open ? 2 : 1) * def.kappa * (targetLog(def, day, st.seed, run.inputs, run.cache) - Math.log(before));
  const cap = def.float * before;
  r += STOCK_MAX_IMPACT * Math.max(-1, Math.min(1, (st.flow[def.sym] ?? 0) / (cap * STOCK_IMPACT_SCALE)));
  const news = newsOf(st.seed, def, day);
  if (news && news.hour === hour) r += news.up ? news.size : -news.size;
  const band = limitsOf(st.prev[def.sym]);
  const p = Math.max(band[0], Math.min(band[1], roundTick(before * Math.exp(r))));
  return { p, band, news: news && news.hour === hour ? news : null };
}

/** Collateral ratio of a position at a price (1 = no borrowing). */
export const longRatio = (l: StockLong, bid: number) => (l.loan ? (l.q * bid - l.loan) / (l.q * bid) : 1);
export const shortRatio = (s: StockShort, ask: number) => (s.coll + s.val - s.q * ask) / (s.q * ask);

/**
 * Pays `gross` (what a closed position is worth after its loan) to the wallet
 * and takes the fee from it; a negative gross is absorbed by the house.
 */
function settle(run: Run, uid: string, gross: number, fee: number, t: number, reason: string) {
  const w = 'wallet-' + uid,
    stats = statDay(run.st, dayOfTick(t));
  if (gross <= 0) {
    stats.absorbed += -gross;
    return { paid: 0, fee: 0 };
  }
  if (!Object.hasOwn(run.ledger.accounts, w)) fail('지갑을 찾을 수 없습니다.');
  run.ledger = marketTransfer(run.ledger, w, gross);
  const take = Math.min(fee, gross);
  if (take > 0) {
    run.ledger = spendBeom(run.ledger, w, take, `stock-${++run.st.seq}-${reason}`, tickAt(t), 'stock-fee');
    stats.fee += take;
  }
  if (take < fee) stats.absorbed += fee - take;
  return { paid: gross - take, fee: take };
}

function liquidate(run: Run, uid: string, sym: StockSym, t: number) {
  const { st } = run,
    a = st.acct[uid],
    band = limitsOf(st.prev[sym]),
    { ask, bid } = quoteOf(st.px[sym], band),
    at = tickAt(t),
    def = STOCK_BY_SYM[sym];
  const l = a.long[sym],
    s = a.short[sym];
  let q = 0,
    px = 0,
    r: { paid: number; fee: number };
  if (l) {
    const value = l.q * bid;
    r = settle(run, uid, value - l.loan, stockFee(value), t, `liq-${sym}`);
    q = l.q;
    px = bid;
    delete a.long[sym];
    statDay(st, dayOfTick(t)).volume += value;
  } else if (s) {
    const cost = s.q * ask;
    r = settle(run, uid, s.coll + s.val - cost, stockFee(cost), t, `liq-${sym}`);
    q = s.q;
    px = ask;
    delete a.short[sym];
    statDay(st, dayOfTick(t)).volume += cost;
  } else return;
  a.paidOut += r.paid;
  note(a, { at, sym, op: 'liquidate', q, px, amount: r.paid, fee: r.fee });
  statDay(st, dayOfTick(t)).liquidations++;
  const text = `${def.name} ${l ? '신용' : '공매도'} ${q.toLocaleString('ko-KR')}주 반대매매`;
  event(st, { tick: t, sym, kind: 'liquidate', text, uid });
  if (!run.quiet) run.news.push({ at, key: `stock-liq-${t}-${uid}-${sym}`, kind: 'stock', text: `주식 소식: {actor}의 ${text}(담보 부족)`, uids: [uid] });
}

/** Margin calls and forced sales of every position at tick t's prices. */
function checkMargins(run: Run, t: number) {
  const { st } = run,
    close = t % STOCK_TICKS === STOCK_TICKS - 1;
  for (const [uid, a] of Object.entries(st.acct)) {
    for (const sym of STOCK_SYMS) {
      const l = a.long[sym],
        s = a.short[sym];
      if (!(l && l.loan) && !s) continue;
      const { ask, bid } = quoteOf(st.px[sym], limitsOf(st.prev[sym]));
      const ratio = l ? longRatio(l, bid) : shortRatio(s!, ask);
      const pos = (l ?? s)!;
      if (ratio < STOCK_MAINTENANCE || (close && pos.call !== undefined && t - pos.call >= STOCK_TICKS && ratio < STOCK_CALL)) {
        liquidate(run, uid, sym, t);
        continue;
      }
      if (ratio < STOCK_CALL) {
        if (pos.call === undefined) {
          pos.call = t;
          note(a, { at: tickAt(t), sym, op: 'call', q: pos.q, px: l ? bid : ask, amount: 0, fee: 0 });
        }
      } else delete pos.call;
    }
  }
}

/** Monday's open: last week's dividend for shop stocks (longs paid, shorts charged). */
function payDividends(run: Run, day: number, t: number) {
  const { st } = run,
    at = tickAt(t),
    week = weekOfDay(day) - 1;
  const first = week * 7 - 3; // first KST day of `week`
  for (const def of STOCKS) {
    if (def.kind !== 'shop') continue;
    const last = mean(def, first, first + 6, run.inputs) * 7,
      usual = (mean(def, first - 28, first - 1, run.inputs) * 7);
    const k = 7 * REV_K;
    const scale = Math.max(0, Math.min(STOCK_DIVIDEND_MAX, (last + k) / (usual + k)));
    const dps = Math.floor(st.prev[def.sym] * STOCK_DIVIDEND * scale);
    st.div[def.sym] = dps;
    if (!dps) continue;
    let paid = 0;
    for (const [uid, a] of Object.entries(st.acct)) {
      const l = a.long[def.sym],
        s = a.short[def.sym];
      if (l) {
        const amount = l.q * dps;
        if (!Object.hasOwn(run.ledger.accounts, 'wallet-' + uid)) continue;
        run.ledger = marketTransfer(run.ledger, 'wallet-' + uid, amount);
        a.paidOut += amount;
        paid += amount;
        note(a, { at, sym: def.sym, op: 'dividend', q: l.q, px: dps, amount, fee: 0 });
      } else if (s) {
        const owed = Math.min(s.coll, s.q * dps);
        s.coll -= owed;
        note(a, { at, sym: def.sym, op: 'dividend', q: s.q, px: dps, amount: -owed, fee: 0 });
      }
    }
    statDay(st, day).dividend += paid;
    event(st, { tick: t, sym: def.sym, kind: 'dividend', text: `${def.name} 주당 ${dps.toLocaleString('ko-KR')}범 배당`, good: true });
  }
}

/** Applies tick t (the state holds t − 1). */
function step(run: Run, t: number) {
  const { st } = run,
    day = dayOfTick(t),
    hour = t % STOCK_TICKS,
    at = tickAt(t);
  if (hour === 0) {
    for (const def of STOCKS) {
      st.prev[def.sym] = st.px[def.sym];
      st.today[def.sym] = [];
    }
    if (!run.quiet && weekOfDay(day) !== weekOfDay(day - 1)) payDividends(run, day, t);
  }
  let biggest: { text: string; size: number } | null = null;
  for (const def of STOCKS) {
    const { p, band, news } = priceAt(run, def, t);
    const before = st.px[def.sym];
    st.px[def.sym] = p;
    st.today[def.sym].push(p);
    const days = st.days[def.sym];
    if (hour === 0) {
      days.push([p, p, p, p]);
      if (days.length > HIST_DAYS) days.splice(0, days.length - HIST_DAYS);
    } else {
      const c = days[days.length - 1];
      c[1] = Math.max(c[1], p);
      c[2] = Math.min(c[2], p);
      c[3] = p;
    }
    if (run.quiet) continue;
    if (news) {
      event(st, { tick: t, sym: def.sym, kind: 'news', text: news.text, good: news.up });
      if (!biggest || news.size > biggest.size) biggest = { text: `${def.name}: ${news.text}`, size: news.size };
    }
    // The first touch of the band today is an event (and a village news line).
    const limit = p === band[1] && p > st.prev[def.sym] ? 'up' : p === band[0] && p < st.prev[def.sym] ? 'down' : null;
    if (limit && before !== p && !st.events.some((e) => e.sym === def.sym && e.kind === limit && dayOfTick(e.tick) === day)) {
      const text = `${def.name} ${limit === 'up' ? '상한가' : '하한가'} ${p.toLocaleString('ko-KR')}범`;
      event(st, { tick: t, sym: def.sym, kind: limit, text, good: limit === 'up' });
      run.news.push({ at, key: `stock-${limit}-${day}-${def.sym}`, kind: 'stock', text: `주식 소식: ${text}`, uids: [] });
    }
  }
  if (biggest) run.news.push({ at, key: `stock-news-${day}`, kind: 'stock', text: `주식 소식: ${biggest.text}`, uids: [] });
  st.flow = {};
  if (!run.quiet && hour === STOCK_TICKS - 1) {
    // The close: a day's margin interest onto each loan, a day's borrow fee out of each short's collateral.
    const stats = statDay(st, day);
    for (const a of Object.values(st.acct)) {
      for (const l of Object.values(a.long))
        if (l && l.loan) {
          const i = Math.ceil(l.loan * STOCK_INTEREST);
          l.loan += i;
          l.int += i;
          stats.interest += i;
        }
      for (const [sym, s] of Object.entries(a.short))
        if (s) {
          const fee = Math.min(s.coll, Math.ceil(s.q * st.px[sym as StockSym] * STOCK_BORROW_FEE));
          s.coll -= fee;
          stats.borrow += fee;
        }
    }
  }
  if (!run.quiet) checkMargins(run, t);
  st.tick = t;
}

/** At most this many ticks are caught up in one call (about two months). */
const CATCH_UP_MAX = 60 * STOCK_TICKS;

/**
 * Brings the market up to `now`: every tick since the last one, with its
 * dividends, interest, margin calls and forced sales. Pure; the caller
 * decides whether to store the result (reads only show it).
 */
export function materializeStocks(raw: StockState, ledger: LoungeLedger, inputs: StockInputs, now: number) {
  const target = tickOf(now);
  if (raw.tick >= target) return { state: raw, ledger, news: [] as StockNews[], changed: false };
  const st = readStocks(raw);
  const run: Run = { st, ledger, inputs, news: [], cache: new Map(), quiet: false };
  // A market left alone for months skips straight on (prices quiet, positions kept).
  if (target - st.tick > CATCH_UP_MAX) {
    run.quiet = true;
    for (let t = st.tick + 1; t <= target - CATCH_UP_MAX; t++) step(run, t);
    run.quiet = false;
  }
  for (let t = st.tick + 1; t <= target; t++) step(run, t);
  return { state: st, ledger: run.ledger, news: run.news, changed: true };
}

// ---------------------------------------------------------------- orders
export type StockAction = { kind: 'stock'; op: 'buy' | 'margin' | 'sell' | 'short' | 'cover'; sym: StockSym; qty: number } | { kind: 'stock'; op: 'repay'; sym: StockSym; amount: number };
/** Where the friend stands; opening orders need the 증권사 room. */
export type StockPlace = { area: string };
export const STOCK_OPENING_OPS = ['buy', 'margin', 'short'] as const;
const newAccount = (): StockAccount => ({ long: {}, short: {}, paidIn: 0, paidOut: 0, peak: 0, log: [] });
export const holdLimit = (sym: StockSym) => Math.floor(STOCK_BY_SYM[sym].float * STOCK_HOLD_SHARE);
/** Margin loans plus short entry value (the credit limit's measure). */
export function creditUsed(a: StockAccount | undefined) {
  if (!a) return 0;
  let n = 0;
  for (const l of Object.values(a.long)) n += l?.loan ?? 0;
  for (const s of Object.values(a.short)) n += s?.val ?? 0;
  return n;
}
/** What a friend's positions are worth now (after loans), at the quotes. */
export function equityOf(st: StockState, a: StockAccount | undefined) {
  if (!a) return 0;
  let n = 0;
  for (const sym of STOCK_SYMS) {
    const q = quoteOf(st.px[sym], limitsOf(st.prev[sym]));
    const l = a.long[sym],
      s = a.short[sym];
    if (l) n += Math.max(0, l.q * q.bid - l.loan);
    if (s) n += Math.max(0, s.coll + s.val - s.q * q.ask);
  }
  return n;
}

/**
 * One order. The state must already be materialized to `now`. Prices are the
 * server's: an action carrying anything but its known fields is refused.
 */
export function stocksAction(raw: StockState, ledger: LoungeLedger, uid: string, action: StockAction, now: number, place: StockPlace) {
  const a0 = action as Record<string, unknown>;
  const fields = a0.op === 'repay' ? ['kind', 'op', 'sym', 'amount'] : ['kind', 'op', 'sym', 'qty'];
  if (Object.keys(a0).some((k) => !fields.includes(k))) fail('주문에는 종목과 수량만 보내요. 가격은 서버 시세로 정해져요.');
  if (!['buy', 'margin', 'sell', 'short', 'cover', 'repay'].includes(action.op)) fail('주문 종류를 확인해 주세요.');
  if (!isStockSym(action.sym)) fail('종목을 확인해 주세요.');
  if (!validUid(uid)) fail('계정을 확인해 주세요.');
  if (raw.tick !== tickOf(now)) fail('시세를 다시 불러온 뒤 주문해 주세요.');
  const w = 'wallet-' + uid;
  if (!Object.hasOwn(ledger.accounts, w)) fail('지갑을 찾을 수 없습니다.');
  const st = readStocks(raw);
  const run: Run = { st, ledger, inputs: { ledger }, news: [], cache: new Map(), quiet: false };
  const a = (st.acct[uid] ??= newAccount());
  const sym = action.sym,
    def = STOCK_BY_SYM[sym],
    band = limitsOf(st.prev[sym]),
    { ask, bid } = quoteOf(st.px[sym], band),
    t = st.tick,
    stats = statDay(st, kstDay(now));
  const wallet = () => run.ledger.accounts[w];
  const pay = (amount: number, fee: number, reason: string) => {
    run.ledger = marketTransfer(run.ledger, w, -amount);
    if (fee) run.ledger = spendBeom(run.ledger, w, fee, `stock-${++st.seq}-${reason}`, now, 'stock-fee');
    a.paidIn += amount + fee;
    a.peak = Math.max(a.peak, a.paidIn - a.paidOut);
    stats.fee += fee;
  };
  if (action.op === 'repay') {
    const l = a.long[sym];
    if (!l || !l.loan) fail('이 종목에는 갚을 신용 빚이 없어요.');
    if (!safe(action.amount) || action.amount < 1 || action.amount > l.loan) fail(`1~${l.loan.toLocaleString('ko-KR')}범 안에서 갚아 주세요.`);
    if (wallet() < action.amount) fail('갚을 범이 부족해요.');
    pay(action.amount, 0, `repay-${sym}`);
    l.loan -= action.amount;
    l.int = Math.min(l.int, l.loan);
    if (longRatio(l, bid) >= STOCK_CALL) delete l.call;
    note(a, { at: now, sym, op: 'repay', q: 0, px: 0, amount: -action.amount, fee: 0 });
    return { state: st, ledger: run.ledger };
  }
  const q = action.qty;
  if (!marketOpen(now)) fail('장이 닫혀 있어요. 09:00~15:30(한국 시간)에 주문할 수 있어요.');
  if (!safe(q) || q < 1) fail('수량은 1주 이상의 정수로 정해 주세요.');
  if ((STOCK_OPENING_OPS as readonly string[]).includes(action.op) && place.area !== 'broker')
    fail('새 주문(매수·신용 매수·공매도)은 시장 거리 범마을 증권 안에서 해요.');
  const limit = holdLimit(sym);
  if (action.op === 'buy' || action.op === 'margin') {
    if (a.short[sym]) fail('공매도한 종목은 먼저 환매수해 주세요.');
    const l = a.long[sym];
    if ((l?.q ?? 0) + q > limit) fail(`한 종목은 ${limit.toLocaleString('ko-KR')}주(유통 주식의 10%)까지 가질 수 있어요.`);
    const cost = q * ask,
      fee = stockFee(cost);
    let loan = 0;
    if (action.op === 'margin') {
      if (Object.values(a.long).some((x) => x?.call !== undefined) || Object.values(a.short).some((x) => x?.call !== undefined))
        fail('마진콜이 걸린 동안에는 신용을 더 쓸 수 없어요. 먼저 상환하거나 정리해 주세요.');
      loan = Math.floor(cost * STOCK_MARGIN);
      if (creditUsed(a) + loan > STOCK_CREDIT_LIMIT)
        fail(`신용 한도(${STOCK_CREDIT_LIMIT.toLocaleString('ko-KR')}범)를 넘어요. 지금 ${(STOCK_CREDIT_LIMIT - creditUsed(a)).toLocaleString('ko-KR')}범 남았어요.`);
    }
    if (wallet() < cost - loan + fee) fail(`범이 부족해요. ${(cost - loan + fee).toLocaleString('ko-KR')}범이 필요해요.`);
    pay(cost - loan, fee, `${action.op}-${sym}`);
    const next = (a.long[sym] ??= { q: 0, cost: 0, loan: 0, int: 0 });
    next.q += q;
    next.cost += cost;
    next.loan += loan;
    st.flow[sym] = (st.flow[sym] ?? 0) + cost;
    stats.volume += cost;
    note(a, { at: now, sym, op: action.op, q, px: ask, amount: -(cost - loan + fee), fee });
  } else if (action.op === 'sell') {
    const l = a.long[sym];
    if (!l || q > l.q) fail(`팔 수 있는 ${def.name} 주식은 ${(l?.q ?? 0).toLocaleString('ko-KR')}주예요.`);
    const value = q * bid,
      all = q === l.q,
      repay = all ? l.loan : Math.ceil((l.loan * q) / l.q),
      interest = all ? l.int : Math.min(repay, Math.round((l.int * q) / l.q));
    const r = settle(run, uid, value - repay, stockFee(value), t, `sell-${sym}`);
    a.paidOut += r.paid;
    l.cost -= all ? l.cost : Math.round((l.cost * q) / l.q);
    l.loan -= repay;
    l.int = Math.min(l.int - interest, l.loan);
    l.q -= q;
    if (!l.q) delete a.long[sym];
    st.flow[sym] = (st.flow[sym] ?? 0) - value;
    stats.volume += value;
    note(a, { at: now, sym, op: 'sell', q, px: bid, amount: r.paid, fee: r.fee });
  } else if (action.op === 'short') {
    if (a.long[sym]) fail('가진 주식은 먼저 팔아 주세요. 같은 종목을 사면서 공매도할 수는 없어요.');
    const s = a.short[sym];
    if ((s?.q ?? 0) + q > limit) fail(`한 종목은 ${limit.toLocaleString('ko-KR')}주(유통 주식의 10%)까지 공매도할 수 있어요.`);
    const pool = Object.values(st.acct).reduce((n, x) => n + (x.short[sym]?.q ?? 0), 0);
    if (pool + q > Math.floor(def.float * STOCK_SHORT_POOL)) fail('빌려줄 수 있는 주식이 바닥났어요. 다른 친구들의 공매도가 많아요.');
    if (Object.values(a.long).some((x) => x?.call !== undefined) || Object.values(a.short).some((x) => x?.call !== undefined))
      fail('마진콜이 걸린 동안에는 공매도를 더 할 수 없어요.');
    const value = q * bid,
      coll = Math.ceil(value * STOCK_MARGIN),
      fee = stockFee(value);
    if (creditUsed(a) + value > STOCK_CREDIT_LIMIT)
      fail(`신용 한도(${STOCK_CREDIT_LIMIT.toLocaleString('ko-KR')}범)를 넘어요. 지금 ${(STOCK_CREDIT_LIMIT - creditUsed(a)).toLocaleString('ko-KR')}범 남았어요.`);
    if (wallet() < coll + fee) fail(`증거금이 부족해요. ${(coll + fee).toLocaleString('ko-KR')}범이 필요해요.`);
    pay(coll, fee, `short-${sym}`);
    const next = (a.short[sym] ??= { q: 0, val: 0, coll: 0 });
    next.q += q;
    next.val += value;
    next.coll += coll;
    st.flow[sym] = (st.flow[sym] ?? 0) - value;
    stats.volume += value;
    note(a, { at: now, sym, op: 'short', q, px: bid, amount: -(coll + fee), fee });
  } else if (action.op === 'cover') {
    const s = a.short[sym];
    if (!s || q > s.q) fail(`환매수할 수 있는 ${def.name} 공매도는 ${(s?.q ?? 0).toLocaleString('ko-KR')}주예요.`);
    const cost = q * ask,
      all = q === s.q,
      coll = all ? s.coll : Math.floor((s.coll * q) / s.q),
      val = all ? s.val : Math.round((s.val * q) / s.q);
    const r = settle(run, uid, coll + val - cost, stockFee(cost), t, `cover-${sym}`);
    a.paidOut += r.paid;
    s.q -= q;
    s.coll -= coll;
    s.val -= val;
    if (!s.q) delete a.short[sym];
    st.flow[sym] = (st.flow[sym] ?? 0) + cost;
    stats.volume += cost;
    note(a, { at: now, sym, op: 'cover', q, px: ask, amount: r.paid, fee: r.fee });
  }
  return { state: st, ledger: run.ledger };
}

// ---------------------------------------------------------------- view
export type StockQuote = {
  sym: StockSym;
  code: string;
  name: string;
  kind: 'shop' | 'theme';
  keeper: string | null;
  px: number;
  prev: number;
  lo: number;
  hi: number;
  ask: number;
  bid: number;
  today: number[];
  days: Candle[];
  div: number;
  float: number;
  limit: number;
};
export type StockPosition = {
  sym: StockSym;
  side: 'long' | 'short';
  q: number;
  /** Average entry price. */
  avg: number;
  /** Margin loan (long) or posted collateral (short). */
  loan: number;
  coll: number;
  interest: number;
  value: number;
  equity: number;
  pnl: number;
  ratio: number;
  call: boolean;
};
export type StocksView = {
  tick: number;
  open: boolean;
  nextOpenAt: number;
  nextTickAt: number | null;
  stocks: StockQuote[];
  me: {
    positions: StockPosition[];
    credit: { used: number; limit: number };
    equity: number;
    profit: number;
    ret: number;
    log: StockLog[];
  };
  ranking: { actor: number; profit: number; ret: number; equity: number }[];
  events: { at: number; sym: StockSym; kind: StockEventKind; text: string; actor: number | null; good: boolean | null }[];
};

/** What a friend may see: no seed, no one else's positions or record. */
export function stocksView(st: StockState, uid: string, actors: Readonly<Record<string, number>>, now: number): StocksView {
  const open = marketOpen(now);
  const stocks = STOCKS.map((d): StockQuote => {
    const band = limitsOf(st.prev[d.sym]),
      q = quoteOf(st.px[d.sym], band);
    return {
      sym: d.sym, code: d.code, name: d.name, kind: d.kind, keeper: d.keeper ?? null,
      px: st.px[d.sym], prev: st.prev[d.sym], lo: band[0], hi: band[1], ask: q.ask, bid: q.bid,
      today: [...st.today[d.sym]], days: st.days[d.sym].slice(-20).map((c) => [...c] as Candle),
      div: st.div[d.sym] ?? 0, float: d.float, limit: holdLimit(d.sym),
    };
  });
  const quote = Object.fromEntries(stocks.map((s) => [s.sym, s])) as Record<StockSym, StockQuote>;
  const a = st.acct[uid];
  const positions: StockPosition[] = [];
  for (const sym of STOCK_SYMS) {
    const l = a?.long[sym],
      s = a?.short[sym],
      qt = quote[sym];
    if (l) {
      const value = l.q * qt.bid,
        equity = Math.max(0, value - l.loan);
      positions.push({ sym, side: 'long', q: l.q, avg: Math.round(l.cost / l.q), loan: l.loan, coll: 0, interest: l.int, value, equity, pnl: value - l.cost, ratio: longRatio(l, qt.bid), call: l.call !== undefined });
    }
    if (s) {
      const value = s.q * qt.ask,
        equity = Math.max(0, s.coll + s.val - value);
      positions.push({ sym, side: 'short', q: s.q, avg: Math.round(s.val / s.q), loan: 0, coll: s.coll, interest: 0, value, equity, pnl: s.val - value, ratio: shortRatio(s, qt.ask), call: s.call !== undefined });
    }
  }
  const scoreOf = (x: StockAccount) => {
    const equity = equityOf(st, x),
      profit = x.paidOut + equity - x.paidIn;
    return { equity, profit, ret: profit / Math.max(x.peak, 10_000) };
  };
  const mine = a ? scoreOf(a) : { equity: 0, profit: 0, ret: 0 };
  const ranking = Object.entries(st.acct)
    .filter(([id, x]) => x.paidIn > 0 && Object.hasOwn(actors, id))
    .map(([id, x]) => ({ actor: actors[id], ...scoreOf(x) }))
    .sort((p, q) => q.ret - p.ret || q.profit - p.profit);
  const last = tickOf(now);
  const nextTick = last + 1;
  return {
    tick: st.tick,
    open,
    nextOpenAt: nextOpenAt(now),
    nextTickAt: nextTick % STOCK_TICKS === 0 ? null : tickAt(nextTick),
    stocks,
    me: { positions, credit: { used: creditUsed(a), limit: STOCK_CREDIT_LIMIT }, ...mine, log: [...(a?.log ?? [])].reverse() },
    ranking,
    events: st.events
      .filter((e) => e.tick <= last)
      .slice(-20)
      .reverse()
      .map((e) => ({ at: tickAt(e.tick), sym: e.sym, kind: e.kind, text: e.text, actor: e.uid && Object.hasOwn(actors, e.uid) ? actors[e.uid] : null, good: e.good ?? null })),
  };
}
/** A friend's market worth (for the daily grant's relief check). */
export const stockWealth = (st: StockState | undefined, uid: string) => (st ? equityOf(st, st.acct[uid]) : 0);
