-- Applied to the live CheckList preservation database on 2026-09-09.
-- Records successful login metadata at the database boundary using the already
-- validated museum session. This removes the preserved app's dependency on an
-- external client-IP lookup service without changing the visible login flow.

create or replace function public.museum_record_login()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, museum_private
as $$
declare
  user_key text;
  user_name text;
  headers jsonb := '{}'::jsonb;
  source_ip text;
begin
  user_key := museum_private.current_session_user_key();
  if user_key is null then
    return false;
  end if;

  select du.name into user_name
  from public.defined_users du
  where du.code = user_key;

  begin
    headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  exception when others then
    headers := '{}'::jsonb;
  end;

  source_ip := nullif(split_part(coalesce(headers ->> 'x-forwarded-for', ''), ',', 1), '');
  source_ip := coalesce(source_ip, nullif(headers ->> 'cf-connecting-ip', ''), nullif(headers ->> 'x-real-ip', ''), 'Unknown');

  insert into public.user_logs(user_code, user_name, login_timestamp, ip_address)
  values (user_key, coalesce(user_name, user_key), now(), btrim(source_ip));

  return true;
end;
$$;

revoke all on function public.museum_record_login() from public, authenticated;
grant execute on function public.museum_record_login() to anon;
