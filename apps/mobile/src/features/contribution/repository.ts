import type { PlaceCategory } from '@alt/shared';
import { z } from 'zod';

import { getAuthState } from '@/lib/auth/session';
import { getStorage } from '@/lib/storage';
import { getSupabase, type AltSupabaseClient } from '@/lib/supabase';

/**
 * Contribution (lot 5) : proposer un lieu, signaler une erreur, confirmer une fiche,
 * suivre ses contributions. Compte réel : fonctions SQL `submit_place`, `report_place` ;
 * démo : stockage local.
 */
export type HoursPreset = 'unknown' | 'shop' | 'everyday' | 'weekend';
export type ReportReason = 'closed' | 'wrong_hours' | 'wrong_address' | 'other';

export interface NewPlaceInput {
  name: string;
  categoryId: PlaceCategory;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  hours: HoursPreset;
  isFree: boolean;
  priceHint: string;
}

export type SubmitResult =
  | { status: 'pending' }
  | { status: 'duplicate'; placeId: string; name: string }
  | { status: 'rate_limited' }
  | { status: 'invalid'; field: string };

export interface Contribution {
  id: string;
  kind: 'new' | 'edit' | 'report';
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ContributionRepository {
  submitPlace(input: NewPlaceInput): Promise<SubmitResult>;
  report(
    placeId: string,
    placeName: string,
    reason: ReportReason,
    comment?: string,
  ): Promise<'reported' | 'already_reported'>;
  confirm(placeId: string): Promise<void>;
  list(): Promise<Contribution[]>;
}

function toPayload(input: NewPlaceInput) {
  return {
    name: input.name.trim(),
    category_id: input.categoryId,
    address: input.address.trim() || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    is_free: input.isFree,
    price_hint: input.isFree ? null : input.priceHint.trim() || null,
    hours: input.hours,
  };
}

export function createSupabaseContributionRepository(
  client: AltSupabaseClient,
): ContributionRepository {
  return {
    async submitPlace(input) {
      const { data, error } = await client.rpc('submit_place', { payload: toPayload(input) });
      if (error) throw error;
      const r = data as Record<string, string>;
      if (r.status === 'duplicate')
        return { status: 'duplicate', placeId: r.place_id ?? '', name: r.name ?? '' };
      if (r.status === 'invalid') return { status: 'invalid', field: r.field ?? '' };
      if (r.status === 'rate_limited') return { status: 'rate_limited' };
      return { status: 'pending' };
    },
    async report(placeId, _name, reason, comment) {
      const { data, error } = await client.rpc('report_place', {
        place_id: placeId,
        reason,
        comment,
      });
      if (error) throw error;
      return (data as { status: string }).status === 'already_reported'
        ? 'already_reported'
        : 'reported';
    },
    async confirm(placeId) {
      const { error } = await client
        .from('place_confirmations')
        .upsert({ place_id: placeId }, { onConflict: 'place_id,user_id', ignoreDuplicates: true });
      if (error) throw error;
    },
    async list() {
      const { data, error } = await client
        .from('place_submissions')
        .select('id, kind, payload, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        kind: row.kind,
        name: String((row.payload as Record<string, unknown>).name ?? ''),
        status: row.status,
        createdAt: row.created_at,
      }));
    },
  };
}

const localSchema = z.array(
  z.object({
    id: z.string(),
    kind: z.enum(['new', 'edit', 'report']),
    name: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']),
    createdAt: z.string(),
    placeId: z.string().optional(),
  }),
);

export function createLocalContributionRepository(userId: string): ContributionRepository {
  const key = `alt.contributions.${userId}`;
  const read = async () => {
    try {
      const parsed = localSchema.safeParse(JSON.parse((await getStorage().getItem(key)) ?? '[]'));
      return parsed.success ? parsed.data : [];
    } catch {
      return [];
    }
  };
  const add = async (item: z.infer<typeof localSchema>[number]) =>
    getStorage().setItem(key, JSON.stringify([item, ...(await read())]));
  const id = () =>
    `local-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  return {
    async submitPlace(input) {
      if (input.name.trim().length < 2) return { status: 'invalid', field: 'name' };
      await add({
        id: id(),
        kind: 'new',
        name: input.name.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      return { status: 'pending' };
    },
    async report(placeId, placeName) {
      const monthAgo = Date.now() - 30 * 86_400_000;
      const items = await read();
      if (
        items.some(
          (c) => c.kind === 'report' && c.placeId === placeId && Date.parse(c.createdAt) > monthAgo,
        )
      ) {
        return 'already_reported';
      }
      await add({
        id: id(),
        kind: 'report',
        name: placeName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        placeId,
      });
      return 'reported';
    },
    async confirm() {
      // démo : rien à enregistrer côté serveur
    },
    async list() {
      return (await read()).map(({ placeId: _placeId, ...c }) => c);
    },
  };
}

let override: ContributionRepository | undefined;

export function getContributionRepository(): ContributionRepository {
  if (override) return override;
  const { user } = getAuthState();
  if (!user) throw new Error('Connexion nécessaire');
  const client = getSupabase();
  return client && !user.isDemo
    ? createSupabaseContributionRepository(client)
    : createLocalContributionRepository(user.id);
}

export function setContributionRepositoryForTests(repo: ContributionRepository | undefined): void {
  override = repo;
}
