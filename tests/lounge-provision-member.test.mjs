import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile, unlink, rmdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { provisionMember } from '../supabase/admin/provision-member.mjs';

const email = 'hh-' + randomUUID() + '@accounts.hohyeon.invalid';
function fake({ bound = false, activated = false, wrongEmail = false, failBind = false } = {}) {
  const uid = randomUUID(), calls = [];
  const admin = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === 'hh_member') return { data: { username: 'yuchan', actor: 7, user_id: bound ? uid : null, activated, auth_email: email }, error: null };
      if (name === 'hh_provision_member') return failBind
        ? { data: null, error: { message: 'simulated transport failure' } }
        : { data: { username: 'yuchan', actor: 7, activated: false, expiresAt: '2026-11-18T00:00:00Z' }, error: null };
      throw new Error('Unexpected RPC');
    },
    auth: { admin: {
      createUser: async (args) => {
        calls.push({ name: 'createUser', args });
        return { data: { user: { id: uid, email: wrongEmail ? 'wrong@example.invalid' : email } }, error: null };
      },
      getUserById: async (id) => {
        calls.push({ name: 'getUserById', args: { id } });
        return { data: { user: { id: uid, email } }, error: null };
      },
    } },
  };
  return { admin, calls, uid };
}
async function deliveryFile(t) {
  const work = resolve('work');
  await mkdir(work, { recursive: true });
  const folder = await mkdtemp(join(work, 'provision-test-'));
  const file = join(folder, 'delivery.json');
  // Each fixture owns only this exact file and empty directory; no recursive deletion.
  t.after(async () => { await unlink(file).catch(() => {}); await rmdir(folder); });
  return file;
}

test('provisioning creates the new Auth user, verifies its email and writes the code only to a local file', async (t) => {
  const { admin, calls, uid } = fake();
  const file = await deliveryFile(t);
  const logged = [];
  const log = console.log;
  console.log = (...args) => logged.push(args.join(' '));
  let result;
  try { result = await provisionMember({ admin, username: 'yuchan', outFile: file }); }
  finally { console.log = log; }
  const delivery = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(delivery.status, 'activation-ready');
  assert.equal(/^HH-[0-9a-f]{48}$/.test(delivery.activationCode), true);
  assert.equal(delivery.authUserId, uid);
  assert.equal(result.username, 'yuchan');
  assert.equal('activationCode' in result, false);
  assert.deepEqual(logged, []);
  assert.deepEqual(calls.map((c) => c.name), ['hh_member', 'createUser', 'getUserById', 'hh_provision_member']);
  assert.equal(calls[1].args.email_confirm, true);
  assert.equal(calls[1].args.email, email);
  assert.equal(calls[1].args.password === delivery.activationCode, true);
  assert.equal(calls[3].args.p_auth_email, email);
  assert.equal(calls[3].args.p_uid, uid);
  assert.equal(calls[3].args.p_activation_hash, createHash('sha256').update(delivery.activationCode).digest('hex'));
});

test('bound or activated members cannot be reset and no Auth write is attempted', async (t) => {
  for (const options of [{ bound: true }, { activated: true }]) {
    const { admin, calls } = fake(options);
    const file = await deliveryFile(t);
    await assert.rejects(provisionMember({ admin, username: 'yuchan', outFile: file }), /already bound or activated/);
    assert.deepEqual(calls.map((c) => c.name), ['hh_member']);
    await assert.rejects(stat(file), { code: 'ENOENT' });
  }
});

test('an existing delivery file is never overwritten or followed by an Auth write', async (t) => {
  const { admin, calls } = fake();
  const file = await deliveryFile(t);
  await writeFile(file, 'keep this delivery', 'utf8');
  await assert.rejects(provisionMember({ admin, username: 'yuchan', outFile: file }), { code: 'EEXIST' });
  assert.equal(await readFile(file, 'utf8'), 'keep this delivery');
  assert.deepEqual(calls.map((c) => c.name), ['hh_member']);
});

test('a mismatched Auth identity never reaches the binding RPC', async (t) => {
  const { admin, calls } = fake({ wrongEmail: true });
  const file = await deliveryFile(t);
  await assert.rejects(provisionMember({ admin, username: 'yuchan', outFile: file }), /not confirmed/);
  assert.equal(calls.some((c) => c.name === 'hh_provision_member'), false);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).status, 'needs-admin-check');
});

test('an ambiguous binding failure retains local recovery information and never resets or deletes a user', async (t) => {
  const { admin, calls, uid } = fake({ failBind: true });
  const file = await deliveryFile(t);
  await assert.rejects(provisionMember({ admin, username: 'yuchan', outFile: file }), /not confirmed/);
  const delivery = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(delivery.status, 'needs-admin-check');
  assert.equal(delivery.authUserId, uid);
  assert.equal(calls.some((c) => /update|delete|reset|rotate/i.test(c.name)), false);
});

test('other roster names and files in tracked repository folders are refused before requests', async () => {
  const { admin, calls } = fake();
  await assert.rejects(provisionMember({ admin, username: 'hohyeon', outFile: resolve('work', 'unused.json') }), /Only the new Yuchan/);
  await assert.rejects(provisionMember({ admin, username: 'yuchan', outFile: resolve('public', 'must-not-exist.json') }), /git-ignored/);
  assert.deepEqual(calls, []);
});
