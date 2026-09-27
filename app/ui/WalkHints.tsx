'use client';
import { KeyHintBar, type KeyHintItem } from './KeyHint';

/**
 * The walking-scene key strip (village, room, hall, casino, regions): the
 * player's current keys as keycaps, keycap first then the verb. Replaces the
 * sentence pills ("클릭해서 이동 · 방향키 / WASD · …").
 */
export function WalkHints({ act = '행동', extra = [], className = '' }: { act?: string; extra?: KeyHintItem[]; className?: string }) {
  return (
    <KeyHintBar
      className={`ui-walkhints ${className}`.trim()}
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
  );
}
