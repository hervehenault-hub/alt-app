import type { NeedSuggestion } from '@alt/shared';
import { useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import X from 'lucide-react-native/icons/x';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, Icon, SegmentedControl, Text, TextField } from '@/components';
import { useNeedSuggestions, usePlaceSearch } from '@/features/places/api';
import { FiltersSheet } from '@/features/places/components/FiltersSheet';
import { NeedSuggestions } from '@/features/places/components/NeedSuggestions';
import { PlaceList } from '@/features/places/components/PlaceList';
import { PlaceMap } from '@/features/places/components/PlaceMap';
import {
  activeFilterCount,
  applyFilters,
  setCategories,
  setQuery,
  setView,
  useSearchState,
} from '@/features/places/searchState';
import { t } from '@/i18n';
import { track } from '@/lib/analytics';
import { useRequireAccount } from '@/lib/auth/useRequireAccount';
import { useLocation } from '@/lib/location';
import { colors, spacing } from '@/theme';
import type { HomeDomainKey } from '@/theme/icons';

/**
 * Recherche (T4.4 à T4.8) : saisie avec suggestions de besoins, filtres et tri,
 * bascule liste / carte qui conserve la recherche.
 */
export default function SearchScreen() {
  const router = useRouter();
  const search = useSearchState();
  const location = useLocation();
  const requireAccount = useRequireAccount();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const params = {
    q: search.q,
    origin: location.coordinates,
    radiusM: search.filters.radiusM,
    categoryIds: search.categoryIds,
    openNow: search.filters.openNow,
    freeOnly: search.filters.freeOnly,
    walkOnly: search.filters.walkOnly,
    transitOnly: search.filters.transitOnly,
    sortBy: search.filters.sortBy,
  };
  const query = usePlaceSearch(params);
  const suggestions = useNeedSuggestions(search.q);
  const places = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;
  const filterCount = activeFilterCount(search.filters);

  const openPlace = (id: string) => router.push(`/place/${id}`);
  const selectSuggestion = (s: NeedSuggestion) => {
    // Un besoin précis remplace le thème choisi depuis Explorer.
    setCategories([]);
    setQuery(s.label);
    setInputFocused(false);
    void track('search_performed', { need_id: s.id });
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Button
          variant="tertiary"
          label={t('places.search.back')}
          icon={<Icon icon={ArrowLeft} size={20} />}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          testID="search-back"
        />
      </View>
      <TextField
        label={t('places.search.inputLabel')}
        placeholder={t('places.explore.searchPlaceholder')}
        value={search.q}
        onChangeText={setQuery}
        onFocus={() => setInputFocused(true)}
        onSubmitEditing={() => {
          setInputFocused(false);
          void track('search_performed', { length: search.q.length });
        }}
        returnKeyType="search"
        autoFocus={search.categoryIds.length === 0}
        autoCorrect={false}
        testID="search-input"
      />
      {search.q ? (
        <Button
          variant="tertiary"
          label={t('places.search.clear')}
          accessibilityHint={t('places.search.clearHint')}
          icon={<Icon icon={X} size={18} />}
          onPress={() => setQuery('')}
          testID="search-clear"
        />
      ) : null}
      {inputFocused ? (
        <NeedSuggestions suggestions={suggestions.data ?? []} onSelect={selectSuggestion} />
      ) : null}
      {search.domainKey ? (
        <View style={styles.row}>
          <Chip
            label={t('places.search.domainFilter', {
              name: t(`taxonomy.domains.${search.domainKey as HomeDomainKey}`),
            })}
            icon={X}
            selected
            accessibilityHint={t('places.search.removeDomain')}
            onPress={() => setCategories([])}
            testID="search-domain-chip"
          />
        </View>
      ) : null}
      <View style={styles.row}>
        <Button
          variant="secondary"
          label={
            filterCount > 0
              ? t('places.search.filtersActive', { count: filterCount })
              : t('places.search.filters')
          }
          accessibilityHint={t('places.search.filtersHint')}
          icon={<Icon icon={SlidersHorizontal} size={18} />}
          onPress={() => setFiltersOpen(true)}
          testID="search-filters"
        />
        <View style={styles.flex}>
          <SegmentedControl<'list' | 'map'>
            label={t('places.search.viewLabel')}
            options={[
              { value: 'list', label: t('places.search.viewList') },
              { value: 'map', label: t('places.search.viewMap') },
            ]}
            value={search.view}
            onChange={setView}
            testID="search-view"
          />
        </View>
      </View>
      {places.length > 0 ? (
        <Text variant="caption" accessibilityLiveRegion="polite" testID="search-count">
          {total === 1
            ? t('places.search.resultCountOne')
            : t('places.search.resultCount', { count: total })}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']} testID="screen-search">
      {search.view === 'list' ? (
        <PlaceList
          header={header}
          places={places}
          isLoading={query.isPending}
          isError={query.isError}
          hasMore={query.hasNextPage}
          isLoadingMore={query.isFetchingNextPage}
          onRetry={() => void query.refetch()}
          onLoadMore={() => void query.fetchNextPage()}
          onOpenPlace={openPlace}
          onAddPlace={() => requireAccount(() => router.push('/ajouter-un-lieu'))}
        />
      ) : (
        <View style={styles.mapWrap}>
          <View style={styles.mapHeader}>{header}</View>
          <PlaceMap
            places={places}
            center={location.coordinates}
            userPosition={location.source.startsWith('device') ? location.coordinates : null}
            onOpenPlace={openPlace}
          />
        </View>
      )}
      <FiltersSheet
        key={filtersOpen ? 'open' : 'closed'}
        visible={filtersOpen}
        filters={search.filters}
        onClose={() => setFiltersOpen(false)}
        onApply={(filters) => {
          void applyFilters(filters);
          setFiltersOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 160 },
  mapWrap: { flex: 1, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  mapHeader: {},
});
