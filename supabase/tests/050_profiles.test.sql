-- T2.5 — profils : création à l'inscription, lecture/modification de son profil, rôle protégé.
begin;
\ir _lib/helpers.psql
select plan(16);

create temporary table ctx (k text primary key, id uuid);
insert into ctx values
  ('alice', tests.create_user('alice@example.test')),
  ('bob', tests.create_user('bob@example.test')),
  ('admin', tests.create_user('admin@example.test', 'admin'));
grant select on ctx to anon, authenticated;

-- Déclencheur d'inscription et valeurs par défaut
select is((select display_name from public.profiles where id = (select id from ctx where k = 'alice')), 'alice',
  'le profil est créé à l''inscription avec le display_name des métadonnées');
select results_eq(
  $$ select role::text, notification_frequency::text, gamification_enabled, analytics_opt_out
     from public.profiles where id = (select id from ctx where k = 'alice') $$,
  $$ values ('user', 'weekly', true, false) $$,
  'valeurs par défaut : user, weekly, gamification activée, analytics acceptée'
);
select throws_ok(
  $$ update public.profiles set interests = array['astrologie'] where id = (select id from ctx where k = 'alice') $$,
  '23514', null, 'un intérêt hors des domaines est refusé'
);

-- Alice lit et modifie son profil
select tests.authenticate_as((select id from ctx where k = 'alice'));
select is((select count(*)::int from public.profiles), 1, 'alice ne voit que son profil');
select lives_ok(
  $$ update public.profiles set display_name = 'Alice', interests = array['alimentation'], main_constraint = 'budget',
       notification_frequency = 'never', gamification_enabled = false
     where id = auth.uid() $$,
  'alice modifie son profil'
);
select is((select display_name from public.profiles where id = auth.uid()), 'Alice', 'la modification est enregistrée');

-- … mais jamais son rôle
select throws_ok($$ update public.profiles set role = 'admin' where id = auth.uid() $$,
  '42501', null, 'alice ne peut pas se donner le rôle admin');
select throws_ok($$ update public.profiles set role = 'merchant' where id = auth.uid() $$,
  '42501', null, 'alice ne peut pas se donner le rôle commerçant');

-- … ni le profil de Bob
select is_empty($$ select 1 from public.profiles where id = (select id from ctx where k = 'bob') $$,
  'alice ne lit pas le profil de bob');
update public.profiles set display_name = 'Piraté' where id = (select id from ctx where k = 'bob');
select tests.as_postgres();
select is((select display_name from public.profiles where id = (select id from ctx where k = 'bob')), 'bob',
  'alice ne modifie pas le profil de bob');
select tests.authenticate_as((select id from ctx where k = 'alice'));
select throws_ok($$ insert into public.profiles (id) values (gen_random_uuid()) $$,
  '42501', null, 'un utilisateur ne crée pas de profil lui-même');
select is_empty($$ delete from public.profiles where id = auth.uid() returning id $$,
  'un utilisateur ne supprime pas son profil directement');

-- Un anonyme ne lit aucun profil
select tests.as_anon();
select is_empty('select 1 from public.profiles', 'un anonyme ne lit aucun profil');

-- L'admin lit tout et peut changer un rôle
select tests.authenticate_as((select id from ctx where k = 'admin'));
select cmp_ok((select count(*)::int from public.profiles), '>=', 3, 'l''admin lit tous les profils');
select lives_ok($$ update public.profiles set role = 'merchant' where id = (select id from ctx where k = 'bob') $$,
  'l''admin change le rôle de bob');
select tests.as_postgres();
select is((select role::text from public.profiles where id = (select id from ctx where k = 'bob')), 'merchant',
  'bob est désormais commerçant');

select * from finish();
rollback;
