import {
  BORDEAUX_CENTER,
  resolveLocation,
  type Coordinates,
  type LocationAccuracy,
  type LocationPermission,
  type ResolvedLocation,
} from '@alt/shared';
import * as Location from 'expo-location';
import { useEffect } from 'react';

import { createStore, useStore } from '@/lib/store';

/**
 * Géolocalisation (T3.6). L'écran explicatif (`app/location.tsx`) s'affiche AVANT la
 * demande système ; la position approximative est acceptée ; en cas de refus, on se
 * replie sur un quartier choisi ou sur le centre-ville.
 */
export interface Neighborhood {
  id: string;
  name: string;
  center: Coordinates;
}

/** Quartiers de Bordeaux proposés en repli (centres approximatifs). */
export const BORDEAUX_NEIGHBORHOODS: readonly Neighborhood[] = [
  { id: 'centre', name: 'Centre-ville', center: { latitude: 44.8412, longitude: -0.5737 } },
  { id: 'chartrons', name: 'Chartrons', center: { latitude: 44.8536, longitude: -0.5713 } },
  { id: 'saint-michel', name: 'Saint-Michel', center: { latitude: 44.8327, longitude: -0.5672 } },
  { id: 'bastide', name: 'La Bastide', center: { latitude: 44.8434, longitude: -0.5546 } },
  {
    id: 'saint-augustin',
    name: 'Saint-Augustin',
    center: { latitude: 44.8317, longitude: -0.6042 },
  },
  { id: 'bacalan', name: 'Bacalan', center: { latitude: 44.8728, longitude: -0.5524 } },
  { id: 'nansouty', name: 'Nansouty', center: { latitude: 44.8226, longitude: -0.5737 } },
  { id: 'cauderan', name: 'Caudéran', center: { latitude: 44.8496, longitude: -0.6152 } },
];

interface LocationState {
  permission: LocationPermission;
  accuracy: LocationAccuracy;
  devicePosition: Coordinates | null;
  neighborhood: Neighborhood | null;
  /** L'utilisateur a vu l'écran explicatif (accepté, refusé ou choisi un quartier). */
  asked: boolean;
}

const store = createStore<LocationState>({
  permission: 'undetermined',
  accuracy: 'precise',
  devicePosition: null,
  neighborhood: null,
  asked: false,
});

function toPermission(status: Location.PermissionStatus): LocationPermission {
  if (status === Location.PermissionStatus.GRANTED) return 'granted';
  if (status === Location.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

function toAccuracy(response: Location.LocationPermissionResponse): LocationAccuracy {
  if (response.ios?.scope === 'whenInUse' || response.ios?.scope === 'always') {
    // iOS 14+ : « position exacte » désactivée → accuracy 'reduced'
    const iosAccuracy = (response.ios as { accuracy?: string }).accuracy;
    if (iosAccuracy === 'reduced') return 'approximate';
  }
  if (response.android?.accuracy === 'coarse') return 'approximate';
  return 'precise';
}

async function readPosition(): Promise<Coordinates | null> {
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    try {
      const last = await Location.getLastKnownPositionAsync();
      return last ? { latitude: last.coords.latitude, longitude: last.coords.longitude } : null;
    } catch {
      return null;
    }
  }
}

/** Demande système (à appeler depuis l'écran explicatif seulement). */
export async function requestLocation(): Promise<ResolvedLocation> {
  let response: Location.LocationPermissionResponse;
  try {
    response = await Location.requestForegroundPermissionsAsync();
  } catch {
    store.set((s) => ({ ...s, permission: 'denied', asked: true }));
    return getResolvedLocation();
  }
  const permission = toPermission(response.status);
  const accuracy = toAccuracy(response);
  const devicePosition = permission === 'granted' ? await readPosition() : null;
  store.set((s) => ({ ...s, permission, accuracy, devicePosition, asked: true }));
  return getResolvedLocation();
}

/** Repli : quartier choisi par l'utilisateur. */
export function chooseNeighborhood(neighborhood: Neighborhood | null): void {
  store.set((s) => ({ ...s, neighborhood, asked: true }));
}

/** « Plus tard » : on n'insiste pas, on utilise le centre-ville. */
export function dismissLocationRequest(): void {
  store.set((s) => ({ ...s, asked: true }));
}

/** Relit l'autorisation déjà donnée (sans rien demander) au démarrage. */
export async function refreshLocationPermission(): Promise<void> {
  try {
    const response = await Location.getForegroundPermissionsAsync();
    const permission = toPermission(response.status);
    if (permission === 'undetermined') return;
    const devicePosition = permission === 'granted' ? await readPosition() : null;
    store.set((s) => ({
      ...s,
      permission,
      accuracy: toAccuracy(response),
      devicePosition,
      asked: true,
    }));
  } catch {
    // module indisponible (web sans géolocalisation, tests) : on garde le repli
  }
}

export function getResolvedLocation(): ResolvedLocation {
  const s = store.get();
  return resolveLocation({
    permission: s.permission,
    accuracy: s.accuracy,
    devicePosition: s.devicePosition,
    neighborhood: s.neighborhood,
    cityCenter: BORDEAUX_CENTER,
  });
}

export interface UseLocationResult extends ResolvedLocation {
  permission: LocationPermission;
  asked: boolean;
  neighborhood: Neighborhood | null;
}

export function useLocation(): UseLocationResult {
  const s = useStore(store);
  useEffect(() => {
    void refreshLocationPermission();
  }, []);
  const resolved = resolveLocation({
    permission: s.permission,
    accuracy: s.accuracy,
    devicePosition: s.devicePosition,
    neighborhood: s.neighborhood,
  });
  return { ...resolved, permission: s.permission, asked: s.asked, neighborhood: s.neighborhood };
}

export function resetLocationForTests(): void {
  store.set({
    permission: 'undetermined',
    accuracy: 'precise',
    devicePosition: null,
    neighborhood: null,
    asked: false,
  });
}
