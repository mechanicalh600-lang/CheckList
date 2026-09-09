-- Applied to the live CheckList preservation database on 2026-09-09.
-- The only preserved app_settings keys are non-sensitive presentation/session
-- defaults required before login: org_title and auto_logout_minutes.
-- Mutations remain admin-only.

drop policy if exists museum_app_settings_select on public.app_settings;
create policy museum_app_settings_select
on public.app_settings
for select
to anon
using (key in ('org_title','auto_logout_minutes'));
