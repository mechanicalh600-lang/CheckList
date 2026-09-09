-- Applied immediately after the recent-auth password-change migration.
-- Corrects PL/pgSQL variable scoping so only other sessions belonging to the
-- same account are revoked after a password change.

create or replace function public.museum_change_password(p_new_password text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, museum_private, extensions
as $$
declare
  v_user_key text;
  v_token_hash text;
  v_recently_authenticated boolean := false;
begin
  v_user_key := museum_private.current_session_user_key();
  if v_user_key is null then return false; end if;
  if p_new_password is null or length(p_new_password) < 4 then return false; end if;

  v_token_hash := museum_private.request_token_hash();
  select exists(
    select 1
    from museum_private.sessions s
    where s.token_hash = v_token_hash
      and s.user_key = v_user_key
      and s.revoked_at is null
      and s.expires_at > now()
      and s.created_at >= now() - interval '10 minutes'
  ) into v_recently_authenticated;

  if not v_recently_authenticated then return false; end if;

  update museum_private.credentials c
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf',11)), updated_at = now()
  where c.user_key = v_user_key;

  update public.defined_users du
  set force_change_password = false
  where du.code = v_user_key;

  update museum_private.sessions s
  set revoked_at = now()
  where s.user_key = v_user_key
    and s.token_hash <> v_token_hash
    and s.revoked_at is null;

  return true;
end;
$$;

revoke all on function public.museum_change_password(text) from public, authenticated;
grant execute on function public.museum_change_password(text) to anon;
