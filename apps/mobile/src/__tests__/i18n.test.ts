import { t, type TranslationKey } from '@/i18n';

describe('t()', () => {
  it('renvoie la chaîne française d’une clé', () => {
    expect(t('common.appName')).toBe('Alt.');
  });

  it('remplace les paramètres {{…}}', () => {
    expect(t('home.categoryHint', { category: 'Vrac' })).toBe(
      'Afficher les lieux de la catégorie Vrac',
    );
  });

  it('laisse un marqueur sans valeur tel quel', () => {
    expect(t('home.categoryHint', {})).toContain('{{category}}');
  });

  it('renvoie la clé si elle est inconnue (garde-fou à l’exécution)', () => {
    expect(t('inconnu.cle' as TranslationKey)).toBe('inconnu.cle');
  });
});
