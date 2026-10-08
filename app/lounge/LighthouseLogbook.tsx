'use client';
// 범마을 등대 (lounge-lighthouse.ts): 등대 일지, one read-only page per real
// day of the village's sea notes, and the calm caption of 바다 바라보기.
import { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { logbookPages, type LogbookCatches } from '../lounge-lighthouse';
import './lighthouse.css';

export function LighthouseLogbook({
  today,
  catches,
  sailing,
  flags,
  onClose,
}: {
  /** Today's KST day. */
  today: number;
  catches?: LogbookCatches;
  sailing?: readonly number[];
  flags?: readonly string[];
  onClose: () => void;
}) {
  const pages = useMemo(() => logbookPages({ today, catches, sailing, flags }), [today, catches, sailing, flags]);
  const [at, setAt] = useState(0);
  const page = pages[Math.min(at, pages.length - 1)];
  return (
    <Modal title="등대 일지" onClose={onClose}>
      <article
        className="l-logbook"
        data-testid="lighthouse-logbook"
        data-day={page.day}
        data-storm={page.storm || undefined}
      >
        <header>
          <h3>{page.title}</h3>
          <small>{at === 0 ? '오늘 · 가붕이 적은 바다 이야기' : `${at}일 전 기록`}</small>
        </header>
        <ul>
          {page.lines.map((line, i) => (
            <li key={i} data-kind={line.kind}>
              {line.text}
            </li>
          ))}
        </ul>
        <nav className="l-logbook-pages" aria-label="일지 쪽">
          {at < pages.length - 1 ? (
            <button type="button" data-testid="logbook-older" onClick={() => setAt((n) => n + 1)}>
              ‹ 지난 쪽
            </button>
          ) : (
            <span />
          )}
          <span>
            {pages.length - at} / {pages.length}
          </span>
          {at > 0 ? (
            <button type="button" data-testid="logbook-newer" onClick={() => setAt((n) => n - 1)}>
              다음 쪽 ›
            </button>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </Modal>
  );
}

/** 바다 바라보기: a calm line over the panning view (the scene pans the camera). */
export function SeaViewCaption({ line, calm }: { line: string; calm: boolean }) {
  return (
    <output className="l-seaview" data-testid="lighthouse-seaview" aria-live="polite">
      <strong>바다 바라보기</strong>
      <span>{line}</span>
      {calm && <small>마음이 잔잔해졌어요 · 기분 조금 좋아짐</small>}
    </output>
  );
}
