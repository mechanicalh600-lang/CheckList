-- Applied to the live CheckList museum Supabase project on 2026-09-09.
-- Fix mutable search_path on historical report RPCs without changing results.

alter function public.get_inspections_overview(timestamptz,timestamptz,text,integer,integer)
  set search_path = pg_catalog, public;
alter function public.get_inspections_overview_v2(timestamptz,timestamptz,text,integer,integer)
  set search_path = pg_catalog, public;
alter function public.get_inspections_details_by_ids(uuid[])
  set search_path = pg_catalog, public;
