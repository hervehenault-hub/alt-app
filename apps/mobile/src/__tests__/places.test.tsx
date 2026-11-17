import type { PlaceSummary } from '@alt/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import ExploreScreen from '@/app/(tabs)/index';
import PlaceScreen from '@/app/place/[id]/index';
import SearchScreen from '@/app/search';
import SignInScreen from '@/app/sign-in';
import {
  createDemoRepository,
  setPlacesRepositoryForTests,
  type PlacesRepository,
} from '@/features/places/repository';
import { FiltersSheet } from '@/features/places/components/FiltersSheet';
import { NeedSuggestions } from '@/features/places/components/NeedSuggestions';
import { PlaceList } from '@/features/places/components/PlaceList';
import { DEFAULT_FILTERS, FILTERS_KEY, getSearchState } from '@/features/places/searchState';
import { getStorage } from '@/lib/storage';

function QueryLayout() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

const ROUTES = {
  _layout: QueryLayout,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': ExploreScreen,
  search: SearchScreen,
  'place/[id]/index': PlaceScreen,
  'sign-in': SignInScreen,
};

/** Dépôt de démo qui enregistre les paramètres reçus. */
function spyRepository() {
  const demo = createDemoRepository(() => new Date('2026-11-18T09:00:00Z'));
  const calls: Parameters<PlacesRepository['search']>[0][] = [];
  const repo: PlacesRepository = {
    ...demo,
    search: (params) => {
      calls.push(params);
      return demo.search(params);
    },
  };
  setPlacesRepositoryForTests(repo);
  return calls;
}

const SAMPLE: PlaceSummary = {
  id: 'p1',
  name: 'La Grande Jarre',
  categoryId: 'vrac',
  address: null,
  latitude: 44.84,
  longitude: -0.57,
  distanceM: 350,
  isOpen: true,
  isFree: false,
  walkAccessible: true,
  transitAccessible: true,
  priceHint: null,
  estimatedSavingEur: 4.2,
  status: 'merchant_confirmed',
  needsRecheck: false,
  lastVerifiedAt: '2026-11-10T09:00:00Z',
};

describe('T4.4 — Explorer', () => {
  it('une tuile lance la recherche filtrée sur ses catégories', async () => {
    const calls = spyRepository();
    await renderRouter(ROUTES, { initialUrl: '/' });
    await fireEvent.press(screen.getByTestId('explore-tile-reparation'));
    expect(screen).toHavePathname('/search');
    await waitFor(() => expect(screen.getAllByTestId(/^place-card-/).length).toBeGreaterThan(0));
    expect(calls.at(-1)?.categoryIds).toEqual(['reparation']);
    expect(screen.getByTestId('search-domain-chip')).toBeOnTheScreen();
    expect(screen.getByText('Repair Café de la Bastide')).toBeOnTheScreen();
  });

  it('la barre de recherche est l’action principale', async () => {
    await renderRouter(ROUTES, { initialUrl: '/' });
    expect(screen.getByRole('search', { name: 'Rechercher' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('explore-search'));
    expect(screen).toHavePathname('/search');
  });
});

describe('T4.5 — suggestions de besoins', () => {
  it('3 suggestions au plus, chacune est un bouton nommé', async () => {
    const onSelect = jest.fn();
    const suggestions = ['a', 'b', 'c', 'd'].map((id) => ({
      id,
      label: `Besoin ${id}`,
      categories: ['reparation' as const],
      score: 1,
    }));
    await render(<NeedSuggestions suggestions={suggestions} onSelect={onSelect} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    await fireEvent.press(screen.getByRole('button', { name: 'Besoin b' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });

  it('la saisie « grille » propose « Grille-pain en panne » et le choisir lance la recherche', async () => {
    spyRepository();
    await renderRouter(ROUTES, { initialUrl: '/search' });
    await fireEvent(screen.getByTestId('search-input'), 'focus');
    await fireEvent.changeText(screen.getByTestId('search-input'), 'grille');
    await waitFor(() =>
      expect(screen.getByTestId('need-suggestion-grille-pain-en-panne')).toBeOnTheScreen(),
    );
    await fireEvent.press(screen.getByTestId('need-suggestion-grille-pain-en-panne'));
    expect(getSearchState().q).toBe('Grille-pain en panne');
    await waitFor(() => expect(screen.getByText('Repair Café de la Bastide')).toBeOnTheScreen());
  });
});

describe('T4.6 — liste de résultats : 4 états', () => {
  const base = {
    onRetry: jest.fn(),
    onOpenPlace: jest.fn(),
    onAddPlace: jest.fn(),
  };

  it('chargement', async () => {
    await render(<PlaceList {...base} places={[]} isLoading isError={false} />);
    expect(screen.getByTestId('place-list-loading')).toBeOnTheScreen();
  });

  it('vide, avec « Ajouter un lieu »', async () => {
    await render(<PlaceList {...base} places={[]} isLoading={false} isError={false} />);
    expect(screen.getByTestId('place-list-empty')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter un lieu' }));
    expect(base.onAddPlace).toHaveBeenCalled();
  });

  it('erreur, avec « Réessayer »', async () => {
    await render(<PlaceList {...base} places={[]} isLoading={false} isError />);
    await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
    expect(base.onRetry).toHaveBeenCalled();
  });

  it('résultats : nom, distance, ouverture, économie, fiabilité', async () => {
    await render(<PlaceList {...base} places={[SAMPLE]} isLoading={false} isError={false} />);
    expect(screen.getByText('La Grande Jarre')).toBeOnTheScreen();
    expect(screen.getByText('Vrac · 350 m')).toBeOnTheScreen();
    expect(screen.getByText('Ouvert')).toBeOnTheScreen();
    expect(screen.getByText('≈ 4,20 € économisés')).toBeOnTheScreen();
    expect(screen.getByText('Confirmé par le commerce')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('place-card-p1'));
    expect(base.onOpenPlace).toHaveBeenCalledWith('p1');
  });
});

describe('T4.7 / T4.8 — carte et filtres', () => {
  it('basculer carte / liste conserve la recherche', async () => {
    spyRepository();
    await renderRouter(ROUTES, { initialUrl: '/search' });
    await fireEvent.changeText(screen.getByTestId('search-input'), 'vrac');
    await fireEvent.press(screen.getByRole('radio', { name: 'Carte' }));
    expect(screen.getByTestId('place-map')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: 'Liste' }));
    expect(screen.getByTestId('search-input').props.value).toBe('vrac');
  });

  it('les filtres sont appliqués à la requête et mémorisés', async () => {
    const calls = spyRepository();
    await renderRouter(ROUTES, { initialUrl: '/search' });
    await fireEvent.press(screen.getByTestId('search-filters'));
    await fireEvent.press(screen.getByRole('radio', { name: '1 km' }));
    await fireEvent(screen.getByTestId('filters-free'), 'valueChange', true);
    await fireEvent.press(screen.getByRole('radio', { name: 'Économie' }));
    await fireEvent.press(screen.getByTestId('filters-apply'));
    await waitFor(() =>
      expect(calls.at(-1)).toMatchObject({ radiusM: 1000, freeOnly: true, sortBy: 'saving' }),
    );
    expect(JSON.parse((await getStorage().getItem(FILTERS_KEY)) ?? '{}')).toMatchObject({
      radiusM: 1000,
      freeOnly: true,
      sortBy: 'saving',
    });
    expect(screen.getByRole('button', { name: 'Filtres (3)' })).toBeOnTheScreen();
  });

  it('« Réinitialiser » remet les valeurs par défaut', async () => {
    const onApply = jest.fn();
    await render(
      <FiltersSheet
        visible
        filters={{ ...DEFAULT_FILTERS, openNow: true }}
        onApply={onApply}
        onClose={jest.fn()}
      />,
    );
    await fireEvent.press(screen.getByTestId('filters-reset'));
    await fireEvent.press(screen.getByTestId('filters-apply'));
    expect(onApply).toHaveBeenCalledWith(DEFAULT_FILTERS);
  });
});

describe('T4.9 — fiche lieu', () => {
  it('rendu complet par lien profond /place/:id', async () => {
    spyRepository();
    await renderRouter(ROUTES, { initialUrl: '/place/demo-01' });
    await waitFor(() => expect(screen.getByTestId('screen-place')).toBeOnTheScreen());
    expect(screen).toHavePathname('/place/demo-01');
    expect(screen.getByText('La Grande Jarre')).toBeOnTheScreen();
    expect(screen.getByTestId('place-address')).toHaveTextContent(/rue Sainte-Catherine/);
    expect(screen.getByRole('button', { name: 'Copier l’adresse' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Itinéraire' })).toBeOnTheScreen();
    expect(screen.getByTestId('place-hours')).toHaveTextContent(/Mardi.*10:00 – 19:30/);
    expect(screen.getByTestId('place-verified')).toHaveTextContent('Vérifié le 10 novembre 2026');
    expect(screen.getByTestId('place-saving')).toHaveTextContent('≈ 4,20 € par visite');
    await fireEvent.press(screen.getByTestId('place-how-computed'));
    expect(screen.getByTestId('place-saving-basis')).toBeOnTheScreen();
    expect(screen.getByText('Confirmé par le commerce')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Signaler une erreur' })).toBeOnTheScreen();
  });

  it('« Signaler une erreur » sans compte ouvre la connexion', async () => {
    spyRepository();
    await renderRouter(ROUTES, { initialUrl: '/place/demo-01' });
    await waitFor(() => expect(screen.getByTestId('screen-place')).toBeOnTheScreen());
    await fireEvent.press(screen.getByTestId('place-report'));
    expect(screen).toHavePathname('/sign-in');
  });

  it('fiche inconnue : message clair', async () => {
    spyRepository();
    await renderRouter(ROUTES, { initialUrl: '/place/inconnu' });
    await waitFor(() => expect(screen.getByTestId('screen-place-not-found')).toBeOnTheScreen());
  });
});
