import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Button } from '@/components';
import { colors, MIN_TOUCH_TARGET } from '@/theme';

function containerStyle(name: string) {
  const button = screen.getByRole('button', { name });
  return StyleSheet.flatten(button.props.style);
}

describe('Button', () => {
  it('expose le rôle button et son libellé, et réagit à l’appui', async () => {
    const onPress = jest.fn();
    await render(<Button label="Explorer" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Explorer' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('a une cible tactile d’au moins 44 pt', async () => {
    await render(<Button label="Valider" />);
    expect(containerStyle('Valider').minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(containerStyle('Valider').minWidth).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });

  it('primaire : fond marine et texte blanc', async () => {
    await render(<Button label="Primaire" />);
    expect(containerStyle('Primaire').backgroundColor).toBe(colors.primary);
    expect(StyleSheet.flatten(screen.getByText('Primaire').props.style).color).toBe(
      colors.onPrimary,
    );
  });

  it('secondaire : fond corail et texte marine (jamais blanc sur corail)', async () => {
    await render(<Button label="Secondaire" variant="secondary" />);
    expect(containerStyle('Secondaire').backgroundColor).toBe(colors.accent);
    const textColor = StyleSheet.flatten(screen.getByText('Secondaire').props.style).color;
    expect(textColor).toBe(colors.onAccent);
    expect(textColor).not.toBe(colors.textOnDark);
  });

  it('tertiaire : bouton texte souligné, sans fond', async () => {
    await render(<Button label="Plus tard" variant="tertiary" />);
    expect(containerStyle('Plus tard').backgroundColor).toBe('transparent');
    expect(StyleSheet.flatten(screen.getByText('Plus tard').props.style).textDecorationLine).toBe(
      'underline',
    );
  });

  it('désactivé : état annoncé et appui ignoré', async () => {
    const onPress = jest.fn();
    await render(<Button label="Envoyer" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Envoyer' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(containerStyle('Envoyer').backgroundColor).toBe(colors.disabledBackground);
  });

  it('chargement : indicateur, état « occupé » annoncé et appui bloqué', async () => {
    const onPress = jest.fn();
    await render(<Button label="Enregistrer" loading onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Enregistrer' });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    expect(button.props.accessibilityHint).toBe('Chargement en cours');
    expect(screen.getByTestId('button-loading', { includeHiddenElements: true })).toBeTruthy();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('transmet l’indication (hint) au lecteur d’écran', async () => {
    await render(<Button label="Voir" accessibilityHint="Ouvre la fiche du lieu" />);
    expect(screen.getByRole('button', { name: 'Voir' })).toHaveAccessibleName('Voir');
    expect(screen.getByRole('button', { name: 'Voir' }).props.accessibilityHint).toBe(
      'Ouvre la fiche du lieu',
    );
  });
});
