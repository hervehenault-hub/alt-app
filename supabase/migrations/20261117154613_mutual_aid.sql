-- T2.10 — Entraide entre voisins : quartiers, règles de la communauté, annonces, messagerie,
-- blocages, signalements de contenus, remerciements.
--
-- Principes :
-- - AUCUNE adresse exacte : la localisation d'une annonce est le quartier, rien de plus.
-- - Publier une annonce ou écrire un message exige d'avoir accepté la version en vigueur des règles.
-- - Un blocage coupe la relation dans les deux sens (annonces, conversations, messages, mercis).
-- - Seuls les deux participants lisent une conversation (pas même un admin).
-- - Les annonces expirées (30 jours max) ou masquées ne sont pas listées.

-- ---------------------------------------------------------------------------------------------
-- Quartiers
-- ---------------------------------------------------------------------------------------------
create table public.neighborhoods (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  geom extensions.geometry(MultiPolygon, 4326),
  created_at timestamptz not null default now(),
  unique (city_id, slug)
);

create index neighborhoods_geom_idx on public.neighborhoods using gist (geom);

alter table public.profiles
  add constraint profiles_neighborhood_id_fkey
  foreign key (neighborhood_id) references public.neighborhoods (id) on delete set null;

create index profiles_neighborhood_id_idx on public.profiles (neighborhood_id);

alter table public.neighborhoods enable row level security;
create policy "neighborhoods: lecture publique" on public.neighborhoods
  for select to anon, authenticated using (true);
create policy "neighborhoods: écriture admin" on public.neighborhoods
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
-- Règles de la communauté (versions) et acceptations
-- ---------------------------------------------------------------------------------------------
create table public.community_rules_versions (
  version text primary key check (version ~ '^[a-z0-9.-]{1,20}$'),
  effective_at timestamptz not null default now(),
  summary text
);

comment on table public.community_rules_versions is
  'Versions des règles de la communauté. Celle en vigueur = la plus récente dont effective_at est passé.';

insert into public.community_rules_versions (version, effective_at, summary)
values ('v1', '2026-01-01 00:00:00+00', 'Première version des règles de l''entraide.');

create table public.community_rules_acceptances (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  version text not null references public.community_rules_versions (version),
  accepted_at timestamptz not null default now(),
  primary key (user_id, version)
);

create or replace function public.current_community_rules_version()
returns text
language sql
stable
set search_path = ''
as $$
  select v.version from public.community_rules_versions v
  where v.effective_at <= now()
  order by v.effective_at desc
  limit 1
$$;

-- L'utilisateur connecté a-t-il accepté les règles en vigueur ?
create or replace function public.has_accepted_community_rules()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_rules_acceptances a
    where a.user_id = auth.uid() and a.version = public.current_community_rules_version()
  )
$$;

revoke execute on function public.has_accepted_community_rules() from public;
grant execute on function public.has_accepted_community_rules() to anon, authenticated, service_role;

alter table public.community_rules_versions enable row level security;
alter table public.community_rules_acceptances enable row level security;

create policy "community_rules_versions: lecture publique" on public.community_rules_versions
  for select to anon, authenticated using (true);
create policy "community_rules_versions: écriture admin" on public.community_rules_versions
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "community_rules_acceptances: lecture des siennes" on public.community_rules_acceptances
  for select to authenticated using (user_id = (select auth.uid()));
create policy "community_rules_acceptances: accepter" on public.community_rules_acceptances
  for insert to authenticated with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Blocages
-- ---------------------------------------------------------------------------------------------
create table public.user_blocks (
  blocker_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

create index user_blocks_blocked_id_idx on public.user_blocks (blocked_id);

-- Un blocage existe-t-il entre l'utilisateur connecté et « other », dans un sens ou dans l'autre ?
-- (SECURITY DEFINER : la personne bloquée ne voit pas la ligne de blocage, mais doit être arrêtée.)
create or replace function public.is_blocked_with(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = other)
       or (b.blocker_id = other and b.blocked_id = auth.uid())
  )
$$;

revoke execute on function public.is_blocked_with(uuid) from public;
grant execute on function public.is_blocked_with(uuid) to authenticated, service_role;

alter table public.user_blocks enable row level security;

create policy "user_blocks: gérer ses blocages" on public.user_blocks
  for all to authenticated
  using (blocker_id = (select auth.uid()))
  with check (blocker_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Annonces d'entraide
-- ---------------------------------------------------------------------------------------------
create type public.help_post_type as enum ('offer', 'request');
create type public.help_service as enum ('repair_help', 'carpool', 'childcare', 'tool_sharing');
create type public.help_post_status as enum ('open', 'closed', 'hidden');

create table public.help_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type public.help_post_type not null,
  service public.help_service not null,
  title text not null check (length(btrim(title)) between 1 and 80),
  description text not null check (length(btrim(description)) between 1 and 500),
  neighborhood_id uuid not null references public.neighborhoods (id),
  status public.help_post_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  constraint help_posts_expiry check (expires_at > created_at and expires_at <= created_at + interval '30 days')
);

comment on table public.help_posts is
  'Annonces d''entraide (offre/demande). Localisation = quartier uniquement, jamais d''adresse. 30 jours max.';

create index help_posts_listing_idx on public.help_posts (neighborhood_id, expires_at) where status = 'open';
create index help_posts_author_id_idx on public.help_posts (author_id);

create trigger help_posts_set_updated_at before update on public.help_posts
  for each row execute function public.set_updated_at();

-- Côté client : created_at et author_id figés ; le statut « hidden » (modération) est réservé aux admins.
create or replace function public.help_posts_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.created_at := now();
    if new.status <> 'open' then
      raise exception 'Une annonce est créée ouverte' using errcode = '42501';
    end if;
  else
    new.created_at := old.created_at;
    new.author_id := old.author_id;
    if new.status = 'hidden' or old.status = 'hidden' then
      raise exception 'Le masquage est réservé à la modération' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger help_posts_guard before insert or update on public.help_posts
  for each row execute function public.help_posts_guard();

alter table public.help_posts enable row level security;

-- Liste : annonces ouvertes, non expirées, hors personnes bloquées ; l'auteur voit toujours les siennes.
create policy "help_posts: lecture des annonces actives" on public.help_posts
  for select to authenticated
  using (
    author_id = (select auth.uid())
    or (select public.is_admin())
    or (status = 'open' and expires_at > now() and not public.is_blocked_with(author_id))
  );

create policy "help_posts: publier (règles acceptées)" on public.help_posts
  for insert to authenticated
  with check (author_id = (select auth.uid()) and (select public.has_accepted_community_rules()));

create policy "help_posts: modifier les siennes" on public.help_posts
  for update to authenticated
  using (author_id = (select auth.uid()))
  -- fermer son annonce reste possible même si les règles ont changé depuis
  with check (
    author_id = (select auth.uid())
    and (status = 'closed' or (select public.has_accepted_community_rules()))
  );

create policy "help_posts: modération admin" on public.help_posts
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "help_posts: supprimer les siennes (admin : toutes)" on public.help_posts
  for delete to authenticated using (author_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
-- Conversations et messages
-- ---------------------------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.help_posts (id) on delete cascade,
  -- personne qui répond à l'annonce
  initiator_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- auteur de l'annonce
  recipient_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conversations_two_people check (initiator_id <> recipient_id),
  unique (post_id, initiator_id)
);

create index conversations_initiator_id_idx on public.conversations (initiator_id);
create index conversations_recipient_id_idx on public.conversations (recipient_id);

alter table public.conversations enable row level security;

create policy "conversations: lecture par les deux participants" on public.conversations
  for select to authenticated
  using ((select auth.uid()) in (initiator_id, recipient_id));

-- On ouvre une conversation sur une annonce visible (ouverte, non expirée, non bloquée),
-- avec son auteur, après avoir accepté les règles.
create policy "conversations: répondre à une annonce" on public.conversations
  for insert to authenticated
  with check (
    initiator_id = (select auth.uid())
    and (select public.has_accepted_community_rules())
    and not public.is_blocked_with(recipient_id)
    and exists (
      select 1 from public.help_posts p
      where p.id = post_id and p.author_id = recipient_id
        and p.status = 'open' and p.expires_at > now()
    )
  );

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);

-- created_at fixé par le serveur
create or replace function public.messages_set_created_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.created_at := now();
  end if;
  return new;
end;
$$;

create trigger messages_set_created_at before insert on public.messages
  for each row execute function public.messages_set_created_at();

alter table public.messages enable row level security;

create policy "messages: lecture par les participants" on public.messages
  for select to authenticated
  using (exists (select 1 from public.conversations c where c.id = conversation_id));

create policy "messages: écrire (participant, règles acceptées, non bloqué)" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select public.has_accepted_community_rules())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and not public.is_blocked_with(
          case when c.initiator_id = (select auth.uid()) then c.recipient_id else c.initiator_id end
        )
    )
  );

-- ---------------------------------------------------------------------------------------------
-- Signalements de contenus
-- ---------------------------------------------------------------------------------------------
create type public.content_report_target as enum ('post', 'message', 'user');
create type public.content_report_reason as enum ('spam', 'harassment', 'inappropriate', 'dangerous', 'other');

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  target_type public.content_report_target not null,
  target_id uuid not null,
  reason public.content_report_reason not null,
  comment text check (comment is null or length(comment) <= 500),
  status public.report_status not null default 'open',
  resolved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create index content_reports_open_idx on public.content_reports (created_at) where status = 'open';

create trigger content_reports_set_updated_at before update on public.content_reports
  for each row execute function public.set_updated_at();

alter table public.content_reports enable row level security;

create policy "content_reports: lecture des siens (admin : tous)" on public.content_reports
  for select to authenticated using (reporter_id = (select auth.uid()) or (select public.is_admin()));
create policy "content_reports: signaler" on public.content_reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open' and resolved_by is null);
create policy "content_reports: traitement admin" on public.content_reports
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------------------------
-- Remerciements (après un échange sur une annonce)
-- ---------------------------------------------------------------------------------------------
create table public.thanks (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null default auth.uid() references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  post_id uuid references public.help_posts (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint thanks_not_self check (from_user <> to_user),
  unique (from_user, to_user, post_id)
);

create index thanks_to_user_idx on public.thanks (to_user);

alter table public.thanks enable row level security;

create policy "thanks: lecture (envoyés ou reçus)" on public.thanks
  for select to authenticated using ((select auth.uid()) in (from_user, to_user));

-- On remercie quelqu'un avec qui on a échangé sur l'annonce.
create policy "thanks: remercier un participant" on public.thanks
  for insert to authenticated
  with check (
    from_user = (select auth.uid())
    and not public.is_blocked_with(to_user)
    and exists (
      select 1 from public.conversations c
      where c.post_id = thanks.post_id
        and (
          (c.initiator_id = (select auth.uid()) and c.recipient_id = to_user)
          or (c.recipient_id = (select auth.uid()) and c.initiator_id = to_user)
        )
    )
  );
