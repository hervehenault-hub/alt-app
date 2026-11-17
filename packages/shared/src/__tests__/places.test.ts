import type { PlaceCategory } from '../content/schemas';
import {
  isOpenAt,
  mapPlaceJson,
  mapSearchRows,
  normalizeSearchText,
  searchPlacesLocal,
  suggestNeeds,
  type LocalPlace,
} from '../places';
import { NEEDS } from '../places/needs';

const LABELS: Record<PlaceCategory, string> = {
  vrac: 'Vrac',
  producteurs: 'Producteurs locaux',
  anti_gaspi: 'Anti-gaspi',
  collecte: 'Collecte et tri',
  reparation: 'Réparation',
  ressourcerie: 'Ressourcerie et seconde main',
};

const ORIGIN = { latitude: 10, longitude: 10 };
const WEDNESDAY_10H = new Date('2026-11-18T09:00:00Z'); // 10:00 à Paris

function place(
  name: string,
  categoryId: PlaceCategory,
  km: number,
  extra: Partial<LocalPlace> = {},
): LocalPlace {
  return {
    id: name,
    name,
    categoryId,
    categoryLabel: LABELS[categoryId],
    domainId: 'alimentation',
    address: null,
    latitude: 10 + km * 0.008993,
    longitude: 10,
    isOpen: null,
    isFree: false,
    walkAccessible: false,
    transitAccessible: false,
    priceHint: null,
    estimatedSavingEur: null,
    savingBasis: null,
    status: 'community',
    needsRecheck: false,
    lastVerifiedAt: '2026-11-01',
    source: 'manual',
    license: null,
    openingHours: [],
    ...extra,
  };
}

const PLACES: LocalPlace[] = [
  place('Épicerie Vrac du Centre', 'vrac', 0.2, {
    estimatedSavingEur: 3,
    openingHours: [1, 2, 3, 4, 5, 6, 7].map((d) => ({
      weekday: d,
      opens: '08:00',
      closes: '20:00',
    })),
  }),
  place('La Recharge', 'vrac', 0.05, { needsRecheck: true, estimatedSavingEur: 10 }),
  place('Boulangerie Anti-gaspi', 'anti_gaspi', 0.3),
  place('Repair Café Bastide', 'reparation', 0.8, {
    isFree: true,
    walkAccessible: true,
    openingHours: [{ weekday: 6, opens: '14:00', closes: '18:00' }],
  }),
  place('Ressourcerie Le Grenier', 'ressourcerie', 2, {
    transitAccessible: true,
    estimatedSavingEur: 15,
  }),
  place('Ferme des Deux Rives', 'producteurs', 4),
  place('Brouillon vrac', 'vrac', 0, { published: false }),
  place('Vrac lointain', 'vrac', 20),
];

const ctx = { needs: NEEDS, categoryLabels: LABELS, now: WEDNESDAY_10H };
const names = (params: Parameters<typeof searchPlacesLocal>[1]) =>
  searchPlacesLocal(PLACES, { origin: ORIGIN, ...params }, ctx).items.map((p) => p.name);

describe('recherche locale (mêmes scénarios que search_places)', () => {
  it('« vrac » : catégorie, brouillon et lieu lointain exclus, fiche à revérifier en dernier', () => {
    expect(names({ q: 'vrac' })).toEqual(['Épicerie Vrac du Centre', 'La Recharge']);
  });
  it('sans accents ni majuscules, fautes tolérées', () => {
    expect(names({ q: 'EPICERIE' })[0]).toBe('Épicerie Vrac du Centre');
    expect(names({ q: 'ressourcery' })[0]).toBe('Ressourcerie Le Grenier');
  });
  it('besoin « grille-pain » → réparation', () => {
    expect(names({ q: 'grille-pain' })).toEqual(['Repair Café Bastide']);
  });
  it('rayon, ouvert maintenant, gratuit, transport, à pied', () => {
    expect(names({ radiusM: 1000 })).toEqual([
      'Épicerie Vrac du Centre',
      'Boulangerie Anti-gaspi',
      'Repair Café Bastide',
      'La Recharge',
    ]);
    expect(names({ openNow: true })).toEqual(['Épicerie Vrac du Centre']);
    expect(names({ freeOnly: true })).toEqual(['Repair Café Bastide']);
    expect(names({ transitOnly: true })).toEqual(['Ressourcerie Le Grenier']);
    expect(names({ walkOnly: true })).toEqual(['Repair Café Bastide']);
  });
  it('tri par économie, pagination, total', () => {
    const bySaving = names({ sortBy: 'saving' });
    expect(bySaving.slice(0, 2)).toEqual(['Ressourcerie Le Grenier', 'Épicerie Vrac du Centre']);
    expect(bySaving.at(-1)).toBe('La Recharge');
    const page = searchPlacesLocal(PLACES, { origin: ORIGIN, pageSize: 2, pageOffset: 2 }, ctx);
    expect(page.items.map((p) => p.name)).toEqual([
      'Repair Café Bastide',
      'Ressourcerie Le Grenier',
    ]);
    expect(page.total).toBe(6);
  });
});

describe('horaires (même règle que is_open_now)', () => {
  const lunch = [
    { weekday: 1, opens: '09:00', closes: '12:30' },
    { weekday: 1, opens: '14:00', closes: '19:00' },
  ];
  it('pause midi, bornes, dimanche, sans horaires', () => {
    expect(isOpenAt(lunch, new Date('2026-11-16T09:00:00Z'))).toBe(true); // lundi 10:00
    expect(isOpenAt(lunch, new Date('2026-11-16T12:00:00Z'))).toBe(false); // 13:00
    expect(isOpenAt(lunch, new Date('2026-11-16T11:30:00Z'))).toBe(false); // 12:30 pile
    expect(isOpenAt(lunch, new Date('2026-11-22T10:00:00Z'))).toBe(false); // dimanche
    expect(isOpenAt([], new Date())).toBeNull();
  });
  it('créneau après minuit', () => {
    const late = [{ weekday: 5, opens: '22:00', closes: '02:00' }];
    expect(isOpenAt(late, new Date('2026-11-21T00:30:00Z'))).toBe(true); // samedi 01:30
    expect(isOpenAt(late, new Date('2026-11-21T02:30:00Z'))).toBe(false); // samedi 03:30
  });
});

describe('suggestions de besoins', () => {
  it('3 suggestions au plus, sans accents', () => {
    expect(suggestNeeds(NEEDS, 'grille')[0]?.id).toBe('grille-pain-en-panne');
    expect(suggestNeeds(NEEDS, 'restes de legumes')[0]?.id).toBe('restes-de-legumes');
    expect(suggestNeeds(NEEDS, 'e', 3)).toEqual([]);
    expect(suggestNeeds(NEEDS, 'velo').length).toBeLessThanOrEqual(3);
  });
  it('normalise comme la base', () => {
    expect(normalizeSearchText('  Grille-Pain  CASSÉ ! ')).toBe('grille pain casse');
  });
});

describe('conversion des réponses SQL', () => {
  it('lignes de search_places', () => {
    const page = mapSearchRows([
      {
        id: 'a',
        name: 'A',
        category_id: 'vrac',
        address: null,
        latitude: 1,
        longitude: 2,
        distance_m: 120.5,
        is_open: true,
        is_free: false,
        walk_accessible: true,
        transit_accessible: false,
        price_hint: null,
        estimated_saving_eur: '4.50',
        status: 'community',
        needs_recheck: false,
        last_verified_at: '2026-11-01T00:00:00Z',
        total_count: '12',
      },
    ]);
    expect(page.total).toBe(12);
    expect(page.items[0]).toMatchObject({
      categoryId: 'vrac',
      estimatedSavingEur: 4.5,
      distanceM: 120.5,
    });
    expect(mapSearchRows([])).toEqual({ items: [], total: 0 });
  });
  it('JSON de get_place', () => {
    expect(mapPlaceJson(null)).toBeNull();
    const detail = mapPlaceJson({
      id: 'a',
      name: 'A',
      category_id: 'reparation',
      category_label: 'Réparation',
      opening_hours: [{ weekday: 6, opens: '14:00', closes: '18:00' }],
      estimated_saving_eur: null,
      last_verified_at: '2026-11-01',
    });
    expect(detail?.openingHours).toHaveLength(1);
    expect(detail?.categoryLabel).toBe('Réparation');
  });
});
