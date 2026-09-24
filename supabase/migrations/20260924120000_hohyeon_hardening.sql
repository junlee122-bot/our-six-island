-- HoHyeon security & robustness hardening (audit C1/C2/M5/M6/M9/M10/L2-L8).
-- Additive and backward compatible: existing members, sessions, saves and the
-- world row are kept. Apply BEFORE deploying the matching Edge functions
-- (migrations -> functions -> pages); the old functions keep working on it.

-- 1. Activation code expiry. NULL = no expiry (codes issued before this
--    migration); supabase/admin/rotate-activation-code.* always sets it.
alter table hohyeon.members add column if not exists activation_expires_at timestamptz;

-- 2. App session inactivity expiry (30 days) + last_seen.
alter table hohyeon.sessions add column if not exists last_seen timestamptz not null default now();
create index if not exists sessions_last_seen_idx on hohyeon.sessions(last_seen);

-- Old functions pass p_session here; enforce the idle window for them too.
create or replace function public.hh_member(p_username text default null, p_uid uuid default null, p_session uuid default null)
returns jsonb language sql security invoker set search_path='' as $$
 select to_jsonb(m) from hohyeon.members m
 where (p_username is null or m.username=p_username)
 and (p_uid is null or m.user_id=p_uid)
 and (p_username is not null or p_uid is not null)
 and (p_session is null or (m.activated and exists(
   select 1 from hohyeon.sessions s
   where s.id=p_session and s.user_id=m.user_id and s.last_seen > now() - interval '30 days')))
$$;

-- Session check used by _shared/server.ts member(): rejects expired sessions
-- (and deletes them), touches last_seen at most every 5 minutes.
create or replace function public.hh_session_member(p_uid uuid, p_session uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s hohyeon.sessions; m hohyeon.members;
begin
 if p_uid is null or p_session is null then return null; end if;
 select * into s from hohyeon.sessions where id=p_session and user_id=p_uid;
 if not found then return null; end if;
 if s.last_seen <= now() - interval '30 days' then
   delete from hohyeon.sessions where id=p_session;
   return null;
 end if;
 select * into m from hohyeon.members where user_id=p_uid and activated;
 if not found then return null; end if;
 if s.last_seen < now() - interval '5 minutes' then
   update hohyeon.sessions set last_seen=now() where id=p_session;
 end if;
 return to_jsonb(m);
end $$;

-- Same contract as before; the unused 'bind' branch is removed (L7) and each
-- new session prunes expired sessions and keeps at most 20 per account.
create or replace function public.hh_member_write(p_username text, p_uid uuid, p_mode text, p_data jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare m hohyeon.members; sid uuid;
begin
 select * into m from hohyeon.members where username=p_username for update;
 if not found then raise exception 'Unknown member'; end if;
 if m.user_id is distinct from p_uid then raise exception 'Account mismatch';
 elsif p_mode in ('activate','password','session') then
   if p_mode='session' and not m.activated then raise exception 'Activation required'; end if;
   sid=(p_data->>'session_id')::uuid;
   if sid is null then raise exception 'Session required'; end if;
   if p_mode in ('activate','password') then
     delete from hohyeon.sessions where user_id=p_uid;
     update hohyeon.members set activated=true,activation_hash=null,activation_expires_at=null,
       recovery_hash=coalesce(p_data->>'recovery_hash',recovery_hash),updated_at=now() where username=p_username;
   end if;
   insert into hohyeon.sessions(id,user_id) values(sid,p_uid)
     on conflict(id) do update set last_seen=now() where hohyeon.sessions.user_id=p_uid;
   delete from hohyeon.sessions where user_id=p_uid and (last_seen <= now() - interval '30 days'
     or id not in (select id from hohyeon.sessions where user_id=p_uid order by last_seen desc, created_at desc limit 20));
 elsif p_mode='logout' then
   -- No session_id = revoke every app session of the account (logoutAll, credential rotation).
   delete from hohyeon.sessions where user_id=p_uid and (p_data->>'session_id' is null or id=(p_data->>'session_id')::uuid);
 else raise exception 'Unsupported account operation'; end if;
 return (select to_jsonb(v) from hohyeon.members v where username=p_username);
end $$;

-- 3. Failure-only auth lockout keyed by (account, IP hash). Mirrors
--    authLockoutSeconds() in app/lounge-accounts.ts: the first p_free failures
--    are free, then the lock is p_base * 2^(n - p_free - 1) seconds, capped.
--    A failure streak older than 24h starts over; success deletes the row.
create table if not exists hohyeon.auth_failures (
  key text primary key,
  failures integer not null,
  locked_until timestamptz,
  last_failure timestamptz not null default now()
);
create index if not exists auth_failures_last_idx on hohyeon.auth_failures(last_failure);
alter table hohyeon.auth_failures enable row level security;

create or replace function public.hh_auth_locked(p_key text)
returns integer language sql security invoker set search_path='' as $$
 select coalesce((select greatest(0, ceil(extract(epoch from (f.locked_until - now()))))::integer
   from hohyeon.auth_failures f where f.key=p_key and f.locked_until > now()), 0)
$$;

create or replace function public.hh_auth_fail(p_key text, p_free integer, p_base integer, p_cap integer)
returns integer language plpgsql security invoker set search_path='' as $$
declare n integer; lock_s integer;
begin
 if length(p_key)>160 or p_free<0 or p_base<1 or p_cap<p_base or p_cap>86400 then raise exception 'Invalid limit'; end if;
 delete from hohyeon.auth_failures where last_failure < now() - interval '24 hours';
 insert into hohyeon.auth_failures(key,failures,last_failure) values(p_key,1,now())
 on conflict(key) do update set failures=hohyeon.auth_failures.failures+1,last_failure=now()
 returning failures into n;
 lock_s = case when n<=p_free then 0 else least(p_cap::numeric, p_base * power(2::numeric, least(30, n-p_free-1)))::integer end;
 if lock_s>0 then update hohyeon.auth_failures set locked_until=now()+make_interval(secs=>lock_s) where key=p_key; end if;
 return lock_s;
end $$;

create or replace function public.hh_auth_reset(p_key text)
returns void language sql security invoker set search_path='' as $$
 delete from hohyeon.auth_failures where key=p_key
$$;

-- 4. Auth audit log: every login/activate/recover/password/logout(All) attempt.
--    ip_hash is a salted SHA-256 prefix (HH_IP_SALT), never the raw address.
create table if not exists hohyeon.auth_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  username text,
  op text not null,
  ok boolean not null,
  ip_hash text,
  ua text,
  detail text
);
create index if not exists auth_events_at_idx on hohyeon.auth_events(at);
create index if not exists auth_events_user_idx on hohyeon.auth_events(username, at desc);
alter table hohyeon.auth_events enable row level security;

create or replace function public.hh_auth_event(p_username text, p_op text, p_ok boolean, p_ip_hash text, p_ua text, p_detail text default null)
returns void language plpgsql security invoker set search_path='' as $$
begin
 insert into hohyeon.auth_events(username,op,ok,ip_hash,ua,detail)
 values(left(p_username,32),left(p_op,16),p_ok,left(p_ip_hash,64),left(p_ua,200),left(p_detail,120));
 if random() < 0.01 then delete from hohyeon.auth_events where at < now() - interval '180 days'; end if;
end $$;

-- 5. Profile save history (last 20 revisions per account) + a specific error
--    for the 64KB limit ('save_too_large' is mapped to a Korean 413 by server.ts).
create table if not exists hohyeon.profile_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references hohyeon.members(user_id),
  revision bigint not null,
  save jsonb not null,
  saved_at timestamptz not null default now()
);
create index if not exists profile_history_user_idx on hohyeon.profile_history(user_id, revision desc);
alter table hohyeon.profile_history enable row level security;

create or replace function public.hh_profile_save(p_uid uuid,p_expected bigint,p_save jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare m hohyeon.members;
begin
 if p_expected is null or p_expected<0 or p_save is null or jsonb_typeof(p_save)<>'object' then raise exception 'Invalid save'; end if;
 if octet_length(p_save::text)>65536 then raise exception 'save_too_large'; end if;
 select * into m from hohyeon.members where user_id=p_uid and activated for update;
 if not found then raise exception 'Account required'; end if;
 if m.save is not distinct from p_save then return jsonb_build_object('conflict',false,'save',m.save,'revision',m.save_revision,'updatedAt',m.updated_at); end if;
 if m.save_revision is distinct from p_expected then return jsonb_build_object('conflict',true,'save',m.save,'revision',m.save_revision,'updatedAt',m.updated_at); end if;
 update hohyeon.members set save=p_save,save_revision=save_revision+1,updated_at=now() where user_id=p_uid returning * into m;
 insert into hohyeon.profile_history(user_id,revision,save) values(p_uid,m.save_revision,p_save);
 delete from hohyeon.profile_history where user_id=p_uid and id not in
   (select id from hohyeon.profile_history where user_id=p_uid order by revision desc, id desc limit 20);
 return jsonb_build_object('conflict',false,'save',m.save,'revision',m.save_revision,'updatedAt',m.updated_at);
end $$;

-- 6. Admin-only activation code rotation (supabase/admin/rotate-activation-code.*).
--    Sets a new code hash + expiry, revokes app sessions and GoTrue sessions
--    (refresh tokens cascade). p_reset also returns an activated (possibly
--    hijacked) account to the "not yet activated" state. The caller must then
--    set the Auth password to the same code (admin API or SQL script).
create or replace function public.hh_admin_rotate_activation(p_username text, p_hash text, p_days integer default 7, p_reset boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare m hohyeon.members;
begin
 if p_hash !~ '^[0-9a-f]{64}$' or p_days<1 or p_days>30 then raise exception 'Invalid rotation'; end if;
 select * into m from hohyeon.members where username=p_username for update;
 if not found then raise exception 'Unknown member'; end if;
 if m.user_id is null then raise exception 'Unbound member'; end if;
 if m.activated and not p_reset then raise exception 'Account already activated; pass reset to reissue'; end if;
 update hohyeon.members set activation_hash=p_hash, activation_expires_at=now()+make_interval(days=>p_days),
   activated=case when p_reset then false else activated end,
   recovery_hash=case when p_reset then null else recovery_hash end,
   updated_at=now()
 where username=p_username;
 delete from hohyeon.sessions where user_id=m.user_id;
 begin
   delete from auth.sessions where user_id=m.user_id; -- refresh tokens cascade
 exception when insufficient_privilege then
   raise warning 'Could not revoke auth.sessions; run the SQL in supabase/admin/rotate-activation-code.sql step 3';
 end;
 insert into hohyeon.auth_events(username,op,ok,detail) values(p_username,'admin_rotate',true,
   case when p_reset then 'reset' else 'rotate' end || ',days=' || p_days);
 return m.user_id;
end $$;

-- 7. Grants: service_role only (Edge functions), as for the original schema.
grant select,insert,update,delete on hohyeon.auth_failures, hohyeon.auth_events, hohyeon.profile_history to service_role;
revoke all on hohyeon.auth_failures, hohyeon.auth_events, hohyeon.profile_history from public, anon, authenticated;
revoke all on function public.hh_session_member(uuid,uuid) from public,anon,authenticated;
revoke all on function public.hh_auth_locked(text) from public,anon,authenticated;
revoke all on function public.hh_auth_fail(text,integer,integer,integer) from public,anon,authenticated;
revoke all on function public.hh_auth_reset(text) from public,anon,authenticated;
revoke all on function public.hh_auth_event(text,text,boolean,text,text,text) from public,anon,authenticated;
revoke all on function public.hh_admin_rotate_activation(text,text,integer,boolean) from public,anon,authenticated;
revoke all on function public.hh_member(text,uuid,uuid) from public,anon,authenticated;
revoke all on function public.hh_member_write(text,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.hh_profile_save(uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.hh_session_member(uuid,uuid), public.hh_auth_locked(text),
  public.hh_auth_fail(text,integer,integer,integer), public.hh_auth_reset(text),
  public.hh_auth_event(text,text,boolean,text,text,text),
  public.hh_admin_rotate_activation(text,text,integer,boolean),
  public.hh_member(text,uuid,uuid), public.hh_member_write(text,uuid,text,jsonb),
  public.hh_profile_save(uuid,bigint,jsonb) to service_role;

-- 8. Private Realtime channel 'hh-cloud-<room code>' (M9).
--    hohyeon-api broadcasts with private:true using the service role (bypasses
--    RLS). Browsers may RECEIVE only if they hold a live game session and have
--    a lease in that room; nobody but the service role may SEND on these
--    topics. Clients must subscribe with { config: { private: true } }.
--    The membership test reads world.state.rooms[code].leases[uid] — keep it in
--    sync if the world layout changes (fallback: drop the lease clause and keep
--    only the game-session check).
create or replace function public.hh_realtime_can_receive(p_topic text)
returns boolean language sql stable security definer set search_path='' as $$
 select p_topic like 'hh-cloud-%'
 and exists(
   select 1 from hohyeon.members m
   join hohyeon.sessions s on s.user_id=m.user_id
   where m.user_id=auth.uid() and m.activated
   and s.id=nullif(auth.jwt()->>'session_id','')::uuid
   and s.last_seen > now() - interval '30 days')
 and exists(
   select 1 from hohyeon.world w
   where w.id and (w.state->'rooms'->substr(p_topic, 10)->'leases') ? auth.uid()::text)
$$;
-- anon gets execute too so the restrictive policy below never errors for other
-- apps' anon subscribers; it simply returns false without a game session.
revoke all on function public.hh_realtime_can_receive(text) from public;
grant execute on function public.hh_realtime_can_receive(text) to anon, authenticated;

do $$
begin
  if to_regclass('realtime.messages') is null then
    raise notice 'realtime.messages not found; skipping HoHyeon Realtime policies';
    return;
  end if;
  execute 'alter table realtime.messages enable row level security';
  execute 'drop policy if exists "hh cloud members receive" on realtime.messages';
  execute 'drop policy if exists "hh cloud receive guard" on realtime.messages';
  execute 'drop policy if exists "hh cloud no client send" on realtime.messages';
  -- Permissive: game members of the room may receive its broadcasts.
  execute $p$create policy "hh cloud members receive" on realtime.messages
    for select to authenticated
    using (realtime.messages.extension = 'broadcast'
      and (select public.hh_realtime_can_receive((select realtime.topic()))))$p$;
  -- Restrictive: even if another app on this project added a broad policy,
  -- hh-cloud-* topics stay limited to members...
  execute $p$create policy "hh cloud receive guard" on realtime.messages
    as restrictive for select to anon, authenticated
    using ((select realtime.topic()) not like 'hh-cloud-%'
      or (select public.hh_realtime_can_receive((select realtime.topic()))))$p$;
  -- ...and no browser may publish on them (service role bypasses RLS).
  execute $p$create policy "hh cloud no client send" on realtime.messages
    as restrictive for insert to anon, authenticated
    with check ((select realtime.topic()) not like 'hh-cloud-%')$p$;
end $$;
