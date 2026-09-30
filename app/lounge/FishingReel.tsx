'use client';
// 손맛 겨루기: the reel fight after a hooked bite (design-fishing-upgrade §4).
// The same integer simulation as the server (lounge-fish-minigame) runs here
// at 40 ticks a second; the hold/release runs are recorded and sent back, and
// the server replays them. Hold the action key, Space, Enter, ↑ or the mouse
// button to lift the green zone; let go and it sinks.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FightSim, FULL, TICK_MS, TRACK, TraceRecorder, type FightResult, type FightSetup } from '../lounge-fish-minigame';
import { boundAction } from '../lounge-scene-keys';
import { KeyHintBar } from '../ui/KeyHint';
import { Glyph } from '../ui/Glyph';
import { lifeSfx } from '../lounge-audio-life';
import './fishing-reel.css';

/** Ticks simulated per animation frame at most (a stalled tab never fast-forwards the fight). */
const MAX_STEPS_PER_FRAME = 6;
const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(2)}%`;

export function FishingReel({
  setup,
  behaviourName,
  difficulty,
  onDone,
}: {
  setup: FightSetup;
  behaviourName: string;
  difficulty: number;
  onDone: (runs: number[], result: FightResult) => void;
}) {
  const track = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const hold = useRef(false);
  const [status, setStatus] = useState('물고기가 걸렸어요. 초록 칸 안에 물고기를 잡아 두세요.');
  const [pressed, setPressed] = useState(false);
  const done = useRef(onDone);
  useLayoutEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const sim = new FightSim(setup),
      rec = new TraceRecorder(),
      el = root.current,
      tr = track.current;
    let raf = 0,
      last = performance.now(),
      acc = 0,
      spoke = 0,
      chest = sim.state.treasure,
      finished = false;
    const paint = () => {
      if (!el || !tr) return;
      const s = sim.state;
      el.style.setProperty('--zone-y', pct(s.barY, TRACK));
      el.style.setProperty('--zone-h', pct(setup.bar, TRACK));
      el.style.setProperty('--fish-y', pct(s.fishY, TRACK));
      el.style.setProperty('--progress', pct(s.progress, FULL));
      el.style.setProperty('--chest-p', pct(s.treasureProgress, FULL));
      if (setup.treasure) el.style.setProperty('--chest-y', pct(setup.treasure.pos, TRACK));
      tr.dataset.inside = sim.inZone() ? 'true' : 'false';
      tr.dataset.chest = s.treasure;
    };
    const frame = (t: number) => {
      acc += Math.min(250, t - last);
      last = t;
      let steps = 0;
      while (acc >= TICK_MS && steps < MAX_STEPS_PER_FRAME && !sim.state.done) {
        rec.push(hold.current);
        sim.step(hold.current);
        acc -= TICK_MS;
        steps++;
      }
      if (steps === MAX_STEPS_PER_FRAME) acc = 0;
      const s = sim.state;
      if (s.treasure !== chest) {
        if (s.treasure === 'active') lifeSfx('sparkle');
        if (s.treasure === 'got') lifeSfx('pickup');
        chest = s.treasure;
      }
      paint();
      if (t - spoke > 1_500) {
        spoke = t;
        setStatus(`게이지 ${Math.round((s.progress / FULL) * 100)}%${s.treasure === 'active' ? ' · 보물 상자가 떴어요' : ''}`);
      }
      if (s.done && !finished) {
        finished = true;
        setStatus(s.done === 'caught' ? '낚았어요!' : '물고기가 달아났어요.');
        done.current(rec.toRuns(), sim.result());
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    paint();
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [setup]);

  // Input: hold keys / the mouse button; letting go anywhere releases.
  useEffect(() => {
    const isHoldKey = (e: KeyboardEvent) => boundAction(e) === 'action' || e.code === 'Space' || e.key === 'Enter' || e.code === 'ArrowUp' || e.code === 'KeyW';
    const set = (v: boolean) => {
      hold.current = v;
      setPressed(v);
    };
    const down = (e: KeyboardEvent) => {
      if (!isHoldKey(e)) return;
      e.preventDefault();
      e.stopPropagation();
      set(true);
    };
    const up = (e: KeyboardEvent) => {
      if (!isHoldKey(e)) return;
      e.preventDefault();
      e.stopPropagation();
      set(false);
    };
    const release = () => set(false);
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    root.current?.querySelector<HTMLButtonElement>('.l-reel-hold')?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
    };
  }, []);

  const level = difficulty >= 80 ? '아주 어려움' : difficulty >= 60 ? '어려움' : difficulty >= 35 ? '보통' : '쉬움';
  return (
    <div ref={root} className="l-reel" data-testid="fish-reel" data-pressed={pressed || undefined}>
      <button
        type="button"
        className="l-reel-hold"
        aria-label="손맛 겨루기: 누르고 있으면 초록 칸이 올라가요"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          hold.current = true;
          setPressed(true);
        }}
        onClick={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span ref={track} className="l-reel-track" aria-hidden="true">
        <span className="l-reel-water" />
        <span className="l-reel-zone" />
        <span className="l-reel-chest">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M3 10 h18 v10 H3z" className="l-reel-chest-box" />
            <path d="M3 10 C3 5 21 5 21 10" className="l-reel-chest-lid" />
            <path d="M11 12 h2 v3 h-2z" className="l-reel-chest-lock" />
          </svg>
          <span className="l-reel-chest-ring" />
        </span>
        <span className="l-reel-fish">
          <Glyph name="fish" size={26} />
        </span>
        </span>
        <span className="l-reel-gauge" aria-hidden="true">
          <span />
        </span>
      </button>
      <div className="l-reel-side">
        <p className="l-reel-kind">
          <strong>{behaviourName}</strong>
          <small>{level}</small>
        </p>
        <p className="l-reel-help">
          누르고 있으면 초록 칸이 올라가고, 떼면 내려가요. 물고기를 칸 안에 두면 오른쪽 게이지가 차요.
        </p>
        <p className="l-reel-status" role="status" aria-live="polite">
          {status}
        </p>
        <KeyHintBar
          items={[
            { keys: ['action', { code: 'Space' }], does: '누르고 있기' },
            { keys: [{ label: '마우스' }], does: '누르고 있기' },
            { keys: [{ code: 'Escape' }], does: '놓아 주기' },
          ]}
        />
      </div>
    </div>
  );
}
