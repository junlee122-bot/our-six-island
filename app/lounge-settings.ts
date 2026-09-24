// Per-device player preferences for 범타듀 밸리 (sound, stickers, alerts, graphics).
// Stored in localStorage; every read/write tolerates blocked storage.
import { useSyncExternalStore } from 'react';

export type LoungeSettings = {
  /** Short WebAudio tones for invites, my turn, game start and results. */
  sound: boolean;
  /** 0..1 master volume for the tones (low by default). */
  volume: number;
  /** Hide friends' reaction stickers everywhere. */
  reactionsHidden: boolean;
  /** Browser notifications while the tab is hidden (permission asked from the settings toggle only). */
  notifications: boolean;
  /** Vibrate on phones for invites and my turn. */
  vibrate: boolean;
  /** 2D village guide instead of the 3D scene (low-end devices). */
  simpleGraphics: boolean;
  /** Background music-box loop and ambient water/birds (needs `sound`). */
  music: boolean;
  /** Village lighting follows the real KST time (morning/day/evening/night). */
  dayNight: boolean;
};

export const SETTINGS_KEY = 'bumtadew-settings-v1';
export const DEFAULT_SETTINGS: LoungeSettings = {
  sound: true,
  volume: 0.35,
  reactionsHidden: false,
  notifications: false,
  vibrate: true,
  simpleGraphics: false,
  music: true,
  dayNight: true,
};

export function readSettings(raw: string | null | undefined): LoungeSettings {
  let value: Partial<Record<keyof LoungeSettings, unknown>> = {};
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') value = parsed as typeof value;
  } catch {}
  const bool = (key: keyof LoungeSettings) =>
    typeof value[key] === 'boolean'
      ? (value[key] as boolean)
      : (DEFAULT_SETTINGS[key] as boolean);
  const volume = Number(value.volume);
  return {
    sound: bool('sound'),
    volume:
      Number.isFinite(volume) && volume >= 0 && volume <= 1
        ? volume
        : DEFAULT_SETTINGS.volume,
    reactionsHidden: bool('reactionsHidden'),
    notifications: bool('notifications'),
    vibrate: bool('vibrate'),
    simpleGraphics: bool('simpleGraphics'),
    music: bool('music'),
    dayNight: bool('dayNight'),
  };
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
