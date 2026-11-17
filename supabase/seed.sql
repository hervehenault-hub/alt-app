-- Données de test LOCALES (chargées par `pnpm db:reset` / `supabase start`) — jamais en production.
--
-- Contenu :
-- - Testville, ville fictive (en plus de Bordeaux, créée par les migrations) ;
-- - 3 quartiers de Testville ;
-- - 40 lieux fictifs répartis sur les 6 catégories, horaires variés, dont 4 non publiés et
--   plusieurs « à revérifier » ;
-- - 5 comptes de test (mot de passe commun : « alt-test-local », comptes fictifs) :
--     usager1@alt.test, usager2@alt.test, usager3@alt.test (rôle user),
--     commercant@alt.test (merchant, lié au lieu « Épicerie Vrac du Centre »),
--     admin@alt.test (admin).
-- Les identifiants sont fixes : les tests et l'app locale peuvent s'appuyer dessus.

-- ---------------------------------------------------------------------------------------------
-- Ville et quartiers
-- ---------------------------------------------------------------------------------------------
insert into public.cities (id, slug, name, timezone, center, bbox) values (
  '7e570000-0000-4000-8000-00000000c171', 'testville', 'Testville', 'Europe/Paris',
  extensions.st_setsrid(extensions.st_makepoint(1.20, 45.20), 4326)::extensions.geography,
  extensions.st_makeenvelope(1.15, 45.15, 1.25, 45.25, 4326)
);

insert into public.neighborhoods (id, city_id, name, slug, geom) values
  ('7e570000-0000-4000-8000-0000000000a1', '7e570000-0000-4000-8000-00000000c171', 'Centre', 'centre',
   extensions.st_multi(extensions.st_makeenvelope(1.18, 45.18, 1.22, 45.22, 4326))),
  ('7e570000-0000-4000-8000-0000000000a2', '7e570000-0000-4000-8000-00000000c171', 'Les Rives', 'les-rives',
   extensions.st_multi(extensions.st_makeenvelope(1.15, 45.15, 1.18, 45.25, 4326))),
  ('7e570000-0000-4000-8000-0000000000a3', '7e570000-0000-4000-8000-00000000c171', 'Le Plateau', 'le-plateau',
   extensions.st_multi(extensions.st_makeenvelope(1.22, 45.15, 1.25, 45.25, 4326)));

-- ---------------------------------------------------------------------------------------------
-- Comptes de test (le déclencheur on_auth_user_created crée les profils)
-- ---------------------------------------------------------------------------------------------
with seed_users (id, email, display_name) as (
  values
    ('7e570000-0000-4000-8000-000000000001'::uuid, 'usager1@alt.test', 'Camille'),
    ('7e570000-0000-4000-8000-000000000002'::uuid, 'usager2@alt.test', 'Sacha'),
    ('7e570000-0000-4000-8000-000000000003'::uuid, 'usager3@alt.test', 'Noa'),
    ('7e570000-0000-4000-8000-000000000004'::uuid, 'commercant@alt.test', 'Épicerie du Centre'),
    ('7e570000-0000-4000-8000-000000000005'::uuid, 'admin@alt.test', 'Admin Alt')
)
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
       extensions.crypt('alt-test-local', extensions.gen_salt('bf')), now(),
       '{"provider": "email", "providers": ["email"]}', jsonb_build_object('display_name', display_name),
       now(), now(), '', '', '', ''
from seed_users;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
from auth.users u
where u.email like '%@alt.test';

update public.profiles p set
  city_id = '7e570000-0000-4000-8000-00000000c171',
  neighborhood_id = v.neighborhood_id::uuid,
  role = v.role::public.user_role,
  interests = v.interests::text[],
  main_constraint = v.main_constraint::public.main_constraint
from (values
  ('7e570000-0000-4000-8000-000000000001', '7e570000-0000-4000-8000-0000000000a1', 'user', '{alimentation,reparation_reemploi}', 'budget'),
  ('7e570000-0000-4000-8000-000000000002', '7e570000-0000-4000-8000-0000000000a2', 'user', '{quotidien_dechets}', 'temps'),
  ('7e570000-0000-4000-8000-000000000003', '7e570000-0000-4000-8000-0000000000a3', 'user', '{}', null),
  ('7e570000-0000-4000-8000-000000000004', '7e570000-0000-4000-8000-0000000000a1', 'merchant', '{}', null),
  ('7e570000-0000-4000-8000-000000000005', null, 'admin', '{}', null)
) as v(id, neighborhood_id, role, interests, main_constraint)
where p.id = v.id::uuid;

-- ---------------------------------------------------------------------------------------------
-- 40 lieux fictifs (identifiants déterministes : md5('testville-place-<n>'))
-- ---------------------------------------------------------------------------------------------
with names (n, category_id, name, price_hint, is_free) as (
  values
    (1, 'vrac', 'Épicerie Vrac du Centre', 'Prix au kilo', false),
    (2, 'vrac', 'Le Bocal Testvillois', 'Prix au kilo', false),
    (3, 'vrac', 'Rayon vrac de la Coop', 'Prix au kilo', false),
    (4, 'vrac', 'La Pesée', 'Prix au kilo', false),
    (5, 'vrac', 'Droguerie à la tireuse', '2 à 6 € le litre', false),
    (6, 'vrac', 'Fontaine à eau du parc', 'Gratuit', true),
    (7, 'vrac', 'Épicerie du Plateau', 'Prix au kilo', false),
    (8, 'producteurs', 'Marché des producteurs du samedi', null, false),
    (9, 'producteurs', 'Ferme des Trois Chênes', 'Panier 10 à 20 €', false),
    (10, 'producteurs', 'AMAP des Rives', 'Panier 15 €', false),
    (11, 'producteurs', 'Fromagerie fermière', null, false),
    (12, 'producteurs', 'Maraîcher du Plateau', null, false),
    (13, 'producteurs', 'Drive fermier', null, false),
    (14, 'producteurs', 'Verger partagé', 'Prix libre', false),
    (15, 'anti_gaspi', 'Boulangerie — paniers du soir', 'Panier 3 à 5 €', false),
    (16, 'anti_gaspi', 'Épicerie solidaire', 'Sur conditions', false),
    (17, 'anti_gaspi', 'Frigo solidaire du centre social', 'Gratuit', true),
    (18, 'anti_gaspi', 'Rayon dates courtes', '-30 à -50 %', false),
    (19, 'anti_gaspi', 'Glanage du marché', 'Gratuit', true),
    (20, 'anti_gaspi', 'Cantine anti-gaspi', 'Repas 5 €', false),
    (21, 'reparation', 'Repair café des Rives', 'Prix libre', false),
    (22, 'reparation', 'Cordonnerie du Centre', 'Ressemelage 30 à 50 €', false),
    (23, 'reparation', 'Atelier vélo participatif', 'Adhésion 10 €/an', false),
    (24, 'reparation', 'Retouches et couture', 'Ourlet 10 €', false),
    (25, 'reparation', 'Réparateur de téléphones', 'Écran 60 à 120 €', false),
    (26, 'reparation', 'Outilthèque', 'Adhésion 5 €/an', false),
    (27, 'reparation', 'Réparation électroménager', 'Devis gratuit', false),
    (28, 'reparation', 'Repair café du Plateau', 'Prix libre', false),
    (29, 'ressourcerie', 'Ressourcerie La Seconde Vie', 'Petits prix', false),
    (30, 'ressourcerie', 'Friperie solidaire', 'Vêtements 2 à 10 €', false),
    (31, 'ressourcerie', 'Bouquinerie d''occasion', 'Livres 1 à 5 €', false),
    (32, 'ressourcerie', 'Recyclerie sportive', 'Petits prix', false),
    (33, 'ressourcerie', 'Boîte à dons', 'Gratuit', true),
    (34, 'ressourcerie', 'Vide-grenier permanent', 'Petits prix', false),
    (35, 'collecte', 'Composteur de quartier', 'Gratuit', true),
    (36, 'collecte', 'Borne textile de la place', 'Gratuit', true),
    (37, 'collecte', 'Point piles et ampoules', 'Gratuit', true),
    (38, 'collecte', 'Déchetterie de Testville', 'Gratuit', true),
    (39, 'collecte', 'Collecte de bouchons', 'Gratuit', true),
    (40, 'collecte', 'Point de dépôt électroménager', 'Gratuit', true)
)
insert into public.places (
  id, city_id, category_id, name, address, location, price_hint, is_free,
  walk_accessible, transit_accessible, estimated_saving_eur, saving_basis,
  status, needs_recheck, last_verified_at, source, source_ref, license, published, created_by
)
select
  md5('testville-place-' || n)::uuid,
  '7e570000-0000-4000-8000-00000000c171',
  category_id,
  name,
  n || ' rue Fictive, Testville',
  extensions.st_setsrid(extensions.st_makepoint(1.155 + (n * 0.0137) % 0.09, 45.155 + (n * 0.0071) % 0.09), 4326)::extensions.geography,
  price_hint,
  is_free,
  n % 2 = 0,
  n % 3 <> 0,
  case when category_id in ('reparation', 'ressourcerie') and not is_free then 10 + n end,
  case when category_id in ('reparation', 'ressourcerie') and not is_free
       then 'Estimation fictive pour les tests (achat neuf évité).' end,
  (array['community', 'multi_confirmed', 'merchant_confirmed'])[1 + n % 3]::public.place_status,
  n % 7 = 0,                                   -- 5 lieux « à revérifier »
  now() - make_interval(days => n * 9),
  (array['manual', 'osm', 'open_data', 'user'])[1 + n % 4]::public.place_source,
  case when n % 4 in (1, 2) then 'testville/' || n end,
  case n % 4 when 1 then 'ODbL 1.0' when 2 then 'Licence Ouverte 2.0' end,
  n % 10 <> 0,                                 -- 4 lieux non publiés (10, 20, 30, 40)
  case when n % 4 = 3 then '7e570000-0000-4000-8000-000000000002'::uuid end
from names;

-- Horaires (5 modèles selon le numéro du lieu ; modèle 4 = aucun horaire connu)
insert into public.opening_hours (place_id, weekday, opens, closes)
select md5('testville-place-' || n)::uuid, d, o::time, c::time
from generate_series(1, 40) n
cross join lateral (
  -- 0 : commerce classique, lundi→samedi avec pause de midi
  select d, o, c from generate_series(1, 6) d, (values ('09:00', '12:30'), ('14:00', '19:00')) h(o, c) where n % 5 = 0
  union all
  -- 1 : mardi→dimanche en continu
  select d, '08:00', '20:00' from generate_series(2, 7) d where n % 5 = 1
  union all
  -- 2 : soirées, dont créneaux qui finissent après minuit
  select d, o, c from (values (3, '18:00', '23:00'), (5, '22:00', '02:00'), (6, '22:00', '03:00')) s(d, o, c) where n % 5 = 2
  union all
  -- 3 : ouvert 24 h/24, 7 j/7
  select d, '00:00', '24:00' from generate_series(1, 7) d where n % 5 = 3
) slots;

-- Le commerçant est lié à l'Épicerie Vrac du Centre (lieu n° 1)
insert into public.place_owners (user_id, place_id, created_by)
values ('7e570000-0000-4000-8000-000000000004', md5('testville-place-1')::uuid, '7e570000-0000-4000-8000-000000000005');

-- ---------------------------------------------------------------------------------------------
-- Entraide : règles acceptées par usager1 et usager2, une annonce de chacun
-- ---------------------------------------------------------------------------------------------
insert into public.community_rules_acceptances (user_id, version) values
  ('7e570000-0000-4000-8000-000000000001', 'v1'),
  ('7e570000-0000-4000-8000-000000000002', 'v1');

insert into public.help_posts (id, author_id, type, service, title, description, neighborhood_id) values
  ('7e570000-0000-4000-8000-0000000000b1', '7e570000-0000-4000-8000-000000000001', 'offer', 'tool_sharing',
   'Je prête une perceuse', 'Disponible le week-end, à récupérer dans le quartier.', '7e570000-0000-4000-8000-0000000000a1'),
  ('7e570000-0000-4000-8000-0000000000b2', '7e570000-0000-4000-8000-000000000002', 'request', 'repair_help',
   'Aide pour réparer un vélo', 'Mon dérailleur saute, quelqu''un pour me montrer ?', '7e570000-0000-4000-8000-0000000000a2');
