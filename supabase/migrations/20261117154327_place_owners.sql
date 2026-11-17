-- T2.7 — Commerçants propriétaires d'un lieu.
-- Seul un admin crée ou supprime le lien. Un commerçant lié met à jour la fiche de son lieu
-- (et ses horaires), sans toucher aux champs de modération (publication, source, licence…).

create table public.place_owners (
  user_id uuid not null references auth.users (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create index place_owners_place_id_idx on public.place_owners (place_id);

comment on table public.place_owners is 'Lien commerçant ↔ lieu, créé uniquement par un admin.';

-- Le compte lié doit avoir le rôle commerçant.
create or replace function public.place_owners_check_merchant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = new.user_id and p.role = 'merchant') then
    raise exception 'Seul un compte commerçant peut être lié à un lieu' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.place_owners_check_merchant() from public, anon, authenticated;

create trigger place_owners_check_merchant before insert or update on public.place_owners
  for each row execute function public.place_owners_check_merchant();

-- Le lieu appartient-il au commerçant connecté ? (SECURITY DEFINER : évite les boucles de RLS)
create or replace function public.is_place_owner(p_place_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.place_owners po
    where po.place_id = p_place_id and po.user_id = auth.uid()
  )
$$;

revoke execute on function public.is_place_owner(uuid) from public;
grant execute on function public.is_place_owner(uuid) to anon, authenticated, service_role;

alter table public.place_owners enable row level security;

create policy "place_owners: lecture de ses liens (admin : tous)" on public.place_owners
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "place_owners: création admin" on public.place_owners
  for insert to authenticated with check ((select public.is_admin()));
create policy "place_owners: suppression admin" on public.place_owners
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
-- Droits du commerçant sur son lieu
-- ---------------------------------------------------------------------------------------------
create policy "places: le commerçant lit ses lieux" on public.places
  for select to authenticated using (public.is_place_owner(id));

create policy "places: le commerçant met à jour ses lieux" on public.places
  for update to authenticated
  using (public.is_place_owner(id))
  with check (public.is_place_owner(id));

create policy "opening_hours: le commerçant gère les horaires de ses lieux" on public.opening_hours
  for all to authenticated
  using (public.is_place_owner(place_id))
  with check (public.is_place_owner(place_id));

-- Champs réservés à la modération ; une mise à jour par le commerçant vaut confirmation.
create or replace function public.places_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;

  if new.published is distinct from old.published
     or new.source is distinct from old.source
     or new.source_ref is distinct from old.source_ref
     or new.license is distinct from old.license
     or new.city_id is distinct from old.city_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
     or new.id is distinct from old.id then
    raise exception 'Champ réservé à la modération' using errcode = '42501';
  end if;

  if public.is_place_owner(old.id) then
    new.status := 'merchant_confirmed';
    new.needs_recheck := false;
    new.last_verified_at := now();
  end if;
  return new;
end;
$$;

create trigger places_guard_update before update on public.places
  for each row execute function public.places_guard_update();
