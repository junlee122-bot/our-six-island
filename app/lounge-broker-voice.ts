// 범마을 증권 지점장 무잔의 창구 한마디 (design-broker-muzan.md §3). The stock
// window's keeper card shows one line picked from the friend's own view of the
// market (StocksView: their positions and record, the public events and
// quotes), so nothing private of anyone else leaks into a sentence. Same view,
// friend and hour give the same line on every screen (hash-chosen, no server).
//
// Order: a 반대매매 today (cold comfort) → a margin call → holding a stock at
// its 상한가 (praise; a short there gets a dry remark) or 하한가 → Monday's
// dividend → news on 범성전자 · 범이닉스 · 범비디아 → the open / the close
// bell → the day's mood. When 무잔 is not at his counter the card says where
// he is instead and the terminal works on its own.
import { hash32 } from './lounge-calendar.ts';
import { kstDay } from './lounge-economy.ts';
import { fillLine, type DealerMood } from './lounge-dealer-lines.ts';
import type { StockSym, StocksView } from './lounge-stocks.ts';

const HOUR = 3_600_000;
const KST = 9 * HOUR;
const dayStart = (day: number) => day * 24 * HOUR - KST;

export type BrokerSituation =
  | 'offline'
  | 'liquidated'
  | 'call'
  | 'limitUp'
  | 'limitUpShort'
  | 'limitDown'
  | 'dividend'
  | 'theme'
  | 'open'
  | 'close'
  | 'up'
  | 'down'
  | 'flat'
  | 'preopen'
  | 'afterProfit'
  | 'afterLoss'
  | 'after';

/**
 * 무잔's lines by situation. {me} the friend, {stock} a stock's name. Polite,
 * smug and calculating: cold to a loss, a sly compliment for a gain. No
 * threats, no lines from the original work.
 */
export const BROKER_LINES: Record<BrokerSituation, readonly string[]> = {
  offline: ['마을에 다시 연결되면 시세를 읽어 드리지요.', '연결이 끊겼군요. 시장은 기다려 주지 않지만, 저는 기다리지요.'],
  liquidated: [
    '{me}, 오늘 {stock} 반대매매가 나갔습니다. 규칙대로입니다. 위로는 차로 대신하지요.',
    '반대매매는 감정이 없습니다. 저도 그렇고요. 남은 증거금부터 확인하시지요.',
    '{stock} 정리는 끝났습니다. 손실은 숫자일 뿐입니다. 다음엔 신용을 줄이시지요.',
    '청산은 실패가 아니라 수업료입니다. 다만 수업료치고 비쌌군요.',
  ],
  call: [
    '{me}, {stock} 담보 비율이 40% 아래입니다. 두 번 말씀드리지 않습니다.',
    '마진콜입니다. 증거금을 채우시든, 정리하시든. 기다리는 건 선택지가 아닙니다.',
    '{stock} 신용이 위태롭군요. 내일 종가까지입니다. 냉정하게 판단하시지요.',
  ],
  limitUp: [
    '{me}, {stock} 상한가입니다. …나쁘지 않은 안목이군요. 아주 나쁘지 않습니다.',
    '{stock} 상한가. 축하드리지요. 다만 이익은 팔았을 때 이익입니다.',
    '오늘 전광판에서 가장 아름다운 줄이 {me} 계좌에 있군요.',
    '{stock|을/를} 진작 고르셨다니. 제 평가를 상향 조정하겠습니다.',
  ],
  limitUpShort: [
    '{stock} 상한가에 공매도라. 변동성은 아름답지요. 오늘은 당신 편이 아니지만.',
    '{me}, 하늘로 가는 종목을 빌려 파셨군요. 환매수 버튼은 저쪽입니다.',
  ],
  limitDown: [
    '{stock} 하한가입니다. 버틸지 끊을지는 당신 몫이지요. 저는 차를 내리겠습니다.',
    '{me}, 오늘은 {stock|이/가} 바닥을 봤군요. 바닥 아래에도 층이 있다는 걸 잊지 마시지요.',
    '하한가에 울지 않는 분이 결국 남습니다. 울어도 됩니다. 장부는 그대로지만요.',
  ],
  dividend: [
    '월요일, 배당일입니다. 가게 종목을 들고 계셨다면 지갑을 확인해 보시지요.',
    '배당은 기다린 사람에게만 오는 작은 상입니다. 오늘은 그 날이지요.',
    '{me}, 지난주 장사의 몫이 오늘 들어옵니다. 꾸준함은 이렇게 보상받지요.',
  ],
  theme: [
    '{stock} 소식이 떴군요. 소문에 사고 뉴스에 판다는 말, 들어 보셨지요.',
    '{stock|이/가} 오늘 시끄럽군요. 시끄러운 종목은 아름답지만 비쌉니다.',
    '{stock} 뉴스라. 가상 회사의 소식이 마을 지갑을 흔드는 걸 보면 흥미롭지요.',
    '{me}, {stock}에 손대실 겁니까. 하루 15%는 생각보다 깁니다. 양쪽으로.',
  ],
  open: [
    '아홉 시, 장이 열렸습니다. 첫 시세는 늘 거짓말을 조금 섞지요.',
    '개장입니다. 서두르는 분이 비싸게 사는 시간이지요. 천천히 보시지요.',
    '{me}, 좋은 아침입니다. 오늘의 변동성도 아름답기를.',
  ],
  close: [
    '곧 장이 닫힙니다. 15시 반까지는 종가로 체결되지요. 정리하실 건 지금입니다.',
    '마감 종이 울리기 전입니다. 들고 잘 것과 놓고 갈 것을 고르시지요.',
    '오늘의 마지막 시세입니다. 아쉬움은 내일 시가에 맡기시지요.',
  ],
  up: [
    '오늘은 전광판이 붉군요. 이런 날 손님들은 너그러워지지요.',
    '시장이 웃고 있습니다. 웃음이 길지는 않지만, 즐기셔도 좋습니다.',
    '{me}, 붉은 날입니다. 수익이 나셨다면 절반쯤은 실력이라고 해 두지요.',
  ],
  down: [
    '푸른 날이군요. 공포에 파는 분과 공포를 사는 분이 나뉘는 날입니다.',
    '시장이 차갑습니다. 저는 원래 차가워서 불편하지 않지요.',
    '{me}, 내리는 날의 매수는 용기거나 착각입니다. 어느 쪽인지는 내일 압니다.',
  ],
  flat: ['조용한 장입니다. 저는 조용한 장을 좋아합니다. 계산이 잘 되거든요.', '오늘은 시장이 숨을 고르는군요. 이런 날 판단이 정확해집니다.'],
  preopen: ['장은 아홉 시에 열립니다. 그 전에 할 일은 어제 장부를 읽는 것이지요.', '{me}, 이른 걸음이군요. 시세는 아직 어제의 종가입니다.'],
  afterProfit: [
    '오늘 장은 닫혔습니다. {me}, 계좌가 웃고 있군요. 칭찬처럼 들렸다면 칭찬 맞습니다.',
    '장 마감입니다. 수익이 나셨군요. 나쁘지 않습니다. 다음에도 그 냉정함을 유지하시지요.',
  ],
  afterLoss: [
    '장은 닫혔습니다. 손실은 숫자일 뿐입니다. 내일 다시 계산하시지요.',
    '{me}, 오늘 계좌가 푸르군요. 감정은 비싼 수수료입니다. 내지 마시지요.',
  ],
  after: ['장이 닫혔습니다. 내일 아홉 시에 뵙지요. 팔기와 상환은 언제든 됩니다.', '마감 뒤의 객장은 조용합니다. 저는 이 시간을 좋아하지요.'],
};

export const THEME_SYMS: readonly StockSym[] = ['bsung', 'bnix', 'bvidia'];

export type BrokerRemark = { situation: BrokerSituation; line: string; mood: DealerMood; sym?: StockSym };
const MOOD: Record<BrokerSituation, DealerMood> = {
  offline: 'calm',
  liquidated: 'sorry',
  call: 'focus',
  limitUp: 'wow',
  limitUpShort: 'smile',
  limitDown: 'sorry',
  dividend: 'smile',
  theme: 'focus',
  open: 'smile',
  close: 'focus',
  up: 'smile',
  down: 'calm',
  flat: 'calm',
  preopen: 'calm',
  afterProfit: 'smile',
  afterLoss: 'calm',
  after: 'calm',
};

/** What fits the friend's market right now (the first match of the order above). */
export function brokerSituation(market: StocksView | undefined, now: number): { situation: BrokerSituation; sym?: StockSym } {
  if (!market) return { situation: 'offline' };
  const today = dayStart(kstDay(now));
  const minute = Math.floor((now - today) / 60_000);
  const liq = market.me.log.find((l) => l.op === 'liquidate' && l.at >= today);
  if (liq) return { situation: 'liquidated', sym: liq.sym };
  const call = market.me.positions.find((p) => p.call);
  if (call) return { situation: 'call', sym: call.sym };
  const quote = (sym: StockSym) => market.stocks.find((q) => q.sym === sym);
  for (const p of market.me.positions) {
    const q = quote(p.sym);
    if (q && q.px >= q.hi) return { situation: p.side === 'long' ? 'limitUp' : 'limitUpShort', sym: p.sym };
  }
  for (const p of market.me.positions) {
    const q = quote(p.sym);
    if (q && q.px <= q.lo && p.side === 'long') return { situation: 'limitDown', sym: p.sym };
  }
  const weekday = new Date(now + KST).getUTCDay();
  if (weekday === 1 && minute >= 9 * 60 && minute < 12 * 60) return { situation: 'dividend' };
  const theme = market.events.find((e) => e.kind === 'news' && e.at >= today && THEME_SYMS.includes(e.sym));
  if (theme) return { situation: 'theme', sym: theme.sym };
  if (!market.open) {
    if (minute < 9 * 60) return { situation: 'preopen' };
    if (market.me.log.some((l) => l.at >= today) || market.me.positions.length)
      return { situation: market.me.profit > 0 ? 'afterProfit' : market.me.profit < 0 ? 'afterLoss' : 'after' };
    return { situation: 'after' };
  }
  if (minute < 10 * 60) return { situation: 'open' };
  if (minute >= 15 * 60) return { situation: 'close' };
  const moves = market.stocks.map((q) => (q.px - q.prev) / Math.max(1, q.prev));
  const avg = moves.reduce((a, b) => a + b, 0) / Math.max(1, moves.length);
  return { situation: avg > 0.004 ? 'up' : avg < -0.004 ? 'down' : 'flat' };
}

/** 무잔's line for this friend (`me` their name, `who` a stable key) at `now`. */
export function brokerRemark(market: StocksView | undefined, me: string, who: string | number, now: number): BrokerRemark {
  const { situation, sym } = brokerSituation(market, now);
  const pool = BROKER_LINES[situation];
  const hour = Math.floor((now + KST) / HOUR);
  const template = pool[hash32(`muzan:desk:${who}:${hour}:${situation}:${sym ?? ''}`) % pool.length];
  const stock = sym ? (market?.stocks.find((q) => q.sym === sym)?.name ?? '') : '';
  const line = fillLine(template, { me: me || '손님', stock });
  return { situation, line, mood: MOOD[situation], ...(sym ? { sym } : {}) };
}
