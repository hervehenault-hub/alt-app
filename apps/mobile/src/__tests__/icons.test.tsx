import { render, screen } from '@testing-library/react-native';

import { Icon } from '@/components';
import { t } from '@/i18n';
import { colors, ICON_STROKE_WIDTH } from '@/theme';
import { CATEGORY_ICONS, DOMAIN_ICONS, HOME_DOMAIN_KEYS, PLACE_CATEGORY_KEYS } from '@/theme/icons';

describe('Icônes', () => {
  it('chaque catégorie a une icône, toutes différentes', () => {
    expect(Object.keys(CATEGORY_ICONS).sort()).toEqual([...PLACE_CATEGORY_KEYS].sort());
    expect(new Set(Object.values(CATEGORY_ICONS)).size).toBe(PLACE_CATEGORY_KEYS.length);
  });

  it('chaque domaine d’accueil a une icône, toutes différentes', () => {
    expect(Object.keys(DOMAIN_ICONS).sort()).toEqual([...HOME_DOMAIN_KEYS].sort());
    expect(new Set(Object.values(DOMAIN_ICONS)).size).toBe(HOME_DOMAIN_KEYS.length);
  });

  it('chaque catégorie et domaine a un libellé français', () => {
    for (const key of PLACE_CATEGORY_KEYS) {
      expect(t(`taxonomy.categories.${key}`)).not.toContain('taxonomy.');
    }
    for (const key of HOME_DOMAIN_KEYS) {
      expect(t(`taxonomy.domains.${key}`)).not.toContain('taxonomy.');
    }
    expect(t('taxonomy.domains.quotidien_dechets')).toBe('Quotidien et déchets');
  });

  it('les icônes sont dessinées au trait marine', async () => {
    await render(<Icon icon={CATEGORY_ICONS.vrac} testID="vrac" />);
    const svg = screen.getByTestId('vrac', { includeHiddenElements: true }).children[0];
    expect(svg).toBeDefined();
    const json = JSON.stringify(screen.toJSON());
    expect(json).toContain(colors.text);
    expect(json).toContain(`"strokeWidth":${ICON_STROKE_WIDTH}`);
  });
});
