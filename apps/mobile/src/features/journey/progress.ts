import {
  nextDueDate,
  type JourneyEvent,
  type JourneyRhythm,
  type JourneyStatus,
} from '@alt/shared';
import { useEffect } from 'react';
import { z } from 'zod';

import { getAuthState, useSession } from '@/lib/auth/session';
import { getStorage } from '@/lib/storage';
import { createStore, useStore } from '@/lib/store';
import { getSupabase, type AltSupabaseClient } from '@/lib/supabase';

/**
 * Progression du parcours (T6.5 à T6.7) : réponses aux actions et rythme choisi.
 * Compte réel : tables `user_actions` et `user_journeys` ; démo : stockage local.
 */
export interface JourneyProgress {
  loaded: boolean;
  events: JourneyEvent[];
  rhythm: JourneyRhythm;
}

const STATUS_TO_DB = { fait: 'done', plus_tard: 'later', pas_pour_moi: 'not_for_me' } as const;
const STATUS_FROM_DB = { done: 'fait', later: 'plus_tard', not_for_me: 'pas_pour_moi' } as const;

const localSchema = z.object({
  events: z
    .array(
      z.object({
        actionId: z.string(),
        status: z.enum(['fait', 'plus_tard', 'pas_pour_moi']),
        at: z.string(),
      }),
    )
    .default([]),
  rhythm: z.enum(['weekly', 'twice_weekly', 'self_paced']).default('weekly'),
});

const localKey = (userId: string) => `alt.journey.${userId}`;

export interface ProgressRepository {
  load(userId: string): Promise<Omit<JourneyProgress, 'loaded'>>;
  record(
    userId: string,
    event: { actionId: string; status: JourneyStatus; at: string },
  ): Promise<void>;
  setRhythm(userId: string, rhythm: JourneyRhythm, nextAt: Date | null): Promise<void>;
}

export function createLocalProgressRepository(
  initial: () => z.infer<typeof localSchema>['events'] = () => [],
): ProgressRepository {
  const read = async (userId: string) => {
    try {
      const raw = await getStorage().getItem(localKey(userId));
      if (!raw) return { events: initial(), rhythm: 'weekly' as const };
      const parsed = localSchema.safeParse(raw ? JSON.parse(raw) : {});
      return parsed.success ? parsed.data : localSchema.parse({});
    } catch {
      return localSchema.parse({});
    }
  };
  const write = (userId: string, value: z.infer<typeof localSchema>) =>
    getStorage().setItem(localKey(userId), JSON.stringify(value));
  return {
    load: read,
    async record(userId, event) {
      const current = await read(userId);
      await write(userId, { ...current, events: [...current.events, event] });
    },
    async setRhythm(userId, rhythm) {
      const current = await read(userId);
      await write(userId, { ...current, rhythm });
    },
  };
}

export function createSupabaseProgressRepository(client: AltSupabaseClient): ProgressRepository {
  return {
    async load(userId) {
      const [actions, journey] = await Promise.all([
        client
          .from('user_actions')
          .select('action_id, status, occurred_at')
          .eq('user_id', userId)
          .order('occurred_at'),
        client.from('user_journeys').select('rhythm').eq('user_id', userId).maybeSingle(),
      ]);
      if (actions.error) throw actions.error;
      return {
        events: (actions.data ?? []).map((row) => ({
          actionId: row.action_id,
          status: STATUS_FROM_DB[row.status],
          at: row.occurred_at,
        })),
        rhythm: journey.data?.rhythm ?? 'weekly',
      };
    },
    async record(_userId, event) {
      const { error } = await client.from('user_actions').insert({
        action_id: event.actionId,
        status: STATUS_TO_DB[event.status],
        occurred_at: event.at,
      });
      if (error) throw error;
    },
    async setRhythm(userId, rhythm, nextAt) {
      const { error } = await client
        .from('user_journeys')
        .upsert({ user_id: userId, rhythm, next_at: nextAt?.toISOString() ?? null });
      if (error) throw error;
    },
  };
}

/** Compte de démonstration : quelques actions déjà faites pour que l'Impact parle tout de suite. */
function demoHistory(): z.infer<typeof localSchema>['events'] {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  return [
    { actionId: 'reparer-telephone', status: 'fait', at: daysAgo(40) },
    { actionId: 'repas-vegetarien-hebdo', status: 'fait', at: daysAgo(15) },
    { actionId: 'gourde-remplie-robinet', status: 'fait', at: daysAgo(9) },
    { actionId: 'repas-vegetarien-hebdo', status: 'fait', at: daysAgo(8) },
    { actionId: 'repas-vegetarien-hebdo', status: 'fait', at: daysAgo(1) },
  ];
}

let override: ProgressRepository | undefined;

function repository(): ProgressRepository {
  if (override) return override;
  const { user } = getAuthState();
  const client = getSupabase();
  if (client && user && !user.isDemo) return createSupabaseProgressRepository(client);
  return createLocalProgressRepository(user?.isDemo ? demoHistory : undefined);
}

const store = createStore<JourneyProgress & { userId: string | null }>({
  loaded: false,
  events: [],
  rhythm: 'weekly',
  userId: null,
});

async function loadFor(userId: string) {
  if (store.get().userId === userId && store.get().loaded) return;
  store.set({ loaded: false, events: [], rhythm: 'weekly', userId });
  try {
    const data = await repository().load(userId);
    store.set({ ...data, loaded: true, userId });
  } catch {
    store.set({ loaded: true, events: [], rhythm: 'weekly', userId });
  }
}

/** Progression de l'utilisateur connecté (vide sans compte). */
export function useJourneyProgress(): JourneyProgress {
  const { user } = useSession();
  const state = useStore(store);
  useEffect(() => {
    if (user) void loadFor(user.id);
  }, [user]);
  if (!user || state.userId !== user.id) return { loaded: !user, events: [], rhythm: 'weekly' };
  return state;
}

/** Enregistre une réponse à une action (« Je l'ai fait », « Plus tard », « Pas pour moi »). */
export async function recordAnswer(
  actionId: string,
  status: JourneyStatus,
  now: Date = new Date(),
): Promise<void> {
  const { user } = getAuthState();
  if (!user) return;
  const event = { actionId, status, at: now.toISOString() };
  store.set((s) => ({ ...s, events: [...s.events, event] }));
  await repository().record(user.id, event);
}

export async function chooseRhythm(rhythm: JourneyRhythm, now: Date = new Date()): Promise<void> {
  const { user } = getAuthState();
  if (!user) return;
  store.set((s) => ({ ...s, rhythm }));
  const lastDone = [...store.get().events].reverse().find((e) => e.status === 'fait');
  await repository().setRhythm(
    user.id,
    rhythm,
    nextDueDate(rhythm, lastDone?.at ?? (rhythm === 'self_paced' ? null : now)),
  );
}

export function setProgressRepositoryForTests(repo: ProgressRepository | undefined): void {
  override = repo;
}

export function resetJourneyProgressForTests(): void {
  store.set({ loaded: false, events: [], rhythm: 'weekly', userId: null });
}
