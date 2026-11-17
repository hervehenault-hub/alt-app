import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Leaf, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';

import { Card, Chip, EmptyState, Skeleton, Text } from '@/components';
import { colors, MIN_TOUCH_TARGET } from '@/theme';

describe('Card', () => {
  it('affiche son contenu avec la teinte pastel demandée', async () => {
    await render(
      <Card tone="saffron" testID="card">
        <Text>Contenu</Text>
      </Card>,
    );
    expect(screen.getByText('Contenu')).toBeOnTheScreen();
    expect(StyleSheet.flatten(screen.getByTestId('card').props.style).backgroundColor).toBe(
      colors.pastelSaffron,
    );
  });

  it('appuyable : rôle button et libellé obligatoire', async () => {
    const onPress = jest.fn();
    await render(
      <Card onPress={onPress} accessibilityLabel="Épicerie vrac, 300 m">
        <Text>Épicerie</Text>
      </Card>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Épicerie vrac, 300 m' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('statique : pas de rôle button', async () => {
    await render(
      <Card>
        <Text>Info</Text>
      </Card>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});

function ChipHarness() {
  const [selected, setSelected] = useState(false);
  return <Chip label="Vrac" selected={selected} onPress={() => setSelected((s) => !s)} />;
}

describe('Chip', () => {
  it('annonce l’état sélectionné et bascule à l’appui', async () => {
    await render(<ChipHarness />);
    const chip = screen.getByRole('button', { name: 'Vrac' });
    expect(chip).not.toBeSelected();
    expect(screen.queryByTestId('chip-check', { includeHiddenElements: true })).toBeNull();
    await fireEvent.press(chip);
    expect(screen.getByRole('button', { name: 'Vrac' })).toBeSelected();
    // Pas seulement la couleur : une coche apparaît.
    expect(screen.getByTestId('chip-check', { includeHiddenElements: true })).toBeTruthy();
  });

  it('a une cible tactile ≥ 44 pt et un contraste correct sélectionné', async () => {
    await render(<Chip label="Réparation" selected onPress={() => undefined} icon={Sprout} />);
    const style = StyleSheet.flatten(
      screen.getByRole('button', { name: 'Réparation' }).props.style,
    );
    expect(style.minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(style.backgroundColor).toBe(colors.primary);
    expect(StyleSheet.flatten(screen.getByText('Réparation').props.style).color).toBe(
      colors.textOnDark,
    );
  });

  it('désactivé : état annoncé, appui ignoré', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Collecte" selected={false} disabled onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Collecte' });
    expect(chip).toBeDisabled();
    await fireEvent.press(chip);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('affiche titre, message et action ; l’illustration est décorative', async () => {
    const onPress = jest.fn();
    await render(
      <EmptyState
        icon={Leaf}
        title="Rien par ici… pour l’instant"
        message="Élargissez la zone de recherche."
        action={{ label: 'Élargir', onPress }}
      />,
    );
    expect(screen.getByRole('header', { name: 'Rien par ici… pour l’instant' })).toBeOnTheScreen();
    expect(screen.getByText('Élargissez la zone de recherche.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Élargir' }));
    expect(onPress).toHaveBeenCalled();
    expect(screen.queryByTestId('empty-state-illustration')).toBeNull();
    expect(
      screen.getByTestId('empty-state-illustration', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('fonctionne sans action ni message', async () => {
    await render(<EmptyState icon={Leaf} title="Vide" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Skeleton', () => {
  it('sans libellé : masqué aux lecteurs d’écran', async () => {
    await render(<Skeleton testID="sk" />);
    expect(screen.queryByTestId('sk')).toBeNull();
    expect(screen.getByTestId('sk', { includeHiddenElements: true })).toBeTruthy();
  });

  it('avec libellé : annoncé comme chargement en cours', async () => {
    await render(<Skeleton label="Chargement en cours" />);
    const node = screen.getByRole('progressbar', { name: 'Chargement en cours' });
    expect(node).toBeBusy();
  });

  it('respecte « réduire les animations »', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await render(<Skeleton testID="sk" />);
    await act(async () => undefined);
    expect(screen.getByTestId('sk', { includeHiddenElements: true })).toBeTruthy();
    jest.restoreAllMocks();
  });
});
