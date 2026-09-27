'use client';
// 낚시 (VILL-2 redesign): a tackle board over the water. Cast → watch the
// float (it may nibble; do not pull yet) → the float dives with a "!" and a
// reel bar runs across for the bite window → press E / Space / click while it
// runs → the fish card (painted fish on a paper card, size ruler, weight,
// first-catch stamp, personal and village records). The spot sign on top
// says what bites here right now. The server decides the fish at the cast and
// times the bite; the client shows the bite at biteAt − clockOffset and
// sends the reaction time (unchanged contract).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { FISH, FISH_BY_ID, SPOT_INFO, type FishDef, type Spot } from '../lounge-items';
import { REEL_REASON, reelTiming } from '../lounge-life-ui';
import { fishCandidates, sellQuote, itemName, type FishLast } from '../lounge-life-plus';
import { lifeSfx } from '../lounge-audio-life';
import { formatBeom, josa } from '../lounge-text';
import { ACTORS } from '../lounge-roster';
import { ItemIcon } from './ItemIcon';
import { FishCatchModel } from './FishCatchModel';
import { Glyph } from './field-glyphs';
import { useNow } from './use-now';
import type { Notify } from './Toast';
import { boundAction } from '../lounge-scene-keys';
import { keyLabel } from '../lounge-keybinds';
import { getSettings } from '../lounge-settings';
import './life-plus.css';
import './farm-fish.css';

export type FishingPhase = 'casting' | 'wait' | 'bite' | 'reeling' | 'result';
type Result = Omit<FishLast, 'at'> & { isNew?: boolean };

/** Rough body build per fish look (g per cm³ ×1e-3): long fish are light for their length. */
const BUILD: Record<string, number> = {
  eel: 0.35, snakehead: 0.7, loach: 0.45, hairtail: 0.28, conger: 0.35, moonhairtail: 0.28,
  flounder: 1.25, puffer: 1.3, goldfish: 1.3, bluegill: 1.35,
  squid: 0.75, mitre: 0.75, octopus: 0.9, crayfish: 1.6,
};
/** An honest-looking weight for a fish of `cm` (display only). */
export function fishWeight(id: string, cm: number) {
  const g = Math.max(1, Math.round(15.5 * (BUILD[id] ?? 1) * (cm / 10) ** 3));
  return g >= 1000 ? `${(g / 1000).toFixed(g >= 10_000 ? 0 : 1)}kg` : `${g}g`;
}
export const fishRarity = (f: FishDef) => (f.weight <= 1 ? 'legend' : f.weight < 10 ? 'rare' : 'common');
const RARITY_NAME = { legend: '전설', rare: '드묾', common: '흔함' } as const;

export function FishingOverlay({
  room,
  view,
  spot,
  notify,
  onClose,
  onPhase,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  spot: Spot;
  notify: Notify;
  onClose: () => void;
  /** Tells the village where the bobber is (bobber / bite animation). */
  onPhase: (phase: FishingPhase | null) => void;
}) {
  const [phase, setPhase] = useState<FishingPhase>('casting');
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [nibble, setNibble] = useState(0);
  const [closing, setClosing] = useState(false);
  const [closeFailed, setCloseFailed] = useState(false);
  const closingRef = useRef(false);
  const castingRef = useRef(true);
  const cancelBusy = useRef(false);
  const token = useRef<{ token: string; biteAt: number; windowMs: number } | null>(null);
  const [windowMs, setWindowMs] = useState(1000);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef = useRef(phase);
  const rootRef = useRef<HTMLDivElement>(null);
  const actRef = useRef<HTMLButtonElement>(null);
  const reelingRef = useRef(false);
  const cb = useRef({ onClose, onPhase });
  useLayoutEffect(() => {
    cb.current = { onClose, onPhase };
  });
  useLayoutEffect(() => {
    phaseRef.current = phase;
    cb.current.onPhase(phase);
  }, [phase]);
  useEffect(() => () => cb.current.onPhase(null), []);
  const lead = useRef(0);
  const shownAt = useRef<number | null>(null);
  const serverNow = useCallback(() => Date.now() + room.snapshot().clockOffset + lead.current, [room]);
  const reduced = useMemo(() => {
    try {
      return matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);

  // Do not leave a live server cast behind when the sheet closes. A close
  // during cast/reel waits for its reply before cancelling/finishing it.
  const finishClose = useCallback(async () => {
    if (cancelBusy.current) return;
    cancelBusy.current = true;
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    const p = token.current;
    const ok = !p || await room.life({ kind: 'cancelCast', token: p.token });
    cancelBusy.current = false;
    if (!ok) {
      closingRef.current = false;
      setClosing(false);
      setCloseFailed(true);
      return;
    }
    token.current = null;
    cb.current.onClose();
  }, [room]);
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setCloseFailed(false);
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    if (!castingRef.current && !reelingRef.current) void finishClose();
  }, [finishClose]);

  /** `pressedAt`: the input event's timeStamp (performance clock), when known. */
  const reel = useCallback(async (pressedAt?: number) => {
    const p = token.current;
    if (!p || reelingRef.current || closingRef.current) return;
    reelingRef.current = true;
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    const before = room.snapshot().life?.me.dex ?? [];
    // Reaction time from when the "!" actually showed, so a slow frame or a
    // late answer never counts against the player (the server still checks
    // that the reel arrives inside the bite window + slack).
    const timingMs =
      shownAt.current !== null
        ? Math.max(0, Math.round((pressedAt ?? performance.now()) - shownAt.current))
        : reelTiming(p.biteAt, serverNow());
    shownAt.current = null;
    setPhase('reeling');
    lifeSfx('tick');
    const ok = await room.life({ kind: 'reel', token: p.token, timingMs });
    if (ok) token.current = null;
    reelingRef.current = false;
    if (closingRef.current) {
      await finishClose();
      return;
    }
    const last = room.snapshot().life?.me.fishing?.last;
    if (!ok || !last) {
      setResult({ ok: false, reason: 'timing' });
      setPhase('result');
      lifeSfx('miss');
      return;
    }
    const isNew = !!last.fish && !before.includes(last.fish);
    setResult({
      ok: last.ok,
      fish: last.fish,
      cm: last.cm,
      record: last.record,
      best: last.best,
      reason: last.reason,
      isNew,
      // A timeout reels automatically only to clear server state; it is not
      // the player's input and must not be presented as their reaction score.
      reactionMs: pressedAt !== undefined ? last.reactionMs : undefined,
      grade: pressedAt !== undefined ? last.grade : undefined,
      parcel: last.parcel,
    });
    setPhase('result');
    const f = last.fish ? FISH_BY_ID[last.fish] : undefined;
    lifeSfx(!last.ok ? 'miss' : f && f.weight < 10 ? 'fanfare' : 'reel');
    if (last.ok && (isNew || last.record)) timers.current.push(setTimeout(() => lifeSfx('sparkle'), 380));
  }, [room, serverNow, finishClose]);

  // Cast (again on each attempt): the server answers with the pending bite.
  useEffect(() => {
    let cancelled = false;
    castingRef.current = true;
    lifeSfx('cast');
    void (async () => {
      const sent = performance.now();
      const ok = await room.life({ kind: 'cast', spot });
      // The server clock offset is measured when the answer arrives (one trip
      // late); half the round trip (capped) brings the bite back on time.
      lead.current = Math.min(600, Math.max(0, (performance.now() - sent) / 2));
      const pending = room.snapshot().life?.me.fishing?.pending;
      castingRef.current = false;
      if (cancelled) {
        if (ok && pending) void room.life({ kind: 'cancelCast', token: pending.token });
        return;
      }
      if (!ok || !pending) {
        cb.current.onClose();
        return;
      }
      token.current = { token: pending.token, biteAt: pending.biteAt, windowMs: pending.windowMs };
      if (closingRef.current) {
        await finishClose();
        return;
      }
      setWindowMs(pending.windowMs);
      setPhase('wait');
      const toBite = Math.max(0, pending.biteAt - serverNow());
      // A nibble or two before the real bite (only a twitch: do not pull yet).
      if (!reduced)
        for (const at of [0.35, 0.7]) {
          const t = toBite * at;
          if (t > 700 && toBite - t > 600) timers.current.push(setTimeout(() => !cancelled && setNibble((n) => n + 1), t));
        }
      timers.current.push(
        setTimeout(() => {
          if (cancelled || phaseRef.current !== 'wait') return;
          shownAt.current = performance.now();
          setPhase('bite');
          lifeSfx('bite');
          // The "!" is on screen from the next frame on.
          requestAnimationFrame((t) => {
            if (shownAt.current !== null) shownAt.current = t;
            actRef.current?.focus({ preventScroll: true });
          });
        }, toBite),
        // Missed the window: reel anyway so the server records it and clears the cast.
        setTimeout(() => {
          if (!cancelled && phaseRef.current === 'bite') void reel();
        }, toBite + pending.windowMs + 350),
      );
    })();
    return () => {
      cancelled = true;
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
    };
  }, [attempt, room, spot, serverNow, reel, reduced, finishClose]);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);
  const act = useCallback((pressedAt?: number) => {
    if (closingRef.current) return;
    const p = phaseRef.current;
    if (p === 'bite' || p === 'wait') void reel(pressedAt);
    else if (p === 'result') {
      // Cast again: back to the casting pose before the new cast goes out.
      reelingRef.current = false;
      setResult(null);
      setPhase('casting');
      setAttempt((a) => a + 1);
    }
  }, [reel]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return;
      if (boundAction(e) === 'action' || e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) act(e.timeStamp);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        requestClose();
      }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [act, requestClose]);

  const life = view.life;
  const fish = result?.fish ? FISH_BY_ID[result.fish] : undefined;
  const record = result?.fish ? life?.records?.[result.fish] : undefined;
  const best = result?.fish ? life?.me.fishing?.best?.[result.fish] : undefined;
  const bait = life?.me.fishing?.bait ?? 0;
  const rod = life?.me.fishing?.rod ?? 1;
  const info = SPOT_INFO[spot];
  // What bites here now (season, weather, time of day), found ones by name.
  const now = useNow(true, 60_000) + view.clockOffset;
  const dex = life?.me.dex ?? [];
  const biting = life?.calendar
    ? [...fishCandidates(spot, life.calendar.season, life.weather?.today ?? 'sunny', now)].sort((a, b) => b.weight - a.weight)
    : [];
  const living = FISH.filter((f) => f.spots.includes(spot));
  const found = living.filter((f) => dex.includes(f.id)).length;
  const price = fish && life ? sellQuote(life, fish.id, 0, 1, now).next : fish?.sell;
  useEffect(() => {
    if (result?.ok && fish && result.record) notify(`${fish.name} ${result.cm}cm · 마을 최대어 기록이에요!`);
  }, [result, fish, notify]);
  const actKey = keyLabel(getSettings().keys.action);
  return (
    <div
      ref={rootRef}
      className="l-angler"
      data-phase={phase}
      data-spot={spot}
      data-testid="fishing"
      role="dialog"
      aria-label={`${info.name}에서 낚시하기`}
      tabIndex={-1}
    >
      <header className="l-angler-sign">
        <span className="l-angler-board">
          <strong>{info.name}</strong>
          <small>{info.note}</small>
        </span>
        <span className="l-angler-tags">
          <span className="l-tag">낚싯대 {rod}단</span>
          <span className="l-tag" data-empty={!bait || undefined}>
            미끼 {bait}
          </span>
        </span>
        <button type="button" className="l-angler-close" aria-label="그만하기 (Esc)" onClick={requestClose} disabled={closing}>
          <kbd>Esc</kbd>
        </button>
      </header>
      <div className="l-angler-now" aria-label="지금 여기서 무는 물고기">
        <span className="l-angler-now-label">
          지금 무는 물고기 <small>{found}/{living.length}종 찾음</small>
        </span>
        <ul>
          {biting.slice(0, 8).map((f) => {
            const known = dex.includes(f.id);
            return (
              <li key={f.id} data-known={known || undefined} data-rarity={fishRarity(f)} title={known ? `${f.name} · ${RARITY_NAME[fishRarity(f)]}` : `아직 못 만난 물고기 · ${RARITY_NAME[fishRarity(f)]}`}>
                <ItemIcon id={f.id} size={30} />
                <small>{known ? f.name : '?'}</small>
              </li>
            );
          })}
          {!biting.length && <li className="l-angler-quiet">지금은 조용해요</li>}
        </ul>
      </div>
      {phase === 'result' && result ? (
        <div className={`l-catch${result.ok ? ' is-ok' : ''}`} data-testid="fish-result" data-fish={result.fish ?? ''}>
          {result.ok && fish ? (
            <>
              <figure className="l-catch-art" data-rarity={fishRarity(fish)}>
                <FishCatchModel key={fish.id} fish={fish.id} />
                <svg className="l-catch-ruler" viewBox="0 0 200 18" aria-hidden="true">
                  <rect x="1" y="3" width="198" height="12" rx="2" fill="#f3dc9a" stroke="#a8743a" />
                  {Array.from({ length: 21 }, (_, i) => (
                    <path key={i} d={`M${6 + i * 9.4} 3 v${i % 5 ? 4 : 7}`} stroke="#8a5a34" strokeWidth="1" />
                  ))}
                </svg>
                <figcaption>{result.cm}cm</figcaption>
                {result.isNew && (
                  <span className="l-stamp" aria-label="처음 낚았어요">
                    첫<br />낚시
                  </span>
                )}
              </figure>
              <div className="l-catch-text">
                <span className="l-catch-rarity" data-rarity={fishRarity(fish)}>
                  {RARITY_NAME[fishRarity(fish)]}
                </span>
                <strong>{fish.name}</strong>
                <b>
                  {result.cm}cm · 약 {fishWeight(fish.id, result.cm ?? 0)}
                </b>
                {(result.grade === 'S' || result.grade === 'A') && <em className="l-catch-quick">재빠르게 챘어요!</em>}
                <p>{fish.note}</p>
                <dl>
                  <dt>내 기록</dt>
                  <dd>
                    {result.best ? (
                      <span className="l-ribbon">새 기록</span>
                    ) : best ? (
                      `${best}cm`
                    ) : (
                      '—'
                    )}
                  </dd>
                  <dt>마을 최대어</dt>
                  <dd>
                    {result.record ? (
                      <span className="l-ribbon is-gold">
                        <Glyph name="star" size={13} /> 이 물고기예요
                      </span>
                    ) : record ? (
                      `${record.cm}cm · ${ACTORS[record.actor] ?? '친구'}`
                    ) : (
                      '—'
                    )}
                  </dd>
                  <dt>시세</dt>
                  <dd>개당 {formatBeom(price ?? fish.sell)}</dd>
                </dl>
              </div>
            </>
          ) : (
            <p className="l-catch-miss">
              <strong>앗, 놓쳤어요</strong>
              {REEL_REASON[result.reason ?? 'timing'] ?? REEL_REASON.timing}
              <small>
                {result.reason === 'early'
                  ? '찌가 살짝 떨리는 건 입질 흉내예요. 쏙 잠길 때까지 기다려요.'
                  : '막대가 끝에 닿기 전에 당기면 돼요.'}
              </small>
            </p>
          )}
          {result.reactionMs !== undefined && result.grade && (
            <div className="l-catch-reaction" data-testid="fish-reaction" aria-label={`입질 반응 ${result.reactionMs}밀리초, ${result.grade}등급`}>
              <b>{result.grade}급</b>
              <span>입질 반응 <strong>{result.reactionMs.toLocaleString()} ms</strong><small>서버 입질 → 당기기 도착 · 통신 시간 포함</small></span>
              <small>S ≤200 · A ≤350 · B ≤500 · C ≤750 · D ≤1,100 · E &gt;1,100 ms</small>
            </div>
          )}
          {result.ok && result.parcel && (
            <div className="l-catch-parcel" data-testid="fish-parcel">
              <ItemIcon id={result.parcel.kind === 'seed' ? `seed-${result.parcel.item}` : result.parcel.item} size={34} />
              <span><strong>물 위에서 꾸러미도 건졌어요!</strong><small>{itemName(result.parcel.item)}{result.parcel.kind === 'seed' ? ' 씨앗' : ''} 1개 · 주머니에 담았어요</small></span>
            </div>
          )}
          <div className="l-catch-actions">
            <button ref={actRef} type="button" className="l-leaf" onClick={(e) => act(e.timeStamp)} data-testid="fish-again" disabled={closing} autoFocus>
              <Glyph name="hook" /> 다시 던지기 <kbd>{actKey}</kbd>
            </button>
            <button type="button" className="l-ink" onClick={requestClose} disabled={closing}>
              그만하기 <kbd>Esc</kbd>
            </button>
          </div>
        </div>
      ) : (
        <button
          ref={actRef}
          type="button"
          className="l-angler-water"
          onClick={(e) => act(e.timeStamp)}
          disabled={closing || phase === 'casting' || phase === 'reeling'}
          data-testid="fish-act"
          aria-live="assertive"
        >
          <span className="l-angler-scene" aria-hidden="true">
            <span className="l-angler-ripple" />
            <span className="l-angler-float" key={phase === 'wait' ? `n${nibble}` : phase} data-nibble={phase === 'wait' && nibble > 0 ? true : undefined}>
              <svg viewBox="0 0 24 40" width="22" height="36">
                <path d="M12 0 v10" stroke="#4a3423" strokeWidth="1.4" />
                <ellipse cx="12" cy="18" rx="6" ry="8" fill="#fffaf0" stroke="#4a3423" strokeWidth="1.4" />
                <path d="M6 18 a6 8 0 0 0 12 0z" fill="#d9573f" />
                <path d="M12 26 v8" stroke="#4a3423" strokeWidth="1.4" />
              </svg>
            </span>
            {phase === 'bite' && <b className="l-angler-bang">!</b>}
          </span>
          <span className="l-angler-say">
            {closing ? '낚싯대를 거두는 중…' : phase === 'casting'
              ? '휘익, 찌를 던지는 중…'
              : phase === 'wait'
                ? nibble > 0
                  ? '톡톡… 아직이에요, 쏙 잠길 때까지'
                  : '찌를 지켜봐요'
                : phase === 'bite'
                  ? '지금! 당겨요'
                  : '감는 중…'}
            <small>
              {phase === 'bite'
                ? `${actKey} · Space · 클릭`
                : phase === 'wait'
                  ? '너무 일찍 당기면 놓쳐요'
                  : ''}
            </small>
          </span>
          {phase === 'bite' && (
            <span className="l-reelbar" aria-hidden="true" style={{ ['--window' as string]: `${windowMs}ms` }}>
              <span className="l-reelbar-sweet" />
              <span className="l-reelbar-mark" />
            </span>
          )}
          {phase === 'reeling' && <span className="l-reel-spin" aria-hidden="true" />}
        </button>
      )}
      <p className="l-angler-tip" role="status">{closing ? '정리가 끝나면 다시 걸을 수 있어요.' : closeFailed ? '낚싯대를 거두지 못했어요. 연결을 확인한 뒤 Esc로 다시 시도해 주세요.' : '낚시하는 동안은 제자리에 서 있어요 · 성공 시 씨앗 12% / 먹거리 4% 추가 발견'}</p>
    </div>
  );
}

/** Banner text for a caught fish (used by the village for a short line). */
export const caughtText = (fish: string, cm?: number) =>
  `${josa(FISH_BY_ID[fish]?.name ?? '물고기', '을/를')} 낚았어요${cm ? ` · ${cm}cm` : ''}!`;
