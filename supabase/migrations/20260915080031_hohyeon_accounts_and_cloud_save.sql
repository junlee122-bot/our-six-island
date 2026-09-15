-- Dedicated, unexposed storage for HoHyeon. Existing voting tables and Auth
-- settings are unchanged. Only the Edge service role can execute these RPCs.
create schema if not exists hohyeon;
revoke all on schema hohyeon from public, anon, authenticated;
grant usage on schema hohyeon to service_role;

create table hohyeon.members (
  username text primary key check (username in ('dowon','gangjae','minseo','seungjun','minjae','jaemin','hohyeon')),
  actor smallint not null unique check(actor between 0 and 6),
  user_id uuid unique references auth.users(id),
  auth_email text not null unique default ('hh-' || gen_random_uuid()::text || '@accounts.hohyeon.invalid'),
  activated boolean not null default false,
  activation_hash text,
  recovery_hash text,
  operation_id uuid,
  operation_until timestamptz,
  save jsonb,
  save_revision bigint not null default 0 check(save_revision >= 0),
  updated_at timestamptz not null default now()
);
insert into hohyeon.members(username,actor) values
 ('dowon',0),('gangjae',1),('minseo',2),('seungjun',3),('minjae',4),('jaemin',5),('hohyeon',6);
create table hohyeon.sessions (
  id uuid primary key,
  user_id uuid not null references hohyeon.members(user_id),
  created_at timestamptz not null default now()
);
create index on hohyeon.sessions(user_id);
create table hohyeon.world (
  id boolean primary key default true check(id),
  revision bigint not null default 0 check(revision >= 0),
  state jsonb not null,
  updated_at timestamptz not null default now()
);
insert into hohyeon.world(id,state) values(true,'{"schema":1,"ledger":{"version":1,"revision":0,"accounts":{},"games":{},"houseBalance":0},"rooms":{},"receipts":{}}');
create table hohyeon.rate_limits (key text primary key, count integer not null, until timestamptz not null);
create index on hohyeon.rate_limits(until);
create table hohyeon.secrets (name text primary key, hash text not null);
alter table hohyeon.members enable row level security;
alter table hohyeon.sessions enable row level security;
alter table hohyeon.world enable row level security;
alter table hohyeon.rate_limits enable row level security;
alter table hohyeon.secrets enable row level security;
revoke all on all tables in schema hohyeon from public, anon, authenticated;
grant select,insert,update,delete on all tables in schema hohyeon to service_role;

create function public.hh_member(p_username text default null, p_uid uuid default null, p_session uuid default null)
returns jsonb language sql security invoker set search_path='' as $$
 select to_jsonb(m) from hohyeon.members m
 where (p_username is null or m.username=p_username)
 and (p_uid is null or m.user_id=p_uid)
 and (p_username is not null or p_uid is not null)
 and (p_session is null or (m.activated and exists(select 1 from hohyeon.sessions s where s.id=p_session and s.user_id=m.user_id)))
$$;

create function public.hh_member_write(p_username text, p_uid uuid, p_mode text, p_data jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare m hohyeon.members; sid uuid;
begin
 select * into m from hohyeon.members where username=p_username for update;
 if not found then raise exception 'Unknown member'; end if;
 if p_mode='bind' then
   if m.user_id is not null and m.user_id<>p_uid then raise exception 'Account already bound'; end if;
   if m.activated then raise exception 'Account already activated'; end if;
   update hohyeon.members set user_id=p_uid,activation_hash=p_data->>'activation_hash' where username=p_username;
 elsif m.user_id is distinct from p_uid then raise exception 'Account mismatch';
 elsif p_mode in ('activate','password','session') then
   if p_mode='session' and not m.activated then raise exception 'Activation required'; end if;
   sid=(p_data->>'session_id')::uuid;
   if sid is null then raise exception 'Session required'; end if;
   if p_mode in ('activate','password') then
     delete from hohyeon.sessions where user_id=p_uid;
     update hohyeon.members set activated=true,activation_hash=null,
       recovery_hash=coalesce(p_data->>'recovery_hash',recovery_hash),updated_at=now() where username=p_username;
   end if;
   insert into hohyeon.sessions(id,user_id) values(sid,p_uid) on conflict(id) do nothing;
 elsif p_mode='logout' then
   delete from hohyeon.sessions where user_id=p_uid and (p_data->>'session_id' is null or id=(p_data->>'session_id')::uuid);
 else raise exception 'Unsupported account operation'; end if;
 return (select to_jsonb(v) from hohyeon.members v where username=p_username);
end $$;

create function public.hh_profile_save(p_uid uuid,p_expected bigint,p_save jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare m hohyeon.members;
begin
 if p_expected is null or p_expected<0 or p_save is null or octet_length(p_save::text)>65536 or jsonb_typeof(p_save)<>'object' then raise exception 'Invalid save'; end if;
 select * into m from hohyeon.members where user_id=p_uid and activated for update;
 if not found then raise exception 'Account required'; end if;
 if m.save is not distinct from p_save then return jsonb_build_object('conflict',false,'save',m.save,'revision',m.save_revision,'updatedAt',m.updated_at); end if;
 if m.save_revision is distinct from p_expected then return jsonb_build_object('conflict',true,'save',m.save,'revision',m.save_revision,'updatedAt',m.updated_at); end if;
 update hohyeon.members set save=p_save,save_revision=save_revision+1,updated_at=now() where user_id=p_uid returning * into m;
 return jsonb_build_object('conflict',false,'save',m.save,'revision',m.save_revision,'updatedAt',m.updated_at);
end $$;

create function public.hh_world_read()
returns jsonb language sql security invoker set search_path='' as $$
 select jsonb_build_object('revision',revision,'state',state,'now',floor(extract(epoch from clock_timestamp())*1000)) from hohyeon.world where id
$$;
create function public.hh_world_commit(p_expected bigint,p_state jsonb)
returns bigint language plpgsql security invoker set search_path='' as $$
declare v bigint;
begin
 if p_state is null or octet_length(p_state::text)>6000000 or jsonb_typeof(p_state)<>'object' or p_state->>'schema' is distinct from '1' then raise exception 'Invalid world'; end if;
 update hohyeon.world set state=p_state,revision=revision+1,updated_at=now() where id and revision=p_expected returning revision into v;
 return v;
end $$;

create function public.hh_rate(p_key text,p_limit integer,p_seconds integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 if length(p_key)>160 or p_limit<1 or p_limit>10000 or p_seconds<1 or p_seconds>86400 then raise exception 'Invalid limit'; end if;
 delete from hohyeon.rate_limits where until<now();
 insert into hohyeon.rate_limits(key,count,until) values(p_key,1,now()+make_interval(secs=>p_seconds))
 on conflict(key) do update set count=hohyeon.rate_limits.count+1 returning count into n;
 return n<=p_limit;
end $$;
create function public.hh_setup(p_hash text)
returns jsonb language sql security invoker set search_path='' as $$
 select case when exists(select 1 from hohyeon.secrets where name='setup' and hash=p_hash)
 then (select jsonb_agg(to_jsonb(m) order by actor) from hohyeon.members m) else null end
$$;
create function public.hh_account_lock(p_uid uuid,p_token uuid,p_release boolean default false)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v uuid;
begin
 if p_release then
   update hohyeon.members set operation_id=null,operation_until=null where user_id=p_uid and operation_id=p_token returning user_id into v;
 else
   update hohyeon.members set operation_id=p_token,operation_until=now()+interval '60 seconds'
   where user_id=p_uid and (operation_id is null or operation_until<now()) returning user_id into v;
 end if;
 return v is not null;
end $$;

revoke all on function public.hh_member(text,uuid,uuid) from public,anon,authenticated;
revoke all on function public.hh_member_write(text,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.hh_profile_save(uuid,bigint,jsonb) from public,anon,authenticated;
revoke all on function public.hh_world_read() from public,anon,authenticated;
revoke all on function public.hh_world_commit(bigint,jsonb) from public,anon,authenticated;
revoke all on function public.hh_rate(text,integer,integer) from public,anon,authenticated;
revoke all on function public.hh_setup(text) from public,anon,authenticated;
revoke all on function public.hh_account_lock(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.hh_account_lock(uuid,uuid,boolean) to service_role;
grant execute on function public.hh_member(text,uuid,uuid),public.hh_member_write(text,uuid,text,jsonb),public.hh_profile_save(uuid,bigint,jsonb),public.hh_world_read(),public.hh_world_commit(bigint,jsonb),public.hh_rate(text,integer,integer),public.hh_setup(text) to service_role;
