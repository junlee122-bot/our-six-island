import { ACTORS } from './theater-data.ts';
import {
  LoungeSaveError,
  readLounge,
  readLoungeStrict,
  type LoungeSave,
} from './lounge-look.ts';
import {
  BEDROOM_INVALID,
  BEDROOM_VERSION,
  lockedRoomItems,
  readBedroom,
  ROOM_ITEM_LOCKED,
} from './lounge-bedroom-data.ts';
import { defaultLook, readLook, type Look } from './lounge-look.ts';
import type { Bedroom } from './lounge-bedroom-data.ts';
import {
  friendLife,
  readLife,
  type GuestEntry,
  type RoomAccess,
} from './lounge-life.ts';
export const ACCOUNT_IDS = [
  'dowon',
  'gangjae',
  'minseo',
  'seungjun',
  'minjae',
  'jaemin',
  'hohyeon',
] as const;
export const ACCOUNTS = ACCOUNT_IDS.map((username, actor) => ({
  username,
  actor,
  name: ACTORS[actor],
}));
export type AccountProfile = {
  id: string;
  username: string;
  actor: number;
  save: LoungeSave | null;
  revision: number;
  updatedAt: string;
};
export const SAVE_UPDATE_REQUIRED = '앱을 새로고침해 업데이트해 주세요.';
export const SAVE_SERVER_BEHIND =
  '서버가 아직 새 저장 형식을 준비 중이에요. 잠시 후 다시 시도해 주세요.';
export const SAVE_TOO_LARGE =
  '저장 용량(64KB)을 넘었어요. 보관한 코디나 방 소품을 조금 줄인 뒤 다시 저장해 주세요.';
/** Save rejected on the server path. `status` is the HTTP status to return. */
export class AccountSaveError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.name = 'AccountSaveError';
    this.status = status;
  }
  static from(e: unknown) {
    if (e instanceof AccountSaveError) return e;
    if (e instanceof LoungeSaveError && e.reason === 'room')
      return new AccountSaveError(BEDROOM_INVALID, 400);
    return new AccountSaveError(
      e instanceof LoungeSaveError && e.reason === 'newer'
        ? SAVE_SERVER_BEHIND
        : SAVE_UPDATE_REQUIRED,
      409,
    );
  }
}
/**
 * Fail-closed normalization used by the hohyeon-api `save` operation.
 * `unlocks` are the saver's shop unlocks (world life): rare room props need them.
 */
export const serverAccountSave = (
  value: unknown,
  actor: number,
  previousSave?: unknown,
  unlocks: readonly string[] = [],
) => accountSave(value, actor, previousSave, { strict: true, unlocks });
/** A member's shop unlocks from the world's life state (server save path). */
export const lifeUnlocksOf = (life: unknown, uid: string): string[] =>
  readLife(life).unlocks[uid] ?? [];
/**
 * Normalizes a profile save for this account. Client-side (default) it is
 * lenient: unreadable data becomes a fresh save. With `strict` (the server's
 * `hohyeon-api` path, see serverAccountSave) parse failures and unknown
 * versions throw AccountSaveError(409) so nothing is overwritten with a blank save.
 */
export function accountSave(
  value: unknown,
  actor: number,
  previousSave?: unknown,
  options: { strict?: boolean; unlocks?: readonly string[] } = {},
): LoungeSave {
  if (!Number.isInteger(actor) || actor < 0 || actor >= ACCOUNT_IDS.length)
    throw new RangeError('Unknown account actor');
  let raw: string | null = null;
  try {
    raw = JSON.stringify(value) ?? null;
  } catch {
    /* Non-JSON input is treated as a fresh save (lenient) or rejected (strict). */
  }
  let s: LoungeSave;
  if (options.strict) {
    try {
      s = readLoungeStrict(raw, actor);
    } catch (e) {
      throw AccountSaveError.from(e);
    }
  } else s = readLounge(raw, actor);
  const source =
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const previous =
    previousSave !== null &&
    typeof previousSave === 'object' &&
    !Array.isArray(previousSave)
      ? (previousSave as Record<string, unknown>)
      : undefined;
  // Older clients know only outfits. Missing bedroom preserves the server's room;
  // an explicitly supplied null/invalid room is normalized as an intentional reset.
  // A pre-v3 client (v1/v2 room) can never overwrite a v3 room: rooms were reset
  // to v3 on purpose and old browsers would otherwise write their stale canvas.
  const incomingRoom = source.bedroom as
    | { version?: unknown; items?: unknown }
    | null
    | undefined;
  const priorRoom = previous?.bedroom as
    | { version?: unknown; items?: unknown }
    | null
    | undefined;
  const legacyRoomWrite =
    priorRoom?.version === BEDROOM_VERSION &&
    Array.isArray(incomingRoom?.items) &&
    incomingRoom?.version !== BEDROOM_VERSION;
  const bedroom =
    previous &&
    (legacyRoomWrite ||
      (!Object.prototype.hasOwnProperty.call(source, 'bedroom') &&
        Object.prototype.hasOwnProperty.call(previous, 'bedroom')))
      ? readBedroom(previous.bedroom, actor)
      : s.bedroom;
  // Shop rarities need ownership. Only checked when the caller knows the
  // saver's unlocks (the server); what the stored room already had is kept.
  if (
    options.unlocks &&
    bedroom !== null &&
    lockedRoomItems(
      bedroom,
      options.unlocks,
      previous?.bedroom ? readBedroom(previous.bedroom, actor) : null,
    ).length
  )
    throw new AccountSaveError(ROOM_ITEM_LOCKED, 400);
  return {
    ...s,
    actor,
    bedroom,
    saved: s.saved.filter((c) => c.actor === actor),
  };
}
export function validPassword(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 10 &&
    value.length <= 72 &&
    new TextEncoder().encode(value).length <= 72 &&
    /\S/.test(value)
  );
}

// ---------------------------------------------------------------------------
// Pure helpers shared by the Edge functions (supabase/functions/*) and tests.
// Keep them free of Deno/browser APIs other than TextEncoder.
// ---------------------------------------------------------------------------

/** One message for every credential failure, so responses reveal no account state. */
export const AUTH_FAILED =
  '아이디와 비밀번호(또는 개인 코드)를 확인해 주세요. 처음이라면 ‘첫 로그인’, 이미 시작했다면 ‘로그인’이나 ‘비밀번호 찾기’를 이용해 주세요.';
export const PASSWORD_IS_CODE =
  '개인 코드나 복구 코드는 비밀번호로 쓸 수 없어요. 다른 비밀번호를 정해 주세요.';
/** Shape of issued activation (HH-) and recovery (HR-) codes: 24 random bytes as hex. */
export const ISSUED_CODE = /^H[HR]-[0-9a-f]{48}$/i;
export const looksLikeIssuedCode = (value: unknown) =>
  typeof value === 'string' && ISSUED_CODE.test(value.trim());
/**
 * Extra rule on top of validPassword for activate/recover/password: the new
 * password may not equal the code just used, nor look like any HH-/HR- code.
 * Returns a Korean error message, or null when acceptable.
 */
export function newPasswordProblem(
  newPassword: unknown,
  ...codes: unknown[]
): string | null {
  if (typeof newPassword !== 'string') return null;
  const candidate = newPassword.trim().toLowerCase();
  if (looksLikeIssuedCode(newPassword)) return PASSWORD_IS_CODE;
  for (const code of codes)
    if (
      typeof code === 'string' &&
      code.trim() &&
      (code.trim().toLowerCase() === candidate ||
        candidate.includes(code.trim().toLowerCase()))
    )
      return PASSWORD_IS_CODE;
  return null;
}
/**
 * The client IP for rate limiting. Prefers headers set by the platform edge
 * (`cf-connecting-ip`, `x-real-ip`); otherwise the RIGHTMOST `x-forwarded-for`
 * entry, which was appended by the nearest proxy (leftmost entries are
 * client-controlled). Falls back to 'unknown'.
 */
export function clientIp(get: (name: string) => string | null | undefined) {
  const clean = (v: string | null | undefined) => {
    const t = (v ?? '').trim();
    return t && t.length <= 64 && /^[0-9a-fA-F:.]+$/.test(t) ? t : '';
  };
  const direct = clean(get('cf-connecting-ip')) || clean(get('x-real-ip'));
  if (direct) return direct;
  const chain = (get('x-forwarded-for') ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  return clean(chain[chain.length - 1]) || 'unknown';
}
/**
 * Failure-only lockout policy for hohyeon-auth, keyed by (account, IP hash).
 * The first `free` consecutive failures are not delayed; afterwards the lock
 * doubles from `base` seconds up to `cap`. A success resets the counter.
 * MUST match public.hh_auth_fail in supabase/migrations/*_hohyeon_hardening.sql.
 */
export const AUTH_LOCKOUT = { free: 5, base: 30, cap: 3600 } as const;
export function authLockoutSeconds(
  failures: number,
  policy: { free: number; base: number; cap: number } = AUTH_LOCKOUT,
) {
  if (!Number.isFinite(failures) || failures <= policy.free) return 0;
  const exponent = Math.min(30, failures - policy.free - 1);
  return Math.min(policy.cap, policy.base * 2 ** exponent);
}
/** Rate-limit key: account and IP are hashed together so neither alone locks a friend out. */
export const authFailureKey = (username: string, ipHash: string) =>
  'auth-fail:' + username.slice(0, 32) + ':' + ipHash.slice(0, 32);
/**
 * Delay before CAS retry `attempt` (0-based) in hohyeon-api: exponential
 * 20ms·2^n capped at 400ms, with "equal jitter" (half fixed, half random) so
 * contending requests spread out instead of retrying in lockstep.
 */
export function casBackoffMs(attempt: number, random: number = Math.random()) {
  const ceiling = Math.min(400, 20 * 2 ** Math.max(0, Math.min(10, attempt)));
  const r = Math.min(1, Math.max(0, random));
  return Math.round(ceiling / 2 + (ceiling / 2) * r);
}
/**
 * Approximate byte length of Postgres `jsonb::text` for a JSON value (jsonb
 * prints ", " and ": " separators). Used to reject a >64KB profile save with a
 * specific message before hh_profile_save does (octet_length(p_save::text)).
 */
export function jsonbTextBytes(value: unknown): number {
  const text = (v: unknown): string => {
    if (v === null || v === undefined) return 'null';
    if (Array.isArray(v)) return '[' + v.map(text).join(', ') + ']';
    if (typeof v === 'object')
      return (
        '{' +
        Object.entries(v as Record<string, unknown>)
          .filter(([, x]) => x !== undefined && typeof x !== 'function')
          .map(([k, x]) => JSON.stringify(k) + ': ' + text(x))
          .join(', ') +
        '}'
      );
    return JSON.stringify(v) ?? 'null';
  };
  return new TextEncoder().encode(text(value)).length;
}
export const PROFILE_SAVE_MAX_BYTES = 65536;
/** App sessions expire after this much inactivity (see hohyeon.sessions.last_seen). */
export const SESSION_IDLE_DAYS = 30;

/** Read-only view of a friend's room returned by hohyeon-api `{op:'visit'}`. */
export type FriendVisit = {
  owner: number;
  name: string;
  bedroom: Bedroom | null;
  look: Look;
  guestbook: GuestEntry[];
  status: { text: string; at: number } | null;
  unlocks: string[];
  /** Who may walk in (from world.life; the owner's setting). */
  access: RoomAccess;
};
export const VISIT_BAD_OWNER = '방문할 친구를 확인해 주세요.';
export const visitOwnerValid = (owner: unknown): owner is number =>
  Number.isInteger(owner) &&
  (owner as number) >= 0 &&
  (owner as number) < ACCOUNT_IDS.length;
/**
 * Builds a friend visit from that member's stored profile save (or null when
 * they never saved) and `world.life`. Unreadable saves show the default room.
 */
export function friendVisitView(
  owner: number,
  save: unknown,
  life: unknown,
): FriendVisit {
  if (!visitOwnerValid(owner)) throw new RangeError(VISIT_BAD_OWNER);
  let bedroom: Bedroom | null = null,
    look = defaultLook(owner);
  if (save && typeof save === 'object') {
    const s = readLounge(JSON.stringify(save), owner);
    bedroom = s.bedroom;
    look = readLook(s.looks[owner], owner);
  }
  return {
    owner,
    name: ACTORS[owner],
    bedroom,
    look,
    ...friendLife(readLife(life), owner),
  };
}
