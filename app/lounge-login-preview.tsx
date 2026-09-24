'use client';
/* These small, pre-rendered sprites also run on static GitHub Pages. */
/* oxlint-disable next/no-img-element */
import { lazy, Suspense, useState, useSyncExternalStore } from 'react';
import { Hand, RotateCcw } from 'lucide-react';
import { ACCOUNTS } from './lounge-accounts';
import { LOUNGE_ASSETS } from './lounge-assets';
import { ScreenBoundary } from './lounge/ErrorBoundary';
import './lounge-login-preview.css';

// three.js and the room models load after the login form is interactive, and
// only when the preview is on screen (phones hide it behind a toggle). A failed
// chunk just leaves the 2D preview: decoration never blocks logging in.
// LoginPortrait (used elsewhere) stays a plain image with no 3D dependency.
const LoginStudio = lazy(() =>
  import('./lounge-login-studio').then((module) => ({
    default: module.LoginStudio,
  })),
);
// Keep in sync with the login layout breakpoint in lounge.css.
const WIDE_LOGIN = '(min-width: 801px) and (min-height: 521px)';
function subscribeWide(change: () => void) {
  const query = matchMedia(WIDE_LOGIN);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
}
const wideLogin = () => matchMedia(WIDE_LOGIN).matches;

const LOGIN_FIGURES = [
  LOUNGE_ASSETS.loginDowon,
  LOUNGE_ASSETS.loginGangjae,
  LOUNGE_ASSETS.loginMinseo,
  LOUNGE_ASSETS.loginSeungjun,
  LOUNGE_ASSETS.loginMinjae,
  LOUNGE_ASSETS.loginJaemin,
  LOUNGE_ASSETS.loginHohyeon,
];

export function LoginPortrait({ actor }: { actor: number }) {
  return (
    <span className="l-login-portrait" aria-hidden="true">
      <img src={LOGIN_FIGURES[actor]} alt="" width={440} height={540} />
    </span>
  );
}

export function LoginCharacterPreview({
  actor,
  open = false,
}: {
  actor: number;
  /** The phone layout's "미리보기" toggle is open (the preview is visible). */
  open?: boolean;
}) {
  const [replay, setReplay] = useState(0);
  const wide = useSyncExternalStore(subscribeWide, wideLogin, () => false);
  const friend = ACCOUNTS[actor];
  return (
    <div className="l-login-preview" data-actor={actor}>
      <div className="l-login-stage">
        <div className="l-login-room-label">
          <span /> 우리들의 거실
        </div>
        {(wide || open) && (
          <ScreenBoundary name="login-studio" fallback={null}>
            <Suspense fallback={null}>
              <LoginStudio />
            </Suspense>
          </ScreenBoundary>
        )}
        <span className="l-login-shadow" aria-hidden="true" />
        <div className="l-login-entrance" key={`${actor}-${replay}`}>
          <img
            className="l-login-character"
            src={LOGIN_FIGURES[actor]}
            alt={`${friend.name} 2D 캐릭터`}
            width={440}
            height={540}
            fetchPriority="high"
            draggable={false}
          />
          <span className="l-login-wave" aria-hidden="true">
            <Hand size={24} />
          </span>
        </div>
        <p className="l-login-greeting" aria-live="polite" aria-atomic="true">
          <strong>{friend.name}</strong>
          <span>어서 와, 같이 놀자!</span>
        </p>
      </div>
      <div className="l-login-caption">
        <span>
          <strong>{friend.name}의 하루를 시작해요</strong>
          <small>{friend.username} · 나의 캐릭터</small>
        </span>
        <button
          type="button"
          className="l-login-replay"
          onClick={() => setReplay((value) => value + 1)}
          aria-label="다시 인사하기"
        >
          <RotateCcw size={14} /> 다시 인사
        </button>
      </div>
    </div>
  );
}
