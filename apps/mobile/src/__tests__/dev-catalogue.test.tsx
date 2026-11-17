import { render, screen } from '@testing-library/react-native';
import { renderRouter, screen as routerScreen } from 'expo-router/testing-library';
import { View } from 'react-native';

import DevCatalogueRoute from '@/app/dev/catalogue';
import CatalogueScreen, { CATALOGUE_MARKER } from '@/dev/CatalogueScreen';

declare const global: { __DEV__: boolean };

describe('Catalogue des composants (développement)', () => {
  it('présente tous les composants du design system', async () => {
    await render(<CatalogueScreen />);
    expect(screen.getByTestId(CATALOGUE_MARKER)).toBeOnTheScreen();
    for (const section of [
      'Couleurs',
      'Typographie',
      'Boutons',
      'Cartes',
      'Puces de filtre',
      'Fiabilité',
      'Champs',
      'Icônes',
      'États vides',
      'Chargement',
    ]) {
      expect(screen.getByRole('header', { name: section })).toBeOnTheScreen();
    }
    expect(screen.getByRole('button', { name: 'Action principale' })).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Rappels doux' })).toBeOnTheScreen();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(
      screen.getAllByRole('text', { name: 'Fiabilité : À revérifier' }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('image', { name: 'Ressourcerie' })).toBeOnTheScreen();
  });

  describe('route /dev/catalogue', () => {
    const initialDev = global.__DEV__;
    afterEach(() => {
      global.__DEV__ = initialDev;
    });

    function Home() {
      return <View testID="home" />;
    }

    it('en développement : affiche le catalogue', async () => {
      global.__DEV__ = true;
      await renderRouter(
        { index: Home, 'dev/catalogue': DevCatalogueRoute },
        { initialUrl: '/dev/catalogue' },
      );
      expect(routerScreen.getByTestId(CATALOGUE_MARKER)).toBeOnTheScreen();
    });

    it('en production : le catalogue n’est pas chargé, redirection vers l’accueil', async () => {
      global.__DEV__ = false;
      await renderRouter(
        { index: Home, 'dev/catalogue': DevCatalogueRoute },
        { initialUrl: '/dev/catalogue' },
      );
      expect(routerScreen).toHavePathname('/');
      expect(routerScreen.getByTestId('home')).toBeOnTheScreen();
      expect(routerScreen.queryByTestId(CATALOGUE_MARKER)).toBeNull();
    });
  });
});
