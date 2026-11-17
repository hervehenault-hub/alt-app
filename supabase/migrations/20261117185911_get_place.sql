-- T4.2 — Fiche complète d'un lieu : horaires de la semaine, statut, date de vérification,
-- base de calcul de l'économie. Renvoie NULL si le lieu n'existe pas ou n'est pas visible
-- (non publié : visible des seuls administrateurs). SECURITY INVOKER : la RLS s'applique.

create or replace function public.get_place(place_id uuid, at_time timestamptz default now())
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'category_id', p.category_id,
    'category_label', c.label,
    'domain_id', c.domain_id,
    'address', p.address,
    'latitude', extensions.st_y(p.location::extensions.geometry),
    'longitude', extensions.st_x(p.location::extensions.geometry),
    'price_hint', p.price_hint,
    'is_free', p.is_free,
    'walk_accessible', p.walk_accessible,
    'transit_accessible', p.transit_accessible,
    'estimated_saving_eur', p.estimated_saving_eur,
    'saving_basis', p.saving_basis,
    'status', p.status,
    'needs_recheck', p.needs_recheck,
    'last_verified_at', p.last_verified_at,
    'source', p.source,
    'license', p.license,
    'published', p.published,
    'is_open', public.is_open_now(p.id, get_place.at_time),
    'opening_hours', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'weekday', oh.weekday,
          'opens', to_char(oh.opens, 'HH24:MI'),
          'closes', to_char(oh.closes, 'HH24:MI')
        )
        order by oh.weekday, oh.opens
      )
      from public.opening_hours oh
      where oh.place_id = p.id
    ), '[]'::jsonb)
  )
  from public.places p
  join public.categories c on c.id = p.category_id
  where p.id = get_place.place_id
    and (p.published or public.is_admin())
$$;

comment on function public.get_place(uuid, timestamptz) is
  'Fiche complète d''un lieu (JSON) ; NULL si absent ou non publié (sauf administrateurs).';

revoke execute on function public.get_place(uuid, timestamptz) from public;
grant execute on function public.get_place(uuid, timestamptz) to anon, authenticated, service_role;
