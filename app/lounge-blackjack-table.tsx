'use client';
import { useRef, useState, type CSSProperties } from 'react';
import { ChevronDown, Layers, Plus, Hand, ChevronsUp } from 'lucide-react';
import { PokerCard, beom } from './lounge-poker-table';
import {
  blackjackValue,
  type BlackjackView,
  type BlackjackAction,
} from './lounge-blackjack';
import { TURN_LIMIT_MS } from './lounge-games';
import type { TurnTiming } from './lounge-room';
import { AWAY_LABEL, TurnTimer, awaitAnswer } from './lounge-turn-timer';
import {
  blackjackHandReports,
  blackjackLine,
  blackjackTotalLabel,
  blackjackVerdict,
  sir,
  type TableReaction,
} from './lounge-dealer-lines';
import {
  DealerHost,
  useDealerTips,
  useReactionReply,
  useTableMemory,
  useTableSounds,
} from './lounge-dealer-host';
import './lounge-poker-table.css';
import './lounge-blackjack-table.css';
const outcomes = {
  win: '승리',
  lose: '패배',
  push: '푸시 · 무승부',
  blackjack: '블랙잭!',
  '': '',
};
const status = {
  playing: '선택 대기',
  stood: '스탠드',
  bust: '버스트',
  blackjack: '블랙잭',
};
const signed = (n: number) => (n > 0 ? '+' : '') + beom(n);
/** Deal stagger: the order a card left the shoe in the opening deal. */
const STAGGER_MS = 110;
export function BlackjackTable({
  match: g,
  seat,
  names,
  onAction,
  round,
  reaction,
}: {
  match: BlackjackView & TurnTiming;
  seat: number;
  names: string[];
  onAction: (action: BlackjackAction) => void | Promise<boolean>;
  /** Table round (1 = first 판), for the host's greeting. */
  round?: number;
  /** Newest sticker at this table, for the host's reply. */
  reaction?: TableReaction | null;
}) {
  const [rules, setRules] = useState(false),
    [sent, setSent] = useState<number | null>(null),
    inFlight = useRef<number | null>(null),
    tips = useDealerTips();
  // A new deal or revision clears the local send lock (reset during render,
  // not in an effect, so the buttons never flash a stale disabled state).
  const viewKey = `${g.id}:${g.revision}`,
    [seenKey, setSeenKey] = useState(viewKey);
  if (seenKey !== viewKey) {
    setSeenKey(viewKey);
    setSent(null);
  }
  const act = (kind: BlackjackAction['kind']) => {
    // The ref also stops a second tap that lands before React re-renders.
    if (!g.legal[kind] || sent === g.revision || inFlight.current === g.revision)
      return;
    inFlight.current = g.revision;
    setSent(g.revision);
    awaitAnswer(onAction({ kind }), () => {
      inFlight.current = null;
      setSent(null);
    });
  };
  const hidden = g.dealer.some((c) => c === null),
    dealerCards = g.dealer.filter((c): c is number => c !== null),
    dealerValue = blackjackValue(dealerCards);
  const ended = g.phase === 'over',
    myTurn = g.legal.enabled,
    dealerTurn = g.phase !== 'players' && !ended,
    hand = g.hands[seat]?.[g.hand],
    away = (i: number) => !!g.away?.includes(i);
  const memory = useTableMemory('blackjack', names, {
    id: g.id,
    over: ended,
    results: g.result,
    dealerBust: ended ? dealerValue.bust : undefined,
  });
  const line = blackjackLine(g, seat, names, {
    round,
    memory,
    tips: tips.on,
  });
  const aside = useReactionReply(g.id, reaction, names);
  const reports = ended ? blackjackHandReports(g, names) : [];
  const n = g.hands.length,
    first = g.first ?? 0,
    // Opening deal order: one card to each seat from the first seat, dealer last, twice.
    dealOrder = (s: number, j: number) =>
      j * (n + 1) + (s < 0 ? n : (s - first + n) % n);
  const cardStyle = (s: number, j: number, split: boolean) =>
    ({
      '--deal-delay':
        j < 2 && !split ? `${dealOrder(s, j) * STAGGER_MS}ms` : '0ms',
    }) as CSSProperties;
  useTableSounds({
    id: g.id,
    cards:
      g.dealer.length +
      g.hands.reduce((a, hs) => a + hs.reduce((b, h) => b + h.cards.length, 0), 0),
    flips: hidden ? 0 : 1,
    payout: ended && g.result.some((r) => r > 0),
    live: !ended,
    big: ended && g.hands[seat]?.some((h) => h.outcome === 'blackjack') ? 'blackjack' : null,
  });
  return (
    <div className={'bj-club' + (ended ? ' is-over' : '')}>
      <DealerHost
        host="lumi"
        line={line}
        aside={aside}
        className="bj-announcement"
        table={{ number: 3, game: '블랙잭' }}
        tips={tips}
      />
      <div className="bj-felt">
        <div className="bj-table-heading">
          <span>별빛 카지노</span>
          <h2>
            블랙잭 <i>21</i>
          </h2>
          <p>블랙잭은 3:2(1.5배) 지급 · 딜러는 17 이상에서 멈춰요</p>
        </div>
        <div className={'bj-house' + (!hidden ? ' revealed' : '')}>
          <div className="bj-seat-title">
            <strong>딜러 루미</strong>
            <span className={dealerValue.bust ? 'bust' : ''}>
              {hidden ? '홀카드 비공개' : blackjackTotalLabel(dealerCards)}
            </span>
          </div>
          <div className="bj-cards bj-dealer-cards">
            {g.dealer.map((c, i) => (
              // Keyed by position: the hole card flips in place.
              <span
                key={'d' + i}
                className="bj-dealt"
                style={cardStyle(-1, i, false)}
              >
                <span
                  key={c === null ? 'back' : 'face'}
                  className={
                    'bj-flip' + (i === 1 && c !== null ? ' is-open' : '')
                  }
                >
                  <PokerCard
                    card={c === null ? undefined : c % 52}
                    back={c === null}
                  />
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="bj-table-rule">
          기본 베팅 <b>{beom(g.stake)}</b>
          <span>6덱 · 매 판 새로 섞어요 · 더블 · 스플릿</span>
        </div>
        <div
          className="bj-players"
          style={
            { '--bj-columns': Math.min(g.hands.length, 4) } as CSSProperties
          }
        >
          {g.hands.map((hands, i) => (
            <section
              key={i}
              className={
                'bj-seat' +
                (seat === i ? ' self' : '') +
                (g.phase === 'players' && g.turn === i ? ' active' : '')
              }
              aria-label={`${names[i]} 자리`}
            >
              <div className="bj-seat-title">
                <strong>
                  <small>{String(i + 1).padStart(2, '0')}</small>
                  {names[i]}
                  {seat === i && <em>나</em>}
                </strong>
                <span>
                  {ended
                    ? signed(g.result[i])
                    : away(i)
                      ? AWAY_LABEL
                      : g.phase === 'players' && g.turn === i
                        ? '진행 중'
                        : hands.every((h) => h.status !== 'playing')
                          ? '선택 완료'
                          : '대기'}
                </span>
              </div>
              <div
                className={'bj-hands' + (hands.length === 2 ? ' split' : '')}
              >
                {hands.map((h, j) => {
                  const report = reports.find(
                    (r) => r.seat === i && r.hand === j,
                  );
                  return (
                    <div
                      key={j}
                      className={
                        'bj-hand' +
                        (g.phase === 'players' && g.turn === i && g.hand === j
                          ? ' current'
                          : '') +
                        (ended && h.result > 0 ? ' paid' : '')
                      }
                    >
                      <div className="bj-hand-meta">
                        <span>
                          {hands.length === 2 ? `${j + 1}번 손 · ` : ''}
                          {beom(h.bet)}
                          {h.bet > g.stake ? ' · 더블' : ''}
                        </span>
                        <b>{blackjackTotalLabel(h.cards, h.split)}</b>
                      </div>
                      <div className="bj-cards">
                        {h.cards.map((c, k) => (
                          <span
                            key={c}
                            className="bj-dealt"
                            style={cardStyle(i, k, hands.length === 2)}
                          >
                            <PokerCard card={c % 52} small />
                          </span>
                        ))}
                      </div>
                      <span
                        className={
                          'bj-outcome ' + (ended ? h.outcome : h.status)
                        }
                      >
                        {ended ? outcomes[h.outcome] : status[h.status]}
                        {ended && <b>{signed(h.result)}</b>}
                      </span>
                      {report && <small className="bj-reason">{report.reason}</small>}
                      {ended && h.result > 0 && (
                        <span className="bj-payout-chip" aria-hidden="true">
                          B
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
      {!ended && (
        <div className={'bj-controls' + (dealerTurn ? ' is-dealer' : '')}>
          <div className="bj-turn">
            <strong>
              {myTurn
                ? '내 차례'
                : dealerTurn
                  ? '딜러 진행 중'
                  : seat < 0
                    ? '관전 중'
                    : `${sir(names[g.turn])} 차례`}
            </strong>
            <span>
              {myTurn
                ? '21을 넘지 않게, 딜러보다 높게.'
                : dealerTurn
                  ? '모든 선택이 끝났어요. 루미가 카드를 받는 동안 기다려 주세요.'
                  : '친구들의 카드와 선택을 함께 볼 수 있어요.'}
            </span>
            {g.phase === 'players' && g.turn >= 0 && (
              <TurnTimer
                deadline={g.turnDeadline}
                total={TURN_LIMIT_MS.blackjack}
                label={
                  away(g.turn)
                    ? AWAY_LABEL
                    : myTurn
                      ? '내 차례'
                      : `${names[g.turn]} 차례`
                }
                mine={myTurn}
              />
            )}
          </div>
          <div className="bj-action-buttons" aria-disabled={!myTurn}>
            <button
              disabled={!g.legal.hit || sent === g.revision}
              onClick={() => act('hit')}
            >
              <Plus size={19} />
              <strong>히트</strong>
              <small>한 장 더</small>
            </button>
            <button
              disabled={!g.legal.stand || sent === g.revision}
              onClick={() => act('stand')}
            >
              <Hand size={19} />
              <strong>스탠드</strong>
              <small>이대로 승부</small>
            </button>
            <button
              disabled={!g.legal.double || sent === g.revision}
              onClick={() => act('double')}
            >
              <ChevronsUp size={19} />
              <strong>더블다운</strong>
              <small>+{beom(hand?.bet ?? g.stake)} · 한 장</small>
            </button>
            <button
              disabled={!g.legal.split || sent === g.revision}
              onClick={() => act('split')}
            >
              <Layers size={19} />
              <strong>스플릿</strong>
              <small>+{beom(g.stake)} · 두 손</small>
            </button>
          </div>
        </div>
      )}
      {ended && (
        <div className="bj-result" aria-live="polite">
          <span>이번 판 끝</span>
          <h3>
            {seat < 0
              ? '테이블 정산 완료'
              : g.result[seat] > 0
                ? '이번 판은 이겼어요!'
                : g.result[seat] < 0
                  ? '이번 판은 아쉽게 졌어요.'
                  : '이번 판의 손익은 0범이에요.'}
          </h3>
          <strong>
            {seat >= 0 ? signed(g.result[seat]) : `${names.length}명 정산 완료`}
          </strong>
          <p className="bj-verdict">{blackjackVerdict(g.dealer)}</p>
          <ul className="bj-report" aria-label="손별 결과">
            {reports.map((r) => (
              <li key={r.seat + ':' + r.hand} className={r.outcome}>
                <b>
                  {r.name}
                  {g.hands[r.seat].length === 2 ? ` ${r.hand + 1}번 손` : ''}
                </b>
                <span>
                  {r.outcome === 'blackjack'
                    ? '블랙잭 · 3:2 승리'
                    : `${r.label} · ${outcomes[r.outcome]}`}
                </span>
                <small>{r.reason}</small>
                <em>{signed(r.amount)}</em>
              </li>
            ))}
          </ul>
          <p>사용하지 않은 예약금과 배당을 각자의 범 지갑에 반영했어요.</p>
        </div>
      )}
      <button
        className="p-rules-toggle"
        onClick={() => setRules(!rules)}
        aria-expanded={rules}
      >
        블랙잭 규칙 · 배당 안내 <ChevronDown size={15} />
      </button>
      {rules && (
        <div className="p-rules bj-rules">
          <p>
            A는 1 또는 11, 그림 카드는 10이에요. 21을 넘으면 즉시 버스트예요.
            딜러가 나중에 버스트해도, 먼저 버스트한 손은 패배해요.
          </p>
          <p>
            일반 승리는 베팅의 1배, 최초 두 장의 내추럴 블랙잭은 3:2(1.5배)를
            순이익으로 받아요. 동점은 푸시예요. 딜러 내추럴은 행동 전에
            확인하며, 서로 내추럴이면 푸시예요.
          </p>
          <p>
            처음 두 장에서는 더블다운할 수 있어요. 같은 값 두 장은 한 번만
            스플릿하고, 나눈 손도 더블다운할 수 있어요. 나눈 A는 한 장씩 받고
            종료하며, 스플릿 후 21은 일반 21이에요. 보험·서렌더는 없어요.
          </p>
          <p>
            6덱(312장)을 매 판 새로 섞어서 나눠요. 그래서 지난 판의 카드가
            다음 판에 영향을 주지 않아요.
          </p>
          <p>
            기본 베팅의 4배를 미리 예약해 스플릿 후 양쪽 더블까지 지원해요.
            미사용 예약금은 종료 시 반환해요. 딜러의 손익은 카지노 장부에
            기록되며 친구의 지갑에서 대신 차감하지 않아요.
          </p>
          <p>
            차례마다 45초 안에 선택하지 않거나 자리를 떠나면 서버가 스탠드해요.
            모두 방을 떠나도 딜러는 끝까지 진행하고 정상 정산해요.
          </p>
        </div>
      )}
    </div>
  );
}
