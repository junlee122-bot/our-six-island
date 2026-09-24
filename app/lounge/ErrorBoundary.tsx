'use client';
import {
  Component,
  lazy,
  type ComponentType,
  type ReactNode,
} from 'react';

const RELOAD_KEY = 'bumtadew-chunk-reload-v1';
/** A second automatic reload is allowed only after this long (no reload loops). */
const RELOAD_COOLDOWN_MS = 60_000;

/** True for "a code-split file could not be fetched" (usually after a redeploy). */
export function isChunkError(error: unknown) {
  const message =
    error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported|Loading (CSS )?chunk|Unable to preload CSS|ChunkLoadError/i.test(
    message,
  );
}

/**
 * Reloads the page once so an old tab picks up the new deployment's files.
 * Returns false (and does nothing) when it already reloaded a moment ago.
 */
export function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  location.reload();
  return true;
}

/** Failed lazy screens; a boundary's retry button lets them import again. */
const failedLazies = new Set<() => void>();
function resetFailedLazies() {
  for (const reset of failedLazies) reset();
  failedLazies.clear();
}

/**
 * React.lazy that (1) reloads the page once when a chunk is gone after a
 * redeploy, and (2) imports again after a boundary retry (a plain lazy() would
 * keep its failed result forever). A failed lazy is only replaced on retry, so
 * React surfaces the error instead of suspending on a fresh import forever.
 */
export function lazyRetry<T extends ComponentType<never>>(
  factory: () => Promise<{ default: T }>,
): T & { preload: () => void } {
  type Loaded = { default: T };
  // Once loaded, render the component directly: suspending again (even for a
  // cached chunk) would show the fallback for React's ~300ms throttle.
  let ready: ComponentType<object> | null = null;
  const load = (): Promise<Loaded> =>
    factory().then(
      (module) => {
        ready = module.default as unknown as ComponentType<object>;
        return module;
      },
      (error: unknown): Promise<Loaded> => {
        failedLazies.add(reset);
        // Never resolves: the page is about to reload.
        if (isChunkError(error) && reloadOnce()) return new Promise(() => {});
        throw error;
      },
    );
  const make = () =>
    lazy(load as unknown as () => Promise<{ default: ComponentType<object> }>);
  let current = make();
  function reset() {
    current = make();
  }
  function LazyRetry(props: object) {
    const Current = ready ?? current;
    return <Current {...props} />;
  }
  /** Starts the download early (no reload here; the screen handles errors). */
  LazyRetry.preload = () => {
    if (ready) return;
    factory().then(
      (module) => {
        ready = module.default as unknown as ComponentType<object>;
      },
      () => {},
    );
  };
  return LazyRetry as unknown as T & { preload: () => void };
}

/** A failure message with actions (no spinner, so it never looks like loading). */
export function ErrorState({
  title,
  body,
  onRetry,
  retryLabel = '다시 불러오기',
  onBack,
  backLabel,
  compact,
}: {
  title: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onBack?: () => void;
  backLabel?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={'l-empty l-error-state' + (compact ? '' : ' l-screen-loading')}
      role="alert"
    >
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {(onRetry || onBack) && (
        <div className="l-error-actions">
          {onRetry && (
            <button type="button" className="l-primary" onClick={onRetry}>
              {retryLabel}
            </button>
          )}
          {onBack && backLabel && (
            <button type="button" className="l-secondary" onClick={onBack}>
              {backLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type Fallback = ReactNode | ((retry: () => void, chunk: boolean) => ReactNode);

/** Keeps one broken screen (e.g. WebGL village) from blanking the whole app. */
export class ScreenBoundary extends Component<
  { fallback: Fallback; children: ReactNode; name: string },
  { failed: boolean; chunk: boolean }
> {
  state = { failed: false, chunk: false };
  static getDerivedStateFromError(error: unknown) {
    return { failed: true, chunk: isChunkError(error) };
  }
  componentDidCatch(error: unknown) {
    console.warn('[범타듀 밸리] 화면 오류:', this.props.name, error);
  }
  retry = () => {
    resetFailedLazies();
    this.setState({ failed: false, chunk: false });
  };
  render() {
    if (!this.state.failed) return this.props.children;
    const { fallback } = this.props;
    return typeof fallback === 'function'
      ? fallback(this.retry, this.state.chunk)
      : fallback;
  }
}

/** Last-resort boundary for the whole app: a Korean message and a reload button. */
export class RootBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[범타듀 밸리] 앱 오류:', error);
    if (isChunkError(error)) reloadOnce();
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="l-app l-root-error">
        <ErrorState
          title="화면을 여는 중에 문제가 생겼어요."
          body="새 버전이 올라왔거나 연결이 잠깐 끊겼을 수 있어요. 새로 고치면 저장된 내용은 그대로예요."
          retryLabel="새로 고치기"
          onRetry={() => location.reload()}
        />
      </main>
    );
  }
}
