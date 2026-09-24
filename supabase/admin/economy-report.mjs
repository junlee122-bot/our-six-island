#!/usr/bin/env node
// Economy dashboard for 범타듀 밸리 (admin only, run on your own machine).
//
//   SUPABASE_ACCESS_TOKEN=<personal access token> \
//   node --experimental-strip-types supabase/admin/economy-report.mjs [options]
//
//   --out=<file.md|file.html>  also write a Markdown or HTML report file
//   --days=7                   window for "recent" sources/sinks (1–90)
//   --snapshot=<id>            report on hohyeon.world_snapshots row <id>
//   --input=<world.json>       offline: a saved world row/state JSON, no API call
//   --json                     print the computed report as JSON
//   --check-sql                also run public.hh_economy_report() and compare totals
//   --project=<ref>            default $SUPABASE_PROJECT_REF or ogfpeqeoaznwjbrbedbx
//
// Reads the world row through the Management API SQL endpoint
// (POST /v1/projects/<ref>/database/query) with a personal access token from
// https://supabase.com/dashboard/account/tokens. Only ledger, life counters
// and the member roster are fetched — never rooms (hidden cards), mail or
// guestbook text. The token is read from the environment and never printed.
// The output lists every friend's balance: keep report files out of the
// repository and chats (supabase/admin/reports/ is git-ignored).
//
// Node 22 needs --experimental-strip-types to import the TypeScript report
// module (Node ≥ 23.6 runs it without the flag). Computation lives in
// app/lounge-economy-report.ts (unit tested in tests/lounge-economy-report.test.mjs).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname } from 'node:path';

let lib;
try {
  lib = await import('../../app/lounge-economy-report.ts');
} catch (e) {
  console.error('리포트 모듈을 불러오지 못했습니다:', e instanceof Error ? e.message : e);
  console.error('Node 22에서는 `node --experimental-strip-types supabase/admin/economy-report.mjs`로 실행하세요.');
  process.exit(2);
}
const { economyReport, formatEconomyReport, economyReportMarkdown, economyReportHtml, beomText } = lib;

const args = process.argv.slice(2);
const opt = (name) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  return hit === undefined ? undefined : hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};
const known = ['out', 'days', 'snapshot', 'input', 'json', 'check-sql', 'project', 'help'];
const unknown = args.filter((a) => !known.some((k) => a === `--${k}` || a.startsWith(`--${k}=`)));
if (unknown.length || opt('help')) {
  console.error(
    'usage: node --experimental-strip-types supabase/admin/economy-report.mjs ' +
      '[--out=report.md|report.html] [--days=7] [--snapshot=<id>] [--input=world.json] [--json] [--check-sql] [--project=<ref>]',
  );
  process.exit(opt('help') && !unknown.length ? 0 : 2);
}
const days = Number(opt('days') ?? 7);
const snapshot = opt('snapshot');
const out = opt('out');
if (!Number.isInteger(days) || days < 1 || days > 90) {
  console.error('--days must be an integer between 1 and 90.');
  process.exit(2);
}
if (snapshot !== undefined && !/^[1-9][0-9]{0,17}$/.test(String(snapshot))) {
  console.error('--snapshot must be a snapshot id (see hohyeon.world_snapshots).');
  process.exit(2);
}
if (out !== undefined && (out === true || !['.md', '.html'].includes(extname(out).toLowerCase()))) {
  console.error('--out must end in .md or .html');
  process.exit(2);
}
const project = String(opt('project') ?? process.env.SUPABASE_PROJECT_REF ?? 'ogfpeqeoaznwjbrbedbx');
if (!/^[a-z0-9]{20}$/.test(project)) {
  console.error('Invalid project ref.');
  process.exit(2);
}

async function sql(query) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error('SUPABASE_ACCESS_TOKEN must be set in the environment (personal access token).');
    process.exit(2);
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    // Never echo the token, even if an error body were to contain it.
    console.error(`Management API ${res.status}:`, text.split(token).join('***').slice(0, 500));
    process.exit(1);
  }
  return JSON.parse(text);
}

// One read-only SELECT. Rooms, mail and guestbook are deliberately left out.
const pick = (s) => `jsonb_build_object(
    'schema', ${s}->'schema',
    'ledger', ${s}->'ledger',
    'life', jsonb_build_object('actors', ${s}->'life'->'actors', 'sold', ${s}->'life'->'sold',
                               'harvested', ${s}->'life'->'harvested'))`;
const members = `coalesce((select jsonb_agg(jsonb_build_object('uid', m.user_id, 'username', m.username, 'actor', m.actor) order by m.actor)
    from hohyeon.members m where m.user_id is not null), '[]'::jsonb)`;
const worldQuery =
  snapshot === undefined
    ? `select jsonb_build_object('revision', w.revision, 'updatedAt', w.updated_at,
         'now', floor(extract(epoch from clock_timestamp()) * 1000), 'source', 'live',
         'members', ${members}, 'state', ${pick('w.state')}) as row
       from hohyeon.world w where w.id`
    : `select jsonb_build_object('revision', s.revision, 'updatedAt', s.taken_at,
         'now', floor(extract(epoch from s.taken_at) * 1000),
         'source', 'snapshot #' || s.id || ' (' || s.reason || ')',
         'members', ${members}, 'state', ${pick('s.state')}) as row
       from hohyeon.world_snapshots s where s.id = ${snapshot}`;

let row;
const input = opt('input');
if (input !== undefined) {
  if (input === true) {
    console.error('--input needs a file path.');
    process.exit(2);
  }
  const data = JSON.parse(await readFile(input, 'utf8'));
  // Accepts a raw state, {revision, state} (hh_world_read) or this script's row.
  row = data && typeof data === 'object' && 'state' in data ? data : { state: data };
  row.source ??= 'file ' + input;
  row.now ??= Date.now();
} else {
  const rows = await sql(worldQuery);
  row = rows?.[0]?.row;
  if (typeof row === 'string') row = JSON.parse(row);
  if (!row) {
    console.error(snapshot === undefined ? 'World row not found.' : `Snapshot ${snapshot} not found.`);
    process.exit(1);
  }
}

const report = economyReport({
  state: row.state,
  now: Number(row.now),
  revision: row.revision ?? null,
  updatedAt: row.updatedAt ?? null,
  members: row.members ?? [],
  days,
  source: row.source,
});

if (opt('json')) console.log(JSON.stringify(report, null, 2));
else process.stdout.write(formatEconomyReport(report));

if (opt('check-sql')) {
  if (input !== undefined || snapshot !== undefined) {
    console.error('\n--check-sql compares the live world only; skipped.');
  } else {
    let sqlReport = (await sql(`select public.hh_economy_report(${days}) as r`))?.[0]?.r;
    if (typeof sqlReport === 'string') sqlReport = JSON.parse(sqlReport);
    const t = sqlReport?.totals ?? {};
    const pairs = [
      ['잔액 합계', t.balances, report.totals.balances],
      ['게임 예약금', t.reserved, report.totals.reserved],
      ['하우스', t.house_balance, report.totals.houseBalance],
      ['누적 발행', t.granted, report.totals.granted],
      ['누적 지출', t.spent, report.totals.spent],
    ];
    const bad = pairs.filter(([, a, b]) => Number(a) !== b);
    console.log('\n■ SQL 교차 검증 (hh_economy_report)');
    if (sqlReport?.revision !== report.revision)
      console.log(`- world revision이 달라졌습니다(${report.revision} → ${sqlReport?.revision}); 그 사이 게임이 진행됐을 수 있습니다.`);
    if (!bad.length) console.log('- 총계가 JS 계산과 일치합니다.');
    for (const [label, a, b] of bad) console.log(`- ${label}: SQL ${beomText(Number(a))} ≠ JS ${beomText(b)}`);
    if (bad.length && sqlReport?.revision === report.revision) process.exitCode = 1;
  }
}

if (typeof out === 'string') {
  const body = extname(out).toLowerCase() === '.html' ? economyReportHtml(report) : economyReportMarkdown(report);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, body, { mode: 0o600 });
  console.error(`\n리포트를 ${out}에 저장했습니다. 친구들의 잔액이 들어 있으니 저장소나 대화방에 올리지 마세요.`);
}
if (!report.totals.invariantOk) process.exitCode = 1;
