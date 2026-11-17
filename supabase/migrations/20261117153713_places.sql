-- T2.3 — Lieux (épiceries vrac, repair cafés, ressourceries…).
-- Lecture publique des seuls lieux publiés. Les écritures (admin, commerçant lié) sont ajoutées
-- par les migrations des profils (T2.5) et des propriétaires de lieux (T2.7).

create type public.place_status as enum ('community', 'multi_confirmed', 'merchant_confirmed');
comment on type public.place_status is
  'Fiabilité : community = signalé par la communauté, multi_confirmed = confirmé par plusieurs personnes, merchant_confirmed = confirmé par le commerçant.';

create type public.place_source as enum ('osm', 'open_data', 'manual', 'user');

create table public.places (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id),
  category_id text not null references public.categories (id) on update cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  address text check (address is null or length(address) <= 200),
  location extensions.geography(Point, 4326) not null,
  price_hint text check (price_hint is null or length(price_hint) <= 60),
  is_free boolean not null default false,
  walk_accessible boolean not null default false,
  transit_accessible boolean not null default false,
  estimated_saving_eur numeric(8, 2) check (estimated_saving_eur is null or estimated_saving_eur >= 0),
  saving_basis text check (saving_basis is null or length(saving_basis) <= 300),
  status public.place_status not null default 'community',
  needs_recheck boolean not null default false,
  last_verified_at timestamptz not null,
  source public.place_source not null,
  source_ref text,
  license text,
  published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- une économie affichée doit toujours être expliquée
  constraint places_saving_has_basis check (estimated_saving_eur is null or saving_basis is not null),
  -- les données importées (OSM : ODbL, open data) doivent citer leur licence et leur référence
  constraint places_import_has_license check (source not in ('osm', 'open_data') or (license is not null and source_ref is not null)),
  constraint places_source_ref_unique unique (source, source_ref)
);

comment on table public.places is 'Lieux d''alternatives écologiques. Visibles du public uniquement si published = true.';
comment on column public.places.last_verified_at is 'Date de dernière vérification des informations (obligatoire).';
comment on column public.places.price_hint is 'Indication courte de prix, ex. « 2 à 5 € », « prix libre ».';

create index places_location_idx on public.places using gist (location);
create index places_name_trgm_idx on public.places using gin (public.normalize_search_text(name) extensions.gin_trgm_ops);
create index places_city_category_idx on public.places (city_id, category_id) where published;
create index places_needs_recheck_idx on public.places (needs_recheck) where needs_recheck;

create trigger places_set_updated_at before update on public.places
  for each row execute function public.set_updated_at();

alter table public.places enable row level security;

create policy "places: lecture publique des lieux publiés" on public.places
  for select to anon, authenticated using (published);
