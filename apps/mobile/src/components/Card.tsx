import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, organicRadii, radii, shadows, spacing, type ColorToken } from '@/theme';

export type CardTone = 'white' | 'coral' | 'saffron' | 'sky' | 'cream';

const TONE_BACKGROUND: Record<CardTone, ColorToken> = {
  white: 'surface',
  coral: 'pastelCoral',
  saffron: 'pastelSaffron',
  sky: 'pastelSky',
  cream: 'surfaceAlt',
};

interface BaseCardProps {
  children: ReactNode;
  /** Teinte pastel de la carte (le texte reste marine). */
  tone?: CardTone;
  /** Forme organique (coins asymétriques) plutôt que coins réguliers. */
  organic?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface StaticCardProps extends BaseCardProps {
  onPress?: undefined;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

interface PressableCardProps extends BaseCardProps {
  /** Rend la carte entière appuyable (rôle `button`). */
  onPress: () => void;
  /** Obligatoire pour une carte appuyable : résumé lu par le lecteur d'écran. */
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export type CardProps = StaticCardProps | PressableCardProps;

/** Carte arrondie aux teintes pastel. */
export function Card({
  children,
  tone = 'white',
  organic = false,
  style,
  testID,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const cardStyle = [
    styles.card,
    organic ? organicRadii : null,
    { backgroundColor: colors[TONE_BACKGROUND[tone]] },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID}
      style={cardStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  pressed: { opacity: 0.85 },
});
