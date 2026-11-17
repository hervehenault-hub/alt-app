import * as Crypto from 'expo-crypto';

import { getAuthState } from '@/lib/auth/session';
import { getStorage } from '@/lib/storage';
import { getSupabase } from '@/lib/supabase';

/**
 * Mesure d'usage (T3.8) : événements pseudonymes écrits dans `analytics_events`
 * (écriture seule côté client). Aucune donnée personnelle dans les propriétés.
 * Les erreurs réseau sont ignorées : la mesure ne doit jamais gêner l'utilisateur.
 */
export type AnalyticsEventName =
  | 'app_opened'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'first_place_viewed'
  | 'place_viewed'
  | 'search_performed';

export type AnalyticsProps = Record<string, string | number | boolean | null>;

export const ANON_ID_KEY = 'alt.analytics.anonId';
export const FIRST_PLACE_KEY = 'alt.analytics.firstPlaceViewed';

let anonId: string | undefined;
let openedAt: number | undefined;
let firstPlaceSent = false;

/** UUID v4 : expo-crypto si disponible, sinon génération locale (identifiant non sensible). */
function newUuid(): string {
  try {
    const id = Crypto.randomUUID();
    if (typeof id === 'string' && id.length === 36) return id;
  } catch {
    // module natif absent
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r % 4) + 8).toString(16);
  });
}

async function getAnonId(): Promise<string> {
  if (anonId) return anonId;
  const storage = getStorage();
  const saved = await storage.getItem(ANON_ID_KEY);
  anonId = saved ?? newUuid();
  if (!saved) await storage.setItem(ANON_ID_KEY, anonId);
  return anonId;
}

export async function track(name: AnalyticsEventName, props: AnalyticsProps = {}): Promise<void> {
  try {
    const client = getSupabase();
    if (!client) return; // mode démo : rien n'est envoyé
    const { user } = getAuthState();
    await client.from('analytics_events').insert({
      anon_id: await getAnonId(),
      user_id: user && !user.isDemo ? user.id : null,
      name,
      props,
    });
  } catch {
    // ignoré volontairement
  }
}

/** À appeler au lancement : mémorise l'heure d'ouverture. */
export function trackAppOpened(now: number = Date.now()): Promise<void> {
  openedAt = now;
  return track('app_opened');
}

/** Première fiche vue depuis l'installation, avec la durée depuis l'ouverture de l'app. */
export async function trackPlaceViewed(placeId: string, now: number = Date.now()): Promise<void> {
  await track('place_viewed', { place_id: placeId });
  if (firstPlaceSent) return;
  const storage = getStorage();
  if (await storage.getItem(FIRST_PLACE_KEY)) {
    firstPlaceSent = true;
    return;
  }
  firstPlaceSent = true;
  await storage.setItem(FIRST_PLACE_KEY, '1');
  const seconds = openedAt === undefined ? null : Math.round((now - openedAt) / 1000);
  await track('first_place_viewed', { place_id: placeId, seconds_since_open: seconds });
}

export function resetAnalyticsForTests(): void {
  anonId = undefined;
  openedAt = undefined;
  firstPlaceSent = false;
}
