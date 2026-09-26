// Connection health for the always-on village (pure; lounge-cloud-room.ts
// feeds it and the header, invite window and alerts read it).
//
// One failed poll is a hiccup and stays quiet; two in a row (or the browser
// saying it is offline) is "연결 끊김": the header stops showing a stale
// "지금 마을에 N명", online-only actions are switched off with a reason, and
// the background retries show as a countdown instead of repeating toasts.

export type LinkState = 'ok' | 'retrying' | 'offline';

export type Link = {
  state: LinkState;
  /** Consecutive failed server calls (0 after any success). */
  failures: number;
  /** When the next automatic retry runs (local ms), or null. */
  retryAt: number | null;
  /** When the connection was first lost (local ms), or null while ok. */
  since: number | null;
};

export const LINK_OK: Link = Object.freeze({
  state: 'ok',
  failures: 0,
  retryAt: null,
  since: null,
}) as Link;

/** Failures in a row before the village shows as offline. */
export const OFFLINE_AFTER = 2;

/**
 * Retry delay after `failures` failures in a row: 1s, 2s, 4s, then every 8s.
 * Short at first so a blip is confirmed (or cleared) within a second, and
 * capped low so the village is back within ~8s of the network returning.
 */
export function retryDelay(failures: number): number {
  if (failures <= 0) return 0;
  return Math.min(8_000, 1_000 * 2 ** (failures - 1));
}

/** Background polls give up after this long (a hung request is a failure). */
export const READ_TIMEOUT_MS = 6_000;
/** Actions wait longer: they may carry a whole game step. */
export const ACTION_TIMEOUT_MS = 12_000;
/** Realtime drop → probe the server at most this often. */
export const PROBE_GAP_MS = 3_000;

export type LinkEvent =
  | { kind: 'ok' }
  | { kind: 'fail'; now: number }
  | { kind: 'browser-offline'; now: number };

export function nextLink(link: Link, event: LinkEvent): Link {
  if (event.kind === 'ok') return link.state === 'ok' && !link.failures ? link : LINK_OK;
  const failures = link.failures + 1;
  const offline = event.kind === 'browser-offline' || failures >= OFFLINE_AFTER;
  return {
    state: offline ? 'offline' : 'retrying',
    failures,
    retryAt: event.now + retryDelay(failures),
    since: link.since ?? event.now,
  };
}

/** A network-level failure (no answer, 5xx) rather than a refusal (4xx). */
export function isNetworkFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return true;
  const status = (error as { status?: unknown }).status;
  return typeof status !== 'number' || status >= 500 || status === 0;
}

/** Seconds until the next retry for the header ("다시 연결 중 (3)"). */
export function retryCountdown(link: Link, now: number): number {
  if (link.retryAt === null) return 0;
  return Math.max(0, Math.ceil((link.retryAt - now) / 1000));
}

/** Header text for the presence chip. */
export function linkLabel(link: Link, now: number): { title: string; detail: string } {
  if (link.state !== 'offline') return { title: '', detail: '' };
  const left = retryCountdown(link, now);
  return {
    title: '연결 끊김',
    detail: left > 0 ? `다시 연결 중 (${left})` : '다시 연결 중…',
  };
}

/** Why an online-only action is off right now (null when it is available). */
export function offlineReason(state: LinkState | undefined, status: string): string | null {
  if (state === 'offline') return '연결이 끊겼어요. 다시 연결되면 할 수 있어요.';
  if (status === 'connecting') return '마을에 들어가는 중이에요. 잠시만 기다려 주세요.';
  if (status !== 'connected') return '마을에 연결되지 않았어요. 다시 들어가기를 눌러 주세요.';
  return null;
}

/**
 * Error toasts while the connection is down are the same message over and
 * over; show one, then stay quiet until the text changes or `quietMs` passes.
 */
export function shouldToastError(
  last: { text: string; at: number } | null,
  text: string,
  now: number,
  quietMs = 20_000,
): boolean {
  if (!text) return false;
  return !last || last.text !== text || now - last.at >= quietMs;
}
