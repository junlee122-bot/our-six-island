'use client';
/* oxlint-disable next/no-img-element -- GitHub Pages embeds the existing SVG cards without an image server. */
import { useId, useRef, useState } from 'react';
import { BookOpen, Coins, Crown, Flower2, X } from 'lucide-react';
import { LOUNGE_ASSETS } from './lounge-assets';
import { beom } from './lounge-poker-table';
import type { SeotdaAction, SeotdaView } from './lounge-seotda';
import { HWATU_CARDS } from './hwatu-cards';
import { SEOTDA_CHART, seotdaChartRow } from './lounge-seotda-chart';
import { TURN_LIMIT_MS } from './lounge-games';
import type { TurnTiming } from './lounge-room';
import { AWAY_LABEL, TurnTimer, awaitAnswer } from './lounge-turn-timer';
import { seotdaLine, type TableReaction } from './lounge-dealer-lines';
import { DealerHost, useReactionReply } from './lounge-dealer-host';
import './lounge-seotda-table.css';

const TYPE_LABEL: Record<string, string> = {
  bright: '광',
  animal: '열끗',
  ribbon: '띠',
  junk: '피',
};
// Label from the card metadata: 8월 기러기(m08-02) is 열끗, not 띠.
const cardType = (card: string) =>
  TYPE_LABEL[HWATU_CARDS.find((c) => c.id === card)?.type ?? ''] ?? '';
function Hwatu({ card }: { card?: string }) {
  const bright = card && ['m01-01', 'm03-01', 'm08-01'].includes(card);
  return (
    <span
      className={'s-card' + (card ? '' : ' back')}
      aria-label={
        card ? `${Number(card.slice(1, 3))}월 ${cardType(card)}` : '비공개 화투'
      }
    >
      {card ? (
        <>
          <img src={LOUNGE_ASSETS[card as keyof typeof LOUNGE_ASSETS]} alt="" />
          <small>
            {Number(card.slice(1, 3))}월{bright ? ' · 光' : ''}
          </small>
        </>
      ) : (
        <Flower2 size={22} />
      )}
    </span>
  );
}
/** 족보표: every rank from the top with its cards; my current hand is marked. */
function SeotdaChart({
  id,
  mine,
  onClose,
}: {
  id: string;
  mine: string | null;
  onClose: () => void;
}) {
  const row = mine ? seotdaChartRow(mine) : undefined;
  const list = (special: boolean) =>
    SEOTDA_CHART.filter((r) => !!r.special === special).map((r) => (
      <li
        key={r.id}
        className={r.id === row?.id ? 'mine' : undefined}
        aria-current={r.id === row?.id ? 'true' : undefined}
        data-testid={`seotda-chart-${r.id}`}
      >
        <span className="s-chart-cards" aria-hidden="true">
          {r.cards.map((c) => (
            <img key={c} src={LOUNGE_ASSETS[c as keyof typeof LOUNGE_ASSETS]} alt="" />
          ))}
        </span>
        <span className="s-chart-text">
          <b>
            {r.name}
            {r.id === row?.id && <em>내 패</em>}
          </b>
          <small>{r.note}</small>
        </span>
      </li>
    ));
  return (
    <aside id={id} className="s-chart" aria-label="섯다 족보표" data-testid="seotda-chart">
      <header>
        <strong>족보표</strong>
        <span>위에서부터 높은 패예요</span>
        <button type="button" onClick={onClose} aria-label="족보표 닫기">
          <X size={16} />
        </button>
      </header>
      <ol className="s-chart-ranks">{list(false)}</ol>
      <h4>특수 족보</h4>
      <ul className="s-chart-special">{list(true)}</ul>
    </aside>
  );
}
export function SeotdaTable({
  match: g,
  seat,
  names,
  onAction,
  reaction,
}: {
  match: SeotdaView & TurnTiming;
  seat: number;
  names: string[];
  onAction: (a: SeotdaAction) => void | Promise<boolean>;
  /** Table round (unused by 섯다's host; accepted like the casino tables). */
  round?: number;
  /** Newest sticker at this table, for the host's reply. */
  reaction?: TableReaction | null;
}) {
  const aside = useReactionReply(g.id, reaction, names);
  const version = `${g.id}:${g.revision}`;
  const [bet, setBet] = useState({ version, value: g.legal.minTo }),
    [sent, setSent] = useState<string | null>(null),
    inFlight = useRef<string | null>(null);
  const [chartOpen, setChartOpen] = useState(false),
    chartId = useId();
  const raise = bet.version === version ? bet.value : g.legal.minTo;
  const setRaise = (value: number) => setBet({ version, value });
  const legal = g.legal,
    locked = sent === version,
    pot = g.committed.reduce((a, b) => a + b, 0),
    over = g.phase === 'over';
  const act = (a: SeotdaAction) => {
    // The ref also stops a second tap that lands before React re-renders.
    if (!legal.enabled || locked || inFlight.current === version) return;
    inFlight.current = version;
    setSent(version);
    awaitAnswer(onAction(a), () => {
      inFlight.current = null;
      setSent(null);
    });
  };
  const allIn =
    legal.canRaise ||
    (legal.enabled && legal.call > 0 && legal.call === g.stacks[seat]);
  const preset = (fraction: number) =>
    setRaise(
      Math.max(
        legal.minTo,
        Math.min(
          legal.maxTo,
          g.currentBet + Math.floor((pot + legal.call) * fraction),
        ),
      ),
    );
  const away = (i: number) => !!g.away?.includes(i);
  // 내 패: my two cards' rank and where it sits on the chart.
  const myRank = seat >= 0 && g.hand.length === 2 ? (g.rank?.label ?? null) : null,
    myRow = myRank ? seotdaChartRow(myRank) : undefined,
    myPlace = myRow
      ? myRow.special
        ? '특수 족보'
        : `위에서 ${SEOTDA_CHART.indexOf(myRow) + 1}번째`
      : '';
  const player = (i: number, self = false) => {
    const opened = g.revealed.find((h) => h.seat === i),
      cards = self ? g.hand : opened?.cards,
      rank = self ? g.rank : opened?.rank;
    const current = g.turn === i && g.phase === 'betting',
      winner = over && g.winners.includes(i),
      folded = g.folded[i];
    return (
      <article
        key={i}
        className={
          's-seat' +
          (self ? ' self' : '') +
          (current ? ' current' : '') +
          (folded ? ' folded' : '') +
          (winner ? ' winner' : '')
        }
        aria-label={`${names[i]}${self ? ' 내 자리' : ''}`}
      >
        <div className="s-seat-name">
          <strong>
            {winner && <Crown size={14} />} {names[i]}
            {self && <em>나</em>}
          </strong>
          <span>
            {away(i) && !over && !folded
              ? AWAY_LABEL
              : current
              ? '선택 중'
              : folded
                ? '다이'
                : g.stacks[i] === 0 && !over
                  ? '올인'
                  : i === g.first
                    ? '선'
                    : '참가'}
          </span>
        </div>
        <div className="s-hand" key={`${g.id}:${g.round}:${i}`}>
          {(cards?.length
            ? cards
            : Array.from({ length: g.handCounts[i] }, () => undefined)
          ).map((c, j) => (
            <Hwatu key={j + ':' + (c ?? 'back')} card={c} />
          ))}
          {!g.handCounts[i] && (
            <span className="s-out">이번 승부를 지켜보세요</span>
          )}
        </div>
        <b className="s-rank">{folded ? '다이' : (rank?.label ?? '비공개')}</b>
        <div className="s-seat-money">
          <strong>{beom(g.stacks[i])}</strong>
          <small>
            {over
              ? `${g.result[i] >= 0 ? '+' : ''}${beom(g.result[i])}`
              : `건 돈 ${beom(g.committed[i])}`}
          </small>
        </div>
      </article>
    );
  };
  return (
    <div className="s-club">
      <DealerHost
        host="maehwa"
        line={seotdaLine(g, seat, names)}
        aside={aside}
        className="s-host"
        side={
          <div className="s-chart-bar">
            {
              // g.round counts redeals within this 판 (the header shows the 판 number).
              g.round > 1 && (
                <b className="s-rematch">
                  {g.round - 1}
                  <small>재경기</small>
                </b>
              )
            }
            {myRank && (
              <span className="s-my-rank" data-testid="seotda-my-rank">
                내 패: <b>{myRank}</b>
                <small>{myPlace}</small>
              </span>
            )}
            <button
              type="button"
              className="s-chart-toggle"
              aria-expanded={chartOpen}
              aria-controls={chartId}
              onClick={() => setChartOpen((open) => !open)}
              data-testid="seotda-chart-toggle"
            >
              <BookOpen size={15} /> 족보 {chartOpen ? '닫기' : '보기'}
            </button>
          </div>
        }
      >
        {g.phase === 'betting' && g.turn >= 0 && (
          <TurnTimer
            deadline={g.turnDeadline}
            total={TURN_LIMIT_MS.seotda}
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
      </DealerHost>
      <div className="s-table">
        {chartOpen && (
          <SeotdaChart id={chartId} mine={myRank} onClose={() => setChartOpen(false)} />
        )}
        <div
          className="s-opponents"
          style={{
            gridTemplateColumns: `repeat(${Math.min(3, g.stacks.length - (seat >= 0 ? 1 : 0))},minmax(0,1fr))`,
          }}
        >
          {g.stacks.map((_, i) => (i === seat ? null : player(i)))}
        </div>
        <div className="s-pot" key={`${g.revision}:${pot}`}>
          <Coins size={24} />
          <div>
            <small>{over ? '정산한 판돈' : '모인 판돈'}</small>
            <strong>{beom(pot)}</strong>
          </div>
          <span>
            {g.phase === 'redeal'
              ? '판돈 그대로, 다시 두 장'
              : g.round > 1
                ? `재경기 ${g.round - 1}회 · 추가 기본금 없음`
                : '기본금 100범 · 바이인 한도'}
          </span>
        </div>
        {seat >= 0 ? (
          player(seat, true)
        ) : (
          <p className="s-spectator">
            관전 중 · 친구들의 패는 승부할 때 공개돼요.
          </p>
        )}
      </div>
      {!over && seat >= 0 && (
        <div className="s-controls">
          <output className="s-turn">
            {locked
              ? '선택을 전달하는 중…'
              : legal.enabled
                ? '내 차례예요. 두 장을 믿어 볼까요?'
                : g.phase === 'redeal'
                  ? '다이하지 않은 친구들에게 곧 새 패를 나눠요.'
                  : g.phase === 'showdown'
                    ? '승부를 확인하는 중…'
                    : g.folded[seat]
                      ? '다이했어요. 남은 친구들의 승부를 기다려요.'
                      : `${names[g.turn] ?? '친구'}의 선택을 기다려요.`}
          </output>
          <div className="s-action-row">
            <button
              className="s-fold"
              disabled={!legal.enabled || locked}
              onClick={() => act({ kind: 'fold' })}
            >
              다이
            </button>
            <button
              className="s-call"
              disabled={!legal.enabled || locked}
              onClick={() => act({ kind: legal.canCheck ? 'check' : 'call' })}
            >
              {!legal.enabled ? '체크/콜' : legal.canCheck ? '체크' : '콜'}
              {legal.enabled && (
                <small>
                  {legal.canCheck ? '추가 베팅 없이' : beom(legal.call)}
                </small>
              )}
            </button>
            <button
              disabled={!allIn || locked}
              onClick={() => act({ kind: 'all-in' })}
            >
              올인<small>{seat >= 0 ? beom(g.stacks[seat]) : ''}</small>
            </button>
          </div>
          <div className="s-raise-row">
            <label>
              이번 베팅 라운드 총액
              <input
                aria-label="섯다 레이즈 총액"
                type="number"
                min={legal.minTo}
                max={legal.maxTo}
                step="1"
                value={raise}
                disabled={!legal.canRaise || locked}
                onChange={(e) => setRaise(Number(e.target.value))}
              />
            </label>
            <button
              disabled={!legal.canRaise || locked}
              onClick={() => preset(0.5)}
            >
              하프
            </button>
            <button
              disabled={!legal.canRaise || locked}
              onClick={() => preset(1)}
            >
              팟
            </button>
            <button
              className="s-raise"
              disabled={
                !legal.canRaise ||
                locked ||
                !Number.isSafeInteger(raise) ||
                raise < legal.minTo ||
                raise > legal.maxTo
              }
              onClick={() => act({ kind: 'raise', to: raise })}
            >
              레이즈
            </button>
          </div>
          {legal.canRaise && (
            <small className="s-raise-help">
              총액 {beom(legal.minTo)}~{beom(legal.maxTo)} · 하프는 콜한 뒤
              판돈의 절반만큼 올려요.
            </small>
          )}
        </div>
      )}
      {over && (
        <output className="s-result">
          <Crown size={24} />
          <strong>{g.winners.map((i) => names[i]).join(' · ')}의 승리</strong>
          {/* The hand that won is said once, in 매화's line above the table. */}
          <span>남은 칩과 판돈을 범 지갑에 반영했어요.</span>
        </output>
      )}
      {g.previous && (
        <details className="s-history">
          <summary>재경기 기록 · {g.previous.round}번째 패 보기</summary>
          <p>{g.previous.reason}</p>
          <div>
            {g.previous.hands.map((h) => (
              <section key={h.seat}>
                <b>
                  {names[h.seat]} · {h.rank.label}
                </b>
                <div className="s-hand">
                  {h.cards.map((c) => (
                    <Hwatu key={c} card={c} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </details>
      )}
      <details className="s-rules">
        <summary>족보와 이 테이블의 규칙</summary>
        <p>
          1~10월 화투를 두 장씩, 총 20장 사용해요. 두 장을 모두 받은 뒤 한
          번의 베팅으로 승부하며, 모두 같은 바이인으로 시작해요. 처음에
          100범씩 내고 더 잃을 수 있는 한도는 남은 칩만큼이에요.
        </p>
        <p>
          족보는 위쪽의 <b>족보 보기</b>에서 화투 그림과 함께 높은 순서대로 볼
          수 있어요.
        </p>
        <p>
          <b>암행어사</b>는 4월 열끗+7월 열끗으로, 최고 패가 13·18광땡일 때
          잡아요. 그 외에는 1끗이에요. <b>땡잡이</b>는 3월 광+7월 열끗으로,
          최고 패가 1~9땡일 때 잡고 그 외에는 망통이에요. 38광땡과 장땡은 잡지
          못해요.
        </p>
        <p>
          <b>멍텅구리 구사</b>(4월 열끗+9월 열끗)는 최고 패가 9땡 이하일 때,
          다른 <b>구사</b>(4+9)는 알리 이하일 때 재경기해요. 멍텅구리 구사와
          땡잡이가 함께 나오면 재경기를 우선해요. 최고 족보가 동률이어도
          재경기해요.
        </p>
        <p>
          <b>우리 화투방의 재경기:</b> 다이하지 않은 친구 모두가 남은 칩과
          판돈을 유지하고 새 패를 받아요. 추가 기본금과 다이 복귀는 없으며
          선은 다음 자리로 이동해요. 남은 칩이 있으면 다시 베팅하고, 모두
          올인했으면 자동으로 패를 열어 승부해요.
        </p>
        <p>
          차례마다 60초 안에 선택하지 않거나 자리를 떠나면 서버가 체크가
          가능할 때 체크, 그 외에는 다이해요. 선은 판마다 한 자리씩
          돌아가요. 체크는 추가 베팅 없이 넘기기, 콜은 앞선 베팅 맞추기, 레이즈는 현재
          최고 베팅보다 최소 직전 인상액(첫 100범)만큼 더 올리기예요. 올인은
          남은 칩 전부를 걸어요. 다이하면 이미 건 돈은 돌려받지 못해요.
          수수료는 없어요.
        </p>
      </details>
    </div>
  );
}
