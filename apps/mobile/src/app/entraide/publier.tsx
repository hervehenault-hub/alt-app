import {
  detectContactInfo,
  HELP_POST_MAX_LENGTH,
  HELP_SERVICES,
  type HelpPostType,
  type HelpService,
} from '@alt/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Screen, Text, TextField } from '@/components';
import { getMutualAidRepository } from '@/features/mutual-aid/repository';
import { t } from '@/i18n';
import { useSession } from '@/lib/auth/session';
import { spacing } from '@/theme';

/** Publier une offre ou une demande (T8.3), avec avertissement si des coordonnées sont détectées. */
export default function PublishHelpPostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [type, setType] = useState<HelpPostType>('offer');
  const [service, setService] = useState<HelpService>('tool_sharing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const neighborhoods = useQuery({
    queryKey: ['mutualAid', 'neighborhoods', user?.id],
    enabled: Boolean(user),
    queryFn: () => getMutualAidRepository().neighborhoods(),
  });

  const warnings = detectContactInfo(`${title}\n${description}`);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/entraide'));

  const submit = async () => {
    const next = {
      title: title.trim() ? undefined : t('mutualAid.form.errorTitle'),
      description: description.trim() ? undefined : t('mutualAid.form.errorDescription'),
      neighborhood: neighborhoodId ? undefined : t('mutualAid.form.errorNeighborhood'),
    };
    setErrors(next);
    if (next.title || next.description || !neighborhoodId) return;
    setBusy(true);
    setFailed(false);
    try {
      await getMutualAidRepository().createPost({
        type,
        service,
        title,
        description,
        neighborhoodId,
      });
      await queryClient.invalidateQueries({ queryKey: ['mutualAid'] });
      close();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen testID="screen-publish-help">
      <Text variant="display">{t('mutualAid.form.title')}</Text>
      <Text variant="label">{t('mutualAid.form.type')}</Text>
      <View style={styles.row}>
        {(['offer', 'request'] as const).map((v) => (
          <Chip
            key={v}
            label={t(`mutualAid.types.${v}`)}
            selected={type === v}
            onPress={() => setType(v)}
            testID={`publish-type-${v}`}
          />
        ))}
      </View>
      <Text variant="label">{t('mutualAid.form.service')}</Text>
      <View style={styles.row}>
        {HELP_SERVICES.map((s) => (
          <Chip
            key={s}
            label={t(`mutualAid.services.${s}`)}
            selected={service === s}
            onPress={() => setService(s)}
            testID={`publish-service-${s}`}
          />
        ))}
      </View>
      <TextField
        label={t('mutualAid.form.titleLabel')}
        placeholder={t('mutualAid.form.titlePlaceholder')}
        value={title}
        onChangeText={setTitle}
        maxLength={80}
        error={errors.title}
        testID="publish-title"
      />
      <TextField
        label={t('mutualAid.form.description')}
        helper={t('mutualAid.form.descriptionHelper', { count: description.length })}
        value={description}
        onChangeText={setDescription}
        maxLength={HELP_POST_MAX_LENGTH}
        multiline
        error={errors.description}
        testID="publish-description"
      />
      {warnings.length > 0 ? (
        <Card tone="saffron" testID="publish-warning">
          <Text accessibilityRole="alert">
            {t('mutualAid.form.warning', {
              what: warnings
                .map((w) => t(`mutualAid.form.warningWhat.${w}`))
                .join(t('mutualAid.form.warningJoin')),
            })}
          </Text>
        </Card>
      ) : null}
      <Text variant="label">{t('mutualAid.form.neighborhood')}</Text>
      <View style={styles.row}>
        {(neighborhoods.data ?? []).map((n) => (
          <Chip
            key={n.id}
            label={n.name}
            selected={neighborhoodId === n.id}
            onPress={() => setNeighborhoodId(n.id)}
            testID={`publish-neighborhood-${n.id}`}
          />
        ))}
      </View>
      {errors.neighborhood ? <Text accessibilityRole="alert">{errors.neighborhood}</Text> : null}
      <Text variant="note">{t('mutualAid.form.expiry')}</Text>
      {failed ? (
        <Card tone="coral">
          <Text accessibilityRole="alert">{t('mutualAid.form.errorGeneric')}</Text>
        </Card>
      ) : null}
      <Button
        label={t('mutualAid.form.submit')}
        fullWidth
        loading={busy}
        onPress={() => void submit()}
        testID="publish-submit"
      />
      <Button variant="tertiary" label={t('mutualAid.form.cancel')} onPress={close} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
