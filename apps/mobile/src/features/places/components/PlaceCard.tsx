import type { PlaceSummary } from '@alt/shared';
import { StyleSheet, View } from 'react-native';

import { Card, Icon, ReliabilityBadge, Text } from '@/components';
import { t } from '@/i18n';
import { spacing } from '@/theme';
import { CATEGORY_ICONS } from '@/theme/icons';

import { formatEuros, formatPlaceDistance, openLabel, reliabilityOf } from '../format';

export interface PlaceCardProps {
  place: PlaceSummary;
  onPress: () => void;
}

/** Ligne de résultat : nom, distance, ouvert ou fermé, économie estimée, badge de fiabilité. */
export function PlaceCard({ place, onPress }: PlaceCardProps) {
  const category = t(`taxonomy.categories.${place.categoryId}`);
  const distance = formatPlaceDistance(place.distanceM);
  const open = openLabel(place.isOpen);
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={t('places.list.rowA11y', {
        name: place.name,
        category,
        distance: distance ?? '',
        open,
      })}
      accessibilityHint={t('places.list.rowHint')}
      testID={`place-card-${place.id}`}
    >
      <View style={styles.header}>
        <Icon icon={CATEGORY_ICONS[place.categoryId]} size={22} />
        <View style={styles.titles}>
          <Text variant="label">{place.name}</Text>
          <Text variant="caption">
            {distance ? t('places.list.categoryDistance', { category, distance }) : category}
          </Text>
        </View>
      </View>
      <View style={styles.meta}>
        <Text variant={place.isOpen ? 'metaStrong' : 'caption'}>{open}</Text>
        {place.isFree ? <Text variant="metaStrong">{t('places.list.free')}</Text> : null}
        {place.estimatedSavingEur !== null ? (
          <Text variant="metaStrong">
            {t('places.list.saving', { amount: formatEuros(place.estimatedSavingEur) })}
          </Text>
        ) : null}
      </View>
      <ReliabilityBadge status={reliabilityOf(place)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  titles: { flex: 1, gap: spacing.xxs },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
