-- HoHyeon world backup + admin economy report.
-- Additive: no existing table, function or row changes. Apply after
-- 20260924120000_hohyeon_hardening.sql. Operations: ACCOUNTS.md
-- ("월드 백업과 복구", "경제 대시보드"), restore steps in
-- supabase/admin/restore-world.sql.
--
-- Everything shared (rooms, ledger/wallets, life/farms, receipts) lives in the
-- single row hohyeon.world, so one snapshot = one consistent copy of the game.

-- 0. pg_cron runs the daily snapshot (available on Supabase; created in the
--    extensions-managed pg_catalog/cron schema).
create extension if not exists pg_cron;

-- 1. Snapshot table (service_role only, like the other hohyeon tables).
create table if not exists hohyeon.world_snapshots (
  id bigserial primary key,
  taken_at timestamptz not null default now(),
  revision bigint not null,
  reason text not null default 'manual',
  state jsonb not null,
  bytes integer not null
);
create index if not exists world_snapshots_taken_idx on hohyeon.world_snapshots(taken_at desc);
create index if not exists world_snapshots_revision_idx on hohyeon.world_snapshots(revision, taken_at desc);
alter table hohyeon.world_snapshots enable row level security;
revoke all on hohyeon.world_snapshots from public, anon, authenticated;
revoke all on sequence hohyeon.world_snapshots_id_seq from public, anon, authenticated;
grant select, insert, update, delete on hohyeon.world_snapshots to service_role;
grant usage, select on sequence hohyeon.world_snapshots_id_seq to service_role;

-- 2. Retention. Keeps
--    - every snapshot from the last 14 days,
--    - the newest snapshot of each KST day for 14–90 days,
--    - the newest snapshot of each KST ISO week after that,
--    - any snapshot whose reason starts with 'keep' (pinned, never pruned),
--    - and always the newest snapshot overall.
--    Returns the number of deleted rows.
create or replace function public.hh_world_snapshot_prune()
returns integer language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 with ranked as (
   select id, taken_at, reason,
     row_number() over (partition by date_trunc('day', taken_at at time zone 'Asia/Seoul') order by taken_at desc, id desc) as day_rank,
     row_number() over (partition by date_trunc('week', taken_at at time zone 'Asia/Seoul') order by taken_at desc, id desc) as week_rank,
     row_number() over (order by taken_at desc, id desc) as overall_rank
   from hohyeon.world_snapshots
 )
 delete from hohyeon.world_snapshots s using ranked r
 where s.id = r.id
   and r.overall_rank > 1
   and r.reason not like 'keep%'
   and r.taken_at < now() - interval '14 days'
   and not (r.taken_at >= now() - interval '90 days' and r.day_rank = 1)
   and not (r.taken_at < now() - interval '90 days' and r.week_rank = 1);
 get diagnostics n = row_count;
 return n;
end $$;

-- 3. Take a snapshot of the current world row. Skipped (returns the existing
--    snapshot) when one with the same revision was taken within the last hour,
--    so repeated "pre-<action>" calls and cron retries are cheap. Prunes old
--    snapshots afterwards. Returns
--    {id, revision, bytes, skipped, pruned, taken_at, reason}.
create or replace function public.hh_world_snapshot(p_reason text default 'manual')
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 w hohyeon.world;
 s hohyeon.world_snapshots;
 reason text := left(coalesce(nullif(btrim(p_reason), ''), 'manual'), 80);
 pruned integer;
begin
 -- Serialise concurrent snapshot calls (cron + a manual one).
 perform pg_advisory_xact_lock(hashtext('hohyeon.world_snapshot'));
 select * into w from hohyeon.world where id;
 if not found then raise exception 'World row missing'; end if;
 select * into s from hohyeon.world_snapshots
  where revision = w.revision and taken_at > now() - interval '1 hour'
  order by taken_at desc, id desc limit 1;
 if found then
   return jsonb_build_object('id', s.id, 'revision', s.revision, 'bytes', s.bytes,
     'skipped', true, 'pruned', 0, 'taken_at', s.taken_at, 'reason', s.reason);
 end if;
 insert into hohyeon.world_snapshots(revision, reason, state, bytes)
 values (w.revision, reason, w.state, octet_length(w.state::text))
 returning * into s;
 pruned := public.hh_world_snapshot_prune();
 return jsonb_build_object('id', s.id, 'revision', s.revision, 'bytes', s.bytes,
   'skipped', false, 'pruned', pruned, 'taken_at', s.taken_at, 'reason', s.reason);
end $$;

-- 4. Read one snapshot for review before a restore (admin use, read-only).
--    Includes a small summary and the current world revision for comparison.
create or replace function public.hh_world_restore_preview(p_id bigint)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s hohyeon.world_snapshots; cur hohyeon.world;
begin
 select * into s from hohyeon.world_snapshots where id = p_id;
 if not found then raise exception 'Unknown snapshot %', p_id; end if;
 select * into cur from hohyeon.world where id;
 return jsonb_build_object(
   'id', s.id,
   'taken_at', s.taken_at,
   'revision', s.revision,
   'reason', s.reason,
   'bytes', s.bytes,
   'current_revision', cur.revision,
   'current_updated_at', cur.updated_at,
   'revisions_behind', cur.revision - s.revision,
   'summary', jsonb_build_object(
     'schema', s.state->'schema',
     'ledger_revision', s.state->'ledger'->'revision',
     'wallets', (select count(*) from jsonb_object_keys(coalesce(s.state->'ledger'->'accounts', '{}'::jsonb))),
     'rooms', (select count(*) from jsonb_object_keys(coalesce(s.state->'rooms', '{}'::jsonb))),
     'life_members', (select count(*) from jsonb_object_keys(coalesce(s.state->'life'->'actors', '{}'::jsonb)))
   ),
   'state', s.state);
end $$;

-- 5. Economy summary straight from SQL (admin only). The full report with
--    per-source breakdowns and Korean tables is computed in JS by
--    supabase/admin/economy-report.mjs (app/lounge-economy-report.ts); this
--    function is the quick SQL-editor view and the CLI's cross-check.
--    Per-account balance/reserved/gambling net, per-game-type totals, house,
--    minted/spent totals, money supply and grant/spend entries per KST day and
--    for the last p_days days (ledger.entries keeps only the newest 200).
create or replace function public.hh_economy_report(p_days integer default 7)
returns jsonb language sql stable security definer set search_path='' as $$
with w as (
  select revision, updated_at, coalesce(state->'ledger', '{}'::jsonb) as l from hohyeon.world where id
), acc as (
  select a.key as wallet, (a.value #>> '{}')::bigint as balance
  from w, jsonb_each(coalesce(w.l->'accounts', '{}'::jsonb)) a
), g as (
  select x.key as id, x.value->>'game' as game, x.value->>'state' as st, x.value as v
  from w, jsonb_each(coalesce(w.l->'games', '{}'::jsonb)) x
), seat as (
  select g.id, g.game, g.st, p.wallet, (g.v->'deposits'->>(p.i - 1)::int)::bigint as deposit,
         (g.v->'result'->>(p.i - 1)::int)::bigint as result
  from g, jsonb_array_elements_text(g.v->'wallets') with ordinality p(wallet, i)
), arch as (
  select a.key as wallet, (a.value->>'games')::bigint as games, (a.value->>'net')::bigint as net
  from w, jsonb_each(coalesce(w.l->'archive'->'accounts', '{}'::jsonb)) a
), e as (
  select x->>'type' as type, x->>'wallet' as wallet, (x->>'amount')::bigint as amount,
         coalesce(x->>'reason', '') as reason,
         to_timestamp((x->>'at')::double precision / 1000) as at
  from w, jsonb_array_elements(coalesce(w.l->'entries', '[]'::jsonb)) x
), per_account as (
  select acc.wallet, m.username, m.actor, acc.balance,
    coalesce((select sum(deposit) from seat where seat.wallet = acc.wallet and st = 'reserved'), 0) as reserved,
    coalesce((select sum(result) from seat where seat.wallet = acc.wallet and st = 'settled'), 0)
      + coalesce((select sum(net) from arch where arch.wallet = acc.wallet), 0) as gambling_net,
    coalesce((select jsonb_object_agg(game, net) from (
      select game, sum(result) as net from seat where seat.wallet = acc.wallet and st = 'settled' group by game) t), '{}'::jsonb) as gambling_by_game,
    coalesce((select sum(amount) from e where e.wallet = acc.wallet and type = 'grant' and reason like 'sell-%'), 0) as farm_earned,
    coalesce((select sum(amount) from e where e.wallet = acc.wallet and type = 'grant' and reason like 'daily%'), 0) as daily_granted,
    coalesce((select sum(amount) from e where e.wallet = acc.wallet and type = 'spend' and reason like 'buy-%'), 0) as shop_spent
  from acc left join hohyeon.members m on 'wallet-' || m.user_id::text = acc.wallet
), totals as (
  select
    (select count(*) from acc) as accounts,
    (select coalesce(sum(balance), 0) from acc) as balances,
    (select coalesce(sum(deposit), 0) from seat where st = 'reserved') as reserved,
    coalesce((select (l->>'houseBalance')::bigint from w), 0) as house,
    coalesce((select (l->>'granted')::bigint from w), 0) as granted,
    coalesce((select (l->>'spent')::bigint from w), 0) as spent
)
select jsonb_build_object(
  'revision', (select revision from w),
  'updated_at', (select updated_at from w),
  'ledger_revision', (select l->'revision' from w),
  'totals', (select jsonb_build_object(
      'accounts', accounts, 'balances', balances, 'reserved', reserved,
      'player_money', balances + reserved, 'house_balance', house,
      'granted', granted, 'spent', spent, 'initial', accounts * 100000,
      'supply', balances + reserved + house,
      'invariant_ok', balances + reserved + house = accounts * 100000 + granted) from totals),
  'accounts', coalesce((select jsonb_agg(to_jsonb(p) order by p.balance + p.reserved desc) from per_account p), '[]'::jsonb),
  'games', coalesce((select jsonb_agg(to_jsonb(t) order by t.game) from (
      select game,
        count(*) filter (where st = 'reserved') as reserved,
        count(*) filter (where st = 'settled') as settled,
        count(*) filter (where st = 'void') as void,
        coalesce((select sum(deposit) from seat s where s.game = g.game and s.st = 'settled'), 0) as staked,
        coalesce((select sum(result) filter (where result > 0) from seat s where s.game = g.game and s.st = 'settled'), 0) as moved,
        case when game = 'blackjack' then -coalesce((select sum(result) from seat s where s.game = 'blackjack' and s.st = 'settled'), 0) else 0 end as house_net
      from g group by game) t), '[]'::jsonb),
  'archive', (select jsonb_build_object('games', coalesce((l->'archive'->>'games')::bigint, 0),
      'house_net', coalesce((l->'archive'->>'houseNet')::bigint, 0)) from w),
  'entries', jsonb_build_object(
      'retained', (select count(*) from e),
      'oldest', (select min(at) from e),
      'newest', (select max(at) from e)),
  'daily', coalesce((select jsonb_agg(to_jsonb(d) order by d.day desc) from (
      select (at at time zone 'Asia/Seoul')::date as day,
        coalesce(sum(amount) filter (where type = 'grant' and reason = 'daily'), 0) as daily,
        coalesce(sum(amount) filter (where type = 'grant' and reason = 'daily-relief'), 0) as relief,
        coalesce(sum(amount) filter (where type = 'grant' and reason like 'sell-%'), 0) as farm,
        coalesce(sum(amount) filter (where type = 'spend' and reason like 'buy-%'), 0) as shop,
        coalesce(sum(amount) filter (where type = 'grant'), 0) as granted,
        coalesce(sum(amount) filter (where type = 'spend'), 0) as spent
      from e group by 1) d), '[]'::jsonb),
  'recent', jsonb_build_object(
      'days', greatest(1, coalesce(p_days, 7)),
      'sources', coalesce((select jsonb_agg(to_jsonb(r) order by r.amount desc) from (
          select reason, count(*) as count, sum(amount) as amount from e
          where type = 'grant' and at >= now() - make_interval(days => greatest(1, coalesce(p_days, 7)))
          group by reason) r), '[]'::jsonb),
      'sinks', coalesce((select jsonb_agg(to_jsonb(r) order by r.amount desc) from (
          select reason, count(*) as count, sum(amount) as amount from e
          where type = 'spend' and at >= now() - make_interval(days => greatest(1, coalesce(p_days, 7)))
          group by reason) r), '[]'::jsonb))
)
$$;

-- 6. Grants: service_role only (never anon/authenticated; no Edge route uses
--    these yet). The SQL editor / Management API run as postgres and can call
--    them too.
revoke all on function public.hh_world_snapshot_prune() from public, anon, authenticated;
revoke all on function public.hh_world_snapshot(text) from public, anon, authenticated;
revoke all on function public.hh_world_restore_preview(bigint) from public, anon, authenticated;
revoke all on function public.hh_economy_report(integer) from public, anon, authenticated;
grant execute on function public.hh_world_snapshot_prune(), public.hh_world_snapshot(text),
  public.hh_world_restore_preview(bigint), public.hh_economy_report(integer) to service_role;

-- 7. Daily snapshot at 04:00 KST (19:00 UTC) when pg_cron is installed.
--    Without pg_cron this only raises a notice; enable the extension
--    (Dashboard → Database → Extensions → pg_cron) and run this block again,
--    or take snapshots by hand: select public.hh_world_snapshot('manual');
do $$
begin
  if to_regnamespace('cron') is null then
    raise notice 'pg_cron is not installed; schedule hh_world_snapshot manually (see ACCOUNTS.md)';
    return;
  end if;
  execute $q$select cron.unschedule(jobid) from cron.job where jobname = 'hh-world-snapshot-daily'$q$;
  execute $q$select cron.schedule('hh-world-snapshot-daily', '0 19 * * *', $c$select public.hh_world_snapshot('daily')$c$)$q$;
end $$;

-- First snapshot right away, so a backup exists from the moment this applies.
select public.hh_world_snapshot('migration-20260925090000');
