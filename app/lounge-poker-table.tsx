'use client';
import { useRef, useState, type CSSProperties } from 'react';
import { Bot, ChevronDown, Coins, Crown, Spade } from 'lucide-react';
import {
  POKER_RANKS,
  POKER_SUITS,
  pokerRank,
  type PokerView,
  type PokerAction,
} from './lounge-poker';
import { TURN_LIMIT_MS } from './lounge-games';
import type { TurnTiming } from './lounge-room';
import { AWAY_LABEL, TurnTimer, awaitAnswer } from './lounge-turn-timer';
import { formatBeom, josa } from './lounge-text';
import './lounge-poker-table.css';
export const beom = (amount: number) => formatBeom(amount);
const STREETS = {
  preflop: '프리플롭',
  flop: '플롭',
  turn: '턴',
  river: '리버',
};
const positions = [
  [50, 86],
  [17, 77],
  [11, 32],
  [35, 12],
  [65, 12],
  [89, 32],
  [83, 77],
];
const layouts: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 5],
  4: [0, 2, 4, 5],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};
export function PokerCard({
  card,
  back = false,
  small = false,
}: {
  card?: number;
  back?: boolean;
  small?: boolean;
}) {
  if (back || card === undefined)
    return (
      <span
        className={'p-card p-card-back' + (small ? ' small' : '')}
        aria-label="비공개 카드"
      >
        <Spade size={17} />
      </span>
    );
  const rank = POKER_RANKS[card % 13],
    suit = POKER_SUITS[Math.floor(card / 13)],
    red = [1, 2].includes(Math.floor(card / 13));
  return (
    <span
      className={'p-card' + (red ? ' red' : '') + (small ? ' small' : '')}
      aria-label={rank + suit}
    >
      <span className="p-card-corner">
        {rank}
        <i>{suit}</i>
      </span>
      <span className="p-card-pip">
        {['J', 'Q', 'K'].includes(rank) ? rank : suit}
      </span>
      <span className="p-card-corner lower">
        {rank}
        <i>{suit}</i>
      </span>
    </span>
  );
}
function eventText(g: PokerView, names: string[]) {
  const e = g.events.at(-1),
    who = e && e.seat >= 0 ? names[e.seat] : '친구';
  if (g.phase === 'over')
    return `${g.winners.map((i) => names[i]).join(' · ')}${g.winners.length > 1 ? ' 공동 승리' : ' 승리'}! 범 정산을 마쳤어요.`;
  if (g.phase === 'showdown')
    return '쇼다운! 남은 친구들의 패를 공개하고 팟별로 승자를 가릴게요.';
  if (g.phase === 'dealing')
    return '베팅을 마쳤어요. 다음 커뮤니티 카드를 열게요.';
  if (!e) return '카드를 나눠 드릴게요. 좋은 패가 함께하길!';
  if (e.kind === 'raise')
    return `${who}, ${josa(beom(e.amount), '을/를')} 더 걸었어요. 다음 선택을 기다려요.`;
  if (e.kind === 'call') return `${who}, ${beom(e.amount)} 콜.`;
  if (e.kind === 'fold') return `${who} 폴드. 남은 친구들과 계속할게요.`;
  if (e.kind === 'check') return `${who}, 체크. 다음 친구 차례예요.`;
  return `${josa(STREETS[g.street], '이에요/예요')}. ${names[g.turn] ?? '친구'}의 선택을 기다릴게요.`;
}
export function PokerTable({
  match: g,
  seat,
  names,
  onAction,
}: {
  match: PokerView & TurnTiming;
  seat: number;
  names: string[];
  onAction: (action: PokerAction) => void | Promise<boolean>;
}) {
  const away = (i: number) => !!g.away?.includes(i);
  // Current best hand once the flop is out (the view holds only my cards).
  const myRank =
    seat >= 0 && g.hand.length === 2 && g.board.length >= 3 && !g.folded[seat]
      ? pokerRank([...g.hand, ...g.board]).label
      : '';
  // Pots with identical eligibility read as one pot for the player.
  const contested = g.pots.filter((p) => !p.refund),
    sidePots =
      new Set(contested.map((p) => [...p.eligible].sort((a, b) => a - b).join(','))).size > 1;
  const [raise, setRaise] = useState(g.legal.minTo),
    [rules, setRules] = useState(false),
    [sent, setSent] = useState<number | null>(null),
    inFlight = useRef<number | null>(null);
  // A new revision resets the raise input and the send lock during render
  // (React's "adjust state when a prop changes" pattern, no effect needed).
  const viewKey = `${g.id}:${g.revision}:${g.legal.minTo}`,
    [seenKey, setSeenKey] = useState(viewKey);
  if (seenKey !== viewKey) {
    setSeenKey(viewKey);
    setRaise(g.legal.minTo);
    setSent(null);
  }
  const locked = sent === g.revision,
    legal = g.legal,
    pot = g.committed.reduce((a, b) => a + b, 0),
    act = (a: PokerAction) => {
      // The ref also stops a second tap that lands before React re-renders.
      if (!legal.enabled || locked || inFlight.current === g.revision) return;
      inFlight.current = g.revision;
      setSent(g.revision);
      awaitAnswer(onAction(a), () => {
        inFlight.current = null;
        setSent(null);
      });
    },
    point = (i: number) =>
      positions[
        (layouts[g.stacks.length] ?? layouts[7])[
          (i - (seat < 0 ? 0 : seat) + g.stacks.length) % g.stacks.length
        ]
      ],
    last = g.events.at(-1),
    flying =
      last && ['raise', 'call', 'blind'].includes(last.kind) && last.amount > 0,
    allIn =
      legal.canRaise ||
      (legal.enabled && legal.call > 0 && legal.call === g.stacks[seat]);
  return (
    <div className="p-club">
      <div className="p-dealer">
        <span className="p-dealer-avatar">
          <Bot size={27} />
          <i />
        </span>
        <div>
          <small>
            딜러 루미 <span>자동 진행</span>
          </small>
          <p aria-live="polite">{eventText(g, names)}</p>
        </div>
        <span className="p-table-number">
          테이블
          <br />
          <b>1번</b>
        </span>
      </div>
      <div className="p-table-wrap">
        <div className="p-table-grain" />
        <div className="p-felt">
          <span className="p-felt-brand">
            별빛 카지노<span>노 리밋 · 텍사스 홀덤</span>
          </span>
        </div>
        <div className="p-community">
          <span className="p-street">
            {g.phase === 'over'
              ? '핸드 종료'
              : g.phase === 'showdown'
                ? '쇼다운'
                : STREETS[g.street]}
          </span>
          <div className="p-board">
            {Array.from({ length: 5 }, (_, i) =>
              g.board[i] === undefined ? (
                <span key={'empty' + i} className="p-card-slot">
                  ♠
                </span>
              ) : (
                <PokerCard key={g.board[i]} card={g.board[i]} />
              ),
            )}
          </div>
          <div className="p-pot">
            <Coins size={19} />
            <span>
              {g.phase === 'over' ? '정산한 팟' : '전체 팟'}
              <b>{beom(pot)}</b>
            </span>
          </div>
        </div>
        {g.stacks.map((stack, i) => {
          const [x, y] = point(i),
            self = i === seat,
            revealed = g.revealed.find((p) => p.seat === i),
            cards = self ? g.hand : revealed?.cards,
            winner = g.phase === 'over' && g.winners.includes(i),
            current = g.turn === i;
          return (
            <div
              key={i}
              className={
                'p-seat' +
                (self ? ' self' : '') +
                (current ? ' current' : '') +
                (g.folded[i] ? ' folded' : '') +
                (winner ? ' winner' : '')
              }
              style={{ left: x + '%', top: y + '%' }}
            >
              <div className="p-seat-cards">
                {(cards ?? [undefined, undefined]).map((c, j) => (
                  <PokerCard
                    key={j + ':' + (c ?? 'back')}
                    card={c}
                    back={c === undefined}
                    small={!self}
                  />
                ))}
                {g.folded[i] && <span className="p-fold-stamp">폴드</span>}
              </div>
              <div className="p-seat-label">
                <span className="p-seat-initial">
                  {winner ? <Crown size={15} /> : names[i]?.slice(0, 1)}
                  {i === g.dealer && <i className="p-button-chip">D</i>}
                </span>
                <span>
                  <b>
                    {names[i]}
                    {self ? ' · 나' : ''}
                  </b>
                  <small>
                    {g.phase === 'over'
                      ? (g.result[i] > 0 ? '+' : '') + beom(g.result[i])
                      : beom(stack)}
                  </small>
                </span>
                {stack === 0 && g.phase !== 'over' && !g.folded[i] && (
                  <em>올인</em>
                )}
              </div>
              {away(i) && g.phase !== 'over' && (
                <span className="seat-away">{AWAY_LABEL}</span>
              )}
              {g.bets[i] > 0 && g.phase !== 'over' && (
                <span className="p-seat-bet">
                  <i /> {beom(g.bets[i])}
                </span>
              )}
              {revealed && (
                <span className="p-hand-rank">{revealed.rank.label}</span>
              )}
            </div>
          );
        })}
        {flying && (
          <span
            key={'bet-' + g.revision}
            aria-hidden="true"
            className="p-chip-flight"
            style={
              {
                '--from-x': point(last.seat)[0] + '%',
                '--from-y': point(last.seat)[1] + '%',
              } as CSSProperties
            }
          >
            B
          </span>
        )}
      </div>
      {g.phase === 'over' && (
        <div className="p-settlement" aria-live="polite">
          <strong>
            <Crown size={17} /> 이번 판 정산
          </strong>
          <div>
            {g.stacks.map((_, i) => (
              <span key={i}>
                {names[i]}{' '}
                <b className={g.result[i] > 0 ? 'positive' : ''}>
                  {g.result[i] > 0 ? '+' : ''}
                  {beom(g.result[i])}
                </b>
              </span>
            ))}
          </div>
          {g.pots
            .filter((p) => p.refund)
            .map((p, i) => (
              <small key={i}>
                매칭되지 않은 베팅 {beom(p.amount)} → {names[p.winners[0]]}에게
                반환
              </small>
            ))}
          {sidePots && (
            <small>
              메인 팟과 사이드 팟은 각 팟에 참가한 친구들끼리 따로 정산했어요.
            </small>
          )}
        </div>
      )}
      {g.phase !== 'over' && (
        <div className="p-controls">
          <div className="p-turn-copy">
            <span>
              {seat < 0
                ? '관전 중'
                : legal.enabled
                  ? '내 차례'
                  : '자리에 앉음'}
            </span>
            <strong>
              {seat < 0
                ? '친구들의 플레이를 관전 중'
                : legal.enabled
                  ? '어떻게 플레이할까요?'
                  : g.turn < 0
                    ? '딜러가 다음 순서를 준비해요'
                    : `${names[g.turn]}의 차례`}
            </strong>
            <small>
              블라인드 {beom(g.smallBlind)} / {beom(g.bigBlind)}
              {myRank && ` · 내 패: ${myRank}`}
            </small>
            {g.turn >= 0 && (
              <TurnTimer
                deadline={g.turnDeadline}
                total={TURN_LIMIT_MS.poker}
                label={
                  away(g.turn)
                    ? AWAY_LABEL
                    : g.turn === seat
                      ? '내 차례'
                      : `${names[g.turn]} 차례`
                }
                mine={g.turn === seat}
              />
            )}
          </div>
          {seat >= 0 && (
            <div className="p-actions">
              <div className="p-raise-control">
                <label>
                  레이즈 총액{' '}
                  <input
                    aria-label="레이즈 총액"
                    type="number"
                    min={legal.minTo}
                    max={legal.maxTo}
                    step="1"
                    value={raise || ''}
                    disabled={!legal.canRaise || locked}
                    onChange={(e) => setRaise(Number(e.target.value))}
                  />
                  <span>범</span>
                </label>
                <div>
                  {[
                    { label: '최소', amount: legal.minTo },
                    {
                      label: '½ 팟',
                    amount: g.currentBet + Math.floor((pot + legal.call) / 2),
                    },
                  { label: '팟', amount: g.currentBet + pot + legal.call },
                  ].map((p) => (
                    <button
                      key={p.label}
                      disabled={!legal.canRaise || locked}
                      onClick={() =>
                        setRaise(
                          Math.max(
                            legal.minTo,
                            Math.min(legal.maxTo, p.amount),
                          ),
                        )
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-action-buttons">
                <button
                  className="p-fold"
                  disabled={!legal.enabled || locked}
                  onClick={() => act({ kind: 'fold' })}
                >
                  폴드
                </button>
                <button
                  disabled={!legal.enabled || locked}
                  onClick={() =>
                    act({ kind: legal.canCheck ? 'check' : 'call' })
                  }
                >
                  {!legal.enabled
                    ? '체크/콜'
                    : legal.canCheck
                      ? '체크'
                      : `콜 ${beom(legal.call)}`}
                </button>
                <button
                  className="p-raise"
                  disabled={
                    !legal.canRaise ||
                    locked ||
                    !Number.isInteger(raise) ||
                    raise < legal.minTo ||
                    raise > legal.maxTo
                  }
                  onClick={() => act({ kind: 'raise', to: raise })}
                >
                  레이즈
                </button>
                <button
                  className="p-all-in"
                  disabled={!allIn || locked}
                  onClick={() => act({ kind: 'all-in' })}
                >
                  올인
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <button
        className="p-rules-toggle"
        onClick={() => setRules(!rules)}
        aria-expanded={rules}
      >
        홀덤 규칙 · 범 정산 안내 <ChevronDown size={15} />
      </button>
      {rules && (
        <div className="p-rules">
          <p>
            내 카드 2장과 공개 카드 5장 중 가장 좋은 5장으로 겨뤄요. 프리플롭
            → 플롭 → 턴 → 리버 순서로 베팅하며, 규칙 기반 AI 딜러가 카드 배분과
            승패·사이드 팟을 자동 처리해요.
          </p>
          <p>
            최소 레이즈는 직전의 온전한 레이즈 이상이에요. 부족한 칩의 올인은
            가능하며, 동점은 팟을 나눠요. 상대가 받지 않은 베팅은
            돌려드려요.
          </p>
          <p>
            바이인은 범 지갑에서 예약돼요. 이번 판이 끝나면 남은 칩과 획득한
            팟을 같은 지갑으로 정산해요. 블라인드는 바이인에 맞춰 정해지고
            (빅 블라인드 = 바이인의 1/50, 최소 200범), 딜러 버튼은 판마다 한
            자리씩 돌아가요.
          </p>
          <p>
            차례마다 60초 안에 선택하지 않거나 자리를 떠나면 서버가 체크가
            가능할 때 체크, 그 외에는 폴드해요. 이미 올인했다면 쇼다운까지
            참가해요. 모두 방을 떠나도 판은 끝까지 진행되어 정산돼요.
          </p>
        </div>
      )}
    </div>
  );
}
