'use client';
import { useSyncExternalStore } from 'react';
import LoungeGame from './lounge-game';
import { RootBoundary } from './lounge/ErrorBoundary';
import { PcOnlyScreen, pcOnlyDevice } from './lounge/PcOnly';

const never = () => () => {};

export default function Page() {
  // Decided on the client (the server cannot see the device); null while rendering on the server.
  const pcOnly = useSyncExternalStore<boolean | null>(never, pcOnlyDevice, () => null);
  if (pcOnly === null) return null;
  if (pcOnly) return <PcOnlyScreen />;
  return (
    <RootBoundary>
      <LoungeGame />
    </RootBoundary>
  );
}
