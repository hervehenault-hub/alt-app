import { useRouter } from 'expo-router';
import KeyRound from 'lucide-react-native/icons/key-round';

import { t } from '@/i18n';

import { EmptyState } from './EmptyState';

/**
 * Invitation à se connecter, affichée à la place du contenu personnel.
 * Le bouton ouvre l'écran de connexion.
 */
export function SignInPrompt({ testID }: { testID?: string }) {
  const router = useRouter();
  return (
    <EmptyState
      testID={testID}
      icon={KeyRound}
      title={t('signInPrompt.title')}
      message={t('signInPrompt.message')}
      action={{
        label: t('signInPrompt.action'),
        onPress: () => router.push('/sign-in'),
        accessibilityHint: t('signInPrompt.actionHint'),
      }}
    />
  );
}
