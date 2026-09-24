'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Armchair,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  CloudCheck,
} from 'lucide-react';
import {
  ACCOUNTS,
  validPassword,
  type AccountProfile,
} from './lounge-accounts';
import {
  accountLogin,
  accountLogout,
  cloud,
  fetchProfile,
} from './lounge-auth';
import { LoginCharacterPreview, LoginPortrait } from './lounge-login-preview';
import { josa, NAMES } from './lounge-text';
import {
  LAST_ACCOUNT_KEY,
  PASSWORD_WARNING_KEY,
  recall,
  remember,
} from './lounge-settings';
import { friendlyError } from './lounge/feedback';

const initialUsername = () => {
  const last = recall(LAST_ACCOUNT_KEY);
  return last && ACCOUNTS.some((a) => a.username === last) ? last : 'dowon';
};
export function RecoveryCard({
  username,
  code,
  onDone,
}: {
  username: string;
  code: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false),
    [saved, setSaved] = useState<'' | 'file' | 'copy'>('');
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          `${NAMES.app} 비밀번호 복구 코드\n아이디: ${username}\n복구 코드: ${code}\n\n다른 사람에게 공유하지 마세요. 비밀번호를 바꾸면 새 코드로 바뀌어요.\n`,
        ],
        { type: 'text/plain;charset=utf-8' },
      ),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${NAMES.app}-${username}-복구코드.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCopied(true);
    setSaved('file');
  };
  return (
    <div className="l-recovery">
      <ShieldCheck size={32} />
      <h2>내 계정의 예비 열쇠</h2>
      <p>
        비밀번호를 잊었을 때 필요한 개인 복구 코드예요. 지금 저장해 두세요. 다른
        사람에게 공유하지 마세요.
      </p>
      <code>{code}</code>
      <div className="l-account-actions">
        <button className="l-secondary" onClick={download}>
          복구 코드 파일 저장
        </button>
        <button
          className="l-secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setSaved('copy');
            } catch {
              download();
            }
          }}
        >
          {saved === 'copy' ? '복사했어요' : '복사'}
        </button>
      </div>
      <output className="l-help-text" aria-live="polite">
        {saved === 'copy'
          ? '복구 코드를 복사했어요. 메모장 같은 안전한 곳에 붙여 넣어 두세요.'
          : saved === 'file'
            ? '복구 코드 파일을 저장했어요.'
            : '파일로 저장하거나 복사하면 계속할 수 있어요.'}
      </output>
      <button className="l-primary" disabled={!copied} onClick={onDone}>
        저장했어요 · 계속하기 <ArrowRight size={17} />
      </button>
    </div>
  );
}
export function PasswordForm({
  account,
  onChanged,
}: {
  account: AccountProfile;
  onChanged: (code: string) => void;
}) {
  const [old, setOld] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <form
      className="l-account-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password !== confirm) {
          setError('새 비밀번호가 서로 달라요.');
          return;
        }
        if (!validPassword(password)) {
          setError('비밀번호는 10–72자, 한글은 최대 24자로 입력해 주세요.');
          return;
        }
        setBusy(true);
        setError('');
        try {
          const r = await accountLogin({
            op: 'password',
            username: account.username,
            password: old,
            newPassword: password,
          });
          onChanged(r.recoveryCode!);
        } catch (e) {
          setError(friendlyError(e, '변경하지 못했어요.'));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        현재 비밀번호
        <input
          type="password"
          autoComplete="current-password"
          value={old}
          onChange={(e) => setOld(e.target.value)}
          required
        />
      </label>
      <label>
        새 비밀번호
        <input
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <label>
        새 비밀번호 확인
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </label>
      <p className="l-help-text">
        10자 이상. 변경하면 다른 기기의 로그인이 해제되고 복구 코드도 새로
        발급돼요.
      </p>
      {error && (
        <p role="alert" className="l-error">
          {error}
        </p>
      )}
      <button className="l-primary" disabled={busy}>
        {busy ? '변경 중…' : '비밀번호 바꾸기'}
      </button>
    </form>
  );
}
export function AccountGate({
  children,
}: {
  children: (account: AccountProfile, onLogout: () => void) => ReactNode;
}) {
  const [account, setAccount] = useState<AccountProfile | null>(null),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [mode, setMode] = useState<'login' | 'activate' | 'recover'>('login'),
    [username, setUsernameState] = useState(initialUsername),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [code, setCode] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [recovery, setRecovery] = useState('');
  const setUsername = (value: string) => {
    setUsernameState(value);
    remember(LAST_ACCOUNT_KEY, value);
  };
  const [storyOpen, setStoryOpen] = useState(false);
  const sessionUid = useRef<string | null>(null),
    loadGeneration = useRef(0),
    // True while the login form's own request runs: its response already has
    // the profile, so the SIGNED_IN event must not fetch it again.
    loggingIn = useRef(false);
  const load = async () => {
    const generation = ++loadGeneration.current;
    setLoading(true);
    setLoadError('');
    try {
      const { data, error } = await cloud.auth.getSession();
      if (error) throw error;
      if (data.session) {
        const profile = await fetchProfile();
        if (generation === loadGeneration.current) {
          sessionUid.current = profile.id;
          setAccount(profile);
        }
      }
    } catch (e) {
      if (generation === loadGeneration.current)
        setLoadError(friendlyError(e, '계정을 불러오지 못했어요.'));
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  };
  useEffect(() => {
    const initialLoad = setTimeout(() => void load(), 0);
    const expired = () => {
      loadGeneration.current++;
      sessionUid.current = null;
      setAccount(null);
      setLoading(false);
      setLoadError('');
      setError(
        '로그인이 만료됐어요. 저장하지 못한 코디는 이 기기에 보관했어요. 다시 로그인해 주세요.',
      );
      void cloud.auth.signOut({ scope: 'local' });
    };
    window.addEventListener('hohyeon-session-expired', expired);
    const { data } = cloud.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        loadGeneration.current++;
        sessionUid.current = null;
        setLoading(false);
        setLoadError('');
        setAccount(null);
        setPassword('');
        setCode('');
        setRecovery('');
      } else if (
        event === 'SIGNED_IN' &&
        session &&
        session.user.id !== sessionUid.current
      ) {
        sessionUid.current = session.user.id;
        if (loggingIn.current) return;
        loadGeneration.current++;
        setAccount(null);
        setLoading(true);
        setRecovery('');
        setTimeout(() => void load(), 0);
      }
    });
    return () => {
      clearTimeout(initialLoad);
      data.subscription.unsubscribe();
      window.removeEventListener('hohyeon-session-expired', expired);
    };
  }, []);
  if (loading)
    return (
      <main className="l-app l-loading">
        <span className="l-spinner" />
        <p>내 계정과 저장 기록을 확인하는 중…</p>
      </main>
    );
  if (account && !recovery)
    return children(account, () => {
      setAccount(null);
      setPassword('');
      setConfirm('');
      setCode('');
    });
  const selected = ACCOUNTS.find((a) => a.username === username)!;
  return (
    <main className="l-app l-auth-page">
      <section className="l-auth-card">
        {recovery && account ? (
          <RecoveryCard
            username={account.username}
            code={recovery}
            onDone={() => setRecovery('')}
          />
        ) : loadError ? (
          <div className="l-recovery">
            <h2>저장 기록을 불러오지 못했어요.</h2>
            <p role="alert">{loadError}</p>
            <button className="l-primary" onClick={() => void load()}>
              다시 불러오기
            </button>
            <button
              className="l-text"
              onClick={async () => {
                try {
                  await accountLogout();
                } catch {}
                await cloud.auth.signOut({ scope: 'local' });
                setAccount(null);
                setLoadError('');
              }}
            >
              로그인 화면으로
            </button>
          </div>
        ) : (
          <>
            <span className="l-kicker">{NAMES.app}에 어서 와요</span>
            <h2>
              {mode === 'login'
                ? '반가워요, 어서 와요.'
                : mode === 'activate'
                  ? '나만의 계정을 시작해요.'
                  : '다시 열어 보는 우리 공간.'}
            </h2>
            <p className="l-auth-intro">
              {mode === 'login'
                ? '내 아이디로 로그인하면 지난 모습 그대로.'
                : mode === 'activate'
                  ? '받은 개인 활성화 코드로 비밀번호를 정해 주세요.'
                  : '보관해 둔 복구 코드로 비밀번호를 바꿔요.'}
            </p>
            <div
              className="l-auth-tabs"
              role="tablist"
              aria-label="로그인 방법"
            >
              {(
                [
                  ['login', '로그인'],
                  ['activate', '첫 로그인'],
                  ['recover', '비밀번호 찾기'],
                ] as const
              ).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => {
                    setMode(value);
                    setError('');
                    setCode('');
                    setPassword('');
                    setConfirm('');
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <form
              className="l-account-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                if (
                  mode !== 'login' &&
                  (password !== confirm || !validPassword(password))
                ) {
                  setError(
                    password !== confirm
                      ? '비밀번호가 서로 달라요.'
                      : '비밀번호는 10–72자, 한글은 최대 24자로 입력해 주세요.',
                  );
                  return;
                }
                setBusy(true);
                setError('');
                loggingIn.current = true;
                try {
                  const r = await accountLogin({
                    op: mode,
                    username,
                    ...(mode === 'login'
                      ? { password }
                      : { code: code.trim(), newPassword: password }),
                  });
                  if (r.passwordLooksLikeCode)
                    remember(PASSWORD_WARNING_KEY, r.profile.id);
                  sessionUid.current = r.profile.id;
                  loadGeneration.current++;
                  setLoadError('');
                  setLoading(false);
                  setAccount(r.profile);
                  setRecovery(r.recoveryCode ?? '');
                  setPassword('');
                  setCode('');
                } catch (e) {
                  setError(friendlyError(e, '로그인하지 못했어요.'));
                } finally {
                  loggingIn.current = false;
                  setBusy(false);
                }
              }}
            >
              <span className="l-field-label" id="account-id-label">
                내 아이디
              </span>
              <div
                className="l-account-ids"
                id="account-id"
                role="radiogroup"
                tabIndex={-1}
                aria-labelledby="account-id-label"
                onKeyDown={(e) => {
                  const step =
                    e.code === 'ArrowRight' || e.code === 'ArrowDown'
                      ? 1
                      : e.code === 'ArrowLeft' || e.code === 'ArrowUp'
                        ? -1
                        : 0;
                  if (!step) return;
                  e.preventDefault();
                  const i = ACCOUNTS.findIndex((a) => a.username === username);
                  const next =
                    ACCOUNTS[(i + step + ACCOUNTS.length) % ACCOUNTS.length];
                  setUsername(next.username);
                  (
                    e.currentTarget.querySelector(
                      `[data-username="${next.username}"]`,
                    ) as HTMLElement | null
                  )?.focus();
                }}
              >
                {ACCOUNTS.map((a) => (
                  <button
                    type="button"
                    key={a.username}
                    role="radio"
                    data-username={a.username}
                    aria-checked={username === a.username}
                    tabIndex={username === a.username ? 0 : -1}
                    onClick={() => setUsername(a.username)}
                  >
                    <LoginPortrait actor={a.actor} />
                    <strong>{a.name}</strong>
                    <small>{a.username}</small>
                  </button>
                ))}
              </div>
              <input
                id="account-username"
                name="username"
                autoComplete="username"
                value={username}
                readOnly
                className="l-selected-id"
                aria-label="선택한 아이디"
              />
              {mode !== 'login' && (
                <label>
                  {mode === 'activate' ? '개인 활성화 코드' : '개인 복구 코드'}
                  <input
                    type="password"
                    autoComplete="off"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={100}
                    placeholder={
                      mode === 'activate'
                        ? 'HH-로 시작하는 코드'
                        : 'HR-로 시작하는 코드'
                    }
                    required
                  />
                </label>
              )}
              <label>
                {mode === 'login' ? '비밀번호' : '새 비밀번호'}
                <input
                  name="password"
                  type="password"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === 'login' ? undefined : 10}
                  maxLength={72}
                  required
                  placeholder={
                    mode === 'login'
                      ? '비밀번호를 입력해 주세요'
                      : '10자 이상으로 정해 주세요'
                  }
                />
              </label>
              {mode !== 'login' && (
                <label>
                  새 비밀번호 확인
                  <input
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    maxLength={72}
                  />
                </label>
              )}
              {error && (
                <p className="l-error" role="alert">
                  {error}
                </p>
              )}
              <button className="l-primary l-auth-submit" disabled={busy}>
                {busy
                  ? '확인 중…'
                  : `${josa(selected.name, '으로/로')} ${mode === 'login' ? '들어가기' : mode === 'activate' ? '시작하기' : '다시 들어가기'}`}
                <ArrowRight size={18} />
              </button>
            </form>
            <p className="l-auth-foot">
              <KeyRound size={15} />
              {mode === 'activate'
                ? selected.username === 'seungjun'
                  ? '관리자 계정은 직접 발급한 활성화 코드를 써 주세요.'
                  : '개인 코드는 관리자 승준에게 받아 주세요.'
                : '일곱 친구의 고정 계정 · 다른 기기에서도 이어서'}
            </p>
          </>
        )}
      </section>
      <section
        className={'l-auth-story' + (storyOpen ? ' is-open' : '')}
        hidden={!!(recovery && account)}
      >
        <div className="l-auth-logo">
          <Armchair size={26} />
          <b>{NAMES.app}</b>
        </div>
        <span className="l-kicker">일곱 친구의 마을</span>
        <h1>
          같이 한 판,
          <br />
          오늘의 우리.
        </h1>
        <p>내 아이디를 고르고, 친구들을 만나러 가요.</p>
        <button
          type="button"
          className="l-auth-preview-toggle"
          aria-expanded={storyOpen}
          onClick={() => setStoryOpen(!storyOpen)}
        >
          {storyOpen ? '미리보기 접기' : `${selected.name}의 모습 미리보기`}
        </button>
        <div className="l-auth-preview">
          <LoginCharacterPreview actor={selected.actor} open={storyOpen} />
        </div>
        <div className="l-auth-promise">
          <CloudCheck size={19} />
          <span>내 코디와 범 지갑을 안전하게 보관해요.</span>
        </div>
      </section>
    </main>
  );
}
