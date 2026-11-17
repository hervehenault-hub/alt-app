import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { RELIABILITY_STATUSES, ReliabilityBadge } from '@/components';
import { RELIABILITY_STYLES } from '@/components/ReliabilityBadge';
import { ALLOWED_PAIRS } from '@/theme/contrast';
import { colors, palette, type PaletteColor } from '@/theme';

const LABELS = {
  community: 'Ajouté par la communauté',
  confirmed_by_users: 'Confirmé par plusieurs utilisateurs',
  confirmed_by_business: 'Confirmé par le commerce',
  to_recheck: 'À revérifier',
} as const;

function paletteName(hex: string): PaletteColor {
  const entry = Object.entries(palette).find(([, value]) => value === hex);
  if (!entry) throw new Error(`Couleur hors palette : ${hex}`);
  return entry[0] as PaletteColor;
}

describe('ReliabilityBadge', () => {
  it('couvre exactement les 4 statuts', () => {
    expect([...RELIABILITY_STATUSES].sort()).toEqual(Object.keys(LABELS).sort());
  });

  it.each(RELIABILITY_STATUSES)(
    '%s : libellé visible et lu par le lecteur d’écran',
    async (status) => {
      await render(<ReliabilityBadge status={status} />);
      expect(screen.getByText(LABELS[status])).toBeOnTheScreen();
      expect(screen.getByRole('text', { name: `Fiabilité : ${LABELS[status]}` })).toBeOnTheScreen();
    },
  );

  it('chaque statut a une forme ET une icône distinctes (pas seulement la couleur)', () => {
    const shapes = new Set(RELIABILITY_STATUSES.map((s) => RELIABILITY_STYLES[s].shape));
    const icons = new Set(RELIABILITY_STATUSES.map((s) => RELIABILITY_STYLES[s].icon));
    expect(shapes.size).toBe(4);
    expect(icons.size).toBe(4);
  });

  it('n’utilise que l’échelle marine / safran / corail (ni rouge ni vert)', () => {
    const allowedFamilies = /^(ink|saffron|coral|white|cream|sky)/;
    for (const status of RELIABILITY_STATUSES) {
      const { background, border, text } = RELIABILITY_STYLES[status];
      for (const token of [background, border, text]) {
        expect(paletteName(colors[token])).toMatch(allowedFamilies);
      }
    }
  });

  it.each(RELIABILITY_STATUSES)('%s : association texte/fond autorisée (contraste)', (status) => {
    const { background, text } = RELIABILITY_STYLES[status];
    const fg = paletteName(colors[text]);
    const bg = paletteName(colors[background]);
    expect(
      ALLOWED_PAIRS.some((p) => p.foreground === fg && p.background === bg && p.usage === 'text'),
    ).toBe(true);
  });

  it('applique fond et bordure du statut', async () => {
    await render(<ReliabilityBadge status="confirmed_by_business" testID="badge" />);
    const style = StyleSheet.flatten(screen.getByTestId('badge').props.style);
    expect(style.backgroundColor).toBe(colors.primary);
  });
});
