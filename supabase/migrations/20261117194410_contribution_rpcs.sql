-- T5.1 / T5.4 — Contribution depuis l'app : proposer un lieu et signaler une erreur.
-- Fonctions SQL (SECURITY INVOKER : la RLS s'applique) plutôt qu'une Edge Function : mêmes
-- garanties (validation, limite par compte, doublons), testées avec pgTAP.

-- Nombre maximal de propositions par compte sur 24 heures.
create or replace function public.submission_daily_limit()
returns integer
language sql
immutable
as $$ select 5 $$;

-- Propose un nouveau lieu. Réponse :
--   {"status": "pending", "submission_id": …}       proposition enregistrée (en attente de modération)
--   {"status": "duplicate", "place_id": …, "name": …} lieu probablement déjà présent (même catégorie,
--                                                     moins de 75 m, noms proches)
--   {"status": "rate_limited"}                       plus de 5 propositions en 24 h
--   {"status": "invalid", "field": …}                champ manquant ou invalide
create or replace function public.submit_place(payload jsonb)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(payload ->> 'name', ''));
  v_category text := payload ->> 'category_id';
  v_address text := nullif(btrim(coalesce(payload ->> 'address', '')), '');
  v_lat double precision;
  v_lng double precision;
  v_point extensions.geography;
  v_dup record;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Connexion nécessaire pour proposer un lieu' using errcode = '42501';
  end if;
  if length(v_name) not between 2 and 120 then
    return jsonb_build_object('status', 'invalid', 'field', 'name');
  end if;
  if v_category is null or not exists (select 1 from public.categories c where c.id = v_category) then
    return jsonb_build_object('status', 'invalid', 'field', 'category_id');
  end if;
  if v_address is not null and length(v_address) > 200 then
    return jsonb_build_object('status', 'invalid', 'field', 'address');
  end if;
  if length(coalesce(payload ->> 'price_hint', '')) > 60 then
    return jsonb_build_object('status', 'invalid', 'field', 'price_hint');
  end if;
  begin
    v_lat := (payload ->> 'latitude')::double precision;
    v_lng := (payload ->> 'longitude')::double precision;
  exception when others then
    return jsonb_build_object('status', 'invalid', 'field', 'location');
  end;
  if v_lat is not null and v_lng is not null then
    if v_lat not between -90 and 90 or v_lng not between -180 and 180 then
      return jsonb_build_object('status', 'invalid', 'field', 'location');
    end if;
    v_point := extensions.st_setsrid(extensions.st_makepoint(v_lng, v_lat), 4326)::extensions.geography;
  end if;

  if (select count(*) from public.place_submissions s
      where s.user_id = auth.uid() and s.created_at > now() - interval '24 hours')
     >= public.submission_daily_limit() then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  if v_point is not null then
    select p.id, p.name into v_dup
    from public.places p
    where p.published
      and p.category_id = v_category
      and extensions.st_dwithin(p.location, v_point, 75)
      and extensions.similarity(public.normalize_search_text(p.name), public.normalize_search_text(v_name)) >= 0.4
    order by extensions.similarity(public.normalize_search_text(p.name), public.normalize_search_text(v_name)) desc
    limit 1;
    if v_dup.id is not null then
      return jsonb_build_object('status', 'duplicate', 'place_id', v_dup.id, 'name', v_dup.name);
    end if;
  end if;

  insert into public.place_submissions (kind, payload)
  values ('new', jsonb_strip_nulls(jsonb_build_object(
    'name', v_name,
    'category_id', v_category,
    'address', v_address,
    'latitude', v_lat,
    'longitude', v_lng,
    'is_free', coalesce((payload ->> 'is_free')::boolean, false),
    'price_hint', nullif(btrim(coalesce(payload ->> 'price_hint', '')), ''),
    'hours', payload -> 'hours'
  )))
  returning id into v_id;
  return jsonb_build_object('status', 'pending', 'submission_id', v_id);
end;
$$;

comment on function public.submit_place(jsonb) is
  'Proposition d''un lieu : validation, limite de 5 par 24 h, détection de doublon (même catégorie, < 75 m, nom proche).';

revoke execute on function public.submit_place(jsonb) from public, anon;
grant execute on function public.submit_place(jsonb) to authenticated, service_role;

-- Signalement en deux touches : un seul par compte, lieu et mois.
-- Réponse : {"status": "reported"} ou {"status": "already_reported"}.
create or replace function public.report_place(
  place_id uuid,
  reason public.place_report_reason,
  comment text default null
)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Connexion nécessaire pour signaler' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.place_reports r
    where r.place_id = report_place.place_id and r.reporter_id = auth.uid()
      and r.created_at > now() - interval '30 days'
  ) then
    return jsonb_build_object('status', 'already_reported');
  end if;
  insert into public.place_reports (place_id, reason, comment)
  values (report_place.place_id, report_place.reason, nullif(btrim(coalesce(report_place.comment, '')), ''));
  return jsonb_build_object('status', 'reported');
end;
$$;

revoke execute on function public.report_place(uuid, public.place_report_reason, text) from public, anon;
grant execute on function public.report_place(uuid, public.place_report_reason, text) to authenticated, service_role;
