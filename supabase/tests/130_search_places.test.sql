-- T4.1 / T4.2 — search_places() et get_place() : 10 scénarios de recherche, visibilité, performance.
-- Lieux de test dans une ville fictive éloignée (lat 10, lng 10) pour ne pas croiser le jeu local.
-- 1 km ≈ 0,008993° de latitude. Repère : 2026-11-18 = mercredi (heure d'hiver).
begin;
\ir _lib/helpers.psql
select plan(18);

insert into public.cities (slug, name, timezone, center, bbox) values (
  'recherche-test', 'Recherche test', 'Europe/Paris',
  extensions.st_setsrid(extensions.st_makepoint(10, 10), 4326)::extensions.geography,
  extensions.st_makeenvelope(9.5, 9.5, 10.5, 10.5, 4326)
);

create temporary table ctx (k text primary key, id uuid);
grant select on ctx to anon, authenticated;

create function pg_temp.add_place(
  p_name text, p_category text, p_km double precision,
  p_published boolean default true, p_recheck boolean default false,
  p_free boolean default false, p_walk boolean default false, p_transit boolean default false,
  p_saving numeric default null
) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into public.places (
    city_id, category_id, name, location, source, last_verified_at, published, needs_recheck,
    is_free, walk_accessible, transit_accessible, estimated_saving_eur, saving_basis
  ) values (
    (select id from public.cities where slug = 'recherche-test'), p_category, p_name,
    extensions.st_setsrid(extensions.st_makepoint(10, 10 + p_km * 0.008993), 4326)::extensions.geography,
    'manual', '2026-11-01', p_published, p_recheck, p_free, p_walk, p_transit, p_saving,
    case when p_saving is not null then 'Prix moyen constaté' end
  ) returning id into v_id;
  insert into ctx values (p_name, v_id);
  return v_id;
end $$;

select pg_temp.add_place('Épicerie Vrac du Centre', 'vrac', 0.2, p_saving => 3);
select pg_temp.add_place('La Recharge', 'vrac', 0.05, p_recheck => true, p_saving => 10);
select pg_temp.add_place('Boulangerie Anti-gaspi', 'anti_gaspi', 0.3);
select pg_temp.add_place('Repair Café Bastide', 'reparation', 0.8, p_free => true, p_walk => true);
select pg_temp.add_place('Ressourcerie Le Grenier', 'ressourcerie', 2, p_transit => true, p_saving => 15);
select pg_temp.add_place('Ferme des Deux Rives', 'producteurs', 4);
select pg_temp.add_place('Brouillon vrac', 'vrac', 0, p_published => false);
select pg_temp.add_place('Vrac lointain', 'vrac', 20);

-- Épicerie : tous les jours 08:00-20:00 ; Repair Café : samedi 14:00-18:00 ; Boulangerie : sans horaires.
insert into public.opening_hours (place_id, weekday, opens, closes)
select (select id from ctx where k = 'Épicerie Vrac du Centre'), d, '08:00'::time, '20:00'::time from generate_series(1, 7) d
union all
select (select id from ctx where k = 'Repair Café Bastide'), 6, '14:00'::time, '18:00'::time;

create function pg_temp.names(
  p_q text default null, p_radius integer default 5000, p_open boolean default false,
  p_free boolean default false, p_walk boolean default false, p_transit boolean default false,
  p_sort text default 'distance', p_size integer default 20, p_offset integer default 0,
  p_categories text[] default null
) returns text[] language sql as $$
  select coalesce(array_agg(s.name order by s.ord), '{}')
  from (
    select r.name, row_number() over () as ord
    from public.search_places(
      q => p_q, lat => 10, lng => 10, radius_m => p_radius, category_ids => p_categories,
      open_now => p_open, free_only => p_free, walk_only => p_walk, transit_only => p_transit,
      sort_by => p_sort, page_size => p_size, page_offset => p_offset,
      at_time => '2026-11-18 10:00 Europe/Paris'
    ) r
  ) s
$$;

select tests.as_anon();

select is(pg_temp.names('vrac'), array['Épicerie Vrac du Centre', 'La Recharge'],
  '1. « vrac » : catégorie trouvée ; brouillon et lieu hors rayon exclus ; fiche à revérifier en dernier');
select is((pg_temp.names('EPICERIE'))[1], 'Épicerie Vrac du Centre', '2. sans accents ni majuscules');
select is((pg_temp.names('ressourcery'))[1], 'Ressourcerie Le Grenier', '3. faute de frappe tolérée');
select is(pg_temp.names('grille-pain'), array['Repair Café Bastide'], '4. besoin « grille-pain » → réparation');
select is(pg_temp.names(p_radius => 1000),
  array['Épicerie Vrac du Centre', 'Boulangerie Anti-gaspi', 'Repair Café Bastide', 'La Recharge'],
  '5. rayon de 1 km, tri par distance');
select is(pg_temp.names(p_open => true), array['Épicerie Vrac du Centre'],
  '6. ouvert maintenant (mercredi 10:00) : lieux fermés et sans horaires exclus');
select is(pg_temp.names(p_free => true), array['Repair Café Bastide'], '7. gratuit');
select is(pg_temp.names(p_transit => true), array['Ressourcerie Le Grenier'], '8a. accessible en transport');
select is(pg_temp.names(p_walk => true), array['Repair Café Bastide'], '8b. accessible à pied');
select is((pg_temp.names(p_sort => 'saving'))[1:2], array['Ressourcerie Le Grenier', 'Épicerie Vrac du Centre'],
  '9. tri par économie décroissante');
select is((pg_temp.names(p_sort => 'saving'))[6], 'La Recharge',
  '9b. tri par économie : la fiche à revérifier reste en dernier malgré 10 € d''économie');
select is(pg_temp.names(p_size => 2, p_offset => 2), array['Repair Café Bastide', 'Ressourcerie Le Grenier'],
  '10. pagination (page 2, 2 résultats)');
select is(
  (select total_count from public.search_places(lat => 10, lng => 10, page_size => 2) limit 1),
  6::bigint, '10b. total_count compte tous les résultats');
select is(pg_temp.names(p_categories => array['producteurs']), array['Ferme des Deux Rives'], '11. filtre catégorie');

-- T4.2 — fiche complète.
select is(
  (public.get_place((select id from ctx where k = 'Brouillon vrac'))),
  null, 'get_place : une fiche non publiée est invisible aux anonymes');
select is(
  jsonb_array_length(public.get_place((select id from ctx where k = 'Épicerie Vrac du Centre')) -> 'opening_hours'),
  7, 'get_place : horaires de la semaine');
select ok(
  (select (j ->> 'last_verified_at') is not null and j ->> 'saving_basis' = 'Prix moyen constaté'
          and j ->> 'status' = 'community' and (j ->> 'is_open') is not null
   from (select public.get_place((select id from ctx where k = 'Épicerie Vrac du Centre'), '2026-11-18 10:00 Europe/Paris') j) x),
  'get_place : date de vérification, statut, base de calcul et ouverture');

-- Performance : moins de 300 ms sur 5 000 lieux générés.
select tests.as_postgres();
insert into public.places (city_id, category_id, name, location, source, last_verified_at, published)
select (select id from public.cities where slug = 'recherche-test'),
       (array['vrac', 'producteurs', 'anti_gaspi', 'collecte', 'reparation', 'ressourcerie'])[1 + (g % 6)],
       'Lieu généré ' || g,
       extensions.st_setsrid(extensions.st_makepoint(10 + (random() - 0.5) * 0.1, 10 + (random() - 0.5) * 0.1), 4326)::extensions.geography,
       'manual', now(), true
from generate_series(1, 5000) g;
analyze public.places;
select tests.as_anon();

create function pg_temp.elapsed_ms() returns double precision language plpgsql as $$
declare t0 timestamptz := clock_timestamp(); n int;
begin
  select count(*) into n from public.search_places(q => 'vrac', lat => 10, lng => 10, radius_m => 5000);
  return extract(epoch from clock_timestamp() - t0) * 1000;
end $$;

select ok(pg_temp.elapsed_ms() < 300, 'performance : recherche « vrac » en moins de 300 ms sur 5 000 lieux');

select * from finish();
rollback;
