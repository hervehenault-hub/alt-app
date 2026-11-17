import { render, screen } from '@testing-library/react-native';
import { PixelRatio, StyleSheet } from 'react-native';

import { Highlight, Text } from '@/components';
import { colors, fontFamilies, textVariants, type TextVariant } from '@/theme';

const VARIANTS = Object.keys(textVariants) as TextVariant[];

describe('Text', () => {
  it.each(VARIANTS)('variante %s : polices et tailles des jetons', async (variant) => {
    await render(<Text variant={variant}>{`Exemple ${variant}`}</Text>);
    const style = StyleSheet.flatten(screen.getByText(`Exemple ${variant}`).props.style);
    expect(style.fontFamily).toBe(textVariants[variant].fontFamily);
    expect(style.fontSize).toBe(textVariants[variant].fontSize);
  });

  it('Playfair Display est réservée aux grands titres (≥ 24 pt), Inter pour le reste', () => {
    for (const variant of VARIANTS) {
      const { fontFamily, fontSize } = textVariants[variant];
      if (fontFamily === fontFamilies.displayBold) expect(fontSize).toBeGreaterThanOrEqual(24);
      else expect(fontFamily.startsWith('Inter_')).toBe(true);
    }
  });

  it('annonce display et title comme titres', async () => {
    await render(
      <>
        <Text variant="display">Grand titre</Text>
        <Text variant="title">Titre</Text>
        <Text>Paragraphe</Text>
      </>,
    );
    expect(screen.getByRole('header', { name: 'Grand titre' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Titre' })).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Paragraphe' })).toBeNull();
  });

  it('applique la couleur sémantique demandée (légende en texte secondaire par défaut)', async () => {
    await render(
      <>
        <Text variant="caption">Légende</Text>
        <Text color="textOnDark">Sur sombre</Text>
      </>,
    );
    expect(StyleSheet.flatten(screen.getByText('Légende').props.style).color).toBe(
      colors.textMuted,
    );
    expect(StyleSheet.flatten(screen.getByText('Sur sombre').props.style).color).toBe(
      colors.textOnDark,
    );
  });

  it('surligne un mot clé en safran avec du texte marine', async () => {
    await render(
      <Text>
        Trouvez du <Highlight>vrac</Highlight>
      </Text>,
    );
    const style = StyleSheet.flatten(screen.getByText('vrac').props.style);
    expect(style.backgroundColor).toBe(colors.highlight);
    expect(style.color).toBe(colors.onHighlight);
  });

  describe('à l’échelle de police 2,0 (taille de texte système maximale courante)', () => {
    beforeEach(() => {
      jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(2);
    });
    afterEach(() => jest.restoreAllMocks());

    it.each(VARIANTS)(
      'variante %s : agrandissement autorisé, sans plafond ni troncature',
      async (variant) => {
        await render(<Text variant={variant}>{`Texte ${variant}`}</Text>);
        const node = screen.getByText(`Texte ${variant}`);
        expect(PixelRatio.getFontScale()).toBe(2);
        expect(node.props.allowFontScaling).toBe(true);
        // Aucun plafond qui empêcherait d'atteindre 200 %.
        const max = node.props.maxFontSizeMultiplier as number | undefined;
        expect(max === undefined || max === 0 || max >= 2).toBe(true);
        // Le texte n'est jamais tronqué par défaut.
        expect(node.props.numberOfLines).toBeUndefined();
      },
    );
  });
});
