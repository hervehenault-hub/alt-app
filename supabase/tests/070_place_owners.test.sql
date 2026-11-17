-- T2.7 — liens commerçant ↔ lieu : seul un admin les crée/supprime ; le commerçant lié met à jour.
begin;
\ir _lib/helpers.psql
select plan(16);

create temporary table ctx (k text primary key, id uuid);
insert into ctx values
  ('merchant', tests.create_user('merchant@example.test', 'merchant')),
  ('other_merchant', tests.create_user('other@example.test', 'merchant')),
  ('user', tests.create_user('user@example.test')),
  ('admin', tests.create_user('admin@example.test', 'admin'));
with ins as (
  insert into public.places (city_id, category_id, name, location, source, last_verified_at, published, needs_recheck)
  select (select id from public.cities where slug = 'bordeaux'), 'vrac', n,
         'SRID=4326;POINT(-0.57 44.84)'::extensions.geography, 'manual'::public.place_source,
         now() - interval '1 year', p, true
  from (values ('Épicerie du commerçant', true), ('Atelier non publié', false)) v(n, p)
  returning id, name
)
insert into ctx select name, id from ins;
grant select on ctx to anon, authenticated;

-- Création du lien : refusée aux non-admins
select tests.authenticate_as((select id from ctx where k = 'merchant'));
select throws_ok($$ insert into public.place_owners (user_id, place_id)
  values (auth.uid(), (select id from ctx where k = 'Épicerie du commerçant')) $$,
  '42501', null, 'un commerçant ne se lie pas lui-même à un lieu');
select tests.authenticate_as((select id from ctx where k = 'user'));
select throws_ok($$ insert into public.place_owners (user_id, place_id)
  values ((select id from ctx where k = 'merchant'), (select id from ctx where k = 'Épicerie du commerçant')) $$,
  '42501', null, 'un utilisateur ne crée pas de lien');

-- … autorisée à l'admin
select tests.authenticate_as((select id from ctx where k = 'admin'));
select lives_ok($$ insert into public.place_owners (user_id, place_id) values
  ((select id from ctx where k = 'merchant'), (select id from ctx where k = 'Épicerie du commerçant')),
  ((select id from ctx where k = 'merchant'), (select id from ctx where k = 'Atelier non publié')) $$,
  'l''admin lie le commerçant à deux lieux');
select throws_ok($$ insert into public.place_owners (user_id, place_id)
  values ((select id from ctx where k = 'user'), (select id from ctx where k = 'Épicerie du commerçant')) $$,
  '23514', null, 'un compte non commerçant ne peut pas être lié');

-- Le commerçant lié
select tests.authenticate_as((select id from ctx where k = 'merchant'));
select is((select count(*)::int from public.place_owners), 2, 'le commerçant voit ses liens');
select is((select count(*)::int from public.places where id = (select id from ctx where k = 'Atelier non publié')), 1,
  'le commerçant lit son lieu non publié');
select lives_ok($$ update public.places set price_hint = 'Prix libre', address = '3 rue du Test'
  where id = (select id from ctx where k = 'Épicerie du commerçant') $$, 'le commerçant met à jour son lieu');
select results_eq(
  $$ select price_hint, status::text, needs_recheck, last_verified_at = now()
     from public.places where id = (select id from ctx where k = 'Épicerie du commerçant') $$,
  $$ values ('Prix libre', 'merchant_confirmed', false, true) $$,
  'la mise à jour vaut confirmation commerçant'
);
select throws_ok($$ update public.places set published = true where id = (select id from ctx where k = 'Atelier non publié') $$,
  '42501', null, 'le commerçant ne publie pas lui-même son lieu');
select lives_ok($$ insert into public.opening_hours (place_id, weekday, opens, closes)
  values ((select id from ctx where k = 'Épicerie du commerçant'), 1, '09:00', '18:00') $$,
  'le commerçant ajoute un horaire à son lieu');
select is_empty($$ delete from public.place_owners returning user_id $$, 'le commerçant ne supprime pas son lien');

-- Un autre commerçant (non lié) ne modifie rien
select tests.authenticate_as((select id from ctx where k = 'other_merchant'));
select is_empty($$ update public.places set price_hint = 'Piraté'
  where id = (select id from ctx where k = 'Épicerie du commerçant') returning id $$,
  'un commerçant non lié ne modifie pas le lieu');
select throws_ok($$ insert into public.opening_hours (place_id, weekday, opens, closes)
  values ((select id from ctx where k = 'Épicerie du commerçant'), 2, '09:00', '18:00') $$,
  '42501', null, 'un commerçant non lié n''ajoute pas d''horaire');
select is_empty('select 1 from public.place_owners', 'un commerçant ne voit pas les liens des autres');

-- L'admin supprime le lien
select tests.authenticate_as((select id from ctx where k = 'admin'));
with d as (delete from public.place_owners
  where place_id = (select id from ctx where k = 'Atelier non publié') returning 1)
select is((select count(*)::int from d), 1, 'l''admin supprime un lien');
select tests.authenticate_as((select id from ctx where k = 'merchant'));
select is((select count(*)::int from public.places where id = (select id from ctx where k = 'Atelier non publié')), 0,
  'sans lien, le commerçant ne voit plus le lieu non publié');

select * from finish();
rollback;
