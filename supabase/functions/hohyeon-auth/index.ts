// Public entrypoint; each operation verifies a password, private recovery code,
// with the fixed server roster. No user-supplied actor or uid is trusted.
//
// Hardening (see ACCOUNTS.md "보안 동작"):
// - every credential failure returns the same 401 message (AUTH_FAILED), so an
//   unauthenticated caller cannot tell unbound / unactivated / activated /
//   expired-code states apart;
// - lockout counts FAILURES only, keyed by (account, IP hash), with exponential
//   backoff, and a success resets it — nobody can lock a friend out from
//   another IP by spamming requests;
// - activation codes can expire (members.activation_expires_at);
// - a new password may not equal / contain the code or look like an HH-/HR- code;
// - every attempt is written to hohyeon.auth_events.
import {
  admin,
  authClient,
  digest,
  HttpError,
  ipHash,
  log,
  member,
  profile,
  rate,
  rpc,
  secret,
  serve,
  sessionId,
  type RequestContext,
} from '../_shared/server.ts';
import {
  ACCOUNT_IDS,
  AUTH_FAILED,
  AUTH_LOCKOUT,
  authFailureKey,
  clientIp,
  looksLikeIssuedCode,
  newPasswordProblem,
  validPassword,
} from '../../../app/lounge-accounts.ts';

const OPS = ['login', 'activate', 'recover', 'password', 'logout', 'logoutAll'];
/** Marks a credential failure: counted by the lockout and logged as ok=false. */
class AuthFailure extends HttpError {
  constructor(reason: string) {
    super(AUTH_FAILED, 401, reason);
  }
}

async function audit(
  ctx: RequestContext,
  e: {
    username: string;
    op: string;
    ok: boolean;
    ip: string;
    ua: string;
    detail?: string;
  },
) {
  try {
    await rpc('hh_auth_event', {
      p_username: e.username.slice(0, 32),
      p_op: e.op.slice(0, 16),
      p_ok: e.ok,
      p_ip_hash: e.ip,
      p_ua: e.ua.slice(0, 200),
      p_detail: (e.detail ?? '').slice(0, 120) || null,
    });
  } catch (err) {
    // Never fail (or leak) an auth response because the audit insert failed.
    log('error', 'auth_audit_failed', {
      ...ctx,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

serve('hohyeon-auth', async (b, req, ctx) => {
  const ip = await ipHash(clientIp((n) => req.headers.get(n)));
  const ua = req.headers.get('user-agent') ?? '';
  const op = typeof b.op === 'string' && OPS.includes(b.op) ? b.op : 'unknown';
  // Coarse per-IP request cap (all requests). Per-account protection is the
  // failure-only lockout below.
  await rate('auth-ip:' + ip, 60);

  if (op === 'logout' || op === 'logoutAll') {
    let who = '';
    try {
      const { m, sid, token } = await member(req);
      who = m.username;
      await rpc('hh_member_write', {
        p_username: m.username,
        p_uid: m.user_id,
        p_mode: 'logout',
        // No session_id = revoke every app session of this account.
        p_data: op === 'logout' ? { session_id: sid } : {},
      });
      // 'global' also revokes GoTrue refresh tokens on every other device.
      await admin.auth.admin.signOut(
        token,
        op === 'logout' ? 'local' : 'global',
      );
      await audit(ctx, { username: who, op, ok: true, ip, ua });
      return { ok: true };
    } catch (e) {
      await audit(ctx, {
        username: who,
        op,
        ok: false,
        ip,
        ua,
        detail: e instanceof Error ? e.message.slice(0, 60) : 'error',
      });
      throw e;
    }
  }

  const username =
    typeof b.username === 'string'
      ? b.username.trim().toLowerCase().slice(0, 32)
      : '';
  const failKey = authFailureKey(
    (await digest('user:' + username)).slice(0, 24),
    ip,
  );
  const locked = Number(await rpc('hh_auth_locked', { p_key: failKey })) || 0;
  if (locked > 0) {
    await audit(ctx, {
      username,
      op,
      ok: false,
      ip,
      ua,
      detail: 'locked',
    });
    throw new HttpError(
      `로그인 시도가 여러 번 실패했어요. ${Math.max(1, Math.ceil(locked / 60))}분 뒤에 다시 시도해 주세요.`,
      429,
    );
  }

  let lock: string | null = null;
  let m: any = null;
  try {
    if (op === 'unknown') throw new HttpError('지원하지 않는 계정 요청입니다.');
    if (!ACCOUNT_IDS.includes(username as (typeof ACCOUNT_IDS)[number]))
      throw new AuthFailure('unknown_user');
    m = await rpc('hh_member', { p_username: username });
    // Unbound roster slot: same answer as a wrong password (no state oracle).
    if (!m?.user_id) throw new AuthFailure('unbound');
    lock = crypto.randomUUID();
    if (!(await rpc('hh_account_lock', { p_uid: m.user_id, p_token: lock }))) {
      lock = null;
      throw new HttpError(
        '계정 요청을 처리 중이에요. 잠시 후 다시 시도해 주세요.',
        409,
      );
    }
    m = await rpc('hh_member', { p_username: username });
    const auth = authClient();
    let data: any;
    let recoveryCode: string | undefined;
    let mode = 'session';
    const codeExpired = () =>
      !!m.activation_expires_at &&
      Date.parse(m.activation_expires_at) <= Date.now();
    const signIn = async (password: unknown, reason: string) => {
      if (typeof password !== 'string' || password.length > 100)
        throw new AuthFailure(reason);
      const { data, error } = await auth.auth.signInWithPassword({
        email: m.auth_email,
        password,
      });
      if (error || !data.session) throw new AuthFailure(reason);
      return data;
    };
    if (op === 'login') {
      // An unactivated account's password IS its activation code; it must go
      // through 'activate'. Same uniform answer as any other failure.
      if (
        !m.activated &&
        typeof b.password === 'string' &&
        (await digest(b.password)) === m.activation_hash
      )
        throw new AuthFailure('activation_code_on_login');
      data = await signIn(b.password, 'bad_password');
      // Repair a password update whose final database write was interrupted.
      if (!m.activated) {
        mode = 'activate';
        recoveryCode = 'HR-' + secret();
      } else if (!m.recovery_hash) {
        mode = 'password';
        recoveryCode = 'HR-' + secret();
      }
    } else {
      // activate | recover | password
      if (op === 'activate') {
        if (
          m.activated ||
          !m.activation_hash ||
          typeof b.code !== 'string' ||
          (await digest(b.code)) !== m.activation_hash
        )
          throw new AuthFailure(m.activated ? 'already_active' : 'bad_code');
        if (codeExpired()) throw new AuthFailure('code_expired');
        await signIn(b.code, 'bad_code_auth');
        mode = 'activate';
      } else if (op === 'recover') {
        if (
          !m.activated ||
          !m.recovery_hash ||
          typeof b.code !== 'string' ||
          (await digest(b.code)) !== m.recovery_hash
        )
          throw new AuthFailure('bad_recovery_code');
        mode = 'password';
      } else {
        const current = await member(req);
        if (current.m.user_id !== m.user_id)
          throw new HttpError('계정이 일치하지 않습니다.', 403);
        await signIn(b.password, 'bad_current_password');
        mode = 'password';
      }
      // Credentials are verified from here on: specific messages are fine.
      if (!validPassword(b.newPassword))
        throw new HttpError(
          '비밀번호는 10–72자, UTF-8 기준 72바이트 이하로 입력해 주세요.',
        );
      // C2: a new password equal to (or containing) the code just used, or
      // shaped like any HH-/HR- code, would turn a leaked code into a login.
      const problem = newPasswordProblem(
        b.newPassword,
        op === 'password' ? undefined : b.code,
      );
      if (problem) throw new HttpError(problem);
      // Immediately invalidate the application's old sessions before rotating credentials.
      await rpc('hh_member_write', {
        p_username: username,
        p_uid: m.user_id,
        p_mode: 'logout',
        p_data: {},
      });
      const { error } = await admin.auth.admin.updateUserById(m.user_id, {
        password: b.newPassword,
      });
      if (error)
        throw new HttpError(
          '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.',
          503,
          'updateUserById: ' + error.message,
        );
      data = await signIn(b.newPassword, 'new_password_signin');
      recoveryCode = 'HR-' + secret();
    }
    if (data.user.id !== m.user_id)
      throw new HttpError('계정이 일치하지 않습니다.', 403);
    if (mode !== 'session') {
      const { error } = await admin.auth.admin.signOut(
        data.session.access_token,
        'others',
      );
      if (error)
        throw new HttpError(
          '이전 로그인을 해제하지 못했어요. 새 비밀번호로 로그인한 뒤 다시 변경해 주세요.',
          503,
          'signOut others: ' + error.message,
        );
    }
    m = await rpc('hh_member_write', {
      p_username: username,
      p_uid: m.user_id,
      p_mode: mode,
      p_data: {
        session_id: sessionId(data.session.access_token),
        ...(recoveryCode ? { recovery_hash: await digest(recoveryCode) } : {}),
      },
    });
    await rpc('hh_auth_reset', { p_key: failKey });
    await audit(ctx, {
      username,
      op,
      ok: true,
      ip,
      ua,
      // C2 detector: an account still logging in with an HH-/HR-shaped password
      // should rotate it (see ACCOUNTS.md).
      detail:
        op === 'login' && looksLikeIssuedCode(b.password)
          ? mode + ',code_like_password'
          : mode,
    });
    return {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      profile: profile(m),
      recoveryCode,
      // Client may prompt "비밀번호를 바꿔 주세요" when true.
      ...(op === 'login' && looksLikeIssuedCode(b.password)
        ? { passwordLooksLikeCode: true }
        : {}),
    };
  } catch (e) {
    if (e instanceof AuthFailure) {
      try {
        await rpc('hh_auth_fail', {
          p_key: failKey,
          p_free: AUTH_LOCKOUT.free,
          p_base: AUTH_LOCKOUT.base,
          p_cap: AUTH_LOCKOUT.cap,
        });
      } catch (err) {
        log('error', 'auth_fail_record_failed', {
          ...ctx,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
    await audit(ctx, {
      username,
      op,
      ok: false,
      ip,
      ua,
      detail:
        e instanceof HttpError
          ? (e.detail ?? String(e.status)).slice(0, 60)
          : 'error',
    });
    throw e;
  } finally {
    if (lock && m?.user_id)
      try {
        await rpc('hh_account_lock', {
          p_uid: m.user_id,
          p_token: lock,
          p_release: true,
        });
      } catch {
        log('warn', 'account_lock_release_deferred', ctx);
      }
  }
});
