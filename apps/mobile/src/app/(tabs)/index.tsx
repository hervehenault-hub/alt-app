import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Chip, Icon, Screen, Text, TextWithHighlight, type CardTone } from '@/components';
import { t } from '@/i18n';
import { spacing } from '@/theme';
import {
  CATEGORY_ICONS,
  DOMAIN_ICONS,
  HOME_DOMAIN_KEYS,
  PLACE_CATEGORY_KEYS,
  type HomeDomainKey,
  type PlaceCategoryKey,
} from '@/theme/icons';

const DOMAIN_TONES: Record<HomeDomainKey, CardTone> = {
  alimentation: 'saffron',
  quotidien_dechets: 'sky',
  reparation: 'coral',
  reemploi: 'cream',
};

/** Onglet Explorer (accessible sans compte). Contenu provisoire avant la carte des lieux. */
export default function ExploreScreen() {
  const [selected, setSelected] = useState<ReadonlySet<PlaceCategoryKey>>(new Set());

  const toggle = (key: PlaceCategoryKey) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <Screen testID="screen-explore">
      <Text variant="caption">{t('common.appName')}</Text>
      <TextWithHighlight
        variant="display"
        text={t('navigation.explore.title')}
        highlight={t('navigation.explore.introHighlight')}
      />
      <Text>{t('navigation.explore.intro')}</Text>

      <Text variant="title">{t('navigation.explore.domainsTitle')}</Text>
      <View style={styles.grid}>
        {HOME_DOMAIN_KEYS.map((key) => (
          <Card key={key} tone={DOMAIN_TONES[key]} organic style={styles.domainCard}>
            <Icon icon={DOMAIN_ICONS[key]} size={28} />
            <Text variant="label">{t(`taxonomy.domains.${key}`)}</Text>
          </Card>
        ))}
      </View>

      <Text variant="title">{t('navigation.explore.categoriesTitle')}</Text>
      <View style={styles.chips}>
        {PLACE_CATEGORY_KEYS.map((key) => (
          <Chip
            key={key}
            label={t(`taxonomy.categories.${key}`)}
            icon={CATEGORY_ICONS[key]}
            selected={selected.has(key)}
            onPress={() => toggle(key)}
          />
        ))}
      </View>

      <Card tone="sky">
        <Text>{t('navigation.explore.comingSoon')}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  domainCard: { flexGrow: 1, flexBasis: '45%', minHeight: 96, justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
