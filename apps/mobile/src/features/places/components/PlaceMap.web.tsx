import 'maplibre-gl/dist/maplibre-gl.css';

import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';
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

/** Carte web (maplibre-gl) : mêmes marqueurs, regroupement et attribution que sur mobile. */
export function PlaceMap({ places, center, userPosition, onOpenPlace }: PlaceMapProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);
  const openRef = useRef(onOpenPlace);
  useEffect(() => {
    openRef.current = onOpenPlace;
  }, [onOpenPlace]);
  const data = useMemo(() => toFeatureCollection(places), [places]);

  useEffect(() => {
    if (!container.current) return;
    const instance = new MapLibreMap({
      container: container.current,
      style: MAP_STYLE_URL,
      center: [center.longitude, center.latitude],
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });
    map.current = instance;
    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    instance.on('load', () => {
      instance.addSource('places', {
        type: 'geojson',
        data,
        cluster: true,
        clusterRadius: 40,
        clusterMaxZoom: 15,
      });
      instance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'places',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': mapColors.cluster,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 26],
          'circle-stroke-color': mapColors.clusterText,
          'circle-stroke-width': 2,
        },
      });
      instance.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'places',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13 },
        paint: { 'text-color': mapColors.clusterText },
      });
      instance.addLayer({
        id: 'points',
        type: 'circle',
        source: 'places',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': CATEGORY_COLOR_EXPRESSION as never,
          'circle-radius': 12,
          'circle-stroke-color': mapColors.stroke,
          'circle-stroke-width': 2,
        },
      });
      instance.addLayer({
        id: 'points-letter',
        type: 'symbol',
        source: 'places',
        filter: ['!', ['has', 'point_count']],
        layout: { 'text-field': ['get', 'letter'], 'text-size': 12, 'text-allow-overlap': true },
        paint: { 'text-color': mapColors.stroke },
      });
      instance.on('click', 'points', (event: MapLayerMouseEvent) => {
        const id = event.features?.[0]?.properties?.id;
        if (id) openRef.current(String(id));
      });
      instance.on('click', 'clusters', (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== 'Point') return;
        instance.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom: instance.getZoom() + 2,
        });
      });
      for (const layer of ['points', 'clusters']) {
        instance.on('mouseenter', layer, () => (instance.getCanvas().style.cursor = 'pointer'));
        instance.on('mouseleave', layer, () => (instance.getCanvas().style.cursor = ''));
      }
    });
    return () => {
      instance.remove();
      map.current = null;
    };
    // La carte est créée une seule fois ; les données sont mises à jour ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const source = map.current?.getSource('places') as GeoJSONSource | undefined;
    source?.setData(data);
  }, [data]);

  useEffect(() => {
    if (!map.current || !userPosition) return;
    const dot = document.createElement('div');
    Object.assign(dot.style, {
      width: '16px',
      height: '16px',
      borderRadius: '8px',
      background: mapColors.userLocation,
      border: `3px solid ${colors.surface}`,
    });
    const marker = new Marker({ element: dot })
      .setLngLat([userPosition.longitude, userPosition.latitude])
      .addTo(map.current);
    return () => {
      marker.remove();
    };
  }, [userPosition]);

  return (
    <View
      style={styles.container}
      testID="place-map"
      accessibilityLabel={t('places.map.a11yLabel')}
    >
      <div ref={container} style={{ position: 'absolute', inset: 0 }} />
      <View style={styles.overlay} pointerEvents="box-none">
        <Button
          variant="secondary"
          label={t('places.map.recenter')}
          accessibilityHint={t('places.map.recenterHint')}
          onPress={() =>
            map.current?.flyTo({ center: [center.longitude, center.latitude], zoom: DEFAULT_ZOOM })
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
