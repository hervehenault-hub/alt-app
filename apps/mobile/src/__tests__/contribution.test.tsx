import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import ProfileScreen from '@/app/(tabs)/profil';
import AddPlaceScreen from '@/app/ajouter-un-lieu';
import MyContributionsScreen from '@/app/mes-contributions';
import PlaceScreen from '@/app/place/[id]/index';
import ReportScreen from '@/app/place/[id]/signaler';
import SignInScreen from '@/app/sign-in';
import { searchAddress } from '@/features/contribution/address';
import {
  setContributionRepositoryForTests,
  type ContributionRepository,
} from '@/features/contribution/repository';
import { createDemoRepository, setPlacesRepositoryForTests } from '@/features/places/repository';
import { DEMO_USER, setAuthStateForTests } from '@/lib/auth/session';

function Layout() {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

const ROUTES = {
  _layout: Layout,
  'ajouter-un-lieu': AddPlaceScreen,
  'place/[id]/index': PlaceScreen,
  'place/[id]/signaler': ReportScreen,
  'mes-contributions': MyContributionsScreen,
  '(tabs)/profil': ProfileScreen,
  'sign-in': SignInScreen,
};

function fakeRepo(overrides: Partial<ContributionRepository> = {}) {
  const repo: ContributionRepository & { calls: unknown[] } = {
    calls: [],
    submitPlace: jest.fn(async (input) => {
      repo.calls.push(input);
      return { status: 'pending' as const };
    }),
    report: jest.fn(async () => 'reported' as const),
    confirm: jest.fn(async () => undefined),
    list: jest.fn(async () => [
      {
        id: 'a',
        kind: 'new' as const,
        name: 'Atelier Vélo Sud',
        status: 'pending' as const,
        createdAt: '2026-11-17T10:00:00Z',
      },
      {
        id: 'b',
        kind: 'new' as const,
        name: 'Épicerie Vrac',
        status: 'approved' as const,
        createdAt: '2026-11-10T10:00:00Z',
      },
      {
        id: 'c',
        kind: 'report' as const,
        name: 'La Grande Jarre',
        status: 'rejected' as const,
        createdAt: '2026-11-01T10:00:00Z',
      },
    ]),
    ...overrides,
  };
  setContributionRepositoryForTests(repo);
  return repo;
}

beforeEach(() => {
  setAuthStateForTests({ status: 'signedIn', user: DEMO_USER });
  setPlacesRepositoryForTests(createDemoRepository());
  setContributionRepositoryForTests(undefined);
});

describe('T5.2 — ajouter un lieu', () => {
  it('soumission réussie avec les 5 champs', async () => {
    const repo = fakeRepo();
    await renderRouter(ROUTES, { initialUrl: '/ajouter-un-lieu' });
    await fireEvent.changeText(screen.getByTestId('add-name'), 'Atelier Vélo Sud');
    await fireEvent.press(screen.getByTestId('add-category-reparation'));
    await fireEvent.changeText(screen.getByTestId('add-address'), '1 rue X, Bordeaux');
    await fireEvent.press(screen.getByTestId('add-hours-weekend'));
    await fireEvent(screen.getByTestId('add-free'), 'valueChange', true);
    await fireEvent.press(screen.getByTestId('add-submit'));
    await waitFor(() => expect(screen.getByTestId('screen-add-place-success')).toBeOnTheScreen());
    expect(repo.calls[0]).toMatchObject({
      name: 'Atelier Vélo Sud',
      categoryId: 'reparation',
      address: '1 rue X, Bordeaux',
      hours: 'weekend',
      isFree: true,
    });
  });

  it('champs obligatoires signalés clairement', async () => {
    const repo = fakeRepo();
    await renderRouter(ROUTES, { initialUrl: '/ajouter-un-lieu' });
    await fireEvent.press(screen.getByTestId('add-submit'));
    expect(screen.getByText('Indiquez le nom du lieu (2 caractères au moins).')).toBeOnTheScreen();
    expect(screen.getByTestId('add-category-error')).toBeOnTheScreen();
    expect(repo.submitPlace).not.toHaveBeenCalled();
  });

  it('doublon : propose la fiche existante', async () => {
    fakeRepo({
      submitPlace: jest.fn(async () => ({
        status: 'duplicate' as const,
        placeId: 'demo-01',
        name: 'La Grande Jarre',
      })),
    });
    await renderRouter(ROUTES, { initialUrl: '/ajouter-un-lieu' });
    await fireEvent.changeText(screen.getByTestId('add-name'), 'Grande Jarre');
    await fireEvent.press(screen.getByTestId('add-category-vrac'));
    await fireEvent.press(screen.getByTestId('add-submit'));
    await waitFor(() => expect(screen.getByTestId('add-duplicate')).toBeOnTheScreen());
    await fireEvent.press(screen.getByRole('button', { name: 'Voir la fiche' }));
    await waitFor(() => expect(screen).toHavePathname('/place/demo-01'));
  });

  it('autocomplétion d’adresse (API Adresse), sans erreur hors connexion', async () => {
    const fetcher = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: { label: '12 Rue Sainte-Catherine 33000 Bordeaux' },
            geometry: { coordinates: [-0.5733, 44.8389] },
          },
        ],
      }),
    })) as unknown as typeof fetch;
    expect(await searchAddress('12 rue sainte', undefined, fetcher)).toEqual([
      {
        label: '12 Rue Sainte-Catherine 33000 Bordeaux',
        coordinates: { latitude: 44.8389, longitude: -0.5733 },
      },
    ]);
    const offline = jest.fn(async () => {
      throw new Error('hors ligne');
    }) as unknown as typeof fetch;
    expect(await searchAddress('12 rue sainte', undefined, offline)).toEqual([]);
    expect(await searchAddress('12', undefined, fetcher)).toEqual([]);
  });
});

describe('T5.4 / T5.5 — signaler et confirmer', () => {
  it('deux touches suffisent : « Signaler une erreur » puis un motif', async () => {
    const repo = fakeRepo();
    await renderRouter(ROUTES, { initialUrl: '/place/demo-01' });
    await waitFor(() => expect(screen.getByTestId('screen-place')).toBeOnTheScreen());
    await fireEvent.press(screen.getByTestId('place-report')); // 1
    await waitFor(() => expect(screen.getByTestId('screen-report')).toBeOnTheScreen());
    await fireEvent.press(screen.getByTestId('report-wrong_hours')); // 2
    await waitFor(() => expect(screen.getByTestId('report-result')).toBeOnTheScreen());
    expect(repo.report).toHaveBeenCalledWith(
      'demo-01',
      'La Grande Jarre',
      'wrong_hours',
      undefined,
    );
  });

  it('un second signalement le même mois est accueilli sans erreur', async () => {
    fakeRepo({ report: jest.fn(async () => 'already_reported' as const) });
    await renderRouter(ROUTES, { initialUrl: '/place/demo-01/signaler' });
    await fireEvent.press(screen.getByTestId('report-closed'));
    await waitFor(() =>
      expect(screen.getByTestId('report-result')).toHaveTextContent(/déjà signalé/),
    );
  });

  it('« Oui, c’est exact » confirme la fiche', async () => {
    const repo = fakeRepo();
    await renderRouter(ROUTES, { initialUrl: '/place/demo-01' });
    await waitFor(() => expect(screen.getByTestId('place-confirm')).toBeOnTheScreen());
    await fireEvent.press(screen.getByTestId('place-confirm-yes'));
    expect(screen.getByTestId('place-confirm-thanks')).toBeOnTheScreen();
    expect(repo.confirm).toHaveBeenCalledWith('demo-01');
  });

  it('sans compte, confirmer ouvre la connexion', async () => {
    setAuthStateForTests({ status: 'signedOut', user: null });
    fakeRepo();
    await renderRouter(ROUTES, { initialUrl: '/place/demo-01' });
    await waitFor(() => expect(screen.getByTestId('place-confirm')).toBeOnTheScreen());
    await fireEvent.press(screen.getByTestId('place-confirm-yes'));
    expect(screen).toHavePathname('/sign-in');
  });
});

describe('T5.13 — mes contributions', () => {
  it('affiche les 3 statuts, depuis le profil', async () => {
    fakeRepo();
    await renderRouter(ROUTES, { initialUrl: '/profil' });
    await fireEvent.press(screen.getByTestId('profile-contributions'));
    await waitFor(() => expect(screen.getByTestId('contribution-a')).toBeOnTheScreen());
    expect(screen.getByTestId('contribution-a')).toHaveTextContent(/En cours de vérification/);
    expect(screen.getByTestId('contribution-b')).toHaveTextContent(/Publié, merci !/);
    expect(screen.getByTestId('contribution-c')).toHaveTextContent(/Non retenu/);
  });
});
