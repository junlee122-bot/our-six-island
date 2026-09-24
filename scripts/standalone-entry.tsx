import { createRoot } from 'react-dom/client';
import '../app/globals.css';
import '../app/lounge.css';
import '../app/lounge-casino.css';
import '../app/lounge-blackjack.css';
import '../app/lounge-seotda.css';
import Game from '../app/lounge-game';
import { RootBoundary } from '../app/lounge/ErrorBoundary';
import '../app/lounge-club.css';

createRoot(document.getElementById('root')!).render(
  <RootBoundary>
    <Game />
  </RootBoundary>,
);
