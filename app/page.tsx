'use client';
import LoungeGame from './lounge-game';
import { RootBoundary } from './lounge/ErrorBoundary';

export default function Page() {
  return (
    <RootBoundary>
      <LoungeGame />
    </RootBoundary>
  );
}
