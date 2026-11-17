import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';

import { SegmentedControl, TextField, Toggle } from '@/components';
import { MIN_TOUCH_TARGET } from '@/theme';

describe('TextField', () => {
  afterEach(() => jest.restoreAllMocks());

  it('associe le libellé visible au champ et transmet la saisie', async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Adresse e-mail" onChangeText={onChangeText} helper="Aide" />);
    expect(screen.getByText('Adresse e-mail')).toBeOnTheScreen();
    const input = screen.getByLabelText('Adresse e-mail');
    await fireEvent.changeText(input, 'a@b.fr');
    expect(onChangeText).toHaveBeenCalledWith('a@b.fr');
    expect(input.props.accessibilityHint).toBe('Aide');
    expect(input.props.allowFontScaling).toBe(true);
  });

  it('annonce l’erreur (live region, indication et annonce explicite)', async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    await render(<TextField label="Code postal" error="5 chiffres attendus" testID="cp" />);
    expect(screen.getByText('5 chiffres attendus')).toBeOnTheScreen();
    expect(screen.getByTestId('cp-error').props.accessibilityLiveRegion).toBe('polite');
    expect(screen.getByLabelText('Code postal').props.accessibilityHint).toBe(
      'Erreur : 5 chiffres attendus',
    );
    expect(announce).toHaveBeenCalledWith('Erreur : 5 chiffres attendus');
  });

  it('a une hauteur ≥ 44 pt', async () => {
    await render(<TextField label="Nom" />);
    const style = StyleSheet.flatten(screen.getByLabelText('Nom').props.style);
    expect(style.minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });

  it('désactivé : état annoncé', async () => {
    await render(<TextField label="Ville" editable={false} />);
    expect(screen.getByLabelText('Ville')).toBeDisabled();
  });
});

function SegmentedHarness() {
  const [value, setValue] = useState<'list' | 'map'>('list');
  return (
    <SegmentedControl
      label="Affichage"
      value={value}
      onChange={setValue}
      options={[
        { value: 'list', label: 'Liste' },
        { value: 'map', label: 'Carte' },
      ]}
    />
  );
}

describe('SegmentedControl', () => {
  it('groupe radio accessible : option active annoncée et changement à l’appui', async () => {
    await render(<SegmentedHarness />);
    // Le groupe n'est pas focalisable (sinon iOS masquerait les options) : on vérifie son rôle.
    expect(screen.getByLabelText('Affichage').props.accessibilityRole).toBe('radiogroup');
    expect(screen.getByRole('radio', { name: 'Liste' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Carte' })).not.toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Carte' }));
    expect(screen.getByRole('radio', { name: 'Carte' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Liste' })).not.toBeChecked();
  });

  it('chaque option fait au moins 44 pt de haut', async () => {
    await render(<SegmentedHarness />);
    for (const name of ['Liste', 'Carte']) {
      const style = StyleSheet.flatten(screen.getByRole('radio', { name }).props.style);
      expect(style.minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    }
  });
});

function ToggleHarness({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState(false);
  return (
    <Toggle
      label="Notifications"
      description="Rappels hebdomadaires"
      value={value}
      onValueChange={setValue}
      disabled={disabled}
    />
  );
}

describe('Toggle', () => {
  it('rôle switch, état annoncé, bascule à l’appui', async () => {
    await render(<ToggleHarness />);
    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    expect(toggle).not.toBeChecked();
    expect(toggle.props.accessibilityHint).toBe('Rappels hebdomadaires');
    await fireEvent.press(toggle);
    expect(screen.getByRole('switch', { name: 'Notifications' })).toBeChecked();
  });

  it('désactivé : ne bascule pas', async () => {
    await render(<ToggleHarness disabled />);
    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    expect(toggle).toBeDisabled();
    await fireEvent.press(toggle);
    expect(screen.getByRole('switch', { name: 'Notifications' })).not.toBeChecked();
  });

  it('ligne entière ≥ 44 pt', async () => {
    await render(<ToggleHarness />);
    const style = StyleSheet.flatten(
      screen.getByRole('switch', { name: 'Notifications' }).props.style,
    );
    expect(style.minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });
});
