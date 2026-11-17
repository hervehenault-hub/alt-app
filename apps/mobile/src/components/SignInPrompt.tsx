import KeyRound from 'lucide-react-native/icons/key-round';

import { t } from '@/i18n';

import { EmptyState } from './EmptyState';

/**
 * Invitation à se connecter, affichée à la place du contenu personnel.
 * Le bouton est inactif tant que l'authentification (T3.1) n'existe pas.
 */
export function SignInPrompt({ testID }: { testID?: string }) {
  return (
    <EmptyState
      testID={testID}
      icon={KeyRound}
      title={t('signInPrompt.title')}
      message={t('signInPrompt.message')}
      action={{
        label: t('signInPrompt.action'),
        disabled: true,
        accessibilityHint: t('signInPrompt.actionHint'),
      }}
    />
  );
}
