import {
  Armchair,
  Carrot,
  Croissant,
  Hammer,
  House,
  Recycle,
  Repeat2,
  ShoppingBasket,
  Tractor,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * Icônes (lucide-react-native, au trait marine via le composant `Icon`) associées
 * aux catégories de lieux et aux domaines de l'écran d'accueil.
 */

/** Catégories de lieux (identifiants techniques). */
export const PLACE_CATEGORY_KEYS = [
  'vrac',
  'producteurs',
  'anti_gaspi',
  'reparation',
  'ressourcerie',
  'collecte',
] as const;

export type PlaceCategoryKey = (typeof PLACE_CATEGORY_KEYS)[number];

export const CATEGORY_ICONS: Record<PlaceCategoryKey, LucideIcon> = {
  vrac: ShoppingBasket,
  producteurs: Tractor,
  anti_gaspi: Croissant,
  reparation: Wrench,
  ressourcerie: Armchair,
  collecte: Recycle,
};

/** Les 4 domaines d'accueil. */
export const HOME_DOMAIN_KEYS = [
  'alimentation',
  'quotidien_dechets',
  'reparation',
  'reemploi',
] as const;

export type HomeDomainKey = (typeof HOME_DOMAIN_KEYS)[number];

export const DOMAIN_ICONS: Record<HomeDomainKey, LucideIcon> = {
  alimentation: Carrot,
  quotidien_dechets: House,
  reparation: Hammer,
  reemploi: Repeat2,
};
