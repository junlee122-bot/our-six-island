'use client';
/* oxlint-disable next/no-img-element -- GitHub Pages embeds the existing SVG cards without an image server. */
import { useEffect, useState } from 'react';
import { Coins, Crown, Flower2 } from 'lucide-react';
import { LOUNGE_ASSETS } from './lounge-assets';
import { beom } from './lounge-poker-table';
import type { SeotdaAction, SeotdaView } from './lounge-seotda';

function Hwatu({ card }: { card?: string }) {
  const bright = card && ['m01-01', 'm03-01', 'm08-01'].includes(card);
  return (
    <span
      className={'s-card' + (card ? '' : ' back')}
      aria-label={
        card
          ? `${Number(card.slice(1, 3))}월 ${bright ? '광' : card.endsWith('01') ? '열끗' : '띠'}`
          : '비공개 화투'
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
function message(g: SeotdaView, names: string[]) {
  if (g.phase === 'over')
    return `${g.winners.map((i) => names[i]).join(' · ')} 승리! ${g.reason}`;
  if (g.phase === 'redeal') return g.reason;
  if (g.phase === 'showdown')
    return '패를 공개합니다. 두 장에 담긴 승부를 확인하세요.';
  const e = g.events.at(-1),
    who = e && names[e.seat];
  const action =
    e?.kind === 'raise'
      ? `${who}, ${beom(e.amount)} 추가 베팅.`
      : e?.kind === 'call'
        ? `${who}, 콜.`
        : e?.kind === 'fold'
          ? `${who}, 다이.`
          : e?.kind === 'check'
            ? `${who}, 체크.`
            : '두 장씩 나눴습니다.';
  return `${action} ${names[g.turn]} 차례입니다.`;
}
export function SeotdaTable({
  match: g,
  seat,
  names,
  onAction,
}: {
  match: SeotdaView;
  seat: number;
  names: string[];
  onAction: (a: SeotdaAction) => void;
}) {
  const version = `${g.id}:${g.revision}`;
  const [bet, setBet] = useState({ version, value: g.legal.minTo }),
    [sent, setSent] = useState<string | null>(null);
  const raise = bet.version === version ? bet.value : g.legal.minTo;
  const setRaise = (value: number) => setBet({ version, value });
  useEffect(() => {
    if (sent === null) return;
    const timer = setTimeout(() => setSent(null), 2500);
    return () => clearTimeout(timer);
  }, [sent]);
  const legal = g.legal,
    locked = sent === version,
    pot = g.committed.reduce((a, b) => a + b, 0),
    over = g.phase === 'over';
  const act = (a: SeotdaAction) => {
    if (!legal.enabled || locked) return;
    setSent(version);
    onAction(a);
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
            {current
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
      <div className="s-host">
        <span>
          <Flower2 size={25} />
        </span>
        <div>
          <small>호현 화투방 · 두 장 섯다</small>
          <p aria-live="polite">{message(g, names)}</p>
        </div>
        <b>
          {g.round}
          <small>ROUND</small>
        </b>
      </div>
      <div className="s-table">
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
            관전 중 · 친구들의 패는 승부할 때 공개됩니다.
          </p>
        )}
      </div>
      {!over && seat >= 0 && (
        <div className="s-controls">
          <output className="s-turn">
            {locked
              ? '선택을 전달하는 중…'
              : legal.enabled
                ? '당신의 차례예요. 두 장을 믿어볼까요?'
                : g.phase === 'redeal'
                  ? '다이하지 않은 친구들에게 곧 새 패를 나눕니다.'
                  : g.phase === 'showdown'
                    ? '승부를 확인하는 중…'
                    : g.folded[seat]
                      ? '다이했습니다. 남은 친구들의 승부를 기다려요.'
                      : `${names[g.turn] ?? '친구'}의 선택을 기다립니다.`}
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
              {legal.canCheck ? '체크' : '콜'}
              <small>
                {legal.canCheck ? '추가 베팅 없이' : beom(legal.call)}
              </small>
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
              이번 판 베팅 총액
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
          <span>{g.reason} 남은 칩과 판돈을 범 지갑에 반영했어요.</span>
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
          1~10월 화투를 두 장씩, 총 20장 사용합니다. 두 장을 모두 받은 뒤 한
          번의 베팅으로 승부하며, 모두 같은 바이인으로 시작합니다. 처음에
          100범씩 내고 더 잃을 수 있는 한도는 남은 칩만큼입니다.
        </p>
        <div className="s-rank-list">
          <b>38광땡</b>
          <span>가장 높은 족보</span>
          <b>13·18광땡</b>
          <span>실제 광 두 장끼리만 성립</span>
          <b>장땡 → 삥땡</b>
          <span>같은 월 두 장 · 10땡부터 1땡</span>
          <b>알리 · 독사 · 구삥</b>
          <span>1+2 / 1+4 / 1+9</span>
          <b>장삥 · 장사 · 세륙</b>
          <span>1+10 / 4+10 / 4+6</span>
          <b>갑오 → 망통</b>
          <span>두 월을 더한 끝자리 · 9끗부터 0끗</span>
        </div>
        <p>
          <b>암행어사</b>는 4월 열끗+7월 열끗으로, 최고 패가 13·18광땡일 때
          잡습니다. 그 외에는 1끗입니다. <b>땡잡이</b>는 3월 광+7월 열끗으로,
          최고 패가 1~9땡일 때 잡고 그 외에는 망통입니다. 38광땡과 장땡은 잡지
          못합니다.
        </p>
        <p>
          <b>멍텅구리 구사</b>(4월 열끗+9월 열끗)는 최고 패가 9땡 이하일 때,
          다른 <b>구사</b>(4+9)는 알리 이하일 때 재경기합니다. 멍텅구리 구사와
          땡잡이가 함께 나오면 재경기를 우선합니다. 최고 족보가 동률이어도
          재경기합니다.
        </p>
        <p>
          <b>우리 화투방의 재경기:</b> 다이하지 않은 친구 모두가 남은 칩과
          판돈을 유지하고 새 패를 받습니다. 추가 기본금과 다이 복귀는 없으며
          선은 다음 자리로 이동합니다. 남은 칩이 있으면 다시 베팅하고, 모두
          올인했으면 자동으로 패를 열어 승부합니다.
        </p>
        <p>
          체크는 추가 베팅 없이 넘기기, 콜은 앞선 베팅 맞추기, 레이즈는 현재
          최고 베팅보다 최소 직전 인상액(첫 100범)만큼 더 올리기입니다. 올인은
          남은 칩 전부를 겁니다. 다이하면 이미 건 돈은 돌려받지 못합니다.
          수수료는 없습니다.
        </p>
      </details>
    </div>
  );
}
