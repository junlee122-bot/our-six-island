import { createClient } from '@supabase/supabase-js';
export const url = Deno.env.get('SUPABASE_URL')!;
export const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
export const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const authClient = () =>
  createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
export async function rpc(name: string, args: Record<string, unknown> = {}) {
  const { data, error } = await admin.rpc(name, args);
  if (error) {
    console.error('Database operation failed', name, error.code);
    throw new HttpError(
      '서버에 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
      503,
    );
  }
  return data;
}
export const digest = async (s: string) =>
  [
    ...new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
export const secret = () =>
  [...crypto.getRandomValues(new Uint8Array(24))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
export function sessionId(token: string) {
  try {
    const part = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const sid = JSON.parse(atob(part)).session_id;
    if (/^[0-9a-f-]{36}$/i.test(sid)) return sid;
  } catch {}
  throw new HttpError('로그인 세션을 확인할 수 없습니다.', 401);
}
export async function member(req: Request) {
  const token =
    req.headers.get('Authorization')?.replace(/^Bearer /i, '') ?? '';
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError('다시 로그인해 주세요.', 401);
  const sid = sessionId(token),
    m = await rpc('hh_member', { p_uid: data.user.id, p_session: sid });
  if (!m)
    throw new HttpError('로그인이 만료되었어요. 다시 로그인해 주세요.', 401);
  return { m, sid, token };
}
export async function rate(key: string, limit: number, seconds = 60) {
  if (
    !(await rpc('hh_rate', { p_key: key, p_limit: limit, p_seconds: seconds }))
  )
    throw new HttpError('시도가 너무 많아요. 잠시 후 다시 시도해 주세요.', 429);
}
export const profile = (m: any) => ({
  id: m.user_id,
  username: m.username,
  actor: m.actor,
  save: m.save,
  revision: m.save_revision,
  updatedAt: m.updated_at,
});
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};
export function serve(handler: (body: any, req: Request) => Promise<unknown>) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: cors });
    let status = 200,
      data;
    try {
      if (req.method !== 'POST')
        throw new HttpError('POST 요청만 지원합니다.', 405);
      if (Number(req.headers.get('content-length') ?? 0) > 80000)
        throw new HttpError('요청이 너무 큽니다.', 413);
      const raw = await req.text();
      if (raw.length > 80000) throw new HttpError('요청이 너무 큽니다.', 413);
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new HttpError('올바르지 않은 요청입니다.');
      }
      if (!body || Array.isArray(body) || typeof body !== 'object')
        throw new HttpError('올바르지 않은 요청입니다.');
      data = await handler(body, req);
    } catch (e) {
      status = e instanceof HttpError ? e.status : 500;
      data = {
        error:
          e instanceof HttpError
            ? e.message
            : '서버 요청을 처리하지 못했어요. 다시 시도해 주세요.',
      };
      if (!(e instanceof HttpError))
        console.error(
          'Request failed',
          e instanceof Error ? e.name : 'unknown',
        );
    }
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
    });
  });
}
