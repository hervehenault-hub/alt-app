-- T2.2 — Référentiels : villes, domaines, catégories, besoins (+ recherche de besoins).
-- Données de référence insérées ici (elles doivent exister en production). Lecture publique ;
-- l'écriture est réservée aux administrateurs (politiques ajoutées avec les profils, T2.5).

-- Fonction utilitaire : met à jour updated_at à chaque modification.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Villes
-- ---------------------------------------------------------------------------------------------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) between 1 and 100),
  timezone text not null default 'Europe/Paris',
  center extensions.geography(Point, 4326) not null,
  bbox extensions.geometry(Polygon, 4326) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cities_center_in_bbox check (extensions.st_covers(bbox, center::extensions.geometry))
);

comment on table public.cities is 'Villes couvertes par Alt. (emprise = rectangle englobant, centre = point par défaut de la carte).';

create trigger cities_set_updated_at before update on public.cities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Domaines et catégories (identifiants texte = ceux de content/actions.json)
-- ---------------------------------------------------------------------------------------------
create table public.domains (
  id text primary key check (id ~ '^[a-z]+(_[a-z]+)*$'),
  label text not null,
  sort_order smallint not null default 0
);

comment on table public.domains is 'Grands domaines du parcours (alimentation, quotidien & déchets, réparation & réemploi).';

create table public.categories (
  id text primary key check (id ~ '^[a-z]+(_[a-z]+)*$'),
  domain_id text not null references public.domains (id) on update cascade,
  label text not null,
  description text,
  sort_order smallint not null default 0
);

create index categories_domain_id_idx on public.categories (domain_id);

comment on table public.categories is 'Catégories de lieux, chacune rattachée à un domaine.';

-- ---------------------------------------------------------------------------------------------
-- Besoins : ce que l'utilisateur tape (« grille-pain en panne ») → catégories de lieux
-- ---------------------------------------------------------------------------------------------

-- Texte indexé d'un besoin : libellé + synonymes. array_to_string n'est que STABLE ; il est sûr
-- ici (tableau de texte), on déclare donc la fonction IMMUTABLE pour la colonne générée.
create or replace function public.need_search_document(label text, synonyms text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(label, '') || ' ' || coalesce(array_to_string(synonyms, ' '), '')
$$;

create table public.needs (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null check (length(btrim(label)) between 1 and 80),
  synonyms text[] not null default '{}',
  sort_order smallint not null default 0,
  search_tsv tsvector generated always as (
    to_tsvector('public.fr_unaccent'::regconfig, public.need_search_document(label, synonyms))
  ) stored,
  search_text text generated always as (
    public.normalize_search_text(public.need_search_document(label, synonyms))
  ) stored
);

create index needs_search_tsv_idx on public.needs using gin (search_tsv);
create index needs_search_text_trgm_idx on public.needs using gin (search_text extensions.gin_trgm_ops);

comment on table public.needs is 'Besoins exprimés en langage courant, avec synonymes, reliés à des catégories.';

create table public.need_categories (
  need_id text not null references public.needs (id) on delete cascade on update cascade,
  category_id text not null references public.categories (id) on delete cascade on update cascade,
  primary key (need_id, category_id)
);

create index need_categories_category_id_idx on public.need_categories (category_id);

-- Recherche d'un besoin, insensible aux accents, tirets et majuscules ; tolère les fautes
-- légères (trigrammes). Renvoie les besoins les plus proches avec leurs catégories.
create or replace function public.search_needs(q text, max_results integer default 10)
returns table (need_id text, label text, category_ids text[], score real)
language sql
stable
set search_path = ''
as $$
  with query as (
    select public.normalize_search_text(q) as norm,
           plainto_tsquery('public.fr_unaccent'::regconfig, public.normalize_search_text(q)) as tsq
  ),
  scored as (
    select n.id, n.label, n.sort_order,
           greatest(
             ts_rank(n.search_tsv, query.tsq),
             extensions.word_similarity(query.norm, n.search_text)
           )::real as score,
           n.search_tsv @@ query.tsq as fts_match,
           extensions.word_similarity(query.norm, n.search_text) as sim
    from public.needs n, query
    where coalesce(query.norm, '') <> ''
  )
  select s.id,
         s.label,
         array(select nc.category_id from public.need_categories nc
               where nc.need_id = s.id order by nc.category_id),
         s.score
  from scored s
  where s.fts_match or s.sim >= 0.6
  order by s.score desc, s.sort_order, s.id
  limit greatest(least(coalesce(max_results, 10), 50), 1)
$$;

comment on function public.search_needs(text, integer) is
  'Recherche de besoins (« grille pain » → réparation) : plein texte fr_unaccent + trigrammes.';

-- ---------------------------------------------------------------------------------------------
-- RLS : lecture publique (anonymes compris). Aucune écriture côté client pour l'instant.
-- ---------------------------------------------------------------------------------------------
alter table public.cities enable row level security;
alter table public.domains enable row level security;
alter table public.categories enable row level security;
alter table public.needs enable row level security;
alter table public.need_categories enable row level security;

create policy "cities: lecture publique" on public.cities for select to anon, authenticated using (true);
create policy "domains: lecture publique" on public.domains for select to anon, authenticated using (true);
create policy "categories: lecture publique" on public.categories for select to anon, authenticated using (true);
create policy "needs: lecture publique" on public.needs for select to anon, authenticated using (true);
create policy "need_categories: lecture publique" on public.need_categories for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------------------------
-- Données de référence
-- ---------------------------------------------------------------------------------------------
insert into public.cities (slug, name, timezone, center, bbox) values (
  'bordeaux', 'Bordeaux', 'Europe/Paris',
  extensions.st_setsrid(extensions.st_makepoint(-0.5792, 44.8378), 4326)::extensions.geography,
  extensions.st_makeenvelope(-0.6386, 44.8106, -0.5294, 44.9161, 4326)
);

insert into public.domains (id, label, sort_order) values
  ('alimentation', 'Alimentation', 1),
  ('quotidien_dechets', 'Quotidien et déchets', 2),
  ('reparation_reemploi', 'Réparation et réemploi', 3);

insert into public.categories (id, domain_id, label, description, sort_order) values
  ('vrac', 'alimentation', 'Vrac', 'Épiceries et rayons où l''on se sert au poids, avec ses contenants.', 1),
  ('producteurs', 'alimentation', 'Producteurs locaux', 'Fermes, marchés de producteurs, AMAP, paniers.', 2),
  ('anti_gaspi', 'alimentation', 'Anti-gaspi', 'Invendus, paniers surprise, dates courtes, épiceries solidaires.', 3),
  ('collecte', 'quotidien_dechets', 'Collecte et tri', 'Points de dépôt : compost, textiles, piles, appareils hors d''usage.', 4),
  ('reparation', 'reparation_reemploi', 'Réparation', 'Repair cafés, cordonniers, couturiers, ateliers vélo, réparateurs.', 5),
  ('ressourcerie', 'reparation_reemploi', 'Ressourcerie et seconde main', 'Ressourceries, friperies, recycleries, dons.', 6);

insert into public.needs (id, label, synonyms, sort_order) values
  ('grille-pain-en-panne', 'Grille-pain en panne', array['toaster', 'grille pain cassé', 'grille-pain ne chauffe plus'], 1),
  ('petit-electromenager-en-panne', 'Petit électroménager en panne', array['aspirateur', 'bouilloire', 'cafetière', 'mixeur', 'sèche-cheveux', 'fer à repasser'], 2),
  ('telephone-casse', 'Téléphone cassé', array['écran cassé', 'smartphone', 'portable', 'batterie faible', 'téléphone'], 3),
  ('ordinateur-en-panne', 'Ordinateur lent ou en panne', array['pc', 'ordinateur portable', 'informatique', 'tablette'], 4),
  ('vetement-troue', 'Vêtement troué', array['couture', 'retouche', 'ourlet', 'fermeture éclair', 'accroc', 'trou', 'recoudre'], 5),
  ('chaussures-usees', 'Chaussures à ressemeler', array['cordonnier', 'ressemelage', 'talon', 'semelle', 'chaussures abîmées'], 6),
  ('velo-a-reparer', 'Vélo à réparer', array['crevaison', 'chaîne', 'freins', 'atelier vélo', 'pneu', 'bicyclette'], 7),
  ('emprunter-un-outil', 'Emprunter un outil', array['perceuse', 'bricolage', 'outilthèque', 'scie', 'échelle'], 8),
  ('restes-de-legumes', 'Restes de légumes', array['épluchures', 'compost', 'biodéchets', 'déchets alimentaires', 'composteur'], 9),
  ('gourde', 'Gourde', array['bouteille réutilisable', 'fontaine à eau', 'eau du robinet', 'remplir sa gourde'], 10),
  ('pates-riz-cereales', 'Pâtes, riz et céréales au poids', array['vrac', 'légumineuses', 'lentilles', 'sans emballage', 'épicerie vrac'], 11),
  ('produits-menagers', 'Produits ménagers à recharger', array['lessive', 'liquide vaisselle', 'recharge', 'vinaigre blanc', 'savon noir'], 12),
  ('hygiene-solide', 'Savon et shampoing solides', array['cosmétiques', 'hygiène', 'shampoing', 'dentifrice', 'zéro déchet'], 13),
  ('bocaux-contenants', 'Bocaux et contenants', array['bocal', 'boîte', 'contenant réutilisable', 'sac à vrac'], 14),
  ('fruits-legumes-saison', 'Fruits et légumes de saison', array['maraîcher', 'ferme', 'amap', 'panier de légumes', 'marché'], 15),
  ('produits-fermiers', 'Œufs, lait et fromage fermiers', array['oeufs', 'crèmerie', 'fromage', 'lait', 'yaourt', 'fermier'], 16),
  ('viande-locale', 'Viande d''un éleveur local', array['boucherie', 'éleveur', 'volaille', 'colis de viande'], 17),
  ('panier-anti-gaspi', 'Panier anti-gaspi', array['invendus', 'panier surprise', 'fin de journée', 'boulangerie invendus'], 18),
  ('courses-petit-budget', 'Courses à petit prix', array['épicerie solidaire', 'dates courtes', 'déstockage', 'petit budget'], 19),
  ('meuble-occasion', 'Meuble d''occasion', array['chaise', 'table', 'armoire', 'brocante', 'commode', 'canapé'], 20),
  ('vetements-seconde-main', 'Vêtements de seconde main', array['friperie', 'fripes', 'jean', 'vêtements enfant', 'occasion'], 21),
  ('jouets-livres', 'Jouets et livres d''occasion', array['jeux', 'bd', 'livres', 'puériculture'], 22),
  ('donner-des-objets', 'Donner des objets', array['débarras', 'don', 'vider sa cave', 'déménagement', 'se débarrasser'], 23),
  ('piles-ampoules', 'Piles et ampoules usagées', array['batteries', 'néon', 'cartouches d''encre', 'recyclage'], 24),
  ('textiles-uses', 'Textiles usés', array['borne textile', 'vêtements abîmés', 'linge usé', 'chaussures usées'], 25),
  ('appareil-hors-usage', 'Appareil électrique hors d''usage', array['deee', 'électroménager à jeter', 'déchetterie', 'gros électroménager'], 26);

insert into public.need_categories (need_id, category_id) values
  ('grille-pain-en-panne', 'reparation'),
  ('petit-electromenager-en-panne', 'reparation'),
  ('telephone-casse', 'reparation'),
  ('ordinateur-en-panne', 'reparation'),
  ('vetement-troue', 'reparation'),
  ('chaussures-usees', 'reparation'),
  ('velo-a-reparer', 'reparation'),
  ('emprunter-un-outil', 'reparation'),
  ('emprunter-un-outil', 'ressourcerie'),
  ('restes-de-legumes', 'collecte'),
  ('restes-de-legumes', 'anti_gaspi'),
  ('gourde', 'vrac'),
  ('pates-riz-cereales', 'vrac'),
  ('produits-menagers', 'vrac'),
  ('hygiene-solide', 'vrac'),
  ('bocaux-contenants', 'vrac'),
  ('bocaux-contenants', 'ressourcerie'),
  ('fruits-legumes-saison', 'producteurs'),
  ('produits-fermiers', 'producteurs'),
  ('viande-locale', 'producteurs'),
  ('panier-anti-gaspi', 'anti_gaspi'),
  ('courses-petit-budget', 'anti_gaspi'),
  ('meuble-occasion', 'ressourcerie'),
  ('vetements-seconde-main', 'ressourcerie'),
  ('jouets-livres', 'ressourcerie'),
  ('donner-des-objets', 'ressourcerie'),
  ('donner-des-objets', 'collecte'),
  ('piles-ampoules', 'collecte'),
  ('textiles-uses', 'collecte'),
  ('appareil-hors-usage', 'collecte');
