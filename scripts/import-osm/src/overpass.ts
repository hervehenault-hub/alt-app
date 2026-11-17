import type { OverpassResponse } from './types.ts';

/** Emprise de Bordeaux (commune et proches abords) : sud, ouest, nord, est. */
export const BORDEAUX_BBOX = { south: 44.79, west: -0.66, north: 44.92, east: -0.52 } as const;
export type BBox = { south: number; west: number; north: number; east: number };

export const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

/** User-Agent générique (aucune donnée personnelle), comme le demande l'usage d'Overpass. */
export const USER_AGENT = 'alt-import-osm/0.1 (import de lieux, projet Alt.)';

/** Filtres Overpass, alignés sur CATEGORY_RULES (src/categories.ts). */
export const OVERPASS_FILTERS = [
  '["shop"="zero_waste"]',
  '["bulk_purchase"~"^(yes|only)$"]',
  '["shop"="farm"]',
  '["amenity"="marketplace"]',
  '["repair_cafe"="yes"]',
  '["craft"~"^(shoemaker|tailor)$"]',
  '["shop"="repair"]',
  '["shop"]["repair"]["repair"!="no"]',
  '["service:bicycle:repair"="yes"]',
  '["shop"~"^(second_hand|charity)$"]',
  '["amenity"="recycling"]',
] as const;

/** Requête Overpass QL : nœuds, ways et relations de la bbox, avec centre et tags. */
export function buildOverpassQuery(bbox: BBox = BORDEAUX_BBOX, timeoutSeconds = 90): string {
  const box = [bbox.south, bbox.west, bbox.north, bbox.east].join(',');
  return [
    `[out:json][timeout:${timeoutSeconds}][bbox:${box}];`,
    '(',
    ...OVERPASS_FILTERS.map((filter) => `  nwr${filter};`),
    ');',
    'out center tags;',
  ].join('\n');
}

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

/**
 * Interroge Overpass. `fetchFn` est injecté (fetch global par défaut) pour pouvoir tester
 * sans réseau. N'est appelé que par src/cli.ts, jamais par les tests ni par la CI.
 */
export async function fetchOverpass(
  query: string,
  { fetchFn = fetch as unknown as FetchLike, endpoint = OVERPASS_ENDPOINT } = {},
): Promise<OverpassResponse> {
  const response = await fetchFn(endpoint, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) throw new Error(`Overpass a répondu ${response.status}`);
  const json = (await response.json()) as Partial<OverpassResponse>;
  return { elements: Array.isArray(json.elements) ? json.elements : [] };
}
