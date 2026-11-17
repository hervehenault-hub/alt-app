import { formatDistance, isCategory } from '@alt/shared';

import { HOME_CATEGORIES } from '@/lib/categories';

describe('Import du paquet partagé depuis l’app mobile', () => {
  it('utilise les types et fonctions de @alt/shared', () => {
    expect(HOME_CATEGORIES.every(isCategory)).toBe(true);
    expect(formatDistance(1234)).toBe('1,2 km');
  });
});
