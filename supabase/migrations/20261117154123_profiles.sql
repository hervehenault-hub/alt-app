-- T2.5 — Profils utilisateurs, rôles, et droits d'administration.
--
-- Un profil est créé automatiquement à l'inscription (déclencheur sur auth.users).
-- Un utilisateur lit et modifie SON profil, mais ne peut jamais changer son rôle : seul un
-- administrateur (ou le serveur) le peut.

create type public.user_role as enum ('user', 'merchant', 'admin');
create type public.main_constraint as enum ('budget', 'temps', 'mobilite');
create type public.notification_frequency as enum ('never', 'weekly', 'daily');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or length(btrim(display_name)) between 1 and 50),
  city_id uuid references public.cities (id) on delete set null,
  -- domaines d'intérêt (identifiants de public.domains)
  interests text[] not null default '{}'
    check (interests <@ array['alimentation', 'quotidien_dechets', 'reparation_reemploi']::text[]),
  main_constraint public.main_constraint,
  neighborhood_id uuid, -- clé étrangère ajoutée avec les quartiers (T2.10)
  role public.user_role not null default 'user',
  notification_frequency public.notification_frequency not null default 'weekly',
  gamification_enabled boolean not null default true,
  analytics_opt_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profil applicatif (1 ligne par compte Auth). Le rôle n''est modifiable que par un admin.';

create index profiles_city_id_idx on public.profiles (city_id);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Fonctions de rôle (SECURITY DEFINER : lisent profiles sans repasser par la RLS → pas de boucle)
-- ---------------------------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.role = 'admin' from public.profiles p where p.id = auth.uid()), false)
$$;

comment on function public.is_admin() is 'true si l''utilisateur connecté a le rôle admin.';

revoke execute on function public.current_user_role() from public;
revoke execute on function public.is_admin() from public;
grant execute on function public.current_user_role() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Création du profil à l'inscription
-- ---------------------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(btrim(left(new.raw_user_meta_data ->> 'display_name', 50)), '');
begin
  insert into public.profiles (id, display_name) values (new.id, v_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------------------------
-- Garde-fou : un client (anon / authenticated) non admin ne change jamais le rôle.
-- Le serveur (postgres, service_role) et les admins le peuvent.
-- ---------------------------------------------------------------------------------------------
create or replace function public.profiles_guard_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and current_user in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'Le rôle d''un profil ne peut être modifié que par un administrateur'
      using errcode = '42501';
  end if;
  if new.id is distinct from old.id then
    raise exception 'L''identifiant d''un profil est immuable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.profiles_guard_role();

-- ---------------------------------------------------------------------------------------------
-- RLS profils
-- ---------------------------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles: lecture de son profil" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: modification de son profil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));
-- Pas d'insertion (déclencheur) ni de suppression (suppression du compte Auth → cascade).

-- ---------------------------------------------------------------------------------------------
-- Écriture des référentiels, lieux et horaires : administrateurs
-- ---------------------------------------------------------------------------------------------
create policy "cities: écriture admin" on public.cities for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "domains: écriture admin" on public.domains for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories: écriture admin" on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "needs: écriture admin" on public.needs for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "need_categories: écriture admin" on public.need_categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "places: tout pour les admins" on public.places for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "opening_hours: tout pour les admins" on public.opening_hours for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
