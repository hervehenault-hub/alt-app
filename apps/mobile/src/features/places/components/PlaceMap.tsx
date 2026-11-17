import { Camera, GeoJSONSource, Layer, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { t } from '@/i18n';
import { colors, mapColors, radii, spacing } from '@/theme';

import {
  CATEGORY_COLOR_EXPRESSION,
  DEFAULT_ZOOM,
  MAP_STYLE_URL,
  toFeatureCollection,
  type PlaceMapProps,
} from './mapData';

/**
 * Carte MapLibre (T4.7) : tuiles OpenFreeMap, marqueurs par catégorie (couleur + lettre),
 * regroupement des marqueurs proches, recentrage, attribution OSM visible.
 * Nécessite un build de développement (module natif), pas Expo Go.
 */
export function PlaceMap({ places, center, onOpenPlace }: PlaceMapProps) {
  const camera = useRef<CameraRef>(null);
  const data = toFeatureCollection(places);
  return (
    <View style={styles.container} testID="place-map">
      <Map
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        attribution={false}
        logo={false}
        accessibilityLabel={t('places.map.a11yLabel')}
        onPress={(event) => {
          const native = event.nativeEvent as { features?: GeoJSON.Feature[] };
          const feature = native.features?.find((f) => f.properties?.id);
          if (feature?.properties?.id) onOpenPlace(String(feature.properties.id));
        }}
      >
        <Camera
          ref={camera}
          initialViewState={{ center: [center.longitude, center.latitude], zoom: DEFAULT_ZOOM }}
        />
        <GeoJSONSource id="places" data={data} cluster clusterRadius={40} clusterMaxZoom={15}>
          <Layer
            id="clusters"
            type="circle"
            source="places"
            filter={['has', 'point_count']}
            style={{
              circleColor: mapColors.cluster,
              circleRadius: [
                'step',
                ['get', 'point_count'],
                16,
                10,
                20,
                50,
                26,
              ] as unknown as number,
              circleStrokeColor: mapColors.clusterText,
              circleStrokeWidth: 2,
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            source="places"
            filter={['has', 'point_count']}
            style={{
              textField: ['get', 'point_count_abbreviated'] as unknown as string,
              textSize: 13,
              textColor: mapColors.clusterText,
            }}
          />
          <Layer
            id="points"
            type="circle"
            source="places"
            filter={['!', ['has', 'point_count']]}
            style={{
              circleColor: CATEGORY_COLOR_EXPRESSION,
              circleRadius: 12,
              circleStrokeColor: mapColors.stroke,
              circleStrokeWidth: 2,
            }}
          />
          <Layer
            id="points-letter"
            type="symbol"
            source="places"
            filter={['!', ['has', 'point_count']]}
            style={{
              textField: ['get', 'letter'] as unknown as string,
              textSize: 12,
              textColor: mapColors.stroke,
              textAllowOverlap: true,
            }}
          />
        </GeoJSONSource>
      </Map>
      <View style={styles.overlay} pointerEvents="box-none">
        <Button
          variant="secondary"
          label={t('places.map.recenter')}
          accessibilityHint={t('places.map.recenterHint')}
          onPress={() =>
            camera.current?.flyTo({
              center: [center.longitude, center.latitude],
              zoom: DEFAULT_ZOOM,
            })
          }
          testID="map-recenter"
        />
      </View>
      <Text variant="caption" style={styles.attribution}>
        {t('places.map.attribution')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 360, borderRadius: radii.lg, overflow: 'hidden' },
  map: { flex: 1 },
  overlay: { position: 'absolute', right: spacing.sm, bottom: spacing.xl },
  attribution: {
    position: 'absolute',
    left: spacing.xs,
    bottom: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xxs,
    borderRadius: radii.sm,
  },
});
