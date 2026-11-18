import { useRouter } from 'expo-router';
import LocateFixed from 'lucide-react-native/icons/locate-fixed';
import Search from 'lucide-react-native/icons/search';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, Screen, Text, TextWithHighlight, type CardTone } from '@/components';
import { DOMAIN_CATEGORIES } from '@/features/places/domains';
import { setCategories, setQuery } from '@/features/places/searchState';
import { t } from '@/i18n';
import { useLocation } from '@/lib/location';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/theme';
import { DOMAIN_ICONS, HOME_DOMAIN_KEYS, type HomeDomainKey } from '@/theme/icons';

const DOMAIN_TONES: Record<HomeDomainKey, CardTone> = {
  alimentation: 'saffron',
  quotidien_dechets: 'sky',
  reparation: 'coral',
  reemploi: 'cream',
};

/**
 * Onglet Explorer (T4.4, accessible sans compte) : la recherche est l'action principale,
 * 4 tuiles lancent une recherche filtrée par thème.
 */
export default function ExploreScreen() {
  const router = useRouter();
  const location = useLocation();

  const openSearch = () => {
    setQuery('');
    setCategories([]);
    router.push('/search');
  };

  const openDomain = (key: HomeDomainKey) => {
    setQuery('');
    setCategories(DOMAIN_CATEGORIES[key], key);
    router.push('/search');
  };

  const locationLabel =
    location.source === 'neighborhood' && location.neighborhood
      ? t('location.status.neighborhood', { name: location.neighborhood.name })
      : t(`location.status.${location.source}`);

  return (
    <Screen testID="screen-explore">
      <Text variant="caption">{t('common.appName')}</Text>
      <TextWithHighlight
        variant="display"
        text={t('navigation.explore.title')}
        highlight={t('navigation.explore.introHighlight')}
      />
      <Text>{t('navigation.explore.intro')}</Text>

      <Pressable
        accessibilityRole="search"
        accessibilityLabel={t('places.explore.searchLabel')}
        accessibilityHint={t('places.explore.searchHint')}
        onPress={openSearch}
        style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
        testID="explore-search"
      >
        <Icon icon={Search} size={22} />
        <Text color="textMuted" style={styles.searchText} numberOfLines={1} ellipsizeMode="tail">
          {t('places.explore.searchPlaceholder')}
        </Text>
      </Pressable>

      <View style={styles.locationRow}>
        <Icon icon={LocateFixed} size={18} />
        <Text variant="caption" style={styles.flex}>
          {locationLabel}
        </Text>
        <Button
          variant="tertiary"
          label={t('location.change')}
          accessibilityHint={t('location.changeHint')}
          onPress={() => router.push('/location')}
          testID="explore-location"
        />
      </View>

      <Text variant="title">{t('places.explore.tilesTitle')}</Text>
      <View style={styles.grid}>
        {HOME_DOMAIN_KEYS.map((key) => (
          <Card
            key={key}
            tone={DOMAIN_TONES[key]}
            organic
            style={styles.domainCard}
            onPress={() => openDomain(key)}
            accessibilityLabel={t(`taxonomy.domains.${key}`)}
            accessibilityHint={t('places.explore.tileHint')}
            testID={`explore-tile-${key}`}
          >
            <Icon icon={DOMAIN_ICONS[key]} size={28} />
            <Text variant="label">{t(`taxonomy.domains.${key}`)}</Text>
          </Card>
        ))}
      </View>

      <Button
        variant="secondary"
        label={t('places.explore.seeAll')}
        accessibilityHint={t('places.explore.seeAllHint')}
        onPress={openSearch}
        fullWidth
        testID="explore-see-all"
      />
    </Screen>
  );
}

const SEARCH_BAR_HEIGHT = MIN_TOUCH_TARGET + 12;

const styles = StyleSheet.create({
  searchBar: {
    // Hauteur fixe : une seule ligne, quelle que soit la taille du texte.
    height: SEARCH_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  // Texte d'exemple : italique, 20 % moins opaque que le texte secondaire.
  searchText: { flex: 1, fontStyle: 'italic', opacity: 0.8 },
  pressed: { opacity: 0.85 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  domainCard: { flexGrow: 1, flexBasis: '45%', minHeight: 96, justifyContent: 'space-between' },
});
