-- T5.1 / T5.4 — submit_place() et report_place().
begin;
\ir _lib/helpers.psql
select plan(11);

create temporary table ctx as
select (select id from public.cities where slug = 'bordeaux') as city_id,
       tests.create_user('contrib@example.org') as user_id;
grant select on ctx to anon, authenticated;

insert into public.places (city_id, category_id, name, location, source, last_verified_at, published)
select city_id, 'vrac', 'La Grande Jarre', 'SRID=4326;POINT(-0.5733 44.8389)'::extensions.geography,
       'manual'::public.place_source, now(), true from ctx;

select tests.authenticate_as((select user_id from ctx));

select is(public.submit_place('{"name": "", "category_id": "vrac"}') ->> 'field', 'name', 'nom vide refusé');
select is(public.submit_place('{"name": "Épicerie", "category_id": "inconnue"}') ->> 'field', 'category_id',
  'catégorie inconnue refusée');
select is(
  public.submit_place('{"name": "Grande Jarre", "category_id": "vrac", "latitude": 44.83895, "longitude": -0.57335}') ->> 'status',
  'duplicate', 'doublon détecté : même catégorie, < 75 m, nom proche');
select is(
  public.submit_place('{"name": "Grande Jarre", "category_id": "vrac", "latitude": 44.8500, "longitude": -0.5733}') ->> 'status',
  'pending', 'même nom à plus d''1 km : pas un doublon');
select is(
  public.submit_place('{"name": "Atelier Vélo Sud", "category_id": "reparation", "address": "1 rue X, Bordeaux", "is_free": true}') ->> 'status',
  'pending', 'proposition enregistrée sans coordonnées');
select is((select count(*)::int from public.place_submissions where status = 'pending'), 2,
  'les propositions sont en attente de modération et visibles de leur auteur');
select public.submit_place('{"name": "Lieu 3", "category_id": "collecte"}');
select public.submit_place('{"name": "Lieu 4", "category_id": "collecte"}');
select public.submit_place('{"name": "Lieu 5", "category_id": "collecte"}');
select is(public.submit_place('{"name": "Lieu 6", "category_id": "collecte"}') ->> 'status', 'rate_limited',
  '6e proposition en 24 h : limite atteinte');

select is(
  public.report_place((select id from public.places where name = 'La Grande Jarre'), 'wrong_hours') ->> 'status',
  'reported', 'signalement enregistré');
select is(
  public.report_place((select id from public.places where name = 'La Grande Jarre'), 'closed') ->> 'status',
  'already_reported', 'un seul signalement par compte, lieu et mois');

select tests.as_anon();
select throws_ok($$ select public.submit_place('{"name": "Anonyme", "category_id": "vrac"}') $$, '42501', null,
  'un visiteur anonyme ne peut pas proposer');
select throws_ok(
  $$ select public.report_place((select id from public.places where name = 'La Grande Jarre'), 'closed') $$,
  '42501', null, 'un visiteur anonyme ne peut pas signaler');

select * from finish();
rollback;
