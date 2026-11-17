import { PLACE_CATEGORIES, type PlaceCategory } from '@alt/shared';
import { useRouter } from 'expo-router';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import MapPin from 'lucide-react-native/icons/map-pin';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  Screen,
  Text,
  TextField,
  Toggle,
} from '@/components';
import { searchAddress, type AddressSuggestion } from '@/features/contribution/address';
import {
  getContributionRepository,
  type HoursPreset,
  type SubmitResult,
} from '@/features/contribution/repository';
import { useDebouncedValue } from '@/features/places/api';
import { t } from '@/i18n';
import { getResolvedLocation } from '@/lib/location';
import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/theme';
import { CATEGORY_ICONS } from '@/theme/icons';

const HOURS: readonly HoursPreset[] = ['unknown', 'shop', 'everyday', 'weekend'];

/** Formulaire « Ajouter un lieu » en 5 champs (T5.2). La connexion est demandée avant. */
export default function AddPlaceScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const [address, setAddress] = useState('');
  const [picked, setPicked] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [hours, setHours] = useState<HoursPreset>('unknown');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<{ name?: string; category?: string }>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [failed, setFailed] = useState(false);

  const query = useDebouncedValue(address, 300);
  useEffect(() => {
    if (picked?.label === query) return;
    let alive = true;
    void searchAddress(query, getResolvedLocation().coordinates).then(
      (s) => alive && setSuggestions(s),
    );
    return () => {
      alive = false;
    };
  }, [query, picked]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const submit = async () => {
    const nextErrors = {
      name: name.trim().length < 2 ? t('contribution.add.errorName') : undefined,
      category: category ? undefined : t('contribution.add.errorCategory'),
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.category || !category) return;
    setBusy(true);
    setFailed(false);
    try {
      setResult(
        await getContributionRepository().submitPlace({
          name,
          categoryId: category,
          address,
          latitude: picked?.coordinates.latitude,
          longitude: picked?.coordinates.longitude,
          hours,
          isFree,
          priceHint: price,
        }),
      );
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (result?.status === 'pending') {
    return (
      <Screen testID="screen-add-place-success">
        <EmptyState
          icon={CircleCheck}
          title={t('contribution.add.successTitle')}
          message={t('contribution.add.successMessage')}
          action={{ label: t('contribution.add.successBack'), onPress: () => router.replace('/') }}
        />
      </Screen>
    );
  }

  return (
    <Screen testID="screen-add-place">
      <Text variant="display">{t('contribution.add.title')}</Text>
      <Text>{t('contribution.add.intro')}</Text>

      <TextField
        label={t('contribution.add.name')}
        placeholder={t('contribution.add.namePlaceholder')}
        value={name}
        onChangeText={setName}
        error={errors.name}
        maxLength={120}
        testID="add-name"
      />

      <Text variant="label">{t('contribution.add.category')}</Text>
      <View
        style={styles.chips}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('contribution.add.category')}
      >
        {PLACE_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={t(`taxonomy.categories.${c}`)}
            icon={CATEGORY_ICONS[c]}
            selected={category === c}
            onPress={() => setCategory(c)}
            testID={`add-category-${c}`}
          />
        ))}
      </View>
      {errors.category ? (
        <Text color="text" accessibilityRole="alert" testID="add-category-error">
          {errors.category}
        </Text>
      ) : null}

      <TextField
        label={t('contribution.add.address')}
        placeholder={t('contribution.add.addressPlaceholder')}
        helper={t('contribution.add.addressHelper')}
        value={address}
        onChangeText={(v) => {
          setAddress(v);
          setPicked(null);
        }}
        maxLength={200}
        testID="add-address"
      />
      {suggestions.length > 0 && !picked ? (
        <View style={styles.suggestions}>
          {suggestions.map((s) => (
            <Pressable
              key={s.label}
              accessibilityRole="button"
              accessibilityLabel={s.label}
              accessibilityHint={t('contribution.add.addressSuggestionHint')}
              onPress={() => {
                setPicked(s);
                setAddress(s.label);
                setSuggestions([]);
              }}
              style={styles.suggestion}
            >
              <Icon icon={MapPin} size={18} />
              <Text>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text variant="label">{t('contribution.add.hours')}</Text>
      <View style={styles.chips}>
        {HOURS.map((h) => (
          <Chip
            key={h}
            label={t(`contribution.add.hoursOptions.${h}`)}
            selected={hours === h}
            onPress={() => setHours(h)}
            testID={`add-hours-${h}`}
          />
        ))}
      </View>

      <Toggle
        label={t('contribution.add.free')}
        value={isFree}
        onValueChange={setIsFree}
        testID="add-free"
      />
      {!isFree ? (
        <TextField
          label={t('contribution.add.price')}
          placeholder={t('contribution.add.pricePlaceholder')}
          value={price}
          onChangeText={setPrice}
          maxLength={60}
          testID="add-price"
        />
      ) : null}

      {result?.status === 'duplicate' ? (
        <Card tone="saffron" testID="add-duplicate">
          <Text variant="label">{t('contribution.add.duplicateTitle')}</Text>
          <Text>{t('contribution.add.duplicateMessage', { name: result.name })}</Text>
          <Button
            variant="secondary"
            label={t('contribution.add.duplicateOpen')}
            onPress={() => router.replace(`/place/${result.placeId}`)}
          />
        </Card>
      ) : null}
      {result?.status === 'rate_limited' ? (
        <Card tone="sky" testID="add-rate-limited">
          <Text>{t('contribution.add.rateLimited')}</Text>
        </Card>
      ) : null}
      {failed ? (
        <Card tone="coral" testID="add-error">
          <Text accessibilityRole="alert">{t('contribution.add.errorGeneric')}</Text>
        </Card>
      ) : null}

      <Button
        label={t('contribution.add.submit')}
        fullWidth
        loading={busy}
        onPress={() => void submit()}
        testID="add-submit"
      />
      <Button variant="tertiary" label={t('contribution.add.cancel')} onPress={close} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  suggestions: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  suggestion: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
