'use client';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { CloudRoom } from '../lounge-cloud-room';
import type { LoungeAction } from '../lounge-room';

type Phase = 'queued' | 'sending' | 'failed';
/** Feedback observes requests; each table still owns legality and input locking. */
export function useTableFeedback(room: CloudRoom, key: string) {
  const [scope, setScope] = useState({ key, room });
  if (scope.key !== key || scope.room !== room) setScope({ key, room });
  const [feedback, setFeedback] = useState<{ scope: typeof scope; phase: Phase } | null>(null);
  const active = useRef<object | null>(null);
  useLayoutEffect(() => {
    active.current = null;
    return () => { active.current = null; };
  }, [scope]);
  const send = useCallback(async (action: LoungeAction): Promise<boolean> => {
    const ticket = {};
    active.current = ticket;
    setFeedback({ scope, phase: 'queued' });
    try {
      const ok = await room.action(action, () => {
        if (active.current === ticket) setFeedback({ scope, phase: 'sending' });
      });
      if (active.current === ticket) {
        active.current = null;
        setFeedback(ok ? null : { scope, phase: 'failed' });
      }
      return ok;
    } catch {
      if (active.current === ticket) {
        active.current = null;
        setFeedback({ scope, phase: 'failed' });
      }
      return false;
    }
  }, [room, scope]);
  return { send, feedback: feedback?.scope === scope ? feedback.phase : null };
}
