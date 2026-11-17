-- Test trivial : vérifie que pgTAP tourne et que les extensions de base sont présentes.
begin;
select plan(3);

select ok(true, 'pgTAP fonctionne');
select has_extension('extensions', 'postgis', 'PostGIS est installé dans le schéma extensions');
select has_schema('public', 'Le schéma public existe');

select * from finish();
rollback;
