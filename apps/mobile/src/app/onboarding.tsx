import { DOMAINS, MAIN_CONSTRAINTS, PILOT_CITY_SLUG, toggleInterest } from '@alt/shared';
import { useRouter } from 'expo-router';
import MapPin from 'lucide-react-native/icons/map-pin';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Chip, Screen, Text, TextWithHighlight } from '@/components';
import { t } from '@/i18n';
import { track } from '@/lib/analytics';
import { finishOnboarding, updateAnswers, useOnboarding } from '@/lib/onboarding';
import { spacing } from '@/theme';

const TOTAL_STEPS = 3;

/**
 * Onboarding (T3.5) : 3 écrans sautables — ville, domaines, contrainte principale.
 * « Passer » mène à Explorer en un geste, à chaque étape.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const { state } = useOnboarding();
  const { answers } = state;
  const [step, setStep] = useState(0);

  const leave = async (status: 'completed' | 'skipped') => {
    await finishOnboarding(status);
    void track(status === 'completed' ? 'onboarding_completed' : 'onboarding_skipped', {
      step: step + 1,
    });
    router.replace('/');
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else void leave('completed');
  };

  return (
    <Screen testID="screen-onboarding">
      <View style={styles.header}>
        <Text variant="eyebrow">
          {t('onboarding.progress', { current: step + 1, total: TOTAL_STEPS })}
        </Text>
        <Button
          variant="tertiary"
          label={t('onboarding.skip')}
          accessibilityHint={t('onboarding.skipHint')}
          onPress={() => void leave('skipped')}
          testID="onboarding-skip"
        />
      </View>

      {step === 0 ? (
        <View style={styles.step} testID="onboarding-step-city">
          <TextWithHighlight
            variant="display"
            text={t('onboarding.city.title')}
            highlight={t('onboarding.city.highlight')}
          />
          <Text>{t('onboarding.city.intro')}</Text>
          <View style={styles.options}>
            <Chip
              label={t('onboarding.city.pilot')}
              icon={MapPin}
              selected={!answers.cityNotCovered}
              onPress={() =>
                void updateAnswers({ citySlug: PILOT_CITY_SLUG, cityNotCovered: false })
              }
              testID="onboarding-city-pilot"
            />
            <Chip
              label={t('onboarding.city.notCovered')}
              selected={answers.cityNotCovered}
              onPress={() => void updateAnswers({ citySlug: null, cityNotCovered: true })}
              testID="onboarding-city-not-covered"
            />
          </View>
          {answers.cityNotCovered ? <Text>{t('onboarding.city.notCoveredNote')}</Text> : null}
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.step} testID="onboarding-step-domains">
          <TextWithHighlight
            variant="display"
            text={t('onboarding.domains.title')}
            highlight={t('onboarding.domains.highlight')}
          />
          <Text>{t('onboarding.domains.intro')}</Text>
          <View style={styles.options}>
            {DOMAINS.map((domain) => (
              <Chip
                key={domain}
                label={t(`onboarding.domains.options.${domain}`)}
                selected={answers.interests.includes(domain)}
                onPress={() =>
                  void updateAnswers({ interests: toggleInterest(answers.interests, domain) })
                }
                testID={`onboarding-domain-${domain}`}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.step} testID="onboarding-step-constraint">
          <TextWithHighlight
            variant="display"
            text={t('onboarding.constraint.title')}
            highlight={t('onboarding.constraint.highlight')}
          />
          <Text>{t('onboarding.constraint.intro')}</Text>
          <View style={styles.options}>
            {MAIN_CONSTRAINTS.map((value) => (
              <Chip
                key={value}
                label={t(`onboarding.constraint.${value}`)}
                selected={answers.mainConstraint === value}
                onPress={() =>
                  void updateAnswers({
                    mainConstraint: answers.mainConstraint === value ? null : value,
                  })
                }
                testID={`onboarding-constraint-${value}`}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Button
          label={step < TOTAL_STEPS - 1 ? t('onboarding.next') : t('onboarding.finish')}
          fullWidth
          onPress={next}
          testID="onboarding-next"
        />
        {step > 0 ? (
          <Button
            variant="tertiary"
            label={t('onboarding.back')}
            onPress={() => setStep(step - 1)}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  step: { gap: spacing.md },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  footer: { gap: spacing.xs, marginTop: spacing.lg },
});
