import { Redirect, useRouter } from 'expo-router';
import MapPinOff from 'lucide-react-native/icons/map-pin-off';
import { Platform } from 'react-native';

import { Button, EmptyState, Screen } from '@/components';
import { isDemoMode } from '@/config/env';
import { t } from '@/i18n';

/**
 * Adresse inconnue. Sur le web en mode démo, la page peut être servie depuis un chemin
 * quelconque (hébergement, visionneuse) : on revient simplement à l'accueil.
 */
export default function NotFoundScreen() {
  const router = useRouter();
  if (Platform.OS === 'web' && isDemoMode()) return <Redirect href="/" />;
  return (
    <Screen testID="screen-not-found">
      <EmptyState
        icon={MapPinOff}
        title={t('common.notFoundTitle')}
        message={t('common.notFoundMessage')}
      />
      <Button label={t('common.goHome')} onPress={() => router.replace('/')} />
    </Screen>
  );
}
