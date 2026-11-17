-- T2.12 — Audit RLS : pour chaque table, lecture et écriture par les 4 profils
-- (anonyme / utilisateur / commerçant / admin). Le tableau récapitulatif est dans docs/ARCHITECTURE.md.
--
-- Chaque case de la matrice exécute une requête sous le rôle voulu :
-- - lecture  : « autorisé » = la requête renvoie au moins une ligne ;
-- - écriture : « autorisé » = l'ordre touche au moins une ligne sans erreur.
-- Les écritures sont toujours annulées (sous-transaction) : les cases sont indépendantes.
begin;
\ir _lib/helpers.psql

-- ---------------------------------------------------------------------------------------------
-- Jeu de données
-- ---------------------------------------------------------------------------------------------
create temporary table fx (k text primary key, id uuid);
insert into fx values
  ('user', tests.create_user('matrix-user@example.test')),
  ('other', tests.create_user('matrix-other@example.test')),
  ('troll', tests.create_user('matrix-troll@example.test')),
  ('merchant', tests.create_user('matrix-merchant@example.test', 'merchant')),
  ('admin', tests.create_user('matrix-admin@example.test', 'admin'));

with ins as (
  insert into public.places (city_id, category_id, name, location, source, last_verified_at, published)
  select (select id from public.cities where slug = 'bordeaux'), 'vrac', k,
         'SRID=4326;POINT(-0.57 44.84)'::extensions.geography, 'manual'::public.place_source, now(), p
  from (values ('p_pub', true), ('p_pub2', true), ('p_draft', false)) v(k, p)
  returning id, name
)
insert into fx select name, id from ins;

insert into public.opening_hours (place_id, weekday, opens, closes)
select id, 1, '09:00', '18:00' from fx where k in ('p_pub', 'p_draft');
insert into public.place_owners (user_id, place_id)
values ((select id from fx where k = 'merchant'), (select id from fx where k = 'p_pub'));

insert into public.impact_factors (id, label, value, unit, source_name, source_url, method, uncertainty, status)
values ('matrix-factor', 'Facteur', 1, 'kgCO2e', 'Source', 'https://exemple.test', 'm', 'u', 'verifie');
insert into public.equivalences (id, label, value, unit, source_name, source_url, method, uncertainty, status)
values ('eq-matrix', 'Équivalence', 1, 'kgCO2e', 'Source', 'https://exemple.test', 'm', 'u', 'verifie');
insert into public.actions (id, domain, title, body, effort, kind, saving_eur_per_occurrence, saving_basis)
values ('matrix-action', 'alimentation', 'Action', 'Corps', 'faible', 'habitude', 0, 'Base');

insert into public.place_submissions (user_id, kind, payload) values ((select id from fx where k = 'user'), 'new', '{}');
insert into public.place_reports (place_id, reporter_id, reason)
values ((select id from fx where k = 'p_pub'), (select id from fx where k = 'user'), 'other');
insert into public.place_confirmations (place_id, user_id)
values ((select id from fx where k = 'p_pub'), (select id from fx where k = 'user'));
insert into public.user_actions (user_id, action_id, status) values ((select id from fx where k = 'user'), 'matrix-action', 'done');
insert into public.user_journeys (user_id) values ((select id from fx where k = 'user'));

with n as (
  insert into public.neighborhoods (city_id, name, slug)
  values ((select id from public.cities where slug = 'bordeaux'), 'Quartier matrice', 'quartier-matrice') returning id
)
insert into fx select 'quartier', id from n;

insert into public.community_rules_versions (version, effective_at) values ('v0-matrix', '2000-01-01');
insert into public.community_rules_acceptances (user_id, version)
select id, 'v1' from fx where k in ('user', 'other', 'merchant', 'admin');

with p as (
  insert into public.help_posts (author_id, type, service, title, description, neighborhood_id, status)
  values
    ((select id from fx where k = 'user'), 'offer', 'repair_help', 'post_user', 'x', (select id from fx where k = 'quartier'), 'open'),
    ((select id from fx where k = 'other'), 'request', 'carpool', 'post_other', 'x', (select id from fx where k = 'quartier'), 'open'),
    ((select id from fx where k = 'other'), 'request', 'carpool', 'post_hidden', 'x', (select id from fx where k = 'quartier'), 'hidden')
  returning id, title
)
insert into fx select title, id from p;

with c as (
  insert into public.conversations (post_id, initiator_id, recipient_id)
  values ((select id from fx where k = 'post_other'), (select id from fx where k = 'user'), (select id from fx where k = 'other'))
  returning id
)
insert into fx select 'conv', id from c;
insert into public.messages (conversation_id, sender_id, body)
values ((select id from fx where k = 'conv'), (select id from fx where k = 'other'), 'Bonjour');
insert into public.user_blocks (blocker_id, blocked_id) values ((select id from fx where k = 'user'), (select id from fx where k = 'troll'));
insert into public.content_reports (reporter_id, target_type, target_id, reason)
values ((select id from fx where k = 'user'), 'user', (select id from fx where k = 'troll'), 'spam');
insert into public.thanks (from_user, to_user, post_id)
values ((select id from fx where k = 'other'), (select id from fx where k = 'user'), (select id from fx where k = 'post_other'));
insert into public.analytics_events (anon_id, name) values (gen_random_uuid(), 'matrix_event');

grant select on fx to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Outils
-- ---------------------------------------------------------------------------------------------
create function pg_temp.become(p_role text) returns void language plpgsql as $$
begin
  if p_role = 'anon' then
    perform tests.as_anon();
  else
    perform tests.authenticate_as((select id from fx where k = p_role));
  end if;
end;
$$;

-- Exécute p_sql sous le rôle p_role ; renvoie true si autorisé (voir en-tête). Sans effet de bord.
create function pg_temp.allowed(p_role text, p_op text, p_sql text) returns boolean language plpgsql as $$
declare
  v_count bigint;
  v_result boolean;
begin
  begin
    perform pg_temp.become(p_role);
    if p_op = 'read' then
      execute format('select count(*) from (%s) s', p_sql) into v_count;
    else
      execute p_sql;
      get diagnostics v_count = row_count;
    end if;
    raise exception using errcode = 'P0099', message = v_count::text;
  exception
    when sqlstate 'P0099' then v_result := sqlerrm::bigint > 0;
    when others then v_result := false;
  end;
  perform tests.as_postgres();
  return v_result;
end;
$$;

grant execute on all functions in schema pg_temp to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Matrice attendue : t = autorisé, f = refusé
-- ---------------------------------------------------------------------------------------------
create temporary table matrix (
  ord serial, tbl text, op text, label text, sql text,
  anon boolean, usr boolean, merchant boolean, admin boolean
);

insert into matrix (tbl, op, label, sql, anon, usr, merchant, admin) values
  -- Référentiels
  ('cities', 'read', 'lire', $$ select 1 from public.cities $$, true, true, true, true),
  ('cities', 'write', 'créer', $$ insert into public.cities (slug, name, center, bbox) values ('x', 'X', 'SRID=4326;POINT(0 0)', extensions.st_makeenvelope(-1, -1, 1, 1, 4326)) $$, false, false, false, true),
  ('domains', 'read', 'lire', $$ select 1 from public.domains $$, true, true, true, true),
  ('domains', 'write', 'modifier', $$ update public.domains set label = 'X' where id = 'alimentation' $$, false, false, false, true),
  ('categories', 'read', 'lire', $$ select 1 from public.categories $$, true, true, true, true),
  ('categories', 'write', 'créer', $$ insert into public.categories (id, domain_id, label) values ('x', 'alimentation', 'X') $$, false, false, false, true),
  ('needs', 'read', 'lire', $$ select 1 from public.needs $$, true, true, true, true),
  ('needs', 'read', 'rechercher (search_needs)', $$ select 1 from public.search_needs('grille pain') $$, true, true, true, true),
  ('needs', 'write', 'créer', $$ insert into public.needs (id, label) values ('x', 'X') $$, false, false, false, true),
  ('need_categories', 'read', 'lire', $$ select 1 from public.need_categories $$, true, true, true, true),
  ('need_categories', 'write', 'supprimer', $$ delete from public.need_categories where need_id = 'gourde' $$, false, false, false, true),
  -- Lieux
  ('places', 'read', 'lire un lieu publié', $$ select 1 from public.places where id = (select id from fx where k = 'p_pub') $$, true, true, true, true),
  ('places', 'read', 'lire un lieu non publié', $$ select 1 from public.places where id = (select id from fx where k = 'p_draft') $$, false, false, false, true),
  ('places', 'write', 'créer', $$ insert into public.places (city_id, category_id, name, location, source, last_verified_at) values ((select id from public.cities where slug = 'bordeaux'), 'vrac', 'X', 'SRID=4326;POINT(-0.57 44.84)', 'manual', now()) $$, false, false, false, true),
  ('places', 'write', 'modifier le lieu du commerçant', $$ update public.places set price_hint = 'X' where id = (select id from fx where k = 'p_pub') $$, false, false, true, true),
  ('places', 'write', 'modifier un autre lieu', $$ update public.places set price_hint = 'X' where id = (select id from fx where k = 'p_pub2') $$, false, false, false, true),
  ('places', 'write', 'supprimer', $$ delete from public.places where id = (select id from fx where k = 'p_pub2') $$, false, false, false, true),
  ('opening_hours', 'read', 'lire (lieu publié)', $$ select 1 from public.opening_hours where place_id = (select id from fx where k = 'p_pub') $$, true, true, true, true),
  ('opening_hours', 'read', 'lire (lieu non publié)', $$ select 1 from public.opening_hours where place_id = (select id from fx where k = 'p_draft') $$, false, false, false, true),
  ('opening_hours', 'write', 'ajouter (lieu du commerçant)', $$ insert into public.opening_hours (place_id, weekday, opens, closes) values ((select id from fx where k = 'p_pub'), 2, '09:00', '18:00') $$, false, false, true, true),
  ('opening_hours', 'write', 'ajouter (autre lieu)', $$ insert into public.opening_hours (place_id, weekday, opens, closes) values ((select id from fx where k = 'p_pub2'), 2, '09:00', '18:00') $$, false, false, false, true),
  ('place_owners', 'read', 'lire le lien du commerçant', $$ select 1 from public.place_owners $$, false, false, true, true),
  ('place_owners', 'write', 'créer un lien', $$ insert into public.place_owners (user_id, place_id) values ((select id from fx where k = 'merchant'), (select id from fx where k = 'p_pub2')) $$, false, false, false, true),
  ('place_owners', 'write', 'supprimer un lien', $$ delete from public.place_owners $$, false, false, false, true),
  -- Profils
  ('profiles', 'read', 'lire le profil de l''utilisateur', $$ select 1 from public.profiles where id = (select id from fx where k = 'user') $$, false, true, false, true),
  ('profiles', 'write', 'modifier le profil de l''utilisateur', $$ update public.profiles set display_name = 'X' where id = (select id from fx where k = 'user') $$, false, true, false, true),
  ('profiles', 'write', 'changer le rôle de l''utilisateur', $$ update public.profiles set role = 'admin' where id = (select id from fx where k = 'user') $$, false, false, false, true),
  -- Contributions
  ('place_submissions', 'read', 'lire la proposition de l''utilisateur', $$ select 1 from public.place_submissions $$, false, true, false, true),
  ('place_submissions', 'write', 'proposer', $$ insert into public.place_submissions (kind, payload) values ('new', '{}') $$, false, true, true, true),
  ('place_submissions', 'write', 'modérer', $$ update public.place_submissions set status = 'approved' $$, false, false, false, true),
  ('place_reports', 'read', 'lire le signalement de l''utilisateur', $$ select 1 from public.place_reports $$, false, true, false, true),
  ('place_reports', 'write', 'signaler', $$ insert into public.place_reports (place_id, reason) values ((select id from fx where k = 'p_pub2'), 'closed') $$, false, true, true, true),
  ('place_reports', 'write', 'traiter', $$ update public.place_reports set status = 'resolved' $$, false, false, false, true),
  ('place_confirmations', 'read', 'lire la confirmation de l''utilisateur', $$ select 1 from public.place_confirmations $$, false, true, false, true),
  ('place_confirmations', 'write', 'confirmer un lieu publié', $$ insert into public.place_confirmations (place_id) values ((select id from fx where k = 'p_pub2')) $$, false, true, true, true),
  -- Impact
  ('impact_factors', 'read', 'lire', $$ select 1 from public.impact_factors $$, true, true, true, true),
  ('impact_factors', 'write', 'modifier', $$ update public.impact_factors set label = 'X' $$, false, false, false, true),
  ('equivalences', 'read', 'lire', $$ select 1 from public.equivalences $$, true, true, true, true),
  ('equivalences', 'write', 'modifier', $$ update public.equivalences set label = 'X' $$, false, false, false, true),
  -- Parcours
  ('actions', 'read', 'lire', $$ select 1 from public.actions $$, true, true, true, true),
  ('actions', 'write', 'modifier', $$ update public.actions set title = 'X' $$, false, false, false, true),
  ('user_actions', 'read', 'lire l''historique de l''utilisateur', $$ select 1 from public.user_actions $$, false, true, false, false),
  ('user_actions', 'write', 'enregistrer une action pour soi', $$ insert into public.user_actions (action_id, status) values ('matrix-action', 'later') $$, false, true, true, true),
  ('user_journeys', 'read', 'lire le parcours de l''utilisateur', $$ select 1 from public.user_journeys $$, false, true, false, false),
  ('user_journeys', 'write', 'modifier le parcours de l''utilisateur', $$ update public.user_journeys set rhythm = 'self_paced' where user_id = (select id from fx where k = 'user') $$, false, true, false, false),
  -- Entraide
  ('neighborhoods', 'read', 'lire', $$ select 1 from public.neighborhoods $$, true, true, true, true),
  ('neighborhoods', 'write', 'créer', $$ insert into public.neighborhoods (city_id, name, slug) values ((select id from public.cities where slug = 'bordeaux'), 'X', 'x') $$, false, false, false, true),
  ('community_rules_versions', 'read', 'lire', $$ select 1 from public.community_rules_versions $$, true, true, true, true),
  ('community_rules_versions', 'write', 'publier une version', $$ insert into public.community_rules_versions (version) values ('v9') $$, false, false, false, true),
  ('community_rules_acceptances', 'read', 'lire l''acceptation de l''utilisateur', $$ select 1 from public.community_rules_acceptances where user_id = (select id from fx where k = 'user') $$, false, true, false, false),
  ('community_rules_acceptances', 'write', 'accepter pour soi', $$ insert into public.community_rules_acceptances (version) values ('v0-matrix') $$, false, true, true, true),
  ('help_posts', 'read', 'lister une annonce ouverte', $$ select 1 from public.help_posts where id = (select id from fx where k = 'post_user') $$, false, true, true, true),
  ('help_posts', 'read', 'lister une annonce masquée', $$ select 1 from public.help_posts where id = (select id from fx where k = 'post_hidden') $$, false, false, false, true),
  ('help_posts', 'write', 'publier', $$ insert into public.help_posts (type, service, title, description, neighborhood_id) values ('offer', 'carpool', 'X', 'X', (select id from fx where k = 'quartier')) $$, false, true, true, true),
  ('help_posts', 'write', 'modifier l''annonce de l''utilisateur', $$ update public.help_posts set title = 'X' where id = (select id from fx where k = 'post_user') $$, false, true, false, true),
  ('conversations', 'read', 'lire la conversation utilisateur ↔ autre', $$ select 1 from public.conversations $$, false, true, false, false),
  ('conversations', 'write', 'répondre à l''annonce de l''utilisateur', $$ insert into public.conversations (post_id, recipient_id) values ((select id from fx where k = 'post_user'), (select id from fx where k = 'user')) $$, false, false, true, true),
  ('messages', 'read', 'lire les messages de la conversation', $$ select 1 from public.messages $$, false, true, false, false),
  ('messages', 'write', 'écrire dans la conversation', $$ insert into public.messages (conversation_id, body) values ((select id from fx where k = 'conv'), 'X') $$, false, true, false, false),
  ('user_blocks', 'read', 'lire le blocage de l''utilisateur', $$ select 1 from public.user_blocks $$, false, true, false, false),
  ('user_blocks', 'write', 'bloquer quelqu''un', $$ insert into public.user_blocks (blocked_id) values ((select id from fx where k = 'other')) $$, false, true, true, true),
  ('content_reports', 'read', 'lire le signalement de l''utilisateur', $$ select 1 from public.content_reports $$, false, true, false, true),
  ('content_reports', 'write', 'signaler un contenu', $$ insert into public.content_reports (target_type, target_id, reason) values ('post', (select id from fx where k = 'post_other'), 'spam') $$, false, true, true, true),
  ('content_reports', 'write', 'traiter un signalement', $$ update public.content_reports set status = 'resolved' $$, false, false, false, true),
  ('thanks', 'read', 'lire un merci reçu par l''utilisateur', $$ select 1 from public.thanks $$, false, true, false, false),
  ('thanks', 'write', 'remercier après un échange', $$ insert into public.thanks (to_user, post_id) values ((select id from fx where k = 'other'), (select id from fx where k = 'post_other')) $$, false, true, false, false),
  -- Mesure d'audience
  ('analytics_events', 'read', 'lire', $$ select 1 from public.analytics_events $$, false, false, false, false),
  ('analytics_events', 'write', 'envoyer un événement', $$ insert into public.analytics_events (anon_id, name) values (gen_random_uuid(), 'matrix_check') $$, true, true, true, true);

select plan((select count(*)::int * 4 + 1 from matrix));

-- Toutes les tables du schéma public ont la RLS activée et figurent dans la matrice.
select is_empty($$
  select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and (not c.relrowsecurity or c.relname not in (select tbl from matrix))
$$, 'toutes les tables publiques ont la RLS activée et sont couvertes par la matrice');

select is(
  pg_temp.allowed(r.role, m.op, m.sql), r.expected,
  format('%s · %s · %s → %s', m.tbl, m.label, r.role, case when r.expected then 'autorisé' else 'refusé' end)
)
from matrix m
cross join lateral (values (1, 'anon', m.anon), (2, 'user', m.usr), (3, 'merchant', m.merchant), (4, 'admin', m.admin))
  as r(ord, role, expected)
order by m.ord, r.ord;

select * from finish();
rollback;
