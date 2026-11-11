#!/usr/bin/env node
// Prepare the newly appended Yuchan account; never reset a bound account.
// Requires the add_yuchan_player migration and an Auth Admin service role.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are read only from the environment.
// node --experimental-strip-types supabase/admin/provision-member.mjs yuchan --out=<absolute-local-file>
// The activation code is written only to that new local file, never stdout.
import { createHash, randomBytes } from 'node:crypto';
import { open } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { ACCOUNT_IDS } from '../../app/lounge-roster.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const codeHash = (code) => createHash('sha256').update(code, 'utf8').digest('hex');

/** Exported for tests with a fake Auth/RPC client; importing never contacts Supabase. */
export async function provisionMember({ admin, username, outFile }) {
  if (username !== 'yuchan' || ACCOUNT_IDS.indexOf(username) !== 7)
    throw new Error('Only the new Yuchan roster slot may be provisioned.');
  if (typeof outFile !== 'string' || !isAbsolute(outFile))
    throw new Error('An absolute path for a new local delivery file is required.');
  const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
  const inRepo = relative(repoRoot, resolve(outFile));
  if (!isAbsolute(inRepo) && !inRepo.startsWith('..' + sep) &&
      !['outputs', 'work', 'supabase/admin/reports'].some((dir) => inRepo.startsWith(dir.split('/').join(sep) + sep)))
    throw new Error('The local delivery file must be outside the repository or in a git-ignored output folder.');
  const { data: member, error: readError } = await admin.rpc('hh_member', { p_username: username });
  if (readError || !member || member.username !== username || member.actor !== 7 || typeof member.auth_email !== 'string')
    throw new Error('The new member roster slot could not be verified.');
  if (member.user_id !== null || member.activated !== false)
    throw new Error('This member is already bound or activated; provisioning refused.');
  if (!/^hh-[0-9a-f-]+@accounts\.hohyeon\.invalid$/.test(member.auth_email))
    throw new Error('The member does not have a private roster email.');

  // Reserve the output before any mutation, refusing an existing file.
  // mode 0600 is used where supported; on Windows the containing folder's ACL applies.
  const file = await open(outFile, 'wx', 0o600);
  const code = 'HH-' + randomBytes(24).toString('hex');
  const delivery = {
    username,
    activationCode: code,
    status: 'pending',
    createdAt: new Date().toISOString(),
    instructions: '첫 로그인에서 이 코드를 입력하고 본인이 새 비밀번호를 정하세요. 코드는 공유하지 마세요.',
  };
  const saveDelivery = async () => {
    await file.truncate(0);
    await file.write(JSON.stringify(delivery, null, 2) + '\n', 0, 'utf8');
    await file.sync();
  };
  try {
    await saveDelivery();
    const { data, error } = await admin.auth.admin.createUser({
      email: member.auth_email,
      password: code,
      email_confirm: true,
    });
    const user = data?.user;
    if (error || !user || !UUID.test(user.id) || user.email !== member.auth_email)
      throw new Error('Auth user creation was not confirmed.');
    delivery.authUserId = user.id;
    await saveDelivery();
    const { data: checked, error: checkError } = await admin.auth.admin.getUserById(user.id);
    if (checkError || checked?.user?.id !== user.id || checked.user.email !== member.auth_email)
      throw new Error('The new Auth identity could not be verified.');
    const { data: bound, error: bindError } = await admin.rpc('hh_provision_member', {
      p_username: username,
      p_uid: user.id,
      p_auth_email: checked.user.email,
      p_activation_hash: codeHash(code),
    });
    if (bindError || bound?.username !== username || bound.actor !== 7 || bound.activated !== false ||
        typeof bound.expiresAt !== 'string' || !Number.isFinite(Date.parse(bound.expiresAt)))
      throw new Error('The new member binding was not confirmed.');
    delivery.status = 'activation-ready';
    delivery.expiresAt = bound.expiresAt;
    await saveDelivery();
    return { username, outFile: resolve(outFile), expiresAt: bound.expiresAt };
  } catch {
    // Do not reset, delete or rotate anything on an ambiguous RPC failure:
    // the bind may have committed even if its response was lost. Keep the
    // local code/created uid for an administrator to reconcile this one slot.
    delivery.status = 'needs-admin-check';
    try { await saveDelivery(); } catch { /* Original local file remains private. */ }
    throw new Error('Provisioning was not confirmed. Review the local delivery file and this member before retrying.');
  } finally {
    await file.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const username = args.find((a) => !a.startsWith('--'));
  const outFile = args.find((a) => a.startsWith('--out='))?.slice(6);
  if (args.includes('--help')) {
    console.log('node --experimental-strip-types supabase/admin/provision-member.mjs yuchan --out=<absolute-local-file>');
    return;
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.');
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await provisionMember({ admin, username, outFile });
  console.log('Yuchan activation is ready. The code is only in the specified local delivery file.');
  console.log('Expires: ' + result.expiresAt);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => {
    console.error('Provisioning did not complete. Check the roster, permissions and private local delivery file. No credentials were printed.');
    process.exitCode = 1;
  });
}
