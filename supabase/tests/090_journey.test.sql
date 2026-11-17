-- T2.9 — parcours : actions (lecture publique), user_actions et user_journeys (chacun ses lignes).
begin;
\ir _lib/helpers.psql
select plan(15);

create temporary table ctx (k text primary key, id uuid);
insert into ctx values
  ('alice', tests.create_user('alice@example.test')),
  ('bob', tests.create_user('bob@example.test')),
  ('admin', tests.create_user('admin@example.test', 'admin'));
grant select on ctx to anon, authenticated;

insert into public.actions (id, domain, title, body, effort, kind, saving_eur_per_occurrence, saving_basis, linked_category) values
  ('gourde-test', 'quotidien_dechets', 'Remplir sa gourde', 'Au robinet.', 'faible', 'habitude', 1, 'Bouteille 50 cl', null),
  ('stop-pub-test', 'quotidien_dechets', 'Coller un stop-pub', 'Sur la boîte.', 'faible', 'ponctuelle', 0, 'Gratuit', null);

select throws_ok($$ insert into public.actions (id, domain, title, body, effort, kind, saving_eur_per_occurrence, saving_basis)
  values ('x', 'alimentation', repeat('t', 71), 'b', 'faible', 'habitude', 0, 's') $$,
  '23514', null, 'un titre de plus de 70 caractères est refusé');
select throws_ok($$ insert into public.actions (id, domain, title, body, effort, kind, saving_eur_per_occurrence, saving_basis, linked_category)
  values ('y', 'alimentation', 't', 'b', 'faible', 'habitude', 0, 's', 'inexistante') $$,
  '23503', null, 'une catégorie liée inexistante est refusée');

select tests.as_anon();
select is((select count(*)::int from public.actions where id like '%-test'), 2, 'un anonyme lit le catalogue d''actions');
select throws_ok($$ insert into public.user_actions (action_id, status) values ('gourde-test', 'done') $$,
  '42501', null, 'un anonyme n''enregistre pas d''action');

select tests.authenticate_as((select id from ctx where k = 'alice'));
select is_empty($$ update public.actions set title = 'Piraté' where id = 'gourde-test' returning id $$,
  'un utilisateur ne modifie pas le catalogue');
select lives_ok($$ insert into public.user_actions (action_id, status, occurred_at) values
  ('gourde-test', 'done', now() - interval '2 days'), ('gourde-test', 'done', now()) $$,
  'une habitude peut être faite plusieurs fois');
select lives_ok($$ insert into public.user_actions (action_id, status) values ('stop-pub-test', 'done') $$,
  'une action ponctuelle faite une fois');
select throws_ok($$ insert into public.user_actions (action_id, status) values ('stop-pub-test', 'done') $$,
  '23505', null, 'une action ponctuelle ne peut pas être faite deux fois');
select lives_ok($$ insert into public.user_actions (action_id, status) values ('stop-pub-test', 'later') $$,
  'mais on peut la repousser');
select throws_ok($$ insert into public.user_actions (user_id, action_id, status)
  values ((select id from ctx where k = 'bob'), 'gourde-test', 'done') $$,
  '42501', null, 'alice n''écrit pas dans l''historique de bob');
select lives_ok($$ insert into public.user_journeys (rhythm, current_action_id, next_at)
  values ('twice_weekly', 'gourde-test', now() + interval '3 days') $$, 'alice crée son parcours');
select is((select rhythm::text from public.user_journeys), 'twice_weekly', 'alice lit son parcours');

select tests.authenticate_as((select id from ctx where k = 'bob'));
select is_empty('select 1 from public.user_actions', 'bob ne voit pas les actions d''alice');
select is_empty('select 1 from public.user_journeys', 'bob ne voit pas le parcours d''alice');

select tests.authenticate_as((select id from ctx where k = 'admin'));
select is_empty('select 1 from public.user_actions', 'même un admin ne lit pas l''historique d''alice');

select * from finish();
rollback;
