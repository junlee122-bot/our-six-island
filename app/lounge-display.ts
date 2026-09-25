// Window, fullscreen and UI size for the PC game.
//
// Fullscreen goes through the Tauri window when the desktop shell is present
// (desktop-bridge.ts) and through the Fullscreen API in a browser. UI and text
// size become CSS variables on <html> that lounge.css applies with `zoom` to
// the HUD and dialogs (the 3D canvas itself is never zoomed).
import { useEffect } from 'react';
import {
  desktopIsFullscreen,
  isDesktopApp,
  setDesktopFullscreen,
  toggleDesktopFullscreen,
} from './desktop-bridge';
import {
  getSettings,
  onSettingsChange,
  updateSettings,
  type LoungeSettings,
} from './lounge-settings';

/** Whether the game fills the screen right now (browser fullscreen only; the app asks its window). */
export function documentFullscreen(): boolean {
  return typeof document !== 'undefined' && !!document.fullscreenElement;
}

/**
 * Switches between window and fullscreen. Resolves to the new state, or null
 * when it could not change (e.g. the browser refused without a user gesture).
 */
export async function setFullscreen(on: boolean): Promise<boolean | null> {
  if (isDesktopApp()) {
    await setDesktopFullscreen(on);
    updateSettings({ fullscreen: on });
    return on;
  }
  if (typeof document === 'undefined') return null;
  try {
    if (on && !document.fullscreenElement)
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    else if (!on && document.fullscreenElement) await document.exitFullscreen();
  } catch {
    return null;
  }
  updateSettings({ fullscreen: on });
  return on;
}

/** F11 / 전체 화면 전환 button. */
export async function toggleFullscreen(): Promise<boolean | null> {
  if (isDesktopApp()) {
    const next = await toggleDesktopFullscreen();
    if (next !== null) updateSettings({ fullscreen: next });
    return next;
  }
  return setFullscreen(!documentFullscreen());
}

/** CSS variables for the HUD and dialog zoom (see `.l-app` rules in lounge.css). */
export function displayVariables(settings: Pick<LoungeSettings, 'uiScale' | 'textScale'>) {
  const hud = settings.uiScale / 100;
  return {
    '--hud-zoom': String(hud),
    '--dialog-zoom': String(Math.round(hud * settings.textScale) / 100),
    // Small HUD text over the scene (name tags, signs, header chips, room
    // status bar) scales with 글자 크기 through font-size, not zoom, so the
    // projected tags keep their positions.
    '--text-scale': String(settings.textScale / 100),
  };
}

function applyDisplay(settings: LoungeSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [name, value] of Object.entries(displayVariables(settings)))
    root.style.setProperty(name, value);
  root.dataset.quality = settings.quality;
}

/**
 * Keeps <html> in step with the display settings, and in the desktop app
 * restores the last window mode once at start.
 */
export function useDisplaySettings() {
  useEffect(() => {
    applyDisplay(getSettings());
    if (isDesktopApp()) {
      if (getSettings().fullscreen) void setDesktopFullscreen(true);
    } else if (getSettings().fullscreen && !documentFullscreen())
      // A browser never starts in fullscreen; show the real state.
      updateSettings({ fullscreen: false });
    const off = onSettingsChange(() => applyDisplay(getSettings()));
    // Leaving browser fullscreen with Esc / F11 keeps the setting honest.
    const change = () => {
      const on = documentFullscreen();
      if (!isDesktopApp() && getSettings().fullscreen !== on) updateSettings({ fullscreen: on });
    };
    document.addEventListener('fullscreenchange', change);
    // The shell's own F11 (desktop-init.js) changes the window behind our back.
    let timer = 0;
    const resized = () => {
      if (!isDesktopApp()) return;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        void desktopIsFullscreen().then((on) => {
          if (on !== null && getSettings().fullscreen !== on) updateSettings({ fullscreen: on });
        });
      }, 400);
    };
    window.addEventListener('resize', resized);
    return () => {
      off();
      clearTimeout(timer);
      document.removeEventListener('fullscreenchange', change);
      window.removeEventListener('resize', resized);
    };
  }, []);
}
