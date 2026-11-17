import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components';
import { t, type TranslationKey } from '@/i18n';
import { spacing } from '@/theme';

const POINTS: readonly TranslationKey[] = [
  'privacy.points.account',
  'privacy.points.location',
  'privacy.points.analytics',
  'privacy.points.hosting',
  'privacy.points.rights',
];

/** Résumé de la politique de confidentialité, accessible depuis la connexion. */
export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <Screen testID="screen-privacy">
      <Text variant="display">{t('privacy.title')}</Text>
      <Text>{t('privacy.intro')}</Text>
      <Card tone="sky">
        <View style={styles.list}>
          {POINTS.map((key) => (
            <Text key={key}>{t('privacy.bullet', { text: t(key) })}</Text>
          ))}
        </View>
      </Card>
      <Button
        variant="tertiary"
        label={t('privacy.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.sm } });
