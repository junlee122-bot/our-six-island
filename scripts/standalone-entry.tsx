import { createRoot } from 'react-dom/client';
import '../app/globals.css';
import '../app/lounge.css';
import '../app/lounge-casino.css';
import '../app/lounge-blackjack.css';
import '../app/lounge-seotda.css';
import Game from '../app/lounge-game';
import { RootBoundary } from '../app/lounge/ErrorBoundary';
import { PcOnlyScreen, pcOnlyDevice } from '../app/lounge/PcOnly';
import { installDesktopShortcuts } from '../app/desktop-bridge';
import '../app/lounge-club.css';

// 범타듀 밸리 is a PC game: phones and tablets get a short "open it on a
// computer" screen instead of the game.
installDesktopShortcuts();
createRoot(document.getElementById('root')!).render(
  pcOnlyDevice() ? (
    <PcOnlyScreen />
  ) : (
    <RootBoundary>
      <Game />
    </RootBoundary>
  ),
);
