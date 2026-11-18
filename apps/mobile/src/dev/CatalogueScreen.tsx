import SearchX from 'lucide-react-native/icons/search-x';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  RELIABILITY_STATUSES,
  ReliabilityBadge,
  Screen,
  SegmentedControl,
  SignInPrompt,
  Skeleton,
  Text,
  TextField,
  TextWithHighlight,
  Toggle,
  type CardTone,
} from '@/components';
import { t } from '@/i18n';
import {
  colors,
  palette,
  radii,
  spacing,
  textVariants,
  type PaletteColor,
  type TextVariant,
} from '@/theme';
import {
  CATEGORY_ICONS,
  DOMAIN_ICONS,
  HOME_DOMAIN_KEYS,
  PLACE_CATEGORY_KEYS,
  type PlaceCategoryKey,
} from '@/theme/icons';

/**
 * Catalogue de tous les composants. Module chargé UNIQUEMENT en développement
 * (voir `src/app/dev/catalogue.tsx`) : il n'est pas embarqué dans le build de production.
 */
export const CATALOGUE_MARKER = 'alt-dev-catalogue-screen';

const SAMPLE_KEYS: Record<TextVariant, Parameters<typeof t>[0]> = {
  display: 'devCatalogue.samples.display',
  title: 'devCatalogue.samples.title',
  eyebrow: 'devCatalogue.samples.eyebrow',
  label: 'devCatalogue.samples.label',
  body: 'devCatalogue.samples.body',
  metaStrong: 'devCatalogue.samples.metaStrong',
  caption: 'devCatalogue.samples.caption',
  note: 'devCatalogue.samples.note',
};

const CARD_TONES: readonly CardTone[] = ['white', 'cream', 'coral', 'saffron', 'sky'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="title">{title}</Text>
      {children}
    </View>
  );
}

export default function CatalogueScreen() {
  const [chips, setChips] = useState<ReadonlySet<PlaceCategoryKey>>(new Set(['vrac']));
  const [segment, setSegment] = useState<'list' | 'map'>('list');
  const [toggle, setToggle] = useState(true);
  const [postalCode, setPostalCode] = useState('');

  return (
    <Screen testID={CATALOGUE_MARKER}>
      <Text variant="display">{t('devCatalogue.title')}</Text>
      <Text>{t('devCatalogue.intro')}</Text>

      <Section title={t('devCatalogue.sections.colors')}>
        <View style={styles.row}>
          {(Object.keys(palette) as PaletteColor[]).map((name) => (
            <View key={name} style={styles.swatchItem}>
              <View style={[styles.swatch, { backgroundColor: palette[name] }]} />
              <Text variant="caption">{name}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title={t('devCatalogue.sections.typography')}>
        {(Object.keys(textVariants) as TextVariant[]).map((variant) => (
          <Text key={variant} variant={variant} accessibilityRole="text">
            {t(SAMPLE_KEYS[variant])}
          </Text>
        ))}
        <TextWithHighlight
          text={t('devCatalogue.samples.highlightText')}
          highlight={t('devCatalogue.samples.highlightWord')}
        />
      </Section>

      <Section title={t('devCatalogue.sections.buttons')}>
        <Button label={t('devCatalogue.samples.primary')} onPress={() => undefined} />
        <Button
          label={t('devCatalogue.samples.secondary')}
          variant="secondary"
          onPress={() => undefined}
        />
        <Button
          label={t('devCatalogue.samples.tertiary')}
          variant="tertiary"
          onPress={() => undefined}
        />
        <Button label={t('devCatalogue.samples.disabled')} disabled />
        <Button label={t('devCatalogue.samples.loading')} loading />
        <Button label={t('devCatalogue.samples.loading')} variant="secondary" loading />
      </Section>

      <Section title={t('devCatalogue.sections.cards')}>
        {CARD_TONES.map((tone, index) => (
          <Card key={tone} tone={tone} organic={index % 2 === 1}>
            <Text variant="label">{t('devCatalogue.samples.cardTitle')}</Text>
            <Text variant="caption">{t('devCatalogue.samples.cardBody')}</Text>
            <ReliabilityBadge status={RELIABILITY_STATUSES[index % 4] ?? 'community'} />
          </Card>
        ))}
      </Section>

      <Section title={t('devCatalogue.sections.chips')}>
        <View style={styles.row}>
          {PLACE_CATEGORY_KEYS.map((key) => (
            <Chip
              key={key}
              label={t(`taxonomy.categories.${key}`)}
              icon={CATEGORY_ICONS[key]}
              selected={chips.has(key)}
              onPress={() =>
                setChips((current) => {
                  const next = new Set(current);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
            />
          ))}
        </View>
      </Section>

      <Section title={t('devCatalogue.sections.reliability')}>
        {RELIABILITY_STATUSES.map((status) => (
          <ReliabilityBadge key={status} status={status} />
        ))}
      </Section>

      <Section title={t('devCatalogue.sections.fields')}>
        <TextField
          label={t('devCatalogue.samples.fieldLabel')}
          helper={t('devCatalogue.samples.fieldHelper')}
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="number-pad"
          error={
            postalCode.length > 0 && !/^\d{5}$/.test(postalCode)
              ? t('devCatalogue.samples.fieldError')
              : undefined
          }
        />
        <TextField
          label={t('devCatalogue.samples.fieldLabel')}
          error={t('devCatalogue.samples.fieldError')}
        />
        <SegmentedControl
          label={t('devCatalogue.samples.segmentedLabel')}
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'list', label: t('devCatalogue.samples.segmentList') },
            { value: 'map', label: t('devCatalogue.samples.segmentMap') },
          ]}
        />
        <Toggle
          label={t('devCatalogue.samples.toggleLabel')}
          description={t('devCatalogue.samples.toggleDescription')}
          value={toggle}
          onValueChange={setToggle}
        />
      </Section>

      <Section title={t('devCatalogue.sections.icons')}>
        <View style={styles.row}>
          {PLACE_CATEGORY_KEYS.map((key) => (
            <Icon key={key} icon={CATEGORY_ICONS[key]} label={t(`taxonomy.categories.${key}`)} />
          ))}
        </View>
        <View style={styles.row}>
          {HOME_DOMAIN_KEYS.map((key) => (
            <Icon key={key} icon={DOMAIN_ICONS[key]} label={t(`taxonomy.domains.${key}`)} />
          ))}
        </View>
      </Section>

      <Section title={t('devCatalogue.sections.emptyStates')}>
        <Card>
          <EmptyState
            icon={SearchX}
            title={t('devCatalogue.samples.emptyTitle')}
            message={t('devCatalogue.samples.emptyMessage')}
            action={{ label: t('devCatalogue.samples.emptyAction'), onPress: () => undefined }}
          />
        </Card>
        <Card tone="cream">
          <SignInPrompt />
        </Card>
      </Section>

      <Section title={t('devCatalogue.sections.skeletons')}>
        <Card>
          <Skeleton height={20} width="60%" label={t('ui.loading')} />
          <Skeleton />
          <Skeleton width="80%" />
          <Skeleton height={120} radius={radii.lg} />
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm, marginTop: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatchItem: { alignItems: 'center', gap: spacing.xxs, width: 76 },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
});
