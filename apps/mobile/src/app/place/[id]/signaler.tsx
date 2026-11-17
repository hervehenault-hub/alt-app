import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Text, TextField } from '@/components';
import { getContributionRepository, type ReportReason } from '@/features/contribution/repository';
import { usePlace } from '@/features/places/api';
import { t } from '@/i18n';
import { spacing } from '@/theme';

const QUICK: readonly Exclude<ReportReason, 'other'>[] = ['closed', 'wrong_hours', 'wrong_address'];

/** Signalement en deux touches (T5.4) : « Signaler une erreur » puis un motif. */
export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: place } = usePlace(id);
  const [state, setState] = useState<
    'idle' | 'sending' | 'reported' | 'already_reported' | 'error'
  >('idle');
  const [other, setOther] = useState(false);
  const [comment, setComment] = useState('');

  const send = async (reason: ReportReason) => {
    if (!id) return;
    setState('sending');
    try {
      setState(
        await getContributionRepository().report(
          id,
          place?.name ?? '',
          reason,
          comment || undefined,
        ),
      );
    } catch {
      setState('error');
    }
  };
  const back = () => (router.canGoBack() ? router.back() : router.replace(`/place/${id}`));

  if (state === 'reported' || state === 'already_reported') {
    return (
      <Screen testID="screen-report-done">
        <Card tone="sky">
          <Text accessibilityRole="alert" testID="report-result">
            {state === 'reported'
              ? t('contribution.report.thanks')
              : t('contribution.report.already')}
          </Text>
        </Card>
        <Button label={t('contribution.report.back')} onPress={back} />
      </Screen>
    );
  }

  return (
    <Screen testID="screen-report">
      <Text variant="display">{t('contribution.report.title')}</Text>
      <Text>{t('contribution.report.intro', { name: place?.name ?? '' })}</Text>
      <View style={styles.list}>
        {QUICK.map((reason) => (
          <Button
            key={reason}
            variant="secondary"
            fullWidth
            label={t(`contribution.report.reasons.${reason}`)}
            accessibilityHint={t('contribution.report.reasonHint')}
            disabled={state === 'sending'}
            onPress={() => void send(reason)}
            testID={`report-${reason}`}
          />
        ))}
        <Button
          variant="tertiary"
          label={t('contribution.report.reasons.other')}
          onPress={() => setOther(true)}
          testID="report-other"
        />
      </View>
      {other ? (
        <>
          <TextField
            label={t('contribution.report.otherLabel')}
            value={comment}
            onChangeText={setComment}
            maxLength={500}
            multiline
            testID="report-comment"
          />
          <Button
            label={t('contribution.report.send')}
            onPress={() => void send('other')}
            testID="report-send"
          />
        </>
      ) : null}
      {state === 'error' ? (
        <Card tone="coral">
          <Text accessibilityRole="alert">{t('contribution.report.error')}</Text>
        </Card>
      ) : null}
      <Button variant="tertiary" label={t('contribution.report.back')} onPress={back} />
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.sm } });
