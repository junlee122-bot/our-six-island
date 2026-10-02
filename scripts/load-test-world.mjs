#!/usr/bin/env node
// 동시 접속 부하 테스트 (admin only, run on your own machine during 점검).
//
//   SUPABASE_URL=https://ogfpeqeoaznwjbrbedbx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service role key> \
//   node --experimental-strip-types scripts/load-test-world.mjs --yes [options]
//
//   --clients=7     simulated friends at once (1–20)
//   --seconds=120   how long to run (10–900)
//   --move-ms=500   one write cycle per client this often (a step while walking)
//   --read-ms=8000  one plain read per client this often (the visible-tab poll)
//   --json          print the summary as JSON
//
// What it does: every client runs the Edge function's own loop against the
// real world row: hh_world_read, then hh_world_commit with the revision it
// read (compare-and-swap), retrying with the same backoff (casBackoffMs) up to
// 12 times. It commits the state exactly as it read it, so nothing in the
// village changes; only `revision` goes up. A commit can only succeed when no
// one else wrote in between, so a real friend's change is never overwritten.
// Turn 점검 on first (HH_MAINTENANCE, see ACCOUNTS.md) so nobody playing gets
// slowed down; the script also takes a world snapshot before it starts.
//
// The key is read from the environment only and never printed or written.
import { createClient } from '@supabase/supabase-js';
import { casBackoffMs } from '../app/lounge-accounts.ts';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const num = (name, def, min, max) => {
  const v = args[name] === undefined ? def : Number(args[name]);
  if (!Number.isFinite(v) || v < min || v > max) throw new Error(`--${name} must be ${min}–${max}`);
  return v;
};
const CLIENTS = num('clients', 7, 1, 20);
const SECONDS = num('seconds', 120, 10, 900);
const MOVE_MS = num('move-ms', 500, 100, 60_000);
const READ_MS = num('read-ms', 8000, 500, 120_000);
const CAS_ATTEMPTS = 12;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (environment only).');
  process.exit(2);
}
if (!args.yes) {
  console.error('This writes to the real world row (same state, revision +1 per write). Re-run with --yes during 점검.');
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function rpc(name, params = {}) {
  const { data, error } = await db.rpc(name, params);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}
async function status() {
  try {
    const r = await fetch(url + '/functions/v1/hohyeon-auth', {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'status' }),
    });
    return (await r.json())?.maintenance ?? null;
  } catch {
    return undefined;
  }
}

const stats = {
  reads: [],
  writes: [],
  attempts: [],
  conflicts: 0,
  contention: 0,
  exhausted: 0,
  errors: [],
};
const time = async (fn) => {
  const t = performance.now();
  const v = await fn();
  return [v, performance.now() - t];
};
/** One write as the Edge function does it: read, commit the read revision, retry on a lost race. */
async function writeCycle() {
  const t0 = performance.now();
  for (let attempt = 0; attempt < CAS_ATTEMPTS; attempt++) {
    if (attempt) await sleep(casBackoffMs(attempt - 1));
    const row = await rpc('hh_world_read');
    const revision = await rpc('hh_world_commit', { p_expected: row.revision, p_state: row.state });
    if (revision !== null) {
      stats.writes.push(performance.now() - t0);
      stats.attempts.push(attempt + 1);
      if (attempt >= 3) stats.contention++;
      return;
    }
    stats.conflicts++;
  }
  stats.exhausted++;
  stats.writes.push(performance.now() - t0);
  stats.attempts.push(CAS_ATTEMPTS);
}
async function client(i, until) {
  // Spread the clients out like real friends who did not press keys together.
  await sleep(Math.random() * MOVE_MS);
  let nextRead = Date.now() + Math.random() * READ_MS;
  while (Date.now() < until) {
    const started = Date.now();
    try {
      if (Date.now() >= nextRead) {
        const [, ms] = await time(() => rpc('hh_world_read'));
        stats.reads.push(ms);
        nextRead = Date.now() + READ_MS;
      } else await writeCycle();
    } catch (e) {
      if (stats.errors.length < 20) stats.errors.push(`client ${i}: ${e instanceof Error ? e.message : String(e)}`);
    }
    await sleep(Math.max(0, MOVE_MS * (0.8 + Math.random() * 0.4) - (Date.now() - started)));
  }
}
const pct = (list, p) => {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]);
};
const sum = (list) => ({ n: list.length, p50: pct(list, 50), p95: pct(list, 95), max: list.length ? Math.round(Math.max(...list)) : null });

const fix = await status();
if (fix === null && !args['allow-live'])
  console.warn('경고: 점검(HH_MAINTENANCE)이 꺼져 있어요. 접속한 친구의 요청이 느려질 수 있어요. (--allow-live 로 이 경고를 끕니다)');
const before = await rpc('hh_world_read');
const bytes = Buffer.byteLength(JSON.stringify(before.state));
const snap = await rpc('hh_world_snapshot', { p_reason: 'load-test' }).catch((e) => ({ error: String(e.message ?? e) }));
console.log(`world revision ${before.revision}, ${Math.round(bytes / 1024)} KB · snapshot ${JSON.stringify(snap)?.slice(0, 120)}`);
console.log(`${CLIENTS} clients · ${SECONDS}s · a write every ${MOVE_MS} ms and a read every ${READ_MS} ms each…`);
const until = Date.now() + SECONDS * 1000;
await Promise.all(Array.from({ length: CLIENTS }, (_, i) => client(i, until)));
const after = await rpc('hh_world_read');
const unchanged = JSON.stringify(after.state) === JSON.stringify(before.state);
const summary = {
  clients: CLIENTS,
  seconds: SECONDS,
  worldKB: Math.round(bytes / 1024),
  revisions: after.revision - before.revision,
  writesPerSecond: Math.round((stats.writes.length / SECONDS) * 10) / 10,
  writeMs: sum(stats.writes),
  readMs: sum(stats.reads),
  attempts: { mean: stats.attempts.length ? Math.round((stats.attempts.reduce((a, b) => a + b, 0) / stats.attempts.length) * 100) / 100 : null, p95: pct(stats.attempts, 95), max: stats.attempts.length ? Math.max(...stats.attempts) : null },
  lostRaces: stats.conflicts,
  contention4plus: stats.contention,
  exhausted12: stats.exhausted,
  errors: stats.errors,
  stateUnchanged: unchanged,
};
if (args.json) console.log(JSON.stringify(summary, null, 2));
else {
  console.log(`\nwrites ${summary.writeMs.n} (${summary.writesPerSecond}/s) · p50 ${summary.writeMs.p50} ms · p95 ${summary.writeMs.p95} ms · max ${summary.writeMs.max} ms`);
  console.log(`reads  ${summary.readMs.n} · p50 ${summary.readMs.p50} ms · p95 ${summary.readMs.p95} ms`);
  console.log(`attempts per write: mean ${summary.attempts.mean} · p95 ${summary.attempts.p95} · max ${summary.attempts.max}`);
  console.log(`lost races ${summary.lostRaces} · 4+ attempts (cas_contention) ${summary.contention4plus} · gave up after 12 (cas_exhausted → 503) ${summary.exhausted12}`);
  if (summary.errors.length) console.log('errors:\n  ' + summary.errors.join('\n  '));
  console.log(unchanged ? 'world state unchanged ✔' : '주의: 테스트 중 월드 상태가 바뀌었어요 (테스트 밖의 요청이 있었어요).');
}
