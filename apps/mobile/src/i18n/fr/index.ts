/**
 * Toutes les chaînes françaises, regroupées par fonctionnalité.
 * Pour une nouvelle fonctionnalité : créer `fr/<fonctionnalité>.ts` puis l'ajouter ici.
 * On AJOUTE des clés, on ne réécrit pas celles des autres.
 */
import { categories } from './categories';
import { common } from './common';
import { home } from './home';
import { reliability } from './reliability';
import { ui } from './ui';

export const fr = {
  categories,
  common,
  home,
  reliability,
  ui,
} as const;

export type Translations = typeof fr;
