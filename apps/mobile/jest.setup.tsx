/* eslint-disable @typescript-eslint/consistent-type-imports -- types des modules simulés par Jest */
/**
 * Préparation commune des tests : stockage en mémoire et modules natifs simulés
 * (secure-store, localisation, Apple, Google n'existent pas dans Jest).
 */
import {
  resetJourneyProgressForTests,
  setProgressRepositoryForTests,
} from '@/features/journey/progress';
import { setPlacesRepositoryForTests } from '@/features/places/repository';
import { resetSearchStateForTests } from '@/features/places/searchState';
import { resetAnalyticsForTests } from '@/lib/analytics';
import { resetAuthForTests } from '@/lib/auth/session';
import { clearPendingAction } from '@/lib/auth/useRequireAccount';
import { resetLocationForTests } from '@/lib/location';
import { resetOnboardingForTests } from '@/lib/onboarding';
import { createMemoryStorage, setStorage } from '@/lib/storage';
import { setSupabaseForTests } from '@/lib/supabase';

jest.mock('expo-secure-store', () => {
  const data = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => data.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void data.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void data.delete(k)),
  };
});

jest.mock('expo-location', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  Accuracy: { Balanced: 3 },
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'undetermined' })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 44.84, longitude: -0.57 },
  })),
  getLastKnownPositionAsync: jest.fn(async () => null),
}));

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(async () => false),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  AppleAuthenticationButton: () => null,
  AppleAuthenticationButtonType: { CONTINUE: 1 },
  AppleAuthenticationButtonStyle: { BLACK: 2 },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(),
  },
}));

// Carte native : non disponible dans Jest (rendu par un composant vide).
jest.mock('@maplibre/maplibre-react-native', () => {
  const { forwardRef } = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const Stub = forwardRef((props: object, _ref) => <View {...props} />);
  return { Map: Stub, Camera: Stub, GeoJSONSource: Stub, Layer: Stub };
});

// FlashList (ESM) : remplacée par FlatList, même API pour ce que l'app utilise.
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = jest.requireActual<typeof import('react-native')>('react-native');
  return { FlashList: FlatList };
});

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));

beforeEach(() => {
  resetSearchStateForTests();
  resetJourneyProgressForTests();
  setProgressRepositoryForTests(undefined);
  setPlacesRepositoryForTests(undefined);
  setStorage(createMemoryStorage());
  // Par défaut : pas de serveur (comme le mode démo) ; les tests qui en ont besoin en injectent un.
  setSupabaseForTests(null);
  resetAuthForTests();
  resetAnalyticsForTests();
  resetLocationForTests();
  clearPendingAction();
  // Par défaut l'onboarding est déjà passé ; les tests d'onboarding le réinitialisent.
  resetOnboardingForTests({
    status: 'skipped',
    answers: { citySlug: 'bordeaux', cityNotCovered: false, interests: [], mainConstraint: null },
    syncedUserId: null,
  });
});
