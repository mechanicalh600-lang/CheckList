-- Applied to the live CheckList museum Supabase project on 2026-09-09.
-- Splits administrative ALL policies into write-only policies so SELECT is
-- evaluated once, preserving behavior while removing redundant RLS work.

-- asset_schedules
drop policy if exists museum_asset_schedules_admin on public.asset_schedules;
create policy museum_asset_schedules_admin_insert on public.asset_schedules for insert to public
  with check (museum_private.is_admin_session());
create policy museum_asset_schedules_admin_update on public.asset_schedules for update to public
  using (museum_private.is_admin_session()) with check (museum_private.is_admin_session());
create policy museum_asset_schedules_admin_delete on public.asset_schedules for delete to public
  using (museum_private.is_admin_session());

-- defined_assets
drop policy if exists museum_defined_assets_admin on public.defined_assets;
create policy museum_defined_assets_admin_insert on public.defined_assets for insert to public
  with check (museum_private.is_admin_session());
create policy museum_defined_assets_admin_update on public.defined_assets for update to public
  using (museum_private.is_admin_session()) with check (museum_private.is_admin_session());
create policy museum_defined_assets_admin_delete on public.defined_assets for delete to public
  using (museum_private.is_admin_session());

-- defined_checklist_items
drop policy if exists museum_defined_checklist_items_admin on public.defined_checklist_items;
create policy museum_defined_checklist_items_admin_insert on public.defined_checklist_items for insert to public
  with check (museum_private.is_admin_session());
create policy museum_defined_checklist_items_admin_update on public.defined_checklist_items for update to public
  using (museum_private.is_admin_session()) with check (museum_private.is_admin_session());
create policy museum_defined_checklist_items_admin_delete on public.defined_checklist_items for delete to public
  using (museum_private.is_admin_session());

-- job_cards
drop policy if exists museum_job_cards_admin on public.job_cards;
create policy museum_job_cards_admin_insert on public.job_cards for insert to public
  with check (museum_private.is_admin_session());
create policy museum_job_cards_admin_update on public.job_cards for update to public
  using (museum_private.is_admin_session()) with check (museum_private.is_admin_session());
create policy museum_job_cards_admin_delete on public.job_cards for delete to public
  using (museum_private.is_admin_session());
