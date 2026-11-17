import { ALLOWED_PAIRS, contrastRatio, findContrastViolations, type ColorPair } from './contrast';
import { palette } from './tokens';

describe('Contraste des couleurs (WCAG 2.2 AA)', () => {
  it('calcule les rapports de référence', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it.each(ALLOWED_PAIRS.map((pair) => [pair.foreground, pair.background, pair.usage, pair]))(
    '%s sur %s (%s) respecte le seuil',
    (_fg, _bg, _usage, pair) => {
      expect(findContrastViolations([pair as ColorPair])).toEqual([]);
    },
  );

  it('aucune association autorisée ne descend sous son seuil', () => {
    expect(findContrastViolations(ALLOWED_PAIRS)).toEqual([]);
  });

  it('refuse le blanc sur corail (≈ 2,8:1), même pour un grand titre', () => {
    const ratio = contrastRatio(palette.white, palette.coral);
    expect(ratio).toBeLessThan(3);
    const whiteOnCoral: ColorPair[] = [
      { foreground: 'white', background: 'coral', usage: 'text', note: 'interdit' },
      { foreground: 'white', background: 'coral', usage: 'largeText', note: 'interdit' },
    ];
    expect(findContrastViolations([...ALLOWED_PAIRS, ...whiteOnCoral])).toHaveLength(2);
  });

  it('le blanc sur corail ne figure pas dans les associations autorisées', () => {
    expect(ALLOWED_PAIRS.some((p) => p.background === 'coral' && p.foreground === 'white')).toBe(
      false,
    );
  });

  it('le safran n’est associé qu’à du texte marine', () => {
    const onSaffron = ALLOWED_PAIRS.filter(
      (p) => p.background === 'saffron' || p.background === 'saffronSoft',
    );
    expect(onSaffron.every((p) => p.foreground === 'ink')).toBe(true);
  });
});
