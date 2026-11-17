-- T2.6 — Contributions de la communauté : propositions de lieux, signalements, confirmations.
-- Chacun ne voit que ses propres propositions et signalements ; les admins voient et modèrent tout.

create type public.submission_kind as enum ('new', 'edit');
create type public.submission_status as enum ('pending', 'approved', 'rejected');
create type public.place_report_reason as enum ('closed', 'wrong_hours', 'wrong_address', 'other');
create type public.report_status as enum ('open', 'resolved', 'dismissed');

-- ---------------------------------------------------------------------------------------------
-- Propositions (nouveau lieu ou modification d'un lieu existant)
-- ---------------------------------------------------------------------------------------------
create table public.place_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.submission_kind not null,
  place_id uuid references public.places (id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 10000),
  photo_path text check (photo_path is null or length(photo_path) <= 300),
  status public.submission_status not null default 'pending',
  moderator_id uuid references auth.users (id) on delete set null,
  rejection_reason text check (rejection_reason is null or length(rejection_reason) <= 500),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint place_submissions_kind_place check (
    (kind = 'new' and place_id is null) or (kind = 'edit' and place_id is not null)
  ),
  constraint place_submissions_rejection_reason check (status <> 'rejected' or rejection_reason is not null)
);

comment on table public.place_submissions is 'Propositions de lieux (new) ou de corrections (edit), modérées par un admin.';

create index place_submissions_user_id_idx on public.place_submissions (user_id);
create index place_submissions_pending_idx on public.place_submissions (created_at) where status = 'pending';

create trigger place_submissions_set_updated_at before update on public.place_submissions
  for each row execute function public.set_updated_at();

alter table public.place_submissions enable row level security;

create policy "place_submissions: lecture des siennes (admin : toutes)" on public.place_submissions
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "place_submissions: proposer" on public.place_submissions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending' and moderator_id is null and rejection_reason is null and reviewed_at is null
  );

create policy "place_submissions: modération admin" on public.place_submissions
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "place_submissions: suppression admin" on public.place_submissions
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
-- Signalements d'un lieu (fermé, mauvais horaires…)
-- ---------------------------------------------------------------------------------------------
create table public.place_reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason public.place_report_reason not null,
  comment text check (comment is null or length(comment) <= 500),
  status public.report_status not null default 'open',
  resolved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index place_reports_place_id_idx on public.place_reports (place_id);
create index place_reports_reporter_id_idx on public.place_reports (reporter_id);

create trigger place_reports_set_updated_at before update on public.place_reports
  for each row execute function public.set_updated_at();

-- Un signalement marque le lieu « à revérifier ».
create or replace function public.place_reports_flag_place()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.places set needs_recheck = true where id = new.place_id and not needs_recheck;
  return new;
end;
$$;

revoke execute on function public.place_reports_flag_place() from public, anon, authenticated;

create trigger place_reports_flag_place after insert on public.place_reports
  for each row execute function public.place_reports_flag_place();

alter table public.place_reports enable row level security;

create policy "place_reports: lecture des siens (admin : tous)" on public.place_reports
  for select to authenticated using (reporter_id = (select auth.uid()) or (select public.is_admin()));

-- On ne signale qu'un lieu visible (publié), avec le statut initial.
create policy "place_reports: signaler" on public.place_reports
  for insert to authenticated
  with check (
    reporter_id = (select auth.uid()) and status = 'open' and resolved_by is null
    and exists (select 1 from public.places p where p.id = place_id)
  );

create policy "place_reports: traitement admin" on public.place_reports
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "place_reports: suppression admin" on public.place_reports
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
-- Confirmations (« ce lieu existe toujours ») — une par personne et par lieu
-- ---------------------------------------------------------------------------------------------
create table public.place_confirmations (
  place_id uuid not null references public.places (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, user_id)
);

create index place_confirmations_user_id_idx on public.place_confirmations (user_id);

comment on table public.place_confirmations is
  'Confirmation qu''un lieu existe toujours. Rafraîchit last_verified_at ; 3 personnes → multi_confirmed.';

-- Seuil de confirmations distinctes pour passer de « community » à « multi_confirmed ».
create or replace function public.place_confirmations_threshold()
returns integer
language sql
immutable
set search_path = ''
as $$ select 3 $$;

create or replace function public.place_confirmations_apply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.place_confirmations where place_id = new.place_id;
  update public.places
  set last_verified_at = greatest(last_verified_at, now()),
      needs_recheck = false,
      status = case
        when status = 'community' and v_count >= public.place_confirmations_threshold()
          then 'multi_confirmed'::public.place_status
        else status
      end
  where id = new.place_id;
  return new;
end;
$$;

revoke execute on function public.place_confirmations_apply() from public, anon, authenticated;

create trigger place_confirmations_apply after insert on public.place_confirmations
  for each row execute function public.place_confirmations_apply();

alter table public.place_confirmations enable row level security;

create policy "place_confirmations: lecture des siennes (admin : toutes)" on public.place_confirmations
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "place_confirmations: confirmer un lieu visible" on public.place_confirmations
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.places p where p.id = place_id)
  );

create policy "place_confirmations: retirer la sienne" on public.place_confirmations
  for delete to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
