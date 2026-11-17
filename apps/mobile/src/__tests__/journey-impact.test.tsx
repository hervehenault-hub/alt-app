import { FORBIDDEN_WORDS } from '@alt/shared';
import { Stack } from 'expo-router';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import ImpactScreen from '@/app/(tabs)/impact';
import JourneyScreen from '@/app/(tabs)/parcours';
import SearchScreen from '@/app/search';
import HistoryScreen from '@/app/historique';
import MethodScreen from '@/app/methode/[metric]';
import { ACTIONS } from '@/features/journey/content';
import {
  createLocalProgressRepository,
  setProgressRepositoryForTests,
} from '@/features/journey/progress';
import { getSearchState } from '@/features/places/searchState';
import { fr } from '@/i18n/fr';
import { setAuthStateForTests } from '@/lib/auth/session';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function Layout() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

const ROUTES = {
  _layout: Layout,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/parcours': JourneyScreen,
  '(tabs)/impact': ImpactScreen,
  historique: HistoryScreen,
  'methode/[metric]': MethodScreen,
  search: SearchScreen,
};

const USER = { id: 'u-1', displayName: 'Lou', email: null, isDemo: false };

beforeEach(() => {
  setAuthStateForTests({ status: 'signedIn', user: USER });
  setProgressRepositoryForTests(createLocalProgressRepository());
});

async function openJourney() {
  await renderRouter(ROUTES, { initialUrl: '/parcours' });
  await waitFor(() => expect(screen.getByTestId('journey-action')).toBeOnTheScreen());
  return screen.getByTestId('journey-action-title').props.children as string;
}

describe('T6.5 — écran Parcours', () => {
  it('« Je l’ai fait » : félicitation, puis une autre idée', async () => {
    const first = await openJourney();
    await fireEvent.press(screen.getByTestId('journey-done'));
    expect(screen.getByTestId('journey-bravo')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('journey-next'));
    expect(screen.getByTestId('journey-action-title')).not.toHaveTextContent(first);
  });

  it('« Plus tard » et « Pas pour moi » proposent une autre idée', async () => {
    const first = await openJourney();
    await fireEvent.press(screen.getByTestId('journey-later'));
    const second = screen.getByTestId('journey-action-title').props.children as string;
    expect(second).not.toBe(first);
    await fireEvent.press(screen.getByTestId('journey-not-for-me'));
    expect(screen.getByTestId('journey-action-title')).not.toHaveTextContent(second);
  });

  it('« Trouver près de moi » ouvre une recherche préfiltrée', async () => {
    await openJourney();
    // la première idée proposée par défaut est liée à une catégorie de lieu
    await fireEvent.press(screen.getByTestId('journey-find-nearby'));
    expect(screen).toHavePathname('/search');
    expect(getSearchState().categoryIds.length).toBe(1);
  });

  it('sans compte : invitation à se connecter', async () => {
    setAuthStateForTests({ status: 'signedOut', user: null });
    await renderRouter(ROUTES, { initialUrl: '/parcours' });
    expect(screen.getByTestId('sign-in-prompt')).toBeOnTheScreen();
  });
});

describe('T6.6 / T6.7 — rythme, refaire, historique', () => {
  it('le rythme choisi fixe la prochaine échéance', async () => {
    await openJourney();
    await fireEvent.press(screen.getByTestId('journey-done'));
    await fireEvent.press(screen.getByRole('radio', { name: 'Deux fois par semaine' }));
    expect(screen.getByTestId('journey-next-date')).toHaveTextContent(/Prochaine idée à partir du/);
    await fireEvent.press(screen.getByRole('radio', { name: 'À mon rythme' }));
    expect(screen.getByTestId('journey-next-date')).toHaveTextContent(
      'Une nouvelle idée quand vous le souhaitez.',
    );
  });

  it('« Je l’ai refait » ajoute une occurrence visible dans l’historique', async () => {
    const habit = ACTIONS.find((a) => a.kind === 'habitude');
    expect(habit).toBeDefined();
    const repo = createLocalProgressRepository();
    await repo.record('u-1', { actionId: habit!.id, status: 'fait', at: '2026-11-10T10:00:00Z' });
    await repo.record('u-1', { actionId: habit!.id, status: 'fait', at: '2026-11-12T10:00:00Z' });
    setProgressRepositoryForTests(repo);
    await renderRouter(ROUTES, { initialUrl: '/historique' });
    await waitFor(() => expect(screen.getByTestId(`history-${habit!.id}`)).toBeOnTheScreen());
    expect(screen.getByTestId(`history-${habit!.id}`)).toHaveTextContent(/Fait 2 fois/);
  });
});

describe('T7.3 à T7.5 — Impact, bloc collectif, méthode', () => {
  it('état de départ encourageant quand tout est à zéro, bloc collectif affiché', async () => {
    await renderRouter(ROUTES, { initialUrl: '/impact' });
    await waitFor(() => expect(screen.getByTestId('impact-zero')).toBeOnTheScreen());
    expect(screen.getByTestId('impact-collective')).toBeOnTheScreen();
  });

  it('bloc collectif visible même sans compte', async () => {
    setAuthStateForTests({ status: 'signedOut', user: null });
    await renderRouter(ROUTES, { initialUrl: '/impact' });
    expect(screen.getByTestId('impact-collective')).toBeOnTheScreen();
  });

  it('chaque chiffre mène à « Méthode et sources »', async () => {
    const repo = createLocalProgressRepository();
    await repo.record('u-1', {
      actionId: 'reparer-telephone',
      status: 'fait',
      at: new Date().toISOString(),
    });
    setProgressRepositoryForTests(repo);
    await renderRouter(ROUTES, { initialUrl: '/impact' });
    await waitFor(() => expect(screen.getByTestId('impact-month')).toBeOnTheScreen());
    expect(screen.getByTestId('impact-month')).toHaveTextContent(/200 €/);
    for (const [id, metric] of [
      ['impact-month', 'saving'],
      ['impact-equivalence', 'impact'],
      ['impact-count', 'count'],
      ['impact-city-method', 'city'],
    ] as const) {
      await fireEvent.press(screen.getByTestId(id));
      expect(screen).toHavePathname(`/methode/${metric}`);
      expect(screen.getByTestId('method-formula')).toBeOnTheScreen();
      await fireEvent.press(screen.getByText('Retour'));
    }
  });

  it('la méthode de l’impact liste des facteurs sourcés', async () => {
    await renderRouter(ROUTES, { initialUrl: '/methode/impact' });
    expect(screen.getAllByText('Voir la source').length).toBeGreaterThan(0);
  });
});

describe('T6.8 — garde-fou de ton', () => {
  const strings: string[] = [];
  const walk = (node: unknown) => {
    if (typeof node === 'string') strings.push(node);
    else if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };
  walk(fr);
  ACTIONS.forEach((a) => strings.push(a.title, a.body));

  it.each(FORBIDDEN_WORDS)('aucune chaîne ni action ne contient « %s »', (word) => {
    const offenders = strings.filter((s) => s.toLowerCase().includes(word));
    expect(offenders).toEqual([]);
  });

  it('aucune formulation négative dans l’Impact', () => {
    const impactStrings: string[] = [];
    const collect = (node: unknown) => {
      if (typeof node === 'string') impactStrings.push(node.toLowerCase());
      else if (node && typeof node === 'object') Object.values(node).forEach(collect);
    };
    collect(fr.impact);
    for (const word of ['retard', 'trop', 'insuffisant', 'pas assez', 'raté']) {
      expect(impactStrings.filter((s) => s.includes(word))).toEqual([]);
    }
  });
});
