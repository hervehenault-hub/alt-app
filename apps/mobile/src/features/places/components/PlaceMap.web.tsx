import 'maplibre-gl/dist/maplibre-gl.css';

import type { PlaceSummary } from '@alt/shared';
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { t } from '@/i18n';
import { BORDEAUX_NEIGHBORHOODS } from '@/lib/location';
import { colors, fontFamilies, mapColors, radii, spacing } from '@/theme';

import {
  CATEGORY_COLOR_EXPRESSION,
  CATEGORY_LETTER,
  DEFAULT_ZOOM,
  MAP_STYLE_URL,
  toFeatureCollection,
  type PlaceMapProps,
} from './mapData';
import { OFFLINE_STYLE, onlineTilesReachable } from './offlineMap';

/**
 * Le « worker » de maplibre-gl est servi à côté de l'app (copié par `pnpm demo:build` dans
 * public/maplibre). Son adresse part de l'adresse de base de la page AU DÉMARRAGE, notée par
 * index.html dans `__ALT_BASE__` (l'app change ensuite l'adresse en naviguant). Fonctionne à la
 * racine d'un site, dans un sous-dossier et dans la visionneuse d'artefacts.
 */
export function workerUrl(base: string): string {
  return new URL('maplibre/maplibre-gl-worker.js', base).toString();
}

function configureWorker() {
  if (typeof document === 'undefined') return;
  const base = (window as { __ALT_BASE__?: string }).__ALT_BASE__ ?? document.baseURI;
  setWorkerUrl(workerUrl(base));
}

type Mode = 'loading' | 'online' | 'offline';

/** Marqueur HTML d'un lieu (plan hors ligne : pas de polices distantes pour les lettres). */
function placeMarkerElement(place: PlaceSummary, onOpen: () => void): HTMLElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = CATEGORY_LETTER[place.categoryId];
  el.setAttribute(
    'aria-label',
    t('places.map.marker', {
      name: place.name,
      category: t(`taxonomy.categories.${place.categoryId}`),
    }),
  );
  el.title = place.name;
  Object.assign(el.style, {
    width: '28px',
    height: '28px',
    borderRadius: '14px',
    border: `2px solid ${mapColors.stroke}`,
    background: mapColors[place.categoryId],
    color: mapColors.stroke,
    font: `600 12px ${fontFamilies.medium}, system-ui, sans-serif`,
    cursor: 'pointer',
    padding: '0',
  });
  el.addEventListener('click', (event) => {
    event.stopPropagation();
    onOpen();
  });
  return el;
}

function labelElement(text: string): HTMLElement {
  const el = document.createElement('div');
  el.textContent = text;
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    font: `500 11px ${fontFamilies.medium}, system-ui, sans-serif`,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  });
  return el;
}

/**
 * Carte web (maplibre-gl). En ligne : fonds OpenFreeMap, marqueurs regroupés.
 * Sans accès aux fonds (démo publiée, hors connexion) : plan simplifié embarqué (Garonne,
 * quartiers) avec les mêmes lieux, toujours interactif.
 */
export function PlaceMap({ places, center, userPosition, onOpenPlace }: PlaceMapProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);
  const placeMarkers = useRef<Marker[]>([]);
  const openRef = useRef(onOpenPlace);
  useEffect(() => {
    openRef.current = onOpenPlace;
  }, [onOpenPlace]);
  const data = useMemo(() => toFeatureCollection(places), [places]);
  const [mode, setMode] = useState<Mode>('loading');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void onlineTilesReachable(MAP_STYLE_URL).then(
      (ok) => alive && setMode(ok ? 'online' : 'offline'),
    );
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!container.current || mode === 'loading') return;
    configureWorker();
    const instance = new MapLibreMap({
      container: container.current,
      style: mode === 'online' ? MAP_STYLE_URL : OFFLINE_STYLE,
      center: [center.longitude, center.latitude],
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });
    map.current = instance;
    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    instance.on('load', () => {
      if (mode === 'offline') {
        for (const n of BORDEAUX_NEIGHBORHOODS) {
          new Marker({ element: labelElement(n.name), anchor: 'center' })
            .setLngLat([n.center.longitude, n.center.latitude])
            .addTo(instance);
        }
        setReady(true);
        return;
      }
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
      setReady(true);
    });
    return () => {
      placeMarkers.current.forEach((m) => m.remove());
      placeMarkers.current = [];
      instance.remove();
      map.current = null;
      setReady(false);
    };
    // La carte est créée une fois par mode ; les lieux sont mis à jour ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    if (mode === 'online') {
      (instance.getSource('places') as GeoJSONSource | undefined)?.setData(data);
      return;
    }
    placeMarkers.current.forEach((m) => m.remove());
    placeMarkers.current = places.map((p) =>
      new Marker({ element: placeMarkerElement(p, () => openRef.current(p.id)) })
        .setLngLat([p.longitude, p.latitude])
        .addTo(instance),
    );
  }, [data, places, mode, ready]);

  useEffect(() => {
    if (!map.current || !ready || !userPosition) return;
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
  }, [userPosition, ready]);

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
      <Text variant="note" style={styles.attribution} testID={`map-mode-${mode}`}>
        {mode === 'offline' ? t('places.map.offlineAttribution') : t('places.map.attribution')}
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
