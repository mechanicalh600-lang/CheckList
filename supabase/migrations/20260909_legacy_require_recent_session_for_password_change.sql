-- Applied to the live CheckList preservation database on 2026-09-09.
-- First pass: require a freshly authenticated session before changing password.
-- A follow-up migration immediately corrects the session-revocation variable
-- scoping in this definition; preserve both files to match live migration history.

create or replace function public.museum_change_password(p_new_password text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, museum_private, extensions
as $$
declare
  user_key text;
  token_hash text;
  recently_authenticated boolean := false;
begin
  user_key := museum_private.current_session_user_key();
  if user_key is null then return false; end if;
  if p_new_password is null or length(p_new_password) < 4 then return false; end if;

  token_hash := museum_private.request_token_hash();
  select exists(
    select 1
    from museum_private.sessions s
    where s.token_hash = token_hash
      and s.user_key = user_key
      and s.revoked_at is null
      and s.expires_at > now()
      and s.created_at >= now() - interval '10 minutes'
  ) into recently_authenticated;

  if not recently_authenticated then return false; end if;

  update museum_private.credentials
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf',11)), updated_at = now()
  where museum_private.credentials.user_key = user_key;

  update public.defined_users set force_change_password = false where code = user_key;

  update museum_private.sessions
  set revoked_at = now()
  where user_key = user_key
    and token_hash <> museum_private.request_token_hash()
    and revoked_at is null;

  return true;
end;
$$;

revoke all on function public.museum_change_password(text) from public, authenticated;
grant execute on function public.museum_change_password(text) to anon;
