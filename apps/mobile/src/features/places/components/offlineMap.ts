import type { StyleSpecification } from 'maplibre-gl';

import { mapColors } from '@/theme';

/**
 * Plan simplifié de Bordeaux, entièrement embarqué : utilisé quand les fonds de carte en ligne
 * sont inaccessibles (démo publiée dans un environnement sans accès à Internet, hors connexion).
 * La Garonne est un tracé approximatif (quelques points relevés le long des quais) : le plan sert
 * à situer les lieux les uns par rapport aux autres, pas à s'orienter dans les rues.
 */
const GARONNE: GeoJSON.Feature<GeoJSON.LineString> = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [
      [-0.536, 44.795],
      [-0.546, 44.81],
      [-0.553, 44.82],
      [-0.558, 44.829],
      [-0.563, 44.838],
      [-0.5655, 44.842],
      [-0.566, 44.847],
      [-0.5635, 44.852],
      [-0.5575, 44.8565],
      [-0.551, 44.8597],
      [-0.546, 44.866],
      [-0.54, 44.875],
      [-0.533, 44.882],
      [-0.525, 44.892],
    ],
  },
};

export const OFFLINE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    garonne: { type: 'geojson', data: GARONNE },
  },
  layers: [
    { id: 'land', type: 'background', paint: { 'background-color': mapColors.land } },
    {
      id: 'garonne',
      type: 'line',
      source: 'garonne',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      // Environ 400 m de large : la largeur suit le zoom (×2 par niveau).
      paint: {
        'line-color': mapColors.water,
        'line-width': ['interpolate', ['exponential', 2], ['zoom'], 10, 4, 13, 30, 16, 240],
      },
    },
  ],
};

/** Les fonds de carte en ligne répondent-ils ? (réponse en 2,5 s au plus) */
export async function onlineTilesReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
