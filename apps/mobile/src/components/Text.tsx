import type { ReactNode } from 'react';
import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';

import { colors, textVariants, type ColorToken, type TextVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  /** Variante typographique (défaut : `body`). */
  variant?: TextVariant;
  /** Couleur sémantique (défaut : `text`, ou `textMuted` pour `caption`). */
  color?: ColorToken;
  align?: 'auto' | 'left' | 'center' | 'right';
  children?: ReactNode;
}

const HEADER_VARIANTS: readonly TextVariant[] = ['display', 'title'];

/**
 * Texte de l'app. Respecte toujours la taille de police choisie par l'utilisateur
 * (`allowFontScaling`, sans plafond inférieur à 200 %). Les variantes `display` et
 * `title` (Playfair Display) sont annoncées comme titres aux lecteurs d'écran.
 */
export function Text({
  variant = 'body',
  color,
  align,
  style,
  accessibilityRole,
  children,
  ...rest
}: TextProps) {
  const resolvedColor = color ?? (variant === 'caption' ? 'textMuted' : 'text');
  return (
    <RNText
      allowFontScaling
      accessibilityRole={
        accessibilityRole ?? (HEADER_VARIANTS.includes(variant) ? 'header' : undefined)
      }
      {...rest}
      style={[
        textVariants[variant],
        { color: colors[resolvedColor] },
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

/**
 * Mot clé surligné en safran, à placer DANS un `Text` :
 * `<Text>Trouvez du <Highlight>vrac</Highlight></Text>`.
 * Le safran est toujours associé à du texte marine.
 */
export function Highlight({ children }: { children: ReactNode }) {
  return (
    <RNText allowFontScaling style={styles.highlight}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  highlight: {
    backgroundColor: colors.highlight,
    color: colors.onHighlight,
  },
});
