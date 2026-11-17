import {
  HELP_POST_TTL_DAYS,
  isHelpPostVisible,
  type HelpPostType,
  type HelpService,
} from '@alt/shared';
import { z } from 'zod';

import { getAuthState } from '@/lib/auth/session';
import { BORDEAUX_NEIGHBORHOODS } from '@/lib/location';
import { getStorage } from '@/lib/storage';
import { getSupabase, type AltSupabaseClient } from '@/lib/supabase';

/** Entraide (lot 8) : annonces de quartier, règles de conduite, signalement et blocage. */
export interface HelpPost {
  id: string;
  authorId: string;
  type: HelpPostType;
  service: HelpService;
  title: string;
  description: string;
  neighborhoodId: string;
  status: 'open' | 'closed' | 'hidden';
  createdAt: string;
  expiresAt: string;
}

export interface NewHelpPost {
  type: HelpPostType;
  service: HelpService;
  title: string;
  description: string;
  neighborhoodId: string;
}

export interface Neighborhood {
  id: string;
  name: string;
}

export interface MutualAidRepository {
  neighborhoods(): Promise<Neighborhood[]>;
  hasAcceptedRules(): Promise<boolean>;
  acceptRules(): Promise<void>;
  listPosts(): Promise<HelpPost[]>;
  createPost(input: NewHelpPost): Promise<void>;
  closePost(id: string): Promise<void>;
  reportPost(id: string): Promise<void>;
  blockUser(userId: string): Promise<void>;
}

export const RULES_VERSION = 'v1';

export function createSupabaseMutualAidRepository(
  client: AltSupabaseClient,
  userId: string,
): MutualAidRepository {
  return {
    async neighborhoods() {
      const { data, error } = await client.from('neighborhoods').select('id, name').order('name');
      if (error) throw error;
      return data ?? [];
    },
    async hasAcceptedRules() {
      const { data, error } = await client.rpc('has_accepted_community_rules');
      if (error) throw error;
      return Boolean(data);
    },
    async acceptRules() {
      const { data: version } = await client.rpc('current_community_rules_version');
      const { error } = await client
        .from('community_rules_acceptances')
        .upsert({ version: String(version ?? RULES_VERSION) }, { ignoreDuplicates: true });
      if (error) throw error;
    },
    async listPosts() {
      const { data, error } = await client
        .from('help_posts')
        .select(
          'id, author_id, type, service, title, description, neighborhood_id, status, created_at, expires_at',
        )
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        authorId: p.author_id,
        type: p.type,
        service: p.service,
        title: p.title,
        description: p.description,
        neighborhoodId: p.neighborhood_id,
        status: p.status,
        createdAt: p.created_at,
        expiresAt: p.expires_at,
      }));
    },
    async createPost(input) {
      const { error } = await client.from('help_posts').insert({
        type: input.type,
        service: input.service,
        title: input.title.trim(),
        description: input.description.trim(),
        neighborhood_id: input.neighborhoodId,
      });
      if (error) throw error;
    },
    async closePost(id) {
      const { error } = await client
        .from('help_posts')
        .update({ status: 'closed' })
        .eq('id', id)
        .eq('author_id', userId);
      if (error) throw error;
    },
    async reportPost(id) {
      const { error } = await client
        .from('content_reports')
        .upsert(
          { target_type: 'post', target_id: id, reason: 'inappropriate' },
          { ignoreDuplicates: true, onConflict: 'reporter_id,target_type,target_id' },
        );
      if (error) throw error;
    },
    async blockUser(blockedId) {
      const { error } = await client
        .from('user_blocks')
        .upsert({ blocked_id: blockedId }, { ignoreDuplicates: true });
      if (error) throw error;
    },
  };
}

const postSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  type: z.enum(['offer', 'request']),
  service: z.enum(['repair_help', 'carpool', 'childcare', 'tool_sharing']),
  title: z.string(),
  description: z.string(),
  neighborhoodId: z.string(),
  status: z.enum(['open', 'closed', 'hidden']),
  createdAt: z.string(),
  expiresAt: z.string(),
});
const localSchema = z.object({
  rulesAccepted: z.boolean().default(false),
  posts: z.array(postSchema).default([]),
  blocked: z.array(z.string()).default([]),
  reported: z.array(z.string()).default([]),
});

/** Annonces fictives de démonstration (voisins inventés). */
function demoPosts(): HelpPost[] {
  const at = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000);
  const post = (
    id: string,
    type: HelpPostType,
    service: HelpService,
    title: string,
    description: string,
    neighborhoodId: string,
    daysAgo: number,
  ): HelpPost => ({
    id,
    authorId: `voisin-${id}`,
    type,
    service,
    title,
    description,
    neighborhoodId,
    status: 'open',
    createdAt: at(daysAgo).toISOString(),
    expiresAt: new Date(at(daysAgo).getTime() + HELP_POST_TTL_DAYS * 86_400_000).toISOString(),
  });
  return [
    post(
      'd1',
      'offer',
      'tool_sharing',
      'Je prête une perceuse et une scie sauteuse',
      'Disponibles le week-end, à récupérer près de la place des Capucins. Rendez-les quand vous avez fini !',
      'saint-michel',
      1,
    ),
    post(
      'd2',
      'request',
      'repair_help',
      'Aide pour changer la chambre à air de mon vélo',
      'Je débute en réparation vélo. Quelqu’un pour me montrer une fois ? Je peux offrir un café.',
      'chartrons',
      2,
    ),
    post(
      'd3',
      'offer',
      'carpool',
      'Covoiturage vers la ferme de l’Entre-deux-Mers',
      'Je vais chercher mon panier de légumes samedi matin, 2 places libres au départ de la Bastide.',
      'bastide',
      3,
    ),
    post(
      'd4',
      'request',
      'childcare',
      'Garde partagée le mercredi après-midi',
      'Parent de deux enfants (6 et 8 ans) cherche une famille pour alterner les mercredis.',
      'centre',
      5,
    ),
    post(
      'd5',
      'offer',
      'repair_help',
      'Petites retouches de couture',
      'Ourlets, boutons, petites déchirures : je peux aider, avec mes outils.',
      'nansouty',
      6,
    ),
  ];
}

export function createLocalMutualAidRepository(
  userId: string,
  seed: () => HelpPost[] = () => [],
): MutualAidRepository {
  const key = `alt.mutualAid.${userId}`;
  const read = async () => {
    try {
      const raw = await getStorage().getItem(key);
      if (!raw) return localSchema.parse({ posts: seed() });
      const parsed = localSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : localSchema.parse({});
    } catch {
      return localSchema.parse({});
    }
  };
  const write = (value: z.infer<typeof localSchema>) =>
    getStorage().setItem(key, JSON.stringify(value));
  return {
    async neighborhoods() {
      return BORDEAUX_NEIGHBORHOODS.map(({ id, name }) => ({ id, name }));
    },
    async hasAcceptedRules() {
      return (await read()).rulesAccepted;
    },
    async acceptRules() {
      await write({ ...(await read()), rulesAccepted: true });
    },
    async listPosts() {
      const s = await read();
      return s.posts.filter((p) => !s.blocked.includes(p.authorId));
    },
    async createPost(input) {
      const s = await read();
      const now = new Date();
      await write({
        ...s,
        posts: [
          {
            ...input,
            title: input.title.trim(),
            description: input.description.trim(),
            id: `local-${now.getTime().toString(36)}`,
            authorId: userId,
            status: 'open',
            createdAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + HELP_POST_TTL_DAYS * 86_400_000).toISOString(),
          },
          ...s.posts,
        ],
      });
    },
    async closePost(id) {
      const s = await read();
      await write({
        ...s,
        posts: s.posts.map((p) =>
          p.id === id && p.authorId === userId ? { ...p, status: 'closed' } : p,
        ),
      });
    },
    async reportPost(id) {
      const s = await read();
      await write({ ...s, reported: [...new Set([...s.reported, id])] });
    },
    async blockUser(blockedId) {
      const s = await read();
      await write({ ...s, blocked: [...new Set([...s.blocked, blockedId])] });
    },
  };
}

let override: MutualAidRepository | undefined;

export function getMutualAidRepository(): MutualAidRepository {
  if (override) return override;
  const { user } = getAuthState();
  if (!user) throw new Error('Connexion nécessaire');
  const client = getSupabase();
  return client && !user.isDemo
    ? createSupabaseMutualAidRepository(client, user.id)
    : createLocalMutualAidRepository(user.id, user.isDemo ? demoPosts : undefined);
}

export function setMutualAidRepositoryForTests(repo: MutualAidRepository | undefined): void {
  override = repo;
}

export { isHelpPostVisible };
