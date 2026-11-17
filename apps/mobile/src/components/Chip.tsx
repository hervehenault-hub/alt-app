import type { LucideIcon } from 'lucide-react-native';
import Check from 'lucide-react-native/icons/check';
import { Pressable, StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface ChipProps {
  /** Libellé du filtre (déjà traduit). */
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Icône facultative (décorative) avant le libellé. */
  icon?: LucideIcon;
  accessibilityHint?: string;
  disabled?: boolean;
  testID?: string;
}

/**
 * Puce de filtre sélectionnable. L'état sélectionné est annoncé aux lecteurs
 * d'écran (`accessibilityState.selected`) et visible autrement que par la
 * couleur : coche, fond plein et bordure épaisse.
 */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  accessibilityHint,
  disabled = false,
  testID,
}: ChipProps) {
  const textColor = selected ? 'textOnDark' : 'text';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.unselected,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {selected ? (
        <Icon icon={Check} size={18} color={textColor} testID="chip-check" />
      ) : icon ? (
        <Icon icon={icon} size={18} color={textColor} />
      ) : null}
      <Text variant="label" color={textColor}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  unselected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
});
