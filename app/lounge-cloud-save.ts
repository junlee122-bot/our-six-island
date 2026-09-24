import { useCallback, useEffect, useRef, useState } from 'react';
import { accountSave, type AccountProfile } from './lounge-accounts';
import { AccountError, cloudCall } from './lounge-auth';
import {
  readAccountDraft,
  restoreAccountDraft,
  type AccountDraft,
} from './lounge-cloud-draft';
import type { LoungeSave } from './lounge-look';
import { friendlyError } from './lounge/feedback';
type SaveReply = {
  conflict: boolean;
  save: LoungeSave;
  revision: number;
  updatedAt: string;
};
export function useCloudSave(account: AccountProfile) {
  const initial = accountSave(account.save, account.actor);
  const [save, setSave] = useState(initial),
    [status, setStatus] = useState('서버에 저장됨'),
    [conflict, setConflict] = useState<SaveReply | null>(null),
    [draft, setDraft] = useState<AccountDraft | null>(null),
    /** 409 (app outdated / server behind) or 413 (too large): retrying won't help. */
    [blocked, setBlocked] = useState('');
  const state = useRef({
    current: initial,
    committed: JSON.stringify(initial),
    revision: account.revision,
    conflict: null as SaveReply | null,
    pending: null as Promise<boolean> | null,
    disposed: false,
    blocked: false,
  });
  const draftKey = 'hohyeon-draft-' + account.id;
  useEffect(() => {
    const current = state.current;
    current.disposed = false;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = readAccountDraft(raw, account.actor, current.current);
        if (JSON.stringify(d.save) !== current.committed)
          queueMicrotask(() => {
            if (!current.disposed) setDraft(d);
          });
      }
    } catch {}
    return () => {
      current.disposed = true;
    };
  }, [draftKey, account.actor]);
  const change = useCallback(
    (value: LoungeSave | ((s: LoungeSave) => LoungeSave)) => {
      const next = accountSave(
        typeof value === 'function' ? value(state.current.current) : value,
        account.actor,
      );
      state.current.current = next;
      setSave(next);
      setStatus('저장 대기');
      try {
        localStorage.setItem(draftKey, JSON.stringify(next));
      } catch {}
    },
    [account.actor, draftKey],
  );
  const flush = useCallback(async () => {
    const s = state.current;
    if (s.pending) return s.pending;
    if (s.conflict || s.disposed || s.blocked) return false;
    const run = async () => {
      try {
        while (JSON.stringify(s.current) !== s.committed) {
          if (s.disposed) return false;
          const value = s.current,
            raw = JSON.stringify(value);
          setStatus('저장 중…');
          const r = await cloudCall<SaveReply>(
            'hohyeon-api',
            {
              op: 'save',
              revision: s.revision,
              save: value,
            },
            true,
            account.id,
          );
          if (r.conflict) {
            s.conflict = r;
            setConflict(r);
            setStatus('다른 창에서 변경됨');
            return false;
          }
          s.revision = r.revision;
          s.committed = raw;
        }
        setStatus('서버에 저장됨');
        try {
          if (localStorage.getItem(draftKey) === s.committed)
            localStorage.removeItem(draftKey);
        } catch {}
        return true;
      } catch (e) {
        if (
          e instanceof AccountError &&
          (e.status === 409 || e.status === 413)
        ) {
          s.blocked = true;
          setBlocked(friendlyError(e, '저장할 수 없어요. 새로고침해 주세요.'));
          setStatus('저장 멈춤 · 새로고침 필요');
          return false;
        }
        // Keep the status short; raw (possibly English) details go to the console.
        friendlyError(e);
        setStatus('저장하지 못했어요 · 다시 시도해 주세요');
        return false;
      } finally {
        s.pending = null;
      }
    };
    s.pending = run();
    const result = await s.pending;
    s.pending = null;
    return result;
  }, [draftKey, account.id]);
  useEffect(() => {
    const timer = setTimeout(() => void flush(), 900);
    return () => clearTimeout(timer);
  }, [save, flush]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(state.current.current) !== state.current.committed) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  const resolve = (useMine: boolean) => {
    const r = state.current.conflict;
    if (!r) return;
    state.current.revision = r.revision;
    state.current.committed = JSON.stringify(
      accountSave(r.save, account.actor),
    );
    state.current.conflict = null;
    setConflict(null);
    if (!useMine) change(accountSave(r.save, account.actor));
    void flush();
  };
  return {
    save,
    change,
    flush,
    status,
    conflict,
    blocked,
    resolve,
    draft: draft?.save ?? null,
    restoreDraft: () => {
      if (draft)
        change((current) => restoreAccountDraft(draft, account.actor, current));
      setDraft(null);
    },
    dismissDraft: () => {
      setDraft(null);
      try {
        localStorage.removeItem(draftKey);
      } catch {}
    },
  };
}
