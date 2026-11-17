import type { Coordinates } from '../schemas/geo';

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Distance « à vol d'oiseau » entre deux points, en mètres (formule de haversine). */
export function distanceInMeters(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Formate une distance pour l'affichage en français :
 * moins d'1 km → arrondi à 10 m (« 350 m ») ; sinon km avec une décimale (« 1,2 km »).
 */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) {
    throw new RangeError('La distance doit être un nombre positif.');
  }
  if (meters < 1000) {
    return `${Math.round(meters / 10) * 10} m`;
  }
  const km = Math.round(meters / 100) / 10;
  return `${km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}
