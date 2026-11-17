/**
 * Jetons de design d'Alt. — direction artistique « Soleil et éditorial ».
 *
 * SEUL fichier de l'app autorisé à contenir des couleurs hexadécimales
 * (vérifié par `src/theme/__tests__/no-hex-outside-tokens.test.ts`).
 * Les composants importent `colors`, `spacing`, `radii`, `shadows`… depuis `@/theme`.
 *
 * Règles de contraste (vérifiées par `tokens.contrast.test.ts`) :
 * - jamais de texte blanc sur corail (≈ 2,8:1) ;
 * - boutons : marine + texte blanc, ou corail + texte marine ;
 * - safran uniquement avec du texte marine ;
 * - corail en texte sur crème : réservé aux grands éléments décoratifs.
 */

/** Palette de base. */
export const palette = {
  /** Encre marine : texte, fonds sombres, icônes au trait. */
  ink: '#101A4A',
  /** Corail : action, accents. */
  coral: '#FF6B4A',
  /** Safran : mise en valeur (toujours avec du texte marine). */
  saffron: '#FFB81C',
  /** Crème : fond principal. */
  cream: '#FFF3E0',
  /**
   * Secondaire PROVISOIRE (bleu ciel pâle). Nommé `sky` pour être remplacé
   * facilement (par exemple par un lilas) sans toucher aux composants.
   */
  sky: '#CFE4F2',
  white: '#FFFFFF',

  // Dérivés pastel (fonds de cartes, puces, badges).
  coralSoft: '#FFDCD2',
  saffronSoft: '#FFE9B8',
  skySoft: '#E7F1F8',
  creamDeep: '#FBE6C6',

  // Nuances d'encre (texte secondaire, bordures, états inactifs).
  inkMuted: '#47507A',
  inkSubtle: '#8A8FA8',
  inkLine: '#E4DCCB',
} as const;

export type PaletteColor = keyof typeof palette;

/** Couleurs sémantiques : ce que les composants utilisent. */
export const colors = {
  background: palette.cream,
  surface: palette.white,
  surfaceAlt: palette.creamDeep,

  text: palette.ink,
  textMuted: palette.inkMuted,
  textOnDark: palette.white,
  textOnAccent: palette.ink,

  primary: palette.ink,
  onPrimary: palette.white,
  accent: palette.coral,
  onAccent: palette.ink,
  highlight: palette.saffron,
  onHighlight: palette.ink,
  secondary: palette.sky,

  /** Bordure des composants interactifs (≥ 3:1 sur le fond, WCAG 1.4.11). */
  border: palette.inkMuted,
  /** Séparateurs décoratifs (non porteurs d'information). */
  divider: palette.inkLine,
  focus: palette.coral,

  disabledBackground: palette.inkLine,
  disabledText: palette.inkMuted,

  skeleton: palette.creamDeep,

  // Teintes pastel des cartes.
  pastelCoral: palette.coralSoft,
  pastelSaffron: palette.saffronSoft,
  pastelSky: palette.skySoft,
} as const;

export type ColorToken = keyof typeof colors;

/** Espacements : échelle de 4. */
export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Rayons d'arrondi (formes généreuses, organiques). */
export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  /** Forme « pilule » (boutons, puces). */
  pill: 999,
} as const;

/** Rayons asymétriques pour des formes organiques (cartes, illustrations). */
export const organicRadii = {
  borderTopLeftRadius: 32,
  borderTopRightRadius: 20,
  borderBottomRightRadius: 36,
  borderBottomLeftRadius: 16,
} as const;

/** Ombres légères, teintées d'encre. */
export const shadows = {
  none: {
    shadowColor: palette.ink,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sm: {
    shadowColor: palette.ink,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  md: {
    shadowColor: palette.ink,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

/** Taille minimale des cibles tactiles (WCAG 2.2 / règle du projet). */
export const MIN_TOUCH_TARGET = 44;

/** Épaisseur du trait des icônes. */
export const ICON_STROKE_WIDTH = 2;

/** Taille de texte à partir de laquelle on parle de « grand texte » (WCAG : 24 px / 18,66 px gras). */
export const LARGE_TEXT_MIN_SIZE = 24;
