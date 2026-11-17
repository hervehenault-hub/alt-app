/**
 * Géolocalisation (T3.6) : choix de la position utilisée pour la recherche.
 * Fonction pure, testée pour les 3 cas : accordé, approximatif, refusé.
 */
import type { Coordinates } from '../schemas/geo';

/** Centre-ville de Bordeaux (identique à `cities.center` en base). */
export const BORDEAUX_CENTER: Coordinates = { latitude: 44.8378, longitude: -0.5792 };

export type LocationPermission = 'undetermined' | 'granted' | 'denied';

/** Précision fournie par le système (iOS « position approximative », Android « COARSE »). */
export type LocationAccuracy = 'precise' | 'approximate';

export type LocationSource = 'device' | 'device_approximate' | 'neighborhood' | 'city_center';

export interface ResolvedLocation {
  coordinates: Coordinates;
  source: LocationSource;
  /** Rayon d'incertitude indicatif en mètres (pour l'affichage « environ »). */
  uncertaintyMeters: number;
}

export interface ResolveLocationInput {
  permission: LocationPermission;
  accuracy?: LocationAccuracy;
  /** Dernière position connue de l'appareil (si la permission est accordée). */
  devicePosition?: Coordinates | null;
  /** Quartier choisi par l'utilisateur en repli. */
  neighborhood?: { center: Coordinates } | null;
  /** Centre de la ville (par défaut : Bordeaux). */
  cityCenter?: Coordinates;
}

/** Au-delà, la position approximative n'est pas fiable pour trier par distance. */
export const APPROXIMATE_UNCERTAINTY_METERS = 3000;

/**
 * Renvoie la position à utiliser :
 * 1. accordée et précise → position de l'appareil ;
 * 2. accordée mais approximative → position de l'appareil, marquée « environ » ;
 * 3. refusée ou indisponible → quartier choisi, sinon centre-ville.
 */
export function resolveLocation({
  permission,
  accuracy = 'precise',
  devicePosition,
  neighborhood,
  cityCenter = BORDEAUX_CENTER,
}: ResolveLocationInput): ResolvedLocation {
  if (permission === 'granted' && devicePosition) {
    return accuracy === 'precise'
      ? { coordinates: devicePosition, source: 'device', uncertaintyMeters: 50 }
      : {
          coordinates: devicePosition,
          source: 'device_approximate',
          uncertaintyMeters: APPROXIMATE_UNCERTAINTY_METERS,
        };
  }
  if (neighborhood) {
    return { coordinates: neighborhood.center, source: 'neighborhood', uncertaintyMeters: 800 };
  }
  return { coordinates: cityCenter, source: 'city_center', uncertaintyMeters: 2000 };
}
