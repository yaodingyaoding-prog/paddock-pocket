-- Account preferences: authenticated owners only; no service-role key required.
begin;
create table if not exists public.paddock_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  driver_ids text[] not null default '{}',
  team_ids text[] not null default '{}',
  theme text not null default 'dark',
  accent text not null default 'mint',
  time_zone text not null default 'Asia/Shanghai',
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint paddock_driver_limit check (cardinality(driver_ids) <= 3 and array_position(driver_ids, null) is null and length(array_to_string(driver_ids, ',')) <= 302),
  constraint paddock_team_limit check (cardinality(team_ids) <= 30 and array_position(team_ids, null) is null and length(array_to_string(team_ids, ',')) <= 3029),
  constraint paddock_theme check (theme in ('dark','light','navy','forest','plum','carbon','burgundy','ocean','sand','ice')),
  constraint paddock_accent check (accent in ('mint','red','orange','blue','purple','gold','cyan','lime','pink','silver','coral','violet')),
  constraint paddock_timezone check (length(time_zone) between 1 and 100)
);
alter table public.paddock_preferences enable row level security;
revoke all on public.paddock_preferences from anon, authenticated;
grant select, insert, update on public.paddock_preferences to authenticated;
create policy "paddock_preferences_read_own" on public.paddock_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "paddock_preferences_insert_own" on public.paddock_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "paddock_preferences_update_own" on public.paddock_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Initialization never overwrites an existing cloud record. Subsequent patches
-- merge only supplied columns under PostgreSQL's row lock, preserving other devices' fields.
create or replace function public.paddock_save_preferences(p_patch jsonb, p_initialize boolean default false)
returns setof public.paddock_preferences
language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  if jsonb_typeof(p_patch) is distinct from 'object' or octet_length(p_patch::text) > 8192 then
    raise exception 'INVALID_PREFERENCES' using errcode = '22023';
  end if;
  if exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('driverIds','teamIds','theme','accent','timezone')) then
    raise exception 'INVALID_PREFERENCES' using errcode = '22023';
  end if;
  if (p_patch ? 'driverIds' and jsonb_typeof(p_patch->'driverIds') is distinct from 'array')
    or (p_patch ? 'teamIds' and jsonb_typeof(p_patch->'teamIds') is distinct from 'array') then
    raise exception 'INVALID_PREFERENCES' using errcode = '22023';
  end if;
  insert into public.paddock_preferences as target (user_id, driver_ids, team_ids, theme, accent, time_zone)
  values (owner_id,
    array(select jsonb_array_elements_text(coalesce(p_patch->'driverIds','[]'::jsonb))),
    array(select jsonb_array_elements_text(coalesce(p_patch->'teamIds','[]'::jsonb))),
    coalesce(p_patch->>'theme','dark'), coalesce(p_patch->>'accent','mint'), coalesce(p_patch->>'timezone','Asia/Shanghai'))
  on conflict (user_id) do update set
    driver_ids = case when p_patch ? 'driverIds' then excluded.driver_ids else target.driver_ids end,
    team_ids = case when p_patch ? 'teamIds' then excluded.team_ids else target.team_ids end,
    theme = case when p_patch ? 'theme' then excluded.theme else target.theme end,
    accent = case when p_patch ? 'accent' then excluded.accent else target.accent end,
    time_zone = case when p_patch ? 'timezone' then excluded.time_zone else target.time_zone end,
    revision = target.revision + 1, updated_at = clock_timestamp()
  where not p_initialize;
  return query select * from public.paddock_preferences where user_id = owner_id;
end;
$$;
revoke all on function public.paddock_save_preferences(jsonb, boolean) from public, anon;
grant execute on function public.paddock_save_preferences(jsonb, boolean) to authenticated;
commit;
