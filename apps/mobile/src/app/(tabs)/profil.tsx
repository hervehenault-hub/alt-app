import { Card, Screen, SignInPrompt, Text } from '@/components';
import { t } from '@/i18n';
import { useIsSignedIn } from '@/lib/auth/useIsSignedIn';

/** Onglet Profil : informations générales publiques, contenu personnel réservé aux connectés. */
export default function ProfileScreen() {
  const signedIn = useIsSignedIn();
  return (
    <Screen testID="screen-profile">
      <Text variant="display">{t('navigation.profile.title')}</Text>
      <Text>{t('navigation.profile.intro')}</Text>
      {signedIn ? null : <SignInPrompt testID="sign-in-prompt" />}
      <Card tone="sky">
        <Text variant="title">{t('navigation.profile.aboutTitle')}</Text>
        <Text>{t('navigation.profile.aboutBody')}</Text>
      </Card>
    </Screen>
  );
}
