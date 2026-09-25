'use client';
// 낚시하기: cast → wait → bite cue ("!" + splash + sound) → press E / click
// inside the window → reel → result card. The server decides the fish at the
// cast and times the bite (pending.biteAt on the server clock); the client
// shows the bite at biteAt − clockOffset and sends the reaction time.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Anchor, FishingRod, RotateCcw, Trophy, X } from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { FISH_BY_ID, SPOT_INFO, type Spot } from '../lounge-items';
import { REEL_REASON, reelTiming } from '../lounge-life-ui';
import { lifeSfx } from '../lounge-audio-life';
import { formatBeom, josa } from '../lounge-text';
import { ACTORS } from '../lounge-roster';
import { ItemIcon } from './ItemIcon';
import type { Notify } from './Toast';
import './life-plus.css';

export type FishingPhase = 'casting' | 'wait' | 'bite' | 'reeling' | 'result';
type Result = { ok: boolean; fish?: string; cm?: number; record?: boolean; reason?: string; isNew?: boolean };

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
  const token = useRef<{ token: string; biteAt: number; windowMs: number } | null>(null);
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

  /** `pressedAt`: the input event's timeStamp (performance clock), when known. */
  const reel = useCallback(async (pressedAt?: number) => {
    const p = token.current;
    if (!p || reelingRef.current) return;
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
    const ok = await room.life({ kind: 'reel', token: p.token, timingMs });
    token.current = null;
    reelingRef.current = false;
    const last = room.snapshot().life?.me.fishing?.last;
    if (!ok || !last) {
      setResult({ ok: false, reason: 'timing' });
      setPhase('result');
      lifeSfx('miss');
      return;
    }
    const isNew = !!last.fish && !before.includes(last.fish);
    setResult({ ok: last.ok, fish: last.fish, cm: last.cm, record: last.record, reason: last.reason, isNew });
    setPhase('result');
    lifeSfx(last.ok ? 'reel' : 'miss');
  }, [room, serverNow]);

  // Cast (again on each attempt): the server answers with the pending bite.
  useEffect(() => {
    let cancelled = false;
    lifeSfx('cast');
    void (async () => {
      const sent = performance.now();
      const ok = await room.life({ kind: 'cast', spot });
      // The server clock offset is measured when the answer arrives (one trip
      // late); half the round trip (capped) brings the bite back on time.
      lead.current = Math.min(600, Math.max(0, (performance.now() - sent) / 2));
      if (cancelled) return;
      const pending = room.snapshot().life?.me.fishing?.pending;
      if (!ok || !pending) {
        cb.current.onClose();
        return;
      }
      token.current = { token: pending.token, biteAt: pending.biteAt, windowMs: pending.windowMs };
      setPhase('wait');
      const toBite = Math.max(0, pending.biteAt - serverNow());
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
  }, [attempt, room, spot, serverNow, reel]);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);
  const act = useCallback((pressedAt?: number) => {
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
      if (e.code === 'KeyE' || e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) act(e.timeStamp);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cb.current.onClose();
      }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [act]);

  const fish = result?.fish ? FISH_BY_ID[result.fish] : undefined;
  const record = result?.fish ? view.life?.records?.[result.fish] : undefined;
  const bait = view.life?.me.fishing?.bait ?? 0;
  useEffect(() => {
    if (result?.ok && fish && result.record) notify(`${fish.name} ${result.cm}cm · 마을 최대어 기록이에요!`);
  }, [result, fish, notify]);
  return (
    <div
      ref={rootRef}
      className="l-fishing"
      data-phase={phase}
      data-testid="fishing"
      role="dialog"
      aria-label={`${SPOT_INFO[spot].name}에서 낚시하기`}
      tabIndex={-1}
    >
      <header>
        <FishingRod size={18} aria-hidden="true" />
        <strong>{SPOT_INFO[spot].name} 낚시</strong>
        <small>
          낚싯대 {view.life?.me.fishing?.rod ?? 1}단계 · 미끼 {bait}개
        </small>
        <button type="button" className="l-icon" aria-label="그만하기 (Esc)" onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      {phase === 'result' && result ? (
        <div className={`l-fish-result${result.ok ? ' is-ok' : ''}`} data-testid="fish-result" data-fish={result.fish ?? ''}>
          {result.ok && fish ? (
            <>
              <div className="l-fish-art">
                <ItemIcon id={fish.id} size={112} />
              </div>
              <div className="l-fish-text">
                <strong>{fish.name}</strong>
                <b>{result.cm}cm</b>
                <span className="l-fish-badges">
                  {result.isNew && <em className="l-badge-new">새로 발견!</em>}
                  {result.record && (
                    <em className="l-badge-record">
                      <Trophy size={12} aria-hidden="true" /> 마을 최대어
                    </em>
                  )}
                </span>
                <small>{fish.note}</small>
                <small>
                  개당 {formatBeom(fish.sell)}
                  {record && !result.record ? ` · 마을 기록 ${record.cm}cm (${ACTORS[record.actor] ?? '친구'})` : ''}
                </small>
              </div>
            </>
          ) : (
            <p className="l-fish-miss">
              <Anchor size={18} aria-hidden="true" /> {REEL_REASON[result.reason ?? 'timing'] ?? REEL_REASON.timing}
            </p>
          )}
          <div className="l-fish-actions">
            <button ref={actRef} type="button" className="l-primary" onClick={(e) => act(e.timeStamp)} data-testid="fish-again" autoFocus>
              <RotateCcw size={15} /> 다시 던지기 <kbd>E</kbd>
            </button>
            <button type="button" className="l-secondary" onClick={onClose}>
              그만하기 <kbd>Esc</kbd>
            </button>
          </div>
        </div>
      ) : (
        <button
          ref={actRef}
          type="button"
          className="l-fish-stage"
          onClick={(e) => act(e.timeStamp)}
          disabled={phase === 'casting' || phase === 'reeling'}
          data-testid="fish-act"
          aria-live="assertive"
        >
          <span className="l-bobber" aria-hidden="true">
            <i />
            {phase === 'bite' && <b>!</b>}
          </span>
          <span className="l-fish-say">
            {phase === 'casting'
              ? '낚싯대를 휘익 던지는 중…'
              : phase === 'wait'
                ? '찌를 지켜보는 중… 쏙 들어가면 당겨요'
                : phase === 'bite'
                  ? '지금! 당겨요'
                  : '끌어올리는 중…'}
            <small>{phase === 'bite' ? 'E · Space · 클릭' : phase === 'wait' ? '너무 빨리 당기면 놓쳐요' : ''}</small>
          </span>
        </button>
      )}
    </div>
  );
}

/** Banner text for a caught fish (used by the village for a short line). */
export const caughtText = (fish: string, cm?: number) =>
  `${josa(FISH_BY_ID[fish]?.name ?? '물고기', '을/를')} 낚았어요${cm ? ` · ${cm}cm` : ''}!`;
