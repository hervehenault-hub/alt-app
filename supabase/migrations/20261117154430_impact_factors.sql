-- T2.8 — Facteurs d'impact carbone et équivalences concrètes.
-- Colonnes alignées sur le format « Factor » de content/README.md (content/impact-factors.json).
-- Règle : toute valeur cite une source (source_url https obligatoire) ; value n'est NULL que si
-- status = a_verifier. L'app n'affiche un chiffre que si value non NULL et status ≠ a_verifier.

create type public.impact_factor_status as enum ('verifie_code_source', 'verifie', 'a_verifier');

create table public.impact_factors (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and id !~ '^eq-'),
  label text not null check (length(btrim(label)) > 0),
  value numeric check (value is null or value > 0),
  unit text not null check (length(btrim(unit)) > 0),
  source_name text not null check (length(btrim(source_name)) > 0),
  source_url text not null check (source_url ~ '^https://\S+$'),
  upstream_source_url text check (upstream_source_url is null or upstream_source_url ~ '^https://\S+$'),
  method text not null,
  uncertainty text not null,
  version text,
  retrieved_at date,
  status public.impact_factor_status not null default 'a_verifier',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint impact_factors_value_or_unverified check (value is not null or status = 'a_verifier')
);

comment on table public.impact_factors is 'Facteurs d''impact (kgCO2e évités par occurrence), sourcés. Voir content/README.md.';

create trigger impact_factors_set_updated_at before update on public.impact_factors
  for each row execute function public.set_updated_at();

-- Équivalences : repères concrets (km en voiture, repas…). value = kgCO2e par unité ;
-- équivalent = kgCO2e évités ÷ value.
create table public.equivalences (
  id text primary key check (id ~ '^eq-[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null check (length(btrim(label)) > 0),
  value numeric check (value is null or value > 0),
  unit text not null check (length(btrim(unit)) > 0),
  source_name text not null check (length(btrim(source_name)) > 0),
  source_url text not null check (source_url ~ '^https://\S+$'),
  upstream_source_url text check (upstream_source_url is null or upstream_source_url ~ '^https://\S+$'),
  method text not null,
  uncertainty text not null,
  version text,
  retrieved_at date,
  status public.impact_factor_status not null default 'a_verifier',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equivalences_value_or_unverified check (value is not null or status = 'a_verifier')
);

comment on table public.equivalences is 'Équivalences (value = kgCO2e par unité, ex. par km en voiture), sourcées.';

create trigger equivalences_set_updated_at before update on public.equivalences
  for each row execute function public.set_updated_at();

alter table public.impact_factors enable row level security;
alter table public.equivalences enable row level security;

create policy "impact_factors: lecture publique" on public.impact_factors
  for select to anon, authenticated using (true);
create policy "impact_factors: écriture admin" on public.impact_factors
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "equivalences: lecture publique" on public.equivalences
  for select to anon, authenticated using (true);
create policy "equivalences: écriture admin" on public.equivalences
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
