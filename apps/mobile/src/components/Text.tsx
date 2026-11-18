import type { ReactNode } from 'react';
import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';

import { colors, NOTE_OPACITY, textVariants, type ColorToken, type TextVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  /** Variante typographique (défaut : `body`). */
  variant?: TextVariant;
  /** Couleur sémantique (défaut : `text`, ou `textMuted` pour `caption`). */
  color?: ColorToken;
  align?: 'auto' | 'left' | 'center' | 'right';
  children?: ReactNode;
}

const HEADER_VARIANTS: readonly TextVariant[] = ['display', 'title'];
/** Variantes discrètes : gris secondaire par défaut. */
const MUTED_VARIANTS: readonly TextVariant[] = ['caption', 'eyebrow', 'note'];

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
  const resolvedColor = color ?? (MUTED_VARIANTS.includes(variant) ? 'textMuted' : 'text');
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
        variant === 'note' ? { opacity: NOTE_OPACITY } : null,
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

/**
 * Découpe `text` autour de la première occurrence de `keyword`
 * (fonction pure, utilisée par `TextWithHighlight`).
 */
export function splitHighlight(text: string, keyword: string): [string, string, string] {
  const index = keyword ? text.indexOf(keyword) : -1;
  if (index < 0) return [text, '', ''];
  return [text.slice(0, index), keyword, text.slice(index + keyword.length)];
}

/** Texte dont un mot clé (issu des traductions) est surligné en safran. */
export function TextWithHighlight({
  text,
  highlight,
  ...props
}: Omit<TextProps, 'children'> & { text: string; highlight: string }) {
  const [before, keyword, after] = splitHighlight(text, highlight);
  return (
    <Text {...props}>
      {before}
      {keyword ? <Highlight>{keyword}</Highlight> : null}
      {after}
    </Text>
  );
}
