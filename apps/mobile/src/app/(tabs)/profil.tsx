import { useRouter } from 'expo-router';

import { Button, Card, Screen, SignInPrompt, Text } from '@/components';
import { t } from '@/i18n';
import { signOut, useSession } from '@/lib/auth/session';

/** Onglet Profil : informations générales publiques, contenu personnel réservé aux connectés. */
export default function ProfileScreen() {
  const { status, user } = useSession();
  const router = useRouter();
  return (
    <Screen testID="screen-profile">
      <Text variant="display">{t('navigation.profile.title')}</Text>
      <Text>{t('navigation.profile.intro')}</Text>
      {status === 'signedIn' && user ? (
        <Card tone="saffron" testID="profile-account">
          <Text variant="label">
            {t('auth.signedInAs', {
              name: user.displayName ?? user.email ?? t('auth.signedInAnonymousName'),
            })}
          </Text>
          <Button
            variant="tertiary"
            label={t('auth.signOut')}
            accessibilityHint={t('auth.signOutHint')}
            onPress={() => void signOut()}
            testID="profile-sign-out"
          />
        </Card>
      ) : null}
      {status === 'signedIn' ? (
        <Button
          variant="secondary"
          label={t('contribution.mine.open')}
          accessibilityHint={t('contribution.mine.openHint')}
          onPress={() => router.push('/mes-contributions')}
          testID="profile-contributions"
        />
      ) : (
        <SignInPrompt testID="sign-in-prompt" />
      )}
      <Card tone="sky">
        <Text variant="title">{t('navigation.profile.aboutTitle')}</Text>
        <Text>{t('navigation.profile.aboutBody')}</Text>
      </Card>
      {__DEV__ ? (
        <Button
          variant="tertiary"
          label={t('devCatalogue.open')}
          accessibilityHint={t('devCatalogue.openHint')}
          onPress={() => router.push('/dev/catalogue')}
        />
      ) : null}
    </Screen>
  );
}
