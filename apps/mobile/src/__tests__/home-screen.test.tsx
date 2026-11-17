import { render, screen } from '@testing-library/react-native';

import HomeScreen from '@/app/index';

describe("Écran d'accueil", () => {
  it('affiche le nom de l’application comme titre', async () => {
    await render(<HomeScreen />);
    expect(screen.getByRole('header', { name: 'Alt.' })).toBeOnTheScreen();
  });
});
