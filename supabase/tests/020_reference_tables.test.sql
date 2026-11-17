-- T2.2 — référentiels (villes, domaines, catégories, besoins) et recherche de besoins.
begin;
\ir _lib/helpers.psql
select plan(19);

select has_table('public', 'cities', 'table cities');
select has_table('public', 'domains', 'table domains');
select has_table('public', 'categories', 'table categories');
select has_table('public', 'needs', 'table needs');
select has_table('public', 'need_categories', 'table need_categories');

-- Données de référence
select is((select timezone from public.cities where slug = 'bordeaux'), 'Europe/Paris', 'Bordeaux existe, fuseau Europe/Paris');
select ok(
  (select extensions.st_covers(bbox, extensions.st_setsrid(extensions.st_makepoint(-0.5736, 44.8412), 4326))
   from public.cities where slug = 'bordeaux'),
  'l''emprise de Bordeaux contient la place de la Bourse'
);
select set_eq('select id from public.domains',
  array['alimentation', 'quotidien_dechets', 'reparation_reemploi'], '3 domaines');
select set_eq('select id from public.categories',
  array['vrac', 'producteurs', 'anti_gaspi', 'reparation', 'ressourcerie', 'collecte'], '6 catégories');
select is((select domain_id from public.categories where id = 'reparation'), 'reparation_reemploi',
  'reparation est rattachée à reparation_reemploi');
select cmp_ok((select count(*)::int from public.needs), '>=', 25, 'au moins 25 besoins de départ');
select is_empty(
  'select id from public.needs n where not exists (select 1 from public.need_categories nc where nc.need_id = n.id)',
  'chaque besoin mène à au moins une catégorie'
);

-- Recherche : sans tiret, sans accent, avec majuscules ou petite faute
select ok((select 'reparation' = any (category_ids) from public.search_needs('grille pain') limit 1),
  '« grille pain » (sans tiret) renvoie la catégorie reparation');
select is((select need_id from public.search_needs('GRILLE-PAIN') limit 1), 'grille-pain-en-panne',
  '« GRILLE-PAIN » trouve le besoin grille-pain');
select ok((select 'reparation' = any (category_ids) from public.search_needs('telephone casse') limit 1),
  '« telephone casse » (sans accents) renvoie reparation');
select ok((select 'reparation' = any (category_ids) from public.search_needs('vetement troué') limit 1),
  '« vetement troué » renvoie reparation');
select ok((select 'collecte' = any (category_ids) from public.search_needs('epluchures') limit 1),
  '« epluchures » renvoie collecte');
select is_empty($$ select * from public.search_needs('   ') $$, 'une recherche vide ne renvoie rien');

-- RLS : un anonyme lit les référentiels mais ne les modifie pas
select tests.as_anon();
select throws_ok($$ insert into public.categories (id, domain_id, label) values ('pirate', 'alimentation', 'x') $$,
  '42501', null, 'un anonyme ne peut pas créer de catégorie');

select * from finish();
rollback;
