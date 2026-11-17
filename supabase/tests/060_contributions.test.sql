-- T2.6 — propositions, signalements, confirmations.
begin;
\ir _lib/helpers.psql
select plan(22);

create temporary table ctx (k text primary key, id uuid);
insert into ctx values
  ('alice', tests.create_user('alice@example.test')),
  ('bob', tests.create_user('bob@example.test')),
  ('carol', tests.create_user('carol@example.test')),
  ('admin', tests.create_user('admin@example.test', 'admin'));
with ins as (
  insert into public.places (city_id, category_id, name, location, source, last_verified_at, published)
  select (select id from public.cities where slug = 'bordeaux'), 'reparation', n,
         'SRID=4326;POINT(-0.57 44.84)'::extensions.geography, 'manual'::public.place_source,
         now() - interval '1 year', p
  from (values ('Repair café', true), ('Brouillon', false)) v(n, p)
  returning id, name
)
insert into ctx select name, id from ins;
grant select on ctx to anon, authenticated;

-- ---- Propositions ----
select tests.authenticate_as((select id from ctx where k = 'alice'));
select lives_ok($$ insert into public.place_submissions (kind, payload) values ('new', '{"name": "Épicerie vrac"}') $$,
  'alice propose un nouveau lieu');
select lives_ok($$ insert into public.place_submissions (kind, place_id, payload)
  values ('edit', (select id from ctx where k = 'Repair café'), '{"address": "1 rue X"}') $$,
  'alice propose une correction');
select throws_ok($$ insert into public.place_submissions (kind, payload, status) values ('new', '{}', 'approved') $$,
  '42501', null, 'alice ne peut pas s''auto-approuver');
select throws_ok($$ insert into public.place_submissions (user_id, kind, payload)
  values ((select id from ctx where k = 'bob'), 'new', '{}') $$,
  '42501', null, 'alice ne peut pas proposer au nom de bob');
select throws_ok($$ insert into public.place_submissions (kind, payload) values ('edit', '{}') $$,
  '23514', null, 'une correction sans lieu est refusée');
select is_empty($$ update public.place_submissions set status = 'approved' returning id $$,
  'alice ne peut pas modifier le statut de ses propositions');

select tests.authenticate_as((select id from ctx where k = 'bob'));
select is_empty('select 1 from public.place_submissions', 'bob ne voit pas les propositions d''alice');

select tests.as_anon();
select throws_ok($$ insert into public.place_submissions (kind, payload) values ('new', '{}') $$,
  '42501', null, 'un anonyme ne propose pas de lieu');

select tests.authenticate_as((select id from ctx where k = 'admin'));
select is((select count(*)::int from public.place_submissions), 2, 'l''admin voit toutes les propositions');
select throws_ok($$ update public.place_submissions set status = 'rejected' where kind = 'new' $$,
  '23514', null, 'un rejet sans motif est refusé');
select lives_ok($$ update public.place_submissions set status = 'rejected', rejection_reason = 'Doublon',
  moderator_id = auth.uid(), reviewed_at = now() where kind = 'new' $$, 'l''admin rejette avec un motif');

-- ---- Signalements ----
select tests.authenticate_as((select id from ctx where k = 'alice'));
select lives_ok($$ insert into public.place_reports (place_id, reason, comment)
  values ((select id from ctx where k = 'Repair café'), 'wrong_hours', 'Fermé le mardi') $$,
  'alice signale un lieu');
select throws_ok($$ insert into public.place_reports (place_id, reason)
  values ((select id from ctx where k = 'Brouillon'), 'closed') $$,
  '42501', null, 'on ne signale pas un lieu non publié');
select tests.as_postgres();
select ok((select needs_recheck from public.places where id = (select id from ctx where k = 'Repair café')),
  'le signalement marque le lieu à revérifier');

select tests.authenticate_as((select id from ctx where k = 'bob'));
select is_empty('select 1 from public.place_reports', 'bob ne voit pas le signalement d''alice');
select tests.authenticate_as((select id from ctx where k = 'alice'));
select is((select count(*)::int from public.place_reports), 1, 'alice voit son signalement');
select is_empty($$ update public.place_reports set status = 'resolved' returning id $$,
  'alice ne clôt pas elle-même un signalement');
select tests.authenticate_as((select id from ctx where k = 'admin'));
select lives_ok($$ update public.place_reports set status = 'resolved', resolved_by = auth.uid() $$,
  'l''admin traite le signalement');

-- ---- Confirmations ----
select tests.authenticate_as((select id from ctx where k = 'alice'));
insert into public.place_confirmations (place_id) values ((select id from ctx where k = 'Repair café'));
select throws_ok($$ insert into public.place_confirmations (place_id) values ((select id from ctx where k = 'Repair café')) $$,
  '23505', null, 'une seule confirmation par personne et par lieu');
select tests.authenticate_as((select id from ctx where k = 'bob'));
insert into public.place_confirmations (place_id) values ((select id from ctx where k = 'Repair café'));
select tests.as_postgres();
select results_eq(
  $$ select status::text, needs_recheck, last_verified_at = now() from public.places where id = (select id from ctx where k = 'Repair café') $$,
  $$ values ('community', false, true) $$,
  '2 confirmations : date rafraîchie, plus à revérifier, toujours community'
);
select tests.authenticate_as((select id from ctx where k = 'carol'));
insert into public.place_confirmations (place_id) values ((select id from ctx where k = 'Repair café'));
select is((select count(*)::int from public.place_confirmations), 1, 'carol ne voit que sa confirmation');
select tests.as_postgres();
select is((select status::text from public.places where id = (select id from ctx where k = 'Repair café')),
  'multi_confirmed', '3 confirmations : le lieu passe multi_confirmed');

select * from finish();
rollback;
