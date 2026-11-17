import {
  mapPlaceJson,
  mapSearchRows,
  NEEDS,
  searchPlacesLocal,
  suggestNeeds,
  type NeedSuggestion,
  type PlaceCategory,
  type PlaceDetail,
  type PlaceSearchPage,
  type PlaceSearchParams,
  type SearchPlacesRow,
} from '@alt/shared';

import { DEMO_CATEGORY_LABELS, DEMO_PLACES } from '@/demo/bordeaux-places';
import { getSupabase, type AltSupabaseClient } from '@/lib/supabase';

/**
 * Accès aux lieux : base Supabase (fonctions `search_places`, `get_place`, `search_needs`)
 * ou données de démonstration embarquées (mode démo, sans serveur).
 */
export interface PlacesRepository {
  search(params: PlaceSearchParams): Promise<PlaceSearchPage>;
  get(id: string): Promise<PlaceDetail | null>;
  suggest(query: string): Promise<NeedSuggestion[]>;
}

/** Erreur réseau ou serveur, affichée avec « Réessayer ». */
export class PlacesApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlacesApiError';
  }
}

export function createSupabaseRepository(client: AltSupabaseClient): PlacesRepository {
  return {
    async search(params) {
      const { data, error } = await client.rpc('search_places', {
        q: params.q ?? undefined,
        lat: params.origin?.latitude,
        lng: params.origin?.longitude,
        radius_m: params.radiusM,
        category_ids: params.categoryIds?.length ? [...params.categoryIds] : undefined,
        open_now: params.openNow ?? false,
        free_only: params.freeOnly ?? false,
        walk_only: params.walkOnly ?? false,
        transit_only: params.transitOnly ?? false,
        sort_by: params.sortBy ?? 'distance',
        page_size: params.pageSize,
        page_offset: params.pageOffset,
      });
      if (error) throw new PlacesApiError(error.message);
      return mapSearchRows((data ?? []) as unknown as SearchPlacesRow[]);
    },
    async get(id) {
      const { data, error } = await client.rpc('get_place', { place_id: id });
      if (error) throw new PlacesApiError(error.message);
      return mapPlaceJson(data);
    },
    async suggest(query) {
      const { data, error } = await client.rpc('search_needs', { q: query, max_results: 3 });
      if (error) throw new PlacesApiError(error.message);
      return (data ?? []).map((row) => ({
        id: row.need_id,
        label: row.label,
        categories: row.category_ids as PlaceCategory[],
        score: row.score,
      }));
    },
  };
}

export function createDemoRepository(now: () => Date = () => new Date()): PlacesRepository {
  return {
    async search(params) {
      return searchPlacesLocal(DEMO_PLACES, params, {
        needs: NEEDS,
        categoryLabels: DEMO_CATEGORY_LABELS,
        now: now(),
      });
    },
    async get(id) {
      return DEMO_PLACES.find((p) => p.id === id) ?? null;
    },
    async suggest(query) {
      return suggestNeeds(NEEDS, query, 3);
    },
  };
}

let override: PlacesRepository | undefined;

export function getPlacesRepository(): PlacesRepository {
  if (override) return override;
  const client = getSupabase();
  return client ? createSupabaseRepository(client) : createDemoRepository();
}

/** Remplace la source de données (tests). */
export function setPlacesRepositoryForTests(repo: PlacesRepository | undefined): void {
  override = repo;
}
