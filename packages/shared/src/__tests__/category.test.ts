import { CATEGORIES, categorySchema, isCategory } from '../schemas/category';

describe('categorySchema', () => {
  it('accepte chaque catégorie connue', () => {
    for (const category of CATEGORIES) {
      expect(categorySchema.parse(category)).toBe(category);
    }
  });

  it('refuse une catégorie inconnue', () => {
    expect(isCategory('supermarche')).toBe(false);
    expect(isCategory(42)).toBe(false);
  });
});
