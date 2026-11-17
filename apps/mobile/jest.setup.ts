/**
 * Préparation commune des tests : stockage en mémoire et modules natifs simulés
 * (secure-store, localisation, Apple, Google n'existent pas dans Jest).
 */
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

beforeEach(() => {
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
