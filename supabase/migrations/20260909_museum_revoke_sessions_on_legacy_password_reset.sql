-- Preserve the historical password-write path while enforcing session safety.
-- Any non-empty legacy password is hashed into the private credential store,
-- removed from the public table, and existing sessions are revoked on reset.

create or replace function museum_private.capture_legacy_defined_user_password()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'museum_private', 'extensions'
as $function$
begin
  if new.password is not null and btrim(new.password) <> '' then
    insert into museum_private.credentials(user_key, password_hash, updated_at)
    values (new.code, extensions.crypt(new.password, extensions.gen_salt('bf',11)), now())
    on conflict(user_key) do update
      set password_hash=excluded.password_hash, updated_at=excluded.updated_at;

    if tg_op = 'UPDATE' then
      update museum_private.sessions
         set revoked_at = now()
       where user_key = new.code
         and revoked_at is null;
    end if;

    new.password := null;
  end if;
  return new;
end;
$function$;
