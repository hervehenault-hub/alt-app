import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Description sous le libellé (aussi lue comme indication). */
  description?: string;
  disabled?: boolean;
  testID?: string;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 24;

/**
 * Interrupteur (rôle `switch`, état `checked` annoncé). Toute la ligne est
 * appuyable (≥ 44 pt). Activé : piste marine, pastille à droite avec coche.
 */
export function Toggle({
  label,
  value,
  onValueChange,
  description,
  disabled = false,
  testID,
}: ToggleProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[styles.row, disabled && styles.disabled]}
    >
      <View style={styles.texts}>
        <Text variant="label">{label}</Text>
        {description ? <Text variant="caption">{description}</Text> : null}
      </View>
      <View
        style={[styles.track, value ? styles.trackOn : styles.trackOff]}
        testID={testID ? `${testID}-track` : undefined}
      >
        <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]}>
          {value ? <Icon icon={Check} size={16} color="text" /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'stretch',
  },
  texts: { flex: 1, gap: spacing.xxs },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radii.pill,
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  trackOff: { backgroundColor: colors.surface, borderColor: colors.border },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOn: { alignSelf: 'flex-end', backgroundColor: colors.surface },
  thumbOff: { alignSelf: 'flex-start', backgroundColor: colors.border },
  disabled: { opacity: 0.5 },
});
