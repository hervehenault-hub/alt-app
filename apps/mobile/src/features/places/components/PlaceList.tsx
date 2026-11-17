import type { PlaceSummary } from '@alt/shared';
import { FlashList } from '@shopify/flash-list';
import MapPinOff from 'lucide-react-native/icons/map-pin-off';
import WifiOff from 'lucide-react-native/icons/wifi-off';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, EmptyState, Skeleton } from '@/components';
import { t } from '@/i18n';
import { spacing } from '@/theme';

import { PlaceCard } from './PlaceCard';

export type PlaceListState = 'loading' | 'error' | 'empty' | 'results';

export interface PlaceListProps {
  places: readonly PlaceSummary[];
  isLoading: boolean;
  isError: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onRetry: () => void;
  onLoadMore?: () => void;
  onOpenPlace: (id: string) => void;
  onAddPlace: () => void;
  header?: ReactElement;
}

export function listState({
  places,
  isLoading,
  isError,
}: Pick<PlaceListProps, 'places' | 'isLoading' | 'isError'>): PlaceListState {
  if (isLoading && places.length === 0) return 'loading';
  if (isError && places.length === 0) return 'error';
  if (places.length === 0) return 'empty';
  return 'results';
}

/** Liste des résultats (FlashList) avec ses 4 états : chargement, vide, erreur, résultats. */
export function PlaceList(props: PlaceListProps) {
  const { places, hasMore, isLoadingMore, onRetry, onLoadMore, onOpenPlace, onAddPlace, header } =
    props;
  const state = listState(props);

  const footer =
    state === 'loading' ? (
      <View style={styles.skeletons} testID="place-list-loading">
        <Skeleton height={112} radius={20} label={t('places.list.loading')} />
        <Skeleton height={112} radius={20} />
        <Skeleton height={112} radius={20} />
      </View>
    ) : state === 'error' ? (
      <EmptyState
        testID="place-list-error"
        icon={WifiOff}
        title={t('places.list.errorTitle')}
        message={t('places.list.errorMessage')}
        action={{ label: t('places.list.retry'), onPress: onRetry }}
      />
    ) : state === 'empty' ? (
      <EmptyState
        testID="place-list-empty"
        icon={MapPinOff}
        title={t('places.list.emptyTitle')}
        message={t('places.list.emptyMessage')}
        action={{
          label: t('places.list.addPlace'),
          onPress: onAddPlace,
          accessibilityHint: t('places.list.addPlaceHint'),
        }}
      />
    ) : hasMore ? (
      <Button
        variant="tertiary"
        label={t('places.search.loadMore')}
        loading={isLoadingMore}
        onPress={onLoadMore}
        style={styles.more}
        testID="place-list-more"
      />
    ) : null;

  return (
    <FlashList
      testID="place-list"
      data={places as PlaceSummary[]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <PlaceCard place={item} onPress={() => onOpenPlace(item.id)} />
        </View>
      )}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      onEndReached={hasMore && !isLoadingMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  item: { paddingBottom: spacing.sm },
  skeletons: { gap: spacing.sm },
  more: { alignSelf: 'center', marginTop: spacing.sm },
});
