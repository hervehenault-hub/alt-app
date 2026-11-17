import {
  INITIAL_ONBOARDING_STATE,
  needsProfileSync,
  onboardingToProfilePatch,
  parseOnboardingState,
  type OnboardingAnswers,
  type OnboardingState,
} from '@alt/shared';
import { useEffect } from 'react';

import { getStorage } from '@/lib/storage';
import { createStore, useStore } from '@/lib/store';
import type { AltSupabaseClient } from '@/lib/supabase';

/** Onboarding (T3.5) : réponses gardées localement, copiées dans le profil à la connexion. */
export const ONBOARDING_KEY = 'alt.onboarding';

interface OnboardingStoreState {
  loaded: boolean;
  state: OnboardingState;
}

const store = createStore<OnboardingStoreState>({
  loaded: false,
  state: INITIAL_ONBOARDING_STATE,
});
let loadPromise: Promise<void> | undefined;

export function loadOnboarding(): Promise<void> {
  loadPromise ??= (async () => {
    let raw: string | null = null;
    try {
      raw = await getStorage().getItem(ONBOARDING_KEY);
    } catch {
      raw = null;
    }
    store.set({ loaded: true, state: parseOnboardingState(raw) });
  })();
  return loadPromise;
}

async function save(next: OnboardingState): Promise<void> {
  store.set({ loaded: true, state: next });
  try {
    await getStorage().setItem(ONBOARDING_KEY, JSON.stringify(next));
  } catch {
    // le stockage peut échouer (navigation privée) : l'état reste en mémoire
  }
}

export function getOnboardingState(): OnboardingState {
  return store.get().state;
}

export function updateAnswers(patch: Partial<OnboardingAnswers>): Promise<void> {
  const current = getOnboardingState();
  return save({ ...current, answers: { ...current.answers, ...patch } });
}

export function finishOnboarding(status: 'completed' | 'skipped'): Promise<void> {
  return save({ ...getOnboardingState(), status });
}

export function useOnboarding(): OnboardingStoreState {
  const value = useStore(store);
  useEffect(() => {
    void loadOnboarding();
  }, []);
  return value;
}

/**
 * Copie les réponses dans le profil du compte connecté (une fois par compte).
 * Renvoie `true` si le profil a été mis à jour.
 */
export async function syncOnboardingToProfile(
  client: AltSupabaseClient,
  userId: string,
): Promise<boolean> {
  await loadOnboarding();
  const state = getOnboardingState();
  if (!needsProfileSync(state, userId)) return false;
  let cityId: string | null = null;
  if (state.answers.citySlug && !state.answers.cityNotCovered) {
    const { data } = await client
      .from('cities')
      .select('id')
      .eq('slug', state.answers.citySlug)
      .maybeSingle();
    cityId = data?.id ?? null;
  }
  const patch = onboardingToProfilePatch(state.answers, cityId);
  if (Object.keys(patch).length > 0) {
    const { error } = await client.from('profiles').update(patch).eq('id', userId);
    if (error) return false;
  }
  await save({ ...getOnboardingState(), syncedUserId: userId });
  return true;
}

/** Réinitialise (tests). `initial` permet de partir d'un onboarding déjà passé. */
export function resetOnboardingForTests(initial?: OnboardingState): void {
  if (initial) {
    loadPromise = Promise.resolve();
    store.set({ loaded: true, state: initial });
  } else {
    loadPromise = undefined;
    store.set({ loaded: false, state: INITIAL_ONBOARDING_STATE });
  }
}
