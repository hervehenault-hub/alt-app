-- T2.4 — Horaires d'ouverture et fonction is_open_now().
--
-- Un créneau = un jour (1 = lundi … 7 = dimanche, norme ISO) + heure d'ouverture + heure de
-- fermeture, en heure locale de la ville (Europe/Paris pour Bordeaux).
-- - Plusieurs créneaux par jour (pause de midi) : plusieurs lignes.
-- - Créneau qui finit après minuit : closes < opens (ex. vendredi 22:00 → 02:00 le samedi).
-- - Journée entière : 00:00 → 24:00.

create table public.opening_hours (
  id bigint generated always as identity primary key,
  place_id uuid not null references public.places (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  opens time not null,
  closes time not null,
  constraint opening_hours_not_empty check (opens <> closes),
  -- 24:00 n'a de sens qu'en heure de fermeture
  constraint opening_hours_opens_before_24 check (opens < time '24:00'),
  constraint opening_hours_unique_slot unique (place_id, weekday, opens)
);

comment on table public.opening_hours is
  'Créneaux d''ouverture (heure locale). closes < opens = créneau qui se termine le lendemain.';

create index opening_hours_place_id_idx on public.opening_hours (place_id);

alter table public.opening_hours enable row level security;

-- Les horaires sont lisibles quand le lieu l'est (la RLS de places s'applique dans la sous-requête).
create policy "opening_hours: lecture si le lieu est visible" on public.opening_hours
  for select to anon, authenticated
  using (exists (select 1 from public.places p where p.id = place_id));

-- Le lieu est-il ouvert à l'instant « at » ? Calcul en heure locale de la ville du lieu
-- (Europe/Paris par défaut), donc correct lors des changements d'heure.
-- Renvoie NULL si le lieu n'a aucun horaire connu (ou n'est pas visible), sinon true/false.
create or replace function public.is_open_now(place_id uuid, at timestamptz default now())
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  v_tz text;
  v_local timestamp;
  v_day smallint;
  v_prev_day smallint;
  v_time time;
begin
  select coalesce(c.timezone, 'Europe/Paris') into v_tz
  from public.places p
  join public.cities c on c.id = p.city_id
  where p.id = is_open_now.place_id;

  if not exists (select 1 from public.opening_hours oh where oh.place_id = is_open_now.place_id) then
    return null;
  end if;

  v_local := is_open_now.at at time zone coalesce(v_tz, 'Europe/Paris');
  v_day := extract(isodow from v_local)::smallint;
  v_prev_day := case when v_day = 1 then 7 else v_day - 1 end;
  v_time := v_local::time;

  return exists (
    select 1
    from public.opening_hours oh
    where oh.place_id = is_open_now.place_id
      and (
        -- créneau du jour, dans la même journée
        (oh.weekday = v_day and oh.opens < oh.closes and v_time >= oh.opens and v_time < oh.closes)
        -- créneau du jour qui déborde après minuit : partie avant minuit
        or (oh.weekday = v_day and oh.opens > oh.closes and v_time >= oh.opens)
        -- créneau de la veille qui déborde après minuit : partie après minuit
        or (oh.weekday = v_prev_day and oh.opens > oh.closes and v_time < oh.closes)
      )
  );
end;
$$;

comment on function public.is_open_now(uuid, timestamptz) is
  'true/false selon les horaires (heure locale de la ville) ; NULL si aucun horaire connu.';
