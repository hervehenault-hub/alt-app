import { computeImpact } from '@alt/shared';
import { useRouter } from 'expo-router';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Sprout from 'lucide-react-native/icons/sprout';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  Icon,
  Screen,
  SignInPrompt,
  Text,
  type CardTone,
} from '@/components';
import { isDemoMode } from '@/config/env';
import { ACTIONS, IMPACT_FACTORS } from '@/features/journey/content';
import { useJourneyProgress } from '@/features/journey/progress';
import { formatEuros } from '@/features/places/format';
import { t } from '@/i18n';
import { useSession } from '@/lib/auth/session';
import { MIN_TOUCH_TARGET, spacing } from '@/theme';

export type ImpactMetric = 'saving' | 'impact' | 'count' | 'city';

/** Chiffres de démonstration pour le bloc collectif (aucun serveur en mode démo). */
const DEMO_CITY = { count: '1 284', people: '312', amount: '9 640' };

function Figure({
  label,
  value,
  metric,
  tone,
  testID,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
  metric: ImpactMetric;
  tone: CardTone;
  testID: string;
}) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('impact.figureA11y', {
        label,
        value: detail ? `${value} ${detail}` : value,
      })}
      accessibilityHint={t('impact.howComputedHint')}
      onPress={() => router.push(`/methode/${metric}`)}
      style={styles.figure}
      testID={testID}
    >
      <Card tone={tone} style={styles.figureCard}>
        <Text variant="eyebrow">{label}</Text>
        <Text variant="display">{value}</Text>
        {detail ? <Text variant="caption">{detail}</Text> : null}
        <View style={styles.link}>
          <Text variant="caption">{t('impact.howComputedShort')}</Text>
          <Icon icon={ChevronRight} size={16} />
        </View>
      </Card>
    </Pressable>
  );
}

/** Onglet Impact (T7.3, T7.4) : économies, impact évité en équivalence, actions ; bloc collectif. */
export default function ImpactScreen() {
  const router = useRouter();
  const { status } = useSession();
  const { events } = useJourneyProgress();
  const report = computeImpact({
    completions: events.filter((e) => e.status === 'fait'),
    actions: ACTIONS,
    factors: IMPACT_FACTORS,
    now: new Date(),
  });
  const equivalence = report.total.equivalences[0];
  const hasData = report.total.count > 0;

  const collective = (
    <Card tone="sky" testID="impact-collective">
      <Text variant="title">{t('impact.collectiveTitle')}</Text>
      <Text>
        {isDemoMode() ? t('impact.collectiveDemo', DEMO_CITY) : t('impact.collectiveSoon')}
      </Text>
      {isDemoMode() ? <Text variant="note">{t('impact.demoNote')}</Text> : null}
      <Button
        variant="tertiary"
        label={t('impact.howComputed')}
        accessibilityHint={t('impact.howComputedHint')}
        onPress={() => router.push('/methode/city')}
        testID="impact-city-method"
      />
    </Card>
  );

  return (
    <Screen testID="screen-impact">
      <Text variant="display">{t('impact.title')}</Text>
      <Text>{t('impact.intro')}</Text>

      {status !== 'signedIn' ? (
        <SignInPrompt testID="sign-in-prompt" />
      ) : hasData ? (
        <View style={styles.grid}>
          <Figure
            label={t('impact.monthSaving')}
            value={t('impact.euros', { amount: formatEuros(report.month.savingEur) })}
            metric="saving"
            tone="saffron"
            testID="impact-month"
          />
          <Figure
            label={t('impact.yearSaving')}
            value={t('impact.euros', { amount: formatEuros(report.year.savingEur) })}
            metric="saving"
            tone="saffron"
            testID="impact-year"
          />
          <Figure
            label={t('impact.impactTitle')}
            value={
              equivalence
                ? t('impact.impactValue', { quantity: equivalence.quantity })
                : t('impact.impactKgValue', { kg: formatEuros(report.total.impactKgCo2e) })
            }
            detail={
              equivalence
                ? t('impact.impactEquivalence', { label: equivalence.label })
                : t('impact.impactKgUnit')
            }
            metric="impact"
            tone="coral"
            testID="impact-equivalence"
          />
          <Figure
            label={t('impact.actionsCount')}
            value={String(report.total.count)}
            metric="count"
            tone="cream"
            testID="impact-count"
          />
        </View>
      ) : (
        <EmptyState
          testID="impact-zero"
          icon={Sprout}
          title={t('impact.zeroTitle')}
          message={t('impact.zeroMessage')}
          action={{ label: t('impact.zeroCta'), onPress: () => router.push('/parcours') }}
        />
      )}

      {collective}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  figure: { flexGrow: 1, flexBasis: '45%', minHeight: MIN_TOUCH_TARGET },
  figureCard: { gap: spacing.xxs, flex: 1 },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
});
