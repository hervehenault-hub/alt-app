-- T2.11 — Événements de mesure d'audience (analytics), en écriture seule pour les clients.
-- Tout le monde peut insérer (anonymes compris) ; aucun client ne peut relire.
-- Un utilisateur ne peut pas attribuer un événement à quelqu'un d'autre, et ses événements sont
-- ignorés s'il a refusé la mesure d'audience (profiles.analytics_opt_out).

create table public.analytics_events (
  id bigint generated always as identity primary key,
  anon_id uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (name ~ '^[a-z][a-z0-9_]{1,63}$'),
  props jsonb not null default '{}'
    check (jsonb_typeof(props) = 'object' and octet_length(props::text) <= 2000),
  created_at timestamptz not null default now()
);

comment on table public.analytics_events is
  'Événements d''usage (nom en snake_case, props ≤ 2 ko). Écriture seule côté client, lecture serveur uniquement.';

create index analytics_events_name_created_at_idx on public.analytics_events (name, created_at);

create or replace function public.analytics_events_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.created_at := now();
  end if;
  -- refus de la mesure d'audience : l'événement est ignoré silencieusement
  if exists (
    select 1 from public.profiles p
    where p.id = coalesce(new.user_id, auth.uid()) and p.analytics_opt_out
  ) then
    return null;
  end if;
  return new;
end;
$$;

revoke execute on function public.analytics_events_before_insert() from public, anon, authenticated;

create trigger analytics_events_before_insert before insert on public.analytics_events
  for each row execute function public.analytics_events_before_insert();

alter table public.analytics_events enable row level security;

create policy "analytics_events: insertion par tous" on public.analytics_events
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

-- Ceinture et bretelles : aucun droit de lecture ni de modification pour les clients.
revoke select, update, delete, truncate on public.analytics_events from anon, authenticated;
