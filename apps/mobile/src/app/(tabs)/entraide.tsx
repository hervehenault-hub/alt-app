import { HELP_SERVICES, isHelpPostVisible, type HelpService } from '@alt/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import HandHeart from 'lucide-react-native/icons/hand-heart';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, EmptyState, Screen, SignInPrompt, Text } from '@/components';
import { getMutualAidRepository, type HelpPost } from '@/features/mutual-aid/repository';
import { formatVerifiedDate } from '@/features/places/format';
import { t } from '@/i18n';
import { useSession } from '@/lib/auth/session';
import { spacing } from '@/theme';

const RULES = ['respect', 'privacy', 'free', 'safety'] as const;

/** Onglet Entraide (T8.2 à T8.6) : règles, fil local filtrable, mes annonces, signaler, bloquer. */
export default function MutualAidScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user } = useSession();
  const [service, setService] = useState<HelpService | null>(null);
  const [neighborhood, setNeighborhood] = useState<string | null>(null);
  const [notice, setNotice] = useState<Record<string, string>>({});
  const enabled = status === 'signedIn';

  const rules = useQuery({
    queryKey: ['mutualAid', 'rules', user?.id],
    enabled,
    queryFn: () => getMutualAidRepository().hasAcceptedRules(),
  });
  const posts = useQuery({
    queryKey: ['mutualAid', 'posts', user?.id],
    enabled,
    queryFn: () => getMutualAidRepository().listPosts(),
  });
  const neighborhoods = useQuery({
    queryKey: ['mutualAid', 'neighborhoods', user?.id],
    enabled,
    queryFn: () => getMutualAidRepository().neighborhoods(),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['mutualAid'] });

  if (!enabled) {
    return (
      <Screen testID="screen-mutual-aid">
        <Text variant="display">{t('navigation.mutualAid.title')}</Text>
        <Text>{t('navigation.mutualAid.intro')}</Text>
        <SignInPrompt testID="sign-in-prompt" />
      </Screen>
    );
  }

  const now = new Date();
  const nameOf = (id: string) => neighborhoods.data?.find((n) => n.id === id)?.name ?? '';
  const all = posts.data ?? [];
  const mine = all.filter((p) => p.authorId === user?.id);
  const feed = all.filter(
    (p) =>
      p.authorId !== user?.id &&
      isHelpPostVisible(p, now) &&
      (!service || p.service === service) &&
      (!neighborhood || p.neighborhoodId === neighborhood),
  );

  const postCard = (p: HelpPost, own: boolean) => (
    <Card key={p.id} tone={p.type === 'offer' ? 'white' : 'sky'} testID={`help-post-${p.id}`}>
      <Text variant="eyebrow">
        {t('mutualAid.postMeta', {
          type: t(`mutualAid.types.${p.type}`),
          service: t(`mutualAid.services.${p.service}`),
          neighborhood: nameOf(p.neighborhoodId),
        })}
      </Text>
      <Text variant="label">{p.title}</Text>
      <Text>{p.description}</Text>
      <Text variant="note">
        {p.status === 'open'
          ? t('mutualAid.expires', { date: formatVerifiedDate(p.expiresAt) })
          : t('mutualAid.closed')}
      </Text>
      {notice[p.id] ? (
        <Text accessibilityRole="alert" testID={`help-notice-${p.id}`}>
          {notice[p.id]}
        </Text>
      ) : null}
      <View style={styles.row}>
        {own ? (
          p.status === 'open' ? (
            <Button
              variant="secondary"
              label={t('mutualAid.close')}
              accessibilityHint={t('mutualAid.closeHint')}
              onPress={async () => {
                await getMutualAidRepository().closePost(p.id);
                await refresh();
              }}
              testID={`help-close-${p.id}`}
            />
          ) : null
        ) : (
          <>
            <Button
              variant="secondary"
              label={t('mutualAid.contact')}
              onPress={() => setNotice((n) => ({ ...n, [p.id]: t('mutualAid.contactSoon') }))}
              testID={`help-contact-${p.id}`}
            />
            <Button
              variant="tertiary"
              label={t('mutualAid.report')}
              accessibilityHint={t('mutualAid.reportHint')}
              onPress={async () => {
                await getMutualAidRepository().reportPost(p.id);
                setNotice((n) => ({ ...n, [p.id]: t('mutualAid.reported') }));
              }}
              testID={`help-report-${p.id}`}
            />
            <Button
              variant="tertiary"
              label={t('mutualAid.block')}
              accessibilityHint={t('mutualAid.blockHint')}
              onPress={async () => {
                await getMutualAidRepository().blockUser(p.authorId);
                await refresh();
              }}
              testID={`help-block-${p.id}`}
            />
          </>
        )}
      </View>
    </Card>
  );

  return (
    <Screen testID="screen-mutual-aid">
      <Text variant="display">{t('mutualAid.title')}</Text>
      <Text>{t('mutualAid.intro')}</Text>

      {rules.data === false ? (
        <Card tone="saffron" testID="mutual-aid-rules">
          <Text variant="title">{t('mutualAid.rules.title')}</Text>
          {RULES.map((r) => (
            <Text key={r}>
              {t('mutualAid.rules.bullet', { text: t(`mutualAid.rules.points.${r}`) })}
            </Text>
          ))}
          <Button
            label={t('mutualAid.rules.accept')}
            accessibilityHint={t('mutualAid.rules.acceptHint')}
            onPress={async () => {
              await getMutualAidRepository().acceptRules();
              await refresh();
            }}
            testID="mutual-aid-accept"
          />
        </Card>
      ) : (
        <Button
          label={t('mutualAid.publish')}
          accessibilityHint={t('mutualAid.publishHint')}
          fullWidth
          onPress={() => router.push('/entraide/publier')}
          testID="mutual-aid-publish"
        />
      )}

      <Text variant="label">{t('mutualAid.filters')}</Text>
      <View style={styles.row}>
        <Chip label={t('mutualAid.all')} selected={!service} onPress={() => setService(null)} />
        {HELP_SERVICES.map((s) => (
          <Chip
            key={s}
            label={t(`mutualAid.services.${s}`)}
            selected={service === s}
            onPress={() => setService(service === s ? null : s)}
            testID={`mutual-aid-filter-${s}`}
          />
        ))}
      </View>
      <Text variant="label">{t('mutualAid.neighborhoodFilter')}</Text>
      <View style={styles.row}>
        <Chip
          label={t('mutualAid.allNeighborhoods')}
          selected={!neighborhood}
          onPress={() => setNeighborhood(null)}
        />
        {(neighborhoods.data ?? []).map((n) => (
          <Chip
            key={n.id}
            label={n.name}
            selected={neighborhood === n.id}
            onPress={() => setNeighborhood(neighborhood === n.id ? null : n.id)}
          />
        ))}
      </View>

      {feed.length === 0 ? (
        <EmptyState icon={HandHeart} title={t('mutualAid.empty')} testID="mutual-aid-empty" />
      ) : (
        <View style={styles.list}>{feed.map((p) => postCard(p, false))}</View>
      )}

      {mine.length > 0 ? (
        <>
          <Text variant="title">{t('mutualAid.mine')}</Text>
          <View style={styles.list}>{mine.map((p) => postCard(p, true))}</View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  list: { gap: spacing.sm },
});
