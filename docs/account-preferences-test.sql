-- Run after account-preferences.sql. Fixtures and changes are rolled back.
-- No passwords, emails, sessions or permanent accounts are created.
begin;
insert into auth.users (id) values
  ('c81d61aa-52f7-4d7c-a5a8-326bcb7a08a1'),
  ('c81d61aa-52f7-4d7c-a5a8-326bcb7a08a2');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c81d61aa-52f7-4d7c-a5a8-326bcb7a08a1', true);
select * from public.paddock_save_preferences('{"theme":"sand","driverIds":["driver-a"],"timezone":"Asia/Tokyo"}', true);
select * from public.paddock_save_preferences('{"theme":"dark","driverIds":[]}', true);
select * from public.paddock_save_preferences('{"accent":"coral"}', false);
do $$ begin
  if not exists (select 1 from public.paddock_preferences where theme='sand' and accent='coral' and time_zone='Asia/Tokyo' and driver_ids=array['driver-a'] and revision=2) then raise exception 'Initialization/partial patch regression'; end if;
end $$;
select set_config('request.jwt.claim.sub', 'c81d61aa-52f7-4d7c-a5a8-326bcb7a08a2', true);
do $$ begin
  if exists(select 1 from public.paddock_preferences) then raise exception 'RLS read leak'; end if;
  update public.paddock_preferences set theme='light' where user_id='c81d61aa-52f7-4d7c-a5a8-326bcb7a08a1';
  if found then raise exception 'RLS update leak'; end if;
end $$;
select * from public.paddock_save_preferences('{"theme":"ice","teamIds":["ferrari"]}', true);
do $$ begin
  if (select count(*) from public.paddock_preferences) <> 1 then raise exception 'Owner rows not isolated'; end if;
  if not exists(select 1 from public.paddock_preferences where theme='ice' and team_ids=array['ferrari']) then raise exception 'Second device/account write failed'; end if;
end $$;
reset role;
do $$ begin
  if not (select relrowsecurity from pg_class where oid='public.paddock_preferences'::regclass) then raise exception 'RLS disabled'; end if;
  if has_table_privilege('anon','public.paddock_preferences','select') then raise exception 'Anonymous table access granted'; end if;
  if has_function_privilege('anon','public.paddock_save_preferences(jsonb,boolean)','execute') then raise exception 'Anonymous RPC access granted'; end if;
  if (select prosecdef from pg_proc where oid='public.paddock_save_preferences(jsonb,boolean)'::regprocedure) then raise exception 'Unexpected elevated function'; end if;
end $$;
rollback;
select 'PASS: owner RLS, anonymous denial, isolated accounts, atomic partial saves and migration no-overwrite; fixtures rolled back' as result;
