'use client';
// 내 취향: a one-time gentle banner for a friend who has not chosen tastes
// yet, once per device (lounge-friend-tastes.ts). Kept out of the window's
// chunk so the game screen only loads this small hook.
import { useEffect, useRef } from 'react';
import type { CloudRoomView } from '../lounge-cloud-room';
import type { PushBanner } from './Toast';

export const TASTES_PROMPT_KEY = 'bumtadew-tastes-prompt-v1';
export const TASTES_PROMPT_TEXT = '친구들이 선물 고를 때 참고할 내 취향을 정해 주세요.';

export function useTastesPrompt(view: CloudRoomView, actor: number, paused: boolean, push: PushBanner, open: () => void) {
  const done = useRef(false);
  const unset = view.life?.tastes ? !view.life.tastes.all[actor]?.set : false;
  useEffect(() => {
    if (done.current || paused || !unset) return;
    done.current = true;
    try {
      if (localStorage.getItem(TASTES_PROMPT_KEY) !== null) return;
      localStorage.setItem(TASTES_PROMPT_KEY, 'seen');
    } catch {
      // Private mode: no memory, so no nagging either.
      return;
    }
    push('info', TASTES_PROMPT_TEXT, { key: 'tastes-prompt', action: { label: '정하기', run: open } });
  }, [unset, paused, push, open]);
}
