import { PLACE_CATEGORIES, type PlaceCategory } from '@alt/shared';
import type { LucideIcon } from 'lucide-react-native';
import Armchair from 'lucide-react-native/icons/armchair';
import Carrot from 'lucide-react-native/icons/carrot';
import Croissant from 'lucide-react-native/icons/croissant';
import Hammer from 'lucide-react-native/icons/hammer';
import House from 'lucide-react-native/icons/house';
import Recycle from 'lucide-react-native/icons/recycle';
import Repeat2 from 'lucide-react-native/icons/repeat-2';
import ShoppingBasket from 'lucide-react-native/icons/shopping-basket';
import Tractor from 'lucide-react-native/icons/tractor';
import Wrench from 'lucide-react-native/icons/wrench';

/**
 * Icônes (lucide-react-native, au trait marine via le composant `Icon`) associées
 * aux catégories de lieux et aux domaines de l'écran d'accueil.
 */

/** Catégories de lieux : la liste de référence vient de `@alt/shared`. */
export const PLACE_CATEGORY_KEYS = PLACE_CATEGORIES;

export type PlaceCategoryKey = PlaceCategory;

export const CATEGORY_ICONS: Record<PlaceCategoryKey, LucideIcon> = {
  vrac: ShoppingBasket,
  producteurs: Tractor,
  anti_gaspi: Croissant,
  reparation: Wrench,
  ressourcerie: Armchair,
  collecte: Recycle,
};

/**
 * Les 4 domaines de l'écran d'accueil. (Distincts des 3 domaines du parcours de
 * `@alt/shared`, où réparation et réemploi sont regroupés.)
 */
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
