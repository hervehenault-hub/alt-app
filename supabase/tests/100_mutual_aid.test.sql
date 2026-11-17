-- T2.10 — entraide : règles acceptées, blocages, conversations privées, annonces expirées/masquées.
begin;
\ir _lib/helpers.psql
select plan(33);

create temporary table ctx (k text primary key, id uuid);
insert into ctx values
  ('alice', tests.create_user('alice@example.test')),   -- autrice d'annonces, règles acceptées
  ('bob', tests.create_user('bob@example.test')),       -- répond, règles acceptées
  ('carol', tests.create_user('carol@example.test')),   -- n'a pas accepté les règles
  ('dan', tests.create_user('dan@example.test')),       -- bloqué par alice
  ('admin', tests.create_user('admin@example.test', 'admin'));
with n as (
  insert into public.neighborhoods (city_id, name, slug)
  values ((select id from public.cities where slug = 'bordeaux'), 'Quartier test', 'quartier-test') returning id
)
insert into ctx select 'quartier', id from n;
grant select, insert on ctx to anon, authenticated;

insert into public.community_rules_acceptances (user_id, version)
select id, 'v1' from ctx where k in ('alice', 'bob', 'dan', 'admin');

-- ---- Aucune adresse exacte ----
select hasnt_column('public', 'help_posts', 'address', 'help_posts n''a pas de colonne address');
select hasnt_column('public', 'help_posts', 'location', 'help_posts n''a pas de colonne location');
select is_empty($$
  select table_name, column_name from information_schema.columns
  where table_schema = 'public'
    and table_name in ('neighborhoods', 'help_posts', 'conversations', 'messages', 'user_blocks',
                       'content_reports', 'thanks', 'community_rules_acceptances')
    and (column_name ~ '(address|adresse|street|rue|location|latitude|longitude|lat|lng|point)')
$$, 'aucune colonne d''adresse ou de position exacte dans l''entraide');
select fk_ok('public', 'profiles', 'neighborhood_id', 'public', 'neighborhoods', 'id',
  'profiles.neighborhood_id référence neighborhoods');

-- ---- Publier exige les règles en vigueur ----
select is(public.current_community_rules_version(), 'v1', 'version des règles en vigueur : v1');

select tests.authenticate_as((select id from ctx where k = 'carol'));
select ok(not public.has_accepted_community_rules(), 'carol n''a pas accepté les règles');
select throws_ok($$ insert into public.help_posts (type, service, title, description, neighborhood_id)
  values ('request', 'carpool', 'Covoit', 'Vers le marché', (select id from ctx where k = 'quartier')) $$,
  '42501', null, 'sans règles acceptées, carol ne publie pas');
select throws_ok($$ insert into public.community_rules_acceptances (version) values ('v0') $$,
  '23503', null, 'on n''accepte pas une version inexistante');

select tests.authenticate_as((select id from ctx where k = 'alice'));
select lives_ok($$ insert into public.help_posts (type, service, title, description, neighborhood_id) values
  ('offer', 'repair_help', 'Je répare vos vélos', 'Le samedi matin', (select id from ctx where k = 'quartier')),
  ('offer', 'tool_sharing', 'Prête perceuse', 'Sur demande', (select id from ctx where k = 'quartier')) $$,
  'alice (règles acceptées) publie deux annonces');
select throws_ok($$ insert into public.help_posts (type, service, title, description, neighborhood_id)
  values ('offer', 'childcare', 'Garde', repeat('x', 501), (select id from ctx where k = 'quartier')) $$,
  '23514', null, 'description de plus de 500 caractères refusée');
select throws_ok($$ insert into public.help_posts (type, service, title, description, neighborhood_id, expires_at)
  values ('offer', 'childcare', 'Garde', 'Le mercredi', (select id from ctx where k = 'quartier'), now() + interval '31 days') $$,
  '23514', null, 'une expiration au-delà de 30 jours est refusée');
select throws_ok($$ insert into public.help_posts (type, service, title, description, neighborhood_id, status)
  values ('offer', 'childcare', 'Garde', 'x', (select id from ctx where k = 'quartier'), 'hidden') $$,
  '42501', null, 'une annonce est créée ouverte');
insert into ctx select 'post_velo', id from public.help_posts where title = 'Je répare vos vélos';
insert into ctx select 'post_perceuse', id from public.help_posts where title = 'Prête perceuse';

-- Annonces expirée et masquée (préparées par le serveur)
select tests.as_postgres();
insert into public.help_posts (author_id, type, service, title, description, neighborhood_id, created_at, expires_at)
values ((select id from ctx where k = 'alice'), 'offer', 'carpool', 'Expirée', 'x', (select id from ctx where k = 'quartier'),
        now() - interval '40 days', now() - interval '10 days');
insert into public.help_posts (author_id, type, service, title, description, neighborhood_id, status)
values ((select id from ctx where k = 'alice'), 'offer', 'carpool', 'Masquée', 'x', (select id from ctx where k = 'quartier'), 'hidden');

-- ---- Liste ----
select tests.authenticate_as((select id from ctx where k = 'bob'));
select set_eq($$ select title from public.help_posts where neighborhood_id = (select id from ctx where k = 'quartier') $$, array['Je répare vos vélos', 'Prête perceuse'],
  'bob ne voit que les annonces actives (ni expirée, ni masquée)');
select tests.as_anon();
select is_empty('select 1 from public.help_posts', 'un anonyme ne voit aucune annonce');
select tests.authenticate_as((select id from ctx where k = 'alice'));
select is((select count(*)::int from public.help_posts where author_id = auth.uid()), 4, 'alice voit toutes ses annonces');
select throws_ok($$ update public.help_posts set status = 'open' where title = 'Masquée' $$,
  '42501', null, 'alice ne démasque pas une annonce masquée par la modération');
select is_empty($$ update public.help_posts set title = 'Piraté' where author_id <> auth.uid() returning id $$,
  'alice ne modifie que ses annonces');

-- ---- Conversations ----
select tests.authenticate_as((select id from ctx where k = 'bob'));
select lives_ok($$ insert into public.conversations (post_id, recipient_id)
  values ((select id from ctx where k = 'post_velo'), (select id from ctx where k = 'alice')) $$,
  'bob ouvre une conversation sur l''annonce d''alice');
select throws_ok($$ insert into public.conversations (post_id, recipient_id)
  values ((select id from ctx where k = 'post_perceuse'), (select id from ctx where k = 'carol')) $$,
  '42501', null, 'le destinataire doit être l''auteur de l''annonce');
insert into ctx select 'conv', id from public.conversations;
select lives_ok($$ insert into public.messages (conversation_id, body)
  values ((select id from ctx where k = 'conv'), 'Bonjour, mon vélo a un pneu crevé') $$, 'bob écrit à alice');
select tests.authenticate_as((select id from ctx where k = 'alice'));
select lives_ok($$ insert into public.messages (conversation_id, body)
  values ((select id from ctx where k = 'conv'), 'Avec plaisir, samedi ?') $$, 'alice répond');
select is((select count(*)::int from public.messages), 2, 'alice lit les messages de la conversation');

select tests.authenticate_as((select id from ctx where k = 'carol'));
select is_empty('select 1 from public.conversations', 'carol (tierce) ne voit pas la conversation');
select is_empty('select 1 from public.messages', 'carol ne lit pas les messages');
select throws_ok($$ insert into public.messages (conversation_id, body) values ((select id from ctx where k = 'conv'), 'Intrusion') $$,
  '42501', null, 'carol n''écrit pas dans la conversation des autres');
select tests.authenticate_as((select id from ctx where k = 'admin'));
select is_empty('select 1 from public.messages', 'même un admin ne lit pas les messages privés');

-- ---- Blocage : alice bloque dan ----
select tests.authenticate_as((select id from ctx where k = 'dan'));
insert into public.conversations (post_id, recipient_id)
values ((select id from ctx where k = 'post_perceuse'), (select id from ctx where k = 'alice'));
insert into ctx select 'conv_dan', id from public.conversations;
select tests.authenticate_as((select id from ctx where k = 'alice'));
insert into public.user_blocks (blocked_id) values ((select id from ctx where k = 'dan'));
select tests.authenticate_as((select id from ctx where k = 'dan'));
select is_empty('select 1 from public.user_blocks', 'dan ne voit pas qu''alice l''a bloqué');
select throws_ok($$ insert into public.messages (conversation_id, body) values ((select id from ctx where k = 'conv_dan'), 'Coucou') $$,
  '42501', null, 'dan (bloqué) ne peut plus écrire à alice');
select is_empty($$ select 1 from public.help_posts where author_id = (select id from ctx where k = 'alice') $$,
  'dan ne voit plus les annonces d''alice');
select throws_ok($$ insert into public.conversations (post_id, recipient_id)
  values ((select id from ctx where k = 'post_velo'), (select id from ctx where k = 'alice')) $$,
  '42501', null, 'dan ne peut pas ouvrir de nouvelle conversation avec alice');

-- ---- Remerciements et signalements ----
select tests.authenticate_as((select id from ctx where k = 'bob'));
select lives_ok($$ insert into public.thanks (to_user, post_id)
  values ((select id from ctx where k = 'alice'), (select id from ctx where k = 'post_velo')) $$,
  'bob remercie alice après leur échange');
select throws_ok($$ insert into public.thanks (to_user, post_id)
  values ((select id from ctx where k = 'carol'), (select id from ctx where k = 'post_velo')) $$,
  '42501', null, 'on ne remercie pas quelqu''un sans échange');
select lives_ok($$ insert into public.content_reports (target_type, target_id, reason)
  values ('post', (select id from ctx where k = 'post_perceuse'), 'spam') $$, 'bob signale une annonce');

select * from finish();
rollback;
