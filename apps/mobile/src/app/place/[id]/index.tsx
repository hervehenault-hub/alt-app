import { parisWeekdayAndMinute, slotsForDay } from '@alt/shared';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Copy from 'lucide-react-native/icons/copy';
import Flag from 'lucide-react-native/icons/flag';
import MapPinOff from 'lucide-react-native/icons/map-pin-off';
import Navigation from 'lucide-react-native/icons/navigation';
import WifiOff from 'lucide-react-native/icons/wifi-off';
import { useEffect, useState } from 'react';
import { getContributionRepository } from '@/features/contribution/repository';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  Icon,
  ReliabilityBadge,
  Screen,
  Skeleton,
  Text,
} from '@/components';
import { usePlace } from '@/features/places/api';
import {
  formatEuros,
  formatVerifiedDate,
  openLabel,
  reliabilityOf,
} from '@/features/places/format';
import { t, type TranslationKey } from '@/i18n';
import { trackPlaceViewed } from '@/lib/analytics';
import { useRequireAccount } from '@/lib/auth/useRequireAccount';
import { spacing } from '@/theme';
import { CATEGORY_ICONS } from '@/theme/icons';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

function directionsUrl(lat: number, lng: number, label: string): string {
  const q = encodeURIComponent(label);
  if (Platform.OS === 'ios') return `maps:0,0?q=${q}&ll=${lat},${lng}`;
  if (Platform.OS === 'android') return `geo:${lat},${lng}?q=${lat},${lng}(${q})`;
  return `https://www.openstreetmap.org/directions?route=%3B${lat}%2C${lng}`;
}

/** Fiche lieu (T4.9) ; lien profond `alt://place/:id`. */
export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const requireAccount = useRequireAccount();
  const { data: place, isPending, isError, refetch } = usePlace(id);
  const [copied, setCopied] = useState(false);
  const [showBasis, setShowBasis] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (place) void trackPlaceViewed(place.id);
  }, [place]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const backButton = (
    <Button
      variant="tertiary"
      label={t('places.detail.back')}
      icon={<Icon icon={ArrowLeft} size={20} />}
      onPress={back}
      testID="place-back"
    />
  );

  if (isPending) {
    return (
      <Screen testID="screen-place-loading">
        {backButton}
        <Skeleton height={40} label={t('ui.loading')} />
        <Skeleton height={160} radius={20} />
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen testID="screen-place-error">
        {backButton}
        <EmptyState
          icon={WifiOff}
          title={t('places.list.errorTitle')}
          message={t('places.list.errorMessage')}
          action={{ label: t('places.list.retry'), onPress: () => void refetch() }}
        />
      </Screen>
    );
  }
  if (!place) {
    return (
      <Screen testID="screen-place-not-found">
        {backButton}
        <EmptyState
          icon={MapPinOff}
          title={t('places.detail.notFoundTitle')}
          message={t('places.detail.notFoundMessage')}
        />
      </Screen>
    );
  }

  const today = parisWeekdayAndMinute(new Date()).weekday;
  const category = t(`taxonomy.categories.${place.categoryId}`);

  return (
    <Screen testID="screen-place">
      {backButton}
      <View style={styles.titleRow}>
        <Icon icon={CATEGORY_ICONS[place.categoryId]} size={28} />
        <Text variant="caption">{category}</Text>
      </View>
      <Text variant="display">{place.name}</Text>
      <View style={styles.row}>
        <ReliabilityBadge status={reliabilityOf(place)} />
        <Text variant="caption" testID="place-verified">
          {t('places.detail.verified', { date: formatVerifiedDate(place.lastVerifiedAt) })}
        </Text>
      </View>
      {place.description ? <Text>{place.description}</Text> : null}

      {place.address ? (
        <Card tone="white">
          <Text variant="label">{t('places.detail.address')}</Text>
          <Text selectable testID="place-address">
            {place.address}
          </Text>
          <View style={styles.row}>
            <Button
              variant="secondary"
              label={copied ? t('places.detail.copied') : t('places.detail.copyAddress')}
              icon={<Icon icon={Copy} size={18} />}
              onPress={async () => {
                await Clipboard.setStringAsync(place.address ?? '');
                setCopied(true);
              }}
              testID="place-copy"
            />
            <Button
              label={t('places.detail.directions')}
              accessibilityHint={t('places.detail.directionsHint')}
              icon={<Icon icon={Navigation} size={18} color="onPrimary" />}
              onPress={() =>
                void Linking.openURL(directionsUrl(place.latitude, place.longitude, place.name))
              }
              testID="place-directions"
            />
          </View>
        </Card>
      ) : null}

      <Card tone="sky" testID="place-hours">
        <View style={styles.rowBetween}>
          <Text variant="label">{t('places.detail.hours')}</Text>
          <Text variant="caption">{openLabel(place.isOpen)}</Text>
        </View>
        {WEEKDAYS.map((day) => {
          const slots = slotsForDay(place.openingHours, day);
          const value =
            slots.length === 0
              ? t('places.detail.closedDay')
              : slots
                  .map((s) => t('places.slot', { opens: s.opens, closes: s.closes }))
                  .join(t('places.slotSeparator'));
          return (
            <View key={day} style={styles.rowBetween}>
              <Text variant={day === today ? 'label' : 'body'}>
                {t(`places.weekdays.${day}` as TranslationKey)}
                {day === today ? t('places.detail.today') : null}
              </Text>
              <Text variant={day === today ? 'label' : 'body'}>{value}</Text>
            </View>
          );
        })}
      </Card>

      {place.priceHint || place.estimatedSavingEur !== null ? (
        <Card tone="saffron">
          {place.priceHint ? (
            <View style={styles.rowBetween}>
              <Text variant="label">{t('places.detail.price')}</Text>
              <Text>{place.priceHint}</Text>
            </View>
          ) : null}
          {place.estimatedSavingEur !== null ? (
            <>
              <View style={styles.rowBetween}>
                <Text variant="label">{t('places.detail.saving')}</Text>
                <Text testID="place-saving">
                  {t('places.detail.savingValue', {
                    amount: formatEuros(place.estimatedSavingEur),
                  })}
                </Text>
              </View>
              {place.savingBasis ? (
                <>
                  <Button
                    variant="tertiary"
                    label={t('places.detail.howComputed')}
                    accessibilityHint={t('places.detail.howComputedHint')}
                    accessibilityState={{ expanded: showBasis }}
                    onPress={() => setShowBasis((v) => !v)}
                    testID="place-how-computed"
                  />
                  {showBasis ? <Text testID="place-saving-basis">{place.savingBasis}</Text> : null}
                </>
              ) : null}
            </>
          ) : null}
        </Card>
      ) : null}

      <Text variant="caption">
        {t('places.detail.source', {
          source: t(`places.sources.${place.source}` as TranslationKey),
        })}
      </Text>

      <Card tone="cream" testID="place-confirm">
        <Text variant="label">{t('contribution.confirm.question')}</Text>
        {confirmed ? (
          <Text accessibilityRole="alert" testID="place-confirm-thanks">
            {t('contribution.confirm.thanks')}
          </Text>
        ) : (
          <View style={styles.row}>
            <Button
              variant="secondary"
              label={t('contribution.confirm.yes')}
              accessibilityHint={t('contribution.confirm.yesHint')}
              onPress={() =>
                requireAccount(() => {
                  setConfirmed(true);
                  void getContributionRepository()
                    .confirm(place.id)
                    .catch(() => undefined);
                })
              }
              testID="place-confirm-yes"
            />
            <Button
              variant="tertiary"
              label={t('contribution.confirm.no')}
              onPress={() => requireAccount(() => router.push(`/place/${place.id}/signaler`))}
              testID="place-confirm-no"
            />
          </View>
        )}
      </Card>

      <Button
        variant="tertiary"
        label={t('places.detail.report')}
        accessibilityHint={t('places.detail.reportHint')}
        icon={<Icon icon={Flag} size={18} />}
        onPress={() => requireAccount(() => router.push(`/place/${place.id}/signaler`))}
        testID="place-report"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
