-- T2.8 — facteurs d'impact et équivalences : source obligatoire, lecture publique.
begin;
\ir _lib/helpers.psql
select plan(11);

select col_not_null('public', 'impact_factors', 'source_url', 'impact_factors.source_url est obligatoire');
select col_not_null('public', 'equivalences', 'source_url', 'equivalences.source_url est obligatoire');

select throws_ok($$ insert into public.impact_factors (id, label, value, unit, source_name, method, uncertainty, status)
  values ('sans-source', 'Facteur sans source', 1, 'kgCO2e', 'Inconnue', 'm', 'u', 'verifie') $$,
  '23502', null, 'un facteur sans source est refusé');
select throws_ok($$ insert into public.impact_factors (id, label, value, unit, source_name, source_url, method, uncertainty, status)
  values ('source-http', 'Source non https', 1, 'kgCO2e', 'X', 'http://exemple.test', 'm', 'u', 'verifie') $$,
  '23514', null, 'une source non https est refusée');
select throws_ok($$ insert into public.impact_factors (id, label, value, unit, source_name, source_url, method, uncertainty, status)
  values ('sans-valeur', 'Sans valeur', null, 'kgCO2e', 'X', 'https://exemple.test', 'm', 'u', 'verifie') $$,
  '23514', null, 'une valeur NULL n''est permise que pour a_verifier');
select lives_ok($$ insert into public.impact_factors (id, label, value, unit, source_name, source_url, method, uncertainty, version, retrieved_at, status)
  values ('repas-test', 'Repas test', 0.61, 'kgCO2e évités par repas', 'ADEME', 'https://exemple.test/repas', 'diff', 'moyenne', 'v1', '2026-11-17', 'verifie_code_source') $$,
  'un facteur sourcé est accepté');
select lives_ok($$ insert into public.equivalences (id, label, value, unit, source_name, source_url, method, uncertainty, status)
  values ('eq-douche-test', 'Douche', null, 'kgCO2e par douche', 'ADEME', 'https://exemple.test', 'à calculer', 'non déterminée', 'a_verifier') $$,
  'une équivalence à vérifier sans valeur est acceptée');
select throws_ok($$ insert into public.equivalences (id, label, value, unit, source_name, method, uncertainty)
  values ('eq-sans-source', 'X', 1, 'u', 'X', 'm', 'u') $$,
  '23502', null, 'une équivalence sans source est refusée');
select throws_ok($$ insert into public.equivalences (id, label, value, unit, source_name, source_url, method, uncertainty)
  values ('km-voiture', 'X', 1, 'u', 'X', 'https://exemple.test', 'm', 'u') $$,
  '23514', null, 'une équivalence doit commencer par eq-');

select tests.as_anon();
select is((select count(*)::int from public.impact_factors where id = 'repas-test'), 1, 'un anonyme lit les facteurs');
select throws_ok($$ insert into public.equivalences (id, label, value, unit, source_name, source_url, method, uncertainty)
  values ('eq-pirate', 'X', 1, 'u', 'X', 'https://exemple.test', 'm', 'u') $$,
  '42501', null, 'un anonyme n''écrit pas d''équivalence');

select * from finish();
rollback;
