import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, organicRadii, spacing } from '@/theme';

import { Button, type ButtonVariant } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

export interface EmptyStateProps {
  /** Icône centrale de l'illustration. */
  icon: LucideIcon;
  title: string;
  message?: string;
  /** Action proposée (bouton). */
  action?: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
    variant?: ButtonVariant;
    accessibilityHint?: string;
  };
  testID?: string;
}

/**
 * État vide chaleureux : illustration simple (formes organiques + icône), titre,
 * message et action. Jamais culpabilisant : on invite, on ne reproche pas.
 */
export function EmptyState({ icon, title, message, action, testID }: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View
        style={styles.illustration}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID="empty-state-illustration"
      >
        <View style={[styles.blob, styles.blobSky]} />
        <View style={[styles.blob, styles.blobSaffron]} />
        <View style={styles.iconBubble}>
          <Icon icon={icon} size={36} />
        </View>
      </View>
      <Text variant="title" align="center">
        {title}
      </Text>
      {message ? (
        <Text align="center" color="textMuted">
          {message}
        </Text>
      ) : null}
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          disabled={action.disabled}
          variant={action.variant ?? 'primary'}
          accessibilityHint={action.accessibilityHint}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const ILLUSTRATION_SIZE = 140;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  illustration: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  blob: { position: 'absolute', ...organicRadii },
  blobSky: {
    width: 120,
    height: 110,
    top: 8,
    left: 4,
    backgroundColor: colors.secondary,
    transform: [{ rotate: '-12deg' }],
  },
  blobSaffron: {
    width: 56,
    height: 50,
    right: 6,
    bottom: 10,
    backgroundColor: colors.highlight,
    transform: [{ rotate: '18deg' }],
  },
  iconBubble: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  action: { marginTop: spacing.sm, alignSelf: 'center' },
});
