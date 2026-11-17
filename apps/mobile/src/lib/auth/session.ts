import type { Session } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { getStorage } from '@/lib/storage';
import { createStore, useStore } from '@/lib/store';
import { getSupabase, type AltSupabaseClient } from '@/lib/supabase';

/**
 * Session de l'utilisateur (T3.1). Deux moteurs :
 * - Supabase Auth (session conservée dans expo-secure-store via supabase-js) ;
 * - démo (EXPO_PUBLIC_DEMO=1) : compte fictif conservé dans le stockage local.
 */
export interface AuthUser {
  id: string;
  displayName: string | null;
  email: string | null;
  isDemo: boolean;
}

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

export type IdTokenProvider = 'apple' | 'google';

export const DEMO_SESSION_KEY = 'alt.demo.session';
export const DEMO_USER: AuthUser = {
  id: '00000000-0000-4000-8000-00000000de30',
  displayName: 'Camille',
  email: null,
  isDemo: true,
};

const authStore = createStore<AuthState>({ status: 'loading', user: null });
let initPromise: Promise<void> | undefined;

function userFromSession(session: Session | null): AuthUser | null {
  if (!session) return null;
  const meta = session.user.user_metadata as Record<string, unknown> | undefined;
  const name = meta?.display_name ?? meta?.full_name ?? meta?.name;
  return {
    id: session.user.id,
    displayName: typeof name === 'string' ? name : null,
    email: session.user.email ?? null,
    isDemo: false,
  };
}

function apply(user: AuthUser | null) {
  authStore.set({ status: user ? 'signedIn' : 'signedOut', user });
}

async function initSupabase(client: AltSupabaseClient) {
  const { data } = await client.auth.getSession();
  apply(userFromSession(data.session));
  client.auth.onAuthStateChange((_event, session) => apply(userFromSession(session)));
}

async function initDemo() {
  const raw = await getStorage().getItem(DEMO_SESSION_KEY);
  apply(raw ? DEMO_USER : null);
}

/** Restaure la session enregistrée (une seule fois par lancement). */
export function initAuth(): Promise<void> {
  initPromise ??= (async () => {
    try {
      const client = getSupabase();
      if (client) await initSupabase(client);
      else await initDemo();
    } catch {
      apply(null);
    }
  })();
  return initPromise;
}

/** Échange un jeton d'identité Apple ou Google contre une session Supabase. */
export async function signInWithIdToken(
  provider: IdTokenProvider,
  token: string,
  nonce?: string,
): Promise<AuthUser> {
  const client = getSupabase();
  if (!client) return signInDemo();
  const { data, error } = await client.auth.signInWithIdToken({ provider, token, nonce });
  if (error) throw error;
  const user = userFromSession(data.session);
  if (!user) throw new Error('Session absente après la connexion.');
  apply(user);
  return user;
}

/** Connexion simulée (mode démo uniquement). */
export async function signInDemo(): Promise<AuthUser> {
  await getStorage().setItem(DEMO_SESSION_KEY, JSON.stringify({ id: DEMO_USER.id }));
  apply(DEMO_USER);
  return DEMO_USER;
}

export async function signOut(): Promise<void> {
  const client = getSupabase();
  if (client) await client.auth.signOut();
  await getStorage().removeItem(DEMO_SESSION_KEY);
  apply(null);
}

export function getAuthState(): AuthState {
  return authStore.get();
}

/** Session courante ; déclenche la restauration au premier appel. */
export function useSession(): AuthState {
  const state = useStore(authStore);
  useEffect(() => {
    void initAuth();
  }, []);
  return state;
}

/** Réinitialise l'état (tests : simule un redémarrage de l'app). */
export function resetAuthForTests(): void {
  initPromise = undefined;
  authStore.set({ status: 'loading', user: null });
}

export function setAuthStateForTests(state: AuthState): void {
  initPromise = Promise.resolve();
  authStore.set(state);
}
