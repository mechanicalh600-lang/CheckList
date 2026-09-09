-- Private, append-only audit history for the operational legacy application.
create table if not exists museum_private.change_audit (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_key text,
  operation text not null check (operation in ('INSERT','UPDATE','DELETE')),
  actor_user_key text,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

create index if not exists idx_legacy_change_audit_table_record_time
  on museum_private.change_audit (table_name, record_key, changed_at desc);
create index if not exists idx_legacy_change_audit_actor_time
  on museum_private.change_audit (actor_user_key, changed_at desc);

revoke all on museum_private.change_audit from public, anon, authenticated;
revoke all on sequence museum_private.change_audit_id_seq from public, anon, authenticated;

create or replace function museum_private.audit_public_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, museum_private
as $$
declare
  old_json jsonb;
  new_json jsonb;
  key_json jsonb;
  actor text;
  record_key text;
begin
  old_json := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  new_json := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;
  key_json := coalesce(new_json, old_json, '{}'::jsonb);

  record_key := coalesce(
    key_json ->> 'id',
    key_json ->> 'code',
    key_json ->> 'tracking_code',
    key_json ->> 'asset_number'
  );

  actor := coalesce(museum_private.current_session_user_key(), current_user, 'database/system');

  insert into museum_private.change_audit(
    table_name, record_key, operation, actor_user_key, old_data, new_data
  ) values (
    tg_table_name, record_key, tg_op, actor, old_json, new_json
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function museum_private.audit_public_change() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'app_settings',
    'asset_schedules',
    'checklist_results',
    'defined_assets',
    'defined_checklist_items',
    'defined_users',
    'inspections',
    'job_cards'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', 'trg_legacy_audit_' || t, t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function museum_private.audit_public_change()',
      'trg_legacy_audit_' || t,
      t
    );
  end loop;
end
$$;
