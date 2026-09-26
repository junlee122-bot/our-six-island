'use client';
// 허풍 카드 table (허풍 주점): 허 선장's strip, the seats around the table
// (hand-back counts, each toy revolver's pulls and next risk), 오늘의 카드 in
// the middle, my hand, and the roulette moment (reveal → trigger → shot) as a
// push-in overlay. Only the public view is ever shown (lounge-liarsbar.ts).
// Keys: 1–5 카드 고르기 · Enter 내기 · L 거짓말! · Space/Enter 방아쇠 · Esc 선택 풀기.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { BellRing, Check, Crown, Ghost, ShieldCheck, Skull } from 'lucide-react';
import {
  LB_CHAMBERS,
  LB_FACE_NAME,
  LB_LIMIT_MS,
  lbRisk,
  lbTrue,
  lbVerify,
  type LbFace,
  type LbTableCard,
  type LiarsBarAction,
  type LiarsBarView,
} from './lounge-liarsbar';
import { captainLine } from './lounge-liarsbar-lines';
import type { TurnTiming } from './lounge-room';
import { AWAY_LABEL, TurnTimer, awaitAnswer } from './lounge-turn-timer';
import { DealerHost, SeatPortrait, type SeatFigure } from './lounge-dealer-host';
import { loungeAudio } from './lounge-audio';
import { formatBeom, josa } from './lounge-text';
import './lounge-liarsbar-table.css';

/** Small emblem per face: 범 왕관 (K), 학 (Q), 보름달 (A), 도깨비 방망이 (조커). */
export function FaceEmblem({ face }: { face: LbFace }) {
  return (
    <svg className={'lb-emblem lb-emblem-' + face} viewBox="0 0 40 40" aria-hidden="true">
      {face === 'K' ? (
        <>
          <path d="M6 28 L9 13 L16 21 L20 9 L24 21 L31 13 L34 28 Z" fill="#d19a4a" stroke="#6b4226" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 24 h22" stroke="#6b4226" strokeWidth="1.4" />
          <path d="M13 26 l2 -2 M20 26 l1 -3 M27 26 l-2 -2" stroke="#2a1d17" strokeWidth="1.3" strokeLinecap="round" />
          <rect x="6" y="28" width="28" height="4" rx="1.5" fill="#9e3b2e" />
        </>
      ) : face === 'Q' ? (
        <>
          <path d="M9 30 C12 20 18 17 24 18 C28 18 31 14 30 9 C33 12 33 17 29 21 C25 25 18 26 15 31 Z" fill="#f4efe4" stroke="#2a1d17" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="29.5" cy="9.5" r="2.2" fill="#c0392b" />
          <path d="M31 10 l5 1.5" stroke="#2a1d17" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M15 31 l-2 6 M18 29 l1 7" stroke="#2a1d17" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : face === 'A' ? (
        <>
          <circle cx="20" cy="20" r="12" fill="#f6d67a" stroke="#b07b25" strokeWidth="1.6" />
          <circle cx="16" cy="17" r="2.2" fill="#e8bf57" />
          <circle cx="24" cy="23" r="3" fill="#e8bf57" />
          <circle cx="23" cy="14" r="1.4" fill="#e8bf57" />
        </>
      ) : (
        <>
          <path d="M12 33 L24 10 C26 6 32 8 30 13 L18 35 Z" fill="#8a5a33" stroke="#2a1d17" strokeWidth="1.5" strokeLinejoin="round" />
          {[
            [24, 12],
            [27, 15],
            [21, 18],
            [24, 21],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#f1e4cc" />
          ))}
          <path d="M9 11 l3 3 M8 16 h4" stroke="#d19a4a" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** One card: face up (K / Q / A / 조커) or its back. */
export function LbCard({
  face,
  table,
  stamp,
  small = false,
}: {
  face: LbFace | null;
  table?: LbTableCard;
  stamp?: 'true' | 'lie';
  small?: boolean;
}) {
  if (!face)
    return (
      <span className={'lb-card is-back' + (small ? ' is-small' : '')} aria-hidden="true">
        <svg viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="13" fill="none" stroke="#d19a4a" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M11 22 h14 l3 -3 h3 v5 h-3 l-3 -2 h-14 z" fill="#d19a4a" />
          <circle cx="32" cy="21.5" r="1.6" fill="#d9b27a" />
        </svg>
      </span>
    );
  const good = table ? lbTrue(face, table) : false;
  return (
    <span className={'lb-card is-face lb-face-' + face + (small ? ' is-small' : '') + (stamp ? ' is-' + stamp : '')} data-face={face}>
      <b className="lb-corner">{face === 'J' ? '★' : face}</b>
      <FaceEmblem face={face} />
      <small>{LB_FACE_NAME[face]}</small>
      {stamp && <em className="lb-stamp">{stamp === 'true' ? '진짜' : '뻥'}</em>}
      {!stamp && table && good && <i className="lb-good" aria-hidden="true" />}
    </span>
  );
}

/** The toy cork gun (뻥총), always pointing up and away. */
export function CorkGun({ pulls = 0, spin = 0, fired = false }: { pulls?: number; spin?: number; fired?: boolean }) {
  return (
    <svg className={'lb-gun' + (fired ? ' is-fired' : '')} viewBox="0 0 120 120" aria-hidden="true">
      <g transform="rotate(-60 60 60)">
        <rect x="46" y="54" width="54" height="11" rx="4" fill="#c8a24a" stroke="#6b4226" strokeWidth="2" />
        <rect x="98" y="53" width="9" height="13" rx="2" fill="#d9b27a" stroke="#6b4226" strokeWidth="1.6" className="lb-cork" />
        <g transform={`rotate(${spin * 60} 50 60)`} className="lb-cylinder">
          <circle cx="50" cy="60" r="14" fill="#a0782e" stroke="#6b4226" strokeWidth="2" />
          {Array.from({ length: LB_CHAMBERS }, (_, i) => {
            const a = (i / LB_CHAMBERS) * Math.PI * 2 - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={50 + Math.cos(a) * 8.5}
                cy={60 + Math.sin(a) * 8.5}
                r="3"
                className={i < pulls ? 'lb-chamber is-pulled' : 'lb-chamber'}
              />
            );
          })}
        </g>
        <path d="M34 62 C22 64 18 80 26 92 L40 90 C36 82 38 74 44 70 Z" fill="#6b4226" stroke="#3a2418" strokeWidth="2" />
        <path d="M40 70 C40 80 48 82 52 74" fill="none" stroke="#6b4226" strokeWidth="3" />
        <path d="M44 48 l-4 -6 l6 1 z" fill="#6b4226" />
        <path d="M60 66 q4 10 -2 14" fill="none" stroke="#b3452f" strokeWidth="3" strokeLinecap="round" />
      </g>
      {fired && (
        <g className="lb-puff">
          <circle cx="92" cy="18" r="10" />
          <circle cx="104" cy="12" r="7" />
          <circle cx="84" cy="8" r="6" />
        </g>
      )}
    </svg>
  );
}

/** Pulls so far as a strip of 6 chambers (● pulled, ○ left). */
function Chambers({ pulls, alive }: { pulls: number; alive: boolean }) {
  return (
    <span className="lb-chambers" aria-label={`방아쇠 ${pulls}/${LB_CHAMBERS}번${alive ? ` · 다음 위험 1/${lbRisk(pulls)}` : ''}`}>
      {Array.from({ length: LB_CHAMBERS }, (_, i) => (
        <i key={i} className={i < pulls ? (!alive && i === pulls - 1 ? 'is-shot' : 'is-pulled') : ''} />
      ))}
      {alive && <small>다음 1/{lbRisk(pulls)}</small>}
    </span>
  );
}

/** Seats clockwise from mine: me at the bottom, then left → top → right. */
function seatSlots(n: number, seat: number) {
  const me = seat >= 0 ? seat : 0;
  const order = Array.from({ length: n }, (_, k) => (me + k) % n);
  const spots: Record<number, readonly string[]> = {
    2: ['bottom', 'top'],
    3: ['bottom', 'left', 'right'],
    4: ['bottom', 'left', 'top', 'right'],
  };
  return order.map((s, k) => ({ seat: s, spot: (spots[n] ?? spots[4])[k] ?? 'top' }));
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function LiarsBarTable({
  match: v,
  seat,
  names,
  figures = [],
  onAction,
}: {
  match: LiarsBarView & TurnTiming;
  seat: number;
  names: string[];
  figures?: SeatFigure[];
  onAction: (a: LiarsBarAction) => void | Promise<boolean>;
}) {
  const over = v.phase === 'over';
  const hand = v.hand ?? [];
  const version = `${v.id}:${v.revision}`;
  const [pick, setPick] = useState<{ key: string; ids: number[] }>({ key: '', ids: [] });
  const handKey = `${v.id}:${v.round}:${hand.map((c) => c.id).join(',')}`;
  const picked = pick.key === handKey ? pick.ids : [];
  const [sent, setSent] = useState<string | null>(null);
  const inFlight = useRef<string | null>(null);
  const locked = sent === version;
  const act = (a: LiarsBarAction) => {
    if (locked || inFlight.current === version) return;
    inFlight.current = version;
    setSent(version);
    awaitAnswer(onAction(a), () => {
      inFlight.current = null;
      setSent(null);
    });
  };
  const toggle = (i: number) => {
    const card = hand[i];
    if (!card || !v.legal.play || locked) return;
    const has = picked.includes(card.id);
    if (!has && picked.length >= v.legal.max) return;
    loungeAudio.sample('select');
    setPick({ key: handKey, ids: has ? picked.filter((id) => id !== card.id) : [...picked, card.id] });
  };
  const play = () => {
    if (!v.legal.play || !picked.length || picked.length > v.legal.max) return;
    loungeAudio.sample('card-place');
    act({ kind: 'play', ids: picked });
  };
  const call = () => {
    if (!v.legal.call) return;
    loungeAudio.tavern('bell');
    act({ kind: 'call' });
  };
  const trigger = () => {
    if (!v.legal.trigger) return;
    loungeAudio.tavern('ratchet');
    act({ kind: 'trigger' });
  };
  // Keys (not while typing or in a dialog), like the 야추 table.
  const keys = useRef<(e: KeyboardEvent) => boolean>(() => false);
  useEffect(() => {
    keys.current = (e) => {
      if (v.legal.trigger && (e.code === 'Space' || e.key === 'Enter')) {
        trigger();
        return true;
      }
      const digit = /^Digit([1-5])$/.exec(e.code)?.[1] ?? /^Numpad([1-5])$/.exec(e.code)?.[1];
      if (digit && v.legal.play) {
        toggle(Number(digit) - 1);
        return true;
      }
      if (e.key === 'Enter' && v.legal.play && picked.length) {
        play();
        return true;
      }
      if ((e.key === 'l' || e.key === 'L' || e.code === 'KeyL') && v.legal.call) {
        call();
        return true;
      }
      if (e.key === 'Escape' && picked.length) {
        setPick({ key: handKey, ids: [] });
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
      if ((e.key === 'Enter' || e.code === 'Space') && t?.closest?.('button')) return;
      if (keys.current(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
  // Sounds for public events: deals, plays, the bell, reveals, the shot.
  const last = useRef({ round: v.round, plays: v.plays.length, phase: v.phase, rev: v.revision });
  useEffect(() => {
    const prev = last.current;
    if (v.round !== prev.round) loungeAudio.table('deal', Math.min(10, hand.length || 5), 0.06);
    else if (v.plays.length > prev.plays) loungeAudio.sample('card-place');
    if (v.phase !== prev.phase) {
      if (v.phase === 'reveal') {
        loungeAudio.tavern('bell');
        v.reveal?.faces.forEach((_, i) =>
          setTimeout(() => loungeAudio.sample('card-place', undefined, 0.8), 350 + i * 400),
        );
        setTimeout(() => loungeAudio.sample(v.reveal?.lie ? 'error' : 'confirm'), 350 + (v.reveal?.faces.length ?? 1) * 400);
      } else if (v.phase === 'shot' && v.lastShot) loungeAudio.tavern(v.lastShot.out ? 'pop' : 'click');
      else if (v.phase === 'over') loungeAudio.sample('confirm');
    }
    last.current = { round: v.round, plays: v.plays.length, phase: v.phase, rev: v.revision };
  }, [v.round, v.plays.length, v.phase, v.revision, v.reveal, v.lastShot, hand.length]);
  // Heartbeat while someone holds the gun.
  useEffect(() => {
    if (v.phase !== 'trigger') return;
    loungeAudio.tavern('heart');
    const timer = window.setInterval(() => loungeAudio.tavern('heart'), 1000);
    return () => window.clearInterval(timer);
  }, [v.phase, v.round]);
  const away = (i: number) => !!v.away?.includes(i);
  const line = captainLine(v, names, v.away ?? []);
  const pile = v.plays.reduce((s, p) => s + p.count, 0);
  const lastPlay = v.plays[v.plays.length - 1];
  const actor = v.phase === 'play' ? v.turn : v.phase === 'trigger' ? v.shooter : -1;
  const actorName = actor >= 0 ? names[actor] : '';
  const mine = v.legal.enabled;
  const [verify, setVerify] = useState(false);
  const moment = v.phase === 'reveal' || v.phase === 'trigger' || v.phase === 'shot';
  return (
    <div
      className={'lb-club' + (reduced() ? ' is-reduced' : '')}
      data-testid="liarsbar-table"
      data-phase={v.phase}
      data-my-turn={mine || undefined}
    >
      <DealerHost
        host="captain"
        line={line}
        table={{ game: '허풍 카드' }}
        side={
          !over && actor >= 0 ? (
            <TurnTimer
              deadline={v.turnDeadline}
              total={v.phase === 'trigger' ? LB_LIMIT_MS.trigger : LB_LIMIT_MS.play}
              label={mine ? '내 차례' : `${actorName} 차례`}
              mine={mine}
            />
          ) : undefined
        }
      />
      <div className="lb-layout">
        <section className="lb-felt" aria-label="허풍 카드 테이블">
          {seatSlots(v.n, seat).map(({ seat: s, spot }) => {
            const out = !v.alive[s];
            return (
              <div
                key={s}
                className={
                  'lb-seat lb-at-' +
                  spot +
                  (s === seat ? ' is-me' : '') +
                  (actor === s ? ' is-turn' : '') +
                  (out ? ' is-out' : '') +
                  (moment && v.shooter === s ? ' is-shooter' : '') +
                  (moment && v.shooter >= 0 && v.shooter !== s ? ' is-dim' : '') +
                  (v.lastShot?.seat === s && v.lastShot.out ? ' is-sooty' : '')
                }
                data-seat={s}
              >
                <span className="lb-seat-face">
                  <SeatPortrait figure={figures[s]} name={names[s] ?? ''} />
                  {out && <Ghost className="lb-ghost" size={18} aria-label="뻗음" />}
                </span>
                <span className="lb-seat-text">
                  <strong>
                    {over && v.winner === s && <Crown size={13} aria-label="우승" />} {names[s]}
                    {s === seat && <em>나</em>}
                  </strong>
                  <small>
                    {out
                      ? v.quit[s]
                        ? '기권 · 관전 중'
                        : '뻗음 · 관전 중'
                      : away(s) && !over
                        ? AWAY_LABEL
                        : actor === s
                          ? v.phase === 'trigger'
                            ? '뻥총을 잡았어요'
                            : '고르는 중'
                          : `손패 ${v.handCount[s]}장`}
                  </small>
                  <Chambers pulls={v.pulls[s]} alive={!out} />
                </span>
                {!out && s !== seat && (
                  <span className="lb-backs" aria-label={`손패 ${v.handCount[s]}장`}>
                    {Array.from({ length: v.handCount[s] }, (_, i) => (
                      <LbCard key={i} face={null} small />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
          <div className="lb-center">
            <div className="lb-today" data-testid="liarsbar-today">
              <small>오늘의 카드</small>
              <LbCard face={v.table} />
              <span>
                <b>{LB_FACE_NAME[v.table]}</b>
                <em>조커는 무엇이든 돼요</em>
              </span>
            </div>
            <div className="lb-pile" aria-label={`이번 판에 낸 카드 ${pile}장`}>
              <span className="lb-pile-cards">
                {Array.from({ length: Math.min(8, pile) }, (_, i) => (
                  <span key={i} style={{ '--i': i } as CSSProperties}>
                    <LbCard face={null} small />
                  </span>
                ))}
              </span>
              <small>
                {lastPlay
                  ? `마지막: ${names[lastPlay.seat]} “${LB_FACE_NAME[v.table]} ${lastPlay.count}장”`
                  : `${v.round}판째 · 아직 낸 카드가 없어요`}
              </small>
              <span className="lb-props" aria-hidden="true">
                <BellRing size={22} />
                <CorkGun />
              </span>
            </div>
          </div>
          {moment && v.shooter >= 0 && (
            <div className={'lb-moment is-' + v.phase + (v.lastShot?.out ? ' is-out' : '')} data-testid="liarsbar-moment">
              {v.reveal && (
                <div className="lb-reveal" aria-live="polite">
                  <small>
                    {names[v.reveal.caller]}의 “거짓말!” → {names[v.reveal.target]}의 {v.reveal.faces.length}장
                  </small>
                  <span className="lb-reveal-cards">
                    {v.reveal.faces.map((f, i) => (
                      <span key={i} style={{ '--i': i } as CSSProperties}>
                        <LbCard face={f} stamp={lbTrue(f, v.table) ? 'true' : 'lie'} />
                      </span>
                    ))}
                  </span>
                  <b className={v.reveal.lie ? 'is-lie' : 'is-true'}>
                    {v.reveal.lie ? `뻥이었어요! ${josa(names[v.shooter] ?? '', '이/가')} 당겨요.` : `전부 진짜! ${josa(names[v.shooter] ?? '', '이/가')} 당겨요.`}
                  </b>
                </div>
              )}
              {v.phase !== 'reveal' && (
                <div className="lb-roulette">
                  <CorkGun pulls={v.pulls[v.shooter]} spin={v.pulls[v.shooter]} fired={v.phase === 'shot' && !!v.lastShot?.out} />
                  <div>
                    <strong>
                      {names[v.shooter]} · 방아쇠 {v.pulls[v.shooter] + (v.phase === 'trigger' ? 1 : 0)}번째
                    </strong>
                    {v.phase === 'trigger' ? (
                      <small>이번 위험 1/{lbRisk(v.pulls[v.shooter])} · 총구는 천장을 향해요</small>
                    ) : v.lastShot?.out ? (
                      <b className="lb-result is-out">
                        <Skull size={18} aria-hidden="true" /> 뻥! 검댕을 뒤집어쓰고 뻗었어요
                      </b>
                    ) : (
                      <b className="lb-result is-safe">
                        <Check size={18} aria-hidden="true" /> 딸깍! 살았다!
                      </b>
                    )}
                    {v.legal.trigger && (
                      <button type="button" className="l-primary lb-trigger" onClick={trigger} disabled={locked} data-testid="liarsbar-trigger" aria-keyshortcuts="Space Enter">
                        방아쇠 당기기 <kbd>Space</kbd>
                      </button>
                    )}
                    {v.phase === 'trigger' && !v.legal.trigger && <small>{josa(names[v.shooter] ?? '', '이/가')} 방아쇠를 잡았어요…</small>}
                  </div>
                </div>
              )}
              {v.phase === 'shot' && v.lastShot?.out && <span className="lb-confetti" aria-hidden="true" />}
            </div>
          )}
        </section>
        <aside className="lb-side">
          <h3>기록</h3>
          <ol className="lb-log" aria-live="polite">
            {v.log.slice(-10).map((l, i) => (
              <li key={`${v.revision}-${i}`} className={l.seat < 0 ? 'is-host' : ''}>
                {l.seat >= 0 ? <b>{names[l.seat]}</b> : null} {l.text}
              </li>
            ))}
          </ol>
          <div className="lb-totals">
            <h3>이 자리 기록</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">이름</th>
                  <th scope="col">우승</th>
                  <th scope="col">적발</th>
                  <th scope="col">생존</th>
                </tr>
              </thead>
              <tbody>
                {names.map((n, i) => (
                  <tr key={i} className={i === seat ? 'is-me' : ''}>
                    <th scope="row">{n}</th>
                    <td>{v.totals.wins[i]}</td>
                    <td>{v.totals.caught[i]}</td>
                    <td>{v.totals.survived[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
      {v.role === 'player' && !over && (
        <section className="lb-hand-wrap" aria-label="내 손패">
          <ol className="lb-hand">
            {hand.map((c, i) => {
              const on = picked.includes(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={'lb-hand-card' + (on ? ' is-picked' : '')}
                    onClick={() => toggle(i)}
                    disabled={!v.legal.play || locked || (!on && picked.length >= v.legal.max)}
                    aria-pressed={on}
                    aria-keyshortcuts={String(i + 1)}
                    aria-label={`${i + 1}번 카드 ${LB_FACE_NAME[c.face]}${lbTrue(c.face, v.table) ? ', 오늘의 카드와 같음' : ''}`}
                    data-testid={`liarsbar-card-${i}`}
                  >
                    <LbCard face={c.face} table={v.table} />
                    <kbd>{i + 1}</kbd>
                  </button>
                </li>
              );
            })}
            {!hand.length && <li className="lb-empty-hand">손패를 다 냈어요. 누군가 “거짓말!”을 외칠 때까지 기다려요.</li>}
          </ol>
          <div className="lb-actions">
            <button
              type="button"
              className="l-primary lb-play"
              onClick={play}
              disabled={!v.legal.play || !picked.length || locked}
              data-testid="liarsbar-play"
            >
              {picked.length ? `${picked.length}장 내기` : '카드를 1~3장 골라요'} <kbd>Enter</kbd>
            </button>
            <button
              type="button"
              className={'lb-call' + (v.legal.forced ? ' is-forced' : '')}
              onClick={call}
              disabled={!v.legal.call || locked}
              data-testid="liarsbar-call"
            >
              거짓말! <kbd>L</kbd>
            </button>
            <p className="lb-keys" aria-hidden="true">
              1–5 고르기 · Enter 내기 · L 거짓말 · Space 방아쇠 · Esc 선택 풀기
            </p>
          </div>
        </section>
      )}
      {v.role === 'out' && !over && (
        <p className="lb-watch-note" data-testid="liarsbar-out">
          <Ghost size={16} aria-hidden="true" /> 오늘은 여기까지예요. 관전하면서 다른 사람의 손패는 보이지 않아요.
        </p>
      )}
      {over && (
        <section className="lb-result-panel" data-testid="liarsbar-result">
          <h3>
            <Crown size={18} aria-hidden="true" /> {names[v.winner ?? 0]} 님이 오늘의 허풍왕이에요!
          </h3>
          <ol>
            {names.map((n, i) => (
              <li key={i} className={v.winner === i ? 'is-winner' : ''}>
                <strong>{n}</strong>
                <span>{v.winner === i ? '우승' : v.quit[i] ? '기권' : '뻗음'}</span>
                <span>방아쇠 {v.pulls[i]}번</span>
                <em>{v.stake > 0 ? `${v.result[i] > 0 ? '+' : ''}${formatBeom(v.result[i])}` : ''}</em>
              </li>
            ))}
          </ol>
          <p>{v.stake > 0 ? `참가비 ${formatBeom(v.stake)} × ${v.n}명 · 마지막까지 버틴 사람이 모두 가져가요.` : '파티 판 · 범은 오가지 않았어요.'}</p>
          <button type="button" className="l-secondary" onClick={() => setVerify((x) => !x)} aria-expanded={verify} data-testid="liarsbar-verify">
            <ShieldCheck size={16} aria-hidden="true" /> 탄창 확인
          </button>
          {verify && (
            <ul className="lb-verify">
              {names.map((n, i) => (
                <li key={i}>
                  <b>{n}</b> 탄알은 {(v.chamber?.[i] ?? 0) + 1}번째 칸 ·{' '}
                  {lbVerify(v, i) ? <span className="is-ok">시작 때 공개한 해시와 같아요</span> : <span className="is-bad">해시가 달라요</span>}
                  <code title={v.commit[i]}>{v.commit[i].slice(0, 16)}…</code>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
