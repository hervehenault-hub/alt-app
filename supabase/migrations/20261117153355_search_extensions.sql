-- T2.1 — Extensions et recherche plein texte française insensible aux accents.
--
-- postgis  : déjà activée par le lot 0 (migration enable_extensions) ; le « if not exists » le vérifie.
-- pg_trgm  : recherche floue (trigrammes) sur les noms de lieux et les besoins.
-- unaccent : suppression des accents (« réparation » = « reparation »).
-- pg_cron  : tâches planifiées (rappels, expiration des annonces…) ; crée le schéma « cron ».

create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- unaccent() n'est pas IMMUTABLE (le dictionnaire peut changer), ce qui interdit son usage dans
-- un index ou une colonne générée. On l'enveloppe en nommant explicitement le dictionnaire.
create or replace function public.immutable_unaccent(value text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, value)
$$;

comment on function public.immutable_unaccent(text) is
  'unaccent() figé (IMMUTABLE) : utilisable dans les index et colonnes générées.';

-- Normalisation d'un texte de recherche : minuscules, sans accents, tirets et apostrophes
-- remplacés par des espaces, espaces multiples réduits. « Grille-Pain » → « grille pain ».
create or replace function public.normalize_search_text(value text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select btrim(
    regexp_replace(
      regexp_replace(lower(public.immutable_unaccent(value)), '[-''’_/.,;:!?()]+', ' ', 'g'),
      '\s+', ' ', 'g'
    )
  )
$$;

comment on function public.normalize_search_text(text) is
  'Minuscules, sans accents ni ponctuation : base commune des recherches (trigrammes).';

-- Configuration plein texte « fr_unaccent » : analyse française (racinisation) après suppression
-- des accents. to_tsvector('public.fr_unaccent', 'Réparations') = to_tsvector(…, 'reparation').
create text search configuration public.fr_unaccent (copy = pg_catalog.french);

alter text search configuration public.fr_unaccent
  alter mapping for hword, hword_part, word
  with extensions.unaccent, french_stem;

comment on text search configuration public.fr_unaccent is
  'Français (racinisation) insensible aux accents.';
