import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '../app/globals.css';
import '../app/ui/fonts.css';
import '../app/ui/tokens.css';
import '../app/lounge.css';
import '../app/lounge-casino.css';
import '../app/lounge-blackjack.css';
import '../app/lounge-seotda.css';
import Game from '../app/lounge-game';
import { RootBoundary } from '../app/lounge/ErrorBoundary';
import { PcOnlyScreen, pcOnlyDevice } from '../app/lounge/PcOnly';
import { installDesktopShortcuts } from '../app/desktop-bridge';
import { uiKitRequested } from '../app/ui/kit-gate';
import '../app/lounge-club.css';
import '../app/ui/ui.css';

declare const __UI_KIT__: boolean;

// 범타듀 밸리 is a PC game: phones and tablets get a short "open it on a
// computer" screen instead of the game.
installDesktopShortcuts();
const root = createRoot(document.getElementById('root')!);
if (__UI_KIT__ && uiKitRequested()) {
  // Dev-only primitives page (`?ui-kit`, builds made with UI_KIT=1; dropped otherwise).
  const UiKit = lazy(() => import('../app/ui/UiKit'));
  root.render(
    <Suspense fallback={null}>
      <UiKit />
    </Suspense>,
  );
} else {
  root.render(
    pcOnlyDevice() ? (
      <PcOnlyScreen />
    ) : (
      <RootBoundary>
        <Game />
      </RootBoundary>
    ),
  );
}
