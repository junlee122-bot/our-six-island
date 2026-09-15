// Public entrypoint; each operation verifies a password, private recovery code,
// with the fixed server roster. No user-supplied actor or uid is trusted.
import {
  admin,
  authClient,
  digest,
  HttpError,
  member,
  profile,
  rate,
  rpc,
  secret,
  serve,
  sessionId,
} from '../_shared/server.ts';
import { ACCOUNT_IDS, validPassword } from '../../../app/lounge-accounts.ts';

serve(async (b, req) => {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  await rate('auth-ip:' + (await digest(ip)), 60);
  if (b.op === 'logout') {
    const { m, sid, token } = await member(req);
    await rpc('hh_member_write', {
      p_username: m.username,
      p_uid: m.user_id,
      p_mode: 'logout',
      p_data: { session_id: sid },
    });
    await admin.auth.admin.signOut(token, 'local');
    return { ok: true };
  }
  const username =
    typeof b.username === 'string' ? b.username.trim().toLowerCase() : '';
  if (!ACCOUNT_IDS.includes(username as (typeof ACCOUNT_IDS)[number]))
    throw new HttpError(
      '아이디와 비밀번호 또는 개인 코드를 확인해 주세요.',
      401,
    );
  await rate('auth-account:' + username, 15, 300);
  let m = await rpc('hh_member', { p_username: username });
  if (!m?.user_id)
    throw new HttpError(
      '아직 계정이 준비되지 않았어요. 관리자에게 알려 주세요.',
      503,
    );
  const lock = crypto.randomUUID();
  if (!(await rpc('hh_account_lock', { p_uid: m.user_id, p_token: lock })))
    throw new HttpError(
      '계정 요청을 처리 중이에요. 잠시 후 다시 시도해 주세요.',
      409,
    );
  try {
    m = await rpc('hh_member', { p_username: username });
    const auth = authClient();
    let data: any;
    let recoveryCode: string | undefined;
    let mode = 'session';
    const signIn = async (password: unknown) => {
      if (typeof password !== 'string' || password.length > 100)
        throw new HttpError('아이디와 비밀번호를 확인해 주세요.', 401);
      const { data, error } = await auth.auth.signInWithPassword({
        email: m.auth_email,
        password,
      });
      if (error || !data.session)
        throw new HttpError(
          '아이디와 비밀번호 또는 개인 코드를 확인해 주세요.',
          401,
        );
      return data;
    };
    if (b.op === 'login') {
      if (
        !m.activated &&
        typeof b.password === 'string' &&
        (await digest(b.password)) === m.activation_hash
      )
        throw new HttpError(
          '처음 접속할 때는 ‘첫 로그인’에서 개인 코드를 입력해 주세요.',
          403,
        );
      data = await signIn(b.password);
      // Repair a password update whose final database write was interrupted.
      if (!m.activated) {
        mode = 'activate';
        recoveryCode = 'HR-' + secret();
      } else if (!m.recovery_hash) {
        mode = 'password';
        recoveryCode = 'HR-' + secret();
      }
    } else if (['activate', 'recover', 'password'].includes(b.op)) {
      if (!validPassword(b.newPassword))
        throw new HttpError(
          '비밀번호는 10–72자, UTF-8 기준 72바이트 이하로 입력해 주세요.',
        );
      if (b.op === 'activate') {
        if (m.activated)
          throw new HttpError(
            '이미 시작한 계정이에요. 로그인 또는 비밀번호 찾기를 이용해 주세요.',
            409,
          );
        if (
          typeof b.code !== 'string' ||
          (await digest(b.code)) !== m.activation_hash
        )
          throw new HttpError('개인 활성화 코드를 확인해 주세요.', 401);
        await signIn(b.code);
        mode = 'activate';
      } else if (b.op === 'recover') {
        if (
          !m.activated ||
          !m.recovery_hash ||
          typeof b.code !== 'string' ||
          (await digest(b.code)) !== m.recovery_hash
        )
          throw new HttpError('복구 코드를 확인해 주세요.', 401);
        mode = 'password';
      } else {
        const current = await member(req);
        if (current.m.user_id !== m.user_id)
          throw new HttpError('계정이 일치하지 않습니다.', 403);
        await signIn(b.password);
        mode = 'password';
      }
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
        );
      data = await signIn(b.newPassword);
      recoveryCode = 'HR-' + secret();
    } else throw new HttpError('지원하지 않는 계정 요청입니다.');
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
    return {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      profile: profile(m),
      recoveryCode,
    };
  } finally {
    try {
      await rpc('hh_account_lock', {
        p_uid: m.user_id,
        p_token: lock,
        p_release: true,
      });
    } catch {
      console.error('Account lock release deferred to expiry');
    }
  }
});
