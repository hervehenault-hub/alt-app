import { render, screen } from '@testing-library/react-native';

import ExploreScreen from '@/app/(tabs)/index';

describe('Écran d’accueil (onglet Explorer)', () => {
  it('affiche le nom de l’application et un grand titre', async () => {
    await render(<ExploreScreen />);
    expect(screen.getByText('Alt.')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Le bon plan, juste à côté' })).toBeOnTheScreen();
  });

  it('présente les 4 domaines d’accueil', async () => {
    await render(<ExploreScreen />);
    for (const name of ['Alimentation', 'Quotidien et déchets', 'Réparation', 'Réemploi']) {
      expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('les 4 domaines sont des tuiles qui ouvrent la recherche (T4.4)', async () => {
    await render(<ExploreScreen />);
    for (const name of ['Alimentation', 'Quotidien et déchets', 'Réparation', 'Réemploi']) {
      expect(screen.getByRole('button', { name })).toBeOnTheScreen();
    }
    expect(screen.getByRole('search', { name: 'Rechercher' })).toBeOnTheScreen();
  });
});
