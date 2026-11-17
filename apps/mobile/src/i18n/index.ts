import { fr, type Translations } from './fr';

/** Toutes les clés pointées valides, ex. `'home.tagline'`. */
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Leaves<Translations>;

export type TranslationParams = Record<string, string | number>;

function lookup(key: string): string | undefined {
  let node: unknown = fr;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * Renvoie la chaîne française associée à `key`.
 * Les paramètres remplacent les marqueurs `{{nom}}` (ex. `t('home.categoryHint', { category: 'Vrac' })`).
 */
export function t(key: TranslationKey, params?: TranslationParams): string {
  const template = lookup(key);
  if (template === undefined) {
    // Ne devrait pas arriver grâce au typage ; on rend la clé pour la repérer à l'écran.
    return key;
  }
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
