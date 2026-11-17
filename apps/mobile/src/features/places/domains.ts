import type { PlaceCategory } from '@alt/shared';

import type { HomeDomainKey } from '@/theme/icons';

/** Tuiles d'Explorer → catégories recherchées. */
export const DOMAIN_CATEGORIES: Record<HomeDomainKey, PlaceCategory[]> = {
  alimentation: ['vrac', 'producteurs', 'anti_gaspi'],
  quotidien_dechets: ['collecte', 'vrac'],
  reparation: ['reparation'],
  reemploi: ['ressourcerie'],
};
