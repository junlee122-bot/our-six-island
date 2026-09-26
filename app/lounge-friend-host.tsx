'use client';
// The friends' tables have no dealer ("딜러 빼고 진행"): instead of 루미 /
// 매화 a small 진행 strip in the same place says whose move it is and what
// happened, with the game's badge where the host's portrait would be.
import type { ReactNode } from 'react';
import './lounge-friend-host.css';

export function FriendHost({
  symbol,
  game,
  line,
  aside,
  side,
  tone = 'calm',
  className = '',
  children,
}: {
  /** The game's badge (⚄, ?). */
  symbol: string;
  /** '야추' → '야추 테이블' on the right. */
  game: string;
  line: string;
  /** A short second line (the latest event). */
  aside?: string;
  /** Extra content at the right edge (a timer). */
  side?: ReactNode;
  tone?: 'calm' | 'turn' | 'win' | 'alert';
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={'fh-host ' + className}
      data-tone={tone}
      data-testid="friend-host"
    >
      <span className="fh-badge" aria-hidden="true">
        {symbol}
      </span>
      <div className="fh-body">
        <small className="fh-name">
          진행 <span>친구끼리 · 딜러 없이</span>
        </small>
        <p className="fh-line" aria-live="polite" key={line}>
          {line}
        </p>
        {aside && (
          <p className="fh-aside" key={aside}>
            {aside}
          </p>
        )}
        {children}
      </div>
      {side}
      <span className="fh-table">
        <b>{game} 테이블</b>
      </span>
    </div>
  );
}
