import type { PlaceSearchParams } from '@alt/shared';
import { QueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { getPlacesRepository } from './repository';

/** Couche de données des lieux (T4.3) : TanStack Query + anti-rebond de la saisie. */
export const SEARCH_DEBOUNCE_MS = 250;
export const PAGE_SIZE = 20;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        // Réseau mobile : 2 nouvelles tentatives, puis l'écran d'erreur propose « Réessayer ».
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      },
    },
  });
}

/** Valeur retardée : ne change qu'après `delay` ms sans nouvelle modification. */
export function useDebouncedValue<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const round = (n: number | undefined) =>
  n === undefined ? undefined : Math.round(n * 1000) / 1000;

/** Clé de cache stable (position arrondie à ~100 m pour réutiliser les résultats). */
export function searchKey(params: PlaceSearchParams) {
  return [
    'places',
    'search',
    {
      ...params,
      q: params.q?.trim() || null,
      origin: params.origin
        ? { latitude: round(params.origin.latitude), longitude: round(params.origin.longitude) }
        : null,
      categoryIds: params.categoryIds ? [...params.categoryIds].sort() : null,
    },
  ] as const;
}

/** Recherche paginée, la saisie (`q`) étant retardée de 250 ms. */
export function usePlaceSearch(params: PlaceSearchParams) {
  const q = useDebouncedValue(params.q ?? '');
  const effective = { ...params, q };
  return useInfiniteQuery({
    queryKey: searchKey(effective),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getPlacesRepository().search({ ...effective, pageSize: PAGE_SIZE, pageOffset: pageParam }),
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.items.length, 0);
      return loaded < last.total ? loaded : undefined;
    },
  });
}

export function usePlace(id: string | undefined) {
  return useQuery({
    queryKey: ['places', 'detail', id],
    enabled: Boolean(id),
    queryFn: () => getPlacesRepository().get(id as string),
  });
}

/** Suggestions de besoins pendant la saisie (3 au plus). */
export function useNeedSuggestions(query: string) {
  const q = useDebouncedValue(query.trim(), 150);
  return useQuery({
    queryKey: ['needs', 'suggest', q],
    enabled: q.length >= 2,
    queryFn: () => getPlacesRepository().suggest(q),
    staleTime: 10 * 60_000,
  });
}
