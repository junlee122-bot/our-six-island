import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AccountSaveError,
  activationCodeExpired,
  unactivatedLoginProblem,
  accountSave,
  authFailureKey,
  authLockoutSeconds,
  AUTH_LOCKOUT,
  casBackoffMs,
  clientIp,
  jsonbTextBytes,
  looksLikeIssuedCode,
  newPasswordProblem,
  PASSWORD_IS_CODE,
  SAVE_UPDATE_REQUIRED,
  SAVE_SERVER_BEHIND,
  serverAccountSave,
} from '../app/lounge-accounts.ts';
import {
  freshLounge,
  LOUNGE_SAVE_VERSION,
  LoungeSaveError,
  migrateLoungeSave,
  readLounge,
  readLoungeStrict,
} from '../app/lounge-look.ts';

const HH = 'HH-' + 'a1'.repeat(24);
const HR = 'HR-' + '0f'.repeat(24);

test('a new password may not equal, contain or look like an issued code', () => {
  assert.equal(looksLikeIssuedCode(HH), true);
  assert.equal(looksLikeIssuedCode(' ' + HR.toUpperCase() + ' '), true);
  assert.equal(looksLikeIssuedCode('HH-short'), false);
  assert.equal(newPasswordProblem(HH, HH), PASSWORD_IS_CODE);
  assert.equal(newPasswordProblem(HR), PASSWORD_IS_CODE);
  assert.equal(newPasswordProblem('my-' + HH + '!', HH), PASSWORD_IS_CODE);
  assert.equal(newPasswordProblem(HH.toUpperCase(), HH), PASSWORD_IS_CODE);
  assert.equal(newPasswordProblem('correct horse battery', HH), null);
  assert.equal(newPasswordProblem('correct horse battery', undefined, ''), null);
});

test('client IP prefers platform headers, else the rightmost forwarded entry', () => {
  const h = (o) => (n) => o[n] ?? null;
  assert.equal(clientIp(h({ 'cf-connecting-ip': '203.0.113.9', 'x-forwarded-for': '1.1.1.1' })), '203.0.113.9');
  assert.equal(clientIp(h({ 'x-real-ip': '2001:db8::1' })), '2001:db8::1');
  assert.equal(clientIp(h({ 'x-forwarded-for': '6.6.6.6, 198.51.100.7' })), '198.51.100.7');
  assert.equal(clientIp(h({ 'x-forwarded-for': 'spoofed, <script>' })), 'unknown');
  assert.equal(clientIp(h({ 'cf-connecting-ip': 'not an ip', 'x-forwarded-for': '10.0.0.1' })), '10.0.0.1');
  assert.equal(clientIp(h({})), 'unknown');
});

test('lockout counts failures only and doubles after the free attempts', () => {
  const { free, base, cap } = AUTH_LOCKOUT;
  for (let n = 0; n <= free; n++) assert.equal(authLockoutSeconds(n), 0);
  assert.equal(authLockoutSeconds(free + 1), base);
  assert.equal(authLockoutSeconds(free + 2), base * 2);
  assert.equal(authLockoutSeconds(free + 3), base * 4);
  assert.equal(authLockoutSeconds(free + 50), cap);
  assert.equal(authLockoutSeconds(1e9), cap);
  assert.equal(authLockoutSeconds(NaN), 0);
  const a = authFailureKey('dowon', 'ip1'), b = authFailureKey('dowon', 'ip2');
  assert.notEqual(a, b, 'another IP must not share (and cannot trigger) the lock');
  assert.ok(authFailureKey('x'.repeat(200), 'y'.repeat(200)).length <= 160);
});

test('CAS backoff is exponential, jittered and capped', () => {
  assert.equal(casBackoffMs(0, 0), 10);
  assert.equal(casBackoffMs(0, 1), 20);
  assert.equal(casBackoffMs(3, 0), 80);
  assert.equal(casBackoffMs(3, 1), 160);
  for (let n = 0; n < 30; n++) {
    const d = casBackoffMs(n);
    assert.ok(d >= 10 && d <= 400, `attempt ${n}: ${d}`);
  }
  assert.equal(casBackoffMs(20, 1), 400);
});

test('jsonb text size matches Postgres formatting', () => {
  // select octet_length('{"a":1,"b":[1,2],"c":"가"}'::jsonb::text) = 33
  assert.equal(jsonbTextBytes({ a: 1, b: [1, 2], c: '가' }), 33);
  assert.equal(jsonbTextBytes(freshLounge(0)) > JSON.stringify(freshLounge(0)).length, true);
});

test('server save path fails closed; client reads stay lenient', () => {
  const good = freshLounge(3);
  assert.deepEqual(serverAccountSave(good, 3), accountSave(good, 3));
  const reject = (value, message) =>
    assert.throws(
      () => serverAccountSave(value, 3, good),
      (e) => e instanceof AccountSaveError && e.status === 409 && e.message === message,
    );
  reject({ ...good, version: 0 }, SAVE_UPDATE_REQUIRED);
  reject({ ...good, version: undefined }, SAVE_UPDATE_REQUIRED);
  reject({ ...good, version: '1' }, SAVE_UPDATE_REQUIRED);
  reject({ ...good, version: LOUNGE_SAVE_VERSION + 1 }, SAVE_SERVER_BEHIND);
  reject(null, SAVE_UPDATE_REQUIRED);
  const cyclic = { ...good };
  cyclic.self = cyclic;
  reject(cyclic, SAVE_UPDATE_REQUIRED);
  // Lenient client-side normalization is unchanged.
  assert.deepEqual(accountSave({ ...good, version: 99 }, 3).looks, freshLounge(3).looks);
  assert.deepEqual(readLounge('broken', 2), freshLounge(2));
  assert.throws(() => readLoungeStrict('broken', 2), LoungeSaveError);
});

test('schema migration hook upgrades or refuses', () => {
  const v1 = { ...freshLounge(0) };
  assert.equal(migrateLoungeSave(v1).version, LOUNGE_SAVE_VERSION);
  assert.throws(() => migrateLoungeSave([]), (e) => e.reason === 'parse');
  assert.throws(() => migrateLoungeSave({ version: -1 }), (e) => e.reason === 'version');
  assert.throws(() => migrateLoungeSave({ version: LOUNGE_SAVE_VERSION + 1 }), (e) => e.reason === 'newer');
});

test('D-1: login repair on an unactivated account refuses code-shaped passwords and expired codes', () => {
  const now = Date.parse('2026-09-26T00:00:00Z');
  const future = new Date(now + 3_600_000).toISOString();
  const past = new Date(now - 1).toISOString();
  // An old (leaked) code left as the Auth password by a half-finished rotation.
  assert.equal(unactivatedLoginProblem(HH, future, now), 'repair_code_shaped');
  assert.equal(unactivatedLoginProblem(' ' + HH.toUpperCase() + ' ', null, now), 'repair_code_shaped');
  assert.equal(unactivatedLoginProblem(HR, null, now), 'repair_code_shaped');
  // A legitimate repair: the friend's new (non-code) password, code not expired.
  assert.equal(unactivatedLoginProblem('correct horse battery', future, now), null);
  assert.equal(unactivatedLoginProblem('correct horse battery', null, now), null);
  // Expired: refused even with a normal-looking password.
  assert.equal(unactivatedLoginProblem('correct horse battery', past, now), 'repair_code_expired');
  assert.equal(activationCodeExpired(new Date(now).toISOString(), now), true);
  assert.equal(activationCodeExpired(future, now), false);
  assert.equal(activationCodeExpired(null, now), false);
  assert.equal(activationCodeExpired('not a date', now), true);
  // Every password the repair path accepts is also one newPasswordProblem accepts.
  assert.equal(newPasswordProblem(HH), PASSWORD_IS_CODE);
});
