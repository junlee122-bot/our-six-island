-- Restore hohyeon.world from a snapshot (admin only, Supabase SQL editor or
-- psql as postgres). Requires migration 20260925090000_hohyeon_world_backup.sql.
--
-- The world row holds EVERYTHING shared: rooms and in-progress games, the
-- ledger (every friend's 범), farms/bags/mail/guestbook (life), request
-- receipts and connection epochs. A full restore rolls all of it back to the
-- snapshot time: every win, purchase, harvest and message after it is lost.
-- Prefer the smallest restore that fixes the problem, and tell the friends.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — find the snapshot (times shown in KST)
--
--   select id, taken_at at time zone 'Asia/Seoul' as taken_kst, revision, reason,
--          pg_size_pretty(bytes::bigint) as size
--     from hohyeon.world_snapshots order by taken_at desc limit 30;
--
--   select revision, updated_at at time zone 'Asia/Seoul' as updated_kst
--     from hohyeon.world where id;             -- the current revision
--
-- STEP 2 — review it (read-only)
--
--   select public.hh_world_restore_preview(<ID>) - 'state';   -- summary
--   select public.hh_world_restore_preview(<ID>) -> 'state' -> 'ledger' -> 'accounts';
--   -- Full economy report of the snapshot vs. now, on your own machine:
--   --   SUPABASE_ACCESS_TOKEN=… node --experimental-strip-types \
--   --     supabase/admin/economy-report.mjs --snapshot=<ID>
--   --   SUPABASE_ACCESS_TOKEN=… node --experimental-strip-types \
--   --     supabase/admin/economy-report.mjs
--
-- STEP 3 — maintenance window
--   There is no in-app maintenance switch. Tell the friends (단체방) that the
--   village is under maintenance, e.g.
--     "범타듀 밸리 점검 중이에요(약 10분). 점검이 끝나면 새로고침해 주세요.
--      <시각> 이후의 게임·농사 기록은 되돌아갑니다."
--   and check nobody is inside a room (leases seen in the last 3 minutes):
--
--   select r.key as room, x.key as uid,
--          to_timestamp((x.value->>'seen')::bigint / 1000.0) at time zone 'Asia/Seoul' as seen_kst
--     from hohyeon.world w, jsonb_each(w.state->'rooms') r, jsonb_each(r.value->'leases') x
--    where w.id and (x.value->>'seen')::bigint > extract(epoch from now()) * 1000 - 180000;
--
--   Open tabs keep polling (every ≤8 s) and pick up the restored world by
--   themselves; the epoch bump below makes stale tabs re-enter their room.
--
-- STEP 4 — restore: set the three values below and run THIS WHOLE FILE.
--   mode 'full' : whole world from the snapshot (rooms, ledger, life), keeping
--                 the current receipts and bumping every connection epoch.
--   mode 'life' : only state.life (farms, bags, unlocks, mail, guestbook,
--                 status) from the snapshot; ledger/rooms stay current. Use it
--                 for a broken life state. Note: 범 earned/spent in the farm
--                 shop after the snapshot stays in the ledger.
--   The ledger is never restored alone: reserved games in the ledger must match
--   the rooms that hold them, so money is restored only together with rooms
--   ('full').
--
-- What the block does, in one transaction:
--   a. locks the world row and refuses if its revision is not the one you
--      reviewed (someone played meanwhile → review again);
--   b. takes a 'pre-restore-<id>' snapshot of the CURRENT world (undo point);
--   c. validates the snapshot like hh_world_commit (object, schema 1, ≤6 MB)
--      and its ledger total (balances + reservations + house = wallets ×
--      100,000 + granted);
--   d. writes it with revision = current + 1 — never the snapshot's old
--      revision. Revisions must only move forward: the Edge function commits
--      with compare-and-swap on the revision and clients ignore older ones;
--   e. logs 'world_restore' to hohyeon.auth_events.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  p_snapshot bigint := 0;           -- ← snapshot id from STEP 1
  p_expected_revision bigint := -1; -- ← current hohyeon.world.revision you reviewed
  p_mode text := 'full';            -- ← 'full' | 'life'

  cur hohyeon.world;
  snap hohyeon.world_snapshots;
  next_state jsonb;
  undo jsonb;
  l jsonb;
  held bigint;
  new_revision bigint;
begin
  if p_mode not in ('full', 'life') then raise exception 'p_mode must be full or life'; end if;
  select * into cur from hohyeon.world where id for update;
  if not found then raise exception 'World row missing'; end if;
  if cur.revision is distinct from p_expected_revision then
    raise exception 'World revision is % (expected %). Someone played meanwhile: review again.',
      cur.revision, p_expected_revision;
  end if;
  select * into snap from hohyeon.world_snapshots where id = p_snapshot;
  if not found then raise exception 'Unknown snapshot %', p_snapshot; end if;

  undo := public.hh_world_snapshot('pre-restore-' || p_snapshot);

  if jsonb_typeof(snap.state) is distinct from 'object' or snap.state->>'schema' is distinct from '1'
     or octet_length(snap.state::text) > 6000000 then
    raise exception 'Snapshot % is not a valid world', p_snapshot;
  end if;

  if p_mode = 'life' then
    if jsonb_typeof(snap.state->'life') is distinct from 'object' then
      raise exception 'Snapshot % has no life state', p_snapshot;
    end if;
    next_state := jsonb_set(cur.state, '{life}', snap.state->'life');
  else
    l := snap.state->'ledger';
    select coalesce(sum((d.value #>> '{}')::bigint), 0) into held
      from jsonb_each(coalesce(l->'games', '{}'::jsonb)) g,
           jsonb_array_elements(g.value->'deposits') d
     where g.value->>'state' = 'reserved';
    if (select coalesce(sum((a.value #>> '{}')::bigint), 0) from jsonb_each(coalesce(l->'accounts', '{}'::jsonb)) a)
       + held + coalesce((l->>'houseBalance')::bigint, 0)
       <> (select count(*) from jsonb_object_keys(coalesce(l->'accounts', '{}'::jsonb))) * 100000
          + coalesce((l->>'granted')::bigint, 0) then
      raise exception 'Snapshot % ledger totals do not add up; do not restore it', p_snapshot;
    end if;
    next_state := snap.state
      -- Keep today's receipts: a retried request that already ran is answered
      -- from its receipt instead of running again on the restored world.
      || jsonb_build_object('receipts', coalesce(cur.state->'receipts', '{}'::jsonb))
      -- Bump every epoch past both versions so old tabs must re-enter.
      || jsonb_build_object('epochs', coalesce((
           select jsonb_object_agg(k, greatest(
             coalesce((cur.state->'epochs'->>k)::bigint, 0),
             coalesce((snap.state->'epochs'->>k)::bigint, 0)) + 1)
           from (select jsonb_object_keys(coalesce(cur.state->'epochs', '{}'::jsonb)) as k
                 union select jsonb_object_keys(coalesce(snap.state->'epochs', '{}'::jsonb))) keys),
           '{}'::jsonb));
  end if;

  update hohyeon.world set state = next_state, revision = revision + 1, updated_at = now()
   where id returning revision into new_revision;
  insert into hohyeon.auth_events(username, op, ok, detail)
  values ('admin', 'world_restore', true,
          left(format('snapshot=%s,mode=%s,undo=%s,rev=%s->%s', p_snapshot, p_mode, undo->>'id', cur.revision, new_revision), 120));
  raise notice 'Restored snapshot % (mode %) as revision %. Undo point: snapshot %.',
    p_snapshot, p_mode, new_revision, undo->>'id';
end $$;

-- STEP 5 — after the restore
--   select revision, updated_at from hohyeon.world where id;
--   select * from hohyeon.auth_events where op = 'world_restore' order by at desc limit 5;
--   Run economy-report.mjs (총액 검증 must say 일치), open the app, check a
--   wallet and a farm, then tell the friends the maintenance is over.
--   To undo the restore, run this file again with the 'pre-restore-…'
--   snapshot id printed above (and the new current revision).
--
-- Snapshot before any other risky admin action, too (manual SQL on the world
-- row, a migration or Edge deploy that changes the world format, bulk account
-- resets):
--   select public.hh_world_snapshot('pre-<what you are about to do>');
-- Pin a snapshot so retention never prunes it: give it a reason starting with
-- 'keep', e.g.  update hohyeon.world_snapshots set reason = 'keep:' || reason where id = <ID>;
