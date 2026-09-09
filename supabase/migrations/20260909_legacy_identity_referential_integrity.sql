-- Preserve historical operational ownership by making identity references explicit.
-- Existing data was checked first: there are no orphan inspector/user log codes.

create index if not exists idx_user_logs_user_code_login_timestamp
  on public.user_logs (user_code, login_timestamp desc);

alter table public.inspections
  drop constraint if exists inspections_inspector_code_fkey;
alter table public.inspections
  add constraint inspections_inspector_code_fkey
  foreign key (inspector_code)
  references public.defined_users(code)
  on update cascade
  on delete restrict;

alter table public.user_logs
  drop constraint if exists user_logs_user_code_fkey;
alter table public.user_logs
  add constraint user_logs_user_code_fkey
  foreign key (user_code)
  references public.defined_users(code)
  on update cascade
  on delete restrict;
