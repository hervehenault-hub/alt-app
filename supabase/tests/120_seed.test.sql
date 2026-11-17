-- T2.15 — le jeu de données local (supabase/seed.sql) est chargé et cohérent.
begin;
\ir _lib/helpers.psql
select plan(13);

select is((select name from public.cities where slug = 'testville'), 'Testville', 'Testville existe');
select is((select count(*)::int from public.cities where slug in ('bordeaux', 'testville')), 2, 'Bordeaux et Testville');
select is((select count(*)::int from public.neighborhoods n join public.cities c on c.id = n.city_id where c.slug = 'testville'), 3,
  '3 quartiers à Testville');

create temporary view tv_places with (security_invoker = true) as
  select p.* from public.places p join public.cities c on c.id = p.city_id where c.slug = 'testville';

select is((select count(*)::int from tv_places), 40, '40 lieux à Testville');
select is((select count(distinct category_id)::int from tv_places), 6, 'les 6 catégories sont représentées');
select is((select count(*)::int from tv_places where not published), 4, '4 lieux non publiés');
select cmp_ok((select count(*)::int from tv_places where needs_recheck), '>=', 3, 'plusieurs lieux à revérifier');
select is((select count(*)::int from tv_places p where not exists (select 1 from public.opening_hours oh where oh.place_id = p.id)), 8,
  '8 lieux sans horaires connus');
select ok(exists (select 1 from public.opening_hours oh join tv_places p on p.id = oh.place_id where oh.closes < oh.opens),
  'des créneaux finissent après minuit');

select results_eq(
  $$ select p.role::text, count(*)::int from public.profiles p join auth.users u on u.id = p.id
     where u.email like '%@alt.test' group by p.role order by p.role $$,
  $$ values ('user', 3), ('merchant', 1), ('admin', 1) $$,
  '5 comptes de test : 3 user, 1 merchant, 1 admin'
);
select is(
  (select p.name from public.place_owners po join public.places p on p.id = po.place_id
   join auth.users u on u.id = po.user_id where u.email = 'commercant@alt.test'),
  'Épicerie Vrac du Centre', 'le commerçant est lié à un lieu'
);

grant select on tv_places to anon;
select tests.as_anon();
select is((select count(*)::int from tv_places), 36, 'un anonyme voit les 36 lieux publiés de Testville');
select tests.authenticate_as('7e570000-0000-4000-8000-000000000004');
select is((select count(*)::int from public.places where id = md5('testville-place-1')::uuid and price_hint is not null), 1,
  'le commerçant de test voit son lieu');

select * from finish();
rollback;
