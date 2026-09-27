-- Reporting only: include bank deposits in player holdings and expose the
-- finance portion already included in houseBalance. No world/member writes.
-- Missing optional ledger fields mean zero for older worlds and snapshots.
create or replace function public.hh_economy_report(p_days integer default 7)
returns jsonb language sql stable security definer set search_path='' as $$
with w as (
  select revision, updated_at, coalesce(state->'ledger', '{}'::jsonb) as l from hohyeon.world where id
), acc as (
  select a.key as wallet, (a.value #>> '{}')::bigint as balance
  from w, jsonb_each(coalesce(w.l->'accounts', '{}'::jsonb)) a
), vault as (
  select a.key as wallet, (a.value #>> '{}')::bigint as stored
  from w, jsonb_each(coalesce(w.l->'vault', '{}'::jsonb)) a
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
    coalesce((select stored from vault where vault.wallet = acc.wallet), 0) as stored,
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
    (select coalesce(sum(stored), 0) from vault) as stored,
    coalesce((select (l->>'houseBalance')::bigint from w), 0) as house,
    coalesce((select (l->>'financeHouseNet')::bigint from w), 0) as finance_house_net,
    coalesce((select (l->>'granted')::bigint from w), 0) as granted,
    coalesce((select (l->>'spent')::bigint from w), 0) as spent
)
select jsonb_build_object(
  'revision', (select revision from w),
  'updated_at', (select updated_at from w),
  'ledger_revision', (select l->'revision' from w),
  'totals', (select jsonb_build_object(
      'accounts', accounts, 'balances', balances, 'reserved', reserved, 'stored', stored,
      'player_money', balances + reserved + stored, 'house_balance', house,
      'finance_house_net', finance_house_net,
      'granted', granted, 'spent', spent, 'initial', accounts * 100000,
      'supply', balances + reserved + stored + house,
      'invariant_ok', balances + reserved + stored + house = accounts * 100000 + granted) from totals),
  'accounts', coalesce((select jsonb_agg(to_jsonb(p) order by p.balance + p.reserved + p.stored desc) from per_account p), '[]'::jsonb),
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

-- Preserve the existing admin-only boundary for this SECURITY DEFINER report.
revoke all on function public.hh_economy_report(integer) from public, anon, authenticated;
grant execute on function public.hh_economy_report(integer) to service_role;
