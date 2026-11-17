import { classifyTags } from './categories.ts';
import { parseOpeningHours } from './opening-hours.ts';
import type {
  OsmPlace,
  OverpassElement,
  OverpassResponse,
  PlaceAddress,
  SkipReason,
} from './types.ts';

export const OSM_ATTRIBUTION = '© les contributeurs d’OpenStreetMap (ODbL)';

/** Nom donné aux points de collecte sans nom (très fréquent pour les conteneurs). */
export const UNNAMED_COLLECTION_POINT = 'Point de collecte';

function coordinates(element: OverpassElement): { latitude: number; longitude: number } | null {
  const lat = element.type === 'node' ? element.lat : element.center?.lat;
  const lon = element.type === 'node' ? element.lon : element.center?.lon;
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return null;
  }
  return { latitude: lat, longitude: lon };
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function extractAddress(tags: Readonly<Record<string, string>>): PlaceAddress {
  const houseNumber = clean(tags['addr:housenumber']);
  const streetName = clean(tags['addr:street']);
  const street = streetName ? [houseNumber, streetName].filter(Boolean).join(' ') : null;
  const postcode = clean(tags['addr:postcode']);
  const city = clean(tags['addr:city']);
  const locality = [postcode, city].filter(Boolean).join(' ');
  const formatted = [street, locality].filter(Boolean).join(', ') || null;
  return { street, postcode, city, formatted };
}

export type ConversionResult =
  { ok: true; place: OsmPlace } | { ok: false; source_ref: string; reason: SkipReason };

/** Convertit un élément OSM en lieu Alt., ou explique pourquoi il est écarté. */
export function convertElement(element: OverpassElement): ConversionResult {
  const source_ref = `${element.type}/${element.id}`;
  const tags = element.tags ?? {};
  const categories = classifyTags(tags);
  const [category] = categories;
  if (!category) return { ok: false, source_ref, reason: 'hors_categorie' };

  const coords = coordinates(element);
  if (!coords) return { ok: false, source_ref, reason: 'sans_coordonnees' };

  const name = clean(tags.name) ?? (category === 'collecte' ? UNNAMED_COLLECTION_POINT : null);
  if (!name) return { ok: false, source_ref, reason: 'sans_nom' };

  const rawHours = clean(tags.opening_hours);
  return {
    ok: true,
    place: {
      name,
      category,
      categories,
      ...coords,
      address: extractAddress(tags),
      website: clean(tags.website) ?? clean(tags['contact:website']),
      phone: clean(tags.phone) ?? clean(tags['contact:phone']),
      opening_hours_raw: rawHours,
      opening_hours: parseOpeningHours(rawHours),
      source: 'osm',
      source_ref,
      license: 'ODbL',
      attribution: OSM_ATTRIBUTION,
    },
  };
}

export type ImportReport = {
  places: OsmPlace[];
  skipped: { source_ref: string; reason: SkipReason }[];
};

/** Convertit une réponse Overpass complète (ordre conservé, doublons écartés). */
export function convertOverpassResponse(response: OverpassResponse): ImportReport {
  const places: OsmPlace[] = [];
  const skipped: ImportReport['skipped'] = [];
  const seen = new Set<string>();
  for (const element of response.elements) {
    const result = convertElement(element);
    const ref = result.ok ? result.place.source_ref : result.source_ref;
    if (seen.has(ref)) {
      skipped.push({ source_ref: ref, reason: 'doublon' });
      continue;
    }
    seen.add(ref);
    if (result.ok) places.push(result.place);
    else skipped.push({ source_ref: result.source_ref, reason: result.reason });
  }
  return { places, skipped };
}
