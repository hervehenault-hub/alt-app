import { Text } from 'react-native';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as ExpoLocation from 'expo-location';
import { Stack, useRouter } from 'expo-router';

import TabsLayout from '@/app/(tabs)/_layout';
import ExploreScreen from '@/app/(tabs)/index';
import ProfileScreen from '@/app/(tabs)/profil';
import PrivacyScreen from '@/app/confidentialite';
import LocationScreen from '@/app/location';
import OnboardingScreen from '@/app/onboarding';
import SignInScreen from '@/app/sign-in';
import { Button } from '@/components';
import { trackAppOpened, trackPlaceViewed } from '@/lib/analytics';
import {
  DEMO_USER,
  getAuthState,
  initAuth,
  resetAuthForTests,
  setAuthStateForTests,
  signInDemo,
} from '@/lib/auth/session';
import { useRequireAccount } from '@/lib/auth/useRequireAccount';
import { getResolvedLocation, requestLocation } from '@/lib/location';
import {
  getOnboardingState,
  ONBOARDING_KEY,
  resetOnboardingForTests,
  syncOnboardingToProfile,
} from '@/lib/onboarding';
import { createMemoryStorage, getStorage, setStorage } from '@/lib/storage';
import {
  AUTH_STORAGE_KEY,
  createSupabaseClient,
  setSupabaseForTests,
  type AltSupabaseClient,
} from '@/lib/supabase';

/** Faux client Supabase : enregistre les écritures, renvoie la ville demandée. */
function fakeClient() {
  const calls: { table: string; op: string; payload?: unknown; filter?: unknown }[] = [];
  const client = {
    from(table: string) {
      return {
        insert: async (payload: unknown) => {
          calls.push({ table, op: 'insert', payload });
          return { error: null };
        },
        update: (payload: unknown) => ({
          eq: async (column: string, value: unknown) => {
            calls.push({ table, op: 'update', payload, filter: { [column]: value } });
            return { error: null };
          },
        }),
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { id: 'city-bdx' }, error: null }) }),
        }),
      };
    },
  };
  return { client: client as unknown as AltSupabaseClient, calls };
}

describe('T3.1 — session', () => {
  it('conserve la session Supabase après un redémarrage (stockage simulé)', async () => {
    const storage = createMemoryStorage();
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    await storage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        access_token: 'jeton',
        refresh_token: 'rafraichissement',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: expiresAt,
        user: {
          id: 'u-1',
          aud: 'authenticated',
          email: 'camille@example.org',
          user_metadata: { full_name: 'Camille' },
          app_metadata: {},
          created_at: new Date().toISOString(),
        },
      }),
    );
    setStorage(storage);
    const client = createSupabaseClient('http://127.0.0.1:54321', 'cle-publique', storage);
    setSupabaseForTests(client);

    await initAuth();
    expect(getAuthState()).toMatchObject({
      status: 'signedIn',
      user: { id: 'u-1', displayName: 'Camille', isDemo: false },
    });
    await client.auth.stopAutoRefresh();
  });

  it('sans session enregistrée : déconnecté', async () => {
    const storage = createMemoryStorage();
    setSupabaseForTests(createSupabaseClient('http://127.0.0.1:54321', 'cle', storage));
    await initAuth();
    expect(getAuthState().status).toBe('signedOut');
  });

  it('mode démo : la connexion simulée survit au redémarrage', async () => {
    await initAuth();
    expect(getAuthState().status).toBe('signedOut');
    await signInDemo();
    resetAuthForTests(); // « redémarrage »
    await initAuth();
    expect(getAuthState()).toEqual({ status: 'signedIn', user: DEMO_USER });
  });
});

const RootStack = () => <Stack screenOptions={{ headerShown: false }} />;

const SIGN_IN_ROUTES = {
  _layout: RootStack,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': ExploreScreen,
  '(tabs)/profil': ProfileScreen,
  'sign-in': SignInScreen,
  confidentialite: PrivacyScreen,
};

describe('T3.4 — écran de connexion', () => {
  it('ouvre la connexion depuis le profil, puis « Continuer sans compte » revient', async () => {
    await renderRouter(SIGN_IN_ROUTES, { initialUrl: '/profil' });
    await fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));
    expect(screen).toHavePathname('/sign-in');
    expect(screen.getByRole('button', { name: 'Continuer sans compte' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('sign-in-skip'));
    expect(screen).toHavePathname('/profil');
  });

  it('propose le lien vers la confidentialité', async () => {
    await renderRouter(SIGN_IN_ROUTES, { initialUrl: '/sign-in' });
    await fireEvent.press(screen.getByTestId('sign-in-privacy'));
    expect(screen).toHavePathname('/confidentialite');
    expect(screen.getByTestId('screen-privacy')).toBeOnTheScreen();
  });

  it('sans serveur (démo), la connexion simulée affiche le compte dans le profil', async () => {
    await renderRouter(SIGN_IN_ROUTES, { initialUrl: '/profil' });
    await fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));
    await fireEvent.press(screen.getByTestId('sign-in-demo'));
    await waitFor(() => expect(screen).toHavePathname('/profil'));
    expect(screen.getByText('Connecté·e en tant que Camille')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('profile-sign-out'));
    await waitFor(() => expect(screen.getByTestId('sign-in-prompt')).toBeOnTheScreen());
  });
});

describe('T3.5 — onboarding', () => {
  const ROUTES = {
    _layout: RootStack,
    '(tabs)/_layout': TabsLayout,
    '(tabs)/index': ExploreScreen,
    onboarding: OnboardingScreen,
  };

  beforeEach(() => resetOnboardingForTests());

  it('premier lancement : redirige vers l’onboarding ; « Passer » mène à Explorer en un geste', async () => {
    await renderRouter(ROUTES, { initialUrl: '/' });
    await waitFor(() => expect(screen).toHavePathname('/onboarding'));
    await fireEvent.press(screen.getByTestId('onboarding-skip'));
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(screen.getByTestId('screen-explore')).toBeOnTheScreen();
    expect(getOnboardingState().status).toBe('skipped');
    expect(await getStorage().getItem(ONBOARDING_KEY)).toContain('"skipped"');
  });

  it('les 3 écrans enregistrent les réponses localement', async () => {
    await renderRouter(ROUTES, { initialUrl: '/onboarding' });
    expect(screen.getByTestId('onboarding-city-pilot')).toBeSelected();
    await fireEvent.press(screen.getByTestId('onboarding-next'));
    await fireEvent.press(screen.getByTestId('onboarding-domain-alimentation'));
    await fireEvent.press(screen.getByTestId('onboarding-next'));
    await fireEvent.press(screen.getByTestId('onboarding-constraint-budget'));
    await fireEvent.press(screen.getByTestId('onboarding-next'));
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(getOnboardingState()).toMatchObject({
      status: 'completed',
      answers: { citySlug: 'bordeaux', interests: ['alimentation'], mainConstraint: 'budget' },
    });
  });

  it('copie les réponses dans le profil à la connexion, une seule fois', async () => {
    resetOnboardingForTests({
      status: 'completed',
      answers: {
        citySlug: 'bordeaux',
        cityNotCovered: false,
        interests: ['reparation_reemploi'],
        mainConstraint: 'temps',
      },
      syncedUserId: null,
    });
    const { client, calls } = fakeClient();
    expect(await syncOnboardingToProfile(client, 'u-1')).toBe(true);
    expect(calls).toEqual([
      {
        table: 'profiles',
        op: 'update',
        payload: {
          interests: ['reparation_reemploi'],
          main_constraint: 'temps',
          city_id: 'city-bdx',
        },
        filter: { id: 'u-1' },
      },
    ]);
    expect(await syncOnboardingToProfile(client, 'u-1')).toBe(false);
    expect(calls).toHaveLength(1);
  });
});

describe('T3.6 — géolocalisation', () => {
  const request = jest.mocked(ExpoLocation.requestForegroundPermissionsAsync);

  it('accordé : position précise', async () => {
    request.mockResolvedValueOnce({ status: 'granted' } as never);
    const result = await requestLocation();
    expect(result.source).toBe('device');
    expect(result.coordinates).toEqual({ latitude: 44.84, longitude: -0.57 });
  });

  it('approximatif : position acceptée et marquée comme telle', async () => {
    request.mockResolvedValueOnce({ status: 'granted', android: { accuracy: 'coarse' } } as never);
    expect((await requestLocation()).source).toBe('device_approximate');
  });

  it('refusé : centre-ville, puis le quartier choisi sur l’écran explicatif', async () => {
    request.mockResolvedValueOnce({ status: 'denied' } as never);
    expect((await requestLocation()).source).toBe('city_center');

    await renderRouter(
      { location: LocationScreen, '(tabs)/index': ExploreScreen },
      {
        initialUrl: '/location',
      },
    );
    expect(screen.getByTestId('location-denied')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('location-neighborhood-chartrons'));
    expect(getResolvedLocation()).toMatchObject({ source: 'neighborhood' });
  });

  it('l’écran explique avant toute demande système', async () => {
    request.mockClear();
    await renderRouter({ location: LocationScreen }, { initialUrl: '/location' });
    expect(screen.getByTestId('screen-location')).toBeOnTheScreen();
    expect(request).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('location-allow'));
    expect(request).toHaveBeenCalledTimes(1);
  });
});

describe('T3.7 — garde de compte', () => {
  function PlaceScreen() {
    const requireAccount = useRequireAccount();
    const router = useRouter();
    return (
      <Button label="Signaler" onPress={() => requireAccount(() => router.push('/signalement'))} />
    );
  }
  function ReportScreen() {
    return <Text testID="report-form">Formulaire de signalement</Text>;
  }
  const ROUTES = {
    _layout: RootStack,
    lieu: PlaceScreen,
    'sign-in': SignInScreen,
    signalement: ReportScreen,
  };

  it('« Signaler » anonyme → connexion → formulaire de signalement ouvert', async () => {
    await renderRouter(ROUTES, { initialUrl: '/lieu' });
    await fireEvent.press(screen.getByRole('button', { name: 'Signaler' }));
    expect(screen).toHavePathname('/sign-in');
    await fireEvent.press(screen.getByTestId('sign-in-demo'));
    await waitFor(() => expect(screen.getByTestId('report-form')).toBeOnTheScreen());
    expect(screen).toHavePathname('/signalement');
  });

  it('déjà connecté : l’action s’exécute directement', async () => {
    setAuthStateForTests({ status: 'signedIn', user: DEMO_USER });
    await renderRouter(ROUTES, { initialUrl: '/lieu' });
    await fireEvent.press(screen.getByRole('button', { name: 'Signaler' }));
    expect(screen).toHavePathname('/signalement');
  });

  it('connexion abandonnée : l’action n’est pas reprise', async () => {
    await renderRouter(ROUTES, { initialUrl: '/lieu' });
    await fireEvent.press(screen.getByRole('button', { name: 'Signaler' }));
    await fireEvent.press(screen.getByTestId('sign-in-skip'));
    expect(screen).toHavePathname('/lieu');
    expect(screen.queryByTestId('report-form')).toBeNull();
  });
});

describe('T3.8 — événements', () => {
  it('écrit ouverture et première fiche (avec durée) dans analytics_events', async () => {
    const { client, calls } = fakeClient();
    setSupabaseForTests(client);
    await trackAppOpened(1_000_000);
    await trackPlaceViewed('p-1', 1_042_000);
    await trackPlaceViewed('p-2', 1_100_000);
    const names = calls.map((c) => (c.payload as { name: string }).name);
    expect(names).toEqual(['app_opened', 'place_viewed', 'first_place_viewed', 'place_viewed']);
    const first = calls[2]?.payload as { anon_id: string; user_id: null; props: object };
    expect(first.props).toEqual({ place_id: 'p-1', seconds_since_open: 42 });
    expect(first.user_id).toBeNull();
    expect(first.anon_id).toMatch(/[0-9a-f-]{36}/);
    expect(calls.every((c) => c.table === 'analytics_events' && c.op === 'insert')).toBe(true);
  });

  it('mode démo : rien n’est envoyé, aucune erreur', async () => {
    await expect(trackAppOpened()).resolves.toBeUndefined();
  });
});
