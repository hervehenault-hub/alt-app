import type { Category } from '@alt/shared';

/** Libellés des catégories d'alternatives (une entrée par catégorie de @alt/shared). */
export const categories = {
  vrac: 'Vrac',
  reparation: 'Réparation',
  reemploi: 'Réemploi',
  anti_gaspi: 'Anti-gaspi',
  producteur_local: 'Producteurs locaux',
} as const satisfies Record<Category, string>;
