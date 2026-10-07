'use client';
import { useEffect, useState } from 'react';
import { KeyHintBar, type KeyHintItem } from './KeyHint';
import { Keyboard } from './icons';
import { useSettings } from '../lounge-settings';
import { WALK_HINTS_TICK_MS, addPlayMs, loadPlayMs, walkHintsFolded } from './walk-hints-play';

/**
 * The walking-scene key strip (village, room, hall, casino, regions): the
 * player's current keys as keycaps, keycap first then the verb. Replaces the
 * sentence pills ("클릭해서 이동 · 방향키 / WASD · …").
 *
 * D16: after the first 30 minutes of play it folds to a small "키 안내" button
 * that opens it again (설정 → 화면 → 걷기 키 안내 keeps it open or folded).
 */
export function WalkHints({ act = '행동', extra = [], className = '' }: { act?: string; extra?: KeyHintItem[]; className?: string }) {
  const [settings] = useSettings();
  const mode = settings.walkHints;
  const [played, setPlayed] = useState(loadPlayMs);
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    if (mode !== 'auto') return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible') setPlayed(addPlayMs(now - last));
      last = now;
    }, WALK_HINTS_TICK_MS);
    return () => clearInterval(id);
  }, [mode]);
  const folded = open === null ? walkHintsFolded(mode, played) : !open;
  if (folded)
    return (
      <button
        type="button"
        className={`ui-walkhints ui-walkhints-fold ${className}`.trim()}
        aria-expanded="false"
        aria-label="걷기 키 안내 펼치기"
        data-testid="walkhints-fold"
        onClick={() => setOpen(true)}
      >
        <Keyboard size={15} aria-hidden="true" /> 키 안내
      </button>
    );
  return (
    <div className={`ui-walkhints-wrap ${className}`.trim()}>
      <KeyHintBar
        className="ui-walkhints"
        label="걷기 키 안내"
        items={[
          { keys: [{ label: '클릭' }], does: '걷기' },
          { keys: ['up', 'left', 'down', 'right'], does: '이동' },
          { keys: [{ label: 'Shift' }], does: '달리기' },
          { keys: ['action'], does: act },
          ...extra,
          { keys: ['menu'], does: '메뉴' },
        ]}
      />
      {(open || walkHintsFolded(mode, played)) && mode !== 'show' && (
        <button type="button" className="ui-walkhints-close" aria-expanded="true" aria-label="걷기 키 안내 접기" onClick={() => setOpen(false)}>
          접기
        </button>
      )}
    </div>
  );
}
