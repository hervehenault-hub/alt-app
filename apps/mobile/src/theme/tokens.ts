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

  /** Exemples dans les champs : gris secondaire à 80 % sur fond blanc. */
  placeholder: '#6C7395',

  /** Voile derrière les feuilles modales (encre à 50 %). */
  overlay: '#101A4A80',

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

/**
 * Couleurs des marqueurs de carte par catégorie (toujours doublées d'une forme et d'une
 * lettre : la couleur seule ne porte pas l'information).
 */
export const mapColors = {
  vrac: palette.saffron,
  producteurs: '#7BB661',
  anti_gaspi: palette.coral,
  collecte: '#6AA7C8',
  reparation: '#9B7FD1',
  ressourcerie: '#E58FB2',
  cluster: palette.ink,
  clusterText: palette.white,
  stroke: palette.ink,
  userLocation: '#2F6FED',
  /** Plan simplifié hors ligne (démo). */
  land: palette.creamDeep,
  water: '#B9D8EC',
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

/**
 * Familles de polices (noms enregistrés au chargement, voir `src/theme/fonts.ts`).
 * Une famille par graisse : Android ignore `fontWeight` sur les polices personnalisées.
 */
export const fontFamilies = {
  /** Playfair Display : UNIQUEMENT les grands titres (≥ 24 pt). */
  displayBold: 'PlayfairDisplay_700Bold',
  /** Inter : tout le reste (texte, données, boutons). */
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
} as const;

/**
 * Variantes typographiques. Les tailles sont des tailles de BASE : le système les
 * agrandit selon le réglage d'accessibilité de l'utilisateur (`allowFontScaling`).
 */
/**
 * Hiérarchie typographique, du plus fort au plus discret :
 * 1. `display` — titre de l'écran (un seul par écran) ;
 * 2. `title` — titre de section ou de carte ;
 * 3. `eyebrow` — sur-titre : contexte AU-DESSUS d'un titre (catégorie, « Votre prochaine idée ») ;
 * 4. `label` — ce qu'on cherche des yeux : nom d'un lieu, valeur clé, action ;
 * 5. `body` — texte de lecture ;
 * 6. `metaStrong` — fait important d'une ligne d'infos (« Ouvert », « ≈ 4 € économisés ») ;
 * 7. `caption` — infos secondaires (distance, date, compteur), en gris ;
 * 8. `note` — apartés, mentions et exemples : italique, plus pâle (jamais d'information essentielle).
 */
export const textVariants = {
  display: { fontFamily: fontFamilies.displayBold, fontSize: 36, lineHeight: 44 },
  title: { fontFamily: fontFamilies.displayBold, fontSize: 24, lineHeight: 32 },
  eyebrow: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  body: { fontFamily: fontFamilies.regular, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fontFamilies.regular, fontSize: 13, lineHeight: 18 },
  metaStrong: { fontFamily: fontFamilies.semiBold, fontSize: 13, lineHeight: 18 },
  note: { fontFamily: fontFamilies.regular, fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  label: { fontFamily: fontFamilies.semiBold, fontSize: 16, lineHeight: 22 },
} as const;

/** Opacité des notes et des exemples (20 % plus pâles que le texte secondaire). */
export const NOTE_OPACITY = 0.8;

export type TextVariant = keyof typeof textVariants;
