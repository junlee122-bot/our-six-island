'use client';
// 점검 중 화면: "범타듀 밸리가 예뻐지는 중". Shown over everything while the
// server's maintenance switch is on (lounge-maintenance.ts); it asks again
// every 20 seconds and disappears by itself, so nobody has to reload.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { pingMaintenance } from '../lounge-auth';
import { maintenanceNow, maintenanceUntilText, subscribeMaintenance } from '../lounge-maintenance';
import { GameButton } from '../ui/GameButton';
import './maintenance.css';

const CHECK_MS = 20_000;

/** The current notice (null while the village is open). */
export function useMaintenance() {
  return useSyncExternalStore(subscribeMaintenance, maintenanceNow, () => null);
}

export function MaintenanceScreen() {
  const notice = useMaintenance();
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const check = async () => {
    setChecking(true);
    try {
      await pingMaintenance();
    } catch {
      // No answer yet: keep the page and try again on the next tick.
    } finally {
      setChecking(false);
      setNow(Date.now());
    }
  };
  useEffect(() => {
    if (!notice) return;
    const id = setInterval(() => void check(), CHECK_MS);
    return () => clearInterval(id);
  }, [notice]);
  if (!notice) return null;
  const until = maintenanceUntilText(notice, now);
  return (
    <main className="l-fix" role="alertdialog" aria-modal="true" aria-labelledby="l-fix-title" aria-describedby="l-fix-text" data-testid="maintenance">
      <div className="l-fix-sky" aria-hidden="true">
        <i className="l-fix-cloud is-a" />
        <i className="l-fix-cloud is-b" />
        <i className="l-fix-spark is-a" />
        <i className="l-fix-spark is-b" />
        <i className="l-fix-spark is-c" />
      </div>
      <svg className="l-fix-scene" viewBox="0 0 320 150" aria-hidden="true">
        <path className="l-fix-hill" d="M8 122 C60 96 110 102 160 108 S272 96 312 118 C306 136 262 146 160 146 S14 138 8 122z" />
        <g className="l-fix-house">
          <path className="l-fix-wall" d="M70 78 h70 v46 h-70z" />
          <path className="l-fix-roof" d="M62 80 l43 -34 l43 34z" />
          <path className="l-fix-door" d="M98 98 h16 v26 h-16z" />
          <path className="l-fix-window" d="M78 90 h14 v12 h-14z" />
          <path className="l-fix-wet" d="M120 90 h14 v12 h-14z" />
        </g>
        <g className="l-fix-ladder">
          <path d="M168 124 L186 52 M182 124 L200 52" />
          <path d="M171 112 h14 M174 98 h14 M178 84 h14 M181 70 h14" />
        </g>
        <g className="l-fix-roller">
          <path className="l-fix-stick" d="M196 58 l-26 -22" />
          <path className="l-fix-paint" d="M156 26 h26 v12 h-26z" />
        </g>
        <g className="l-fix-flowers">
          <circle cx="232" cy="116" r="5" />
          <circle cx="246" cy="112" r="5" />
          <circle cx="260" cy="117" r="5" />
          <path d="M232 121 v10 M246 117 v14 M260 122 v9" />
        </g>
        <path className="l-fix-sign" d="M268 92 h40 v20 h-40z M286 112 v18" />
      </svg>
      <section className="l-fix-card">
        <small>잠깐 점검 중</small>
        <h1 id="l-fix-title">범타듀 밸리가 예뻐지는 중</h1>
        <p id="l-fix-text">
          마을 사람들이 길을 쓸고 지붕을 새로 칠하고 있어요. 끝나면 이 화면이 저절로 사라지고 마을로 돌아가요.
        </p>
        {notice.note && <p className="l-fix-note">{notice.note}</p>}
        {until && <p className="l-fix-until">{until} 다시 열려요</p>}
        <p className="l-fix-safe">가방, 텃밭, 돈은 그대로 있어요. 점검 중에는 아무것도 사라지지 않아요.</p>
        <GameButton variant="primary" glyph="refresh" disabled={checking} onClick={() => void check()}>
          {checking ? '확인하는 중…' : '지금 다시 확인'}
        </GameButton>
        <span className="l-fix-auto">20초마다 저절로 확인해요</span>
      </section>
    </main>
  );
}
