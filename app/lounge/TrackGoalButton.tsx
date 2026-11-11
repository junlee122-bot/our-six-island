'use client';
import { useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  additionalCraftTarget,
  readCraftTargets,
  targetKey,
  type CraftTargetKind,
} from '../lounge-craft-tracker';
import { GameButton } from '../ui/GameButton';
import type { Notify } from './Toast';

/** A recipe pins the extra output selected here as a total ownership goal. */
export function TrackGoalButton({
  room,
  view,
  notify,
  kind,
  id,
  quantity = 1,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  kind: CraftTargetKind;
  id: string;
  /** Finished units to add to what I already own, not recipe batches. */
  quantity?: number;
}) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const life = view.life;
  const actor = life?.actors[view.self];
  const targets = readCraftTargets(life?.me.craftTargets);
  const key = targetKey({ kind, id });
  const existing = targets.find((target) => targetKey(target) === key);
  const proposal = life
    ? additionalCraftTarget(life, { kind, id }, quantity, actor)
    : null;
  const target = existing ?? proposal?.target;
  const full = !existing && targets.length >= 3;
  const change = async () => {
    if (!life || !target || pending.current || full) return;
    pending.current = true;
    setBusy(true);
    try {
      const ok = await room.life({
        kind: 'craftTarget',
        op: existing ? 'remove' : 'pin',
        target: existing ?? target,
      });
      if (ok)
        notify(
          existing
            ? '제작 목표의 고정을 풀었어요.'
            : '성장 수첩의 제작 목표에 고정했어요.',
        );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <GameButton
      size="s"
      variant="ghost"
      glyph="pin"
      aria-pressed={!!existing}
      disabled={!life || !target || busy || full}
      disabledReason={
        full
          ? '목표는 세 개까지 고정할 수 있어요. 성장 수첩에서 하나를 풀어 주세요.'
          : !target
            ? (proposal?.problem ?? undefined)
            : undefined
      }
      title={
        kind === 'facility'
          ? '이 종류의 시설 한 곳을 보유하는 목표예요.'
          : undefined
      }
      onClick={() => void change()}
      data-testid={`track-goal-${kind}-${id}`}
    >
      {existing ? '고정 해제' : '목표로 고정'}
    </GameButton>
  );
}
