'use client';
// 범마을 증권 (handover/design/design-stocks.md §7.2): the HTS-style window.
// Everything here is a preview; the server (lounge-stocks.ts) fills every
// order at its own quote and re-checks hours, place, money and limits.
import { useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  STOCK_BY_SYM,
  STOCK_CALL,
  STOCK_CREDIT_LIMIT,
  STOCK_FEE,
  STOCK_MAINTENANCE,
  STOCK_MARGIN,
  STOCK_TICKS,
  stockFee,
  type Candle,
  type StockAction,
  type StockPosition,
  type StockQuote,
  type StockSym,
  type StocksView,
} from '../lounge-stocks';
import { ACTORS } from '../lounge-roster';
import { formatBeom } from '../lounge-text';
import { GameButton } from '../ui/GameButton';
import { Tabs, tabPanelProps } from '../ui/Tabs';
import { Modal } from './Modal';
import type { Notify } from './Toast';
import './stock-panel.css';

type Page = 'quotes' | 'account' | 'ranking' | 'news';
type ChartMode = 'today' | 'days';
const pct = (x: number, digits = 2) => `${x > 0 ? '+' : ''}${(x * 100).toFixed(digits)}%`;
const tone = (x: number) => (x > 0 ? 'is-up' : x < 0 ? 'is-down' : '');
const arrow = (x: number) => (x > 0 ? '▲' : x < 0 ? '▼' : '');
const hhmm = (t: number) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }).format(t);
const mmdd = (t: number) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).format(t);
const OP_WORD: Record<string, string> = {
  buy: '매수',
  margin: '신용 매수',
  sell: '매도',
  short: '공매도',
  cover: '환매수',
  repay: '신용 상환',
  dividend: '배당',
  liquidate: '반대매매',
  call: '마진콜',
};

/** A small SVG chart: today's hourly line or the last 20 daily candles. */
function StockChart({ q, mode }: { q: StockQuote; mode: ChartMode }) {
  const W = 360,
    H = 170,
    PAD = 8;
  const candles: Candle[] = q.days.slice(-20);
  const values = mode === 'today' ? [q.prev, q.lo, q.hi, ...q.today] : candles.flatMap((c) => [c[1], c[2]]);
  const min = Math.min(...values),
    max = Math.max(...values);
  const y = (p: number) => PAD + (H - 2 * PAD) * (1 - (p - min) / Math.max(1, max - min));
  if (mode === 'today') {
    const x = (i: number) => PAD + ((W - 2 * PAD) * i) / (STOCK_TICKS - 1);
    const line = q.today.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(' ');
    return (
      <svg className="l-stock-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${q.name} 오늘 시세 ${q.today.length}개 시각`}>
        <line className="l-stock-band is-up" x1={PAD} x2={W - PAD} y1={y(q.hi)} y2={y(q.hi)} />
        <line className="l-stock-band is-down" x1={PAD} x2={W - PAD} y1={y(q.lo)} y2={y(q.lo)} />
        <line className="l-stock-prev" x1={PAD} x2={W - PAD} y1={y(q.prev)} y2={y(q.prev)} />
        {line && <path className={`l-stock-line ${tone(q.px - q.prev)}`} d={line} />}
        {q.today.map((p, i) => (
          <circle key={i} className={`l-stock-dot ${tone(p - q.prev)}`} cx={x(i)} cy={y(p)} r={3} />
        ))}
        {Array.from({ length: STOCK_TICKS }, (_, i) => (
          <text key={i} className="l-stock-axis" x={x(i)} y={H - 1} textAnchor="middle">
            {9 + i}
          </text>
        ))}
      </svg>
    );
  }
  const step = (W - 2 * PAD) / Math.max(1, candles.length);
  return (
    <svg className="l-stock-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${q.name} 최근 ${candles.length}일 일봉`}>
      {candles.map(([o, h, l, c], i) => {
        const cx = PAD + step * (i + 0.5),
          t = tone(c - o) || tone(c - (candles[i - 1]?.[3] ?? o));
        return (
          <g key={i} className={`l-stock-candle ${t}`}>
            <line x1={cx} x2={cx} y1={y(h)} y2={y(l)} />
            <rect x={cx - step * 0.32} width={step * 0.64} y={Math.min(y(o), y(c))} height={Math.max(1.5, Math.abs(y(o) - y(c)))} />
          </g>
        );
      })}
    </svg>
  );
}

export function StockPanel({ room, view, notify, onClose }: { room: CloudRoom; view: CloudRoomView; notify: Notify; onClose: () => void }) {
  const market: StocksView | undefined = view.stocks;
  const [page, setPage] = useState<Page>('quotes');
  const [sym, setSym] = useState<StockSym>('coop');
  const [mode, setMode] = useState<ChartMode>('today');
  const [qty, setQty] = useState(1);
  const [repay, setRepay] = useState(10_000);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const me = view.players.find((p) => p.id === view.self);
  const inBroker = me?.area === 'broker';
  const q = market?.stocks.find((s) => s.sym === sym);
  const position = market?.me.positions.find((p) => p.sym === sym);

  const run = async (action: StockAction, done: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      if (await room.action(action)) notify(done);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const offline = !me || view.status !== 'connected';
  const closed = !market?.open;
  const validQty = Number.isSafeInteger(qty) && qty >= 1;
  // Preview of the order (the server decides).
  const cost = q ? qty * q.ask : 0,
    proceeds = q ? qty * q.bid : 0;
  const marginLoan = Math.floor(cost * STOCK_MARGIN);
  const creditLeft = market ? market.me.credit.limit - market.me.credit.used : 0;
  const held = position?.side === 'long' ? position.q : 0,
    shorted = position?.side === 'short' ? position.q : 0;
  const openReason = offline
    ? '마을에 다시 연결되면 주문할 수 있어요.'
    : closed
      ? '장이 닫혀 있어요. 09:00~15:30(한국 시간)에 주문해요.'
      : !inBroker
        ? '새 주문(매수·신용 매수·공매도)은 시장 거리 범마을 증권 안에서 해요.'
        : '';
  const closeReason = offline ? '마을에 다시 연결되면 주문할 수 있어요.' : closed ? '장이 닫혀 있어요. 09:00~15:30(한국 시간)에 주문해요.' : '';
  const balance = view.wallet.balance;
  const buyNeed = cost + stockFee(cost),
    marginNeed = cost - marginLoan + stockFee(cost),
    shortNeed = Math.ceil(proceeds * STOCK_MARGIN) + stockFee(proceeds);
  const holdLimit = q?.limit ?? 0;

  const nextTick = market?.nextTickAt ?? null;
  const status = !market
    ? '시세를 불러오는 중'
    : market.open
      ? nextTick
        ? `장중 · 다음 시세 ${hhmm(nextTick)}`
        : '장 마감 전 종가 거래(15:00~15:30)'
      : `장 마감 · 다음 개장 ${mmdd(market.nextOpenAt)} ${hhmm(market.nextOpenAt)}`;

  return (
    <Modal title="범마을 증권" wide venue="broker" className="l-stock" onClose={onClose}>
      <div className="l-stock-top" data-testid="stock-panel" aria-busy={busy}>
        <output className={`l-stock-status ${market?.open ? 'is-open' : ''}`} data-testid="stock-status">
          {status}
        </output>
        <dl className="l-stock-summary">
          <div>
            <dt>내 지갑</dt>
            <dd>{formatBeom(balance)}</dd>
          </div>
          <div>
            <dt>주식 평가</dt>
            <dd>{formatBeom(market?.me.equity ?? 0)}</dd>
          </div>
          <div>
            <dt>손익 · 수익률</dt>
            <dd className={tone(market?.me.profit ?? 0)}>
              {formatBeom(market?.me.profit ?? 0)} · {pct(market?.me.ret ?? 0)}
            </dd>
          </div>
          <div>
            <dt>신용 사용</dt>
            <dd>
              {formatBeom(market?.me.credit.used ?? 0)} / {formatBeom(STOCK_CREDIT_LIMIT)}
            </dd>
          </div>
        </dl>
      </div>
      {market?.me.positions.some((p) => p.call) && (
        <p className="l-stock-warn" role="alert" data-testid="stock-margin-call">
          마진콜: 담보 비율이 {Math.round(STOCK_CALL * 100)}% 아래예요. 다음 날 15:00 종가까지 상환하거나 정리하지 않으면, 또는 {Math.round(STOCK_MAINTENANCE * 100)}% 아래로 떨어지면 반대매매돼요.
        </p>
      )}
      <Tabs<Page>
        label="증권 창"
        idBase="stock"
        value={page}
        onChange={setPage}
        items={[
          { id: 'quotes', label: '시세 · 주문' },
          { id: 'account', label: '내 잔고' },
          { id: 'ranking', label: '수익률 랭킹' },
          { id: 'news', label: '주식 소식' },
        ]}
      />
      {!market ? (
        <p className="l-stock-empty">증권사가 문을 여는 중이에요. 마을을 한 번 걸으면 시세가 들어와요.</p>
      ) : page === 'quotes' ? (
        <section {...tabPanelProps('stock', 'quotes')} className="l-stock-board">
          <ul className="l-stock-list" aria-label="종목">
            {market.stocks.map((s) => {
              const chg = s.px - s.prev;
              return (
                <li key={s.sym}>
                  <button type="button" aria-pressed={s.sym === sym} data-testid={`stock-row-${s.sym}`} onClick={() => setSym(s.sym)}>
                    <span className="l-stock-name">
                      {s.name}
                      <small>{s.kind === 'shop' ? '가게' : '테마'}</small>
                    </span>
                    <span className="l-stock-px">{s.px.toLocaleString('ko-KR')}</span>
                    <span className={`l-stock-chg ${tone(chg)}`}>
                      {arrow(chg)} {pct(chg / s.prev)}
                      {s.px === s.hi && chg > 0 && <b className="l-stock-badge is-up">상</b>}
                      {s.px === s.lo && chg < 0 && <b className="l-stock-badge is-down">하</b>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {q && (
            <div className="l-stock-detail">
              <header className="l-stock-head">
                <h3>
                  {q.name} <small>{q.code}</small>
                </h3>
                <p className={tone(q.px - q.prev)}>
                  <strong>{q.px.toLocaleString('ko-KR')}</strong> {arrow(q.px - q.prev)} {Math.abs(q.px - q.prev).toLocaleString('ko-KR')} ({pct((q.px - q.prev) / q.prev)})
                </p>
                <p className="l-stock-meta">
                  {q.kind === 'shop' ? `${q.keeper ?? ''} · 가게 거래액이 시세와 배당에 반영` : '가상 테마주 · 배당 없음 · 변동 큼'} · 상한 {q.hi.toLocaleString('ko-KR')} · 하한 {q.lo.toLocaleString('ko-KR')}
                  {q.div > 0 && ` · 최근 배당 주당 ${formatBeom(q.div)}`}
                </p>
              </header>
              <div className="l-stock-chart-wrap">
                <div className="l-stock-modes">
                  <button type="button" aria-pressed={mode === 'today'} onClick={() => setMode('today')}>
                    오늘(1시간)
                  </button>
                  <button type="button" aria-pressed={mode === 'days'} onClick={() => setMode('days')}>
                    일봉(20일)
                  </button>
                </div>
                <StockChart q={q} mode={mode} />
              </div>
              <table className="l-stock-book" aria-label="호가">
                <tbody>
                  <tr className="is-ask">
                    <th scope="row">매도1호가</th>
                    <td>{q.ask.toLocaleString('ko-KR')}</td>
                    <td>사는 값</td>
                  </tr>
                  <tr className="is-now">
                    <th scope="row">현재가</th>
                    <td>{q.px.toLocaleString('ko-KR')}</td>
                    <td>{q.today.length ? `${8 + q.today.length}:00 시세` : '어제 종가'}</td>
                  </tr>
                  <tr className="is-bid">
                    <th scope="row">매수1호가</th>
                    <td>{q.bid.toLocaleString('ko-KR')}</td>
                    <td>파는 값</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {q && (
            <div className="l-stock-order" data-testid="stock-order">
              <h3>주문</h3>
              <p className="l-stock-hold">
                {held ? `보유 ${held.toLocaleString('ko-KR')}주` : shorted ? `공매도 ${shorted.toLocaleString('ko-KR')}주` : '보유 없음'} · 한도 {holdLimit.toLocaleString('ko-KR')}주
              </p>
              <label>
                수량(주)
                <input data-testid="stock-qty" type="number" min={1} max={holdLimit} step={1} value={qty} disabled={busy} onChange={(e) => setQty(Math.floor(Number(e.target.value)))} />
              </label>
              <dl className="l-stock-preview">
                <div>
                  <dt>사면</dt>
                  <dd>{formatBeom(validQty ? buyNeed : 0)}</dd>
                </div>
                <div>
                  <dt>신용(내 돈 절반)</dt>
                  <dd>{formatBeom(validQty ? marginNeed : 0)}</dd>
                </div>
                <div>
                  <dt>팔면(수수료 뒤)</dt>
                  <dd>{formatBeom(validQty ? proceeds - stockFee(proceeds) : 0)}</dd>
                </div>
                <div>
                  <dt>공매도 증거금</dt>
                  <dd>{formatBeom(validQty ? shortNeed : 0)}</dd>
                </div>
              </dl>
              {openReason && <output className="l-stock-note">{openReason}</output>}
              <div className="l-stock-actions">
                <GameButton variant="primary" data-testid="stock-buy" disabled={busy || !!openReason || !validQty || !!shorted || buyNeed > balance || held + qty > holdLimit}
                  disabledReason={openReason || undefined}
                  onClick={() => void run({ kind: 'stock', op: 'buy', sym, qty }, `${q.name} ${qty}주를 샀어요.`)}>
                  매수
                </GameButton>
                <GameButton data-testid="stock-margin" disabled={busy || !!openReason || !validQty || !!shorted || marginNeed > balance || marginLoan > creditLeft || held + qty > holdLimit}
                  onClick={() => void run({ kind: 'stock', op: 'margin', sym, qty }, `${q.name} ${qty}주를 신용으로 샀어요.`)}>
                  신용 매수
                </GameButton>
                <GameButton data-testid="stock-short" disabled={busy || !!openReason || !validQty || !!held || shortNeed > balance || proceeds > creditLeft || shorted + qty > holdLimit}
                  onClick={() => void run({ kind: 'stock', op: 'short', sym, qty }, `${q.name} ${qty}주를 공매도했어요.`)}>
                  공매도
                </GameButton>
                <GameButton variant="danger" data-testid="stock-sell" disabled={busy || !!closeReason || !validQty || qty > held}
                  disabledReason={closeReason || undefined}
                  onClick={() => void run({ kind: 'stock', op: 'sell', sym, qty }, `${q.name} ${qty}주를 팔았어요.`)}>
                  매도
                </GameButton>
                <GameButton data-testid="stock-cover" disabled={busy || !!closeReason || !validQty || qty > shorted}
                  onClick={() => void run({ kind: 'stock', op: 'cover', sym, qty }, `${q.name} ${qty}주를 환매수했어요.`)}>
                  환매수
                </GameButton>
              </div>
              {position?.side === 'long' && position.loan > 0 && (
                <div className="l-stock-repay">
                  <label>
                    신용 상환(빚 {formatBeom(position.loan)})
                    <input data-testid="stock-repay-amount" type="number" min={1} max={position.loan} step={1000} value={Math.min(repay, position.loan)} disabled={busy} onChange={(e) => setRepay(Math.floor(Number(e.target.value)))} />
                  </label>
                  <GameButton data-testid="stock-repay" disabled={busy || offline || repay < 1 || Math.min(repay, position.loan) > balance}
                    onClick={() => void run({ kind: 'stock', op: 'repay', sym, amount: Math.min(repay, position.loan) }, '신용 빚을 갚았어요.')}>
                    상환
                  </GameButton>
                </div>
              )}
              <p className="l-stock-fine">
                수수료 {STOCK_FEE * 100}% · 신용은 최대 2배, 하루 이자 0.1% · 공매도 대차 수수료 하루 0.1% · 손실은 낸 증거금까지
              </p>
            </div>
          )}
        </section>
      ) : page === 'account' ? (
        <section {...tabPanelProps('stock', 'account')} className="l-stock-account" data-testid="stock-account">
          {!market.me.positions.length ? (
            <p className="l-stock-empty">아직 가진 주식이 없어요. 시세 탭에서 종목을 골라 보세요.</p>
          ) : (
            <table className="l-stock-table">
              <thead>
                <tr>
                  <th scope="col">종목</th>
                  <th scope="col">구분</th>
                  <th scope="col">수량</th>
                  <th scope="col">평균가</th>
                  <th scope="col">평가</th>
                  <th scope="col">손익</th>
                  <th scope="col">빚 · 증거금</th>
                  <th scope="col">담보 비율</th>
                </tr>
              </thead>
              <tbody>
                {market.me.positions.map((p: StockPosition) => (
                  <tr key={p.sym + p.side} className={p.call ? 'is-call' : ''}>
                    <th scope="row">
                      <button type="button" className="l-stock-link" onClick={() => { setSym(p.sym); setPage('quotes'); }}>
                        {STOCK_BY_SYM[p.sym].name}
                      </button>
                    </th>
                    <td>{p.side === 'short' ? '공매도' : p.loan ? '신용' : '현금'}</td>
                    <td>{p.q.toLocaleString('ko-KR')}</td>
                    <td>{p.avg.toLocaleString('ko-KR')}</td>
                    <td>{formatBeom(p.value)}</td>
                    <td className={tone(p.pnl)}>
                      {formatBeom(p.pnl)} ({pct(p.pnl / Math.max(1, p.side === 'short' ? p.avg * p.q : p.avg * p.q), 1)})
                    </td>
                    <td>{p.side === 'short' ? formatBeom(p.coll) : p.loan ? formatBeom(p.loan) : '—'}</td>
                    <td>{p.side === 'long' && !p.loan ? '—' : `${Math.round(p.ratio * 100)}%${p.call ? ' · 마진콜' : ''}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h3>최근 거래</h3>
          {!market.me.log.length ? (
            <p className="l-stock-empty">거래 기록이 없어요.</p>
          ) : (
            <ul className="l-stock-log">
              {market.me.log.map((l, i) => (
                <li key={i}>
                  <span>
                    {mmdd(l.at)} {hhmm(l.at)}
                  </span>
                  <span>
                    {STOCK_BY_SYM[l.sym].name} {OP_WORD[l.op]}
                    {l.q ? ` ${l.q.toLocaleString('ko-KR')}주` : ''}
                    {l.px && l.op !== 'dividend' ? ` @${l.px.toLocaleString('ko-KR')}` : ''}
                  </span>
                  <b className={tone(l.amount)}>{l.amount ? formatBeom(l.amount) : '—'}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : page === 'ranking' ? (
        <section {...tabPanelProps('stock', 'ranking')} className="l-stock-ranking" data-testid="stock-ranking">
          {!market.ranking.length ? (
            <p className="l-stock-empty">아직 주식을 산 친구가 없어요.</p>
          ) : (
            <ol>
              {market.ranking.map((r, i) => (
                <li key={r.actor}>
                  <span className="l-stock-rank">{i + 1}</span>
                  <span>{ACTORS[r.actor]}</span>
                  <b className={tone(r.ret)}>{pct(r.ret)}</b>
                  <small className={tone(r.profit)}>{formatBeom(r.profit)}</small>
                </li>
              ))}
            </ol>
          )}
          <p className="l-stock-fine">수익률 = (판 돈 + 받은 배당 + 지금 평가 − 넣은 돈) ÷ 가장 많이 넣어 둔 돈(최소 1만 범)</p>
        </section>
      ) : (
        <section {...tabPanelProps('stock', 'news')} className="l-stock-news" data-testid="stock-news">
          {!market.events.length ? (
            <p className="l-stock-empty">아직 주식 소식이 없어요.</p>
          ) : (
            <ul>
              {market.events.map((e, i) => (
                <li key={i} className={e.good === true ? 'is-up' : e.good === false ? 'is-down' : ''}>
                  <span>
                    {mmdd(e.at)} {hhmm(e.at)}
                  </span>
                  <span>
                    <b>{e.kind === 'news' ? STOCK_BY_SYM[e.sym].name : e.kind === 'up' ? '상한가' : e.kind === 'down' ? '하한가' : e.kind === 'dividend' ? '배당' : '반대매매'}</b>{' '}
                    {e.kind === 'liquidate' && e.actor !== null ? `${ACTORS[e.actor]}: ` : ''}
                    {e.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <p className="l-stock-desk">아직 창구 직원은 없어요. 단말기로 직접 주문해요. 시세는 09:00~15:00 매시 정각에 바뀌어요.</p>
    </Modal>
  );
}
