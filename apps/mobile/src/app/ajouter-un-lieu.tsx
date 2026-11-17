import { useRouter } from 'expo-router';
import MapPinPlus from 'lucide-react-native/icons/map-pin-plus';

import { Button, EmptyState, Screen } from '@/components';
import { t } from '@/i18n';

/** Contribution : écran d'attente, remplacé par le formulaire du lot 5. */
export default function AddPlaceScreen() {
  const router = useRouter();
  return (
    <Screen testID="screen-add-place">
      <EmptyState
        icon={MapPinPlus}
        title={t('places.addPlace.title')}
        message={t('places.addPlace.body')}
      />
      <Button
        variant="tertiary"
        label={t('places.addPlace.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
    </Screen>
  );
}
