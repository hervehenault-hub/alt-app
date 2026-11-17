import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import MutualAidScreen from '@/app/(tabs)/entraide';
import PublishHelpPostScreen from '@/app/entraide/publier';
import {
  createLocalMutualAidRepository,
  setMutualAidRepositoryForTests,
  type HelpPost,
} from '@/features/mutual-aid/repository';
import { setAuthStateForTests } from '@/lib/auth/session';

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
  '(tabs)/_layout': TabsLayout,
  '(tabs)/entraide': MutualAidScreen,
  'entraide/publier': PublishHelpPostScreen,
};

const USER = { id: 'moi', displayName: 'Lou', email: null, isDemo: false };
const future = new Date(Date.now() + 10 * 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();
const POSTS: HelpPost[] = [
  {
    id: 'p1',
    authorId: 'a',
    type: 'offer',
    service: 'tool_sharing',
    title: 'Perceuse à prêter',
    description: 'Le week-end.',
    neighborhoodId: 'chartrons',
    status: 'open',
    createdAt: past,
    expiresAt: future,
  },
  {
    id: 'p2',
    authorId: 'b',
    type: 'request',
    service: 'carpool',
    title: 'Covoiturage samedi',
    description: 'Vers la ferme.',
    neighborhoodId: 'bastide',
    status: 'open',
    createdAt: past,
    expiresAt: future,
  },
  {
    id: 'p3',
    authorId: 'c',
    type: 'offer',
    service: 'carpool',
    title: 'Annonce expirée',
    description: 'Ancienne.',
    neighborhoodId: 'bastide',
    status: 'open',
    createdAt: past,
    expiresAt: past,
  },
];

beforeEach(() => {
  setAuthStateForTests({ status: 'signedIn', user: USER });
  setMutualAidRepositoryForTests(createLocalMutualAidRepository('moi', () => POSTS));
});
afterEach(() => setMutualAidRepositoryForTests(undefined));

describe('Entraide', () => {
  it('T8.2 — les règles sont à accepter avant de publier', async () => {
    await renderRouter(ROUTES, { initialUrl: '/entraide' });
    await waitFor(() => expect(screen.getByTestId('mutual-aid-rules')).toBeOnTheScreen());
    expect(screen.queryByTestId('mutual-aid-publish')).toBeNull();
    await fireEvent.press(screen.getByTestId('mutual-aid-accept'));
    await waitFor(() => expect(screen.getByTestId('mutual-aid-publish')).toBeOnTheScreen());
  });

  it('T8.4 — fil filtrable, annonces expirées masquées', async () => {
    await renderRouter(ROUTES, { initialUrl: '/entraide' });
    await waitFor(() => expect(screen.getByTestId('help-post-p1')).toBeOnTheScreen());
    expect(screen.getByTestId('help-post-p2')).toBeOnTheScreen();
    expect(screen.queryByTestId('help-post-p3')).toBeNull();
    await fireEvent.press(screen.getByTestId('mutual-aid-filter-carpool'));
    expect(screen.queryByTestId('help-post-p1')).toBeNull();
    expect(screen.getByTestId('help-post-p2')).toBeOnTheScreen();
  });

  it('T8.3 / T8.4 — publier (avertissement si numéro), puis clôturer dans « Mes annonces »', async () => {
    await renderRouter(ROUTES, { initialUrl: '/entraide' });
    await fireEvent.press(await screen.findByTestId('mutual-aid-accept'));
    await fireEvent.press(await screen.findByTestId('mutual-aid-publish'));
    await fireEvent.press(screen.getByTestId('publish-service-repair_help'));
    await fireEvent.changeText(screen.getByTestId('publish-title'), 'Aide couture');
    await fireEvent.changeText(
      screen.getByTestId('publish-description'),
      'Appelez le 06 12 34 56 78',
    );
    expect(screen.getByTestId('publish-warning')).toHaveTextContent(/numéro de téléphone/);
    await fireEvent.changeText(
      screen.getByTestId('publish-description'),
      'Ourlets et boutons, avec plaisir.',
    );
    expect(screen.queryByTestId('publish-warning')).toBeNull();
    await fireEvent.press(await screen.findByTestId('publish-neighborhood-centre'));
    await fireEvent.press(screen.getByTestId('publish-submit'));
    await waitFor(() => expect(screen).toHavePathname('/entraide'));
    const mine = await screen.findByText('Aide couture');
    expect(mine).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Clôturer'));
    await waitFor(() => expect(screen.getByText('Clôturée')).toBeOnTheScreen());
  });

  it('T8.6 — signaler une annonce, bloquer un membre', async () => {
    await renderRouter(ROUTES, { initialUrl: '/entraide' });
    await fireEvent.press(await screen.findByTestId('help-report-p1'));
    expect(screen.getByTestId('help-notice-p1')).toHaveTextContent(/l’équipe va regarder/);
    await fireEvent.press(screen.getByTestId('help-block-p2'));
    await waitFor(() => expect(screen.queryByTestId('help-post-p2')).toBeNull());
  });
});
