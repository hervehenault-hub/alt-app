import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { t } from '@/i18n';
import { colors, MIN_TOUCH_TARGET, radii, spacing, type ColorToken } from '@/theme';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  /** Texte du bouton (déjà traduit), aussi lu par les lecteurs d'écran. */
  label: string;
  /**
   * - `primary` : fond marine, texte blanc (action principale) ;
   * - `secondary` : fond corail, texte marine (jamais de blanc sur corail) ;
   * - `tertiary` : bouton texte, souligné.
   */
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Affiche un indicateur et bloque l'appui. */
  loading?: boolean;
  /** Icône facultative placée avant le libellé (décorative). */
  icon?: ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_COLORS: Record<ButtonVariant, { background?: ColorToken; text: ColorToken }> = {
  primary: { background: 'primary', text: 'onPrimary' },
  secondary: { background: 'accent', text: 'onAccent' },
  tertiary: { text: 'text' },
};

/** Bouton accessible : rôle `button`, libellé, états annoncés, hauteur ≥ 44 pt. */
export function Button({
  label,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  accessibilityHint,
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading;
  const palette = VARIANT_COLORS[variant];
  const textColor: ColorToken = disabled ? 'disabledText' : palette.text;
  const background =
    variant === 'tertiary'
      ? 'transparent'
      : colors[disabled ? 'disabledBackground' : (palette.background ?? 'primary')];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={loading ? t('ui.loading') : accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        variant === 'tertiary' ? styles.tertiary : styles.filled,
        { backgroundColor: background },
        fullWidth && styles.fullWidth,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          testID="button-loading"
          color={colors[textColor]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : icon ? (
        <View
          style={styles.icon}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {icon}
        </View>
      ) : null}
      <Text
        variant="label"
        color={textColor}
        align="center"
        style={variant === 'tertiary' ? styles.underline : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  filled: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  tertiary: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  icon: { marginRight: spacing.xxs },
  underline: { textDecorationLine: 'underline' },
});
