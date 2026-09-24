// Sound, attention and error-message helpers shared by the lounge UI.
import { getSettings } from '../lounge-settings';
import { loungeAudio } from '../lounge-audio';
import { NAMES } from '../lounge-text';

export type Cue =
  | 'invite'
  | 'turn'
  | 'start'
  | 'win'
  | 'lose'
  | 'sticker'
  | 'error';

const CUES: Record<
  Cue,
  { notes: number[]; step: number; type: OscillatorType }
> = {
  invite: { notes: [659.25, 880], step: 0.13, type: 'sine' },
  turn: { notes: [523.25, 783.99], step: 0.1, type: 'triangle' },
  start: { notes: [392, 523.25, 659.25], step: 0.1, type: 'sine' },
  win: { notes: [523.25, 659.25, 783.99, 1046.5], step: 0.11, type: 'sine' },
  lose: { notes: [392, 329.63, 261.63], step: 0.15, type: 'sine' },
  sticker: { notes: [659.25], step: 0.1, type: 'sine' },
  error: { notes: [220, 196], step: 0.12, type: 'triangle' },
};

/** Plays a short tone on the shared lounge audio engine if sound is on. Never throws. */
export function playCue(cue: Cue) {
  const settings = getSettings();
  if (!settings.sound || settings.volume <= 0) return;
  try {
    const { notes, step, type } = CUES[cue];
    // Volume is applied by the engine's master gain (one AudioContext for
    // music, village sounds and cues; iOS allows only a few contexts).
    loungeAudio.cue(notes, step, type, 0.09);
  } catch {}
}

/** Kept for callers; the shared engine closes itself when the app unmounts. */
export function closeAudio() {}

const BASE_TITLE = NAMES.app;
let unseen = 0;
let titleLabel = '';
let titleListenerInstalled = false;

function renderTitle() {
  if (typeof document === 'undefined') return;
  document.title =
    unseen > 0 ? `(${unseen}) ${titleLabel} · ${BASE_TITLE}` : BASE_TITLE;
}

function installTitleReset() {
  if (titleListenerInstalled || typeof document === 'undefined') return;
  titleListenerInstalled = true;
  const reset = () => {
    if (document.visibilityState === 'visible') {
      unseen = 0;
      renderTitle();
    }
  };
  document.addEventListener('visibilitychange', reset);
  globalThis.addEventListener?.('focus', reset);
}

export function tabHidden() {
  return (
    typeof document !== 'undefined' && document.visibilityState === 'hidden'
  );
}

/**
 * Calls for attention: sound always (if enabled); when the tab is hidden also
 * updates document.title, shows a Notification (if permitted) and vibrates.
 */
export function attention(kind: 'invite' | 'turn', body: string) {
  playCue(kind);
  const settings = getSettings();
  try {
    if (settings.vibrate)
      navigator.vibrate?.(kind === 'invite' ? [120, 60, 120] : 90);
  } catch {}
  if (!tabHidden()) return;
  installTitleReset();
  unseen++;
  titleLabel = kind === 'invite' ? '초대 도착' : '내 차례';
  renderTitle();
  if (
    settings.notifications &&
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted'
  ) {
    try {
      const n = new Notification(
        kind === 'invite' ? '초대 도착' : '내 차례예요',
        {
          body,
          tag: 'bumtadew-' + kind,
        },
      );
      n.onclick = () => {
        globalThis.focus?.();
        n.close();
      };
    } catch {}
  }
}

/** Asks for notification permission; call only from a user gesture (settings toggle). */
export async function requestNotifications(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

const HANGUL = /[가-힣]/;
const KNOWN: [RegExp, string][] = [
  [
    /refresh token|jwt|session|not authenticated|unauthori[sz]ed/i,
    '로그인이 만료됐어요. 다시 로그인해 주세요.',
  ],
  [
    /failed to fetch|network|load failed|timeout|aborted/i,
    '서버에 연결할 수 없어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
  ],
  [
    /too many|rate limit|429/i,
    '요청이 너무 많아요. 잠시 뒤 다시 시도해 주세요.',
  ],
];

/**
 * Korean server messages are shown as-is (contract #4); anything else (raw
 * Supabase/browser English) becomes a Korean message and is logged instead.
 */
export function friendlyError(
  error: unknown,
  fallback = '요청을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
): string {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : '';
  if (!message) return fallback;
  if (HANGUL.test(message)) return message;
  console.warn('[범타듀 밸리]', message);
  for (const [pattern, text] of KNOWN) if (pattern.test(message)) return text;
  return fallback;
}
