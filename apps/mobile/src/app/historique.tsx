import { useRouter } from 'expo-router';
import History from 'lucide-react-native/icons/history';
import { StyleSheet, View } from 'react-native';

import { Button, Card, EmptyState, Screen, Text } from '@/components';
import { getAction } from '@/features/journey/content';
import { useJourneyProgress } from '@/features/journey/progress';
import { formatVerifiedDate } from '@/features/places/format';
import { t } from '@/i18n';
import { spacing } from '@/theme';

/** Historique des actions réalisées (T6.7), avec le nombre d'occurrences des habitudes. */
export default function HistoryScreen() {
  const router = useRouter();
  const { events } = useJourneyProgress();
  const done = new Map<string, { count: number; last: string }>();
  for (const e of events) {
    if (e.status !== 'fait') continue;
    const at = String(e.at);
    const current = done.get(e.actionId);
    done.set(e.actionId, {
      count: (current?.count ?? 0) + 1,
      last: !current || at > current.last ? at : current.last,
    });
  }
  const rows = [...done.entries()].sort((a, b) => b[1].last.localeCompare(a[1].last));

  return (
    <Screen testID="screen-history">
      <Button
        variant="tertiary"
        label={t('journey.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/parcours'))}
      />
      <Text variant="display">{t('journey.historyTitle')}</Text>
      {rows.length === 0 ? (
        <EmptyState icon={History} title={t('journey.historyEmpty')} />
      ) : (
        <View style={styles.list}>
          {rows.map(([id, info]) => (
            <Card key={id} tone="white" testID={`history-${id}`}>
              <Text variant="label">{getAction(id)?.title ?? id}</Text>
              <Text variant="caption">
                {t('journey.historyLine', {
                  count: t('journey.historyCount', { count: info.count }),
                  last: t('journey.historyLast', { date: formatVerifiedDate(info.last) }),
                })}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.sm } });
