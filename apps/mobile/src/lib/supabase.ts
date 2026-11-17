import type { Database } from '@alt/shared';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { getPublicEnv, isDemoMode } from '@/config/env';

import { getStorage, type KeyValueStorage } from './storage';

export type AltSupabaseClient = SupabaseClient<Database>;

/** Clé de stockage de la session (fixe : ne dépend pas de l'URL du projet). */
export const AUTH_STORAGE_KEY = 'alt.auth.session';

/** Crée un client Supabase dont la session est conservée dans `storage`. */
export function createSupabaseClient(
  url: string,
  anonKey: string,
  storage: KeyValueStorage,
): AltSupabaseClient {
  return createClient<Database>(url, anonKey, {
    auth: {
      storage,
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

let client: AltSupabaseClient | null | undefined;

/**
 * Client Supabase de l'app (T3.1), ou `null` en mode démo (aucun serveur).
 * La session est stockée dans expo-secure-store (localStorage sur le web).
 */
export function getSupabase(): AltSupabaseClient | null {
  if (client !== undefined) return client;
  if (isDemoMode()) {
    client = null;
    return client;
  }
  const env = getPublicEnv();
  client = createSupabaseClient(env.supabaseUrl, env.supabaseAnonKey, getStorage());
  if (Platform.OS !== 'web') {
    // Rafraîchit le jeton seulement quand l'app est au premier plan (recommandation Supabase).
    AppState.addEventListener('change', (state) => {
      if (state === 'active') void client?.auth.startAutoRefresh();
      else void client?.auth.stopAutoRefresh();
    });
  }
  return client;
}

/** Remplace le client (tests). */
export function setSupabaseForTests(value: AltSupabaseClient | null | undefined): void {
  client = value;
}
