// Per-device player preferences for 범타듀 밸리 (sound, graphics, display,
// keys, notifications).
// Stored in localStorage; every read/write tolerates blocked storage.
import { useSyncExternalStore } from 'react';
import { DEFAULT_KEYBINDS, readKeybinds, type Keybinds } from './lounge-keybinds.ts';

export type GraphicsQuality = 'low' | 'mid' | 'high';
export const FPS_CAPS = [0, 30, 60, 144] as const;
export type FpsCap = (typeof FPS_CAPS)[number];
export const UI_SCALES = [90, 100, 110, 125] as const;
export const TEXT_SCALES = [100, 115, 130] as const;

export type LoungeSettings = {
  /** Storage shape version (2 = PC settings: channels, graphics, keys). */
  version: 2;
  /** All game sound on/off (the master switch). */
  sound: boolean;
  /** 0..1 master volume (the v1 "소리 크기"). */
  volume: number;
  /** Background music-box loop and ambient water/birds (needs `sound`). */
  music: boolean;
  /** 0..1 music and ambience level under the master volume. */
  musicVolume: number;
  /** 게임 중 배경음: casino / hall music keeps playing quietly at game tables. */
  gameMusic: boolean;
  /** 0..1 world sounds: footsteps, cards, fishing, cooking. */
  effectsVolume: number;
  /** 0..1 UI cues: invites, my turn, game start and results. */
  uiVolume: number;
  /** Hide friends' reaction stickers everywhere. */
  reactionsHidden: boolean;
  /** Desktop notifications while the game window is not in front (permission asked from the toggle only). */
  notifications: boolean;
  /** Flash the taskbar / bounce the dock icon for invites and my turn. */
  attention: boolean;
  /** 2D village guide instead of the 3D scene (low-end devices). */
  simpleGraphics: boolean;
  /** Village lighting follows the real KST time (morning/day/evening/night). */
  dayNight: boolean;
  /** Seasonal weather effects in the village (rain, snow, falling leaves). */
  seasonFx: boolean;
  /** Render quality preset: pixel ratio, shadows and particle effects. */
  quality: GraphicsQuality;
  /** Frame rate limit for the 3D scenes (0 = follow the display). */
  fpsCap: FpsCap;
  /** Start the desktop app in fullscreen (the last choice is kept). */
  fullscreen: boolean;
  /** HUD and dialog size, percent. */
  uiScale: (typeof UI_SCALES)[number];
  /** Extra size for reading text (dialogs, chat, panels), percent. */
  textScale: (typeof TEXT_SCALES)[number];
  /** Rebindable keys for the village and my room. */
  keys: Keybinds;
};

export const SETTINGS_KEY = 'bumtadew-settings-v1';
export const DEFAULT_SETTINGS: LoungeSettings = Object.freeze({
  version: 2,
  sound: true,
  volume: 0.35,
  music: true,
  musicVolume: 1,
  gameMusic: true,
  effectsVolume: 1,
  uiVolume: 1,
  reactionsHidden: false,
  notifications: false,
  attention: true,
  simpleGraphics: false,
  dayNight: true,
  seasonFx: true,
  quality: 'mid',
  fpsCap: 0,
  fullscreen: false,
  uiScale: 100,
  textScale: 100,
  keys: DEFAULT_KEYBINDS,
}) as LoungeSettings;

/** Pixel ratio cap, shadows and particles for a quality preset. */
export function qualityProfile(quality: GraphicsQuality) {
  return quality === 'low'
    ? { pixelRatio: 1, shadows: false, effects: false }
    : quality === 'high'
      ? { pixelRatio: 2, shadows: true, effects: true }
      : { pixelRatio: 1.5, shadows: true, effects: true };
}

/**
 * Parses stored settings (any version) into the current shape. Version 1
 * (sound, volume, music, vibrate, …) keeps its values; `vibrate` is dropped
 * (phones are not supported) and the new PC options start at their defaults.
 */
export function readSettings(raw: string | null | undefined): LoungeSettings {
  let value: Record<string, unknown> = {};
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      value = parsed as Record<string, unknown>;
  } catch {}
  const bool = (key: keyof LoungeSettings) =>
    typeof value[key] === 'boolean'
      ? (value[key] as boolean)
      : (DEFAULT_SETTINGS[key] as boolean);
  const level = (key: keyof LoungeSettings) => {
    const n = typeof value[key] === 'number' ? (value[key] as number) : NaN;
    return Number.isFinite(n) && n >= 0 && n <= 1
      ? n
      : (DEFAULT_SETTINGS[key] as number);
  };
  const oneOf = <T,>(key: keyof LoungeSettings, options: readonly T[]): T =>
    options.includes(value[key] as T)
      ? (value[key] as T)
      : (DEFAULT_SETTINGS[key] as T);
  return {
    version: 2,
    sound: bool('sound'),
    volume: level('volume'),
    music: bool('music'),
    musicVolume: level('musicVolume'),
    gameMusic: bool('gameMusic'),
    effectsVolume: level('effectsVolume'),
    uiVolume: level('uiVolume'),
    reactionsHidden: bool('reactionsHidden'),
    notifications: bool('notifications'),
    attention: bool('attention'),
    simpleGraphics: bool('simpleGraphics'),
    dayNight: bool('dayNight'),
    seasonFx: bool('seasonFx'),
    quality: oneOf('quality', ['low', 'mid', 'high'] as const),
    fpsCap: oneOf('fpsCap', FPS_CAPS),
    fullscreen: bool('fullscreen'),
    uiScale: oneOf('uiScale', UI_SCALES),
    textScale: oneOf('textScale', TEXT_SCALES),
    keys: readKeybinds(value.keys),
  };
}

/** True when stored settings predate the current shape (version 2). */
export function needsMigration(raw: string): boolean {
  try {
    const parsed: unknown = JSON.parse(raw);
    return (
      !!parsed &&
      typeof parsed === 'object' &&
      (parsed as { version?: unknown }).version !== 2
    );
  } catch {
    return false;
  }
}

let current: LoungeSettings | null = null;
const listeners = new Set<() => void>();

export function getSettings(): LoungeSettings {
  if (!current) {
    let raw: string | null = null;
    try {
      raw = globalThis.localStorage?.getItem(SETTINGS_KEY) ?? null;
    } catch {}
    current = readSettings(raw);
    // Older shapes are rewritten once in the current one (see readSettings).
    if (raw && needsMigration(raw))
      try {
        globalThis.localStorage?.setItem(SETTINGS_KEY, JSON.stringify(current));
      } catch {}
  }
  return current;
}

export function updateSettings(patch: Partial<LoungeSettings>) {
  current = readSettings(JSON.stringify({ ...getSettings(), ...patch }));
  try {
    globalThis.localStorage?.setItem(SETTINGS_KEY, JSON.stringify(current));
  } catch {}
  for (const fn of listeners) fn();
  return current;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const storage = (e: StorageEvent) => {
    if (e.key !== SETTINGS_KEY) return;
    current = readSettings(e.newValue);
    fn();
  };
  globalThis.addEventListener?.('storage', storage);
  return () => {
    listeners.delete(fn);
    globalThis.removeEventListener?.('storage', storage);
  };
}

/** Calls `fn` whenever settings change (this tab or another); returns unsubscribe. */
export const onSettingsChange = (fn: () => void) => subscribe(fn);

export function useSettings(): [
  LoungeSettings,
  (patch: Partial<LoungeSettings>) => void,
] {
  const value = useSyncExternalStore(
    subscribe,
    getSettings,
    () => DEFAULT_SETTINGS,
  );
  return [value, updateSettings];
}

/** Small per-device memory helpers (last account, onboarding, last room). */
export function remember(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
}
export function recall(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export const LAST_ACCOUNT_KEY = 'bumtadew-last-account';
export const ONBOARDING_KEY = 'bumtadew-onboarding-v1';
/** Set after a login whose password still looks like an issued code (WS1). */
export const PASSWORD_WARNING_KEY = 'bumtadew-password-warning';
export const lastRoomKey = (accountId: string) =>
  'bumtadew-last-room-' + accountId;
