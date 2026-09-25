'use client';
import { useState } from 'react';
import { Download, Link, Monitor } from 'lucide-react';
import { NAMES } from '../lounge-text';
import { WEB_URL } from '../desktop-bridge';
import './pc.css';

/** GitHub Releases page with the Windows and Mac installers (placeholders until the first release). */
export const RELEASES_URL = 'https://github.com/junlee122-bot/our-six-island/releases/latest';

/**
 * Phones, tablets and very narrow windows: the game needs a keyboard, a mouse
 * and at least a 1280×720 window. Decided once at start, so shrinking a
 * desktop window never throws the player out of the game.
 */
export function pcOnlyDevice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const touchOnly =
      matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
    // The screen, not the window: a narrow desktop window still opens the game.
    return touchOnly || Math.max(innerWidth, screen.width || 0) < 800;
  } catch {
    return false;
  }
}

export function PcOnlyScreen() {
  const [copied, setCopied] = useState(false);
  return (
    <main className="l-pc-only" data-testid="pc-only">
      <div className="l-pc-only-card">
        <Monitor size={40} aria-hidden="true" />
        <h1>{NAMES.app}는 PC 게임이에요</h1>
        <p>
          키보드와 마우스로 하는 게임이라 휴대폰이나 태블릿에서는 열 수 없어요. Windows나 Mac 컴퓨터에서 설치하거나, 컴퓨터 브라우저로 이 주소를 열어 주세요.
        </p>
        <div className="l-pc-only-links">
          <a href={RELEASES_URL} target="_blank" rel="noreferrer">
            <Download size={18} aria-hidden="true" /> Windows용 받기
          </a>
          <a href={RELEASES_URL} target="_blank" rel="noreferrer">
            <Download size={18} aria-hidden="true" /> Mac용 받기
          </a>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard
                ?.writeText(WEB_URL)
                .then(() => setCopied(true))
                .catch(() => {});
            }}
          >
            <Link size={18} aria-hidden="true" /> {copied ? '주소를 복사했어요' : 'PC로 보낼 주소 복사'}
          </button>
        </div>
        <small>화면이 1280×720보다 크면 편하게 놀 수 있어요.</small>
      </div>
    </main>
  );
}
