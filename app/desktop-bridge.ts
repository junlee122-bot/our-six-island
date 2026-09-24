// Desktop (Tauri) bridge for 범타듀 밸리.
//
// Every export is a safe no-op in a normal browser tab: the bridge only does
// something when the page runs inside the desktop shell in desktop/src-tauri,
// which exposes `window.__TAURI__` (tauri.conf.json → app.withGlobalTauri).
// Nothing here imports @tauri-apps/api, so the web bundle does not grow.
//
// Not wired into the game yet. Integration points (see desktop/README.md):
//   - app/lounge/feedback.ts `attention()` → `desktopNotify()` when
//     `isDesktopApp()` (and `desktopWindowFocused()` instead of tabHidden()).
//   - app/lounge/feedback.ts `renderTitle()` → `setDesktopTitle()`.
//   - app/lounge/SettingsModal.tsx notification toggle →
//     `requestDesktopNotificationPermission()`.
//   - app/lounge/FriendsModal.tsx `link()` and app/multiplayer-ui.tsx →
//     `shareableInviteUrl('lounge', code)` (tauri://localhost links are useless
//     to friends).
//   - app/lounge/SettingsModal.tsx → a "전체 화면 (F11)" button calling
//     `toggleDesktopFullscreen()` and an "업데이트 확인" button calling
//     `checkForDesktopUpdate()`.
//   - scripts/standalone-entry.tsx → `installDesktopShortcuts()` once at start
//     (the shell already injects F11; this is the fallback).

/** Public web build; invite links from the desktop app point here. */
export const WEB_URL = 'https://junlee122-bot.github.io/our-six-island/';

type Unlisten = () => void;

interface TauriWindowHandle {
  isFullscreen(): Promise<boolean>;
  setFullscreen(fullscreen: boolean): Promise<void>;
  setTitle(title: string): Promise<void>;
  isFocused(): Promise<boolean>;
  setFocus(): Promise<void>;
  unminimize(): Promise<void>;
  requestUserAttention(type: number | null): Promise<void>;
  onFocusChanged(
    handler: (event: { payload: boolean }) => void,
  ): Promise<Unlisten>;
}

interface TauriUpdate {
  version: string;
  body?: string;
  downloadAndInstall(): Promise<void>;
}

interface TauriGlobal {
  window?: { getCurrentWindow(): TauriWindowHandle };
  notification?: {
    isPermissionGranted(): Promise<boolean>;
    requestPermission(): Promise<'granted' | 'denied' | 'default'>;
    sendNotification(options: { title: string; body?: string }): void;
  };
  updater?: { check(): Promise<TauriUpdate | null> };
  process?: { relaunch(): Promise<void> };
  opener?: { openUrl(url: string): Promise<void> };
}

declare global {
  interface Window {
    __TAURI__?: TauriGlobal;
    /** Set by desktop/src-tauri/src/desktop-init.js or installDesktopShortcuts(). */
    __BEOMTADEW_DESKTOP_KEYS__?: boolean;
  }
}

function tauri(): TauriGlobal | null {
  return typeof window !== 'undefined' && window.__TAURI__
    ? window.__TAURI__
    : null;
}

function currentWindow(): TauriWindowHandle | null {
  try {
    return tauri()?.window?.getCurrentWindow() ?? null;
  } catch {
    return null;
  }
}

/** True inside the Tauri desktop shell, false in any browser. */
export function isDesktopApp(): boolean {
  return tauri() !== null;
}

/** Toggles fullscreen. Resolves to the new state, or null outside the app. */
export async function toggleDesktopFullscreen(): Promise<boolean | null> {
  const win = currentWindow();
  if (!win) return null;
  try {
    const next = !(await win.isFullscreen());
    await win.setFullscreen(next);
    return next;
  } catch {
    return null;
  }
}

export async function setDesktopFullscreen(on: boolean): Promise<void> {
  try {
    await currentWindow()?.setFullscreen(on);
  } catch {}
}

/**
 * Sets the OS window title (the webview does not mirror document.title into
 * the title bar on every platform). Also updates document.title so the two
 * stay in sync. Pass the full title, e.g. '(2) 내 차례 · 범타듀 밸리'.
 */
export async function setDesktopTitle(title: string): Promise<void> {
  if (typeof document !== 'undefined') document.title = title;
  try {
    await currentWindow()?.setTitle(title);
  } catch {}
}

/**
 * Whether the game window has focus. Use instead of document.visibilityState
 * in the app: an unfocused-but-visible window still reports 'visible'.
 * Outside the app it falls back to the tab visibility.
 */
export async function desktopWindowFocused(): Promise<boolean> {
  const win = currentWindow();
  if (!win)
    return (
      typeof document === 'undefined' || document.visibilityState === 'visible'
    );
  try {
    return await win.isFocused();
  } catch {
    return true;
  }
}

/** Subscribes to window focus changes. Returns an unsubscribe function. */
export function onDesktopFocusChange(
  handler: (focused: boolean) => void,
): Unlisten {
  const win = currentWindow();
  if (!win) return () => {};
  let unlisten: Unlisten | null = null;
  let cancelled = false;
  win
    .onFocusChanged((event) => handler(event.payload))
    .then((stop) => {
      if (cancelled) stop();
      else unlisten = stop;
    })
    .catch(() => {});
  return () => {
    cancelled = true;
    unlisten?.();
  };
}

/** Asks the OS for notification permission. Call from a user gesture. */
export async function requestDesktopNotificationPermission(): Promise<boolean> {
  const api = tauri()?.notification;
  if (!api) return false;
  try {
    if (await api.isPermissionGranted()) return true;
    return (await api.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

/**
 * OS notification (Windows toast / macOS Notification Center) plus a taskbar
 * flash / dock bounce. Returns false outside the app or without permission so
 * callers can fall back to the web Notification API.
 */
export async function desktopNotify(
  title: string,
  body?: string,
): Promise<boolean> {
  const api = tauri()?.notification;
  if (!api) return false;
  try {
    // 1 = UserAttentionType.Critical, 2 = Informational.
    void currentWindow()
      ?.requestUserAttention(2)
      .catch(() => {});
    if (!(await api.isPermissionGranted())) return false;
    api.sendNotification({ title, body });
    return true;
  } catch {
    return false;
  }
}

/** Brings the game window to the front (e.g. after a notification click). */
export async function focusDesktopWindow(): Promise<void> {
  const win = currentWindow();
  if (!win) return;
  try {
    await win.unminimize();
    await win.setFocus();
  } catch {}
}

/**
 * An invite link friends can open. In a browser it keeps the current page;
 * in the app (whose location is tauri://localhost/…) it points at the public
 * web build, which also works for friends who have not installed the app.
 */
export function shareableInviteUrl(
  key: 'lounge' | 'theater' | 'room',
  code: string,
): string {
  const hash = key + '=' + encodeURIComponent(code);
  if (!isDesktopApp() && typeof location !== 'undefined') {
    const url = new URL(location.href);
    url.hash = hash;
    return url.href;
  }
  return WEB_URL + '#' + hash;
}

/** Opens a URL in the default browser (app) or a new tab (web). */
export async function openExternal(url: string): Promise<void> {
  const opener = tauri()?.opener;
  if (opener) {
    try {
      await opener.openUrl(url);
      return;
    } catch {}
  }
  if (typeof window !== 'undefined')
    window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Installs the desktop keyboard shortcuts (F11 = fullscreen) unless the shell
 * already did (desktop-init.js sets the same flag). Returns an uninstaller.
 */
export function installDesktopShortcuts(): Unlisten {
  if (!isDesktopApp() || window.__BEOMTADEW_DESKTOP_KEYS__) return () => {};
  window.__BEOMTADEW_DESKTOP_KEYS__ = true;
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'F11' || event.repeat) return;
    event.preventDefault();
    void toggleDesktopFullscreen();
  };
  window.addEventListener('keydown', onKey, true);
  return () => {
    window.removeEventListener('keydown', onKey, true);
    window.__BEOMTADEW_DESKTOP_KEYS__ = false;
  };
}

export type DesktopUpdateResult =
  | { status: 'web' }
  | { status: 'none' }
  | { status: 'available'; version: string }
  | { status: 'installed'; version: string }
  | { status: 'error'; message: string };

/**
 * Checks GitHub Releases for a newer signed build (see desktop/README.md →
 * 자동 업데이트). With `install`, downloads it, installs it and restarts the
 * app — only call that after the player agreed (e.g. "지금 업데이트할까요?").
 */
export async function checkForDesktopUpdate(
  install = false,
): Promise<DesktopUpdateResult> {
  const api = tauri();
  if (!api?.updater) return { status: 'web' };
  try {
    const update = await api.updater.check();
    if (!update) return { status: 'none' };
    if (!install) return { status: 'available', version: update.version };
    await update.downloadAndInstall();
    await api.process?.relaunch();
    return { status: 'installed', version: update.version };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
