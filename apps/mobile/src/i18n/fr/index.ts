/**
 * Toutes les chaînes françaises, regroupées par fonctionnalité.
 * Pour une nouvelle fonctionnalité : créer `fr/<fonctionnalité>.ts` puis l'ajouter ici.
 * On AJOUTE des clés, on ne réécrit pas celles des autres.
 */
import { auth } from './auth';
import { categories } from './categories';
import { common } from './common';
import { devCatalogue } from './devCatalogue';
import { home } from './home';
import { impact } from './impact';
import { journey } from './journey';
import { location } from './location';
import { navigation } from './navigation';
import { onboarding } from './onboarding';
import { places } from './places';
import { privacy } from './privacy';
import { reliability } from './reliability';
import { signInPrompt } from './signInPrompt';
import { taxonomy } from './taxonomy';
import { ui } from './ui';

export const fr = {
  auth,
  categories,
  common,
  devCatalogue,
  home,
  impact,
  journey,
  location,
  navigation,
  onboarding,
  places,
  privacy,
  reliability,
  signInPrompt,
  taxonomy,
  ui,
} as const;

export type Translations = typeof fr;
