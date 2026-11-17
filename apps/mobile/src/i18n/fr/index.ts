/**
 * Toutes les chaînes françaises, regroupées par fonctionnalité.
 * Pour une nouvelle fonctionnalité : créer `fr/<fonctionnalité>.ts` puis l'ajouter ici.
 * On AJOUTE des clés, on ne réécrit pas celles des autres.
 */
import { categories } from './categories';
import { common } from './common';
import { home } from './home';
import { navigation } from './navigation';
import { reliability } from './reliability';
import { signInPrompt } from './signInPrompt';
import { taxonomy } from './taxonomy';
import { ui } from './ui';

export const fr = {
  categories,
  common,
  home,
  navigation,
  reliability,
  signInPrompt,
  taxonomy,
  ui,
} as const;

export type Translations = typeof fr;
