import { useRouter } from 'expo-router';
import LocateFixed from 'lucide-react-native/icons/locate-fixed';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Icon, Screen, Text, TextWithHighlight } from '@/components';
import { t } from '@/i18n';
import {
  BORDEAUX_NEIGHBORHOODS,
  chooseNeighborhood,
  dismissLocationRequest,
  requestLocation,
  useLocation,
} from '@/lib/location';
import { spacing } from '@/theme';

/**
 * Écran explicatif AVANT la demande système (T3.6). La position approximative suffit ;
 * en cas de refus, on peut choisir un quartier (sinon : centre-ville).
 */
export default function LocationScreen() {
  const router = useRouter();
  const location = useLocation();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const allow = async () => {
    const resolved = await requestLocation();
    if (resolved.source === 'device' || resolved.source === 'device_approximate') close();
  };

  return (
    <Screen testID="screen-location">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Icon icon={LocateFixed} size={36} />
      </View>
      <TextWithHighlight
        variant="display"
        text={t('location.title')}
        highlight={t('location.highlight')}
      />
      <Text>{t('location.intro')}</Text>

      <Button
        label={t('location.allow')}
        accessibilityHint={t('location.allowHint')}
        fullWidth
        onPress={() => void allow()}
        testID="location-allow"
      />

      {location.permission === 'denied' ? (
        <Card tone="saffron" testID="location-denied">
          <Text>{t('location.denied')}</Text>
        </Card>
      ) : null}

      <Text variant="title">{t('location.chooseNeighborhood')}</Text>
      <View style={styles.chips}>
        {BORDEAUX_NEIGHBORHOODS.map((n) => (
          <Chip
            key={n.id}
            label={n.name}
            selected={location.neighborhood?.id === n.id}
            accessibilityHint={t('location.neighborhoodHint')}
            onPress={() => {
              chooseNeighborhood(n);
              close();
            }}
            testID={`location-neighborhood-${n.id}`}
          />
        ))}
      </View>

      <Button
        variant="tertiary"
        label={t('location.later')}
        accessibilityHint={t('location.laterHint')}
        onPress={() => {
          dismissLocationRequest();
          close();
        }}
        testID="location-later"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
