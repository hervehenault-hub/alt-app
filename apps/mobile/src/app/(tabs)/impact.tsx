import { Card, Screen, SignInPrompt, Text } from '@/components';
import { t } from '@/i18n';
import { useIsSignedIn } from '@/lib/auth/useIsSignedIn';

/** Onglet Impact : partie collective publique, partie personnelle réservée aux connectés. */
export default function ImpactScreen() {
  const signedIn = useIsSignedIn();
  return (
    <Screen testID="screen-impact">
      <Text variant="display">{t('navigation.impact.title')}</Text>
      <Text>{t('navigation.impact.intro')}</Text>

      <Card tone="saffron" organic>
        <Text variant="title">{t('navigation.impact.collectiveTitle')}</Text>
        <Text>{t('navigation.impact.collectiveBody')}</Text>
      </Card>

      <Text variant="title">{t('navigation.impact.personalTitle')}</Text>
      {signedIn ? null : <SignInPrompt testID="sign-in-prompt" />}
    </Screen>
  );
}
