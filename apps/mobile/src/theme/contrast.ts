import { palette, type PaletteColor } from './tokens';

/**
 * Contraste WCAG 2.2 et liste des associations de couleurs AUTORISÉES.
 * Toute nouvelle association texte/fond doit être ajoutée ici : le test
 * `tokens.contrast.test.ts` vérifie qu'elle respecte le seuil.
 */

/** Usage d'une association, qui détermine le seuil minimal. */
export type ContrastUsage =
  /** Texte courant : ≥ 4,5:1 (WCAG 1.4.3). */
  | 'text'
  /** Grands titres (≥ 24 pt) : ≥ 3:1. */
  | 'largeText'
  /** Composants d'interface et icônes porteuses d'information : ≥ 3:1 (WCAG 1.4.11). */
  | 'ui';

export const MIN_CONTRAST: Record<ContrastUsage, number> = {
  text: 4.5,
  largeText: 3,
  ui: 3,
};

export interface ColorPair {
  foreground: PaletteColor;
  background: PaletteColor;
  usage: ContrastUsage;
  /** Où l'association est employée. */
  note: string;
}

export const ALLOWED_PAIRS: readonly ColorPair[] = [
  // Texte courant
  { foreground: 'ink', background: 'cream', usage: 'text', note: 'texte principal' },
  { foreground: 'ink', background: 'white', usage: 'text', note: 'texte sur carte blanche' },
  { foreground: 'ink', background: 'creamDeep', usage: 'text', note: 'texte sur carte crème' },
  { foreground: 'ink', background: 'sky', usage: 'text', note: 'texte sur secondaire' },
  { foreground: 'ink', background: 'skySoft', usage: 'text', note: 'carte pastel bleue' },
  { foreground: 'ink', background: 'coralSoft', usage: 'text', note: 'carte pastel corail' },
  { foreground: 'ink', background: 'saffronSoft', usage: 'text', note: 'carte pastel safran' },
  { foreground: 'ink', background: 'saffron', usage: 'text', note: 'surlignage safran' },
  { foreground: 'ink', background: 'coral', usage: 'text', note: 'bouton secondaire' },
  { foreground: 'ink', background: 'inkLine', usage: 'text', note: 'puces inactives' },
  { foreground: 'white', background: 'ink', usage: 'text', note: 'bouton primaire' },
  { foreground: 'cream', background: 'ink', usage: 'text', note: 'fond sombre' },
  { foreground: 'saffron', background: 'ink', usage: 'text', note: 'accent sur fond sombre' },
  { foreground: 'inkMuted', background: 'cream', usage: 'text', note: 'texte secondaire' },
  { foreground: 'inkMuted', background: 'white', usage: 'text', note: 'texte secondaire' },
  { foreground: 'inkMuted', background: 'inkLine', usage: 'text', note: 'bouton désactivé' },
  { foreground: 'inkMuted', background: 'skySoft', usage: 'text', note: 'légende sur carte' },

  // Composants d'interface (bordures, pistes d'interrupteur, icônes)
  { foreground: 'inkMuted', background: 'cream', usage: 'ui', note: 'bordure de champ' },
  { foreground: 'inkMuted', background: 'white', usage: 'ui', note: 'bordure de champ' },
  { foreground: 'ink', background: 'cream', usage: 'ui', note: 'icônes au trait' },
  { foreground: 'coral', background: 'ink', usage: 'ui', note: 'anneau de focus sur sombre' },
];

/**
 * Associations purement DÉCORATIVES, exemptées de contraste (WCAG 1.4.3 :
 * « texte ou image faisant partie d'un élément décoratif »). Ne jamais y porter
 * d'information ; ne pas les utiliser pour du texte lisible.
 */
export const DECORATIVE_PAIRS: readonly Omit<ColorPair, 'usage'>[] = [
  { foreground: 'coral', background: 'cream', note: 'grands éléments décoratifs uniquement' },
  { foreground: 'saffron', background: 'cream', note: 'formes organiques de fond' },
];

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminance relative d'une couleur `#RRGGBB` (définition WCAG). */
export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) throw new Error(`Couleur invalide : ${hex}`);
  const [r, g, b] = match.slice(1).map((part) => channel(parseInt(part, 16))) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport de contraste WCAG entre deux couleurs (de 1 à 21). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (light + 0.05) / (dark + 0.05);
}

/** Associations qui ne respectent pas leur seuil (liste vide = tout va bien). */
export function findContrastViolations(pairs: readonly ColorPair[]) {
  return pairs
    .map((pair) => ({
      ...pair,
      ratio: contrastRatio(palette[pair.foreground], palette[pair.background]),
      minimum: MIN_CONTRAST[pair.usage],
    }))
    .filter(({ ratio, minimum }) => ratio < minimum);
}
