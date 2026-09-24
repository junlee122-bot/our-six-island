'use client';
import { useEffect, useRef, useState } from 'react';
import { CloudCheck, CloudOff, CloudUpload } from 'lucide-react';

const SAVED = '서버에 저장됨';

/**
 * Quiet auto-save indicator: nothing while everything is saved, a small cloud
 * while saving, a brief check after a save, and a retry button only on failure.
 */
export function SaveStatus({
  status,
  onRetry,
}: {
  status: string;
  onRetry: () => void;
}) {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [justSaved, setJustSaved] = useState(false);
  const previous = useRef(status);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  useEffect(() => {
    const was = previous.current;
    previous.current = status;
    if (status !== SAVED || was === SAVED) return;
    setJustSaved(true);
    const timer = setTimeout(() => setJustSaved(false), 1600);
    return () => clearTimeout(timer);
  }, [status]);

  const saving = status === '저장 대기' || status === '저장 중…';
  const failed = status !== SAVED && !saving;
  if (online && !saving && !failed && !justSaved) return null;
  return (
    <div
      className={
        'l-save-status' +
        (failed || !online ? ' is-problem' : '') +
        (saving ? ' is-saving' : '')
      }
      role={failed ? 'alert' : 'status'}
      data-testid="save-status"
    >
      {!online ? (
        <>
          <CloudOff size={15} aria-hidden="true" />
          <span>오프라인 · 연결되면 저장돼요</span>
        </>
      ) : failed ? (
        <>
          <CloudOff size={15} aria-hidden="true" />
          <span>{status}</span>
          <button type="button" onClick={onRetry}>
            다시 저장
          </button>
        </>
      ) : saving ? (
        <>
          <CloudUpload size={15} aria-hidden="true" />
          <span className="l-sr">저장 중</span>
        </>
      ) : (
        <>
          <CloudCheck size={15} aria-hidden="true" />
          <span className="l-sr">저장됨</span>
        </>
      )}
    </div>
  );
}
