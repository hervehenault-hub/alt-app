-- T2.3 — table places : contraintes, index, lecture publique des seuls lieux publiés.
begin;
\ir _lib/helpers.psql
select plan(13);

select has_table('public', 'places', 'table places');
select col_not_null('public', 'places', 'last_verified_at', 'last_verified_at est obligatoire');
select col_type_is('public', 'places', 'location', 'extensions.geography(Point,4326)', 'location est un point géographique');
select col_default_is('public', 'places', 'published', 'false', 'un lieu n''est pas publié par défaut');
select col_default_is('public', 'places', 'needs_recheck', 'false', 'needs_recheck vaut false par défaut');
select has_index('public', 'places', 'places_location_idx', 'index GIST sur location');
select has_index('public', 'places', 'places_name_trgm_idx', 'index trigramme sur le nom');

create temporary table ctx as
select (select id from public.cities where slug = 'bordeaux') as city_id;
grant select on ctx to anon, authenticated;

select throws_ok(
  $$ insert into public.places (city_id, category_id, name, location, source)
     select city_id, 'vrac', 'Sans date', 'SRID=4326;POINT(-0.57 44.84)', 'manual' from ctx $$,
  '23502', null, 'insertion sans last_verified_at refusée'
);
select throws_ok(
  $$ insert into public.places (city_id, category_id, name, location, source, last_verified_at, estimated_saving_eur)
     select city_id, 'vrac', 'Économie sans explication', 'SRID=4326;POINT(-0.57 44.84)', 'manual', now(), 5 from ctx $$,
  '23514', null, 'une économie estimée sans saving_basis est refusée'
);
select throws_ok(
  $$ insert into public.places (city_id, category_id, name, location, source, last_verified_at)
     select city_id, 'vrac', 'Import sans licence', 'SRID=4326;POINT(-0.57 44.84)', 'osm', now() from ctx $$,
  '23514', null, 'un lieu OSM sans licence ni référence est refusé'
);

insert into public.places (city_id, category_id, name, location, source, last_verified_at, published)
select city_id, 'vrac', 'Lieu publié (test)', 'SRID=4326;POINT(-0.57 44.84)'::extensions.geography, 'manual'::public.place_source, now(), true from ctx
union all
select city_id, 'vrac', 'Lieu brouillon (test)', 'SRID=4326;POINT(-0.57 44.84)', 'manual', now(), false from ctx;

select tests.as_anon();
select is((select count(*)::int from public.places where name = 'Lieu publié (test)'), 1, 'un anonyme lit un lieu publié');
select is((select count(*)::int from public.places where name = 'Lieu brouillon (test)'), 0, 'un anonyme ne lit pas un lieu non publié');
select throws_ok(
  $$ insert into public.places (city_id, category_id, name, location, source, last_verified_at)
     select city_id, 'vrac', 'Pirate', 'SRID=4326;POINT(-0.57 44.84)', 'manual', now() from ctx $$,
  '42501', null, 'un anonyme ne peut pas créer de lieu'
);

select * from finish();
rollback;
