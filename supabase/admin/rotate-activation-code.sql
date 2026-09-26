-- Rotate (reissue) a HoHyeon activation code from the Supabase SQL editor.
-- Requires migration 20260924120000_hohyeon_hardening.sql.
--
-- Prefer rotate-activation-code.mjs (prints the code only in your terminal).
-- This SQL variant shows the new code in the dashboard result grid: copy it
-- straight to the friend over a 1:1 channel. NEVER paste it into an AI chat,
-- a group chat, an issue, or this repository.
--
-- Usage: set the two values in the `params` CTE, then run the whole file.
--   username : dowon | gangjae | minseo | seungjun | minjae | jaemin | hohyeon
--   reset    : false = only for accounts that were never activated
--              true  = also reset an ACTIVATED (e.g. hijacked) account:
--                      activated=false, recovery code cleared, all sessions revoked
-- The code expires after 7 days (activation_expires_at).

with params as (
  select 'USERNAME_HERE'::text as username, false as reset, 7 as days
), code as (
  select 'HH-' || encode(extensions.gen_random_bytes(24), 'hex') as value
), rotated as (
  -- 1+2. new activation hash + expiry, app sessions and auth.sessions revoked
  select public.hh_admin_rotate_activation(
    p.username,
    encode(extensions.digest(convert_to(c.value, 'UTF8'), 'sha256'), 'hex'),
    p.days,
    p.reset
  ) as uid, c.value
  from params p, code c
), pw as (
  -- 3. the Auth password becomes the same code (bcrypt, as GoTrue stores it)
  update auth.users u
     set encrypted_password = extensions.crypt(r.value, extensions.gen_salt('bf', 10)),
         updated_at = now()
    from rotated r
   where u.id = r.uid
  returning u.id
)
select r.value as new_activation_code,
       -- Guard: if the Auth password was NOT set this divides by zero, which
       -- aborts the whole statement, so the new hash (step 1+2) rolls back
       -- too. No half-rotated state where GoTrue still holds an old code.
       1 / (select count(*) from pw) = 1 as password_set,
       (select now() + make_interval(days => days) from params) as expires_about
  from rotated r;

-- If this fails with "division by zero", NOTHING was changed (the statement is
-- atomic): run the .mjs script instead (it uses the Auth admin API and rolls
-- back on failure).
--
-- Optional checks afterwards:
--   select username, activated, activation_expires_at, recovery_hash is not null as has_recovery
--     from hohyeon.members order by actor;
--   select * from hohyeon.auth_events order by at desc limit 50;
--
-- C2 audit (an activated friend whose password still looks like a code):
--   select username, at, detail from hohyeon.auth_events
--    where detail like '%code_like_password%' order by at desc;
