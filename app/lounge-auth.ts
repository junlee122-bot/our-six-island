import { createClient } from '@supabase/supabase-js';
import type { AccountProfile } from './lounge-accounts';
export const CLOUD_URL = 'https://ogfpeqeoaznwjbrbedbx.supabase.co';
export const CLOUD_KEY = 'sb_publishable_qoHHUYiC5jBUSK3vpYPV2A_LOLiGR7L';
export const cloud = createClient(CLOUD_URL, CLOUD_KEY, {
  auth: {
    storageKey: 'hohyeon-auth-v1',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
export class AccountError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
let credentialRotation: Promise<void> | null = null;
export async function cloudCall<T = unknown>(
  functionName: 'hohyeon-api' | 'hohyeon-auth',
  body: unknown,
  authenticated = true,
  expectedUid?: string,
  /** Give up after this long (a hung connection counts as a failure). */
  timeoutMs = 25000,
): Promise<T> {
  let token: string | undefined;
  if (authenticated) {
    const { data, error } = await cloud.auth.getSession();
    if (error || !data.session)
      throw new AccountError('다시 로그인해 주세요.', 401);
    if (expectedUid && data.session.user.id !== expectedUid)
      throw new AccountError(
        '다른 계정으로 전환됐어요. 이 창을 새로고침해 주세요.',
        409,
      );
    token = data.session.access_token;
  }
  let response: Response;
  try {
    response = await fetch(CLOUD_URL + '/functions/v1/' + functionName, {
      method: 'POST',
      headers: {
        apikey: CLOUD_KEY,
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new AccountError(
      '서버에 연결할 수 없어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
      503,
    );
  }
  let result: { error?: string };
  try {
    result = await response.json();
  } catch {
    throw new AccountError(
      '서버 응답을 읽을 수 없어요. 다시 시도해 주세요.',
      503,
    );
  }
  if (
    response.status === 401 &&
    functionName === 'hohyeon-api' &&
    token &&
    typeof window !== 'undefined'
  ) {
    if (credentialRotation) await credentialRotation;
    const { data } = await cloud.auth.getSession();
    if (data.session?.access_token === token)
      window.dispatchEvent(new Event('hohyeon-session-expired'));
  }
  if (!response.ok)
    throw new AccountError(
      result.error ?? '계정 요청을 처리하지 못했어요.',
      response.status,
    );
  return result as T;
}
export const fetchProfile = async () =>
  (
    await cloudCall<{ profile: AccountProfile }>('hohyeon-api', {
      op: 'profile',
    })
  ).profile;
export async function accountLogin(body: Record<string, unknown>) {
  let release: (() => void) | undefined;
  if (body.op === 'password')
    credentialRotation = new Promise<void>((resolve) => {
      release = resolve;
    });
  try {
    const result = await cloudCall<{
      session: { access_token: string; refresh_token: string };
      profile: AccountProfile;
      recoveryCode?: string;
      /** Login succeeded with an HH-/HR-shaped password: ask the user to change it. */
      passwordLooksLikeCode?: boolean;
    }>('hohyeon-auth', body, body.op === 'password');
    const { error } = await cloud.auth.setSession(result.session);
    if (error)
      throw new AccountError(
        '로그인을 보관하지 못했어요. 다시 로그인해 주세요.',
        503,
      );
    return result;
  } finally {
    if (release) {
      release();
      credentialRotation = null;
    }
  }
}
export async function accountLogout(expectedUid?: string) {
  try {
    await cloudCall('hohyeon-auth', { op: 'logout' }, true, expectedUid);
  } catch (e) {
    if (!(e instanceof AccountError) || e.status !== 401) throw e;
  }
  if (expectedUid) {
    const { data } = await cloud.auth.getSession();
    if (data.session && data.session.user.id !== expectedUid)
      throw new AccountError('다른 계정으로 전환됐어요.', 409);
  }
  await cloud.auth.signOut({ scope: 'local' });
}
/**
 * Signs this account out everywhere: revokes every app session on the server
 * (all devices/tabs) and all refresh tokens, then clears the local session.
 */
export async function accountLogoutAll(expectedUid?: string) {
  try {
    await cloudCall('hohyeon-auth', { op: 'logoutAll' }, true, expectedUid);
  } catch (e) {
    if (!(e instanceof AccountError) || e.status !== 401) throw e;
  }
  await cloud.auth.signOut({ scope: 'local' });
}
