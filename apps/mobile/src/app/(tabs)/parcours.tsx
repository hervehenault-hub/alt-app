import { Screen, SignInPrompt, Text } from '@/components';
import { t } from '@/i18n';
import { useIsSignedIn } from '@/lib/auth/useIsSignedIn';

/** Onglet Parcours : réservé aux personnes connectées. */
export default function JourneyScreen() {
  const signedIn = useIsSignedIn();
  return (
    <Screen testID="screen-journey">
      <Text variant="display">{t('navigation.journey.title')}</Text>
      <Text>{t('navigation.journey.intro')}</Text>
      {signedIn ? null : <SignInPrompt testID="sign-in-prompt" />}
    </Screen>
  );
}
