-- T2.11 — analytics_events : insertion par tous, aucune lecture client.
begin;
\ir _lib/helpers.psql
select plan(10);

create temporary table ctx (k text primary key, id uuid);
insert into ctx values
  ('alice', tests.create_user('alice@example.test')),
  ('optout', tests.create_user('optout@example.test'));
update public.profiles set analytics_opt_out = true where id = (select id from ctx where k = 'optout');
grant select on ctx to anon, authenticated;

select tests.as_anon();
select lives_ok($$ insert into public.analytics_events (anon_id, name, props)
  values (gen_random_uuid(), 'app_opened', '{"platform": "ios"}') $$, 'un anonyme insère un événement');
select throws_ok('select * from public.analytics_events', '42501', null, 'un anonyme ne lit pas les événements');
select throws_ok($$ insert into public.analytics_events (anon_id, user_id, name)
  values (gen_random_uuid(), (select id from ctx where k = 'alice'), 'app_opened') $$,
  '42501', null, 'un anonyme n''attribue pas un événement à un utilisateur');
select throws_ok($$ insert into public.analytics_events (anon_id, name) values (gen_random_uuid(), 'Nom Invalide!') $$,
  '23514', null, 'un nom d''événement invalide est refusé');

select tests.authenticate_as((select id from ctx where k = 'alice'));
select lives_ok($$ insert into public.analytics_events (anon_id, user_id, name)
  values (gen_random_uuid(), auth.uid(), 'place_viewed') $$, 'alice insère un événement à son nom');
select throws_ok('select * from public.analytics_events', '42501', null, 'alice ne lit pas les événements');
select throws_ok($$ delete from public.analytics_events $$, '42501', null, 'alice ne supprime pas d''événements');

select tests.authenticate_as((select id from ctx where k = 'optout'));
select lives_ok($$ insert into public.analytics_events (anon_id, user_id, name)
  values (gen_random_uuid(), auth.uid(), 'place_viewed') $$, 'l''insertion d''un utilisateur opposé ne plante pas…');

select tests.as_postgres();
select is((select count(*)::int from public.analytics_events where user_id = (select id from ctx where k = 'optout')), 0,
  '… mais l''événement est ignoré (analytics_opt_out)');
select is((select count(*)::int from public.analytics_events), 2, 'deux événements enregistrés au total');

select * from finish();
rollback;
