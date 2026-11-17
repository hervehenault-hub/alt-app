-- T2.1 — extensions et recherche française insensible aux accents.
begin;
select plan(10);

select has_extension('extensions', 'postgis', 'PostGIS est installé');
select has_extension('extensions', 'pg_trgm', 'pg_trgm est installé');
select has_extension('extensions', 'unaccent', 'unaccent est installé');
select has_extension('pg_catalog', 'pg_cron', 'pg_cron est installé');

select is(extensions.unaccent('Réparation éco-conçue à Bègles'), 'Reparation eco-concue a Begles',
  'unaccent retire les accents');
select is(public.immutable_unaccent('Épicerie où l''on pèse'), 'Epicerie ou l''on pese',
  'immutable_unaccent retire les accents');
select is(public.normalize_search_text('  Grille-Pain   ÉLECTRIQUE ! '), 'grille pain electrique',
  'normalize_search_text : minuscules, sans accents ni tirets');

select ok(
  to_tsvector('public.fr_unaccent', 'Atelier de réparations électriques')
    @@ plainto_tsquery('public.fr_unaccent', 'reparation electrique'),
  'fr_unaccent : « reparation electrique » trouve « réparations électriques »'
);
select ok(
  to_tsvector('public.fr_unaccent', 'grille-pain en panne') @@ plainto_tsquery('public.fr_unaccent', 'grille pain'),
  'fr_unaccent : « grille pain » trouve « grille-pain »'
);
select is(
  (select provolatile from pg_proc where oid = 'public.immutable_unaccent(text)'::regprocedure),
  'i'::"char",
  'immutable_unaccent est IMMUTABLE (indexable)'
);

select * from finish();
rollback;
