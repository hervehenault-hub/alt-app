import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import HandHeart from 'lucide-react-native/icons/hand-heart';
import { StyleSheet, View } from 'react-native';

import { Button, Card, EmptyState, Screen, Text } from '@/components';
import { getContributionRepository } from '@/features/contribution/repository';
import { formatVerifiedDate } from '@/features/places/format';
import { t } from '@/i18n';
import { useSession } from '@/lib/auth/session';
import { spacing } from '@/theme';

/** « Mes contributions » (T5.13) : lieux proposés et signalements, avec leur statut. */
export default function MyContributionsScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { data = [] } = useQuery({
    queryKey: ['contributions', user?.id],
    enabled: Boolean(user),
    queryFn: () => getContributionRepository().list(),
  });

  return (
    <Screen testID="screen-contributions">
      <Button
        variant="tertiary"
        label={t('contribution.mine.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/profil'))}
      />
      <Text variant="display">{t('contribution.mine.title')}</Text>
      {data.length === 0 ? (
        <EmptyState icon={HandHeart} title={t('contribution.mine.empty')} />
      ) : (
        <View style={styles.list}>
          {data.map((c) => (
            <Card
              key={c.id}
              tone={c.status === 'approved' ? 'saffron' : 'white'}
              testID={`contribution-${c.id}`}
            >
              <Text variant="label">{c.name}</Text>
              <Text variant="caption">
                {t('contribution.mine.line', {
                  kind: t(`contribution.mine.kind.${c.kind}`),
                  status: t(`contribution.mine.status.${c.status}`),
                })}
              </Text>
              <Text variant="caption">{formatVerifiedDate(c.createdAt)}</Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.sm } });
