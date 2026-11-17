import CircleAlert from 'lucide-react-native/icons/circle-alert';
import { useEffect, useId, useState } from 'react';
import { AccessibilityInfo, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { t } from '@/i18n';
import { colors, MIN_TOUCH_TARGET, radii, spacing, textVariants } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  /** Libellé visible au-dessus du champ (et lu par le lecteur d'écran). */
  label: string;
  /** Aide affichée sous le champ. */
  helper?: string;
  /** Message d'erreur : affiché, annoncé, et marqué par une icône (pas seulement la couleur). */
  error?: string;
  testID?: string;
}

/** Champ de saisie avec libellé, aide et erreur annoncée. */
export function TextField({
  label,
  helper,
  error,
  testID,
  editable = true,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const errorId = useId();

  // iOS n'a pas de « live region » : on annonce l'erreur explicitement.
  useEffect(() => {
    if (error) AccessibilityInfo.announceForAccessibility(t('ui.fieldError', { message: error }));
  }, [error]);

  return (
    <View style={styles.container}>
      <Text variant="label">{label}</Text>
      <TextInput
        testID={testID}
        allowFontScaling
        accessibilityLabel={label}
        accessibilityHint={error ? t('ui.fieldError', { message: error }) : helper}
        accessibilityState={{ disabled: !editable }}
        aria-describedby={error ? errorId : undefined}
        editable={editable}
        placeholderTextColor={colors.textMuted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...rest}
        style={[
          styles.input,
          focused && styles.focused,
          error ? styles.inputError : null,
          !editable && styles.disabled,
        ]}
      />
      {error ? (
        <View
          nativeID={errorId}
          style={styles.message}
          accessibilityLiveRegion="polite"
          testID={testID ? `${testID}-error` : undefined}
        >
          <Icon icon={CircleAlert} size={18} color="text" />
          <Text variant="caption" color="text" style={styles.messageText}>
            {error}
          </Text>
        </View>
      ) : helper ? (
        <Text variant="caption">{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xxs, alignSelf: 'stretch' },
  input: {
    ...textVariants.body,
    color: colors.text,
    minHeight: MIN_TOUCH_TARGET + 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  focused: { borderColor: colors.primary, borderWidth: 2 },
  inputError: { borderColor: colors.accent, borderWidth: 2, borderStyle: 'dashed' },
  disabled: { backgroundColor: colors.disabledBackground },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  messageText: { flexShrink: 1 },
});
