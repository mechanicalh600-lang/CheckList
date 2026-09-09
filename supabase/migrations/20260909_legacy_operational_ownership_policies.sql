-- NewRay legacy preservation: keep the original application behavior while
-- enforcing real per-user ownership for operational data.

-- Login/activity logs are append-only for operators. Admins retain oversight.
drop policy if exists museum_user_logs_select on public.user_logs;
drop policy if exists museum_user_logs_insert on public.user_logs;
drop policy if exists museum_user_logs_delete on public.user_logs;
create policy museum_user_logs_select on public.user_logs
for select to public
using (
  museum_private.is_admin_session()
  or user_code = museum_private.current_session_user_key()
);
create policy museum_user_logs_insert on public.user_logs
for insert to public
with check (
  museum_private.is_admin_session()
  or user_code = museum_private.current_session_user_key()
);
create policy museum_user_logs_delete on public.user_logs
for delete to public
using (museum_private.is_admin_session());

-- Inspections belong to the recorded inspector. Admins can inspect/manage all.
drop policy if exists museum_inspections_select on public.inspections;
drop policy if exists museum_inspections_insert on public.inspections;
drop policy if exists museum_inspections_update on public.inspections;
drop policy if exists museum_inspections_delete on public.inspections;
create policy museum_inspections_select on public.inspections
for select to public
using (
  museum_private.is_admin_session()
  or inspector_code = museum_private.current_session_user_key()
);
create policy museum_inspections_insert on public.inspections
for insert to public
with check (
  museum_private.is_admin_session()
  or inspector_code = museum_private.current_session_user_key()
);
create policy museum_inspections_update on public.inspections
for update to public
using (
  museum_private.is_admin_session()
  or inspector_code = museum_private.current_session_user_key()
)
with check (
  museum_private.is_admin_session()
  or inspector_code = museum_private.current_session_user_key()
);
create policy museum_inspections_delete on public.inspections
for delete to public
using (
  museum_private.is_admin_session()
  or inspector_code = museum_private.current_session_user_key()
);

-- Checklist results inherit ownership from their parent inspection.
drop policy if exists museum_checklist_results_select on public.checklist_results;
drop policy if exists museum_checklist_results_insert on public.checklist_results;
drop policy if exists museum_checklist_results_update on public.checklist_results;
drop policy if exists museum_checklist_results_delete on public.checklist_results;
create policy museum_checklist_results_select on public.checklist_results
for select to public
using (
  museum_private.is_admin_session()
  or exists (
    select 1
    from public.inspections i
    where i.id = checklist_results.inspection_id
      and i.inspector_code = museum_private.current_session_user_key()
  )
);
create policy museum_checklist_results_insert on public.checklist_results
for insert to public
with check (
  museum_private.is_admin_session()
  or exists (
    select 1
    from public.inspections i
    where i.id = checklist_results.inspection_id
      and i.inspector_code = museum_private.current_session_user_key()
  )
);
create policy museum_checklist_results_update on public.checklist_results
for update to public
using (
  museum_private.is_admin_session()
  or exists (
    select 1
    from public.inspections i
    where i.id = checklist_results.inspection_id
      and i.inspector_code = museum_private.current_session_user_key()
  )
)
with check (
  museum_private.is_admin_session()
  or exists (
    select 1
    from public.inspections i
    where i.id = checklist_results.inspection_id
      and i.inspector_code = museum_private.current_session_user_key()
  )
);
create policy museum_checklist_results_delete on public.checklist_results
for delete to public
using (
  museum_private.is_admin_session()
  or exists (
    select 1
    from public.inspections i
    where i.id = checklist_results.inspection_id
      and i.inspector_code = museum_private.current_session_user_key()
  )
);
