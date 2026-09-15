'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { Bot, ChevronDown, Layers, Plus, Hand, ChevronsUp } from 'lucide-react';
import { PokerCard, beom } from './lounge-poker-table';
import {
  blackjackValue,
  type BlackjackView,
  type BlackjackAction,
} from './lounge-blackjack';
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
export function BlackjackTable({
  match: g,
  seat,
  names,
  onAction,
}: {
  match: BlackjackView;
  seat: number;
  names: string[];
  onAction: (action: BlackjackAction) => void;
}) {
  const [rules, setRules] = useState(false),
    [sent, setSent] = useState<number | null>(null);
  useEffect(() => {
    setSent(null);
  }, [g.id, g.revision]);
  useEffect(() => {
    if (sent === null) return;
    const t = setTimeout(() => setSent(null), 2500);
    return () => clearTimeout(t);
  }, [sent]);
  const act = (kind: BlackjackAction['kind']) => {
    if (!g.legal[kind] || sent === g.revision) return;
    setSent(g.revision);
    onAction({ kind });
  };
  const hidden = g.dealer.some((c) => c === null),
    dealerCards = g.dealer.filter((c): c is number => c !== null),
    dealerValue = blackjackValue(dealerCards);
  const ended = g.phase === 'over',
    myTurn = g.legal.enabled,
    hand = g.hands[seat]?.[g.hand];
  const message = ended
    ? '모든 손의 승패와 범 정산을 마쳤어요.'
    : g.phase === 'reveal'
      ? '선택을 마쳤어요. 이제 딜러의 숨긴 카드를 공개합니다.'
      : g.phase === 'dealer'
        ? '딜러는 16 이하에서 히트하고, 소프트 17을 포함한 17 이상에서 멈춥니다.'
        : g.phase === 'settling'
          ? '각 손을 딜러와 비교하고 있어요.'
          : `${names[g.turn]}${g.hands[g.turn]?.length === 2 ? ` · ${g.hand + 1}번 손` : ''}의 차례예요. 히트하거나 스탠드하세요.`;
  return (
    <div className="bj-club">
      <div className="p-dealer bj-announcement">
        <span className="p-dealer-avatar">
          <Bot size={27} />
        </span>
        <div>
          <small>
            AI DEALER · 루미 <span>자동 진행</span>
          </small>
          <p aria-live="polite">{message}</p>
        </div>
        <span className="bj-number">
          TABLE 03
          <br />
          <b>BLACKJACK</b>
        </span>
      </div>
      <div className="bj-felt">
        <div className="bj-table-heading">
          <span>HOHYEON CASINO</span>
          <h2>
            BLACKJACK <i>21</i>
          </h2>
          <p>BLACKJACK PAYS 3 TO 2 · DEALER STANDS ON ALL 17</p>
        </div>
        <div className={'bj-house' + (!hidden ? ' revealed' : '')}>
          <div className="bj-seat-title">
            <strong>딜러 루미</strong>
            <span>
              {hidden
                ? '홀카드 비공개'
                : dealerValue.bust
                  ? '버스트'
                  : `${dealerValue.soft ? '소프트 ' : ''}${dealerValue.total}`}
            </span>
          </div>
          <div className="bj-cards bj-dealer-cards">
            {g.dealer.map((c, i) => (
              <span key={c ?? `hidden-${i}`} className="bj-dealt">
                <PokerCard
                  card={c === null ? undefined : c % 52}
                  back={c === null}
                />
              </span>
            ))}
          </div>
        </div>
        <div className="bj-table-rule">
          기본 베팅 <b>{beom(g.stake)}</b>
          <span>6 DECKS · DOUBLE · SPLIT</span>
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
                    : g.turn === i
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
                  const v = blackjackValue(h.cards);
                  return (
                    <div
                      key={j}
                      className={
                        'bj-hand' +
                        (g.turn === i && g.hand === j ? ' current' : '')
                      }
                    >
                      <div className="bj-hand-meta">
                        <span>
                          {hands.length === 2 ? `${j + 1}번 손 · ` : ''}
                          {beom(h.bet)}
                        </span>
                        <b>
                          {v.soft ? 'A · ' : ''}
                          {v.total}
                        </b>
                      </div>
                      <div className="bj-cards">
                        {h.cards.map((c) => (
                          <span key={c} className="bj-dealt">
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
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
      {!ended && (
        <div className="bj-controls">
          <div className="bj-turn">
            <strong>
              {myTurn
                ? '내 차례'
                : seat < 0
                  ? '관전 중'
                  : g.phase === 'players'
                    ? `${names[g.turn]}의 차례`
                    : '딜러 진행 중'}
            </strong>
            <span>
              {myTurn
                ? '21을 넘지 않게, 딜러보다 높게.'
                : '친구들의 카드와 선택을 함께 볼 수 있어요.'}
            </span>
          </div>
          <div className="bj-action-buttons">
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
          <span>ROUND COMPLETE</span>
          <h3>
            {seat < 0
              ? '테이블 정산 완료'
              : g.result[seat] > 0
                ? '좋은 패였어요!'
                : g.result[seat] < 0
                  ? '다음 판을 기약해요.'
                  : '이번 판의 손익은 0범이에요.'}
          </h3>
          <strong>
            {seat >= 0 ? signed(g.result[seat]) : `${names.length}명 정산 완료`}
          </strong>
          <p>사용하지 않은 예약금과 배당을 공통 범 지갑에 반영했습니다.</p>
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
            A는 1 또는 11, 그림 카드는 10입니다. 21을 넘으면 즉시 버스트. 딜러도
            버스트해도 먼저 버스트한 손은 패배합니다.
          </p>
          <p>
            일반 승리는 베팅의 1배, 최초 두 장의 내추럴 블랙잭은 1.5배를
            순이익으로 받습니다. 동점은 푸시입니다. 딜러 내추럴은 행동 전에
            확인하며, 서로 내추럴이면 푸시입니다.
          </p>
          <p>
            처음 두 장에서는 더블다운할 수 있습니다. 같은 값 두 장은 한 번만
            스플릿하고, 나눈 손도 더블다운할 수 있습니다. 나눈 A는 한 장씩 받고
            종료하며, 스플릿 후 21은 일반 21입니다. 보험·서렌더는 없습니다.
          </p>
          <p>
            기본 베팅의 4배를 미리 예약해 스플릿 후 양쪽 더블까지 지원합니다.
            미사용 예약금은 종료 시 반환합니다. 나가면 남은 손은 자동 스탠드하고
            정상 정산합니다. 딜러의 손익은 카지노 장부에 기록되며 친구의
            지갑에서 대신 차감하지 않습니다.
          </p>
          <p>
            방장이 규칙과 지갑 저장을 담당합니다. 방장이 종료한 미완료판은 다음
            방을 열 때 반환합니다.
          </p>
        </div>
      )}
    </div>
  );
}
