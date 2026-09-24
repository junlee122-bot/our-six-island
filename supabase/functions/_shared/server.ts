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
  /** Server-side diagnostic; logged for 5xx, never sent to the client. */
  detail?: string;
  constructor(message: string, status = 400, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}
/** One structured log line (JSON) so dashboards can filter by requestId/fn. */
export function log(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, unknown> = {},
) {
  const line = JSON.stringify({ level, event, at: new Date().toISOString(), ...fields });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
/** Maps database exceptions raised on purpose by the hh_* functions. */
const RPC_ERRORS: Record<string, [string, number]> = {
  save_too_large: [
    '저장 용량(64KB)을 넘었어요. 보관한 코디나 방 소품을 조금 줄인 뒤 다시 저장해 주세요.',
    413,
  ],
};
export async function rpc(name: string, args: Record<string, unknown> = {}) {
  const { data, error } = await admin.rpc(name, args);
  if (error) {
    const known = RPC_ERRORS[error.message];
    if (known) throw new HttpError(known[0], known[1]);
    throw new HttpError(
      '서버에 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
      503,
      `rpc ${name} failed: ${error.code ?? ''} ${error.message ?? ''}`,
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
/** Salted hash used for IP addresses in rate-limit keys and the audit log. */
export const ipHash = async (ip: string) =>
  (await digest((Deno.env.get('HH_IP_SALT') ?? 'hohyeon') + ':' + ip)).slice(
    0,
    32,
  );
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
  // Checks the app session exists and was used within the idle window
  // (SESSION_IDLE_DAYS); touches last_seen at most every few minutes.
  const sid = sessionId(token),
    m = await rpc('hh_session_member', { p_uid: data.user.id, p_session: sid });
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
  'Access-Control-Expose-Headers': 'x-request-id',
  'Cache-Control': 'no-store',
};
export type RequestContext = { requestId: string; fn: string };
export function serve(
  fn: string,
  handler: (body: any, req: Request, ctx: RequestContext) => Promise<unknown>,
) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: cors });
    const ctx: RequestContext = { requestId: crypto.randomUUID(), fn };
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
      data = await handler(body, req, ctx);
    } catch (e) {
      const known = e instanceof HttpError;
      status = known ? e.status : 500;
      data = {
        error: known
          ? e.message
          : '서버 요청을 처리하지 못했어요. 다시 시도해 주세요.',
        ...(status >= 500 ? { requestId: ctx.requestId } : {}),
      };
      if (!known || status >= 500)
        log('error', 'request_failed', {
          ...ctx,
          status,
          name: e instanceof Error ? e.name : typeof e,
          message: e instanceof Error ? e.message : String(e),
          detail: known ? e.detail : undefined,
          stack: e instanceof Error ? e.stack : undefined,
        });
    }
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        ...cors,
        'Content-Type': 'application/json; charset=utf-8',
        'x-request-id': ctx.requestId,
      },
    });
  });
}
