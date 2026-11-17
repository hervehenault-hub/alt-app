-- T2.9 — Parcours pas à pas : catalogue d'actions, actions de l'utilisateur, rythme du parcours.
-- Colonnes de « actions » alignées sur content/actions.json. Catalogue lisible par tous ;
-- les lignes d'un utilisateur ne sont visibles que de lui (pas même des admins).

create type public.action_effort as enum ('faible', 'moyen');
create type public.action_kind as enum ('ponctuelle', 'habitude');
create type public.user_action_status as enum ('done', 'later', 'not_for_me');
create type public.journey_rhythm as enum ('weekly', 'twice_weekly', 'self_paced');

create table public.actions (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  domain text not null references public.domains (id) on update cascade,
  title text not null check (length(btrim(title)) between 1 and 70),
  body text not null check (length(btrim(body)) between 1 and 400),
  effort public.action_effort not null,
  kind public.action_kind not null,
  saving_eur_per_occurrence numeric(8, 2) not null check (saving_eur_per_occurrence >= 0),
  saving_basis text not null check (length(btrim(saving_basis)) > 0),
  impact_factor_id text references public.impact_factors (id) on update cascade on delete set null,
  linked_category text references public.categories (id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.actions is 'Catalogue des actions du parcours (source : content/actions.json).';

create index actions_domain_idx on public.actions (domain);

create trigger actions_set_updated_at before update on public.actions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
create table public.user_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  action_id text not null references public.actions (id) on update cascade on delete cascade,
  status public.user_action_status not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.user_actions is
  'Historique : une ligne par réponse. Une habitude peut être « done » plusieurs fois, une action ponctuelle une seule.';

create index user_actions_user_id_idx on public.user_actions (user_id, occurred_at desc);

-- Une action ponctuelle ne peut être faite (done) qu'une fois par utilisateur.
create or replace function public.user_actions_check_once()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done'
     and (select a.kind from public.actions a where a.id = new.action_id) = 'ponctuelle'
     and exists (
       select 1 from public.user_actions ua
       where ua.user_id = new.user_id and ua.action_id = new.action_id
         and ua.status = 'done' and ua.id <> new.id
     ) then
    raise exception 'Action ponctuelle déjà réalisée' using errcode = '23505';
  end if;
  return new;
end;
$$;

create trigger user_actions_check_once before insert or update on public.user_actions
  for each row execute function public.user_actions_check_once();

-- ---------------------------------------------------------------------------------------------
create table public.user_journeys (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  rhythm public.journey_rhythm not null default 'weekly',
  current_action_id text references public.actions (id) on update cascade on delete set null,
  next_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_journeys is 'Parcours de chaque utilisateur : rythme, action en cours, prochaine proposition.';

create trigger user_journeys_set_updated_at before update on public.user_journeys
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
alter table public.actions enable row level security;
alter table public.user_actions enable row level security;
alter table public.user_journeys enable row level security;

create policy "actions: lecture publique" on public.actions
  for select to anon, authenticated using (true);
create policy "actions: écriture admin" on public.actions
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "user_actions: ses lignes uniquement" on public.user_actions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "user_journeys: son parcours uniquement" on public.user_journeys
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
