-- T2.4 — horaires d'ouverture et is_open_now() (heure de Paris).
-- Repères : 2026-11-16 = lundi, 2026-11-20 = vendredi, 2026-11-22 = dimanche (heure d'hiver, UTC+1).
-- Passage à l'heure d'été le dimanche 2026-03-29 (UTC+2 ensuite).
begin;
\ir _lib/helpers.psql
select plan(18);

create temporary table ctx (k text primary key, id uuid);

with city as (select id from public.cities where slug = 'bordeaux'),
ins as (
  insert into public.places (city_id, category_id, name, location, source, last_verified_at, published)
  select city.id, 'vrac', n, 'SRID=4326;POINT(-0.57 44.84)'::extensions.geography, 'manual'::public.place_source, now(), p
  from city, (values ('Épicerie test', true), ('Lieu sans horaires', true), ('Lieu 24h', true), ('Brouillon test', false)) v(n, p)
  returning id, name
)
insert into ctx select name, id from ins;

-- Épicerie : lundi→samedi 09:00-12:30 et 14:00-19:00, fermée le dimanche,
-- plus une soirée le vendredi 22:00 → 02:00 (samedi).
insert into public.opening_hours (place_id, weekday, opens, closes)
select (select id from ctx where k = 'Épicerie test'), d, o::time, c::time
from generate_series(1, 6) d, (values ('09:00', '12:30'), ('14:00', '19:00')) h(o, c)
union all
select (select id from ctx where k = 'Épicerie test'), 5, '22:00', '02:00';

insert into public.opening_hours (place_id, weekday, opens, closes)
select (select id from ctx where k = 'Lieu 24h'), d, '00:00', '24:00' from generate_series(1, 7) d;

insert into public.opening_hours (place_id, weekday, opens, closes)
values ((select id from ctx where k = 'Brouillon test'), 1, '00:00', '24:00');

create function pg_temp.open_at(p_key text, p_at timestamptz) returns boolean
language sql as $$ select public.is_open_now((select id from ctx where k = p_key), p_at) $$;

select is(pg_temp.open_at('Épicerie test', '2026-11-16 10:00 Europe/Paris'), true, '1. lundi 10:00 : ouvert');
select is(pg_temp.open_at('Épicerie test', '2026-11-16 13:00 Europe/Paris'), false, '2. lundi 13:00 : fermé (pause midi)');
select is(pg_temp.open_at('Épicerie test', '2026-11-22 11:00 Europe/Paris'), false, '3. dimanche 11:00 : fermé');
select is(pg_temp.open_at('Épicerie test', '2026-11-16 09:00 Europe/Paris'), true, '4. lundi 09:00 pile : ouvert (borne incluse)');
select is(pg_temp.open_at('Épicerie test', '2026-11-16 12:30 Europe/Paris'), false, '5. lundi 12:30 pile : fermé (borne exclue)');
select is(pg_temp.open_at('Épicerie test', '2026-11-20 23:30 Europe/Paris'), true, '6. vendredi 23:30 : ouvert (soirée)');
select is(pg_temp.open_at('Épicerie test', '2026-11-21 01:30 Europe/Paris'), true, '7. samedi 01:30 : ouvert (créneau du vendredi après minuit)');
select is(pg_temp.open_at('Épicerie test', '2026-11-21 02:30 Europe/Paris'), false, '8. samedi 02:30 : fermé');
select is(pg_temp.open_at('Épicerie test', '2026-11-17 01:30 Europe/Paris'), false, '9. mardi 01:30 : fermé (lundi ne déborde pas)');
select is(pg_temp.open_at('Lieu sans horaires', now()), null, '10. lieu sans horaires : NULL');
select is(public.is_open_now(gen_random_uuid(), now()), null, '11. lieu inconnu : NULL');
-- Changement d'heure : même heure UTC (07:30), résultat différent.
select is(pg_temp.open_at('Épicerie test', '2026-03-23 07:30+00'), false, '12. heure d''hiver : 07:30 UTC = 08:30 à Paris, fermé');
select is(pg_temp.open_at('Épicerie test', '2026-03-30 07:30+00'), true, '13. heure d''été : 07:30 UTC = 09:30 à Paris, ouvert');
select is(pg_temp.open_at('Lieu 24h', '2026-11-22 23:59 Europe/Paris'), true, '14. lieu 00:00-24:00 : ouvert à 23:59');
select is(pg_temp.open_at('Lieu 24h', '2026-11-22 00:00 Europe/Paris'), true, '15. lieu 00:00-24:00 : ouvert à minuit');

-- Contraintes
select throws_ok($$ insert into public.opening_hours (place_id, weekday, opens, closes)
  values ((select id from ctx where k = 'Lieu sans horaires'), 8, '09:00', '10:00') $$,
  '23514', null, '16. jour 8 refusé');
select throws_ok($$ insert into public.opening_hours (place_id, weekday, opens, closes)
  values ((select id from ctx where k = 'Lieu sans horaires'), 1, '09:00', '09:00') $$,
  '23514', null, '17. créneau vide refusé');

-- RLS : les horaires d'un lieu non publié ne sont pas visibles d'un anonyme
grant select on ctx to anon;
select tests.as_anon();
select is(
  (select count(*)::int from public.opening_hours where place_id = (select id from ctx where k = 'Brouillon test')),
  0, '18. un anonyme ne voit pas les horaires d''un lieu non publié'
);

select * from finish();
rollback;
