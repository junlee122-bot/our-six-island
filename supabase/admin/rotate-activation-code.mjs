#!/usr/bin/env node
// Reissue a HoHyeon activation code (admin only, run on your own machine).
//
//   SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service role key> \
//   node supabase/admin/rotate-activation-code.mjs <username> [--reset] [--days=7]
//
// 1. generates a new HH-<48 hex> code locally (crypto random, 192 bits);
// 2. hh_admin_rotate_activation: stores its SHA-256, sets activation_expires_at
//    (default 7 days), revokes app + Auth sessions; --reset also returns an
//    already-activated (hijacked) account to "not activated" and clears its
//    recovery code;
// 3. sets the Auth password to the code via the admin API;
// 4. prints the code to THIS terminal only. Hand it over 1:1. Never paste it
//    into an AI chat, a group chat, an issue or the repository.
//
// Requires migration 20260924120000_hohyeon_hardening.sql. Never commit the
// service role key; pass it through the environment only.
import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const ACCOUNT_IDS = ['dowon', 'gangjae', 'minseo', 'seungjun', 'minjae', 'jaemin', 'hohyeon'];
const args = process.argv.slice(2);
const username = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase();
const reset = args.includes('--reset');
const days = Number(args.find((a) => a.startsWith('--days='))?.slice(7) ?? 7);
if (!username || !ACCOUNT_IDS.includes(username) || !Number.isInteger(days) || days < 1 || days > 30) {
  console.error('usage: node supabase/admin/rotate-activation-code.mjs <' + ACCOUNT_IDS.join('|') + '> [--reset] [--days=1..30]');
  process.exit(2);
}
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.');
  process.exit(2);
}
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const code = 'HH-' + randomBytes(24).toString('hex');
const hash = createHash('sha256').update(code, 'utf8').digest('hex');

const { data: uid, error } = await admin.rpc('hh_admin_rotate_activation', {
  p_username: username,
  p_hash: hash,
  p_days: days,
  p_reset: reset,
});
if (error || !uid) {
  console.error('Rotation refused:', error?.message ?? 'no user id');
  if (/already activated/i.test(error?.message ?? ''))
    console.error('The account is active. Re-run with --reset only if it must be reissued (e.g. hijacked).');
  process.exit(1);
}
const { error: pwError } = await admin.auth.admin.updateUserById(uid, { password: code });
if (pwError) {
  // The stored hash already points at the new code but the password does not
  // match it, so the account cannot be activated until this step succeeds.
  console.error('Password update failed:', pwError.message, '- re-run this script.');
  process.exit(1);
}
console.log('');
console.log(`  ${username}: new activation code (expires in ${days} day${days > 1 ? 's' : ''})`);
console.log('');
console.log('  ' + code);
console.log('');
console.log('  Deliver it 1:1. It is not stored anywhere else; losing it means rotating again.');
