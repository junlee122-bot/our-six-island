'use client';
import { lazy, Suspense, useSyncExternalStore } from 'react';
import LoungeGame from './lounge-game';
import { RootBoundary } from './lounge/ErrorBoundary';
import { PcOnlyScreen, pcOnlyDevice } from './lounge/PcOnly';
import { uiKitRequested } from './ui/kit-gate';

// Dev-only primitives page (`?ui-kit` in `vinext dev`).
const UiKit = lazy(() => import('./ui/UiKit'));

const never = () => () => {};

export default function Page() {
  // Decided on the client (the server cannot see the device); null while rendering on the server.
  const pcOnly = useSyncExternalStore<boolean | null>(never, pcOnlyDevice, () => null);
  if (pcOnly === null) return null;
  if (uiKitRequested())
    return (
      <Suspense fallback={null}>
        <UiKit />
      </Suspense>
    );
  if (pcOnly) return <PcOnlyScreen />;
  return (
    <RootBoundary>
      <LoungeGame />
    </RootBoundary>
  );
}
