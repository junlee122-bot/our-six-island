'use client';
// 야추 table (friends only, no dealer): a felt dice tray with five 3D-ish CSS
// dice, the shared score sheet with what my dice would score, and the result.
// Keys: Space 굴리기 · 1–5 주사위 킵 · ↑↓ 칸 고르기 · Enter 적기.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Crown, Dices, Lock } from 'lucide-react';
import {
  YACHT_BONUS,
  YACHT_BONUS_AT,
  YACHT_CATEGORIES,
  YACHT_HINT,
  YACHT_LABEL,
  YACHT_ROLLS,
  YACHT_ROUNDS,
  yachtBest,
  yachtTotals,
  type YachtAction,
  type YachtCategory,
  type YachtView,
} from './lounge-yacht';
import { TURN_LIMIT_MS } from './lounge-games';
import type { TurnTiming } from './lounge-room';
import { AWAY_LABEL, TurnTimer, awaitAnswer } from './lounge-turn-timer';
import { FriendHost } from './lounge-friend-host';
import { SeatPortrait, type SeatFigure } from './lounge-dealer-host';
import { loungeAudio } from './lounge-audio';
import { formatBeom, josa } from './lounge-text';
import './lounge-yacht-table.css';

/** Pip positions (3×3 grid cells) of each face. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
/** Cube rotation that brings each value to the front. */
const FACE_TURN: Record<number, string> = {
  1: 'rotateX(0deg) rotateY(0deg)',
  2: 'rotateY(-90deg)',
  3: 'rotateX(-90deg)',
  4: 'rotateX(90deg)',
  5: 'rotateY(90deg)',
  6: 'rotateY(180deg)',
};
function Face({ value, side }: { value: number; side: string }) {
  return (
    <span className={'yd-face yd-' + side} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className={PIPS[value].includes(i) ? 'on' : ''} />
      ))}
    </span>
  );
}
export function Die({
  value,
  rolling,
  held,
  spin,
}: {
  value: number;
  rolling: boolean;
  held: boolean;
  /** Changes on every throw so the tumble replays. */
  spin: number;
}) {
  const shown = value >= 1 && value <= 6 ? value : 1;
  return (
    <span
      className={'yd-cube' + (rolling ? ' is-rolling' : '') + (held ? ' is-held' : '') + (value ? '' : ' is-blank')}
      key={rolling ? spin : 'still'}
      style={{ '--turn': FACE_TURN[shown] } as CSSProperties}
    >
      <Face value={1} side="front" />
      <Face value={6} side="back" />
      <Face value={2} side="right" />
      <Face value={5} side="left" />
      <Face value={3} side="top" />
      <Face value={4} side="bottom" />
    </span>
  );
}

export function YachtTable({
  match: g,
  seat,
  names,
  figures = [],
  onAction,
}: {
  match: YachtView & TurnTiming;
  seat: number;
  names: string[];
  figures?: SeatFigure[];
  onAction: (a: YachtAction) => void | Promise<boolean>;
  round?: number;
  reaction?: unknown;
}) {
  const over = g.phase === 'over';
  const mine = g.legal.enabled;
  const holdKey = `${g.id}:${g.turn}:${g.rolls}`;
  const [hold, setHold] = useState({ key: holdKey, held: g.held });
  const held = hold.key === holdKey ? hold.held : g.rolls ? g.held : [false, false, false, false, false];
  const setHeld = (next: boolean[]) => setHold({ key: holdKey, held: next });
  const version = `${g.id}:${g.revision}`;
  const [sent, setSent] = useState<string | null>(null);
  const inFlight = useRef<string | null>(null);
  const locked = sent === version;
  const open = YACHT_CATEGORIES.filter((_, i) => seat >= 0 && g.sheet[seat]?.[i] === null);
  const best = mine && g.rolls > 0 && seat >= 0 ? yachtBest(g.dice, g.sheet[seat]) : null;
  const [cursor, setCursor] = useState<{ key: string; cat: YachtCategory | null }>({ key: '', cat: null });
  const cat = cursor.key === holdKey && cursor.cat && open.includes(cursor.cat) ? cursor.cat : best;
  const act = (a: YachtAction) => {
    if (!mine || locked || inFlight.current === version) return;
    inFlight.current = version;
    setSent(version);
    awaitAnswer(onAction(a), () => {
      inFlight.current = null;
      setSent(null);
    });
  };
  const roll = () => {
    if (!g.legal.canRoll || locked) return;
    if (g.rolls > 0 && held.every(Boolean)) return;
    loungeAudio.sample('dice-shake', undefined, 0.7);
    act({ kind: 'roll', held });
  };
  const write = (c: YachtCategory | null) => {
    if (!c || !g.legal.canScore || !open.includes(c)) return;
    act({ kind: 'score', category: c });
  };
  const toggle = (i: number) => {
    if (!mine || g.rolls === 0 || g.rolls >= YACHT_ROLLS) return;
    loungeAudio.sample('dice-grab', () => loungeAudio.table('flip', 1), 0.8);
    setHeld(held.map((h, j) => (j === i ? !h : h)));
  };
  // Dice sounds: each throw rattles (one die for 당근), a written score clicks.
  const lastRoll = useRef(g.rollCount);
  const one = g.held.filter((h) => !h).length === 1 && g.rolls > 0;
  useEffect(() => {
    if (g.rollCount > lastRoll.current)
      loungeAudio.sample(one ? 'die-throw' : 'dice-throw', () => loungeAudio.table('flip', 3, 0.05));
    lastRoll.current = g.rollCount;
  }, [g.rollCount, one]);
  const lastWrite = useRef(g.log.length);
  useEffect(() => {
    if (g.log.length > lastWrite.current && g.last) loungeAudio.sample('confirm');
    lastWrite.current = g.log.length;
  }, [g.log.length, g.last]);
  // Keys (not while typing or in a dialog).
  const keys = useRef<(e: KeyboardEvent) => boolean>(() => false);
  useEffect(() => {
    keys.current = (e) => {
      if (!mine) return false;
      if (e.code === 'Space') {
        roll();
        return true;
      }
      const digit = /^Digit([1-5])$/.exec(e.code)?.[1];
      if (digit) {
        toggle(Number(digit) - 1);
        return true;
      }
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && g.rolls > 0 && open.length) {
        const i = cat ? open.indexOf(cat) : -1;
        const next = open[(i + (e.key === 'ArrowDown' ? 1 : -1) + open.length) % open.length];
        setCursor({ key: holdKey, cat: next });
        loungeAudio.sample('select');
        return true;
      }
      if (e.key === 'Enter' && g.rolls > 0) {
        write(cat);
        return true;
      }
      return false;
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (document.querySelector('dialog[open], .l-coach')) return;
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      // Enter / Space on a focused button press that button instead.
      if ((e.key === 'Enter' || e.code === 'Space') && t?.closest?.('button')) return;
      if (keys.current(e)) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const away = (i: number) => !!g.away?.includes(i);
  const turnName = g.turn >= 0 ? names[g.turn] : '';
  const totals = g.sheet.map((row) => yachtTotals(row));
  const ranking = totals
    .map((t, i) => ({ seat: i, total: t.total }))
    .sort((a, b) => b.total - a.total || a.seat - b.seat);
  // The 진행 line.
  const line = over
    ? g.winners.length > 1
      ? `${g.winners.map((w) => names[w]).join('·')} 님이 ${totals[g.winners[0]].total}점으로 함께 1등이에요!`
      : `${josa(names[g.winners[0]] ?? '', '이/가')} ${totals[g.winners[0]]?.total ?? 0}점으로 이겼어요! 🎉`
    : mine
      ? g.rolls === 0
        ? '내 차례예요! Space(또는 굴리기)로 주사위 다섯 개를 굴려요.'
        : g.rolls < YACHT_ROLLS
          ? `${g.rolls}번째 굴림 · 남길 주사위를 1–5로 고르고 다시 굴리거나, 칸을 골라 적어요.`
          : '마지막 굴림이에요. ↑↓로 칸을 고르고 Enter로 적어요.'
      : away(g.turn)
        ? `${turnName} 님은 ${AWAY_LABEL}이에요.`
        : g.rolls === 0
          ? `${turnName} 님 차례예요. 주사위를 굴리길 기다려요.`
          : `${turnName} 님이 ${g.rolls}번째로 굴렸어요.`;
  const aside = g.last
    ? `${names[g.last.seat]} 님이 ${YACHT_LABEL[g.last.category]}에 ${g.last.points}점을 적었어요.`
    : undefined;
  const lastRolled = g.dice.map((_, i) => !g.held[i]);
  return (
    <div className="y-club" data-testid="yacht-table" data-phase={g.phase} data-my-turn={mine || undefined}>
      <FriendHost
        symbol="⚄"
        game="야추"
        line={line}
        aside={aside}
        tone={over ? 'win' : mine ? 'turn' : 'calm'}
        side={
          <div className="y-host-side">
            <span className="y-round">
              <small>라운드</small>
              <b>
                {g.round}/{YACHT_ROUNDS}
              </b>
            </span>
            {!over && g.turn >= 0 && (
              <TurnTimer
                deadline={g.turnDeadline}
                total={TURN_LIMIT_MS.yacht}
                label={mine ? '내 차례' : `${turnName} 차례`}
                mine={mine}
              />
            )}
          </div>
        }
      />
      <div className="y-layout">
        <section className="y-tray-wrap" aria-label="주사위">
          <ol className="y-players" aria-label="자리">
            {names.map((n, i) => (
              <li
                key={i}
                className={(g.turn === i ? 'is-turn ' : '') + (over && g.winners.includes(i) ? 'is-winner ' : '') + (i === seat ? 'is-me' : '')}
              >
                <SeatPortrait figure={figures[i]} name={n} />
                <span>
                  <strong>
                    {over && g.winners.includes(i) && <Crown size={13} aria-label="1등" />} {n}
                    {i === seat && <em>나</em>}
                  </strong>
                  <small>{away(i) && !over ? '자리 비움' : g.turn === i ? '굴리는 중' : `${totals[i].total}점`}</small>
                </span>
                <b>{totals[i].total}</b>
              </li>
            ))}
          </ol>
          <div className={'y-tray' + (mine ? ' is-mine' : '')}>
            <div className="y-dice" role="group" aria-label="주사위 다섯 개">
              {g.dice.map((d, i) => {
                const keep = mine ? held[i] : g.held[i] && g.rolls > 1;
                return (
                  <button
                    key={i}
                    type="button"
                    className={'y-die' + (keep ? ' is-held' : '')}
                    onClick={() => toggle(i)}
                    disabled={!mine || g.rolls === 0 || g.rolls >= YACHT_ROLLS || locked}
                    aria-pressed={mine ? held[i] : undefined}
                    aria-label={`주사위 ${i + 1}: ${d || '아직 안 굴림'}${keep ? ' · 킵' : ''}`}
                    aria-keyshortcuts={String(i + 1)}
                    data-value={d}
                  >
                    <Die value={d} rolling={d > 0 && lastRolled[i]} held={keep} spin={g.rollCount} />
                    <span className="y-die-key" aria-hidden="true">
                      {keep ? (
                        <>
                          <Lock size={11} /> 킵
                        </>
                      ) : (
                        i + 1
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="y-rolls" aria-label={`굴림 ${g.rolls}/${YACHT_ROLLS}`}>
              {Array.from({ length: YACHT_ROLLS }, (_, i) => (
                <i key={i} className={i < g.rolls ? 'used' : ''} />
              ))}
              <small>
                {over ? '게임 끝' : g.rolls === 0 ? '아직 안 굴렸어요' : `${g.rolls}/${YACHT_ROLLS}번 굴림`}
              </small>
            </div>
            {mine && (
              <div className="y-actions">
                <button
                  type="button"
                  className="l-primary y-roll"
                  onClick={roll}
                  disabled={!g.legal.canRoll || locked || (g.rolls > 0 && held.every(Boolean))}
                  aria-keyshortcuts="Space"
                  data-testid="yacht-roll"
                >
                  <Dices size={18} aria-hidden="true" />
                  {g.rolls === 0 ? '굴리기' : g.rolls < YACHT_ROLLS ? '다시 굴리기' : '굴림 끝'}
                  <kbd>Space</kbd>
                </button>
                <button
                  type="button"
                  className="l-secondary"
                  onClick={() => write(cat)}
                  disabled={!g.legal.canScore || !cat || locked}
                  data-testid="yacht-write"
                >
                  {cat ? `${YACHT_LABEL[cat]}에 ${g.potential[cat] ?? 0}점 적기` : '칸을 골라요'}
                  <kbd>Enter</kbd>
                </button>
              </div>
            )}
            {over && (
              <div className="y-result" data-testid="yacht-result">
                <h3>
                  <Crown size={18} aria-hidden="true" /> 최종 결과
                </h3>
                <ol>
                  {ranking.map((r, place) => (
                    <li key={r.seat} className={g.winners.includes(r.seat) ? 'is-winner' : ''}>
                      <span>{g.winners.includes(r.seat) ? '1' : place + 1}위</span>
                      <strong>{names[r.seat]}</strong>
                      <b>{r.total}점</b>
                      <em>
                        {g.stake > 0
                          ? `${g.result[r.seat] > 0 ? '+' : ''}${formatBeom(g.result[r.seat])}`
                          : totals[r.seat].bonus
                            ? `보너스 +${YACHT_BONUS}`
                            : ''}
                      </em>
                    </li>
                  ))}
                </ol>
                <p>{g.stake > 0 ? `판돈 ${formatBeom(g.stake)} × ${g.n}명 · 1등이 가져가요.` : '파티 판 · 범은 오가지 않았어요.'}</p>
              </div>
            )}
          </div>
          <p className="y-keys" aria-hidden="true">
            Space 굴리기 · 1–5 킵 · ↑↓ 칸 고르기 · Enter 적기
          </p>
        </section>
        <section className="y-sheet-wrap" aria-label="점수표">
          <table className="y-sheet" data-testid="yacht-sheet">
            <thead>
              <tr>
                <th scope="col">칸</th>
                {names.map((n, i) => (
                  <th key={i} scope="col" className={(g.turn === i ? 'is-turn ' : '') + (i === seat ? 'is-me' : '')}>
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {YACHT_CATEGORIES.map((c, ci) => {
                const pickable = mine && g.rolls > 0 && open.includes(c);
                const bonusRow = ci === 6;
                return [
                  bonusRow ? (
                    <tr key="bonus" className="y-bonus-row">
                      <th scope="row">
                        보너스
                        <small>1–6 합 {YACHT_BONUS_AT}↑ → +{YACHT_BONUS}</small>
                      </th>
                      {totals.map((t, i) => (
                        <td key={i} className={t.bonus ? 'got' : ''}>
                          {t.bonus ? `+${t.bonus}` : `${t.upper}/${YACHT_BONUS_AT}`}
                        </td>
                      ))}
                    </tr>
                  ) : null,
                  <tr
                    key={c}
                    className={(cat === c && pickable ? 'is-cursor ' : '') + (pickable ? 'is-pickable' : '')}
                    onClick={pickable ? () => write(c) : undefined}
                    data-cat={c}
                  >
                    <th scope="row" title={YACHT_HINT[c]}>
                      {YACHT_LABEL[c]}
                      <small>{YACHT_HINT[c]}</small>
                    </th>
                    {g.sheet.map((row, i) => {
                      const v = row[ci];
                      const potential = i === g.turn && v === null ? g.potential[c] : undefined;
                      return (
                        <td
                          key={i}
                          className={
                            (v !== null ? 'filled ' : '') +
                            (potential !== undefined ? 'potential ' : '') +
                            (potential === 0 ? 'zero ' : '') +
                            (g.last && g.last.seat === i && g.last.category === c ? 'just ' : '')
                          }
                        >
                          {v !== null ? v : potential !== undefined ? potential : ''}
                          {pickable && i === seat && best === c && <span className="y-star" aria-label="추천">★</span>}
                        </td>
                      );
                    })}
                  </tr>,
                ];
              })}
              <tr className="y-total-row">
                <th scope="row">합계</th>
                {totals.map((t, i) => (
                  <td key={i}>{t.total}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
