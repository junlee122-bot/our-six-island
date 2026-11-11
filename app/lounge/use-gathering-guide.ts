'use client';
import { useCallback, useEffect, useState } from 'react';
import type { GatheringPlaceId } from '../lounge-gatherings-data';
import { gatheringNavigation } from '../lounge-gatherings-navigation';
import { INTERIOR_GO_EVENT } from '../lounge-interior-layout';
import { boundAction, boundDirection } from '../lounge-scene-keys';
import type { Notify } from './Toast';

/** Follow existing doors one walking step at a time; never changes area or seats. */
export function useGatheringGuide({
  area, blockedReason, paused, notify,
}: {
  area: string;
  blockedReason?: string;
  paused: boolean;
  notify: Notify;
}) {
  const [target, setTarget] = useState<{ place: GatheringPlaceId; until: number } | null>(null);
  const start = useCallback((place: GatheringPlaceId) => {
    if (blockedReason) { notify(blockedReason, 'info'); return; }
    setTarget({ place, until: Date.now() + 5 * 60_000 });
  }, [blockedReason, notify]);

  useEffect(() => {
    if (!target) return;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const step = () => {
      if (blockedReason || paused || Date.now() > target.until) { setTarget(null); return; }
      const next = gatheringNavigation(target.place, area);
      if (next.kind === 'unavailable') {
        notify(next.message, 'info'); setTarget(null); return;
      }
      const selector = next.kind === 'room' ? '[data-testid="bedroom-3d"]'
        : next.kind === 'interior' ? '[data-testid="interior-3d"]'
        : area === 'village' ? '[data-testid="village-3d"]' : '[data-testid="area-3d"]';
      const host = document.querySelector<HTMLElement>(selector);
      if (!host?.getClientRects().length || document.querySelector('dialog[open]')) {
        if (++attempts < 40) timer = setTimeout(step, 250);
        else { notify('장소가 열린 뒤 모임 길 안내를 다시 눌러 주세요.', 'info'); setTarget(null); }
        return;
      }
      window.dispatchEvent(new CustomEvent(next.kind === 'interior' ? INTERIOR_GO_EVENT
        : next.kind === 'room' ? 'bumtadew:room-go' : 'bumtadew:go', { detail: next.point }));
      notify(next.final ? `${next.label} 쪽으로 걸어가요. ${next.hint}`
        : `${next.label} 쪽으로 걸어가요. 도착하면 E로 이동해요. 문을 지나면 다음 길을 안내해요.`, 'info');
      if (next.final) setTarget(null);
    };
    timer = setTimeout(step, blockedReason || paused ? 0 : 600);
    return () => clearTimeout(timer);
  }, [target, area, blockedReason, paused, notify]);

  useEffect(() => {
    if (!target) return;
    const key = (event: KeyboardEvent) => {
      const action = boundAction(event);
      if (boundDirection(event) || event.code === 'Escape' || (action && action !== 'action')) setTarget(null);
    };
    const pointer = (event: PointerEvent) => {
      if (event.target instanceof HTMLCanvasElement) setTarget(null);
    };
    window.addEventListener('keydown', key, true);
    window.addEventListener('pointerdown', pointer, true);
    return () => {
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('pointerdown', pointer, true);
    };
  }, [target]);
  return start;
}
