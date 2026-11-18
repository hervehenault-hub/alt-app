import { SEARCH_RADIUS_OPTIONS_M, formatDistance } from '@alt/shared';
import { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SegmentedControl, Text, Toggle } from '@/components';
import { t } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

import { DEFAULT_FILTERS, type SearchFilters } from '../searchState';

export interface FiltersSheetProps {
  visible: boolean;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClose: () => void;
}

type RadiusValue = `${(typeof SEARCH_RADIUS_OPTIONS_M)[number]}`;

/** Feuille modale : distance (500 m à 5 km), ouvert, gratuit, à pied, transport ; tri. */
export function FiltersSheet({ visible, filters, onApply, onClose }: FiltersSheetProps) {
  // Le brouillon repart des filtres en vigueur à chaque ouverture (la feuille est
  // remontée grâce à sa clé, voir l'écran de recherche).
  const [draft, setDraft] = useState(filters);

  const set = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const sheet = (
    <View style={[styles.backdrop, Platform.OS === 'web' && styles.inline]}>
      <SafeAreaView edges={['bottom']} style={styles.sheet} testID="filters-sheet">
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text variant="title">{t('places.filters.title')}</Text>
            <Button
              variant="tertiary"
              label={t('places.filters.close')}
              onPress={onClose}
              testID="filters-close"
            />
          </View>
          <SegmentedControl<RadiusValue>
            label={t('places.filters.distance')}
            options={SEARCH_RADIUS_OPTIONS_M.map((m) => ({
              value: `${m}` as RadiusValue,
              label: formatDistance(m),
            }))}
            value={`${draft.radiusM}` as RadiusValue}
            onChange={(v) => set('radiusM', Number(v))}
            testID="filters-radius"
          />
          <Toggle
            label={t('places.filters.openNow')}
            value={draft.openNow}
            onValueChange={(v) => set('openNow', v)}
            testID="filters-open-now"
          />
          <Toggle
            label={t('places.filters.free')}
            value={draft.freeOnly}
            onValueChange={(v) => set('freeOnly', v)}
            testID="filters-free"
          />
          <Toggle
            label={t('places.filters.walk')}
            value={draft.walkOnly}
            onValueChange={(v) => set('walkOnly', v)}
            testID="filters-walk"
          />
          <Toggle
            label={t('places.filters.transit')}
            value={draft.transitOnly}
            onValueChange={(v) => set('transitOnly', v)}
            testID="filters-transit"
          />
          <SegmentedControl<'distance' | 'saving'>
            label={t('places.filters.sort')}
            options={[
              { value: 'distance', label: t('places.filters.sortDistance') },
              { value: 'saving', label: t('places.filters.sortSaving') },
            ]}
            value={draft.sortBy}
            onChange={(v) => set('sortBy', v)}
            testID="filters-sort"
          />
          <Button
            label={t('places.filters.apply')}
            fullWidth
            onPress={() => onApply(draft)}
            testID="filters-apply"
          />
          <Button
            variant="tertiary"
            label={t('places.filters.reset')}
            onPress={() => setDraft(DEFAULT_FILTERS)}
            testID="filters-reset"
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );

  // Sur le web, une fenêtre modale s'ouvre par-dessus toute la page (hors du cadre de
  // téléphone de la démo) : la feuille est affichée dans l'écran de recherche lui-même.
  if (Platform.OS === 'web') return visible ? sheet : null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {sheet}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  inline: { ...StyleSheet.absoluteFill, zIndex: 10 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
  },
  content: { padding: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
