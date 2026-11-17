import { nextAction, nextDueDate, type Action, type JourneyRhythm } from '@alt/shared';
import { useRouter } from 'expo-router';
import MapPin from 'lucide-react-native/icons/map-pin';
import PartyPopper from 'lucide-react-native/icons/party-popper';
import Sprout from 'lucide-react-native/icons/sprout';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  Icon,
  Screen,
  SegmentedControl,
  SignInPrompt,
  Skeleton,
  Text,
  TextWithHighlight,
} from '@/components';
import { ACTIONS } from '@/features/journey/content';
import { chooseRhythm, recordAnswer, useJourneyProgress } from '@/features/journey/progress';
import { formatEuros, formatVerifiedDate } from '@/features/places/format';
import { setCategories, setQuery } from '@/features/places/searchState';
import { t } from '@/i18n';
import { useSession } from '@/lib/auth/session';
import { useOnboarding } from '@/lib/onboarding';
import { spacing } from '@/theme';

const RHYTHMS: readonly JourneyRhythm[] = ['weekly', 'twice_weekly', 'self_paced'];

/** Onglet Parcours (T6.5 à T6.7) : une idée à la fois, trois réponses, au rythme choisi. */
export default function JourneyScreen() {
  const router = useRouter();
  const { status } = useSession();
  const progress = useJourneyProgress();
  const { state: onboarding } = useOnboarding();
  const [justDone, setJustDone] = useState<Action | null>(null);

  if (status !== 'signedIn') {
    return (
      <Screen testID="screen-journey">
        <Text variant="display">{t('navigation.journey.title')}</Text>
        <Text>{t('navigation.journey.intro')}</Text>
        <SignInPrompt testID="sign-in-prompt" />
      </Screen>
    );
  }

  const now = new Date();
  const action = nextAction({
    actions: ACTIONS,
    history: progress.events,
    profile: {
      domains: onboarding.answers.interests,
      mainConstraint: onboarding.answers.mainConstraint,
    },
    now,
  });
  const lastDone = [...progress.events].reverse().find((e) => e.status === 'fait');
  const due = nextDueDate(progress.rhythm, lastDone?.at ?? null);

  const findNearby = (a: Action) => {
    if (!a.linked_category) return;
    setQuery('');
    setCategories([a.linked_category]);
    router.push('/search');
  };

  return (
    <Screen testID="screen-journey">
      <TextWithHighlight
        variant="display"
        text={t('journey.title')}
        highlight={t('journey.titleHighlight')}
      />
      <Text>{t('journey.intro')}</Text>

      <SegmentedControl<JourneyRhythm>
        label={t('journey.rhythmLabel')}
        options={RHYTHMS.map((r) => ({ value: r, label: t(`journey.rhythm.${r}`) }))}
        value={progress.rhythm}
        onChange={(r) => void chooseRhythm(r)}
        testID="journey-rhythm"
      />
      <Text variant="caption" testID="journey-next-date">
        {due && due.getTime() > now.getTime()
          ? t('journey.nextOn', { date: formatVerifiedDate(due.toISOString()) })
          : t('journey.nextAnytime')}
      </Text>

      {!progress.loaded ? (
        <Skeleton height={220} radius={28} label={t('ui.loading')} />
      ) : justDone ? (
        <Card tone="saffron" organic testID="journey-bravo">
          <Icon icon={PartyPopper} size={32} />
          <Text variant="title" accessibilityRole="alert">
            {t('journey.bravoTitle')}
          </Text>
          <Text>
            {justDone.saving_eur_per_occurrence > 0
              ? t('journey.bravoSaving', {
                  amount: formatEuros(justDone.saving_eur_per_occurrence),
                })
              : t('journey.bravoNoSaving')}
          </Text>
          <View style={styles.buttons}>
            {justDone.kind === 'habitude' ? (
              <Button
                variant="secondary"
                label={t('journey.redo')}
                accessibilityHint={t('journey.redoHint')}
                onPress={() => void recordAnswer(justDone.id, 'fait')}
                testID="journey-redo"
              />
            ) : null}
            <Button
              label={t('journey.next')}
              onPress={() => setJustDone(null)}
              testID="journey-next"
            />
          </View>
        </Card>
      ) : action ? (
        <Card tone="white" organic testID="journey-action">
          <Text variant="caption">{t('journey.cardEyebrow')}</Text>
          <Text variant="title" testID="journey-action-title">
            {action.title}
          </Text>
          <Text>{action.body}</Text>
          <View style={styles.meta}>
            <Text variant="caption">{t(`journey.effort.${action.effort}`)}</Text>
            <Text variant="caption">{t(`journey.kind.${action.kind}`)}</Text>
            {action.saving_eur_per_occurrence > 0 ? (
              <Text variant="caption">
                {t('journey.saving', { amount: formatEuros(action.saving_eur_per_occurrence) })}
              </Text>
            ) : null}
          </View>
          <View style={styles.buttons}>
            <Button
              label={t('journey.done')}
              accessibilityHint={t('journey.doneHint')}
              onPress={() => {
                setJustDone(action);
                void recordAnswer(action.id, 'fait');
              }}
              testID="journey-done"
            />
            <Button
              variant="secondary"
              label={t('journey.later')}
              accessibilityHint={t('journey.laterHint')}
              onPress={() => void recordAnswer(action.id, 'plus_tard')}
              testID="journey-later"
            />
            <Button
              variant="tertiary"
              label={t('journey.notForMe')}
              accessibilityHint={t('journey.notForMeHint')}
              onPress={() => void recordAnswer(action.id, 'pas_pour_moi')}
              testID="journey-not-for-me"
            />
          </View>
          {action.linked_category ? (
            <Button
              variant="tertiary"
              label={t('journey.findNearby')}
              accessibilityHint={t('journey.findNearbyHint')}
              icon={<Icon icon={MapPin} size={18} />}
              onPress={() => findNearby(action)}
              testID="journey-find-nearby"
            />
          ) : null}
        </Card>
      ) : (
        <EmptyState
          icon={Sprout}
          title={t('journey.allDoneTitle')}
          message={t('journey.allDoneMessage')}
          testID="journey-all-done"
        />
      )}

      <Button
        variant="tertiary"
        label={t('journey.history')}
        accessibilityHint={t('journey.historyHint')}
        onPress={() => router.push('/historique')}
        testID="journey-history"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
