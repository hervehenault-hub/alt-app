import { Screen, SignInPrompt, Text } from '@/components';
import { t } from '@/i18n';
import { useIsSignedIn } from '@/lib/auth/useIsSignedIn';

/** Onglet Entraide : réservé aux personnes connectées. */
export default function MutualAidScreen() {
  const signedIn = useIsSignedIn();
  return (
    <Screen testID="screen-mutual-aid">
      <Text variant="display">{t('navigation.mutualAid.title')}</Text>
      <Text>{t('navigation.mutualAid.intro')}</Text>
      {signedIn ? null : <SignInPrompt testID="sign-in-prompt" />}
    </Screen>
  );
}
