import type { PlaceCategory } from '@alt/shared';

type Tags = Readonly<Record<string, string>>;
type Rule = { category: PlaceCategory; matches: (tags: Tags) => boolean };

const is =
  (key: string, ...values: string[]) =>
  (tags: Tags) =>
    tags[key] !== undefined && values.includes(tags[key]);

/**
 * Règles de correspondance, par ordre de priorité : d'abord la nature principale du lieu
 * (type de commerce ou d'équipement), ensuite les attributs secondaires (vente en vrac, service
 * de réparation). La première règle satisfaite donne la catégorie principale.
 * Détail et justification : scripts/import-osm/README.md.
 */
export const CATEGORY_RULES: readonly Rule[] = [
  { category: 'vrac', matches: is('shop', 'zero_waste') },
  { category: 'producteurs', matches: is('shop', 'farm') },
  { category: 'producteurs', matches: is('amenity', 'marketplace') },
  { category: 'ressourcerie', matches: is('shop', 'second_hand', 'charity') },
  { category: 'reparation', matches: is('repair_cafe', 'yes') },
  { category: 'reparation', matches: is('craft', 'shoemaker', 'tailor') },
  { category: 'reparation', matches: is('shop', 'repair') },
  { category: 'collecte', matches: is('amenity', 'recycling') },
  // Attributs secondaires
  { category: 'vrac', matches: is('bulk_purchase', 'yes', 'only') },
  {
    category: 'reparation',
    matches: (tags) => tags.shop !== undefined && tags.repair !== undefined && tags.repair !== 'no',
  },
  { category: 'reparation', matches: is('service:bicycle:repair', 'yes') },
  // anti_gaspi : aucun tag OSM fiable, catégorie alimentée à la main (voir README).
];

/** Catégories Alt. reconnues pour ces tags (sans doublon, la principale en premier). */
export function classifyTags(tags: Tags | undefined): PlaceCategory[] {
  if (!tags) return [];
  // Lieux non accessibles au public (ex. conteneurs d'une résidence) : ignorés.
  if (tags.access === 'private' || tags.access === 'no') return [];
  const found: PlaceCategory[] = [];
  for (const rule of CATEGORY_RULES) {
    if (rule.matches(tags) && !found.includes(rule.category)) found.push(rule.category);
  }
  return found;
}
