-- Historical museum hardening: defined_users metadata is administrator-managed.
-- Password changes use dedicated session-aware RPCs. Allowing a user to update
-- their own row would also allow direct mutation of the role column through
-- PostgREST, so direct row updates are restricted to administrator sessions.

drop policy if exists museum_defined_users_update on public.defined_users;

create policy museum_defined_users_update
on public.defined_users
for update
to public
using (museum_private.is_admin_session())
with check (museum_private.is_admin_session());
