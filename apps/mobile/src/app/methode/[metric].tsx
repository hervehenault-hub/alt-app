import type { Factor } from '@alt/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ExternalLink from 'lucide-react-native/icons/external-link';
import { Linking, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, Screen, Text } from '@/components';
import { ACTIONS, IMPACT_FACTORS } from '@/features/journey/content';
import { t } from '@/i18n';
import { spacing } from '@/theme';

type Metric = 'saving' | 'impact' | 'count' | 'city';
const METRICS: readonly Metric[] = ['saving', 'impact', 'count', 'city'];
const METHOD_VERSION = '1.0 (novembre 2026)';

/** Facteurs réellement utilisés par le catalogue, puis les équivalences. */
function factorsFor(metric: Metric): Factor[] {
  if (metric !== 'impact' && metric !== 'city') return [];
  const used = new Set(ACTIONS.map((a) => a.impact_factor_id).filter(Boolean));
  return [...IMPACT_FACTORS.factors.filter((f) => used.has(f.id)), ...IMPACT_FACTORS.equivalences];
}

/** Méthode et sources d'un chiffre (T7.5) : formule en clair, facteurs, liens, incertitude. */
export default function MethodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ metric: string }>();
  const metric: Metric = METRICS.includes(params.metric as Metric)
    ? (params.metric as Metric)
    : 'saving';
  const factors = factorsFor(metric);

  return (
    <Screen testID="screen-method">
      <Button
        variant="tertiary"
        label={t('impact.method.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/impact'))}
      />
      <Text variant="eyebrow">{t('impact.method.title')}</Text>
      <Text variant="display">{t(`impact.method.${metric}.title`)}</Text>
      <Text testID="method-formula">{t(`impact.method.${metric}.formula`)}</Text>
      <Text variant="note">{t('impact.method.version', { version: METHOD_VERSION })}</Text>

      <Text variant="title">{t('impact.method.factorsTitle')}</Text>
      {factors.length === 0 ? (
        <Text>{t('impact.method.noFactor')}</Text>
      ) : (
        <View style={styles.list}>
          {factors.map((f) => (
            <Card key={f.id} tone="white" testID={`method-factor-${f.id}`}>
              <Text variant="label">{f.label}</Text>
              {f.value !== null && f.value !== undefined ? (
                <Text>
                  {t('impact.method.factorValue', {
                    value: String(f.value).replace('.', ','),
                    unit: f.unit,
                  })}
                </Text>
              ) : null}
              <Text variant="caption">{f.source_name}</Text>
              <Text variant="note">{t('impact.method.uncertainty', { text: f.uncertainty })}</Text>
              <Button
                variant="tertiary"
                label={t('impact.method.openSource')}
                accessibilityHint={t('impact.method.openSourceHint')}
                icon={<Icon icon={ExternalLink} size={16} />}
                onPress={() => void Linking.openURL(f.source_url)}
              />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.sm } });
