import { BadgeCheck, RefreshCw, Store, Users, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { t, type TranslationKey } from '@/i18n';
import { colors, fontFamilies, radii, spacing, type ColorToken } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

/**
 * Niveaux de fiabilité d'une information, du moins au plus vérifié, plus
 * « à revérifier ». (Identifiants côté app ; à aligner sur l'énumération de la base
 * quand elle existera.)
 */
export const RELIABILITY_STATUSES = [
  'community',
  'confirmed_by_users',
  'confirmed_by_business',
  'to_recheck',
] as const;

export type ReliabilityStatus = (typeof RELIABILITY_STATUSES)[number];

type BadgeShape = 'outline' | 'pill' | 'seal' | 'dashed';

interface StatusStyle {
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** Forme distincte pour chaque statut : l'info ne repose jamais sur la seule couleur. */
  shape: BadgeShape;
  background: ColorToken;
  text: ColorToken;
  border: ColorToken;
}

/**
 * Échelle marine / safran / corail, sans rouge ni vert :
 * - communauté : contour marine sur blanc (pilule) ;
 * - plusieurs utilisateurs : safran pâle (pilule pleine) ;
 * - commerce : marine plein, texte blanc (sceau aux coins asymétriques) ;
 * - à revérifier : corail pâle, contour corail en pointillés.
 */
export const RELIABILITY_STYLES: Record<ReliabilityStatus, StatusStyle> = {
  community: {
    labelKey: 'reliability.community',
    icon: Users,
    shape: 'outline',
    background: 'surface',
    text: 'text',
    border: 'primary',
  },
  confirmed_by_users: {
    labelKey: 'reliability.confirmedByUsers',
    icon: BadgeCheck,
    shape: 'pill',
    background: 'pastelSaffron',
    text: 'text',
    border: 'highlight',
  },
  confirmed_by_business: {
    labelKey: 'reliability.confirmedByBusiness',
    icon: Store,
    shape: 'seal',
    background: 'primary',
    text: 'textOnDark',
    border: 'primary',
  },
  to_recheck: {
    labelKey: 'reliability.toRecheck',
    icon: RefreshCw,
    shape: 'dashed',
    background: 'pastelCoral',
    text: 'text',
    border: 'accent',
  },
};

const SHAPE_STYLES: Record<BadgeShape, ViewStyle> = {
  outline: { borderRadius: radii.pill, borderWidth: 1.5, borderStyle: 'solid' },
  pill: { borderRadius: radii.pill, borderWidth: 1.5, borderStyle: 'solid' },
  seal: {
    borderTopLeftRadius: radii.sm,
    borderBottomRightRadius: radii.sm,
    borderTopRightRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
    borderWidth: 1.5,
  },
  dashed: { borderRadius: radii.md, borderWidth: 1.5, borderStyle: 'dashed' },
};

export interface ReliabilityBadgeProps {
  status: ReliabilityStatus;
  testID?: string;
}

/** Badge de fiabilité : forme + icône + libellé, lu en entier par le lecteur d'écran. */
export function ReliabilityBadge({ status, testID }: ReliabilityBadgeProps) {
  const style = RELIABILITY_STYLES[status];
  const label = t(style.labelKey);
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('reliability.a11yLabel', { status: label })}
      style={[
        styles.badge,
        SHAPE_STYLES[style.shape],
        { backgroundColor: colors[style.background], borderColor: colors[style.border] },
      ]}
    >
      <Icon icon={style.icon} size={16} color={style.text} />
      <Text variant="caption" color={style.text} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  label: { fontFamily: fontFamilies.medium },
});
