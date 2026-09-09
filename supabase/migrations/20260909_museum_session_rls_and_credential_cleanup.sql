-- Applied to the live CheckList museum Supabase project on 2026-09-09.
-- Historical UI/UX is preserved; this migration only hardens credentials,
-- row-level access and storage writes behind the museum session.

create or replace function museum_private.is_admin_session()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, museum_private
as $$
  select lower(coalesce(museum_private.current_session_role(), '')) in ('admin','super_admin')
$$;

revoke all on function museum_private.is_admin_session() from public;
grant execute on function museum_private.is_admin_session() to anon, authenticated;

-- Legacy allow-all policies were removed before installing the policies below.

create policy museum_app_settings_select on public.app_settings for select to public
  using (museum_private.has_valid_session());
create policy museum_asset_schedules_select on public.asset_schedules for select to public
  using (museum_private.has_valid_session());
create policy museum_checklist_results_select on public.checklist_results for select to public
  using (museum_private.has_valid_session());
create policy museum_defined_assets_select on public.defined_assets for select to public
  using (museum_private.has_valid_session());
create policy museum_defined_checklist_items_select on public.defined_checklist_items for select to public
  using (museum_private.has_valid_session());
create policy museum_defined_users_select on public.defined_users for select to public
  using (museum_private.has_valid_session());
create policy museum_inspections_select on public.inspections for select to public
  using (museum_private.has_valid_session());
create policy museum_job_cards_select on public.job_cards for select to public
  using (museum_private.has_valid_session());
create policy museum_user_logs_select on public.user_logs for select to public
  using (museum_private.has_valid_session());

create policy museum_checklist_results_insert on public.checklist_results for insert to public
  with check (museum_private.has_valid_session());
create policy museum_inspections_insert on public.inspections for insert to public
  with check (museum_private.has_valid_session());
create policy museum_inspections_update on public.inspections for update to public
  using (museum_private.has_valid_session()) with check (museum_private.has_valid_session());
create policy museum_inspections_delete on public.inspections for delete to public
  using (museum_private.has_valid_session());
create policy museum_user_logs_insert on public.user_logs for insert to public
  with check (museum_private.has_valid_session());
create policy museum_user_logs_delete on public.user_logs for delete to public
  using (museum_private.has_valid_session());

create policy museum_app_settings_insert on public.app_settings for insert to public
  with check (museum_private.is_admin_session());
create policy museum_app_settings_update on public.app_settings for update to public
  using (museum_private.is_admin_session()) with check (museum_private.is_admin_session());

create policy museum_defined_users_insert on public.defined_users for insert to public
  with check (museum_private.is_admin_session());
create policy museum_defined_users_update on public.defined_users for update to public
  using (museum_private.is_admin_session() or code = museum_private.current_session_user_key())
  with check (museum_private.is_admin_session() or code = museum_private.current_session_user_key());
create policy museum_defined_users_delete on public.defined_users for delete to public
  using (museum_private.is_admin_session());

create or replace function museum_private.capture_legacy_defined_user_password()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, museum_private, extensions
as $$
begin
  if new.password is not null and btrim(new.password) <> '' then
    insert into museum_private.credentials(user_key, password_hash, updated_at)
    values (new.code, extensions.crypt(new.password, extensions.gen_salt('bf',11)), now())
    on conflict(user_key) do update
      set password_hash=excluded.password_hash, updated_at=excluded.updated_at;
    new.password := null;
  end if;
  return new;
end;
$$;

revoke all on function museum_private.capture_legacy_defined_user_password() from public;
drop trigger if exists trg_museum_capture_legacy_password on public.defined_users;
create trigger trg_museum_capture_legacy_password
before insert or update of password on public.defined_users
for each row execute function museum_private.capture_legacy_defined_user_password();

update public.defined_users set password = null where password is not null;

-- Storage remains publicly readable only to preserve historical public media URLs.
-- Write operations require a valid museum session.
create policy museum_avatars_public_read on storage.objects for select to public
  using (bucket_id='avatars');
create policy museum_avatars_session_insert on storage.objects for insert to public
  with check (bucket_id='avatars' and museum_private.has_valid_session());
create policy museum_avatars_session_update on storage.objects for update to public
  using (bucket_id='avatars' and museum_private.has_valid_session())
  with check (bucket_id='avatars' and museum_private.has_valid_session());
create policy museum_avatars_session_delete on storage.objects for delete to public
  using (bucket_id='avatars' and museum_private.has_valid_session());

create policy museum_media_public_read on storage.objects for select to public
  using (bucket_id='inspection-media');
create policy museum_media_session_insert on storage.objects for insert to public
  with check (bucket_id='inspection-media' and museum_private.has_valid_session());
create policy museum_media_session_update on storage.objects for update to public
  using (bucket_id='inspection-media' and museum_private.has_valid_session())
  with check (bucket_id='inspection-media' and museum_private.has_valid_session());
create policy museum_media_session_delete on storage.objects for delete to public
  using (bucket_id='inspection-media' and museum_private.has_valid_session());

update storage.buckets set file_size_limit = 1048576 where id='avatars';
update storage.buckets set file_size_limit = 15728640 where id='inspection-media';
