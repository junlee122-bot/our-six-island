'use client';
// 새 소식 on the 마을 게시판: what changed, newest first (lounge-changelog.ts).
// Opening it marks everything as seen on this device.
import { useEffect } from 'react';
import { CHANGELOG, LATEST_CHANGE } from '../lounge-changelog';
import { remember } from '../lounge-settings';
import './whats-new.css';

export const WHATS_NEW_KEY = 'bumtadew-whatsnew-seen';

export function WhatsNew() {
  useEffect(() => {
    remember(WHATS_NEW_KEY, LATEST_CHANGE);
    window.dispatchEvent(new Event('bumtadew:whatsnew'));
  }, []);
  return (
    <div className="l-news" data-testid="whats-new">
      {CHANGELOG.map((c) => (
        <article key={c.id} className="l-news-entry">
          <header>
            <time>{c.date}</time>
            <h3>{c.title}</h3>
          </header>
          <ul>
            {c.items.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {c.known && c.known.length > 0 && (
            <div className="l-news-known">
              <strong>알고 있는 문제</strong>
              <ul>
                {c.known.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
