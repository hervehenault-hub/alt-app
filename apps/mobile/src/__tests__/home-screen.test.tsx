import { fireEvent, render, screen } from '@testing-library/react-native';

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

  it('propose chaque catégorie comme filtre sélectionnable', async () => {
    await render(<ExploreScreen />);
    const names = [
      'Vrac',
      'Producteurs locaux',
      'Anti-gaspi',
      'Réparation',
      'Ressourcerie',
      'Points de collecte',
    ];
    for (const name of names) {
      expect(screen.getByRole('button', { name })).toBeOnTheScreen();
    }
    await fireEvent.press(screen.getByRole('button', { name: 'Vrac' }));
    expect(screen.getByRole('button', { name: 'Vrac' })).toBeSelected();
  });
});
