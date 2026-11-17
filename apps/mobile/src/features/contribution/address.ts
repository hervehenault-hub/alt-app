import type { Coordinates } from '@alt/shared';

/**
 * Autocomplétion d'adresse via l'API Adresse (Base Adresse Nationale, service public gratuit,
 * sans clé ni compte). En cas d'échec réseau : aucune suggestion, la saisie libre reste possible.
 */
export interface AddressSuggestion {
  label: string;
  coordinates: Coordinates;
}

export async function searchAddress(
  query: string,
  near?: Coordinates,
  fetcher: typeof fetch = fetch,
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 4) return [];
  const params = new URLSearchParams({ q, limit: '3', autocomplete: '1' });
  if (near) {
    params.set('lat', String(near.latitude));
    params.set('lon', String(near.longitude));
  }
  try {
    const response = await fetcher(`https://api-adresse.data.gouv.fr/search/?${params.toString()}`);
    if (!response.ok) return [];
    const body = (await response.json()) as {
      features?: {
        properties?: { label?: string };
        geometry?: { coordinates?: [number, number] };
      }[];
    };
    return (body.features ?? []).flatMap((f) => {
      const label = f.properties?.label;
      const coords = f.geometry?.coordinates;
      return label && coords
        ? [{ label, coordinates: { latitude: coords[1], longitude: coords[0] } }]
        : [];
    });
  } catch {
    return [];
  }
}
