-- Append actor 7 without renumbering actors 0..6 or changing their saves.
-- Auth user creation is a separate administrator operation through Auth Admin.
begin;

do $$
begin
  if exists (select 1 from hohyeon.members where username='yuchan' and actor<>7)
     or exists (select 1 from hohyeon.members where actor=7 and username<>'yuchan') then
    raise exception 'Yuchan roster slot conflicts with an existing member';
  end if;
end $$;

alter table hohyeon.members drop constraint members_username_check;
alter table hohyeon.members add constraint members_username_check
  check (username in ('dowon','gangjae','minseo','seungjun','minjae','jaemin','hohyeon','yuchan'));
alter table hohyeon.members drop constraint members_actor_check;
alter table hohyeon.members add constraint members_actor_check check (actor between 0 and 7);
insert into hohyeon.members(username,actor) values ('yuchan',7)
  on conflict (username) do nothing;

-- A narrow, service-role-only replacement for the removed bootstrap path.
-- The trusted Auth Admin caller verifies the Auth user's returned email.
-- This RPC checks that email against the locked roster row; the existing
-- user_id FK checks that the uid exists. It never reads auth.users or changes
-- any existing bound/activated member, password, session, wallet or world row.
create function public.hh_provision_member(
  p_username text,
  p_uid uuid,
  p_auth_email text,
  p_activation_hash text
)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare m hohyeon.members; expires timestamptz;
begin
  if p_username is distinct from 'yuchan' or p_uid is null
     or p_activation_hash is null or p_activation_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid member provisioning';
  end if;
  select * into m from hohyeon.members where username=p_username for update;
  if not found or m.actor<>7 then raise exception 'Unknown member roster slot'; end if;
  if m.user_id is not null or m.activated then
    raise exception 'Member is already bound or activated';
  end if;
  if p_auth_email is distinct from m.auth_email then
    raise exception 'Auth email does not match the roster slot';
  end if;
  expires=now()+interval '7 days';
  update hohyeon.members
    set user_id=p_uid,activation_hash=p_activation_hash,activation_expires_at=expires,updated_at=now()
    where username=p_username;
  insert into hohyeon.auth_events(username,op,ok,detail)
    values(p_username,'admin_provision',true,'new roster member,days=7');
  return jsonb_build_object('username',p_username,'actor',m.actor,'activated',false,'expiresAt',expires);
end $$;
revoke all on function public.hh_provision_member(text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.hh_provision_member(text,uuid,text,text) to service_role;

commit;
