-- T4.1 — Recherche de lieux.
-- Texte libre (nom, catégorie, besoins et synonymes ; sans accents ; tolérant aux fautes légères),
-- position + rayon, filtres (ouvert maintenant, gratuit, à pied, transport), tri par distance ou
-- par économie, fiches « à revérifier » rétrogradées en fin de liste, pagination.
-- SECURITY INVOKER : les règles d'accès (RLS) s'appliquent ; seuls les lieux publiés sont renvoyés.

create or replace function public.search_places(
  q text default null,
  lat double precision default null,
  lng double precision default null,
  radius_m integer default 5000,
  category_ids text[] default null,
  open_now boolean default false,
  free_only boolean default false,
  walk_only boolean default false,
  transit_only boolean default false,
  sort_by text default 'distance',
  page_size integer default 20,
  page_offset integer default 0,
  at_time timestamptz default now()
)
returns table (
  id uuid,
  name text,
  category_id text,
  address text,
  latitude double precision,
  longitude double precision,
  distance_m double precision,
  is_open boolean,
  is_free boolean,
  walk_accessible boolean,
  transit_accessible boolean,
  price_hint text,
  estimated_saving_eur numeric,
  status public.place_status,
  needs_recheck boolean,
  last_verified_at timestamptz,
  relevance real,
  total_count bigint
)
language sql
stable
set search_path = ''
as $$
  with params as (
    select
      nullif(btrim(public.normalize_search_text(coalesce(search_places.q, ''))), '') as norm,
      case
        when search_places.lat is not null and search_places.lng is not null then
          extensions.st_setsrid(
            extensions.st_makepoint(search_places.lng, search_places.lat), 4326
          )::extensions.geography
      end as origin,
      greatest(least(coalesce(search_places.radius_m, 5000), 50000), 100) as radius,
      greatest(least(coalesce(search_places.page_size, 20), 100), 1) as lim,
      greatest(coalesce(search_places.page_offset, 0), 0) as off
  ),
  -- La requête désigne directement une catégorie (« vrac », « réparation ») ?
  category_hit as (
    select exists (
      select 1
      from public.categories c, params
      where params.norm is not null
        and extensions.word_similarity(
          params.norm, public.normalize_search_text(c.label || ' ' || replace(c.id, '_', ' '))
        ) >= 0.8
    ) as hit
  ),
  -- Sinon, catégories suggérées par les besoins (« grille-pain » → réparation).
  need_cats as (
    select unnest(sn.category_ids) as category_id, max(sn.score) as score
    from params
    cross join category_hit
    cross join lateral public.search_needs(params.norm, 5) sn
    where params.norm is not null and not category_hit.hit
    group by 1
  ),
  candidates as (
    select
      p.id, p.name, p.category_id, p.address, p.location, p.is_free, p.walk_accessible,
      p.transit_accessible, p.price_hint, p.estimated_saving_eur, p.status, p.needs_recheck,
      p.last_verified_at,
      case when params.origin is not null
        then extensions.st_distance(p.location, params.origin) end as dist,
      case when params.norm is null then 1::real else greatest(
        extensions.word_similarity(params.norm, public.normalize_search_text(p.name)),
        extensions.word_similarity(
          params.norm,
          public.normalize_search_text(c.label || ' ' || replace(c.id, '_', ' '))
        ),
        case when nc.category_id is not null then greatest(nc.score, 0.6) else 0 end
      )::real end as rel
    from public.places p
    join public.categories c on c.id = p.category_id
    left join need_cats nc on nc.category_id = p.category_id
    cross join params
    where p.published
      and (params.origin is null
           or extensions.st_dwithin(p.location, params.origin, params.radius))
      and (search_places.category_ids is null
           or cardinality(search_places.category_ids) = 0
           or p.category_id = any (search_places.category_ids))
      and (not coalesce(search_places.free_only, false) or p.is_free)
      and (not coalesce(search_places.walk_only, false) or p.walk_accessible)
      and (not coalesce(search_places.transit_only, false) or p.transit_accessible)
  ),
  matched as (
    select cand.*, count(*) over () as total
    from candidates cand
    where cand.rel >= 0.5
      and (not coalesce(search_places.open_now, false)
           or public.is_open_now(cand.id, search_places.at_time) is true)
  ),
  page as (
    select m.*
    from matched m, params
    order by
      m.needs_recheck,
      case when search_places.sort_by = 'saving' then m.estimated_saving_eur end desc nulls last,
      m.dist nulls last,
      m.rel desc,
      m.name,
      m.id
    limit (select lim from params) offset (select off from params)
  )
  select
    pg.id, pg.name, pg.category_id, pg.address,
    extensions.st_y(pg.location::extensions.geometry),
    extensions.st_x(pg.location::extensions.geometry),
    pg.dist,
    public.is_open_now(pg.id, search_places.at_time),
    pg.is_free, pg.walk_accessible, pg.transit_accessible, pg.price_hint,
    pg.estimated_saving_eur, pg.status, pg.needs_recheck, pg.last_verified_at,
    pg.rel, pg.total
  from page pg
  order by
    pg.needs_recheck,
    case when search_places.sort_by = 'saving' then pg.estimated_saving_eur end desc nulls last,
    pg.dist nulls last,
    pg.rel desc,
    pg.name,
    pg.id
$$;

comment on function public.search_places(
  text, double precision, double precision, integer, text[], boolean, boolean, boolean, boolean,
  text, integer, integer, timestamptz
) is
  'Recherche de lieux publiés : texte (nom, catégorie, besoins), rayon, filtres, tri distance '
  '(défaut) ou économie (sort_by = ''saving''), fiches à revérifier en dernier, pagination.';

revoke execute on function public.search_places(
  text, double precision, double precision, integer, text[], boolean, boolean, boolean, boolean,
  text, integer, integer, timestamptz
) from public;
grant execute on function public.search_places(
  text, double precision, double precision, integer, text[], boolean, boolean, boolean, boolean,
  text, integer, integer, timestamptz
) to anon, authenticated, service_role;
