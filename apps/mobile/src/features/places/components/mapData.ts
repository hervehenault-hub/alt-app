import type { Coordinates, PlaceCategory, PlaceSummary } from '@alt/shared';

import { mapColors } from '@/theme';

/** Style de carte OpenFreeMap (tuiles OpenStreetMap, sans clé ni compte). */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const DEFAULT_ZOOM = 13;

/** Lettre affichée dans le marqueur (en plus de la couleur). */
export const CATEGORY_LETTER: Record<PlaceCategory, string> = {
  vrac: 'V',
  producteurs: 'P',
  anti_gaspi: 'A',
  collecte: 'C',
  reparation: 'R',
  ressourcerie: 'S',
};

export interface PlaceMapProps {
  places: readonly PlaceSummary[];
  center: Coordinates;
  /** Position de l'utilisateur (point bleu), si connue. */
  userPosition?: Coordinates | null;
  onOpenPlace: (id: string) => void;
}

export function toFeatureCollection(places: readonly PlaceSummary[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places.map((p) => ({
      type: 'Feature',
      id: p.id,
      geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
      properties: {
        id: p.id,
        name: p.name,
        category: p.categoryId,
        letter: CATEGORY_LETTER[p.categoryId],
      },
    })),
  };
}

/** Expression MapLibre : couleur selon la catégorie. */
export const CATEGORY_COLOR_EXPRESSION = [
  'match',
  ['get', 'category'],
  ...Object.entries(CATEGORY_LETTER).flatMap(([category]) => [
    category,
    mapColors[category as PlaceCategory],
  ]),
  mapColors.cluster,
] as unknown as string;
