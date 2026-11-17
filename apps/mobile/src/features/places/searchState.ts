import { DEFAULT_RADIUS_M, type PlaceCategory, type PlaceSort } from '@alt/shared';
import { useEffect } from 'react';
import { z } from 'zod';

import { getStorage } from '@/lib/storage';
import { createStore, useStore } from '@/lib/store';

/**
 * État de la recherche partagé entre la liste, la carte et la feuille de filtres :
 * basculer carte / liste conserve la recherche. Les filtres sont mémorisés (T4.8).
 */
export const FILTERS_KEY = 'alt.search.filters';

const filtersSchema = z.object({
  radiusM: z.number().int().min(100).max(50000).default(DEFAULT_RADIUS_M),
  openNow: z.boolean().default(false),
  freeOnly: z.boolean().default(false),
  walkOnly: z.boolean().default(false),
  transitOnly: z.boolean().default(false),
  sortBy: z.enum(['distance', 'saving']).default('distance'),
});

export type SearchFilters = z.infer<typeof filtersSchema>;
export const DEFAULT_FILTERS: SearchFilters = filtersSchema.parse({});

export interface SearchState {
  q: string;
  categoryIds: PlaceCategory[];
  /** Thème choisi depuis une tuile d'Explorer (affiché comme filtre amovible). */
  domainKey: string | null;
  filters: SearchFilters;
  view: 'list' | 'map';
}

const store = createStore<SearchState>({
  q: '',
  categoryIds: [],
  domainKey: null,
  filters: DEFAULT_FILTERS,
  view: 'list',
});
let loaded: Promise<void> | undefined;

export function loadSavedFilters(): Promise<void> {
  loaded ??= (async () => {
    try {
      const raw = await getStorage().getItem(FILTERS_KEY);
      if (!raw) return;
      const parsed = filtersSchema.safeParse(JSON.parse(raw));
      if (parsed.success) store.set((s) => ({ ...s, filters: parsed.data }));
    } catch {
      // filtres par défaut
    }
  })();
  return loaded;
}

export function setQuery(q: string): void {
  store.set((s) => ({ ...s, q }));
}

export function setCategories(categoryIds: PlaceCategory[], domainKey: string | null = null): void {
  store.set((s) => ({ ...s, categoryIds, domainKey }));
}

export function setView(view: SearchState['view']): void {
  store.set((s) => ({ ...s, view }));
}

export async function applyFilters(filters: SearchFilters): Promise<void> {
  store.set((s) => ({ ...s, filters }));
  try {
    await getStorage().setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // mémorisation impossible : filtres gardés pour la session
  }
}

/** Nombre de filtres différents des valeurs par défaut (affiché sur le bouton). */
export function activeFilterCount(filters: SearchFilters): number {
  return (Object.keys(DEFAULT_FILTERS) as (keyof SearchFilters)[]).filter(
    (key) => filters[key] !== DEFAULT_FILTERS[key],
  ).length;
}

export function getSearchState(): SearchState {
  return store.get();
}

export function useSearchState(): SearchState {
  const state = useStore(store);
  useEffect(() => {
    void loadSavedFilters();
  }, []);
  return state;
}

export type { PlaceSort };

export function resetSearchStateForTests(): void {
  loaded = undefined;
  store.set({ q: '', categoryIds: [], domainKey: null, filters: DEFAULT_FILTERS, view: 'list' });
}
